import { useState } from 'react';
import { Text } from 'react-native';
import { Button, Card, Field, Notice, Screen, styles } from '../components/ui';
import { weekFor } from '../plan';
import { useStore } from '../store';

// US-601 weekly weigh-in, US-602 waist check every 2 weeks. XP for logging, whatever the result.
export default function CheckInScreen() {
  const { todayPlanDay, checkIns, addCheckIn } = useStore();
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const running = todayPlanDay >= 1 && todayPlanDay <= 90;
  const week = weekFor(Math.max(1, todayPlanDay));
  const fortnight = Math.floor((week - 1) / 2) + 1;
  const weightDone = checkIns.find((c) => c.type === 'weight' && c.period === week);
  const waistDone = checkIns.find((c) => c.type === 'waist' && c.period === fortnight);

  const save = (type: 'weight' | 'waist', raw: string) => {
    const value = Number(raw.replace(',', '.'));
    if (!(value > 10 && value < 300)) {
      setMessage('Enter a realistic number.');
      return;
    }
    const already = type === 'weight' ? weightDone : waistDone;
    const c = addCheckIn(type, value);
    setMessage(already ? 'Updated. XP was already awarded for this check-in.' : `Logged. +${c.xp} XP`);
    if (type === 'weight') setWeight('');
    else setWaist('');
  };

  return (
    <Screen>
      <Text style={styles.h1}>Check-in</Text>
      {!running ? <Notice tone="warn">Check-ins are available during the 90-day plan.</Notice> : null}
      <Card title={`Weekly weigh-in · week ${week}`}>
        <Text style={styles.small}>
          Best on Sunday morning, using the same conditions each time (after the bathroom, before breakfast, same scale).
        </Text>
        {weightDone ? <Text style={styles.body}>Logged this week: {weightDone.value} kg</Text> : null}
        <Field label="Weight (kg)" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} />
        <Button label={weightDone ? 'Update weight' : 'Log weight · +30 XP'} onPress={() => save('weight', weight)} disabled={!running} />
      </Card>
      <Card title={`Waist check · fortnight ${fortnight}`}>
        <Text style={styles.small}>Every 2 weeks. Measure at the same spot and in the same conditions.</Text>
        {waistDone ? <Text style={styles.body}>Logged this fortnight: {waistDone.value} in</Text> : null}
        <Field label="Waist (inches)" keyboardType="decimal-pad" value={waist} onChangeText={setWaist} />
        <Button label={waistDone ? 'Update waist' : 'Log waist · +20 XP'} onPress={() => save('waist', waist)} disabled={!running} />
      </Card>
      {message ? <Notice>{message}</Notice> : null}
    </Screen>
  );
}
