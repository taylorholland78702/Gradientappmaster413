// Matches the custom `figma:asset/*` resolver in vite.config.ts
// (figmaAssetResolver), which maps these imports to files under src/assets.
declare module 'figma:asset/*' {
  const src: string;
  export default src;
}
