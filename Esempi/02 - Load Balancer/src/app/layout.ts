/** Geometria del diagramma (coordinate del viewBox SVG). */

export interface Point {
  x: number;
  y: number;
}

export const VIEW_W = 1000;
export const VIEW_H = 560;

export const CLIENT_X = 150;
export const CLIENT_R = 22;

export const LB = { x: 480, y: VIEW_H / 2, w: 160, h: 116 };

export const SERVER_X = 840;
export const SERVER_W = 200;
export const SERVER_H = 74;

export const LB_IN: Point = { x: LB.x - LB.w / 2, y: LB.y };
export const LB_OUT: Point = { x: LB.x + LB.w / 2, y: LB.y };

/** Distribuisce verticalmente n elementi, con una spaziatura massima. */
function spread(index: number, count: number, maxStep: number): number {
  if (count <= 1) {
    return VIEW_H / 2;
  }
  const step = Math.min(maxStep, (VIEW_H - 100) / (count - 1));
  return VIEW_H / 2 - (step * (count - 1)) / 2 + step * index;
}

export function clientCenter(index: number, count: number): Point {
  return { x: CLIENT_X, y: spread(index, count, 84) };
}

export function serverCenter(index: number, count: number): Point {
  return { x: SERVER_X, y: spread(index, count, 110) };
}

export function clientAnchor(index: number, count: number): Point {
  const c = clientCenter(index, count);
  return { x: c.x + CLIENT_R, y: c.y };
}

export function serverAnchor(index: number, count: number): Point {
  const c = serverCenter(index, count);
  return { x: c.x - SERVER_W / 2, y: c.y };
}
