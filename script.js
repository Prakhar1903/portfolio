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
      <a class="about-link" href="https://github.com/prakharm1903" target="_blank" rel="noopener">
        <span class="link-icon">⚡</span><span>github.com/prakharm1903</span>
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
            <li>Real-time market prices &amp; AI-powered crop recommendations</li>
            <li>Pest detection via TensorFlow.js &amp; multi-language support</li>
            <li>Responsive, performance-optimized experience for diverse users</li>
          </ul>
        </div>
        <div class="proj-footer">
          <div class="proj-stack">${tags(['ReactJS','NodeJS','Express','MongoDB','TailwindCSS','TensorFlow.js','Socket.io'])}</div>
          <div class="proj-links">
            <a class="proj-link gh" href="https://github.com/prakharm1903" target="_blank" rel="noopener">⚡ GitHub</a>
            <a class="proj-link live" href="#" target="_blank" rel="noopener">🌐 Live</a>
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
            <li>Responsive, interactive experience across all devices</li>
          </ul>
        </div>
        <div class="proj-footer">
          <div class="proj-stack">${tags(['ReactJS','NodeJS','Express','MongoDB','Bootstrap','JavaScript'])}</div>
          <div class="proj-links">
            <a class="proj-link gh" href="https://github.com/prakharm1903" target="_blank" rel="noopener">⚡ GitHub</a>
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
            <div class="tl-role">AI Web Chatbot Automation</div>
            <div class="tl-company">UpStride</div>
          </div>
          <div class="tl-date">Apr '26 – Jun '26</div>
        </div>
        <div class="tl-desc">
          <ul>
            <li>Designed &amp; built a full-stack AI customer engagement platform with unified real-time dashboard</li>
            <li>Built multi-agent AI layer (CrewAI) — support, lead qualification, analytics &amp; intent detection</li>
            <li>Delivered live KPI analytics dashboard with FastAPI, MongoDB &amp; JWT-based authentication</li>
          </ul>
        </div>
        <div class="tl-footer">
          <div class="tl-stack">${tags(['ReactJS','Vite','FastAPI','Python','MongoDB','CrewAI','Recharts','JWT'])}</div>
          <a class="tl-link" href="#" target="_blank" rel="noopener" title="View UpStride Internship Certificate">📜 Certificate ↗</a>
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
            <li>Built market intelligence dashboard for real-time consumer sentiment analysis (Amazon, YouTube, News)</li>
            <li>Implemented Sentiment War Room, predictive trend forecasting &amp; AI chatbot for market analysis</li>
            <li>Secure platform with JWT auth, one-click PDF/Excel exports &amp; interactive data visualizations</li>
          </ul>
        </div>
        <div class="tl-footer">
          <div class="tl-stack">${tags(['React 18','Vite','Tailwind CSS','FastAPI','MongoDB','Pandas','Chart.js','Python'])}</div>
          <a class="tl-link" href="#" target="_blank" rel="noopener" title="View Infosys Internship Certificate">📜 Certificate ↗</a>
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
          <a class="tl-link" href="#" target="_blank" rel="noopener" title="View WSA Internship Certificate">📜 Certificate ↗</a>
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
    ${item('🕹️', 'Code-A-Haunt 24-hour Hackathon', 'Participated in a 24-hour hackathon demonstrating rapid prototyping.', 'Mar 2024', '🔗 Hackathon Link ↗', '#')}
    ${item('🎮', 'Byte-Bash 36-hour Hackathon', 'Participated in a 36-hour team hackathon.', 'Nov 2023')}

    <div class="section-hdr" style="margin-top:24px;">Training &amp; Certifications</div>
    ${item('🤖', 'W3grads – Full Stack (MERN) with Gen AI', 'Built dynamic full-stack web apps using MERN, focusing on RESTful APIs and Gen AI integration.', 'Jun 2025 – Jul 2025', '📜 View Certificate ↗', '#')}
    ${item('📜', 'Developing Front End Apps with React', 'IBM / Coursera certification in modern React application development.', 'Oct 2025', '📜 View Certificate ↗', '#')}
    ${item('📜', 'Introduction to Web Development with HTML5, CSS3 &amp; JS', 'Core web standards and modern frontend foundation.', 'Oct 2025', '📜 View Certificate ↗', '#')}
    ${item('☁️', 'NPTEL — Cloud Computing', 'Comprehensive foundational cloud computing principles and architecture.', 'May 2025', '📜 View Certificate ↗', '#')}
    ${item('☕', 'Java Programming', 'Object-Oriented Programming and advanced Java development concepts.', 'May 2025', '📜 View Certificate ↗', '#')}
    ${item('🧠', 'Data Structures and Algorithms', 'Advanced algorithm design, time/space complexity analysis.', 'May 2025', '📜 View Certificate ↗', '#')}`;
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
      <a class="c-link gh" href="https://github.com/prakharm1903" target="_blank" rel="noopener">
        <span class="c-link-icon">⚡</span>
        <div><div class="c-link-label">github.com/prakharm1903</div><div class="c-link-sub">GitHub — explore my code</div></div>
      </a>
      <a class="c-link phone" href="tel:+917869691849">
        <span class="c-link-icon">📱</span>
        <div><div class="c-link-label">+91 7869691849</div><div class="c-link-sub">Mobile — WhatsApp available</div></div>
      </a>
    </div>
    <div class="open-badge"><span class="dot-green"></span>Available for internships &amp; full-time roles</div>`;
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

const WELCOME = `<span style="color:#00f5ff;font-size:0.73rem;line-height:1.2;display:block;">
██████╗ ███╗   ███╗      ██████╗ ███████╗
██╔══██╗████╗ ████║     ██╔═══██╗██╔════╝
██████╔╝██╔████╔██║     ██║   ██║███████╗
██╔═══╝ ██║╚██╔╝██║     ██║   ██║╚════██║
██║     ██║ ╚═╝ ██║     ╚██████╔╝███████║
╚═╝     ╚═╝     ╚═╝      ╚═════╝ ╚══════╝
</span><span class="t-dim">─────────────────────────────────────────────</span>
<span class="t-info">PM-OS Portfolio Operating System v1.0.0</span>
<span class="t-dim">Logged in as: </span><span class="t-white">prakhar</span>  <span class="t-dim">Host: </span><span class="t-white">LPU · B.Tech CSE</span>
<span class="t-dim">─────────────────────────────────────────────</span>
Type <span class="t-info">help</span> for available commands · <span class="t-info">neofetch</span> for system info
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
  <span class="t-info">cat &lt;file&gt;</span>       Read a file  <span class="t-dim">(about.txt | contact.txt | skills.txt)</span>
  <span class="t-info">open &lt;app&gt;</span>       Open an app window
  <span class="t-info">date</span>             Current date &amp; time
  <span class="t-info">echo &lt;text&gt;</span>      Print text
  <span class="t-info">history</span>          Show command history
  <span class="t-info">clear</span>            Clear terminal
<span class="t-dim">────────────────────────────────────</span>
Apps: <span class="t-info">about</span> · <span class="t-info">projects</span> · <span class="t-info">experience</span> · <span class="t-info">skills</span> · <span class="t-info">education</span> · <span class="t-info">achievements</span> · <span class="t-info">contact</span>`);
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
  ⚡  github.com/prakharm1903`);
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
<span class="t-info">drwxr-xr-x</span>  <span class="t-white">About.exe      </span><span class="t-dim">Full-stack Dev · AI Enthusiast</span>
<span class="t-info">drwxr-xr-x</span>  <span class="t-white">Projects/      </span><span class="t-dim">KrishiGyan · Mockneto</span>
<span class="t-info">drwxr-xr-x</span>  <span class="t-white">Experience/    </span><span class="t-dim">UpStride · Infosys · WSA</span>
<span class="t-info">-rw-r--r--</span>  <span class="t-white">Skills.json    </span><span class="t-dim">Java, C++, React, Node, FastAPI...</span>
<span class="t-info">-rw-r--r--</span>  <span class="t-white">Education.log  </span><span class="t-dim">LPU B.Tech CSE · CGPA 8.12</span>
<span class="t-info">drwxr-xr-x</span>  <span class="t-white">Awards/        </span><span class="t-dim">Hackathons · HackerRank · 250+ DSA</span>
<span class="t-info">-rwxr-xr-x</span>  <span class="t-white">Contact.sh     </span><span class="t-dim">prakharm1903@gmail.com</span>
<span class="t-info">-rwxr-xr-x</span>  <span class="t-white">Terminal       </span><span class="t-dim">← You are here</span>`);
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
GitHub:   github.com/prakharm1903
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
      } else {
        tLine(out, `<span class="t-err">cat: ${esc(args[0] || '(no file)')}: No such file</span><br><span class="t-dim">Try: about.txt · contact.txt · skills.txt</span>`);
      }
      break;
    }

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
// CANVAS WALLPAPER
// ════════════════════════════════
function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Particles
  const stars = Array.from({ length: 130 }, () => ({
    x:       Math.random() * canvas.width,
    y:       Math.random() * canvas.height,
    r:       Math.random() * 1.3 + 0.2,
    alpha:   Math.random() * 0.5 + 0.06,
    speedY: -(Math.random() * 0.25 + 0.04),
    speedX:  (Math.random() - 0.5) * 0.08,
    phase:   Math.random() * Math.PI * 2
  }));

  // Grid (drawn once, reused as offscreen)
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

  let frame = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ambient glow
    const grad = ctx.createRadialGradient(
      canvas.width * 0.5, canvas.height * 0.35, 0,
      canvas.width * 0.5, canvas.height * 0.35, canvas.width * 0.55
    );
    grad.addColorStop(0, 'rgba(10,20,55,0.35)');
    grad.addColorStop(1, 'rgba(3,8,16,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid overlay
    ctx.drawImage(gridCanvas, 0, 0);

    // Stars
    frame++;
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

    requestAnimationFrame(draw);
  }
  draw();
}

// ════════════════════════════════
// BOOT SEQUENCE
// ════════════════════════════════
const BOOT_LINES = [
  '[  0.001]  BIOS:   PM-OS Portfolio System v1.0',
  '[  0.024]  CPU:    Full-Stack Core @ 8.12 GHz',
  '[  0.046]  MEM:    Loaded 250+ DSA algorithms',
  '[  0.091]  DISK:   Mounting /home/prakhar ...',
  '[  0.134]  NET:    Bridging LinkedIn · GitHub · Gmail',
  '[  0.267]  AI:     Loading CrewAI neural modules ...',
  '[  0.401]  SVC:    Starting React 18 render engine',
  '[  0.544]  SVC:    Launching FastAPI backend services',
  '[  0.678]  AUTH:   JWT security layer initialized',
  '[  0.812]  DB:     MongoDB connection established',
  '[  0.995]  SYS:    All systems nominal. Welcome! 🚀',
];

function boot() {
  const logBox = document.getElementById('boot-log');
  const bar    = document.getElementById('boot-bar');
  let i = 0;

  function step() {
    if (i >= BOOT_LINES.length) {
      // Transition to desktop
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
          // Auto-open welcome windows
          setTimeout(() => openApp('about'),    450);
          setTimeout(() => openApp('terminal'), 900);
          // Hide hint after 5s
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
    // Color the timestamp bracket
    const colored = BOOT_LINES[i]
      .replace(/\[(.+?)\]/, '<span style="color:#1a4a1a">[$1]</span>');
    line.innerHTML = colored + (i === BOOT_LINES.length - 1 ? '' : '');
    logBox.appendChild(line);
    logBox.scrollTop = logBox.scrollHeight;
    bar.style.width = ((i + 1) / BOOT_LINES.length * 100) + '%';
    i++;
    setTimeout(step, 150 + Math.random() * 90);
  }

  setTimeout(step, 500);
}

// ════════════════════════════════
// ICON SELECTION
// ════════════════════════════════
function selectIcon(el) {
  document.querySelectorAll('.d-icon').forEach(i => i.classList.remove('selected'));
  el.classList.add('selected');
}

// ════════════════════════════════
// CONTEXT MENU
// ════════════════════════════════
function hideCtx() {
  document.getElementById('ctx-menu').style.display = 'none';
}

// ════════════════════════════════
// INIT
// ════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  boot();

  const ctx = document.getElementById('ctx-menu');

  // Right-click on desktop only
  document.getElementById('desktop')?.addEventListener('contextmenu', e => {
    if (e.target.closest('.os-window') || e.target.closest('#taskbar') || e.target.closest('#icon-grid')) return;
    e.preventDefault();
    ctx.style.display = 'block';
    const x = Math.min(e.clientX, window.innerWidth  - ctx.offsetWidth  - 8);
    const y = Math.min(e.clientY, window.innerHeight - ctx.offsetHeight - 55);
    ctx.style.left = x + 'px';
    ctx.style.top  = y + 'px';
  });

  // Hide ctx on any click
  document.addEventListener('click', hideCtx);

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
