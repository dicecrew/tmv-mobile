/**
 * Utilidades para manejo de fechas UTC y hora local
 */

/**
 * Convierte una fecha UTC a hora local
 * @param {string|Date} utcDate - Fecha en UTC (string ISO o Date)
 * @returns {Date} - Fecha en hora local
 */
export const utcToLocal = (utcDate: string | Date | null): Date | null => {
  if (!utcDate) return null;
  
  try {
    // Si es string, convertir a Date
    const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      console.warn('⚠️  utcToLocal: Invalid date received:', utcDate);
      return null;
    }
    
    // Crear nueva fecha en hora local
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  } catch (error) {
    console.error('❌ Error in utcToLocal:', error, 'Input:', utcDate);
    return null;
  }
};

/**
 * Convierte una fecha de hora local a UTC
 * @param {string|Date} localDate - Fecha en hora local (string ISO o Date)
 * @returns {Date} - Fecha en UTC
 */
export const localToUtc = (localDate: string | Date | null): Date | null => {
  if (!localDate) return null;
  
  try {
    // Si es string, convertir a Date
    const date = typeof localDate === 'string' ? new Date(localDate) : localDate;
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      console.warn('⚠️  localToUtc: Invalid date received:', localDate);
      return null;
    }
    
    // Crear nueva fecha en UTC
    return new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
  } catch (error) {
    console.error('❌ Error in localToUtc:', error, 'Input:', localDate);
    return null;
  }
};

/**
 * Convierte una fecha UTC a string ISO en hora local
 * @param {string|Date} utcDate - Fecha en UTC
 * @returns {string} - String ISO en hora local
 */
export const utcToLocalISO = (utcDate: string | Date | null): string | null => {
  const localDate = utcToLocal(utcDate);
  return localDate ? localDate.toISOString() : null;
};

/**
 * Convierte una fecha de hora local a string ISO en UTC
 * @param {string|Date} localDate - Fecha en hora local
 * @returns {string} - String ISO en UTC
 */
export const localToUtcISO = (localDate: string | Date | null): string | null => {
  const utcDate = localToUtc(localDate);
  return utcDate ? utcDate.toISOString() : null;
};

/**
 * Convierte una fecha UTC a string formateado en hora local
 * @param {string|Date} utcDate - Fecha en UTC
 * @param {string} format - Formato de fecha (opcional)
 * @returns {string} - Fecha formateada en hora local
 */
export const utcToLocalFormatted = (utcDate: string | Date | null, format: string = 'dd/MM/yyyy HH:mm:ss'): string => {
  const localDate = utcToLocal(utcDate);
  if (!localDate) return '';
  
  // Formato básico
  if (format === 'dd/MM/yyyy HH:mm:ss') {
    return localDate.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
  
  // Formato solo fecha
  if (format === 'dd/MM/yyyy') {
    return localDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  // Formato solo hora
  if (format === 'HH:mm:ss') {
    return localDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
  
  // Formato por defecto
  return localDate.toLocaleString('es-ES');
};

/**
 * Convierte una fecha de hora local a string formateado en UTC
 * @param {string|Date} localDate - Fecha en hora local
 * @param {string} format - Formato de fecha (opcional)
 * @returns {string} - Fecha formateada en UTC
 */
export const localToUtcFormatted = (localDate: string | Date | null, format: string = 'dd/MM/yyyy HH:mm:ss'): string => {
  const utcDate = localToUtc(localDate);
  if (!utcDate) return '';
  
  // Formato básico
  if (format === 'dd/MM/yyyy HH:mm:ss') {
    return utcDate.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC'
    });
  }
  
  // Formato solo fecha
  if (format === 'dd/MM/yyyy') {
    return utcDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC'
    });
  }
  
  // Formato solo hora
  if (format === 'HH:mm:ss') {
    return utcDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC'
    });
  }
  
  // Formato por defecto
  return utcDate.toLocaleString('es-ES', { timeZone: 'UTC' });
};

/**
 * Obtiene la zona horaria actual del usuario
 * @returns {string} - Zona horaria (ej: "America/New_York")
 */
export const getCurrentTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Obtiene el offset de la zona horaria actual en minutos
 * @returns {number} - Offset en minutos
 */
export const getCurrentTimezoneOffset = (): number => {
  return new Date().getTimezoneOffset();
};

/**
 * Convierte un array de fechas UTC a hora local
 * @param {Array} utcDates - Array de fechas UTC
 * @returns {Array} - Array de fechas en hora local
 */
export const utcArrayToLocal = (utcDates: (string | Date)[]): (Date | null)[] => {
  if (!Array.isArray(utcDates)) return [];
  return utcDates.map(date => utcToLocal(date));
};

/**
 * Convierte un array de fechas de hora local a UTC
 * @param {Array} localDates - Array de fechas en hora local
 * @returns {Array} - Array de fechas en UTC
 */
export const localArrayToUtc = (localDates: (string | Date)[]): (Date | null)[] => {
  if (!Array.isArray(localDates)) return [];
  return localDates.map(date => localToUtc(date));
};

/**
 * Convierte un objeto con fechas UTC a hora local
 * @param {Object} obj - Objeto que puede contener fechas UTC
 * @returns {Object} - Objeto con fechas convertidas a hora local
 */
export const utcObjectToLocal = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const converted = { ...obj };
  
  // Lista de campos que probablemente contengan fechas
  const dateFields = [
    'date', 'createdAt', 'updatedAt', 'startDate', 'endDate', 
    'birthDate', 'expiryDate', 'dueDate', 'publishedAt',
    'startTime', 'endTime', 'time', 'timestamp', 'transactionDate'
  ];
  
  Object.keys(converted).forEach(key => {
    const value = converted[key];
    
    // Si es un campo de fecha conocido y tiene valor
    if (dateFields.some(field => key.toLowerCase().includes(field.toLowerCase())) && value) {
      converted[key] = utcToLocal(value);
    }
    // Si es un objeto, procesar recursivamente
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      converted[key] = utcObjectToLocal(value);
    }
    // Si es un array, procesar cada elemento
    else if (Array.isArray(value)) {
      converted[key] = value.map((item: any) => 
        typeof item === 'object' ? utcObjectToLocal(item) : item
      );
    }
  });
  
  return converted;
};

/**
 * Convierte un objeto con fechas de hora local a UTC
 * @param {Object} obj - Objeto que puede contener fechas en hora local
 * @returns {Object} - Objeto con fechas convertidas a UTC
 */
export const localObjectToUtc = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const converted = { ...obj };
  
  // Lista de campos que probablemente contengan fechas
  const dateFields = [
    'date', 'createdAt', 'updatedAt', 'startDate', 'endDate', 
    'birthDate', 'expiryDate', 'dueDate', 'publishedAt',
    'startTime', 'endTime', 'time', 'timestamp', 'transactionDate'
  ];
  
  Object.keys(converted).forEach(key => {
    const value = converted[key];
    
    // Si es un campo de fecha conocido y tiene valor
    if (dateFields.some(field => key.toLowerCase().includes(field.toLowerCase())) && value) {
      converted[key] = localToUtc(value);
    }
    // Si es un objeto, procesar recursivamente
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      converted[key] = localObjectToUtc(value);
    }
    // Si es un array, procesar cada elemento
    else if (Array.isArray(value)) {
      converted[key] = value.map((item: any) => 
        typeof item === 'object' ? localObjectToUtc(item) : item
      );
    }
  });
  
  return converted;
};
