import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileBioModalProps {
  visible: boolean;
  initialBio: string;
  isSaving: boolean;
  isDarkMode: boolean;
  dynamicBg: string;
  dynamicTextColor: string;
  dynamicSubTextColor: string;
  dynamicBorderColor: string;
  onClose: () => void;
  onSaveBio: (bioText: string) => void;
}

export const ProfileBioModal: React.FC<ProfileBioModalProps> = ({
  visible,
  initialBio,
  isSaving,
  isDarkMode,
  dynamicBg,
  dynamicTextColor,
  dynamicSubTextColor,
  dynamicBorderColor,
  onClose,
  onSaveBio,
}) => {
  const [bioText, setBioText] = useState(initialBio || '');

  useEffect(() => {
    if (visible) {
      setBioText(initialBio || '');
    }
  }, [visible, initialBio]);

  const handleSave = () => {
    onSaveBio(bioText.trim());
  };

  const cardBg = isDarkMode ? '#1e1e1e' : '#f2f3f5';

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: dynamicBg }]}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.innerContainer}
          >
            {/* Top Navigation Bar */}
            <View style={[styles.headerBar, { borderBottomColor: dynamicBorderColor }]}>
              <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
                <Text style={[styles.cancelText, { color: dynamicTextColor }]}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSave} style={styles.headerBtn} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fe2c55" />
                ) : (
                  <Text style={styles.saveText}>Lưu</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.contentBody}>
              {/* Title & Subtitle */}
              <Text style={[styles.pageTitle, { color: dynamicTextColor }]}>Tiểu sử</Text>
              <Text style={[styles.pageSubtitle, { color: dynamicSubTextColor }]}>
                Bạn có thể chỉnh sửa tiểu sử bất cứ lúc nào.
              </Text>

              {/* Multi-line Input Box (TikTok Style) */}
              <View style={[styles.inputBoxContainer, { backgroundColor: cardBg }]}>
                <TextInput
                  style={[styles.multilineInput, { color: dynamicTextColor }]}
                  multiline
                  value={bioText}
                  onChangeText={setBioText}
                  maxLength={160}
                  placeholder="Viết tiểu sử của bạn tại đây..."
                  placeholderTextColor="#aaa"
                  textAlignVertical="top"
                  autoFocus
                />
                <Text style={[styles.charCount, { color: dynamicSubTextColor }]}>
                  {bioText.length}/160
                </Text>
              </View>

              {/* Mention Button Pill */}
              <View style={styles.toolsRow}>
                <TouchableOpacity style={[styles.mentionPill, { backgroundColor: cardBg }]}>
                  <Text style={[styles.mentionText, { color: dynamicTextColor }]}>@ Nhắc đến</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  headerBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  headerBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '400',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fe2c55',
  },
  contentBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  inputBoxContainer: {
    height: 140,
    borderRadius: 12,
    padding: 14,
    position: 'relative',
  },
  multilineInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  charCount: {
    position: 'absolute',
    bottom: 10,
    right: 14,
    fontSize: 12,
  },
  toolsRow: {
    marginTop: 16,
    flexDirection: 'row',
  },
  mentionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  mentionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
