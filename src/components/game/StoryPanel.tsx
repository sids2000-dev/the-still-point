import { storyNodes } from '@/data/storyContent';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GameState } from '@/hooks/useGameState';
import { BookOpen } from 'lucide-react';

interface StoryPanelProps {
  gameState: GameState;
  onChooseBranch: (nodeId: string) => void;
  onStartChallenge: () => void;
  isHost: boolean;
}

export function StoryPanel({ gameState, onChooseBranch, onStartChallenge, isHost }: StoryPanelProps) {
  const node = storyNodes[gameState.currentNodeId];
  if (!node) return null;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 animate-float-in" style={{ boxShadow: 'var(--shadow-float)' }}>
        <div className="flex items-center gap-2 mb-6 text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span className="text-xs uppercase tracking-widest">Chapter {gameState.roundNumber}</span>
        </div>

        <p className="text-lg leading-relaxed font-serif text-foreground mb-8 whitespace-pre-line">
          {node.narrative}
        </p>

        {node.branches.length > 0 && !gameState.solvedBy && (
          <div className="space-y-4">
            <Button onClick={onStartChallenge} className="w-full h-12">
              Face the Challenge
            </Button>
          </div>
        )}

        {gameState.solvedBy && node.branches.length > 0 && (
          <div className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground text-center mb-2">Choose your path:</p>
            {node.branches.map((branch) => (
              <Button
                key={branch.nextNodeId}
                variant="secondary"
                onClick={() => onChooseBranch(branch.nextNodeId)}
                className="w-full h-auto py-3 text-left justify-start"
                disabled={!isHost}
              >
                {branch.label}
              </Button>
            ))}
            {!isHost && (
              <p className="text-xs text-muted-foreground text-center">The host will choose the path</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
