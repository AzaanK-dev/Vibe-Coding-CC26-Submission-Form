/**
 * Code//Connect'26 — Vibe Coding Hackathon Project Submission
 * script.js — Frontend logic
 *
 * SETUP: Replace APPS_SCRIPT_URL with your deployed Google Apps Script web-app URL.
 */

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw7HCZ5EWPUO57ZmcQ1SLDc9XrKKG4-22KtlQBPf3vM13v4atZVaaya76ZPSNgVWJMrWw/exec';

// Deadline: 18 October 2026, 22:00:00 PKT (UTC+5)
const DEADLINE = new Date('2026-10-18T17:00:00Z'); // 10 PM PKT = 5 PM UTC

// ─── STATE ───────────────────────────────────────────────────────────────────

let submitting = false;
const MAX_MEMBERS = 4;

// One link field, reconfigured per project type.
const LINK_CONFIG = {
  'Web Application': {
    label: 'Live Product Link',
    hint: '(deployed/hosted URL)',
    placeholder: 'https://yourapp.com',
    required: true,
    msg: 'Live product link is required for web applications.'
  },
  'Mobile Application': {
    label: 'APK Download Link',
    hint: '(Google Drive, Dropbox, etc. — must be public)',
    placeholder: 'https://drive.google.com/…',
    required: true,
    msg: 'APK download link is required for mobile applications.'
  },
  'Desktop Application': {
    label: 'Application Download Link',
    hint: '(installer, executable or Docker package)',
    placeholder: 'https://github.com/username/repo/releases',
    required: true,
    msg: 'Download link is required for desktop applications.'
  },
  'Other': {
    label: 'Live Product Link',
    hint: '(deployed/hosted URL — if applicable)',
    placeholder: 'https://yourapp.com',
    required: false,
    msg: ''
  }
};

// ─── DEADLINE TICKER ─────────────────────────────────────────────────────────

function updateDeadlineBanner() {
  const banner = document.getElementById('deadlineBanner');
  const text   = document.getElementById('deadlineText');
  const now    = new Date();
  const diff   = DEADLINE - now;

  if (diff <= 0) {
    banner.className = 'deadline-banner closed';
    text.textContent = '⛔ Submissions are now closed. The deadline has passed.';
    disableForm();
    return;
  }

  banner.className = diff < 3 * 60 * 60 * 1000 ? 'deadline-banner' : 'deadline-banner safe';

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  if (h > 48) {
    const days = Math.floor(h / 24);
    text.textContent = `Deadline: 18 Oct 2026, 10:00 PM PKT — ${days}d ${h % 24}h remaining`;
  } else {
    const pad = n => String(n).padStart(2, '0');
    text.textContent = `Deadline: 18 Oct 2026, 10:00 PM PKT — ${pad(h)}:${pad(m)}:${pad(s)} remaining`;
  }
}

function disableForm() {
  const form = document.getElementById('submissionForm');
  if (!form) return;
  form.querySelectorAll('input, textarea, select, button').forEach(el => el.disabled = true);
  showMsg('error', '⛔ The submission deadline (18 October 2026, 10:00 PM PKT) has passed. Submissions are closed.');
}

// ─── CONDITIONAL FIELDS ──────────────────────────────────────────────────────

function handleProblemDomain() {
  const val = document.getElementById('problemDomain').value;
  const err = document.getElementById('err-problemDomain');
  err.textContent = val ? '' : 'Please select a problem domain.';
  document.getElementById('problemDomain').classList.toggle('invalid', !val);
  return !!val;
}

function handleProjectTypeChange() {
  const type = document.getElementById('projectType').value;
  // Link field is always visible; with no type selected it shows the Live Product Link
  const cfg  = LINK_CONFIG[type] || LINK_CONFIG['Web Application'];

  const linkGroup   = document.getElementById('projectLinkGroup');
  const otherGroup  = document.getElementById('otherTypeGroup');
  const mobileNote  = document.getElementById('mobileNote');
  const desktopNote = document.getElementById('desktopNote');

  // Reset
  otherGroup.classList.add('hidden');
  setReq(otherGroup, false);
  mobileNote.classList.add('hidden');
  desktopNote.classList.add('hidden');

  // Reconfigure the single link field
  document.getElementById('projectLinkLabel').textContent = cfg.label;
  document.getElementById('projectLinkHint').textContent  = cfg.hint;
  document.getElementById('projectLinkStar').classList.toggle('hidden', !cfg.required);
  const input = document.getElementById('projectLink');
  input.placeholder = cfg.placeholder;
  input.required = cfg.required;
  document.getElementById('err-projectLink').textContent = '';
  input.classList.remove('invalid');
  linkGroup.classList.remove('hidden');

  if (type === 'Mobile Application')  mobileNote.classList.remove('hidden');
  if (type === 'Desktop Application') desktopNote.classList.remove('hidden');
  if (type === 'Other') {
    otherGroup.classList.remove('hidden');
    setReq(otherGroup, true);
  }
}

function setReq(group, required) {
  if (!group) return;
  group.querySelectorAll('input, textarea, select').forEach(el => {
    el.required = required;
  });
}

// ─── MEMBER MANAGEMENT ───────────────────────────────────────────────────────

function addMember() {
  const container = document.getElementById('membersContainer');
  const current   = container.querySelectorAll('.member-row').length;
  if (current >= MAX_MEMBERS) return;

  const row = document.createElement('div');
  row.className = 'member-row';
  row.innerHTML = `
    <input type="text" name="member[]" placeholder="Member ${current + 1} full name" maxlength="120" class="member-input">
    <button type="button" class="member-remove" aria-label="Remove member"><i class="fa-solid fa-xmark"></i></button>
  `;
  row.querySelector('.member-remove').addEventListener('click', () => {
    row.remove();
    reindexMembers();
    updateAddBtn();
  });
  container.appendChild(row);
  updateAddBtn();
}

function reindexMembers() {
  document.querySelectorAll('.member-input').forEach((inp, i) => {
    inp.placeholder = `Member ${i + 1} full name`;
  });
}

function updateAddBtn() {
  const count = document.querySelectorAll('.member-row').length;
  const btn   = document.getElementById('addMemberBtn');
  btn.disabled = count >= MAX_MEMBERS;
}

// ─── CHAR COUNTERS ───────────────────────────────────────────────────────────

function attachCounter(textareaId, counterId) {
  const ta  = document.getElementById(textareaId);
  const cnt = document.getElementById(counterId);
  if (!ta || !cnt) return;
  ta.addEventListener('input', () => { cnt.textContent = ta.value.length; });
}

// ─── VALIDATION ──────────────────────────────────────────────────────────────

function clearErrors() {
  document.querySelectorAll('.err').forEach(el => el.textContent = '');
  document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
}

function setError(fieldId, errId, msg) {
  const el = document.getElementById(fieldId);
  const er = document.getElementById(errId);
  if (el) el.classList.add('invalid');
  if (er) er.textContent = msg;
  return false;
}

function isValidURL(str) {
  try { new URL(str); return true; } catch { return false; }
}

function validate() {
  clearErrors();
  let ok = true;

  // Team name
  const teamName = document.getElementById('teamName').value.trim();
  if (!teamName) ok = setError('teamName','err-teamName','Team name is required.') && ok;

  // Lead name
  const leadName = document.getElementById('leadName').value.trim();
  if (!leadName) ok = setError('leadName','err-leadName','Team lead name is required.') && ok;

  // Lead email
  const leadEmail = document.getElementById('leadEmail').value.trim();
  if (!leadEmail) {
    ok = setError('leadEmail','err-leadEmail','Lead email is required.') && ok;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadEmail)) {
    ok = setError('leadEmail','err-leadEmail','Enter a valid email address.') && ok;
  }

  // Members
  const memberInputs = document.querySelectorAll('#membersContainer .member-input');
  let filledMembers = 0;
  memberInputs.forEach(inp => { if (inp.value.trim()) filledMembers++; });
  if (filledMembers < 2) {
    document.getElementById('err-members').textContent = 'At least 2 team members are required.';
    ok = false;
  }

  // Project name
  const projectName = document.getElementById('projectName').value.trim();
  if (!projectName) ok = setError('projectName','err-projectName','Project name is required.') && ok;

  // Problem domain
  if (!document.getElementById('problemDomain').value) {
    ok = setError('problemDomain','err-problemDomain','Please select a problem domain.') && ok;
  }

  // Project type
  const projectType = document.getElementById('projectType').value;
  if (!projectType) ok = setError('projectType','err-projectType','Select a project type.') && ok;

  // Other type
  if (projectType === 'Other') {
    const ot = document.getElementById('otherType').value.trim();
    if (!ot) ok = setError('otherType','err-otherType','Please specify the project type.') && ok;
  }

  // Description
  const desc = document.getElementById('projectDesc').value.trim();
  if (!desc) ok = setError('projectDesc','err-projectDesc','Project description is required.') && ok;

  // Key features
  const features = document.getElementById('keyFeatures').value.trim();
  if (!features) ok = setError('keyFeatures','err-keyFeatures','Key features are required.') && ok;

  // Project link (single field; label/requirement depends on project type)
  const cfg  = LINK_CONFIG[projectType];
  const link = document.getElementById('projectLink').value.trim();
  if (cfg) {
    if (!link && cfg.required) {
      ok = setError('projectLink','err-projectLink',cfg.msg) && ok;
    } else if (link && !isValidURL(link)) {
      ok = setError('projectLink','err-projectLink','Enter a valid URL (include https://).') && ok;
    }
  }

  // Demo link (optional, validate if filled)
  const demoVal = document.getElementById('demoLink').value.trim();
  if (demoVal && !isValidURL(demoVal)) {
    ok = setError('demoLink','err-demoLink','Enter a valid URL (include https://).') && ok;
  }

  // GitHub (required)
  const gh = document.getElementById('githubLink').value.trim();
  if (!gh) {
    ok = setError('githubLink','err-githubLink','GitHub repository link is required.') && ok;
  } else if (!isValidURL(gh)) {
    ok = setError('githubLink','err-githubLink','Enter a valid URL (include https://).') && ok;
  } else if (!gh.includes('github.com')) {
    ok = setError('githubLink','err-githubLink','Must be a github.com URL.') && ok;
  }

  // Demo instructions
  const demoInstr = document.getElementById('demoInstructions').value.trim();
  if (!demoInstr) ok = setError('demoInstructions','err-demoInstructions','Demo instructions are required.') && ok;

  // Tech stack
  const tech = document.getElementById('techStack').value.trim();
  if (!tech) ok = setError('techStack','err-techStack','Tools & technologies are required.') && ok;

  // AI usage
  const ai = document.getElementById('aiUsage').value.trim();
  if (!ai) ok = setError('aiUsage','err-aiUsage','AI usage disclosure is required.') && ok;

  // Confirm checkbox
  if (!document.getElementById('confirmCheck').checked) {
    document.getElementById('err-confirmCheck').textContent = 'You must confirm before submitting.';
    ok = false;
  }

  return ok;
}

// ─── COLLECT DATA ────────────────────────────────────────────────────────────

function collectFormData() {
  const members = [];
  document.querySelectorAll('#membersContainer .member-input').forEach(inp => {
    const v = inp.value.trim();
    if (v) members.push(v);
  });

  const projectType = document.getElementById('projectType').value;
  const domain      = document.getElementById('problemDomain').value;

  return {
    teamName:         document.getElementById('teamName').value.trim(),
    leadName:         document.getElementById('leadName').value.trim(),
    leadEmail:        document.getElementById('leadEmail').value.trim(),
    members:          members.join(', '),
    projectName:      document.getElementById('projectName').value.trim(),
    problemDomain:    domain,
    projectType:      projectType,
    otherType:        document.getElementById('otherType').value.trim(),
    projectDesc:      document.getElementById('projectDesc').value.trim(),
    keyFeatures:      document.getElementById('keyFeatures').value.trim(),
    projectLink:      document.getElementById('projectLink').value.trim(),
    demoLink:         document.getElementById('demoLink').value.trim(),
    githubLink:       document.getElementById('githubLink').value.trim(),
    demoInstructions: document.getElementById('demoInstructions').value.trim(),
    techStack:        document.getElementById('techStack').value.trim(),
    aiUsage:          document.getElementById('aiUsage').value.trim(),
  };
}

// ─── UI HELPERS ──────────────────────────────────────────────────────────────

function showMsg(type, msg) {
  const el = document.getElementById('formMsg');
  el.className = `form-msg ${type}`;
  el.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'circle-check' : 'circle-exclamation'}"></i><span>${msg}</span>`;
  el.classList.remove('hidden');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function setLoading(state) {
  submitting = state;
  const btn    = document.getElementById('submitBtn');
  const text   = document.getElementById('btnText');
  const loader = document.getElementById('btnLoader');
  btn.disabled = state;
  text.classList.toggle('hidden', state);
  loader.classList.toggle('hidden', !state);
}

// ─── SUBMIT ──────────────────────────────────────────────────────────────────

async function handleSubmit(e) {
  e.preventDefault();
  if (submitting) return;

  // Deadline re-check
  if (new Date() >= DEADLINE) {
    disableForm();
    return;
  }

  if (!validate()) {
    const firstErr = document.querySelector('.invalid, .err:not(:empty)');
    if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  setLoading(true);
  document.getElementById('formMsg').classList.add('hidden');

  const payload = collectFormData();

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Apps Script requires no-cors
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // no-cors means we can't read the response body —
    // treat the completed fetch as success and verify via email confirmation
    setLoading(false);
    showSuccess();

  } catch (err) {
    setLoading(false);
    showMsg('error', `⚠️ Submission failed: ${err.message}. Please try again or contact the organising committee.`);
  }
}

function showSuccess() {
  const form = document.getElementById('submissionForm');
  form.style.display = 'none';

  const main = document.querySelector('main.wrap');
  main.innerHTML = `
    <div class="card" style="text-align:center; padding:3rem 2rem;">
      <div style="font-size:3.5rem; margin-bottom:1rem;">🎉</div>
      <h2 style="font-family:var(--font-head); font-weight:400; text-transform:uppercase; letter-spacing:0.03em; font-size:2rem; margin-bottom:0.6rem; color:var(--clr-success);">Project Submitted!</h2>
      <p style="color:var(--clr-subtext); max-width:480px; margin:0 auto 1.4rem; line-height:1.65;">
        Your project has been submitted to <strong style="color:var(--clr-text);">Code//Connect'26</strong>.
        The organising committee will be in touch with evaluation updates.
      </p>
      <p style="color:var(--clr-subtext); font-size:0.85rem;">
        Submission received at: <strong style="color:var(--clr-text);">${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })} PKT</strong>
      </p>
    </div>
  `;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  // Deadline ticker
  updateDeadlineBanner();
  setInterval(updateDeadlineBanner, 1000);

  // Disable form if already past deadline on load
  if (new Date() >= DEADLINE) { disableForm(); }

  document.getElementById('problemDomain').addEventListener('change', handleProblemDomain);
  document.getElementById('projectType').addEventListener('change', handleProjectTypeChange);
  document.getElementById('addMemberBtn').addEventListener('click', addMember);

  // Char counters
  attachCounter('projectDesc', 'descCount');
  attachCounter('keyFeatures', 'featCount');
  attachCounter('demoInstructions', 'demoCount');

  // Form submit
  document.getElementById('submissionForm').addEventListener('submit', handleSubmit);
});