// Numerology Calculator — Vedic Grid + Destiny/Basic + Dasha/Antardasha
// Theme: Shadow Green & Mint Green (matches styles.css)

class NumerologyCalculator {
  constructor() {
    this.form = document.getElementById('numerologyForm');
    this.resultsSection = document.getElementById('resultsSection');
    this.gridSection = document.getElementById('gridSection');

    // IDs used in the DOM
    this.ids = {
      basicNumber: 'basicNumber',
      destinyNumber: 'destinyNumber',
      currentDasha: 'currentDasha',
      dashaDescription: 'dashaDescription',
      dashaTimeline: 'dashaTimeline',
      dashaProgress: 'dashaProgress',
      dashaStart: 'dashaStart',
      dashaEnd: 'dashaEnd',
      currentAntardasha: 'currentAntardasha',
      antardashaDescription: 'antardashaDescription',
      lifePathInsights: 'lifePathInsights',
      periodInfluence: 'periodInfluence',
      recommendations: 'recommendations',
    };

    // Vedic mapping (number -> grid cell index)
    // Grid cells are row-major: cell1..cell9
    // Layout:
    // Row1: [3, 1, 6]
    // Row2: [9, 7, 5]
    // Row3: [2, 8, 4]
    this.vedicMap = { 1: 2, 2: 7, 3: 1, 4: 9, 5: 6, 6: 4, 7: 5, 8: 8, 9: 3 };

    this.dashaNames = {
      1: 'Sun', 2: 'Moon', 3: 'Jupiter', 4: 'Rahu', 5: 'Mercury',
      6: 'Venus', 7: 'Ketu', 8: 'Saturn', 9: 'Mars'
    };
    this.dashaDescriptions = {
      1: 'Leadership, authority, and self-confidence.',
      2: 'Emotions, intuition, and nurturing.',
      3: 'Wisdom, expansion, and good fortune.',
      4: 'Unexpected events and transformation.',
      5: 'Communication, intellect, and business.',
      6: 'Love, beauty, and luxury.',
      7: 'Spirituality and detachment.',
      8: 'Discipline, hard work, and karma.',
      9: 'Energy, courage, and action.'
    };

    this.initializeEventListeners();
  }

  initializeEventListeners() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Button ripple
    const btn = document.getElementById('calculateBtn');
    if (btn) {
      btn.addEventListener('click', function (e) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        const rect = this.getBoundingClientRect();
        ripple.style.left = `${e.clientX - rect.left}px`;
        ripple.style.top = `${e.clientY - rect.top}px`;
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });
    }
  }

  handleSubmit(e) {
    e.preventDefault();

    const fullName = (document.getElementById('fullName').value || '').trim();
    const birthDate = document.getElementById('birthDate').value; // yyyy-mm-dd

    if (!birthDate) {
      alert('Please enter your birth date');
      return;
    }

    const [year, month, day] = birthDate.split('-').map(Number);

    // Numbers
    const basic = this.basicNumber(day);
    const destiny = this.destinyNumber(day, month, year);

    // Render numbers
    this.updateNumberCards(basic, destiny);

    // Grid: stack all DOB digits + basic + destiny
    this.renderVedicGrid({ day, month, year, basic, destiny });

    // Dasha & Antardasha
    this.calculateAndRenderDasha(basic, new Date(year, month - 1, day));

    // Detailed analysis
    this.updateDetailedAnalysis(basic, destiny);

    // Show sections
    this.gridSection.style.display = 'block';
    this.resultsSection.style.display = 'block';
    this.resultsSection.scrollIntoView({ behavior: 'smooth' });
  }

  // --- Numerology helpers ---

  // Digital root 1..9 (0 becomes 9)
  digitalRoot(n) {
    n = Math.abs(Number(n) || 0);
    const r = n % 9;
    return r === 0 ? 9 : r;
  }

  // Basic Number = digital root of day
  basicNumber(day) {
    return this.digitalRoot(day);
  }

  // Destiny Number = digital root of (sum of all digits in DD/MM/YYYY)
  destinyNumber(day, month, year) {
    const sumDigits = (num) => num.toString().split('').reduce((a, d) => a + Number(d), 0);
    const total = sumDigits(day) + sumDigits(month) + sumDigits(year);
    return this.digitalRoot(total);
  }

  // --- Grid rendering ---

  renderVedicGrid({ day, month, year, basic, destiny }) {
    // Clear cells
    for (let i = 1; i <= 9; i++) {
      const el = document.getElementById(`cell${i}`);
      if (el) el.innerHTML = '';
    }

    // Build counts for 1..9 from DOB digits (ignore 0)
    const digits = [
      ...day.toString().split(''),
      ...month.toString().split(''),
      ...year.toString().split('')
    ].map(Number).filter(n => n >= 1 && n <= 9);

    const counts = { 1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0 };
    digits.forEach(n => counts[n]++);

    // Add Basic and Destiny as extra occurrences
    counts[basic] = (counts[basic] || 0) + 1;
    counts[destiny] = (counts[destiny] || 0) + 1;

    // Place into grid using vedicMap
    for (let n = 1; n <= 9; n++) {
      const cellIndex = this.vedicMap[n];
      const cell = document.getElementById(`cell${cellIndex}`);
      const repeats = counts[n] || 0;

      for (let i = 0; i < repeats; i++) {
        const chip = document.createElement('span');
        chip.className = 'digit-chip';
        chip.textContent = n.toString();
        cell.appendChild(chip);
      }
    }
  }

  // --- Dasha / Antardasha ---

  // 9-year cycle, each dasha = 1 year. Sequence advances yearly from Basic number.
  calculateAndRenderDasha(basic, birthDateObj) {
    const today = new Date();
    const years = this.diffInYears(birthDateObj, today);
    const months = this.diffInMonths(birthDateObj, today);

    const currentDasha = ((basic - 1 + years) % 9) + 1;

    // Antardasha: sub-cycle by month, starting from current dasha
    const currentAntardasha = ((basic - 1 + months) % 9) + 1;

    // Dates: current dasha spans one year from the last birthday + years offset
    const dashaStart = new Date(birthDateObj.getFullYear() + years, birthDateObj.getMonth(), birthDateObj.getDate());
    const dashaEnd = new Date(dashaStart.getFullYear() + 1, dashaStart.getMonth(), dashaStart.getDate());

    // Progress within current dasha year (0..1)
    const progress = Math.min(
      Math.max((today - dashaStart) / (dashaEnd - dashaStart), 0),
      1
    );

    // Render
    document.getElementById(this.ids.currentDasha).textContent =
      `${currentDasha} - ${this.dashaNames[currentDasha]}`;
    document.getElementById(this.ids.dashaDescription).textContent =
      this.dashaDescriptions[currentDasha];

    const startStr = this.formatDate(dashaStart);
    const endStr = this.formatDate(dashaEnd);
    document.getElementById(this.ids.dashaStart).textContent = startStr;
    document.getElementById(this.ids.dashaEnd).textContent = endStr;

    const bar = document.getElementById(this.ids.dashaProgress);
    bar.style.width = `${Math.round(progress * 100)}%`;

    document.getElementById(this.ids.currentAntardasha).textContent =
      `${currentAntardasha} - ${this.dashaNames[currentAntardasha]}`;
    document.getElementById(this.ids.antardashaDescription).textContent =
      this.dashaDescriptions[currentAntardasha];

    // Store for insights
    this._currentDasha = currentDasha;
    this._currentAntardasha = currentAntardasha;
  }

  diffInYears(start, end) {
    let years = end.getFullYear() - start.getFullYear();
    const m = end.getMonth() - start.getMonth();
    if (m < 0 || (m === 0 && end.getDate() < start.getDate())) years--;
    return years;
    }

  diffInMonths(start, end) {
    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (end.getDate() < start.getDate()) months -= 1; // not completed the month yet
    return Math.max(months, 0);
  }

  formatDate(d) {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // --- Cards & Analysis ---

  updateNumberCards(basic, destiny) {
    this.animateNumber('basicNumber', 0, basic, 800);
    this.animateNumber('destinyNumber', 0, destiny, 800);

    document.getElementById('basicDescription').textContent = this.getBasicDescription(basic);
    document.getElementById('destinyDescription').textContent = this.getDestinyDescription(destiny);
  }

  updateDetailedAnalysis(basic, destiny) {
    const lifePath = (basic === destiny)
      ? `Your destiny number ${destiny} aligns closely with your basic number ${basic}, indicating harmony between your core nature and life direction.`
      : `Your destiny number ${destiny} contrasts with your basic number ${basic}, suggesting growth through balancing core tendencies with life lessons.`;

    const dashaInfo = `${this.dashaNames[this._currentDasha]} dasha highlights: ${this.dashaDescriptions[this._currentDasha]}`;
    const rec = this.getRecommendationsForDasha(this._currentDasha);

    document.getElementById(this.ids.lifePathInsights).textContent = lifePath;
    document.getElementById(this.ids.periodInfluence).textContent = dashaInfo;
    document.getElementById(this.ids.recommendations).textContent = rec;
  }

  getDestinyDescription(n) {
    const map = {
      1:'You are a natural leader with strong individuality and pioneering spirit.',
      2:'You possess diplomatic skills and work well in partnerships.',
      3:'You are creative, expressive, and blessed with good fortune.',
      4:'You are practical, systematic, and build solid foundations.',
      5:'You crave freedom, adventure, and embrace change.',
      6:'You are nurturing, responsible, and value harmony.',
      7:'You are analytical, spiritual, and seek deeper truths.',
      8:'You are ambitious, business-minded, and achieve material success.',
      9:'You are humanitarian, compassionate, and serve others.'
    };
    return map[n] || '';
  }

  getBasicDescription(n) {
    const map = {
      1:'Independent, original, and innovative.',
      2:'Cooperative, sensitive, and diplomatic.',
      3:'Optimistic, creative, and expressive.',
      4:'Practical, reliable, and hardworking.',
      5:'Adaptable, versatile, and freedom-loving.',
      6:'Responsible, caring, and artistic.',
      7:'Analytical, thoughtful, and spiritual.',
      8:'Ambitious, authoritative, and successful.',
      9:'Compassionate, generous, and idealistic.'
    };
    return map[n] || '';
  }

  getRecommendationsForDasha(dasha) {
    const rec = {
      1:'Take leadership roles and start new ventures.',
      2:'Focus on relationships and emotional well-being.',
      3:'Pursue creative projects and educational opportunities.',
      4:'Build stable foundations and be prepared for changes.',
      5:'Embrace flexibility and explore new experiences.',
      6:'Focus on family, home, and creative pursuits.',
      7:'Engage in spiritual practices and introspection.',
      8:'Work hard towards career and financial goals.',
      9:'Serve others and engage in humanitarian activities.'
    };
    return rec[dasha] || '';
  }

  // --- Animations ---

  animateNumber(elementId, start, end, duration) {
    const el = document.getElementById(elementId);
    const startTime = performance.now();
    const step = (t) => {
      const p = Math.min((t - startTime) / duration, 1);
      const val = Math.floor(start + (end - start) * p);
      el.textContent = val;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new NumerologyCalculator();
});
