
// author.js — загрузка автора по id

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const authorId = urlParams.get('id');

  if (!authorId) {
    showError('Не указан ID автора. Вернитесь на главную.');
    return;
  }

  try {
    console.log('🔍 Загрузка автора с ID:', authorId);

    // Коллекционный запрос (как для статей) — избегаем 400 от вложенного populate
    const url = new URL('http://localhost:1337/api/authors');
    url.searchParams.append('filters[id][$eq]', authorId);
    url.searchParams.append('populate', '*');
    url.searchParams.append('publicationState', 'published');

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Ошибка: ${response.status}`);

    const data = await response.json();
    const list = data.data;
    const author = Array.isArray(list) ? list[0] : null;
    if (!author) throw new Error('Автор не найден');

    const attrs = author.attributes || author;

    const authorName = attrs.Name || attrs.name || 'Имя не указано';

    document.title = `${authorName} — Научные работы РГЭУ (РИНХ)`;

    // Заполняем профиль
    document.getElementById('author-name').textContent = authorName;

    const positionEl = document.getElementById('author-position');
    const infoText = attrs.Info || attrs.info || '';
    if (infoText) {
      positionEl.textContent = infoText;
    } else {
      positionEl.style.display = 'none';
    }

    const bioText = attrs.Bio || attrs.bio || '';
    const bioEl = document.getElementById('author-bio');
    if (bioText) {
      bioEl.textContent = bioText;
    } else {
      bioEl.style.display = 'none';
    }

    // Фото: поддержка плоского формата (Avatar — объект с url) и вложенного (data.attributes)
    const avatarData = attrs.Avatar?.data?.attributes ?? attrs.Avatar?.attributes ?? attrs.Avatar;
    const avatarImg = document.getElementById('author-avatar');
    if (avatarData && avatarData.url) {
      avatarImg.src = `http://localhost:1337${avatarData.url}`;
      avatarImg.alt = `Фото ${authorName}`;
    } else {
      avatarImg.style.display = 'none';
    }

    // Статьи: плоский массив (attrs.articles) или вложенный (attrs.articles?.data)
    const articles = attrs.articles?.data ?? attrs.articles ?? [];
    renderArticles(Array.isArray(articles) ? articles : []);

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
    const faculty = a.Faculty?.data?.attributes?.Name ?? a.Faculty?.Name ?? '';
    const scienceArea = a.ScienceArea?.data?.attributes?.Name ?? a.ScienceArea?.Name ?? '';
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


