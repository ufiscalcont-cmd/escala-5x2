// Bateria de testes aleatórios com verificador independente (oráculo)
// Uso: node testes/fuzz.js [quantidade=1000] [semente=12345]
const fs = require('fs');
const html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');
const code = html.match(/<script id="logic">([\s\S]*?)<\/script>/)[1];
const L = new Function('module', code + `; return { buildSpan, gerarOpcoes, avaliar, escalaAtual, validar, diasFerias, remuneracao,
  importarColaboradores, importarEmpresa, parseHorario, regra, fechadoGer, nDomingo, capDia, limiteSem, cargaAtual, cargaNova,
  minNoturnos, janela, presencaMin, descreverHorario, horarioPrincipal, diasTrabalhados, ehFeriado, segMin: sg => sg.reduce((a,[x,y])=>a+y-x,0) };`)({});

const N = +(process.argv[2] || 1000);
let seed = +(process.argv[3] || 12345);
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = a => a[Math.floor(rnd() * a.length)];
const chance = p => rnd() < p;
const hm = m => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');

function horarioAleatorio(){
  if (chance(0.25)) return '';
  if (chance(0.03)) return pick(['abc', '8-', '25:00-26:00', '08:00-12:00 xx']);          // inválido de propósito
  if (chance(0.05)) return '22:00-02:00 03:00-06:00';                                         // noturno atravessando a meia-noite
  const ent = ri(10, 26) * 30, a = ri(4, 10) * 30, iv = pick([0, 15, 30, 60, 90, 120, 150]), b = ri(2, 10) * 30;
  if (chance(0.3)) return `${hm(ent)}-${hm(ent + a + b)}`;
  return `${hm(ent)}-${hm(ent + a)} ${hm(ent + a + iv)}-${hm(ent + a + iv + b)}`;
}
function cenario(){
  const meses = []; for (let y = 2026; y <= 2028; y++) for (let m = 1; m <= 12; m++) meses.push(`${y}-${String(m).padStart(2, '0')}`);
  const comp = pick(['nenhuma', 'individual', 'coletiva', 'risco']);
  const aberto = [0,1,2,3,4,5,6].map(() => chance(0.85)); if (!aberto.some(Boolean)) aberto[ri(0, 6)] = true;
  const func = [0,1,2,3,4,5,6].map(() => { if (chance(0.1)) return ['', '']; const a = ri(10, 20) * 30, b = a + ri(8, 30) * 30; return [hm(a), hm(Math.min(b, 1439))]; });
  const nE = ri(1, 12);
  const emps = [...Array(nE)].map((_, i) => ({
    nome: 'E' + i, cargo: 'C', mulher: chance(0.5), menor: chance(0.1), insal: chance(0.1), parcial: chance(0.1),
    tipoRem: chance(0.3) ? 'hora' : 'mensal', sal: chance(0.1) ? '' : ri(800, 5000) / (chance(0.3) ? 100 : 1),
    hor: [0,1,2,3,4,5,6].map(horarioAleatorio),
  }));
  return {
    razao: 'X', cnpj: '1', cidade: 'C', uf: pick(['BA', 'SE', '']), ferLocais: chance(0.5) ? `${ri(1, 28)}/${ri(1, 12)}, ${ri(1, 28)}/${ri(1, 12)}` : '',
    setor: pick(['comercio', 'outros']), mes: pick(meses), semIni: String(ri(0, 6)), comp, redist: comp === 'coletiva' && chance(0.5),
    abreFeriado: chance(0.4), ferAut: chance(0.5), aberto, minimo: [0,1,2,3,4,5,6].map(() => ri(0, 4)), func, emps,
  };
}

/* ---------- Oráculo: confere as regras por conta própria ---------- */
function oraculo(s, span, e, w, sg){
  const v = new Set(), S = L.segMin, n = span.days.length;
  let run = 0; w.forEach(x => { run = x ? run + 1 : 0; if (run > 6) v.add('consecutivos'); });
  const cap = L.capDia(s, e) * 60;
  span.days.forEach((d, i) => {
    if (!w[i]) return;
    const t = S(sg[i]); if (t > cap + 1e-6) v.add('teto_diario');
    const gap = sg[i].slice(1).reduce((m, x, k) => Math.max(m, x[0] - sg[i][k][1]), 0);
    if (t > 360 && gap < (s.comp === 'coletiva' ? 30 : 60)) v.add('intervalo'); else if (t > 240 && gap < 15) v.add('intervalo');
    if (e.menor && d.inMonth && L.minNoturnos(sg[i]) > 0) v.add('menor_noturno');
    if (d.feriado && d.inMonth && s.setor === 'comercio' && !s.ferAut) v.add('feriado_comercio');
  });
  if (e.menor && e.insal) v.add('menor_insalubre');
  let last = null, dsr = 0;
  span.days.forEach((d, i) => {
    if (w[i]) { const st = i * 1440 + sg[i][0][0]; if (last !== null && st - last < 660 + 1440 * dsr) v.add(dsr ? 'dsr35' : 'interjornada'); last = i * 1440 + sg[i][sg[i].length - 1][1]; dsr = 0; }
    else if (!d.feriado) dsr++;
  });
  for (let k = 0; k < span.weeks; k++) {
    const r0 = L.regra(span.days[k * 7].date); let off = 0, min = 0;
    for (let j = 0; j < 7; j++) { const i = k * 7 + j; if (!w[i]) { if (!span.days[i].feriado) off++; } else min += S(sg[i]); }
    if (off < r0.dsr && !s.redist) v.add('repousos_semana');
    if (min / 60 > L.limiteSem(e, r0) + 1e-6 && s.comp === 'nenhuma') v.add('limite_semanal');
  }
  let fm = 0; span.days.forEach((d, i) => { if (d.inMonth && !w[i] && !d.feriado) fm++; });
  if (s.comp !== 'nenhuma') {
    let saldo = 0, acima = false;
    for (let k = 0; k < span.weeks; k++) {
      const dd = span.days.slice(k * 7, k * 7 + 7), r0 = L.regra(dd[0].date);
      const h = dd.reduce((a, d, j) => a + (w[k * 7 + j] ? S(sg[k * 7 + j]) : 0), 0) / 60;
      if (h > L.limiteSem(e, r0) + 1e-6) acima = true;
      if (dd.some(d => d.inMonth) && r0.L === span.rFim.L) saldo += h - L.limiteSem(e, span.rFim);
    }
    if (acima && saldo > 1e-6) v.add('media_mensal');
  }
  if (s.redist && !span.transicao && fm < (span.diasMes >= 29 ? 9 : 8)) v.add('minimo_mensal');
  if (s.aberto[6]) { let q = 0; span.days.forEach((d, i) => { if (d.wd === 6) { q = w[i] ? q + 1 : 0; if (q >= L.nDomingo(s, e)) v.add('domingos'); } }); }
  return v;
}
const MSG = { consecutivos: 'dias seguidos', teto_diario: 'acima do teto', intervalo: 'Intervalo menor', menor_noturno: 'entre 22h e 5h',
  feriado_comercio: 'depende de convenção', menor_insalubre: 'insalubre (art. 405', interjornada: 'Menos de 11h', dsr35: '24h + 11h',
  repousos_semana: 'Repousos abaixo', limite_semanal: 'Acima do limite semanal', media_mensal: 'não compensadas no mês', minimo_mensal: 'folgas no mês. Com',
  domingos: 'domingos seguidos' };

const falhas = {}, exemplos = {};
const falha = (tipo, info) => { falhas[tipo] = (falhas[tipo] || 0) + 1; if (!exemplos[tipo]) exemplos[tipo] = info; };
let opcoesTestadas = 0, cenOk = 0;

for (let t = 0; t < N; t++) {
  const s = cenario(), ctx = { teste: t, seed0: process.argv[3] || 12345 };
  try {
    const span = L.buildSpan(s);
    if (span.days.length % 7) falha('periodo_nao_multiplo_de_7', ctx);
    if (span.days[0].wd !== +s.semIni) falha('semana_comeca_errado', ctx);
    // escala atual: validador x oráculo
    const at = L.escalaAtual(s, span), av = L.avaliar(s, span, at.works, at.segs);
    s.emps.forEach((e, k) => {
      const ora = oraculo(s, span, e, at.works[k], at.segs[k]);
      const msgs = av.evals[k].issues.filter(x => x.t === 'err').map(x => x.m).join(' | ');
      for (const [tipo, frag] of Object.entries(MSG)) {
        const temMsg = msgs.includes(frag), temOra = ora.has(tipo);
        if (temOra && !temMsg) falha('validador_nao_detectou:' + tipo, { ...ctx, e: e.nome, hor: e.hor, msgs });
        if (!temOra && temMsg) falha('validador_falso_positivo:' + tipo, { ...ctx, e: e.nome, hor: e.hor, msgs });
      }
    });
    // opções geradas
    const ops = L.gerarOpcoes(s, span);
    if (!ops.length) falha('nenhuma_opcao', ctx);
    for (const o of ops) {
      opcoesTestadas++;
      s.emps.forEach((e, k) => {
        const w = o.works[k], sg = o.segs[k];
        span.days.forEach((d, i) => {
          if (w[i] && L.fechadoGer(s, d)) falha('gerou_trabalho_em_dia_fechado', { ...ctx, op: o.id });
          if (w[i] && !sg[i].length) falha('dia_trabalhado_sem_horario', { ...ctx, op: o.id });
          if (!w[i] && sg[i].length) falha('folga_com_horario', { ...ctx, op: o.id });
          if (w[i]) { const j = L.janela(s, d.wd); if (j && (sg[i][0][0] < j[0] || sg[i][sg[i].length - 1][1] > j[1])) falha('turno_fora_do_funcionamento', { ...ctx, op: o.id, wd: d.wd, sg: sg[i], j }); }
        });
        const ora = oraculo(s, span, e, w, sg);
        ora.delete('menor_insalubre'); // vem do cadastro, não da escala
        if (process.env.DBG && ora.has('intervalo')) span.days.forEach((d, i) => { if (!w[i]) return; const t = L.segMin(sg[i]), g = sg[i].slice(1).reduce((m, x, q) => Math.max(m, x[0] - sg[i][q][1]), 0);
          if ((t > 360 && g < 60) || (t > 240 && g < 15)) console.log('DBG', o.id, e.nome, 'wd', d.wd, 'dia', d.dia, JSON.stringify(sg[i]), 'tpl', JSON.stringify(o.tpl[k][d.wd]), 'prox', JSON.stringify(sg[i + 1] || null)); });
        for (const tipo of ora) falha('gerador_violou:' + tipo + ':' + o.id, { ...ctx, e: e.nome, menor: e.menor, parcial: e.parcial, comp: s.comp, func: s.func, aberto: s.aberto });
        // validador coerente com oráculo nas opções também
        const msgs = o.evals[k].issues.filter(x => x.t === 'err').map(x => x.m).join(' | ');
        for (const [tipo, frag] of Object.entries(MSG)) if (tipo !== 'menor_insalubre' && msgs.includes(frag) !== ora.has(tipo)) falha('validador_divergente_opcao:' + tipo, { ...ctx, op: o.id, msgs });
        // carga: nunca acima da meta; abaixo da meta só com aviso
        const alvo = Math.min(s.comp === 'coletiva' || s.comp === 'risco' ? 42 : 40, span.rFim.L), at = L.cargaAtual(e);
        const T = (at > 0 ? Math.min(at, L.limiteSem(e, span.rFim), alvo) : Math.min(L.limiteSem(e, span.rFim), alvo)) * 60;
        const temAviso = o.evals[k].issues.some(x => x.m.startsWith('Não fecha'));
        for (let wk = 0; wk < span.weeks; wk++) {
          const dd = span.days.slice(wk * 7, wk * 7 + 7); let n = 0, m = 0;
          dd.forEach((d, q) => { const i = wk * 7 + q; if (w[i]) { n++; m += L.segMin(sg[i]); } });
          if (!n) continue;
          let meta = n * T / 5; if (s.comp === 'nenhuma') meta = Math.min(meta, L.limiteSem(e, span.rFim) * 60);
          if (m > meta + 2) falha('carga_acima_da_meta:' + o.id, { ...ctx, wk, m, meta });
          if (L.regra(dd[0].date).L === span.rFim.L && !dd.some(d => d.feriado) && m < meta - 2 && !temAviso) falha('carga_abaixo_sem_aviso:' + o.id, { ...ctx, wk, m, meta });
        }
        // férias: oráculo
        const fer = new Set(L.diasFerias(s, span, w).map(d => d.date.getTime()));
        const livre = j => j < span.days.length ? (!w[j] || !!span.days[j].feriado) : (() => { const dt = new Date(span.days[span.days.length - 1].date); dt.setDate(dt.getDate() + (j - span.days.length + 1)); return !w[j - 7] || !!L.ehFeriado(s, dt); })();
        span.days.forEach((d, i) => {
          const pode = d.inMonth && w[i] && !d.feriado && !livre(i + 1) && !livre(i + 2);
          if (pode !== fer.has(d.date.getTime())) falha('ferias_divergente', { ...ctx, op: o.id, dia: d.dia, pode });
        });
        // remuneração
        const r = L.remuneracao(s, span, e);
        if (r && r.tipo === 'mensal' && Math.abs(r.sal - +e.sal) > 1e-9) falha('salario_mensal_alterado', ctx);
        if (r && r.tipo === 'hora' && r.horaMin * r.nv + 1e-6 < r.horaAtual * r.at) falha('horista_perde_remuneracao', { ...ctx, r });
        if (r && [r.horaNv, r.horaMin, r.mensal].some(x => x !== undefined && !isFinite(x))) falha('remuneracao_infinita', { ...ctx, e });
        // textos
        const desc = L.descreverHorario(o.tpl[k], L.diasTrabalhados(span, w));
        if (/undefined|NaN/.test(desc)) falha('descricao_horario_invalida', { ...ctx, desc });
      });
      // cobertura
      span.days.forEach((d, i) => {
        const c = o.works.reduce((a, w) => a + (w[i] ? 1 : 0), 0);
        if (c !== o.cov[i]) falha('cobertura_errada', ctx);
        if (o.sim[i] !== null && o.sim[i] > c) falha('simultaneo_maior_que_total', ctx);
      });
    }
    // importação: ida e volta
    const rows = [['Nome', 'Cargo', 'Mulher', 'Menor', 'Insalubre', 'Parcial', 'Remuneração', 'Salário', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
      ...s.emps.map(e => [e.nome, e.cargo, e.mulher ? 'S' : 'N', e.menor ? 'S' : '', e.insal ? 'sim' : 'n', e.parcial ? 'X' : '', e.tipoRem === 'hora' ? 'Horista' : 'Mensalista', e.sal === '' ? '' : String(e.sal).replace('.', ','), ...e.hor])];
    const imp = L.importarColaboradores(rows);
    if (imp.erro) falha('importacao_erro', { ...ctx, erro: imp.erro });
    else s.emps.forEach((e, k) => {
      const x = imp.emps[k];
      if (!x || x.nome !== e.nome || x.mulher !== e.mulher || x.menor !== e.menor || x.insal !== e.insal || x.parcial !== e.parcial || x.tipoRem !== e.tipoRem
        || (e.sal === '' ? x.sal !== '' : Math.abs(x.sal - e.sal) > 1e-9) || x.hor.join('|') !== e.hor.join('|')) falha('importacao_divergente', { ...ctx, e, x });
    });
    cenOk++;
  } catch (err) { falha('EXCECAO: ' + err.message, { ...ctx, stack: err.stack.split('\n').slice(0, 4).join(' / ') }); }
}
console.log(`Cenários: ${N} · sem exceção: ${cenOk} · opções geradas e verificadas: ${opcoesTestadas}`);
const tipos = Object.keys(falhas).sort((a, b) => falhas[b] - falhas[a]);
if (!tipos.length) console.log('Nenhuma falha encontrada.');
for (const t of tipos) console.log(`${String(falhas[t]).padStart(5)} × ${t}\n        ex.: ${JSON.stringify(exemplos[t]).slice(0, 420)}`);
