// Original geometric demonstration assets; no image files or third-party artwork are embedded.
// Transparent margins and substantial opaque regions support the renderer's alpha-based particles.
export function createPlaceholder(id) {
  const c = document.createElement('canvas');
  // A1/C1 have fixed-pixel crop boxes in existing shots; other assets can use a smaller backing store.
  const scale = id === 'A1' || id === 'C1' ? 1 : 0.5;
  c.width = 1024 * scale; c.height = 1536 * scale;
  c.src = `placeholder:${id}`; // Distinct cache keys for the mosaic renderer.
  const x = c.getContext('2d');
  x.scale(scale, scale);
  const seed = [...id].reduce((n, ch) => n * 31 + ch.charCodeAt(0), 7) >>> 0;
  const hue = seed % 360, ink = '#142136', light = '#eaf4ff';
  const primary = `hsl(${hue} 57% 66%)`, secondary = `hsl(${(hue + 65) % 360} 46% 45%)`;
  const rect = (a, b, w, h, color) => { x.fillStyle = color; x.fillRect(a, b, w, h); };
  const circle = (a, b, r, color) => { x.fillStyle = color; x.beginPath(); x.arc(a, b, r, 0, Math.PI * 2); x.fill(); };
  const polygon = (points, color) => {
    x.fillStyle = color; x.beginPath(); points.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.fill();
  };
  if (/^[EGNP]/.test(id)) {
    rect(100, 160, 824, 1140, secondary); rect(138, 198, 748, 1064, '#23334a');
    circle(730, 380, 102, primary);
    polygon([[160, 850], [420, 460], [690, 850]], primary);
    polygon([[420, 850], [680, 600], [864, 850]], light);
    rect(190, 940, 640, 46, primary); rect(190, 1030, 430, 30, light); rect(190, 1108, 540, 30, secondary);
  } else {
    const portrait = id === 'A3' || id.startsWith('A4');
    const headY = portrait ? 360 : 285, headR = portrait ? 245 : 155;
    rect(460, headY + headR - 15, 104, 170, secondary);
    polygon([[360, 510], [664, 510], [738, 1010], [286, 1010]], primary);
    rect(352, 1000, 128, 340, secondary); rect(544, 1000, 128, 340, primary);
    rect(310, 1320, 170, 78, ink); rect(544, 1320, 170, 78, ink);
    polygon([[354, 530], [285, 530], [183, 920], [276, 950], [399, 630]], secondary);
    polygon([[670, 530], [739, 530], [841, 920], [748, 950], [625, 630]], secondary);
    circle(229, 934, 52, light); circle(795, 934, 52, light);
    circle(512, headY, headR + 16, ink); circle(512, headY, headR, primary);
    rect(512 - headR * 0.66, headY - 35, headR * 1.32, 90, ink);
    circle(512 - headR * 0.35, headY + 10, 17, light); circle(512 + headR * 0.35, headY + 10, 17, light);
    rect(475, headY + headR * 0.55, 74, 12, ink);
    circle(512, 690, 65, light); circle(512, 690, 34, secondary); rect(371, 882, 282, 32, ink);
  }
  return c;
}
