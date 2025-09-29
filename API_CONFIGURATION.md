# Configuración de API - TMV Mobile

## ✅ Configuración Verificada y Sincronizada

La configuración de la API en la aplicación móvil está **completamente sincronizada** con la aplicación web.

### 🔗 **URL Base de la API**
- **Web**: `process.env.REACT_APP_API_URL || 'https://api.themoneyvice.com'`
- **Móvil**: `process.env.EXPO_PUBLIC_API_URL || 'https://api.themoneyvice.com'`

### 📁 **Archivos de Configuración**

#### Web (`tmv_front/`)
- `env.example` → `REACT_APP_API_URL=https://api.themoneyvice.com`
- `src/api/client.ts` → Cliente Axios configurado

#### Móvil (`tmv-mobile/`)
- `env.example` → `EXPO_PUBLIC_API_URL=https://api.themoneyvice.com`
- `app.config.js` → Configuración Expo con API URL
- `src/api/client.ts` → Cliente Axios configurado

### 🔧 **Interceptores de Axios**

#### ✅ **Request Interceptor**
- **Web**: Usa `sessionStorage.getItem('jwt_token')`
- **Móvil**: Usa `AsyncStorage.getItem('jwt_token')`
- **Función**: Agregar token JWT a todas las requests

#### ✅ **Response Interceptor**
- **Manejo de errores 401**: Refresh token automático
- **Manejo de errores de red**: Modo offline/mock
- **Conversión de fechas**: UTC ↔ Local automática
- **Endpoints excluidos**: Lista idéntica en ambas plataformas

### 📅 **Utilidades de Fechas**

#### ✅ **Funciones Migradas**
- `utcToLocal()` / `localToUtc()`
- `utcObjectToLocal()` / `localObjectToUtc()`
- `utcToLocalFormatted()` / `localToUtcFormatted()`
- `getCurrentTimezone()` / `getCurrentTimezoneOffset()`

#### ✅ **Conversión Automática**
- **Requests**: Fechas locales → UTC antes de enviar
- **Responses**: Fechas UTC → Locales después de recibir
- **Exclusiones**: Endpoints de auth, throws, bets (idénticos)

### 🔐 **Autenticación**

#### ✅ **Almacenamiento de Tokens**
- **Web**: `sessionStorage` (temporal)
- **Móvil**: `AsyncStorage` (persistente)

#### ✅ **Modo Offline/Mock**
- **Activación**: Error de red, servidor no disponible, errores UUID
- **Tokens Mock**: Misma lógica en ambas plataformas
- **Usuarios Mock**: Mismos roles y credenciales

### 🌐 **Variables de Entorno**

#### Web
```bash
REACT_APP_API_URL=https://api.themoneyvice.com
REACT_APP_ENVIRONMENT=development
```

#### Móvil
```bash
EXPO_PUBLIC_API_URL=https://api.themoneyvice.com
EXPO_PUBLIC_ENVIRONMENT=development
```

### 📡 **Endpoints Soportados**

#### ✅ **Autenticación**
- `POST /api/Auth/login`
- `POST /api/Auth/refresh`
- `POST /api/Auth/validate`
- `POST /api/Auth/logout`

#### ✅ **Usuarios**
- `GET /api/Users`
- `GET /api/Users/{id}`
- `POST /api/Users`
- `PUT /api/Users/{id}`

#### ✅ **Apuestas**
- `GET /api/Bet`
- `POST /api/Bet`
- `GET /api/Bet/{id}`
- `PUT /api/Bet/{id}`
- `POST /api/Bet/user/bet-play`

#### ✅ **Loterías**
- `GET /api/Lottery`
- `GET /api/Lottery/active`
- `GET /api/Lottery/{id}`

#### ✅ **Lanzamientos**
- `GET /api/Throw`
- `GET /api/Throw/lottery/{id}/active`

#### ✅ **Bookies**
- `GET /api/Bookie`
- `GET /api/Bookie/validate-bets`
- `PUT /api/Bookie/bet/{betId}/state/{stateId}`

### 🔄 **Sincronización Completa**

| Componente | Web | Móvil | Estado |
|------------|-----|-------|--------|
| URL Base | ✅ | ✅ | **Sincronizado** |
| Timeout | 10s | 10s | **Sincronizado** |
| Headers | ✅ | ✅ | **Sincronizado** |
| Interceptors | ✅ | ✅ | **Sincronizado** |
| Manejo de Errores | ✅ | ✅ | **Sincronizado** |
| Refresh Token | ✅ | ✅ | **Sincronizado** |
| Modo Offline | ✅ | ✅ | **Sincronizado** |
| Utilidades Fechas | ✅ | ✅ | **Sincronizado** |
| Endpoints Excluidos | ✅ | ✅ | **Sincronizado** |

### 🚀 **Estado Actual**

La aplicación móvil tiene **configuración idéntica** a la aplicación web:

- ✅ **Misma API URL**
- ✅ **Mismos interceptores**
- ✅ **Mismo manejo de errores**
- ✅ **Mismas utilidades de fechas**
- ✅ **Mismo modo offline**
- ✅ **Mismos endpoints excluidos**

### 📝 **Notas Importantes**

1. **Variables de entorno**: Usar `EXPO_PUBLIC_` en lugar de `REACT_APP_`
2. **Almacenamiento**: `AsyncStorage` en lugar de `sessionStorage`
3. **Persistencia**: Los tokens se mantienen entre sesiones en móvil
4. **URLs**: Configuración centralizada en `app.config.js`

---

**✅ La configuración de API está completamente sincronizada entre web y móvil.**
