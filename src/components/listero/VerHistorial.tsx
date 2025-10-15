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
import Combobox, { ComboboxOption } from '../common/Combobox';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';
import Card from '../common/Card';
import Toast from 'react-native-toast-message';
import { bookieService } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';

interface Player {
  id: string;
  firstName: string;
  lastName?: string;
  phoneNumber: string;
}

interface BetResume {
  id: string;
  date: string;
  lotteryName: string;
  throwName: string;
  completed: boolean;
  revenue: number;
  bets: Bet[];
  summary?: Summary;
}

interface Bet {
  id: string;
  userName: string;
  userId: string;
  date: string;
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

interface Summary {
  totalBetResumes: number;
  completedBetResumes: number;
  pendingBetResumes: number;
  totalBets: number;
  totalMoves: number;
  winningMoves: number;
  losingMoves: number;
  totalAmount: number;
  totalProfit: number;
  netProfit: number;
  totalRevenue: number;
}

const VerHistorial: React.FC = () => {
  const { user } = useAuth();

  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [dateFrom, setDateFrom] = useState(new Date());
  const [dateTo, setDateTo] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [players, setPlayers] = useState<Player[]>([]);
  const [betResumes, setBetResumes] = useState<BetResume[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [expandedBets, setExpandedBets] = useState<Set<string>>(new Set());

  const [isLoadingBookie, setIsLoadingBookie] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [bookieId, setBookieId] = useState<string | null>(null);

  // Cargar bookie del usuario
  const loadUserBookie = async () => {
    if (!user?.id) return;

    setIsLoadingBookie(true);
    try {
      const response = await bookieService.getBookieByUserId(user.id);
      const bookie = response?.data || response;
      setBookieId(bookie?.id || null);
    } catch (error) {
      console.error('Error loading bookie:', error);
    } finally {
      setIsLoadingBookie(false);
    }
  };

  // Cargar jugadores del bookie
  const loadBookieUsers = async () => {
    if (!bookieId) return;

    setIsLoadingUsers(true);
    try {
      const response = await bookieService.getBookieUsers(bookieId);

      let usersArray: any[] = [];
      if (response && Array.isArray(response)) {
        usersArray = response;
      } else if (response?.data && Array.isArray(response.data)) {
        usersArray = response.data;
      } else if (response?.data && typeof response.data === 'object') {
        usersArray = Object.values(response.data);
      }

      setPlayers(usersArray);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Cargar historial de apuestas
  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      // Convertir fechas a UTC
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);

      const params: any = {
        from: from.toISOString(),
        to: to.toISOString(),
      };

      if (selectedPlayer) {
        params.userId = selectedPlayer;
      }

      const response = await bookieService.getUsersBetsHistory(params);

      // Procesar betResumes
      let processedBetResumes: BetResume[] = [];
      if (response?.data?.betResumes && Array.isArray(response.data.betResumes)) {
        processedBetResumes = response.data.betResumes.map((betResume: any) => {
          const bets: Bet[] = [];

          if (betResume.users && Array.isArray(betResume.users)) {
            betResume.users.forEach((user: any) => {
              if (user.bets && Array.isArray(user.bets)) {
                user.bets.forEach((bet: any) => {
                  bets.push({
                    ...bet,
                    userName: user.userName,
                    userId: user.userId,
                  });
                });
              }
            });
          }

          return {
            ...betResume,
            bets,
          };
        });
      }

      // Extraer summary
      if (response?.data?.summary) {
        setSummary(response.data.summary);
      }

      setBetResumes(processedBetResumes);
      setShowHistory(true);
    } catch (error) {
      console.error('Error loading history:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo cargar el historial',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadUserBookie();
  }, [user?.id]);

  useEffect(() => {
    if (bookieId) {
      loadBookieUsers();
    }
  }, [bookieId]);

  // Manejar cambio de fecha
  const handleFromDateChange = (event: any, selected?: Date) => {
    setShowFromPicker(Platform.OS === 'ios');
    if (event.type === 'dismissed') {
      setShowFromPicker(false);
      return;
    }
    if (selected) {
      setDateFrom(selected);
      if (Platform.OS === 'android') {
        setShowFromPicker(false);
      }
    }
  };

  const handleToDateChange = (event: any, selected?: Date) => {
    setShowToPicker(Platform.OS === 'ios');
    if (event.type === 'dismissed') {
      setShowToPicker(false);
      return;
    }
    if (selected) {
      setDateTo(selected);
      if (Platform.OS === 'android') {
        setShowToPicker(false);
      }
    }
  };

  // Alternar expansión
  const toggleExpandBet = (betResumeId: string) => {
    setExpandedBets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(betResumeId)) {
        newSet.delete(betResumeId);
      } else {
        newSet.add(betResumeId);
      }
      return newSet;
    });
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setSelectedPlayer('');
    setDateFrom(new Date());
    setDateTo(new Date());
    setShowHistory(false);
    setBetResumes([]);
    setSummary(null);
    setExpandedBets(new Set());
  };

  // Formatear monto
  const formatAmount = (amount: number): string => {
    if (amount === undefined || amount === null) return '0';
    return amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // Formatear fecha
  const convertUTCToLocalTime = (utcDateString: string): string => {
    try {
      const date = new Date(utcDateString);
      return date.toLocaleDateString() + ', ' + date.toLocaleTimeString();
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Convertir players a opciones del combobox
  const playerOptions: ComboboxOption[] = players.map(player => ({
    id: player.id,
    label: `${player.firstName} ${player.lastName || ''} (${player.phoneNumber})`,
    value: player.id,
  }));

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

  // Resumen de BetResume
  const getBetResumeSummary = (betResume: BetResume) => {
    if (betResume.summary) {
      return betResume.summary;
    }

    let totalAmount = 0;
    let totalProfit = 0;
    let totalBets = betResume.bets?.length || 0;

    betResume.bets?.forEach((bet) => {
      bet.betPlays?.forEach((betPlay) => {
        betPlay.moves?.forEach((move) => {
          totalAmount += move.totalAmount || 0;
          totalProfit += move.profit || 0;
        });
      });
    });

    return {
      totalAmount,
      totalProfit,
      totalBets,
      netProfit: totalProfit - totalAmount,
    };
  };

  // Ordenar betResumes
  const sortedBetResumes = useMemo(() => {
    return [...betResumes].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  }, [betResumes]);

    return (
    <View style={styles.container}>
      <Card title="Historial de Apuestas" icon="time-outline" style={styles.card}>
        <Text style={styles.description}>
          Consulta el historial completo de apuestas realizadas por tus jugadores.
        </Text>

        {/* Filtros */}
        {!showHistory && (
          <View style={styles.filtersSection}>
            <View style={styles.formGroup}>
              <Combobox
                options={playerOptions}
                selectedValue={selectedPlayer}
                onValueChange={setSelectedPlayer}
                placeholder="-- Todos los jugadores --"
                loading={isLoadingBookie || isLoadingUsers}
                loadingText={isLoadingBookie ? "Cargando bookie..." : "Cargando jugadores..."}
                enabled={!isLoadingBookie && !isLoadingUsers}
                label="Jugador (Opcional)"
              />
            </View>

            <View style={styles.dateRow}>
              <View style={styles.dateGroup}>
                <Text style={styles.label}>Desde</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowFromPicker(true)}>
                  <Text style={styles.dateButtonText}>{dateFrom.toLocaleDateString()}</Text>
                  <Ionicons name="calendar-outline" size={16} color={colors.primaryGold} />
                </TouchableOpacity>
          </View>

              <View style={styles.dateGroup}>
                <Text style={styles.label}>Hasta</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowToPicker(true)}>
                  <Text style={styles.dateButtonText}>{dateTo.toLocaleDateString()}</Text>
                  <Ionicons name="calendar-outline" size={16} color={colors.primaryGold} />
                </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={loadHistory}
              disabled={isLoadingHistory}
            >
              <LinearGradient
                colors={[colors.primaryGold, colors.primaryRed]}
                style={styles.applyButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isLoadingHistory ? (
                  <ActivityIndicator size="small" color={colors.darkBackground} />
                ) : (
                  <>
                    <Ionicons name="search-outline" size={20} color={colors.darkBackground} />
                    <Text style={styles.applyButtonText}>Buscar Historial</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Resultados */}
        {showHistory && (
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Resultados</Text>
              <View style={styles.historyActions}>
                <TouchableOpacity style={styles.refreshButton} onPress={loadHistory}>
                  <Ionicons name="refresh-outline" size={20} color={colors.primaryGold} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
                  <Ionicons name="close-outline" size={20} color={colors.primaryRed} />
                </TouchableOpacity>
          </View>
        </View>

            {/* Resumen */}
            {summary && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>📊 Resumen del Período</Text>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Tiradas</Text>
                    <Text style={styles.summaryValue}>{summary.totalBetResumes}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Apuestas</Text>
                    <Text style={styles.summaryValue}>{summary.totalBets}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Monto Total</Text>
                    <Text style={[styles.summaryValue, styles.summaryAmount]}>
                      ${formatAmount(summary.totalAmount)}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Ganancia Neta</Text>
                    <Text
                      style={[
                        styles.summaryValue,
                        summary.netProfit >= 0 ? styles.summaryProfit : styles.summaryLoss,
                      ]}
                    >
                      ${formatAmount(summary.netProfit)}
            </Text>
          </View>
        </View>
      </View>
            )}

            {/* Lista de BetResumes */}
            {isLoadingHistory && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primaryGold} />
                <Text style={styles.loadingText}>Cargando historial...</Text>
              </View>
            )}

            {!isLoadingHistory && sortedBetResumes.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="time-outline" size={64} color={colors.subtleGrey} />
                <Text style={styles.emptyText}>No se encontró historial para este período</Text>
              </View>
            )}

            <ScrollView style={styles.betResumesList}>
              {sortedBetResumes.map((betResume) => {
                const isExpanded = expandedBets.has(betResume.id);
                const resumeSummary = getBetResumeSummary(betResume);

                return (
                  <View key={betResume.id} style={styles.betResumeCard}>
                    <TouchableOpacity
                      style={styles.betResumeHeader}
                      onPress={() => toggleExpandBet(betResume.id)}
                    >
                      <View style={styles.betResumeHeaderLeft}>
                        <Text style={styles.betResumeLottery}>
                          {betResume.lotteryName} - {betResume.throwName}
                        </Text>
                        <Text style={styles.betResumeDate}>
                          {convertUTCToLocalTime(betResume.date)}
                        </Text>
                        <Text style={styles.betResumeStats}>
                          {resumeSummary.totalBets} apuesta{resumeSummary.totalBets !== 1 ? 's' : ''}
                          {' · '}${formatAmount(resumeSummary.totalAmount)}
                        </Text>
                      </View>
                      <View style={styles.betResumeHeaderRight}>
                        <Text
                          style={[
                            styles.betResumeProfit,
                            resumeSummary.netProfit >= 0 ? styles.profitPositive : styles.profitNegative,
                          ]}
                        >
                          ${formatAmount(resumeSummary.netProfit)}
                        </Text>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={24}
                          color={colors.primaryGold}
                        />
                      </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.betResumeDetails}>
                        {betResume.bets.map((bet) => (
                          <View key={bet.id} style={styles.betItem}>
                            <View style={styles.betItemHeader}>
                              <View style={styles.betItemHeaderLeft}>
                                <Text style={styles.betUserName}>{bet.userName}</Text>
                                <Text style={styles.betDate}>{convertUTCToLocalTime(bet.date)}</Text>
                              </View>
                              <View
                                style={[
                                  styles.statusBadge,
                                  { backgroundColor: getStatusColor(bet.stateCode) },
                                ]}
                              >
                                <Text style={styles.statusText}>
                                  {getStatusIcon(bet.stateCode)} {bet.stateCode}
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

      {/* Date Pickers */}
      {showFromPicker && (
        <DateTimePicker
          value={dateFrom}
          mode="date"
          display="default"
          onChange={handleFromDateChange}
          maximumDate={new Date()}
        />
      )}
      {showToPicker && (
        <DateTimePicker
          value={dateTo}
          mode="date"
          display="default"
          onChange={handleToDateChange}
          maximumDate={new Date()}
        />
      )}
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
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.lightText,
    marginBottom: spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  dateGroup: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.darkBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  dateButtonText: {
    fontSize: fontSize.md,
    color: colors.lightText,
  },
  applyButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  applyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  applyButtonText: {
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
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
  },
  historyActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  refreshButton: {
    padding: spacing.sm,
    backgroundColor: colors.darkBackground,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.inputBorder,
  },
  clearButton: {
    padding: spacing.sm,
    backgroundColor: colors.darkBackground,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.inputBorder,
  },
  summaryCard: {
    backgroundColor: colors.darkBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primaryGold,
  },
  summaryTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
    marginBottom: spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.inputBackground,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
  },
  summaryAmount: {
    color: colors.primaryGold,
  },
  summaryProfit: {
    color: '#22c55e',
  },
  summaryLoss: {
    color: '#ef4444',
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
  betResumesList: {
    flex: 1,
  },
  betResumeCard: {
    backgroundColor: colors.darkBackground,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  betResumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryGold,
  },
  betResumeHeaderLeft: {
    flex: 1,
  },
  betResumeLottery: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
  },
  betResumeDate: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    marginTop: spacing.xs,
  },
  betResumeStats: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
    marginTop: spacing.xs,
  },
  betResumeHeaderRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  betResumeProfit: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
  },
  profitPositive: {
    color: '#22c55e',
  },
  profitNegative: {
    color: '#ef4444',
  },
  betResumeDetails: {
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
  betUserName: {
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

export default VerHistorial;
