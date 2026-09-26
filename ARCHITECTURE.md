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