import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
<<<<<<< Updated upstream
=======
  ScrollView,
>>>>>>> Stashed changes
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import type { LongPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { initDatabase, insertLugar, getLugares, deleteLugar, updateFoto, Lugar } from '@/lib/database';

const DEFAULT_REGION: Region = {
  latitude: 4.711,
  longitude: -74.0721,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function MapScreen() {
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
<<<<<<< Updated upstream
  const [detalleModal, setDetalleModal] = useState<Lugar | null>(null);
=======
  const [fotoModal, setFotoModal] = useState<Lugar | null>(null);
>>>>>>> Stashed changes
  const [nombre, setNombre] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [selectedCoord, setSelectedCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const locationSub = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    initDatabase();
    cargarLugares();
    obtenerUbicacion();
<<<<<<< Updated upstream
    return () => { locationSub.current?.remove(); };
=======

    return () => {
      locationSub.current?.remove();
    };
>>>>>>> Stashed changes
  }, []);

  function cargarLugares() {
    setLugares(getLugares());
  }

  async function obtenerUbicacion() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos denegados', 'No se pudo acceder a tu ubicación. El mapa usará una ubicación por defecto.');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setRegion({ latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.0922, longitudeDelta: 0.0421 });
    } catch {
      Alert.alert('Error', 'No se pudo obtener la ubicación actual.');
    } finally {
      setLoading(false);
    }
  }

  function handleLongPress(event: LongPressEvent) {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedCoord({ lat: latitude, lng: longitude });
    setNombre('');
    setFotoUri(null);
    setModalVisible(true);
  }

<<<<<<< Updated upstream
  async function abrirSelectorFoto(onResult: (uri: string) => void) {
    Alert.alert('Agregar foto', 'Elige una opción', [
      {
        text: 'Cámara',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara.'); return; }
          const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7 });
          if (!result.canceled && result.assets[0]) onResult(result.assets[0].uri);
        },
      },
      {
        text: 'Galería',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permiso denegado', 'Se necesita acceso a la galería.'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7 });
          if (!result.canceled && result.assets[0]) onResult(result.assets[0].uri);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  function handleGuardar() {
    if (!nombre.trim()) { Alert.alert('Error', 'Ingresa un nombre para el lugar.'); return; }
    if (!selectedCoord) return;
=======
  async function handleSeleccionarFoto(fuente: 'camara' | 'galeria') {
    let result: ImagePicker.ImagePickerResult;

    if (fuente === 'camara') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la galería.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
    }

    if (!result.canceled && result.assets[0]) {
      setFotoUri(result.assets[0].uri);
    }
  }

  function mostrarOpcionesFoto() {
    Alert.alert('Agregar foto', 'Elige una opción', [
      { text: 'Cámara', onPress: () => handleSeleccionarFoto('camara') },
      { text: 'Galería', onPress: () => handleSeleccionarFoto('galeria') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  function handleGuardar() {
    if (!nombre.trim()) {
      Alert.alert('Error', 'Ingresa un nombre para el lugar.');
      return;
    }
    if (!selectedCoord) return;

>>>>>>> Stashed changes
    insertLugar(nombre.trim(), selectedCoord.lat, selectedCoord.lng, fotoUri);
    cargarLugares();
    setModalVisible(false);
    setNombre('');
    setFotoUri(null);
    setSelectedCoord(null);
  }

  function handleEliminar(lugar: Lugar) {
    Alert.alert('Eliminar lugar', `¿Eliminar "${lugar.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
<<<<<<< Updated upstream
        text: 'Eliminar', style: 'destructive',
        onPress: () => { deleteLugar(lugar.id); cargarLugares(); setDetalleModal(null); },
=======
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          deleteLugar(lugar.id);
          cargarLugares();
        },
>>>>>>> Stashed changes
      },
    ]);
  }

  async function handleCambiarFoto(lugar: Lugar) {
    Alert.alert('Foto del lugar', 'Elige una opción', [
      {
        text: 'Cámara',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara.'); return; }
          const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7 });
          if (!result.canceled && result.assets[0]) {
            updateFoto(lugar.id, result.assets[0].uri);
            const updated = { ...lugar, foto: result.assets[0].uri };
            setFotoModal(updated);
            cargarLugares();
          }
        },
      },
      {
        text: 'Galería',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permiso denegado', 'Se necesita acceso a la galería.'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7 });
          if (!result.canceled && result.assets[0]) {
            updateFoto(lugar.id, result.assets[0].uri);
            const updated = { ...lugar, foto: result.assets[0].uri };
            setFotoModal(updated);
            cargarLugares();
          }
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  function handleCalloutPress(lugar: Lugar) {
    setFotoModal(lugar);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onLongPress={handleLongPress}
        showsUserLocation
        showsMyLocationButton
      >
        {lugares.map((lugar) => (
          <Marker
            key={lugar.id}
            coordinate={{ latitude: lugar.latitud, longitude: lugar.longitud }}
            title={lugar.nombre}
<<<<<<< Updated upstream
            description="Toca para ver detalles"
            onCalloutPress={() => setDetalleModal(lugar)}
          >
            {lugar.foto ? (
              <View style={styles.markerContainer}>
                <Image source={{ uri: lugar.foto }} style={styles.markerImage} resizeMode="cover" />
              </View>
            ) : undefined}
          </Marker>
=======
            description={lugar.foto ? '📷 Toca para ver la foto' : 'Toca para eliminar'}
            onCalloutPress={() => handleCalloutPress(lugar)}
          />
>>>>>>> Stashed changes
        ))}
      </MapView>

      <View style={styles.hint}>
        <Text style={styles.hintText}>Mantén presionado el mapa para agregar un lugar</Text>
      </View>

<<<<<<< Updated upstream
      {/* Modal: nuevo lugar */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
=======
      {/* Modal: crear nuevo lugar */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
>>>>>>> Stashed changes
            <Text style={styles.modalTitle}>Nuevo lugar favorito</Text>

            {/* Foto arriba — visible directamente si ya fue asignada */}
            {fotoUri ? (
              <View style={styles.fotoAsignadaContainer}>
                <Image source={{ uri: fotoUri }} style={styles.fotoAsignada} resizeMode="cover" />
                <View style={styles.fotoAsignadaActions}>
                  <TouchableOpacity style={styles.fotoAccionBtn} onPress={() => abrirSelectorFoto((uri) => setFotoUri(uri))}>
                    <Text style={styles.fotoAccionText}>Cambiar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.fotoAccionBtn, styles.fotoAccionBtnRojo]} onPress={() => setFotoUri(null)}>
                    <Text style={[styles.fotoAccionText, { color: '#FF3B30' }]}>Quitar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.fotoSlot} onPress={() => abrirSelectorFoto((uri) => setFotoUri(uri))} activeOpacity={0.8}>
                <View style={styles.fotoPlaceholder}>
                  <Text style={styles.fotoIcono}>📷</Text>
                  <Text style={styles.fotoPlaceholderText}>Toca para agregar foto</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Nombre */}
            <TextInput
              style={styles.input}
              placeholder="Nombre del lugar"
              placeholderTextColor="#aaa"
              value={nombre}
              onChangeText={setNombre}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleGuardar}
            />

<<<<<<< Updated upstream
            {/* Botones */}
=======
            {/* Sección de foto */}
            <TouchableOpacity style={styles.photoButton} onPress={mostrarOpcionesFoto}>
              <Text style={styles.photoButtonText}>
                {fotoUri ? '📷 Cambiar foto' : '📷 Agregar foto (opcional)'}
              </Text>
            </TouchableOpacity>

            {fotoUri && (
              <View style={styles.previewContainer}>
                <Image source={{ uri: fotoUri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removePhoto} onPress={() => setFotoUri(null)}>
                  <Text style={styles.removePhotoText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

>>>>>>> Stashed changes
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleGuardar}>
                <Text style={styles.saveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

<<<<<<< Updated upstream
      {/* Modal: detalle de lugar guardado */}
      <Modal visible={!!detalleModal} transparent animationType="fade" onRequestClose={() => setDetalleModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{detalleModal?.nombre}</Text>

            {/* Foto o placeholder */}
            {detalleModal?.foto
              ? <Image source={{ uri: detalleModal.foto }} style={styles.fotoDetalle} resizeMode="cover" />
              : <View style={[styles.fotoSlot, { marginBottom: 0 }]}>
                  <View style={styles.fotoPlaceholder}>
                    <Text style={styles.fotoIcono}>📷</Text>
                    <Text style={styles.fotoPlaceholderText}>Sin foto</Text>
                  </View>
                </View>
            }

            {/* Botón cambiar foto */}
            <TouchableOpacity
              style={styles.cambiarFotoBtn}
              onPress={() => detalleModal && abrirSelectorFoto((uri) => {
                updateFoto(detalleModal.id, uri);
                setDetalleModal({ ...detalleModal, foto: uri });
                cargarLugares();
              })}
            >
              <Text style={styles.cambiarFotoText}>
                {detalleModal?.foto ? '📷 Cambiar foto' : '📷 Agregar foto'}
              </Text>
            </TouchableOpacity>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setDetalleModal(null)}>
                <Text style={styles.cancelText}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, { backgroundColor: '#FF3B30' }]} onPress={() => detalleModal && handleEliminar(detalleModal)}>
=======
      {/* Modal: ver/editar foto de lugar guardado */}
      <Modal
        visible={!!fotoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setFotoModal(null)}
      >
        <View style={styles.fotoOverlay}>
          <View style={styles.fotoContainer}>
            <Text style={styles.fotoTitle}>{fotoModal?.nombre}</Text>
            {fotoModal?.foto
              ? <Image source={{ uri: fotoModal.foto }} style={styles.fotoFullImage} resizeMode="cover" />
              : <View style={styles.fotoPlaceholder}><Text style={styles.fotoPlaceholderText}>Sin foto</Text></View>
            }
            <TouchableOpacity style={styles.photoButton} onPress={() => fotoModal && handleCambiarFoto(fotoModal)}>
              <Text style={styles.photoButtonText}>
                {fotoModal?.foto ? '📷 Cambiar foto' : '📷 Agregar foto'}
              </Text>
            </TouchableOpacity>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setFotoModal(null)}
              >
                <Text style={styles.cancelText}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#FF3B30' }]}
                onPress={() => {
                  const lugar = fotoModal!;
                  setFotoModal(null);
                  handleEliminar(lugar);
                }}
              >
>>>>>>> Stashed changes
                <Text style={styles.saveText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 16, color: '#555' },
  hint: {
    position: 'absolute', bottom: 24, alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  hintText: { color: '#fff', fontSize: 13 },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
<<<<<<< Updated upstream
    backgroundColor: 'rgba(0,0,0,0.5)',
=======
    backgroundColor: 'rgba(0,0,0,0.4)',
>>>>>>> Stashed changes
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
<<<<<<< Updated upstream
    padding: 28,
    gap: 18,
=======
    padding: 32,
    gap: 24,
>>>>>>> Stashed changes
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },

  // Foto ya asignada (visible directamente)
  fotoAsignadaContainer: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    gap: 8,
  },
  fotoAsignada: {
    width: '100%',
    height: 180,
    borderRadius: 14,
  },
  fotoAsignadaActions: {
    flexDirection: 'row',
    gap: 10,
  },
  fotoAccionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  fotoAccionBtnRojo: {
    backgroundColor: '#fff0f0',
  },
  fotoAccionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },

  // Slot de foto (nuevo lugar)
  fotoSlot: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  fotoSlotFilled: {
    borderStyle: 'solid',
    borderColor: 'transparent',
  },
  fotoPreview: {
    width: '100%',
    height: '100%',
  },
  fotoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f7f7f7',
  },
  fotoIcono: { fontSize: 32 },
  fotoPlaceholderText: { color: '#aaa', fontSize: 14 },
  fotoQuitarBtn: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 14, width: 28, height: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  fotoQuitarText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Foto en detalle de lugar guardado
  fotoDetalle: {
    width: '100%',
    height: 200,
    borderRadius: 14,
  },

  // Marcador con imagen en el mapa
  markerContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
  },
  markerImage: {
    width: '100%',
    height: '100%',
  },

  coordBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  coordText: { color: '#666', fontSize: 13, textAlign: 'center' },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#1a1a1a',
  },
<<<<<<< Updated upstream

  cambiarFotoBtn: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
=======
  photoButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
  },
  photoButtonText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '500',
  },
  previewContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
  },
  removePhoto: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 12,
>>>>>>> Stashed changes
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
  },
<<<<<<< Updated upstream
  cambiarFotoText: { color: '#007AFF', fontSize: 15, fontWeight: '500' },

  buttonRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  button: { flex: 1, paddingVertical: 18, borderRadius: 12, alignItems: 'center' },
  cancelButton: { backgroundColor: '#f0f0f0' },
  saveButton: { backgroundColor: '#007AFF' },
  cancelText: { color: '#555', fontSize: 16, fontWeight: '500' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
=======
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '500',
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fotoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fotoContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    gap: 16,
  },
  fotoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  fotoFullImage: {
    width: '100%',
    height: 280,
    borderRadius: 12,
  },
  fotoPlaceholder: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fotoPlaceholderText: {
    color: '#aaa',
    fontSize: 15,
  },
>>>>>>> Stashed changes
});
