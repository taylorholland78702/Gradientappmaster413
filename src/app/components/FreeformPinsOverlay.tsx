import React, { useCallback, useEffect, useRef, useState } from 'react';

interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

interface ColorPin {
  id: string;
  x: number;
  y: number;
  color: ColorRGB;
  radius: number;
}

interface FreeformPinsOverlayProps {
  colorPins: ColorPin[];
  selectedPinId: string | null;
  setSelectedPinId: (id: string | null) => void;
  setIsDraggingPin: (dragging: boolean) => void;
  onRadiusChange: (id: string, radius: number) => void;
}

const FreeformPinsOverlayInner: React.FC<FreeformPinsOverlayProps> = ({
  colorPins,
  selectedPinId,
  setSelectedPinId,
  setIsDraggingPin,
  onRadiusChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const resizingPinRef = useRef<{ id: string; cx: number; cy: number } | null>(null);

  const onResizeMouseDown = useCallback((e: React.MouseEvent, pin: ColorPin) => {
    e.stopPropagation();
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cx = pin.x * rect.width;
    const cy = pin.y * rect.height;
    resizingPinRef.current = { id: pin.id, cx, cy };
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e: MouseEvent) => {
      const ref = resizingPinRef.current;
      const container = containerRef.current;
      if (!ref || !container) return;
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const dist = Math.sqrt((mx - ref.cx) ** 2 + (my - ref.cy) ** 2);
      const clamped = Math.max(50, Math.min(800, Math.round(dist)));
      onRadiusChange(ref.id, clamped);
    };
    const onUp = () => {
      setIsResizing(false);
      resizingPinRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isResizing, onRadiusChange]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      {colorPins.map((pin) => {
        const isSelected = selectedPinId === pin.id;

        return (
          <div
            key={pin.id}
            className="absolute pointer-events-auto cursor-pointer"
            style={{
              left: `${pin.x * 100}%`,
              top: `${pin.y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setSelectedPinId(pin.id);
              setIsDraggingPin(true);
            }}
          >
            {/* Influence radius circle */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: `${pin.radius * 2}px`,
                height: `${pin.radius * 2}px`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                border: isSelected ? '1.5px solid rgba(255,255,255,0.55)' : '1.5px solid rgba(255,255,255,0.2)',
              }}
            />

            {/* Resize handle — right edge of circle, selected only */}
            {isSelected && (
              <div
                className="absolute pointer-events-auto"
                style={{
                  left: `${pin.radius}px`,
                  top: '-6px',
                  cursor: 'ew-resize',
                }}
                onMouseDown={(e) => onResizeMouseDown(e, pin)}
              >
                <div
                  className="w-3 h-3 rounded-full bg-white border-2 shadow"
                  style={{ borderColor: `rgb(${pin.color.r},${pin.color.g},${pin.color.b})` }}
                />
              </div>
            )}

            {/* Pin marker */}
            <div
              className={`w-6 h-6 rounded-full ${isSelected ? 'border-2 border-white' : 'border-2 border-white/50'} shadow-lg`}
              style={{
                backgroundColor: `rgb(${pin.color.r}, ${pin.color.g}, ${pin.color.b})`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

export const FreeformPinsOverlay = React.memo(FreeformPinsOverlayInner);
