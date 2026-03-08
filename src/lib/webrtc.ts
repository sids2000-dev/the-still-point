export type MessageType =
  | 'player-join'
  | 'game-state'
  | 'challenge-solved'
  | 'advance-story'
  | 'player-ready'
  | 'break-timer'
  | 'ping'
  | 'pong';

export interface GameMessage {
  type: MessageType;
  payload: any;
  senderId: string;
  timestamp: number;
}

export class PeerConnection {
  pc: RTCPeerConnection;
  channel: RTCDataChannel | null = null;
  onMessage: (msg: GameMessage) => void;
  onOpen: () => void;
  onClose: () => void;
  peerId: string;

  constructor(
    peerId: string,
    onMessage: (msg: GameMessage) => void,
    onOpen: () => void,
    onClose: () => void
  ) {
    this.peerId = peerId;
    this.onMessage = onMessage;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
  }

  async createOffer(): Promise<string> {
    this.channel = this.pc.createDataChannel('game');
    this.setupChannel(this.channel);

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    await this.waitForIce();
    return JSON.stringify(this.pc.localDescription);
  }

  async handleOffer(offerStr: string): Promise<string> {
    this.pc.ondatachannel = (e) => {
      this.channel = e.channel;
      this.setupChannel(this.channel);
    };

    const offer = JSON.parse(offerStr);
    await this.pc.setRemoteDescription(offer);
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    await this.waitForIce();
    return JSON.stringify(this.pc.localDescription);
  }

  async handleAnswer(answerStr: string) {
    const state = this.pc.signalingState;
    console.log(`[webrtc] handleAnswer peerId=${this.peerId} signalingState=${state}`);
    
    if (state === 'stable') {
      console.info(`[webrtc] Already stable for ${this.peerId}, ignoring duplicate answer`);
      return;
    }
    
    if (state !== 'have-local-offer') {
      console.warn(`[webrtc] Unexpected state ${state} for ${this.peerId}, skipping`);
      return;
    }
    
    const answer = JSON.parse(answerStr);
    await this.pc.setRemoteDescription(answer);
    console.log(`[webrtc] Remote description set for ${this.peerId}`);
  }

  send(msg: GameMessage) {
    if (this.channel?.readyState === 'open') {
      this.channel.send(JSON.stringify(msg));
    }
  }

  close() {
    this.channel?.close();
    this.pc.close();
  }

  private setupChannel(channel: RTCDataChannel) {
    channel.onopen = () => {
      console.log(`[webrtc] Data channel open for ${this.peerId}`);
      this.onOpen();
    };
    channel.onclose = () => {
      console.log(`[webrtc] Data channel closed for ${this.peerId}`);
      this.onClose();
    };
    channel.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as GameMessage;
        this.onMessage(msg);
      } catch {}
    };
  }

  private waitForIce(): Promise<void> {
    return new Promise((resolve) => {
      if (this.pc.iceGatheringState === 'complete') {
        resolve();
        return;
      }

      let resolved = false;
      const done = () => {
        if (resolved) return;
        resolved = true;
        this.pc.removeEventListener('icegatheringstatechange', onStateChange);
        this.pc.removeEventListener('icecandidate', onCandidate);
        clearTimeout(timer);
        resolve();
      };

      const onStateChange = () => {
        if (this.pc.iceGatheringState === 'complete') done();
      };

      const onCandidate = (e: RTCPeerConnectionIceEvent) => {
        if (e.candidate === null) done();
      };

      this.pc.addEventListener('icegatheringstatechange', onStateChange);
      this.pc.addEventListener('icecandidate', onCandidate);

      // Fallback timeout - 5s
      const timer = setTimeout(done, 5000);
    });
  }
}
