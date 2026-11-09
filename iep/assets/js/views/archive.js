/* ============================================================
   views/archive.js · 儿童档案
   - 一份档案 = 档案头 + 用户上传的评估报告 + 三份观察表 + 六维画像 + IEP/会议 + 月度记录 + 材料清单
   - v4：① 支持按化名 / 编号搜索档案
         ② 建档只填基础信息，其余可建档时补、也可之后补
         ③ 医学诊断 / PEP-3 / VB-MAPP / 感统由用户自行上传，上传后解析、确认再入档
   ============================================================ */
(function (R) {
  'use strict';
  var U = R.ui;

  function ev(id) { return id ? R.EVIDENCE[id] : null; }
  function cur() { return R.store.current(); }
  function mode() { return R.tabState.archiveMode || ''; }
  function type(key) { return R.REPORT_TYPES.filter(function (x) { return x.key === key; })[0]; }

  /* ---------- 档案切换条（含搜索） ---------- */
  function caseBar() {
    var role = R.store.role();
    var c = cur();
    return '<div class="case-bar">' +
      '<div class="cb-left">' + U.icon('archive', 16) +
        '<span class="cb-lab">当前档案</span>' +
        '<div class="cb-search">' +
          '<input id="caseSearch" class="cb-input" type="text" autocomplete="off" ' +
            'placeholder="搜索化名 / 编号">' +
          '<div id="caseResults" class="cb-results"></div>' +
        '</div>' +
        '<button class="btn sm ghost" data-act="toggleCaseList">全部档案</button>' +
        (role.canEdit
          ? '<button class="btn sm ghost" data-act="importState" title="换电脑 / 新浏览器时，把「导出全量数据」得到的 JSON 装回来">导入数据包</button>'
          : '') +
      '</div>' +
      '<div class="cb-meta">' + U.esc(c.alias) + ' · ' + U.esc(c.id) + ' · ' + U.esc(c.age) + ' · ' + U.esc(c.stage) + '</div>' +
      (role.canEdit
        ? '<div class="cb-act">' +
          '<button class="btn sm" data-act="editCase">编辑档案</button>' +
          '<button class="btn sm primary" data-act="newCaseForm">' + U.icon('plus', 14) + ' 新建档案</button>' +
          '<button class="btn sm danger" data-act="delCase" data-arg="' + U.esc(c.id) + '">删除档案</button>' +
          '</div>'
        : '') +
      '</div>';
  }

  /* 搜索结果（也用于"全部档案"） */
  function caseResultHtml(kw) {
    var k = (kw || '').trim().toLowerCase();
    var canEdit = R.store.role().canEdit;
    var list = R.store.cases().filter(function (x) {
      if (!k) return true;
      return (x.alias + ' ' + x.id + ' ' + x.cls + ' ' + (x.name || '')).toLowerCase().indexOf(k) >= 0;
    });
    if (!list.length) {
      return '<div class="cbr-empty">没有匹配的档案，可试试化名或园内编号</div>';
    }
    return list.map(function (x) {
      return '<div class="cbr-item' + (x.isCurrent ? ' on' : '') + '" data-act="switchCase" data-arg="' + U.esc(x.id) + '">' +
        '<b>' + U.esc(x.alias) + '</b>' +
        '<span>' + U.esc(x.id) + ' · ' + U.esc(x.cls) + ' · ' + U.esc(x.stage) + '</span>' +
        '<i>' + x.completeness + '%</i>' +
        (canEdit ? '<button class="cbr-del" title="删除这份档案" data-act="delCase" data-arg="' + U.esc(x.id) + '">' + U.icon('trash', 12) + '</button>' : '') +
        '</div>';
    }).join('');
  }

  /* ---------- ① 概览 ---------- */
  function overviewTab() {
    var c = cur();
    var comp = R.engine.completeness();
    var conf = R.engine.confidence();
    var list = R.engine.profile();
    var stats = R.engine.goalStats();
    var gaps = R.engine.gaps();
    var st = R.store.get();
    var obsDone = (st.obsFilled.group ? 1 : 0) + (st.obsFilled.fusion ? 1 : 0) + (st.obsFilled.parent ? 1 : 0);

    var hero = '<div class="hero' + (comp >= 85 ? ' done' : '') + '">' +
      '<div class="h-k">' + U.esc(c.alias) + ' · ' + U.esc(c.gender) + ' · ' + U.esc(c.age) + ' · ' + U.esc(c.cls) + '</div>' +
      '<div class="h-t">' + (comp === 0 ? '这份档案还是空的：先上传评估报告，或先填六维初判' :
        comp < 60 ? '数据还差一些，补齐后才能定目标' :
        '数据基本齐备，可以进入目标审议') + '</div>' +
      '<div class="h-d">' + U.progress(comp, comp >= 85 ? 't' : 'a') +
      '<div class="mt8">数据完整度 <b>' + comp + '%</b> · 置信度 ' + conf.lv +
      ' · 报告 ' + reportCount() + '/4 份 · 观察表回收 ' + obsDone + '/3</div></div>' +
      '<div class="h-act">' +
      (comp === 0
        ? '<button class="btn primary lg" data-act="setTab" data-arg="archive" data-arg2="files">上传评估报告</button>' +
          '<button class="btn lg" data-act="editCase">先填基础信息</button>'
        : comp < 60
          ? '<button class="btn primary lg" data-act="setTab" data-arg="archive" data-arg2="files">继续上传 / 补齐材料</button>' +
            (stats.all ? '<button class="btn lg" data-act="goto" data-arg="goals">先看待审议目标</button>' : '')
          : '<button class="btn primary lg" data-act="goto" data-arg="profile">看跨源能力画像</button>' +
            '<button class="btn lg" data-act="goto" data-arg="goals">审议目标</button>') +
      '</div></div>';

    var statRow = '<div class="grid g4">' +
      U.stat('候选目标', stats.all, '条', '已采纳 ' + stats.adopted + ' · 待审议 ' + stats.pending) +
      U.stat('观察表', obsDone, '/ 3', '小组班 + 融合班 + 家长') +
      U.stat('评估报告', reportCount(), '/ 4', '医学 · PEP-3 · VB-MAPP · 感统') +
      U.stat('数据缺口', gaps.length, '项', gaps.length ? '优先处理：' + gaps[0].name : '暂无', gaps.length ? 'accent-a' : '') +
      '</div>';

    var dimTable = '<div class="card"><div class="card-head"><h3>' + U.icon('profile', 16) + ' 六维能力现况</h3>' +
      '<span class="desc">点维度名可下钻证据</span></div>' +
      '<table class="table compact"><thead><tr><th>能力维度</th><th>等级</th><th>基线</th><th>当前</th><th>学期目标</th>' +
      '<th>证据</th><th>短期目标</th></tr></thead><tbody>' +
      list.map(function (d) {
        return '<tr><td><b class="link" data-act="domainDetail" data-arg="' + d.code + '">' + U.esc(d.name) + '</b></td>' +
          '<td>' + U.badge(d.level, d.badge) + '</td>' +
          '<td class="mono">' + (d.baseline || '—') + '</td><td class="mono"><b>' + (d.score || '—') + '</b></td>' +
          '<td class="mono">' + (d.target || '—') + '</td>' +
          '<td class="small muted">' + d.sources + ' 源 / ' + d.evid.length + ' 条</td>' +
          '<td class="small">' + (d.shorts.length ? d.shorts.length + ' 条' : '—') + '</td></tr>';
      }).join('') + '</tbody></table>' +
      (comp === 0 ? U.note('该档案还没有评估数据，六维均为空值。可在「材料清单」上传报告并确认解析结果，或在「编辑档案 → 六维初判」手工录入教师初判分。') : '') +
      '</div>';

    var gapCard = gaps.length
      ? '<div class="card"><div class="card-head"><h3>' + U.icon('alert', 16) + ' 数据缺口与处理建议</h3>' +
        '<span class="desc">' + gaps.length + ' 项</span></div>' +
        gaps.map(function (g) {
          return '<div class="gap-row"><div class="g-nm">' + U.esc(g.name) + '</div>' +
            '<div class="g-why">' + U.esc(g.why) + '</div>' +
            '<div class="g-act">' + U.icon('check', 13) + ' ' + U.esc(g.act) + '</div></div>';
        }).join('') + '</div>'
      : '';

    var nodes = '<div class="card"><div class="card-head"><h3>' + U.icon('track', 16) + ' 本学期节点</h3></div>' +
      '<div class="steps">' + R.MILESTONES.map(function (m, i) {
        var state = c.stageIdx > i + 1 ? 'done' : c.stageIdx === i + 1 ? 'now' : 'todo';
        return '<div class="step ' + state + '"><i>' + (i + 1) + '</i><b>' + U.esc(m.title) + '</b>' +
          '<span>' + U.esc(m.when) + '</span></div>';
      }).join('') + '</div></div>';

    return hero + statRow + nextStepsCard() + dimTable + gapCard + nodes;
  }

  function reportCount() {
    var r = R.store.reports();
    return (r.medical ? 1 : 0) + (r.pep3 ? 1 : 0) + (r.vbmapp ? 1 : 0) + (r.sensory ? 1 : 0);
  }

  /* 建档后"接下来可以补什么"：材料 / 观察 / 六维 / 目标，逐项直达 */
  function nextStepsCard() {
    var rep = R.store.reports();
    var st = R.store.get();
    var items = [];
    if (!rep.medical) items.push({ t: '上传医学诊断', d: '诊断结论照抄原文，决定安置方向与干预强度', a: 'uploadReport', g: 'medical' });
    if (!rep.pep3) items.push({ t: '上传 PEP-3 评估报告', d: '发展年龄差是"定多高"的直接依据', a: 'uploadReport', g: 'pep3' });
    if (!rep.vbmapp) items.push({ t: '上传 VB-MAPP 评估报告', d: '阶段判定决定"先练什么"', a: 'uploadReport', g: 'vbmapp' });
    if (!rep.sensory) items.push({ t: '上传感觉统合评估', d: '扫描件需人工核对三组评定等级', a: 'uploadReport', g: 'sensory' });
    R.OBS_ORDER.forEach(function (k) {
      if (st.obsFilled[k]) return;
      var T = R.OBS_TYPES[k];
      items.push({
        t: '回收' + T.name,
        d: k === 'parent' ? '缺家庭情境，家庭任务卡不下发' : '没有真实情境样本，目标写不出情境',
        a: 'uploadObs', g: k
      });
    });
    var zero = R.engine.profile().filter(function (d) { return !d.score; }).length;
    if (zero && (rep.pep3 || rep.vbmapp || rep.sensory)) {
      items.push({ t: '按解析结果补算六维（' + zero + ' 个维度还是空的）', d: '只补没有数据的维度，不覆盖教师已定的分数', a: 'applySuggest', g: 'empty' });
    }
    if (!st.goals.length && reportCount()) {
      items.push({ t: '生成 / 录入 IEP 目标', d: '有了评估与观察，目标才站得住', a: 'goto', g: 'goals' });
    }
    if (!items.length) {
      return U.notice('ok', 'check', '<b>四类材料齐备</b>：医学诊断、PEP-3、VB-MAPP、感统都已解析确认，观察表也已回收。可以进入目标审议与会议调校。');
    }
    return '<div class="card"><div class="card-head"><h3>' + U.icon('intake', 16) + ' 接下来可以补这些</h3>' +
      '<span class="desc">' + items.length + ' 项 · 什么时候补都行，补一项完整度就涨一点</span></div>' +
      '<div class="next-list">' + items.map(function (it) {
        return '<div class="next-item"><div class="ni-tx"><b>' + U.esc(it.t) + '</b><span>' + U.esc(it.d) + '</span></div>' +
          '<button class="btn sm' + (items.indexOf(it) === 0 ? ' primary' : '') + '" data-act="' + it.a + '" data-arg="' + it.g + '">' +
          (it.a === 'uploadReport' ? '去上传' : it.a === 'openObs' ? '去填报' : it.a === 'applySuggest' ? '补算' : '去看看') +
          '</button></div>';
      }).join('') + '</div></div>';
  }

  /* ---------- ② 基础信息 ---------- */
  function baseTab() {
    var c = cur();
    var fam = R.FAMILY_PROFILE;
    var med = R.MEDICAL;
    return '<div class="card"><div class="card-head"><h3>' + U.icon('archive', 16) + ' 幼儿基础信息</h3>' +
      '<span class="desc">与《IEP 制定与实施记录表》第一章一致</span></div>' +
      '<table class="table kv-table"><tbody>' +
      [['园内编号', c.id], ['化名', c.alias], ['性别', c.gender], ['年龄', c.age],
       ['出生日期', c.birthday || '—'], ['班级', c.cls], ['建档日期', c.enrollDate],
       ['计划周期', c.planStart + ' — ' + (c.planEnd || '—')], ['IEP 制定日期', c.iepDate || '—'],
       ['当前阶段', c.stage], ['医学诊断 / 需求说明', c.dx]]
        .map(function (kv) {
          var extra = (kv[0].indexOf('医学诊断') === 0 && med)
            ? '<div class="mt8">' + U.badge('来自已解析的医学诊断', 'r') + ' ' +
              '<button class="btn sm ghost" data-act="viewParse" data-arg="medical">查看诊断原文与解析字段</button></div>'
            : (kv[0].indexOf('医学诊断') === 0
              ? '<div class="mt8"><button class="btn sm ghost" data-act="uploadReport" data-arg="medical">上传医学诊断</button></div>'
              : '');
          return '<tr><th>' + U.esc(kv[0]) + '</th><td>' + U.esc(kv[1] || '—') + extra + '</td></tr>';
        }).join('') +
      '</tbody></table></div>' +

      '<div class="card"><div class="card-head"><h3>' + U.icon('meeting', 16) + ' IEP 工作小组</h3>' +
      '<span class="desc">' + (c.team || []).length + ' 方参与</span></div>' +
      '<div class="chips">' + (c.team || []).map(function (t) { return '<span class="chip plain">' + U.esc(t) + '</span>'; }).join('') + '</div>' +
      U.note('工作小组与「责任分工」是两件事：小组是"谁参与制定"，分工是"谁负责执行"。五类教师的分工在成稿第五章与设置页。') +
      '</div>' +

      '<div class="card"><div class="card-head"><h3>' + U.icon('heart', 16) + ' 家庭养育情况</h3>' +
      '<span class="desc">只作背景，不计入能力指数</span></div>' +
      '<div class="kv">' +
      '<b>家庭优势</b><div>' + (fam.strengths ? U.esc(fam.strengths) : '<span class="muted">未填写</span>') + '</div>' +
      '<b>需要支持</b><div>' + (fam.needs ? U.esc(fam.needs) : '<span class="muted">未填写</span>') + '</div>' +
      '</div>' +
      (fam.evid && fam.evid.length ? U.fold('依据（家长观察表原文）', U.panel(U.evidenceList(fam.evid)), { plain: true, tag: fam.evid.length + ' 条' }) : '') +
      '</div>' +

      '<div class="card"><div class="card-head"><h3>' + U.icon('shield', 16) + ' 隐私与授权</h3></div>' +
      '<div class="kv">' +
      '<b>姓名处理</b><div>以化名呈现，档案内不落姓名明文；导出件同样只出现化名与园内编号。</div>' +
      '<b>可查看范围</b><div>本班教师、融合教师、园长；外部专业需逐案授权，家长仅见自己孩子。</div>' +
      '<b>原件保管</b><div>上传件只登记"存在 + 解析到什么程度"；原件仍由园所按规定保管。</div>' +
      '<b>修改留痕</b><div>档案字段、材料上传与解析确认的每次操作都记录操作人、时间与内容。</div>' +
      '</div></div>';
  }

  var KIND_NAME = { pdf: 'PDF 文字层', docx: 'Word 文档', text: '纯文本', ocr: '本机识别', scan: '扫描件', paste: '粘贴文字', manual: '手工录入' };
  function kindName(k) { return KIND_NAME[k] || ''; }

  /* ---------- 上传卡（四类报告通用） ---------- */
  /* 建档中"现在就补"的报告还没入库，先看暂存 */
  function repOf(key) {
    if (mode() === 'new') {
      /* 新档案还没创建：只认暂存，不显示当前档案（别人的）报告 */
      var p = (R.tabState.pendingReports || {})[key];
      if (!p) return null;
      return {
        file: p.pendingMeta.file, pages: p.pendingMeta.pages, size: p.pendingMeta.size,
        uploadedAt: '建档后保存', date: p.pendingFields['评估日期'] || p.pendingFields['就诊日期'] || '',
        kind: p.pendingExtra && p.pendingExtra.kind, chars: p.pendingExtra && p.pendingExtra.chars,
        ocrConf: p.pendingExtra && p.pendingExtra.ocrConf,
        pending: true
      };
    }
    return R.store.report(key);
  }

  function reportCards(keys) {
    var list = (keys || ['medical', 'pep3', 'vbmapp', 'sensory']).map(type).filter(Boolean);
    return '<div class="rep-grid">' + list.map(function (T) {
      var r = repOf(T.key);
      var can = R.store.role().canEdit;
      if (r) {
        return '<div class="rep-card has">' +
          '<div class="rc-h"><b>' + U.esc(T.idx + ' ' + T.name) + '</b>' +
          U.badge(r.pending ? '已解析 · 待保存' : r.status === 'confirmed' ? '已解析 · 已确认' : '已解析 · 待核对',
            r.pending || r.status !== 'confirmed' ? 'a' : 'g') + '</div>' +
          '<div class="rc-f">' + U.icon('doc', 14) + ' ' + U.esc(r.file) + '</div>' +
          '<div class="small muted">' + (r.pages || 1) + ' 页 · ' + U.esc(r.uploadedAt) +
          ' · 报告日期 ' + U.esc(r.date || '—') + (r.size ? ' · ' + U.esc(r.size) : '') +
          (kindName(r.kind) ? ' · ' + kindName(r.kind) : '') + (r.chars ? ' · ' + r.chars + ' 字' : '') +
          (r.ocrConf ? ' · 置信度 ' + r.ocrConf : '') + '</div>' +
          '<div class="btn-row mt8">' +
          '<button class="btn sm ghost" data-act="uploadReport" data-arg="' + T.key + '">重新解析</button>' +
          (r.pending || !can ? '' : '<button class="btn sm" data-act="viewParse" data-arg="' + T.key + '">查看解析字段</button>' +
            '<button class="btn sm ghost" data-act="removeReport" data-arg="' + T.key + '">移除</button>') +
          '</div></div>';
      }
      return '<div class="rep-card">' +
        '<div class="rc-h"><b>' + U.esc(T.idx + ' ' + T.name) + '</b>' + U.badge('未上传', 'gray') + '</div>' +
        '<div class="small muted">' + U.esc(T.formats) + '</div>' +
        '<div class="small" style="margin-top:6px;color:var(--brand)">' + U.esc(T.tip) + '</div>' +
        '<div class="btn-row mt8">' +
        (can ? '<button class="btn sm primary" data-act="uploadReport" data-arg="' + T.key + '">' +
          U.icon('plus', 13) + ' 上传' + U.esc(T.name) + '</button>' : '') +
        '</div></div>';
    }).join('') + '</div>';
  }

  /* ---------- ③ 评估报告（本档案自己的报告） ---------- */
  function assessTab() {
    var role = R.store.role();
    var rep = R.store.reports();
    var any = rep.pep3 || rep.vbmapp || rep.sensory;

    if (role.scope === 'all-aggregate') {
      return U.notice('info', 'info', '聚合视图不展开评估原始分与发展年龄。如需查看，请以教师身份进入，或逐案授权。') +
        '<div class="card"><div class="card-head"><h3>报告上传情况</h3></div>' +
        '<div class="kv">' +
        '<b>医学诊断</b><div>' + (rep.medical ? '已上传并解析' : '未上传') + '</div>' +
        '<b>PEP-3</b><div>' + (rep.pep3 ? '已上传并解析' : '未上传') + '</div>' +
        '<b>VB-MAPP</b><div>' + (rep.vbmapp ? '已上传并解析' : '未上传') + '</div>' +
        '<b>感觉统合</b><div>' + (rep.sensory ? '已上传并解析' : '未上传') + '</div>' +
        '</div></div>' + reportCards();
    }

    var head = '<div class="card"><div class="card-head"><h3>' + U.icon('intake', 16) + ' 报告由你上传，系统再解析</h3>' +
      '<span class="desc">上传 → 读文字层并抽字段 → 你确认 → 进入画像与目标</span></div>' +
      reportCards() + '</div>';

    if (!any) {
      return head + U.empty('这份档案还没有评估报告') +
        '<div class="small muted" style="text-align:center;margin-bottom:16px">' +
        'PEP-3、VB-MAPP、感统评估报告与医学诊断都由园所自行上传。PDF / Word 会直接读出文字并抽成字段，' +
        '扫描件则转「粘贴文字 / 逐项核对」；确认前不进入能力指数与目标排序。</div>';
    }

    var P = R.PEP3, V = R.VBMAPP, S = R.SENSORY;
    var parts = '';

    if (P) {
      var pepRows = P.domains.map(function (p) {
        var tone = p.gap === null ? 'g' : p.gap >= 0 ? 't' : p.gap >= -7 ? 'a' : 'r';
        var gapTx = p.gap === null ? '—' : (p.gap > 0 ? '+' + p.gap : '' + p.gap);
        return '<tr><td><b>' + U.esc(p.k) + '</b></td><td class="mono">' + U.esc(p.age) + ' 个月</td>' +
          '<td>' + (p.gap === null ? U.badge('—', 'gray') : U.badge(gapTx + ' 个月', tone)) + '</td>' +
          '<td class="small muted">' + U.esc(p.note) + '</td></tr>';
      }).join('');
      var behRows = (P.behaviors || []).map(function (b) {
        return '<tr><td>' + U.esc(b.k) + '</td>' +
          '<td class="mono">' + (b.severe ? U.badge(b.severe + ' 项', 'r') : '0') + '</td>' +
          '<td class="mono">' + (b.mild ? U.badge(b.mild + ' 项', 'a') : '0') + '</td>' +
          '<td class="mono muted">' + (b.normal || '—') + '</td></tr>';
      }).join('');
      parts += '<div class="grid g2">' +
        '<div class="card"><div class="card-head"><h3>' + U.icon('profile', 16) + ' PEP-3 · 发展年龄</h3>' +
        '<span class="desc">生理年龄 ' + P.chronoAge + ' 个月 · 发展年龄 ' + P.devAge + ' 个月' +
        (P.estimated ? '（由各领域推算）' : '') + '</span></div>' +
        '<div class="row" style="gap:8px;margin-bottom:10px">' +
        U.badge('功能发展 ' + P.total, 'b') + U.badge(P.file, 'outline') + U.badge(P.date, 'gray') + '</div>' +
        '<table class="table compact"><thead><tr><th>领域</th><th>发展年龄</th><th>差距</th><th>说明</th></tr></thead><tbody>' +
        pepRows + '</tbody></table>' +
        '<div class="small muted mt8">差距为负表示落后于生理年龄；"≥"表示已达该领域参考最高区间。</div></div>' +
        '<div class="card"><div class="card-head"><h3>' + U.icon('profile', 16) + ' PEP-3 · 病理行为</h3>' +
        '<span class="desc">重度 / 轻度 / 正常 项数</span></div>' +
        (behRows
          ? '<table class="table compact"><thead><tr><th>行为类别</th><th>重度</th><th>轻度</th><th>正常</th></tr></thead><tbody>' +
            behRows + '</tbody></table>'
          : U.empty('上传时未填病理行为项数')) +
        '<div class="small muted mt8">感觉模式与情绪类目标相关，与感统报告需交叉看。</div></div>' +
        '</div>';
    }

    if (V) {
      var vbCells = V.milestones.map(function (v) {
        var tone = v.s === '2' ? 'a' : v.s === '1' ? 'r' : 'g';
        return '<div class="vb-cell"><span>' + U.esc(v.k) + '</span>' + U.badge('第 ' + v.s + ' 阶段', tone) + '</div>';
      }).join('');
      var bar = function (arr, cls, label) {
        if (!arr || !arr.length) return '';
        return '<b>' + label + '（' + arr.length + '）</b><div>' + arr.map(function (b) {
          return U.badge(b.k, cls); }).join(' ') + '</div>';
      };
      parts += '<div class="card"><div class="card-head"><h3>' + U.icon('profile', 16) + ' VB-MAPP · 里程碑</h3>' +
        '<span class="desc">总体 ' + U.esc(V.overall) + ' · ' + V.milestones.length + ' 个领域</span></div>' +
        '<div class="vb-grid">' + vbCells + '</div>' +
        '<div class="small muted mt8">阶段：1 = 0–18 月，2 = 18–30 月，3 = 30–48 月。</div></div>' +
        '<div class="card"><div class="card-head"><h3>' + U.icon('alert', 16) + ' VB-MAPP · 障碍评估</h3></div>' +
        '<div class="kv">' +
        (bar(V.barriers.severe, 'r', '中重度') || '<b>中重度</b><div class="muted">未填</div>') +
        (bar(V.barriers.moderate, 'a', '中度') || '<b>中度</b><div class="muted">未填</div>') +
        ((V.barriers.mild || []).length
          ? '<b>轻度（' + V.barriers.mild.length + ' 项）</b><div class="small">' + V.barriers.mild.map(U.esc).join('、') + '</div>'
          : '') +
        ((V.transition || []).length
          ? '<b>转衔评估</b><div>' + V.transition.map(function (t) { return U.badge(t.k + '：' + t.v, 'g'); }).join(' ') + '</div>'
          : '') +
        '</div></div>';
    }

    if (S) {
      var sens = (S.groups || []).map(function (g) {
        var cls = g.level === '正常' ? 'g' : g.level === '明显问题' ? 'r' : g.level === '一般问题' ? 'a' : 'gray';
        return '<div class="sens-group"><div class="sg-k">' + U.esc(g.k) + '</div>' +
          '<div class="sg-lv">评定等级：' + U.badge(g.level || '待核对', cls) + '</div>' +
          ((g.items || []).length ? '<div class="sg-items">' + g.items.map(function (it) {
            return '<span class="chip plain sm">' + U.esc(it) + '</span>'; }).join('') + '</div>' : '') +
          '</div>';
      }).join('');
      parts += '<div class="card"><div class="card-head"><h3>' + U.icon('info', 16) + ' 感觉统合评估</h3>' +
        '<span class="desc">' + (S.file ? U.esc(S.file) : '') + ' · ' + U.esc(S.date || '') + '</span></div>' +
        (S.note ? U.notice(R.store.get().sensoryFixed ? 'ok' : 'warn', R.store.get().sensoryFixed ? 'check' : 'alert', U.esc(S.note)) : '') +
        '<div class="sens-wrap">' + sens + '</div>' +
        (R.store.get().sensoryFixed ? '' :
          '<div class="btn-row mt8"><button class="btn sm" data-act="uploadReport" data-arg="sensory">重新上传并核对等级</button></div>') +
        '</div>';
    }

    return head + parts + suggestCard() +
      U.fold('不同报告不是一个时点，怎么避免混用', U.panel(
        '每份报告都带自己的日期，画像里的每条依据都标注了评估日期。' +
        '若目标涉及"当前水平"，以最近一次为准并在会议中说明；系统不会把 7 月的感统结论当成 10 月的现状。'),
      { plain: true, tag: '点开查看' });
  }

  /* 解析结果 → 六维建议（只建议，不自动改） */
  function suggestCard() {
    var rows = R.store.suggest();
    if (!rows.length) return '';
    var withBasis = rows.filter(function (r) { return r.hasBasis; });
    if (!withBasis.length) return '';
    var canEdit = R.store.role().canEdit;
    return '<div class="card"><div class="card-head"><h3>' + U.icon('profile', 16) + ' 按解析结果算一版六维</h3>' +
      '<span class="desc">只给建议；确认前不改动任何已定的分数</span></div>' +
      '<div class="table-scroll"><table class="table compact"><thead><tr><th style="width:130px">能力维度</th>' +
      '<th style="width:110px">现用</th><th style="width:140px">解析建议</th><th>依据</th></tr></thead><tbody>' +
      withBasis.map(function (r) {
        var same = r.cur === r.score;
        return '<tr><td class="dim"><b>' + U.esc(r.name) + '</b></td>' +
          '<td class="mono">' + (r.cur ? U.badge(r.cur + '', 'gray') : '—') + '</td>' +
          '<td>' + U.badge(r.level, R.engine.levelBadge(r.level)) + ' ' + (same ? '<span class="muted">一致</span>' : U.badge(r.score + '', 'b')) + '</td>' +
          '<td class="small muted">' + (r.basis.length ? U.esc(r.basis.join('；')) : '—') + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      (canEdit ? '<div class="btn-row mt8">' +
        '<button class="btn sm primary" data-act="applySuggest" data-arg="empty">只补没有数据的维度</button>' +
        '<button class="btn sm" data-act="applySuggest" data-arg="all">全部按解析结果重算</button>' +
        '</div>' + U.note('「只补空缺」不会动教师已经定过的分数；「全部重算」会用解析结果覆盖六个维度，请确认后再点。')
        : '') +
      '</div>';
  }

  /* ---------- ④ 观察记录 ---------- */
  function obsTab() {
    var st = R.store.get();
    var ob = st.observation || {};
    var any = R.OBS_ORDER.some(function (k) {
      return Object.keys(ob[k] || {}).length > 0;
    });
    if (!any) {
      return U.empty('还没有回收观察记录') +
        '<div class="center mt14">' + R.OBS_ORDER.map(function (k, i) {
          return '<button class="btn' + (i === 0 ? ' primary' : '') + '" data-act="uploadObs" data-arg="' + k + '">' +
            '上传' + U.esc(R.OBS_TYPES[k].name) + '</button>';
        }).join('') + '</div>' +
        '<div class="center mt8 small muted">也可以直接' +
        R.OBS_ORDER.map(function (k) {
          return '<a href="javascript:;" data-act="openObs" data-arg="' + k + '">在线填报' + U.esc(R.OBS_TYPES[k].short) + '表</a>';
        }).join(' · ') + '</div>';
    }

    return R.OBS_ORDER.map(function (k) {
      var T = R.OBS_TYPES[k];
      var filled = st.obsFilled[k];
      var f = (st.obsFiles || {})[k];
      var oneCol = T.dims.every(function (d) { return d.onlyNeed; });
      var rows = T.dims.map(function (d) {
        var o = (ob[k] || {})[d.dim] || {};
        if (d.onlyNeed) {
          return '<tr><td class="dim"><b>' + U.esc(d.dim) + '</b></td>' +
            '<td>' + (o.need ? U.esc(o.need) : '<span class="muted">—</span>') + '</td></tr>';
        }
        return '<tr><td class="dim"><b>' + U.esc(d.dim) + '</b></td>' +
          '<td>' + (o.strength ? U.esc(o.strength) : '<span class="muted">—</span>') + '</td>' +
          '<td>' + (o.need ? U.esc(o.need) : '<span class="muted">—</span>') + '</td></tr>';
      }).join('');

      return '<div class="card"><div class="card-head"><h3>' + U.icon('doc', 16) + ' ' + U.esc(T.name) + '</h3>' +
        '<span class="desc">' + U.esc((f && f.by) || T.by) + ' · ' + U.esc((f && f.date) || '—') + ' · ' +
        T.dims.length + ' 个维度 · ' + (filled ? '已回收' : '未回收') +
        (f && f.file ? ' · 原件 ' + U.esc(f.file) : '') + '</span>' +
        '<div class="right"><button class="btn sm ghost" data-act="uploadObs" data-arg="' + k + '">' +
        (f && f.file ? '重新上传' : '上传原件') + '</button>' +
        '<button class="btn sm" data-act="openObs" data-arg="' + k + '">查看 / 修改</button></div></div>' +
        '<table class="table compact obs-tbl"><thead>' +
        (oneCol
          ? '<tr><th style="width:180px">观察维度</th><th>家长需求</th></tr>'
          : '<tr><th style="width:150px">观察维度</th><th>优势 / 现有能力</th><th>需求 / 薄弱环节</th></tr>') +
        '</thead><tbody>' + rows + '</tbody></table>' +
        (filled ? '' : U.note('这份表尚未回收，表格展示的是已录入的片段。')) +
        '</div>';
    }).join('') +
      U.fold('三张观察表怎么变成画像里的分', U.panel(
        '观察表不是直接打分：每条"优势"和"需求"先按<b>句号 / 分号</b>拆成可观察行为条数，再按所属维度累计权重，' +
        '最后与 PEP-3 发展年龄差、VB-MAPP 阶段判定、感统评定一起进入六维指数。<br>' +
        '<b>小组班</b>提供 7 个维度的条数（运动 / 语言沟通 / 社会交往 / 生活自理 / 认知学习 / 情绪行为 / 关注跟随）；' +
        '<b>融合班</b>提供健康 / 语言 / 社交 / 科学 / 艺术五个领域；<b>家长表</b>补家庭情境与家长诉求。<br>' +
        '缺哪张表，对应的数据项就不参与计算，权重按比例摊给其他项——绝不凭空给分。'),
      { plain: true, tag: '点开查看' });
  }

  /* ---------- ⑤ IEP 与会议 ---------- */
  function iepTab() {
    var st = R.store.get();
    if (!st.goals.length) {
      return U.empty('还没有生成目标建议') +
        '<div class="center mt14"><button class="btn primary" data-act="goto" data-arg="goals">去生成 / 录入目标</button></div>';
    }
    var rows = R.DOMAINS.map(function (d) {
      var gs = st.goals.filter(function (g) { return g.domain === d.code; });
      if (!gs.length) return '';
      return '<tr><td class="dim"><b>' + U.esc(d.name) + '</b></td><td>' +
        gs.map(function (g) {
          var cls = g.status === 'adopted' ? 'g' : g.status === 'dropped' ? 'gray' : 'a';
          return '<div class="goal-line">' +
            '<span class="badge ' + cls + '">' + U.esc(g.id) + '</span>' +
            '<div class="gl-body">' + U.esc(g.text) +
            '<span class="muted">（' + U.esc(g.criteria) + '）</span></div></div>';
        }).join('') + '</td></tr>';
    }).filter(Boolean).join('');

    var m = st.meetings[st.meetings.length - 1];
    var meeting = m ? '<div class="card"><div class="card-head"><h3>' + U.icon('meeting', 16) + ' IEP 会议纪要</h3>' +
      '<span class="desc">' + U.esc(m.date) + ' · ' + U.esc(m.place) + ' · 主持 ' + U.esc(m.host) + '</span></div>' +
      '<div class="chips" style="margin-bottom:10px">' + m.attend.map(function (a) {
        return '<span class="chip plain sm">' + U.esc(a) + '</span>'; }).join('') + '</div>' +
      '<div class="quote-block">' + U.esc(m.minutes).replace(/\n/g, '<br>') + '</div>' +
      '<div class="kv mt14"><b>家长意见</b><div>' + U.esc(m.parentOpinion) + '</div>' +
      '<b>专家意见</b><div>' + U.esc(m.expertOpinion) + '</div></div>' +
      (m.applied ? '<div class="mt14">' + U.badge('决议已应用 · ' + (m.appliedAt || ''), 'g') + '</div>' : '') +
      '</div>' : '';

    var prog = st.progress.length ? '<div class="card"><div class="card-head"><h3>' + U.icon('track', 16) + ' 月度检视记录</h3>' +
      '<span class="desc">' + st.progress.length + ' 条 · 最近 ' + st.progress[st.progress.length - 1].month + '</span></div>' +
      '<table class="table compact"><thead><tr><th>月份</th><th>目标</th><th>达成</th><th>具体表现</th></tr></thead><tbody>' +
      st.progress.slice().reverse().map(function (p) {
        var cls = p.result === '达成' ? 'g' : p.result === '部分达成' ? 'a' : 'r';
        return '<tr><td class="mono nw">' + U.esc(p.month) + '</td><td class="nw">' + U.esc(p.goalId) + '</td>' +
          '<td>' + U.badge(p.result, cls) + '</td><td class="small">' + U.esc(p.note) + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '';

    return '<div class="card"><div class="card-head"><h3>' + U.icon('goals', 16) + ' IEP 目标（按六维）</h3>' +
      '<span class="desc">共 ' + st.goals.length + ' 条 · ' +
      st.goals.filter(function (g) { return g.status === 'adopted'; }).length + ' 条已采纳</span></div>' +
      '<table class="table compact"><tbody>' + rows + '</tbody></table>' +
      '<div class="btn-row mt8"><button class="btn sm" data-act="goto" data-arg="goals">去目标审议</button>' +
      '<button class="btn sm" data-act="goto" data-arg="doc">看完整成稿</button></div></div>' +
      meeting + prog;
  }

  /* ---------- ⑥ 材料清单（上传入口在这里） ---------- */
  function filesTab() {
    var c = cur();
    var role = R.store.role();
    var mats = c.materials || [];
    var ms = c.materialStatus || {};
    var st = R.store.get();

    var stateBadge = function (s) {
      return s === 'done' ? U.badge('已解析', 'g') : s === 'part' ? U.badge('部分完成', 'a')
        : s === 'none' ? U.badge('未上传', 'gray') : U.badge(s, 'gray');
    };

    var base = '<div class="card"><div class="card-head"><h3>' + U.icon('intake', 16) + ' 四类材料状态</h3>' +
      '<span class="desc">医学 25% + 教育评估 35% + 教师观察 20% + 家长观察 20%</span></div>' +
      '<div class="mat-grid">' +
      [['① 医学诊断', ms.medical, 25], ['② 教育评估', ms.assess, 35],
       ['③ 教师观察', ms.teacher, 20], ['④ 家长观察', ms.parent, 20]].map(function (x) {
        var m = x[1] || {};
        return '<div class="mat-cell"><div class="mh">' + U.esc(x[0]) + ' <span class="muted">' + x[2] + '%</span></div>' +
          stateBadge(m.state) + '<div class="small muted mt6">' + U.esc(m.note || '—') + '</div></div>';
      }).join('') + '</div></div>';

    var up = '<div class="card"><div class="card-head"><h3>' + U.icon('plus', 16) + ' 上传与解析</h3>' +
      '<span class="desc">四类材料都由你上传；上传后系统解析，你确认字段后才入档</span></div>' +
      reportCards() + '</div>';

    var obsRow = '<div class="card"><div class="card-head"><h3>' + U.icon('doc', 16) + ' 观察表（三张 · 上传或填报）</h3>' +
      '<span class="desc">' + R.OBS_ORDER.filter(function (k) { return st.obsFilled[k]; }).length + ' / 3 张已回收</span></div>' +
      '<div class="obs-pick">' + R.OBS_ORDER.map(function (k) {
        var T = R.OBS_TYPES[k], ok = st.obsFilled[k], f = (st.obsFiles || {})[k];
        return '<div class="obs-pick-c' + (ok ? ' done' : '') + '">' +
          '<div class="op-h">' + U.esc(T.name) + (ok ? '<span class="op-tag ok">已回收</span>' : '') + '</div>' +
          '<div class="op-d">' + U.esc(T.by) + ' · ' + T.dims.length + ' 个维度</div>' +
          '<div class="op-f">' + (f && f.file ? U.esc(f.file) : '尚未上传原件') + '</div>' +
          '<div class="btn-row mt8">' +
          '<button class="btn sm" data-act="uploadObs" data-arg="' + k + '">上传原件</button>' +
          '<button class="btn sm' + (ok ? '' : ' primary') + '" data-act="openObs" data-arg="' + k + '">' +
          (ok ? '查看 / 修改' : '在线填报') + '</button></div></div>';
      }).join('') + '</div></div>';

    var table = '<div class="card"><div class="card-head"><h3>' + U.icon('archive', 16) + ' 材料清单</h3>' +
      '<span class="desc">' + mats.length + ' 份</span>' +
      (role.canEdit ? '<div class="right"><button class="btn sm" data-act="addMaterial">' + U.icon('plus', 14) + ' 登记其他材料</button></div>' : '') +
      '</div>' +
      (mats.length ? '<table class="table"><thead><tr><th style="width:110px">类别</th><th>材料</th><th style="width:130px">状态</th><th>说明</th></tr></thead><tbody>' +
        mats.map(function (m) {
          return '<tr><td class="small nw">' + U.esc(m.cat) + '</td><td>' + U.esc(m.name) + '</td>' +
            '<td>' + U.badge(m.state, (m.state || '').indexOf('已填') >= 0 || (m.state || '').indexOf('已解析') >= 0 ? 'g' : 'gray') + '</td>' +
            '<td class="small muted">' + U.esc(m.todo) + '</td></tr>';
        }).join('') + '</tbody></table>'
        : U.empty('还没有任何材料')) +
      '</div>';

    var gaps = (c.gaps || []).length ? '<div class="card"><div class="card-head"><h3>' + U.icon('alert', 16) + ' 缺口</h3></div>' +
      c.gaps.map(function (g) {
        return '<div class="gap-row"><div class="g-nm">' + U.esc(g.name) + '</div>' +
          '<div class="g-why">' + U.esc(g.why) + '</div>' +
          '<div class="g-act">' + U.icon('check', 13) + ' ' + U.esc(g.act) + '</div></div>';
      }).join('') + '</div>' : '';

    return base + up + obsRow + table + gaps;
  }

  /* ---------- 表单草稿：上传报告会重绘页面，先把已填内容存下来 ---------- */
  var FORM_IDS = ['cfId', 'cfAlias', 'cfGender', 'cfBirth', 'cfCls', 'cfEnroll', 'cfStart', 'cfEnd',
    'cfDx', 'cfTeam', 'cfFamS', 'cfFamN'];
  function snapshotForm() {
    var d = {};
    FORM_IDS.forEach(function (id) {
      var e = document.getElementById(id);
      if (e) d[id] = e.value;
    });
    R.DOMAINS.forEach(function (x) {
      ['sc-', 'st-', 'nd-'].forEach(function (pf) {
        var e = document.getElementById(pf + x.code);
        if (e) d[pf + x.code] = e.value;
      });
    });
    R.tabState.caseDraft = d;
  }
  function dv(id, fallback) {
    var d = R.tabState.caseDraft || {};
    return d[id] !== undefined ? d[id] : fallback;
  }

  /* ---------- 新建 / 编辑表单 ---------- */
  function caseForm() {
    var isNew = mode() === 'new';
    var c = isNew ? null : cur();
    var nextId = (function () {
      var max = 0;
      R.store.cases().forEach(function (x) {
        var n = parseInt((x.id || '').split('-').pop(), 10);
        if (!isNaN(n) && n > max) max = n;
      });
      return 'C-2026-' + ('00' + (max + 1)).slice(-3);
    })();

    var clsNow = dv('cfCls', c ? c.cls : '融合中班');
    var clsOpts = ['融合小班', '融合中班', '融合大班', '半融半组'].map(function (x) {
      return '<option' + (clsNow === x ? ' selected' : '') + '>' + x + '</option>';
    }).join('');

    var scoreRow = R.DOMAINS.map(function (d) {
      var p = c ? (R.DOMAIN_PROFILE.filter(function (x) { return x.code === d.code; })[0] || {}) : {};
      var sc = dv('sc-' + d.code, p.score ? p.score : '');
      /* 单行摘要：多段用「；」连起来显示，没改动保存时不会把分段覆盖掉 */
      var stx = dv('st-' + d.code, (p.strengths || []).join('；'));
      var ndx = dv('nd-' + d.code, (p.needs || []).join('；'));
      return '<tr><td class="dim"><b>' + U.esc(d.name) + '</b></td>' +
        '<td><input type="number" min="0" max="100" id="sc-' + d.code + '" value="' + U.esc(sc) + '" placeholder="0–100"></td>' +
        '<td><input type="text" id="st-' + d.code + '" value="' + U.esc(stx) + '" placeholder="如：拼图可独立完成"></td>' +
        '<td><input type="text" id="nd-' + d.code + '" value="' + U.esc(ndx) + '" placeholder="如：单脚站仅 3 秒"></td></tr>';
    }).join('');

    var sub = isNew
      ? '建档只需要基础信息：编号、化名、性别、出生日期、班级。' +
        '<b>医学诊断、PEP-3、VB-MAPP、感统报告、观察表、六维初判都可以现在补，也可以以后在档案页里补</b>，补一项完整度就涨一点。'
      : '档案是唯一主键：评估报告、观察记录、IEP 版本、月度检视都挂在这份档案下。哪些没补，随时回来补。';

    var optional = '<div class="card"><div class="card-head"><h3>' + U.icon('plus', 16) + ' ' +
      (isNew ? '② 现在就补（选填，可跳过）' : '② 上传与解析（可随时补）') + '</h3>' +
      '<span class="desc">' + (isNew ? '跳过也没关系，建档后在「材料清单」里随时能传' : '重新上传会覆盖上一份') + '</span></div>' +
      reportCards() + '</div>' +

      '<div class="card"><div class="card-head"><h3>' + U.icon('profile', 16) + ' ③ 六维初判' +
      '<span class="muted" style="font-weight:400"> · 选填</span></h3>' +
      '<span class="desc">0–100，只用于同一名儿童的时间序列比较，不是常模分；上传报告后可由解析结果推算</span></div>' +
      '<table class="table compact"><thead><tr><th style="width:130px">能力维度</th><th style="width:96px">当前水平</th>' +
      '<th>现有优势</th><th>薄弱 / 需求</th></tr></thead><tbody>' + scoreRow + '</tbody></table></div>' +

      '<div class="card"><div class="card-head"><h3>' + U.icon('heart', 16) + ' ④ 家庭养育情况' +
      '<span class="muted" style="font-weight:400"> · 选填</span></h3>' +
      '<span class="desc">只作背景，不计入指数</span></div>' +
      '<div class="field"><label>家庭优势</label><textarea id="cfFamS" rows="2">' + U.esc(dv('cfFamS', c ? R.FAMILY_PROFILE.strengths : '')) + '</textarea></div>' +
      '<div class="field"><label>需要支持</label><textarea id="cfFamN" rows="2">' + U.esc(dv('cfFamN', c ? R.FAMILY_PROFILE.needs : '')) + '</textarea></div></div>';

    return '<div class="page-head"><div class="ph-text"><h1>' + U.icon('archive', 20) + ' ' +
      (isNew ? '新建儿童档案' : '编辑档案 · ' + U.esc(c.alias)) + '</h1>' +
      '<div class="sub">' + sub + '</div></div>' +
      '<div class="ph-act"><button class="btn lg" data-act="cancelCaseForm">取消</button>' +
      '<button class="btn primary lg" data-act="saveCaseForm">' + (isNew ? '创建档案' : '保存修改') + '</button></div></div>' +

      '<div class="card"><div class="card-head"><h3>' + U.icon('archive', 16) + ' ① 基础信息</h3>' +
      '<span class="desc">' + (isNew ? '只有编号与化名必填，其余可后补' : '带 * 为必填') + '</span></div>' +
      '<div class="form-grid">' +
      '<div class="field"><label>园内编号 *<span class="hint">不落姓名明文</span></label>' +
      '<input type="text" id="cfId" value="' + U.esc(dv('cfId', c ? c.id : nextId)) + '"' + (isNew ? '' : ' readonly') + '></div>' +
      '<div class="field"><label>化名 *</label><input type="text" id="cfAlias" value="' + U.esc(dv('cfAlias', c ? c.name : '')) + '" placeholder="如 小雨"></div>' +
      '<div class="field"><label>性别</label><select id="cfGender">' +
      ['男', '女'].map(function (x) {
        return '<option' + (dv('cfGender', c ? c.gender : '男') === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="field"><label>出生日期</label><input type="date" id="cfBirth" value="' + U.esc(dv('cfBirth', c ? c.birthday : '')) + '"></div>' +
      '<div class="field"><label>班级</label><select id="cfCls">' + clsOpts + '</select></div>' +
      '<div class="field"><label>建档日期</label><input type="date" id="cfEnroll" value="' + U.esc(dv('cfEnroll', c ? c.enrollDate : '2026-11-02')) + '"></div>' +
      '<div class="field"><label>计划开始</label><input type="month" id="cfStart" value="' + U.esc(dv('cfStart', c ? c.planStart : '2026-11')) + '"></div>' +
      '<div class="field"><label>计划结束</label><input type="month" id="cfEnd" value="' + U.esc(dv('cfEnd', c ? (c.planEnd || '2027-03') : '2027-03')) + '"></div>' +
      '<div class="field span2"><label>医学诊断 / 需求说明<span class="hint">上传诊断书后会自动带入</span></label>' +
      '<textarea id="cfDx" rows="2" placeholder="照抄诊断建议书原文；没有诊断就写主要困难与需求">' + U.esc(dv('cfDx', c ? c.dx : '')) + '</textarea></div>' +
      '<div class="field span2"><label>IEP 工作小组<span class="hint">用顿号分隔</span></label>' +
      '<input type="text" id="cfTeam" value="' + U.esc(dv('cfTeam', c ? (c.team || []).join('、') : '园所行政领导、班级教师、融合教师、小组教师、家长')) + '"></div>' +
      '</div></div>' +

      (isNew
        ? U.fold('现在就补材料 / 六维 / 家庭？（选填，可跳过）', optional, { plain: true, tag: '展开' })
        : optional) +

      '<div class="form-foot"><div class="small muted">保存后可在档案页继续补评估、观察与目标；所有修改都会留痕。</div>' +
      '<div class="btn-row"><button class="btn" data-act="cancelCaseForm">取消</button>' +
      '<button class="btn primary" data-act="saveCaseForm">' + (isNew ? '创建档案' : '保存修改') + '</button></div></div>';
  }

  /* ---------- 页面 ---------- */
  R.views.archive = {
    title: '儿童档案',
    render: function () {
      if (mode()) return caseForm();

      var role = R.store.role();
      var t = U.tab('archive', 'overview');
      var tab = U.tabs('archive', [
        { key: 'overview', label: '档案概览' },
        { key: 'base', label: '基础信息' },
        { key: 'assess', label: '评估报告', n: reportCount() },
        { key: 'obs', label: '观察记录', n: 3 },
        { key: 'iep', label: 'IEP 与会议' },
        { key: 'files', label: '材料清单', n: (cur().materials || []).length }
      ]);
      var body = t === 'base' ? baseTab()
        : t === 'assess' ? assessTab()
        : t === 'obs' ? obsTab()
        : t === 'iep' ? iepTab()
        : t === 'files' ? filesTab()
        : overviewTab();

      return U.pageHead({
        icon: 'archive', title: '儿童档案',
        sub: '一份档案装下四类材料、六维画像、IEP 版本与月度检视。' +
          '顶部可<b>搜索化名或编号</b>切换档案；' +
          (role.scope === 'all-aggregate' ? '当前为聚合视图，默认不展开敏感细节。' : '档案内不落姓名明文。')
      }) + caseBar() + tab + body;
    },
    mount: function () {
      var inp = document.getElementById('caseSearch');
      if (inp) {
        var box = document.getElementById('caseResults');
        function show(kw) {
          box.innerHTML = caseResultHtml(kw);
          box.classList.add('show');
        }
        inp.onfocus = function () { show(inp.value); };
        inp.oninput = function () { show(inp.value); };
        inp.onblur = function () { setTimeout(function () { box.classList.remove('show'); }, 200); };
        inp.onkeydown = function (e) {
          if (e.key === 'Escape') { inp.value = ''; box.classList.remove('show'); inp.blur(); }
        };
        return;
      }
      /* 表单模式：任何输入都进草稿，这样中途上传报告重绘也不会丢内容 */
      var view = document.getElementById('view');
      if (view && mode()) {
        view.addEventListener('input', snapshotForm, true);
        view.addEventListener('change', snapshotForm, true);
      }
    }
  };

  /* ---------- 动作：档案 ---------- */
  R.actions.switchCase = function (id) {
    if (id && R.store.switchCase(id)) {
      R.tabState['archive'] = 'overview';
      R.render();
      U.toast('已切换到：' + R.store.current().alias);
    }
  };
  R.actions.toggleCaseList = function () {
    var inp = document.getElementById('caseSearch');
    var box = document.getElementById('caseResults');
    if (!inp || !box) return;
    if (box.classList.contains('show')) { box.classList.remove('show'); return; }
    box.innerHTML = caseResultHtml('');
    box.classList.add('show');
    inp.focus();
  };

  /* 删除档案：危险操作，二次确认后才执行 */
  R.actions.delCase = function (id) {
    var cs = R.store.cases();
    if (cs.length <= 1) { U.toast('至少要保留 1 份档案，不能删除', 'warn'); return; }
    var c = cs.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    U.modal('删除档案',
      '<div style="font-size:13px;line-height:1.8">' +
      '<p style="color:var(--rose);font-weight:600">⚠️ 将永久删除「' + U.esc(c.alias) + '」（' + U.esc(id) + '）的全部数据，此操作不可撤销：</p>' +
      '<ul style="padding-left:20px">' +
      '<li>基础信息与档案头</li>' +
      '<li>已上传的评估报告（含解析字段）</li>' +
      '<li>三张观察表记录</li>' +
      '<li>能力画像、全部目标与会议记录</li>' +
      '<li>成稿与会议补充段落</li>' +
      '</ul>' +
      (c.isCurrent ? '<p>这是<b>当前打开的档案</b>，删除后会自动切换到「' + U.esc(cs.filter(function (x) { return x.id !== id; })[0].alias) + '」。</p>' : '') +
      '</ul></div>',
      [
        { label: '取消', onClick: function () { U.closeModal(); } },
        {
          label: '确认删除', cls: 'danger',
          onClick: function () {
            var r = R.store.delCase(id);
            U.closeModal();
            if (r.ok) {
              U.toast('已删除「' + r.name + '」的全部档案数据', 'ok');
              R.render();
            } else {
              U.toast(r.msg || '删除失败', 'warn');
            }
          }
        }
      ]);
  };

  R.actions.newCaseForm = function () {
    R.tabState.pendingReports = {};
    R.tabState.caseDraft = {};
    R.tabState.archiveMode = 'new';
    R.render();
  };
  R.actions.editCase = function () {
    R.tabState.caseDraft = {};
    R.tabState.archiveMode = 'edit';
    R.render();
  };
  R.actions.cancelCaseForm = function () {
    R.tabState.archiveMode = '';
    R.tabState.pendingReports = {};
    R.tabState.caseDraft = {};
    R.render();
  };

  R.actions.saveCaseForm = function () {
    var val = function (id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; };
    var isNew = mode() === 'new';

    var id = val('cfId'), alias = val('cfAlias');
    if (!id || !alias) { U.toast('园内编号与化名必填，其余都可以以后再补', 'warn'); return; }

    var scores = {}, strengths = {}, needs = {};
    R.DOMAINS.forEach(function (d) {
      scores[d.code] = val('sc-' + d.code);
      strengths[d.code] = val('st-' + d.code);
      needs[d.code] = val('nd-' + d.code);
    });

    var f = {
      id: id, alias: alias, gender: val('cfGender'), birthday: val('cfBirth'), cls: val('cfCls'),
      enrollDate: val('cfEnroll'), planStart: val('cfStart'), planEnd: val('cfEnd'),
      dx: val('cfDx'), team: val('cfTeam').split(/[、,，]/).map(function (x) { return x.trim(); }).filter(Boolean),
      scores: scores, strengths: strengths, needs: needs,
      famStrengths: val('cfFamS'), famNeeds: val('cfFamN'),
      reports: emptyPending()
    };

    if (isNew) {
      if (R.store.cases().some(function (x) { return x.id === id; })) {
        U.toast('园内编号已存在，请换一个', 'warn'); return;
      }
      R.store.createCase(f);
      var n = Object.keys(R.tabState.pendingReports || {}).length;
      U.toast('档案已创建：' + alias + (n ? '（含 ' + n + ' 份已解析报告）' : ''), 'ok');
    } else {
      R.store.updateCase(f);
      U.toast('档案已保存', 'ok');
    }
    R.tabState.archiveMode = '';
    R.tabState.pendingReports = {};
    R.tabState.caseDraft = {};
    R.tabState['archive'] = 'overview';
    R.render();
  };

  /* 建档时"现在就补"的报告：先暂存，创建档案时一并写入 */
  function emptyPending() {
    var p = R.tabState.pendingReports || {};
    return { medical: p.medical || null, pep3: p.pep3 || null, vbmapp: p.vbmapp || null, sensory: p.sensory || null };
  }

  /* ---------- 动作：上传 → 解析 → 校对 → 入档 ---------- */

  function chars(s) { return String(s || '').replace(/\s/g, '').length; }

  function stepUpload(T) {
    var exist = R.store.report(T.key);
    U.modal('上传' + T.name,
      U.notice('info', 'info', '支持 <b>' + U.esc(T.formats) + '</b>。文件只在<b>本机浏览器</b>里解析，不上传服务器；' +
        '解析出的字段由你确认后才进入能力指数与目标排序。') +
      (exist ? U.notice('warn', 'alert', '这份档案已有一份「' + U.esc(exist.file) + '」，重新上传会替换它。') : '') +
      '<div class="field"><label>选择文件</label>' +
      '<input type="file" id="upFile" accept=".pdf,.docx,.txt,.md,.csv,.png,.jpg,.jpeg">' +
      '<div class="small muted mt6">PDF / Word(.docx) 直接读文字层；扫描件与照片没有文字层，会转到「粘贴文字 / 手工核对」。</div></div>' +
      '<div class="field"><label>报告日期<span class="pf-sub">留空则用报告里读到的日期</span></label>' +
      '<input type="date" id="upDate" value="' + (exist && exist.date ? U.esc(exist.date) : '') + '"></div>' +
      (R.parse.samples[T.key] ? '<div class="small muted">手边没有文件？' +
        '<a href="javascript:;" data-act="sampleReport" data-arg="' + T.key + '">用一段示例报告文字试解析</a></div>' : ''),
      [{
        label: '开始解析', cls: 'primary', onClick: function () {
          var fi = document.getElementById('upFile');
          var f = fi && fi.files && fi.files[0];
          var d = (document.getElementById('upDate') || {}).value || '';
          if (!f) { U.toast('请先选择要解析的报告文件', 'warn'); return; }
          runParse(T, f, d);
        }
      }]);
  }

  /* 真实解析：读文件 → 提文字 → 抽字段 */
  function runParse(T, file, date) {
    var steps = ['① 读取文件', '② 提取文字层', '③ 结构化字段', '④ 原文依据与置信度'];
    var meta = { file: file.name, size: file.size ? Math.round(file.size / 1024) + ' KB' : '', pages: 1 };
    U.modal('解析中 · ' + T.name,
      '<div class="parse-box"><div class="pb-file">' + U.icon('doc', 15) + ' ' + U.esc(meta.file) +
      ' <span class="muted">' + U.esc(meta.size) + '</span></div>' +
      '<div id="pbSteps" class="pb-steps"></div><div id="pbDetail" class="pb-detail">正在读取…</div></div>', []);
    var i = 0, stopped = false, detail = '正在读取…';

    function paint(last) {
      var el = document.getElementById('pbSteps');
      if (!el) { stopped = true; return; }
      el.innerHTML = steps.map(function (s, k) {
        var done = last || k < i;
        return '<div class="pb-step ' + (done ? 'done' : k === i ? 'now' : '') + '">' +
          (done ? U.icon('check', 13) : '<i>' + (k + 1) + '</i>') +
          '<span>' + U.esc(s) + '</span></div>';
      }).join('') + U.progress(last ? 100 : Math.round((i + 0.4) / steps.length * 100));
      var d = document.getElementById('pbDetail');
      if (d) d.textContent = detail;
    }
    paint(false);
    var timer = setInterval(function () {
      if (stopped) { clearInterval(timer); return; }
      if (i < 2) { i++; paint(false); }
    }, 320);

    R.parseFile(file, function (n, total) {
      detail = '已读第 ' + n + ' / ' + total + ' 页';
      i = Math.max(i, 1);
      paint(false);
    }).then(function (res) {
      clearInterval(timer);
      meta.pages = res.pages || 1;
      detail = res.kind === 'scan'
        ? '没有文字层 · ' + (res.pages || 1) + ' 页'
        : '已提取 ' + chars(res.text) + ' 字 · ' + (res.pages || 1) + ' 页';
      i = 3;
      paint(true);
      setTimeout(function () {
        if (res.kind === 'scan') { stepScan(T, meta, date, res); return; }
        stepConfirm(T, meta, date, res, R.parse.extract(T.key, res.text));
      }, 360);
    }).catch(function (err) {
      clearInterval(timer);
      U.modal('没能解析这份文件 · ' + T.name,
        U.notice('warn', 'alert', '<b>' + U.esc((err && err.message) || '未知错误') + '</b>') +
        '<div class="small muted">可以换一份文件，或直接按原件手工填写关键字段；所有值都会记在档案里并可回溯。</div>',
        [{
          label: '手工填写', cls: 'primary', onClick: function () {
            stepConfirm(T, meta, date, { text: '', pages: 1, kind: 'manual' },
              { fields: {}, conf: {}, ev: {}, note: '' });
          }
        }]);
    });
  }

  /* 扫描件 / 照片：没有文字层 → 粘贴文字或手工填 */
  function stepScan(T, meta, date, res) {
    var thumbs = (res.thumbs || []).map(function (t) {
      return '<figure class="scan-thumb"><img src="' + t.src + '" alt="第 ' + t.page + ' 页">' +
        '<figcaption>第 ' + t.page + ' 页</figcaption></figure>';
    }).join('');
    U.modal('扫描件 · ' + T.name,
      U.notice('warn', 'alert', '<b>' + U.esc(res.reason || '这份文件没有文字层（扫描件或照片）') + '</b>，浏览器本地读不到字。' +
        '把原件上的文字粘贴进来就能解析，也可以直接按原件逐项填写。') +
      (thumbs ? '<div class="scan-strip">' + thumbs + '</div>' : '') +
      '<div id="scanProg"></div>' +
      '<div class="field"><label>粘贴报告文字' +
      '<span class="pf-sub">扫描 App 的「识别文字」、PDF 阅读器的「复制」都可以</span></label>' +
      '<textarea id="pasteTx" rows="5" placeholder="例如：感觉调节：一般问题；基础机制与区辨：一般问题；运用能力：一般问题"></textarea></div>',
      [{
        label: '用本机识别引擎读字', cls: 'primary', onClick: function () {
          if (!R.ocr || !R.ocr.supported()) { U.toast('当前浏览器不支持本机识别，请粘贴文字或手工填写', 'warn'); return; }
          var box = document.getElementById('scanProg');
          if (box) box.innerHTML = '<div class="pb-detail">正在准备识别引擎（首次约需十几秒）…</div>';
          R.parse.ocr(res.thumbs || [], function (i, t, r) {
            if (!box) return;
            box.innerHTML = '<div class="pb-detail">已识别第 ' + i + ' / ' + t + ' 页' +
              (r && r.conf ? '（置信度 ' + r.conf + '）' : '') + '…</div>';
          }).then(function (o) {
            if (chars(o.text) < 12) {
              if (box) box.innerHTML = '<div class="pb-detail">没能读出可用文字，可粘贴文字或手工填写。</div>';
              U.toast('识别结果为空，换更清晰的扫描件或粘贴文字', 'warn');
              return;
            }
            stepConfirm(T, meta, date,
              { text: o.text, pages: res.pages || 1, kind: 'ocr', ocrConf: o.conf },
              R.parse.extract(T.key, o.text, { ocr: true }));
          }).catch(function (e) {
            if (box) box.innerHTML = '<div class="pb-detail">识别失败：' + U.esc(e.message || e) + '</div>';
            U.toast('识别失败，可粘贴文字或手工填写', 'warn');
          });
        }
      }, {
        label: '解析这段文字', onClick: function () {
          var tx = (document.getElementById('pasteTx') || {}).value || '';
          if (chars(tx) < 12) { U.toast('粘贴的文字太短，先粘完整段落再解析', 'warn'); return; }
          stepConfirm(T, meta, date, { text: tx, pages: res.pages || 1, kind: 'paste' },
            R.parse.extract(T.key, tx));
        }
      }, {
        label: '直接手工填写', onClick: function () {
          stepConfirm(T, meta, date, { text: '', pages: res.pages || 1, kind: 'manual' },
            { fields: {}, conf: {}, ev: {}, note: '' });
        }
      }]);
  }

  /* 解析结果校对 */
  function stepConfirm(T, meta, date, res, parsed) {
    var P = parsed || { fields: {}, conf: {}, ev: {}, meta: {}, note: '' };
    var total = T.fields.length, hit = 0;

    /* 按"园所关心什么"分组渲染，避免几十个字段平铺 */
    var groups = [];
    T.fields.forEach(function (f, i) {
      var gname = f.g || '';
      var last = groups[groups.length - 1];
      if (!last || last.name !== gname) { last = { name: gname, items: [] }; groups.push(last); }
      last.items.push({ f: f, i: i });
    });

    var grid = groups.map(function (grp) {
      return (grp.name ? '<div class="pf-sec-t">' + U.esc(grp.name) + '</div>' : '') +
        '<div class="pf-grid">' + grp.items.map(function (o) {
          var f = o.f, i = o.i;
      var v = P.fields[f.k] !== undefined ? P.fields[f.k] : '';
      if (!v && f.t === 'date' && date && (f.k === '评估日期' || f.k === '就诊日期')) v = date;
      if (f.t === 'select' && v && f.opts.indexOf(v) < 0) v = '';
      if (v) hit++;
      var cf = v ? (P.conf[f.k] || 'manual') : 'none';
      var chip = cf === 'high' ? '<span class="pf-c g">已识别</span>'
        : cf === 'mid' ? '<span class="pf-c a">建议核对</span>'
          : cf === 'manual' ? '<span class="pf-c">手填</span>'
            : '<span class="pf-c gray">未识别</span>';
      var input;
      if (f.t === 'select') {
        input = '<select id="pf' + i + '">' + [''].concat(f.opts).map(function (o) {
          return '<option' + (o === v ? ' selected' : '') + '>' + U.esc(o) + '</option>';
        }).join('') + '</select>';
      } else if (f.t === 'textarea') {
        input = '<textarea id="pf' + i + '" rows="2" placeholder="' + U.esc(f.ph || '') + '">' + U.esc(v) + '</textarea>';
      } else {
        input = '<input type="' + (f.t === 'number' ? 'number' : f.t === 'date' ? 'date' : 'text') +
          '" id="pf' + i + '" value="' + U.esc(v) + '" placeholder="' + U.esc(f.ph || '') + '">';
      }
      var ev = P.ev[f.k];
          return '<div class="field' + (f.t === 'textarea' ? ' span2' : '') + '"><label>' + U.esc(f.k) + chip + '</label>' +
            input + (ev ? '<div class="pf-ev" title="' + U.esc(ev) + '">原文：' + U.esc(String(ev).slice(0, 90)) + '</div>' : '') +
            '</div>';
        }).join('') + '</div>';
    }).join('');

    var stat = res.kind === 'manual' ? '手工录入'
      : (res.kind === 'paste' ? '粘贴文字 ' : res.kind === 'ocr' ? '本机识别 ' : '文字层 ') +
        (res.kind === 'paste' ? '' : (res.pages || 1) + ' 页 · ') + chars(res.text) + ' 字' +
        (res.ocrConf ? ' · 置信度 ' + res.ocrConf : '');

    U.modal('解析结果校对 · ' + T.name,
      '<div class="pf-head"><span class="pf-file">' + U.icon('doc', 14) + ' ' + U.esc(meta.file) + '</span>' +
      '<span class="pf-stat">' + stat + ' · 识别到 <b>' + hit + ' / ' + total + '</b> 个字段</span></div>' +
      (P.note ? U.notice('warn', 'alert', U.esc(P.note)) : '') +
      (chars(res.text) ? U.fold('查看识别到的原文（' + chars(res.text) + ' 字）',
        '<pre class="pf-raw">' + U.esc(String(res.text).slice(0, 3000)) + '</pre>',
        { plain: true, tag: '点开核对' }) : '') +
      '<div class="pf-grid">' + grid + '</div>' +
      U.note('「建议核对」是合计或推算出来的值（例如病理行为项数按五项相加），扫一眼再确认；其余值都能回到原文那一行。'),
      [{
        label: '重新上传', onClick: function () { stepUpload(T); }
      }, {
        label: '清空重填', onClick: function () {
          stepConfirm(T, meta, date, { text: '', pages: 1, kind: 'manual' },
            { fields: {}, conf: {}, ev: {}, note: '' });
        }
      }, {
        label: '确认并写入档案', cls: 'primary', onClick: function () {
          var fields = {};
          T.fields.forEach(function (f, i) {
            var el = document.getElementById('pf' + i);
            fields[f.k] = el ? String(el.value).trim() : '';
          });
          var filled = Object.keys(fields).filter(function (k) { return fields[k]; }).length;
          if (!filled) { U.toast('请至少核对填写 1 个字段', 'warn'); return; }
          saveReportNow(T.key, meta, fields, {
            text: res.text || '', ev: P.ev, conf: P.conf, kind: res.kind || 'manual',
            chars: chars(res.text), ocrConf: res.ocrConf
          });
          U.closeModal();
          U.toast(T.name + '：' + filled + ' 个字段已写入档案', 'ok');
          R.render();
        }
      }]);
  }

  /* 建档中（还没创建档案）→ 暂存；已建档 → 直接写入 */
  function saveReportNow(key, meta, fields, extra) {
    if (mode() === 'new') {
      R.tabState.pendingReports = R.tabState.pendingReports || {};
      R.tabState.pendingReports[key] = { pendingMeta: meta, pendingFields: fields, pendingExtra: extra };
      U.toast('已暂存，创建档案时一并写入', 'ok');
      return;
    }
    R.store.saveReport(key, meta, fields, extra);
  }

  /* 示例报告文字：不用文件也能走完同一套解析 */
  R.actions.sampleReport = function (key) {
    var T = type(key);
    if (!T || !R.parse.samples[key]) return;
    var text = R.parse.samples[key];
    stepConfirm(T, { file: '示例报告文字（' + T.name + '）.txt', size: '', pages: 1 }, '',
      { text: text, pages: 1, kind: 'paste' }, R.parse.extract(key, text));
  };

  R.actions.uploadReport = function (key) {
    var T = type(key);
    if (!T) return;
    if (!R.store.role().canEdit && R.store.role().key !== 'parent') {
      U.toast('当前身份为只读，不能上传材料', 'warn'); return;
    }
    stepUpload(T);
  };

  R.actions.removeReport = function (key) {
    var r = R.store.report(key);
    if (!r) return;
    U.modal('移除报告',
      U.notice('warn', 'alert', '将移除「' + U.esc(r.file) + '」及其解析字段，完整度会相应下降。原件不受影响。'),
      [{
        label: '确认移除', cls: 'danger', onClick: function () {
          R.store.removeReport(key);
          U.closeModal();
          U.toast('已移除', 'ok');
          R.render();
        }
      }]);
  };

  R.actions.viewParse = function (key) {
    var r = R.store.report(key);
    if (!r) return;
    var T = type(key);
    var rows = Object.keys(r.fields || {}).map(function (k) {
      var v = r.fields[k];
      var ev = r.ev && r.ev[k];
      return '<tr><th>' + U.esc(k) + '</th><td>' + (v ? U.esc(v) : '<span class="muted">未填</span>') +
        (ev ? '<div class="pf-ev" title="' + U.esc(ev) + '">原文：' + U.esc(String(ev).slice(0, 80)) + '</div>' : '') +
        '</td></tr>';
    }).join('');
    U.drawer((T ? T.name : key) + ' · 解析字段',
      '<div class="small muted" style="margin-bottom:10px">' + U.esc(r.file) + ' · 上传于 ' + U.esc(r.uploadedAt) +
      ' · 报告日期 ' + U.esc(r.date || '—') +
      (r.kind ? ' · 解析方式 ' + U.esc(kindName(r.kind) || r.kind) : '') +
      (r.chars ? ' · ' + r.chars + ' 字' : '') + (r.ocrConf ? ' · 置信度 ' + r.ocrConf : '') + '</div>' +
      '<table class="table kv-table compact"><tbody>' + rows + '</tbody></table>' +
      (r.text ? U.fold('识别到的原文（' + String(r.text).length + ' 字）',
        '<pre class="pf-raw">' + U.esc(String(r.text).slice(0, 3000)) + '</pre>', { plain: true, tag: '点开对照' }) : '') +
      U.note('字段与原文双向对应：任何一条都能回到报告原件核对；原件由园所按规定保管。'));
  };

  R.actions.applySuggest = function (m) {
    var n = R.store.applySuggest(m || 'empty');
    if (!n) { U.toast('没有需要更新的维度（已有所分的维度不会被"只补空缺"覆盖）', 'warn'); return; }
    U.toast('已按解析结果更新 ' + n + ' 个维度', 'ok');
    R.render();
  };

  R.actions.addMaterial = function () {
    U.modal('登记其他材料',
      '<div class="field"><label>材料名称</label><input type="text" id="matName" placeholder="如 听力筛查报告"></div>' +
      '<div class="field"><label>类别</label><select id="matCat">' +
      ['① 医学诊断', '② 教育评估', '③ 教师观察', '④ 家长观察', '其他'].map(function (x) {
        return '<option>' + x + '</option>'; }).join('') + '</select></div>' +
      U.notice('info', 'info', '这里只做"登记"：材料原件仍由园所按规定保管，系统只记录它存在、何时收到、解析到什么程度。'),
      [{
        label: '登记', cls: 'primary', onClick: function () {
          var n = document.getElementById('matName').value.trim();
          if (!n) { U.toast('请填写材料名称', 'warn'); return; }
          R.store.addMaterial(n, document.getElementById('matCat').value);
          U.closeModal();
          U.toast('已登记：' + n, 'ok');
          R.render();
        }
      }]);
  };

  /* 兼容：旧列表里的"概要"入口改成跳转档案 */
  R.actions.caseDetail = function (id) {
    if (id && R.store.switchCase(id)) {
      R.tabState['archive'] = 'overview';
      R.render();
    }
  };

})(window.RIEP);
