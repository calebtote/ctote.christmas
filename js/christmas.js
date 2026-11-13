(function () {
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var flakes = ['❄', '❅', '❆', '*', '·'];

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  if (calm) {
    var m = document.querySelector('marquee');
    if (m && m.stop) m.stop();
  } else {
    setInterval(function () {
      if (document.hidden) return;
      var f = document.createElement('span');
      f.className = 'flake';
      f.textContent = pick(flakes);
      f.style.left = Math.random() * 100 + 'vw';
      f.style.fontSize = 10 + Math.random() * 18 + 'px';
      f.style.opacity = 0.5 + Math.random() * 0.5;
      f.style.setProperty('--drift', (Math.random() * 160 - 80) + 'px');
      f.style.animationDuration = 6 + Math.random() * 8 + 's';
      f.addEventListener('animationend', function () { f.remove(); });
      document.body.appendChild(f);
    }, 250);

    var last = 0;
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || e.timeStamp - last < 45) return;
      last = e.timeStamp;
      var t = document.createElement('span');
      t.className = 'trail';
      t.textContent = pick(['❄', '⭐', '✨']);
      t.style.left = e.clientX + 8 + 'px';
      t.style.top = e.clientY + 8 + 'px';
      t.addEventListener('animationend', function () { t.remove(); });
      document.body.appendChild(t);
    });
  }

  var counter = document.getElementById('counter');
  try {
    var visits = Number(localStorage.getItem('ctote-christmas-visits') || 0) + 1;
    localStorage.setItem('ctote-christmas-visits', visits);
    counter.textContent = String(1224 + visits).padStart(7, '0');
  } catch (e) {
    // Storage can be blocked in private browsing; the static number in the HTML stays.
  }

  var C = 523.25, D = 587.33, E = 659.25, F = 698.46, G = 783.99;
  var song = [
    [E,1],[E,1],[E,2], [E,1],[E,1],[E,2], [E,1],[G,1],[C,1.5],[D,.5], [E,4],
    [F,1],[F,1],[F,1.5],[F,.5], [F,1],[E,1],[E,1],[E,.5],[E,.5], [E,1],[D,1],[D,1],[E,1], [D,2],[G,2],
    [E,1],[E,1],[E,2], [E,1],[E,1],[E,2], [E,1],[G,1],[C,1.5],[D,.5], [E,4],
    [F,1],[F,1],[F,1.5],[F,.5], [F,1],[E,1],[E,1],[E,.5],[E,.5], [G,1],[G,1],[F,1],[D,1], [C,4]
  ];
  // One [root, fifth] pair per four-beat bar, played oom-pah under the melody.
  var Cb = [130.81, 196.00], Fb = [174.61, 261.63], Gb = [196.00, 293.66], Db = [146.83, 220.00];
  var bass = [Cb, Cb, Cb, Cb, Fb, Cb, Db, Gb, Cb, Cb, Cb, Cb, Fb, Cb, Gb, Cb];
  var beat = 0.22;

  var widget = document.getElementById('midi');
  var toggle = document.getElementById('midi-toggle');
  var ctx, master, bells, timer, playing = false;
  var STOPPED = 'ctote-christmas-music-stopped';

  function note(type, freq, t, len, vol) {
    var osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + len * 0.95);
    osc.connect(gain).connect(master);
    osc.start(t);
    osc.stop(t + len);
  }

  function bell(t) {
    var src = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    src.buffer = bells;
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    src.connect(filter).connect(gain).connect(master);
    src.start(t);
    src.stop(t + 0.12);
  }

  function schedulePass(start) {
    var t = start;
    song.forEach(function (n) {
      note('square', n[0], t, n[1] * beat, 0.05);
      t += n[1] * beat;
    });
    bass.forEach(function (chord, bar) {
      for (var b = 0; b < 4; b++) {
        var at = start + (bar * 4 + b) * beat;
        note('triangle', chord[b % 2], at, beat, 0.09);
        if (b % 2) bell(at);
      }
    });
    queueNext(t);
  }

  function queueNext(at) {
    timer = setTimeout(function () {
      // The audio clock is frozen while the tab is hidden, so wait instead of piling up passes.
      if (ctx.state !== 'running') return queueNext(at);
      schedulePass(at);
    }, Math.max(250, (at - ctx.currentTime - 0.5) * 1000));
  }

  function render() {
    widget.classList.toggle('is-playing', playing);
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.textContent = playing ? '■ Stop' : '▶ Play';
  }

  function start() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx || playing) return;
    ctx = ctx || new Ctx();
    if (!bells) {
      bells = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
      var data = bells.getChannelData(0);
      for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    ctx.resume();
    // A fresh master per run lets stop() silence notes that were already scheduled.
    master = ctx.createGain();
    master.connect(ctx.destination);
    playing = true;
    schedulePass(ctx.currentTime + 0.05);
    render();
  }

  function stop() {
    if (!playing) return;
    clearTimeout(timer);
    master.disconnect();
    playing = false;
    render();
  }

  function store(stopped) {
    try { stopped ? localStorage.setItem(STOPPED, '1') : localStorage.removeItem(STOPPED); } catch (e) {}
  }

  function wasStopped() {
    try { return localStorage.getItem(STOPPED) === '1'; } catch (e) { return false; }
  }

  toggle.addEventListener('click', function () {
    if (playing) { stop(); store(true); } else { start(); store(false); }
  });

  // Browsers only allow audio after a user gesture, so the tune starts on the first one.
  function firstGesture(e) {
    if (widget.contains(e.target)) return;
    document.removeEventListener('pointerdown', firstGesture);
    document.removeEventListener('keydown', firstGesture);
    if (!wasStopped()) start();
  }
  document.addEventListener('pointerdown', firstGesture);
  document.addEventListener('keydown', firstGesture);

  document.addEventListener('visibilitychange', function () {
    if (!ctx || !playing) return;
    document.hidden ? ctx.suspend() : ctx.resume();
  });

  render();
})();
