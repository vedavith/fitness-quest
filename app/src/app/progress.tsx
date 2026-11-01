import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Card, ProgressBar, Screen, styles } from '../components/ui';
import { WORKOUTS, weekdayFor } from '../plan';
import { useStore } from '../store';
import { colors, space } from '../theme';

// US-603: 12-week tracker. Distance to goals with no predicted finish date.
export default function Progress() {
  const { profile, days, checkIns, dayXp } = useStore();
  if (!profile) return null;

  const latestWeight = [...checkIns].filter((c) => c.type === 'weight').sort((a, b) => b.period - a.period)[0]?.value
    ?? profile.start_weight_kg;

  const weeks = Array.from({ length: 12 }, (_, i) => {
    const week = i + 1;
    let steps = 0;
    let loggedDays = 0;
    let workouts = 0;
    for (let d = (week - 1) * 7 + 1; d <= week * 7; d++) {
      const log = days[d];
      if (!log) continue;
      loggedDays++;
      steps += log.steps;
      const kind = WORKOUTS[weekdayFor(profile.start_date, d)].kind;
      if (kind !== 'rest' && dayXp(d).workout === 40) workouts++;
    }
    return {
      week,
      weight: checkIns.find((c) => c.type === 'weight' && c.period === week)?.value,
      // Waist is checked once per fortnight; show it on the fortnight's second week.
      waist: week % 2 === 0 ? checkIns.find((c) => c.type === 'waist' && c.period === week / 2)?.value : undefined,
      avgSteps: loggedDays ? Math.round(steps / loggedDays) : null,
      workouts,
    };
  });

  const goal = (target: number) => {
    const total = profile.start_weight_kg - target;
    const done = profile.start_weight_kg - latestWeight;
    return { left: Math.max(0, latestWeight - target), fraction: total > 0 ? done / total : 1 };
  };
  const g1 = goal(profile.goal_weight_kg);
  const g2 = goal(profile.long_goal_weight_kg);

  const cell = { flex: 1, textAlign: 'center' as const };
  return (
    <Screen>
      <Text style={styles.h1}>Progress</Text>
      <Card title="Goals">
        <Text style={styles.body}>
          Latest weight: {latestWeight} kg (started at {profile.start_weight_kg} kg)
        </Text>
        <Text style={styles.small}>First milestone {profile.goal_weight_kg} kg · {g1.left.toFixed(1)} kg to go</Text>
        <ProgressBar value={g1.fraction} color={colors.success} />
        <Text style={styles.small}>Long-term goal {profile.long_goal_weight_kg} kg · {g2.left.toFixed(1)} kg to go</Text>
        <ProgressBar value={g2.fraction} color={colors.success} />
        <Text style={styles.small}>Steady beats fast. There's no deadline on either goal.</Text>
      </Card>

      <Card title="12-week tracker">
        <View style={[styles.row, { gap: space.xs }]}>
          {['Wk', 'Weight', 'Waist', 'Avg steps', 'Workouts'].map((h) => (
            <Text key={h} style={[styles.small, cell, { fontWeight: '700' }]}>{h}</Text>
          ))}
        </View>
        {weeks.map((w) => (
          <View key={w.week} style={[styles.row, { gap: space.xs, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space.xs }]}>
            <Text style={[styles.small, cell]}>{w.week}</Text>
            <Text style={[styles.small, cell]}>{w.weight ?? '–'}</Text>
            <Text style={[styles.small, cell]}>{w.waist ?? '–'}</Text>
            <Text style={[styles.small, cell]}>{w.avgSteps?.toLocaleString() ?? '–'}</Text>
            <Text style={[styles.small, cell]}>{w.workouts}/6</Text>
          </View>
        ))}
      </Card>
      <Button label="Edit starting details" kind="secondary" onPress={() => router.push('/onboarding')} />
    </Screen>
  );
}
