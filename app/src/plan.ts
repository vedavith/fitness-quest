// Plan data from docs/user-stories.md (Epics 2–4). Mirrors api/app/Domain.

export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export const WEEKDAYS: Weekday[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const PLAN_DAYS = 90;
export const SETS_PER_EXERCISE = 2;

export interface Exercise {
  id: string;
  name: string;
  imageShows: string;
}

export const EXERCISES: Record<string, Exercise> = {
  chestPress: { id: 'chestPress', name: 'Chest press', imageShows: 'Seated chest press position and push path' },
  inclineDbPress: { id: 'inclineDbPress', name: 'Incline dumbbell press', imageShows: 'Incline bench, dumbbell path' },
  pecDeck: { id: 'pecDeck', name: 'Pec deck', imageShows: 'Machine setup and arm path' },
  tricepsPushdown: { id: 'tricepsPushdown', name: 'Triceps pushdown', imageShows: 'Cable attachment, elbows at the sides' },
  latPulldown: { id: 'latPulldown', name: 'Lat pulldown', imageShows: 'Bar pulled toward the upper chest' },
  seatedRow: { id: 'seatedRow', name: 'Seated row', imageShows: 'Upright torso, pulling action' },
  facePulls: { id: 'facePulls', name: 'Face pulls', imageShows: 'Rope pulled toward the face' },
  dbCurls: { id: 'dbCurls', name: 'Dumbbell curls', imageShows: 'Elbows at the sides, curl path' },
  legPress: { id: 'legPress', name: 'Leg press', imageShows: 'Foot position and leg path' },
  legCurl: { id: 'legCurl', name: 'Leg curl', imageShows: 'Pad position and curl action' },
  legExtension: { id: 'legExtension', name: 'Leg extension', imageShows: 'Seated position and extension action' },
  gluteBridges: { id: 'gluteBridges', name: 'Glute bridges', imageShows: 'Hips lifted from the floor' },
  plank: { id: 'plank', name: 'Plank', imageShows: 'Straight line from head to heels' },
  shoulderPress: { id: 'shoulderPress', name: 'Shoulder press', imageShows: 'Seated press path' },
  cableRow: { id: 'cableRow', name: 'Cable row', imageShows: 'Cable setup and pulling action' },
  walking: { id: 'walking', name: 'Walking', imageShows: 'Comfortable walking pace' },
  mobility: { id: 'mobility', name: 'Gentle mobility', imageShows: 'Simple, low-intensity stretching movement' },
  swimming: { id: 'swimming', name: 'Swimming', imageShows: 'Relaxed lap swimming' },
};

export interface WorkoutDay {
  title: string;
  kind: 'strength' | 'recovery' | 'cardio' | 'rest';
  exercises: string[];
}

export const WORKOUTS: Record<Weekday, WorkoutDay> = {
  Mon: { title: 'Chest + Triceps', kind: 'strength', exercises: ['chestPress', 'inclineDbPress', 'pecDeck', 'tricepsPushdown'] },
  Tue: { title: 'Back + Biceps', kind: 'strength', exercises: ['latPulldown', 'seatedRow', 'facePulls', 'dbCurls'] },
  Wed: { title: 'Legs + Core', kind: 'strength', exercises: ['legPress', 'legCurl', 'legExtension', 'gluteBridges', 'plank'] },
  Thu: { title: 'Active recovery', kind: 'recovery', exercises: ['walking', 'mobility'] },
  Fri: { title: 'Full body', kind: 'strength', exercises: ['chestPress', 'latPulldown', 'legPress', 'shoulderPress', 'cableRow'] },
  Sat: { title: 'Cardio', kind: 'cardio', exercises: ['swimming', 'walking'] },
  Sun: { title: 'Rest', kind: 'rest', exercises: [] },
};

export const TRAINING_TARGETS = {
  warmUp: '5–10 minutes',
  sets: 2,
  reps: '10–12',
  restSeconds: [60, 90] as const,
  note: 'Keep 3–4 good reps in reserve',
};

/** Keys match api/app/Domain/Plan::MAIN_MEALS. */
export type MealKey = 'breakfast' | 'fruit' | 'lunch' | 'snack' | 'dinner';

export interface Meal {
  key: MealKey | 'banana';
  time: string;
  name: string;
  main: boolean;
}

// US-401: timed meal checklist. The 5:30 AM banana is optional and earns no XP.
export const MEALS: Meal[] = [
  { key: 'banana', time: '5:30 AM', name: 'Banana (optional, pre-workout)', main: false },
  { key: 'breakfast', time: '7:15 AM', name: 'Breakfast with eggs', main: true },
  { key: 'fruit', time: '10:30 AM', name: 'Fruit', main: true },
  { key: 'lunch', time: '1:00 PM', name: 'Vegetarian lunch', main: true },
  { key: 'snack', time: '4:30 PM', name: '30 g roasted chana', main: true },
  { key: 'dinner', time: '7:30 PM', name: 'Dinner', main: true },
];

export const MAIN_MEALS: MealKey[] = ['breakfast', 'fruit', 'lunch', 'snack', 'dinner'];

// US-405
export const PORTIONS =
  '2 medium rotis or about 1 cup cooked rice, 1 bowl dal or beans, and a generous serving of vegetables.';

export const LUNCH_OPTIONS = ['Dal', 'Rajma', 'Chole', 'Paneer bhurji', 'Sambar', 'Vegetable khichdi'];

export function dinnerFor(day: Weekday): string {
  const protein =
    day === 'Mon' || day === 'Thu' || day === 'Sat'
      ? '150–200 g paneer or tofu'
      : day === 'Tue' || day === 'Fri'
        ? '50 g dry soya chunks'
        : '150–180 g cooked chicken';
  return `${protein}, 2 rotis and vegetables`;
}

export function stepTargetForWeek(week: number): number {
  return week <= 1 ? 5000 : week === 2 ? 6000 : week === 3 ? 7000 : 8000;
}

export function weekFor(planDay: number): number {
  return Math.floor((planDay - 1) / 7) + 1;
}

/** Local date (YYYY-MM-DD) to a Date at local midnight. */
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toLocalIso(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export function dateForPlanDay(startIso: string, planDay: number): Date {
  const d = parseLocalDate(startIso);
  d.setDate(d.getDate() + planDay - 1);
  return d;
}

export function weekdayFor(startIso: string, planDay: number): Weekday {
  return WEEKDAYS[dateForPlanDay(startIso, planDay).getDay()];
}

/** 12:00 PM the day after: last moment to finish or correct a day (US-507, US-508). */
export function deadlineFor(startIso: string, planDay: number): Date {
  const d = dateForPlanDay(startIso, planDay);
  d.setDate(d.getDate() + 1);
  d.setHours(12, 0, 0, 0);
  return d;
}

/** 1-based plan day and week for a date, given the plan start date (US-102). */
export function planPosition(start: Date, today: Date) {
  const msPerDay = 86_400_000;
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const day = Math.floor((todayUtc - startUtc) / msPerDay) + 1;
  return { day, week: Math.ceil(day / 7), weekday: WEEKDAYS[today.getDay()] };
}
