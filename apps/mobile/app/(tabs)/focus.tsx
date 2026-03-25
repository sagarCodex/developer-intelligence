import { View, Text } from 'react-native';

export default function FocusScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' }}>
      <Text
        style={{
          fontFamily: 'monospace',
          fontSize: 48,
          fontWeight: 'bold',
          color: '#00E5C8',
        }}
      >
        25:00
      </Text>
      <Text style={{ fontSize: 14, color: '#888888', marginTop: 12 }}>
        Start a focus session
      </Text>
    </View>
  );
}
