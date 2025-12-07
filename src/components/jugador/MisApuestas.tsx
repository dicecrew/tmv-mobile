import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';
import Card from '../common/Card';
import DateRangePicker from '../common/DateRangePicker';
import Toast from 'react-native-toast-message';
import { betService } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';

interface ThrowResult {
  id: string;
  throwId: string;
  throwName: string;
  date: string;
  centena: string;
  corrido1: string;
  corrido2: string;
  totalProfit: number;
  totalRevenue: number;
  createdAt: string;
  updatedAt: string | null;
}

interface BetResume {
  id: string;
  date: string;
  lotteryName: string;
  throwName: string;
  completed: boolean;
  revenue: number;
  bets: Bet[];
  throwResult?: ThrowResult | null;
  throwEndTime?: string | null;
  throwId?: string;
}

interface Bet {
  id: string;
  date: string;
  lotteryName: string;
  throwName: string;
  stateCode: string;
  betPlays?: BetPlay[];
}

interface BetPlay {
  playTypeName: string;
  moves?: Move[];
}

interface MoveDetail {
  number?: string;
  secondNumber?: string;
  amount?: number;
  profit?: number;
}

interface Move {
  totalAmount: number;
  profit: number;
  numbers?: string;
  moveDetails?: MoveDetail[];
  playTypeName?: string;
}

interface DateGroup {
  [dateKey: string]: BetResume[];
}

const MisApuestas: React.FC = () => {
  const { user } = useAuth();

  // Fechas por defecto (últimos 7 días)
  const getSevenDaysAgo = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  };

  const [fromDate, setFromDate] = useState(getSevenDaysAgo());
  const [toDate, setToDate] = useState(new Date());
  const [showHistory, setShowHistory] = useState(false);
  const [betResumes, setBetResumes] = useState<BetResume[]>([]);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [expandedBets, setExpandedBets] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Cargar apuestas del usuario
  const loadUserBets = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Convertir fechas a UTC
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);

      const params = {
        from: from.toISOString(),
        to: to.toISOString(),
      };

      const response = await betService.getUserBetsRange(params);

      // Procesar respuesta manteniendo estructura de betResume
      const processedBetResumes: BetResume[] = [];
      const apiData = response?.data || response;

      if (apiData && apiData.lotteries) {
        apiData.lotteries.forEach((lottery: any) => {
          lottery.throws?.forEach((throwData: any) => {
            throwData.betResumes?.forEach((betResume: any) => {
              const bets: Bet[] = [];
              
              // Procesar bets del betResume
              if (betResume.bets && Array.isArray(betResume.bets)) {
                betResume.bets.forEach((bet: any) => {
                  bets.push({
                    ...bet,
                    lotteryName: lottery.lotteryName,
                    throwName: throwData.throwName,
                  });
                });
              }

              processedBetResumes.push({
                id: betResume.id,
                date: betResume.date,
                lotteryName: lottery.lotteryName,
                throwName: throwData.throwName,
                completed: betResume.completed || false,
                revenue: betResume.revenue || 0,
                bets: bets,
                throwResult: betResume.throwResult || null,
                throwEndTime: throwData.endTime || null,
                throwId: throwData.id,
              });
            });
          });
        });
      } else {
        console.warn('⚠️ Estructura de respuesta inesperada:', apiData);
      }

      setBetResumes(processedBetResumes);
      setShowHistory(true);
      setShowFilters(false); // Ocultar filtros después de buscar
    } catch (error) {
      console.error('Error loading bets:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron cargar las apuestas',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar cambio de rango de fechas
  const handleDateRangeChange = (dateFrom: Date, dateTo: Date) => {
    setFromDate(dateFrom);
    setToDate(dateTo);
  };

  // Convertir fecha UTC a fecha local (solo fecha, sin hora)
  const getLocalDateKey = (utcDateString: string): string => {
    try {
      const utcDate = new Date(utcDateString);
      if (isNaN(utcDate.getTime())) {
        return utcDateString.split('T')[0]; // Fallback si no se puede parsear
      }
      // Obtener año, mes y día en hora local
      const year = utcDate.getFullYear();
      const month = String(utcDate.getMonth() + 1).padStart(2, '0');
      const day = String(utcDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error convirtiendo fecha UTC a local:', error);
      return utcDateString.split('T')[0];
    }
  };

  // Agrupar betResumes por fecha (convertida a local)
  const groupedBetResumes: DateGroup = useMemo(() => {
    const grouped: DateGroup = {};

    betResumes.forEach((betResume) => {
      // Convertir fecha UTC a fecha local para agrupación
      const dateKey = getLocalDateKey(betResume.date);

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(betResume);
    });

    // Ordenar fechas descendentemente
    const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
    const sortedGrouped: DateGroup = {};
    sortedKeys.forEach((key) => {
      sortedGrouped[key] = grouped[key].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    });

    return sortedGrouped;
  }, [betResumes]);

  // Resumen por fecha
  const getDateSummary = (dateBetResumes: BetResume[]) => {
    let totalAmount = 0;
    let totalProfit = 0;
    let totalMoves = 0;
    let wonBets = 0;
    let lostBets = 0;
    let pendingBets = 0;
    let totalBets = 0;

    dateBetResumes.forEach((betResume) => {
      betResume.bets.forEach((bet) => {
        totalBets++;
        // Contar estados de apuestas
        switch (bet.stateCode) {
          case 'WON':
          case 'Approved':
          case 'PAID':
            wonBets++;
            break;
          case 'LOST':
            lostBets++;
            break;
          case 'PENDING':
          case 'ACTIVE':
          case 'New':
            pendingBets++;
            break;
        }

        bet.betPlays?.forEach((betPlay) => {
          betPlay.moves?.forEach((move) => {
            totalAmount += move.totalAmount || 0;
            totalProfit += move.profit || 0;
            totalMoves++;
          });
        });
      });
    });

    return { 
      totalAmount, 
      totalProfit, 
      totalBets,
      totalMoves,
      wonBets,
      lostBets,
      pendingBets
    };
  };

  // Formatear fecha
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', {
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
        day: 'numeric',
      });
    }
  };

  // Convertir hora UTC a local
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
      
      const hours = utcDateTime.getHours();
      const minutes = utcDateTime.getMinutes();
      const seconds = utcDateTime.getSeconds();
      const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
      const hours12 = hours % 12 || 12;
      
      return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;
    } catch (error) {
      console.error('Error converting UTC time to local:', error);
      return utcTimeString;
    }
  };

  // Formatear fecha corta para jugadas
  const formatShortDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Si no se puede parsear, devolver el string original
      }
      return date.toLocaleDateString('es-ES', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Error formateando fecha corta:', error);
      return dateString;
    }
  };

  // Formatear fecha y hora completa según imagen (3/12/2025 3:06:15 a.m.)
  const formatFullDateTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
      const hours12 = hours % 12 || 12;
      
      return `${day}/${month}/${year} ${hours12}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;
    } catch (error) {
      console.error('Error formateando fecha y hora completa:', error);
      return dateString;
    }
  };

  // Estado y color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'WON':
      case 'Approved':
      case 'PAID':
        return '#22c55e';
      case 'LOST':
        return '#ef4444';
      case 'PENDING':
      case 'New':
        return '#f59e0b';
      case 'CANCELLED':
        return '#6b7280';
      case 'ACTIVE':
        return '#3b82f6';
      default:
        return colors.subtleGrey;
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'WON':
        return '🏆';
      case 'LOST':
        return '❌';
      case 'PENDING':
        return '⏳';
      case 'Approved':
        return '✅';
      case 'PAID':
        return '💰';
      case 'CANCELLED':
        return '🚫';
      case 'ACTIVE':
        return '🔄';
      case 'New':
        return '🆕';
      default:
        return '❓';
    }
  };

  const getBetStatus = (bet: Bet): string => {
    if (bet.stateCode) {
      const statusMap: { [key: string]: string } = {
        WON: 'Ganada',
        LOST: 'Perdida',
        PENDING: 'Pendiente',
        CANCELLED: 'Cancelada',
        ACTIVE: 'Activa',
        PAID: 'Pagada',
        APPROVED: 'Aprobada',
        New: 'Nueva',
      };
      return statusMap[bet.stateCode] || bet.stateCode;
    }
    return 'Pendiente';
  };

  // Formatear monto
  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const getBetTypeColor = (playTypeName: string): string => {
    switch (playTypeName?.toUpperCase()) {
      case 'FIJO':
        return '#2563eb'; // Azul
      case 'CORRIDO':
        return '#16a34a'; // Verde
      case 'CENTENA':
        return '#7c3aed'; // Morado
      case 'PARLET':
        return '#dc2626'; // Rojo
      default:
        return colors.primaryGold;
    }
  };

  // Alternar expansión de apuesta
  const toggleExpandBet = (betId: string) => {
    setExpandedBets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(betId)) {
        newSet.delete(betId);
      } else {
        newSet.add(betId);
      }
      return newSet;
    });
  };

  const getMoveNumberList = (betPlayName: string, move: Move): string[] => {
    if (move.moveDetails?.length) {
      return move.moveDetails
        .map(detail => {
          const baseNumber = detail.number?.toString().trim() ?? '';
          const second = detail.secondNumber?.toString().trim();

          const formattedNumber = baseNumber || 'N/A';

          if ((betPlayName?.toLowerCase() === 'parlet' || betPlayName?.toLowerCase() === 'parlay') && second) {
            return `${formattedNumber}X${second}`;
          }

          if (!formattedNumber) {
            return null;
          }

          return formattedNumber;
        })
        .filter(Boolean)
        .map(value => value!);
    }

    if (move.numbers) {
      return move.numbers
        .split(/[\s,]+/)
        .map(num => num.trim())
        .filter(Boolean);
    }

    return [];
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setFromDate(getSevenDaysAgo());
    setToDate(new Date());
    setShowHistory(false);
    setBetResumes([]);
    setExpandedDate(null);
    setExpandedBets(new Set());
  };
    
    // Calcular resúmenes generales
  const totalJugadas = betResumes.reduce((total, betResume) => total + betResume.bets.length, 0);
  const totalApostado = betResumes.reduce((total, betResume) => {
    return total + betResume.bets.reduce((betTotal, bet) => {
      return betTotal + (bet.betPlays?.reduce((playTotal, play) => 
        playTotal + (play.moves?.reduce((moveTotal, move) => moveTotal + (move.totalAmount || 0), 0) || 0), 0) || 0);
    }, 0);
  }, 0);
  const totalGanado = betResumes.reduce((total, betResume) => {
    return total + betResume.bets.reduce((betTotal, bet) => {
      return betTotal + (bet.betPlays?.reduce((playTotal, play) => 
        playTotal + (play.moves?.reduce((moveTotal, move) => moveTotal + (move.profit || 0), 0) || 0), 0) || 0);
    }, 0);
  }, 0);
    
    return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="time-outline" size={24} color={colors.primaryGold} />
          <Text style={styles.headerTitle}>Mis Jugadas</Text>
        </View>
        <TouchableOpacity 
          style={styles.filtersButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options-outline" size={20} color={colors.primaryGold} />
          <Text style={styles.filtersButtonText}>FILTROS</Text>
                </TouchableOpacity>
            </View>

      <Text style={styles.description}>Revisa tus jugadas anteriores y su estado.</Text>

      {/* Filtros */}
      {showFilters && (
        <View style={styles.filtersSection}>
          <DateRangePicker
            dateFrom={fromDate}
            dateTo={toDate}
            onDateFromChange={setFromDate}
            onDateToChange={setToDate}
            onRangeChange={handleDateRangeChange}
            label="Rango de Fechas"
            maximumDate={new Date()}
            dateFormat="short"
            showLabels={true}
            required={true}
            helpText="Selecciona el rango de fechas para consultar tus apuestas"
          />
            
            <TouchableOpacity
              style={styles.searchButton}
              onPress={loadUserBets}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[colors.primaryGold, colors.primaryRed]}
                style={styles.searchButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.darkBackground} />
                ) : (
                  <>
                    <Ionicons name="search-outline" size={20} color={colors.darkBackground} />
                    <Text style={styles.searchButtonText}>Buscar Historial</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

      {/* Tarjetas de Resumen */}
      <View style={styles.summaryCards}>
        <View style={[styles.summaryCard, styles.summaryCardYellow]}>
          <Ionicons name="dice-outline" size={24} color={colors.darkBackground} />
          <Text style={styles.summaryCardLabel}>TOTAL JUGADAS</Text>
          <Text style={styles.summaryCardValue}>{totalJugadas}</Text>
        </View>
        
        <View style={[styles.summaryCard, styles.summaryCardRed]}>
          <Ionicons name="wallet-outline" size={24} color={colors.darkBackground} />
          <Text style={styles.summaryCardLabel}>TOTAL APOSTADO</Text>
          <Text style={styles.summaryCardValue}>${formatAmount(totalApostado)}</Text>
        </View>
        
        <View style={[styles.summaryCard, styles.summaryCardGreen]}>
          <Ionicons name="trophy-outline" size={24} color={colors.darkBackground} />
          <Text style={styles.summaryCardLabel}>TOTAL GANADO</Text>
          <Text style={styles.summaryCardValue}>${formatAmount(totalGanado)}</Text>
        </View>
      </View>


        {/* Resultados */}
        {showHistory && (
          <View style={styles.historySection}>
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primaryGold} />
                <Text style={styles.loadingText}>Cargando...</Text>
              </View>
            )}
            
            {!isLoading && Object.keys(groupedBetResumes).length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={64} color={colors.subtleGrey} />
                <Text style={styles.emptyText}>No hay apuestas en este período</Text>
              </View>
            )}

            <ScrollView style={styles.datesList} nestedScrollEnabled>
              {Object.entries(groupedBetResumes).map(([dateKey, dateBetResumes]) => {
                const summary = getDateSummary(dateBetResumes);
                const isExpanded = expandedDate === dateKey;

                return (
                  <View key={dateKey}>
                  {/* Agrupación por Fecha */}
                  <TouchableOpacity
                    style={styles.dateGroupHeader}
                    onPress={() => setExpandedDate(isExpanded ? null : dateKey)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dateGroupContent}>
                      <View style={styles.dateGroupLeft}>
                        <View style={styles.dateIconCircle}>
                          <Ionicons name="calendar" size={18} color={colors.primaryGold} />
                        </View>
                        <View style={styles.dateGroupInfo}>
                          <Text style={styles.dateGroupText}>{formatDate(dateKey)}</Text>
                          <Text style={styles.dateGroupCount}>
                            {summary.totalBets} jugada{summary.totalBets !== 1 ? 's' : ''} • ${formatAmount(summary.totalAmount)}
                          </Text>
                        </View>
                      </View>
                      <Ionicons 
                        name={isExpanded ? 'chevron-up-circle' : 'chevron-down-circle'} 
                        size={24} 
                        color={colors.primaryGold} 
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Detalles de BetResumes */}
                    {isExpanded && (
                    <View style={styles.betsContainer}>
                        {dateBetResumes.map((betResume) => {
                          const isBetResumeExpanded = expandedBets.has(betResume.id);
                          const betResumeTotalAmount = betResume.bets.reduce((total, bet) => 
                            total + (bet.betPlays?.reduce((playTotal, play) => 
                              playTotal + (play.moves?.reduce((moveTotal, move) => moveTotal + (move.totalAmount || 0), 0) || 0), 0) || 0), 0);
                          const betResumeTotalProfit = betResume.bets.reduce((total, bet) => 
                            total + (bet.betPlays?.reduce((playTotal, play) => 
                              playTotal + (play.moves?.reduce((moveTotal, move) => moveTotal + (move.profit || 0), 0) || 0), 0) || 0), 0);

                          return (
                        <View key={betResume.id} style={styles.betCard}>
                          {/* Header del BetResume */}
                          <View style={styles.betCardHeader}>
                            {/* Primera línea: Lotería y Estado */}
                            <View style={styles.betCardFirstRow}>
                              <View style={styles.betCardTitleRow}>
                                <Ionicons name="business-outline" size={14} color={colors.lightText} />
                                <Text style={styles.betCardTitle}>
                                  {betResume.lotteryName} • {betResume.throwName}
                                </Text>
                              </View>
                              <View
                                style={[
                                  styles.betCardStatus,
                                  { backgroundColor: betResume.throwResult ? getStatusColor('PAID') : getStatusColor('PENDING') }
                                ]}
                              >
                                <Text style={styles.betCardStatusText}>
                                  {betResume.throwResult ? '✅ Con resultados' : '⌛ Sin resultados'}
                                </Text>
                              </View>
                            </View>

                            {/* Segunda línea: Fecha y botón expandir */}
                            <TouchableOpacity
                              style={styles.betCardSecondRow}
                              onPress={() => toggleExpandBet(betResume.id)}
                              activeOpacity={0.7}
                            >
                              <View style={styles.betCardDateContainer}>
                                <Text style={styles.betCardDate}>
                                  📅 Fecha: {formatFullDateTime(betResume.date)}
                                </Text>
                                {betResume.throwEndTime && (
                                  <Text style={styles.betCardDate}>
                                    Hora de Cierre: {convertUtcTimeToLocal(betResume.throwEndTime)}
                                  </Text>
                                )}
                                <Text style={styles.betCardStatusLabel}>
                                  Estado Tirada: {betResume.throwResult ? '✅ Con resultados' : '⌛ Pendiente'}
                                </Text>
                              </View>
                              <Ionicons
                                name={isBetResumeExpanded ? 'chevron-up-circle' : 'chevron-down-circle'}
                                size={18}
                                color={colors.primaryGold}
                              />
                            </TouchableOpacity>
                          </View>

                          {/* Detalle del BetResume - Solo visible si está expandido */}
                          {isBetResumeExpanded && (
                            <View style={styles.betCardDetails}>
                              {/* Información del ThrowResult - Solo mostrar si hay resultados */}
                              {betResume.throwResult && (
                                <View style={styles.throwResultContainer}>
                                  <Text style={styles.throwResultTitle}>Resultados de la Tirada:</Text>
                                  <View style={styles.throwResultDetails}>
                                    <Text style={styles.throwResultText}>Centena: {betResume.throwResult.centena}</Text>
                                    <Text style={styles.throwResultText}>Corrido 1: {betResume.throwResult.corrido1}</Text>
                                    <Text style={styles.throwResultText}>Corrido 2: {betResume.throwResult.corrido2}</Text>
                                  </View>
                                </View>
                              )}

                              {/* Jugadas del BetResume */}
                              <View style={styles.jugadasSection}>
                                <Text style={styles.jugadasTitle}>🎲 JUGADAS</Text>
                                {betResume.bets.map((bet) => {
                                  const betKey = `${betResume.id}-${bet.id}`;
                                  const isBetExpanded = expandedBets.has(betKey);
                                  const totalAmount = bet.betPlays?.reduce((total, play) => 
                                    total + (play.moves?.reduce((moveTotal, move) => moveTotal + (move.totalAmount || 0), 0) || 0), 0) || 0;
                                  const totalProfit = bet.betPlays?.reduce((total, play) => 
                                    total + (play.moves?.reduce((moveTotal, move) => moveTotal + (move.profit || 0), 0) || 0), 0) || 0;

                                  return (
                                    <View key={bet.id} style={styles.betItemCard}>
                                      {/* Header de la Jugada */}
                                      <TouchableOpacity
                                        style={styles.betItemHeader}
                                        onPress={() => toggleExpandBet(betKey)}
                                        activeOpacity={0.7}
                                      >
                                        <View style={styles.betItemHeaderLeft}>
                                          <View
                                            style={[
                                              styles.betItemStatus,
                                              { backgroundColor: getStatusColor(bet.stateCode) }
                                            ]}
                                          >
                                            <Text style={styles.betItemStatusText}>
                                              {getStatusIcon(bet.stateCode)} {getBetStatus(bet)}
                                            </Text>
                                          </View>
                                          <Text style={styles.betItemDate}>
                                            📅 {formatShortDate(bet.date)} • {new Date(bet.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                          </Text>
                                        </View>
                                        <Ionicons
                                          name={isBetExpanded ? 'chevron-up-circle' : 'chevron-down-circle'}
                                          size={18}
                                          color={colors.primaryGold}
                                        />
                                      </TouchableOpacity>

                                      {/* Detalle de números - Solo visible si está expandido */}
                                      {isBetExpanded && (
                                        <View style={styles.betItemDetails}>
                                          <ScrollView 
                                            style={styles.allNumbersContainer}
                                            nestedScrollEnabled
                                          >
                                            <View style={styles.numbersContent}>
                                              {bet.betPlays?.map((betPlay, betPlayIdx) => (
                                                <React.Fragment key={betPlayIdx}>
                                                  {(betPlay.moves || []).map((move, moveIdx) => (
                                                    <React.Fragment key={`${betPlayIdx}-${moveIdx}`}>
                                                      {(move.moveDetails || []).map((detail, detailIdx) => {
                                                        const playType = move.playTypeName || betPlay.playTypeName || 'JUGADA';
                                                        const isParlet = playType.toUpperCase() === 'PARLET';
                                                        const numberDisplay = detail.secondNumber 
                                                          ? (isParlet ? `${detail.number}x${detail.secondNumber}` : `${detail.number} - ${detail.secondNumber}`)
                                                          : detail.number;
                                                        
                                                        return (
                                                          <View key={`${betPlayIdx}-${moveIdx}-${detailIdx}`} style={styles.numberRow}>
                                                            <View style={styles.numberInfo}>
                                                              <View
                                                                style={[
                                                                  styles.miniTypeBadge,
                                                                  { backgroundColor: getBetTypeColor(playType) },
                                                                ]}
                                                              >
                                                                <Text style={styles.miniTypeText}>{playType}</Text>
                                                              </View>
                                                              <Text style={styles.numberText}>
                                                                🎲 {numberDisplay}
                                                              </Text>
                                                            </View>
                                                            <View style={styles.amountInfo}>
                                                              <Text style={styles.numberAmount}>${formatAmount(detail.amount || 0)}</Text>
                                                              {detail.profit !== undefined && detail.profit !== 0 && (
                                                                <Text
                                                                  style={[
                                                                    styles.numberProfit,
                                                                    detail.profit > 0 ? styles.profitPositive : styles.profitNegative,
                                                                  ]}
                                                                >
                                                                  {detail.profit > 0 ? '+' : ''}{formatAmount(detail.profit)}
                                                                </Text>
                                                              )}
                                                            </View>
                                                          </View>
                                                        );
                                                      })}
                                                    </React.Fragment>
                                                  ))}
                                                </React.Fragment>
                                              ))}
                                            </View>
                                          </ScrollView>

                                          {/* Resumen de Jugada */}
                                          <View style={styles.betGainContainer}>
                                            <Ionicons name="trophy-outline" size={20} color={colors.darkBackground} />
                                            <Text style={styles.betGainLabel}>Ganancia</Text>
                                            <Text style={styles.betGainAmount}>
                                              ${formatAmount(totalProfit)}
                                            </Text>
                                          </View>
                                        </View>
                                      )}
                                    </View>
                                  );
                                })}
                              </View>

                              {/* Resumen del BetResume */}
                              <View style={styles.betSummary}>
                                <View style={styles.betSummaryLeft}>
                                  <Ionicons name="wallet-outline" size={20} color={colors.darkBackground} />
                                  <Text style={styles.betSummaryLabel}>APOSTADO</Text>
                                  <Text style={styles.betSummaryAmount}>
                                    ${formatAmount(betResumeTotalAmount)}
                                  </Text>
                                </View>
                                <View style={styles.betSummaryRight}>
                                  <Ionicons name="trophy-outline" size={20} color={colors.darkBackground} />
                                  <Text style={styles.betSummaryLabel}>PREMIO</Text>
                                  <Text style={styles.betSummaryAmount}>
                                    ${formatAmount(betResumeTotalProfit)}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                    )}
                </View>
                );
              })}
            </ScrollView>
          </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBackground,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
  },
  filtersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primaryGold,
  },
  filtersButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
    marginBottom: spacing.lg,
    marginHorizontal: spacing.lg,
    lineHeight: 20,
  },
  summaryCards: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryCardYellow: {
    backgroundColor: '#fbbf24',
  },
  summaryCardRed: {
    backgroundColor: '#ef4444',
  },
  summaryCardGreen: {
    backgroundColor: '#22c55e',
  },
  summaryCardLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.darkBackground,
    textAlign: 'center',
  },
  summaryCardValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    color: colors.darkBackground,
  },
  filtersSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  searchButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  searchButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  searchButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.darkBackground,
  },
  historySection: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  historyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.darkBackground,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.inputBorder,
  },
  clearButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.subtleGrey,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.subtleGrey,
    textAlign: 'center',
  },
  datesList: {
    flex: 1,
  },
  dateGroupHeader: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.darkBackground,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryGold,
    overflow: 'hidden',
    shadowColor: colors.primaryGold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateGroupContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  dateGroupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  dateIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primaryGold,
  },
  dateGroupInfo: {
    flex: 1,
  },
  dateGroupText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
    marginBottom: 2,
  },
  dateGroupCount: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    fontWeight: fontWeight.medium,
  },
  betsContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  betCard: {
    backgroundColor: colors.darkBackground,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryGold,
    overflow: 'hidden',
  },
  betCardHeader: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  betCardFirstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  betCardSecondRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  betCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  betCardTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
  },
  betCardStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  betCardStatusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: 'white',
  },
  betCardDetails: {
    backgroundColor: colors.inputBackground,
    padding: spacing.md,
  },
  betCardDate: {
    fontSize: 11,
    color: colors.subtleGrey,
    flex: 1,
  },
  allNumbersContainer: {
    maxHeight: 300,
    marginBottom: spacing.md,
  },
  numbersContent: {
    gap: spacing.xs,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.darkBackground,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  numberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  miniTypeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  miniTypeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: 'white',
    textTransform: 'uppercase',
  },
  numberText: {
    fontSize: fontSize.sm,
    color: colors.lightText,
    fontWeight: fontWeight.semibold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  amountInfo: {
    alignItems: 'flex-end',
    gap: 2,
  },
  numberAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  numberProfit: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  profitPositive: {
    color: '#22c55e',
  },
  profitNegative: {
    color: '#ef4444',
  },
  dateCard: {
    backgroundColor: colors.darkBackground,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryGold,
  },
  dateHeaderLeft: {
    flex: 1,
  },
  dateTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
    textTransform: 'capitalize',
  },
  dateStats: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
    marginTop: spacing.xs,
  },
  dateStatsContainer: {
    marginTop: spacing.xs,
  },
  dateStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  dateStatsAmount: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    fontWeight: fontWeight.medium,
  },
  dateHeaderRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  dateProfit: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
  },
  dateProfitLabel: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    fontWeight: fontWeight.medium,
  },
  dateStatusBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  statusBadgeSmall: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeSmallText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: 'white',
  },
  dateDetails: {
    backgroundColor: colors.inputBackground,
    padding: spacing.md,
  },
  betItem: {
    backgroundColor: colors.darkBackground,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  betItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  betItemHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  betLotteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  betLotteryLabel: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    fontWeight: fontWeight.medium,
    marginRight: spacing.xs,
  },
  betLottery: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.lightText,
  },
  betThrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  betThrowLabel: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    fontWeight: fontWeight.medium,
    marginRight: spacing.xs,
  },
  betThrow: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.lightText,
  },
  betDateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  betDateLabel: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    fontWeight: fontWeight.medium,
    marginRight: spacing.xs,
  },
  betDate: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: 'white',
  },
  betPlayItem: {
    marginBottom: spacing.sm,
  },
  betPlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  betPlayTypeContainer: {
    flex: 1,
  },
  betPlayTypeLabel: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  betPlayType: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
  },
  betPlayTotalsContainer: {
    alignItems: 'flex-end',
  },
  betPlayTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  betPlayTotalLabel: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    fontWeight: fontWeight.medium,
    marginRight: spacing.xs,
  },
  betPlayTotal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
  },
  betPlayProfit: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  betDetailsSection: {
    marginTop: spacing.sm,
  },
  betDetailsTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
    marginBottom: spacing.sm,
  },
  movesContainer: {
    marginTop: spacing.sm,
  },
  movesTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.subtleGrey,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  moveItem: {
    backgroundColor: colors.inputBackground,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  moveNumbersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  moveNumbersLabel: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    fontWeight: fontWeight.medium,
    marginRight: spacing.xs,
    minWidth: 70,
  },
  moveNumbers: {
    fontSize: fontSize.sm,
    color: colors.lightText,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  moveAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  moveAmountLabel: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    fontWeight: fontWeight.medium,
    marginRight: spacing.xs,
    minWidth: 70,
  },
  moveAmount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
  },
  moveProfitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moveProfitLabel: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    fontWeight: fontWeight.medium,
    marginRight: spacing.xs,
    minWidth: 70,
  },
  moveProfit: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  betSummary: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  betSummaryLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: '#ef4444',
    borderRadius: borderRadius.md,
    marginRight: spacing.xs,
  },
  betSummaryRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: '#22c55e',
    borderRadius: borderRadius.md,
    marginLeft: spacing.xs,
  },
  betSummaryLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.darkBackground,
  },
  betSummaryAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    color: colors.darkBackground,
  },
  betGainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: '#22c55e',
    borderRadius: borderRadius.md,
  },
  betGainLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.darkBackground,
  },
  betGainAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    color: colors.darkBackground,
  },
  throwResultContainer: {
    backgroundColor: colors.inputBackground,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  throwResultTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
    marginBottom: spacing.sm,
  },
  throwResultDetails: {
    gap: spacing.xs,
  },
  throwResultText: {
    fontSize: fontSize.sm,
    color: colors.lightText,
    fontWeight: fontWeight.medium,
  },
  jugadasSection: {
    marginTop: spacing.md,
  },
  jugadasTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
    marginBottom: spacing.md,
  },
  betItemCard: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    overflow: 'hidden',
  },
  betItemDetails: {
    padding: spacing.md,
    backgroundColor: colors.darkBackground,
  },
  betItemStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  betItemStatusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: 'white',
  },
  betItemDate: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    flex: 1,
  },
  betCardId: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  betCardDateContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  betCardStatusLabel: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    marginTop: spacing.xs,
  },
});

export default MisApuestas;
