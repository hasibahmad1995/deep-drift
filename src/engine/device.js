/* What kind of screen and settings the visitor has. */
import { SETTINGS } from '../config.js';

const SMALL = Math.min(window.innerWidth, window.innerHeight) < 600 || /Mobi|Android/i.test(navigator.userAgent);
const DETAIL = SETTINGS.reefDetail * (SMALL ? 0.5 : 1);
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export { SMALL, DETAIL, REDUCED };
