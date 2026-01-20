import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function WorkoutsScreen() {
  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContent} 
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Workouts</Text>
        <Text style={styles.subtitle}>Start your training session here.</Text>
        
        {/* You can start adding your new content below this line */}
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Content coming soon...</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 40,
  },
  container: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  placeholder: {
    flex: 1,
    marginTop: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 20,
    height: 200,
  },
  placeholderText: {
    color: '#AAA',
    fontSize: 14,
  },
});