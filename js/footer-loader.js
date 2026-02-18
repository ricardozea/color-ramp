document.addEventListener('DOMContentLoaded', () => {
  const placeholder = document.getElementById('footer-placeholder');
  if (placeholder) {
    fetch('footer.html')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.text();
      })
      .then(html => {
        // Create a temporary div to parse the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Insert the footer HTML
        placeholder.innerHTML = tempDiv.innerHTML;

        // Dispatch a custom event to notify that the footer is loaded
        const event = new CustomEvent('footerLoaded');
        document.dispatchEvent(event);
      })
      .catch(error => {
        console.error('Error loading footer:', error);
        placeholder.innerHTML = '<p style="color: red; text-align: center;">Error loading footer content.</p>';
      });
  }
});

document.addEventListener('footerLoaded', () => {
  // Function to handle modal open/close functionality
  function setupModal(triggerId, modalId, closeBtnId, backdropId) {
    const trigger = document.getElementById(triggerId);
    const modal = document.getElementById(modalId);
    const closeBtn = document.getElementById(closeBtnId);
    const backdrop = document.getElementById(backdropId);

    if (!trigger || !modal || !closeBtn || !backdrop) {
      return;
    }

    const openModal = (e) => {
      e.preventDefault();
      modal.classList.add('active');
      backdrop.classList.add('active');
      document.body.classList.add('modal-open');
      closeBtn.focus();
    };

    const closeModal = () => {
      modal.classList.remove('active');
      backdrop.classList.remove('active');
      document.body.classList.remove('modal-open');
    };

    trigger.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });

    return modal;
  }

  // Set current year
  const currentYearElement = document.getElementById('current-year');
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
  }

  // Initialize the contact modal
  setupModal('contactRicardo', 'contactRicardoModal', 'closeContactRicardoModal', 'contactRicardoModalBackdrop');

  // Handle form submission to show success message
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const formData = new FormData(this);
      const resultDiv = document.getElementById('result');

      fetch(this.action, {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Show success message
          resultDiv.innerHTML = '<div class="thank-you-message success-message"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart-handshake-icon lucide-heart-handshake"><path d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762"/></svg>Thank you for your message! I\'ll get back to you soon. - Ricardo</div>';

          // Trigger show animation
          setTimeout(() => {
            const messageElement = resultDiv.querySelector('.thank-you-message');
            if (messageElement) {
              messageElement.classList.add('showing');
            }
          }, 10);

          // Reset form
          this.reset();

          // Close modal after delay
          setTimeout(() => {
            const modal = document.getElementById('contactRicardoModal');
            const backdrop = document.getElementById('contactRicardoModalBackdrop');
            if (modal && backdrop) {
              modal.classList.remove('active');
              backdrop.classList.remove('active');
              document.body.classList.remove('modal-open');
            }
            // Clear success message
            setTimeout(() => {
              const messageElement = resultDiv.querySelector('.thank-you-message');
              if (messageElement) {
                messageElement.classList.add('hiding');
                setTimeout(() => {
                  resultDiv.innerHTML = '';
                }, 300);
              } else {
                resultDiv.innerHTML = '';
              }
            }, 1000);
          }, 5000);
        } else {
          // Show error message
          resultDiv.innerHTML = '<div class="thank-you-message error-message"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square-warning-icon lucide-message-square-warning"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/><path d="M12 15h.01"/><path d="M12 7v4"/></svg>Something went wrong. Please try again.</div>';

          // Trigger show animation
          setTimeout(() => {
            const messageElement = resultDiv.querySelector('.thank-you-message');
            if (messageElement) {
              messageElement.classList.add('showing');
            }
          }, 10);
        }
      })
      .catch(error => {
        // Show error message
        resultDiv.innerHTML = '<div class="thank-you-message error-message"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square-warning-icon lucide-message-square-warning"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/><path d="M12 15h.01"/><path d="M12 7v4"/></svg>Something went wrong. Please try again.</div>';

        // Trigger show animation
        setTimeout(() => {
          const messageElement = resultDiv.querySelector('.thank-you-message');
          if (messageElement) {
            messageElement.classList.add('showing');
          }
        }, 10);
        console.error('Form submission error:', error);
      });
    });
  }

  // Add global click listener as backup (original listener doesn't work on homepage)
  document.addEventListener('click', (e) => {
    if (e.target.id === 'contactRicardo' || e.target.closest('#contactRicardo')) {
      e.preventDefault();
      e.stopPropagation();

      const modal = document.getElementById('contactRicardoModal');
      const backdrop = document.getElementById('contactRicardoModalBackdrop');
      const closeBtn = document.getElementById('closeContactRicardoModal');

      if (modal && backdrop && closeBtn) {
        modal.classList.add('active');
        backdrop.classList.add('active');
        document.body.classList.add('modal-open');
        closeBtn.focus();
      }
    }
  }, true);
});
