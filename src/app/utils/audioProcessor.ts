/**
 * Audio Processing Utilities
 * Handles audio analysis, frequency band extraction, and audio-reactive parameters
 */

export interface AudioAnalysis {
  bass: number;      // 0-1 normalized
  mid: number;       // 0-1 normalized
  treble: number;    // 0-1 normalized
  overall: number;   // 0-1 normalized
}

export interface FrequencyBands {
  bassStart: number;
  bassEnd: number;
  midStart: number;
  midEnd: number;
  trebleStart: number;
  trebleEnd: number;
}

/**
 * Calculate frequency band indices based on sample rate
 */
export function calculateFrequencyBands(
  fftSize: number,
  sampleRate: number = 44100
): FrequencyBands {
  const nyquist = sampleRate / 2;
  const frequencyBinWidth = nyquist / (fftSize / 2);
  
  // Define frequency ranges
  const bassMaxFreq = 250;
  const midMaxFreq = 2000;
  
  return {
    bassStart: 0,
    bassEnd: Math.floor(bassMaxFreq / frequencyBinWidth),
    midStart: Math.floor(bassMaxFreq / frequencyBinWidth),
    midEnd: Math.floor(midMaxFreq / frequencyBinWidth),
    trebleStart: Math.floor(midMaxFreq / frequencyBinWidth),
    trebleEnd: fftSize / 2
  };
}

/**
 * Analyze frequency data and extract band levels
 */
export function analyzeFrequencies(
  frequencyData: Uint8Array,
  bands: FrequencyBands
): AudioAnalysis {
  // Calculate average for each band
  const bassAvg = getAverageBandLevel(frequencyData, bands.bassStart, bands.bassEnd);
  const midAvg = getAverageBandLevel(frequencyData, bands.midStart, bands.midEnd);
  const trebleAvg = getAverageBandLevel(frequencyData, bands.trebleStart, bands.trebleEnd);
  const overallAvg = getAverageBandLevel(frequencyData, 0, frequencyData.length);
  
  // Normalize to 0-1 range (frequency data is 0-255)
  return {
    bass: bassAvg / 255,
    mid: midAvg / 255,
    treble: trebleAvg / 255,
    overall: overallAvg / 255
  };
}

/**
 * Get average level for a frequency band
 */
function getAverageBandLevel(
  data: Uint8Array,
  startIdx: number,
  endIdx: number
): number {
  let sum = 0;
  const count = endIdx - startIdx;
  
  for (let i = startIdx; i < endIdx; i++) {
    sum += data[i];
  }
  
  return count > 0 ? sum / count : 0;
}

/**
 * Smooth audio parameter changes with exponential moving average
 */
export class AudioSmoothing {
  private smoothingFactor: number;
  private currentValue: number;
  
  constructor(smoothingFactor: number = 0.3) {
    this.smoothingFactor = smoothingFactor;
    this.currentValue = 0;
  }
  
  update(newValue: number): number {
    this.currentValue = 
      this.smoothingFactor * newValue + 
      (1 - this.smoothingFactor) * this.currentValue;
    
    return this.currentValue;
  }
  
  reset(): void {
    this.currentValue = 0;
  }
  
  getValue(): number {
    return this.currentValue;
  }
}

/**
 * Initialize audio context and analyser
 */
export async function initializeAudioContext(): Promise<{
  audioContext: AudioContext;
  analyser: AnalyserNode;
}> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.8;
  
  return { audioContext, analyser };
}

/**
 * Connect audio element to analyser
 */
export function connectAudioElement(
  audioElement: HTMLAudioElement,
  audioContext: AudioContext,
  analyser: AnalyserNode
): MediaElementAudioSourceNode {
  const source = audioContext.createMediaElementSource(audioElement);
  source.connect(analyser);
  analyser.connect(audioContext.destination);
  
  return source;
}

/**
 * Connect microphone to analyser
 */
export async function connectMicrophone(
  audioContext: AudioContext,
  analyser: AnalyserNode
): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);
  
  return stream;
}

/**
 * Generate waveform data for visualization
 */
export function generateWaveform(
  audioBuffer: AudioBuffer,
  targetSamples: number = 100
): number[] {
  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / targetSamples);
  const waveform: number[] = [];
  
  for (let i = 0; i < targetSamples; i++) {
    const start = i * blockSize;
    const end = start + blockSize;
    let sum = 0;
    
    for (let j = start; j < end && j < channelData.length; j++) {
      sum += Math.abs(channelData[j]);
    }
    
    waveform.push(sum / blockSize);
  }
  
  return waveform;
}

/**
 * Map audio analysis to gradient parameters
 */
export function mapAudioToGradient(analysis: AudioAnalysis): {
  zoom: number;
  rotation: number;
  colorIntensity: number;
} {
  return {
    zoom: analysis.bass * 2,           // Bass controls zoom (0-2x multiplier)
    rotation: analysis.mid * 360,       // Mid controls rotation (0-360 degrees)
    colorIntensity: analysis.treble * 100  // Treble controls color intensity
  };
}

/**
 * Apply audio reactivity to effect parameter
 */
export function applyAudioModulation(
  baseValue: number,
  audioLevel: number,
  sensitivity: number = 1
): number {
  return baseValue + (audioLevel * sensitivity);
}

/**
 * Create smoothed audio parameter getters
 */
export function createAudioSmoothers() {
  return {
    bass: new AudioSmoothing(0.3),
    mid: new AudioSmoothing(0.3),
    treble: new AudioSmoothing(0.3),
    overall: new AudioSmoothing(0.3)
  };
}
