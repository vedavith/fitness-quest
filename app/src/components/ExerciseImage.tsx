import { Image, StyleSheet, Text, View } from 'react-native';
import { EXERCISE_IMAGES } from '../exerciseImages';
import { EXERCISES } from '../plan';
import { colors } from '../theme';

/** Shows the bundled image, or a placeholder that never blocks logging (US-203). */
export function ExerciseImage({ id, size = 64 }: { id: string; size?: number }) {
  const source = EXERCISE_IMAGES[id];
  const exercise = EXERCISES[id];
  if (source) {
    return (
      <Image
        source={source}
        accessibilityLabel={`${exercise?.name}: ${exercise?.imageShows}`}
        style={{ width: size, height: size, borderRadius: 10 }}
        resizeMode="cover"
      />
    );
  }
  return (
    <View
      accessibilityLabel={`${exercise?.name ?? id} image coming soon`}
      style={[s.placeholder, { width: size, height: size }]}
    >
      <Text style={[s.initials, { fontSize: size / 3 }]}>
        {(exercise?.name ?? id)
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  placeholder: {
    borderRadius: 10,
    backgroundColor: '#e8eefc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  initials: { color: colors.primary, fontWeight: '700' },
});
