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
  var button = document.getElementById('jingle');
  var ctx, playing = false;

  button.addEventListener('click', function () {
    if (playing) return;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    ctx = ctx || new Ctx();
    playing = true;
    var beat = 0.22, t = ctx.currentTime + 0.05;
    song.forEach(function (n) {
      var osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = n[0];
      gain.gain.setValueAtTime(0.07, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n[1] * beat * 0.95);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + n[1] * beat);
      t += n[1] * beat;
    });
    setTimeout(function () { playing = false; }, (t - ctx.currentTime) * 1000);
  });
})();
