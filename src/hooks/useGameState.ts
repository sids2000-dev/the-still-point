import { useState, useCallback, useRef } from 'react';
import { storyNodes, Challenge } from '@/data/storyContent';
import { PeerConnection, GameMessage } from '@/lib/webrtc';

export interface Player {
  id: string;
  name: string;
  xp: number;
  solved: number;
  connected: boolean;
}

export type GamePhase = 'lobby' | 'story' | 'challenge' | 'break' | 'ending';

export interface GameState {
  phase: GamePhase;
  currentNodeId: string;
  players: Player[];
  assignedChallenges: Record<string, Challenge>;
  solvedBy: string | null;
  roundNumber: number;
  breakTimeLeft: number;
}

interface PendingOffer {
  peerId: string;
  status: 'awaiting-answer' | 'answered' | 'connected';
}

const BREAK_DURATION = 5;

export function useGameState() {
  const [playerId] = useState(() => crypto.randomUUID());
  const [playerName, _setPlayerName] = useState('');
  const [isHost, _setIsHost] = useState(false);
  const isHostRef = useRef(false);
  const playerNameRef = useRef('');

  const setPlayerName = useCallback((name: string) => {
    playerNameRef.current = name;
    _setPlayerName(name);
  }, []);

  const setIsHost = useCallback((val: boolean) => {
    isHostRef.current = val;
    _setIsHost(val);
  }, []);
  const [gameState, setGameState] = useState<GameState>({
    phase: 'lobby',
    currentNodeId: 'start',
    players: [],
    assignedChallenges: {},
    solvedBy: null,
    roundNumber: 0,
    breakTimeLeft: 0,
  });
  const [sdpOffer, setSdpOffer] = useState('');
  const [sdpAnswer, setSdpAnswer] = useState('');
  const pendingOffersRef = useRef<PendingOffer[]>([]);
  const peersRef = useRef<Map<string, PeerConnection>>(new Map());
  const breakTimerRef = useRef<number | null>(null);

  const broadcastToAll = useCallback((msg: GameMessage) => {
    peersRef.current.forEach(peer => peer.send(msg));
  }, []);

  const syncGameState = useCallback((state: GameState) => {
    setGameState(state);
    broadcastToAll({
      type: 'game-state',
      payload: state,
      senderId: playerId,
      timestamp: Date.now(),
    });
  }, [broadcastToAll, playerId]);

  const handleMessage = useCallback((msg: GameMessage) => {
    switch (msg.type) {
      case 'game-state':
        setGameState(msg.payload);
        break;
      case 'player-join':
        if (isHostRef.current) {
          setGameState(prev => {
            const exists = prev.players.some(p => p.id === msg.payload.id);
            if (exists) return prev;
            const updated = {
              ...prev,
              players: [...prev.players, { ...msg.payload, connected: true }],
            };
            setTimeout(() => syncGameState(updated), 100);
            return updated;
          });
        }
        break;
      case 'challenge-solved':
        if (isHostRef.current) {
          setGameState(prev => {
            if (prev.solvedBy) return prev;
            const solverId = msg.payload.playerId;
            const updated: GameState = {
              ...prev,
              solvedBy: solverId,
              phase: 'break',
              breakTimeLeft: BREAK_DURATION,
              players: prev.players.map(p =>
                p.id === solverId ? { ...p, xp: p.xp + (prev.roundNumber + 1) * 10, solved: p.solved + 1 } : p
              ),
            };
            syncGameState(updated);
            return updated;
          });
        }
        break;
      case 'advance-story':
        if (isHostRef.current) {
          const nextNodeId = msg.payload.nextNodeId;
          advanceToNode(nextNodeId);
        }
        break;
      case 'player-ready':
        break;
    }
  }, [syncGameState]);

  const markOfferStatus = useCallback((peerId: string, status: PendingOffer['status']) => {
    pendingOffersRef.current = pendingOffersRef.current.map(o =>
      o.peerId === peerId ? { ...o, status } : o
    );
  }, []);

  const createPeer = useCallback((peerId: string) => {
    const peer = new PeerConnection(
      peerId,
      handleMessage,
      () => {
        console.log(`[gameState] Peer ${peerId} connected`);
        markOfferStatus(peerId, 'connected');
        peer.send({
          type: 'player-join',
          payload: { id: playerId, name: playerNameRef.current },
          senderId: playerId,
          timestamp: Date.now(),
        });
      },
      () => {
        console.log(`[gameState] Peer ${peerId} disconnected`);
        markOfferStatus(peerId, 'awaiting-answer');
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(p =>
            p.id === peerId ? { ...p, connected: false } : p
          ),
        }));
      }
    );
    peersRef.current.set(peerId, peer);
    return peer;
  }, [handleMessage, playerId, markOfferStatus]);

  const hostGame = useCallback(async () => {
    setIsHost(true);
    setGameState(prev => ({
      ...prev,
      players: [{ id: playerId, name: playerName, xp: 0, solved: 0, connected: true }],
    }));
    const peerId = `joiner-${Date.now()}`;
    const peer = createPeer(peerId);
    const offer = await peer.createOffer();
    const encoded = btoa(offer);
    setSdpOffer(encoded);
    pendingOffersRef.current = [{ peerId, status: 'awaiting-answer' }];
  }, [playerId, playerName, createPeer]);

  const generateNewOffer = useCallback(async () => {
    // Close stale peers that never connected
    for (const entry of pendingOffersRef.current) {
      if (entry.status === 'awaiting-answer') {
        const stalePeer = peersRef.current.get(entry.peerId);
        if (stalePeer) {
          stalePeer.close();
          peersRef.current.delete(entry.peerId);
        }
      }
    }
    // Remove stale entries
    pendingOffersRef.current = pendingOffersRef.current.filter(o => o.status === 'connected');

    const peerId = `joiner-${Date.now()}`;
    const peer = createPeer(peerId);
    const offer = await peer.createOffer();
    const encoded = btoa(offer);
    setSdpOffer(encoded);
    pendingOffersRef.current.push({ peerId, status: 'awaiting-answer' });
  }, [createPeer]);

  const handleAnswerInput = useCallback(async (answerStr: string): Promise<{ success: boolean; error?: string }> => {
    const trimmed = answerStr.replace(/\s+/g, '').trim();
    if (!trimmed) return { success: false, error: 'Empty answer code' };

    // Find a peer awaiting answer
    const entry = pendingOffersRef.current.find(
      o => o.status === 'awaiting-answer'
    );

    if (!entry) {
      return { success: false, error: 'No pending invite. Generate a new invite code first.' };
    }

    const peer = peersRef.current.get(entry.peerId);
    if (!peer) {
      return { success: false, error: 'Peer not found. Generate a new invite code.' };
    }

    if (peer.pc.signalingState !== 'have-local-offer') {
      return { success: false, error: `Peer in unexpected state (${peer.pc.signalingState}). Generate a new invite code.` };
    }

    try {
      const decoded = atob(trimmed);
      JSON.parse(decoded); // validate JSON
      await peer.handleAnswer(decoded);
      markOfferStatus(entry.peerId, 'answered');
      return { success: true };
    } catch (e) {
      console.error('[gameState] Failed to handle answer:', e);
      return { success: false, error: 'Invalid answer code. Check that you copied it correctly.' };
    }
  }, [markOfferStatus]);

  const joinGame = useCallback(async (offerStr: string) => {
    const peer = createPeer('host');
    const answer = await peer.handleOffer(atob(offerStr.replace(/\s+/g, '').trim()));
    setSdpAnswer(btoa(answer));
  }, [createPeer]);

  const assignChallenges = useCallback((nodeId: string, players: Player[]): Record<string, Challenge> => {
    const node = storyNodes[nodeId];
    if (!node) return {};
    const pool = [...node.challengePool];
    const assignments: Record<string, Challenge> = {};
    const shuffled = pool.sort(() => Math.random() - 0.5);
    players.forEach((player, i) => {
      if (shuffled[i]) {
        assignments[player.id] = shuffled[i];
      }
    });
    return assignments;
  }, []);

  const startGame = useCallback(() => {
    const challenges = assignChallenges('start', gameState.players);
    const updated: GameState = {
      ...gameState,
      phase: 'story',
      currentNodeId: 'start',
      assignedChallenges: challenges,
      roundNumber: 1,
      solvedBy: null,
    };
    syncGameState(updated);
  }, [gameState, assignChallenges, syncGameState]);

  const advanceToNode = useCallback((nodeId: string) => {
    const node = storyNodes[nodeId];
    if (!node) return;

    if (node.isEnding) {
      const updated: GameState = {
        ...gameState,
        phase: 'ending',
        currentNodeId: nodeId,
        assignedChallenges: {},
        solvedBy: null,
      };
      syncGameState(updated);
      return;
    }

    const challenges = assignChallenges(nodeId, gameState.players);
    const updated: GameState = {
      ...gameState,
      phase: 'story',
      currentNodeId: nodeId,
      assignedChallenges: challenges,
      roundNumber: gameState.roundNumber + 1,
      solvedBy: null,
    };
    syncGameState(updated);
  }, [gameState, assignChallenges, syncGameState]);

  const submitChallengeSolution = useCallback((answer: string) => {
    const challenge = gameState.assignedChallenges[playerId];
    if (!challenge) return false;
    const correct = answer.toLowerCase().trim() === challenge.answer.toLowerCase().trim();
    if (correct) {
      if (isHost) {
        setGameState(prev => {
          if (prev.solvedBy) return prev;
          const updated: GameState = {
            ...prev,
            solvedBy: playerId,
            phase: 'break',
            breakTimeLeft: BREAK_DURATION,
            players: prev.players.map(p =>
              p.id === playerId ? { ...p, xp: p.xp + (prev.roundNumber + 1) * 10, solved: p.solved + 1 } : p
            ),
          };
          syncGameState(updated);
          return updated;
        });
      } else {
        broadcastToAll({
          type: 'challenge-solved',
          payload: { playerId },
          senderId: playerId,
          timestamp: Date.now(),
        });
      }
    }
    return correct;
  }, [gameState, playerId, isHost, syncGameState, broadcastToAll]);

  const chooseBranch = useCallback((nextNodeId: string) => {
    if (isHost) {
      advanceToNode(nextNodeId);
    } else {
      broadcastToAll({
        type: 'advance-story',
        payload: { nextNodeId },
        senderId: playerId,
        timestamp: Date.now(),
      });
    }
  }, [isHost, advanceToNode, broadcastToAll, playerId]);

  const startBreakTimer = useCallback(() => {
    if (breakTimerRef.current) clearInterval(breakTimerRef.current);
    breakTimerRef.current = window.setInterval(() => {
      setGameState(prev => {
        if (prev.breakTimeLeft <= 1) {
          if (breakTimerRef.current) clearInterval(breakTimerRef.current);
          const updated = { ...prev, breakTimeLeft: 0, phase: 'story' as GamePhase };
          if (isHost) {
            broadcastToAll({
              type: 'game-state',
              payload: updated,
              senderId: playerId,
              timestamp: Date.now(),
            });
          }
          return updated;
        }
        return { ...prev, breakTimeLeft: prev.breakTimeLeft - 1 };
      });
    }, 1000);
  }, [isHost, broadcastToAll, playerId]);

  return {
    playerId,
    playerName,
    setPlayerName,
    isHost,
    gameState,
    sdpOffer,
    sdpAnswer,
    hostGame,
    joinGame,
    handleAnswerInput,
    generateNewOffer,
    startGame,
    submitChallengeSolution,
    chooseBranch,
    startBreakTimer,
    advanceToNode,
  };
}
