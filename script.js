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
    units: { temperature: 'celsius', wind: 'kmh', precipitation: 'mm' }
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
    // Basic groups based on Open-Meteo docs
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

      // metrics: [Feels Like, Humidity, Wind, Precip]
      const metricValues = document.querySelectorAll('.metric-card__value');
      if (metricValues[0]) metricValues[0].textContent = formatTemperatureC(data.current.apparent_temperature);
      if (metricValues[1]) metricValues[1].textContent = Math.round(data.current.relative_humidity_2m) + '%';
      if (metricValues[2]) metricValues[2].textContent = formatWindKmh(data.current.wind_speed_10m);
      if (metricValues[3]) metricValues[3].textContent = formatPrecipMm(Number(data.current.precipitation || 0));

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

    // Hourly temps (first 8 displayed)
    if (data.hourly && data.hourly.temperature_2m) {
      const temps = data.hourly.temperature_2m;
      const hourEls = document.querySelectorAll('.hourly-item__temp');
      hourEls.forEach((el, idx) => {
        if (typeof temps[idx] !== 'undefined') el.textContent = formatTemperatureC(temps[idx]);
      });
    }
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
    } else {
      appState.units = { temperature: 'fahrenheit', wind: 'mph', precipitation: 'in' };
      switchBtn.textContent = 'Switch to Metric';
      isMetric = false;
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
      renderAll();
    });
  });

  // Initial visual state update
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
      
      // Remove selected class from all options
      dayOptions.forEach(opt => opt.classList.remove('selected'));
      
      // Add selected class to clicked option
      this.classList.add('selected');
      
      // Update button text
      const selectedDay = this.querySelector('span').textContent;
      const buttonText = daySelector.childNodes[0];
      buttonText.textContent = selectedDay + ' ';
      
      // Close dropdown
      dayDropdown.setAttribute('hidden', '');
      daySelector.setAttribute('aria-expanded', 'false');
    });
  });

  // Close day dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!daySelector.contains(e.target) && !dayDropdown.contains(e.target)) {
      dayDropdown.setAttribute('hidden', '');
      daySelector.setAttribute('aria-expanded', 'false');
    }
  });

  // Set initial selected state
  dayOptions[1].classList.add('selected'); // Tuesday is initially selected

  // Search dropdown functionality
  const searchInput = document.querySelector('.search-form__input');
  const searchDropdown = document.querySelector('.search-dropdown');
  const searchOptions = document.querySelectorAll('.search-dropdown__option');
  
  // Open-Meteo Geocoding endpoint
  const GEOCODE_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';
  const FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

  let currentHighlight = -1;

  // Show dropdown when input is focused and has value
  searchInput.addEventListener('focus', function() {
    if (searchInput.value.length > 0) {
      filterAndShowResults(searchInput.value);
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
    }
    
    currentHighlight = -1;
  });

  // Handle keyboard navigation
  searchInput.addEventListener('keydown', function(e) {
    const visibleOptions = searchDropdown.querySelectorAll('.search-dropdown__option:not([style*="display: none"])');
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      currentHighlight = Math.min(currentHighlight + 1, visibleOptions.length - 1);
      updateHighlight(visibleOptions);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      currentHighlight = Math.max(currentHighlight - 1, -1);
      updateHighlight(visibleOptions);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentHighlight >= 0 && visibleOptions[currentHighlight]) {
        selectCity(visibleOptions[currentHighlight].textContent);
      }
    } else if (e.key === 'Escape') {
      searchDropdown.setAttribute('hidden', '');
      currentHighlight = -1;
    }
  });

  // Handle city selection
  searchOptions.forEach(option => {
    option.addEventListener('click', function() {
      selectCity(this.textContent);
    });
  });

  async function fetchAndShowResults(query) {
    try {
      const url = `${GEOCODE_ENDPOINT}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
      const res = await fetch(url);
      const data = await res.json();
      const results = (data && data.results) ? data.results : [];

      const content = searchDropdown.querySelector('.search-dropdown__content');
      content.innerHTML = '';

      results.forEach(place => {
        const displayName = `${place.name}${place.admin1 ? ', ' + place.admin1 : ''}${place.country ? ', ' + place.country : ''}`;
        const option = document.createElement('div');
        option.className = 'search-dropdown__option';
        option.innerHTML = `<span>${displayName}</span>`;
        option.addEventListener('click', function() {
          selectCity(displayName, place.latitude, place.longitude);
        });
        content.appendChild(option);
      });

      if (results.length > 0) {
        searchDropdown.removeAttribute('hidden');
      } else {
        searchDropdown.setAttribute('hidden', '');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      searchDropdown.setAttribute('hidden', '');
    }
  }

  function updateHighlight(options) {
    options.forEach((option, index) => {
      option.classList.toggle('highlighted', index === currentHighlight);
    });
  }

  async function selectCity(cityName, lat, lon) {
    searchInput.value = cityName;
    searchDropdown.setAttribute('hidden', '');
    currentHighlight = -1;
    
    // Update the weather location
    const locationElement = document.querySelector('.today-card__location');
    if (locationElement) {
      locationElement.textContent = cityName;
    }

    // Fetch weather from Open-Meteo
    await fetchAndRenderWeather(lat, lon);
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
      searchDropdown.setAttribute('hidden', '');
      currentHighlight = -1;
    }
  });

  async function fetchAndRenderWeather(latitude, longitude) {
    try {
      // Request both current and daily/hourly summary
      const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        current: ['temperature_2m','relative_humidity_2m','precipitation','wind_speed_10m','apparent_temperature','weather_code'].join(','),
        hourly: ['temperature_2m'].join(','),
        daily: ['temperature_2m_max','temperature_2m_min','precipitation_sum','wind_speed_10m_max'].join(','),
        timezone: 'auto'
      });

      const url = `${FORECAST_ENDPOINT}?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();

      // Save canonical metric data and render
      appState.metricData = data;
      renderAll();
    } catch (err) {
      console.error('Forecast error:', err);
    }
  }
});
