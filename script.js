// Units dropdown functionality
document.addEventListener('DOMContentLoaded', function() {
  const unitsToggle = document.querySelector('.units-toggle');
  const unitsDropdown = document.querySelector('.units-dropdown');
  
  // Toggle dropdown on button click
  unitsToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    
    const isHidden = unitsDropdown.hasAttribute('hidden');
    
    if (isHidden) {
      unitsDropdown.removeAttribute('hidden');
      unitsToggle.setAttribute('aria-expanded', 'true');
    } else {
      unitsDropdown.setAttribute('hidden', '');
      unitsToggle.setAttribute('aria-expanded', 'false');
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!unitsToggle.contains(e.target) && !unitsDropdown.contains(e.target)) {
      unitsDropdown.setAttribute('hidden', '');
      unitsToggle.setAttribute('aria-expanded', 'false');
    }
  });
  
  // Prevent dropdown from closing when clicking inside it
  unitsDropdown.addEventListener('click', function(e) {
    e.stopPropagation();
  });

  // Switch button functionality
  const switchBtn = document.querySelector('.units-dropdown__switch-btn');
  let isMetric = true; // legacy flag (will mirror radios)

  // Conversion functions
  function celsiusToFahrenheit(celsius) {
    return Math.round((celsius * 9/5) + 32);
  }

  function fahrenheitToCelsius(fahrenheit) {
    return Math.round((fahrenheit - 32) * 5/9);
  }

  function kmhToMph(kmh) {
    return Math.round(kmh * 0.621371);
  }

  function mphToKmh(mph) {
    return Math.round(mph / 0.621371);
  }

  function mmToInches(mm) {
    return (mm * 0.0393701).toFixed(1);
  }

  function inchesToMm(inches) {
    return Math.round(inches / 0.0393701);
  }

  // ----- Canonical state (always metric from API) -----
  const appState = {
    metricData: null,
    units: { temperature: 'celsius', wind: 'kmh', precipitation: 'mm' },
    selectedDayDate: null, // ISO date string (YYYY-MM-DD)
    lastCity: null // { name, lat, lon }
  };

  // Derived unit system flag for the big switch
  function isImperialSelected() {
    return appState.units.temperature === 'fahrenheit' &&
           appState.units.wind === 'mph' &&
           appState.units.precipitation === 'in';
  }

  // Formatting helpers
  function formatTemperatureC(valueC) {
    if (appState.units.temperature === 'fahrenheit') {
      return celsiusToFahrenheit(valueC) + '°';
    }
    return Math.round(valueC) + '°';
  }
  function formatWindKmh(valueKmh) {
    if (appState.units.wind === 'mph') {
      return kmhToMph(valueKmh) + ' mph';
    }
    return Math.round(valueKmh) + ' km/h';
  }
  function formatPrecipMm(valueMm) {
    if (appState.units.precipitation === 'in') {
      return Number(mmToInches(valueMm)).toFixed(1) + ' in';
    }
    return Math.round(valueMm) + ' mm';
  }

  // Map Open-Meteo weather_code to icon asset and alt text
  function mapWeatherCodeToIcon(code) {
    if (code === 0) return { src: './assets/images/icon-sunny.webp', alt: 'Clear sky' };
    if (code >= 1 && code <= 2) return { src: './assets/images/icon-partly-cloudy.webp', alt: 'Partly cloudy' };
    if (code === 3) return { src: './assets/images/icon-overcast.webp', alt: 'Overcast' };
    if (code === 45 || code === 48) return { src: './assets/images/icon-fog.webp', alt: 'Fog' };
    if ((code >= 51 && code <= 57)) return { src: './assets/images/icon-drizzle.webp', alt: 'Drizzle' };
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { src: './assets/images/icon-rain.webp', alt: 'Rain' };
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return { src: './assets/images/icon-snow.webp', alt: 'Snow' };
    if (code === 95 || code === 96 || code === 99) return { src: './assets/images/icon-storm.webp', alt: 'Thunderstorm' };
    return { src: './assets/images/icon-partly-cloudy.webp', alt: 'Cloudy' };
  }

  // Sync radios with state
  function setRadiosFromUnits() {
    const map = {
      temperature: { celsius: 'celsius', fahrenheit: 'fahrenheit' },
      wind: { kmh: 'kmh', mph: 'mph' },
      precipitation: { mm: 'mm', in: 'in' }
    };
    Object.entries(appState.units).forEach(([group, val]) => {
      const input = document.querySelector(`input[name="${group}"][value="${map[group][val]}"]`);
      if (input) input.checked = true;
    });
    updateUnitSelectionVisuals();
  }

  function getUnitsFromRadios() {
    const t = document.querySelector('input[name="temperature"]:checked');
    const w = document.querySelector('input[name="wind"]:checked');
    const p = document.querySelector('input[name="precipitation"]:checked');
    return {
      temperature: t ? t.value : appState.units.temperature,
      wind: w ? w.value : appState.units.wind,
      precipitation: p ? p.value : appState.units.precipitation
    };
  }

  // Main render using canonical metric data
  function renderAll() {
    const data = appState.metricData;
    if (!data) return;

    // Today card
    const todayTempEl = document.querySelector('.today-card__temp');
    const todayIconEl = document.querySelector('.today-card__icon');
    const todayDateEl = document.querySelector('.today-card__date');

    if (data.current) {
      if (todayTempEl) todayTempEl.textContent = formatTemperatureC(data.current.temperature_2m);

      // metrics via data-kind
      const feelsEl = document.querySelector('.metric-card__value[data-kind="feels"]');
      const humidityEl = document.querySelector('.metric-card__value[data-kind="humidity"]');
      const windEl = document.querySelector('.metric-card__value[data-kind="wind"]');
      const precipEl = document.querySelector('.metric-card__value[data-kind="precip"]');
      if (feelsEl) feelsEl.textContent = formatTemperatureC(data.current.apparent_temperature);
      if (humidityEl) humidityEl.textContent = Math.round(data.current.relative_humidity_2m) + '%';
      if (windEl) windEl.textContent = formatWindKmh(data.current.wind_speed_10m);
      if (precipEl) precipEl.textContent = formatPrecipMm(Number(data.current.precipitation || 0));

      if (todayIconEl && typeof data.current.weather_code !== 'undefined') {
        const icon = mapWeatherCodeToIcon(Number(data.current.weather_code));
        todayIconEl.src = icon.src;
        todayIconEl.alt = icon.alt;
      }
    }

    if (todayDateEl && data.daily && data.daily.time && data.daily.time[0]) {
      const d = new Date(data.daily.time[0]);
      const formatter = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
      todayDateEl.textContent = formatter.format(d);
    }

    // Daily highs/lows (7)
    if (data.daily) {
      const highs = data.daily.temperature_2m_max || [];
      const lows = data.daily.temperature_2m_min || [];
      const listEls = document.querySelectorAll('.daily-item');
      listEls.forEach((item, idx) => {
        const high = highs[idx];
        const low = lows[idx];
        if (high != null && low != null) {
          const highEl = item.querySelector('.daily-item__high');
          const lowEl = item.querySelector('.daily-item__low');
          if (highEl) highEl.textContent = formatTemperatureC(high);
          if (lowEl) lowEl.textContent = formatTemperatureC(low);
        }
      });
    }

    // Prepare day options from daily.time and render hourly for selected day
    setupDayOptionsFromDaily();
    if (!appState.selectedDayDate) {
      // default to first daily date
      if (appState.metricData && appState.metricData.daily && appState.metricData.daily.time && appState.metricData.daily.time[0]) {
        appState.selectedDayDate = String(appState.metricData.daily.time[0]);
      }
    }
    renderHourlyForDate(appState.selectedDayDate);
  }

  // Build day options list from daily.time and map labels/dates
  function setupDayOptionsFromDaily() {
    const daily = appState.metricData && appState.metricData.daily;
    if (!daily || !daily.time) return;
    const formatter = new Intl.DateTimeFormat(undefined, { weekday: 'long' });
    const optionEls = document.querySelectorAll('.day-selector-dropdown__option');
    optionEls.forEach((opt, idx) => {
      const dateStr = daily.time[idx];
      if (!dateStr) return;
      const label = formatter.format(new Date(dateStr));
      const span = opt.querySelector('span') || opt;
      span.textContent = label;
      opt.dataset.date = dateStr;
      // aria-selected sync
      opt.setAttribute('role', 'option');
      opt.setAttribute('aria-selected', appState.selectedDayDate === dateStr ? 'true' : 'false');
    });
    // Update button text
    const btn = document.querySelector('.hourly-forecast__day-selector');
    if (btn && appState.selectedDayDate) {
      btn.firstChild && (btn.firstChild.textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(new Date(appState.selectedDayDate)) + ' ');
    }
  }

  // Render hourly temps/times for a given ISO date (YYYY-MM-DD)
  function renderHourlyForDate(dateStr) {
    const hourly = appState.metricData && appState.metricData.hourly;
    if (!hourly || !hourly.time || !hourly.temperature_2m) return;
    const times = hourly.time;
    const temps = hourly.temperature_2m;

    // Collect indices matching the date
    const indices = [];
    for (let i = 0; i < times.length; i++) {
      if (String(times[i]).startsWith(dateStr)) indices.push(i);
    }

    const containers = document.querySelectorAll('.hourly-item-container');
    containers.forEach((container, idx) => {
      const item = container.querySelector('.hourly-item');
      const timeEl = container.querySelector('.hourly-item__time');
      const tempEl = container.querySelector('.hourly-item__temp');
      const hourlyIdx = indices[idx];
      if (hourlyIdx != null && timeEl && tempEl) {
        const dt = new Date(times[hourlyIdx]);
        const label = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).format(dt);
        timeEl.textContent = label;
        tempEl.textContent = formatTemperatureC(temps[hourlyIdx]);
        container.style.display = '';
      } else {
        // hide extra rows if fewer than available slots
        container.style.display = 'none';
      }
    });
  }

  function updateAllWeatherValues() {
    if (!isMetric) {
      // Currently in Imperial → ensure imperial values are shown
      convertTemperaturesToFahrenheit();
      convertWindSpeedsToMph();
      convertPrecipitationToInches();
    } else {
      // Currently in Metric → ensure metric values are shown
      convertTemperaturesToCelsius();
      convertWindSpeedsToKmh();
      convertPrecipitationToMm();
    }
  }

  function convertTemperaturesToFahrenheit() {
    // Today card temperature
    const todayTemp = document.querySelector('.today-card__temp');
    const currentTemp = parseInt(todayTemp.textContent);
    todayTemp.textContent = celsiusToFahrenheit(currentTemp) + '°';

    // Feels like temperature
    const feelsLike = document.querySelector('.metric-card__value');
    const feelsLikeTemp = parseInt(feelsLike.textContent);
    feelsLike.textContent = celsiusToFahrenheit(feelsLikeTemp) + '°';

    // Daily forecast temperatures
    const dailyHighs = document.querySelectorAll('.daily-item__high');
    const dailyLows = document.querySelectorAll('.daily-item__low');
    
    dailyHighs.forEach(high => {
      const temp = parseInt(high.textContent);
      high.textContent = celsiusToFahrenheit(temp) + '°';
    });

    dailyLows.forEach(low => {
      const temp = parseInt(low.textContent);
      low.textContent = celsiusToFahrenheit(temp) + '°';
    });

    // Hourly forecast temperatures
    const hourlyTemps = document.querySelectorAll('.hourly-item__temp');
    hourlyTemps.forEach(temp => {
      const tempValue = parseInt(temp.textContent);
      temp.textContent = celsiusToFahrenheit(tempValue) + '°';
    });
  }

  function convertTemperaturesToCelsius() {
    // Today card temperature
    const todayTemp = document.querySelector('.today-card__temp');
    const currentTemp = parseInt(todayTemp.textContent);
    todayTemp.textContent = fahrenheitToCelsius(currentTemp) + '°';

    // Feels like temperature
    const feelsLike = document.querySelector('.metric-card__value');
    const feelsLikeTemp = parseInt(feelsLike.textContent);
    feelsLike.textContent = fahrenheitToCelsius(feelsLikeTemp) + '°';

    // Daily forecast temperatures
    const dailyHighs = document.querySelectorAll('.daily-item__high');
    const dailyLows = document.querySelectorAll('.daily-item__low');
    
    dailyHighs.forEach(high => {
      const temp = parseInt(high.textContent);
      high.textContent = fahrenheitToCelsius(temp) + '°';
    });

    dailyLows.forEach(low => {
      const temp = parseInt(low.textContent);
      low.textContent = fahrenheitToCelsius(temp) + '°';
    });

    // Hourly forecast temperatures
    const hourlyTemps = document.querySelectorAll('.hourly-item__temp');
    hourlyTemps.forEach(temp => {
      const tempValue = parseInt(temp.textContent);
      temp.textContent = fahrenheitToCelsius(tempValue) + '°';
    });
  }

  function convertWindSpeedsToMph() {
    const windElements = document.querySelectorAll('.metric-card__value');
    windElements.forEach(element => {
      if (element.textContent.includes('km/h')) {
        const speed = parseInt(element.textContent);
        element.textContent = kmhToMph(speed) + ' mph';
      }
    });
  }

  function convertWindSpeedsToKmh() {
    const windElements = document.querySelectorAll('.metric-card__value');
    windElements.forEach(element => {
      if (element.textContent.includes('mph')) {
        const speed = parseInt(element.textContent);
        element.textContent = mphToKmh(speed) + ' km/h';
      }
    });
  }

  function convertPrecipitationToInches() {
    const precipElements = document.querySelectorAll('.metric-card__value');
    precipElements.forEach(element => {
      if (element.textContent.includes('mm')) {
        const amount = parseInt(element.textContent);
        element.textContent = mmToInches(amount) + ' in';
      }
    });
  }

  function convertPrecipitationToMm() {
    const precipElements = document.querySelectorAll('.metric-card__value');
    precipElements.forEach(element => {
      if (element.textContent.includes('in')) {
        const amount = parseFloat(element.textContent);
        element.textContent = inchesToMm(amount) + ' mm';
      }
    });
  }

  switchBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    
    // Toggle between full metric and full imperial
    if (isImperialSelected()) {
      appState.units = { temperature: 'celsius', wind: 'kmh', precipitation: 'mm' };
      switchBtn.textContent = 'Switch to Imperial';
      isMetric = true;
      saveUnitsToStorage();
    } else {
      appState.units = { temperature: 'fahrenheit', wind: 'mph', precipitation: 'in' };
      switchBtn.textContent = 'Switch to Metric';
      isMetric = false;
      saveUnitsToStorage();
    }

    setRadiosFromUnits();
    renderAll();
  });

  // Function to update visual states of radio buttons
  function updateUnitSelectionVisuals() {
    const labels = document.querySelectorAll('.units-dropdown__section label');
    labels.forEach(label => {
      const input = label.querySelector('input[type="radio"]');
      if (input && input.checked) {
        label.classList.add('checked');
      } else {
        label.classList.remove('checked');
      }
    });
  }

  // Wire radios to state
  document.querySelectorAll('.units-dropdown__section input[type="radio"]').forEach(input => {
    input.addEventListener('change', () => {
      appState.units = getUnitsFromRadios();
      isMetric = !isImperialSelected();
      switchBtn.textContent = isImperialSelected() ? 'Switch to Metric' : 'Switch to Imperial';
      updateUnitSelectionVisuals();
      saveUnitsToStorage();
      renderAll();
    });
  });

  // Initial units from storage
  loadUnitsFromStorage();
  setRadiosFromUnits();

  // Day selector dropdown functionality
  const daySelector = document.querySelector('.hourly-forecast__day-selector');
  const dayDropdown = document.querySelector('.day-selector-dropdown');
  const dayOptions = document.querySelectorAll('.day-selector-dropdown__option');

  // Toggle day dropdown on button click
  daySelector.addEventListener('click', function(e) {
    e.stopPropagation();
    
    const isHidden = dayDropdown.hasAttribute('hidden');
    
    if (isHidden) {
      dayDropdown.removeAttribute('hidden');
      daySelector.setAttribute('aria-expanded', 'true');
    } else {
      dayDropdown.setAttribute('hidden', '');
      daySelector.setAttribute('aria-expanded', 'false');
    }
  });

  // Handle day selection
  dayOptions.forEach(option => {
    option.addEventListener('click', function(e) {
      e.stopPropagation();
      
      // Update selected date
      const dateStr = this.dataset.date;
      if (dateStr) appState.selectedDayDate = dateStr;

      // Update aria-selected
      dayOptions.forEach(opt => opt.setAttribute('aria-selected', 'false'));
      this.setAttribute('aria-selected', 'true');

      // Update button text
      const selectedDay = this.querySelector('span').textContent;
      const buttonText = daySelector.childNodes[0];
      buttonText.textContent = selectedDay + ' ';
      
      // Close dropdown
      dayDropdown.setAttribute('hidden', '');
      daySelector.setAttribute('aria-expanded', 'false');

      // Re-render hourly for selected day
      renderHourlyForDate(appState.selectedDayDate);
    });
  });

  // Close day dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!daySelector.contains(e.target) && !dayDropdown.contains(e.target)) {
      dayDropdown.setAttribute('hidden', '');
      daySelector.setAttribute('aria-expanded', 'false');
    }
  });

  // Search dropdown functionality
  const searchInput = document.querySelector('.search-form__input');
  const searchDropdown = document.querySelector('.search-dropdown');
  const searchListbox = document.getElementById('search-listbox');
  
  // Open-Meteo Geocoding endpoint
  const GEOCODE_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';
  const FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

  let currentHighlight = -1;
  let geocodeController = null;
  let forecastController = null;

  function setSearchExpanded(expanded) {
    searchInput.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  }

  // Show dropdown when input is focused and has value
  searchInput.addEventListener('focus', function() {
    if (searchInput.value.length > 0) {
      fetchAndShowResults(searchInput.value);
    }
  });

  // Filter results as user types (debounced)
  let searchTimeout;
  searchInput.addEventListener('input', function() {
    const query = searchInput.value.trim();
    clearTimeout(searchTimeout);
    
    if (query.length > 0) {
      searchTimeout = setTimeout(() => fetchAndShowResults(query), 250);
    } else {
      searchDropdown.setAttribute('hidden', '');
      setSearchExpanded(false);
      currentHighlight = -1;
      if (searchListbox) searchListbox.innerHTML = '';
    }
  });

  function updateHighlight(options) {
    options.forEach((option, index) => {
      const isActive = index === currentHighlight;
      option.classList.toggle('highlighted', isActive);
      option.setAttribute('aria-selected', isActive ? 'true' : 'false');
      if (isActive) {
        searchInput.setAttribute('aria-activedescendant', option.id);
      }
    });
    if (currentHighlight < 0) searchInput.removeAttribute('aria-activedescendant');
  }

  // Handle keyboard navigation
  searchInput.addEventListener('keydown', function(e) {
    const visibleOptions = searchDropdown.querySelectorAll('.search-dropdown__option');
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      currentHighlight = Math.min(currentHighlight + 1, visibleOptions.length - 1);
      updateHighlight(visibleOptions);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      currentHighlight = Math.max(currentHighlight - 1, -1);
      updateHighlight(visibleOptions);
    } else if (e.key === 'Enter') {
      if (currentHighlight >= 0 && visibleOptions[currentHighlight]) {
        e.preventDefault();
        const opt = visibleOptions[currentHighlight];
        const name = opt.dataset.name;
        const lat = Number(opt.dataset.lat);
        const lon = Number(opt.dataset.lon);
        selectCity(name, lat, lon);
      }
    } else if (e.key === 'Escape') {
      searchDropdown.setAttribute('hidden', '');
      setSearchExpanded(false);
      currentHighlight = -1;
    }
  });

  async function fetchAndShowResults(query) {
    try {
      if (geocodeController) geocodeController.abort();
      geocodeController = new AbortController();

      const url = `${GEOCODE_ENDPOINT}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
      const res = await fetch(url, { signal: geocodeController.signal });
      const data = await res.json();
      const results = (data && data.results) ? data.results : [];

      const content = searchListbox || searchDropdown.querySelector('.search-dropdown__content');
      content.innerHTML = '';

      results.forEach((place, idx) => {
        const displayName = `${place.name}${place.admin1 ? ', ' + place.admin1 : ''}${place.country ? ', ' + place.country : ''}`;
        const option = document.createElement('div');
        option.className = 'search-dropdown__option';
        option.setAttribute('role', 'option');
        option.id = `search-opt-${idx}`;
        option.dataset.name = displayName;
        option.dataset.lat = place.latitude;
        option.dataset.lon = place.longitude;
        const span = document.createElement('span');
        span.textContent = displayName;
        option.appendChild(span);
        option.addEventListener('click', function() {
          selectCity(displayName, place.latitude, place.longitude);
        });
        content.appendChild(option);
      });

      if (results.length > 0) {
        searchDropdown.removeAttribute('hidden');
        setSearchExpanded(true);
        currentHighlight = -1;
        updateHighlight(content.querySelectorAll('.search-dropdown__option'));
      } else {
        searchDropdown.setAttribute('hidden', '');
        setSearchExpanded(false);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Geocoding error:', err);
        searchDropdown.setAttribute('hidden', '');
        setSearchExpanded(false);
      }
    }
  }

  async function selectCity(cityName, lat, lon) {
    searchInput.value = cityName;
    searchDropdown.setAttribute('hidden', '');
    setSearchExpanded(false);
    currentHighlight = -1;
    
    // Update the weather location
    const locationElement = document.querySelector('.today-card__location');
    if (locationElement) {
      locationElement.textContent = cityName;
    }

    // Persist last city
    saveLastCity(cityName, lat, lon);

    // Fetch weather from Open-Meteo
    await fetchAndRenderWeather(lat, lon);
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
      searchDropdown.setAttribute('hidden', '');
      setSearchExpanded(false);
      currentHighlight = -1;
    }
  });

  async function fetchAndRenderWeather(latitude, longitude) {
    try {
      if (forecastController) forecastController.abort();
      forecastController = new AbortController();

      // Simple loading state
      const todayTempEl = document.querySelector('.today-card__temp');
      if (todayTempEl) todayTempEl.textContent = '…';

      const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        current: ['temperature_2m','relative_humidity_2m','precipitation','wind_speed_10m','apparent_temperature','weather_code'].join(','),
        hourly: ['temperature_2m'].join(','),
        daily: ['temperature_2m_max','temperature_2m_min','precipitation_sum','wind_speed_10m_max'].join(','),
        timezone: 'auto'
      });

      const url = `${FORECAST_ENDPOINT}?${params.toString()}`;
      const res = await fetch(url, { signal: forecastController.signal });
      const data = await res.json();

      // Save canonical metric data and render
      appState.metricData = data;
      // Default selected day to first if not set
      if (!appState.selectedDayDate && data.daily && data.daily.time && data.daily.time[0]) {
        appState.selectedDayDate = String(data.daily.time[0]);
      }
      renderAll();
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Forecast error:', err);
        const todayTempEl = document.querySelector('.today-card__temp');
        if (todayTempEl) todayTempEl.textContent = '--';
      }
    }
  }

  // Persistence helpers
  function saveUnitsToStorage() {
    try { localStorage.setItem('units', JSON.stringify(appState.units)); } catch {}
  }
  function loadUnitsFromStorage() {
    try {
      const raw = localStorage.getItem('units');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.temperature && parsed.wind && parsed.precipitation) {
          appState.units = parsed;
        }
      }
    } catch {}
  }
  function saveLastCity(name, lat, lon) {
    try { localStorage.setItem('lastCity', JSON.stringify({ name, lat, lon })); } catch {}
  }
  function loadLastCity() {
    try { const raw = localStorage.getItem('lastCity'); return raw ? JSON.parse(raw) : null; } catch { return null; }
  }

  // Hydrate on load: last city or geolocate or fallback
  (async function initOnLoad() {
    const saved = loadLastCity();
    if (saved && typeof saved.lat === 'number' && typeof saved.lon === 'number') {
      const locationElement = document.querySelector('.today-card__location');
      if (locationElement && saved.name) locationElement.textContent = saved.name;
      await fetchAndRenderWeather(saved.lat, saved.lon);
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const locationElement = document.querySelector('.today-card__location');
        if (locationElement) locationElement.textContent = 'Your location';
        await fetchAndRenderWeather(latitude, longitude);
      }, async () => {
        // Fallback: Berlin
        const name = 'Berlin, Germany';
        const lat = 52.52;
        const lon = 13.405;
        const locationElement = document.querySelector('.today-card__location');
        if (locationElement) locationElement.textContent = name;
        await fetchAndRenderWeather(lat, lon);
      }, { enableHighAccuracy: false, timeout: 5000 });
    } else {
      const name = 'Berlin, Germany';
      const lat = 52.52;
      const lon = 13.405;
      const locationElement = document.querySelector('.today-card__location');
      if (locationElement) locationElement.textContent = name;
      await fetchAndRenderWeather(lat, lon);
    }
  })();
});
