import { router, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { Button, Card, Notice, Screen, styles } from '../components/ui';
import { useStore } from '../store';

const WARNING_SIGNS = ['Chest pain', 'Fainting', 'Severe dizziness', 'Unusual breathlessness', 'Sharp joint pain'];

// US-701 Stop Exercise, US-705 health guidance.
export default function Safety() {
  const params = useLocalSearchParams<{ day?: string }>();
  const { todayPlanDay, day, updateDay } = useStore();
  const planDay = Number(params.day ?? todayPlanDay);
  const stopped = planDay >= 1 && day(planDay).stopped_for_safety;

  return (
    <Screen>
      <Text style={styles.h1}>Safety</Text>
      <Card title="Stop exercising if you have">
        {WARNING_SIGNS.map((s) => (
          <Text key={s} style={styles.body}>• {s}</Text>
        ))}
        <Text style={styles.body}>Stop now and seek medical advice. Call emergency services if symptoms are severe.</Text>
        {planDay >= 1 && planDay <= 90 ? (
          stopped ? (
            <Notice>Workout stopped safely. You keep today's 40 workout XP.</Notice>
          ) : (
            <Button
              label="I stopped my workout"
              kind="danger"
              onPress={() => {
                updateDay(planDay, { stopped_for_safety: true });
                router.back();
              }}
            />
          )
        ) : null}
      </Card>

      <Card title="About this plan">
        <Text style={styles.body}>
          This is a general template, not medical advice, and results are not guaranteed. Confirm your targets with a
          doctor or registered dietitian.
        </Text>
        <Text style={styles.body}>
          Avoid dehydration, starvation diets, unprescribed medication and excessive exercise. The app never rewards
          extra sessions, skipped meals or faster weight loss.
        </Text>
      </Card>
    </Screen>
  );
}
