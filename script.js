// Numerology Destiny Calculator - Vedic Grid + Destiny/Basic + Dasha/Antardasha
// Theme: Shadow Green & Mint Green (matches styles.css)

class NumerologyCalculator {
  constructor() {
    this.form = document.getElementById('numerologyForm');
    this.resultsSection = document.getElementById('resultsSection');
    this.gridSection = document.getElementById('gridSection');
    this.navigationSection = document.getElementById('navigationSection');

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

    // Button ripple effect
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
    console.log("Form submission event triggered");

    try {
      const fullName = (document.getElementById('fullName').value || '').trim();
      const birthDate = document.getElementById('birthDate').value;

      if (!birthDate) {
        alert('Please enter your birth date');
        return;
      }

      const [year, month, day] = birthDate.split('-').map(Number);

      // Calculate numbers
      const basic = this.basicNumber(day);
      const destiny = this.destinyNumber(day, month, year);

      console.log(`Basic Number: ${basic}, Destiny Number: ${destiny}`);
      
      // Store user data in localStorage for chart access
      const userData = {
        fullName: fullName,
        birthDate: birthDate,
        basicNumber: basic,
        destinyNumber: destiny,
        day: day,
        month: month,
        year: year
      };
      localStorage.setItem('numerologyData', JSON.stringify(userData));
      
      // Update number cards
      this.updateNumberCards(basic, destiny);

      // Calculate Dasha & Antardasha first
      this.calculateAndRenderDasha(basic, new Date(year, month - 1, day));

      // Render Vedic grid with dasha numbers
      this.renderVedicGrid({ day, month, year, basic, destiny });

      // Update detailed analysis
      this.updateDetailedAnalysis(basic, destiny);

      // Show sections
      this.gridSection.style.display = 'block';
      this.resultsSection.style.display = 'block';
      this.navigationSection.style.display = 'block';
      this.resultsSection.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error("Error during form submission:", error);
      alert("An error occurred while calculating. Please check your inputs.");
    }
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

    // Exclude year's century number, only use last two digits
    const yearStr = year.toString();
    const yearLastTwo = yearStr.slice(-2);
    
    const digits = [
      ...day.toString().split(''),
      ...month.toString().split(''),
      ...yearLastTwo.split('')
    ].map(Number).filter(n => n >= 1 && n <= 9);

    const counts = { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 };
    digits.forEach(n => counts[n]++);

    // Add Destiny as extra occurrence
    counts[destiny] = (counts[destiny] || 0) + 1;

    // Add Basic number only if date is NOT 1-9, 10, 20, or 30
    const specialDates = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30];
    if (!specialDates.includes(day)) {
      counts[basic] = (counts[basic] || 0) + 1;
    }

    // Render digits in grid
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

    // Add Mahadasha and Antardasha numbers to the grid
    if (this._currentDasha && this._currentAntardasha) {
      const mahadashaCellIndex = this.vedicMap[this._currentDasha];
      const antardashaCellIndex = this.vedicMap[this._currentAntardasha];
      
      // Add Mahadasha number (dark chestnut color)
      const mahadashaChip = document.createElement('span');
      mahadashaChip.style.color = '#ff0000ff';
      mahadashaChip.className = 'mahadasha-chip';
      mahadashaChip.textContent = this._currentDasha.toString();
      document.getElementById(`cell${mahadashaCellIndex}`).appendChild(mahadashaChip);
      
      // Add Antardasha number (teal color)
      // Add Antardasha number (bronze orange color)
      const antardashaChip = document.createElement('span');
      antardashaChip.style.color = '#ff03dd'; // Set color to bronze orange
      antardashaChip.className = 'antardasha-chip';
      antardashaChip.textContent = this._currentAntardasha.toString();
      document.getElementById(`cell${antardashaCellIndex}`).appendChild(antardashaChip);
    }
  }

  // --- Dasha / Antardasha ---

  calculateAndRenderDasha(basic, birthDateObj) {
    const today = new Date();
    
    // Planetary periods in years
    const planetaryPeriods = {
      1: 1,  // Sun - 1 year
      2: 2,  // Moon - 2 years
      3: 3,  // Jupiter - 3 years
      4: 4,  // Rahu - 4 years
      5: 5,  // Mercury - 5 years
      6: 6,  // Venus - 6 years
      7: 7,  // Ketu - 7 years
      8: 8,  // Saturn - 8 years
      9: 9   // Mars - 9 years
    };

    // Calculate total years since birth
    const years = this.diffInYears(birthDateObj, today);
    
    // Calculate current mahadasha based on planetary sequence
    let currentYear = 0;
    let currentDasha = basic;
    let dashaStartYear = 0;
    
    // Find which dasha we're currently in
    while (currentYear <= years) {
      const period = planetaryPeriods[currentDasha];
      if (currentYear + period > years) {
        dashaStartYear = currentYear;
        break;
      }
      currentYear += period;
      currentDasha = (currentDasha % 9) + 1;
    }

    // Calculate antardasha using the specified formula
    const getDayNumber = (date) => {
      const dayMap = {
        0: 1,  // Sunday
        1: 2,  // Monday
        2: 9,  // Tuesday
        3: 5,  // Wednesday
        4: 3,  // Thursday
        5: 6,  // Friday
        6: 8   // Saturday
      };
      return dayMap[date.getDay()];
    };

    const calculateAntardasha = (birthDate, targetYear) => {
      const [day, month, year] = [
        birthDate.getDate(),
        birthDate.getMonth() + 1,
        birthDate.getFullYear()
      ];
      
      // Get last two digits of the target year
      const lastTwoDigits = targetYear % 100;
      
      // Get birthday date in target year
      const targetBirthday = new Date(targetYear, birthDate.getMonth(), birthDate.getDate());
      const dayNumber = getDayNumber(targetBirthday);
      
      // Formula: (date + month) + last two digits of target year + day number
      const sum = (day + month) + lastTwoDigits + dayNumber;
      return this.digitalRoot(sum);
    };

    const lastBirthday = new Date(birthDateObj.getFullYear() + this.diffInYears(birthDateObj, today), 
                                   birthDateObj.getMonth(), 
                                   birthDateObj.getDate());
    const currentAntardasha = calculateAntardasha(birthDateObj, lastBirthday.getFullYear());

    // Calculate dasha dates
    const dashaStart = new Date(birthDateObj.getFullYear() + dashaStartYear, 
                               birthDateObj.getMonth(), 
                               birthDateObj.getDate());
    const dashaEnd = new Date(dashaStart.getFullYear() + planetaryPeriods[currentDasha], 
                             dashaStart.getMonth(), 
                             dashaStart.getDate());

    // Calculate progress within current dasha
    const progress = Math.min(
      Math.max((today - dashaStart) / (dashaEnd - dashaStart), 0),
      1
    );

    // Render dasha information
    document.getElementById('currentDasha').textContent =
      `${currentDasha} - ${this.dashaNames[currentDasha]} (${planetaryPeriods[currentDasha]} years)`;
    document.getElementById('dashaDescription').textContent =
      this.dashaDescriptions[currentDasha];

    const startStr = this.formatDate(dashaStart);
    const endStr = this.formatDate(dashaEnd);
    document.getElementById('dashaStart').textContent = startStr;
    document.getElementById('dashaEnd').textContent = endStr;

    const bar = document.getElementById('dashaProgress');
    if (bar) bar.style.width = `${Math.round(progress * 100)}%`;

    document.getElementById('currentAntardasha').textContent =
      `${currentAntardasha} - ${this.dashaNames[currentAntardasha]}`;
    document.getElementById('antardashaDescription').textContent =
      this.dashaDescriptions[currentAntardasha];

    this._currentDasha = currentDasha;
    this._currentAntardasha = currentAntardasha;
  }

  diffInYears(start, end) {
    let years = end.getFullYear() - start.getFullYear();
    const m = end.getMonth() - start.getMonth();
    if (m < 0 || (m === 0 && end.getDate() < start.getDate())) years--;
    return years;
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

    const rec = this.getRecommendationsForDasha(this._currentDasha);

    document.getElementById('lifePathInsights').textContent = lifePath;
    document.getElementById('recommendations').textContent = rec;

    // Update Destiny Number Influence panel
    document.getElementById('destinyNumberInfluence').textContent = destiny;
    this.updateDestinyFeatures(destiny);

    // Update new panels
    this.updateLuckyNumber(destiny);
    this.updateLuckyColor(destiny);
    this.updateZodiacSign(destiny);
    this.updateLuckyDirection(destiny);
  }

  updateDestinyFeatures(destiny) {
    const featuresMap = {
      1: [
        'Confident',
        'Great Leadership Quality',
        'Very Good Management',
        'Authoritative',
        'Dominating',
        'Name & Fame',
        'Egoistic',
        'Short-Tempered',
        'Stubborn',
        'Always Motivated & Motivating Others',
        'Business Number'
      ],
      2: [
        'Sentimental',
        'Need Continuous Push',
        'Traditional Fashion',
        'Image Conscious',
        'Attractive',
        'Creative',
        'Emotional',
        'Possessive',
        "Can't deal with stress",
        'Needs Sharing',
        'Motherly Instinct',
        'Suicidal Tendencies'
      ],
      3: [
        'Wisdom',
        'Leader',
        'Need Motivation',
        'Confidence',
        'Disciplined',
        'Attaches to Family',
        'High Moral Value',
        'Spiritual People',
        'Excellent Management Skills',
        'Decision With Consent',
        'No to Temptation/Addiction',
        'Justice Lover',
        'Basic: Attached to Family',
        'Destiny: Attached to Current Family'
      ],
      4: [
        'Travels Lot',
        'Unfruitful Travelling',
        'Spends lot of money on Unnecessary things',
        'Expensive',
        'Spending Thrift',
        'Execution is Bad by Default',
        "Can't keep Promises, though intents rightly",
        'Love to Explore Party Lovers',
        'Researchers',
        'Risk Takers',
        'Stays away from Birth Place',
        'Destiny: Electronic Items frequent breakdown'
      ],
      5: [
        'Money Matters: Very',
        'Calculative',
        'Straight Forward',
        'Logical People',
        'Well aware source of Income',
        'Knows where to incur expenses',
        'Finance Mgmt: None can Compete',
        'Mind: always Active in Money Calculations',
        'Born Business Man/Woman'
      ],
      6: [
        'Attractive/Attractive Aura',
        'Attraction Towards Opposite Gender',
        'Harsh Speakers',
        'Fashionable',
        'Brand Cautious/Updated Fashion',
        'Food Lover /Good Cook',
        'Impressed by Show Off & Luxury',
        'Trend Setters',
        'Focus on Love, Materialistic World & Outer Beauty'
      ],
      7: [
        'Useful Travels',
        'Positivity & Luck in Life',
        'Work Easily Done',
        'Spiritual',
        'Logical',
        'Demands & Gives Explanation with Logic',
        'Stability',
        'Deep Thinkers'
      ],
      8: [
        'Hard Work in each every Field of Life',
        'Easily Gets Disappointment',
        'Spiritual & God Believer',
        'Soft Hearted',
        'Justice Believer & Lover',
        "Can't see one crying",
        'Egoistic',
        'Ambitious',
        "Workaholic: Can't sit idle Else Depressed"
      ],
      9: [
        'Courageous',
        'Stubborn',
        'Confident',
        'Sensible',
        'Bold',
        'Active',
        'Very Fast Action',
        'Easily Pumpable',
        'Argument Attire'
      ]
    };

    const featuresList = document.getElementById('destinyFeatures');
    featuresList.innerHTML = '';
    
    const features = featuresMap[destiny] || [];
    features.forEach(feature => {
      const li = document.createElement('li');
      li.textContent = feature;
      featuresList.appendChild(li);
    });
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

  // --- New Panel Methods ---

  updateLuckyNumber(destiny) {
    // Lucky number is calculated as (destiny + 1) % 9, ensuring it's never 0
    const lucky = ((destiny + 1) % 9) || 9;
    this.animateNumber('luckyNumber', 0, lucky, 800);
    document.getElementById('luckyNumberDescription').textContent = 
      `Your personal lucky number ${lucky} brings harmony and positive vibrations.`;
  }

  updateLuckyColor(destiny) {
    const colorMap = {
      1: { name: 'Ruby Red', hex: '#E0115F' },
      2: { name: 'Pearl White', hex: '#F8F8FF' },
      3: { name: 'Yellow Sapphire', hex: '#FFD700' },
      4: { name: 'Hessonite', hex: '#8B4513' },
      5: { name: 'Emerald Green', hex: '#50C878' },
      6: { name: 'Diamond White', hex: '#FFFFFF' },
      7: { name: 'Cat\'s Eye', hex: '#8A2BE2' },
      8: { name: 'Blue Sapphire', hex: '#0000FF' },
      9: { name: 'Coral Red', hex: '#FF7F50' }
    };
    
    const color = colorMap[destiny] || { name: 'Unknown', hex: '#CCCCCC' };
    const colorDisplay = document.getElementById('luckyColor');
    const colorName = document.getElementById('luckyColorName');
    
    colorDisplay.style.backgroundColor = color.hex;
    colorName.textContent = color.name;
    document.getElementById('luckyColorDescription').textContent = 
      `${color.name} enhances your numerological vibrations and brings prosperity.`;
  }

  updateZodiacSign(destiny) {
    const planetMap = {
      1: 'Sun',
      2: 'Moon', 
      3: 'Jupiter',
      4: 'Rahu',
      5: 'Mercury',
      6: 'Venus',
      7: 'Ketu',
      8: 'Saturn',
      9: 'Mars'
    };
    
    // Handle undefined destiny number
    if (!destiny || destiny < 1 || destiny > 9) {
      document.getElementById('zodiacSign').textContent = 'Loading...';
      document.getElementById('zodiacDescription').textContent = 'Calculating...';
      return;
    }
    
    const planet = planetMap[destiny];
    document.getElementById('zodiacSign').textContent = planet;
    document.getElementById('zodiacDescription').textContent = 
      `${planet} is the ruling planet for destiny number ${destiny}, influencing your core characteristics and life path.`;
  }

  updateLuckyDirection(destiny) {
    const directionMap = {
      1: 'East',
      2: 'North-West',
      3: 'North-East',
      4: 'South-West',
      5: 'North',
      6: 'South-East',
      7: 'West',
      8: 'South',
      9: 'North-East'
    };
    
    const direction = directionMap[destiny] || 'East';
    document.getElementById('luckyDirection').textContent = direction;
    document.getElementById('luckyDirectionDescription').textContent = 
      `Face ${direction} direction for success and positive energy flow.`;
  }

  // --- Animations ---

  animateNumber(elementId, start, end, duration) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
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
