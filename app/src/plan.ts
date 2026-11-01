// Plan data from docs/user-stories.md (Epics 2–4). Mirrors api/app/Domain.

export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export const WEEKDAYS: Weekday[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

export interface Meal {
  time: string;
  name: string;
  main: boolean;
}

export const MEALS: Meal[] = [
  { time: '5:30 AM', name: 'Banana (optional pre-workout)', main: false },
  { time: '7:15 AM', name: 'Breakfast (with eggs)', main: true },
  { time: '10:30 AM', name: 'Fruit', main: true },
  { time: '1:00 PM', name: 'Vegetarian lunch', main: true },
  { time: '4:30 PM', name: '30 g roasted chana', main: true },
  { time: '7:30 PM', name: 'Dinner', main: true },
];

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

/** 1-based plan day and week for a date, given the plan start date (US-102). */
export function planPosition(start: Date, today: Date) {
  const msPerDay = 86_400_000;
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const day = Math.floor((todayUtc - startUtc) / msPerDay) + 1;
  return { day, week: Math.ceil(day / 7), weekday: WEEKDAYS[today.getDay()] };
}
