import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import Combobox, { ComboboxOption } from '../common/Combobox';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';
import Card from '../common/Card';
import Toast from 'react-native-toast-message';
import { betService, lotteryService, throwService, playTypeService } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';

interface Lottery {
  id: string;
  name: string;
}

interface Throw {
  id: string;
  name: string;
  endTime: string;
  startTime: string;
}

interface PlayType {
  id: string;
  name: string;
  code: string;
}

interface Play {
  id: string;
  numbers: string;
  validPlays: ValidPlay[];
  amount: number;
  timestamp: string;
  typeAmountInputs: { [key: string]: string };
}

interface ValidPlay {
  type: string;
  combinations: string[];
  amount: number;
  totalCost: number;
  details: string;
}

const PLAY_TYPE_COLORS: { [key: string]: string } = {
  FIJO: '#2563eb',
  CORRIDO: '#16a34a',
  PARLET: '#dc2626',
  CENTENA: '#7c3aed',
};

// Función para formatear números con punto decimal
const formatAmount = (amount: number): string => {
  if (amount === null || amount === undefined) return '0';
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount));
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

// Función para formatear números con ceros a la izquierda
  const formatNumberDisplay = (number: string): string => {
    if (!number) return '';
    const cleanNumber = number.trim();
    return cleanNumber.length === 1 ? `0${cleanNumber}` : cleanNumber;
  };

const RegistrarApuesta: React.FC = () => {
  const { user } = useAuth();
  const { width: screenWidth } = Dimensions.get('window');
  const numbersInputRef = useRef<TextInput>(null);

  // Estados principales
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [throws, setThrows] = useState<Throw[]>([]);
  const [playTypes, setPlayTypes] = useState<PlayType[]>([]);

  const [selectedLotteryId, setSelectedLotteryId] = useState('');
  const [selectedThrowId, setSelectedThrowId] = useState('');
  const [currentNumbers, setCurrentNumbers] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [typeAmountInputs, setTypeAmountInputs] = useState<{ [key: string]: string }>({});
  const [allPlays, setAllPlays] = useState<Play[]>([]);
  const [activeGameTab, setActiveGameTab] = useState('numeros');
  const [isEditingSeparatedPlay, setIsEditingSeparatedPlay] = useState(false);
  const [currentPlayId, setCurrentPlayId] = useState<string | null>(null);
  const [isAlMode, setIsAlMode] = useState(false);
  const [alFirstNumber, setAlFirstNumber] = useState('');

  const [isLoadingLotteries, setIsLoadingLotteries] = useState(false);
  const [isLoadingThrows, setIsLoadingThrows] = useState(false);
  const [isLoadingPlayTypes, setIsLoadingPlayTypes] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());

  // Funciones helper
  const getPlayTypeId = (typeName: string): string => {
    const normalizedTypeName = typeName.toLowerCase().trim();
    switch (normalizedTypeName) {
      case 'fijo':
        return 'fdea9747-7648-4f62-9693-fa2c21fafe08';
      case 'corrido':
        return '98d020d7-0435-4b31-86c4-fcb72cb3aeb8';
      case 'parlet':
        return 'e885329c-1f42-45d4-8927-50f07d53a0fa';
      case 'centena':
        return 'c6914e4e-86a4-44b4-8278-62164593528f';
      default:
        return 'fdea9747-7648-4f62-9693-fa2c21fafe08';
    }
  };

  const convertUtcTimeToLocal = (utcTimeString: string): string => {
    if (!utcTimeString) return '';
    
    try {
      let utcDateTime: Date;
      
      if (typeof utcTimeString === 'string') {
        if (utcTimeString.includes('T') && utcTimeString.includes('Z')) {
          utcDateTime = new Date(utcTimeString);
        } else if (utcTimeString.includes(':') && !utcTimeString.includes('T')) {
          const today = new Date().toISOString().split('T')[0];
          utcDateTime = new Date(`${today}T${utcTimeString}Z`);
        } else {
          utcDateTime = new Date(utcTimeString);
        }
      } else {
        utcDateTime = new Date(utcTimeString);
      }
      
      if (isNaN(utcDateTime.getTime())) {
        console.error('❌ Fecha inválida en convertUtcTimeToLocal:', {
          utcTimeString,
          utcDateTime
        });
        return utcTimeString;
      }
      
      const localTime = utcDateTime.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      return localTime;
    } catch (error) {
      console.error('Error converting UTC time to local:', error);
      return utcTimeString;
    }
  };

  const getThrowStatus = (throwData: Throw) => {
    if (!throwData || !throwData.endTime) return null;
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const localEndTime = convertUtcTimeToLocal(throwData.endTime);
    
    let endDateTime: Date;
    if (throwData.endTime.includes('T') && throwData.endTime.includes('Z')) {
      endDateTime = new Date(throwData.endTime);
    } else {
      endDateTime = new Date(`${today}T${throwData.endTime}Z`);
    }
    
    if (endDateTime <= now) {
      return {
        timeRemaining: 0,
        minutesRemaining: 0,
        hoursRemaining: 0,
        endTime: localEndTime,
        status: 'closed',
        color: '#ef4444',
        tooltip: 'La tirada ya cerró'
      };
    }
    
    const timeRemaining = endDateTime.getTime() - now.getTime();
    const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));
    const hoursRemaining = Math.floor(minutesRemaining / 60);
    
    let status = 'normal';
    let color = '#22c55e';
    let tooltip = 'Estás en Tiempo';
    
    if (minutesRemaining <= 30) {
      status = 'urgent';
      color = '#ef4444';
      tooltip = 'La tirada está por cerrar. Validar su jugada urgente con el listero.';
    } else if (minutesRemaining <= 60) {
      status = 'warning';
      color = '#f59e0b';
      tooltip = 'Falta poco tiempo para cerrar la tirada.';
    }
    
    return {
      timeRemaining,
      minutesRemaining,
      hoursRemaining,
      endTime: localEndTime,
      status,
      color,
      tooltip
    };
  };

  // Cargar loterías activas
  const loadActiveLotteries = async () => {
    setIsLoadingLotteries(true);
    try {
      const response = await lotteryService.getActiveLotteries();

      let lotteriesArray: any[] = [];
      if (response && typeof response === 'object' && !Array.isArray(response)) {
        lotteriesArray = Object.values(response);
      } else if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        lotteriesArray = Object.values(response.data);
      } else if (Array.isArray(response?.data)) {
        lotteriesArray = response.data;
      } else if (Array.isArray(response)) {
        lotteriesArray = response;
      }

      setLotteries(lotteriesArray);

      // Seleccionar primera lotería por defecto
      if (lotteriesArray.length > 0 && !selectedLotteryId) {
        setSelectedLotteryId(lotteriesArray[0].id);
      }
    } catch (error) {
      console.error('Error loading lotteries:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron cargar las loterías',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setIsLoadingLotteries(false);
    }
  };

  // Cargar tiradas por lotería
  const loadThrows = async (lotteryId: string) => {
    if (!lotteryId) return;

    setIsLoadingThrows(true);
    try {
      const utcTime = new Date().toISOString();
      const response = await throwService.getActiveThrowsByLotteryForTime(lotteryId, utcTime);

      let throwsArray: any[] = [];
      if (response?.data && Array.isArray(response.data)) {
        throwsArray = response.data;
      } else if (Array.isArray(response)) {
        throwsArray = response;
      } else if (response?.data && typeof response.data === 'object') {
        throwsArray = Object.values(response.data);
      }

      setThrows(throwsArray);

      // Seleccionar primera tirada por defecto
      if (throwsArray.length > 0) {
        setSelectedThrowId(throwsArray[0].id);
    } else {
        setSelectedThrowId('');
      }
    } catch (error) {
      console.error('Error loading throws:', error);
      setThrows([]);
      setSelectedThrowId('');
    } finally {
      setIsLoadingThrows(false);
    }
  };

  // Cargar tipos de juego
  const loadPlayTypes = async () => {
    setIsLoadingPlayTypes(true);
    try {
      const response = await playTypeService.getPlayTypes();

      let typesArray: any[] = [];
      if (response?.data && Array.isArray(response.data)) {
        typesArray = response.data;
      } else if (Array.isArray(response)) {
        typesArray = response;
      } else if (response?.data && typeof response.data === 'object') {
        typesArray = Object.values(response.data);
      }

      setPlayTypes(typesArray);
    } catch (error) {
      console.error('Error loading play types:', error);
    } finally {
      setIsLoadingPlayTypes(false);
    }
  };

  // Funciones de validación
  const getIndividualNumbers = (): string[] => {
    if (!currentNumbers) return [];
    return currentNumbers.split(/[,\n]/).filter(num => num.trim() !== '');
  };

  const validateNumberForType = (number: string, typeId: string): boolean => {
    const cleanNumber = number.replace(/\./g, '');
    
    switch (typeId) {
      case 'FIJO':
        return (cleanNumber.length === 1 || cleanNumber.length === 2) && !isNaN(parseInt(cleanNumber));
      case 'CORRIDO':
        return (cleanNumber.length === 1 || cleanNumber.length === 2) && !isNaN(parseInt(cleanNumber));
      case 'CENTENA':
        return cleanNumber.length === 3 && !isNaN(parseInt(cleanNumber));
      case 'PARLET':
        return (cleanNumber.length === 1 || cleanNumber.length === 2) && !isNaN(parseInt(cleanNumber));
      default:
        return false;
    }
  };

  const getAvailableTypes = (): string[] => {
    const numbers = getIndividualNumbers();
    if (numbers.length === 0) return [];

    const availableTypes: string[] = [];
    const availableTypeNames = playTypes.map(type => type.name.toLowerCase().trim());
    
    const validFijoCorridoNumbers = numbers.filter(num => validateNumberForType(num, 'FIJO'));
    
    if (validFijoCorridoNumbers.length > 0) {
      if (availableTypeNames.includes('fijo')) availableTypes.push('Fijo');
      if (availableTypeNames.includes('corrido')) availableTypes.push('Corrido');
    }

    const threeDigitNumbers = numbers.filter(num => validateNumberForType(num, 'CENTENA'));
    if (threeDigitNumbers.length > 0) {
      if (availableTypeNames.includes('centena')) availableTypes.push('Centena');
    }

    if (validFijoCorridoNumbers.length >= 2) {
      if (availableTypeNames.includes('parlet')) availableTypes.push('Parlet');
    }

    return availableTypes;
  };

  // Función para obtener jugadas válidas
  const getValidPlays = (): ValidPlay[] => {
    const numbers = getIndividualNumbers();
    const validPlays: ValidPlay[] = [];

    selectedTypes.forEach(typeName => {
      const amountInputs = typeAmountInputs[typeName] || '';
      const amountLines = amountInputs.split('\n').filter(line => line.trim() !== '');
      
      if (typeName === 'Parlet') {
        const validNumbers = numbers.filter(num => validateNumberForType(num, 'PARLET'));
        if (validNumbers.length >= 2) {
          const combinations: string[] = [];
          for (let i = 0; i < validNumbers.length; i++) {
            for (let j = i + 1; j < validNumbers.length; j++) {
              const firstNum = formatNumberDisplay(validNumbers[i]);
              const secondNum = formatNumberDisplay(validNumbers[j]);
              combinations.push(`${firstNum}X${secondNum}`);
            }
          }
          if (combinations.length > 0) {
            const expectedCombinations = (validNumbers.length * (validNumbers.length - 1)) / 2;
            const baseAmount = amountLines.length > 0 ? parseFloat(amountLines[0]) || 0 : 0;
            
            if (baseAmount > 0) {
              const totalAmount = baseAmount * expectedCombinations;
              
              validPlays.push({
                type: typeName,
                combinations: combinations,
                amount: totalAmount,
                totalCost: totalAmount,
                details: `${expectedCombinations} combinaciones × $${baseAmount} = $${formatAmount(totalAmount)}`
              });
            }
          }
        }
      } else if (typeName === 'Fijo') {
        const validNumbers = numbers.filter(num => validateNumberForType(num, 'FIJO'));
        if (validNumbers.length > 0) {
          const totalAmount = amountLines.reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
          
          if (totalAmount > 0) {
            validPlays.push({
              type: typeName,
              combinations: validNumbers,
              amount: totalAmount,
              totalCost: totalAmount,
              details: `${validNumbers.length} números × $${totalAmount} = $${formatAmount(totalAmount)}`
            });
          }
        }
      } else if (typeName === 'Corrido') {
        const validNumbers = numbers.filter(num => validateNumberForType(num, 'CORRIDO'));
        if (validNumbers.length > 0) {
          const totalAmount = amountLines.reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
          
          if (totalAmount > 0) {
            validPlays.push({
              type: typeName,
              combinations: validNumbers,
              amount: totalAmount,
              totalCost: totalAmount,
              details: `${validNumbers.length} números × $${totalAmount} = $${formatAmount(totalAmount)}`
            });
          }
        }
      } else if (typeName === 'Centena') {
        const validNumbers = numbers.filter(num => validateNumberForType(num, 'CENTENA'));
        if (validNumbers.length > 0) {
          let totalAmount = 0;
          let details = '';
          
          if (amountLines.length > 0) {
            totalAmount = amountLines.reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
            details = `${validNumbers.length} centenas con montos individuales = $${formatAmount(totalAmount)}`;
          } else {
            totalAmount = 0;
            details = `${validNumbers.length} centenas sin montos = $0`;
          }
          
          if (totalAmount > 0) {
            validPlays.push({
              type: typeName,
              combinations: validNumbers,
              amount: totalAmount,
              totalCost: totalAmount,
              details: details
            });
          }
        }
      }
    });

    return validPlays;
  };

  const calculateCurrentAmount = (): number => {
    const validPlays = getValidPlays();
    return validPlays.reduce((total, play) => total + play.totalCost, 0);
  };

  const calculateTotalAmount = (): number => {
    return allPlays.reduce((total, play) => total + play.amount, 0) + calculateCurrentAmount();
  };

  const hasValidAmounts = (): boolean => {
    for (const play of allPlays) {
      for (const validPlay of play.validPlays) {
        if (validPlay.totalCost <= 0) {
          return false;
        }
      }
    }
    
    if (currentNumbers && selectedTypes.length > 0) {
      const validPlays = getValidPlays();
      for (const validPlay of validPlays) {
        if (validPlay.totalCost <= 0) {
          return false;
        }
      }
    }
    
    return true;
  };

  useEffect(() => {
    loadActiveLotteries();
    loadPlayTypes();
  }, []);

  useEffect(() => {
    if (selectedLotteryId) {
      loadThrows(selectedLotteryId);
    }
  }, [selectedLotteryId]);

  // Actualizar hora cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Funciones de manipulación de números
  const addNumber = (num: string) => {
    // Si estamos en modo AL, seguir la lógica normal de construcción de números
    if (isAlMode && alFirstNumber) {
    const numbers = getIndividualNumbers();
    
    if (numbers.length >= 30) {
      return;
    }
    
      let newCurrentNumbers: string;
      
      // Analizar el estado actual de currentNumbers
    const lastChar = currentNumbers[currentNumbers.length - 1];
    const parts = currentNumbers.split(/[\n,]/);
      const currentNumber = parts[parts.length - 1];
      
      // Si el último carácter es un separador, iniciar nuevo número
      if (lastChar === '\n' || lastChar === ',' || currentNumbers === '') {
        newCurrentNumbers = currentNumbers + num;
      } else {
        // Continuar construyendo el número actual
        if (currentNumber.length === 2 && num === '0' && 
            currentNumber !== '10' && currentNumber !== '20' && currentNumber !== '30' && 
            currentNumber !== '40' && currentNumber !== '50' && currentNumber !== '60' && 
            currentNumber !== '70' && currentNumber !== '80' && currentNumber !== '90' && 
            currentNumber !== '00') {
          return; // No permitir números como 120, 230, etc
        }
        
        if (currentNumber.length >= 3) {
          return; // No permitir más de 3 dígitos
        }
        
        newCurrentNumbers = currentNumbers + num;
      }
      
      setCurrentNumbers(newCurrentNumbers);
      return;
    }
    
    let targetType: string | null = null;
    switch (activeGameTab) {
      case 'numeros':
        targetType = null;
        break;
      case 'fijo':
        targetType = 'Fijo';
        break;
      case 'corrido':
        targetType = 'Corrido';
        break;
      case 'centena':
        targetType = 'Centena';
        break;
      case 'parlet':
        targetType = 'Parlet';
        break;
      default:
        targetType = null;
    }
    
    // Si estamos en un tab de montos
    if (targetType) {
      if (!selectedTypes.includes(targetType)) {
        setSelectedTypes(prev => [...prev, targetType!]);
      }
      
      const currentAmounts = typeAmountInputs[targetType] || '';
      
      // Agregar número al monto
      if (currentAmounts) {
        const amountLines = currentAmounts.split('\n');
        const lastLine = amountLines[amountLines.length - 1] || '';
        const newLastLine = lastLine + num;
        amountLines[amountLines.length - 1] = newLastLine;
        const newAmounts = amountLines.join('\n');
        
        setTypeAmountInputs(prev => ({
          ...prev,
          [targetType!]: newAmounts
        }));
      } else {
        setTypeAmountInputs(prev => ({
          ...prev,
          [targetType!]: num
        }));
      }
    } else {
      // Estamos en el tab de números
      const numbers = getIndividualNumbers();
      
      if (numbers.length >= 30) {
        return;
      }
    
    let newCurrentNumbers: string;
    
      // Analizar el estado actual de currentNumbers
      const lastChar = currentNumbers[currentNumbers.length - 1];
      const parts = currentNumbers.split(/[\n,]/);
      const currentNumber = parts[parts.length - 1];
      
      // Si el último carácter es un separador, iniciar nuevo número
    if (lastChar === '\n' || lastChar === ',' || currentNumbers === '') {
      newCurrentNumbers = currentNumbers + num;
    } else {
        // Continuar construyendo el número actual
        if (currentNumber.length === 2 && num === '0' && 
            currentNumber !== '10' && currentNumber !== '20' && currentNumber !== '30' && 
            currentNumber !== '40' && currentNumber !== '50' && currentNumber !== '60' && 
            currentNumber !== '70' && currentNumber !== '80' && currentNumber !== '90' && 
            currentNumber !== '00') {
          return; // No permitir números como 120, 230, etc
        }
        
      if (currentNumber.length >= 3) {
        return; // No permitir más de 3 dígitos
      }
      
      newCurrentNumbers = currentNumbers + num;
    }
    
    setCurrentNumbers(newCurrentNumbers);
      
      // Auto-salto para números de 3 dígitos (centenas)
      const updatedParts = newCurrentNumbers.split(/[\n,]/);
      const updatedCurrentNumber = updatedParts[updatedParts.length - 1];
      if (updatedCurrentNumber.length === 3 && !isNaN(parseInt(updatedCurrentNumber))) {
        setTimeout(() => {
          setCurrentNumbers(prev => prev + '\n');
        }, 100);
      }
      
      // Si es el primer número, crear un nuevo play ID
      if (!currentNumbers) {
        const newPlayId = Date.now().toString();
        setCurrentPlayId(newPlayId);
      }
    }
  };

  const addDecimalPoint = () => {
    // Solo funciona en tabs de montos
    if (activeGameTab !== 'numeros' && selectedTypes.length > 0) {
      const currentType = activeGameTab.charAt(0).toUpperCase() + activeGameTab.slice(1);
      const currentAmounts = typeAmountInputs[currentType] || '';
      
      // Obtener la última línea del monto actual
      const amountLines = currentAmounts.split('\n');
      const lastLine = amountLines[amountLines.length - 1] || '';
      
      // Si la última línea NO tiene punto y tiene contenido, agregar punto decimal
      if (!lastLine.includes('.') && lastLine.length > 0) {
        // Agregar punto decimal a la última línea
        amountLines[amountLines.length - 1] = lastLine + '.';
        const newAmounts = amountLines.join('\n');
        
        setTypeAmountInputs(prev => ({
          ...prev,
          [currentType]: newAmounts
        }));
      }
    }
  };

  const addComma = () => {
    if (activeGameTab === 'numeros') {
      const numbers = getIndividualNumbers();
      
      if (numbers.length >= 30) {
        return;
      }
      
      // Verificar el último carácter
    const lastChar = currentNumbers[currentNumbers.length - 1];
    
      // No agregar múltiples saltos consecutivos
      if (lastChar === '\n') {
        return;
      }
      
      // Verificar que haya algo que saltar
      const parts = currentNumbers.split(/[\n,]/);
      const lastPart = parts[parts.length - 1];
      
      if (!lastPart || lastPart.trim() === '') {
        return;
      }
      
      // AGREGAR EL SALTO DE LÍNEA
      const newNumbers = currentNumbers + '\n';
      setCurrentNumbers(newNumbers);
      return;
    }
    
    // LÓGICA PARA TABS DE MONTOS (Fijo, Corrido, Centena, Parlet)
    if (activeGameTab !== 'numeros' && selectedTypes.length > 0) {
      const currentType = activeGameTab.charAt(0).toUpperCase() + activeGameTab.slice(1);
      const currentAmounts = typeAmountInputs[currentType] || '';
      
      if (!currentAmounts.endsWith('\n')) {
        const newAmounts = currentAmounts + '\n';
        setTypeAmountInputs(prev => ({
          ...prev,
          [currentType]: newAmounts
        }));
      }
    }
  };

  const backspace = () => {
    if (activeGameTab === 'numeros') {
      if (currentNumbers) {
        let newCurrentNumbers: string;
        if (currentNumbers.endsWith('\n')) {
          // Si termina con salto de línea, eliminarlo
          newCurrentNumbers = currentNumbers.slice(0, -1);
        } else {
          // Eliminar el último carácter
          newCurrentNumbers = currentNumbers.slice(0, -1);
        }
        
        setCurrentNumbers(newCurrentNumbers);
      }
    } else {
      const targetType = activeGameTab.charAt(0).toUpperCase() + activeGameTab.slice(1);
      
      if (selectedTypes.includes(targetType)) {
        const currentAmounts = typeAmountInputs[targetType] || '';
        
        if (currentAmounts) {
          const amountLines = currentAmounts.split('\n');
          const lastLine = amountLines[amountLines.length - 1] || '';
          
          if (lastLine.length > 0) {
            const newLastLine = lastLine.slice(0, -1);
            amountLines[amountLines.length - 1] = newLastLine;
            const newAmounts = amountLines.join('\n');
            
            setTypeAmountInputs(prev => ({
              ...prev,
              [targetType]: newAmounts
            }));
          } else if (amountLines.length > 1) {
            amountLines.pop();
            const newAmounts = amountLines.join('\n');
            
            setTypeAmountInputs(prev => ({
              ...prev,
              [targetType]: newAmounts
            }));
          }
        }
      }
    }
  };

  const clearAll = () => {
    setCurrentNumbers('');
    setSelectedTypes([]);
    setTypeAmountInputs({});
    setIsEditingSeparatedPlay(false);
    setCurrentPlayId(null);
    setIsAlMode(false);
    setAlFirstNumber('');
    setActiveGameTab('numeros');
  };

  // Toggle tipo de juego
  const toggleType = (typeName: string) => {
    const availableTypes = getAvailableTypes();
    
    if (!availableTypes.includes(typeName)) {
      return;
    }

    setSelectedTypes(prev => {
      if (prev.includes(typeName)) {
        return prev;
    } else {
        return [...prev, typeName];
      }
    });
    
    switch (typeName) {
      case 'Fijo':
        setActiveGameTab('fijo');
        break;
      case 'Corrido':
        setActiveGameTab('corrido');
        break;
      case 'Centena':
        setActiveGameTab('centena');
        break;
      case 'Parlet':
        setActiveGameTab('parlet');
        break;
      default:
        setActiveGameTab('numeros');
    }
  };

  // Funciones AL y separación de jugadas
  const applyAl = () => {
    const numbers = getIndividualNumbers();
    
    if (numbers.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Primero ingresa un número',
        position: 'top',
        topOffset: 60,
      });
      return;
    }
    
    if (numbers.length > 1) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Solo ingresa un número antes de presionar AL',
        position: 'top',
        topOffset: 60,
      });
      return;
    }
    
    // Activar modo AL y agregar coma para separar el primer número
    const singleNumber = numbers[0].trim();
    setAlFirstNumber(singleNumber);
    setIsAlMode(true);
    
    // Agregar coma después del primer número para permitir escribir el segundo
    setCurrentNumbers(currentNumbers + ',');
    
    Toast.show({
      type: 'success',
      text1: '🎯 AL activado',
      text2: `Con ${singleNumber}. Ahora ingresa el segundo número.`,
      position: 'top',
      topOffset: 60,
    });
  };

  const generateAlRange = (firstNum: string, secondNum: string): string[] => {
    const num1 = parseInt(firstNum);
    const num2 = parseInt(secondNum);
    
    if (isNaN(num1) || isNaN(num2)) return [];
    
    // Números de 2 dígitos
    if (num1 >= 0 && num2 >= 0 && num1 <= 99 && num2 <= 99) {
      const difference = Math.abs(num2 - num1);
      const result: string[] = [];
      const start = Math.min(num1, num2);
      const end = Math.max(num1, num2);
      
      if (difference <= 10) {
        // Completar de uno en uno
        for (let i = start; i <= end; i++) {
          if (firstNum.startsWith('0') || secondNum.startsWith('0')) {
            result.push(i.toString().padStart(2, '0'));
          } else {
            result.push(i.toString());
          }
        }
      } else {
        // Completar de 10 en 10
        for (let i = start; i <= end; i += 10) {
          if (firstNum.startsWith('0') || secondNum.startsWith('0')) {
            result.push(i.toString().padStart(2, '0'));
          } else {
            result.push(i.toString());
          }
        }
        // Asegurar que el último número esté incluido
        if (!result.includes(secondNum)) {
          result.push(secondNum);
        }
      }
      return result;
    }
    
    // Números de 1 dígito
    if (firstNum.length === 1 && secondNum.length === 1) {
      const start = Math.min(num1, num2);
      const end = Math.max(num1, num2);
      const result: string[] = [];
      
      for (let i = start; i <= end; i++) {
        result.push(i.toString());
      }
      return result;
    }
    
    return [];
  };

  const separatePlay = () => {
    if (currentNumbers && selectedTypes.length > 0) {
      // Validar números duplicados solo en la jugada actual (permitir solo en Parlet)
      let hasDuplicates = false;
      let hasNonParletDuplicates = false;

      // Verificar números duplicados solo en la jugada actual
      const currentPlayNumbers = getIndividualNumbers();
      const hasParletInCurrent = selectedTypes.includes('Parlet');

      // Verificar duplicados dentro de la jugada actual
      const seenNumbers = new Set<string>();
      const duplicateNumbers: string[] = [];

      currentPlayNumbers.forEach(num => {
        if (seenNumbers.has(num)) {
          hasDuplicates = true;
          duplicateNumbers.push(num);
        } else {
          seenNumbers.add(num);
        }
      });

      // Solo bloquear si hay duplicados Y NO es Parlet
      if (hasDuplicates && !hasParletInCurrent) {
        hasNonParletDuplicates = true;
      }

      // Bloquear solo si hay duplicados en la jugada actual que NO es Parlet
      if (hasNonParletDuplicates) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'No se permiten números duplicados en la jugada actual que no sea Parlet',
          position: 'top',
          topOffset: 60,
        });
        return;
      }

      // Mostrar advertencia si hay duplicados pero son válidos (solo Parlet)
      if (hasDuplicates && !hasNonParletDuplicates) {
        Toast.show({
          type: 'success',
          text1: '✅ Números duplicados permitidos',
          text2: 'Para jugadas de Parlet',
          position: 'top',
          topOffset: 60,
        });
      }

      const validPlays = getValidPlays();
      if (validPlays.length > 0 && calculateCurrentAmount() > 0) {
        const newPlay: Play = {
          id: currentPlayId || Date.now().toString(),
          numbers: currentNumbers,
          validPlays: validPlays,
          amount: validPlays.reduce((total, play) => total + play.totalCost, 0),
          timestamp: new Date().toLocaleTimeString(),
          typeAmountInputs: JSON.parse(JSON.stringify(typeAmountInputs))
        };

        setAllPlays(prev => [...prev, newPlay]);

        // Limpiar formulario
        setCurrentNumbers('');
        setSelectedTypes([]);
        setTypeAmountInputs({});
        setCurrentPlayId(null);
        setIsEditingSeparatedPlay(false);
        setActiveGameTab('numeros');
      }
    }
  };

  const removePlay = (playId: string) => {
    setAllPlays(prev => prev.filter(play => play.id !== playId));
  };

  const editPlay = (play: Play) => {
    // Eliminar de lista PRIMERO
    setAllPlays(prev => prev.filter(p => p.id !== play.id));
    
    // Cargar datos
    setCurrentNumbers(play.numbers);
    
    const playTypes = play.validPlays.map(vp => vp.type);
    setSelectedTypes(playTypes);
    
    if (play.typeAmountInputs) {
      setTypeAmountInputs(JSON.parse(JSON.stringify(play.typeAmountInputs)));
    }
    
    // Estados de edición
    setIsEditingSeparatedPlay(true);
    setCurrentPlayId(play.id);
    
    // Activar tab
    if (playTypes.length > 0) {
      const firstType = playTypes[0].toLowerCase();
      if (firstType === 'fijo') setActiveGameTab('fijo');
      else if (firstType === 'corrido') setActiveGameTab('corrido');
      else if (firstType === 'centena') setActiveGameTab('centena');
      else if (firstType === 'parlet') setActiveGameTab('parlet');
      else setActiveGameTab('numeros');
    }
  };

  // Función de envío de apuestas
  const sendBet = async () => {
    if (!selectedThrowId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Selecciona una tirada',
        position: 'top',
        topOffset: 60,
      });
      return;
    }
    
    // Validar números duplicados solo en la jugada actual (permitir solo en Parlet)
    let hasDuplicates = false;
    let hasNonParletDuplicates = false;

    // Verificar números duplicados solo en la jugada actual
    if (currentNumbers && selectedTypes.length > 0) {
      const currentPlayNumbers = getIndividualNumbers();
      const hasParletInCurrent = selectedTypes.includes('Parlet');
      
      // Verificar duplicados dentro de la jugada actual
      const seenNumbers = new Set<string>();
      const duplicateNumbers: string[] = [];
      
      currentPlayNumbers.forEach(num => {
        if (seenNumbers.has(num)) {
          hasDuplicates = true;
          duplicateNumbers.push(num);
        } else {
          seenNumbers.add(num);
        }
      });
      
      // Solo bloquear si hay duplicados Y NO es Parlet
      if (hasDuplicates && !hasParletInCurrent) {
        hasNonParletDuplicates = true;
      }
    }

    // Bloquear solo si hay duplicados en la jugada actual que NO es Parlet
    if (hasNonParletDuplicates) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se permiten números duplicados en la jugada actual que no sea Parlet',
        position: 'top',
        topOffset: 60,
      });
      return;
    }
    
    // Mostrar advertencia si hay duplicados pero son válidos (solo Parlet)
    if (hasDuplicates && !hasNonParletDuplicates) {
      Toast.show({
        type: 'success',
        text1: '✅ Números duplicados permitidos',
        text2: 'Para jugadas de Parlet',
        position: 'top',
        topOffset: 60,
      });
    }
    
    let finalPlays = [...allPlays];
    
    if (currentNumbers && selectedTypes.length > 0 && calculateCurrentAmount() > 0) {
      const validPlays = getValidPlays();
      if (validPlays.length > 0) {
        const currentPlay: Play = {
          id: Date.now().toString(),
          numbers: currentNumbers,
          validPlays: validPlays,
          amount: calculateCurrentAmount(),
          timestamp: new Date().toLocaleTimeString(),
          typeAmountInputs: JSON.parse(JSON.stringify(typeAmountInputs))
        };
        finalPlays.push(currentPlay);
      }
    }
    
    if (finalPlays.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No hay jugadas para enviar',
        position: 'top',
        topOffset: 60,
      });
      return;
    }
    
    // Mostrar confirmación
    Alert.alert(
      '🎯 Confirmar Apuesta',
      `¿Enviar apuesta por $${formatAmount(calculateTotalAmount())}?\n\n` +
        `${finalPlays.length} jugada${finalPlays.length !== 1 ? 's' : ''}\n` +
        `Lotería: ${lotteries.find((l) => l.id === selectedLotteryId)?.name}\n` +
        `Tirada: ${throws.find((t) => t.id === selectedThrowId)?.name}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            setIsSending(true);
            try {
              // Preparar los datos según el DTO CreateUserBetPlayDto
              const betPlays = finalPlays.map(play => {
                const moves = play.validPlays.map(validPlay => {
                  const playTypeId = getPlayTypeId(validPlay.type);

                  // Obtener montos por tipo guardados en la jugada (si existen)
                  const typeInputRaw = (play.typeAmountInputs && play.typeAmountInputs[validPlay.type]) || '';
                  const amountLines = typeInputRaw
                    ? typeInputRaw.split('\n').filter(line => (line || '').trim() !== '')
                    : [];

                  const combinations = Array.isArray(validPlay.combinations)
                    ? validPlay.combinations
                    : [];

                  // Construir moveDetails según el tipo de jugada
                  const moveDetails: any[] = [];

                  if (validPlay.type === 'Parlet') {
                    // Parlet: usar un monto base (primera línea) y mapear combinaciones "a-b"
                    const baseAmount = amountLines.length > 0 ? (parseFloat(amountLines[0]) || 0) : 0;

                    combinations.forEach(combo => {
                      if (typeof combo === 'string' && combo.includes('X')) {
                        const [firstStr, secondStr] = combo.split('X');
                        const first = parseInt((firstStr || '').trim(), 10);
                        const second = parseInt((secondStr || '').trim(), 10);
                        moveDetails.push({
                          number: isNaN(first) ? undefined : first,
                          secondNumber: isNaN(second) ? null : second,
                          amount: baseAmount
                        });
                      }
                    });
                  } else {
                    // Fijo, Corrido, Centena: monto por número (una línea por número o una única para todos)
                    combinations.forEach((numStr, idx) => {
                      const amount = amountLines.length === 1
                        ? (parseFloat(amountLines[0]) || 0)
                        : (parseFloat(amountLines[idx]) || 0);
                      const num = parseInt((numStr || '').trim(), 10);
                      moveDetails.push({
                        number: isNaN(num) ? undefined : num,
                        secondNumber: null,
                        amount: amount
                      });
                    });
                  }

                  return {
                    playTypeId,
                    moveDetails
                  };
                });

                return { moves };
              });

              // Usar los datos reales de las jugadas
              const currentDateTime = new Date();
              const utcDateTime = currentDateTime.toISOString();
              
              const betData = {
                throwId: selectedThrowId,
                date: utcDateTime, // DateTime completo en UTC
                betPlays: betPlays
              };

              await betService.sendUserBetPlay(betData);

              const totalAmount = finalPlays.reduce((total, play) => total + play.amount, 0);
              const totalCombinations = finalPlays.reduce((total, play) => 
                total + play.validPlays.reduce((subTotal, validPlay) => subTotal + validPlay.combinations.length, 0), 0
              );
      
      Toast.show({
        type: 'success',
                text1: '¡APUESTA ENVIADA EXITOSAMENTE!',
                text2: `$${formatAmount(totalAmount)} - ${finalPlays.length} jugada${finalPlays.length !== 1 ? 's' : ''}`,
        position: 'top',
        topOffset: 60,
                visibilityTime: 5000,
              });
              
              // Limpiar el formulario después del envío exitoso
              setTimeout(() => {
                setAllPlays([]);
                setCurrentNumbers('');
                setSelectedTypes([]);
                setTypeAmountInputs({});
                setActiveGameTab('numeros');
              }, 100);

            } catch (error: any) {
              console.error('Error al enviar la apuesta:', error);
              
              let errorMessage = 'Error desconocido';
              
              if (error.response) {
                if (error.response.status === 401) {
                  errorMessage = '🔐 Sesión expirada. Por favor, inicia sesión nuevamente.';
                  return;
                }
                
                if (error.response.data) {
                  if (error.response.data.message) {
                    if (error.response.data.message === 'BetOutOfTimeLimit') {
                      errorMessage = '⏰ La tirada seleccionada ya no acepta apuestas. Por favor selecciona una tirada activa.';
                    } else {
                      errorMessage = error.response.data.message;
                    }
                  } else if (error.response.data.details) {
                    errorMessage = error.response.data.details;
                  } else if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                  }
                }
              } else if (error.request) {
                errorMessage = 'Error de conexión con el servidor';
              } else {
                errorMessage = error.message || 'Error desconocido';
              }
              
      Toast.show({
        type: 'error',
                text1: 'Error al enviar la apuesta',
                text2: errorMessage,
        position: 'top',
        topOffset: 60,
                visibilityTime: 5000,
      });
    } finally {
              setIsSending(false);
            }
          },
        },
      ]
    );
  };

  // Estado de tirada
  const throwStatus = useMemo(() => {
    const selectedThrow = throws.find((t) => t.id === selectedThrowId);
    if (!selectedThrow) return null;

    const now = currentTime;
    const endTime = new Date(selectedThrow.endTime);

    if (endTime <= now) {
      return { status: 'closed', color: '#ef4444', text: 'Cerrada' };
    }

    const minutesRemaining = Math.floor((endTime.getTime() - now.getTime()) / (1000 * 60));

    if (minutesRemaining <= 30) {
      return { status: 'urgent', color: '#ef4444', text: `Cierra en ${minutesRemaining}min` };
    } else if (minutesRemaining <= 60) {
      return { status: 'warning', color: '#f59e0b', text: `Cierra en ${minutesRemaining}min` };
    }

    return { status: 'normal', color: '#22c55e', text: 'Abierta' };
  }, [throws, selectedThrowId, currentTime]);

  const availableTypes = getAvailableTypes();
  const totalAmount = calculateTotalAmount();

  // Convertir datos a opciones del combobox
  const lotteryOptions: ComboboxOption[] = lotteries.map(lottery => ({
    id: lottery.id,
    label: lottery.name,
    value: lottery.id,
  }));

  const throwOptions: ComboboxOption[] = throws.map(throwItem => ({
    id: throwItem.id,
    label: throwItem.name,
    value: throwItem.id,
  }));

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <Card title="Registrar Apuesta" icon="dice-outline">
          {/* Header con selectores de Lotería/Tirada y botón Enviar */}
          <View style={styles.headerContainer}>
            <View style={styles.selectorsContainer}>
              {/* Selector de Lotería */}
              <Combobox
                options={lotteryOptions}
                selectedValue={selectedLotteryId}
                onValueChange={(value) => {
                  setSelectedLotteryId(value);
                  setSelectedThrowId('');
                }}
                placeholder="📊 Lotería"
                loading={isLoadingLotteries}
                loadingText="🔄 Cargando..."
                emptyText="❌ No hay loterías disponibles"
                enabled={!isLoadingLotteries}
                style={styles.comboboxStyle}
              />
              
              {/* Selector de Tirada */}
              <Combobox
                options={throwOptions}
                selectedValue={selectedThrowId}
                onValueChange={setSelectedThrowId}
                placeholder="🎯 Tirada"
                loading={isLoadingThrows}
                loadingText="🔄 Cargando..."
                emptyText="❌ No hay tiradas disponibles"
                enabled={!isLoadingThrows && selectedLotteryId !== ''}
                style={styles.comboboxStyle}
              />

              {/* Estado de tirada */}
              {throwStatus && (
                <View style={[styles.statusBadge, { backgroundColor: throwStatus.color }]}>
                  <Text style={styles.statusText}>{throwStatus.text}</Text>
                </View>
              )}
            </View>

            {/* Botón Enviar */}
          <TouchableOpacity
              style={[
                styles.sendButton,
                (!hasValidAmounts() || isSending || !throwStatus || throwStatus.status === 'closed') && styles.sendButtonDisabled
              ]}
              onPress={sendBet}
              disabled={!hasValidAmounts() || isSending || !throwStatus || throwStatus.status === 'closed'}
            >
              <LinearGradient
                colors={(!hasValidAmounts() || isSending || !throwStatus || throwStatus.status === 'closed') 
                  ? ['#666', '#444'] 
                  : [colors.primaryGold, colors.primaryRed]}
                style={styles.sendButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="send-outline" size={16} color="white" />
                    <Text style={styles.sendButtonText}>Enviar</Text>
                  </>
                )}
              </LinearGradient>
          </TouchableOpacity>
          </View>

          {/* Indicador de modo AL */}
          {isAlMode && (
            <View style={styles.alIndicator}>
              <Text style={styles.alText}>
                🎯 AL activo: {alFirstNumber} → Ingresa el segundo número
              </Text>
            </View>
          )}

          {/* Tabla Unificada */}
          <View style={styles.unifiedTable}>
            {/* Header de la tabla */}
            <View style={styles.tableHeader}>
        <TouchableOpacity
                style={[styles.tableHeaderCell, activeGameTab === 'numeros' && styles.tableHeaderCellActive]}
                onPress={() => setActiveGameTab('numeros')}
        >
                <Text style={[styles.tableHeaderText, activeGameTab === 'numeros' && styles.tableHeaderTextActive]}>
                  🔢 Números
                </Text>
        </TouchableOpacity>
        <TouchableOpacity
                style={[styles.tableHeaderCell, selectedTypes.includes('Fijo') && styles.tableHeaderCellSelected]}
                onPress={() => setActiveGameTab('fijo')}
        >
                <Text style={[styles.tableHeaderText, selectedTypes.includes('Fijo') && styles.tableHeaderTextSelected]}>
                  🎯 Fijo
                </Text>
        </TouchableOpacity>
        <TouchableOpacity
                style={[styles.tableHeaderCell, selectedTypes.includes('Corrido') && styles.tableHeaderCellSelected]}
                onPress={() => setActiveGameTab('corrido')}
              >
                <Text style={[styles.tableHeaderText, selectedTypes.includes('Corrido') && styles.tableHeaderTextSelected]}>
                  🎲 Corrido
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tableHeaderCell, selectedTypes.includes('Centena') && styles.tableHeaderCellSelected]}
                onPress={() => setActiveGameTab('centena')}
              >
                <Text style={[styles.tableHeaderText, selectedTypes.includes('Centena') && styles.tableHeaderTextSelected]}>
                  🎯 Centena
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tableHeaderCell, selectedTypes.includes('Parlet') && styles.tableHeaderCellSelected]}
                onPress={() => setActiveGameTab('parlet')}
              >
                <Text style={[styles.tableHeaderText, selectedTypes.includes('Parlet') && styles.tableHeaderTextSelected]}>
                  🎯 Parlet
                </Text>
        </TouchableOpacity>
      </View>
      
            {/* Filas de la tabla */}
            <ScrollView style={styles.tableBody} nestedScrollEnabled>
              {getIndividualNumbers().length > 0 ? (
                getIndividualNumbers().map((number, index) => (
                  <View key={index} style={styles.tableRow}>
                    {/* Celda Número */}
                    <View style={[styles.tableCell, activeGameTab === 'numeros' && styles.tableCellActive]}>
                      <Text style={styles.numberText}>{formatNumberDisplay(number)}</Text>
                    </View>
                    
                    {/* Celda Fijo */}
      <TouchableOpacity
                      style={[styles.tableCell, activeGameTab === 'fijo' && styles.tableCellActive]}
                      onPress={() => setActiveGameTab('fijo')}
                    >
                      <Text style={styles.amountText}>
                        {(() => {
                          const fijoAmounts = typeAmountInputs['Fijo'] || '';
                          const amountLines = fijoAmounts.split('\n');
                          const amount = amountLines[index] || '';
                          return amount ? `$${amount}` : '';
                        })()}
                      </Text>
                    </TouchableOpacity>
                    
                    {/* Celda Corrido */}
                    <TouchableOpacity
                      style={[styles.tableCell, activeGameTab === 'corrido' && styles.tableCellActive]}
                      onPress={() => setActiveGameTab('corrido')}
                    >
                      <Text style={styles.amountText}>
                        {(() => {
                          const corridoAmounts = typeAmountInputs['Corrido'] || '';
                          const amountLines = corridoAmounts.split('\n');
                          const amount = amountLines[index] || '';
                          return amount ? `$${amount}` : '';
                        })()}
                      </Text>
                    </TouchableOpacity>
                    
                    {/* Celda Centena */}
                    <TouchableOpacity
                      style={[styles.tableCell, activeGameTab === 'centena' && styles.tableCellActive]}
                      onPress={() => setActiveGameTab('centena')}
                    >
                      <Text style={styles.amountText}>
                        {(() => {
                          const centenaAmounts = typeAmountInputs['Centena'] || '';
                          const amountLines = centenaAmounts.split('\n');
                          const amount = amountLines[index] || '';
                          return amount ? `$${amount}` : '';
                        })()}
                      </Text>
                    </TouchableOpacity>
                    
                    {/* Celda Parlet */}
                    <TouchableOpacity
                      style={[styles.tableCell, activeGameTab === 'parlet' && styles.tableCellActive]}
                      onPress={() => setActiveGameTab('parlet')}
                    >
                      <Text style={styles.amountText}>
                        {(() => {
                          const parletAmounts = typeAmountInputs['Parlet'] || '';
                          const amountLines = parletAmounts.split('\n');
                          // Para Parlet, mostrar el monto solo en la primera fila (monto base único)
                          const amount = index === 0 ? (amountLines[0] || '') : '';
                          return amount ? `$${amount}` : '';
                        })()}
                      </Text>
      </TouchableOpacity>
    </View>
                ))
              ) : (
                <View style={styles.emptyTableMessage}>
                  <Text style={styles.emptyTableText}>Escribe números para comenzar a apostar...</Text>
                </View>
              )}
            </ScrollView>
          </View>

          {/* Total */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>Total $ {formatAmount(totalAmount)}</Text>
          </View>

          {/* Input oculto para capturar teclado */}
        <TextInput
          ref={numbersInputRef}
            style={styles.hiddenInput}
          value={currentNumbers}
            onChangeText={() => {}} // No hacer nada aquí
            onKeyPress={(e) => {
              // Manejar teclas especiales
              if (e.nativeEvent.key === 'Enter') {
                addComma();
              } else if (e.nativeEvent.key === 'Backspace') {
                backspace();
              } else if (e.nativeEvent.key === '.') {
                addDecimalPoint();
              } else if (/^[0-9]$/.test(e.nativeEvent.key)) {
                addNumber(e.nativeEvent.key);
              }
            }}
            autoFocus
            autoComplete="off"
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Escribe números aquí..."
          />

          {/* Jugadas registradas */}
          {allPlays.length > 0 && (
            <View style={styles.playsSection}>
              <Text style={styles.playsSectionTitle}>
                🎯 JUGADAS REGISTRADAS ({allPlays.length})
            </Text>
              <ScrollView style={styles.playsList} nestedScrollEnabled>
                {allPlays.map((play) => (
                  <View key={play.id} style={styles.playItem}>
                    <View style={styles.playItemContent}>
                      <View style={styles.playHeader}>
                        <Text style={styles.playTimestamp}>🔢 {play.timestamp}</Text>
                        <View style={styles.playActions}>
                          <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => editPlay(play)}
                          >
                            <Text style={styles.editButtonText}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => removePlay(play.id)}
                          >
                            <Text style={styles.deleteButtonText}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      {/* Mostrar números */}
                      <View style={styles.playNumbers}>
                        <Text style={styles.playNumbersLabel}>Números:</Text>
                        <View style={styles.playNumbersList}>
                          {play.numbers.split('\n').filter(num => num.trim() !== '').map((number, idx) => (
                            <View key={idx} style={styles.playNumberBadge}>
                              <Text style={styles.playNumberText}>{formatNumberDisplay(number)}</Text>
                </View>
              ))}
            </View>
          </View>

                      {/* Mostrar detalles por tipo */}
                      {play.validPlays.map((validPlay, idx) => (
                        <View key={idx} style={styles.playTypeDetails}>
                          <Text style={[styles.playTypeName, { color: PLAY_TYPE_COLORS[validPlay.type] || colors.primaryGold }]}>
                            {validPlay.type}:
                          </Text>
                          <Text style={styles.playTypeInfo}>
                            {validPlay.type === 'Parlet' 
                              ? `${validPlay.combinations.length} combinaciones`
                              : `${validPlay.combinations.length} números`
                            }
                          </Text>
                          <Text style={styles.playTypeAmount}>
                            ${formatAmount(validPlay.totalCost)} USD
                          </Text>
    </View>
                      ))}
                      
                      <Text style={styles.playTotal}>
                        Total: ${formatAmount(play.amount)} USD
            </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Botones de Tipos de Juego */}
          <View style={styles.typesGrid}>
            {playTypes.map(type => {
              const isAvailable = availableTypes.includes(type.name);
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeButton,
                    selectedTypes.includes(type.name) && styles.typeButtonSelected,
                    selectedTypes.includes(type.name) && {
                      backgroundColor: PLAY_TYPE_COLORS[type.name] || colors.primaryGold,
                      borderColor: PLAY_TYPE_COLORS[type.name] || colors.primaryGold,
                    },
                    !isAvailable && styles.typeButtonDisabled
                  ]}
                  onPress={() => toggleType(type.name)}
                    disabled={!isAvailable}
                  >
                  <Text
                    style={[
                      styles.typeButtonText,
                      selectedTypes.includes(type.name) && styles.typeButtonTextSelected,
                      !isAvailable && styles.typeButtonTextDisabled
                    ]}
                  >
                          {type.name}
                        </Text>
                  </TouchableOpacity>
                );
              })}
          </View>

          {/* Teclado numérico */}
          <View style={styles.keyboard}>
            <View style={styles.keyboardRow}>
              {['7', '8', '9'].map(num => (
                <TouchableOpacity
                  key={num}
                  style={styles.numberKey}
                  onPress={() => addNumber(num)}
                >
                  <Text style={styles.numberKeyText}>{num}</Text>
                </TouchableOpacity>
              ))}
                    </View>
            <View style={styles.keyboardRow}>
              {['4', '5', '6'].map(num => (
                <TouchableOpacity
                  key={num}
                  style={styles.numberKey}
                  onPress={() => addNumber(num)}
                >
                  <Text style={styles.numberKeyText}>{num}</Text>
                </TouchableOpacity>
                  ))}
                </View>
            <View style={styles.keyboardRow}>
              {['1', '2', '3'].map(num => (
                <TouchableOpacity
                  key={num}
                  style={styles.numberKey}
                  onPress={() => addNumber(num)}
                >
                  <Text style={styles.numberKeyText}>{num}</Text>
                </TouchableOpacity>
              ))}
              </View>
            <View style={styles.keyboardRow}>
              <TouchableOpacity
                style={styles.numberKey}
                onPress={addDecimalPoint}
              >
                <Text style={styles.numberKeyText}>.</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.numberKey}
                onPress={() => addNumber('0')}
              >
                <Text style={styles.numberKeyText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.numberKey}
                onPress={backspace}
              >
                <Text style={styles.numberKeyText}>←</Text>
              </TouchableOpacity>
                      </View>
              </View>
              
          {/* Botones de acción */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.copyButton]}
              onPress={() => {
                // Función para copiar monto a todos los números
                const numbers = getIndividualNumbers();
                if (numbers.length === 0) return;

                selectedTypes.forEach(typeName => {
                  const currentInput = typeAmountInputs[typeName] || '';
                  const amountLines = currentInput.split('\n').filter(line => line.trim() !== '');
                  
                  if (amountLines.length > 0) {
                    const firstAmount = amountLines[0];
                    
                    if (typeName === 'Parlet') {
                      setTypeAmountInputs(prev => ({
                        ...prev,
                        [typeName]: firstAmount
                      }));
                    } else {
                      const newAmounts = numbers.map(() => firstAmount).join('\n');
                      setTypeAmountInputs(prev => ({
                        ...prev,
                        [typeName]: newAmounts
                      }));
                    }
                  }
                });
              }}
              disabled={availableTypes.length === 0}
            >
              <Text style={styles.actionButtonText}>Todos</Text>
            </TouchableOpacity>
              
              <TouchableOpacity
              style={[styles.actionButton, styles.alButton]}
              onPress={applyAl}
              disabled={getIndividualNumbers().length !== 1}
            >
              <Text style={styles.actionButtonText}>AL</Text>
              </TouchableOpacity>
            
        <TouchableOpacity
              style={[styles.actionButton, styles.enterButton]}
              onPress={addComma}
            >
              <Text style={styles.actionButtonText}>Enter</Text>
        </TouchableOpacity>
          </View>
        
          {/* Botones Eliminar y Separar Jugada */}
          <View style={styles.bottomButtons}>
        <TouchableOpacity
              style={[styles.actionButton, styles.clearButton]}
              onPress={clearAll}
              disabled={!currentNumbers && allPlays.length === 0}
            >
              <Text style={styles.actionButtonText}>🗑️ Eliminar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
              style={[styles.actionButton, styles.separateButton]}
              onPress={separatePlay}
              disabled={!currentNumbers || selectedTypes.length === 0 || calculateCurrentAmount() <= 0}
            >
              <Text style={styles.actionButtonText}>🎯 Separar Jugada</Text>
        </TouchableOpacity>
      </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  selectorsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  comboboxStyle: {
    flex: 1,
    minWidth: 100,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: 'white',
  },
  sendButton: {
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    minWidth: 80,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  sendButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: 'white',
  },
  alIndicator: {
    backgroundColor: `${colors.primaryGold}20`,
    borderWidth: 2,
    borderColor: colors.primaryGold,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  alText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primaryGold,
  },
  unifiedTable: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: `${colors.primaryGold}20`,
  },
  tableHeaderCell: {
    flex: 1,
    padding: spacing.sm,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.inputBorder,
  },
  tableHeaderCellActive: {
    backgroundColor: `${colors.primaryGold}30`,
  },
  tableHeaderCellSelected: {
    backgroundColor: `${colors.primaryGold}20`,
  },
  tableHeaderText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
    opacity: 0.8,
  },
  tableHeaderTextActive: {
    opacity: 1,
  },
  tableHeaderTextSelected: {
    opacity: 1,
  },
  tableBody: {
    maxHeight: 200,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  tableCell: {
    flex: 1,
    padding: spacing.sm,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.inputBorder,
    minHeight: 40,
    justifyContent: 'center',
  },
  tableCellActive: {
    backgroundColor: `${colors.primaryGold}10`,
  },
  numberText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    color: colors.primaryGold,
    fontFamily: 'monospace',
  },
  amountText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
  },
  emptyTableMessage: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyTableText: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
    fontStyle: 'italic',
  },
  totalContainer: {
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  totalText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
  },
  hiddenInput: {
    position: 'absolute',
    top: -100,
    opacity: 0,
    width: 1,
    height: 1,
  },
  playsSection: {
    marginBottom: spacing.md,
  },
  playsSectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.subtleGrey,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  playsList: {
    maxHeight: 200,
  },
  playItem: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryGold,
  },
  playItemContent: {
    flex: 1,
  },
  playHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  playTimestamp: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
    fontFamily: 'monospace',
  },
  playActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  editButton: {
    backgroundColor: colors.primaryGold,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    minWidth: 24,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: fontSize.xs,
    color: 'white',
  },
  deleteButton: {
    backgroundColor: colors.primaryRed,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    minWidth: 24,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: fontSize.xs,
    color: 'white',
  },
  playNumbers: {
    marginBottom: spacing.sm,
  },
  playNumbersLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primaryGold,
    marginBottom: spacing.xs,
  },
  playNumbersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  playNumberBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: `${colors.primaryGold}40`,
  },
  playNumberText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    color: colors.primaryGold,
    fontFamily: 'monospace',
  },
  playTypeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  playTypeName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  playTypeInfo: {
    fontSize: fontSize.xs,
    color: colors.lightText,
    flex: 1,
  },
  playTypeAmount: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
  },
  playTotal: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.darkBackground,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  typeButtonSelected: {
    borderWidth: 2,
  },
  typeButtonDisabled: {
    opacity: 0.4,
  },
  typeButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
  },
  typeButtonTextSelected: {
    color: 'white',
  },
  typeButtonTextDisabled: {
    color: colors.subtleGrey,
  },
  keyboard: {
    marginBottom: spacing.md,
  },
  keyboardRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  numberKey: {
    flex: 1,
    backgroundColor: colors.darkBackground,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  numberKeyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    color: colors.lightText,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  copyButton: {
    backgroundColor: colors.primaryGold,
  },
  alButton: {
    backgroundColor: colors.primaryGold,
  },
  enterButton: {
    backgroundColor: colors.primaryGold,
  },
  clearButton: {
    backgroundColor: colors.primaryRed,
  },
  separateButton: {
    backgroundColor: '#22c55e',
  },
  actionButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: 'white',
  },
});

export default RegistrarApuesta;
