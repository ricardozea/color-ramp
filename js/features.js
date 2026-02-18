// ====================
// SHARED FEATURES FOR OKLCH AND HSL PAGES
// ====================

// ====================
// TOOLTIP FUNCTIONALITY
// ====================

class Tooltip {
  constructor() {
    this.tooltip = null;
    this.isTouchDevice = this.detectTouchDevice();
    this.init();
  }

  detectTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  init() {
    if (this.isTouchDevice) {
      return; // Don't initialize tooltips on touch devices
    }

    this.createTooltip();
    this.setupEventListeners();
  }

  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tooltip';
    document.body.appendChild(this.tooltip);
  }

  setupEventListeners() {
    // Use event delegation for better performance
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('[title]');
      if (target) {
        const title = target.getAttribute('title');
        if (title) {
          // Store original title and remove it to prevent native tooltip
          target.setAttribute('data-tooltip', title);
          target.removeAttribute('title');
          this.showTooltip(title, target);
        }
      }
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target) {
        // Restore original title
        const title = target.getAttribute('data-tooltip');
        if (title) {
          target.setAttribute('title', title);
          target.removeAttribute('data-tooltip');
        }
        this.hideTooltip();
      }
    });

    // Update tooltip position on mouse move - removed since we position based on element
  }

  showTooltip(text, element) {
    this.tooltip.textContent = text;
    this.tooltip.classList.add('visible');
    this.updatePosition(element);
  }

  hideTooltip() {
    this.tooltip.classList.remove('visible');
  }

  updatePosition(element) {
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
}

// Initialize tooltip when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new Tooltip();
});

// ====================
// DRAG AND DROP FUNCTIONALITY FOR COLLECTIONS
// ====================

// Set up drag and drop functionality for collection color items
function setupDragAndDrop() {
  const colorItems = document.querySelectorAll('.collection-color-item');
  const colorLists = document.querySelectorAll('.collection-colors-list');

  if (!window.__selectionCursorHandlerInitialized) {
    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection ? window.getSelection() : null;
      const hasSelection = !!(selection && !selection.isCollapsed && selection.toString().trim() !== '');
      document.body.classList.toggle('text-selecting', hasSelection);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;

      // Clear DOM text selection
      const selection = window.getSelection ? window.getSelection() : null;
      const hasDomSelection = !!(selection && !selection.isCollapsed && selection.toString().trim() !== '');
      if (hasDomSelection) {
        try {
          selection.removeAllRanges();
        } catch (_) {
          // ignore
        }
        document.body.classList.remove('text-selecting');
        return;
      }

      // Clear selection in inputs/textareas (if any)
      const active = document.activeElement;
      const isTextInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
      if (isTextInput && typeof active.selectionStart === 'number' && typeof active.selectionEnd === 'number') {
        if (active.selectionStart !== active.selectionEnd) {
          try {
            active.setSelectionRange(active.selectionEnd, active.selectionEnd);
          } catch (_) {
            // ignore
          }
          document.body.classList.remove('text-selecting');
        }
      }
    });

    window.__selectionCursorHandlerInitialized = true;
  }

  let draggedElement = null;
  let draggedColorId = null;
  let sourceCollectionId = null;

  // Add drag event listeners to color items
  colorItems.forEach(item => {
    const setDraggable = (value) => {
      item.setAttribute('draggable', value ? 'true' : 'false');
    };

    item.addEventListener('mousedown', (e) => {
      // If the user is trying to select text, don't start a drag operation.
      if (e.target.closest('.collection-color-name, .color-hex')) {
        setDraggable(false);
      }
    });

    item.addEventListener('mouseup', () => setDraggable(true));
    item.addEventListener('mouseleave', () => setDraggable(true));

    item.addEventListener('dragstart', (e) => {
      const selection = window.getSelection ? window.getSelection() : null;
      if (selection && !selection.isCollapsed && selection.toString().trim() !== '') {
        e.preventDefault();
        return;
      }

      draggedElement = item;
      draggedColorId = item.dataset.colorId;
      sourceCollectionId = item.closest('.collection-colors-list').dataset.collectionId;

      try {
        if (typeof hideAllTooltips === 'function') {
          hideAllTooltips();
        }
      } catch (error) {
        // ignore
      }

      // Add dragging class for visual feedback
      item.classList.add('dragging');
      document.body.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', item.innerHTML);

      // Prevent default cursor behavior
      e.dataTransfer.setDragImage(new Image(), 0, 0);
    });

    item.addEventListener('dragend', (e) => {
      // Remove dragging class
      item.classList.remove('dragging');
      document.body.classList.remove('dragging');
      draggedElement = null;
      draggedColorId = null;
      sourceCollectionId = null;
    });

    // Prevent default drag over behavior
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      // Add visual feedback for drop target
      const rect = item.getBoundingClientRect();
      const midpoint = rect.left + rect.width / 2;

      // Remove existing insertion lines
      document.querySelectorAll('.insertion-line').forEach(line => line.remove());

      // Create insertion line
      const insertionLine = document.createElement('div');
      insertionLine.className = 'insertion-line';
      const container = item.closest('.collection-colors-list');

      // Use fixed height from CSS and center vertically on the hovered item.
      // We measure the element after inserting it to avoid transform-based rounding differences.
      insertionLine.style.top = '0px';
      insertionLine.style.left = '0px';
      document.body.appendChild(insertionLine);
      const lineHeight = insertionLine.getBoundingClientRect().height || 0;
      insertionLine.style.top = (rect.top + window.scrollY + (rect.height / 2) - (lineHeight / 2)) + 'px';
      insertionLine.style.transform = '';

      // Add background color to container when insertion line is visible
      if (container) {
        container.classList.add('insertion-line-active');
      }

      if (e.clientX < midpoint) {
        // Insert before - show line halfway between this box and the previous one
        const prevItem = item.previousElementSibling;
        if (prevItem && prevItem.classList.contains('collection-color-item')) {
          const prevRect = prevItem.getBoundingClientRect();
          const isPrevDifferentRow = Math.abs(prevRect.top - rect.top) > 4;
          if (isPrevDifferentRow) {
            // First item in this row - show line outside the row on the left
            insertionLine.style.left = (rect.left - 8) + window.scrollX + 'px';
          } else {
            insertionLine.style.left = ((prevRect.right + rect.left) / 2 - 1.5) + window.scrollX + 'px';
          }
        } else {
          // First item - show line outside the container on the left
          const container = item.closest('.collection-colors-list');
          const containerRect = container.getBoundingClientRect();
          insertionLine.style.left = (containerRect.left - 8) + window.scrollX + 'px';
        }
      } else {
        // Insert after - show line halfway between this box and the next one
        const nextItem = item.nextElementSibling;
        if (nextItem && nextItem.classList.contains('collection-color-item')) {
          const nextRect = nextItem.getBoundingClientRect();
          const isNextDifferentRow = Math.abs(nextRect.top - rect.top) > 4;
          if (isNextDifferentRow) {
            // Last item in this row - show line next to the item on the right
            insertionLine.style.left = (rect.right + 5) + window.scrollX + 'px';
          } else {
            insertionLine.style.left = ((rect.right + nextRect.left) / 2 - 1.5) + window.scrollX + 'px';
          }
        } else {
          // Last item - show line next to the last box on the right
          insertionLine.style.left = (rect.right + 5) + window.scrollX + 'px';
        }
      }

      // insertionLine already appended above for measurement/positioning
    });

    item.addEventListener('dragleave', (e) => {
      // Only remove insertion line, keep dragging class
      document.querySelectorAll('.insertion-line').forEach(line => line.remove());
      document.querySelectorAll('.collection-colors-list').forEach(container => {
        container.classList.remove('insertion-line-active');
      });
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Remove insertion line
      document.querySelectorAll('.insertion-line').forEach(line => line.remove());
      document.querySelectorAll('.collection-colors-list').forEach(container => {
        container.classList.remove('insertion-line-active');
      });

      if (draggedElement && draggedElement !== item) {
        const targetCollectionId = item.closest('.collection-colors-list').dataset.collectionId;
        const targetColorId = item.dataset.colorId;

        // Determine position based on mouse position
        const rect = item.getBoundingClientRect();
        const midpoint = rect.left + rect.width / 2;
        const position = e.clientX < midpoint ? 'before' : 'after';

        // Store ghost position for sliding animation
        const ghostRect = draggedElement.getBoundingClientRect();
        window.lastGhostPosition = {
          x: ghostRect.left,
          y: ghostRect.top
        };

        moveColorItem(draggedColorId, sourceCollectionId, targetCollectionId, targetColorId, position);
      }
    });
  });

  // Add drop zone functionality to color lists
  colorLists.forEach(list => {
    list.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      // Force grab cursor on drop zone
      list.style.cursor = 'grab';

      // Add visual feedback for drop zone
      if (!e.target.closest('.collection-color-item')) {
        list.classList.add('drag-over');
      }
    });

    list.addEventListener('dragleave', (e) => {
      if (!e.target.closest('.collection-color-item')) {
        list.classList.remove('drag-over');
      }
      list.style.cursor = '';
    });

    list.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Remove visual feedback
      list.classList.remove('drag-over');
      list.style.cursor = '';
      document.querySelectorAll('.insertion-line').forEach(line => line.remove());
      document.querySelectorAll('.collection-colors-list').forEach(container => {
        container.classList.remove('insertion-line-active');
      });

      // Allow dropping into empty collections
      if (draggedElement) {
        const targetCollectionId = list.dataset.collectionId;
        const hasColorItems = list.querySelector('.collection-color-item');

        // Store ghost position for sliding animation
        const ghostRect = draggedElement.getBoundingClientRect();
        window.lastGhostPosition = {
          x: ghostRect.left,
          y: ghostRect.top
        };

        if (!hasColorItems) {
          // Empty collection - add to end
          moveColorItem(draggedColorId, sourceCollectionId, targetCollectionId, null, 'end');
        } else if (!e.target.closest('.collection-color-item')) {
          // Non-empty collection but dropping on empty space
          const containerRect = list.getBoundingClientRect();
          const mouseX = e.clientX;

          // Determine if drop is at beginning or end based on mouse position
          const midpoint = containerRect.left + containerRect.width / 2;
          const position = mouseX < midpoint ? 'beginning' : 'end';

          // Find the first or last item for proper positioning
          const firstItem = list.querySelector('.collection-color-item');
          const lastItem = list.querySelector('.collection-color-item:last-child');

          let targetColorId = null;
          if (position === 'beginning' && firstItem) {
            targetColorId = firstItem.dataset.colorId;
          } else if (position === 'end' && lastItem) {
            targetColorId = lastItem.dataset.colorId;
          }

          moveColorItem(draggedColorId, sourceCollectionId, targetCollectionId, targetColorId, position);
        }
      }
    });
  });
}

// Move color item between collections or reorder within a collection
function moveColorItem(colorId, fromCollectionId, toCollectionId, targetColorId, position) {
  // This function will be overridden by the main script's implementation
  if (typeof window.moveColorItemHandler === 'function') {
    window.moveColorItemHandler(colorId, fromCollectionId, toCollectionId, targetColorId, position);
  }
}

// Enhanced moveColorItem function for main scripts
function createMoveColorItemHandler(getCollections, saveCollections, renderCollections) {
  return function(colorId, fromCollectionId, toCollectionId, targetColorId, position) {
    const data = getCollections();

    // Find source collection
    const fromCollection = data.collections.find(c => c.id === fromCollectionId);
    if (!fromCollection) return;

    // Find target collection
    const toCollection = data.collections.find(c => c.id === toCollectionId);
    if (!toCollection) return;

    // Find the color to move
    const colorIndex = fromCollection.colors.findIndex(c => c.id === colorId);
    if (colorIndex === -1) return;

    const [movedColor] = fromCollection.colors.splice(colorIndex, 1);

    // If moving to different collection
    if (fromCollectionId !== toCollectionId) {
      // Add to target collection
      if (position === 'end') {
        toCollection.colors.push(movedColor);
      } else if (position === 'beginning') {
        toCollection.colors.unshift(movedColor);
      } else if (targetColorId) {
        // Insert at specific position
        const targetIndex = toCollection.colors.findIndex(c => c.id === targetColorId);
        if (targetIndex !== -1) {
          if (position === 'after') {
            toCollection.colors.splice(targetIndex + 1, 0, movedColor);
          } else {
            toCollection.colors.splice(targetIndex, 0, movedColor);
          }
        } else {
          toCollection.colors.push(movedColor);
        }
      }
    } else {
      // Reordering within same collection
      if (position === 'beginning') {
        toCollection.colors.unshift(movedColor);
      } else if (position === 'end') {
        toCollection.colors.push(movedColor);
      } else if (targetColorId) {
        const targetIndex = toCollection.colors.findIndex(c => c.id === targetColorId);
        if (targetIndex !== -1) {
          // Remove the color first (already done above)
          // Insert at new position
          if (position === 'after') {
            toCollection.colors.splice(targetIndex + 1, 0, movedColor);
          } else {
            toCollection.colors.splice(targetIndex, 0, movedColor);
          }
        }
      }
    }

    // Save the updated collections
    saveCollections(data);

    // Re-render collections to reflect changes
    renderCollections();

    // Add sliding animation from ghost position to final position
    setTimeout(() => {
      const movedItem = document.querySelector(`[data-color-id="${colorId}"]`);
      if (movedItem && window.lastGhostPosition) {
        const finalRect = movedItem.getBoundingClientRect();
        const deltaX = window.lastGhostPosition.x - finalRect.left;
        const deltaY = window.lastGhostPosition.y - finalRect.top;

        // Set CSS custom property for the slide transform
        movedItem.style.setProperty('--slide-transform', `translate(${deltaX}px, ${deltaY}px) scale(0.95)`);

        // Add sliding animation class
        movedItem.classList.add('sliding');

        // After sliding animation, add settling animation
        setTimeout(() => {
          movedItem.classList.remove('sliding');
          movedItem.style.removeProperty('--slide-transform');
        }, 300);

        // Clear ghost position
        window.lastGhostPosition = null;
      }
    }, 50); // Small delay to ensure DOM is updated
  };
}

// ====================
// DEV URL FLAGS (DEVELOPMENT ONLY)
// ====================

// Usage:
// - Add query params to the page URL (these pages both load js/features.js):
//   - index-hsl.html?... or index-oklch.html?...
//
// Flags:
// - ?showNewCollectionModal
//   - Auto-opens the "New collection" modal on page load (for styling).
// - ?showDeleteColorModal
//   - Auto-opens the destructive "Delete color" modal on page load (for styling).
// - ?showNewCollectionError
//   - Auto-opens the "New collection" modal with an error message (for styling).
// - ?showImportCollectionsError
//   - Auto-opens the "Import collections" modal with an inline error message (for styling).
// - ?showContactMe
//   - Auto-opens the "Contact me" modal on page load (for styling).
// - ?showAccessibilityBanner
//   - Forces the accessibility banner to show on page load (for styling).
//
// Priority:
// - If multiple flags are present, "New collection" is opened first, then error state.
//
// Examples:
// - index-hsl.html?showNewCollectionModal
// - index-hsl.html?showDeleteColorModal
// - index-hsl.html?showNewCollectionError
// - index-hsl.html?showImportCollectionsError
// - index-hsl.html?showContactMe
// - index-hsl.html?showAccessibilityBanner

function runDevUrlFlags() {
  let params;
  try {
    params = new URLSearchParams(window.location.search);
  } catch (e) {
    return;
  }

  const shouldShowNewCollectionModal = params.has('showNewCollectionModal');
  const shouldShowDeleteColorModal = params.has('showDeleteColorModal');
  const shouldShowNewCollectionError = params.has('showNewCollectionError');
  const shouldShowImportCollectionsError = params.has('showImportCollectionsError');
  const shouldShowContactMe = params.has('showContactMe');
  const shouldShowAccessibilityBanner = params.has('showAccessibilityBanner');
  if (!shouldShowNewCollectionModal && !shouldShowDeleteColorModal && !shouldShowNewCollectionError && !shouldShowImportCollectionsError && !shouldShowContactMe && !shouldShowAccessibilityBanner) return;

  if (shouldShowAccessibilityBanner) {
    const banner = document.getElementById('accessibility-banner');
    if (banner) {
      banner.style.display = 'block';
    }

    window.__devForceAccessibilityBanner = true;
  }

  const openContactMeModal = () => {
    const modal = document.getElementById('contactRicardoModal');
    const backdrop = document.getElementById('contactRicardoModalBackdrop');
    if (!modal || !backdrop) return false;

    backdrop.classList.add('active');
    modal.classList.add('active');
    document.body.classList.add('modal-open');

    if (window.trapFocusInModal) {
      modal.__devReleaseFocus?.();
      modal.__devReleaseFocus = null;
    }
    if (window.trapFocusInModal) {
      modal.__devReleaseFocus = window.trapFocusInModal(modal);
    }

    const closeBtn = document.getElementById('closeContactRicardoModal');
    const nameInput = document.getElementById('name-input');
    const focusEl = nameInput || closeBtn || modal;
    if (focusEl && focusEl instanceof HTMLElement) {
      focusEl.focus();
    }

    return true;
  };

  const openImportModalWithInlineError = () => {
    const modal = document.getElementById('import-modal');
    const backdrop = document.getElementById('import-modal-backdrop');
    if (!modal || !backdrop) return false;

    backdrop.classList.add('active');
    modal.classList.add('active');
    document.body.classList.add('modal-open');

    const errorEl = document.getElementById('import-modal-error');
    if (errorEl) {
      const span = errorEl.querySelector('span');
      if (span) {
        span.textContent = 'Error reading or parsing the JSON. Please ensure it is a valid file.\n\n' +
                          'If you are importing a backup file, please ensure it includes the complete JSON data.';
      }
      errorEl.classList.add('is-visible');
    }

    const closeBtn = document.getElementById('close-import-modal');
    if (closeBtn && closeBtn instanceof HTMLElement) {
      closeBtn.focus();
    } else {
      modal.focus();
    }

    if (modal.__devReleaseFocus) {
      modal.__devReleaseFocus();
      modal.__devReleaseFocus = null;
    }
    if (window.trapFocusInModal) {
      modal.__devReleaseFocus = window.trapFocusInModal(modal);
    }

    const close = () => {
      if (modal.__devReleaseFocus) {
        modal.__devReleaseFocus();
        modal.__devReleaseFocus = null;
      }
      modal.classList.remove('active');
      backdrop.classList.remove('active');
      document.body.classList.remove('modal-open');
    };

    backdrop.onclick = close;
    if (closeBtn) closeBtn.onclick = close;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') close();
    };
    modal.addEventListener('keydown', onKeyDown, { once: true });

    return true;
  };

  const tryOpen = () => {
    const api = window.__collectionsCrudModals;
    if (!api) {
      if (shouldShowImportCollectionsError) {
        return openImportModalWithInlineError();
      }
      return false;
    }

    const returnFocusEl = document.getElementById('create-collection-btn');

    if (shouldShowNewCollectionModal && api.openNewCollectionModal) {
      api.openNewCollectionModal(returnFocusEl);
      return true;
    }

    if (shouldShowNewCollectionError && api.openNewCollectionModal) {
      // Open modal and then trigger error display
      api.openNewCollectionModal(returnFocusEl);
      // Set error message after modal opens
      setTimeout(() => {
        const errorEl = document.getElementById('new-collection-error');
        if (errorEl) {
          const span = errorEl.querySelector('span');
          if (span) span.textContent = 'There was an error creating your collection. Please try again.';
          errorEl.classList.add('is-visible');
        }
      }, 100);
      return true;
    }

    if (shouldShowDeleteColorModal && api.openDeleteColorModal) {
      api.openDeleteColorModal({
        message: 'Are you sure you want to delete the color "Example Color"? This cannot be undone.',
        collectionId: '__dev__',
        colorId: '__dev__',
        returnFocusEl
      });
      return true;
    }

    if (shouldShowContactMe) {
      return openContactMeModal();
    }

    if (shouldShowImportCollectionsError) {
      return openImportModalWithInlineError();
    }

    return false;
  };

  if (tryOpen()) return;

  const start = Date.now();
  const timer = setInterval(() => {
    if (tryOpen() || Date.now() - start > 3000) {
      clearInterval(timer);
    }
  }, 50);
}

const APP_TOAST_MESSAGES = {
  colorAdded: 'Color added successfully!'
};

const APP_TOAST_DEFAULT_DURATION_MS = 5000;

function getOrCreateAppToastEl() {
  let toastEl = document.getElementById('app-toast');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'app-toast';
    toastEl.className = 'app-toast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    toastEl.setAttribute('aria-atomic', 'true');
    document.body.appendChild(toastEl);
  }
  return toastEl;
}

function showAppToastImpl(message, variant = 'success', { duration = APP_TOAST_DEFAULT_DURATION_MS } = {}) {
  if (!message) return;

  const toastEl = getOrCreateAppToastEl();

  const variants = ['success', 'error', 'info', 'warning'];
  const safeVariant = variants.includes(variant) ? variant : 'success';

  toastEl.classList.remove(
    'app-toast--success',
    'app-toast--error',
    'app-toast--info',
    'app-toast--warning'
  );
  toastEl.classList.add(`app-toast--${safeVariant}`);

  // Errors/warnings should interrupt assistive tech; success/info can be polite.
  const ariaLive = (safeVariant === 'error' || safeVariant === 'warning') ? 'assertive' : 'polite';
  toastEl.setAttribute('aria-live', ariaLive);

  toastEl.textContent = message;

  if (toastEl.__hideTimer) {
    clearTimeout(toastEl.__hideTimer);
    toastEl.__hideTimer = null;
  }

  if (toastEl.__hideAnimTimer) {
    clearTimeout(toastEl.__hideAnimTimer);
    toastEl.__hideAnimTimer = null;
  }

  toastEl.classList.remove('is-hiding');
  toastEl.classList.remove('is-visible');
  void toastEl.offsetWidth;
  toastEl.classList.add('is-visible');

  toastEl.__hideTimer = setTimeout(() => {
    toastEl.classList.add('is-hiding');
    toastEl.classList.remove('is-visible');

    toastEl.__hideAnimTimer = setTimeout(() => {
      toastEl.classList.remove('is-hiding');
      toastEl.__hideAnimTimer = null;
    }, 400);
  }, duration);
}

const appToast = {
  show: (message, variant, options) => showAppToastImpl(message, variant, options),
  success: (message, options) => showAppToastImpl(message, 'success', options),
  error: (message, options) => showAppToastImpl(message, 'error', options),
  info: (message, options) => showAppToastImpl(message, 'info', options),
  warning: (message, options) => showAppToastImpl(message, 'warning', options)
};

function showWarningModal(message, { title = 'Warning', buttonText = 'OK' } = {}) {
  const activeEl = document.activeElement;

  let backdropEl = document.getElementById('app-warning-modal-backdrop');
  let modalEl = document.getElementById('app-warning-modal');

  if (!backdropEl) {
    backdropEl = document.createElement('div');
    backdropEl.id = 'app-warning-modal-backdrop';
    backdropEl.className = 'modal-backdrop';
    document.body.appendChild(backdropEl);
  }

  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'app-warning-modal';
    modalEl.className = 'modal modal--warning';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-labelledby', 'app-warning-modal-title');

    const contentEl = document.createElement('div');
    contentEl.className = 'modal-content';

    const headerEl = document.createElement('h2');
    headerEl.id = 'app-warning-modal-title';
    headerEl.textContent = title;

    const messageEl = document.createElement('p');
    messageEl.id = 'app-warning-modal-message';

    const actionsEl = document.createElement('div');
    actionsEl.className = 'modal-actions';

    const okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.id = 'app-warning-modal-ok';
    okBtn.className = 'btn-base';
    okBtn.textContent = buttonText;

    actionsEl.appendChild(okBtn);
    contentEl.appendChild(headerEl);
    contentEl.appendChild(messageEl);
    contentEl.appendChild(actionsEl);
    modalEl.appendChild(contentEl);
    document.body.appendChild(modalEl);
  }

  const messageEl = modalEl.querySelector('#app-warning-modal-message');
  if (messageEl) messageEl.textContent = message || '';

  const titleEl = modalEl.querySelector('#app-warning-modal-title');
  if (titleEl) titleEl.textContent = title;

  const okBtn = modalEl.querySelector('#app-warning-modal-ok');
  if (okBtn) okBtn.textContent = buttonText;

  const close = () => {
    if (modalEl.__releaseFocus) {
      modalEl.__releaseFocus();
      modalEl.__releaseFocus = null;
    }

    modalEl.classList.remove('active');
    backdropEl.classList.remove('active');
    document.body.classList.remove('modal-open');

    if (activeEl && activeEl instanceof HTMLElement) {
      activeEl.focus();
    }
  };

  backdropEl.onclick = close;
  if (okBtn) okBtn.onclick = close;

  const onKeyDown = (e) => {
    if (e.key === 'Escape') close();
  };
  modalEl.addEventListener('keydown', onKeyDown, { once: true });

  backdropEl.classList.add('active');
  modalEl.classList.add('active');
  document.body.classList.add('modal-open');

  modalEl.__releaseFocus = trapFocusInModal(modalEl);
  const focusTarget = okBtn || modalEl;
  if (focusTarget && focusTarget instanceof HTMLElement) {
    focusTarget.focus();
  }

  return close;
}

function trapFocusInModal(modalEl) {
  if (!modalEl) return () => {};

  if (!modalEl.hasAttribute('tabindex')) {
    modalEl.setAttribute('tabindex', '-1');
  }

  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  const getFocusable = () => {
    const nodes = Array.from(modalEl.querySelectorAll(focusableSelector));
    return nodes.filter((el) => {
      if (!(el instanceof HTMLElement)) return false;
      if (el.hasAttribute('disabled')) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      return true;
    });
  };

  const onKeyDown = (e) => {
    if (e.key !== 'Tab') return;

    const focusable = getFocusable();
    if (focusable.length === 0) {
      e.preventDefault();
      modalEl.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (e.shiftKey) {
      if (active === first || active === modalEl) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const onFocusIn = (e) => {
    if (!modalEl.classList.contains('active')) return;
    if (modalEl.contains(e.target)) return;

    const focusable = getFocusable();
    const target = focusable[0] || modalEl;
    target.focus();
  };

  modalEl.addEventListener('keydown', onKeyDown);
  document.addEventListener('focusin', onFocusIn);

  return () => {
    modalEl.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('focusin', onFocusIn);
  };
}

function updateScrollbarWidthVar() {
  const docEl = document.documentElement;
  if (!docEl) return;

  // When a modal opens we lock the page scroll via `body.modal-open { overflow: hidden; }`.
  // That removes the browser scrollbar and can change the viewport width, causing a visual "snap".
  //
  // We prevent that layout jump by measuring the scrollbar width and exposing it as a CSS variable.
  // CSS then applies a matching `padding-right` while the modal is open.
  const width = window.innerWidth - docEl.clientWidth;
  docEl.style.setProperty('--scrollbar-width', `${Math.max(0, width)}px`);
}

function formatCollectionTimestamp(isoString) {
  const date = new Date(isoString);
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';

  const monthNames = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May.', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
  const month = monthNames[date.getMonth()] || '';
  const day = String(date.getDate());
  const year = String(date.getFullYear());

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const isPm = hours >= 12;
  const amPm = isPm ? 'pm' : 'am';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const hh = String(hours);

  return `${month} ${day}, ${year} @ ${hh}:${minutes} ${amPm}`;
}

function buildCollectionCreatedMetadataHtml({ createdAt }) {
  const timestampText = formatCollectionTimestamp(createdAt);
  if (!timestampText) return '';
  return `<div class="metadata"><div class="metadata-created" title="Color ramp created on:">${timestampText}</div></div>`;
}

function buildCollectionTokenCounterHtml({ colorCount }) {
  const count = Number.isFinite(Number(colorCount)) ? Number(colorCount) : 0;
  const tokenLabel = count === 1 ? 'token' : 'tokens';
  const tokenText = `${count} ${tokenLabel}`;
  return `<div class="metadata token-counter"><span title="Number of tokens in this collection">${tokenText}</span></div>`;
}

function buildCollectionMetadataHtml({ createdAt, colorCount }) {
  const createdHtml = buildCollectionCreatedMetadataHtml({ createdAt });
  const tokensHtml = buildCollectionTokenCounterHtml({ colorCount });
  return `${createdHtml}${tokensHtml}`;
}

// ====================
// INITIALIZATION
// ====================

// Make functions available globally for use in main scripts
window.setupDragAndDrop = setupDragAndDrop;
window.moveColorItem = moveColorItem;
window.createMoveColorItemHandler = createMoveColorItemHandler;
window.formatCollectionTimestamp = formatCollectionTimestamp;
window.buildCollectionMetadataHtml = buildCollectionMetadataHtml;
window.buildCollectionCreatedMetadataHtml = buildCollectionCreatedMetadataHtml;
window.buildCollectionTokenCounterHtml = buildCollectionTokenCounterHtml;
window.APP_TOAST_MESSAGES = APP_TOAST_MESSAGES;
window.APP_TOAST_DEFAULT_DURATION_MS = APP_TOAST_DEFAULT_DURATION_MS;
window.appToast = appToast;
// Backward compatible global used by existing pages.
window.showAppToast = (message, variant, options) => showAppToastImpl(message, variant, options);
window.showWarningModal = showWarningModal;
window.trapFocusInModal = trapFocusInModal;
window.updateScrollbarWidthVar = updateScrollbarWidthVar;

runDevUrlFlags();

// Initialize (and keep updated) the scrollbar width variable used for the modal scroll lock.
updateScrollbarWidthVar();
window.addEventListener('resize', updateScrollbarWidthVar);

// ====================
// GLOBAL CURSOR ENFORCEMENT DURING DRAG OPERATIONS
// ====================

// Prevent cursor changes during global drag operations
document.addEventListener('dragover', (e) => {
  if (document.body.classList.contains('dragging')) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Force grab cursor on all elements during drag
    e.target.style.cursor = 'grab';

    // Also force cursor on parent elements
    let parent = e.target.parentElement;
    while (parent && parent !== document.body) {
      parent.style.cursor = 'grab';
      parent = parent.parentElement;
    }
  }
});

document.addEventListener('drop', (e) => {
  if (document.body.classList.contains('dragging')) {
    e.preventDefault();
  }
});

// Additional global cursor enforcement
document.addEventListener('dragenter', (e) => {
  if (document.body.classList.contains('dragging')) {
    e.preventDefault();
    e.target.style.cursor = 'grab';
  }
});

document.addEventListener('dragleave', (e) => {
  if (document.body.classList.contains('dragging')) {
    e.preventDefault();
    // Reset cursor when leaving element
    if (e.target) {
      e.target.style.cursor = '';
    }
  }
});
