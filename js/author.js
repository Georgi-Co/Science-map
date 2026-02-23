
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

    const url = new URL(`http://localhost:1337/api/authors/${authorId}`);
    url.searchParams.append('populate', 'Avatar,articles.Media,articles.Faculty,articles.ScienceArea');

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Ошибка: ${response.status}`);

    const data = await response.json();
    if (!data.data) throw new Error('Автор не найден');

    const author = data.data;
    const attrs = author.attributes;

    // Заполняем профиль
    document.getElementById('author-name').textContent = attrs.Name || 'Имя не указано';

    const positionEl = document.getElementById('author-position');
    if (attrs.Info) {
      positionEl.textContent = attrs.Info;
    } else {
      positionEl.style.display = 'none';
    }

    document.getElementById('author-bio').textContent =
      attrs.Bio || 'Биография отсутствует.';

    // Фото
    const avatar = attrs.Avatar?.data?.attributes;
    const avatarImg = document.getElementById('author-avatar');
    if (avatar && avatar.url) {
      avatarImg.src = `http://localhost:1337${avatar.url}`;
      avatarImg.alt = `Фото ${attrs.Name}`;
    } else {
      avatarImg.style.display = 'none';
    }

    // Загружаем статьи
    const articles = attrs.articles?.data || [];
    renderArticles(articles);

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
    const attrs = article.attributes;
    const titleText = attrs.Title || 'Без названия';
    const faculty = attrs.Faculty?.data?.attributes?.Name || '';
    const scienceArea = attrs.ScienceArea?.data?.attributes?.Name || '';
    // Media может быть массивом или одним объектом
    const mediaData = attrs.Media?.data;
    const imageUrl = Array.isArray(mediaData) && mediaData.length > 0 
      ? mediaData[0]?.attributes?.url 
      : mediaData?.attributes?.url;
    // Используем превью из Content, если Description отсутствует
    const contentPreview = Array.isArray(attrs.Content) 
      ? attrs.Content
          .filter(block => block.type === 'paragraph')
          .slice(0, 2)
          .map(block => {
            if (!block.children) return '';
            return block.children.map(child => child.text || '').join('');
          })
          .join(' ')
          .substring(0, 180)
      : '';
    const preview = (attrs.Description || contentPreview).substring(0, 180) + ((attrs.Description || contentPreview).length > 180 ? '...' : '');

    const card = document.createElement('div');
    card.className = 'article-card';
    card.innerHTML = `
      <article class="article-card-body">
        <h3 class="article-title">
          <a href="full-article.html?id=${article.id}" class="article-title-link">${titleText}</a>
        </h3>
        ${imageUrl 
          ? `<img src="http://localhost:1337${imageUrl}" alt="${titleText}" class="article-image">` 
          : ''}
        <div class="article-meta">
          ${faculty ? `<span class="tag">${faculty}</span>` : ''}
          ${scienceArea ? `<span class="tag">${scienceArea}</span>` : ''}
        </div>
        <div class="article-preview">${preview}</div>
        <button class="read-more" onclick="window.location.href='full-article.html?id=${article.id}'">Подробнее</button>
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


