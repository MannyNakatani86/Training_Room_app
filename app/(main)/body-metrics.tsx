import { auth, db } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet, Text,
  TextInput, TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from './_layout';

export default function BodyMetricsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [loading, setLoading] = useState(true);
  const {headerHeight} = useUser();

  useEffect(() => {
    const fetchCurrent = async () => {
      const user = auth.currentUser;
      if (user) {
        const snap = await getDoc(doc(db, "customers", user.uid, "health", "metrics"));
        if (snap.exists()) {
          setWeight(snap.data().weight?.toString() || '');
          setHeight(snap.data().height?.toString() || '');
          setBodyFat(snap.data().bodyFat?.toString() || '');
        }
      }
      setLoading(false);
    };
    fetchCurrent();
  }, []);

  const saveMetrics = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(doc(db, "customers", user.uid, "health", "metrics"), {
        weight: parseFloat(weight) || 0,
        height: parseFloat(height) || 0,
        bodyFat: parseFloat(bodyFat) || 0,
        updatedAt: new Date()
      });
      Alert.alert("Success", "Metrics updated!");
      router.back();
    } catch (e) { Alert.alert("Error", "Could not save."); }
  };

  if (loading) return <View style={{flex:1, justifyContent:'center'}}><ActivityIndicator color="#c62828"/></View>;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { height: headerHeight, paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Metrics</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>Body Weight (kg)</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={weight} onChangeText={setWeight} placeholder="0.0"/>
        <Text style={styles.label}>Height (cm)</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={height} onChangeText={setHeight} placeholder="0"/>
        <TouchableOpacity style={styles.btn} onPress={saveMetrics}><Text style={styles.btnText}>Save Metrics</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#000', textAlign: 'center' },
  title: { fontSize: 18, fontWeight: '800' },
  content: { padding: 30 },
  label: { fontSize: 12, fontWeight: '800', color: '#888', marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: '#FFF', padding: 18, borderRadius: 15, marginBottom: 25, fontSize: 18, fontWeight: '700', borderWidth: 1, borderColor: '#EEE' },
  btn: { backgroundColor: '#c62828', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    backBtn: { 
    width: 40, 
    height: 40, 
    justifyContent: 'center',
    alignItems: 'flex-start' 
  }
});