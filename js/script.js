

// script.js — стабильная загрузка статей для Strapi v5 (плоские данные)
// Поддерживает: пагинацию, адаптивность, авторов, ошибки

// Глобальные переменные
let allArticles = [];
let currentPage = 1;

// === ФУНКЦИИ ===

// Определяем количество колонок сетки
function getGridColumnsCount() {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return 1;

  const style = getComputedStyle(grid);
  const template = style.gridTemplateColumns;

  if (template && template !== 'none') {
    return Math.max(1, template.trim().split(/\s+/).length);
  }

  const firstCard = grid.querySelector('.article-card');
  if (firstCard) {
    const gridWidth = grid.clientWidth;
    const cardWidth = firstCard.offsetWidth;
    const gap = parseFloat(style.columnGap) || 0;
    if (cardWidth > 0) {
      return Math.max(1, Math.floor((gridWidth + gap) / (cardWidth + gap)));
    }
  }
  return 1;
}

// Определяем количество строк сетки
function getGridRowsCount() {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return 2;

  const style = getComputedStyle(grid);
  const template = style.gridTemplateRows;

  if (template && template !== 'none') {
    return Math.max(1, template.trim().split(/\s+/).length);
  }
  return 2;
}

// Рассчитываем количество статей на страницу
function getArticlesPerPage() {
  return getGridColumnsCount() * getGridRowsCount();
}

// === renderPage — ГЛОБАЛЬНАЯ (для pagination.js и search.js)
function renderPage(page = 1) {
  console.log('[renderPage] Вызов с page=', page);
  console.log('[renderPage] Всего статей в allArticles:', allArticles.length);

  currentPage = page;
  const articlesPerPage = getArticlesPerPage();
  const start = (page - 1) * articlesPerPage;
  const end = start + articlesPerPage;
  const articlesToShow = allArticles.slice(start, end);

  console.log('[renderPage] Статей на страницу:', articlesPerPage);
  console.log('[renderPage] Статей для отображения:', articlesToShow.length);

  const grid = document.querySelector('.articles-grid');
  if (!grid) {
    console.error('[renderPage] ❌ .articles-grid не найден в DOM');
    return;
  }

  grid.innerHTML = '';

  if (articlesToShow.length === 0) {
    console.warn('[renderPage] ⚠️ Нет статей для отображения');
    grid.innerHTML = '<p class="no-articles">Нет статей для отображения.</p>';
    return;
  }

  console.log('[renderPage] Начинаю рендеринг', articlesToShow.length, 'статей');

  articlesToShow.forEach(article => {
    const id = article.id;
    const title = article.Title || article.title || 'Без заголовка';
    const description = article.Description || article.description || '';
    const contentBlocks = article.Content || article.content || [];
    const publication = article.Publication || article.publication || article.publishedAt;
    const authors = Array.isArray(article.authors) ? article.authors : [];
    const scientificField = article.scienceArea || '';
    const researchDirection = article.scienceDirection || '';
    const faculty = article.faculty || '';
    const tags = Array.isArray(article.tags) ? article.tags : [];

    // Превью текста (первые 2 абзаца, до 200 символов)
    let previewText = '';
    if (Array.isArray(contentBlocks) && contentBlocks.length > 0) {
      const text = contentBlocks
        .filter(block => block && block.type === 'paragraph')
        .slice(0, 2)
        .map(block => {
          if (!block.children || !Array.isArray(block.children)) return '';
          return block.children.map(child => child?.text || '').join('');
        })
        .join(' ')
        .trim();

      previewText = text.length > 0
        ? (text.substring(0, 200) + (text.length > 200 ? '...' : ''))
        : 'Описание отсутствует';
    } else {
      previewText = 'Описание отсутствует';
    }

    // Форматирование даты
    const date = publication
      ? new Date(publication).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      : 'Дата не указана';

    // Обработка автора
    const author = authors[0] || null;
    const authorName = author?.Name || author?.name || 'Автор не указан';
    const authorId = author?.id;
    const authorLink = authorId
      ? `<a href="author.html?id=${authorId}">${authorName}</a>`
      : authorName;

    // Получаем функцию перевода
    const t = (key) => window.localization?.getTranslation?.(key) || key;

    // Локализованные названия плашек
    const fieldDisplay = scientificField ? t(scientificField) : t('Научная область не указана');
    const directionDisplay = researchDirection ? t(researchDirection) : t('Научное направление не указано');
    const facultyDisplay = faculty ? faculty : t('Не указан');

    // Создание карточки статьи
    const card = document.createElement('div');
    card.className = 'article-card';

    card.innerHTML = `
      <article class="article-card-body">
        <div class="article-badges" aria-label="${t('Научная область')} ${t('Научное направление')}">
          <div class="article-badge article-badge--field" title="${fieldDisplay}">${fieldDisplay}</div>
          <div class="article-badge article-badge--direction" title="${directionDisplay}">${directionDisplay}</div>
        </div>
        <h3 class="article-title">
          <a href="full-article.html?id=${id}" class="article-title-link">${title}</a>
        </h3>
        <div class="article-description"><strong>Описание: </strong>${description}</div>
        <!-- <div class="article-preview"><strong>Цели проекта: </strong>${previewText}</div> -->
        <div class="faculty" aria-label="${t('Факультет:')}"><strong>${t('Факультет:')}</strong> <span class="faculty-name">${facultyDisplay}</span></div>
        <time class="article-date" datetime="${publication || ''}"><strong>Дата публикации: </strong>${date}</time>
        <div class="article-author"><img src="../img/people.svg" alt="Авторы" class="icon-people"><strong> Авторы: </strong><img src="../img/person.svg" alt="Автор" class="icon-person"> ${authorLink}</div>
        ${tags.length ? `
        <div class="article-tags-line" aria-label="Теги статьи">
          ${tags.map(tag => `<button type="button" class="article-tag-chip" data-tag="${tag}">${tag}</button>`).join('')}
        </div>` : ''}
      </article>
    `;

    // Переход к полной статье по клику на всю карточку
    card.addEventListener('click', (event) => {
      const target = event.target;
      const link = target.closest('a');

      // Если клик по ссылке (заголовок, автор и т.п.) — не перехватываем
      if (link) {
        return;
      }

      window.location.href = `full-article.html?id=${id}`;
    });

    grid.appendChild(card);
  });

  // Навешиваем обработчики на теги после рендера карточек
  const tagChips = document.querySelectorAll('.article-tag-chip');
  tagChips.forEach(chip => {
    const tag = chip.getAttribute('data-tag');
    if (!tag) return;
    chip.addEventListener('click', (event) => {
      // Не даём клику по тегу срабатывать как клик по карточке
      event.stopPropagation();
      const url = new URL(window.location.href);
      url.searchParams.set('tag', tag);
      window.history.replaceState({}, '', url.toString());

      if (typeof articleSearch === 'object' && articleSearch) {
        articleSearch.activeTag = tag.toLowerCase();
        articleSearch.performSearch(articleSearch.searchField?.value || '');
      }
    });
  });

  // Инициализация пагинации (если функция доступна)
  if (typeof createPagination === 'function') {
    const totalPages = Math.ceil(allArticles.length / articlesPerPage);
    createPagination(currentPage, totalPages, '#articles-container');
  }
}

// === ЗАГРУЗКА СТАТЕЙ ===
document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.querySelector('.articles-grid');
  if (!grid) {
    console.error('❌ .articles-grid не найден');
    return;
  }

  try {
    console.log('🔍 Загрузка статей с Strapi...');

    const url = new URL('http://localhost:1337/api/articles');
    url.searchParams.append('populate', '*');
    url.searchParams.append('publicationState', 'published');
    url.searchParams.append('pagination[pageSize]', '100');
    url.searchParams.append('sort', 'Publication:desc');

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📦 Получены данные:', data);
    console.log('📦 Структура первой статьи:', data.data?.[0]);

    if (!data || !data.data || !Array.isArray(data.data)) {
      throw new Error('API вернул неверный формат (отсутствует data.data)');
    }

    // Обработка и фильтрация статей
    // Strapi v5 возвращает данные в формате: { data: [{ id, attributes: {...} }] }
    allArticles = data.data
      .map(item => {
        // Поддерживаем оба формата: с attributes и без
        const attrs = item.attributes || item;
        const authors = attrs.authors?.data || attrs.authors || [];

        // Теги
        const tagsRaw = attrs.Tags?.data ?? attrs.tags?.data ?? attrs.Tags ?? attrs.tags;
        const tagsList = Array.isArray(tagsRaw) ? tagsRaw : tagsRaw ? [tagsRaw] : [];
        const tags = tagsList
          .map(tagItem => {
            const t = tagItem.attributes || tagItem || {};
            return t.Name || t.name || '';
          })
          .filter(Boolean);

        // Возможные связи для фильтров (факультет, область, направление)
        // Strapi v5: enum-поля приходят как плоские строки
        // Strapi v4: relations приходят как { data: { attributes: { Name: ... } } }
        const facultyName = (typeof attrs.Faculty === 'string' ? attrs.Faculty : null)
          || attrs.Faculty?.data?.attributes?.Name || '';
        const scienceAreaName = (typeof attrs.ScienceArea === 'string' ? attrs.ScienceArea : null)
          || attrs.ScienceArea?.data?.attributes?.Name || '';
        const scienceDirectionName = (typeof attrs.ScienceDirection === 'string' ? attrs.ScienceDirection : null)
          || attrs.ScienceDirection?.data?.attributes?.Name || '';

        const article = {
          id: item.id,
          Title: attrs.Title || attrs.title || '',
          Description: attrs.Description || attrs.description || '',
          Content: attrs.Content || attrs.content || [],
          Publication: attrs.Publication || attrs.publication || attrs.publishedAt || null,
          publishedAt: attrs.publishedAt || attrs.Publication || attrs.publication || null,
          authors: Array.isArray(authors) ? authors.map(author => {
            // Поддерживаем оба формата автора
            const authorAttrs = author.attributes || author;
            return {
              id: author.id,
              Name: authorAttrs.Name || authorAttrs.name || '',
              name: authorAttrs.Name || authorAttrs.name || ''
            };
          }) : [],
          // Поля для работы фильтров на клиенте
          faculty: facultyName,
          scienceArea: scienceAreaName,
          scienceDirection: scienceDirectionName,
          tags
        };

        console.log('📄 Обработанная статья:', {
          id: article.id,
          title: article.Title,
          hasContent: Array.isArray(article.Content) && article.Content.length > 0,
          hasPublication: !!article.Publication,
          authorsCount: article.authors.length,
          faculty: article.faculty,
          scienceArea: article.scienceArea,
          scienceDirection: article.scienceDirection
        });
        return article;
      });
    // Не фильтруем, так как publicationState уже фильтрует на стороне API
    // Оставляем все статьи, которые были возвращены API

    console.log('✅ Всего обработано статей:', allArticles.length);
    console.log('✅ Первая статья:', allArticles[0]);

    if (allArticles.length === 0) {
      grid.innerHTML = '<p>Нет опубликованных статей.</p>';
      return;
    }

    // Рендеринг первой страницы ПЕРЕД инициализацией поиска
    console.log('🎨 Вызываю renderPage(1) с', allArticles.length, 'статьями');
    renderPage(1);

    // Инициализация поиска (если функция setupSearch доступна)
    if (typeof setupSearch === 'function') {
      console.log('🔍 Инициализирую поиск...');
      articleSearch = setupSearch(allArticles, renderPage);
      console.log('✅ Поиск инициализирован');
    } else {
      console.warn(
        '⚠️ Функция setupSearch не найдена. Поиск будет недоступен.\n' +
        'Проверьте:\n' +
        '- Подключен ли файл search.js?\n' +
        '- Нет ли ошибок в консоли при загрузке search.js?'
      );
    }

  } catch (error) {
    console.error('❌ Ошибка загрузки:', error);
    grid.innerHTML = `
      <div class="error-card">
        <h3>Не удалось загрузить статьи</h3>
        <p><strong>Ошибка:</strong> ${error.message}</p>
        <p><small>Проверь:</small></p>
        <ul>
          <li>Strapi запущен: <a href="http://localhost:1337" target="_blank">открыть</a></li>
          <li>Статьи опубликованы</li>
          <li>Разрешён доступ в Public Role</li>
          <li>Поле <code>authors</code> разрешено в API</li>
        </ul>
      </div>
    `;
  }
});

// === АДАПТИВНОСТЬ ===
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (allArticles.length > 0 && articleSearch) {
      // Перестраиваем поиск при ресайзе
      articleSearch.updateArticles(allArticles);
      renderPage(currentPage);
    } else if (allArticles.length > 0) {
      // Если поиск не инициализирован, просто обновляем страницу
      renderPage(currentPage);
    }
  }, 150);
});

console.log('✅ script.js загружен');

// При смене языка — перерисовываем карточки
document.addEventListener('languageChanged', () => {
  if (allArticles.length > 0) {
    renderPage(currentPage);
  }
});
