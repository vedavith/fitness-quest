import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EXERCISES, MEALS, WORKOUTS, dinnerFor, planPosition, stepTargetForWeek } from './src/plan';

// Placeholder until onboarding (US-102) stores a real start date.
const PLAN_START = new Date();

// US-103: Today screen — everything due today in one place.
export default function App() {
  const { day, week, weekday } = planPosition(PLAN_START, new Date());
  const workout = WORKOUTS[weekday];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.kicker}>Day {day} of 90 · Week {week}</Text>
        <Text style={styles.title}>Today's quest</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Workout · {workout.title}</Text>
          {workout.exercises.length === 0 ? (
            <Text style={styles.item}>Rest day — check in to earn 40 XP</Text>
          ) : (
            workout.exercises.map((id) => (
              <Text key={id} style={styles.item}>• {EXERCISES[id].name}</Text>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Steps</Text>
          <Text style={styles.item}>Target: {stepTargetForWeek(week).toLocaleString()}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Meals</Text>
          {MEALS.map((m) => (
            <Text key={m.time} style={styles.item}>
              {m.time} — {m.name === 'Dinner' ? `Dinner: ${dinnerFor(weekday)}` : m.name}
            </Text>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sleep</Text>
          <Text style={styles.item}>Log at least 7 hours for 15 XP</Text>
        </View>
      </ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f7f9' },
  container: { padding: 16, gap: 12 },
  kicker: { color: '#5b6472', fontSize: 14 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 4 },
  cardTitle: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  item: { fontSize: 15, color: '#1f2933' },
});
