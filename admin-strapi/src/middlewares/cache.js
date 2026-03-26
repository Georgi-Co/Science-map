// ./src/middlewares/cache.js
module.exports = () => {
  const NodeCache = require('node-cache');
  const CACHE_TTL = process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL) : 10800; // 3 часа по умолчанию
  const cache = new NodeCache({ stdTTL: CACHE_TTL, checkperiod: 600 });

  return async (ctx, next) => {
    // Кэшируем только GET-запросы к API, исключая админские пути
    if (ctx.method === 'GET' && ctx.url.startsWith('/api') && !ctx.url.includes('/admin')) {
      const cacheKey = ctx.url;
      const cachedBody = cache.get(cacheKey);
      if (cachedBody) {
        ctx.body = cachedBody;
        ctx.set('X-Cache', 'HIT');
        console.log(`[Cache] HIT for ${cacheKey}`);
        return;
      }
      console.log(`[Cache] MISS for ${cacheKey}`);
      await next();
      // Кэшируем только успешные ответы (статус 2xx) и только если тело не пустое
      if (ctx.status >= 200 && ctx.status < 300 && ctx.body) {
        try {
          cache.set(cacheKey, ctx.body);
          ctx.set('X-Cache', 'MISS');
          console.log(`[Cache] SET for ${cacheKey}, status ${ctx.status}`);
        } catch (err) {
          console.error(`[Cache] Error caching response for ${cacheKey}:`, err.message);
        }
      } else {
        console.log(`[Cache] Skip caching for ${cacheKey}, status ${ctx.status}, body present: ${!!ctx.body}`);
      }
    } else {
      await next();
    }
  };
};