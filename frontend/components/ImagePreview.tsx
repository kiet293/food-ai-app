import React from 'react';
import { View, Image, Button, StyleSheet } from 'react-native';

interface ImagePreviewProps {
  imageUri: string;
  isLoading: boolean;
  onAnalyze: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ imageUri, isLoading, onAnalyze }) => {
  return (
    <View style={styles.imageContainer}>
      <Image source={{ uri: imageUri }} style={styles.image} />

      <View style={styles.analyzeButton}>
        <Button
          title="🔍 Phân tích nguyên liệu"
          color="#28a745"
          onPress={onAnalyze}
          disabled={isLoading}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  image: {
    width: 250,
    height: 250,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  analyzeButton: {
    marginTop: 15,
    width: "100%",
  },
});
