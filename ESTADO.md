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
| Build instalada | Perfil `preview` (APK). Última: `2c1cf332-e96a-4ab1-863a-11a89328406a` |
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
    env.js                      → Detección de Expo Go
```

---

## 7. Comandos útiles

```sh
# Desarrollo
npx expo start                  # Metro / Expo Go
npx expo export --platform android   # Verifica que el bundle compila

# Dispositivo
adb install -r reproductor.apk  # (Re)instalar APK
adb shell am start -n com.jorgefrancisco.reproductor/.MainActivity
adb logcat -d | grep -i reproductor   # Logs de la app
adb shell dumpsys package com.jorgefrancisco.reproductor | grep -E "POST_NOTIFICATIONS|READ_MEDIA_AUDIO"  # Permisos
```
