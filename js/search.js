

// search.js — расширенная версия с отладкой

class ArticleSearch {
  constructor(articles, renderPageFunction) {
    console.log('[ArticleSearch] Конструктор вызван');
    
      // Выводим структуру первой статьи для анализа
  if (articles.length > 0) {
    console.log('[ArticleSearch] Пример структуры статьи:', {
      id: articles[0].id,
      Title: articles[0].Title,
      title: articles[0].title,
      Content: Array.isArray(articles[0].Content) ? articles[0].Content.length : 'нет',
      content: Array.isArray(articles[0].content) ? articles[0].content.length : 'нет',
      authors: Array.isArray(articles[0].authors) ? articles[0].authors.length : 'нет'
    });
  }

    // Вставьте после класса ArticleSearch
  function testSearch() {
    const testArticles = [
      { id: 1, Title: "JavaScript для начинающих", Content: [{ children: [{ text: "Основы JS" }] }], authors: [{ Name: "Алексей" }] },
      { id: 2, Title: "CSS Grid", Content: [{ children: [{ text: "Верстка" }] }, { children: [{ text: "Адаптивность" }] }] }
    ];

    const search = new ArticleSearch(testArticles, () => console.log("Тест рендера"));
    search.performSearch("JS"); // Должно найти первую статью
    console.log("Результаты теста:", search.currentArticles);
  }

  // Вызовите тест (раскомментируйте для проверки)
  // testSearch();

  
  this.originalArticles = [...articles];

    // Сохраняем исходные статьи (неизменённые)
    this.originalArticles = [...articles];
    // Текущий набор статей (может меняться при фильтрации)
    this.currentArticles = [...articles];
    // Функция для перерисовки страниц (передаётся извне)
    this.renderPage = renderPageFunction;

    // Поиск DOM-элементов по ID
    this.searchField = document.getElementById('search-field');
    this.searchButton = document.getElementById('search-button');
    this.clearButton = document.getElementById('clear-button');

    // Проверка наличия элементов в DOM
    if (!this.searchField) {
      console.error('❌ #search-field не найден в DOM');
    } else {
      console.log('[ArticleSearch] #search-field найден');
    }

    if (!this.searchButton) {
      console.error('❌ #search-button не найден в DOM');
    } else {
      console.log('[ArticleSearch] #search-button найден');
    }

    if (!this.clearButton) {
      console.error('❌ #clear-button не найден в DOM');
    } else {
      console.log('[ArticleSearch] #clear-button найден');
    }

    console.log('🔧 ArticleSearch инициализирован с', articles.length, 'статьями');
    // Привязываем обработчики событий
    this.init();
  }

  init() {
    console.log('[init] Привязка обработчиков событий');

    // Обработчик клика на кнопку поиска
    this.searchButton.addEventListener('click', (e) => {
      console.log('[Event] Клик на #search-button');
      e.preventDefault(); // Блокируем стандартное действие (например, отправку формы)
      this.handleSearch(); // Запускаем поиск
    });

    // Обработчик нажатия Enter в поле поиска
    this.searchField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        console.log('[Event] Enter в #search-field');
        e.preventDefault();
        this.handleSearch();
      }
    });

    // Обработчик клика на кнопку очистки
    this.clearButton.addEventListener('click', (e) => {
      console.log('[Event] Клик на #clear-button');
      e.preventDefault(); // Гарантируем отсутствие стандартного действия

      console.log('[Clear] Очистка поля поиска');
      this.searchField.value = ''; // Очищаем поле ввода

      console.log('[Clear] Сброс статей к оригиналу');
      this.currentArticles = [...this.originalArticles]; // Возвращаем все статьи
      window.allArticles = this.currentArticles; // Обновляем глобальную переменную

      console.log('[Clear] Удаление сообщения');
      this.showMessage(null); // Скрываем сообщение об отсутствии результатов


      console.log('[Clear] Перерисовка страницы');
      this.renderPage(1); // Перерисовываем первую страницу
    });
  }

  handleSearch() {
    // Получаем запрос из поля ввода, убираем пробелы и приводим к нижнему регистру
    const query = this.searchField.value.trim().toLowerCase();
    console.log('[handleSearch] Запрос:', query || 'пустой');
    // Запускаем фильтрацию по запросу
    this.performSearch(query);
  }

  performSearch(query) {
    console.log('[performSearch] Начало фильтрации. Запрос:', query);
    console.log('[performSearch] Исходных статей:', this.originalArticles.length);

 if (!query || query.trim() === '') {
    console.log('[performSearch] Пустой запрос — сброс фильтра');
    this.currentArticles = [...this.originalArticles];
    this.showMessage(null);
    return;
  }

  // Нормализуем запрос: убираем пробелы и приводим к нижнему регистру
  const normalizedQuery = query.trim().toLowerCase();

  this.currentArticles = this.originalArticles.filter(article => {
    // Безопасное получение и нормализация полей
    const title = (article.Title || article.title || '').toLowerCase();
    const authorName = (
      article.authors?.[0]?.Name ||
      article.authors?.[0]?.name ||
      ''
    ).toLowerCase();

    // Собираем весь текст из контента (с проверкой на существование полей)
    let contentText = '';
    const contentBlocks = article.Content || article.content || [];
    
    for (const block of contentBlocks) {
      if (block.children && Array.isArray(block.children)) {
        for (const child of block.children) {
          if (child.text) {
            contentText += child.text + ' ';
          }
        }
      }
    }
    contentText = contentText.toLowerCase();

    // Проверяем совпадение по любому из полей
    return (
      title.includes(normalizedQuery) ||
      authorName.includes(normalizedQuery) ||
      contentText.includes(normalizedQuery)
    );
  });

  // Обработка результатов
  if (this.currentArticles.length === 0) {
    console.log('[performSearch] Нет результатов');
    this.showMessage('❌ Ничего не найдено.');
  } else {
    console.log('[performSearch] Найдено статей:', this.currentArticles.length);
    this.showMessage(null);
  }

    // Обновляем глобальную переменную с текущими статьями
    window.allArticles = this.currentArticles;
    console.log('[performSearch] Обновление window.allArticles:', window.allArticles.length);
    // Перерисовываем первую страницу с отфильтрованными статьями
    this.renderPage(1);
  }

  showMessage(text) {
    // Находим контейнер для статей
    const grid = document.querySelector('.articles-grid');
    if (!grid) {
      console.warn('[showMessage] .articles-grid не найден в DOM');
      return;
    }

    console.log('[showMessage] Обновление grid.innerHTML:', text || 'очищено');
    // Если text есть — отображаем его в параграфе, иначе очищаем контейнер
    grid.innerHTML = text ? `<p>${text}</p>` : '';
  }

  renderPage(page = 1) {

  console.log('[renderPage] Вызов с page=', page);
  
  const articlesPerPage = getArticlesPerPage();
  console.log('[renderPage] Статьи на страницу:', articlesPerPage);


  // Используем currentArticles (отфильтрованные данные), а не window.allArticles
  const start = (page - 1) * articlesPerPage;
  const end = start + articlesPerPage;
  const articlesToShow = this.currentArticles.slice(start, end);

  const grid = document.querySelector('.articles-grid');
  if (!grid) {
    console.error('[renderPage] .articles-grid не найден');
    return;
  }

  grid.innerHTML = ''; // Очищаем контейнер

  if (articlesToShow.length === 0) {
    grid.innerHTML = '<p class="no-articles">Нет статей для отображения.</p>';
    console.log('[renderPage] Нет статей для отображения');
    return;
  }

    // Для каждой статьи создаём карточку и добавляем в контейнер
    articlesToShow.forEach(article => {
      const id = article.id;
      const title = article.Title || article.title || 'Без заголовка';
      const contentBlocks = article.Content || article.content || [];
      const publication = article.Publication || article.publication || article.publishedAt;
      const authors = Array.isArray(article.authors) ? article.authors : [];

      // Формируем превью текста (первые 2 абзаца, до 200 символов)
      const previewText = contentBlocks
        .filter(block => block.type === 'paragraph')
        .slice(0, 2)
        .map(block => {
          if (!block.children) return '';
          return block.children.map(child => child.text || '').join('');
        })
        .join(' ')
        .substring(0, 200) + '...';

            // Форматируем дату публикации
      const date = publication
        ? new Date(publication).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })
        : 'Дата не указана';

      // Обработка информации об авторе
      const author = authors[0] || null; // Берём первого автора из массива (если есть)
      const authorName = author?.Name || author?.name || 'Автор не указан'; // Пытаемся получить имя (с учётом разных вариантов поля)
      const authorId = author?.id; // Получаем ID автора для формирования ссылки


      // Формируем ссылку на автора, если есть ID, иначе используем просто имя
      const authorLink = authorId
        ? `<a href="../html/author.html?id=${authorId}">${authorName}</a>`
        : authorName;

      // Создаём элемент-контейнер для карточки статьи
      const card = document.createElement('div');
      card.className = 'article-card'; // Назначаем CSS-класс для стилизации


      // Формируем HTML-содержимое карточки
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

      // Добавляем созданную карточку в контейнер .articles-grid
      grid.appendChild(card);
    });

    // Выводим в консоль количество отрисованных карточек (для отладки)
      console.log('[renderPage] Отрисовано карточек:', document.querySelectorAll('.article-card').length);

      // Инициализация пагинации
      if (typeof createPagination === 'function') {
        const totalPages = Math.ceil(this.currentArticles.length / articlesPerPage);
        createPagination(page, totalPages);
      } else {
        console.warn('[renderPage] Функция createPagination не найдена');
      }
    }

  // Метод для обновления списка статей (например, при динамической загрузке новых данных)
  updateArticles(articles) {
    console.log('[updateArticles] Обновление списка статей. Новое количество:', articles.length);
    
    // Обновляем исходный массив статей
    this.originalArticles = [...articles];
    
    // Если поле поиска пустое — сбрасываем текущий набор к новым данным
    if (!this.searchField.value.trim()) {
      console.log('[updateArticles] Поиск пуст — сброс к оригиналу');
      this.currentArticles = [...articles];
      window.allArticles = [...articles];
    } else {
      // Иначе — перезапускаем поиск с текущим запросом
      console.log('[updateArticles] Перезапуск поиска с текущим запросом');
      this.performSearch(this.searchField.value.trim().toLowerCase());
    }
    
    // Перерисовываем первую страницу с обновлёнными данными
    this.renderPage(1);
  }
}

// Глобальная переменная для хранения экземпляра ArticleSearch
let articleSearch = null;


// Функция для инициализации поиска (внешняя точка входа)
function setupSearch(articles, renderPage) {
  console.log('[setupSearch] Инициализация поиска');
  
  // Проверка корректности входных данных
  if (!articles || !Array.isArray(articles)) {
    console.error('[setupSearch] Некорректные данные статей:', articles);
    return null;
  }
  
  if (typeof renderPage !== 'function') {
    console.error('[setupSearch] renderPage не является функцией');
    return null;
  }
  
  // Создаём экземпляр класса и сохраняем в глобальную переменную
  articleSearch = new ArticleSearch(articles, renderPage);
  
  console.log('[setupSearch] ArticleSearch создан:', articleSearch);
  return articleSearch;
}

// Сообщение о загрузке скрипта (для отладки)
console.log('✅ search.js загружен');




