
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
    // Запрос как в script.js: тот же API и populate, фильтр по id (Strapi v5 — плоский ответ)
    const url = new URL('http://localhost:1337/api/articles');
    url.searchParams.append('filters[id][$eq]', articleId);
    url.searchParams.append('populate', '*');
    url.searchParams.append('publicationState', 'published');

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Ошибка: ${response.status}`);
    }

    const data = await response.json();
    const articles = data.data;
    const article = Array.isArray(articles) ? articles[0] : null;

    if (!article) {
      container.innerHTML = '<p>❌ Статья не найдена или не опубликована.</p>';
      return;
    }

    // Поддержка и плоского формата (Strapi v5), и вложенного (attributes)
    const attrs = article.attributes || article;
    const title = attrs.Title || attrs.title || 'Без заголовка';
    const contentBlocks = attrs.Content || attrs.content || [];
    const publication = attrs.Publication || attrs.publication;

    // Заголовок статьи в верхний h2 (область grid "h2")
    const pageH2 = document.getElementById('h2');
    if (pageH2) {
      pageH2.textContent = title;
    }
    document.title = `${title} — РГЭУ (РИНХ)`;

    // Медиа: может быть data (вложенный) или сразу массив/объект (плоский)
    const mediaRaw = attrs.Media?.data ?? attrs.Media;
    const mediaList = Array.isArray(mediaRaw)
      ? mediaRaw
      : mediaRaw
        ? [mediaRaw]
        : [];
    const mediaItems = mediaList.map(function (item) {
      return item?.attributes || item;
    }).filter(Boolean);

    let mainImage = mediaItems[0] || null;
    const extraMedia = mediaItems.slice(1);
    const imageUrl = mainImage?.url;
    const imageAlt = mainImage?.name || mainImage?.alternativeText || title;

    const mediaHTML = extraMedia.length
      ? `
        <section class="article-media" aria-label="Медиафайлы статьи">
          <h2 class="article-section-title">Медиафайлы</h2>
          <div class="article-media-grid">
            ${extraMedia.map(media => {
              const url = media.url;
              const name = media.name || media.alternativeText || 'Медиафайл';
              const mime = media.mime || '';

              if (!url) {
                return '';
              }

              if (mime.startsWith('image/')) {
                return `
                  <figure class="article-media-item">
                    <img 
                      src="http://localhost:1337${url}" 
                      alt="${name}" 
                      loading="lazy"
                    >
                    <figcaption>${name}</figcaption>
                  </figure>
                `;
              }

              if (mime.startsWith('video/')) {
                return `
                  <figure class="article-media-item">
                    <video controls preload="metadata">
                      <source src="http://localhost:1337${url}" type="${mime}">
                      Ваш браузер не поддерживает воспроизведение видео.
                    </video>
                    <figcaption>${name}</figcaption>
                  </figure>
                `;
              }

              return `
                <div class="article-media-item">
                  <a href="http://localhost:1337${url}" target="_blank" rel="noopener">
                    ${name}
                  </a>
                </div>
              `;
            }).join('')}
          </div>
        </section>
      `
      : '';

    // Авторы: и data (вложенный), и плоский массив
    const authorsRaw = attrs.authors?.data ?? attrs.authors;
    const authorsList = Array.isArray(authorsRaw) ? authorsRaw : authorsRaw ? [authorsRaw] : [];
    const authorsHTML = authorsList.length
      ? authorsList.map(author => {
          const a = author?.attributes || author;
          const name = a?.Name || a?.name || 'Автор';
          const id = author?.id;
          return id
            ? `<a href="author.html?id=${id}" class="author-link">${name}</a>`
            : `<span class="author-name">${name}</span>`;
        }).join(', ')
      : 'Автор(ы) не указаны';

    // Теги
    const tagsRaw = attrs.Tags?.data ?? attrs.tags?.data ?? attrs.Tags ?? attrs.tags;
    const tagsList = Array.isArray(tagsRaw) ? tagsRaw : tagsRaw ? [tagsRaw] : [];
    const tagsData = tagsList;
    const tagsHTML = tagsData.length
      ? `
        <section class="article-tags" aria-label="Теги статьи">
          <h2 class="article-section-title">Теги</h2>
          <ul class="article-tags-list">
            ${tagsData.map(tagItem => {
              const t = tagItem?.attributes || tagItem || {};
              const tagName = t.Name || t.name || '';
              return tagName ? `<li class="article-tag">${tagName}</li>` : '';
            }).join('')}
          </ul>
        </section>
      `
      : '';

    // Вложенные файлы
    const filesRaw = attrs.Files?.data ?? attrs.Files;
    const filesList = Array.isArray(filesRaw) ? filesRaw : filesRaw ? [filesRaw] : [];
    const filesData = filesList.map(item => item?.attributes || item).filter(Boolean);
    const filesHTML = filesData.length
      ? `
        <section class="article-files" aria-label="Вложенные файлы">
          <h2 class="article-section-title">Вложенные файлы</h2>
          <ul class="article-files-list">
            ${filesData.map(fileItem => {
              const url = fileItem?.url;
              const name = fileItem?.name || 'Файл';
              return url ? `
                <li>
                  <a href="http://localhost:1337${url}" target="_blank" class="article-file" download>
                    <span class="file-icon">📎</span>
                    ${name}
                  </a>
                </li>
              ` : '';
            }).join('')}
          </ul>
        </section>
      `
      : '';

    // Генерация основного текстового контента
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

    // Формируем разметку полной статьи (без дублирования заголовка — он уже в h2)
    container.innerHTML = `
      <div class="article-meta" aria-label="Метаданные статьи">
        <time datetime="${publication || ''}">${formatDate(publication)}</time>
        <span>Автор(ы): ${authorsHTML}</span>
      </div>

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

      ${mediaHTML}
      ${tagsHTML}
      ${filesHTML}

      <footer class="article-footer">
        <a href="index.html" class="back-link" data-i18n="← Вернуться к списку статей">← Вернуться к списку статей</a>
      </footer>
    `;

  } catch (error) {
    console.error('❌ Ошибка загрузки статьи:', error);
    container.innerHTML = `
      <p>Ошибка загрузки статьи. Сообщение: <code>${error.message}</code></p>
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


