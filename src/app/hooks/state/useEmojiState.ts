import { useState, useRef } from 'react';

export function useEmojiState() {
  const [emojiSize, setEmojiSize] = useState(28);
  const [emojiChars, setEmojiChars] = useState('😴🙂😃🤩🔥');
  const [emojiRotateSpeed, setEmojiRotateSpeed] = useState(41);
  const [emojiAnimTime, setEmojiAnimTime] = useState(0);
  const [emojiOffsetX, setEmojiOffsetX] = useState(0);
  const [emojiSizeVariation, setEmojiSizeVariation] = useState(0);
  const [emojiPickerSearch, setEmojiPickerSearch] = useState('');

  return {
    emojiSize,
    setEmojiSize,
    emojiChars,
    setEmojiChars,
    emojiRotateSpeed,
    setEmojiRotateSpeed,
    emojiAnimTime,
    setEmojiAnimTime,
    emojiOffsetX,
    setEmojiOffsetX,
    emojiSizeVariation,
    setEmojiSizeVariation,
    emojiPickerSearch,
    setEmojiPickerSearch,
  };
}
