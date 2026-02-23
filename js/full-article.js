
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
    url.searchParams.append('populate', 'Media,authors.Avatar');

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
    // Media может быть массивом или одним объектом
    const mediaData = attrs.Media?.data;
    const imageUrl = Array.isArray(mediaData) && mediaData.length > 0 
      ? mediaData[0]?.attributes?.url 
      : mediaData?.attributes?.url;
    const imageAlt = Array.isArray(mediaData) && mediaData.length > 0
      ? mediaData[0]?.attributes?.name || mediaData[0]?.attributes?.alternativeText || title
      : mediaData?.attributes?.name || mediaData?.attributes?.alternativeText || title;

    const authorData = attrs.authors?.data?.[0];
    const authorName = authorData?.attributes?.Name || 'Автор не указан';
    const authorId = authorData?.id;

    // Генерация контента
    const contentHTML = Array.isArray(contentBlocks) && contentBlocks.length > 0
      ? contentBlocks
          .map(block => {
            if (!block || !block.type) return '';
            
            if (block.type === 'paragraph') {
              const text = block.children && Array.isArray(block.children)
                ? block.children.map(child => child?.text || '').join('')
                : '';
              return text ? `<p>${text}</p>` : '';
            }
            
            if (block.type === 'heading') {
              const level = block.level || 2;
              const text = block.children && Array.isArray(block.children)
                ? block.children.map(child => child?.text || '').join('')
                : '';
              return text ? `<h${level}>${text}</h${level}>` : '';
            }
            
            return '';
          })
          .filter(html => html !== '')
          .join('')
      : '<p>Содержимое статьи отсутствует.</p>';

    // Формируем разметку
    container.innerHTML = `
      <header class="article-header">
        <h1>${title}</h1>
        <time datetime="${publication}" class="article-date">
          📅 Опубликовано: ${formatDate(publication)}
        </time>
        <div class="article-author">
          👤 Автор: ${authorId 
            ? `<a href="author.html?id=${authorId}" class="author-link">${authorName}</a>` 
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
        <a href="index.html" class="back-link">← Вернуться к списку статей</a>
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


