import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Training Room</Text>
      </View>

      {/* Main content */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Example exercise card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Push-Ups</Text>
          <Text>3 sets x 12 reps</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Squats</Text>
          <Text>3 sets x 15 reps</Text>
        </View>

        {/* Add more cards as needed */}
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Start Workout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 4,          // black border around screen
    borderColor: 'black',
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#1e1e1e', // dark header like TeamBuildr
  },
  headerText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    padding: 15,
    alignItems: 'center',
  },
  card: {
    width: '90%',
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',      // shadow for cards
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,             // for Android shadow
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    width: '90%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
