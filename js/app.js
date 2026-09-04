/**
 * Raudat al-Hidayat Search Engine
 * High-performance full-text search with authentic book theme,
 * Arabic normalization, Lisan al-Dawat filtering, and Dawat calligraphy fonts.
 */

// Global State
const state = {
  data: typeof RAUDAT_DATA !== 'undefined' ? RAUDAT_DATA : [],
  query: '',
  scope: 'all', // all, arabic, ld, english, stated_by
  selectedVolume: 'all', // all, 'روضة هدايات 1', 'روضة هدايات 2', 'روضة هدايات 3'
  selectedSpeaker: 'all',
  selectedTopic: null,
  sortBy: 'default', // default, serial_asc, serial_desc, arabic_asc, english_asc
  viewMode: 'grid', // grid, table
  favoritesOnly: false,
  favorites: new Set(JSON.parse(localStorage.getItem('raudat_favorites') || '[]')),
  currentPage: 1,
  pageSize: 24,
  currentModalIndex: -1,
  theme: localStorage.getItem('raudat_theme') || 'light',
  font: localStorage.getItem('raudat_font') || 'Al-Fatemi'
};

// Topic presets for quick exploration
const TOPIC_PRESETS = [
  { label: 'Taqwa (تقوى)', query: 'تقو' },
  { label: 'Ilm / Knowledge (علم)', query: 'علم' },
  { label: 'Brotherhood / Mumin (اخوة)', query: 'اخ' },
  { label: 'Husn al-Khuluq (حسن الخلق)', query: 'خلق' },
  { label: 'Sadaqah / Charity (صدقة)', query: 'صدق' },
  { label: 'Sabr / Patience (صبر)', query: 'صبر' },
  { label: 'Dua (دعاء)', query: 'دع' },
  { label: 'Imaan / Faith (ايمان)', query: 'ايمان' },
  { label: 'Niyyat / Sincerity (نية)', query: 'ني' },
  { label: 'Halal Rizq (رزق)', query: 'رزق' },
  { label: 'Tawbah / Forgiveness (توبة)', query: 'توب' },
  { label: 'Parents / Family (والدين)', query: 'والد' }
];

// Eastern Arabic digits converter (e.g. 6 -> ٦, 42 -> ٤٢)
function toEasternArabicDigits(num) {
  if (num === null || num === undefined) return '';
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().replace(/\d/g, d => arabicDigits[d]);
}

// Arabic Normalizer for search
function normalizeArabic(text) {
  if (!text) return '';
  let res = text.replace(/[\u0617-\u061A\u064B-\u0652\u0670\u06D6-\u06ED]/g, '');
  res = res.replace(/[إأآٱا]/g, 'ا');
  res = res.replace(/[يى]/g, 'ي');
  res = res.replace(/ة/g, 'ه');
  res = res.replace(/[ؤئ]/g, 'ء');
  res = res.replace(/ـ/g, '');
  res = res.replace(/\s+/g, ' ').trim().toLowerCase();
  return res;
}

// Lisan al-Dawat normalizer
function normalizeLD(text) {
  if (!text) return '';
  let res = normalizeArabic(text);
  res = res.replace(/پ/g, 'ب')
           .replace(/چ/g, 'ج')
           .replace(/گ/g, 'ك')
           .replace(/ژ/g, 'ز')
           .replace(/ڈ/g, 'د')
           .replace(/ٹ/g, 'ت')
           .replace(/ڑ/g, 'ر');
  return res;
}

// Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  return text.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Highlight matching words in text
function highlightText(text, query, isArabic = false) {
  if (!query || !text) return escapeHtml(text);
  const qClean = query.trim();
  if (!qClean) return escapeHtml(text);

  if (!isArabic) {
    try {
      const words = qClean.split(/\s+/).filter(Boolean);
      let pattern = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      const regex = new RegExp(`(${pattern})`, 'gi');
      return escapeHtml(text).replace(regex, '<mark class="highlight">$1</mark>');
    } catch (e) {
      return escapeHtml(text);
    }
  }

  try {
    const qNorm = normalizeArabic(qClean);
    const words = qNorm.split(/\s+/).filter(Boolean);
    if (!words.length) return escapeHtml(text);

    const diacritics = '[\\u0617-\\u061A\\u064B-\\u0652\\u0670\\u06D6-\\u06EDـ]*';
    const patterns = words.map(w => {
      return w.split('').map(char => {
        if (char === 'ا') return '[إأآٱا]' + diacritics;
        if (char === 'ي') return '[يى]' + diacritics;
        if (char === 'ه') return '[ةه]' + diacritics;
        if (char === 'ء') return '[ءؤئ]' + diacritics;
        return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + diacritics;
      }).join('');
    });

    const regex = new RegExp(`(${patterns.join('|')})`, 'g');
    return escapeHtml(text).replace(regex, '<mark class="highlight">$1</mark>');
  } catch (e) {
    return escapeHtml(text);
  }
}

// Generate the authentic Golden Cartouche SVG Medallion from the book
function renderCartoucheSVG(serialNum, reference, statedBy, uniqueId = serialNum) {
  const easternDigits = toEasternArabicDigits(serialNum);
  const isHadith = (reference && reference.includes('1')) || (statedBy && (statedBy.includes('رسول الله') || statedBy.includes('صلع')));
  const categoryLabel = isHadith ? 'الحديث' : 'الكلام';
  const idStr = String(uniqueId).replace(/\s+/g, '_');

  return `
    <div class="cartouche-badge-container" title="${escapeHtml(reference)} • #${serialNum}">
      <svg class="cartouche-svg" viewBox="0 0 100 135" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="goldGrad-${idStr}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#e2c482" />
            <stop offset="50%" stop-color="#c59f52" />
            <stop offset="100%" stop-color="#ab8232" />
          </linearGradient>
          <filter id="badgeShadow-${idStr}" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.18" />
          </filter>
        </defs>
        
        <!-- Outer Lapis Crest -->
        <path d="M50 4 
                 C56 16, 76 18, 86 32 
                 C96 46, 88 62, 82 72 
                 C76 82, 90 94, 85 106 
                 C80 118, 58 126, 50 131 
                 C42 126, 20 118, 15 106 
                 C10 94, 24 82, 18 72 
                 C12 62, 4 46, 14 32 
                 C24 18, 44 16, 50 4 Z" 
              fill="#1e355b" filter="url(#badgeShadow-${idStr})"/>
              
        <!-- Inner Gold Parchment Field -->
        <path d="M50 8 
                 C55 19, 73 21, 82 34 
                 C91 46, 84 60, 79 69 
                 C73 79, 85 90, 81 101 
                 C76 112, 57 119, 50 124 
                 C43 119, 24 112, 19 101 
                 C15 90, 27 79, 21 69 
                 C16 60, 9 46, 18 34 
                 C27 21, 45 19, 50 8 Z" 
              fill="url(#goldGrad-${idStr})" stroke="#1a2d4f" stroke-width="1.2"/>
              
        <!-- Inner Filigree Line -->
        <path d="M50 12 
                 C54 21, 70 23, 78 35 
                 C86 46, 80 58, 75 67 
                 C70 76, 81 86, 77 96 
                 C72 106, 55 112, 50 117 
                 C45 112, 28 106, 23 96 
                 C19 86, 30 76, 25 67 
                 C20 58, 14 46, 22 35 
                 C30 23, 46 21, 50 12 Z" 
              fill="none" stroke="#8d6820" stroke-width="0.7" stroke-dasharray="1.5 1"/>
              
        <!-- Top Rosette Diamond -->
        <g transform="translate(50, 26)">
          <polygon points="0,-8 5,0 0,8 -5,0" fill="#9e1e1e" stroke="#1a2d4f" stroke-width="0.8" />
          <circle cx="0" cy="0" r="1.5" fill="#f3d48c" />
        </g>
        
        <!-- Eastern Arabic Number -->
        <text x="50" y="68" text-anchor="middle" font-family="'Al-Fatemi', 'Amiri', serif" font-size="29" font-weight="bold" fill="#1b2a47">${easternDigits}</text>
        
        <!-- Category Label -->
        <text x="50" y="95" text-anchor="middle" font-family="'Al-Fatemi', 'Amiri', serif" font-size="14" font-weight="bold" fill="#9e1e1e">${categoryLabel}</text>
      </svg>
    </div>
  `;
}

// Filter and Rank dataset
function getFilteredData() {
  const query = state.query.trim();
  const queryWords = query.split(/\s+/).filter(Boolean);
  const qNormArabic = normalizeArabic(query);
  const qNormLD = normalizeLD(query);
  const qNormEn = query.toLowerCase();

  return state.data.filter(item => {
    // 1. Favorites filter
    if (state.favoritesOnly && !state.favorites.has(item.id)) {
      return false;
    }

    // 2. Volume filter
    if (state.selectedVolume !== 'all' && item.reference !== state.selectedVolume) {
      return false;
    }

    // 3. Speaker filter
    if (state.selectedSpeaker !== 'all' && item.stated_by !== state.selectedSpeaker) {
      return false;
    }

    // 4. Text Search Query
    if (query) {
      const matchArabic = (item.arabic_normalized || normalizeArabic(item.arabic)).includes(qNormArabic);
      const matchLD = (item.ld_normalized || normalizeLD(item.ld_translation)).includes(qNormLD) || 
                      (item.ld_translation && item.ld_translation.includes(query));
      const matchEn = (item.english_normalized || item.english_translation.toLowerCase()).includes(qNormEn);
      const matchSpeaker = (item.stated_by_normalized || normalizeArabic(item.stated_by)).includes(qNormArabic);
      const matchSerial = item.serial_num === query || item.id.toString() === query;

      if (state.scope === 'arabic') return matchArabic;
      if (state.scope === 'ld') return matchLD;
      if (state.scope === 'english') return matchEn;
      if (state.scope === 'stated_by') return matchSpeaker;

      if (matchArabic || matchLD || matchEn || matchSpeaker || matchSerial) {
        return true;
      }

      const allWordsMatch = queryWords.every(word => {
        const wAr = normalizeArabic(word);
        const wEn = word.toLowerCase();
        return (item.arabic_normalized || normalizeArabic(item.arabic)).includes(wAr) ||
               (item.ld_normalized || normalizeLD(item.ld_translation)).includes(wAr) ||
               (item.english_normalized || item.english_translation.toLowerCase()).includes(wEn) ||
               (item.stated_by_normalized || normalizeArabic(item.stated_by)).includes(wAr);
      });

      return allWordsMatch;
    }

    return true;
  }).sort((a, b) => {
    if (state.sortBy === 'serial_asc') return parseInt(a.serial_num) - parseInt(b.serial_num);
    if (state.sortBy === 'serial_desc') return parseInt(b.serial_num) - parseInt(a.serial_num);
    if (state.sortBy === 'arabic_asc') return (a.arabic_normalized || a.arabic).localeCompare(b.arabic_normalized || b.arabic, 'ar');
    if (state.sortBy === 'english_asc') return a.english_translation.localeCompare(b.english_translation);
    return a.id - b.id; // default
  });
}

// Toast notification helper
function showToast(message, icon = '✓') {
  const container = document.getElementById('toastContainer') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span style="color:var(--theme-gold);font-weight:bold;">${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// Copy helper
function copyToClipboard(text, msg = 'Copied to clipboard!') {
  navigator.clipboard.writeText(text).then(() => {
    showToast(msg);
  }).catch(() => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast(msg);
  });
}

// Toggle Favorite
function toggleFavorite(id) {
  if (state.favorites.has(id)) {
    state.favorites.delete(id);
    showToast('Removed from bookmarks', '★');
  } else {
    state.favorites.add(id);
    showToast('Saved to bookmarks!', '★');
  }
  localStorage.setItem('raudat_favorites', JSON.stringify(Array.from(state.favorites)));
  updateFavoritesCount();
  renderApp();
}

function updateFavoritesCount() {
  const countEl = document.getElementById('favoritesBadgeCount');
  if (countEl) {
    countEl.textContent = state.favorites.size;
  }
}

// Format Citation for Sharing
function formatCitation(item) {
  return `✨ *${item.reference} - #${item.serial_num}*\n👤 *${item.stated_by}*\n\n📜 *${item.arabic}*\n\n📖 *Lisan al-Dawat:*\n${item.ld_translation}\n\n🌐 *English:*\n${item.english_translation}\n\n— _Raudat al-Hidayat_`;
}

// Render Results
function renderApp() {
  const filtered = getFilteredData();
  const total = filtered.length;
  const totalPages = Math.ceil(total / state.pageSize) || 1;
  if (state.currentPage > totalPages) state.currentPage = 1;

  const start = (state.currentPage - 1) * state.pageSize;
  const pageItems = filtered.slice(start, start + state.pageSize);

  const resultsCountEl = document.getElementById('resultsCount');
  if (resultsCountEl) {
    resultsCountEl.innerHTML = `Showing <strong>${total === 0 ? 0 : start + 1}-${Math.min(start + pageItems.length, total)}</strong> of <strong>${total}</strong> Kalam${total !== state.data.length ? ` (filtered from ${state.data.length})` : ''}`;
  }

  renderFilterChips();

  const container = document.getElementById('resultsContainer');
  if (!container) return;

  if (total === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3 style="margin-bottom:0.5rem;font-size:1.3rem;font-family:var(--font-arabic);">كوئي كلام نتھي ملو</h3>
        <p style="color:var(--text-secondary);margin-bottom:1.5rem;">No matching Kalam found. Try adjusting your search query, volume tabs, or scope.</p>
        <button class="btn btn-gold" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;
    document.getElementById('paginationBar').innerHTML = '';
    return;
  }

  if (state.viewMode === 'grid') {
    container.innerHTML = `<div class="cards-grid">${pageItems.map(renderCard).join('')}</div>`;
  } else {
    container.innerHTML = renderTable(pageItems);
  }

  renderPagination(totalPages);
}

// Render Single Kalam Card (Authentic Book Page Styling)
function renderCard(item) {
  const isFav = state.favorites.has(item.id);
  const arabicHighlighted = highlightText(item.arabic, state.query, true);
  const ldHighlighted = highlightText(item.ld_translation, state.query, true);
  const enHighlighted = highlightText(item.english_translation, state.query, false);
  const speakerHighlighted = highlightText(item.stated_by, state.query, true);
  const cartoucheBadge = renderCartoucheSVG(item.serial_num, item.reference, item.stated_by, item.id);

  return `
    <div class="kalam-card" data-id="${item.id}">
      <!-- Top Bar: Speaker & Golden Cartouche -->
      <div class="card-top-bar">
        <div class="card-speaker-block">
          <span class="card-speaker-name">${speakerHighlighted}</span>
          <span class="card-volume-ref">${escapeHtml(item.reference)}</span>
        </div>
        <div class="card-top-right">
          ${cartoucheBadge}
          <div class="card-quick-actions">
            <button class="icon-btn-sm ${isFav ? 'active-fav' : ''}" title="${isFav ? 'Remove Bookmark' : 'Bookmark Kalam'}" onclick="toggleFavorite(${item.id})">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            </button>
            <button class="icon-btn-sm" title="Share Citation" onclick="copyCitation(${item.id})">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Central Arabic Kalam (Book Calligraphy) -->
      <div class="card-arabic-content">
        <div class="card-arabic-text">${arabicHighlighted}</div>
      </div>

      <!-- Lisan al-Dawat Translation (Book Typesetting) -->
      <div class="card-ld-content">
        <div class="card-ld-text">${ldHighlighted}</div>
      </div>

      <!-- English Translation -->
      <div class="card-en-content">
        <div class="card-en-label">English Translation</div>
        <div class="card-en-text">${enHighlighted}</div>
      </div>

      <!-- Card Footer -->
      <div class="card-footer-bar">
        <span class="card-id-badge">ID: #${item.id}</span>
        <div class="card-action-buttons">
          <button class="btn btn-icon" title="Copy Arabic" onclick="copyArabicText(${item.id})">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span style="font-size:0.75rem;">Arabic</span>
          </button>
          <button class="btn btn-icon" title="View Full Page Details" onclick="openDetailModal(${item.id})">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6"></path><path d="M10 14L21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
            <span style="font-size:0.75rem;">Detail</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Render Table View
function renderTable(items) {
  return `
    <div class="table-view-wrapper">
      <table class="kalam-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Reference</th>
            <th>Stated By</th>
            <th>Arabic Kalam</th>
            <th>Lisan al-Dawat</th>
            <th>English Translation</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => {
            const isFav = state.favorites.has(item.id);
            return `
              <tr>
                <td><strong>${toEasternArabicDigits(item.serial_num)} (${item.serial_num})</strong></td>
                <td><span class="badge badge-gold">${escapeHtml(item.reference)}</span></td>
                <td class="td-arabic" style="font-size:1.15rem;color:var(--theme-lapis);">${escapeHtml(item.stated_by)}</td>
                <td class="td-arabic">${highlightText(item.arabic, state.query, true)}</td>
                <td class="td-ld">${highlightText(item.ld_translation, state.query, true)}</td>
                <td class="td-en">${highlightText(item.english_translation, state.query, false)}</td>
                <td>
                  <div style="display:flex;gap:0.35rem;">
                    <button class="icon-btn-sm ${isFav ? 'active-fav' : ''}" onclick="toggleFavorite(${item.id})" title="Bookmark">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                    </button>
                    <button class="icon-btn-sm" onclick="openDetailModal(${item.id})" title="Detail">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6"></path><path d="M10 14L21 3"></path></svg>
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Render Filter Chips
function renderFilterChips() {
  const container = document.getElementById('activeFilterChips');
  if (!container) return;
  const chips = [];

  if (state.query) {
    chips.push(`<span class="filter-chip">Query: "${escapeHtml(state.query)}" <span class="filter-chip-remove" onclick="clearQuery()">×</span></span>`);
  }
  if (state.selectedVolume !== 'all') {
    chips.push(`<span class="filter-chip">Volume: ${escapeHtml(state.selectedVolume)} <span class="filter-chip-remove" onclick="setVolume('all')">×</span></span>`);
  }
  if (state.selectedSpeaker !== 'all') {
    chips.push(`<span class="filter-chip">Speaker: ${escapeHtml(state.selectedSpeaker)} <span class="filter-chip-remove" onclick="setSpeaker('all')">×</span></span>`);
  }
  if (state.scope !== 'all') {
    chips.push(`<span class="filter-chip">Scope: ${escapeHtml(state.scope)} <span class="filter-chip-remove" onclick="setScope('all')">×</span></span>`);
  }
  if (state.favoritesOnly) {
    chips.push(`<span class="filter-chip">Bookmarks Only (${state.favorites.size}) <span class="filter-chip-remove" onclick="toggleFavoritesOnly(false)">×</span></span>`);
  }

  container.innerHTML = chips.join('');
}

// Pagination Controls
function renderPagination(totalPages) {
  const bar = document.getElementById('paginationBar');
  if (!bar) return;
  if (totalPages <= 1) {
    bar.innerHTML = '';
    return;
  }

  let html = '';
  html += `<button class="page-btn" ${state.currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${state.currentPage - 1})">Previous</button>`;

  const maxButtons = 7;
  let startPage = Math.max(1, state.currentPage - 3);
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  if (startPage > 1) {
    html += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
    if (startPage > 2) html += `<span style="padding:0 0.4rem;">...</span>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-btn ${state.currentPage === i ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<span style="padding:0 0.4rem;">...</span>`;
    html += `<button class="page-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
  }

  html += `<button class="page-btn" ${state.currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${state.currentPage + 1})">Next</button>`;

  bar.innerHTML = html;
}

function goToPage(page) {
  state.currentPage = page;
  renderApp();
  window.scrollTo({ top: 380, behavior: 'smooth' });
}

// Copy Action Functions
function copyArabicText(id) {
  const item = state.data.find(d => d.id === id);
  if (item) copyToClipboard(item.arabic, 'Arabic Kalam copied!');
}

function copyCitation(id) {
  const item = state.data.find(d => d.id === id);
  if (item) copyToClipboard(formatCitation(item), 'Full citation formatted & copied!');
}

// Filter Control Handlers
function clearQuery() {
  state.query = '';
  const input = document.getElementById('searchInput');
  if (input) input.value = '';
  const clearBtn = document.getElementById('searchClearBtn');
  if (clearBtn) clearBtn.style.display = 'none';
  renderApp();
}

function setVolume(vol) {
  state.selectedVolume = vol;
  state.currentPage = 1;
  document.querySelectorAll('.vol-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.vol === vol);
  });
  renderApp();
}

function setSpeaker(speaker) {
  state.selectedSpeaker = speaker;
  state.currentPage = 1;
  const select = document.getElementById('speakerSelect');
  if (select) select.value = speaker;
  renderApp();
}

function setScope(scope) {
  state.scope = scope;
  state.currentPage = 1;
  const select = document.getElementById('searchScopeSelect');
  if (select) select.value = scope;
  renderApp();
}

function setSort(sortBy) {
  state.sortBy = sortBy;
  renderApp();
}

function setViewMode(mode) {
  state.viewMode = mode;
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === mode);
  });
  renderApp();
}

function toggleFavoritesOnly(enable) {
  state.favoritesOnly = enable !== undefined ? enable : !state.favoritesOnly;
  state.currentPage = 1;
  const btn = document.getElementById('favoritesFilterBtn');
  if (btn) btn.classList.toggle('active', state.favoritesOnly);
  renderApp();
}

function resetFilters() {
  state.query = '';
  state.scope = 'all';
  state.selectedVolume = 'all';
  state.selectedSpeaker = 'all';
  state.selectedTopic = null;
  state.sortBy = 'default';
  state.favoritesOnly = false;
  state.currentPage = 1;

  document.getElementById('searchInput').value = '';
  document.getElementById('searchClearBtn').style.display = 'none';
  document.getElementById('searchScopeSelect').value = 'all';
  document.getElementById('speakerSelect').value = 'all';
  document.getElementById('sortSelect').value = 'default';
  document.querySelectorAll('.topic-pill').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.vol-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.vol === 'all'));

  renderApp();
  showToast('Filters cleared', '↺');
}

// Modal Detail View (Full Page Replica)
function openDetailModal(id) {
  const index = state.data.findIndex(d => d.id === id);
  if (index === -1) return;
  state.currentModalIndex = index;
  renderModalContent();
  document.getElementById('detailModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeDetailModal() {
  document.getElementById('detailModal').classList.remove('active');
  document.body.style.overflow = '';
}

function renderModalContent() {
  const item = state.data[state.currentModalIndex];
  if (!item) return;

  const isFav = state.favorites.has(item.id);
  const container = document.getElementById('detailModalContainer');
  if (!container) return;
  const cartoucheBadge = renderCartoucheSVG(item.serial_num, item.reference, item.stated_by, `modal_${item.id}`);

  container.innerHTML = `
    <div class="modal-header">
      <div style="display:flex;gap:0.5rem;align-items:center;">
        <span class="badge badge-gold">${escapeHtml(item.reference)}</span>
        <span class="badge badge-lapis">Kalam #${item.serial_num}</span>
      </div>
      <div style="display:flex;gap:0.5rem;align-items:center;">
        <button class="icon-btn-sm ${isFav ? 'active-fav' : ''}" onclick="toggleFavorite(${item.id})" title="Bookmark">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
        </button>
        <button class="icon-btn-sm" onclick="closeDetailModal()" title="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>
    
    <div class="modal-body">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
        <div style="text-align:right;direction:rtl;font-size:1.4rem;font-weight:700;color:var(--theme-lapis);font-family:var(--font-arabic);">
          ${escapeHtml(item.stated_by)}
        </div>
        <div>
          ${cartoucheBadge}
        </div>
      </div>

      <div class="card-arabic-content" style="padding:1.5rem 0.5rem;">
        <div class="card-arabic-text" style="font-size:2.3rem;line-height:2.2;">
          ${escapeHtml(item.arabic)}
        </div>
      </div>

      <div class="card-ld-content" style="padding:1.25rem 1.5rem;">
        <div class="card-ld-text" style="font-size:1.45rem;">
          ${escapeHtml(item.ld_translation)}
        </div>
      </div>

      <div class="card-en-content" style="padding:1.1rem 1.35rem;">
        <div class="card-en-label">English Translation</div>
        <div class="card-en-text" style="font-size:1.05rem;">
          ${escapeHtml(item.english_translation)}
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <div style="display:flex;gap:0.5rem;">
        <button class="btn btn-icon" onclick="navigateModal(-1)" ${state.currentModalIndex === 0 ? 'disabled' : ''}>← Previous</button>
        <button class="btn btn-icon" onclick="navigateModal(1)" ${state.currentModalIndex === state.data.length - 1 ? 'disabled' : ''}>Next →</button>
      </div>
      <div style="display:flex;gap:0.5rem;">
        <button class="btn btn-icon" onclick="copyArabicText(${item.id})">Copy Arabic</button>
        <button class="btn btn-gold" onclick="copyCitation(${item.id})">Share Citation</button>
      </div>
    </div>
  `;
}

function navigateModal(direction) {
  const newIndex = state.currentModalIndex + direction;
  if (newIndex >= 0 && newIndex < state.data.length) {
    state.currentModalIndex = newIndex;
    renderModalContent();
  }
}

// Random Kalam generator
function pickRandomKalam() {
  const randomIdx = Math.floor(Math.random() * state.data.length);
  openDetailModal(state.data[randomIdx].id);
  showToast('Showing random Kalam!', '🎲');
}

// Statistics Modal
function openStatsModal() {
  const modal = document.getElementById('statsModal');
  if (!modal) return;

  const total = state.data.length;
  const volCounts = {};
  const speakerCounts = {};
  let totalArabicWords = 0;
  let totalEnglishWords = 0;

  state.data.forEach(d => {
    volCounts[d.reference] = (volCounts[d.reference] || 0) + 1;
    speakerCounts[d.stated_by] = (speakerCounts[d.stated_by] || 0) + 1;
    totalArabicWords += (d.arabic || '').split(/\s+/).filter(Boolean).length;
    totalEnglishWords += (d.english_translation || '').split(/\s+/).filter(Boolean).length;
  });

  const sortedSpeakers = Object.entries(speakerCounts).sort((a, b) => b[1] - a[1]);

  document.getElementById('statsModalBody').innerHTML = `
    <div class="stats-grid" style="margin-bottom:1.5rem;">
      <div class="stat-box">
        <div class="stat-number">${total}</div>
        <div class="stat-label">Total Kalam</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">3</div>
        <div class="stat-label">Volumes</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${Object.keys(speakerCounts).length}</div>
        <div class="stat-label">Distinct Speakers</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${totalArabicWords.toLocaleString()}</div>
        <div class="stat-label">Arabic Words</div>
      </div>
    </div>

    <h4 style="margin-bottom:0.75rem;font-size:1rem;color:var(--theme-lapis);">Distribution by Volume</h4>
    <div style="display:flex;gap:0.75rem;margin-bottom:1.5rem;flex-wrap:wrap;">
      ${Object.entries(volCounts).map(([vol, count]) => `
        <div style="flex:1;min-width:140px;background:var(--bg-elevated);padding:0.75rem 1rem;border-radius:var(--radius-sm);border:1px solid var(--theme-gold-border);">
          <div style="font-weight:700;color:var(--theme-gold-dark);font-family:var(--font-arabic);">${escapeHtml(vol)}</div>
          <div style="font-size:1.25rem;font-weight:800;color:var(--theme-lapis);">${count} Kalam</div>
        </div>
      `).join('')}
    </div>

    <h4 style="margin-bottom:0.75rem;font-size:1rem;color:var(--theme-lapis);">Top Speakers & Authors</h4>
    <div style="max-height:220px;overflow-y:auto;background:var(--bg-elevated);border-radius:var(--radius-sm);padding:0.75rem 1rem;border:1px solid var(--border-color);">
      ${sortedSpeakers.map(([sp, cnt]) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0;border-bottom:1px solid var(--border-color);">
          <span style="font-family:var(--font-arabic);direction:rtl;color:var(--text-primary);font-size:1rem;">${escapeHtml(sp)}</span>
          <span class="badge badge-gold">${cnt}</span>
        </div>
      `).join('')}
    </div>
  `;

  modal.classList.add('active');
}

function closeStatsModal() {
  const modal = document.getElementById('statsModal');
  if (modal) modal.classList.remove('active');
}

// Export Data helper
function exportData(format) {
  const items = getFilteredData();
  if (format === 'json') {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `raudat_hidayat_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported to JSON', '📥');
  } else if (format === 'csv') {
    const headers = ['ID', 'Reference', 'Serial', 'Stated By', 'Arabic', 'Lisan al-Dawat', 'English Translation'];
    const rows = items.map(d => [
      d.id,
      `"${(d.reference || '').replace(/"/g, '""')}"`,
      d.serial_num,
      `"${(d.stated_by || '').replace(/"/g, '""')}"`,
      `"${(d.arabic || '').replace(/"/g, '""')}"`,
      `"${(d.ld_translation || '').replace(/"/g, '""')}"`,
      `"${(d.english_translation || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `raudat_hidayat_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported to CSV', '📥');
  }
}

// Theme Toggle
function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('raudat_theme', state.theme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.innerHTML = state.theme === 'dark' 
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
  }
}

// Font Switcher Handler
function changeFont(fontName) {
  state.font = fontName;
  document.documentElement.style.setProperty('--font-arabic', `'${fontName}', 'Al-Fatemi', serif`);
  document.documentElement.style.setProperty('--font-ld', `'${fontName}', 'Al-Fatemi', serif`);
  localStorage.setItem('raudat_font', fontName);
  const fontSelect = document.getElementById('fontSelect');
  if (fontSelect) fontSelect.value = fontName;
  showToast(`Font changed to ${fontName}`, '🔤');
}

// Populate Speaker Select options
function populateSpeakers() {
  const select = document.getElementById('speakerSelect');
  if (!select) return;

  const speakerCounts = {};
  state.data.forEach(d => {
    speakerCounts[d.stated_by] = (speakerCounts[d.stated_by] || 0) + 1;
  });

  const sorted = Object.entries(speakerCounts).sort((a, b) => b[1] - a[1]);
  select.innerHTML = '<option value="all">All Speakers & Personalities (36)</option>' +
    sorted.map(([speaker, count]) => `<option value="${escapeHtml(speaker)}">${escapeHtml(speaker)} (${count})</option>`).join('');
}

// Populate Topic Pills
function populateTopics() {
  const container = document.getElementById('quickTopicPills');
  if (!container) return;

  container.innerHTML = TOPIC_PRESETS.map((t, idx) => `
    <button class="topic-pill" data-idx="${idx}" onclick="selectTopic(${idx})">${escapeHtml(t.label)}</button>
  `).join('');
}

function selectTopic(idx) {
  const topic = TOPIC_PRESETS[idx];
  const pills = document.querySelectorAll('.topic-pill');
  if (state.selectedTopic === idx) {
    state.selectedTopic = null;
    state.query = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('searchClearBtn').style.display = 'none';
    pills.forEach(p => p.classList.remove('active'));
  } else {
    state.selectedTopic = idx;
    state.query = topic.query;
    document.getElementById('searchInput').value = topic.query;
    document.getElementById('searchClearBtn').style.display = 'flex';
    pills.forEach((p, i) => p.classList.toggle('active', i === idx));
  }
  state.currentPage = 1;
  renderApp();
}

// Init Setup & Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.setAttribute('data-theme', state.theme);
  changeFont(state.font);
  updateThemeIcon();
  updateFavoritesCount();

  populateSpeakers();
  populateTopics();

  const searchInput = document.getElementById('searchInput');
  const searchClearBtn = document.getElementById('searchClearBtn');
  let debounceTimeout = null;

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimeout);
      const val = e.target.value;
      if (searchClearBtn) searchClearBtn.style.display = val ? 'flex' : 'none';

      debounceTimeout = setTimeout(() => {
        state.query = val;
        state.currentPage = 1;
        state.selectedTopic = null;
        document.querySelectorAll('.topic-pill').forEach(p => p.classList.remove('active'));
        renderApp();
      }, 150);
    });
  }

  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', clearQuery);
  }

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput && !document.getElementById('detailModal').classList.contains('active')) {
      e.preventDefault();
      if (searchInput) searchInput.focus();
    } else if (e.key === 'Escape') {
      if (document.getElementById('detailModal').classList.contains('active')) {
        closeDetailModal();
      } else if (document.getElementById('statsModal').classList.contains('active')) {
        closeStatsModal();
      } else if (searchInput && searchInput.value) {
        clearQuery();
      }
    } else if (document.getElementById('detailModal').classList.contains('active')) {
      if (e.key === 'ArrowLeft') navigateModal(-1);
      if (e.key === 'ArrowRight') navigateModal(1);
    }
  });

  document.getElementById('detailModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'detailModal') closeDetailModal();
  });
  document.getElementById('statsModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'statsModal') closeStatsModal();
  });

  renderApp();
});
