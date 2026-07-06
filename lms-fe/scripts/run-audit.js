const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '../audit-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { width: 320, height: 568, name: '320px-mobile' },
  { width: 375, height: 667, name: '375px-mobile' },
  { width: 390, height: 844, name: '390px-mobile' },
  { width: 414, height: 896, name: '414px-mobile' },
  { width: 768, height: 1024, name: '768px-tablet' },
  { width: 820, height: 1180, name: '820px-tablet' },
  { width: 1024, height: 768, name: '1024px-desktop' },
  { width: 1280, height: 800, name: '1280px-desktop' },
  { width: 1440, height: 900, name: '1440px-desktop' },
  { width: 1920, height: 1080, name: '1920px-desktop' }
];

const ROUTES = [
  { path: '/login', label: 'login' },
  { path: '/register', label: 'register' },
  { path: '/employee/dashboard', label: 'emp-dashboard', role: 'employee' },
  { path: '/employee/apply', label: 'emp-apply', role: 'employee' },
  { path: '/employee/requests', label: 'emp-requests', role: 'employee' },
  { path: '/employee/calendar', label: 'emp-calendar', role: 'employee' },
  { path: '/employee/profile', label: 'emp-profile', role: 'employee' },
  { path: '/admin/dashboard', label: 'admin-dashboard', role: 'admin' },
  { path: '/admin/requests', label: 'admin-requests', role: 'admin' },
  { path: '/admin/employees', label: 'admin-employees', role: 'admin' },
  { path: '/admin/policies', label: 'admin-policies', role: 'admin' },
  { path: '/admin/calendar', label: 'admin-calendar', role: 'admin' },
  { path: '/admin/audit-logs', label: 'admin-audit-logs', role: 'admin' },
  { path: '/admin/settings', label: 'admin-settings', role: 'admin' },
  { path: '/admin/profile', label: 'admin-profile', role: 'admin' },
];

async function runAudit() {
  console.log('🚀 Starting Comprehensive Playwright UI/UX Audit...');
  const browser = await chromium.launch({ headless: true });
  const report = {
    consoleErrors: [],
    networkErrors: [],
    overflowIssues: [],
    timestamp: new Date().toISOString(),
  };

  // 1. Employee Context Setup
  console.log('\n--- Setting up Employee Session ---');
  const empContext = await browser.newContext();
  const empPage = await empContext.newPage();

  empPage.on('console', msg => {
    if (msg.type() === 'error') report.consoleErrors.push(`[Employee] ${msg.text()}`);
  });
  empPage.on('response', res => {
    if (res.status() >= 400 && !res.url().includes('/favicon')) {
      report.networkErrors.push(`[Employee ${res.status()}] ${res.url()}`);
    }
  });

  await empPage.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  // Select employee role and submit demo
  await empPage.click('label[for="employee"]');
  await empPage.fill('input#email', 'sarah@leavexact.com');
  await empPage.fill('input#password', 'employee@123');
  await empPage.click('button[type="submit"]');
  await empPage.waitForNavigation({ timeout: 5000 }).catch(() => {});
  await empPage.waitForTimeout(1000);
  console.log('Employee logged in. Current URL:', empPage.url());

  // 2. Admin Context Setup
  console.log('\n--- Setting up Admin Session ---');
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();

  adminPage.on('console', msg => {
    if (msg.type() === 'error') report.consoleErrors.push(`[Admin] ${msg.text()}`);
  });
  adminPage.on('response', res => {
    if (res.status() >= 400 && !res.url().includes('/favicon')) {
      report.networkErrors.push(`[Admin ${res.status()}] ${res.url()}`);
    }
  });

  await adminPage.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await adminPage.click('label[for="admin"]');
  await adminPage.fill('input#email', 'admin@leavexact.com');
  await adminPage.fill('input#password', 'admin@123');
  await adminPage.click('button[type="submit"]');
  await adminPage.waitForNavigation({ timeout: 5000 }).catch(() => {});
  await adminPage.waitForTimeout(1000);
  console.log('Admin logged in. Current URL:', adminPage.url());

  // 3. Unauthenticated Context (for login/register)
  const anonContext = await browser.newContext();
  const anonPage = await anonContext.newPage();

  // Test routes
  for (const route of ROUTES) {
    console.log(`\n🔍 Auditing route: ${route.path} (${route.label})`);
    let activePage = anonPage;
    if (route.role === 'employee') activePage = empPage;
    if (route.role === 'admin') activePage = adminPage;

    await activePage.goto(`http://localhost:3000${route.path}`, { waitUntil: 'networkidle' }).catch(err => {
      console.error(`Error loading ${route.path}:`, err.message);
    });
    await activePage.waitForTimeout(500);

    // Test on 10 viewports
    for (const vp of VIEWPORTS) {
      await activePage.setViewportSize({ width: vp.width, height: vp.height });
      await activePage.waitForTimeout(200);

      // Check for horizontal overflow
      const hasOverflow = await activePage.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      if (hasOverflow) {
        report.overflowIssues.push({ route: route.path, viewport: vp.name, width: vp.width });
      }

      // Save screenshot for key viewports (375px, 768px, 1440px)
      if ([375, 768, 1440].includes(vp.width)) {
        const shotPath = path.join(SCREENSHOT_DIR, `${route.label}_${vp.name}.png`);
        await activePage.screenshot({ path: shotPath, fullPage: false });
      }
    }
  }

  // Save report JSON
  fs.writeFileSync(path.join(SCREENSHOT_DIR, 'audit-report.json'), JSON.stringify(report, null, 2));

  console.log('\n--- Audit Summary ---');
  console.log(`Console Errors: ${report.consoleErrors.length}`);
  console.log(`Network Errors: ${report.networkErrors.length}`);
  console.log(`Horizontal Overflow Issues: ${report.overflowIssues.length}`);
  if (report.overflowIssues.length > 0) {
    console.log('Overflow locations:', report.overflowIssues);
  }
  if (report.consoleErrors.length > 0) {
    console.log('Console errors sample:', report.consoleErrors.slice(0, 5));
  }

  await browser.close();
  console.log('✅ Audit run complete! Screenshots and report saved in audit-screenshots.');
}

runAudit();
