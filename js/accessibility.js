

/**
 * accessibility.js — Версия для слабовидящих
 * Полная инклюзивная панель: шрифт, цвет, озвучка, брайль, скрытие изображений
 * Сохраняет настройки в localStorage
 */

(function () {
  const toggleBtn = document.getElementById('toggle-accessible');
  if (!toggleBtn) return;

  let isToolbarInitialized = false;

  // Обработчик клика по кнопке
  toggleBtn.addEventListener('click', function (e) {
    e.preventDefault();

    let toolbar = document.getElementById('accessibility-toolbar');

    if (!toolbar) {
      createAccessibilityToolbar();
      loadAccessibilityStyles();
      setupToolbarHandlers();
      restoreSettings(); // Восстановить сразу после создания
      isToolbarInitialized = true;
    } else {
      toolbar.style.display = toolbar.style.display === 'none' ? 'flex' : 'none';
      // Сохраняем состояние видимости панели
      localStorage.setItem('toolbarVisible', toolbar.style.display !== 'none');
    }
  });

  function createAccessibilityToolbar() {
    const toolbar = document.createElement('div');
    toolbar.id = 'accessibility-toolbar';
    toolbar.className = 'accessibility-toolbar';
    toolbar.innerHTML = `
      <div class="p-content">
        <button type="button" class="btn" data-action="content" title="Перейти к содержанию">
          <img src="img/arrow_circle_down.svg" alt="" class="icon"> К содержанию
        </button>
      </div>

      <div class="p-font">
        <div class="btn-title">Шрифт</div>
        <div class="btn-group btn-group-font-size">
          <button type="button" class="btn btn-font-size-100" data-action="font" data-size="100" aria-pressed="false" title="Маленький шрифт">
            <span class="font-preview" style="font-size: 0.8em;">А</span>
          </button>
          <button type="button" class="btn btn-font-size-150" data-action="font" data-size="150" aria-pressed="false" title="Средний шрифт">
            <span class="font-preview" style="font-size: 1.2em;">А</span>
          </button>
          <button type="button" class="btn btn-font-size-200" data-action="font" data-size="200" aria-pressed="false" title="Большой шрифт">
            <span class="font-preview" style="font-size: 1.6em;">А</span>
          </button>
        </div>
      </div>

      <div class="p-color">
        <div class="btn-title">Цвет</div>
        <div class="btn-group btn-group-color">
          <button type="button" class="btn btn-color-1" data-action="color" data-scheme="color-1" aria-pressed="false" title="Чёрный на белом">Ц</button>
          <button type="button" class="btn btn-color-2" data-action="color" data-scheme="color-2" aria-pressed="false" title="Белый на чёрном">Ц</button>
          <button type="button" class="btn btn-color-3" data-action="color" data-scheme="color-3" aria-pressed="false" title="Жёлтый на чёрном">Ц</button>
          <button type="button" class="btn btn-color-4" data-action="color" data-scheme="color-4" aria-pressed="false" title="Зелёный на чёрном">Ц</button>
          <button type="button" class="btn btn-color-5" data-action="color" data-scheme="color-5" aria-pressed="false" title="Белый на синем">Ц</button>
        </div>
      </div>

      <div class="p-audio">
        <div class="btn-title">Озвучка</div>
        <div class="btn-group">
          <button type="button" class="btn btn-audio-toggle" data-action="audio" aria-pressed="false" title="Включить озвучку страницы">
            <img src="img/volume_off.svg" alt="Выключить звук" class="icon icon-audio-off">
            <img src="img/volume_on.svg" alt="Включить звук" class="icon icon-audio-on" style="display:none;">
          </button>
        </div>
      </div>

      <div class="p-braille">
        <div class="btn-title">Брайль</div>
        <div class="btn-group">
          <button type="button" class="btn btn-braille-toggle" data-action="braille" aria-pressed="false" title="Включить шрифт Брайля">
            <img src="img/braille.svg" alt="Шрифт Брайля" class="icon">
          </button>
        </div>
      </div>

      <div class="p-images">
        <div class="btn-title">Изображения</div>
        <div class="btn-group">
          <button type="button" class="btn btn-images-toggle" data-action="images" aria-pressed="true" title="Скрыть изображения">
            <img src="img/visibility_off.svg" alt="Скрыть изображения" class="icon">
          </button>
        </div>
      </div>

      <div class="p-setting">
        <button type="button" class="btn btn-exit" data-action="reset" title="Вернуть обычные настройки">
          <img src="img/settings.svg" alt="" class="icon"> Обычная версия
        </button>
      </div>
    `;
    document.body.appendChild(toolbar);
  }

  function loadAccessibilityStyles() {
    if (document.getElementById('accessibility-css')) return;

    const link = document.createElement('link');
    link.id = 'accessibility-css';
    link.rel = 'stylesheet';
    link.href = 'css/accessibility.css';
    document.head.appendChild(link);
  }

  function setupToolbarHandlers() {
    const toolbar = document.getElementById('accessibility-toolbar');
    const html = document.documentElement;

    // К содержанию
    toolbar.querySelector('[data-action="content"]')?.addEventListener('click', () => {
      const main = document.querySelector('main') || document.querySelector('#content');
      if (main) {
        main.setAttribute('tabindex', '-1');
        main.focus();
      }
    });

    // Размер шрифта
    toolbar.querySelectorAll('[data-action="font"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const size = btn.getAttribute('data-size');
        updateButtonState(toolbar, '.btn-group-font-size .btn', btn);
        html.classList.remove('font-size-100', 'font-size-150', 'font-size-200');
        html.classList.add(`font-size-${size}`);
        localStorage.setItem('fontSize', `font-size-${size}`);
      });
    });

    // Цветовая схема
    toolbar.querySelectorAll('[data-action="color"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const scheme = btn.getAttribute('data-scheme');
        updateButtonState(toolbar, '.btn-group-color .btn', btn);
        html.classList.remove('color-1', 'color-2', 'color-3', 'color-4', 'color-5');
        html.classList.add(scheme);
        localStorage.setItem('colorScheme', scheme);
      });
    });

// Озвучка (скринридер)
const audioBtn = toolbar.querySelector('[data-action="audio"]');
if (audioBtn) {
  audioBtn.addEventListener('click', () => {
    const isOn = audioBtn.getAttribute('aria-pressed') === 'true';
    const iconOff = audioBtn.querySelector('.icon-audio-off');
    const iconOn = audioBtn.querySelector('.icon-audio-on');

    if (isOn) {
      // Выключаем озвучку
      iconOff.style.display = 'inline';
      iconOn.style.display = 'none';
      audioBtn.setAttribute('aria-pressed', 'false');
      audioBtn.setAttribute('title', 'Включить озвучку страницы');
      stopSpeech();
    } else {
      // Включаем озвучку
      iconOff.style.display = 'none';
      iconOn.style.display = 'inline';
      audioBtn.setAttribute('aria-pressed', 'true');
      audioBtn.setAttribute('title', 'Выключить озвучку');
      speakPageContent();
    }

    localStorage.setItem('audioEnabled', !isOn);
  });
}

    // Шрифт Брайля
    const brailleBtn = toolbar.querySelector('[data-action="braille"]');
    if (brailleBtn) {
      brailleBtn.addEventListener('click', () => {
        const isOn = brailleBtn.getAttribute('aria-pressed') === 'true';
        html.classList.toggle('braille-mode', !isOn);
        updateButtonState(toolbar, '.btn-braille-toggle', brailleBtn);
        localStorage.setItem('brailleMode', !isOn);
      });
    }

    // Скрыть изображения
    const imagesBtn = toolbar.querySelector('[data-action="images"]');
    if (imagesBtn) {
      imagesBtn.addEventListener('click', () => {
        const isOn = imagesBtn.getAttribute('aria-pressed') === 'true';
        html.classList.toggle('no-images', !isOn);
        updateButtonState(toolbar, '.btn-images-toggle', imagesBtn);
        imagesBtn.setAttribute('title', isOn ? 'Показать изображения' : 'Скрыть изображения');
        localStorage.setItem('imagesEnabled', !isOn);
      });
    }

    // Сброс
    toolbar.querySelector('[data-action="reset"]')?.addEventListener('click', () => {
      html.className = '';
      localStorage.removeItem('fontSize');
      localStorage.removeItem('colorScheme');
      localStorage.removeItem('audioEnabled');
      localStorage.removeItem('brailleMode');
      localStorage.removeItem('imagesEnabled');
      localStorage.removeItem('toolbarVisible');
      stopSpeech();
      toolbar.remove();
      document.getElementById('toggle-accessible').focus();
    });
  }

  // Вспомогательная: обновляет состояние кнопок
  function updateButtonState(toolbar, groupSelector, activeBtn) {
    toolbar.querySelectorAll(groupSelector).forEach(btn => {
      btn.classList.remove('checked');
      btn.setAttribute('aria-pressed', 'false');
    });
    activeBtn.classList.add('checked');
    activeBtn.setAttribute('aria-pressed', 'true');
  }

  // Восстановление всех настроек
  function restoreSettings() {
    const html = document.documentElement;
    const savedSize = localStorage.getItem('fontSize');
    const savedColor = localStorage.getItem('colorScheme');
    const savedAudio = localStorage.getItem('audioEnabled') === 'true';
    const savedBraille = localStorage.getItem('brailleMode') === 'true';
    const savedImages = localStorage.getItem('imagesEnabled') !== 'false';
    const savedToolbarVisible = localStorage.getItem('toolbarVisible') === 'true';

    if (savedSize && ['font-size-100', 'font-size-150', 'font-size-200'].includes(savedSize)) {
      html.classList.add(savedSize);
    }

    if (savedColor && /^color-\\d$/.test(savedColor)) {
      html.classList.add(savedColor);
    }

    if (savedBraille) {
      html.classList.add('braille-mode');
    }

    if (!savedImages) {
      html.classList.add('no-images');
    }

    // Обновляем состояние кнопок
    const toolbar = document.getElementById('accessibility-toolbar');
    if (!toolbar) return;

    // Шрифт
    const fontBtn = toolbar.querySelector(`[data-size="${savedSize?.replace('font-size-', '')}"]`);
    if (fontBtn) updateButtonState(toolbar, '.btn-group-font-size .btn', fontBtn);

    // Цвет
    const colorBtn = toolbar.querySelector(`[data-scheme="${savedColor}"]`);
    if (colorBtn) updateButtonState(toolbar, '.btn-group-color .btn', colorBtn);

    // Брайль
    const brailleBtn = toolbar.querySelector('[data-action="braille"]');
    if (brailleBtn && savedBraille) {
      brailleBtn.setAttribute('aria-pressed', 'true');
      brailleBtn.classList.add('checked');
    }

    // Изображения
    const imagesBtn = toolbar.querySelector('[data-action="images"]');
    if (imagesBtn) {
      imagesBtn.setAttribute('aria-pressed', savedImages ? 'true' : 'false');
      imagesBtn.setAttribute('title', savedImages ? 'Скрыть изображения' : 'Показать изображения');
      if (!savedImages) imagesBtn.classList.add('checked');
    }

    // Аудио
    const audioBtn = toolbar.querySelector('[data-action="audio"]');
    if (audioBtn) {
      if (savedAudio) {
        audioBtn.setAttribute('aria-pressed', 'true');
        audioBtn.querySelector('.icon-audio-off').style.display = 'none';
        audioBtn.querySelector('.icon-audio-on').style.display = 'inline';
        audioBtn.setAttribute('title', 'Выключить озвучку');
      }
    }

    // Видимость панели
    if (savedToolbarVisible && toolbar) {
      toolbar.style.display = 'flex';
    }
  }

  // Восстановление при загрузке
  window.addEventListener('load', () => {
    const toolbar = document.getElementById('accessibility-toolbar');
    if (toolbar) {
      restoreSettings();
    } else if (localStorage.getItem('toolbarVisible') === 'true') {
      // Если панель должна быть видна, но ещё не создана — создаём
      toggleBtn.click();
    }
  });

  // === Функции озвучивания ===
  let utterance = null;
  let isSpeaking = false;

  function speakPageContent() {
    if (isSpeaking || !window.speechSynthesis) return;

    // Собираем текст для озвучки: заголовки, параграфы, списки, кнопки, ссылки
    const textElements = Array.from(document.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, button, a, label'));
    let text = '';

    for (const el of textElements) {
      const innerText = el.innerText.trim();
      if (innerText.length > 10) {
        text += innerText + '. ';
      }
    }

    // Ограничиваем длину текста для озвучки
    text = text.substring(0, 1200) + '. Конец.';

    utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.85; // Скорость речи
    utterance.pitch = 1;   // Тон голоса

    utterance.onend = () => {
      isSpeaking = false;
    };

    utterance.onerror = (event) => {
      console.error('Ошибка озвучки:', event);
      isSpeaking = false;
    };

    speechSynthesis.speak(utterance);
    isSpeaking = true;
  }

  function stopSpeech() {
    if (window.speechSynthesis) {
      speechSynthesis.cancel();
    }
    isSpeaking = false;
  }
})();




