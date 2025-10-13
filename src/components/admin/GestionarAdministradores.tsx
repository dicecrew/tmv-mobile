import React, { useState, useEffect } from 'react';
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
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';
import Card from '../common/Card';
import Toast from 'react-native-toast-message';
import { userService, adminService } from '../../api/services';

interface Admin {
  id: string;
  firstName: string;
  lastName: string;
  nickName?: string;
  phoneNumber: string;
  email?: string;
  roleName: string;
  roleId: string;
  isActive: boolean;
  defaultLotteryId?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  nickName: string;
  phoneNumber: string;
  password: string;
}

interface EditFormData {
  id: string;
  firstName: string;
  lastName: string;
  nickName: string;
  phoneNumber: string;
  roleId: string;
  isActive: boolean;
  defaultLotteryId?: string;
}

const GestionarAdministradores: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    nickName: '',
    phoneNumber: '',
    password: '',
  });

  const [editFormData, setEditFormData] = useState<EditFormData | null>(null);

  // Cargar administradores
  const loadAdmins = async () => {
    setIsLoading(true);
    try {
      const response = await userService.getUsers();
      
      // Filtrar solo administradores
      let userArray: Admin[] = [];
      
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        userArray = Object.values(response.data);
      } else if (Array.isArray(response.data)) {
        userArray = response.data;
      }
      
      const adminUsers = userArray.filter(
        (user: Admin) => user.roleName?.toLowerCase() === 'administrator'
      );
      
      setAdmins(adminUsers);
    } catch (error) {
      console.error('Error loading admins:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron cargar los administradores',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  // Crear administrador
  const handleCreate = async () => {
    // Validar campos
    if (!formData.firstName || !formData.lastName || !formData.phoneNumber || !formData.password) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Todos los campos obligatorios deben estar completos',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    setLoading(true);
    try {
      // Llamar a la API para crear administrador
      await adminService.createAdminUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        nickName: formData.nickName || null,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
      });

      Toast.show({
        type: 'success',
        text1: '¡Éxito!',
        text2: `Administrador ${formData.firstName} ${formData.lastName} creado exitosamente`,
        position: 'top',
        topOffset: 60,
        visibilityTime: 5000,
      });

      // Limpiar formulario y cerrar modal
      setFormData({
        firstName: '',
        lastName: '',
        nickName: '',
        phoneNumber: '',
        password: '',
      });
      setShowCreateModal(false);
      
      // Recargar lista
      loadAdmins();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'No se pudo crear el administrador',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setLoading(false);
    }
  };

  // Editar administrador
  const handleEdit = (admin: Admin) => {
    setEditFormData({
      id: admin.id,
      firstName: admin.firstName || '',
      lastName: admin.lastName || '',
      nickName: admin.nickName || '',
      phoneNumber: admin.phoneNumber || '',
      roleId: admin.roleId,
      isActive: admin.isActive,
      defaultLotteryId: admin.defaultLotteryId,
    });
    setShowEditModal(true);
  };

  // Guardar cambios de edición
  const handleSaveEdit = async () => {
    if (!editFormData) return;

    setLoading(true);
    try {
      await userService.updateUser(editFormData.id, {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        nickName: editFormData.nickName || null,
        phoneNumber: editFormData.phoneNumber,
        roleId: editFormData.roleId,
        isActive: editFormData.isActive,
        defaultLotteryId: editFormData.defaultLotteryId,
        bookieId: null,
      });

      Toast.show({
        type: 'success',
        text1: '¡Éxito!',
        text2: `Administrador ${editFormData.firstName} ${editFormData.lastName} actualizado`,
        position: 'top',
        topOffset: 60,
        visibilityTime: 5000,
      });

      setShowEditModal(false);
      setEditFormData(null);
      loadAdmins();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'No se pudo actualizar el administrador',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setLoading(false);
    }
  };

  // Eliminar administrador
  const handleDelete = (admin: Admin) => {
    Alert.alert(
      '🗑️ Eliminar Administrador',
      `¿Estás seguro de que quieres eliminar a ${admin.firstName} ${admin.lastName}?\n\n⚠️ Esta acción es irreversible`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await userService.deleteUser(admin.id);
              
              Toast.show({
                type: 'success',
                text1: '¡Éxito!',
                text2: `Administrador ${admin.firstName} ${admin.lastName} eliminado`,
                position: 'top',
                topOffset: 60,
                visibilityTime: 5000,
              });
              
              loadAdmins();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'No se pudo eliminar el administrador',
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
      <Card title="Gestionar Administradores" icon="settings-outline" style={styles.card}>
        <Text style={styles.description}>
          Visualiza, edita y elimina los administradores registrados en el sistema.
        </Text>

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
            <Ionicons name="add-circle-outline" size={20} color="white" />
            <Text style={styles.createButtonText}>Crear Nuevo Administrador</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Estados de carga y error */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryGold} />
            <Text style={styles.loadingText}>Cargando administradores...</Text>
          </View>
        )}

        {!isLoading && admins.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="information-circle-outline" size={48} color={colors.subtleGrey} />
            <Text style={styles.emptyText}>No hay administradores registrados</Text>
          </View>
        )}

        <ScrollView style={styles.adminsList}>
          {admins.map((admin) => (
            <View key={admin.id} style={styles.adminItem}>
              <View style={styles.adminHeader}>
                <View style={styles.adminAvatar}>
                  <Ionicons name="shield-checkmark" size={24} color={colors.darkBackground} />
                </View>
                <View style={styles.adminInfo}>
                  <Text style={styles.adminName}>
                    {admin.firstName} {admin.lastName}
                  </Text>
                  {admin.nickName && (
                    <Text style={styles.adminNickname}>({admin.nickName})</Text>
                  )}
                  <Text style={styles.adminPhone}>📞 {admin.phoneNumber}</Text>
                  {admin.email && (
                    <Text style={styles.adminEmail}>📧 {admin.email}</Text>
                  )}
                </View>
              </View>
              <View style={styles.adminActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEdit(admin)}
                >
                  <Ionicons name="pencil-outline" size={16} color={colors.darkBackground} />
                  <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(admin)}
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
              <Text style={styles.modalTitle}>Nuevo Administrador</Text>
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
                  value={formData.firstName}
                  onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Apellido *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Pérez"
                  placeholderTextColor={colors.subtleGrey}
                  value={formData.lastName}
                  onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Apodo (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="JP"
                  placeholderTextColor={colors.subtleGrey}
                  value={formData.nickName}
                  onChangeText={(text) => setFormData({ ...formData, nickName: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Teléfono *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+56912345678"
                  placeholderTextColor={colors.subtleGrey}
                  value={formData.phoneNumber}
                  onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
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
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
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

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCreate}
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
                      <Text style={styles.submitButtonText}>Crear Administrador</Text>
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
              <Text style={styles.modalTitle}>Editar Administrador</Text>
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
  createButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  createButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
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
  adminsList: {
    flex: 1,
  },
  adminItem: {
    backgroundColor: colors.darkBackground,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryGold,
    marginBottom: spacing.md,
  },
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  adminAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
  },
  adminNickname: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
    fontStyle: 'italic',
  },
  adminPhone: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
    marginTop: spacing.xs,
  },
  adminEmail: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
  },
  adminActions: {
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

export default GestionarAdministradores;
