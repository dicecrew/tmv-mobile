import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
import { utcObjectToLocal, localObjectToUtc } from '../utils/dateUtils';

// Variable para almacenar la función de logout
let logoutFunction: (() => void) | null = null;

// Función para registrar la función de logout
export const setLogoutFunction = (logout: () => void) => {
  logoutFunction = logout;
};

// Configuración base del cliente
const baseURL = process.env.EXPO_PUBLIC_API_URL || 'https://api.themoneyvice.com';

// Crear instancia de axios
const axiosInstance = axios.create({
  baseURL,
  timeout: 10000,
});

// Interceptor para agregar token de autenticación y loggear requests
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('jwt_token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 🌐 NETWORK LOGGING - REQUEST
    console.log('\n🔵 ===== NETWORK REQUEST =====');
    console.log(`📡 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    if (config.params) {
      console.log('📋 Query Params:', JSON.stringify(config.params, null, 2));
    }
    if (config.data) {
      console.log('📦 Request Body:', JSON.stringify(config.data, null, 2));
    }
    if (config.headers?.Authorization) {
      const authHeader = String(config.headers.Authorization);
      console.log('🔑 Auth:', authHeader.substring(0, 20) + '...');
    }
    console.log('⏱️  Timestamp:', new Date().toISOString());
    console.log('===============================\n');
    
    return config;
  },
  (error: AxiosError) => {
    console.log('\n🔴 ===== NETWORK REQUEST ERROR =====');
    console.log('❌ Error:', error.message);
    console.log('====================================\n');
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // 🌐 NETWORK LOGGING - RESPONSE
    console.log('\n🟢 ===== NETWORK RESPONSE =====');
    console.log(`📡 ${response.config.method?.toUpperCase()} ${response.config.url}`);
    console.log(`✅ Status: ${response.status} ${response.statusText}`);
    console.log('📦 Response Data:', JSON.stringify(response.data, null, 2).substring(0, 500));
    if (JSON.stringify(response.data).length > 500) {
      console.log('... (response truncated, too long)');
    }
    console.log('⏱️  Timestamp:', new Date().toISOString());
    console.log('===============================\n');
    
    // Excluir endpoints de autenticación, throws y bet range de la conversión de fechas
    const excludedEndpoints = [
      '/api/Auth/login', 
      '/api/Auth/refresh', 
      '/api/Auth/validate', 
      '/api/Throw', 
      '/api/Bet/user/range', 
      '/api/Bookie/validate-bets', 
      '/api/Bookie/users-bets-history', 
      '/api/IncomesLog/income-register',
      '/api/IncomesLog/date-range',
      '/api/Bookie', 
      '/api/Admin/register-winning-numbers',
      '/api/Admin/betresume-summary',
      '/api/Admin/incomes-history',
      '/api/Admin/bets-statistics'
    ];
    const isExcludedEndpoint = excludedEndpoints.some(endpoint => 
      response.config.url?.includes(endpoint)
    );
    
    // Convertir fechas UTC a hora local en la respuesta (excepto en endpoints excluidos)
    if (response.data && !isExcludedEndpoint) {
      response.data = utcObjectToLocal(response.data);
    }
    
    return response;
  },
  async (error: AxiosError) => {
    // 🌐 NETWORK LOGGING - ERROR
    console.log('\n🔴 ===== NETWORK ERROR =====');
    console.log(`📡 ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    console.log(`❌ Error: ${error.message}`);
    if (error.response) {
      console.log(`💥 Status: ${error.response.status} ${error.response.statusText}`);
      console.log('📦 Error Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('📡 No response received from server');
    }
    console.log('⏱️  Timestamp:', new Date().toISOString());
    console.log('============================\n');
    
    // Manejar errores de red
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      // Para errores de red, verificar si ya tenemos un token mock
      const currentToken = await AsyncStorage.getItem('jwt_token');
      if (currentToken) {
        try {
          const decoded = JSON.parse(atob(currentToken.split('.')[1]));
          if (decoded.sub === 'mock-user-id') {
            return Promise.reject(error);
          }
        } catch (e) {
          // Error decodificando token existente
        }
      }
      
      // Si no hay token mock y hay error de red, no redirigir al login
      return Promise.reject(error);
    }
    
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('🔄 Intentando refrescar token debido a error 401...');
      originalRequest._retry = true;
      
      // Verificar si es un token mock
      const currentToken = await AsyncStorage.getItem('jwt_token');
      if (currentToken) {
        try {
          const decoded = JSON.parse(atob(currentToken.split('.')[1]));
          console.log('🔍 Token decodificado:', {
            sub: decoded.sub,
            role: decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
            exp: decoded.exp,
            expDate: new Date(decoded.exp * 1000).toLocaleString()
          });
          
          if (decoded.sub === 'mock-user-id') {
            console.log('⚠️  Usuario mock detectado, no se intenta refresh');
            return Promise.reject(error);
          }
        } catch (e) {
          console.error('❌ Error decodificando token:', e);
        }
      }
      
      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        
        if (refreshToken) {
          console.log('🔄 Refresh token encontrado, intentando renovar...');
          const response = await axios.post(`${baseURL}/api/Auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken } = response.data;
          
          if (accessToken) {
            console.log('✅ Token renovado exitosamente');
            await AsyncStorage.setItem('jwt_token', accessToken);
            
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            
            console.log('🔄 Reintentando petición original...');
            return axiosInstance(originalRequest);
          }
        } else {
          console.log('⚠️  No hay refresh token disponible');
        }
      } catch (refreshError) {
        console.error('❌ Error al refrescar token:', refreshError);
        // Verificar si es un usuario mock antes de limpiar tokens
        const currentToken = await AsyncStorage.getItem('jwt_token');
        const isMockUser = currentToken && (
          currentToken.includes('mock-signature') || 
          currentToken.includes('mock-user-id')
        );
        
        if (isMockUser) {
          return Promise.reject(error);
        }
        
        // Si falla el refresh, limpiar tokens y desloguear
        await AsyncStorage.removeItem('jwt_token');
        await AsyncStorage.removeItem('refresh_token');
        
        // Llamar a la función de logout para desloguear y redirigir al login
        if (logoutFunction) {
          logoutFunction();
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Función personalizada para mutaciones con cancelación
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: { signal?: AbortSignal }
): Promise<T> => {
  const finalConfig = {
    ...config,
    signal: options?.signal,
  };

  // Excluir endpoints de autenticación, throws y apuestas de la conversión de fechas
  const excludedEndpoints = [
    '/api/Auth/login', 
    '/api/Auth/refresh', 
    '/api/Auth/validate', 
    '/api/Throw', 
    '/api/Bet/user-bet-play', 
    '/api/Bet/user/range', 
    '/api/IncomesLog/income-register',
    '/api/IncomesLog/date-range',
    '/api/Bookie', 
    '/api/Admin/register-winning-numbers',
    '/api/Admin/betresume-summary',
    '/api/Admin/incomes-history',
    '/api/Admin/bets-statistics'
  ];
  const isExcludedEndpoint = excludedEndpoints.some(endpoint => 
    finalConfig.url?.includes(endpoint)
  );

  // Si hay datos y es un método POST/PUT/PATCH, convertir fechas de hora local a UTC (excepto en endpoints excluidos)
  if (finalConfig.data && ['post', 'put', 'patch'].includes(finalConfig.method?.toLowerCase() || '') && !isExcludedEndpoint) {
    finalConfig.data = localObjectToUtc(finalConfig.data);
    
    finalConfig.headers = {
      ...finalConfig.headers,
      'Content-Type': 'application/json',
    };
  }

  // Asegurar que siempre se establezca Content-Type para requests con datos
  if (finalConfig.data && ['post', 'put', 'patch'].includes(finalConfig.method?.toLowerCase() || '')) {
    finalConfig.headers = {
      ...finalConfig.headers,
      'Content-Type': 'application/json',
    };
  }

  // Debug logging para requests problemáticos
  if (finalConfig.url?.includes('register-winning-numbers')) {
    console.log('🔍 Debug register-winning-numbers request:');
    console.log('URL:', finalConfig.url);
    console.log('Method:', finalConfig.method);
    console.log('Headers:', finalConfig.headers);
    console.log('Data:', finalConfig.data);
    console.log('Data type:', typeof finalConfig.data);
    console.log('Data stringified:', JSON.stringify(finalConfig.data));
  }

  // Debug logging para throws active-for-time
  if (finalConfig.url?.includes('active-for-time')) {
    console.log('🔍 Debug active-for-time request:');
    console.log('URL completa:', finalConfig.url);
    console.log('Method:', finalConfig.method);
    console.log('Params:', finalConfig.params);
    console.log('Headers:', finalConfig.headers);
    console.log('Base URL:', baseURL);
  }

  // Debug logging para user-bet-play
  if (finalConfig.url?.includes('user-bet-play')) {
    console.log('🔍 Debug user-bet-play request:');
    console.log('URL completa:', finalConfig.url);
    console.log('Method:', finalConfig.method);
    console.log('Data:', finalConfig.data);
    console.log('Data type:', typeof finalConfig.data);
    console.log('Data stringified:', JSON.stringify(finalConfig.data));
    console.log('Headers:', finalConfig.headers);
    console.log('Base URL:', baseURL);
  }

  return axiosInstance(finalConfig);
};

export default axiosInstance;
