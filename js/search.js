
// search.js — клиентский поиск по статьям (по кнопке)

class ArticleSearch {
  constructor(articles, renderPageFunction) {
    this.originalArticles = [...articles]; // Сохраняем оригинал
    this.currentArticles = [...articles];  // Текущий список
    this.renderPage = renderPageFunction;  // Функция пагинации
    this.searchField = document.getElementById('search-field');
    this.searchButton = document.getElementById('search-button');
    this.clearButton = document.getElementById('clear-search');

    if (!this.searchField) {
      console.warn('❌ Поле поиска #search-field не найдено');
      return;
    }

    console.log('🔧 ArticleSearch: инициализирован с', articles.length, 'статьями');

    this.init();
  }

  init() {
    // Поиск по клику на кнопку "Поиск"
    if (this.searchButton) {
      this.searchButton.addEventListener('click', () => {
        this.handleSearch();
      });
    }

    // Поиск по нажатию Enter в поле
    this.searchField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleSearch();
      }
    });

    // Очистка поиска
    if (this.clearButton) {
      this.clearButton.addEventListener('click', () => {
        this.searchField.value = '';
        this.currentArticles = [...this.originalArticles];
        window.allArticles = this.currentArticles;
        this.showMessage(null);
        this.renderPage(1);
      });
    }
  }

  handleSearch() {
    const query = this.searchField.value.trim().toLowerCase();
    this.performSearch(query);
  }

  performSearch(query) {
    if (query === '') {
      this.currentArticles = [...this.originalArticles];
      this.showMessage(null);
    } else {
      this.currentArticles = this.originalArticles.filter(article => {
        const title = (article.Title || '').toLowerCase();
        const contentText = (article.Content || [])
          .map(block => block.children?.map(child => child.text).join(' ') || '')
          .join(' ')
          .toLowerCase();
        const author = (article.authors?.[0]?.Name || '').toLowerCase();

        return (
          title.includes(query) ||
          contentText.includes(query) ||
          author.includes(query)
        );
      });

      if (this.currentArticles.length === 0) {
        this.showMessage('❌ Ничего не найдено по вашему запросу.');
        return;
      } else {
        this.showMessage(null);
      }
    }

    // Обновляем глобальный массив и рендерим первую страницу
    window.allArticles = this.currentArticles;
    this.renderPage(1);
  }

  showMessage(text) {
    const grid = document.querySelector('.articles-grid');
    if (!grid) return;

    if (text) {
      grid.innerHTML = `<p>${text}</p>`;
    }
    // Если text = null — ничего не делаем, renderPage сам перерисует
  }

  // Можно вызвать вручную, если статьи обновились
  updateArticles(articles) {
    this.originalArticles = [...articles];
    if (this.searchField.value.trim() === '') {
      this.currentArticles = [...articles];
      window.allArticles = [...articles];
    } else {
      this.performSearch(this.searchField.value.trim().toLowerCase());
    }
  }
}

// Глобальная переменная для доступа (если понадобится)
let articleSearch = null;

// Инициализация — вызывается из script.js
function setupSearch(articles, renderPage) {
  articleSearch = new ArticleSearch(articles, renderPage);
  return articleSearch;
}

console.log('✅ search.js: загружен и готов к работе');
