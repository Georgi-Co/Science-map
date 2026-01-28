
// pagination.js — клиентская пагинация с перепривязкой обработчиков

/**
 * Создаёт пагинацию сверху и снизу .articles-grid
 * @param {number} currentPage — текущая страница
 * @param {number} totalPages — общее количество страниц
 * @param {string} containerSelector — селектор контейнера
 */
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

  // Удаляем старые блоки пагинации
  container.querySelectorAll('.pagination').forEach(el => el.remove());

  // Генерация HTML
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

  // Вставляем сверху
  const topPagination = document.createElement('div');
  topPagination.className = 'pagination';
  topPagination.innerHTML = paginationHTML;

  // Вставляем снизу
  const bottomPagination = document.createElement('div');
  bottomPagination.className = 'pagination';
  bottomPagination.innerHTML = paginationHTML;

  container.insertBefore(topPagination, articlesGrid);
  container.insertBefore(bottomPagination, articlesGrid.nextSibling);

  // === ПЕРЕПРИВЯЗКА ОБРАБОТЧИКОВ ===
  // Вызываем после вставки новых кнопок
  bindPaginationEvents(currentPage, totalPages);
}

/**
 * Привязывает события к новым кнопкам пагинации
 * Вызывается каждый раз после создания пагинации
 */
function bindPaginationEvents(currentPage, totalPages) {
  // Обработчик "Назад"
  document.querySelectorAll('.pagination-prev').forEach(btn => {
    btn.onclick = () => {
      if (currentPage > 1) {
        renderPage(currentPage - 1); // ← использует глобальную renderPage
      }
    };
  });

  // Обработчик "Вперёд"
  document.querySelectorAll('.pagination-next').forEach(btn => {
    btn.onclick = () => {
      if (currentPage < totalPages) {
        renderPage(currentPage + 1);
      }
    };
  });

  // Обработчик номеров страниц
  document.querySelectorAll('.pagination-page').forEach(btn => {
    btn.onclick = () => {
      const page = parseInt(btn.dataset.page);
      if (page >= 1 && page <= totalPages) {
        renderPage(page);
      }
    };
  });
}





