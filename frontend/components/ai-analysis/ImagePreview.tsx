import React from 'react';
import { View, Image, Button, StyleSheet, ScrollView } from 'react-native';

interface ImagePreviewProps {
  imageUris: string[];
  isLoading: boolean;
  onAnalyze: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ imageUris, isLoading, onAnalyze }) => {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {imageUris.map((uri, index) => (
          <Image key={index} source={{ uri }} style={styles.image} />
        ))}
      </ScrollView>

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
  container: {
    marginTop: 10,
    alignItems: "center",
    width: "100%",
  },
  scrollContent: {
    paddingHorizontal: 10,
    gap: 10,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#ddd",
    marginHorizontal: 5,
  },
  analyzeButton: {
    marginTop: 15,
    width: "80%",
  },
});
