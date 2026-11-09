/* ============================================================
   views/meeting.js · IEP 会议调校与审议（草案 → 生效稿）
   一、目标审议（原「目标建议与审议」里的审议动作搬到这里）
   二、会议纪要与建议  三、决议对照  四、家长意见与专家建议
   ============================================================ */
(function (R) {
  'use strict';
  var U = R.ui;

  var ACTION_LABEL = { keep: ['保留', 'g'], modify: ['调整', 'a'], add: ['新增', 'b'], drop: ['删除', 'r'] };

  /* 目标审议：逐条采纳 / 改写 / 降级 / 忽略 */
  function reviewTab() {
    var s = R.engine.goalStats();
    var f = U.tab('goalReview', s.pending > 0 ? 'pending' : 'all');
    var ranked = R.engine.rankedGoals();
    var shown = ranked.filter(function (r) {
      return f === 'all' ? r.g.status !== 'dropped' : r.g.status === f;
    });
    var bar = U.filterBar([
      { ns: 'goalReview', key: 'pending', label: '待审议', n: s.pending, on: f === 'pending' },
      { ns: 'goalReview', key: 'adopted', label: '已采纳', n: s.adopted, on: f === 'adopted' },
      { ns: 'goalReview', key: 'deferred', label: '降级', n: s.deferred, on: f === 'deferred' },
      { ns: 'goalReview', key: 'dropped', label: '已忽略', n: s.dropped, on: f === 'dropped' },
      { ns: 'goalReview', key: 'all', label: '全部', n: s.all, on: f === 'all' }
    ], (s.pending && R.store.role().canEdit
      ? '<button class="btn sm ok" data-act="adoptAll">全部采纳（' + s.pending + ' 条）</button>'
      : ''));
    var tip = '<div class="notice info" style="margin-bottom:12px"><span class="ic">' + U.icon('info', 18) + '</span><div>' +
      '审议在这里做：<b>采纳</b>＝进入成稿；<b>改写</b>＝保留但改表述；<b>降级</b>＝放到学期后段；<b>忽略</b>＝必须写理由。' +
      '每条都能点开看它是从哪个字段推出来的。' +
      (s.pending ? '<b>全部审议完（待审议为 0）后，才能应用决议。</b>' : '<b>已全部审议完毕，可以应用决议了。</b>') +
      '</div></div>';
    var list = shown.length
      ? shown.map(function (r) { return R.goalCard(r, { review: true }); }).join('')
      : '<div class="card">' + U.empty('该分类下暂无目标。') + '</div>';
    return tip + bar + list;
  }

  /* 规则版：只定位"哪条要改 + 依据是哪一句"，不代笔改写
     用维度定位而不是写死编号（同一维度只有一条目标时不带 -1） */
  var RULES = [
    { test: /社交|看同伴|回应|主动邀请/, dom: 'SJ', action: 'modify',
      text: '同伴呼唤或展示玩具时，看向同伴并用眼神、手势或简单词回应，达成≥70%',
      basis: '专家建议"社交目标要落到看同伴—回应—发起的可观察行为"' },
    { test: /前庭|感统|集体活动前/, dom: 'QX', action: 'modify',
      text: '较难任务急躁时，1 次提示下停下并求助；集体活动前先安排 5 分钟前庭本体活动',
      basis: '感统教师建议"先做前庭本体活动再进入集体"' },
    { test: /挑食|进食|吞咽|一样的提醒|家园/, dom: 'ZL', action: 'keep',
      text: '沿用草案：漱口含水吐水，连续 3 次中 2 次；家园统一用"嚼完 5 口再咽"',
      basis: '家长意见：家园用同一套提醒方式' },
    { test: /单脚|平衡|加码/, dom: 'YD', action: 'keep',
      text: '维持"单脚站≥5 秒"，不再加码',
      basis: '小组教师反馈：单脚站已从 3 秒到 4 秒' }
  ];

  function meetingHeader(m) {
    return '<div class="card" style="background:linear-gradient(180deg,#fff8ec,#fff)">' +
      '<div class="card-head"><h3>' + U.icon('meeting', 16) + ' IEP 会议 · ' + U.esc(m.date) + ' · ' + U.esc(m.place) + '</h3>' +
      '<div class="right">' + (m.applied
        ? U.badge('已应用 · 成稿升级为 v2.0', 'g')
        : U.badge('待应用', 'a')) + '</div></div>' +
      '<div class="kv"><b>主持</b><div>' + U.esc(m.host) + '</div>' +
      '<b>参会</b><div>' + m.attend.map(U.esc).join('、') + '</div>' +
      (m.applied ? '<b>应用人</b><div>' + U.esc(m.appliedBy) + '（' + U.esc(m.appliedAt) + '）</div>' : '') +
      '</div></div>';
  }

  function inputCard(m) {
    return '<div class="grid g2">' +
      '<div class="card" style="border-left:4px solid var(--violet)"><div class="card-head"><h3>家长意见</h3></div>' +
      '<div class="small" style="line-height:1.7">' + U.esc(m.parentOpinion) + '</div>' +
      '<div class="small muted mt8">家长诉求纳入候选；与专业判断冲突时以专业判断为准，并在草案中说明理由。</div></div>' +
      '<div class="card" style="border-left:4px solid var(--teal)"><div class="card-head"><h3>专家建议</h3></div>' +
      '<div class="small" style="line-height:1.7">' + U.esc(m.expertOpinion) + '</div>' +
      '<div class="small muted mt8">外部专业按授权范围参与，批注全程留痕。</div></div>' +
      '</div>';
  }

  function minutesCard(m) {
    var adv = (m.advice || {}).adviceText || '';
    return '<div class="card"><div class="card-head"><h3>' + U.icon('doc', 16) + ' 会议纪要 / 大白话建议</h3>' +
      '<span class="desc">整理好的要点可以贴，家长的原话、专家的口头建议也可以贴</span></div>' +
      '<textarea id="minutesText" style="min-height:150px" placeholder="例：班级改成小二班；能力分析里补一句「会自己穿鞋了」；社交这条先别定太高，先把「看同伴—回应」做出来；服务安排里感统课每周 2 次，由感统教师负责；复盘周期改成一个月一次。">' +
      U.esc(m.minutes) + '</textarea>' +
      '<div class="btn-row mt8">' +
      '<button class="btn sm" data-act="saveMinutes">仅保存草稿（不改成稿）</button>' +
      '<button class="btn primary sm" data-act="aiAdvice">' + U.icon('goals', 14) + ' AI 智能解析（推荐，读懂大白话）</button>' +
      '<button class="btn soft sm" data-act="submitAdvice">规则解析（离线可用）</button>' +
      '<button class="btn sm ghost" data-act="aiSettings">AI 设置</button>' +
      '<button class="btn sm ghost" data-act="genDecisions" data-arg="rule">规则版：定位"哪条要改 + 依据是哪一句"</button>' +
      '</div>' +
      '<div class="small muted mt8"><b>AI 智能解析</b>：把纪要原文（自动隐去幼儿姓名、编号、生日）连同成稿可编辑字段清单一起发给大模型，' +
      '由模型判断改哪一块、给出「现在 → 改成什么」，<b>采纳前成稿不动</b>；断网或调用失败时用左边的规则解析，功能不丢。' +
      '规则解析只认关键词，能命中八板块的标准说法。' +
      (adv ? '　上次分析：' + U.esc((m.advice || {}).at || '') + '（结果见下方）' : '') +
      '</div></div>';
  }

  /* 建议解析结果：逐条确认后写回目标与成稿 */
  var KIND_BADGE = {
    criteria: ['通过标准', 'b'], ease: ['降低难度', 'a'], raise: ['提高要求', 'a'],
    strategy: ['支持策略', 't'], home: ['家庭配合', 'v'], freq: ['练习频次', 'b'],
    duty: ['主责分工', 'b'], defer: ['延后', 'gray'], section: ['成稿补充', 'v'],
    caseField: ['基础信息', 'b'], abilityCell: ['能力分析', 't'],
    longGoal: ['长期目标', 'a'], longAdd: ['新增长期目标', 'g'], shortAdd: ['加短期目标', 'g'], shortDrop: ['删短期目标', 'gray']
  };

  /* 板块徽章：让教师一眼看到这条会动成稿的哪一块 */
  function planChip(it) {
    var tag = it.planName || '';
    if (!tag) return '';
    return '<span class="plan-chip">' + U.icon('doc', 11) + ' ' + U.esc(tag) + '</span>';
  }

  /* 「改为」框按内容行数给高度：多段内容一屏看全，不用在小框里滚动 */
  function editRows(t) {
    var s = String(t || '');
    var byLine = s.split(/\n/).length;
    var byWrap = Math.ceil(s.length / 26);
    return Math.max(2, Math.min(10, Math.max(byLine, byWrap)));
  }

  function adviceCard(m) {
    var a = m.advice;
    if (!a) return '';
    var can = R.store.role().canEdit;
    var all = a.items || [];
    var pends = a.pending || [];
    var old = a.unclear || [];            /* 旧存档里的纯文本"没读懂"，兼容读取 */
    var left = all.filter(function (x) { return !x.applied && !x.dismissed; });
    var pleft = pends.filter(function (x) { return !x.applied && !x.dismissed; });
    var plans = {};
    left.concat(pleft).forEach(function (x) { if (x.planName) plans[x.planName] = (plans[x.planName] || 0) + 1; });
    var planLine = Object.keys(plans).length
      ? '　将改动：' + Object.keys(plans).map(function (k) { return k + '（' + plans[k] + '）'; }).join('、')
      : '';
    var head = '<div class="card advice-card"><div class="card-head">' +
      '<h3>' + U.icon('goals', 16) + ' 建议解析结果' +
      (a.source === 'ai' ? ' <span class="plan-chip">AI 解析</span>' : '') + '</h3>' +
      '<span class="desc">可自动落地 ' + all.length + ' 条 · 需你确认 ' + pleft.length + ' 条 · ' + U.esc(a.at) + '</span>' +
      (left.length && can ? '<div class="right"><button class="btn sm ok" data-act="acceptAllAdvice">' +
        U.icon('check', 13) + ' 一键全部写回成稿（' + left.length + '）</button>' +
        '<button class="btn sm ghost" data-act="clearAdvice">清空</button></div>' : '') + '</div>' +
      (planLine ? '<div class="small muted" style="margin:-4px 0 8px">' + U.esc(planLine) + '</div>' : '');

    if (!all.length && !pends.length && !old.length) {
      return head + U.empty('这段话里没读到能对上成稿的内容，可以换个说法再提交（例如"班级改成小二班""能力分析里加一句会自己穿鞋""服务安排每周 3 次感统""复盘周期改成一个月一次"）。') + '</div>';
    }

    var rows = all.map(function (it, i) {
      var kb = KIND_BADGE[it.kind] || ['调整', 'b'];
      var state = it.applied ? U.badge('已写回', 'g') : it.dismissed ? U.badge('已忽略', 'gray') : U.badge('待确认', 'a');
      var where = it.goalId
        ? '<b>' + U.esc(it.goalId) + '</b> · ' + U.esc(R.domainName(it.domain))
        : U.esc(it.secTitle || (it.domain ? R.domainName(it.domain) : ''));
      var sub = it.fieldName ? '<span class="adv-sub">' + (where ? '· ' : '') + U.esc(it.fieldName) + '</span>' : '';
      return '<div class="adv' + (it.applied ? ' done' : it.dismissed ? ' off' : '') + '">' +
        '<div class="adv-h">' + U.badge(kb[0], kb[1]) + planChip(it) +
        '<span class="adv-where">' + where + sub + '</span>' +
        '<span style="margin-left:auto">' + state + '</span></div>' +
        '<div class="adv-q">原话：' + U.esc(it.quote) + '</div>' +
        '<div class="adv-w">' + U.esc(it.why) + '</div>' +
        '<div class="adv-ba"><div><b>现在</b>' + U.esc(String(it.before)) + '</div>' +
        '<div><b>改为</b>' + (it.applied
          ? U.esc(it.after)
          : (String(it.after).length > 26
            ? '<textarea class="adv-edit" rows="' + editRows(it.after) + '" data-i="' + i + '" title="可以直接改，改完再采纳">' + U.esc(it.after) + '</textarea>'
            : '<input class="adv-edit" data-i="' + i + '" value="' + U.esc(it.after) + '" title="可以直接改，改完再采纳">')) +
        '</div></div>' +
        (it.applied && it.result ? '<div class="adv-r">' + U.icon('check', 13) + ' ' + U.esc(it.result) + '</div>' : '') +
        (!it.applied && !it.dismissed && can
          ? '<div class="btn-row mt8"><button class="btn sm ok" data-act="acceptAdvice" data-arg="' + i + '">采纳并写回</button>' +
            '<button class="btn sm" data-act="dismissAdvice" data-arg="' + i + '">忽略</button></div>' : '') +
        '</div>';
    }).join('');

    /* 定位得到、但系统不敢自动改的：也列成卡，写清"卡在哪、打算怎么写"，可改可采纳 */
    var pRows = pends.map(function (it, i) {
      var where = it.goalId
        ? '<b>' + U.esc(it.goalId) + '</b> · ' + U.esc(R.domainName(it.domain))
        : U.esc(it.secTitle || (it.domain ? R.domainName(it.domain) : ''));
      var sub = it.fieldName ? '<span class="adv-sub">' + (where ? '· ' : '') + U.esc(it.fieldName) + '</span>' : '';
      var state = it.applied ? U.badge('已写回', 'g') : it.dismissed ? U.badge('已忽略', 'gray') : U.badge('待你确认', 'a');
      var edit = it.applied
        ? U.esc(it.after)
        : (String(it.after || '').length > 26
          ? '<textarea class="adv-edit pend-edit" rows="3" data-p="' + i + '" placeholder="' +
            U.esc(it.ask || '补一句改成什么') + '" title="可以直接写，写完再点采纳">' + U.esc(it.after || '') + '</textarea>'
          : '<input class="adv-edit pend-edit" data-p="' + i + '" value="' + U.esc(it.after || '') + '" placeholder="' +
            U.esc(it.ask || '补一句改成什么') + '" title="可以直接写，写完再点采纳">');
      return '<div class="adv pend' + (it.applied ? ' done' : it.dismissed ? ' off' : '') + '">' +
        '<div class="adv-h">' + U.badge('需人工确认', 'a') + planChip(it) +
        '<span class="adv-where">' + where + sub + '</span>' +
        '<span style="margin-left:auto">' + state + '</span></div>' +
        '<div class="adv-q">原话：' + U.esc(it.quote) + '</div>' +
        (it.why ? '<div class="adv-w">' + U.esc(it.why) + '</div>' : '') +
        '<div class="adv-ba' + (it.before ? '' : ' one') + '">' +
        (it.before ? '<div><b>现在</b>' + U.esc(String(it.before)) + '</div>' : '') +
        '<div><b>改为</b>' + edit + '</div></div>' +
        (it.applied && it.result ? '<div class="adv-r">' + U.icon('check', 13) + ' ' + U.esc(it.result) + '</div>' : '') +
        (!it.applied && !it.dismissed && can
          ? '<div class="btn-row mt8"><button class="btn sm ok" data-act="acceptPending" data-arg="' + i + '">' +
            (it.after ? '按此写回' : '按我写的写回') + '</button>' +
            '<button class="btn sm" data-act="dismissPending" data-arg="' + i + '">忽略</button></div>' : '') +
        '</div>';
    }).join('');

    var un = old.length
      ? U.fold('早期记录里没读懂的 ' + old.length + ' 句',
        old.map(function (s, i) {
          return '<div class="adv-q">' + U.esc(typeof s === 'string' ? s : (s.quote || s)) +
            (can ? ' <button class="btn sm ghost" data-act="unclearToDoc" data-arg="' + i + '">写进成稿·检视与复审</button>' : '') +
            '</div>';
        }).join(''), { plain: true, tag: '点开查看' })
      : '';

    return head +
      (rows ? '<div class="adv-sec">可直接落地的调整</div>' + rows : '') +
      (pRows ? '<div class="adv-sec">需要你确认的（系统读到了，但不敢替你定）</div>' + pRows +
        '<div class="small muted" style="margin:-2px 0 10px">这几条<b>不会</b>进「一键全部写回」，' +
        '要么在「改为」里把写法定下来再点采纳，要么先忽略。系统能重新写的（比如"能力分析重新写一下"）会先在「改为」里给一版草稿。</div>' : '') +
      un +
      U.note('每条都标了会动成稿的哪一块：<b>基本信息 / 评估分析 / 长期目标 / 短期目标 / 支持策略 / 服务安排 / 家校配合 / 复盘周期</b>。' +
        '「改为」那一栏可以直接点开改，改完再采纳；采纳后成稿对应章节立即重排，全部改动留痕。') + '</div>';
  }

  function suggestCard(m) {
    var sug = m.suggested || [];
    if (!sug.length) return '';
    return '<div class="card" style="border:1px dashed var(--brand)"><div class="card-head"><h3>' + U.icon('goals', 16) + ' 规则版建议决议（待教师逐条确认）</h3></div>' +
      sug.map(function (d, i) {
        var lb = ACTION_LABEL[d.action];
        return '<div class="todo"><div class="box"></div><div class="tx">' +
          '<b>' + U.badge(lb[0], lb[1]) + ' ' + U.esc(d.goalId) + '</b>' +
          '<p>' + U.esc(d.text) + '</p>' +
          '<p>依据：' + U.esc(d.basis) + '</p>' +
          '<div class="mt8"><button class="btn sm ok" data-act="acceptSug" data-arg="' + i + '">采纳为决议</button>' +
          ' <button class="btn sm" data-act="dismissSug" data-arg="' + i + '">忽略</button></div>' +
          '</div></div>';
      }).join('') + '</div>';
  }

  function decisionCard(m) {
    return '<div class="card"><div class="card-head"><h3>' + U.icon('check', 16) + ' 调校对照：一条决议 = 一个目标的前后对照</h3>' +
      '<div class="right">' + (R.store.role().canEdit ? '<button class="btn sm" data-act="addDecision">+ 新增决议</button>' : '') + '</div></div>' +
      (m.decisions.length ? '<table class="table"><thead><tr><th>动作</th><th>目标</th><th>前后对照</th><th></th></tr></thead><tbody>' +
        m.decisions.map(function (d, i) {
          var g = R.store.goal(d.goalId);
          var lb = ACTION_LABEL[d.action];
          return '<tr><td>' + U.badge(lb[0], lb[1]) + '</td>' +
            '<td><b>' + U.esc(d.goalId) + '</b><div class="small muted">' + U.esc(R.domainName(g ? g.domain : '')) + '</div></td>' +
            '<td><div class="small muted">原：' + U.esc(g ? g.text : '—') + '</div>' +
            '<div class="small" style="margin-top:3px"><b>新：</b>' + U.esc(d.text) + '</div>' +
            '<div class="small muted" style="margin-top:3px">依据：' + U.esc(d.basis) + '</div></td>' +
            '<td>' + (R.store.role().canEdit && !m.applied ? '<button class="btn sm ghost" data-act="delDecision" data-arg="' + i + '">删除</button>' : '') + '</td></tr>';
        }).join('') + '</tbody></table>' : '<div class="empty">暂无决议。粘贴纪要后点击"规则版"生成建议，或手动新增。</div>') +
      U.fold('两道防呆', U.panel(
        '① 未经过会议调校的草案，提交团队审核时会被拦截并提示"先完成会议调校"（教师也可显式选择"仍然提交"）。<br>' +
        '② 草案重新生成后，此前已应用的会议自动标记为"需重新调校"，不会假装旧决议仍然生效。'),
      { plain: true, tag: '点开查看' }) +
      '</div>';
  }

  R.actions.newMeeting = function () {
    R.store.createMeeting();
    U.toast('已创建会议记录（' + R.store.meeting().date + '）', 'ok');
    R.render();
  };

  R.views.meeting = {
    title: 'IEP 会议调校与审议',
    render: function () {
      var m = R.store.meeting();
      var s = R.engine.goalStats();
      if (!m) {
        return U.pageHead({
          icon: 'meeting', title: 'IEP 会议调校与审议',
          sub: '目标建议出来后，先在这里<b>审议</b>，再开会议<b>调校</b>，最后出成稿。'
        }) + '<div class="card">' + U.empty('这份档案还没有 IEP 会议记录') +
          '<div class="small muted" style="text-align:center;margin:0 0 14px">' +
          '会议记录挂在档案下：写明时间、参会人、家长意见与专家建议，再逐条确认决议。' +
          '没有会议也可以先出草案，但成稿生效前必须有一次会议记录。</div>' +
          '<div class="center"><button class="btn primary" data-act="newMeeting">创建会议记录</button></div></div>' +
          '<div class="mt14">' + reviewTab() + '</div>';
      }
      var def = m.decisions.length ? 'dec' : (m.suggested && m.suggested.length ? 'rev' : (s.pending ? 'rev' : 'rev'));
      var t = U.tab('meeting', def);
      var tab = U.tabs('meeting', [
        { key: 'rev', label: '① 目标审议', n: s.pending || undefined },
        { key: 'min', label: '② 会议纪要与建议' },
        { key: 'dec', label: '③ 决议对照', n: m.decisions.length || undefined },
        { key: 'in', label: '④ 家长意见与专家建议' }
      ]);
      var body = t === 'rev' ? reviewTab()
        : t === 'dec' ? decisionCard(m)
        : t === 'in' ? inputCard(m)
        : minutesCard(m) + adviceCard(m) + suggestCard(m);

      var reviewed = s.all > 0 && s.pending === 0;
      var canApply = !m.applied && reviewed && (s.adopted > 0 || m.decisions.length > 0);
      var hero = '<div class="hero' + (m.applied ? ' done' : '') + '">' +
        '<div class="h-k">IEP 会议 · ' + U.esc(m.date) + ' · ' + U.esc(m.place) + '</div>' +
        '<div class="h-t">' + (m.applied
          ? '决议已应用，成稿升级为 v2.0'
          : (s.pending ? '先逐条审议 ' + s.pending + ' 条目标建议' : '目标已全部审议完毕，可以应用决议了')) + '</div>' +
        '<div class="h-d">' + (m.applied
          ? '应用人：' + U.esc(m.appliedBy) + '（' + U.esc(m.appliedAt) + '）。共 ' + m.decisions.length + ' 条决议已写回。' +
            '会议纪要与建议仍可继续补充，提交后系统会解析并给出成稿调整项。'
          : '顺序是：<b>审议目标</b>（采纳 / 改写 / 降级 / 忽略）→ 记录纪要与建议 → 会议调校 → 应用决议。' +
            '全部目标审议完成（待审议为 0）后即可应用决议；系统只做结构化与定位，<b>不代笔改写。</b>') + '</div>' +
        '<div class="h-act">' +
          (m.applied
            ? '<button class="btn primary lg" data-act="stepNext" data-arg="meeting-doc">查看完整成稿</button>' +
              '<button class="btn lg" data-act="setTab" data-arg="meeting" data-arg2="min">继续补充纪要与建议</button>'
            : '<button class="btn primary lg" data-act="applyMeeting" ' + (canApply ? '' : 'disabled') + '>' +
              '应用决议（成稿升级 v2.0）</button>' +
              (canApply ? '' : '<span class="small muted">' +
                (s.pending ? '还有 ' + s.pending + ' 条目标待审议（可点「全部采纳」一次性完成）' : '请先审议目标') + '</span>')) +
        '</div>' +
        U.fold('会议基本信息', U.panel(
          '<div class="kv"><b>主持</b><div>' + U.esc(m.host) + '</div>' +
          '<b>参会</b><div>' + m.attend.map(U.esc).join('、') + '</div>' +
          (m.applied ? '<b>应用人</b><div>' + U.esc(m.appliedBy) + '（' + U.esc(m.appliedAt) + '）</div>' : '') +
          '</div>'), { plain: true, tag: '点开查看' }) +
        '</div>';

      return U.pageHead({
        icon: 'meeting', title: 'IEP 会议调校与审议',
        sub: '目标建议出来后，先在这里<b>审议</b>，再开会议<b>调校</b>，最后出成稿。'
      }) + hero + tab + body;
    }
  };

  /* ---------- 动作 ---------- */
  R.actions.saveMinutes = function () {
    var t = document.getElementById('minutesText').value;
    var m = R.store.meeting();
    m.minutes = t;
    R.store.save();
    R.store.log(R.store.role().short, '保存纪要', 'IEP 会议纪要草稿已更新（未分析、未改成稿）');
    U.toast('已存草稿，成稿未改动；要让系统读并改，点左边的「提交建议」', 'warn');
  };

  R.actions.genDecisions = function (mode) {
    var m = R.store.meeting();
    var text = (document.getElementById('minutesText') ? document.getElementById('minutesText').value : m.minutes) || '';
    if (mode === 'model') {
      R.actions.aiAdvice();
      return;
    }
    m.minutes = text;
    var exist = {};
    m.decisions.forEach(function (d) { exist[d.goalId] = 1; });
    var sug = [];
    RULES.forEach(function (r) {
      var g = R.engine.domainGoal(r.dom);
      if (!g || exist[g.id]) return;
      if (r.test.test(text)) sug.push({ goalId: g.id, action: r.action, text: r.text, basis: r.basis });
    });
    m.suggested = sug;
    R.store.save();
    R.store.log('系统', '生成建议决议', '规则版匹配到 ' + sug.length + ' 条待确认决议（不代笔改写）');
    U.toast('规则版已定位 ' + sug.length + ' 条，需教师逐条确认', 'ok');
    R.render();
  };

  R.actions.acceptSug = function (i) {
    var m = R.store.meeting();
    var d = m.suggested[i];
    if (!d) return;
    R.store.addDecision({ goalId: d.goalId, action: d.action, text: d.text, basis: d.basis });
    m.suggested.splice(i, 1);
    R.store.save();
    R.store.log(R.store.role().short, '确认决议', d.goalId + ' · ' + ACTION_LABEL[d.action][0]);
    U.toast('已加入决议清单', 'ok');
    R.render();
  };

  R.actions.dismissSug = function (i) {
    var m = R.store.meeting();
    m.suggested.splice(i, 1);
    R.store.save();
    R.render();
  };

  /* ---------- 会议建议：提交 → 系统分析 → 逐条确认 → 写回成稿 ---------- */
  /* 分析完把页面停在「会议纪要与建议」并滚到结果卡片，
     否则老师提交后看不到下面的调整项，会以为系统没动 */
  function focusAdvice() {
    R.tabState.meeting = 'min';
    R.render();
    var card = document.querySelector('.advice-card');
    if (!card) return;
    var top = card.getBoundingClientRect().top + (window.pageYOffset || 0) - 96;
    try { window.scrollTo({ top: top, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, top); }
  }

  /* 从成稿页「去写回」跳过来：直接落到会议建议那一页并滚到结果卡片 */
  R.actions.gotoAdvice = function () {
    R.tabState.meeting = 'min';
    if (location.hash === '#/meeting') { focusAdvice(); return; }
    location.hash = '#/meeting';
    setTimeout(focusAdvice, 80);
  };

  /* ---------- AI 智能解析（DeepSeek，浏览器直连；失败回退规则解析） ---------- */
  R.actions.aiAdvice = function () {
    var m = R.store.meeting();
    if (!m) { U.toast('还没有会议记录', 'warn'); return; }
    var el = document.getElementById('minutesText');
    var text = (el ? el.value : m.minutes) || '';
    if (text.trim().length < 4) { U.toast('先把会议纪要或建议写进来', 'warn'); return; }
    m.minutes = text;
    R.store.save();
    if (!R.ai.ready()) { U.toast('还没有配置 API Key，点「AI 设置」填写', 'warn'); return; }
    var close = R.ai.mask('AI 正在阅读会议纪要…', [
      '脱敏：幼儿姓名、档案编号、生日不上传',
      '梳理成稿可编辑字段清单',
      '大模型判断：改哪一块、改成什么',
      '生成「现在 → 改为」对照，等你确认'
    ]);
    R.ai.analyze(text, function (res) {
      close();
      m.advice = {
        at: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
        adviceText: text,
        source: 'ai',
        items: res.items || [],
        pending: res.pending || [],
        unclear: []
      };
      R.store.save();
      R.store.log(R.store.role().short, 'AI 解析会议建议',
        '大模型解析出 ' + (res.items || []).length + ' 条可落地调整，' + (res.pending || []).length + ' 条需人工确认');
      U.toast('AI 已解析：' + (res.items || []).length + ' 条可落地，' + (res.pending || []).length + ' 条需你确认',
        ((res.items || []).length || (res.pending || []).length) ? 'ok' : 'warn');
      focusAdvice();
    }, function (err) {
      close();
      U.toast('AI 解析没成功：' + err + '。可先用「规则解析」或稍后重试', 'warn');
      R.store.log(R.store.role().short, 'AI 解析失败', String(err).slice(0, 60));
    });
  };

  R.actions.aiSettings = function () {
    var c = R.ai.cfg();
    U.modal('AI 设置（大模型解析）',
      '<div class="notice info"><span class="ic">' + U.icon('info', 18) + '</span><div>' +
      '会议纪要原文会先<b>自动隐去幼儿姓名、档案编号、生日</b>再发给模型；' +
      '模型只能从成稿可编辑字段清单里挑改动，所有修改仍需你点「采纳」才写回。' +
      '默认接入 DeepSeek 开放平台（platform.deepseek.com），余额不足时到官网充值。</div></div>' +
      '<div class="field"><label>接口地址（OpenAI 兼容）</label><input type="text" id="aiBase" value="' + U.esc(c.baseUrl) + '"></div>' +
      '<div class="field"><label>API Key</label><input type="text" id="aiKey" value="' + U.esc(c.apiKey) + '" placeholder="sk-…"></div>' +
      '<div class="field"><label>模型</label><select id="aiModel">' +
      '<option value="deepseek-flash"' + (c.model === 'deepseek-flash' ? ' selected' : '') + '>deepseek-flash（快，推荐）</option>' +
      '<option value="deepseek-v4-pro"' + (c.model === 'deepseek-v4-pro' ? ' selected' : '') + '>deepseek-v4-pro（更强）</option>' +
      '</select></div>' +
      '<div class="small muted mt8">换成智谱 / 通义千问也可以：接口地址填对应的 OpenAI 兼容地址，Key 和模型名一并替换。</div>',
      [{
        label: '保存', cls: 'primary', onClick: function () {
          R.ai.saveCfg({
            baseUrl: document.getElementById('aiBase').value.trim() || 'https://api.deepseek.com',
            apiKey: document.getElementById('aiKey').value.trim(),
            model: document.getElementById('aiModel').value
          });
          U.closeModal();
          U.toast('AI 设置已保存', 'ok');
        }
      }]);
  };

  R.actions.submitAdvice = function () {
    var m = R.store.meeting();
    if (!m) { U.toast('还没有会议记录', 'warn'); return; }
    var el = document.getElementById('minutesText');
    var text = (el ? el.value : (m.advice || {}).adviceText) || '';
    if (text.trim().length < 4) { U.toast('先把会议纪要或建议写进来', 'warn'); return; }
    m.minutes = text;
    R.store.save();
    U.computing('正在分析会议建议…', [
      '拆句并判断要动成稿哪一块（八板块）', '识别维度与建议意图',
      '定位到具体字段 / 目标 / 章节', '需要重写的先起一版草稿'
    ], function () {
      var res = R.suggest.analyze(text);
      m.advice = {
        at: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
        adviceText: text,
        items: res.items || [],
        pending: res.pending || [],
        unclear: res.unclear || []
      };
      R.store.save();
      var np = (res.pending || []).length;
      R.store.log(R.store.role().short, '提交会议建议',
        '系统解析出 ' + res.items.length + ' 条可落地调整，' + np + ' 条需人工确认');
      U.toast('已解析：' + res.items.length + ' 条可落地，' + np + ' 条需你确认',
        (res.items.length || np) ? 'ok' : 'warn');
      focusAdvice();
    });
  };

  R.actions.acceptAdvice = function (i) {
    if (!R.store.role().canEdit) { U.toast('当前身份无编辑权限', 'warn'); return; }
    var m = R.store.meeting();
    var idx = parseInt(i, 10);
    var it = (m.advice || {}).items[idx];
    if (!it) return;
    /* 「改为」那一栏允许教师现场改，采纳时以改后的为准 */
    var box = document.querySelector('.adv-edit[data-i="' + idx + '"]');
    if (box && box.value.trim()) it.after = box.value.trim();
    var res;
    try { res = R.suggest.apply(it); }
    catch (e) { U.toast('写入失败：' + e.message, 'warn'); return; }
    it.applied = true;
    it.result = res;
    R.store.save();
    R.store.log(R.store.role().short, '采纳会议建议', res);
    U.toast('已写回：' + res, 'ok');
    R.render();
  };

  R.actions.dismissAdvice = function (i) {
    var m = R.store.meeting();
    var it = (m.advice || {}).items[parseInt(i, 10)];
    if (!it) return;
    it.dismissed = true;
    R.store.save();
    R.render();
  };

  /* 「需人工确认」的那几张卡：写法定下来就能写回 */
  R.actions.acceptPending = function (i) {
    if (!R.store.role().canEdit) { U.toast('当前身份无编辑权限', 'warn'); return; }
    var m = R.store.meeting();
    var idx = parseInt(i, 10);
    var it = ((m.advice || {}).pending || [])[idx];
    if (!it) return;
    var box = document.querySelector('.pend-edit[data-p="' + idx + '"]');
    if (box && box.value.trim()) it.after = box.value.trim();
    if (!it.after) {
      U.toast('还差一句：先在「改为」里写下希望成稿怎么写', 'warn');
      if (box) box.focus();
      return;
    }
    var res;
    try { res = R.suggest.apply(it); }
    catch (e) { U.toast('写入失败：' + e.message, 'warn'); return; }
    it.applied = true;
    it.result = res;
    R.store.save();
    R.store.log(R.store.role().short, '采纳会议建议（人工确认）', res);
    U.toast('已写回：' + res, 'ok');
    R.render();
  };

  R.actions.dismissPending = function (i) {
    var m = R.store.meeting();
    var it = ((m.advice || {}).pending || [])[parseInt(i, 10)];
    if (!it) return;
    it.dismissed = true;
    R.store.save();
    R.render();
  };

  R.actions.acceptAllAdvice = function () {
    if (!R.store.role().canEdit) { U.toast('当前身份无编辑权限', 'warn'); return; }
    var m = R.store.meeting();
    var list = ((m.advice || {}).items || []).filter(function (x) { return !x.applied && !x.dismissed; });
    if (!list.length) return;
    U.modal('全部采纳 ' + list.length + ' 条建议',
      '<div class="notice warn"><span class="ic">' + U.icon('alert', 18) + '</span><div>' +
      '将按下面的对照一次性写回目标与成稿；每条都会留痕，写回后仍可逐条改回。' +
      '<br>建议先看一遍"改为"那一栏，确认口径合适再采纳。</div></div>' +
      '<div class="table-scroll"><table class="table compact"><thead><tr><th style="width:150px">会改到</th><th style="width:38%">现在</th><th>改为</th></tr></thead><tbody>' +
      list.map(function (it) {
        var where = (it.planName || '成稿') + (it.goalId ? ' · ' + it.goalId : '') + (it.fieldName ? ' · ' + it.fieldName : '');
        return '<tr><td class="small">' + U.esc(where) + '</td>' +
          '<td class="small muted">' + U.esc(it.before) + '</td>' +
          '<td class="small"><b>' + U.esc(it.after) + '</b></td></tr>';
      }).join('') + '</tbody></table></div>',
      [{
        label: '确认全部采纳', cls: 'primary', onClick: function () {
          var n = 0;
          var all = (m.advice || {}).items || [];
          list.forEach(function (it) {
            var idx = all.indexOf(it);
            var box = document.querySelector('.adv-edit[data-i="' + idx + '"]');
            if (box && box.value.trim()) it.after = box.value.trim();
            try { it.result = R.suggest.apply(it); it.applied = true; n++; } catch (e) { }
          });
          R.store.save();
          R.store.log(R.store.role().short, '批量采纳会议建议', '一次采纳 ' + n + ' 条并写回目标 / 成稿');
          U.closeModal();
          U.toast('已采纳 ' + n + ' 条，成稿已更新', 'ok');
          R.render();
        }
      }]);
  };

  R.actions.clearAdvice = function () {
    var m = R.store.meeting();
    m.advice = null;
    R.store.save();
    R.render();
  };

  /* 没读懂的句子：人工决定写进成稿哪一章 */
  R.actions.unclearToDoc = function (i) {
    if (!R.store.role().canEdit) { U.toast('当前身份无编辑权限', 'warn'); return; }
    var m = R.store.meeting();
    var s = (m.advice || {}).unclear[parseInt(i, 10)];
    if (!s) return;
    var txt = typeof s === 'string' ? s : (s.quote || s.after || '');
    if (!txt) return;
    R.store.pushAddendum('review', txt, '会议建议（人工确认）');
    if (m.advice && m.advice.unclear) m.advice.unclear.splice(parseInt(i, 10), 1);
    R.store.save();
    R.store.log(R.store.role().short, '建议写入成稿', '「' + txt + '」写入第七章 检视与复审');
    U.toast('已写入成稿第七章', 'ok');
    R.render();
  };

  R.actions.delDecision = function (i) {
    R.store.removeDecision(parseInt(i, 10));
    R.store.log(R.store.role().short, '删除决议', '第 ' + (parseInt(i, 10) + 1) + ' 条决议已删除');
    R.render();
  };

  R.actions.addDecision = function () {
    var opts = R.store.get().goals.map(function (g) {
      return '<option value="' + g.id + '">' + g.id + ' · ' + R.domainName(g.domain) + '</option>';
    }).join('');
    U.modal('新增决议',
      '<div class="field"><label>目标</label><select id="dcGoal">' + opts + '</select></div>' +
      '<div class="field"><label>动作</label><select id="dcAct">' +
      '<option value="keep">保留</option><option value="modify" selected>调整</option>' +
      '<option value="add">新增</option><option value="drop">删除</option></select></div>' +
      '<div class="field"><label>会议后的表述</label><textarea id="dcText"></textarea></div>' +
      '<div class="field"><label>依据（来自纪要的哪一句）</label><input type="text" id="dcBasis"></div>',
      [{
        label: '加入决议清单', cls: 'primary', onClick: function () {
          var goalId = document.getElementById('dcGoal').value;
          var action = document.getElementById('dcAct').value;
          var text = document.getElementById('dcText').value.trim();
          var basis = document.getElementById('dcBasis').value.trim();
          if (!text || !basis) { U.toast('请填写表述与依据', 'warn'); return; }
          R.store.addDecision({ goalId: goalId, action: action, text: text, basis: basis });
          R.store.log(R.store.role().short, '新增决议', goalId + ' · ' + ACTION_LABEL[action][0]);
          U.closeModal(); U.toast('已加入'); R.render();
        }
      }]);
  };

  /* 一键把待审议的目标全部采纳（仍需用户确认） */
  R.actions.adoptAll = function () {
    if (!R.store.role().canEdit) { U.toast('当前身份无编辑权限', 'warn'); return; }
    var pend = R.store.get().goals.filter(function (g) { return g.status === 'pending'; });
    if (!pend.length) return;
    U.modal('全部采纳 ' + pend.length + ' 条待审议目标',
      '<div class="notice info"><span class="ic">' + U.icon('info', 18) + '</span><div>' +
      '采纳＝这 ' + pend.length + ' 条目标进入成稿正文。采纳后仍可逐条改写、降级或忽略。</div></div>' +
      '<div class="table-scroll"><table class="table compact"><thead><tr><th style="width:82px">编号</th><th>目标</th></tr></thead><tbody>' +
      pend.map(function (g) {
        return '<tr><td class="nw"><b>' + U.esc(g.id) + '</b></td><td class="small">' + U.esc(g.text) + '</td></tr>';
      }).join('') + '</tbody></table></div>',
      [{
        label: '确认全部采纳', cls: 'primary', onClick: function () {
          pend.forEach(function (g) { R.store.setGoalStatus(g.id, 'adopted'); });
          R.store.log(R.store.role().short, '批量采纳目标', '一次采纳 ' + pend.length + ' 条待审议目标');
          U.closeModal();
          U.toast('已采纳 ' + pend.length + ' 条，可以应用决议了', 'ok');
          R.render();
        }
      }]);
  };

  R.actions.applyMeeting = function () {
    var m = R.store.meeting();
    var s = R.engine.goalStats();
    if (s.pending > 0) { U.toast('还有 ' + s.pending + ' 条目标待审议', 'warn'); return; }
    if (!s.adopted && !m.decisions.length) { U.toast('还没有已采纳的目标或决议', 'warn'); return; }
    U.confirmStep({
      title: '确认应用会议决议',
      kicker: '第 4 步 会议调校 → 成稿升级',
      lead: '<div class="notice info"><span class="ic">' + U.icon('info', 18) + '</span><div>' +
        '应用后：决议写回目标（保留 / 调整 / 新增 / 删除），已采纳目标进入成稿正文，' +
        '成稿版本由 <b>' + U.esc(R.store.get().doc.version) + '</b> 升级为 <b>v2.0</b>。</div></div>',
      checks: [
        { k: '目标审议：全部完成', v: '已采纳 ' + s.adopted + ' 条 · 降级 ' + s.deferred + ' 条 · 忽略 ' + s.dropped + ' 条', state: 'ok' },
        { k: '会议决议 ' + m.decisions.length + ' 条', v: m.decisions.length ? '将按"保留 / 调整 / 新增 / 删除"写回目标' : '本轮没有额外决议，直接按已审议结果成稿', state: m.decisions.length ? 'ok' : 'warn' }
      ],
      tip: '<div class="check on" style="margin-top:10px"><input type="checkbox" id="apChk" checked>' +
        '<div><div class="lb">我已逐条确认上述决议</div>' +
        '<div class="sub">改什么、改到什么程度，由 IEP 团队决定，系统只做记录</div></div></div>',
      okText: '确认应用决议',
      calcTitle: '正在应用决议并生成成稿…',
      calcSteps: ['写回决议（保留 / 调整 / 新增 / 删除）', '升级成稿版本至 v2.0', '重新装配七章正文', '记录留痕'],
      before: function () {
        var c = document.getElementById('apChk');
        if (!c || !c.checked) { U.toast('请先勾选"我已逐条确认"', 'warn'); return false; }
        return true;
      },
      onOk: function () {
        R.store.applyMeeting();
        R.store.log('融合教师', '应用会议决议', 'IEP 会议决议已写回目标，成稿升级为 v2.0');
        U.toast('决议已应用，成稿升级为 v2.0', 'ok');
        if (R.render) R.render();
        U.modal('决议已应用',
          '<div class="notice ok"><span class="ic">' + U.icon('check', 18) + '</span><div>' +
          '成稿已升级为 <b>v2.0</b>，' + R.engine.docByDomain().groups.length + ' 个领域、' +
          R.store.get().goals.filter(function (g) { return g.status === 'adopted'; }).length + ' 条已采纳目标已写入正文。</div></div>' +
          '<div class="small muted mt8">之后仍可回到「② 会议纪要与建议」补充内容：提交后系统会解析并给出成稿调整项，确认即写回。</div>',
          [{
            label: '查看完整成稿', cls: 'primary', onClick: function () {
              U.closeModal();
              location.hash = '#/doc';
            }
          }]);
      }
    });
  };

})(window.RIEP);
