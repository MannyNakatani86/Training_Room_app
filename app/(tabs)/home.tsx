import BottomTab from '@/components/bottom_tab';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

export default function Home() {
  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <Text style={styles.header}>Training</Text>

        {/* Today's Workout */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Workout</Text>
          <Text style={styles.cardText}>• Warm Up</Text>
          <Text style={styles.cardText}>• Squats — 3x10 @ 70%</Text>
          <Text style={styles.cardText}>• Bench Press — 3x8 @ 65%</Text>
          <Text style={styles.cardText}>• HIIT Finisher</Text>
          <Pressable style={styles.cardButton}>
            <Text style={styles.cardButtonText}>Start Workout</Text>
          </Pressable>
        </View>

        {/* Calendar */}
        <Text style={styles.sectionTitle}>Workout Calendar</Text>
        <View style={styles.calendarContainer}>
          <Calendar
            // Initially visible month
            current={new Date().toISOString().split('T')[0]}
            // Highlight today
            markingType={'simple' as any}
            markedDates={{
              [new Date().toISOString().split('T')[0]]: { selected: true, selectedColor: '#FF2D2D' },
            }}
            theme={{
              backgroundColor: '#000',
              calendarBackground: '#1c1919',
              textSectionTitleColor: '#fff',
              dayTextColor: '#fff',
              todayTextColor: '#FF2D2D',
              monthTextColor: '#fff',
              arrowColor: '#FF2D2D',
            }}
          />
        </View>
      </ScrollView>

      {/* Bottom Tab */}
      <BottomTab />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { fontSize: 32, fontWeight: '700', color: '#fff', marginBottom: 20, marginTop: 40, paddingHorizontal: 20 },
  card: { backgroundColor: '#1A1A1A', borderRadius: 15, padding: 20, marginHorizontal: 20, marginBottom: 30 },
  cardTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 10 },
  cardText: { fontSize: 16, color: '#ccc', marginBottom: 6 },
  cardButton: { marginTop: 15, alignSelf: 'flex-start', backgroundColor: '#FF2D2D', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25 },
  cardButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sectionTitle: { fontSize: 20, color: '#fff', marginLeft: 20, marginBottom: 10 },
  calendarContainer: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 10,
  },
});
