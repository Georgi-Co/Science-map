

// ===============================
// script.js — стабильная загрузка статей для Strapi v5
// ===============================

let allArticles = [];
let currentPage = 1;
let articleSearch = null;

// ===============================
// 🔹 fetch с retry
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

// ===============================
// 🔹 Показ загрузчика / ошибки
// ===============================
function showLoader() {
  const grid = document.querySelector('.articles-grid');
  if (grid) grid.innerHTML = '<p>Загрузка данных...</p>';
}

function showError(message = 'Ошибка загрузки данных') {
  const grid = document.querySelector('.articles-grid');
  if (grid) grid.innerHTML = `<p>${message}</p>`;
}

// ===============================
// 🔹 Рендеринг страницы
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

  if (!Array.isArray(allArticles)) {
    console.error('❌ allArticles не массив');
    return;
  }

  const articlesToShow = allArticles.slice(start, end);

  const grid = document.querySelector('.articles-grid');
  if (!grid) return;

  grid.innerHTML = '';

  if (articlesToShow.length === 0) {
    grid.innerHTML = '<p class="no-articles">Нет статей для отображения.</p>';
    return;
  }

  articlesToShow.forEach(article => {
    const { id, Title, Description, Publication, authors, tags } = article;

    const date = Publication
      ? new Date(Publication).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'Дата не указана';

    const authorsHTML = Array.isArray(authors) && authors.length
      ? authors.map(a => `<span class="author-chip">${a.Name}</span>`).join('')
      : '<span class="author-chip">Автор не указан</span>';

    const tagsHTML = Array.isArray(tags) && tags.length
      ? `<div class="article-tags-line">${tags.map(t => `<button type="button" class="article-tag-chip" data-tag="${t}">${t}</button>`).join('')}</div>`
      : '';

    const card = document.createElement('div');
    card.className = 'article-card';
    card.innerHTML = `
      <article class="article-card-body">
        <h3 class="article-title"><a href="full-article.html?id=${id}">${Title}</a></h3>
        <div class="article-description">${Description}</div>
        <time class="article-date">${date}</time>
        <div class="article-author">${authorsHTML}</div>
        ${tagsHTML}
      </article>
    `;

    card.addEventListener('click', e => {
      if (!e.target.closest('a')) window.location.href = `full-article.html?id=${id}`;
    });

    grid.appendChild(card);
  });

  // Навешиваем обработку тегов
  const tagChips = document.querySelectorAll('.article-tag-chip');
  tagChips.forEach(chip => {
    chip.addEventListener('click', event => {
      event.stopPropagation();
      const tag = chip.getAttribute('data-tag');
      if (!tag) return;
      if (articleSearch && typeof articleSearch.performSearch === 'function') {
        articleSearch.activeTag = tag.toLowerCase();
        articleSearch.performSearch(articleSearch.searchField?.value || '');
      }
    });
  });

  // Пагинация
  if (typeof createPagination === 'function') {
    const totalPages = Math.ceil(allArticles.length / articlesPerPage);
    createPagination(currentPage, totalPages, '#articles-container');
  }
}

// ===============================
// 🔹 Загрузка статей с минимальным populate и кэшом
// ===============================
document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return;

  const cacheKey = 'articles_cache';

  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    console.log('📦 Загружаем статьи из кэша');
    allArticles = JSON.parse(cached);
    renderPage(1);
    return;
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
    console.log('📦 Статьи сохранены в кэш');

    renderPage(1);

  } catch (err) {
    console.error('❌ Ошибка загрузки с API:', err);
    showError('Не удалось загрузить данные.');
  }
});