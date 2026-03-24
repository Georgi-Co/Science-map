

// script.js — загрузка статей для Strapi v5 с кэшем и retry

// Глобальные переменные
let allArticles = [];
let currentPage = 1;

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
      console.warn(`Попытка ${i + 1} не удалась:`, err);
      if (i < retries - 1) await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Не удалось получить данные после нескольких попыток');
}

// ===============================
// 🔹 Показ loader / ошибка
// ===============================
function showLoader() {
  const grid = document.querySelector('.articles-grid');
  if (grid) grid.innerHTML = '<p>Загрузка данных...</p>';
}

function showError(msg = 'Ошибка загрузки данных') {
  const grid = document.querySelector('.articles-grid');
  if (grid) grid.innerHTML = `<p>${msg}</p>`;
}

// ===============================
// 🔹 Вспомогательные функции для сетки
// ===============================
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

// ===============================
// 🔹 renderPage — глобальная функция
// ===============================
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
    const card = document.createElement('div');
    card.className = 'article-card';

    const authorsHTML = (Array.isArray(article.authors) ? article.authors : []).map(a => {
      const name = a.Name || a.name || 'Автор';
      return `<span class="author-chip">${name}</span>`;
    }).join('');

    const tagsHTML = (Array.isArray(article.tags) ? article.tags : []).map(t => {
      return `<button type="button" class="article-tag-chip" data-tag="${t}">${t}</button>`;
    }).join('');

    const pubDate = article.Publication ? new Date(article.Publication).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric'
    }) : 'Дата не указана';

    card.innerHTML = `
      <article>
        <h3><a href="full-article.html?id=${article.id}">${article.Title}</a></h3>
        <div>${article.Description || ''}</div>
        <div><strong>Авторы:</strong> ${authorsHTML}</div>
        <div><strong>Теги:</strong> ${tagsHTML}</div>
        <time datetime="${article.Publication || ''}">${pubDate}</time>
      </article>
    `;

    // Клик по карточке
    card.addEventListener('click', e => {
      if (!e.target.closest('a')) {
        window.location.href = `full-article.html?id=${article.id}`;
      }
    });

    grid.appendChild(card);
  });

  // Навешиваем обработчики на теги
  const tagChips = document.querySelectorAll('.article-tag-chip');
  tagChips.forEach(chip => {
    chip.addEventListener('click', e => {
      e.stopPropagation();
      const tag = chip.getAttribute('data-tag');
      if (typeof articleSearch === 'object' && articleSearch) {
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
// 🔹 Загрузка статей
// ===============================
document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return;

  const cacheKey = 'articles_cache';

  // Кэш
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        allArticles = parsed;
        renderPage(1);
        return;
      }
    } catch (e) {
      console.warn('⚠️ Кэш не распарсился', e);
    }
  }

  // API
  try {
    showLoader();

    const url = new URL('https://special-bear-65dd39b4fc.strapiapp.com/api/articles');
    url.searchParams.set('pagination[pageSize]', '100');
    url.searchParams.set('sort', 'Publication:desc');
    url.searchParams.set('publicationState', 'published');

    // Минимальный populate
    url.searchParams.append('populate', 'authors');
    url.searchParams.append('populate', 'tags');

    const data = await fetchWithRetry(url);
    if (!data?.data) throw new Error('API вернул неверный формат');

    allArticles = data.data.map(item => {
      const attrs = item.attributes || item;

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

    try {
      localStorage.setItem(cacheKey, JSON.stringify(allArticles));
    } catch (err) {
      console.warn('⚠️ Не удалось сохранить кэш', err);
    }

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
    if (Array.isArray(allArticles) && allArticles.length > 0) renderPage(currentPage);
  }, 150);
});

console.log('✅ script.js загружен');