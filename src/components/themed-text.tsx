import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default'     && styles.default,
        type === 'title'       && styles.title,
        type === 'small'       && styles.small,
        type === 'smallBold'   && styles.smallBold,
        type === 'subtitle'    && styles.subtitle,
        type === 'link'        && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code'        && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fonts?.sans,
    fontWeight: '400',
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts?.semiBold,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 28,
    lineHeight: 36,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  title: {
    fontSize: 40,
    lineHeight: 48,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  link: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  linkPrimary: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#059669',
  },
  code: {
    fontFamily: Platform.select({ web: 'var(--font-mono)', default: Fonts?.mono }),
    fontWeight: '500',
    fontSize: 12,
  },
});
