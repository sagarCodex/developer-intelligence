import { View, Text, ScrollView } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0A0A0A' }}
      contentContainerStyle={{ padding: 20 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#00E5C8',
          }}
        />
        <Text style={{ fontFamily: 'monospace', fontSize: 12, color: '#00E5C8' }}>
          system online
        </Text>
      </View>

      <Text
        style={{
          fontFamily: 'monospace',
          fontSize: 24,
          fontWeight: 'bold',
          color: '#E0E0E0',
          marginBottom: 8,
        }}
      >
        We&apos;re good to go.
      </Text>

      <Text style={{ fontSize: 14, color: '#888888', marginBottom: 32 }}>
        Here&apos;s your overview for today.
      </Text>

      {/* Stat cards placeholder */}
      <View style={{ gap: 12 }}>
        {['Focus Time', 'Tasks Done', 'Streak', 'Projects'].map((label) => (
          <View
            key={label}
            style={{
              backgroundColor: '#111111',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#262626',
              padding: 16,
            }}
          >
            <Text style={{ fontFamily: 'monospace', fontSize: 12, color: '#888888' }}>
              {label}
            </Text>
            <Text
              style={{
                fontFamily: 'monospace',
                fontSize: 28,
                fontWeight: 'bold',
                color: '#E0E0E0',
                marginTop: 4,
              }}
            >
              —
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
