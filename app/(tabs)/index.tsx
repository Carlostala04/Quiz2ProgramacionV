import {
  deleteLugar,
  getLugares,
  initDatabase,
  insertLugar,
  Lugar,
  updateFoto,
} from "@/lib/database";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { LongPressEvent } from "react-native-maps";
import MapView, { Marker, Region } from "react-native-maps";

const DEFAULT_REGION: Region = {
  latitude: 4.711,
  longitude: -74.0721,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const MARKER_COLORS = [
  "red",
  "green",
  "blue",
  "violet",
  "yellow",
  "coral",
  "azure",
  "tomato",
];

export default function MapScreen() {
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detalleModal, setDetalleModal] = useState<Lugar | null>(null);
  const [nombre, setNombre] = useState("");
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [selectedCoord, setSelectedCoord] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    initDatabase();
    cargarLugares();
    obtenerUbicacion();
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
      if (status !== "granted") {
        Alert.alert(
          "Permisos denegados",
          "No se pudo acceder a tu ubicación. El mapa usará una ubicación por defecto.",
        );
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      mapRef.current?.animateToRegion(
        {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        },
        800,
      );
    } catch {
      Alert.alert("Error", "No se pudo obtener la ubicación actual.");
    } finally {
      setLoading(false);
    }
  }

  function handleLongPress(event: LongPressEvent) {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedCoord({ lat: latitude, lng: longitude });
    setNombre("");
    setFotoUri(null);
    setModalVisible(true);
  }

  async function abrirSelectorFoto(onResult: (uri: string) => void) {
    Alert.alert("Agregar foto", "Elige una opción", [
      {
        text: "Cámara",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permiso denegado", "Se necesita acceso a la cámara.");
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
          });
          if (!result.canceled && result.assets[0])
            onResult(result.assets[0].uri);
        },
      },
      {
        text: "Galería",
        onPress: async () => {
          const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permiso denegado", "Se necesita acceso a la galería.");
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
          });
          if (!result.canceled && result.assets[0])
            onResult(result.assets[0].uri);
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  function handleGuardar() {
    if (!nombre.trim()) {
      Alert.alert("Error", "Ingresa un nombre para el lugar.");
      return;
    }
    if (!selectedCoord) return;
    insertLugar(nombre.trim(), selectedCoord.lat, selectedCoord.lng, fotoUri);
    cargarLugares();
    setModalVisible(false);
    setNombre("");
    setFotoUri(null);
    setSelectedCoord(null);
  }

  function handleEliminar(lugar: Lugar) {
    Alert.alert("Eliminar lugar", `¿Eliminar "${lugar.nombre}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          deleteLugar(lugar.id);
          cargarLugares();
          setDetalleModal(null);
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
        {lugares.map((lugar, index) => (
          <Marker
            key={lugar.id}
            coordinate={{ latitude: lugar.latitud, longitude: lugar.longitud }}
            title={lugar.nombre}
            description="Toca para ver detalles"
            onCalloutPress={() => setDetalleModal(lugar)}
            pinColor={MARKER_COLORS[index % MARKER_COLORS.length]}
          >
            {lugar.foto ? (
              <View style={styles.markerContainer}>
                <Image
                  source={{ uri: lugar.foto }}
                  style={styles.markerImage}
                  resizeMode="cover"
                />
              </View>
            ) : undefined}
          </Marker>
        ))}
      </MapView>

      <View style={styles.hint}>
        <Text style={styles.hintText}>
          Mantén presionado el mapa para agregar un lugar
        </Text>
      </View>

      {/* Modal: nuevo lugar */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nuevo lugar favorito</Text>

            {fotoUri ? (
              <View style={styles.fotoAsignadaContainer}>
                <Image
                  source={{ uri: fotoUri }}
                  style={styles.fotoAsignada}
                  resizeMode="cover"
                />
                <View style={styles.fotoAsignadaActions}>
                  <TouchableOpacity
                    style={styles.fotoAccionBtn}
                    onPress={() => abrirSelectorFoto(setFotoUri)}
                  >
                    <Text style={styles.fotoAccionText}>Cambiar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.fotoAccionBtn, styles.fotoAccionBtnRojo]}
                    onPress={() => setFotoUri(null)}
                  >
                    <Text style={[styles.fotoAccionText, { color: "#FF3B30" }]}>
                      Quitar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.fotoSlot}
                onPress={() => abrirSelectorFoto(setFotoUri)}
                activeOpacity={0.8}
              >
                <View style={styles.fotoPlaceholder}>
                  <Text style={styles.fotoIcono}>📷</Text>
                  <Text style={styles.fotoPlaceholderText}>
                    Toca para agregar foto
                  </Text>
                </View>
              </TouchableOpacity>
            )}

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

      {/* Modal: detalle de lugar guardado */}
      <Modal
        visible={!!detalleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setDetalleModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{detalleModal?.nombre}</Text>

            {detalleModal?.foto ? (
              <Image
                source={{ uri: detalleModal.foto }}
                style={styles.fotoDetalle}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.fotoSlot}>
                <View style={styles.fotoPlaceholder}>
                  <Text style={styles.fotoIcono}>📷</Text>
                  <Text style={styles.fotoPlaceholderText}>Sin foto</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.cambiarFotoBtn}
              onPress={() =>
                detalleModal &&
                abrirSelectorFoto((uri) => {
                  updateFoto(detalleModal.id, uri);
                  setDetalleModal({ ...detalleModal, foto: uri });
                  cargarLugares();
                })
              }
            >
              <Text style={styles.cambiarFotoText}>
                {detalleModal?.foto ? "📷 Cambiar foto" : "📷 Agregar foto"}
              </Text>
            </TouchableOpacity>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setDetalleModal(null)}
              >
                <Text style={styles.cancelText}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#FF3B30" }]}
                onPress={() => detalleModal && handleEliminar(detalleModal)}
              >
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 16, color: "#555" },
  hint: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  hintText: { color: "#fff", fontSize: 13 },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    gap: 18,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  markerContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: "#fff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
  },
  markerImage: {
    width: "100%",
    height: "100%",
  },
  fotoAsignadaContainer: {
    width: "100%",
    gap: 8,
  },
  fotoAsignada: {
    width: "100%",
    height: 180,
    borderRadius: 14,
  },
  fotoAsignadaActions: {
    flexDirection: "row",
    gap: 10,
  },
  fotoAccionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  fotoAccionBtnRojo: {
    backgroundColor: "#fff0f0",
  },
  fotoAccionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  fotoSlot: {
    width: "100%",
    height: 160,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    overflow: "hidden",
  },
  fotoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#f7f7f7",
  },
  fotoIcono: { fontSize: 32 },
  fotoPlaceholderText: { color: "#aaa", fontSize: 14 },
  fotoDetalle: {
    width: "100%",
    height: 200,
    borderRadius: 14,
  },
  cambiarFotoBtn: {
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#f0f8ff",
  },
  cambiarFotoText: { color: "#007AFF", fontSize: 15, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    color: "#1a1a1a",
  },
  buttonRow: { flexDirection: "row", gap: 16, marginTop: 4 },
  button: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: { backgroundColor: "#f0f0f0" },
  saveButton: { backgroundColor: "#007AFF" },
  cancelText: { color: "#555", fontSize: 16, fontWeight: "500" },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
