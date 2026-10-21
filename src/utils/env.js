import { Platform } from 'react-native';

/**
 * Detecta si la app corre dentro de Expo Go.
 * En Expo Go (Android) ya no se permite leer la biblioteca multimedia del
 * dispositivo, así que lo usamos para mostrar un mensaje claro.
 */
export const isExpoGo =
  Platform.OS !== 'web' &&
  typeof globalThis !== 'undefined' &&
  !!globalThis.expo &&
  !!globalThis.expo.modules &&
  !!globalThis.expo.modules.ExpoGo;
