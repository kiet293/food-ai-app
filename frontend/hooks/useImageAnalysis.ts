import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {  Alert} from 'react-native';
import { AIAnalysisResult, analyzeImagesWithAI } from '../services/ai/aiService';

export function useImageAnalysis() {
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resultData, setResultData] = useState<AIAnalysisResult | null>(null);

  const addImages = (newUris: string[]) => {
    setImages((currentImages) => [...currentImages, ...newUris]);
    setResultData(null);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      addImages(result.assets.map((asset) => asset.uri));
    }
  };

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Thông báo",
        "Bạn cần cấp quyền truy cập camera để chụp ảnh nguyên liệu!",
      );
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      addImages([result.assets[0].uri]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages((currentImages) => currentImages.filter((_, index) => index !== indexToRemove));
    setResultData(null);
  };

  const clearImages = () => {
    setImages([]);
    setResultData(null);
  };

  const analyzeImage = async () => {
    if (images.length === 0) return;

    setIsLoading(true);
    setResultData(null);

    try {
      const result = await analyzeImagesWithAI(images);
      setResultData(result);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    images,
    isLoading,
    resultData,
    setResultData,
    pickImage,
    openCamera,
    analyzeImage,
    removeImage,
    clearImages
  };
}
