import { auth } from '@/fireBaseConfig'; // Adjust dots if your config is elsewhere
import { signOut } from 'firebase/auth';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  
  const handleLogout = () => {
    signOut(auth).catch(error => console.log("Error signing out: ", error));
  };

  return (
    <View style={styles.container}>
      {/* THE BACKGROUND/CENTERED TEXT */}
      <View style={styles.centerContent}>
        <Text style={styles.title}>HOME SCREEN</Text>
        <Text style={styles.subtitle}>You are successfully logged in.</Text>
      </View>

      {/* OPTIONAL: SIGN OUT BUTTON TO TEST THE LOOP */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // Light grey background
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  logoutButton: {
    position: 'absolute',
    bottom: 50,
    padding: 15,
  },
  logoutText: {
    color: '#FF3B30', // iOS Red
    fontWeight: '600',
    fontSize: 16,
  },
});