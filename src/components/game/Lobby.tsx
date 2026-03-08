import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Users, Copy, Check, Wifi, Loader2 } from 'lucide-react';
import { Player } from '@/hooks/useGameState';

interface LobbyProps {
  playerName: string;
  setPlayerName: (n: string) => void;
  isHost: boolean;
  players: Player[];
  sdpOffer: string;
  sdpAnswer: string;
  onHost: () => void;
  onJoin: (offer: string) => void;
  onHandleAnswer: (answer: string) => Promise<{ success: boolean; error?: string }>;
  onGenerateNewOffer: () => void;
  onStart: () => void;
}

export function Lobby({
  playerName, setPlayerName, isHost, players,
  sdpOffer, sdpAnswer,
  onHost, onJoin, onHandleAnswer, onGenerateNewOffer, onStart,
}: LobbyProps) {
  const [mode, setMode] = useState<'choose' | 'host' | 'join'>('choose');
  const [joinOffer, setJoinOffer] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [acceptStatus, setAcceptStatus] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAcceptPlayer = async () => {
    if (accepting || !answerInput.trim()) return;
    setAccepting(true);
    setAcceptStatus(null);
    const result = await onHandleAnswer(answerInput);
    if (result.success) {
      setAcceptStatus('Answer accepted, connecting...');
      setAnswerInput('');
    } else {
      setAcceptStatus(result.error || 'Failed to accept player');
    }
    setAccepting(false);
  };

  if (mode === 'choose') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 animate-float-in" style={{ boxShadow: 'var(--shadow-float)' }}>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-serif mb-2 text-foreground">The Still Point</h1>
            <p className="text-muted-foreground text-sm">A journey of mind, spirit and togetherness</p>
          </div>

          <div className="space-y-4">
            <Input
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="text-center text-lg"
            />

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => { setMode('host'); onHost(); }}
                disabled={!playerName.trim()}
                className="h-16 flex-col gap-1"
              >
                <Wifi className="h-5 w-5" />
                <span className="text-xs">Host Game</span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => setMode('join')}
                disabled={!playerName.trim()}
                className="h-16 flex-col gap-1"
              >
                <Users className="h-5 w-5" />
                <span className="text-xs">Join Game</span>
              </Button>
            </div>
          </div>

          <div className="mt-8 flex justify-center opacity-20">
            <svg width="120" height="40" viewBox="0 0 120 40">
              <path d="M10,30 Q30,5 60,20 Q90,35 110,10" fill="none" stroke="hsl(var(--zen-sunset))" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </Card>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-lg p-8 animate-float-in" style={{ boxShadow: 'var(--shadow-float)' }}>
          <h2 className="text-2xl font-serif mb-4 text-foreground">Join Game</h2>

          {sdpAnswer && players.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Connected! Waiting for host to begin...</p>
              <div className="space-y-2">
                {players.map(p => (
                  <div key={p.id} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                    <div className={`w-2 h-2 rounded-full ${p.connected ? 'bg-zen-sage' : 'bg-destructive'}`} />
                    <span className="text-sm text-foreground">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : !sdpAnswer ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Paste the host's connection code below:</p>
              <textarea
                className="w-full h-24 rounded-lg border border-input bg-background p-3 text-xs font-mono resize-none"
                placeholder="Paste offer code here..."
                value={joinOffer}
                onChange={(e) => setJoinOffer(e.target.value)}
              />
              <Button onClick={() => onJoin(joinOffer)} disabled={!joinOffer.trim()} className="w-full">
                Connect
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Send this answer code back to the host:</p>
              <div className="relative">
                <textarea
                  className="w-full h-24 rounded-lg border border-input bg-muted p-3 text-xs font-mono resize-none"
                  value={sdpAnswer}
                  readOnly
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(sdpAnswer)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">Waiting for host to complete connection...</p>
            </div>
          )}

          <Button variant="ghost" onClick={() => setMode('choose')} className="mt-4 w-full">
            Back
          </Button>
        </Card>
      </div>
    );
  }

  // Host mode
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg p-8 animate-float-in" style={{ boxShadow: 'var(--shadow-float)' }}>
        <h2 className="text-2xl font-serif mb-4 text-foreground">Host Game</h2>

        {/* Players */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Players ({players.length}/5)</h3>
          <div className="space-y-2">
            {players.map(p => (
              <div key={p.id} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                <div className={`w-2 h-2 rounded-full ${p.connected ? 'bg-zen-sage' : 'bg-destructive'}`} />
                <span className="text-sm text-foreground">{p.name}</span>
                {p.id === players[0]?.id && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-auto">Host</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Connection code */}
        {sdpOffer && (
          <div className="space-y-3 mb-6">
            <p className="text-sm text-muted-foreground">Share this code with players:</p>
            <div className="relative">
              <textarea
                className="w-full h-20 rounded-lg border border-input bg-muted p-3 text-xs font-mono resize-none"
                value={sdpOffer}
                readOnly
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(sdpOffer)}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Paste player's answer code:</p>
              <textarea
                className="w-full h-20 rounded-lg border border-input bg-background p-3 text-xs font-mono resize-none"
                placeholder="Paste answer code..."
                value={answerInput}
                onChange={(e) => { setAnswerInput(e.target.value); setAcceptStatus(null); }}
              />
              {acceptStatus && (
                <p className={`text-xs ${acceptStatus.includes('accepted') ? 'text-zen-sage' : 'text-destructive'}`}>
                  {acceptStatus}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={handleAcceptPlayer}
                  disabled={!answerInput.trim() || accepting}
                  className="flex-1"
                >
                  {accepting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Accepting...</> : 'Accept Player'}
                </Button>
                <Button variant="secondary" onClick={onGenerateNewOffer} className="flex-1">
                  New Invite Code
                </Button>
              </div>
            </div>
          </div>
        )}

        <Button onClick={onStart} disabled={players.length < 1} className="w-full h-12 text-lg">
          Begin Journey
        </Button>

        <Button variant="ghost" onClick={() => setMode('choose')} className="mt-2 w-full">
          Back
        </Button>
      </Card>
    </div>
  );
}
