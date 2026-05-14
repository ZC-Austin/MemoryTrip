import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen }        from '../screens/HomeScreen';
import { TripDetailScreen }  from '../screens/TripDetailScreen';
import { PhotoGalleryScreen } from '../screens/PhotoGalleryScreen';
import type { HomeStackParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home"         component={HomeScreen} />
      <Stack.Screen name="TripDetail"   component={TripDetailScreen} />
      <Stack.Screen name="PhotoGallery" component={PhotoGalleryScreen} />
    </Stack.Navigator>
  );
}
