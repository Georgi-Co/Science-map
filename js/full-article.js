
// full-article.js
// Получаем ID статьи из URL
function getArticleIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// Форматируем дату
function formatDate(dateString) {
  if (!dateString) return 'Дата не указана';
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// Загружаем и отображаем статью
async function loadArticle() {
  const articleId = getArticleIdFromUrl();

  const container = document.getElementById('full-article');
  const loading = document.getElementById('loading');

  // ✅ Проверяем, что элементы существуют
  if (!container) {
    console.error('❌ #full-article не найден. Проверь разметку.');
    return;
  }

  if (!loading) {
    console.warn('⚠️ #loading не найден — индикатор загрузки не будет убран.');
  } else {
    // Убираем индикатор загрузки
    loading.style.display = 'none'; // Лучше, чем remove(), если он нужен позже
  }

  if (!articleId) {
    container.innerHTML = '<p>❌ Не указан ID статьи. Пример: <code>article.html?id=3</code></p>';
    return;
  }

  try {
    // ✅ Работающий populate для одного элемента
    const url = new URL(`http://localhost:1337/api/articles/${articleId}`);
    url.searchParams.append('populate', 'Image,authors.Image');

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Ошибка: ${response.status}`);
    }

    const data = await response.json();
    const article = data.data;

    if (!article) {
      container.innerHTML = '<p>❌ Статья не найдена или не опубликована.</p>';
      return;
    }

    const attrs = article.attributes;
    const title = attrs.Title || 'Без заголовка';
    const contentBlocks = attrs.Content || [];
    const publication = attrs.Publication;
    const imageUrl = attrs.Image?.data?.[0]?.attributes?.url;
    const imageAlt = attrs.Image?.data?.[0]?.attributes?.name || title;

    const authorData = attrs.authors?.data?.[0];
    const authorName = authorData?.attributes?.Name || 'Автор не указан';
    const authorId = authorData?.id;

    // Генерация контента
    const contentHTML = contentBlocks
      .map(block => {
        if (block.type === 'paragraph') {
          return `<p>${block.children.map(child => child.text).join('')}</p>`;
        }
        if (block.type === 'heading') {
          const level = block.level || 2;
          return `<h${level}>${block.children.map(child => child.text).join('')}</h${level}>`;
        }
        return '';
      })
      .join('');

    // Формируем разметку
    container.innerHTML = `
      <header class="article-header">
        <h1>${title}</h1>
        <time datetime="${publication}" class="article-date">
          📅 Опубликовано: ${formatDate(publication)}
        </time>
        <div class="article-author">
          👤 Автор: ${authorId 
            ? `<a href="/author.html?id=${authorId}" class="author-link">${authorName}</a>` 
            : authorName}
        </div>
      </header>

      ${imageUrl 
        ? `<img 
            src="http://localhost:1337${imageUrl}" 
            alt="${imageAlt}" 
            class="article-full-image"
            loading="lazy">` 
        : ''}

      <div class="article-body">
        ${contentHTML}
      </div>

      <footer class="article-footer">
        <a href="/" class="back-link">← Вернуться к списку статей</a>
      </footer>
    `;

  } catch (error) {
    console.error('❌ Ошибка загрузки статьи:', error);
    container.innerHTML = `
      <p>Ошибка загрузки статьи. Проверь:</p>
      <ul>
        <li>Работает ли Strapi: <a href="http://localhost:1337">http://localhost:1337</a></li>
        <li>Опубликована ли статья с ID=${articleId}</li>
        <li>Правильно ли указан <code>id="full-article"</code></li>
      </ul>
    `;
  }
}

// Запускаем при загрузке
document.addEventListener('DOMContentLoaded', loadArticle);


