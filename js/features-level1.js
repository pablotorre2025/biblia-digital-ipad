/**
 * Funcionalidades Nivel 1 - Búsqueda, Favoritos, Temas, Notas
 * Bible Digital App - Enhanced Features
 */

class BibleFeatures {
    constructor(bibleApp) {
        this.app = bibleApp;
        this.favorites = this.loadFavorites();
        this.notes = this.loadNotes();
        this.settings = this.loadSettings();
        this.currentTheme = this.settings.theme || 'light';
        this.fontSize = this.settings.fontSize || 16;
        this.initializeFeatures();
    }

    initializeFeatures() {
        this.setupEventListeners();
        this.applyTheme(this.currentTheme);
        this.applyFontSize(this.fontSize);
        this.setupVerseEnhancements();
    }

    setupEventListeners() {
        console.log('Setting up enhanced event listeners...');
        
        // Search functionality
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');
        
        console.log('Search elements found:', { searchBtn: !!searchBtn, searchInput: !!searchInput });
        
        if (searchBtn && searchInput) {
            console.log('Adding search event listeners...');
            searchBtn.addEventListener('click', () => {
                console.log('Search button clicked');
                this.performSearch();
            });
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('Enter key pressed in search');
                    this.performSearch();
                }
            });
        } else {
            console.warn('Search elements not found! Make sure HTML elements exist.');
        }

        // Favorites functionality
        const favoritesBtn = document.getElementById('favoritesBtn');
        const closeFavorites = document.getElementById('closeFavorites');
        
        console.log('Favorites elements found:', { favoritesBtn: !!favoritesBtn, closeFavorites: !!closeFavorites });
        
        if (favoritesBtn) {
            console.log('Adding favorites event listener...');
            favoritesBtn.addEventListener('click', () => {
                console.log('Favorites button clicked');
                this.openFavoritesModal();
            });
        } else {
            console.warn('Favorites button not found!');
        }
        
        if (closeFavorites) {
            closeFavorites.addEventListener('click', () => this.closeFavoritesModal());
        }

        // Enhanced settings
        const themeSelect = document.getElementById('themeSelect');
        const fontSizeRange = document.getElementById('fontSizeRange');
        const clearCache = document.getElementById('clearCache');
        const exportData = document.getElementById('exportData');

        if (themeSelect) {
            themeSelect.value = this.currentTheme;
            themeSelect.addEventListener('change', (e) => this.changeTheme(e.target.value));
        }
        
        if (fontSizeRange) {
            fontSizeRange.value = this.fontSize;
            fontSizeRange.addEventListener('input', (e) => this.changeFontSize(parseInt(e.target.value)));
        }

        if (clearCache) clearCache.addEventListener('click', () => this.clearCache());
        if (exportData) exportData.addEventListener('click', () => this.exportData());

        // Search modal
        const closeSearch = document.getElementById('closeSearch');
        if (closeSearch) closeSearch.addEventListener('click', () => this.closeSearchModal());

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSearchModal();
                this.closeFavoritesModal();
            }
        });
    }

    // ==========================================
    // SEARCH FUNCTIONALITY
    // ==========================================

    performSearch() {
        console.log('=== PERFORMING SEARCH ===');
        const searchInput = document.getElementById('searchInput');
        const query = searchInput ? searchInput.value.trim() : '';
        
        console.log('Search query:', query);
        
        if (query.length < 2) {
            alert('Por favor, introduce al menos 2 caracteres para buscar.');
            return;
        }

        if (!this.app.bibleData || !this.app.currentVersion) {
            alert('Por favor, selecciona una versión de la Biblia primero.');
            return;
        }

        console.log('Bible data available:', !!this.app.bibleData);
        console.log('Current version:', this.app.currentVersion);
        console.log('Available books:', Object.keys(this.app.bibleData).slice(0, 5));
        
        const results = this.searchInBible(query);
        console.log('Search results found:', results.length);
        
        this.displaySearchResults(query, results);
        this.openSearchModal();
    }

    searchInBible(query) {
        const results = [];
        const searchTerm = query.toLowerCase();
        const bibleData = this.app.bibleData;

        Object.keys(bibleData).forEach(bookName => {
            Object.keys(bibleData[bookName]).forEach(chapterNum => {
                Object.keys(bibleData[bookName][chapterNum]).forEach(verseNum => {
                    const verseText = bibleData[bookName][chapterNum][verseNum].toLowerCase();
                    
                    if (verseText.includes(searchTerm)) {
                        results.push({
                            book: bookName,
                            chapter: parseInt(chapterNum),
                            verse: parseInt(verseNum),
                            text: bibleData[bookName][chapterNum][verseNum],
                            reference: `${bookName} ${chapterNum}:${verseNum}`
                        });
                    }
                });
            });
        });

        // Sort by book order, then chapter, then verse
        results.sort((a, b) => {
            const bookOrder = Object.keys(bibleData).indexOf(a.book) - Object.keys(bibleData).indexOf(b.book);
            if (bookOrder !== 0) return bookOrder;
            
            const chapterOrder = a.chapter - b.chapter;
            if (chapterOrder !== 0) return chapterOrder;
            
            return a.verse - b.verse;
        });

        return results.slice(0, 100); // Limit to 100 results for performance
    }

    displaySearchResults(query, results) {
        const searchQuery = document.getElementById('searchQuery');
        const searchCount = document.getElementById('searchCount');
        const searchResults = document.getElementById('searchResults');

        if (searchQuery) searchQuery.textContent = `"${query}"`;
        if (searchCount) searchCount.textContent = `${results.length} resultado${results.length !== 1 ? 's' : ''}`;

        if (searchResults) {
            if (results.length === 0) {
                searchResults.innerHTML = '<p>No se encontraron resultados para tu búsqueda.</p>';
                return;
            }

            const highlightedResults = results.map(result => {
                const highlightedText = this.highlightSearchTerm(result.text, query);
                return `
                    <div class="search-result-item" onclick="window.bibleFeatures.goToVerse('${result.book}', ${result.chapter}, ${result.verse})">
                        <div class="search-result-reference">${result.reference}</div>
                        <div class="search-result-text">${highlightedText}</div>
                    </div>
                `;
            }).join('');

            searchResults.innerHTML = highlightedResults;
        }
    }

    highlightSearchTerm(text, searchTerm) {
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }

    goToVerse(book, chapter, verse) {
        this.closeSearchModal();
        
        // Navigate to the verse
        this.app.selectBook(book).then(() => {
            setTimeout(() => {
                this.app.loadChapter(book, chapter).then(() => {
                    // Scroll to specific verse
                    setTimeout(() => {
                        const verseElement = document.querySelector(`[data-verse="${verse}"]`);
                        if (verseElement) {
                            verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            verseElement.style.background = 'var(--primary-color)';
                            verseElement.style.color = 'white';
                            setTimeout(() => {
                                verseElement.style.background = '';
                                verseElement.style.color = '';
                            }, 2000);
                        }
                    }, 200);
                });
            }, 200);
        });
    }

    openSearchModal() {
        const modal = document.getElementById('searchModal');
        if (modal) modal.style.display = 'block';
    }

    closeSearchModal() {
        const modal = document.getElementById('searchModal');
        if (modal) modal.style.display = 'none';
    }

    // ==========================================
    // FAVORITES FUNCTIONALITY
    // ==========================================

    addToFavorites(book, chapter, verse, text, category = 'general') {
        const favoriteId = `${book}_${chapter}_${verse}`;
        const favorite = {
            id: favoriteId,
            book,
            chapter,
            verse,
            text,
            category,
            reference: `${book} ${chapter}:${verse}`,
            dateAdded: new Date().toISOString(),
            version: this.app.currentVersion
        };

        this.favorites[favoriteId] = favorite;
        this.saveFavorites();
        this.updateVerseButton(book, chapter, verse, true);
        
        // Show feedback
        if (window.UIComponents && window.UIComponents.showToast) {
            window.UIComponents.showToast(`Versículo agregado a favoritos: ${favorite.reference}`, 'success');
        }
    }

    removeFromFavorites(book, chapter, verse) {
        const favoriteId = `${book}_${chapter}_${verse}`;
        delete this.favorites[favoriteId];
        this.saveFavorites();
        this.updateVerseButton(book, chapter, verse, false);
        
        // Refresh favorites modal if open
        const favoritesModal = document.getElementById('favoritesModal');
        if (favoritesModal && favoritesModal.style.display === 'block') {
            this.displayFavorites();
        }
        
        if (window.UIComponents && window.UIComponents.showToast) {
            window.UIComponents.showToast('Versículo eliminado de favoritos', 'info');
        }
    }

    updateVerseButton(book, chapter, verse, isFavorited) {
        const verseElement = document.querySelector(`[data-verse="${verse}"]`);
        if (verseElement) {
            const favoriteBtn = verseElement.querySelector('.favorite-btn');
            if (favoriteBtn) {
                favoriteBtn.textContent = isFavorited ? '❤️' : '🤍';
                favoriteBtn.classList.toggle('favorited', isFavorited);
            }
        }
    }

    openFavoritesModal() {
        console.log('=== OPENING FAVORITES MODAL ===');
        const modal = document.getElementById('favoritesModal');
        console.log('Favorites modal found:', !!modal);
        
        if (modal) {
            modal.style.display = 'block';
            console.log('Modal displayed, now loading favorites...');
            this.displayFavorites();
        } else {
            console.error('Favorites modal not found in DOM!');
            alert('Error: Modal de favoritos no encontrado. Verifica la implementación HTML.');
        }
    }

    closeFavoritesModal() {
        const modal = document.getElementById('favoritesModal');
        if (modal) modal.style.display = 'none';
    }

    displayFavorites() {
        const favoritesList = document.getElementById('favoritesList');
        const categoryFilter = document.getElementById('categoryFilter');
        
        if (!favoritesList) return;

        const favoriteArray = Object.values(this.favorites);
        const selectedCategory = categoryFilter ? categoryFilter.value : 'all';
        
        const filteredFavorites = selectedCategory === 'all' 
            ? favoriteArray 
            : favoriteArray.filter(fav => fav.category === selectedCategory);

        if (filteredFavorites.length === 0) {
            favoritesList.innerHTML = '<p>No tienes versículos favoritos en esta categoría.</p>';
            return;
        }

        const favoritesHtml = filteredFavorites
            .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
            .map(favorite => `
                <div class="favorite-item">
                    <div class="favorite-content">
                        <div class="favorite-reference">${favorite.reference} (${favorite.version})</div>
                        <div class="favorite-text">${favorite.text}</div>
                        <span class="favorite-category">${favorite.category}</span>
                    </div>
                    <div class="favorite-actions">
                        <button onclick="window.bibleFeatures.goToVerse('${favorite.book}', ${favorite.chapter}, ${favorite.verse})" title="Ir al versículo">📍</button>
                        <button onclick="window.bibleFeatures.removeFromFavorites('${favorite.book}', ${favorite.chapter}, ${favorite.verse})" title="Eliminar">🗑️</button>
                    </div>
                </div>
            `).join('');

        favoritesList.innerHTML = favoritesHtml;
    }

    filterFavorites() {
        this.displayFavorites();
    }

    exportFavorites() {
        const favoriteArray = Object.values(this.favorites);
        const exportData = {
            exportDate: new Date().toISOString(),
            totalFavorites: favoriteArray.length,
            favorites: favoriteArray
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `biblia-favoritos-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    // ==========================================
    // THEME FUNCTIONALITY
    // ==========================================

    changeTheme(newTheme) {
        this.currentTheme = newTheme;
        this.applyTheme(newTheme);
        this.settings.theme = newTheme;
        this.saveSettings();
        
        if (window.UIComponents && window.UIComponents.showToast) {
            window.UIComponents.showToast(`Tema cambiado a: ${this.getThemeName(newTheme)}`, 'info');
        }
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    getThemeName(theme) {
        const themes = {
            'light': 'Claro',
            'dark': 'Oscuro',
            'sepia': 'Sepia',
            'blue': 'Azul'
        };
        return themes[theme] || theme;
    }

    changeFontSize(newSize) {
        this.fontSize = newSize;
        this.applyFontSize(newSize);
        this.settings.fontSize = newSize;
        this.saveSettings();
        
        const fontSizeValue = document.getElementById('fontSizeValue');
        if (fontSizeValue) fontSizeValue.textContent = `${newSize}px`;
    }

    applyFontSize(size) {
        document.documentElement.style.setProperty('--font-size-base', `${size}px`);
    }

    // ==========================================
    // VERSE ENHANCEMENTS
    // ==========================================

    setupVerseEnhancements() {
        // This will be called after each chapter load to enhance verses
        this.enhanceCurrentChapter();
    }

    enhanceCurrentChapter() {
        setTimeout(() => {
            const verses = document.querySelectorAll('.verse');
            verses.forEach((verseElement, index) => {
                const verseNum = index + 1;
                verseElement.setAttribute('data-verse', verseNum);
                
                if (!verseElement.querySelector('.verse-actions')) {
                    this.addVerseActions(verseElement, verseNum);
                }
            });
        }, 200);
    }

    addVerseActions(verseElement, verseNum) {
        const book = this.app.currentBook;
        const chapter = this.app.currentChapter;
        const verseText = verseElement.textContent.replace(/^\d+\.\s*/, '');
        
        const favoriteId = `${book}_${chapter}_${verseNum}`;
        const isFavorited = this.favorites.hasOwnProperty(favoriteId);
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'verse-actions';
        actionsDiv.innerHTML = `
            <button class="verse-action-btn favorite-btn ${isFavorited ? 'favorited' : ''}" 
                    onclick="window.bibleFeatures.toggleFavorite('${book}', ${chapter}, ${verseNum}, this)" 
                    title="${isFavorited ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
                ${isFavorited ? '❤️' : '🤍'}
            </button>
            <button class="verse-action-btn" onclick="window.bibleFeatures.copyVerse('${book}', ${chapter}, ${verseNum})" title="Copiar">📋</button>
            <button class="verse-action-btn" onclick="window.bibleFeatures.shareVerse('${book}', ${chapter}, ${verseNum})" title="Compartir">📤</button>
        `;
        
        verseElement.appendChild(actionsDiv);
    }

    toggleFavorite(book, chapter, verse, buttonElement) {
        const favoriteId = `${book}_${chapter}_${verse}`;
        const verseElement = buttonElement.closest('.verse');
        const verseText = verseElement.textContent.replace(/^\d+\.\s*/, '').replace(/📋📤/g, '').trim();
        
        if (this.favorites.hasOwnProperty(favoriteId)) {
            this.removeFromFavorites(book, chapter, verse);
        } else {
            // Show category selection dialog
            this.showCategoryDialog((category) => {
                this.addToFavorites(book, chapter, verse, verseText, category);
            });
        }
    }

    showCategoryDialog(callback) {
        const category = prompt(`Selecciona una categoría para este versículo:
        
1. oración
2. estudio  
3. predicación
4. consuelo
5. sabiduría
6. general (por defecto)
        
Escribe el nombre o número:`, 'general');
        
        if (category) {
            const categories = {
                '1': 'oración',
                '2': 'estudio',
                '3': 'predicación', 
                '4': 'consuelo',
                '5': 'sabiduría',
                '6': 'general'
            };
            
            const selectedCategory = categories[category] || category.toLowerCase() || 'general';
            callback(selectedCategory);
        }
    }

    copyVerse(book, chapter, verse) {
        const verseElement = document.querySelector(`[data-verse="${verse}"]`);
        if (!verseElement) return;
        
        const verseText = verseElement.textContent.replace(/📋📤/g, '').trim();
        const reference = `${book} ${chapter}:${verse}`;
        const fullText = `"${verseText}" - ${reference}`;
        
        navigator.clipboard.writeText(fullText).then(() => {
            if (window.UIComponents && window.UIComponents.showToast) {
                window.UIComponents.showToast('Versículo copiado al portapapeles', 'success');
            }
        });
    }

    shareVerse(book, chapter, verse) {
        const verseElement = document.querySelector(`[data-verse="${verse}"]`);
        if (!verseElement) return;
        
        const verseText = verseElement.textContent.replace(/📋📤/g, '').trim();
        const reference = `${book} ${chapter}:${verse}`;
        const fullText = `"${verseText}" - ${reference}`;
        
        if (navigator.share) {
            navigator.share({
                title: `Biblia Digital - ${reference}`,
                text: fullText
            });
        } else {
            // Fallback: copy to clipboard
            this.copyVerse(book, chapter, verse);
        }
    }

    // ==========================================
    // DATA MANAGEMENT
    // ==========================================

    clearCache() {
        if (confirm('¿Estás seguro de que quieres limpiar la caché? Esto eliminará todas las biblias descargadas y tendrás que volver a cargarlas.')) {
            // Clear Bible cache
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('bible_')) {
                    localStorage.removeItem(key);
                }
            });
            
            if (window.UIComponents && window.UIComponents.showToast) {
                window.UIComponents.showToast('Caché limpiada exitosamente', 'success');
            }
            
            // Reload page
            setTimeout(() => location.reload(), 1000);
        }
    }

    exportData() {
        const exportData = {
            exportDate: new Date().toISOString(),
            settings: this.settings,
            favorites: this.favorites,
            notes: this.notes,
            currentVersion: this.app.currentVersion,
            currentBook: this.app.currentBook,
            currentChapter: this.app.currentChapter
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `biblia-digital-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    // ==========================================
    // STORAGE MANAGEMENT
    // ==========================================

    loadFavorites() {
        try {
            const stored = localStorage.getItem('bible_favorites');
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.error('Error loading favorites:', e);
            return {};
        }
    }

    saveFavorites() {
        try {
            localStorage.setItem('bible_favorites', JSON.stringify(this.favorites));
        } catch (e) {
            console.error('Error saving favorites:', e);
        }
    }

    loadNotes() {
        try {
            const stored = localStorage.getItem('bible_notes');
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.error('Error loading notes:', e);
            return {};
        }
    }

    saveNotes() {
        try {
            localStorage.setItem('bible_notes', JSON.stringify(this.notes));
        } catch (e) {
            console.error('Error saving notes:', e);
        }
    }

    loadSettings() {
        try {
            const stored = localStorage.getItem('bible_settings');
            return stored ? JSON.parse(stored) : {
                theme: 'light',
                fontSize: 16,
                showVerseNumbers: true,
                highlightEnabled: true
            };
        } catch (e) {
            console.error('Error loading settings:', e);
            return {
                theme: 'light',
                fontSize: 16,
                showVerseNumbers: true,
                highlightEnabled: true
            };
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('bible_settings', JSON.stringify(this.settings));
        } catch (e) {
            console.error('Error saving settings:', e);
        }
    }

    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // DEBUG FUNCTION - Remove in production
    testSearch(query = 'jesus') {
        console.log('=== MANUAL SEARCH TEST ===');
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = query;
            this.performSearch();
        } else {
            console.error('Search input not found for manual test');
        }
    }
}

// Export for use in main app
window.BibleFeatures = BibleFeatures;