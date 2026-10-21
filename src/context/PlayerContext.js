import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';
import {
  requestNotificationPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';

const PlayerContext = createContext(null);

/**
 * Proveedor global del reproductor.
 * Mantiene un único AudioPlayer a nivel de app, la cola de reproducción
 * y la canción actual. Expone controles: play, pausa, siguiente, anterior, seek.
 */
export function PlayerProvider({ children }) {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [error, setError] = useState(null);
  // Estado del permiso de notificaciones (Android): 'unknown' | 'granted' | 'denied'
  const [notifStatus, setNotifStatus] = useState('unknown');
  const [notifCanAskAgain, setNotifCanAskAgain] = useState(true);

  // Evita volver a mostrar el diálogo del sistema en cada canción de la misma sesión
  const notifAskedRef = useRef(false);

  // Configura la sesión de audio para reproducción en segundo plano
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(() => {});
  }, []);

  const currentSong = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  /**
   * Pide el permiso de notificaciones (POST_NOTIFICATIONS) para que los controles
   * de reproducción aparezcan en la barra de notificaciones y la pantalla de bloqueo.
   * En iOS no hace falta: se considera concedido.
   */
  const requestNotificationPermission = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setNotifStatus('granted');
      return true;
    }
    try {
      const res = await requestNotificationPermissionsAsync();
      setNotifStatus(res.granted ? 'granted' : 'denied');
      setNotifCanAskAgain(!!res.canAskAgain);
      return res.granted;
    } catch (e) {
      console.warn('No se pudo pedir el permiso de notificaciones:', e);
      setNotifStatus('denied');
      return false;
    }
  }, []);

  /** Abre los ajustes de la app para que el usuario habilite las notificaciones. */
  const openNotificationSettings = useCallback(() => {
    Linking.openSettings().catch(() => {});
  }, []);

  /**
   * Reproduce una canción. `songs` (opcional) pasa la nueva lista a usar
   * como cola; por defecto se reutiliza la cola actual.
   */
  const playSong = useCallback(
    async (song, songs) => {
      try {
        setError(null);
        const list = songs ?? queue;
        const idx = list.findIndex((s) => s.id === song.id);
        if (idx === -1) return;

        if (!song.uri) {
          setError('Esta canción no tiene un archivo accesible.');
          return;
        }

        // Android: pedir POST_NOTIFICATIONS antes de activar los controles de bloqueo
        if (!notifAskedRef.current) {
          notifAskedRef.current = true;
          await requestNotificationPermission();
        }

        setQueue(list);
        setCurrentIndex(idx);

        player.replace(song.uri);
        player.setActiveForLockScreen(true, {
          title: song.title,
          artist: song.artist,
        });
        player.play();
      } catch (e) {
        console.warn('Error al reproducir:', e);
        setError('No se pudo reproducir esta canción.');
      }
    },
    [player, queue, requestNotificationPermission]
  );

  const next = useCallback(() => {
    if (!queue.length) return;
    const idx = (currentIndex + 1) % queue.length;
    setCurrentIndex(idx);
    const song = queue[idx];
    playSong(song, queue);
  }, [queue, currentIndex, playSong]);

  const previous = useCallback(() => {
    if (!queue.length) return;
    const idx = (currentIndex - 1 + queue.length) % queue.length;
    setCurrentIndex(idx);
    const song = queue[idx];
    playSong(song, queue);
  }, [queue, currentIndex, playSong]);

  const togglePlay = useCallback(() => {
    if (!currentSong) return;
    if (status.playing) {
      player.pause();
    } else if (status.isLoaded) {
      player.play();
    } else {
      playSong(currentSong, queue);
    }
  }, [currentSong, status.playing, status.isLoaded, player, queue, playSong]);

  const seekTo = useCallback(
    (seconds) => {
      player.seekTo(seconds);
    },
    [player]
  );

  // Avanza automáticamente cuando una canción termina
  useEffect(() => {
    if (status.didJustFinish && queue.length > 1) {
      next();
    }
  }, [status.didJustFinish]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(
    () => ({
      player,
      status,
      queue,
      currentSong,
      currentIndex,
      error,
      notifStatus,
      notifDenied: notifStatus === 'denied',
      notifCanAskAgain,
      requestNotificationPermission,
      openNotificationSettings,
      playSong,
      next,
      previous,
      togglePlay,
      seekTo,
    }),
    [
      player,
      status,
      queue,
      currentSong,
      currentIndex,
      error,
      notifStatus,
      notifCanAskAgain,
      requestNotificationPermission,
      openNotificationSettings,
      playSong,
      next,
      previous,
      togglePlay,
      seekTo,
    ]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error('usePlayer debe usarse dentro de <PlayerProvider>.');
  }
  return ctx;
}
