

// script.js — загрузка статей для Strapi v5 с кэшем и адаптивным рендером

let allArticles = [];
let currentPage = 1;
let articleSearch = null; // поиск, если подключён search.js

// ===============================
// 🔹 Функции загрузки
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

function showError(message) {
  const grid = document.querySelector('.articles-grid');
  if (grid) grid.innerHTML = `<p>${message}</p>`;
}

// ===============================
// 🔹 Render карточек
// ===============================
function renderPage(page = 1) {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return;

  currentPage = page;
  const articlesPerPage = getArticlesPerPage();
  const start = (page - 1) * articlesPerPage;
  const end = start + articlesPerPage;
  const articlesToShow = allArticles.slice(start, end);

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
      ? article.authors.map(a => `<span>${a.Name || 'Автор'}</span>`).join(', ')
      : 'Автор не указан';

    const tagsHTML = (Array.isArray(article.tags) && article.tags.length)
      ? article.tags.map(t => `<span class="tag-chip">${t.Name || t.name}</span>`).join(' ')
      : '';

    const card = document.createElement('div');
    card.className = 'article-card';
    card.innerHTML = `
      <h3>${title}</h3>
      <p><strong>Описание:</strong> ${description}</p>
      <p><strong>Факультет:</strong> ${faculty}</p>
      <p><strong>Область:</strong> ${scienceArea}</p>
      <p><strong>Направление:</strong> ${scienceDirection}</p>
      <p><strong>Дата публикации:</strong> ${publication}</p>
      <p><strong>Авторы:</strong> ${authorsHTML}</p>
      ${tagsHTML ? `<p><strong>Теги:</strong> ${tagsHTML}</p>` : ''}
    `;

    grid.appendChild(card);
  });
}

// ===============================
// 🔹 Грид адаптивный
// ===============================
function getGridColumnsCount() {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return 1;
  const style = getComputedStyle(grid);
  return style.gridTemplateColumns !== 'none'
    ? style.gridTemplateColumns.trim().split(/\s+/).length
    : 1;
}

function getGridRowsCount() {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return 2;
  const style = getComputedStyle(grid);
  return style.gridTemplateRows !== 'none'
    ? style.gridTemplateRows.trim().split(/\s+/).length
    : 2;
}

function getArticlesPerPage() {
  return getGridColumnsCount() * getGridRowsCount();
}

// ===============================
// 🔹 Загрузка статей
// ===============================
document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return;

  const cacheKey = 'articles_cache';
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      allArticles = JSON.parse(cached);
      renderPage(1);
      console.log('📦 Загружено из кэша', allArticles.length, 'статей');
      return;
    } catch (err) {
      console.warn('⚠️ Ошибка парсинга кэша:', err);
    }
  }

  showLoader();

  const url = new URL('https://special-bear-65dd39b4fc.strapiapp.com/api/articles');
  url.searchParams.set('pagination[pageSize]', '100');
  url.searchParams.set('sort', 'Publication:desc');
  url.searchParams.set('publicationState', 'published');
  url.searchParams.append('populate', 'authors');
  url.searchParams.append('populate', 'tags');

  try {
    const response = await fetchWithRetry(url);
    if (!response.data) throw new Error('API вернул неверный формат');

    allArticles = response.data.map(a => ({
      id: a.id,
      Title: a.Title || '',
      Description: a.Description || '',
      Publication: a.Publication || a.publishedAt || null,
      Faculty: a.Faculty || '',
      ScienceArea: a.ScienceArea || '',
      ScienceDirection: a.ScienceDirection || '',
      authors: Array.isArray(a.authors) ? a.authors : [],
      tags: Array.isArray(a.tags) ? a.tags : [],
      Content: a.Content || []
    }));

    try { localStorage.setItem(cacheKey, JSON.stringify(allArticles)); } catch(e) {}

    renderPage(1);
    console.log('✅ Загружено из API', allArticles.length, 'статей');
  } catch (err) {
    console.error('❌ Ошибка загрузки с API:', err);
    showError('Не удалось загрузить статьи.');
  }
});

// ===============================
// 🔹 Обновление при ресайзе
// ===============================
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (allArticles.length) renderPage(currentPage);
  }, 150);
});

// ===============================
// 🔹 Обновление при смене языка
// ===============================
document.addEventListener('languageChanged', () => {
  if (allArticles.length) renderPage(currentPage);
});