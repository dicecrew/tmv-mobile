import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import { colors } from '../styles/GlobalStyles';

const Stack = createStackNavigator();

const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // Aquí podrías mostrar un loading screen
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colors.darkBackground },
        }}
      >
        {user ? (
          // Usuario autenticado
          <Stack.Screen 
            name="Dashboard" 
            component={DashboardScreen}
            options={{
              title: 'Dashboard',
            }}
          />
        ) : (
          // Usuario no autenticado
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{
              title: 'Iniciar Sesión',
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
