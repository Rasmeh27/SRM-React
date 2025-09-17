declare module 'qr-scanner' {
  export default class QrScanner {
    constructor(
      video: HTMLVideoElement,
      onDecode: (result: any) => void,
      options?: any
    );
    start(): Promise<void>;
    stop(): Promise<void>;
    pause(): Promise<void>;
    destroy(): void;
    setInversionMode(mode: 'original' | 'invert' | 'both'): void;
    static WORKER_PATH: string;
  }
}
