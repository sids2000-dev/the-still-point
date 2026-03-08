

## Problem

This is a continuation of the **stale closure** bug identified earlier. The chain:

1. Host calls `hostGame` → `setIsHost(true)` + `createPeer()`
2. `createPeer` captures `handleMessage` which closes over `isHost = false` (React hasn't re-rendered yet)
3. Joiner connects and sends `player-join` → host's `handleMessage` checks `if (isHost)` → **false** → message ignored
4. Joiner never gets added to `gameState.players`
5. Host clicks "Begin Journey" → `assignChallenges('start', gameState.players)` only sees the host player → assigns challenge only to host's ID
6. `syncGameState` broadcasts this to joiner → joiner receives state with `phase: 'story'` (game starts!) but `assignedChallenges` has no entry for joiner's `playerId` → **no challenge shown**

## Fix: Use refs for mutable values in callbacks

**File: `src/hooks/useGameState.ts`**

1. Add `isHostRef = useRef(false)` and `playerNameRef = useRef('')`
2. Keep them in sync: after each `setIsHost(val)` also set `isHostRef.current = val`, same for `playerName`
3. Update `handleMessage` to read `isHostRef.current` instead of closure-captured `isHost`
4. Update `createPeer`'s `onOpen` callback to read `playerNameRef.current` instead of closure-captured `playerName`
5. Update `submitChallengeSolution`, `chooseBranch`, `startBreakTimer` to also read from `isHostRef.current`

This ensures that when the WebRTC data channel opens (after React re-renders), the callbacks see the current `isHost = true` and correctly process `player-join`, adding the joiner to the players list before the game starts.

No other files need changes.

