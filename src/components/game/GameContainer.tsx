import { useGameState } from '@/hooks/useGameState';
import { WavesBackground } from './WavesBackground';
import { Lobby } from './Lobby';
import { StoryPanel } from './StoryPanel';
import { ChallengePanel } from './ChallengePanel';
import { PlayerStatus } from './PlayerStatus';
import { BreakScreen } from './BreakScreen';
import { EndingScreen } from './EndingScreen';

export function GameContainer() {
  const game = useGameState();

  const currentChallenge = game.gameState.assignedChallenges[game.playerId];
  const solverName = game.gameState.solvedBy
    ? game.gameState.players.find(p => p.id === game.gameState.solvedBy)?.name || null
    : null;

  const renderPhase = () => {
    switch (game.gameState.phase) {
      case 'lobby':
        return (
          <Lobby
            playerName={game.playerName}
            setPlayerName={game.setPlayerName}
            isHost={game.isHost}
            players={game.gameState.players}
            sdpOffer={game.sdpOffer}
            sdpAnswer={game.sdpAnswer}
            onHost={game.hostGame}
            onJoin={game.joinGame}
            onHandleAnswer={game.handleAnswerInput}
            onGenerateNewOffer={game.generateNewOffer}
            isGeneratingOffer={game.isGeneratingOffer}
            onStart={game.startGame}
          />
        );

      case 'story':
        return (
          <StoryPanel
            gameState={game.gameState}
            onChooseBranch={game.chooseBranch}
            onProceedToChallenge={game.proceedToChallenge}
            isHost={game.isHost}
          />
        );

      case 'challenge':
        return (
          <ChallengePanel
            challenge={currentChallenge}
            solvedBy={game.gameState.solvedBy}
            playerName={game.playerName}
            solverName={solverName}
            onSubmit={(answer) => {
              const correct = game.submitChallengeSolution(answer);
              return correct;
            }}
          />
        );

      case 'break':
        return (
          <BreakScreen
            timeLeft={game.gameState.breakTimeLeft}
            onTimerStart={game.startBreakTimer}
          />
        );

      case 'ending':
        return (
          <EndingScreen
            nodeId={game.gameState.currentNodeId}
            players={game.gameState.players}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen">
      <WavesBackground />
      {renderPhase()}
      {game.gameState.phase !== 'lobby' && (
        <PlayerStatus
          players={game.gameState.players}
          currentPlayerId={game.playerId}
          solvedBy={game.gameState.solvedBy}
        />
      )}
    </div>
  );
}
