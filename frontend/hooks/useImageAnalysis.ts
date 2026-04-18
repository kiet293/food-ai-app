import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert } from 'react-native';
import { AIAnalysisResult, analyzeImageWithAI } from '../services/aiService';

export function useImageAnalysis() {
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resultData, setResultData] = useState<AIAnalysisResult | null>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setResultData(null);
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
      setImage(result.assets[0].uri);
      setResultData(null);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;

    setIsLoading(true);
    setResultData(null);

    try {
      const result = await analyzeImageWithAI(image);
      setResultData(result);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    image,
    isLoading,
    resultData,
    pickImage,
    openCamera,
    analyzeImage
  };
}
