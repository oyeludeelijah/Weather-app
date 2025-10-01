# Frontend Mentor - Weather app solution

This is my take on the [Weather app challenge on Frontend Mentor](https://www.frontendmentor.io/challenges/weather-app-K1FhddVm49). Spoiler alert: I may have gotten a little carried away with the unit conversion system. But hey, now you can switch between Celsius and Fahrenheit faster than the weather changes in spring! 🌦️

## Table of contents

- [Overview](#overview)
  - [The challenge](#the-challenge)
  - [Screenshot](#screenshot)
  - [Links](#links)
- [Getting started](#getting-started)
- [My process](#my-process)
  - [Built with](#built-with)
  - [What I learned](#what-i-learned)
  - [Continued development](#continued-development)
  - [Useful resources](#useful-resources)
- [Author](#author)
- [Acknowledgments](#acknowledgments)

## Overview

### The challenge

Users should be able to:

- Search for weather information by entering a location in the search bar
- View current weather conditions including temperature, weather icon, and location details
- See additional weather metrics like "feels like" temperature, humidity percentage, wind speed, and precipitation amounts
- Browse a 7-day weather forecast with daily high/low temperatures and weather icons
- View an hourly forecast showing temperature changes throughout the day
- Switch between different days of the week using the day selector in the hourly forecast section
- Toggle between Imperial and Metric measurement units via the units dropdown 
- Switch between specific temperature units (Celsius and Fahrenheit) and measurement units for wind speed (km/h and mph) and precipitation (millimeters) via the units dropdown
- View the optimal layout for the interface depending on their device's screen size
- See hover and focus states for all interactive elements on the page

### Screenshot

![Design preview](./Screenshot%20(106).png)

### Links

- Solution URL: [Solution link here](https://github.com/oyeludeelijah/Weather-app.git)
- Live Site URL: [live site here](https://weather-app-mu-rose.vercel.app/)

## Getting started

No build process, no npm install hell, no "it works on my machine" excuses. Just good old-fashioned HTML, CSS, and JavaScript.

**To run it:**
- Double-click `index.html` like it's 2005 (and it'll work just fine!)
- Or if you're fancy: use VS Code Live Server or `npx serve`

**No API keys needed!** 🎉  
I'm using the completely free [Open-Meteo APIs](https://open-meteo.com/). Those folks are absolute legends for providing free weather data without making you sell your soul (or email) first.

## My process

**Fair warning:** This entire project was vibe-coded with Cursor AI. I basically had a conversation with my AI coding buddy and we built this thing together. Is that cheating? Maybe. Do I care? Not really. The future is now, old man. 🤖

### Built with

**The classics:**
- Semantic HTML5 (with ARIA roles because accessibility matters!)
- CSS custom properties, Flexbox, and Grid (the holy trinity)
- Mobile-first workflow (because let's be real, everyone checks the weather on their phone)

**Vanilla JavaScript** (no frameworks were harmed in the making of this app):
- Fetch API + AbortController (so your rapid typing doesn't crash the geocoding API)
- Geolocation API (for when you're too lazy to type your city name)
- localStorage (remembers your preferences like that one friend who remembers your coffee order)
- Intl.DateTimeFormat (because dates are hard and I'm not writing my own formatter)

**APIs:**
- Open-Meteo Geocoding API (finds your city)
- Open-Meteo Forecast API (tells you if you need an umbrella)

### What I learned

**Things Cursor and I figured out together:**
- If you keep converting temperature values back and forth between Celsius and Fahrenheit by reading them from the DOM, you'll end up with numbers that make absolutely no sense. Solution? Keep a "canonical state" in metric and convert on render. Cursor explained this to me three times before it clicked. 🤯

- `AbortController` is a lifesaver when users type faster than your API can respond. Without it, you get a beautiful race condition where "New York" shows weather for "New" instead. I discovered this bug, Cursor fixed it, and we both pretended it never happened.

- ARIA roles aren't just fancy attributes to make your HTML look smart. Turns out screen reader users actually need them! I asked Cursor to "make it accessible" and it taught me a whole masterclass on WAI-ARIA patterns. Best. Pair. Programming. Partner.

- Weather codes from Open-Meteo are just numbers (like 0, 45, 95). Mapping those to actual icons? That's where Cursor pulled out the weather code documentation faster than I could Google it. Pro tip we learned: 95 = thunderstorm, not a sunny day. ⛈️

**Real talk:** Pair programming with AI is wild. It's like having a senior dev who never gets tired, never judges your silly questions, and is always down to refactor at 3 AM. 10/10 would recommend.

```js
// This tiny function saved me from so much pain:
function formatTemperatureC(valueC) {
  return units.temperature === 'fahrenheit' 
    ? celsiusToFahrenheit(valueC) + '°' 
    : Math.round(valueC) + '°';
}
```

### Continued development

**Things I'll probably add when I have time (read: never):**
- Full WAI-ARIA keyboard navigation that would make accessibility experts weep tears of joy
- Fancy loading skeletons instead of just showing "..." (I know, I know, it's basic)
- A full 24-hour hourly view because apparently 8 hours isn't enough for some people
- Precipitation and wind overlays (for the weather nerds out there)
- Maybe a "surprise me" button that shows weather for a random city? Because why not.

### Useful resources

**Lifesavers:**
- [Open-Meteo Docs](https://open-meteo.com/en/docs) - Seriously well-documented API. No authentication BS. Just clean, free weather data. 10/10 would recommend.
- [MDN AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) - Taught me how to stop being a terrible person who floods APIs with requests.
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) - The bible for making custom components accessible. Heavy reading but worth it.
- [MDN Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) - Because I refuse to write another date formatter from scratch. Never again.

## Acknowledgments

Shoutout to [Frontend Mentor](https://www.frontendmentor.io/) for consistently providing challenges that make me question my life choices at 2 AM. 

Big thanks to the [Open-Meteo](https://open-meteo.com/) team for giving us free weather APIs without the usual "sign up for our enterprise plan" nonsense. You're the real MVPs.

Massive props to [Cursor](https://cursor.com/) for being the AI coding assistant that made this possible. We vibed, we coded, we shipped. This is what pair programming looks like in 2025. 🤝🤖

And finally, thanks to coffee ☕ for keeping me conscious during those "just one more feature" sessions. 