// api/proxy/[...path].js
export default async function handler(req, res) {
  // Obtener el path completo de la URL
  const { path } = req.query;
  const apiUrl = `https://tfgv2-production.up.railway.app/api/${path.join('/')}`;
  
  console.log('🔄 Proxy request:', {
    method: req.method,
    originalUrl: req.url,
    targetUrl: apiUrl,
    path: path
  });

  try {
    const response = await fetch(apiUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();

    // Configurar CORS para el frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    console.log('✅ Proxy response:', {
      status: response.status,
      targetUrl: apiUrl
    });

    res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({ 
      error: 'Error de conexión con el servidor',
      details: error.message 
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};