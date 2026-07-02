import { router } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import type { PurchasesPackage } from 'react-native-purchases';
import { getSubscriptionOfferings, purchasePackage } from '@/utils/revenuecat';

// Custom themed subscription cards (monthly + yearly), matched to the RC `default`
// offering package identifiers. Replaces the RC native paywall so onboarding shows
// consistent, themeable cards.
const SUB_CARDS = [
  {
    id: '$rc_monthly',
    title: 'Monthly',
    coinsPerPeriod: 15,
    period: 'month',
    fallbackPrice: '$9.99',
    perks: ['15 coins every month', 'Coins for face scans', 'Cancel anytime'],
  },
  {
    id: '$rc_annual',
    title: 'Yearly',
    coinsPerPeriod: 120,
    period: 'year',
    fallbackPrice: '$89.00',
    badge: 'BEST VALUE',
    perks: ['120 coins every year', 'Best value per coin', 'Cancel anytime'],
  },
];

export default function PaywallScreen() {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const offering = await getSubscriptionOfferings();
      setPackages(offering?.availablePackages ?? []);
    })();
  }, []);

  const subscribe = async (pkg: PurchasesPackage) => {
    setBuyingId(pkg.identifier);
    try {
      const result = await purchasePackage(pkg);
      if (result) {
        // Entitlement/coins are handled server-side; move on into the app.
        router.replace('/onboarding/welcome');
      }
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Enola Pro</Text>
        <Text style={styles.subtitle}>Unlock coins and keep scanning</Text>

        {SUB_CARDS.map((card) => {
          const pkg = packages.find((p) => p.identifier === card.id);
          const busy = buyingId === card.id;
          return (
            <View key={card.id} style={styles.card}>
              {card.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{card.badge}</Text>
                </View>
              )}
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardCoins}>{card.coinsPerPeriod} coins / {card.period}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{pkg?.product.priceString ?? card.fallbackPrice}</Text>
                <Text style={styles.period}> / {card.period}</Text>
              </View>
              <TouchableOpacity
                style={styles.button}
                disabled={!!buyingId}
                onPress={() => {
                  if (pkg) subscribe(pkg);
                  else Alert.alert('Unavailable', 'Subscriptions are not available right now. Please try again later.');
                }}
              >
                {busy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Get {card.title}</Text>
                )}
              </TouchableOpacity>
              {card.perks.map((perk) => (
                <View key={perk} style={styles.perkRow}>
                  <Text style={styles.perkCheck}>✓</Text>
                  <Text style={styles.perkText}>{perk}</Text>
                </View>
              ))}
            </View>
          );
        })}

        <TouchableOpacity style={styles.freeButton} onPress={() => router.push('/onboarding/welcome')}>
          <Text style={styles.freeButtonText}>Continue with Free</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { paddingHorizontal: 20, paddingVertical: 24, gap: 16 },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  cardTitle: { fontSize: 26, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.6 },
  cardCoins: { fontSize: 15, color: '#8E8E93', marginTop: 2, marginBottom: 16, fontWeight: '500' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  price: { fontSize: 34, fontWeight: '700', color: '#1C1C1E', letterSpacing: -1 },
  period: { fontSize: 16, color: '#8E8E93', fontWeight: '500' },
  button: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 18,
  },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600', letterSpacing: -0.3 },
  perkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  perkCheck: { fontSize: 16, color: '#34C759', marginRight: 10, fontWeight: '700' },
  perkText: { fontSize: 15, color: '#3C3C43', fontWeight: '400', letterSpacing: -0.3 },
  freeButton: { paddingVertical: 16, alignItems: 'center' },
  freeButtonText: { fontSize: 16, color: '#8E8E93', fontWeight: '600' },
});
