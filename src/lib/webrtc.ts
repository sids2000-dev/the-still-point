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
    if (this.pc.signalingState !== 'have-local-offer') {
      console.warn('PeerConnection not in have-local-offer state, current:', this.pc.signalingState);
      return;
    }
    const answer = JSON.parse(answerStr);
    await this.pc.setRemoteDescription(answer);
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
    channel.onopen = () => this.onOpen();
    channel.onclose = () => this.onClose();
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
      const check = () => {
        if (this.pc.iceGatheringState === 'complete') {
          this.pc.removeEventListener('icegatheringstatechange', check);
          resolve();
        }
      };
      this.pc.addEventListener('icegatheringstatechange', check);
      // Fallback timeout
      setTimeout(resolve, 3000);
    });
  }
}
