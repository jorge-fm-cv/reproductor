/**
 * Filtro de la biblioteca: decide qué archivos de audio del dispositivo
 * son "canciones" y cuáles se descartan (notas de voz, grabaciones, audio de apps).
 *
 * No se puede apoyarse en `IS_MUSIC` de MediaStore porque `expo-media-library`
 * no expone esa columna (tampoco álbum ni artista). Así que se filtra con las
 * tres señales que sí llegan a JavaScript:
 *
 *   1. EXTENSIÓN: `.opus`, `.amr`… son formatos que Android usa para notas de
 *      voz y grabaciones; nunca para música real.
 *   2. RUTA: si el archivo vive dentro de la carpeta de una app
 *      (`Android/media/<paquete>/`) o en una carpeta de chat / grabadora
 *      (WhatsApp, Telegram, Recordings…), no es música del usuario.
 *   3. NOMBRE: WhatsApp nombra sus notas de voz `PTT-<AAAAMMDD>-WA<0000>.opus`
 *      (PTT = push-to-talk), sus audios `AUD-<AAAAMMDD>-WA<0000>.mp3` y sus
 *      vídeos `VID-<AAAAMMDD>-WA<0000>.mp4`. Si el archivo llega a otra carpeta
 *      (p.ej. /Download) el nombre delata de dónde viene.
 *
 * Lo que no se descarta se considera canción.
 */

/** Formatos que Android usa solo para notas de voz / grabaciones. */
export const VOICE_ONLY_EXTENSIONS = ['opus', 'amr', 'awb', 'oga'];

/**
 * Paquetes de apps cuyo audio no es música del usuario (mensajería, redes
 * sociales, grabadoras). Todo lo que esté bajo `Android/media/<paquete>/`
 * queda fuera salvo que el paquete esté en `MUSIC_APP_PACKAGES`.
 */
export const NON_MUSIC_APP_PACKAGES = [
  'com.whatsapp',
  'com.whatsappw4b',
  'org.telegram.messenger',
  'com.instagram.android',
  'com.facebook.orca',
  'com.facebook.katana',
  'com.snapchat.android',
  'com.zhiliaoapp.musically',
  'com.ss.android.tt.creator',
  'com.twitter.android',
  'com.x.android',
  'com.discord',
  'com.skype.raider',
  'com.viber.voip',
  'jp.naver.line.android',
  'com.tencent.mm',
  'org.thoughtcrime.securesms',
  'com.google.android.apps.messaging',
  'com.android.mms',
  'com.motorola.audiorecorder',
  'com.android.voicerecorder',
  'com.google.android.voice',
  'com.samsung.android.voicerecorder',
];

/** Apps de streaming musical: su carpeta puede contener música de verdad. */
export const MUSIC_APP_PACKAGES = [
  'com.google.android.apps.youtube.music',
  'com.spotify.music',
  'com.amazon.mp3',
  'com.deezer.deezer',
  'com.tidal',
  'com.soundcloud.android',
  'com.google.android.music',
];

/**
 * Carpetas del almacenamiento compartido que guardan audio que no es música.
 * Se comparan en minúsculas y contra el nombre exacto de cada carpeta.
 */
export const NON_MUSIC_FOLDERS = [
  // Mensajería y redes: notas de voz y audios recibidos
  'whatsapp',
  'whatsapp business',
  'whatsapp audio',
  'telegram',
  'messenger',
  'instagram',
  'facebook',
  'snapchat',
  'tiktok',
  'signal',
  'discord',
  'skype',
  'viber',
  'line',
  'wechat',
  'imo',
  // Grabadoras, podcast y sonidos del sistema
  'recordings',
  'recording',
  'recorder',
  'voice memos',
  'voice recorder',
  'voicerecorder',
  'podcasts',
  'audiobooks',
  'alarms',
  'notifications',
];

/** Nombres legibles para los paquetes que filtramos (para los avisos). */
const APP_LABELS = {
  'com.whatsapp': 'WhatsApp',
  'com.whatsappw4b': 'WhatsApp Business',
  'org.telegram.messenger': 'Telegram',
  'com.instagram.android': 'Instagram',
  'com.facebook.orca': 'Messenger',
  'com.facebook.katana': 'Facebook',
  'com.snapchat.android': 'Snapchat',
  'com.zhiliaoapp.musically': 'TikTok',
  'com.ss.android.tt.creator': 'TikTok',
  'com.twitter.android': 'Twitter',
  'com.x.android': 'X',
  'com.discord': 'Discord',
  'com.skype.raider': 'Skype',
  'com.viber.voip': 'Viber',
  'jp.naver.line.android': 'LINE',
  'com.tencent.mm': 'WeChat',
  'org.thoughtcrime.securesms': 'Signal',
  'com.google.android.apps.messaging': 'Google Mensajes',
  'com.android.mms': 'Mensajes',
  'com.motorola.audiorecorder': 'Grabadora',
  'com.android.voicerecorder': 'Grabadora',
  'com.google.android.voice': 'Google Voice',
  'com.samsung.android.voicerecorder': 'Grabadora',
};

/** Patrón de nombres de WhatsApp: `PTT-20261021-WA0001.opus`, `AUD-…-WA0000.mp3`. */
const WHATSAPP_NAME_PATTERNS = [
  /^(PTT|AUD|VID)-\d{6,8}-WA\d+/i,
  /-WA\d{3,}(\.[^.]+)?$/i,
];

/**
 * Clasifica un asset de MediaStore.
 * @param {{filename?: string, uri?: string}} asset
 * @returns {{isSong: boolean, reason: string|null}} `reason` explica el descarte.
 */
export function classifyAudioFile(asset) {
  const path = pathFromUri(asset?.uri);
  const filename = asset?.filename || fileNameFromPath(path);
  const extension = extensionOf(filename);

  // 1. Formato de nota de voz / grabación
  if (VOICE_ONLY_EXTENSIONS.includes(extension)) {
    return { isSong: false, reason: `notas de voz (.${extension})` };
  }

  // 2. Carpeta de una app: Android/media/<paquete>/
  //    Las apps de chat/grabadora están siempre fuera; el resto de carpetas de
  //    app también, salvo las de streaming musical (allowlist).
  const appPackage = appPackageFromPath(path);
  if (
    appPackage &&
    (NON_MUSIC_APP_PACKAGES.includes(appPackage) || !MUSIC_APP_PACKAGES.includes(appPackage))
  ) {
    const label = APP_LABELS[appPackage] ?? appPackage;
    return { isSong: false, reason: label };
  }

  // 3. Carpeta de chat / grabadora en cualquier nivel
  const folder = blockedFolderFromPath(path);
  if (folder) {
    return { isSong: false, reason: capitalize(folder) };
  }

  // 4. Nombre con el patrón de WhatsApp (aunque esté fuera de su carpeta)
  if (isWhatsAppFileName(filename)) {
    return { isSong: false, reason: 'WhatsApp' };
  }

  return { isSong: true, reason: null };
}

/**
 * Filtra una lista de assets y separa las canciones de los descartes.
 * @param {Array<{filename?: string, uri?: string}>} assets
 * @returns {{songs: Array, hiddenCount: number, hiddenReasons: Array<{label: string, count: number}>}}
 */
export function filterSongAssets(assets) {
  const songs = [];
  const reasonCounts = new Map();

  for (const asset of assets ?? []) {
    const { isSong, reason } = classifyAudioFile(asset);
    if (isSong) {
      songs.push(asset);
    } else {
      reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
    }
  }

  const hiddenReasons = [...reasonCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  return {
    songs,
    hiddenCount: (assets?.length ?? 0) - songs.length,
    hiddenReasons,
  };
}

/** Convierte `file:///sdcard/Music/cancion.mp3` en `/sdcard/Music/cancion.mp3`. */
function pathFromUri(uri) {
  if (!uri) return '';
  const raw = String(uri).replace(/^file:\/\//, '');
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function fileNameFromPath(path) {
  const parts = String(path).split('/');
  return parts[parts.length - 1] ?? '';
}

function extensionOf(filename) {
  const match = /\.([a-z0-9]+)$/i.exec(filename ?? '');
  return match ? match[1].toLowerCase() : '';
}

/** Devuelve el paquete de la app si la ruta es `…/Android/media/<paquete>/…`. */
function appPackageFromPath(path) {
  const match = /\/Android\/media\/([^/]+)\//i.exec(path);
  return match ? match[1].toLowerCase() : null;
}

/** Devuelve el nombre de la primera carpeta bloqueada que aparece en la ruta. */
function blockedFolderFromPath(path) {
  const segments = String(path)
    .split('/')
    .filter(Boolean)
    .slice(0, -1) // el último segmento es el nombre del archivo
    .map((segment) => segment.toLowerCase());

  return segments.find((segment) => NON_MUSIC_FOLDERS.includes(segment)) ?? null;
}

function isWhatsAppFileName(filename) {
  const name = filename ?? '';
  return WHATSAPP_NAME_PATTERNS.some((pattern) => pattern.test(name));
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
