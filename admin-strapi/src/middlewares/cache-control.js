module.exports = () => {
  return async (ctx /** @type {any} */, next /** @type {any} */) => {
    await next();

    if (ctx.url.startsWith('/api')) {
      ctx.set('Cache-Control', 'public, max-age=60');
    }
  };
};