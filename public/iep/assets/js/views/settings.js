/* ============================================================
   views/settings.js · 合规与设置
   ============================================================ */
(function (R) {
  'use strict';
  var U = R.ui;

  var PERM = [
    { role: '教师（主用户）', need: '快速拿到靠谱的草案，少做誊抄，多留时间做专业判断',
      act: '建档、上传材料、填报观察、审议目标、召集会议、按月检视、确认生效',
      perm: '可查看与编辑全部数据；负责确认生效' },
    { role: '园长 / 保教主任', need: '合规、资源调配、质量监控',
      act: '查看 IEP 覆盖率与检视完成率、审批外部支持与课时安排',
      perm: '聚合视图为主，不默认展开个案敏感细节' },
    { role: '家长', need: '孩子被理解、被支持；知道在家能做什么',
      act: '填写居家观察、确认目标、领取家庭任务卡、反馈',
      perm: '仅见自己孩子；不可见其他儿童与内部讨论记录' },
    { role: '外部专业（巡回 / 康复师 / 医生）', need: '专业建议被准确落地',
      act: '审核目标与策略、批注、提供会诊意见',
      perm: '按授权范围临时开放单个案；操作留痕' }
  ];

  var ROADMAP = [
    { p: 'P0 · 跑通单点', s: '最小可用',
      d: '单一个案、PEP-3 + VB-MAPP 两类评估输入；人工审核流；Word 导出',
      v: '能生成一份含 6 个维度、带依据溯源的 IEP 草案；能在会议上直接使用',
      c: '选定 1–2 所示范园；确定评估报告的解析模板；教师确认流程走通' },
    { p: 'P1 · 四源打通', s: '完整闭环',
      d: '用户上传的四类报告全部可解析入档；跨源能力画像（六维雷达图）；长期 / 短期目标分层；月度检视与干预前后对比',
      v: '完整闭环：建档 → 生成 → 会议 → 执行 → 月度检视 → 学期复审',
      c: '园内表单与家长端上线；权重与策略库可由园所配置' },
    { p: 'P2 · 规模化', s: '区域协作',
      d: '多儿童批量管理；与机构康复计划对齐；区域资源中心与巡回指导协作；成效分析',
      v: '区域级 IEP 数据看板；跨园协作与专家会诊支持',
      c: '数据合规与权限体系通过园所 / 区域审查' }
  ];

  var METRICS = [
    { d: '效率', i: '教师准备一份 IEP 草案所需时间', m: '使用前后对照计时' },
    { d: '质量', i: '草案目标被教师直接采纳或小幅修改的比例', m: '系统内采纳率统计' },
    { d: '规范性', i: '目标中"可观察行为 + 通过标准"齐备的比例', m: '规则校验 + 抽样人工复核' },
    { d: '执行度', i: '月度检视按时完成率、五类教师分工执行情况', m: '系统记录 + 教师访谈' },
    { d: '成效', i: '六维指数干预前后变化、学期目标达成率', m: '基线 / 期中 / 期末同口径复测' },
    { d: '体验', i: '家长对 IEP 过程与家庭任务的认可度', m: '家长问卷与访谈' }
  ];

  function redLines() {
    return '<div class="card"><div class="card-head"><h3>' + U.icon('shield', 16) + ' 三条不可越界的红线</h3></div>' +
      R.RED_LINES.map(function (r) {
        return '<div class="todo"><div class="box on"></div><div class="tx"><b>' + U.esc(r.t) + '</b><p>' + U.esc(r.d) + '</p></div></div>';
      }).join('') +
      '<div class="divider"></div>' +
      '<h4 style="font-size:13px;margin-bottom:6px">高风险识别与转介</h4>' +
      '<ul style="padding-left:20px;font-size:12.5px">' + R.RISK_RULES.map(function (r) {
        return '<li>' + U.esc(r) + '</li>'; }).join('') + '</ul>' +
      U.note('另外：能力指数只用于同一儿童的时间序列比较，不做儿童之间的横向排名，也不作为安置或分班依据。') +
      '</div>';
  }

  /* ---------- 责任分工 ---------- */
  function dutyCards() {
    return '<div class="grid g2">' + R.DUTY.map(function (d) {
      return '<div class="duty-card">' +
        '<h4>' + U.esc(d.name) + ' ' + U.badge(d.tag, d.key === 'fusion' ? 'b' : 'outline') + '</h4>' +
        '<div class="scope">负责范围：' + U.esc(d.scope) + '</div>' +
        '<ul>' + d.duty.map(function (x) { return '<li>' + U.esc(x) + '</li>'; }).join('') + '</ul>' +
        '<div class="freq">' + U.icon('track', 13) + ' ' + U.esc(d.freq) + '</div>' +
        '<div class="hand">交付：' + U.esc(d.handover) + '</div>' +
        '</div>';
    }).join('') + '</div>' +
      U.fold('为什么要把"教师"拆成五个角色', U.panel(
        '一个孩子的一周，实际是在五个场所被五个人带的：小组课、融合班、一对一密训、感统室、家里。' +
        '如果目标只写在"教师"名下，结果就是每条目标都有人"知道"，但没人"负责"。<br>' +
        '所以系统里 <b>登录身份</b>只有一个"教师"（便于一个人管全流程），但 <b>目标与策略的责任分工</b>必须落到五类教师上：' +
        '谁上课、谁记录、谁泛化、谁给环境支持，写清楚才不会在月末互相等。'),
        { plain: true, tag: '点开查看' });
  }

  function permTable() {
    return '<div class="card"><div class="card-head"><h3>' + U.icon('meeting', 16) + ' 登录身份与权限</h3>' +
      '<span class="desc">儿童数据最小化与权限分级；档案与操作留痕</span></div>' +
      '<table class="table"><thead><tr><th>身份</th><th>核心诉求</th><th>系统内的关键动作</th><th>权限要点</th></tr></thead><tbody>' +
      PERM.map(function (p) {
        return '<tr><td><b>' + U.esc(p.role) + '</b></td><td class="small">' + U.esc(p.need) + '</td>' +
          '<td class="small">' + U.esc(p.act) + '</td><td class="small">' + U.esc(p.perm) + '</td></tr>';
      }).join('') + '</tbody></table>' +
      U.note('资源教师与班级教师已合并为一个"教师"身份：一个人既能填报观察，也能审议目标与确认生效，避免两个账号互相等。') +
      '</div>';
  }

  function weightCard() {
    var st = R.store.get();
    return '<div class="card"><div class="card-head"><h3>' + U.icon('settings', 16) + ' 校本口径：权重与策略库</h3>' +
      '<span class="desc">每个因子可开关、可调权重，并记录"谁在什么时候改过"</span></div>' +
      '<table class="table compact"><thead><tr><th>因子</th><th>方向</th><th>取值口径</th><th>当前权重</th><th>状态</th></tr></thead><tbody>' +
      R.FACTORS.map(function (f) {
        return '<tr><td><b>' + U.esc(f.name) + '</b></td><td>' + (f.sign > 0 ? U.badge('正向', 'g') : U.badge('负向', 'r')) + '</td>' +
          '<td class="small">' + U.esc(f.desc) + '</td>' +
          '<td>×' + st.weights[f.key] + '</td>' +
          '<td>' + (st.enabled[f.key] !== false ? U.badge('启用', 'g') : U.badge('已关闭', 'gray')) + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '<div class="btn-row mt8"><button class="btn sm" data-act="resetWeights">恢复产品默认值</button>' +
      '<button class="btn sm" data-act="goto" data-arg="goals">在目标审议页调整</button></div>' +
      '<div class="divider"></div>' +
      '<h4 style="font-size:13px;margin-bottom:6px">策略库（可勾选清单，按目标自动推荐）</h4>' +
      '<div>' + Object.keys(R.STRATEGY_LIB).map(function (k) {
        var g = R.STRATEGY_LIB[k];
        return '<div class="small" style="margin-bottom:6px"><b>' + U.esc(g.name) + '：</b>' +
          g.items.map(function (i) { return '<span class="chip">' + U.esc(i) + '</span>'; }).join('') + '</div>';
      }).join('') + '</div>' +
      '</div>';
  }

  function logCard() {
    var st = R.store.get();
    return '<div class="card"><div class="card-head"><h3>' + U.icon('doc', 16) + ' 操作留痕</h3>' +
      '<span class="desc">每条 AI 建议都可被改写、删除或忽略，且记录"由谁、何时、为何修改"</span>' +
      '<div class="right"><button class="btn sm" data-act="exportLogs">导出留痕</button></div></div>' +
      '<div class="table-scroll"><table class="table compact"><thead><tr><th>时间</th><th>操作人</th><th>动作</th><th>详情</th></tr></thead><tbody>' +
      st.logs.map(function (l) {
        return '<tr><td class="mono small">' + U.esc(l.t) + '</td><td>' + U.esc(l.who) + '</td>' +
          '<td>' + U.esc(l.act) + '</td><td class="small">' + U.esc(l.detail) + '</td></tr>';
      }).join('') + '</tbody></table></div></div>';
  }

  function aboutCard() {
    return '<div class="card"><div class="card-head"><h3>' + U.icon('info', 16) + ' 落地路线与验收</h3></div>' +
      '<div class="table-scroll"><table class="table compact"><thead><tr><th>阶段</th><th>范围</th><th>关键交付</th><th>验收</th><th>先决条件</th></tr></thead><tbody>' +
      ROADMAP.map(function (r) {
        return '<tr><td><b>' + U.esc(r.p) + '</b><div class="small muted">' + U.esc(r.s) + '</div></td>' +
          '<td class="small">' + U.esc(r.d) + '</td><td class="small">' + U.esc(r.v) + '</td>' +
          '<td class="small">' + U.esc(r.c) + '</td><td></td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="divider"></div>' +
      '<h4 style="font-size:13px;margin-bottom:6px">验收指标（设计目标，需实测验证）</h4>' +
      '<table class="table compact"><thead><tr><th>维度</th><th>指标</th><th>观测方式</th></tr></thead><tbody>' +
      METRICS.map(function (m) {
        return '<tr><td>' + U.esc(m.d) + '</td><td class="small">' + U.esc(m.i) + '</td><td class="small">' + U.esc(m.m) + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '<div class="small muted mt8">指标不预设目标值。建议先在示范园采集一个学期的基线数据，再据此设定目标。</div>' +
      '</div>';
  }

  function dataCard() {
    return '<div class="card"><div class="card-head"><h3>' + U.icon('archive', 16) + ' 数据管理</h3>' +
      '<span class="desc">本原型数据保存在浏览器本地（localStorage），不上传服务器</span></div>' +
      '<div class="btn-row">' +
      '<button class="btn" data-act="exportState">导出全量数据（JSON）</button>' +
      '<button class="btn" data-act="importState">导入全量数据（JSON）</button>' +
      '<button class="btn danger" data-act="resetState">重置为演示初始状态</button>' +
      '</div>' +
      '<div class="divider"></div>' +
      '<div class="notice info" style="margin-bottom:8px"><span class="ic">' + U.icon('info', 18) + '</span><div>' +
      '<b>换电脑 / 换浏览器时，数据不会跟着网页文件走。</b>所有档案、上传解析的报告（含医学诊断）、' +
      '目标与成稿都存在这台电脑这个浏览器的本地存储里。要在另一台电脑继续用：' +
      '先在这里「导出全量数据」，拷贝 JSON 文件过去，再在那台电脑打开系统点「导入全量数据」。</div></div>' +
      '<div class="small muted">本产品定位为「融 AI 平台」的 IEP 中心模块，复用学生档案、评估管理与报告能力；' +
      '新增的是四源数据解析 + 六维融合引擎 + 目标审议流。儿童档案为唯一主键：评估报告、观察记录、IEP 版本、会议纪要与月度检视都挂在同一档案下，' +
      '左侧下拉切换档案即切换整套数据（当前 ' + R.store.cases().length + ' 份在库）。</div>' +
      '</div>';
  }

  R.views.settings = {
    title: '合规与设置',
    render: function () {
      var st = R.store.get();
      var t = U.tab('settings', 'duty');
      var tab = U.tabs('settings', [
        { key: 'duty', label: '责任分工', n: R.DUTY.length },
        { key: 'rule', label: '合规红线' },
        { key: 'perm', label: '身份与权限' },
        { key: 'weight', label: '校本口径' },
        { key: 'log', label: '操作留痕', n: st.logs.length },
        { key: 'road', label: '落地路线' },
        { key: 'data', label: '数据管理' }
      ]);
      var body = t === 'rule' ? redLines()
        : t === 'perm' ? permTable()
        : t === 'weight' ? weightCard()
        : t === 'log' ? logCard()
        : t === 'road' ? aboutCard()
        : t === 'data' ? dataCard()
        : dutyCards();

      return U.pageHead({
        icon: 'shield', title: '安全、伦理与合规',
        sub: '责任分工 · 医疗边界 · 高风险识别与转介 · 儿童数据保护 · 人的决定权 · 反标签化。'
      }) + tab + body;
    }
  };

  R.actions.exportLogs = function () {
    var st = R.store.get();
    var rows = st.logs.map(function (l) { return l.t + '\t' + l.who + '\t' + l.act + '\t' + l.detail; }).join('\n');
    R.util.download('操作留痕_' + R.CASE.id + '.txt', '时间\t操作人\t动作\t详情\n' + rows, 'text/plain');
    U.toast('留痕已导出', 'ok');
  };

  R.actions.exportState = function () {
    var snap = JSON.parse(JSON.stringify(R.store.get()));
    snap.savedAt = new Date().toISOString();
    var json = JSON.stringify(snap, null, 2);
    R.util.download('rongiep_state_' + new Date().toISOString().slice(0, 10) + '.json', json, 'application/json');
    U.toast('全量数据已导出，换电脑时用「导入全量数据」装回', 'ok');
  };

  /* 跨电脑迁移：读入「导出全量数据」生成的 JSON → 校验 → 确认覆盖 → 刷新生效 */
  R.actions.importState = function () {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json,application/json';
    inp.onchange = function () {
      var f = inp.files && inp.files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        var obj = null;
        try { obj = JSON.parse(rd.result); } catch (e) { }
        var res = obj ? R.store.checkImport(obj) : null;
        if (!res || !res.ok) {
          U.notice('err', 'alert', '<b>导入失败</b>：' + U.esc(res && res.msg || '这个文件不是合法的 JSON。请选择「导出全量数据」生成的 rongiep_state_日期.json'));
          return;
        }
        var curN = R.store.cases().length;
        var names = res.names.map(function (n) { return U.esc(n); }).join('、');
        U.modal('导入全量数据',
          '<div class="notice warn"><span class="ic">' + U.icon('alert', 18) + '</span><div>' +
          '将用文件里的 <b>' + res.n + '</b> 份档案（' + names + '）<b>替换</b>本机现有的 ' + curN + ' 份档案与全部改动' +
          '（含已上传解析的医学诊断、目标、会议与成稿）。此操作不可撤销，建议先在本机「导出全量数据」留底。</div></div>' +
          (res.exportedAt ? '<div class="small muted mt6">备份导出时间：' + U.esc(String(res.exportedAt).slice(0, 19).replace('T', ' ')) + '</div>' : ''),
          [{
            label: '确认导入', cls: 'danger', onClick: function () {
              if (!R.store.commitImport(obj)) {
                U.closeModal();
                U.notice('err', 'alert', '<b>写入失败</b>：本机浏览器存储不可用（隐私模式或存储空间已满），导入未生效。');
                return;
              }
              U.closeModal();
              U.toast('导入成功，正在刷新…', 'ok');
              setTimeout(function () { location.reload(); }, 500);
            }
          }]);
      };
      rd.readAsText(f, 'utf-8');
    };
    inp.click();
  };

  R.actions.resetState = function () {
    U.modal('重置演示数据',
      '<div class="notice warn"><span class="ic">' + U.icon('alert', 18) + '</span><div>' +
      '将清空本地所有改动（目标状态、观察表、会议决议、成稿版本、留痕），恢复到初始演示状态。此操作不可撤销。</div></div>',
      [{
        label: '确认重置', cls: 'danger', onClick: function () {
          R.store.reset();
          U.closeModal();
          U.toast('已重置为演示初始状态', 'ok');
          location.hash = '#/home';
          R.render();
        }
      }]);
  };

})(window.RIEP);
