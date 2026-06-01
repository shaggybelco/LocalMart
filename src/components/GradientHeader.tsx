import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { GradientView } from '@/components/GradientView';
import { MaxContentWidth, Spacing } from '@/constants/theme';

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  /** Optional content rendered below the title row, still inside the gradient */
  children?: React.ReactNode;
}

export function GradientHeader({ title, subtitle, right, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <GradientView style={[s.outer, { paddingTop: insets.top + Spacing.two }]}>
      <View style={s.inner}>
        <View style={s.text}>
          <ThemedText type="subtitle" style={s.title}>{title}</ThemedText>
          {subtitle ? <ThemedText type="small" style={s.sub}>{subtitle}</ThemedText> : null}
        </View>
        {right ? <View style={s.rightSlot}>{right}</View> : null}
      </View>
      {children ?? null}
    </GradientView>
  );
}

const s = StyleSheet.create({
  outer: { width: '100%' },
  inner: {
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    paddingTop: Spacing.two,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  text: { flex: 1, gap: Spacing.half },
  title: { color: '#fff' },
  sub: { color: 'rgba(255,255,255,0.8)' },
  rightSlot: { marginTop: Spacing.one },
});
