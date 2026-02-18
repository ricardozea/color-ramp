# Color Ramp

<p align="center">
  <a href="https://color-ramp.com" target="_blank" rel="noreferrer">
    <img src="images/logo-color-ramp.svg" alt="Color Ramp logo" width="180" />
  </a>
</p>

## Description

Color Ramp is a web-based tool for generating harmonious, accessible color ramps from a single base color. It follows the Tailwind-style 11-shade scale (50–950) and ensures the generated colors meet WCAG contrast requirements against an appropriate text color (black or white).

It’s built for designers and developers who want to explore color in context, iterate quickly, and export ramps that are ready to use in real UI systems.

## Features

*   **Multiple color spaces:** Generate ramps in OKLCH (perceptually uniform) and HSL.
*   **Single color input:** Accepts HEX, RGB, HSL, OKLCH, and common color names.
*   **Tailwind-style ramps:** Generates an 11-shade scale (50, 100, …, 900, 950) for both Light and Dark contexts.
*   **Accessibility-first output:**
    *   **WCAG badges:** Each shade shows AA/AAA status and its contrast ratio.
    *   **Guaranteed minimum contrast:** Colors are clipped to sRGB gamut and adjusted to meet at least 4.5:1 where required.
    *   **Accessibility banner:** When a shade can’t meet requirements, the UI surfaces a visible banner and routes users to the main contact form.
*   **Default Ramp Mode toggle:** Switch how ramps are shaped (light-theme vs dark-theme profiles), with theming that stays readable even for extreme colors (pure black/white).
*   **Fast copy workflow:**
    *   **Click-to-copy values:** Copy HEX (and other displayed formats) directly from the ramp.
    *   **Reliable tooltips:** “Base Color” and “Copied!” tooltips behave consistently across pages.
    *   **Global toasts:** Success/info toasts confirm actions like copying, adding, and deleting.
*   **Collections:**
    *   **Save ramps:** Store generated ramps into named collections.
    *   **Persistent storage:** Collections are saved in browser local storage.
    *   **Inline editing:** Rename collections and tokens in-context.
    *   **Drag & drop ordering:** Reorder tokens, including moving into empty collections.
    *   **Metadata & sorting:** Collections show timestamps and render newest-first.
*   **Export for Figma:**
    *   **Paired + themed formats:** Export JSON structures compatible with the Color Ramp Figma plugin.
    *   **Ordered scales + base marker:** Exports preserve scale order and mark the base shade with an asterisk (`*`).
    *   **Sensible defaults:** “Paired” is the default export format.
*   **Polished modal UX:** Modals support ESC to close, improved spacing/scrolling, and better focus behavior.
*   **Interactive animated background:** A GPU-accelerated particle animation (Three.js/WebGL) that reacts to mouse movement and derives its palette from the generated ramp.

## Core Technologies & Libraries

*   **HTML5:** For the basic structure of the application.
*   **CSS3:** For styling the application. All styles are custom-written.
*   **JavaScript (ES6+):** For all the client-side application logic, including color manipulation, ramp generation, UI updates, and event handling.
*   **Color.js:** A modern, powerful color science library (loaded via CDN as an ES Module) used for all color parsing, manipulation, and contrast calculations. It enables the use of the OKLCH color space, which provides perceptually uniform color ramps.
*   **Three.js:** A 3D graphics library (loaded via CDN) used to create the interactive animated background.

## Key Accessibility Considerations

*   **Contrast Ratios:** The primary goal is to generate colors that meet WCAG AA (4.5:1) or AAA (7:1) contrast ratios where appropriate. The tool dynamically determines if black or white text should be used for each shade and adjusts the shade to meet at least 4.5:1 against that text.

*   **Visual Cues:** Clear visual distinctions are made for active states, hover states, and badges.

## Project Structure

```
Color Ramp/
├── index.html          # Homepage / entry point
├── index-oklch.html    # OKLCH generator
├── index-hsl.html      # HSL generator
├── js/                 # Application logic
│   ├── color-ramp-oklch.js
│   ├── color-ramp-hsl.js
│   ├── footer-loader.js
│   └── features.js
├── css/
│   ├── styles-v1.css
│   ├── styles-v2.css
│   └── collections.css
├── footer.html         # Shared footer + Contact Me modal
└── README.md
```

This project is built with a strong focus on practical accessibility, fast iteration, and export-ready output for real design systems.
