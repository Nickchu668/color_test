
export interface ColorHSL {
  h: number;
  s: number;
  l: number;
}

const FALLBACK_PAIRS = [
  ['#C8C8C8', '#C0C8C8'],
  ['#646464', '#646364'],
  ['#0096C8', '#0095C8'],
  ['#FFC8C8', '#FFC7C8'],
  ['#64C864', '#64C964'],
  ['#9696FF', '#9695FF']
];

export const generateColors = (level: number, difficulty: number) => {
  // Use HSL for dynamic generation
  const h = Math.floor(Math.random() * 360);
  const s = 40 + Math.floor(Math.random() * 40);
  const l = 40 + Math.floor(Math.random() * 20);

  const baseColor = `hsl(${h}, ${s}%, ${l}%)`;
  
  // Apply offset based on difficulty. 
  // Lower difficulty = smaller offset = harder.
  const offset = difficulty;
  const hOffset = Math.random() > 0.5 ? offset : -offset;
  const sOffset = Math.random() > 0.5 ? offset / 2 : -offset / 2;
  const lOffset = Math.random() > 0.5 ? offset / 2 : -offset / 2;

  const oddColor = `hsl(${h + hOffset}, ${s + sOffset}%, ${l + lOffset}%)`;

  return { baseColor, oddColor };
};
