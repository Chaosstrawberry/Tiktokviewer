(() => {
  'use strict';

  const STORAGE_KEY = 'tikview.saved.v1';
  const app = document.getElementById('app');
  const homeTemplate = document.getElementById('home-template');
  const toast = document.getElementById('toast');
  let toastTimer = null;

  function loadFeed() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data.filter(isValidSaved) : [];
    } catch {
      return [];
    }
  }

  function isValidSaved(item) {
    return item && typeof item.id === 'string' && /^\d{8,25}$/.test(item.id) && typeof item.url === 'string';
  }

  function saveFeed(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 100)));
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  function normalizeInput(raw) {
    let value = String(raw || '').trim();
    if (!value) throw new Error('Paste a TikTok video link first.');
    if (!/^https?:\/\//i.test(value)) value = 'https://' + value;
    let url;
    try { url = new URL(value); } catch { throw new Error('That doesn’t look like a valid URL.'); }
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const allowed = ['tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com', 'm.tiktok.com'];
    if (!allowed.some(domain => host === domain || host.endsWith('.' + domain))) {
      throw new Error('Use a TikTok video link, such as tiktok.com/@user/video/123…');
    }
    return url;
  }

  function extractVideoId(urlLike) {
    const url = normalizeInput(urlLike);
    const match = url.pathname.match(/\/video\/(\d{8,25})/i);
    return match ? match[1] : null;
  }

  async function resolveTikTokUrl(inputUrl) {
    const directId = extractVideoId(inputUrl.toString());
    if (directId) {
      return { id: directId, canonicalUrl: inputUrl.toString() };
    }

    // TikTok documents oEmbed as a URL -> embed-information endpoint. It can
    // sometimes return a canonical cite URL/data-video-id even when the input
    // is a shortened TikTok URL. Static sites cannot reliably follow redirects
    // themselves because of cross-origin browser restrictions, so this is the
    // best no-backend attempt.
    const endpoint = 'https://www.tiktok.com/oembed?url=' + encodeURIComponent(inputUrl.toString());
    let response;
    try {
      response = await fetch(endpoint, { headers: { 'Accept': 'application/json' } });
    } catch {
      throw new Error('TikTok could not be reached from this browser. Try opening the full tiktok.com/@user/video/... link.');
    }

    if (!response.ok) {
      throw new Error('TikTok did not return an embeddable video for that link.');
    }

    let data;
    try { data = await response.json(); } catch {
      throw new Error('TikTok returned an unexpected response.');
    }

    const idFromHtml = typeof data.html === 'string' ? data.html.match(/data-video-id=["'](\d{8,25})["']/i) : null;
    const id = (idFromHtml && idFromHtml[1]) || (typeof data.url === 'string' ? extractVideoIdLoose(data.url) : null) || (typeof data.author_url === 'string' && typeof data.title === 'string' ? null : null);
    const canonical = typeof data.author_url === 'string' && typeof data.html === 'string' ? extractCanonicalFromHtml(data.html) : null;

    if (!id) throw new Error('This shortened link could not be resolved. Copy the full TikTok video URL and try again.');
    return { id, canonicalUrl: canonical || `https://www.tiktok.com/player/v1/${id}` };
  }

  function extractVideoIdLoose(value) {
    try {
      const url = new URL(value);
      const match = url.pathname.match(/\/video\/(\d{8,25})/i);
      return match ? match[1] : null;
    } catch { return null; }
  }

  function extractCanonicalFromHtml(html) {
    const match = html.match(/cite=["']([^"']+)["']/i);
    return match ? match[1] : null;
  }

  function playerUrl(id) {
    const params = new URLSearchParams({ controls: '1', description: '0', music_info: '1', rel: '0', loop: '0' });
    return `https://www.tiktok.com/player/v1/${encodeURIComponent(id)}?${params}`;
  }

  function route() {
    const hash = location.hash.replace(/^#/, '');
    if (hash === 'feed') return renderFeed();
    if (hash.startsWith('watch=')) {
      const params = new URLSearchParams(hash);
      const id = params.get('watch') || '';
      const source = params.get('src') || '';
      return renderPlayer(id, source);
    }
    return renderHome();
  }

  function setActiveNav(name) {
    document.querySelectorAll('[data-nav]').forEach(el => el.classList.toggle('active', el.dataset.nav === name));
  }

  function renderHome() {
    app.innerHTML = homeTemplate.innerHTML;
    setActiveNav('home');
    const form = document.getElementById('watch-form');
    const input = document.getElementById('video-url');
    const error = document.getElementById('form-error');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      error.hidden = true;
      const button = form.querySelector('.primary-btn');
      button.disabled = true;
      button.textContent = 'Opening…';
      try {
        const url = normalizeInput(input.value);
        const result = await resolveTikTokUrl(url);
        window.location.hash = `watch=${result.id}&src=${encodeURIComponent(result.canonicalUrl)}`;
      } catch (err) {
        error.textContent = err instanceof Error ? err.message : 'Could not open that TikTok link.';
        error.hidden = false;
      } finally {
        button.disabled = false;
        button.innerHTML = 'Watch video <span aria-hidden="true">→</span>';
      }
    });

    document.getElementById('paste-btn').addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        input.value = text;
        input.focus();
        showToast('Link pasted');
      } catch {
        input.focus();
        showToast('Clipboard access is unavailable');
      }
    });

    document.getElementById('clear-feed-home').addEventListener('click', clearFeed);
  }

  function renderPlayer(id, sourceUrl = '') {
    if (!/^\d{8,25}$/.test(id)) {
      window.location.hash = 'home';
      return;
    }
    setActiveNav('home');
    const feed = loadFeed();
    const savedItem = feed.find(v => v.id === id);
    const saved = Boolean(savedItem);
    const effectiveSourceUrl = sourceUrl || (savedItem && savedItem.url) || `https://www.tiktok.com/player/v1/${id}`;
    app.innerHTML = `
      <section class="player-page">
        <div class="player-head">
          <button class="back-btn" id="back-btn" type="button">← <span>Back</span></button>
          <div class="video-title-wrap">
            <p class="video-title">TikTok video</p>
            <p class="video-meta">ID ${escapeHtml(id)}</p>
          </div>
          <button class="save-btn ${saved ? 'saved' : ''}" id="save-btn" type="button">${saved ? 'Saved' : '＋ Save'}</button>
        </div>
        <div class="player-shell">
          <div class="player-frame-wrap">
            <iframe id="tik-iframe" src="${playerUrl(id)}" title="TikTok video player" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
          </div>
          <div class="player-info">
            <div class="info-text">Powered by TikTok’s official embedded player. Playback stays on TikTok’s platform.</div>
            <div class="player-actions">
              <button class="icon-btn" id="copy-btn" type="button">Copy link</button>
              <button class="icon-btn" id="fullscreen-btn" type="button">Fullscreen</button>
            </div>
          </div>
        </div>
      </section>`;

    document.getElementById('back-btn').addEventListener('click', () => history.length > 1 ? history.back() : (window.location.hash = 'home'));
    document.getElementById('save-btn').addEventListener('click', () => toggleSaved(id, effectiveSourceUrl));
    document.getElementById('copy-btn').addEventListener('click', () => copyLink(effectiveSourceUrl));
    document.getElementById('fullscreen-btn').addEventListener('click', () => {
      const frame = document.getElementById('tik-iframe');
      if (frame && frame.requestFullscreen) frame.requestFullscreen().catch(() => showToast('Fullscreen unavailable'));
      else showToast('Fullscreen unavailable');
    });
  }

  function renderFeed() {
    setActiveNav('feed');
    const feed = loadFeed();
    app.innerHTML = `
      <section class="feed-page">
        <div class="feed-toolbar">
          <div><div class="eyebrow">YOUR COLLECTION</div><h1>My Feed</h1></div>
          <div class="feed-toolbar-actions">
            <button class="icon-btn" id="add-video-btn" type="button">＋ Add</button>
            <button class="icon-btn" id="clear-feed-btn" type="button">Clear</button>
          </div>
        </div>
        <div class="feed-scroll" id="feed-scroll"></div>
      </section>`;

    const scroll = document.getElementById('feed-scroll');
    if (!feed.length) {
      scroll.innerHTML = `<div class="empty-feed"><div class="empty-feed-card"><h2>Your feed is empty.</h2><p>Save videos from the player and they’ll appear here as a vertical doomscroll-style collection.</p><a class="primary-btn" style="display:inline-flex;width:auto;padding:0 18px;align-items:center;justify-content:center" href="#home">Add a video</a></div></div>`;
    } else {
      scroll.innerHTML = feed.map((item, index) => `
        <article class="feed-card" data-index="${index}" data-id="${escapeHtml(item.id)}">
          <div class="feed-placeholder" data-role="placeholder" style="color:#555;font-size:12px">Loading player…</div>
          <div class="feed-overlay"><div class="feed-caption">TikTok video • ${escapeHtml(item.id)}</div><div class="feed-index">${index + 1} / ${feed.length}</div></div>
        </article>`).join('');
      setupLazyFeed(feed, scroll);
    }

    document.getElementById('add-video-btn').addEventListener('click', () => window.location.hash = 'home');
    document.getElementById('clear-feed-btn').addEventListener('click', clearFeed);
  }

  function setupLazyFeed(feed, scroll) {
    const cards = [...scroll.querySelectorAll('.feed-card')];
    const loadCard = (card) => {
      if (card.dataset.loaded === '1') return;
      const index = Number(card.dataset.index);
      const item = feed[index];
      const iframe = document.createElement('iframe');
      iframe.src = playerUrl(item.id);
      iframe.title = `TikTok video ${index + 1}`;
      iframe.loading = 'lazy';
      iframe.allow = 'autoplay; fullscreen; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      const placeholder = card.querySelector('[data-role="placeholder"]');
      if (placeholder) placeholder.replaceWith(iframe);
      card.dataset.loaded = '1';
    };
    const unloadCard = (card) => {
      if (card.dataset.loaded !== '1') return;
      const index = Number(card.dataset.index);
      const item = feed[index];
      const iframe = card.querySelector('iframe');
      if (!iframe) return;
      const placeholder = document.createElement('div');
      placeholder.dataset.role = 'placeholder';
      placeholder.style.cssText = 'color:#555;font-size:12px';
      placeholder.textContent = 'Scroll here to load player';
      iframe.replaceWith(placeholder);
      card.dataset.loaded = '0';
      void item;
    };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const card = entry.target;
        const visible = entry.isIntersecting || entry.intersectionRatio > 0;
        if (visible) {
          cards.forEach(other => {
            if (other !== card) {
              const distance = Math.abs(Number(other.dataset.index) - Number(card.dataset.index));
              if (distance > 1) unloadCard(other);
            }
          });
          loadCard(card);
        }
      });
    }, { root: scroll, threshold: 0.35 });

    cards.forEach(card => observer.observe(card));
    if (cards[0]) loadCard(cards[0]);
    if (cards[1]) loadCard(cards[1]);
  }

  function toggleSaved(id, sourceUrl) {
    const current = loadFeed();
    const index = current.findIndex(v => v.id === id);
    if (index >= 0) {
      current.splice(index, 1);
      saveFeed(current);
      showToast('Removed from feed');
    } else {
      current.unshift({ id, url: sourceUrl, savedAt: Date.now() });
      saveFeed(current);
      showToast('Saved to My Feed');
    }
    renderPlayer(id, sourceUrl);
  }

  function clearFeed() {
    const current = loadFeed();
    if (!current.length) { showToast('Feed is already empty'); return; }
    if (!window.confirm('Clear all saved videos from this device?')) return;
    localStorage.removeItem(STORAGE_KEY);
    showToast('Feed cleared');
    route();
  }

  async function copyLink(url) {
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied');
    } catch {
      showToast('Could not copy link');
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[ch]);
  }

  window.addEventListener('hashchange', route);
  route();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
  }
})();
