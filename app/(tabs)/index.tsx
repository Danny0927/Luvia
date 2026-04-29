import { Text, View, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Luvia</Text>
      <Text style={styles.subtitle}>Your day, in harmony</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#E6C86E',
  },
  subtitle: {
    fontSize: 16,
    color: '#777',
    marginTop: 10,
  },
});