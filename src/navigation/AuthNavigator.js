import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SignupScreen from '@screens/auth/SignupScreen';
import LoginScreen from '@screens/auth/LoginScreen';
import OtpScreen from '@screens/auth/OtpScreen';
import PrivacyPolicyScreen from '@screens/legal/PrivacyPolicyScreen';
import TermsOfServiceScreen from '@screens/legal/TermsOfServiceScreen';

const Stack = createStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Login"
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
    </Stack.Navigator>
  );
}