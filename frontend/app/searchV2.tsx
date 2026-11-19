import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Trang searchV2 đã được sáp nhập hoàn toàn vào /search (Tab "Gợi ý AI").
 * Component này giữ nhiệm vụ chuyển hướng người dùng an toàn sang /search?mode=ai.
 */
export default function SearchV2Redirect() {
  const params = useLocalSearchParams<{ q?: string }>();

  return (
    <Redirect
      href={{
        pathname: '/search',
        params: { ...params, mode: 'ai' },
      }}
    />
  );
}
