import fs from 'fs';

const indexHtml = fs.readFileSync('index.html', 'utf8');

// 1. Extract Head (up to </head>)
const headEnd = indexHtml.indexOf('</head>');
let headPart = indexHtml.substring(0, headEnd);
headPart = headPart.replace(
  '<title>e-SAMASTHA — Integrated ECE Engineering Simulation Platform</title>',
  '<title>e-SAMASTHA — Administrator Console & Engineering Workstations</title>'
);

// 2. Build dedicated Admin Topbar
const adminHeader = `
  <!-- ====================================================================
       ADMINISTRATOR PORTAL HEADER
       ==================================================================== -->
  <header class="topbar site-header theme-dark" role="banner" style="background: #0f172a !important; border-bottom: 1px solid #1e293b !important;">
    <div class="topbar-container">
      <div class="topbar-left">
        <a href="#/admin" class="brand" aria-label="e-Samastha Admin Portal" style="text-decoration: none; display: flex; align-items: center; gap: 8px;">
          <svg class="brand-icon" viewBox="0 0 40 40" width="30" height="30" aria-hidden="true">
            <rect width="40" height="40" rx="10" fill="#03b585"/>
            <path d="M 8 20 Q 14 12, 20 20 T 32 20" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
            <circle cx="8" cy="20" r="3" fill="#ffffff"/>
            <circle cx="32" cy="20" r="3" fill="#ffffff"/>
          </svg>
          <span class="brand-text" style="color: #ffffff; font-weight: 800;">e-Samastha</span>
          <span style="font-size: 11px; font-weight: 800; background: rgba(3, 181, 133, 0.2); color: #00F59B; border: 1px solid rgba(0, 245, 155, 0.4); padding: 2px 8px; border-radius: 12px; letter-spacing: 0.5px;">🛡️ ADMIN PORTAL</span>
        </a>

        <nav class="nav" id="mainNav" aria-label="Admin Workstations Navigation">
          <ul class="nav-list">
            <li class="nav-item"><a href="#/admin" class="nav-link active" id="nav-admin-console">🛡️ Admin Console</a></li>
            <li class="nav-item"><a href="#/create" class="nav-link" id="nav-circuits-env">🔌 Circuits Studio</a></li>
            <li class="nav-item"><a href="#/labs/arduino" class="nav-link" id="nav-arduino-env">⚡ Arduino Lab</a></li>
            <li class="nav-item"><a href="#/blocks" class="nav-link" id="nav-blocks-env">🧩 Blocks Studio</a></li>
            <li class="nav-item"><a href="#/code" class="nav-link" id="nav-code-env">💻 Code Runtime</a></li>
          </ul>
        </nav>
      </div>

      <!-- Mobile hamburger -->
      <button class="nav-mobile-toggle" id="navMobileToggle" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="mainNav">
        ☰
      </button>

      <div class="topbar-right">
        <!-- Hidden Network Pill for test compatibility -->
        <div class="network-status-pill online" id="networkStatusPill" style="display: none !important;">
          <span class="status-indicator-dot"></span>
          <span id="networkStatusText">Online</span>
        </div>

        <!-- Hidden Guest Controls (Admin portal never shows guest login) -->
        <div id="authGuestControls" style="display: none !important;">
          <button class="btn btn-invis" id="btnOpenLogin" style="display: none;">Log in</button>
          <button class="btn btn-primary" id="btnOpenSignup" style="display: none;">Sign up</button>
        </div>

        <!-- Authenticated Administrator Controls -->
        <div id="authUserControls" style="display: inline-flex; align-items: center; gap: 8px;">
          <div class="user-profile-badge" id="userProfileBadge" title="Logged in as Administrator (Pothumsanthosh@gmail.com)" style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: rgba(3, 181, 133, 0.2); border: 1px solid #03b585; border-radius: 20px; font-size: 12px; font-weight: 600; color: #e2e8f0;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #00F59B;" aria-hidden="true"></span>
            <span id="userDisplayName">pothumsanthosh</span>
          </div>
          <button class="btn btn-primary admin-logout-btn" id="btnLogout" title="Log out of Administrator Session" style="background: #ef4444; border-color: #ef4444; color: #ffffff; font-weight: 700; font-size: 12px; padding: 5px 12px; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 1px 3px rgba(239, 68, 68, 0.25);">
            <span>🚪</span> Admin Logout
          </button>
        </div>
      </div>
    </div>
  </header>
`;

// 3. Extract Main content wrapper and views
// In admin.html, view-admin is the initial active view (or view-admin-login if unauthenticated)
const mainStart = indexHtml.indexOf('<main class="view-container" id="main-content" tabindex="-1">');
const modalsStart = indexHtml.indexOf('<!-- ====================================================================\n       APPLICATION MODALS & OVERLAYS');

// We extract everything inside <main> and the modals and scripts:
let bodyPart = indexHtml.substring(mainStart);

// In admin.html, ensure admin return buttons are visible by default
bodyPart = bodyPart.replaceAll('class="btn btn-outline admin-only-return-btn" style="display: none;', 'class="btn btn-outline admin-only-return-btn" style="display: inline-flex;');
bodyPart = bodyPart.replaceAll('class="btn btn-outline admin-only-return-btn" id="studioAdminReturnBtn" style="display: none;', 'class="btn btn-outline admin-only-return-btn" id="studioAdminReturnBtn" style="display: inline-flex;');

// Construct final admin.html
const adminHtmlContent = `${headPart}</head>
<body class="admin-view-active is-admin-portal">
${adminHeader}
${bodyPart}`;

fs.writeFileSync('admin.html', adminHtmlContent, 'utf8');
console.log('admin.html generated successfully! Length:', adminHtmlContent.length);
