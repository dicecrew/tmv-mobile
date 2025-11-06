import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/contexts/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import Toast from 'react-native-toast-message';
import { PortalProvider } from './src/components/common/Portal';

// Configuración de React Query sin caché (igual que en el proyecto web)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 0, // Sin caché - siempre considera los datos como obsoletos
      gcTime: 0, // Sin caché - no mantiene datos en caché
    },
    mutations: {
      retry: 1,
    },
  },
});

const Stack = createStackNavigator();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PortalProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: '#1A1A1A' },
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
          </Stack.Navigator>
          <Toast />
        </NavigationContainer>
        </PortalProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
