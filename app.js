// ── Storage ──
const STORE_KEY   = 'diet_data';
const GOAL_KEY    = 'diet_goal';
const PROFILE_KEY = 'diet_profile';

const loadData    = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY))   || {}; } catch { return {}; } };
const saveData    = d  => localStorage.setItem(STORE_KEY, JSON.stringify(d));
const loadGoal    = () => { try { return JSON.parse(localStorage.getItem(GOAL_KEY))    || null; } catch { return null; } };
const saveGoal    = g  => localStorage.setItem(GOAL_KEY, JSON.stringify(g));
const loadProfile = () => { try { return JSON.parse(localStorage.getItem(PROFILE_KEY)) || null; } catch { return null; } };
const saveProfile = p  => localStorage.setItem(PROFILE_KEY, JSON.stringify(p));

// ── State ──
let data    = loadData();
let goal    = loadGoal();
let profile = loadProfile();

const today      = new Date();
let currentYear  = today.getFullYear();
let currentMonth = today.getMonth();

// ── Helpers ──
const dateKey  = (y, m, d) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
const todayKey = ()        => dateKey(today.getFullYear(), today.getMonth(), today.getDate());

// ── BMR / TDEE (Mifflin-St Jeor 1990) ──
function calcBMR(gender, weight, height, age) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

document.getElementById('calcBMR').addEventListener('click', () => {
  const gender = document.querySelector('input[name="gender"]:checked').value;
  const age    = parseFloat(document.getElementById('bAge').value);
  const weight = parseFloat(document.getElementById('bWeight').value);
  const height = parseFloat(document.getElementById('bHeight').value);
  const actMul = parseFloat(document.getElementById('bActivity').value);

  if ([age, weight, height].some(isNaN)) { alert('請填寫完整資料'); return; }

  const bmr  = Math.round(calcBMR(gender, weight, height, age));
  const tdee = Math.round(bmr * actMul);

  document.getElementById('bmrVal').textContent  = bmr  + ' kcal/day';
  document.getElementById('tdeeVal').textContent = tdee + ' kcal/day';
  document.getElementById('bmrResult').style.display = 'block';

  profile = { gender, age, weight, height, actMul, bmr, tdee };
  saveProfile(profile);
});

// ── Burn mode (tdee | bmr) ──
let burnMode = localStorage.getItem('diet_burnMode') || 'tdee';

function applyBurnMode(mode) {
  burnMode = mode;
  localStorage.setItem('diet_burnMode', mode);
  document.getElementById('tdeeModeSection').style.display = mode === 'tdee' ? 'block' : 'none';
  document.getElementById('bmrModeSection').style.display  = mode === 'bmr'  ? 'block' : 'none';
  document.getElementById('modeTdeeBtn').classList.toggle('active', mode === 'tdee');
  document.getElementById('modeBmrBtn').classList.toggle('active',  mode === 'bmr');
  if (mode === 'bmr') recalcBmrBurn();
}

document.getElementById('modeTdeeBtn').addEventListener('click', () => applyBurnMode('tdee'));
document.getElementById('modeBmrBtn').addEventListener('click',  () => applyBurnMode('bmr'));

// ── Fill TDEE ──
document.getElementById('fillTdeeBtn').addEventListener('click', () => {
  if (!profile?.tdee) { alert('請先在「BMR / TDEE」tab 計算 TDEE'); return; }
  document.getElementById('inputBurn').value = profile.tdee;
});

// ── Fill BMR only ──
document.getElementById('fillBmrBtn').addEventListener('click', () => {
  if (!profile?.bmr) { alert('請先在「BMR / TDEE」tab 計算 BMR'); return; }
  document.getElementById('inputBurn').value = profile.bmr;
  document.getElementById('burnBreakdown').style.display = 'none';
});

// ── Steps → Calories (ACSM) ──
function stepsToKcal(steps, weightKg) {
  return Math.round((steps / 2000) * 0.57 * (weightKg * 2.20462));
}

function recalcBmrBurn() {
  if (burnMode !== 'bmr') return;
  const steps = parseInt(document.getElementById('inputSteps').value) || 0;
  const wkg   = profile?.weight || 60;
  const bmr   = profile?.bmr   || 0;

  document.getElementById('stepsResult').innerHTML = steps > 0
    ? `步數消耗 ≈ <strong>${stepsToKcal(steps, wkg).toLocaleString()} kcal</strong>`
    : '';

  if (bmr > 0) {
    const stepKcal = stepsToKcal(steps, wkg);
    const total    = bmr + stepKcal;
    document.getElementById('inputBurn').value = total;
    const breakdown = document.getElementById('burnBreakdown');
    if (steps > 0) {
      breakdown.style.display = 'block';
      breakdown.innerHTML = `BMR ${bmr.toLocaleString()} + 步數 ${stepKcal.toLocaleString()} = <strong>${total.toLocaleString()} kcal</strong>`;
    } else {
      breakdown.style.display = 'none';
    }
  }
}

document.getElementById('inputSteps').addEventListener('input', recalcBmrBurn);

// ── Calendar ──
function renderCalendar() {
  const grid   = document.getElementById('daysGrid');
  const title  = document.getElementById('calTitle');
  const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  title.textContent = `${currentYear} 年 ${months[currentMonth]}`;
  grid.innerHTML = '';

  const firstDay    = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const c = document.createElement('div');
    c.className = 'day-cell empty';
    grid.appendChild(c);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const key     = dateKey(currentYear, currentMonth, d);
    const isToday = key === todayKey();
    const cell    = document.createElement('div');
    cell.className = 'day-cell' + (isToday ? ' today' : '');

    const numEl = document.createElement('div');
    numEl.className = 'day-num';
    numEl.textContent = d;
    cell.appendChild(numEl);

    const entry = data[key];
    if (entry) {
      const net    = entry.intake - entry.burn; // negative = deficit (good)
      const kcalEl = document.createElement('div');
      kcalEl.className = 'day-kcal';
      kcalEl.textContent = (net > 0 ? '+' : '') + net.toLocaleString() + ' kcal';
      cell.appendChild(kcalEl);
      cell.classList.add(net < 0 ? 'deficit' : net > 0 ? 'surplus' : 'zero');

      if (entry.weight) {
        const wEl = document.createElement('div');
        wEl.className = 'day-weight';
        wEl.textContent = entry.weight + ' kg';
        cell.appendChild(wEl);
      }
    }

    cell.addEventListener('click', () => openModal(key));
    grid.appendChild(cell);
  }
}

// ── Stats Summary ──
function renderStats() {
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  let monthTotal = 0, monthDays = 0;

  const isCurrMonth = (currentYear === today.getFullYear() && currentMonth === today.getMonth());

  // Determine week range:
  // Current month → week containing today (Sun–Sat)
  // Historical month → last calendar week of that month (Sun–Sat)
  let wStart, wEnd, weekLabel;
  if (isCurrMonth) {
    wStart = new Date(today);
    wStart.setDate(today.getDate() - today.getDay());
    wEnd = new Date(wStart);
    wEnd.setDate(wStart.getDate() + 6);
    weekLabel = '本週';
  } else {
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    wEnd = new Date(lastDay);
    wStart = new Date(lastDay);
    wStart.setDate(lastDay.getDate() - lastDay.getDay());
    weekLabel = '末週';
  }

  let weekTotal = 0, weekDays = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const key   = dateKey(currentYear, currentMonth, d);
    const entry = data[key];
    if (!entry) continue;

    const deficit = entry.burn - entry.intake; // positive = deficit (good)
    monthTotal += deficit;
    monthDays++;

    const entryDate = new Date(currentYear, currentMonth, d);
    if (entryDate >= wStart && entryDate <= wEnd) {
      weekTotal += deficit;
      weekDays++;
    }
  }

  const monthAvg = monthDays > 0 ? Math.round(monthTotal / monthDays) : 0;
  const monthKg  = (monthTotal / 7700).toFixed(2);

  const grid = document.getElementById('statsGrid');
  grid.innerHTML = '';

  const cards = [
    { label: '本月記錄天數',    value: monthDays + ' 天',               cls: '' },
    { label: '本月累計缺口',    value: (monthTotal > 0 ? '+' : '') + monthTotal.toLocaleString() + ' kcal', cls: monthTotal >= 0 ? 'green' : 'red' },
    { label: '本月每日平均',    value: (monthAvg > 0 ? '+' : '') + monthAvg.toLocaleString() + ' kcal',    cls: monthAvg  >= 0 ? 'green' : 'red' },
    { label: '本月估算體重變化', value: (monthTotal >= 0 ? '-' : '+') + Math.abs(monthKg) + ' kg',          cls: monthTotal >= 0 ? 'green' : 'red' },
    { label: weekLabel + '記錄天數', value: weekDays + ' 天', cls: '' },
    { label: weekLabel + '累計缺口', value: (weekTotal > 0 ? '+' : '') + weekTotal.toLocaleString() + ' kcal', cls: weekTotal >= 0 ? 'green' : 'red' },
  ];

  for (const c of cards) {
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.innerHTML = `<div class="sc-label">${c.label}</div><div class="sc-value ${c.cls}">${c.value}</div>`;
    grid.appendChild(card);
  }
}

// ── Chart ──
function renderCharts() {
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const deficits = [], weights = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const key   = dateKey(currentYear, currentMonth, d);
    const entry = data[key];
    deficits.push(entry ? (entry.burn - entry.intake) : null);
    weights.push(entry && entry.weight ? entry.weight : null);
  }

  // Calculate target daily deficit for goal line
  let targetDaily = null;
  if (goal) {
    const goalKcal   = goal.kg * 7700;
    let cumDeficit   = 0;
    for (const v of Object.values(data)) cumDeficit += (v.burn - v.intake);
    const remaining  = Math.max(0, goalKcal - cumDeficit);
    const todayMs    = new Date(today.toDateString()).getTime();
    const deadlineMs = new Date(goal.date).getTime();
    const daysLeft   = Math.max(0, Math.round((deadlineMs - todayMs) / 86400000));
    targetDaily = daysLeft > 0 ? Math.round(remaining / daysLeft) : null;
  }

  drawDeficitChart(deficits, daysInMonth, targetDaily);

  const hasWeight = weights.some(w => w !== null);
  document.getElementById('weightChartSection').style.display = hasWeight ? 'block' : 'none';
  if (hasWeight) drawWeightChart(weights, daysInMonth);
}

function drawDeficitChart(deficits, days, targetDaily) {
  const canvas = document.getElementById('deficitChart');
  const dpr = window.devicePixelRatio || 1;
  const W   = canvas.parentElement.offsetWidth;
  const H   = 160;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const pad    = { top: 16, bottom: 28, left: 44, right: 28 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top  - pad.bottom;

  const vals   = deficits.filter(v => v !== null);
  const maxAbs = vals.length ? Math.max(200, ...vals.map(Math.abs)) : 500;
  const zeroY  = pad.top + chartH / 2;
  const slot   = chartW / days;
  const barW   = Math.max(2, slot * 0.65);

  // Grid lines
  ctx.strokeStyle = '#f0f0f0';
  ctx.lineWidth = 1;
  [0.25, 0.75].forEach(f => {
    const y = pad.top + chartH * f;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
  });

  // Zero line
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad.left, zeroY); ctx.lineTo(W - pad.right, zeroY); ctx.stroke();

  // Y-axis labels
  ctx.fillStyle = '#aaa';
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('-' + Math.round(maxAbs), pad.left - 4, pad.top + 10);
  ctx.fillText('0', pad.left - 4, zeroY + 4);
  ctx.fillText('+' + Math.round(maxAbs), pad.left - 4, pad.top + chartH - 2);

  // Bars
  deficits.forEach((deficit, i) => {
    if (deficit === null) return;
    const cx  = pad.left + i * slot + slot / 2;
    const x   = cx - barW / 2;
    const bH  = (Math.abs(deficit) / maxAbs) * (chartH / 2);

    if (deficit >= 0) {
      // deficit (good): bar goes UP from zero
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.roundRect(x, zeroY - bH, barW, bH, 2);
      ctx.fill();
    } else {
      // surplus (bad): bar goes DOWN from zero
      ctx.fillStyle = '#fca5a5';
      ctx.beginPath();
      ctx.roundRect(x, zeroY, barW, bH, 2);
      ctx.fill();
    }

    // Day label every 5 days and last day
    if ((i + 1) % 5 === 0 || i === 0 || i === days - 1) {
      ctx.fillStyle = '#bbb';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(i + 1, cx, H - pad.bottom + 14);
    }
  });

  // Target daily deficit line
  if (targetDaily !== null && targetDaily > 0) {
    const targetY = zeroY - (targetDaily / maxAbs) * (chartH / 2);
    if (targetY >= pad.top && targetY <= pad.top + chartH) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(pad.left, targetY);
      ctx.lineTo(W - pad.right, targetY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#f59e0b';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('目標', W - pad.right + 3, targetY + 3);
    }
  }
}

function drawWeightChart(weights, days) {
  const canvas = document.getElementById('weightChart');
  const dpr = window.devicePixelRatio || 1;
  const W   = canvas.parentElement.offsetWidth;
  const H   = 100;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const pad    = { top: 14, bottom: 24, left: 44, right: 10 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top  - pad.bottom;

  const vals    = weights.filter(v => v !== null);
  const minW    = Math.min(...vals) - 1;
  const maxW    = Math.max(...vals) + 1;
  const range   = maxW - minW || 1;
  const slot    = chartW / days;

  // Grid lines
  ctx.strokeStyle = '#f0f0f0';
  ctx.lineWidth = 1;
  [0.5].forEach(f => {
    const y = pad.top + chartH * f;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
  });

  // Y labels
  ctx.fillStyle = '#aaa';
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(maxW.toFixed(1), pad.left - 4, pad.top + 10);
  ctx.fillText(minW.toFixed(1), pad.left - 4, pad.top + chartH);

  // Line + dots
  ctx.strokeStyle = '#a78bfa';
  ctx.lineWidth = 2;
  ctx.beginPath();
  let first = true;
  weights.forEach((w, i) => {
    if (w === null) return;
    const x = pad.left + i * slot + slot / 2;
    const y = pad.top + ((maxW - w) / range) * chartH;
    if (first) { ctx.moveTo(x, y); first = false; }
    else        { ctx.lineTo(x, y); }
  });
  ctx.stroke();

  // Dots + labels
  weights.forEach((w, i) => {
    if (w === null) return;
    const x = pad.left + i * slot + slot / 2;
    const y = pad.top + ((maxW - w) / range) * chartH;
    ctx.fillStyle = '#7c3aed';
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#888';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(w, x, y - 6);
  });

  // X labels
  weights.forEach((_, i) => {
    if ((i + 1) % 5 === 0 || i === 0 || i === days - 1) {
      const x = pad.left + i * slot + slot / 2;
      ctx.fillStyle = '#bbb';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(i + 1, x, H - pad.bottom + 14);
    }
  });
}

// ── Progress ──
function renderProgress() {
  if (!goal) { document.getElementById('progressPanel').style.display = 'none'; return; }
  document.getElementById('progressPanel').style.display = 'block';

  const goalKcal   = goal.kg * 7700;
  const todayMs    = new Date(today.toDateString()).getTime();
  const deadlineMs = new Date(goal.date).getTime();
  const daysLeft   = Math.max(0, Math.round((deadlineMs - todayMs) / 86400000));

  let cumDeficit = 0;
  for (const v of Object.values(data)) cumDeficit += (v.burn - v.intake);

  const remaining   = Math.max(0, goalKcal - cumDeficit);
  const pct         = Math.min(100, (cumDeficit / goalKcal) * 100);
  const kgSoFar     = (cumDeficit / 7700).toFixed(2);
  const dailyNeeded = daysLeft > 0 ? Math.round(remaining / daysLeft) : 0;

  document.getElementById('statGoalTotal').textContent = goalKcal.toLocaleString() + ' kcal';
  document.getElementById('statCurrent').textContent   = cumDeficit.toLocaleString() + ' kcal';
  document.getElementById('statRemain').textContent    = remaining.toLocaleString() + ' kcal';
  document.getElementById('statDays').textContent      = daysLeft + ' 天';
  document.getElementById('statKgSoFar').textContent   = kgSoFar + ' 公斤';
  document.getElementById('progressFill').style.width  = pct.toFixed(1) + '%';

  let insight;
  if (cumDeficit >= goalKcal) {
    insight = `🎉 <strong>恭喜達標！</strong>已累計缺口 ${cumDeficit.toLocaleString()} kcal，約減 ${kgSoFar} 公斤！`;
  } else if (daysLeft === 0) {
    insight = `⏰ 今天是截止日！還差 <strong>${remaining.toLocaleString()} kcal</strong>（約 ${(remaining/7700).toFixed(2)} 公斤）。`;
  } else {
    insight = `接下來 <strong>${daysLeft} 天</strong>，每天平均需缺口 <strong>${dailyNeeded.toLocaleString()} kcal</strong>，才能達到減重 <strong>${goal.kg} 公斤</strong>的目標。`;
  }
  document.getElementById('insightText').innerHTML = insight;
}

// ── Modal ──
let activeKey = null;

function openModal(key) {
  activeKey = key;
  const [y, m, d] = key.split('-');
  document.getElementById('modalTitle').textContent = `${y}/${m}/${d} 熱量記錄`;

  const entry = data[key];
  document.getElementById('inputIntake').value = entry ? entry.intake         : '';
  document.getElementById('inputBurn').value   = entry ? entry.burn           : '';
  document.getElementById('inputSteps').value  = entry ? (entry.steps || '')  : '';
  document.getElementById('inputWeight').value = entry ? (entry.weight || '') : '';
  document.getElementById('stepsResult').innerHTML = '';
  document.getElementById('burnBreakdown').style.display = 'none';
  document.getElementById('modalDelete').style.display = entry ? 'block' : 'none';

  applyBurnMode(burnMode);
  if (burnMode === 'bmr' && entry?.steps) recalcBmrBurn();

  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  activeKey = null;
}

function refreshAll() {
  renderCalendar();
  renderStats();
  renderCharts();
  renderProgress();
}

document.getElementById('modalCancel').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});

document.getElementById('modalSave').addEventListener('click', () => {
  const intake = parseInt(document.getElementById('inputIntake').value);
  const burn   = parseInt(document.getElementById('inputBurn').value);
  const steps  = parseInt(document.getElementById('inputSteps').value)  || 0;
  const weight = parseFloat(document.getElementById('inputWeight').value) || null;
  if (isNaN(intake) || isNaN(burn)) { alert('請輸入有效數字'); return; }
  data[activeKey] = { intake, burn, steps, ...(weight ? { weight } : {}) };
  saveData(data);

  // Auto-update BMR/TDEE when weight changes
  if (weight && profile && weight !== profile.weight) {
    profile.weight = weight;
    profile.bmr    = Math.round(calcBMR(profile.gender, weight, profile.height, profile.age));
    profile.tdee   = Math.round(profile.bmr * profile.actMul);
    saveProfile(profile);
    loadProfileUI();
  }

  closeModal();
  refreshAll();
});

document.getElementById('modalDelete').addEventListener('click', () => {
  if (!confirm('確定刪除這天的記錄？')) return;
  delete data[activeKey];
  saveData(data);
  closeModal();
  refreshAll();
});

// ── Today button ──
document.getElementById('todayBtn').addEventListener('click', () => {
  currentYear  = today.getFullYear();
  currentMonth = today.getMonth();
  renderCalendar();
  renderStats();
  renderCharts();
  openModal(todayKey());
});

// ── Goal ──
document.getElementById('saveGoal').addEventListener('click', () => {
  const kg   = parseFloat(document.getElementById('goalKg').value);
  const date = document.getElementById('goalDate').value;
  if (!kg || !date) { alert('請填寫目標公斤與日期'); return; }
  goal = { kg, date };
  saveGoal(goal);
  renderProgress();
});

function loadGoalUI() {
  if (!goal) return;
  document.getElementById('goalKg').value   = goal.kg;
  document.getElementById('goalDate').value = goal.date;
}

// ── Load saved profile into BMR UI ──
function loadProfileUI() {
  if (!profile) return;
  document.querySelector(`input[name="gender"][value="${profile.gender}"]`).checked = true;
  document.getElementById('bAge').value      = profile.age;
  document.getElementById('bWeight').value   = profile.weight;
  document.getElementById('bHeight').value   = profile.height;
  document.getElementById('bActivity').value = profile.actMul;
  document.getElementById('bmrVal').textContent  = profile.bmr  + ' kcal/day';
  document.getElementById('tdeeVal').textContent = profile.tdee + ' kcal/day';
  document.getElementById('bmrResult').style.display = 'block';
}

// ── Navigation ──
document.getElementById('prevMonth').addEventListener('click', () => {
  if (--currentMonth < 0) { currentMonth = 11; currentYear--; }
  refreshAll();
});
document.getElementById('nextMonth').addEventListener('click', () => {
  if (++currentMonth > 11) { currentMonth = 0; currentYear++; }
  refreshAll();
});

// ── Tabs ──
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// Redraw charts on resize
window.addEventListener('resize', renderCharts);

// ── Init ──
loadProfileUI();
loadGoalUI();
applyBurnMode(burnMode);
refreshAll();
