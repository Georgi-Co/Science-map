// ./src/middlewares/cache.js
module.exports = () => {
  const NodeCache = require('node-cache');
  const CACHE_TTL = process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL) : 10800; // 3 часа по умолчанию
  const cache = new NodeCache({ stdTTL: CACHE_TTL });

  return async (ctx /** @type {any} */, next /** @type {any} */) => {
    // Кэшируем только GET-запросы к API, исключая админские пути
    if (ctx.method === 'GET' && ctx.url.startsWith('/api') && !ctx.url.includes('/admin')) {
      const cachedBody = cache.get(ctx.url);
      if (cachedBody) {
        ctx.body = cachedBody;
        ctx.set('X-Cache', 'HIT');
        return;
      }
      await next();
      // Кэшируем только успешные ответы (статус 2xx)
      if (ctx.status >= 200 && ctx.status < 300) {
        cache.set(ctx.url, ctx.body);
        ctx.set('X-Cache', 'MISS');
      }
    } else {
      await next();
    }
  };
};