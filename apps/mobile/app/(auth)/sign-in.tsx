import { View, Text, TouchableOpacity } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';

export default function SignInScreen() {
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();

  if (!isLoaded) return null;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#0A0A0A',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <Text
        style={{
          fontFamily: 'monospace',
          fontSize: 24,
          fontWeight: 'bold',
          color: '#E0E0E0',
          marginBottom: 8,
        }}
      >
        Dev<Text style={{ color: '#00E5C8' }}>Intel</Text>
      </Text>
      <Text style={{ fontSize: 14, color: '#888888', marginBottom: 32 }}>
        Sign in to continue
      </Text>

      <TouchableOpacity
        style={{
          backgroundColor: '#00E5C8',
          paddingHorizontal: 32,
          paddingVertical: 14,
          borderRadius: 8,
        }}
        onPress={() => {
          // Clerk OAuth flow will be configured here
        }}
      >
        <Text style={{ fontFamily: 'monospace', fontWeight: '600', color: '#0A0A0A' }}>
          Sign In
        </Text>
      </TouchableOpacity>
    </View>
  );
}
