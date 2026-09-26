/**
 * Servicio de clima y geolocalización adaptativo.
 * Combina geolocalización IP / coordenadas GPS y pronóstico en tiempo real.
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
    this.listeners.forEach(cb => cb({
      locationStr: this.currentLocationStr,
      weatherStr: this.currentWeatherStr
    }));
  }

  async fetchLocation() {
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
