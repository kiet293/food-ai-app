import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleProp, TextStyle } from 'react-native';

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: string;
  size?: number;
  color: string;
  style?: StyleProp<TextStyle>;
}) {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    'compass.fill': 'compass',
    'compass': 'compass-outline',
    'play.circle.fill': 'play-circle',
    'book.fill': 'book',
    'person.fill': 'person',
    'house.fill': 'home',
    'magnifyingglass': 'search',
  };

  const iconName = iconMap[name] || 'ellipse';
  return <Ionicons name={iconName} size={size} color={color} style={style} />;
}
