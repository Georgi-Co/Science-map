

// search.js — логика поиска

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

    // Сохраняем исходные статьи (неизменённые)
    this.originalArticles = [...articles];
    // Текущий набор статей (может меняться при фильтрации)
    this.currentArticles = [...articles];

    // Активный тег из URL (если задан ?tag=...)
    const params = new URLSearchParams(window.location.search);
    this.activeTag = params.get('tag') ? params.get('tag').toLowerCase() : null;
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

      // Сбрасываем выпадающие списки фильтров в исходное состояние
      const facultySelect = document.querySelector('select[name="faculty-area-list"]');
      const areaSelect = document.querySelector('select[name="science-area-list"]');
      const directionSelect = document.querySelector('select[name="science-direction-list"]');

      if (facultySelect) facultySelect.selectedIndex = 0;
      if (areaSelect) areaSelect.selectedIndex = 0;
      if (directionSelect) directionSelect.selectedIndex = 0;

      console.log('[Clear] Сброс статей к оригиналу');
      this.currentArticles = [...this.originalArticles]; // Возвращаем все статьи
      // Обновляем глобальный массив, который использует renderPage() из script.js
      allArticles = this.currentArticles;

      // Сбрасываем активный тег и очищаем параметр ?tag в URL
      this.activeTag = null;
      const url = new URL(window.location.href);
      url.searchParams.delete('tag');
      window.history.replaceState({}, '', url.toString());

      console.log('[Clear] Удаление сообщения');
      this.showMessage(null); // Скрываем сообщение об отсутствии результатов


      console.log('[Clear] Перерисовка страницы');
      this.renderPage(1); // Перерисовываем первую страницу
    });
  }

  // Читаем текущее состояние фильтров (выпадающие списки)
  getFilters() {
    const facultySelect = document.querySelector('select[name="faculty-area-list"]');
    const areaSelect = document.querySelector('select[name="science-area-list"]');
    const directionSelect = document.querySelector('select[name="science-direction-list"]');

    const facultyValue = facultySelect?.value || 'All';
    const areaValue = areaSelect?.value || 'All';
    const directionValue = directionSelect?.value || 'All';

    const facultyLabel = facultySelect?.selectedOptions?.[0]?.textContent?.trim().toLowerCase() || '';
    const areaLabel = areaSelect?.selectedOptions?.[0]?.textContent?.trim().toLowerCase() || '';
    const directionLabel = directionSelect?.selectedOptions?.[0]?.textContent?.trim().toLowerCase() || '';

    const filters = {
      facultyValue,
      facultyLabel,
      areaValue,
      areaLabel,
      directionValue,
      directionLabel
    };

    console.log('[getFilters] Текущее состояние фильтров:', filters);
    return filters;
  }

  handleSearch() {
    // Получаем запрос из поля ввода, убираем пробелы и приводим к нижнему регистру
    const query = this.searchField.value.trim().toLowerCase();
    console.log('[handleSearch] Запрос:', query || 'пустой');

    // Читаем текущее состояние фильтров
    const filters = this.getFilters();

    // Запускаем фильтрацию по запросу и фильтрам
    this.performSearch(query, filters);
  }

  performSearch(query, filtersFromArgs = null) {
    console.log('[performSearch] Начало фильтрации. Запрос:', query);
    console.log('[performSearch] Исходных статей:', this.originalArticles.length);

    // Нормализуем запрос: убираем пробелы и приводим к нижнему регистру
    const normalizedQuery = (query || '').trim().toLowerCase();
    const hasQuery = normalizedQuery.length > 0;

    // Читаем фильтры: либо из аргумента (при клике по кнопке), либо из DOM (при updateArticles)
    const filters = filtersFromArgs || this.getFilters();

    const hasTagFilter = !!this.activeTag;

    const hasAnyFilter =
      filters.facultyValue !== 'All' ||
      filters.areaValue !== 'All' ||
      filters.directionValue !== 'All';

    // Если запроса нет, тегов нет и все фильтры в положении "Все" — показываем все статьи без фильтрации
    if (!hasQuery && !hasAnyFilter && !hasTagFilter) {
      console.log('[performSearch] Пустой запрос и фильтры по умолчанию — показываем все статьи');
      this.currentArticles = [...this.originalArticles];
      this.showMessage(null);
      // Обновляем глобальный массив, который использует renderPage() из script.js
      allArticles = this.currentArticles;
      this.renderPage(1);
      return;
    }

    this.currentArticles = this.originalArticles.filter(article => {
      // === 1. Поиск по ключевым словам ===
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

      if (Array.isArray(contentBlocks)) {
        for (const block of contentBlocks) {
          if (block && block.children && Array.isArray(block.children)) {
            for (const child of block.children) {
              if (child && child.text) {
                contentText += child.text + ' ';
              }
            }
          }
        }
      }
      contentText = contentText.toLowerCase();

      // === 1. Поиск по ключевым словам ===
      // Если запрос пустой - пропускаем все статьи по ключевым словам
      // Если запрос есть - ОБЯЗАТЕЛЬНО должно быть совпадение хотя бы в одном поле
      let matchesKeyword = true; // По умолчанию пропускаем все (если запрос пустой)

      if (hasQuery) {
        // Разбиваем запрос на отдельные слова для более точного поиска
        const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 0);

        if (queryWords.length > 0) {
          // Проверяем, что хотя бы ОДНО слово из запроса найдено в любом из полей (OR логика)
          // Это означает: если пользователь ввёл "экономика финансы", 
          // то найдёт статьи, где есть хотя бы одно из этих слов
          matchesKeyword = queryWords.some(word => {
            const wordFound = (
              title.includes(word) ||
              authorName.includes(word) ||
              contentText.includes(word)
            );
            return wordFound;
          });

          // Альтернативный вариант: ВСЕ слова должны быть найдены (AND логика)
          // Раскомментируйте следующую строку и закомментируйте предыдущую, если нужна AND логика:
          // matchesKeyword = queryWords.every(word => title.includes(word) || authorName.includes(word) || contentText.includes(word));

          if (!matchesKeyword) {
            console.log(`[performSearch] Статья "${article.Title}" не содержит ключевых слов "${normalizedQuery}"`);
          }
        } else {
          matchesKeyword = false; // Если запрос состоит только из пробелов
        }
      }

      // === 2. Фильтры по выпадающим спискам ===
      const facultyName = (article.faculty || '').toLowerCase();
      const scienceAreaName = (article.scienceArea || '').toLowerCase();
      const scienceDirectionName = (article.scienceDirection || '').toLowerCase();

      const matchesFaculty =
        filters.facultyValue === 'All' ||
        (facultyName && facultyName.includes(filters.facultyLabel));

      const matchesArea =
        filters.areaValue === 'All' ||
        (scienceAreaName && scienceAreaName.includes(filters.areaLabel));

      const matchesDirection =
        filters.directionValue === 'All' ||
        (scienceDirectionName && scienceDirectionName.includes(filters.directionLabel));

      // === 3. Фильтр по тегу (если задан activeTag) ===
      const articleTags = Array.isArray(article.tags) ? article.tags : [];
      const matchesTag =
        !this.activeTag ||
        articleTags.some(tag => (tag || '').toLowerCase() === this.activeTag);

      // Статья проходит фильтр только если:
      // 1. Совпадает по ключевым словам (если они указаны)
      // 2. И совпадает по всем активным фильтрам
      // 3. И соответствует активному тегу (если он задан)
      const passesFilter = matchesKeyword && matchesFaculty && matchesArea && matchesDirection && matchesTag;

      if (passesFilter && hasQuery) {
        console.log(`[performSearch] Статья "${article.Title}" прошла фильтр по запросу "${normalizedQuery}"`);
      }

      return passesFilter;
    });

    // Обработка результатов
    if (this.currentArticles.length === 0) {
      console.log('[performSearch] Нет результатов');
      this.showMessage('❌ Ничего не найдено.');
    } else {
      console.log('[performSearch] Найдено статей:', this.currentArticles.length);
      this.showMessage(null);
    }

    // Обновляем глобальный массив с текущими статьями,
    // который использует renderPage() из script.js
    allArticles = this.currentArticles;
    console.log('[performSearch] Обновление allArticles:', allArticles.length);
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
      const scientificField = article.scienceArea || '';
      const researchDirection = article.scienceDirection || '';
      const faculty = article.faculty || '';

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
        ? `<a href="author.html?id=${authorId}">${authorName}</a>`
        : authorName;

      // Получаем функцию перевода
      const t = (key) => window.localization?.getTranslation?.(key) || key;

      // Локализованные названия плашек
      const fieldDisplay = scientificField ? t(scientificField) : t('Научная область не указана');
      const directionDisplay = researchDirection ? t(researchDirection) : t('Научное направление не указано');
      const facultyDisplay = faculty ? faculty : t('Не указан');

      // Создаём элемент-контейнер для карточки статьи
      const card = document.createElement('div');
      card.className = 'article-card'; // Назначаем CSS-класс для стилизации


      // Формируем HTML-содержимое карточки
      card.innerHTML = `
        <article class="article-card-body">
          <div class="article-badges" aria-label="${t('Научная область')} ${t('Научное направление')}">
            <div class="article-badge article-badge--field" title="${fieldDisplay}">${fieldDisplay}</div>
            <div class="article-badge article-badge--direction" title="${directionDisplay}">${directionDisplay}</div>
          </div>
          <h3 class="article-title">
            <a href="full-article.html?id=${id}" class="article-title-link">${title}</a>
          </h3>
          <div class="article-preview">${previewText}</div>
          <div class="faculty" aria-label="${t('Факультет:')}">${t('Факультет:')} <span class="faculty-name">${facultyDisplay}</span></div>
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

    // Всегда перезапускаем поиск/фильтрацию с учётом текущего запроса и фильтров
    console.log('[updateArticles] Перезапуск поиска с текущим запросом и фильтрами');
    this.performSearch(this.searchField.value.trim().toLowerCase());

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





