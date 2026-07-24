import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CreateCollectionModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateCollection: (name: string, category: string) => void;
}

const SAMPLE_CATEGORIES = [
  '🍳 Bữa Sáng',
  '🍱 Meal Prep',
  '🥗 Món Chay Healthy',
  '🍰 Bánh & Desserts',
  '🥩 Món Cuối Tuần',
];

export const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({
  visible,
  onClose,
  onCreateCollection,
}) => {
  const [collectionName, setCollectionName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(SAMPLE_CATEGORIES[0]);

  const handleSubmit = () => {
    const finalName = collectionName.trim() || selectedCategory;
    onCreateCollection(finalName, selectedCategory);
    setCollectionName('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <Text style={styles.title}>Tạo Bộ Sưu Tập Mới</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Tên Bộ Sưu Tập</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: Món Ngon Mỗi Ngày..."
            value={collectionName}
            onChangeText={setCollectionName}
          />

          <Text style={styles.label}>Gợi Ý Chủ Đề</Text>
          <View style={styles.categoryWrap}>
            {SAMPLE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, isSelected && styles.catChipActive]}
                  onPress={() => {
                    setSelectedCategory(cat);
                    if (!collectionName) setCollectionName(cat.split(' ')[1] || cat);
                  }}
                >
                  <Text style={[styles.catText, isSelected && styles.catTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.createBtn} onPress={handleSubmit}>
            <Text style={styles.createBtnText}>Tạo Bộ Sưu Tập</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#444',
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f2f5',
  },
  catChipActive: {
    backgroundColor: '#28a745',
  },
  catText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  catTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  createBtn: {
    backgroundColor: '#28a745',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  createBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
