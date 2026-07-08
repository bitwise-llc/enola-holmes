import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { HapticTouchable } from '@/components/haptic-touchable';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StaggerIn } from '../../components/stagger-in';
import { Pagination } from '../../components/pagination';

export default function StatsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* First screen after onboarding — no back button, and the swipe-back gesture
          is disabled so the user can't return to the intro once they've entered. */}
      <Stack.Screen options={{ gestureEnabled: false }} />
      <View style={styles.header}>
        <Text style={styles.logo}>Enola</Text>
      </View>

      <Pagination step={1} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <StaggerIn>
        <View style={styles.iconsRow}>
          <Ionicons name="search-outline" size={38} color="#1C1C1E" />
          <Ionicons name="images-outline" size={38} color="#1C1C1E" />
          <Ionicons name="globe-outline" size={38} color="#1C1C1E" />
        </View>

        <Text style={styles.mainTitle}>The Power of Image Search</Text>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>100B+</Text>
          <Text style={styles.statDescription}>
            images are indexed across the public web, ready to be matched to a photo.
          </Text>
          <Text style={styles.statSource}>~ Web Data Commons</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>Seconds</Text>
          <Text style={styles.statDescription}>
            to trace where a photo appears online and find visually similar images.
          </Text>
          <Text style={styles.statSource}>~ Enola</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>1 photo</Text>
          <Text style={styles.statDescription}>
            is all it takes to discover an image's source and every page it shows up on.
          </Text>
          <Text style={styles.statSource}>~ Enola</Text>
        </View>
        </StaggerIn>
      </ScrollView>

      <View style={styles.footer}>
        <HapticTouchable
          style={styles.button}
          onPress={() => router.push('/onboarding/privacy')}
        >
          <Text style={styles.buttonText}>Next</Text>
        </HapticTouchable>
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
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  settingsButton: {
    position: 'absolute',
    right: 20,
    fontSize: 20,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 40,
    paddingTop: 20,
    paddingBottom: 140, // clear the absolute footer (pagination + button)
  },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  platformIcon: {
    fontSize: 40,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 32,
    textAlign: 'center',
    letterSpacing: -0.7,
  },
  statCard: {
    marginBottom: 32,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
    letterSpacing: -0.9,
  },
  statDescription: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 24,
    marginBottom: 8,
    fontWeight: '400',
    letterSpacing: -0.3,
  },
  statSource: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '400',
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
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
});
