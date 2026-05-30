import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/app-theme';

export function useTheme() {
  const { resolved } = useAppTheme();
  return Colors[resolved];
}
