import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function WavesBackground() {
  const [musicOn, setMusicOn] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio with ocean waves from a free source
    const audio = new Audio();
    audio.loop = true;
    audio.volume = 0.3;
    // Use a data URL for a simple ambient tone since we can't rely on external URLs
    // We'll use the Web Audio API instead
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    if (!musicOn) {
      audioRef.current?.pause();
      return;
    }
    // Generate ambient ocean-like sound using Web Audio API
    const ctx = new AudioContext();
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < bufferSize; i++) {
        // Brown noise (more ocean-like)
        const white = Math.random() * 2 - 1;
        data[i] = i > 0 ? (data[i - 1] + 0.02 * white) / 1.02 : white;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = 0.15;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;

    // Create LFO for wave-like modulation
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.1;
    lfoGain.gain.value = 0.05;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    return () => {
      source.stop();
      lfo.stop();
      ctx.close();
    };
  }, [musicOn]);

  return (
    <>
      {/* SVG Wave Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-background" />
        <svg
          className="absolute bottom-0 w-full animate-wave-drift opacity-20"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          style={{ height: '40%' }}
        >
          <path
            fill="hsl(var(--zen-ocean))"
            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,218.7C672,235,768,245,864,234.7C960,224,1056,192,1152,181.3C1248,171,1344,181,1392,186.7L1440,192L1440,320L0,320Z"
          />
        </svg>
        <svg
          className="absolute bottom-0 w-full opacity-15"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          style={{ height: '35%', animationDelay: '-3s', animation: 'wave-drift 12s ease-in-out infinite' }}
        >
          <path
            fill="hsl(var(--zen-sage))"
            d="M0,288L48,272C96,256,192,224,288,213.3C384,203,480,213,576,229.3C672,245,768,267,864,261.3C960,256,1056,224,1152,213.3C1248,203,1344,213,1392,218.7L1440,224L1440,320L0,320Z"
          />
        </svg>

        {/* Doodle circles */}
        <svg className="absolute top-10 right-10 w-32 h-32 opacity-10 animate-pulse-soft" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--zen-sunset))" strokeWidth="1.5" strokeDasharray="8 4" />
          <circle cx="50" cy="50" r="25" fill="none" stroke="hsl(var(--zen-ocean))" strokeWidth="1" strokeDasharray="5 3" />
        </svg>
        <svg className="absolute top-1/3 left-8 w-24 h-24 opacity-10" viewBox="0 0 100 100">
          <path d="M20,80 Q50,10 80,80" fill="none" stroke="hsl(var(--zen-sage))" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M30,75 Q50,20 70,75" fill="none" stroke="hsl(var(--zen-sunset))" strokeWidth="1" strokeLinecap="round" />
        </svg>
        <svg className="absolute bottom-1/4 right-1/4 w-20 h-20 opacity-10" viewBox="0 0 100 100">
          <polygon points="50,10 90,90 10,90" fill="none" stroke="hsl(var(--zen-ocean))" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Music toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMusicOn(!musicOn)}
        className="fixed top-4 right-4 z-50"
        aria-label={musicOn ? 'Mute music' : 'Play music'}
      >
        {musicOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
      </Button>
    </>
  );
}
