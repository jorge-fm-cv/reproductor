<p align="center">
  <img src="./assets/android-icon-foreground.png" width="120" alt="Reproductor" />
</p>

<h1 align="center">Reproductor</h1>

<p align="center">
  Reproductor de música para Android construido con React Native y Expo.<br/>
  Lee el audio del dispositivo y lo reproduce en primer y segundo plano.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo%20SDK-57.0.11-000020?style=flat-square&logo=expo&logoColor=white" alt="Expo SDK" />
  <img src="https://img.shields.io/badge/React%20Native-0.86.2-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/plataforma-Android%2015%2B-3DDC84?style=flat-square&logo=android&logoColor=white" alt="Android" />
  <img src="https://img.shields.io/badge/licencia-MIT-yellow?style=flat-square" alt="MIT" />
</p>

---

## Características

- **Biblioteca del dispositivo**: lista hasta 1000 canciones ordenadas por fecha de creación.
- **Reproductor a pantalla completa**: portada, título, artista, barra de progreso con *seek* y controles anterior / play / siguiente.
- **Mini reproductor flotante**: siempre visible sobre la lista, con play-pausa y salto.
- **Reproducción en segundo plano verificada**: la música sigue sonando con la app cerrada, supera el límite de ~3 minutos de Android y avanza de canción automáticamente.
- **Controles en la barra de notificaciones y pantalla de bloqueo** con metadatos reales de la canción en reproducción.
- **Cola de reproducción global**: los controles funcionan desde cualquier pantalla.
- **Tema oscuro propio**, SafeArea e íconos `Ionicons`.
- Estados de carga, sin permiso, sin canciones y de error.

## Descarga rápida

Descarga e instala el APK compilado que está en este mismo repositorio:

👉 **[`reproductor.apk`](./reproductor.apk)** (≈73 MB)

> En la página de GitHub, entra al archivo y pulsa **"Download raw file"**.
> Al instalarlo, Android pedirá permitir instalar de orígenes desconocidos.

También puedes compilar tu propio APK (ver abajo).

## Instalación desde el código

Requisitos: cuenta de [Expo](https://expo.dev/), `adb` y un dispositivo Android conectado por USB.

```sh
git clone <url-del-repositorio>
cd reproductor
npm install

# Compilar APK en la nube (perfil "preview")
npx eas whoami
npx eas build -p android --profile preview --message "primer build" --non-interactive --no-wait

# Comprobar el build y descargarlo
npx eas build:list --platform android --limit 1 --json --non-interactive
curl -sL "<buildUrl>" -o reproductor.apk

# Instalar en el dispositivo
adb install -r reproductor.apk
```

> **Importante**: la app **no funciona en Expo Go**. En Android, Expo Go ya no permite leer la
> biblioteca multimedia del dispositivo, así que hace falta un build propio (APK o dev build).
> Compilar en local no es necesario: todo pasa por EAS Build.

## Desarrollo

```sh
npx expo start                     # Metro / dev server
npx expo export --platform android # Verifica que el bundle compila
```

No hay suite de tests, linter ni comprobación de tipos: que el bundle compile limpio es toda la señal disponible antes de compilar.

## Stack

| Componente | Detalle |
| --- | --- |
| Framework | Expo SDK `~57.0.11` (plantilla `create-expo-app` blank) |
| Runtime | React Native `0.86.2`, React `19.2.3` |
| Audio | `expo-audio` — reproducción, lock screen y servicio de medios |
| Biblioteca | `expo-media-library` (API legacy) — `READ_MEDIA_AUDIO` |
| UI | `@react-native-community/slider`, `@expo/vector-icons`, `react-native-safe-area-context` |
| Builds | EAS Build (`development` / `preview` / `production`) |

## Estructura

```
App.js                        Navegación simple (biblioteca ↔ reproductor)
src/
  context/PlayerContext.js    Reproductor global, cola, controles y permisos
  hooks/useSongs.js           Carga de canciones desde el dispositivo
  screens/
    LibraryScreen.js          Lista de canciones + banner de notificaciones
    PlayerScreen.js           Reproductor a pantalla completa
  components/
    AlbumArt.js               Portada (placeholder)
    MiniPlayer.js             Barra flotante con la canción actual
    PlayerControls.js         Botones anterior / play / siguiente
  theme/index.js              Colores, espacios, radios y tipografías
  utils/
    format.js                 formatTime, titleFromFilename
    env.js                    Detección de Expo Go
```

## Limitaciones conocidas

- Los **metadatos reales (ID3/MediaStore) todavía no se leen**: el artista aparece como "Desconocido" y la portada es un placeholder generado.
- Sin búsqueda, orden por artista/álbum, modo shuffle, repetición ni playlists.
- Sin gestión de archivos (borrar, renombrar o importar canciones).
- `versionCode` de `app.json` se ignora: la versión la controla EAS (`appVersionSource: "remote"`).

## Próximos pasos

1. Leer tags reales (artista, álbum, carátula) desde MediaStore y mostrar la portada real, incluida en la notificación y la pantalla de bloqueo.
2. Mantener la metadata de la notificación actualizada al cambiar de canción automáticamente.
3. Búsqueda, orden, shuffle/repetición y favoritos con persistencia local.

El detalle completo y el estado actual del proyecto están en [`ESTADO.md`](./ESTADO.md).

## Licencia

[MIT](./LICENSE) — licencia incluida en la plantilla de Expo sobre la que se creó el proyecto.
