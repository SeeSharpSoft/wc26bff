import type { Stage } from '../types';

/** Knockout stages in tournament order (excludes the group stage). */
export const KNOCKOUT_STAGES: Stage[] = [
  'round32',
  'round16',
  'quarter',
  'semi',
  'third',
  'final',
];
