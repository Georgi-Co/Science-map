module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      origin: [
        'https://science-map.vercel.app', // твой продакшн фронтенд
        'http://localhost:3000',          // локальная разработка
      ],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',

  {
    name: 'strapi::compression',
  },
  {
    name: 'strapi::response-time',
  },

  // ✅ Кастомный middleware
  {
    resolve: './src/middlewares/cache-control',
  }
];