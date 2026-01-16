import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Modal from 'react-native-modal';

export default function Page() {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={require('../../assets/training_room_logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={{ flex: 1 }} />

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <Pressable
          style={styles.button}
          onPress={() => setShowLogin(true)}
        >
          <Text style={styles.buttonText}>Log In</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.signUpButton]}
          onPress={() => setShowSignUp(true)}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </Pressable>
      </View>

      {/* Log In Bottom Sheet */}
      <Modal
        isVisible={showLogin}
        swipeDirection="down"
        onSwipeComplete={() => setShowLogin(false)}
        onBackdropPress={() => setShowLogin(false)}
        style={styles.bottomModal}
      >
        <View style={styles.modalForm}>
          <Text style={styles.modalTitle}>Log In</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
          />

          <Pressable
            style={styles.submitButton}
            onPress={() => {
              setShowLogin(false); // close modal
              router.push('/home'); // navigate to home
            }}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </Pressable>
        </View>
      </Modal>

      {/* Sign Up Bottom Sheet */}
      <Modal
        isVisible={showSignUp}
        swipeDirection="down"
        onSwipeComplete={() => setShowSignUp(false)}
        onBackdropPress={() => setShowSignUp(false)}
        style={styles.bottomModal}
      >
        <View style={styles.modalForm}>
          <Text style={styles.modalTitle}>Sign Up</Text>

          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#888"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
          />

          <Pressable
            style={styles.submitButton}
            onPress={() => {
              setShowSignUp(false); // close modal
              router.push('/home'); // navigate to home
            }}
          >
            <Text style={styles.submitButtonText}>Create Account</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  logo: {
    width: 300,
    height: 300,
    marginTop: 100,
  },
  buttonContainer: {
    width: '60%',
  },
  button: {
    backgroundColor: 'red',
    paddingVertical: 15,
    borderRadius: 30,
    marginBottom: 15,
    alignItems: 'center',
  },
  signUpButton: {
    backgroundColor: 'white',
  },
  buttonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },

  /* Bottom sheet modal */
  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalForm: {
    height: '50%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
    color: 'black',
  },
  submitButton: {
    backgroundColor: 'red',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
