import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { MiniPlayer } from '../components/MiniPlayer';
import { AlbumArt } from '../components/AlbumArt';
import { usePlayer } from '../context/PlayerContext';
import { useSongs } from '../hooks/useSongs';
import { colors, fontSizes, radius, spacing } from '../theme';
import { formatTime } from '../utils/format';
import { isExpoGo } from '../utils/env';

/**
 * Lista de canciones del dispositivo + mini reproductor flotante.
 */
export function LibraryScreen({ onOpenPlayer }) {
  const insets = useSafeAreaInsets();
  const { songs, loading, error, granted, requestAccess, hidden } = useSongs();
  const {
    playSong,
    currentSong,
    status,
    notifDenied,
    notifCanAskAgain,
    requestNotificationPermission,
    openNotificationSettings,
  } = usePlayer();

  const renderSong = ({ item }) => {
    const isCurrent = currentSong?.id === item.id;
    const isPlaying = isCurrent && status.playing;

    return (
      <Pressable
        onPress={() => playSong(item, songs)}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        accessibilityRole="button"
        accessibilityLabel={`Reproducir ${item.title}`}
      >
        <View style={styles.rowLeft}>
          {isCurrent ? (
            <Ionicons
              name={isPlaying ? 'volume-high' : 'pause'}
              size={18}
              color={colors.primary}
              style={styles.stateIcon}
            />
          ) : (
            <Text style={styles.index}>{item.index + 1}</Text>
          )}
          <View style={styles.rowText}>
            <Text
              style={[styles.rowTitle, isCurrent && styles.rowTitleCurrent]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text style={styles.rowArtist} numberOfLines={1}>
              {item.artist}
            </Text>
          </View>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.duration}>{formatTime(item.duration)}</Text>
          <Ionicons name="play-circle-outline" size={22} color={colors.textSecondary} />
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tu música</Text>
        <Text style={styles.headerSubtitle}>
          {songs.length > 0 ? `${songs.length} canciones` : 'Biblioteca del dispositivo'}
        </Text>
      </View>

      {hidden.count > 0 ? (
        <View style={styles.filterNote}>
          <Ionicons name="funnel-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.filterNoteText} numberOfLines={2}>
            {hidden.count} audios que no son canciones quedaron fuera
            {hidden.reasons.length > 0
              ? `: ${hidden.reasons
                  .slice(0, 3)
                  .map((r) => `${r.label} (${r.count})`)
                  .join(', ')}`
              : ''}
          </Text>
        </View>
      ) : null}

      {notifDenied ? (
        <View style={styles.notifBanner}>
          <Ionicons name="notifications-off-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.notifBannerText}>
            Habilita las notificaciones para ver los controles de reproducción en la barra de estado.
          </Text>
          <Pressable
            onPress={notifCanAskAgain ? requestNotificationPermission : openNotificationSettings}
            style={({ pressed }) => [styles.notifBannerBtn, pressed && styles.notifBannerBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Habilitar notificaciones"
          >
            <Text style={styles.notifBannerBtnText}>Habilitar</Text>
          </Pressable>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.centerText}>Buscando tu música…</Text>
        </View>
      ) : !granted ? (
        <View style={styles.center}>
          <Ionicons name="musical-notes" size={56} color={colors.textSecondary} />
          <Text style={styles.centerTitle}>Accede a tu música</Text>
          <Text style={styles.centerText}>
            Necesitamos permiso para leer los archivos de audio de tu dispositivo.
          </Text>
          {isExpoGo ? (
            <View style={styles.notice}>
              <Ionicons name="warning-outline" size={18} color={colors.danger} />
              <Text style={styles.noticeText}>
                Estás probando en Expo Go. En Android, Expo Go ya no permite leer la música del
                dispositivo: hay que instalar la app compilada (build propio).
              </Text>
            </View>
          ) : null}
          <Pressable
            onPress={requestAccess}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          >
            <Text style={styles.ctaText}>Permitir acceso</Text>
          </Pressable>
        </View>
      ) : songs.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={56} color={colors.textSecondary} />
          <Text style={styles.centerTitle}>Sin canciones</Text>
          <Text style={styles.centerText}>
            No encontramos audio en tu dispositivo. Agrega música y vuelve a intentarlo.
          </Text>
        </View>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) => item.id}
          renderItem={renderSong}
          contentContainerStyle={[styles.listContent, { paddingBottom: 96 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {error ? (
        <Text style={[styles.error, { bottom: 120 + insets.bottom }]}>{error}</Text>
      ) : null}

      <MiniPlayer onOpenPlayer={onOpenPlayer} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSizes.xxl,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    marginTop: 4,
  },
  filterNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  filterNoteText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    lineHeight: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  centerTitle: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  centerText: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  cta: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.full,
  },
  ctaPressed: {
    backgroundColor: colors.primaryPressed,
  },
  ctaText: {
    color: colors.text,
    fontWeight: '700',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    marginTop: spacing.sm,
  },
  noticeText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    lineHeight: 18,
  },
  notifBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  notifBannerText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    lineHeight: 16,
  },
  notifBannerBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  notifBannerBtnPressed: {
    backgroundColor: colors.primaryPressed,
  },
  notifBannerBtnText: {
    color: colors.text,
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 96,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.md,
  },
  rowPressed: {
    backgroundColor: colors.surface,
  },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stateIcon: {
    width: 24,
    textAlign: 'center',
  },
  index: {
    width: 24,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontVariant: ['tabular-nums'],
  },
  rowText: {
    flex: 1,
    marginLeft: spacing.sm + 4,
  },
  rowTitle: {
    color: colors.text,
    fontSize: fontSizes.md,
    fontWeight: '500',
  },
  rowTitleCurrent: {
    color: colors.primary,
  },
  rowArtist: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  duration: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontVariant: ['tabular-nums'],
  },
  error: {
    position: 'absolute',
    // El `bottom` real se calcula en el JSX (120 + inset inferior) para que el
    // aviso nunca quede bajo la barra de navegación ni bajo el mini reproductor.
    alignSelf: 'center',
    color: colors.danger,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
});
