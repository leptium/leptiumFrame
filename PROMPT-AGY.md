Actúa como Lead Multiplatform Software Architect y Senior Systems Engineer.

Acabo de abrir en este espacio de trabajo el código fuente base de "leptiumFrame", una aplicación validada para marcos de fotos digitales y pantallas interactivas de funcionamiento continuo (24/7), construida con HTML5, CSS3 (Glassmorphism estilo iOS), JavaScript modular, canvas interactivo para collages, visor EXIF, reloj y widget de clima.

Tu misión es transformar esta base de código en un monorepo unificado de nivel de producción ("web-first"), listo para desplegarse como PWA en Cloudflare Pages y empaquetarse con Capacitor para Android (Google Play) e iOS/iPadOS (App Store), sin alterar la identidad visual ni la experiencia de usuario actual.

Debes adherirte estrictamente a las siguientes DIRECTRICES TÉCNICAS NO NEGOCIABLES:

1. PATRÓN DE ARQUITECTURA (HARDWARE ABSTRACTION LAYER - HAL):
- El código de la UI, canvas y widgets NUNCA debe invocar APIs del navegador (como localStorage, navigator.wakeLock o <input type="file">) ni plugins de Capacitor directamente.
- Toda interacción con hardware, sensores o almacenamiento debe pasar por interfaces abstractas en `src/hal/interfaces/`:
  * IWakeLock: enable(), disable(), isSupported().
  * IStorage: get(key), set(key, val), remove(key), listKeys().
  * IMediaPicker: pickPhotos(options), getFileStream(id), getMetadata(id).
- Implementa dos conjuntos de adaptadores: `src/hal/web/` (IndexedDB, Screen Wake Lock API, File System Access) y `src/hal/native/` (@capacitor/preferences, @capacitor-community/keep-awake, @capacitor/camera, @capacitor/filesystem).
- Expón una instancia resuelta mediante `src/hal/index.js` que detecte el entorno usando `Capacitor.isNativePlatform()`.

2. GESTIÓN DE MEMORIA Y ESTABILIDAD 24/7:
- La aplicación se exhibirá durante días sin reiniciarse. Evita fugas de memoria (memory leaks) en WebKit:
  * Toda imagen cargada mediante URL.createObjectURL() debe ser liberada explícitamente con URL.revokeObjectURL() una vez renderizada en el canvas.
  * Implementa en `src/core/burnin/` un motor de prevención de quemado de pantalla (Pixel-Shifting): debe desplazar imperceptiblemente (1-2 píxeles) las capas de texto estático (reloj, widgets) cada 15 minutos.
  * El módulo WakeLock debe escuchar el evento `visibilitychange` para re-adquirir el bloqueo de pantalla automáticamente si la app pasa de segundo a primer plano.

3. ESTRUCTURA DE REPOSITORIO A IMPLEMENTAR:
- `src/core/`: Lógica pura desacoplada del DOM (exif streaming, collage canvas layout, state store, burnin engine).
- `src/hal/`: Capa de abstracción de hardware (interfaces, adaptadores web y nativos).
- `src/ui/`: Componentes Glassmorphism, estilos CSS, tokens y vistas.
- `public/`: Assets estáticos, base para el futuro `manifest.webmanifest` e iconos.
- `functions/api/`: Endpoint stub para Cloudflare Pages Functions (weather proxy).
- Raíz: `capacitor.config.ts`, `vite.config.js` y `package.json`.

4. CONFIGURACIÓN DE CAPACITOR & BUILD:
- Configura `capacitor.config.ts` con:
  * appId: 'app.leptiumframe.frame'
  * appName: 'leptiumFrame'
  * webDir: 'dist'
  * server: { androidScheme: 'https', iosScheme: 'capacitor' }
- Configura `vite.config.js` optimizado para build estático sin paths absolutos rotos (base: './').

PLAN DE EJECUCIÓN OBLIGATORIO:
Paso 1: Realiza una auditoría completa del código actual. Muéstrame un inventario detallado de los archivos existentes y cómo se comunican hoy en día el canvas, el visor EXIF y el clima.
Paso 2: Presenta el plan de refactorización y la propuesta de mapeo de archivos hacia la nueva arquitectura sin tocar el disco aún.
Paso 3: Tras mi aprobación del plan, ejecuta la reestructuración, crea los contratos HAL, instala las dependencias necesarias y corre un `npm run build` en la terminal para certificar que la compilación pase sin errores.

Comienza únicamente con el Paso 1 (Auditoría del código e inventario).