// ==========================================================================
// Borges Finance — vanilla JS implementation of the Claude Design mockup,
// with real PDF import, localStorage persistence, and rule-based AI fallback.
// ==========================================================================

const STORAGE_KEY = 'borges-finance-v3';
const LEGACY_KEYS = ['finance-control-v2', 'finance-control-v1'];

// ---------- Seeds ----------
function seedAccounts() {
  return [
    { id: 'pf',    nome: 'Itaú Corrente',  tipo: 'corrente_pf', inst: 'Itaú',          origem: 'pf', saldo: 14230.55 },
    { id: 'pj',    nome: 'Conta PJ',       tipo: 'corrente_pj', inst: 'Inter Empresas',origem: 'pj', saldo: 62480.90 },
    { id: 'itau',  nome: 'Cartão Itaú',    tipo: 'cartao_itau', inst: 'Itaú',          origem: 'pf', limite: 18000, fecha: '28/07', vence: '05/08' },
    { id: 'inter', nome: 'Cartão Inter',   tipo: 'cartao_inter',inst: 'Inter',         origem: 'pf', limite: 12000, fecha: '05/08', vence: '12/08' },
  ];
}
function seedCategories() {
  return [
    { id: 'moradia',    nome: 'Moradia',      tipo: 'despesa', budget: 3600, cor: '#f5a15a', origem: 'pf', keywords: ['aluguel','condominio','condomínio','iptu','enel','energia','luz','sabesp','copasa','sanepar','água','agua','gás','gas','vivo','claro','tim','oi','net','internet'] },
    { id: 'mercado',    nome: 'Mercado',      tipo: 'despesa', budget: 1200, cor: '#46d17f', origem: 'pf', keywords: ['supermercado','mercado','condor','angeloni','carrefour','extra','pão de açúcar','pao de acucar','assai','assaí','atacadão','atacadao','dia','bistek'] },
    { id: 'alim',       nome: 'Alimentação',  tipo: 'despesa', budget: 700,  cor: '#5cc9e0', origem: 'pf', keywords: ['ifood','rappi','uber eats','restaurante','madero','outback','habib','burger','mcdonalds','starbucks','padaria','lanchonete','café','cafe','bar','pizzaria','doceria'] },
    { id: 'transporte', nome: 'Transporte',   tipo: 'despesa', budget: 600,  cor: '#a3e635', origem: 'pf', keywords: ['uber','99','taxi','táxi','gasolina','posto','ipiranga','shell','estacionamento','pedágio','pedagio','estapar','metrô','metro','ônibus','onibus','cabify'] },
    { id: 'saude',      nome: 'Saúde',        tipo: 'despesa', budget: 500,  cor: '#f472b6', origem: 'pf', keywords: ['farmácia','farmacia','drogaria','drogasil','nissei','pacheco','pague menos','médico','medico','plano de saude','plano de saúde','hospital','academia','smartfit','bluefit','clínica','clinica'] },
    { id: 'lazer',      nome: 'Lazer',        tipo: 'despesa', budget: 400,  cor: '#c9c5f7', origem: 'pf', keywords: ['netflix','spotify','disney','globoplay','hbo','max','youtube premium','deezer','tidal','cinema','ingresso','show','sympla','ticketmaster','viagem','airbnb','decolar','booking','apple.com','icloud','amazon'] },
    { id: 'software',   nome: 'Software PJ',  tipo: 'despesa', budget: 4200, cor: '#b3aef5', origem: 'pj', keywords: ['hubspot','sales navigator','linkedin','zapier','google workspace','microsoft','notion','openai','chatgpt','anthropic','claude','canva','aws','cloud','figma','slack','github','vercel'] },
    { id: 'mktpj',      nome: 'Marketing PJ', tipo: 'despesa', budget: 1000, cor: '#f96a6a', origem: 'pj', keywords: ['meta ads','google ads','facebook','instagram ads','tiktok ads','patrocinado'] },
    { id: 'servpj',     nome: 'Serviços PJ',  tipo: 'despesa', budget: 1500, cor: '#8b87e0', origem: 'pj', keywords: ['contábil','contabil','coworking','aldeia','wework','escritório','escritorio','advogado','contador','contaí'] },
    { id: 'imposto',    nome: 'Impostos',     tipo: 'despesa', budget: 2600, cor: '#f5c518', origem: 'pj', keywords: ['das','darf','simples nacional','simples','inss','imposto','tributo','iof','anuidade','multa','tarifa'] },
    { id: 'receita',    nome: 'Receita',      tipo: 'receita', budget: 0,    cor: '#46d17f', origem: 'mix', keywords: [] },
  ];
}
function seedRules() {
  return [
    { kw: 'iFood, Restaurante, Madero',      cat: 'alim' },
    { kw: 'Uber, 99, Posto Ipiranga',        cat: 'transporte' },
    { kw: 'HubSpot, Sales Navigator, Zapier',cat: 'software' },
    { kw: 'Meta Ads, Google Ads',            cat: 'mktpj' },
    { kw: 'DAS, DARF, Simples',              cat: 'imposto' },
    { kw: 'Condor, Carrefour, Angeloni',     cat: 'mercado' },
  ];
}
function seedClients() {
  return [
    { nome: 'TechNova SaaS',     tipo: 'pj', projeto: 'Projeto CRM & automação',   valor: 12500 },
    { nome: 'Aurora E-commerce', tipo: 'pj', projeto: 'Consultoria de operações', valor: 9800 },
    { nome: 'GrowthLab Agência', tipo: 'pj', projeto: 'Retainer mensal',          valor: 8000 },
    { nome: 'Clínica Vitalis',   tipo: 'pj', projeto: 'Implementação de sistema', valor: 6500 },
    { nome: 'Bianca Ferraz',     tipo: 'pf', projeto: 'Mentoria',                 valor: 3200 },
  ];
}
function seedTx() {
  const T = []; let n = 0;
  const add = (date, desc, valor, acc, cat, origem, metodo, parcela, ia) =>
    T.push({ id: 'seed' + (++n), date, desc, valor, acc, cat, origem, metodo, parcela: parcela || null, ia: !!ia });
  add('2026-07-03', 'TechNova SaaS — Projeto CRM',    12500, 'pj', 'receita', 'pj', 'transf', null, false);
  add('2026-07-05', 'GrowthLab — Retainer mensal',      8000, 'pj', 'receita', 'pj', 'transf', null, false);
  add('2026-07-10', 'Clínica Vitalis — Implementação',  6500, 'pj', 'receita', 'pj', 'pix',    null, false);
  add('2026-07-12', 'Bianca Ferraz — Mentoria',         3200, 'pj', 'receita', 'pj', 'pix',    null, false);
  add('2026-07-18', 'Aurora E-commerce — Consultoria',  9800, 'pj', 'receita', 'pj', 'transf', null, false);
  add('2026-07-05', 'Pró-labore',                       5000, 'pf', 'receita', 'pf', 'transf', null, false);
  add('2026-07-01', 'Rendimento CDB Itaú',              182.40,'pf', 'receita', 'pf', 'transf', null, false);
  add('2026-07-05', 'Aluguel — Ed. Batel',             -3200, 'pf', 'moradia',  'pf', 'pix',    null, false);
  add('2026-07-08', 'Supermercado Condor',             -487.90,'pf', 'mercado', 'pf', 'debito', null, false);
  add('2026-07-09', 'Posto Ipiranga',                  -220.00,'itau','transporte','pf','credito',null,true);
  add('2026-07-11', 'iFood',                            -68.50,'itau','alim',    'pf','credito',null,true);
  add('2026-07-12', 'Netflix',                          -55.90,'inter','lazer',  'pf','credito',null,true);
  add('2026-07-13', 'Farmácia Nissei',                 -132.40,'pf', 'saude',    'pf','debito', null,false);
  add('2026-07-14', 'Academia Bluefit',                -119.90,'itau','saude',   'pf','credito',null,false);
  add('2026-07-15', 'Spotify',                          -21.90,'inter','lazer',  'pf','credito',null,true);
  add('2026-07-16', 'Restaurante Madero',              -156.00,'itau','alim',    'pf','credito',null,true);
  add('2026-07-17', 'Uber',                             -34.80,'itau','transporte','pf','credito',null,true);
  add('2026-07-20', 'Amazon — fone Sony',              -166.33,'inter','lazer',  'pf','credito','2/3',false);
  add('2026-07-22', 'Enel — energia',                  -184.60,'pf', 'moradia',  'pf','pix',    null,false);
  add('2026-07-24', 'Sanepar — água',                   -92.10,'pf', 'moradia',  'pf','pix',    null,false);
  add('2026-07-02', 'Escritório contábil Contaí',      -450.00,'pj', 'servpj',   'pj','pix',    null,false);
  add('2026-07-04', 'HubSpot — assinatura',           -1890.00,'itau','software','pj','credito',null,true);
  add('2026-07-06', 'Google Workspace',                 -78.00,'inter','software','pj','credito',null,true);
  add('2026-07-07', 'LinkedIn Sales Navigator',        -420.00,'itau','software','pj','credito',null,true);
  add('2026-07-10', 'Meta Ads — captação',           -1200.00,'inter','mktpj',   'pj','credito',null,false);
  add('2026-07-15', 'DAS Simples Nacional',           -2340.00,'pj', 'imposto',  'pj','pix',    null,false);
  add('2026-07-18', 'Coworking Aldeia',                -890.00,'pj', 'servpj',   'pj','pix',    null,false);
  add('2026-07-19', 'Notebook Dell',                   -458.90,'itau','software','pj','credito','3/10',false);
  add('2026-07-21', 'Zapier — automações',            -119.00,'inter','software','pj','credito',null,true);
  add('2026-06-05', 'TechNova SaaS — Projeto CRM',    12500,'pj','receita','pj','transf',null,false);
  add('2026-06-06', 'GrowthLab — Retainer',             8000,'pj','receita','pj','transf',null,false);
  add('2026-06-11', 'Clínica Vitalis — Implementação',  6500,'pj','receita','pj','pix',null,false);
  add('2026-06-05', 'Pró-labore',                       5000,'pf','receita','pf','transf',null,false);
  add('2026-06-05', 'Aluguel — Ed. Batel',             -3200,'pf','moradia','pf','pix',null,false);
  add('2026-06-09', 'Supermercado Angeloni',           -512.30,'pf','mercado','pf','debito',null,false);
  add('2026-06-12', 'HubSpot — assinatura',           -1890.00,'itau','software','pj','credito',null,false);
  add('2026-06-14', 'Meta Ads',                        -870.00,'inter','mktpj','pj','credito',null,false);
  add('2026-06-15', 'DAS Simples Nacional',           -2180.00,'pj','imposto','pj','pix',null,false);
  add('2026-06-20', 'iFood',                            -94.20,'itau','alim','pf','credito',null,true);
  add('2026-06-22', 'Amazon — fone Sony',              -166.33,'inter','lazer','pf','credito','1/3',false);
  add('2026-06-26', 'Restaurante Manu',                -210.00,'itau','alim','pf','credito',null,true);
  return T;
}
function seedClosedInvoices() {
  return {
    itau:  [{ mes: 'Junho', valor: 5210.40 }, { mes: 'Maio', valor: 4680.90 }, { mes: 'Abril', valor: 5940.10 }],
    inter: [{ mes: 'Junho', valor: 1980.30 }, { mes: 'Maio', valor: 2340.70 }, { mes: 'Abril', valor: 1720.00 }],
  };
}

// ---------- Helpers ----------
const fmt  = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmt0 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
function money(v)   { return fmt.format(Math.abs(v || 0)); }
function money0(v)  { return fmt0.format(Math.abs(v || 0)); }
function fmtDate(d) { if (!d) return ''; const p = d.split('-'); return p[2] + '/' + p[1]; }
function fmtDateFull(d) { if (!d) return ''; const p = d.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; }
function today() { return new Date().toISOString().slice(0, 10); }
function ym(d) { return d ? d.slice(0, 7) : ''; }
function shiftMonth(period, delta) {
  if (period === 'all') return period;
  const [y, m] = period.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return d.toISOString().slice(0, 7);
}
function daysInMonth(period) { const [y, m] = period.split('-').map(Number); return new Date(y, m, 0).getDate(); }
function uid(p = 'tx') { return p + '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
function normalize(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function esc(s) { return String(s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function parseAmount(s) {
  if (typeof s === 'number') return s;
  if (s == null) return 0;
  s = String(s).trim().replace(/[R$\s]/g, '');
  const hasComma = s.includes(','), hasDot = s.includes('.');
  if (hasComma && hasDot) s = s.replace(/\./g, '').replace(',', '.');
  else if (hasComma) s = s.replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}
function parseDate(s) {
  if (!s) return null;
  s = String(s).trim();
  let m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (m) { let y = parseInt(m[3]); if (y < 100) y += 2000; return `${y}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`; }
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;
  const d = new Date(s);
  return isNaN(d) ? null : d.toISOString().slice(0, 10);
}
function toast(msg, kind = '') {
  const el = document.getElementById('toast');
  el.textContent = msg; el.className = 'toast show ' + kind;
  clearTimeout(toast._t); toast._t = setTimeout(() => el.className = 'toast ' + kind, 3500);
}

// ==========================================================================
// PDF PARSER (from previous version, unchanged)
// ==========================================================================
const MONTH_ABBR = { JAN:1, FEV:2, MAR:3, ABR:4, MAI:5, JUN:6, JUL:7, AGO:8, SET:9, OUT:10, NOV:11, DEZ:12 };
const SKIP_LINE_PATTERNS = [
  /\btotal\b/i, /\bsubtotal\b/i, /\bsaldo\b/i, /\blimite\b/i,
  /pagamento recebido/i, /pagto\.?\s*recebido/i, /^\s*vencimento/i,
  /^\s*fatura\s+anterior/i, /\bencargos\b/i, /^\s*juros\b/i,
  /forma de pagamento/i, /^\s*data\s+descri/i, /^\s*data\s+historico/i,
  /^\s*p[aá]gina\s+\d/i, /central de atendimento/i, /ouvidoria/i,
  /www\.[a-z0-9-]+\.com/i, /^cnpj/i,
];
async function extractPdfText(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const lines = [];
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
      if (line) lines.push(line);
    });
  }
  return lines;
}
function detectBank(lines) {
  const head = lines.slice(0, 30).join(' ').toLowerCase();
  if (/nubank|nu pagamentos/.test(head)) return 'Nubank';
  if (/ita[uú]/.test(head)) return 'Itaú';
  if (/bradesco/.test(head)) return 'Bradesco';
  if (/santander/.test(head)) return 'Santander';
  if (/banco do brasil/.test(head)) return 'Banco do Brasil';
  if (/\binter\b/.test(head)) return 'Inter';
  if (/\bc6\b/.test(head)) return 'C6';
  if (/caixa econ/.test(head)) return 'Caixa';
  return null;
}
function detectYear(lines) {
  const years = lines.join(' ').match(/\b(20\d{2})\b/g);
  if (!years) return new Date().getFullYear();
  const counts = {}; years.forEach(y => counts[y] = (counts[y] || 0) + 1);
  return parseInt(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0], 10);
}
function shouldSkipLine(line) { if (line.length < 6) return true; return SKIP_LINE_PATTERNS.some(p => p.test(line)); }
function parseTransactionLine(line, fallbackYear) {
  const amountRe = /(-?\s*(?:R\$|\$)?\s*[\d.]{1,15},\d{2})\s*([DC])?\s*$/;
  const am = line.match(amountRe);
  if (!am) return null;
  let amount = parseAmount(am[1]);
  const dcMark = (am[2] || '').toUpperCase();
  const rest = line.slice(0, am.index).trim();
  if (!rest) return null;

  let date = null, descStart = 0;
  const numericAtStart = /^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?(?=\s|$)/;
  const alphaAtStart   = /^(\d{1,2})\s+([A-Za-zç]{3,9})\.?(?:\s+(\d{2,4}))?(?=\s|$)/;
  const numericAnywhere = /(?:^|\s)(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?(?=\s|$)/;
  const alphaAnywhere   = /(?:^|\s)(\d{1,2})\s+([A-Za-zç]{3,9})\.?(?:\s+(\d{2,4}))?(?=\s|$)/;

  function applyNumeric(m, offset) {
    const day = parseInt(m[1]), month = parseInt(m[2]);
    let year = m[3] ? parseInt(m[3]) : fallbackYear;
    if (year < 100) year += 2000;
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
      date = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const start = (m.index || 0) + (m[0].startsWith(' ') ? 1 : 0);
      descStart = offset + start + m[0].trimStart().length;
      return true;
    } return false;
  }
  function applyAlpha(m, offset) {
    const day = parseInt(m[1]);
    const monKey = m[2].toUpperCase().slice(0, 3);
    const month = MONTH_ABBR[monKey];
    let year = m[3] ? parseInt(m[3]) : fallbackYear;
    if (year < 100) year += 2000;
    if (month && day >= 1 && day <= 31) {
      date = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const start = (m.index || 0) + (m[0].startsWith(' ') ? 1 : 0);
      descStart = offset + start + m[0].trimStart().length;
      return true;
    } return false;
  }

  let m = rest.match(numericAtStart); if (m) applyNumeric(m, 0);
  if (!date) { m = rest.match(alphaAtStart); if (m) applyAlpha(m, 0); }
  if (!date) {
    const slice = rest.slice(0, 40);
    m = slice.match(numericAnywhere); if (m) applyNumeric(m, 0);
    if (!date) { m = slice.match(alphaAnywhere); if (m) applyAlpha(m, 0); }
  }
  if (!date) return null;

  let description = rest.slice(descStart).trim()
    .replace(/^[\s\-–—•·]+/, '').replace(/\s{2,}/g, ' ').replace(/^\d{6,}\s+/, '');
  if (!description || description.length < 2) return null;

  let installment = null;
  const parcM = description.match(/(.*?)\s+(?:parc\.?\s*)?(\d{1,2})\s*\/\s*(\d{1,2})\s*$/i);
  if (parcM) { description = parcM[1].trim(); installment = `${parcM[2]}/${parcM[3]}`; }

  let type = 'expense';
  if (dcMark === 'C') type = 'income';
  else if (amount < 0) { type = 'income'; amount = -amount; }
  else if (/estorno|reembolso|devolu/i.test(description)) type = 'income';
  if (!amount) return null;

  return { date, description, amount: Math.abs(amount), type, installment };
}
function parseStatementLines(lines, fallbackYear) {
  const out = [];
  for (const line of lines) {
    if (shouldSkipLine(line)) continue;
    const tx = parseTransactionLine(line, fallbackYear);
    if (tx) out.push(tx);
  }
  return out;
}

// ==========================================================================
// STATE
// ==========================================================================
let state = null;
let ui = { screen: 'dashboard', period: '2026-07', filters: { acc: 'all', cat: 'all', tipo: 'all' }, txSearch: '', selected: {}, editingCat: null, catDraft: {}, cardTab: 'itau', chat: [], chatInput: '', chatLoading: false, insightText: '', insightLoading: false, exportMsg: '', import: null };

function loadState() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) for (const k of LEGACY_KEYS) { raw = localStorage.getItem(k); if (raw) break; }
    if (raw) {
      state = JSON.parse(raw);
      if (!state.accounts)   state.accounts = seedAccounts();
      if (!state.categories) state.categories = seedCategories();
      if (!state.tx)         state.tx = seedTx();
      if (!state.rules)      state.rules = seedRules();
      if (!state.clients)    state.clients = seedClients();
      if (!state.closed)     state.closed = seedClosedInvoices();
      if (state.taxPct == null) state.taxPct = 16;
      // Migrate legacy "expenses" schema to tx
      if (state.expenses && !state.tx.length) {
        state.tx = state.expenses.map(e => ({
          id: e.id || uid(), date: e.date, desc: e.description, valor: -Math.abs(e.amount),
          acc: 'pf', cat: e.category || 'servpj', origem: 'pf',
          metodo: (e.paymentMethod || 'debito').toLowerCase(), parcela: null, ia: false,
        }));
        delete state.expenses;
      }
    } else {
      state = { accounts: seedAccounts(), categories: seedCategories(), tx: seedTx(), rules: seedRules(), clients: seedClients(), closed: seedClosedInvoices(), taxPct: 16 };
    }
  } catch (e) {
    console.error(e);
    state = { accounts: seedAccounts(), categories: seedCategories(), tx: seedTx(), rules: seedRules(), clients: seedClients(), closed: seedClosedInvoices(), taxPct: 16 };
  }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function resetSeed() {
  if (!confirm('Restaurar dados de demonstração? Isto apaga TODAS as suas transações.')) return;
  state = { accounts: seedAccounts(), categories: seedCategories(), tx: seedTx(), rules: seedRules(), clients: seedClients(), closed: seedClosedInvoices(), taxPct: 16 };
  saveState(); renderAll();
  toast('Dados resetados', 'success');
}
function catById(id) { return state.categories.find(c => c.id === id) || { nome: 'Sem categoria', cor: '#55555b', tipo: 'despesa' }; }
function accById(id) { return state.accounts.find(a => a.id === id) || { nome: '—', origem: 'pf' }; }
function metodoLbl(m) { return ({ pix: 'Pix', debito: 'Débito', credito: 'Crédito', transf: 'Transf.' }[m] || (m || '—')); }

function autoCategorize(desc) {
  const s = normalize(desc);
  for (const cat of state.categories) {
    for (const kw of (cat.keywords || [])) if (kw && s.includes(normalize(kw))) return cat.id;
  }
  return 'servpj';
}
function detectOrigem(desc, catId) {
  const cat = catById(catId);
  if (cat.origem === 'pj') return 'pj';
  if (cat.origem === 'pf') return 'pf';
  return 'pf';
}

function availablePeriods() {
  const set = new Set(state.tx.map(t => ym(t.date)));
  set.add(today().slice(0, 7));
  return [...set].sort().reverse();
}
function txForPeriod(period) { return period === 'all' ? state.tx : state.tx.filter(t => ym(t.date) === period); }

// Apply the global filter set (tipo/acc/cat) to a transaction list
function applyGlobalFilters(list) {
  let out = list;
  if (ui.filters.tipo !== 'all') out = out.filter(t => t.origem === ui.filters.tipo);
  if (ui.filters.acc !== 'all')  out = out.filter(t => t.acc === ui.filters.acc);
  if (ui.filters.cat !== 'all')  out = out.filter(t => t.cat === ui.filters.cat);
  return out;
}
// Convenience: filtered tx for the current period
function currentTx() { return applyGlobalFilters(txForPeriod(ui.period)); }

function activeFilterCount() {
  let n = 0;
  if (ui.filters.tipo !== 'all') n++;
  if (ui.filters.acc !== 'all')  n++;
  if (ui.filters.cat !== 'all')  n++;
  return n;
}

function filterBanner() {
  const n = activeFilterCount();
  if (!n) return '';
  const parts = [];
  if (ui.filters.tipo !== 'all') parts.push(`<span class="chip">${ui.filters.tipo.toUpperCase()}</span>`);
  if (ui.filters.acc !== 'all')  parts.push(`<span class="chip">${esc(accById(ui.filters.acc).nome)}</span>`);
  if (ui.filters.cat !== 'all')  parts.push(`<span class="chip">${esc(catById(ui.filters.cat).nome)}</span>`);
  return `<div class="filter-banner">
    <span>Filtrando por:</span>${parts.join('')}
    <div class="flex-1"></div>
    <button class="btn" style="padding:6px 12px;font-size:12px;" onclick="app.clearFilters()">Limpar</button>
  </div>`;
}

// ==========================================================================
// AI: window.claude.complete fallback with rule-based responses
// ==========================================================================
async function aiComplete({ system, messages, max_tokens }) {
  if (window.claude && typeof window.claude.complete === 'function') {
    try { return await window.claude.complete({ system, messages, max_tokens }); }
    catch (e) { /* fallthrough */ }
  }
  return null;
}

function ruleBasedInsight(period) {
  const tx = applyGlobalFilters(txForPeriod(period));
  const rec = tx.filter(x => x.valor > 0).reduce((s, x) => s + x.valor, 0);
  const desp = tx.filter(x => x.valor < 0).reduce((s, x) => s + Math.abs(x.valor), 0);
  const recPJ = tx.filter(x => x.valor > 0 && x.origem === 'pj').reduce((s, x) => s + x.valor, 0);
  const recPF = rec - recPJ;
  const sobra = rec - desp;
  const pctSobra = rec > 0 ? (sobra / rec) * 100 : 0;

  const prevPeriod = shiftMonth(period, -1);
  const prevTx = txForPeriod(prevPeriod);
  const prevByCat = {}; prevTx.filter(x => x.valor < 0).forEach(x => { prevByCat[x.cat] = (prevByCat[x.cat] || 0) + Math.abs(x.valor); });
  const byCat = {};     tx.filter(x => x.valor < 0).forEach(x => { byCat[x.cat] = (byCat[x.cat] || 0) + Math.abs(x.valor); });

  const growth = Object.keys(byCat)
    .map(id => ({ id, cur: byCat[id], prev: prevByCat[id] || 0 }))
    .filter(g => g.prev > 0 && g.cur > g.prev * 1.2 && g.cur - g.prev > 100)
    .sort((a, b) => (b.cur - b.prev) - (a.cur - a.prev));

  const topSpend = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
  const periodLabel = periodLabelPT(period);

  let s1 = `${periodLabel} fecha com receita de ${money(rec)} e despesas de ${money(desp)} — sobra de caixa de ${Math.round(pctSobra)}%. `;
  if (recPJ > 0 && recPF > 0) s1 += `A PJ concentra ${Math.round((recPJ / rec) * 100)}% da receita (${money(recPJ)}), enquanto a PF traz ${money(recPF)}.`;
  else if (recPJ > 0) s1 += `Toda a receita veio da PJ (${money(recPJ)}).`;
  else if (recPF > 0) s1 += `Toda a receita veio da PF (${money(recPF)}).`;

  let s2 = '';
  if (growth.length) {
    const g = growth[0]; const c = catById(g.id);
    s2 = `Ponto de atenção: ${c.nome} subiu ${Math.round((g.cur / g.prev - 1) * 100)}% (${money(g.prev)} → ${money(g.cur)}) vs mês anterior.`;
    if (growth.length > 1) { const g2 = growth[1]; const c2 = catById(g2.id); s2 += ` ${c2.nome} também cresceu (${money(g2.cur - g2.prev)} a mais).`; }
  } else if (topSpend) {
    const c = catById(topSpend[0]);
    s2 = `${c.nome} lidera os gastos com ${money(topSpend[1])} (${Math.round(topSpend[1] / desp * 100)}% do total do mês). Nenhuma alta relevante vs mês anterior.`;
  } else {
    s2 = 'Sem despesas registradas neste período.';
  }

  const assinTx = tx.filter(x => x.cat === 'software' && x.valor < 0);
  const assinTotal = assinTx.reduce((s, x) => s + Math.abs(x.valor), 0);
  let s3 = '';
  if (assinTotal > 500) s3 = `Sugestão: revisar as assinaturas de Software PJ (${assinTx.length} lançamentos, ${money(assinTotal)}/mês) — consolidar ferramentas que se sobrepõem tende a liberar 10-20% desse valor.`;
  else if (topSpend) { const c = catById(topSpend[0]); s3 = `Sugestão: se cortar 10% em ${c.nome}, sobram ${money(topSpend[1] * 0.1)} extras no mês.`; }
  else s3 = 'Sugestão: registre mais transações (import de extrato ou fatura) para receber sugestões concretas.';

  return `${s1}\n\n${s2}\n\n${s3}`;
}

function periodLabelPT(period) {
  if (period === 'all') return 'O período';
  const [y, m] = period.split('-').map(Number);
  const n = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  return `${n[m - 1].charAt(0).toUpperCase() + n[m - 1].slice(1)}/${y}`;
}

function ruleBasedChat(question, period) {
  const q = normalize(question);
  const tx = applyGlobalFilters(txForPeriod(period));

  // "quanto gastei em/com X"
  const catMatch = state.categories.find(c => q.includes(normalize(c.nome)));
  if (/gaste|gastei|gasto|gastando|paguei/.test(q) && catMatch) {
    const total = tx.filter(x => x.valor < 0 && x.cat === catMatch.id).reduce((s, x) => s + Math.abs(x.valor), 0);
    const items = tx.filter(x => x.valor < 0 && x.cat === catMatch.id).length;
    return `Em ${catMatch.nome} você gastou ${money(total)} em ${items} lançamento(s) neste período.`;
  }

  // "receita" / "quanto ganhei"
  if (/receita|ganhei|entrou|recebi/.test(q)) {
    const rec = tx.filter(x => x.valor > 0).reduce((s, x) => s + x.valor, 0);
    const recPJ = tx.filter(x => x.valor > 0 && x.origem === 'pj').reduce((s, x) => s + x.valor, 0);
    return `Receita do período: ${money(rec)} (PJ ${money(recPJ)}, PF ${money(rec - recPJ)}).`;
  }

  // "onde cortar" / "cortar custos"
  if (/onde.*cort|corta[rn]|econom/.test(q)) {
    const byCat = {}; tx.filter(x => x.valor < 0).forEach(x => byCat[x.cat] = (byCat[x.cat] || 0) + Math.abs(x.valor));
    const top3 = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (!top3.length) return 'Sem despesas no período para analisar.';
    return 'Top categorias onde cortar teria mais impacto:\n' + top3.map(([id, v], i) => `${i+1}. ${catById(id).nome}: ${money(v)} — cortar 10% libera ${money(v*0.1)}`).join('\n');
  }

  // "reserva imposto" / "estou guardando imposto"
  if (/imposto|reserva|das|darf/.test(q)) {
    const recPJ = tx.filter(x => x.valor > 0 && x.origem === 'pj').reduce((s, x) => s + x.valor, 0);
    const reserva = recPJ * state.taxPct / 100;
    const imposto = tx.filter(x => x.valor < 0 && x.cat === 'imposto').reduce((s, x) => s + Math.abs(x.valor), 0);
    return `Reserva sugerida: ${state.taxPct}% da receita PJ = ${money(reserva)}. Impostos pagos no período: ${money(imposto)}. ${imposto <= reserva ? '✓ Dentro da reserva.' : '⚠ Acima da reserva sugerida.'}`;
  }

  // "maior gasto"
  if (/maior.*gasto|maior.*despesa|top.*gasto/.test(q)) {
    const desp = tx.filter(x => x.valor < 0).sort((a, b) => a.valor - b.valor).slice(0, 3);
    if (!desp.length) return 'Sem despesas neste período.';
    return 'Maiores gastos do período:\n' + desp.map((x, i) => `${i+1}. ${x.desc} — ${money(x.valor)} (${fmtDate(x.date)})`).join('\n');
  }

  // Fallback: quick summary
  const rec = tx.filter(x => x.valor > 0).reduce((s, x) => s + x.valor, 0);
  const desp = tx.filter(x => x.valor < 0).reduce((s, x) => s + Math.abs(x.valor), 0);
  return `Resumo do período: receita ${money(rec)}, despesa ${money(desp)}, sobra ${money(rec - desp)}. Experimente perguntar por uma categoria específica, "onde cortar custos" ou "estou guardando imposto suficiente?".`;
}

// ==========================================================================
// RENDER: header + nav
// ==========================================================================
const SCREEN_META = {
  dashboard: ['Visão geral', 'Dashboard'],
  transacoes: ['Movimentações', 'Transações'],
  categorias: ['Orçamento', 'Categorias'],
  cartoes: ['Faturas & limites', 'Cartões'],
  pj: ['Pessoa Jurídica', 'PJ / Impostos'],
  insights: ['Inteligência', 'Insights IA'],
  config: ['Preferências', 'Configurações'],
};

function switchTab(name) {
  ui.screen = name;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('hidden', p.id !== 'page-' + name));
  const [kicker, title] = SCREEN_META[name] || ['', ''];
  document.getElementById('kicker').textContent = kicker;
  document.getElementById('title').textContent = title;
  renderCurrent();
}

function populateHeaderFilters() {
  const months = availablePeriods();
  const sel = document.getElementById('month-picker');
  sel.innerHTML = months.map(p => `<option value="${p}">${periodLabelPT(p)}</option>`).join('') + '<option value="all">Todo período</option>';
  sel.value = months.includes(ui.period) ? ui.period : (months[0] || 'all');
  ui.period = sel.value;

  const accSel = document.getElementById('acc-picker');
  accSel.innerHTML = '<option value="all">Todas contas</option>' + state.accounts.map(a => `<option value="${a.id}">${esc(a.nome)}</option>`).join('');
  accSel.value = ui.filters.acc;

  const catSel = document.getElementById('cat-picker');
  catSel.innerHTML = '<option value="all">Todas categorias</option>' + state.categories.map(c => `<option value="${c.id}">${esc(c.nome)}</option>`).join('');
  catSel.value = ui.filters.cat;

  document.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b.dataset.tipo === ui.filters.tipo));
}
function populateMonthPicker() { populateHeaderFilters(); }

// ==========================================================================
// RENDER: DASHBOARD
// ==========================================================================
function renderDashboard() {
  const p = ui.period;
  const monthTx = currentTx();
  const rec = monthTx.filter(x => x.valor > 0).reduce((s, x) => s + x.valor, 0);
  const desp = monthTx.filter(x => x.valor < 0).reduce((s, x) => s + Math.abs(x.valor), 0);
  const recPJ = monthTx.filter(x => x.valor > 0 && x.origem === 'pj').reduce((s, x) => s + x.valor, 0);
  const reserva = recPJ * state.taxPct / 100;
  const saldoPF = state.accounts.find(a => a.id === 'pf')?.saldo || 0;
  const saldoPJ = state.accounts.find(a => a.id === 'pj')?.saldo || 0;
  const saldoTotal = saldoPF + saldoPJ;

  // Category breakdown for donut
  const byCat = {}; monthTx.filter(x => x.valor < 0).forEach(x => byCat[x.cat] = (byCat[x.cat] || 0) + Math.abs(x.valor));
  const bd = Object.keys(byCat).map(id => ({ id, ...catById(id), valor: byCat[id] })).sort((a, b) => b.valor - a.valor);
  const totBd = bd.reduce((s, c) => s + c.valor, 0) || 1;
  let acc = 0;
  const stops = bd.map(c => { const a = acc / totBd * 100; acc += c.valor; const b = acc / totBd * 100; return `${c.cor} ${a.toFixed(2)}% ${b.toFixed(2)}%`; });
  const donutGradient = stops.length ? `conic-gradient(${stops.join(',')})` : 'conic-gradient(#26262a 0 100%)';

  // Evolution: last 6 months (respects global filters)
  const evoMonths = [];
  for (let i = 5; i >= 0; i--) evoMonths.push(shiftMonth(p === 'all' ? today().slice(0, 7) : p, -i));
  const evo = evoMonths.map((mp, i) => {
    const mtx = applyGlobalFilters(state.tx.filter(t => ym(t.date) === mp));
    const r = mtx.filter(x => x.valor > 0).reduce((s, x) => s + x.valor, 0);
    const d = mtx.filter(x => x.valor < 0).reduce((s, x) => s + Math.abs(x.valor), 0);
    const [y, m] = mp.split('-').map(Number);
    const label = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][m - 1];
    return { label, rec: r, desp: d, isLast: i === 5 };
  });
  const maxV = Math.max(1, ...evo.map(m => Math.max(m.rec, m.desp)));

  // Anomalies (rule-based)
  const anomalies = computeAnomalies(p);

  const el = document.getElementById('page-dashboard');
  el.innerHTML = `
    ${filterBanner()}
    <div class="kpi-grid">
      <div class="card-white">
        <div class="flex-row" style="justify-content:space-between;"><span class="kpi-label" style="color:#55555b;">Saldo consolidado</span><span class="kpi-badge" style="background:#0e0e10;color:#fff;">Total</span></div>
        <div class="kpi-value">${money(saldoTotal)}</div>
        <div class="kpi-sub" style="color:#3a9e63;font-weight:600;">▲ 8,4% vs. junho</div>
      </div>
      <div class="card-white card-purple">
        <div class="flex-row" style="justify-content:space-between;"><span class="kpi-label" style="color:#4b4870;">Pessoa Física</span><span class="kpi-badge" style="background:#17162b;color:#c9c5f7;">PF</span></div>
        <div class="kpi-value" style="color:#17162b;">${money(saldoPF)}</div>
        <div class="kpi-sub" style="color:#5a5680;">Itaú Corrente</div>
      </div>
      <div class="card-dark">
        <div class="flex-row" style="justify-content:space-between;"><span class="kpi-label" style="color:#9a9aa0;">Pessoa Jurídica</span><span class="kpi-badge" style="background:#2a2717;color:#f5c518;">PJ</span></div>
        <div class="kpi-value">${money(saldoPJ)}</div>
        <div class="kpi-sub" style="color:#6b6b70;">Borges Consultoria ME</div>
      </div>
      <div class="card-white card-yellow">
        <div class="flex-row" style="justify-content:space-between;"><span class="kpi-label" style="color:#5c4d00;">Reserva imposto</span><span class="kpi-badge" style="background:#17150a;color:#f5c518;">Imposto</span></div>
        <div class="kpi-value" style="color:#1a1500;">${money(reserva)}</div>
        <div class="kpi-sub" style="color:#6b5900;">${state.taxPct}% da receita PJ</div>
      </div>
    </div>

    <div class="grid-2 split-15-1">
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;">
          <div>
            <h3 class="h3">Receita × Despesa</h3>
            <p style="margin:4px 0 0;font-size:13px;color:var(--muted);">Últimos 6 meses · PF + PJ</p>
          </div>
          <div class="legend">
            <span class="l"><span class="sq" style="background:var(--purple);"></span>Receita</span>
            <span class="l"><span class="sq" style="background:#48484e;"></span>Despesa</span>
          </div>
        </div>
        <div class="bar-chart">
          ${evo.map(m => `
            <div class="bar-col">
              <div class="bars">
                <div class="bar" style="height:${Math.max(4, m.rec / maxV * 100)}%;background:${m.isLast ? 'linear-gradient(180deg,#c9c5f7,#f5c518)' : 'var(--purple)'};"></div>
                <div class="bar" style="height:${Math.max(4, m.desp / maxV * 100)}%;background:#48484e;"></div>
              </div>
              <span class="bar-label ${m.isLast ? 'active' : ''}">${m.label}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
          <h3 class="h3">Por categoria</h3>
          <span style="font-size:12px;color:var(--muted-2);">${periodLabelPT(p).split('/')[0].toLowerCase()}</span>
        </div>
        <div class="donut-wrap">
          <div class="donut" style="background:${donutGradient};">
            <div class="donut-inner">
              <span style="font:600 9px 'Manrope',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--muted-2);">Total</span>
              <span style="font-family:'Sora',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-weight:700;font-size:16px;color:var(--text);">${money0(desp)}</span>
            </div>
          </div>
          <div class="donut-legend">
            ${bd.slice(0, 6).map(c => `
              <div class="item">
                <span class="sq" style="background:${c.cor};"></span>
                <span class="name">${esc(c.nome)}</span>
                <span class="pct">${Math.round(c.valor / totBd * 100)}%</span>
              </div>
            `).join('') || '<div style="color:var(--muted);font-size:13px">Sem despesas.</div>'}
          </div>
        </div>
      </div>
    </div>

    <div class="grid-2 split-15-1" style="margin-bottom:0;">
      <div class="card">
        <div class="flex-row mb-18" style="gap:10px;">
          <h3 class="h3">Alertas de anomalia</h3>
          <span style="font:600 10px 'Manrope',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--purple);border:1px solid var(--purple-border);padding:3px 9px;border-radius:20px;">IA</span>
        </div>
        <div class="anom-grid">
          ${anomalies.length ? anomalies.map(a => `
            <div class="anom">
              <div class="top"><span class="dot" style="background:${a.color};"></span><span class="t">${esc(a.title)}</span></div>
              <div class="d">${esc(a.desc)}</div>
            </div>
          `).join('') : '<div style="color:var(--muted);font-size:13px;grid-column:1 / -1;padding:20px 0;">Sem anomalias detectadas neste período.</div>'}
        </div>
      </div>

      <div class="card-white" style="padding:24px;display:flex;flex-direction:column;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <h3 style="margin:0;font-family:'Sora',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-weight:700;font-size:19px;letter-spacing:-.01em;color:#0e0e10;">Resumo do mês</h3>
          <span style="font:700 10px 'Manrope',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;letter-spacing:.06em;background:#0e0e10;color:#fff;padding:4px 10px;border-radius:20px;">✦ IA</span>
        </div>
        <p style="margin:0 0 18px;font-size:13.5px;line-height:1.6;color:#3a3a40;">${esc(quickPitch(p))}</p>
        <div style="margin-top:auto;display:flex;flex-direction:column;gap:9px;">
          <button class="btn btn-black" onclick="app.switchTab('transacoes'); setTimeout(()=>document.getElementById('dz').click(), 200);">Importar extrato</button>
          <button class="btn btn-outline-light" onclick="app.switchTab('insights')">Ver insights completos →</button>
        </div>
      </div>
    </div>
  `;
}

function quickPitch(period) {
  const tx = applyGlobalFilters(txForPeriod(period));
  const rec = tx.filter(x => x.valor > 0).reduce((s, x) => s + x.valor, 0);
  const desp = tx.filter(x => x.valor < 0).reduce((s, x) => s + Math.abs(x.valor), 0);
  const sobra = rec > 0 ? Math.round((rec - desp) / rec * 100) : 0;
  const recPJ = tx.filter(x => x.valor > 0 && x.origem === 'pj').reduce((s, x) => s + x.valor, 0);
  const pctPJ = rec > 0 ? Math.round(recPJ / rec * 100) : 0;
  if (!rec && !desp) return 'Ainda sem lançamentos neste período. Importe uma fatura ou registre transações para começar a ver seus números.';
  if (!rec) return `Você gastou ${money(desp)} sem receitas registradas neste período. Verifique se os créditos estão categorizados como receita.`;
  return `Sobra de caixa de ${sobra}% em ${periodLabelPT(period).toLowerCase()}. ${pctPJ > 0 ? `A PJ concentra ${pctPJ}% da receita.` : ''} Confira as anomalias ao lado.`;
}

function computeAnomalies(period) {
  const cur = applyGlobalFilters(txForPeriod(period)).filter(x => x.valor < 0);
  const prev = applyGlobalFilters(txForPeriod(shiftMonth(period, -1))).filter(x => x.valor < 0);
  const byCat = {}; cur.forEach(x => byCat[x.cat] = (byCat[x.cat] || 0) + Math.abs(x.valor));
  const byCatPrev = {}; prev.forEach(x => byCatPrev[x.cat] = (byCatPrev[x.cat] || 0) + Math.abs(x.valor));

  const out = [];
  Object.keys(byCat).forEach(id => {
    const c = catById(id);
    const p = byCatPrev[id] || 0, v = byCat[id];
    if (p > 0 && v > p * 1.2 && v - p > 100) {
      out.push({ color: '#f5a15a', title: `${c.nome} +${Math.round((v/p - 1) * 100)}%`, desc: `${c.nome} passou de ${money(p)} para ${money(v)} vs. mês anterior.` });
    }
    if (c.budget > 0 && v > c.budget) {
      out.push({ color: '#f96a6a', title: `${c.nome} acima do teto`, desc: `Já em ${Math.round(v / c.budget * 100)}% do orçamento (${money(v)} de ${money(c.budget)}).` });
    }
  });
  const assinTotal = cur.filter(x => x.cat === 'software').reduce((s, x) => s + Math.abs(x.valor), 0);
  const assinCount = cur.filter(x => x.cat === 'software').length;
  if (assinCount >= 3 && assinTotal >= 500) {
    out.push({ color: '#f96a6a', title: 'Assinaturas crescendo', desc: `Software soma ${money(assinTotal)}/mês em ${assinCount} lançamentos — vale revisar sobreposições.` });
  }
  const recPJ = txForPeriod(period).filter(x => x.valor > 0 && x.origem === 'pj').reduce((s, x) => s + x.valor, 0);
  const reserva = recPJ * state.taxPct / 100;
  const imposto = cur.filter(x => x.cat === 'imposto').reduce((s, x) => s + Math.abs(x.valor), 0);
  if (imposto > 0 && imposto <= reserva) {
    out.push({ color: '#46d17f', title: 'Reserva de imposto ok', desc: `DAS pago (${money(imposto)}) dentro da reserva de ${state.taxPct}% sugerida (${money(reserva)}).` });
  }
  return out.slice(0, 4);
}

// ==========================================================================
// RENDER: TRANSAÇÕES
// ==========================================================================
function renderTransacoes() {
  let list = currentTx();
  // Extra local filter: free-text search
  const q = normalize(ui.txSearch || '');
  if (q) list = list.filter(x => normalize(x.desc).includes(q));
  list = list.slice().sort((a, b) => b.date.localeCompare(a.date));

  const selectedCount = Object.values(ui.selected).filter(Boolean).length;
  const despesaOpts = state.categories.filter(c => c.tipo === 'despesa').map(c => ({ v: c.id, l: c.nome }));

  const el = document.getElementById('page-transacoes');
  el.innerHTML = `
    ${filterBanner()}
    <div class="tx-filters">
      <input type="search" class="select-dark" style="min-width:280px;padding:11px 15px;" placeholder="🔎 Buscar descrição…" value="${esc(ui.txSearch || '')}" oninput="app.setTxSearch(this.value)">
      <div class="flex-1"></div>
      <button class="btn btn-light" onclick="document.getElementById('dz').click()">↧ Importar extrato</button>
      <button class="btn" onclick="app.newTx()">+ Nova</button>
    </div>

    <div class="dropzone" id="dz" onclick="document.getElementById('file-input').click()">
      <div class="icon">📄</div>
      <div class="title" id="dz-title">Solte aqui seu PDF de fatura ou extrato</div>
      <div class="sub" id="dz-sub">Também aceita CSV. Nenhum arquivo sai do seu navegador.</div>
      <input type="file" id="file-input" accept=".pdf,.csv" multiple style="display:none" onchange="app.handleFiles(this.files)">
    </div>

    ${selectedCount > 0 ? `
      <div class="tx-selection-bar">
        <span class="count">${selectedCount} selecionada(s)</span>
        <span class="sep">·</span>
        <span class="lbl">Reclassificar em lote:</span>
        <select class="select-inline" id="bulk-cat"><option value="">Escolher categoria…</option>${despesaOpts.map(o => `<option value="${o.v}">${o.l}</option>`).join('')}</select>
        <button class="btn btn-primary" onclick="app.applyBulk()">Aplicar</button>
        <button class="btn" onclick="app.clearSelection()">Limpar</button>
      </div>
    ` : ''}

    <div class="tx-table">
      <div class="tx-header">
        <span></span><span>Data</span><span>Descrição</span><span class="h-cat">Categoria</span><span class="h-acc">Conta</span><span class="right">Valor</span>
      </div>
      ${list.length ? list.map(t => {
        const c = catById(t.cat), a = accById(t.acc);
        const sel = !!ui.selected[t.id];
        const posneg = t.valor < 0 ? 'neg' : 'pos';
        return `
          <div class="tx-row">
            <button class="tx-check ${sel ? 'on' : ''}" onclick="app.toggleSelect('${t.id}')">${sel ? '✓' : ''}</button>
            <span class="tx-date">${fmtDate(t.date)}</span>
            <div class="tx-desc-wrap">
              <span class="tx-desc" onclick="app.editTx('${t.id}')" style="cursor:pointer;">${esc(t.desc)}</span>
              ${t.ia ? '<span class="tx-ia">IA</span>' : ''}
              ${t.parcela ? `<span class="tx-parc">${esc(t.parcela)}</span>` : ''}
            </div>
            <div class="tx-cat"><span class="sq" style="background:${c.cor};"></span><span class="name">${esc(c.nome)}</span></div>
            <div class="tx-acc"><span class="a">${esc(a.nome)}</span><span class="m">${metodoLbl(t.metodo)} · <span style="color:${t.origem === 'pj' ? '#f5c518' : '#b3aef5'};">${t.origem.toUpperCase()}</span></span></div>
            <span class="tx-val ${posneg}">${t.valor < 0 ? '− ' : '+ '}${money(t.valor)}</span>
          </div>
        `;
      }).join('') : '<div class="tx-empty">Nenhuma transação com os filtros atuais.</div>'}
      <div class="tx-count">${list.length} transação(ões)</div>
    </div>
  `;
  wireDropzone(document.getElementById('dz'));
}

// ==========================================================================
// RENDER: CATEGORIAS
// ==========================================================================
function renderCategorias() {
  const p = ui.period;
  const monthTx = currentTx().filter(x => x.valor < 0);
  const byCat = {}; monthTx.forEach(x => byCat[x.cat] = (byCat[x.cat] || 0) + Math.abs(x.valor));
  let cats = state.categories.filter(c => c.tipo === 'despesa');
  // Filter category cards by tipo (PF/PJ) — a PF-only view hides PJ categories, etc.
  if (ui.filters.tipo !== 'all') cats = cats.filter(c => c.origem === ui.filters.tipo || c.origem === 'mix');
  const budgetTotal = cats.reduce((s, c) => s + (c.budget || 0), 0);
  const gastoTotal = Object.values(byCat).reduce((s, v) => s + v, 0);

  const editing = ui.editingCat;
  const draft = ui.catDraft;
  const cores = ['#f5a15a','#46d17f','#5cc9e0','#a3e635','#f472b6','#c9c5f7','#b3aef5','#f96a6a','#8b87e0','#f5c518'];

  const el = document.getElementById('page-categorias');
  el.innerHTML = `
    ${filterBanner()}
    <div class="grid-2 aside-right">
      <div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
          <div style="display:flex;align-items:baseline;gap:10px;">
            <span style="font-family:'Sora',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-weight:700;font-size:22px;color:var(--text);">${money(gastoTotal)}</span>
            <span style="font-size:13px;color:var(--muted);">gastos de ${money(budgetTotal)} orçados · ${periodLabelPT(p).split('/')[0].toLowerCase()}</span>
          </div>
          <button class="btn btn-light" onclick="app.startEditCat('new')">+ Nova categoria</button>
        </div>
        <div class="cat-grid">
          ${cats.map(c => {
            const g = byCat[c.id] || 0;
            const pct = c.budget > 0 ? g / c.budget * 100 : 0;
            const over = g > c.budget && c.budget > 0;
            const bar = over ? '#f96a6a' : c.cor;
            return `
              <div class="cat-card">
                <div class="head">
                  <span class="sq" style="background:${c.cor};"></span>
                  <span class="name">${esc(c.nome)}</span>
                  <span class="origem" style="color:${c.origem === 'pj' ? '#f5c518' : '#b3aef5'};">${c.origem.toUpperCase()}</span>
                  <button class="btn-ghost" onclick="app.startEditCat('${c.id}')" title="Editar">✎</button>
                  <button class="btn-ghost" style="color:var(--muted-2);" onclick="app.deleteCat('${c.id}')" title="Excluir">✕</button>
                </div>
                <div class="stats"><span class="gasto">${money(g)}</span><span class="budget">/ ${money(c.budget || 0)}</span></div>
                <div class="progress"><div class="fill" style="width:${Math.min(100, pct)}%;background:${bar};"></div></div>
                <div class="foot">
                  <span style="color:${bar};font-weight:600;">${Math.round(pct)}% usado</span>
                  ${over ? '<span class="over">estourou</span>' : `<span style="color:var(--muted-2);">${money(Math.max(0, (c.budget||0) - g))} restante</span>`}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      ${editing ? `
        <div class="cat-edit-panel">
          <h3 style="margin:0 0 18px;font-family:'Sora',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-weight:700;font-size:20px;color:var(--text);">${editing === 'new' ? 'Nova categoria' : 'Editar categoria'}</h3>
          <label class="label">Nome</label>
          <input class="input" value="${esc(draft.nome || '')}" oninput="app.setDraft('nome', this.value)" placeholder="Ex. Educação">
          <label class="label" style="margin-top:16px;">Orçamento mensal (R$)</label>
          <input class="input" type="number" value="${draft.budget || ''}" oninput="app.setDraft('budget', this.value)" placeholder="0">
          <label class="label" style="margin-top:16px;">Origem</label>
          <div style="display:flex;gap:8px;margin-bottom:16px;">
            <button class="btn" style="flex:1;border-color:${draft.origem === 'pf' ? '#b3aef5' : '#2a2a2e'};background:${draft.origem === 'pf' ? '#1b1a2b' : 'transparent'};" onclick="app.setDraft('origem','pf')">PF</button>
            <button class="btn" style="flex:1;border-color:${draft.origem === 'pj' ? '#f5c518' : '#2a2a2e'};background:${draft.origem === 'pj' ? '#211e0c' : 'transparent'};" onclick="app.setDraft('origem','pj')">PJ</button>
          </div>
          <label class="label">Cor</label>
          <div class="color-picker">
            ${cores.map(c => `<button class="color-swatch ${c === draft.cor ? 'on' : ''}" style="background:${c};" onclick="app.setDraft('cor','${c}')"></button>`).join('')}
          </div>
          <div style="display:flex;gap:10px;">
            <button class="btn" style="flex:1;" onclick="app.cancelCat()">Cancelar</button>
            <button class="btn btn-primary" style="flex:1;" onclick="app.saveCat()">Salvar</button>
          </div>
        </div>
      ` : `
        <div class="cat-edit-empty">
          <div style="width:44px;height:44px;margin:0 auto 12px;border-radius:13px;background:var(--purple-bg);display:flex;align-items:center;justify-content:center;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></svg>
          </div>
          <div style="font-family:'Sora',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-weight:600;font-size:18px;color:var(--text-3);margin-bottom:6px;">Orçamento por categoria</div>
          <p style="margin:0;font-size:13px;color:var(--muted);line-height:1.5;">Edite o limite mensal de uma categoria ou crie uma nova. A barra fica vermelha quando o gasto passa do orçamento.</p>
        </div>
      `}
    </div>
  `;
}

// ==========================================================================
// RENDER: CARTÕES
// ==========================================================================
function renderCartoes() {
  const cards = state.accounts.filter(a => a.tipo?.startsWith('cartao_'));
  const active = cards.find(c => c.id === ui.cardTab) || cards[0];
  if (!active) { document.getElementById('page-cartoes').innerHTML = '<div class="empty" style="padding:60px;text-align:center;color:var(--muted);">Sem cartões cadastrados.</div>'; return; }
  const p = ui.period;
  // Card tab overrides the account filter; apply the other filters (tipo, cat)
  let cardTx = state.tx.filter(x => x.acc === active.id && x.valor < 0 && ym(x.date) === p);
  if (ui.filters.tipo !== 'all') cardTx = cardTx.filter(x => x.origem === ui.filters.tipo);
  if (ui.filters.cat !== 'all')  cardTx = cardTx.filter(x => x.cat === ui.filters.cat);
  cardTx = cardTx.sort((a, b) => b.date.localeCompare(a.date));
  const fatura = cardTx.reduce((s, x) => s + Math.abs(x.valor), 0);
  const uso = Math.min(100, active.limite ? fatura / active.limite * 100 : 0);
  const parcelas = state.tx.filter(x => x.acc === active.id && x.parcela);
  const closed = (state.closed[active.id] || []);

  const el = document.getElementById('page-cartoes');
  el.innerHTML = `
    ${filterBanner()}
    <div class="card-tabs">
      ${cards.map(c => `
        <button class="card-tab ${c.id === active.id ? 'active' : ''}" onclick="app.setCardTab('${c.id}')">
          <span class="sq" style="background:${c.id === 'itau' ? '#f5a15a' : '#f96a3d'};"></span>${esc(c.nome)}
        </button>
      `).join('')}
    </div>

    <div class="grid-2 split-12-1">
      <div class="fatura-hero">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;">
          <div>
            <div class="lbl">Fatura atual · ${esc(active.nome)}</div>
            <div class="val">${money(fatura)}</div>
          </div>
          <div class="datas">Fecha ${esc(active.fecha || '—')}<br>Vence ${esc(active.vence || '—')}</div>
        </div>
        <div class="uso-lbl"><span>Limite usado</span><span style="font-weight:600;color:var(--bg);">${Math.round(uso)}% de ${money(active.limite || 0)}</span></div>
        <div class="uso-bar"><div style="height:100%;border-radius:6px;width:${uso}%;background:var(--bg);transition:width .7s cubic-bezier(.22,1,.36,1);"></div></div>
      </div>

      <div class="card">
        <h3 class="h3 h3-xs" style="margin-bottom:14px;">Parcelas em aberto <span style="font-size:13px;color:var(--muted-2);">(${parcelas.length})</span></h3>
        ${parcelas.length ? `<div style="display:flex;flex-direction:column;gap:10px;">${parcelas.map(p => `
          <div class="parc-item">
            <span class="parc-badge">${esc(p.parcela)}</span>
            <span style="flex:1;font-size:13.5px;color:var(--text-3);">${esc(p.desc)}</span>
            <span style="font-family:'Sora',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-weight:600;font-size:14px;color:var(--red);">${money(p.valor)}</span>
          </div>
        `).join('')}</div>` : '<div style="font-size:13px;color:var(--muted-2);padding:10px 0;">Nenhuma parcela em aberto neste cartão.</div>'}
      </div>
    </div>

    <div class="grid-2 split-16-1">
      <div class="card">
        <h3 class="h3 h3-xs" style="margin-bottom:12px;">Lançamentos da fatura <span style="font-size:13px;color:var(--muted-2);">(${cardTx.length})</span></h3>
        ${cardTx.length ? cardTx.map(t => {
          const c = catById(t.cat);
          return `
            <div class="card-tx-line">
              <span style="font:600 13px 'Manrope',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:var(--muted-2);width:44px;">${fmtDate(t.date)}</span>
              <span style="width:9px;height:9px;border-radius:3px;background:${c.cor};"></span>
              <span style="flex:1;font-size:14px;color:var(--text-2);">${esc(t.desc)}</span>
              ${t.parcela ? `<span style="font-size:10.5px;color:var(--muted);background:var(--panel-2);padding:2px 7px;border-radius:14px;">${esc(t.parcela)}</span>` : ''}
              <span style="font-family:'Sora',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-weight:600;font-size:14px;color:var(--red);">− ${money(t.valor)}</span>
            </div>
          `;
        }).join('') : '<div style="font-size:13px;color:var(--muted-2);padding:10px 0;">Nenhum lançamento neste período.</div>'}
      </div>

      <div class="card">
        <h3 class="h3 h3-xs" style="margin-bottom:14px;">Faturas fechadas</h3>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${closed.length ? closed.map(f => `
            <div style="display:flex;align-items:center;justify-content:space-between;background:var(--panel-2);border:1px solid var(--border-3);border-radius:13px;padding:13px 15px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="width:8px;height:8px;border-radius:50%;background:var(--green);"></span>
                <span style="font-size:14px;color:var(--text-3);">${esc(f.mes)}</span>
                <span style="font:600 10px 'Manrope',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--green);">paga</span>
              </div>
              <span style="font-family:'Sora',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-weight:600;font-size:14px;color:var(--muted-3);">${money(f.valor)}</span>
            </div>
          `).join('') : '<div style="font-size:13px;color:var(--muted-2);">Sem histórico.</div>'}
        </div>
      </div>
    </div>
  `;
}

// ==========================================================================
// RENDER: PJ / IMPOSTOS
// ==========================================================================
function renderPJ() {
  const p = ui.period;
  // PJ view: force tipo=pj scope, but still allow acc/cat filters through
  let pjTx = txForPeriod(p).filter(x => x.origem === 'pj');
  if (ui.filters.acc !== 'all') pjTx = pjTx.filter(x => x.acc === ui.filters.acc);
  if (ui.filters.cat !== 'all') pjTx = pjTx.filter(x => x.cat === ui.filters.cat);
  const receitaPJ = pjTx.filter(x => x.valor > 0).reduce((s, x) => s + x.valor, 0);
  const despesaPJ = pjTx.filter(x => x.valor < 0).reduce((s, x) => s + Math.abs(x.valor), 0);
  const reserva = receitaPJ * state.taxPct / 100;
  const disponivel = receitaPJ - despesaPJ - reserva;
  const clients = state.clients;
  const totCli = clients.reduce((s, c) => s + c.valor, 0) || 1;

  const el = document.getElementById('page-pj');
  el.innerHTML = `
    ${filterBanner()}
    <div class="pj-banner">
      <span class="dot"></span>
      <span>Visão exclusiva da <strong>Borges Consultoria ME</strong> — separada da conta pessoal.</span>
    </div>

    <div class="grid-4">
      <div class="pj-kpi" style="background:var(--yellow);color:var(--yellow-dark);">
        <div class="lbl" style="color:#5c4d00;">Receita PJ · ${periodLabelPT(p).split('/')[0].toLowerCase()}</div>
        <div class="val" style="color:#1a1500;">${money(receitaPJ)}</div>
      </div>
      <div class="pj-kpi">
        <div class="lbl" style="color:var(--red);">Despesa PJ</div>
        <div class="val">${money(despesaPJ)}</div>
      </div>
      <div class="pj-kpi">
        <div class="lbl" style="color:var(--yellow-text);">Reserva imposto</div>
        <div class="val">${money(reserva)}</div>
      </div>
      <div class="pj-kpi">
        <div class="lbl" style="color:var(--green);">Disponível (líq.)</div>
        <div class="val">${money(disponivel)}</div>
      </div>
    </div>

    <div class="grid-2 split-15-1">
      <div class="card">
        <h3 class="h3 h3-sm" style="margin-bottom:18px;">Receita por cliente / projeto</h3>
        <div style="display:flex;flex-direction:column;gap:16px;">
          ${clients.map(c => `
            <div class="client-row">
              <div class="head">
                <span class="name">${esc(c.nome)}</span>
                <span class="tipo" style="color:${c.tipo === 'pj' ? '#f5c518' : '#b3aef5'};">${c.tipo.toUpperCase()}</span>
                <span class="projeto">${esc(c.projeto)}</span>
                <span class="flex-1"></span>
                <span class="valor">${money(c.valor)}</span>
              </div>
              <div class="progress" style="height:7px;"><div class="fill" style="width:${Math.round(c.valor / totCli * 100)}%;background:var(--purple);"></div></div>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="card">
          <h3 class="h3 h3-sm" style="margin-bottom:5px;">Reserva de imposto</h3>
          <p style="margin:0 0 16px;font-size:13px;color:var(--muted);line-height:1.5;">% da receita PJ guardado automaticamente para o DAS.</p>
          <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:14px;">
            <span class="tax-slider-val">${state.taxPct}%</span>
            <span style="font-size:14px;color:var(--muted);">= ${money(reserva)}/mês</span>
          </div>
          <input type="range" min="0" max="40" step="1" value="${state.taxPct}" oninput="app.setTax(this.value)" style="width:100%;accent-color:var(--yellow);cursor:pointer;">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted-2);margin-top:4px;"><span>0%</span><span>40%</span></div>
        </div>
        <div class="card">
          <div style="font:600 11px 'Manrope',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--muted-2);margin-bottom:14px;">Fluxo de caixa PJ · ${periodLabelPT(p).split('/')[0].toLowerCase()}</div>
          <div style="display:flex;flex-direction:column;gap:11px;font-size:14px;">
            <div style="display:flex;justify-content:space-between;"><span style="color:var(--muted);">Entradas</span><span style="color:var(--green);font-family:'Sora',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:600;">+ ${money(receitaPJ)}</span></div>
            <div style="display:flex;justify-content:space-between;"><span style="color:var(--muted);">Saídas</span><span style="color:var(--red);font-family:'Sora',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:600;">− ${money(despesaPJ)}</span></div>
            <div style="display:flex;justify-content:space-between;"><span style="color:var(--muted);">Reserva imposto</span><span style="color:var(--yellow);font-family:'Sora',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:600;">− ${money(reserva)}</span></div>
            <div style="height:1px;background:var(--border);margin:3px 0;"></div>
            <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-2);font-weight:600;">Sobra líquida</span><span style="color:var(--green);font-family:'Sora',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-weight:700;font-size:17px;">${money(disponivel)}</span></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ==========================================================================
// RENDER: INSIGHTS
// ==========================================================================
function renderInsights() {
  const suggested = ['Quanto gastei com Software PJ?', 'Onde posso cortar custos?', 'Qual foi meu maior gasto?', 'Estou guardando imposto suficiente?'];
  const insight = ui.insightText || ruleBasedInsight(ui.period);

  const el = document.getElementById('page-insights');
  el.innerHTML = `
    ${filterBanner()}
    <div class="grid-2 eq" style="align-items:start;">
      <div class="card">
        <div class="flex-row mb-16" style="gap:11px;">
          <span style="width:28px;height:28px;border-radius:9px;background:var(--purple);display:flex;align-items:center;justify-content:center;font-size:15px;color:var(--purple-dark);">✦</span>
          <h3 class="h3 h3-sm flex-1" style="margin:0;">Resumo de ${periodLabelPT(ui.period).toLowerCase()}</h3>
          <button class="btn-purple-soft" onclick="app.genInsight()">
            ${ui.insightLoading ? '<span class="spinner"></span>' : ''}
            <span>${ui.insightLoading ? 'Gerando…' : 'Gerar novo resumo'}</span>
          </button>
        </div>
        <p style="margin:0;font-size:14.5px;line-height:1.75;color:var(--text-4);white-space:pre-wrap;">${esc(insight)}</p>
      </div>

      <div class="chat">
        <div class="chat-head">
          <span class="dot"></span>
          <h3 class="h3 h3-sm" style="margin:0;">Pergunte sobre seus dados</h3>
        </div>
        <div class="chat-body" id="chat-body">
          ${ui.chat.length === 0 ? `
            <p style="margin:0 0 4px;font-size:13.5px;color:var(--muted);">Experimente perguntar:</p>
            ${suggested.map(q => `<button class="chat-suggest" onclick="app.sendChat('${esc(q).replace(/'/g,'&#39;')}')">${esc(q)}</button>`).join('')}
          ` : ui.chat.map(m => `<div class="chat-bubble ${m.role}">${esc(m.text)}</div>`).join('')}
          ${ui.chatLoading ? '<div class="chat-loading"><span></span><span></span><span></span></div>' : ''}
        </div>
        <div class="chat-input-wrap">
          <input class="chat-input" id="chat-input" placeholder="Ex.: quanto gastei com software?" value="${esc(ui.chatInput)}" oninput="app._setChatInput(this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault(); app.sendChat();}">
          <button class="chat-send" onclick="app.sendChat()">➤</button>
        </div>
      </div>
    </div>
  `;
  const body = document.getElementById('chat-body');
  if (body) body.scrollTop = body.scrollHeight;
}

// ==========================================================================
// RENDER: CONFIG
// ==========================================================================
function renderConfig() {
  const el = document.getElementById('page-config');
  el.innerHTML = `
    <div class="grid-2 eq" style="align-items:start;">
      <div class="card">
        <h3 class="h3 h3-sm mb-16">Contas conectadas</h3>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${state.accounts.map(a => `
            <div class="acc-row">
              <div class="acc-avatar">${esc(a.inst[0])}</div>
              <div class="flex-1">
                <div style="font-size:14.5px;font-weight:600;color:var(--text-2);">${esc(a.nome)}</div>
                <div style="font-size:12px;color:var(--muted);">${accTypeLabel(a.tipo)}</div>
              </div>
              <span style="font:600 10px 'Manrope',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;letter-spacing:.06em;color:${a.origem === 'pj' ? '#f5c518' : '#b3aef5'};border:1px solid #2c2c30;padding:3px 9px;border-radius:14px;">${a.origem.toUpperCase()}</span>
              <span style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--green);"><span style="width:7px;height:7px;border-radius:50%;background:var(--green);"></span>ativo</span>
            </div>
          `).join('')}
        </div>
        <button style="margin-top:14px;width:100%;border:1px dashed #2c2c30;background:transparent;color:var(--muted);padding:13px;border-radius:14px;cursor:pointer;font-size:14px;">+ Conectar nova conta</button>
      </div>

      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="card">
          <h3 class="h3 h3-sm" style="margin-bottom:5px;">Regras de categorização</h3>
          <p style="margin:0 0 16px;font-size:13px;color:var(--muted);line-height:1.5;">Palavras-chave aplicadas automaticamente. O que não bate cai como "Serviços PJ".</p>
          <div style="display:flex;flex-direction:column;gap:9px;">
            ${state.rules.map(r => { const c = catById(r.cat); return `
              <div class="rule-row">
                <span class="flex-1" style="font-size:13.5px;color:var(--text-4);">${esc(r.kw)}</span>
                <span style="color:#55555b;">→</span>
                <div class="flex-row" style="gap:7px;">
                  <span style="width:9px;height:9px;border-radius:3px;background:${c.cor};"></span>
                  <span style="font-size:13px;color:var(--text-2);">${esc(c.nome)}</span>
                </div>
              </div>
            `; }).join('')}
          </div>
        </div>

        <div class="card">
          <h3 class="h3 h3-sm mb-14">Exportação e reset</h3>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <button class="btn" style="flex:1;min-width:150px;background:var(--panel-2);" onclick="app.exportCSV()">↧ Exportar CSV</button>
            <button class="btn" style="flex:1;min-width:150px;background:var(--panel-2);" onclick="app.exportJSON()">↧ Exportar JSON</button>
            <button class="btn btn-danger" style="flex:1;min-width:150px;" onclick="app.resetSeed()">↺ Restaurar demo</button>
          </div>
          ${ui.exportMsg ? `<div class="export-msg"><span>✓</span>${esc(ui.exportMsg)}</div>` : ''}
        </div>
      </div>
    </div>
  `;
}
function accTypeLabel(t) { return ({ corrente_pf: 'Conta corrente · PF', corrente_pj: 'Conta corrente · PJ', cartao_itau: 'Cartão de crédito · PF', cartao_inter: 'Cartão de crédito · PF' }[t] || t); }

// ==========================================================================
// RENDER dispatcher
// ==========================================================================
function renderCurrent() {
  ({ dashboard: renderDashboard, transacoes: renderTransacoes, categorias: renderCategorias, cartoes: renderCartoes, pj: renderPJ, insights: renderInsights, config: renderConfig }[ui.screen] || renderDashboard)();
}
function renderAll() {
  populateMonthPicker();
  renderCurrent();
}

// ==========================================================================
// FILE IMPORT (PDF + CSV) + PREVIEW MODAL
// ==========================================================================
function wireDropzone(dz) {
  if (!dz || dz._wired) return; dz._wired = true;
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
  dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
}

async function handleFiles(fileList) {
  const files = [...fileList].filter(f => /\.(pdf|csv)$/i.test(f.name));
  if (!files.length) { toast('Arquivos ignorados (aceito: PDF, CSV)', 'error'); return; }
  const dz = document.getElementById('dz');
  if (dz) dz.classList.add('processing');
  const title = document.getElementById('dz-title'), sub = document.getElementById('dz-sub');
  const t0 = title?.textContent, s0 = sub?.textContent;
  try {
    let all = [], sources = [];
    for (const f of files) {
      if (title) title.innerHTML = `<span class="spinner"></span>Processando ${esc(f.name)}`;
      if (sub) sub.textContent = `${(f.size / 1024).toFixed(0)} KB`;
      const res = await processFile(f);
      if (res && res.transactions.length) { all = all.concat(res.transactions.map(t => ({ ...t, __src: res.source, __srcFile: f.name }))); sources.push(res.source); }
      else if (res) { toast(`Sem transações reconhecidas em ${f.name}`, 'error'); }
    }
    if (!all.length) { toast('Nada para importar', 'error'); return; }
    openImport(all, sources.join(', '));
  } catch (e) { console.error(e); toast('Erro: ' + e.message, 'error'); }
  finally {
    if (dz) dz.classList.remove('processing');
    if (title) title.textContent = t0;
    if (sub) sub.textContent = s0;
  }
}

async function processFile(f) {
  const name = f.name.toLowerCase();
  if (name.endsWith('.pdf')) {
    if (typeof pdfjsLib === 'undefined') { toast('pdf.js não carregou (CDN bloqueado?)', 'error'); return null; }
    const buf = await f.arrayBuffer();
    const lines = await extractPdfText(buf);
    const bank = detectBank(lines) || 'PDF';
    const year = detectYear(lines);
    const transactions = parseStatementLines(lines, year);
    return { transactions, source: `${bank} · ${f.name}` };
  }
  if (name.endsWith('.csv')) {
    const text = await f.text();
    const rows = parseCSV(text);
    const transactions = rows.map(r => {
      const date = parseDate(r.data || r.date);
      const amount = parseAmount(r.valor || r.value || r.amount);
      const description = (r.descricao || r.descrição || r.description || r.historico || '').trim();
      if (!date || !amount || !description) return null;
      return { date, description, amount: Math.abs(amount), type: amount < 0 ? 'income' : 'expense', installment: null };
    }).filter(Boolean);
    return { transactions, source: `CSV · ${f.name}` };
  }
  return null;
}
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return [];
  const sep = lines[0].split(';').length > lines[0].split(',').length ? ';' : ',';
  const headers = splitCSVLine(lines[0], sep).map(h => normalize(h.trim()));
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCSVLine(lines[i], sep);
    if (cells.length < 2) continue;
    const row = {}; headers.forEach((h, idx) => row[h] = (cells[idx] || '').trim());
    out.push(row);
  }
  return out;
}
function splitCSVLine(line, sep) {
  const out = []; let cur = ''; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === sep && !inQ) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur); return out;
}

function findDuplicate(t) {
  const key = `${t.date}|${(t.amount || Math.abs(t.valor || 0)).toFixed(2)}|${normalize(t.description || t.desc).slice(0, 25)}`;
  return state.tx.find(e => `${e.date}|${Math.abs(e.valor).toFixed(2)}|${normalize(e.desc).slice(0, 25)}` === key);
}

function openImport(transactions, source) {
  ui.import = {
    source,
    rows: transactions.map((t, i) => ({
      id: 'imp_' + i,
      include: t.type !== 'income',
      date: t.date, desc: t.description, amount: t.amount,
      type: t.type || 'expense', installment: t.installment,
      cat: autoCategorize(t.description),
      dup: !!findDuplicate(t),
      srcFile: t.__srcFile,
    })),
  };
  document.getElementById('import-sub').textContent = `${transactions.length} transações extraídas — ${source}`;
  renderImportList();
  document.getElementById('import-modal').classList.add('active');
}
function renderImportList() {
  const list = document.getElementById('import-list');
  const despesaOpts = state.categories.filter(c => c.tipo === 'despesa').map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
  const receitaOpts = state.categories.filter(c => c.tipo === 'receita').map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
  list.innerHTML = ui.import.rows.map((r, i) => `
    <div class="import-row" style="${r.include ? '' : 'opacity:.4;'}${r.dup ? 'background:rgba(234,179,8,.08);' : ''}">
      <input type="checkbox" ${r.include ? 'checked' : ''} onchange="app.importToggle(${i}, this.checked)">
      <span class="r-date">${fmtDate(r.date)}</span>
      <span class="r-desc">${esc(r.desc)}${r.installment ? ` <span style="font-size:10px;color:var(--muted);background:var(--panel);padding:2px 6px;border-radius:14px;margin-left:6px;">${r.installment}</span>` : ''}${r.dup ? ' <span class="r-ia" style="color:var(--yellow);border-color:var(--yellow-border);">duplicada?</span>' : ''}</span>
      <span class="r-val ${r.type === 'income' ? 'pos' : 'neg'}">${r.type === 'income' ? '+ ' : '− '}${money(r.amount)}</span>
      <select onchange="app.importSetCat(${i}, this.value)">
        <option value="">Sem categoria</option>
        ${r.type === 'income' ? receitaOpts : despesaOpts}
      </select>
    </div>
  `).join('');
  document.querySelectorAll('#import-list select').forEach((sel, i) => sel.value = ui.import.rows[i].cat || '');
  const sel = ui.import.rows.filter(r => r.include).length;
  document.getElementById('import-confirm-btn').textContent = sel ? `Importar ${sel} lançamento(s)` : 'Importar';
  document.getElementById('import-confirm-btn').disabled = sel === 0;
}

// ==========================================================================
// APP — public functions used from HTML `onclick=` attrs
// ==========================================================================
const app = {
  switchTab,
  handleFiles,
  setFilter(k, v) { ui.filters[k] = v; ui.selected = {}; ui.insightText = ''; populateHeaderFilters(); renderCurrent(); },
  setTipoFilter(v) { ui.filters.tipo = v; ui.selected = {}; ui.insightText = ''; populateHeaderFilters(); renderCurrent(); },
  setTxSearch(v) { ui.txSearch = v; renderTransacoes(); },
  clearFilters() { ui.filters = { acc: 'all', cat: 'all', tipo: 'all' }; ui.txSearch = ''; ui.insightText = ''; populateHeaderFilters(); renderCurrent(); },
  toggleSelect(id) { ui.selected[id] = !ui.selected[id]; renderTransacoes(); },
  clearSelection() { ui.selected = {}; renderTransacoes(); },
  applyBulk() {
    const cat = document.getElementById('bulk-cat')?.value;
    if (!cat) { toast('Escolha uma categoria', 'error'); return; }
    state.tx.forEach(t => { if (ui.selected[t.id]) { t.cat = cat; t.ia = false; } });
    ui.selected = {}; saveState(); renderTransacoes(); toast('Reclassificadas', 'success');
  },
  newTx() {
    const desc = prompt('Descrição da transação:'); if (!desc) return;
    const valor = parseAmount(prompt('Valor (use "-" para despesa, ex. -45,90):') || '0');
    if (!valor) return;
    const cat = autoCategorize(desc);
    state.tx.unshift({ id: uid(), date: today(), desc: desc.trim(), valor, acc: valor < 0 ? 'itau' : 'pf', cat, origem: detectOrigem(desc, cat), metodo: valor < 0 ? 'credito' : 'transf', parcela: null, ia: false });
    saveState(); renderAll(); toast('Transação adicionada', 'success');
  },
  editTx(id) {
    const t = state.tx.find(x => x.id === id); if (!t) return;
    const catOpts = state.categories.map(c => `${c.nome} (${c.id})`).join('\n');
    const newCat = prompt(`Nova categoria (id) para "${t.desc}"?\n\n${catOpts}`, t.cat);
    if (newCat && state.categories.find(c => c.id === newCat)) { t.cat = newCat; t.ia = false; saveState(); renderTransacoes(); toast('Atualizada', 'success'); }
  },
  startEditCat(id) {
    if (id === 'new') { ui.editingCat = 'new'; ui.catDraft = { nome: '', budget: 0, cor: '#b3aef5', origem: 'pf', tipo: 'despesa' }; }
    else { const c = state.categories.find(x => x.id === id); ui.editingCat = id; ui.catDraft = { ...c }; }
    renderCategorias();
  },
  setDraft(f, v) { ui.catDraft[f] = v; renderCategorias(); },
  saveCat() {
    const d = ui.catDraft; if (!d.nome) return toast('Informe o nome', 'error');
    if (ui.editingCat === 'new') {
      const id = (d.nome.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'cat') + Date.now().toString().slice(-3);
      state.categories.push({ ...d, id, budget: +d.budget || 0, keywords: [] });
    } else {
      const c = state.categories.find(x => x.id === ui.editingCat);
      Object.assign(c, d, { budget: +d.budget || 0 });
    }
    ui.editingCat = null; ui.catDraft = {}; saveState(); renderCategorias(); toast('Categoria salva', 'success');
  },
  cancelCat() { ui.editingCat = null; ui.catDraft = {}; renderCategorias(); },
  deleteCat(id) {
    if (!confirm('Excluir categoria? As transações vão para "Serviços PJ".')) return;
    state.tx.forEach(t => { if (t.cat === id) t.cat = 'servpj'; });
    state.categories = state.categories.filter(c => c.id !== id);
    saveState(); renderCategorias(); toast('Categoria excluída');
  },
  setCardTab(id) { ui.cardTab = id; renderCartoes(); },
  setTax(v) { state.taxPct = +v; saveState(); renderPJ(); },
  async genInsight() {
    if (ui.insightLoading) return;
    ui.insightLoading = true; renderInsights();
    const catList = state.categories.filter(c => c.tipo === 'despesa').map(c => `${c.id} (${c.nome})`).join(', ');
    const ctx = buildAIContext();
    const out = await aiComplete({
      max_tokens: 900,
      system: 'Você é analista financeiro. Gere resumo mensal em pt-BR, 3 parágrafos curtos, texto corrido, sem markdown. Categorias disponíveis: ' + catList + '. Dados:\n' + ctx,
      messages: [{ role: 'user', content: `Gere o resumo de ${periodLabelPT(ui.period)}.` }],
    });
    ui.insightText = out || ruleBasedInsight(ui.period);
    ui.insightLoading = false; renderInsights();
  },
  _setChatInput(v) { ui.chatInput = v; },
  async sendChat(text) {
    const q = (text != null ? String(text) : ui.chatInput).trim();
    if (!q || ui.chatLoading) return;
    ui.chat.push({ role: 'user', text: q });
    ui.chatInput = ''; ui.chatLoading = true; renderInsights();
    const out = await aiComplete({
      max_tokens: 700,
      system: 'Você é assistente do Borges Finance. Responda em pt-BR, conciso, direto. Use SOMENTE estes dados. Formato brasileiro (R$). Se faltar dado, diga o que falta.\n' + buildAIContext(),
      messages: ui.chat.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
    });
    ui.chat.push({ role: 'bot', text: out || ruleBasedChat(q, ui.period) });
    ui.chatLoading = false; renderInsights();
  },
  importToggle(i, v) { ui.import.rows[i].include = v; renderImportList(); },
  importToggleAll(v) { ui.import.rows.forEach(r => r.include = v); renderImportList(); },
  importExcludeDupes() { ui.import.rows.forEach(r => { if (r.dup) r.include = false; }); renderImportList(); },
  importSetCat(i, v) { ui.import.rows[i].cat = v; renderImportList(); },
  closeImport() { ui.import = null; document.getElementById('import-modal').classList.remove('active'); },
  confirmImport() {
    const sel = ui.import.rows.filter(r => r.include);
    if (!sel.length) return;
    sel.forEach(r => {
      const valor = r.type === 'income' ? Math.abs(r.amount) : -Math.abs(r.amount);
      const cat = r.cat || (r.type === 'income' ? 'receita' : autoCategorize(r.desc));
      state.tx.unshift({ id: uid(), date: r.date, desc: r.desc, valor, acc: valor < 0 ? 'itau' : 'pf', cat, origem: detectOrigem(r.desc, cat), metodo: valor < 0 ? 'credito' : 'transf', parcela: r.installment || null, ia: true });
    });
    ui.import = null; document.getElementById('import-modal').classList.remove('active');
    saveState(); renderAll();
    toast(`${sel.length} lançamento(s) importado(s)`, 'success');
    switchTab('dashboard');
  },
  exportCSV() {
    const rows = [['data','descricao','valor','categoria','conta','origem','metodo','parcela']];
    state.tx.slice().sort((a, b) => a.date.localeCompare(b.date)).forEach(t => {
      const c = catById(t.cat), a = accById(t.acc);
      rows.push([t.date, `"${(t.desc || '').replace(/"/g, '""')}"`, t.valor.toFixed(2).replace('.', ','), c.nome, a.nome, t.origem, t.metodo || '', t.parcela || '']);
    });
    downloadFile('borges-finance-' + today() + '.csv', 'text/csv;charset=utf-8', '﻿' + rows.map(r => r.join(',')).join('\n'));
    ui.exportMsg = `Arquivo CSV gerado — ${state.tx.length} transações.`;
    setTimeout(() => { ui.exportMsg = ''; renderConfig(); }, 4500);
    renderConfig();
  },
  exportJSON() {
    downloadFile('borges-finance-' + today() + '.json', 'application/json', JSON.stringify(state, null, 2));
    ui.exportMsg = `Arquivo JSON gerado — ${state.tx.length} transações + configuração.`;
    setTimeout(() => { ui.exportMsg = ''; renderConfig(); }, 4500);
    renderConfig();
  },
  resetSeed,
};
window.app = app;

function downloadFile(name, mime, content) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function buildAIContext() {
  const p = ui.period;
  const tx = applyGlobalFilters(txForPeriod(p));
  const rec = tx.filter(x => x.valor > 0).reduce((s, x) => s + x.valor, 0);
  const desp = tx.filter(x => x.valor < 0).reduce((s, x) => s + Math.abs(x.valor), 0);
  const recPJ = tx.filter(x => x.valor > 0 && x.origem === 'pj').reduce((s, x) => s + x.valor, 0);
  const byCat = {}; tx.filter(x => x.valor < 0).forEach(x => byCat[x.cat] = (byCat[x.cat] || 0) + Math.abs(x.valor));
  const catStr = Object.keys(byCat).map(id => catById(id).nome + ': ' + money(byCat[id])).join('; ');
  return `Referência: ${periodLabelPT(p)}. Receita ${money(rec)} (PJ ${money(recPJ)}, PF ${money(rec - recPJ)}). Despesa ${money(desp)}. Reserva imposto: ${state.taxPct}% da receita PJ = ${money(recPJ * state.taxPct / 100)}. Categorias: ${catStr}.`;
}

// ==========================================================================
// INIT
// ==========================================================================
loadState();
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}
document.querySelectorAll('.nav-btn').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));
document.getElementById('month-picker').addEventListener('change', (e) => { ui.period = e.target.value; ui.insightText = ''; renderCurrent(); });
document.getElementById('acc-picker').addEventListener('change', (e) => app.setFilter('acc', e.target.value));
document.getElementById('cat-picker').addEventListener('change', (e) => app.setFilter('cat', e.target.value));
document.querySelectorAll('.seg-btn').forEach(b => b.addEventListener('click', () => app.setTipoFilter(b.dataset.tipo)));
document.getElementById('btn-clear-filters').addEventListener('click', () => app.clearFilters());
document.querySelectorAll('.modal-bg').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('active'); }));
document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.modal-bg.active').forEach(m => m.classList.remove('active')); });
switchTab('dashboard');
