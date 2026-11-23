// Parabola plots for f(x) = a(x - h)^2 + k, and the discriminant b^2 - 4ac as a function of k.
// Used by the interactive widget and by the three fixed cases (0, 1, 2 real roots).
document.addEventListener('DOMContentLoaded', function () {
  // Discriminant b^2 - 4ac, with b = -2ah and c = ah^2 + kk (the standard-form coefficients).
  function disc(h, a, kk) { var b = -2 * a * h; return b * b - 4 * a * (a * h * h + kk); }

  // Four significant digits: keeps small coefficients from rounding to 0.
  function fmt(v) { return String(Number(v.toPrecision(4))); }
  function sgn(v) { return v < 0 ? '-' : '+'; }
  function tex(el, s) {
    if (window.katex) katex.render(s, el, { throwOnError: false });
    else el.textContent = s;
  }

  // Grid, theme-pink axes with arrowheads and labels. Returns the context and coordinate maps.
  function drawFrame(cv, v, xl, yl) {
    var c = cv.getContext('2d');
    function px(x) { return (x - v.x0) / (v.x1 - v.x0) * cv.width; }
    function py(y) { return cv.height - (y - v.y0) / (v.y1 - v.y0) * cv.height; }
    c.clearRect(0, 0, cv.width, cv.height);
    c.strokeStyle = '#ddd';
    c.lineWidth = 1;
    var sx = v.sx || 1, sy = v.sy || 1; // grid spacing per axis, default 1 unit
    for (var gx = Math.ceil(v.x0 / sx) * sx; gx <= v.x1; gx += sx) {
      c.beginPath(); c.moveTo(px(gx), 0); c.lineTo(px(gx), cv.height); c.stroke();
    }
    for (var gy = Math.ceil(v.y0 / sy) * sy; gy <= v.y1; gy += sy) {
      c.beginPath(); c.moveTo(0, py(gy)); c.lineTo(cv.width, py(gy)); c.stroke();
    }
    // Thick theme-pink axes (--accent-color) with arrowheads and labels, drawn over the grid.
    c.strokeStyle = c.fillStyle = '#f18eb0';
    c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(px(0), cv.height); c.lineTo(px(0), 0);
    c.moveTo(0, py(0)); c.lineTo(cv.width, py(0)); c.stroke();
    function arrow(x, y, dx, dy) {
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x - 12 * dx + 6 * dy, y - 12 * dy - 6 * dx);
      c.lineTo(x - 12 * dx - 6 * dy, y - 12 * dy + 6 * dx);
      c.closePath(); c.fill();
    }
    arrow(cv.width, py(0), 1, 0);
    arrow(px(0), 0, 0, -1);
    c.font = 'bold 16px sans-serif';
    c.fillText(xl, cv.width - 16, py(0) - 10);
    c.fillText(yl, px(0) + 10, 16);
    return { c: c, px: px, py: py };
  }

  // roots: also mark the real roots (black dots on the x axis).
  function drawParabola(cv, v, h, k, a, roots) {
    var p = drawFrame(cv, v, 'x', 'y'), c = p.c;
    c.strokeStyle = '#1f77b4';
    c.lineWidth = 2;
    c.beginPath();
    for (var i = 0; i <= cv.width; i++) {
      var x = v.x0 + i * (v.x1 - v.x0) / cv.width;
      var y = a * (x - h) * (x - h) + k;
      if (i === 0) c.moveTo(p.px(x), p.py(y)); else c.lineTo(p.px(x), p.py(y));
    }
    c.stroke();
    if (roots) {
      var r = -k / a; // a(x - h)^2 + k = 0 gives (x - h)^2 = -k/a
      c.fillStyle = '#000';
      if (r > 0) {
        c.beginPath(); c.arc(p.px(h - Math.sqrt(r)), p.py(0), 5, 0, 2 * Math.PI); c.fill();
        c.beginPath(); c.arc(p.px(h + Math.sqrt(r)), p.py(0), 5, 0, 2 * Math.PI); c.fill();
      } else if (r === 0) {
        c.beginPath(); c.arc(p.px(h), p.py(0), 5, 0, 2 * Math.PI); c.fill();
      }
    }
    c.fillStyle = '#d62728';
    c.beginPath(); c.arc(p.px(h), p.py(k), 4, 0, 2 * Math.PI); c.fill();
  }

  function drawDiscriminant(cv, v, h, a, k) {
    var p = drawFrame(cv, v, 'k', '\u0394'), c = p.c;
    c.strokeStyle = '#1f77b4';
    c.lineWidth = 2;
    c.beginPath();
    for (var i = 0; i <= cv.width; i++) {
      var kk = v.x0 + i * (v.x1 - v.x0) / cv.width;
      if (i === 0) c.moveTo(p.px(kk), p.py(disc(h, a, kk))); else c.lineTo(p.px(kk), p.py(disc(h, a, kk)));
    }
    c.stroke();
    c.fillStyle = '#d62728';
    c.beginPath(); c.arc(p.px(k), p.py(disc(h, a, k)), 4, 0, 2 * Math.PI); c.fill();
  }

  // Three fixed cases: a = -1, h = 2, and k = -4, 0, 4 give 0, 1 and 2 real roots (Delta = 4k).
  var caseView = { x0: -1, x1: 5, y0: -8, y1: 6, sy: 2 };
  var caseDiscView = { x0: -6, x1: 6, y0: -20, y1: 20, sx: 2, sy: 10 };
  [-4, 0, 4].forEach(function (k, i) {
    var pc = document.getElementById('case-' + i + '-parabola');
    var dc = document.getElementById('case-' + i + '-discriminant');
    if (!pc || !dc) return;
    drawParabola(pc, caseView, 2, k, -1, true);
    drawDiscriminant(dc, caseDiscView, 2, -1, k);
  });

  // Interactive widget: parabola plot and its canonical and standard forms.
  var canvas = document.getElementById('parabola-canvas');
  if (!canvas) return;
  var hEl = document.getElementById('pw-h');
  var kEl = document.getElementById('pw-k');
  var aEl = document.getElementById('pw-a');
  var errEl = document.getElementById('pw-error');
  var canEl = document.getElementById('pw-canonical');
  var stdEl = document.getElementById('pw-standard');
  var view = { x0: -1, x1: 12, y0: -1, y1: 5 }; // y spans 6 units

  function update() {
    var h = parseFloat(hEl.value), k = parseFloat(kEl.value), a = parseFloat(aEl.value);
    if (!isFinite(h) || !isFinite(k) || !isFinite(a) || a === 0) {
      errEl.textContent = 'Enter numbers for x and y, and a non-zero a.';
      return;
    }
    errEl.textContent = '';
    var b = -2 * a * h, c = a * h * h + k;
    tex(canEl, 'f(x) = ' + fmt(a) + '\\left(x ' + sgn(-h) + ' ' + fmt(Math.abs(h)) + '\\right)^2 ' + sgn(k) + ' ' + fmt(Math.abs(k)));
    tex(stdEl, 'f(x) = ' + fmt(a) + 'x^2 ' + sgn(b) + ' ' + fmt(Math.abs(b)) + 'x ' + sgn(c) + ' ' + fmt(Math.abs(c)));
    drawParabola(canvas, view, h, k, a, false);
  }

  [hEl, kEl, aEl].forEach(function (el) { el.addEventListener('input', update); });
  update();
});
