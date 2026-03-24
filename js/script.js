

// script.js — стабильная загрузка статей для Strapi v5 (плоские данные)
// Поддерживает: пагинацию, адаптивность, авторов, ошибки

// Глобальные переменные
let allArticles = [];
let currentPage = 1;


// ===============================
// 🔥 RETRY + CACHE + LOADER
// ===============================

async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      return await res.json();
    } catch (err) {
      console.warn(`Попытка ${i + 1} не удалась`);

      if (i === retries - 1) throw err;

      await new Promise(r => setTimeout(r, delay));
    }
  }
}

function showLoader() {
  const grid = document.querySelector('.articles-grid');
  if (grid) {
    grid.innerHTML = '<p>Загрузка данных...</p>';
  }
}

function showError(message = 'Ошибка загрузки данных') {
  const grid = document.querySelector('.articles-grid');
  if (grid) {
    grid.innerHTML = `<p>${message}</p>`;
  }
}

// === ФУНКЦИИ ===

// Определяем количество колонок сетки
function getGridColumnsCount() {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return 1;

  const style = getComputedStyle(grid);
  const template = style.gridTemplateColumns;

  if (template && template !== 'none') {
    return Math.max(1, template.trim().split(/\s+/).length);
  }

  const firstCard = grid.querySelector('.article-card');
  if (firstCard) {
    const gridWidth = grid.clientWidth;
    const cardWidth = firstCard.offsetWidth;
    const gap = parseFloat(style.columnGap) || 0;
    if (cardWidth > 0) {
      return Math.max(1, Math.floor((gridWidth + gap) / (cardWidth + gap)));
    }
  }
  return 1;
}

// Определяем количество строк сетки
function getGridRowsCount() {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return 2;

  const style = getComputedStyle(grid);
  const template = style.gridTemplateRows;

  if (template && template !== 'none') {
    return Math.max(1, template.trim().split(/\s+/).length);
  }
  return 2;
}

// Рассчитываем количество статей на страницу
function getArticlesPerPage() {
  return getGridColumnsCount() * getGridRowsCount();
}

// === renderPage — ГЛОБАЛЬНАЯ (для pagination.js и search.js)
function renderPage(page = 1) {
  console.log('[renderPage] Вызов с page=', page);
  console.log('[renderPage] Всего статей в allArticles:', allArticles.length);

  currentPage = page;
  const articlesPerPage = getArticlesPerPage();
  const start = (page - 1) * articlesPerPage;
  const end = start + articlesPerPage;
  const articlesToShow = allArticles.slice(start, end);

  console.log('[renderPage] Статей на страницу:', articlesPerPage);
  console.log('[renderPage] Статей для отображения:', articlesToShow.length);

  const grid = document.querySelector('.articles-grid');
  if (!grid) {
    console.error('[renderPage] ❌ .articles-grid не найден в DOM');
    return;
  }

  grid.innerHTML = '';

  if (articlesToShow.length === 0) {
    console.warn('[renderPage] ⚠️ Нет статей для отображения');
    grid.innerHTML = '<p class="no-articles">Нет статей для отображения.</p>';
    return;
  }

  console.log('[renderPage] Начинаю рендеринг', articlesToShow.length, 'статей');

  articlesToShow.forEach(article => {
    const id = article.id;
    const title = article.Title || article.title || 'Без заголовка';
    const description = article.Description || article.description || '';
    const contentBlocks = article.Content || article.content || [];
    const publication = article.Publication || article.publication || article.publishedAt;
    const authors = Array.isArray(article.authors) ? article.authors : [];
    const scientificField = article.scienceArea || '';
    const researchDirection = article.scienceDirection || '';
    const faculty = article.faculty || '';
    const tags = Array.isArray(article.tags) ? article.tags : [];

    // Превью текста (первые 2 абзаца, до 200 символов)
    let previewText = '';
    if (Array.isArray(contentBlocks) && contentBlocks.length > 0) {
      const text = contentBlocks
        .filter(block => block && block.type === 'paragraph')
        .slice(0, 2)
        .map(block => {
          if (!block.children || !Array.isArray(block.children)) return '';
          return block.children.map(child => child?.text || '').join('');
        })
        .join(' ')
        .trim();

      previewText = text.length > 0
        ? (text.substring(0, 200) + (text.length > 200 ? '...' : ''))
        : 'Описание отсутствует';
    } else {
      previewText = 'Описание отсутствует';
    }

    // Форматирование даты
    const date = publication
      ? new Date(publication).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      : 'Дата не указана';

    // Обработка авторов (все) — чипы без запятых с иконкой
    const authorsHTML = authors.length
      ? authors.map(author => {
          const authorName = author?.Name || author?.name || 'Автор';
          const authorId = author?.id;
          const iconPerson = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="icon-person" viewBox="0 0 16 16"><path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/></svg>`;
          const link = authorId
            ? `<a href="author.html?id=${authorId}" class="author-chip-link">${authorName}</a>`
            : `<span class="author-name">${authorName}</span>`;
          return `<span class="author-chip">${iconPerson} ${link}</span>`;
        }).join('')
      : '<span class="author-chip">Автор не указан</span>';

    // Получаем функцию перевода
    const t = (key) => window.localization?.getTranslation?.(key) || key;

    // Локализованные названия плашек
    const fieldDisplay = scientificField ? t(scientificField) : t('Научная область не указана');
    const directionDisplay = researchDirection ? t(researchDirection) : t('Научное направление не указано');
    const facultyDisplay = faculty ? faculty : t('Не указан');

    // Создание карточки статьи
    const card = document.createElement('div');
    card.className = 'article-card';

    card.innerHTML = `
      <article class="article-card-body">
        <div class="article-badges" aria-label="${t('Научная область')} ${t('Научное направление')}">
          <div class="article-badge article-badge--field" title="${fieldDisplay}">${fieldDisplay}</div>
          <div class="article-badge article-badge--direction" title="${directionDisplay}">${directionDisplay}</div>
        </div>
        <h3 class="article-title">
          <a href="full-article.html?id=${id}" class="article-title-link">${title}</a>
        </h3>
        <div class="article-description"><strong>Описание: </strong>${description}</div>
        <!-- <div class="article-preview"><strong>Цели проекта: </strong>${previewText}</div> -->
        <div class="faculty" aria-label="${t('Факультет:')}"><strong>${t('Факультет:')}</strong> <span class="faculty-name">${facultyDisplay}</span></div>
        <time class="article-date" datetime="${publication || ''}"><strong>Дата публикации: </strong>${date}</time>
        <div class="article-author"><div class="author-label"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="icon-people" viewBox="0 0 16 16"><path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5"/></svg><strong> Авторы: </strong></div> ${authorsHTML}</div>
        ${tags.length ? `
        <div class="article-tags-line" aria-label="Теги статьи">
          ${tags.map(tag => `<button type="button" class="article-tag-chip" data-tag="${tag}">${tag}</button>`).join('')}
        </div>` : ''}
      </article>
    `;

    // Переход к полной статье по клику на всю карточку
    card.addEventListener('click', (event) => {
      const target = event.target;
      const link = target.closest('a');

      // Если клик по ссылке (заголовок, автор и т.п.) — не перехватываем
      if (link) {
        return;
      }

      window.location.href = `full-article.html?id=${id}`;
    });

    grid.appendChild(card);
  });

  // Навешиваем обработчики на теги после рендера карточек
  const tagChips = document.querySelectorAll('.article-tag-chip');
  tagChips.forEach(chip => {
    const tag = chip.getAttribute('data-tag');
    if (!tag) return;
    chip.addEventListener('click', (event) => {
      // Не даём клику по тегу срабатывать как клик по карточке
      event.stopPropagation();
      const url = new URL(window.location.href);
      url.searchParams.set('tag', tag);
      window.history.replaceState({}, '', url.toString());

      if (typeof articleSearch === 'object' && articleSearch) {
        articleSearch.activeTag = tag.toLowerCase();
        articleSearch.performSearch(articleSearch.searchField?.value || '');
      }
    });
  });

  // Инициализация пагинации (если функция доступна)
  if (typeof createPagination === 'function') {
    const totalPages = Math.ceil(allArticles.length / articlesPerPage);
    createPagination(currentPage, totalPages, '#articles-container');
  }
}

// === ЗАГРУЗКА СТАТЕЙ С МИНИМАЛЬНЫМ POPULATE И КЭШЕМ ===
document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return console.error('❌ .articles-grid не найден');

  const cacheKey = 'articles_cache';

  // Попробуем сначала взять из кэша
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    console.log('📦 Загружаем статьи из кэша');
    allArticles = JSON.parse(cached);
    renderPage(1);
    return;
  }

  // Если кэша нет — загружаем с API
  try {
    showLoader(); // Показываем "Загрузка данных..."

    const url = new URL('https://special-bear-65dd39b4fc.strapiapp.com/api/articles');
    url.searchParams.set('pagination[pageSize]', '100');
    url.searchParams.set('sort', 'Publication:desc');
    url.searchParams.set('publicationState', 'published');
    url.searchParams.set('populate[authors]', 'name');
    url.searchParams.set('populate[tags]', 'name');

    const data = await fetchWithRetry(url); // функция с 3 попытками
    if (!data || !data.data) throw new Error('API вернул неверный формат');

    // Преобразуем данные в формат фронтенда
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

    // Сохраняем в localStorage
    try {
      localStorage.setItem(cacheKey, JSON.stringify(allArticles));
      console.log('📦 Статьи сохранены в кэш');
    } catch (err) {
      console.warn('⚠️ Не удалось сохранить кэш:', err);
    }

    renderPage(1);

  } catch (error) {
    console.error('❌ Ошибка загрузки с API:', error);
    grid.innerHTML = '<p>Не удалось загрузить данные.</p>';
  }
});

// === fetch с retry (3 попытки) ===
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

// === АДАПТИВНОСТЬ ===
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (allArticles.length > 0 && articleSearch) {
      // Перестраиваем поиск при ресайзе
      articleSearch.updateArticles(allArticles);
      renderPage(currentPage);
    } else if (allArticles.length > 0) {
      // Если поиск не инициализирован, просто обновляем страницу
      renderPage(currentPage);
    }
  }, 150);
});

console.log('✅ script.js загружен');

// При смене языка — перерисовываем карточки
document.addEventListener('languageChanged', () => {
  if (allArticles.length > 0) {
    renderPage(currentPage);
  }
});
