

// script.js — стабильная загрузка статей для Strapi v5
// Поддерживает: пагинацию, адаптивность, авторов, ошибки, кэш

let allArticles = [];
let currentPage = 1;

// ===============================
// 🔥 RETRY + CACHE + LOADER
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
// РЕНДЕРИНГ СТРАНИЦЫ
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
    return cardWidth > 0 ? Math.max(1, Math.floor((gridWidth + gap) / (cardWidth + gap))) : 1;
  }
  return 1;
}

function getGridRowsCount() {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return 2;

  const style = getComputedStyle(grid);
  const template = style.gridTemplateRows;
  return template && template !== 'none' ? Math.max(1, template.trim().split(/\s+/).length) : 2;
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

  if (articlesToShow.length === 0) {
    grid.innerHTML = '<p class="no-articles">Нет статей для отображения.</p>';
    return;
  }

  articlesToShow.forEach(article => {
    const id = article.id;
    const title = article.Title || 'Без заголовка';
    const description = article.Description || '';
    const authors = Array.isArray(article.authors) ? article.authors : [];
    const tags = Array.isArray(article.tags) ? article.tags : [];
    const faculty = article.faculty || '';
    const t = (key) => window.localization?.getTranslation?.(key) || key;

    const authorsHTML = authors.length
      ? authors.map(a => `<span class="author-chip">${a.Name}</span>`).join('')
      : '<span class="author-chip">Автор не указан</span>';

    const card = document.createElement('div');
    card.className = 'article-card';
    card.innerHTML = `
      <article class="article-card-body">
        <h3 class="article-title"><a href="full-article.html?id=${id}">${title}</a></h3>
        <div class="article-description">${description}</div>
        <div class="faculty">${faculty}</div>
        <div class="article-author">${authorsHTML}</div>
        ${tags.length ? `<div class="article-tags-line">${tags.map(tag => `<button type="button" class="article-tag-chip" data-tag="${tag}">${tag}</button>`).join('')}</div>` : ''}
      </article>
    `;
    card.addEventListener('click', (e) => {
      if (!e.target.closest('a')) window.location.href = `full-article.html?id=${id}`;
    });
    grid.appendChild(card);
  });

  const tagChips = document.querySelectorAll('.article-tag-chip');
  tagChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const tag = chip.getAttribute('data-tag');
      if (!tag) return;
      const url = new URL(window.location.href);
      url.searchParams.set('tag', tag);
      window.history.replaceState({}, '', url.toString());
      if (articleSearch) {
        articleSearch.activeTag = tag.toLowerCase();
        articleSearch.performSearch(articleSearch.searchField?.value || '');
      }
    });
  });

  if (typeof createPagination === 'function') {
    const totalPages = Math.ceil(allArticles.length / articlesPerPage);
    createPagination(currentPage, totalPages, '#articles-container');
  }
}

// ===============================
// ЗАГРУЗКА СТАТЕЙ С API + КЭШ
// ===============================

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return console.error('❌ .articles-grid не найден');

  const cacheKey = 'articles_cache';

  // Попробуем сначала из кэша
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    console.log('📦 Загружаем статьи из кэша');
    allArticles = JSON.parse(cached);
    renderPage(1);
    return;
  }

  // Если кэша нет — загружаем с API
  try {
    showLoader();

    const url = new URL('https://special-bear-65dd39b4fc.strapiapp.com/api/articles');
    url.searchParams.set('pagination[pageSize]', '100');
    url.searchParams.set('sort', 'Publication:desc');
    url.searchParams.set('publicationState', 'published');

    // ✅ минимальный populate (каждый отдельно)
    url.searchParams.append('populate', 'authors');
    url.searchParams.append('populate', 'tags');

    const data = await fetchWithRetry(url);
    if (!data || !data.data) throw new Error('API вернул неверный формат');

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
      console.log('📦 Статьи сохранены в кэш');
    } catch (err) {
      console.warn('⚠️ Не удалось сохранить кэш:', err);
    }

    renderPage(1);

  } catch (err) {
    console.error('❌ Ошибка загрузки с API:', err);
    showError('Не удалось загрузить данные и кэш пустой');
  }
});

// ===============================
// АДАПТИВНОСТЬ
// ===============================
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (allArticles.length > 0 && articleSearch) {
      articleSearch.updateArticles(allArticles);
      renderPage(currentPage);
    } else if (allArticles.length > 0) {
      renderPage(currentPage);
    }
  }, 150);
});

console.log('✅ script.js загружен');

document.addEventListener('languageChanged', () => {
  if (allArticles.length > 0) renderPage(currentPage);
});
