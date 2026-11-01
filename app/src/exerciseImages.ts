import type { ImageSourcePropType } from 'react-native';

/**
 * Bundled exercise images (US-202, US-203). Images ship inside the app so they
 * work offline at the gym. Add each file to assets/exercises/ and register it
 * here, e.g. `chestPress: require('../assets/exercises/chest-press.png')`.
 * See the image checklist in docs/user-stories-raw.txt — confirm licensing first.
 */
export const EXERCISE_IMAGES: Partial<Record<string, ImageSourcePropType>> = {};

/** US-204: one cover image per weekday, registered the same way. */
export const COVER_IMAGES: Partial<Record<string, ImageSourcePropType>> = {};
