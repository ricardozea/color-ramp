// Using tinycolor loaded from HTML script tag

/* Color Ramp - using Tinycolor.js for HSL color space
   Author: Ricardo Zea - Sr. Web/Product Designer
   https://ricardozea.design
   Originally created on: 6/10/2025
*/

// The background animation is now handled by background.js

// Constants
const SCALES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

const BASE_SCALE = '500';
const LIGHT_MODE_BG = '#FFFFFF';
const DARK_MODE_BG = '#121212';
// DEFAULT_COLOR is already defined above, this was an erroneous duplicate addition.

const FLASHLIGHT_DARK_RAMP_SCALE = '200'; // Centralized scale for flashlight color from Dark Ramp

// Collections storage key - use a unique key for HSL collections
const COLLECTIONS_KEY = 'colorRampCollections_hsl';

const WHITE_HEX = '#ffffff';
const BLACK_HEX = '#000000';

const NEUTRAL_GRAY_LIGHTNESS_PROFILE = {
  '50': 0.98, '100': 0.96, '200': 0.91, '300': 0.84, '400': 0.67,
  '500': 0.46, '600': 0.34, '700': 0.26, '800': 0.17, '900': 0.10, '950': 0.03
};

const REVERSED_NEUTRAL_GRAY_LIGHTNESS_PROFILE = {
  '50': 0.03, '100': 0.10, '200': 0.17, '300': 0.26, '400': 0.34,
  '500': 0.46, '600': 0.67, '700': 0.84, '800': 0.91, '900': 0.96, '950': 0.98
};

// --- Utility Functions ---
/**
 * Smooth step interpolation function for creating smooth transitions
 * @param {number} t - Input value between 0 and 1
 * @returns {number} - Smoothed output value between 0 and 1
 */
function smoothStep(t) {
  // Clamp t to [0, 1]
  t = Math.max(0, Math.min(1, t));
  // Smooth step formula: 3t² - 2t³
  return t * t * (3 - 2 * t);
}

/**
 * Checks if a color string is valid and can be parsed by tinycolor.
 * @param {string} colorString - The color string to validate.
 * @returns {boolean} - True if the color is valid, false otherwise.
 */
function isValidColor(colorString) {
  return tinycolor(colorString).isValid();
}

/**
 * Determines the contrasting text color (black or white) for a given background color.
 * @param {Object} backgroundColor - A tinycolor object representing the background.
 * @returns {string} - '#0D0D0D' for black text or '#FFFFFF' for white text.
 */
function getContrastingTextColor(backgroundColor) {
  if (!backgroundColor || !backgroundColor.isValid()) {
    // console.warn('Invalid background color provided to getContrastingTextColor:', backgroundColor);
    return '#0D0D0D'; // Default to black if color is invalid
  }
  const black = '#0D0D0D';
  const white = '#FFFFFF';

  const readableWithBlack = tinycolor.isReadable(backgroundColor, black, { level: "AA", size: "small" });
  const readableWithWhite = tinycolor.isReadable(backgroundColor, white, { level: "AA", size: "small" });

  if (readableWithBlack && readableWithWhite) {
    // If both are readable, pick the one with higher contrast
    return tinycolor.readability(backgroundColor, black) > tinycolor.readability(backgroundColor, white) ? black : white;
  } else if (readableWithBlack) {
    return black;
  } else if (readableWithWhite) {
    return white;
  } else {
    // If neither is readable to AA, default to white on dark, black on light (fallback)
    return backgroundColor.getLuminance() > 0.5 ? black : white;
  }
}

/**
 * Generates a pure grayscale ramp with a specific base color at a specific scale.
 * All other shades are derived from a neutral gray lightness profile.
 * @param {string} targetBaseHex - The HEX string of the base color (e.g., '#ffffff').
 * @param {string} targetBaseScaleKey - The scale key where the targetBaseHex should be placed (e.g., '50').
 * @param {boolean} [useReversedProfile=false] - Whether to use the reversed lightness profile.
 * @returns {Object} - A ramp object with tinycolor objects.
 */
function generatePureGrayscaleRamp(targetBaseHex, targetBaseScaleKey, useReversedProfile = false) {
  const ramp = {};
  const profile = useReversedProfile ? REVERSED_NEUTRAL_GRAY_LIGHTNESS_PROFILE : NEUTRAL_GRAY_LIGHTNESS_PROFILE;
  SCALES.forEach(scaleKey => {
    if (scaleKey === targetBaseScaleKey) {
      ramp[scaleKey] = tinycolor(targetBaseHex);
    } else {
      ramp[scaleKey] = tinycolor({ h: 0, s: 0, l: profile[scaleKey] });
    }
  });
  return ramp;
}

// Text colors for contrast checking
const LIGHT_MODE_TEXT_COLORS = {
  50: '#000000',
  100: '#000000',
  200: '#000000',
  300: '#000000',
  400: '#000000',
  500: '#000000',
  600: '#FFFFFF',
  700: '#FFFFFF',
  800: '#FFFFFF',
  900: '#FFFFFF',
  950: '#FFFFFF'
};

const DARK_MODE_TEXT_COLORS = {
  50: '#FFFFFF',
  100: '#FFFFFF',
  200: '#FFFFFF',
  300: '#FFFFFF',
  400: '#FFFFFF',
  500: '#000000',
  600: '#000000',
  700: '#000000',
  800: '#000000',
  900: '#000000',
  950: '#000000'
};

// Default ramp mode (true = dark mode is default, false = light mode is default)
let isDarkModeDefault = false;

// Variable to store the dynamically determined base scale
let dynamicBaseScale = '500';

// One-time swatch load animation guard for HSL page
let hasAnimatedSwatchesHsl = false;

/**
 * Determine the best scale for a color based on its lightness
 * @param {Object} color - TinyColor object
 * @param {Boolean} isDarkMode - Whether we're generating a dark mode ramp
 * @returns {String} - The scale that best matches the color's lightness
 */
function determineBaseScale(color, isDarkMode = false) {
  const lightness = color.toHsl().l;

  // Define lightness ranges for each scale
  const lightModeScales = {
    '50': { min: 0.95, max: 1.00 },
    '100': { min: 0.90, max: 0.95 },
    '200': { min: 0.80, max: 0.90 },
    '300': { min: 0.70, max: 0.80 },
    '400': { min: 0.60, max: 0.70 },
    '500': { min: 0.50, max: 0.60 },
    '600': { min: 0.40, max: 0.50 },
    '700': { min: 0.30, max: 0.40 },
    '800': { min: 0.20, max: 0.30 },
    '900': { min: 0.10, max: 0.20 },
    '950': { min: 0.00, max: 0.10 }
  };

  const darkModeScales = {
    '950': { min: 0.95, max: 1.00 },
    '900': { min: 0.90, max: 0.95 },
    '800': { min: 0.80, max: 0.90 },
    '700': { min: 0.70, max: 0.80 },
    '600': { min: 0.60, max: 0.70 },
    '500': { min: 0.50, max: 0.60 },
    '400': { min: 0.40, max: 0.50 },
    '300': { min: 0.30, max: 0.40 },
    '200': { min: 0.20, max: 0.30 },
    '100': { min: 0.10, max: 0.20 },
    '50': { min: 0.00, max: 0.10 }
  };

  const scales = isDarkMode ? darkModeScales : lightModeScales;

  // Find the scale that matches the color's lightness
  for (const scale in scales) {
    const { min, max } = scales[scale];
    if (lightness >= min && lightness < max) {
      return scale;
    }
  }

  // Default to 500 if no match is found
  return '500';
}

/**
 * Debounce function to limit how often a function is called
 * @param {Function} func - The function to debounce
 * @param {Number} wait - The time to wait in milliseconds
 * @returns {Function} - The debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * Show a notification when a color is copied to clipboard, positioned above the clicked element.
 * @param {string} message - The message to show in the notification.
 * @param {HTMLElement} element - The element that was clicked to trigger the notification.
 */
/**
 * Show a notification when a color is copied to clipboard, positioned above the clicked element.
 * @param {string} message - The message to show in the notification.
 * @param {HTMLElement} element - The element that was clicked to trigger the notification.
 */
// ---------------- Tooltip / Toast Helper ----------------
// Match OKLCH app's tooltip behavior for consistency
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

// Legacy function kept for backward compatibility but delegates to showToast
function showCopiedNotification(message, element) {
  showToast(message, element);
}

/**
 * Update the refresh timestamp in the footer
 */
function updateRefreshTimestamp() {
  // Format current date and time
  const now = new Date();

  // Format date as M/D
  const month = now.getMonth() + 1; // getMonth() is zero-based
  const day = now.getDate();
  const dateString = `${month}/${day}`;

  // Format time as HH:MM:SS AM/PM
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12; // Convert to 12-hour format
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
  const timeString = `${formattedHours}:${formattedMinutes}:${formattedSeconds} ${ampm}`;

  // Update the timestamp element
  const timestampElement = document.getElementById('refresh-timestamp');
  if (timestampElement) {
    timestampElement.textContent = `Last update at ${timeString} on ${dateString}`;
  }
}

// Update timestamp on page load
window.addEventListener('load', () => {
  // Update the timestamp
  updateRefreshTimestamp();

  // Record the load time for future reference
  const currentTime = Date.now();
  sessionStorage.setItem('lastLoadTime', currentTime);
  sessionStorage.setItem('pageRefreshed', 'false');
});

/**
 * Parses a string to see if it's a simplified RGB value (e.g., "255, 100, 50" or "255 100 50").
 * If so, it formats it into a standard "rgb(r, g, b)" string.
 * @param {string} input - The input string to parse.
 * @returns {string} - The formatted RGB string or the original input if it's not a simplified RGB value.
 */
function parseRgbInput(input) {
  const trimmedInput = input.trim();

  // If it contains characters that are not digits, spaces, or commas, it's not a simple RGB value.
  if (/[^0-9\s,]/.test(trimmedInput)) {
    return input;
  }

  // Split by space or comma and filter out empty strings.
  const parts = trimmedInput.split(/[\s,]+/).filter(p => p.length > 0);

  if (parts.length === 0 || parts.length > 3) {
    return input; // Not a valid number of parts for RGB.
  }

  // Convert parts to numbers
  const numbers = parts.map(p => parseInt(p, 10));

  // Check if all numbers are valid (0-255)
  const areNumbersValid = numbers.every(n => !isNaN(n) && n >= 0 && n <= 255);
  if (!areNumbersValid) {
    return input;
  }

  let [r, g, b] = numbers;

  // Set default values for missing parts
  if (g === undefined) g = 255;
  if (b === undefined) b = 255;

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Generates a light mode color ramp based on a single base color.
 * @param {Object} baseColor - A tinycolor object for the base color.
 * @param {string} baseScale - The scale at which the base color is placed (e.g., '500').
 * @param {boolean} isDefault - Whether this ramp is the default for the UI.
 * @returns {Object} - A ramp object where keys are scales and values are tinycolor objects.
 */
function generateLightRamp(baseColor, baseScale, isDefault) {
  let ramp = {};
  const baseHsl = baseColor.toHsl();

  // Handle pure white, black, or gray cases
  if (baseColor.toHexString() === WHITE_HEX) {
    return generatePureGrayscaleRamp(WHITE_HEX, '50');
  } else if (baseColor.toHexString() === BLACK_HEX) {
    return generatePureGrayscaleRamp(BLACK_HEX, '950', true);
  } else if (baseHsl.s === 0) {
    const lightness = baseHsl.l;
    const closestScale = Object.keys(NEUTRAL_GRAY_LIGHTNESS_PROFILE).reduce((prev, curr) => {
      return (Math.abs(NEUTRAL_GRAY_LIGHTNESS_PROFILE[curr] - lightness) < Math.abs(NEUTRAL_GRAY_LIGHTNESS_PROFILE[prev] - lightness) ? curr : prev);
    });
    return generatePureGrayscaleRamp(baseColor.toHexString(), closestScale);
  }

  // Generate the ramp by adjusting lightness
  SCALES.forEach(scale => {
    const scaleIndex = SCALES.indexOf(scale);
    const baseIndex = SCALES.indexOf(baseScale);

    if (scale === baseScale) {
      ramp[scale] = baseColor;
    } else {
      const lightnessProfile = NEUTRAL_GRAY_LIGHTNESS_PROFILE;
      const targetLightness = lightnessProfile[scale];
      let newColorHsl = { h: baseHsl.h, s: baseHsl.s, l: targetLightness };

      // Adjust saturation for very light/dark colors to prevent graying
      if (targetLightness > 0.9) {
        newColorHsl.s = Math.max(baseHsl.s * 0.4, 0.1); // Reduce saturation but keep some color
      } else if (targetLightness < 0.1) {
        newColorHsl.s = Math.max(baseHsl.s * 0.6, 0.2);
      }

      ramp[scale] = tinycolor(newColorHsl);
    }
  });

  // Post-processing to ensure contrast and uniqueness
  ensureLightRamp950ContrastAndUniqueness(ramp, baseColor);
  guaranteeUniqueColors(ramp);

  return ramp;
}

/**
 * Generates a dark mode color ramp based on a single base color.
 * @param {Object} baseColor - A tinycolor object for the base color.
 * @param {string} baseScale - The scale at which the base color is placed.
 * @param {boolean} isDefault - Whether this ramp is the default for the UI.
 * @returns {Object} - A ramp object with tinycolor objects.
 */
function generateDarkRamp(baseColor, baseScale, isDefault) {
  let ramp = {};
  const baseHsl = baseColor.toHsl();

  // Handle pure white, black, or gray cases
  if (baseColor.toHexString() === WHITE_HEX) {
    return generatePureGrayscaleRamp(WHITE_HEX, '950');
  } else if (baseColor.toHexString() === BLACK_HEX) {
    return generatePureGrayscaleRamp(BLACK_HEX, '50', true);
  } else if (baseHsl.s === 0) {
    const lightness = baseHsl.l;
    const closestScale = Object.keys(REVERSED_NEUTRAL_GRAY_LIGHTNESS_PROFILE).reduce((prev, curr) => {
      return (Math.abs(REVERSED_NEUTRAL_GRAY_LIGHTNESS_PROFILE[curr] - lightness) < Math.abs(REVERSED_NEUTRAL_GRAY_LIGHTNESS_PROFILE[prev] - lightness) ? curr : prev);
    });
    return generatePureGrayscaleRamp(baseColor.toHexString(), closestScale, true);
  }

  // Generate ramp by adjusting lightness based on the reversed profile
  SCALES.forEach(scale => {
    if (scale === baseScale) {
      ramp[scale] = baseColor;
    } else {
      const lightnessProfile = REVERSED_NEUTRAL_GRAY_LIGHTNESS_PROFILE;
      const targetLightness = lightnessProfile[scale];
      let newColorHsl = { h: baseHsl.h, s: baseHsl.s, l: targetLightness };

      // In dark mode, saturation can be higher in lighter shades
      if (targetLightness > 0.8) {
        newColorHsl.s = Math.min(baseHsl.s * 1.2, 1);
      }

      ramp[scale] = tinycolor(newColorHsl);
    }
  });

  // Post-processing for dark mode specifics
  ensureDarkMode950IsLightest(ramp);
  guaranteeUniqueColors(ramp, true);

  return ramp;
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {

  let currentLightRamp = {}; // Initialize as empty objects
  let currentDarkRamp = {};

  // Get references to DOM elements
  const colorInput = document.getElementById('colorInput');
  const colorPreview = document.getElementById('colorPreview');
  const lightRampContainer = document.getElementById('lightRamp');
  const darkRampContainer = document.getElementById('darkRamp');
  const modeToggle = document.getElementById('defaultRampToggle');
  const pageTitle = document.querySelector('h1'); // Get the H1 element

  // Set up event listeners
  colorInput.addEventListener('input', debounce(() => {
    let rawInput = colorInput.value.trim();
    let processedColorString;

    if (rawInput === "") {
      processedColorString = "#000000"; // Default to black if input is empty
    } else {
      processedColorString = parseRgbInput(rawInput);
    }

    if (isValidColor(processedColorString)) { // Assuming isValidColor works with the string format from parseRgbInput
      const baseColor = tinycolor(processedColorString);
      colorPreview.style.backgroundColor = baseColor.toHexString();
      updateColorRamps(processedColorString);
    }
  }, 300));

  // Select all content when clicking on the input field
  colorInput.addEventListener('click', function () {
    this.select();
  });

  // Set up color swatch click handlers
  const colorSwatches = document.querySelectorAll('.color-swatch');
  colorSwatches.forEach(swatch => {
    swatch.addEventListener('click', function () {
      const colorName = this.getAttribute('data-color');
      colorInput.value = colorName; // Set the input field

      const processedColorString = colorName;

      // Update the color preview
      const baseColor = tinycolor(processedColorString);
      colorPreview.style.backgroundColor = baseColor.toHexString();

      // Update the color ramps
      if (isValidColor(processedColorString)) {
        updateColorRamps(processedColorString);
      }
    });
  });

  // Toggle between light and dark mode as default
  modeToggle.addEventListener('change', () => {
    isDarkModeDefault = modeToggle.checked;
    const processedColorString = colorInput.value;

    // Update ramps with new default mode
    if (isValidColor(processedColorString)) {
      updateColorRamps(processedColorString);
    }
  });

  // Check for a color in the URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const colorFromUrl = urlParams.get('color');
  const lastUsedColor = localStorage.getItem('lastUsedColor_hsl');

  let initialColor = '#04f700'; // Default color

  if (colorFromUrl) {
    const formattedColor = '#' + colorFromUrl.replace(/#/, '');
    if (isValidColor(formattedColor)) {
      initialColor = formattedColor;
      // Debug: Color loaded from URL parameter
    }
  } else if (lastUsedColor && isValidColor(lastUsedColor)) {
    initialColor = lastUsedColor;
    // Debug: Color loaded from localStorage
  }

  colorInput.value = initialColor;

  // Default Ramp Mode
  const rampModeFromUrl = urlParams.get('default-ramp');
  const lastRampMode = localStorage.getItem('defaultRampMode_hsl');
  let initialRampMode = 'light'; // Default ramp mode
  if (rampModeFromUrl) {
    initialRampMode = rampModeFromUrl;
  } else if (lastRampMode) {
    initialRampMode = lastRampMode;
  }
  document.getElementById('defaultRampToggle').checked = (initialRampMode === 'dark');
  isDarkModeDefault = (initialRampMode === 'dark'); // Sync state for initial ramp generation

  // Initialize the color preview
  const initialProcessedColor = colorInput.value;
  const baseColor = tinycolor(initialProcessedColor);
  colorPreview.style.backgroundColor = baseColor.toHexString();

  // Generate initial color ramps
  if (isValidColor(initialProcessedColor)) {
    updateColorRamps(initialProcessedColor);
  }

  // --- Toggle Switch Control for Default Ramp (Light/Dark) ---
  // The 'modeToggle' (defaultRampToggle checkbox) is the source of truth.
  // Clicking the 'Light' or 'Dark' labels will update the checkbox state,
  // which then triggers its own 'change' event listener to update ramps and save state.
  const switchLabelLight = document.getElementById('switchLabelLight');
  const switchLabelDark = document.getElementById('switchLabelDark');
  // 'modeToggle' (defaultRampToggle) should be defined earlier in the DOMContentLoaded scope.

  if (switchLabelLight && switchLabelDark && modeToggle) {
    switchLabelLight.addEventListener('click', () => {
      if (modeToggle.checked) { // If currently dark, switch to light
        modeToggle.checked = false;
        const event = new Event('change', { bubbles: true });
        modeToggle.dispatchEvent(event);
      }
    });

    switchLabelDark.addEventListener('click', () => {
      if (!modeToggle.checked) { // If currently light, switch to dark
        modeToggle.checked = true;
        const event = new Event('change', { bubbles: true });
        modeToggle.dispatchEvent(event);
      }
    });

    // The main 'change' listener for modeToggle (defined elsewhere, typically handling
    // localStorage and updateColorRamps) will manage the actual mode switching logic.
    // No need for a separate visual update function here as the CSS handles the switch appearance.

    // Ensure the switch visually reflects the loaded state (e.g., from localStorage)
    // This is typically handled by the main 'change' listener or initial setup for modeToggle.checked.

  } else {
    console.error('Switch labels or modeToggle not found. Verify HTML IDs.');
  }
  // --- End Toggle Switch Control Logic ---

  // Modal elements and logic
  const helpIcon = document.getElementById('help');
  const helpModal = document.getElementById('helpModal');
  const helpModalBackdrop = document.getElementById('helpModalBackdrop');
  const closeHelpModalBtn = document.getElementById('closeHelpModal');

  function openHelpModal() {
    if (helpModal && helpModalBackdrop) {
      helpModal.classList.add('active');
      helpModalBackdrop.classList.add('active');
      document.body.classList.add('modal-open'); // Prevent background scroll
      if (closeHelpModalBtn) closeHelpModalBtn.focus(); // Focus on close button for accessibility
    }
  }

  function closeHelpModal() {
    if (helpModal && helpModalBackdrop) {
      helpModal.classList.remove('active');
      helpModalBackdrop.classList.remove('active');
      document.body.classList.remove('modal-open');
      if (helpIcon) helpIcon.blur(); // Remove focus from the help icon to return it to normal state
    }
  }

  if (helpIcon) {
    helpIcon.addEventListener('click', (event) => {
      event.preventDefault(); // It's an anchor tag
      openHelpModal();
    });
  }

  if (closeHelpModalBtn) {
    closeHelpModalBtn.addEventListener('click', closeHelpModal);
  }

  if (helpModalBackdrop) {
    helpModalBackdrop.addEventListener('click', closeHelpModal);
  }

  // Add ESC key listener for Help modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && helpModal && helpModal.classList.contains('active')) {
      closeHelpModal();
    }
  });

  // --- Accessibility banner (Report link) ---
  const reportLink = document.getElementById('report-link');
  if (reportLink) {
    reportLink.addEventListener('click', (event) => {
      event.preventDefault();
      const contactTrigger = document.getElementById('contactRicardo');
      if (contactTrigger) {
        contactTrigger.click();
      }
    });
  }

  // Close modal with Escape key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (helpModal && helpModal.classList.contains('active')) {
        closeHelpModal();
      }
      // contact form modal is handled by footer-loader
    }
  });

  // Initial call for any static Lucide icons on the page
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

});  // End of DOMContentLoaded event listener



/**
 * Radical solution to ensure absolute uniqueness of all colors across both ramps
 * This function will detect and fix any duplicate colors with increasingly aggressive methods
 * @param {Object} lightRamp - The light mode color ramp
 * @param {Object} darkRamp - The dark mode color ramp
 * @returns {Object} - Object containing deduplicated light and dark ramps
 */
function guaranteeUniqueColors(lightRamp, darkRamp) {
  // Debug: Ensuring color uniqueness across ramps

  // Step 1: Create a map of all existing colors for tracking
  const colorMap = new Map();
  const allColors = [];

  // Helper function to add a color to our tracking structures
  function trackColor(color, rampType, scale) {
    const hex = color.toHexString();
    const info = { hex, rampType, scale, color };
    colorMap.set(hex, info);
    allColors.push(info);
  }

  // Track all light ramp colors
  SCALES.forEach(scale => {
    if (lightRamp[scale]) {
      trackColor(lightRamp[scale], 'light', scale);
    }
  });

  // Track all dark ramp colors
  SCALES.forEach(scale => {
    if (darkRamp[scale]) {
      trackColor(darkRamp[scale], 'dark', scale);
    }
  });

  // Step 2: Find and fix duplicates
  const seen = new Set();
  const duplicates = [];

  allColors.forEach(info => {
    if (seen.has(info.hex)) {
      duplicates.push(info);
    } else {
      seen.add(info.hex);
    }
  });

  // If there are duplicates, fix them
  if (duplicates.length > 0) {
    duplicates.forEach(info => {
      const { rampType, scale, color } = info;
      const scaleNum = parseInt(scale);
      const hsl = color.toHsl();

      // Check if this is a grayscale color
      const isGrayscale = hsl.s < 0.05;

      // Determine which direction to adjust based on scale and ramp type
      let lightnessAdjustment, saturationAdjustment, hueAdjustment;

      if (rampType === 'light') {
        // For light ramp: lower scales get lighter, higher scales get darker
        lightnessAdjustment = scaleNum <= 500 ? 0.1 : -0.1;
        saturationAdjustment = scaleNum <= 500 ? -0.1 : 0.1;
      } else {
        // For dark ramp: higher scales get lighter, lower scales get darker
        lightnessAdjustment = scaleNum >= 500 ? 0.1 : -0.1;
        saturationAdjustment = scaleNum >= 500 ? -0.1 : 0.1;
      }

      // Try increasingly aggressive adjustments until we get a unique color
      let newColor = color;
      let newHex = info.hex;
      let attempts = 0;
      const maxAttempts = 10;

      while (seen.has(newHex) && attempts < maxAttempts) {
        attempts++;

        if (isGrayscale) {
          // For grayscale colors, ONLY adjust lightness
          const currentLightnessAdjustment = lightnessAdjustment * attempts * 0.01;
          const newLightness = Math.max(0.10, Math.min(0.985, hsl.l + currentLightnessAdjustment));
          newColor = tinycolor({ h: 0, s: 0, l: newLightness });
        } else {
          // For colored inputs, adjust saturation and hue as before
          const currentLightnessAdjustment = lightnessAdjustment * attempts;
          const currentSaturationAdjustment = saturationAdjustment * (attempts > 3 ? (attempts - 2) : 0);
          hueAdjustment = attempts > 6 ? (attempts - 5) * 5 : 0;

          const newLightness = Math.max(0.05, Math.min(0.95, hsl.l + currentLightnessAdjustment));
          const newSaturation = Math.max(0.05, Math.min(0.95, hsl.s + currentSaturationAdjustment));
          const newHue = (hsl.h + hueAdjustment) % 360;

          newColor = tinycolor({ h: newHue, s: newSaturation, l: newLightness });
        }

        newHex = newColor.toHexString();
      }

      // If we still have a duplicate after max attempts, use a nuclear option
      if (seen.has(newHex)) {
        if (isGrayscale) {
          // For grayscale, just use a random lightness
          const newLightness = rampType === 'light' ?
            (scaleNum <= 500 ? 0.8 + (Math.random() * 0.15) : 0.1 + (Math.random() * 0.2)) :
            (scaleNum >= 500 ? 0.7 + (Math.random() * 0.28) : 0.1 + (Math.random() * 0.2));
          newColor = tinycolor({ h: 0, s: 0, l: Math.min(0.985, newLightness) });
        } else {
          // Nuclear option for colored inputs
          const hueShift = 30 + (Math.random() * 60);
          const newHue = (hsl.h + hueShift) % 360;
          const newSaturation = 0.5 + (Math.random() * 0.4);
          const newLightness = rampType === 'light' ?
            (scaleNum <= 500 ? 0.8 + (Math.random() * 0.15) : 0.1 + (Math.random() * 0.2)) :
            (scaleNum >= 500 ? 0.8 + (Math.random() * 0.15) : 0.1 + (Math.random() * 0.2));

          newColor = tinycolor({ h: newHue, s: newSaturation, l: newLightness });
        }
        newHex = newColor.toHexString();
      }

      // Update the color in the appropriate ramp
      if (rampType === 'light') {
        lightRamp[scale] = newColor;
      } else {
        darkRamp[scale] = newColor;
      }

      // Add the new color to our seen set
      seen.add(newHex);
    });
  } else {
    // Debug: No duplicate colors found
  }

  // The 'seen' set now contains all unique hex codes from both ramps.
  return { lightRamp, darkRamp, seenSet: seen };
}

/**
 * Ensures that the 950 shade in the light ramp has a higher contrast ratio than the 900 shade,
 * and that the 950 shade remains unique.
 * @param {Object} lightRamp - The light mode color ramp, already de-duplicated by guaranteeUniqueColors.
 * @param {Set<string>} seenHexSet - A set of all unique hex codes from both ramps.
 * @returns {Object} - The modified lightRamp.
 */
function ensureLightRamp950ContrastAndUniqueness(lightRamp, seenHexSet) {
  if (!lightRamp['950'] || !lightRamp['900']) {
    console.warn('Light ramp 950 or 900 not found, skipping terminal contrast adjustment.');
    return lightRamp;
  }

  const bgLight = tinycolor(LIGHT_MODE_BG);
  let color950 = lightRamp['950'];
  const color900 = lightRamp['900'];
  const originalHex950 = color950.toHexString();
  let contrast950 = tinycolor.readability(bgLight, color950);
  const contrast900 = tinycolor.readability(bgLight, color900);

  if (contrast950 <= contrast900) {
    let hsl950 = color950.toHsl();
    let attempts = 0;
    const maxContrastAttempts = 15;

    while (contrast950 <= contrast900 && attempts < maxContrastAttempts) {
      attempts++;
      hsl950.l = Math.max(0.01, hsl950.l - (0.005 + 0.001 * attempts)); // Gradually decrease lightness
      hsl950.s = Math.min(1.0, hsl950.s + (0.002 + 0.0005 * attempts)); // Slightly increase saturation
      color950 = tinycolor(hsl950);
      contrast950 = tinycolor.readability(bgLight, color950);
      console.log(`  Contrast Attempt ${attempts}: Light 950 to L:${hsl950.l.toFixed(3)}, S:${hsl950.s.toFixed(3)}. New Contrast: ${contrast950.toFixed(2)}`);
    }
    lightRamp['950'] = color950;
    if (contrast950 > contrast900) {
      console.log(`  Light Ramp: Successfully adjusted 950 contrast. Final: ${contrast950.toFixed(2)}`);
    } else {
      console.warn(`  Light Ramp: Could not sufficiently adjust 950 contrast. Final: ${contrast950.toFixed(2)}`);
    }
  }

  // Uniqueness check for the (potentially) modified color950
  const finalAdjustedHex950 = color950.toHexString();

  // If 950 changed, remove its original hex from seen set (if it was there) and check new one.
  if (finalAdjustedHex950 !== originalHex950) {
    seenHexSet.delete(originalHex950);
  }

  if (seenHexSet.has(finalAdjustedHex950)) {
    let uniqueAttempts = 0;
    const maxUniqueAttempts = 10;
    let current950ForUniqueness = color950.clone();
    let currentHexForUniqueness = finalAdjustedHex950;

    while (seenHexSet.has(currentHexForUniqueness) && uniqueAttempts < maxUniqueAttempts) {
      uniqueAttempts++;
      let hsl = current950ForUniqueness.toHsl();
      // Try small hue shift first, then tiny lightness adjustment if hue shift fails
      if (uniqueAttempts <= 5) {
        hsl.h = (hsl.h + uniqueAttempts * 2) % 360;
      } else {
        // Try to adjust lightness slightly, ensuring it doesn't make contrast worse than 900
        // This is a delicate balance: aim for darker if possible
        const L_ADJUST = 0.002 * (uniqueAttempts - 5);
        const potentialLighterL = Math.min(0.99, hsl.l + L_ADJUST);
        const potentialDarkerL = Math.max(0.01, hsl.l - L_ADJUST);

        const colorTryDarker = tinycolor({ ...hsl, l: potentialDarkerL });
        const contrastTryDarker = tinycolor.readability(bgLight, colorTryDarker);

        if (contrastTryDarker > contrast900) {
          hsl.l = potentialDarkerL;
        } else {
          // Fallback: if making it darker hurts contrast too much, try making it slightly lighter
          // Or, if it was already very dark, a tiny bit lighter might be okay.
          hsl.l = potentialLighterL;
        }
      }
      current950ForUniqueness = tinycolor(hsl);
      currentHexForUniqueness = current950ForUniqueness.toHexString();
    }

    if (seenHexSet.has(currentHexForUniqueness)) {
      let hsl = current950ForUniqueness.toHsl();
      hsl.h = (hsl.h + Math.random() * 10 - 5) % 360;
      hsl.s = Math.max(0.05, Math.min(0.95, hsl.s + Math.random() * 0.1 - 0.05));
      // Try to keep lightness dark for 950
      hsl.l = Math.max(0.01, Math.min(0.3, hsl.l + Math.random() * 0.02 - 0.01));
      current950ForUniqueness = tinycolor(hsl);
      currentHexForUniqueness = current950ForUniqueness.toHexString();
    }

    lightRamp['950'] = current950ForUniqueness;
    color950 = current950ForUniqueness; // update color950 to the latest unique version
  }

  // Add the final version of 950's hex to the seen set
  seenHexSet.add(color950.toHexString());

  return lightRamp;
}

/**
 * Generates a pure grayscale ramp with a specific base color at a specific scale.
 * All other shades are derived from a neutral gray lightness profile.
 * @param {string} targetBaseHex - The HEX string of the base color (e.g., '#ffffff').
 * @param {string} targetBaseScaleKey - The scale key where the targetBaseHex should be placed (e.g., '50').
 * @param {boolean} [useReversedProfile=false] - Whether to use the reversed lightness profile.
 * @returns {Object} - A ramp object with tinycolor objects.
 */
function generatePureGrayscaleRamp(targetBaseHex, targetBaseScaleKey, useReversedProfile = false) {
  const ramp = {};
  const profile = useReversedProfile ? REVERSED_NEUTRAL_GRAY_LIGHTNESS_PROFILE : NEUTRAL_GRAY_LIGHTNESS_PROFILE;
  SCALES.forEach(scaleKey => {
    if (scaleKey === targetBaseScaleKey) {
      ramp[scaleKey] = tinycolor(targetBaseHex);
    } else {
      ramp[scaleKey] = tinycolor({ h: 0, s: 0, l: profile[scaleKey] });
    }
  });
  return ramp;
}

/**
 * Adjusts the 100 shade in the dark ramp to create a smoother lightness transition
 * between the 50, 100, and 200 shades. It positions L(100) proportionally
 * between L(50) and L(200), ensuring it remains distinctly lighter than L(50)
 * and distinctly darker than L(200).
 * @param {Object} darkRamp - The dark mode color ramp.
 * @returns {Object} - The modified darkRamp.
 */
function adjustDarkRamp100Shade(darkRamp) {
  const color50 = darkRamp['50'];
  const color100_obj = darkRamp['100']; // Use a different name to avoid confusion with its HSL properties
  const color200 = darkRamp['200'];

  if (!color50 || !color100_obj || !color200) {
    return darkRamp;
  }

  const l50 = color50.toHsl().l;
  const l100_initial = color100_obj.toHsl().l;
  const l200 = color200.toHsl().l;


  // Position L100 proportionally: 1/3rd of the way from L50 to L200
  const rawTargetL100 = l50 + (l200 - l50) * 0.33;
  let targetL100 = rawTargetL100;

  // Define strict separation bounds for L100
  const minL100_bound = l50 + 0.015; // Must be at least 1.5% lighter than L50
  const maxL100_bound = l200 - 0.015; // Must be at least 1.5% darker than L200

  // Clamp the targetL100 to these separation bounds
  targetL100 = Math.max(minL100_bound, targetL100);
  targetL100 = Math.min(maxL100_bound, targetL100);

  // Ensure targetL100 is within absolute valid lightness range
  targetL100 = Math.max(0.001, Math.min(0.999, targetL100));

  // Only apply if the bounds are valid and the change is significant
  if (maxL100_bound > minL100_bound && Math.abs(l100_initial - targetL100) > 0.001) {
    const originalHsl100 = color100_obj.toHsl();
    darkRamp['100'] = tinycolor({ ...originalHsl100, l: targetL100 });
  }
  return darkRamp;
}

/**
 * Creates a slightly varied base color for the non-default ramp.
 * @param {tinycolor} originalBaseColor - The original input base color.
 * @param {boolean} isVariationForLightRamp - True if the variation is for the light ramp's base, false for dark ramp's base.
 * @returns {tinycolor} - The varied color.
 */
function createVariedBaseColor(originalBaseColor, isVariationForLightRamp) {
  const hsl = originalBaseColor.toHsl();
  if (isVariationForLightRamp) { // Dark is default, creating variation for Light ramp's base
    hsl.l = Math.min(0.95, hsl.l + 0.03); // Slightly lighter
    hsl.s = Math.min(1.00, hsl.s + 0.03); // Slightly more saturated
  } else { // Light is default, creating variation for Dark ramp's base
    hsl.l = Math.max(0.05, hsl.l - 0.03); // Slightly darker
    hsl.s = Math.max(0.00, hsl.s - 0.03); // Slightly less saturated
  }
  if (isNaN(hsl.h) && originalBaseColor.toHsl().s === 0) {
    hsl.h = originalBaseColor.toHsl().h;
  } else if (isNaN(hsl.h)) {
    hsl.h = 0;
  }

  const variedColor = tinycolor(hsl);
  if (originalBaseColor.toHsl().s < 0.01) {
    const variedHsl = variedColor.toHsl();
    const originalHue = originalBaseColor.toHsl().h;
    return tinycolor({ h: (isNaN(originalHue) ? 0 : originalHue), s: 0, l: variedHsl.l });
  }
  return variedColor;
}

/**
 * Globally lightens all shades in the dark ramp by a small amount.
 * @param {Object} darkRamp - The dark mode color ramp.
 * @param {boolean} isDefaultDarkRamp - Whether the dark ramp is the default one.
 * @param {string} baseScaleOfDefaultDarkRamp - The scale of the base color if dark ramp is default.
 * @param {number} [amount=0.01] - The amount to increase lightness by (0.0 to 1.0).
 * @returns {Object} - The modified darkRamp with lighter shades.
 */
function globallyLightenDarkRamp(darkRamp, isDefaultDarkRamp, baseScaleOfDefaultDarkRamp, amount = 0.01) {
  const lightenedDarkRamp = {};
  for (const scale in darkRamp) {
    if (Object.hasOwnProperty.call(darkRamp, scale)) {
      const color = darkRamp[scale];
      if (isDefaultDarkRamp && scale === baseScaleOfDefaultDarkRamp) {
        lightenedDarkRamp[scale] = color;
      } else {
        const originalHsl = color.toHsl();
        let newLightness = originalHsl.l + amount;

        // Check if this is a grayscale color
        const isGrayscale = originalHsl.s < 0.05;

        if (newLightness >= 0.99) { // Check if new lightness is approaching or exceeding 99%
          if (isGrayscale) {
            // For grayscale colors, cap just below pure white to avoid #FFF
            lightenedDarkRamp[scale] = tinycolor({ h: 0, s: 0, l: 0.985 });
          } else if (originalHsl.s >= 0.05) { // If it's a colored input
            // Cap lightness at 0.99 for colored inputs to prevent becoming pure white
            lightenedDarkRamp[scale] = tinycolor({ h: originalHsl.h, s: originalHsl.s, l: Math.min(0.99, newLightness) });
          } else { // Near-grayscale but not reaching full white (e.g. L=0.99 for a gray)
            lightenedDarkRamp[scale] = tinycolor({ h: originalHsl.h, s: originalHsl.s, l: Math.min(0.99, newLightness) });
          }
        } else { // If newLightness is safely below 0.99
          if (isGrayscale) {
            // Ensure grays remain pure and cap at our max range
            lightenedDarkRamp[scale] = tinycolor({ h: 0, s: 0, l: Math.min(0.985, newLightness) });
          } else {
            lightenedDarkRamp[scale] = tinycolor({ h: originalHsl.h, s: originalHsl.s, l: newLightness });
          }
        }
      }
    }
  }
  return lightenedDarkRamp;
}

/**
 * Update the color ramps based on the input color
 */
function updateColorRamps(baseColorString) {
  const baseColor = tinycolor(baseColorString);
  const flashlightColor = baseColor.toHexString();
  if (baseColor.isValid()) {
    const hexColor = baseColor.toHexString();
    const hexValue = hexColor.replace('#', '');

    // --- State Persistence: URL & localStorage ---
    const url = new URL(window.location);
    const rampToggle = document.getElementById('defaultRampToggle');

    // 1. Update and save color
    url.searchParams.set('color', hexValue);
    localStorage.setItem('lastUsedColor_hsl', hexColor);

    // 2. Update and save ramp mode
    if (rampToggle) {
      const rampMode = rampToggle.checked ? 'dark' : 'light';
      url.searchParams.set('default-ramp', rampMode);
      localStorage.setItem('defaultRampMode_hsl', rampMode);
    }

    // 3. Update browser history
    window.history.pushState({}, '', url);
  }

  // --- Form Population ---
  const baseColorInput = document.getElementById('base-color-input');
  const failedColorInput = document.getElementById('failed-color-input');
  if (baseColorInput) {
    baseColorInput.value = ''; // Clear previous base color
  }
  if (failedColorInput) {
    failedColorInput.value = ''; // Clear previous failed colors
  }
  let failedColors = [];
  // --- End Form Population ---
  // Hide accessibility banner at start of ramp generation
  const accessibilityBanner = document.getElementById('accessibility-banner');
  if (accessibilityBanner && !window.__devForceAccessibilityBanner) {
    accessibilityBanner.style.display = 'none';
  }
  const isGray = baseColor.toHsl().s < 0.01;

  // Special handling for pure white or pure black inputs
  if (baseColor.toHexString() === WHITE_HEX || baseColor.toHexString() === BLACK_HEX) {
    let lightRamp, darkRamp, lightBaseScale, darkBaseScale;

    if (baseColor.toHexString() === WHITE_HEX) {
      lightRamp = generatePureGrayscaleRamp(WHITE_HEX, '50', false); // Light ramp UI: light to dark
      let tempDarkRamp = generatePureGrayscaleRamp(WHITE_HEX, '950', true);   // Dark ramp UI: dark to light (reversed profile)
      lightBaseScale = '50';
      darkBaseScale = '950';
      // Make the dark UI ramp shades (except base) slightly lighter
      darkRamp = globallyLightenDarkRamp(tempDarkRamp, true, darkBaseScale, 0.015);
    } else { // BLACK_HEX
      lightRamp = generatePureGrayscaleRamp(BLACK_HEX, '950', false); // Light ramp UI: light to dark
      let tempDarkRamp = generatePureGrayscaleRamp(BLACK_HEX, '50', true);    // Dark ramp UI: dark to light (reversed profile)
      lightBaseScale = '950';
      darkBaseScale = '50';
      // Make the dark UI ramp shades (except base) slightly lighter
      darkRamp = globallyLightenDarkRamp(tempDarkRamp, true, darkBaseScale, 0.015);
    }

    // Populate text color maps for these pure ramps
    for (const scale in lightRamp) {
      LIGHT_MODE_TEXT_COLORS[scale] = getContrastingTextColor(lightRamp[scale]);
    }
    for (const scale in darkRamp) {
      DARK_MODE_TEXT_COLORS[scale] = getContrastingTextColor(darkRamp[scale]);
    }

    // Update background animation colors for pure white/black case
    if (window.canvas && typeof window.canvas.updateColors === 'function') {
      const darkRampArray = [
        darkRamp['300']?.toHexString() || '#000000',
        darkRamp['400']?.toHexString() || '#000000',
        darkRamp['500']?.toHexString() || '#000000',
        darkRamp['600']?.toHexString() || '#000000',
        darkRamp['700']?.toHexString() || '#000000',
      ];
      window.canvas.updateColors({ darkRamp: darkRampArray, flashlight: flashlightColor });
      // Use the 800 scale from the dark ramp for the dynamic color to ensure readability
      const dynamicColor = darkRamp['800'] ? darkRamp['800'].toHexString() : '#ffffff';
      document.body.style.setProperty('--dynamic-color', dynamicColor);
    }

    // Keep modal/input theming in sync even when bypassing the normal pipeline.
    // Use the 900 shade of the Light mode ramp for a dark modal/input background.
    const modalBgColor = lightRamp['900'] ? lightRamp['900'].toHexString() : '#111111';
    const modalTextColor = lightRamp['50'] ? lightRamp['50'].toHexString() : '#ffffff';
    document.documentElement.style.setProperty('--modal-bg-color', modalBgColor);
    document.documentElement.style.setProperty('--modal-text-color', modalTextColor);

    const inputBgColor = lightRamp['200'] ? lightRamp['200'].toHexString() : '#EEEEEE';
    const inputTextColor = '#000000';
    document.documentElement.style.setProperty('--input-bg-color', inputBgColor);
    document.documentElement.style.setProperty('--input-text-color', inputTextColor);

    // Keep Default Ramp Mode switch theming in sync for pure white/black.
    const knobLightColor = darkRamp['100'] ? darkRamp['100'].toHexString() : '#0D0D0D';
    const knobDarkColor = lightRamp['200'] ? lightRamp['200'].toHexString() : '#FFFFFF';
    document.documentElement.style.setProperty('--knob-light-mode-color', knobLightColor);
    document.documentElement.style.setProperty('--knob-dark-mode-color', knobDarkColor);

    const switchBgLightColor = lightRamp['200'] ? lightRamp['200'].toHexString() : '#EEEEEE';
    const switchBgDarkColor = darkRamp['100'] ? darkRamp['100'].toHexString() : '#333333';
    document.documentElement.style.setProperty('--switch-bg-light-mode-color', switchBgLightColor);
    document.documentElement.style.setProperty('--switch-bg-dark-mode-color', switchBgDarkColor);

    updateRampUI('lightRamp', lightRamp, LIGHT_MODE_TEXT_COLORS, lightBaseScale, failedColors);
    updateRampUI('darkRamp', darkRamp, DARK_MODE_TEXT_COLORS, darkBaseScale, failedColors);

    // After first full render, prevent re-animation
    if (!hasAnimatedSwatchesHsl) {
      hasAnimatedSwatchesHsl = true;
    }

    if (failedColors.length > 0) {
      if (baseColorInput) {
        baseColorInput.value = baseColor.toHexString();
      }
      if (failedColorInput) {
        failedColorInput.value = [...new Set(failedColors)].join(', ');
      }
    }
    updateRefreshTimestamp();
    return; // Bypass the rest of the pipeline for pure white/black
  }

  const defaultRampToggle = document.getElementById('defaultRampToggle');
  if (!defaultRampToggle) {
    console.error('defaultRampToggle element not found in updateColorRamps');
  }
  const isDarkModeDefault = defaultRampToggle.checked;

  let lightRampGenerated, darkRampGenerated;
  let actualLightBaseScale, actualDarkBaseScale;



  if (isDarkModeDefault) {
    // DARK MODE IS DEFAULT - Generate dark ramp with exact base color
    // First, determine the best scale for the base color in dark mode
    const darkBaseScale = determineBaseScale(baseColor, true);

    // Generate the dark ramp with the exact base color at the determined scale
    darkRampGenerated = generateDarkRampWithExactBase(baseColor);
    actualDarkBaseScale = darkBaseScale;

    // For the light ramp, create a slightly varied version of the base color
    // that ensures good contrast and visibility in light mode
    const lightBaseForGen = createVariedBaseColor(baseColor, true);

    // Determine the best scale for this varied color in light mode
    const lightBaseScale = determineBaseScale(lightBaseForGen, false);

    // Generate light ramp with the varied base color
    lightRampGenerated = generateLightRampWithExactBase(lightBaseForGen);
    actualLightBaseScale = lightBaseScale;

    // Ensure the base color is exactly preserved in the dark ramp
    if (darkRampGenerated[actualDarkBaseScale]) {
      darkRampGenerated[actualDarkBaseScale] = baseColor.clone();

      // Ensure smooth transitions from the base color to other shades
      const baseHsl = baseColor.toHsl();
      const scales = Object.keys(darkRampGenerated).sort((a, b) => parseInt(a) - parseInt(b));
      const baseIndex = scales.indexOf(actualDarkBaseScale);

      // Adjust shades lighter than base
      for (let i = baseIndex + 1; i < scales.length; i++) {
        const scale = scales[i];
        const scaleHsl = darkRampGenerated[scale].toHsl();
        // Ensure smooth lightness progression
        const minLightness = baseHsl.l + (i - baseIndex) * 0.04;
        if (scaleHsl.l < minLightness) {
          darkRampGenerated[scale] = tinycolor({
            h: scaleHsl.h,
            s: scaleHsl.s,
            l: minLightness
          });
        }
      }

      // Adjust shades darker than base
      for (let i = baseIndex - 1; i >= 0; i--) {
        const scale = scales[i];
        const scaleHsl = darkRampGenerated[scale].toHsl();
        // Ensure smooth darkness progression
        const maxLightness = baseHsl.l - (baseIndex - i) * 0.05;
        if (scaleHsl.l > maxLightness) {
          darkRampGenerated[scale] = tinycolor({
            h: scaleHsl.h,
            s: scaleHsl.s,
            l: maxLightness
          });
        }
      }
    }
  } else {
    // LIGHT MODE IS DEFAULT
    const lightBaseForGen = baseColor.clone();

    lightRampGenerated = generateLightRampWithExactBase(lightBaseForGen);
    actualLightBaseScale = dynamicBaseScale;

    // For dark mode, use the original base color and let the ramp generation handle the scaling
    darkRampGenerated = generateDarkRampWithExactBase(baseColor);

    // Find the scale in the dark ramp that's closest to the base color
    let minDiff = Infinity;
    let closestScale = '500';

    Object.entries(darkRampGenerated).forEach(([scale, color]) => {
      // Calculate perceptual difference using brightness and hue
      const baseHsl = baseColor.toHsl();
      const rampHsl = color.toHsl();
      const brightnessDiff = Math.abs(baseHsl.l - rampHsl.l);
      const hueDiff = Math.min(
        Math.abs(baseHsl.h - rampHsl.h),
        360 - Math.abs(baseHsl.h - rampHsl.h)
      ) / 180; // Normalize to 0-1

      const totalDiff = brightnessDiff * 0.7 + hueDiff * 0.3;

      if (totalDiff < minDiff) {
        minDiff = totalDiff;
        closestScale = scale;
      }
    });

    actualDarkBaseScale = closestScale;
  }

  // --- Start of processing pipeline ---
  currentLightRamp = lightRampGenerated; // Assign to the higher-scoped variables
  currentDarkRamp = darkRampGenerated;

  forceDarkModeDistinctness(currentLightRamp, currentDarkRamp); // Modifies in place
  ensureDarkMode950IsLightest(currentDarkRamp); // Modifies in place
  currentDarkRamp = adjustDarkRamp100Shade(currentDarkRamp); // Returns modified ramp

  const { lightRamp: uniqueLR, darkRamp: uniqueDR, seenSet: currentSeenSet } = guaranteeUniqueColors(currentLightRamp, currentDarkRamp);
  currentLightRamp = uniqueLR;
  currentDarkRamp = uniqueDR;

  currentLightRamp = ensureLightRamp950ContrastAndUniqueness(currentLightRamp, currentSeenSet); // Returns modified ramp

  // Specific adjustments for Gray ramps displayed in the Dark UI slot
  if (isGray) {
    // 1. Targeted Lightening for darker shades of the Gray darkRamp
    const darkerScalesForGray = ['50', '100', '200', '300', '400'];
    const grayDarkerShadeBoost = 0.020; // 2.0% lightness boost

    for (const scale of darkerScalesForGray) {
      if (currentDarkRamp[scale]) {
        // Preserve the base color if Dark Mode is default AND this scale is the base scale for dark ramp
        if (!(isDarkModeDefault && scale === actualDarkBaseScale)) {
          let hsl = currentDarkRamp[scale].toHsl();
          hsl.l = Math.min(1, hsl.l + grayDarkerShadeBoost);
          currentDarkRamp[scale] = tinycolor({ h: 0, s: 0, l: hsl.l });
        }
      }
    }

    // 2. Ensure Uniformity for the Gray darkRamp (smooth 100-200 transition)
    // This is applied again after targeted lightening specifically for grays.
    currentDarkRamp = adjustDarkRamp100Shade(currentDarkRamp);
  }

  // Update the UI
  // The base color is already preserved in the dark ramp when dark mode is default
  // and smooth transitions have been ensured during ramp generation

  // Ensure the base color is preserved in the appropriate ramp based on the default mode
  if (isDarkModeDefault) {
    if (actualDarkBaseScale && baseColor && currentDarkRamp[actualDarkBaseScale]) {
      // Ensure the base color is exactly preserved in the dark ramp
      currentDarkRamp[actualDarkBaseScale] = baseColor.clone();
    }
  } else {
    // Light mode is default, ensure the base color is preserved in the light ramp
    if (actualLightBaseScale && baseColor && currentLightRamp[actualLightBaseScale]) {
      if (currentLightRamp[actualLightBaseScale].toHexString() !== baseColor.toHexString()) {
        currentLightRamp[actualLightBaseScale] = baseColor.clone();
      }
    }
  }


  updateRampUI('lightRamp', currentLightRamp, LIGHT_MODE_TEXT_COLORS, actualLightBaseScale, failedColors);
  // Dark ramp UI update will happen after global lightening

  currentDarkRamp = globallyLightenDarkRamp(currentDarkRamp, isDarkModeDefault, actualDarkBaseScale);

  updateRampUI('darkRamp', currentDarkRamp, DARK_MODE_TEXT_COLORS, actualDarkBaseScale, failedColors);

  // After first full render, prevent re-animation
  if (!hasAnimatedSwatchesHsl) {
    hasAnimatedSwatchesHsl = true;
  }

  if (failedColors.length > 0) {
    if (baseColorInput) {
      baseColorInput.value = baseColor.toHexString();
    }
    if (failedColorInput) {
      failedColorInput.value = [...new Set(failedColors)].join(', ');
    }
  }

  updateRefreshTimestamp();

  // --- Update the background canvas colors ---
  if (window.canvas && typeof window.canvas.updateColors === 'function') {
    const darkRampArray = [
      currentDarkRamp['300']?.toHexString() || '#000000',
      currentDarkRamp['400']?.toHexString() || '#000000',
      currentDarkRamp['500']?.toHexString() || '#000000',
      currentDarkRamp['600']?.toHexString() || '#000000',
      currentDarkRamp['700']?.toHexString() || '#000000',
    ];
    window.canvas.updateColors({ darkRamp: darkRampArray, flashlight: flashlightColor });
    // Use the 800 scale from the dark ramp for the dynamic color to ensure readability
    const dynamicColor = currentDarkRamp['800'] ? currentDarkRamp['800'].toHexString() : '#ffffff';
    document.body.style.setProperty('--dynamic-color', dynamicColor);
  }

  // Update toggle knob colors
  const knobLightColor = currentDarkRamp['100'].toHexString();
  const knobDarkColor = currentLightRamp['200'].toHexString();
  document.documentElement.style.setProperty('--knob-light-mode-color', knobLightColor);
  document.documentElement.style.setProperty('--knob-dark-mode-color', knobDarkColor);

  // Update toggle switch background colors
  const switchBgLightColor = currentLightRamp['200'].toHexString();
  const switchBgDarkColor = currentDarkRamp['100'].toHexString();
  document.documentElement.style.setProperty('--switch-bg-light-mode-color', switchBgLightColor);
  document.documentElement.style.setProperty('--switch-bg-dark-mode-color', switchBgDarkColor);

  // Update help icon color
  const helpIconColor = currentLightRamp['900'].toHexString();
  document.documentElement.style.setProperty('--help-icon-color', helpIconColor);

  // Update help icon background color
  const helpIconBgColor = currentLightRamp['100'].toHexString();
  document.documentElement.style.setProperty('--help-icon-bg-color', helpIconBgColor);

  // Update help icon hover colors
  const helpIconHoverBgColor = currentLightRamp['800'].toHexString();
  const helpIconHoverColor = currentLightRamp['50'].toHexString();
  document.documentElement.style.setProperty('--help-icon-hover-bg-color', helpIconHoverBgColor);
  document.documentElement.style.setProperty('--help-icon-hover-color', helpIconHoverColor);

  // Update modal colors
  // Use the 900 shade of the Light mode ramp so modals stay dark-tinted (even for white/black).
  const modalBgColor = currentLightRamp['900'].toHexString();
  const modalTextColor = currentLightRamp['50'].toHexString();
  document.documentElement.style.setProperty('--modal-bg-color', modalBgColor);
  document.documentElement.style.setProperty('--modal-text-color', modalTextColor);

  // Update modal close button color
  const modalCloseBtnColor = currentDarkRamp['800'].toHexString();
  document.documentElement.style.setProperty('--modal-close-btn-color', modalCloseBtnColor);

  // Update input field colors
  const inputBgColor = currentLightRamp['200'].toHexString();
  const inputTextColor = '#000000';
  document.documentElement.style.setProperty('--input-bg-color', inputBgColor);
  document.documentElement.style.setProperty('--input-text-color', inputTextColor);

  // Update link colors
  const linkColor = currentDarkRamp['700'].toHexString();
  const linkHoverColor = currentDarkRamp['900'].toHexString();
  document.documentElement.style.setProperty('--link-color', linkColor);
  document.documentElement.style.setProperty('--link-hover-color', linkHoverColor);
}

/**
 * Update the UI for a color ramp
 * @param {string} rampId - The ID of the ramp container
 * @param {Object} ramp - The color ramp object
 * @param {Object} textColors - The text color mapping for this ramp
 * @param {string} baseScale - The scale that uses the exact input color
 */
function updateRampUI(rampId, ramp, textColors, baseScale, failedColors) {
  const rampContainer = document.getElementById(rampId);
  const colorInput = document.getElementById('colorInput');
  if (!rampContainer) return;

  rampContainer.innerHTML = '';

  // Dynamically style the 'Add to Collection' button with the dark ramp colors
  if (rampId === 'darkRamp') {
    const addButton = document.getElementById('add-color-shortcut-btn');
    if (addButton && ramp['50'] && ramp['900']) {
      addButton.style.backgroundColor = ramp['50'].toHexString();
      addButton.style.color = ramp['900'].toHexString();
    }
  }

  const pageTitle = document.querySelector('h1');
  if (rampId === 'lightRamp' && pageTitle && ramp['300']) {
    const color300Hex = ramp['300'].toHexString();
    pageTitle.style.color = color300Hex;
    document.querySelectorAll('.dynamic-color-text').forEach(heading => {
      heading.style.color = color300Hex;
    });
  }

  const isDefaultRamp = (rampId === 'lightRamp' && !isDarkModeDefault) || (rampId === 'darkRamp' && isDarkModeDefault);
  const rampTitleContainer = rampContainer.closest('.light-mode-container, .dark-mode-container').querySelector('.ramp-title');
  const rampType = rampId === 'lightRamp' ? 'Light Mode' : 'Dark Mode';
  rampTitleContainer.innerHTML = `${rampType} Ramp`;
  if (isDefaultRamp) {
    rampTitleContainer.innerHTML += ' <span class="default-badge">Default</span>';
  }

  // Get all scales that exist in the ramp and sort them
  const sortedScales = SCALES.filter(scale => ramp[scale]).sort((a, b) => {
    return parseInt(a) - parseInt(b);
  });

  sortedScales.forEach((scale, index) => {
    const color = ramp[scale];
    if (!color) return;

    const hexColor = color.toHexString();
    const hslColor = color.toHsl();
    const textColor = getContrastingTextColor(color);
    const ratio = calculateContrastRatio(color, tinycolor(textColor)).toFixed(2);

    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    if (scale === baseScale) {
      swatch.classList.add('base-swatch');
      swatch.title = 'Base color';
    }
    if (ratio < 3) {
      swatch.classList.add('fail-shade');
      const banner = document.getElementById('accessibility-banner');
      if (banner) banner.style.display = 'block';
      if (failedColors) failedColors.push(hexColor);
    }

    let accessibilityBadge = 'Fail';
    if (ratio >= 7) accessibilityBadge = 'AAA';
    else if (ratio >= 3) accessibilityBadge = 'AA';

    const box = document.createElement('div');
    box.className = 'color-box';
    box.style.backgroundColor = hexColor;
    box.style.color = textColor;
    box.innerHTML = `
      <div class="box-content">
        <div class="tailwind-scale">${scale}</div>
        <a href="#" role="button" class="color-hex copyable" title="Click to copy HEX">${hexColor}</a>
        <div class="color-hsl-container">
          <div class="color-hsl-label">HSL</div>
          <a href="#" role="button" class="color-hsl-values copyable" title="Click to copy HSL">${Math.round(hslColor.h)}° ${Math.round(hslColor.s * 100)}% ${Math.round(hslColor.l * 100)}%</a>
        </div>
        <div class="contrast"><span title="Contrast Ratio">${ratio}:1</span> <span class="accessibility-badge">${accessibilityBadge}</span></div>

      </div>
    `;

    const hexValueEl = box.querySelector('.color-hex');
    hexValueEl.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      navigator.clipboard.writeText(hexColor).then(() => {
        showToast('🗸 Copied HEX!', hexValueEl);
      }).catch(err => console.error('Could not copy text: ', err));
    });

    const hslValuesEl = box.querySelector('.color-hsl-values');
    hslValuesEl.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const hslString = `hsl(${Math.round(hslColor.h)}, ${Math.round(hslColor.s * 100)}%, ${Math.round(hslColor.l * 100)}%)`;
      navigator.clipboard.writeText(hslString).then(() => {
        showToast('🗸 Copied HSL!', hslValuesEl);
      }).catch(err => console.error('Could not copy text: ', err));
    });

    swatch.appendChild(box);
    rampContainer.appendChild(swatch);

    // One-time, staggered load animation AFTER insertion to ensure it triggers
    if (!hasAnimatedSwatchesHsl) {
      const baseOffset = rampId === 'darkRamp' ? SCALES.length : 0;
      // Force reflow to reset animation start point
      void box.offsetWidth; // reads layout
      // Next frame, add class and delay for a visible start
      requestAnimationFrame(() => {
        box.style.animationDelay = `${(baseOffset + index) * 20}ms`;
        box.classList.add('animate-in');

        box.addEventListener('animationend', () => {
          box.classList.remove('animate-in');
          box.style.animationDelay = '';
        }, { once: true });
      });
    }

    if (rampId === 'lightRamp' && scale === '100' && colorInput) {
      colorInput.style.backgroundColor = hexColor;
      colorInput.style.color = getContrastingTextColor(color);
    }
  });
}

/**
 * Check if a color string is valid
 */
function isValidColor(value) {
  return tinycolor(value).isValid();
}

/**
 * Generates a light mode color ramp with exact input color at the dynamically determined base scale
 * and fixed lightness values for lighter shades
 */
function generateLightRampWithExactBase(baseColor) {
  const ramp = {};

  // Determine the best scale for this color in light mode
  dynamicBaseScale = determineBaseScale(baseColor, false);

  // Extract the base color's HSL values
  const baseHsl = baseColor.toHsl();
  let baseH = baseHsl.h;
  let baseS = baseHsl.s;
  let baseL = baseHsl.l;

  // Handle extreme colors (white, black, very light, very dark)
  const isExtremeColor = baseL > 0.95 || baseL < 0.1 || baseS < 0.05;

  // For extreme colors, adjust saturation and lightness to get better ramps
  if (isExtremeColor) {
    console.log('Handling extreme color:', baseColor.toHexString());

    if (baseL > 0.95) { // White or very light colors
      // For white or near-white, use a very light gray with slight hue
      baseL = 0.9;
      baseS = Math.max(0.1, baseS);
      console.log('Adjusted very light color to:', baseL.toFixed(2), baseS.toFixed(2));
    } else if (baseL < 0.1) { // Black or very dark colors
      // For black or near-black, use a dark gray with slight hue
      baseL = 0.15;
      baseS = Math.max(0.1, baseS);
      console.log('Adjusted very dark color to:', baseL.toFixed(2), baseS.toFixed(2));
    } else if (baseS < 0.05) { // Grayscale colors (like #ccc, #ddd, #eee)
      // For grayscale, keep them as pure grayscale (do NOT add saturation)
      baseS = 0;
      baseH = 0; // Explicitly set hue to 0 for grayscale
      console.log('Keeping grayscale color pure gray:', baseS.toFixed(2));
    }
  }

  // Define reference lightness values for light mode scales
  const referenceLightness = {
    '50': 0.97,   // Almost white
    '100': 0.92,
    '200': 0.85,
    '300': 0.75,
    '400': 0.65,
    '500': 0.55,  // Middle reference
    '600': 0.45,
    '700': 0.35,
    '800': 0.25,
    '900': 0.15,
    '950': 0.08   // Almost black
  };

  // Generate colors for each scale
  SCALES.forEach(scale => {
    let currentColor;

    if (scale === dynamicBaseScale && !isExtremeColor) {
      // For the dynamic base scale, use the exact input color (unless extreme)
      currentColor = baseColor.clone();
    } else {
      // For all other scales or when handling extreme colors,
      // use a linear interpolation approach
      const scaleNum = parseInt(scale);
      const scaleIndex = SCALES.indexOf(scale);

      // Get the reference lightness for this scale
      const refL = referenceLightness[scale];

      // Determine target lightness based on color type
      let targetL;

      if (isExtremeColor) {
        // For extreme colors, use the reference values directly
        // with slight adjustments to ensure proper progression
        targetL = refL;
      } else {
        // For normal colors, use a mix of reference and proportional values
        const baseScaleNum = parseInt(dynamicBaseScale);
        const baseScaleRefL = referenceLightness[dynamicBaseScale];

        if (scaleNum < baseScaleNum) {
          // For scales lighter than base, use fixed lightness values
          targetL = refL;
        } else if (scaleNum > baseScaleNum) {
          // For scales darker than base, ensure proper progression
          // Handle different hue ranges differently
          const hue = baseH;

          // Identify problematic hue ranges
          const isPinkish = (hue >= 300 && hue <= 360) || (hue >= 0 && hue <= 30);
          const isGreenish = (hue >= 90 && hue <= 150);

          if (isPinkish || isGreenish) {
            // For problematic colors, use a linear approach
            const steps = scaleIndex - SCALES.indexOf(dynamicBaseScale);
            const darkeningPerStep = 0.12;
            targetL = Math.max(0.05, baseL - (steps * darkeningPerStep));
          } else {
            // For other colors, use a mix of fixed and proportional
            const ratio = refL / baseScaleRefL;
            targetL = Math.max(0.05, Math.min(refL, baseL * ratio));
          }
        } else {
          // This is the base scale
          targetL = baseL;
        }
      }

      // Create the color with the calculated lightness
      currentColor = tinycolor({ h: baseH, s: baseS, l: targetL });
    }

    // Store the color in the ramp
    ramp[scale] = currentColor;

    // Calculate contrast with both black and white text
    const blackContrast = calculateContrastRatio(currentColor, tinycolor('#000000'));
    const whiteContrast = calculateContrastRatio(currentColor, tinycolor('#FFFFFF'));

    // Choose the text color with the best contrast
    const bestTextColor = blackContrast > whiteContrast ? '#000000' : '#FFFFFF';
    const bestContrast = Math.max(blackContrast, whiteContrast);

    // Update the text color mapping for this scale
    LIGHT_MODE_TEXT_COLORS[scale] = bestTextColor;

    // If the input baseColor to this function was gray, ensure currentColor is also pure gray.
    if (baseColor.toHsl().s < 0.01) {
      const currentHsl = currentColor.toHsl();
      const originalHue = baseColor.toHsl().h; // Preserve hue of input gray
      currentColor = tinycolor({ h: (isNaN(originalHue) ? 0 : originalHue), s: 0, l: currentHsl.l });
    }
    ramp[scale] = currentColor; // This line was part of the original target, re-adding it after modification

    // Check if contrast meets AA standards
    if (bestContrast < 4.5) {
      // Contrast is below AA standard
    }
  });

  return ramp;
}

/**
 * Generate a dark mode color ramp with exact input color at the dynamically determined base scale
 * Uses a consistent approach for all colors with simplified special case handling
 */
function generateDarkRampWithExactBase(baseColor) {
  const ramp = {};
  let baseHsl = baseColor.toHsl();
  let { h: baseH, s: baseS, l: baseL } = baseHsl;

  // Determine the best scale for this color in dark mode
  const dynamicBaseScale = determineBaseScale(baseColor, true);

  // Get special color handling if applicable
  const specialColor = getSpecialColorHandling(baseH);

  // Handle extreme colors (white, black, very light, very dark, low saturation)
  const isGrayscale = baseS < 0.05; // Consider very low saturation as grayscale
  const isExtremeColor = baseL > 0.95 || baseL < 0.1 || isGrayscale;

  // Normalize the base color for ramp generation
  if (isExtremeColor) {
    if (isGrayscale) {
      baseS = 0;
      baseH = 0; // Explicitly set hue to 0 for grayscale
      // Keep grayscale baseL within safe bounds [0.05, 0.985]
      baseL = Math.max(0.05, Math.min(0.985, baseL));
    } else if (baseL > 0.95) { // White or very light colors
      baseL = 0.85; // Start darker than pure white
      baseS = Math.max(0.3, baseS); // Ensure minimum saturation
    } else if (baseL < 0.1) { // Black or very dark colors
      baseL = 0.15; // Start slightly above pure black
      baseS = Math.max(0.3, baseS); // Ensure minimum saturation
    }
  }

  // Apply minimum saturation if needed for special colors (like blues), but NOT for grayscale
  const minSaturation = specialColor?.darkRamp?.minSaturation || 0.3;
  if (!isGrayscale) {
    baseS = Math.max(minSaturation, baseS);
  }

  // Create smooth lightness progression based on the base color's lightness
  const normalizedBaseL = Math.max(0.1, Math.min(0.9, baseL));

  // Define the lightness range for dark mode (darker at bottom, lighter at top)
  // Darkest shade (50) should be slightly lighter than light mode's darkest (0.08)
  const minLightness = 0.10;
  // Lightest shade (950) should be slightly lighter than light mode's lightest (0.97), but avoid pure white
  const maxLightness = isGrayscale ? 0.985 : 0.95;

  // Calculate smooth progression with the base color anchored at 500
  // Calculate smooth progression with the base color anchored at its actual scale
  const basePosition = SCALES.indexOf(dynamicBaseScale);
  const totalSteps = SCALES.length - 1; // 10 steps total (0-10)

  // Create smooth lightness curve with base color properly positioned
  const lightnessValues = {};
  SCALES.forEach((scale, index) => {
    if (scale === dynamicBaseScale && !isExtremeColor) {
      // Anchor the base color at its actual lightness
      lightnessValues[scale] = normalizedBaseL;
    } else {
      // Create smooth progression around the base
      const relativePosition = index / totalSteps; // 0 to 1
      const baseRelativePosition = basePosition / (totalSteps || 1); // Avoid division by zero

      let targetL;
      if (relativePosition <= baseRelativePosition) {
        // Below base: interpolate from min to base
        const t = baseRelativePosition > 0 ? relativePosition / baseRelativePosition : 1;
        targetL = minLightness + (normalizedBaseL - minLightness) * smoothStep(t);
      } else {
        // Above base: interpolate from base to max
        const denominator = (1 - baseRelativePosition);
        const t = denominator > 0 ? (relativePosition - baseRelativePosition) / denominator : 1;
        targetL = normalizedBaseL + (maxLightness - normalizedBaseL) * smoothStep(t);
      }

      lightnessValues[scale] = Math.max(0.001, Math.min(0.999, targetL));
    }
  });

  // Generate colors for each scale
  SCALES.forEach(scale => {
    let targetL = lightnessValues[scale];

    // Start with the base color's saturation
    let targetS = baseS;

    // Create the color with the same hue and saturation as the base
    let color = tinycolor({ h: baseH, s: targetS, l: targetL });

    // For the base scale, use the exact input color (with any normalization applied)
    if (scale === dynamicBaseScale && !isExtremeColor) {
      color = tinycolor({ h: baseH, s: baseS, l: baseL });
    }

    // Ensure grayscale colors stay grayscale
    if (isGrayscale) {
      color = tinycolor({ h: 0, s: 0, l: targetL });
    }

    // Check contrast and adjust if needed for AA compliance
    const blackContrast = calculateContrastRatio(color, tinycolor('#0D0D0D'));
    const whiteContrast = calculateContrastRatio(color, tinycolor('#FFFFFF'));
    const bestContrast = Math.max(blackContrast, whiteContrast);
    const AA_MIN_CONTRAST = 4.5;
    const EPSILON = 0.02;

    // If contrast is too low, adjust to meet AA standards
    if (bestContrast < AA_MIN_CONTRAST - EPSILON) {
      const hsl = color.toHsl();
      let adjustedS = hsl.s;
      let adjustedL = hsl.l;
      let adjustedColor = color.clone();

      if (isGrayscale) {
        // For grayscale colors, ONLY adjust lightness, never saturation
        // Determine if we need to lighten or darken
        if (blackContrast > whiteContrast) {
          // Better contrast with black text, so lighten the background
          adjustedL = Math.min(0.985, adjustedL + 0.1);
        } else {
          // Better contrast with white text, so darken the background
          adjustedL = Math.max(0.10, adjustedL - 0.1);
        }
        adjustedColor = tinycolor({ h: 0, s: 0, l: adjustedL });
      } else {
        // For colored inputs, try increasing saturation first (preserves lightness)
        adjustedS = Math.min(1, adjustedS * 1.5);
        adjustedColor = tinycolor({ h: hsl.h, s: adjustedS, l: adjustedL });

        // If still not enough contrast, adjust lightness slightly
        if (Math.max(
          calculateContrastRatio(adjustedColor, tinycolor('#0D0D0D')),
          calculateContrastRatio(adjustedColor, tinycolor('#FFFFFF'))
        ) < AA_MIN_CONTRAST - EPSILON) {
          adjustedL = adjustedL > 0.5 ?
            Math.max(0.05, adjustedL - 0.1) :
            Math.min(0.95, adjustedL + 0.1);
          adjustedColor = tinycolor({ h: hsl.h, s: adjustedS, l: adjustedL });
        }
      }

      color = adjustedColor;
    }

    // Store the final color
    ramp[scale] = color;

    // Update text color based on best contrast
    const newBlackContrast = calculateContrastRatio(color, tinycolor('#0D0D0D'));
    const newWhiteContrast = calculateContrastRatio(color, tinycolor('#FFFFFF'));
    DARK_MODE_TEXT_COLORS[scale] = newBlackContrast > newWhiteContrast ? '#0D0D0D' : '#FFFFFF';
  });

  return ramp;
}

/**
 * Ensure a color meets accessibility standards for its scale
 * This function adjusts ONLY lightness to meet contrast requirements
 * Hue and saturation are preserved exactly as in the original color
 */
function ensureAccessibility(color, scale, isDarkMode = false) {
  const textColor = isDarkMode ?
    DARK_MODE_TEXT_COLORS[scale] :
    LIGHT_MODE_TEXT_COLORS[scale];

  // Extract the original HSL values
  const originalHsl = color.toHsl();
  const originalH = originalHsl.h;
  const originalS = originalHsl.s;

  // Start with the original color
  let adjustedColor = tinycolor(color.toHexString());
  let contrast = calculateContrastRatio(adjustedColor, tinycolor(textColor));
  const minContrast = 4.5; // AA standard

  // If contrast is already sufficient, return the color
  if (contrast >= minContrast) {
    return adjustedColor;
  }

  // Otherwise, adjust ONLY the lightness to meet contrast requirements
  let iterations = 0;
  const maxIterations = 30;

  while (contrast < minContrast && iterations < maxIterations) {
    const hsl = adjustedColor.toHsl();

    // Determine if we need to lighten or darken
    if (textColor === '#FFFFFF') {
      // For white text, darken the color
      hsl.l = Math.max(0.05, hsl.l - 0.03);
    } else {
      // For black text, lighten the color
      hsl.l = Math.min(0.95, hsl.l + 0.03);
    }

    // IMPORTANT: Always preserve the original hue and saturation
    hsl.h = originalH;
    hsl.s = originalS;

    adjustedColor = tinycolor(hsl);
    contrast = calculateContrastRatio(adjustedColor, tinycolor(textColor));
    iterations++;
  }

  // If we still don't have enough contrast after all iterations,
  // make a final adjustment while preserving hue and saturation
  if (contrast < minContrast) {
    if (textColor === '#FFFFFF') {
      // For white text, force to a darker color
      adjustedColor = tinycolor({
        h: originalH,
        s: originalS,
        l: 0.25 // Dark enough for white text
      });
    } else {
      // For black text, force to a lighter color
      adjustedColor = tinycolor({
        h: originalH,
        s: originalS,
        l: 0.90 // Light enough for black text
      });
    }
  }

  return adjustedColor;
}

/**
 * Calculate the contrast ratio between two colors
 * Based on WCAG 2.0 formula: https://www.w3.org/TR/WCAG20-TECHS/G17.html
 */
function calculateContrastRatio(color1, color2) {
  // Get relative luminance for both colors
  const getLuminance = (color) => {
    const rgb = color.toRgb();

    // Convert RGB to linear values
    let r = rgb.r / 255;
    let g = rgb.g / 255;
    let b = rgb.b / 255;

    // Apply gamma correction
    r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    // Calculate luminance
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const luminance1 = getLuminance(color1);
  const luminance2 = getLuminance(color2);

  // Calculate contrast ratio
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Force dark mode colors to be distinctly different from light mode colors
 * This is a more aggressive approach to ensure no duplicates between ramps
 * @param {Object} lightRamp - The light mode color ramp
 * @param {Object} darkRamp - The dark mode color ramp
 */
function forceDarkModeDistinctness(lightRamp, darkRamp) {
  // Debug logging for dark mode distinctness

  // Create a map of all light mode colors for quick lookup
  const lightModeColors = {};
  SCALES.forEach(scale => {
    if (!lightRamp[scale]) return;
    lightModeColors[lightRamp[scale].toHexString()] = scale;
  });

  // First pass: Check each dark mode color against all light mode colors
  // and darken any that match or are too similar
  SCALES.forEach(scale => {
    if (!darkRamp[scale]) return;

    const darkColor = darkRamp[scale];
    const darkHex = darkColor.toHexString();

    // If this exact color exists in light mode, darken it significantly
    if (lightModeColors[darkHex]) {
      const matchingLightScale = lightModeColors[darkHex];

      // Darken by a significant amount based on scale
      const hsl = darkColor.toHsl();
      const scaleNum = parseInt(scale);

      // Darker scales need more adjustment to maintain progression
      // But scales 900 and 950 should remain very light
      let darkeningAmount;
      if (scaleNum <= 300) {
        darkeningAmount = 0.20; // 20% darker for scales 50-300
      } else if (scaleNum <= 700) {
        darkeningAmount = 0.18; // 18% darker for scales 400-700
      } else if (scaleNum <= 800) {
        darkeningAmount = 0.15; // 15% darker for scale 800
      } else if (scaleNum === 900) {
        darkeningAmount = 0.10; // Only 10% darker for scale 900 to keep it light
      } else {
        darkeningAmount = 0.05; // Only 5% darker for scale 950 to keep it very light
      }

      const newLightness = Math.max(0.05, hsl.l - darkeningAmount);
      const newColor = tinycolor({ h: hsl.h, s: hsl.s, l: newLightness });

      darkRamp[scale] = newColor;
    }
  });

  // Second pass: Check for duplicates within the dark ramp itself
  // and ensure proper progression with minimum lightness differences
  const darkModeColors = new Map();

  // First, ensure minimum lightness differences between adjacent scales
  // This is especially important for darker scales (50-400)
  const minLightnessDifferences = {
    '50_100': 0.07,  // Minimum difference between 50 and 100
    '100_200': 0.07, // Minimum difference between 100 and 200
    '200_300': 0.08, // Minimum difference between 200 and 300
    '300_400': 0.08, // Minimum difference between 300 and 400
    '400_500': 0.09, // Minimum difference between 400 and 500
    '500_600': 0.09, // Minimum difference between 500 and 600
    '600_700': 0.09, // Minimum difference between 600 and 700
    '700_800': 0.08, // Minimum difference between 700 and 800
    '800_900': 0.07, // Minimum difference between 800 and 900
    '900_950': 0.05  // Minimum difference between 900 and 950
  };

  // Get the base hue to check if this is a green color
  let isGreen = false;
  const baseColor = darkRamp['500'] || darkRamp[Object.keys(darkRamp)[0]];
  if (baseColor) {
    const baseHue = baseColor.toHsl().h;
    isGreen = baseHue >= 90 && baseHue <= 150;
  }

  // First pass: collect all light mode colors
  SCALES.forEach(scale => {
    if (lightRamp[scale]) {
      lightModeColors[lightRamp[scale].toHexString()] = scale;
    }
  });

  // Sort scales to process from dark to light
  const sortedScales = [...SCALES].sort((a, b) => parseInt(a) - parseInt(b));

  // For green colors in dark mode, be more gentle with adjustments
  const minDifference = isGreen ? 0.05 : 0.07; // 5% for green, 7% for others
  const maxLightness = isGreen ? 0.95 : 0.97; // Cap at 95% for green, 97% for others

  // First, ensure minimum lightness differences between adjacent scales
  for (let i = 0; i < sortedScales.length - 1; i++) {
    const currentScale = sortedScales[i];
    const nextScale = sortedScales[i + 1];

    if (!darkRamp[currentScale] || !darkRamp[nextScale]) continue;

    const currentL = darkRamp[currentScale].toHsl().l;
    const nextL = darkRamp[nextScale].toHsl().l;

    // If the difference is less than required, adjust the next scale
    if (nextL - currentL < minDifference) {
      // Adjust the next scale to be lighter by the minimum difference
      const newLightness = Math.min(maxLightness, currentL + minDifference);

      // Get the HSL values of the next color
      const hsl = darkRamp[nextScale].toHsl();

      // Create a new color with the adjusted lightness
      const newColor = tinycolor({ h: hsl.h, s: hsl.s, l: newLightness });

      // Replace the next color with the adjusted version
      darkRamp[nextScale] = newColor;
    }
  }

  sortedScales.forEach(scale => {
    if (!darkRamp[scale]) return;

    const darkColor = darkRamp[scale];
    const darkHex = darkColor.toHexString();

    // Check if this color already exists in our dark mode collection
    if (darkModeColors.has(darkHex)) {
      const existingScale = darkModeColors.get(darkHex);

      // Adjust lightness based on scale relationship
      const hsl = darkColor.toHsl();
      const scaleNum = parseInt(scale);
      const existingScaleNum = parseInt(existingScale);

      let newLightness = hsl.l;

      // Special handling for scales 900 and 950 to keep them very light
      if (scaleNum === 950) {
        // Scale 950 should always be very light
        newLightness = isGreen ? Math.max(0.92, hsl.l) : Math.max(0.95, hsl.l);
      } else if (scaleNum === 900) {
        // Scale 900 should be light but darker than 950
        newLightness = isGreen
          ? Math.max(0.85, Math.min(0.91, hsl.l))
          : Math.max(0.90, Math.min(0.94, hsl.l));
      } else if (scaleNum > existingScaleNum) {
        // This scale should be lighter than the existing one
        const lightenAmount = isGreen ? 0.05 : 0.08;
        newLightness = Math.min(isGreen ? 0.89 : 0.89, hsl.l + lightenAmount);
      } else {
        // This scale should be darker than the existing one
        const darkenAmount = isGreen ? 0.05 : 0.08;
        newLightness = Math.max(0.05, hsl.l - darkenAmount);
      }

      // For green colors, try to preserve the original saturation
      const newSaturation = isGreen ? hsl.s : hsl.s * 0.9; // Slightly desaturate non-green colors

      const newColor = tinycolor({
        h: hsl.h,
        s: newSaturation,
        l: newLightness
      });

      darkRamp[scale] = newColor;
      darkModeColors.set(newColor.toHexString(), scale);
    } else {
      darkModeColors.set(darkHex, scale);
    }
  });

  // Final safety pass: Check all dark mode colors against light mode again
  // and darken any that still match
  let safetyAdjustments = 0;

  SCALES.forEach(scale => {
    if (!darkRamp[scale]) return;

    const darkColor = darkRamp[scale];
    let darkHex = darkColor.toHexString();

    // If this color exists in light mode, darken it
    let attempts = 0;
    while (lightModeColors[darkHex] && attempts < 10) {
      attempts++;
      safetyAdjustments++;

      // Darken by a smaller amount each time
      const hsl = darkColor.toHsl();
      const newLightness = Math.max(0.05, hsl.l - 0.05);
      const newColor = tinycolor({ h: hsl.h, s: hsl.s, l: newLightness });

      darkRamp[scale] = newColor;
      darkHex = newColor.toHexString();
    }
  });

  // Safety adjustments counter is maintained but not logged
}

/**
 * Ensure that the 950 scale is always the lightest color in the dark mode ramp
 * and that there is proper lightness progression across all scales
 * @param {Object} darkRamp - The dark mode color ramp
 */
function ensureDarkMode950IsLightest(darkRamp) {
  // If 950 scale doesn't exist, nothing to do
  if (!darkRamp['950'] || !darkRamp['900']) return;

  // First, ensure 900 and 950 are significantly lighter than other scales
  // These are the lightest scales in dark mode and should be very light

  // Get the lightness values of 900 and 950
  let l900 = darkRamp['900'].toHsl().l;
  let l950 = darkRamp['950'].toHsl().l;

  // Ensure 900 is at least 90% lightness
  if (l900 < 0.90) {
    // Get the HSL values of the 900 color
    const hsl900 = darkRamp['900'].toHsl();

    // Set to at least 90% lightness
    const newLightness900 = Math.max(0.90, l900);

    // Create a new color with the adjusted lightness
    const newColor900 = tinycolor({ h: hsl900.h, s: hsl900.s, l: newLightness900 });

    // Replace the 900 color with the lighter version
    darkRamp['900'] = newColor900;

    // Update the lightness value for later use
    l900 = newLightness900;
  }

  // Ensure 950 is at least 95% lightness and lighter than 900
  if (l950 < 0.95 || l950 <= l900) {
    // Get the HSL values of the 950 color
    const hsl950 = darkRamp['950'].toHsl();

    // Set to at least 95% lightness and 5% lighter than 900
    const newLightness950 = Math.max(0.95, l900 + 0.05);

    // Create a new color with the adjusted lightness
    const newColor950 = tinycolor({ h: hsl950.h, s: hsl950.s, l: newLightness950 });

    // Replace the 950 color with the lighter version
    darkRamp['950'] = newColor950;
  }

  // Check all scales to ensure proper progression from dark to light
  // Process in reverse (from 950 down to 50) to ensure we maintain the lightest colors
  const reversedScales = [...SCALES].reverse();

  for (let i = 0; i < reversedScales.length - 1; i++) {
    const currentScale = reversedScales[i];
    const nextScale = reversedScales[i + 1];

    // Skip if either scale doesn't exist
    if (!darkRamp[currentScale] || !darkRamp[nextScale]) continue;

    // Get the lightness values
    const currentL = darkRamp[currentScale].toHsl().l;
    const nextL = darkRamp[nextScale].toHsl().l;

    // In dark mode with reversed processing, current scale should be lighter than next
    if (currentL <= nextL) {

      // Calculate minimum lightness difference based on scale distance
      const scaleDistance = Math.abs(parseInt(currentScale) - parseInt(nextScale));
      const minDifference = Math.max(0.03, scaleDistance / 100); // At least 3% difference

      // Make the next scale darker than current
      const newLightness = Math.max(0.05, nextL - minDifference);

      // Get the HSL values of the next color
      const hsl = darkRamp[nextScale].toHsl();

      // Create a new color with the adjusted lightness
      const newColor = tinycolor({ h: hsl.h, s: hsl.s, l: newLightness });

      // Replace the next color with the darker version
      darkRamp[nextScale] = newColor;

      // Debug: Log adjusted lightness values
    }
  }
}

// ---- Collections Logic ----

// Generate a unique ID for collections and colors
function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

// Create a test collection for debugging
function createTestCollection() {
  console.log('Creating test collection for debugging');

  // Create test collection with a sample color
  const testCollection = {
    collections: [{
      id: generateId(),
      name: 'Test Collection',
      createdAt: new Date().toISOString(),
      colors: [{
        id: generateId(),
        name: 'Test Blue',
        base: '#3498db'
      }]
    }]
  };

  saveCollections(testCollection);
  return testCollection;
}

// Get collections from localStorage
function getCollections() {
  const data = localStorage.getItem(COLLECTIONS_KEY);

  if (data) {
    try {
      const parsed = JSON.parse(data);

      // Verify collections array exists
      if (!parsed.collections) {
        parsed.collections = [];
      }

      return parsed;
    } catch (e) {
      return { collections: [] };
    }
  }

  // Default structure if nothing is in localStorage
  return { collections: [] };
}

// Save collections to localStorage
function saveCollections(data) {
  // Ensure data has the correct structure
  if (!data.collections && typeof data === 'object') {
    data = { collections: [data] };
  }

  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(data));
}

// Render the entire collections UI
function renderCollections() {
  // Get collections data
  const data = getCollections();

  // Get container element
  const container = document.getElementById('collections-list');
  if (!container) {
    return;
  }

  // Make sure collections section is visible
  const collectionsSection = document.getElementById('collections-section');
  if (collectionsSection) {
    collectionsSection.style.display = 'block';
    collectionsSection.style.visibility = 'visible';
  }

  // Clear existing content
  container.innerHTML = '';

  // Ensure data has the correct structure
  if (!data) {
    container.innerHTML = '<p class="empty-collections-message">Error loading collections. Please try again.</p>';
    return;
  }

  // Handle case where data might be a single collection object
  if (!data.collections && typeof data === 'object') {
    data = { collections: [data] };
  }

  // Check if collections array exists and has items
  if (!data.collections || data.collections.length === 0) {
    container.innerHTML = '<p class="empty-collections-message">No collections yet. Create one to get started!</p>';
    return;
  }

  const collectionsForRender = [...data.collections].sort((a, b) => {
    const aTime = Date.parse(a?.createdAt || '') || 0;
    const bTime = Date.parse(b?.createdAt || '') || 0;
    return bTime - aTime;
  });

  collectionsForRender.forEach((collection, index) => {
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

    // Create collection header
    const headerEl = document.createElement('div');
    headerEl.className = 'collection-header';

    // Add collection name
    const nameEl = document.createElement('h3');
    nameEl.textContent = collection.name;
    nameEl.className = 'collection-name';
    nameEl.dataset.collectionId = collection.id;
    headerEl.appendChild(nameEl);

    // For styling purposes, show one collection with edit state
    if (index === 0) {
      // Create edit input (temporary for styling)
      const editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.className = 'edit-name-input'; // For styling

      headerEl.removeChild(nameEl);
      headerEl.appendChild(editInput);
    }

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

    // Create the collection HTML structure
    const headerHtml = `
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
    `;

    // Create colors list container
    const colorsListEl = document.createElement('div');
    colorsListEl.className = 'collection-colors-list';
    colorsListEl.dataset.collectionId = collection.id;

    // Add no-colors-yet class if collection is empty
    if (!collection.colors || collection.colors.length === 0) {
      colorsListEl.classList.add('no-colors-yet');
      colorsListEl.innerHTML = '<p class="empty-colors-message">No colors in this collection yet.</p>';
    } else {
      colorsListEl.innerHTML = colorsHtml;
    }

    // Add header and colors list to collection element
    collectionEl.innerHTML = headerHtml;
    if (tokenCounterHtml) {
      const tokenCounterEl = document.createElement('div');
      tokenCounterEl.innerHTML = tokenCounterHtml;
      collectionEl.appendChild(tokenCounterEl.firstElementChild);
    }
    collectionEl.appendChild(colorsListEl);
    container.appendChild(collectionEl);
  });

  // After rendering, tell Lucide to create the icons.
  if (typeof lucide !== 'undefined') {
    try {
      lucide.createIcons();
    } catch (error) {
      console.error('Error creating Lucide icons.', error);
    }
  }

  // Ensure collections section is visible after rendering
  if (collectionsSection) {
    collectionsSection.style.display = 'block';
    collectionsSection.style.visibility = 'visible';
  }

  // Set up drag and drop functionality
  setupDragAndDrop();

  // Set up the moveColorItem handler for drag and drop
  window.moveColorItemHandler = createMoveColorItemHandler(getCollections, saveCollections, renderCollections);
}

// ---- Export Logic ----
function generateJsonForFigma(collection, format) {
  const output = {
    format: format.replace('figma-', ''), // Ensure format is 'paired', 'themed', or 'backup'
    collectionName: collection.name,
  };

  // This internal function processes a single color, using its stored ramps
  const processColor = (color) => {
    try {
      // If the color already has ramps stored, use them
      if (color.lightRamp && color.darkRamp) {
        // Convert stored hex strings back to tinycolor objects
        const lightRamp = {};
        const darkRamp = {};

        // Process light ramp
        Object.entries(color.lightRamp).forEach(([scale, hex]) => {
          lightRamp[scale] = tinycolor(hex);
        });

        // Process dark ramp
        Object.entries(color.darkRamp).forEach(([scale, hex]) => {
          darkRamp[scale] = tinycolor(hex);
        });

        return { lightRamp, darkRamp };
      }

      // Fallback to generating ramps if not stored (legacy support)
      const colorValue = parseRgbInput(color.base);
      const baseColor = tinycolor(colorValue);

      if (!baseColor.isValid()) {
        alert('Invalid color value.');
        return null;
      }

      // Generate light and dark ramps using the HSL color space functions
      const lightRamp = generateLightRampWithExactBase(baseColor);
      const darkRamp = generateDarkRampWithExactBase(baseColor);

      return { lightRamp, darkRamp };
    } catch (e) {
      alert('Skipping invalid color in collection.');
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
          Light: processed.lightRamp[scale].toHexString(),
          Dark: processed.darkRamp[scale].toHexString()
        };
      });
    });
    return output;
  }
  else if (format === 'figma-themed') {
    output.themes = { Light: {}, Dark: {} };
    collection.colors.forEach(color => {
      const processed = processColor(color);
      if (!processed) return;

      output.themes.Light[color.name] = {};
      output.themes.Dark[color.name] = {};

      const normalizeHex = (hexValue) => {
        const v = (hexValue || '').toString().trim().toLowerCase();
        return v.startsWith('#') ? v : `#${v}`;
      };

      const baseHex = normalizeHex(color.base);
      let lightBaseScale = '';
      let darkBaseScale = '';

      for (const scale of SCALES) {
        const lightHex = processed.lightRamp?.[scale]?.toHexString?.();
        const darkHex = processed.darkRamp?.[scale]?.toHexString?.();
        if (!lightBaseScale && normalizeHex(lightHex) === baseHex) lightBaseScale = scale;
        if (!darkBaseScale && normalizeHex(darkHex) === baseHex) darkBaseScale = scale;
      }

      SCALES.forEach(scale => {
        const lightKey = (scale === lightBaseScale) ? `${scale}*` : scale;
        const darkKey = (scale === darkBaseScale) ? `${scale}*` : scale;
        output.themes.Light[color.name][lightKey] = processed.lightRamp[scale].toHexString();
        output.themes.Dark[color.name][darkKey] = processed.darkRamp[scale].toHexString();
      });
    });
    return output;
  }
  // Single ramp exports - Light
  else if (format === 'light ramp') {
    output.colors = {};
    collection.colors.forEach(color => {
      const processed = processColor(color);
      if (!processed) return;
      output.colors[color.name] = {};
      SCALES.forEach(scale => {
        output.colors[color.name][scale] = processed.lightRamp[scale].toHexString();
      });
    });
    return output;
  }
  // Single ramp exports - Dark
  else if (format === 'dark ramp') {
    output.colors = {};
    collection.colors.forEach(color => {
      const processed = processColor(color);
      if (!processed) return;
      output.colors[color.name] = {};
      SCALES.forEach(scale => {
        output.colors[color.name][scale] = processed.darkRamp[scale].toHexString();
      });
    });
    return output;
  }
  else if (format === 'backup') {
    // Backup format (full collection data for import/export between browsers)
    return {
      format: 'backup',
      data: collection,
      version: '1.0',
      timestamp: new Date().toISOString()
    };
  }

  // Default return if format is not recognized
  return {
    error: 'Unsupported export format',
    format: format,
    validFormats: ['figma-paired', 'figma-themed', 'backup']
  };
}

function generateJsonStringForFigma(collection, format) {
  const escapeJsonString = (value) => JSON.stringify(value ?? '');

  // This internal function processes a single color, using its stored ramps
  const processColor = (color) => {
    try {
      // If the color already has ramps stored, use them
      if (color.lightRamp && color.darkRamp) {
        const lightRamp = {};
        const darkRamp = {};

        Object.entries(color.lightRamp).forEach(([scale, hex]) => {
          lightRamp[scale] = tinycolor(hex);
        });

        Object.entries(color.darkRamp).forEach(([scale, hex]) => {
          darkRamp[scale] = tinycolor(hex);
        });

        return { lightRamp, darkRamp };
      }

      // Fallback to generating ramps if not stored (legacy support)
      const colorValue = parseRgbInput(color.base);
      const baseColor = tinycolor(colorValue);

      if (!baseColor.isValid()) {
        return null;
      }

      const lightRamp = generateLightRampWithExactBase(baseColor);
      const darkRamp = generateDarkRampWithExactBase(baseColor);
      return { lightRamp, darkRamp };
    } catch (e) {
      return null;
    }
  };

  const normalizeHex = (hexValue) => {
    const v = (hexValue || '').toString().trim().toLowerCase();
    return v.startsWith('#') ? v : `#${v}`;
  };

  const getBaseScaleForRamp = (ramp, baseHex) => {
    for (const scale of SCALES) {
      const rampHex = ramp?.[scale]?.toHexString?.();
      if (normalizeHex(rampHex) === baseHex) return scale;
    }
    return '';
  };

  const buildScaleBlock = (ramp, baseScale) => {
    const lines = ['{'];
    SCALES.forEach((scale, idx) => {
      const key = (scale === baseScale) ? `${scale}*` : scale;
      const value = ramp[scale].toHexString();
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

  const colors = Array.isArray(collection.colors) ? collection.colors : [];
  const processedColors = colors
    .map((color) => {
      const processed = processColor(color);
      if (!processed) return null;
      const baseHex = normalizeHex(color.base);
      const lightBaseScale = getBaseScaleForRamp(processed.lightRamp, baseHex);
      const darkBaseScale = getBaseScaleForRamp(processed.darkRamp, baseHex);
      return { color, processed, lightBaseScale, darkBaseScale };
    })
    .filter(Boolean);

  if (format === 'figma-themed') {
    const lines = [...headerLines, '  "themes": {', '    "Light": {'];

    processedColors.forEach((item, idx) => {
      const comma = idx === processedColors.length - 1 ? '' : ',';
      lines.push(`      ${escapeJsonString(item.color.name)}: ${buildScaleBlock(item.processed.lightRamp, item.lightBaseScale).join('\n')}${comma}`);
    });

    lines.push('    },', '    "Dark": {');

    processedColors.forEach((item, idx) => {
      const comma = idx === processedColors.length - 1 ? '' : ',';
      lines.push(`      ${escapeJsonString(item.color.name)}: ${buildScaleBlock(item.processed.darkRamp, item.darkBaseScale).join('\n')}${comma}`);
    });

    lines.push('    }', '  }', '}');
    return lines.join('\n');
  }

  if (format === 'light ramp' || format === 'dark ramp') {
    const lines = [...headerLines, '  "colors": {'];

    processedColors.forEach((item, idx) => {
      const comma = idx === processedColors.length - 1 ? '' : ',';
      const ramp = (format === 'light ramp') ? item.processed.lightRamp : item.processed.darkRamp;
      const baseScale = (format === 'light ramp') ? item.lightBaseScale : item.darkBaseScale;
      lines.push(`    ${escapeJsonString(item.color.name)}: ${buildScaleBlock(ramp, baseScale).join('\n')}${comma}`);
    });

    lines.push('  }', '}');
    return lines.join('\n');
  }

  const jsonOutput = generateJsonForFigma(collection, format);
  return JSON.stringify(jsonOutput, null, 2);
}

function openExportModal(collection) {
  const modal = document.getElementById('export-modal');
  const backdrop = document.getElementById('export-modal-backdrop');
  const formatSelect = document.getElementById('json-format-select');
  const textarea = document.getElementById('export-json-textarea');
  const copyBtn = document.getElementById('copy-json-btn');
  const closeBtn = document.getElementById('close-export-modal');
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
      const instructions = `***\nCollection Name: "${collection.name}"\nColor Space: HSL\n\nSave this JSON file to restore this color ramp here on Color-Ramp.com. Both ".json" or ".txt" file extensions are supported.\n\nThis JSON file is NOT to be used with the Figma plugin. For that, use the provided Dual Ramps or Single Ramp JSON formats.\n***`;
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
      alert('Failed to copy JSON');
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
  closeBtn.onclick = (e) => {
    e.preventDefault();
    closeHandler();
  };

  backdrop.onclick = (e) => {
    if (e.target === backdrop) {
      closeHandler();
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

  // Only proceed if this modal is the top one
  if (modalStack.length > 0 && modalStack[modalStack.length - 1].modal === modal) {
    modalStack.pop();

    // Hide the modal
    modal.classList.remove('active');
    backdrop.classList.remove('active');
    document.body.classList.remove('modal-open');

    modal.__releaseFocusTrap?.();
    modal.__releaseFocusTrap = null;

    const returnEl = modal.__returnFocusEl;
    modal.__returnFocusEl = null;



    // Focus back to the export button that opened this modal
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
  }
}

// Global modal stack to track open modals in order
const modalStack = [];

// Close the topmost modal
function closeTopModal() {
  if (modalStack.length === 0) return;

  const { modal, closeFn } = modalStack[modalStack.length - 1];
  closeFn();
}

// Global ESC key handler
function handleEscapeKey(e) {
  if (e.key === 'Escape' && modalStack.length > 0) {
    e.preventDefault();
    e.stopPropagation();
    closeTopModal();
  }
}

// Add a single global event listener
document.removeEventListener('keydown', handleEscapeKey); // Remove any existing
document.addEventListener('keydown', handleEscapeKey);

// ---- Reusable Modal Logic ----
function setupModal(triggerId, modalId, closeBtnId, backdropId) {
  const trigger = document.getElementById(triggerId);
  const modal = document.getElementById(modalId);
  const closeBtn = document.getElementById(closeBtnId);
  const backdrop = document.getElementById(backdropId);

  if (!trigger || !modal || !closeBtn || !backdrop) {
    // Silently return if any component is missing to avoid console errors.
    return;
  }

  const openModal = (e) => {
    e.preventDefault();
    e.stopPropagation();

    modal.__returnFocusEl = (e.currentTarget instanceof HTMLElement) ? e.currentTarget : null;

    // Add to modal stack before showing
    modalStack.push({
      modal,
      closeFn: closeModal
    });

    // Show the modal
    modal.classList.add('active');
    backdrop.classList.add('active');
    document.body.classList.add('modal-open');

    // Focus the close button
    closeBtn.focus();

    if (window.trapFocusInModal) {
      modal.__releaseFocusTrap?.();
      modal.__releaseFocusTrap = window.trapFocusInModal(modal);
    }


  };

  const closeModal = () => {
    // Only proceed if this modal is the top one
    if (modalStack.length > 0 && modalStack[modalStack.length - 1].modal === modal) {
      modalStack.pop();

      // Hide the modal
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
        return;
      }

      // Focus the trigger that opened this modal
      if (trigger) {
        trigger.focus();
        trigger.blur(); // Reset the trigger icon by removing focus
      }


    }
  };

  trigger.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);

  // Remove individual ESC handler since we're using the global one now

  return modal;
}

let pendingCollectionsDeleteAction = null;
let collectionsModalReturnFocusEl = null;

function openProgrammaticModal(modal, backdrop, { focusEl, returnFocusEl, onClose } = {}) {
  if (!modal || !backdrop) return;

  collectionsModalReturnFocusEl = returnFocusEl || null;

  const closeModal = () => {
    if (modalStack.length > 0 && modalStack[modalStack.length - 1].modal === modal) {
      modalStack.pop();
      modal.classList.remove('active');
      backdrop.classList.remove('active');
      document.body.classList.remove('modal-open');

      if (typeof onClose === 'function') {
        onClose();
      }

      if (collectionsModalReturnFocusEl) {
        collectionsModalReturnFocusEl.focus();
        collectionsModalReturnFocusEl.blur();
      }
    }
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

  if (newCollectionCloseBtn && newCollectionModal && newCollectionBackdrop) {
    newCollectionCloseBtn.addEventListener('click', () => {
      if (modalStack.length > 0 && modalStack[modalStack.length - 1].modal === newCollectionModal) {
        modalStack[modalStack.length - 1].closeFn();
      }
    });
  }

  if (newCollectionBackdrop && newCollectionModal) {
    newCollectionBackdrop.addEventListener('click', () => {
      if (modalStack.length > 0 && modalStack[modalStack.length - 1].modal === newCollectionModal) {
        modalStack[modalStack.length - 1].closeFn();
      }
    });
  }

  if (newCollectionCancelBtn && newCollectionModal) {
    newCollectionCancelBtn.addEventListener('click', () => {
      if (modalStack.length > 0 && modalStack[modalStack.length - 1].modal === newCollectionModal) {
        modalStack[modalStack.length - 1].closeFn();
      }
    });
  }

  if (newCollectionNameInput) {
    newCollectionNameInput.addEventListener('input', updateNewCollectionConfirmState);
  }

  updateNewCollectionConfirmState();

  if (newCollectionConfirmBtn) {
    newCollectionConfirmBtn.addEventListener('click', () => {
      const collectionName = (newCollectionNameInput?.value || '').trim();
      if (!collectionName) {
        if (newCollectionErrorEl) {
          const span = newCollectionErrorEl.querySelector('span');
          if (span) span.textContent = '';
          newCollectionErrorEl.classList.remove('is-visible');
        }
        return;
      }

      try {
        let data = getCollections();
        if (!data) data = { collections: [] };
        if (!data.collections) data.collections = [];

        const newCollection = {
          id: generateId(),
          name: collectionName,
          createdAt: new Date().toISOString(),
          colors: []
        };

        data.collections.push(newCollection);
        saveCollections(data);
        renderCollections();
        toggleAddColorButtonVisibility();

        appToast.success('Collection created successfully!');

        const collectionsSection = document.getElementById('collections-section');
        if (collectionsSection) {
          collectionsSection.scrollIntoView({ behavior: 'smooth' });
        }

        if (modalStack.length > 0 && modalStack[modalStack.length - 1].modal === newCollectionModal) {
          modalStack[modalStack.length - 1].closeFn();
        }
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
    deleteColorCloseBtn.addEventListener('click', () => {
      if (modalStack.length > 0 && modalStack[modalStack.length - 1].modal === deleteColorModal) {
        modalStack[modalStack.length - 1].closeFn();
      }
    });
  }

  if (deleteColorBackdrop && deleteColorModal) {
    deleteColorBackdrop.addEventListener('click', () => {
      if (modalStack.length > 0 && modalStack[modalStack.length - 1].modal === deleteColorModal) {
        modalStack[modalStack.length - 1].closeFn();
      }
    });
  }

  if (deleteColorCancelBtn && deleteColorModal) {
    deleteColorCancelBtn.addEventListener('click', () => {
      if (modalStack.length > 0 && modalStack[modalStack.length - 1].modal === deleteColorModal) {
        modalStack[modalStack.length - 1].closeFn();
      }
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

      if (modalStack.length > 0 && modalStack[modalStack.length - 1].modal === deleteColorModal) {
        modalStack[modalStack.length - 1].closeFn();
      }
    });
  }

  if (deleteCollectionCloseBtn && deleteCollectionModal) {
    deleteCollectionCloseBtn.addEventListener('click', () => {
      if (modalStack.length > 0 && modalStack[modalStack.length - 1].modal === deleteCollectionModal) {
        modalStack[modalStack.length - 1].closeFn();
      }
    });
  }

  if (deleteCollectionBackdrop && deleteCollectionModal) {
    deleteCollectionBackdrop.addEventListener('click', () => {
      if (modalStack.length > 0 && modalStack[modalStack.length - 1].modal === deleteCollectionModal) {
        modalStack[modalStack.length - 1].closeFn();
      }
    });
  }

  if (deleteCollectionCancelBtn && deleteCollectionModal) {
    deleteCollectionCancelBtn.addEventListener('click', () => {
      if (modalStack.length > 0 && modalStack[modalStack.length - 1].modal === deleteCollectionModal) {
        modalStack[modalStack.length - 1].closeFn();
      }
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

      if (modalStack.length > 0 && modalStack[modalStack.length - 1].modal === deleteCollectionModal) {
        modalStack[modalStack.length - 1].closeFn();
      }
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

// Function to toggle the visibility of the Add Current Color button based on collections existence
function toggleAddColorButtonVisibility() {
  const addColorBtn = document.getElementById('add-color-shortcut-btn');
  if (!addColorBtn) return;

  const data = getCollections();
  if (data && data.collections && data.collections.length > 0) {
    addColorBtn.classList.remove('hidden');
    addColorBtn.style.display = 'flex';
  } else {
    // Always show the button - if no collections exist, it will prompt to create one
    addColorBtn.classList.remove('hidden');
    addColorBtn.style.display = 'flex';
  }
}

// Function to add the current color to a collection
function addColorToCollection() {
  const colorInput = document.getElementById('colorInput');
  if (!colorInput || !colorInput.value) return;

  // Parse the color value, supporting RGB input
  const colorValue = colorInput.value;
  const hexValue = parseRgbInput(colorValue);

  if (!hexValue) {
    showToast('Please enter a valid color first. Examples: #FF0000, red, rgb(255,0,0), or "255 0 0"');
    return;
  }

  // Get collections data
  const data = getCollections();

  // Check if collections exist
  if (!data || !data.collections || data.collections.length === 0) {
    // Show alert dialog
    alert('Please create a collection first to save your color.');

    // After alert is dismissed, scroll to the collections section
    const collectionsSection = document.getElementById('collections-section');
    if (collectionsSection) {
      // Small delay to ensure smooth scroll after alert is dismissed
      setTimeout(() => {
        // Scroll to the collections section
        collectionsSection.scrollIntoView({ behavior: 'smooth' });

        // Find and focus the Create New Collection button
        const createCollectionBtn = document.getElementById('create-collection-btn');
        if (createCollectionBtn) {
          // Add a small delay to ensure scrolling is complete before focusing
          setTimeout(() => {
            createCollectionBtn.focus({ preventScroll: true });
            // Ensure the focus is visible (triggers :focus-visible state)
            createCollectionBtn.classList.add('focused');
            // Remove the class after focus is lost to allow normal focus behavior
            createCollectionBtn.addEventListener('blur', function onBlur() {
              createCollectionBtn.classList.remove('focused');
              createCollectionBtn.removeEventListener('blur', onBlur);
            }, { once: true });
          }, 100); // Slightly longer delay to ensure smooth scrolling is complete
        }
      }, 50);
    }

    return; // Exit the function without adding the color
  }

  // If we get here, we have at least one collection
  // Use the first collection
  const targetCollectionId = data.collections[0].id;

  // Add the color to the collection
  addColorToSpecificCollection(targetCollectionId, colorValue);

  // Scroll to the collections section
  const collectionsSection = document.getElementById('collections-section');
  if (collectionsSection) {
    collectionsSection.scrollIntoView({ behavior: 'smooth' });
  }
}

// HTML color names mapping from standard HTML colors
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

// Function to parse RGB input values with support for various formats
function parseRgbInput(input) {
  if (!input) return null;

  // First, try to parse as a color directly (handles hex, named colors, etc.)
  let color = tinycolor(input);
  if (color.isValid()) {
    return color.toHexString();
  }

  // Convert input to string and trim whitespace
  const trimmedInput = input.toString().trim();

  // Handle single number input (e.g., "132")
  if (/^\d+$/.test(trimmedInput)) {
    const val = Math.min(255, Math.max(0, parseInt(trimmedInput, 10)));
    return tinycolor(`rgb(${val}, ${val}, ${val})`).toHexString();
  }

  // Handle space-separated values (e.g., "132 255 255" or "132 255")
  if (trimmedInput.includes(' ')) {
    const parts = trimmedInput.split(/\s+/).map(Number);

    // Single value (e.g., "132")
    if (parts.length === 1 && !isNaN(parts[0])) {
      const val = Math.min(255, Math.max(0, parts[0]));
      return tinycolor(`rgb(${val}, ${val}, ${val})`).toHexString();
    }
    // Two values (e.g., "132 255")
    else if (parts.length === 2 && !parts.some(isNaN)) {
      const r = Math.min(255, Math.max(0, parts[0]));
      const g = Math.min(255, Math.max(0, parts[1]));
      return tinycolor(`rgb(${r}, ${g}, 255)`).toHexString();
    }
    // Three values (e.g., "132 255 100")
    else if (parts.length === 3 && !parts.some(isNaN)) {
      const [r, g, b] = parts.map(val => Math.min(255, Math.max(0, val)));
      return tinycolor(`rgb(${r}, ${g}, ${b})`).toHexString();
    }
  }

  // Handle comma-separated values (e.g., "132,255,255" or "132, 255, 255")
  if (trimmedInput.includes(',')) {
    const parts = trimmedInput.split(',').map(s => parseInt(s.trim(), 10));

    // Single value (e.g., "132," or "132")
    if (parts.length === 1 && !isNaN(parts[0])) {
      const val = Math.min(255, Math.max(0, parts[0]));
      return tinycolor(`rgb(${val}, ${val}, ${val})`).toHexString();
    }
    // Two values (e.g., "132,255")
    else if (parts.length === 2 && !parts.some(isNaN)) {
      const r = Math.min(255, Math.max(0, parts[0]));
      const g = Math.min(255, Math.max(0, parts[1]));
      return tinycolor(`rgb(${r}, ${g}, 255)`).toHexString();
    }
    // Three values (e.g., "132,255,100")
    else if (parts.length === 3 && !parts.some(isNaN)) {
      const [r, g, b] = parts.map(val => Math.min(255, Math.max(0, val)));
      return tinycolor(`rgb(${r}, ${g}, ${b})`).toHexString();
    }
  }

  // If we get here, the input is not valid
  return null;
}

// Function to get the best color name, using HTML color names when possible and ntc.js for others
function getBestColorName(colorValue) {
  // First try to parse as a color to normalize it
  const color = tinycolor(colorValue);
  if (!color.isValid()) {
    return colorValue; // Return original if not a valid color
  }

  const hexValue = color.toHexString().toLowerCase();

  // Check if it's a standard HTML color by looking up the hex value in the reverse map
  if (HEX_TO_COLOR_NAME[hexValue]) {
    // Return the properly formatted HTML color name
    return formatHtmlColorName(HEX_TO_COLOR_NAME[hexValue]);
  }

  // For non-HTML colors, use ntc.js to get the closest color name
  if (typeof ntc !== 'undefined') {
    const ntcMatch = ntc.name(hexValue);
    if (ntcMatch && ntcMatch[1] && ntcMatch[1] !== '') {
      return ntcMatch[1]; // Return the closest color name
    }
  }

  // Fallback to hex value if no good name found
  return hexValue;
}

// Helper function to format HTML color names with proper capitalization
function formatHtmlColorName(name) {
  // Return the name as-is if it's already in the correct format
  if (name && name[0] === name[0].toUpperCase()) {
    return name;
  }

  // Map of all HTML color names to their correct CamelCase versions
  const colorNameMap = {
    // A
    'aliceblue': 'AliceBlue',
    'antiquewhite': 'AntiqueWhite',
    'aqua': 'Aqua',
    'aquamarine': 'Aquamarine',
    'azure': 'Azure',
    // B
    'beige': 'Beige',
    'bisque': 'Bisque',
    'black': 'Black',
    'blanchedalmond': 'BlanchedAlmond',
    'blue': 'Blue',
    'blueviolet': 'BlueViolet',
    'brown': 'Brown',
    'burlywood': 'BurlyWood',
    // C
    'cadetblue': 'CadetBlue',
    'chartreuse': 'Chartreuse',
    'chocolate': 'Chocolate',
    'coral': 'Coral',
    'cornflowerblue': 'CornflowerBlue',
    'cornsilk': 'Cornsilk',
    'crimson': 'Crimson',
    'cyan': 'Cyan',
    // D
    'darkblue': 'DarkBlue',
    'darkcyan': 'DarkCyan',
    'darkgoldenrod': 'DarkGoldenRod',
    'darkgray': 'DarkGray',
    'darkgreen': 'DarkGreen',
    'darkgrey': 'DarkGrey',
    'darkkhaki': 'DarkKhaki',
    'darkmagenta': 'DarkMagenta',
    'darkolivegreen': 'DarkOliveGreen',
    'darkorange': 'DarkOrange',
    'darkorchid': 'DarkOrchid',
    'darkred': 'DarkRed',
    'darksalmon': 'DarkSalmon',
    'darkseagreen': 'DarkSeaGreen',
    'darkslateblue': 'DarkSlateBlue',
    'darkslategray': 'DarkSlateGray',
    'darkslategrey': 'DarkSlateGrey',
    'darkturquoise': 'DarkTurquoise',
    'darkviolet': 'DarkViolet',
    'deeppink': 'DeepPink',
    'deepskyblue': 'DeepSkyBlue',
    'dimgray': 'DimGray',
    'dimgrey': 'DimGrey',
    'dodgerblue': 'DodgerBlue',
    // F
    'firebrick': 'FireBrick',
    'floralwhite': 'FloralWhite',
    'forestgreen': 'ForestGreen',
    'fuchsia': 'Fuchsia',
    // G
    'gainsboro': 'Gainsboro',
    'ghostwhite': 'GhostWhite',
    'gold': 'Gold',
    'goldenrod': 'GoldenRod',
    'gray': 'Gray',
    'green': 'Green',
    'greenyellow': 'GreenYellow',
    'grey': 'Grey',
    // H
    'honeydew': 'HoneyDew',
    'hotpink': 'HotPink',
    // I
    'indianred': 'IndianRed',
    'indigo': 'Indigo',
    'ivory': 'Ivory',
    // K
    'khaki': 'Khaki',
    // L
    'lavender': 'Lavender',
    'lavenderblush': 'LavenderBlush',
    'lawngreen': 'LawnGreen',
    'lemonchiffon': 'LemonChiffon',
    'lightblue': 'LightBlue',
    'lightcoral': 'LightCoral',
    'lightcyan': 'LightCyan',
    'lightgoldenrodyellow': 'LightGoldenRodYellow',
    'lightgray': 'LightGray',
    'lightgreen': 'LightGreen',
    'lightgrey': 'LightGrey',
    'lightpink': 'LightPink',
    'lightsalmon': 'LightSalmon',
    'lightseagreen': 'LightSeaGreen',
    'lightskyblue': 'LightSkyBlue',
    'lightslategray': 'LightSlateGray',
    'lightslategrey': 'LightSlateGrey',
    'lightsteelblue': 'LightSteelBlue',
    'lightyellow': 'LightYellow',
    'lime': 'Lime',
    'limegreen': 'LimeGreen',
    'linen': 'Linen',
    // M
    'magenta': 'Magenta',
    'maroon': 'Maroon',
    'mediumaquamarine': 'MediumAquaMarine',
    'mediumblue': 'MediumBlue',
    'mediumorchid': 'MediumOrchid',
    'mediumpurple': 'MediumPurple',
    'mediumseagreen': 'MediumSeaGreen',
    'mediumslateblue': 'MediumSlateBlue',
    'mediumspringgreen': 'MediumSpringGreen',
    'mediumturquoise': 'MediumTurquoise',
    'mediumvioletred': 'MediumVioletRed',
    'midnightblue': 'MidnightBlue',
    'mintcream': 'MintCream',
    'mistyrose': 'MistyRose',
    'moccasin': 'Moccasin',
    // N
    'navajowhite': 'NavajoWhite',
    'navy': 'Navy',
    // O
    'oldlace': 'OldLace',
    'olive': 'Olive',
    'olivedrab': 'OliveDrab',
    'orange': 'Orange',
    'orangered': 'OrangeRed',
    'orchid': 'Orchid',
    // P
    'palegoldenrod': 'PaleGoldenRod',
    'palegreen': 'PaleGreen',
    'paleturquoise': 'PaleTurquoise',
    'palevioletred': 'PaleVioletRed',
    'papayawhip': 'PapayaWhip',
    'peachpuff': 'PeachPuff',
    'peru': 'Peru',
    'pink': 'Pink',
    'plum': 'Plum',
    'powderblue': 'PowderBlue',
    'purple': 'Purple',
    // R
    'rebeccapurple': 'RebeccaPurple',
    'red': 'Red',
    'rosybrown': 'RosyBrown',
    'royalblue': 'RoyalBlue',
    // S
    'saddlebrown': 'SaddleBrown',
    'salmon': 'Salmon',
    'sandybrown': 'SandyBrown',
    'seagreen': 'SeaGreen',
    'seashell': 'SeaShell',
    'sienna': 'Sienna',
    'silver': 'Silver',
    'skyblue': 'SkyBlue',
    'slateblue': 'SlateBlue',
    'slategray': 'SlateGray',
    'slategrey': 'SlateGrey',
    'snow': 'Snow',
    'springgreen': 'SpringGreen',
    'steelblue': 'SteelBlue',
    // T
    'tan': 'Tan',
    'teal': 'Teal',
    'thistle': 'Thistle',
    'tomato': 'Tomato',
    'turquoise': 'Turquoise',
    // V
    'violet': 'Violet',
    // W
    'wheat': 'Wheat',
    'white': 'White',
    'whitesmoke': 'WhiteSmoke',
    // Y
    'yellow': 'Yellow',
    'yellowgreen': 'YellowGreen'
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

// Function to add a color to a specific collection
function addColorToSpecificCollection(collectionId, colorValue) {
  const data = getCollections();
  const collection = data.collections.find(c => c.id === collectionId);

  if (!collection) return;

  // Get the current color value from the input field if not provided
  if (!colorValue) {
    const colorInput = document.getElementById('colorInput');
    if (colorInput) {
      colorValue = colorInput.value;
    }
  }

  // Parse the color value, supporting RGB input
  const hexValue = parseRgbInput(colorValue);
  if (!hexValue) {
    showToast('Please enter a valid color. Examples: #FF0000, red, rgb(255,0,0), or "255 0 0"');
    return;
  }

  // Get the best color name
  const colorName = getBestColorName(hexValue);

  // Create new color object with current settings
  const newColor = {
    id: generateId(),
    name: colorName,
    base: hexValue,  // Always store the hex value for consistent rendering
    defaultMode: document.getElementById('defaultRampToggle')?.checked ? 'dark' : 'light',
    vibrancy: document.getElementById('vibrancy-boost-select')?.value || 0,
    createdAt: new Date().toISOString(),
    // Store the current ramps with the color for accurate export
    lightRamp: currentLightRamp,
    darkRamp: currentDarkRamp
  };

  // Convert the ramps to a serializable format if they're not already
  if (newColor.lightRamp) {
    const serializedLightRamp = {};
    Object.entries(newColor.lightRamp).forEach(([scale, color]) => {
      if (color && typeof color.toHexString === 'function') {
        serializedLightRamp[scale] = tinycolor(color).toHexString();
      }
    });
    newColor.lightRamp = serializedLightRamp;
  }

  if (newColor.darkRamp) {
    const serializedDarkRamp = {};
    Object.entries(newColor.darkRamp).forEach(([scale, color]) => {
      if (color && typeof color.toHexString === 'function') {
        serializedDarkRamp[scale] = tinycolor(color).toHexString();
      }
    });
    newColor.darkRamp = serializedDarkRamp;
  }

  // Add color to the end of the collection
  collection.colors.push(newColor);

  // Save updated collections
  saveCollections(data);

  // Re-render collections
  renderCollections();

  if (window.appToast && window.APP_TOAST_MESSAGES) {
    window.appToast.success(window.APP_TOAST_MESSAGES.colorAdded);
  } else if (window.showAppToast) {
    window.showAppToast('Color added successfully!');
  }

  // Update Add Current Color button visibility
  toggleAddColorButtonVisibility();

  // Scroll to the collection
  const collectionElement = document.querySelector(`[data-collection-id="${collectionId}"]`);
  if (collectionElement) {
    collectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Scroll the colors list to the bottom to show the newly added color
    const colorsList = collectionElement.querySelector('.collection-colors');
    if (colorsList) {
      // Small timeout to ensure the element is rendered before scrolling
      setTimeout(() => {
        colorsList.scrollTop = colorsList.scrollHeight;
      }, 100);
    }
  }
}

// Import collections from JSON
function importCollections(jsonString) {
  try {
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

    const data = JSON.parse(jsonString);

    // Handle different formats
    let collectionsToImport = [];

    if (data.collections && Array.isArray(data.collections)) {
      // Standard backup format
      collectionsToImport = data.collections;
    } else if (Array.isArray(data)) {
      // Direct array of collections
      collectionsToImport = data;
    } else if (data.format === 'backup' && data.data) {
      // Single collection in backup format
      collectionsToImport = [data.data];
    } else {
      throw new Error('Invalid JSON format. Expected collections array.');
    }

    if (collectionsToImport.length === 0) {
      const importErrorEl = document.getElementById('import-modal-error');
      const span = importErrorEl?.querySelector('span');
      if (importErrorEl && span) {
        span.textContent = 'No valid collections found in the JSON data.';
        importErrorEl.classList.add('is-visible');
      }
      return;
    }

    // Get existing collections
    const existingData = getCollections();
    const existingIds = new Set(existingData.collections.map(c => c.id));
    const existingNames = new Map(existingData.collections.map(c => [c.name.toLowerCase(), c.id]));
    let importCount = 0;
    let duplicateFound = false;
    let duplicateCollectionName = '';
    let duplicateCollectionId = '';

    // First pass: Check for duplicates
    for (const collection of collectionsToImport) {
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
    for (const collection of collectionsToImport) {
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
      importCount++;
    }

    // Save updated collections
    saveCollections(existingData);

    // Update UI
    renderCollections();
    toggleAddColorButtonVisibility();

    // Close modal and show success message
    closeImportModal();

    // Only show success message if we actually imported something
    if (importCount > 0) {
      if (collectionsToImport.length > 0) {
        const firstName = collectionsToImport[0].name;
        appToast.success(`Successfully imported collection "${firstName}"!`);
      }

      // Scroll to the last imported collection and highlight it
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
    }

  } catch (error) {
    const msg = 'Error reading or parsing the JSON. Please ensure it is a valid file.\n\n' +
                'If you are importing a backup file, please ensure it includes the complete JSON data.';
    const importErrorEl = document.getElementById('import-modal-error');
    const span = importErrorEl?.querySelector('span');
    if (importErrorEl && span) {
      span.textContent = msg;
      importErrorEl.classList.add('is-visible');
    } else {
      alert(msg);
    }
  }
}

// Function to open the import modal
function openImportModal() {
  const modal = document.getElementById('import-modal');
  const backdrop = document.getElementById('import-modal-backdrop');
  const importErrorEl = document.getElementById('import-modal-error');
  const span = importErrorEl?.querySelector('span');
  if (importErrorEl && span) {
    span.textContent = '';
    importErrorEl.classList.remove('is-visible');
  }
  const closeBtn = document.getElementById('close-import-modal');

  if (modal && backdrop) {
    modal.classList.add('active');
    backdrop.classList.add('active');
    document.body.classList.add('modal-open');

    if (closeBtn && closeBtn instanceof HTMLElement) {
      closeBtn.focus();
    }
  }
}

// Function to close the import modal
function closeImportModal() {
  const modal = document.getElementById('import-modal');
  const backdrop = document.getElementById('import-modal-backdrop');
  const textarea = document.getElementById('import-json-textarea');
  const fileInput = document.getElementById('import-file-input');
  const importErrorEl = document.getElementById('import-modal-error');
  const span = importErrorEl?.querySelector('span');

  if (modal && backdrop) {
    modal.classList.remove('active');
    backdrop.classList.remove('active');
    document.body.classList.remove('modal-open');

    // Clear inputs
    if (textarea) textarea.value = '';
    if (fileInput) fileInput.value = '';

    if (importErrorEl && span) {
      span.textContent = '';
      importErrorEl.classList.remove('is-visible');
    }
  }
}

// Function to create a new collection
function createNewCollection() {
  if (window.__collectionsCrudModals?.openNewCollectionModal) {
    window.__collectionsCrudModals.openNewCollectionModal(document.getElementById('create-collection-btn'));
  }
}

// Function to handle in-context editing
function startEditing(element, onSave) {
  const currentName = element.textContent.trim();
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentName;
  input.className = 'edit-name-input';

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
}

// Initialize collections when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  // Wait for window load to ensure Lucide is available
  window.addEventListener('load', function () {
    // Check for any JavaScript errors
    window.onerror = function (message, source, lineno, colno, error) {
      alert(`JavaScript error: ${message} at ${source} ${lineno} ${colno} ${error}`);
      return false;
    };

    // Check if collections section exists and is visible
    const collectionsSection = document.getElementById('collections-section');
    if (collectionsSection) {
      // Ensure the collections section is visible
      if (window.getComputedStyle(collectionsSection).display === 'none') {
        collectionsSection.style.display = 'block';
      }

      // Check if the collections list container exists and is visible
      const collectionsList = document.getElementById('collections-list');
      if (collectionsList) {
        // Ensure the collections list is visible
        if (window.getComputedStyle(collectionsList).display === 'none') {
          collectionsList.style.display = 'block';
        }
      }
    }

    // Initialize collections (only call once)
    renderCollections();

    // Set up Add to Collection button
    const addToCollectionBtn = document.getElementById('add-color-shortcut-btn');
    if (addToCollectionBtn) {
      addToCollectionBtn.addEventListener('click', addColorToCollection);
    } else {
      alert('Add to Collection button not found');
    }

    // Set up Create Collection button
    const createCollectionBtn = document.getElementById('create-collection-btn');
    if (createCollectionBtn) {
      if (!window.__collectionsCrudModals) {
        window.__collectionsCrudModals = initCollectionsCrudModals();
      }
      createCollectionBtn.addEventListener('click', createNewCollection);
    } else {
      alert('Create Collection button not found');
    }

    // Set up Default Ramp Mode toggle
    const defaultRampToggle = document.getElementById('defaultRampToggle');
    if (defaultRampToggle) {
      defaultRampToggle.addEventListener('change', function () {
        isDarkModeDefault = defaultRampToggle.checked;

        // Get the current color input value
        const colorInput = document.getElementById('colorInput');
        if (colorInput && colorInput.value) {
          const colorValue = colorInput.value;
          const colorObj = tinycolor(colorValue);

          // Only update if we have a valid color
          if (colorObj.isValid()) {
            // Update the color ramps with the current color
            updateColorRamps(colorValue);
          }
        }
      });
    }

    // Update Add Current Color button visibility
    toggleAddColorButtonVisibility();

    // ---- Collections Logic ----

    // Set up the import collections button
    const importCollectionsBtn = document.getElementById('import-collections-btn');
    if (importCollectionsBtn) {
      importCollectionsBtn.addEventListener('click', openImportModal);
    }

    // Note: The Add Color button event listener is already set up at line 2910
    // No need for a second event listener here

    // Set up the collections list event delegation
    const collectionsContainer = document.getElementById('collections-section');
    if (collectionsContainer) {
      collectionsContainer.addEventListener('click', function (e) {
        // Find the collection item
        const collectionItem = e.target.closest('.collection-item');
        if (!collectionItem) return;

        const collectionId = collectionItem.dataset.collectionId;
        const data = getCollections();
        const collection = data.collections.find(c => c.id === collectionId);
        if (!collection) return;

        // --- In-context Editing ---

        // Edit Collection Name - handle both direct clicks and icon clicks
        const collectionNameEl = e.target.closest('.collection-name') ||
                               (e.target.classList.contains('icon-edit') && e.target.closest('h3'));
        if (collectionNameEl) {
          const targetEl = collectionNameEl.classList.contains('collection-name') ?
                         collectionNameEl :
                         collectionNameEl.querySelector('.collection-name') ||
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

        // Handle Add Current Color button click
        if (e.target.classList.contains('btn-add-color') || e.target.closest('.btn-add-color')) {
          e.preventDefault();
          e.stopPropagation();

          // Get the current color from the color input
          const colorInput = document.getElementById('colorInput');
          if (!colorInput || !colorInput.value) return;

          // Parse the color value, supporting RGB input
          const rawUserInput = colorInput.value.trim();
          const hexValue = parseRgbInput(rawUserInput);

          if (!hexValue) {
            alert('Please enter a valid color first. Examples: #FF0000, red, rgb(255,0,0), or "255 0 0"');
            return;
          }

          // Get the best color name
          const colorName = getBestColorName(hexValue);

          // Create new color object with current settings
          const newColor = {
            id: generateId(),
            name: colorName,
            base: hexValue,
            defaultMode: document.getElementById('defaultRampToggle').checked ? 'dark' : 'light',
            vibrancy: document.getElementById('vibrancy-boost-select')?.value || 0,
            createdAt: new Date().toISOString()
          };

          // Add color to the end of the collection
          collection.colors.push(newColor);

          // Save and re-render
          saveCollections(data);
          renderCollections();

          // Show toast notification and scroll to the collection
          if (window.appToast && window.APP_TOAST_MESSAGES) {
            window.appToast.success(window.APP_TOAST_MESSAGES.colorAdded);
          } else if (window.showAppToast) {
            window.showAppToast('Color added successfully!');
          }

          // Scroll to the collection and then to the bottom to show the newly added color
          collectionItem.scrollIntoView({ behavior: 'smooth', block: 'start' });
          const colorsList = collectionItem.querySelector('.collection-colors');
          if (colorsList) {
            colorsList.scrollTop = colorsList.scrollHeight;
          }
        }

        // Export Collection to JSON
        if (e.target.classList.contains('btn-export-collection')) {
          openExportModal(collection);
        }

        // Load Color
        const loadButton = e.target.closest('.btn-load-color');
        if (loadButton) {
          e.preventDefault();
          e.stopPropagation();

          const colorItem = loadButton.closest('.collection-color-item');
          const colorId = colorItem.dataset.colorId;
          const colorToLoad = collection.colors.find(c => c.id === colorId);

          if (colorToLoad) {
            const colorInput = document.getElementById('colorInput');
            const rampToggle = document.getElementById('defaultRampToggle');

            if (colorInput && rampToggle) {
              // Update the input field with the color
              colorInput.value = colorToLoad.base;

              // Update the ramp toggle based on the saved mode
              rampToggle.checked = (colorToLoad.defaultMode === 'dark');

              // Trigger the color update with the new color
              updateColorRamps(colorToLoad.base);
            }
          }
        }

        // Delete Item (Unified Handler)
        const deleteButton = e.target.closest('.btn-delete');
        if (deleteButton) {
          const colorItem = deleteButton.closest('.collection-color-item');

          if (colorItem) {
            // Delete a single color
            const colorId = colorItem.dataset.colorId;
            const colorToDelete = collection.colors.find(c => c.id === colorId);
            if (colorToDelete && window.__collectionsCrudModals?.openDeleteColorModal) {
              window.__collectionsCrudModals.openDeleteColorModal({
                message: `Are you sure you want to delete the color "${colorToDelete.name}"? This cannot be undone.`,
                collectionId,
                colorId,
                returnFocusEl: deleteButton
              });
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

    // Note: The collections container click handler is already set up above

    // Set up the import/export modals
    setupModal('import-collections-btn', 'import-modal', 'close-import-modal', 'import-modal-backdrop');
    setupModal('export-collections-btn', 'export-modal', 'close-export-modal', 'export-modal-backdrop');

    // Set up Figma example modals
    const figmaPairedExampleLink = document.getElementById('figma-paired-example-link');
    const figmaThemedExampleLink = document.getElementById('figma-themed-example-link');
    const figmaExampleModal = document.getElementById('figma-example-modal');
    const figmaExampleModalBackdrop = document.getElementById('figma-example-modal-backdrop');
    const figmaExampleImage = document.getElementById('figma-example-image');
    const closeFigmaExampleModal = document.getElementById('close-figma-example-modal');

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
      // Only proceed if this modal is the top one
      if (modalStack.length > 0 && modalStack[modalStack.length - 1].modal === figmaExampleModal) {
        modalStack.pop();

        // Hide the modal
        figmaExampleModal.classList.remove('active');
        figmaExampleModalBackdrop.classList.remove('active');



        // Focus back to the link that opened this modal
        const activeElement = document.activeElement;
        if (activeElement && (activeElement === figmaPairedExampleLink || activeElement === figmaThemedExampleLink)) {
          activeElement.blur();
        }
      }
    }

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
    if (closeFigmaExampleModal) {
      closeFigmaExampleModal.addEventListener('click', closeFigmaExampleModalHandler);
    }

    if (figmaExampleModalBackdrop) {
      figmaExampleModalBackdrop.addEventListener('click', closeFigmaExampleModalHandler);
    }

    // Individual ESC handler removed - using global one now

    // Set up file input for import
    const fileInput = document.getElementById('import-file-input');
    const importTextarea = document.getElementById('import-json-textarea');
    const importFromTextBtn = document.getElementById('import-from-textarea-btn');
    const importErrorEl = document.getElementById('import-modal-error');

    const setImportError = (message) => {
      const span = importErrorEl?.querySelector('span');
      if (importErrorEl && span) {
        span.textContent = message || '';
        importErrorEl.classList.toggle('is-visible', Boolean(message));
      }
    };

    const clearImportError = () => setImportError('');

    if (importTextarea) {
      importTextarea.addEventListener('input', clearImportError);
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        clearImportError();
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              importCollections(e.target.result);
            } catch (error) {
              setImportError('Error reading or parsing the JSON. Please ensure it is a valid file.\n\n' +
                            'If you are importing a backup file, please ensure it includes the complete JSON data.');
            }
            // Reset the file input to allow selecting the same file again
            fileInput.value = '';
          };
          reader.onerror = () => {
            setImportError('Error reading the file. Please try again.');
            fileInput.value = '';
          };
          reader.readAsText(file);
        }
      });
    }

    if (importFromTextBtn && importTextarea) {
      importFromTextBtn.addEventListener('click', () => {
        clearImportError();
        const jsonText = importTextarea.value.trim();
        if (jsonText) {
          try {
            importCollections(jsonText);
          } catch (error) {
            console.error('Error importing from text:', error);
            setImportError('Error reading or parsing the JSON. Please ensure it is a valid file.\n\n' +
                          'If you are importing a backup file, please ensure it includes the complete JSON data.');
          }
        } else {
          setImportError('Please paste your JSON data in the text area.');
        }
      });
    }

    // Set up export modal elements
    const closeExportModalBtn = document.getElementById('close-export-modal');
    if (closeExportModalBtn) {
      closeExportModalBtn.addEventListener('click', closeExportModal);
    }

    const exportModalBackdrop = document.getElementById('export-modal-backdrop');
    if (exportModalBackdrop) {
      exportModalBackdrop.addEventListener('click', closeExportModal);
    }
  });
});

// Function to get an automatic color name based on the color value
function getAutoColorName(userInput) {
  // If ntc (Name That Color) is available, use it
  if (typeof ntc !== 'undefined' && typeof ntc.name === 'function') {
    try {
      const colorObj = tinycolor(userInput);
      if (colorObj.isValid()) {
        const hex = colorObj.toHexString();
        const colorInfo = ntc.name(hex);
        return colorInfo[1]; // Return the color name
      }
    } catch (e) {
      console.error('Error getting color name:', e);
    }
  }

  // Fallback: Generate a simple name based on the hex value
  try {
    const colorObj = tinycolor(userInput);
    if (colorObj.isValid()) {
      const hex = colorObj.toHexString().toUpperCase();
      return `Color ${hex.substring(1, 4)}`; // Use first 3 chars of hex
    }
  } catch (e) {
    console.error('Error generating fallback color name:', e);
  }

  // Last resort
  return 'Unnamed Color';
}

/**
 * Special handling for specific color ranges to ensure optimal dark mode ramps
 * Each range defines min/max hue and specific ramp generation parameters
 */
const SPECIAL_COLOR_RANGES = [
  // Blue colors (200-260° hue) - for colors like #172554, #172590
  {
    minHue: 200,
    maxHue: 260,
    name: 'blue',
    darkRamp: {
      minSaturation: 0.55,   // Higher minimum saturation for better visibility
      maxSaturation: 0.92,   // Allow for rich blues without being too intense
      lightness: {
        '50': 0.12,   // Dark but visible
        '100': 0.22,  // Slightly lighter than 50
        '200': 0.32,  // Noticeable step up
        '300': 0.44,  // Medium dark
        '400': 0.56,  // Mid-tone
        '500': 0.66,  // Base color - slightly lighter than middle
        '600': 0.74,  // Noticeably lighter than 500
        '700': 0.81,  // Light
        '800': 0.87,  // Very light
        '900': 0.93,  // Almost white
        '950': 0.97   // Near white
      }
    }
  },
  // Green colors (80-160° hue)
  {
    minHue: 80,
    maxHue: 160,
    name: 'green',
    darkRamp: {
      minSaturation: 0.5,
      maxSaturation: 0.85,
      lightness: {
        '50': 0.14,   // Dark but visible
        '100': 0.22,  // Slightly lighter than 50
        '200': 0.32,  // Noticeable step up
        '300': 0.44,  // Medium dark
        '400': 0.54,  // Mid-tone
        '500': 0.64,  // Base color
        '600': 0.72,  // Noticeably lighter than 500
        '700': 0.79,  // Light
        '800': 0.86,  // Very light
        '900': 0.92,  // Almost white
        '950': 0.96   // Near white
      }
    }
  },
  // Red-orange colors (350-30° hue, wrapping around 0)
  {
    minHue: 350,
    maxHue: 30,
    name: 'red-orange',
    darkRamp: {
      minSaturation: 0.6,  // Higher minimum saturation for better visibility
      maxSaturation: 0.9,  // Keep saturation in check for better appearance
      lightness: {
        '50': 0.14,   // Dark but visible
        '100': 0.24,  // More distinct from 50
        '200': 0.36,  // Clear step up from 100
        '300': 0.48,  // Medium dark - distinct from 200
        '400': 0.58,  // Mid-tone - slightly lighter
        '500': 0.66,  // Base color - slightly lighter for better visibility
        '600': 0.74,  // Noticeably lighter than 500
        '700': 0.81,  // Light - more distinct from 600
        '800': 0.87,  // Very light - better progression
        '900': 0.93,  // Almost white
        '950': 0.97   // Near white
      }
    }
  },
  // Purple/magenta colors (270-330° hue)
  {
    minHue: 270,
    maxHue: 330,
    name: 'purple-magenta',
    darkRamp: {
      minSaturation: 0.5,   // Slightly lower minimum saturation
      maxSaturation: 0.88,  // Keep saturation in check for better appearance
      lightness: {
        '50': 0.13,   // Slightly lighter than red-orange for better visibility
        '100': 0.23,  // More distinct from 50
        '200': 0.35,  // Clear step up from 100
        '300': 0.47,  // Medium dark - more distinct from 200
        '400': 0.57,  // Mid-tone - slightly lighter
        '500': 0.65,  // Base color - slightly lighter for better visibility
        '600': 0.73,  // Noticeably lighter than 500
        '700': 0.80,  // Light - more distinct from 600
        '800': 0.87,  // Very light - better progression
        '900': 0.93,  // Almost white
        '950': 0.97   // Near white
      }
    }
  }
];

/**
 * Get special color handling for a given hue, if any
 * @param {number} hue - The hue value (0-360)
 * @returns {Object|null} - The special color handling object or null if none
 */
function getSpecialColorHandling(hue) {
  return SPECIAL_COLOR_RANGES.find(range =>
    (hue >= range.minHue && hue <= range.maxHue)
  ) || null;
}