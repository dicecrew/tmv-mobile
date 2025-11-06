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
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';
import Card from '../common/Card';
import DateRangePicker from '../common/DateRangePicker';
import Toast from 'react-native-toast-message';
import { betService } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';

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

interface Move {
  totalAmount: number;
  profit: number;
  numbers?: string;
}

interface DateGroup {
  [dateKey: string]: Bet[];
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
  const [bets, setBets] = useState<Bet[]>([]);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
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

      // Procesar respuesta para aplanar estructura
      const flattenedBets: Bet[] = [];
      const apiData = response?.data || response;

      if (apiData && apiData.lotteries) {
        apiData.lotteries.forEach((lottery: any) => {
          lottery.throws?.forEach((throwData: any) => {
            throwData.betResumes?.forEach((betResume: any) => {
              betResume.bets?.forEach((bet: any) => {
                flattenedBets.push({
                  ...bet,
                  lotteryName: lottery.lotteryName,
                  throwName: throwData.throwName,
                });
              });
            });
          });
        });
      } else {
        console.warn('⚠️ Estructura de respuesta inesperada:', apiData);
        // Intentar procesar como array directo de apuestas
        if (Array.isArray(apiData)) {
          apiData.forEach((bet: any) => {
            flattenedBets.push({
              ...bet,
              lotteryName: bet.lotteryName || 'Lotería desconocida',
              throwName: bet.throwName || 'Tirada desconocida',
          });
        });
        }
      }

      setBets(flattenedBets);
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

  // Agrupar apuestas por fecha
  const groupedBets: DateGroup = useMemo(() => {
    const grouped: DateGroup = {};

    bets.forEach((bet) => {
      const betDate = new Date(bet.date);
      const dateKey = betDate.toISOString().split('T')[0];

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(bet);
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
  }, [bets]);

  // Resumen por fecha
  const getDateSummary = (dateBets: Bet[]) => {
    let totalAmount = 0;
    let totalProfit = 0;
    let totalMoves = 0;
    let wonBets = 0;
    let lostBets = 0;
    let pendingBets = 0;

    dateBets.forEach((bet) => {
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

    return { 
      totalAmount, 
      totalProfit, 
      totalBets: dateBets.length,
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

  // Limpiar filtros
  const handleClearFilters = () => {
    setFromDate(getSevenDaysAgo());
    setToDate(new Date());
    setShowHistory(false);
    setBets([]);
    setExpandedDate(null);
  };
    
    // Calcular resúmenes generales
  const totalJugadas = bets.length;
  const totalApostado = bets.reduce((total, bet) => {
    return total + (bet.betPlays?.reduce((playTotal, play) => 
      playTotal + (play.moves?.reduce((moveTotal, move) => moveTotal + (move.totalAmount || 0), 0) || 0), 0) || 0);
  }, 0);
  const totalGanado = bets.reduce((total, bet) => {
    return total + (bet.betPlays?.reduce((playTotal, play) => 
      playTotal + (play.moves?.reduce((moveTotal, move) => moveTotal + (move.profit || 0), 0) || 0), 0) || 0);
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
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.darkBackground} />
              ) : (
                <>
                  <Ionicons name="search-outline" size={20} color={colors.darkBackground} />
                  <Text style={styles.searchButtonText}>Buscar Historial</Text>
                </>
              )}
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
            
            {!isLoading && Object.keys(groupedBets).length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={64} color={colors.subtleGrey} />
                <Text style={styles.emptyText}>No hay apuestas en este período</Text>
              </View>
            )}

            <ScrollView style={styles.datesList}>
              {Object.entries(groupedBets).map(([dateKey, dateBets]) => {
                const summary = getDateSummary(dateBets);
                const isExpanded = expandedDate === dateKey;

  return (
                <View key={dateKey}>
                  {/* Agrupación por Fecha */}
                  <View style={styles.dateGroupHeader}>
                    <View style={styles.dateGroupButton}>
                      <Ionicons name="calendar-outline" size={20} color={colors.darkBackground} />
                      <Text style={styles.dateGroupText}>{formatDate(dateKey)}</Text>
                    </View>
                    <Text style={styles.dateGroupCount}>
                      {summary.totalBets} jugada{summary.totalBets !== 1 ? 's' : ''}
                    </Text>
                    <TouchableOpacity 
                      style={styles.hideButton}
                      onPress={() => setExpandedDate(isExpanded ? null : dateKey)}
                    >
                      <Ionicons 
                        name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                        size={20} 
                        color={colors.darkBackground} 
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Detalles de Apuestas */}
                    {isExpanded && (
                    <View style={styles.betsContainer}>
                        {dateBets.map((bet) => (
                        <View key={bet.id} style={styles.betCard}>
                          {/* Header de la Apuesta */}
                          <View style={styles.betCardHeader}>
                            <View style={styles.betCardHeaderLeft}>
                              <Ionicons name="business-outline" size={16} color={colors.lightText} />
                              <Text style={styles.betCardTitle}>
                                {bet.lotteryName} • {bet.throwName} • {bet.id}
            </Text>
          </View>
                            <View style={styles.betCardStatus}>
                              <Ionicons name="help-circle-outline" size={16} color={colors.lightText} />
                              <Text style={styles.betCardStatusText}>{getBetStatus(bet)}</Text>
                            </View>
                          </View>

                          {/* Estado y Fechas */}
                          <View style={styles.betCardInfo}>
                            <View style={styles.betCardStatusBadge}>
                              <Text style={styles.betCardStatusBadgeText}>Sin resultados</Text>
                            </View>
                            <Text style={styles.betCardDate}>
                              Fecha: {formatShortDate(bet.date)} {new Date(bet.date).toLocaleTimeString('es-ES')}
            </Text>
                            <Text style={styles.betCardCloseTime}>
                              Hora de Cierre: {new Date(bet.date).toLocaleTimeString('es-ES')}
                            </Text>
                            <View style={styles.betCardThrowStatus}>
                              <Text style={styles.betCardThrowStatusLabel}>Estado Tirada:</Text>
                              <Ionicons name="hourglass-outline" size={16} color={colors.primaryGold} />
                              <Text style={styles.betCardThrowStatusText}>Pendiente</Text>
                              </View>
          </View>
          
                          {/* Sección JUGADAS */}
                          <View style={styles.jugadasSection}>
                            <View style={styles.jugadasHeader}>
                              <Ionicons name="dice-outline" size={16} color={colors.subtleGrey} />
                              <Text style={styles.jugadasTitle}>JUGADAS</Text>
                            </View>

                            {bet.betPlays?.map((betPlay, idx) => {
                              const playTotal = betPlay.moves?.reduce((total, move) => total + (move.totalAmount || 0), 0) || 0;
                              const playProfit = betPlay.moves?.reduce((total, move) => total + (move.profit || 0), 0) || 0;
                              
                              return (
                                <View key={idx} style={styles.jugadaItem}>
                                  <View style={styles.jugadaHeader}>
                                    <Text style={styles.jugadaType}>{betPlay.playTypeName}</Text>
                                    <Text style={styles.jugadaTotal}>Total: ${formatAmount(playTotal)}</Text>
                                    <Text style={[styles.jugadaProfit, { color: playProfit >= 0 ? '#22c55e' : '#ef4444' }]}>
                                      Ganancia: ${formatAmount(playProfit)}
                                    </Text>
                                  </View>
                                  
                                  {betPlay.moves?.map((move, moveIdx) => (
                                    <View key={moveIdx} style={styles.jugadaMove}>
                                      <Text style={styles.jugadaMoveType}>{betPlay.playTypeName}</Text>
                                      <Text style={styles.jugadaMoveNumbers}>{move.numbers || 'N/A'}</Text>
                                      <Text style={styles.jugadaMoveAmount}>${formatAmount(move.totalAmount || 0)}</Text>
                                      <Text style={[styles.jugadaMoveProfit, { color: (move.profit || 0) >= 0 ? '#22c55e' : '#ef4444' }]}>
                                        ${formatAmount(move.profit || 0)}
                                      </Text>
                                    </View>
                                  ))}
                              </View>
                              );
                            })}
                          </View>

                          {/* Resumen de Apuesta */}
                          <View style={styles.betSummary}>
                            <View style={styles.betSummaryLeft}>
                              <Ionicons name="wallet-outline" size={20} color={colors.darkBackground} />
                              <Text style={styles.betSummaryLabel}>APOSTADO</Text>
                              <Text style={styles.betSummaryAmount}>
                                ${formatAmount(bet.betPlays?.reduce((total, play) => 
                                  total + (play.moves?.reduce((moveTotal, move) => moveTotal + (move.totalAmount || 0), 0) || 0), 0) || 0)}
                              </Text>
                            </View>
                            <View style={styles.betSummaryRight}>
                              <Ionicons name="trophy-outline" size={20} color={colors.darkBackground} />
                              <Text style={styles.betSummaryLabel}>PREMIO</Text>
                              <Text style={styles.betSummaryAmount}>
                                ${formatAmount(bet.betPlays?.reduce((total, play) => 
                                  total + (play.moves?.reduce((moveTotal, move) => moveTotal + (move.profit || 0), 0) || 0), 0) || 0)}
                              </Text>
                            </View>
                          </View>
                          </View>
                        ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryGold,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  dateGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#fbbf24',
    borderRadius: borderRadius.md,
  },
  dateGroupText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.darkBackground,
  },
  dateGroupCount: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
  },
  hideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#fbbf24',
    borderRadius: borderRadius.md,
  },
  hideButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.darkBackground,
  },
  betsContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  betCard: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  betCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  betCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  betCardTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.lightText,
  },
  betCardStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.darkBackground,
    borderRadius: borderRadius.sm,
  },
  betCardStatusText: {
    fontSize: fontSize.xs,
    color: colors.lightText,
  },
  betCardInfo: {
    marginBottom: spacing.sm,
  },
  betCardStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: '#fbbf24',
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  betCardStatusBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.darkBackground,
  },
  betCardDate: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    marginBottom: spacing.xs,
  },
  betCardCloseTime: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    marginBottom: spacing.xs,
  },
  betCardThrowStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  betCardThrowStatusLabel: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
  },
  betCardThrowStatusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
  },
  jugadasSection: {
    marginBottom: spacing.md,
  },
  jugadasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  jugadasTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.subtleGrey,
  },
  jugadaItem: {
    marginBottom: spacing.sm,
  },
  jugadaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  jugadaType: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: '#22c55e',
  },
  jugadaTotal: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
  },
  jugadaProfit: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  jugadaMove: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  jugadaMoveType: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: '#22c55e',
  },
  jugadaMoveNumbers: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
  },
  jugadaMoveAmount: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
  },
  jugadaMoveProfit: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
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
  profitPositive: {
    color: '#22c55e',
  },
  profitNegative: {
    color: '#ef4444',
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
});

export default MisApuestas;
