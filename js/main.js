(function () {
  window.ArcadeGames = window.ArcadeGames || {};

  const gridEl = document.getElementById('games-grid');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search');
  const categoryBar = document.getElementById('category-bar');
  const emptyState = document.getElementById('empty-state');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  const countPill = document.getElementById('game-count-pill');

  const modal = document.getElementById('game-modal');
  const modalShell = document.getElementById('modal-shell');
  const modalTitle = document.getElementById('modal-title');
  const modalControls = document.getElementById('modal-controls');
  const gameStage = document.getElementById('game-stage');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');

  let activeCategory = 'All';
  let searchQuery = '';
  let activeCleanup = null;

  const ORDERED_IDS = [
    'pool8ball',
    'dash',
    'game2048',
    'pong2p',
    'connect4',
    'tetris',
    'snake',
    'flappy',
    'breakout',
    'tactical',
    'speedrun',
    'citydriver',
    'storm',
    'meattoss'
  ];

  function getGameList() {
    const games = Object.values(window.ArcadeGames);
    games.sort((a, b) => {
      const ia = ORDERED_IDS.indexOf(a.id);
      const ib = ORDERED_IDS.indexOf(b.id);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
    return games;
  }

  function renderGames() {
    const games = getGameList();
    const q = searchQuery.trim().toLowerCase();

    const filtered = games.filter((game) => {
      const matchesCategory =
        activeCategory === 'All' || game.categories.includes(activeCategory);

      const haystack = [
        game.title,
        game.description,
        game.badge || '',
        ...game.categories
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = !q || haystack.includes(q);
      return matchesCategory && matchesSearch;
    });

    countPill.textContent = `${filtered.length} Game${filtered.length === 1 ? '' : 's'} Found`;
    gridEl.innerHTML = '';

    if (filtered.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    filtered.forEach((game) => {
      const card = document.createElement('article');
      card.className = 'game-card';
      card.tabIndex = 0;

      const tagsHtml = game.categories
        .slice(0, 3)
        .map((cat) => `<span class="tag">${cat}</span>`)
        .join('');

      card.innerHTML = `
        <div class="card-banner" style="background: ${game.accent}">
          <span>${game.icon}</span>
          ${game.badge ? `<span class="card-badge">${game.badge}</span>` : ''}
        </div>
        <div class="card-body">
          <h3 class="card-title">${game.title}</h3>
          <p class="card-desc">${game.description}</p>
          <div class="card-footer">
            <div class="card-tags">${tagsHtml}</div>
            <span class="play-pill">Play ▶</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => openGame(game));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openGame(game);
        }
      });

      gridEl.appendChild(card);
    });
  }

  function openGame(game) {
    closeGameCleanup();
    modalTitle.textContent = `${game.icon} ${game.title}`;
    modalControls.textContent = game.controls || '';
    gameStage.innerHTML = '';
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    if (typeof game.mount === 'function') {
      const cleanup = game.mount(gameStage);
      if (typeof cleanup === 'function') {
        activeCleanup = cleanup;
      }
    }
  }

  function closeGameCleanup() {
    if (activeCleanup) {
      try {
        activeCleanup();
      } catch (err) {
        console.error(err);
      }
      activeCleanup = null;
    }
    gameStage.innerHTML = '';
  }

  function closeModal() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    closeGameCleanup();
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    clearSearchBtn.classList.toggle('hidden', !searchQuery);
    renderGames();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    searchInput.focus();
    renderGames();
  });

  categoryBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.cat-btn');
    if (!btn) return;
    categoryBar.querySelectorAll('.cat-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    activeCategory = btn.dataset.category;
    renderGames();
  });

  resetFiltersBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    activeCategory = 'All';
    categoryBar.querySelectorAll('.cat-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.category === 'All');
    });
    renderGames();
  });

  closeModalBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });

  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      modalShell.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  document.addEventListener('DOMContentLoaded', renderGames);
})();
