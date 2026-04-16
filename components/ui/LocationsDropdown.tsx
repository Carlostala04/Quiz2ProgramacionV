import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import { Lugar } from '@/lib/database';

interface Props {
  visible: boolean;
  lugares: Lugar[];
  onSelect: (lugar: Lugar) => void;
  onToggleFavorito: (lugar: Lugar) => void;
  onClose: () => void;
}

export default function LocationsDropdown({ visible, lugares, onSelect, onToggleFavorito, onClose }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      Animated.parallel([
        Animated.spring(opacity, { toValue: 1, useNativeDriver: true, tension: 100, friction: 12 }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 100, friction: 12 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -8, duration: 150, useNativeDriver: true }),
      ]).start(() => setIsMounted(false));
    }
  }, [visible]);

  if (!isMounted) return null;

  return (
    <>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />

      <Animated.View style={[styles.dropdown, { opacity, transform: [{ translateY }] }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerDot} />
            <Text style={styles.headerTitle}>Lugares guardados</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Content */}
        {lugares.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyTitle}>Sin lugares aún</Text>
            <Text style={styles.emptySubtitle}>Mantén presionado el mapa para agregar uno</Text>
          </View>
        ) : (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            style={styles.list}
          >
            {lugares.map((lugar, index) => (
              <TouchableOpacity
                key={lugar.id}
                style={[styles.item, index < lugares.length - 1 && styles.itemBorder]}
                onPress={() => { onSelect(lugar); onClose(); }}
                activeOpacity={0.6}
              >
                <View style={styles.pinWrapper}>
                  <Text style={styles.pinIcon}>📍</Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{lugar.nombre}</Text>
                  <Text style={styles.itemCoords}>
                    {lugar.latitud.toFixed(5)},  {lugar.longitud.toFixed(5)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.starBtn, lugar.favorito === 1 && styles.starBtnActive]}
                  onPress={(e) => { e.stopPropagation?.(); onToggleFavorito(lugar); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.starIcon}>{lugar.favorito === 1 ? '★' : '☆'}</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9,
  },
  dropdown: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 11,
    color: '#555',
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 0,
  },
  list: {
    maxHeight: 260,
  },
  listContent: {
    paddingVertical: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
    backgroundColor: '#fff',
  },
  itemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  pinWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinIcon: {
    fontSize: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  itemCoords: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },
  starBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  starBtnActive: {
    backgroundColor: '#FEF9C3',
  },
  starIcon: {
    fontSize: 20,
    color: '#FACC15',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    gap: 6,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
});
