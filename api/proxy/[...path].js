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

  // Проверяем наличие path
  if (!req.query.path || !Array.isArray(req.query.path)) {
    console.error('Missing or invalid path parameter:', req.query);
    return res.status(400).json({ error: 'Invalid path' });
  }

  // Целевой URL Strapi
  const baseUrl = 'https://special-bear-65dd39b4fc.strapiapp.com';
  // Путь из параметров запроса
  const path = req.query.path.join('/');
  const targetUrl = `${baseUrl}/${path}`;

  // Копируем query-параметры (кроме path)
  const query = new URLSearchParams(req.query);
  // Удаляем параметр path из query
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