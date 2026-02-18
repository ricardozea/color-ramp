import Color from "https://cdn.jsdelivr.net/npm/colorjs.io/dist/color.js";
// Module version marker for cache-busting verification
try { window.__OKLCH_MODULE_VERSION__ = '1.2.0'; } catch(e) {}
/* Color Ramp - using Color.js for OKLCH color space
   Author: Ricardo Zea - Sr. Web/Product Designer
   https://ricardozea.design
   Originally created on: 6/23/2025
*/

// ---- Constants ----
const SCALES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

// One-time animation flag for swatches on initial page load
let hasAnimatedSwatches = false;

function getAccessibleColor(bgColor) {
  let color = new Color(bgColor);
  const white = new Color('white');
  const black = new Color('black');
  let ratio = color.contrast(white, 'WCAG21');
  return ratio >= 4.5 ? 'white' : 'black';
}

// ---- Helpers ----
function wcagRatio(c1, c2) {
  const ratio = c1.contrast(c2, 'WCAG21');
  // Truncate to two decimal places to match WebAIM's methodology
  return Math.floor(ratio * 100) / 100;
}

function ensureAccessible(bgRaw) {
    // CRITICAL FIX: First, clip the raw color to the sRGB gamut.
    // All subsequent calculations MUST use this "safe" color.
    let bg = bgRaw.to('srgb');

    const black = new Color("#0D0D0D");
    const white = new Color("#FFFFFF");

    // Determine the best text color and initial ratio against the safe color.
    let ratioBlack = wcagRatio(bg, black);
    let ratioWhite = wcagRatio(bg, white);
    let text = ratioBlack >= ratioWhite ? black : white;
    let ratio = Math.max(ratioBlack, ratioWhite);

    // If it fails, nudge the safe color's lightness until it passes.
    if (ratio < 4.5) {
        const oklch = bg.to("oklch");
        const targetL = text.equals(black) ? 1 : 0; // if black text is better, move bg towards white, else towards black.

        for (let i = 0; i < 20 && ratio < 4.5; i++) {
            oklch.l += (targetL - oklch.l) * 0.1; // Nudge 10%

            // Create the new nudged color
            let nudgedBg = new Color("oklch", [oklch.l, oklch.c, oklch.h]);

            // IMPORTANT: Clip the *nudged* color as well before re-calculating!
            bg = nudgedBg.to('srgb');

            // Re-evaluate both text colors against the new safe color
            ratioBlack = wcagRatio(bg, black);
            ratioWhite = wcagRatio(bg, white);

            if (ratioBlack >= ratioWhite) {
                text = black;
                ratio = ratioBlack;
            } else {
                text = white;
                ratio = ratioWhite;
            }
        }
    }
    return { bg, text, ratio };
}

function hex(color){return color && typeof color.toString === 'function' ? color.toString({format:'hex'}) : '#000000';}

// Generate a dynamic, perceptually uniform ramp.
function generateRamp(baseColor, isLightRamp, isDefaultRamp, vibrancyBoost) {
  const ramp = {};
  const oklch = baseColor.to('oklch');
  const hue = oklch.h;
  const originalChroma = oklch.c;
  const baseLightness = oklch.l;

  // For bias between start and end colors
  let startEndBias = 0;

  // Calculate boosted chroma for ramp generation (but not for base color)
  let rampChroma = originalChroma;

  // For grayscale colors, force chroma to 0.
  if (originalChroma < 0.01) {
    rampChroma = 0;
  } else {
    // Use the passed vibrancyBoost if available, otherwise get it from the UI.
    const boostValue = vibrancyBoost !== undefined ? parseInt(vibrancyBoost, 10) : parseInt(document.getElementById('vibrancy-boost-select').value, 10);
    if (boostValue > 0) {
        // Get hue angle in 0-360 range
        const normalizedHue = ((hue % 360) + 360) % 360;

        // Apply smart chroma boost with hue-specific compression
        // Purple hues (260-330) get more compression to avoid sRGB clipping
        let compressionFactor = 1.0;
        if (normalizedHue >= 260 && normalizedHue <= 330) {
          // More compression for purples (0.8-0.9)
          compressionFactor = 0.85;
        } else if ((normalizedHue >= 0 && normalizedHue <= 30) || (normalizedHue >= 330 && normalizedHue <= 360)) {
          // Less compression for reds (0.9-0.95)
          compressionFactor = 0.95;
        }

        // Calculate boosted chroma with compression
        rampChroma = originalChroma * (1 + (boostValue / 100) * compressionFactor);

        // Add slight bias between start and end colors for more visible mid-ramp change
        const biasAmount = 0.05 * (boostValue / 100); // 5% bias at 100% boost
        startEndBias = biasAmount;
    }
  }

  const L_start = isLightRamp ? 0.99 : 0.15;
  const L_end = isLightRamp ? 0.15 : 0.99;

  // Initial colors without bias
  let startColor = new Color('oklch', [L_start, rampChroma, hue]);
  let endColor = new Color('oklch', [L_end, rampChroma, hue]);

  let anchorScale;

  if (isDefaultRamp) {
    // --- Anchored Ramp Generation (for default ramp) ---
    const lightnessRange = Math.abs(L_start - L_end);
    const progress = Math.abs(baseLightness - L_start) / lightnessRange;
    let anchorIndex = Math.round(progress * (SCALES.length - 1));
    // Clamp to valid range to avoid off-by-one issues
    anchorIndex = Math.max(0, Math.min(SCALES.length - 1, anchorIndex));
    anchorScale = SCALES[anchorIndex];

    // Apply bias to start/end colors for more visible mid-ramp change if needed
    if (startEndBias > 0) {
      const startChroma = rampChroma * (1 - startEndBias);
      const endChroma = rampChroma * (1 + startEndBias);
      startColor = new Color('oklch', [L_start, startChroma, hue]);
      endColor = new Color('oklch', [L_end, endChroma, hue]);
    }

    // Generate the ramp using boosted chroma for surrounding colors
    const rampBaseColor = new Color('oklch', [baseLightness, rampChroma, hue]);

    const lighterShades = startColor.steps(rampBaseColor, {
      steps: anchorIndex + 1,
      space: 'oklch',
      output: 'srgb'
    });
    const darkerShades = rampBaseColor.steps(endColor, {
      steps: (SCALES.length - 1) - anchorIndex + 1,
      space: 'oklch',
      output: 'srgb'
    });

    const rampColors = lighterShades.slice(0, -1).concat(darkerShades);

    if (rampColors.length !== SCALES.length) {
      console.error(`Ramp generation failed. Expected 11 colors, got ${rampColors.length}. Falling back to simple ramp.`);
      const simpleRamp = startColor.steps(endColor, { steps: SCALES.length, space: 'oklch', output: 'srgb' });
      SCALES.forEach((scale, i) => { ramp[scale] = simpleRamp[i]; });
    } else {
      SCALES.forEach((scale, i) => { ramp[scale] = rampColors[i]; });
    }

    // Ensure continuity: use the interpolated color at the anchor index
    ramp[anchorScale] = rampColors[anchorIndex];
  } else {
    // --- Simple Ramp Generation (for non-default ramp) ---
    // Apply bias to start/end colors for more visible mid-ramp change if needed
    if (startEndBias > 0) {
      const startChroma = rampChroma * (1 - startEndBias);
      const endChroma = rampChroma * (1 + startEndBias);
      startColor = new Color('oklch', [L_start, startChroma, hue]);
      endColor = new Color('oklch', [L_end, endChroma, hue]);
    }

    // Create a simple ramp from start to end
    const allShades = startColor.steps(endColor, {
      steps: SCALES.length,
      space: 'oklch',
      output: 'srgb'
    });
    SCALES.forEach((scale, i) => { ramp[scale] = allShades[i]; });

    // Find closest scale for the 'base' indicator (no injection on secondary ramp)
    let minDiff = Infinity;
    Object.keys(ramp).forEach(scale => {
      const rampLightness = ramp[scale].to('oklch').l;
      const diff = Math.abs(rampLightness - baseLightness);
      if (diff < minDiff) {
        minDiff = diff;
        anchorScale = scale;
      }
    });
    // Do NOT inject any base color here. The secondary ramp should only
    // highlight the closest existing swatch via anchorScale.
  }

  return { ramp, anchorScale };
}

function updateRampUI(rampId, ramp, anchorScale) {
  const rampElement = document.getElementById(rampId);
  rampElement.innerHTML = ''; // Clear previous ramp

  // Dynamically style the 'Add to Collection' button with the dark ramp colors
  if (rampId === 'darkRamp') {
    const addButton = document.getElementById('add-color-shortcut-btn');
    if (addButton && ramp['50'] && ramp['900']) {
      const bgColor = new Color(ramp['50'].bg).toString({format: 'hex'});
      const textColor = new Color(ramp['900'].bg).toString({format: 'hex'});

      addButton.style.backgroundColor = bgColor;
      addButton.style.color = textColor;
    }
  }

  // Sort scales numerically for consistent ordering
  const sortedScales = [...SCALES].sort((a, b) => a - b);

  // Base offset so that dark ramp continues stagger after light ramp
  const baseOffset = rampId === 'darkRamp' ? SCALES.length : 0;

  sortedScales.forEach((scale, idx) => {
    const swatch = document.createElement('div');
    swatch.className = 'swatch';

    const box = document.createElement('div');
    box.className = 'color-box';
    if (scale == anchorScale) {
      box.classList.add('base-swatch');
      swatch.title = 'Base color';
    }

    // Check if this scale exists in the ramp
    if (!ramp[scale]) {
      console.warn(`Scale ${scale} not found in ${rampId}`);
      return;
    }

    const { bg, text, ratio } = ramp[scale];
    const bgHex = hex(bg);
    const txtColor = hex(text);
    const badge = ratio >= 7 ? 'AAA' : (ratio >= 4.5 ? 'AA' : 'Fail');
    const oklch = bg.to('oklch');
    const hueDisplay = (oklch.h === null || isNaN(oklch.h)) ? '0' : oklch.h.toFixed(1);
    const oklchDisplay = `L:${(oklch.l * 100).toFixed(0)} C:${oklch.c.toFixed(3)} H:${hueDisplay}`;
    const oklchCopy = oklch.toString({ format: 'oklch' });

    box.style.backgroundColor = bgHex;
    box.setAttribute('data-scale', scale);
    box.style.color = txtColor;

    box.innerHTML = `
      <div class="tailwind-scale">${scale}</div>
      <a href="#" role="button" class="color-value color-hex" title="Click to copy HEX">${bgHex}</a>
      <div class="oklch-container">
        <span class="oklch-label">OKLCH</span>
        <a href="#" role="button" class="color-value color-oklch" title="Click to copy OKLCH">
          ${oklchDisplay}
        </a>
      </div>
      <div class="contrast"><span title="Contrast Ratio">${ratio.toFixed(2)} : 1</span> <span class="accessibility-badge ${badge.toLowerCase()}">${badge}</span></div>
    `;

    const hexLink = box.querySelector('.color-hex');
    hexLink.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      navigator.clipboard.writeText(bgHex);
      showToast('🗸 Copied HEX!', e.currentTarget);
    });

    const oklchLink = box.querySelector('.color-oklch');
    oklchLink.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      navigator.clipboard.writeText(oklchCopy);
      showToast('🗸 Copied OKLCH!', e.currentTarget);
    });

    swatch.appendChild(box);
    rampElement.appendChild(swatch);

    // Apply one-time, staggered load animation AFTER insertion to ensure it triggers
    if (!hasAnimatedSwatches) {
      // Force reflow to reset animation start point
      void box.offsetWidth; // reads layout
      // Next frame, add class and delay for a visible start
      requestAnimationFrame(() => {
        box.style.animationDelay = `${(baseOffset + idx) * 20}ms`;
        box.classList.add('animate-in');

        box.addEventListener('animationend', () => {
          box.classList.remove('animate-in');
          box.style.animationDelay = '';
        }, { once: true });
      });
    }
  });
}

function showToast(message, targetElement) {
  if (!targetElement) return;

  // Use the existing tooltip system instead of creating a separate toast
  // Store the original title temporarily
  const originalTitle = targetElement.getAttribute('title');
  const originalDataTooltip = targetElement.getAttribute('data-tooltip');

  // Set the message as the tooltip
  targetElement.setAttribute('title', message);

  // Add copied class if this is a copied message
  if (message.includes('Copied')) {
    // Trigger the tooltip to show
    const event = new MouseEvent('mouseover', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    targetElement.dispatchEvent(event);

    // Add the copied class to the tooltip after it's created
    setTimeout(() => {
      const tooltip = document.querySelector('.tooltip.visible');
      if (tooltip) {
        tooltip.classList.add('copied-value-tooltip');
      }
    }, 10);
  } else {
    // Trigger the tooltip to show for non-copied messages
    const event = new MouseEvent('mouseover', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    targetElement.dispatchEvent(event);
  }

  // Hide the tooltip after a delay and restore original title
  setTimeout(() => {
    // Trigger mouseout to hide tooltip
    const hideEvent = new MouseEvent('mouseout', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    targetElement.dispatchEvent(hideEvent);

    // Remove the copied class from tooltip
    const tooltip = document.querySelector('.copied-value-tooltip');
    if (tooltip) {
      tooltip.classList.remove('copied-value-tooltip');
    }

    // Restore original title
    if (originalDataTooltip) {
      targetElement.setAttribute('title', originalDataTooltip);
    } else if (originalTitle) {
      targetElement.setAttribute('title', originalTitle);
    } else {
      targetElement.removeAttribute('title');
    }
  }, 1200);
}

function processRamp(ramp, existingHexes) {
  const processed = {};
  const localHexes = new Set(existingHexes);

  SCALES.forEach(scale => {
    let originalColor = ramp[scale];
    // Guard: if a scale is missing, backfill with nearest defined color to avoid crashes
    if (!originalColor) {
      const idx = SCALES.indexOf(scale);
      let nearest;
      for (let i = idx - 1; i >= 0 && !nearest; i--) {
        if (ramp[SCALES[i]]) nearest = ramp[SCALES[i]];
      }
      for (let i = idx + 1; i < SCALES.length && !nearest; i++) {
        if (ramp[SCALES[i]]) nearest = ramp[SCALES[i]];
      }
      if (nearest) {
        originalColor = nearest;
      } else {
        // Absolute fallback: mid-gray to ensure structure remains intact
        try { console.warn('[processRamp] Missing all references for scale', scale); } catch(e){}
        originalColor = new Color('#808080');
      }
    }
    let processedResult = ensureAccessible(originalColor);

    // De-duplicate by nudging the original color and re-processing
    while (localHexes.has(hex(processedResult.bg))) {
      const oklch = originalColor.to('oklch');
      oklch.l = Math.min(0.995, oklch.l + 0.005); // Nudge lightness slightly
      originalColor = new Color('oklch', [oklch.l, oklch.c, oklch.h]);
      processedResult = ensureAccessible(originalColor);
    }

    processed[scale] = processedResult;
    localHexes.add(hex(processedResult.bg));
  });

  return { processedRamp: processed, allHexes: localHexes };
}

function updateDynamicTextColor(textColor) {
  document.body.style.setProperty('--dynamic-color', textColor);
  const dynamicElements = document.querySelectorAll('.dynamic-color-text');
  dynamicElements.forEach(el => {
    // Ensure the element is not an SVG path to avoid fill/stroke issues
    if (el.tagName.toLowerCase() !== 'path') {
      el.style.color = textColor;
      el.style.transition = 'color 0.5s ease';
    }
  });
}

/**
 * Parses a string to see if it's a simplified RGB value (e.g., "255, 100, 50" or "255 100 50").
 * If so, it formats it into a standard "rgb(r, g, b)" string.
 * @param {string} input - The input string to parse.
 * @returns {string} - The formatted RGB string or the original input if it's not a simplified RGB value.
 */
function parseRgbInput(input) {
  const trimmedInput = input.trim();

  // Check for hex patterns first and return as-is since they're handled elsewhere
  if (/^#?[0-9a-fA-F]{3,6}$/.test(trimmedInput)) {
    return input;
  }

  // If it contains characters that are not digits, spaces, or commas, it's not a simple RGB value.
  if (/[^0-9\s,]/.test(trimmedInput)) {
    return input;
  }

  // Split by space or comma and filter out empty strings.
  const parts = trimmedInput.split(/[\s,]+/).filter(p => p.length > 0);

  if (parts.length === 0 || parts.length > 3) {
    return input; // Not a valid number of parts for RGB.
  }

  // Convert parts to numbers, clamp them to the 0-255 range.
  const numbers = parts.map(p => {
    const num = parseInt(p, 10);
    if (isNaN(num)) return NaN; // Mark as invalid if not a number
    return Math.max(0, Math.min(255, num));
  });

  // If any part was not a valid number, return original input.
  if (numbers.some(isNaN)) {
    return input;
  }

  let [r, g, b] = numbers;

  // Set default values for missing parts
  if (g === undefined) g = 255;
  if (b === undefined) b = 255;

  return `rgb(${r}, ${g}, ${b})`;
}

function updateAll() {
  const input = document.getElementById('colorInput');
  const preview = document.getElementById('colorPreview');
  let colorValue = input.value;

  // If input is empty, default to black
  if (!colorValue || colorValue.trim() === '') {
    colorValue = 'black';
  } else {
    // Pre-process input to be more forgiving
    colorValue = colorValue.trim();

    // Check for 6-digit hex without #
    if (/^[0-9a-fA-F]{6}$/.test(colorValue)) {
      colorValue = '#' + colorValue;
    }
    // Check for 3-digit hex without #
    else if (/^[0-9a-fA-F]{3}$/.test(colorValue)) {
      // Convert 3-digit hex to 6-digit
      colorValue = '#' + colorValue.split('').map(c => c + c).join('');
    }
    // For flexible RGB formats like '255, 10, 20' or '255 10 20'.
    else if (/^(\d{1,3}(,\s*|\s+)){2}\d{1,3}$/.test(colorValue)) {
      colorValue = `rgb(${colorValue})`;
    }
    // Only use parseRgbInput if it doesn't look like a hex value
    else if (!/^#?[0-9a-fA-F]{3,6}$/.test(colorValue)) {
      colorValue = parseRgbInput(colorValue);
    }
  }

  let color;
  try {
    color = new Color(colorValue);
    preview.style.backgroundColor = color.toString({ format: 'hex' });
    input.classList.remove('error');
  } catch (e) {
    preview.style.backgroundColor = 'transparent';
    input.classList.add('error');
    return; // Invalid color
  }

  // --- State Persistence: localStorage & URL ---
  const hex = color.toString({ format: 'hex' });
  const hexValue = hex.replace('#', '');

  // 1. Save all settings to localStorage
  localStorage.setItem('lastUsedColor_oklch', hex);

  // Read vibrancy from the select control (primary source of truth)
  const boostValue = (document.getElementById('vibrancy-boost-select')?.value) || '0';
  localStorage.setItem('lastVibrancyBoost_oklch', boostValue);

  const rampToggle = document.getElementById('defaultRampToggle');
  const rampMode = rampToggle.checked ? 'dark' : 'light';
  localStorage.setItem('defaultRampMode_oklch', rampMode);

  // 2. Update URL with all parameters for sharing
  const url = new URL(window.location);
  url.searchParams.set('color', hexValue);
  url.searchParams.set('vibrancy', boostValue);
  url.searchParams.set('default-ramp', rampMode);

  // Use replaceState to avoid polluting browser history
  window.history.replaceState({ path: url.href }, '', url.href);

  // --- Vibrancy Boost Disabling Logic ---
  const oklch = color.to('oklch');
  const isGrayscale = oklch.c < 0.01;
  const vibrancySelect = document.getElementById('vibrancy-boost-select');
  const vibrancyContainer = document.querySelector('.vibrancy-boost-container');

  if (vibrancySelect) {
    if (isGrayscale) {
      // If grayscale, disable boost, reset to 0, and add tooltip.
      vibrancySelect.disabled = true;
      vibrancySelect.value = '0';
      if (vibrancyContainer) {
        vibrancyContainer.classList.add('disabled');
        vibrancyContainer.title = 'Vibrancy Boost is disabled for grayscale colors.';
      }
    } else {
      // If not grayscale, re-enable boost and remove tooltip.
      vibrancySelect.disabled = false;
      if (vibrancyContainer) {
        vibrancyContainer.classList.remove('disabled');
        vibrancyContainer.title = '';
      }
    }
  }

  const isDarkDefault = document.getElementById('defaultRampToggle').checked;

  // Generate the two ramps: one for light mode, one for dark mode.
  const effectiveBoost = (typeof vibrancySelect !== 'undefined' && vibrancySelect && typeof vibrancySelect.value !== 'undefined')
    ? vibrancySelect.value
    : boostValue;
  const { ramp: lightRamp, anchorScale: lightAnchor } = generateRamp(color, true, !isDarkDefault, effectiveBoost);
  const { ramp: darkRamp, anchorScale: darkAnchor } = generateRamp(color, false, isDarkDefault, effectiveBoost);

  // Process ramps for accessibility and de-duplication
  const { processedRamp: processedLightRamp, allHexes: lightHexes } = processRamp(lightRamp, new Set());
  const { processedRamp: processedDarkRamp } = processRamp(darkRamp, lightHexes);

  // Do not re-inject raw base color; keep anchor swatch from generated ramp for uniformity under vibrancy.

  // Render ramps
  updateRampUI('lightRamp', processedLightRamp, lightAnchor);
  updateRampUI('darkRamp', processedDarkRamp, darkAnchor);

  // After first render, disable further load animations
  if (!hasAnimatedSwatches) {
    hasAnimatedSwatches = true;
  }

  // 6. Update dynamic UI colors
  const root = document.documentElement.style;

  // Check if all required colors are available to prevent errors
  const canUpdateDynamicColors =
    processedLightRamp['100'] && processedLightRamp['200'] && processedLightRamp['300'] && processedLightRamp['600'] &&
    processedDarkRamp['50'] && processedDarkRamp['100'] && processedDarkRamp['300'] && processedDarkRamp['700'] && processedDarkRamp['800'] && processedDarkRamp['900'];

  if (canUpdateDynamicColors) {
    const dark400 = processedDarkRamp['400'].bg.toString({ format: 'hex' });
    root.setProperty('--boost-box-active-bg', dark400);

    const light200 = processedLightRamp['200'].bg.toString({ format: 'hex' });
    const light300 = processedLightRamp['300'].bg.toString({ format: 'hex' });
    const dark100 = processedDarkRamp['100'].bg.toString({ format: 'hex' });
    const dark300 = processedDarkRamp['300'].bg.toString({ format: 'hex' });
    const dark700 = processedDarkRamp['700'].bg.toString({ format: 'hex' });
    const dark800 = processedDarkRamp['800'].bg.toString({ format: 'hex' });
    const dark900 = processedDarkRamp['900'].bg.toString({ format: 'hex' });
    const dark950 = processedDarkRamp['950'].bg.toString({ format: 'hex' });

    // Input field
    root.setProperty('--input-bg-color', light200);
    root.setProperty('--input-text-color', '#000000'); // Always black as requested

    // Toggle switch
    root.setProperty('--switch-bg-light-mode-color', light200);
    root.setProperty('--knob-light-mode-color', dark100);
    root.setProperty('--switch-bg-dark-mode-color', dark100);
    root.setProperty('--knob-dark-mode-color', light200);

    // Help icon
    const isLightMode = !isDarkDefault;
    const helpIconColor = isLightMode ? dark800 : dark800;
    const helpIconBgColor = isLightMode ? light200 : dark800;
    const helpIconHoverBgColor = isLightMode ? dark300 : dark300;
    const helpIconHoverColor = isLightMode ? dark950 : dark950;
    root.setProperty('--help-icon-color', helpIconColor);
    root.setProperty('--help-icon-bg-color', helpIconBgColor);
    root.setProperty('--help-icon-hover-bg-color', helpIconHoverBgColor);
    root.setProperty('--help-icon-hover-color', helpIconHoverColor);

    // Link colors
    root.setProperty('--link-color', dark700);
    root.setProperty('--link-hover-color', dark900);

    // Modals
    root.setProperty('--modal-bg-color', dark100);
    root.setProperty('--modal-text-color', dark900);

    // Dynamic text (e.g., h1)
    updateDynamicTextColor(processedDarkRamp['800'].bg);
  }

  // 7. Fix badge visibility by directly setting display style
  const lightBadge = document.querySelector('.light-mode-container .default-badge');
  const darkBadge = document.querySelector('.dark-mode-container .default-badge');
  if (lightBadge && darkBadge) {
    if (isDarkDefault) {
      lightBadge.style.display = 'none';
      darkBadge.style.display = 'inline-block';
    } else {
      lightBadge.style.display = 'inline-block';
      darkBadge.style.display = 'none';
    }
  }

  // 8. Update the background canvas colors
  if (window.canvas && typeof window.canvas.updateColors === 'function') {
    const darkRamp = [
      processedDarkRamp['300']?.bg.toString({ format: 'hex' }) || '#000000',
      processedDarkRamp['400']?.bg.toString({ format: 'hex' }) || '#000000',
      processedDarkRamp['500']?.bg.toString({ format: 'hex' }) || '#000000',
      processedDarkRamp['600']?.bg.toString({ format: 'hex' }) || '#000000',
      processedDarkRamp['700']?.bg.toString({ format: 'hex' }) || '#000000',
    ];
    const flashlightColor = color.toString({ format: 'hex' });
    window.canvas.updateColors({ darkRamp: darkRamp, flashlight: flashlightColor });
  }
}

function findClosestScale(baseColor, processedRamp) {
    let closestScale = null;
    let minDiff = Infinity;
    const baseColorForCompare = baseColor.to('srgb');

    Object.keys(processedRamp).forEach(scale => {
        const rampColor = processedRamp[scale].bg; // Compare against the final background color
        const diff = baseColorForCompare.deltaE(rampColor, '2000');
        if (diff < minDiff) {
            minDiff = diff;
            closestScale = scale;
        }
    });
    return closestScale;
}

// ---- Init ----
window.addEventListener('DOMContentLoaded', () => {

  // Function to handle modal open/close functionality
  function setupModal(triggerId, modalId, closeBtnId, backdropId) {
    const trigger = document.getElementById(triggerId);
    const modal = document.getElementById(modalId);
    const closeBtn = document.getElementById(closeBtnId);
    const backdrop = document.getElementById(backdropId);

    if (!trigger || !modal || !closeBtn || !backdrop) {
      return;
    }

    const closeModal = () => {
      if (!modal.classList.contains('active')) {
        return false;
      }

      modal.classList.remove('active');
      backdrop.classList.remove('active');
      document.body.classList.remove('modal-open');

      modal.__releaseFocusTrap?.();
      modal.__releaseFocusTrap = null;

      const returnEl = modal.__returnFocusEl;
      modal.__returnFocusEl = null;

      if (returnEl && document.contains(returnEl)) {
        returnEl.focus();
        returnEl.blur();
        return true;
      }
      if (trigger) trigger.focus();

      return true;
    };

    const openModal = (e) => {
      e.preventDefault();
      e.stopPropagation();

      modal.__returnFocusEl = (e.currentTarget instanceof HTMLElement) ? e.currentTarget : null;

      modalStack.push({
        modal,
        closeFn: closeModal,
      });

      modal.classList.add('active');
      backdrop.classList.add('active');
      document.body.classList.add('modal-open');

      if (window.trapFocusInModal) {
        modal.__releaseFocusTrap?.();
        modal.__releaseFocusTrap = window.trapFocusInModal(modal);
      }

      closeBtn.focus();
    };

    const closeModalFromUi = (e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();

      if (modalStack.length === 0 || modalStack[modalStack.length - 1]?.modal !== modal) {
        return;
      }

      const wasClosed = closeModal();
      if (wasClosed) {
        modalStack.pop();
      }
    };

    trigger.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModalFromUi);
    backdrop.addEventListener('click', closeModalFromUi);

    return modal;
  }

  // Initialize modals
  setupModal('help-default-ramp-mode', 'defaultRampModeModal', 'closeDefaultRampModeModal', 'defaultRampModeModalBackdrop');
  setupModal('help-vibrancy-boost', 'vibrancyBoostModal', 'closeVibrancyBoostModal', 'vibrancyBoostModalBackdrop');

  // Set up Figma example modals
  const figmaPairedExampleLink = document.getElementById('figma-paired-example-link');
  const figmaThemedExampleLink = document.getElementById('figma-themed-example-link');
  const figmaExampleModal = document.getElementById('figma-example-modal');
  const figmaExampleModalBackdrop = document.getElementById('figma-example-modal-backdrop');
  const figmaExampleImage = document.getElementById('figma-example-image');
  const closeFigmaExampleModal = document.getElementById('close-figma-example-modal');

  // ---- Smart Color Naming ----
  const HTML_COLOR_NAMES = {
    'aliceblue': '#f0f8ff', 'antiquewhite': '#faebd7', 'aqua': '#00ffff', 'aquamarine': '#7fffd4', 'azure': '#f0ffff',
    'beige': '#f5f5dc', 'bisque': '#ffe4c4', 'black': '#000000', 'blanchedalmond': '#ffebcd', 'blue': '#0000ff',
    'blueviolet': '#8a2be2', 'brown': '#a52a2a', 'burlywood': '#deb887', 'cadetblue': '#5f9ea0', 'chartreuse': '#7fff00',
    'chocolate': '#d2691e', 'coral': '#ff7f50', 'cornflowerblue': '#6495ed', 'cornsilk': '#fff8dc', 'crimson': '#dc143c',
    'cyan': '#00ffff', 'darkblue': '#00008b', 'darkcyan': '#008b8b', 'darkgoldenrod': '#b8860b', 'darkgray': '#a9a9a9',
    'darkgreen': '#006400', 'darkgrey': '#a9a9a9', 'darkkhaki': '#bdb76b', 'darkmagenta': '#8b008b', 'darkolivegreen': '#556b2f',
    'darkorange': '#ff8c00', 'darkorchid': '#9932cc', 'darkred': '#8b0000', 'darksalmon': '#e9967a', 'darkseagreen': '#8fbc8f',
    'darkslateblue': '#483d8b', 'darkslategray': '#2f4f4f', 'darkslategrey': '#2f4f4f', 'darkturquoise': '#00ced1',
    'darkviolet': '#9400d3', 'deeppink': '#ff1493', 'deepskyblue': '#00bfff', 'dimgray': '#696969', 'dimgrey': '#696969',
    'dodgerblue': '#1e90ff', 'firebrick': '#b22222', 'floralwhite': '#fffaf0', 'forestgreen': '#228b22', 'fuchsia': '#ff00ff',
    'gainsboro': '#dcdcdc', 'ghostwhite': '#f8f8ff', 'gold': '#ffd700', 'goldenrod': '#daa520', 'gray': '#808080',
    'green': '#008000', 'greenyellow': '#adff2f', 'grey': '#808080', 'honeydew': '#f0fff0', 'hotpink': '#ff69b4',
    'indianred': '#cd5c5c', 'indigo': '#4b0082', 'ivory': '#fffff0', 'khaki': '#f0e68c', 'lavender': '#e6e6fa',
    'lavenderblush': '#fff0f5', 'lawngreen': '#7cfc00', 'lemonchiffon': '#fffacd', 'lightblue': '#add8e6', 'lightcoral': '#f08080',
    'lightcyan': '#e0ffff', 'lightgoldenrodyellow': '#fafad2', 'lightgray': '#d3d3d3', 'lightgreen': '#90ee90',
    'lightgrey': '#d3d3d3', 'lightpink': '#ffb6c1', 'lightsalmon': '#ffa07a', 'lightseagreen': '#20b2aa', 'lightskyblue': '#87cefa',
    'lightslategray': '#778899', 'lightslategrey': '#778899', 'lightsteelblue': '#b0c4de', 'lightyellow': '#ffffe0',
    'lime': '#00ff00', 'limegreen': '#32cd32', 'linen': '#faf0e6', 'magenta': '#ff00ff', 'maroon': '#800000',
    'mediumaquamarine': '#66cdaa', 'mediumblue': '#0000cd', 'mediumorchid': '#ba55d3', 'mediumpurple': '#9370db',
    'mediumseagreen': '#3cb371', 'mediumslateblue': '#7b68ee', 'mediumspringgreen': '#00fa9a', 'mediumturquoise': '#48d1cc',
    'mediumvioletred': '#c71585', 'midnightblue': '#191970', 'mintcream': '#f5fffa', 'mistyrose': '#ffe4e1',
    'moccasin': '#ffe4b5', 'navajowhite': '#ffdead', 'navy': '#000080', 'oldlace': '#fdf5e6', 'olive': '#808000',
    'olivedrab': '#6b8e23', 'orange': '#ffa500', 'orangered': '#ff4500', 'orchid': '#da70d6', 'palegoldenrod': '#eee8aa',
    'palegreen': '#98fb98', 'paleturquoise': '#afeeee', 'palevioletred': '#db7093', 'papayawhip': '#ffefd5',
    'peachpuff': '#ffdab9', 'peru': '#cd853f', 'pink': '#ffc0cb', 'plum': '#dda0dd', 'powderblue': '#b0e0e6',
    'purple': '#800080', 'rebeccapurple': '#663399', 'red': '#ff0000', 'rosybrown': '#bc8f8f', 'royalblue': '#4169e1',
    'saddlebrown': '#8b4513', 'salmon': '#fa8072', 'sandybrown': '#f4a460', 'seagreen': '#2e8b57', 'seashell': '#fff5ee',
    'sienna': '#a0522d', 'silver': '#c0c0c0', 'skyblue': '#87ceeb', 'slateblue': '#6a5acd', 'slategray': '#708090',
    'slategrey': '#708090', 'snow': '#fffafa', 'springgreen': '#00ff7f', 'steelblue': '#4682b4', 'tan': '#d2b48c',
    'teal': '#008080', 'thistle': '#d8bfd8', 'tomato': '#ff6347', 'turquoise': '#40e0d0', 'violet': '#ee82ee',
    'wheat': '#f5deb3', 'white': '#ffffff', 'whitesmoke': '#f5f5f5', 'yellow': '#ffff00', 'yellowgreen': '#9acd32'
  };

  // Create a reverse map from hex to name for efficient lookup
  const HEX_TO_COLOR_NAME = Object.entries(HTML_COLOR_NAMES).reduce((acc, [name, hex]) => {
    acc[hex] = name;
    return acc;
  }, {});

  // Helper function to format HTML color names with proper capitalization
  function formatHtmlColorName(name) {
    if (!name) return name;

    // Map of all HTML color names to their correct CamelCase versions
    const colorNameMap = {
      // A
      'aliceblue': 'AliceBlue', 'antiquewhite': 'AntiqueWhite', 'aqua': 'Aqua', 'aquamarine': 'Aquamarine',
      'azure': 'Azure',
      // B
      'beige': 'Beige', 'bisque': 'Bisque', 'black': 'Black', 'blanchedalmond': 'BlanchedAlmond',
      'blue': 'Blue', 'blueviolet': 'BlueViolet', 'brown': 'Brown', 'burlywood': 'BurlyWood',
      // C
      'cadetblue': 'CadetBlue', 'chartreuse': 'Chartreuse', 'chocolate': 'Chocolate', 'coral': 'Coral',
      'cornflowerblue': 'CornflowerBlue', 'cornsilk': 'Cornsilk', 'crimson': 'Crimson', 'cyan': 'Cyan',
      // D
      'darkblue': 'DarkBlue', 'darkcyan': 'DarkCyan', 'darkgoldenrod': 'DarkGoldenRod', 'darkgray': 'DarkGray',
      'darkgreen': 'DarkGreen', 'darkgrey': 'DarkGrey', 'darkkhaki': 'DarkKhaki', 'darkmagenta': 'DarkMagenta',
      'darkolivegreen': 'DarkOliveGreen', 'darkorange': 'DarkOrange', 'darkorchid': 'DarkOrchid', 'darkred': 'DarkRed',
      'darksalmon': 'DarkSalmon', 'darkseagreen': 'DarkSeaGreen', 'darkslateblue': 'DarkSlateBlue',
      'darkslategray': 'DarkSlateGray', 'darkslategrey': 'DarkSlateGrey', 'darkturquoise': 'DarkTurquoise',
      'darkviolet': 'DarkViolet', 'deeppink': 'DeepPink', 'deepskyblue': 'DeepSkyBlue', 'dimgray': 'DimGray',
      'dimgrey': 'DimGrey', 'dodgerblue': 'DodgerBlue',
      // F
      'firebrick': 'FireBrick', 'floralwhite': 'FloralWhite', 'forestgreen': 'ForestGreen', 'fuchsia': 'Fuchsia',
      // G
      'gainsboro': 'Gainsboro', 'ghostwhite': 'GhostWhite', 'gold': 'Gold', 'goldenrod': 'GoldenRod',
      'gray': 'Gray', 'green': 'Green', 'greenyellow': 'GreenYellow', 'grey': 'Grey',
      // H
      'honeydew': 'HoneyDew', 'hotpink': 'HotPink',
      // I
      'indianred': 'IndianRed', 'indigo': 'Indigo', 'ivory': 'Ivory',
      // K
      'khaki': 'Khaki',
      // L
      'lavender': 'Lavender', 'lavenderblush': 'LavenderBlush', 'lawngreen': 'LawnGreen',
      'lemonchiffon': 'LemonChiffon', 'lightblue': 'LightBlue', 'lightcoral': 'LightCoral', 'lightcyan': 'LightCyan',
      'lightgoldenrodyellow': 'LightGoldenRodYellow', 'lightgray': 'LightGray', 'lightgreen': 'LightGreen',
      'lightgrey': 'LightGrey', 'lightpink': 'LightPink', 'lightsalmon': 'LightSalmon', 'lightseagreen': 'LightSeaGreen',
      'lightskyblue': 'LightSkyBlue', 'lightslategray': 'LightSlateGray', 'lightslategrey': 'LightSlateGrey',
      'lightsteelblue': 'LightSteelBlue', 'lightyellow': 'LightYellow', 'lime': 'Lime', 'limegreen': 'LimeGreen',
      'linen': 'Linen',
      // M
      'magenta': 'Magenta', 'maroon': 'Maroon', 'mediumaquamarine': 'MediumAquaMarine', 'mediumblue': 'MediumBlue',
      'mediumorchid': 'MediumOrchid', 'mediumpurple': 'MediumPurple', 'mediumseagreen': 'MediumSeaGreen',
      'mediumslateblue': 'MediumSlateBlue', 'mediumspringgreen': 'MediumSpringGreen', 'mediumturquoise': 'MediumTurquoise',
      'mediumvioletred': 'MediumVioletRed', 'midnightblue': 'MidnightBlue', 'mintcream': 'MintCream', 'mistyrose': 'MistyRose',
      'moccasin': 'Moccasin',
      // N
      'navajowhite': 'NavajoWhite', 'navy': 'Navy',
      // O
      'oldlace': 'OldLace', 'olive': 'Olive', 'olivedrab': 'OliveDrab', 'orange': 'Orange', 'orangered': 'OrangeRed',
      'orchid': 'Orchid',
      // P
      'palegoldenrod': 'PaleGoldenRod', 'palegreen': 'PaleGreen', 'paleturquoise': 'PaleTurquoise',
      'palevioletred': 'PaleVioletRed', 'papayawhip': 'PapayaWhip', 'peachpuff': 'PeachPuff', 'peru': 'Peru',
      'pink': 'Pink', 'plum': 'Plum', 'powderblue': 'PowderBlue', 'purple': 'Purple',
      // R
      'rebeccapurple': 'RebeccaPurple', 'red': 'Red', 'rosybrown': 'RosyBrown', 'royalblue': 'RoyalBlue',
      // S
      'saddlebrown': 'SaddleBrown', 'salmon': 'Salmon', 'sandybrown': 'SandyBrown', 'seagreen': 'SeaGreen',
      'seashell': 'SeaShell', 'sienna': 'Sienna', 'silver': 'Silver', 'skyblue': 'SkyBlue', 'slateblue': 'SlateBlue',
      'slategray': 'SlateGray', 'slategrey': 'SlateGrey', 'snow': 'Snow', 'springgreen': 'SpringGreen',
      'steelblue': 'SteelBlue',
      // T
      'tan': 'Tan', 'teal': 'Teal', 'thistle': 'Thistle', 'tomato': 'Tomato', 'turquoise': 'Turquoise',
      // V
      'violet': 'Violet',
      // W
      'wheat': 'Wheat', 'white': 'White', 'whitesmoke': 'WhiteSmoke',
      // Y
      'yellow': 'Yellow', 'yellowgreen': 'YellowGreen'
    };

    // Return the properly formatted name if found, otherwise convert to title case as a fallback
    const lowerName = name.toLowerCase();
    if (colorNameMap.hasOwnProperty(lowerName)) {
      return colorNameMap[lowerName];
    }

    // Fallback: Convert to title case (first letter uppercase, rest lowercase)
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  function getAutoColorName(userInput) {
    // Check if ntc.js is available
    const isNtcAvailable = typeof ntc !== 'undefined' && typeof ntc.name === 'function';

    // If we have a string input, process it
    if (typeof userInput === 'string' && userInput.trim() !== '') {
      let colorStr = userInput.trim();
      let hex;

      // First, try to parse it as a color to handle all formats
      try {
        const color = new Color(colorStr);
        hex = color.toString({ format: 'hex' }).toUpperCase();

        // Check HTML color names for exact matches with the hex value
        if (HEX_TO_COLOR_NAME[hex]) {
          return formatHtmlColorName(HEX_TO_COLOR_NAME[hex]);
        }

        // Try ntc.js for approximate matches
        if (isNtcAvailable) {
          try {
            const ntcMatch = ntc.name(hex);
            // ntc.name returns [hex, name, exact_match]
            if (ntcMatch && ntcMatch[1] && ntcMatch[1] !== '') {
              return formatHtmlColorName(ntcMatch[1]);
            }
          } catch (e) {
            // Silently handle ntc.js errors
          }
        }

        // If we have a hex value but no name, return "Color #HEX"
        return `Color ${hex}`;
      } catch (e) {
        // If parsing as a color fails, try to handle it as a potential hex string
        if (/^[0-9A-Fa-f]{6}$/i.test(colorStr)) {
          hex = '#' + colorStr.toUpperCase();

          // Check HTML color names for exact matches
          if (HEX_TO_COLOR_NAME[hex]) {
            return formatHtmlColorName(HEX_TO_COLOR_NAME[hex]);
          }

          // Try ntc.js for approximate matches
          if (isNtcAvailable) {
            try {
              const ntcMatch = ntc.name(hex);
              if (ntcMatch && ntcMatch[1] && ntcMatch[1] !== '') {
                return formatHtmlColorName(ntcMatch[1]);
              }
            } catch (e) {
              // Silently handle ntc.js errors
            }
          }

          return `Color ${hex}`;
        }

        // For other cases, check if it's a valid CSS color name
        const s = new Option().style;
        s.color = colorStr;

        // If it's a valid color name and not just echoing back a hex value
        if (s.color !== '' && s.color !== colorStr && !s.color.startsWith('#')) {
          return formatHtmlColorName(colorStr);
        }
      }
    }

    // If we get here, we couldn't determine a good name
    return 'Custom Color';
  }

  const colorInput = document.getElementById('colorInput');
  const rampToggle = document.getElementById('defaultRampToggle');
  // --- Vibrancy Boost Logic ---
  const vibrancySelect = document.getElementById('vibrancy-boost-select');
  vibrancySelect.addEventListener('change', updateAll);

  // --- Initial State Loading: URL > localStorage > Default ---
  const urlParams = new URLSearchParams(window.location.search);

  // Color
  const colorFromUrl = urlParams.get('color');
  const lastUsedColor = localStorage.getItem('lastUsedColor_oklch');
  let initialColor = '#04f700'; // Default color

  if (colorFromUrl) {
    const formattedColor = `#${colorFromUrl.replace(/#/, '')}`;
    try {
      new Color(formattedColor); // Validate color
      initialColor = formattedColor;
    } catch (e) {
      // Invalid color in URL, use fallback
    }
  } else if (lastUsedColor) {
    initialColor = lastUsedColor;
  }

  colorInput.value = initialColor;

  // Add input event listener after initial setup
  colorInput.addEventListener('input', updateAll);

  // Trigger initial input event to generate ramps
  setTimeout(() => {
    colorInput.dispatchEvent(new Event('input'));
  }, 10);

  // Vibrancy Boost
  const vibrancyFromUrl = urlParams.get('vibrancy');
  const lastVibrancyBoost = localStorage.getItem('lastVibrancyBoost_oklch');
  let initialVb = '0'; // Default vibrancy
  if (vibrancyFromUrl) {
    initialVb = vibrancyFromUrl;
  } else if (lastVibrancyBoost) {
    initialVb = lastVibrancyBoost;
  }
  vibrancySelect.value = initialVb;

  // Default Ramp Mode
  const rampModeFromUrl = urlParams.get('default-ramp');
  const lastRampMode = localStorage.getItem('defaultRampMode_oklch');
  let initialRampMode = 'light'; // Default ramp mode
  if (rampModeFromUrl) {
    initialRampMode = rampModeFromUrl;
  } else if (lastRampMode) {
    initialRampMode = lastRampMode;
  }
  document.getElementById('defaultRampToggle').checked = (initialRampMode === 'dark');

  colorInput.addEventListener('click', (e) => e.target.select());
  rampToggle.addEventListener('change', updateAll);

  // ---- Collections Logic ----
const COLLECTIONS_KEY = 'colorRampCollections_oklch';

// Generate a unique ID for collections and colors
function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

// Get collections from localStorage
function getCollections() {
  const data = localStorage.getItem(COLLECTIONS_KEY);
  if (data) {
    return JSON.parse(data);
  }
  // Default structure if nothing is in localStorage
  return { collections: [] };
}

// Save collections to localStorage
function saveCollections(data) {
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(data));
}

// Render the entire collections UI
function renderCollections() {
  const data = getCollections();
  const container = document.getElementById('collections-list');
  if (!container) return;

  container.innerHTML = ''; // Clear existing content



  if (data.collections.length === 0) {
    container.innerHTML = '<p class="empty-collections-message">No collections yet. Create one to get started!</p>';
  }

  const collectionsForRender = [...data.collections].sort((a, b) => {
    const aTime = Date.parse(a?.createdAt || '') || 0;
    const bTime = Date.parse(b?.createdAt || '') || 0;
    return bTime - aTime;
  });

  collectionsForRender.forEach(collection => {
    const createdMetadataHtml = window.buildCollectionCreatedMetadataHtml
      ? window.buildCollectionCreatedMetadataHtml({
        createdAt: collection?.createdAt,
      })
      : '';

    const tokenCounterHtml = window.buildCollectionTokenCounterHtml
      ? window.buildCollectionTokenCounterHtml({
        colorCount: collection?.colors?.length || 0,
      })
      : '';
    const collectionEl = document.createElement('div');
    collectionEl.className = 'collection-item';
    collectionEl.dataset.collectionId = collection.id;

    let colorsHtml = collection.colors.map(color => `
      <div class="collection-color-item" data-color-id="${color.id}" draggable="true">
        <div class="color-item-header">
            <span class="collection-color-name" title="Click or press Enter to rename" tabindex="0" role="button">
            <i data-lucide="pencil" class="icon-edit"></i>
            ${color.name}
            </span>
        </div>
        <div class="color-item-body">
            <div class="color-info">
                <div class="collection-color-preview" style="background-color: ${color.base}"></div>
                <span class="color-hex">${color.base}</span>
            </div>
            <div class="color-actions">
                <button class="btn-icon btn-grip" title="Drag to reorder">
                  <i data-lucide="grip-vertical"></i>
                </button>
                <button class="btn-icon btn-load-color" title="Load Color">
                  <i data-lucide="arrow-up-to-line"></i>
                </button>
                <button class="btn-icon btn-delete" title="Delete Color">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        </div>
      </div>
    `).join('');

    collectionEl.innerHTML = `
      <div class="collection-header">
        <h3 class="collection-name" title="Click or press Enter to rename" tabindex="0" role="button">
          <i data-lucide="pencil" class="icon-edit"></i>
          ${collection.name}
        </h3>
        ${createdMetadataHtml}
        <div class="collection-actions">
          <button class="btn-base btn-add-color"><i data-lucide="package-plus" class="icon"></i>Add Current Color</button>
          <button class="btn-base btn-color btn-export-collection"><i data-lucide="file-up" class="icon"></i>Export to JSON</button>
          <button class="btn-icon btn-delete" title="Delete Collection">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
      ${tokenCounterHtml}
      <div class="collection-colors-list${collection.colors.length === 0 ? ' no-colors-yet' : ''}" data-collection-id="${collection.id}">
        ${collection.colors.length === 0
          ? '<p class="empty-colors-message">No colors in this collection yet.</p>'
          : colorsHtml}
      </div>
    `;
    container.appendChild(collectionEl);
  });

    // After rendering, tell Lucide to create the icons.
  if (window.lucide) {
    lucide.createIcons();
  }

  // Set up export buttons
  document.querySelectorAll('.btn-export-collection').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const collectionId = btn.closest('.collection-item')?.dataset.collectionId;
      if (collectionId) {
        openExportModal(collectionId);
      }
    });
  });

  // Set up drag and drop functionality
  setupDragAndDrop();

  // Set up the moveColorItem handler for drag and drop
  window.moveColorItemHandler = createMoveColorItemHandler(getCollections, saveCollections, renderCollections);
}

// Open export modal for a specific collection
function openExportModal(collectionId) {
  const exportModal = document.getElementById('export-modal');
  const exportModalBackdrop = document.getElementById('export-modal-backdrop');

  if (!exportModal || !exportModalBackdrop) return;

  // Get collections and find the collection by ID
  const collectionsData = getCollections();
  const collections = collectionsData.collections || [];
  const collection = collections.find(c => c.id === collectionId);

  if (!collection) {
    console.error('Collection not found:', collectionId);
    showToast('Collection not found', document.querySelector('.btn-export-collection'));
    return;
  }

  // Call the existing openExportModal function with the collection object
  openExportModalWithCollection(collection);
}

// ---- Export Logic ----
function generateJsonForFigma(collection, format) {
  const output = {
    format: format.replace('figma-', ''), // Ensure format is 'paired' or 'themed'
    collectionName: collection.name,
  };

  // This internal function processes a single color, generating its light and dark ramps.
  const processColor = (color) => {
    try {
      const parsedColorValue = parseRgbInput(color.base);
      const baseColor = new Color(parsedColorValue);
      const { ramp: lightRampRaw, anchorScale: lightAnchorScale } = generateRamp(baseColor, true, color.defaultMode === 'light', color.vibrancyBoost);
      const { ramp: darkRampRaw, anchorScale: darkAnchorScale } = generateRamp(baseColor, false, color.defaultMode === 'dark', color.vibrancyBoost);
      const { processedRamp: processedLightRamp, allHexes: lightHexes } = processRamp(lightRampRaw, new Set());
      const { processedRamp: processedDarkRamp } = processRamp(darkRampRaw, lightHexes);
      return { processedLightRamp, processedDarkRamp, lightAnchorScale, darkAnchorScale };
    } catch (e) {
      console.error(`Skipping invalid color in collection: "${color.name}" (base: "${color.base}")`, e);
      return null;
    }
  };

  if (format === 'figma-paired') {
    output.colors = {};
    collection.colors.forEach(color => {
      const processed = processColor(color);
      if (!processed) return;
      output.colors[color.name] = {};
      SCALES.forEach(scale => {
        output.colors[color.name][scale] = {
          Light: hex(processed.processedLightRamp[scale].bg),
          Dark: hex(processed.processedDarkRamp[scale].bg)
        };
      });
    });
  } else if (format === 'figma-themed') {
    output.themes = { Light: {}, Dark: {} };
    collection.colors.forEach(color => {
      const processed = processColor(color);
      if (!processed) return;
      output.themes.Light[color.name] = {};
      output.themes.Dark[color.name] = {};
      SCALES.forEach(scale => {
        const lightKey = (scale === processed.lightAnchorScale) ? `${scale}*` : scale;
        const darkKey = (scale === processed.darkAnchorScale) ? `${scale}*` : scale;
        output.themes.Light[color.name][lightKey] = hex(processed.processedLightRamp[scale].bg);
        output.themes.Dark[color.name][darkKey] = hex(processed.processedDarkRamp[scale].bg);
      });
    });
  }
  // Single ramp exports - Light
  else if (format === 'light ramp') {
    output.colors = {};
    collection.colors.forEach(color => {
      const processed = processColor(color);
      if (!processed) return;
      output.colors[color.name] = {};
      SCALES.forEach(scale => {
        output.colors[color.name][scale] = hex(processed.processedLightRamp[scale].bg);
      });
    });
  }
  // Single ramp exports - Dark
  else if (format === 'dark ramp') {
    output.colors = {};
    collection.colors.forEach(color => {
      const processed = processColor(color);
      if (!processed) return;
      output.colors[color.name] = {};
      SCALES.forEach(scale => {
        output.colors[color.name][scale] = hex(processed.processedDarkRamp[scale].bg);
      });
    });
  }
  return output;
}

function generateJsonStringForFigma(collection, format) {
  const escapeJsonString = (value) => JSON.stringify(value ?? '');

  const processColor = (color) => {
    try {
      const parsedColorValue = parseRgbInput(color.base);
      const baseColor = new Color(parsedColorValue);
      const { ramp: lightRampRaw, anchorScale: lightAnchorScale } = generateRamp(baseColor, true, color.defaultMode === 'light', color.vibrancyBoost);
      const { ramp: darkRampRaw, anchorScale: darkAnchorScale } = generateRamp(baseColor, false, color.defaultMode === 'dark', color.vibrancyBoost);
      const { processedRamp: processedLightRamp, allHexes: lightHexes } = processRamp(lightRampRaw, new Set());
      const { processedRamp: processedDarkRamp } = processRamp(darkRampRaw, lightHexes);
      return { processedLightRamp, processedDarkRamp, lightAnchorScale, darkAnchorScale };
    } catch (e) {
      console.error(`Skipping invalid color in collection: "${color.name}" (base: "${color.base}")`, e);
      return null;
    }
  };

  const buildScaleBlock = (ramp, baseScale) => {
    const lines = ['{'];
    SCALES.forEach((scale, idx) => {
      const key = (scale === baseScale) ? `${scale}*` : String(scale);
      const value = hex(ramp[scale].bg);
      const comma = idx === SCALES.length - 1 ? '' : ',';
      lines.push(`        ${escapeJsonString(key)}: ${escapeJsonString(value)}${comma}`);
    });
    lines.push('      }');
    return lines;
  };

  const headerLines = [
    '{',
    `  "format": ${escapeJsonString(format.replace('figma-', ''))},`,
    `  "collectionName": ${escapeJsonString(collection.name)},`
  ];

  if (format === 'figma-themed') {
    const lines = [...headerLines, '  "themes": {', '    "Light": {'];

    (collection.colors || []).forEach((color, colorIdx) => {
      const processed = processColor(color);
      if (!processed) return;

      const isLastLight = colorIdx === (collection.colors.length - 1);
      lines.push(`      ${escapeJsonString(color.name)}: ${buildScaleBlock(processed.processedLightRamp, processed.lightAnchorScale).join('\n')}${isLastLight ? '' : ','}`);
    });

    lines.push('    },', '    "Dark": {');

    (collection.colors || []).forEach((color, colorIdx) => {
      const processed = processColor(color);
      if (!processed) return;

      const isLastDark = colorIdx === (collection.colors.length - 1);
      lines.push(`      ${escapeJsonString(color.name)}: ${buildScaleBlock(processed.processedDarkRamp, processed.darkAnchorScale).join('\n')}${isLastDark ? '' : ','}`);
    });

    lines.push('    }', '  }', '}');
    return lines.join('\n');
  }

  if (format === 'light ramp' || format === 'dark ramp') {
    const lines = [...headerLines, '  "colors": {'];

    (collection.colors || []).forEach((color, colorIdx) => {
      const processed = processColor(color);
      if (!processed) return;

      const ramp = (format === 'light ramp') ? processed.processedLightRamp : processed.processedDarkRamp;
      const baseScale = (format === 'light ramp') ? processed.lightAnchorScale : processed.darkAnchorScale;
      const isLastColor = colorIdx === (collection.colors.length - 1);
      lines.push(`    ${escapeJsonString(color.name)}: ${buildScaleBlock(ramp, baseScale).join('\n')}${isLastColor ? '' : ','}`);
    });

    lines.push('  }', '}');
    return lines.join('\n');
  }

  const jsonOutput = generateJsonForFigma(collection, format);
  return JSON.stringify(jsonOutput, null, 2);
}

function openExportModalWithCollection(collection) {
  const modal = document.getElementById('export-modal');
  const backdrop = document.getElementById('export-modal-backdrop');
  const formatSelect = document.getElementById('json-format-select');
  const textarea = document.getElementById('export-json-textarea');
  const copyBtn = document.getElementById('copy-json-btn');
  const returnFocusEl = document.activeElement;

  // Use cloneNode to avoid attaching multiple listeners if the modal is re-opened
  const newFormatSelect = formatSelect.cloneNode(true);
  formatSelect.parentNode.replaceChild(newFormatSelect, formatSelect);
  const newCopyBtn = copyBtn.cloneNode(true);
  copyBtn.parentNode.replaceChild(newCopyBtn, copyBtn);

  function generateAndDisplayJson() {
    const format = newFormatSelect.value;
    let outputString;

    if (format === 'backup') {
      const instructions = `***\nCollection Name: "${collection.name}"\nColor Space: OKLCH\n\nSave this JSON file to restore this color ramp here on Color-Ramp.com. Both ".json" or ".txt" file extensions are supported.\n\nThis JSON file is NOT to be used with the Figma plugin. For that, use the provided Dual Ramps or Single Ramp JSON formats.\n***`;
      const collectionForBackup = {
        ...collection,
        tokenCount: Array.isArray(collection?.colors) ? collection.colors.length : 0,
      };
      const backupData = {
        collections: [collectionForBackup]
      };
      const backupJsonString = JSON.stringify(backupData, null, 2);
      outputString = `${instructions}\n\n${backupJsonString}`;
    } else {
      outputString = generateJsonStringForFigma(collection, format);
    }
    textarea.value = outputString;
  }

  newFormatSelect.addEventListener('change', generateAndDisplayJson);

  newCopyBtn.onclick = () => {
    textarea.select();
    navigator.clipboard.writeText(textarea.value).then(() => {
      // Store original button content
      const originalHTML = newCopyBtn.innerHTML;
      const originalText = newCopyBtn.textContent.trim();

      // Change button text and icon
      newCopyBtn.innerHTML = '🗸 Copied!';
      newCopyBtn.classList.add('copied-state');

      // Revert after 3 seconds
      setTimeout(() => {
        newCopyBtn.innerHTML = originalHTML;
        newCopyBtn.classList.remove('copied-state');
        if (window.lucide) {
          lucide.createIcons();
        }
      }, 3000);

      showToast('JSON copied to clipboard!', newCopyBtn);
    }).catch(err => {
      console.error('Failed to copy JSON: ', err);
      alert('Failed to copy JSON. Please copy it manually.');
    });
  };

  // Close handler that properly removes from modal stack
  const closeHandler = () => {
    closeExportModal();
  };

  // Add to modal stack before showing
  modalStack.push({
    modal,
    closeFn: closeHandler
  });

  // Add event listeners for close button and backdrop
  const closeBtn = document.getElementById('close-export-modal');
  closeBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeTopModal();
  };

  backdrop.onclick = (e) => {
    if (e.target === backdrop) {
      e.preventDefault();
      e.stopPropagation();
      closeTopModal();
    }
  };

  // Initial generation
  generateAndDisplayJson();

  // Show the modal
  modal.classList.add('active');
  backdrop.classList.add('active');
  document.body.classList.add('modal-open');

  // Focus the close button for accessibility
  closeBtn.focus();

  if (window.trapFocusInModal) {
    modal.__releaseFocusTrap?.();
    modal.__releaseFocusTrap = window.trapFocusInModal(modal);
  }

  modal.__returnFocusEl = returnFocusEl instanceof HTMLElement ? returnFocusEl : null;
}

function closeExportModal() {
  const modal = document.getElementById('export-modal');
  const backdrop = document.getElementById('export-modal-backdrop');

  // Check if the modal is actually open
  if (!modal || !modal.classList.contains('active')) {
    return false;
  }

  // Hide the modal
  modal.classList.remove('active');
  backdrop.classList.remove('active');
  document.body.classList.remove('modal-open');

  modal.__releaseFocusTrap?.();
  modal.__releaseFocusTrap = null;

  const returnEl = modal.__returnFocusEl;
  modal.__returnFocusEl = null;

  // Find and focus the export button that opened this modal
  const exportButtons = document.querySelectorAll('.export-collection-btn');
  const activeButton = Array.from(exportButtons).find(btn =>
    btn.getAttribute('aria-expanded') === 'true'
  );

  if (activeButton) {
    activeButton.focus();
    activeButton.setAttribute('aria-expanded', 'false');
  } else if (returnEl && document.contains(returnEl)) {
    returnEl.focus();
  }

  return true; // Indicate success
}

// Global modal stack to track open modals in order
const modalStack = [];

// Close the topmost modal
function closeTopModal() {
  if (modalStack.length === 0) {
    return;
  }

  // Get the top modal and its close function
  const topModal = modalStack[modalStack.length - 1];

  // Call the close function first
  const wasClosed = topModal.closeFn();

  // Only remove from stack if the close was successful
  if (wasClosed) {
    modalStack.pop();
  }
}

// Global ESC key handler
function handleEscapeKey(e) {
  if (e.key === 'Escape' && modalStack.length > 0) {
    e.preventDefault();
    e.stopPropagation();
    closeTopModal();
  }
}

// Ensure we only add the event listener once
if (!window.escapeHandlerInitialized) {
  document.removeEventListener('keydown', handleEscapeKey);
  document.addEventListener('keydown', handleEscapeKey, { capture: true }); // Use capture phase
  window.escapeHandlerInitialized = true;
}

let pendingCollectionsDeleteAction = null;
let collectionsModalReturnFocusEl = null;

function openProgrammaticModal(modal, backdrop, { focusEl, returnFocusEl, onClose } = {}) {
  if (!modal || !backdrop) return;

  collectionsModalReturnFocusEl = returnFocusEl || null;

  const closeModal = () => {
    if (!modal.classList.contains('active')) {
      return false;
    }

    modal.classList.remove('active');
    backdrop.classList.remove('active');
    document.body.classList.remove('modal-open');

    modal.__releaseFocusTrap?.();
    modal.__releaseFocusTrap = null;

    if (typeof onClose === 'function') {
      onClose();
    }

    if (collectionsModalReturnFocusEl) {
      collectionsModalReturnFocusEl.focus();
      collectionsModalReturnFocusEl.blur();
    }

    return true;
  };

  modalStack.push({ modal, closeFn: closeModal });
  modal.classList.add('active');
  backdrop.classList.add('active');
  document.body.classList.add('modal-open');

  if (window.trapFocusInModal) {
    modal.__releaseFocusTrap?.();
    modal.__releaseFocusTrap = window.trapFocusInModal(modal);
  }

  if (window.lucide) {
    try {
      lucide.createIcons();
    } catch (e) {
      // ignore
    }
  }

  if (focusEl) {
    focusEl.focus();
  }

  if (focusEl && focusEl instanceof HTMLElement) {
    requestAnimationFrame(() => {
      focusEl.focus({ preventScroll: true });
      setTimeout(() => {
        focusEl.focus({ preventScroll: true });
      }, 50);
    });
  }
}

function initCollectionsCrudModals() {
  const newCollectionModal = document.getElementById('new-collection-modal');
  const newCollectionBackdrop = document.getElementById('new-collection-modal-backdrop');
  const newCollectionCloseBtn = document.getElementById('close-new-collection-modal');
  const newCollectionCancelBtn = document.getElementById('cancel-new-collection');
  const newCollectionConfirmBtn = document.getElementById('confirm-new-collection');
  const newCollectionNameInput = document.getElementById('new-collection-name-input');
  const newCollectionErrorEl = document.getElementById('new-collection-error');

  const updateNewCollectionConfirmState = () => {
    if (!newCollectionConfirmBtn) return;
    const hasValue = ((newCollectionNameInput?.value || '').trim().length > 0);
    const shouldDisable = !hasValue;
    newCollectionConfirmBtn.disabled = shouldDisable;
    if (shouldDisable) {
      newCollectionConfirmBtn.setAttribute('disabled', '');
    } else {
      newCollectionConfirmBtn.removeAttribute('disabled');
    }
  };

  const deleteColorModal = document.getElementById('delete-color-modal');
  const deleteColorBackdrop = document.getElementById('delete-color-modal-backdrop');
  const deleteColorCloseBtn = document.getElementById('close-delete-color-modal');
  const deleteColorCancelBtn = document.getElementById('cancel-delete-color');
  const deleteColorConfirmBtn = document.getElementById('confirm-delete-color');
  const deleteColorMessageEl = document.getElementById('delete-color-modal-message');

  const deleteCollectionModal = document.getElementById('delete-collection-modal');
  const deleteCollectionBackdrop = document.getElementById('delete-collection-modal-backdrop');
  const deleteCollectionCloseBtn = document.getElementById('close-delete-collection-modal');
  const deleteCollectionCancelBtn = document.getElementById('cancel-delete-collection');
  const deleteCollectionConfirmBtn = document.getElementById('confirm-delete-collection');
  const deleteCollectionMessageEl = document.getElementById('delete-collection-modal-message');

  const closeIfTop = (modalToClose) => {
    if (modalStack.length > 0 && modalStack[modalStack.length - 1].modal === modalToClose) {
      closeTopModal();
    }
  };

  if (newCollectionCloseBtn && newCollectionModal) {
    newCollectionCloseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeIfTop(newCollectionModal);
    });
  }

  if (newCollectionBackdrop && newCollectionModal) {
    newCollectionBackdrop.addEventListener('click', (e) => {
      if (e.target === newCollectionBackdrop) {
        closeIfTop(newCollectionModal);
      }
    });
  }

  if (newCollectionCancelBtn && newCollectionModal) {
    newCollectionCancelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeIfTop(newCollectionModal);
    });
  }

  if (newCollectionNameInput) {
    newCollectionNameInput.addEventListener('input', updateNewCollectionConfirmState);
  }

  updateNewCollectionConfirmState();

  if (newCollectionConfirmBtn) {
    newCollectionConfirmBtn.addEventListener('click', () => {
      const name = (newCollectionNameInput?.value || '').trim();
      if (!name) {
        if (newCollectionErrorEl) {
          const span = newCollectionErrorEl.querySelector('span');
          if (span) span.textContent = '';
          newCollectionErrorEl.classList.remove('is-visible');
        }
        return;
      }

      try {
        const data = getCollections();
        data.collections.push({
          id: generateId(),
          name,
          createdAt: new Date().toISOString(),
          colors: []
        });
        saveCollections(data);
        renderCollections();

        appToast.success('Collection created successfully!');

        document.getElementById('collections-section').scrollIntoView({ behavior: 'smooth' });
        closeIfTop(newCollectionModal);
      } catch (error) {
        if (newCollectionErrorEl) {
          const span = newCollectionErrorEl.querySelector('span');
          if (span) span.textContent = 'There was an error creating your collection. Please try again.';
          newCollectionErrorEl.classList.add('is-visible');
        }
      }
    });
  }

  if (newCollectionNameInput) {
    newCollectionNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        newCollectionConfirmBtn?.click();
      }
    });
  }

  if (deleteColorCloseBtn && deleteColorModal) {
    deleteColorCloseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeIfTop(deleteColorModal);
    });
  }

  if (deleteColorBackdrop && deleteColorModal) {
    deleteColorBackdrop.addEventListener('click', (e) => {
      if (e.target === deleteColorBackdrop) {
        closeIfTop(deleteColorModal);
      }
    });
  }

  if (deleteColorCancelBtn && deleteColorModal) {
    deleteColorCancelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeIfTop(deleteColorModal);
    });
  }

  if (deleteColorConfirmBtn) {
    deleteColorConfirmBtn.addEventListener('click', () => {
      if (!pendingCollectionsDeleteAction || pendingCollectionsDeleteAction.type !== 'color') return;
      const { collectionId, colorId } = pendingCollectionsDeleteAction;
      const data = getCollections();
      const collection = data.collections.find(c => c.id === collectionId);
      if (!collection) return;

      try {
        hideAllTooltips();
      } catch (error) {
        // ignore
      }

      collection.colors = collection.colors.filter(c => c.id !== colorId);
      saveCollections(data);
      renderCollections();

      appToast.info('Color deleted');
      closeIfTop(deleteColorModal);
    });
  }

  if (deleteCollectionCloseBtn && deleteCollectionModal) {
    deleteCollectionCloseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeIfTop(deleteCollectionModal);
    });
  }

  if (deleteCollectionBackdrop && deleteCollectionModal) {
    deleteCollectionBackdrop.addEventListener('click', (e) => {
      if (e.target === deleteCollectionBackdrop) {
        closeIfTop(deleteCollectionModal);
      }
    });
  }

  if (deleteCollectionCancelBtn && deleteCollectionModal) {
    deleteCollectionCancelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeIfTop(deleteCollectionModal);
    });
  }

  if (deleteCollectionConfirmBtn) {
    deleteCollectionConfirmBtn.addEventListener('click', () => {
      if (!pendingCollectionsDeleteAction || pendingCollectionsDeleteAction.type !== 'collection') return;
      const { collectionId } = pendingCollectionsDeleteAction;
      const data = getCollections();

      try {
        hideAllTooltips();
      } catch (error) {
        // ignore
      }

      data.collections = data.collections.filter(c => c.id !== collectionId);
      saveCollections(data);
      renderCollections();

      appToast.info('Collection deleted');
      closeIfTop(deleteCollectionModal);
    });
  }

  return {
    openNewCollectionModal: (returnFocusEl) => {
      if (newCollectionErrorEl) {
        const span = newCollectionErrorEl.querySelector('span');
        if (span) span.textContent = '';
        newCollectionErrorEl.classList.remove('is-visible');
      }
      if (newCollectionNameInput) newCollectionNameInput.value = '';
      updateNewCollectionConfirmState();

      openProgrammaticModal(newCollectionModal, newCollectionBackdrop, {
        focusEl: newCollectionNameInput || newCollectionCloseBtn,
        returnFocusEl,
        onClose: () => {
          if (newCollectionErrorEl) {
            const span = newCollectionErrorEl.querySelector('span');
            if (span) span.textContent = '';
            newCollectionErrorEl.classList.remove('is-visible');
          }
        }
      });
      requestAnimationFrame(() => {
        if (newCollectionNameInput) {
          newCollectionNameInput.focus();
        }
      });
    },
    openDeleteColorModal: ({ message, collectionId, colorId, returnFocusEl }) => {
      pendingCollectionsDeleteAction = { type: 'color', collectionId, colorId };
      if (deleteColorMessageEl) deleteColorMessageEl.textContent = message;

      openProgrammaticModal(deleteColorModal, deleteColorBackdrop, {
        focusEl: deleteColorConfirmBtn || deleteColorCloseBtn,
        returnFocusEl
      });
    },
    openDeleteCollectionModal: ({ message, collectionId, returnFocusEl }) => {
      pendingCollectionsDeleteAction = { type: 'collection', collectionId };
      if (deleteCollectionMessageEl) deleteCollectionMessageEl.textContent = message;

      openProgrammaticModal(deleteCollectionModal, deleteCollectionBackdrop, {
        focusEl: deleteCollectionConfirmBtn || deleteCollectionCloseBtn,
        returnFocusEl
      });
    }
  };
}

  // ntc.js will be used for color name resolution when needed

  // Event listeners for Figma example links
  if (figmaPairedExampleLink) {
    figmaPairedExampleLink.addEventListener('click', (e) => {
      e.preventDefault();
      openFigmaExampleModal('images/figma-variables-paired.png', 'Figma Paired Variables Example');
    });
  }

  if (figmaThemedExampleLink) {
    figmaThemedExampleLink.addEventListener('click', (e) => {
      e.preventDefault();
      openFigmaExampleModal('images/figma-variables-themed.png', 'Figma Themed Variables Example');
    });
  }

  // Close modal when clicking the close button or backdrop
  if (closeFigmaExampleModal && figmaExampleModalBackdrop) {
    closeFigmaExampleModal.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeTopModal();
    });

    figmaExampleModalBackdrop.addEventListener('click', (e) => {
      if (e.target === figmaExampleModalBackdrop) {
        e.preventDefault();
        e.stopPropagation();
        closeTopModal();
      }
    });
  }

  // Function to open the Figma example modal
  function openFigmaExampleModal(imageSrc, title) {
    // Update modal content
    figmaExampleImage.src = imageSrc;
    figmaExampleImage.alt = title;
    document.getElementById('figma-example-modal-title').textContent = title;

    // Add to modal stack first
    modalStack.push({
      modal: figmaExampleModal,
      closeFn: closeFigmaExampleModalHandler
    });

    // Then show the modal
    figmaExampleModal.classList.add('active');
    figmaExampleModalBackdrop.classList.add('active');

    // Set focus to the close button for accessibility
    closeFigmaExampleModal.focus();
  }

  // Function to close the Figma example modal
  function closeFigmaExampleModalHandler() {
    // Check if this modal is actually open
    if (!figmaExampleModal || !figmaExampleModal.classList.contains('active')) {
      return false;
    }

    // Hide the modal
    figmaExampleModal.classList.remove('active');
    figmaExampleModalBackdrop.classList.remove('active');

    // Focus back to the link that opened this modal
    const activeElement = document.activeElement;
    if (activeElement && (activeElement === figmaPairedExampleLink || activeElement === figmaThemedExampleLink)) {
      activeElement.blur();
    }

    return true; // Indicate success
  }

  // --- Accessibility banner (Report link) ---
  const reportLink = document.getElementById('report-link');
  if (reportLink) {
    reportLink.addEventListener('click', (e) => {
      e.preventDefault();
      const contactTrigger = document.getElementById('contactRicardo');
      if (contactTrigger) {
        contactTrigger.click();
      }
    });
  }

  // ---- Collections Logic ----
  const collectionsContainer = document.getElementById('collections-section');

  // Defer initial render until all resources are loaded to prevent race conditions
  renderCollections();

  if (!window.__collectionsCrudModals) {
    window.__collectionsCrudModals = initCollectionsCrudModals();
  }

  // Create new collection
  document.getElementById('create-collection-btn').addEventListener('click', () => {
    if (window.__collectionsCrudModals?.openNewCollectionModal) {
      window.__collectionsCrudModals.openNewCollectionModal(document.getElementById('create-collection-btn'));
    }
  });

  // ---- Import Collections Modal ----
  const importModal = document.getElementById('import-modal');
  const importModalBackdrop = document.getElementById('import-modal-backdrop');
  const openImportModalBtn = document.getElementById('import-collections-btn');
  const closeImportModalBtn = document.getElementById('close-import-modal');
  const fileInput = document.getElementById('import-file-input');
  const importTextarea = document.getElementById('import-json-textarea');
  const importFromTextBtn = document.getElementById('import-from-textarea-btn');
  const importErrorEl = document.getElementById('import-modal-error');

  // Initialize import modal if elements exist
  if (importModal && importModalBackdrop && openImportModalBtn && closeImportModalBtn &&
      fileInput && importTextarea && importFromTextBtn && importErrorEl) {

    const setImportError = (message) => {
      const span = importErrorEl.querySelector('span');
      if (span) span.textContent = message || '';
      importErrorEl.classList.toggle('is-visible', Boolean(message));
    };

    const clearImportError = () => setImportError('');

    // Set up event listeners
    openImportModalBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openImportModal();
    });

    closeImportModalBtn.addEventListener('click', closeImportModal);
    importModalBackdrop.addEventListener('click', closeImportModal);

    importTextarea.addEventListener('input', clearImportError);

    // Handle file upload
    fileInput.addEventListener('change', (e) => {
      clearImportError();
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => importCollections(e.target.result);
        reader.readAsText(file);
      }
    });

    // Handle text import
    importFromTextBtn.addEventListener('click', () => {
      const jsonText = importTextarea.value.trim();
      if (jsonText) {
        importCollections(jsonText);
      } else {
        setImportError('Please paste your JSON data in the text area.');
      }
    });

  } else {
    console.error('One or more import modal elements are missing from the DOM');
  }

  function openImportModal() {
    openProgrammaticModal(importModal, importModalBackdrop, {
      focusEl: closeImportModalBtn,
      returnFocusEl: openImportModalBtn,
      onClose: () => {
        if (importErrorEl) importErrorEl.classList.remove('is-visible');
        const span = importErrorEl?.querySelector('span');
        if (span) span.textContent = '';
        importTextarea.value = '';
        fileInput.value = '';
      }
    });
  }

  function closeImportModal() {
    if (!importModal) return;
    if (modalStack.length > 0 && modalStack[modalStack.length - 1].modal === importModal) {
      closeTopModal();
    }
  }

  function importCollections(jsonString) {
    // Handle the backup format with *** delimiters by extracting the JSON part
    const delimiter = '***';
    const parts = jsonString.split(delimiter);

    // The JSON part will be the last part that's not empty after splitting by ***
    let jsonPart = '';
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i].trim();
      if (part && (part.startsWith('{') || part.startsWith('['))) {
        jsonPart = part;
        break;
      }
    }

    // If we found a JSON part, use it; otherwise, use the original string
    if (jsonPart) {
      jsonString = jsonPart;
    }

    // Handle the case where there might be instructions before the JSON
    if (jsonString.trim().startsWith('Instructions:')) {
      const jsonStart = jsonString.indexOf('{');
      if (jsonStart !== -1) {
        jsonString = jsonString.substring(jsonStart);
      }
    }

    try {
      const data = JSON.parse(jsonString);

      // Robust validation: Handle both an object with a 'collections' key and a root-level array.
      const importedCollections = Array.isArray(data.collections) ? data.collections : Array.isArray(data) ? data : null;

      if (!importedCollections) {
        const span = importErrorEl?.querySelector('span');
        if (importErrorEl && span) {
          span.textContent = 'Invalid JSON format. The file must contain an array of collections.';
          importErrorEl.classList.add('is-visible');
        }
        return;
      }

      const existingData = getCollections();
      const existingIds = new Set(existingData.collections.map(c => c.id));
      const existingNames = new Map(existingData.collections.map(c => [c.name.toLowerCase(), c.id]));
      let importedCount = 0;
      let duplicateFound = false;
      let duplicateCollectionName = '';
      let duplicateCollectionId = '';

      // First pass: Check for duplicates
      for (const collection of importedCollections) {
        const normalizedNewName = collection.name.toLowerCase();

        if (existingNames.has(normalizedNewName)) {
          duplicateFound = true;
          duplicateCollectionName = collection.name;
          duplicateCollectionId = existingNames.get(normalizedNewName);
          break;
        }
      }

      if (duplicateFound) {
        // Close the import modal
        closeImportModal();

        // Show alert about duplicate
        alert(`A collection with the name "${duplicateCollectionName}" already exists.`);

        // After alert is dismissed, scroll to and highlight the existing collection
        setTimeout(() => {
          const existingCollection = document.querySelector(`[data-collection-id="${duplicateCollectionId}"]`);
          if (existingCollection) {
            existingCollection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            existingCollection.classList.add('import-highlight');
            setTimeout(() => {
              existingCollection.classList.remove('import-highlight');
            }, 2000);
          }
        }, 100);

        return;
      }

      // If no duplicates, process the import
      for (const collection of importedCollections) {
        // Generate new ID to avoid conflicts
        const newId = generateId();
        collection.id = newId;

        // Generate new IDs for all colors
        if (collection.colors && Array.isArray(collection.colors)) {
          collection.colors = collection.colors.map(color => ({
            ...color,
            id: generateId()
          }));
        } else {
          collection.colors = [];
        }

        // Add to existing collections and track the name
        existingData.collections.push(collection);
        existingNames.set(collection.name.toLowerCase(), newId);
        importedCount++;
      }

      if (importedCount > 0) {
        saveCollections(existingData);
        renderCollections();
        closeImportModal();

        // Show success message
        if (importedCollections.length > 0) {
          const firstName = importedCollections[0].name;
          appToast.success(`Successfully imported collection "${firstName}"!`);
        }

        // Scroll to the last imported collection
        const collections = document.querySelectorAll('.collection-item');
        if (collections.length > 0) {
          const lastCollection = collections[collections.length - 1];
          lastCollection.scrollIntoView({ behavior: 'smooth', block: 'start' });

          // Add a temporary highlight to the imported collection
          lastCollection.classList.add('import-highlight');
          setTimeout(() => {
            lastCollection.classList.remove('import-highlight');
          }, 2000);
        }
      } else {
        closeImportModal();
      }

      // Clear the file input to allow re-importing the same file if needed
      const fileInput = document.getElementById('import-file-input');
      if (fileInput) {
        fileInput.value = '';
      }

    } catch (error) {
      console.error('Import error:', error);
      const msg = 'Error reading or parsing the JSON. Please ensure it is a valid file.\n\n' +
                  'If you are importing a backup file, please ensure it includes the complete JSON data.';
      const span = importErrorEl?.querySelector('span');
      if (importErrorEl && span) {
        span.textContent = msg;
        importErrorEl.classList.add('is-visible');
      }
    }
  }

  // Event listeners have already been set up above
  // This duplicate block has been removed to prevent multiple event listeners

  // ---- Add Color Shortcut Button Listener ----
  const addColorShortcutBtn = document.getElementById('add-color-shortcut-btn');
  if (addColorShortcutBtn) {
    addColorShortcutBtn.addEventListener('click', () => {
      const data = getCollections();
      const collections = data.collections;

      if (collections.length === 0) {
        alert('Please create a collection first to save your color.');
        document.getElementById('collections-section').scrollIntoView({ behavior: 'smooth' });
        return;
      }

      // If there are multiple collections, use the first one
      const collection = collections[0];
      // Scroll to the collections section so the user can see the color being added
      document.getElementById('collections-section').scrollIntoView({ behavior: 'smooth' });
      let rawUserInput = document.getElementById('colorInput').value.trim();

      // Handle hex values that might be missing the # prefix
      if (/^[0-9A-Fa-f]{6}$/.test(rawUserInput)) {
        rawUserInput = '#' + rawUserInput;
      }

      const processedColor = parseRgbInput(rawUserInput);
      const colorName = getAutoColorName(processedColor);
      let currentBaseColor;

      try {
        currentBaseColor = new Color(processedColor).toString({ format: "hex" });
      } catch (e) {
        // If parsing fails, try adding # prefix if it's missing
        if (!processedColor.startsWith('#') && /^[0-9A-Fa-f]{6}$/.test(processedColor)) {
          currentBaseColor = '#' + processedColor;
        } else {
          // If we still can't parse it, show an error and return
          showToast('Invalid color format. Please use a valid color name, hex, rgb, or hsl value.');
          return;
        }
      }

      const currentVibrancy = document.getElementById('vibrancy-boost-select').value;
      const currentDefaultMode = document.getElementById('defaultRampToggle').checked ? 'dark' : 'light';

      collection.colors.push({
        id: generateId(),
        name: colorName,
        base: currentBaseColor, // Save the consistent hex value
        vibrancy: parseInt(currentVibrancy, 10),
        defaultMode: currentDefaultMode
      });
      saveCollections(data);
      renderCollections();
      if (window.appToast && window.APP_TOAST_MESSAGES) {
        window.appToast.success(window.APP_TOAST_MESSAGES.colorAdded);
      } else if (window.showAppToast) {
        window.showAppToast('Color added successfully!');
      }
      // Also scroll to the collection to see the new color
      document.querySelector(`.collection-item[data-collection-id="${collection.id}"]`).scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // Handle clicks inside the collections container (delegated events)
  if (collectionsContainer) {
    collectionsContainer.addEventListener('click', (e) => {
      const data = getCollections();
      const collectionItem = e.target.closest('.collection-item');
      if (!collectionItem) return;
      const collectionId = collectionItem.dataset.collectionId;
      const collection = data.collections.find(c => c.id === collectionId);

      // Add Current Color to Collection
      if (e.target.classList.contains('btn-add-color')) {
        let rawUserInput = document.getElementById('colorInput').value.trim();

        // Handle hex values that might be missing the # prefix
        if (/^[0-9A-Fa-f]{6}$/.test(rawUserInput)) {
          rawUserInput = '#' + rawUserInput;
        }

        const processedColor = parseRgbInput(rawUserInput);
        const colorName = getAutoColorName(processedColor);
        let currentBaseColor;

        try {
          currentBaseColor = new Color(processedColor).toString({ format: "hex" });
        } catch (e) {
          // If parsing fails, try adding # prefix if it's missing
          if (!processedColor.startsWith('#') && /^[0-9A-Fa-f]{6}$/.test(processedColor)) {
            currentBaseColor = '#' + processedColor;
          } else {
            // If we still can't parse it, show an error and return
            showToast('Invalid color format. Please use a valid color name, hex, rgb, or hsl value.');
            return;
          }
        }

        const currentVibrancy = document.getElementById('vibrancy-boost-select').value;
        const currentDefaultMode = document.getElementById('defaultRampToggle').checked ? 'dark' : 'light';

        const newColor = {
          id: `color-${Date.now()}`,
          name: colorName,
          base: currentBaseColor,
          vibrancy: currentVibrancy,
          defaultMode: currentDefaultMode,
        };

        collection.colors.push(newColor);
        saveCollections(data);
        renderCollections();
        if (window.appToast && window.APP_TOAST_MESSAGES) {
          window.appToast.success(window.APP_TOAST_MESSAGES.colorAdded);
        } else if (window.showAppToast) {
          window.showAppToast('Color added successfully!');
        }
      }

      // --- In-context Editing ---

      const startEditing = (element, onSave) => {
        const currentName = element.textContent.trim();
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'edit-name-input'; // For styling

        element.replaceWith(input);
        input.focus();
        input.select();

        const save = () => {
          const newName = input.value.trim();
          if (newName && newName !== currentName) {
            onSave(newName);
          } else {
            renderCollections(); // Re-render to cancel if name is unchanged or empty
          }
        };

        input.addEventListener('blur', save);
        input.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            save();
          } else if (event.key === 'Escape') {
            renderCollections(); // Cancel edit
          }
        });
      };

      // Edit Collection Name - handle both direct clicks and icon clicks
      const collectionNameEl = e.target.closest('.collection-name') ||
                             (e.target.classList.contains('icon-edit') && e.target.closest('h3'));
      if (collectionNameEl) {
        const targetEl = collectionNameEl.classList.contains('collection-name') ?
                       collectionNameEl :
                       collectionNameEl.querySelector('.collection-name');

        if (targetEl) {
          startEditing(targetEl, (newName) => {
            collection.name = newName;
            saveCollections(data);
            renderCollections();
          });
        }
      }

      // Edit Color Name - handle both direct clicks and icon clicks
      const colorNameEl = e.target.closest('.collection-color-name') ||
                        (e.target.classList.contains('icon-edit') && e.target.closest('.color-item-header'));
      if (colorNameEl) {
        const colorItem = colorNameEl.closest('.collection-color-item');
        const targetEl = colorNameEl.classList.contains('collection-color-name') ?
                       colorNameEl :
                       colorNameEl.querySelector('.collection-color-name');

        if (colorItem && targetEl) {
          const colorId = colorItem.dataset.colorId;
          const colorToEdit = collection.colors.find(c => c.id === colorId);

          if (colorToEdit) {
            startEditing(targetEl, (newName) => {
              colorToEdit.name = newName;
              saveCollections(data);
              renderCollections();
            });
          }
        }
      }

      // Export Collection to JSON
      if (e.target.classList.contains('btn-export-collection')) {
        openExportModal(collection);
      }

      // Load Color
      const loadButton = e.target.closest('.btn-load-color');
      if (loadButton) {
        const colorItem = loadButton.closest('.collection-color-item');
        const colorId = colorItem.dataset.colorId;
        const colorToLoad = collection.colors.find(c => c.id === colorId);

        if (colorToLoad) {
          document.getElementById('colorInput').value = colorToLoad.base;
          document.getElementById('vibrancy-boost-select').value = colorToLoad.vibrancy;
          document.getElementById('defaultRampToggle').checked = (colorToLoad.defaultMode === 'dark');
          updateAll();
        }
      }

      // Delete Item (Unified Handler)
      const deleteButton = e.target.closest('.btn-delete');
      if (deleteButton) {
        const colorItem = deleteButton.closest('.collection-color-item');

        if (colorItem) {
          // Get the color name for the confirmation message
          const colorId = colorItem.dataset.colorId;
          const colorToDelete = collection.colors.find(c => c.id === colorId);

          if (colorToDelete) {
            if (window.__collectionsCrudModals?.openDeleteColorModal) {
              window.__collectionsCrudModals.openDeleteColorModal({
                message: `Are you sure you want to delete the color "${colorToDelete.name}"? This cannot be undone.`,
                collectionId,
                colorId,
                returnFocusEl: deleteButton
              });
            }
          }
        } else {
          // Delete an entire collection
          if (window.__collectionsCrudModals?.openDeleteCollectionModal) {
            window.__collectionsCrudModals.openDeleteCollectionModal({
              message: `Are you sure you want to delete the "${collection.name}" collection? This cannot be undone.`,
              collectionId,
              returnFocusEl: deleteButton
            });
          }
        }
      }

    });

    collectionsContainer.addEventListener('keydown', e => {
      if (e.key === 'Enter' && (e.target.classList.contains('collection-color-name') || e.target.classList.contains('collection-name'))) {
        e.preventDefault(); // Prevent default browser action
        e.target.click();   // Trigger the existing click handler to start editing
      }
    });

  }
});
