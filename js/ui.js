// UI Helper Functions and Components
class UIComponents {
    static createLoadingSpinner(text = 'Cargando...') {
        return `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>${text}</p>
            </div>
        `;
    }

    static createErrorMessage(message, actionButton = null) {
        const actionHtml = actionButton ? 
            `<button class="error-action-btn" onclick="${actionButton.action}">${actionButton.text}</button>` : '';
        
        return `
            <div class="error-message">
                <div class="error-icon">⚠️</div>
                <h3>Error</h3>
                <p>${message}</p>
                ${actionHtml}
            </div>
        `;
    }

    static createEmptyState(title, message, actionButton = null) {
        const actionHtml = actionButton ? 
            `<button class="empty-action-btn" onclick="${actionButton.action}">${actionButton.text}</button>` : '';
        
        return `
            <div class="empty-state">
                <div class="empty-icon">📖</div>
                <h3>${title}</h3>
                <p>${message}</p>
                ${actionHtml}
            </div>
        `;
    }

    static createVerseElement(verseNumber, verseText, showNumber = true) {
        return `
            <div class="verse" data-verse="${verseNumber}">
                ${showNumber ? `<span class="verse-number">${verseNumber}</span>` : ''}
                <span class="verse-text">${verseText}</span>
            </div>
        `;
    }

    static createBookSelector(books, selectedBook = '') {
        let options = '<option value="">Seleccionar libro...</option>';
        
        // Group books by testament
        const otBooks = books.filter(book => BibleUtils.isOldTestament(book));
        const ntBooks = books.filter(book => BibleUtils.isNewTestament(book));
        
        if (otBooks.length > 0) {
            options += '<optgroup label="Antiguo Testamento">';
            otBooks.forEach(book => {
                options += `<option value="${book}" ${book === selectedBook ? 'selected' : ''}>${book}</option>`;
            });
            options += '</optgroup>';
        }
        
        if (ntBooks.length > 0) {
            options += '<optgroup label="Nuevo Testamento">';
            ntBooks.forEach(book => {
                options += `<option value="${book}" ${book === selectedBook ? 'selected' : ''}>${book}</option>`;
            });
            options += '</optgroup>';
        }
        
        return options;
    }

    static createChapterSelector(totalChapters, selectedChapter = '') {
        let options = '<option value="">Cap...</option>';
        for (let i = 1; i <= totalChapters; i++) {
            options += `<option value="${i}" ${i == selectedChapter ? 'selected' : ''}>${i}</option>`;
        }
        return options;
    }

    static showToast(message, type = 'info', duration = 3000) {
        // Remove existing toast
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
        `;

        // Add to document
        document.body.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);

        return toast;
    }

    static createModal(title, content, actions = []) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${actions.length > 0 ? `
                <div class="modal-footer">
                    ${actions.map(action => `
                        <button class="modal-btn ${action.type || ''}" onclick="${action.onClick}">
                            ${action.text}
                        </button>
                    `).join('')}
                </div>` : ''}
            </div>
        `;

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        return modal;
    }
}

// UI Animations and Transitions
class UIAnimations {
    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.transition = `opacity ${duration}ms ease-in-out`;
        element.classList.remove('hidden');
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
        });
    }

    static fadeOut(element, duration = 300) {
        element.style.opacity = '1';
        element.style.transition = `opacity ${duration}ms ease-in-out`;
        
        setTimeout(() => {
            element.style.opacity = '0';
            setTimeout(() => {
                element.classList.add('hidden');
            }, duration);
        }, 10);
    }

    static slideIn(element, direction = 'left', duration = 300) {
        const translateX = direction === 'left' ? '-100%' : '100%';
        element.style.transform = `translateX(${translateX})`;
        element.style.transition = `transform ${duration}ms ease-out`;
        element.classList.remove('hidden');
        
        requestAnimationFrame(() => {
            element.style.transform = 'translateX(0)';
        });
    }

    static slideOut(element, direction = 'left', duration = 300) {
        const translateX = direction === 'left' ? '-100%' : '100%';
        element.style.transform = 'translateX(0)';
        element.style.transition = `transform ${duration}ms ease-in`;
        
        setTimeout(() => {
            element.style.transform = `translateX(${translateX})`;
            setTimeout(() => {
                element.classList.add('hidden');
            }, duration);
        }, 10);
    }

    static pulse(element, duration = 600) {
        element.style.animation = `pulse ${duration}ms ease-in-out`;
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    }
}

// Touch gesture handling for iPad
class TouchGestureHandler {
    constructor(element, callbacks = {}) {
        this.element = element;
        this.callbacks = callbacks;
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;
        this.minSwipeDistance = 50;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.element.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        this.element.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
        this.element.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
    }

    handleTouchStart(e) {
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
        
        if (this.callbacks.onTouchStart) {
            this.callbacks.onTouchStart(e);
        }
    }

    handleTouchMove(e) {
        if (this.callbacks.onTouchMove) {
            this.callbacks.onTouchMove(e);
        }
    }

    handleTouchEnd(e) {
        this.endX = e.changedTouches[0].clientX;
        this.endY = e.changedTouches[0].clientY;
        
        this.detectSwipe();
        
        if (this.callbacks.onTouchEnd) {
            this.callbacks.onTouchEnd(e);
        }
    }

    detectSwipe() {
        const deltaX = this.endX - this.startX;
        const deltaY = this.endY - this.startY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        // Check if it's a horizontal swipe (more horizontal than vertical movement)
        if (absDeltaX > absDeltaY && absDeltaX > this.minSwipeDistance) {
            if (deltaX > 0) {
                // Swipe right
                if (this.callbacks.onSwipeRight) {
                    this.callbacks.onSwipeRight();
                }
            } else {
                // Swipe left
                if (this.callbacks.onSwipeLeft) {
                    this.callbacks.onSwipeLeft();
                }
            }
        }
        // Check if it's a vertical swipe
        else if (absDeltaY > absDeltaX && absDeltaY > this.minSwipeDistance) {
            if (deltaY > 0) {
                // Swipe down
                if (this.callbacks.onSwipeDown) {
                    this.callbacks.onSwipeDown();
                }
            } else {
                // Swipe up
                if (this.callbacks.onSwipeUp) {
                    this.callbacks.onSwipeUp();
                }
            }
        }
    }
}

// Responsive utilities for iPad
class ResponsiveUtils {
    static isIPad() {
        return /iPad|Macintosh/i.test(navigator.userAgent) && 'ontouchend' in document;
    }

    static isLandscape() {
        return window.innerWidth > window.innerHeight;
    }

    static isPortrait() {
        return window.innerHeight > window.innerWidth;
    }

    static getViewportSize() {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }

    static getOptimalFontSize() {
        const viewport = this.getViewportSize();
        const baseSize = 16;
        
        if (this.isIPad()) {
            return this.isLandscape() ? baseSize + 2 : baseSize;
        }
        
        return baseSize;
    }

    static setupOrientationHandler(callback) {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                callback(this.isLandscape() ? 'landscape' : 'portrait');
            }, 100); // Small delay to ensure proper orientation detection
        });
    }
}

// Accessibility helpers
class AccessibilityHelper {
    static announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    static setFocusToElement(element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    static trapFocus(container) {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        container.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });
        
        firstElement.focus();
    }
}

// Export for global access
window.UIComponents = UIComponents;
window.UIAnimations = UIAnimations;
window.TouchGestureHandler = TouchGestureHandler;
window.ResponsiveUtils = ResponsiveUtils;
window.AccessibilityHelper = AccessibilityHelper;