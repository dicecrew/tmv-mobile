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
import DateRangePicker from '../common/DateRangePicker';
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
  summary?: Summary;
  inicialPool?: number;
  endPool?: number;
  throwResult?: ThrowResult | null;
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
  playTypeName?: string;
  moveDetails?: MoveDetail[];
}

interface MoveDetail {
  number: string;
  secondNumber?: string;
  amount: number;
  profit?: number;
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
  const [showHistory, setShowHistory] = useState(false);

  const [players, setPlayers] = useState<Player[]>([]);
  const [betResumes, setBetResumes] = useState<BetResume[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [expandedBetResumes, setExpandedBetResumes] = useState<Set<string>>(new Set());
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

  // Manejar cambio de rango de fechas
  const handleDateRangeChange = (dateFrom: Date, dateTo: Date) => {
    setDateFrom(dateFrom);
    setDateTo(dateTo);
  };

  // Alternar expansión del BetResume
  const toggleExpandBetResume = (betResumeId: string) => {
    setExpandedBetResumes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(betResumeId)) {
        newSet.delete(betResumeId);
      } else {
        newSet.add(betResumeId);
      }
      return newSet;
    });
  };

  // Alternar expansión de una apuesta individual
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

  // Limpiar filtros
  const handleClearFilters = () => {
    setSelectedPlayer('');
    setDateFrom(new Date());
    setDateTo(new Date());
    setShowHistory(false);
    setBetResumes([]);
    setSummary(null);
    setExpandedBetResumes(new Set());
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
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const time = date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      return `${day}/${month}/${year}, ${time}`;
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

  // Traducir estado al español
  const getBetStatus = (stateCode: string): string => {
    const statusMap: { [key: string]: string } = {
      WON: 'Ganada',
      LOST: 'Perdida',
      PENDING: 'Pendiente',
      CANCELLED: 'Cancelada',
      ACTIVE: 'Activa',
      PAID: 'Pagada',
      APPROVED: 'Aprobada',
      Approved: 'Aprobada',
      New: 'Nueva',
    };
    return statusMap[stateCode] || stateCode;
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

  // Resumen detallado por lotería
  const getDetailedBetResumeSummary = (betResume: BetResume) => {
    let totalAmount = 0;
    let totalPrize = 0;
    let totalBets = betResume.bets?.length || 0;
    const uniquePlayers = new Set<string>();

    betResume.bets?.forEach((bet) => {
      uniquePlayers.add(bet.userId);
      bet.betPlays?.forEach((betPlay) => {
        betPlay.moves?.forEach((move) => {
          totalAmount += move.totalAmount || 0;
          if (move.profit && move.profit > 0) {
            totalPrize += move.profit;
          }
        });
      });
    });

    const netProfit = totalPrize - totalAmount;
    const ownProfit = -netProfit; // Ganancia propia es lo inverso
    const profitBenefit = 0; // Por ahora en 0, se puede calcular según porcentaje
    
    const initialPool = betResume.inicialPool || 0;
    const finalPool = betResume.endPool || 0;
    
    // Verificar si hay números ganadores desde throwResult
    const hasWinningNumbers = !!(
      betResume.throwResult?.centena || 
      betResume.throwResult?.corrido1 || 
      betResume.throwResult?.corrido2
    );

    return {
      totalBets,
      totalAmount,
      uniquePlayers: uniquePlayers.size,
      totalPrize,
      netProfit,
      ownProfit,
      profitBenefit,
      initialPool,
      finalPool,
      hasWinningNumbers,
      centena: betResume.throwResult?.centena || null,
      corrido1: betResume.throwResult?.corrido1 || null,
      corrido2: betResume.throwResult?.corrido2 || null,
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

            <DateRangePicker
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              onRangeChange={handleDateRangeChange}
              label="Rango de Fechas"
              maximumDate={new Date()}
              dateFormat="short"
              showLabels={true}
              required={true}
              helpText="Selecciona el rango de fechas para consultar el historial"
            />

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
                const isResumeExpanded = expandedBetResumes.has(betResume.id);
                const resumeSummary = getBetResumeSummary(betResume);
                const detailedSummary = getDetailedBetResumeSummary(betResume);

                return (
                  <View key={betResume.id} style={styles.betResumeCard}>
                    {/* Barra de estado superior */}
                    {detailedSummary.hasWinningNumbers ? (
                      <View style={styles.statusBarWinning}>
                        <View style={styles.statusBarLeft}>
                          <Ionicons name="trophy" size={20} color={colors.primaryGold} />
                          <Text style={styles.statusBarLabel}>Ganadores</Text>
                        </View>
                        <View style={styles.winningNumbersRow}>
                          {detailedSummary.centena && (
                            <View style={styles.winningChip}>
                              <Text style={styles.winningChipText}>{detailedSummary.centena}</Text>
                            </View>
                          )}
                          {detailedSummary.corrido1 && (
                            <View style={styles.winningChip}>
                              <Text style={styles.winningChipText}>{detailedSummary.corrido1}</Text>
                            </View>
                          )}
                          {detailedSummary.corrido2 && (
                            <View style={styles.winningChip}>
                              <Text style={styles.winningChipText}>{detailedSummary.corrido2}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ) : (
                      <View style={styles.statusBarNoResults}>
                        <Ionicons name="time-outline" size={20} color={colors.primaryRed} />
                        <Text style={styles.statusBarNoResultsText}>Sin Resultados</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.betResumeHeader}
                      onPress={() => toggleExpandBetResume(betResume.id)}
                    >
                      <View style={styles.betResumeHeaderContent}>
                        {/* Primera fila: Lotería */}
                        <View style={styles.headerRow}>
                          <View style={styles.lotterySection}>
                            <Ionicons name="game-controller-outline" size={14} color={colors.primaryGold} />
                            <Text style={styles.betResumeLottery}>
                              {betResume.lotteryName} - {betResume.throwName}
                            </Text>
                          </View>
                        </View>

                        {/* Segunda fila: Fecha + Apuestas */}
                        <View style={styles.headerRow}>
                          <Text style={styles.dateText}>📅 {convertUTCToLocalTime(betResume.date)}</Text>
                          <Text style={styles.betCountText}>
                            📄 {resumeSummary.totalBets} apuesta{resumeSummary.totalBets !== 1 ? 's' : ''}
                          </Text>
                        </View>

                        {/* Tercera fila: Fondos a la izquierda, Total a la derecha */}
                        <View style={styles.headerRow}>
                          <View style={styles.poolsRow}>
                            <Text style={styles.poolText}>💰 Inicial: ${formatAmount(detailedSummary.initialPool)}</Text>
                            <Text style={styles.poolSeparator}>•</Text>
                            <Text style={styles.poolText}>💎 Final: ${formatAmount(detailedSummary.finalPool)}</Text>
                          </View>
                          <LinearGradient
                            colors={[colors.primaryGold, colors.primaryRed]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.totalBadgeCompact}
                          >
                            <Text style={styles.totalBadgeText}>${formatAmount(resumeSummary.totalAmount)}</Text>
                          </LinearGradient>
                        </View>
                      </View>
                      <Ionicons
                        name={isResumeExpanded ? 'chevron-up-circle' : 'chevron-down-circle'}
                        size={24}
                        color={colors.primaryGold}
                      />
                    </TouchableOpacity>

                    {isResumeExpanded && (
                      <View style={styles.betResumeDetails}>
                        {/* Resumen detallado por lotería */}
                        <View style={styles.lotteryDetailedSummary}>
                          <View style={styles.summaryRowMain}>
                            <View style={styles.summaryMainItem}>
                              <Text style={styles.summaryMainValue}>{detailedSummary.totalBets}</Text>
                              <Text style={styles.summaryMainLabel}>APUESTAS</Text>
                            </View>
                            <View style={styles.summaryMainItem}>
                              <Text style={styles.summaryMainValueGold}>${formatAmount(detailedSummary.totalAmount)}</Text>
                              <Text style={styles.summaryMainLabel}>MONTO TOTAL</Text>
                            </View>
                            <View style={styles.summaryMainItem}>
                              <Text style={styles.summaryMainValue}>{detailedSummary.uniquePlayers}</Text>
                              <Text style={styles.summaryMainLabel}>JUGADOR{detailedSummary.uniquePlayers !== 1 ? 'ES' : ''}</Text>
                            </View>
                          </View>
                          
                          <View style={styles.summaryDetailedGrid}>
                            <View style={styles.summaryDetailedItem}>
                              <Text style={styles.summaryDetailedLabel}>PREMIO TOTAL</Text>
                              <Text style={[styles.summaryDetailedValue, styles.prizeValue]}>
                                ${formatAmount(detailedSummary.totalPrize)}
                              </Text>
                            </View>
                            <View style={styles.summaryDetailedItem}>
                              <Text style={styles.summaryDetailedLabel}>GANANCIA NETA</Text>
                              <Text
                                style={[
                                  styles.summaryDetailedValue,
                                  detailedSummary.netProfit >= 0 ? styles.profitPositive : styles.profitNegative,
                                ]}
                              >
                                ${formatAmount(detailedSummary.netProfit)}
                              </Text>
                            </View>
                            <View style={styles.summaryDetailedItem}>
                              <Text style={styles.summaryDetailedLabel}>GANANCIA PROPIA</Text>
                              <Text
                                style={[
                                  styles.summaryDetailedValue,
                                  detailedSummary.ownProfit >= 0 ? styles.profitPositive : styles.profitNegative,
                                ]}
                              >
                                ${formatAmount(detailedSummary.ownProfit)}
                              </Text>
                            </View>
                            <View style={styles.summaryDetailedItem}>
                              <Text style={styles.summaryDetailedLabel}>BENEFICIO POR GANANCIA</Text>
                              <Text style={[styles.summaryDetailedValue, styles.benefitValue]}>
                                ${formatAmount(detailedSummary.profitBenefit)}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {betResume.bets.map((bet, betIndex) => {
                          const isBetExpanded = expandedBets.has(bet.id);

                          return (
                            <View key={bet.id} style={styles.betItem}>
                              <TouchableOpacity
                                style={styles.betItemHeader}
                                onPress={() => toggleExpandBet(bet.id)}
                                activeOpacity={0.7}
                              >
                                <View style={styles.betItemHeaderLeft}>
                                  <Ionicons
                                    name={isBetExpanded ? 'chevron-up-circle' : 'chevron-down-circle'}
                                    size={20}
                                    color={colors.primaryGold}
                                  />
                                  <View style={styles.betUserInfo}>
                                    <Text style={styles.betUserName}>👤 {bet.userName}</Text>
                                    <Text style={styles.betDate}>📅 {convertUTCToLocalTime(bet.date)}</Text>
                                  </View>
                                </View>
                                <View style={styles.betItemHeaderRight}>
                                  <View
                                    style={[
                                      styles.statusBadge,
                                      { backgroundColor: getStatusColor(bet.stateCode) },
                                    ]}
                                  >
                                    <Text style={styles.statusText}>
                                      {getStatusIcon(bet.stateCode)} {getBetStatus(bet.stateCode)}
                                    </Text>
                                  </View>
                                </View>
                              </TouchableOpacity>

                              {/* Detalle de jugadas - cada número con su tipo (solo si está expandido) */}
                              {isBetExpanded && (
                                <View style={styles.allNumbersContainer}>
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
                                                <Text style={styles.numberAmount}>${formatAmount(detail.amount)}</Text>
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
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.lightText,
    marginBottom: spacing.sm,
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
    borderWidth: 2,
    borderColor: colors.primaryGold,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: colors.primaryGold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  statusBarWinning: {
    backgroundColor: '#1a1a1a',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: colors.primaryGold,
  },
  statusBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusBarLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  winningNumbersRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  winningChip: {
    backgroundColor: colors.primaryGold,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    minWidth: 36,
    alignItems: 'center',
    shadowColor: colors.primaryGold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  winningChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    color: '#1a1a1a',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statusBarNoResults: {
    backgroundColor: '#1a1a1a',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 3,
    borderBottomColor: colors.primaryRed,
  },
  statusBarNoResultsText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primaryRed,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  betResumeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  betResumeHeaderContent: {
    flex: 1,
    gap: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lotterySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  betResumeLottery: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
  },
  betCountText: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
  },
  poolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  poolText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: '#8b5cf6',
  },
  poolSeparator: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
  },
  totalBadgeCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    shadowColor: colors.primaryGold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  totalBadgeText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    color: '#1a1a1a',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
  lotteryDetailedSummary: {
    backgroundColor: colors.darkBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.primaryGold,
  },
  summaryRowMain: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.primaryGold,
  },
  summaryMainItem: {
    alignItems: 'center',
  },
  summaryMainValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.heavy,
    color: colors.lightText,
    marginBottom: spacing.xs,
  },
  summaryMainValueGold: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.heavy,
    color: colors.primaryGold,
    marginBottom: spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  summaryMainLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.subtleGrey,
    textTransform: 'uppercase',
  },
  summaryDetailedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryDetailedItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.inputBackground,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  summaryDetailedLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.subtleGrey,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  summaryDetailedValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  prizeValue: {
    color: '#3b82f6', // Azul para premios
  },
  benefitValue: {
    color: colors.primaryGold,
  },
  poolValue: {
    color: '#8b5cf6', // Púrpura para fondos
  },
  betItem: {
    backgroundColor: colors.darkBackground,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryGold,
  },
  betItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  betItemHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  betItemHeaderRight: {
    alignItems: 'flex-end',
  },
  betUserInfo: {
    flex: 1,
  },
  betUserName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
  },
  betDate: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    marginTop: 2,
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
  allNumbersContainer: {
    gap: spacing.xs,
    marginTop: spacing.sm,
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
});

export default VerHistorial;
