import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TripListScreen }    from '../screens/TripListScreen';
import { TripDetailScreen }  from '../screens/TripDetailScreen';
import { TripEditScreen }    from '../screens/TripEditScreen';
import { TripWrapUpScreen }  from '../screens/TripWrapUpScreen';
import { PhotoGalleryScreen } from '../screens/PhotoGalleryScreen';
import type { TripStackParamList } from './types';

const Stack = createNativeStackNavigator<TripStackParamList>();

export function TripStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TripList"     component={TripListScreen} />
      <Stack.Screen name="TripDetail"   component={TripDetailScreen} />
      <Stack.Screen name="TripEdit"     component={TripEditScreen} />
      <Stack.Screen name="TripWrapUp"   component={TripWrapUpScreen} />
      <Stack.Screen name="PhotoGallery" component={PhotoGalleryScreen} />
    </Stack.Navigator>
  );
}
