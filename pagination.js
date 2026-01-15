 // Здесь ниже будет скрипт для пагинации статей

  // Параметры пагинации
let currentPage = 1;
const itemsPerPage = 6;
let articles = []; // Массив для статей
let totalPages = 0;

// Функция загрузки статей из JSON
async function loadArticles() {
  try {
    const response = await fetch('articles.json');
    if (!response.ok) {
      throw new Error('Не удалось загрузить статьи');
    }
    articles = await response.json();
    totalPages = Math.ceil(articles.length / itemsPerPage);
    renderArticles(1); // Отображаем первую страницу
  } catch (error) {
    console.error('Ошибка загрузки статей:', error);
    document.getElementById('articles-grid').innerHTML = 
      '<p>Ошибка загрузки статей. Попробуйте обновить страницу.</p>';
  }
}

// Функция отображения статей для текущей страницы
function renderArticles(page) {
  currentPage = page;

  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageArticles = articles.slice(startIndex, endIndex);

  const grid = document.getElementById('articles-grid');
  grid.innerHTML = ''; // Очищаем только содержимое сетки


  pageArticles.forEach(article => {
    const card = document.createElement('div');
    card.className = 'article-card'; // Прямой ребёнок grid-контейнера


    card.innerHTML = `
      <div class="article-card-body">
        <h3 class="article-title">${article.title}</h3>
        <p class="article-abstract">${article.summary}</p>
        <div class="article-meta">
          <span>Автор: ${article.author}</span>
          <span>Год: ${article.year}</span>
        </div>
        <button class="read-more">Читать далее</button>
      </div>
    `;

    grid.appendChild(card); // Добавляем прямо в сетку
  });

  updatePagination(page);
}



// Функция обновления пагинации
function updatePagination(currentPage) {
  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'pagination';
  paginationContainer.id = 'pagination-controls';

  // Кнопка "Назад"
  if (currentPage > 1) {
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Назад';
    prevBtn.onclick = () => renderArticles(currentPage - 1);
    paginationContainer.appendChild(prevBtn);
  }

  // Номера страниц
  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.textContent = i;
    pageBtn.className = i === currentPage ? 'active' : '';
    pageBtn.onclick = () => renderArticles(i);
    paginationContainer.appendChild(pageBtn);
  }

  // Кнопка "Вперёд"
  if (currentPage < totalPages) {
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Вперёд →';
    nextBtn.onclick = () => renderArticles(currentPage + 1);
    paginationContainer.appendChild(nextBtn);
  }

  // Заменяем старую пагинацию
  const existingPagination = document.getElementById('pagination-controls');
  if (existingPagination) {
    existingPagination.replaceWith(paginationContainer);
  } else {
    document.getElementById('main').appendChild(paginationContainer);
  }
}

// Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  loadArticles();
});