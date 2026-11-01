// Mirror of api/app/Domain/XpRules.php for instant, offline feedback.
// The server's numbers replace these after sync (US-805).
import { MAIN_MEALS, SETS_PER_EXERCISE, WORKOUTS, stepTargetForWeek, weekFor, weekdayFor } from './plan';
import type { DayLog } from './types';

export const XP = {
  workoutFull: 40,
  workoutHalf: 20,
  steps: 20,
  perMeal: 5,
  sleep: 15,
  sleepMinHours: 7,
  finishBonus: 20,
  dailyMax: 120,
  weightCheckIn: 30,
  waistCheckIn: 20,
  streakBonus: 50,
  streakEvery: 7,
  streakDayMin: 60,
} as const;

export const LEVELS: { level: number; name: string; min: number }[] = [
  { level: 1, name: 'Restarter', min: 0 },
  { level: 2, name: 'Walker', min: 500 },
  { level: 3, name: 'Regular', min: 1500 },
  { level: 4, name: 'Builder', min: 3000 },
  { level: 5, name: 'Strong', min: 5000 },
  { level: 6, name: 'Steady', min: 7000 },
  { level: 7, name: 'Unstoppable', min: 9000 },
  { level: 8, name: '90-Day Finisher', min: 11000 },
];

export interface XpBreakdown {
  workout: number;
  steps: number;
  meals: number;
  sleep: number;
  bonus: number;
  streak: number;
  total: number;
}

export function levelFor(totalXp: number) {
  let current = LEVELS[0];
  for (const l of LEVELS) if (totalXp >= l.min) current = l;
  const next = LEVELS.find((l) => l.level === current.level + 1) ?? null;
  return { ...current, next: next?.min ?? null };
}

export function stepTargetFor(log: DayLog): number {
  const plan = stepTargetForWeek(weekFor(log.plan_day));
  return log.recovery_step_target != null ? Math.min(plan, log.recovery_step_target) : plan;
}

export function exercisesDone(startIso: string, log: DayLog): { done: number; total: number } {
  const workout = WORKOUTS[weekdayFor(startIso, log.plan_day)];
  if (workout.kind !== 'strength') return { done: 0, total: 0 };
  const done = workout.exercises.filter(
    (id) => (log.sets?.[id] ?? []).filter((s) => s.done).length >= SETS_PER_EXERCISE,
  ).length;
  return { done, total: workout.exercises.length };
}

/** Which of the four daily items are complete (used by Finish Day, US-501). */
export function dayItems(startIso: string, log: DayLog) {
  const xp = dailyXp(startIso, { ...log, finished_at: null });
  return {
    workout: xp.workout === XP.workoutFull,
    steps: xp.steps === XP.steps,
    meals: xp.meals === MAIN_MEALS.length * XP.perMeal,
    sleep: xp.sleep === XP.sleep,
  };
}

export function dailyXp(startIso: string, log: DayLog): XpBreakdown {
  const { done, total } = exercisesDone(startIso, log);
  const workout = log.stopped_for_safety
    ? XP.workoutFull
    : total === 0
      ? log.workout_done
        ? XP.workoutFull
        : 0
      : done >= total
        ? XP.workoutFull
        : done * 2 >= total
          ? XP.workoutHalf
          : 0;

  const target = stepTargetFor(log);
  const steps = target > 0 && log.steps >= target ? XP.steps : 0;
  const mealCount = new Set((log.meals ?? []).filter((m) => MAIN_MEALS.includes(m))).size;
  const meals = mealCount * XP.perMeal;
  const sleep = log.sleep_hours >= XP.sleepMinHours ? XP.sleep : 0;
  const complete =
    workout === XP.workoutFull && steps === XP.steps && mealCount === MAIN_MEALS.length && sleep === XP.sleep;
  const bonus = complete && log.finished_at ? XP.finishBonus : 0;
  const dayTotal = Math.min(XP.dailyMax, workout + steps + meals + sleep + bonus);

  return { workout, steps, meals, sleep, bonus, streak: 0, total: dayTotal };
}

export function isStreakDay(log: DayLog, dayXp: number): boolean {
  return !!log.finished_at && dayXp >= XP.streakDayMin;
}
