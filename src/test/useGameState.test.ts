import { describe, expect, it } from 'vitest';
import { normalizeGameState, normalizePlayer } from '@/hooks/useGameState';

describe('useGameState normalization helpers', () => {
  it('normalizes a player with missing or invalid numeric values', () => {
    const normalized = normalizePlayer({
      id: 'p2',
      name: 'Co-player',
      xp: Number.NaN,
      solved: undefined,
      connected: undefined,
    });

    expect(normalized).toEqual({
      id: 'p2',
      name: 'Co-player',
      xp: 0,
      solved: 0,
      connected: true,
    });
  });

  it('normalizes incoming game state player values before storing', () => {
    const normalized = normalizeGameState({
      phase: 'story',
      currentNodeId: 'start',
      assignedChallenges: {},
      solvedBy: null,
      roundNumber: 2,
      breakTimeLeft: 0,
      players: [
        { id: 'p1', name: 'Host', xp: 50, solved: 2, connected: true },
        { id: 'p2', name: 'Joiner', xp: undefined, solved: Number.NaN, connected: true },
      ],
    });

    expect(normalized.players).toEqual([
      { id: 'p1', name: 'Host', xp: 50, solved: 2, connected: true },
      { id: 'p2', name: 'Joiner', xp: 0, solved: 0, connected: true },
    ]);
  });
});
