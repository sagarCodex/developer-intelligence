import { View, Text } from 'react-native';

export default function NotesScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A', padding: 20 }}>
      <Text style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 'bold', color: '#E0E0E0' }}>
        Notes
      </Text>
      <Text style={{ fontSize: 14, color: '#888888', marginTop: 8 }}>
        Your notes will appear here.
      </Text>
    </View>
  );
}
