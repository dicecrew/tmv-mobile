# 📚 Guía de Expansión de Componentes

Esta guía te ayudará a expandir los componentes placeholder creados con las funcionalidades completas del proyecto original.

## 🗂️ Componentes a Expandir

### 1. Componentes de Admin (8 componentes)

#### 📍 Ubicación
`src/components/admin/`

#### 📋 Lista de Componentes

1. **RegistrarGanador.tsx**
   - Funcionalidad: Registrar números ganadores de una tirada
   - Archivo original: `/tmp/tmv_front/src/components/admin/RegistrarGanador.js`

2. **CerrarTiradas.tsx**
   - Funcionalidad: Cerrar tiradas y calcular resultados
   - Archivo original: `/tmp/tmv_front/src/components/admin/CerrarTiradas.js`

3. **VerMovimientos.tsx**
   - Funcionalidad: Ver movimientos y transacciones
   - Archivo original: `/tmp/tmv_front/src/components/admin/VerMovimientos.js`

4. **RegistrarRecaudacion.tsx**
   - Funcionalidad: Registrar ingresos y recaudación
   - Archivo original: `/tmp/tmv_front/src/components/admin/RegistrarRecaudacion.js`

5. **GestionarListeros.tsx**
   - Funcionalidad: Crear, editar, eliminar listeros
   - Archivo original: `/tmp/tmv_front/src/components/admin/GestionarListeros.js`

6. **GestionarTiradas.tsx**
   - Funcionalidad: Gestionar horarios y configuración de tiradas
   - Archivo original: `/tmp/tmv_front/src/components/admin/GestionarTiradas.js`

7. **ReporteRecaudacion.tsx**
   - Funcionalidad: Ver reportes de recaudación por fecha
   - Archivo original: `/tmp/tmv_front/src/components/admin/ReporteRecaudacion.js`

8. **GestionarAdministradores.tsx** (Solo SuperAdmin)
   - Funcionalidad: Gestionar otros administradores
   - Archivo original: `/tmp/tmv_front/src/components/admin/GestionarAdministradores.js`

---

### 2. Componentes de Listero (6 componentes)

#### 📍 Ubicación
`src/components/listero/`

#### 📋 Lista de Componentes

1. **GestionarJugadores.tsx**
   - Funcionalidad: Ver, crear, editar y eliminar jugadores
   - Archivo original: `/tmp/tmv_front/src/components/listero/GestionarJugadores.js`
   - **Características importantes:**
     - Lista de jugadores con búsqueda y filtros
     - Formulario para crear/editar jugadores
     - Modal de confirmación para eliminar

2. **RealizarApuesta.tsx**
   - Funcionalidad: Realizar apuestas en nombre de un jugador
   - Archivo original: `/tmp/tmv_front/src/components/listero/RealizarApuesta.js`

3. **ValidacionApuestas.tsx**
   - Funcionalidad: Ver y validar apuestas pendientes
   - Archivo original: `/tmp/tmv_front/src/components/listero/ValidacionApuestas.js`

4. **VerHistorial.tsx**
   - Funcionalidad: Ver historial de apuestas
   - Archivo original: `/tmp/tmv_front/src/components/listero/VerHistorial.js`

5. **CrearJugador.tsx** (Componente hijo)
   - Funcionalidad: Formulario modal para crear jugador
   - Archivo original: `/tmp/tmv_front/src/components/listero/CrearJugador.js`

---

### 3. Componentes de Jugador (3 componentes)

#### 📍 Ubicación
`src/components/jugador/`

#### 📋 Lista de Componentes

1. **RegistrarApuesta.tsx**
   - Funcionalidad: Registrar nueva apuesta con teclado numérico
   - Archivo original: `/tmp/tmv_front/src/components/jugador/RegistrarApuesta_new.js`
   - **Características importantes:**
     - Selector de lotería y tirada
     - Teclado numérico personalizado
     - Selección de tipo de juego (Fijo, Corrido, Parlet, Centena)
     - Contador de tiempo para cierre de tirada
     - Resumen de apuesta antes de enviar

2. **MisApuestas.tsx**
   - Funcionalidad: Ver historial de apuestas del jugador
   - Archivo original: `/tmp/tmv_front/src/components/jugador/MisApuestas.js`
   - **Características importantes:**
     - Calendario para seleccionar rango de fechas
     - Lista de apuestas agrupadas por fecha
     - Detalles expandibles de cada apuesta
     - Estados: Pendiente, Ganada, Perdida

3. **AprendeAJugar.tsx**
   - Funcionalidad: Guía de cómo jugar y tipos de apuestas
   - Archivo original: `/tmp/tmv_front/src/components/jugador/AprendeAJugar.js`
   - **Características importantes:**
     - Explicación de tipos de juego
     - Ejemplos de multiplicadores
     - Reglas del juego

---

## 🛠️ Cómo Adaptar un Componente Web a React Native

### Paso 1: Analizar el Componente Original

```bash
# Abrir el archivo original
code /tmp/tmv_front/src/components/[role]/[Component].js
```

### Paso 2: Identificar Elementos a Convertir

| Web (React) | Mobile (React Native) |
|-------------|----------------------|
| `<div>` | `<View>` |
| `<p>`, `<span>`, `<h1>`, etc. | `<Text>` |
| `<button>` | `<TouchableOpacity>` o `Button` |
| `<input>` | `<TextInput>` |
| `<select>` | `Picker` de `@react-native-picker/picker` |
| `styled-components` | `StyleSheet.create()` |
| CSS en línea | Objetos de estilo |
| `onClick` | `onPress` |
| `onChange` | `onChangeText` (para TextInput) |
| `toast` (react-hot-toast) | `Toast` de `react-native-toast-message` |

### Paso 3: Template Base

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';
import Card from '../common/Card';
import Button from '../common/Button';
import Toast from 'react-native-toast-message';

// IMPORTAR SERVICIOS NECESARIOS
import { miServicio } from '../../api/services';

interface MiComponenteProps {
  // Props aquí
}

const MiComponente: React.FC<MiComponenteProps> = (props) => {
  // Estados
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  // Efectos
  useEffect(() => {
    fetchData();
  }, []);

  // Funciones
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await miServicio.getData();
      setData(response.data);
    } catch (error) {
      console.error('Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo cargar los datos',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    try {
      // Lógica aquí
      Toast.show({
        type: 'success',
        text1: 'Éxito',
        text2: 'Operación completada',
        position: 'top',
        topOffset: 60,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo completar la operación',
        position: 'top',
        topOffset: 60,
      });
    }
  };

  // Render
  return (
    <ScrollView style={styles.container}>
      <Card title="Mi Componente" icon="star-outline">
        {loading ? (
          <ActivityIndicator size="large" color={colors.primaryGold} />
        ) : (
          <View>
            {/* Contenido aquí */}
            {data.map((item, index) => (
              <View key={index} style={styles.item}>
                <Text style={styles.itemText}>{item.name}</Text>
              </View>
            ))}
            
            <Button
              title="Acción"
              onPress={handleAction}
              variant="primary"
              icon="checkmark-circle-outline"
            />
          </View>
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    padding: spacing.md,
    marginVertical: spacing.xs,
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  itemText: {
    fontSize: fontSize.md,
    color: colors.lightText,
  },
});

export default MiComponente;
```

### Paso 4: Adaptaciones Específicas

#### 📝 Formularios

```typescript
// Antes (Web)
<input
  type="text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  placeholder="Ingresa texto"
/>

// Después (Mobile)
<TextInput
  style={styles.input}
  value={value}
  onChangeText={setValue}
  placeholder="Ingresa texto"
  placeholderTextColor={colors.subtleGrey}
/>
```

#### 📅 Calendarios

```typescript
import { Calendar } from 'react-native-calendars';

<Calendar
  current={new Date().toISOString().split('T')[0]}
  onDayPress={(day) => {
    console.log('selected day', day);
  }}
  markedDates={{
    [selectedDate]: { selected: true, selectedColor: colors.primaryGold }
  }}
  theme={{
    backgroundColor: colors.darkBackground,
    calendarBackground: colors.inputBackground,
    textSectionTitleColor: colors.lightText,
    selectedDayBackgroundColor: colors.primaryGold,
    selectedDayTextColor: colors.darkBackground,
    todayTextColor: colors.primaryGold,
    dayTextColor: colors.lightText,
    textDisabledColor: colors.subtleGrey,
  }}
/>
```

#### 📊 Tablas/Listas

```typescript
import { FlatList } from 'react-native';

<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <View style={styles.listItem}>
      <Text style={styles.listItemText}>{item.name}</Text>
    </View>
  )}
  ItemSeparatorComponent={() => <View style={styles.separator} />}
  ListEmptyComponent={() => (
    <Text style={styles.emptyText}>No hay datos</Text>
  )}
/>
```

#### 🎨 Modales

```typescript
import Modal from 'react-native-modal';

<Modal
  isVisible={showModal}
  onBackdropPress={() => setShowModal(false)}
  animationIn="slideInUp"
  animationOut="slideOutDown"
>
  <View style={styles.modalContent}>
    <Text style={styles.modalTitle}>Título del Modal</Text>
    {/* Contenido */}
    <Button
      title="Cerrar"
      onPress={() => setShowModal(false)}
      variant="secondary"
    />
  </View>
</Modal>
```

---

## 🎯 Prioridad de Implementación

### Alta Prioridad 🔴 (Funcionalidades más usadas)

1. **JugadorDashboard - RegistrarApuesta.tsx**
   - Razón: Función principal para usuarios finales
   - Complejidad: Alta (teclado numérico personalizado)

2. **JugadorDashboard - MisApuestas.tsx**
   - Razón: Segunda función más usada por jugadores
   - Complejidad: Media (calendario y listas)

3. **ListeroDashboard - GestionarJugadores.tsx**
   - Razón: Gestión esencial para listeros
   - Complejidad: Media (CRUD básico)

### Media Prioridad 🟡

4. **ListeroDashboard - ValidacionApuestas.tsx**
5. **ListeroDashboard - VerHistorial.tsx**
6. **AdminDashboard - RegistrarGanador.tsx**
7. **AdminDashboard - CerrarTiradas.tsx**

### Baja Prioridad 🟢

8. Resto de componentes de Admin
9. **JugadorDashboard - AprendeAJugar.tsx** (mayormente estático)

---

## 📝 Checklist para Cada Componente

- [ ] Analizar componente original
- [ ] Identificar estados y efectos
- [ ] Convertir elementos HTML a React Native
- [ ] Adaptar estilos (styled-components → StyleSheet)
- [ ] Convertir eventos (onClick → onPress, etc.)
- [ ] Adaptar formularios (inputs, selects)
- [ ] Implementar validaciones
- [ ] Agregar manejo de errores con Toast
- [ ] Probar en dispositivo/emulador
- [ ] Verificar responsive design
- [ ] Optimizar rendimiento (memoization si es necesario)
- [ ] Actualizar en AdminDashboard/ListeroDashboard/JugadorDashboard

---

## 💡 Tips y Mejores Prácticas

1. **Performance**: Usa `React.memo()` para componentes que se renderean frecuentemente
2. **Listas**: Usa `FlatList` o `SectionList` para listas grandes (mejor performance que ScrollView)
3. **Imágenes**: Usa `Image` de React Native y considera usar `react-native-fast-image` para mejor performance
4. **Animaciones**: Usa `Animated` API o `react-native-reanimated` para animaciones fluidas
5. **Teclado**: Usa `KeyboardAvoidingView` en formularios para evitar que el teclado cubra inputs
6. **Estados de carga**: Siempre muestra `ActivityIndicator` durante operaciones async
7. **Errores**: Maneja errores con try-catch y muestra mensajes user-friendly con Toast

---

## 🆘 Ayuda y Recursos

- [Documentación React Native](https://reactnative.dev/docs/getting-started)
- [Documentación Expo](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [Repositorio original web](/tmp/tmv_front)

---

**¿Necesitas ayuda para expandir un componente específico?** Pregunta y te guiaré paso a paso.

