

// script.js — стабильная загрузка статей для Strapi v5 (плоские данные)
// Поддерживает: пагинацию, адаптивность, авторов, ошибки

// Глобальные переменные
let allArticles = [];
let currentPage = 1;

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
    const title = article.Title || article.title || 'Без заголовка';
    const contentBlocks = article.Content || article.content || [];
    const publication = article.Publication || article.publication || article.publishedAt;
    const authors = Array.isArray(article.authors) ? article.authors : [];

    // Превью текста (первые 2 абзаца, до 200 символов)
    const previewText = contentBlocks
      .filter(block => block.type === 'paragraph')
      .slice(0, 2)
      .map(block => {
        if (!block.children) return '';
        return block.children.map(child => child.text || '').join('');
      })
      .join(' ')
      .substring(0, 200) + '...';

    // Форматирование даты
    const date = publication
      ? new Date(publication).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : 'Дата не указана';

    // Обработка автора
    const author = authors[0] || null;
    const authorName = author?.Name || author?.name || 'Автор не указан';
    const authorId = author?.id;
    const authorLink = authorId
      ? `<a href="../html/author.html?id=${authorId}">${authorName}</a>`
      : authorName;

    // Создание карточки статьи
    const card = document.createElement('div');
    card.className = 'article-card';

    card.innerHTML = `
      <article class="article-card-body">
        <h3 class="article-title">
          <a href="/article.html?id=${id}" class="article-title-link">${title}</a>
        </h3>
        <div class="article-preview">${previewText}</div>
        <time class="article-date" datetime="${publication || ''}">📅 ${date}</time>
        <div class="article-author">👤 ${authorLink}</div>
      </article>
    `;

    grid.appendChild(card);
  });

  // Инициализация пагинации (если функция доступна)
  if (typeof createPagination === 'function') {
    const totalPages = Math.ceil(allArticles.length / articlesPerPage);
    createPagination(currentPage, totalPages, '#articles-container');
  }
}

// === ЗАГРУЗКА СТАТЕЙ ===
document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.querySelector('.articles-grid');
  if (!grid) {
    console.error('❌ .articles-grid не найден');
    return;
  }

  try {
    console.log('🔍 Загрузка статей с Strapi...');

    const url = new URL('http://localhost:1337/api/articles');
    url.searchParams.append('populate', '*');
    url.searchParams.append('publicationState', 'published');
    url.searchParams.append('pagination[pageSize]', '100');
    url.searchParams.append('sort', 'Publication:desc');

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📦 Получены данные:', data);

    if (!data || !data.data || !Array.isArray(data.data)) {
      throw new Error('API вернул неверный формат (отсутствует data.data)');
    }

    // Обработка и фильтрация статей
    allArticles = data.data
      .map(item => ({
        ...item,
        Title: item.Title || item.title || '',
        Content: item.Content || item.content || [],
        Publication: item.Publication || item.publication || item.publishedAt || null,
        authors: Array.isArray(item.authors) ? item.authors : []
      }))
      .filter(article => article.publishedAt || article.Publication);

    if (allArticles.length === 0) {
      grid.innerHTML = '<p>Нет опубликованных статей.</p>';
      return;
    }

    // Инициализация поиска (если функция setupSearch доступна)
    if (typeof setupSearch === 'function') {
      articleSearch = setupSearch(allArticles, renderPage);
      console.log('✅ Поиск инициализирован');
    } else {
      console.error(
        '❌ Функция setupSearch не найдена. Проверьте:\n' +
        '- Подключен ли файл search.js?\n' +
        '- Нет ли ошибок в консоли при загрузке search.js?'
      );
    }

    // Рендеринг первой страницы
    renderPage(1);

  } catch (error) {
    console.error('❌ Ошибка загрузки:', error);
    grid.innerHTML = `
      <div class="error-card">
        <h3>Не удалось загрузить статьи</h3>
        <p><strong>Ошибка:</strong> ${error.message}</p>
        <p><small>Проверь:</small></p>
        <ul>
          <li>Strapi запущен: <a href="http://localhost:1337" target="_blank">открыть</a></li>
          <li>Статьи опубликованы</li>
          <li>Разрешён доступ в Public Role</li>
          <li>Поле <code>authors</code> разрешено в API</li>
        </ul>
      </div>
    `;
  }
});

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
