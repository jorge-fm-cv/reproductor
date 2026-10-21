import { useCallback, useEffect, useState } from 'react';
import * as MediaLibrary from 'expo-media-library/legacy';

import { titleFromFilename } from '../utils/format';

/**
 * Carga la lista de canciones de audio del dispositivo.
 *
 * Usamos la API "legacy" de expo-media-library porque el módulo nativo de la
 * API nueva (`ExpoMediaLibraryNext`) aún no está disponible en Expo Go.
 * La API legacy devuelve cada asset con su `uri` y `duration` (en segundos).
 *
 * IMPORTANTE: en Expo Go (Android) esta funcionalidad no está disponible
 * (Expo quitó los permisos de medios de su manifest). La app debe correr
 * como build propio (dev build / APK) para leer la música del dispositivo.
 */
export function useSongs() {
  const [permission, setPermission] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const granted = permission?.granted === true;

  const loadSongs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.audio,
        first: 1000,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });

      const mapped = assets.map((asset, index) => ({
        id: asset.id,
        uri: asset.uri,
        title: titleFromFilename(asset.filename),
        artist: 'Desconocido',
        duration: asset.duration ?? 0,
        index,
      }));

      setSongs(mapped);
    } catch (e) {
      console.warn('Error cargando canciones:', e);
      setError('No se pudo leer la música del dispositivo.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Consulta el estado del permiso al montar. Todo envuelto en try/catch
  // para evitar que un fallo nativo deje la app "congelada".
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await MediaLibrary.getPermissionsAsync(false, ['audio']);
        if (!cancelled) setPermission(res);
      } catch (e) {
        console.warn('getPermissionsAsync falló:', e);
        if (!cancelled) {
          setPermission({ granted: false, status: 'denied', canAskAgain: true });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Carga automáticamente cuando se concede el permiso
  useEffect(() => {
    if (granted && songs.length === 0) {
      loadSongs();
    }
  }, [granted, songs.length, loadSongs]);

  const requestAccess = useCallback(async () => {
    setError(null);
    try {
      const res = await MediaLibrary.requestPermissionsAsync(false, ['audio']);
      setPermission(res);
      if (res.granted) {
        loadSongs();
      }
    } catch (e) {
      console.warn('Error al pedir permiso:', e);
      setError('No fue posible pedir el permiso. Si estás en Expo Go, necesitamos compilar la app (build propio) para acceder a la música.');
    }
  }, [loadSongs]);

  return {
    songs,
    loading,
    error,
    granted,
    permissionStatus: permission?.status ?? null,
    requestAccess,
    reload: loadSongs,
  };
}
