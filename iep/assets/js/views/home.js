/* ============================================================
   views/home.js · 工作台（教师为主用户 · 焦点优先）
   ============================================================ */
(function (R) {
  'use strict';
  var U = R.ui;
  R.comp = R.comp || {};

  /* ---------- 一页纸班级支持卡 ---------- */
  R.comp.supportCard = function () {
    var top = R.engine.adoptedGoals().slice(0, 3);
    var prof = R.engine.profile();
    var strong = prof.slice().sort(function (a, b) { return b.score - a.score; }).slice(0, 3);
    var weak = prof.slice().sort(function (a, b) { return a.score - b.score; }).slice(0, 3);
    return '<div class="support-card">' +
      '<h3>' + U.icon('heart', 16) + ' 一页纸班级支持卡 · ' + U.esc(R.CASE.alias) + '</h3>' +
      '<div class="who"><b>这个孩子是谁（3 句话）</b><br>' +
        '① ' + U.esc(R.CASE.name) + '，' + U.esc(R.CASE.age) + '，' + U.esc(R.CASE.cls) + '，园内编号 ' + U.esc(R.CASE.id) + '。<br>' +
        '② 优势：' + strong.map(function (d) { return U.esc(d.short) + '（' + d.score + '）'; }).join('、') +
        ' —— 拼图、形状配对、模仿是最好用的入口。<br>' +
        '③ 需要支持：' + weak.map(function (d) { return U.esc(d.short); }).join('、') +
        ' —— 尤其是主动发起同伴互动和做难任务时的急躁。' +
      '</div>' +
      '<h4 style="font-size:13px;margin:0 0 6px">本学期 3 个最重要目标</h4>' +
      '<ol style="margin:0 0 12px;padding-left:20px;font-size:13px">' +
        (top.length ? top.map(function (r) {
          return '<li style="margin-bottom:4px"><b>' + U.esc(r.g.id) + '</b> ' + U.esc(r.g.text) +
            ' <span class="muted small">（' + U.esc(r.g.criteria) + '）</span></li>';
        }).join('') : '<li>尚无已采纳目标，请先到「IEP 会议调校与审议」审议。</li>') +
      '</ol>' +
      '<h4 style="font-size:13px;margin:0 0 6px">具体做法（含辅助层级）</h4>' +
      '<ul style="margin:0 0 12px;padding-left:20px;font-size:12.5px">' +
        '<li>提要求：他要东西时先等 3 秒，指自己说"我"、指他说"你"；辅助层级 手势 → 示范 → 口语，每 3 天撤一级。</li>' +
        '<li>同伴互动：先固定 2 名温和同伴，老师用"旁白式示范"——"你看，××拿小车，他想和土豆一起玩"。</li>' +
        '<li>难任务：拆成小一步，桌上放"自己试 / 请帮忙 / 休息一下"三张卡，教他说"我需要休息"。</li>' +
      '</ul>' +
      '<h4 style="font-size:13px;margin:0 0 6px">强化物与偏好</h4>' +
      '<div style="font-size:12.5px;margin-bottom:12px">' +
        U.badge('拼图', 'v') + U.badge('数字卡片', 'b') + U.badge('足球 / 投沙包', 'g') +
        U.badge('手指律动', 't') + U.badge('当"小老师"', 'a') +
        '<span class="muted small">（抵触水果、酸奶）</span>' +
      '</div>' +
      '<h4 style="font-size:13px;margin:0 0 6px">情绪预警信号与应对步骤</h4>' +
      '<div style="font-size:12.5px">' +
        '<b>预警信号：</b>音量升高、推开材料、重复语言增多、身体转开。<br>' +
        '<b>应对：</b>① 降低当下要求 → ② 给"我需要休息"卡 → 3–5 分钟安静角 → ' +
        '③ 回来做"小一步" → ④ 当天记录一次发生频次。</div>' +
      '<div class="divider"></div>' +
      '<div class="small muted">责任分工：融合教师 李老师 统筹 · 班级 / 小组 / 密训 / 感统教师按分工执行 · 本卡随 IEP 更新</div>' +
      '</div>';
  };

  /* ---------- 家庭任务卡 ---------- */
  R.comp.familyCard = function () {
    if (!R.store.get().obsFilled.parent) {
      return U.notice('warn', 'alert',
        '<b>家庭任务卡暂未下发。</b>家长观察表尚未填写，系统不会"凭空给家长派任务"。<br>' +
        '请先在「数据归集台」提交居家观察表，或由教师代录。');
    }
    return '<div class="card" style="border:2px dashed #f0b95e;background:#fffdf7">' +
      '<div class="card-head"><h3>' + U.icon('heart', 16) + ' 家庭任务卡</h3>' +
      '<span class="badge a">每两周 1–2 个动作 · 与家长需求对齐</span></div>' +
      R.FAMILY_TASKS.map(function (t) {
        return '<div class="card tight" style="margin-bottom:10px;box-shadow:none">' +
          '<div class="row" style="margin-bottom:6px">' + U.badge(t.week, 'b') + '</div>' +
          '<div style="font-size:13px"><b>做什么：</b>' + U.esc(t.action) + '</div>' +
          '<div class="small muted" style="margin-top:4px"><b>时间：</b>' + U.esc(t.time) + '</div>' +
          '<div class="small muted"><b>怎么算成功：</b>' + U.esc(t.success) + '</div>' +
          '<div class="small muted"><b>观察提示：</b>' + U.esc(t.observe) + '</div>' +
        '</div>';
      }).join('') +
      '<div class="small muted">与老师沟通的一句话：这周"嚼完 5 口再咽"用了 6 天，他有时候会自己指嘴巴提醒我；轮流小车还是只能等 1 轮。</div>' +
      '</div>';
  };

  /* ---------- 家长版摘要 ---------- */
  R.comp.parentSummary = function () {
    var st = R.store.get();
    var adopted = R.engine.adoptedGoals();
    var prof = R.engine.profile();
    var strong = prof.slice().sort(function (a, b) { return b.score - a.score; }).slice(0, 3);
    return '<div class="card" style="background:#fbfdff">' +
      '<div class="card-head"><h3>' + U.icon('doc', 16) + ' 家长版摘要</h3>' +
      '<span class="badge ' + (st.doc.parentShared ? 'g' : 'gray') + '">' +
      (st.doc.parentShared ? '融合教师已确认并发送' : '待融合教师确认后发送') + '</span></div>' +
      '<div class="doc-paper" style="border:none;padding:0">' +
        '<h4>孩子现在能做什么</h4>' +
        '<ul>' +
        '<li>' + U.esc((strong[0] && strong[0].strengths[0]) || '该维度暂无可引用条目（补传评估或回收观察表后自动填入）') + '。</li>' +
        '<li>' + U.esc((strong[1] && strong[1].strengths[0]) || '该维度暂无可引用条目（补传评估或回收观察表后自动填入）') + '。</li>' +
        '<li>' + U.esc((strong[2] && strong[2].strengths[0]) || '该维度暂无可引用条目（补传评估或回收观察表后自动填入）') + '。</li>' +
        '<li>能自己上厕所、穿脱衣服鞋袜、接水喝，会自己搬椅子、收玩具。</li>' +
        '</ul>' +
        '<h4>我们打算帮他学什么</h4>' +
        '<ul>' + (adopted.length ? adopted.slice(0, 6).map(function (r) {
          return '<li>' + U.esc(r.g.text) + '（' + U.esc(r.g.criteria) + '）</li>';
        }).join('') : '<li>目标尚未确认。</li>') + '</ul>' +
        '<h4>家里可以怎么配合</h4>' +
        '<ul>' +
        '<li>吃饭时用"嚼完 5 口再咽"，和幼儿园用同一句话；不催、不喂。</li>' +
        '<li>他要东西时，指自己说"我"、指他说"你"，他说"我要"就马上给。</li>' +
        '<li>玩轮流小游戏（推小车、搭积木、翻绘本），一次 3–5 分钟，开心就好，不强迫。</li>' +
        '<li>出门前先说一句"我们先去××，再回家"。</li>' +
        '</ul>' +
      '</div>' +
      '<div class="small muted mt8">说明：家长版不是简化版公文，而是沟通工具。原文中的专业术语（PEP-3、VB-MAPP、障碍评估、感觉调节）已在此版本中去除。</div>' +
      '</div>';
  };

  /* ---------- 焦点：下一步 ---------- */
  function nextStep() {
    var st = R.store.get();
    var s = R.engine.goalStats();
    var m = st.meetings[st.meetings.length - 1];
    var comp = R.engine.completeness();

    (function () { })();
    var missF = R.OBS_ORDER.filter(function (k) { return !st.obsFilled[k]; });
    if (missF.length) {
      var nk = missF[0], nT = R.OBS_TYPES[nk];
      return {
        kicker: '第 1 步 · 数据归集',
        title: '还差 ' + missF.length + ' 张观察表：' + missF.map(function (k) { return R.OBS_TYPES[k].short; }).join('、'),
        desc: '当前数据完整度 ' + comp + '%。缺「' +
          missF.map(function (k) { return R.OBS_TYPES[k].name; }).join('」「') +
          '」，相关目标只能给方向，给不出情境化写法。',
        btn: '<button class="btn primary lg" data-act="uploadObs" data-arg="' + nk + '">上传' + nT.name + '</button>' +
          '<button class="btn lg" data-act="openObs" data-arg="' + nk + '">在线填报</button>',
        side: '三张表都支持上传原件自动解析或在线填报；不虚构观察内容，缺口会转成待办。'
      };
    }
    if (s.pending > 0) {
      return {
        kicker: '第 2 步 · 目标审议',
        title: '审议 ' + s.pending + ' 条待确认目标（系统已按优先级排好序）',
        desc: '引擎按 6 个能力维度从已入档数据推出 ' + s.all + ' 条目标，每条都带长期目标、短期目标与两套策略。逐条确认或改写后，才能进入 IEP 会议。',
        btn: '<button class="btn primary lg" data-act="stepNext" data-arg="goals-meeting">去 IEP 会议调校与审议</button>',
        side: '所有目标默认为「待审议」，未经教师确认不得作为正式 IEP 使用。'
      };
    }
    if (!m.applied) {
      return {
        kicker: '第 3 步 · 会议调校',
        title: '把 ' + m.date + ' 的 IEP 会议纪要转成决议并应用',
        desc: '粘贴纪要 → 规则版定位"哪条要改 + 依据是哪一句" → 教师逐条确认 → 写回目标，成稿升级。',
        btn: '<button class="btn primary lg" data-act="stepNext" data-arg="goals-meeting">去会议调校与审议</button>',
        side: '系统只做定位与记录，改什么、改到什么程度由 IEP 团队决定。'
      };
    }
    if (st.doc.status !== 'effective') {
      return {
        kicker: '第 4 步 · 成稿生效',
        title: '走完生效确认，导出 IEP ' + st.doc.version + ' 成稿',
        desc: '需经教师审议、IEP 会议调校、家长知情同意后，由人工置为「生效」。未生效导出会标注草案。',
        btn: '<button class="btn primary lg" data-act="stepNext" data-arg="meeting-doc">去成稿与导出</button>',
        side: '导出形态：Word（园所档案）/ PDF / 一页纸支持卡 / 家长版摘要。'
      };
    }
    return {
      kicker: '第 5 步 · 执行与检视',
      title: '记录本月目标达成情况（每月至少 1 次）',
      desc: '五类教师按分工执行，每月记录达成 / 部分达成 / 未达成 + 质性描述；干预前后对比可在「进度追踪」查看。',
      btn: '<button class="btn primary lg" data-act="goto" data-arg="track">去记录月度检视</button>',
      side: '学期末可一键汇总六维变化、达成率与家长反馈，生成复审材料。'
    };
  }

  /* ---------- 区块 ---------- */
  function todoList() {
    var st = R.store.get();
    var left = st.todos.filter(function (t) { return !t.done; });
    return '<div class="card"><div class="card-head"><h3>' + U.icon('check', 16) + ' 待办与提醒</h3>' +
      '<span class="desc">' + left.length + ' 项未完成 · 系统把节点做成待办，而不是靠人记</span></div>' +
      st.todos.map(function (t) {
        return '<div class="todo' + (t.urgent && !t.done ? ' urgent' : '') + '">' +
          '<div class="box' + (t.done ? ' on' : '') + '" data-act="toggleTodo" data-arg="' + t.id + '">' +
          (t.done ? '<svg viewBox="0 0 24 24" width="12" height="12"><path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>' : '') +
          '</div>' +
          '<div class="tx"><b' + (t.done ? ' style="text-decoration:line-through;color:#9aa5b5"' : '') + '>' + U.esc(t.text) + '</b>' +
          '<p>' + U.esc(t.who) + ' · ' + U.esc(t.due) + (t.urgent && !t.done ? ' · <span style="color:#c03b5e">紧急</span>' : '') + '</p></div>' +
          '</div>';
      }).join('') + '</div>';
  }

  function dutyQuick() {
    return '<div class="card"><div class="card-head"><h3>' + U.icon('meeting', 16) + ' 这个孩子由谁负责什么</h3>' +
      '<span class="desc">五类教师 + 家长 + 园所</span></div>' +
      '<div class="grid g2">' + R.DUTY.filter(function (d) { return d.key !== 'admin'; }).map(function (d) {
        return '<div class="duty-card" style="box-shadow:none">' +
          '<h4>' + U.esc(d.name) + ' ' + U.badge(d.tag, d.key === 'fusion' ? 'b' : 'outline') + '</h4>' +
          '<div class="scope">' + U.esc(d.scope) + '</div>' +
          '<ul>' + d.duty.slice(0, 2).map(function (x) { return '<li>' + U.esc(x) + '</li>'; }).join('') + '</ul>' +
          '<div class="freq">' + U.esc(d.freq) + '</div>' +
          '</div>';
      }).join('') + '</div>' +
      U.note('完整职责见「合规与设置 · 责任分工」，成稿第五章同源。') + '</div>';
  }

  /* ---------- 个案概览（图表化） ---------- */
  var DOM_COLOR = { YD: '#2f6fd0', YY: '#8b5cf6', SJ: '#14b8a6', ZL: '#f59e0b', RZ: '#22a06b', QX: '#e0577a' };

  /* 计条数的条形图（不显示百分比，避免"2/3 · 67%"这种误读） */
  function countBars(list) {
    var max = Math.max.apply(null, list.map(function (x) { return x.got; }).concat([1]));
    return '<div class="bars">' + list.map(function (b) {
      return '<div class="bar-row"><div class="nm" title="' + U.esc(b.name) + '">' + U.esc(b.name) + '</div>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + (b.got / max * 100) + '%;background:' +
        (b.color || '#2f6fd0') + '"></div></div>' +
        '<div class="raw">' + b.got + ' 条</div></div>';
    }).join('') + '</div>';
  }

  /* ① 六维能力：雷达 + 三个快数 */
  function ovRadar() {
    var r = R.engine.radar();
    var list = R.engine.profile();
    var cmp = R.engine.compare();
    return '<div class="card"><div class="card-head"><h3>' + U.icon('profile', 16) + ' 六维能力画像</h3>' +
      '<span class="desc">基线 → 当前 → 学期目标，三条同口径可比</span></div>' +
      U.radar({ axes: r.axes, series: r.series, highlight: true }) +
      '<div class="grid g3 mt8">' +
      U.stat('平均提升', cmp.avgDelta, '分', '较 2026-09 基线', 'accent-t') +
      U.stat('提升最快', cmp.best ? cmp.best.short : '—', '', cmp.best ? '+' + cmp.best.delta + ' 分' : '') +
      U.stat('最需支持', cmp.worst ? cmp.worst.short : '—', '',
        cmp.worst ? (cmp.worst.delta >= 0 ? '+' : '') + cmp.worst.delta + ' 分 · 距目标 ' + cmp.worst.gap : '') +
      '</div>' +
      U.fold('六个维度的当前值 / 基线 / 目标', '<div class="table-scroll"><table class="table compact"><thead><tr>' +
        '<th>维度</th><th>等级</th><th class="nw">基线</th><th class="nw">当前</th><th class="nw">学期目标</th><th class="nw">差值</th></tr></thead><tbody>' +
        list.map(function (d) {
          return '<tr><td><b>' + U.esc(d.short) + '</b></td><td>' + U.badge(d.level, d.badge) + '</td>' +
            '<td class="nw muted">' + d.baseline + '</td><td class="nw"><b>' + d.score + '</b></td>' +
            '<td class="nw">' + d.target + '</td><td class="nw">' + Math.max(0, d.target - d.score) + '</td></tr>';
        }).join('') + '</tbody></table></div>', { plain: true, tag: '点开看数' }) +
      '</div>';
  }

  /* ② 数据完整度：环形 + 四类来源条形 */
  function ovData() {
    var comp = R.engine.completeness();
    var conf = R.engine.confidence();
    var parts = R.engine.completenessParts();
    var color = comp >= 85 ? '#22a06b' : comp >= 60 ? '#f59e0b' : '#e0577a';
    return '<div class="card"><div class="card-head"><h3>' + U.icon('intake', 16) + ' 数据完整度</h3>' +
      '<span class="desc">四类材料各自到齐了没有</span></div>' +
      '<div class="ov-donut">' +
      U.donut(comp, { size: 130, sw: 13, color: color, unit: '完整度' }) +
      '<div class="ov-dside">' + U.badge('置信度 ' + conf.lv, comp >= 85 ? 'g' : comp >= 60 ? 'a' : 'r') +
      '<div class="small muted mt8">' + U.esc(conf.tip) + '</div></div></div>' +
      '<div class="divider"></div>' +
      U.bars(parts.map(function (p) {
        return { name: p.k, got: p.got, full: p.v, color: p.got === p.v ? '#22a06b' : '#2f6fd0' };
      })) +
      U.fold('口径说明', U.panel(
        '<b>医学诊断</b> 25% · <b>教育评估</b> 35%（PEP-3 / VB-MAPP 已结构化，感统按 2/3 计）· <b>教师观察</b> 20%（小组班 / 融合班各半）· <b>家长观察</b> 20%。' +
        '权重可在「合规与设置」中调整，形成园所自己的校本口径。'), { plain: true, tag: '点开查看' }) +
      '</div>';
  }

  /* ③ 干预前后对比 */
  function ovCompare() {
    var cmp = R.engine.compare();
    return '<div class="card"><div class="card-head"><h3>' + U.icon('track', 16) + ' 干预前后对比</h3>' +
      '<span class="desc">2026-09 入园基线 → 2026-11 当前</span></div>' +
      U.compareBars(cmp.rows) +
      '</div>';
  }

  /* ④ 当前 vs 学期目标（双条） */
  function ovGap() {
    var list = R.engine.profile();
    return '<div class="card"><div class="card-head"><h3>' + U.icon('goals', 16) + ' 离学期目标还有多远</h3>' +
      '<span class="desc">实线＝当前，浅底＝学期目标</span></div>' +
      U.dualBars(list.map(function (d) {
        return { name: d.short, now: d.score, target: d.target, color: DOM_COLOR[d.code] };
      })) +
      U.note('差值越大越该先做：目标排序里的"维度缺口"就是这一列。') +
      '</div>';
  }

  /* ⑤ 目标审议进度：环形 + 堆叠条 + 各维度条数 */
  function ovGoals() {
    var s = R.engine.goalStats();
    var pct = s.all ? Math.round(s.adopted / s.all * 100) : 0;
    var perDim = R.DOMAINS.map(function (d) {
      var n = R.store.get().goals.filter(function (g) { return g.domain === d.code && g.status !== 'dropped'; }).length;
      return { name: d.short, got: n, full: 3, color: DOM_COLOR[d.code] };
    });
    var segs = [
      { k: '已采纳 ' + s.adopted, v: s.adopted, c: '#22a06b' },
      { k: '待审议 ' + s.pending, v: s.pending, c: '#f59e0b' },
      { k: '降级 ' + s.deferred, v: s.deferred, c: '#8b5cf6' },
      { k: '已忽略 ' + s.dropped, v: s.dropped, c: '#c9d3e0' }
    ];
    var total = s.all || 1;
    var bar = '<div class="stack">' + segs.filter(function (x) { return x.v; }).map(function (x) {
      return '<i style="width:' + (x.v / total * 100) + '%;background:' + x.c + '" title="' + U.esc(x.k) + '"></i>';
    }).join('') + '</div>';
    return '<div class="card"><div class="card-head"><h3>' + U.icon('goals', 16) + ' 目标审议进度</h3>' +
      '<span class="desc">共 ' + s.all + ' 条候选目标</span></div>' +
      '<div class="ov-donut">' +
      U.donut(pct, { size: 130, sw: 13, color: '#22a06b', unit: '已采纳' }) +
      '<div class="ov-dside">' + segs.map(function (x) {
        return '<div class="lg-row"><i style="background:' + x.c + '"></i>' + U.esc(x.k) + '</div>';
      }).join('') + '</div></div>' +
      '<div class="divider"></div>' + bar +
      '<div class="small muted mt8">各维度目标条数：</div>' +
      countBars(perDim) +
      U.fold('为什么按维度而不是按科目排', U.panel(
        '六个维度与园所《幼儿能力分析》表头一致；每个维度都要有目标，但不要求每个维度都设核心目标。' +
        '当前共 ' + R.store.get().goals.filter(function (g) { return g.status !== 'dropped'; }).length + ' 条。'),
        { plain: true, tag: '点开查看' }) +
      '</div>';
  }

  /* ⑥ 五类教师各自承担了几条目标（按目标主责字段统计，数得出来） */
  function ovDuty() {
    var goals = R.store.get().goals.filter(function (g) { return g.status !== 'dropped'; });
    var rows = R.DUTY.filter(function (d) { return d.key !== 'admin' && d.key !== 'parent'; }).map(function (d) {
      var n = goals.filter(function (g) { return (g.owner || '').indexOf(d.name) >= 0; }).length;
      return { name: d.name.replace('教师', ''), got: n, color: d.key === 'fusion' ? '#2f6fd0' : '#14b8a6' };
    });
    var sum = rows.reduce(function (a, r) { return a + r.got; }, 0);
    return '<div class="card"><div class="card-head"><h3>' + U.icon('meeting', 16) + ' 五类教师各自扛几条目标</h3>' +
      '<span class="desc">按目标"主责"字段统计 · 共 ' + sum + ' 人次</span></div>' +
      countBars(rows) +
      '<div class="divider"></div>' +
      '<div class="small muted">一条目标可以有多位主责（如"班级教师 / 家长"），所以人次会大于目标条数。' +
      '具体频次与分工见成稿第五章。</div>' +
      '</div>';
  }

  function overviewGrid() {
    var st = R.store.get();
    var s = R.engine.goalStats();
    var comp = R.engine.completeness();
    var conf = R.engine.confidence();
    var cmp = R.engine.compare();
    return '<div class="grid g4">' +
      U.stat('数据完整度', comp, '%', '置信度：' + conf.lv, 'accent-b') +
      U.stat('候选目标', s.all, '条', '已采纳 ' + s.adopted + ' · 待审议 ' + s.pending) +
      U.stat('六维平均提升', cmp.avgDelta, '分', '较 2026-09 基线', 'accent-t') +
      U.stat('成稿版本', st.doc.version, '', st.doc.status === 'effective' ? '已生效' : '草案待确认', 'accent-v') +
      '</div>' +
      '<div class="grid g2 mt14">' + ovRadar() + ovData() + '</div>' +
      '<div class="grid g2 mt14">' + ovGap() + ovGoals() + '</div>' +
      '<div class="grid g2 mt14">' + ovCompare() + ovDuty() + '</div>';
  }

  function timeline() {
    return '<div class="card"><div class="card-head"><h3>' + U.icon('track', 16) + ' 一个学期的场景线</h3>' +
      '<span class="desc">2 周内开会 · 每月至少检视 1 次 · 每学期至少复审 1 次</span></div>' +
      '<div class="timeline">' + R.MILESTONES.map(function (m) {
        return '<div class="tl-item ' + (m.state === 'done' ? 'done' : m.state === 'now' ? 'now' : '') + '">' +
          '<div class="t">' + U.esc(m.title) + ' <span class="when">' + U.esc(m.when) + '</span></div>' +
          '<div class="d">' + U.esc(m.desc) + '</div></div>';
      }).join('') + '</div></div>';
  }

  function logList() {
    var st = R.store.get();
    return '<div class="card"><div class="card-head"><h3>' + U.icon('doc', 16) + ' 最近留痕</h3>' +
      '<span class="desc">记录"由谁、何时、为何修改"</span></div>' +
      st.logs.slice(0, 8).map(function (l) {
        return '<div class="small" style="padding:6px 0;border-bottom:1px dashed var(--line)">' +
          '<b>' + U.esc(l.act) + '</b> · ' + U.esc(l.detail) +
          '<div class="muted">' + U.esc(l.t) + ' · ' + U.esc(l.who) + '</div></div>';
      }).join('') + '</div>';
  }

  /* ---------- 园长 ---------- */
  function principalView() {
    var children = R.CHILDREN;
    var withIep = children.filter(function (c) { return c.iepVersion !== '—'; }).length;
    var reviewed = children.filter(function (c) { return c.lastReview !== '—'; }).length;
    var risk = children.filter(function (c) { return c.risk; }).length;
    var t = U.tab('home-principal', 'agg');
    var tab = U.tabs('home-principal', [{ key: 'agg', label: '园所概览' }, { key: 'list', label: '个案列表', n: children.length }]);
    var body = t === 'list'
      ? '<div class="card"><div class="card-head"><h3>' + U.icon('archive', 16) + ' 个案列表</h3>' +
        '<span class="desc">聚合为主，不默认展开个案敏感细节</span></div>' +
        '<div class="table-scroll"><table class="table"><thead><tr><th>园内编号</th><th>化名</th><th>班级</th><th>当前阶段</th><th>数据完整度</th><th>IEP 版本</th><th>最近检视</th></tr></thead><tbody>' +
        children.map(function (c) {
          return '<tr><td class="mono">' + U.esc(c.id) + '</td><td>' + U.esc(c.alias) +
            (c.risk ? ' ' + U.badge('需关注', 'r') : '') + '</td><td>' + U.esc(c.cls) + '</td>' +
            '<td>' + U.esc(c.stage) + '</td>' +
            '<td><div style="width:110px">' + U.progress(c.completeness) + '<div class="small muted">' + c.completeness + '%</div></div></td>' +
            '<td>' + U.esc(c.iepVersion) + '</td><td>' + U.esc(c.lastReview) + '</td></tr>';
        }).join('') + '</tbody></table></div></div>'
      : '<div class="grid g4">' +
        U.stat('在园特需儿童', children.length, '名', '融合小/中/大班 + 半融半组') +
        U.stat('IEP 覆盖率', Math.round(withIep / children.length * 100), '%', withIep + '/' + children.length + ' 已有 IEP') +
        U.stat('检视完成率', Math.round(reviewed / children.length * 100), '%', '本月已检视个案') +
        U.stat('待处理风险', risk, '例', '需资源调配 / 外部支持', 'accent-a') +
        '</div>' +
        U.fold('各阶段分布与需要关注的事项', U.panel(
          '· 1 名儿童处于「数据归集」阶段，观察表未回收，建议本周内指派。<br>' +
          '· 1 名儿童标为需关注（高风险转介流程已启动，全程留痕）。<br>' +
          '· 个案敏感细节（评估原始分、医学结论、家庭信息）需逐案授权后展开。'), { tag: '点开查看' });
    return tab + body;
  }

  /* ---------- 家长 ---------- */
  function parentView() {
    var st = R.store.get();
    var t = U.tab('home-parent', 'task');
    var tab = U.tabs('home-parent', [
      { key: 'task', label: '家庭任务', n: R.FAMILY_TASKS.length },
      { key: 'summary', label: '孩子的 IEP 摘要' }
    ]);
    var body = t === 'summary'
      ? (st.doc.parentShared ? R.comp.parentSummary()
        : '<div class="card">' + U.empty('家长版摘要需由融合教师确认后发送，请等待园方通知。') + '</div>')
      : R.comp.familyCard();
    return tab + body +
      U.fold('家长须知', U.panel(
        '家长仅可见自己孩子的内容；其他儿童、园内讨论记录不可见。<br>' +
        '填写的观察表带时间戳与填写人，作为 IEP 依据的一部分，可在「数据归集台」查看已提交内容。'), { tag: '点开查看' });
  }

  /* ---------- 外部专业 ---------- */
  function expertView() {
    var t = U.tab('home-expert', 'note');
    var tab = U.tabs('home-expert', [{ key: 'note', label: '待批注' }, { key: 'meet', label: '会议' }]);
    var body = t === 'meet'
      ? '<div class="card"><div class="card-head"><h3>' + U.icon('meeting', 16) + ' IEP 会议</h3></div>' +
        '<div class="small">2026-11-02 会议已录入纪要，可补充会诊意见。</div>' +
        '<div class="mt8"><button class="btn soft" data-act="goto" data-arg="meeting">去会议调校与审议</button></div></div>'
      : '<div class="card"><div class="card-head"><h3>' + U.icon('goals', 16) + ' 待批注目标</h3></div>' +
        '<div class="small">社交-1：是否同意"看同伴—回应—发起"三段写法作为本学期判定口径？</div>' +
        '<div class="mt8"><button class="btn primary" data-act="goto" data-arg="meeting">去目标审议与批注</button></div></div>';
    return tab + body + U.note('按授权范围临时开放单个案，操作留痕。');
  }

  R.views.home = {
    title: '工作台',
    render: function () {
      var role = R.store.role();
      var st = R.store.get();
      var k = role.key;
      var head = U.pageHead({
        icon: 'home', title: '工作台',
        sub: k === 'parent'
          ? '你好。这里是你孩子这学期的<b>练习重点</b>，和家里能配合的几件小事；看不懂的地方可以直接问老师。'
          : k === 'principal'
            ? '你好，' + U.esc(role.short) + '。这里看<b>全园落实度</b>：建档、审议、检视完成率与到期事项，默认不展开个案敏感细节。'
            : '你好，' + U.esc(role.short) + '。融IEP 把四类数据汇入六维引擎，输出<b>可编辑的 IEP 草案</b> —— AI 只出草案，由 IEP 团队确认后才生效。'
      });

      if (st.risk.flagged && !st.risk.handled) {
        return head + U.hero({
          tone: 'risk', kicker: '高风险识别 · 需优先处理',
          title: '观察中出现高风险表述，已转为转介流程',
          desc: U.esc(st.risk.reason) + '。系统不生成常规目标，改为流程指引（只做流程指引，不做原因判断）。',
          action: '<button class="btn danger lg" data-act="handleRisk">标记为已转介并留痕</button>',
          side: '触发与处理全程留痕。'
        });
      }

      if (k === 'parent') {
        return head + U.hero({
          kicker: st.obsFilled.parent ? '本周配合' : '需要你做的一件事',
          title: st.obsFilled.parent ? '照着家庭任务卡做，并在周末反馈一次'
            : '填写居家观察表（一屏 3–5 题，可分次完成）',
          desc: st.obsFilled.parent
            ? '本轮 ' + R.FAMILY_TASKS.length + ' 个小任务，每个都写了"怎么算成功"。做不完也没关系，如实反馈就是有用的信息。'
            : '系统需要先了解孩子在家的样子，才能给出适合的在家做法 —— 不填表就不会凭空派任务。',
          action: st.obsFilled.parent
            ? '<button class="btn primary lg" data-act="goto" data-arg="track">查看本轮任务</button>'
            : '<button class="btn primary lg" data-act="openObs" data-arg="parent">现在填写（约 3 分钟）</button>'
        }) + parentView();
      }

      if (k === 'principal') {
        return head + U.hero({
          kicker: '本月关注',
          title: 'IEP 覆盖率与检视完成率',
          desc: '园所共 ' + R.CHILDREN.length + ' 名在园特需儿童。合规、资源调配与质量监控在此统一查看。',
          action: '<button class="btn lg" data-act="goto" data-arg="archive">查看个案列表</button>'
        }) + principalView();
      }

      if (k === 'expert') {
        return head + U.hero({
          kicker: '授权范围 · 单一个案',
          title: '审核目标与策略，留下会诊意见',
          desc: '你在授权范围内参与，批注与修改全程留痕，不替代机构康复方案。',
          action: '<button class="btn primary lg" data-act="goto" data-arg="meeting">去目标审议与批注</button>'
        }) + expertView();
      }

      /* 教师（主用户） */
      var s = nextStep();
      var t = U.tab('home-teacher', 'todo');
      var tab = U.tabs('home-teacher', [
        { key: 'todo', label: '待办', n: st.todos.filter(function (x) { return !x.done; }).length },
        { key: 'card', label: '今日支持卡' },
        { key: 'duty', label: '责任分工' },
        { key: 'overview', label: '个案概览' },
        { key: 'term', label: '学期节点' },
        { key: 'log', label: '最近留痕' }
      ]);
      var body = t === 'card' ? '<div class="card">' + R.comp.supportCard() + '</div>'
        : t === 'duty' ? dutyQuick()
        : t === 'overview' ? overviewGrid()
        : t === 'term' ? timeline()
        : t === 'log' ? logList()
        : todoList();

      return head +
        '<div class="hero"><div class="h-k">' + U.esc(s.kicker) + '</div>' +
        '<div class="h-t">' + s.title + '</div>' +
        '<div class="h-d">' + s.desc + '</div>' +
        '<div class="h-act">' + s.btn +
          '<button class="btn lg" data-act="setTab" data-arg="home-teacher" data-arg2="card">看今日支持卡</button>' +
        '</div>' +
        '<div class="h-side">' + s.side + '</div></div>' +
        tab + body;
    }
  };

  R.actions.toggleTodo = function (id) {
    R.store.toggleTodo(id);
    var t = R.store.get().todos.filter(function (x) { return x.id === id; })[0];
    if (t && t.done) R.store.log(R.store.role().short, '完成待办', t.text);
    R.render();
  };
  R.actions.handleRisk = function () {
    R.store.handleRisk();
    R.store.log(R.store.role().short, '风险处理', '已按转介与上报流程处理并留痕');
    U.toast('已记录：风险转介处理完成', 'ok');
    R.render();
  };
  R.actions.goto = function (key) { location.hash = '#/' + key; };

})(window.RIEP);
