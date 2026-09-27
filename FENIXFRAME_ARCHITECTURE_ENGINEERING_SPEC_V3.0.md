# FENIXFRAME
## Architecture & Engineering Specification
### Version 3.0

> **Product:** leptium FenixFrame — Digital Canvas OS  
> **Document type:** Master Architecture & Engineering Specification  
> **Version:** 3.0  
> **Baseline:** Phase 1 validated web implementation + multiplatform target architecture  
> **Primary delivery model:** Web-first / local-first / privacy-preserving  
> **Target distribution:** Web/PWA, Android, iOS/iPadOS  
> **Deployment target:** Cloudflare Pages + Capacitor packaging  
> **Operational profile:** Long-running digital frame / interactive display, including 24/7 use cases  
> **Language:** Spanish with canonical engineering identifiers in English

---

## Status legend

This specification deliberately separates what exists today from what is planned.

| Marker | Meaning |
|---|---|
| **AS-IS** | Behavior or structure documented as part of the current Phase 1 implementation. |
| **TO-BE** | Approved target architecture or engineering requirement for the refactor. |
| **ROADMAP** | Planned capability that is intentionally not part of the current baseline. |
| **DECISION** | Architectural decision that should remain stable unless replaced by an ADR. |
| **OPEN** | Point that requires validation against source code, platform tests, or product policy. |

> [!IMPORTANT]
> This document does not treat a design intention as implemented functionality. Any item not evidenced by the Phase 1 baseline is explicitly marked **TO-BE**, **ROADMAP**, or **OPEN**.

---

# 00. Document Control

## 00.1 Purpose

This document is the authoritative technical reference for **leptium FenixFrame**. It consolidates the current Phase 1 system and the target architecture required to evolve the product into a production-grade, multiplatform application without changing its established visual identity or core user experience.

It is intended to serve as:

- architecture baseline;
- refactor contract;
- development reference;
- onboarding document;
- testing reference;
- release-readiness checklist;
- record of architectural decisions;
- roadmap boundary between Phase 1 and subsequent phases.

## 00.2 Scope

Included:

- current web architecture;
- data persistence model;
- slideshow and canvas behavior;
- EXIF, weather, localization, storage, and UI state;
- Hardware Abstraction Layer (HAL);
- PWA architecture;
- Capacitor architecture;
- Android and iOS/iPadOS packaging targets;
- Cloudflare architecture;
- 24/7 stability requirements;
- memory lifecycle and burn-in mitigation;
- remote-control preparation;
- security, privacy, accessibility, observability, and testing;
- migration and release criteria.

Excluded from the Phase 1 baseline:

- cloud photo synchronization;
- remote control implementation;
- account system;
- authentication backend;
- remote command relay;
- real-time multi-device sync;
- server-side media storage.

Those capabilities may appear as **TO-BE** or **ROADMAP** items only.

## 00.3 Source baseline

The Phase 1 baseline documents the following root-level application structure:

```text
leptium-fenixframe/
├── _headers
├── index.html
├── app.html
├── app.css
├── app.js
├── i18n.js
├── db.js
├── weather.js
├── collage.js
└── public/
    └── assets/
        └── demo/
            ├── demo_01.jpg
            ├── ...
            └── demo_10.jpg
```

## 00.4 Versioning policy

Recommended format:

```text
MAJOR.MINOR.PATCH
```

- **MAJOR:** architectural contract changes or incompatible restructuring;
- **MINOR:** new documented subsystem or compatible architectural expansion;
- **PATCH:** corrections, clarifications, diagrams, acceptance criteria, or editorial updates.

Version 3.0 introduces the explicit distinction between **AS-IS**, **TO-BE**, and **ROADMAP**, plus the multiplatform HAL architecture.

## 00.5 Document authority

If source code and this document conflict:

1. current production behavior must first be verified;
2. the mismatch must be recorded;
3. no undocumented behavior should be silently declared intentional;
4. the source or specification must then be updated through an explicit engineering decision.

---

# 01. Executive Technical Summary

FenixFrame is a **local-first digital canvas runtime** designed to turn browsers, tablets, and mobile devices into persistent smart photo frames and interactive displays.

The current Phase 1 implementation is a web application based on:

- semantic HTML5;
- modern CSS3;
- Vanilla JavaScript ES2022+;
- IndexedDB;
- localStorage;
- Canvas 2D;
- browser geolocation;
- Open-Meteo geocoding/weather services;
- Cloudflare Pages;
- local image blobs and `ObjectURL` rendering.

The target architecture preserves the web-first approach while introducing a **Hardware Abstraction Layer (HAL)** so that core logic no longer depends directly on browser or Capacitor APIs.

The target execution model is:

```text
UI
 │
 ▼
Application Commands
 │
 ▼
Core Domain
 │
 ▼
HAL Interfaces
 │
 ├──────────────► Web Adapters
 │                IndexedDB
 │                Browser APIs
 │                PWA APIs
 │
 └──────────────► Native Adapters
                  Capacitor Preferences
                  Filesystem
                  Camera / Picker
                  Keep Awake
                  Geolocation
```

The principal engineering goals of Version 3.0 are:

1. preserve the validated Phase 1 experience;
2. prevent platform-specific APIs from leaking into the core domain;
3. make long-running operation a first-class requirement;
4. eliminate duplicate persistent state;
5. make media lifecycle deterministic;
6. create a stable command boundary for future remote control;
7. support PWA, Android, and iOS/iPadOS from one codebase;
8. improve testability, security, observability, and maintainability.

---

# 02. Product Vision

## 02.1 Product statement

FenixFrame is a **Digital Canvas OS** for smart photo frames and persistent interactive displays.

The product should allow a device to operate primarily as a visual canvas rather than as a conventional application window.

## 02.2 Core experience

The experience centers on:

- automatic photo slideshow;
- clean-canvas pause mode;
- photo metadata/EXIF inspection;
- favorites and hidden-photo state;
- local media import;
- 2×2 collage creation;
- clock, date, contextual greeting, and weather;
- multilingual UI;
- full-screen display behavior;
- storage management;
- safe recovery from an empty visible-media state.

## 02.3 Distribution vision

**TO-BE** distribution targets:

| Platform | Packaging | Primary role |
|---|---|---|
| Web | Cloudflare Pages | canonical web runtime |
| PWA | installable web app | browser-based appliance experience |
| Android | Capacitor / AAB | Play Store + dedicated frame devices |
| iOS | Capacitor | iPhone distribution |
| iPadOS | Capacitor | premium tablet-frame target |

## 02.4 Product principles

**DECISION:**

- local-first media ownership;
- privacy-preserving defaults;
- visual continuity across platforms;
- no mandatory cloud account for the core frame experience;
- graceful degradation;
- long-running stability over novelty;
- reversible user actions where practical;
- no black-screen dead ends.

---

# 03. Architectural Principles

## 03.1 Local-first

User photos remain on the user device in the baseline architecture. External services may receive weather/location queries, but photo blobs must not be uploaded as part of ordinary slideshow operation.

## 03.2 Web-first, not web-only

The web implementation is the canonical functional model. Native packaging must extend platform access without forking business logic.

## 03.3 HAL boundary

**DECISION:** UI and core domain code must not directly invoke platform-specific hardware/storage APIs.

Examples that must be abstracted:

- `localStorage`;
- `indexedDB`;
- `navigator.wakeLock`;
- `navigator.geolocation`;
- file picker inputs;
- Capacitor Preferences;
- Capacitor Filesystem;
- native media picker/camera APIs.

## 03.4 Single source of truth

A domain fact should have one canonical persistent representation.

In particular, photo flags such as `is_hidden` and `is_favorite` should not simultaneously be authoritative in IndexedDB and localStorage.

## 03.5 Core without platform knowledge

The core should not need to know whether it is running under:

- Safari;
- Chrome;
- Android WebView;
- iOS WKWebView;
- standalone PWA;
- Capacitor.

If core behavior branches on those concepts, the HAL boundary is incomplete.

## 03.6 Progressive enhancement

Unavailable APIs must degrade safely.

Examples:

- unsupported Wake Lock → continue slideshow without forced keep-awake;
- denied geolocation → manual city entry remains available;
- unsupported Web Share → use downloadable export/fallback;
- unavailable fullscreen → do not block slideshow;
- offline weather → preserve last-known UI or show non-blocking unavailable state.

## 03.7 24/7 stability

Long-running operation is a product requirement, not a secondary optimization.

The system must therefore treat the following as architectural concerns:

- memory leaks;
- image decode pressure;
- orphaned `ObjectURL`s;
- timer accumulation;
- duplicate event listeners;
- Wake Lock loss;
- screen burn-in risk;
- background/foreground transitions;
- storage exhaustion;
- stale network requests.

---

# 04. Current Architecture — Phase 1

> **Status: AS-IS**

## 04.1 Current file responsibilities

| File | Current responsibility |
|---|---|
| `_headers` | Cloudflare response headers, CSP, Permissions Policy, frame policy |
| `index.html` | commercial landing page and embedded app preview |
| `app.html` | main Digital Canvas runtime document |
| `app.css` | visual system, responsive layout, glassmorphism, grid/flex styles |
| `app.js` | slideshow controller, application state, event listeners, integration |
| `i18n.js` | language engine and ES/EN/FR dictionaries |
| `db.js` | `FenixFrameDB` IndexedDB access |
| `weather.js` | weather, geocoding, GPS/manual location behavior |
| `collage.js` | Canvas 2D collage generation/export |
| `public/assets/demo/` | 10 optimized seed JPEGs |

## 04.2 Current persistence model

### IndexedDB

`FenixFrameDB`, object store `photos`:

```text
id            String / UUID
blob          Blob
name          String
date          String / Timestamp
is_demo       Boolean
is_hidden     Boolean
is_favorite   Boolean
```

### localStorage

Documented keys:

```text
leptium_language
leptium_weather_units
leptium_manual_location
leptium_hidden_ids
leptium_favoritas
```

## 04.3 Current UI states

### Active Slideshow

Visible environmental widgets:

- clock;
- date;
- contextual greeting;
- weather.

Full toolbar:

- fullscreen;
- pause/play;
- favorite;
- information;
- collage;
- add photos;
- download;
- hide photo;
- settings.

### Clean Canvas / Pause

Fade-out hides the environmental overlays while preserving essential controls:

- play;
- photo information;
- Collage Studio;
- add media.

### Zero-State Shield

When all available photos are hidden, the slideshow stops and presents a recovery card with a **Restore visibility** action instead of leaving a blank or frozen screen.

## 04.4 Current media import

The Phase 1 importer:

- opens a multi-image file picker;
- persists selected blobs immediately;
- refreshes `state.activePhotos`;
- adds the new media to the current slideshow without requiring a page reload.

## 04.5 Current collage behavior

The documented Collage Studio supports:

- automatic mode: current image + three recent images;
- manual mode: four-image selection grid;
- visual selection count from `0/4` to `4/4`;
- Canvas 2D rendering;
- high-resolution JPG export.

## 04.6 Current weather behavior

Weather configuration supports:

- GPS via `navigator.geolocation`;
- manual search via Open-Meteo Geocoding;
- locale-aware city resolution using `navigator.language`;
- Celsius/Fahrenheit preference;
- temperature-unit toggling from the widget.

## 04.7 Current reset behavior

`#btnResetToDemo` is documented to:

1. clear FenixFrameDB;
2. clear favorite/hidden keys;
3. re-seed the 10 demo photos.

## 04.8 Current security headers

Documented baseline:

```http
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: screen-wake-lock=(self), share=(self)
```

The current CSP includes `'unsafe-inline'` for scripts and styles. This is treated as technical debt rather than as the target security posture.

---

# 05. Target Architecture

> **Status: TO-BE**

## 05.1 Architectural shape

```text
┌─────────────────────────────────────────────────────────────┐
│                         UI Layer                            │
│ views · modals · components · tokens · styles             │
└────────────────────────────┬────────────────────────────────┘
                             │ intents
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                        │
│ commands · orchestration · use cases                       │
└────────────────────────────┬────────────────────────────────┘
                             │ domain calls
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      Core Domain                            │
│ slideshow · media · collage · EXIF · state · burn-in       │
└────────────────────────────┬────────────────────────────────┘
                             │ ports/interfaces
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                           HAL                               │
│ preferences · media repository · picker · location         │
│ wake lock · lifecycle · sharing · export                   │
└──────────────────────┬──────────────────────┬───────────────┘
                       │                      │
             ┌─────────▼─────────┐  ┌────────▼──────────┐
             │   Web adapters    │  │ Native adapters   │
             │ IndexedDB / APIs  │  │ Capacitor plugins │
             └─────────┬─────────┘  └────────┬──────────┘
                       │                      │
                       └──────────┬───────────┘
                                  ▼
                        Platform / Device
```

## 05.2 Design constraints

- no UI-to-platform direct calls;
- no platform branching inside pure core modules;
- all platform capabilities exposed through contracts;
- state transitions centralized;
- persistent photo metadata canonicalized;
- transport-independent commands for future remote control;
- build output static and Cloudflare-compatible;
- native packaging must consume the same `dist` web bundle.

---

# 06. System Context

## 06.1 Context diagram

```text
                  ┌────────────────────┐
                  │       User         │
                  └─────────┬──────────┘
                            │ touch / pointer
                            ▼
                 ┌──────────────────────┐
                 │     FenixFrame       │
                 │   Digital Canvas OS  │
                 └───────┬───────┬──────┘
                         │       │
                    local │       │ metadata/network
                         │       │
          ┌──────────────▼─┐   ┌─▼─────────────────┐
          │ Device Storage │   │ External Services │
          │ photos/prefs   │   │ Open-Meteo       │
          └────────────────┘   │ Lemon Squeezy*    │
                               └───────────────────┘

* Commercial/landing integration; not photo persistence.
```

## 06.2 Trust boundaries

1. **User media boundary** — photo blobs and metadata.
2. **Platform boundary** — browser/native capability access.
3. **Network boundary** — weather/geocoding/commercial endpoints.
4. **Embedded-content boundary** — preview/iframe use cases.
5. **Future remote-control boundary** — LAN peer/session boundary.

## 06.3 External-service rule

A network-dependent subsystem must not make the slideshow unavailable unless that subsystem is essential to media playback.

Weather is therefore non-blocking.

---

# 07. Repository Architecture

> **Status: TO-BE**

## 07.1 Target monorepo

```text
leptium-fenixframe/
├── package.json
├── vite.config.js
├── capacitor.config.ts
├── _headers
├── index.html
├── public/
│   ├── manifest.webmanifest
│   ├── sw.js
│   ├── icons/
│   └── assets/
│       └── demo/
├── src/
│   ├── app/
│   │   ├── bootstrap.js
│   │   ├── commands.js
│   │   └── runtime.js
│   ├── core/
│   │   ├── state/
│   │   ├── media/
│   │   ├── slideshow/
│   │   ├── collage/
│   │   ├── exif/
│   │   ├── weather/
│   │   └── burnin/
│   ├── hal/
│   │   ├── interfaces/
│   │   ├── web/
│   │   ├── native/
│   │   └── index.js
│   ├── services/
│   │   ├── weather/
│   │   └── localization/
│   └── ui/
│       ├── components/
│       ├── views/
│       ├── modals/
│       ├── tokens/
│       └── styles/
├── functions/
│   └── api/
│       └── weather.js
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── longevity/
├── docs/
│   ├── architecture/
│   ├── adr/
│   └── ai-prompts/
├── android/                 # generated by Capacitor
└── ios/                     # generated by Capacitor
```

## 07.2 Repository rules

- `src/core/` must remain DOM-agnostic wherever practical.
- `src/ui/` may manipulate the DOM but not directly call platform hardware/storage APIs.
- `src/hal/` owns platform access.
- `functions/` owns server-side Cloudflare logic.
- `public/` contains static public assets only.
- generated native projects must not become alternate business-logic implementations.

## 07.3 AI prompt archival

Prompts used to direct automated refactors should not live inside the architecture specification body.

Recommended path:

```text
docs/ai-prompts/
```

This preserves provenance without confusing instructions to an AI with product architecture.

---

# 08. Core Domain

## 08.1 Definition

The Core Domain contains deterministic product behavior that should be reusable across browser and native packaging.

## 08.2 Proposed modules

```text
src/core/
├── media/
├── slideshow/
├── collage/
├── exif/
├── weather/
├── state/
└── burnin/
```

## 08.3 Core invariants

- hidden media must not be selected by the active slideshow;
- favorite status must be stable across reloads;
- photo ordering must be deterministic for a given state;
- zero visible photos must transition to the zero-state shield;
- selecting photos must not implicitly upload them;
- business logic must not depend on DOM IDs;
- image-resource cleanup must be explicit;
- a network failure must not corrupt local media state.

## 08.4 Command boundary

**DECISION:** user and future remote actions should be represented as application commands.

Candidate API:

```js
commands.play()
commands.pause()
commands.next()
commands.previous()
commands.addPhotos(input)
commands.favorite(photoId, value)
commands.hide(photoId, value)
commands.restoreAllVisibility()
commands.setWeatherLocation(location)
commands.setTemperatureUnit(unit)
commands.openPhotoInfo(photoId)
commands.createCollage(selection)
```

This boundary prepares the system for remote control without coupling remote transport to the DOM.

---

# 09. Hardware Abstraction Layer

> **Status: TO-BE / DECISION**

## 09.1 Purpose

The HAL provides contracts between the core/application layers and the execution platform.

## 09.2 Required contracts

The original target architecture identifies:

```text
IWakeLock
IStorage
IMediaPicker
```

Version 3.0 refines this model to avoid an oversized generic storage interface.

Recommended contracts:

```text
IPreferences
IMediaRepository
IMediaPicker
IWakeLock
ILocationProvider
IAppLifecycle
IFileExport
IShare
IFullscreen
```

## 09.3 `IPreferences`

```ts
interface IPreferences {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  listKeys(): Promise<string[]>;
}
```

Use for small settings only.

Examples:

- language;
- temperature unit;
- manual weather location;
- slideshow interval;
- onboarding flags.

## 09.4 `IMediaRepository`

```ts
interface IMediaRepository {
  add(input: MediaCreateInput): Promise<PhotoRecord>;
  get(id: string): Promise<PhotoRecord | null>;
  list(query?: MediaQuery): Promise<PhotoRecord[]>;
  update(id: string, patch: Partial<PhotoMetadata>): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
  getBlob(id: string): Promise<Blob>;
}
```

**DECISION:** photo metadata should be canonical here, not duplicated in preferences.

## 09.5 `IMediaPicker`

```ts
interface IMediaPicker {
  pickPhotos(options?: MediaPickOptions): Promise<PickedMedia[]>;
  getFileStream(id: string): Promise<ReadableStream | Blob>;
  getMetadata(id: string): Promise<MediaMetadata>;
}
```

## 09.6 `IWakeLock`

```ts
interface IWakeLock {
  isSupported(): Promise<boolean>;
  enable(): Promise<void>;
  disable(): Promise<void>;
  isActive(): boolean;
}
```

## 09.7 `ILocationProvider`

```ts
interface ILocationProvider {
  isSupported(): Promise<boolean>;
  requestPermission(): Promise<'granted' | 'denied' | 'prompt' | 'unknown'>;
  getCurrentLocation(): Promise<GeoPoint>;
}
```

## 09.8 Runtime resolution

Target resolver:

```js
const native = Capacitor.isNativePlatform();

export const hal = native
  ? createNativeHAL()
  : createWebHAL();
```

Core code must consume `hal` contracts, not perform runtime platform detection itself.

---

# 10. Web Platform Adapter

> **Status: TO-BE**

## 10.1 Responsibilities

Web adapters translate HAL interfaces to browser/PWA technologies.

Potential implementations:

| HAL contract | Web implementation |
|---|---|
| `IPreferences` | localStorage or IndexedDB key/value store |
| `IMediaRepository` | IndexedDB `FenixFrameDB` |
| `IMediaPicker` | file input and/or File System Access API with fallback |
| `IWakeLock` | Screen Wake Lock API |
| `ILocationProvider` | `navigator.geolocation` |
| `IAppLifecycle` | `visibilitychange`, `pagehide`, `pageshow` |
| `IFileExport` | Blob + object URL + download |
| `IShare` | Web Share API with fallback |
| `IFullscreen` | Fullscreen API |

## 10.2 Compatibility principle

File System Access API must not be the only file-picking path because browser support differs. The portable fallback remains standard file input behavior.

## 10.3 Browser adapter errors

Platform exceptions should be normalized into domain-safe error categories such as:

```text
UNSUPPORTED
PERMISSION_DENIED
USER_CANCELLED
QUOTA_EXCEEDED
DECODE_FAILED
NETWORK_UNAVAILABLE
UNKNOWN_PLATFORM_ERROR
```

---

# 11. Native Platform Adapter

> **Status: TO-BE**

## 11.1 Capacitor role

Capacitor is the native shell, not a second application architecture.

## 11.2 Target integrations

The supplied design proposes:

- `@capacitor/preferences`;
- `@capacitor/filesystem`;
- native camera/media selection;
- `@capacitor-community/keep-awake` or equivalent maintained solution.

Additional native contracts may use Capacitor geolocation, sharing, and app-lifecycle APIs where justified.

## 11.3 Native adapter rule

Native plugin objects must not escape `src/hal/native/`.

## 11.4 Plugin governance

Before adding a plugin:

1. verify active maintenance;
2. verify current Capacitor compatibility;
3. verify iOS and Android permissions;
4. document fallback behavior;
5. add tests or manual validation procedure;
6. record the dependency in an ADR if it becomes architectural.

---

# 12. State Architecture

## 12.1 State categories

State should be separated into:

### Persistent domain state

- photo records;
- `is_hidden`;
- `is_favorite`;
- relevant media metadata.

### Persistent preferences

- language;
- temperature unit;
- manual location;
- future slideshow settings.

### Ephemeral runtime state

- current photo ID/index;
- playing/paused;
- open modal;
- current collage selection;
- active `ObjectURL`;
- Wake Lock handle/state;
- current weather request state;
- temporary UI messages.

## 12.2 Duplicate-state correction

**TO-BE:** remove `leptium_hidden_ids` and `leptium_favoritas` as canonical state once migration to media records is complete.

A temporary migration path may read them once and merge their values into IndexedDB.

## 12.3 Suggested runtime state

```js
{
  playback: {
    status: 'playing' | 'paused' | 'empty',
    currentPhotoId: null,
    intervalMs: 15000
  },
  media: {
    activePhotoIds: [],
    loading: false
  },
  ui: {
    mode: 'slideshow' | 'clean-canvas' | 'zero-state',
    modal: null
  },
  weather: {
    status: 'idle' | 'loading' | 'ready' | 'error',
    data: null
  }
}
```

## 12.4 Transition rule

State transitions should be performed through commands/reducers/use-cases, not arbitrary mutations from event handlers.

---

# 13. Media Persistence Model

## 13.1 Canonical entity

Recommended `PhotoRecord`:

```ts
interface PhotoRecord {
  id: string;
  blob: Blob;
  name: string;
  importedAt: string;
  capturedAt?: string | null;
  isDemo: boolean;
  isHidden: boolean;
  isFavorite: boolean;
  mimeType?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  exif?: NormalizedExif | null;
  schemaVersion: number;
}
```

## 13.2 Migration

Current snake_case fields may be preserved or migrated. The exact field naming is less important than having one documented schema and versioned migrations.

## 13.3 Storage invariants

- IDs must be unique;
- imported records must be fully persisted before being exposed as durable state;
- failed imports must not create partial records;
- corrupt media should be removable without resetting the whole database;
- demo records must be distinguishable from user media;
- schema migrations must be idempotent.

## 13.4 Quota behavior

If storage quota is exceeded:

1. stop the affected import;
2. preserve already committed photos;
3. show a recoverable message;
4. do not clear the database automatically;
5. offer storage-management actions.

---

# 14. Slideshow Engine

## 14.1 Responsibilities

The slideshow engine owns:

- ordered active photo selection;
- timing;
- play/pause;
- next/previous;
- handling photo removal/hiding;
- zero-state transition;
- lifecycle-safe timer management.

## 14.2 Non-responsibilities

It should not own:

- DOM rendering;
- browser storage APIs;
- native plugin calls;
- weather;
- EXIF parsing implementation;
- remote transport.

## 14.3 Timer invariant

At most one active slideshow timer may exist per runtime.

## 14.4 Hide-current behavior

If the current photo becomes hidden:

1. update canonical media state;
2. recompute visible photos;
3. select the next valid item;
4. enter zero-state if none remain;
5. release the old rendered resource.

## 14.5 Pause / Clean Canvas

Pause is not equivalent to application shutdown.

Paused state should:

- suspend automatic advance;
- maintain current media;
- preserve allowed essential controls;
- hide environmental overlays according to the established UX.

---

# 15. Canvas & Collage Engine

## 15.1 Phase 1 behavior

Current documented modes:

- automatic 2×2 collage;
- manual four-image collage;
- high-resolution JPG export.

## 15.2 Core responsibilities

`src/core/collage/` should own:

- layout calculation;
- image fitting/cropping policy;
- output dimensions;
- render order;
- image selection validation;
- canvas export orchestration.

## 15.3 UI responsibilities

`src/ui/` owns:

- modal display;
- thumbnail selection;
- selection numbering;
- progress count;
- error presentation.

## 15.4 Memory requirements

After export:

- temporary decoded images should become collectible;
- temporary object URLs must be revoked;
- canvas dimensions may be reset if needed to release backing memory;
- repeated collage generation must not accumulate listeners or retained bitmaps.

## 15.5 Future-proofing

The engine should allow future templates without encoding `2×2` assumptions into the whole application state.

---

# 16. EXIF Pipeline

## 16.1 Status

The wider project description references an EXIF viewer. Detailed parser behavior is not fully specified in the supplied Phase 1 architecture; therefore exact implementation details remain **OPEN** until source-code audit.

## 16.2 Target responsibility

`src/core/exif/` should normalize metadata into a stable internal representation.

Suggested normalized fields:

```text
capturedAt
cameraMake
cameraModel
lensModel
orientation
width
height
exposureTime
fNumber
iso
focalLength
latitude
longitude
```

## 16.3 Privacy rule

GPS EXIF data must never be sent to an external service merely to display metadata.

## 16.4 Streaming / memory rule

Where practical, metadata extraction should avoid decoding full-resolution image pixels when only header metadata is needed.

---

# 17. Weather & Location

## 17.1 Current behavior

Phase 1 uses:

- `navigator.geolocation` for GPS;
- Open-Meteo Geocoding for manual city search;
- Open-Meteo weather endpoint;
- Celsius/Fahrenheit preference;
- locale-aware city lookup.

## 17.2 Target separation

```text
UI weather widget
      │
      ▼
Weather use case
      │
      ├── ILocationProvider
      │
      └── WeatherService
               │
               ▼
         Open-Meteo / proxy
```

## 17.3 Location privacy

- geolocation must be user initiated or permission-compliant;
- refusal must not degrade local photo functionality;
- coordinates should be stored only when needed for the selected feature;
- exact location must not be logged unnecessarily.

## 17.4 Weather proxy

**TO-BE:** Cloudflare Pages Function may proxy weather requests if needed for policy, caching, telemetry isolation, or future provider abstraction.

The proxy must not become a requirement for offline slideshow functionality.

---

# 18. Wake Lock Lifecycle

## 18.1 Requirement

FenixFrame targets persistent display operation. Keeping the screen awake is therefore a first-class capability when supported and permitted.

## 18.2 Lifecycle

```text
App active
  │
  ├─ request wake lock
  │
  ▼
Lock active
  │
  ├─ visibility hidden / platform releases lock
  │
  ▼
Lock inactive
  │
  └─ visibility visible → reacquire if user mode still requires it
```

## 18.3 Requirements

- listen to lifecycle changes;
- reacquire after foreground restoration where permitted;
- avoid repeated concurrent lock requests;
- normalize unsupported/denied states;
- do not block application start if Wake Lock is unavailable.

## 18.4 Native parity

Native keep-awake behavior should implement the same semantic contract through the native adapter.

---

# 19. Burn-In Protection

> **Status: TO-BE**

## 19.1 Objective

Reduce persistence of static UI pixels during prolonged display operation.

## 19.2 Pixel shifting

Target behavior from the supplied design:

- shift static text/widget layers by approximately 1–2 pixels;
- perform periodically, initially every 15 minutes;
- keep movement visually imperceptible;
- never shift primary photo framing in a way that visibly degrades composition.

## 19.3 Candidate implementation

```text
src/core/burnin/
├── burnin-engine.js
├── shift-pattern.js
└── burnin-policy.js
```

## 19.4 Constraints

- deterministic bounded offsets;
- no cumulative drift;
- no layout reflow storm;
- respect `prefers-reduced-motion` where the visual treatment could be perceived as motion;
- timer cleanup on runtime shutdown.

## 19.5 Validation

Run visual regression and extended-duration tests on OLED-class devices before declaring the feature production-complete.

---

# 20. Memory Management

## 20.1 Object URL lifecycle

**DECISION:** every `URL.createObjectURL()` must have an explicit ownership and release path.

Typical lifecycle:

```text
Blob
 │
 ├─ createObjectURL()
 ▼
Render/decode
 │
 ├─ replace / unload / export complete
 ▼
revokeObjectURL()
```

## 20.2 Prohibited patterns

- creating a new object URL each render without revocation;
- retaining decoded images indefinitely;
- accumulating canvas instances;
- attaching event listeners on every slide without removing them;
- starting duplicate intervals;
- keeping stale thumbnails alive after modal teardown.

## 20.3 Long-duration test

A longevity test should:

1. cycle through a realistic photo set;
2. generate collages repeatedly;
3. open/close metadata and settings views;
4. trigger background/foreground transitions;
5. run for an extended period;
6. inspect heap trend and responsiveness.

## 20.4 Memory budget

Exact device budgets are **OPEN** and should be derived from target hardware tests. The design should prefer bounded caches and release over unlimited preloading.

---

# 21. Internationalization

## 21.1 Current locales

Phase 1 documents:

```text
es
 en
fr
```

Canonical current keys include zero-state, weather, and reset strings.

## 21.2 Requirements

- no user-visible string should be embedded in business logic;
- missing keys must fall back predictably;
- locale choice should persist;
- language switching should not require clearing user media;
- date/time formatting should use locale-aware APIs;
- layout should tolerate longer French/English labels.

## 21.3 Dictionary shape

Recommended:

```js
{
  es: { ... },
  en: { ... },
  fr: { ... }
}
```

with stable semantic keys such as:

```text
zero_state.title
zero_state.description
zero_state.restore
weather.configure.title
weather.location.use_gps
weather.location.manual_placeholder
storage.reset_demo
```

## 21.4 Future locale support

New languages should be additive and must not require changes in core slideshow logic.

---

# 22. UI State Machine

## 22.1 Principal states

```text
                ┌─────────────┐
                │  Slideshow  │
                └──────┬──────┘
                       │ pause
                       ▼
                ┌─────────────┐
                │ CleanCanvas │
                └──────┬──────┘
                       │ play
                       └──────────────► Slideshow

Any visible-media recompute resulting in 0 items
                       │
                       ▼
                ┌─────────────┐
                │ Zero State  │
                └──────┬──────┘
                       │ restore/import
                       ▼
                Slideshow / CleanCanvas
```

## 22.2 Modal state

Modals are orthogonal UI overlays and should not redefine the underlying playback domain state unless the feature explicitly requires it.

Candidate modal IDs:

```text
photo-info
collage
weather-settings
storage-settings
app-settings
```

## 22.3 Accessibility requirement

Modal activation must manage focus and restore focus to the invoking control on close.

---

# 23. Security Architecture

## 23.1 Threat focus

Primary risks include:

- XSS introduced through inline or dynamic HTML;
- unsafe third-party scripts;
- overly broad CSP;
- malicious/corrupt image inputs;
- excessive permissions;
- untrusted future remote-control peers;
- accidental exposure of photo metadata;
- secrets embedded in frontend code.

## 23.2 CSP hardening

Current `'unsafe-inline'` usage is technical debt.

Target CSP should progressively favor:

```text
script-src 'self' [explicit trusted origins/hashes/nonces]
style-src  'self' [explicit hashes/nonces when necessary]
object-src 'none'
base-uri   'self'
frame-ancestors 'self'
```

Exact production directives must be regression-tested against landing preview and payment integration.

## 23.3 Media validation

On import:

- inspect MIME type;
- validate decodability;
- enforce configurable file-size bounds;
- fail per-file when possible;
- never trust extension alone.

## 23.4 Secrets

No server secret, private payment credential, API secret, or signing secret may be shipped in the client bundle.

## 23.5 Remote control

Future remote control must require a pairing/session trust model before accepting commands or media.

---

# 24. Privacy Model

## 24.1 Terminology

The preferred product term is:

> **Local-first, privacy-preserving**

The expression **zero-knowledge** should not be used as a cryptographic claim unless the system later implements and documents a genuine zero-knowledge protocol.

## 24.2 Media policy

Phase 1 user media is intended to remain local to the device/runtime.

## 24.3 External data

Weather/location requests are separate from media storage. They should contain only the data necessary to resolve the requested forecast/location.

## 24.4 EXIF

Metadata can contain sensitive location information. FenixFrame should:

- display only intentionally supported fields;
- avoid network transmission of EXIF coordinates by default;
- avoid logging full EXIF payloads in production.

## 24.5 Telemetry

If analytics are introduced later, they must not include photo contents, filenames, EXIF payloads, or precise coordinates unless a distinct user-facing requirement explicitly justifies and protects such processing.

---

# 25. PWA Architecture

> **Status: TO-BE**

## 25.1 Required artifacts

```text
public/
├── manifest.webmanifest
├── sw.js
└── icons/
```

## 25.2 Manifest goals

- installable identity;
- standalone display where supported;
- suitable icons;
- stable start URL;
- orientation policy based on validated UX;
- theme/background metadata.

## 25.3 Service worker scope

Recommended responsibilities:

- cache application shell;
- cache static demo assets;
- support offline startup after initial load;
- version caches;
- safely retire obsolete caches.

## 25.4 Service worker non-responsibilities

The service worker should not become the canonical photo database.

User photo blobs belong in the media repository/IndexedDB model.

## 25.5 Offline behavior

Offline should preserve:

- slideshow;
- local photo import where platform permits;
- favorites/hidden state;
- collage;
- settings;
- demo assets already cached.

Weather may become stale or unavailable without affecting media playback.

---

# 26. Capacitor Architecture

> **Status: TO-BE**

## 26.1 Canonical config

Supplied target configuration:

```ts
const config = {
  appId: 'app.leptiumframe.frame',
  appName: 'leptiumFrame',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor'
  }
};
```

Exact syntax must follow the installed Capacitor major version at implementation time.

## 26.2 Build model

```text
Source
  │
  ▼
Vite build
  │
  ▼
dist/
  │
  ├────► Cloudflare Pages
  │
  └────► Capacitor sync
           ├── Android
           └── iOS/iPadOS
```

## 26.3 Vite base

Target:

```js
base: './'
```

This is intended to avoid broken absolute asset paths in native packaging.

## 26.4 Native shell principle

No native platform project should independently reimplement slideshow, collage, localization, or photo-state rules.

---

# 27. Android Distribution

> **Status: ROADMAP / TO-BE**

## 27.1 Target artifact

Google Play distribution target: **Android App Bundle (AAB)**.

## 27.2 Required validation areas

- photo/media permissions appropriate to Android version;
- scoped storage behavior;
- background/foreground transitions;
- keep-awake behavior;
- orientation;
- file export/share behavior;
- offline launch;
- WebView memory stability;
- tablet layouts;
- Play Store data-safety declarations.

## 27.3 Dedicated-frame devices

If Android tablets are used as permanent frames, validate:

- kiosk-like operational behavior;
- power/charging heat;
- long-duration WebView memory;
- OLED/LCD burn-in behavior;
- recovery after OS process eviction.

---

# 28. iOS/iPadOS Distribution

> **Status: ROADMAP / TO-BE**

## 28.1 Primary target

The iPad form factor is especially aligned with the persistent digital-frame use case.

## 28.2 Required validation areas

- WKWebView memory pressure;
- photo-library permission flows;
- filesystem/export behavior;
- application lifecycle;
- keep-awake limitations and policy;
- orientation and safe-area insets;
- App Store privacy disclosures;
- offline startup;
- dynamic type/accessibility impact on settings UI.

## 28.3 App review principle

The native package must provide a coherent app experience rather than merely exposing a broken website shell.

---

# 29. Cloudflare Architecture

## 29.1 Current role

Cloudflare Pages hosts the web application and security headers.

## 29.2 Target structure

```text
Cloudflare Pages
├── static web build
├── _headers
└── functions/
    └── api/
        └── weather.js
```

## 29.3 Function responsibilities

Possible future responsibilities:

- weather proxy;
- provider normalization;
- caching;
- webhook endpoint where needed;
- payment-related server-side validation where required.

## 29.4 Function restrictions

Cloudflare functions must not silently become mandatory cloud storage for personal photos unless the product architecture explicitly changes and privacy requirements are updated.

---

# 30. Remote Control Preparation

> **Status: ROADMAP**

## 30.1 Goal

Allow a phone on the local network to control the frame and eventually add photos without installing a second app.

## 30.2 Architecture principle

Do not couple remote-control logic directly to DOM events.

Remote input must translate into the same application commands used by local UI.

```text
Local UI ──────────────┐
                      │
Remote Transport ─────┼──► Command Bus ─► Application/Core
                      │
Automation/Future ────┘
```

## 30.3 Transport-independent command envelope

Example:

```json
{
  "version": 1,
  "type": "slideshow.next",
  "requestId": "uuid",
  "timestamp": "ISO-8601",
  "payload": {}
}
```

Example favorite command:

```json
{
  "version": 1,
  "type": "photo.favorite",
  "requestId": "uuid",
  "payload": {
    "photoId": "uuid",
    "value": true
  }
}
```

## 30.4 Candidate transports

Transport selection remains **OPEN** until Phase 2 design validation:

- WebSocket;
- WebRTC DataChannel;
- local HTTP endpoint;
- native local-network bridge;
- optional future relay.

## 30.5 Pairing

Phase 2 should define:

- QR pairing;
- short-lived pairing secret/token;
- session expiration;
- device identity;
- authorization scope;
- replay resistance;
- upload limits.

---

# 31. Error Handling

## 31.1 Error taxonomy

Recommended normalized categories:

```text
StorageError
MediaDecodeError
QuotaError
PermissionError
NetworkError
WeatherError
ExportError
UnsupportedFeatureError
StateInvariantError
RemoteProtocolError      # future
```

## 31.2 UX rules

Errors should be:

- recoverable where possible;
- local to the failed operation;
- non-blocking to slideshow unless media playback itself cannot continue;
- expressed in the current UI language;
- safe for production logs.

## 31.3 Examples

| Failure | Expected behavior |
|---|---|
| weather request fails | keep slideshow running, show weather unavailable/stale |
| one imported image corrupt | reject that file, keep valid imports |
| GPS denied | offer manual location |
| storage quota exceeded | stop new writes, retain existing media |
| Wake Lock unsupported | continue without keep-awake |
| all photos hidden | show Zero-State Shield |

---

# 32. Performance Requirements

## 32.1 Functional performance goals

The UI should remain responsive during:

- photo navigation;
- adding media;
- metadata viewing;
- collage selection;
- settings interactions.

## 32.2 Long-running goals

The application should avoid monotonic resource growth during normal slideshow cycles.

## 32.3 Image policy

Future optimization may include:

- thumbnail generation;
- dimension-aware decode;
- bounded prefetch;
- `createImageBitmap` where compatible and beneficial;
- downscaled collage decode paths.

These optimizations must be introduced only after compatibility validation.

## 32.4 Performance instrumentation

Development builds may record:

- slide render latency;
- image decode duration;
- collage render duration;
- database operation duration;
- active object URL count;
- timer count;
- weather request latency.

---

# 33. Compatibility Matrix

## 33.1 Baseline targets

The source architecture explicitly targets legacy WebKit compatibility plus modern mobile/tablet browsers.

Exact minimum browser/OS versions are **OPEN** until formal platform testing.

## 33.2 Feature matrix template

| Capability | Modern Chromium | Safari/iPadOS | Legacy WebKit | Android Capacitor | iOS Capacitor |
|---|---:|---:|---:|---:|---:|
| IndexedDB | Verify | Verify | Verify | Verify | Verify |
| Canvas 2D | Verify | Verify | Verify | Verify | Verify |
| File picker | Verify | Verify | Verify | adapter | adapter |
| Wake Lock | Verify | Verify | fallback | native adapter | native adapter |
| Geolocation | Verify | Verify | Verify | native/web adapter | native/web adapter |
| Web Share | Verify | Verify | fallback | native adapter | native adapter |
| PWA install | platform-dependent | platform-dependent | limited | n/a | n/a |

## 33.3 Release rule

A feature may not be marked universally supported solely because it works in one desktop browser.

---

# 34. Testing Strategy

## 34.1 Test pyramid

```text
          E2E
       Integration
          Unit
```

Long-running device tests form an additional reliability track rather than fitting neatly into the pyramid.

## 34.2 Unit tests

Prioritize:

- slideshow selection logic;
- state transitions;
- media filtering;
- collage layout calculations;
- burn-in offset patterns;
- command validation;
- preference serialization;
- protocol envelope parsing.

## 34.3 Integration tests

Cover:

- IndexedDB repository;
- import → persist → slideshow refresh;
- hide → active list recompute;
- favorite persistence;
- reset-to-demo;
- weather service + location adapter;
- Wake Lock lifecycle adapter.

## 34.4 E2E tests

Critical scenarios:

1. first run;
2. add photos;
3. play/pause;
4. favorite/hide;
5. hide all → zero-state → restore;
6. create collage;
7. change language;
8. configure weather manually;
9. configure GPS where testable;
10. reload and verify persistence;
11. offline reload after PWA install.

## 34.5 Longevity tests

Run on target hardware and observe:

- heap trend;
- crashes;
- slideshow continuity;
- stale timers;
- Wake Lock reacquisition;
- touch responsiveness;
- thermal effects;
- battery/charging behavior.

---

# 35. Observability

## 35.1 Philosophy

Observability must help diagnose reliability without compromising user privacy.

## 35.2 Development logging

Recommended categories:

```text
APP
STATE
MEDIA
DB
SLIDESHOW
COLLAGE
WEATHER
WAKELOCK
BURNIN
PWA
HAL
REMOTE   # future
```

## 35.3 Production restrictions

Do not log:

- raw photo blobs;
- full image data URLs;
- private filesystem paths when avoidable;
- full EXIF payloads;
- precise GPS coordinates unless required for a specific diagnostics mode;
- secrets/tokens.

## 35.4 Health diagnostics

A future local diagnostics panel may expose:

- app version;
- DB schema version;
- photo count;
- visible/hidden/favorite counts;
- storage estimate;
- current platform adapter;
- Wake Lock capability/status;
- service-worker version;
- last weather update.

---

# 36. Accessibility

## 36.1 Requirements

- semantic controls;
- accessible names for icon-only buttons;
- visible focus indication;
- keyboard operability where applicable;
- modal focus trap and restoration;
- appropriate contrast;
- avoid essential meaning conveyed solely by color;
- reduced-motion consideration;
- screen-reader labels for stateful controls.

## 36.2 Touch targets

Controls should remain comfortably usable on tablets and permanent display devices.

## 36.3 Dynamic content

Status updates such as import completion or recoverable errors should use accessible live-region patterns where useful without becoming noisy.

---

# 37. Engineering Conventions

## 37.1 Naming

Recommended:

- PascalCase for types/classes;
- camelCase for functions/variables;
- kebab-case for filenames unless a codebase convention dictates otherwise;
- SCREAMING_SNAKE_CASE for true constants;
- domain terms in English identifiers;
- localized user-facing copy in i18n dictionaries.

## 37.2 Module rule

One module should have one primary reason to change.

## 37.3 Side effects

Side effects should be pushed toward adapters and application orchestration.

## 37.4 DOM access

Prefer view/controller components over random selectors distributed throughout core code.

## 37.5 Error policy

Do not silently swallow errors that can corrupt persistent state.

## 37.6 Comments

Comments should explain architectural intent, invariants, compatibility workarounds, or non-obvious decisions—not restate syntax.

## 37.7 Build discipline

Every structural refactor should finish with:

```text
npm run build
```

and the appropriate automated checks once configured.

---

# 38. Architectural Decision Records

## 38.1 ADR directory

```text
docs/adr/
```

## 38.2 Recommended initial ADRs

### ADR-001 — Web-first architecture

**Decision:** the web implementation is canonical; native apps package the same core and UI through Capacitor.

### ADR-002 — Hardware Abstraction Layer

**Decision:** platform capabilities are accessed only through HAL contracts.

### ADR-003 — IndexedDB as canonical web media repository

**Decision:** user photo blobs and photo flags use IndexedDB as canonical web persistence.

### ADR-004 — Preferences separated from media records

**Decision:** local preferences must not duplicate photo-domain truth.

### ADR-005 — Command bus before remote transport

**Decision:** define application commands before selecting WebSocket/WebRTC/local transport.

### ADR-006 — Local-first media privacy

**Decision:** ordinary photo display does not require photo upload to FenixFrame servers.

### ADR-007 — 24/7 stability requirement

**Decision:** memory lifecycle, Wake Lock, and burn-in mitigation are architecture requirements.

## 38.3 ADR replacement rule

When a decision changes, create a new ADR that supersedes the old one rather than rewriting history silently.

---

# 39. Migration Plan

> **Status: TO-BE**

## 39.1 Migration strategy

Refactor incrementally while preserving behavior.

## 39.2 Stage 0 — Audit

Before moving files:

- inventory current files;
- map imports/global dependencies;
- identify DOM ownership;
- identify browser API calls;
- identify existing EXIF path;
- map weather flow;
- map Canvas lifecycle;
- identify duplicated state;
- establish a smoke-test checklist.

## 39.3 Stage 1 — Build foundation

Introduce:

- `package.json`;
- Vite;
- `src/` structure;
- build parity with current runtime.

No feature redesign.

## 39.4 Stage 2 — Extract preferences and media persistence

Create HAL contracts and web implementations.

Migrate storage access out of UI modules.

## 39.5 Stage 3 — Extract application state and commands

Centralize:

- play/pause;
- navigation;
- hide/favorite;
- add media;
- restore visibility.

## 39.6 Stage 4 — Extract remaining platform APIs

Move:

- geolocation;
- Wake Lock;
- file export/share;
- fullscreen;
- lifecycle events.

## 39.7 Stage 5 — PWA

Add and validate:

- manifest;
- service worker;
- offline shell;
- installability.

## 39.8 Stage 6 — Capacitor

Add native projects and adapters only after web behavior is stable behind HAL.

## 39.9 Stage 7 — Reliability hardening

Add:

- burn-in engine;
- longevity tests;
- memory instrumentation;
- native lifecycle validation.

---

# 40. Phase 2 Roadmap

## 40.1 Phase 2 objective

Local remote control and mobile synchronization without requiring cloud media storage.

## 40.2 Proposed deliverables

- local frame discovery or pairing entry point;
- QR code generated by frame;
- mobile browser controller;
- authenticated local session;
- slideshow controls;
- favorite/hide controls;
- media upload over trusted local session;
- remote status acknowledgement;
- connection recovery.

## 40.3 Preconditions

Phase 2 should not begin at transport implementation until the following are stable:

- command layer;
- canonical state;
- media repository;
- HAL boundaries;
- lifecycle model;
- error taxonomy.

## 40.4 Transport decision

WebSocket vs WebRTC vs local HTTP remains **OPEN** until discovery, pairing, browser support, native packaging, LAN restrictions, and security requirements are tested.

---

# 41. Technical Debt Register

| ID | Debt | Severity | Proposed resolution |
|---|---|---:|---|
| TD-001 | favorites duplicated in IndexedDB/localStorage | High | IndexedDB/media repository becomes canonical |
| TD-002 | hidden IDs duplicated in IndexedDB/localStorage | High | same migration as TD-001 |
| TD-003 | CSP includes `'unsafe-inline'` | Medium/High | move inline code/styles and harden CSP |
| TD-004 | PWA artifacts not present in documented current tree | Medium | add manifest + service worker during PWA stage |
| TD-005 | direct browser API calls in modules | High for multiplatform | route through HAL |
| TD-006 | generic `IStorage` risks overloading responsibilities | Medium | split `IPreferences` and `IMediaRepository` |
| TD-007 | precise EXIF implementation not documented | Medium | audit source and specify parser/data flow |
| TD-008 | browser/OS support floor undefined | Medium | formal compatibility test matrix |
| TD-009 | 24/7 behavior lacks formal longevity benchmark | High | add longevity suite and acceptance threshold |
| TD-010 | remote transport discussed before protocol | Medium | implement command schema first |
| TD-011 | "Zero-Knowledge" may overstate cryptographic guarantees | Medium | use local-first/privacy-preserving terminology |
| TD-012 | build/package architecture not yet baseline | High | Vite + Capacitor migration stages |

---

# 42. Acceptance Criteria

## 42.1 Phase 1 preservation

A refactor is acceptable only if it preserves the established experience:

- slideshow works;
- pause/clean canvas works;
- zero-state recovery works;
- add-media updates without reload;
- favorites persist;
- hidden state persists;
- collage works;
- weather remains configurable;
- language remains persistent;
- reset-to-demo remains recoverable.

## 42.2 Architecture acceptance

Target architecture is considered established when:

- UI does not directly use media persistence APIs;
- platform capabilities are behind HAL contracts;
- one canonical photo state exists;
- the same core build powers web and Capacitor packages;
- application commands are independent of remote transport;
- build succeeds from a clean checkout;
- tests cover critical state transitions.

## 42.3 Reliability acceptance

Before claiming production-ready 24/7 operation:

- extended slideshow testing completed;
- no known monotonic object-URL leak;
- no duplicate slideshow timer leak;
- Wake Lock recovery tested where supported;
- background/foreground recovery tested;
- storage-full behavior tested;
- burn-in mitigation validated on representative hardware.

---

# 43. Release Checklist

## 43.1 Web/PWA

- [ ] clean production build succeeds;
- [ ] no console-breaking runtime errors;
- [ ] CSP verified;
- [ ] manifest valid;
- [ ] service worker update path tested;
- [ ] offline shell works;
- [ ] demo assets available;
- [ ] user media survives reload;
- [ ] zero-state recovery tested;
- [ ] weather failure is non-blocking;
- [ ] keyboard/touch accessibility smoke test completed;
- [ ] memory smoke test completed.

## 43.2 Android

- [ ] Capacitor sync succeeds;
- [ ] app launches offline after install where intended;
- [ ] photo permissions tested;
- [ ] file export/share tested;
- [ ] keep-awake tested;
- [ ] tablet layout tested;
- [ ] lifecycle recovery tested;
- [ ] signed AAB generated in release process;
- [ ] Play disclosure requirements reviewed.

## 43.3 iOS/iPadOS

- [ ] Capacitor sync succeeds;
- [ ] WKWebView runtime tested;
- [ ] photo permission flow tested;
- [ ] lifecycle recovery tested;
- [ ] safe areas/orientation tested;
- [ ] export/share tested;
- [ ] privacy strings reviewed;
- [ ] archive/signing workflow validated;
- [ ] App Store disclosures reviewed.

## 43.4 Documentation

- [ ] version updated;
- [ ] ADRs added for architectural changes;
- [ ] technical debt register reviewed;
- [ ] compatibility matrix updated;
- [ ] release notes generated.

---

# 44. Glossary

| Term | Definition |
|---|---|
| **Core Domain** | Platform-independent product logic. |
| **HAL** | Hardware Abstraction Layer; contracts hiding browser/native implementations. |
| **Adapter** | Platform-specific implementation of a HAL contract. |
| **Local-first** | Primary data and functionality remain available locally without mandatory cloud round-trips. |
| **PWA** | Progressive Web App; installable/offline-capable web application model. |
| **Capacitor** | Native runtime/shell used to package web code for mobile platforms. |
| **ObjectURL** | Temporary browser URL referring to a Blob/File, created with `URL.createObjectURL`. |
| **Zero-State Shield** | Recovery UI shown when no visible photos remain. |
| **Clean Canvas** | Paused display state that removes nonessential overlays. |
| **Burn-in** | Persistent image retention risk on some display technologies. |
| **Pixel shifting** | Small periodic movement of static UI elements to reduce burn-in risk. |
| **Command Bus** | Application-level dispatch boundary for local and future remote actions. |
| **Canonical state** | Single authoritative representation of a domain fact. |
| **ADR** | Architectural Decision Record. |
| **AS-IS** | Confirmed/current documented system behavior. |
| **TO-BE** | Approved target architecture, not necessarily implemented yet. |
| **ROADMAP** | Planned future capability. |

---

# 45. Appendices

## Appendix A — Phase 1 i18n baseline

The supplied Phase 1 specification documents the following concepts in Spanish, English, and French:

| Key | Spanish | English | French |
|---|---|---|---|
| `zero_state_title` | Todas las fotos están ocultas | All photos are hidden | Toutes les photos sont masquées |
| `zero_state_desc` | Has marcado todas las fotos como ocultas. | You have marked all photos as hidden. | Vous avez masqué toutes les photos. |
| `zero_state_btn` | Restablecer visibilidad | Restore visibility | Restaurer la visibilité |
| `weather_title` | Configurar clima | Configure weather | Configurer la météo |
| `weather_use_gps` | Usar mi ubicación actual | Use my current location | Utiliser ma position actuelle |
| `weather_or_manual` | o ingresar manualmente | or enter manually | ou saisir manuellement |
| `weather_placeholder` | Ciudad o código postal... | City or zip code... | Ville ou code postal... |
| `weather_search_btn` | Buscar y fijar | Search & set | Rechercher et définir |
| `weather_cta_tap` | Toca para fijar tu ciudad | Tap to set your city | Touchez pour définir votre ville |
| `storage_clear_demo_btn` | Restablecer a fotos de muestra | Reset to demo gallery | Réinitialiser la galerie démo |
| `storage_clear_confirm` | ¿Deseas restaurar la galería de muestra? | Do you want to restore demo gallery? | Voulez-vous restaurer la galerie démo ? |

## Appendix B — Current CSP baseline

```http
Content-Security-Policy: default-src 'self' https://*.pages.dev https://leptiumframe.app; script-src 'self' 'unsafe-inline' https://assets.lemonsqueezy.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; media-src 'self' blob:; connect-src 'self' https://*.pages.dev https://leptiumframe.app https://api.lemonsqueezy.com https://geocoding-api.open-meteo.com https://api.open-meteo.com; frame-src 'self' https://leptiumframe.app https://*.pages.dev https://*.lemonsqueezy.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self';
```

This is a documented baseline, not the final target security posture.

## Appendix C — Proposed HAL dependency map

```text
Application/Core
      │
      ├── IPreferences
      │      ├── WebPreferencesAdapter
      │      └── NativePreferencesAdapter
      │
      ├── IMediaRepository
      │      ├── IndexedDBMediaRepository
      │      └── NativeMediaRepository
      │
      ├── IMediaPicker
      │      ├── WebMediaPicker
      │      └── NativeMediaPicker
      │
      ├── IWakeLock
      │      ├── WebWakeLockAdapter
      │      └── NativeKeepAwakeAdapter
      │
      ├── ILocationProvider
      │      ├── WebGeolocationAdapter
      │      └── NativeGeolocationAdapter
      │
      ├── IFileExport
      ├── IShare
      ├── IFullscreen
      └── IAppLifecycle
```

## Appendix D — Proposed command catalog

```text
slideshow.play
slideshow.pause
slideshow.next
slideshow.previous
photo.add
photo.favorite
photo.hide
photo.restore_visibility
photo.download
photo.info.open
collage.open
collage.selection.update
collage.export
weather.location.set
weather.units.set
settings.open
storage.reset_demo
```

Future remote commands should map onto this catalog rather than inventing parallel behavior.

## Appendix E — Refactor gate checklist

Before performing the structural refactor:

- [ ] audit current source files;
- [ ] record all browser API calls;
- [ ] record all IndexedDB accesses;
- [ ] record all localStorage accesses;
- [ ] map `state.activePhotos` lifecycle;
- [ ] map slideshow timers;
- [ ] map current ObjectURL creation/revocation;
- [ ] map current Canvas instances;
- [ ] identify EXIF library/parser and invocation path;
- [ ] map weather fetch flow;
- [ ] map every DOM event listener;
- [ ] capture baseline screenshots;
- [ ] capture manual smoke-test results;
- [ ] only then begin file migration.

## Appendix F — Phase boundaries

### Phase 1 — Current validated product

- local slideshow;
- add media;
- IndexedDB photos;
- favorites/hidden behavior;
- Clean Canvas;
- Zero-State Shield;
- collage;
- weather/location;
- ES/EN/FR;
- reset to demo.

### Architecture Refactor — Version 3 target

- Vite monorepo;
- Core/UI/HAL separation;
- canonical media repository;
- application commands;
- PWA assets;
- Capacitor adapters;
- memory/lifecycle hardening;
- burn-in engine;
- tests/observability.

### Phase 2 — Remote control

- QR pairing;
- trusted local session;
- remote command transport;
- local-network media upload;
- transport-independent command protocol.

---

# Final Architecture Statement

FenixFrame should evolve as **one product with multiple platform adapters**, not as separate web, Android, and iOS implementations.

The stable architectural center is:

```text
User intent
   ↓
Application Command
   ↓
Core Domain
   ↓
HAL Contract
   ↓
Platform Adapter
```

The core must remain independent from transport, browser vendor, native plugin, and future remote-control mechanism.

This architecture preserves the simplicity that made Phase 1 functional while creating explicit boundaries for scale, testability, privacy, long-running stability, PWA installation, native packaging, and Phase 2 local remote control.

---

**End of FENIXFRAME — Architecture & Engineering Specification — Version 3.0**
