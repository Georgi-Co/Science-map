// Параметры пагинации
let currentPage = 1;
const itemsPerPage = 6;
let articles = [];
let totalPages = 0;

// Загрузка статей (с подробной диагностикой)
async function loadArticles() {
  try {
    console.log('Начинаем загрузку articles.json...');
    
    const response = await fetch('articles.json');
    
    if (!response.ok) {
      throw new Error(`HTTP ошибка! Статус: ${response.status}`);
    }
    
    console.log('Ответ получен. Пытаемся разобрать JSON...');
    articles = await response.json();
    
    console.log('JSON успешно загружен:', articles);
    
    totalPages = Math.ceil(articles.length / itemsPerPage);
    renderArticles(1);
    
  } catch (error) {
    console.error('Критическая ошибка при загрузке статей:', error);
    
    // Выводим подробную информацию в интерфейс
    const grid = document.getElementById('articles-grid');
    if (grid) {
      grid.innerHTML = `
        <div style="color:red; padding:20px;">
          <h3>Ошибка загрузки статей</h3>
          <p><strong>Сообщение:</strong> ${error.message}</p>
          <p>Проверьте:</p>
          <ul>
            <li>Наличие файла <code>articles.json</code> в корне сайта</li>
            <li>Корректность JSON (нет синтаксических ошибок)</li>
            <li>Путь к файлу в коде (<code>fetch('articles.json')</code>)</li>
          </ul>
        </div>
      `;
    }
  }
}

// Отображение статей (без изменений)
function renderArticles(page) {
  currentPage = page;
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageArticles = articles.slice(startIndex, endIndex);


  const grid = document.getElementById('articles-grid');
  if (!grid) return;

  grid.innerHTML = '';

  pageArticles.forEach(article => {
    const card = document.createElement('div');
    card.className = 'article-card';


    card.innerHTML = `
      <div class="article-card-body">
        <h3 class="article-title">${article.title || 'Без названия'}</h3>
        <p class="article-abstract">${article.abstract || 'Нет описания'}</p>
        <div class="article-meta">
          <span>Автор: ${article.authors || 'Неизвестен'}</span>
          <span>Год: ${article.publishedDate || 'Н/Д'}</span>
        </div>
        <button class="read-more">Читать далее</button>
      </div>
    `;

    grid.appendChild(card);
  });

  updatePagination(page);
}

function updatePagination(currentPage) {
  const createPagination = () => {
    const container = document.createElement('div');
    container.className = 'pagination';

    // Кнопка "Назад"
    if (currentPage > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.textContent = '← Назад';
      prevBtn.addEventListener('click', () => renderArticles(currentPage - 1));
      container.appendChild(prevBtn);
    }

    // Номера страниц
    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.textContent = i;
      pageBtn.className = i === currentPage ? 'active' : '';
      pageBtn.addEventListener('click', () => renderArticles(i));
      container.appendChild(pageBtn);
    }

    // Кнопка "Вперёд"
    if (currentPage < totalPages) {
      const nextBtn = document.createElement('button');
      nextBtn.textContent = 'Вперёд →';
      nextBtn.addEventListener('click', () => renderArticles(currentPage + 1));
      container.appendChild(nextBtn);
    }

    return container;
  };

  // Получаем элементы
  const main = document.querySelector('main');
  const articlesGrid = document.getElementById('articles-grid');
  const articlesContainer = document.getElementById('articles-container'); // Родитель grid

  // Проверяем существование элементов
  if (!main) {
    console.error('❌ Элемент <main> не найден в DOM!');
    return;
  }
  if (!articlesGrid) {
    console.error('❌ Элемент #articles-grid не найден в DOM!');
    return;
  }
  if (!articlesContainer) {
    console.error('❌ Элемент #articles-container не найден в DOM!');
    return;
  }

  // Удаляем старые пагинации
  document.querySelectorAll('.pagination').forEach(el => el.remove());

  // Вставляем верхнюю пагинацию (перед #articles-grid внутри #articles-container)
  const topPagination = createPagination();
  articlesContainer.insertBefore(topPagination, articlesGrid);

  // Вставляем нижнюю пагинацию (после #articles-grid внутри #articles-container)
  const bottomPagination = createPagination();
  articlesContainer.appendChild(bottomPagination);

  console.log('✅ Пагинация обновлена(сверху и снизу))');
}


// Запуск после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  loadArticles();
});



