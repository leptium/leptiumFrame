/**
 * Cloudflare Pages Function: /api/weather
 * Proxy serverless para consultar Open-Meteo protegiendo peticiones y evitando problemas CORS.
 */
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const lat = url.searchParams.get('latitude') || '43.67';
  const lon = url.searchParams.get('longitude') || '-70.44';

  try {
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit`;
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'leptiumFrame-EdgeWorker/1.0'
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Error upstream en el servicio meteorológico' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=900', // Caché en Edge por 15 minutos
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
