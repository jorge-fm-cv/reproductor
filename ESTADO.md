# Reproductor — Estado del proyecto

App de música para Android (React Native + Expo SDK 57) que reproduce los
archivos de audio del dispositivo. Esta guía resume **lo que ya tenemos
funcionando** y **lo que falta / próximos pasos**.

---

## 1. Resumen

| Campo | Valor |
| --- | --- |
| Nombre de la app | Reproductor |
| Paquete Android | `com.jorgefrancisco.reproductor` |
| Framework | Expo SDK `~57.0.11` (React Native `0.86.2`, React `19.2.3`) |
| Plantilla | `create-expo-app` (blank) |
| Proyecto EAS | `2b5d5e84-5166-44b8-9c95-ca72ef7693fb` |
| Build instalada | Perfil `preview` (APK). Última: `ac4a04c2-d901-4a39-aede-661e25b942ff` |
| APK local | `./reproductor.apk` (≈73 MB) |
| Dispositivo de prueba | Motorola Edge 60 Fusion, Android 15, conectado por USB (adb) |

### Dependencias instaladas

- `expo-audio` (~57.0.3) — reproducción + reproducción en segundo plano
- `expo-media-library` (~57.0.3) — lectura de la biblioteca de audio (usa la API `legacy`)
- `expo-file-system`, `expo-asset`, `expo-font`
- `@react-native-community/slider` — barra de progreso
- `react-native-safe-area-context`, `@expo/vector-icons`

---

## 2. Qué ya tenemos (funcionando)

### Reproducción
- Lee las canciones de audio del dispositivo (`READ_MEDIA_AUDIO`) y las muestra
  en una lista (hasta 1000, ordenadas por fecha de creación).
- **Filtro de "canciones"**: de todo el audio de MediaStore solo se muestran las
  canciones. Se descartan notas de voz, grabaciones y el audio que guardan otras
  apps (WhatsApp, Telegram, Instagram, grabadoras…). Ver §4.1.
- Reproductor a pantalla completa con: portada, título, artista, barra de
  progreso con `Slider` (seek), y controles anterior / play-pausa / siguiente.
- Mini reproductor flotante en la lista con play-pausa y siguiente.
- Cambio automático de canción al terminar (`didJustFinish` → `next`).
- Cola de reproducción global (`PlayerContext`): play, pausa, siguiente,
  anterior y seek en cualquier momento.

### Reproducción en segundo plano (VERIFICADO en dispositivo)
- `setAudioModeAsync({ playsInSilentMode, shouldPlayInBackground, interruptionMode: 'doNotMix' })`.
- `player.setActiveForLockScreen(true, { title, artist })` para activar el
  servicio foreground de medios (`AudioControlsService`).
- Confirmado con adb: la música **continúa sonando** en segundo plano,
  supera el límite de 3 minutos de Android, y el auto-avance funciona en
  segundo plano.

### Notificaciones / controles en barra de estado (NUEVO, VERIFICADO)
- `requestNotificationPermissionsAsync()` (POST_NOTIFICATIONS) se solicita la
  primera vez que se reproduce una canción (una sola vez por sesión).
- La notificación de medios ya se muestra con los metadatos reales
  (título/artista) y controles de reproducción.
- Si el usuario rechaza el permiso, aparece un banner en la biblioteca con
  botón "Habilitar" (re-pregunta o abre los ajustes de la app si quedó
  bloqueado).

### Configuración nativa (`app.json`)
- Permisos: `READ_MEDIA_AUDIO`, `READ_EXTERNAL_STORAGE`, `POST_NOTIFICATIONS`,
  `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, etc.
- Plugins: `expo-audio` (`enableBackgroundPlayback: true`,
  `recordAudioAndroid: false`) y `expo-media-library` (granular `['audio']`).

### UI
- Tema oscuro propio (`src/theme`), SafeArea, íconos `Ionicons`, portada
  placeholder generada (`AlbumArt`).
- Estados de carga / sin permiso / sin canciones / errores.
- **Zona segura inferior**: la app dibuja a sangre bajo la barra de navegación
  del sistema (edge-to-edge). Los elementos en flujo normal heredan el
  `paddingBottom` del `SafeAreaView`, pero **los hijos con
  `position: 'absolute'` lo ignoran** (Yoga los posiciona contra el borde de la
  pantalla). Por eso `MiniPlayer` suma a mano `useSafeAreaInsets().bottom` a su
  `bottom`; sin eso sus botones play/siguiente quedan encima de los botones de
  navegación del dispositivo.
- **Logotipo "jfmMusic"**: iconos generados con Pillow desde
  `scripts/generate-logo.py` (`jfm` en blanco + `Music` en morado + ecualizador,
  fondo degradado morado/negro). Se regeneran con `python3 scripts/generate-logo.py`
  y cubren `icon.png`, los tres archivos del icono adaptativo de Android
  (fondo, primer plano y monocromo), `favicon.png` y `splash-icon.png`.

---

## 3. Cómo compilar e instalar (flujo EAS)

No se puede compilar localmente (no hay Android Studio/Java): se usa EAS Build
en la nube.

```sh
# 1) Verificar autenticación
npx eas whoami

# 2) Compilar APK (perfil "preview", sin esperar)
npx eas build -p android --profile preview --message "descripcion del cambio" --non-interactive --no-wait

# 3) Monitorear
npx eas build:list --platform android --limit 1 --json --non-interactive

# 4) Descargar el APK (usar el buildUrl que devuelve build:list)
curl -sL "<buildUrl>" -o reproductor.apk

# 5) Instalar en el dispositivo conectado
adb install -r reproductor.apk
```

Perfiles en `eas.json`: `development` (dev client), `preview` (APK de prueba)
y `production` (app-bundle para Play Store, con `autoIncrement`).

---

## 4. Limitaciones conocidas

### 4.1 Filtro de canciones (qué se descarta y por qué)

`expo-media-library` **no expone** la columna `IS_MUSIC` de MediaStore (ni
álbum, artista ni carátula), así que no se puede preguntar "¿esto es música?".
El filtro se hace en JavaScript (`src/utils/songFilter.js`) con las tres
señales que sí llegan:

| Señal | Regla | Ejemplo |
| --- | --- | --- |
| Extensión | `.opus`, `.amr`, `.awb`, `.oga` = nota de voz / grabación | `PTT-20261021-WA0001.opus` |
| Ruta | dentro de `Android/media/<paquete>/` (salvo allowlist de apps de música) o en carpetas de chat / grabadora | `Android/media/com.whatsapp/…`, `Recordings/`, `Podcasts/` |
| Nombre | patrón de WhatsApp `PTT-/AUD-/VID-<AAAAMMDD>-WA<0000>` | `AUD-20240614-WA0000.mp3` |

Lo que no se descarta se considera canción. En el dispositivo de prueba
(118 archivos de audio) el resultado es **10 canciones** (las de `/Music/`) y
**108 descartes** (73 de WhatsApp + 35 notas de voz `.opus`).

Consecuencias a tener en cuenta:
- Una canción real en `.opus` se descarta. Es el formato que pidió el usuario
  para las notas de voz de WhatsApp.
- Las canciones que el usuario tiene **dentro** de la carpeta de WhatsApp
  (`AUD-….mp3`, ~90 archivos, álbum "DOSIS DIARIA ROKA") **no** se muestran:
  además de estar en la carpeta de WhatsApp, sus nombres de archivo son
  `AUD-20240614-WA0000`, así que no se pueden leer como títulos. Si las quiere
  en la app, hay que moverlas a `/sdcard/Music/` (o a `/Music/`) desde el
  explorador de archivos: el título sale del nombre del archivo.
- No hay filtro por duración: un audio suelto en `/Download/` que no tenga
  nombre de WhatsApp **sí** aparece. Se puede añadir un umbral en
  `songFilter.js` si hace falta.

### 4.2 Otras limitaciones

- **Expo Go (Android):** ya no permite leer la biblioteca multimedia del
  dispositivo. La app solo funciona como build propio (APK/dev build).
- **API nueva de `expo-media-library`:** el módulo nativo `ExpoMediaLibraryNext`
  no está disponible; por eso se usa `expo-media-library/legacy`
  (ver `src/hooks/useSongs.js`).
- **Tags reales:** el artista se muestra como "Desconocido" y la portada es un
  placeholder, porque todavía no se leen los metadatos reales (ID3/MediaStore).
- **Sin gestión de archivos:** no hay borrado, renombrado ni importación
  de canciones dentro de la app.
- `versionCode` en `app.json` se ignora con `appVersionSource: "remote"`
  (aviso benigno de EAS).

---

## 5. Qué falta / próximos pasos (por prioridad)

### Alta prioridad (mejora la experiencia)
- [ ] **Leer tags reales** (artista, álbum, carátula) desde MediaStore:
  consultar columnas `ARTIST`, `ALBUM`, `ALBUM_ID`, `TITLE`, `DURATION` y
  cargar la portada vía `MediaStore` / `content://media/external/audio/albumart/<albumId>`
  o leyendo los metadatos del archivo.
- [ ] **Mostrar la carátula real** en `AlbumArt` (notificación, mini player y
  pantalla completa). Incluye pasar `artworkUrl` a `setActiveForLockScreen`.
- [ ] **Mantener metadata actualizada** en la notificación al cambiar de
  canción automáticamente (`updateLockScreenMetadata`).

### Media prioridad (funciones típicas de un reproductor)
- [ ] **Buscar** canciones por título/artista.
- [ ] **Ordenar/filtrar** la biblioteca (por artista, álbum, fecha).
- [ ] **Modo shuffle** y **modo repetición** (1 / todas).
- [ ] **Favoritos / playlist** (persistencia local con `expo-file-system`
  o `AsyncStorage`).
- [ ] **Bajar volumen / no perder estado al salir** (guardar última canción y
  posición para reanudar).

### Baja prioridad (pulido)
- [ ] Mejor manejo de errores de reproducción por formato no soportado.
- [ ] Ecualizador básico (`audioEffects` de media3, o librería).
- [ ] Soporte de pistas de audio largas / audiolibros (recordar posición).
- [ ] Pantalla "Reproduciendo" con arte borroso de fondo (efecto visual).
- [ ] Tests y limpieza de código (eslint, proptypes/types).

---

## 6. Estructura del código

```
App.js                          → Navegación simple (library ↔ player)
src/
  context/PlayerContext.js      → Player global, cola, controles, permisos
  hooks/useSongs.js             → Carga de canciones (expo-media-library/legacy)
  screens/
    LibraryScreen.js            → Lista de canciones + banner de notificaciones
    PlayerScreen.js             → Reproductor a pantalla completa
  components/
    AlbumArt.js                 → Portada (placeholder por ahora)
    MiniPlayer.js               → Barra flotante con canción actual
    PlayerControls.js           → Botones anterior/play/siguiente
  theme/index.js                → Colores, espacios, radios, tipografías
  utils/
    format.js                   → formatTime, titleFromFilename
    songFilter.js               → Filtro de canciones (extensión, ruta, nombre)
    env.js                      → Detección de Expo Go
scripts/
  generate-logo.py              → Genera los iconos de la app (Pillow)
docs/                           → Capturas reales de la app para el README
```

---

## 7. Comandos útiles

```sh
# Desarrollo
npx expo start                  # Metro / Expo Go
npx expo export --platform android   # Verifica que el bundle compila
python3 scripts/generate-logo.py     # Regenera los iconos de la app

# Build en la nube (el CLI se baja con npx; "npx eas" NO es el CLI de Expo)
npx --yes eas-cli@latest whoami
npx --yes eas-cli@latest build -p android --profile preview --message "desc" --non-interactive --no-wait
npx --yes eas-cli@latest build:view <buildId>   # estado + URL del APK
curl -sL "<buildUrl>" -o reproductor.apk

# Dispositivo
adb install -r reproductor.apk  # (Re)instalar APK
adb shell am start -n com.jorgefrancisco.reproductor/.MainActivity
adb logcat -d | grep -i reproductor   # Logs de la app
adb shell dumpsys package com.jorgefrancisco.reproductor | grep -E "POST_NOTIFICATIONS|READ_MEDIA_AUDIO"  # Permisos

# Verificación visual (el sustituto de los tests)
adb shell uiautomator dump /sdcard/ui.xml && adb shell cat /sdcard/ui.xml   # texto y coordenadas
adb exec-out screencap -p > captura.png                                    # captura de pantalla
adb shell dumpsys window | grep -i navigationBars                          # barra de navegación del SO
```
