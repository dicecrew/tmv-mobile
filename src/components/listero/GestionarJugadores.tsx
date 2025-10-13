import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';
import Card from '../common/Card';
import Toast from 'react-native-toast-message';
import { bookieService, userService, lotteryService } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';

interface Jugador {
  id: string;
  firstName: string;
  lastName: string;
  nickName?: string | null;
  phoneNumber: string;
  email?: string;
  role: string;
  roleId: string;
  bookieId?: string | null;
  defaultLotteryId?: string | null;
  status: string;
}

interface Lottery {
  id: string;
  name: string;
}

interface CreateFormData {
  firstName: string;
  lastName: string;
  nickName: string;
  phoneNumber: string;
  password: string;
  defaultLotteryId: string;
}

interface EditFormData {
  id: string;
  firstName: string;
  lastName: string;
  nickName: string;
  phoneNumber: string;
  roleId: string;
  bookieId?: string | null;
  defaultLotteryId?: string | null;
  email?: string;
}

const GestionarJugadores: React.FC = () => {
  const { user: currentUser } = useAuth();
  
  // Extraer bookieId del usuario logueado
  const bookieId = currentUser?.roleName === 'Bookie' ? currentUser?.bookieId : null;

  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLotteries, setIsLoadingLotteries] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [createFormData, setCreateFormData] = useState<CreateFormData>({
    firstName: '',
    lastName: '',
    nickName: '',
    phoneNumber: '',
    password: '',
    defaultLotteryId: '',
  });

  const [editFormData, setEditFormData] = useState<EditFormData | null>(null);

  // Cargar jugadores del bookie
  const loadJugadores = async () => {
    if (!bookieId) {
      console.warn('No hay bookieId disponible');
      return;
    }

    setIsLoading(true);
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
      
      // Filtrar solo jugadores (User role)
      const filteredUsers = usersArray.filter((user) => user.roleName === 'User');
      
      const mappedJugadores: Jugador[] = filteredUsers.map((user) => ({
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        nickName: user.nickName || null,
        phoneNumber: user.phoneNumber || 'N/A',
        email: user.email || 'N/A',
        role: user.roleName || 'Jugador',
        roleId: user.roleId || 'e0f85dbd-4dbd-4add-9364-35fac099f282',
        bookieId: user.bookieId,
        defaultLotteryId: user.defaultLotteryId,
        status: 'active',
      }));
      
      setJugadores(mappedJugadores);
    } catch (error) {
      console.error('Error loading jugadores:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron cargar los jugadores',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar loterías activas
  const loadLotteries = async () => {
    setIsLoadingLotteries(true);
    try {
      const response = await lotteryService.getActiveLotteries();
      
      let lotteriesArray: any[] = [];
      if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        lotteriesArray = Object.values(response.data);
      } else if (Array.isArray(response.data)) {
        lotteriesArray = response.data;
      } else if (Array.isArray(response)) {
        lotteriesArray = response;
      }
      
      setLotteries(lotteriesArray);
    } catch (error) {
      console.error('Error loading lotteries:', error);
    } finally {
      setIsLoadingLotteries(false);
    }
  };

  useEffect(() => {
    if (bookieId) {
      loadJugadores();
      loadLotteries();
    }
  }, [bookieId]);

  // Filtrar jugadores
  const filteredJugadores = useMemo(() => {
    const term = searchQuery.toLowerCase();
    const filtered = jugadores.filter(
      (jugador) =>
        jugador.firstName?.toLowerCase().includes(term) ||
        jugador.lastName?.toLowerCase().includes(term) ||
        jugador.nickName?.toLowerCase().includes(term) ||
        jugador.phoneNumber?.toLowerCase().includes(term)
    );
    
    return filtered.sort((a, b) => {
      const nameA = (a.firstName || '').toLowerCase();
      const nameB = (b.firstName || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [jugadores, searchQuery]);

  // Validar teléfono internacional
  const validateInternationalPhone = (phone: string): { isValid: boolean; formatted: string; error?: string } => {
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    const internationalPhoneRegex = /^(\+?[1-9]\d{1,4})?[2-9]\d{6,14}$/;
    
    if (!internationalPhoneRegex.test(cleanPhone)) {
      return {
        isValid: false,
        formatted: cleanPhone,
        error: 'Número de teléfono inválido en formato internacional',
      };
    }

    let formattedPhone = cleanPhone;
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+1${formattedPhone}`;
    }

    return { isValid: true, formatted: formattedPhone };
  };

  // Crear jugador
  const handleCreateJugador = async () => {
    // Validaciones
    if (!createFormData.firstName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'El nombre es requerido',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    if (!createFormData.phoneNumber.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'El teléfono es requerido',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    // Validar teléfono
    const phoneValidation = validateInternationalPhone(createFormData.phoneNumber);
    if (!phoneValidation.isValid) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: phoneValidation.error || 'Teléfono inválido',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    if (!createFormData.password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'La contraseña es requerida',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    if (createFormData.password.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'La contraseña debe tener al menos 6 caracteres',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    const lotteryName = createFormData.defaultLotteryId
      ? lotteries.find((l) => l.id === createFormData.defaultLotteryId)?.name || 'N/A'
      : 'Sin lotería predeterminada';

    // Confirmación
    Alert.alert(
      '🎯 Crear Nuevo Jugador',
      `¿Estás seguro de que quieres crear este jugador?\n\n` +
      `👤 Nombre: ${createFormData.firstName} ${createFormData.lastName}\n` +
      `🏷️ Apodo: ${createFormData.nickName || 'Sin apodo'}\n` +
      `📱 Teléfono: ${phoneValidation.formatted}\n` +
      `🎲 Lotería: ${lotteryName}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Crear',
          onPress: async () => {
    setLoading(true);
    try {
              const userData = {
                firstName: createFormData.firstName.trim(),
                lastName: createFormData.lastName.trim() || null,
                nickName: createFormData.nickName.trim() || null,
                phoneNumber: phoneValidation.formatted,
                password: createFormData.password,
                defaultLotteryId: createFormData.defaultLotteryId || null,
              };

              await userService.createUserByBookie(userData);

      Toast.show({
        type: 'success',
        text1: '¡Éxito!',
                text2: `Jugador ${createFormData.firstName} ${createFormData.lastName} creado`,
        position: 'top',
        topOffset: 60,
                visibilityTime: 5000,
              });

              setCreateFormData({
                firstName: '',
                lastName: '',
                nickName: '',
                phoneNumber: '',
                password: '',
                defaultLotteryId: '',
              });
              setShowCreateModal(false);
              loadJugadores();
            } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
                text2: error.response?.data?.message || error.message || 'No se pudo crear el jugador',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setLoading(false);
    }
          },
        },
      ]
    );
  };

  // Editar jugador
  const handleEditJugador = (jugador: Jugador) => {
    setEditFormData({
      id: jugador.id,
      firstName: jugador.firstName || '',
      lastName: jugador.lastName || '',
      nickName: jugador.nickName || '',
      phoneNumber: jugador.phoneNumber || '',
      roleId: jugador.roleId,
      bookieId: jugador.bookieId,
      defaultLotteryId: jugador.defaultLotteryId || '',
      email: jugador.email,
    });
    setShowEditModal(true);
  };

  // Guardar cambios
  const handleSaveEdit = async () => {
    if (!editFormData) return;

    setLoading(true);
    try {
      const updateData = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName || null,
        nickName: editFormData.nickName || null,
        phoneNumber: editFormData.phoneNumber,
        roleId: editFormData.roleId || 'e0f85dbd-4dbd-4add-9364-35fac099f282',
        defaultLotteryId: editFormData.defaultLotteryId || null,
        bookieId: editFormData.bookieId || null,
        isActive: true,
      };

      await userService.updateUser(editFormData.id, updateData);

      Toast.show({
        type: 'success',
        text1: '¡Éxito!',
        text2: `Jugador ${editFormData.firstName} ${editFormData.lastName} actualizado`,
        position: 'top',
        topOffset: 60,
        visibilityTime: 5000,
      });

      setShowEditModal(false);
      setEditFormData(null);
      loadJugadores();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || error.message || 'No se pudo actualizar el jugador',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setLoading(false);
    }
  };

  // Eliminar jugador
  const handleDeleteJugador = (jugador: Jugador) => {
    const fullName = `${jugador.firstName} ${jugador.lastName}`.trim();
    
    Alert.alert(
      '🗑️ Eliminar Jugador',
      `¿Estás seguro de que quieres eliminar a ${fullName}?\n\n⚠️ Esta acción es irreversible`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await userService.deleteUser(jugador.id);

              Toast.show({
                type: 'success',
                text1: '¡Éxito!',
                text2: `Jugador ${fullName} eliminado`,
                position: 'top',
                topOffset: 60,
                visibilityTime: 5000,
              });
              
              loadJugadores();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'No se pudo eliminar el jugador',
                position: 'top',
                topOffset: 60,
              });
            }
          },
        },
      ]
    );
  };

  if (!bookieId) {
    return (
      <View style={styles.container}>
        <Card title="Gestionar Jugadores" icon="people-outline">
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={64} color={colors.subtleGrey} />
            <Text style={styles.emptyText}>No se pudo obtener el ID del bookie</Text>
            <Text style={styles.emptySubtext}>Por favor, verifica tu sesión</Text>
          </View>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card title="Gestionar Jugadores" icon="people-outline" style={styles.card}>
        <Text style={styles.description}>
          Visualiza, edita y elimina los jugadores registrados en el sistema.
        </Text>

        {/* Toolbar */}
        <View style={styles.toolbar}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={colors.subtleGrey} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar jugador..."
              placeholderTextColor={colors.subtleGrey}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredJugadores.length}</Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.createButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="add-outline" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Estados de carga */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryGold} />
            <Text style={styles.loadingText}>Cargando jugadores...</Text>
          </View>
        )}

        {!isLoading && filteredJugadores.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="information-circle-outline" size={48} color={colors.subtleGrey} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No se encontraron jugadores' : 'No hay jugadores registrados'}
            </Text>
          </View>
        )}

        {/* Lista de jugadores */}
        <ScrollView style={styles.jugadoresList}>
          {filteredJugadores.map((jugador) => (
            <View key={jugador.id} style={styles.jugadorItem}>
              <View style={styles.jugadorInfo}>
                <Text style={styles.jugadorName}>
                  {jugador.firstName} {jugador.lastName}
                </Text>
                {jugador.nickName && (
                  <Text style={styles.jugadorNickname}>({jugador.nickName})</Text>
                )}
                <Text style={styles.jugadorDetail}>📞 {jugador.phoneNumber}</Text>
                {jugador.email && jugador.email !== 'N/A' && (
                  <Text style={styles.jugadorDetail}>📧 {jugador.email}</Text>
                )}
              </View>
              <View style={styles.jugadorActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditJugador(jugador)}
                >
                  <Ionicons name="pencil-outline" size={16} color={colors.darkBackground} />
                  <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteJugador(jugador)}
                >
                  <Ionicons name="trash-outline" size={16} color="white" />
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </Card>

      {/* Modal Crear */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowCreateModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registrar Nuevo Jugador</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close-outline" size={28} color={colors.subtleGrey} />
              </TouchableOpacity>
            </View>

            <ScrollView>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Nombre *</Text>
        <TextInput
          style={styles.input}
          placeholder="Juan"
          placeholderTextColor={colors.subtleGrey}
                  value={createFormData.firstName}
                  onChangeText={(text) => setCreateFormData({ ...createFormData, firstName: text })}
        />
      </View>

      <View style={styles.formGroup}>
                <Text style={styles.label}>Apellido</Text>
        <TextInput
          style={styles.input}
                  placeholder="Pérez (opcional)"
          placeholderTextColor={colors.subtleGrey}
                  value={createFormData.lastName}
                  onChangeText={(text) => setCreateFormData({ ...createFormData, lastName: text })}
        />
      </View>

      <View style={styles.formGroup}>
                <Text style={styles.label}>Apodo</Text>
        <TextInput
          style={styles.input}
                  placeholder="JP (opcional)"
          placeholderTextColor={colors.subtleGrey}
                  value={createFormData.nickName}
                  onChangeText={(text) => setCreateFormData({ ...createFormData, nickName: text })}
        />
      </View>

      <View style={styles.formGroup}>
                <Text style={styles.label}>Teléfono Celular *</Text>
        <TextInput
          style={styles.input}
                  placeholder="+1 (555) 123-4567"
          placeholderTextColor={colors.subtleGrey}
                  value={createFormData.phoneNumber}
                  onChangeText={(text) => setCreateFormData({ ...createFormData, phoneNumber: text })}
                  keyboardType="phone-pad"
        />
                <Text style={styles.helperText}>Formato internacional: +[código país] [número]</Text>
      </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Contraseña *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor={colors.subtleGrey}
                    value={createFormData.password}
                    onChangeText={(text) => setCreateFormData({ ...createFormData, password: text })}
                    secureTextEntry={!showPassword}
                  />
        <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.subtleGrey}
                    />
        </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Lotería por Defecto</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={createFormData.defaultLotteryId}
                    onValueChange={(value) =>
                      setCreateFormData({ ...createFormData, defaultLotteryId: value })
                    }
                    style={styles.picker}
                    enabled={!isLoadingLotteries}
                  >
                    <Picker.Item label="-- Seleccione una lotería (opcional) --" value="" />
                    {isLoadingLotteries && (
                      <Picker.Item label="Cargando loterías..." value="" enabled={false} />
                    )}
                    {lotteries.map((lottery) => (
                      <Picker.Item key={lottery.id} label={lottery.name} value={lottery.id} />
                    ))}
                  </Picker>
                </View>
                <Text style={styles.helperText}>Esta será la lotería predeterminada para el jugador</Text>
              </View>

        <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCreateJugador}
          disabled={loading}
        >
          <LinearGradient
            colors={['#22c55e', '#16a34a']}
                  style={styles.submitButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
                    <>
                      <Ionicons name="person-add-outline" size={20} color="white" />
                      <Text style={styles.submitButtonText}>Crear Jugador</Text>
                    </>
            )}
          </LinearGradient>
        </TouchableOpacity>
            </ScrollView>
      </View>
    </View>
      </Modal>

      {/* Modal Editar */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowEditModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Jugador</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close-outline" size={28} color={colors.subtleGrey} />
              </TouchableOpacity>
        </View>

            {editFormData && (
              <ScrollView>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Nombre</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Juan"
                    placeholderTextColor={colors.subtleGrey}
                    value={editFormData.firstName}
                    onChangeText={(text) => setEditFormData({ ...editFormData, firstName: text })}
                  />
      </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Apellido</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Pérez"
                    placeholderTextColor={colors.subtleGrey}
                    value={editFormData.lastName}
                    onChangeText={(text) => setEditFormData({ ...editFormData, lastName: text })}
                  />
        </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Apodo</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="JP"
                    placeholderTextColor={colors.subtleGrey}
                    value={editFormData.nickName}
                    onChangeText={(text) => setEditFormData({ ...editFormData, nickName: text })}
                  />
      </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Teléfono</Text>
            <TextInput
                    style={styles.input}
                    placeholder="+56912345678"
              placeholderTextColor={colors.subtleGrey}
                    value={editFormData.phoneNumber}
                    onChangeText={(text) => setEditFormData({ ...editFormData, phoneNumber: text })}
                    keyboardType="phone-pad"
            />
          </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Lotería por Defecto</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={editFormData.defaultLotteryId || ''}
                      onValueChange={(value) =>
                        setEditFormData({ ...editFormData, defaultLotteryId: value || null })
                      }
                      style={styles.picker}
                    >
                      <Picker.Item label="-- Sin lotería --" value="" />
                      {lotteries.map((lottery) => (
                        <Picker.Item key={lottery.id} label={lottery.name} value={lottery.id} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.buttonGroup}>
          <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowEditModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveEdit}
                    disabled={loading}
          >
            <LinearGradient
                      colors={['#22c55e', '#16a34a']}
                      style={styles.saveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
          {loading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                      )}
                    </LinearGradient>
            </TouchableOpacity>
          </View>
              </ScrollView>
            )}
        </View>
        </View>
      </Modal>
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
  toolbar: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.darkBackground,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.lightText,
  },
  countBadge: {
    backgroundColor: colors.primaryGold,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 32,
    alignItems: 'center',
  },
  countText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.darkBackground,
  },
  createButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  createButtonGradient: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
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
  emptySubtext: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
    textAlign: 'center',
  },
  jugadoresList: {
    flex: 1,
  },
  jugadorItem: {
    backgroundColor: colors.darkBackground,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryGold,
    marginBottom: spacing.md,
  },
  jugadorInfo: {
    marginBottom: spacing.sm,
  },
  jugadorName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
  },
  jugadorNickname: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
    fontStyle: 'italic',
  },
  jugadorDetail: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
    marginTop: spacing.xs,
  },
  jugadorActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryGold,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  editButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.darkBackground,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryRed,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  deleteButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.inputBackground,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
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
  input: {
    backgroundColor: colors.darkBackground,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.lightText,
  },
  helperText: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    marginTop: spacing.xs,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: spacing.xs,
  },
  pickerContainer: {
    backgroundColor: colors.darkBackground,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
  },
  picker: {
    color: colors.lightText,
  },
  submitButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  submitButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: 'white',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.subtleGrey,
  },
  saveButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: 'white',
  },
});

export default GestionarJugadores;
