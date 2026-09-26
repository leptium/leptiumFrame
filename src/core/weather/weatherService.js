/**
 * Servicio de clima y geolocalización adaptativo.
 * Opera en segundo plano sin bloquear el motor de diapositivas y soporta
 * anulación manual de ciudad con geocodificación Open-Meteo sin API key.
 */
export class WeatherService {
  constructor(options = {}) {
    this.defaultLat = options.latitude || null;
    this.defaultLon = options.longitude || null;
    this.currentLocationStr = '';
    this.currentWeatherStr = '';
    this.currentTempStr = '--°';
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
        tempStr: this.currentTempStr
      })
    );
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
    } catch (_) {
      // Fallo silencioso en geocodificación inversa
    }
    return '';
  }

  async geocodeCity(query) {
    const cleanQuery = String(query || '').trim();
    if (!cleanQuery) return null;

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanQuery)}&count=1&language=es&format=json`;
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

    const displayName = match.admin1 && match.admin1 !== match.name
      ? `${match.name}, ${match.admin1}`
      : match.name;

    return {
      name: displayName || cleanQuery,
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
      tempStr: this.currentTempStr
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
          const tempC = Math.round(data.current_weather.temperature);
          const tempF = Math.round((tempC * 9) / 5 + 32);
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


