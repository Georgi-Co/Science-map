
// script.js — под формат данных в Strapi
document.addEventListener('DOMContentLoaded', async () => {
  const articlesGrid = document.getElementById('articles-grid');

  if (!articlesGrid) {
    console.error('❌ Элемент #articles-grid не найден');
    return;
  }

  try {
    console.log('🔍 Запрашиваем статьи...');


    const url = new URL('http://localhost:1337/api/articles?populate=*');

    url.searchParams.append('publicationState', 'published');
    url.searchParams.append('pagination[page]', '1');
    url.searchParams.append('pagination[pageSize]', '10');

    const response = await fetch(url);


    if (!response.ok) {
      throw new Error(`❌ Ошибка: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Получены данные:', data);

    if (!data.data || data.data.length === 0) {
      articlesGrid.innerHTML = '<p>Нет опубликованных статей.</p>';
      return;
    }

    articlesGrid.innerHTML = ''; // очищаем

    data.data.forEach(article => {
      
      const title = article.Title || 'Без заголовка';
      const contentBlocks = article.Content || [];
      const publication = article.Publication;
      const imageUrl = article.Image?.data?.[0]?.attributes?.url;
      const imageAlt = article.Image?.data?.[0]?.attributes?.name || title;
      const authorName = article.authors?.[0]?.Name || 'Автор не указан';
      const authorLink = article.authors?.data?.[0] // По клику на автора
      ? `<a href="/author.html?id=${article.authors.data[0].id}" class="author-link">${authorName}</a>`
      : 'Автор не указан';

      // Парсим контент (только параграфы)
      const contentHTML = contentBlocks
        .map(block => {
          if (block.type === 'paragraph') {
            return `<p>${block.children.map(child => child.text).join('')}</p>`;
          }
          return '';
        })
        .join('');

      const date = publication
        ? new Date(publication).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })
        : 'Дата не указана';

      const card = document.createElement('div');
      card.className = 'article-card';
      card.innerHTML = `
        <article class="article-item">
          <h3 class="article-title">${title}</h3>
          <div class="article-content">${contentHTML}</div>
          <time class="article-date" datetime="${publication}">📅 ${date}</time>
          <div class="article-author">👤 ${authorName}</div>
          <button class="read-more" onclick="window.location.href='/article.html?id=${article.id}'"> Читать далее </button>
        </article>
      `;

      articlesGrid.appendChild(card);

      const currentPage = 1;
      const totalPages = data.meta?.pagination?.pageCount || 1;

      createPagination(currentPage, totalPages); // Вызов пагинации
    });

  } catch (error) {
    console.error('🚨 Ошибка:', error);
    articlesGrid.innerHTML = `
      <div class="error">
        <p><strong>Не удалось загрузить статьи</strong></p>
        <p>${error.message}</p>
      </div>
    `;
  }
});





