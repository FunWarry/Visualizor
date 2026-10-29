declare module 'butterchurn' {
  const butterchurn: {
    createVisualizer: (audioContext: any, canvas: any, options?: any) => any;
    isSupported: () => boolean;
  };
  export default butterchurn;
}

declare module 'butterchurn-presets' {
  const butterchurnPresets: {
    getPresets: () => Record<string, any>;
  };
  export default butterchurnPresets;
}
