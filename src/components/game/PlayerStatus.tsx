import { Player } from '@/hooks/useGameState';
import { Star, Trophy } from 'lucide-react';

interface PlayerStatusProps {
  players: Player[];
  currentPlayerId: string;
  solvedBy: string | null;
}

export function PlayerStatus({ players, currentPlayerId, solvedBy }: PlayerStatusProps) {
  if (players.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex gap-2 bg-card/80 backdrop-blur-md rounded-full px-4 py-2 border border-border" style={{ boxShadow: 'var(--shadow-zen)' }}>
      {players.map(player => {
        const xp = Number.isFinite(player.xp) ? player.xp : 0;
        const solved = Number.isFinite(player.solved) ? player.solved : 0;

        return (
          <div
            key={player.id}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm transition-all ${
              player.id === currentPlayerId ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
            } ${solvedBy === player.id ? 'ring-2 ring-zen-sunset' : ''}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${player.connected ? 'bg-zen-sage' : 'bg-destructive'}`} />
            <span className="font-medium text-xs">{player.name}</span>
            <span className="flex items-center gap-0.5 text-xs">
              <Star className="h-3 w-3" />
              {xp}
            </span>
            {solved > 0 && (
              <span className="flex items-center gap-0.5 text-xs">
                <Trophy className="h-3 w-3" />
                {solved}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
