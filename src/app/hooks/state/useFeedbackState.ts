import { useState, useRef } from 'react';

export function useFeedbackState() {
  const [feedbackDecay, setFeedbackDecay] = useState(0.85);
  const [feedbackZoom, setFeedbackZoom] = useState(1.0);
  const [feedbackRotation, setFeedbackRotation] = useState(0);
  const feedbackBufferRef = useRef<HTMLCanvasElement | null>(null);

  return {
    feedbackDecay,
    setFeedbackDecay,
    feedbackZoom,
    setFeedbackZoom,
    feedbackRotation,
    setFeedbackRotation,
    feedbackBufferRef,
  };
}
