import { useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface BreakScreenProps {
  timeLeft: number;
  onTimerStart: () => void;
}

export function BreakScreen({ timeLeft, onTimerStart }: BreakScreenProps) {
  useEffect(() => {
    onTimerStart();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center animate-float-in" style={{ boxShadow: 'var(--shadow-float)' }}>
        <div className="mb-6">
          <svg className="mx-auto w-24 h-24 opacity-40" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--zen-ocean))" strokeWidth="1" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="hsl(var(--zen-sage))" strokeWidth="1" strokeDasharray="4 4" className="animate-spin" style={{ animationDuration: '20s' }} />
            <circle cx="50" cy="50" r="5" fill="hsl(var(--zen-sunset))" className="animate-pulse-soft" />
          </svg>
        </div>

        <h3 className="text-2xl font-serif text-foreground mb-2">Breathe</h3>
        <p className="text-muted-foreground text-sm mb-6">Take a moment before the next chapter</p>

        <div className="text-4xl font-serif text-primary">{timeLeft}</div>
      </Card>
    </div>
  );
}
