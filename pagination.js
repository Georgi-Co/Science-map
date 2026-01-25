
// pagination.js
// Автономный модуль пагинации — вставляет пагинацию сверху и снизу .articles-grid

function createPagination(currentPage = 1, totalPages = 1, containerSelector = '#articles-container') {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.warn(`Контейнер "${containerSelector}" не найден. Пагинация не будет добавлена.`);
    return;
  }

  const articlesGrid = container.querySelector('.articles-grid');
  if (!articlesGrid) {
    console.warn('❌ .articles-grid не найден внутри контейнера. Пагинация не добавлена.');
    return;
  }

  // Удаляем старые блоки пагинации, если есть
  container.querySelectorAll('.pagination').forEach(el => el.remove());

  // Генерация HTML пагинации
  const generatePaginationHTML = () => {
    const prevButton = `
      <button class="pagination-prev" ${currentPage <= 1 ? 'disabled' : ''} aria-label="Предыдущая страница">
        &lt; Назад
      </button>
    `;

    const pageButtons = Array.from({ length: totalPages }, (_, i) => {
      const page = i + 1;
      const isActive = page === currentPage;
      return `
        <button 
          class="pagination-page ${isActive ? 'active' : ''}" 
          data-page="${page}"
          aria-label="Страница ${page}" 
          ${isActive ? 'aria-current="page"' : ''}>
          ${page}
        </button>
      `;
    }).join('');

    const nextButton = `
      <button class="pagination-next" ${currentPage >= totalPages ? 'disabled' : ''} aria-label="Следующая страница">
        Вперёд &gt;
      </button>
    `;

    return `<div class="pagination-controls">${prevButton} ${pageButtons} ${nextButton}</div>`;
  };

  const paginationHTML = generatePaginationHTML();

  // Создаём верхнюю пагинацию
  const topPagination = document.createElement('div');
  topPagination.className = 'pagination';
  topPagination.innerHTML = paginationHTML;

  // Создаём нижнюю пагинацию
  const bottomPagination = document.createElement('div');
  bottomPagination.className = 'pagination';
  bottomPagination.innerHTML = paginationHTML;

  // Вставляем: до и после .articles-grid
  container.insertBefore(topPagination, articlesGrid);
  container.insertBefore(bottomPagination, articlesGrid.nextSibling);
}

// Экспортируем только функцию (для браузера — глобально)
// Можно вызывать из script.js: createPagination(1, 5);



