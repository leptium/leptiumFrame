# leptiumFrame — Reporte Técnico Maestro y Documento de Arquitectura
> **Versión del Documento**: 2.0.0 (Producción)  
> **Fecha de Consolidación**: Septiembre 2026  
> **Propósito**: Respaldo técnico exhaustivo y guía de contexto para continuidad de desarrollo y asistencia mediante LLMs (Gemini ChatBox / Antigravity).

---

## Índice General

1. [Visión del Producto y Filosofía de Ingeniería](#1-visión-del-producto-y-filosofía-de-ingeniería)
2. [Stack Tecnológico y Reglas de Diseño](#2-stack-tecnológico-y-reglas-de-diseño)
3. [Estructura del Proyecto y Mapa de Archivos](#3-estructura-del-proyecto-y-mapa-de-archivos)
4. [Arquitectura del Sistema (Ports & Adapters / HAL)](#4-arquitectura-del-sistema-ports--adapters--hal)
5. [Desglose Módulo por Módulo](#5-desglose-módulo-por-módulo)
   - 5.1. [Hardware Abstraction Layer (HAL)](#51-hardware-abstraction-layer-hal)
   - 5.2. [Escudo Anti-Quemado 24/7 (Burn-In Shield)](#52-escudo-anti-quemado-247-burn-in-shield)
   - 5.3. [Ensamblador de Collages 4K (CollageEngine)](#53-ensamblador-de-collages-4k-collageengine)
   - 5.4. [Privacidad y Conexión Híbrida (CloudConnector)](#54-privacidad-y-conexión-híbrida-cloudconnector)
   - 5.5. [Motor de Licenciamiento y Validación (LicenseManager)](#55-motor-de-licenciamiento-y-validación-licensemanager)
   - 5.6. [Motor de Patrocinios y Recomendaciones QR (SponsorEngine)](#56-motor-de-patrocinios-y-recomendaciones-qr-sponsorengine)
   - 5.7. [Motor de Internacionalización (i18n)](#57-motor-de-internacionalización-i18n)
   - 5.8. [Gestión de Estado Reactivo (Store)](#58-gestión-de-estado-reactivo-store)
   - 5.9. [Módulo de Comunidad y Upcycling](#59-módulo-de-comunidad-y-upcycling)
   - 5.10. [Modo Limpieza de Pantalla](#510-modo-limpieza-de-pantalla)
6. [Sistema de Identidad Visual y Assets Vectoriales](#6-sistema-de-identidad-visual-y-assets-vectoriales)
7. [Matriz de Precios y Monetización Transparente](#7-matriz-de-precios-y-monetización-transparente)
8. [Historial de Evolución Técnica (Fases 1 a 18)](#8-historial-de-evolución-técnica-fases-1-a-18)
9. [Comandos de Desarrollo, Compilación y Despliegue](#9-comandos-de-desarrollo-compilación-y-despliegue)
10. [Guía de Continuidad para Gemini ChatBox (Instrucciones para el Asistente)](#10-guía-de-continuidad-para-gemini-chatbox-instrucciones-para-el-asistente)

---

## 1. Visión del Producto y Filosofía de Ingeniería

**leptiumFrame** es una plataforma de software de alta gama concebida para transformar dispositivos en desuso (especialmente iPads antiguos, tablets Android y pantallas táctiles HDMI conectadas a Raspberry Pi) en **marcos de fotos digitales inteligentes y de exhibición continua 24/7**.

### Pilares Fundamentales
1. **100% Upcycling**: En lugar de comprar marcos comerciales frágiles, costosos y contaminantes, rescatamos pantallas Retina y procesadores existentes, ahorrando 100% en hardware y generando 0 gramos de basura electrónica (WEEE).
2. **Privacidad Zero-Knowledge (Air-Gapped + Peer-to-Cloud)**:
   - *Modo Local*: Las fotos familiares viven en el almacenamiento local de la tablet y se procesan en el navegador. No existe ningún backend de almacenamiento intermedio que recolecte, examine o almacene fotografías de los usuarios.
   - *Modo Nube Personal*: Sincronización directa punto a punto desde álbumes compartidos de Google Photos, enlaces públicos de iCloud Photos o servidores privados Nextcloud/WebDAV.
3. **Cero Dependencias de Ejecución (Zero Runtime Dependencies)**:
   - Todo el frontend corre sobre **puro Vanilla JavaScript (ES2022)**, HTML5 semántico y CSS3 moderno.
   - Sin React, sin Vue, sin Angular, sin librerías de UI pesadas. Esto garantiza un arranque instantáneo, consumo despreciable de memoria RAM y una tasa constante de 60 cuadros por segundo sin sobrecalentamiento.
4. **Estética Nativa Apple / Android (Zero Emojis)**:
   - No se utilizan emojis convencionales de chat (`📱`, `🚀`, `🔥`, `💡`, `🧹`).
   - Toda la interfaz utiliza vectores SVG de precisión geométrica inspirados en los estándares **Apple SF Symbols**, **Apple Human Interface Guidelines (HIG)**, curvaturas de squircle continuo macOS/visionOS y fondos Glassmorphism oscuros OLED con aceleración por GPU.

---

## 2. Stack Tecnológico y Reglas de Diseño

| Componente | Tecnología | Justificación Técnica |
| :--- | :--- | :--- |
| **Lenguaje Base** | JavaScript Vanilla (ES2022 Modules) | Rendimiento nativo máximo, compatibilidad absoluta en navegadores antiguos (iOS 12+ Safari, Chrome Android). |
| **Bundler & Tooling** | Vite 5.4 | Empaquetado ultrarrápido (300ms), soporte de Tree-Shaking, base de rutas relativas (`base: './'`). |
| **Contenedores Nativos** | Capacitor 8 | Acceso a APIs nativas (Keep-Awake, Camera Picker, Preferences, Filesystem) para empaquetado como App nativa en iOS (Xcode) y Android (Android Studio). |
| **Plataforma PWA** | Web Manifest + Service Worker | Capacidad de instalación standalone en pantalla completa sin barras de navegación del explorador. |
| **Estilos & Layout** | CSS3 Moderno (Glassmorphism, CSS Grid, Flexbox) | Variables CSS personalizadas, `backdrop-filter: blur()`, tipografía fluida con `clamp()`, soporte de `100dvh` y `env(safe-area-inset-*)`. |
| **Pasarela de Pagos** | Lemon Squeezy | Modelo *Merchant of Record* para cobro global con retención fiscal automatizada, Apple Pay, Google Pay y emisión instantánea de claves de licencia. |
| **Gráficos & Arte** | SVG Puro (Scalable Vector Graphics) | Escalabilidad infinita de 16px a 4K, peso menor a 10KB, renderizado nítido en pantallas de alta densidad de píxeles (Retina). |

---

## 3. Estructura del Proyecto y Mapa de Archivos

```
leptiumFrame/
├── index.html                           # Landing page principal (presentación, comparativa, pricing, comunidad)
├── app/
│   └── index.html                       # Aplicación fullscreen del marco de fotos digital
├── docs/
│   └── TECHNICAL_MASTER_REPORT.md       # Este documento de arquitectura y respaldo técnico
├── public/
│   ├── logo.svg                         # Isotipo master oficial 512x512 (Squircle macOS / visionOS)
│   ├── favicon.svg                      # Favicon vectorial idéntico al logo master
│   ├── og-image.svg                     # Banner social de alta fidelidad 1200x630
│   ├── manifest.webmanifest             # Manifiesto PWA para instalación en iPadOS/Android
│   ├── sw.js                            # Service Worker con caché offline (v3)
│   └── _headers                         # Políticas de seguridad HSTS y Permissions-Policy para Cloudflare Pages
├── src/
│   ├── main.js                          # Punto de entrada y orquestador modular de la aplicación
│   ├── core/
│   │   ├── burnin/
│   │   │   └── burnInShield.js          # Algoritmo de desplazamiento de micro-píxeles para pantallas OLED/LCD
│   │   ├── collage/
│   │   │   └── collageEngine.js         # Ensamblador 2x2 en canvas 4K con manejo de memoria y EXIF
│   │   ├── cloud/
│   │   │   └── cloudConnector.js        # Conexión directa a Google Photos, iCloud, WebDAV y feeds JSON
│   │   ├── license/
│   │   │   ├── licenseManager.js        # Validación local de claves, tiers y persistencia
│   │   │   └── checkout.js              # Generador de URLs seguras para Lemon Squeezy
│   │   ├── ads/
│   │   │   └── sponsorEngine.js         # Motor de recomendaciones ambientales sutiles con código QR
│   │   ├── state/
│   │   │   └── store.js                 # Almacén de estado reactivo y persistente
│   │   ├── weather/
│   │   │   └── weatherService.js        # Servicio de geolocalización IP y pronóstico dinámico
│   │   └── i18n/
│   │       ├── i18n.js                  # Motor de traducción y reactividad DOM
│   │       ├── index.js                 # Exportador de paquetes de idioma
│   │       └── locales/
│   │           ├── es.js                # Diccionario en Español
│   │           ├── en.js                # Diccionario en Inglés
│   │           └── fr.js                # Diccionario en Francés
│   ├── hal/
│   │   ├── index.js                     # Inyector de dependencias (detecta Capacitor.isNativePlatform())
│   │   ├── interfaces/                  # Contratos y puertos abstractos JSDoc
│   │   │   ├── IWakeLock.js             # Interfaz de bloqueo de suspensión de pantalla
│   │   │   ├── IStorage.js              # Interfaz de persistencia clave-valor
│   │   │   └── IMediaPicker.js          # Interfaz de selección y guardado de archivos multimedia
│   │   ├── web/                         # Adaptadores estándar W3C para navegadores
│   │   │   ├── webWakeLock.js           # Implementación vía navigator.wakeLock
│   │   │   ├── webStorage.js            # Implementación con IndexedDB y localStorage
│   │   │   └── webMediaPicker.js        # Implementación con File System Access API / Blob
│   │   └── native/                      # Adaptadores nativos para Capacitor 8
│   │       ├── nativeWakeLock.js        # Implementación vía @capacitor-community/keep-awake
│   │       ├── nativeStorage.js         # Implementación vía @capacitor/preferences
│   │       └── nativeMedia.js           # Implementación vía @capacitor/camera y @capacitor/filesystem
│   └── ui/
│       └── styles/
│           ├── main.css                 # Estilos Glassmorphism de la aplicación del marco
│           └── landing.css              # Estilos de la landing page, modales, drawers y componentes
├── README.md                            # Documentación principal en Inglés para GitHub
├── README.es.md                         # Documentación en Español para GitHub
├── README.fr.md                         # Documentación en Francés para GitHub
├── capacitor.config.json                # Configuración de Capacitor 8 para Android e iOS
├── vite.config.js                       # Configuración de compilación Vite 5 con multi-página
└── package.json                         # Dependencias de compilación y scripts de ejecución
```

---

## 4. Arquitectura del Sistema (Ports & Adapters / HAL)

El sistema utiliza una arquitectura hexagonal estricta donde la capa de presentación desconoce la plataforma subyacente. Todo acceso a recursos del dispositivo pasa por el **Hardware Abstraction Layer (HAL)**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Capa de Presentación (UI)                          │
│         Landing Page (index.html)  │  Marco Fotográfico (app/index.html)    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                           Núcleo de Negocio (Core)                          │
│  BurnInShield │ CollageEngine │ CloudConnector │ LicenseManager │ Store     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    Hardware Abstraction Layer (HAL Ports)                   │
│           IWakeLock          │       IStorage       │     IMediaPicker      │
└──────────────────┬──────────────────────────────────────────┬───────────────┘
                   │                                          │
       [Si Capacitor.isNative()]                 [Si Entorno Web / PWA]
                   │                                          │
┌──────────────────▼───────────────┐      ┌───────────────────▼───────────────┐
│        Adaptadores Nativos       │      │          Adaptadores Web          │
│ • @capacitor-community/keep-awake│      │ • navigator.wakeLock              │
│ • @capacitor/preferences         │      │ • IndexedDB + localStorage        │
│ • @capacitor/camera & filesystem │      │ • HTML5 File Input / Blob API     │
└──────────────────────────────────┘      └───────────────────────────────────┘
```

---

## 5. Desglose Módulo por Módulo

### 5.1. Hardware Abstraction Layer (HAL)
* **`WakeLock`**: Resuelve el problema crítico de las tablets que apagan su pantalla tras minutos de inactividad. En la Web, solicita `navigator.wakeLock.request('screen')` y re-adquiere el bloqueo en el evento `visibilitychange`. En apps nativas, utiliza `@capacitor-community/keep-awake`.
* **`Storage`**: Proporciona persistencia asíncrona segura. Guarda el índice actual, configuración nocturna, álbumes conectados y fotos favoritas.
* **`MediaPicker`**: Abstrae la selección de fotografías desde la galería del dispositivo o archivos locales.

### 5.2. Escudo Anti-Quemado 24/7 (Burn-In Shield)
* **Archivo**: `src/core/burnin/burnInShield.js`
* **Problema**: Las pantallas OLED y AMOLED sufren retención permanente de imagen cuando elementos estáticos (como el reloj, la fecha o el widget de clima) permanecen encendidos en las mismas coordenadas exactas durante semanas.
* **Solución Técnica**:
  * Ejecuta un temporizador en segundo plano que cada 15 minutos aplica un desplazamiento sutil de micro-píxeles (`1px` a `2px`) en los elementos estáticos siguiendo una trayectoria elíptica orbital.
  * Modula automáticamente el contraste y brillo entre las 10:00 PM y las 7:00 AM (*Atenuación Nocturna*).

### 5.3. Ensamblador de Collages 4K (CollageEngine)
* **Archivo**: `src/core/collage/collageEngine.js`
* **Características**:
  * Toma 4 imágenes seleccionadas o del carrete y calcula una composición 2x2 simétrica sobre un elemento `<canvas>` en memoria a resolución de imprenta (3840 x 2160 o resolución nativa de pantalla).
  * Corrige automáticamente la rotación según los metadatos EXIF.
  * Libera las referencias de objetos `Image` inmediatamente después del renderizado para evitar fugas de memoria en WebKit (Safari en iPad).
  * Aplica marca de agua en versiones *Free* y *Básico*, y exporta composiciones limpias en alta resolución para usuarios *Premium Pro* y *Maker*.

### 5.4. Privacidad y Conexión Híbrida (CloudConnector)
* **Archivo**: `src/core/cloud/cloudConnector.js`
* **Protocolos Soportados**:
  1. *Google Photos / Drive*: Extracción de feeds de imágenes a partir de álbumes compartidos.
  2. *iCloud Photos*: Conexión directa a enlaces web compartidos de álbumes públicos de Apple.
  3. *WebDAV / Nextcloud*: Acceso autenticado mediante estándares abiertos a nubes privadas caseras.
  4. *Feed JSON / URLs Directas*: Integración flexible para servidores locales o URLs de cámaras/álbumes.
* **Validación de Licencia Pro (Gating)**:
  * La sincronización con nubes personales es una característica exclusiva de los tiers **Premium Pro** y **Maker**.
  * Si un usuario de la versión *Free* o *Básico* intenta sincronizar la nube, el sistema despliega un banner informativo y un modal guiado para adquirir o activar su licencia Pro.

### 5.5. Motor de Licenciamiento y Validación (LicenseManager)
* **Archivo**: `src/core/license/licenseManager.js`
* **Algoritmo de Validación Offline**:
  * Diseñado para funcionar sin depender de un servidor de autenticación en vivo, protegiendo la privacidad del usuario y asegurando que el marco funcione incluso sin internet.
  * Reconoce dos tipos de claves:
    1. *Formato Nativo con Prefijo*: `LF-BAS-XXXX-XXXX` (Básico), `LF-PRO-XXXX-XXXX` (Premium Pro), `LF-MKR-XXXX-XXXX` (Maker).
    2. *Formato UUID Estándar de Lemon Squeezy*: `XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`.
  * Guarda el estado de la licencia cifrado en `localStorage` (`leptium_license`) y sincroniza automáticamente las funciones del sistema mediante un patrón *Observer/PubSub*.

### 5.6. Motor de Patrocinios y Recomendaciones QR (SponsorEngine)
* **Archivo**: `src/core/ads/sponsorEngine.js`
* **Propósito**: Sostener el tier gratuito sin degradar la experiencia visual.
* **Comportamiento**:
  * Cada 12 a 15 diapositivas, intercala una tarjeta elegante con recomendación de accesorios para el hogar (soportes de madera para tablets, cables estéticos, iluminación tenue).
  * Incluye un código QR discreto que el usuario puede escanear con su teléfono celular sin tocar la tablet.
  * **Silenciado Absoluto**: En cuanto el usuario activa una clave *Básico*, *Pro* o *Maker*, el motor se apaga al 100% de forma irreversible.

### 5.7. Motor de Internacionalización (i18n)
* **Archivos**: `src/core/i18n/`
* **Idiomas Soportados**: Español (`es`), Inglés (`en`) y Francés (`fr`).
* **Mecanismo**:
  * Utiliza atributos HTML declarativos `data-i18n="ruta.de.clave"` y `data-i18n-attr="placeholder:ruta.clave"`.
  * Función `i18n.translateDOM(root)` que traduce instantáneamente la página sin recargar la ventana.
  * Persiste la selección del usuario en `localStorage` (`leptium_lang`) y sincroniza los selectores de idioma en el navbar, el drawer móvil y el menú de ajustes de la aplicación.

### 5.8. Gestión de Estado Reactivo (Store)
* **Archivo**: `src/core/state/store.js`
* Controla el estado global de la aplicación:
  * Diapositiva activa (`currentIndex`).
  * Lista de fotos favoritas (`favorites`).
  * Lista de fotos ocultas (`hiddenPhotos`).
  * Estado de pausa/reproducción (`isPaused`).
  * Filtro por año de captura (`activeYear`).
  * Marco estilo galería (`galleryFrame`).
  * Modo de atenuación nocturna (`autoDim`).

### 5.9. Módulo de Comunidad y Upcycling
* **Ubicación**: Sección `#community` en `index.html`.
* **Funcionalidad**:
  * Formulario interactivo donde los usuarios pueden compartir cómo revivieron su tablet vieja.
  * **Procesamiento de Fotos en el Cliente**: Permite subir una foto del montaje. Para evitar saturar el almacenamiento de 5MB del navegador, la imagen se reescala dinámicamente en memoria mediante un canvas a un máximo de 800px a calidad JPEG 0.8 antes de guardarse en `localStorage` (`leptium_community_stories`).
  * **Transparencia en Fase Beta**: Las tarjetas de muestra incluyen insignias `[Demostración Beta]` y un banner explicativo que invita a los usuarios a ser los primeros en compartir montajes reales con el hashtag `#leptiumFrame`.

### 5.10. Modo Limpieza de Pantalla
* **Ubicación**: `#cleanOverlay` en `app/index.html`.
* **Problema Resuelto**: Limpiar la pantalla de una tablet con un paño suele saltar fotos, pausar la app o abrir menús involuntariamente por los toques capacitivos del paño.
* **Solución**: Un botón "Limpiar Pantalla" que bloquea todos los eventos táctiles durante 30 segundos, desplegando un temporizador vectorial minimalista y desbloqueo táctil al finalizar.

---

## 6. Sistema de Identidad Visual y Assets Vectoriales

Toda la iconografía del proyecto ha sido creada a medida en formato SVG vectorial sin emojis informales:

| Asset | Ubicación | Descripción y Especificaciones |
| :--- | :--- | :--- |
| **Master Logo** | `public/logo.svg` | Lienzo de 512x512 con squircle continuo Apple, bisel de vidrio (`frameBevel`), orbe solar dorado con corona neón (`#ffd60a`), picos montañosos en gradiente cian-zafiro (`#38bdf8` a `#2563eb`), reflejo especular visionOS y 4 retículas de calibración `[ ⌜ ⌝ ⌞ ⌟ ]`. |
| **Favicon** | `public/favicon.svg` | Isotipo idéntico al master logo que escala nítidamente en pestañas del navegador, marcadores y accesos directos. |
| **Social Banner** | `public/og-image.svg` | Banner Open Graph de 1200x630 para Twitter Cards, LinkedIn y WhatsApp con marco iPad estilizado, métricas y badges limpios. |
| **Hero Logo** | `index.html` | Logo master ampliado (`clamp(120px, 14vw, 152px)`) con halo difuso posterior de 220px (`radial-gradient`), posicionado estratégicamente encima del titular principal. |

---

## 7. Matriz de Precios y Monetización Transparente

Modelo de pago único sin suscripciones recurrentes forzadas, gestionado por Lemon Squeezy:

| Característica | Free / Comunidad | Básico | Premium Pro (Recomendado) | Maker / Source License |
| :--- | :---: | :---: | :---: | :---: |
| **Precio** | **$0** (Gratis de por vida) | **$4.99** (Pago único) | **$9.99** (Pago único) | **$39.00** (Pago único) |
| **Publicidad / Códigos QR** | Recomendaciones sutiles | Cero publicidad | Cero publicidad | Cero publicidad |
| **Capacidad de Fotos** | Hasta 200 fotos | Hasta 1,000 fotos | **Fotos Ilimitadas** | **Fotos Ilimitadas** |
| **Modo de Conexión** | Local Offline | Local Offline | **✦ Nube Personal (Google, iCloud, WebDAV)** | **✦ Incluye Nube Personal** |
| **Escudo Anti-Quemado 24/7** | — | — | **Pixel-Shifting Activo** | **Pixel-Shifting Activo** |
| **Ensamblador Collages 4K** | Con marca de agua | Con marca de agua | **Exportación 4K Limpia** | **Exportación 4K Limpia** |
| **Dispositivos Permitidos** | 1 dispositivo | 1 dispositivo | **Hasta 5 dispositivos a la vez** | **Dispositivos Ilimitados** |
| **Acceso al Código Fuente** | — | — | — | **Código Fuente Completo Vanilla JS** |
| **Derechos de Self-Hosting** | — | — | — | **Licencia Comercial y DIY** |

---

## 8. Historial de Evolución Técnica (Fases 1 a 18)

* **Fase 1**: Inicialización del monorepo, configuración de Vite 5, Capacitor 8 y arquitectura HAL (*Ports & Adapters*).
* **Fase 2**: Implementación del *Burn-In Shield* (pixel-shifting) y servicio de clima desacoplado.
* **Fase 3**: Extracción de CSS Glassmorphism y eliminación de emojis en modales de limpieza.
* **Fase 4**: Soporte de navegación para computadoras (clics por zonas porcentuales de pantalla y flechas de teclado).
* **Fase 5**: Solución al bug de `100vh` en Safari iPadOS mediante `100dvh` y áreas táctiles de 44pt (Apple HIG).
* **Fase 6**: Botón flotante "Volver al inicio" en la app para evitar que el usuario quede atrapado en pantalla completa.
* **Fase 7**: Creación de la landing page con previsualizador interactivo del marco dentro de un marco de iPad.
* **Fase 8**: Implementación del motor trilingüe i18n (`es`, `en`, `fr`) en toda la web y aplicación.
* **Fase 9**: Integración de la pasarela de pagos con Lemon Squeezy y validación local de licencias (`LicenseManager`).
* **Fase 10**: Motor de patrocinios ambientales con código QR en la versión gratuita (`SponsorEngine`).
* **Fase 11**: Ensamblador de collages 2x2 en canvas 4K con exportación limpia en Pro.
* **Fase 12**: Módulo de comunidad con subida y compresión de fotos de tablets en el cliente, transparencia beta, retiro de venta de marcos físicos hacia un enfoque 100% Upcycling, hashtag `#leptiumFrame` y menú de hamburguesa glassmorphic para móviles.
* **Fase 13**: Destaque explícito de la conexión a nube personal en las tarjetas de precios y gating técnico en la app (`licenseManager.isPro()`).
* **Fase 14**: Generación del primer `README.md` nativo para GitHub con estética Apple SF Symbols y cero emojis.
* **Fase 15**: Desacoplamiento de la documentación en arquitectura trilingüe con selector superior interactivo (`README.md` en inglés predeterminado, `README.es.md` en español, `README.fr.md` en francés).
* **Fase 16**: Creación del logo master 512x512 (`public/logo.svg`) a partir de especificaciones de Gemini ChatBox y actualización unificada del favicon, manifest PWA y marcas de navegación.
* **Fase 17**: Posicionamiento del logo master en el Hero Section encima del titular principal.
* **Fase 18**: Calibración editorial de proporciones: ampliación del logo a escala heroica (`120px-152px`) con halo difuso de 220px y moderación del titular principal (`clamp(2.2em, 4.2vw, 3.6em)`).

---

## 9. Comandos de Desarrollo, Compilación y Despliegue

### Requisitos Previos
* **Node.js**: Versión 18.0.0 o superior.
* **NPM**: Versión 9.0.0 o superior.

### Comandos de Terminal
```bash
# 1. Instalar dependencias del proyecto
npm install

# 2. Iniciar servidor local de desarrollo con HMR
npm run dev

# 3. Compilar paquete para producción (genera carpeta dist/)
npm run build

# 4. Previsualizar compilación de producción localmente
npm run preview

# 5. Sincronizar cambios web con los contenedores nativos de Capacitor
npm run cap:sync

# 6. Abrir proyecto nativo en Android Studio
npm run cap:android

# 7. Abrir proyecto nativo en Xcode (requiere macOS)
npm run cap:ios

# 8. Ejecutar suite de pruebas de licencia y motor de patrocinios
node scratch/test_license.js
```

### Modos de Despliegue

#### Modo Kiosco PWA en iPad / iPadOS (Recomendado)
1. Abrir Safari y navegar a la URL del marco.
2. Pulsar botón **Compartir** ➔ **"Añadir a la pantalla de inicio"**.
3. Abrir la app desde el icono. En *Ajustes de iPadOS ➔ Accesibilidad ➔ Acceso Guiado*, activar la función.
4. Presionar tres veces el botón de encendido para bloquear la tablet en modo kiosco perpetuo.

#### Modo Kiosco en Raspberry Pi (Pantallas HDMI 24/7)
```bash
chromium-browser --noerrdialogs --disable-infobars --kiosk http://localhost:5173/app/ &
```

#### Despliegue en Cloudflare Pages
* Conectar el repositorio de GitHub `leptium/leptiumFrame`.
* Comando de compilación: `npm run build`
* Directorio de salida: `dist`
* Certificado SSL/HTTPS, CDN global y compresión gzip/brotli incluidos de forma gratuita.

---

## 10. Guía de Continuidad para Gemini ChatBox (Instrucciones para el Asistente)

Si estás leyendo este documento como **Gemini ChatBox**, utiliza el siguiente contexto para formular peticiones precisas a **Antigravity** sin gastar tokens de contexto en explicaciones redundantes:

### Puntos Clave que Debes Recordar
1. **Regla Cero Emojis**: Nunca sugieras emojis en el código ni en la interfaz de usuario. Cualquier icono debe ser un vector `<svg>` estilo Apple SF Symbols con clases como `.sf-icon`, `.check-icon` o enlaces a assets vectoriales.
2. **Arquitectura Vanilla JS Pura**: No propongas añadir frameworks pesados (React, Vue, Tailwind, Bootstrap). Todo el diseño se mantiene con CSS puro y módulos nativos JS.
3. **Persistencia Local**: Toda nueva función debe guardar su estado en `localStorage` o a través del `Store` / `HAL` para mantener la filosofía Zero-Knowledge.
4. **Soporte Trilingüe**: Cuando se añada texto nuevo en la interfaz, deben incluirse las claves correspondientes en `src/core/i18n/locales/es.js`, `en.js` y `fr.js`.
5. **Formato de Prompts Recomendado para el Usuario**:
   - Pídele a Antigravity tareas específicas indicando el archivo exacto a modificar.
   - Ejemplo: *"Modifica `src/core/weather/weatherService.js` para añadir soporte a grados Fahrenheit según el idioma activo en `i18n`"*.

---
*Fin del Reporte Maestro — leptiumFrame 2.0*
