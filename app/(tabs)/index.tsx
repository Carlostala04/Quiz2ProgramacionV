import {
  deleteLugar,
  getLugares,
  initDatabase,
  insertLugar,
  Lugar,
  toggleFavorito,
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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { LongPressEvent } from "react-native-maps";
import MapView, { Marker, Region } from "react-native-maps";

/**
 * Región inicial por defecto (Bogotá, Colombia) si no se obtiene la ubicación.
 */
const DEFAULT_REGION: Region = {
  latitude: 4.711,
  longitude: -74.0721,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

/**
 * Colores asignados a cada marcador según su índice para diferenciarlos visualmente.
 */
const MARKER_COLORS = [
  "#FF3B30",
  "#34C759",
  "#007AFF",
  "#AF52DE",
  "#FF9500",
  "#FF2D55",
  "#5AC8FA",
  "#FFCC00",
];

type FiltroTab = "todos" | "favoritos";

/**
 * Pantalla principal que muestra el mapa y gestiona los lugares favoritos.
 */
export default function MapScreen() {
  // --- ESTADO ---
  const [lugares, setLugares] = useState<Lugar[]>([]); // Lista de lugares desde la DB
  const [modalVisible, setModalVisible] = useState(false); // Modal para agregar nuevo lugar
  const [detalleModal, setDetalleModal] = useState<Lugar | null>(null); // Modal de detalles de un lugar
  const [nombre, setNombre] = useState(""); // Nombre del nuevo lugar
  const [fotoUri, setFotoUri] = useState<string | null>(null); // URI de la foto para el nuevo lugar
  const [selectedCoord, setSelectedCoord] = useState<{ lat: number; lng: number } | null>(null); // Coordenadas seleccionadas en el mapa
  const [loading, setLoading] = useState(true); // Estado de carga inicial (ubicación)
  const [dropdownVisible, setDropdownVisible] = useState(false); // Visibilidad del panel "Mis lugares"
  const [filtroTab, setFiltroTab] = useState<FiltroTab>("todos"); // Filtro actual del dropdown
  
  // Referencias para suscripciones y el componente MapView
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const mapRef = useRef<MapView>(null);

  /**
   * Inicialización: Base de datos, carga de datos y obtención de ubicación.
   */
  useEffect(() => {
    initDatabase();
    cargarLugares();
    obtenerUbicacion();
    // Limpieza de la suscripción de ubicación al desmontar el componente
    return () => {
      locationSub.current?.remove();
    };
  }, []);

  /**
   * Obtiene los lugares de la base de datos y actualiza el estado local.
   */
  function cargarLugares() {
    setLugares(getLugares());
  }

  /**
   * Solicita permisos y comienza a vigilar la ubicación del usuario.
   */
  async function obtenerUbicacion() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permisos denegados",
          "No se pudo acceder a tu ubicación. El mapa usará una ubicación por defecto."
        );
        setLoading(false);
        return;
      }

      // Suscripción a cambios de ubicación en tiempo real
      locationSub.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
        (loc) => {
          setLoading(false);
          // Anima el mapa hacia la ubicación actual del usuario
          mapRef.current?.animateToRegion(
            {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            },
            800
          );
        }
      );
    } catch {
      Alert.alert("Error", "No se pudo obtener la ubicación actual.");
      setLoading(false);
    }
  }

  /**
   * Maneja la pulsación larga en el mapa para iniciar la creación de un nuevo lugar.
   */
  function handleLongPress(event: LongPressEvent) {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedCoord({ lat: latitude, lng: longitude });
    setNombre("");
    setFotoUri(null);
    setModalVisible(true);
  }

  /**
   * Abre un diálogo para elegir entre tomar una foto con la cámara o elegir de la galería.
   */
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
          if (!result.canceled && result.assets[0]) onResult(result.assets[0].uri);
        },
      },
      {
        text: "Galería",
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
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
          if (!result.canceled && result.assets[0]) onResult(result.assets[0].uri);
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  /**
   * Guarda el nuevo lugar en la base de datos y refresca la lista.
   */
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

  /**
   * Cambia el estado de favorito de un lugar y actualiza la UI.
   */
  function handleToggleFavorito(lugar: Lugar) {
    const nuevoValor = lugar.favorito === 1 ? 0 : 1;
    toggleFavorito(lugar.id, nuevoValor);
    const actualizado = { ...lugar, favorito: nuevoValor };
    setDetalleModal(actualizado);
    cargarLugares();
  }

  /**
   * Elimina un lugar tras confirmar con el usuario.
   */
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

  // --- LÓGICA DE FILTRADO Y CONTEO ---
  const lugaresFiltrados =
    filtroTab === "favoritos" ? lugares.filter((l) => l.favorito === 1) : lugares;

  const totalFavoritos = lugares.filter((l) => l.favorito === 1).length;

  // Renderizado de pantalla de carga
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
      {/* Componente de Mapa */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        onLongPress={handleLongPress}
        showsUserLocation
        showsMyLocationButton
      >
        {/* Renderizado de marcadores guardados */}
        {lugares.map((lugar, index) => {
          const color = MARKER_COLORS[index % MARKER_COLORS.length];
          return (
            <Marker
              key={lugar.id}
              coordinate={{ latitude: lugar.latitud, longitude: lugar.longitud }}
              title={lugar.nombre}
              description={lugar.favorito === 1 ? "⭐ Favorito · Toca para ver detalles" : "Toca para ver detalles"}
              onCalloutPress={() => setDetalleModal(lugar)}
              anchor={{ x: 0.5, y: 1 }}
            >
              {/* Diseño personalizado del marcador */}
              <View style={styles.markerWrapper}>
                {lugar.foto ? (
                  <View style={[styles.markerContainer, { borderColor: color }]}>
                    <Image
                      source={{ uri: lugar.foto }}
                      style={styles.markerImage}
                      resizeMode="cover"
                    />
                    {lugar.favorito === 1 && (
                      <View style={styles.markerFavBadge}>
                        <Text style={styles.markerFavIcon}>⭐</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={[styles.markerPin, { backgroundColor: color }]}>
                    <Text style={styles.markerPinIcon}>
                      {lugar.favorito === 1 ? "⭐" : "📍"}
                    </Text>
                  </View>
                )}
                <View style={[styles.markerPointer, { borderTopColor: color }]} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Indicación flotante inferior */}
      <View style={styles.hint}>
        <Text style={styles.hintText}>
          Mantén presionado el mapa para agregar un lugar
        </Text>
      </View>

      {/* Panel superior desplegable: Lista de lugares */}
      <View style={styles.dropdownWrapper}>
        <TouchableOpacity
          style={styles.dropdownToggle}
          onPress={() => setDropdownVisible((v) => !v)}
          activeOpacity={0.85}
        >
          <Text style={styles.dropdownToggleIcon}>🗺️</Text>
          <Text style={styles.dropdownToggleLabel}>Mis lugares</Text>
          <View style={styles.pillRow}>
            <View style={styles.dropdownBadge}>
              <Text style={styles.dropdownBadgeText}>{lugares.length}</Text>
            </View>
            {totalFavoritos > 0 && (
              <View style={[styles.dropdownBadge, styles.favBadge]}>
                <Text style={styles.dropdownBadgeText}>⭐ {totalFavoritos}</Text>
              </View>
            )}
          </View>
          <Text style={styles.dropdownArrow}>{dropdownVisible ? "▲" : "▼"}</Text>
        </TouchableOpacity>

        {/* Lista desplegable con filtros */}
        {dropdownVisible && (
          <View style={styles.dropdownList}>
            {/* Tabs de navegación dentro del dropdown */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tabBtn, filtroTab === "todos" && styles.tabBtnActive]}
                onPress={() => setFiltroTab("todos")}
              >
                <Text style={[styles.tabBtnText, filtroTab === "todos" && styles.tabBtnTextActive]}>
                  Todos ({lugares.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, filtroTab === "favoritos" && styles.tabBtnActive]}
                onPress={() => setFiltroTab("favoritos")}
              >
                <Text style={[styles.tabBtnText, filtroTab === "favoritos" && styles.tabBtnTextActive]}>
                  ⭐ Favoritos ({totalFavoritos})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Lista de lugares filtrados */}
            <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
              {lugaresFiltrados.length === 0 ? (
                <View style={styles.dropdownEmptyContainer}>
                  <Text style={styles.dropdownEmptyIcon}>
                    {filtroTab === "favoritos" ? "⭐" : "🏔️"}
                  </Text>
                  <Text style={styles.dropdownEmpty}>
                    {filtroTab === "favoritos"
                      ? "Aún no tienes favoritos\nToca ⭐ en un lugar para marcarlo"
                      : "Mantén presionado el mapa\npara agregar tu primer lugar"}
                  </Text>
                </View>
              ) : (
                lugaresFiltrados.map((lugar, index) => {
                  const color = MARKER_COLORS[index % MARKER_COLORS.length];
                  return (
                    <TouchableOpacity
                      key={lugar.id}
                      style={styles.dropdownItem}
                      activeOpacity={0.7}
                      onPress={() => {
                        setDropdownVisible(false);
                        // Navega a la ubicación del lugar seleccionado
                        mapRef.current?.animateToRegion(
                          {
                            latitude: lugar.latitud,
                            longitude: lugar.longitud,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                          },
                          600
                        );
                      }}
                    >
                      <View style={[styles.dropdownColorDot, { backgroundColor: color }]} />
                      {lugar.foto ? (
                        <Image
                          source={{ uri: lugar.foto }}
                          style={[styles.dropdownThumb, { borderColor: color }]}
                        />
                      ) : (
                        <View style={[styles.dropdownThumbPlaceholder, { borderColor: color }]}>
                          <Text style={styles.dropdownThumbIcon}>
                            {lugar.favorito === 1 ? "⭐" : "📍"}
                          </Text>
                        </View>
                      )}
                      <View style={styles.dropdownItemInfo}>
                        <View style={styles.dropdownItemNameRow}>
                          <Text style={styles.dropdownItemText} numberOfLines={1}>
                            {lugar.nombre}
                          </Text>
                          {lugar.favorito === 1 && (
                            <Text style={styles.dropdownItemFavStar}>⭐</Text>
                          )}
                        </View>
                        <Text style={styles.dropdownItemCoords}>
                          {lugar.latitud.toFixed(4)}, {lugar.longitud.toFixed(4)}
                        </Text>
                      </View>
                      <Text style={styles.dropdownItemArrow}>›</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* MODAL: Formulario para agregar nuevo lugar */}
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
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Nuevo lugar favorito</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Sección de Foto */}
            {fotoUri ? (
              <View style={styles.fotoAsignadaContainer}>
                <Image source={{ uri: fotoUri }} style={styles.fotoAsignada} resizeMode="cover" />
                <View style={styles.fotoAsignadaActions}>
                  <TouchableOpacity
                    style={styles.fotoAccionBtn}
                    onPress={() => abrirSelectorFoto(setFotoUri)}
                  >
                    <Text style={styles.fotoAccionText}>Cambiar foto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.fotoAccionBtn, styles.fotoAccionBtnRojo]}
                    onPress={() => setFotoUri(null)}
                  >
                    <Text style={[styles.fotoAccionText, { color: "#FF3B30" }]}>Quitar</Text>
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
                  <Text style={styles.fotoPlaceholderText}>Toca para agregar foto</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Input de Nombre */}
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

            {/* Botones de acción */}
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

      {/* MODAL: Detalle de un lugar guardado */}
      <Modal
        visible={!!detalleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setDetalleModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Cabecera con nombre y botón favorito */}
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {detalleModal?.nombre}
              </Text>
              <TouchableOpacity
                style={[
                  styles.favBtn,
                  detalleModal?.favorito === 1 && styles.favBtnActive,
                ]}
                onPress={() => detalleModal && handleToggleFavorito(detalleModal)}
                activeOpacity={0.8}
              >
                <Text style={styles.favBtnIcon}>
                  {detalleModal?.favorito === 1 ? "⭐" : "☆"}
                </Text>
                <Text style={[
                  styles.favBtnLabel,
                  detalleModal?.favorito === 1 && styles.favBtnLabelActive,
                ]}>
                  {detalleModal?.favorito === 1 ? "Favorito" : "Marcar"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Coordenadas */}
            <View style={styles.coordsRow}>
              <Text style={styles.coordsText}>
                📌 {detalleModal?.latitud.toFixed(5)}, {detalleModal?.longitud.toFixed(5)}
              </Text>
            </View>

            {/* Imagen del detalle */}
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

            {/* Botón para cambiar o agregar foto al detalle */}
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
                {detalleModal?.foto ? "📷  Cambiar foto" : "📷  Agregar foto"}
              </Text>
            </TouchableOpacity>

            {/* Botones de control del detalle */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setDetalleModal(null)}
              >
                <Text style={styles.cancelText}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={() => detalleModal && handleEliminar(detalleModal)}
              >
                <Text style={styles.saveText}>🗑  Eliminar</Text>
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

  // Marcadores
  markerWrapper: { alignItems: "center" },
  markerContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 3,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerImage: { width: "100%", height: "100%" },
  markerFavBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 8,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  markerFavIcon: { fontSize: 11 },
  markerPin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerPinIcon: { fontSize: 22 },
  markerPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -1,
  },

  // Hint inferior
  hint: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.58)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  hintText: { color: "#fff", fontSize: 13 },

  // Dropdown
  dropdownWrapper: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 64,
    zIndex: 10,
  },
  dropdownToggle: {
    backgroundColor: "#fff",
    borderRadius: 50,
    paddingHorizontal: 18,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
  },
  dropdownToggleIcon: { fontSize: 18 },
  dropdownToggleLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  pillRow: { flexDirection: "row", gap: 4 },
  dropdownBadge: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  favBadge: { backgroundColor: "#FF9500" },
  dropdownBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  dropdownArrow: { fontSize: 11, color: "#888", marginLeft: 2 },
  dropdownList: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginTop: 8,
    paddingBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    overflow: "hidden",
  },

  // Tabs dentro del dropdown
  tabRow: {
    flexDirection: "row",
    margin: 12,
    marginBottom: 4,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  tabBtnActive: { backgroundColor: "#fff" },
  tabBtnText: { fontSize: 12, fontWeight: "600", color: "#888" },
  tabBtnTextActive: { color: "#1a1a1a" },

  dropdownEmptyContainer: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  dropdownEmptyIcon: { fontSize: 32 },
  dropdownEmpty: {
    textAlign: "center",
    color: "#aaa",
    fontSize: 13,
    lineHeight: 20,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f0f0f0",
  },
  dropdownColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dropdownThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 2,
  },
  dropdownThumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownThumbIcon: { fontSize: 20 },
  dropdownItemInfo: { flex: 1, gap: 2 },
  dropdownItemNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dropdownItemText: { fontSize: 14, fontWeight: "600", color: "#1a1a1a", flex: 1 },
  dropdownItemFavStar: { fontSize: 13 },
  dropdownItemCoords: { fontSize: 11, color: "#aaa" },
  dropdownItemArrow: { fontSize: 20, color: "#ccc", marginRight: 2 },

  // Modales
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    gap: 16,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseIcon: { fontSize: 13, color: "#555", fontWeight: "600" },

  // Botón favorito (en detalle)
  favBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
  },
  favBtnActive: {
    borderColor: "#FF9500",
    backgroundColor: "#FFF8EC",
  },
  favBtnIcon: { fontSize: 16 },
  favBtnLabel: { fontSize: 12, fontWeight: "600", color: "#888" },
  favBtnLabelActive: { color: "#FF9500" },

  // Coordenadas en detalle
  coordsRow: {
    backgroundColor: "#f7f7f7",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  coordsText: { fontSize: 12, color: "#666", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },

  // Fotos
  fotoAsignadaContainer: { width: "100%", gap: 8 },
  fotoAsignada: { width: "100%", height: 180, borderRadius: 14 },
  fotoAsignadaActions: { flexDirection: "row", gap: 10 },
  fotoAccionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  fotoAccionBtnRojo: { backgroundColor: "#fff0f0" },
  fotoAccionText: { fontSize: 14, fontWeight: "500", color: "#333" },
  fotoSlot: {
    width: "100%",
    height: 150,
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
  fotoDetalle: { width: "100%", height: 190, borderRadius: 14 },
  cambiarFotoBtn: {
    borderWidth: 1.5,
    borderColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    backgroundColor: "#f0f8ff",
  },
  cambiarFotoText: { color: "#007AFF", fontSize: 14, fontWeight: "600" },

  // Inputs y botones
  input: {
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    color: "#1a1a1a",
  },
  buttonRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: { backgroundColor: "#f0f0f0" },
  saveButton: { backgroundColor: "#007AFF" },
  deleteButton: { backgroundColor: "#FF3B30" },
  cancelText: { color: "#555", fontSize: 15, fontWeight: "600" },
  saveText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
