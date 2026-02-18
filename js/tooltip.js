// Simple tooltip system
if (typeof Tooltip === 'undefined') {
class Tooltip {
  constructor() {
    this.tooltip = null;
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.init();
  }

  init() {
    // Don't initialize on touch devices
    if (this.isTouchDevice) return;

    // Create tooltip element
    this.createTooltip();

    // Add event listeners
    document.addEventListener('mouseover', this.handleMouseOver.bind(this));
    document.addEventListener('mouseout', this.handleMouseOut.bind(this));
  }

  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tooltip';
    document.body.appendChild(this.tooltip);
  }

  handleMouseOver(e) {
    const target = e.target.closest('[title]');
    if (!target) return;

    const title = target.getAttribute('title');
    if (!title) return;

    // Store original title and remove it to prevent native tooltip
    target.setAttribute('data-tooltip', title);
    target.removeAttribute('title');

    // Show tooltip
    this.showTooltip(title, target);
  }

  handleMouseOut(e) {
    const target = e.target.closest('[data-tooltip]');
    if (!target) return;

    // Restore original title
    const title = target.getAttribute('data-tooltip');
    if (title) {
      target.setAttribute('title', title);
      target.removeAttribute('data-tooltip');
    }

    // Hide tooltip
    this.hideTooltip();
  }

  showTooltip(text, element) {
    this.tooltip.textContent = text;
    this.tooltip.classList.add('visible');

    // Position tooltip
    const rect = element.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();

    // Position above the element
    let top = rect.top - tooltipRect.height - 8;
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

    // Keep within viewport bounds
    if (top < 0) {
      top = rect.bottom + 8;
    }
    if (left < 0) {
      left = 8;
    }
    if (left + tooltipRect.width > window.innerWidth) {
      left = window.innerWidth - tooltipRect.width - 8;
    }

    this.tooltip.style.top = `${top + window.scrollY}px`;
    this.tooltip.style.left = `${left + window.scrollX}px`;
  }

  hideTooltip() {
    this.tooltip.classList.remove('visible');
  }
}
}

// Global tooltip instance
let globalTooltip = null;

// Initialize tooltip system
document.addEventListener('DOMContentLoaded', () => {
  if (!globalTooltip) {
    globalTooltip = new Tooltip();
  }
});

// Global function to hide all tooltips
window.hideAllTooltips = () => {
  try {
    // Find and hide any visible tooltip
    const tooltip = document.querySelector('.tooltip.visible');
    if (tooltip) {
      tooltip.classList.remove('visible');
    }

    // Also restore any elements with data-tooltip back to title
    const elementsWithDataTooltip = document.querySelectorAll('[data-tooltip]');
    elementsWithDataTooltip.forEach(element => {
      const title = element.getAttribute('data-tooltip');
      if (title) {
        element.setAttribute('title', title);
        element.removeAttribute('data-tooltip');
      }
    });
  } catch (error) {
    // Silently fail to avoid breaking delete functionality
    console.warn('Tooltip hide failed:', error);
  }
};
