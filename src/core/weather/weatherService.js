/**
 * Servicio de clima y geolocalización adaptativo.
 * Opera en segundo plano sin bloquear el motor de diapositivas y soporta
 * geocodificación internacional multi-idioma con Open-Meteo sin API key.
 */
export function getUserLanguageCode() {
  try {
    const savedLang = typeof localStorage !== 'undefined' && localStorage.getItem('leptium_language');
    if (savedLang) return String(savedLang).split('-')[0].toLowerCase();
  } catch (_) {}
  const lang = (typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) || 'es';
  return String(lang).split('-')[0].toLowerCase() || 'es';
}

export class WeatherService {
  constructor(options = {}) {
    this.defaultLat = options.latitude || null;
    this.defaultLon = options.longitude || null;
    this.currentLocationStr = '';
    this.currentWeatherStr = '';
    this.currentTempStr = '--°';
    this.currentTempC = null;
    this.currentWeatherCode = null;
    this.currentIsDay = 1;
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
        weatherStr: this.currentWeatherStr,
        tempStr: this.currentTempStr,
        tempC: this.currentTempC,
        weatherCode: this.currentWeatherCode,
        isDay: this.currentIsDay
      })
    );
  }

  async _reverseGeocode(lat, lon) {
    const langCode = getUserLanguageCode();
    try {
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=${encodeURIComponent(langCode)}`;
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
    } catch (_) {
      // Fallo silencioso en geocodificación inversa
    }
    return '';
  }

  async geocodeCity(query, langCode = getUserLanguageCode()) {
    const cleanQuery = String(query || '').trim();
    if (!cleanQuery) return null;

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanQuery)}&count=1&language=${encodeURIComponent(langCode)}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data || !Array.isArray(data.results) || data.results.length === 0) {
      return null;
    }

    const match = data.results[0];
    if (typeof match.latitude !== 'number' || typeof match.longitude !== 'number') {
      return null;
    }

    return {
      name: match.name || cleanQuery,
      lat: match.latitude,
      lon: match.longitude
    };
  }

  async fetchWeatherData(lat, lon, manualCityName = '') {
    if (typeof lat !== 'number' || typeof lon !== 'number' || Number.isNaN(lat) || Number.isNaN(lon)) {
      throw new Error('Coordenadas inválidas');
    }
    this.defaultLat = lat;
    this.defaultLon = lon;

    if (manualCityName) {
      this.currentLocationStr = manualCityName;
      await this.fetchWeather(lat, lon);
    } else {
      const [resolvedName] = await Promise.allSettled([
        this._reverseGeocode(lat, lon),
        this.fetchWeather(lat, lon)
      ]);

      if (resolvedName.status === 'fulfilled' && resolvedName.value) {
        this.currentLocationStr = resolvedName.value;
      } else if (!this.currentLocationStr) {
        this.currentLocationStr = 'Ubicación actual';
      }
    }

    this._notify();
    return {
      locationStr: this.currentLocationStr,
      weatherStr: this.currentWeatherStr,
      tempStr: this.currentTempStr,
      tempC: this.currentTempC,
      weatherCode: this.currentWeatherCode,
      isDay: this.currentIsDay
    };
  }

  async fetchWeather(lat = this.defaultLat, lon = this.defaultLon) {
    if (typeof lat !== 'number' || typeof lon !== 'number') return;
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.current_weather && typeof data.current_weather.temperature === 'number') {
          this.currentTempC = data.current_weather.temperature;
          this.currentWeatherCode = data.current_weather.weathercode;
          this.currentIsDay = typeof data.current_weather.is_day === 'number' ? data.current_weather.is_day : 1;
          const tempC = Math.round(this.currentTempC);
          const tempF = Math.round((this.currentTempC * 9) / 5 + 32);
          this.currentTempStr = `${tempC}°C`;
          this.currentWeatherStr = `${tempF}°F  /  ${tempC}°C`;
          this._notify();
          return;
        }
      }
    } catch (_) {
      // Fallo silencioso en consulta meteorológica
    }
  }
}

export const weatherService = new WeatherService();


