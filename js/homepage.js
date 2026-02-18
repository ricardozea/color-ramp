document.addEventListener('DOMContentLoaded', () => {
  const colors = ['#82caff', '#ffb3c1', '#a9dfff', '#b3ffb3', '#ffffb3', '#ffb3ff'];
  let colorIndex = 0;
  const body = document.body;

  function hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
  }

  document.addEventListener('mousemove', (e) => {
    body.style.setProperty('--mouse-x', `${e.clientX}px`);
    body.style.setProperty('--mouse-y', `${e.clientY}px`);
  });

  function updateColor() {
    const currentColorHex = colors[colorIndex];
    const currentColorRgb = hexToRgb(currentColorHex);

    const dynamicColorElements = document.querySelectorAll('.dynamic-color-text');

    dynamicColorElements.forEach(el => {
      el.style.color = currentColorHex;
      el.style.transition = 'color 2s ease-in-out';
    });

    if (window.canvas && typeof window.canvas.updateColors === 'function') {
      window.canvas.updateColors({ flashlight: currentColorHex });
    }

    colorIndex = (colorIndex + 1) % colors.length;
  }

  updateColor();
  setInterval(updateColor, 5000);

  // Listen for the custom event fired when the footer is loaded
  document.addEventListener('footerLoaded', updateColor);
});
