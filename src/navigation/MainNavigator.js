import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@constants/index';

// Screens
import HomeScreen from '@screens/home/HomeScreen';
import SearchScreen from '@screens/home/SearchScreen';
import ServicesScreen from '@screens/services/ServicesScreen';
import ServiceDetailScreen from '@screens/services/ServiceDetailScreen';
import ProviderProfileScreen from '@screens/services/ProviderProfileScreen';
import PropertyScreen from '@screens/property/PropertyScreen';
import PropertyDetailScreen from '@screens/property/PropertyDetailScreen';
import JobsScreen from '@screens/jobs/JobsScreen';
import JobDetailScreen from '@screens/jobs/JobDetailScreen';
import CarsScreen from '@screens/cars/CarsScreen';
import CarDetailScreen from '@screens/cars/CarDetailScreen';
import ProfileScreen from '@screens/profile/ProfileScreen';
import EditProfileScreen from '@screens/profile/EditProfileScreen';
import MyServicesScreen from '@screens/services/MyServicesScreen';
import MyPropertiesScreen from '@screens/property/MyPropertiesScreen';
import MyCarsScreen from '@screens/cars/MyCarsScreen';
import MyJobsScreen from '@screens/jobs/MyJobsScreen';
import MyBookingsScreen from '@screens/profile/MyBookingsScreen';
import MyApplicationsScreen from '@screens/profile/MyApplicationsScreen';
import SavedItemsScreen from '@screens/profile/SavedItemsScreen';
import ChangePasswordScreen from '@screens/profile/ChangePasswordScreen';
import NotificationsScreen from '@screens/profile/NotificationsScreen';
import SupportScreen from '@screens/profile/SupportScreen';
import AboutScreen from '@screens/profile/AboutScreen';
import MarketScreen from '@screens/markets/MarketScreen';
import PhonesScreen from '@screens/markets/PhonesScreen';
import PrivacyPolicyScreen from '@screens/legal/PrivacyPolicyScreen';
import TermsOfServiceScreen from '@screens/legal/TermsOfServiceScreen';

import PostServiceScreen from '@screens/services/PostServiceScreen';
import PostPropertyScreen from '@screens/property/PostPropertyScreen';
import PostJobScreen from '@screens/jobs/PostJobScreen';
import PostCarScreen from '@screens/cars/PostCarScreen';

import EditCarScreen from '@screens/cars/EditCarScreen';
import EditServiceScreen from '@screens/services/EditServiceScreen';
import EditJobScreen from '@screens/jobs/EditJobScreen';
import EditPropertyScreen from '@screens/property/EditPropertyScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="MarketMain" component={MarketScreen} />
      <Stack.Screen name="PropertyMain" component={PropertyScreen} />
      <Stack.Screen name='PhonesMain' component={PhonesScreen} />
      <Stack.Screen name="JobsMain" component={JobsScreen} />
      <Stack.Screen name="CarsMain" component={CarsScreen} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} />
      <Stack.Screen name="CarDetail" component={CarDetailScreen} />
      <Stack.Screen name="ProviderProfile" component={ProviderProfileScreen} />
      <Stack.Screen name="PostService" component={PostServiceScreen} />
      <Stack.Screen name="PostProperty" component={PostPropertyScreen} />
      <Stack.Screen name="PostJob" component={PostJobScreen} />
      <Stack.Screen name="PostCar" component={PostCarScreen} />
      <Stack.Screen name="EditService" component={EditServiceScreen} />
      <Stack.Screen name="EditProperty" component={EditPropertyScreen} />
      <Stack.Screen name="EditJob" component={EditJobScreen} />
      <Stack.Screen name="EditCar" component={EditCarScreen} />
      <Stack.Screen name='Notifications' component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

function ServicesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ServicesMain" component={ServicesScreen} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
      <Stack.Screen name="ProviderProfile" component={ProviderProfileScreen} />
      <Stack.Screen name="EditService" component={EditServiceScreen} />
    </Stack.Navigator>
  );
}

function PropertyStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PropertyMain" component={PropertyScreen} />
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
      <Stack.Screen name="EditProperty" component={EditPropertyScreen} />
    </Stack.Navigator>
  );
}

function JobsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="JobsMain" component={JobsScreen} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} />
      <Stack.Screen name="EditJob" component={EditJobScreen} />
    </Stack.Navigator>
  );
}

function CarsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CarsMain" component={CarsScreen} />
      <Stack.Screen name="CarDetail" component={CarDetailScreen} />
      <Stack.Screen name="EditCar" component={EditCarScreen} />
    </Stack.Navigator>
  );
}

function MarketsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MarketMain" component={MarketScreen} />
      <Stack.Screen name='PropertyMain' component={PropertyScreen} />
      <Stack.Screen name='PropertyDetail' component={PropertyDetailScreen} />
      <Stack.Screen name='CarsMain' component={CarsScreen} />
      <Stack.Screen name='CarDetail' component={CarDetailScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="MyServices" component={MyServicesScreen} />
      <Stack.Screen name="MyProperties" component={MyPropertiesScreen} />
      <Stack.Screen name="MyCars" component={MyCarsScreen} />
      <Stack.Screen name="MyJobs" component={MyJobsScreen} />
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
      <Stack.Screen name="MyApplications" component={MyApplicationsScreen} />
      <Stack.Screen name="SavedItems" component={SavedItemsScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
    </Stack.Navigator>
  );
}

// ── Custom Tab Bar ──
function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const isFab = route.name === 'Post';

        const onPress = () => {
          if (isFab) {
            Alert.alert(
              'What do you want to post?',
              '',
              [
                { text: 'Service', onPress: () => navigation.navigate('Home', { screen: 'PostService' }) },
                { text: 'Property', onPress: () => navigation.navigate('Home', { screen: 'PostProperty' }) },
                { text: 'Car', onPress: () => navigation.navigate('Home', { screen: 'PostCar' }) },
                { text: 'Job', onPress: () => navigation.navigate('Home', { screen: 'PostJob' }) },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
            return;
          }

          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (isFab) {
          return (
            <View key={route.key} style={styles.fabWrap}>
              <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.85}>
                <Ionicons name="add" size={28} color={COLORS.textOnGold} />
              </TouchableOpacity>
              <Text style={styles.fabLabel}>Post</Text>
            </View>
          );
        }

        const iconName = options.tabBarIcon?.({ focused: isFocused }) || 'home';

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={iconName}
              size={22}
              color={isFocused ? COLORS.primary : '#9ca3af'}
            />
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {options.tabBarLabel || route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (focused ? 'home' : 'home-outline'),
        }}
      />
      <Tab.Screen
        name="Markets"
        component={MarketsStack}
        options={{
          tabBarLabel: 'Markets',
          tabBarIcon: ({ focused }) => (focused ? 'storefront' : 'storefront-outline'),
        }}
      />
      <Tab.Screen name="Post" options={{ tabBarLabel: 'Post' }}>
        {() => null}
      </Tab.Screen>
      <Tab.Screen
        name="Alerts"
        component={JobsStack}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ focused }) => (focused ? 'notifications' : 'notifications-outline'),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (focused ? 'person' : 'person-outline'),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.borderMuted,
    paddingBottom: 6,
    paddingTop: 4,
    height: 62,
    alignItems: 'flex-end',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  fabWrap: {
    flex: 1,
    alignItems: 'center',
    marginTop: -22,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  fabLabel: {
    fontSize: 10,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginTop: 4,
  },
});