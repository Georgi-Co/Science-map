module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',

  {
    name: 'strapi::cors',
    config: {
      origin: [
        'https://science-map.vercel.app',
        'http://localhost:3000'
      ],
      headers: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Origin',
        'Accept'
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: false, // установите true, если используете куки/авторизацию
      maxAge: 300 // 5 минут для preflight-запросов
    }
  },

  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',

  {
    resolve: './src/middlewares/cache-control'
  }
];
