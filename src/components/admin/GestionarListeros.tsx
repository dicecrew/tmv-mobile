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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Combobox, { ComboboxOption } from '../common/Combobox';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';
import Card from '../common/Card';
import Toast from 'react-native-toast-message';
import { bookieService, lotteryService } from '../../api/services';

interface Listero {
  id: string;
  belongToUserId: string;
  name: string;
  nickName?: string | null;
  phone: string;
  pendingAmount: number;
  throwPercent: number;
  revenuePercent: number;
  defaultLotteryId?: string | null;
  defaultLotteryName?: string | null;
  status: string;
}

interface CreateFormData {
  firstName: string;
  lastName: string;
  nickName: string;
  phoneNumber: string;
  password: string;
  pool: string;
  throwPercent: string;
  revenuePercent: string;
  defaultLotteryId: string;
}

interface EditFormData {
  id: string;
  belongToUserId: string;
  name: string;
  pendingAmount: number;
  throwPercent: number;
  revenuePercent: number;
  defaultLotteryId: string;
}

const GestionarListeros: React.FC = () => {
  const [listeros, setListeros] = useState<Listero[]>([]);
  const [lotteries, setLotteries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
    pool: '',
    throwPercent: '',
    revenuePercent: '',
    defaultLotteryId: '',
  });

  const [editFormData, setEditFormData] = useState<EditFormData | null>(null);

  // Cargar loterías
  const loadLotteries = async () => {
    try {
      const response = await lotteryService.getActiveLotteries();
      let lotteriesArray: any[] = [];
      
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        lotteriesArray = Object.values(response.data);
      } else if (Array.isArray(response.data)) {
        lotteriesArray = response.data;
      }
      
      setLotteries(lotteriesArray);
    } catch (error) {
      console.error('Error loading lotteries:', error);
    }
  };

  // Cargar listeros
  const loadListeros = async () => {
    setIsLoading(true);
    try {
      const response = await bookieService.getBookies();
      
      let bookiesArray: any[] = [];
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        bookiesArray = Object.values(response.data);
      } else if (Array.isArray(response.data)) {
        bookiesArray = response.data;
      }
      
      const mappedListeros: Listero[] = bookiesArray.map((bookie) => ({
        id: bookie.id,
        belongToUserId: bookie.belongToUserId,
        name: bookie.belongToUserName || `${bookie.firstName || ''} ${bookie.lastName || ''}`.trim(),
        nickName: bookie.nickName || null,
        phone: bookie.phoneNumber || 'N/A',
        pendingAmount: bookie.pool || 0,
        throwPercent: (bookie.throwPercent || 0.10) * 100,
        revenuePercent: (bookie.revenuePercent || 0.05) * 100,
        defaultLotteryId: bookie.defaultLotteryId || null,
        defaultLotteryName: bookie.defaultLotteryName || null,
        status: 'active',
      }));
      
      setListeros(mappedListeros);
    } catch (error) {
      console.error('Error loading listeros:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron cargar los listeros',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadListeros();
    loadLotteries();
  }, []);

  // Filtrar listeros
  const filteredListeros = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return listeros.filter((listero) =>
      listero.name.toLowerCase().includes(query) ||
      listero.phone.includes(query) ||
      (listero.nickName && listero.nickName.toLowerCase().includes(query))
    );
  }, [listeros, searchQuery]);

  // Validar teléfono internacional
  const validateInternationalPhone = (phone: string): { isValid: boolean; formatted: string; error?: string } => {
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    const internationalPhoneRegex = /^(\+?[1-9]\d{1,4})?[2-9]\d{6,14}$/;
    
    if (!internationalPhoneRegex.test(cleanPhone)) {
      return {
        isValid: false,
        formatted: cleanPhone,
        error: 'Número de teléfono inválido en formato internacional'
      };
    }

    let formattedPhone = cleanPhone;
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+1${formattedPhone}`;
    }

    return { isValid: true, formatted: formattedPhone };
  };

  // Convertir lotteries a opciones del combobox
  const lotteryOptions: ComboboxOption[] = lotteries.map(lottery => ({
    id: lottery.id,
    label: lottery.name,
    value: lottery.id,
  }));

  // Crear listero
  const handleCreateListero = async () => {
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

    if (!createFormData.lastName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'El apellido es requerido',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    if (!createFormData.phoneNumber.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'El número de teléfono es requerido',
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

    // Confirmación
    Alert.alert(
      '🎯 Crear Nuevo Listero',
      `¿Estás seguro de que quieres crear este listero?\n\n` +
      `👤 Nombre: ${createFormData.firstName} ${createFormData.lastName}\n` +
      `🏷️ Apodo: ${createFormData.nickName || 'Sin apodo'}\n` +
      `📱 Teléfono: ${phoneValidation.formatted}\n` +
      `🎯 Lotería por defecto: ${createFormData.defaultLotteryId ? (lotteries.find(l => l.id === createFormData.defaultLotteryId)?.name || 'N/A') : 'Sin lotería por defecto'}\n` +
      `💰 Fondo: $${parseInt(createFormData.pool || '0').toLocaleString()}\n` +
      `🎯 % Tiro: ${parseFloat(createFormData.throwPercent || '0')}%\n` +
      `💵 % Ingresos: ${parseFloat(createFormData.revenuePercent || '0')}%`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Crear',
          onPress: async () => {
            setLoading(true);
            try {
              const bookieData = {
                firstName: createFormData.firstName.trim(),
                lastName: createFormData.lastName.trim(),
                nickName: createFormData.nickName.trim() || null,
                phoneNumber: phoneValidation.formatted,
                password: createFormData.password,
                defaultLotteryId: createFormData.defaultLotteryId || null,
                pool: 0,
                throwPercent: parseFloat(createFormData.throwPercent || '0') / 100,
                revenuePercent: parseFloat(createFormData.revenuePercent || '0') / 100,
              };

              await bookieService.createBookieWithUser(bookieData);

              Toast.show({
                type: 'success',
                text1: '¡Éxito!',
                text2: `Listero ${createFormData.firstName} ${createFormData.lastName} creado`,
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
                pool: '',
                throwPercent: '',
                revenuePercent: '',
                defaultLotteryId: '',
              });
              setShowCreateModal(false);
              loadListeros();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || error.message || 'No se pudo crear el listero',
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

  // Editar listero
  const handleEditListero = (listero: Listero) => {
    setEditFormData({
      id: listero.id,
      belongToUserId: listero.belongToUserId,
      name: listero.name,
      pendingAmount: listero.pendingAmount,
      throwPercent: listero.throwPercent,
      revenuePercent: listero.revenuePercent,
      defaultLotteryId: listero.defaultLotteryId || '',
    });
    setShowEditModal(true);
  };

  // Guardar cambios de edición
  const handleSaveEdit = async () => {
    if (!editFormData) return;

    setLoading(true);
    try {
      const updateData = {
        userId: editFormData.belongToUserId,
        defaultLotteryId: editFormData.defaultLotteryId || null,
        pool: Number(editFormData.pendingAmount) || 0,
        throwPercent: Number(editFormData.throwPercent) / 100 || 0,
        revenuePercent: Number(editFormData.revenuePercent) / 100 || 0,
      };

      await bookieService.updateBookie(editFormData.id, updateData);

      Toast.show({
        type: 'success',
        text1: '¡Éxito!',
        text2: `Listero ${editFormData.name} actualizado`,
        position: 'top',
        topOffset: 60,
        visibilityTime: 5000,
      });

      setShowEditModal(false);
      setEditFormData(null);
      loadListeros();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || error.message || 'No se pudo actualizar el listero',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setLoading(false);
    }
  };

  // Eliminar listero
  const handleDeleteListero = (listero: Listero) => {
    Alert.alert(
      '🗑️ Eliminar Listero',
      `¿Estás seguro de que quieres eliminar a ${listero.name}?\n\n⚠️ Esta acción es irreversible`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookieService.deleteBookie(listero.id);
              
            Toast.show({
              type: 'success',
                text1: '¡Éxito!',
                text2: `Listero ${listero.name} eliminado`,
                position: 'top',
                topOffset: 60,
                visibilityTime: 5000,
              });
              
              loadListeros();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'No se pudo eliminar el listero',
              position: 'top',
              topOffset: 60,
            });
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Card title="Gestionar Listeros" icon="people-outline" style={styles.card}>
        <Text style={styles.description}>
          Visualiza, edita y elimina los listeros registrados en el sistema.
        </Text>

        {/* Toolbar */}
        <View style={styles.toolbar}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={colors.subtleGrey} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar listero..."
              placeholderTextColor={colors.subtleGrey}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
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

        {/* Estados de carga y error */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryGold} />
            <Text style={styles.loadingText}>Cargando listeros...</Text>
          </View>
        )}

        {!isLoading && filteredListeros.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="information-circle-outline" size={48} color={colors.subtleGrey} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No se encontraron listeros' : 'No hay listeros registrados'}
            </Text>
          </View>
        )}

        {/* Lista de listeros */}
        <ScrollView style={styles.listerosList}>
          {filteredListeros.map((listero) => (
            <View key={listero.id} style={styles.listeroItem}>
              <View style={styles.listeroInfo}>
                <Text style={styles.listeroName}>{listero.name}</Text>
                {listero.nickName && (
                  <Text style={styles.listeroNickname}>({listero.nickName})</Text>
                )}
                <Text style={styles.listeroDetail}>
                  💰 Fondo: ${listero.pendingAmount.toLocaleString()}
                </Text>
                <Text style={styles.listeroDetail}>
                  🎯 % Tiro: {listero.throwPercent.toFixed(1)}% | 💵 % Ingresos: {listero.revenuePercent.toFixed(1)}%
                </Text>
              </View>
              <View style={styles.listeroActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditListero(listero)}
                >
                  <Ionicons name="pencil-outline" size={16} color={colors.darkBackground} />
                  <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteListero(listero)}
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
            <Text style={styles.modalTitle}>Crear Nuevo Listero</Text>
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
                <Text style={styles.label}>Apellido *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Pérez"
                  placeholderTextColor={colors.subtleGrey}
                  value={createFormData.lastName}
                  onChangeText={(text) => setCreateFormData({ ...createFormData, lastName: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Apodo (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="JP"
                  placeholderTextColor={colors.subtleGrey}
                  value={createFormData.nickName}
                  onChangeText={(text) => setCreateFormData({ ...createFormData, nickName: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Teléfono *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+56912345678"
                  placeholderTextColor={colors.subtleGrey}
                  value={createFormData.phoneNumber}
                  onChangeText={(text) => setCreateFormData({ ...createFormData, phoneNumber: text })}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Contraseña *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="••••••••"
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
                <Combobox
                  options={lotteryOptions}
                  selectedValue={createFormData.defaultLotteryId}
                  onValueChange={(value) => setCreateFormData({ ...createFormData, defaultLotteryId: value })}
                  placeholder="Sin lotería por defecto"
                  label="Lotería por Defecto"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Porcentaje de Tiro (%)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10"
                  placeholderTextColor={colors.subtleGrey}
                  value={createFormData.throwPercent}
                  onChangeText={(text) => setCreateFormData({ ...createFormData, throwPercent: text })}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Porcentaje de Ingresos (%)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="5"
                  placeholderTextColor={colors.subtleGrey}
                  value={createFormData.revenuePercent}
                  onChangeText={(text) => setCreateFormData({ ...createFormData, revenuePercent: text })}
                  keyboardType="decimal-pad"
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCreateListero}
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
                      <Ionicons name="add-circle-outline" size={20} color="white" />
                      <Text style={styles.submitButtonText}>Crear Listero</Text>
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
              <Text style={styles.modalTitle}>Editar Listero</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close-outline" size={28} color={colors.subtleGrey} />
              </TouchableOpacity>
            </View>

            {editFormData && (
              <ScrollView>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Nombre</Text>
                  <TextInput
                    style={[styles.input, styles.disabledInput]}
                    value={editFormData.name}
                    editable={false}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Fondo (Pool)</Text>
                  <TextInput
                    style={[styles.input, styles.disabledInput]}
                    value={editFormData.pendingAmount.toString()}
                    editable={false}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Combobox
                    options={lotteryOptions}
                    selectedValue={editFormData.defaultLotteryId}
                    onValueChange={(value) => setEditFormData({ ...editFormData, defaultLotteryId: value })}
                    placeholder="Sin lotería por defecto"
                    label="Lotería por Defecto"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Porcentaje de Tiro (%)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="10"
                    placeholderTextColor={colors.subtleGrey}
                    value={editFormData.throwPercent.toString()}
                    onChangeText={(text) => setEditFormData({ ...editFormData, throwPercent: parseFloat(text) || 0 })}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Porcentaje de Ingresos (%)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="5"
                    placeholderTextColor={colors.subtleGrey}
                    value={editFormData.revenuePercent.toString()}
                    onChangeText={(text) => setEditFormData({ ...editFormData, revenuePercent: parseFloat(text) || 0 })}
                    keyboardType="decimal-pad"
                  />
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
  listerosList: {
    flex: 1,
  },
  listeroItem: {
    backgroundColor: colors.darkBackground,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryGold,
    marginBottom: spacing.md,
  },
  listeroInfo: {
    marginBottom: spacing.sm,
  },
  listeroName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
  },
  listeroNickname: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
    fontStyle: 'italic',
  },
  listeroDetail: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
    marginTop: spacing.xs,
  },
  listeroActions: {
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
  disabledInput: {
    opacity: 0.6,
    backgroundColor: colors.inputBackground,
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

export default GestionarListeros;
