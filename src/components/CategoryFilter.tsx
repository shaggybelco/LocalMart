import { useRef, useState } from 'react';
import { ScrollView, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppTheme } from '@/context/app-theme';

export const CATEGORIES = [
  { id: 'all',          label: 'All'          },
  { id: 'spaza',        label: 'Spaza'        },
  { id: 'grocery',      label: 'Grocery'      },
  { id: 'hair_salon',   label: 'Hair'         },
  { id: 'beauty_salon', label: 'Beauty'       },
  { id: 'car_wash',     label: 'Car Wash'     },
  { id: 'mechanic',     label: 'Mechanic'     },
  { id: 'food_vendor',  label: 'Food'         },
  { id: 'phone_repair', label: 'Phone Repair' },
  { id: 'tailor',       label: 'Tailor'       },
  { id: 'laundry',      label: 'Laundry'      },
  { id: 'tutoring',     label: 'Tutoring'     },
  { id: 'other',        label: 'Other'        },
];

const GRAD_LIGHT = ['#047857', '#0D9488'] as const;
const GRAD_DARK  = ['#059669', '#0D9488'] as const;

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

export function CategoryFilter({ selected, onSelect }: Props) {
  const theme = useTheme();
  const { resolved } = useAppTheme();
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const bg = theme.background;
  const bgTransparent = bg + '00';

  const handleScroll = (e: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    setShowLeft(contentOffset.x > 8);
    setShowRight(contentOffset.x + layoutMeasurement.width < contentSize.width - 8);
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.row}>
        {CATEGORIES.map(cat => {
          const active = selected === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => onSelect(cat.id)}
              style={({ pressed }) => [styles.chipWrap, pressed && { opacity: 0.7 }]}>
              {active ? (
                <LinearGradient
                  colors={resolved === 'dark' ? GRAD_DARK : GRAD_LIGHT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.chip}>
                  <ThemedText style={styles.labelActive}>{cat.label}</ThemedText>
                </LinearGradient>
              ) : (
                <ThemedText
                  style={[
                    styles.chip,
                    styles.chipInactive,
                    {
                      color: theme.textSecondary,
                      borderColor: theme.border,
                      backgroundColor: 'transparent',
                    },
                  ]}>
                  {cat.label}
                </ThemedText>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Left fade — appears after scrolling right */}
      {showLeft && (
        <LinearGradient
          colors={[bg, bgTransparent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fadeLeft}
          pointerEvents="none"
        />
      )}

      {/* Right fade — hints there are more chips to the right */}
      {showRight && (
        <LinearGradient
          colors={[bgTransparent, bg]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fadeRight}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const FADE_WIDTH = 32;

const styles = StyleSheet.create({
  wrapper: { position: 'relative' },
  row: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    gap: Spacing.two,
    alignItems: 'center',
  },
  chipWrap: {},
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 7,
    borderRadius: 6,
  },
  chipInactive: {
    borderWidth: 1,
    fontSize: 13,
    fontWeight: '500',
    overflow: 'hidden',
  },
  labelActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  fadeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: FADE_WIDTH,
  },
  fadeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: FADE_WIDTH,
  },
});
