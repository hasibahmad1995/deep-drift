/* Controls layout on phones, the blog and the credits. */
import { state } from '../dive/state.js';
import { togglePause } from './playback.js';
import { $ } from '../util/dom.js';
import { TOPICS, POSTS } from '../content/posts.js';

const compactQuery = window.matchMedia('(pointer: coarse), (max-width: 900px)');
function layoutControls() {
  const compact = compactQuery.matches;
  if (compact) { $('sheetBody').append($('controls')); $('btnMenu').hidden = false; }
  else { $('bar').append($('controls')); $('btnMenu').hidden = true; closeSheet(); }
}
function openSheet() { $('sheet').hidden = false; $('sheetBackdrop').hidden = false; $('btnMenu').setAttribute('aria-expanded', 'true'); $('btnPause').focus(); }
function closeSheet() { $('sheet').hidden = true; $('sheetBackdrop').hidden = true; $('btnMenu').setAttribute('aria-expanded', 'false'); }
const journal = { wasPlaying: false };
function openJournal() {
  journal.wasPlaying = state.playing; if (state.playing) togglePause();
  $('journal').hidden = false; $('journal').scrollTop = 0; $('btnCloseJournal').focus();
}
function closeJournal() { $('journal').hidden = true; if (journal.wasPlaying && !state.playing) togglePause(); if (!$('btnMenu').hidden) $('btnMenu').focus(); else $('btnBlog').focus(); }
function openCredits() { $('credits').hidden = false; $('btnCloseCredits').focus(); }
function wirePanels() {
  $('btnMenu').addEventListener('click', () => ($('sheet').hidden ? openSheet() : closeSheet()));
  $('sheetBackdrop').addEventListener('click', closeSheet);
  compactQuery.addEventListener('change', layoutControls);
  $('controls').addEventListener('click', e => {
    const b = e.target.closest('button'); if (b && ['btnRecenter', 'btnBlog', 'btnCredits'].includes(b.id)) closeSheet();
  });
  $('btnBlog').addEventListener('click', openJournal); $('linkBlog').addEventListener('click', e => { e.preventDefault(); openJournal(); });
  $('btnCloseJournal').addEventListener('click', closeJournal);
  $('btnCredits').addEventListener('click', openCredits); $('linkCredits').addEventListener('click', e => { e.preventDefault(); openCredits(); });
  $('btnCloseCredits').addEventListener('click', () => { $('credits').hidden = true; });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!$('credits').hidden) $('credits').hidden = true; else if (!$('journal').hidden) closeJournal(); else if (!$('sheet').hidden) closeSheet();
  });
}
let activeTopic = 'All';
function buildJournal() {
  const filters = $('filters'); filters.textContent = '';
  ['All', ...TOPICS].forEach(name => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.textContent = name; b.setAttribute('aria-pressed', String(name === activeTopic));
    b.addEventListener('click', () => { activeTopic = name; filters.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); drawCards(); });
    filters.append(b);
  });
  drawCards();
}
function drawCards() {
  const box = $('cards'); box.textContent = '';
  POSTS.filter(p => activeTopic === 'All' || p.topics.includes(activeTopic)).forEach((p, i) => {
    const card = document.createElement('article'); card.className = 'card';
    const h = document.createElement('h4'); h.textContent = p.title;
    const tags = document.createElement('p'); tags.className = 'tags'; tags.textContent = p.topics.join(', ');
    const sum = document.createElement('p'); sum.textContent = p.summary;
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn'; btn.textContent = 'Read our version';
    const body = document.createElement('div'); body.className = 'body'; body.hidden = true; body.id = 'post-' + i;
    p.body.forEach(t => { const q = document.createElement('p'); q.textContent = t; body.append(q); });
    btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', body.id);
    btn.addEventListener('click', () => { const open = body.hidden; body.hidden = !open; btn.setAttribute('aria-expanded', String(open)); btn.textContent = open ? 'Hide our version' : 'Read our version'; });
    const src = document.createElement('p'); src.className = 'source';
    const a = document.createElement('a'); a.href = p.source.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = p.source.name;
    src.append('Source: ', a);
    card.append(h, tags, sum, btn, body, src); box.append(card);
  });
}

export { layoutControls, openSheet, closeSheet, openJournal, closeJournal, openCredits, wirePanels, buildJournal };
