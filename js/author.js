// author.js — загрузка автора по id

// Функция для получения локализованного значения
function getLocalizedValue(field) {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (typeof field === 'object') {
    const lang = localStorage.getItem('language') || 'ru';
    return field[lang] || field.ru || field.en || Object.values(field)[0] || '';
  }
  return '';
}

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const authorId = urlParams.get('id');

  if (!authorId) {
    showError('Не указан ID автора. Вернитесь на главную.');
    return;
  }

  try {
    console.log('🔍 Загрузка автора с ID:', authorId);

    // Коллекционный запрос с глубоким populate
    const url = new URL('https://special-bear-65dd39b4fc.strapiapp.com/api/authors');
    url.searchParams.append('filters[id][$eq]', authorId);
    url.searchParams.append('populate', '*');
    // publicationState не указываем, чтобы получить автора независимо от статуса публикации

    const response = await fetch(url);
    console.log('📥 Ответ получен, статус:', response.status);
    if (!response.ok) throw new Error(`Ошибка: ${response.status}`);

    const data = await response.json();
    console.log('📦 Ответ API:', JSON.stringify(data, null, 2));
    const list = data.data;
    const author = Array.isArray(list) ? list[0] : null;
    if (!author) throw new Error('Автор не найден');

    const attrs = author.attributes || author;
    console.log('📦 Данные автора (полный объект):', JSON.stringify(attrs, null, 2));

    // Отладка: вывести все ключи объекта attrs
    console.log('🔑 Ключи attrs:', Object.keys(attrs));

    const authorName = getLocalizedValue(attrs.Name || attrs.name) || 'Имя не указано';

    document.title = `${authorName} — Научные работы РГЭУ (РИНХ)`;

    // Заполняем профиль
    const authorNameEl = document.getElementById('author-name');
    authorNameEl.textContent = authorName;

    // Извлечение Info: пробуем разные варианты ключей
    const infoRaw = attrs.Info !== undefined ? attrs.Info : attrs.info;
    const infoText = getLocalizedValue(infoRaw) || '';
    console.log('📝 Поле Info автора (raw):', infoRaw, 'обработанное:', infoText);

    // Передача данных об авторе в data-атрибуты
    authorNameEl.dataset.authorId = authorId;
    authorNameEl.dataset.authorInfo = infoText;
    authorNameEl.dataset.authorEmail = attrs.Email || attrs.email || '';
    authorNameEl.dataset.authorSlug = attrs.Slug || attrs.slug || '';

    const positionEl = document.getElementById('author-position');
    if (!positionEl) {
      console.error('❌ Элемент author-position не найден');
    } else {
      if (infoText) {
        positionEl.textContent = infoText;
        positionEl.style.display = 'flex';
        console.log('✅ Info автора установлено:', infoText);
      } else {
        positionEl.textContent = 'Информация отсутствует';
        positionEl.style.display = 'flex';
        positionEl.style.color = '#999';
        positionEl.style.fontStyle = 'italic';
        console.log('⚠️ Info автора пустое');
      }
    }

    const email = attrs.Email || attrs.email || '';
    const emailEl = document.getElementById('author-email');
    if (!emailEl) {
      console.error('❌ Элемент author-email не найден');
    } else {
      if (email) {
        emailEl.textContent = `Email: ${email}`;
        emailEl.style.display = 'flex';
        console.log('✅ Email автора установлен:', email);
      } else {
        emailEl.textContent = 'Email не указан';
        emailEl.style.display = 'flex';
        emailEl.style.color = '#999';
        emailEl.style.fontStyle = 'italic';
        console.log('⚠️ Email автора пустой');
      }
    }

    const bioEl = document.getElementById('author-bio');
    if (!bioEl) {
      console.error('❌ Элемент author-bio не найден');
    } else {
      // Поле Bio отсутствует в схеме Strapi, поэтому оставляем пустым
      bioEl.textContent = '';
      bioEl.style.display = 'none';
      console.log('⚠️ Поле Bio не поддерживается в текущей схеме автора');
    }

    // Фото: поддержка плоского формата (Avatar — объект с url) и вложенного (data.attributes)
    const avatarData = attrs.Avatar?.data?.attributes ?? attrs.Avatar?.attributes ?? attrs.Avatar;
    const avatarImg = document.getElementById('author-avatar');
    if (avatarData && avatarData.url) {
      avatarImg.src = `http://localhost:1337${avatarData.url}`;
      avatarImg.alt = `Фото ${authorName}`;
    } else if (avatarData && avatarData.formats?.thumbnail?.url) {
      // Если основного url нет, используем thumbnail
      avatarImg.src = `http://localhost:1337${avatarData.formats.thumbnail.url}`;
      avatarImg.alt = `Фото ${authorName}`;
    } else {
      avatarImg.style.display = 'none';
    }

    // Статьи: плоский массив (attrs.articles) или вложенный (attrs.articles?.data)
    const articles = attrs.articles?.data ?? attrs.articles ?? [];
    console.log('📚 Статьи автора:', articles);
    renderArticles(Array.isArray(articles) ? articles : []);

    // Добавляем микроразметку Schema.org для автора
    addAuthorStructuredData(authorName, attrs, avatarData, author.id);

  } catch (error) {
    console.error('❌ Ошибка:', error);
    showError(`Не удалось загрузить автора: ${error.message}`);
  }
});

function renderArticles(articles) {
  const container = document.getElementById('author-articles');
  const noArticles = document.getElementById('no-articles');
  const title = document.getElementById('author-articles-title');

  if (!container || !noArticles || !title) {
    console.error('❌ Не найдены необходимые элементы DOM для отображения статей автора');
    return;
  }

  if (!articles || articles.length === 0) {
    noArticles.style.display = 'block';
    container.style.display = 'none';
    title.style.display = 'none';
    return;
  }

  noArticles.style.display = 'none';
  container.style.display = 'grid'; // Убеждаемся, что контейнер видим
  container.innerHTML = '';

  articles.forEach(article => {
    const a = article.attributes || article;
    const titleText = a.Title || a.title || 'Без названия';
    const articleId = article.id;
    // Faculty и ScienceArea — это enumeration (строки), а не отношения
    const faculty = a.Faculty || '';
    const scienceArea = a.ScienceArea || '';
    const mediaRaw = a.Media?.data ?? a.Media;
    const mediaList = Array.isArray(mediaRaw) ? mediaRaw : mediaRaw ? [mediaRaw] : [];
    const firstMedia = mediaList[0];
    const mediaAttrs = firstMedia?.attributes ?? firstMedia;
    const imageUrl = mediaAttrs?.url || '';

    const contentBlocks = a.Content || a.content || [];
    const contentPreview = Array.isArray(contentBlocks)
      ? contentBlocks
        .filter(block => block && block.type === 'paragraph')
        .slice(0, 2)
        .map(block => {
          if (!block.children) return '';
          return block.children.map(child => (child && child.text) || '').join('');
        })
        .join(' ')
        .trim()
      : '';
    const desc = a.Description || contentPreview;
    const preview = (desc.length > 180 ? desc.substring(0, 180) + '...' : desc) || 'Нет описания';

    const card = document.createElement('div');
    card.className = 'article-card';
    card.innerHTML = `
      <article class="article-card-body">
        <h3 class="article-title">
          <a href="full-article.html?id=${articleId}" class="article-title-link">${titleText}</a>
        </h3>
        ${imageUrl
        ? `<img src="http://localhost:1337${imageUrl}" alt="${titleText}" class="article-image">`
        : ''}
        <div class="article-meta">
          ${faculty ? `<span class="tag">${faculty}</span>` : ''}
          ${scienceArea ? `<span class="tag">${scienceArea}</span>` : ''}
        </div>
        <div class="article-preview">${preview}</div>
        <button class="read-more" onclick="window.location.href='full-article.html?id=${articleId}'">Подробнее</button>
      </article>
    `;
    container.appendChild(card);
  });
}

function showError(message) {
  document.getElementById('author-name').textContent = 'Ошибка';
  document.getElementById('author-bio').textContent = message;
  document.getElementById('author-articles').style.display = 'none';
  document.getElementById('no-articles').style.display = 'block';
  document.getElementById('no-articles').style.color = '#e74c3c';
}

/**
 * Добавляет структурированные данные Schema.org для автора (Person)
 */
function addAuthorStructuredData(authorName, attrs, avatarData, authorId) {
  // Удаляем предыдущий скрипт микроразметки, если есть
  const existingScript = document.getElementById('structured-data-author');
  if (existingScript) {
    existingScript.remove();
  }

  const imageUrl = avatarData?.url ? `http://localhost:1337${avatarData.url}` : '';
  const jobTitle = getLocalizedValue(attrs.Info || attrs.info) || '';
  const email = attrs.Email || attrs.email || '';
  const slug = attrs.Slug || attrs.slug || '';
  const authorUrl = slug ? `http://localhost:3000/html/author.html?id=${authorId}` : window.location.href;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    'name': authorName,
    'url': authorUrl,
    'jobTitle': jobTitle,
    'email': email,
    'image': imageUrl,
    'worksFor': {
      '@type': 'Organization',
      'name': 'РГЭУ (РИНХ)',
      'url': 'https://rsue.ru/'
    },
    'sameAs': []
  };

  const script = document.createElement('script');
  script.id = 'structured-data-author';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(structuredData, null, 2);
  document.head.appendChild(script);

  console.log('✅ Добавлена микроразметка для автора:', authorName);
}
