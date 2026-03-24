// ./src/middlewares/cache.js
module.exports = () => {
  const NodeCache = require('node-cache');
  const cache = new NodeCache({ stdTTL: 60 }); // кэш на 60 секунд

  return async (ctx /** @type {any} */, next /** @type {any} */) => {
    if (ctx.url.startsWith('/api')) {
      const cachedBody = cache.get(ctx.url);
      if (cachedBody) {
        ctx.body = cachedBody;
        return;
      }
      await next();
      cache.set(ctx.url, ctx.body);
    } else {
      await next();
    }
  };
};