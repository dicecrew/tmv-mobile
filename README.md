# TMV Mobile App

Aplicación móvil para TMV (The Money Vice) desarrollada con React Native + Expo.

## 🚀 Características

- **Autenticación JWT** con modo offline/mock para desarrollo
- **Diseño responsive** adaptado para móviles
- **Arquitectura por roles** (Admin, Listero, Jugador)
- **Estilos consistentes** con la aplicación web
- **Navegación fluida** entre pantallas
- **Integración completa** con la API existente

## 📱 Pantallas Implementadas

### ✅ Completadas
- **Login Screen**: Autenticación con credenciales de prueba
- **Dashboard Screen**: Panel principal adaptado por rol de usuario
- **Navegación**: Sistema de navegación básico

### 🔄 En Desarrollo
- Pantallas específicas por rol (Admin, Listero, Jugador)
- Componentes de apuestas y loterías
- Gestión de usuarios y configuraciones

## 🛠️ Tecnologías

- **React Native** + **Expo**
- **TypeScript**
- **Styled Components**
- **React Query** (TanStack Query)
- **React Navigation**
- **AsyncStorage** para persistencia
- **Axios** para API calls

## 🏃‍♂️ Instalación y Ejecución

### Prerrequisitos
- Node.js (v18 o superior)
- npm o yarn
- Expo CLI
- Expo Go app en tu dispositivo móvil

### Pasos de instalación

1. **Clonar e instalar dependencias:**
```bash
cd tmv-mobile
npm install
```

2. **Iniciar el servidor de desarrollo:**
```bash
npm start
```

3. **Ejecutar en dispositivo:**
- Escanea el código QR con Expo Go (iOS/Android)
- O ejecuta en simulador: `npm run ios` / `npm run android`

## 🔐 Credenciales de Prueba

La aplicación incluye credenciales mock para desarrollo:

| Rol | Teléfono/Usuario | Contraseña |
|-----|------------------|------------|
| **Listero** | +56984593684 | 871131 |
| **Admin** | admin | Admin123! |
| **Usuario** | +56968571473 | 871131 |

## 🎨 Diseño

### Paleta de Colores
- **Dorado Principal**: `#D4AF37`
- **Rojo Secundario**: `#B00000`
- **Fondo Oscuro**: `#1A1A1A`
- **Texto Claro**: `#E0E0E0`
- **Gris Sutil**: `#A0A0A0`

### Características del Diseño
- **Tema oscuro** consistente con la aplicación web
- **Componentes styled** con TypeScript
- **Animaciones suaves** y transiciones
- **Responsive design** para diferentes tamaños de pantalla

## 📁 Estructura del Proyecto

```
src/
├── api/                 # Cliente API y servicios
│   ├── client.ts       # Configuración de Axios
│   └── services.ts     # Servicios de API
├── contexts/           # Contextos de React
│   └── AuthContext.tsx # Contexto de autenticación
├── navigation/         # Configuración de navegación
│   └── AppNavigator.tsx
├── screens/           # Pantallas de la aplicación
│   ├── LoginScreen.tsx
│   └── DashboardScreen.tsx
├── styles/            # Estilos globales
│   └── GlobalStyles.ts
└── utils/             # Utilidades (pendiente)
```

## 🔄 Migración desde Web

### ✅ Completado
- [x] Estructura base del proyecto
- [x] Autenticación JWT con AsyncStorage
- [x] Cliente API adaptado para React Native
- [x] Pantalla de login con estilos móviles
- [x] Dashboard básico con navegación por roles
- [x] Estilos globales y tema consistente

### 🔄 En Progreso
- [ ] Migración de componentes específicos por rol
- [ ] Pantallas de gestión de apuestas
- [ ] Componentes de loterías y lanzamientos
- [ ] Sistema de notificaciones

### 📋 Próximos Pasos
- [ ] Implementar pantallas de Admin
- [ ] Desarrollar funcionalidades de Listero
- [ ] Crear interfaz de Jugador
- [ ] Agregar sistema de notificaciones push
- [ ] Optimizar rendimiento y UX

## 🐛 Modo de Desarrollo

La aplicación incluye un **modo offline** que se activa automáticamente cuando:
- No hay conexión a internet
- El servidor API no está disponible
- Hay errores de UUID en el backend

En modo offline, la aplicación usa:
- **Tokens mock** para autenticación
- **Usuarios mock** con roles predefinidos
- **Datos de demostración** para todas las funcionalidades

## 📞 Soporte

Para reportar bugs o solicitar nuevas funcionalidades, contacta al equipo de desarrollo.

---

**Desarrollado con ❤️ para TMV**
