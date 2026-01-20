import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Calendar } from 'react-native-calendars';

interface OnboardingModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ isVisible, onClose }: OnboardingModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  return (
    <Modal
      animationType="none" // Changed to none for an instant background tint
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      {/* 1. OVERLAY (This tint now appears instantly) */}
      <Pressable style={styles.overlay} onPress={onClose}>
        
        {/* 2. MODAL CARD (Centered instantly) */}
        <Pressable style={styles.modalContainer}>
          
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.titleArea}>
              <Text style={styles.title}>Book Your Call</Text>
              <Text style={styles.subtitle}>Select a date for your session</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#000" />
            </TouchableOpacity>
          </View>

          {/* CALENDAR */}
          <View style={styles.calendarWrapper}>
            <Calendar
              current={today}
              minDate={today}
              onDayPress={day => setSelectedDate(day.dateString)}
              markedDates={{
                [selectedDate]: { 
                  selected: true, 
                  selectedColor: '#c62828' 
                },
              }}
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#b6c1cd',
                selectedDayBackgroundColor: '#c62828',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#c62828',
                dayTextColor: '#2d4150',
                arrowColor: '#c62828',
                textMonthFontWeight: 'bold',
                textDayFontSize: 13,
                textMonthFontSize: 16,
              }}
            />
          </View>

          {/* DATE DISPLAY */}
          <View style={styles.selectionSummary}>
            <Text style={styles.selectionText}>
              Booking for: <Text style={styles.boldText}>{selectedDate}</Text>
            </Text>
          </View>

          {/* FOOTER BUTTON */}
          <TouchableOpacity 
            style={styles.confirmButton} 
            onPress={() => {
              console.log("Confirmed date:", selectedDate);
              onClose();
            }}
          >
            <Text style={styles.confirmButtonText}>Check Availability</Text>
          </TouchableOpacity>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)', // Instant tint
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 20,
    // Shadow to help the card stand out against the tint
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  titleArea: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: '#F2F2F7',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarWrapper: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  selectionSummary: {
    alignItems: 'center',
    marginBottom: 20,
  },
  selectionText: {
    color: '#666',
    fontSize: 14,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#c62828',
  },
  confirmButton: {
    backgroundColor: '#c62828',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});