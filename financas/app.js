// =============================================================
// Controle Financeiro — app.js
// =============================================================

// ============ CONSTANTS ============
const STORAGE_KEY = 'finance-control-v2';
const LEGACY_KEY = 'finance-control-v1';

const DEFAULT_CATEGORIES = [
  { name: 'Alimentação',  color: '#ef4444', budget: 0, keywords: ['mercado','supermercado','padaria','restaurante','ifood','uber eats','rappi','lanchonete','feira','hortifruti','açougue','delivery','pizzaria','café','cafe','bar','almoço','almoco','jantar','food','burger','mcdonalds','subway','starbucks','madero','outback','habib','doceria','sorveteria','carrefour','extra','pao de acucar','pão de açúcar','assaí','assai','atacadao','atacadão','sams club','dia','bistek'] },
  { name: 'Transporte',   color: '#f59e0b', budget: 0, keywords: ['uber','99','taxi','táxi','gasolina','posto','combustivel','combustível','estacionamento','pedágio','pedagio','metrô','metro','ônibus','onibus','bilhete','cabify','shell','ipiranga','br mania','bilhete unico','cptm','viação','viacao','estapar','autopass'] },
  { name: 'Moradia',      color: '#8b5cf6', budget: 0, keywords: ['aluguel','condominio','condomínio','iptu','financiamento imobiliário','financiamento imobiliario'] },
  { name: 'Contas',       color: '#3b82f6', budget: 0, keywords: ['luz','energia','enel','cpfl','elektro','light','água','agua','sabesp','sanepar','embasa','copasa','cedae','internet','vivo','claro','tim','oi','net','celular','telefone','gás','gas','comgas','congás'] },
  { name: 'Saúde',        color: '#10b981', budget: 0, keywords: ['farmácia','farmacia','drogaria','drogasil','pacheco','pague menos','raia','ultrafarma','médico','medico','plano de saude','plano de saúde','hospital','laboratório','laboratorio','psicólogo','psicologo','dentista','academia','smartfit','bio ritmo','gym','clinica','clínica','fisioterapia','ortodontia'] },
  { name: 'Educação',     color: '#06b6d4', budget: 0, keywords: ['escola','faculdade','curso','livro','livraria','udemy','alura','coursera','mensalidade','anhembi','estacio','estácio','uninove','usp','unicamp'] },
  { name: 'Lazer',        color: '#ec4899', budget: 0, keywords: ['cinema','ingresso','show','viagem','hotel','airbnb','decolar','booking','latam','gol','azul','parque','ingresso.com','sympla','ticketmaster','clube'] },
  { name: 'Assinaturas',  color: '#22c55e', budget: 0, keywords: ['netflix','spotify','amazon prime','disney','globoplay','hbo','max','youtube premium','youtube music','apple.com','icloud','google one','chatgpt','openai','anthropic','claude','notion','office','microsoft 365','deezer','tidal','crunchyroll','paramount','apple tv','discovery+'] },
  { name: 'Vestuário',    color: '#a855f7', budget: 0, keywords: ['zara','renner','riachuelo','cea','c&a','shein','nike','adidas','roupa','sapato','tênis','tenis','centauro','netshoes','arezzo','farm','forever 21'] },
  { name: 'Compras',      color: '#eab308', budget: 0, keywords: ['amazon','mercado livre','shopee','magalu','magazine luiza','americanas','submarino','aliexpress','casas bahia','ponto frio','fastshop','kabum'] },
  { name: 'Serviços',     color: '#14b8a6', budget: 0, keywords: ['manicure','cabeleireiro','salão','salao','pet shop','veterinario','veterinário','lavanderia','chaveiro','montagem','frete'] },
  { name: 'Impostos e Taxas', color: '#78716c', budget: 0, keywords: ['iof','anuidade','tarifa','imposto','darf','das','inss','tributo','multa'] },
  { name: 'Outros',       color: '#64748b', budget: 0, keywords: [] },
];

const MONTH_ABBR = { JAN:1, FEV:2, MAR:3, ABR:4, MAI:5, JUN:6, JUL:7, AGO:8, SET:9, OUT:10, NOV:11, DEZ:12,
                     JANUARY:1, FEBRUARY:2, MARCH:3, APRIL:4, MAY:5, JUNE:6, JULY:7, AUGUST:8, SEPTEMBER:9, OCTOBER:10, NOVEMBER:11, DECEMBER:12 };

const SKIP_LINE_PATTERNS = [
  /\btotal\b/i, /\bsubtotal\b/i, /\bsaldo\b/i, /\blimite\b/i,
  /pagamento recebido/i, /pagto\.?\s*recebido/i, /^\s*vencimento/i,
  /^\s*fatura\s+anterior/i, /\bencargos\b/i, /\bjuros\b/i,
  /forma de pagamento/i, /^\s*data\s+descri/i, /^\s*data\s+historico/i,
  /^\s*p[aá]gina\s+\d/i, /central de atendimento/i, /ouvidoria/i,
  /^\s*extrato\s+de\s+conta/i, /^\s*fatura\s+do\s+cart/i,
  /www\.[a-z0-9-]+\.com/i, /cnpj/i,
];

// ============ STATE ============
let state = { expenses: [], categories: [], monthlyBudget: 0, imports: [] };
let editingExpenseId = null;
let editingCategoryId = null;
let charts = { category: null, trend: null, daily: null };

// ============ PERSISTENCE ============
function loadState() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) raw = localStorage.getItem(LEGACY_KEY);
    if (raw) {
      state = JSON.parse(raw);
      if (!state.categories || !state.categories.length) state.categories = seedCategories();
      if (!state.expenses) state.expenses = [];
      if (!state.imports) state.imports = [];
      state.expenses.forEach(e => { if (!e.source) e.source = 'manual'; });
    } else {
      state = { expenses: [], categories: seedCategories(), monthlyBudget: 0, imports: [] };
    }
  } catch (e) {
    console.error('Erro ao carregar estado:', e);
    state = { expenses: [], categories: seedCategories(), monthlyBudget: 0, imports: [] };
  }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function seedCategories() {
  return DEFAULT_CATEGORIES.map((c, i) => ({ id: 'cat_' + i, ...c }));
}

// ============ HELPERS ============
const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const monthShort = new Intl.DateTimeFormat('pt-BR', { month: 'short' });

function uid(prefix = 'e') { return prefix + '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
function parseAmount(s) {
  if (typeof s === 'number') return s;
  if (s === null || s === undefined) return 0;
  s = String(s).trim().replace(/[R$\s]/g, '');
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && hasDot) { s = s.replace(/\./g, '').replace(',', '.'); }
  else if (hasComma) { s = s.replace(',', '.'); }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}
function parseDate(s) {
  if (!s) return null;
  s = String(s).trim();
  let m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (m) {
    let y = parseInt(m[3]);
    if (y < 100) y += 2000;
    return `${y}-${String(m[2]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
  }
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
  const d = new Date(s);
  if (!isNaN(d)) return d.toISOString().slice(0, 10);
  return null;
}
function yearMonth(dateStr) { return dateStr ? dateStr.slice(0, 7) : ''; }
function today() { return new Date().toISOString().slice(0, 10); }
function daysInMonth(ym) { const [y, m] = ym.split('-').map(Number); return new Date(y, m, 0).getDate(); }

function getCategory(id) { return state.categories.find(c => c.id === id) || state.categories[state.categories.length - 1]; }
function normalize(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function autoCategorize(description) {
  const desc = normalize(description);
  for (const cat of state.categories) {
    for (const kw of (cat.keywords || [])) {
      if (kw && desc.includes(normalize(kw))) return cat.id;
    }
  }
  return (state.categories.find(c => c.name === 'Outros') || state.categories[state.categories.length - 1]).id;
}

function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + type;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.className = 'toast ' + type; }, 3500);
}

function shiftMonth(ym, delta) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return d.toISOString().slice(0, 7);
}

// ============ TABS ============
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.tab-content').forEach(s => s.classList.toggle('hidden', s.id !== 'tab-' + name));
  renderAll();
}
document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

// ============ MONTH / FILTERS ============
function availableMonths() {
  const set = new Set(state.expenses.map(e => yearMonth(e.date)));
  set.add(today().slice(0, 7));
  return [...set].sort().reverse();
}
function populateMonthFilters() {
  const months = availableMonths();
  const dash = document.getElementById('month-filter');
  const exp = document.getElementById('expenses-month-filter');
  const currentDash = dash.value;
  const currentExp = exp.value;
  dash.innerHTML = months.map(ym => {
    const [y, m] = ym.split('-');
    const d = new Date(+y, +m - 1, 1);
    const label = monthLabel.format(d);
    return `<option value="${ym}">${label.charAt(0).toUpperCase() + label.slice(1)}</option>`;
  }).join('');
  dash.value = currentDash || months[0] || today().slice(0, 7);
  exp.innerHTML = '<option value="">Todos os meses</option>' + months.map(ym => {
    const [y, m] = ym.split('-');
    const d = new Date(+y, +m - 1, 1);
    const label = monthLabel.format(d);
    return `<option value="${ym}">${label.charAt(0).toUpperCase() + label.slice(1)}</option>`;
  }).join('');
  exp.value = currentExp;
  const catF = document.getElementById('cat-filter');
  const currentCat = catF.value;
  catF.innerHTML = '<option value="">Todas categorias</option>' + state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  catF.value = currentCat;
}

// ============ DASHBOARD ============
function renderDashboard() {
  const ym = document.getElementById('month-filter').value || today().slice(0, 7);
  const monthExpenses = state.expenses.filter(e => yearMonth(e.date) === ym);
  const prevYm = shiftMonth(ym, -1);
  const prevExpenses = state.expenses.filter(e => yearMonth(e.date) === prevYm);

  const total = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const prevTotal = prevExpenses.reduce((s, e) => s + e.amount, 0);
  document.getElementById('stat-total').textContent = fmt.format(total);
  setDelta('stat-total-delta', total, prevTotal, 'vs mês anterior');

  document.getElementById('stat-count').textContent = monthExpenses.length;
  setDelta('stat-count-delta', monthExpenses.length, prevExpenses.length, 'vs mês anterior', true);

  const now = new Date();
  const isCurrentMonth = ym === now.toISOString().slice(0, 7);
  const daysElapsed = isCurrentMonth ? now.getDate() : daysInMonth(ym);
  const avg = daysElapsed > 0 ? total / daysElapsed : 0;
  document.getElementById('stat-avg').textContent = fmt.format(avg);

  const projection = isCurrentMonth ? avg * daysInMonth(ym) : total;
  document.getElementById('stat-projection').textContent = fmt.format(projection);
  document.getElementById('stat-projection-delta').textContent = isCurrentMonth ? `Baseado em ${daysElapsed} dia(s)` : 'Fechado';

  renderCategoryChart(monthExpenses);
  renderTrendChart(ym);
  renderDailyChart(ym, monthExpenses);
}
function setDelta(id, cur, prev, suffix, isCount) {
  const el = document.getElementById(id);
  if (!prev) { el.textContent = suffix; el.className = 'delta flat'; return; }
  const diff = cur - prev;
  const pct = (diff / prev) * 100;
  const sign = diff >= 0 ? '+' : '';
  const val = isCount ? sign + diff : sign + fmt.format(diff);
  el.textContent = `${val} (${sign}${pct.toFixed(0)}%) ${suffix}`;
  el.className = 'delta ' + (Math.abs(pct) < 1 ? 'flat' : (diff > 0 ? 'up' : 'down'));
}
function getCSSVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

function renderFallbackLegend(entries) {
  const total = entries.reduce((s, e) => s + e.v, 0);
  return entries.map(e => {
    const pct = total > 0 ? (e.v / total) * 100 : 0;
    return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:13px">
      <span class="cat-dot" style="background:${e.cat.color};width:10px;height:10px"></span>
      <span style="flex:1">${e.cat.name}</span>
      <span style="color:var(--muted)">${pct.toFixed(0)}%</span>
      <span style="font-variant-numeric:tabular-nums">${fmt.format(e.v)}</span>
    </div>`;
  }).join('');
}

function renderCategoryChart(expenses) {
  const totals = {};
  expenses.forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.amount; });
  const entries = Object.entries(totals).map(([id, v]) => ({ cat: getCategory(id), v })).sort((a, b) => b.v - a.v);
  const wrap = document.getElementById('wrap-category');
  if (charts.category) { charts.category.destroy(); charts.category = null; }
  if (!entries.length) { wrap.innerHTML = '<div class="empty">Sem dados neste mês.</div>'; return; }
  if (typeof Chart === 'undefined') { wrap.innerHTML = renderFallbackLegend(entries); return; }
  wrap.innerHTML = '<canvas id="chart-category"></canvas>';
  charts.category = new Chart(document.getElementById('chart-category'), {
    type: 'doughnut',
    data: {
      labels: entries.map(e => e.cat.name),
      datasets: [{ data: entries.map(e => e.v), backgroundColor: entries.map(e => e.cat.color), borderWidth: 0 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: getCSSVar('--text'), boxWidth: 12, padding: 8, font: { size: 12 } } },
        tooltip: { callbacks: { label: (c) => `${c.label}: ${fmt.format(c.parsed)}` } }
      },
      cutout: '60%'
    }
  });
}

function renderTrendChart(currentYm) {
  const months = [];
  for (let i = 5; i >= 0; i--) months.push(shiftMonth(currentYm, -i));
  const totals = months.map(ym => state.expenses.filter(e => yearMonth(e.date) === ym).reduce((s, e) => s + e.amount, 0));
  const labels = months.map(ym => {
    const [y, m] = ym.split('-').map(Number);
    return monthShort.format(new Date(y, m - 1)).replace('.', '') + '/' + String(y).slice(2);
  });
  const wrap = document.getElementById('wrap-trend');
  if (charts.trend) { charts.trend.destroy(); charts.trend = null; }
  if (typeof Chart === 'undefined') { wrap.innerHTML = '<div class="empty">Instale/desbloqueie o Chart.js para ver o gráfico.</div>'; return; }
  wrap.innerHTML = '<canvas id="chart-trend"></canvas>';
  charts.trend = new Chart(document.getElementById('chart-trend'), {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Total (R$)', data: totals, backgroundColor: getCSSVar('--accent'), borderRadius: 6 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => fmt.format(c.parsed.y) } } },
      scales: {
        x: { ticks: { color: getCSSVar('--muted') }, grid: { display: false } },
        y: { ticks: { color: getCSSVar('--muted'), callback: (v) => 'R$' + v }, grid: { color: getCSSVar('--border') } }
      }
    }
  });
}

function renderDailyChart(ym, expenses) {
  const days = daysInMonth(ym);
  const totals = new Array(days).fill(0);
  expenses.forEach(e => {
    const d = parseInt(e.date.slice(8, 10), 10);
    if (d >= 1 && d <= days) totals[d - 1] += e.amount;
  });
  const wrap = document.getElementById('wrap-daily');
  if (charts.daily) { charts.daily.destroy(); charts.daily = null; }
  if (typeof Chart === 'undefined') { wrap.innerHTML = '<div class="empty">Instale/desbloqueie o Chart.js para ver o gráfico.</div>'; return; }
  wrap.innerHTML = '<canvas id="chart-daily"></canvas>';
  charts.daily = new Chart(document.getElementById('chart-daily'), {
    type: 'line',
    data: {
      labels: Array.from({ length: days }, (_, i) => i + 1),
      datasets: [{ label: 'Gasto no dia', data: totals, borderColor: getCSSVar('--accent-2'), backgroundColor: 'rgba(56,199,206,0.15)', fill: true, tension: 0.3, pointRadius: 3 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => fmt.format(c.parsed.y) } } },
      scales: {
        x: { ticks: { color: getCSSVar('--muted') }, grid: { display: false } },
        y: { ticks: { color: getCSSVar('--muted'), callback: (v) => 'R$' + v }, grid: { color: getCSSVar('--border') } }
      }
    }
  });
}

// ============ EXPENSES TABLE ============
function renderExpensesTable() {
  const q = normalize(document.getElementById('search-input').value);
  const cat = document.getElementById('cat-filter').value;
  const ym = document.getElementById('expenses-month-filter').value;
  const source = document.getElementById('source-filter').value;
  let rows = state.expenses.slice().sort((a, b) => b.date.localeCompare(a.date));
  if (q) rows = rows.filter(e => normalize(e.description).includes(q));
  if (cat) rows = rows.filter(e => e.category === cat);
  if (ym) rows = rows.filter(e => yearMonth(e.date) === ym);
  if (source) rows = rows.filter(e => (e.source || 'manual') === source);
  const tbody = document.getElementById('expenses-tbody');
  const empty = document.getElementById('expenses-empty');
  if (!rows.length) { tbody.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  tbody.innerHTML = rows.map(e => {
    const c = getCategory(e.category);
    const src = e.source === 'pdf' ? (e.importedFrom ? `PDF · ${escapeHtml(e.importedFrom)}` : 'PDF')
              : e.source === 'csv' ? 'CSV'
              : 'Manual';
    return `<tr>
      <td>${fmtDate.format(new Date(e.date + 'T12:00:00'))}</td>
      <td>${escapeHtml(e.description)}${e.notes ? `<div style="color:var(--muted);font-size:12px">${escapeHtml(e.notes)}</div>` : ''}</td>
      <td><span class="cat-chip" style="background:${c.color}22;color:${c.color}"><span class="cat-dot" style="background:${c.color}"></span>${c.name}</span></td>
      <td style="color:var(--muted);font-size:12px">${src}</td>
      <td class="amount">${fmt.format(e.amount)}</td>
      <td style="text-align:right;white-space:nowrap;">
        <button class="btn small ghost" onclick="editExpense('${e.id}')">Editar</button>
        <button class="btn small ghost danger" onclick="deleteExpense('${e.id}')">×</button>
      </td>
    </tr>`;
  }).join('');
}

// ============ MODAL: EXPENSE ============
function openExpenseModal(id) {
  editingExpenseId = id || null;
  const modal = document.getElementById('expense-modal');
  const catSel = document.getElementById('exp-category');
  catSel.innerHTML = '<option value="">— auto —</option>' + state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  if (id) {
    const e = state.expenses.find(x => x.id === id);
    if (!e) return;
    document.getElementById('expense-modal-title').textContent = 'Editar despesa';
    document.getElementById('exp-description').value = e.description;
    document.getElementById('exp-amount').value = e.amount.toString().replace('.', ',');
    document.getElementById('exp-date').value = e.date;
    document.getElementById('exp-category').value = e.category;
    document.getElementById('exp-payment').value = e.paymentMethod || 'Débito';
    document.getElementById('exp-notes').value = e.notes || '';
  } else {
    document.getElementById('expense-modal-title').textContent = 'Nova despesa';
    document.getElementById('exp-description').value = '';
    document.getElementById('exp-amount').value = '';
    document.getElementById('exp-date').value = today();
    document.getElementById('exp-category').value = '';
    document.getElementById('exp-payment').value = 'Débito';
    document.getElementById('exp-notes').value = '';
  }
  modal.classList.add('active');
  setTimeout(() => document.getElementById('exp-description').focus(), 50);
}
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function saveExpense() {
  const description = document.getElementById('exp-description').value.trim();
  const amount = Math.abs(parseAmount(document.getElementById('exp-amount').value));
  const date = document.getElementById('exp-date').value || today();
  let category = document.getElementById('exp-category').value;
  const paymentMethod = document.getElementById('exp-payment').value;
  const notes = document.getElementById('exp-notes').value.trim();
  if (!description) { alert('Informe a descrição.'); return; }
  if (!amount || amount <= 0) { alert('Informe um valor válido.'); return; }
  if (!category) category = autoCategorize(description);
  if (editingExpenseId) {
    const e = state.expenses.find(x => x.id === editingExpenseId);
    Object.assign(e, { description, amount, date, category, paymentMethod, notes });
  } else {
    state.expenses.push({ id: uid(), description, amount, date, category, paymentMethod, notes, source: 'manual' });
  }
  saveState();
  closeModal('expense-modal');
  renderAll();
  toast('Despesa salva', 'success');
}
function editExpense(id) { openExpenseModal(id); }
function deleteExpense(id) {
  if (!confirm('Excluir esta despesa?')) return;
  state.expenses = state.expenses.filter(e => e.id !== id);
  saveState();
  renderAll();
}

// ============ MODAL: CATEGORY ============
function openCategoryModal(id) {
  editingCategoryId = id || null;
  const modal = document.getElementById('category-modal');
  document.getElementById('cat-delete-btn').style.display = id ? '' : 'none';
  if (id) {
    const c = state.categories.find(x => x.id === id);
    document.getElementById('category-modal-title').textContent = 'Editar categoria';
    document.getElementById('cat-name').value = c.name;
    document.getElementById('cat-color').value = c.color;
    document.getElementById('cat-budget').value = c.budget ? c.budget.toString().replace('.', ',') : '';
    document.getElementById('cat-keywords').value = (c.keywords || []).join(', ');
  } else {
    document.getElementById('category-modal-title').textContent = 'Nova categoria';
    document.getElementById('cat-name').value = '';
    document.getElementById('cat-color').value = '#0CA3AA';
    document.getElementById('cat-budget').value = '';
    document.getElementById('cat-keywords').value = '';
  }
  modal.classList.add('active');
  setTimeout(() => document.getElementById('cat-name').focus(), 50);
}
function saveCategory() {
  const name = document.getElementById('cat-name').value.trim();
  const color = document.getElementById('cat-color').value;
  const budget = parseAmount(document.getElementById('cat-budget').value);
  const keywords = document.getElementById('cat-keywords').value.split(',').map(s => s.trim()).filter(Boolean);
  if (!name) { alert('Informe o nome.'); return; }
  if (editingCategoryId) {
    const c = state.categories.find(x => x.id === editingCategoryId);
    Object.assign(c, { name, color, budget, keywords });
  } else {
    state.categories.push({ id: uid('cat'), name, color, budget, keywords });
  }
  saveState();
  closeModal('category-modal');
  renderAll();
  toast('Categoria salva', 'success');
}
function deleteCategory() {
  if (!editingCategoryId) return;
  const inUse = state.expenses.some(e => e.category === editingCategoryId);
  if (inUse && !confirm('Esta categoria tem despesas. Elas serão movidas para "Outros". Continuar?')) return;
  const otherId = (state.categories.find(c => c.name === 'Outros') || {}).id;
  state.expenses.forEach(e => { if (e.category === editingCategoryId) e.category = otherId; });
  state.categories = state.categories.filter(c => c.id !== editingCategoryId);
  saveState();
  closeModal('category-modal');
  renderAll();
}

// ============ CATEGORIES LIST ============
function renderCategoriesList() {
  const el = document.getElementById('cat-list');
  const ym = today().slice(0, 7);
  el.innerHTML = state.categories.map(c => {
    const spent = state.expenses.filter(e => yearMonth(e.date) === ym && e.category === c.id).reduce((s, e) => s + e.amount, 0);
    const pct = c.budget > 0 ? Math.min(100, (spent / c.budget) * 100) : 0;
    const overBudget = c.budget > 0 && spent > c.budget;
    return `<div class="cat-item">
      <span class="cat-dot" style="background:${c.color};width:14px;height:14px"></span>
      <div>
        <div class="cat-name">${escapeHtml(c.name)}</div>
        <div class="cat-meta">${(c.keywords || []).length} palavra(s)-chave • Este mês: ${fmt.format(spent)}${c.budget > 0 ? ' / ' + fmt.format(c.budget) : ''}</div>
        ${c.budget > 0 ? `<div class="progress"><div class="progress-fill" style="width:${pct}%;background:${overBudget ? 'var(--red)' : c.color}"></div></div>` : ''}
      </div>
      <div style="text-align:right;color:var(--muted);font-size:13px">${c.budget > 0 ? (overBudget ? '<span style="color:var(--red)">Estourou</span>' : pct.toFixed(0) + '%') : '—'}</div>
      <button class="btn small" onclick="openCategoryModal('${c.id}')">Editar</button>
    </div>`;
  }).join('');
}

// ============ INSIGHTS ============
function renderInsights() {
  const ym = document.getElementById('month-filter').value || today().slice(0, 7);
  const monthExpenses = state.expenses.filter(e => yearMonth(e.date) === ym);
  const prevYm = shiftMonth(ym, -1);
  const prevExpenses = state.expenses.filter(e => yearMonth(e.date) === prevYm);

  const totalsCur = {}; monthExpenses.forEach(e => totalsCur[e.category] = (totalsCur[e.category] || 0) + e.amount);
  const top = Object.entries(totalsCur).map(([id, v]) => ({ cat: getCategory(id), v })).sort((a, b) => b.v - a.v).slice(0, 5);
  const totalMonth = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const topEl = document.getElementById('top-categories');
  if (!top.length) { topEl.innerHTML = '<div class="empty">Sem dados neste mês.</div>'; }
  else {
    topEl.innerHTML = top.map((t, i) => {
      const pct = totalMonth > 0 ? (t.v / totalMonth) * 100 : 0;
      return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <div style="width:24px;height:24px;border-radius:6px;background:${t.cat.color};color:white;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px">${i + 1}</div>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:500;margin-bottom:4px;"><span>${t.cat.name}</span><span>${fmt.format(t.v)} (${pct.toFixed(0)}%)</span></div>
          <div class="progress"><div class="progress-fill" style="width:${pct}%;background:${t.cat.color}"></div></div>
        </div>
      </div>`;
    }).join('');
  }

  const cmpEl = document.getElementById('month-comparison');
  const totalsPrev = {}; prevExpenses.forEach(e => totalsPrev[e.category] = (totalsPrev[e.category] || 0) + e.amount);
  const allCats = new Set([...Object.keys(totalsCur), ...Object.keys(totalsPrev)]);
  if (!allCats.size) { cmpEl.innerHTML = '<div class="empty">Sem dados para comparar.</div>'; }
  else {
    const rows = [...allCats].map(id => {
      const cat = getCategory(id);
      const cur = totalsCur[id] || 0;
      const prev = totalsPrev[id] || 0;
      const diff = cur - prev;
      const pct = prev > 0 ? (diff / prev) * 100 : (cur > 0 ? 100 : 0);
      return { cat, cur, prev, diff, pct };
    }).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 6);
    cmpEl.innerHTML = rows.map(r => {
      const cls = Math.abs(r.pct) < 5 ? 'flat' : (r.diff > 0 ? 'up' : 'down');
      const sign = r.diff >= 0 ? '+' : '';
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
        <span class="cat-chip" style="background:${r.cat.color}22;color:${r.cat.color}"><span class="cat-dot" style="background:${r.cat.color}"></span>${r.cat.name}</span>
        <span class="delta ${cls}" style="font-size:13px">${sign}${fmt.format(r.diff)} <span style="opacity:.7">(${sign}${r.pct.toFixed(0)}%)</span></span>
      </div>`;
    }).join('');
  }

  const sug = document.getElementById('savings-suggestions');
  const suggestions = generateSuggestions(monthExpenses, prevExpenses);
  sug.innerHTML = suggestions.length
    ? suggestions.map(s => `<div class="insight ${s.type}"><div class="title">${s.title}</div><div class="desc">${s.desc}</div></div>`).join('')
    : '<div class="empty">Adicione mais despesas para receber sugestões.</div>';

  const bs = document.getElementById('budget-status');
  const withBudget = state.categories.filter(c => c.budget > 0);
  if (!withBudget.length) {
    bs.innerHTML = '<div class="empty"><h3>Sem metas definidas</h3><p>Defina um orçamento mensal por categoria em "Categorias".</p></div>';
  } else {
    bs.innerHTML = withBudget.map(c => {
      const spent = monthExpenses.filter(e => e.category === c.id).reduce((s, e) => s + e.amount, 0);
      const pct = (spent / c.budget) * 100;
      const over = spent > c.budget;
      const near = pct >= 80 && !over;
      const cls = over ? 'bad' : (near ? 'warn' : 'good');
      const status = over ? `Estourou em ${fmt.format(spent - c.budget)}` : (near ? `Atingiu ${pct.toFixed(0)}% do orçamento` : `${pct.toFixed(0)}% consumido`);
      return `<div class="insight ${cls}">
        <div class="title">${c.name} — ${fmt.format(spent)} de ${fmt.format(c.budget)}</div>
        <div class="desc">${status}</div>
        <div class="progress" style="margin-top:8px"><div class="progress-fill" style="width:${Math.min(100, pct)}%;background:${over ? 'var(--red)' : c.color}"></div></div>
      </div>`;
    }).join('');
  }
}

function generateSuggestions(cur, prev) {
  const suggestions = [];
  const totalsCur = {}; cur.forEach(e => totalsCur[e.category] = (totalsCur[e.category] || 0) + e.amount);
  const totalsPrev = {}; prev.forEach(e => totalsPrev[e.category] = (totalsPrev[e.category] || 0) + e.amount);
  const totalMonth = cur.reduce((s, e) => s + e.amount, 0);

  for (const id of Object.keys(totalsCur)) {
    const c = totalsCur[id], p = totalsPrev[id] || 0;
    if (p > 0 && c > p * 1.3 && (c - p) > 50) {
      const cat = getCategory(id);
      suggestions.push({ type: 'bad', title: `Alta em ${cat.name}: +${fmt.format(c - p)} vs mês anterior`, desc: `Você gastou ${((c/p - 1) * 100).toFixed(0)}% a mais nesta categoria. Vale revisar se houve algo pontual ou se é um novo padrão.` });
    }
  }
  if (totalMonth > 0) {
    const top = Object.entries(totalsCur).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] / totalMonth > 0.4) {
      const cat = getCategory(top[0]);
      suggestions.push({ type: 'warn', title: `${cat.name} concentra ${((top[1]/totalMonth)*100).toFixed(0)}% dos seus gastos`, desc: `${fmt.format(top[1])} do seu total do mês. Se reduzir 10% aqui, economiza ${fmt.format(top[1] * 0.1)}.` });
    }
  }
  const assinCat = state.categories.find(c => c.name === 'Assinaturas');
  if (assinCat) {
    const assin = state.expenses.filter(e => e.category === assinCat.id);
    const byDesc = {};
    assin.forEach(e => { const k = normalize(e.description).slice(0, 30); byDesc[k] = (byDesc[k] || 0) + 1; });
    const recurring = Object.entries(byDesc).filter(([, n]) => n >= 2);
    if (recurring.length >= 3) {
      const months = Math.max(1, availableMonths().length);
      const totalAssin = assin.reduce((s, e) => s + e.amount, 0) / months;
      suggestions.push({ type: 'warn', title: `Você tem ${recurring.length} assinaturas recorrentes`, desc: `Média mensal em assinaturas: ${fmt.format(totalAssin)}. Revise quais você realmente usa nos últimos 30 dias.` });
    }
  }
  const alimCat = state.categories.find(c => c.name === 'Alimentação');
  if (alimCat) {
    const deliveryPatterns = ['ifood', 'rappi', 'uber eats', 'delivery'];
    const delivery = cur.filter(e => e.category === alimCat.id && deliveryPatterns.some(p => normalize(e.description).includes(p)));
    const deliveryTotal = delivery.reduce((s, e) => s + e.amount, 0);
    if (deliveryTotal > 300) {
      suggestions.push({ type: 'warn', title: `Delivery: ${fmt.format(deliveryTotal)} em ${delivery.length} pedidos este mês`, desc: `Média de ${fmt.format(deliveryTotal / Math.max(1, delivery.length))} por pedido. Reduzir para metade libera ${fmt.format(deliveryTotal / 2)}/mês.` });
    }
  }
  const smallCount = cur.filter(e => e.amount <= 25).length;
  if (smallCount >= 15) {
    const smallTotal = cur.filter(e => e.amount <= 25).reduce((s, e) => s + e.amount, 0);
    suggestions.push({ type: 'warn', title: `${smallCount} despesas pequenas (até R$ 25) somam ${fmt.format(smallTotal)}`, desc: `Micro-gastos passam despercebidos mas somam bastante. Vale mapear os cafés, snacks e app-taxis.` });
  }
  if (totalMonth > 0 && Object.keys(totalsPrev).length) {
    const totalPrev = Object.values(totalsPrev).reduce((s, v) => s + v, 0);
    if (totalMonth < totalPrev * 0.9) {
      suggestions.push({ type: 'good', title: `Você gastou ${fmt.format(totalPrev - totalMonth)} a menos que no mês anterior`, desc: `Uma queda de ${((1 - totalMonth/totalPrev) * 100).toFixed(0)}%. Se manter esse ritmo, economiza ${fmt.format((totalPrev - totalMonth) * 12)} no ano.` });
    }
  }
  return suggestions;
}

// =============================================================
// PDF PARSER
// =============================================================
async function extractPdfText(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const allLines = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    const linesMap = new Map();
    tc.items.forEach(item => {
      if (!item.str || !item.str.trim()) return;
      const y = Math.round(item.transform[5]);
      if (!linesMap.has(y)) linesMap.set(y, []);
      linesMap.get(y).push(item);
    });
    const ys = [...linesMap.keys()].sort((a, b) => b - a);
    ys.forEach(y => {
      const items = linesMap.get(y).sort((a, b) => a.transform[4] - b.transform[4]);
      const line = items.map(i => i.str).join(' ').replace(/\s+/g, ' ').trim();
      if (line) allLines.push(line);
    });
  }
  return allLines;
}

function detectBank(lines) {
  const head = lines.slice(0, 30).join(' ').toLowerCase();
  if (/nubank|nu pagamentos/.test(head)) return 'Nubank';
  if (/ita[uú]/.test(head)) return 'Itaú';
  if (/bradesco/.test(head)) return 'Bradesco';
  if (/santander/.test(head)) return 'Santander';
  if (/banco do brasil|\bbb\b/.test(head)) return 'Banco do Brasil';
  if (/\binter\b/.test(head)) return 'Inter';
  if (/\bc6\b/.test(head)) return 'C6';
  if (/caixa econ/.test(head)) return 'Caixa';
  if (/next\b/.test(head)) return 'Next';
  if (/will bank|willbank/.test(head)) return 'Will';
  if (/xp investimentos|xp inc/.test(head)) return 'XP';
  return null;
}

function detectYear(lines) {
  const text = lines.join(' ');
  const years = text.match(/\b(20\d{2})\b/g);
  if (!years) return new Date().getFullYear();
  const counts = {};
  years.forEach(y => counts[y] = (counts[y] || 0) + 1);
  return parseInt(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0], 10);
}

function detectStatementType(lines) {
  const head = lines.slice(0, 50).join(' ').toLowerCase();
  if (/fatura|cart[aã]o de cr[eé]dito|invoice/.test(head)) return 'credit';
  if (/extrato|conta corrente|movimenta/.test(head)) return 'debit';
  return 'unknown';
}

function shouldSkipLine(line) {
  if (line.length < 6) return true;
  return SKIP_LINE_PATTERNS.some(p => p.test(line));
}

// Parse a single transaction line, returning {date, description, amount, type}
// type: 'expense' or 'income'
function parseTransactionLine(line, fallbackYear) {
  const original = line;

  // Trailing amount + optional D/C (case-sensitive to avoid eating letters like the "r" in "Uber")
  const amountRe = /(-?\s*(?:R\$|\$)?\s*[\d.]{1,15},\d{2})\s*([DC])?\s*$/;
  const am = line.match(amountRe);
  if (!am) return null;
  let amount = parseAmount(am[1]);
  const dcMark = (am[2] || '').toUpperCase();
  const rest = line.slice(0, am.index).trim();
  if (!rest) return null;

  // Find date at start, or within first 40 chars (some statements prefix with card/doc number).
  // Patterns:
  //   DD/MM/YYYY, DD/MM/YY, DD/MM, DD-MM-YYYY
  //   DD MMM (Nubank fatura style): 18 JUL / 18 jul / 18 JUL 2026
  let date = null;
  let descStart = 0;

  const numericAtStart = /^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?(?=\s|$)/;
  const alphaAtStart   = /^(\d{1,2})\s+([A-Za-zç]{3,9})\.?(?:\s+(\d{2,4}))?(?=\s|$)/;
  const numericAnywhere = /(?:^|\s)(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?(?=\s|$)/;
  const alphaAnywhere   = /(?:^|\s)(\d{1,2})\s+([A-Za-zç]{3,9})\.?(?:\s+(\d{2,4}))?(?=\s|$)/;

  function applyNumeric(m, offset) {
    const day = parseInt(m[1]);
    const month = parseInt(m[2]);
    let year = m[3] ? parseInt(m[3]) : fallbackYear;
    if (year < 100) year += 2000;
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
      date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const start = (m.index || 0) + (m[0].startsWith(' ') ? 1 : 0);
      descStart = offset + start + m[0].trimStart().length;
      return true;
    }
    return false;
  }
  function applyAlpha(m, offset) {
    const day = parseInt(m[1]);
    const monKey = m[2].toUpperCase().slice(0, 3);
    const month = MONTH_ABBR[monKey] || MONTH_ABBR[m[2].toUpperCase()];
    let year = m[3] ? parseInt(m[3]) : fallbackYear;
    if (year < 100) year += 2000;
    if (month && day >= 1 && day <= 31) {
      date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const start = (m.index || 0) + (m[0].startsWith(' ') ? 1 : 0);
      descStart = offset + start + m[0].trimStart().length;
      return true;
    }
    return false;
  }

  // 1) Try date at the start of the line
  let m = rest.match(numericAtStart); if (m) applyNumeric(m, 0);
  if (!date) { m = rest.match(alphaAtStart); if (m) applyAlpha(m, 0); }

  // 2) Fallback: date anywhere in the first 40 chars (for lines prefixed by card/doc number)
  if (!date) {
    const slice = rest.slice(0, 40);
    m = slice.match(numericAnywhere); if (m) applyNumeric(m, 0);
    if (!date) { m = slice.match(alphaAnywhere); if (m) applyAlpha(m, 0); }
  }

  if (!date) return null;

  // Description = anything after the date (ignore prefix before date, since it's usually card/doc number).
  let description = rest.slice(descStart).trim()
    .replace(/^[\s\-–—•·]+/, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^\d{6,}\s+/, ''); // strip long numeric doc ids at start

  if (!description || description.length < 2) return null;
  // Remove trailing installments notation like "3/12" or "PARC 3/12"
  const parcM = description.match(/(.*?)\s+(?:parc\.?\s*)?(\d{1,2})\s*\/\s*(\d{1,2})\s*$/i);
  let installment = null;
  if (parcM) {
    description = parcM[1].trim();
    installment = `${parcM[2]}/${parcM[3]}`;
  }

  // Determine income vs expense
  let type = 'expense';
  if (dcMark === 'C') type = 'income';
  else if (amount < 0) { type = 'income'; amount = -amount; }
  else if (/estorno|reembolso|devoluç|devoluc|credito recebido|cr[eé]dito recebido/i.test(description)) type = 'income';

  // Sanity: amount cannot be 0
  if (!amount) return null;

  return {
    date,
    description,
    amount: Math.abs(amount),
    type,
    installment,
    raw: original,
  };
}

function parseStatementLines(lines, fallbackYear) {
  const transactions = [];
  for (const line of lines) {
    if (shouldSkipLine(line)) continue;
    const tx = parseTransactionLine(line, fallbackYear);
    if (tx) transactions.push(tx);
  }
  return transactions;
}

// =============================================================
// FILE UPLOAD / DROPZONE
// =============================================================
function setupDropzone() {
  const dz = document.getElementById('dropzone');
  const input = document.getElementById('file-input');
  dz.addEventListener('click', () => input.click());
  dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('dragover'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
  dz.addEventListener('drop', (e) => {
    e.preventDefault();
    dz.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });
  input.addEventListener('change', (e) => { handleFiles(e.target.files); e.target.value = ''; });
}

async function handleFiles(fileList) {
  const files = [...fileList];
  if (!files.length) return;
  const dz = document.getElementById('dropzone');
  dz.classList.add('processing');
  const titleEl = document.getElementById('dropzone-title');
  const subEl = document.getElementById('dropzone-sub');
  const originalTitle = titleEl.textContent;
  const originalSub = subEl.textContent;
  try {
    let combined = [];
    let sources = [];
    for (const file of files) {
      titleEl.innerHTML = `<span class="spinner"></span>Processando ${escapeHtml(file.name)}`;
      subEl.textContent = `${(file.size/1024).toFixed(0)} KB`;
      const result = await processFile(file);
      if (result && result.transactions.length) {
        combined = combined.concat(result.transactions.map(t => ({ ...t, importedFrom: result.source })));
        sources.push(result.source);
      } else if (result) {
        toast(`Nenhuma transação reconhecida em ${file.name}`, 'error');
      }
    }
    if (!combined.length) {
      toast('Nada para importar', 'error');
      return;
    }
    openPreview(combined, sources.join(', '));
  } catch (e) {
    console.error(e);
    toast('Erro ao processar arquivo: ' + e.message, 'error');
  } finally {
    dz.classList.remove('processing');
    titleEl.textContent = originalTitle;
    subEl.textContent = originalSub;
  }
}

async function processFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) {
    if (typeof pdfjsLib === 'undefined') {
      toast('Leitor de PDF não carregou (verifique sua conexão com o CDN).', 'error');
      return null;
    }
    const buf = await file.arrayBuffer();
    const lines = await extractPdfText(buf);
    const bank = detectBank(lines) || 'PDF';
    const year = detectYear(lines);
    const type = detectStatementType(lines);
    const transactions = parseStatementLines(lines, year);
    return { transactions, source: `${bank} · ${file.name}`, meta: { bank, year, type, fileName: file.name } };
  }
  if (name.endsWith('.csv')) {
    const text = await file.text();
    const rows = parseCSV(text);
    const transactions = rows.map(row => {
      const date = parseDate(row.data || row.date);
      const amountRaw = row.valor || row.value || row.amount;
      const amount = parseAmount(amountRaw);
      const description = (row.descricao || row.descrição || row.description || row.historico || row.histórico || '').trim();
      if (!date || !amount || !description) return null;
      const paymentMethod = row.forma_pagamento || row.pagamento || row.payment || '';
      let categoryHint = null;
      if (row.categoria || row.category) {
        const catName = row.categoria || row.category;
        const found = state.categories.find(c => normalize(c.name) === normalize(catName));
        categoryHint = found ? found.id : null;
      }
      return {
        date, description, amount: Math.abs(amount),
        type: amount < 0 ? 'income' : 'expense',
        paymentMethod,
        categoryHint,
      };
    }).filter(Boolean);
    return { transactions, source: `CSV · ${file.name}`, meta: { fileName: file.name } };
  }
  toast('Formato não suportado: ' + file.name, 'error');
  return null;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return [];
  const sep = lines[0].includes(';') && !lines[0].includes(',') ? ';' : (lines[0].split(';').length > lines[0].split(',').length ? ';' : ',');
  const headers = splitCSVLine(lines[0], sep).map(h => normalize(h.trim()));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCSVLine(lines[i], sep);
    if (cells.length < 2) continue;
    const row = {};
    headers.forEach((h, idx) => row[h] = (cells[idx] || '').trim());
    rows.push(row);
  }
  return rows;
}
function splitCSVLine(line, sep) {
  const out = []; let cur = ''; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === sep && !inQ) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out;
}

// =============================================================
// PREVIEW MODAL
// =============================================================
const preview = (() => {
  let items = []; // enriched preview rows
  let sourceLabel = '';

  function open(transactions, source) {
    sourceLabel = source;
    items = transactions.map((t, idx) => {
      const dupId = findDuplicate(t);
      return {
        id: 'pv_' + idx,
        include: t.type === 'expense',
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type || 'expense',
        installment: t.installment || null,
        category: t.categoryHint || autoCategorize(t.description),
        duplicateOf: dupId,
      };
    });
    document.getElementById('preview-title').textContent = 'Revisar transações';
    document.getElementById('preview-sub').textContent = `Encontramos ${transactions.length} transação(ões) — ${source}. Confira, ajuste categorias e importe.`;
    document.getElementById('preview-year').value = detectYearFromItems();
    const bulk = document.getElementById('bulk-category');
    bulk.innerHTML = state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    render();
    document.getElementById('preview-modal').classList.add('active');
  }

  function detectYearFromItems() {
    if (!items.length) return new Date().getFullYear();
    const years = items.map(i => parseInt(i.date.slice(0, 4)));
    return years.sort()[Math.floor(years.length / 2)];
  }

  function findDuplicate(t) {
    if (!t.date) return null;
    const key = `${t.date}|${(t.amount).toFixed(2)}|${normalize(t.description).slice(0, 25)}`;
    const found = state.expenses.find(e => `${e.date}|${e.amount.toFixed(2)}|${normalize(e.description).slice(0, 25)}` === key);
    return found ? found.id : null;
  }

  function render() {
    const tbody = document.getElementById('preview-tbody');
    tbody.innerHTML = items.map((it, idx) => {
      const cls = [];
      if (!it.include) cls.push('excluded');
      if (it.duplicateOf) cls.push('duplicate');
      return `<tr class="${cls.join(' ')}" data-idx="${idx}">
        <td class="tx-check"><input type="checkbox" ${it.include ? 'checked' : ''} onchange="preview.toggle(${idx}, this.checked)"></td>
        <td><input type="date" value="${it.date}" onchange="preview.setField(${idx}, 'date', this.value)"></td>
        <td>
          <input type="text" value="${escapeHtml(it.description)}" onchange="preview.setField(${idx}, 'description', this.value)">
          ${it.installment ? `<span class="badge">${it.installment}</span>` : ''}
          ${it.duplicateOf ? '<span class="badge warn" title="Já existe uma despesa parecida">duplicada?</span>' : ''}
        </td>
        <td>
          <select onchange="preview.setField(${idx}, 'category', this.value)">
            ${state.categories.map(c => `<option value="${c.id}" ${c.id === it.category ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        </td>
        <td class="tx-amount">${fmt.format(it.amount)}</td>
        <td>${it.type === 'income' ? '<span class="badge good">entrada</span>' : '<span class="badge">despesa</span>'}</td>
      </tr>`;
    }).join('');
    renderSummary();
  }

  function renderSummary() {
    const sel = items.filter(i => i.include);
    const totalSel = sel.reduce((s, i) => s + i.amount, 0);
    const dup = items.filter(i => i.duplicateOf).length;
    const inc = items.filter(i => i.type === 'income').length;
    document.getElementById('preview-summary').innerHTML = `
      <div><strong>${items.length}</strong> transações extraídas</div>
      <div><strong>${sel.length}</strong> selecionadas · <strong>${fmt.format(totalSel)}</strong></div>
      ${dup ? `<div style="color:var(--yellow)"><strong>${dup}</strong> possível(is) duplicada(s)</div>` : ''}
      ${inc ? `<div style="color:var(--green)"><strong>${inc}</strong> entrada(s) (desmarcadas por padrão)</div>` : ''}
    `;
    document.getElementById('preview-import-btn').textContent = sel.length ? `Importar ${sel.length} despesa(s)` : 'Importar';
    document.getElementById('preview-import-btn').disabled = sel.length === 0;
    document.getElementById('tx-check-all').checked = sel.length === items.length && items.length > 0;
  }

  function toggle(idx, val) {
    items[idx].include = val;
    render();
  }
  function toggleAll(val) {
    items.forEach(i => i.include = val);
    render();
  }
  function excludeDuplicates() {
    items.forEach(i => { if (i.duplicateOf) i.include = false; });
    render();
  }
  function setField(idx, field, value) {
    items[idx][field] = value;
    if (field === 'description') items[idx].category = autoCategorize(value);
    if (field === 'date') items[idx].duplicateOf = findDuplicate(items[idx]);
    render();
  }
  function applyBulkCategory() {
    const catId = document.getElementById('bulk-category').value;
    items.forEach(i => { if (i.include) i.category = catId; });
    render();
  }
  function reapplyYear() {
    const y = parseInt(document.getElementById('preview-year').value);
    if (!y || y < 1970) return;
    items.forEach(i => {
      const parts = i.date.split('-');
      i.date = `${y}-${parts[1]}-${parts[2]}`;
      i.duplicateOf = findDuplicate(i);
    });
    render();
  }

  function commit() {
    const sel = items.filter(i => i.include);
    if (!sel.length) return;
    const now = new Date().toISOString();
    sel.forEach(i => {
      state.expenses.push({
        id: uid(),
        date: i.date,
        description: i.description,
        amount: i.amount,
        category: i.category,
        paymentMethod: sourceLabel.startsWith('CSV') ? '' : 'Crédito',
        notes: i.installment ? `Parcela ${i.installment}` : '',
        source: sourceLabel.startsWith('CSV') ? 'csv' : 'pdf',
        importedFrom: sourceLabel,
        importedAt: now,
      });
    });
    state.imports.unshift({
      id: uid('imp'),
      source: sourceLabel,
      importedAt: now,
      count: sel.length,
      total: sel.reduce((s, i) => s + i.amount, 0),
    });
    if (state.imports.length > 50) state.imports = state.imports.slice(0, 50);
    saveState();
    closeModal('preview-modal');
    renderAll();
    toast(`${sel.length} despesa(s) importada(s)`, 'success');
    switchTab('dashboard');
  }

  return { open, toggle, toggleAll, excludeDuplicates, setField, applyBulkCategory, reapplyYear, commit };
})();
window.preview = preview;

function openPreview(transactions, source) { preview.open(transactions, source); }

// ============ IMPORT HISTORY ============
function renderImportHistory() {
  const el = document.getElementById('import-history');
  if (!state.imports || !state.imports.length) {
    el.innerHTML = '<div class="empty" style="padding:20px"><p>Sem importações ainda.</p></div>';
    return;
  }
  el.innerHTML = `<table>
    <thead><tr><th>Quando</th><th>Origem</th><th>Despesas</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>${state.imports.map(imp => `<tr>
      <td>${new Date(imp.importedAt).toLocaleString('pt-BR')}</td>
      <td>${escapeHtml(imp.source)}</td>
      <td>${imp.count}</td>
      <td class="amount">${fmt.format(imp.total)}</td>
    </tr>`).join('')}</tbody>
  </table>`;
}

// ============ EXPORT / CLEAR ============
function exportCSV() {
  if (!state.expenses.length) { alert('Nada a exportar.'); return; }
  const rows = [['data', 'descricao', 'valor', 'categoria', 'forma_pagamento', 'observacao', 'origem']];
  state.expenses.slice().sort((a, b) => a.date.localeCompare(b.date)).forEach(e => {
    const cat = getCategory(e.category);
    rows.push([e.date, `"${(e.description || '').replace(/"/g, '""')}"`, e.amount.toFixed(2).replace('.', ','), cat.name, e.paymentMethod || '', `"${(e.notes || '').replace(/"/g, '""')}"`, e.source || 'manual']);
  });
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `despesas-${today()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
function clearAll() {
  if (!confirm('Apagar TODAS as despesas? Esta ação não pode ser desfeita.')) return;
  if (!confirm('Tem certeza? Todas as despesas serão removidas permanentemente.')) return;
  state.expenses = [];
  state.imports = [];
  saveState();
  renderAll();
  toast('Despesas removidas');
}

// ============ RENDER ALL ============
function renderAll() {
  populateMonthFilters();
  renderDashboard();
  renderExpensesTable();
  renderInsights();
  renderCategoriesList();
  renderImportHistory();
}

// ============ INIT ============
document.getElementById('today-label').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
loadState();
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}
setupDropzone();
document.getElementById('month-filter').addEventListener('change', () => { renderDashboard(); renderInsights(); });
document.querySelectorAll('.modal-bg').forEach(m => m.addEventListener('click', (e) => { if (e.target === m) m.classList.remove('active'); }));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.querySelectorAll('.modal-bg').forEach(m => m.classList.remove('active')); });
renderAll();
