/**
 * Servicio de clima y geolocalización adaptativo.
 * Combina geolocalización nativa del navegador (GPS/Wi-Fi) con geocodificación inversa
 * (BigDataCloud / Nominatim) y fallback por IP, consultando pronóstico en tiempo real (Open-Meteo).
 */
export class WeatherService {
  constructor(options = {}) {
    this.defaultLat = options.latitude || 43.67;
    this.defaultLon = options.longitude || -70.44;
    this.currentLocationStr = '';
    this.currentWeatherStr = '';
    this.listeners = new Set();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  _notify() {
    this.listeners.forEach((cb) =>
      cb({
        locationStr: this.currentLocationStr,
        weatherStr: this.currentWeatherStr
      })
    );
  }

  _getBrowserPosition() {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        reject(new Error('Geolocation API no disponible'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 6000,
        maximumAge: 15 * 60 * 1000
      });
    });
  }

  async _reverseGeocode(lat, lon) {
    try {
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=es`;
      const res = await fetch(bdcUrl);
      if (res.ok) {
        const data = await res.json();
        const city = data.city || data.locality || '';
        const region = data.principalSubdivisionCode
          ? data.principalSubdivisionCode.replace(/^[A-Z]{2}-/, '')
          : data.principalSubdivision || '';
        if (city) {
          return city + (region ? `, ${region}` : '');
        }
      }
    } catch (e) {
      console.warn('[WeatherService] Fallback geocodificación inversa:', e);
    }
    return '';
  }

  async fetchLocation() {
    // 1. Intentar geolocalización nativa del navegador (solicita permiso si aplica)
    try {
      const pos = await this._getBrowserPosition();
      if (pos && pos.coords) {
        this.defaultLat = pos.coords.latitude;
        this.defaultLon = pos.coords.longitude;
        const resolvedName = await this._reverseGeocode(this.defaultLat, this.defaultLon);
        if (resolvedName) {
          this.currentLocationStr = resolvedName;
          this._notify();
          return;
        }
      }
    } catch (_) {
      // Si el usuario deniega permiso o expira, continuar con fallback silencioso por IP
    }

    // 2. Fallback: Geolocalización aproximada vía BigDataCloud / ipwho.is
    try {
      const bdcRes = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=es');
      if (bdcRes.ok) {
        const data = await bdcRes.json();
        const city = data.city || data.locality || '';
        const region = data.principalSubdivisionCode
          ? data.principalSubdivisionCode.replace(/^[A-Z]{2}-/, '')
          : data.principalSubdivision || '';
        if (city) {
          this.currentLocationStr = city + (region ? `, ${region}` : '');
          if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
            this.defaultLat = data.latitude;
            this.defaultLon = data.longitude;
          }
          this._notify();
          return;
        }
      }
    } catch (_) {}

    try {
      const res = await fetch('https://ipwho.is/');
      if (res.ok) {
        const data = await res.json();
        if (data.success !== false) {
          const city = data.city || '';
          const region = data.region_code || data.region || '';
          if (city) {
            this.currentLocationStr = city + (region ? `, ${region}` : '');
            if (data.latitude && data.longitude) {
              this.defaultLat = data.latitude;
              this.defaultLon = data.longitude;
            }
            this._notify();
          }
        }
      }
    } catch (e) {
      console.warn('[WeatherService] Error obteniendo ubicación IP:', e);
    }
  }

  async fetchWeather() {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${this.defaultLat}&longitude=${this.defaultLon}&current_weather=true&temperature_unit=fahrenheit`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.current_weather) {
          const cw = data.current_weather;
          const tempF = Math.round(cw.temperature);
          const tempC = Math.round(((tempF - 32) * 5) / 9);
          this.currentWeatherStr = `${tempF}°F  /  ${tempC}°C`;
          this._notify();
          return;
        }
      }
    } catch (e) {
      console.warn('[WeatherService] Error consultando Open-Meteo:', e);
    }
  }

  start(intervalMs = 30 * 60 * 1000) {
    this.fetchLocation().then(() => this.fetchWeather());
    setInterval(() => this.fetchLocation(), intervalMs);
    setInterval(() => this.fetchWeather(), intervalMs);
  }
}

export const weatherService = new WeatherService();
