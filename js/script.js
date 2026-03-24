

// script.js — рабочий вариант для Strapi v5 с минимальным populate и кэшем
let allArticles = [];
let currentPage = 1;

async function fetchWithRetry(url, retries = 3, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`Попытка ${i + 1} не удалась:`, err);
      if (i < retries - 1) await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Не удалось получить данные после нескольких попыток');
}

function showLoader() {
  const grid = document.querySelector('.articles-grid');
  if (grid) grid.innerHTML = '<p>Загрузка данных...</p>';
}

function showError(message = 'Ошибка загрузки данных') {
  const grid = document.querySelector('.articles-grid');
  if (grid) grid.innerHTML = `<p>${message}</p>`;
}

function renderPage(page = 1) {
  currentPage = page;

  if (!Array.isArray(allArticles)) {
    console.error('❌ allArticles не массив!', allArticles);
    showError('Неверный формат данных');
    return;
  }

  const articlesPerPage = 6;
  const start = (page - 1) * articlesPerPage;
  const end = start + articlesPerPage;
  const articlesToShow = allArticles.slice(start, end);

  const grid = document.querySelector('.articles-grid');
  if (!grid) return;

  grid.innerHTML = '';

  if (articlesToShow.length === 0) {
    grid.innerHTML = '<p>Нет статей для отображения.</p>';
    return;
  }

  articlesToShow.forEach(article => {
    const card = document.createElement('div');
    card.className = 'article-card';
    card.innerHTML = `
      <h3><a href="full-article.html?id=${article.id}">${article.Title}</a></h3>
      <p>${article.Description || 'Описание отсутствует'}</p>
      <div>Авторы: ${article.authors?.map(a => a.Name).join(', ') || 'Не указаны'}</div>
      ${article.tags?.length ? `<div>Теги: ${article.tags.join(', ')}</div>` : ''}
    `;
    card.addEventListener('click', e => {
      if (!e.target.closest('a')) window.location.href = `full-article.html?id=${article.id}`;
    });
    grid.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return console.error('❌ .articles-grid не найден');

  const cacheKey = 'articles_cache';
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      allArticles = JSON.parse(cached);
      if (!Array.isArray(allArticles)) allArticles = [];
      console.log('📦 Загружено из кэша');
      renderPage(1);
      return;
    } catch (err) {
      console.warn('⚠️ Ошибка при чтении кэша:', err);
    }
  }

  showLoader();

  try {
    const url = new URL('https://special-bear-65dd39b4fc.strapiapp.com/api/articles');
    url.searchParams.set('pagination[pageSize]', '100');
    url.searchParams.set('sort', 'Publication:desc');
    url.searchParams.set('publicationState', 'published');
    url.searchParams.append('populate', 'authors');
    url.searchParams.append('populate', 'tags');

    const data = await fetchWithRetry(url);

    if (!data || !Array.isArray(data.data)) throw new Error('Неверный формат данных API');

    allArticles = data.data.map(item => {
      const attrs = item.attributes || item;

      const authors = (attrs.authors?.data || []).map(a => {
        const aAttrs = a.attributes || a;
        return { id: a.id, Name: aAttrs.Name || aAttrs.name || '' };
      });

      const tags = (attrs.tags?.data || []).map(t => {
        const tAttrs = t.attributes || t;
        return tAttrs.Name || tAttrs.name || '';
      });

      return {
        id: item.id,
        Title: attrs.Title || attrs.title || '',
        Description: attrs.Description || attrs.description || '',
        authors,
        tags
      };
    });

    try {
      localStorage.setItem(cacheKey, JSON.stringify(allArticles));
      console.log('📦 Данные сохранены в кэш');
    } catch (err) {
      console.warn('⚠️ Не удалось сохранить кэш:', err);
    }

    renderPage(1);
  } catch (err) {
    console.error('❌ Ошибка загрузки API:', err);
    showError('Не удалось загрузить данные и кэш пустой');
  }
});