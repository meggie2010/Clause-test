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
// Monthly Spending Trends
// ===========================

(function () {
  // Sample data: 6 months of spending by category
  var monthlyData = [
    { month: 'Oct', housing: 1450, food: 620, transport: 340, shopping: 280, utilities: 190, entertainment: 150 },
    { month: 'Nov', housing: 1450, food: 580, transport: 310, shopping: 420, utilities: 210, entertainment: 180 },
    { month: 'Dec', housing: 1450, food: 710, transport: 290, shopping: 650, utilities: 230, entertainment: 240 },
    { month: 'Jan', housing: 1450, food: 540, transport: 320, shopping: 190, utilities: 250, entertainment: 110 },
    { month: 'Feb', housing: 1450, food: 510, transport: 280, shopping: 210, utilities: 220, entertainment: 130 },
    { month: 'Mar', housing: 1450, food: 490, transport: 260, shopping: 170, utilities: 200, entertainment: 120 }
  ];

  var insights = [
    'October had steady baseline spending. Food and shopping are your two biggest variable categories — a good place to start optimizing.',
    'November saw a 50% spike in shopping ($420). Holiday prep likely contributed. Food dropped $40 — nice discipline there.',
    'December was the highest spending month at $3,570. Holiday shopping ($650) and dining out drove the increase. Expect this — plan ahead next year.',
    'January brought a strong reset. Shopping dropped 71% from December. Overall spending fell to $2,860 — a great recovery month.',
    'February continued the downward trend. Food spending dropped to $510 and transport hit its lowest point. Consistent progress.',
    'March is your best month yet at $2,690 total. Every variable category is at or near its 6-month low. Your budget plan is working.'
  ];

  var categories = ['housing', 'food', 'transport', 'shopping', 'utilities', 'entertainment'];

  function getTotal(data) {
    return categories.reduce(function (sum, cat) { return sum + data[cat]; }, 0);
  }

  function findBiggest(data) {
    var max = 0;
    var name = '';
    categories.forEach(function (cat) {
      if (data[cat] > max) { max = data[cat]; name = cat; }
    });
    return { name: name.charAt(0).toUpperCase() + name.slice(1), amount: max };
  }

  function findMostImproved(index) {
    if (index === 0) return { name: '—', change: 0 };
    var best = { name: '—', change: 0 };
    categories.forEach(function (cat) {
      var diff = monthlyData[index - 1][cat] - monthlyData[index][cat];
      if (diff > best.change) {
        best = { name: cat.charAt(0).toUpperCase() + cat.slice(1), change: diff };
      }
    });
    return best;
  }

  function formatCurrency(n) {
    return '$' + n.toLocaleString();
  }

  function updateDashboard(monthIndex) {
    var data = monthlyData[monthIndex];
    var total = getTotal(data);
    var maxCatValue = Math.max.apply(null, categories.map(function (c) { return data[c]; }));

    // Update category bars
    categories.forEach(function (cat) {
      var pct = (data[cat] / maxCatValue) * 100;
      var fills = document.querySelectorAll('.bar-fill[data-category="' + cat + '"]');
      var values = document.querySelectorAll('.bar-value[data-category="' + cat + '"]');
      fills.forEach(function (el) { el.style.setProperty('--bar-width', pct + '%'); });
      values.forEach(function (el) { el.textContent = formatCurrency(data[cat]); });
    });

    // Update total
    var totalEl = document.getElementById('totalSpent');
    if (totalEl) totalEl.textContent = formatCurrency(total);

    // Update total change
    var changeEl = document.getElementById('totalChange');
    if (changeEl && monthIndex > 0) {
      var prevTotal = getTotal(monthlyData[monthIndex - 1]);
      var diff = total - prevTotal;
      var pctChange = ((diff / prevTotal) * 100).toFixed(1);
      if (diff < 0) {
        changeEl.textContent = pctChange + '% vs last month';
        changeEl.className = 'summary-change positive';
      } else if (diff > 0) {
        changeEl.textContent = '+' + pctChange + '% vs last month';
        changeEl.className = 'summary-change negative';
      } else {
        changeEl.textContent = 'No change vs last month';
        changeEl.className = 'summary-change neutral';
      }
    } else if (changeEl) {
      changeEl.textContent = 'Baseline month';
      changeEl.className = 'summary-change neutral';
    }

    // Update biggest category
    var biggest = findBiggest(data);
    var bigCatEl = document.getElementById('biggestCategory');
    var bigAmtEl = document.getElementById('biggestAmount');
    if (bigCatEl) bigCatEl.textContent = biggest.name;
    if (bigAmtEl) bigAmtEl.textContent = formatCurrency(biggest.amount);

    // Update most improved
    var improved = findMostImproved(monthIndex);
    var impEl = document.getElementById('mostImproved');
    var impAmtEl = document.getElementById('improvedAmount');
    if (impEl) impEl.textContent = improved.name;
    if (impAmtEl) {
      impAmtEl.textContent = improved.change > 0 ? '-' + formatCurrency(improved.change) + ' saved' : 'N/A';
    }

    // Update insight
    var insightEl = document.getElementById('monthInsight');
    if (insightEl) insightEl.textContent = insights[monthIndex];

    // Update month tabs
    document.querySelectorAll('.month-tab').forEach(function (tab) {
      tab.classList.toggle('active', parseInt(tab.dataset.month) === monthIndex);
    });

    // Update 6-month trend bars
    var totals = monthlyData.map(function (d) { return getTotal(d); });
    var maxTotal = Math.max.apply(null, totals);
    document.querySelectorAll('.trend-col').forEach(function (col) {
      var i = parseInt(col.dataset.month);
      var bar = col.querySelector('.trend-bar');
      var pct = (totals[i] / maxTotal) * 100;
      if (bar) bar.style.setProperty('--bar-height', pct + '%');
      col.classList.toggle('active', i === monthIndex);
    });
  }

  // Event listeners for month tabs
  document.querySelectorAll('.month-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      updateDashboard(parseInt(tab.dataset.month));
    });
  });

  // Event listeners for trend column clicks
  document.querySelectorAll('.trend-col').forEach(function (col) {
    col.addEventListener('click', function () {
      updateDashboard(parseInt(col.dataset.month));
    });
  });

  // Initialize with March (index 5)
  updateDashboard(5);
})();
