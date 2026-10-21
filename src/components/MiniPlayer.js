import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { usePlayer } from '../context/PlayerContext';
import { colors, radius, spacing } from '../theme';
import { AlbumArt } from './AlbumArt';

/**
 * Barra inferior flotante que muestra la canción en reproducción.
 * Tocar la barra abre el reproductor a pantalla completa.
 */
export function MiniPlayer({ onOpenPlayer }) {
  const { currentSong, status, togglePlay, next } = usePlayer();

  if (!currentSong) return null;

  const isPlaying = status.playing;

  return (
    <View style={styles.shadow}>
      <Pressable
        style={({ pressed }) => [styles.container, pressed && styles.pressed]}
        onPress={onOpenPlayer}
        accessibilityRole="button"
        accessibilityLabel="Abrir reproductor"
      >
        <AlbumArt size={44} />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {currentSong.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentSong.artist}
          </Text>
        </View>

        <Pressable
          onPress={(e) => {
            // Evita que el tap propague hacia "abrir reproductor"
            e.stopPropagation?.();
            togglePlay();
          }}
          hitSlop={10}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color={colors.text} />
        </Pressable>

        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            next();
          }}
          hitSlop={10}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Siguiente"
        >
          <Ionicons name="play-skip-forward" size={24} color={colors.text} />
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    borderRadius: radius.lg,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.surface,
  },
  info: {
    flex: 1,
    marginLeft: spacing.sm + 4,
    marginRight: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  artist: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  iconBtn: {
    padding: spacing.xs,
  },
});
