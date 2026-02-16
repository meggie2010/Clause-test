// Mobile navigation toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('active');
  navToggle.classList.toggle('active');
});

// Close mobile nav when a link is clicked
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('active');
    navToggle.classList.remove('active');
  });
});

// ===========================
// Spending Dashboard — Gauge Meters
// ===========================

(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var CX = 110, CY = 105, R = 80, STROKE = 18;
  var PATH_LEN = Math.PI * R;

  function el(tag, attrs) {
    var node = document.createElementNS(NS, tag);
    for (var k in attrs) {
      if (attrs.hasOwnProperty(k)) node.setAttribute(k, attrs[k]);
    }
    return node;
  }

  function polar(angleDeg) {
    var rad = angleDeg * Math.PI / 180;
    return { x: CX + R * Math.cos(rad), y: CY - R * Math.sin(rad) };
  }

  var arcD = (function () {
    var s = polar(180), e = polar(0);
    return 'M ' + s.x + ' ' + s.y + ' A ' + R + ' ' + R + ' 0 0 1 ' + e.x + ' ' + e.y;
  })();

  document.querySelectorAll('.gauge-card').forEach(function (card) {
    var limit = parseFloat(card.dataset.limit);
    var actual = parseFloat(card.dataset.actual);
    var max = parseFloat(card.dataset.max);
    var svg = card.querySelector('.gauge-svg');
    if (!svg) return;

    // Background track
    svg.appendChild(el('path', {
      d: arcD, fill: 'none', stroke: '#e2e8f0',
      'stroke-width': STROKE, 'stroke-linecap': 'round'
    }));

    // Actual value fill
    var offset = PATH_LEN * (1 - actual / max);
    var fillPath = el('path', {
      d: arcD, fill: 'none', stroke: '#2b6777',
      'stroke-width': STROKE, 'stroke-linecap': 'round',
      'stroke-dasharray': PATH_LEN, 'stroke-dashoffset': PATH_LEN
    });
    svg.appendChild(fillPath);

    // Animate fill on load
    requestAnimationFrame(function () {
      fillPath.style.transition = 'stroke-dashoffset 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      fillPath.setAttribute('stroke-dashoffset', offset);
    });

    // Needle at limit
    var needleAngle = 180 - (limit / max * 180);
    var tip = polar(needleAngle);
    svg.appendChild(el('line', {
      x1: CX, y1: CY, x2: tip.x, y2: tip.y,
      stroke: '#2d3748', 'stroke-width': 2.5, 'stroke-linecap': 'round'
    }));

    // Center dot
    svg.appendChild(el('circle', {
      cx: CX, cy: CY, r: 5, fill: '#2d3748'
    }));

    // Scale labels: 0 and max
    var lbl0 = el('text', {
      x: CX - R, y: CY + 22,
      'text-anchor': 'middle', 'font-size': '11',
      fill: '#64748b', 'font-family': 'sans-serif'
    });
    lbl0.textContent = '0';
    svg.appendChild(lbl0);

    var lblMax = el('text', {
      x: CX + R, y: CY + 22,
      'text-anchor': 'middle', 'font-size': '11',
      fill: '#64748b', 'font-family': 'sans-serif'
    });
    lblMax.textContent = max;
    svg.appendChild(lblMax);
  });
})();
