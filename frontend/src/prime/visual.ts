/**
 * Visual FX for Prime Effects
 * Pure functions called during canvas draw loop
 */

export type VisualCtx = {
  ctx: CanvasRenderingContext2D;
  nowMs: number;
  startedAtMs: number;
  payload: Record<string, any>;
  layout: any;
  theme: any;
  reducedMotion: boolean;
};

export function signalGlow(v: VisualCtx) {
  const { ctx, nowMs, startedAtMs, payload, layout, theme, reducedMotion } = v;
  const t = Math.max(0, nowMs - startedAtMs);
  const base = layout.signalPos;
  if (!base) return;

  const radius = 30;
  const alpha = reducedMotion ? 0.25 : 0.25 * (1 - Math.cos(Math.min(1, t / 400) * Math.PI));

  ctx.save();
  ctx.shadowColor = payload.color || theme.signalGreen;
  ctx.shadowBlur = reducedMotion ? 8 : 24;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(base.x, base.y + 25, radius + 6, 0, 2 * Math.PI);
  ctx.fillStyle = payload.color || theme.signalGreen;
  ctx.fill();
  ctx.restore();
}

export function lensFlash(v: VisualCtx) {
  const { ctx, nowMs, startedAtMs, payload, layout, theme, reducedMotion } = v;
  const t = Math.max(0, nowMs - startedAtMs);
  const base = layout.signalPos;
  if (!base) return;

  const durMs = payload.durMs || 500;
  const progress = Math.min(1, t / durMs);
  const alpha = reducedMotion ? 0.3 : 0.5 * Math.sin(progress * Math.PI);

  ctx.save();
  ctx.shadowColor = payload.color || theme.signalYellow;
  ctx.shadowBlur = reducedMotion ? 8 : 20;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(base.x, base.y + 25, 32, 0, 2 * Math.PI);
  ctx.fillStyle = payload.color || theme.signalYellow;
  ctx.fill();
  ctx.restore();
}

export function pedBlink(v: VisualCtx) {
  const { ctx, payload, layout, theme, nowMs, startedAtMs, reducedMotion } = v;
  const cwId = payload.crosswalk === 'active' ? layout.activeCrosswalkId : payload.crosswalk;
  const cw = layout.crosswalks?.find((c: any) => c.id === cwId);
  if (!cw) return;

  const blinks = payload.blinks ?? 2;
  const each = payload.eachMs ?? 250;
  const t = Math.max(0, nowMs - startedAtMs);
  const phase = Math.floor(t / (each * 2));

  if (phase >= blinks) return;

  const on = Math.floor(t / each) % 2 === 0;

  ctx.save();
  ctx.globalAlpha = on ? 0.85 : 0.0;
  ctx.strokeStyle = theme.signalRed || '#ef4444';
  ctx.lineWidth = 3.5;

  // Draw stick figure
  const x = cw.centerX;
  const y = cw.centerY;

  // Head
  ctx.beginPath();
  ctx.arc(x, y - 20, 9, 0, 2 * Math.PI);
  ctx.stroke();

  // Body + legs
  ctx.beginPath();
  ctx.moveTo(x, y - 11);
  ctx.lineTo(x, y + 12);
  ctx.stroke();

  ctx.restore();
}

export function chevronShimmer(v: VisualCtx) {
  const { ctx, layout, theme, nowMs, startedAtMs, payload, reducedMotion } = v;
  const car = layout.oncomingCar;
  if (!car) return;

  const t = Math.max(0, nowMs - startedAtMs);
  const offset = reducedMotion ? 0 : (Math.sin(t / 120) + 1) * 4;

  ctx.save();
  ctx.font = 'bold 18px Inter, system-ui, sans-serif';
  ctx.fillStyle = theme.carUrgent || '#f87171';
  ctx.globalAlpha = 0.6;
  ctx.fillText('››', car.x - 40 + offset, car.y + 6);
  ctx.restore();
}

export function egoProgressRing(v: VisualCtx) {
  const { ctx, layout, theme, nowMs, startedAtMs, payload, reducedMotion } = v;
  const ego = layout.egoMarker;
  if (!ego) return;

  const dur = payload.shrinkMs ?? 900;
  const t = Math.max(0, nowMs - startedAtMs);
  const k = Math.min(1, t / dur);
  const r0 = 28;
  const r = reducedMotion ? r0 : r0 * (1 - k);

  ctx.save();
  ctx.strokeStyle = theme.signalGreen || '#34d399';
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = payload.width ?? 3;
  ctx.beginPath();
  ctx.arc(ego.x, ego.y, Math.max(10, r), 0, 2 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

export function rearGlow(v: VisualCtx) {
  const { ctx, layout, theme, payload } = v;
  const ego = layout.egoMarker;
  if (!ego) return;

  ctx.save();
  ctx.shadowColor = theme.text || '#ffffff';
  ctx.shadowBlur = 12;
  ctx.globalAlpha = payload.alpha ?? 0.25;
  ctx.fillStyle = '#f87171';
  ctx.fillRect(ego.x - 22, ego.y + 18, 44, 8);
  ctx.restore();
}

export const VisualFX = {
  signalGlow,
  lensFlash,
  pedBlink,
  chevronShimmer,
  egoProgressRing,
  rearGlow
};
