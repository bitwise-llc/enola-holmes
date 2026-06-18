import { router } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

// Try to import RevenueCat UI - will be undefined in Expo Go
let RevenueCatUI: any;
let PAYWALL_RESULT: any;

try {
  const rcui = require('react-native-purchases-ui');
  RevenueCatUI = rcui.RevenueCatUI;
  PAYWALL_RESULT = rcui.PAYWALL_RESULT;
} catch (e) {
  console.log('RevenueCat UI not available - running in Expo Go');
}

export default function PaywallScreen() {
  const [isNativeAvailable, setIsNativeAvailable] = useState(false);

  useEffect(() => {
    // Check if RevenueCat UI is available (development build)
    setIsNativeAvailable(!!RevenueCatUI);
  }, []);

  const handleContinue = () => {
    router.push('/onboarding/welcome');
  };

  const handlePurchaseResult = async (result: any) => {
    console.log('Paywall result:', result);

    switch (result) {
      case PAYWALL_RESULT?.PURCHASED:
      case PAYWALL_RESULT?.RESTORED:
        console.log('✅ User purchased or restored subscription');
        router.push('/onboarding/welcome');
        break;
      case PAYWALL_RESULT?.CANCELLED:
        console.log('❌ User cancelled paywall');
        router.push('/onboarding/welcome');
        break;
      default:
        router.push('/onboarding/welcome');
        break;
    }
  };

  // Show native RevenueCat paywall if available
  if (isNativeAvailable && RevenueCatUI) {
    return (
      <SafeAreaView style={styles.container}>
        <RevenueCatUI.Paywall
          options={{
            shouldBlockTouchesUnderPaywall: true,
          }}
          onPurchaseCompleted={handlePurchaseResult}
          onPurchaseCancelled={handlePurchaseResult}
          onRestoreCompleted={handlePurchaseResult}
          onDismiss={() => {
            console.log('Paywall dismissed');
            router.push('/onboarding/welcome');
          }}
        />
      </SafeAreaView>
    );
  }

  // Fallback UI for Expo Go
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.fallbackContent}>
        <Text style={styles.title}>Enola Pro</Text>
        <Text style={styles.message}>
          In-app purchases require a development build with expo-dev-client.
        </Text>
        <Text style={styles.message}>
          Build the app to see the beautiful RevenueCat paywall!
        </Text>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue with Free</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  fallbackContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 24,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  continueButton: {
    marginTop: 32,
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
