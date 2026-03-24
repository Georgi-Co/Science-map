

// script.js — стабильная загрузка статей для Strapi v5
let allArticles = [];
let currentPage = 1;
let articleSearch = null; // поиск, если подключён search.js

// ===============================
// 🔥 FETCH С RETRY + CACHE + LOADER
// ===============================
async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`Попытка ${i + 1} не удалась:`, err);
      if (i < retries - 1) await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Не удалось получить данные после нескольких попыток');
}

function showLoader() {
  const grid = document.querySelector('.articles-grid');
  if (grid) grid.innerHTML = '<p>Загрузка данных...</p>';
}

function showError(message = 'Ошибка загрузки данных') {
  const grid = document.querySelector('.articles-grid');
  if (grid) grid.innerHTML = `<p>${message}</p>`;
}

// ===============================
// 📦 PAGINATION / GRID
// ===============================
function getGridColumnsCount() {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return 1;
  const style = getComputedStyle(grid);
  const template = style.gridTemplateColumns;
  if (template && template !== 'none') return template.trim().split(/\s+/).length;
  return 1;
}

function getGridRowsCount() {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return 2;
  const style = getComputedStyle(grid);
  const template = style.gridTemplateRows;
  if (template && template !== 'none') return template.trim().split(/\s+/).length;
  return 2;
}

function getArticlesPerPage() {
  return getGridColumnsCount() * getGridRowsCount();
}

// ===============================
// 🎨 РЕНДЕР КАРТОЧЕК
// ===============================
function renderPage(page = 1) {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return;

  currentPage = page;
  const articlesPerPage = getArticlesPerPage();
  const start = (page - 1) * articlesPerPage;
  const end = start + articlesPerPage;
  const articlesToShow = Array.isArray(allArticles) ? allArticles.slice(start, end) : [];

  grid.innerHTML = '';

  if (!articlesToShow.length) {
    grid.innerHTML = '<p>Нет опубликованных статей.</p>';
    return;
  }

  articlesToShow.forEach(article => {
    const title = article.Title || 'Без заголовка';
    const description = article.Description || 'Описание отсутствует';
    const faculty = article.Faculty || 'Не указан';
    const scienceArea = article.ScienceArea || 'Научная область не указана';
    const scienceDirection = article.ScienceDirection || 'Направление не указано';
    const publication = article.Publication
      ? new Date(article.Publication).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' })
      : 'Дата не указана';

    const authorsHTML = (Array.isArray(article.authors) && article.authors.length)
      ? article.authors.map(a => `<span class="author-chip">${a.Name || 'Автор'}</span>`).join(' ')
      : '<span class="author-chip">Автор не указан</span>';

    const tagsHTML = (Array.isArray(article.tags) && article.tags.length)
      ? article.tags.map(t => `<span class="tag-chip">${t.Name || t.name}</span>`).join(' ')
      : '';

    const card = document.createElement('div');
    card.className = 'article-card';
    card.innerHTML = `
      <div class="article-card-body">
        <h3 class="article-title">${title}</h3>
        <p class="article-description"><strong>Описание:</strong> ${description}</p>
        <p class="article-faculty"><strong>Факультет:</strong> ${faculty}</p>
        <p class="article-area"><strong>Область:</strong> ${scienceArea}</p>
        <p class="article-direction"><strong>Направление:</strong> ${scienceDirection}</p>
        <p class="article-date"><strong>Дата публикации:</strong> ${publication}</p>
        <div class="article-authors"><strong>Авторы:</strong> ${authorsHTML}</div>
        ${tagsHTML ? `<div class="article-tags"><strong>Теги:</strong> ${tagsHTML}</div>` : ''}
      </div>
    `;
    card.addEventListener('click', e => {
      if (e.target.closest('a')) return;
      window.location.href = `full-article.html?id=${article.id}`;
    });

    grid.appendChild(card);
  });
}

// ===============================
// 🔍 ЗАГРУЗКА СТАТЕЙ
// ===============================
document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return;

  const cacheKey = 'articles_cache';
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    allArticles = JSON.parse(cached);
    renderPage(1);
    return;
  }

  try {
    showLoader();
    const url = new URL('https://special-bear-65dd39b4fc.strapiapp.com/api/articles');
    url.searchParams.set('pagination[pageSize]', '100');
    url.searchParams.set('sort', 'Publication:desc');
    url.searchParams.set('publicationState', 'published');
    url.searchParams.append('populate', 'authors');
    url.searchParams.append('populate', 'tags');

    const data = await fetchWithRetry(url);
    if (!data || !Array.isArray(data.data)) throw new Error('API вернул неверный формат');

    allArticles = data.data.map(item => {
      const attrs = item;
      return {
        id: attrs.id,
        Title: attrs.Title || attrs.title || '',
        Description: attrs.Description || attrs.description || '',
        Publication: attrs.Publication || attrs.publication || attrs.publishedAt || null,
        Faculty: attrs.Faculty || '',
        ScienceArea: attrs.ScienceArea || '',
        ScienceDirection: attrs.ScienceDirection || '',
        authors: Array.isArray(attrs.authors) ? attrs.authors.map(a => ({ Name: a.Name || a.name })) : [],
        tags: Array.isArray(attrs.tags) ? attrs.tags.map(t => ({ Name: t.Name || t.name })) : []
      };
    });

    localStorage.setItem(cacheKey, JSON.stringify(allArticles));
    renderPage(1);
  } catch (err) {
    console.error('Ошибка загрузки с API:', err);
    showError('Не удалось загрузить данные.');
  }
});

// ===============================
// 🔄 АДАПТИВНОСТЬ
// ===============================
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (Array.isArray(allArticles) && allArticles.length) {
      renderPage(currentPage);
    }
  }, 150);
});

console.log('✅ script.js загружен');