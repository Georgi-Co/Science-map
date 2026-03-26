// Vercel Serverless Function для проксирования запросов к Strapi
// Разрешает CORS, добавляя необходимые заголовки

export default async function handler(req, res) {
  // Устанавливаем CORS заголовки для всех ответов
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Requested-With, Origin, Accept');

  // Обработка preflight OPTIONS запроса
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Разрешаем только GET запросы (можно расширить)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Определяем целевой путь
  let targetPath = '';
  if (req.query.path && Array.isArray(req.query.path)) {
    targetPath = req.query.path.join('/');
  } else {
    // Fallback: извлекаем из URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const prefix = '/api/proxy/';
    if (!pathname.startsWith(prefix)) {
      return res.status(400).json({ error: 'Invalid proxy path', details: { pathname } });
    }
    targetPath = pathname.slice(prefix.length);
    if (targetPath.startsWith('/')) targetPath = targetPath.slice(1);
  }

  if (!targetPath) {
    return res.status(400).json({ error: 'Missing path' });
  }

  // Целевой URL Strapi
  const baseUrl = 'https://special-bear-65dd39b4fc.strapiapp.com';
  const targetUrl = `${baseUrl}/${targetPath}`;

  // Копируем query-параметры из оригинального URL
  const query = new URLSearchParams(req.query);
  query.delete('path');
  const queryString = query.toString();
  const fullUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl;

  console.log('Proxying to:', fullUrl);

  try {
    const response = await fetch(fullUrl, {
      headers: {
        // При необходимости добавьте авторизационные заголовки
        ...(req.headers.authorization && { Authorization: req.headers.authorization }),
      },
    });

    console.log('Upstream status:', response.status);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Upstream error: ${response.status}`,
        details: await response.text().catch(() => ''),
      });
    }

    const data = await response.json();

    // Возвращаем данные
    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

export const config = {
  api: {
    externalResolver: true,
  },
};