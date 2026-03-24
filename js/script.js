

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

  const articlesToShow = Array.isArray(allArticles)
    ? allArticles.slice(start, end)
    : [];

  grid.innerHTML = '';

  if (!articlesToShow.length) {
    grid.innerHTML = '<p>Нет опубликованных статей.</p>';
    return;
  }

  articlesToShow.forEach(article => {
    const id = article.id;

    const title = article.Title || article.title || 'Без заголовка';
    const description = article.Description || article.description || 'Описание отсутствует';

    const publication = article.Publication || article.publishedAt || null;

    const scientificField = article.ScienceArea || article.scienceArea || '';
    const researchDirection = article.ScienceDirection || article.scienceDirection || '';
    const faculty = article.Faculty || article.faculty || '';

    const tags = Array.isArray(article.tags)
      ? article.tags.map(t => t.Name || t.name || t)
      : [];

    const authors = Array.isArray(article.authors)
      ? article.authors.map(a => ({
          id: a.id,
          Name: a.Name || a.name || 'Автор'
        }))
      : [];

    const date = publication
      ? new Date(publication).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : 'Дата не указана';

    const authorsHTML = authors.length
      ? authors.map(author => {
          const authorName = author.Name || 'Автор';
          const authorId = author.id;

          const iconPerson = `
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14">
            <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6"/>
          </svg>`;

          const link = authorId
            ? `<a href="author.html?id=${authorId}">${authorName}</a>`
            : `<span>${authorName}</span>`;

          return `<span class="author-chip">${iconPerson} ${link}</span>`;
        }).join('')
      : '<span class="author-chip">Автор не указан</span>';

    const fieldDisplay = scientificField || 'Научная область не указана';
    const directionDisplay = researchDirection || 'Научное направление не указано';
    const facultyDisplay = faculty || 'Не указан';

    const card = document.createElement('div');
    card.className = 'article-card';

    card.innerHTML = `
      <article class="article-card-body">
        <div class="article-badges">
          <div class="article-badge">${fieldDisplay}</div>
          <div class="article-badge">${directionDisplay}</div>
        </div>

        <h3>
          <a href="full-article.html?id=${id}">${title}</a>
        </h3>

        <div><strong>Описание:</strong> ${description}</div>

        <div>
          <strong>Факультет:</strong> ${facultyDisplay}
        </div>

        <div>
          <strong>Дата:</strong> ${date}
        </div>

        <div>
          <strong>Авторы:</strong> ${authorsHTML}
        </div>

        ${
          tags.length
            ? `<div>${tags.map(t => `<span>${t}</span>`).join(' ')}</div>`
            : ''
        }
      </article>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('a') || e.target.closest('button')) return;
      window.location.href = `full-article.html?id=${id}`;
    });

    grid.appendChild(card);
  }); // ✅ закрыли forEach
} // ✅ закрыли renderPage

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