import React, { useState, useRef, useEffect } from 'react';
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
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_HOT_TAGS } from '../../services/mock/mockCommunityData';
import { fetchCategories, createRecipe, updateRecipe } from '../../services/recipe/recipeService';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated: (newPost: {
    title: string;
    description: string;
    images: string[];
    tags: string[];
    category: string;
    instructions: string[];
  }) => void;
  isEditMode?: boolean;
  recipeId?: string;
  initialData?: any;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  onClose,
  onPostCreated,
  isEditMode = false,
  recipeId,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<string[]>(['', '']);
  const [steps, setSteps] = useState<string[]>(['', '']);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollViewRef = useRef<any>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!visible) {
      hasInitialized.current = false;
    }
  }, [visible]);

  useEffect(() => {
    const loadCategories = async () => {
      const data = await fetchCategories();
      const catNames = data.map(c => c.name);
      setCategories(catNames);
      if (catNames.length > 0 && !isEditMode) {
        setSelectedCategory(catNames[0]);
        setCategorySearch(catNames[0]);
      }
    };
    loadCategories();
  }, [isEditMode]);

  useEffect(() => {
    if (visible && isEditMode && initialData && !hasInitialized.current) {
      hasInitialized.current = true;
      setTitle(initialData.title || initialData.recipeName || '');
      setDescription(initialData.description || '');
      
      const defaultImage = initialData.image || initialData.image_url;
      setImages(defaultImage ? [defaultImage] : []);
      
      const ings = initialData.ingredients ? initialData.ingredients.map((i: any) => typeof i === 'string' ? i : i.name) : [''];
      setIngredients(ings.length > 0 ? [...ings, ''] : ['', '']);
      
      const stps = initialData.instructions || [''];
      setSteps(stps.length > 0 ? [...stps, ''] : ['', '']);
      
      if (initialData.category_name) {
        setSelectedCategory(initialData.category_name);
        setCategorySearch(initialData.category_name);
      }
      
      // Note: tags are currently part of the description by parsing hashtags
      if (initialData.tags && initialData.tags.length > 0) {
        const hashtags = initialData.tags.map((t: string) => `#${t}`).join(' ');
        if (!initialData.description?.includes(hashtags)) {
          setDescription(`${initialData.description || ''} ${hashtags}`.trim());
        }
      }
    } else if (visible && !isEditMode && !hasInitialized.current) {
      hasInitialized.current = true;
      setTitle('');
      setDescription('');
      setImages([]);
      setIngredients(['', '']);
      setSteps(['', '']);
      if (categories.length > 0) {
        setSelectedCategory(categories[0]);
        setCategorySearch(categories[0]);
      }
    }
  }, [visible, isEditMode, initialData, categories]);

  useEffect(() => {
    // Tự động cuộn xuống khi có ô nhập liệu mới được thêm vào
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [steps.length]);

  const filteredCategories = categories.filter(cat => 
    cat.toLowerCase().includes(categorySearch.toLowerCase())
  );

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

  const handleStepChange = (text: string, index: number) => {
    const newSteps = [...steps];
    newSteps[index] = text;

    while (newSteps.length > 2 && newSteps[newSteps.length - 1] === '' && newSteps[newSteps.length - 2] === '') {
      newSteps.pop();
    }
    
    if (newSteps[newSteps.length - 1] !== '') {
      newSteps.push('');
    }

    while (newSteps.length > 2 && newSteps[newSteps.length - 1] === '' && newSteps[newSteps.length - 2] === '') {
      newSteps.pop();
    }

    setSteps(newSteps);
  };

  const handleIngredientChange = (text: string, index: number) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = text;

    while (newIngredients.length > 2 && newIngredients[newIngredients.length - 1] === '' && newIngredients[newIngredients.length - 2] === '') {
      newIngredients.pop();
    }
    
    if (newIngredients[newIngredients.length - 1] !== '') {
      newIngredients.push('');
    }

    while (newIngredients.length > 2 && newIngredients[newIngredients.length - 1] === '' && newIngredients[newIngredients.length - 2] === '') {
      newIngredients.pop();
    }

    setIngredients(newIngredients);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tên món ăn/tiêu đề bài viết!');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng thêm ít nhất 1 hình ảnh món ăn!');
      return;
    }

    const hashtagRegex = /#([\w\u00C0-\u024F\u1E00-\u1EFF]+)/g;
    const matches = [...description.matchAll(hashtagRegex)];
    const extractedTags = matches.map(match => match[1]);

    const validSteps = steps.filter(s => s.trim() !== '');
    const validIngredients = ingredients.filter(i => i.trim() !== '');

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('recipe_name', title.trim());
    formData.append('description', description.trim());
    formData.append('ingredients', JSON.stringify(validIngredients));
    formData.append('instructions', JSON.stringify(validSteps));
    formData.append('category_name', selectedCategory);
    formData.append('tags', JSON.stringify(extractedTags));

    const uri = images[0];
    if (uri && uri.startsWith('file://')) {
      const filename = uri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      formData.append('image', { uri, name: filename, type } as any);
    } else if (uri && !isEditMode) {
      // For web or remote urls, we might need a Blob, but assuming React Native file uri here.
      formData.append('image', { uri, name: 'image.jpg', type: 'image/jpeg' } as any);
    }

    try {
      let success = false;
      if (isEditMode && recipeId) {
        success = await updateRecipe(recipeId, formData);
      } else {
        success = await createRecipe(formData);
      }
      
      if (success) {
        Alert.alert('Thành công', isEditMode ? 'Cập nhật món ăn thành công!' : 'Đăng tải món ăn thành công!', [
          {
            text: 'OK',
            onPress: () => {
              onPostCreated({
                title: title.trim(),
                description: description.trim(),
                images,
                tags: extractedTags,
                category: selectedCategory,
                instructions: validSteps,
              });
              
              // Reset state & close
              setTitle('');
              setDescription('');
              setImages([]);
              setIngredients(['', '']);
              setSteps(['', '']);
              setSelectedCategory(categories[0] || '');
              setCategorySearch(categories[0] || '');
              setIsCategoryDropdownOpen(false);
              onClose();
            }
          }
        ]);
      } else {
        Alert.alert('Lỗi', 'Có lỗi xảy ra khi đăng bài.');
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Lỗi mạng hoặc server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={26} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditMode ? 'Chỉnh Sửa Bài Viết' : 'Chia Sẻ Bài Viết Mới'}</Text>
          <TouchableOpacity 
            style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>{isEditMode ? 'Lưu lại' : 'Đăng'}</Text>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView 
            ref={scrollViewRef}
            style={styles.content} 
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Image Upload Area */}
            <View style={styles.sectionHeader}>
              <Ionicons name="images" size={20} color="#10B981" />
              <Text style={styles.sectionLabel}>Hình Ảnh Món Ăn</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
              <TouchableOpacity style={styles.addImageCard} onPress={pickImage}>
                <Ionicons name="camera-outline" size={32} color="#10B981" />
                <Text style={styles.addImageText}>Thêm ảnh</Text>
              </TouchableOpacity>

              {images.map((uri, idx) => (
                <View key={idx} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.uploadedImage} />
                  <TouchableOpacity style={styles.removeImgBtn} onPress={() => removeImage(idx)}>
                    <Ionicons name="close-circle" size={24} color="#ff4d4f" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            {/* Title input */}
            <View style={styles.sectionHeader}>
              <Ionicons name="restaurant" size={20} color="#10B981" />
              <Text style={styles.sectionLabel}>Tên Món Ăn / Tiêu Đề *</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: Gà Sốt Tỏi Tương Giòn Rụm..."
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />

            {/* Description input */}
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color="#10B981" />
              <Text style={styles.sectionLabel}>Mô tả món ăn (hỗ trợ nhập #tag)</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Chia sẻ bí quyết nấu nướng hoặc mô tả món ăn. Thêm #tag (VD: #Healthy)..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            {/* Category Selection */}
            <View style={styles.sectionHeader}>
              <Ionicons name="grid" size={20} color="#10B981" />
              <Text style={styles.sectionLabel}>Danh Mục Món Ăn *</Text>
            </View>
            <View style={{ zIndex: 10, marginBottom: 20 }}>
              <TouchableOpacity 
                activeOpacity={1} 
                style={styles.dropdownInputWrapper}
                onPress={() => setIsCategoryDropdownOpen(true)}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Tìm kiếm danh mục..."
                  value={categorySearch}
                  onChangeText={(text) => {
                    setCategorySearch(text);
                    setIsCategoryDropdownOpen(true);
                  }}
                  onFocus={() => setIsCategoryDropdownOpen(true)}
                />
                <Ionicons 
                  name={isCategoryDropdownOpen ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#666" 
                  style={styles.dropdownIcon} 
                />
              </TouchableOpacity>

              {isCategoryDropdownOpen && (
                <ScrollView 
                  style={styles.dropdownList}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                >
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.dropdownItem,
                          selectedCategory === cat && styles.dropdownItemActive
                        ]}
                        onPress={() => {
                          setSelectedCategory(cat);
                          setCategorySearch(cat);
                          setIsCategoryDropdownOpen(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          selectedCategory === cat && styles.dropdownItemTextActive
                        ]}>
                          {cat}
                        </Text>
                        {selectedCategory === cat && (
                          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        )}
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.noResultText}>Không tìm thấy danh mục</Text>
                  )}
                </ScrollView>
              )}
            </View>

            {/* Ingredients input */}
            <View style={styles.sectionHeader}>
              <Ionicons name="basket" size={20} color="#10B981" />
              <Text style={styles.sectionLabel}>Nguyên liệu cần chuẩn bị</Text>
            </View>
            {ingredients.map((ing, index) => (
              <View key={index} style={styles.stepContainer}>
                <View style={[styles.stepBadge, { backgroundColor: '#A7F3D0' }]}>
                  <Text style={[styles.stepBadgeText, { color: '#10B981' }]}>•</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.stepInput, { minHeight: 46, paddingVertical: 10 }]}
                  placeholder="VD: 500g Thịt gà..."
                  value={ing}
                  onChangeText={(text) => handleIngredientChange(text, index)}
                  multiline={false}
                />
              </View>
            ))}

            {/* Instructions input */}
            <View style={styles.sectionHeader}>
              <Ionicons name="list" size={20} color="#10B981" />
              <Text style={styles.sectionLabel}>Các bước nấu ăn</Text>
            </View>
            {steps.map((step, index) => (
              <View key={index} style={styles.stepContainer}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{index + 1}</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.stepInput]}
                  placeholder="Nhập hướng dẫn nấu..."
                  value={step}
                  onChangeText={(text) => handleStepChange(text, index)}
                  multiline
                />
              </View>
            ))}
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 20,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#F5F6F8',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  submitBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 8,
  },
  imagesRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  addImageCard: {
    width: 110,
    height: 110,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#A7F3D0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  addImageText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '700',
    marginTop: 6,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  uploadedImage: {
    width: 110,
    height: 110,
    borderRadius: 16,
  },
  removeImgBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  input: {
    backgroundColor: '#F7F8FA',
    borderWidth: 1,
    borderColor: '#F0F2F5',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#2C3E50',
    fontWeight: '500',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  dropdownInputWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  dropdownIcon: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0F2F5',
    borderRadius: 16,
    maxHeight: 200,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F8FA',
  },
  dropdownItemActive: {
    backgroundColor: '#ECFDF5',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#2C3E50',
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    color: '#10B981',
    fontWeight: '700',
  },
  noResultText: {
    padding: 16,
    textAlign: 'center',
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  stepBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  stepInput: {
    flex: 1,
    minHeight: 50,
  }
});
