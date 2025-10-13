# TMV Mobile - Aplicación React Native con Expo

## 📱 Descripción

Aplicación móvil de **The Money Vice** adaptada de React Web a React Native con Expo. Sistema de gestión de apuestas y loterías con tres roles principales: Admin, Listero y Jugador.

## 🏗️ Estructura del Proyecto

```
tmv-mobile/
├── src/
│   ├── api/              # Configuración de API y servicios
│   │   ├── client.ts     # Cliente Axios configurado
│   │   └── services.ts   # Servicios de API
│   ├── assets/           # Imágenes y recursos
│   ├── components/       # Componentes organizados por rol
│   │   ├── admin/        # Componentes del dashboard Admin
│   │   ├── listero/      # Componentes del dashboard Listero
│   │   ├── jugador/      # Componentes del dashboard Jugador
│   │   └── common/       # Componentes comunes reutilizables
│   ├── contexts/         # Contextos de React
│   │   └── AuthContext.tsx  # Contexto de autenticación
│   ├── navigation/       # Configuración de navegación
│   ├── screens/          # Pantallas principales
│   │   ├── LoginScreen.tsx
│   │   └── DashboardScreen.tsx
│   ├── styles/           # Estilos globales
│   │   ├── colors.ts
│   │   └── GlobalStyles.ts
│   ├── types/            # Tipos TypeScript
│   └── utils/            # Utilidades
└── App.tsx               # Componente principal

```

## 🎨 Diseño y Estilos

- **Colores principales:**
  - Dorado: `#D4AF37`
  - Rojo: `#B00000`
  - Fondo oscuro: `#1A1A1A`

- **Estilos:** Usando `StyleSheet` nativo de React Native con LinearGradient para efectos visuales

## 👥 Roles y Funcionalidades

### 🔐 Admin / SuperAdmin
- Registrar ganadores
- Cerrar tiradas
- Ver movimientos
- Registrar recaudación
- Gestionar listeros
- Gestionar tiradas
- Reportes de recaudación
- (SuperAdmin) Gestionar administradores

### 📋 Listero (Bookie)
- Gestionar jugadores
- Realizar apuestas para jugadores
- Validación de apuestas
- Ver historial de apuestas

### 🎲 Jugador
- Registrar apuestas
- Ver mis apuestas
- Aprende a jugar

## 🚀 Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm start

# Ejecutar en Android
npm run android

# Ejecutar en iOS
npm run ios

# Ejecutar en web (para pruebas)
npm run web
```

## 🔐 Credenciales de Prueba (Modo Offline)

Si la API no está disponible, la aplicación funciona en modo de desarrollo con estas credenciales:

```
Admin:
- Usuario: admin
- Contraseña: Admin123!

Listero:
- Usuario: +1234567890
- Contraseña: 123456

Jugador:
- Usuario: +0987654331
- Contraseña: user123
```

## 📦 Dependencias Principales

- **React Native**: 0.81.4
- **Expo**: ~54.0.10
- **React Navigation**: ^7.1.17
- **@tanstack/react-query**: ^5.90.2
- **Axios**: ^1.12.2
- **AsyncStorage**: ^2.2.0
- **expo-linear-gradient**: ~15.0.7
- **react-native-toast-message**: ^2.2.2
- **jwt-decode**: ^4.0.0

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
EXPO_PUBLIC_API_URL=https://api.themoneyvice.com
```

## 📱 Estado Actual

### ✅ Completado

- ✅ Instalación de dependencias
- ✅ Adaptación de estilos globales
- ✅ AuthContext adaptado con AsyncStorage
- ✅ API client y services configurados
- ✅ LoginScreen completamente funcional
- ✅ DashboardScreen con navegación por roles
- ✅ Estructura de navegación con React Navigation
- ✅ Placeholders para todos los dashboards de roles

### 🚧 En Desarrollo / Próximos Pasos

Los dashboards de cada rol tienen la estructura base creada como **placeholders funcionales**. Para expandir cada funcionalidad:

1. **Admin**: Expandir los 8 componentes principales
2. **Listero**: Expandir los 6 componentes principales
3. **Jugador**: Expandir los 3 componentes principales

## 🎯 Próximos Pasos Recomendados

1. Expandir componentes de **Jugador** primero (los más usados)
2. Expandir componentes de **Listero** 
3. Expandir componentes de **Admin**
4. Agregar animaciones y transiciones
5. Implementar notificaciones push
6. Agregar soporte offline completo
7. Testing y optimización de rendimiento

## 📖 Guías de Desarrollo

### Crear un Nuevo Componente

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../styles/GlobalStyles';

const MiComponente: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Mi Componente</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.darkBackground,
  },
  text: {
    color: colors.lightText,
  },
});

export default MiComponente;
```

### Usar el AuthContext

```typescript
import { useAuth } from '../contexts/AuthContext';

const MiComponente = () => {
  const { user, login, logout } = useAuth();
  
  // ...
};
```

### Hacer Peticiones a la API

```typescript
import { userService } from '../api/services';

const obtenerUsuarios = async () => {
  try {
    const response = await userService.getUsers();
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## 🐛 Solución de Problemas

### Error de importación de imágenes

Asegúrate de tener el archivo `src/types/assets.d.ts`:

```typescript
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
```

### Error de AsyncStorage

```bash
npx expo install @react-native-async-storage/async-storage
```

### Problemas de caché

```bash
npm start -- --clear
```

## 📄 Licencia

Este proyecto es privado y confidencial.

## 👥 Equipo

Desarrollo: TMV Team

---

**Nota:** Este proyecto está en desarrollo activo. Los componentes de cada rol están creados como placeholders y están listos para ser expandidos con las funcionalidades completas del proyecto original.

