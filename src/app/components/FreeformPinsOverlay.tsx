import React from 'react';

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
}

export const FreeformPinsOverlay: React.FC<FreeformPinsOverlayProps> = ({
  colorPins,
  selectedPinId,
  setSelectedPinId,
  setIsDraggingPin,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
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
            {/* Influence radius visualization */}
            <div
              className="absolute rounded-full border-2 border-white/30 pointer-events-none"
              style={{
                width: `${pin.radius * 2}px`,
                height: `${pin.radius * 2}px`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: isSelected ? 0.5 : 0.2,
              }}
            />
            {/* Pin marker */}
            <div
              className={`w-6 h-6 rounded-full border-3 ${isSelected ? 'border-white' : 'border-white/50'} shadow-lg`}
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
