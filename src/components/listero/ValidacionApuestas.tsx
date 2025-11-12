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
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';
import Card from '../common/Card';
import DatePicker from '../common/DatePicker';
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
  playTypeName?: string;
  moveDetails?: MoveDetail[];
}

interface MoveDetail {
  number: string;
  secondNumber?: string;
  amount: number;
}

interface State {
  id: string;
  code: string;
  name: string;
}

const ValidacionApuestas: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showOnlyPending, setShowOnlyPending] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [bets, setBets] = useState<Bet[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [expandedBets, setExpandedBets] = useState<Set<string>>(new Set());
  const [validatedBets, setValidatedBets] = useState<Set<string>>(new Set());
  const [validatingBets, setValidatingBets] = useState<Set<string>>(new Set());
  const [isValidatingAll, setIsValidatingAll] = useState(false);

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

  // Validar todas las apuestas
  const handleValidateAllBets = () => {
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

    if (filteredBets.length === 0) {
      Toast.show({
        type: 'info',
        text1: 'Sin apuestas',
        text2: 'No hay apuestas para validar',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    const totalAllBets = filteredBets.reduce((sum, bet) => {
      return sum + getTotalAmount(bet.betPlays || bet.jugadas || []);
    }, 0);

    Alert.alert(
      '🎯 Validar Todas las Apuestas',
      `¿Estás seguro de que quieres validar TODAS las apuestas?\n\n${filteredBets.length} apuesta${filteredBets.length !== 1 ? 's' : ''}\nMonto Total: $${formatAmount(totalAllBets)}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Validar Todas',
          style: 'destructive',
          onPress: async () => {
            setIsValidatingAll(true);
            let successCount = 0;
            let errorCount = 0;

            for (const bet of filteredBets) {
              try {
                await bookieService.updateBetState(bet.id, approvedState.id);
                setValidatedBets((prev) => new Set([...prev, bet.id]));
                successCount++;
              } catch (error: any) {
                errorCount++;
                console.error(`Error validating bet ${bet.id}:`, error);
              }
            }

            setIsValidatingAll(false);

            if (successCount > 0) {
              Toast.show({
                type: 'success',
                text1: '¡Validación Completada!',
                text2: `${successCount} apuesta${successCount !== 1 ? 's' : ''} validada${successCount !== 1 ? 's' : ''}${errorCount > 0 ? ` - ${errorCount} error${errorCount !== 1 ? 'es' : ''}` : ''}`,
                position: 'top',
                topOffset: 60,
                visibilityTime: 6000,
              });
            }

            if (errorCount > 0 && successCount === 0) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudo validar ninguna apuesta',
                position: 'top',
                topOffset: 60,
              });
            }

            loadBets();
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
        return sum + betPlay.moves.reduce((moveSum, move) => {
          // Si hay moveDetails, sumar desde ahí
          if (move.moveDetails && Array.isArray(move.moveDetails)) {
            return moveSum + move.moveDetails.reduce((detailSum, detail) => detailSum + (detail.amount || 0), 0);
          }
          // Si no, usar totalAmount del move
          return moveSum + (move.totalAmount || 0);
        }, 0);
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
      case 'Fijo':
        return '#2563eb'; // Azul
      case 'CORRIDO':
      case 'Corrido':
        return '#16a34a'; // Verde
      case 'CENTENA':
      case 'Centena':
        return '#7c3aed'; // Morado
      case 'PARLET':
      case 'Parlet':
        return '#dc2626'; // Rojo
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

          <DatePicker
            value={selectedDate}
            onDateChange={setSelectedDate}
            label="Fecha"
            icon="calendar-outline"
            maximumDate={new Date()}
            dateFormat="short"
            showIcon={true}
            helpText="Selecciona la fecha para validar apuestas"
          />

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
              colors={['#f59e0b', '#d97706']}
              style={styles.applyButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="search-outline" size={16} color="white" />
                  <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Botón Validar Todas */}
          {filteredBets.length > 0 && !isLoading && (
            <TouchableOpacity
              style={styles.validateAllButton}
              onPress={handleValidateAllBets}
              disabled={isValidatingAll}
            >
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.validateAllButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isValidatingAll ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.validateAllButtonText}>Validando...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-done-circle" size={20} color="white" />
                    <Text style={styles.validateAllButtonText}>
                      Validar Todas ({filteredBets.length})
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
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
                <View style={styles.betHeaderContainer}>
                  <View style={styles.betHeaderContent}>
                    <TouchableOpacity
                      style={styles.expandIconButton}
                      onPress={() => toggleExpandBet(bet.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isExpanded ? 'chevron-up-circle' : 'chevron-down-circle'}
                        size={24}
                        color={colors.primaryGold}
                      />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.betHeader}
                      onPress={() => toggleExpandBet(bet.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.betInfo}>
                        <View style={styles.betMainInfo}>
                          <Text style={styles.betUserName}>👤 {bet.userName}</Text>
                        </View>
                        <View style={styles.betSecondaryInfo}>
                          <Text style={styles.betDetails}>
                            🎰 {bet.lotteryName} - {bet.throwName}
                          </Text>
                        </View>
                        <Text style={styles.betDate}>📅 {convertUTCToLocalTime(bet.date)}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Monto total y botón de validación */}
                  <View style={styles.actionContainer}>
                    <Text style={styles.totalAmountLabel}>${formatAmount(totalAmount)}</Text>
                    <TouchableOpacity
                      style={styles.quickValidateButton}
                      onPress={() => handleValidateBet(bet)}
                      disabled={isValidating}
                    >
                      <LinearGradient
                        colors={['#22c55e', '#16a34a']}
                        style={styles.quickValidateGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        {isValidating ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Ionicons name="checkmark-circle" size={24} color="white" />
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>

                {isExpanded && (
                  <View style={styles.betDetailsContainer}>
                    {/* Detalle de jugadas - cada número con su tipo */}
                    <View style={styles.allNumbersContainer}>
                      {(bet.betPlays || bet.jugadas || []).map((betPlay, betPlayIdx) => (
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
                                    <Text style={styles.numberAmount}>${formatAmount(detail.amount)}</Text>
                                  </View>
                                );
                              })}
                            </React.Fragment>
                          ))}
                        </React.Fragment>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
          </ScrollView>
      </Card>

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
      return sum + betPlay.moves.reduce((moveSum, move) => {
        // Si hay moveDetails, sumar desde ahí
        if (move.moveDetails && Array.isArray(move.moveDetails)) {
          return moveSum + move.moveDetails.reduce((detailSum, detail) => detailSum + (detail.amount || 0), 0);
        }
        // Si no, usar totalAmount del move
        return moveSum + (move.totalAmount || 0);
      }, 0);
    }
    return sum;
  }, 0);
};

const getBetTypeColor = (type: string): string => {
  switch (type) {
    case 'FIJO':
    case 'Fijo':
      return '#2563eb'; // Azul
    case 'CORRIDO':
    case 'Corrido':
      return '#16a34a'; // Verde
    case 'CENTENA':
    case 'Centena':
      return '#7c3aed'; // Morado
    case 'PARLET':
    case 'Parlet':
      return '#dc2626'; // Rojo
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
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  applyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  applyButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: 'white',
    flexShrink: 1,
    textAlign: 'center',
  },
  validateAllButton: {
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  validateAllButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  validateAllButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: 'white',
    flexShrink: 1,
    textAlign: 'center',
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
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryGold,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  betHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  betHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandIconButton: {
    padding: spacing.xs,
    paddingLeft: spacing.sm,
  },
  betHeader: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },
  totalAmountLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    color: colors.primaryGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  quickValidateButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  quickValidateGradient: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  betInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  betMainInfo: {
    marginBottom: 2,
  },
  betUserName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
  },
  betSecondaryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  betDetails: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
  },
  betDate: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
  },
  betDetailsContainer: {
    backgroundColor: colors.darkBackground,
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.inputBorder,
  },
  allNumbersContainer: {
    gap: spacing.xs,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
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
  numberAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default ValidacionApuestas;
