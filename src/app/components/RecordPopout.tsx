import { ChoiceChips } from './choice';
import { type VideoSize, type VideoLength, VIDEO_SIZES, VIDEO_LENGTHS } from '../constants/exportOptions';

// The "Record video" popout, opened from the rail's Record button: how big the take is, how long
// it runs, and the button that starts it. Records the live artwork, with sound if audio is on, as an MP4.
export function RecordPopout({
  videoSize, setVideoSize, videoLength, setVideoLength, isRecording, startVideoTake,
}: {
  videoSize: VideoSize; setVideoSize: (v: VideoSize) => void;
  videoLength: VideoLength; setVideoLength: (v: VideoLength) => void;
  isRecording: boolean; startVideoTake: () => void;
}) {
  return (<>
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-wav-text-2" title="Long edge of the video. Re-renders the artwork at that size for the take.">Size</span>
      <ChoiceChips ariaLabel="Video size" options={VIDEO_SIZES} value={videoSize} onChange={setVideoSize} disabled={isRecording} />
    </div>
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-wav-text-2" title="The take stops by itself after this long. Until I stop leaves it to the Record button.">Length</span>
      <ChoiceChips ariaLabel="Video length" options={VIDEO_LENGTHS} value={videoLength} onChange={setVideoLength} disabled={isRecording} />
    </div>
    <button
      onClick={startVideoTake}
      className={`wav-choice text-[11px] font-semibold transition-all text-white ${isRecording ? 'bg-wav-recording' : 'bg-wav-hover'}`}
    >{isRecording ? 'Stop recording' : 'Start recording'}</button>
    {videoSize === '4k' && <p className="text-[10px] text-wav-text-3">4K is heavy: busy gradients or effects may drop frames.</p>}
  </>);
}
