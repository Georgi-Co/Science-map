

// ===============================
// script.js — стабильная загрузка статей для Strapi v5
// Поддерживает: кэш, retry, адаптивность, авторов, теги, пагинацию
// ===============================

// Глобальные переменные
let allArticles = [];
let currentPage = 1;
var articleSearch = null;

// В script.js или search.js (один раз)
if (typeof articleSearch === 'undefined') {
  var articleSearch = null;
}

// ===============================
// 🔹 RETRY + CACHE + LOADER
// ===============================

async function fetchWithRetry(url, retries = 3, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`⚠️ Попытка ${i + 1} не удалась:`, err);
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
// ✅ Рендеринг страниц
// ===============================

function getGridColumnsCount() {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return 1;
  const style = getComputedStyle(grid);
  const template = style.gridTemplateColumns;
  if (template && template !== 'none') return Math.max(1, template.trim().split(/\s+/).length);
  const firstCard = grid.querySelector('.article-card');
  if (firstCard) {
    const gridWidth = grid.clientWidth;
    const cardWidth = firstCard.offsetWidth;
    const gap = parseFloat(style.columnGap) || 0;
    if (cardWidth > 0) return Math.max(1, Math.floor((gridWidth + gap) / (cardWidth + gap)));
  }
  return 1;
}

function getGridRowsCount() {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return 2;
  const style = getComputedStyle(grid);
  const template = style.gridTemplateRows;
  if (template && template !== 'none') return Math.max(1, template.trim().split(/\s+/).length);
  return 2;
}

function getArticlesPerPage() {
  return getGridColumnsCount() * getGridRowsCount();
}

function renderPage(page = 1) {
  currentPage = page;
  const articlesPerPage = getArticlesPerPage();
  const start = (page - 1) * articlesPerPage;
  const end = start + articlesPerPage;
  const articlesToShow = allArticles.slice(start, end);

  const grid = document.querySelector('.articles-grid');
  if (!grid) return;

  grid.innerHTML = '';

  if (!articlesToShow.length) {
    grid.innerHTML = '<p class="no-articles">Нет статей для отображения.</p>';
    return;
  }

  articlesToShow.forEach(article => {
    const id = article.id;
    const title = article.Title || 'Без заголовка';
    const description = article.Description || '';
    const publication = article.Publication || article.publishedAt;
    const authors = Array.isArray(article.authors) ? article.authors : [];
    const tags = Array.isArray(article.tags) ? article.tags : [];

    const date = publication
      ? new Date(publication).toLocaleDateString('ru-RU', {
          day: 'numeric', month: 'long', year: 'numeric'
        })
      : 'Дата не указана';

    const authorsHTML = authors.length
      ? authors.map(a => `<span class="author-chip">${a.Name}</span>`).join('')
      : '<span class="author-chip">Автор не указан</span>';

    const card = document.createElement('div');
    card.className = 'article-card';
    card.innerHTML = `
      <article>
        <h3><a href="full-article.html?id=${id}">${title}</a></h3>
        <p>${description}</p>
        <p><strong>Дата публикации:</strong> ${date}</p>
        <p><strong>Авторы:</strong> ${authorsHTML}</p>
        ${tags.length ? `<p><strong>Теги:</strong> ${tags.map(t => `<span>${t}</span>`).join(', ')}</p>` : ''}
      </article>
    `;

    card.addEventListener('click', e => {
      const link = e.target.closest('a');
      if (!link) window.location.href = `full-article.html?id=${id}`;
    });

    grid.appendChild(card);
  });

  if (typeof createPagination === 'function') {
    const totalPages = Math.ceil(allArticles.length / articlesPerPage);
    createPagination(currentPage, totalPages, '#articles-container');
  }
}

// ===============================
// 🔹 Загрузка статей с кэшем
// ===============================

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return;

  const cacheKey = 'articles_cache';

  // Проверяем кэш
  let cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      cached = JSON.parse(cached);
      if (Array.isArray(cached)) {
        allArticles = cached;
        console.log('📦 Загружаем статьи из кэша');
        renderPage(1);
        return;
      }
    } catch { /* игнорируем ошибки парсинга */ }
  }

  showLoader();

  try {
    const url = new URL('https://special-bear-65dd39b4fc.strapiapp.com/api/articles');
    url.searchParams.set('pagination[pageSize]', '100');
    url.searchParams.set('sort', 'Publication:desc');
    url.searchParams.set('publicationState', 'published');
    url.searchParams.append('populate', 'authors');
    url.searchParams.append('populate', 'tags');

    const data = await fetchWithRetry(url);
    if (!data || !Array.isArray(data.data)) throw new Error('API вернул неверный формат');

    allArticles = data.data.map(item => {
      const attrs = item.attributes || {};
      const authors = (attrs.authors?.data || []).map(a => {
        const aAttrs = a.attributes || a;
        return { id: a.id, Name: aAttrs.name || aAttrs.Name || '' };
      });
      const tags = (attrs.tags?.data || []).map(t => {
        const tAttrs = t.attributes || t;
        return tAttrs.name || tAttrs.Name || '';
      });
      return {
        id: item.id,
        Title: attrs.Title || attrs.title || '',
        Description: attrs.Description || attrs.description || '',
        Publication: attrs.Publication || attrs.publication || attrs.publishedAt || null,
        authors,
        tags
      };
    });

    localStorage.setItem(cacheKey, JSON.stringify(allArticles));
    renderPage(1);

  } catch (err) {
    console.error('❌ Ошибка загрузки с API:', err);
    showError('Не удалось загрузить данные.');
  }
});

// ===============================
// 🔹 Адаптивность
// ===============================

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (allArticles.length > 0) renderPage(currentPage);
  }, 150);
});

// ===============================
// 🔹 Обновление при смене языка
// ===============================

document.addEventListener('languageChanged', () => {
  if (allArticles.length > 0) renderPage(currentPage);
});

console.log('✅ script.js загружен');