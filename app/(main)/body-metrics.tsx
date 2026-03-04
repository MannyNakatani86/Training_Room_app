import { auth, db } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
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
  const { headerHeight, unit } = useUser(); // Global unit (kg or lbs)

  const [weight, setWeight] = useState('');
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');
  const [loading, setLoading] = useState(true);

  // We use a ref to prevent the conversion logic from running on the very first render
  const isFirstRender = useRef(true);
  const [currentUnitInInput, setCurrentUnitInInput] = useState(unit);

  useEffect(() => {
    const fetchCurrent = async () => {
      const user = auth.currentUser;
      if (user) {
        const snap = await getDoc(doc(db, "customers", user.uid, "health", "metrics"));
        if (snap.exists()) {
          const data = snap.data();
          let dbWeight = data.weight || 0;
          const dbUnit = data.weightUnit; // Get the unit this was saved in

          // CONVERSION ON LOAD:
          // If the unit in the database is different from current settings, convert it immediately
          if (dbUnit && dbUnit !== unit && dbWeight > 0) {
            if (unit === 'lbs') {
              dbWeight = dbWeight * 2.20462;
            } else {
              dbWeight = dbWeight / 2.20462;
            }
          }

          setWeight(dbWeight > 0 ? dbWeight.toFixed(1) : '');
          
          if (data.height) {
            const totalInches = data.height / 2.54;
            const f = Math.floor(totalInches / 12);
            const i = Math.round(totalInches % 12);
            setFeet(f.toString());
            setInches(i.toString());
          }
        }
      }
      setCurrentUnitInInput(unit);
      setLoading(false);
    };
    fetchCurrent();
  }, []);

  // CONVERSION ON TOGGLE:
  // This runs if the user changes the unit settings while the app is running
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!loading && weight) {
      const numericWeight = parseFloat(weight);
      if (!isNaN(numericWeight)) {
        let convertedWeight;
        if (unit === 'lbs') {
          convertedWeight = numericWeight * 2.20462;
        } else {
          convertedWeight = numericWeight / 2.20462;
        }
        setWeight(convertedWeight.toFixed(1));
        setCurrentUnitInInput(unit);
      }
    }
  }, [unit]);

  const saveMetrics = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const totalInches = (parseFloat(feet) * 12) + (parseFloat(inches) || 0);
    const heightInCm = totalInches * 2.54;

    try {
      await setDoc(doc(db, "customers", user.uid, "health", "metrics"), {
        weight: parseFloat(weight) || 0,
        weightUnit: unit, // CRITICAL: Save the unit so we know how to convert it later
        height: heightInCm || 0,
        updatedAt: new Date()
      });
      Alert.alert("Success", "Metrics updated!");
      router.back();
    } catch (e) { 
      Alert.alert("Error", "Could not save."); 
    }
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
        <Text style={styles.label}>Body Weight ({unit})</Text>
        <TextInput 
          style={styles.input} 
          keyboardType="numeric" 
          value={weight} 
          onChangeText={setWeight} 
          placeholder="0.0"
        />

        <Text style={styles.label}>Height</Text>
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.subLabel}>Feet</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={feet} onChangeText={setFeet} placeholder="5" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.subLabel}>Inches</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={inches} onChangeText={setInches} placeholder="10" />
          </View>
        </View>

        <TouchableOpacity style={styles.btn} onPress={saveMetrics}>
          <Text style={styles.btnText}>Save Metrics</Text>
        </TouchableOpacity>
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
  content: { padding: 30 },
  label: { fontSize: 12, fontWeight: '800', color: '#888', marginBottom: 8, textTransform: 'uppercase' },
  subLabel: { fontSize: 10, fontWeight: '700', color: '#AAA', marginBottom: 4 },
  row: { flexDirection: 'row', marginBottom: 5 },
  input: { 
    backgroundColor: '#FFF', 
    padding: 18, 
    borderRadius: 15, 
    marginBottom: 25, 
    fontSize: 18, 
    fontWeight: '700', 
    borderWidth: 1, 
    borderColor: '#EEE' 
  },
  btn: { backgroundColor: '#c62828', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' }
});