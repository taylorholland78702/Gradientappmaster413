import { useState, useEffect, useCallback, useRef, type ChangeEvent } from 'react';

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export interface UseAudioReactivityParams {
  onBassFlash: () => void;
  onMidsFlash: () => void;
  onTrebleFlash: () => void;
  setTargetColors: (updater: (prev: ColorRGB[]) => ColorRGB[]) => void;
  setGradientColors: (updater: (prev: ColorRGB[]) => ColorRGB[]) => void;
  setTargetZoom: (updater: (prev: number) => number) => void;
}

export function useAudioReactivity(params: UseAudioReactivityParams) {
  const { onBassFlash, onMidsFlash, onTrebleFlash, setTargetColors, setGradientColors, setTargetZoom } = params;

  // State
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>('');
  const [audioFileMetadata, setAudioFileMetadata] = useState<{ sampleRate: number; duration: number } | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isAudioReactive, setIsAudioReactive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [audioGradientParam, setAudioGradientParam] = useState(0);
  const [audioEffectParam, setAudioEffectParam] = useState(0);
  const [audioColorShift, setAudioColorShift] = useState(0);
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState('default');
  const [bassMultiplier, setBassMultiplier] = useState(1);
  const [midsMultiplier, setMidsMultiplier] = useState(1);
  const [trebleMultiplier, setTrebleMultiplier] = useState(0.5);
  const [bassSmoothing, setBassSmoothing] = useState(0.8);
  const [midsSmoothing, setMidsSmoothing] = useState(0.8);
  const [trebleSmoothing, setTrebleSmoothing] = useState(0.8);
  const [bassThreshold, setBassThreshold] = useState(0);
  const [midsThreshold, setMidsThreshold] = useState(0);
  const [trebleThreshold, setTrebleThreshold] = useState(0);
  const [bassMin, setBassMin] = useState(0);
  const [bassMax, setBassMax] = useState(2);
  const [midsMin, setMidsMin] = useState(0);
  const [midsMax, setMidsMax] = useState(2);
  const [trebleMin, setTrebleMin] = useState(0);
  const [trebleMax, setTrebleMax] = useState(2);
  const [masterSensitivity, setMasterSensitivity] = useState(1.0);
  const [bassBeatSync, setBassBeatSync] = useState(false);
  const [midsBeatSync, setMidsBeatSync] = useState(false);
  const [trebleBeatSync, setTrebleBeatSync] = useState(false);
  const [subBassMultiplier, setSubBassMultiplier] = useState(1);
  const [subBassBeatSync, setSubBassBeatSync] = useState(false);
  const [liveSubBassLevel, setLiveSubBassLevel] = useState(0);
  const [bpm, setBpm] = useState(0);
  const [bassOpen, setBassOpen] = useState(false);
  const [midsOpen, setMidsOpen] = useState(false);
  const [trebleOpen, setTrebleOpen] = useState(false);
  const [bassFlash, setBassFlash] = useState(false);
  const [midsFlash, setMidsFlash] = useState(false);
  const [trebleFlash, setTrebleFlash] = useState(false);
  const [bpmFlash, setBpmFlash] = useState(false);
  const [liveBassLevel, setLiveBassLevel] = useState(0);
  const [liveMidsLevel, setLiveMidsLevel] = useState(0);
  const [liveTrebleLevel, setLiveTrebleLevel] = useState(0);
  const [isAudiovisualsOpen, setIsAudiovisualsOpen] = useState(false);
  const [isAudioControlsOpen, setIsAudioControlsOpen] = useState(false);
  const [audioReactiveColors, setAudioReactiveColors] = useState(false);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bassSmoothedRef = useRef(0);
  const midsSmoothedRef = useRef(0);
  const trebleSmoothedRef = useRef(0);
  const lastBeatTimeRef = useRef(0);
  const beatIntervalsRef = useRef<number[]>([]);
  const bassPrevRef = useRef(0);
  const treblePrevRef = useRef(0);
  const lastTrebleBeatRef = useRef(0);
  const bassBeatPulseRef = useRef(0);
  const midsBeatPulseRef = useRef(0);
  const trebleBeatPulseRef = useRef(0);
  const liveBaseLevelRef = useRef(0);
  const liveMidsLevelRef = useRef(0);
  const liveTrebleLevelRef = useRef(0);
  const liveBassSmoothedRef = useRef(0);
  const liveMidsSmoothedRef = useRef(0);
  const liveTrebleSmoothedRef = useRef(0);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const subBassBeatPulseRef = useRef(0);
  const subBassPrevRef = useRef(0);
  const liveSubBassLevelRef = useRef(0);
  const subBassSmoothedRef = useRef(0);
  const lastSubBeatTimeRef = useRef(0);

  // Functions
  const initAudioContext = useCallback((source: HTMLAudioElement | MediaStream, connectToOutput: boolean = true) => {
    if (!audioContextRef.current) {
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const audioSource = source instanceof HTMLAudioElement
        ? audioContext.createMediaElementSource(source)
        : audioContext.createMediaStreamSource(source);
      sourceRef.current = audioSource;

      audioSource.connect(analyser);
      if (connectToOutput) {
        analyser.connect(audioContext.destination);
      }
    }
  }, []);

  const handleFileUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioFile(url);
      setAudioFileName(file.name);

      const tempAudio = new Audio(url);
      tempAudio.addEventListener('loadedmetadata', async () => {
        const duration = tempAudio.duration;

        try {
          const audioContext = new AudioContext();
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          setAudioFileMetadata({
            sampleRate: audioBuffer.sampleRate,
            duration: duration
          });

          const channelData = audioBuffer.getChannelData(0);
          const samples = 100;
          const blockSize = Math.floor(channelData.length / samples);
          const waveform: number[] = [];

          for (let i = 0; i < samples; i++) {
            let min = 1;
            let max = -1;
            for (let j = 0; j < blockSize; j++) {
              const sample = channelData[i * blockSize + j];
              if (sample < min) min = sample;
              if (sample > max) max = sample;
            }
            waveform.push(max - min);
          }

          setWaveformData(waveform);
        } catch (error) {
          console.error('Error generating waveform:', error);
        }
      });

      setTimeout(() => {
        if (audioRef.current) {
          initAudioContext(audioRef.current, true);
          audioRef.current.play();
          setIsAudioEnabled(true);
          setIsAudioReactive(true);
        }
      }, 100);
    }
  }, [initAudioContext]);

  const startMicVisualization = async (deviceId?: string) => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: deviceId && deviceId !== 'default' ? { deviceId: { exact: deviceId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(d => d.kind === 'audioinput');
      setAudioInputDevices(audioInputs);
      const blackhole = audioInputs.find(d => d.label.toLowerCase().includes('blackhole 2ch'));
      if (blackhole && selectedAudioDeviceId === 'default') {
        setSelectedAudioDeviceId(blackhole.deviceId);
      }

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsMicActive(true);
      setIsAudioEnabled(true);
      setIsAudioReactive(true);
    } catch (error) {
      // Silently fail - microphone access is blocked in preview environments
    }
  };

  const stopMicVisualization = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setIsMicActive(false);
    setIsAudioEnabled(false);
    setIsAudioReactive(false);
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isAudioEnabled) {
        audioRef.current.pause();
        setIsAudioEnabled(false);
      } else {
        audioRef.current.play();
        setIsAudioEnabled(true);
      }
    }
  };

  // Beat sync effects
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then(devices => {
      const audioInputs = devices.filter(d => d.kind === 'audioinput');
      if (audioInputs.length) setAudioInputDevices(audioInputs);
      const blackhole = audioInputs.find(d => d.label.toLowerCase().includes('blackhole 2ch'));
      if (blackhole) setSelectedAudioDeviceId(blackhole.deviceId);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (isAudioEnabled) {
      setBassBeatSync(true);
      setMidsBeatSync(true);
      setTrebleBeatSync(true);
      setSubBassBeatSync(true);
    }
  }, [isAudioEnabled]);

  useEffect(() => {
    if (!bassBeatSync || !bassFlash) return;
    onBassFlash();
  }, [bassFlash, bassBeatSync]);

  useEffect(() => {
    if (!midsBeatSync || !midsFlash) return;
    onMidsFlash();
  }, [midsFlash, midsBeatSync]);

  useEffect(() => {
    if (!trebleBeatSync || !trebleFlash) return;
    onTrebleFlash();
  }, [trebleFlash, trebleBeatSync]);

  // Audio reactivity loop
  useEffect(() => {
    if (!isAudioEnabled || !analyserRef.current || !isAudioReactive) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const analyzeAudio = () => {
      if (!isAudioEnabled || !isAudioReactive) return;

      analyser.getByteFrequencyData(dataArray);

      // ---- Read frequency data ----
      analyser.getByteFrequencyData(dataArray);

      const now = performance.now();

      // ---- SUB-BASS (bins 0–2, ~0–170Hz — kick drum fundamental) ----
      let subBassSum = 0;
      for (let i = 0; i < 3 && i < bufferLength; i++) subBassSum += dataArray[i];
      const subBassAvgRaw = (subBassSum / 3) / 255;
      liveSubBassLevelRef.current = subBassAvgRaw;

      const subBassOnset = subBassAvgRaw > subBassPrevRef.current * 1.4 && subBassAvgRaw > 0.08;
      if (subBassOnset && now - lastSubBeatTimeRef.current > 150) {
        lastSubBeatTimeRef.current = now;
        if (subBassBeatSync) subBassBeatPulseRef.current = 1.0;
      }
      subBassPrevRef.current = subBassAvgRaw;

      let subBassRaw: number;
      if (subBassBeatSync) {
        subBassRaw = subBassBeatPulseRef.current * subBassMultiplier * masterSensitivity;
        subBassBeatPulseRef.current *= 0.68; // faster decay = snappier pulse
      } else {
        subBassRaw = subBassAvgRaw * subBassMultiplier * masterSensitivity;
      }
      subBassSmoothedRef.current = 0.5 * subBassSmoothedRef.current + 0.5 * subBassRaw;
      const subBassValue = Math.min(1, subBassSmoothedRef.current);

      setTargetZoom(prev => {
        if (subBassValue > 0.05) {
          const pulse = 1 + subBassValue * (subBassBeatSync ? 0.7 : 0.35);
          return Math.min(prev * pulse, prev + (subBassBeatSync ? 1.2 : 0.6));
        }
        // Decay back toward 1 between beats
        return prev + (1 - prev) * (subBassBeatSync ? 0.18 : 0.08);
      });

      // ---- BASS (bins 0–9) ----
      let bassSum = 0;
      for (let i = 0; i < 10 && i < bufferLength; i++) bassSum += dataArray[i];
      const bassAvgRaw = (bassSum / 10) / 255; // 0-1
      liveBaseLevelRef.current = bassAvgRaw;

      // Beat detection on bass band
      const bassOnset = bassAvgRaw > bassPrevRef.current * 1.3 && bassAvgRaw > bassThreshold + 0.05;
      if (bassOnset && now - lastBeatTimeRef.current > 200) {
        const interval = now - lastBeatTimeRef.current;
        if (interval < 2000) {
          beatIntervalsRef.current.push(interval);
          if (beatIntervalsRef.current.length > 8) beatIntervalsRef.current.shift();
          const avgInterval = beatIntervalsRef.current.reduce((a, b) => a + b, 0) / beatIntervalsRef.current.length;
          setBpm(Math.round(60000 / avgInterval));
        }
        lastBeatTimeRef.current = now;
        if (bassBeatSync) bassBeatPulseRef.current = 1.0;
        if (midsBeatSync) midsBeatPulseRef.current = 1.0;
        if (trebleBeatSync) trebleBeatPulseRef.current = 1.0;
        // Trigger beat flash indicators
        setBassFlash(true); setMidsFlash(true); setTrebleFlash(true); setBpmFlash(true);
        setTimeout(() => { setBassFlash(false); setMidsFlash(false); setTrebleFlash(false); setBpmFlash(false); }, 120);
      }
      bassPrevRef.current = bassAvgRaw;

      // Bass output: continuous or beat-pulse
      const bassAboveThreshold = bassAvgRaw > bassThreshold;
      let bassRaw: number;
      if (bassBeatSync) {
        bassRaw = bassBeatPulseRef.current * bassMultiplier * masterSensitivity;
        bassBeatPulseRef.current *= 0.85; // decay
      } else {
        bassRaw = bassAboveThreshold ? bassAvgRaw * bassMultiplier * masterSensitivity : 0;
      }
      bassSmoothedRef.current = bassSmoothing * bassSmoothedRef.current + (1 - bassSmoothing) * bassRaw;
      const bassGradientValue = Math.max(bassMin, Math.min(bassMax, bassSmoothedRef.current));
      liveBassSmoothedRef.current = bassGradientValue;
      setAudioGradientParam(bassGradientValue);

      // ---- MIDS (bins 10–49) ----
      let midsSum = 0;
      for (let i = 10; i < 50 && i < bufferLength; i++) midsSum += dataArray[i];
      const midsAvgRaw = (midsSum / 40) / 255;
      liveMidsLevelRef.current = midsAvgRaw;

      const midsAboveThreshold = midsAvgRaw > midsThreshold;
      let midsRaw: number;
      if (midsBeatSync) {
        midsRaw = midsBeatPulseRef.current * midsMultiplier * masterSensitivity;
        midsBeatPulseRef.current *= 0.85;
      } else {
        midsRaw = midsAboveThreshold ? midsAvgRaw * midsMultiplier * masterSensitivity : 0;
      }
      midsSmoothedRef.current = midsSmoothing * midsSmoothedRef.current + (1 - midsSmoothing) * midsRaw;
      const midsEffectValue = Math.max(midsMin, Math.min(midsMax, midsSmoothedRef.current));
      liveMidsSmoothedRef.current = midsEffectValue;
      setAudioEffectParam(midsEffectValue);

      // ---- TREBLE (bins 50–119) ----
      let trebleSum = 0;
      for (let i = 50; i < 120 && i < bufferLength; i++) trebleSum += dataArray[i];
      const trebleAvgRaw = (trebleSum / 70) / 255;
      liveTrebleLevelRef.current = trebleAvgRaw;

      const trebleAboveThreshold = trebleAvgRaw > trebleThreshold;
      let trebleRaw: number;
      if (trebleBeatSync) {
        trebleRaw = trebleBeatPulseRef.current * trebleMultiplier * masterSensitivity * 90;
        trebleBeatPulseRef.current *= 0.85;
      } else {
        trebleRaw = trebleAboveThreshold ? trebleAvgRaw * trebleMultiplier * masterSensitivity * 90 : 0;
      }
      trebleSmoothedRef.current = trebleSmoothing * trebleSmoothedRef.current + (1 - trebleSmoothing) * trebleRaw;
      const trebleColorValue = Math.max(trebleMin * 90, Math.min(trebleMax * 90, trebleSmoothedRef.current));
      liveTrebleSmoothedRef.current = trebleColorValue;
      setAudioColorShift(trebleColorValue);

      // Treble onset detection for Color BEAT — only update target so lerp eases in smoothly
      const trebleOnset = trebleAvgRaw > treblePrevRef.current * 1.2 && trebleAvgRaw > 0.05;
      if (trebleBeatSync && trebleOnset && now - lastTrebleBeatRef.current > 800) {
        lastTrebleBeatRef.current = now;
        setTargetColors(prev => prev.map(() => ({ r: Math.floor(Math.random() * 256), g: Math.floor(Math.random() * 256), b: Math.floor(Math.random() * 256) })));
      }
      treblePrevRef.current = trebleAvgRaw;

      requestAnimationFrame(analyzeAudio);
    };

    const animId = requestAnimationFrame(analyzeAudio);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isAudioEnabled, isAudioReactive, bassMultiplier, midsMultiplier, trebleMultiplier, bassSmoothing, midsSmoothing, trebleSmoothing, bassThreshold, midsThreshold, trebleThreshold, bassMin, bassMax, midsMin, midsMax, trebleMin, trebleMax, masterSensitivity, bassBeatSync, midsBeatSync, trebleBeatSync, subBassMultiplier, subBassBeatSync, setTargetZoom]);

  // Poll live level refs at ~15fps to drive the bar graph (every 4th frame)
  useEffect(() => {
    if (!isAudioEnabled || !isAudioReactive) return;
    let rafId: number;
    let frame = 0;
    const poll = () => {
      if (++frame % 4 === 0) {
        setLiveBassLevel(liveBaseLevelRef.current);
        setLiveMidsLevel(liveMidsLevelRef.current);
        setLiveTrebleLevel(liveTrebleLevelRef.current);
        setLiveSubBassLevel(liveSubBassLevelRef.current);
      }
      rafId = requestAnimationFrame(poll);
    };
    rafId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(rafId);
  }, [isAudioEnabled, isAudioReactive]);

  // Auto-reactive colors - change colors based on audio
  useEffect(() => {
    if (!audioReactiveColors || !isAudioEnabled || !analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let lastColorChange = 0;
    const colorChangeInterval = 500;

    const analyzeForColors = () => {
      if (!audioReactiveColors || !isAudioEnabled) return;

      analyser.getByteFrequencyData(dataArray);

      let totalEnergy = 0;
      for (let i = 0; i < bufferLength; i++) {
        totalEnergy += dataArray[i];
      }
      const avgEnergy = totalEnergy / bufferLength;

      if (avgEnergy > 30 && Date.now() - lastColorChange > colorChangeInterval) {
        setTargetColors(prev => prev.map(color => {
          const hueShift = (avgEnergy / 255) * 30;
          return {
            r: Math.min(255, Math.max(0, color.r + (Math.random() - 0.5) * hueShift)),
            g: Math.min(255, Math.max(0, color.g + (Math.random() - 0.5) * hueShift)),
            b: Math.min(255, Math.max(0, color.b + (Math.random() - 0.5) * hueShift)),
          };
        }));
        lastColorChange = Date.now();
      }

      requestAnimationFrame(analyzeForColors);
    };

    const animId = requestAnimationFrame(analyzeForColors);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [audioReactiveColors, isAudioEnabled]);

  return {
    // State
    isAudioEnabled, setIsAudioEnabled,
    audioFile, setAudioFile,
    audioFileName, setAudioFileName,
    audioFileMetadata, setAudioFileMetadata,
    waveformData, setWaveformData,
    isAudioReactive, setIsAudioReactive,
    isMicActive, setIsMicActive,
    audioGradientParam, setAudioGradientParam,
    audioEffectParam, setAudioEffectParam,
    audioColorShift, setAudioColorShift,
    audioInputDevices, setAudioInputDevices,
    selectedAudioDeviceId, setSelectedAudioDeviceId,
    bassMultiplier, setBassMultiplier,
    midsMultiplier, setMidsMultiplier,
    trebleMultiplier, setTrebleMultiplier,
    bassSmoothing, setBassSmoothing,
    midsSmoothing, setMidsSmoothing,
    trebleSmoothing, setTrebleSmoothing,
    bassThreshold, setBassThreshold,
    midsThreshold, setMidsThreshold,
    trebleThreshold, setTrebleThreshold,
    bassMin, setBassMin,
    bassMax, setBassMax,
    midsMin, setMidsMin,
    midsMax, setMidsMax,
    trebleMin, setTrebleMin,
    trebleMax, setTrebleMax,
    masterSensitivity, setMasterSensitivity,
    bassBeatSync, setBassBeatSync,
    midsBeatSync, setMidsBeatSync,
    trebleBeatSync, setTrebleBeatSync,
    subBassMultiplier, setSubBassMultiplier,
    subBassBeatSync, setSubBassBeatSync,
    liveSubBassLevel,
    bpm, setBpm,
    bassOpen, setBassOpen,
    midsOpen, setMidsOpen,
    trebleOpen, setTrebleOpen,
    bassFlash, setBassFlash,
    midsFlash, setMidsFlash,
    trebleFlash, setTrebleFlash,
    bpmFlash, setBpmFlash,
    liveBassLevel, setLiveBassLevel,
    liveMidsLevel, setLiveMidsLevel,
    liveTrebleLevel, setLiveTrebleLevel,
    isAudiovisualsOpen, setIsAudiovisualsOpen,
    isAudioControlsOpen, setIsAudioControlsOpen,
    audioReactiveColors, setAudioReactiveColors,
    // Refs
    audioRef,
    audioContextRef,
    analyserRef,
    bassSmoothedRef,
    midsSmoothedRef,
    trebleSmoothedRef,
    lastBeatTimeRef,
    beatIntervalsRef,
    bassPrevRef,
    treblePrevRef,
    lastTrebleBeatRef,
    bassBeatPulseRef,
    midsBeatPulseRef,
    trebleBeatPulseRef,
    liveBaseLevelRef,
    liveMidsLevelRef,
    liveTrebleLevelRef,
    liveBassSmoothedRef,
    liveMidsSmoothedRef,
    liveTrebleSmoothedRef,
    sourceRef,
    streamRef,
    // Functions
    initAudioContext,
    handleFileUpload,
    startMicVisualization,
    stopMicVisualization,
    toggleAudio,
  };
}
