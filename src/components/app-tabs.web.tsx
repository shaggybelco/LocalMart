import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
} from 'expo-router/ui';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, useWindowDimensions, View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppTheme } from '@/context/app-theme';

const BOTTOM_BAR_HEIGHT = 64;
const TOP_BAR_HEIGHT = 56;

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; href: string; icon: IoniconsName; iconActive: IoniconsName; label: string }[] = [
  { name: 'home',     href: '/',         icon: 'home-outline',       iconActive: 'home',       label: 'Home'     },
  { name: 'register', href: '/register', icon: 'storefront-outline', iconActive: 'storefront', label: 'Register' },
  { name: 'saved',    href: '/saved',    icon: 'heart-outline',      iconActive: 'heart',      label: 'Saved'    },
];

export default function AppTabs() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const tabTriggers = TABS.map(tab => (
    <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
      <TabItem
        icon={tab.icon}
        iconActive={tab.iconActive}
        label={tab.label}
        isMobile={isMobile}
      />
    </TabTrigger>
  ));

  if (isMobile) {
    return (
      <Tabs style={styles.container}>
        <View style={styles.slotMobile}>
          <TabSlot style={styles.slot} />
        </View>
        <TabList asChild>
          <BottomBar>{tabTriggers}</BottomBar>
        </TabList>
      </Tabs>
    );
  }

  return (
    <Tabs style={styles.container}>
      <TabList asChild>
        <TopBar>{tabTriggers}</TopBar>
      </TabList>
      <TabSlot style={styles.slot} />
    </Tabs>
  );
}

function TopBar({ children, ...props }: any) {
  const theme = useTheme();
  const { resolved, toggle } = useAppTheme();
  return (
    <View
      {...props}
      style={[
        styles.topBarOuter,
        { backgroundColor: theme.background, borderBottomColor: theme.border },
      ]}>
      <View style={styles.topBarInner}>
        <ThemedText type="smallBold" style={[styles.brand, { color: theme.brand }]}>
          LocalMart
        </ThemedText>
        <View style={styles.topTabs}>{children}</View>
        <Pressable
          onPress={toggle}
          style={[styles.themeToggle, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons
            name={resolved === 'dark' ? 'sunny-outline' : 'moon-outline'}
            size={17}
            color={theme.textSecondary}
          />
        </Pressable>
      </View>
    </View>
  );
}

function BottomBar({ children, ...props }: any) {
  const theme = useTheme();
  return (
    <View
      {...props}
      style={[
        styles.bottomBar,
        { backgroundColor: theme.background, borderTopColor: theme.border },
      ]}>
      {children}
    </View>
  );
}

export function TabItem({
  icon,
  iconActive,
  label,
  isMobile,
  isFocused,
  ...props
}: TabTriggerSlotProps & {
  icon: IoniconsName;
  iconActive: IoniconsName;
  label: string;
  isMobile: boolean;
}) {
  const theme = useTheme();
  const iconName = isFocused ? iconActive : icon;
  const iconColor = isFocused ? theme.brand : theme.textSecondary;

  if (isMobile) {
    return (
      <Pressable
        {...props}
        style={({ pressed }) => [styles.bottomTab, pressed && styles.pressed]}>
        {isFocused && (
          <View style={[styles.activeDot, { backgroundColor: theme.brand }]} />
        )}
        <Ionicons name={iconName} size={23} color={iconColor} />
        <ThemedText
          style={[
            styles.tabLabel,
            { color: iconColor },
            isFocused && styles.tabLabelActive,
          ]}>
          {label}
        </ThemedText>
      </Pressable>
    );
  }

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [styles.topTab, pressed && styles.pressed]}>
      <View
        style={[
          styles.topTabInner,
          isFocused && { backgroundColor: theme.backgroundElement },
        ]}>
        <Ionicons name={iconName} size={15} color={iconColor} />
        <ThemedText
          type="small"
          style={{
            color: iconColor,
            fontWeight: isFocused ? '700' : '500',
            fontSize: 13,
          }}>
          {label}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slot: { flex: 1 },
  slotMobile: { flex: 1, paddingBottom: BOTTOM_BAR_HEIGHT },

  topBarOuter: {
    height: TOP_BAR_HEIGHT,
    borderBottomWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  topBarInner: {
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  brand: { marginRight: 'auto', fontSize: 15, letterSpacing: 0.3 },
  topTabs: { flexDirection: 'row', gap: 2 },
  topTab: {},
  topTabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: Spacing.two,
    borderRadius: 8,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_BAR_HEIGHT,
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    position: 'relative',
    paddingTop: 4,
  },
  tabLabel: { fontSize: 10, letterSpacing: 0.2 },
  tabLabelActive: { fontWeight: '700' },
  activeDot: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 3,
    borderRadius: 2,
  },

  pressed: { opacity: 0.65 },
  themeToggle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.one,
  },
});
