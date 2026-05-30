import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '@/context/app-theme';

// Light: deep emerald to teal — sophisticated, premium
const GRAD_LIGHT = ['#047857', '#059669', '#0D9488'] as const;
// Dark: near-black emerald — ultra deep, premium
const GRAD_DARK  = ['#022C22', '#064E3B', '#065F46'] as const;

// Subtle card gradient (light tint only)
export const CARD_GRAD_LIGHT = ['#FFFFFF', '#F0FDF8'] as const;
export const CARD_GRAD_DARK  = ['#0B1F14', '#030A06'] as const;

interface Props {
  style?: ViewStyle;
  children?: React.ReactNode;
  horizontal?: boolean;
  subtle?: boolean;
}

export function GradientView({ style, children, horizontal = false, subtle = false }: Props) {
  const { resolved } = useAppTheme();

  const colors = subtle
    ? (resolved === 'dark' ? CARD_GRAD_DARK : CARD_GRAD_LIGHT)
    : (resolved === 'dark' ? GRAD_DARK : GRAD_LIGHT);

  return (
    <LinearGradient
      colors={colors}
      start={horizontal ? { x: 0, y: 0.5 } : { x: 0, y: 0 }}
      end={horizontal ? { x: 1, y: 0.5 } : { x: 0, y: 1 }}
      style={[styles.base, style]}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
});
