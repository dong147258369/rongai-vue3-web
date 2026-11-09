/* ============================================================
   views/profile.js · 跨源能力画像（跨源对齐 + 六维雷达图）
   ============================================================ */
(function (R) {
  'use strict';
  var U = R.ui;

  /* ---------- 分数是怎么算出来的（每一条都能追到具体数据） ---------- */
  function basisTable(d, compact) {
    if (!d.basis || !d.basis.length) {
      return '<div class="small muted">这个维度还没有能算出分数的数据：' +
        (d.missing && d.missing.length
          ? '缺 ' + d.missing.map(function (m) { return U.esc(m.srcName + '·' + m.k); }).join('、')
          : '未上传相关材料') + '。</div>';
    }
    var rows = d.basis.map(function (b) {
      if (compact) {
        /* 抽屉窄：来源 + 数据项 + 得分（原始值与权重悬停可看） */
        return '<tr><td class="nw">' + U.esc(b.srcName.replace('评估报告', '').replace('评估', '')) + '</td>' +
          '<td><div style="font-size:12.5px">' + U.esc(b.k) + '</div>' +
          '<div class="small muted" style="max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' +
          U.esc(b.raw + ' · 权重 ' + Math.round(b.w * 100) + '%') + '">' + U.esc(b.raw) + '</div></td>' +
          '<td class="nw"><b>' + b.v + '</b><div class="small muted">' + Math.round(b.w * 100) + '%</div></td></tr>';
      }
      return '<tr><td>' + U.esc(b.srcName) + '</td><td>' + U.esc(b.k) + '</td>' +
        '<td class="small muted">' + U.esc(b.raw) + '</td>' +
        '<td class="small muted">' + U.esc(b.how) + '</td>' +
        '<td class="nw">' + Math.round(b.w * 100) + '%</td>' +
        '<td class="nw"><b>' + b.v + '</b></td></tr>';
    }).join('');
    var miss = (d.missing || []).length
      ? '<div class="small muted mt8">未参与计算（无数据，权重已按比例摊给其余项）：' +
        d.missing.map(function (m) { return U.esc(m.srcName + '·' + m.k); }).join('、') + '</div>'
      : '';
    return '<div class="table-scroll"><table class="table compact"><thead><tr>' +
      (compact
        ? '<th>来源</th><th>数据项 / 原始值</th><th>得分</th>'
        : '<th>来源</th><th>数据项</th><th>原始值</th><th>换算方式</th><th>权重</th><th>得分</th>') +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="small muted mt8">加权得分 = Σ(指标得分 × 权重) ÷ 权重合计（' +
      Math.round((d.weightUsed || 0) * 100) + '%）＝ <b>' + d.score + '</b>；' +
      '同一维度不同材料口径不同，折算方式写在「换算方式」列，正式解读仍以报告原文为准。</div>' + miss;
  }

  function basisAll() {
    var list = R.engine.profile();
    return list.map(function (d) {
      return '<div style="margin-bottom:14px">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">' +
        '<b style="font-size:13px">' + U.esc(d.name) + '</b>' + U.badge(d.level, d.badge) +
        U.badge('推算 ' + d.score, 'outline') +
        (d.adjusted ? U.badge('教师初判 ' + d.manual, 'gray') : '') +
        '<span class="small muted">' + (d.basis ? d.basis.length : 0) + ' 项数据</span></div>' +
        basisTable(d) + '</div>';
    }).join('');
  }

  /* ---------- ① 六维能力画像（雷达图） ---------- */
  function radarTab() {
    var list = R.engine.profile();
    var has = list.some(function (d) { return d.score > 0; });
    if (!has) {
      return '<div class="card"><div class="card-head"><h3>' + U.icon('profile', 16) + ' 六维能力画像</h3></div>' +
        U.empty('这份档案还没有可用的能力数据') +
        '<div class="small muted" style="text-align:center;margin:10px 0 14px">' +
        '六维指数由 PEP-3 发展年龄差、VB-MAPP 阶段判定、感统评定与三份观察表共同折算；数据为空时不画图，避免出现"全 0 六边形"这种没有信息量的图。</div>' +
        '<div class="center"><button class="btn primary" data-act="setTab" data-arg="archive" data-arg2="files">去上传评估报告</button>' +
        '<button class="btn" data-act="editCase">或先填六维初判</button></div></div>';
    }
    var r = R.engine.radar();
    var sorted = list.slice().sort(function (a, b) { return b.score - a.score; });
    var top = sorted.slice(0, 2);
    var low = sorted.slice(-2).reverse();
    var side =
      '<div class="card"><div class="card-head"><h3>' + U.icon('heart', 16) + ' 相对优势（可用作教学起点）</h3></div>' +
      '<div class="side-list">' + top.map(function (d) {
        return '<div class="li"><b>' + U.esc(d.short) + ' ' + d.score + '</b><span>' +
          U.esc(d.strengths[0] || '暂缺可引用条目') + '</span></div>';
      }).join('') + '</div>' +
      '<div class="small muted mt8">优势不是"不用管"，而是"从这里进得去"：新技能尽量用配对、拼图、模仿的形式呈现。</div></div>' +
      '<div class="card"><div class="card-head"><h3>' + U.icon('alert', 16) + ' 最需支持（本轮目标优先）</h3></div>' +
      '<div class="side-list">' + low.map(function (d) {
        return '<div class="li"><b>' + U.esc(d.short) + ' ' + d.score + '</b><span>' +
          U.esc(d.needs[0] || '暂缺可引用条目') + '</span></div>';
      }).join('') + '</div>' +
      '<div class="small muted mt8">两条低分边与"依据条数"共同决定目标优先级；点开「能力维度明细」可看每维的原始证据。</div></div>';

    return '<div class="split-radar">' +
      '<div class="card"><div class="card-head"><h3>' + U.icon('profile', 16) + ' 六维能力画像</h3>' +
      '<span class="desc">六条边＝园所 IEP 的 6 个能力维度</span>' +
      '<div class="right"><button class="btn sm" data-act="showJSON">结构化输出</button></div></div>' +
      U.radar({ axes: r.axes, series: r.series, highlight: true }) +
      U.fold('这 6 个分数是怎么算出来的（逐项可追）', basisAll(), { plain: true, tag: '点开查看' }) +
      U.fold('口径说明', U.panel(
        '<b>能力指数（0–100）</b>：把该维度下 PEP-3 发展年龄与生理年龄的比值、VB-MAPP 阶段判定、感统评定等级、' +
        '医学量表分值、观察表的优势/需求条数折算成可比数值，按权重加权；<b>不是常模分</b>。' +
        '没有数据的指标不参与，权重按比例摊给其余项，绝不凭空给分。<br>' +
        '<b>干预前基线</b>：2026-09 入园时的首次记录，与当前指数用同一口径。<br>' +
        '<b>学期目标</b>：由该维度已采纳目标的通过标准反推，学期复审时用同一口径复测。'),
        { plain: true, tag: '点开查看' }) +
      '</div>' +
      '<div>' + side + '</div>' +
      '</div>';
  }

  /* ---------- ② 六维明细 ---------- */
  function domainCards() {
    var list = R.engine.profile();
    return '<div class="grid g2">' + list.map(function (d) {
      return '<div class="domain-card ' + d.cls + '" data-act="domainDetail" data-arg="' + d.code + '">' +
        '<div class="dh"><span class="code">' + U.esc(d.short.slice(0, 1)) + '</span>' +
        '<span class="nm">' + U.esc(d.name) + '</span>' +
        '<span style="margin-left:auto">' + U.badge(d.level, d.badge) + '</span></div>' +
        '<div class="lv">' + U.badge('当前 ' + d.score, 'outline') +
          U.badge('基线 ' + d.baseline, 'gray') + U.badge('目标 ' + d.target, 'v') +
          U.badge(d.sources + ' 个来源', 'outline') + '</div>' +
        '<div class="meta">' + U.esc(d.summary) + '</div>' +
        '<div class="meta" style="margin-top:8px;color:var(--brand)">' +
          (d.hasData ? '由 ' + d.basis.length + ' 项数据推算出 ' + d.score + ' 分' : '暂无可推算的数据') +
          (d.shorts.length ? ' · 本期短期目标 ' + d.shorts.length + ' 条' : '') + ' · 点开看依据 →</div>' +
        '</div>';
    }).join('') + '</div>' +
      U.fold('这 6 个维度是怎么定出来的', U.panel(
        '直接沿用园所《土豆IEP》的《幼儿能力分析》表头：大运动/精细动作、语言沟通、社会交往、生活自理、认知学习、情绪行为，' +
        '另设"家庭养育情况"为背景信息（不计入指数）。把 PEP-3、VB-MAPP、感统、三份观察表四套互不通用的语言对齐到这套维度，' +
        '等级与来源数由引擎统计，每条都能回原文。'),
      { plain: true, tag: '点开查看' });
  }

  /* ---------- ③ 评估对照（读当前档案自己上传并解析的报告） ---------- */
  function assessTab() {
    var P = R.PEP3, V = R.VBMAPP, S = R.SENSORY;
    if (!P && !V) {
      return U.empty('这份档案还没有可用于对照的评估报告') +
        '<div class="small muted" style="text-align:center;margin:10px 0 14px">' +
        'PEP-3 与 VB-MAPP 由园所自行上传后解析。上传并确认解析字段后，这里会出现发展年龄对照与阶段判定。</div>' +
        '<div class="center"><button class="btn primary" data-act="setTab" data-arg="archive" data-arg2="files">去上传评估报告</button></div>';
    }
    var pepRows = (P ? P.domains : []).map(function (p) {
      var tone = p.gap === null ? 'g' : p.gap >= 0 ? 't' : p.gap >= -7 ? 'a' : 'r';
      var gapTx = p.gap === null ? '—' : (p.gap > 0 ? '+' + p.gap : '' + p.gap);
      return '<tr><td><b>' + U.esc(p.k) + '</b></td><td>' + U.esc(p.age) + ' 个月</td>' +
        '<td>' + (p.gap === null ? '—' : U.badge(gapTx + ' 个月', tone)) + '</td>' +
        '<td class="small muted">' + U.esc(p.note) + '</td></tr>';
    }).join('');

    var vbRows = (V ? (V.milestones || []) : []).map(function (v) {
      var tone = v.s === '2' ? 'a' : v.s === '1' ? 'r' : 'g';
      return '<tr><td>' + U.esc(v.k) + '</td><td>' + U.badge('第 ' + v.s + ' 阶段', tone) + '</td></tr>';
    }).join('');

    var barTx = (function () {
      if (!V) return '';
      var b = V.barriers || {};
      var sev = b.severe || [], mod = b.moderate || [], mil = b.mild || [];
      return '障碍评估：中重度 ' + sev.length + ' 项' + (sev.length ? '（' + U.esc(sev[0].k) + '）' : '') +
        '、中度 ' + mod.length + ' 项、轻度 ' + mil.length + ' 项。';
    })();

    var pepCard = P
      ? '<div class="card"><div class="card-head"><h3>' + U.icon('profile', 16) + ' PEP-3 · 发展年龄对照</h3>' +
        '<span class="desc">生理年龄 ' + P.chronoAge + ' 个月 · 发展年龄 ' + P.devAge + ' 个月' +
        (P.estimated ? '（推算）' : '') + '</span></div>' +
        '<table class="table compact"><thead><tr><th>领域</th><th>发展年龄</th><th>差距</th><th>说明</th></tr></thead><tbody>' +
        pepRows + '</tbody></table>' +
        '<div class="small muted mt8">功能发展总分 ' + U.esc(P.total) + '。差距为负表示落后于生理年龄；"≥"表示已达该领域参考最高区间。</div></div>'
      : '<div class="card"><div class="card-head"><h3>' + U.icon('profile', 16) + ' PEP-3 · 发展年龄对照</h3></div>' +
        U.empty('未上传 PEP-3') +
        '<div class="center"><button class="btn sm primary" data-act="uploadReport" data-arg="pep3">上传 PEP-3</button></div></div>';

    var vbCard = V
      ? '<div class="card"><div class="card-head"><h3>' + U.icon('profile', 16) + ' VB-MAPP · 里程碑阶段</h3>' +
        '<span class="desc">第 1 阶段 0–18 月 / 第 2 阶段 18–30 月 / 第 3 阶段 30–48 月</span></div>' +
        '<table class="table compact"><thead><tr><th>领域</th><th>阶段判定</th></tr></thead><tbody>' +
        vbRows + '</tbody></table>' +
        '<div class="small muted mt8">' + barTx + '</div></div>'
      : '<div class="card"><div class="card-head"><h3>' + U.icon('profile', 16) + ' VB-MAPP · 里程碑阶段</h3></div>' +
        U.empty('未上传 VB-MAPP') +
        '<div class="center"><button class="btn sm primary" data-act="uploadReport" data-arg="vbmapp">上传 VB-MAPP</button></div></div>';

    var sensTx = !S ? '未上传感觉统合评估。'
      : (S.groups || []).map(function (g) { return U.esc(g.k) + '：' + U.esc(g.level || '待核对'); }).join('；') +
        (R.store.get().sensoryFixed ? '' : '（三组等级待人工核对）');
    var behTx = (P && (P.behaviors || []).length)
      ? (P.behaviors || []).map(function (b) {
        return U.esc(b.k) + ' ' + (b.severe || 0) + ' 重度 / ' + (b.mild || 0) + ' 轻度';
      }).join('；')
      : '未填病理行为项数';

    return '<div class="grid g2">' + pepCard + vbCard + '</div>' +
      U.fold('PEP-3 病理行为与感统问题项', U.panel(
        '<b>PEP-3 病理行为</b>：' + behTx + '。<br>' +
        '<b>感觉统合</b>：' + sensTx),
      { plain: true, tag: '点开查看' });
  }

  /* ---------- ④ 映射表 ---------- */
  function mappingTab() {
    return '<div class="card"><div class="card-head"><h3>' + U.icon('link', 16) + ' 跨源对齐：四套语言 → 同一套教育目标语言</h3>' +
      '<span class="desc">每一行是一个能力维度，四列是它在各来源里的对应项</span></div>' +
      '<div class="table-scroll"><table class="table compact"><thead><tr><th>能力维度</th><th>VB-MAPP</th><th>PEP-3</th><th>感觉统合</th><th>观察记录</th></tr></thead><tbody>' +
      R.MAPPING.map(function (m) {
        return '<tr><td><b>' + U.esc(R.domainName(m.code)) + '</b></td>' +
          '<td class="small">' + U.esc(m.vbmapp) + '</td><td class="small">' + U.esc(m.pep3) + '</td>' +
          '<td class="small">' + U.esc(m.sensory) + '</td><td class="small">' + U.esc(m.observe) + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="small muted mt8">对齐不是把分数换算成同一个数字，而是把"四份报告各说各的"变成"同一条能力线索上的四个证据"。</div>' +
      '</div>';
  }

  /* ---------- 焦点卡 ---------- */
  function heroProfile() {
    var comp = R.engine.completeness();
    var conf = R.engine.confidence();
    var list = R.engine.profile();
    var weak = list.filter(function (d) { return d.level === '显著落后' || d.level === '落后'; });
    var strong = list.filter(function (d) { return d.level === '相对优势'; });
    var cmp = R.engine.compare();
    return '<div class="hero">' +
      '<div class="h-k">跨源能力画像 · 数据完整度 ' + comp + '% · 置信度 ' + conf.lv + '</div>' +
      '<div class="h-t">' + weak.length + ' 个维度需优先支持，' + strong.length + ' 个可作为教学起点</div>' +
      '<div class="h-d">' + (weak.length
        ? '需优先支持：' + weak.map(function (d) { return U.esc(d.short) + '（' + U.esc(d.level) + '）'; }).join('、') +
          (strong.length ? '；可利用：' + strong.map(function (d) { return U.esc(d.short); }).join('、') + '。' : '。')
        : '各维度发展相对均衡。') +
      '较 2026-09 基线平均提升 ' + cmp.avgDelta + ' 分。' + U.esc(conf.tip) + '</div>' +
      '<div class="h-act"><button class="btn primary lg" data-act="stepNext" data-arg="profile-goals">据画像审议目标 →</button></div>' +
      '</div>';
  }

  R.views.profile = {
    title: '跨源能力画像',
    render: function () {
      var t = U.tab('profile', 'radar');
      var tab = U.tabs('profile', [
        { key: 'radar', label: '六维能力画像' },
        { key: 'domain', label: '能力维度明细', n: 6 },
        { key: 'assess', label: '评估对照' },
        { key: 'map', label: '跨源映射表' }
      ]);
      var body = t === 'domain' ? domainCards()
        : t === 'assess' ? assessTab()
        : t === 'map' ? mappingTab()
        : radarTab();

      return U.pageHead({
        icon: 'profile', title: '跨源能力画像',
        sub: '把医学诊断、PEP-3、VB-MAPP、感觉统合与三份观察表对齐到园所自己的 <b>6 个能力维度</b>，得到一张"起点—现在—目标"可比的六维能力图。'
      }) + heroProfile() + tab + body;
    }
  };

  /* ---------- 下钻 ---------- */
  R.actions.domainDetail = function (code) {
    var d = R.engine.profile().filter(function (x) { return x.code === code; })[0];
    if (!d) return;
    var m = R.MAPPING.filter(function (x) { return x.code === code; })[0];
    var g = d.goalId ? R.store.goal(d.goalId) : null;
    var html =
      '<div class="row" style="gap:6px;margin-bottom:10px">' + U.badge(d.name, 'b') + U.badge(d.level, d.badge) +
      U.badge('当前 ' + d.score, 'outline') + U.badge('基线 ' + d.baseline, 'gray') +
      U.badge('目标 ' + d.target, 'v') + U.badge(d.sources + ' 个来源', 'outline') + '</div>' +
      '<div class="small" style="margin-bottom:12px">' + U.esc(d.summary) + '</div>' +
      '<div class="kv"><b>VB-MAPP</b><div>' + U.esc(m.vbmapp) + '</div>' +
      '<b>PEP-3</b><div>' + U.esc(m.pep3) + '</div>' +
      '<b>感觉统合</b><div>' + U.esc(m.sensory) + '</div>' +
      '<b>观察记录</b><div>' + U.esc(m.observe) + '</div></div>' +
      '<div class="divider"></div>' +
      '<h4 style="font-size:13px;margin-bottom:8px">现有优势（作为支持资源）</h4>' +
      (d.strengths.length ? '<ul style="padding-left:20px;font-size:12.5px;line-height:1.75">' + d.strengths.map(function (s) {
        return '<li>' + U.esc(s) + '</li>'; }).join('') + '</ul>' : '<div class="small muted">暂无</div>') +
      '<h4 style="font-size:13px;margin:12px 0 8px">薄弱问题与发展需求</h4>' +
      (d.needs.length ? '<ul style="padding-left:20px;font-size:12.5px;line-height:1.75">' + d.needs.map(function (s) {
        return '<li>' + U.esc(s) + '</li>'; }).join('') + '</ul>' : '<div class="small muted">暂无</div>');
    if (g) {
      html += '<div class="divider"></div><h4 style="font-size:13px;margin-bottom:8px">本期短期目标（' + U.esc(g.id) + '）</h4>' +
        '<ul style="padding-left:20px;font-size:12.5px;line-height:1.75">' + (g.shorts || []).map(function (s) {
          return '<li>' + U.esc(s.t) + '<span class="muted">（' + U.esc(s.c) + '）</span></li>'; }).join('') + '</ul>';
    }
    html += '<div class="divider"></div>' +
      '<h4 style="font-size:13px;margin-bottom:8px">这个分数怎么算出来的</h4>' + basisTable(d, true);
    if (d.adjusted) {
      html += '<div class="small muted mt8">档案里教师初判为 ' + d.manual + ' 分，与数据推算的 ' +
        d.computed + ' 分有差异；当前按<b>数据推算</b>显示，教师可在档案「六维初判」里改。</div>';
    }
    html += '<div class="divider"></div>' +
      '<h4 style="font-size:13px;margin-bottom:8px">证据抽屉（点开即原始报告对应项）</h4>' +
      U.evidenceList(d.evid);
    U.drawer('能力维度下钻 · ' + d.name, html);
  };

})(window.RIEP);
