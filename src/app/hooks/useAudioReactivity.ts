import { useState, useEffect, useCallback, useRef, type ChangeEvent } from 'react';

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

// Shared by the treble-driven palette snap below — evenly-spaced hues
// around a random base read as an intentional harmonious palette, unlike
// picking each channel independently at random (which tends toward muddy,
// low-contrast combinations).
function hslToRgb(h: number, s: number, l: number): ColorRGB {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => Math.round((l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))) * 255);
  return { r: f(0), g: f(8), b: f(4) };
}

export interface UseAudioReactivityParams {
  onBassFlash: () => void;
  onMidsFlash: () => void;
  onTrebleFlash: () => void;
  setTargetColors: (updater: (prev: ColorRGB[]) => ColorRGB[]) => void;
  setGradientColors: (updater: (prev: ColorRGB[]) => ColorRGB[]) => void;
  setTargetZoom: (updater: (prev: number) => number) => void;
  zoomBeatEnabled: boolean;
}

export function useAudioReactivity(params: UseAudioReactivityParams) {
  const { zoomBeatEnabled } = params;
  const { onBassFlash, onMidsFlash, onTrebleFlash, setTargetColors, setGradientColors, setTargetZoom } = params;
  // setTargetZoom (and the flash callbacks) arrive as fresh inline closures
  // on every parent render (InteractiveGradient.tsx wraps them inline, no
  // useCallback) — read the latest one through a ref instead of depending
  // on it directly in the reactivity-loop effect below, which was
  // otherwise tearing down and rebuilding that effect's RAF chain on
  // nearly every render, never surviving long enough to read a single
  // frame of audio data.
  const setTargetZoomRef = useRef(setTargetZoom);
  setTargetZoomRef.current = setTargetZoom;

  // State
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>('');
  const [audioFileMetadata, setAudioFileMetadata] = useState<{ sampleRate: number; duration: number } | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isAudioReactive, setIsAudioReactive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [audioSubBassLevel, setAudioSubBassLevel] = useState(0);
  const [audioMidsLevel, setAudioMidsLevel] = useState(0);
  const [audioTrebleLevel, setAudioTrebleLevel] = useState(0);
  const [audioEnergy, setAudioEnergy] = useState(0);
  const energySmoothedRef = useRef(0);
  const [subBassOnsetTick, setSubBassOnsetTick] = useState(0);
  const [bassOnsetTick, setBassOnsetTick] = useState(0);
  const [midsOnsetTick, setMidsOnsetTick] = useState(0);
  const [trebleOnsetTick, setTrebleOnsetTick] = useState(0);
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState('default');
  // Multipliers and smoothing defaults tuned down — these three feed every
  // downstream consumer (zoom, gradient angle, hue drift, shimmer, audio
  // bindings), so high multipliers + fast (low) smoothing compounded into
  // motion that snapped and overshot on every hit rather than flowing.
  const [bassMultiplier, setBassMultiplier] = useState(1.5);
  const [midsMultiplier, setMidsMultiplier] = useState(1.2);
  const [trebleMultiplier, setTrebleMultiplier] = useState(1);
  const [bassSmoothing, setBassSmoothing] = useState(0.55);
  const [midsSmoothing, setMidsSmoothing] = useState(0.55);
  const [trebleSmoothing, setTrebleSmoothing] = useState(0.55);
  const [bassThreshold, setBassThreshold] = useState(0);
  const [midsThreshold, setMidsThreshold] = useState(0);
  const [trebleThreshold, setTrebleThreshold] = useState(0);
  const [bassMin, setBassMin] = useState(0);
  const [bassMax, setBassMax] = useState(5);
  const [midsMin, setMidsMin] = useState(0);
  // Was 2 — the Mids/Treble multiplier sliders go up to 5, so anything
  // above a multiplier setting of ~2 was clamped away entirely and had no
  // audible/visible effect no matter how high the slider went. Matches
  // bassMax's headroom now.
  const [midsMax, setMidsMax] = useState(5);
  const [trebleMin, setTrebleMin] = useState(0);
  const [trebleMax, setTrebleMax] = useState(5);
  // Slider runs 0-10 (see effMasterSensitivity above, which clamps the
  // actual math to a max of 3 — values 3-10 are identical headroom).
  // Defaults to 0.4, deliberately very subtle out of the box, leaving the
  // slider's 0.4-3 range (a 7.5x swing) as real headroom to dial reactivity
  // up rather than starting already close to its ceiling.
  const [masterSensitivity, setMasterSensitivity] = useState(0.4);
  const [bassBeatSync, setBassBeatSync] = useState(true);
  const [midsBeatSync, setMidsBeatSync] = useState(false);
  const [trebleBeatSync, setTrebleBeatSync] = useState(false);
  const [subBassMultiplier, setSubBassMultiplier] = useState(1.5);
  const [subBassBeatSync, setSubBassBeatSync] = useState(true);
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
  // Auto Gain: normalizes each band against its own slowly-decaying recent
  // peak instead of a fixed 0-1 scale, so quiet passages still register and
  // loud passages don't just slam into the multiplier's ceiling. Off falls
  // back to the old raw-amplitude behavior.
  const [autoGainEnabled, setAutoGainEnabled] = useState(true);
  // Depth layer: a second, softer light source screen-blended behind the
  // main gradient for an atmosphere/parallax feel (see useCanvasDraw.ts).
  // On by default; strength scales its opacity (0 = invisible, 2 = double
  // the default). Both only take effect while audio reactivity is on.
  // Strength no longer has a slider in the UI (AudioPanel.tsx) — fixed at
  // 2, the top end of the old slider's 0-2 range, its most intense setting.
  const [depthLayerEnabled, setDepthLayerEnabled] = useState(true);
  const [depthLayerStrength, setDepthLayerStrength] = useState(2);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  // Bumped every time analyserRef.current is reassigned to a new node
  // (device switch) — the reactivity-loop effect below closes over the
  // analyser at subscribe time and only re-subscribes on a dependency
  // change, so swapping the ref alone (isAudioEnabled/isAudioReactive
  // staying true throughout a switch) would otherwise leave it reading a
  // stale, already-closed analyser forever. Included in that effect's deps.
  const [analyserVersion, setAnalyserVersion] = useState(0);
  const bassSmoothedRef = useRef(0);
  const midsSmoothedRef = useRef(0);
  const trebleSmoothedRef = useRef(0);
  const lastBeatTimeRef = useRef(0);
  const beatIntervalsRef = useRef<number[]>([]);
  const bassPrevRef = useRef(0);
  const midsPrevRef = useRef(0);
  const lastMidsBeatTimeRef = useRef(0);
  const treblePrevRef = useRef(0);
  const lastTrebleBeatRef = useRef(0);
  const lastTreblePulseTimeRef = useRef(0);
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
  // Auto Gain: slowly-decaying recent-peak trackers, one per band
  const subBassPeakRef = useRef(0.05);
  const bassPeakRef = useRef(0.05);
  const midsPeakRef = useRef(0.05);
  const treblePeakRef = useRef(0.05);
  // Music-structure awareness: a slow (many-second) rolling energy average,
  // compared against the existing fast-smoothed energy to infer whether the
  // track is "dropped" (fast >> slow) or in a quiet stretch (fast << slow).
  // Exposed as a ref (not state) since it's read every draw frame by
  // useCanvasDraw, same pattern as gradientColorsRef/attractorAnimTime —
  // avoids a setState call every animation frame.
  const longEnergyRef = useRef(0.05);
  const musicIntensityRef = useRef(1);

  // Functions
  const initAudioContext = useCallback((source: HTMLAudioElement | MediaStream, connectToOutput: boolean = true) => {
    if (!audioContextRef.current) {
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      // 2048 gives ~21.5Hz/bin at 44.1kHz (vs 256's ~172Hz/bin) — fine enough
      // resolution to actually isolate sub-bass/bass instead of cramming them
      // into 2-3 coarse bins. smoothingTimeConstant=0 disables the analyser's
      // own built-in smoothing since the app already does its own per-band EMA
      // smoothing below — stacking both made everything feel sluggish.
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0;
      analyserRef.current = analyser;
      setAnalyserVersion(v => v + 1);

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

  // Acquires the NEW stream/context before tearing down any previous one
  // (rather than stop-then-start), so switching devices while already
  // listening never has a window where isMicActive is false — and if the
  // new device fails to open, the old stream is left running instead of
  // the mic silently ending up off. Also used for the initial mic-on.
  const startMicVisualization = async (deviceId?: string) => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: deviceId && deviceId !== 'default' ? { deviceId: { exact: deviceId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(d => d.kind === 'audioinput');
      setAudioInputDevices(audioInputs);
      const blackhole = audioInputs.find(d => d.label.toLowerCase().includes('blackhole 2ch'));
      if (blackhole && selectedAudioDeviceId === 'default') {
        setSelectedAudioDeviceId(blackhole.deviceId);
      }

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // New stream/context is live and connected — now safe to tear down
      // whatever was running before.
      const prevStream = streamRef.current;
      const prevContext = audioContextRef.current;
      streamRef.current = stream;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      setAnalyserVersion(v => v + 1);
      if (prevStream) prevStream.getTracks().forEach(track => track.stop());
      if (prevContext) prevContext.close();

      setIsMicActive(true);
      setIsAudioEnabled(true);
      setIsAudioReactive(true);
    } catch (error) {
      console.error('Mic access failed:', error);
      if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError')) {
        alert('Microphone access was denied. Allow microphone access for this site in your browser settings, then try again.');
      } else if (error instanceof DOMException && error.name === 'NotFoundError') {
        alert('No microphone was found on this device.');
      } else {
        alert('Could not start the microphone. Check your browser\'s microphone permissions and try again.');
      }
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

  // Keeps the device dropdown live: the list was only ever refreshed
  // inside startMicVisualization, so a device plugged in after the mic was
  // already running (e.g. an audio interface connected mid-session) never
  // showed up until a full mic stop/restart. devicechange fires whenever
  // the OS's set of audio devices changes, regardless of mic state.
  useEffect(() => {
    if (!navigator.mediaDevices?.addEventListener) return;
    const refresh = () => {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        setAudioInputDevices(devices.filter((d) => d.kind === 'audioinput'));
      });
    };
    navigator.mediaDevices.addEventListener('devicechange', refresh);
    return () => navigator.mediaDevices.removeEventListener('devicechange', refresh);
  }, []);

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

    // Bin ranges depend on the actual device/mic sample rate (44.1kHz, 48kHz,
    // etc.), so compute them from it instead of hardcoding bin indices that
    // silently assumed 44.1kHz. Boundaries are perceptual bands, not a linear
    // split of the spectrum: most tracks have almost no energy above ~8kHz
    // (mastering rolloff, MP3/streaming compression, speaker/mic response),
    // so the old bass/mids/treble = bins 0-9/10-49/50-119 (~0-1.7kHz/1.7-8.6kHz/
    // 8.6-20.6kHz) dumped hi-hats and snare crack — the stuff that actually
    // reads as "treble" — into the mids band, leaving treble to average
    // near-silent ultrasonic bins.
    const nyquist = (audioContextRef.current?.sampleRate || 44100) / 2;
    const hzToBin = (hz: number) => Math.min(bufferLength - 1, Math.max(0, Math.round((hz / nyquist) * bufferLength)));
    const subBassLo = hzToBin(20), subBassHi = Math.max(subBassLo + 1, hzToBin(60));
    const bassLo = subBassHi, bassHi = Math.max(bassLo + 1, hzToBin(250));
    const midsLo = bassHi, midsHi = Math.max(midsLo + 1, hzToBin(2000));
    const trebleLo = midsHi, trebleHi = Math.max(trebleLo + 1, hzToBin(8000));

    const analyzeAudio = () => {
      if (!isAudioEnabled || !isAudioReactive) return;

      analyser.getByteFrequencyData(dataArray);

      const now = performance.now();

      // Intensity slider now runs 0-10 for finer low-end control, but the
      // actual reactivity math still only needs up to 3x gain — anything
      // dialed past 3 has no further effect, so values 3 through 10 all
      // read identically. This keeps the useful 0-3 range spread across
      // the same slider width it always had while giving headroom above it.
      //
      // 1x and above stays a plain linear multiplier (unchanged from
      // before, so wherever a mood/preset loads the slider stays exactly
      // as reactive as it always has been). Below 1x eases in quadratically
      // instead of linearly, so dragging the slider down gives a calmer,
      // steeper falloff toward near-silent at the bottom instead of just
      // "a bit less" — at 0.3x you're already close to nothing rather than
      // still clearly audible-reactive.
      const mSens = Math.min(masterSensitivity, 3);
      const effMasterSensitivity = mSens >= 1 ? mSens : mSens * mSens;

      // ---- SUB-BASS (~20-60Hz — kick drum fundamental) ----
      let subBassSum = 0;
      for (let i = subBassLo; i < subBassHi; i++) subBassSum += dataArray[i];
      const subBassAvgRaw = (subBassSum / (subBassHi - subBassLo)) / 255;
      // Auto Gain: normalize against a slowly-decaying recent peak (release
      // ~0.999/frame ≈ 16s to fall to ~37%) so quiet passages still swing the
      // full 0-1 range instead of needing to hit the loudest moment in the
      // whole track to register at all.
      subBassPeakRef.current = Math.max(subBassAvgRaw, subBassPeakRef.current * 0.999);
      const subBassNorm = autoGainEnabled ? Math.min(1, subBassAvgRaw / Math.max(subBassPeakRef.current, 0.05)) : subBassAvgRaw;
      liveSubBassLevelRef.current = subBassNorm;

      // Threshold raised from 0.08 and the beat pulse's peak knocked down
      // from a hardcoded 1.0 to 0.6 — every qualifying hit used to snap to
      // the exact same full-scale spike regardless of how strong it
      // actually was, so even a marginal, barely-there sub-bass twitch
      // produced the same violent Shape jump as a real kick. This was the
      // "too sensitive when BEAT is pressed" complaint: no proportionality
      // at all in beat mode, unlike continuous mode which tracks the
      // live-normalized level smoothly.
      const subBassOnset = subBassAvgRaw > subBassPrevRef.current * 1.4 && subBassAvgRaw > 0.12;
      if (subBassOnset && now - lastSubBeatTimeRef.current > 150) {
        setSubBassOnsetTick(t => t + 1);
        lastSubBeatTimeRef.current = now;
        if (subBassBeatSync) subBassBeatPulseRef.current = 0.6;
      }
      subBassPrevRef.current = subBassAvgRaw;

      let subBassRaw: number;
      if (subBassBeatSync) {
        subBassRaw = subBassBeatPulseRef.current * subBassMultiplier * effMasterSensitivity;
        subBassBeatPulseRef.current *= 0.6; // snappier decay = cleaner hits
      } else {
        subBassRaw = subBassNorm * subBassMultiplier * effMasterSensitivity;
      }
      subBassSmoothedRef.current = 0.65 * subBassSmoothedRef.current + 0.35 * subBassRaw;
      const subBassGradientValue = Math.max(bassMin, Math.min(bassMax, subBassSmoothedRef.current));

      // ---- BASS (~60-250Hz) ----
      let bassSum = 0;
      for (let i = bassLo; i < bassHi; i++) bassSum += dataArray[i];
      const bassAvgRaw = (bassSum / (bassHi - bassLo)) / 255; // 0-1
      bassPeakRef.current = Math.max(bassAvgRaw, bassPeakRef.current * 0.999);
      const bassNorm = autoGainEnabled ? Math.min(1, bassAvgRaw / Math.max(bassPeakRef.current, 0.05)) : bassAvgRaw;
      liveBaseLevelRef.current = bassNorm;

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
        setBassOnsetTick(t => t + 1);
        if (bassBeatSync) bassBeatPulseRef.current = 0.6;
        // Mids/treble BEAT pulses used to also fire here, off the bass
        // band's onset — so "Mids BEAT" and "Treble BEAT" weren't actually
        // detecting mids or treble transients at all, just flashing in sync
        // with bass hits. Each band now has its own onset detector below
        // and drives its own pulse independently.
        // Trigger beat flash indicators
        setBassFlash(true); setMidsFlash(true); setTrebleFlash(true); setBpmFlash(true);
        setTimeout(() => { setBassFlash(false); setMidsFlash(false); setTrebleFlash(false); setBpmFlash(false); }, 120);
      }
      bassPrevRef.current = bassAvgRaw;

      // Bass output: continuous or beat-pulse
      const bassAboveThreshold = bassAvgRaw > bassThreshold;
      let bassRaw: number;
      if (bassBeatSync) {
        bassRaw = bassBeatPulseRef.current * bassMultiplier * effMasterSensitivity;
        bassBeatPulseRef.current *= 0.85; // decay
      } else {
        bassRaw = bassAboveThreshold ? bassNorm * bassMultiplier * effMasterSensitivity : 0;
      }
      bassSmoothedRef.current = bassSmoothing * bassSmoothedRef.current + (1 - bassSmoothing) * bassRaw;
      const bassGradientValue = Math.max(bassMin, Math.min(bassMax, bassSmoothedRef.current));
      liveBassSmoothedRef.current = bassGradientValue;
      // Sub-bass drives Shape (audioSubBassLevel); bass drives Pulse/zoom
      setAudioSubBassLevel(subBassGradientValue);

      // Bass drives zoom — always decay toward 1, additive spike on hits (never compounds).
      // Pulses BELOW 1, not above: most gradients scale their rendered
      // pattern by dividing radius/position math by zoom, so a value below 1
      // makes the pattern LARGER (never exposes the black clear-fill at the
      // edges, since growing only crops excess beyond the canvas) instead of
      // above 1, which shrinks the pattern below full canvas coverage. Was
      // previously pulsed upward (shrinking) and relied on capping the
      // ceiling low enough to avoid exposing edges — fragile across ~24
      // different gradient implementations with their own zoom math, and
      // still visibly exposed edges on some of them. Flipping the direction
      // makes edge-safety a property of the math (grow-only) instead of a
      // tuned constant.
      // Zoom motion reacts at a quarter of the overall Intensity dial — a
      // camera-zoom punch reads as far more intense per unit of "level" than
      // a color or bar-height change does, so it needs its own (much lower)
      // scale rather than riding the same Intensity value Color/Shape use.
      const zoomMotionScale = 0.25;
      const bassRawForZoom = bassAboveThreshold ? Math.min(1, bassNorm * effMasterSensitivity * zoomMotionScale) : 0;
      setTargetZoomRef.current(prev => {
        const decayed = prev + (1 - prev) * (bassBeatSync ? 0.35 : 0.15);
        if (zoomBeatEnabled && bassRawForZoom > 0.05) {
          const spike = bassRawForZoom * (bassBeatSync ? 0.4 : 0.2);
          return Math.max(decayed - spike, 1 - (bassBeatSync ? 0.4 : 0.2));
        }
        return decayed;
      });

      // ---- MIDS (~250Hz-2kHz) ----
      let midsSum = 0;
      for (let i = midsLo; i < midsHi; i++) midsSum += dataArray[i];
      const midsAvgRaw = (midsSum / (midsHi - midsLo)) / 255;
      midsPeakRef.current = Math.max(midsAvgRaw, midsPeakRef.current * 0.999);
      const midsNorm = autoGainEnabled ? Math.min(1, midsAvgRaw / Math.max(midsPeakRef.current, 0.05)) : midsAvgRaw;
      liveMidsLevelRef.current = midsNorm;

      // Mids' own onset detector — previously mids BEAT just rode on bass
      // hits (see comment above) instead of reacting to actual mids-band
      // transients (vocals, snare body, melodic content).
      const midsOnset = midsAvgRaw > midsPrevRef.current * 1.3 && midsAvgRaw > midsThreshold + 0.05;
      // Tick fires on every detected transient regardless of the Mids BEAT
      // toggle — same decoupling as bass/sub-bass above — so consumers that
      // want raw onset info (not just the optional pulse effect) can use it.
      if (midsOnset && now - lastMidsBeatTimeRef.current > 150) {
        lastMidsBeatTimeRef.current = now;
        setMidsOnsetTick(t => t + 1);
        if (midsBeatSync) midsBeatPulseRef.current = 1.0;
      }
      midsPrevRef.current = midsAvgRaw;

      const midsAboveThreshold = midsAvgRaw > midsThreshold;
      let midsRaw: number;
      if (midsBeatSync) {
        midsRaw = midsBeatPulseRef.current * midsMultiplier * effMasterSensitivity;
        midsBeatPulseRef.current *= 0.85;
      } else {
        midsRaw = midsAboveThreshold ? midsNorm * midsMultiplier * effMasterSensitivity : 0;
      }
      midsSmoothedRef.current = midsSmoothing * midsSmoothedRef.current + (1 - midsSmoothing) * midsRaw;
      const midsEffectValue = Math.max(midsMin, Math.min(midsMax, midsSmoothedRef.current));
      liveMidsSmoothedRef.current = midsEffectValue;
      setAudioMidsLevel(midsEffectValue);

      // ---- TREBLE (~2-8kHz — hi-hats, snare crack, presence) ----
      let trebleSum = 0;
      for (let i = trebleLo; i < trebleHi; i++) trebleSum += dataArray[i];
      const trebleAvgRaw = (trebleSum / (trebleHi - trebleLo)) / 255;
      treblePeakRef.current = Math.max(trebleAvgRaw, treblePeakRef.current * 0.999);
      const trebleNorm = autoGainEnabled ? Math.min(1, trebleAvgRaw / Math.max(treblePeakRef.current, 0.05)) : trebleAvgRaw;
      liveTrebleLevelRef.current = trebleNorm;

      // Single onset detector shared by two independently-cadenced
      // triggers below: a fast one (150ms) for the beat pulse that drives
      // the actual Color effect intensity, and the original slow one
      // (800ms) for randomizing the palette — treble's own transients
      // (hi-hats, snare crack) are frequent enough that randomizing colors
      // on every single one would strobe, but the visual pulse should
      // still track them closely, similar to sub-bass/bass/mids.
      const trebleOnset = trebleAvgRaw > treblePrevRef.current * 1.2 && trebleAvgRaw > 0.05;
      if (trebleOnset && now - lastTreblePulseTimeRef.current > 150) {
        lastTreblePulseTimeRef.current = now;
        setTrebleOnsetTick(t => t + 1);
        if (trebleBeatSync) trebleBeatPulseRef.current = 1.0;
      }

      const trebleAboveThreshold = trebleAvgRaw > trebleThreshold;
      let trebleRaw: number;
      if (trebleBeatSync) {
        trebleRaw = trebleBeatPulseRef.current * trebleMultiplier * effMasterSensitivity * 90;
        trebleBeatPulseRef.current *= 0.85;
      } else {
        trebleRaw = trebleAboveThreshold ? trebleNorm * trebleMultiplier * effMasterSensitivity * 90 : 0;
      }
      trebleSmoothedRef.current = trebleSmoothing * trebleSmoothedRef.current + (1 - trebleSmoothing) * trebleRaw;
      const trebleColorValue = Math.max(trebleMin * 90, Math.min(trebleMax * 90, trebleSmoothedRef.current));
      liveTrebleSmoothedRef.current = trebleColorValue;
      setAudioTrebleLevel(trebleColorValue);

      // Color BEAT — randomize the palette on treble onsets, capped to
      // once per 800ms so it reads as a deliberate palette change rather
      // than a strobe. Evenly-spaced hues around a random base instead of
      // fully independent random RGB per swatch — same approach as the
      // bass-driven Palette Snap in InteractiveGradient.tsx — so the result
      // reads as an intentional palette rather than a muddy random mix.
      if (trebleBeatSync && trebleOnset && now - lastTrebleBeatRef.current > 800) {
        lastTrebleBeatRef.current = now;
        const baseHue = Math.random() * 360;
        setTargetColors(prev => {
          const count = prev.length || 4;
          return prev.map((_, i) => {
            const hue = ((baseHue + (360 / count) * i + (Math.random() * 16 - 8)) % 360 + 360) % 360;
            return hslToRgb(hue, 78 + Math.random() * 18, 46 + Math.random() * 16);
          });
        });
      }
      treblePrevRef.current = trebleAvgRaw;

      // Global energy — average of all bands, drives brightness in renderers
      const rawEnergy = (bassAvgRaw + midsAvgRaw + trebleAvgRaw) / 3;
      energySmoothedRef.current = 0.25 * energySmoothedRef.current + 0.75 * rawEnergy;
      setAudioEnergy(Math.min(1, energySmoothedRef.current * effMasterSensitivity * 2));

      // Music-structure awareness — compare the fast-smoothed energy just
      // computed above to a slow multi-second rolling average. A ratio well
      // above 1 means the track just got a lot louder relative to its own
      // recent history (a real "drop"), well below 1 means a quiet
      // stretch — either way this scales down toward 1 for a steady mix.
      longEnergyRef.current = longEnergyRef.current + (rawEnergy - longEnergyRef.current) * 0.0025;
      const energyRatio = energySmoothedRef.current / Math.max(longEnergyRef.current, 0.04);
      const targetIntensity = Math.min(1.8, Math.max(0.5, 0.55 + energyRatio * 0.5));
      musicIntensityRef.current += (targetIntensity - musicIntensityRef.current) * 0.05;

      requestAnimationFrame(analyzeAudio);
    };

    const animId = requestAnimationFrame(analyzeAudio);

    return () => {
      cancelAnimationFrame(animId);
    };
    // setTargetZoom intentionally excluded — read via setTargetZoomRef
    // instead (see its declaration above) since the inline wrapper
    // InteractiveGradient.tsx passes in is a new function identity on
    // every render, which was tearing down and rebuilding this whole
    // effect (and its RAF chain) almost continuously.
  }, [isAudioEnabled, isAudioReactive, analyserVersion, bassMultiplier, midsMultiplier, trebleMultiplier, bassSmoothing, midsSmoothing, trebleSmoothing, bassThreshold, midsThreshold, trebleThreshold, bassMin, bassMax, midsMin, midsMax, trebleMin, trebleMax, masterSensitivity, bassBeatSync, midsBeatSync, trebleBeatSync, subBassMultiplier, subBassBeatSync, zoomBeatEnabled, autoGainEnabled]);

  // Poll live level refs at ~15fps to drive the bar graph (every 4th frame)
  useEffect(() => {
    if (!isAudioEnabled) return;
    let rafId: number;
    let frame = 0;
    const poll = () => {
      if (++frame % 4 === 0) {
        // sqrt-scale the meter bars (not the values driving effects) — human
        // loudness perception is roughly logarithmic, so a raw linear 0-1
        // level reads as "barely moving" at quiet-to-moderate volumes even
        // when the underlying signal is legitimately present. sqrt pushes
        // the low end up without blowing out the top like a full dB scale would.
        setLiveBassLevel(Math.sqrt(Math.max(0, liveBaseLevelRef.current)));
        setLiveMidsLevel(Math.sqrt(Math.max(0, liveMidsLevelRef.current)));
        setLiveTrebleLevel(Math.sqrt(Math.max(0, liveTrebleLevelRef.current)));
        setLiveSubBassLevel(Math.sqrt(Math.max(0, liveSubBassLevelRef.current)));
      }
      rafId = requestAnimationFrame(poll);
    };
    rafId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(rafId);
  }, [isAudioEnabled]);

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
    audioSubBassLevel, setAudioSubBassLevel,
    audioMidsLevel, setAudioMidsLevel,
    audioTrebleLevel, setAudioTrebleLevel,
    audioEnergy, setAudioEnergy,
    subBassOnsetTick,
    bassOnsetTick,
    midsOnsetTick,
    trebleOnsetTick,
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
    autoGainEnabled, setAutoGainEnabled,
    depthLayerEnabled, setDepthLayerEnabled,
    depthLayerStrength, setDepthLayerStrength,
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
    musicIntensityRef,
    // Functions
    initAudioContext,
    handleFileUpload,
    startMicVisualization,
    stopMicVisualization,
    toggleAudio,
  };
}
