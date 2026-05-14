import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { HomeStackNavigator }     from './HomeStackNavigator';
import { TripStackNavigator }     from './TripStackNavigator';
import { SettingsStackNavigator } from './SettingsStackNavigator';
import { MapScreen }              from '../screens/MapScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { focused: IoniconsName; outline: IoniconsName }> = {
  TabHome:     { focused: 'home',     outline: 'home-outline' },
  TabTrips:    { focused: 'list',     outline: 'list-outline' },
  TabMap:      { focused: 'map',      outline: 'map-outline' },
  TabSettings: { focused: 'settings', outline: 'settings-outline' },
};

export function MainTabNavigator() {
  const { colors, fontSize } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor:  colors.border,
          borderTopWidth:  0.5,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          marginBottom: 2,
        },
        tabBarIcon: ({ color, focused, size }) => {
          const icons = TAB_ICONS[route.name];
          const name  = focused ? icons.focused : icons.outline;
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="TabHome"     component={HomeStackNavigator}     options={{ title: '홈' }} />
      <Tab.Screen name="TabTrips"    component={TripStackNavigator}     options={{ title: '목록' }} />
      <Tab.Screen name="TabMap"      component={MapScreen}              options={{ title: '지도' }} />
      <Tab.Screen name="TabSettings" component={SettingsStackNavigator} options={{ title: '설정' }} />
    </Tab.Navigator>
  );
}
