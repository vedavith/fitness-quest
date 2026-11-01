import type { MealKey } from './plan';
import type { XpBreakdown } from './xp';

export interface SetLog {
  done: boolean;
  weight: number | null;
  reps: number | null;
}

/** Same shape as the API's day log (api/app/Models/DayLog.php). */
export interface DayLog {
  plan_day: number;
  sets: Record<string, SetLog[]> | null;
  workout_done: boolean;
  stopped_for_safety: boolean;
  steps: number;
  recovery_step_target: number | null;
  meals: MealKey[] | null;
  off_plan_meals: MealKey[] | null;
  lunch_choice: string | null;
  sleep_hours: number;
  energy_rating: number | null;
  recovery_rating: number | null;
  finished_at: string | null;
  client_updated_at: string | null;
  /** XP confirmed by the server, when synced. */
  xp?: XpBreakdown;
}

export interface Profile {
  start_date: string; // YYYY-MM-DD, local
  start_weight_kg: number;
  waist_in: number;
  height_cm: number;
  age: number;
  goal_weight_kg: number;
  long_goal_weight_kg: number;
}

export interface CheckIn {
  type: 'weight' | 'waist';
  period: number;
  value: number;
  xp: number;
  logged_at: string;
}

export interface Account {
  apiUrl: string;
  token: string;
  name: string;
  email: string;
}

export interface ServerSummary {
  total_xp: number;
  current_streak: number;
  fetched_at: string;
}

export function emptyDay(planDay: number): DayLog {
  return {
    plan_day: planDay,
    sets: null,
    workout_done: false,
    stopped_for_safety: false,
    steps: 0,
    recovery_step_target: null,
    meals: null,
    off_plan_meals: null,
    lunch_choice: null,
    sleep_hours: 0,
    energy_rating: null,
    recovery_rating: null,
    finished_at: null,
    client_updated_at: null,
  };
}

export const DEFAULT_PROFILE: Omit<Profile, 'start_date'> = {
  start_weight_kg: 106,
  waist_in: 40,
  height_cm: 171,
  age: 30,
  goal_weight_kg: 96,
  long_goal_weight_kg: 90,
};
