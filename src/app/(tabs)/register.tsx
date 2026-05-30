import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/services/supabase';

const CATEGORIES = [
  'spaza', 'hair_salon', 'car_wash', 'food_vendor', 'phone_repair', 'tailor',
];

export default function RegisterScreen() {
  const theme = useTheme();
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('17:00');
  const [inventoryInput, setInventoryInput] = useState('');
  const [inventory, setInventory] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<'R' | 'RR' | 'RRR'>('RR');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (authLoading) return <ThemedView style={styles.centered}><ActivityIndicator /></ThemedView>;

  if (!user) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.gateText}>
          Sign in to list your business on LocalMart.
        </ThemedText>
        <Pressable style={[styles.btn, { backgroundColor: theme.brand }]} onPress={() => router.push('/auth/login')}>
          <ThemedText type="smallBold" style={{ color: '#fff' }}>Sign In</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (done) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle" style={{ textAlign: 'center' }}>🎉</ThemedText>
        <ThemedText type="smallBold" style={{ textAlign: 'center' }}>Business submitted!</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
          Your listing is pending verification and will appear on the map shortly.
        </ThemedText>
        <Pressable
          style={[styles.btn, { backgroundColor: theme.brand }]}
          onPress={() => {
            setDone(false);
            setName('');
            setCategory('');
            setAddress('');
            setWhatsapp('');
            setInventory([]);
          }}>
          <ThemedText type="smallBold" style={{ color: '#fff' }}>Add Another</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const addInventoryItem = () => {
    const item = inventoryInput.trim();
    if (item && !inventory.includes(item)) setInventory(prev => [...prev, item]);
    setInventoryInput('');
  };

  const handleSubmit = async () => {
    if (!name || !category || !whatsapp) {
      Alert.alert('Please fill in name, category, and WhatsApp number');
      return;
    }
    setSubmitting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat = -26.2678, lng = 27.8589;
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }

      const { error } = await supabase.from('businesses').insert({
        name,
        category,
        location: `POINT(${lng} ${lat})`,
        address,
        whatsapp_number: whatsapp,
        open_time: openTime,
        close_time: closeTime,
        inventory,
        price_range: priceRange,
        owner_id: user.id,
        verified: false,
      });

      if (error) throw error;
      setDone(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll}>
        <ThemedText type="subtitle" style={styles.title}>List Your Business</ThemedText>

        <Field label="Business Name *">
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
            value={name} onChangeText={setName}
            placeholder="e.g. Tasty Spaza" placeholderTextColor={theme.textSecondary}
          />
        </Field>

        <Field label="Category *">
          <View style={styles.chips}>
            {CATEGORIES.map(c => (
              <Pressable
                key={c}
                style={[styles.chip, { backgroundColor: category === c ? theme.brand : theme.backgroundElement }]}
                onPress={() => setCategory(c)}>
                <ThemedText type="small" style={{ color: category === c ? '#fff' : theme.text, textTransform: 'capitalize' }}>
                  {c.replace('_', ' ')}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </Field>

        <Field label="WhatsApp Number *">
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
            value={whatsapp} onChangeText={setWhatsapp}
            placeholder="0821234567" placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
          />
        </Field>

        <Field label="Address">
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
            value={address} onChangeText={setAddress}
            placeholder="123 Main St, Soweto" placeholderTextColor={theme.textSecondary}
          />
        </Field>

        <Field label="Trading Hours">
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.half, { backgroundColor: theme.backgroundElement, color: theme.text }]}
              value={openTime} onChangeText={setOpenTime}
              placeholder="08:00" placeholderTextColor={theme.textSecondary}
            />
            <ThemedText type="small" themeColor="textSecondary"> to </ThemedText>
            <TextInput
              style={[styles.input, styles.half, { backgroundColor: theme.backgroundElement, color: theme.text }]}
              value={closeTime} onChangeText={setCloseTime}
              placeholder="17:00" placeholderTextColor={theme.textSecondary}
            />
          </View>
        </Field>

        <Field label="Price Range">
          <View style={styles.row}>
            {(['R', 'RR', 'RRR'] as const).map(p => (
              <Pressable
                key={p}
                style={[styles.chip, { backgroundColor: priceRange === p ? theme.brand : theme.backgroundElement }]}
                onPress={() => setPriceRange(p)}>
                <ThemedText type="small" style={{ color: priceRange === p ? '#fff' : theme.text }}>{p}</ThemedText>
              </Pressable>
            ))}
          </View>
        </Field>

        <Field label="Inventory / Services">
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1, backgroundColor: theme.backgroundElement, color: theme.text }]}
              value={inventoryInput} onChangeText={setInventoryInput}
              placeholder="e.g. Bread" placeholderTextColor={theme.textSecondary}
              onSubmitEditing={addInventoryItem} returnKeyType="done"
            />
            <Pressable style={[styles.chip, { backgroundColor: theme.brand }]} onPress={addInventoryItem}>
              <ThemedText type="small" style={{ color: '#fff' }}>Add</ThemedText>
            </Pressable>
          </View>
          {inventory.length > 0 && (
            <View style={styles.chips}>
              {inventory.map(item => (
                <Pressable
                  key={item}
                  style={[styles.chip, { backgroundColor: theme.backgroundElement }]}
                  onPress={() => setInventory(prev => prev.filter(i => i !== item))}>
                  <ThemedText type="small">{item} ✕</ThemedText>
                </Pressable>
              ))}
            </View>
          )}
        </Field>

        <ThemedText type="small" themeColor="textSecondary" style={styles.locationNote}>
          📍 Your current location will be used for the map pin.
        </ThemedText>

        <Pressable style={[styles.btn, { backgroundColor: theme.brand }]} onPress={handleSubmit} disabled={submitting}>
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <ThemedText type="smallBold" style={{ color: '#fff' }}>Submit Business</ThemedText>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: Spacing.one }}>
      <ThemedText type="small" style={{ fontSize: 11, opacity: 0.6, letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  gateText: { textAlign: 'center' },
  scroll: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: 100,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  title: { marginBottom: Spacing.two },
  input: { borderRadius: Spacing.two, padding: Spacing.two, fontSize: 16 },
  half: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { borderRadius: Spacing.five, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  btn: {
    borderRadius: 10,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    alignItems: 'center',
    alignSelf: 'stretch',
    minHeight: 48,
    justifyContent: 'center',
  },
  locationNote: { textAlign: 'center', paddingHorizontal: Spacing.four },
});
