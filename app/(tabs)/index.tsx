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
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import type { LongPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import { initDatabase, insertLugar, getLugares, deleteLugar, toggleFavorito, Lugar } from '@/lib/database';
import LocationsButton from '@/components/ui/LocationsButton';
import LocationsDropdown from '@/components/ui/LocationsDropdown';

const DEFAULT_REGION: Region = {
  latitude: 4.711,
  longitude: -74.0721,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function MapScreen() {
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState('');
  const [selectedCoord, setSelectedCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    initDatabase();
    cargarLugares();
    obtenerUbicacion();

    // Limpiar suscripcion al desmontar
    return () => {
      locationSub.current?.remove();
    };
  }, []);

  function cargarLugares() {
    setLugares(getLugares());
  }

  async function obtenerUbicacion() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos denegados',
          'No se pudo acceder a tu ubicación. El mapa usará una ubicación por defecto.'
        );
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      mapRef.current?.animateToRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }, 800);
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
    setModalVisible(true);
  }

  function handleGuardar() {
    if (!nombre.trim()) {
      Alert.alert('Error', 'Ingresa un nombre para el lugar.');
      return;
    }
    if (!selectedCoord) return;

    insertLugar(nombre.trim(), selectedCoord.lat, selectedCoord.lng);
    cargarLugares();
    setModalVisible(false);
    setNombre('');
    setSelectedCoord(null);
  }

  function handleToggleFavorito(lugar: Lugar) {
    toggleFavorito(lugar.id, lugar.favorito === 1 ? 0 : 1);
    cargarLugares();
  }

  function handleSelectLugar(lugar: Lugar) {
    mapRef.current?.animateToRegion({
      latitude: lugar.latitud,
      longitude: lugar.longitud,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 600);
  }

  function handleEliminar(id: number, nombreLugar: string) {
    Alert.alert('Eliminar lugar', `¿Eliminar "${nombreLugar}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          deleteLugar(id);
          cargarLugares();
        },
      },
    ]);
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
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        onLongPress={handleLongPress}
        showsUserLocation
        showsMyLocationButton
      >
        {lugares.map((lugar) => (
          <Marker
            key={lugar.id}
            coordinate={{ latitude: lugar.latitud, longitude: lugar.longitud }}
            title={lugar.nombre}
            description="Toca el globo para eliminar"
            onCalloutPress={() => handleEliminar(lugar.id, lugar.nombre)}
          />
        ))}
      </MapView>

      <View style={styles.topBar}>
        <LocationsButton
          count={lugares.length}
          open={dropdownVisible}
          onPress={() => setDropdownVisible((v) => !v)}
        />
      </View>

      <LocationsDropdown
        visible={dropdownVisible}
        lugares={lugares}
        onSelect={handleSelectLugar}
        onToggleFavorito={handleToggleFavorito}
        onClose={() => setDropdownVisible(false)}
      />

      <View style={styles.hint}>
        <Text style={styles.hintText}>Mantén presionado el mapa para agregar un lugar</Text>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Nuevo lugar favorito</Text>
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
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleGuardar}
              >
                <Text style={styles.saveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#555',
  },
  topBar: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  hint: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  hintText: {
    color: '#fff',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 16,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#1a1a1a',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
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
});
