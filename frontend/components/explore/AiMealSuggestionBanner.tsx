import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export const AiMealSuggestionBanner: React.FC = () => {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.bannerContainer}
      onPress={() => router.push('/searchV2?q=gợi ý bữa ăn ngon hôm nay')}
      activeOpacity={0.9}
    >
      <Image
        source={{
          uri: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop&q=80',
        }}
        style={styles.bgImage}
      />
      <View style={styles.overlay} />

      <View style={styles.contentWrap}>
        <View style={styles.badgeRow}>
          <Ionicons name="sparkles" size={14} color="#fff" />
          <Text style={styles.badgeText}>AI GỢI Ý BỮA ĂN HÔM NAY</Text>
        </View>

        <Text style={styles.titleText}>Hôm nay bạn muốn ăn gì?</Text>
        <Text style={styles.subText}>
          Chạm để AI phân tích & gợi ý 3 món ăn dinh dưỡng cân bằng cho gia đình!
        </Text>

        <View style={styles.actionBtn}>
          <Ionicons name="flash-outline" size={16} color="#28a745" />
          <Text style={styles.actionBtnText}>Khám Phá Gợi Ý AI Tức Thì</Text>
          <Ionicons name="arrow-forward" size={14} color="#28a745" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    height: 150,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    elevation: 4,
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 50, 25, 0.55)',
  },
  contentWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 14,
    bottom: 14,
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  titleText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 4,
  },
  subText: {
    color: '#e0e0e0',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginTop: 6,
  },
  actionBtnText: {
    color: '#28a745',
    fontSize: 12,
    fontWeight: '800',
  },
});
