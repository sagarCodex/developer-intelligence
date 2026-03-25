import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111111',
          borderTopColor: '#262626',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#00E5C8',
        tabBarInactiveTintColor: '#888888',
        tabBarLabelStyle: {
          fontFamily: 'monospace',
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
        }}
      />
      <Tabs.Screen
        name="snippets"
        options={{
          title: 'Snippets',
        }}
      />
      <Tabs.Screen
        name="focus"
        options={{
          title: 'Focus',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
