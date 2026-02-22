import OnboardingModal from '@/components/OnboardingModal'; // Ensure this exists in your components folder
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const TIERS = [
  {
    id: 'starter',
    title: 'STARTER',
    price: '$9.99',
    features: ['Personalized 4-week training plan'],
    isPopular: false
  },
  {
    id: 'amateur',
    title: 'AMATEUR',
    price: '$19.99',
    features: ['Personalized 4-week training plan', 'Detailed video form analysis'],
    isPopular: true
  },
  {
    id: 'pro',
    title: 'PRO',
    price: '$34.99',
    features: ['Personalized 4-week training plan', 'Detailed video form analysis', '1-on-1 onboarding consultation'],
    isPopular: false
  }
];

export default function ProgramsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Training Plans</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* INTRO MESSAGE */}
        <View style={styles.introSection}>
          <Text style={styles.mainTitle}>Pick Your Performance Tier</Text>
          <Text style={styles.introSub}>
            With this purchase, you’ll receive a 4-week customized training plan tailored to your responses from the previous form.
          </Text>
        </View>

        {/* PERFORMANCE TIERS */}
        {TIERS.map((tier) => (
          <View key={tier.id} style={styles.tierCard}>
            {tier.isPopular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>Most Popular</Text>
              </View>
            )}

            <Text style={styles.tierTitle}>{tier.title}</Text>

            <View style={styles.priceBar}>
              <Text style={styles.priceText}>{tier.price}</Text>
            </View>

            <View style={styles.featuresSection}>
              {tier.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#c62828" style={{ marginRight: 10 }} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.selectBtn} activeOpacity={0.8}>
              <Text style={styles.selectBtnText}>Select Plan</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* --- BOOK ONBOARDING CALL BUTTON --- */}
        <TouchableOpacity 
          style={styles.onboardingButton} 
          onPress={() => setIsModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.buttonIconCircle}>
            <Ionicons name="call" size={24} color="#c62828" />
          </View>
          <View style={styles.buttonTextContainer}>
            <Text style={styles.buttonTitle}>Book Onboarding Call</Text>
            <Text style={styles.buttonSubtitle}>Schedule your 1-on-1 session</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FFF" />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ONBOARDING MODAL COMPONENT */}
      <OnboardingModal 
        isVisible={isModalVisible} 
        onClose={() => setIsModalVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#E5E5E7'
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#000' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  scrollContent: { padding: 20 },
  introSection: { marginBottom: 25, paddingHorizontal: 5 },
  mainTitle: { fontSize: 24, fontWeight: '900', color: '#000', marginBottom: 8 },
  introSub: { fontSize: 14, color: '#666', fontWeight: '600', lineHeight: 20 },

  tierCard: {
    backgroundColor: '#FFF', borderRadius: 20, marginBottom: 20,
    paddingTop: 30, paddingBottom: 20, paddingHorizontal: 20,
    position: 'relative', overflow: 'hidden', borderWidth: 1, borderColor: '#E5E5E7',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2
  },
  popularBadge: {
    position: 'absolute', top: 12, right: 15, backgroundColor: '#000',
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, zIndex: 10
  },
  popularBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  tierTitle: { fontSize: 22, fontWeight: '900', color: '#000', textAlign: 'center', marginBottom: 15, letterSpacing: 1 },
  priceBar: {
    backgroundColor: '#c62828', marginHorizontal: -20, paddingVertical: 12,
    alignItems: 'center', marginBottom: 20
  },
  priceText: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  featuresSection: { marginBottom: 20, paddingHorizontal: 5 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  featureText: { color: '#333', fontSize: 15, fontWeight: '600', flex: 1 },
  selectBtn: { backgroundColor: '#000', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  selectBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  // --- ONBOARDING CALL BUTTON STYLES ---
  onboardingButton: { 
    backgroundColor: '#c62828', 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    borderRadius: 25, 
    elevation: 5,
    marginTop: 10,
    shadowColor: '#c62828',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  buttonIconCircle: { width: 45, height: 45, backgroundColor: '#FFF', borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  buttonTextContainer: { flex: 1, marginLeft: 15 },
  buttonTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  buttonSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
});