

// script.js — стабильная пагинация с гибкостью и безопасностью

// Глобальные переменные
let allArticles = [];
let currentPage = 1;

// === ФУНКЦИИ ===

// Определяем колонки по grid-template-columns
function getGridColumnsCount() {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return 1;

  const style = getComputedStyle(grid);
  const template = style.gridTemplateColumns;

  if (template && template !== 'none') {
    return Math.max(1, template.trim().split(/\s+/).length);
  }

  // Fallback: если нет — пытаемся по первой карточке
  const firstCard = grid.querySelector('.article-card');
  if (firstCard) {
    const gridWidth = grid.clientWidth;
    const cardWidth = firstCard.offsetWidth;
    const gap = parseFloat(style.columnGap) || 0;
    if (cardWidth > 0) {
      return Math.max(1, Math.floor((gridWidth + gap) / (cardWidth + gap)));
    }
  }

  return 1; // крайний случай
}

// Определяем строки по grid-template-rows
function getGridRowsCount() {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return 2;

  const style = getComputedStyle(grid);
  const template = style.gridTemplateRows;

  if (template && template !== 'none') {
    return Math.max(1, template.trim().split(/\s+/).length);
  }

  return 2; // fallback — но это уже UX-решение
}

// Сколько статей на страницу
function getArticlesPerPage() {
  const columns = getGridColumnsCount();
  const rows = getGridRowsCount();
  return columns * rows;
}

// === renderPage — ТЕПЕРЬ ГЛОБАЛЬНАЯ ФУНКЦИЯ ===
// (чтобы pagination.js мог её вызывать)
function renderPage(page) {
  currentPage = page; // Обновляем текущую страницу

  const articlesPerPage = getArticlesPerPage();
  const start = (page - 1) * articlesPerPage;
  const end = start + articlesPerPage;
  const articlesToShow = allArticles.slice(start, end);

  const grid = document.querySelector('.articles-grid');
  if (!grid) return;

  // Очищаем сетку
  grid.innerHTML = '';

  // Рендерим статьи
  articlesToShow.forEach(article => {
    const title = article.Title || 'Без заголовка';
    const contentBlocks = article.Content || [];
    const publication = article.Publication;
    const imageUrl = article.Image?.data?.[0]?.attributes?.url;
    const imageAlt = article.Image?.data?.[0]?.attributes?.name || title;
    const authorName = article.authors?.[0]?.Name || 'Автор не указан';
    const authorLink = article.authors?.data?.[0]
      ? `<a href="/author.html?id=${article.authors.data[0].id}" class="author-link">${authorName}</a>`
      : authorName;

    const contentHTML = contentBlocks
      .map(block => {
        if (block.type === 'paragraph') {
          return `<p>${block.children.map(child => child.text).join('')}</p>`;
        }
        return '';
      })
      .join('');

    const date = publication
      ? new Date(publication).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : 'Дата не указана';

    const card = document.createElement('div');
    card.className = 'article-card';
    card.innerHTML = `
      <article class="article-card-body">
        <h3 class="article-title">${title}</h3>
        ${imageUrl ? `<img src="http://localhost:1337${imageUrl}" alt="${imageAlt}" class="article-image">` : ''}
        <div class="article-content">${contentHTML}</div>
        <time class="article-date" datetime="${publication}">📅 ${date}</time>
        <div class="article-author">👤 ${authorLink}</div>
        <button class="read-more" onclick="window.location.href='/article.html?id=${article.id}'">Читать далее</button>
      </article>
    `;

    grid.appendChild(card);
  });

  // === ВАЖНО: вызываем пагинацию ПОСЛЕ рендера
  const totalPages = Math.ceil(allArticles.length / articlesPerPage);
  createPagination(currentPage, totalPages);
}

// === ЗАГРУЗКА СТАТЕЙ ===
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const url = new URL('http://localhost:1337/api/articles?populate=*');
    url.searchParams.append('publicationState', 'published');
    url.searchParams.append('pagination[page]', '1');
    url.searchParams.append('pagination[pageSize]', '100');

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Ошибка: ${response.status}`);

    const data = await response.json();
    if (!data.data || data.data.length === 0) {
      const grid = document.querySelector('.articles-grid');
      if (grid) grid.innerHTML = '<p>Нет опубликованных статей.</p>';
      return;
    }

    allArticles = data.data;

    // Ждём, пока .articles-grid будет готов
    if (document.querySelector('.articles-grid')) {
      renderPage(1);
    } else {
      // Подстраховка — если элемент появится чуть позже
      setTimeout(() => renderPage(1), 100);
    }

  } catch (error) {
    console.error('Ошибка загрузки статей:', error);
    const grid = document.querySelector('.articles-grid');
    if (grid) grid.innerHTML = '<p>Ошибка загрузки статей. Повторите попытку позже.</p>';
  }
});

// === ПЕРЕРИСОВКА ПРИ ИЗМЕНЕНИИ РАЗМЕРА ===
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (currentPage) renderPage(currentPage);
  }, 200);
});









