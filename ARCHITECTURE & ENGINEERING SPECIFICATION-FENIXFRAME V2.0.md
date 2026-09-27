ARCHITECTURE & ENGINEERING SPECIFICATION: FENIXFRAME CORE (FASE 1)
Project Name: leptium FenixFrame (Digital Canvas OS)

Target Platform: WebKit Legacy / Modern Mobile & Tablet Browsers (Offline-First / Zero-Knowledge PWA)

Stack: Vanilla JavaScript (ES2022+), CSS3 Moderno (Custom Properties, Flexbox, Grid), HTML5 semántico, IndexedDB (idb nativo), Cloudflare Pages (_headers).

1. ÁRBOL DE ARCHIVOS Y ARTEFACTOS DEL REPOSITORIO

leptium-fenixframe/
├── _headers                     # Cabeceras de seguridad CSP, Permissions-Policy, X-Frame-Options
├── index.html                   # Landing page comercial (con iframe interactivo de previsualización)
├── app.html                     # Runtime principal del lienzo digital (Digital Canvas OS)
├── app.css                      # Estilos de la aplicación, paleta monocromática, backdrop-filter, grid
├── app.js                       # Controlador del carrusel, gestión de memoria, listeners e integración
├── i18n.js                      # Motor de internacionalización y diccionarios (ES, EN, FR)
├── db.js                        # Capa de abstracción de almacenamiento local (IndexedDB: FenixFrameDB)
├── weather.js                   # Módulo de clima (Open-Meteo, geocodificación internacional, GPS/Manual)
├── collage.js                   # Motor de renderizado en Canvas 2D (Collage 2x2, exportación/descarga)
└── public/
    └── assets/
        └── demo/                # Catálogo semilla descargado localmente (10 JPEGs optimizados)
            ├── demo_01.jpg
            ├── ...
            └── demo_10.jpg


2. POLÍTICA DE SEGURIDAD Y RED (_headers)
Para permitir el funcionamiento embebido del demo en index.html, la integración de Lemon Squeezy y la descarga segura de metadatos del clima sin bloqueos por CSP:

/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: screen-wake-lock=(self), share=(self)
  Content-Security-Policy: default-src 'self' https://*.pages.dev https://leptiumframe.app; script-src 'self' 'unsafe-inline' https://assets.lemonsqueezy.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; media-src 'self' blob:; connect-src 'self' https://*.pages.dev https://leptiumframe.app https://api.lemonsqueezy.com https://geocoding-api.open-meteo.com https://api.open-meteo.com; frame-src 'self' https://leptiumframe.app https://*.pages.dev https://*.lemonsqueezy.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self';


  3. ARQUITECTURA DE DATOS LOCALES (IndexedDB & localStorage)
A. IndexedDB (FenixFrameDB)
ObjectStore photos: Almacena objetos de imagen:

id (String / UUID)

blob (Blob binario)

name (String)

date (String / Timestamp)

is_demo (Boolean)

is_hidden (Boolean)

is_favorite (Boolean)

Garbage Collection Estricto: Toda previsualización o cambio de diapositiva debe liberar memoria invocando URL.revokeObjectURL(currentUrl) antes de generar o vincular una nueva imagen para no desbordar la memoria RAM en hardware con WebKit legacy.

B. localStorage Keys
leptium_language: 'es' | 'en' | 'fr'

leptium_weather_units: 'celsius' | 'fahrenheit'

leptium_manual_location: { lat, lon, name }

leptium_hidden_ids: string[] (IDs de fotos excluidas del carrusel)

leptium_favoritas: string[] (IDs de fotos marcadas como favoritas)

4. ESTADOS DE LA INTERFAZ Y COMPORTAMIENTO DE PANTALLA
A. Modo Reproducción Activa (Slideshow)
Widgets ambientales visibles: Reloj de cabecera, fecha, saludo de bienvenida contextual y widget de clima.

Barra de herramientas (#actionToolbar): Completa (Pantalla completa, Pausa/Play, Favoritos, Info, Collage, Agregar fotos +, Descargar, Ocultar foto, Ajustes).

B. Modo Pausa / Lienzo Limpio (Clean Canvas)
Desvanecimiento suave (fade-out): Se ocultan el reloj, fecha, saludo y metadatos superpuestos para transformar la pantalla en un cuadro fotográfico limpio.

Controles mínimos preservados (.keep-on-pause): Solo quedan visibles los botones esenciales:

Play (reanudar)

Información de foto (#btnInfo)

Collage Studio (#btnExportCollage)

Agregar fotos (#btnAddMedia)

C. Modo Escudo de Rescate (Zero-State Shield)
Si el usuario oculta todas las fotos disponibles, el carrusel se interrumpe y se monta una tarjeta de rescate centrada (#hiddenZeroStateShield) con botón para "Restablecer visibilidad", evitando pantallas negras o congeladas.

5. MÓDULOS FUNCIONALES DE FASE 1
A. Importador Rápido (#btnAddMedia) & Sincronización Reactiva
Botón + contiguo al botón de collage.

Dispara un <input type="file" multiple accept="image/*">.

Guarda los blobs inmediatamente en FenixFrameDB.

Regla Reactiva: Refresca de inmediato la lista activa en memoria (state.activePhotos) y las suma al carrusel en curso sin forzar un refresco de página.

B. Collage Studio 2x2 (#collageModal)
Al tocar #btnExportCollage, despliega un modal con dos modalidades:

Automático: Combina la foto actual y las 3 más recientes.

Selector manual: Rejilla de miniaturas leídas desde IndexedDB con contador 0/4 a 4/4 y orden visual numérico.

Renderizado en <canvas> 2D exportable a JPG de alta resolución.

C. Módulo de Clima y Localización
Widget con icono SVG de pin de mapa fijo y texto interactivo ("Toca para fijar tu ciudad").

Al presionar abre modal con dos opciones:

GPS: Botón "Usar mi ubicación actual" (navigator.geolocation).

Manual: Entrada de texto con resolución de ciudades en idioma local del navegador (navigator.language) usando Open-Meteo Geocoding.

Selector de temperatura (°C / °F) en el modal y alternancia al tocar la temperatura en el widget.

D. Ajustes y Gestión de Almacenamiento
Accesible desde el calendario/menú de ajustes.

Incluye el botón "Restablecer a fotos de muestra" (#btnResetToDemo), que vacía FenixFrameDB, limpia claves de favoritos/ocultos y reinyecta el catálogo demo de 10 fotos.


ClaveEspañol (es)Inglés (en)Francés (fr)zero_state_titleTodas las fotos están ocultasAll photos are hiddenToutes les photos sont masquéeszero_state_descHas marcado todas las fotos como ocultas.You have marked all photos as hidden.Vous avez masqué toutes les photos.zero_state_btnRestablecer visibilidadRestore visibilityRestaurer la visibilitéweather_titleConfigurar climaConfigure weatherConfigurer la météoweather_use_gpsUsar mi ubicación actualUse my current locationUtiliser ma position actuelleweather_or_manualo ingresar manualmenteor enter manuallyou saisir manuellementweather_placeholderCiudad o código postal...City or zip code...Ville ou code postal...weather_search_btnBuscar y fijarSearch & setRechercher et définirweather_cta_tapToca para fijar tu ciudadTap to set your cityTouchez pour définir votre villestorage_clear_demo_btnRestablecer a fotos de muestraReset to demo galleryRéinitialiser la galerie démostorage_clear_confirm¿Deseas restaurar la galería de muestra?Do you want to restore demo gallery?Voulez-vous restaurer la galerie démo ?Guarda este documento como tu referencia técnica inamovible de la Fase 1.Cuando estés listo, entramos de lleno en la Fase 2: Control Remoto Local y Sincronización Móvil sin Nube. Te explicaré cómo estructuraremos la arquitectura (WebSockets / WebRTC / servidor local ligero) para que el marco genere un código QR y puedas subir fotos y controlarlo desde el celular sin instalar nada.



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

# leptiumFrame — Especificación de Arquitectura y Roadmap

## 1. Visión del Producto
Sistema para marcos de fotos inteligentes y pantallas interactivas 24/7.
- Frontend: HTML5, CSS3 (Glassmorphism), JavaScript modular, Canvas dinámico, visor EXIF, reloj, clima por API.
- Distribución: Web/PWA (leptiumframe.app), Android (Google Play AAB), iOS/iPadOS (App Store).

## 2. Principio Arquitectónico: Hardware Abstraction Layer (HAL)
El código de negocio (UI, canvas, reloj, favoritos) nunca debe invocar APIs del navegador ni plugins nativos directamente. Toda interacción con el hardware y almacenamiento debe pasar por adaptadores en `src/hal/`:

- `src/hal/interfaces/`: Contratos de interfaces (`IWakeLock`, `IStorage`, `IMediaPicker`).
- `src/hal/web/`: Implementaciones estándar web (IndexedDB, navigator.wakeLock, File System Access API).
- `src/hal/native/`: Implementaciones nativas Capacitor (@capacitor/preferences, @capacitor-community/keep-awake, @capacitor/camera, @capacitor/filesystem).
- `src/hal/index.js`: Instancia única exportada según `Capacitor.isNativePlatform()`.

## 3. Requisitos Críticos de Rendimiento (24/7)
1. **Prevención de fugas de memoria en Canvas/Imágenes:** Revocar Object URLs (`URL.revokeObjectURL`) tras cargarlas en memoria y liberar contextos al cambiar de imagen.
2. **Anti-Burn-in:** El módulo `src/core/burnin/` debe aplicar micro-desplazamientos de 1 a 2 píxeles en elementos estáticos (reloj, clima) periódicamente.
3. **Manejo de WakeLock:** Re-adquirir el bloqueo de pantalla si la aplicación vuelve de segundo plano (`visibilitychange`).

## 4. Estructura de Carpetas Objetivo
- `functions/api/`: Cloudflare Pages Functions (proxy de API de clima y webhooks).
- `public/`: Assets estáticos, `manifest.webmanifest`, `sw.js`.
- `src/core/`: Lógica de negocio pura (exif, collage, estado, burnin).
- `src/hal/`: Capa de abstracción de hardware.
- `src/ui/`: Componentes visuales y estilos Glassmorphism.
- `android/` e `ios/`: Proyectos nativos generados por Capacitor.

