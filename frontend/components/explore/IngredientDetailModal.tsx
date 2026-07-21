import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IngredientCard } from './PopularIngredientsSection';

interface IngredientDetailModalProps {
  selectedIngredient: IngredientCard | null;
  onClose: () => void;
}

export const IngredientDetailModal: React.FC<IngredientDetailModalProps> = ({
  selectedIngredient,
  onClose,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={selectedIngredient !== null}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.modalCard}>
          {selectedIngredient && (
            <>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalIngredientTitle}>{selectedIngredient.name}</Text>
                  <Text style={styles.modalIngredientSub}>Thành phần dinh dưỡng & Món gợi ý</Text>
                </View>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <Image source={selectedIngredient.image} style={styles.heroImg} resizeMode="cover" />

                <Text style={styles.sectionTitleModal}>🛒 Thành phần chủ yếu</Text>
                {selectedIngredient.composition.map((comp) => (
                  <Text key={comp} style={styles.bulletItem}>
                    • {comp}
                  </Text>
                ))}

                <Text style={styles.sectionTitleModal}>❤️ Lợi ích sức khỏe</Text>
                {selectedIngredient.benefits.map((ben) => (
                  <Text key={ben} style={styles.bulletItem}>
                    • {ben}
                  </Text>
                ))}

                <Text style={styles.sectionTitleModal}>🍳 Món ngon đề xuất</Text>
                {selectedIngredient.dishes.map((dish) => (
                  <Text key={dish} style={styles.bulletItemHighlight}>
                    🍲 {dish}
                  </Text>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
    padding: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalIngredientTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
  },
  modalIngredientSub: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  heroImg: {
    width: '100%',
    height: 160,
    borderRadius: 14,
    marginBottom: 14,
  },
  sectionTitleModal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginTop: 12,
    marginBottom: 6,
  },
  bulletItem: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
    lineHeight: 20,
  },
  bulletItemHighlight: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '600',
    marginBottom: 4,
  },
});
