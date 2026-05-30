import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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
    return <ThemedView style={styles.centered}><ActivityIndicator /></ThemedView>;
  }

  if (!user) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.gateText}>
          Sign in to see your saved businesses.
        </ThemedText>
        <Pressable
          style={[styles.btn, { backgroundColor: theme.brand }]}
          onPress={() => router.push('/auth/login')}>
          <ThemedText type="smallBold" style={{ color: '#fff' }}>Sign In</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (loading) {
    return <ThemedView style={styles.centered}><ActivityIndicator color={theme.brand} /></ThemedView>;
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle">Saved</ThemedText>
      </View>
      {businesses.length === 0 ? (
        <View style={styles.centered}>
          <ThemedText type="small" themeColor="textSecondary">
            Tap ❤️ on any business to save it here.
          </ThemedText>
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
  gateText: { textAlign: 'center' },
  header: { padding: Spacing.three, paddingTop: Spacing.four },
  list: { padding: Spacing.three },
  columnWrapper: { gap: Spacing.two },
  cardColumn: { flex: 1 },
  btn: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
});
