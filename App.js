import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import GlobalSettingsScreen from './src/screens/GlobalSettingsScreen';
import DictionaryScreen from './src/screens/DictionaryScreen';
import ExamplesScreen from './src/screens/ExamplesScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Icons
import { BookIcon, ListIcon, StarIcon, GearIcon, HomeIcon } from './src/components/Icons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ホームに戻るためのダミーコンポーネント（実際には使用されない）
function GoHomeScreen() {
  return null;
}

function DictionaryTabNavigator({ navigation }) {
  const { theme, darkMode } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Dictionary"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: darkMode ? 'rgba(10,10,11,0.95)' : 'rgba(255,255,255,0.95)',
          borderTopColor: theme.border,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
          height: 60 + insets.bottom,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="GoHome"
        component={GoHomeScreen}
        options={{
          tabBarLabel: 'ホーム',
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            navigation.goBack();
          },
        }}
      />
      <Tab.Screen
        name="Dictionary"
        component={DictionaryScreen}
        options={{
          tabBarLabel: '辞書',
          tabBarIcon: ({ color, size }) => <BookIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Examples"
        component={ExamplesScreen}
        options={{
          tabBarLabel: '例文',
          tabBarIcon: ({ color, size }) => <ListIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarLabel: 'お気に入り',
          tabBarIcon: ({ color, size }) => <StarIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="DictionarySettings"
        component={SettingsScreen}
        options={{
          tabBarLabel: '設定',
          tabBarIcon: ({ color, size }) => <GearIcon color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { theme, currentDictionary } = useApp();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bg },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="GlobalSettings"
        component={GlobalSettingsScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="DictionaryTabs"
        component={DictionaryTabNavigator}
        options={{
          headerShown: true,
          headerTitle: currentDictionary?.name || '辞書',
          headerStyle: {
            backgroundColor: theme.bg,
          },
          headerTintColor: theme.text,
          headerShadowVisible: false,
          headerBackVisible: false,
          headerTitleAlign: 'left',
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { darkMode } = useApp();

  return (
    <NavigationContainer>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <AppNavigator />
    </NavigationContainer>
  );
}
