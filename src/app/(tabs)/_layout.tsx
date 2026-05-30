import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/app-theme';
import { Colors } from '@/constants/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const SCREENS: {
  name: string;
  title: string;
  icon: IoniconsName;
  iconActive: IoniconsName;
}[] = [
  { name: 'index',    title: 'Home',     icon: 'home-outline',       iconActive: 'home'       },
  { name: 'register', title: 'Register', icon: 'storefront-outline', iconActive: 'storefront' },
  { name: 'saved',    title: 'Saved',    icon: 'heart-outline',      iconActive: 'heart'      },
];

export default function TabsLayout() {
  const { resolved } = useAppTheme();
  const colors = Colors[resolved];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontFamily: 'Poppins_500Medium',
          fontSize: 10,
          letterSpacing: 0.2,
        },
      }}>
      {SCREENS.map(s => (
        <Tabs.Screen
          key={s.name}
          name={s.name}
          options={{
            title: s.title,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? s.iconActive : s.icon}
                size={22}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
