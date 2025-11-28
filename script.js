(function () {
  const rows = 12; // total visible rows on the device
  const candidates = [
    { id: "c1", name: "Aarav Sharma", logo: "🪷", blur: true },
    { id: "c2", name: "Diya Kapoor", logo: "🦚", blur: true },
    { id: "c3", name: "श्री. संतोष अरविंद शेलार", logoImg: "Lotus.png" },
    { id: "c4", name: "Neha Kulkarni", logo: "🌾", blur: true },
    { id: "c5", name: "Ravi Menon", logo: "🛕", blur: true }
  ];

  const panel = document.getElementById("evm-panel");
  const ledColumn = document.getElementById("led-column");
  const resetBtn = document.getElementById("reset-btn");
  const STORAGE_KEY = "vfsVotes";
  const DEFAULT_VOTES = { total: 0, candidates: {}, candidateNames: {} };

  function getStoredVotes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_VOTES));
      const parsed = JSON.parse(raw);
      return {
        total: parsed.total || 0,
        candidates: parsed.candidates || {},
        candidateNames: parsed.candidateNames || {},
      };
    } catch (err) {
      console.warn("Unable to read stored votes:", err);
      return JSON.parse(JSON.stringify(DEFAULT_VOTES));
    }
  }

  function persistVotes(votes) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
    } catch (err) {
      console.error("Unable to save votes locally:", err);
    }
  }

  function recordVote(candidate) {
    const votes = getStoredVotes();
    votes.total = (votes.total || 0) + 1;
    votes.candidates[candidate.id] = (votes.candidates[candidate.id] || 0) + 1;
    votes.candidateNames[candidate.id] = candidate.name;
    persistVotes(votes);
  }

  // Build label slots, LEDs and buttons to align like the machine image
  const labelHtml = [];
  const ledHtml = [];
  const buttonHtml = [];

  for (let i = 0; i < rows; i++) {
    const candidate = candidates[i];
    const isBlurred = candidate ? Boolean(candidate.blur) : false;
    const blurClass = isBlurred ? ' row-blur' : '';
    if (candidate) {
      const c = candidate;
      let logoMarkup = "";
      if (c.logoImg) {
        logoMarkup = '<img src="' + c.logoImg + '" alt="' + c.name + ' symbol">';
      } else {
        logoMarkup = c.logoSvg || c.logo || "";
      }
      labelHtml.push(
        '<div class="label-item' + blurClass + '">' +
          '<span class="label-logo" aria-hidden="true">' + logoMarkup + '</span>' +
          '<span class="label-name">' + c.name + '</span>' +
        '</div>'
      );
    } else {
      labelHtml.push('<div' + (isBlurred ? ' class="row-blur"' : '') + '></div>');
    }
    // LED dot
    ledHtml.push('<div class="led' + blurClass + '" data-row="' + i + '"></div>');
    // Button exists for first N candidate rows, else empty spacer
    if (candidate) {
      const c = candidate;
      buttonHtml.push('<button class="vote-btn' + blurClass + '" type="button" data-row="' + i + '" aria-label="Vote for ' + c.name + '"></button>');
    } else {
      buttonHtml.push('<div' + (isBlurred ? ' class="row-blur"' : '') + ' style="height:20px"></div>');
    }
  }

  document.querySelector('.labels').innerHTML = labelHtml.join('');
  ledColumn.innerHTML = ledHtml.join('');
  panel.innerHTML = buttonHtml.join('');

  // Audio setup
  let audioContext = null;
  function getAudio() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
  }

  let busy = false;
  const BEEP_MS = 2000;

  function setButtonsDisabled(disabled) {
    document.querySelectorAll(".vote-btn").forEach((btn) => {
      btn.disabled = disabled;
    });
  }

  function setRowLed(rowIndex, greenOn) {
    const ledEl = document.querySelector('.led[data-row="' + rowIndex + '"]');
    if (!ledEl) return;
    // Reset all LEDs to red first
    document.querySelectorAll('.led').forEach((l) => l.classList.remove('led--green'));
    if (greenOn) ledEl.classList.add('led--green');
  }

  async function beep() {
    const ctx = getAudio();
    if (ctx.state === "suspended") {
      try { await ctx.resume(); } catch (_) { /* noop */ }
    }

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = 1000; // ~1kHz

    // gentle attack/decay to avoid clicks
    const now = ctx.currentTime;
    const attack = 0.01;
    const release = 0.05;
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + attack);
    gain.gain.setValueAtTime(0.25, now + (BEEP_MS / 1000) - release);
    gain.gain.linearRampToValueAtTime(0.0, now + (BEEP_MS / 1000));

    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + (BEEP_MS / 1000));

    return new Promise((resolve) => {
      oscillator.onended = resolve;
    });
  }

  function showMessage(text) {
    const messageEl = document.getElementById('vote-message');
    if (!messageEl) return;
    
    messageEl.textContent = text;
    messageEl.style.display = 'block';
    
    // Reset animation by removing and re-adding the element
    messageEl.style.animation = 'none';
    setTimeout(() => {
      messageEl.style.animation = 'fadeInOut 3s ease-in-out';
    }, 10);
    
    // Hide after animation
    setTimeout(() => {
      messageEl.style.display = 'none';
    }, 3000);
  }

  async function onVote(buttonEl) {
    if (busy) return;
    busy = true;
    setButtonsDisabled(true);
    const row = Number(buttonEl.getAttribute('data-row'));
    const candidate = candidates[row];
    
    if (!candidate) {
      busy = false;
      setButtonsDisabled(false);
      return;
    }

    setRowLed(row, true);

    // Optional haptic feedback
    if (navigator.vibrate) {
      try { navigator.vibrate(60); } catch (_) { /* ignore */ }
    }

    recordVote(candidate);

    // Show special message for Santosh Shelar (c3)
    if (candidate.id === 'c3') {
      showMessage('श्री. संतोष अरविंद शेलार यांना भरघोस मतांनी निवडून द्या');
    }

    await beep();

    // turn off green indication, back to red-only column
    setRowLed(row, false);
    setButtonsDisabled(false);
    busy = false;
  }

  panel.addEventListener("click", function (e) {
    const target = e.target;
    if (target && target.classList && target.classList.contains("vote-btn")) {
      onVote(target);
    }
  });

  resetBtn.addEventListener("click", function () {
    // Stop any ongoing beep by closing/recreating audio context
    if (audioContext) {
      try { audioContext.close(); } catch (_) { /* noop */ }
      audioContext = null;
    }
    busy = false;
    setButtonsDisabled(false);
    document.querySelectorAll('.led').forEach((l) => l.classList.remove('led--green'));
  });
})();


