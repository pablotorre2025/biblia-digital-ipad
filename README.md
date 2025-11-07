# Biblia Digital - Múltiples Versiones

Una aplicación web progresiva (PWA) para leer la Biblia en múltiples versiones, optimizada para iPad y compatible offline.

## 🌟 Características

- **Múltiples versiones**: Reina Valera 1960, NVI, LBLA, KJV, NIV
- **Compatible offline**: Funciona sin conexión a internet
- **Optimizado para iPad**: Diseño responsivo para pantallas de iPad
- **Navegación intuitiva**: Navegación fácil entre libros y capítulos
- **Personalización**: Ajuste de fuente, tema y configuraciones
- **PWA**: Se puede instalar como aplicación nativa
- **Almacenamiento local**: Guarda progreso y preferencias

## 📱 Optimizado para iPad

- Diseño responsivo para orientación horizontal y vertical
- Gestos táctiles para navegación
- Interfaz optimizada para pantallas táctiles
- Soporte para modo oscuro y sepia

## 🚀 Instalación

### Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/biblia-json.git
cd biblia-json
```

### Servir localmente

Debido a las políticas CORS, necesitas servir los archivos desde un servidor web:

#### Opción 1: Python
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### Opción 2: Node.js
```bash
npx http-server -p 8000
```

#### Opción 3: PHP
```bash
php -S localhost:8000
```

Luego abre `http://localhost:8000` en tu navegador.

## 📚 Estructura de datos

Los archivos JSON de la Biblia siguen esta estructura:

```json
{
  "Génesis": {
    "1": {
      "1": "En el principio creó Dios los cielos y la tierra.",
      "2": "Y la tierra estaba desordenada y vacía..."
    }
  }
}
```

### Añadir nuevas versiones

1. Crea un archivo JSON en la carpeta `data/` siguiendo la estructura anterior
2. Actualiza el archivo `data/versions.json` con la información de la nueva versión
3. El archivo se cargará automáticamente en la aplicación

## 🛠️ Configuración

### Personalización de temas

Puedes modificar los themes en `css/styles.css`:

```css
:root {
  --primary-color: #2563eb;
  --background-color: #ffffff;
  /* ... más variables */
}
```

### Configuración offline

El Service Worker cachea automáticamente:
- Archivos de la aplicación (HTML, CSS, JS)
- Datos de versiones bíblicas
- Configuraciones del usuario

## 📋 Uso

1. **Seleccionar versión**: Usa el selector de versión en el header
2. **Navegar**: Selecciona libro y capítulo, o usa las flechas de navegación
3. **Gestos**: En iPad, desliza izquierda/derecha para cambiar capítulos
4. **Configuración**: Toca el ícono ⚙️ para ajustar fuente, tema, etc.
5. **Offline**: La app funciona sin conexión una vez cargada

## 🔧 Desarrollo

### Estructura del proyecto

```
biblia-json/
├── index.html          # Página principal
├── manifest.json       # Configuración PWA
├── sw.js              # Service Worker
├── css/
│   └── styles.css     # Estilos principales
├── js/
│   ├── app.js         # Lógica principal
│   ├── bible-data.js  # Manejo de datos bíblicos
│   └── ui.js          # Componentes de interfaz
├── data/
│   ├── versions.json  # Configuración de versiones
│   └── *.json        # Archivos de versiones bíblicas
└── assets/
    ├── icon-192.png   # Icono PWA 192x192
    └── icon-512.png   # Icono PWA 512x512
```

### Añadir funcionalidades

1. **Nueva funcionalidad UI**: Modifica `js/ui.js`
2. **Lógica de datos**: Actualiza `js/bible-data.js`
3. **Funcionalidad principal**: Edita `js/app.js`
4. **Estilos**: Modifica `css/styles.css`

## 📱 Instalación como PWA

### En iPad (Safari)

1. Abre la aplicación en Safari
2. Toca el botón "Compartir" 
3. Selecciona "Añadir a la pantalla de inicio"
4. Confirma la instalación

### En otros navegadores

La aplicación se puede instalar como PWA en navegadores compatibles que muestren el prompt de instalación.

## 🔄 Actualización de datos

Para actualizar las versiones bíblicas:

1. Actualiza los archivos JSON en la carpeta `data/`
2. Modifica `data/versions.json` si añades nuevas versiones
3. Incrementa la versión del cache en `sw.js` (CACHE_NAME)
4. Los usuarios recibirán la actualización automáticamente

## 🚀 Despliegue en GitHub Pages

1. Sube el código a un repositorio de GitHub
2. Ve a Settings > Pages
3. Selecciona la rama main como fuente
4. La aplicación estará disponible en `https://tu-usuario.github.io/biblia-json/`

## 📞 Soporte

Si encuentras problemas o tienes sugerencias:

1. Abre un issue en GitHub
2. Incluye detalles del dispositivo y navegador
3. Describe el problema paso a paso

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🙏 Contribuciones

Las contribuciones son bienvenidas:

1. Haz fork del proyecto
2. Crea una rama para tu funcionalidad (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

Creado con ❤️ para facilitar el acceso a la Palabra de Dios