module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',

  {
    name: 'strapi::cors',
    config: {
      origin: [
        'https://science-map.vercel.app',
        'https://science-map.vercel.app/',
        'https://science-map.vercel.app/index.html',
        'https://science-map.vercel.app/full-article.html',
        'https://science-map.vercel.app/author.html',
        'http://localhost:3000',
        
      ],
      headers: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    },
  },

  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',

  // ❌ УДАЛИЛИ response-time (его нет в v5)
  // ❌ УДАЛИЛИ compression (если не установлен)

  {
    resolve: './src/middlewares/cache-control',
  }
];