import React from 'react';
import { Button, StyleSheet, View } from 'react-native';

interface ActionButtonsProps {
  onOpenCamera: () => void;
  onPickImage: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onOpenCamera, onPickImage }) => {
  return (
    <View style={styles.buttonRow}>
      <Button title="📸 Mở Camera" onPress={onOpenCamera} />
      <View style={{ width: 10 }} />
      <Button title="🖼️ Chọn ảnh" onPress={onPickImage} />
    </View>
  );
};

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
});
