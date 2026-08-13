(function () {
  "use strict";

  /* ---------- state ---------- */
  let currentMood = "all";
  let queue = [];
  let currentIndex = -1;
  let player = null;
  let ytReady = false;
  let isPlaying = false;
  let seekTimer = null;

  /* ---------- dom ---------- */
  const $ = (sel) => document.querySelector(sel);
  const trackListEl = $("#tracklist");
  const trackCountEl = $("#trackCount");
  const trackCount2El = $("#trackCount2");
  const aboardEl = $("#aboardCount");
  const clockEl = $("#clock");
  const dashTitle = $("#dashTitle");
  const dashArtist = $("#dashArtist");
  const dashImg = $("#dashImg");
  const dashCur = $("#dashCur");
  const dashDur = $("#dashDur");
  const dashSeek = $("#dashSeek");
  const btnPlay = $("#btnPlay");
  const btnPrev = $("#btnPrev");
  const btnNext = $("#btnNext");
  const btnHorn = $("#btnHorn");
  const btnQueue = $("#btnQueue");
  const btnTicket = $("#btnTicket");
  const ticketModal = $("#ticketModal");

  /* ---------- clock ---------- */
  function tickClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    clockEl.textContent = `${h}:${m}`;
  }
  tickClock();
  setInterval(tickClock, 1000 * 15);

  /* ---------- fake "aboard" counter (cosmetic, deterministic-ish) ---------- */
  function updateAboard() {
    const base = 40 + Math.round(Math.sin(Date.now() / 90000) * 15) + 55;
    aboardEl.textContent = base;
  }
  updateAboard();
  setInterval(updateAboard, 12000);

  /* ---------- render tracklist ---------- */
  function moodFilter(mood) {
    return TRACKS.filter((t) => t.moods.includes(mood));
  }

  function renderList(mood) {
    queue = moodFilter(mood);
    trackListEl.innerHTML = "";
    queue.forEach((t, i) => {
      const li = document.createElement("li");
      li.className = "track";
      li.dataset.index = String(i);
      li.innerHTML = `
        <span class="track__num">${i + 1}</span>
        <span class="track__art">${THUMB_POOL[i % THUMB_POOL.length]}</span>
        <span class="track__meta">
          <p class="track__title">${escapeHtml(t.title)}</p>
          <p class="track__artist">${escapeHtml(t.artist)}</p>
        </span>
        <button class="track__play" aria-label="Play ${escapeHtml(t.title)}">▶</button>
      `;
      li.addEventListener("click", () => playIndex(i));
      trackListEl.appendChild(li);
    });
    trackCountEl.textContent = queue.length;
    trackCount2El.textContent = queue.length;
    highlightPlaying();
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function highlightPlaying() {
    [...trackListEl.children].forEach((li, i) => {
      li.classList.toggle("track--playing", i === currentIndex);
      const btn = li.querySelector(".track__play");
      btn.textContent = i === currentIndex && isPlaying ? "❚❚" : "▶";
    });
  }

  /* ---------- mood pills ---------- */
  document.querySelectorAll(".pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".pill").forEach((p) => p.classList.remove("pill--active"));
      pill.classList.add("pill--active");
      currentMood = pill.dataset.mood;
      currentIndex = -1;
      renderList(currentMood);
    });
  });

  /* ---------- language pills (cosmetic — swaps a couple of labels) ---------- */
  const LANG_STRINGS = {
    en: { title: "रात की बस", tag: "All night on NH 44" },
    bn: { title: "রাতের বাস", tag: "সারারাত NH 44-এ" },
    mr: { title: "रात्रीची बस", tag: "NH 44 वर रात्रभर" },
  };
  document.querySelectorAll(".lang").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".lang").forEach((b) => b.classList.remove("lang--active"));
      btn.classList.add("lang--active");
      const s = LANG_STRINGS[btn.dataset.lang] || LANG_STRINGS.en;
      $(".ticket__title").textContent = s.title;
      $(".ticket__tag").textContent = s.tag;
    });
  });

  /* ---------- YouTube IFrame API ---------- */
  window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player("ytMount", {
      height: "1",
      width: "1",
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        playsinline: 1,
      },
      events: {
        onReady: () => { ytReady = true; },
        onStateChange: onPlayerStateChange,
      },
    });
  };

  function loadYT() {
    if (window.YT && window.YT.Player) {
      window.onYouTubeIframeAPIReady();
      return;
    }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  }
  loadYT();

  function onPlayerStateChange(e) {
    if (e.data === YT.PlayerState.PLAYING) {
      isPlaying = true;
      btnPlay.textContent = "❚❚";
      startSeekLoop();
    } else if (e.data === YT.PlayerState.PAUSED) {
      isPlaying = false;
      btnPlay.textContent = "▶";
    } else if (e.data === YT.PlayerState.ENDED) {
      nextTrack();
    }
    highlightPlaying();
  }

  function startSeekLoop() {
    clearInterval(seekTimer);
    seekTimer = setInterval(() => {
      if (!player || !player.getCurrentTime) return;
      const cur = player.getCurrentTime() || 0;
      const dur = player.getDuration() || 0;
      dashCur.textContent = fmtTime(cur);
      dashDur.textContent = fmtTime(dur);
      if (dur > 0) dashSeek.value = String((cur / dur) * 100);
    }, 500);
  }

  function fmtTime(sec) {
    sec = Math.floor(sec || 0);
    const m = Math.floor(sec / 60);
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  /* ---------- playback control ---------- */
  function playIndex(i) {
    if (i < 0 || i >= queue.length) return;
    currentIndex = i;
    const t = queue[i];
    dashTitle.textContent = t.title;
    dashArtist.textContent = t.artist;
    dashImg.style.display = "none";
    highlightPlaying();

    if (!ytReady || !player) {
      // API still loading — retry shortly.
      setTimeout(() => playIndex(i), 400);
      return;
    }
    const query = `${t.title} ${t.artist}`;
    player.loadPlaylist({ list: query, listType: "search", index: 0 });
    player.playVideo();
  }

  function togglePlay() {
    if (currentIndex === -1) {
      if (queue.length) playIndex(0);
      return;
    }
    if (!player) return;
    if (isPlaying) player.pauseVideo();
    else player.playVideo();
  }

  function nextTrack() {
    if (!queue.length) return;
    playIndex((currentIndex + 1) % queue.length);
  }
  function prevTrack() {
    if (!queue.length) return;
    playIndex((currentIndex - 1 + queue.length) % queue.length);
  }

  btnPlay.addEventListener("click", togglePlay);
  btnNext.addEventListener("click", nextTrack);
  btnPrev.addEventListener("click", prevTrack);

  dashSeek.addEventListener("input", () => {
    if (!player || !player.getDuration) return;
    const dur = player.getDuration() || 0;
    if (!dur) return;
    player.seekTo((dashSeek.value / 100) * dur, true);
  });

  /* ---------- horn ---------- */
  let hornCtx = null;
  function honk() {
    btnHorn.classList.add("dash__btn--honking");
    try {
      hornCtx = hornCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = hornCtx.createOscillator();
      const gain = hornCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = 220;
      gain.gain.setValueAtTime(0.0001, hornCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, hornCtx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, hornCtx.currentTime + 0.5);
      osc.connect(gain).connect(hornCtx.destination);
      osc.start();
      osc.stop(hornCtx.currentTime + 0.55);
    } catch (err) { /* audio unsupported — silent no-op */ }
    setTimeout(() => btnHorn.classList.remove("dash__btn--honking"), 400);
  }
  btnHorn.addEventListener("click", honk);

  /* ---------- queue toggle (scrolls to list) ---------- */
  btnQueue.addEventListener("click", () => {
    $("#tracklist").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* ---------- ticket share modal ---------- */
  function openTicket() { ticketModal.hidden = false; }
  function closeTicket() { ticketModal.hidden = true; }
  btnTicket.addEventListener("click", openTicket);
  $("#closeTicket").addEventListener("click", closeTicket);
  $("#notNowTicket").addEventListener("click", closeTicket);
  $("#sendTicket").addEventListener("click", async () => {
    const url = location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "रात की बस", url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch (err) { /* user cancelled share — ignore */ }
    closeTicket();
  });
  ticketModal.addEventListener("click", (e) => {
    if (e.target === ticketModal) closeTicket();
  });

  /* ---------- keyboard shortcuts ---------- */
  document.addEventListener("keydown", (e) => {
    if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
    switch (e.key.toLowerCase()) {
      case " ":
        e.preventDefault(); togglePlay(); break;
      case "arrowright":
        if (player && player.seekTo) player.seekTo((player.getCurrentTime() || 0) + 5, true);
        break;
      case "arrowleft":
        if (player && player.seekTo) player.seekTo(Math.max(0, (player.getCurrentTime() || 0) - 5), true);
        break;
      case "n": nextTrack(); break;
      case "p": prevTrack(); break;
      case "q": btnQueue.click(); break;
      case "t": openTicket(); break;
      case "h": honk(); break;
      case "escape": closeTicket(); break;
    }
  });

  /* ---------- init ---------- */
  renderList(currentMood);
})();
