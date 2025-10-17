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

      const response = await betService.getUserBetsRange(user.id, params);

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
      }

      setBets(flattenedBets);
      setShowHistory(true);
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

    dateBets.forEach((bet) => {
      bet.betPlays?.forEach((betPlay) => {
        betPlay.moves?.forEach((move) => {
          totalAmount += move.totalAmount || 0;
          totalProfit += move.profit || 0;
        });
      });
    });

    return { totalAmount, totalProfit, totalBets: dateBets.length };
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
    
    return (
    <View style={styles.container}>
      <Card title="Mis Apuestas" icon="receipt-outline" style={styles.card}>
        <Text style={styles.description}>Consulta el historial de tus apuestas y resultados.</Text>

        {/* Filtros */}
        {!showHistory && (
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

        {/* Resultados */}
        {showHistory && (
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>
                {Object.keys(groupedBets).length} fecha{Object.keys(groupedBets).length !== 1 ? 's' : ''}
              </Text>
              <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
                <Ionicons name="close-outline" size={20} color={colors.primaryRed} />
              </TouchableOpacity>
            </View>
            
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
                  <View key={dateKey} style={styles.dateCard}>
                    <TouchableOpacity
                      style={styles.dateHeader}
                      onPress={() => setExpandedDate(isExpanded ? null : dateKey)}
                    >
                      <View style={styles.dateHeaderLeft}>
                        <Text style={styles.dateTitle}>{formatDate(dateKey)}</Text>
                        <Text style={styles.dateStats}>
                          {summary.totalBets} apuesta{summary.totalBets !== 1 ? 's' : ''} · $
                          {formatAmount(summary.totalAmount)}
                        </Text>
                      </View>
                      <View style={styles.dateHeaderRight}>
                        <Text
                          style={[
                            styles.dateProfit,
                            summary.totalProfit >= 0 ? styles.profitPositive : styles.profitNegative,
                          ]}
                        >
                          ${formatAmount(summary.totalProfit)}
                        </Text>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={24}
                          color={colors.primaryGold}
                        />
          </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.dateDetails}>
                        {dateBets.map((bet) => (
                          <View key={bet.id} style={styles.betItem}>
                            <View style={styles.betItemHeader}>
                              <View style={styles.betItemHeaderLeft}>
                                <Text style={styles.betLottery}>
                                  {bet.lotteryName} - {bet.throwName}
                                </Text>
                                <Text style={styles.betDate}>
                                  {new Date(bet.date).toLocaleTimeString()}
            </Text>
          </View>
                              <View
                                style={[
                                  styles.statusBadge,
                                  { backgroundColor: getStatusColor(bet.stateCode) },
                                ]}
                              >
                                <Text style={styles.statusText}>
                                  {getStatusIcon(bet.stateCode)} {getBetStatus(bet)}
            </Text>
                              </View>
          </View>
          
                            {bet.betPlays?.map((betPlay, idx) => (
                              <View key={idx} style={styles.betPlayItem}>
                                <Text style={styles.betPlayType}>{betPlay.playTypeName}</Text>
                                {betPlay.moves?.map((move, moveIdx) => (
                                  <View key={moveIdx} style={styles.moveItem}>
                                    <Text style={styles.moveNumbers}>{move.numbers || 'N/A'}</Text>
                                    <Text style={styles.moveAmount}>
                                      ${formatAmount(move.totalAmount)}
            </Text>
                                  </View>
                                ))}
                              </View>
                            ))}
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
      </Card>
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    flex: 1,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  filtersSection: {
    marginBottom: spacing.lg,
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
    padding: spacing.sm,
    backgroundColor: colors.darkBackground,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.inputBorder,
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
  betLottery: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.lightText,
  },
  betDate: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    marginTop: spacing.xs,
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
  betPlayType: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
    marginBottom: spacing.xs,
  },
  moveItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  moveNumbers: {
    fontSize: fontSize.xs,
    color: colors.lightText,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  moveAmount: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primaryGold,
  },
});

export default MisApuestas;
