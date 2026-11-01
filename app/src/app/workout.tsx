import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { ExerciseImage } from '../components/ExerciseImage';
import { Button, Card, CheckRow, Notice, Screen, styles } from '../components/ui';
import { EXERCISES, SETS_PER_EXERCISE, TRAINING_TARGETS, WORKOUTS, weekFor, weekdayFor } from '../plan';
import { useStore } from '../store';
import { colors, space } from '../theme';
import type { SetLog } from '../types';

const emptySet = (): SetLog => ({ done: false, weight: null, reps: null });

/** Most recent weight logged for an exercise before this day (US-206). */
function previousWeight(days: Record<number, { sets: Record<string, SetLog[]> | null }>, id: string, before: number) {
  for (let d = before - 1; d >= 1; d--) {
    const w = days[d]?.sets?.[id]?.filter((s) => s.done && s.weight != null).map((s) => s.weight!);
    if (w?.length) return Math.max(...w);
  }
  return null;
}

// US-205/206/207/208/209: the gym session.
export default function Workout() {
  const params = useLocalSearchParams<{ day: string }>();
  const { profile, todayPlanDay, day, days, updateDay } = useStore();
  const planDay = Number(params.day ?? todayPlanDay);
  const [restLeft, setRestLeft] = useState<number | null>(null);
  const [restLength, setRestLength] = useState(90);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  if (!profile) return null;
  const log = day(planDay);
  const weekday = weekdayFor(profile.start_date, planDay);
  const workout = WORKOUTS[weekday];
  const finished = !!log.finished_at;

  const startRest = () => {
    if (timer.current) clearInterval(timer.current);
    setRestLeft(restLength);
    timer.current = setInterval(() => {
      setRestLeft((left) => {
        if (left == null || left <= 1) {
          if (timer.current) clearInterval(timer.current);
          return 0; // 0 = rest over
        }
        return left - 1;
      });
    }, 1000);
  };

  const setsFor = (id: string): SetLog[] => {
    const sets = log.sets?.[id] ?? [];
    return Array.from({ length: SETS_PER_EXERCISE }, (_, i) => sets[i] ?? emptySet());
  };

  const updateSet = (id: string, index: number, patch: Partial<SetLog>) => {
    const sets = setsFor(id).map((s, i) => (i === index ? { ...s, ...patch } : s));
    updateDay(planDay, { sets: { ...(log.sets ?? {}), [id]: sets } });
    if (patch.done) startRest();
  };

  if (workout.kind !== 'strength') {
    return (
      <Screen>
        <Text style={styles.h1}>{workout.title}</Text>
        {workout.exercises.map((id) => (
          <Card key={id}>
            <View style={styles.row}>
              <ExerciseImage id={id} size={72} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{EXERCISES[id].name}</Text>
                <Text style={styles.small}>{EXERCISES[id].imageShows}</Text>
              </View>
            </View>
          </Card>
        ))}
        <Notice>
          {workout.kind === 'recovery'
            ? 'Keep it easy: comfortable walking and gentle mobility.'
            : 'Choose swimming or comfortable walking. Do not push through fatigue.'}
        </Notice>
        <CheckRow
          label="I completed today's session"
          checked={log.workout_done}
          onToggle={() => updateDay(planDay, { workout_done: !log.workout_done })}
          disabled={finished}
        />
        <Button label="Done" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.h1}>{workout.title}</Text>
      <Card title="Today's targets">
        <Text style={styles.body}>
          Warm up {TRAINING_TARGETS.warmUp} · {TRAINING_TARGETS.sets} sets of {TRAINING_TARGETS.reps} reps · rest{' '}
          {TRAINING_TARGETS.restSeconds[0]}–{TRAINING_TARGETS.restSeconds[1]} s
        </Text>
        <Text style={styles.small}>{TRAINING_TARGETS.note}.</Text>
        {weekFor(planDay) <= 2 ? (
          <Text style={styles.small}>Weeks 1–2: light, controlled weights. No maximum lifts or training to failure.</Text>
        ) : null}
      </Card>

      {restLeft != null ? (
        <Notice tone={restLeft === 0 ? 'warn' : 'info'}>
          {restLeft === 0 ? 'Rest over — next set.' : `Rest: ${restLeft}s`}
          {'  '}
          <Text style={{ color: colors.primary, fontWeight: '600' }} onPress={() => setRestLeft(null)}>
            {restLeft === 0 ? 'Dismiss' : 'Skip'}
          </Text>
        </Notice>
      ) : null}
      <View style={[styles.row, { justifyContent: 'center' }]}>
        <Text style={styles.small}>Rest timer:</Text>
        {[60, 75, 90].map((sec) => (
          <Pressable key={sec} onPress={() => setRestLength(sec)}>
            <Text style={[styles.small, { color: restLength === sec ? colors.primary : colors.muted, fontWeight: restLength === sec ? '700' : '400' }]}>
              {sec}s
            </Text>
          </Pressable>
        ))}
      </View>

      {workout.exercises.map((id) => {
        const prev = previousWeight(days, id, planDay);
        return (
          <Card key={id}>
            <Pressable style={styles.row} onPress={() => router.push({ pathname: '/exercise/[id]', params: { id } })}>
              <ExerciseImage id={id} size={64} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{EXERCISES[id].name}</Text>
                <Text style={styles.small}>{prev != null ? `Last time: ${prev} kg` : 'First time — start light'}</Text>
              </View>
            </Pressable>
            {setsFor(id).map((set, i) => (
              <View key={i} style={[styles.row, { gap: space.sm }]}>
                <View style={{ width: 92 }}>
                  <CheckRow
                    label={`Set ${i + 1}`}
                    checked={set.done}
                    onToggle={() => updateSet(id, i, { done: !set.done })}
                    disabled={finished}
                  />
                </View>
                <TextInput
                  style={[styles.input, { flex: 1, minWidth: 0 }]}
                  placeholder="kg"
                  keyboardType="decimal-pad"
                  editable={!finished}
                  value={set.weight != null ? String(set.weight) : ''}
                  onChangeText={(t) => updateSet(id, i, { weight: t ? Number(t.replace(',', '.')) || 0 : null })}
                />
                <TextInput
                  style={[styles.input, { flex: 1, minWidth: 0 }]}
                  placeholder="reps"
                  keyboardType="number-pad"
                  editable={!finished}
                  value={set.reps != null ? String(set.reps) : ''}
                  onChangeText={(t) => updateSet(id, i, { reps: t ? Number(t.replace(/\D/g, '')) || 0 : null })}
                />
              </View>
            ))}
          </Card>
        );
      })}

      <Card title="How did it feel?">
        {(['energy_rating', 'recovery_rating'] as const).map((field) => (
          <View key={field} style={[styles.row, { flexWrap: 'wrap' }]}>
            <Text style={[styles.body, { width: 80 }]}>{field === 'energy_rating' ? 'Energy' : 'Recovery'}</Text>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                onPress={() => updateDay(planDay, { [field]: n })}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: log[field] === n ? colors.primary : colors.border,
                }}
              >
                <Text style={{ color: log[field] === n ? '#fff' : colors.text, fontWeight: '600' }}>{n}</Text>
              </Pressable>
            ))}
          </View>
        ))}
        {weekFor(planDay) > 2 && (log.recovery_rating ?? 0) >= 4 && (log.energy_rating ?? 0) >= 4 ? (
          <Text style={styles.small}>Recovery looks good. You could add a little weight next session.</Text>
        ) : (
          <Text style={styles.small}>Progress only after week 2, and only when recovery is good.</Text>
        )}
      </Card>

      <Button label="Stop exercise — warning signs" kind="danger" onPress={() => router.push({ pathname: '/safety', params: { day: String(planDay) } })} />
      <Button label="Done" onPress={() => router.back()} />
    </Screen>
  );
}
