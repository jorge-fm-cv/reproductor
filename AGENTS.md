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
```

No hay `test`, `lint` ni `typecheck`: un build/export limpio es toda la señal disponible.

Build en la nube (no hay build de Android local en uso; `eas` no está instalado, `npx` lo baja bajo demanda):

```sh
npx eas whoami
npx eas build -p android --profile preview --message "desc" --non-interactive --no-wait
npx eas build:list --platform android --limit 1 --json --non-interactive   # coge buildUrl
curl -sL "<buildUrl>" -o reproductor.apk
adb install -r reproductor.apk
adb shell am start -n com.jorgefrancisco.reproductor/.MainActivity
adb logcat -d | grep -i reproductor
```

Perfiles en `eas.json`: `development` (dev client) / `preview` (APK de prueba) / `production` (app-bundle).

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

## Arquitectura

- `index.js` → `App.js`: **no hay librería de navegación**; `App.js` alterna dos pantallas con
  `useState` (`'library'` ↔ `'player'`).
- `src/context/PlayerContext.js` es el corazón: **un único `useAudioPlayer` global** + cola
  implementada a mano (`queue` + `currentIndex`). Todo audio pasa por `playSong()` — es donde viven
  permisos de notificación, metadata de lock screen y el auto-avance (`status.didJustFinish`).
  Un player por pantalla rompería la reproducción en segundo plano y los controles del SO.
- `src/hooks/useSongs.js` — carga la biblioteca (legacy API, tope de 1000 assets, orden por fecha).
- `src/screens/*` + `src/components/*` — UI; tokens de color/espaciado en `src/theme/index.js`
  (tema oscuro, `primary` `#8B5CF6`). No uses colores hardcodeados fuera del tema.
- Pendiente real (ver `ESTADO.md`): no se leen tags ID3/MediaStore, así que `artist` es
  `'Desconocido'` y la portada es un placeholder en `AlbumArt.js`.
