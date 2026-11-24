/* ═══════════════════════════════════════════
   PM-OS PORTFOLIO — script.js
   Full OS Desktop Experience
═══════════════════════════════════════════ */

'use strict';

// ── Global State ─────────────────────────
let zTop = 100;
const openWindows = {}; // id → { el, minimized }
const isMaximized = {};
const cmdHistory  = [];
let   histIdx     = -1;

// ── App Definitions ───────────────────────
const APPS = {
  about: {
    title: '👤  About.exe',
    icon:  '👤',
    w: 480, h: 480,
    build: buildAbout
  },
  projects: {
    title: '🗂️  Projects/',
    icon:  '🗂️',
    w: 700, h: 560,
    build: buildProjects
  },
  experience: {
    title: '💼  Experience/',
    icon:  '💼',
    w: 660, h: 570,
    build: buildExperience
  },
  skills: {
    title: '⚡  Skills.json',
    icon:  '⚡',
    w: 520, h: 490,
    build: buildSkills
  },
  education: {
    title: '🎓  Education.log',
    icon:  '🎓',
    w: 540, h: 400,
    build: buildEducation
  },
  achievements: {
    title: '🏆  Awards/',
    icon:  '🏆',
    w: 580, h: 530,
    build: buildAchievements
  },
  contact: {
    title: '📡  Contact.sh',
    icon:  '📡',
    w: 480, h: 430,
    build: buildContact
  },
  resume: {
    title: '📄  Resume.exe — Prakhar Mishra',
    icon:  '📄',
    w: 720, h: 600,
    build: buildResume
  },
  settings: {
    title: '⚙️  Settings.exe — Preferences',
    icon:  '⚙️',
    w: 520, h: 500,
    build: buildSettings
  },
  player: {
    title: '🎵  Player.exe — Lo-Fi Synth',
    icon:  '🎵',
    w: 460, h: 440,
    build: buildPlayer
  },
  snake: {
    title: '🐍  Snake.exe — Retro Arcade',
    icon:  '🐍',
    w: 420, h: 510,
    build: buildSnake
  },
  ai: {
    title: '🤖  PM-Bot.exe — Ask Prakhar AI',
    icon:  '🤖',
    w: 540, h: 520,
    build: buildAI
  },
  terminal: {
    title: '⌨️  Terminal — PM-OS',
    icon:  '⌨️',
    w: 660, h: 460,
    isTerminal: true,
    build: buildTerminal
  }
};

// ════════════════════════════════
// WINDOW MANAGEMENT
// ════════════════════════════════

function openApp(id) {
  const app = APPS[id];
  if (!app) return;

  // If already open — restore / focus
  if (openWindows[id]) {
    const w = openWindows[id];
    if (w.minimized) {
      w.el.style.display = 'flex';
      w.minimized = false;
      const btn = document.getElementById('tbb-' + id);
      if (btn) btn.classList.add('active');
    }
    focusWin(id);
    return;
  }

  // Compute size
  const ww = Math.min(app.w, window.innerWidth  - 120);
  const wh = Math.min(app.h, window.innerHeight - 80);

  // Cascade position
  const cascade = Object.keys(openWindows).length;
  const baseL = Math.max(110, (window.innerWidth  - ww) / 2 + cascade * 26);
  const baseT = Math.max(14,  (window.innerHeight - wh) / 2 + cascade * 26 - 40);
  const winL  = Math.min(baseL, window.innerWidth  - ww - 14);
  const winT  = Math.min(baseT, window.innerHeight - wh - 56);

  // Build DOM
  const win = document.createElement('div');
  win.className = 'os-window';
  win.id = 'win-' + id;
  Object.assign(win.style, {
    width:  ww + 'px',
    height: wh + 'px',
    left:   winL + 'px',
    top:    winT + 'px',
    zIndex: ++zTop
  });

  const bodyStyle = app.isTerminal
    ? 'padding:0;overflow:hidden;display:flex;flex-direction:column;'
    : '';

  win.innerHTML = `
    <div class="win-titlebar">
      <div class="win-controls">
        <button class="win-btn close"    title="Close"    onclick="closeWin('${id}')"></button>
        <button class="win-btn minimize" title="Minimize" onclick="minimizeWin('${id}')"></button>
        <button class="win-btn maximize" title="Maximize" onclick="toggleMax('${id}')"></button>
      </div>
      <div class="win-title">${app.title}</div>
      <div style="width:43px;flex-shrink:0;"></div>
    </div>
    <div class="win-body" style="${bodyStyle}">
      ${app.build()}
    </div>`;

  document.getElementById('win-layer').appendChild(win);
  openWindows[id] = { el: win, minimized: false };

  makeDraggable(win, id);
  addTbBtn(id, app);
  focusWin(id);

  if (app.isTerminal) setTimeout(() => initTerminal(), 60);
  if (id === 'snake') setTimeout(() => initSnake(), 60);
  if (id === 'player') setTimeout(() => initPlayer(), 60);
  if (id === 'ai') setTimeout(() => initAI(), 60);
  playSound('open');

  // Entrance animation
  win.style.opacity   = '0';
  win.style.transform = 'scale(0.93) translateY(10px)';
  win.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    win.style.opacity   = '1';
    win.style.transform = 'scale(1) translateY(0)';
  }));
}

function closeWin(id) {
  const w = openWindows[id];
  if (!w) return;
  playSound('close');
  const el = w.el;
  el.style.transition = 'opacity 0.14s ease, transform 0.14s ease';
  el.style.opacity    = '0';
  el.style.transform  = 'scale(0.93) translateY(8px)';
  setTimeout(() => {
    el.remove();
    delete openWindows[id];
    delete isMaximized[id];
    removeTbBtn(id);
  }, 145);
}

function minimizeWin(id) {
  const w = openWindows[id];
  if (!w) return;
  w.el.style.display = 'none';
  w.minimized = true;
  const btn = document.getElementById('tbb-' + id);
  if (btn) btn.classList.remove('active');
}

function toggleMax(id) {
  const w = openWindows[id];
  if (!w) return;
  const el = w.el;
  if (!isMaximized[id]) {
    el._prev = { left: el.style.left, top: el.style.top, width: el.style.width, height: el.style.height, borderRadius: el.style.borderRadius };
    Object.assign(el.style, { left: '0', top: '0', width: '100vw', height: 'calc(100vh - 48px)', borderRadius: '0' });
    isMaximized[id] = true;
  } else {
    Object.assign(el.style, el._prev);
    isMaximized[id] = false;
  }
}

function focusWin(id) {
  document.querySelectorAll('.os-window').forEach(w => w.classList.remove('focused'));
  document.querySelectorAll('.tb-app-btn').forEach(b => b.classList.remove('active'));
  const w = openWindows[id];
  if (!w) return;
  w.el.style.zIndex = ++zTop;
  w.el.classList.add('focused');
  const btn = document.getElementById('tbb-' + id);
  if (btn) btn.classList.add('active');
}

function makeDraggable(win, id) {
  const tb = win.querySelector('.win-titlebar');
  let dragging = false, sx, sy, sl, st;

  tb.addEventListener('mousedown', e => {
    if (e.target.closest('.win-controls') || isMaximized[id]) return;
    dragging = true;
    sx = e.clientX; sy = e.clientY;
    sl = win.offsetLeft; st = win.offsetTop;
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp,   { once: true });
    focusWin(id);
  });

  win.addEventListener('mousedown', () => focusWin(id));

  function onMove(e) {
    if (!dragging) return;
    const maxL = window.innerWidth  - win.offsetWidth;
    const maxT = window.innerHeight - win.offsetHeight - 48;
    win.style.left = Math.max(0, Math.min(maxL, sl + e.clientX - sx)) + 'px';
    win.style.top  = Math.max(0, Math.min(maxT, st + e.clientY - sy)) + 'px';
  }

  function onUp() {
    dragging = false;
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', onMove);
  }
}

// ── Taskbar buttons ───────────────────────
function addTbBtn(id, app) {
  const btn = document.createElement('button');
  btn.className = 'tb-app-btn active';
  btn.id = 'tbb-' + id;
  // Strip emoji for label (keep first emoji + short name)
  const label = app.title.replace(/\s+\/\/.*/, '').trim();
  btn.innerHTML = label;
  btn.title = app.title;
  btn.onclick = () => {
    const w = openWindows[id];
    if (!w) return;
    if (w.minimized) {
      w.el.style.display = 'flex';
      w.minimized = false;
      btn.classList.add('active');
      focusWin(id);
    } else if (w.el.classList.contains('focused')) {
      minimizeWin(id);
    } else {
      focusWin(id);
    }
  };
  document.getElementById('tb-apps').appendChild(btn);
}

function removeTbBtn(id) {
  const btn = document.getElementById('tbb-' + id);
  if (btn) btn.remove();
}

function closeAllWins() {
  [...Object.keys(openWindows)].forEach(id => closeWin(id));
  hideCtx();
}

// ════════════════════════════════
// CONTENT BUILDERS
// ════════════════════════════════

function buildAbout() {
  return `
    <div class="about-avatar">PM</div>
    <div class="about-name">Prakhar Mishra</div>
    <div class="about-role">Full Stack Developer &amp; AI Enthusiast</div>
    <div class="about-bio">
      B.Tech CSE student at LPU (CGPA 8.12) passionate about building AI-powered full-stack products.
      Interned at Infosys &amp; UpStride. 250+ DSA problems solved. Always learning, always shipping.
    </div>
    <div class="open-badge"><span class="dot-green"></span>Open to Internships &amp; Opportunities</div>
    <div class="about-links">
      <a class="about-link" href="mailto:prakharm1903@gmail.com">
        <span class="link-icon">📧</span><span>prakharm1903@gmail.com</span>
      </a>
      <a class="about-link" href="https://linkedin.com/in/prakharm1903" target="_blank" rel="noopener">
        <span class="link-icon">🔗</span><span>linkedin.com/in/prakharm1903</span>
      </a>
      <a class="about-link" href="https://github.com/Prakhar1903" target="_blank" rel="noopener">
        <span class="link-icon">⚡</span><span>github.com/Prakhar1903</span>
      </a>
      <a class="about-link" href="tel:+917869691849">
        <span class="link-icon">📱</span><span>+91 7869691849</span>
      </a>
    </div>`;
}

function buildProjects() {
  const tags = arr => arr.map(t => `<span class="proj-tag">${t}</span>`).join('');
  return `
    <div class="section-hdr">My Projects</div>
    <div class="proj-grid">
      <div class="proj-card">
        <div class="proj-header">
          <div class="proj-name">🌾 KrishiGyan</div>
          <div class="proj-date">Nov '25 – Dec '25</div>
        </div>
        <div class="proj-desc">
          AI-Powered Agricultural Management Platform enabling farmers to access real-time agricultural data.
          <ul>
            <li>Real-time market prices, personalized crop recommendations &amp; AI-powered farming chatbot</li>
            <li>Pest detection via TensorFlow.js &amp; multi-language support for diverse users</li>
            <li>Delivered a responsive, secure, and performance-optimized experience across devices</li>
          </ul>
        </div>
        <div class="proj-footer">
          <div class="proj-stack">${tags(['ReactJS','JavaScript','NodeJS','Express','MongoDB','TailwindCSS','TensorFlow.js','Socket.io'])}</div>
          <div class="proj-links">
            <a class="proj-link gh" href="https://github.com/Prakhar1903/KrishiGyan" target="_blank" rel="noopener">⚡ GitHub</a>
            <a class="proj-link live" href="https://krishi-gyan-five.vercel.app/" target="_blank" rel="noopener">🌐 Live Demo</a>
          </div>
        </div>
      </div>

      <div class="proj-card">
        <div class="proj-header">
          <div class="proj-name">🎤 Mockneto</div>
          <div class="proj-date">Jun '25 – Jul '25</div>
        </div>
        <div class="proj-desc">
          AI Interview Practice Platform for simulating real-world interviews.
          <ul>
            <li>Real-time voice interaction &amp; smart AI evaluation engine</li>
            <li>Progress tracking dashboard &amp; AI-generated feedback reports</li>
            <li>Responsive, interactive, and performance-optimized experience across devices</li>
          </ul>
        </div>
        <div class="proj-footer">
          <div class="proj-stack">${tags(['ReactJS','JavaScript','NodeJS','Express','Bootstrap','MongoDB'])}</div>
          <div class="proj-links">
            <a class="proj-link gh" href="https://github.com/Prakhar1903/MOCKNETO" target="_blank" rel="noopener">⚡ GitHub</a>
          </div>
        </div>
      </div>

      <div class="proj-card">
        <div class="proj-header">
          <div class="proj-name">🏋️ VirtuGym</div>
          <div class="proj-date">May '26 – Jun '26</div>
        </div>
        <div class="proj-desc">
          Full-Stack Virtual Fitness Management &amp; Training Platform connecting trainees, trainers, and administrators.
          <ul>
            <li>Role-based dashboards (Trainee, Trainer, Admin) with comprehensive workout &amp; activity tracking</li>
            <li>Real-time trainer session booking, custom session notes &amp; integrated payment workflows</li>
            <li>Dynamic exercise repositories, progress analytics, and interactive video call integration</li>
          </ul>
        </div>
        <div class="proj-footer">
          <div class="proj-stack">${tags(['Laravel','PHP','MySQL','MongoDB','Blade','TailwindCSS','JavaScript','Docker'])}</div>
          <div class="proj-links">
            <a class="proj-link gh" href="https://github.com/Prakhar1903/Virtugym" target="_blank" rel="noopener">⚡ GitHub</a>
            <a class="proj-link live" href="https://virtugym.onrender.com/" target="_blank" rel="noopener">🌐 Live Demo</a>
          </div>
        </div>
      </div>

      <div class="proj-card">
        <div class="proj-header">
          <div class="proj-name">🏛️ CivicResolver</div>
          <div class="proj-date">May '26 – Jun '26</div>
        </div>
        <div class="proj-desc">
          Full-Stack Citizen Grievance Redressal &amp; Complaint Management Portal with web and Android clients.
          <ul>
            <li>Geo-located complaint filing with interactive Leaflet mapping &amp; Cloudinary media proof uploads</li>
            <li>Real-time citizen-to-admin live messaging &amp; grievance resolution powered by Socket.IO</li>
            <li>Native Android mobile client developed with Kotlin &amp; Jetpack Compose using Retrofit &amp; Location Services</li>
          </ul>
        </div>
        <div class="proj-footer">
          <div class="proj-stack">${tags(['ReactJS','TailwindCSS','NodeJS','Express','MongoDB','Socket.io','Kotlin','Jetpack Compose'])}</div>
          <div class="proj-links">
            <a class="proj-link gh" href="https://github.com/Prakhar1903/CivicResolver" target="_blank" rel="noopener">⚡ GitHub</a>
          </div>
        </div>
      </div>

      <div class="proj-card">
        <div class="proj-header">
          <div class="proj-name">☁️ Scalle (Route 53 Console)</div>
          <div class="proj-date">Aug '25 – Sep '25</div>
        </div>
        <div class="proj-desc">
          High-Performance Cloud DNS Management Console &amp; Authentic AWS Route 53 Clone.
          <ul>
            <li>Pixel-perfect AWS console interface with complete Hosted Zones and DNS record CRUD (A, AAAA, CNAME, TXT, MX, NS, SRV, SOA)</li>
            <li>Advanced DNS routing policy engine supporting Simple, Weighted, Latency, Failover &amp; Geolocation policies</li>
            <li>JWT-authenticated session security with HTTP-only cookies and ultra-fast persistence via SQLite &amp; SQLAlchemy</li>
          </ul>
        </div>
        <div class="proj-footer">
          <div class="proj-stack">${tags(['Next.js 14','TypeScript','FastAPI','Python','SQLite','SQLAlchemy','Zustand','CSS Modules'])}</div>
          <div class="proj-links">
            <a class="proj-link gh" href="https://github.com/Prakhar1903/scalle" target="_blank" rel="noopener">⚡ GitHub</a>
            <a class="proj-link live" href="https://scalle.vercel.app" target="_blank" rel="noopener">🌐 Live Demo</a>
          </div>
        </div>
      </div>
    </div>`;
}

function buildExperience() {
  const tags = arr => arr.map(t => `<span class="tl-tag">${t}</span>`).join('');
  return `
    <div class="section-hdr">Internship Experience</div>
    <div class="timeline">

      <div class="tl-item">
        <div class="tl-header">
          <div>
            <div class="tl-role">AI Web Chatbot Automation (Engage AI)</div>
            <div class="tl-company">UpStride</div>
          </div>
          <div class="tl-date">Apr '26 – Jun '26</div>
        </div>
        <div class="tl-desc">
          <ul>
            <li>Designed &amp; built a full-stack AI customer engagement platform enabling businesses to deploy custom chatbots and manage interactions from a unified dashboard</li>
            <li>Built multi-agent AI layer using CrewAI with specialized agents for support, lead qualification, and real-time sentiment analysis</li>
            <li>Delivered live KPI analytics dashboard with FastAPI, MongoDB &amp; JWT-based authentication</li>
          </ul>
        </div>
        <div class="tl-footer">
          <div class="tl-stack">${tags(['ReactJS','Vite','FastAPI','Python','MongoDB','CrewAI','Recharts','JWT'])}</div>
          <div class="tl-links">
            <a class="tl-link" href="https://github.com/Prakhar1903/6-WeTano-Engage-AI-Fork" target="_blank" rel="noopener" title="GitHub Repository">⚡ GitHub ↗</a>
            <a class="tl-link" href="https://drive.google.com/file/d/1bq5zw9V4U_CzvmvkMqb3yx-un6iTfN-W/view" target="_blank" rel="noopener" title="View UpStride Internship Certificate">📜 Certificate ↗</a>
          </div>
        </div>
      </div>

      <div class="tl-item">
        <div class="tl-header">
          <div>
            <div class="tl-role">Market Trend Forecaster</div>
            <div class="tl-company">Infosys</div>
          </div>
          <div class="tl-date">Feb '26 – Apr '26</div>
        </div>
        <div class="tl-desc">
          <ul>
            <li>Designed and developed a full-stack market intelligence dashboard for real-time consumer sentiment analysis across Amazon, YouTube, News, and Web sources</li>
            <li>Implemented Sentiment War Room, predictive trend forecasting, keyword-driven Sentiment Explorer, and conversational AI chatbot for market queries</li>
            <li>Secure platform with JWT auth, one-click PDF/Excel report exports, and interactive Chart.js visualizations</li>
          </ul>
        </div>
        <div class="tl-footer">
          <div class="tl-stack">${tags(['React 18','Vite','Tailwind CSS','FastAPI','MongoDB','Pandas','Chart.js','Python'])}</div>
          <div class="tl-links">
            <a class="tl-link" href="https://market-trend-forecaster-kappa.vercel.app/" target="_blank" rel="noopener" title="Live Demo">🌐 Live Demo ↗</a>
            <a class="tl-link" href="https://github.com/Prakhar1903/Market-trend-forecaster" target="_blank" rel="noopener" title="GitHub Repository">⚡ GitHub ↗</a>
            <a class="tl-link" href="https://drive.google.com/file/d/1OHF3FJid3omie9fvsmNclrCpMvkwEEDl/view" target="_blank" rel="noopener" title="View Infosys Internship Certificate">📜 Certificate ↗</a>
          </div>
        </div>
      </div>

      <div class="tl-item">
        <div class="tl-header">
          <div>
            <div class="tl-role">Full Stack Web Development Intern</div>
            <div class="tl-company">Webstack Academy (WSA)</div>
          </div>
          <div class="tl-date">Dec '25 – Jan '26</div>
        </div>
        <div class="tl-desc">
          <ul>
            <li>Completed hands-on MERN Stack internship following SDLC approach</li>
            <li>Built &amp; deployed projects with responsive UI using HTML, CSS, and React</li>
            <li>Strengthened core JavaScript &amp; full-stack application development skills</li>
          </ul>
        </div>
        <div class="tl-footer">
          <div class="tl-stack">${tags(['HTML','CSS','JavaScript','React','Node.js','Express','MongoDB'])}</div>
          <div class="tl-links">
            <a class="tl-link" href="https://drive.google.com/file/d/1xyRsRWPFbvVTC5f9AUaQ7oIkEZOoHYBb/view" target="_blank" rel="noopener" title="View WSA Internship Certificate">📜 Certificate ↗</a>
          </div>
        </div>
      </div>

    </div>`;
}

function buildSkills() {
  const tags = (arr, cls) => arr.map(s => `<span class="stag ${cls}">${s}</span>`).join('');
  return `
    <div class="skills-section">
      <div class="skills-label">Languages</div>
      <div class="skill-tags">${tags(['Java', 'C++'], 'lang')}</div>
    </div>
    <div class="skills-section">
      <div class="skills-label">Frameworks &amp; Libraries</div>
      <div class="skill-tags">${tags(['ReactJS','NodeJS','Express','HTML &amp; CSS','Bootstrap','TailwindCSS'], 'fw')}</div>
    </div>
    <div class="skills-section">
      <div class="skills-label">Tools &amp; Platforms</div>
      <div class="skill-tags">${tags(['MySQL','MongoDB','Git','GitHub','Figma','Postman','Vercel'], 'tool')}</div>
    </div>
    <div class="skills-section">
      <div class="skills-label">Core CS Fundamentals</div>
      <div class="skill-tags">${tags(['DBMS','OS','CN','SQL','OOPs'], 'cs')}</div>
    </div>
    <div class="skills-section">
      <div class="skills-label">Soft Skills</div>
      <div class="skill-tags">${tags(['Time Management','Leadership','Problem-Solving','Adaptability','Quick Learner'], 'soft')}</div>
    </div>`;
}

function buildEducation() {
  return `
    <div class="section-hdr">Academic Background</div>
    <div class="edu-card">
      <div class="edu-header">
        <div class="edu-inst">🏛️ Lovely Professional University</div>
        <div class="edu-period">Aug '23 – Present</div>
      </div>
      <div class="edu-degree">Bachelor of Technology — Computer Science &amp; Engineering</div>
      <div class="edu-grade">CGPA: 8.12 / 10.0</div>
      <div class="edu-loc">📍 Phagwara, Punjab</div>
    </div>
    <div class="edu-card">
      <div class="edu-header">
        <div class="edu-inst">📚 Kendriya Vidyalaya Sangathan</div>
        <div class="edu-period">Apr '20 – Mar '21</div>
      </div>
      <div class="edu-degree">Intermediate (Class XII)</div>
      <div class="edu-grade">Percentage: 92%</div>
      <div class="edu-loc">📍 Chhatarpur, Madhya Pradesh</div>
    </div>
    <div class="edu-card">
      <div class="edu-header">
        <div class="edu-inst">📚 Kendriya Vidyalaya Sangathan</div>
        <div class="edu-period">Apr '18 – Mar '19</div>
      </div>
      <div class="edu-degree">Matriculation (Class X)</div>
      <div class="edu-grade">Percentage: 91.2%</div>
      <div class="edu-loc">📍 Chhatarpur, Madhya Pradesh</div>
    </div>`;
}

function buildAchievements() {
  const item = (icon, title, sub, date, linkText, linkUrl) => `
    <div class="ach-item">
      <div class="ach-icon">${icon}</div>
      <div style="flex:1;">
        <div class="ach-title">${title}</div>
        <div class="ach-sub">${sub}</div>
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; margin-top:6px;">
          <div class="ach-date">${date}</div>
          ${linkUrl ? `<a class="ach-link" href="${linkUrl}" target="_blank" rel="noopener">${linkText || 'View Link ↗'}</a>` : ''}
        </div>
      </div>
    </div>`;
  return `
    <div class="section-hdr">Achievements &amp; Activities</div>
    ${item('💻', '250+ DSA Problems Solved', 'Solved across LeetCode, GeeksforGeeks, and HackerRank — demonstrating strong analytical and competitive programming skills.', 'Aug 2024 – Present')}
    ${item('🏅', 'Finalist — Fynd Hacktimus 2025 Hackathon', 'Selected among top students for innovative problem-solving and technical excellence.', 'Dec 2025')}
    ${item('⭐', 'HackerRank 5-Star in C++ &amp; Java', '5-Star rating in C++ and Java · 3-Star rating in Problem Solving, showcasing strong DSA expertise.', 'Oct 2025')}
    ${item('🕹️', 'Code-A-Haunt 24-hour Hackathon', 'Participated in a 24-hour hackathon demonstrating rapid prototyping and problem-solving.', 'Mar 2024', '📜 View Certificate ↗', 'https://drive.google.com/file/d/1vbrDt2jpBZC-ZQSa_1N2Ec7BrqXIRwJt/view?usp=sharing')}
    ${item('🎮', 'Byte-Bash 36-hour Hackathon', 'Participated in a 36-hour team hackathon.', 'Nov 2023')}

    <div class="section-hdr" style="margin-top:24px;">Training &amp; Certifications</div>
    ${item('🤖', 'W3grads – Full Stack (MERN) with Gen AI', 'Built dynamic full-stack web apps using MERN, focusing on RESTful APIs and Gen AI integration.', 'Jun 2025 – Jul 2025', '📜 View Certificate ↗', 'https://drive.google.com/file/d/1F8GePj3npKSL9lcjr31KK_A_gM8X1ETA/view?usp=sharing')}
    ${item('📜', 'Developing Front End Apps with React', 'edX / IBM verified certificate in modern React application development.', 'Oct 2025', '📜 View Certificate ↗', 'https://courses.edx.org/certificates/f33c845091914a7b80feefc764c3340c?_gl=1*1j7kaf4*_gcl_au*NTU4NzQwOTM1LjE3NjE3NTQwMDQ.*_ga*NzM1NTAwNjY0LjE3NjE3NTM5MDI.*_ga_D3KS4KMDT0*czE3NjQyODI4MTckbzYwJGcxJHQxNzY0MjgyOTAzJGozOCRsMCRoMA')}
    ${item('📜', 'Introduction to Web Development with HTML5, CSS3 &amp; JS', 'edX / IBM verified certificate in core web standards and modern frontend architecture.', 'Oct 2025', '📜 View Certificate ↗', 'https://courses.edx.org/certificates/f8f38c6a866645e2b0d1552511088ab0?_gl=1*we4pe8*_gcl_au*NTU4NzQwOTM1LjE3NjE3NTQwMDQ.*_ga*NzM1NTAwNjY0LjE3NjE3NTM5MDI.*_ga_D3KS4KMDT0*czE3NjQyODI4MTckbzYwJGcxJHQxNzY0MjgyOTAzJGozOCRsMCRoMA')}
    ${item('☁️', 'NPTEL — Cloud Computing', 'NPTEL verified e-certificate in comprehensive cloud computing principles and architecture.', 'May 2025', '📜 View Certificate ↗', 'https://nptel.ac.in/noc/E_Certificate/NPTEL25CS11S153730217804245657')}
    ${item('☕', 'Java Programming', 'Examly / Colab verified certification in Object-Oriented Programming and advanced Java development concepts.', 'May 2025', '📜 View Certificate ↗', 'https://lpucolab438.examly.io/certificate/U2FsdGVkX19tiYF4L3qH%2BZHGbY7w%2B2z%2F39RMhSiYPNg%3D')}
    ${item('🧠', 'Data Structures and Algorithms', 'Examly / Colab verified certification in advanced data structures and algorithmic complexity.', 'May 2025', '📜 View Certificate ↗', 'https://lpucolab438.examly.io/certificate/U2FsdGVkX1%2FPVUYUvVAnd9PWjJpf8qp2BkqdZHKMcZ8%3D')}`;
}

function buildContact() {
  return `
    <div class="contact-cli">
      <span style="color:#fff">$</span> ./contact.sh --establish-connection<br>
      <span style="color:#28c840">✓</span> Initializing secure channel...<br>
      <span style="color:#28c840">✓</span> Ready to connect with <span style="color:#00f5ff">Prakhar Mishra</span>
    </div>
    <div class="contact-links">
      <a class="c-link email" href="mailto:prakharm1903@gmail.com">
        <span class="c-link-icon">📧</span>
        <div><div class="c-link-label">prakharm1903@gmail.com</div><div class="c-link-sub">Email — preferred for opportunities</div></div>
      </a>
      <a class="c-link li" href="https://linkedin.com/in/prakharm1903" target="_blank" rel="noopener">
        <span class="c-link-icon">🔗</span>
        <div><div class="c-link-label">linkedin.com/in/prakharm1903</div><div class="c-link-sub">LinkedIn — connect professionally</div></div>
      </a>
      <a class="c-link gh" href="https://github.com/Prakhar1903" target="_blank" rel="noopener">
        <span class="c-link-icon">⚡</span>
        <div><div class="c-link-label">github.com/Prakhar1903</div><div class="c-link-sub">GitHub — explore my code</div></div>
      </a>
      <a class="c-link phone" href="tel:+917869691849">
        <span class="c-link-icon">📱</span>
        <div><div class="c-link-label">+91 7869691849</div><div class="c-link-sub">Mobile — WhatsApp available</div></div>
      </a>
    </div>
    <div class="open-badge"><span class="dot-green"></span>Available for internships &amp; full-time roles</div>`;
}

function buildResume() {
  return `
    <div class="resume-toolbar">
      <div class="resume-tb-left">
        <button class="res-btn" onclick="window.print()"><span>📥</span> Download (Print to PDF)</button>
        <a class="res-btn res-btn-sec" href="https://drive.google.com/file/d/1bq5zw9V4U_CzvmvkMqb3yx-un6iTfN-W/view" target="_blank" rel="noopener"><span>📜</span> Verified Drive Credentials</a>
      </div>
      <div class="resume-tb-right">
        <a class="res-btn res-btn-sec" href="https://linkedin.com/in/prakharm1903" target="_blank" rel="noopener"><span>💼</span> LinkedIn</a>
        <a class="res-btn res-btn-sec" href="https://github.com/Prakhar1903" target="_blank" rel="noopener"><span>⚡</span> GitHub</a>
        <a class="res-btn" href="mailto:prakharm1903@gmail.com"><span>✉️</span> Hire Me</a>
      </div>
    </div>
    <div class="resume-wrap">
      <div class="resume-sheet">
        <div class="res-header">
          <div class="res-name">PRAKHAR MISHRA</div>
          <div class="res-sub">Full-Stack Developer &amp; AI/ML Engineer · B.Tech CSE (CGPA: 8.12)</div>
          <div class="res-contact-bar">
            <span>📧 <a href="mailto:prakharm1903@gmail.com">prakharm1903@gmail.com</a></span>
            <span>📱 +91 7869691849</span>
            <span>📍 LPU, Punjab, India</span>
            <span>💻 <a href="https://github.com/Prakhar1903" target="_blank">github.com/Prakhar1903</a></span>
            <span>💼 <a href="https://linkedin.com/in/prakharm1903" target="_blank">linkedin.com/in/prakharm1903</a></span>
          </div>
        </div>

        <div class="res-sec">
          <div class="res-sec-title">EDUCATION</div>
          <div class="res-block">
            <div class="res-block-header">
              <span class="res-company">Lovely Professional University</span>
              <span class="res-dates">2022 – 2026 | Punjab, India</span>
            </div>
            <div class="res-role-line">Bachelor of Technology in Computer Science &amp; Engineering · <b>CGPA: 8.12</b></div>
          </div>
          <div class="res-block">
            <div class="res-block-header">
              <span class="res-company">Kendriya Vidyalaya Sangathan</span>
              <span class="res-dates">CBSE Board</span>
            </div>
            <div class="res-role-line">Class XII: <b>92.0%</b> &nbsp;|&nbsp; Class X: <b>91.2%</b></div>
          </div>
        </div>

        <div class="res-sec">
          <div class="res-sec-title">WORK EXPERIENCE</div>
          <div class="res-block">
            <div class="res-block-header">
              <span class="res-company">UpStride — Full Stack Developer Intern</span>
              <span class="res-dates">Apr 2026 – Jun 2026</span>
            </div>
            <div class="res-role-line">WeTano Engage AI Fork · Next.js · FastAPI · LangChain · Milvus RAG · Docker</div>
            <ul class="res-bullets">
              <li>Architected enterprise AI engagement workflows with LangChain &amp; Milvus vector DB, cutting semantic response latency by 35%.</li>
              <li>Engineered high-throughput FastAPI microservices and connected them to responsive Next.js frontend interfaces.</li>
              <li>Containerized production pipelines using Docker with automated CI/CD deployment routines.</li>
            </ul>
          </div>
          <div class="res-block">
            <div class="res-block-header">
              <span class="res-company">Infosys Springboard — AI/ML Intern</span>
              <span class="res-dates">Feb 2026 – Apr 2026</span>
            </div>
            <div class="res-role-line">Market Trend Forecaster · Python · TensorFlow · Scikit-learn · Streamlit &amp; FastAPI</div>
            <ul class="res-bullets">
              <li>Built ensemble machine learning models (LSTM + XGBoost) predicting stock movements with <b>89% directional accuracy</b>.</li>
              <li>Processed 5+ years of OHLCV historical time-series datasets with custom feature engineering &amp; technical indicators.</li>
              <li>Deployed interactive web platform with real-time financial charts on Vercel.</li>
            </ul>
          </div>
          <div class="res-block">
            <div class="res-block-header">
              <span class="res-company">WebStack Academy — MERN Stack Intern</span>
              <span class="res-dates">Dec 2025 – Jan 2026</span>
            </div>
            <div class="res-role-line">React.js · Node.js · Express.js · MongoDB · REST APIs · JWT Auth</div>
            <ul class="res-bullets">
              <li>Developed modular full-stack web applications featuring role-based authentication, real-time CRUD, and state management.</li>
              <li>Built and documented 15+ secure RESTful API endpoints with MongoDB aggregation pipelines.</li>
            </ul>
          </div>
        </div>

        <div class="res-sec">
          <div class="res-sec-title">FEATURED PROJECTS</div>
          <div class="res-block">
            <div class="res-block-header">
              <span class="res-company">KrishiGyan — Smart Agri-Tech AI Platform</span>
              <span class="res-dates"><a href="https://krishi-gyan-five.vercel.app/" target="_blank">Live Demo ↗</a> | <a href="https://github.com/Prakhar1903/KrishiGyan" target="_blank">GitHub ↗</a></span>
            </div>
            <div class="res-role-line">Next.js · Node.js · TensorFlow · FastAPI · Razorpay · MongoDB</div>
            <ul class="res-bullets">
              <li>Computer vision crop disease diagnostics with 94% accuracy, multi-lingual audio advisories, and direct mandi trade connectivity.</li>
            </ul>
          </div>
          <div class="res-block">
            <div class="res-block-header">
              <span class="res-company">Mockneto — AI-Powered Mock Interview Platform</span>
              <span class="res-dates"><a href="https://github.com/Prakhar1903/MOCKNETO" target="_blank">GitHub ↗</a></span>
            </div>
            <div class="res-role-line">React.js · Tailwind CSS · WebRTC · Gemini AI API · SpeechRecognition</div>
            <ul class="res-bullets">
              <li>Automated technical mock interviews with real-time speech transcription, facial sentiment analysis, and instant scoring rubrics.</li>
            </ul>
          </div>
          <div class="res-block">
            <div class="res-block-header">
              <span class="res-company">VirtuGym — AI Computer Vision Fitness Coach</span>
              <span class="res-dates"><a href="https://github.com/Prakhar1903/Virtugym" target="_blank">GitHub ↗</a></span>
            </div>
            <div class="res-role-line">React.js · Python · OpenCV · MediaPipe · WebRTC</div>
            <ul class="res-bullets">
              <li>Real-time 33-point skeletal landmark detection for workout rep counting and live posture correction angle calculations.</li>
            </ul>
          </div>
        </div>

        <div class="res-sec">
          <div class="res-sec-title">TECHNICAL SKILLS</div>
          <ul class="res-bullets">
            <li><b>Languages:</b> Python, JavaScript (ES6+), TypeScript, C++, Java, SQL, HTML5/CSS3</li>
            <li><b>Frameworks &amp; Web:</b> React.js, Next.js, Node.js, Express.js, FastAPI, Tailwind CSS, Redux Toolkit</li>
            <li><b>AI / ML / Data:</b> TensorFlow, PyTorch, Scikit-learn, OpenCV, MediaPipe, LangChain, Milvus RAG, Gemini API</li>
            <li><b>Databases &amp; DevOps:</b> MongoDB, PostgreSQL, Docker, Git/GitHub, Linux (Ubuntu), REST APIs, Vercel</li>
          </ul>
        </div>

        <div class="res-sec">
          <div class="res-sec-title">HONORS &amp; CERTIFICATIONS</div>
          <ul class="res-bullets">
            <li><b>edX &amp; W3Cx:</b> Web Development Fundamentals (HTML5/CSS3/JavaScript)</li>
            <li><b>edX &amp; IBM:</b> Developing Front-End Apps with React</li>
            <li><b>NPTEL (IIT Kharagpur):</b> Cloud Computing Certification</li>
            <li><b>Examly / LPU Colab:</b> Java Programming &amp; Data Structures &amp; Algorithms</li>
            <li><b>Hackathons:</b> Code-A-Haunt Finalist · Fynd Hacktimus 2025 Finalist · HackerRank 5-Star (C++ &amp; Java)</li>
          </ul>
        </div>
      </div>
    </div>`;
}

function buildSettings() {
  return `
    <div class="settings-wrap">
      <div class="setting-group">
        <div class="setting-group-title"><span>🎨</span> Desktop Color Themes</div>
        <div class="theme-grid">
          <div class="theme-card ${currentTheme === 'cyberpunk' ? 'active' : ''}" data-theme="cyberpunk" onclick="setTheme('cyberpunk')">
            <div class="tc-preview" style="background:#030810; border:1px solid #00f5ff;"><span style="color:#00f5ff;">■</span><span style="color:#a855f7;">■</span></div>
            <div class="tc-name">Cyberpunk</div>
          </div>
          <div class="theme-card ${currentTheme === 'matrix' ? 'active' : ''}" data-theme="matrix" onclick="setTheme('matrix')">
            <div class="tc-preview" style="background:#010801; border:1px solid #00ff41;"><span style="color:#00ff41;">■</span><span style="color:#10b981;">■</span></div>
            <div class="tc-name">Matrix</div>
          </div>
          <div class="theme-card ${currentTheme === 'synthwave' ? 'active' : ''}" data-theme="synthwave" onclick="setTheme('synthwave')">
            <div class="tc-preview" style="background:#0e051b; border:1px solid #ff71ce;"><span style="color:#ff71ce;">■</span><span style="color:#01cdfe;">■</span></div>
            <div class="tc-name">Synthwave</div>
          </div>
          <div class="theme-card ${currentTheme === 'obsidian' ? 'active' : ''}" data-theme="obsidian" onclick="setTheme('obsidian')">
            <div class="tc-preview" style="background:#09090b; border:1px solid #eab308;"><span style="color:#eab308;">■</span><span style="color:#fafafa;">■</span></div>
            <div class="tc-name">Obsidian</div>
          </div>
        </div>
      </div>

      <div class="setting-group">
        <div class="setting-group-title"><span>🌌</span> Wallpaper Engine</div>
        <div class="wall-grid">
          <button class="wall-btn ${currentWallpaper === 'constellation' ? 'active' : ''}" data-wall="constellation" onclick="setWallpaper('constellation')">✨ Particles</button>
          <button class="wall-btn ${currentWallpaper === 'matrix' ? 'active' : ''}" data-wall="matrix" onclick="setWallpaper('matrix')">💻 Matrix Rain</button>
          <button class="wall-btn ${currentWallpaper === 'stars' ? 'active' : ''}" data-wall="stars" onclick="setWallpaper('stars')">🌠 Starfield</button>
        </div>
      </div>

      <div class="setting-group">
        <div class="setting-group-title"><span>🔊</span> Sound &amp; Audio Feedback</div>
        <div class="setting-row">
          <span>UI Mechanical Sound Effects</span>
          <button class="sm-pbtn" id="sett-sound-btn" onclick="toggleSound(); this.textContent = soundEnabled ? 'Enabled' : 'Muted';">
            ${soundEnabled ? 'Enabled' : 'Muted'}
          </button>
        </div>
        <div class="setting-row">
          <span>Test Audio Chime</span>
          <button class="sm-pbtn" onclick="playSound('open')">▶ Play Test</button>
        </div>
      </div>

      <div class="setting-group">
        <div class="setting-group-title"><span>⚙️</span> System Controls</div>
        <div class="setting-row">
          <div>
            <div style="font-weight:600; color:#fff;">Restart PM-OS</div>
            <div style="font-size:0.7rem; color:var(--text-muted);">Re-executes BIOS initialization and boot sequence</div>
          </div>
          <button class="sm-pbtn" style="border-color:var(--accent); color:var(--accent);" onclick="rebootSystem()">🔄 Reboot</button>
        </div>
        <div class="setting-row">
          <div>
            <div style="font-weight:600; color:#fff;">Close All Windows</div>
            <div style="font-size:0.7rem; color:var(--text-muted);">Minimizes clutter and clears the workspace</div>
          </div>
          <button class="sm-pbtn" onclick="closeAllWins()">✕ Clear</button>
        </div>
      </div>
    </div>`;
}

function buildPlayer() {
  const tr = TRACKS[currentTrackIdx];
  return `
    <div class="player-box">
      <div class="player-disc-wrap">
        <div class="player-disc ${isMusicPlaying ? 'playing' : ''}" id="pl-disc">🎵</div>
      </div>
      <div class="player-track-info">
        <div class="player-track-title" id="pl-title">${tr.title}</div>
        <div class="player-track-artist" id="pl-artist">${tr.artist}</div>
      </div>
      <canvas id="player-vis" width="340" height="60"></canvas>
      <div class="player-controls">
        <button class="pl-btn" onclick="prevTrack()" title="Previous Track">⏮</button>
        <button class="pl-btn pl-btn-play" id="pl-play-btn" onclick="togglePlayMusic()" title="Play / Pause">${isMusicPlaying ? '⏸' : '▶'}</button>
        <button class="pl-btn" onclick="nextTrack()" title="Next Track">⏭</button>
      </div>
      <div style="font-size:0.72rem; color:var(--text-muted); font-family:var(--font-mono);">Procedural Web Audio Ambient Engine</div>
    </div>`;
}

function buildSnake() {
  return `
    <div class="snake-wrap">
      <div class="snake-header">
        <div>SCORE: <span class="snake-score-val" id="snake-score">0</span></div>
        <div>BEST: <span class="snake-score-val" id="snake-best">0</span></div>
      </div>
      <canvas id="snake-canvas" width="320" height="320"></canvas>
      <div class="snake-dpad">
        <div></div>
        <button class="dpad-btn" onclick="changeSnakeDir(0, -1)">▲</button>
        <div></div>
        <button class="dpad-btn" onclick="changeSnakeDir(-1, 0)">◀</button>
        <button class="dpad-btn" onclick="restartSnake()">🔄</button>
        <button class="dpad-btn" onclick="changeSnakeDir(1, 0)">▶</button>
        <div></div>
        <button class="dpad-btn" onclick="changeSnakeDir(0, 1)">▼</button>
        <div></div>
      </div>
      <div style="font-size:0.68rem; color:var(--text-muted); font-family:var(--font-mono);">Use Arrow Keys, WASD, or Buttons</div>
    </div>`;
}

function buildAI() {
  return `
    <div class="ai-wrap">
      <div class="ai-chat-header">
        <span>🤖</span> PM-Bot — Prakhar AI Career Assistant
      </div>
      <div class="ai-msg-list" id="ai-msg-list">
        <div class="ai-msg bot">
          <div class="ai-bubble">
            👋 Hi there! I'm <b>PM-Bot</b>, an AI assistant trained on Prakhar Mishra's resume, skills, and projects.<br><br>
            Feel free to ask me anything or click a quick prompt below:
          </div>
        </div>
      </div>
      <div class="ai-chips-wrap">
        <button class="ai-chip" onclick="askAIChip('What are Prakhar\\'s top AI/ML projects?')">⭐ Top AI Projects</button>
        <button class="ai-chip" onclick="askAIChip('Tell me about his internships at UpStride &amp; Infosys')">💼 Internships</button>
        <button class="ai-chip" onclick="askAIChip('What is his full technical stack?')">⚡ Tech Stack</button>
        <button class="ai-chip" onclick="askAIChip('Why should we hire Prakhar?')">🎯 Why Hire Him?</button>
        <button class="ai-chip" onclick="askAIChip('How can I contact Prakhar?')">📬 Contact Info</button>
      </div>
      <div class="ai-input-row">
        <input type="text" class="ai-input" id="ai-user-inp" placeholder="Ask about projects, skills, experience..." onkeydown="if(event.key==='Enter') sendAIMessage()">
        <button class="ai-send-btn" onclick="sendAIMessage()">Send</button>
      </div>
    </div>`;
}

function buildTerminal() {
  return `
    <div class="term-wrap" id="term-wrap">
      <div class="term-out" id="term-out"></div>
      <div class="term-in-row">
        <span class="term-prompt">prakhar@pm-os:~$</span>
        <input class="term-input" id="term-input" type="text" autocomplete="off" spellcheck="false" />
      </div>
    </div>`;
}

// ════════════════════════════════
// TERMINAL ENGINE
// ════════════════════════════════

const WELCOME = `<pre style="color:#00f5ff;font-family:'JetBrains Mono',monospace;font-size:0.7rem;line-height:1.2;margin:0 0 6px 0;padding:0;white-space:pre;overflow-x:auto;">
██████╗ ███╗   ███╗      ██████╗ ███████╗
██╔══██╗████╗ ████║     ██╔═══██╗██╔════╝
██████╔╝██╔████╔██║     ██║   ██║███████╗
██╔═══╝ ██║╚██╔╝██║     ██║   ██║╚════██║
██║     ██║ ╚═╝ ██║     ╚██████╔╝███████║
╚═╝     ╚═╝     ╚═╝      ╚═════╝ ╚══════╝</pre>
<div class="t-dim">─────────────────────────────────────────────</div>
<div><span class="t-info">PM-OS Portfolio Operating System v1.0.0</span></div>
<div><span class="t-dim">Logged in as: </span><span class="t-white">prakhar</span> &nbsp;<span class="t-dim">Host: </span><span class="t-white">LPU · B.Tech CSE</span></div>
<div class="t-dim">─────────────────────────────────────────────</div>
<div>Type <span class="t-info">help</span> for available commands · <span class="t-info">neofetch</span> for system info</div>
`;

function initTerminal() {
  const out   = document.getElementById('term-out');
  const input = document.getElementById('term-input');
  if (!out || !input) return;

  out.innerHTML = WELCOME;
  input.focus();

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const cmd = input.value.trim();
      input.value = '';
      if (cmd) {
        cmdHistory.unshift(cmd);
        histIdx = -1;
        tLine(out, `<span class="t-dim">prakhar@pm-os:~$</span> <span class="t-cmd">${esc(cmd)}</span>`);
        execCmd(cmd, out);
      }
      out.scrollTop = out.scrollHeight;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIdx < cmdHistory.length - 1) { histIdx++; input.value = cmdHistory[histIdx]; }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      histIdx > 0 ? (histIdx--, input.value = cmdHistory[histIdx]) : (histIdx = -1, input.value = '');
    }
  });
}

function tLine(out, html) {
  const d = document.createElement('div');
  d.className = 't-line';
  d.innerHTML = html;
  out.appendChild(d);
  out.scrollTop = out.scrollHeight;
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function execCmd(raw, out) {
  const parts = raw.trim().split(/\s+/);
  const cmd   = parts[0].toLowerCase();
  const args  = parts.slice(1);

  switch (cmd) {

    case 'help':
      tLine(out, `
<span class="t-info">Available Commands:</span>
<span class="t-dim">────────────────────────────────────</span>
  <span class="t-info">whoami</span>           About Prakhar Mishra
  <span class="t-info">neofetch</span>         Fancy system info
  <span class="t-info">ls</span>               List desktop files
  <span class="t-info">cat &lt;file&gt;</span>       Read a file <span class="t-dim">(about.txt | contact.txt | skills.txt | resume.txt)</span>
  <span class="t-info">open &lt;app&gt;</span>       Open an app window
  <span class="t-info">theme &lt;name&gt;</span>     Switch theme <span class="t-dim">(cyberpunk | matrix | synthwave | obsidian)</span>
  <span class="t-info">matrix</span>           Toggle Matrix Rain wallpaper
  <span class="t-info">date</span>             Current date &amp; time
  <span class="t-info">clear</span>            Clear terminal
<span class="t-dim">────────────────────────────────────</span>
Apps: <span class="t-info">resume</span> · <span class="t-info">projects</span> · <span class="t-info">experience</span> · <span class="t-info">skills</span> · <span class="t-info">education</span> · <span class="t-info">awards</span> · <span class="t-info">contact</span> · <span class="t-info">ai</span> · <span class="t-info">player</span> · <span class="t-info">snake</span> · <span class="t-info">settings</span>`);
      break;

    case 'whoami':
      tLine(out, `
<span class="t-info">Prakhar Mishra</span>
<span class="t-dim">Full Stack Developer · AI Enthusiast · Problem Solver</span>
<span class="t-dim">────────────────────────────────────────────</span>
  🎓  B.Tech CSE @ LPU, Punjab  <span class="t-info">(CGPA: 8.12)</span>
  💼  3 Internships: UpStride · Infosys · WSA
  🛠️  Stack: React · Node.js · FastAPI · MongoDB · CrewAI
  💻  250+ DSA problems on LeetCode · GFG · HackerRank
  ⭐  HackerRank 5-Star: C++ &amp; Java
  🏅  Fynd Hacktimus 2025 Finalist
<span class="t-dim">────────────────────────────────────────────</span>
  📧  prakharm1903@gmail.com
  🔗  linkedin.com/in/prakharm1903
  ⚡  github.com/Prakhar1903`);
      break;

    case 'neofetch':
      tLine(out, `
<table style="border-collapse:collapse;"><tr>
<td style="padding-right:22px;vertical-align:top;">
<span style="color:#00f5ff;font-size:0.68rem;line-height:1.25;display:block;font-family:'JetBrains Mono',monospace;">██████╗ ███╗   ███╗
██╔══██╗████╗ ████║
██████╔╝██╔████╔██║
██╔═══╝ ██║╚██╔╝██║
██║     ██║ ╚═╝ ██║
╚═╝     ╚═╝     ╚═╝</span>
</td>
<td style="vertical-align:top;font-size:0.78rem;">
<span class="t-white" style="font-weight:700;">prakhar</span><span class="t-dim">@</span><span class="t-white" style="font-weight:700;">pm-os</span><br>
<span class="t-dim">──────────────────────────────</span><br>
<span class="t-info">OS:         </span>PM-OS Portfolio v1.0<br>
<span class="t-info">Host:       </span>Prakhar Mishra<br>
<span class="t-info">University: </span>LPU B.Tech CSE (8.12)<br>
<span class="t-info">Languages:  </span>Java, C++, JavaScript<br>
<span class="t-info">Frontend:   </span>React, Tailwind, Bootstrap<br>
<span class="t-info">Backend:    </span>Node.js, Express, FastAPI<br>
<span class="t-info">Database:   </span>MongoDB, MySQL<br>
<span class="t-info">AI/ML:      </span>CrewAI, TensorFlow.js<br>
<span class="t-info">DSA:        </span>250+ problems solved<br>
<span class="t-info">Internships:</span>3 (UpStride, Infosys, WSA)<br>
<span class="t-info">Status:     </span><span style="color:#28c840;">🟢 Open to Opportunities</span><br>
<br>
<span style="color:#ff5f57;">■</span> <span style="color:#febc2e;">■</span> <span style="color:#28c840;">■</span> <span style="color:#00f5ff;">■</span> <span style="color:#a855f7;">■</span>
</td></tr></table>`);
      break;

    case 'ls':
      tLine(out, `
<span class="t-info">-rwxr-xr-x</span>  <span class="t-white">Resume.exe     </span><span class="t-dim">Print-ready CV, verified credentials, download</span>
<span class="t-info">drwxr-xr-x</span>  <span class="t-white">About.exe      </span><span class="t-dim">Full-stack Dev · AI/ML Engineer · LPU CSE</span>
<span class="t-info">drwxr-xr-x</span>  <span class="t-white">Projects/      </span><span class="t-dim">KrishiGyan · Mockneto · VirtuGym · CivicResolver · Scalle</span>
<span class="t-info">drwxr-xr-x</span>  <span class="t-white">Experience/    </span><span class="t-dim">UpStride · Infosys · WSA</span>
<span class="t-info">-rw-r--r--</span>  <span class="t-white">Skills.json    </span><span class="t-dim">Python, Java, React, Next.js, FastAPI, Docker...</span>
<span class="t-info">-rw-r--r--</span>  <span class="t-white">Education.log  </span><span class="t-dim">LPU B.Tech CSE · CGPA 8.12</span>
<span class="t-info">drwxr-xr-x</span>  <span class="t-white">Awards/        </span><span class="t-dim">Hackathons · HackerRank 5★ · 250+ DSA</span>
<span class="t-info">-rwxr-xr-x</span>  <span class="t-white">PM-Bot.exe     </span><span class="t-dim">Interactive AI Career Assistant</span>
<span class="t-info">-rwxr-xr-x</span>  <span class="t-white">Player.exe     </span><span class="t-dim">Lo-Fi ambient synthesizer &amp; audio visualizer</span>
<span class="t-info">-rwxr-xr-x</span>  <span class="t-white">Snake.exe      </span><span class="t-dim">Retro neon arcade game</span>
<span class="t-info">-rwxr-xr-x</span>  <span class="t-white">Settings.exe   </span><span class="t-dim">Desktop preferences &amp; theme switcher</span>
<span class="t-info">-rwxr-xr-x</span>  <span class="t-white">Contact.sh     </span><span class="t-dim">prakharm1903@gmail.com</span>
<span class="t-info">-rwxr-xr-x</span>  <span class="t-white">Terminal       </span><span class="t-dim">← Active shell</span>`);
      break;

    case 'cat': {
      const f = (args[0] || '').toLowerCase();
      if (f === 'about.txt') {
        tLine(out, `
<span class="t-info"># about.txt</span>
Name:       Prakhar Mishra
Role:       Full Stack Developer | AI Enthusiast
University: Lovely Professional University — B.Tech CSE
CGPA:       8.12 / 10.0

Summary:
  Passionate developer with hands-on experience in MERN stack,
  FastAPI, and AI-powered multi-agent systems. Built real-world
  platforms for Infosys and UpStride. 250+ DSA problems solved.
  Always learning. Always building impactful products.`);
      } else if (f === 'contact.txt') {
        tLine(out, `
<span class="t-info"># contact.txt</span>
Email:    prakharm1903@gmail.com
LinkedIn: linkedin.com/in/prakharm1903
GitHub:   github.com/Prakhar1903
Phone:    +91 7869691849
Status:   🟢 Open to opportunities`);
      } else if (f === 'skills.txt') {
        tLine(out, `
<span class="t-info"># skills.txt</span>
Languages:   Java, C++
Frameworks:  ReactJS, NodeJS, Express, Bootstrap, TailwindCSS
Tools:       MySQL, MongoDB, Git, GitHub, Figma, Postman, Vercel
CS Core:     DBMS, OS, CN, SQL, OOPs
Soft Skills: Leadership, Problem-Solving, Adaptability, Quick Learner`);
      } else if (f === 'projects.txt') {
        tLine(out, `
<span class="t-info"># projects.txt</span>
1. KrishiGyan      - AI Agriculture Management Platform (Next.js, Node, TensorFlow)
2. Mockneto        - AI Mock Interview Platform (React, WebRTC, Gemini API)
3. VirtuGym        - Computer Vision Workout Correction (React, OpenCV, MediaPipe)
4. CivicResolver   - Smart Citizen Grievance Portal (React, Node, Leaflet.js)
5. Scalle          - Cloud DNS & Freelance Hub (React, Node, PostgreSQL)`);
      } else if (f === 'resume.txt') {
        tLine(out, `
<span class="t-info"># resume.txt — Prakhar Mishra</span>
Role: Full-Stack Developer &amp; AI/ML Engineer
Education: LPU B.Tech CSE (CGPA: 8.12)
Internships: UpStride (Apr-Jun '26) · Infosys (Feb-Apr '26) · WSA (Dec-Jan '26)
Skills: Python, React, Next.js, FastAPI, Node.js, TensorFlow, LangChain, Docker
Type <span class="t-info">open resume</span> for full printable CV with verified links.`);
      } else {
        tLine(out, `<span class="t-err">cat: ${esc(args[0] || '(no file)')}: No such file</span><br><span class="t-dim">Try: about.txt · contact.txt · skills.txt · projects.txt · resume.txt</span>`);
      }
      break;
    }

    case 'resume':
    case 'cv':
      openApp('resume');
      tLine(out, `<span class="t-out">Opening Resume.exe…</span>`);
      break;

    case 'ai':
    case 'bot':
      openApp('ai');
      tLine(out, `<span class="t-out">Opening PM-Bot.exe…</span>`);
      break;

    case 'player':
    case 'music':
      openApp('player');
      tLine(out, `<span class="t-out">Opening Player.exe…</span>`);
      break;

    case 'snake':
    case 'game':
      openApp('snake');
      tLine(out, `<span class="t-out">Opening Snake.exe…</span>`);
      break;

    case 'settings':
    case 'pref':
      openApp('settings');
      tLine(out, `<span class="t-out">Opening Settings.exe…</span>`);
      break;

    case 'theme': {
      const th = (args[0] || '').toLowerCase();
      if (['cyberpunk', 'matrix', 'synthwave', 'obsidian'].includes(th)) {
        setTheme(th);
        tLine(out, `<span class="t-out">Theme switched to '${esc(th)}'.</span>`);
      } else {
        tLine(out, `<span class="t-err">Usage: theme &lt;cyberpunk | matrix | synthwave | obsidian&gt;</span>`);
      }
      break;
    }

    case 'matrix':
      setWallpaper(currentWallpaper === 'matrix' ? 'constellation' : 'matrix');
      tLine(out, `<span class="t-out">Wallpaper set to: ${esc(currentWallpaper)}</span>`);
      break;

    case 'open': {
      const appId = (args[0] || '').toLowerCase();
      if (APPS[appId]) {
        openApp(appId);
        tLine(out, `<span class="t-out">Opening ${esc(APPS[appId].title)}…</span>`);
      } else {
        tLine(out, `<span class="t-err">open: unknown app '${esc(appId)}'</span><br><span class="t-dim">Available: about · projects · experience · skills · education · achievements · contact</span>`);
      }
      break;
    }

    case 'echo':
      tLine(out, `<span class="t-out">${esc(args.join(' '))}</span>`);
      break;

    case 'date':
      tLine(out, `<span class="t-out">${new Date().toString()}</span>`);
      break;

    case 'history':
      if (cmdHistory.length === 0) {
        tLine(out, `<span class="t-dim">No history yet.</span>`);
      } else {
        tLine(out, cmdHistory.slice(0, 20).map((c, i) =>
          `<span class="t-dim">${String(cmdHistory.length - i).padStart(3)}</span>  ${esc(c)}`
        ).join('<br>'));
      }
      break;

    case 'clear':
      document.getElementById('term-out').innerHTML = '';
      break;

    case '':
      break;

    default:
      tLine(out, `<span class="t-err">pm-os: command not found: ${esc(raw)}</span> — type <span class="t-info">help</span>`);
  }

  const termOut = document.getElementById('term-out');
  if (termOut) termOut.scrollTop = termOut.scrollHeight;
}

// ════════════════════════════════
// CLOCK
// ════════════════════════════════
function tickClock() {
  const now  = new Date();
  const h    = String(now.getHours()).padStart(2,'0');
  const m    = String(now.getMinutes()).padStart(2,'0');
  const time = h + ':' + m;
  const date = now.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('corner-time', time);
  set('corner-date', date);
  set('tb-time', time);
  set('tb-date', date);
}

// ════════════════════════════════
// THEME & WALLPAPER ENGINE
// ════════════════════════════════
const THEMES = ['cyberpunk', 'matrix', 'synthwave', 'obsidian'];
let currentTheme = localStorage.getItem('pm_theme') || 'cyberpunk';
let currentWallpaper = localStorage.getItem('pm_wall') || 'constellation';

function setTheme(theme) {
  if (!THEMES.includes(theme)) return;
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('pm_theme', theme);
  playSound('click');
  document.querySelectorAll('.theme-card').forEach(c => {
    c.classList.toggle('active', c.getAttribute('data-theme') === theme);
  });
}

function cycleTheme(e) {
  if (e) e.stopPropagation();
  const nextIdx = (THEMES.indexOf(currentTheme) + 1) % THEMES.length;
  setTheme(THEMES[nextIdx]);
}

function setWallpaper(mode) {
  currentWallpaper = mode;
  localStorage.setItem('pm_wall', mode);
  document.querySelectorAll('.wall-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-wall') === mode);
  });
  playSound('click');
}

// ════════════════════════════════
// CANVAS WALLPAPER (3 MODES)
// ════════════════════════════════
const matrixChars = '0123456789ABCDEF0123456789@#$%&*+-/<>~ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ';
let matrixDrops = [];

function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const cols = Math.floor(canvas.width / 18);
    matrixDrops = Array.from({ length: cols }, () => Math.floor(Math.random() * -50));
  }
  resize();
  window.addEventListener('resize', resize);

  // Particles for constellation & starfield
  const stars = Array.from({ length: 120 }, () => ({
    x:       Math.random() * canvas.width,
    y:       Math.random() * canvas.height,
    r:       Math.random() * 1.4 + 0.3,
    alpha:   Math.random() * 0.5 + 0.1,
    speedY: -(Math.random() * 0.25 + 0.05),
    speedX:  (Math.random() - 0.5) * 0.08,
    phase:   Math.random() * Math.PI * 2
  }));

  // Grid
  const gridCanvas = document.createElement('canvas');
  const gridCtx    = gridCanvas.getContext('2d');

  function drawGrid() {
    gridCanvas.width  = canvas.width;
    gridCanvas.height = canvas.height;
    gridCtx.strokeStyle = 'rgba(0,245,255,0.028)';
    gridCtx.lineWidth   = 1;
    const sp = 65;
    for (let x = 0; x < gridCanvas.width;  x += sp) { gridCtx.beginPath(); gridCtx.moveTo(x,0); gridCtx.lineTo(x, gridCanvas.height); gridCtx.stroke(); }
    for (let y = 0; y < gridCanvas.height; y += sp) { gridCtx.beginPath(); gridCtx.moveTo(0,y); gridCtx.lineTo(gridCanvas.width, y); gridCtx.stroke(); }
  }
  drawGrid();
  window.addEventListener('resize', () => { resize(); drawGrid(); });

  function draw() {
    if (currentWallpaper === 'matrix') {
      ctx.fillStyle = 'rgba(1, 8, 1, 0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00ff41';
      ctx.font = '14px monospace';

      for (let i = 0; i < matrixDrops.length; i++) {
        const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        ctx.fillText(char, i * 18, matrixDrops[i] * 18);
        if (matrixDrops[i] * 18 > canvas.height && Math.random() > 0.975) {
          matrixDrops[i] = 0;
        }
        matrixDrops[i]++;
      }
    } else if (currentWallpaper === 'stars') {
      ctx.fillStyle = '#030611';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        s.phase += 0.02;
        const a = s.alpha * (0.6 + 0.4 * Math.sin(s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
        s.y += s.speedY * 0.5;
        if (s.y < 0) s.y = canvas.height;
      });
    } else {
      // Default: constellation
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const grad = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.35, 0,
        canvas.width * 0.5, canvas.height * 0.35, canvas.width * 0.55
      );
      grad.addColorStop(0, 'rgba(10,20,55,0.35)');
      grad.addColorStop(1, 'rgba(3,8,16,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(gridCanvas, 0, 0);

      stars.forEach(s => {
        s.phase += 0.018;
        const a = s.alpha * (0.55 + 0.45 * Math.sin(s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,245,255,${a})`;
        ctx.fill();
        s.y += s.speedY;
        s.x += s.speedX;
        if (s.y < 0)              { s.y = canvas.height; s.x = Math.random() * canvas.width; }
        if (s.x < 0)              { s.x = canvas.width; }
        if (s.x > canvas.width)   { s.x = 0; }
      });
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// ════════════════════════════════
// AUDIO & SYNTH ENGINE
// ════════════════════════════════
let audioCtx = null;
let soundEnabled = true;
let isMusicPlaying = false;
let currentTrackIdx = 0;
let musicInterval = null;

function getAudioCtx() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSound(type) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    } else if (type === 'open') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.1);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'close') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.08);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch (e) {}
}

function toggleSound(e) {
  if (e) e.stopPropagation();
  soundEnabled = !soundEnabled;
  const btn = document.getElementById('tb-sound-btn');
  if (btn) btn.textContent = soundEnabled ? '🔊' : '🔇';
  const settBtn = document.getElementById('sett-sound-btn');
  if (settBtn) settBtn.textContent = soundEnabled ? 'Enabled' : 'Muted';
  if (!soundEnabled && isMusicPlaying) {
    togglePlayMusic();
  }
  playSound('click');
}

// ════════════════════════════════
// PROCEDURAL LO-FI AMBIENT MUSIC
// ════════════════════════════════
const TRACKS = [
  {
    title: "Midnight Lo-Fi",
    artist: "Procedural Ambient Synth",
    chords: [
      [261.63, 329.63, 392.00, 493.88],
      [220.00, 261.63, 329.63, 392.00],
      [174.61, 220.00, 261.63, 329.63],
      [196.00, 246.94, 293.66, 349.23]
    ]
  },
  {
    title: "Cyberpunk Drift",
    artist: "80s Neon Highway",
    chords: [
      [293.66, 349.23, 440.00, 523.25],
      [233.08, 293.66, 349.23, 440.00],
      [196.00, 246.94, 293.66, 349.23],
      [220.00, 277.18, 329.63, 440.00]
    ]
  },
  {
    title: "Deep Focus",
    artist: "Sub-Bass & Chords",
    chords: [
      [220.00, 261.63, 329.63, 440.00],
      [174.61, 220.00, 261.63, 349.23],
      [130.81, 164.81, 196.00, 246.94],
      [196.00, 246.94, 293.66, 392.00]
    ]
  }
];

let chordStep = 0;

function playAmbientChord() {
  if (!isMusicPlaying) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const track = TRACKS[currentTrackIdx];
    const notes = track.chords[chordStep % track.chords.length];
    chordStep++;

    const now = ctx.currentTime;
    const dur = 3.6;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(700, now);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.045, now);
    masterGain.gain.linearRampToValueAtTime(0.06, now + 1.2);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime((idx - 1.5) * 6, now);
      osc.connect(filter);
      osc.start(now);
      osc.stop(now + dur);
    });
  } catch (e) {}
}

function togglePlayMusic() {
  getAudioCtx();
  isMusicPlaying = !isMusicPlaying;

  const btn = document.getElementById('pl-play-btn');
  const disc = document.getElementById('pl-disc');
  const tbBtn = document.getElementById('tb-player-btn');

  if (isMusicPlaying) {
    if (btn) btn.textContent = '⏸';
    if (disc) disc.classList.add('playing');
    if (tbBtn) tbBtn.textContent = '🎶';
    chordStep = 0;
    playAmbientChord();
    if (musicInterval) clearInterval(musicInterval);
    musicInterval = setInterval(playAmbientChord, 3500);
    startVisualizer();
  } else {
    if (btn) btn.textContent = '▶';
    if (disc) disc.classList.remove('playing');
    if (tbBtn) tbBtn.textContent = '🎵';
    if (musicInterval) clearInterval(musicInterval);
  }
}

function nextTrack() {
  currentTrackIdx = (currentTrackIdx + 1) % TRACKS.length;
  updatePlayerUI();
  if (isMusicPlaying) {
    chordStep = 0;
    playAmbientChord();
  }
  playSound('click');
}

function prevTrack() {
  currentTrackIdx = (currentTrackIdx - 1 + TRACKS.length) % TRACKS.length;
  updatePlayerUI();
  if (isMusicPlaying) {
    chordStep = 0;
    playAmbientChord();
  }
  playSound('click');
}

function updatePlayerUI() {
  const tr = TRACKS[currentTrackIdx];
  const tEl = document.getElementById('pl-title');
  const aEl = document.getElementById('pl-artist');
  if (tEl) tEl.textContent = tr.title;
  if (aEl) aEl.textContent = tr.artist;
}

function initPlayer() {
  startVisualizer();
}

function startVisualizer() {
  const canvas = document.getElementById('player-vis');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const bars = 28;

  function render() {
    if (!document.getElementById('player-vis')) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < bars; i++) {
      const h = isMusicPlaying
        ? Math.floor(Math.sin(Date.now() * 0.005 + i * 0.4) * 18 + Math.random() * 22 + 10)
        : 4;
      const x = i * (canvas.width / bars) + 2;
      const w = (canvas.width / bars) - 4;
      const y = canvas.height - h;

      const grad = ctx.createLinearGradient(0, y, 0, canvas.height);
      grad.addColorStop(0, '#00f5ff');
      grad.addColorStop(1, 'rgba(168,85,247,0.4)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);
    }
    requestAnimationFrame(render);
  }
  render();
}

// ════════════════════════════════
// RETRO SNAKE ARCADE GAME
// ════════════════════════════════
let snakeLoop = null;
let snake = [];
let food = { x: 10, y: 10 };
let snakeDir = { x: 1, y: 0 };
let nextDir = { x: 1, y: 0 };
let snakeScore = 0;
let snakeBest = parseInt(localStorage.getItem('pm_snake_best') || '0', 10);
const GRID_SIZE = 16;
const TILE_COUNT = 20;

function initSnake() {
  const canvas = document.getElementById('snake-canvas');
  if (!canvas) return;
  const bestEl = document.getElementById('snake-best');
  if (bestEl) bestEl.textContent = snakeBest;
  restartSnake();
  window.addEventListener('keydown', handleSnakeKeys);
}

function handleSnakeKeys(e) {
  if (!document.getElementById('win-snake')) return;
  if (['ArrowUp', 'KeyW'].includes(e.code) && snakeDir.y === 0) { nextDir = { x: 0, y: -1 }; e.preventDefault(); }
  if (['ArrowDown', 'KeyS'].includes(e.code) && snakeDir.y === 0) { nextDir = { x: 0, y: 1 }; e.preventDefault(); }
  if (['ArrowLeft', 'KeyA'].includes(e.code) && snakeDir.x === 0) { nextDir = { x: -1, y: 0 }; e.preventDefault(); }
  if (['ArrowRight', 'KeyD'].includes(e.code) && snakeDir.x === 0) { nextDir = { x: 1, y: 0 }; e.preventDefault(); }
}

function changeSnakeDir(x, y) {
  if (x !== 0 && snakeDir.x === 0) nextDir = { x, y: 0 };
  if (y !== 0 && snakeDir.y === 0) nextDir = { x: 0, y };
  playSound('click');
}

function restartSnake() {
  snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 }
  ];
  snakeDir = { x: 1, y: 0 };
  nextDir  = { x: 1, y: 0 };
  snakeScore = 0;
  const scoreEl = document.getElementById('snake-score');
  if (scoreEl) scoreEl.textContent = '0';
  spawnFood();

  if (snakeLoop) clearInterval(snakeLoop);
  snakeLoop = setInterval(updateSnake, 110);
}

function spawnFood() {
  food = {
    x: Math.floor(Math.random() * TILE_COUNT),
    y: Math.floor(Math.random() * TILE_COUNT)
  };
}

function updateSnake() {
  const canvas = document.getElementById('snake-canvas');
  if (!canvas) {
    if (snakeLoop) clearInterval(snakeLoop);
    return;
  }
  const ctx = canvas.getContext('2d');

  snakeDir = nextDir;
  const head = { x: snake[0].x + snakeDir.x, y: snake[0].y + snakeDir.y };

  if (head.x < 0) head.x = TILE_COUNT - 1;
  if (head.x >= TILE_COUNT) head.x = 0;
  if (head.y < 0) head.y = TILE_COUNT - 1;
  if (head.y >= TILE_COUNT) head.y = 0;

  for (let segment of snake) {
    if (segment.x === head.x && segment.y === head.y) {
      playSound('close');
      restartSnake();
      return;
    }
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    snakeScore += 10;
    playSound('click');
    const scoreEl = document.getElementById('snake-score');
    if (scoreEl) scoreEl.textContent = snakeScore;
    if (snakeScore > snakeBest) {
      snakeBest = snakeScore;
      localStorage.setItem('pm_snake_best', snakeBest);
      const bestEl = document.getElementById('snake-best');
      if (bestEl) bestEl.textContent = snakeBest;
    }
    spawnFood();
  } else {
    snake.pop();
  }

  ctx.fillStyle = '#02060f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(0,245,255,0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i < TILE_COUNT; i++) {
    ctx.beginPath(); ctx.moveTo(i * GRID_SIZE, 0); ctx.lineTo(i * GRID_SIZE, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * GRID_SIZE); ctx.lineTo(canvas.width, i * GRID_SIZE); ctx.stroke();
  }

  ctx.fillStyle = '#ff71ce';
  ctx.shadowColor = '#ff71ce';
  ctx.shadowBlur = 10;
  ctx.fillRect(food.x * GRID_SIZE + 2, food.y * GRID_SIZE + 2, GRID_SIZE - 4, GRID_SIZE - 4);

  snake.forEach((seg, idx) => {
    ctx.fillStyle = idx === 0 ? '#00f5ff' : '#00ff41';
    ctx.shadowColor = idx === 0 ? '#00f5ff' : '#00ff41';
    ctx.shadowBlur = idx === 0 ? 12 : 5;
    ctx.fillRect(seg.x * GRID_SIZE + 1, seg.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
  });
  ctx.shadowBlur = 0;
}

// ════════════════════════════════
// PM-BOT (ASK PRAKHAR AI)
// ════════════════════════════════
function initAI() {
  const inp = document.getElementById('ai-user-inp');
  if (inp) inp.focus();
}

function askAIChip(text) {
  const inp = document.getElementById('ai-user-inp');
  if (inp) {
    inp.value = text;
    sendAIMessage();
  }
}

function sendAIMessage() {
  const inp = document.getElementById('ai-user-inp');
  if (!inp) return;
  const q = inp.value.trim();
  if (!q) return;
  inp.value = '';

  const msgList = document.getElementById('ai-msg-list');
  if (!msgList) return;

  const userMsg = document.createElement('div');
  userMsg.className = 'ai-msg user';
  userMsg.innerHTML = `<div class="ai-bubble">${esc(q)}</div>`;
  msgList.appendChild(userMsg);
  msgList.scrollTop = msgList.scrollHeight;

  playSound('click');

  setTimeout(() => {
    const reply = getAIResponse(q);
    const botMsg = document.createElement('div');
    botMsg.className = 'ai-msg bot';
    botMsg.innerHTML = `<div class="ai-bubble">${reply}</div>`;
    msgList.appendChild(botMsg);
    msgList.scrollTop = msgList.scrollHeight;
    playSound('open');
  }, 350);
}

function getAIResponse(query) {
  const q = query.toLowerCase();

  if (q.includes('project') || q.includes('work') || q.includes('built')) {
    return `Prakhar has engineered impactful full-stack and AI projects:
    <br><br>
    🌱 <b>KrishiGyan:</b> Smart agriculture platform with 94% crop disease detection accuracy, multi-lingual audio advisories, and direct trade mandi connectivity. (<a href="https://krishi-gyan-five.vercel.app/" target="_blank" style="color:var(--accent);">Live Demo</a> · <a href="https://github.com/Prakhar1903/KrishiGyan" target="_blank" style="color:var(--accent);">GitHub</a>)
    <br><br>
    🎙️ <b>Mockneto:</b> Real-time AI mock interview platform featuring speech transcription, facial sentiment analysis, and instant scoring rubrics via Gemini AI API. (<a href="https://github.com/Prakhar1903/MOCKNETO" target="_blank" style="color:var(--accent);">GitHub</a>)
    <br><br>
    🏋️ <b>VirtuGym:</b> Computer vision fitness coach using OpenCV &amp; MediaPipe for 33-point joint tracking and posture correction. (<a href="https://github.com/Prakhar1903/Virtugym" target="_blank" style="color:var(--accent);">GitHub</a>)`;
  }

  if (q.includes('intern') || q.includes('experience') || q.includes('upstride') || q.includes('infosys')) {
    return `Prakhar has completed 3 internships:
    <br><br>
    🚀 <b>UpStride (Full Stack Dev Intern · Apr–Jun 2026):</b> Worked on WeTano Engage AI Fork, cutting AI latency by 35% with LangChain &amp; Milvus vector DB RAG, building FastAPI microservices &amp; Next.js interfaces.
    <br><br>
    📊 <b>Infosys Springboard (AI/ML Intern · Feb–Apr 2026):</b> Built <b>Market Trend Forecaster</b> with 89% directional accuracy using LSTM &amp; XGBoost over 5+ years of stock data with live charts.
    <br><br>
    🌐 <b>WebStack Academy (MERN Intern · Dec 2025–Jan 2026):</b> Developed full-stack React/Node.js web apps with JWT auth and MongoDB aggregations.`;
  }

  if (q.includes('skill') || q.includes('stack') || q.includes('tech') || q.includes('language')) {
    return `Prakhar's core technical stack includes:
    <br><br>
    • <b>Languages:</b> Python, JavaScript, TypeScript, C++, Java, SQL<br>
    • <b>Frontend:</b> React.js, Next.js, Tailwind CSS, Redux, HTML5/CSS3<br>
    • <b>Backend:</b> Node.js, Express.js, FastAPI, RESTful APIs<br>
    • <b>AI &amp; ML:</b> TensorFlow, PyTorch, Scikit-learn, LangChain, Milvus RAG, MediaPipe, OpenCV, Gemini API<br>
    • <b>Databases &amp; DevOps:</b> MongoDB, PostgreSQL, Docker, Git/GitHub, Linux`;
  }

  if (q.includes('why') || q.includes('hire') || q.includes('reason') || q.includes('select')) {
    return `Here is why Prakhar is an exceptional hire:
    <br><br>
    1. <b>Proven End-to-End Delivery:</b> Builds production full-stack systems from vector DB retrieval to interactive Next.js frontends.<br>
    2. <b>Real-World Internship Experience:</b> Delivered high-impact features at UpStride, Infosys Springboard, and WebStack Academy.<br>
    3. <b>Strong Algorithmic Foundation:</b> 250+ solved problems across LeetCode &amp; HackerRank, 5-star HackerRank badges in Java and C++, and 8.12 CGPA at LPU.<br>
    4. <b>Fast Adaptability:</b> Quickly adopts bleeding-edge AI tooling (CrewAI, LangChain, Milvus, WebRTC, Gemini).`;
  }

  if (q.includes('contact') || q.includes('email') || q.includes('phone') || q.includes('reach')) {
    return `You can reach Prakhar directly via:
    <br><br>
    📧 <b>Email:</b> <a href="mailto:prakharm1903@gmail.com" style="color:var(--accent);">prakharm1903@gmail.com</a><br>
    📱 <b>Phone:</b> +91 7869691849<br>
    💼 <b>LinkedIn:</b> <a href="https://linkedin.com/in/prakharm1903" target="_blank" style="color:var(--accent);">linkedin.com/in/prakharm1903</a><br>
    ⚡ <b>GitHub:</b> <a href="https://github.com/Prakhar1903" target="_blank" style="color:var(--accent);">github.com/Prakhar1903</a>`;
  }

  return `Thanks for asking! Prakhar is a B.Tech CSE student at Lovely Professional University (CGPA: 8.12) with experience in Full-Stack Development and AI/ML. You can explore his <a href="javascript:openApp('resume')" style="color:var(--accent);">Resume.exe</a>, test his <a href="javascript:openApp('projects')" style="color:var(--accent);">Projects/</a>, or connect on <a href="https://linkedin.com/in/prakharm1903" target="_blank" style="color:var(--accent);">LinkedIn</a>!`;
}

// ════════════════════════════════
// START MENU ENGINE
// ════════════════════════════════
function toggleStartMenu(e) {
  if (e) e.stopPropagation();
  const sm = document.getElementById('start-menu');
  if (!sm) return;
  const isShown = sm.style.display === 'flex';

  const cf = document.getElementById('calendar-flyout');
  if (cf) cf.style.display = 'none';

  sm.style.display = isShown ? 'none' : 'flex';
  if (!isShown) {
    playSound('open');
    updateUptime();
    const searchInp = document.getElementById('sm-search');
    if (searchInp) {
      searchInp.value = '';
      filterStartApps('');
      searchInp.focus();
    }
  } else {
    playSound('close');
  }
}

function filterStartApps(query) {
  const q = query.toLowerCase().trim();
  const items = document.querySelectorAll('.sm-item');
  items.forEach(it => {
    const text = it.textContent.toLowerCase();
    it.style.display = text.includes(q) ? 'flex' : 'none';
  });
}

// ════════════════════════════════
// CALENDAR & SYSTEM FLYOUT
// ════════════════════════════════
function toggleCalendar(e) {
  if (e) e.stopPropagation();
  const cf = document.getElementById('calendar-flyout');
  if (!cf) return;
  const isShown = cf.style.display === 'flex';

  const sm = document.getElementById('start-menu');
  if (sm) sm.style.display = 'none';

  cf.style.display = isShown ? 'none' : 'flex';
  if (!isShown) {
    playSound('open');
    renderCalendar();
  } else {
    playSound('close');
  }
}

function renderCalendar() {
  const calGrid = document.getElementById('cf-cal-grid');
  const cfTime  = document.getElementById('cf-time');
  const cfDate  = document.getElementById('cf-date-full');
  if (!calGrid) return;

  const now = new Date();
  if (cfTime) cfTime.textContent = now.toLocaleTimeString();
  if (cfDate) cfDate.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

  const year  = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = '';
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  days.forEach(d => { html += `<div class="cf-day-name">${d}</div>`; });

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="cf-day-cell other-month"></div>`;
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today;
    html += `<div class="cf-day-cell ${isToday ? 'cf-today' : ''}">${d}</div>`;
  }
  calGrid.innerHTML = html;

  const cpuVal = document.getElementById('cf-cpu-val');
  const cpuFill = document.getElementById('cf-cpu-fill');
  if (cpuVal && cpuFill) {
    const pct = Math.floor(10 + Math.random() * 14);
    cpuVal.textContent = pct + '%';
    cpuFill.style.width = pct + '%';
  }
}

// ════════════════════════════════
// UPTIME & SYSTEM REBOOT
// ════════════════════════════════
const bootTime = Date.now();
function updateUptime() {
  const el = document.getElementById('sm-uptime');
  if (!el) return;
  const sec = Math.floor((Date.now() - bootTime) / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const h = Math.floor(m / 60);
  el.textContent = `Uptime: ${h}h ${m % 60}m ${s}s`;
}

function rebootSystem() {
  playSound('close');
  const sm = document.getElementById('start-menu');
  if (sm) sm.style.display = 'none';
  closeAllWins();
  const desk = document.getElementById('desktop');
  const bs = document.getElementById('boot-screen');
  desk.style.display = 'none';
  bs.style.display = 'flex';
  bs.style.opacity = '1';
  document.getElementById('boot-log').innerHTML = '';
  document.getElementById('boot-bar').style.width = '0%';
  setTimeout(boot, 400);
}

// ════════════════════════════════
// BOOT SEQUENCE
// ════════════════════════════════
const BOOT_LINES = [
  '[  0.001]  BIOS:   PM-OS Portfolio System v2.0',
  '[  0.024]  CPU:    Full-Stack Core @ 8.12 GHz',
  '[  0.046]  MEM:    Loaded 250+ DSA algorithms',
  '[  0.091]  DISK:   Mounting /home/prakhar ...',
  '[  0.134]  NET:    Bridging LinkedIn · GitHub · Gmail',
  '[  0.267]  AI:     Loading CrewAI & LangChain modules ...',
  '[  0.401]  SVC:    Starting React 18 render engine',
  '[  0.544]  SVC:    Launching FastAPI backend services',
  '[  0.678]  AUTH:   JWT security layer initialized',
  '[  0.812]  DB:     MongoDB & Milvus connection established',
  '[  0.995]  SYS:    All systems nominal. Welcome to PM-OS v2.0! 🚀',
];

function boot() {
  const logBox = document.getElementById('boot-log');
  const bar    = document.getElementById('boot-bar');
  let i = 0;

  function step() {
    if (i >= BOOT_LINES.length) {
      setTimeout(() => {
        const bs = document.getElementById('boot-screen');
        bs.style.transition = 'opacity 0.65s ease';
        bs.style.opacity    = '0';
        setTimeout(() => {
          bs.style.display = 'none';
          const desk = document.getElementById('desktop');
          desk.style.display  = 'block';
          desk.style.opacity  = '0';
          desk.style.transition = 'opacity 0.45s ease';
          requestAnimationFrame(() => requestAnimationFrame(() => { desk.style.opacity = '1'; }));
          initCanvas();
          tickClock();
          setInterval(tickClock, 15000);
          setTimeout(() => openApp('about'),    450);
          setTimeout(() => openApp('terminal'), 900);
          setTimeout(() => {
            const h = document.getElementById('hint-overlay');
            if (h) h.style.display = 'none';
          }, 6000);
        }, 660);
      }, 350);
      return;
    }

    const line = document.createElement('div');
    line.className = 'boot-log-line';
    const colored = BOOT_LINES[i]
      .replace(/\[(.+?)\]/, '<span style="color:#1a4a1a">[$1]</span>');
    line.innerHTML = colored;
    logBox.appendChild(line);
    logBox.scrollTop = logBox.scrollHeight;
    bar.style.width = ((i + 1) / BOOT_LINES.length * 100) + '%';
    i++;
    setTimeout(step, 140 + Math.random() * 80);
  }

  setTimeout(step, 450);
}

// ════════════════════════════════
// ICON SELECTION & TOUCH HELPER
// ════════════════════════════════
function selectIcon(el) {
  document.querySelectorAll('.d-icon').forEach(i => i.classList.remove('selected'));
  el.classList.add('selected');
}

function handleIconClick(el, appId) {
  selectIcon(el);
  playSound('click');
  if (window.innerWidth <= 768) {
    openApp(appId);
  }
}

// ════════════════════════════════
// CONTEXT MENU
// ════════════════════════════════
function hideCtx() {
  const ctx = document.getElementById('ctx-menu');
  if (ctx) ctx.style.display = 'none';
}

// ════════════════════════════════
// INIT
// ════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Restore saved theme
  document.documentElement.setAttribute('data-theme', currentTheme);

  boot();

  const ctx = document.getElementById('ctx-menu');

  // Right-click on desktop only
  document.getElementById('desktop')?.addEventListener('contextmenu', e => {
    if (e.target.closest('.os-window') || e.target.closest('#taskbar') || e.target.closest('#icon-grid') || e.target.closest('#start-menu') || e.target.closest('#calendar-flyout')) return;
    e.preventDefault();
    if (ctx) {
      ctx.style.display = 'block';
      const x = Math.min(e.clientX, window.innerWidth  - ctx.offsetWidth  - 8);
      const y = Math.min(e.clientY, window.innerHeight - ctx.offsetHeight - 55);
      ctx.style.left = x + 'px';
      ctx.style.top  = y + 'px';
    }
  });

  // Global click dismissals
  document.addEventListener('click', e => {
    hideCtx();

    // Dismiss start menu if clicked outside
    const sm = document.getElementById('start-menu');
    const tbStart = document.getElementById('tb-start-btn');
    if (sm && sm.style.display === 'flex' && !sm.contains(e.target) && e.target !== tbStart && !tbStart?.contains(e.target)) {
      sm.style.display = 'none';
    }

    // Dismiss calendar if clicked outside
    const cf = document.getElementById('calendar-flyout');
    const tbClock = document.getElementById('tb-clock');
    if (cf && cf.style.display === 'flex' && !cf.contains(e.target) && e.target !== tbClock && !tbClock?.contains(e.target)) {
      cf.style.display = 'none';
    }
  });

  // Deselect icons on desktop click
  document.getElementById('desktop')?.addEventListener('click', e => {
    if (!e.target.closest('.d-icon')) {
      document.querySelectorAll('.d-icon').forEach(i => i.classList.remove('selected'));
    }
  });

  // Focus terminal input when terminal window is clicked
  document.addEventListener('click', e => {
    if (e.target.closest('#win-terminal')) {
      const inp = document.getElementById('term-input');
      if (inp) inp.focus();
    }
  });
});

