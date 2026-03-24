

// === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ===
let allArticles = [];
let currentPage = 1;
let articleSearch = null;

// ===============================
// 📦 ПАГИНАЦИЯ
// ===============================
function getArticlesPerPage() {
  return 6; // фикс чтобы не ломалась сетка
}

// ===============================
// 🎨 РЕНДЕР
// ===============================
function renderPage(page = 1) {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return;

  currentPage = page;

  const perPage = getArticlesPerPage();
  const start = (page - 1) * perPage;
  const articles = allArticles.slice(start, start + perPage);

  grid.innerHTML = '';

  if (!articles.length) {
    grid.innerHTML = '<p>Нет статей для отображения.</p>';
    return;
  }

  articles.forEach(article => {
    const id = article.id;

    const title = article.Title || 'Без заголовка';
    const description = article.Description || 'Описание отсутствует';
    const publication = article.Publication;

    const faculty = article.faculty || 'Не указан';
    const field = article.scienceArea || 'Научная область не указана';
    const direction = article.scienceDirection || 'Научное направление не указано';

    const tags = article.tags || [];
    const authors = article.authors || [];

    const date = publication
      ? new Date(publication).toLocaleDateString('ru-RU')
      : 'Дата не указана';

    // === АВТОРЫ ===
    const authorsHTML = authors.length
      ? authors.map(a => {
          const name = a.Name || 'Автор';
          return `<span class="author-chip">${name}</span>`;
        }).join('')
      : '<span class="author-chip">Автор не указан</span>';

    // === КАРТОЧКА (СТАРАЯ ВЕРСТКА) ===
    const card = document.createElement('div');
    card.className = 'article-card';

    card.innerHTML = `
      <article class="article-card-body">

        <div class="article-badges">
          <div class="article-badge article-badge--field">${field}</div>
          <div class="article-badge article-badge--direction">${direction}</div>
        </div>

        <h3 class="article-title">
          <a href="full-article.html?id=${id}" class="article-title-link">
            ${title}
          </a>
        </h3>

        <div class="article-description">
          <strong>Описание: </strong>${description}
        </div>

        <div class="faculty">
          <strong>Факультет:</strong>
          <span class="faculty-name">${faculty}</span>
        </div>

        <time class="article-date">
          <strong>Дата публикации: </strong>${date}
        </time>

        <div class="article-author">
          <strong>Авторы:</strong>
          ${authorsHTML}
        </div>

        ${tags.length ? `
          <div class="article-tags-line">
            ${tags.map(tag => `
              <span class="article-tag-chip">${tag}</span>
            `).join('')}
          </div>
        ` : ''}

      </article>
    `;

    // Клик по карточке
    card.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      window.location.href = `full-article.html?id=${id}`;
    });

    grid.appendChild(card);
  });
}

// ===============================
// 🔍 ЗАГРУЗКА
// ===============================
document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return;

  try {
    const url = new URL('https://special-bear-65dd39b4fc.strapiapp.com/api/articles');

    url.searchParams.append('populate', 'authors');
    url.searchParams.append('populate', 'tags');
    url.searchParams.append('publicationState', 'published');

    const res = await fetch(url);
    const data = await res.json();

    if (!data?.data) throw new Error('Нет data');

    // === НОРМАЛИЗАЦИЯ ===
    allArticles = data.data.map(item => {
      const a = item.attributes || item;

      return {
        id: item.id,

        Title: a.Title,
        Description: a.Description,
        Publication: a.Publication || a.publishedAt,

        faculty: a.Faculty,
        scienceArea: a.ScienceArea,
        scienceDirection: a.ScienceDirection,

        authors: Array.isArray(a.authors)
          ? a.authors.map(x => x.attributes || x)
          : [],

        tags: Array.isArray(a.tags)
          ? a.tags.map(x => (x.attributes || x).Name)
          : []
      };
    });

    renderPage(1);

    // === ПОИСК (если есть) ===
    if (typeof setupSearch === 'function') {
      articleSearch = setupSearch(allArticles, renderPage);
    }

  } catch (err) {
    console.error(err);
    grid.innerHTML = '<p>Ошибка загрузки данных</p>';
  }
});

// ===============================
// 📱 АДАПТИВ
// ===============================
window.addEventListener('resize', () => {
  if (allArticles.length) {
    renderPage(currentPage);
  }
});