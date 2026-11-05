# Catálogo de plugins de Mjolnir

Mjolnir lee `index.json` de este repo para la pestaña **Disponibles** de la vista Plugins. Cada entrada describe un paquete `.mjp` publicado en las releases de un repo de GitHub:

```json
{
  "id": "http-client",
  "version": "0.1.0",
  "sha256": "…",
  "url": "https://github.com/<owner>/<repo>/releases/download/<tag>/http-client-0.1.0.mjp",
  "size": 81147,
  "manifest": { "…": "el mjolnir-plugin.json del paquete" },
  "strings": { "es": { "name": "Cliente HTTP" } },
  "signature": "…"
}
```

La app descarga el paquete, verifica el `sha256` y que el manifest tenga el mismo id y versión, y lo instala. Las entradas con `signature` válida (ed25519 sobre id, versión y sha256, con la clave de Mjolnir) se muestran como **Verificado**; el resto, como **Sin verificar**.

## Plugins first-party

Los publica el workflow de release de [Lautimb/mjolnir](https://github.com/Lautimb/mjolnir): sube los `.mjp` y `catalog-entries.json` a la release. `Sync` copia esas entradas acá cada 6 horas, o al correrlo a mano.

## Publicar un plugin

1. Empaquetalo con `mjolnir-plugin pack dist` y subí el `.mjp` a una release de tu repo.
2. Generá la entrada con `mjolnir-plugin entry dist <archivo.mjp> --url <url de descarga>`.
3. Abrí un PR que la agregue a `plugins` en `index.json`. `Validate` descarga el paquete y verifica tamaño y sha256.
