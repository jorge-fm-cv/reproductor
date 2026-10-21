/**
 * Formatea segundos a m:ss (p.ej. 245 -> "4:05").
 */
export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0:00';
  }
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Extrae un título "legible" a partir de un nombre de archivo,
 * quitando la extensión y normalizando guiones bajos.
 */
export function titleFromFilename(filename) {
  if (!filename) return 'Canción sin nombre';
  return filename.replace(/\.[^.]+$/, '').replace(/_/g, ' ').trim() || 'Canción sin nombre';
}
