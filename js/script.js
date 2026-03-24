

// ===============================
// script.js — загрузка статей для Strapi v5 (плоские данные)
// ===============================

// Глобальные переменные
let allArticles = [];
let currentPage = 1;
let articleSearch = null; // поиск

// ===============================
// 🔹 Функции: RETRY + CACHE + LOADER
// ===============================

// fetch с retry
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

// Показ загрузки
function showLoader() {
  const grid = document.querySelector('.articles-grid');
  if (grid) grid.innerHTML = '<p>Загрузка данных...</p>';
}

// Показ ошибки
function showError(message = 'Ошибка загрузки данных') {
  const grid = document.querySelector('.articles-grid');
  if (grid) grid.innerHTML = `<p>${message}</p>`;
}

// ===============================
// 🔹 Пагинация и сетка
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
// 🔹 Рендер страницы
// ===============================

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
    grid.innerHTML = '<p>Нет статей для отображения.</p>';
    return;
  }

  articlesToShow.forEach(article => {
    const id = article.id;
    const title = article.Title || 'Без заголовка';
    const description = article.Description || 'Описание отсутствует';
    const publication = article.Publication || null;
    const faculty = article.Faculty || 'Не указан';
    const scienceArea = article.ScienceArea || 'Научная область не указана';
    const scienceDirection = article.ScienceDirection || 'Направление не указано';
    const authors = Array.isArray(article.authors) ? article.authors : [];
    const tags = Array.isArray(article.tags) ? article.tags : [];

    // Авторы
    const authorsHTML = authors.length
      ? authors.map(a => `<span class="author-chip">${a.Name || 'Автор'}</span>`).join('')
      : '<span class="author-chip">Автор не указан</span>';

    // Теги
    const tagsHTML = tags.length
      ? tags.map(t => `<button type="button" class="article-tag-chip" data-tag="${t.Name}">${t.Name}</button>`).join('')
      : '';

    // Дата
    const date = publication
      ? new Date(publication).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'Дата не указана';

    // Создаем карточку
    const card = document.createElement('div');
    card.className = 'article-card';
    card.innerHTML = `
      <article class="article-card-body">
        <h3 class="article-title"><a href="full-article.html?id=${id}" class="article-title-link">${title}</a></h3>
        <div class="article-description"><strong>Описание: </strong>${description}</div>
        <div class="faculty"><strong>Факультет: </strong>${faculty}</div>
        <div class="science-area"><strong>Область: </strong>${scienceArea}</div>
        <div class="science-direction"><strong>Направление: </strong>${scienceDirection}</div>
        <time class="article-date" datetime="${publication || ''}"><strong>Дата публикации: </strong>${date}</time>
        <div class="article-authors"><strong>Авторы: </strong>${authorsHTML}</div>
        ${tagsHTML ? `<div class="article-tags-line">${tagsHTML}</div>` : ''}
      </article>
    `;

    // Клик по карточке — открытие полной статьи
    card.addEventListener('click', e => {
      if (!e.target.closest('a')) window.location.href = `full-article.html?id=${id}`;
    });

    grid.appendChild(card);
  });

  // Навешиваем обработчики на теги
  const tagChips = document.querySelectorAll('.article-tag-chip');
  tagChips.forEach(chip => {
    const tag = chip.getAttribute('data-tag');
    if (!tag) return;
    chip.addEventListener('click', e => {
      e.stopPropagation();
      const url = new URL(window.location.href);
      url.searchParams.set('tag', tag);
      window.history.replaceState({}, '', url.toString());
      if (articleSearch) {
        articleSearch.activeTag = tag.toLowerCase();
        articleSearch.performSearch(articleSearch.searchField?.value || '');
      }
    });
  });

  // Пагинация (если есть функция createPagination)
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
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    allArticles = JSON.parse(cached);
    if (!Array.isArray(allArticles)) allArticles = [];
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

    allArticles = data.data.map(article => ({
      id: article.id,
      Title: article.Title || '',
      Description: article.Description || '',
      Publication: article.Publication || article.publishedAt || null,
      Faculty: article.Faculty || '',
      ScienceArea: article.ScienceArea || '',
      ScienceDirection: article.ScienceDirection || '',
      authors: Array.isArray(article.authors) ? article.authors : [],
      tags: Array.isArray(article.tags) ? article.tags : [],
      Content: article.Content || []
    }));

    // Сохраняем в кэш
    try {
      localStorage.setItem(cacheKey, JSON.stringify(allArticles));
    } catch (err) {
      console.warn('⚠️ Не удалось сохранить кэш:', err);
    }

    renderPage(1);
  } catch (error) {
    console.error('❌ Ошибка загрузки с API:', error);
    showError('Не удалось загрузить данные.');
  }
});

// ===============================
// 🔹 Адаптивная перестройка сетки
// ===============================
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (allArticles.length > 0) renderPage(currentPage);
  }, 150);
});

// ===============================
// 🔹 Перерисовка при смене языка
// ===============================
document.addEventListener('languageChanged', () => {
  if (allArticles.length > 0) renderPage(currentPage);
});

console.log('✅ script.js загружен');