// Bible App - Main Application Logic
class BibleApp {
    constructor() {
        this.currentVersion = null;
        this.currentBook = null;
        this.currentChapter = null;
        this.versions = [];
        this.books = [];
        this.settings = this.loadSettings();
        
        this.init();
    }

    async init() {
        try {
            await this.loadAvailableVersions();
            this.setupEventListeners();
            this.applySettings();
            this.updateConnectionStatus();
            
            // Auto-load last read position
            const lastRead = this.loadLastRead();
            if (lastRead.version && lastRead.book && lastRead.chapter) {
                await this.loadVersion(lastRead.version);
                await this.selectBook(lastRead.book);
                await this.loadChapter(lastRead.book, lastRead.chapter);
            }
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Error al inicializar la aplicación');
        }
    }

    setupEventListeners() {
        // Version selector
        document.getElementById('versionSelector').addEventListener('change', async (e) => {
            if (e.target.value) {
                await this.loadVersion(e.target.value);
            }
        });

        // Book selector
        document.getElementById('bookSelector').addEventListener('change', async (e) => {
            if (e.target.value) {
                await this.selectBook(e.target.value);
            }
        });

        // Chapter selector
        document.getElementById('chapterSelector').addEventListener('change', async (e) => {
            if (e.target.value) {
                await this.loadChapter(this.currentBook, parseInt(e.target.value));
            }
        });

        // Navigation buttons
        document.getElementById('prevChapter').addEventListener('click', () => this.navigateChapter(-1));
        document.getElementById('nextChapter').addEventListener('click', () => this.navigateChapter(1));

        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettings').addEventListener('click', () => this.closeSettings());
        
        // Settings controls
        document.getElementById('fontSize').addEventListener('input', (e) => {
            this.updateFontSize(e.target.value);
        });
        
        document.getElementById('lineHeight').addEventListener('input', (e) => {
            this.updateLineHeight(e.target.value);
        });
        
        document.getElementById('theme').addEventListener('change', (e) => {
            this.updateTheme(e.target.value);
        });
        
        document.getElementById('showVerseNumbers').addEventListener('change', (e) => {
            this.toggleVerseNumbers(e.target.checked);
        });

        // Close modal when clicking outside
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                this.closeSettings();
            }
        });

        // Online/offline detection
        window.addEventListener('online', () => this.updateConnectionStatus());
        window.addEventListener('offline', () => this.updateConnectionStatus());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.navigateChapter(-1);
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.navigateChapter(1);
                        break;
                }
            }
        });
    }

    async loadAvailableVersions() {
        try {
            console.log('Loading available versions...');
            
            // Try to load from cache first
            const cachedVersions = localStorage.getItem('bible_versions');
            if (cachedVersions) {
                this.versions = JSON.parse(cachedVersions);
                console.log(`Loaded ${this.versions.length} versions from cache`);
                this.populateVersionSelector();
            }

            // Load versions configuration
            const response = await fetch('./data/versions.json');
            if (response.ok) {
                const versionsData = await response.json();
                this.versions = versionsData.versions;
                console.log(`Loaded ${this.versions.length} versions from server:`, this.versions);
                
                localStorage.setItem('bible_versions', JSON.stringify(this.versions));
                this.populateVersionSelector();
            } else {
                throw new Error(`No se pudo cargar las versiones disponibles (HTTP ${response.status})`);
            }
        } catch (error) {
            console.error('Error loading versions:', error);
            this.showError(`Error al cargar versiones: ${error.message}`);
            
            // Fallback to default versions if file doesn't exist
            this.versions = [
                { 
                    id: 'rv1960', 
                    name: 'Reina-Valera 1960', 
                    language: 'es',
                    filename: 'RV1960.json',
                    format: 'original',
                    folder: 'biblias-originales'
                }
            ];
            this.populateVersionSelector();
        }
    }

    populateVersionSelector() {
        const selector = document.getElementById('versionSelector');
        selector.innerHTML = '<option value="">Seleccionar versión...</option>';
        
        this.versions.forEach(version => {
            const option = document.createElement('option');
            option.value = version.id;
            option.textContent = version.name;
            selector.appendChild(option);
        });
    }

    async loadVersion(versionId) {
        this.showLoading(true);
        try {
            console.log(`Loading version: ${versionId}`);
            
            const version = this.versions.find(v => v.id === versionId);
            if (!version) {
                throw new Error(`Configuración de versión no encontrada para: ${versionId}`);
            }

            // Try to load from cache first
            const cacheKey = `bible_${versionId}`;
            const cachedData = localStorage.getItem(cacheKey);
            
            let bibleData;
            if (cachedData) {
                console.log(`Loading ${versionId} from cache`);
                bibleData = JSON.parse(cachedData);
            } else {
                console.log(`Loading ${versionId} from server`);
                
                // Use BibleDataManager if available, otherwise fallback
                if (window.bibleDataManager) {
                    bibleData = await window.bibleDataManager.loadBibleVersion(versionId);
                } else {
                    // Fallback method
                    const response = await fetch(`./data/biblias-originales/${version.filename}`);
                    if (!response.ok) {
                        throw new Error(`No se pudo cargar ${version.name} (HTTP ${response.status})`);
                    }
                    
                    const originalData = await response.json();
                    if (!originalData.books || !Array.isArray(originalData.books)) {
                        throw new Error(`Formato inválido en ${version.filename}`);
                    }
                    
                    // Convert to app format
                    bibleData = this.convertOriginalFormat(originalData);
                }
                
                // Cache the data for offline use
                try {
                    localStorage.setItem(cacheKey, JSON.stringify(bibleData));
                    console.log(`Cached ${versionId} for offline use`);
                } catch (e) {
                    console.warn('Could not cache bible data:', e);
                }
            }

            if (!bibleData || Object.keys(bibleData).length === 0) {
                throw new Error(`Datos de la biblia ${version.name} están vacíos o corruptos`);
            }

            this.currentVersion = versionId;
            this.books = Object.keys(bibleData);
            this.bibleData = bibleData;
            
            console.log(`Successfully loaded ${version.name} with ${this.books.length} books`);
            
            this.populateBookSelector();
            this.saveLastRead();
            
            document.getElementById('versionSelector').value = versionId;
            this.showSuccess(`${version.name} cargada exitosamente`);
            
        } catch (error) {
            console.error('Error loading version:', error);
            this.showError(`Error al cargar la versión: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    convertOriginalFormat(originalBible) {
        console.log('Converting original format to app format...');
        const converted = {};
        
        if (!originalBible.books) {
            throw new Error('No se encontraron libros en la biblia');
        }
        
        originalBible.books.forEach((book, bookIndex) => {
            if (!book.name || !book.chapters) {
                console.warn(`Libro inválido en índice ${bookIndex}:`, book);
                return;
            }
            
            const bookName = book.name;
            converted[bookName] = {};
            
            book.chapters.forEach((chapter, chapterIndex) => {
                const chapterNum = chapterIndex + 1;
                converted[bookName][chapterNum] = {};
                
                if (Array.isArray(chapter)) {
                    chapter.forEach(verse => {
                        if (verse && verse.verse && verse.text) {
                            converted[bookName][chapterNum][verse.verse] = verse.text;
                        }
                    });
                }
            });
        });
        
        console.log(`Converted ${Object.keys(converted).length} books`);
        return converted;
    }

    populateBookSelector() {
        const selector = document.getElementById('bookSelector');
        selector.innerHTML = '<option value="">Seleccionar libro...</option>';
        
        this.books.forEach(book => {
            const option = document.createElement('option');
            option.value = book;
            option.textContent = book;
            selector.appendChild(option);
        });
    }

    async selectBook(bookName) {
        try {
            if (!this.bibleData || !this.bibleData[bookName]) {
                throw new Error('Libro no encontrado');
            }

            this.currentBook = bookName;
            const chapters = Object.keys(this.bibleData[bookName]);
            
            this.populateChapterSelector(chapters.length);
            this.updateNavigationButtons();
            this.saveLastRead();
            
            document.getElementById('bookSelector').value = bookName;
            
            // Auto-load first chapter
            if (chapters.length > 0) {
                await this.loadChapter(bookName, 1);
            }
            
        } catch (error) {
            console.error('Error selecting book:', error);
            this.showError(error.message);
        }
    }

    populateChapterSelector(totalChapters) {
        const selector = document.getElementById('chapterSelector');
        selector.innerHTML = '<option value="">Cap...</option>';
        
        for (let i = 1; i <= totalChapters; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            selector.appendChild(option);
        }
    }

    async loadChapter(bookName, chapterNum) {
        try {
            if (!this.bibleData || !this.bibleData[bookName] || !this.bibleData[bookName][chapterNum]) {
                throw new Error('Capítulo no encontrado');
            }

            this.currentChapter = chapterNum;
            const verses = this.bibleData[bookName][chapterNum];
            
            this.displayChapter(bookName, chapterNum, verses);
            this.updateNavigationButtons();
            this.saveLastRead();
            
            document.getElementById('chapterSelector').value = chapterNum;
            
        } catch (error) {
            console.error('Error loading chapter:', error);
            this.showError(error.message);
        }
    }

    displayChapter(bookName, chapterNum, verses) {
        const titleElement = document.getElementById('chapterTitle');
        const containerElement = document.getElementById('verseContainer');
        
        titleElement.textContent = `${bookName} ${chapterNum}`;
        
        let html = '';
        Object.entries(verses).forEach(([verseNum, verseText]) => {
            const showNumbers = this.settings.showVerseNumbers;
            html += `<div class="verse">`;
            if (showNumbers) {
                html += `<span class="verse-number">${verseNum}</span>`;
            }
            html += `${verseText}</div>`;
        });
        
        containerElement.innerHTML = html;
        
        // Scroll to top
        window.scrollTo(0, 0);
    }

    navigateChapter(direction) {
        if (!this.currentBook || !this.currentChapter) return;
        
        const bookData = this.bibleData[this.currentBook];
        const chapters = Object.keys(bookData).map(Number);
        const currentIndex = chapters.indexOf(this.currentChapter);
        
        let nextChapter = null;
        
        if (direction === 1 && currentIndex < chapters.length - 1) {
            // Next chapter
            nextChapter = chapters[currentIndex + 1];
        } else if (direction === -1 && currentIndex > 0) {
            // Previous chapter
            nextChapter = chapters[currentIndex - 1];
        } else if (direction === 1 && currentIndex === chapters.length - 1) {
            // Next book, first chapter
            const bookIndex = this.books.indexOf(this.currentBook);
            if (bookIndex < this.books.length - 1) {
                const nextBook = this.books[bookIndex + 1];
                this.selectBook(nextBook);
                return;
            }
        } else if (direction === -1 && currentIndex === 0) {
            // Previous book, last chapter
            const bookIndex = this.books.indexOf(this.currentBook);
            if (bookIndex > 0) {
                const prevBook = this.books[bookIndex - 1];
                const prevBookData = this.bibleData[prevBook];
                const lastChapter = Math.max(...Object.keys(prevBookData).map(Number));
                this.currentBook = prevBook;
                this.loadChapter(prevBook, lastChapter);
                document.getElementById('bookSelector').value = prevBook;
                this.populateChapterSelector(Object.keys(prevBookData).length);
                return;
            }
        }
        
        if (nextChapter) {
            this.loadChapter(this.currentBook, nextChapter);
        }
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevChapter');
        const nextBtn = document.getElementById('nextChapter');
        
        if (!this.currentBook || !this.currentChapter) {
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }
        
        const bookData = this.bibleData[this.currentBook];
        const chapters = Object.keys(bookData).map(Number);
        const currentIndex = chapters.indexOf(this.currentChapter);
        const bookIndex = this.books.indexOf(this.currentBook);
        
        // Previous button
        prevBtn.disabled = currentIndex === 0 && bookIndex === 0;
        
        // Next button
        nextBtn.disabled = currentIndex === chapters.length - 1 && bookIndex === this.books.length - 1;
    }

    // Settings Management
    openSettings() {
        document.getElementById('settingsModal').classList.remove('hidden');
        
        // Update settings UI with current values
        document.getElementById('fontSize').value = this.settings.fontSize;
        document.getElementById('fontSizeValue').textContent = this.settings.fontSize + 'px';
        document.getElementById('lineHeight').value = this.settings.lineHeight;
        document.getElementById('lineHeightValue').textContent = this.settings.lineHeight;
        document.getElementById('theme').value = this.settings.theme;
        document.getElementById('showVerseNumbers').checked = this.settings.showVerseNumbers;
    }

    closeSettings() {
        document.getElementById('settingsModal').classList.add('hidden');
    }

    updateFontSize(size) {
        this.settings.fontSize = parseInt(size);
        document.getElementById('fontSizeValue').textContent = size + 'px';
        this.applySettings();
        this.saveSettings();
    }

    updateLineHeight(height) {
        this.settings.lineHeight = parseFloat(height);
        document.getElementById('lineHeightValue').textContent = height;
        this.applySettings();
        this.saveSettings();
    }

    updateTheme(theme) {
        this.settings.theme = theme;
        this.applySettings();
        this.saveSettings();
    }

    toggleVerseNumbers(show) {
        this.settings.showVerseNumbers = show;
        this.applySettings();
        this.saveSettings();
        
        // Refresh current chapter display
        if (this.currentBook && this.currentChapter) {
            const verses = this.bibleData[this.currentBook][this.currentChapter];
            this.displayChapter(this.currentBook, this.currentChapter, verses);
        }
    }

    applySettings() {
        const root = document.documentElement;
        root.style.setProperty('--font-size', this.settings.fontSize + 'px');
        root.style.setProperty('--line-height', this.settings.lineHeight);
        document.body.setAttribute('data-theme', this.settings.theme);
    }

    loadSettings() {
        const defaultSettings = {
            fontSize: 16,
            lineHeight: 1.6,
            theme: 'light',
            showVerseNumbers: true
        };

        try {
            const saved = localStorage.getItem('bible_settings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch (error) {
            console.error('Error loading settings:', error);
            return defaultSettings;
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('bible_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    saveLastRead() {
        try {
            const lastRead = {
                version: this.currentVersion,
                book: this.currentBook,
                chapter: this.currentChapter,
                timestamp: Date.now()
            };
            localStorage.setItem('bible_last_read', JSON.stringify(lastRead));
        } catch (error) {
            console.error('Error saving last read position:', error);
        }
    }

    loadLastRead() {
        try {
            const saved = localStorage.getItem('bible_last_read');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Error loading last read position:', error);
            return {};
        }
    }

    updateConnectionStatus() {
        const statusElement = document.getElementById('connectionStatus');
        if (navigator.onLine) {
            statusElement.textContent = '📡 Online';
            statusElement.className = 'status-online';
        } else {
            statusElement.textContent = '📡 Offline';
            statusElement.className = 'status-offline';
        }
        
        const lastUpdate = document.getElementById('lastUpdate');
        lastUpdate.textContent = `Última actualización: ${new Date().toLocaleTimeString()}`;
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (show) {
            spinner.classList.remove('hidden');
        } else {
            spinner.classList.add('hidden');
        }
    }

    showError(message) {
        console.error('App Error:', message);
        
        // Show toast notification if available
        if (window.UIComponents && window.UIComponents.showToast) {
            window.UIComponents.showToast(message, 'error', 5000);
        } else {
            // Fallback to alert
            alert(`Error: ${message}`);
        }
    }

    showSuccess(message) {
        console.log('App Success:', message);
        
        // Show toast notification if available
        if (window.UIComponents && window.UIComponents.showToast) {
            window.UIComponents.showToast(message, 'success', 3000);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize BibleDataManager
    if (window.BibleDataManager) {
        window.bibleDataManager = new BibleDataManager();
    }
    
    // Initialize the main app
    window.bibleApp = new BibleApp();
});