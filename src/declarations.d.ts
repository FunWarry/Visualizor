declare module 'butterchurn' {
  export interface ButterchurnVisualizer {
    connectAudio: (audioNode: AudioNode) => void;
    loadPreset: (preset: unknown, blendTime?: number) => void;
    render: () => void;
    setRendererSize: (width: number, height: number) => void;
  }

  export interface ButterchurnOptions {
    width?: number;
    height?: number;
    pixelRatio?: number;
    textureRatio?: number;
  }

  const butterchurn: {
    createVisualizer: (
      audioContext: AudioContext | BaseAudioContext,
      canvas: HTMLCanvasElement,
      options?: ButterchurnOptions
    ) => ButterchurnVisualizer;
    isSupported: () => boolean;
  };
  export default butterchurn;
}

declare module 'butterchurn-presets' {
  const butterchurnPresets: {
    getPresets: () => Record<string, unknown>;
  };
  export default butterchurnPresets;
}
