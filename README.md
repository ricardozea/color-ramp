# Color Ramp

<style>
  .readme-hero {
    display: block;
    padding: 20px;
    border-radius: 10px;
    background: #001121;
    text-align: center;
  }

  .readme-hero img {
    max-width: 300px;
    width: 100%;
    height: auto;
  }

  .readme-hero p {
    font-size: 18px;
    color: #edf6ff;
    margin-bottom: 0;
  }
  .color-highlight {
    font-weight: bolder;
    font-size: 24px;
    background: linear-gradient(to right, #b600b9, #04da00, #006dd3);
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
</style>

<div class="readme-hero">
  <a href="https://color-ramp.com" target="_blank" rel="noreferrer">
    <img src="images/logo-color-ramp-full.svg" alt="Color Ramp logo" />
  </a>
  <p>Create accessible <span class="color-highlight">color ramps</span> in less than 5 seconds, no BS.</p>
</div>

## Project Website

[https://color-ramp.com](https://color-ramp.com)

## Why Color-Ramp?

I needed to create a simple color ramp with fully accessible colors for a project. And I also needed to create a color ramp, in Dark mode. I used all kinds of online tools and Figma plugins. I got it done but not after spending a ridiculous amount of time. And that's putting it mildly.

So I decided to create my own tool. Color Ramp was born.

We are now able to create fully accessible color ramps in less than 5 seconds, no BS. And then export those ramps into Figma with the [Color Ramp Figma plugin](https://www.figma.com/community/plugin/1523173886699098356/color-ramp).

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