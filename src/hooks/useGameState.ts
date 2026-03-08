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

const BREAK_DURATION = 5;

export function useGameState() {
  const [playerId] = useState(() => crypto.randomUUID());
  const [playerName, setPlayerName] = useState('');
  const [isHost, setIsHost] = useState(false);
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
  const [pendingOffers, setPendingOffers] = useState<string[]>([]);
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
        if (isHost) {
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
        if (isHost) {
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
        if (isHost) {
          const nextNodeId = msg.payload.nextNodeId;
          advanceToNode(nextNodeId);
        }
        break;
      case 'player-ready':
        break;
    }
  }, [isHost, syncGameState]);

  const createPeer = useCallback((peerId: string) => {
    const peer = new PeerConnection(
      peerId,
      handleMessage,
      () => {
        peer.send({
          type: 'player-join',
          payload: { id: playerId, name: playerName },
          senderId: playerId,
          timestamp: Date.now(),
        });
      },
      () => {
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
  }, [handleMessage, playerId, playerName]);

  const hostGame = useCallback(async () => {
    setIsHost(true);
    setGameState(prev => ({
      ...prev,
      players: [{ id: playerId, name: playerName, xp: 0, solved: 0, connected: true }],
    }));
    const peer = createPeer('joiner');
    const offer = await peer.createOffer();
    setSdpOffer(btoa(offer));
  }, [playerId, playerName, createPeer]);

  const generateNewOffer = useCallback(async () => {
    const peerId = `joiner-${Date.now()}`;
    const peer = createPeer(peerId);
    const offer = await peer.createOffer();
    setSdpOffer(btoa(offer));
    setPendingOffers(prev => [...prev, peerId]);
  }, [createPeer]);

  const handleAnswerInput = useCallback(async (answerStr: string) => {
    const lastPeerId = pendingOffers.length > 0
      ? pendingOffers[pendingOffers.length - 1]
      : 'joiner';
    const peer = peersRef.current.get(lastPeerId);
    if (peer) {
      await peer.handleAnswer(atob(answerStr));
    }
  }, [pendingOffers]);

  const joinGame = useCallback(async (offerStr: string) => {
    const peer = createPeer('host');
    const answer = await peer.handleOffer(offerStr);
    setSdpAnswer(answer);
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
