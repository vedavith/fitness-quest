import { Stack, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { ExerciseImage } from '../../components/ExerciseImage';
import { Card, Screen, styles } from '../../components/ui';
import { EXERCISES, TRAINING_TARGETS, WORKOUTS } from '../../plan';

// US-202: detail view with the exercise image.
export default function ExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exercise = EXERCISES[id];
  if (!exercise) return null;
  const days = Object.entries(WORKOUTS)
    .filter(([, w]) => w.exercises.includes(id))
    .map(([d]) => d);

  return (
    <Screen>
      <Stack.Screen options={{ title: exercise.name }} />
      <View style={{ alignItems: 'center' }}>
        <ExerciseImage id={id} size={260} />
      </View>
      <Card title={exercise.name}>
        <Text style={styles.body}>{exercise.imageShows}.</Text>
        <Text style={styles.small}>Used on: {days.join(', ')}</Text>
      </Card>
      <Card title="Targets">
        <Text style={styles.body}>
          {TRAINING_TARGETS.sets} sets of {TRAINING_TARGETS.reps} reps, {TRAINING_TARGETS.restSeconds[0]}–
          {TRAINING_TARGETS.restSeconds[1]} seconds rest. {TRAINING_TARGETS.note}.
        </Text>
      </Card>
    </Screen>
  );
}
