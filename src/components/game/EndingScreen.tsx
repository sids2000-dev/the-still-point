import { storyNodes } from '@/data/storyContent';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Player } from '@/hooks/useGameState';
import { Star, Trophy, Coffee } from 'lucide-react';

interface EndingScreenProps {
  nodeId: string;
  players: Player[];
}

export function EndingScreen({ nodeId, players }: EndingScreenProps) {
  const node = storyNodes[nodeId];
  const totalXp = players.reduce((sum, p) => sum + p.xp, 0);
  const totalSolved = players.reduce((sum, p) => sum + p.solved, 0);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 animate-float-in" style={{ boxShadow: 'var(--shadow-float)' }}>
        <p className="text-lg leading-relaxed font-serif text-foreground mb-8 whitespace-pre-line">
          {node?.narrative}
        </p>

        <div className="border-t border-border pt-6 mb-6">
          <h3 className="text-lg font-serif text-foreground mb-4 text-center">Journey Complete</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 rounded-lg bg-muted">
              <Star className="h-6 w-6 mx-auto mb-1 text-zen-sunset" />
              <div className="text-2xl font-serif text-foreground">{totalXp}</div>
              <div className="text-xs text-muted-foreground">Total XP</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <Trophy className="h-6 w-6 mx-auto mb-1 text-zen-sunset" />
              <div className="text-2xl font-serif text-foreground">{totalSolved}</div>
              <div className="text-xs text-muted-foreground">Challenges Solved</div>
            </div>
          </div>

          <div className="space-y-2 mb-8">
            {players.sort((a, b) => b.xp - a.xp).map((player, i) => (
              <div key={player.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">#{i + 1}</span>
                  <span className="text-sm text-foreground">{player.name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{player.xp} XP</span>
                  <span>{player.solved} solved</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Buy me a coffee */}
        <div className="border-t border-border pt-6 text-center">
          <p className="text-sm text-muted-foreground mb-3 font-serif italic">Loved this game?</p>
          <a
            href="https://buymeacoffee.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary" className="gap-2">
              <Coffee className="h-4 w-4" />
              Buy me a coffee
            </Button>
          </a>
        </div>

        <div className="mt-6 text-center">
          <Button onClick={() => window.location.reload()} className="gap-2">
            Play Again
          </Button>
        </div>
      </Card>
    </div>
  );
}
