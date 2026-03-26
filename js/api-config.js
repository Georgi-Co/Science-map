// Конфигурация API Strapi
window.API_CONFIG = {
  // Базовый URL API Strapi.
  // На Vercel используем прокси-роут /strapi/* (см. vercel.json), чтобы обойти CORS.
  BASE_URL: '/strapi',
  // ВАЖНО: не храните API Token на клиенте (он публичный).
  API_TOKEN: '',
  // Включить использование токена (true/false)
  USE_TOKEN: false,
  // Дополнительные заголовки
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (this.USE_TOKEN && this.API_TOKEN) {
      headers['Authorization'] = `Bearer ${this.API_TOKEN}`;
    }
    return headers;
  },
  // Безопасно собираем абсолютный URL (работает и на file://, и на localhost, и на Vercel)
  getOrigin() {
    if (typeof window === 'undefined') return '';
    if (window.location && window.location.origin && window.location.origin !== 'null') {
      return window.location.origin;
    }
    // file:// не имеет origin — используем дефолт под Live Server
    return 'http://localhost:5500';
  },
  // Нормализуем BASE_URL (если относительный — делаем абсолютным)
  getBaseUrl() {
    const base = this.BASE_URL || '';
    if (base.startsWith('http://') || base.startsWith('https://')) return base;
    if (!base) return this.getOrigin();
    if (base.startsWith('/')) return `${this.getOrigin()}${base}`;
    return `${this.getOrigin()}/${base}`;
  },
  // Формирование полного URL для endpoint
  url(endpoint) {
    const base = this.getBaseUrl();
    if (!endpoint) return base;
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) return endpoint;
    if (endpoint.startsWith('/')) return `${base}${endpoint}`;
    return `${base}/${endpoint}`;
  },
  // Обёртка для fetch с настройками
  async fetch(endpoint, options = {}) {
    const url = this.url(endpoint);
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {}),
      },
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  },
};