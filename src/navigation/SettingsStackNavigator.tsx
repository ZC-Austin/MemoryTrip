import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen }          from '../screens/SettingsScreen';
import { SettingsBackupScreen }    from '../screens/SettingsBackupScreen';
import { SettingsBackupListScreen } from '../screens/SettingsBackupListScreen';
import { SettingsRestoreScreen }   from '../screens/SettingsRestoreScreen';
import type { SettingsStackParamList } from './types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Settings"           component={SettingsScreen} />
      <Stack.Screen name="SettingsBackup"     component={SettingsBackupScreen} />
      <Stack.Screen name="SettingsBackupList" component={SettingsBackupListScreen} />
      <Stack.Screen name="SettingsRestore"    component={SettingsRestoreScreen} />
    </Stack.Navigator>
  );
}
