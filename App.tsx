import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ActivityIndicator, StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from './src/theme';
import { RootNavigator } from './src/navigation';
import { initDb } from './src/db';
import { startBackupWorker } from './src/services';

type BootState = 'loading' | 'ready' | 'error';

export default function App() {
  const [boot, setBoot] = useState<BootState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const stopWorker = useRef<(() => void) | null>(null);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        await initDb();
        if (!mounted) return;
        stopWorker.current = startBackupWorker();
        setBoot('ready');
      } catch (e) {
        if (!mounted) return;
        const msg = e instanceof Error ? e.message : String(e);
        setErrorMsg(msg);
        setBoot('error');
      }
    };

    bootstrap();

    return () => {
      mounted = false;
      stopWorker.current?.();
    };
  }, []);

  if (boot === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1D9E75" />
      </View>
    );
  }

  if (boot === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>앱을 시작할 수 없어요</Text>
        <Text style={styles.errorMsg}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBar style="auto" />
          <RootNavigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1 },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  errorTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  errorMsg:   { fontSize: 13, color: '#888', textAlign: 'center', paddingHorizontal: 32 },
});
