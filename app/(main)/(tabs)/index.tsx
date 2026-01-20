import { auth, db } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

export default function HomeScreen() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [firstName, setFirstName] = useState('Athlete');

  useEffect(() => {
    const fetchName = async () => {
      const user = auth.currentUser;
      if (user) {
        const docSnap = await getDoc(doc(db, "customers", user.uid));
        if (docSnap.exists()) setFirstName(docSnap.data().name.split(' ')[0]);
      }
    };
    fetchName();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.greetingContainer}>
        <Text style={styles.welcomeText}>Hi {firstName},</Text>
        <Text style={styles.subtitleText}>Ready for your next session?Consistency is key.</Text>
      </View>

      <View style={styles.calendarCard}>
        <Calendar
          theme={{ selectedDayBackgroundColor: '#c62828', todayTextColor: '#c62828', arrowColor: '#c62828' }}
          onDayPress={day => setSelectedDate(day.dateString)}
          markedDates={{ [today]: { marked: true, dotColor: '#c62828' }, [selectedDate]: { selected: true, selectedColor: '#c62828' } }}
        />
      </View>

      <TouchableOpacity style={styles.onboardingButton}>
        <View style={styles.buttonIconCircle}><Ionicons name="call" size={20} color="#c62828" /></View>
        <View style={styles.buttonTextContainer}>
          <Text style={styles.buttonTitle}>Book Onboarding Call</Text>
          <Text style={styles.buttonSubtitle}>Schedule your 1-on-1 session</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#FFF" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, paddingTop: 25, paddingBottom: 40 },
  greetingContainer: { alignSelf: 'flex-start', marginBottom: 20 },
  welcomeText: { fontSize: 28, fontWeight: '900' },
  subtitleText: { fontSize: 15, color: '#666', marginTop: 5 },
  calendarCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 10, elevation: 5, marginBottom: 30 },
  onboardingButton: { backgroundColor: '#c62828', flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20 },
  buttonIconCircle: { width: 45, height: 45, backgroundColor: '#FFF', borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  buttonTextContainer: { flex: 1, marginLeft: 15 },
  buttonTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  buttonSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
});