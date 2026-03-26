
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

// Вспомогательная функция для запросов с авторизацией
async function fetchWithAuth(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };
  if (window.API_CONFIG && window.API_CONFIG.USE_TOKEN && window.API_CONFIG.API_TOKEN) {
    headers['Authorization'] = `Bearer ${window.API_CONFIG.API_TOKEN}`;
  }
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

function getMediaUrl(mediaUrl) {
  if (!mediaUrl) return '';
  const normalized = String(mediaUrl).trim();

  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }

  // Иногда из API приходит "https//..." или "http//..." (без двоеточия)
  if (normalized.startsWith('https//')) {
    return normalized.replace(/^https\/\//, 'https://');
  }

  if (normalized.startsWith('http//')) {
    return normalized.replace(/^http\/\//, 'http://');
  }

  // Протокол-relative URL вида //cdn.example.com/file.jpg
  if (normalized.startsWith('//')) {
    return 'https:' + normalized;
  }

  const baseUrl = 'https://special-bear-65dd39b4fc.strapiapp.com';
  if (normalized.startsWith('/')) {
    return baseUrl + normalized;
  }

  return baseUrl + '/' + normalized;
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
    const apiBase = (window.API_CONFIG && typeof window.API_CONFIG.url === 'function')
      ? window.API_CONFIG.url('/api/articles')
      : 'https://special-bear-65dd39b4fc.strapiapp.com/api/articles';
    const url = new URL(apiBase);
    url.searchParams.append('filters[id][$eq]', articleId);
    url.searchParams.append('populate', '*');
    url.searchParams.append('publicationState', 'published');

    const data = await fetchWithAuth(url);
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
    const description = attrs.Description || attrs.description || '';
    const solutions = attrs.Solutions || attrs.solutions || '';
    const purposes = attrs.Purposes || attrs.purposes || '';
    const faculty = attrs.Faculty || attrs.faculty || '';
    const scienceArea = attrs.ScienceArea || attrs.scienceArea || '';
    const scienceDirection = attrs.ScienceDirection || attrs.scienceDirection || '';

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

    // Разделяем элементы на изображения и другие медиа
    const isImageByUrl = (url) => /\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?.*)?$/i.test(url || '');
    const images = mediaItems.filter((media) => {
      const mediaUrl = media?.url || '';
      if (!mediaUrl) return false;
      const mime = media?.mime || '';
      return mime.startsWith('image/') || isImageByUrl(mediaUrl);
    });
    const otherMedia = mediaItems.filter((media) => {
      const mediaUrl = media?.url || '';
      if (!mediaUrl) return false;
      const mime = media?.mime || '';
      return !(mime.startsWith('image/') || isImageByUrl(mediaUrl));
    });

    let carouselHTML = '';
    if (images.length > 0) {
      if (images.length === 1) {
        // Одно изображение - просто выводим
        const img = images[0];
        const url = img.url;
        const name = img.name || img.alternativeText || title;
        carouselHTML = '<div class="article-single-image">' +
          '<img src="' + getMediaUrl(url) + '" alt="' + name + '" class="article-full-image" loading="lazy">' +
          '</div>';
      } else {
        // Несколько изображений - карусель
        carouselHTML = '<div class="article-carousel-wrapper" aria-label="Галерея изображений">' +
          '<div class="article-carousel">' +
          '<div class="carousel-track" id="carousel-track">' +
          images.map((img, index) => {
            const url = img.url;
            const name = img.name || img.alternativeText || ('Изображение ' + (index + 1));
            return '<div class="carousel-slide">' +
              '<img class="carousel-image" src="' + getMediaUrl(url) + '" alt="' + name + '" loading="eager">' +
              '</div>';
          }).join('') +
          '</div>' +
          '<button class="carousel-button prev" id="carousel-prev" aria-label="Предыдущее изображение">&#10094;</button>' +
          '<button class="carousel-button next" id="carousel-next" aria-label="Следующее изображение">&#10095;</button>' +
          '<div class="carousel-indicators" id="carousel-indicators">' +
          images.map((_, i) => '<span class="indicator ' + (i === 0 ? 'active' : '') + '" data-index="' + i + '"></span>').join('') +
          '</div></div></div>';
      }
    }

    const mediaHTML = otherMedia.length
      ? '<section class="article-media" aria-label="Файлы">' +
      '<h2 class="article-section-title">Файлы</h2>' +
      '<div class="article-media-grid">' +
      otherMedia.map(media => {
        const url = media.url;
        const name = media.name || media.alternativeText || 'Медиафайл';
        const mime = media.mime || '';

        if (!url) return '';

        if (mime.startsWith('video/')) {
          return '<figure class="article-media-item video-item">' +
            '<video controls preload="metadata">' +
            '<source src="' + getMediaUrl(url) + '" type="' + mime + '">' +
            'Ваш браузер не поддерживает воспроизведение видео.' +
            '</video>' +
            '<figcaption>' + name + '</figcaption>' +
            '</figure>';
        }

        return '<div class="article-media-item">' +
          '<a href="' + getMediaUrl(url) + '" target="_blank" rel="noopener">' + name + '</a>' +
          '</div>';
      }).join('') +
      '</div></section>'
      : '';

    // Авторы: и data (вложенный), и плоский массив
    const authorsRaw = attrs.authors?.data ?? attrs.authors;
    const authorsList = Array.isArray(authorsRaw) ? authorsRaw : authorsRaw ? [authorsRaw] : [];

    const iconPerson = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="icon-person" viewBox="0 0 16 16"><path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/></svg>`;
    const iconPeople = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="icon-people" viewBox="0 0 16 16"><path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5"/></svg>`;

    const authorsHTML = authorsList.length
      ? authorsList.map(author => {
        const a = author?.attributes || author;
        const name = a?.Name || a?.name || 'Автор';
        const id = author?.id;
        const link = id
          ? `<a href="author.html?id=${id}" class="author-chip-link">${name}</a>`
          : `<span class="author-name">${name}</span>`;
        return `<span class="author-chip">${iconPerson} ${link}</span>`;
      }).join('')
      : '<span class="author-chip">Автор не указан</span>';

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
                  <a href="${getMediaUrl(url)}" target="_blank" class="article-file" download>
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
    let firstParagraphFound = false;
    const contentInnerHTML = Array.isArray(contentBlocks) && contentBlocks.length > 0
      ? contentBlocks
        .map(block => {
          if (!block || !block.type) return '';

          if (block.type === 'paragraph') {
            const text = block.children && Array.isArray(block.children)
              ? block.children.map(child => child?.text || '').join('')
              : '';
            if (!text) return '';

            if (!firstParagraphFound) {
              firstParagraphFound = true;
              return `<div class="article-content-text">${text}</div>`;
            } else {
              return `<p>${text}</p>`;
            }
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
    const contentHTML = `<div id="article-content-full-text">${contentInnerHTML}</div>`;

    // Формируем разметку полной статьи (без дублирования заголовка — он уже в h2)
    container.innerHTML = `
      <div class="article-meta" aria-label="Метаданные статьи">
        <time datetime="${publication || ''}">${formatDate(publication)}</time>
        <div class="article-author"><div class="author-label">${iconPeople}<strong> Авторы: </strong></div> ${authorsHTML}</div>
      </div>

      <div class="article-fields" aria-label="Дополнительная информация о проекте">
        ${faculty ? `<div class="article-field"><strong>Факультет:</strong> <span>${faculty}</span></div>` : ''}
        ${scienceArea ? `<div class="article-field"><strong>Научная область:</strong> <span>${scienceArea}</span></div>` : ''}
        ${scienceDirection ? `<div class="article-field"><strong>Научное направление:</strong> <span>${scienceDirection}</span></div>` : ''}
      </div>

      <div class="article-body">
        ${description ? `<div class="article-description"><strong>Краткое описание: </strong> ${description}</div>` : ''}
        ${purposes ? `<div class="article-purposes"><strong>Цели проекта:</strong> ${purposes.replace(/\n/g, '<br>')}</div>` : ''}
        ${contentHTML}
        ${solutions ? `<div class="article-solutions"><strong>Решения:</strong> ${solutions.replace(/\n/g, '<br>')}</div>` : ''}
      </div>

      ${carouselHTML}

      ${mediaHTML}
      ${tagsHTML}
      ${filesHTML}

      <div class="article-footer article-actions">
        <a href="index.html" class="back-link" data-i18n="← Вернуться к списку статей">← Вернуться к списку статей</a>
      </div>
      <button id="download-pdf" class="download-pdf-btn" data-i18n="Скачать PDF" title="Скачать статью в формате PDF">Скачать PDF</button>
    `;

    // Привязываем обработчик генерации PDF
    const pdfBtn = document.getElementById('download-pdf');
    if (pdfBtn) {
      pdfBtn.addEventListener('click', () => {
        downloadArticlePDF(title);
      });
    }

    // Инициализация карусели
    initCarousel();

  } catch (error) {
    console.error('❌ Ошибка загрузки статьи:', error);
    container.innerHTML = `
      <p>Ошибка загрузки статьи. Сообщение: <code>${error.message}</code></p>
      <ul>
        <li>Работает ли Strapi: <a href="https://special-bear-65dd39b4fc.strapiapp.com">https://special-bear-65dd39b4fc.strapiapp.com</a></li>
        <li>Опубликована ли статья с ID=${articleId}</li>
        <li>Правильно ли указан <code>id="full-article"</code></li>
      </ul>
    `;
  }
}

// Логика карусели
function initCarousel() {
  const track = document.getElementById('carousel-track');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  const indicators = document.querySelectorAll('.indicator');
  const slides = track ? track.querySelectorAll('.carousel-slide') : [];

  if (!track || !prevBtn || !nextBtn || indicators.length === 0 || slides.length === 0) return;

  let currentIndex = 0;
  const totalSlides = indicators.length;
  const carousel = track.parentElement;

  function getSlideWidth() {
    if (!carousel) return 0;
    return carousel.clientWidth;
  }

  function updateCarousel() {
    const slideWidth = getSlideWidth();
    track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
    indicators.forEach((ind, i) => {
      ind.classList.toggle('active', i === currentIndex);
    });
  }

  function applySlideWidths() {
    const slideWidth = getSlideWidth();
    slides.forEach((slide) => {
      slide.style.minWidth = `${slideWidth}px`;
      slide.style.width = `${slideWidth}px`;
    });
    updateCarousel();
  }

  prevBtn.addEventListener('click', () => {
    currentIndex = (currentIndex === 0) ? totalSlides - 1 : currentIndex - 1;
    updateCarousel();
  });

  nextBtn.addEventListener('click', () => {
    currentIndex = (currentIndex === totalSlides - 1) ? 0 : currentIndex + 1;
    updateCarousel();
  });

  indicators.forEach((ind, index) => {
    ind.addEventListener('click', () => {
      currentIndex = index;
      updateCarousel();
    });
  });

  window.addEventListener('resize', applySlideWidths);
  applySlideWidths();
}


// Функция генерации PDF
function downloadArticlePDF(title) {
  // Собираем контент: заголовок + содержимое статьи
  const articleEl = document.getElementById('full-article');
  const h2El = document.getElementById('h2');
  if (!articleEl) return;

  // Создаём временный контейнер для PDF (без кнопок навигации)
  const pdfContainer = document.createElement('div');
  pdfContainer.style.padding = '20px';
  pdfContainer.style.fontFamily = "'Roboto', 'LatoWeb', sans-serif";
  pdfContainer.style.color = '#333';

  // Добавляем заголовок
  if (h2El) {
    const titleClone = document.createElement('h1');
    titleClone.textContent = h2El.textContent;
    titleClone.style.fontSize = '24px';
    titleClone.style.color = '#1a3c6e';
    titleClone.style.marginBottom = '16px';
    titleClone.style.textAlign = 'center';
    pdfContainer.appendChild(titleClone);
  }

  // Клонируем тело статьи (без footer с кнопкой назад)
  const articleClone = articleEl.cloneNode(true);
  const footerInClone = articleClone.querySelector('.article-footer');
  if (footerInClone) footerInClone.remove();
  pdfContainer.appendChild(articleClone);

  // Настройки html2pdf
  const opt = {
    margin: [15, 15, 15, 15],
    filename: (title || 'article') + '.pdf',
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  html2pdf().set(opt).from(pdfContainer).save();
}

// Запускаем при загрузке
document.addEventListener('DOMContentLoaded', loadArticle);



