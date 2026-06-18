import { router } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setOnboardingCompleted } from '../../utils/storage';
import { supabase } from '../../utils/supabase';
import { useState } from 'react';

export default function WelcomeScreen() {
  const [loading, setLoading] = useState(false);

  const handleGetStarted = async () => {
    setLoading(true);
    console.log('Get Started clicked - creating user and profile');

    try {
      // Create account with auto-generated credentials
      // Session is automatically persisted by Supabase in AsyncStorage
      // Using different domains to avoid rate limits during testing
      const domains = ['enola.app', 'test.local', 'demo.app', 'temp.dev'];
      const randomDomain = domains[Math.floor(Math.random() * domains.length)];
      const tempEmail = `user_${Date.now()}_${Math.random().toString(36).substring(7)}@${randomDomain}`;
      const tempPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: tempEmail,
        password: tempPassword,
        options: {
          emailRedirectTo: undefined,
          data: {
            skip_confirmation: true
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        Alert.alert('Error', 'Failed to create account. Please try again.');
        setLoading(false);
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        Alert.alert('Error', 'Failed to create account. Please try again.');
        setLoading(false);
        return;
      }

      console.log('User account created:', userId);
      console.log('Session will be automatically restored on app restart');

      // Create profile using RPC function
      const { data: profileResult, error: profileError } = await supabase
        .rpc('create_user_profile', {
          user_id: userId,
          user_email: tempEmail,
          referral_code_used: null
        });

      if (profileError) {
        console.error('Profile creation error via RPC:', profileError);
        Alert.alert('Error', 'Failed to set up account. Please try again.');
        setLoading(false);
        return;
      }

      console.log('Profile created:', profileResult);

      // Mark onboarding complete in database and navigate
      await setOnboardingCompleted(userId);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>Enola</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.starsContainer}>
          <Text style={styles.star}>⭐</Text>
          <Text style={styles.star}>⭐</Text>
          <Text style={styles.star}>⭐</Text>
          <Text style={styles.star}>⭐</Text>
          <Text style={styles.star}>⭐</Text>
        </View>

        <Text style={styles.title}>Help us Grow</Text>
        <Text style={styles.subtitle}>A quick rating helps us reach more people.</Text>

        <View style={styles.testimonialCard}>
          <Text style={styles.testimonial}>
            "finally found the information I needed. this app is amazing"
          </Text>
          <Text style={styles.author}>— Sarah M.</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={styles.dot} />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleGetStarted}
          activeOpacity={0.7}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Get Started</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    padding: 8,
  },
  backButtonText: {
    fontSize: 28,
    color: '#007AFF',
    fontWeight: '300',
  },
  logo: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 28,
  },
  star: {
    fontSize: 36,
    marginHorizontal: 3,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 10,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 17,
    color: '#8E8E93',
    marginBottom: 36,
    fontWeight: '400',
    letterSpacing: -0.4,
  },
  testimonialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  testimonial: {
    fontSize: 17,
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
    letterSpacing: -0.4,
    fontWeight: '400',
  },
  author: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingBottom: 40,
    backgroundColor: '#FAFAFA',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 6,
  },
  dot: {
    width: 24,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#1C1C1E',
  },
  dotInactive: {
    backgroundColor: '#D1D1D6',
  },
  button: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#8E8E93',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
});
