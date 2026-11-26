/**
 * On-screen controls for phones and tablets: a thumb stick and three buttons, drawn as plain square
 * pixel-style blocks (temporary, code-drawn: no control art has been supplied). They appear only on a
 * touch screen and only while a game is on the ice. Scenes read `touchState` like a gamepad.
 */
import { stickVector, TOUCH } from './touchModel';

export const touchState = { x: 0, y: 0, shoot: false, pass: false, check: false };

let root: HTMLElement | null = null;
let onMenu: (() => void) | null = null;
let listeners: (() => void)[] = [];
/** A game is on the ice and wants the controls, if this turns out to be a touch screen. */
let wanted = false;

/** Has this device shown itself to be a touch screen? Set at load, or at the first touch. */
export function isTouch(): boolean {
  return document.body.classList.contains('touch');
}

/** Tell anything that lays the page out (the stage) that touch has been switched on or the controls shown or hidden. */
export function onTouchChange(listener: () => void): void {
  listeners.push(listener);
}

function button(id: string, label: string, set: (down: boolean) => void): HTMLElement {
  const el = document.createElement('div');
  el.className = 'tc-button';
  el.id = id;
  el.textContent = label;
  const press = (down: boolean) => (event: PointerEvent) => {
    event.preventDefault();
    if (down) el.setPointerCapture(event.pointerId);
    el.classList.toggle('down', down);
    set(down);
  };
  el.addEventListener('pointerdown', press(true));
  el.addEventListener('pointerup', press(false));
  el.addEventListener('pointercancel', press(false));
  return el;
}

function stick(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'tc-stick';
  const knob = document.createElement('div');
  knob.className = 'tc-knob';
  el.appendChild(knob);
  let active = -1;
  const move = (event: PointerEvent): void => {
    if (event.pointerId !== active) return;
    event.preventDefault();
    const box = el.getBoundingClientRect();
    const dx = event.clientX - (box.left + box.width / 2);
    const dy = event.clientY - (box.top + box.height / 2);
    const v = stickVector(dx, dy);
    touchState.x = v.x;
    touchState.y = v.y;
    const len = Math.hypot(dx, dy) || 1;
    const reach = Math.min(len, TOUCH.stickRadius);
    knob.style.transform = `translate(${Math.round((dx / len) * reach)}px, ${Math.round((dy / len) * reach)}px)`;
  };
  const release = (event: PointerEvent): void => {
    if (event.pointerId !== active) return;
    active = -1;
    touchState.x = 0;
    touchState.y = 0;
    knob.style.transform = '';
  };
  el.addEventListener('pointerdown', (event) => {
    active = event.pointerId;
    el.setPointerCapture(event.pointerId);
    move(event);
  });
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
  return el;
}

function build(): HTMLElement {
  const el = document.createElement('div');
  el.id = 'touch-controls';
  el.hidden = true;
  const left = document.createElement('div');
  left.className = 'tc-left';
  left.appendChild(stick());
  const right = document.createElement('div');
  right.className = 'tc-right';
  right.appendChild(button('tc-pass', 'Pass', (down) => (touchState.pass = down)));
  right.appendChild(button('tc-check', 'Check', (down) => (touchState.check = down)));
  right.appendChild(button('tc-shoot', 'Shoot', (down) => (touchState.shoot = down)));
  const menu = button('tc-menu', 'Menu', (down) => {
    if (down) onMenu?.();
  });
  el.append(left, right, menu);
  // No scrolling, zooming or long-press menus while playing.
  el.addEventListener('contextmenu', (event) => event.preventDefault());
  document.body.appendChild(el);
  return el;
}

/** Call once at start-up. Marks the page as a touch screen now or at the first touch. */
export function installTouchControls(): void {
  if (root) return;
  root = build();
  const mark = (): void => {
    if (isTouch()) return;
    document.body.classList.add('touch');
    apply();
  };
  if (navigator.maxTouchPoints > 0 || 'ontouchstart' in window) mark();
  window.addEventListener('touchstart', mark, { passive: true });
}

/** Show the controls for a game on the ice (and say what Menu does), or put them away. */
export function showTouchControls(show: boolean, menu: (() => void) | null = null): void {
  if (!root) return;
  onMenu = menu;
  wanted = show;
  apply();
}

/** The controls are on screen only on a touch screen, and only while a game wants them. */
function apply(): void {
  if (!root) return;
  const show = wanted && isTouch();
  root.hidden = !show;
  document.body.classList.toggle('touch-playing', show);
  touchState.x = 0;
  touchState.y = 0;
  touchState.shoot = false;
  touchState.pass = false;
  touchState.check = false;
  root.querySelectorAll('.down').forEach((el) => el.classList.remove('down'));
  for (const l of listeners) l();
}
