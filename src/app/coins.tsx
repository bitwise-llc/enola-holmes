import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PurchasesPackage } from 'react-native-purchases';
import { getCoins, getReferralInfo } from '@/utils/coins';
import { getCoinOfferings, getSubscriptionOfferings, purchasePackage } from '@/utils/revenuecat';

// Coin packs (consumables), matched to RC `coins` offering package identifiers.
const COIN_CARDS = [
  { id: '1Coin', coins: 1, fallbackPrice: '$4.99' },
  { id: '5Coins', coins: 5, fallbackPrice: '$19.99', badge: 'POPULAR' },
  { id: '10Coins', coins: 10, fallbackPrice: '$29.99' },
  { id: '25Coins', coins: 25, fallbackPrice: '$59.99' },
  { id: '50Coins', coins: 50, fallbackPrice: '$99.99', badge: 'BEST VALUE' },
];

// Subscription cards, matched to RC `default` offering package identifiers.
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

export default function CoinsScreen() {
  const [tab, setTab] = useState<'topup' | 'subscription'>('topup');
  const [coins, setCoins] = useState<number | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [subPackages, setSubPackages] = useState<PurchasesPackage[]>([]);
  const [offeringsLoaded, setOfferingsLoaded] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [referral, setReferral] = useState<{ code: string; count: number } | null>(null);

  useEffect(() => {
    getReferralInfo().then(setReferral); // prefetch so /settings renders instantly
    (async () => {
      setCoins(await getCoins());
      const [coinOffering, subOffering] = await Promise.all([
        getCoinOfferings(),
        getSubscriptionOfferings(),
      ]);
      setPackages(coinOffering?.availablePackages ?? []);
      setSubPackages(subOffering?.availablePackages ?? []);
      setOfferingsLoaded(true);
    })();
  }, []);

  const purchaseCoins = async (pkg: PurchasesPackage) => {
    setBuyingId(pkg.identifier);
    try {
      const result = await purchasePackage(pkg);
      if (!result) return; // cancelled or failed (util already logged)

      // Coins are credited server-side by the RevenueCat webhook. Poll the balance
      // until it rises above a FRESH baseline (not stale React state) or we time out.
      const baseline = await getCoins();
      let latest = baseline;
      let credited = false;
      for (let i = 0; i < 8; i++) {
        latest = await getCoins();
        if (latest > baseline) { credited = true; break; }
        await new Promise((r) => setTimeout(r, 1000));
      }
      setCoins(latest);

      if (credited) {
        Alert.alert('Success', `You now have ${latest} coins!`);
      } else {
        // Payment went through but the credit hasn't landed yet (webhook latency/outage).
        // Do NOT claim success with an unchanged balance — tell the truth so the user
        // doesn't re-purchase or think it failed.
        Alert.alert(
          'Purchase received',
          "Your payment went through. Coins can take a moment to appear — pull to refresh, and contact support if they don't arrive shortly.",
        );
      }
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>Enola</Text>
        <View style={styles.coinBadge}>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.coinText}>{coins ?? '–'}</Text>
        </View>
      </View>

      {/* Segmented toggle: Coin Top-Up vs Subscription */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleTab, tab === 'topup' && styles.toggleTabActive]}
          onPress={() => setTab('topup')}
        >
          <Text style={[styles.toggleText, tab === 'topup' && styles.toggleTextActive]}>Coin Top-Up</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleTab, tab === 'subscription' && styles.toggleTabActive]}
          onPress={() => setTab('subscription')}
        >
          <Text style={[styles.toggleText, tab === 'subscription' && styles.toggleTextActive]}>Subscription</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {tab === 'topup' ? (
          <>
            <View style={styles.heroSection}>
              <Text style={styles.coinEmoji}>🪙</Text>
              <Text style={styles.title}>Get More Coins</Text>
              <Text style={styles.subtitle}>1 Coin = 1 Face Scan</Text>
            </View>

            <View style={styles.packagesContainer}>
              {COIN_CARDS.map((card) => {
                const pkg = packages.find((p) => p.identifier === card.id);
                const busy = buyingId === card.id;
                return (
                  <TouchableOpacity
                    key={card.id}
                    style={styles.packageCard}
                    disabled={!!buyingId}
                    onPress={() => {
                      if (pkg) purchaseCoins(pkg);
                      else Alert.alert('Unavailable', 'Coin packs are not available right now. Please try again later.');
                    }}
                  >
                    {card.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{card.badge}</Text>
                      </View>
                    )}
                    <Text style={styles.packageCoins}>{card.coins}</Text>
                    <Text style={styles.packageLabel}>Coin{card.coins > 1 ? 's' : ''}</Text>
                    <View style={styles.packagePrice}>
                      {busy || !offeringsLoaded ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.priceText}>{pkg?.product.priceString ?? card.fallbackPrice}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.inviteButton} onPress={() => router.push({ pathname: '/settings', params: referral ? { code: referral.code, count: String(referral.count) } : {} })}>
              <Text style={styles.inviteButtonText}>Invite Friends & Earn Free Coins</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.subList}>
            {SUB_CARDS.map((card) => {
              const pkg = subPackages.find((p) => p.identifier === card.id);
              const busy = buyingId === card.id;
              return (
                <View key={card.id} style={styles.subCard}>
                  {card.badge && (
                    <View style={styles.subBadge}>
                      <Text style={styles.badgeText}>{card.badge}</Text>
                    </View>
                  )}
                  <Text style={styles.subTitle}>{card.title}</Text>
                  <Text style={styles.subCoins}>{card.coinsPerPeriod} coins / {card.period}</Text>
                  <View style={styles.subPriceRow}>
                    {offeringsLoaded ? (
                      <>
                        <Text style={styles.subPrice}>{pkg?.product.priceString ?? card.fallbackPrice}</Text>
                        <Text style={styles.subPeriod}> / {card.period}</Text>
                      </>
                    ) : (
                      <ActivityIndicator color="#1C1C1E" />
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.subButton}
                    disabled={!!buyingId}
                    onPress={() => {
                      if (pkg) purchaseCoins(pkg);
                      else Alert.alert('Unavailable', 'Subscriptions are not available right now. Please try again later.');
                    }}
                  >
                    {busy ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.subButtonText}>Get {card.title}</Text>
                    )}
                  </TouchableOpacity>

                  {card.perks.map((perk) => (
                    <View key={perk} style={styles.subPerkRow}>
                      <Text style={styles.subPerkCheck}>✓</Text>
                      <Text style={styles.subPerkText}>{perk}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
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
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  coinIcon: {
    fontSize: 16,
  },
  coinText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 4,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  toggleTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: -0.3,
  },
  toggleTextActive: {
    color: '#1C1C1E',
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  coinEmoji: {
    fontSize: 44,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '400',
    letterSpacing: -0.3,
  },
  packagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between',
  },
  packageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  packageCoins: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 2,
    letterSpacing: -1,
  },
  packageLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 8,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  packagePrice: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  inviteButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inviteButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  // Subscription tab
  subList: {
    paddingTop: 8,
    gap: 16,
  },
  subCard: {
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
  subBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  subTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.6,
  },
  subCoins: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 2,
    marginBottom: 16,
    fontWeight: '500',
  },
  subPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  subPrice: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -1,
  },
  subPeriod: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  subButton: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 18,
  },
  subButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  subPerkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  subPerkCheck: {
    fontSize: 16,
    color: '#34C759',
    marginRight: 10,
    fontWeight: '700',
  },
  subPerkText: {
    fontSize: 15,
    color: '#3C3C43',
    fontWeight: '400',
    letterSpacing: -0.3,
  },
});
