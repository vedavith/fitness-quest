import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, space } from '../theme';

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        <View style={styles.column}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ title, right, children }: { title?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <View style={styles.card}>
      {title ? (
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{title}</Text>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  disabled,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  const bg = kind === 'primary' ? colors.primary : kind === 'danger' ? colors.danger : colors.card;
  const fg = kind === 'secondary' ? colors.primary : colors.primaryText;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
        kind === 'secondary' && { borderWidth: 1, borderColor: colors.primary },
      ]}
    >
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function CheckRow({
  label,
  detail,
  checked,
  onToggle,
  disabled,
}: {
  label: string;
  detail?: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      onPress={onToggle}
      disabled={disabled}
      style={styles.checkRow}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>{checked ? <Text style={styles.tick}>✓</Text> : null}</View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.body, checked && { color: colors.muted }]}>{label}</Text>
        {detail ? <Text style={styles.small}>{detail}</Text> : null}
      </View>
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: space.xs, flex: 1 }}>
      <Text style={styles.small}>{label}</Text>
      <TextInput placeholderTextColor={colors.muted} style={styles.input} {...props} />
    </View>
  );
}

export function ProgressBar({ value, color = colors.primary }: { value: number; color?: string }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.max(0, Math.min(1, value)) * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

export function XpPill({ xp, muted }: { xp: number; muted?: boolean }) {
  return (
    <View style={[styles.pill, muted && { backgroundColor: colors.border }]}>
      <Text style={[styles.pillText, muted && { color: colors.muted }]}>+{xp} XP</Text>
    </View>
  );
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'danger'; children: ReactNode }) {
  const color = tone === 'danger' ? colors.danger : tone === 'warn' ? colors.warn : colors.primary;
  return (
    <View style={[styles.notice, { borderLeftColor: color }]}>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  screen: { padding: space.lg, paddingBottom: space.xl * 2, alignItems: 'center' },
  column: { width: '100%', maxWidth: 640, gap: space.md },
  h1: { fontSize: 28, fontWeight: '700', color: colors.text },
  h2: { fontSize: 20, fontWeight: '700', color: colors.text },
  kicker: { fontSize: 14, color: colors.muted },
  body: { fontSize: 16, color: colors.text, lineHeight: 22 },
  small: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: space.lg, gap: space.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xs },
  cardTitle: { fontSize: 17, fontWeight: '600', color: colors.text, flexShrink: 1 },
  button: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: space.lg, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  box: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: colors.success, borderColor: colors.success },
  tick: { color: '#fff', fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
  },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  pill: { backgroundColor: '#ede9fe', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  pillText: { color: colors.xp, fontWeight: '700', fontSize: 13 },
  notice: { backgroundColor: colors.card, borderLeftWidth: 4, borderRadius: 8, padding: space.md },
  row: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
});
