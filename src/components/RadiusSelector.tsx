import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const RADII = [1, 2, 5, 10];

interface Props {
  value: number;
  onChange: (km: number) => void;
}

export function RadiusSelector({ value, onChange }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
        Within
      </ThemedText>
      {RADII.map(km => {
        const active = value === km;
        return (
          <Pressable
            key={km}
            onPress={() => onChange(km)}
            style={({ pressed }) => [
              styles.chip,
              active
                ? { backgroundColor: theme.brand, borderColor: theme.brand }
                : { backgroundColor: theme.background, borderColor: theme.backgroundElement },
              pressed && { opacity: 0.7 },
            ]}>
            <ThemedText
              type="small"
              style={[
                styles.chipText,
                { color: active ? '#fff' : theme.textSecondary },
                active && styles.chipTextActive,
              ]}>
              {km} km
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  label: { fontSize: 12, marginRight: Spacing.one },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  chipText: { fontSize: 13 },
  chipTextActive: { fontWeight: '700' },
});
