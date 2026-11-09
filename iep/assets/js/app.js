/* ============================================================
   app.js · 路由与外壳
   ============================================================ */
(function (R) {
  'use strict';

  var U = R.ui;

  R.views = R.views || {};

  var NAV = [
    { key: 'home', name: '工作台', icon: 'home', group: '日常' },
    { key: 'archive', name: '儿童档案', icon: 'archive', group: '日常' },
    { key: 'intake', name: '数据归集台', icon: 'intake', group: 'IEP 流程' },
    { key: 'profile', name: '跨源能力画像', icon: 'profile', group: 'IEP 流程' },
    { key: 'goals', name: '目标建议', icon: 'goals', group: 'IEP 流程' },
    { key: 'meeting', name: 'IEP 会议调校与审议', icon: 'meeting', group: 'IEP 流程' },
    { key: 'doc', name: '成稿与导出', icon: 'doc', group: 'IEP 流程' },
    { key: 'track', name: '进度追踪与复审', icon: 'track', group: 'IEP 流程' },
    { key: 'settings', name: '合规与设置', icon: 'shield', group: '治理' }
  ];
  R.NAV = NAV;

  var current = 'home';

  function hashKey() {
    var h = (location.hash || '').replace('#/', '');
    return (h.split('/')[0]) || 'home';
  }

  /* 家长端不用内部术语：同一入口换一套生活化叫法 */
  var NAV_ALIAS = { parent: { intake: '材料与观察', doc: '孩子的 IEP', archive: '孩子的资料' } };

  function buildNav() {
    var role = R.store.role();
    var nav = document.getElementById('nav');
    var html = '';
    var lastGroup = '';
    NAV.forEach(function (n) {
      if (role.nav.indexOf(n.key) < 0) return;
      if (n.group !== lastGroup) { html += '<div class="nav-group">' + n.group + '</div>'; lastGroup = n.group; }
      var dot = '';
      if (role.canEdit && n.key === 'meeting') {
        var s = R.engine.goalStats();
        dot = '<span class="dot">' + s.pending + '</span>';
      }
      if (role.canEdit && n.key === 'intake') {
        var g = R.engine.gaps().length;
        if (g) dot = '<span class="dot">' + g + '</span>';
      }
      var label = (NAV_ALIAS[role.key] && NAV_ALIAS[role.key][n.key]) || n.name;
      html += '<div class="nav-item' + (n.key === current ? ' active' : '') + '" data-nav="' + n.key + '">' +
        U.icon(n.icon, 18) + '<span>' + label + '</span>' + dot + '</div>';
    });
    nav.innerHTML = html;
    Array.prototype.forEach.call(nav.querySelectorAll('.nav-item'), function (it) {
      it.onclick = function () { location.hash = '#/' + it.getAttribute('data-nav'); };
    });
  }

  function buildRoleSelect() {
    var sel = document.getElementById('roleSelect');
    var st = R.store.get();
    sel.innerHTML = R.ROLES.map(function (r) {
      return '<option value="' + r.key + '"' + (r.key === st.role ? ' selected' : '') + '>' + U.esc(r.name) + '</option>';
    }).join('');
    sel.onchange = function () {
      R.store.setRole(sel.value);
      var role = R.store.role();
      R.store.log(role.short, '切换身份', '以「' + role.name + '」身份进入系统');
      U.toast('已切换为：' + role.name);
      if (role.nav.indexOf(current) < 0) location.hash = '#/home';
      else render();
    };
  }

  function render() {
    var key = hashKey();
    var role = R.store.role();
    if (role.nav.indexOf(key) < 0) { key = 'home'; }
    current = key;
    /* 有数据但还没有目标时，先按已入档数据生成候选目标（全部待审议）；
       材料补传后，只要教师还没动过这些建议，就跟着一起更新 */
    if (R.gen && R.gen.auto && R.gen.auto()) {
      U.toast('目标建议已按最新数据更新：' + R.store.get().goals.length + ' 条，待审议', 'ok');
    }
    var v = R.views[key];
    var view = document.getElementById('view');
    if (!v) { view.innerHTML = U.empty('页面不存在'); return; }

    var navItem = NAV.filter(function (n) { return n.key === key; })[0] || NAV[0];
    document.getElementById('crumbMain').textContent =
      (NAV_ALIAS[role.key] && NAV_ALIAS[role.key][navItem.key]) || navItem.name;
    document.getElementById('crumbSub').textContent = role.key === 'parent'
      ? R.CASE.alias + ' · ' + R.CASE.age + ' · ' + R.CASE.cls
      : R.CASE.alias + ' · ' + R.CASE.age + ' · ' + R.CASE.cls + ' · 园内编号 ' + R.CASE.id;

    var st = R.store.get();
    var pill = document.getElementById('casePill');
    if (role.key === 'parent') {
      pill.textContent = st.doc.parentShared ? '老师已确认 · 可查看' : '等待老师确认';
      pill.title = R.CASE.alias + ' · ' + R.CASE.cls;
    } else {
      pill.textContent = 'IEP ' + st.doc.version + ' · ' + (st.doc.status === 'effective' ? '已生效' : '草案');
      pill.title = '当前阶段：' + R.CASE.stage + ' · ' + R.CASE.alias + ' · ' + R.CASE.cls;
    }
    var av = document.querySelector('.avatar');
    if (av) av.textContent = role.initial;

    view.innerHTML = v.render();
    if (v.mount) v.mount();

    buildNav();
    buildRoleSelect();
    window.scrollTo(0, 0);
  }

  R.render = render;

  /* ============================================================
     流程确认：数据归集 → 画像 → 目标审议 → 会议调校 → 应用决议 → 成稿
     每一步都要用户先确认，再显示"正在分析计算"，最后才跳转
     ============================================================ */
  R.actions.stepNext = function (key) {
    var st = R.store.get();
    var s = R.engine.goalStats();
    var comp = R.engine.completeness();
    var conf = R.engine.confidence();
    var missObs = R.OBS_ORDER.filter(function (k) { return !st.obsFilled[k]; });
    var m = st.meetings[st.meetings.length - 1];
    var repN = ['medical', 'pep3', 'vbmapp', 'sensory'].filter(function (k) { return !!R.store.report(k); }).length;
    var prof = R.engine.profile();
    var profN = prof.filter(function (d) { return typeof d.score === 'number' && d.score; }).length;
    var F = {};

    F['intake-profile'] = {
      to: 'profile',
      title: '确认进入「跨源能力画像」',
      kicker: '第 1 步 数据归集 → 第 2 步 能力画像',
      lead: U.notice('info', 'info',
        '即将按已入档的数据计算六维能力指数。<b>只使用已经确认过的字段</b>；' +
        '没有数据的指标不参与，权重按比例摊给其余项，绝不凭空给分。'),
      checks: [
        { k: '已解析报告 ' + repN + ' / 4 份', v: repN >= 4 ? '医学诊断、PEP-3、VB-MAPP、感统齐备' : '还可在「数据归集台」补传', state: repN >= 4 ? 'ok' : repN ? 'warn' : 'no' },
        { k: '观察表 ' + (R.OBS_ORDER.length - missObs.length) + ' / ' + R.OBS_ORDER.length + ' 张', v: missObs.length ? '缺「' + missObs.map(function (k) { return R.OBS_TYPES[k].short; }).join('」「') + '」' : '小组班 / 融合班 / 家长三张都已回收', state: missObs.length ? 'warn' : 'ok' },
        { k: '数据完整度 ' + comp + '% · 置信度「' + conf.lv + '」', v: conf.tip, state: comp >= 85 ? 'ok' : comp > 0 ? 'warn' : 'no' }
      ],
      tip: U.panel('这一步会做什么：读取已入档字段 → 按六维映射把四套报告的语言对齐 → 加权算出 6 个能力指数 → 生成可展开的依据链。<b>算完仍可回数据归集台补材料，指数会重算。</b>'),
      calcTitle: '正在跨源分析计算…',
      calcSteps: ['读取已入档字段（医学 / PEP-3 / VB-MAPP / 感统 / 三张观察表）',
        '按六维映射对齐四套语言', '加权计算 6 个能力指数', '生成依据链与缺口清单']
    };

    F['profile-goals'] = {
      to: 'goals',
      title: '确认进入「目标建议」',
      kicker: '第 2 步 能力画像 → 第 3 步 目标审议',
      lead: U.notice('info', 'info',
        '即将按六个维度的<b>缺口大小</b>与六因子权重排出目标建议。每条都带长期目标、短期目标、两套策略与可展开的依据。'),
      checks: [
        { k: '可推算的维度 ' + profN + ' / 6', v: profN === 6 ? '六个维度都有数据支撑' : '部分维度缺数据，相关目标会标注"待观察确认"', state: profN === 6 ? 'ok' : profN ? 'warn' : 'no' },
        { k: '候选目标 ' + s.all + ' 条', v: '已采纳 ' + s.adopted + ' · 待审议 ' + s.pending + ' · 降级 ' + s.deferred, state: s.all ? 'ok' : 'no' }
      ],
      tip: U.panel('所有建议默认<b>「待审议」</b>，未经教师确认不得作为正式 IEP 使用。'),
      calcTitle: '正在按维度缺口生成目标建议…',
      calcSteps: ['取六维指数与学期目标差值', '计算六因子权重得分', '匹配最弱项选目标写法', '生成长期 / 短期目标与双策略']
    };

    F['goals-meeting'] = {
      to: 'meeting',
      title: '确认进入「IEP 会议调校与审议」',
      kicker: '第 3 步 目标审议 → 第 4 步 会议调校',
      lead: U.notice('info', 'info',
        '即将进入审议：逐条<b>采纳 / 改写 / 降级 / 忽略</b>。审议动作留痕，改什么、改到什么程度由 IEP 团队决定。'),
      checks: [
        { k: '待审议 ' + s.pending + ' 条', v: s.pending ? '需要逐条确认后才能应用决议' : '全部目标已审议完毕', state: s.pending ? 'warn' : 'ok' },
        { k: '已采纳 ' + s.adopted + ' 条', v: '已采纳的会进入成稿正文', state: s.adopted ? 'ok' : 'no' }
      ],
      tip: U.panel('会议纪要与建议可以后补：填完提交后系统会解析建议并给出成稿调整项，逐条确认后写回成稿。'),
      calcTitle: '正在汇总审议清单…',
      calcSteps: ['读取目标与优先级', '按状态分类（待审议 / 已采纳 / 降级 / 忽略）', '准备会议记录']
    };

    F['meeting-doc'] = {
      to: 'doc',
      title: '确认查看完整成稿',
      kicker: '第 4 步 会议调校 → 第 5 步 成稿与导出',
      lead: U.notice('info', 'info',
        '即将按七章结构生成 IEP 成稿；未生效的导出会标注「草案」。'),
      checks: [
        { k: '成稿版本 ' + st.doc.version, v: m && m.applied ? '会议决议已应用' : '尚未应用会议决议', state: m && m.applied ? 'ok' : 'warn' },
        { k: '纳入学期目标 ' + R.engine.docByDomain().groups.reduce(function (a, g) { return a + g.goals.length; }, 0) + ' 条',
          v: '覆盖 ' + R.engine.docByDomain().groups.length + ' 个领域', state: 'ok' },
        { k: '状态：' + (st.doc.status === 'effective' ? '已生效' : '草案'), v: st.doc.status === 'effective' ? '可导出正式文档' : '导出前需走完生效确认', state: st.doc.status === 'effective' ? 'ok' : 'warn' }
      ],
      tip: U.panel('七章：基础信息 / 能力分析 / 长期目标 / 短期目标与策略 / 支持服务与责任分工 / 家长协作 / 检视复审。'),
      calcTitle: '正在生成 IEP 成稿…',
      calcSteps: ['装配七章结构', '写入学期目标与短期目标', '写入责任分工与频次', '合并会议补充段落']
    };

    var o = F[key];
    if (!o) { location.hash = '#/home'; return; }
    o.okText = o.okText || '确认，开始计算';
    U.confirmStep(o);
  };

  /* ---------- 全局动作 ---------- */
  R.actions.evidence = function (arg) {
    // arg: 逗号分隔的 evidence id
    var ids = (arg || '').split(',');
    U.drawer('依据溯源 · 共 ' + ids.length + ' 条证据', U.evidenceList(ids));
  };

  R.actions.openDrawer = function (arg) {
    if (arg === 'mapping') {
      var rows = R.MAPPING.map(function (m) {
        return '<div class="card tight" style="margin-bottom:10px">' +
          '<div style="font-weight:700;margin-bottom:6px">' + U.esc(R.domainName(m.code)) + '</div>' +
          '<div class="kv">' +
          '<b>VB-MAPP</b><div>' + U.esc(m.vbmapp) + '</div>' +
          '<b>PEP-3</b><div>' + U.esc(m.pep3) + '</div>' +
          '<b>感觉统合</b><div>' + U.esc(m.sensory) + '</div>' +
          '<b>观察记录</b><div>' + U.esc(m.observe) + '</div>' +
          '</div></div>';
      }).join('');
      U.drawer('跨源能力域对齐映射表', rows);
    }
  };

  /* ---------- 启动 ---------- */
  function boot() {
    U.bindActions();
    document.getElementById('drawerClose').onclick = U.closeDrawer;
    document.getElementById('drawerMask').onclick = U.closeDrawer;
    document.getElementById('modalClose').onclick = U.closeModal;
    document.getElementById('modalMask').onclick = function (e) {
      if (e.target.id === 'modalMask') U.closeModal();
    };
    document.getElementById('toggleSidebar').onclick = function () {
      document.getElementById('sidebar').classList.toggle('show');
    };
    window.addEventListener('hashchange', function () {
      render();
      if (R.store && R.store.fetchFromBackend) {
        R.store.fetchFromBackend(null, function () { render(); });
      }
    });
    if (!location.hash) location.hash = '#/home';
    render();
    if (R.store && R.store.fetchFromBackend) {
      R.store.fetchFromBackend(null, function () { render(); });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})(window.RIEP);
