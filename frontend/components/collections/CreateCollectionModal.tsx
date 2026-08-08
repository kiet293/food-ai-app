import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CreateCollectionModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateCollection: (name: string, category: string) => void;
}

const COLORS = {
  canvas: '#F6F3EA',
  surface: '#FFFFFF',
  mutedSurface: '#F0F4F0',
  primaryText: '#1A3A1A',
  secondaryText: '#6B8F6B',
  accent: '#2ECC71',
  accentSoft: '#DFF3EA',
  border: '#E8E2D8',
};

export const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({
  visible,
  onClose,
  onCreateCollection,
}) => {
  const [collectionName, setCollectionName] = useState('');

  const handleSubmit = () => {
    const finalName = collectionName.trim() || 'Bộ sưu tập mới';
    onCreateCollection(finalName, '');
    setCollectionName('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Đóng cửa sổ tạo bộ sưu tập" />
        <KeyboardAvoidingView
          style={styles.keyboardWrap}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalCard}>
            <View style={styles.sheetHandle} />

            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>Tạo bộ sưu tập mới</Text>
                <Text style={styles.subtitle}>Gom những món bạn muốn nấu lại vào một chỗ.</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Đóng"
                hitSlop={8}
              >
                <Ionicons name="close" size={21} color={COLORS.primaryText} />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.label}>Tên bộ sưu tập</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Món ngon mỗi ngày"
                placeholderTextColor="#9AA99B"
                value={collectionName}
                onChangeText={setCollectionName}
                returnKeyType="done"
                maxLength={40}
                accessibilityLabel="Tên bộ sưu tập"
              />
              <Text style={styles.helperText}>Tên ngắn, dễ nhớ sẽ giúp bạn tìm món nhanh hơn.</Text>

              <TouchableOpacity
                style={styles.createBtn}
                onPress={handleSubmit}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel="Tạo bộ sưu tập"
              >
                <Ionicons name="add" size={20} color={COLORS.surface} />
                <Text style={styles.createBtnText}>Tạo bộ sưu tập</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 33, 20, 0.48)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardWrap: {
    justifyContent: 'flex-end',
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.canvas,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 28,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#B7C5B8',
    marginBottom: 17,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerCopy: {
    flex: 1,
    paddingRight: 14,
  },
  title: {
    color: COLORS.primaryText,
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.secondaryText,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formContainer: {
    width: '100%',
  },
  label: {
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 9,
  },
  input: {
    minHeight: 52,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 13,
    color: COLORS.primaryText,
    fontSize: 15,
  },
  helperText: {
    color: COLORS.secondaryText,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 7,
    marginBottom: 24,
  },
  createBtn: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryText,
    borderRadius: 15,
  },
  createBtnText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 7,
  },
});
