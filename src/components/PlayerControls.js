import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { usePlayer } from '../context/PlayerContext';
import { colors, spacing } from '../theme';

const ICON_SIZE = 32;

/**
 * Controles principales del reproductor: anterior, play/pausa y siguiente.
 */
export function PlayerControls({ size = 'md' }) {
  const { status, togglePlay, next, previous } = usePlayer();
  const isPlaying = status.playing;
  const big = size === 'lg';

  return (
    <View style={styles.row}>
      <Pressable
        onPress={previous}
        hitSlop={12}
        style={styles.sideBtn}
        accessibilityRole="button"
        accessibilityLabel="Canción anterior"
      >
        <Ionicons
          name="play-skip-back"
          size={big ? ICON_SIZE + 8 : ICON_SIZE}
          color={colors.text}
        />
      </Pressable>

      <Pressable
        onPress={togglePlay}
        style={({ pressed }) => [styles.playBtn, big && styles.playBtnBig, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pausar' : 'Reproducir'}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={big ? ICON_SIZE + 18 : ICON_SIZE + 8}
          color={colors.background}
        />
      </Pressable>

      <Pressable
        onPress={next}
        hitSlop={12}
        style={styles.sideBtn}
        accessibilityRole="button"
        accessibilityLabel="Siguiente canción"
      >
        <Ionicons
          name="play-skip-forward"
          size={big ? ICON_SIZE + 8 : ICON_SIZE}
          color={colors.text}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg + 8,
  },
  sideBtn: {
    padding: spacing.sm,
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  playBtnBig: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  pressed: {
    backgroundColor: colors.primaryPressed,
  },
});
