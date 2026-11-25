// Dev notes come from devnotes.json. Add an entry at the top with each update.
const TAGS = { new: 'New', improved: 'Improved', fixed: 'Fixed' };
const GAME_URL = 'play/index.html';

function el(tag, attrs = {}, ...children) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  for (const c of children) n.append(c);
  return n;
}

function fmtDate(iso) {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

async function loadNotes() {
  const list = document.getElementById('notes-list');
  try {
    const res = await fetch('devnotes.json', { cache: 'no-cache' });
    const { notes } = await res.json();
    list.replaceChildren(
      ...notes.map((n, i) =>
        el(
          'article',
          { class: `panel note ${i === 0 ? 'latest' : ''}`, id: `v${n.version}` },
          el('div', { class: 'note-head' },
            el('span', { class: 'note-version' }, `v${n.version}`),
            el('h3', {}, n.title),
            el('time', { datetime: n.date }, fmtDate(n.date)),
            ...(i === 0 ? [el('span', { class: 'pill' }, 'Latest')] : []),
          ),
          el('ul', {}, ...n.items.map((it) => el('li', {}, el('span', { class: `tag ${it.tag}` }, TAGS[it.tag] ?? it.tag), ' ', it.text))),
        ),
      ),
    );
    const latest = notes[0];
    if (latest) {
      document.getElementById('latest-version').replaceChildren(`Latest update: v${latest.version}, ${latest.title}`);
    }
  } catch {
    list.replaceChildren(el('p', { class: 'fineprint' }, 'Dev notes could not be loaded.'));
  }
}

// "Play here" loads the game in a frame on this page only when asked,
// so the landing page stays fast.
function setupGame() {
  const panel = document.getElementById('play');
  const frameBox = panel.querySelector('.game-frame');
  const open = () => {
    if (!frameBox.querySelector('iframe')) {
      const f = el('iframe', { src: GAME_URL, title: 'Beer League Hockey', allow: 'fullscreen; gamepad; autoplay', allowfullscreen: '' });
      frameBox.append(f);
      f.addEventListener('load', () => f.focus());
    }
    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  document.getElementById('play-here').addEventListener('click', open);
  document.getElementById('close-game').addEventListener('click', () => {
    frameBox.replaceChildren();
    panel.hidden = true;
    document.getElementById('top').scrollIntoView({ behavior: 'smooth' });
  });
  document.getElementById('fullscreen').addEventListener('click', () => {
    try {
      const request = frameBox.requestFullscreen ?? frameBox.webkitRequestFullscreen;
      const result = request?.call(frameBox);
      if (result && typeof result.catch === 'function') result.catch(() => undefined);
    } catch {
      // Full screen is not available here; the game still plays in the page.
    }
  });
  if (location.hash === '#play') open();
}

setupGame();
loadNotes();
