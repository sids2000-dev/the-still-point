import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Challenge } from '@/data/storyContent';
import { Brain, Calculator, Lightbulb, BookOpen, Check, X } from 'lucide-react';

interface ChallengePanelProps {
  challenge: Challenge | undefined;
  solvedBy: string | null;
  playerName: string;
  solverName: string | null;
  onSubmit: (answer: string) => boolean;
}

const typeIcons = {
  vocabulary: BookOpen,
  math: Calculator,
  logic: Brain,
};

const typeLabels = {
  vocabulary: 'Vocabulary',
  math: 'Math Puzzle',
  logic: 'Logic Problem',
};

export function ChallengePanel({ challenge, solvedBy, playerName, solverName, onSubmit }: ChallengePanelProps) {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  if (!challenge) {
    return (
      <div className="flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center animate-float-in" style={{ boxShadow: 'var(--shadow-float)' }}>
          <Lightbulb className="h-8 w-8 mx-auto mb-4 text-muted-foreground animate-pulse-soft" />
          <p className="text-muted-foreground">Waiting for challenges to be assigned...</p>
        </Card>
      </div>
    );
  }

  const Icon = typeIcons[challenge.type];

  const handleSubmit = () => {
    const correct = onSubmit(answer);
    setFeedback(correct ? 'correct' : 'wrong');
    if (!correct) {
      setTimeout(() => setFeedback(null), 1500);
      setAnswer('');
    }
  };

  if (solvedBy) {
    return (
      <div className="flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center animate-float-in" style={{ boxShadow: 'var(--shadow-float)' }}>
          <Check className="h-12 w-12 mx-auto mb-4 text-zen-sage" />
          <h3 className="text-xl font-serif text-foreground mb-2">Challenge Complete!</h3>
          <p className="text-muted-foreground">
            {solverName || 'A teammate'} solved their challenge. The team advances!
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 animate-float-in" style={{ boxShadow: 'var(--shadow-float)' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">{typeLabels[challenge.type]}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            Difficulty {challenge.difficulty}
          </Badge>
        </div>

        <p className="text-lg font-serif text-foreground mb-6 leading-relaxed">
          {challenge.prompt}
        </p>

        <div className="space-y-3">
          <Input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Your answer..."
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className={feedback === 'wrong' ? 'border-destructive' : ''}
          />
          <Button onClick={handleSubmit} disabled={!answer.trim()} className="w-full">
            Submit Answer
          </Button>

          {feedback === 'wrong' && (
            <div className="flex items-center gap-2 text-destructive text-sm justify-center">
              <X className="h-4 w-4" />
              <span>Not quite — try again!</span>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Any teammate solving their challenge advances the whole team
        </p>
      </Card>
    </div>
  );
}
