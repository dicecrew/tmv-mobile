import { customInstance } from './client';

// ===== SERVICIOS DE AUTENTICACIÓN =====
export const authService = {
  // Login usando el cliente personalizado
  login: async (credentials: { phoneNumber: string; password: string }) => {
    console.log('authService.login - Credentials:', credentials);
    const response = await customInstance<any>({
      url: '/api/Auth/login',
      method: 'POST',
      data: credentials
    });
    console.log('authService.login - Response:', response);
    return response.data;
  },

  // Validar token usando el cliente personalizado
  validateToken: async (token: string) => {
    console.log('authService.validateToken - Token:', token);
    const response = await customInstance<any>({
      url: '/api/Auth/validate',
      method: 'POST',
      data: { token }
    });
    console.log('authService.validateToken - Response:', response);
    return response.data;
  },

  // Refresh token usando el cliente personalizado
  refreshToken: async (refreshToken: string) => {
    console.log('authService.refreshToken - Refresh token:', refreshToken);
    const response = await customInstance<any>({
      url: '/api/Auth/refresh',
      method: 'POST',
      data: { refreshToken }
    });
    console.log('authService.refreshToken - Response:', response);
    return response.data;
  },

  // Logout usando el cliente personalizado
  logout: async () => {
    console.log('authService.logout - Logging out');
    const response = await customInstance<any>({
      url: '/api/Auth/logout',
      method: 'POST'
    });
    console.log('authService.logout - Response:', response);
    return response.data;
  },
};

// ===== SERVICIOS DE USUARIOS =====
export const userService = {
  // Obtener lista de usuarios
  getUsers: () =>
    customInstance<any>({
      url: '/api/Users',
      method: 'GET'
    }),

  // Obtener usuario por ID
  getUserById: (userId: string) =>
    customInstance<any>({
      url: `/api/Users/${userId}`,
      method: 'GET'
    }),

  // Crear usuario
  createUser: (userData: any) =>
    customInstance<any>({
      url: '/api/Users',
      method: 'POST',
      data: userData
    }),

  // Crear usuario por bookie
  createUserByBookie: (userData: any) =>
    customInstance<any>({
      url: '/api/Users/by-bookie',
      method: 'POST',
      data: userData
    }),

  // Actualizar usuario
  updateUser: (userId: string, userData: any) =>
    customInstance<any>({
      url: `/api/Users/${userId}`,
      method: 'PUT',
      data: userData
    }),
};

// ===== SERVICIOS DE APUESTAS =====
export const betService = {
  // Obtener todas las apuestas
  getAllBets: () =>
    customInstance<any>({
      url: '/api/Bet',
      method: 'GET'
    }),

  // Crear nueva apuesta
  createBet: (betData: any) =>
    customInstance<any>({
      url: '/api/Bet',
      method: 'POST',
      data: betData
    }),

  // Obtener apuesta por ID
  getBetById: (betId: string) =>
    customInstance<any>({
      url: `/api/Bet/${betId}`,
      method: 'GET'
    }),

  // Actualizar apuesta
  updateBet: (betId: string, betData: any) =>
    customInstance<any>({
      url: `/api/Bet/${betId}`,
      method: 'PUT',
      data: betData
    }),

  // Obtener apuestas del usuario
  getUserBets: (userId: string) =>
    customInstance<any>({
      url: `/api/Bet/user/${userId}`,
      method: 'GET'
    }),

  // Enviar apuesta de usuario
  sendUserBetPlay: (userBetPlayData: any) =>
    customInstance<any>({
      url: '/api/Bet/user/bet-play',
      method: 'POST',
      data: userBetPlayData
    }),
};

// ===== SERVICIOS DE LOTERÍAS =====
export const lotteryService = {
  // Obtener loterías
  getLotteries: () =>
    customInstance<any>({
      url: '/api/Lottery',
      method: 'GET'
    }),

  // Obtener lotería por ID
  getLotteryById: (lotteryId: string) =>
    customInstance<any>({
      url: `/api/Lottery/${lotteryId}`,
      method: 'GET'
    }),

  // Obtener loterías activas
  getActiveLotteries: () =>
    customInstance<any>({
      url: '/api/Lottery/active',
      method: 'GET'
    }),

  // Crear lotería
  createLottery: (lotteryData: any) =>
    customInstance<any>({
      url: '/api/Lottery',
      method: 'POST',
      data: lotteryData
    }),

  // Actualizar lotería
  updateLottery: (lotteryId: string, lotteryData: any) =>
    customInstance<any>({
      url: `/api/Lottery/${lotteryId}`,
      method: 'PUT',
      data: lotteryData
    }),

  // Eliminar lotería
  deleteLottery: (lotteryId: string) =>
    customInstance<any>({
      url: `/api/Lottery/${lotteryId}`,
      method: 'DELETE'
    }),
};

// ===== SERVICIOS DE LANZAMIENTOS =====
export const throwService = {
  // Obtener lanzamientos
  getThrows: () =>
    customInstance<any>({
      url: '/api/Throw',
      method: 'GET'
    }),

  // Obtener lanzamiento por ID
  getThrowById: (throwId: string) =>
    customInstance<any>({
      url: `/api/Throw/${throwId}`,
      method: 'GET'
    }),

  // Obtener lanzamientos activos por lotería
  getActiveThrowsByLottery: (lotteryId: string) =>
    customInstance<any>({
      url: `/api/Throw/lottery/${lotteryId}/active`,
      method: 'GET'
    }),

  // Obtener lanzamientos activos por lotería y tiempo
  getActiveThrowsByLotteryForTime: (lotteryId: string, utcTime: string) =>
    customInstance<any>({
      url: `/api/Throw/lottery/${lotteryId}/active/for-time`,
      method: 'GET',
      params: { utcTime }
    }),

  // Crear lanzamiento
  createThrow: (throwData: any) =>
    customInstance<any>({
      url: '/api/Throw',
      method: 'POST',
      data: throwData
    }),

  // Actualizar lanzamiento
  updateThrow: (throwId: string, throwData: any) =>
    customInstance<any>({
      url: `/api/Throw/${throwId}`,
      method: 'PUT',
      data: throwData
    }),

  // Eliminar lanzamiento
  deleteThrow: (throwId: string) =>
    customInstance<any>({
      url: `/api/Throw/${throwId}`,
      method: 'DELETE'
    }),
};

// ===== SERVICIOS DE BOOKIES =====
export const bookieService = {
  // Obtener bookies
  getBookies: () =>
    customInstance<any>({
      url: '/api/Bookie',
      method: 'GET'
    }),

  // Obtener bookie por ID
  getBookieById: (bookieId: string) =>
    customInstance<any>({
      url: `/api/Bookie/${bookieId}`,
      method: 'GET'
    }),

  // Crear bookie
  createBookie: (bookieData: any) =>
    customInstance<any>({
      url: '/api/Bookie',
      method: 'POST',
      data: bookieData
    }),

  // Crear bookie con usuario
  createBookieWithUser: (bookieData: any) =>
    customInstance<any>({
      url: '/api/Bookie/with-user',
      method: 'POST',
      data: bookieData
    }),

  // Actualizar bookie
  updateBookie: (bookieId: string, bookieData: any) =>
    customInstance<any>({
      url: `/api/Bookie/${bookieId}`,
      method: 'PUT',
      data: bookieData
    }),

  // Eliminar bookie
  deleteBookie: (bookieId: string) =>
    customInstance<any>({
      url: `/api/Bookie/${bookieId}`,
      method: 'DELETE'
    }),

  // Obtener apuestas para validar
  getValidateBets: (params?: any) =>
    customInstance<any>({
      url: '/api/Bookie/validate-bets',
      method: 'GET',
      params
    }),

  // Actualizar estado de apuesta
  updateBetState: (betId: string, stateId: string) =>
    customInstance<any>({
      url: `/api/Bookie/bet/${betId}/state/${stateId}`,
      method: 'PUT'
    }),

  // Obtener historial de apuestas de usuarios
  getUsersBetsHistory: (params?: any) =>
    customInstance<any>({
      url: '/api/Bookie/users-bets-history',
      method: 'GET',
      params
    }),
};

// ===== SERVICIOS DE ROLES =====
export const roleService = {
  // Obtener roles
  getRoles: () =>
    customInstance<any>({
      url: '/api/Roles',
      method: 'GET'
    }),

  // Obtener rol por ID
  getRoleById: (roleId: string) =>
    customInstance<any>({
      url: `/api/Roles/${roleId}`,
      method: 'GET'
    }),

  // Crear rol
  createRole: (roleData: any) =>
    customInstance<any>({
      url: '/api/Roles',
      method: 'POST',
      data: roleData
    }),

  // Actualizar rol
  updateRole: (roleId: string, roleData: any) =>
    customInstance<any>({
      url: `/api/Roles/${roleId}`,
      method: 'PUT',
      data: roleData
    }),

  // Eliminar rol
  deleteRole: (roleId: string) =>
    customInstance<any>({
      url: `/api/Roles/${roleId}`,
      method: 'DELETE'
    }),
};
