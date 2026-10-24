import { useEffect, type MutableRefObject, type SetStateAction } from 'react';

// Keeps isFullscreen in step with the browser, including when the user leaves fullscreen with Esc. Moved out of InteractiveGradient unchanged.
export interface UseFullscreenSyncParams {
  containerRef: MutableRefObject<HTMLDivElement>;
  setIsFullscreen: (value: SetStateAction<boolean>) => void;
}

export function useFullscreenSync(p: UseFullscreenSyncParams) {
  const { containerRef, setIsFullscreen } = p;
  useEffect(() => {
    const currentRef = containerRef.current;
    if (currentRef) {
      const handleFullScreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
          };

      currentRef.addEventListener('fullscreenchange', handleFullScreenChange);
      currentRef.addEventListener('mozfullscreenchange', handleFullScreenChange);
      currentRef.addEventListener('webkitfullscreenchange', handleFullScreenChange);
      currentRef.addEventListener('msfullscreenchange', handleFullScreenChange);

      return () => {
        currentRef.removeEventListener('fullscreenchange', handleFullScreenChange);
        currentRef.removeEventListener('mozfullscreenchange', handleFullScreenChange);
        currentRef.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
        currentRef.removeEventListener('msfullscreenchange', handleFullScreenChange);
      };
    }
  }, []);

  // Preset load effect, savePreset, loadPreset, deletePreset, renamePreset, updatePreset are now in usePresets hook

  // Listen for fullscreen changes (e.g., user pressing ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
}
