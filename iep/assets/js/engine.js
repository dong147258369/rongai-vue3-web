/* ============================================================
   engine.js · 融合引擎
   ① 跨源能力域对齐 → ② 需求优先级排序 → ③ 六维画像
      → ④ 支持策略与评量 → ⑤ 依据溯源 → ⑥ 缺口检测
   ⑥ 另含：干预前后对比数据、目标达成统计
   ============================================================ */
(function (R) {
  'use strict';

  var E = {};

  /* ---------- ① 跨源能力域对齐 ---------- */
  E.mapping = function () { return R.MAPPING; };

  /* ---------- ② 优先级评分 ---------- */
  E.factorDetail = function (g) {
    var st = R.store.get();
    var out = [];
    R.FACTORS.forEach(function (f) {
      var raw = (g.factors && g.factors[f.key]) || 0;
      if (raw === 0) return;
      var on = st.enabled[f.key] !== false;
      var w = st.weights[f.key];
      if (typeof w !== 'number') w = 1;
      out.push({
        key: f.key, name: f.name, desc: f.desc,
        raw: raw, weight: w, enabled: on,
        value: on ? raw * w : 0,
        sign: raw >= 0 ? 1 : -1
      });
    });
    return out;
  };

  E.score = function (g) {
    var total = 0;
    E.factorDetail(g).forEach(function (d) { total += d.value; });
    return Math.round(total * 10) / 10;
  };

  /* 排序 = 因子分 + 维度缺口：缺口越大（离学期目标越远）越该先做 */
  E.rankedGoals = function () {
    var st = R.store.get();
    return st.goals.map(function (g) {
      var s = E.score(g), gap = E.goalGap(g);
      return { g: g, score: s, gap: gap, total: Math.round((s + gap * 0.35) * 10) / 10 };
    }).sort(function (a, b) {
      var ad = a.g.status === 'dropped' ? 1 : 0, bd = b.g.status === 'dropped' ? 1 : 0;
      if (ad !== bd) return ad - bd;
      return b.total - a.total;
    });
  };

  /* ============================================================
     ③-0 由数据推算六维
     每个分数都必须能追到"哪份材料的哪个数据项、怎么换算的、占多少权重"；
     没有数据的指标不参与（权重按比例摊给其他项），绝不凭空给分。
     ============================================================ */
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function numOf(s) { var m = String(s == null ? '' : s).match(/-?\d+(?:\.\d+)?/); return m ? +m[0] : null; }
  function srcName(k) {
    if (k === 'obs') return '观察表';
    if (k === 'pep3') return 'PEP-3 评估报告';
    if (k === 'vbmapp') return 'VB-MAPP 评估报告';
    if (k === 'sensory') return '感觉统合评估';
    if (k === 'medical') return '医学诊断';
    var T = (R.REPORT_TYPES || []).filter(function (x) { return x.key === k; })[0];
    return T ? T.name : k;
  }

  /* PEP-3：发展年龄 ÷ 生理年龄。1.0 = 与年龄相当 → 75 分 */
  function pepRatio(f, key, chrono) {
    var raw = f[key];
    if (!raw || !chrono) return null;
    var ge = /≥|大于/.test(raw);
    var n = numOf(raw);
    if (!n) return null;
    var ratio = n / chrono;
    if (ge) ratio = Math.max(ratio, 1.05);
    return { v: Math.round(clamp(75 + (ratio - 1) * 110, 20, 100)), raw: raw + ' 个月 / 生理 ' + chrono + ' 个月' };
  }

  /* VB-MAPP 阶段：土豆生理年龄 43 个月落在第 3 阶段，达第 3 阶段 ≈ 与年龄相当 */
  var STAGE_SCORE = { '第 1 阶段（0–18 月）': 33, '第 2 阶段（18–30 月）': 58, '第 3 阶段（30–48 月）': 82 };
  function stageVal(v) {
    if (!v) return null;
    var s = STAGE_SCORE[v];
    return s ? { v: s, raw: v } : null;
  }

  /* 感统等级 */
  var LVS_SCORE2 = { '正常': 92, '一般问题': 58, '严重问题': 26 };
  function lvVal(v) {
    if (!v) return null;
    var s = LVS_SCORE2[v];
    return s ? { v: s, raw: v } : null;
  }

  /* 观察表：按"需求条数 / 优势条数"换算，条数是数出来的，可复核
     form 指明这条数据项来自哪张表（小组班 / 融合班 / 家长）；不写就三张都找。 */
  function obsVal(k, form) {
    var st = R.store.get();
    var ob = st.observation || {};
    var forms = form ? [].concat(form) : ['group', 'fusion', 'parent'];
    var hits = [];
    forms.forEach(function (f) {
      if (ob[f] && ob[f][k]) hits.push({ f: f, o: ob[f][k] });
    });
    if (!hits.length) return null;
    var need = 0, str = 0, tx = [];
    hits.forEach(function (h) {
      var nArr = String(h.o.need || '').split(/[；;。\n]/).filter(function (x) { return x.trim().length > 2; });
      var sArr = String(h.o.strength || '').split(/[；;。\n]/).filter(function (x) { return x.trim().length > 2; });
      need += nArr.length; str += sArr.length;
      tx.push((R.OBS_TYPES[h.f] ? R.OBS_TYPES[h.f].short : h.f) + ' 需求 ' + nArr.length + ' 条 / 优势 ' + sArr.length + ' 条');
    });
    var v = clamp(88 - need * 13 + Math.min(12, str * 3), 30, 96);
    return { v: Math.round(v), raw: tx.join('；') };
  }

  /* 医学：量表与病历 */
  function medVal(k, pick) {
    var st = R.store.get();
    var rep = (st.reports || {}).medical;
    var f = (rep && rep.fields) || {};
    var raw = f[k];
    if (!raw) return null;
    if (k === '言语语言评估') {
      var lv = /重度/.test(raw) ? 20 : /中度/.test(raw) ? 45 : /轻度/.test(raw) ? 70 : null;
      return lv ? { v: lv, raw: raw.slice(0, 40) } : null;
    }
    if (k === 'ABC 分项目' && pick) {
      /* ABC 分量表满分按项数 ×3：感觉27 / 交往36 / 运动36 / 语言39 / 自理33 */
      var FULL = { '感觉能力': 27, '交往能力': 36, '运动能力': 36, '语言能力': 39, '自我照顾能力': 33 };
      var m = raw.match(new RegExp(pick + '\\s*(\\d+(?:\\.\\d+)?)'));
      if (!m || !FULL[pick]) return null;
      var ratio = (+m[1]) / FULL[pick];
      return { v: clamp(Math.round(100 - ratio * 100), 10, 100), raw: pick + ' ' + m[1] + ' / ' + FULL[pick] };
    }
    if (k === '第三类转衔') {
      return { v: /良好/.test(raw) ? 85 : 60, raw: raw.slice(0, 30) };
    }
    return null;
  }

  /* VB-MAPP 障碍 / PEP-3 病理：项数越多分越低 */
  function countVal(raw, perSevere, perMild) {
    if (!raw) return null;
    var n = String(raw).split(/[、，,]/).filter(function (x) { return x.trim(); }).length;
    if (!n) return null;
    return { v: Math.round(clamp(100 - n * (perSevere || 0), 15, 100)), raw: n + ' 项（' + raw.slice(0, 26) + (raw.length > 26 ? '…' : '') + '）' };
  }
  function numVal(raw, perUnit) {
    var n = numOf(raw);
    if (n === null) return null;
    return { v: Math.round(clamp(100 - n * perUnit, 15, 100)), raw: raw + ' 项' };
  }

  /* 单个指标取值：返回 { v, raw } 或 null */
  E.indicator = function (it) {
    var st = R.store.get();
    var reps = st.reports || {};
    var f = (reps[it.src] && reps[it.src].fields) || {};
    var r = null;
    if (it.src === 'pep3') {
      if (/病理行为/.test(it.k)) {
        /* 病理行为看的是"项数"，不是发展年龄 */
        r = numVal(f[it.k], /重度/.test(it.k) ? 12 : 4);
        if (r) r.raw = f[it.k] + ' 项（共 ' + (numOf(f['病理行为正常项数']) || '—') + ' 项正常）';
      } else {
        var chrono = numOf(f['生理年龄（月）']) || numOf(R.CASE && R.CASE.ageMonths) || null;
        r = pepRatio(f, it.k, chrono);
      }
    } else if (it.src === 'vbmapp') {
      if (/障碍/.test(it.k)) r = countVal(f[it.k], it.k.indexOf('中重度') >= 0 ? 20 : 8);
      else r = stageVal(f[it.k]);
    } else if (it.src === 'sensory') {
      r = lvVal(f[it.k]);
    } else if (it.src === 'medical') {
      r = medVal(it.k, it.pick);
    } else if (it.src === 'obs') {
      r = obsVal(it.k, it.form);
    }
    if (!r) return null;
    var sn = srcName(it.src) || '观察表';
    if (it.src === 'obs' && it.form) {
      sn = [].concat(it.form).map(function (f) {
        return (R.OBS_TYPES[f] ? R.OBS_TYPES[f].short : f);
      }).join('+') + '观察表';
    }
    return { v: r.v, raw: r.raw, src: it.src, srcName: sn, k: it.k, w: it.w, how: it.how };
  };

  /* 六个维度的推算结果 */
  E.compute = function () {
    var st = R.store.get();
    return (R.INDICATORS || []).map(function (dim) {
      var used = [], miss = [], sum = 0, wsum = 0;
      dim.items.forEach(function (it) {
        var r = E.indicator(it);
        if (r) { used.push(r); sum += r.v * it.w; wsum += it.w; }
        else miss.push({ k: it.k, src: it.src, srcName: srcName(it.src) || '观察表' });
      });
      var score = wsum ? Math.round(sum / wsum) : null;
      var lv = score === null ? '数据不足'
        : score >= 82 ? '相对优势' : score >= 68 ? '一般' : score >= 55 ? '落后' : '显著落后';
      return {
        code: dim.code, name: dim.name, score: score, level: lv, badge: E.levelBadge(lv),
        basis: used, missing: miss, weightUsed: Math.round(wsum * 100) / 100
      };
    });
  };

  E.computeByCode = function (code) {
    var all = E.compute();
    for (var i = 0; i < all.length; i++) if (all[i].code === code) return all[i];
    return null;
  };

  /* 画像：优先用推算值；教师手定过时以手定为准，但保留推算值供对照 */
  E.profileComputed = function () {
    var st = R.store.get();
    var calc = {};
    E.compute().forEach(function (c) { calc[c.code] = c; });
    return R.DOMAIN_PROFILE.map(function (d) {
      var c = calc[d.code] || {};
      var manual = (typeof d.score === 'number' && d.score) ? d.score : null;
      return {
        code: d.code, name: R.domainName(d.code), short: R.domainShort(d.code),
        cls: R.domainCls(d.code),
        /* 有推算数据就用推算值（可追溯），没有数据时才退回教师初判 */
        score: (c.score !== null && c.score !== undefined) ? c.score : manual,
        computed: c.score, manual: manual,
        adjusted: manual !== null && c.score !== null && Math.abs(manual - c.score) >= 3,
        level: (c.score !== null && c.score !== undefined) ? c.level : d.level,
        badge: (c.score !== null && c.score !== undefined) ? c.badge : E.levelBadge(d.level),
        baseline: d.baseline, target: d.target,
        summary: d.summary, strengths: d.strengths, needs: d.needs, evid: d.evid,
        basis: c.basis || [], missing: c.missing || [], weightUsed: c.weightUsed || 0,
        hasData: !!(c.basis && c.basis.length)
      };
    });
  };

  /* 目标排序加入"维度缺口"：缺口越大越该先做，依据可展开
     学期目标没设时，按当前水平给一个可解释的临时值（E.targetOf） */
  E.goalGap = function (g) {
    var p = E.profileComputed().filter(function (d) { return d.code === g.domain; })[0];
    if (!p || p.score === null || p.score === undefined) return 0;
    var t = E.targetOf ? E.targetOf(p) : null;
    if (!t) return 0;
    return Math.max(0, Math.round((t.v - p.score) * 10) / 10);
  };

  E.goalBasis = function (g) {
    var p = E.profileComputed().filter(function (d) { return d.code === g.domain; })[0];
    if (!p) return [];
    return p.basis.slice(0, 6);
  };


  /* ---------- ③ 六维能力画像 ---------- */
  var LEVEL_STYLE = {
    '显著落后': 'r', '落后': 'a', '一般': 'b', '相对优势': 'g', '数据不足': 'gray'
  };
  E.levelBadge = function (lv) { return LEVEL_STYLE[lv] || 'gray'; };

  /* 来源分组：跨源一致性按"来源材料"计数 */
  var SIDE = {
    m1: '医学诊断', m2: '医学诊断',
    p1: 'PEP-3', p2: 'PEP-3', p3: 'PEP-3', p4: 'PEP-3', p5: 'PEP-3', p6: 'PEP-3', p7: 'PEP-3', p8: 'PEP-3',
    v1: 'VB-MAPP', v2: 'VB-MAPP', v3: 'VB-MAPP', v4: 'VB-MAPP', v5: 'VB-MAPP',
    v6: 'VB-MAPP 障碍评估', v7: 'VB-MAPP 障碍评估', v8: 'VB-MAPP 转衔评估',
    t1: '小组观察表', t2: '小组观察表', t3: '小组观察表', t4: '小组观察表', t5: '小组观察表',
    t6: '小组观察表', t7: '小组观察表', t8: '小组观察表', t9: '小组观察表', t10: '小组观察表',
    t11: '小组观察表', t12: '小组观察表', t13: '小组观察表',
    f1: '融合观察表', f2: '融合观察表', f3: '融合观察表', f4: '融合观察表', f5: '融合观察表',
    q1: '家长观察表', q2: '家长观察表', q3: '家长观察表', q4: '家长观察表', q5: '家长观察表',
    q6: '家长观察表', q7: '家长观察表', q8: '家长观察表', q9: '家长观察表'
  };
  E.sideOf = function (id) { return SIDE[id] || '其他来源'; };

  E.profile = function () {
    var st = R.store.get();
    var calced = E.profileComputed();
    return R.DOMAIN_PROFILE.map(function (d, di) {
      var cc = calced[di] || {};
      var seen = {};
      d.evid.forEach(function (id) {
        var ev = R.EVIDENCE[id];
        if (!ev) return;
        if (ev.src === 'teacher' && !st.obsFilled.teacher) return;
        if (ev.src === 'parent' && !st.obsFilled.parent) return;
        seen[E.sideOf(id)] = 1;
      });
      var srcCount = Object.keys(seen).length;
      var g = E.domainGoal(d.code);
      return {
        code: d.code, name: R.domainName(d.code), short: R.domainShort(d.code),
        cls: R.domainCls(d.code),
        level: cc.level || d.level, badge: cc.badge || E.levelBadge(d.level),
        score: cc.score, computed: cc.computed, manual: cc.manual, adjusted: cc.adjusted,
        baseline: d.baseline, target: d.target,
        sources: srcCount, summary: d.summary,
        /* 档案没录文字时，用观察表 / 量表依据自动补（占位条目不进这里，保证画像页不出现提示语） */
        strengths: E.cellTexts(d.code, 'strength'), needs: E.cellTexts(d.code, 'need'),
        evid: d.evid,
        basis: cc.basis || [], missing: cc.missing || [], hasData: !!cc.hasData,
        weightUsed: cc.weightUsed || 0,
        goalId: g ? g.id : '',
        shorts: g ? (g.shorts || []) : [],
        long: g ? { fusion: g.fusion, group: g.group, integrated: g.integrated } : null
      };
    });
  };

  /* ---------- ②c 能力分析条目合成（成稿第二章「幼儿能力分析」用） ----------
     数据链：档案录入 > 三张观察表 > 量表推算依据 > 缺口提示
     修的是"上传了报告、画像有分，成稿能力表却空白"的断链：
     上传/填报的数据原先只进 reports / observation，从不写 domainProfile 的文本栏。 */

  /* 条目压缩函数统一定义在 data.js（js 加载顺序：data → store → engine）：
     R.shortItem 把一段观察原文压成"一句话的一条"，store 的迁移与成稿渲染都用它。 */
  E.shortItem = R.shortItem;

  /* 观察表维度名 → 六维 code（一个观察维度可同时喂给多个能力维度） */
  var OBS_DIM2CODE = {
    '大运动/精细动作': ['YD'], '语言沟通能力': ['YY'], '社会交往能力': ['SJ'],
    '生活自理能力': ['ZL'], '认知学习能力': ['RZ'], '情绪行为表现': ['QX'],
    '关注跟随能力': ['RZ', 'QX'],
    '健康': ['ZL', 'YD'], '语言': ['YY'], '社交': ['SJ'], '科学': ['RZ'], '艺术': ['RZ', 'YD'],
    '情绪': ['QX'], '生活自理': ['ZL'], '认知': ['RZ'], '进餐习惯': ['ZL'],
    '喜好及厌恶': ['QX'], '安全意识': ['RZ'], '对视回应': ['SJ', 'YY'], '家长需求': []
  };
  E.obsDimCodes = function (dim) { return OBS_DIM2CODE[dim] || []; };

  /* ---------- 跨维度观察行的子句路由 ----------
     「健康 / 艺术 / 关注跟随 / 对视回应」这类一行喂多个能力维度的观察，
     原文常混领域（健康行既有"跑跳爬"又有"入园午睡前易情绪波动"），
     整行塞进大运动就会出现情绪内容。这里按分号/句号拆子句，
     每句按关键词归入对应维度：认得出领域的句子只进匹配维度；
     认不出的句子留在该观察行的原有维度，不丢数据。 */
  var CLAUSE_RE = {
    YD: /大运动|运动|跑|跳|爬|投|掷|踢|球|肌肉|肢体|单脚|双脚|站立|平衡|协调|涂色|涂|剪|画|捏|握笔|抓握|拼图|串珠|手指|手部|双手|动作/,
    YY: /语言|表达|发音|仿说|称呼|代词|句子|讲述|复述|指令|对话|回答|举手|发音清晰/,
    SJ: /同伴|社交|交往|分享|轮流|合作|对视|打招呼|邀请|冲突|争抢|互动/,
    ZL: /如厕|穿|脱|进餐|进食|吃饭|用餐|吞咽|咀嚼|漱口|餐具|收拾|清洁|整理|叠|扣子|鞋袜|自理/,
    RZ: /认知|数|量|配对|分类|注意力|记忆|探究|提问|点数|取物|认读|书写|概念|逻辑/,
    QX: /情绪|哭|急躁|平复|脾气|安抚|耐受|挫折|逃避|动机|兴奋|焦虑|自伤|攻击|波动/
  };
  function routeClauses(text, dim, code) {
    var t = String(text || '').trim();
    if (!t) return '';
    if ((OBS_DIM2CODE[dim] || []).length <= 1) return t; /* 单领域观察行不拆 */
    var kept = [];
    t.split(/[；;。]/).forEach(function (seg) {
      var s = seg.trim();
      if (!s) return;
      var hit = [];
      for (var k in CLAUSE_RE) if (CLAUSE_RE[k].test(s)) hit.push(k);
      if (!hit.length || hit.indexOf(code) >= 0) kept.push(s);
    });
    return kept.join('；');
  }

  /* 三张观察表中属于该维度的原文 */
  E.obsTexts = function (code) {
    var st = R.store.get();
    var out = [];
    (R.OBS_ORDER || []).forEach(function (who) {
      var T = R.OBS_TYPES[who];
      if (!T) return;
      var saved = (st.observation || {})[who] || {};
      T.dims.forEach(function (d) {
        if ((OBS_DIM2CODE[d.dim] || []).indexOf(code) < 0) return;
        var v = saved[d.dim] || {};
        var s = routeClauses(v.strength, d.dim, code);
        var n = routeClauses(v.need, d.dim, code);
        if (!s && !n) return;
        out.push({ who: T.short, dim: d.dim, strength: s, need: n });
      });
    });
    return out;
  };

  /* 某维度某一栏的条目（每条带来源，成稿可标注；auto=系统合成，empty=缺口占位） */
  E.abilityCells = function (code, side) {
    var d = (R.DOMAIN_PROFILE || []).filter(function (x) { return x.code === code; })[0] || {};
    var manual = ((side === 'strength' ? d.strengths : d.needs) || [])
      .filter(function (t) { return t && String(t).trim(); });
    if (manual.length) {
      /* 一格最多 4 条；只把"长段"压成一句话，短句原样保留（不擅自改教师措辞） */
      return manual.slice(0, 4).map(function (t) {
        var s = String(t).trim();
        return { t: s.length > 26 ? E.shortItem(s) : s, src: '档案录入', auto: false };
      });
    }
    var out = [];
    /* ① 观察表原文最贴近日常，优先（长句压成一句话，一格最多 3 条） */
    E.obsTexts(code).forEach(function (o) {
      var t = side === 'strength' ? o.strength : o.need;
      if (t) out.push({ t: E.shortItem(t), src: o.who + '观察表 · ' + o.dim, auto: true });
    });
    var c = E.computeByCode(code);
    var basis = (c && c.basis) || [];
    var sorted = basis.slice().sort(function (a, b) { return b.v - a.v; });

    /* ② 量表依据：观察表不足 2 条时补在后面（分高进优势、分低进需求），合计最多 3 条。
       跨维度观察指标（健康/艺术/关注跟随/对视回应）的摘要可能含其它领域内容，
       命不中本维度关键词就不进本格，避免情绪内容混进大运动。 */
    var CROSS_OBS = { '健康': 1, '艺术': 1, '关注跟随': 1, '关注跟随能力': 1, '对视回应': 1 };
    if (out.length < 2) {
      basis.forEach(function (b) {
        if (out.length >= 3) return;
        if ((side === 'strength') !== (b.v >= 68)) return;
        if (b.src === 'obs' && CROSS_OBS[b.k] && !CLAUSE_RE[code].test(b.raw)) return;
        out.push({ t: E.shortItem(b.k + '：' + b.raw), src: b.srcName, auto: true });
      });
    }
    if (out.length) return out.slice(0, 3);

    /* ③ 该侧一条都没有（指标全偏向另一侧）：补"维度内相对…"的一条，保证两栏不空 */
    if (basis.length) {
      var pick = side === 'strength' ? sorted[0] : sorted[sorted.length - 1];
      if (pick) {
        return [{
          t: E.shortItem(pick.k + '：' + pick.raw), src: pick.srcName, auto: true
        }];
      }
    }

    /* ④ 无数据：写清缺口，不留空白格；两栏文案区分 */
    var miss = (c && c.missing) || [];
    var lack = miss.length
      ? '本维度尚缺 ' + miss.slice(0, 2).map(function (m) { return m.srcName + '·' + m.k; }).join('、') + ' 等材料'
      : '暂无可引用的观察或量表条目';
    var tip = (side === 'strength' ? '暂无优势条目：' : '暂无法判定薄弱点：') + lack + '。';
    return [{ t: tip + '回收观察表或补传评估报告后，此处会自动填入。', src: '待补充', auto: true, empty: true }];
  };

  /* 成稿「家庭养育情况」行：家长观察表里与家庭相关的条目 */
  E.familyCells = function (side) {
    var f = R.FAMILY_PROFILE || {};
    var manual = String(side === 'strength' ? (f.strengths || '') : (f.needs || '')).trim();
    if (manual) {
      /* 家庭栏也按"一句一条"给：段落多则拆行，长句压短，最多 4 条 */
      var lines = manual.split(/\r?\n+/).map(function (x) {
        var s = String(x).trim();
        return s.length > 26 ? E.shortItem(s, 22) : s;
      }).filter(function (x) { return x; }).slice(0, 4);
      if (lines.length) return [{ t: lines.join('\n'), src: '档案录入', auto: false }];
    }
    var saved = (R.store.get().observation || {}).parent || {};
    var out = [];
    ['生活自理', '进餐习惯', '喜好及厌恶', '安全意识', '情绪'].forEach(function (dim) {
      var t = side === 'strength' ? (saved[dim] || {}).strength : (saved[dim] || {}).need;
      if (String(t || '').trim()) out.push({ t: E.shortItem(t, 22), src: '家长观察表 · ' + dim, auto: true });
    });
    if (side !== 'strength' && String((saved['家长需求'] || {}).need || '').trim()) {
      out.push({ t: E.shortItem((saved['家长需求'].need || ''), 22), src: '家长观察表 · 家长需求', auto: true });
    }
    if (out.length) return out.slice(0, 4);
    return [{
      t: side === 'strength' ? '家长观察表尚未回收，家庭优势待补。' : '家长观察表尚未回收，家庭需求待补。',
      src: '待补充', auto: true, empty: true
    }];
  };

  /* ---------- 成稿"显示行"（给 AI 字段清单用） ----------
     与 doc.js 表格同一套口径：分段 → 长句压短 → 去重 → 一格最多 4 条。
     AI 字段清单里的"当前内容"必须和成稿显示的一字不差：
     模型才能对照成稿理解建议，解析卡片的"现在"也才和成稿对得上。 */
  E.docCellLines = function (cells) {
    var lines = [];
    (cells || []).forEach(function (c) {
      if (!c || !c.t) return;
      String(c.t).split(/\r?\n+/).forEach(function (raw) {
        var s = raw.replace(/^\s*(?:\d+[．.、]|[（(]\d+[）)])\s*/, '')
          .replace(/^[·•・\-\s]+/, '').trim();
        if (!s) return;
        var t = s.length > 26 ? E.shortItem(s) : s;
        if (t && lines.indexOf(t) < 0) lines.push(t);
      });
    });
    return lines.slice(0, 4);
  };
  E.docAbilityLines = function (code, side) { return E.docCellLines(E.abilityCells(code, side)); };
  E.docFamilyLines = function (side) { return E.docCellLines(E.familyCells(side)); };

  /* 只要文本，且过滤掉"待补充"占位（画像页 / 工作台用） */
  E.cellTexts = function (code, side) {
    return E.abilityCells(code, side)
      .filter(function (c) { return !c.empty; })
      .map(function (c) { return c.t; });
  };

  /* 整张能力表是否全是缺口（成稿据此给出补数指引） */
  E.abilityEmptyCount = function () {
    var n = 0;
    (R.DOMAIN_PROFILE || []).forEach(function (d) {
      var a = E.abilityCells(d.code, 'strength'), b = E.abilityCells(d.code, 'need');
      if ((a[0] && a[0].empty) && (b[0] && b[0].empty)) n++;
    });
    return n;
  };

  /* 每个维度取"最好的那条已采纳目标"，没有则取评分最高的一条 */
  E.domainGoal = function (code) {
    var st = R.store.get();
    var list = st.goals.filter(function (g) { return g.domain === code && g.status !== 'dropped'; });
    if (!list.length) return null;
    var adopted = list.filter(function (g) { return g.status === 'adopted'; });
    var pool = adopted.length ? adopted : list;
    return pool.sort(function (a, b) { return E.score(b) - E.score(a); })[0];
  };

  /* 六边形雷达数据：三条序列（基线 / 当前 / 学期目标） */
  E.radar = function () {
    var list = E.profile();
    return {
      axes: list.map(function (d) { return { label: d.short, name: d.name, code: d.code }; }),
      series: [
        { key: 'target', name: '学期目标', color: '#8b5cf6', values: list.map(function (d) { return d.target; }) },
        { key: 'now', name: '当前水平', color: '#2f6fd0', values: list.map(function (d) { return d.score; }) },
        { key: 'base', name: '干预前基线', color: '#94a3b8', values: list.map(function (d) { return d.baseline; }) }
      ]
    };
  };

  /* 干预前后对比（进度页用） */
  E.compare = function () {
    var list = E.profile();
    var rows = list.map(function (d) {
      return {
        code: d.code, name: d.name, short: d.short, level: d.level, badge: d.badge,
        before: d.baseline, now: d.score, target: d.target,
        delta: Math.round((d.score - d.baseline) * 10) / 10,
        gap: Math.round((d.target - d.score) * 10) / 10
      };
    });
    var avg = rows.reduce(function (a, r) { return a + r.delta; }, 0) / (rows.length || 1);
    var avgNow = rows.reduce(function (a, r) { return a + r.now; }, 0) / (rows.length || 1);
    return {
      rows: rows,
      avgDelta: Math.round(avg * 10) / 10,
      avgNow: Math.round(avgNow),
      best: rows.slice().sort(function (a, b) { return b.delta - a.delta; })[0],
      worst: rows.slice().sort(function (a, b) { return a.delta - b.delta; })[0]
    };
  };

  /* ---------- ④ 数据完整度（按档案材料状态算，新建案从 0% 开始） ---------- */
  var W_MEDICAL = 25, W_ASSESS = 35, W_TEACHER = 20, W_PARENT = 20;

  E.completeness = function () {
    var st = R.store.get();
    return R.store.completenessOf(R.CASE, st);
  };

  E.assessRatio = function () {
    var p = (R.CASE.materialStatus && R.CASE.materialStatus.assess && R.CASE.materialStatus.assess.parts) || {};
    var n = (p.pep3 ? 1 : 0) + (p.vbmapp ? 1 : 0) + (p.sensory ? 1 : 0);
    return n / 3;
  };

  /* 教师观察有两张表（小组班 / 融合班），各占一半 */
  function obsTeacherRatio() {
    var st = R.store.get();
    var of = st.obsFilled || {};
    return ((of.group ? 0.5 : 0) + (of.fusion ? 0.5 : 0));
  }
  E.obsTeacherRatio = obsTeacherRatio;

  E.completenessParts = function () {
    var st = R.store.get();
    var ms = R.CASE.materialStatus || {};
    var mState = (ms.medical && ms.medical.state) || 'none';
    var p = (ms.assess && ms.assess.parts) || {};
    var n = (p.pep3 ? 1 : 0) + (p.vbmapp ? 1 : 0) + (p.sensory ? 1 : 0);
    return [
      { k: '医学诊断', v: W_MEDICAL, got: mState === 'done' ? W_MEDICAL : mState === 'part' ? 12 : 0 },
      { k: '教育评估', v: W_ASSESS, got: Math.round(W_ASSESS * n / 3) },
      { k: '教师观察', v: W_TEACHER, got: Math.round(W_TEACHER * obsTeacherRatio()) },
      { k: '家长观察', v: W_PARENT, got: st.obsFilled.parent ? W_PARENT : 0 }
    ];
  };

  /* ---------- ⑤ 缺口检测 ---------- */
  E.gaps = function () {
    var st = R.store.get();
    var out = [];
    if (!E.completeness()) {
      out.push({ key: 'data', name: '尚无评估与观察数据',
        why: '新建档案只有档案头，能力指数、目标建议、成稿都还没有依据。',
        act: '先在档案页录入六维初判与关键结论，或到数据归集台上传医学诊断与评估报告' });
    }
    (function () {
      var of = st.obsFilled || {};
      var miss = [];
      if (!of.group) miss.push('小组班级教师日常观察表');
      if (!of.fusion) miss.push('融合班级教师日常观察表');
      if (!miss.length) return;
      out.push({
        key: 'teacher', name: '教师观察表还差 ' + miss.length + ' 张',
        why: '社交、情绪类目标依赖真实情境样本；小组班看集体中的行为，融合班看半融合情境下的表现，两张不能互相替代。' +
          '目前缺「' + miss.join('」「') + '」，相关目标只能给方向，给不出情境化写法。',
        act: '上传原件或在线填报，建议 1 周内完成'
      });
    })();
    if (!st.obsFilled.parent) {
      out.push({ key: 'parent', name: '家长观察未填',
        why: '家庭任务卡与"喜好及厌恶"信息缺失，影响强化物选择与家长协同',
        act: '推送家长端表单，教师可代录；家长需求单独作为一次沟通记录' });
    }
    (R.CASE.gaps || []).forEach(function (g) {
      if (g.key === 'sensory' && st.sensoryFixed) return;
      out.push(g);
    });
    return out;
  };

  E.confidence = function () {
    var c = E.completeness();
    if (c >= 85) return { lv: '高', badge: 'g', tip: '四类数据基本齐备，草案可直接用于 IEP 会议讨论。' };
    if (c >= 60) return { lv: '中', badge: 'a', tip: '部分数据缺失，相关条目标注"待观察确认"，建议会前补齐。' };
    if (c >= 20) return { lv: '低', badge: 'r', tip: '仅部分材料就绪，草案只能给方向，缺口已转为待办。' };
    return { lv: '低', badge: 'r', tip: '还没有任何材料，能力指数与目标建议都无从生成。' };
  };

  /* ---------- ⑥ 目标语句校验 ---------- */
  var OBSERVABLE = ['说', '指', '拿', '看', '模仿', '配对', '分类', '回答', '跟随', '轮流', '等待',
    '完成', '表达', '请求', '示意', '坐下', '洗手', '咀嚼', '尝试', '识别', '使用', '参与', '维持',
    '记录', '命名', '说出', '指向', '拿起', '看向', '停止', '开始', '站', '跳', '捏', '扣', '漱口', '点数'];
  var VAGUE = ['提高', '加强', '改善', '增强', '培养', '提升', '促进'];

  E.validateGoalText = function (text, criteria) {
    var res = { ok: true, level: 'ok', msg: '' };
    text = text || '';
    var full = text + ' ' + (criteria || '');
    var hasObservable = OBSERVABLE.some(function (v) { return text.indexOf(v) >= 0; });
    var hasVague = VAGUE.some(function (v) { return text.indexOf(v) >= 0; });
    var hasNumber = /\d/.test(full);
    var hasSituation = /在[^，。]{2,}|面对[^，。]{1,}|当[^，。]{1,}|被[^，。]{1,}后|每天|每[周月日次]/.test(text);
    if (hasVague && !hasObservable) {
      res.ok = false; res.level = 'bad';
      res.msg = '使用了"提高 / 加强 / 改善"等不可观察动词，且没有搭配具体行为，无法评量。';
      return res;
    }
    if (!hasSituation) {
      res.ok = false; res.level = 'warn';
      res.msg = '缺少情境（在〔什么情境〕），建议补上具体场景。';
      return res;
    }
    if (!hasNumber) {
      res.ok = false; res.level = 'warn';
      res.msg = '缺少通过标准（次数 / 正确率 / 时长），建议补上可测量标准。';
      return res;
    }
    res.msg = '情境 + 可观察行为 + 通过标准齐备。';
    return res;
  };

  /* ---------- ⑦ 高风险识别 ---------- */
  var RISK_WORDS = ['自伤', '撞头', '咬自己', '打自己', '抓伤自己', '伤人', '打别的小朋友', '咬人',
    '走失', '离家出走', '乱跑出园', '虐待', '殴打', '吞食异物', '窒息', '严重攻击'];
  E.detectRisk = function (text) {
    if (!text) return null;
    var hits = RISK_WORDS.filter(function (w) { return text.indexOf(w) >= 0; });
    return hits.length ? hits : null;
  };

  /* ---------- ⑧ 结构化输出 ---------- */
  E.exportJSON = function () {
    var st = R.store.get();
    var profile = E.profile().map(function (d) {
      return {
        dimension: d.name,
        level: d.level,
        index: d.score,
        baseline: d.baseline,
        target: d.target,
        strengths: d.strengths,
        needs: d.needs,
        evidence: d.evid.map(function (id) {
          var ev = R.EVIDENCE[id];
          return ev ? (ev.srcName + ' · ' + ev.item + ' ' + ev.value) : id;
        })
      };
    });
    var goals = E.rankedGoals().filter(function (r) { return r.g.status !== 'dropped'; })
      .map(function (r) {
        var g = r.g;
        return {
          id: g.id,
          dimension: R.domainName(g.domain),
          long_term: { fusion: g.fusion, group: g.group, integrated: g.integrated },
          short_term: (g.shorts || []).map(function (s) { return { text: s.t, criteria: s.c }; }),
          supports: { school: g.school, home: g.home },
          measure: g.measure, frequency: g.frequency, owner: g.owner,
          priority_score: r.score,
          basis: (g.basis || []).map(function (id) {
            var ev = R.EVIDENCE[id];
            return ev ? (ev.srcName + ' · ' + ev.item + ' ' + ev.value) : id;
          }),
          status: g.status === 'adopted' ? '已纳入' : '待确认'
        };
      });
    return {
      child_id: R.CASE.id,
      alias: R.CASE.alias,
      generated_at: new Date().toISOString().slice(0, 10),
      data_completeness: E.completeness(),
      confidence: E.confidence().lv,
      dimensions: R.DOMAINS.map(function (d) { return d.name; }),
      profile: profile,
      goals: goals,
      duty: R.DUTY.map(function (d) { return { role: d.name, scope: d.scope, freq: d.freq }; }),
      gaps: E.gaps().map(function (g) { return g.name; }),
      calibration: {
        meeting_id: st.meetings[st.meetings.length - 1].id,
        held_on: st.meetings[st.meetings.length - 1].date,
        applied: !!st.meetings[st.meetings.length - 1].applied,
        applied_by: st.meetings[st.meetings.length - 1].appliedBy || ''
      },
      doc: { version: st.doc.version, status: st.doc.status }
    };
  };

  /* ---------- ⑨ 统计 ---------- */
  E.goalStats = function () {
    var st = R.store.get();
    return {
      all: st.goals.length,
      adopted: st.goals.filter(function (g) { return g.status === 'adopted'; }).length,
      pending: st.goals.filter(function (g) { return g.status === 'pending'; }).length,
      deferred: st.goals.filter(function (g) { return g.status === 'deferred'; }).length,
      dropped: st.goals.filter(function (g) { return g.status === 'dropped'; }).length
    };
  };

  E.adoptedGoals = function () {
    return E.rankedGoals().filter(function (r) { return r.g.status === 'adopted'; });
  };

  /* 按维度排序的目标（成稿用）；fn 决定收哪些 */
  E.byDomain = function (fn) {
    var map = {};
    E.rankedGoals().filter(fn || function () { return true; }).forEach(function (r) {
      if (!map[r.g.domain]) map[r.g.domain] = [];
      map[r.g.domain].push(r);
    });
    return R.DOMAINS.map(function (d) {
      return { domain: d, goals: map[d.code] || [] };
    }).filter(function (x) { return x.goals.length; });
  };

  E.adoptedByDomain = function () {
    return E.byDomain(function (r) { return r.g.status === 'adopted'; });
  };

  /* 成稿用：优先已采纳；一条都没采纳时，用全部未忽略的目标出草案（并标明"待审议"） */
  E.docByDomain = function () {
    var g = E.adoptedByDomain();
    if (g.length) return { groups: g, draft: false };
    return { groups: E.byDomain(function (r) { return r.g.status !== 'dropped'; }), draft: true };
  };

  E.LEVEL_STYLE = LEVEL_STYLE;
  R.engine = E;

})(window.RIEP);
