// Convertidor de formato de Biblia
// De formato array a formato objeto para la aplicación

/**
 * Convierte el formato original de biblias al formato requerido por la app
 * Formato original: { name, abbreviation, lang, books: [{ name, chapters: [[{verse, text}]] }] }
 * Formato requerido: { "BookName": { "ChapterNum": { "VerseNum": "text" } } }
 */

class BibleConverter {
    static convertToAppFormat(originalBible) {
        const convertedBible = {};
        
        if (!originalBible.books || !Array.isArray(originalBible.books)) {
            throw new Error('Formato de biblia inválido: books debe ser un array');
        }
        
        originalBible.books.forEach(book => {
            if (!book.name || !book.chapters) {
                console.warn(`Libro inválido encontrado:`, book);
                return;
            }
            
            const bookName = book.name;
            convertedBible[bookName] = {};
            
            book.chapters.forEach((chapter, chapterIndex) => {
                const chapterNum = chapterIndex + 1; // Los capítulos empiezan en 1
                convertedBible[bookName][chapterNum] = {};
                
                if (Array.isArray(chapter)) {
                    chapter.forEach(verse => {
                        if (verse && verse.verse && verse.text) {
                            convertedBible[bookName][chapterNum][verse.verse] = verse.text;
                        }
                    });
                }
            });
        });
        
        return convertedBible;
    }
    
    static validateOriginalFormat(bible) {
        const errors = [];
        
        if (!bible.name) errors.push('Falta el nombre de la biblia');
        if (!bible.abbreviation) errors.push('Falta la abreviación');
        if (!bible.lang) errors.push('Falta el idioma');
        if (!bible.books || !Array.isArray(bible.books)) {
            errors.push('books debe ser un array');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    static generateVersionInfo(originalBible) {
        return {
            id: originalBible.abbreviation.toLowerCase(),
            name: originalBible.name,
            language: originalBible.lang,
            abbreviation: originalBible.abbreviation,
            filename: `${originalBible.abbreviation.toLowerCase()}.json`,
            totalBooks: originalBible.books ? originalBible.books.length : 0
        };
    }
    
    static async processMultipleBibles(bibleFiles) {
        const convertedBibles = {};
        const versionsList = [];
        const errors = [];
        
        for (const [filename, bibleData] of Object.entries(bibleFiles)) {
            try {
                const validation = this.validateOriginalFormat(bibleData);
                
                if (!validation.isValid) {
                    errors.push({
                        file: filename,
                        errors: validation.errors
                    });
                    continue;
                }
                
                const converted = this.convertToAppFormat(bibleData);
                const versionInfo = this.generateVersionInfo(bibleData);
                
                convertedBibles[versionInfo.id] = converted;
                versionsList.push(versionInfo);
                
                console.log(`✅ Convertida: ${bibleData.name} (${Object.keys(converted).length} libros)`);
                
            } catch (error) {
                errors.push({
                    file: filename,
                    error: error.message
                });
            }
        }
        
        return {
            convertedBibles,
            versions: versionsList,
            errors
        };
    }
    
    static getBookStatistics(convertedBible) {
        const stats = {};
        
        Object.keys(convertedBible).forEach(bookName => {
            const chapters = convertedBible[bookName];
            const chapterCount = Object.keys(chapters).length;
            let verseCount = 0;
            
            Object.values(chapters).forEach(chapter => {
                verseCount += Object.keys(chapter).length;
            });
            
            stats[bookName] = {
                chapters: chapterCount,
                verses: verseCount
            };
        });
        
        return stats;
    }
}

// Función de utilidad para cargar y convertir una biblia
async function loadAndConvertBible(file) {
    try {
        let bibleData;
        
        if (typeof file === 'string') {
            // Si es una URL o path
            const response = await fetch(file);
            bibleData = await response.json();
        } else if (file instanceof File) {
            // Si es un archivo del input
            const text = await file.text();
            bibleData = JSON.parse(text);
        } else {
            // Si ya es un objeto
            bibleData = file;
        }
        
        const validation = BibleConverter.validateOriginalFormat(bibleData);
        if (!validation.isValid) {
            throw new Error(`Formato inválido: ${validation.errors.join(', ')}`);
        }
        
        const converted = BibleConverter.convertToAppFormat(bibleData);
        const versionInfo = BibleConverter.generateVersionInfo(bibleData);
        const stats = BibleConverter.getBookStatistics(converted);
        
        return {
            success: true,
            data: converted,
            versionInfo,
            stats,
            originalName: bibleData.name
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.BibleConverter = BibleConverter;
    window.loadAndConvertBible = loadAndConvertBible;
}

// Exportar para Node.js si está disponible
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BibleConverter,
        loadAndConvertBible
    };
}