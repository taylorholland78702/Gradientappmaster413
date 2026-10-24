// Live-performance "Display" window: a second, UI-less tab that mirrors the
// controller's canvas so the operator can drive the app from one screen
// while a clean, hotkey-only-hidden output projects on another. Synced via
// localStorage + the 'storage' event rather than BroadcastChannel — popups
// opened via window.open can land in a different agent cluster (browsers
// vary on this, especially under COOP), which silently breaks
// BroadcastChannel between opener and popup even same-origin; localStorage
// is origin-scoped and doesn't have that failure mode. The 'storage' event
// conveniently never fires in the tab that made the write, so no echo
// filtering is needed. Read once at module load — the URL flag never
// changes mid-session.
export const IS_DISPLAY_MODE = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('display') === '1';
// Standalone playback: a ?display=1&preset=<encoded> link carries its own
// frozen preset instead of depending on a live controller tab to broadcast
// state (the mirror behavior IS_DISPLAY_MODE was originally built for).
// Read once at module load, same as IS_DISPLAY_MODE — the preset-loader
// effect below strips the `preset` param from the URL after applying it,
// so re-checking window.location.search later in the session would miss it.
export const IS_STANDALONE_DISPLAY = IS_DISPLAY_MODE && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('preset');
export const DISPLAY_SYNC_KEY = 'wav-display-sync';
// Separate, higher-frequency channel just for the handful of continuously-
// ticking "AnimTime" fields (marble swirl, aurora bands, etc.) that
// live outside buildSnapshot. Kept off the main config channel/localStorage
// on purpose — these tick every 16ms while playing, far too often for
// localStorage writes, and mixing them into buildSnapshot would make ITS
// identity (and therefore every undo/preset snapshot) change every frame.
export const DISPLAY_ANIM_SYNC_KEY = 'wav-display-sync-anim';
