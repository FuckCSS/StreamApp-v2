/* ============================================================
   StreamVault — app.js
   TMDB Search + Modal + Player redirect
   ============================================================ */

const TMDB_KEY   = '3d421899d5ce93db8ad4ae4591ccc130';
const TMDB_BASE  = 'https://api.themoviedb.org/3';
const IMG_BASE   = 'https://image.tmdb.org/t/p/w300';
const IMG_LARGE  = 'https://image.tmdb.org/t/p/w500';
const PLAYER_URL = 'https://tmdbplayer.nunesnetwork.com/';

// ---- State ----
let currentQuery   = '';
let currentPage    = 1;
let totalPages     = 1;
let allResults     = [];
let selectedItem   = null;

// ---- DOM refs ----
const searchForm      = document.getElementById('search-form');
const searchInput     = document.getElementById('search-input');
const resultsSection  = document.getElementById('results-section');
const resultsGrid     = document.getElementById('results-grid');
const resultsCount    = document.getElementById('results-count');
const loadMoreWrap    = document.getElementById('load-more-wrap');
const loadMoreBtn     = document.getElementById('load-more-btn');
const stateEmpty      = document.getElementById('state-empty');
const stateLoading    = document.getElementById('state-loading');
const stateError      = document.getElementById('state-error');
const errorText       = document.getElementById('error-text');

// Modal
const modalOverlay    = document.getElementById('modal-overlay');
const modalClose      = document.getElementById('modal-close');
const cancelBtn       = document.getElementById('cancel-btn');
const openBtn         = document.getElementById('open-btn');
const modalPoster     = document.getElementById('modal-poster');
const modalPosterPH   = document.getElementById('modal-poster-placeholder');
const modalPosterPHT  = document.getElementById('modal-poster-title-placeholder');
const modalTypeBadge  = document.getElementById('modal-type-badge');
const modalYear       = document.getElementById('modal-year');
const modalTitleEl    = document.getElementById('modal-title');
const modalOverview   = document.getElementById('modal-overview');
const tvControls      = document.getElementById('tv-controls');
const seasonInput     = document.getElementById('season-input');
const episodeInput    = document.getElementById('episode-input');
const serverSelect    = document.getElementById('server-select');

// ---- Search ----
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
  if (currentPage < totalPages) {
    currentPage++;
    doSearch(false);
  }
});

async function doSearch(reset) {
  showState('loading');

  try {
    const url = `${TMDB_BASE}/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(currentQuery)}&page=${currentPage}&include_adult=false`;
    const res  = await fetch(url);
    if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
    const data = await res.json();

    totalPages = data.total_pages || 1;

    // Filter to only movies and TV shows (exclude people etc.)
    const filtered = (data.results || []).filter(
      r => r.media_type === 'movie' || r.media_type === 'tv'
    );

    if (reset) {
      allResults = filtered;
    } else {
      allResults = allResults.concat(filtered);
    }

    hideAllStates();

    if (allResults.length === 0) {
      showState('empty');
      return;
    }

    resultsSection.classList.remove('hidden');
    resultsCount.textContent = `${data.total_results.toLocaleString()} result${data.total_results !== 1 ? 's' : ''} for "${currentQuery}"`;

    if (reset) {
      resultsGrid.innerHTML = '';
    }

    renderCards(filtered);

    // Load more button
    if (currentPage < totalPages) {
      loadMoreWrap.classList.remove('hidden');
    } else {
      loadMoreWrap.classList.add('hidden');
    }

  } catch (err) {
    console.error(err);
    showState('error');
    errorText.textContent = 'Could not reach TMDB. Check your connection and try again.';
  }
}

function renderCards(items) {
  items.forEach(item => {
    const isTV    = item.media_type === 'tv';
    const title   = isTV ? item.name : item.title;
    const date    = isTV ? item.first_air_date : item.release_date;
    const year    = date ? date.slice(0, 4) : '';
    const poster  = item.poster_path ? `${IMG_BASE}${item.poster_path}` : null;

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
        <span class="card-type-badge ${isTV ? 'badge-tv' : 'badge-movie'}">${isTV ? 'TV' : 'Movie'}</span>
      </div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(title)}</div>
        ${year ? `<div class="card-year">${year}</div>` : ''}
      </div>
    `;

    card.addEventListener('click', () => openModal(item));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(item); }
    });

    resultsGrid.appendChild(card);
  });
}

// ---- Modal ----
function openModal(item) {
  selectedItem = item;

  const isTV   = item.media_type === 'tv';
  const title  = isTV ? item.name : item.title;
  const date   = isTV ? item.first_air_date : item.release_date;
  const year   = date ? date.slice(0, 4) : '';
  const poster = item.poster_path ? `${IMG_LARGE}${item.poster_path}` : null;

  // Poster
  if (poster) {
    modalPoster.src = poster;
    modalPoster.alt = title;
    modalPoster.classList.remove('hidden');
    modalPosterPH.classList.add('hidden');
  } else {
    modalPoster.classList.add('hidden');
    modalPosterPH.classList.remove('hidden');
    modalPosterPHT.textContent = title;
  }

  // Badge
  modalTypeBadge.textContent = isTV ? 'TV Show' : 'Movie';
  modalTypeBadge.className   = `modal-badge ${isTV ? 'badge-tv' : 'badge-movie'}`;

  modalYear.textContent    = year;
  modalTitleEl.textContent = title;
  modalOverview.textContent = item.overview || 'No description available.';

  // TV controls
  if (isTV) {
    tvControls.classList.remove('hidden');
    seasonInput.value  = 1;
    episodeInput.value = 1;
  } else {
    tvControls.classList.add('hidden');
  }

  // Reset server
  serverSelect.value = '1';

  modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Focus trap — focus close button
  setTimeout(() => modalClose.focus(), 50);
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
  selectedItem = null;
}

modalClose.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
    closeModal();
  }
});

openBtn.addEventListener('click', () => {
  if (!selectedItem) return;

  const isTV   = selectedItem.media_type === 'tv';
  const id     = selectedItem.id;
  const server = serverSelect.value;

  let url;
  if (isTV) {
    const s = parseInt(seasonInput.value,  10) || 1;
    const e = parseInt(episodeInput.value, 10) || 1;
    url = `${PLAYER_URL}?type=tv&id=${id}&s=${s}&e=${e}&server=${server}`;
  } else {
    url = `${PLAYER_URL}?type=movie&id=${id}&server=${server}`;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
  closeModal();
});

// ---- State helpers ----
function hideAllStates() {
  stateEmpty.classList.add('hidden');
  stateLoading.classList.add('hidden');
  stateError.classList.add('hidden');
}

function showState(state) {
  hideAllStates();
  resultsSection.classList.add('hidden');
  if (state === 'loading') stateLoading.classList.remove('hidden');
  if (state === 'empty')   stateEmpty.classList.remove('hidden');
  if (state === 'error')   stateError.classList.remove('hidden');
}

// ---- Utility ----
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
