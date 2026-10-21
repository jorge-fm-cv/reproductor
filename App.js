import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PlayerProvider } from './src/context/PlayerContext';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { PlayerScreen } from './src/screens/PlayerScreen';

export default function App() {
  const [screen, setScreen] = useState('library');

  return (
    <SafeAreaProvider>
      <PlayerProvider>
        <StatusBar style="light" />
        {screen === 'player' ? (
          <PlayerScreen onBack={() => setScreen('library')} />
        ) : (
          <LibraryScreen onOpenPlayer={() => setScreen('player')} />
        )}
      </PlayerProvider>
    </SafeAreaProvider>
  );
}
