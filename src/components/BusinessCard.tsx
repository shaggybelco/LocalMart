import { Linking, Platform, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Business } from '@/services/businesses';

const CATEGORY_LABEL: Record<string, string> = {
  spaza:        'Spaza Shop',
  hair_salon:   'Hair Salon',
  car_wash:     'Car Wash',
  food_vendor:  'Food Vendor',
  phone_repair: 'Phone Repair',
  tailor:       'Tailor',
};

function formatDistance(m: number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

function isOpen(open?: string, close?: string) {
  if (!open || !close) return false;
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = open.split(':').map(Number);
  const [ch, cm] = close.split(':').map(Number);
  return mins >= oh * 60 + om && mins < ch * 60 + cm;
}

interface Props {
  business: Business & { distance_meters?: number };
  style?: ViewStyle;
}

export function BusinessCard({ business, style }: Props) {
  const theme = useTheme();
  const open = isOpen(business.open_time, business.close_time);

  const onWhatsApp = () => {
    const n = business.whatsapp_number?.replace(/\D/g, '');
    if (!n) return;
    Linking.openURL(`https://wa.me/${n.startsWith('0') ? '27' + n.slice(1) : n}`);
  };

  return (
    <Pressable
      onPress={() => router.push(`/business/${business.id}`)}
      style={({ pressed }) => [style, { opacity: pressed ? 0.92 : 1 }]}>
      <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.border }]}>

        {/* Top section */}
        <View style={styles.top}>
          <View style={styles.titleRow}>
            <ThemedText type="smallBold" style={styles.name} numberOfLines={1}>
              {business.name}
            </ThemedText>
            <View style={[
              styles.statusPill,
              { backgroundColor: open ? '#ECFDF5' : '#FEF2F2' },
            ]}>
              <ThemedText style={[styles.statusText, { color: open ? '#065F46' : '#991B1B' }]}>
                {open ? 'Open' : 'Closed'}
              </ThemedText>
            </View>
          </View>

          <ThemedText type="small" themeColor="textSecondary" style={styles.category}>
            {CATEGORY_LABEL[business.category] ?? business.category.replace(/_/g, ' ')}
          </ThemedText>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Meta row */}
        <View style={styles.meta}>
          {business.distance_meters !== undefined && (
            <ThemedText type="small" themeColor="textSecondary">
              {formatDistance(business.distance_meters)} away
            </ThemedText>
          )}
          {business.open_time && open && (
            <ThemedText type="small" themeColor="textSecondary">
              · closes {business.close_time}
            </ThemedText>
          )}
          {business.price_range && (
            <ThemedText type="small" themeColor="textSecondary">
              · {business.price_range}
            </ThemedText>
          )}
          {business.rating > 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              · ★ {business.rating}
            </ThemedText>
          )}
        </View>

        {/* Action */}
        <Pressable
          onPress={onWhatsApp}
          style={({ pressed }) => [
            styles.whatsapp,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            pressed && { opacity: 0.75 },
          ]}>
          <ThemedText type="small" style={[styles.whatsappText, { color: theme.brand }]}>
            WhatsApp
          </ThemedText>
        </Pressable>
      </View>
    </Pressable>
  );
}

const shadow = Platform.select({
  web: { boxShadow: '0 1px 6px rgba(0,0,0,0.06)' },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
    marginBottom: Spacing.two,
    ...(shadow as any),
  },
  top: { gap: 4 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  name: {
    fontSize: 15,
    flex: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  category: {
    fontSize: 12,
    textTransform: 'capitalize',
    letterSpacing: 0.2,
  },
  divider: { height: 1, marginVertical: 2 },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  whatsapp: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 2,
  },
  whatsappText: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
