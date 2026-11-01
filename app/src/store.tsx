import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, ApiError } from './api';
import { PLAN_DAYS, deadlineFor, parseLocalDate, weekFor } from './plan';
import { emptyDay, type Account, type CheckIn, type DayLog, type Profile, type ServerSummary } from './types';
import { XP, dailyXp, isStreakDay, levelFor, type XpBreakdown } from './xp';

const STORAGE_KEY = 'fitness-quest/v1';

interface State {
  profile: Profile | null;
  days: Record<number, DayLog>;
  checkIns: CheckIn[];
  account: Account | null;
  /** Plan days with local edits not yet confirmed by the server (US-804). */
  pendingDays: number[];
  pendingCheckIns: CheckIn[];
  server: ServerSummary | null;
}

const INITIAL: State = {
  profile: null,
  days: {},
  checkIns: [],
  account: null,
  pendingDays: [],
  pendingCheckIns: [],
  server: null,
};

export type SyncStatus = 'local' | 'synced' | 'pending' | 'syncing' | 'error';

interface Store extends State {
  loaded: boolean;
  syncStatus: SyncStatus;
  syncError: string | null;
  todayPlanDay: number;
  day: (planDay: number) => DayLog;
  dayXp: (planDay: number) => XpBreakdown;
  totalXp: number;
  level: ReturnType<typeof levelFor>;
  streak: number;
  isClosed: (planDay: number) => boolean;
  saveProfile: (profile: Profile) => void;
  updateDay: (planDay: number, patch: Partial<DayLog>) => void;
  finishDay: (planDay: number) => void;
  addCheckIn: (type: CheckIn['type'], value: number) => CheckIn;
  setAccount: (account: Account | null) => void;
  sync: () => Promise<void>;
  resetAll: () => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

function planDayFor(startIso: string, now: Date): number {
  const start = parseLocalDate(startIso);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today.getTime() - start.getTime()) / 86_400_000) + 1;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(INITIAL);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => raw && setState({ ...INITIAL, ...JSON.parse(raw) }))
      .catch(() => {})
      .finally(() => setLoaded(true));
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, loaded]);

  const startIso = state.profile?.start_date;
  const todayPlanDay = startIso ? planDayFor(startIso, now) : 0;

  const day = useCallback((planDay: number) => state.days[planDay] ?? emptyDay(planDay), [state.days]);

  const isClosed = useCallback(
    (planDay: number) => (startIso ? now > deadlineFor(startIso, planDay) : false),
    [startIso, now],
  );

  /** Per-day XP: the server's figure once synced, otherwise the local estimate. */
  const xpByDay = useMemo(() => {
    const out: Record<number, XpBreakdown> = {};
    if (!startIso) return out;
    let streak = 0;
    for (let d = 1; d <= PLAN_DAYS; d++) {
      const log = state.days[d];
      if (!log) {
        streak = 0;
        continue;
      }
      // `total` here is the daily XP only; the streak bonus is kept separately.
      const synced = log.xp && !state.pendingDays.includes(d);
      const xp = synced ? { ...log.xp!, total: log.xp!.total - log.xp!.streak } : dailyXp(startIso, log);
      streak = isStreakDay(log, xp.total) ? streak + 1 : 0;
      if (!synced) xp.streak = streak > 0 && streak % XP.streakEvery === 0 ? XP.streakBonus : 0;
      out[d] = xp;
    }
    return out;
  }, [startIso, state.days, state.pendingDays]);

  const dayXp = useCallback(
    (planDay: number) =>
      xpByDay[planDay] ?? (startIso ? dailyXp(startIso, emptyDay(planDay)) : dailyXp('2000-01-01', emptyDay(planDay))),
    [xpByDay, startIso],
  );

  const localTotal = useMemo(() => {
    let total = 0;
    for (const [d, xp] of Object.entries(xpByDay)) {
      const log = state.days[Number(d)];
      // Finished days count at once; unfinished days once they close (US-507).
      if (log?.finished_at || isClosed(Number(d))) total += xp.total + xp.streak;
    }
    return total + state.checkIns.reduce((sum, c) => sum + c.xp, 0);
  }, [xpByDay, state.days, state.checkIns, isClosed]);

  const fullySynced = !!state.account && state.pendingDays.length === 0 && state.pendingCheckIns.length === 0;
  // US-805: prefer the server's total when everything is confirmed. Levels never go down (US-505).
  const totalXp = fullySynced && state.server ? state.server.total_xp : localTotal;

  const streak = useMemo(() => {
    let s = 0;
    for (let d = Math.min(todayPlanDay, PLAN_DAYS); d >= 1; d--) {
      const log = state.days[d];
      const xp = xpByDay[d];
      if (d === todayPlanDay && !log?.finished_at) continue; // today still open
      if (!log || !xp || !isStreakDay(log, xp.total)) break;
      s++;
    }
    return s;
  }, [state.days, xpByDay, todayPlanDay]);

  const saveProfile = useCallback((profile: Profile) => {
    setState((s) => ({ ...s, profile }));
  }, []);

  const updateDay = useCallback((planDay: number, patch: Partial<DayLog>) => {
    setState((s) => {
      const current = s.days[planDay] ?? emptyDay(planDay);
      const next = { ...current, ...patch, client_updated_at: new Date().toISOString() };
      return {
        ...s,
        days: { ...s.days, [planDay]: next },
        pendingDays: s.pendingDays.includes(planDay) ? s.pendingDays : [...s.pendingDays, planDay],
      };
    });
  }, []);

  const finishDay = useCallback(
    (planDay: number) => {
      const current = stateRef.current.days[planDay];
      if (current?.finished_at) return; // XP is awarded once (US-501)
      updateDay(planDay, { finished_at: new Date().toISOString() });
    },
    [updateDay],
  );

  const addCheckIn = useCallback(
    (type: CheckIn['type'], value: number): CheckIn => {
      const week = weekFor(Math.max(1, todayPlanDay));
      const period = type === 'weight' ? week : Math.floor((week - 1) / 2) + 1;
      const existing = stateRef.current.checkIns.find((c) => c.type === type && c.period === period);
      const checkIn: CheckIn = {
        type,
        period,
        value,
        xp: type === 'weight' ? XP.weightCheckIn : XP.waistCheckIn,
        logged_at: existing?.logged_at ?? new Date().toISOString(),
      };
      setState((s) => ({
        ...s,
        checkIns: [...s.checkIns.filter((c) => !(c.type === type && c.period === period)), checkIn],
        pendingCheckIns: [...s.pendingCheckIns.filter((c) => !(c.type === type && c.period === period)), checkIn],
      }));
      return checkIn;
    },
    [todayPlanDay],
  );

  const setAccount = useCallback((account: Account | null) => {
    setState((s) => ({
      ...s,
      account,
      server: null,
      // On sign-in, upload everything logged on this device.
      pendingDays: account ? Object.keys(s.days).map(Number) : s.pendingDays,
      pendingCheckIns: account ? s.checkIns : s.pendingCheckIns,
    }));
  }, []);

  const sync = useCallback(async () => {
    const s = stateRef.current;
    const account = s.account;
    if (!account || !s.profile || syncing) return;
    setSyncing(true);
    setSyncError(null);
    try {
      await api.saveProfile(account, s.profile, Intl.DateTimeFormat().resolvedOptions().timeZone);

      for (const planDay of [...s.pendingDays].sort((a, b) => a - b)) {
        const local = s.days[planDay];
        if (!local) continue;
        let confirmed: DayLog;
        try {
          confirmed = await api.saveDay(account, local);
          if (local.finished_at && !confirmed.finished_at) {
            confirmed = (await api.finishDay(account, planDay)).day;
          }
        } catch (e) {
          // A closed or out-of-range day can't change any more; stop retrying it.
          if (e instanceof ApiError && (e.status === 423 || e.status === 422 || e.status === 404)) {
            confirmed = { ...local };
          } else {
            throw e;
          }
        }
        setState((cur) => {
          const latest = cur.days[planDay];
          const editedSince = latest?.client_updated_at !== local.client_updated_at;
          return {
            ...cur,
            days: editedSince ? cur.days : { ...cur.days, [planDay]: { ...latest, ...confirmed, xp: confirmed.xp } },
            pendingDays: editedSince ? cur.pendingDays : cur.pendingDays.filter((d) => d !== planDay),
          };
        });
      }

      for (const c of s.pendingCheckIns) {
        await api.checkIn(account, c.type, c.value).catch((e) => {
          if (!(e instanceof ApiError && e.status === 422)) throw e;
        });
        setState((cur) => ({ ...cur, pendingCheckIns: cur.pendingCheckIns.filter((p) => p !== c) }));
      }

      const summary = await api.summary(account);
      setState((cur) => ({ ...cur, server: { ...summary, fetched_at: new Date().toISOString() } }));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setState((cur) => ({ ...cur, account: null, server: null }));
        setSyncError('Signed out. Sign in again to sync.');
      } else {
        // Offline at the gym is normal; everything stays queued (US-804).
        setSyncError(e instanceof Error ? e.message : 'Sync failed');
      }
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  // Sync shortly after any change, and every few minutes, while signed in.
  useEffect(() => {
    if (!loaded || !state.account) return;
    const t = setTimeout(() => void sync(), 1500);
    return () => clearTimeout(t);
  }, [loaded, state.account, state.pendingDays, state.pendingCheckIns, state.profile]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!state.account) return;
    const t = setInterval(() => void sync(), 5 * 60_000);
    return () => clearInterval(t);
  }, [state.account, sync]);

  const resetAll = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    setState(INITIAL);
  }, []);

  const syncStatus: SyncStatus = !state.account
    ? 'local'
    : syncing
      ? 'syncing'
      : syncError
        ? 'error'
        : fullySynced
          ? 'synced'
          : 'pending';

  const value: Store = {
    ...state,
    loaded,
    syncStatus,
    syncError,
    todayPlanDay,
    day,
    dayXp,
    totalXp,
    level: levelFor(totalXp),
    streak,
    isClosed,
    saveProfile,
    updateDay,
    finishDay,
    addCheckIn,
    setAccount,
    sync,
    resetAll,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const store = useContext(Ctx);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
