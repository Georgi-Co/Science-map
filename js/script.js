

// script.js — стабильная загрузка статей для Strapi v5

// =====================
// 🔹 ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// =====================
let allArticles = [];
let currentPage = 1;
let articleSearch = null; // Чтобы не было ReferenceError

// =====================
// 🔹 RETRY + CACHE + LOADER
// =====================
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

// =====================
// 🔹 РЕНДЕРИНГ КАРТОЧЕК
// =====================
function getGridColumnsCount() {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return 1;
  const style = getComputedStyle(grid);
  const template = style.gridTemplateColumns;
  if (template && template !== 'none') return Math.max(1, template.trim().split(/\s+/).length);
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
  if (!Array.isArray(allArticles)) {
    console.error('❌ allArticles не массив');
    return;
  }

  currentPage = page;
  const articlesPerPage = getArticlesPerPage();
  const start = (page - 1) * articlesPerPage;
  const end = start + articlesPerPage;
  const articlesToShow = allArticles.slice(start, end);

  const grid = document.querySelector('.articles-grid');
  if (!grid) return console.error('❌ .articles-grid не найден');

  grid.innerHTML = '';

  if (!articlesToShow.length) {
    grid.innerHTML = '<p>Нет статей для отображения.</p>';
    return;
  }

  articlesToShow.forEach(article => {
    const authorsHTML = (article.authors || []).map(a => `<span class="author-chip">${a.Name}</span>`).join('');
    const tagsHTML = (article.tags || []).map(t => `<button class="article-tag-chip" data-tag="${t}">${t}</button>`).join('');

    const card = document.createElement('div');
    card.className = 'article-card';
    card.innerHTML = `
      <h3><a href="full-article.html?id=${article.id}">${article.Title}</a></h3>
      <p>${article.Description || 'Описание отсутствует'}</p>
      <div class="authors">${authorsHTML}</div>
      <div class="tags">${tagsHTML}</div>
    `;

    // Клик по карточке
    card.addEventListener('click', e => {
      if (!e.target.closest('a')) {
        window.location.href = `full-article.html?id=${article.id}`;
      }
    });

    grid.appendChild(card);
  });

  // Навешиваем обработку тегов
  document.querySelectorAll('.article-tag-chip').forEach(chip => {
    chip.addEventListener('click', e => {
      e.stopPropagation();
      const tag = chip.getAttribute('data-tag');
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

// =====================
// 🔹 ЗАГРУЗКА СТАТЕЙ С API + КЭШ
// =====================
document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return console.error('❌ .articles-grid не найден');

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

    // ⚡ Правильный populate: отдельные параметры
    url.searchParams.append('populate', 'authors');
    url.searchParams.append('populate', 'tags');

    const data = await fetchWithRetry(url);
    if (!data?.data) throw new Error('API вернул неверный формат');

    allArticles = data.data.map(item => {
      const attrs = item.attributes || item;
      const authors = (attrs.authors?.data || []).map(a => {
        const aAttrs = a.attributes || a;
        return { id: a.id, Name: aAttrs.Name || aAttrs.name || '' };
      });
      const tags = (attrs.tags?.data || []).map(t => {
        const tAttrs = t.attributes || t;
        return tAttrs.Name || tAttrs.name || '';
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

    try {
      localStorage.setItem(cacheKey, JSON.stringify(allArticles));
      console.log('📦 Статьи сохранены в кэш');
    } catch (err) {
      console.warn('⚠️ Не удалось сохранить кэш:', err);
    }

    renderPage(1);

  } catch (err) {
    console.error('❌ Ошибка загрузки с API:', err);
    showError('Не удалось загрузить данные');
  }
});

// =====================
// 🔹 АДАПТИВНОСТЬ
// =====================
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (allArticles.length > 0) renderPage(currentPage);
  }, 150);
});

// =====================
// ✅ script.js загружен
// =====================
console.log('✅ script.js загружен');