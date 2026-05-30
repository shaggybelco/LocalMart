import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    text:                '#0A2218',
    background:          '#FFFFFF',
    backgroundElement:   '#F0FDF8',
    backgroundSelected:  '#D1FAE5',
    textSecondary:       '#6B7280',
    brand:               '#059669',
    surface:             '#FFFFFF',
    border:              '#E5E7EB',
  },
  dark: {
    text:                '#F0FDF8',
    background:          '#030A06',
    backgroundElement:   '#0B1F14',
    backgroundSelected:  '#064E3B',
    textSecondary:       '#9CA3AF',
    brand:               '#34D399',
    surface:             '#0B1F14',
    border:              '#1F2D24',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans:     'Poppins_400Regular',
    medium:   'Poppins_500Medium',
    semiBold: 'Poppins_600SemiBold',
    bold:     'Poppins_700Bold',
    mono:     'ui-monospace',
  },
  android: {
    sans:     'Poppins_400Regular',
    medium:   'Poppins_500Medium',
    semiBold: 'Poppins_600SemiBold',
    bold:     'Poppins_700Bold',
    mono:     'monospace',
  },
  default: {
    sans:     'Poppins_400Regular',
    medium:   'Poppins_500Medium',
    semiBold: 'Poppins_600SemiBold',
    bold:     'Poppins_700Bold',
    mono:     'monospace',
  },
  web: {
    sans:     'var(--font-display)',
    medium:   'var(--font-display)',
    semiBold: 'var(--font-display)',
    bold:     'var(--font-display)',
    mono:     'var(--font-mono)',
  },
});

export const Spacing = {
  half:  2,
  one:   4,
  two:   8,
  three: 16,
  four:  24,
  five:  32,
  six:   64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
