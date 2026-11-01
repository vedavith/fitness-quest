import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Notice, ProgressBar, Screen, XpPill, styles } from '../components/ui';
import { useStore } from '../store';
import { colors } from '../theme';
import { XP, dayItems } from '../xp';

const LABELS = { workout: 'Workout or recovery', steps: 'Steps', meals: 'All 5 main meals', sleep: 'Sleep (7+ hours)' } as const;

// US-501..505: review, confirm once, then celebrate.
export default function Finish() {
  const params = useLocalSearchParams<{ day: string }>();
  const { profile, todayPlanDay, day, dayXp, finishDay, totalXp, level, streak, isClosed, syncStatus } = useStore();
  const [levelBefore, setLevelBefore] = useState<number | null>(null);
  if (!profile) return null;

  const planDay = Number(params.day ?? todayPlanDay);
  const log = day(planDay);
  const items = dayItems(profile.start_date, log);
  const xp = dayXp(planDay);
  const finished = !!log.finished_at;
  const closed = isClosed(planDay);
  const future = planDay > todayPlanDay;

  if (!finished) {
    const allDone = Object.values(items).every(Boolean);
    return (
      <Screen>
        <Text style={styles.h1}>Finish day {planDay}?</Text>
        <Card>
          {(Object.keys(LABELS) as (keyof typeof LABELS)[]).map((k) => (
            <View key={k} style={[styles.row, { justifyContent: 'space-between' }]}>
              <Text style={[styles.body, { color: items[k] ? colors.success : colors.muted }]}>
                {items[k] ? '✓' : '○'} {LABELS[k]}
              </Text>
              <XpPill xp={xp[k]} muted={!xp[k]} />
            </View>
          ))}
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <Text style={[styles.body, { color: allDone ? colors.success : colors.muted }]}>
              {allDone ? '✓' : '○'} Finish Day bonus
            </Text>
            <XpPill xp={allDone ? XP.finishBonus : 0} muted={!allDone} />
          </View>
        </Card>
        <Text style={styles.body}>
          {allDone
            ? `Everything's done. Finishing now earns ${Math.min(XP.dailyMax, xp.total + XP.finishBonus)} XP.`
            : `Finishing now earns ${xp.total} XP for what you completed. You can finish a partial day.`}
        </Text>
        {closed ? <Notice tone="warn">This day closed at 12:00 PM the next day. Its logged XP already counts.</Notice> : null}
        {future ? <Notice tone="warn">You can only finish today or yesterday.</Notice> : null}
        <Button
          label="Confirm and finish"
          disabled={closed || future}
          onPress={() => {
            setLevelBefore(level.level);
            finishDay(planDay);
          }}
        />
        <Button label="Not yet" kind="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const leveledUp = levelBefore != null && level.level > levelBefore;
  const span = level.next ? level.next - level.min : 1;
  return (
    <Screen>
      <Text style={styles.h1}>{leveledUp ? `Level up! ${level.name}` : 'Day complete'}</Text>
      <Card>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Text style={styles.h2}>Day {planDay}</Text>
          <XpPill xp={xp.total + xp.streak} />
        </View>
        {(['workout', 'steps', 'meals', 'sleep', 'bonus', 'streak'] as const).map((k) =>
          xp[k] ? (
            <View key={k} style={[styles.row, { justifyContent: 'space-between' }]}>
              <Text style={styles.body}>
                {k === 'bonus' ? 'Finish Day bonus' : k === 'streak' ? '7-day streak bonus' : LABELS[k]}
              </Text>
              <Text style={styles.body}>+{xp[k]}</Text>
            </View>
          ) : null,
        )}
      </Card>
      <Card title={`Level ${level.level} · ${level.name}`}>
        <ProgressBar value={level.next ? (totalXp - level.min) / span : 1} color={colors.xp} />
        <Text style={styles.small}>
          {totalXp.toLocaleString()} XP total
          {level.next ? ` · ${(level.next - totalXp).toLocaleString()} to the next level` : ''}
          {streak > 0 ? ` · ${streak}-day streak` : ''}
        </Text>
      </Card>
      {syncStatus === 'pending' || syncStatus === 'error' ? (
        <Text style={styles.small}>Saved on this device. It will sync when you're back online.</Text>
      ) : null}
      <Button label="Back to today" onPress={() => router.replace('/')} />
    </Screen>
  );
}
