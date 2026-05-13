import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@stores/authStore';
import { createStackNavigator } from '@react-navigation/stack';
import { supabase } from '@lib/supabase';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import CameraScreen from '@screens/auth/CameraScreen';
import { COLORS } from '@constants/index';

const Root = createStackNavigator();

export default function AppNavigator() {
  const { session, loading, setSession } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <Root.Navigator screenOptions={{ headerShown: false }}>
      {!session ? (
        <Root.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <Root.Screen name="Main" component={MainNavigator} />
          <Root.Screen
            name="Camera"
            component={CameraScreen}
            options={{ presentation: 'modal' }}
          />
        </>
      )}
    </Root.Navigator>
  );
}