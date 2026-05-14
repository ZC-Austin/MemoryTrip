import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '../../theme';

export function MapScreen() {
  const { colors, fontSize } = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.center}>
        <Text style={{ fontSize: 40 }}>🗺</Text>
        <Text style={{ color: colors.textTertiary, fontSize: fontSize.md, marginTop: 12 }}>
          지도 기능 준비 중
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
