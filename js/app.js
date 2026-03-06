/* ============================================================
   FluxusTV — app.js
   Hash-based SPA: Search → Discover → Genre/Browse → Movie/TV
   ============================================================ */
const TMDB_KEY = '3d421899d5ce93db8ad4ae4591ccc130';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE  = 'https://image.tmdb.org/t/p/w300';
const IMG_LARGE = 'https://image.tmdb.org/t/p/w500';
const IMG_STILL = 'https://image.tmdb.org/t/p/w400';

// ---- Source URL builders ----
const SOURCES = {
  alpha:    { movie: id      => `https://vidsrc.cc/v2/embed/movie/${id}?autoPlay=false`,
              tv:   (id,s,e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}?autoPlay=false` },
  bravo:    { movie: id      => `https://vidsrc.cc/v3/embed/movie/${id}?autoPlay=false`,
              tv:   (id,s,e) => `https://vidsrc.cc/v3/embed/tv/${id}/${s}/${e}?autoPlay=false` },
  charlie:  { movie: id      => `https://moviesapi.club/movie/${id}`,
              tv:   (id,s,e) => `https://moviesapi.club/tv/${id}-${s}-${e}` },
  delta:    { movie: id      => `https://moviesapi.to/movie/${id}`,
              tv:   (id,s,e) => `https://moviesapi.to/tv/${id}-${s}-${e}` },
  echo:     { movie: id      => `https://vidsrc-embed.ru/embed/movie/${id}`,
              tv:   (id,s,e) => `https://vidsrc-embed.ru/embed/tv/${id}/${s}-${e}` },
  foxtrot:  { movie: id      => `https://vidsrc-embed.su/embed/movie/${id}`,
              tv:   (id,s,e) => `https://vidsrc-embed.su/embed/tv/${id}/${s}-${e}` },
  golf:     { movie: id      => `https://vidsrcme.su/embed/movie/${id}`,
              tv:   (id,s,e) => `https://vidsrcme.su/embed/tv/${id}/${s}-${e}` },
  hotel:    { movie: id      => `https://vsrc.su/embed/movie/${id}`,
              tv:   (id,s,e) => `https://vsrc.su/embed/tv/${id}/${s}-${e}` },
  india:    { movie: id      => `https://player.videasy.net/movie/${id}?color=6366f1`,
              tv:   (id,s,e) => `https://player.videasy.net/tv/${id}/${s}/${e}?nextEpisode=true&episodeSelector=true&color=6366f1` },
  juliet:   { movie: id      => `https://player.videasy.net/movie/${id}?overlay=true&color=6366f1`,
              tv:   (id,s,e) => `https://player.videasy.net/tv/${id}/${s}/${e}?overlay=true&nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true&color=6366f1` },
  kilo:     { movie: id      => `https://vidfast.pro/movie/${id}?autoPlay=false`,
              tv:   (id,s,e) => `https://vidfast.pro/tv/${id}/${s}/${e}?autoPlay=false&nextButton=true&autoNext=true` },
  lima:     { movie: id      => `https://vidfast.in/movie/${id}?autoPlay=false`,
              tv:   (id,s,e) => `https://vidfast.in/tv/${id}/${s}/${e}?autoPlay=false&nextButton=true&autoNext=true` },
  mike:     { movie: id      => `https://vidfast.io/movie/${id}?autoPlay=false`,
              tv:   (id,s,e) => `https://vidfast.io/tv/${id}/${s}/${e}?autoPlay=false&nextButton=true&autoNext=true` },
  november: { movie: id      => `https://vidfast.me/movie/${id}?autoPlay=false&theme=E50914`,
              tv:   (id,s,e) => `https://vidfast.me/tv/${id}/${s}/${e}?autoPlay=false&nextButton=true&autoNext=true&theme=E50914` },
  oscar:    { movie: id      => `https://vidfast.net/movie/${id}?autoPlay=false`,
              tv:   (id,s,e) => `https://vidfast.net/tv/${id}/${s}/${e}?autoPlay=false&nextButton=true&autoNext=true` },
  papa:     { movie: id      => `https://vidfast.pm/movie/${id}?autoPlay=false`,
              tv:   (id,s,e) => `https://vidfast.pm/tv/${id}/${s}/${e}?autoPlay=false&nextButton=true&autoNext=true` },
  quebec:   { movie: id      => `https://vidfast.xyz/movie/${id}?autoPlay=false`,
              tv:   (id,s,e) => `https://vidfast.xyz/tv/${id}/${s}/${e}?autoPlay=false&nextButton=true&autoNext=true` },
  romeo:    { movie: id      => `https://vidlink.pro/movie/${id}?autoplay=false&title=true&poster=true`,
              tv:   (id,s,e) => `https://vidlink.pro/tv/${id}/${s}/${e}?autoplay=false&title=true&poster=true&nextbutton=true` },
  sierra:   { movie: id      => `https://vidlink.pro/movie/${id}?autoplay=false&title=true&poster=true&player=jw`,
              tv:   (id,s,e) => `https://vidlink.pro/tv/${id}/${s}/${e}?autoplay=false&title=true&poster=true&nextbutton=true&player=jw` },
};

// ---- TMDB Genre IDs ----
const GENRES = [
  { id: 28,    name: 'Action'      },
  { id: 35,    name: 'Comedy'      },
  { id: 18,    name: 'Drama'       },
  { id: 27,    name: 'Horror'      },
  { id: 10749, name: 'Romance'     },
  { id: 878,   name: 'Sci-Fi'      },
  { id: 53,    name: 'Thriller'    },
  { id: 16,    name: 'Animation'   },
  { id: 99,    name: 'Documentary' },
  { id: 14,    name: 'Fantasy'     },
  { id: 80,    name: 'Crime'       },
  { id: 12,    name: 'Adventure'   },
];

// ---- State ----
let currentQuery   = '';
let currentPage    = 1;
let totalPages     = 1;
let allResults     = [];
let mediaCache     = {};
let seasonCache    = {};
let activeMediaId  = null;
let activeType     = null;
let activeSeason   = 1;
let activeEpisode  = 1;

// Browse state
let browseCategory   = null;
let browsePage       = 1;
let browseTotalPages = 1;

// ---- localStorage helpers ----
function getSavedSource() {
  let source = localStorage.getItem('sa_source');

  // If they have no source saved, OR if they are still on the old 'alpha'
  if (!source || source === 'alpha') {
    source = 'november';
    localStorage.setItem('sa_source', 'november');
  }

  return source;
}
function saveSource(v)       { localStorage.setItem('sa_source', v); }
function isUblockDismissed() { return localStorage.getItem('sa_ublock') === '1'; }
function dismissUblock()     { localStorage.setItem('sa_ublock', '1'); }

// ---- Continue Watching helpers ----
const CW_KEY = 'sa_cw';
const CW_MAX = 20;
function getCW() {
  try { return JSON.parse(localStorage.getItem(CW_KEY)) || []; }
  catch { return []; }
}
function saveCW(list) {
  localStorage.setItem(CW_KEY, JSON.stringify(list.slice(0, CW_MAX)));
}
function addToCW(entry) {
  let list = getCW();
  list = list.filter(x => !(String(x.id) === String(entry.id) && x.type === entry.type));
  list.unshift(entry);
  saveCW(list);
}
function removeFromCW(id, type) {
  let list = getCW();
  list = list.filter(x => !(String(x.id) === String(id) && x.type === type));
  saveCW(list);
  renderCW();
}

// ---- DOM refs ----
const viewSearch        = document.getElementById('view-search');
const viewMedia         = document.getElementById('view-media');
const viewDiscover      = document.getElementById('view-discover');
const viewBrowse        = document.getElementById('view-browse');
const searchForm        = document.getElementById('search-form');
const searchInput       = document.getElementById('search-input');
const resultsSection    = document.getElementById('results-section');
const resultsGrid       = document.getElementById('results-grid');
const resultsCount      = document.getElementById('results-count');
const loadMoreWrap      = document.getElementById('load-more-wrap');
const loadMoreBtn       = document.getElementById('load-more-btn');
const stateEmpty        = document.getElementById('state-empty');
const stateLoading      = document.getElementById('state-loading');
const stateError        = document.getElementById('state-error');
const errorText         = document.getElementById('error-text');
const cwSection         = document.getElementById('cw-section');
const cwRow             = document.getElementById('cw-row');
const ublockBanner      = document.getElementById('ublock-banner');
const ublockDismiss     = document.getElementById('ublock-dismiss');
const mediaPoster       = document.getElementById('media-poster');
const mediaPosterPh     = document.getElementById('media-poster-ph');
const mediaBadge        = document.getElementById('media-badge');
const mediaYear         = document.getElementById('media-year');
const mediaRating       = document.getElementById('media-rating');
const mediaGenres       = document.getElementById('media-genres');
const mediaTitle        = document.getElementById('media-title');
const mediaOverview     = document.getElementById('media-overview');
const sourceSelect      = document.getElementById('media-source-select');
const newtabBtn         = document.getElementById('newtab-btn');
const playerIframe      = document.getElementById('player-iframe');
const iframeSpinner     = document.getElementById('iframe-spinner');
const tvSection         = document.getElementById('tv-section');
const seasonTabs        = document.getElementById('season-tabs');
const episodeGrid       = document.getElementById('episode-grid');
const episodesLoading   = document.getElementById('episodes-loading');
const genreChips        = document.getElementById('genre-chips');
const browseGrid        = document.getElementById('browse-grid');
const browseTitle       = document.getElementById('browse-title');
const browseLoadMoreWrap = document.getElementById('browse-load-more-wrap');
const browseLoadMoreBtn  = document.getElementById('browse-load-more-btn');
const browseLoadingEl    = document.getElementById('browse-loading');
const navDiscover        = document.getElementById('nav-discover');

// ============================================================
// Router
// ============================================================
function route() {
  const hash  = window.location.hash || '#/';
  const parts = hash.replace('#/', '').split('/');
  hideAllViews();
  if (parts[0] === 'movie' && parts[1]) {
    showMediaView('movie', parts[1]);
  } else if (parts[0] === 'tv' && parts[1]) {
    const s = parseInt(parts[2]) || 1;
    const e = parseInt(parts[3]) || 1;
    showMediaView('tv', parts[1], s, e);
  } else if (parts[0] === 'discover') {
    showDiscoverView();
  } else if (parts[0] === 'browse' && parts[1]) {
    showBrowseView(parts[1], parts[2] || null);
  } else if (parts[0] === 'genre' && parts[1]) {
    showBrowseView('genre', parts[1]);
  } else {
    showSearchView();
  }
}
window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', route);

// ============================================================
// View Switching
// ============================================================
function hideAllViews() {
  viewSearch.classList.add('hidden');
  viewMedia.classList.add('hidden');
  viewDiscover.classList.add('hidden');
  viewBrowse.classList.add('hidden');
  navDiscover.classList.remove('active');
}
function showSearchView() {
  viewSearch.classList.remove('hidden');
  playerIframe.src = '';
  activeMediaId = null;
  document.title = 'FluxusTV — Watch Movies & TV';
  window.scrollTo(0, 0);
  renderCW();
}
function showDiscoverView() {
  viewDiscover.classList.remove('hidden');
  navDiscover.classList.add('active');
  document.title = 'Discover — FluxusTV';
  window.scrollTo(0, 0);
  loadDiscoverContent();
}
function showBrowseView(category, param) {
  viewBrowse.classList.remove('hidden');
  browseGrid.innerHTML = '';
  browsePage       = 1;
  browseTotalPages = 1;
  browseCategory   = { type: category, param };
  window.scrollTo(0, 0);
  const label = getBrowseLabel(category, param);
  browseTitle.textContent = label;
  document.title = `${label} — FluxusTV`;
  loadBrowsePage(true);
}
async function showMediaView(type, id, s = 1, e = 1) {
  viewMedia.classList.remove('hidden');
  window.scrollTo(0, 0);
  activeMediaId = id;
  activeType    = type;
  activeSeason  = s;
  activeEpisode = e;

  if (isUblockDismissed()) {
    ublockBanner.classList.add('hidden');
  } else {
    ublockBanner.classList.remove('hidden');
  }

  sourceSelect.value = getSavedSource();

  try {
    const detail = await fetchDetail(type, id);
    renderMediaHeader(type, detail);

    // Save to Continue Watching
    const cwEntry = {
      id:     id,
      type:   type,
      title:  type === 'tv' ? detail.name : detail.title,
      poster: detail.poster_path || null,
    };
    if (type === 'tv') {
      cwEntry.season  = s;
      cwEntry.episode = e;
    }
    addToCW(cwEntry);

    if (type === 'tv') {
      tvSection.classList.remove('hidden');
      renderSeasonTabs(detail, s);
      await loadSeason(id, s, e);
    } else {
      tvSection.classList.add('hidden');
    }
    loadPlayer();
  } catch (err) {
    console.error(err);
    mediaTitle.textContent    = 'Failed to load';
    mediaOverview.textContent = 'Could not fetch details from TMDB.';
  }
}

// ============================================================
// Continue Watching
// ============================================================
function renderCW() {
  const list = getCW();
  if (list.length === 0) { cwSection.classList.add('hidden'); return; }
  cwSection.classList.remove('hidden');
  cwRow.innerHTML = '';
  list.forEach(item => {
    const poster     = item.poster ? `${IMG_BASE}${item.poster}` : null;
    const subtitle   = item.type === 'tv' ? `S${item.season} E${item.episode}` : 'Movie';
    const typeBadge  = item.type === 'tv' ? 'TV' : 'Movie';
    const badgeClass = item.type === 'tv' ? 'badge-tv' : 'badge-movie';
    const target     = item.type === 'tv'
      ? `#/tv/${item.id}/${item.season}/${item.episode}`
      : `#/movie/${item.id}`;

    const card = document.createElement('div');
    card.className = 'cw-card';
    card.innerHTML = `
      <div class="cw-poster-wrap">
        ${poster
          ? `<img class="cw-poster" src="${poster}" alt="${escapeHtml(item.title)}" loading="lazy" />`
          : `<div class="cw-poster-ph">${escapeHtml(item.title).slice(0, 2)}</div>`
        }
        <div class="card-type-badge ${badgeClass}">${typeBadge}</div>
      </div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(item.title)}</div>
        <div class="card-year">${subtitle}</div>
      </div>
      <button class="cw-remove-btn" aria-label="Remove">✕</button>
    `;
    card.addEventListener('click', (ev) => {
      if (ev.target.closest('.cw-remove-btn')) return;
      window.location.hash = target;
    });
    card.querySelector('.cw-remove-btn').addEventListener('click', (ev) => {
      ev.stopPropagation();
      removeFromCW(item.id, item.type);
    });
    cwRow.appendChild(card);
  });
}

// ============================================================
// Discover
// ============================================================
function renderDiscoverRow(rowId, items, forcedType) {
  const row = document.getElementById(rowId);
  if (!row) return;
  row.innerHTML = '';
  items.forEach(item => {
    const isTV  = forcedType ? forcedType === 'tv' : item.media_type === 'tv';
    const title = isTV ? (item.name || item.title) : (item.title || item.name);
    const date  = isTV ? item.first_air_date : item.release_date;
    const year  = date ? date.slice(0, 4) : '';
    const poster = item.poster_path ? `${IMG_BASE}${item.poster_path}` : null;
    const target = isTV ? `#/tv/${item.id}/1/1` : `#/movie/${item.id}`;

    const card = document.createElement('div');
    card.className = 'disc-card';
    card.innerHTML = `
      <div class="disc-card-poster">
        ${poster
          ? `<img src="${poster}" alt="${escapeHtml(title)}" loading="lazy" />`
          : `<div class="card-placeholder">${escapeHtml(title)}</div>`
        }
        <div class="card-type-badge ${isTV ? 'badge-tv' : 'badge-movie'}">${isTV ? 'TV' : 'Movie'}</div>
      </div>
      <div class="disc-card-title">${escapeHtml(title)}</div>
      ${year ? `<div class="disc-card-year">${year}</div>` : ''}
    `;
    card.addEventListener('click', () => { window.location.hash = target; });
    row.appendChild(card);
  });
}

let discoverLoaded = false;
async function loadDiscoverContent() {
  if (discoverLoaded) return;
  discoverLoaded = true;

  // Render genre chips
  genreChips.innerHTML = '';
  GENRES.forEach(g => {
    const chip = document.createElement('a');
    chip.href = `#/genre/${g.id}`;
    chip.className = 'genre-chip';
    chip.textContent = g.name;
    genreChips.appendChild(chip);
  });

  try {
    const [
      trendingToday, trendingWeek, nowPlaying,
      upcoming, popularMovies, topMovies,
      popularTV, topTV, airingToday, onAir
    ] = await Promise.all([
      tmdbFetch('/trending/all/day'),
      tmdbFetch('/trending/all/week'),
      tmdbFetch('/movie/now_playing'),
      tmdbFetch('/movie/upcoming'),
      tmdbFetch('/movie/popular'),
      tmdbFetch('/movie/top_rated'),
      tmdbFetch('/tv/popular'),
      tmdbFetch('/tv/top_rated'),
      tmdbFetch('/tv/airing_today'),
      tmdbFetch('/tv/on_the_air'),
    ]);

    renderDiscoverRow('row-trending-today', trendingToday.results  || []);
    renderDiscoverRow('row-trending',       trendingWeek.results   || []);
    renderDiscoverRow('row-now-playing',    nowPlaying.results     || [], 'movie');
    renderDiscoverRow('row-upcoming',       upcoming.results       || [], 'movie');
    renderDiscoverRow('row-popular-movies', popularMovies.results  || [], 'movie');
    renderDiscoverRow('row-top-movies',     topMovies.results      || [], 'movie');
    renderDiscoverRow('row-popular-tv',     popularTV.results      || [], 'tv');
    renderDiscoverRow('row-top-tv',         topTV.results          || [], 'tv');
    renderDiscoverRow('row-airing-today',   airingToday.results    || [], 'tv');
    renderDiscoverRow('row-on-air',         onAir.results          || [], 'tv');
  } catch (err) {
    console.error('Discover load error:', err);
  }
}
// ============================================================
// Browse (full grid for category/genre)
// ============================================================
function getBrowseLabel(type, param) {
  if (type === 'trending-today') return '🔥 Trending Today';
  if (type === 'trending')       return '📅 Trending This Week';
  if (type === 'now-playing')    return '🎬 Now Playing';
  if (type === 'upcoming')       return '🗓️ Upcoming Movies';
  if (type === 'popular-movies') return '🍿 Popular Movies';
  if (type === 'top-movies')     return '⭐ Top Rated Movies';
  if (type === 'popular-tv')     return '📺 Popular TV Shows';
  if (type === 'top-tv')         return '🏆 Top Rated TV Shows';
  if (type === 'airing-today')   return '📡 Airing Today';
  if (type === 'on-air')         return '📻 Currently On Air';
  if (type === 'genre') {
    const g = GENRES.find(x => String(x.id) === String(param));
    return g ? g.name : 'Genre';
  }
  return 'Browse';
}

function getBrowseUrl(type, param, page) {
  if (type === 'trending-today') return `/trending/all/day?page=${page}`;
  if (type === 'trending')       return `/trending/all/week?page=${page}`;
  if (type === 'now-playing')    return `/movie/now_playing?page=${page}`;
  if (type === 'upcoming')       return `/movie/upcoming?page=${page}`;
  if (type === 'popular-movies') return `/movie/popular?page=${page}`;
  if (type === 'top-movies')     return `/movie/top_rated?page=${page}`;
  if (type === 'popular-tv')     return `/tv/popular?page=${page}`;
  if (type === 'top-tv')         return `/tv/top_rated?page=${page}`;
  if (type === 'airing-today')   return `/tv/airing_today?page=${page}`;
  if (type === 'on-air')         return `/tv/on_the_air?page=${page}`;
  if (type === 'genre')          return `/discover/movie?with_genres=${param}&sort_by=popularity.desc&page=${page}`;
  return null;
}
async function loadBrowsePage(reset) {
  browseLoadingEl.classList.remove('hidden');
  browseLoadMoreWrap.classList.add('hidden');
  try {
    const endpoint = getBrowseUrl(browseCategory.type, browseCategory.param, browsePage);
    const data     = await tmdbFetch(endpoint);
    browseTotalPages = data.total_pages || 1;
    browseLoadingEl.classList.add('hidden');
    const items = (data.results || []).map(item => {
      if (!item.media_type) {
        item.media_type = browseCategory.type === 'popular-tv' ? 'tv' : 'movie';
      }
      return item;
    }).filter(r => r.media_type === 'movie' || r.media_type === 'tv');
    if (reset) browseGrid.innerHTML = '';
    renderBrowseCards(items);
    if (browsePage < browseTotalPages) browseLoadMoreWrap.classList.remove('hidden');
    else browseLoadMoreWrap.classList.add('hidden');
  } catch (err) {
    browseLoadingEl.classList.add('hidden');
    console.error('Browse load error:', err);
  }
}
function renderBrowseCards(items) {
  items.forEach(item => {
    const isTV  = item.media_type === 'tv';
    const title = isTV ? item.name : item.title;
    const date  = isTV ? item.first_air_date : item.release_date;
    const year  = date ? date.slice(0, 4) : '';
    const poster = item.poster_path ? `${IMG_BASE}${item.poster_path}` : null;

    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${title}${year ? ' (' + year + ')' : ''}`);
    card.innerHTML = `
      <div class="card-poster-wrap">
        ${poster
          ? `<img class="card-poster" src="${poster}" alt="${escapeHtml(title)}" loading="lazy" />`
          : `<div class="card-placeholder">${escapeHtml(title)}</div>`
        }
        <div class="card-type-badge ${isTV ? 'badge-tv' : 'badge-movie'}">${isTV ? 'TV' : 'Movie'}</div>
      </div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(title)}</div>
        ${year ? `<div class="card-year">${year}</div>` : '<div class="card-year"></div>'}
      </div>
    `;
    const target = isTV ? `#/tv/${item.id}/1/1` : `#/movie/${item.id}`;
    card.addEventListener('click', () => { window.location.hash = target; });
    card.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); window.location.hash = target; }
    });
    browseGrid.appendChild(card);
  });
}
browseLoadMoreBtn.addEventListener('click', () => {
  if (browsePage < browseTotalPages) { browsePage++; loadBrowsePage(false); }
});

// ============================================================
// TMDB Fetching
// ============================================================
async function tmdbFetch(endpoint) {
  const sep = endpoint.includes('?') ? '&' : '?';
  const url = `${TMDB_BASE}${endpoint}${sep}api_key=${TMDB_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}
async function fetchDetail(type, id) {
  const key = `${type}-${id}`;
  if (mediaCache[key]) return mediaCache[key];
  const data = await tmdbFetch(`/${type}/${id}`);
  mediaCache[key] = data;
  return data;
}
async function fetchSeason(tvId, seasonNum) {
  const key = `${tvId}-${seasonNum}`;
  if (seasonCache[key]) return seasonCache[key];
  const data = await tmdbFetch(`/tv/${tvId}/season/${seasonNum}`);
  seasonCache[key] = data;
  return data;
}

// ============================================================
// Render Media Header
// ============================================================
function renderMediaHeader(type, detail) {
  const isTV   = type === 'tv';
  const title  = isTV ? detail.name : detail.title;
  const date   = isTV ? detail.first_air_date : detail.release_date;
  const year   = date ? date.slice(0, 4) : '';
  const poster = detail.poster_path ? `${IMG_LARGE}${detail.poster_path}` : null;
  const rating = detail.vote_average ? detail.vote_average.toFixed(1) : null;
  const genres = (detail.genres || []).map(g => g.name).join(', ');

  document.title = `${title} — FluxusTV`;

  if (poster) {
    mediaPoster.src = poster;
    mediaPoster.alt = title;
    mediaPoster.classList.remove('hidden');
    mediaPosterPh.classList.add('hidden');
  } else {
    mediaPoster.classList.add('hidden');
    mediaPosterPh.classList.remove('hidden');
    mediaPosterPh.textContent = title;
  }

  mediaBadge.textContent  = isTV ? 'TV Show' : 'Movie';
  mediaBadge.className    = `modal-badge ${isTV ? 'badge-tv' : 'badge-movie'}`;
  mediaYear.textContent   = year;
  mediaRating.textContent = rating ? `⭐ ${rating}` : '';
  mediaGenres.textContent = genres;
  mediaTitle.textContent  = title;
  mediaOverview.textContent = detail.overview || 'No description available.';
}

// ============================================================
// Season Tabs
// ============================================================
function renderSeasonTabs(detail, activeSNum) {
  seasonTabs.innerHTML = '';
  const seasons = (detail.seasons || []).filter(s => s.season_number > 0);
  seasons.forEach(s => {
    const btn = document.createElement('button');
    btn.className   = `season-tab ${s.season_number === activeSNum ? 'season-tab-active' : ''}`;
    btn.textContent = `Season ${s.season_number}`;
    btn.addEventListener('click', () => {
      if (s.season_number === activeSeason) return;
      activeSeason  = s.season_number;
      activeEpisode = 1;
      updateHash();
      document.querySelectorAll('.season-tab').forEach(t => t.classList.remove('season-tab-active'));
      btn.classList.add('season-tab-active');
      loadSeason(activeMediaId, s.season_number, 1);
    });
    seasonTabs.appendChild(btn);
  });
}

// ============================================================
// Episode Grid
// ============================================================
async function loadSeason(tvId, seasonNum, highlightEp) {
  episodeGrid.innerHTML = '';
  episodesLoading.classList.remove('hidden');
  try {
    const season = await fetchSeason(tvId, seasonNum);
    episodesLoading.classList.add('hidden');
    renderEpisodes(season.episodes || [], highlightEp);
  } catch (err) {
    episodesLoading.classList.add('hidden');
    episodeGrid.innerHTML = '<p style="color:var(--text-muted)">Failed to load episodes.</p>';
  }
}
function renderEpisodes(episodes, highlightEp) {
  episodeGrid.innerHTML = '';
  episodes.forEach(ep => {
    const card     = document.createElement('div');
    const isActive = ep.episode_number === highlightEp;
    card.className = `ep-card ${isActive ? 'ep-card-active' : ''}`;
    card.setAttribute('data-ep', ep.episode_number);
    const still = ep.still_path ? `${IMG_STILL}${ep.still_path}` : null;
    card.innerHTML = `
      <div class="ep-thumb-wrap">
        ${still
          ? `<img class="ep-thumb" src="${still}" alt="E${ep.episode_number}" loading="lazy" />`
          : `<div class="ep-thumb-ph"></div>`
        }
        <span class="ep-number">E${ep.episode_number}</span>
      </div>
      <div class="ep-info">
        <div class="ep-title">${escapeHtml(ep.name || 'Episode ' + ep.episode_number)}</div>
        <div class="ep-desc">${escapeHtml(ep.overview || '')}</div>
      </div>
    `;
    card.addEventListener('click', () => {
      activeEpisode = ep.episode_number;
      updateHash();
      loadPlayer();
      // Update CW with new episode
      const cwList   = getCW();
      const existing = cwList.find(x => String(x.id) === String(activeMediaId) && x.type === 'tv');
      if (existing) {
        existing.season  = activeSeason;
        existing.episode = activeEpisode;
        const filtered = cwList.filter(x => !(String(x.id) === String(activeMediaId) && x.type === 'tv'));
        filtered.unshift(existing);
        saveCW(filtered);
      }
      document.querySelectorAll('.ep-card').forEach(c => c.classList.remove('ep-card-active'));
      card.classList.add('ep-card-active');
      document.querySelector('.player-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    episodeGrid.appendChild(card);
  });
}

// ============================================================
// Player

// ============================================================
function buildSrc() {
  const src = SOURCES[sourceSelect.value] || SOURCES.november;
  if (activeType === 'tv') return src.tv(activeMediaId, activeSeason, activeEpisode);
  return src.movie(activeMediaId);
}
function loadPlayer() {
  iframeSpinner.classList.remove('hidden');
  playerIframe.src = '';
  requestAnimationFrame(() => { playerIframe.src = buildSrc(); });
}
playerIframe.addEventListener('load', () => { iframeSpinner.classList.add('hidden'); });
sourceSelect.addEventListener('change', () => {
  saveSource(sourceSelect.value);
  if (activeMediaId) loadPlayer();
});
newtabBtn.addEventListener('click', () => {
  if (activeMediaId) window.open(buildSrc(), '_blank', 'noopener,noreferrer');
});
ublockDismiss.addEventListener('click', () => {
  dismissUblock();
  ublockBanner.classList.add('hidden');
});

// ============================================================
// Hash helpers
// ============================================================
function updateHash() {
  if (activeType === 'tv') {
    window.location.hash = `#/tv/${activeMediaId}/${activeSeason}/${activeEpisode}`;
  } else {
    window.location.hash = `#/movie/${activeMediaId}`;
  }
}

// ============================================================
// Search
// ============================================================
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const q = searchInput.value.trim();
  if (!q) return;
  currentQuery = q;
  currentPage  = 1;
  allResults   = [];
  doSearch(true);
});
loadMoreBtn.addEventListener('click', () => {
  if (currentPage < totalPages) { currentPage++; doSearch(false); }
});
async function doSearch(reset) {
  showState('loading');
  try {
    const url = `${TMDB_BASE}/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(currentQuery)}&page=${currentPage}&include_adult=false`;
    const res  = await fetch(url);
    if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
    const data = await res.json();
    totalPages = data.total_pages || 1;
    const filtered = (data.results || [])
      .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
      .sort((a, b) => b.popularity - a.popularity);
    if (reset) allResults = filtered;
    else allResults = allResults.concat(filtered);
    hideAllStates();
    cwSection.classList.add('hidden');
    if (allResults.length === 0) { showState('empty'); return; }
    resultsSection.classList.remove('hidden');
    resultsCount.textContent = `${data.total_results.toLocaleString()} result${data.total_results !== 1 ? 's' : ''} for "${currentQuery}"`;
    if (reset) resultsGrid.innerHTML = '';
    renderCards(filtered);
    if (currentPage < totalPages) loadMoreWrap.classList.remove('hidden');
    else loadMoreWrap.classList.add('hidden');
  } catch (err) {
    console.error(err);
    showState('error');
    errorText.textContent = 'Could not reach TMDB. Check your connection and try again.';
  }
}
function renderCards(items) {
  items.forEach(item => {
    const isTV  = item.media_type === 'tv';
    const title = isTV ? item.name : item.title;
    const date  = isTV ? item.first_air_date : item.release_date;
    const year  = date ? date.slice(0, 4) : '';
    const poster = item.poster_path ? `${IMG_BASE}${item.poster_path}` : null;

    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${title}${year ? ' (' + year + ')' : ''}`);
    card.innerHTML = `
      <div class="card-poster-wrap">
        ${poster
          ? `<img class="card-poster" src="${poster}" alt="${escapeHtml(title)}" loading="lazy" />`
          : `<div class="card-placeholder">${escapeHtml(title)}</div>`
        }
        <div class="card-type-badge ${isTV ? 'badge-tv' : 'badge-movie'}">${isTV ? 'TV' : 'Movie'}</div>
      </div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(title)}</div>
        ${year ? `<div class="card-year">${year}</div>` : '<div class="card-year"></div>'}
      </div>
    `;
    const target = isTV ? `#/tv/${item.id}/1/1` : `#/movie/${item.id}`;
    card.addEventListener('click', () => { window.location.hash = target; });
    card.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); window.location.hash = target; }
    });
    resultsGrid.appendChild(card);
  });
}

// ============================================================
// State helpers
// ============================================================
function hideAllStates() {
  stateEmpty.classList.add('hidden');
  stateLoading.classList.add('hidden');
  stateError.classList.add('hidden');
}
function showState(state) {
  hideAllStates();
  resultsSection.classList.add('hidden');
  cwSection.classList.add('hidden');
  if (state === 'loading') stateLoading.classList.remove('hidden');
  if (state === 'empty')   stateEmpty.classList.remove('hidden');
  if (state === 'error')   stateError.classList.remove('hidden');
}

// ============================================================
// Escape key
// ============================================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && activeMediaId) { window.location.hash = '#/'; }
});

// ============================================================
// Utility
// ============================================================
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}
