module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',

  {
    name: 'strapi::cors',
    config: {
      origin: [
        'https://science-map.vercel.app',
        'http://localhost:3000',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:1337', // для тестирования
        'http://127.0.0.1:1337'
      ],
      headers: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Origin',
        'Accept',
        'User-Agent',
        'DNT',
        'Cache-Control',
        'X-Forwarded-For',
        'X-Real-IP',
        'Access-Control-Allow-Origin'
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
