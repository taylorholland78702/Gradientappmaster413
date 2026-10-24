import { useCallback, type MutableRefObject, type SetStateAction } from 'react';
import { NO_DRAG_TYPES } from '../constants/gradientEffects';
import { useTouchGestures } from './useTouchGestures';
import type { ColorRGB, GradientType } from '../constants/gradientEffects';

// Mouse, touch and wheel handling on the canvas: dragging rotates the gradient, wheel zooms, touches feed the gesture engine. Moved out of InteractiveGradient unchanged.
export interface UseCanvasPointerParams {
  activeTab: "color" | "gradients" | "effects" | "audio" | "presets";
  baseAIColors: ColorRGB[];
  canvasRef: MutableRefObject<HTMLCanvasElement>;
  exportAsPNG: (mode?: "download" | "preview") => Promise<void>;
  gestureActionsRef: MutableRefObject<{ goBack: () => void; goForward: () => void; togglePause: () => void; toggleControls: () => void; }>;
  gradientColors: ColorRGB[];
  gradientType: GradientType;
  isAutoMode: boolean;
  isDragging: boolean;
  lastChangeTime: MutableRefObject<number>;
  lastManualZoomTime: MutableRefObject<number>;
  particlesMode: "drift" | "flow-field" | "marks";
  previousPosition: MutableRefObject<{ x: number; y: number; }>;
  randomColor: () => ColorRGB;
  setActiveTab: (value: SetStateAction<"color" | "gradients" | "effects" | "audio" | "presets">) => void;
  setIsDragging: (value: SetStateAction<boolean>) => void;
  setTargetAngle: (value: SetStateAction<number>) => void;
  setTargetColors: (value: SetStateAction<ColorRGB[]>) => void;
  setTargetZoom: (value: SetStateAction<number>) => void;
  targetAngleRef: MutableRefObject<number>;
  targetColorsRef: MutableRefObject<ColorRGB[]>;
  targetZoomRef: MutableRefObject<number>;
}

// Minimum time between color changes (in milliseconds)
const CHANGE_INTERVAL = 300;

export function useCanvasPointer(p: UseCanvasPointerParams) {
  const { activeTab, baseAIColors, canvasRef, exportAsPNG, gestureActionsRef, gradientColors, gradientType, isAutoMode, isDragging, lastChangeTime, lastManualZoomTime, particlesMode, previousPosition, randomColor, setActiveTab, setIsDragging, setTargetAngle, setTargetColors, setTargetZoom, targetAngleRef, targetColorsRef, targetZoomRef } = p;
  const handleInteraction = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Calculate angle from the center of the canvas's own display box, not
    // the window — the canvas no longer spans the full viewport now that
    // the rail is a docked sidebar the canvas area reflows around.
    const canvasRect = canvas.getBoundingClientRect();
    const centerX = canvasRect.left + canvasRect.width / 2;
    const centerY = canvasRect.top + canvasRect.height / 2;
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;

    // Update gradient angle based on mouse position relative to center
    if (previousPosition.current) {
      const prevDeltaX = previousPosition.current.x - centerX;
      const prevDeltaY = previousPosition.current.y - centerY;

      // Calculate cross product to determine rotation direction
      const crossProduct = prevDeltaX * deltaY - prevDeltaY * deltaX;

      // If moving in a circular pattern, update the angle
      if (Math.abs(crossProduct) > 100) { // Threshold to detect circular motion
        const angleIncrement = crossProduct > 0 ? 5 : -5;
        setTargetAngle(prev => prev + angleIncrement);
      }
    }

    previousPosition.current = { x: clientX, y: clientY };

    const currentTime = Date.now();
    if (currentTime - lastChangeTime.current < CHANGE_INTERVAL) return;

    // Calculate which part of the canvas was touched to determine which color to change
    const relativeX = (clientX - canvasRect.left) / canvasRect.width;
    
    // Determine which color index to change based on horizontal position
    const colorIndex = Math.floor(relativeX * gradientColors.length);
    const clampedIndex = Math.max(0, Math.min(colorIndex, gradientColors.length - 1));

    // Update only the selected color
    setTargetColors(prev => 
      prev.map((color, index) => {
        if (index === clampedIndex) {
          // If we have base AI colors, create a variation of the base color
          if (baseAIColors && baseAIColors[index]) {
            const baseColor = baseAIColors[index];
            const maxDrift = 40; // Allow some variation during interaction
            return {
              r: Math.max(0, Math.min(255, baseColor.r + (Math.random() - 0.5) * maxDrift * 2)),
              g: Math.max(0, Math.min(255, baseColor.g + (Math.random() - 0.5) * maxDrift * 2)),
              b: Math.max(0, Math.min(255, baseColor.b + (Math.random() - 0.5) * maxDrift * 2)),
            };
          }
          // No base colors, use random
          return randomColor();
        }
        return color;
      })
    );
    
    lastChangeTime.current = currentTime;
  }, [isDragging, gradientColors.length, baseAIColors, randomColor]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Clicking the canvas is "outside" whichever tab drawer (Gradient/
    // Effects/Audio/Color/Presets) is open — same dismissal Escape already
    // does, just reachable without the keyboard. Auto Shuffle/About already
    // close on any outside click via their own document-level listeners
    // (see the effect above renderAutoShufflePopover), so this only needs
    // to cover the one popup that didn't have that: the main drawer.
    if (activeTab) setActiveTab(null);
    // Self-animating gradients — drag interaction conflicts with their own animation
    if (NO_DRAG_TYPES.includes(gradientType ?? '')) return;
    // Particles' 'flow-field' mode drifts on its own too — same reasoning
    // as NO_DRAG_TYPES above, just mode- rather than type-gated since it's
    // no longer its own standalone gradient type.
    if (gradientType === 'particles' && particlesMode === 'flow-field') return;

    setIsDragging(true);
    previousPosition.current = null;
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    previousPosition.current = null;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    handleInteraction(e.clientX, e.clientY);
  }, [handleInteraction]);

  const { handleTouchStart, handleTouchEnd, handleTouchCancel, handleTouchMove } = useTouchGestures({
    activeTab, setActiveTab, setIsDragging, previousPosition, targetZoomRef, targetAngleRef, targetColorsRef,
    gestureActionsRef, exportAsPNG, lastManualZoomTime, setTargetZoom, setTargetAngle, setTargetColors,
    handleInteraction, isAutoMode,
  });
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    // ctrlKey signals a trackpad pinch gesture — ignore it
    if (e.ctrlKey) { e.preventDefault(); return; }
    e.preventDefault();
    lastManualZoomTime.current = Date.now();
    const multiplier = (isAutoMode ? 0.01 : 0.025) * 0.5;
    const zoomDelta = -e.deltaY * multiplier;
    setTargetZoom(prev => Math.max(0.05, Math.min(20, prev + zoomDelta)));
  }, [isAutoMode]);
  return { handleMouseDown, handleMouseMove, handleMouseUp, handleTouchCancel, handleTouchEnd, handleTouchMove, handleTouchStart, handleWheel };
}
