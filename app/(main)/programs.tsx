import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const TIERS = [
  {
    id: 'starter',
    title: 'Starter',
    term: 'one-time purchase',
    description: 'Perfect for those getting started with personalized programming.',
    features: ['Personalized 4-week training plan'],
    color: '#000000',
    isPopular: false,
    url: 'https://yourwebsite.com/buy-starter'
  },
  {
    id: 'amateur',
    title: 'Amateur',
    term: 'one-time purchase',
    description: 'Our most popular choice for dedicated lifters.',
    features: [
      'Personalized 4-week training plan',
      'Detailed video form analysis'
    ],
    color: '#c62828', // Brand Red
    isPopular: true,
    url: 'https://yourwebsite.com/buy-amateur'
  },
  {
    id: 'pro',
    title: 'Pro',
    term: 'one-time purchase',
    description: 'The complete performance package for serious athletes.',
    features: [
      'Personalized 4-week training plan',
      'Detailed video form analysis',
      '1-on-1 onboarding consultation'
    ],
    color: '#000000',
    isPopular: false,
    url: 'https://yourwebsite.com/buy-pro'
  }
];

export default function ProgramsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSelectPlan = async (url: string) => {
    await WebBrowser.openBrowserAsync(url, {
      toolbarColor: '#000000',
      controlsColor: '#c62828',
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plans</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* INTRO TITLE SECTION */}
        <View style={styles.introSection}>
          <Text style={styles.mainTitle}>Pick your performance tier</Text>
          <Text style={styles.introSub}>
            With this purchase, you’ll receive a 4-week customized training plan tailored to your responses from the previous form.
          </Text>
        </View>

        {/* PLAN CARDS */}
        {TIERS.map((tier) => (
          <View key={tier.id} style={styles.planCard}>
            <View style={[styles.cardHeader, { backgroundColor: tier.color }]}>
              {tier.isPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Most Popular</Text>
                </View>
              )}
              <Text style={styles.tierTitle}>{tier.title}</Text>
              <Text style={styles.tierTerm}>{tier.term}</Text>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.tierDesc}>{tier.description}</Text>
              
              <View style={styles.divider} />

              {/* Feature List */}
              {tier.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons name="checkmark" size={20} color="#000" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}

              <TouchableOpacity 
                style={[styles.getStartedBtn, { backgroundColor: tier.color === '#000000' ? '#c62828' : '#000' }]}
                onPress={() => handleSelectPlan(tier.url)}
              >
                <Text style={styles.getStartedBtnText}>Get {tier.title}</Text>
              </TouchableOpacity>
              
              <Text style={styles.termsSmallPrint}>One-time payment. Terms and conditions apply.</Text>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  
  scrollContent: { paddingBottom: 40 },

  introSection: { padding: 25, alignItems: 'center' },
  mainTitle: { fontSize: 28, fontWeight: '900', color: '#000', textAlign: 'center' },
  introSub: { fontSize: 15, color: '#666', textAlign: 'center', marginTop: 12, lineHeight: 22, fontWeight: '500' },

  planCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardHeader: {
    padding: 25,
    alignItems: 'flex-start',
  },
  popularBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
    marginBottom: 10,
  },
  popularText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  tierTitle: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  tierTerm: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 'bold', textTransform: 'uppercase', marginTop: 2 },

  cardBody: {
    padding: 25,
  },
  tierDesc: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 20 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginBottom: 20 },
  
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15 },
  featureText: { fontSize: 15, color: '#000', fontWeight: '500', marginLeft: 15, flex: 1, lineHeight: 20 },

  getStartedBtn: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 15,
  },
  getStartedBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900', textTransform: 'uppercase' },
  termsSmallPrint: { fontSize: 11, color: '#888', textAlign: 'center', fontStyle: 'italic' },
});