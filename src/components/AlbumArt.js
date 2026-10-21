import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius } from '../theme';

/**
 * Portada de álbum placeholder (mientras no haya arte incrustado).
 * Dibuja un cuadrado redondeado con un icono de nota musical.
 */
export function AlbumArt({ size = 96 }) {
  return (
    <View
      style={[
        styles.art,
        { width: size, height: size, borderRadius: radius.lg * (size / 96) },
      ]}
    >
      <View style={[styles.dot, styles.dotA, { top: size * 0.18, left: size * 0.18, width: size * 0.34, height: size * 0.34, borderRadius: size * 0.17 }]} />
      <View style={[styles.dot, styles.dotB, { bottom: size * 0.16, right: size * 0.16, width: size * 0.42, height: size * 0.42, borderRadius: size * 0.21 }]} />
      <Ionicons name="musical-note" size={size * 0.4} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  art: {
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: {
    position: 'absolute',
    opacity: 0.5,
  },
  dotA: {
    backgroundColor: colors.primary,
    opacity: 0.55,
  },
  dotB: {
    backgroundColor: colors.primary,
    opacity: 0.35,
  },
});
