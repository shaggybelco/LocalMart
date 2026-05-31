import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientHeader } from '@/components/GradientHeader';
import { BusinessCard } from '@/components/BusinessCard';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { useResponsive } from '@/hooks/use-responsive';
import { getSavedBusinesses, Business } from '@/services/businesses';

export default function SavedScreen() {
  const theme = useTheme();
  const { user, loading: authLoading } = useAuth();
  const { numColumns } = useResponsive();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      setLoading(true);
      getSavedBusinesses(user.id).then(data => {
        setBusinesses(data);
        setLoading(false);
      });
    }, [user])
  );

  if (authLoading) {
    return (
      <ThemedView style={styles.container}>
        <GradientHeader title="Saved" subtitle="Businesses you have bookmarked" />
        <View style={styles.centered}><ActivityIndicator color={theme.brand} /></View>
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <GradientHeader title="Saved" subtitle="Businesses you have bookmarked" />
        <View style={styles.centered}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="heart-outline" size={32} color={theme.textSecondary} />
          </View>
          <ThemedText type="smallBold">Sign in to view saved businesses</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
            Create an account to bookmark your favourite local businesses.
          </ThemedText>
          <Pressable
            style={[styles.btn, { backgroundColor: theme.brand }]}
            onPress={() => router.push('/auth/login')}>
            <ThemedText type="smallBold" style={{ color: '#fff' }}>Sign In</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <GradientHeader title="Saved" subtitle="Loading..." />
        <View style={styles.centered}><ActivityIndicator color={theme.brand} /></View>
      </ThemedView>
    );
  }

  const subtitle = businesses.length > 0
    ? `${businesses.length} saved business${businesses.length === 1 ? '' : 'es'}`
    : 'Businesses you have bookmarked';

  return (
    <ThemedView style={styles.container}>
      <GradientHeader title="Saved" subtitle={subtitle} />

      {businesses.length === 0 ? (
        <View style={styles.centered}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="heart-outline" size={32} color={theme.textSecondary} />
          </View>
          <ThemedText type="smallBold">No saved businesses yet</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
            Tap the heart on any business to save it here.
          </ThemedText>
          <Pressable
            style={[styles.btn, { backgroundColor: theme.brand }]}
            onPress={() => router.replace('/')}>
            <Ionicons name="search-outline" size={16} color="#fff" />
            <ThemedText type="smallBold" style={{ color: '#fff' }}>Discover Businesses</ThemedText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          key={numColumns}
          data={businesses}
          keyExtractor={item => item.id}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
          renderItem={({ item }) => (
            <BusinessCard
              business={item}
              style={numColumns > 1 ? styles.cardColumn : undefined}
            />
          )}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: BottomTabInset + Spacing.six, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' },
          ]}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  emptyText: { textAlign: 'center', maxWidth: 260 },
  list: { padding: Spacing.three },
  columnWrapper: { gap: Spacing.two },
  cardColumn: { flex: 1 },
  btn: {
    borderRadius: 10,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    minHeight: 48,
    justifyContent: 'center',
  },
});
