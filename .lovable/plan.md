

## Problem

The joiner gets stuck on "Waiting for host to complete connection..." because the Lobby UI has no "connected" state for joiners. Even after the WebRTC data channel opens and the host syncs game state (including the joiner in the players list), the joiner's Lobby still shows the "paste answer code" screen because it only checks `sdpAnswer` to decide what to render.

The connection actually works -- the issue is purely UI on the joiner side.

## Plan

### 1. Track connection status in Lobby (joiner side)

In `src/components/game/Lobby.tsx`, detect when the joiner is connected by checking if `players.length > 0` while in join mode. When connected, show a "Connected! Waiting for host to start..." screen with the player list, instead of the "send answer code" screen.

### 2. Update joiner's join UI flow

Replace the current two-state join view (`!sdpAnswer` → paste offer, `sdpAnswer` → show answer code) with three states:

1. **No answer yet**: Paste the host's offer code
2. **Answer generated, not connected**: Show answer code + "Send this to host"
3. **Connected** (players list has entries): Show player list + "Waiting for host to begin..."

Detection: `sdpAnswer && players.length > 0` means the joiner received a `game-state` sync from the host, confirming the data channel is open and working.

### 3. Files to change

- **`src/components/game/Lobby.tsx`**: Add a third branch in the join mode rendering that shows a connected waiting room when `players.length > 0` and `sdpAnswer` is set.

No changes needed to `useGameState.ts` or `webrtc.ts` -- the connection works, only the UI is missing.

