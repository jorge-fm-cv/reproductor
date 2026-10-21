import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';

import { AlbumArt } from '../components/AlbumArt';
import { PlayerControls } from '../components/PlayerControls';
import { usePlayer } from '../context/PlayerContext';
import { colors, fontSizes, radius, spacing } from '../theme';
import { formatTime } from '../utils/format';

/**
 * Reproductor a pantalla completa: portada, info de la canción,
 * barra de progreso y controles.
 */
export function PlayerScreen({ onBack }) {
  const { status, currentSong, seekTo, error } = usePlayer();
  const [dragValue, setDragValue] = useState(null);

  if (!currentSong) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No hay ninguna canción seleccionada.</Text>
          <Pressable onPress={onBack} style={styles.backEmpty} hitSlop={12}>
            <Ionicons name="arrow-back" size={26} color={colors.text} />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const duration = status.duration > 0 ? status.duration : currentSong.duration;
  const displayedTime = dragValue ?? status.currentTime;

  const onSlidingComplete = (value) => {
    seekTo(value);
    setDragValue(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn} accessibilityRole="button">
          <Ionicons name="chevron-down" size={28} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Reproduciendo</Text>
        <View style={styles.topSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.artWrapper}>
          <AlbumArt size={Math.min(320, 280)} />
        </View>

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {currentSong.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentSong.artist}
          </Text>
        </View>

        <View style={styles.trackRow}>
          <Text style={styles.time}>{formatTime(displayedTime)}</Text>
          <Text style={styles.time}>{formatTime(duration)}</Text>
        </View>

        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration > 0 ? duration : 1}
          value={Math.min(displayedTime, duration || 1)}
          onValueChange={setDragValue}
          onSlidingComplete={onSlidingComplete}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
          disabled={duration === 0}
        />

        <PlayerControls size="lg" />

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    padding: spacing.xs,
  },
  topTitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  topSpacer: {
    width: 36,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  artWrapper: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  info: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: fontSizes.xl,
    fontWeight: '800',
    textAlign: 'center',
  },
  artist: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
    marginTop: spacing.xs,
  },
  trackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  time: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontVariant: ['tabular-nums'],
  },
  slider: {
    width: '100%',
    height: 40,
    marginVertical: spacing.xs,
  },
  error: {
    marginTop: spacing.md,
    color: colors.danger,
    textAlign: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
  },
  backEmpty: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
  },
});
