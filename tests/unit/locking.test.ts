import { describe, expect, it } from '@jest/globals';
import {
  canPlaceBet,
  isBetLocked,
  isBetRevealed,
  isMatchStarted,
  kickoffMs,
} from '../../src/utils/locking';
import type { Match } from '../../src/types';

function matchAt(kickoff: string): Match {
  return {
    id: 'm001',
    stage: 'group',
    roundLabel: 'Group A',
    groupId: 'A',
    home: { kind: 'team', teamId: 'mex' },
    away: { kind: 'team', teamId: 'rsa' },
    kickoff,
  } as Match;
}

const KICK = '2026-06-15T18:00:00.000Z';
const before = Date.parse('2026-06-15T17:59:59.000Z');
const exactly = Date.parse(KICK);
const after = Date.parse('2026-06-15T18:00:01.000Z');

describe('kickoffMs', () => {
  it('parses the ISO kickoff to epoch ms', () => {
    expect(kickoffMs(matchAt(KICK))).toBe(Date.parse(KICK));
  });
});

describe('isMatchStarted', () => {
  const m = matchAt(KICK);
  it('is false before kickoff', () => {
    expect(isMatchStarted(m, before)).toBe(false);
  });
  it('is true exactly at kickoff', () => {
    expect(isMatchStarted(m, exactly)).toBe(true);
  });
  it('is true after kickoff', () => {
    expect(isMatchStarted(m, after)).toBe(true);
  });
});

describe('canPlaceBet', () => {
  const m = matchAt(KICK);
  it('allows bets before kickoff', () => {
    expect(canPlaceBet(m, before)).toBe(true);
  });
  it('blocks bets once started', () => {
    expect(canPlaceBet(m, exactly)).toBe(false);
  });
});

describe('isBetLocked / isBetRevealed', () => {
  const m = matchAt(KICK);
  it('locks and reveals exactly when the match has started', () => {
    expect(isBetLocked(m, before)).toBe(false);
    expect(isBetRevealed(m, before)).toBe(false);
    expect(isBetLocked(m, after)).toBe(true);
    expect(isBetRevealed(m, after)).toBe(true);
  });
});
