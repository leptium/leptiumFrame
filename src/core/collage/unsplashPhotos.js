/**
 * Colección curada de fotografías de alta resolución de Unsplash y descargador local.
 * Permite generar collages instantáneos sin requerir que el usuario tenga fotos propias
 * en su dispositivo, inyectando las imágenes como Blob URLs libres de restricciones CORS.
 */

export const CURATED_UNSPLASH_PHOTOS = [
  {
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=85',
    lugar: 'Dolomitas, Alpes Italianos',
    fecha: '2024'
  },
  {
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&auto=format&fit=crop&q=85',
    lugar: 'Bosque de Bambú, Kioto',
    fecha: '2024'
  },
  {
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop&q=85',
    lugar: 'Lago de Montaña, Suiza',
    fecha: '2024'
  },
  {
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=85',
    lugar: 'Playa & Atardecer, Maldivas',
    fecha: '2023'
  },
  {
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=85',
    lugar: 'Arquitectura Minimalista, Copenhague',
    fecha: '2023'
  },
  {
    url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200&auto=format&fit=crop&q=85',
    lugar: 'Colinas de Cipreses, Toscana',
    fecha: '2024'
  },
  {
    url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=1200&auto=format&fit=crop&q=85',
    lugar: 'Luces del Norte, Noruega',
    fecha: '2024'
  },
  {
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=85',
    lugar: 'Niebla en Redwoods, California',
    fecha: '2023'
  },
  {
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&auto=format&fit=crop&q=85',
    lugar: 'Dunas Doradas, Sahara',
    fecha: '2024'
  },
  {
    url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200&auto=format&fit=crop&q=85',
    lugar: 'Positano, Costa Amalfitana',
    fecha: '2024'
  },
  {
    url: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=1200&auto=format&fit=crop&q=85',
    lugar: 'Reflejo del Monte Fuji, Japón',
    fecha: '2024'
  },
  {
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=85',
    lugar: 'Fiordo Glaciar, Escandinavia',
    fecha: '2023'
  }
];

/**
 * Descarga y convierte en Blob URLs un conjunto aleatorio de fotos de Unsplash.
 * Al devolver URLs blob:, se garantiza total inmunidad a bloqueos CORS en el canvas.
 * @param {number} count Cantidad de fotos a obtener (por defecto 4)
 * @returns {Promise<Array<{ruta: string, lugar: string, fecha: string}>>}
 */
export async function getUnsplashPhotoBlobs(count = 4) {
  // Mezclar aleatoriamente la colección
  const shuffled = [...CURATED_UNSPLASH_PHOTOS].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  const downloadedPhotos = await Promise.all(
    selected.map(async (photo) => {
      try {
        const response = await fetch(photo.url, { mode: 'cors' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        return {
          ruta: blobUrl,
          lugar: photo.lugar,
          fecha: photo.fecha
        };
      } catch (err) {
        console.warn(`[Unsplash] Fallo al descargar foto localmente, usando URL directa:`, err);
        return {
          ruta: photo.url,
          lugar: photo.lugar,
          fecha: photo.fecha
        };
      }
    })
  );

  return downloadedPhotos;
}
