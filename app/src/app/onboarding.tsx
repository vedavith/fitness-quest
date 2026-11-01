import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Field, Notice, Screen, styles } from '../components/ui';
import { toLocalIso } from '../plan';
import { useStore } from '../store';
import { DEFAULT_PROFILE, type Profile } from '../types';

type Form = Record<keyof Profile, string>;

// US-101: starting details pre-filled and editable. US-102: start date sets day 1.
export default function Onboarding() {
  const { profile, saveProfile } = useStore();
  const initial: Profile = profile ?? { ...DEFAULT_PROFILE, start_date: toLocalIso(new Date()) };
  const [form, setForm] = useState<Form>(
    Object.fromEntries(Object.entries(initial).map(([k, v]) => [k, String(v)])) as Form,
  );
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof Profile) => (text: string) => setForm((f) => ({ ...f, [key]: text }));

  const save = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.start_date) || Number.isNaN(Date.parse(form.start_date))) {
      setError('Enter the start date as YYYY-MM-DD.');
      return;
    }
    const num = (k: keyof Profile) => Number(form[k]);
    const numeric: (keyof Profile)[] = ['start_weight_kg', 'waist_in', 'height_cm', 'age', 'goal_weight_kg', 'long_goal_weight_kg'];
    if (numeric.some((k) => !(num(k) > 0))) {
      setError('All measurements must be positive numbers.');
      return;
    }
    saveProfile({
      start_date: form.start_date,
      start_weight_kg: num('start_weight_kg'),
      waist_in: num('waist_in'),
      height_cm: Math.round(num('height_cm')),
      age: Math.round(num('age')),
      goal_weight_kg: num('goal_weight_kg'),
      long_goal_weight_kg: num('long_goal_weight_kg'),
    });
    router.replace('/');
  };

  return (
    <Screen>
      <Text style={styles.h1}>Your 90-day quest</Text>
      <Text style={styles.body}>Your starting details are filled in from the plan. Change anything that is different.</Text>

      <Card title="Start">
        <Field label="Start date (day 1)" value={form.start_date} onChangeText={set('start_date')} placeholder="YYYY-MM-DD" autoCapitalize="none" />
        <Text style={styles.small}>Workouts follow the weekday; the week number sets your step target.</Text>
      </Card>

      <Card title="Starting details">
        <View style={styles.row}>
          <Field label="Weight (kg)" value={form.start_weight_kg} onChangeText={set('start_weight_kg')} keyboardType="decimal-pad" />
          <Field label="Waist (in)" value={form.waist_in} onChangeText={set('waist_in')} keyboardType="decimal-pad" />
        </View>
        <View style={styles.row}>
          <Field label="Height (cm)" value={form.height_cm} onChangeText={set('height_cm')} keyboardType="number-pad" />
          <Field label="Age" value={form.age} onChangeText={set('age')} keyboardType="number-pad" />
        </View>
      </Card>

      <Card title="Goals">
        <View style={styles.row}>
          <Field label="First milestone (kg)" value={form.goal_weight_kg} onChangeText={set('goal_weight_kg')} keyboardType="decimal-pad" />
          <Field label="Long-term goal (kg)" value={form.long_goal_weight_kg} onChangeText={set('long_goal_weight_kg')} keyboardType="decimal-pad" />
        </View>
        <Text style={styles.small}>Goals have no deadline, and the app never rewards losing weight faster.</Text>
      </Card>

      <Notice tone="warn">
        This is a general template and results are not guaranteed. Confirm your targets with a doctor or registered
        dietitian before you start.
      </Notice>

      {error ? <Notice tone="danger">{error}</Notice> : null}
      <Button label={profile ? 'Save changes' : 'Start my quest'} onPress={save} />
    </Screen>
  );
}
