# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) and [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

## [Unreleased]
### Added
- Hardware profiling module for legacy WebKit & low-RAM Android environments.
- Streaming batch import pipeline with garbage-collection backpressure.
- Fisher-Yates shuffle playback engine.
- Dual-mode ASCII art easter egg (multitouch & terminal shortcut).

### Security
- Hardened Content-Security-Policy (CSP) with zero external script execution.
- Strict XSS DOM sanitization on user file imports.
- Clickjacking protection via X-Frame-Options DENY.

## [3.0.0] - 2026-09-26
### Added
- Unified top-right ambient widget with contextual menu, monthly calendar viewer, and 12h/24h clock format toggle.
- Interactive 2x2 Collage Studio with photo picker modal and high-resolution preview modal before export.
- Multi-language weather unit selector (°C / °F) with on-demand GPS and manual Open-Meteo city search.
- Tri-lingual internationalization engine (`ES`, `EN`, `FR`) with dynamic parameter interpolation.
- Hardware Abstraction Layer (HAL) decoupling storage, media picking, and wake lock across Web/PWA and Capacitor runtimes.

### Fixed
- Eliminated Cloudflare Pages `/app/` 308 redirect loop by migrating app entry point to `app/index.html`.
- Decoupled geolocation lifecycle from initial boot to guarantee zero-block slideshow startup.
- Refactored photo and collage export pipeline to use in-memory `Blob` objects directly without re-fetching `blob:` URLs.
