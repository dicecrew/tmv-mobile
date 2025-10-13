import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';
import Card from '../common/Card';
import Toast from 'react-native-toast-message';
import { bookieService } from '../../api/services';

interface Bet {
  id: string;
  userName: string;
  date: string;
  stateCode: string;
  throwName: string;
  lotteryName?: string;
  bookieUserName?: string;
  resumeId?: string;
  betPlays?: BetPlay[];
  jugadas?: BetPlay[];
}

interface BetPlay {
  playTypeName: string;
  moves?: Move[];
}

interface Move {
  totalAmount: number;
  numbers?: string;
}

interface State {
  id: string;
  code: string;
  name: string;
}

const ValidacionApuestas: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showOnlyPending, setShowOnlyPending] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [bets, setBets] = useState<Bet[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [expandedBets, setExpandedBets] = useState<Set<string>>(new Set());
  const [validatedBets, setValidatedBets] = useState<Set<string>>(new Set());
  const [validatingBets, setValidatingBets] = useState<Set<string>>(new Set());

  // Cargar estados
  const loadStates = async () => {
    try {
      // Usando customInstance directamente ya que no tenemos stateService
      const response = await fetch('https://api.themoneyvice.com/api/State', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      let statesArray: any[] = [];
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        statesArray = Object.values(data);
      } else if (Array.isArray(data)) {
        statesArray = data;
      }
      
      setStates(statesArray);
    } catch (error) {
      console.error('Error loading states:', error);
    }
  };

  // Cargar apuestas para validar
  const loadBets = async () => {
    setIsLoading(true);
    try {
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);
      
      const params = {
        date: endDate.toISOString(),
        pendientes: showOnlyPending,
      };

      const response = await bookieService.getValidateBets(params);
      
      let rawData: any[] = [];
      if (Array.isArray(response?.data)) {
        rawData = response.data;
      } else if (Array.isArray(response)) {
        rawData = response;
      } else if (response?.data && typeof response.data === 'object') {
        rawData = Object.values(response.data);
      }

      // Aplanar estructura: extraer todas las apuestas de todos los resumes
      const allBets: Bet[] = rawData.reduce((acc: Bet[], resume: any) => {
        if (resume.bets && Array.isArray(resume.bets)) {
          const betsWithInfo = resume.bets.map((bet: any) => ({
            ...bet,
            resumeId: resume.id,
            resumeDate: resume.date,
            throwName: resume.throwName,
            lotteryName: resume.lotteryName,
            bookieUserName: resume.bookieUserName,
          }));
          return [...acc, ...betsWithInfo];
        }
        return acc;
      }, []);

      setBets(allBets);
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

  useEffect(() => {
    loadStates();
  }, []);

  useEffect(() => {
    loadBets();
  }, [selectedDate, showOnlyPending]);

  // Manejar cambio de fecha
  const handleDateChange = (event: any, selected?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    if (selected) {
      setSelectedDate(selected);
      if (Platform.OS === 'android') {
        setShowDatePicker(false);
      }
    }
  };

  // Validar apuesta
  const handleValidateBet = (bet: Bet) => {
    const approvedState = states.find((s) => s.code === 'Approved');
    if (!approvedState) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo obtener el estado "Approved"',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    const totalAmount = getTotalAmount(bet.betPlays || bet.jugadas || []);

    Alert.alert(
      '🎯 Validar Apuesta',
      `¿Estás seguro de que quieres validar esta apuesta?\n\n${bet.userName}\nMonto: $${formatAmount(totalAmount)}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Validar',
          onPress: async () => {
            setValidatingBets((prev) => new Set([...prev, bet.id]));

            try {
              await bookieService.updateBetState(bet.id, approvedState.id);

              setValidatedBets((prev) => new Set([...prev, bet.id]));
              setValidatingBets((prev) => {
                const newSet = new Set(prev);
                newSet.delete(bet.id);
                return newSet;
              });

              Toast.show({
                type: 'success',
                text1: '¡Éxito!',
                text2: `Apuesta validada - ${bet.userName} - $${formatAmount(totalAmount)}`,
                position: 'top',
                topOffset: 60,
                visibilityTime: 5000,
              });

              loadBets();
            } catch (error: any) {
              setValidatingBets((prev) => {
                const newSet = new Set(prev);
                newSet.delete(bet.id);
                return newSet;
              });

      Toast.show({
        type: 'error',
        text1: 'Error',
                text2: error.message || 'Error al validar la apuesta',
        position: 'top',
        topOffset: 60,
      });
            }
          },
        },
      ]
    );
  };

  // Alternar expansión
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

  // Calcular total
  const getTotalAmount = (betPlays: BetPlay[]): number => {
    if (!betPlays || !Array.isArray(betPlays)) return 0;
    return betPlays.reduce((sum, betPlay) => {
      if (betPlay.moves && Array.isArray(betPlay.moves)) {
        return sum + betPlay.moves.reduce((moveSum, move) => moveSum + (move.totalAmount || 0), 0);
      }
      return sum;
    }, 0);
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

  // Color por tipo de apuesta
  const getBetTypeColor = (type: string): string => {
    switch (type) {
      case 'FIJO':
        return '#2563eb';
      case 'PARLET':
        return '#16a34a';
      case 'CORRIDO':
        return '#7c3aed';
      case 'CENTENA':
        return '#dc2626';
      default:
        return colors.primaryGold;
    }
  };

  // Filtrar apuestas
  const filteredBets = useMemo(() => {
    const filtered = showOnlyPending
      ? bets.filter((bet) => !validatedBets.has(bet.id) && bet.stateCode === 'New')
      : bets.filter((bet) => !validatedBets.has(bet.id));

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bets, showOnlyPending, validatedBets]);

    return (
    <View style={styles.container}>
      <Card title="Validación de Apuestas" icon="checkmark-done-outline" style={styles.card}>
        <Text style={styles.description}>
          Revisa y valida las apuestas realizadas por tus jugadores. Confirma cuando recibas el pago.
        </Text>

        {/* Filtros */}
        <View style={styles.filtersSection}>
          <View style={styles.filterRow}>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primaryGold} />
              <Text style={styles.infoText}>
                {filteredBets.length} apuesta{filteredBets.length !== 1 ? 's' : ''} {showOnlyPending ? 'pendiente' : 'total'}
                {showOnlyPending ? 's' : 'es'}
              </Text>
            </View>

            <TouchableOpacity style={styles.refreshButton} onPress={loadBets}>
              <Ionicons name="refresh-outline" size={20} color={colors.primaryGold} />
            </TouchableOpacity>
          </View>

          <View style={styles.dateFilter}>
            <Text style={styles.filterLabel}>📅 Fecha:</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateButtonText}>{selectedDate.toLocaleDateString()}</Text>
              <Ionicons name="calendar-outline" size={16} color={colors.primaryGold} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.filterToggle}
            onPress={() => setShowOnlyPending(!showOnlyPending)}
          >
            <Ionicons
              name={showOnlyPending ? 'checkbox' : 'square-outline'}
              size={20}
              color={colors.primaryGold}
            />
            <Text style={styles.filterToggleText}>Solo pendientes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.applyButton} onPress={loadBets} disabled={isLoading}>
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.applyButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="search-outline" size={18} color="white" />
                  <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Lista de apuestas */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryGold} />
            <Text style={styles.loadingText}>Cargando apuestas...</Text>
            </View>
        )}

        {!isLoading && filteredBets.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done-outline" size={64} color={colors.subtleGrey} />
            <Text style={styles.emptyText}>
              {showOnlyPending ? 'No hay apuestas pendientes' : 'No hay apuestas'}
              </Text>
            </View>
        )}

        <ScrollView style={styles.betsList}>
          {filteredBets.map((bet) => {
            const isExpanded = expandedBets.has(bet.id);
            const isValidating = validatingBets.has(bet.id);
            const totalAmount = getTotalAmount(bet.betPlays || bet.jugadas || []);

            return (
              <View key={bet.id} style={styles.betCard}>
                <TouchableOpacity
                  style={styles.betHeader}
                  onPress={() => toggleExpandBet(bet.id)}
                >
                  <View style={styles.betHeaderLeft}>
                    <Text style={styles.betUserName}>{bet.userName}</Text>
                    <Text style={styles.betDetails}>
                      {bet.lotteryName} - {bet.throwName}
                    </Text>
                    <Text style={styles.betDate}>{convertUTCToLocalTime(bet.date)}</Text>
                  </View>
                  <View style={styles.betHeaderRight}>
                    <Text style={styles.betAmount}>${formatAmount(totalAmount)}</Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={24}
                      color={colors.primaryGold}
                    />
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.betDetailsContainer}>
                    {(bet.betPlays || bet.jugadas || []).map((betPlay, idx) => (
                      <View key={idx} style={styles.betPlayItem}>
                        <View
                          style={[
                            styles.betTypeBadge,
                            { backgroundColor: getBetTypeColor(betPlay.playTypeName) },
                          ]}
                        >
                          <Text style={styles.betTypeText}>{betPlay.playTypeName}</Text>
                        </View>
                        {betPlay.moves && betPlay.moves.map((move, moveIdx) => (
                          <View key={moveIdx} style={styles.moveItem}>
                            <Text style={styles.moveNumbers}>{move.numbers || 'N/A'}</Text>
                            <Text style={styles.moveAmount}>${formatAmount(move.totalAmount)}</Text>
                  </View>
                ))}
              </View>
                    ))}

              <TouchableOpacity
                      style={styles.validateButton}
                      onPress={() => handleValidateBet(bet)}
                      disabled={isValidating}
                    >
                      <LinearGradient
                        colors={[colors.primaryGold, colors.primaryRed]}
                        style={styles.validateButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        {isValidating ? (
                          <ActivityIndicator size="small" color={colors.darkBackground} />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle-outline" size={20} color={colors.darkBackground} />
                            <Text style={styles.validateButtonText}>Validar Apuesta</Text>
                          </>
                        )}
                      </LinearGradient>
              </TouchableOpacity>
            </View>
                )}
          </View>
            );
          })}
          </ScrollView>
      </Card>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
};

const formatAmount = (amount: number): string => {
  if (amount === undefined || amount === null) return '0';
  return amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const convertUTCToLocalTime = (utcDateString: string): string => {
  try {
    const date = new Date(utcDateString);
    return date.toLocaleDateString() + ', ' + date.toLocaleTimeString();
  } catch (error) {
    return 'Fecha inválida';
  }
};

const getTotalAmount = (betPlays: BetPlay[]): number => {
  if (!betPlays || !Array.isArray(betPlays)) return 0;
  return betPlays.reduce((sum, betPlay) => {
    if (betPlay.moves && Array.isArray(betPlay.moves)) {
      return sum + betPlay.moves.reduce((moveSum, move) => moveSum + (move.totalAmount || 0), 0);
    }
    return sum;
  }, 0);
};

const getBetTypeColor = (type: string): string => {
  switch (type) {
    case 'FIJO':
      return '#2563eb';
    case 'PARLET':
      return '#16a34a';
    case 'CORRIDO':
      return '#7c3aed';
    case 'CENTENA':
      return '#dc2626';
    default:
      return '#D4AF37';
  }
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
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.primaryGold}1A`,
    borderWidth: 2,
    borderColor: `${colors.primaryGold}33`,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.primaryGold,
    fontWeight: fontWeight.semibold,
  },
  refreshButton: {
    padding: spacing.sm,
    backgroundColor: colors.darkBackground,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.inputBorder,
  },
  dateFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  filterLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primaryGold,
  },
  dateButton: {
    flex: 1,
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
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterToggleText: {
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
    paddingVertical: spacing.md,
  },
  applyButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: 'white',
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
  betsList: {
    flex: 1,
  },
  betCard: {
    backgroundColor: colors.darkBackground,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryGold,
  },
  betHeaderLeft: {
    flex: 1,
  },
  betUserName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
  },
  betDetails: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
    marginTop: spacing.xs,
  },
  betDate: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    marginTop: spacing.xs,
  },
  betHeaderRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  betAmount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    color: colors.primaryGold,
  },
  betDetailsContainer: {
    backgroundColor: colors.inputBackground,
    padding: spacing.md,
  },
  betPlayItem: {
    marginBottom: spacing.md,
  },
  betTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  betTypeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: 'white',
  },
  moveItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.darkBackground,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  moveNumbers: {
    fontSize: fontSize.sm,
    color: colors.lightText,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  moveAmount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primaryGold,
  },
  validateButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  validateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  validateButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.darkBackground,
  },
});

export default ValidacionApuestas;
