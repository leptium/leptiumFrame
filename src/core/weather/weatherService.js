/**
 * Servicio de clima y geolocalización adaptativo.
 * Opera en segundo plano sin bloquear el motor de diapositivas y maneja silenciosamente
 * rechazos o bloqueos de permisos del sistema operativo (ej. overlays en Android 10).
 */
export class WeatherService {
  constructor(options = {}) {
    this.defaultLat = options.latitude || null;
    this.defaultLon = options.longitude || null;
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

  async fetchWeatherData(lat, lon) {
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      throw new Error('Coordenadas inválidas');
    }
    this.defaultLat = lat;
    this.defaultLon = lon;

    const [resolvedName] = await Promise.allSettled([
      this._reverseGeocode(lat, lon),
      this.fetchWeather(lat, lon)
    ]);

    if (resolvedName.status === 'fulfilled' && resolvedName.value) {
      this.currentLocationStr = resolvedName.value;
    }

    this._notify();
    return {
      locationStr: this.currentLocationStr,
      weatherStr: this.currentWeatherStr
    };
  }

  async fetchWeather(lat = this.defaultLat, lon = this.defaultLon) {
    if (typeof lat !== 'number' || typeof lon !== 'number') return;
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit`;
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
    } catch (_) {
      // Fallo silencioso en consulta meteorológica
    }
  }
}

export const weatherService = new WeatherService();

