import { Link, Redirect, router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { ExerciseImage } from '../components/ExerciseImage';
import { Button, Card, CheckRow, Field, Notice, ProgressBar, Screen, XpPill, styles } from '../components/ui';
import {
  EXERCISES,
  LUNCH_OPTIONS,
  MAIN_MEALS,
  MEALS,
  PLAN_DAYS,
  PORTIONS,
  WORKOUTS,
  dinnerFor,
  weekFor,
  weekdayFor,
} from '../plan';
import { useStore } from '../store';
import { colors, space } from '../theme';
import type { MealKey } from '../plan';
import { XP, dayItems, exercisesDone, stepTargetFor } from '../xp';

// US-103: everything due today in one place.
export default function Today() {
  const store = useStore();
  const { loaded, profile, todayPlanDay, day, dayXp, totalXp, level, streak, isClosed, updateDay, syncStatus } = store;

  if (!loaded) return null;
  if (!profile) return <Redirect href="/onboarding" />;

  if (todayPlanDay < 1) {
    return (
      <Screen>
        <Text style={styles.h1}>Your quest starts soon</Text>
        <Text style={styles.body}>
          Day 1 is {profile.start_date}. That's {1 - todayPlanDay} day{todayPlanDay === 0 ? '' : 's'} away.
        </Text>
        <Button label="Change start date" kind="secondary" onPress={() => router.push('/onboarding')} />
      </Screen>
    );
  }
  if (todayPlanDay > PLAN_DAYS) {
    return (
      <Screen>
        <Text style={styles.h1}>Quest complete</Text>
        <Text style={styles.body}>
          You finished all 90 days with {totalXp.toLocaleString()} XP — level {level.level}, {level.name}.
        </Text>
        <Button label="See progress" onPress={() => router.push('/progress')} />
      </Screen>
    );
  }

  const planDay = todayPlanDay;
  const log = day(planDay);
  const week = weekFor(planDay);
  const weekday = weekdayFor(profile.start_date, planDay);
  const workout = WORKOUTS[weekday];
  const xp = dayXp(planDay);
  const items = dayItems(profile.start_date, log);
  const { done, total } = exercisesDone(profile.start_date, log);
  const stepTarget = stepTargetFor(log);
  const finished = !!log.finished_at;
  const yesterday = planDay > 1 ? day(planDay - 1) : null;
  const canFinishYesterday = yesterday && !yesterday.finished_at && !isClosed(planDay - 1);

  const levelSpan = level.next ? level.next - level.min : 1;
  const toggleMeal = (key: MealKey) => {
    const meals = new Set(log.meals ?? []);
    const offPlan = new Set(log.off_plan_meals ?? []);
    if (meals.has(key)) meals.delete(key);
    else {
      meals.add(key);
      offPlan.delete(key);
    }
    updateDay(planDay, { meals: [...meals], off_plan_meals: [...offPlan] });
  };
  const ateSomethingElse = (key: MealKey) => {
    // US-406: recorded honestly, earns no meal XP.
    const meals = (log.meals ?? []).filter((m) => m !== key);
    const offPlan = new Set(log.off_plan_meals ?? []);
    if (offPlan.has(key)) offPlan.delete(key);
    else offPlan.add(key);
    updateDay(planDay, { meals, off_plan_meals: [...offPlan] });
  };

  return (
    <Screen>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.kicker}>
            Day {planDay} of {PLAN_DAYS} · Week {week} · {weekday}
          </Text>
          <Text style={styles.h1}>Today's quest</Text>
        </View>
        <XpPill xp={xp.total} muted={!finished} />
      </View>

      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            Level {level.level} · {level.name}
          </Text>
          <Text style={styles.small}>{totalXp.toLocaleString()} XP</Text>
        </View>
        <ProgressBar value={level.next ? (totalXp - level.min) / levelSpan : 1} color={colors.xp} />
        <Text style={styles.small}>
          {level.next ? `${(level.next - totalXp).toLocaleString()} XP to the next level` : 'Top level reached'}
          {streak > 0 ? ` · ${streak}-day streak` : ''}
        </Text>
      </Card>

      {canFinishYesterday ? (
        <Notice tone="warn">
          You didn't finish yesterday. You can still finish it until 12:00 PM today.{' '}
          <Link href={{ pathname: '/finish', params: { day: String(planDay - 1) } }} style={{ color: colors.primary, fontWeight: '600' }}>
            Finish day {planDay - 1}
          </Link>
        </Notice>
      ) : null}

      {week <= 2 ? (
        <Notice>
          Adaptation phase: light, controlled weights only. No HIIT, maximum lifts or training to failure.
        </Notice>
      ) : null}

      <Card title={`Workout · ${workout.title}`} right={<XpPill xp={xp.workout} muted={!items.workout} />}>
        {workout.kind === 'strength' ? (
          <>
            {workout.exercises.map((id) => (
              <View key={id} style={styles.row}>
                <ExerciseImage id={id} size={44} />
                <Text style={[styles.body, { flex: 1 }]}>{EXERCISES[id].name}</Text>
              </View>
            ))}
            <Text style={styles.small}>
              {done} of {total} exercises complete
              {log.stopped_for_safety ? ' · stopped safely' : ''}
            </Text>
            <Button label={done ? 'Continue workout' : 'Start workout'} onPress={() => router.push({ pathname: '/workout', params: { day: String(planDay) } })} disabled={finished} />
          </>
        ) : workout.kind === 'rest' ? (
          <CheckRow
            label="Rest day check-in"
            detail="Rest is part of the plan and earns the same 40 XP."
            checked={log.workout_done}
            onToggle={() => updateDay(planDay, { workout_done: !log.workout_done })}
            disabled={finished}
          />
        ) : (
          <>
            <Text style={styles.body}>
              {workout.kind === 'recovery'
                ? 'Easy walking and gentle mobility.'
                : 'Swimming or comfortable walking. Don’t push through fatigue.'}
            </Text>
            <Button label="Open session" kind="secondary" onPress={() => router.push({ pathname: '/workout', params: { day: String(planDay) } })} />
          </>
        )}
      </Card>

      <Card title="Steps" right={<XpPill xp={xp.steps} muted={!items.steps} />}>
        <ProgressBar value={log.steps / stepTarget} color={colors.success} />
        <Text style={styles.small}>
          {log.steps.toLocaleString()} / {stepTarget.toLocaleString()} · aim for {Math.round(stepTarget / 2).toLocaleString()} in
          the morning and {Math.round(stepTarget / 2).toLocaleString()} in the evening. Gym steps count too.
        </Text>
        <Field
          label="Today's total steps"
          keyboardType="number-pad"
          value={log.steps ? String(log.steps) : ''}
          placeholder="0"
          onChangeText={(t) => updateDay(planDay, { steps: Math.min(200000, Number(t.replace(/\D/g, '')) || 0) })}
          editable={!finished}
        />
        <CheckRow
          label="Recovery day"
          detail="Sore or poorly recovered? Lower today's target to 60% and still earn full step XP."
          checked={log.recovery_step_target != null}
          onToggle={() =>
            updateDay(planDay, {
              recovery_step_target: log.recovery_step_target != null ? null : Math.round((stepTarget * 0.6) / 100) * 100,
            })
          }
          disabled={finished}
        />
      </Card>

      <Card title="Meals" right={<XpPill xp={xp.meals} muted={!items.meals} />}>
        {MEALS.map((meal) => {
          if (!meal.main) {
            return (
              <Text key={meal.key} style={styles.small}>
                {meal.time} · {meal.name}
              </Text>
            );
          }
          const key = meal.key as MealKey;
          const offPlan = (log.off_plan_meals ?? []).includes(key);
          const detail =
            key === 'dinner'
              ? dinnerFor(weekday)
              : key === 'lunch'
                ? log.lunch_choice ?? 'Choose below'
                : undefined;
          return (
            <View key={key}>
              <CheckRow
                label={`${meal.time} · ${meal.name}`}
                detail={offPlan ? 'Ate something else (no XP, streak safe)' : detail}
                checked={(log.meals ?? []).includes(key)}
                onToggle={() => toggleMeal(key)}
                disabled={finished}
              />
              {!finished ? (
                <Pressable onPress={() => ateSomethingElse(key)} style={{ marginLeft: 38, marginTop: -4 }}>
                  <Text style={[styles.small, { color: colors.primary }]}>{offPlan ? 'Undo "ate something else"' : 'Ate something else'}</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
        <Text style={[styles.small, { marginTop: space.sm }]}>Lunch options (vegetarian):</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {LUNCH_OPTIONS.map((opt) => (
            <Pressable
              key={opt}
              disabled={finished}
              onPress={() => updateDay(planDay, { lunch_choice: log.lunch_choice === opt ? null : opt })}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: log.lunch_choice === opt ? colors.primary : colors.border,
                backgroundColor: log.lunch_choice === opt ? '#e8eefc' : colors.card,
              }}
            >
              <Text style={styles.small}>{opt}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.small}>Portions: {PORTIONS}</Text>
        <Text style={styles.small}>
          {(log.meals ?? []).filter((m) => MAIN_MEALS.includes(m)).length} of 5 main meals · {XP.perMeal} XP each
        </Text>
      </Card>

      <Card title="Sleep" right={<XpPill xp={xp.sleep} muted={!items.sleep} />}>
        <Field
          label="Hours slept last night (guide: 7–9)"
          keyboardType="decimal-pad"
          value={log.sleep_hours ? String(log.sleep_hours) : ''}
          placeholder="0"
          onChangeText={(t) => updateDay(planDay, { sleep_hours: Math.min(24, Number(t.replace(',', '.')) || 0) })}
          editable={!finished}
        />
      </Card>

      {finished ? (
        <Notice>
          Day finished with {xp.total} XP. See you tomorrow.
        </Notice>
      ) : null}
      <Button
        label={finished ? 'View today’s result' : 'Finish Day'}
        onPress={() => router.push({ pathname: '/finish', params: { day: String(planDay) } })}
      />

      <View style={[styles.row, { flexWrap: 'wrap', justifyContent: 'center', marginTop: space.sm }]}>
        <Button label="Check-in" kind="secondary" onPress={() => router.push('/check-in')} />
        <Button label="Progress" kind="secondary" onPress={() => router.push('/progress')} />
        <Button label="Safety" kind="secondary" onPress={() => router.push('/safety')} />
        <Button
          label={syncStatus === 'local' ? 'Sign in to sync' : `Sync: ${syncStatus}`}
          kind="secondary"
          onPress={() => router.push('/account')}
        />
      </View>
    </Screen>
  );
}
