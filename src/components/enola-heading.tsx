import { useState, useEffect, useCallback } from 'react';
import { Text, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { hasProEntitlement, addCustomerInfoUpdateListener, removeCustomerInfoUpdateListener } from '@/utils/revenuecat';

// The app-wide "Enola" heading. For Pro subscribers it becomes "Enola Pro" with a shiny
// gold "Pro" so the premium status reads at a glance. Pass the screen's own logo style so
// each header keeps its size/position; we only add the gold accent for the "Pro" word.
export function EnolaHeading({ style }: { style?: StyleProp<TextStyle> }) {
  const [isPro, setIsPro] = useState(false);

  // Re-check on focus (covers a purchase made on another screen) and stay live via the
  // RevenueCat customer-info listener (covers renewals/restores while this screen is open).
  useFocusEffect(
    useCallback(() => {
      hasProEntitlement().then(setIsPro);
    }, [])
  );
  useEffect(() => {
    const listener = () => hasProEntitlement().then(setIsPro);
    addCustomerInfoUpdateListener(listener);
    return () => removeCustomerInfoUpdateListener(listener);
  }, []);

  return (
    <Text style={style}>
      Enola{isPro ? <Text style={styles.pro}> Pro</Text> : ''}
    </Text>
  );
}

const styles = StyleSheet.create({
  // Shiny gold — a warm metallic tone that reads as premium against the dark heading.
  pro: { color: '#D4A017', fontWeight: '700' },
});
