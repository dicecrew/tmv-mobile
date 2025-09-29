import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
import { utcObjectToLocal, localObjectToUtc } from '../utils/dateUtils';

// Configuración base del cliente
const baseURL = process.env.EXPO_PUBLIC_API_URL || 'https://api.themoneyvice.com';

// Crear instancia de axios
const axiosInstance = axios.create({
  baseURL,
  timeout: 10000,
});

// Interceptor para agregar token de autenticación
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('jwt_token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Excluir endpoints de autenticación, throws y bet range de la conversión de fechas
    const excludedEndpoints = ['/api/Auth/login', '/api/Auth/refresh', '/api/Auth/validate', '/api/Throw', '/api/Bet/user/range', '/api/Bookie/validate-bets', '/api/Bookie/users-bets-history', '/api/IncomesLog/income-register', '/api/Bookie', '/api/Admin/register-winning-numbers'];
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
      originalRequest._retry = true;
      
      // Verificar si es un token mock
      const currentToken = await AsyncStorage.getItem('jwt_token');
      if (currentToken) {
        try {
          const decoded = JSON.parse(atob(currentToken.split('.')[1]));
          if (decoded.sub === 'mock-user-id') {
            return Promise.reject(error);
          }
        } catch (e) {
          // Error decodificando token para verificar si es mock
        }
      }
      
      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        
        if (refreshToken) {
          const response = await axios.post(`${baseURL}/api/Auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken } = response.data;
          
          if (accessToken) {
            await AsyncStorage.setItem('jwt_token', accessToken);
            
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            
            return axiosInstance(originalRequest);
          }
        }
      } catch (refreshError) {
        // Verificar si es un usuario mock antes de limpiar tokens
        const currentToken = await AsyncStorage.getItem('jwt_token');
        const isMockUser = currentToken && (
          currentToken.includes('mock-signature') || 
          currentToken.includes('mock-user-id')
        );
        
        if (isMockUser) {
          return Promise.reject(error);
        }
        
        // Si falla el refresh, limpiar tokens (en React Native no podemos redirigir automáticamente)
        await AsyncStorage.removeItem('jwt_token');
        await AsyncStorage.removeItem('refresh_token');
        // En React Native, manejaremos la redirección en el componente
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
  const excludedEndpoints = ['/api/Auth/login', '/api/Auth/refresh', '/api/Auth/validate', '/api/Throw', '/api/Bet/user-bet-play', '/api/Bet/user/range', '/api/IncomesLog/income-register', '/api/Bookie', '/api/Admin/register-winning-numbers'];
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

  return axiosInstance(finalConfig);
};

export default axiosInstance;
