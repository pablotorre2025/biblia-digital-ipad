// Bible Data Management
class BibleDataManager {
    constructor() {
        this.versions = new Map();
        this.loadedBooks = new Set();
    }

    async loadVersionMetadata() {
        try {
            const response = await fetch('./data/versions.json');
            const data = await response.json();
            return data.versions;
        } catch (error) {
            console.error('Error loading version metadata:', error);
            return [];
        }
    }

    async loadBibleVersion(versionId) {
        if (this.versions.has(versionId)) {
            return this.versions.get(versionId);
        }

        try {
            const response = await fetch(`./data/${versionId}.json`);
            const data = await response.json();
            
            this.versions.set(versionId, data);
            return data;
        } catch (error) {
            console.error(`Error loading version ${versionId}:`, error);
            throw error;
        }
    }

    getBookList(versionId) {
        const version = this.versions.get(versionId);
        return version ? Object.keys(version) : [];
    }

    getChapterList(versionId, bookName) {
        const version = this.versions.get(versionId);
        if (!version || !version[bookName]) return [];
        return Object.keys(version[bookName]).map(Number);
    }

    getChapter(versionId, bookName, chapterNum) {
        const version = this.versions.get(versionId);
        if (!version || !version[bookName] || !version[bookName][chapterNum]) {
            return null;
        }
        return version[bookName][chapterNum];
    }

    searchVerses(versionId, query, options = {}) {
        const version = this.versions.get(versionId);
        if (!version) return [];

        const results = [];
        const searchTerm = query.toLowerCase();
        const { books = null, maxResults = 100 } = options;

        const booksToSearch = books || Object.keys(version);

        for (const bookName of booksToSearch) {
            if (results.length >= maxResults) break;

            const book = version[bookName];
            for (const chapterNum of Object.keys(book)) {
                if (results.length >= maxResults) break;

                const chapter = book[chapterNum];
                for (const verseNum of Object.keys(chapter)) {
                    if (results.length >= maxResults) break;

                    const verseText = chapter[verseNum].toLowerCase();
                    if (verseText.includes(searchTerm)) {
                        results.push({
                            book: bookName,
                            chapter: parseInt(chapterNum),
                            verse: parseInt(verseNum),
                            text: chapter[verseNum],
                            reference: `${bookName} ${chapterNum}:${verseNum}`
                        });
                    }
                }
            }
        }

        return results;
    }
}

// Bible Books metadata
const BIBLE_BOOKS = {
    oldTestament: [
        'Génesis', 'Éxodo', 'Levítico', 'Números', 'Deuteronomio',
        'Josué', 'Jueces', 'Rut', '1 Samuel', '2 Samuel',
        '1 Reyes', '2 Reyes', '1 Crónicas', '2 Crónicas', 'Esdras',
        'Nehemías', 'Ester', 'Job', 'Salmos', 'Proverbios',
        'Eclesiastés', 'Cantares', 'Isaías', 'Jeremías', 'Lamentaciones',
        'Ezequiel', 'Daniel', 'Oseas', 'Joel', 'Amós',
        'Abdías', 'Jonás', 'Miqueas', 'Nahúm', 'Habacuc',
        'Sofonías', 'Hageo', 'Zacarías', 'Malaquías'
    ],
    newTestament: [
        'Mateo', 'Marcos', 'Lucas', 'Juan', 'Hechos',
        'Romanos', '1 Corintios', '2 Corintios', 'Gálatas', 'Efesios',
        'Filipenses', 'Colosenses', '1 Tesalonicenses', '2 Tesalonicenses',
        '1 Timoteo', '2 Timoteo', 'Tito', 'Filemón', 'Hebreos',
        'Santiago', '1 Pedro', '2 Pedro', '1 Juan', '2 Juan',
        '3 Juan', 'Judas', 'Apocalipsis'
    ]
};

// Bible Books English names mapping (for international versions)
const ENGLISH_BOOKS = {
    'Genesis': 'Génesis',
    'Exodus': 'Éxodo',
    'Leviticus': 'Levítico',
    'Numbers': 'Números',
    'Deuteronomy': 'Deuteronomio',
    'Joshua': 'Josué',
    'Judges': 'Jueces',
    'Ruth': 'Rut',
    '1 Samuel': '1 Samuel',
    '2 Samuel': '2 Samuel',
    '1 Kings': '1 Reyes',
    '2 Kings': '2 Reyes',
    '1 Chronicles': '1 Crónicas',
    '2 Chronicles': '2 Crónicas',
    'Ezra': 'Esdras',
    'Nehemiah': 'Nehemías',
    'Esther': 'Ester',
    'Job': 'Job',
    'Psalms': 'Salmos',
    'Proverbs': 'Proverbios',
    'Ecclesiastes': 'Eclesiastés',
    'Song of Solomon': 'Cantares',
    'Isaiah': 'Isaías',
    'Jeremiah': 'Jeremías',
    'Lamentations': 'Lamentaciones',
    'Ezekiel': 'Ezequiel',
    'Daniel': 'Daniel',
    'Hosea': 'Oseas',
    'Joel': 'Joel',
    'Amos': 'Amós',
    'Obadiah': 'Abdías',
    'Jonah': 'Jonás',
    'Micah': 'Miqueas',
    'Nahum': 'Nahúm',
    'Habakkuk': 'Habacuc',
    'Zephaniah': 'Sofonías',
    'Haggai': 'Hageo',
    'Zechariah': 'Zacarías',
    'Malachi': 'Malaquías',
    'Matthew': 'Mateo',
    'Mark': 'Marcos',
    'Luke': 'Lucas',
    'John': 'Juan',
    'Acts': 'Hechos',
    'Romans': 'Romanos',
    '1 Corinthians': '1 Corintios',
    '2 Corinthians': '2 Corintios',
    'Galatians': 'Gálatas',
    'Ephesians': 'Efesios',
    'Philippians': 'Filipenses',
    'Colossians': 'Colosenses',
    '1 Thessalonians': '1 Tesalonicenses',
    '2 Thessalonians': '2 Tesalonicenses',
    '1 Timothy': '1 Timoteo',
    '2 Timothy': '2 Timoteo',
    'Titus': 'Tito',
    'Philemon': 'Filemón',
    'Hebrews': 'Hebreos',
    'James': 'Santiago',
    '1 Peter': '1 Pedro',
    '2 Peter': '2 Pedro',
    '1 John': '1 Juan',
    '2 John': '2 Juan',
    '3 John': '3 Juan',
    'Jude': 'Judas',
    'Revelation': 'Apocalipsis'
};

// Utility functions for Bible data
const BibleUtils = {
    translateBookName(englishName) {
        return ENGLISH_BOOKS[englishName] || englishName;
    },

    isOldTestament(bookName) {
        return BIBLE_BOOKS.oldTestament.includes(bookName);
    },

    isNewTestament(bookName) {
        return BIBLE_BOOKS.newTestament.includes(bookName);
    },

    getAllBooks() {
        return [...BIBLE_BOOKS.oldTestament, ...BIBLE_BOOKS.newTestament];
    },

    getBookIndex(bookName) {
        const allBooks = this.getAllBooks();
        return allBooks.indexOf(bookName);
    },

    getNextBook(bookName) {
        const allBooks = this.getAllBooks();
        const index = allBooks.indexOf(bookName);
        return index < allBooks.length - 1 ? allBooks[index + 1] : null;
    },

    getPreviousBook(bookName) {
        const allBooks = this.getAllBooks();
        const index = allBooks.indexOf(bookName);
        return index > 0 ? allBooks[index - 1] : null;
    },

    formatReference(book, chapter, verse = null) {
        if (verse) {
            return `${book} ${chapter}:${verse}`;
        }
        return `${book} ${chapter}`;
    },

    parseReference(reference) {
        // Parse references like "Genesis 1:1" or "Génesis 1:1-10"
        const regex = /^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/;
        const match = reference.match(regex);
        
        if (!match) return null;
        
        return {
            book: match[1].trim(),
            chapter: parseInt(match[2]),
            startVerse: match[3] ? parseInt(match[3]) : null,
            endVerse: match[4] ? parseInt(match[4]) : null
        };
    }
};

// Export for global access
window.BibleDataManager = BibleDataManager;
window.BibleUtils = BibleUtils;
window.BIBLE_BOOKS = BIBLE_BOOKS;