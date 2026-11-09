/* ============================================================
   views/track.js · 进度追踪与复审
   月度检视 / 干预前后对比 / 跨月趋势 / 家庭任务卡
   ============================================================ */
(function (R) {
  'use strict';
  var U = R.ui;

  var MONTHS = ['2026-10', '2026-11'];
  var RESULTS = ['达成', '部分达成', '未达成'];
  var RESULT_CLS = { '达成': 'g', '部分达成': 'a', '未达成': 'r' };

  function currentMonth() {
    var h = location.hash || '';
    var m = h.split('/')[2];
    return MONTHS.indexOf(m) >= 0 ? m : '2026-11';
  }

  /* ---------- ① 干预前后对比 ---------- */
  function compareTab() {
    var cmp = R.engine.compare();
    var r = R.engine.radar();
    var radar = U.radar({
      axes: r.axes,
      series: [
        { key: 'now', name: '2026-11 当前', color: '#2f6fd0', values: r.series[1].values },
        { key: 'base', name: '2026-09 基线', color: '#94a3b8', values: r.series[2].values }
      ],
      highlight: false
    });

    var stats = '<div class="grid g3">' +
      U.stat('平均提升', cmp.avgDelta, '分', '六维指数均值，2026-09 → 2026-11', 'accent-t') +
      U.stat('提升最多', cmp.best.delta, '分', cmp.best.name + '（' + cmp.best.before + ' → ' + cmp.best.now + '）', 'accent-b') +
      U.stat('提升最少', cmp.worst.delta, '分', cmp.worst.name + '（' + cmp.worst.before + ' → ' + cmp.worst.now + '）', 'accent-a') +
      '</div>';

    var diffList = '<div class="side-list">' + cmp.rows.slice().sort(function (a, b) { return b.delta - a.delta; })
      .map(function (x) {
        return '<div class="li"><b>' + U.esc(x.short) + '</b><span>' + x.before + ' → ' + x.now +
          '（<b style="color:var(--green)">+' + x.delta + '</b>）· 距目标还差 ' + x.gap + '</span></div>';
      }).join('') + '</div>';

    return stats +
      '<div class="split-radar">' +
      '<div class="card"><div class="card-head"><h3>' + U.icon('profile', 16) + ' 干预前后 · 六边形对比</h3>' +
      '<span class="desc">灰＝入园基线，蓝＝当前</span></div>' + radar +
      U.fold('对比口径说明', U.panel(
        '<b>基线</b>：2026-09 入园时按 PEP-3 / VB-MAPP 阶段与三份观察表折算的六维指数。<br>' +
        '<b>当前</b>：2026-11 第二次月度检视时，用同一口径重算。<br>' +
        '两次都<b>不换量表、不换折算规则</b>，否则差异分不清是孩子变了还是尺子变了。指数 0–100 仅用于内部比较，不是常模分。'),
        { plain: true, tag: '点开查看' }) +
      '</div>' +
      '<div class="card"><div class="card-head"><h3>' + U.icon('track', 16) + ' 逐维度变化</h3></div>' +
      diffList +
      U.note('提升最少不等于"没做事"：' + cmp.worst.name + '的目标依赖成人撤辅与情境稳定，通常比其他维度慢 1–2 个检视周期。') +
      '</div></div>' +

      '<div class="card"><div class="card-head"><h3>' + U.icon('track', 16) + ' 每个维度：基线 / 当前 / 学期目标</h3>' +
      '<span class="desc">虚线＝本学期目标，用于判断"还剩多少"</span></div>' +
      U.compareBars(cmp.rows) +
      '<div class="small muted mt8">目标值由该维度已采纳目标的通过标准反推；学期复审时用同一口径复测，形成可比的三点（基线 / 期中 / 期末）。</div>' +
      '</div>';
  }

  /* ---------- ② 跨月趋势 ---------- */
  function trendSvg() {
    var st = R.store.get();
    var data = MONTHS.map(function (m) {
      var recs = st.progress.filter(function (p) { return p.month === m; });
      var d = recs.filter(function (p) { return p.result === '达成'; }).length;
      var pa = recs.filter(function (p) { return p.result === '部分达成'; }).length;
      var n = recs.filter(function (p) { return p.result === '未达成'; }).length;
      return { month: m, done: d, part: pa, none: n, total: d + pa + n,
        rate: recs.length ? Math.round(d / recs.length * 100) : 0 };
    });

    var W = 600, H = 210, padL = 34, padR = 16, padT = 18, padB = 46;
    var maxV = Math.max(1, Math.max.apply(null, data.map(function (d) { return d.total; })));
    var baseY = H - padB, plotH = baseY - padT;
    var y = function (v) { return baseY - v / maxV * plotH; };

    var grid = '';
    for (var gi = 0; gi <= 3; gi++) {
      var gv = maxV * gi / 3;
      var gy = y(gv);
      grid += '<line x1="' + padL + '" y1="' + gy.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + gy.toFixed(1) +
        '" stroke="' + (gi === 0 ? '#dbe3ec' : '#f1f5f9') + '" stroke-width="1"/>' +
        '<text x="' + (padL - 8) + '" y="' + (gy + 3.5).toFixed(1) + '" font-size="10" fill="#a8b3c2" text-anchor="end">' +
        Math.round(gv) + '</text>';
    }

    var colW = (W - padL - padR) / data.length;
    var barW = 26, gap = 9;
    var parts = [
      { k: 'done', c: '#22a06b', n: '达成' },
      { k: 'part', c: '#e0a030', n: '部分达成' },
      { k: 'none', c: '#c03b5e', n: '未达成' }
    ];
    var bars = '', labels = '';
    data.forEach(function (d, i) {
      var totalW = barW * 3 + gap * 2;
      var x0 = padL + colW * i + (colW - totalW) / 2;
      parts.forEach(function (pt, j) {
        var v = d[pt.k];
        var bx = x0 + j * (barW + gap);
        var by = y(v);
        var hh = baseY - by;
        bars += '<rect x="' + bx.toFixed(1) + '" y="' + by.toFixed(1) + '" width="' + barW + '" height="' + Math.max(0, hh).toFixed(1) +
          '" rx="4" fill="' + pt.c + '" fill-opacity="' + (v ? '.92' : '.16') + '"/>';
        if (v) {
          bars += '<text x="' + (bx + barW / 2).toFixed(1) + '" y="' + (by - 5).toFixed(1) +
            '" font-size="10.5" font-weight="700" fill="' + pt.c + '" text-anchor="middle">' + v + '</text>';
        }
      });
      labels += '<text x="' + (x0 + totalW / 2).toFixed(1) + '" y="' + (baseY + 16) + '" font-size="11" fill="#5b6878" text-anchor="middle">' + d.month + '</text>' +
        '<text x="' + (x0 + totalW / 2).toFixed(1) + '" y="' + (baseY + 32) + '" font-size="10.5" fill="#8b97a8" text-anchor="middle">达成率 ' + d.rate + '% · ' + d.total + ' 条</text>';
    });

    var legend = '<div class="legend">' + parts.map(function (pt) {
      return '<span><i style="background:' + pt.c + '"></i>' + pt.n + '</span>';
    }).join('') +
      '<span class="muted">同一目标的达成情况跨月对比；换评估周期时需说明口径是否可比</span></div>';

    return '<div class="card"><div class="card-head"><h3>' + U.icon('profile', 16) + ' 逐月达成结构</h3>' +
      '<span class="desc">每月记录条数不同，看的是结构变化而不是总数</span></div>' +
      '<div class="trend-wrap"><svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto">' +
      grid + bars + labels + '</svg></div>' + legend + '</div>';
  }

  /* ---------- ③ 月度检视看板 ---------- */
  function rowsOf(t, per) {
    var n = Math.ceil((t || '').length / per);
    return Math.max(2, Math.min(6, n));
  }

  function boardCard() {
    var st = R.store.get();
    var month = currentMonth();
    var adopted = R.engine.adoptedGoals();
    var recOf = function (gid) {
      return st.progress.filter(function (p) { return p.month === month && p.goalId === gid; })[0];
    };
    var rows = adopted.slice().sort(function (a, b) {
      var ra = recOf(a.g.id) ? 1 : 0, rb = recOf(b.g.id) ? 1 : 0;
      return ra - rb; // 未更新的置顶
    });

    return '<div class="card"><div class="card-head"><h3>' + U.icon('track', 16) + ' ' + month + ' 月度检视</h3>' +
      '<span class="desc">每月至少检视 1 次；未更新的目标置顶</span>' +
      '<div class="right">' + MONTHS.map(function (m) {
        return '<a class="btn sm ' + (m === month ? 'soft' : '') + '" href="#/track/' + m + '">' + m + '</a>';
      }).join(' ') + '</div></div>' +
      '<div class="table-scroll"><table class="table board-tbl"><colgroup><col style="width:29%"><col style="width:13%"><col style="width:31%"><col style="width:27%"></colgroup>' +
      '<thead><tr><th>目标</th><th>本月达成情况</th><th>质性描述</th><th>下一步</th></tr></thead><tbody>' +
      rows.map(function (r) {
        var rec = recOf(r.g.id);
        var sel = '<select data-pr="' + r.g.id + '"><option value="">未记录</option>' +
          RESULTS.map(function (x) {
            return '<option value="' + x + '"' + (rec && rec.result === x ? ' selected' : '') + '>' + x + '</option>';
          }).join('') + '</select>';
        return '<tr' + (rec ? '' : ' style="background:#fffafc"') + '>' +
          '<td><b>' + U.esc(r.g.id) + '</b><div class="small muted">' + U.esc(R.domainName(r.g.domain)) + '</div>' +
          '<div class="small">' + U.esc(r.g.text) + '</div></td>' +
          '<td>' + sel + (rec ? '' : '<div class="small miss">本月未记录</div>') + '</td>' +
          '<td><textarea data-pn="' + r.g.id + '" placeholder="质性描述（本月具体表现）" rows="' + rowsOf(rec && rec.note ? rec.note : '', 26) + '" style="font-size:12.5px">' + U.esc(rec ? rec.note : '') + '</textarea></td>' +
          '<td><textarea data-px="' + r.g.id + '" placeholder="下一步" rows="' + rowsOf(rec && rec.next ? rec.next : '', 24) + '" style="font-size:12.5px">' + U.esc(rec ? rec.next : '') + '</textarea></td>' +
          '</tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="btn-row mt14">' +
      (R.store.role().canEdit
        ? '<button class="btn primary" data-act="saveProgress" data-arg="' + month + '">保存 ' + month + ' 检视记录</button>' : '') +
      '<button class="btn" data-act="genReview">一键生成学期复盘</button>' +
      '</div></div>';
  }

  R.views.track = {
    title: '进度追踪与复审',
    render: function () {
      var role = R.store.role();
      var head = U.pageHead({
        icon: 'track', title: '进度追踪与复审',
        sub: '五类教师按分工执行，每月记录一次达成情况；用"干预前后对比"复盘六个维度的变化。'
      });
      if (role.key === 'parent') {
        return head + R.comp.familyCard();
      }

      var st = R.store.get();
      var month = currentMonth();
      var adopted = R.engine.adoptedGoals();
      var missing = adopted.filter(function (r) {
        return !st.progress.some(function (p) { return p.month === month && p.goalId === r.g.id; });
      }).length;
      var cmp = R.engine.compare();

      var hero = '<div class="hero' + (missing ? '' : ' done') + '">' +
        '<div class="h-k">' + month + ' 月度检视 · 干预前后平均提升 ' + cmp.avgDelta + ' 分</div>' +
        '<div class="h-t">' + (missing
          ? '还有 ' + missing + ' 条目标没记录，已置顶在表中'
          : '本月 ' + adopted.length + ' 条目标已全部记录') + '</div>' +
        '<div class="h-d">每月至少检视 1 次：记录达成 / 部分达成 / 未达成，并写一句质性描述。基线（2026-09）与当前用同一口径，学期末可直接对比。</div>' +
        '<div class="h-act">' +
        '<button class="btn primary lg" data-act="saveProgress" data-arg="' + month + '">保存 ' + month + ' 检视记录</button>' +
        '<button class="btn lg" data-act="setTab" data-arg="track" data-arg2="compare">看干预前后对比</button>' +
        '</div></div>';

      var t = U.tab('track', 'board');
      var tab = U.tabs('track', [
        { key: 'board', label: '月度检视看板', n: missing || undefined },
        { key: 'compare', label: '干预前后对比' },
        { key: 'trend', label: '跨月趋势' },
        { key: 'family', label: '家庭任务卡' }
      ]);
      var body = t === 'compare' ? compareTab()
        : t === 'trend' ? trendSvg()
        : t === 'family' ? R.comp.familyCard()
        : boardCard();

      return head + hero + tab + body +
        U.fold('检视节奏提醒', U.panel(
          '· <b>每月至少检视 1 次</b>：系统提示未更新的目标；检视完成率由园长视图监控。<br>' +
          '· <b>每学期至少复审 1 次</b>：建议时间 ' + R.CASE.planEnd + '；复审材料可一键生成。<br>' +
          '· <b>感统复评每 8 周 1 次</b>：复评结果回传后触发画像更新提示。'),
        { plain: true, tag: '点开查看' });
    }
  };

  R.actions.saveProgress = function (month) {
    var st = R.store.get();
    Array.prototype.forEach.call(document.querySelectorAll('[data-pr]'), function (el) {
      var gid = el.getAttribute('data-pr');
      var result = el.value;
      if (!result) return;
      var note = document.querySelector('[data-pn="' + gid + '"]').value.trim();
      var next = document.querySelector('[data-px="' + gid + '"]').value.trim();
      var rec = st.progress.filter(function (p) { return p.month === month && p.goalId === gid; })[0];
      if (rec) { rec.result = result; rec.note = note; rec.next = next; }
      else st.progress.push({ month: month, goalId: gid, result: result, note: note, next: next });
    });
    R.store.save();
    R.store.log(R.store.role().short, '月度检视', month + ' 检视记录已更新');
    U.toast(month + ' 检视记录已保存', 'ok');
    R.render();
  };

  R.actions.genReview = function () {
    var st = R.store.get();
    var adopted = R.engine.adoptedGoals();
    var last = '2026-11';
    var recs = st.progress.filter(function (p) { return p.month === last; });
    var done = recs.filter(function (p) { return p.result === '达成'; }).length;
    var part = recs.filter(function (p) { return p.result === '部分达成'; }).length;
    var none = recs.filter(function (p) { return p.result === '未达成'; }).length;
    var total = adopted.length || 1;
    var cmp = R.engine.compare();
    var html =
      '<h4>一、干预前后对比（2026-09 基线 → 2026-11 当前）</h4>' +
      '<table><thead><tr><th>能力维度</th><th>基线</th><th>当前</th><th>变化</th><th>学期目标</th><th>距目标</th></tr></thead><tbody>' +
      cmp.rows.map(function (r) {
        return '<tr><td>' + U.esc(r.name) + '</td><td>' + r.before + '</td><td>' + r.now + '</td>' +
          '<td>+' + r.delta + '</td><td>' + r.target + '</td><td>' + r.gap + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '<div class="small muted">六维平均提升 ' + cmp.avgDelta + ' 分；提升最多：' + U.esc(cmp.best.name) +
      '（+' + cmp.best.delta + '），最少：' + U.esc(cmp.worst.name) + '（+' + cmp.worst.delta + '）。</div>' +
      '<h4>二、目标达成率（' + last + '）</h4>' +
      '<table><thead><tr><th>目标</th><th>学期目标</th><th>结果</th><th>下一步建议</th></tr></thead><tbody>' +
      adopted.map(function (r) {
        var rec = recs.filter(function (p) { return p.goalId === r.g.id; })[0];
        return '<tr><td>' + U.esc(r.g.id) + '</td><td class="small">' + U.esc(r.g.text) + '</td>' +
          '<td>' + (rec ? U.esc(rec.result) : '未记录') + '</td>' +
          '<td class="small">' + U.esc(rec ? rec.next : '请补录本月检视') + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '<h4>三、汇总</h4><ul>' +
      '<li>达成 ' + done + ' / ' + total + '（' + Math.round(done / total * 100) + '%），部分达成 ' + part + '，未达成 ' + none + '。</li>' +
      '<li>未达成目标先检查"通过标准是否过高 / 情境是否稳定 / 辅助撤除是否过快"，再调整目标，而不是简单延长期限。</li>' +
      '<li>情绪-1 仍在基线附近，建议下次会议讨论是否把"逃避行为减少 50%"改为"每周 ≤2 次"的更具体口径。</li>' +
      '</ul>' +
      '<h4>四、家长反馈摘要</h4><ul>' +
      '<li>家长反馈"嚼完 5 口再咽"在家有效，进餐提醒次数下降；希望园里也统一用这句话。</li>' +
      '<li>家庭任务卡完成度：进食约定 6/7 天；轮流小游戏 4/7 天；出门预告基本每天做到。</li>' +
      '<li>家长仍希望重点练"主动邀请小朋友"，已纳入社交-1 的下阶段泛化目标。</li>' +
      '</ul>' +
      '<div class="small muted mt8">复盘材料用于学期复审会议；目标调整需再次经 IEP 团队会议与家长知情同意。</div>';
    U.modal('学期复盘材料 · ' + last, html, [
      { label: '导出 Word', cls: 'primary', onClick: function () {
        R.util.downloadWord('学期复盘_' + R.CASE.id + '_' + last + '.doc', html, '学期复盘');
      } },
      { label: '打印 / PDF', cls: '', onClick: function () { R.util.printEl(html, '学期复盘 ' + last); } }
    ]);
  };

})(window.RIEP);
