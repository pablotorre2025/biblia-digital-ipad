# 📚 Biblias Originales

Esta carpeta está diseñada para almacenar tus archivos de Biblia en el formato original que me mostraste.

## 📋 Formato esperado

Cada archivo debe seguir esta estructura:

```json
{
  "name": "Nombre de la Versión",
  "abbreviation": "ABREV",
  "lang": "es",
  "books": [
    {
      "name": "Nombre del Libro",
      "chapters": [
        [
          {
            "verse": 1,
            "text": "Texto del versículo"
          },
          {
            "verse": 2,
            "text": "Texto del siguiente versículo"
          }
        ],
        [
          {
            "verse": 1,
            "text": "Primer versículo del capítulo 2"
          }
        ]
      ]
    }
  ]
}
```

## 🗂️ Nombrado de archivos

- Usa la abreviación en minúsculas para el nombre del archivo
- Ejemplos: `rv60.json`, `nvi.json`, `lbla.json`, `kjv.json`

## 📝 Pasos para añadir una nueva Biblia

1. **Copia tu archivo JSON** a esta carpeta
2. **Renómbralo** usando la abreviación en minúsculas
3. **Actualiza** el archivo `../versions.json` añadiendo la entrada correspondiente:

```json
{
  "id": "abreviacion",
  "name": "Nombre Completo",
  "language": "es",
  "year": 2000,
  "description": "Descripción de la versión",
  "filename": "abreviacion.json",
  "format": "original",
  "folder": "biblias-originales"
}
```

4. **Recarga la aplicación** - La nueva versión aparecerá automáticamente

## ✅ Ejemplo funcional

Ya incluimos un ejemplo funcional: `rv60.json` que puedes usar como referencia.

## 🔄 Conversión automática

La aplicación convierte automáticamente tu formato a la estructura interna necesaria. No necesitas modificar tus archivos originales.

## ⚠️ Notas importantes

- Los archivos deben tener codificación UTF-8
- Asegúrate de que el JSON sea válido (puedes validarlo en jsonlint.com)
- Los números de versículo deben ser consecutivos en cada capítulo
- Los capítulos se numeran automáticamente desde 1

## 🚀 Ventajas de este sistema

- ✅ Mantiene tus archivos originales intactos
- ✅ Soporte para múltiples formatos
- ✅ Conversión automática
- ✅ Fácil añadir nuevas versiones
- ✅ Compatible con tu formato actual