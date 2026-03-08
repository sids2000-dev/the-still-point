
Goal: fix the host/join handshake so joining actually succeeds (not just suppressing the warning).

1) Reframe the issue (from your latest answer)
- Current state: join fails in UI.
- Log sequence shows `handleAnswer` is called once in the correct state (`have-local-offer`) and then again in `stable`.
- This indicates duplicate answer processing and weak peer-answer matching logic; the warning is a symptom, not the root cause.

2) Implementation plan (targeted files)

A. Harden signaling state flow in `src/hooks/useGameState.ts`
- Replace `pendingOffers: string[]` with a structured offer registry:
  - `pendingOffers: Array<{ peerId: string; offerCode: string; status: 'awaiting-answer' | 'answered' | 'connected' }>`
- On `hostGame` and `generateNewOffer`, register each new offer entry consistently (currently initial host offer is handled differently from new invites).
- In `handleAnswerInput`:
  - Normalize answer input (`trim`, remove all whitespace/newlines before decode).
  - Choose exactly one target peer with status `awaiting-answer` and `signalingState === 'have-local-offer'`.
  - After successful `handleAnswer`, mark offer as `answered` so repeated clicks can’t reapply the same answer.
  - If no valid peer is awaiting answer, show user-friendly feedback instead of attempting anyway.
- Add explicit error handling for invalid base64/decode failure and invalid SDP JSON.

B. Improve host UI behavior in `src/components/game/Lobby.tsx`
- Add local “accepting” state to disable “Accept Player” while processing.
- Prevent duplicate submissions by:
  - disabling button while request in progress
  - optional single-use lock until input changes
- Surface clear states:
  - “Answer accepted, waiting for player data channel…”
  - “Invalid answer code”
  - “No pending invite found for this answer”
- Keep “New Invite Code” behavior but ensure old pending offers are marked stale/closed to avoid ambiguity.

C. Strengthen WebRTC ICE completion in `src/lib/webrtc.ts`
- Replace current `waitForIce` fallback-only approach with robust completion logic:
  - resolve on `icecandidate` null event and/or `icegatheringstate === 'complete'`
  - use timeout as true fallback, but longer and properly cleaned up
- Keep guard in `handleAnswer`, but make it idempotent:
  - if already `stable` and remote description already set, ignore silently (or info log), not warning spam.
- Add lightweight debug metadata in logs (peerId + short connection phase), so future failures are traceable.

D. Connection lifecycle cleanup in `src/hooks/useGameState.ts`
- On creating a replacement invite, optionally close stale unconnected peers.
- On `onOpen`, mark pending offer entry as `connected`.
- On `onClose`, mark disconnected in both players list and offer registry.

3) Why this should fix your “join fails”
- Today the host can apply answers to the wrong/stale peer or apply the same answer twice.
- The new flow makes invite→answer mapping deterministic and single-use.
- Better ICE completion increases chance that copied SDP is actually connectable across devices.
- UI-level locking removes accidental double submit race conditions.

4) Validation checklist (end-to-end)
- Host creates initial invite; joiner pastes offer; joiner returns answer; host accepts once; joiner appears in player list.
- Host clicking “Accept Player” twice does not break state and does not emit wrong-state warning.
- “New Invite Code” followed by old answer is rejected with clear message.
- Test with 2 browsers/devices on same Wi-Fi.
- Test copy/paste with wrapped multiline codes (whitespace tolerated).

5) Technical details (concise)
- Main refactor scope:
  - `useGameState`: signaling registry + deterministic peer selection + decode/parse guards + stale cleanup.
  - `Lobby`: submission lock and status messaging.
  - `webrtc`: ICE completion reliability + idempotent answer handling.
- No backend/db changes required; fully frontend/WebRTC.
