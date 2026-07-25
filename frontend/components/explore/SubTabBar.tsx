import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface SubTabBarProps {
  activeTab: 'GLOBAL' | 'FOLLOWING';
  setActiveTab: (tab: 'GLOBAL' | 'FOLLOWING') => void;
}

export const SubTabBar: React.FC<SubTabBarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <View style={styles.subTabBar}>
      <TouchableOpacity
        style={styles.subTabItem}
        onPress={() => setActiveTab('GLOBAL')}
      >
        <Text
          style={[
            styles.subTabText,
            activeTab === 'GLOBAL' && styles.subTabTextActive,
          ]}
        >
          GLOBAL
        </Text>
        {activeTab === 'GLOBAL' && <View style={styles.activeTabLine} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.subTabItem}
        onPress={() => setActiveTab('FOLLOWING')}
      >
        <Text
          style={[
            styles.subTabText,
            activeTab === 'FOLLOWING' && styles.subTabTextActive,
          ]}
        >
          FOLLOWING
        </Text>
        {activeTab === 'FOLLOWING' && <View style={styles.activeTabLine} />}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  subTabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  subTabItem: {
    paddingVertical: 10,
    position: 'relative',
  },
  subTabText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#bbb',
    letterSpacing: 0.5,
  },
  subTabTextActive: {
    color: '#111',
  },
  activeTabLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#28a745',
    borderRadius: 2,
  },
});
