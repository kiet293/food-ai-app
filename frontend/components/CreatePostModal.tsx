import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_HOT_TAGS } from '../services/mockCommunityData';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated: (newPost: {
    title: string;
    description: string;
    images: string[];
    tags: string[];
  }) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  onClose,
  onPostCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImages([...images, result.assets[0].uri]);
      }
    } catch (err) {
      console.error('Image picker error:', err);
      // Fallback sample image for demo web testing
      setImages([
        ...images,
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      ]);
    }
  };

  const removeImage = (index: number) => {
    const updated = [...images];
    updated.splice(index, 1);
    setImages(updated);
  };

  const toggleTag = (tag: string) => {
    if (tag === 'Tất Cả') return;
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tên món ăn/tiêu đề bài viết!');
      return;
    }

    if (images.length === 0) {
      // Add default mock image if user didn't select any
      images.push('https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80');
    }

    onPostCreated({
      title: title.trim(),
      description: description.trim(),
      images,
      tags: selectedTags,
    });

    // Reset state & close
    setTitle('');
    setDescription('');
    setImages([]);
    setSelectedTags([]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={26} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chia Sẻ Bài Viết Mới</Text>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>Đăng</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Image Upload Area */}
          <Text style={styles.sectionLabel}>Hình Ảnh Món Ăn</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
            <TouchableOpacity style={styles.addImageCard} onPress={pickImage}>
              <Ionicons name="camera-outline" size={32} color="#28a745" />
              <Text style={styles.addImageText}>Thêm ảnh</Text>
            </TouchableOpacity>

            {images.map((uri, idx) => (
              <View key={idx} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.uploadedImage} />
                <TouchableOpacity style={styles.removeImgBtn} onPress={() => removeImage(idx)}>
                  <Ionicons name="close-circle" size={20} color="#ff4d4f" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* Title input */}
          <Text style={styles.sectionLabel}>Tên Món Ăn / Tiêu Đề *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: Gà Sốt Tỏi Tương Giòn Rụm..."
            value={title}
            onChangeText={setTitle}
            maxLength={80}
          />

          {/* Description input */}
          <Text style={styles.sectionLabel}>Cảm Nhận / Cách Làm</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Chia sẻ bí quyết nấu nướng, cảm nhận hoặc công thức của bạn..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />

          {/* Hot Tags Selection */}
          <Text style={styles.sectionLabel}>Chọn Thẻ Xu Hướng (Hot Tags)</Text>
          <View style={styles.tagsContainer}>
            {MOCK_HOT_TAGS.filter((t) => t !== 'Tất Cả').map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagChip, isSelected && styles.tagChipActive]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[styles.tagChipText, isSelected && styles.tagChipTextActive]}>
                    #{tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
  },
  submitBtn: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginTop: 14,
    marginBottom: 8,
  },
  imagesRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  addImageCard: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#e8f5e9',
    borderWidth: 1.5,
    borderColor: '#28a745',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addImageText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
    marginTop: 4,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  uploadedImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImgBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#222',
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 40,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#f0f2f5',
  },
  tagChipActive: {
    backgroundColor: '#28a745',
  },
  tagChipText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  tagChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});
