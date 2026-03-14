import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Users, Copy, Check, Wifi, Loader2, Camera, CameraOff } from 'lucide-react';
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
  isGeneratingOffer?: boolean;
  onStart: () => void;
}

type TransferMode = 'qr' | 'code';

const SIGNAL_CODE_MAX_LENGTH = 24_000;

const isSafeSignalPayload = (value: string) => {
  const normalized = value.replace(/\s+/g, '').trim();
  return normalized.length > 0
    && normalized.length <= SIGNAL_CODE_MAX_LENGTH
    && /^[A-Za-z0-9+/=]+$/.test(normalized);
};

function QrCodeCard({ title, value }: { title: string; value: string }) {
  const [loadError, setLoadError] = useState(false);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(value)}`;

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{title}</p>
      {!loadError ? (
        <div className="rounded-lg border border-input bg-white p-3 flex justify-center">
          <img
            src={qrSrc}
            alt={title}
            className="h-56 w-56"
            onError={() => setLoadError(true)}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-input bg-muted p-4 text-sm text-muted-foreground text-center">
          Unable to generate QR code right now. You can still share the text code.
        </div>
      )}
    </div>
  );
}

function QrScanner({
  title,
  onScan,
}: {
  title: string;
  onScan: (value: string) => void;
}) {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;

    if (!('BarcodeDetector' in window)) {
      setStatus('QR scanning is not supported in this browser. Use text code mode instead.');
      return;
    }

    const detector = new (window as Window & { BarcodeDetector: new (options: { formats: string[] }) => { detect: (input: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>> } }).BarcodeDetector({ formats: ['qr_code'] });

    let stopped = false;

    const stopScanner = () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus('Scanning for a QR code...');

        intervalRef.current = window.setInterval(async () => {
          if (!videoRef.current) return;

          try {
            const barcodes = await detector.detect(videoRef.current);
            const rawValue = barcodes[0]?.rawValue;
            if (!rawValue) return;

            if (!isSafeSignalPayload(rawValue)) {
              setStatus('Detected QR, but payload is invalid.');
              return;
            }

            setStatus('Code scanned successfully.');
            stopScanner();
            setActive(false);
            onScan(rawValue);
          } catch {
            // ignore transient detection errors while scanning
          }
        }, 450);
      } catch {
        setStatus('Camera access denied or unavailable. Please allow camera permission or use text code mode.');
        setActive(false);
      }
    };

    void start();

    return () => {
      stopped = true;
      stopScanner();
    };
  }, [active, onScan]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            setStatus(null);
            setActive(v => !v);
          }}
        >
          {active ? <><CameraOff className="h-4 w-4 mr-2" /> Stop Scanner</> : <><Camera className="h-4 w-4 mr-2" /> Scan QR</>}
        </Button>
      </div>
      {active && (
        <div className="rounded-lg border border-input bg-black/90 p-2">
          <video ref={videoRef} className="w-full rounded-md" playsInline muted />
        </div>
      )}
      {status && <p className="text-xs text-muted-foreground">{status}</p>}
    </div>
  );
}

export function Lobby({
  playerName, setPlayerName, players,
  sdpOffer, sdpAnswer,
  onHost, onJoin, onHandleAnswer, onGenerateNewOffer, isGeneratingOffer = false, onStart,
}: LobbyProps) {
  const [mode, setMode] = useState<'choose' | 'host' | 'join'>('choose');
  const [transferMode, setTransferMode] = useState<TransferMode>('qr');
  const [joinOffer, setJoinOffer] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [acceptStatus, setAcceptStatus] = useState<string | null>(null);

  useEffect(() => {
    setAcceptStatus(null);
  }, [sdpOffer]);

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
      setAcceptStatus('Player connected. New invite code generated.');
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

          <div className="mb-4">
            <label className="text-sm text-muted-foreground block mb-2">Transfer method</label>
            <select
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={transferMode}
              onChange={(e) => setTransferMode(e.target.value as TransferMode)}
            >
              <option value="qr">QR code (recommended)</option>
              <option value="code">Base64 text code</option>
            </select>
          </div>

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
              {transferMode === 'qr' ? (
                <QrScanner
                  title="Scan host's invite QR"
                  onScan={(value) => {
                    setJoinOffer(value);
                    onJoin(value);
                  }}
                />
              ) : (
                <>
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
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Send this answer code back to the host:</p>
              {transferMode === 'qr' ? (
                <QrCodeCard title="Answer QR code" value={sdpAnswer} />
              ) : (
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
              )}
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
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Transfer method</label>
              <select
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={transferMode}
                onChange={(e) => setTransferMode(e.target.value as TransferMode)}
              >
                <option value="qr">QR code (recommended)</option>
                <option value="code">Base64 text code</option>
              </select>
            </div>

            <p className="text-sm text-muted-foreground">Share this code with players:</p>
            {transferMode === 'qr' ? (
              <QrCodeCard title="Invite QR code" value={sdpOffer} />
            ) : (
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
            )}

            <div className="space-y-2">
              {transferMode === 'qr' ? (
                <QrScanner
                  title="Scan player's answer QR"
                  onScan={(value) => {
                    setAnswerInput(value);
                    setAcceptStatus(null);
                  }}
                />
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Paste player's answer code:</p>
                  <textarea
                    className="w-full h-20 rounded-lg border border-input bg-background p-3 text-xs font-mono resize-none"
                    placeholder="Paste answer code..."
                    value={answerInput}
                    onChange={(e) => { setAnswerInput(e.target.value); setAcceptStatus(null); }}
                  />
                </>
              )}
              {acceptStatus && (
                <p className={`text-xs ${acceptStatus.includes('accepted') || acceptStatus.includes('connected') ? 'text-zen-sage' : 'text-destructive'}`}>
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
                <Button
                  variant="secondary"
                  onClick={onGenerateNewOffer}
                  disabled={isGeneratingOffer}
                  className="flex-1"
                >
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
