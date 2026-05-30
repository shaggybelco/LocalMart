import { useWindowDimensions } from 'react-native';
import { MaxContentWidth } from '@/constants/theme';

export function useResponsive() {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const numColumns = isWide ? 2 : 1;
  const contentMaxWidth = Math.min(width, MaxContentWidth);
  return { isWide, numColumns, width, contentMaxWidth };
}
