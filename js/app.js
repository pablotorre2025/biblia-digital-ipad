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
        
        // Compare versions
        document.getElementById('compareBtn').addEventListener('click', () => this.openCompareModal());
        document.getElementById('closeCompare').addEventListener('click', () => this.closeCompareModal());
        document.getElementById('compareVersion1').addEventListener('change', () => this.updateComparison());
        document.getElementById('compareVersion2').addEventListener('change', () => this.updateComparison());
        
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
            
            // Store current position before changing version
            const previousBook = this.currentBook;
            const previousChapter = this.currentChapter;
            
            const version = this.versions.find(v => v.id === versionId);
            if (!version) {
                throw new Error(`Configuración de versión no encontrada para: ${versionId}`);
            }

            console.log(`Found version config:`, version);

            // Try to load from cache first
            const cacheKey = `bible_${versionId}`;
            const cachedData = localStorage.getItem(cacheKey);
            
            let bibleData;
            if (cachedData) {
                console.log(`Loading ${versionId} from cache`);
                try {
                    bibleData = JSON.parse(cachedData);
                } catch (e) {
                    console.warn('Cache data corrupted, loading fresh:', e);
                    localStorage.removeItem(cacheKey);
                    bibleData = null;
                }
            }
            
            if (!bibleData) {
                console.log(`Loading ${versionId} from server: ${version.filename}`);
                
                // Load from biblias-originales folder
                const response = await fetch(`./data/biblias-originales/${version.filename}`);
                if (!response.ok) {
                    throw new Error(`No se pudo cargar ${version.name} (HTTP ${response.status})`);
                }
                
                const originalData = await response.json();
                console.log(`Loaded original data:`, {
                    name: originalData.name,
                    booksCount: originalData.books ? originalData.books.length : 0,
                    firstBookName: originalData.books && originalData.books[0] ? originalData.books[0].name : 'N/A'
                });
                
                if (!originalData.books || !Array.isArray(originalData.books)) {
                    throw new Error(`Formato inválido en ${version.filename}`);
                }
                
                // Convert to app format
                bibleData = this.convertOriginalFormat(originalData);
                
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

            // Set the data
            this.currentVersion = versionId;
            this.books = Object.keys(bibleData);
            this.bibleData = bibleData;
            
            console.log(`Successfully loaded ${version.name}:`);
            console.log(`- Books: ${this.books.length}`);
            console.log(`- First few books: ${this.books.slice(0, 3).join(', ')}`);
            
            // Update UI
            this.populateBookSelector();
            
            // Restore previous position if available
            if (previousBook && previousChapter && bibleData[previousBook]?.[previousChapter]) {
                console.log('Restoring position:', previousBook, previousChapter);
                console.log('Available books after loading:', this.books.slice(0, 5));
                console.log('Target book exists:', this.books.includes(previousBook));
                console.log('Target chapter exists:', !!bibleData[previousBook]?.[previousChapter]);
                
                // Set current book and chapter directly
                this.currentBook = previousBook;
                this.currentChapter = previousChapter;
                
                // Populate chapter selector for this book FIRST
                const chapters = Object.keys(bibleData[previousBook]);
                console.log(`Book "${previousBook}" has chapters:`, chapters.slice(0, 5));
                this.populateChapterSelector(chapters.length);
                
                // THEN update selectors with values
                const bookSelector = document.getElementById('bookSelector');
                const chapterSelector = document.getElementById('chapterSelector');
                if (bookSelector) {
                    bookSelector.value = previousBook;
                    console.log('Set book selector to:', bookSelector.value);
                }
                if (chapterSelector) {
                    chapterSelector.value = previousChapter;
                    console.log('Set chapter selector to:', chapterSelector.value);
                }
                
                // Load the content directly
                console.log('About to load chapter content...');
                await this.loadChapter(previousBook, previousChapter);
                console.log('Chapter content loaded successfully');
            } else {
                console.log('Position restoration skipped:', {
                    previousBook,
                    previousChapter,
                    bookExists: previousBook && this.books.includes(previousBook),
                    chapterExists: previousBook && previousChapter && !!bibleData[previousBook]?.[previousChapter]
                });
            }
            
            // Update comparison if modal is open
            if (document.getElementById('compareModal').style.display === 'block') {
                this.updateComparison();
            }
            
            this.saveLastRead();
            
            // Update version selector
            const versionSelector = document.getElementById('versionSelector');
            if (versionSelector) {
                versionSelector.value = versionId;
            }
            
            // Clear previous content
            const chapterTitle = document.getElementById('chapterTitle');
            const verseContainer = document.getElementById('verseContainer');
            if (chapterTitle) chapterTitle.textContent = '';
            if (verseContainer) {
                verseContainer.innerHTML = `
                    <div class="welcome-message">
                        <h2>${version.name} cargada exitosamente</h2>
                        <p>Selecciona un libro para comenzar a leer.</p>
                        <p><strong>${this.books.length} libros disponibles</strong></p>
                    </div>
                `;
            }
            
            this.showSuccess(`${version.name} cargada exitosamente (${this.books.length} libros)`);
            
        } catch (error) {
            console.error('Error loading version:', error);
            this.showError(`Error al cargar la versión: ${error.message}`);
            
            // Reset state on error
            this.currentVersion = null;
            this.books = [];
            this.bibleData = null;
            this.populateBookSelector();
        } finally {
            this.showLoading(false);
        }
    }

    convertOriginalFormat(originalBible) {
        console.log('Converting original format to app format...');
        console.log('Input data:', {
            name: originalBible.name,
            hasBooks: !!originalBible.books,
            booksType: Array.isArray(originalBible.books) ? 'array' : typeof originalBible.books,
            booksCount: originalBible.books ? originalBible.books.length : 0
        });
        
        const converted = {};
        
        if (!originalBible.books) {
            throw new Error('No se encontraron libros en la biblia');
        }
        
        if (!Array.isArray(originalBible.books)) {
            throw new Error('Los libros deben estar en formato array');
        }
        
        originalBible.books.forEach((book, bookIndex) => {
            if (!book) {
                console.warn(`Libro nulo en índice ${bookIndex}`);
                return;
            }
            
            if (!book.name) {
                console.warn(`Libro sin nombre en índice ${bookIndex}:`, book);
                return;
            }
            
            if (!book.chapters || !Array.isArray(book.chapters)) {
                console.warn(`Libro "${book.name}" no tiene capítulos válidos:`, book.chapters);
                return;
            }
            
            const bookName = book.name;
            converted[bookName] = {};
            
            console.log(`Processing book: ${bookName} with ${book.chapters.length} chapters`);
            
            book.chapters.forEach((chapter, chapterIndex) => {
                const chapterNum = chapterIndex + 1;
                converted[bookName][chapterNum] = {};
                
                if (!Array.isArray(chapter)) {
                    console.warn(`Capítulo ${chapterNum} de ${bookName} no es un array:`, chapter);
                    return;
                }
                
                chapter.forEach((verse, verseIndex) => {
                    if (!verse) {
                        console.warn(`Versículo nulo en ${bookName} ${chapterNum}:${verseIndex + 1}`);
                        return;
                    }
                    
                    if (!verse.verse || !verse.text) {
                        console.warn(`Versículo inválido en ${bookName} ${chapterNum}:`, verse);
                        return;
                    }
                    
                    converted[bookName][chapterNum][verse.verse] = verse.text;
                });
                
                const verseCount = Object.keys(converted[bookName][chapterNum]).length;
                if (verseCount === 0) {
                    console.warn(`Capítulo ${chapterNum} de ${bookName} no tiene versículos válidos`);
                }
            });
            
            const chapterCount = Object.keys(converted[bookName]).length;
            if (chapterCount === 0) {
                console.warn(`Libro ${bookName} no tiene capítulos válidos`);
                delete converted[bookName];
            }
        });
        
        const finalBookCount = Object.keys(converted).length;
        console.log(`Conversion completed: ${finalBookCount} books processed`);
        
        if (finalBookCount === 0) {
            throw new Error('No se pudieron convertir libros válidos de la biblia');
        }
        
        // Log some sample data for verification
        const firstBookName = Object.keys(converted)[0];
        if (firstBookName) {
            const firstBook = converted[firstBookName];
            const firstChapter = Object.keys(firstBook)[0];
            if (firstChapter) {
                const verseCount = Object.keys(firstBook[firstChapter]).length;
                console.log(`Sample: ${firstBookName} chapter ${firstChapter} has ${verseCount} verses`);
            }
        }
        
        return converted;
    }

    populateBookSelector() {
        const selector = document.getElementById('bookSelector');
        if (!selector) {
            console.error('Book selector element not found');
            return;
        }

        console.log(`Populating book selector with ${this.books.length} books`);
        selector.innerHTML = '<option value="">Seleccionar libro...</option>';
        
        if (!this.books || this.books.length === 0) {
            console.warn('No books available to populate');
            selector.innerHTML = '<option value="">No hay libros disponibles</option>';
            return;
        }
        
        this.books.forEach(book => {
            const option = document.createElement('option');
            option.value = book;
            option.textContent = book;
            selector.appendChild(option);
        });

        console.log(`Book selector populated with: ${this.books.slice(0, 5).join(', ')}${this.books.length > 5 ? '...' : ''}`);
    }

    async selectBook(bookName, autoLoadChapter = true) {
        try {
            console.log(`Selecting book: ${bookName}`);
            
            if (!this.bibleData) {
                throw new Error('No hay datos de biblia cargados');
            }
            
            if (!this.bibleData[bookName]) {
                console.error('Available books:', Object.keys(this.bibleData));
                throw new Error(`Libro "${bookName}" no encontrado en los datos cargados`);
            }

            this.currentBook = bookName;
            const chapters = Object.keys(this.bibleData[bookName]);
            
            console.log(`Book "${bookName}" has ${chapters.length} chapters`);
            
            this.populateChapterSelector(chapters.length);
            this.updateNavigationButtons();
            this.saveLastRead();
            
            // Update book selector
            const bookSelector = document.getElementById('bookSelector');
            if (bookSelector) {
                bookSelector.value = bookName;
            }
            
            // Clear chapter display
            const chapterTitle = document.getElementById('chapterTitle');
            const verseContainer = document.getElementById('verseContainer');
            if (chapterTitle) chapterTitle.textContent = '';
            if (verseContainer) {
                verseContainer.innerHTML = `
                    <div class="welcome-message">
                        <h2>${bookName}</h2>
                        <p>Selecciona un capítulo para leer.</p>
                        <p><strong>${chapters.length} capítulos disponibles</strong></p>
                    </div>
                `;
            }
            
            // Auto-load first chapter only if requested and available
            if (autoLoadChapter && chapters.length > 0) {
                console.log(`Auto-loading first chapter of ${bookName}`);
                await this.loadChapter(bookName, 1);
            }
            
        } catch (error) {
            console.error('Error selecting book:', error);
            this.showError(`Error al seleccionar libro: ${error.message}`);
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
            console.log(`Loading chapter ${chapterNum} of ${bookName}`);
            console.log('Bible data available:', !!this.bibleData);
            console.log('Book exists in data:', !!this.bibleData?.[bookName]);
            console.log('Chapter exists in book:', !!this.bibleData?.[bookName]?.[chapterNum]);
            
            if (!this.bibleData || !this.bibleData[bookName] || !this.bibleData[bookName][chapterNum]) {
                console.error('Chapter not found. Available data:', {
                    hasBibleData: !!this.bibleData,
                    availableBooks: this.bibleData ? Object.keys(this.bibleData).slice(0, 3) : [],
                    requestedBook: bookName,
                    requestedChapter: chapterNum
                });
                throw new Error('Capítulo no encontrado');
            }

            this.currentChapter = chapterNum;
            const verses = this.bibleData[bookName][chapterNum];
            
            console.log(`Found ${Object.keys(verses).length} verses in ${bookName} ${chapterNum}`);
            
            this.displayChapter(bookName, chapterNum, verses);
            this.updateNavigationButtons();
            this.saveLastRead();
            
            // Update chapter selector if not already set
            const chapterSelector = document.getElementById('chapterSelector');
            if (chapterSelector && chapterSelector.value !== chapterNum.toString()) {
                chapterSelector.value = chapterNum;
                console.log('Updated chapter selector to:', chapterSelector.value);
            }
            
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
        document.getElementById('settingsModal').style.display = 'none';
    }

    async openCompareModal() {
        const modal = document.getElementById('compareModal');
        const version1Select = document.getElementById('compareVersion1');
        const version2Select = document.getElementById('compareVersion2');
        
        // Clear previous options
        version1Select.innerHTML = '<option value="">Selecciona versión 1</option>';
        version2Select.innerHTML = '<option value="">Selecciona versión 2</option>';
        
        // Populate version selectors
        this.versions.forEach(version => {
            const option1 = document.createElement('option');
            option1.value = version.id;
            option1.textContent = version.name;
            version1Select.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = version.id;
            option2.textContent = version.name;
            version2Select.appendChild(option2);
        });
        
        // Set current version as version1
        if (this.currentVersion) {
            version1Select.value = this.currentVersion;
        }
        
        modal.style.display = 'block';
        this.updateComparison();
    }

    closeCompareModal() {
        document.getElementById('compareModal').style.display = 'none';
    }

    async updateComparison() {
        const version1Id = document.getElementById('compareVersion1').value;
        const version2Id = document.getElementById('compareVersion2').value;
        const comparisonContent = document.getElementById('comparisonContent');
        
        if (!version1Id || !version2Id) {
            comparisonContent.innerHTML = '<p>Selecciona dos versiones para comparar</p>';
            return;
        }
        
        if (!this.currentBook || !this.currentChapter) {
            comparisonContent.innerHTML = '<p>Selecciona un libro y capítulo primero</p>';
            return;
        }
        
        try {
            // Load both versions using the same method as the main app
            const version1Data = await this.loadVersionData(version1Id);
            const version2Data = await this.loadVersionData(version2Id);
            
            if (!version1Data || !version2Data) {
                comparisonContent.innerHTML = '<p>Error cargando las versiones</p>';
                return;
            }
            
            const version1Name = this.versions.find(v => v.id === version1Id)?.name || version1Id;
            const version2Name = this.versions.find(v => v.id === version2Id)?.name || version2Id;
            
            // Get chapters from both versions
            const chapter1 = version1Data[this.currentBook]?.[this.currentChapter];
            const chapter2 = version2Data[this.currentBook]?.[this.currentChapter];
            
            if (!chapter1 || !chapter2) {
                comparisonContent.innerHTML = '<p>Capítulo no encontrado en una de las versiones</p>';
                return;
            }
            
            // Create comparison HTML
            let html = `
                <div class="comparison-header">
                    <h3>${this.currentBook} ${this.currentChapter}</h3>
                </div>
                <div class="version-columns">
                    <div class="version-column">
                        <h4>${version1Name}</h4>
                        <div class="verses-column">
            `;
            
            // Add verses from version 1
            Object.keys(chapter1).forEach(verse => {
                html += `<div class="verse"><strong>${verse}.</strong> ${chapter1[verse]}</div>`;
            });
            
            html += `
                        </div>
                    </div>
                    <div class="version-column">
                        <h4>${version2Name}</h4>
                        <div class="verses-column">
            `;
            
            // Add verses from version 2
            Object.keys(chapter2).forEach(verse => {
                html += `<div class="verse"><strong>${verse}.</strong> ${chapter2[verse]}</div>`;
            });
            
            html += `
                        </div>
                    </div>
                </div>
            `;
            
            comparisonContent.innerHTML = html;
            
        } catch (error) {
            console.error('Error updating comparison:', error);
            comparisonContent.innerHTML = '<p>Error cargando las versiones para comparar</p>';
        }
    }

    // Helper method to load version data without changing current version
    async loadVersionData(versionId) {
        try {
            const version = this.versions.find(v => v.id === versionId);
            if (!version) {
                throw new Error(`Version not found: ${versionId}`);
            }

            // Try to load from cache first
            const cacheKey = `bible_${versionId}`;
            const cachedData = localStorage.getItem(cacheKey);
            
            if (cachedData) {
                try {
                    return JSON.parse(cachedData);
                } catch (e) {
                    console.warn('Cache data corrupted for', versionId);
                    localStorage.removeItem(cacheKey);
                }
            }
            
            // Load from server
            const response = await fetch(`./data/biblias-originales/${version.filename}`);
            if (!response.ok) {
                throw new Error(`Failed to load ${version.name}`);
            }
            
            const originalData = await response.json();
            const convertedData = this.convertOriginalFormat(originalData);
            
            // Cache for future use
            try {
                localStorage.setItem(cacheKey, JSON.stringify(convertedData));
            } catch (e) {
                console.warn('Could not cache data for', versionId);
            }
            
            return convertedData;
            
        } catch (error) {
            console.error('Error loading version data:', error);
            return null;
        }
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