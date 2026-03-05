/**
 * accessibility.js — Версия для слабовидящих
 * Панель: К содержанию, Шрифт (3 размера), Цвет (3 схемы), Озвучка (вкл/выкл)
 * Сохраняет настройки в localStorage
 */

(function () {
  // Получаем кнопку переключения панели доступности
  const toggleBtn = document.getElementById('toggle-accessible');
  if (!toggleBtn) return;

  // Базовый путь к иконкам
  const ICON_BASE = '../img/';

  // Функция для получения перевода
  function t(key) {
    if (window.localization && typeof window.localization.getTranslation === 'function') {
      return window.localization.getTranslation(key);
    }
    // Fallback: возвращаем ключ (русский текст по умолчанию)
    return key;
  }

  /**
   * Создает контейнер для панели доступности
   * @returns {HTMLElement|null} Элемент контейнера или null, если не удалось создать
   */
  function getPanelContainer() {
    const header = document.querySelector('header');
    if (!header || !header.nextElementSibling) return null;
    let wrap = document.getElementById('accessibility-panel-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'accessibility-panel-wrap';
      wrap.setAttribute('aria-hidden', 'true');
      header.parentNode.insertBefore(wrap, header.nextElementSibling);
    }
    return wrap;
  }

  /**
   * Создает панель доступности с элементами управления
   * @returns {HTMLElement|null} Элемент панели или null, если не удалось создать
   */
  function createPanel() {
    const wrap = getPanelContainer();
    if (!wrap) return null;

    const panel = document.createElement('div');
    panel.id = 'accessibility-toolbar';
    panel.className = 'acc-panel';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', t('Версия для слабовидящих'));

    // Создаем HTML-разметку панели с кнопками управления
    panel.innerHTML = `
      <div class="acc-panel__inner">
        <div class="acc-group acc-group--content">
          <button type="button" class="acc-btn acc-btn--content" data-action="content" title="${t('Перейти к содержанию')}">
            <img src="${ICON_BASE}arrow_circle_down.svg" alt="" class="acc-icon" aria-hidden="true"> ${t('К содержанию')}
          </button>
        </div>

        <div class="acc-group acc-group--font">
          <span class="acc-label" data-i18n-key="Шрифт">${t('Шрифт')}</span>
          <div class="acc-btn-group acc-btn-group--font">
            <button type="button" class="acc-btn acc-btn--font" data-action="font" data-size="100" aria-pressed="false" title="${t('Маленький шрифт')}">
              <span class="acc-font-preview acc-font-preview--small">А</span>
            </button>
            <button type="button" class="acc-btn acc-btn--font" data-action="font" data-size="150" aria-pressed="false" title="${t('Средний шрифт')}">
              <span class="acc-font-preview acc-font-preview--medium">А</span>
            </button>
            <button type="button" class="acc-btn acc-btn--font" data-action="font" data-size="200" aria-pressed="false" title="${t('Крупный шрифт')}">
              <span class="acc-font-preview acc-font-preview--large">А</span>
            </button>
          </div>
        </div>

        <div class="acc-group acc-group--color">
          <span class="acc-label" data-i18n-key="Цвет">${t('Цвет')}</span>
          <div class="acc-btn-group acc-btn-group--color">
            <button type="button" class="acc-btn acc-btn--color acc-btn--color-1" data-action="color" data-scheme="color-1" aria-pressed="false" title="${t('Цветовая схема №1')}">Ц</button>
            <button type="button" class="acc-btn acc-btn--color acc-btn--color-2" data-action="color" data-scheme="color-2" aria-pressed="false" title="${t('Цветовая схема №2')}">Ц</button>
            <button type="button" class="acc-btn acc-btn--color acc-btn--color-3" data-action="color" data-scheme="color-beige" aria-pressed="false" title="${t('Цветовая схема №3')}">Ц</button>
          </div>
        </div>

        <div class="acc-group acc-group--audio">
          <span class="acc-label" data-i18n-key="Озвучка">${t('Озвучка')}</span>
          <div class="acc-btn-group">
            <button type="button"
                    class="acc-btn acc-btn--audio"
                    data-action="audio-toggle"
                    aria-pressed="false"
                    title="${t('Включить озвучку страницы')}">
              <img src="${ICON_BASE}volume_off.svg" alt="${t('Озвучка выкл')}" class="acc-icon acc-icon-audio acc-icon-audio--off" aria-hidden="true">
              <img src="${ICON_BASE}volume_on.svg"  alt="${t('Озвучка вкл')}"  class="acc-icon acc-icon-audio acc-icon-audio--on"  aria-hidden="true" style="display:none;">
            </button>
          </div>
        </div>

        <div class="acc-group acc-group--normal">
        <span class="acc-label" data-i18n-key="Обычная версия">${t('Обычная версия')}</span>
          <div class="acc-btn-group">
            <button type="button"
                    class="acc-btn acc-btn--normal"
                    data-action="reset"
                    aria-pressed="false"
                    title="${t('Обычная версия сайта')}">
              <img src="${ICON_BASE}visibility_off.svg" alt="${t('Обычная версия')}" class="acc-icon" aria-hidden="true">
            </button>
          </div>
        </div>
      </div>
    `;

    wrap.innerHTML = '';
    wrap.appendChild(panel);
    return panel;
  }

  /**
   * Обновляет тексты панели доступности в соответствии с текущим языком
   * @param {HTMLElement} panel - Панель доступности
   */
  function updatePanelTexts(panel) {
    if (!panel) return;
    // Обновляем тексты кнопок и заголовков
    const contentBtn = panel.querySelector('[data-action="content"]');
    if (contentBtn) {
      contentBtn.title = t('Перейти к содержанию');
      contentBtn.querySelector('.acc-icon').nextSibling.textContent = ' ' + t('К содержанию');
    }
    panel.querySelectorAll('.acc-label').forEach(label => {
      const key = label.getAttribute('data-i18n-key');
      if (key) {
        label.textContent = t(key);
      }
    });
    // Обновляем title у кнопок шрифта
    panel.querySelectorAll('[data-action="font"]').forEach(btn => {
      const size = btn.getAttribute('data-size');
      let key;
      if (size === '100') key = 'Маленький шрифт';
      else if (size === '150') key = 'Средний шрифт';
      else if (size === '200') key = 'Крупный шрифт';
      else return;
      btn.title = t(key);
    });
    // Обновляем title у кнопок цвета
    panel.querySelectorAll('[data-action="color"]').forEach(btn => {
      const scheme = btn.getAttribute('data-scheme');
      let key;
      if (scheme === 'color-1') key = 'Цветовая схема №1';
      else if (scheme === 'color-2') key = 'Цветовая схема №2';
      else if (scheme === 'color-beige') key = 'Цветовая схема №3';
      else return;
      btn.title = t(key);
    });
    // Обновляем title у кнопки аудио
    const audioBtn = panel.querySelector('[data-action="audio-toggle"]');
    if (audioBtn) {
      audioBtn.title = t('Включить озвучку страницы');
    }
    // Обновляем alt у иконок аудио
    const iconOff = audioBtn?.querySelector('.acc-icon-audio--off');
    const iconOn = audioBtn?.querySelector('.acc-icon-audio--on');
    if (iconOff) iconOff.alt = t('Озвучка выкл');
    if (iconOn) iconOn.alt = t('Озвучка вкл');
    // Обновляем title у кнопки обычной версии
    const resetBtn = panel.querySelector('[data-action="reset"]');
    if (resetBtn) {
      resetBtn.title = t('Обычная версия сайта');
      const icon = resetBtn.querySelector('.acc-icon');
      if (icon) icon.alt = t('Обычная версия');
    }
    // Обновляем aria-label панели
    panel.setAttribute('aria-label', t('Версия для слабовидящих'));
  }

  /**
   * Загружает стили для панели доступности
   */
  function loadAccessibilityStyles() {
    if (document.getElementById('accessibility-css')) return;
    const link = document.createElement('link');
    link.id = 'accessibility-css';
    link.rel = 'stylesheet';
    link.href = '../css/accessibility.css';
    document.head.appendChild(link);
  }

  /**
   * Обновляет состояние кнопок в группе
   * @param {HTMLElement} panel - Панель доступности
   * @param {string} groupSelector - Селектор группы кнопок
   * @param {HTMLElement} activeBtn - Активная кнопка
   */
  function updateButtonState(panel, groupSelector, activeBtn) {
    if (!panel) return;
    panel.querySelectorAll(groupSelector).forEach(function (btn) {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    });
    if (activeBtn) {
      activeBtn.classList.add('active');
      activeBtn.setAttribute('aria-pressed', 'true');
    }
  }

  /**
   * Настраивает обработчики событий для элементов панели
   * @param {HTMLElement} panel - Панель доступности
   */
  function setupHandlers(panel) {
    const html = document.documentElement;

    // Обработчик кнопки "К содержанию"
    panel.querySelector('[data-action="content"]')?.addEventListener('click', function () {
      const target = document.getElementById('articles-container') || document.querySelector('main');
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        target.focus();
      }
    });

    // Обработчики кнопок изменения размера шрифта
    panel.querySelectorAll('[data-action="font"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const size = btn.getAttribute('data-size');
        updateButtonState(panel, '.acc-btn-group--font .acc-btn', btn);
        html.classList.remove('font-size-100', 'font-size-150', 'font-size-200');
        html.classList.add('font-size-' + size);
        localStorage.setItem('accFontSize', 'font-size-' + size);
      });
    });

    // Обработчики кнопок изменения цветовой схемы
    panel.querySelectorAll('[data-action="color"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const scheme = btn.getAttribute('data-scheme');
        updateButtonState(panel, '.acc-btn-group--color .acc-btn', btn);
        html.classList.remove('color-1', 'color-2', 'color-beige');
        html.classList.add(scheme);
        localStorage.setItem('accColorScheme', scheme);
      });
    });

    // Аудио: одна кнопка с переключением иконок
    var audioBtn = panel.querySelector('[data-action="audio-toggle"]');
    if (audioBtn) {
      audioBtn.addEventListener('click', function () {
        var isOn = audioBtn.getAttribute('aria-pressed') === 'true';
        if (isOn) {
          stopSpeech();
        } else {
          speakPageContent();
        }
        setAudioState(panel, !isOn);
      });
    }

    // Кнопка обычной версии (сброс настроек доступности)
    var resetBtn = panel.querySelector('[data-action="reset"]');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        html.classList.remove('font-size-100', 'font-size-150', 'font-size-200');
        html.classList.remove('color-1', 'color-2', 'color-beige');
        setAudioState(panel, false);
        stopSpeech();

        localStorage.removeItem('accFontSize');
        localStorage.removeItem('accColorScheme');
        localStorage.removeItem('accAudioEnabled');

        // Сбрасываем активные состояния кнопок размеров шрифта и цветовых схем
        updateButtonState(panel, '.acc-btn-group--font .acc-btn', null);
        updateButtonState(panel, '.acc-btn-group--color .acc-btn', null);

        var wrap = document.getElementById('accessibility-panel-wrap');
        if (wrap) {
          wrap.setAttribute('aria-hidden', 'true');
          wrap.classList.remove('acc-panel-wrap--open');
        }
        localStorage.setItem('accPanelOpen', 'false');
      });
    }
  }

  /**
   * Устанавливает состояние аудио кнопки
   * @param {HTMLElement} panel - Панель доступности
   * @param {boolean} on - Состояние включения
   */
  function setAudioState(panel, on) {
    if (!panel) return;
    var audioBtn = panel.querySelector('[data-action="audio-toggle"]');
    if (!audioBtn) return;

    var iconOff = audioBtn.querySelector('.acc-icon-audio--off');
    var iconOn = audioBtn.querySelector('.acc-icon-audio--on');

    audioBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    audioBtn.classList.toggle('active', on);
    if (iconOff && iconOn) {
      iconOff.style.display = on ? 'none' : 'block';
      iconOn.style.display = on ? 'block' : 'none';
    }

    localStorage.setItem('accAudioEnabled', on ? 'true' : 'false');
  }

  /**
   * Восстанавливает сохраненные настройки доступности
   * @param {HTMLElement} panel - Панель доступности
   */
  function restoreSettings(panel) {
    var html = document.documentElement;
    var savedSize = localStorage.getItem('accFontSize');
    var savedScheme = localStorage.getItem('accColorScheme');
    var savedAudio = localStorage.getItem('accAudioEnabled') === 'true';

    if (savedSize && ['font-size-100', 'font-size-150', 'font-size-200'].indexOf(savedSize) !== -1) {
      html.classList.add(savedSize);
      var fontBtn = panel.querySelector('[data-action="font"][data-size="' + savedSize.replace('font-size-', '') + '"]');
      if (fontBtn) updateButtonState(panel, '.acc-btn-group--font .acc-btn', fontBtn);
    }

    if (savedScheme && ['color-1', 'color-2', 'color-beige'].indexOf(savedScheme) !== -1) {
      html.classList.add(savedScheme);
      var colorBtn = panel.querySelector('[data-action="color"][data-scheme="' + savedScheme + '"]');
      if (colorBtn) updateButtonState(panel, '.acc-btn-group--color .acc-btn', colorBtn);
    }

    if (savedAudio) {
      setAudioState(panel, true);
    }
  }

  var panelWrap = null;

  // Обработчик клика по кнопке переключения панели доступности
  toggleBtn.addEventListener('click', function (e) {
    e.preventDefault();
    panelWrap = document.getElementById('accessibility-panel-wrap');
    if (!panelWrap) {
      getPanelContainer();
      panelWrap = document.getElementById('accessibility-panel-wrap');
    }
    var panel = document.getElementById('accessibility-toolbar');
    if (!panel && panelWrap) {
      loadAccessibilityStyles();
      panel = createPanel();
      if (panel) {
        setupHandlers(panel);
        restoreSettings(panel);
      }
    }
    // Обновляем тексты панели в соответствии с текущим языком
    if (panel) {
      updatePanelTexts(panel);
    }
    if (panelWrap) {
      var isHidden = panelWrap.getAttribute('aria-hidden') === 'true';
      panelWrap.setAttribute('aria-hidden', !isHidden);
      panelWrap.classList.toggle('acc-panel-wrap--open', isHidden);
      localStorage.setItem('accPanelOpen', isHidden ? 'true' : 'false');
    }
  });

  // При загрузке страницы проверяем, нужно ли открыть панель доступности
  window.addEventListener('load', function () {
    if (localStorage.getItem('accPanelOpen') === 'true') {
      toggleBtn.click();
    }
  });

  // Обновляем тексты панели при смене языка
  document.addEventListener('languageChanged', function () {
    const panel = document.getElementById('accessibility-toolbar');
    if (panel) {
      updatePanelTexts(panel);
    }
  });

  var utterance = null;
  var isSpeaking = false;

  /**
   * Озвучивает содержимое страницы
   */
  function speakPageContent() {
    if (isSpeaking || !window.speechSynthesis) return;
    var textEls = document.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, button, a, label');
    var text = '';
    for (var i = 0; i < textEls.length; i++) {
      var t = (textEls[i].innerText || '').trim();
      if (t.length > 10) text += t + '. ';
    }
    text = text.substring(0, 1200) + '. Конец.';
    utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.85;
    utterance.onend = function () { isSpeaking = false; };
    utterance.onerror = function () { isSpeaking = false; };
    speechSynthesis.speak(utterance);
    isSpeaking = true;
  }

  /**
   * Останавливает озвучку
   */
  function stopSpeech() {
    if (window.speechSynthesis) speechSynthesis.cancel();
    isSpeaking = false;
  }
})();
