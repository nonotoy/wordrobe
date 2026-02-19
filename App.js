import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, TouchableOpacity, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import GlobalSettingsScreen from './src/screens/GlobalSettingsScreen';
import DictionaryScreen from './src/screens/DictionaryScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LoadingScreen from './src/screens/LoadingScreen';

// Icons
import { HomeIconCustom, SearchAltIcon, StarIconCustom, SettingsIcon2 } from './src/components/Icons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ホームに戻るためのダミーコンポーネント（実際には使用されない）
function GoHomeScreen() {
  return null;
}

// カスタムタブラベルコンポーネント（改行可能）
function TabBarLabel({ focused, color, children }) {
  return (
    <Text
      style={{
        fontSize: 10,
        color,
        textAlign: 'center',
        marginTop: 2,
        width: 80,
        lineHeight: 14,
        height: 28,
      }}
      numberOfLines={2}
    >
      {children}
    </Text>
  );
}

// 背景色なしのカスタムタブボタン
function CustomTabBarButton(props) {
  return (
    <TouchableOpacity
      {...props}
      activeOpacity={0.7}
      style={[props.style, { backgroundColor: 'transparent' }]}
    />
  );
}

function DictionaryTabNavigator({ navigation }) {
  const { theme, darkMode, t } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Dictionary"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: darkMode ? 'rgba(10,10,11,0.95)' : 'rgba(255,255,255,0.95)',
          borderTopColor: theme.border,
          paddingTop: 8,
          paddingBottom: insets.bottom + 4,
          height: 72 + insets.bottom,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarPressColor: 'transparent',
        tabBarPressOpacity: 0,
        tabBarIconStyle: {
          marginTop: 6,
          marginBottom: 0,
        },
        tabBarItemStyle: {
          backgroundColor: 'transparent',
        },
      }}
    >
      <Tab.Screen
        name="GoHome"
        component={GoHomeScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <TabBarLabel focused={focused} color={color}>{t('home')}</TabBarLabel>
          ),
          tabBarIcon: ({ color }) => <HomeIconCustom color={color} size={22} />,
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
          tabBarLabel: ({ focused, color }) => (
            <TabBarLabel focused={focused} color={color}>{t('search')}</TabBarLabel>
          ),
          tabBarIcon: ({ color }) => <SearchAltIcon color={color} size={22} />,
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <TabBarLabel focused={focused} color={color}>{t('favorites')}</TabBarLabel>
          ),
          tabBarIcon: ({ color }) => <StarIconCustom color={color} size={22} />,
        }}
      />
      <Tab.Screen
        name="DictionarySettings"
        component={SettingsScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <TabBarLabel focused={focused} color={color}>{t('dictionarySettings')}</TabBarLabel>
          ),
          tabBarIcon: ({ color }) => <SettingsIcon2 color={color} size={22} />,
          tabBarButton: CustomTabBarButton,
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
  const { darkMode, isLoading } = useApp();

  if (isLoading) {
    return (
      <>
        <StatusBar style={darkMode ? 'light' : 'dark'} />
        <LoadingScreen />
      </>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <AppNavigator />
    </NavigationContainer>
  );
}
