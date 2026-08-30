import { oilPaintPixels } from './oilPaintPixels';

export function applyOilPaint(P: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { displayWidth, displayHeight, oilPaintRadius, oilPaintLevels, putScaledImageData, getDisplayImageData } = P;
  const oilImageData = getDisplayImageData();
  oilPaintPixels(oilImageData.data, displayWidth, displayHeight, oilPaintRadius, oilPaintLevels);
  putScaledImageData(oilImageData);
}
