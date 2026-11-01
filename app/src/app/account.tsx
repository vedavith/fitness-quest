import { useState } from 'react';
import { Text } from 'react-native';
import { api } from '../api';
import { Button, Card, Field, Notice, Screen, styles } from '../components/ui';
import { useStore } from '../store';

const DEFAULT_API = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

// US-801 account, US-803/804 sync.
export default function AccountScreen() {
  const { account, setAccount, sync, syncStatus, syncError, pendingDays, server } = useStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [apiUrl, setApiUrl] = useState(DEFAULT_API);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res =
        mode === 'register' ? await api.register(apiUrl, name, email, password) : await api.login(apiUrl, email, password);
      setAccount({ apiUrl, token: res.token, name: res.user.name, email: res.user.email });
      setPassword('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  if (account) {
    return (
      <Screen>
        <Text style={styles.h1}>Account</Text>
        <Card title={account.name}>
          <Text style={styles.body}>{account.email}</Text>
          <Text style={styles.small}>Server: {account.apiUrl}</Text>
          <Text style={styles.body}>
            Sync: {syncStatus}
            {pendingDays.length ? ` · ${pendingDays.length} day(s) waiting` : ''}
          </Text>
          {server ? <Text style={styles.small}>Server total: {server.total_xp} XP</Text> : null}
          {syncError ? <Notice tone="warn">{syncError}</Notice> : null}
          <Button label="Sync now" onPress={() => void sync()} />
          <Button
            label="Sign out"
            kind="secondary"
            onPress={() => {
              void api.logout(account).catch(() => {});
              setAccount(null);
            }}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.h1}>{mode === 'login' ? 'Sign in' : 'Create account'}</Text>
      <Text style={styles.body}>
        An account keeps your XP and progress the same on every device. Without one, everything stays on this device.
      </Text>
      <Card>
        <Field label="Server address" value={apiUrl} onChangeText={setApiUrl} autoCapitalize="none" keyboardType="url" />
        {mode === 'register' ? <Field label="Name" value={name} onChangeText={setName} /> : null}
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Field label="Password (8+ characters)" value={password} onChangeText={setPassword} secureTextEntry />
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Button label={busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} onPress={() => void submit()} disabled={busy} />
        <Button
          label={mode === 'login' ? 'New here? Create an account' : 'Have an account? Sign in'}
          kind="secondary"
          onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
        />
      </Card>
    </Screen>
  );
}
