# Reproductor — Guía para agentes

> **Expo HAS CHANGED.** Antes de escribir código, lee la doc exacta de esta versión:
> <https://docs.expo.dev/versions/v57.0.0/> (añade `.md` a cualquier URL para Markdown limpio,
> o usa el índice <https://docs.expo.dev/llms.txt>). No copies APIs de SDKs antiguas ni de memoria:
> varios métodos que "siempre existieron" **lanzan error en tiempo de ejecución** en SDK 57.

## Qué es

App de música **solo Android** (React Native + Expo SDK `~57.0.11`, RN `0.86.2`, React `19.2.3`)
que reproduce el audio del dispositivo. Paquete `com.jorgefrancisco.reproductor`.
JavaScript puro: **no hay TypeScript, tests, linter, formatter ni CI** — `package.json` solo tiene
`start` / `android` / `ios` / `web` de Expo.

Estado, decisiones y roadmap: **`ESTADO.md`** (español). Es la referencia de proyecto; este archivo
solo cubre lo que un agente rompería sin avisar.

Idioma del repo: comentarios, textos de UI y commits en **español**. Manténlo.

## Comandos

```sh
npx expo export --platform android   # ÚNICA verificación local: compila el bundle Metro (→ dist/)
npx expo start                       # Dev server. NO sirve para probar la biblioteca (ver gotcha #2)
python3 scripts/generate-logo.py     # Regenera los iconos de la app (Pillow)
```

No hay `test`, `lint` ni `typecheck`: un build/export limpio es toda la señal disponible.

Build en la nube (no hay build de Android local en uso; el CLI se baja bajo demanda con `npx`):

```sh
npx --yes eas-cli@latest whoami
npx --yes eas-cli@latest build -p android --profile preview --message "desc" --non-interactive --no-wait
npx --yes eas-cli@latest build:view <buildId>     # estado + "Application Archive URL" (el APK)
curl -sL "<buildUrl>" -o reproductor.apk
adb install -r reproductor.apk
adb shell am start -n com.jorgefrancisco.reproductor/.MainActivity
adb logcat -d | grep -i reproductor
```

> `npx eas` **no** es el CLI de Expo (resuelve un paquete homónimo sin binario y falla con
> *"could not determine executable to run"*). Usa siempre `npx --yes eas-cli@latest`.
> `build:view` no acepta `--json` ni `--non-interactive`.

Perfiles en `eas.json`: `development` (dev client) / `preview` (APK de prueba) / `production` (app-bundle).

### Verificar en el dispositivo (el sustituto de los tests)

```sh
adb shell uiautomator dump /sdcard/ui.xml   # texto + coordenadas reales de lo que se ve
adb shell cat /sdcard/ui.xml
adb exec-out screencap -p > captura.png     # captura (comprueba el PNG con Python/Pillow)
adb shell dumpsys media_session | grep -i reproductor
adb shell dumpsys window | grep -i navigationBars   # posición real de la barra del sistema
```

Dos trampas de este flujo:

- El primer `adb shell input tap` después de lanzar la app suele **no** llegar a la app (se lo
  come el diálogo de permiso de notificaciones o la transición de foco). Toca dos veces y comprueba
  con `uiautomator dump` que el mini reproductor apareció.
- `uiautomator dump` falla con *"could not get idle state"* si algo se anima sin parar (el slider del
  reproductor se actualiza mientras suena): pausa la reproducción y reintenta.


## Gotchas (léelos antes de tocar código)

1. **`expo-media-library`**: los métodos legacy (`getAssetsAsync`, `getPermissionsAsync`,
   `requestPermissionsAsync`, `SortBy`, `MediaType`) **solo existen vía el subpath
   `expo-media-library/legacy`**. Importarlos desde el paquete raíz **lanza excepción en runtime**
   (ver `node_modules/expo-media-library/src/legacyWarnings.ts`). El paquete raíz exporta la
   **nueva** API basada en clases (`Query`, `Asset`, `Album`). Ver `src/hooks/useSongs.js`.
2. **Expo Go (Android) no puede leer la biblioteca multimedia del dispositivo**. La app solo
   funciona como build propio (APK/dev build). `src/utils/env.js` detecta Expo Go para mostrar un
   aviso; no intentes "arreglar" los permisos para que corra en Expo Go.
3. **`getAssetsAsync` filtra por `mediaType: MediaType.photo` por defecto**: hay que pasar
   `MediaType.audio` explícitamente, o la lista sale vacía.
4. **`expo-audio` en Android**: sin `player.setActiveForLockScreen(...)`, la reproducción en
   segundo plano muere a los ~3 min (límite del SO). Además los controles de pantalla de bloqueo
   requieren `interruptionMode: 'doNotMix'` en `setAudioModeAsync`, si no el SO no asocia el
   servicio de medios con el player. `requestNotificationPermissionsAsync` es de `expo-audio`
   (no de `expo-notifications`) y solo existe en Android.
5. **Config nativa = `app.json`** (permisos y plugins `expo-audio`/`expo-media-library`). Cambiarla
   exige **recompilar** el APK; un reload de Metro no aplica nada. `versionCode` se ignora porque
   `eas.json` fija `appVersionSource: "remote"`.
6. **`adb install` puede fallar con `unauthorized`**: el dispositivo de prueba (Motorola, USB) pide
   aceptar el diálogo de depuración en el móvil. `adb devices -l` para comprobar.
7. **La biblioteca solo debe mostrar canciones**: `src/utils/songFilter.js` descarta las notas de
   voz, las grabaciones y el audio de otras apps (WhatsApp, Telegram, grabadoras…) por extensión,
   ruta y nombre de archivo. `expo-media-library` **no** expone `IS_MUSIC` ni álbum/artista de
   MediaStore, así que no existe una forma "nativa" de saber si un archivo es música: no la
   busques ni la implementes a mano, usa el filtro. `useSongs.js` devuelve además `hidden`
   (cuántos audios se descartaron y por qué) y la biblioteca lo muestra bajo el título.
8. **Insets y `position: 'absolute'`**: la app es edge-to-edge; el `SafeAreaView` de las pantallas
   pone `paddingBottom` con el inset de la barra de navegación, pero **Yoga ignora ese padding
   para los hijos absolutos**. Cualquier barra flotante (p. ej. `MiniPlayer`) debe sumar a mano
   `useSafeAreaInsets().bottom` a su `bottom`, si no sus botones quedan bajo los del sistema.
9. **`adb install` puede fallar con `INSTALL_FAILED_VERIFICATION_FAILURE`**: Play Protect bloquea
   las instalaciones por USB si "Verificar apps por USB" está activo. Se arregla con
   `adb shell settings put global verifier_verify_adb_installs 0` y
   `adb shell settings put global package_verifier_enable 0` (es un ajuste de seguridad del móvil
   del usuario: avisa y offerte volver a activarlo).
10. **Los iconos son un artefacto generado**: `assets/*.png` los produce `scripts/generate-logo.py`
    (Pillow). No los edites a mano ni los sustituyas por un diseño hecho a mano: edita el script y
    vuelve a generarlos. La paleta sale de `src/theme/index.js`.
11. **`docs/*.png` son capturas reales** de la app (las genera `adb exec-out screencap`), no
    mockups: si cambias la UI, actualízalas para que el README no mienta.

## Arquitectura

- `index.js` → `App.js`: **no hay librería de navegación**; `App.js` alterna dos pantallas con
  `useState` (`'library'` ↔ `'player'`).
- `src/context/PlayerContext.js` es el corazón: **un único `useAudioPlayer` global** + cola
  implementada a mano (`queue` + `currentIndex`). Todo audio pasa por `playSong()` — es donde viven
  permisos de notificación, metadata de lock screen y el auto-avance (`status.didJustFinish`).
  Un player por pantalla rompería la reproducción en segundo plano y los controles del SO.
- `src/hooks/useSongs.js` — carga la biblioteca (legacy API, tope de 1000 assets, orden por fecha)
  y aplica el filtro de canciones de `src/utils/songFilter.js`.
- `src/utils/songFilter.js` — reglas puras de JS (extensión, ruta, nombre) que decide qué assets
  son canciones. Las listas (`VOICE_ONLY_EXTENSIONS`, `NON_MUSIC_APP_PACKAGES`, `MUSIC_APP_PACKAGES`,
  `NON_MUSIC_FOLDERS`) son el único sitio donde tocar para cambiar el criterio.
- `src/screens/*` + `src/components/*` — UI; tokens de color/espaciado en `src/theme/index.js`
  (tema oscuro, `primary` `#8B5CF6`). No uses colores hardcodeados fuera del tema.
- `scripts/generate-logo.py` — generador de los iconos (`assets/*.png`). Es la única fuente de
  verdad del logo; la paleta viene de `src/theme/index.js`.
- `docs/*.png` — capturas reales de la app que ilustran el `README.md`.
- Pendiente real (ver `ESTADO.md`): no se leen tags ID3/MediaStore, así que `artist` es
  `'Desconocido'` y la portada es un placeholder en `AlbumArt.js`.
