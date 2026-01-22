 // Функция загрузки статей из JSON
  async function loadArticles() {
    try {
      const response = await fetch('articles.json');
      const articles = await response.json();

      const container = document.getElementById('articles-grid');
      container.innerHTML = ''; // Очищаем контейнер

      if (articles.length === 0) {
        container.innerHTML = '<div class="loader">Нет доступных статей</div>';
        return;
      }

      // Создаём карточки для каждой статьи
      articles.forEach(article => {
        const card = document.createElement('div');
        card.className = 'article-card';

        // Изображение (если есть)
        if (article.imageUrl) {
          const img = document.createElement('img');
          img.src = article.imageUrl;
          img.alt = `Иллюстрация к статье "${article.title}"`;
          card.appendChild(img);
        }

        // Тело карточки
        const body = document.createElement('div');
        body.className = 'article-card-body';

        const title = document.createElement('h3');
        title.className = 'article-title';
        title.textContent = article.title;

        const meta = document.createElement('div');
        meta.className = 'article-meta';

        meta.innerHTML = `
          <span><span class="icon">👤</span>${article.authors.join(', ')}</span>
          <span><span class="icon">📅</span>${formatDate(article.publishedDate)}</span>
          <span><span class="icon">🌐</span>${article.scienceArea}</span>
        `;

        const abstract = document.createElement('p');
        abstract.className = 'article-abstract';
        abstract.textContent = article.abstract;

        const button = document.createElement('button');
        button.className = 'read-more';
        button.textContent = 'Читать далее';
        button.onclick = () => window.location.href = article.link;

        body.appendChild(title);
        body.appendChild(meta);
        body.appendChild(abstract);
        body.appendChild(button);

        card.appendChild(body);
        container.appendChild(card);
      });
    } catch (error) {
      console.error('Ошибка загрузки статей:', error);
      document.getElementById('articles-grid').innerHTML = 
        '<div class="loader">Не удалось загрузить статьи</div>';
    }
  }

  // Форматируем дату (например, "15 марта 2025")
  function formatDate(dateString) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  }

  // Загружаем статьи при загрузке страницы
  document.addEventListener('DOMContentLoaded', loadArticles);

