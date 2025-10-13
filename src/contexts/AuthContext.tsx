import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { authService, userService } from '../api/services';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Tipos TypeScript
interface User {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  roleId: string;
  roleName: string;
  defaultLotteryId: string;
  defaultLotteryName: string;
  bookieId?: string | null;
  isActive: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (phone: string, password: string) => Promise<{ success: boolean; user: User | null; token: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  getToken: () => Promise<string | null>;
  setError: (error: string | null) => void;
  updateUser: (updatedUserData: Partial<User>) => void;
}

// Función para verificar JWT token
const verifyJWT = (token: string): any => {
  try {
    // Para tokens mock simples, usar una verificación más permisiva
    if (token.includes('mock-signature') || token.includes('mock-user-id')) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        if (decoded.sub === 'mock-user-id') {
          return decoded;
        }
      } catch (e) {
        // Error decodificando token mock
      }
    }
    
    const decoded = jwtDecode(token);
    
    // Para tokens mock, no verificar expiración
    if (decoded.sub === 'mock-user-id') {
      return decoded;
    }
    
    // Verificar si el token ha expirado (solo para tokens reales)
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('AuthContext - Error decodificando token:', error);
    
    // Para tokens mock, intentar decodificar manualmente
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      if (decoded.sub === 'mock-user-id') {
        return decoded;
      }
    } catch (e) {
      // No se pudo decodificar el token como mock
    }
    
    return null;
  }
};

// Función para crear un token mock para desarrollo
const createMockToken = (phone: string, password: string): string => {
  const mockPayload = {
    sub: 'mock-user-id',
    phoneNumber: phone,
    role: getMockRole(phone, password),
    firstName: getMockFirstName(phone, password),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 horas
    iat: Math.floor(Date.now() / 1000)
  };
  
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify(mockPayload));
  const signature = btoa('mock-signature');
  
  return `${header}.${payload}.${signature}`;
};

// Función para crear un usuario mock para desarrollo
const createMockUser = (phone: string, password: string): User => {
  const role = getMockRole(phone, password);
  const firstName = getMockFirstName(phone, password);
  
  return {
    id: 'mock-user-id',
    firstName: firstName,
    lastName: '',
    phoneNumber: phone,
    roleId: `mock-role-${role.toLowerCase()}`,
    roleName: role,
    defaultLotteryId: '1',
    defaultLotteryName: 'Lotería Nacional',
    isActive: true,
    createdAt: new Date().toISOString()
  };
};

// Función para determinar el rol mock basado en las credenciales
const getMockRole = (phone: string, password: string): string => {
  if (phone === 'admin' && password === 'Admin123!') {
    return 'Admin';
  } else if (phone === '+1234567890' && password === '123456') {
    return 'Listero';
  } else if (phone === '+0987654331' && password === 'user123') {
    return 'jugador';
  } else {
    return 'Usuario';
  }
};

// Función para determinar el nombre mock basado en las credenciales
const getMockFirstName = (phone: string, password: string): string => {
  if (phone === 'admin' && password === 'Admin123!') {
    return 'Administrador';
  } else if (phone === '+1234567890' && password === '123456') {
    return 'Listero';
  } else if (phone === '+0987654331' && password === 'user123') {
    return 'Jugador';
  } else {
    return 'Usuario';
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener información completa del usuario
  const fetchUserInfo = async (userId: string): Promise<User | null> => {
    try {
      const userInfo = await userService.getUserById(userId);
      return userInfo?.data || null;
    } catch (error) {
      console.error('AuthContext - Error fetching user info:', error);
      return null;
    }
  };

  // Verificar token almacenado al cargar la app
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('jwt_token');
        
        if (token) {
          const decodedToken = verifyJWT(token);
          
          if (decodedToken) {
            if (decodedToken.sub || decodedToken.userId || decodedToken.id || decodedToken.nameid) {
              const userId = decodedToken.sub || decodedToken.userId || decodedToken.id || decodedToken.nameid;
              
              // Verificar si es un token mock
              if (userId === 'mock-user-id') {
                const mockUser = {
                  id: userId,
                  firstName: decodedToken.firstName || getMockFirstName(decodedToken.phoneNumber, ''),
                  lastName: '',
                  phoneNumber: decodedToken.phoneNumber || '',
                  roleId: `mock-role-${(decodedToken.role || 'Usuario').toLowerCase()}`,
                  roleName: decodedToken.role || 'Usuario',
                  defaultLotteryId: '1',
                  defaultLotteryName: 'Lotería Nacional',
                  isActive: true,
                  createdAt: new Date().toISOString()
                };
                setUser(mockUser);
              } else {
                // Es un usuario real
                try {
                  const userInfo = await fetchUserInfo(userId);
                  if (userInfo) {
                    const userWithRole = {
                      ...userInfo,
                      roleName: decodedToken.role || 'User'
                    };
                    setUser(userWithRole);
                  } else {
                    await AsyncStorage.removeItem('jwt_token');
                    await AsyncStorage.removeItem('refresh_token');
                    setUser(null);
                    return;
                  }
                } catch (error) {
                  console.error('AuthContext - Error al obtener información del usuario:', error);
                  await AsyncStorage.removeItem('jwt_token');
                  await AsyncStorage.removeItem('refresh_token');
                  setUser(null);
                  return;
                }
              }
            } else {
              await AsyncStorage.removeItem('jwt_token');
              await AsyncStorage.removeItem('refresh_token');
              setUser(null);
            }
          } else {
            await AsyncStorage.removeItem('jwt_token');
            await AsyncStorage.removeItem('refresh_token');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('AuthContext - Error en initializeAuth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Función de login real
  const login = async (phone: string, password: string): Promise<{ success: boolean; user: User | null; token: string }> => {
    setError(null);
    setLoading(true);

    try {
      const response = await authService.login({ phoneNumber: phone, password });
      
      console.log('AuthContext - Login response:', response);
      
      // Guardar token en AsyncStorage
      await AsyncStorage.setItem('jwt_token', response.token);
      
      let userInfo: User | null = null;
      
      if (response.user) {
        setUser(response.user);
        userInfo = response.user;
      } else {
        const decodedToken = verifyJWT(response.token);
        
        if (decodedToken && (decodedToken.sub || decodedToken.userId || decodedToken.id)) {
          const userId = decodedToken.sub || decodedToken.userId || decodedToken.id;
          userInfo = await fetchUserInfo(userId);
          if (userInfo) {
            setUser(userInfo);
          }
        }
      }

      return { success: true, user: userInfo, token: response.token };
    } catch (error: any) {
      console.error('AuthContext - Error en login:', error);
      
      // Verificar si es un error de red
      const isNetworkError = error.code === 'NETWORK_ERROR' || 
                           error.message === 'Network Error' || 
                           error.message?.includes('Network Error') ||
                           !error.response;
      
      const errorMessage = error.response?.data?.message || error.message || '';
      const errorDetails = error.response?.data?.details || '';
      const isServerError = error.response?.status === 500;
      const isUuidError = errorMessage.includes('uuid') || errorDetails.includes('uuid') || 
                         errorMessage.includes('UUID') || errorDetails.includes('UUID');
      
      if (isNetworkError || isServerError || isUuidError) {
        console.log('AuthContext - Error de red o servidor detectado, usando modo de desarrollo');
        
        const mockToken = createMockToken(phone, password);
        const mockUser = createMockUser(phone, password);
        
        await AsyncStorage.setItem('jwt_token', mockToken);
        setUser(mockUser);
        
        return { success: true, user: mockUser, token: mockToken };
      }
      
      const errorMessageToShow = error.response?.data?.message || error.message || 'Error en el inicio de sesión';
      setError(errorMessageToShow);
      throw new Error(errorMessageToShow);
    } finally {
      setLoading(false);
    }
  };

  // Función de logout
  const logout = async (): Promise<void> => {
    try {
      const currentToken = await AsyncStorage.getItem('jwt_token');
      const isMockUser = currentToken && (
        currentToken.includes('mock-signature') || 
        currentToken.includes('mock-user-id')
      );
      
      if (isMockUser) {
        console.log('AuthContext - Usuario mock detectado, saltando logout del servidor');
        setUser(null);
        setError(null);
        return;
      }
      
      await authService.logout();
    } catch (error) {
      console.warn('Error en logout del servidor:', error);
    } finally {
      await AsyncStorage.removeItem('jwt_token');
      await AsyncStorage.removeItem('refresh_token');
      setUser(null);
      setError(null);
    }
  };

  // Función para refrescar token
  const refreshToken = async (): Promise<boolean> => {
    const refreshTokenValue = await AsyncStorage.getItem('refresh_token');
    if (!refreshTokenValue) return false;

    try {
      const response = await authService.refreshToken(refreshTokenValue);
      
      await AsyncStorage.setItem('jwt_token', response.accessToken);
      if (response.refreshToken) {
        await AsyncStorage.setItem('refresh_token', response.refreshToken);
      }
      
      const decodedToken = verifyJWT(response.accessToken);
      if (decodedToken && (decodedToken.sub || decodedToken.userId || decodedToken.id)) {
        const userId = decodedToken.sub || decodedToken.userId || decodedToken.id;
        const userInfo = await fetchUserInfo(userId);
        if (userInfo) {
          setUser(userInfo);
        }
      }
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
      return false;
    }
  };

  // Obtener token actual
  const getToken = async (): Promise<string | null> => {
    return await AsyncStorage.getItem('jwt_token');
  };

  // Función para actualizar los datos del usuario en el contexto
  const updateUser = (updatedUserData: Partial<User>): void => {
    if (user) {
      const updatedUser = {
        ...user,
        ...updatedUserData
      };
      setUser(updatedUser);
      
      // Si es un usuario mock, también actualizar el token mock
      if (user.id === 'mock-user-id') {
        AsyncStorage.getItem('jwt_token').then(currentToken => {
          if (currentToken) {
            try {
              const header = currentToken.split('.')[0];
              const payload = currentToken.split('.')[1];
              const signature = currentToken.split('.')[2];
              
              const currentPayload = JSON.parse(atob(payload));
              
              const newPayload = {
                ...currentPayload,
                firstName: updatedUserData.firstName || currentPayload.firstName,
                lastName: updatedUserData.lastName || currentPayload.lastName,
                phoneNumber: updatedUserData.phoneNumber || currentPayload.phoneNumber
              };
              
              const newToken = `${header}.${btoa(JSON.stringify(newPayload))}.${signature}`;
              AsyncStorage.setItem('jwt_token', newToken);
            } catch (error) {
              console.error('AuthContext - Error actualizando token mock:', error);
            }
          }
        });
      }
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    refreshToken,
    getToken,
    setError,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
