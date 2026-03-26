// Конфигурация API Strapi
window.API_CONFIG = {
  // Базовый URL API Strapi (облачный или локальный)
  BASE_URL: 'https://special-bear-65dd39b4fc.strapiapp.com',
  // Токен API для аутентификации (замените на свой)
  API_TOKEN: 'e97d50313a763c7d12ef1ceea5e413a6c8b92acebfd614018f1a4f9f5858ee286b6551b7148c1ace9720e5d548a82d2347cee1c913e5ea472ad9fac25e79d69cc011400257dbe0c20b5b0c7435381032932f2706417188eb283db5a04f63499fec4e8645a809cf38212a264e90d0199888936564bca550b3739da4d134ed10f8',
  // Включить использование токена (true/false)
  USE_TOKEN: true,
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
  // Формирование полного URL для endpoint
  url(endpoint) {
    return `${this.BASE_URL}${endpoint}`;
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