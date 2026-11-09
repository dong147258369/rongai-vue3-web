/* ============================================================
   views/intake.js · 数据归集台
   四张结构不同的数据表 + 解析校对 + 观察表采集 + 缺口转待办
   ============================================================ */
(function (R) {
  'use strict';
  var U = R.ui;

  /* 字段校对清单（低置信度字段需人工确认） */
  R.FIELD_CHECK = [
    { key: 'm-dx', src: 'medical', field: '诊断结论', value: '疑似孤独症谱系（社交发起困难，存在情绪问题）', conf: 'high', ev: 'm1' },
    { key: 'm-rx', src: 'medical', field: '康复建议', value: '言语、社交、感觉统合训练；园内结构化支持', conf: 'low', ev: 'm2' },
    { key: 'p-total', src: 'assess', field: 'PEP-3 功能发展', value: '68 / 95；发展年龄 43 个月', conf: 'high', ev: 'p1' },
    { key: 'p-oral', src: 'assess', field: 'PEP-3 口语认知', value: '53 个月（−10 个月）', conf: 'high', ev: 'p2' },
    { key: 'p-pat', src: 'assess', field: 'PEP-3 病理行为', value: '感觉模式 2 项重度 / 2 项轻度', conf: 'low', ev: 'p8' },
    { key: 'v-stage', src: 'assess', field: 'VB-MAPP 里程碑总体', value: '第 3 阶段（30–48 个月）', conf: 'high', ev: 'v1' },
    { key: 'v-barr', src: 'assess', field: 'VB-MAPP 障碍评估', value: '中重度 1 项 / 中度 3 项 / 轻度 14 项', conf: 'low', ev: 'v6' }
  ];

  /* 只列当前档案确实有材料的字段：避免把土豆的分数串到别的档案 */
  function availFields() {
    var ms = R.CASE.materialStatus || {};
    var parts = (ms.assess && ms.assess.parts) || {};
    var medOn = ms.medical && ms.medical.state !== 'none';
    return R.FIELD_CHECK.filter(function (f) {
      if (f.src === 'medical') return !!medOn;
      if (f.src === 'assess') {
        if (f.key.indexOf('p-') === 0) return !!parts.pep3;
        if (f.key.indexOf('v-') === 0) return !!parts.vbmapp;
      }
      return true;
    });
  }

  /* 数据完整度：本页焦点 */
  function heroCompleteness() {
    var comp = R.engine.completeness();
    var parts = R.engine.completenessParts();
    var st = R.store.get();
    var conf = R.engine.confidence();
    var missObs = R.OBS_ORDER.filter(function (k) { return !st.obsFilled[k]; });
    var missName = missObs.map(function (k) { return R.OBS_TYPES[k].short + '观察表'; });
    var nextObs = missObs[0];
    var act = comp === 0
      ? '<button class="btn primary lg" data-act="goto" data-arg="archive">去档案登记材料</button>' +
        '<button class="btn lg" data-act="stepNext" data-arg="intake-profile">先看能力画像</button>'
      : missObs.length
      ? '<button class="btn primary lg" data-act="uploadObs" data-arg="' + nextObs + '">上传' +
        R.OBS_TYPES[nextObs].name + '</button>' +
        '<button class="btn lg" data-act="openObs" data-arg="' + nextObs + '">在线填报</button>' +
        '<button class="btn lg" data-act="setTab" data-arg="intake" data-arg2="gap">查看 ' + R.engine.gaps().length + ' 项缺口</button>' +
        '<button class="btn lg" data-act="stepNext" data-arg="intake-profile">就用现有数据算画像</button>'
      : (st.sensoryFixed
        ? '<button class="btn primary lg" data-act="stepNext" data-arg="intake-profile">看跨源能力画像</button>'
        : '<button class="btn primary lg" data-act="fixSensory">校对感统报告（约 10 分钟）</button>' +
          '<button class="btn lg" data-act="stepNext" data-arg="intake-profile">先看跨源能力画像</button>');
    var title = comp === 0
      ? '这份档案还没有材料：先上传医学诊断与评估报告'
      : missObs.length
        ? '还差' + missName.join('、') + '，补齐后草案置信度才能升到「高」'
        : (st.sensoryFixed ? '四类数据齐备，草案可直接用于 IEP 会议讨论'
          : '四类数据已回收，只差感统扫描件校对（不影响本期出稿）');
    return '<div class="hero' + (comp >= 85 && st.sensoryFixed ? ' done' : '') + '">' +
      '<div class="h-k">数据完整度 ' + comp + '% · 置信度 ' + conf.lv + '</div>' +
      '<div class="h-t">' + title + '</div>' +
      '<div class="h-d">' + U.progress(comp, comp >= 85 ? 't' : 'a') + '</div>' +
      '<div class="h-act">' + act + '</div>' +
      '<div class="h-side">' + conf.tip + '</div>' +
      U.fold('四类数据各自占多少分', '<div class="grid g4 mt8">' + parts.map(function (p) {
        return '<div><div class="small muted">' + U.esc(p.k) + '（权重 ' + p.v + '）</div>' +
          '<div style="font-weight:700">' + p.got + ' / ' + p.v + '</div>' +
          U.progress(Math.round(p.got / p.v * 100), p.got === p.v ? 't' : 'a') + '</div>';
      }).join('') + '</div>' +
      U.note('口径：医学诊断 25% · 教育评估 35%（PEP-3 / VB-MAPP 已结构化，感统按 2/3 计）· 教师观察 20% · 家长观察 20%。权重可在「合规与设置」中调整。'),
      { plain: true, tag: '点开查看' }) +
      '</div>';
  }

  function sourceCards() {
    var st = R.store.get();
    var m = st.materials;
    return '<div class="grid g2">' + R.SOURCES.map(function (s) {
      var stt = m[s.id];
      var isObs = (s.id === 'teacher' || s.id === 'parent');
      var filled = isObs && st.obsFilled[s.id];
      var tag, btn;
      if (isObs) {
        if (s.id === 'teacher') {
          var g1 = st.obsFilled.group, f1 = st.obsFilled.fusion;
          tag = (g1 && f1) ? ['两张都已回收', 'g'] : (g1 || f1) ? ['部分回收（1/2）', 'a'] : ['未填', 'gray'];
          btn = '<div class="btn-row">' + ['group', 'fusion'].map(function (k) {
            var T = R.OBS_TYPES[k], ok = st.obsFilled[k];
            return '<button class="btn sm' + (ok ? '' : ' primary') + '" data-act="openObs" data-arg="' + k + '">' +
              (ok ? '查看 ' : '填报 ') + U.esc(T.short) + '表</button>' +
              '<button class="btn sm ghost" data-act="uploadObs" data-arg="' + k + '">上传</button>';
          }).join('') + '</div>';
        } else {
          tag = filled ? ['已回收', 'g'] : ['未填', 'gray'];
          btn = '<div class="btn-row">' +
            '<button class="btn sm' + (filled ? '' : ' primary') + '" data-act="openObs" data-arg="parent">' +
            (filled ? '查看已提交内容' : '填报居家观察表') + '</button>' +
            '<button class="btn sm ghost" data-act="uploadObs" data-arg="parent">上传文件</button></div>';
        }
      } else if (s.id === 'medical') {
        var md = R.store.report('medical');
        tag = md ? ['已解析 · 已确认', 'g'] : ['未上传', 'gray'];
        btn = '<button class="btn ' + (md ? '' : 'primary') + '" data-act="uploadReport" data-arg="medical">' +
          (md ? '重新上传医学诊断' : '上传医学诊断') + '</button>';
      } else {
        var got = ['pep3', 'vbmapp', 'sensory'].filter(function (k) { return !!R.store.report(k); });
        tag = got.length === 3 ? ['已解析 · 已确认', 'g'] : got.length ? ['部分就绪（' + got.length + '/3）', 'a'] : ['未上传', 'gray'];
        var SHORT = { pep3: 'PEP-3', vbmapp: 'VB-MAPP', sensory: '感统' };
        btn = '<div class="btn-row">' + ['pep3', 'vbmapp', 'sensory'].map(function (k) {
          var has = !!R.store.report(k);
          return '<button class="btn sm' + (has ? '' : ' primary') + '" data-act="uploadReport" data-arg="' + k + '">' +
            (has ? '重传 ' : '上传 ') + SHORT[k] + '</button>';
        }).join('') + '</div>';
      }
      return '<div class="src-card">' +
        '<div class="num">' + s.idx + '</div>' +
        '<h4>' + U.esc(s.name) + ' ' + U.badge(tag[0], tag[1]) + '</h4>' +
        '<div class="meta-line"><span>' + U.esc(stt.note) + '</span></div>' +
        '<div style="margin-top:10px">' + btn + '</div>' +
        U.fold('这张表进来后做什么', U.panel(
          '<div class="kv"><b>关键字段</b><div>' + s.fields.map(U.esc).join('；') + '</div>' +
          '<b>引擎作用</b><div>' + U.esc(s.role) + '</div>' +
          '<b>缺失时</b><div>' + U.esc(s.missing) + '</div>' +
          '<b>来源</b><div>' + U.esc(s.side) + ' · ' + U.esc(s.formats) + '</div></div>'),
        { plain: true, tag: '点开查看' }) +
        '</div>';
    }).join('') + '</div>';
  }

  /* ---------- 三张观察表：上传原件 或 在线填报 ---------- */
  function obsCards() {
    var st = R.store.get();
    var canEdit = R.store.role().canEdit || R.store.role().key === 'parent';
    return '<div class="card"><div class="card-head"><h3>' + U.icon('doc', 16) + ' 观察表（三张）</h3>' +
      '<span class="desc">园所现用表单 · 支持上传原件自动解析，也支持在线填报</span></div>' +
      '<div class="obs-pick">' + R.OBS_ORDER.map(function (k) {
        var T = R.OBS_TYPES[k];
        var ok = st.obsFilled[k];
        var f = (st.obsFiles || {})[k];
        var ob = (st.observation || {})[k] || {};
        var n = Object.keys(ob).filter(function (d) { return ob[d] && (ob[d].strength || ob[d].need); }).length;
        return '<div class="obs-pick-c' + (ok ? ' done' : '') + '">' +
          '<div class="op-h">' + U.esc(T.name) +
          (ok ? '<span class="op-tag ok">已回收</span>' : '<span class="op-tag">待回收</span>') + '</div>' +
          '<div class="op-d">' + U.esc(T.by) + ' · ' + T.dims.length + ' 个维度 · ' +
          '已填 ' + n + ' / ' + T.dims.length + '</div>' +
          '<div class="op-f">' + (f ? '原件：' + U.esc(f.file) + '（' + U.esc(f.kind || '') +
            (f.ocrConf ? ' · 置信度 ' + f.ocrConf : '') + '）' : '尚未上传原件') + '</div>' +
          '<div class="btn-row mt8">' +
          (canEdit ? '<button class="btn sm" data-act="uploadObs" data-arg="' + k + '">' +
            (f ? '重新上传' : '上传原件') + '</button>' : '') +
          '<button class="btn sm' + (ok ? '' : ' primary') + '" data-act="openObs" data-arg="' + k + '">' +
          (ok ? '查看 / 修改' : '在线填报') + '</button>' +
          '</div></div>';
      }).join('') + '</div>' +
      U.note('三张表维度不同、不能互相替代：小组班看集体教学情境，融合班看半融合情境，家长表补家庭情境。' +
        '上传 Word 原件按表格读两栏最准；PDF / 图片会用本机识别读字，结果先填进表里等你核对后才入档。') +
      '</div>';
  }

  function materialTable() {
    var st = R.store.get();
    var extra = st.extraMaterials || [];
    return '<div class="card"><div class="card-head"><h3>' + U.icon('doc', 16) + ' 材料清单</h3>' +
      '<span class="desc">' + R.CASE.materials.length + ' 份 · 全部已回收</span>' +
      '<div class="right">' + (R.store.role().canEdit ? '<button class="btn primary sm" data-act="uploadMaterial">+ 上传材料</button>' : '') + '</div></div>' +
      '<div class="table-scroll"><table class="table"><thead><tr><th>材料</th><th>归类</th><th>状态</th><th>系统处理方式</th></tr></thead><tbody>' +
      R.CASE.materials.map(function (m) {
        return '<tr><td>' + U.esc(m.name) + '</td><td>' + U.badge(m.cat, 'b') + '</td>' +
          '<td>' + U.esc(m.state) + '</td><td class="small">' + U.esc(m.todo) + '</td></tr>';
      }).join('') +
      extra.map(function (m) {
        return '<tr><td>' + U.esc(m.name) + '</td><td>' + U.badge(m.cat, 't') + '</td>' +
          '<td>' + U.esc(m.state) + '</td><td class="small">' + U.esc(m.todo) + '</td></tr>';
      }).join('') +
      '</tbody></table></div>' +
      U.note('支持 PDF / Word / 文本上传：在本机读出文字层并抽成字段，解析结果进入「字段校对」逐项确认；扫描件与照片没有文字层，走粘贴文字或人工核对。') +
      '</div>';
  }

  function fieldCheckCard() {
    var st = R.store.get();
    st.fieldConfirmed = st.fieldConfirmed || {};
    var fs = availFields();
    if (!fs.length) {
      return '<div class="card"><div class="card-head"><h3>' + U.icon('check', 16) + ' 字段校对</h3></div>' +
        U.empty('这份档案还没有可校对的字段') +
        '<div class="small muted" style="text-align:center;margin-bottom:14px">' +
        '字段校对只对"已上传的材料"生效：先把医学诊断或评估报告登记进档案，系统解析后再逐项确认。</div>' +
        '<div class="center"><button class="btn primary" data-act="goto" data-arg="archive">去登记材料</button></div></div>';
    }
    var low = fs.filter(function (f) { return f.conf === 'low' && !st.fieldConfirmed[f.key]; });
    return '<div class="card"><div class="card-head"><h3>' + U.icon('check', 16) + ' 字段校对</h3>' +
      '<span class="desc">' + (low.length ? low.length + ' 个低置信度字段待确认' : '全部字段已确认') + '</span></div>' +
      '<div class="table-scroll"><table class="table compact"><thead><tr><th style="width:88px">来源</th><th style="width:158px">字段</th><th>解析值</th><th class="act" style="width:154px"></th></tr></thead><tbody>' +
      availFields().map(function (f) {
        var done = f.conf === 'high' || st.fieldConfirmed[f.key];
        return '<tr' + (done ? '' : ' style="background:#fffafc"') + '>' +
          '<td>' + U.srcBadge(f.src) + '</td><td>' + U.esc(f.field) + '</td>' +
          '<td>' + U.esc(f.value) + (done ? '' : ' ' + U.badge('低置信度', 'r')) + '</td>' +
          '<td class="act"><button class="btn sm ghost" data-act="evidence" data-arg="' + f.ev + '">回原文</button>' +
          (done ? '' : ' <button class="btn sm ok" data-act="confirmField" data-arg="' + f.key + '">确认</button>') +
          '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      U.note('原始文件与结构化字段双向跳转：任何字段都能点回原文位置。') +
      '</div>';
  }

  function gapCard() {
    var gaps = R.engine.gaps();
    var sensFixed = !!(R.store.get() || {}).sensoryFixed;
    return '<div class="card"><div class="card-head"><h3>' + U.icon('alert', 16) + ' 数据缺口 → 待办</h3>' +
      '<span class="desc">不虚构观察内容，把缺口变成待办</span></div>' +
      (gaps.length ? gaps.map(function (g) {
        return '<div class="todo"><div class="box"></div><div class="tx">' +
          '<b>' + U.esc(g.name) + '</b><p>' + U.esc(g.why) + '</p>' +
          '<p style="color:var(--brand)">建议动作：' + U.esc(g.act) + '</p></div></div>';
      }).join('') : '<div class="empty">暂无数据缺口，四类数据齐备。</div>') +
      '<div class="btn-row mt8">' +
      R.OBS_ORDER.map(function (k) {
        return '<button class="btn soft sm" data-act="openObs" data-arg="' + k + '">' +
          U.esc(R.OBS_TYPES[k].short) + '观察表</button>';
      }).join('') +
      '<button class="btn sm" data-act="fixSensory">' + (sensFixed ? '重新核对感统' : '校对感统报告') + '</button>' +
      '</div></div>';
  }

  /* ---------- 家长视角：只说家长要做的事 ---------- */
  function parentIntake() {
    var st = R.store.get();
    var filled = st.obsFilled.parent;
    var todo = ['医院诊断证明 / 复诊记录（拍照或 PDF）', '感统评估报告原件（拍照即可）', '最近一次听筛 / 视筛结果（如有）'];
    return U.pageHead({
      icon: 'intake', title: '我孩子的材料与观察',
      sub: '这里只放两件事：<b>需要你提供的材料</b>，和<b>你已经填过的内容</b>。'
    }) +
      '<div class="hero' + (filled ? ' done' : '') + '">' +
      '<div class="h-k">' + (filled ? '居家观察表已提交' : '还差居家观察表') + '</div>' +
      '<div class="h-t">' + (filled
        ? '你填的内容已交给老师，可以随时补充修改'
        : '填一张表，老师才能按孩子的实际情况定目标') + '</div>' +
      '<div class="h-d">' + (filled
        ? '老师看到的是你写的原话，不会被改写成专业术语；修改后会留下时间记录，方便老师知道哪一版最新。'
        : '一共 9 个生活场景，一屏 3–5 题，可以分几次填完；不确定的题写"说不好"也可以。') + '</div>' +
      '<div class="h-act"><button class="btn ' + (filled ? '' : 'primary ') + 'lg" data-act="openObs" data-arg="parent">' +
      (filled ? '查看 / 补充我填的内容' : '开始填写居家观察表') + '</button></div>' +
      '</div>' +

      '<div class="card"><div class="card-head"><h3>' + U.icon('intake', 16) + ' 还需要你补的材料</h3>' +
      '<span class="desc">拍了照上传就行，不用整理格式</span></div>' +
      '<ul class="plain-list">' + todo.map(function (t) {
        return '<li>' + U.esc(t) + '</li>';
      }).join('') + '</ul>' +
      '<div class="btn-row mt8"><button class="btn" data-act="uploadMaterial">拍照 / 上传</button></div>' +
      '</div>' +

      '<div class="card"><div class="card-head"><h3>' + U.icon('info', 16) + ' 你填的内容会怎么用</h3></div>' +
      '<div class="kv"><b>谁会看</b><div>本班老师、融合教师、园长；不会给其他家长看，也不会发到群里。</div>' +
      '<b>用在哪</b><div>写进孩子的 IEP：现在能做什么、下一步练什么、家里怎么配合。</div>' +
      '<b>能不能改</b><div>随时可以改；每次修改都会留时间记录，老师不会拿旧说法当新情况。</div>' +
      '<b>会不会被下结论</b><div>不会。系统只做整理和提示，诊断与结论以医院报告为准。</div>' +
      '</div></div>';
  }

  R.views.intake = {
    title: '数据归集台',
    render: function () {
      var role = R.store.role();
      if (role.key === 'parent') return parentIntake();
      var st = R.store.get();
      st.fieldConfirmed = st.fieldConfirmed || {};
      var low = availFields().filter(function (f) { return f.conf === 'low' && !st.fieldConfirmed[f.key]; }).length;
      var t = U.tab('intake', 'src');
      var tab = U.tabs('intake', [
        { key: 'src', label: '四类数据源' },
        { key: 'mat', label: '材料清单', n: R.CASE.materials.length + (st.extraMaterials || []).length },
        { key: 'field', label: '字段校对', n: low || undefined },
        { key: 'gap', label: '数据缺口', n: R.engine.gaps().length }
      ]);
      var body = t === 'mat' ? materialTable()
        : t === 'field' ? fieldCheckCard()
        : t === 'gap' ? gapCard()
        : sourceCards() + obsCards();

      return U.pageHead({
        icon: 'intake', title: '数据归集台',
        sub: '输入不是"上传一个文件"，而是<b>四张结构不同的数据表</b>。先解决"怎么进来"，才谈得上"怎么生成"。',
        action: role.canEdit ? '<button class="btn lg" data-act="uploadMaterial">' + U.icon('plus', 16) + ' 上传材料</button>' : ''
      }) +
        heroCompleteness() + tab + body +
        (role.canEdit ? '' : U.notice('info', 'info', '当前身份为只读：可填报观察表，但不可修改评估原始数据与解析字段。'));
    }
  };

  /* ---------- 动作 ---------- */

  R.actions.confirmField = function (key) {
    var st = R.store.get();
    st.fieldConfirmed = st.fieldConfirmed || {};
    st.fieldConfirmed[key] = true;
    R.store.save();
    var f = availFields().filter(function (x) { return x.key === key; })[0];
    R.store.log(R.store.role().short, '字段校对', '确认字段：' + (f ? f.field : key));
    U.toast('字段已确认', 'ok');
    R.render();
  };

  R.actions.viewFields = function (id) {
    var s = R.SOURCES.filter(function (x) { return x.id === id; })[0];
    if (!s) return;
    U.drawer(s.name + ' · 结构化字段',
      '<div class="small muted" style="margin-bottom:10px">' + U.esc(s.side) + ' · ' + U.esc(s.formats) + '</div>' +
      '<div class="kv"><b>关键字段</b><div>' + s.fields.map(function (f) {
        return '<div style="padding:3px 0;border-bottom:1px dashed var(--line)">' + U.esc(f) + '</div>';
      }).join('') + '</div>' +
      '<div class="divider"></div>' +
      '<div class="kv"><b>引擎作用</b><div>' + U.esc(s.role) + '</div>' +
      '<b>缺失时</b><div>' + U.esc(s.missing) + '</div></div>');
  };

  /* 上传入口：先选是哪一类，再走"上传 → 解析 → 确认" */
  R.actions.uploadMaterial = function () {
    var rows = R.REPORT_TYPES.map(function (T) {
      var r = R.store.report(T.key);
      return '<div class="pick-row" data-act="uploadReport" data-arg="' + T.key + '">' +
        '<div class="pr-tx"><b>' + U.esc(T.idx + ' ' + T.name) + '</b>' +
        '<span>' + U.esc(T.formats) + '</span></div>' +
        (r ? U.badge('已上传', 'g') : U.badge('待上传', 'gray')) + '</div>';
    }).join('');
    U.modal('上传材料（PDF / 图片 / Word / 纸质拍照）',
      U.notice('info', 'info', '先选材料类别：系统读取文件文字层并抽成字段（本机完成，不上传服务器），' +
        '<b>解析结果由你逐项确认后才进入能力指数与目标排序</b>。') +
      '<div class="pick-list">' + rows +
      '<div class="pick-row" data-act="addMaterial">' +
      '<div class="pr-tx"><b>其他材料</b><span>只登记"收到了什么"，不参与解析</span></div>' +
      U.badge('登记', 'gray') + '</div>' +
      '</div>', []);
  };

  /* 感统报告 OCR 校对（原 PEP-3 补评流程已被真实数据替代） */
  R.actions.fixSensory = function () {
    var st = R.store.get();
    if (!R.store.report('sensory')) {
      U.toast('这份档案还没有上传感统报告', 'warn');
      R.actions.uploadReport('sensory');
      return;
    }
    if (st.sensoryFixed) { /* 已校对过仍可重核，不拦 */ }
    U.modal((st.sensoryFixed ? '重新核对' : '校对') + '感统报告（5 页扫描件）',
      '<div class="notice ' + (st.sensoryFixed ? 'ok' : 'info') + '"><span class="ic">' + U.icon('info', 18) + '</span><div>' +
      (st.sensoryFixed
        ? '本机识别已完成（置信度 85）。如需对照原件再核一次，勾选三组后确认即可。'
        : '扫描件已识别，但三组评定等级需要人工核对。核对后：画像中的感觉统合证据由"待校对"转为可用，' +
          '情绪-1、运动-1 的相关条目会自动标注为"已对齐"（系统不自动改目标）。') + '</div></div>' +
      '<table class="table compact"><thead><tr><th>板块</th><th>识别结果</th><th>核对</th></tr></thead><tbody>' +
      '<tr><td>感觉调节</td><td class="small">视觉低反应、听觉高反应、触觉高反应、前庭觉低反应、本体觉低反应＝一般问题</td><td><input type="checkbox" class="sg"></td></tr>' +
      '<tr><td>基础机制与区辨</td><td class="small">姿势平衡、动眼协调、身体基模＝一般问题；身体意识＝正常</td><td><input type="checkbox" class="sg"></td></tr>' +
      '<tr><td>运用能力</td><td class="small">预测性动作计划＝一般问题；双侧整合、动作计划、构想、视觉运用＝正常</td><td><input type="checkbox" class="sg"></td></tr>' +
      '</tbody></table>' +
      '<div class="small muted mt8">三组都勾选后才能确认（避免"一键通过"式的假校对）。</div>',
      [{
        label: '确认校对完成', cls: 'primary', onClick: function () {
          var sgs = document.querySelectorAll('#modalBody .sg');
          var all = Array.prototype.every.call(sgs, function (x) { return x.checked; });
          if (!all) { U.toast('三组评定需逐项核对后勾选', 'warn'); return; }
          /* 把核对后的三组等级写回这份报告的解析结果（走同一套入档逻辑）。
             以已识别字段为底合并，只覆盖三组总评，避免把 24 个识别字段冲掉 */
          var rep = R.store.report('sensory');
          var merged = {};
          Object.keys(rep.fields || {}).forEach(function (k) { merged[k] = rep.fields[k]; });
          if (!merged['评估日期']) merged['评估日期'] = rep.date || '';
          merged['感觉调节'] = '一般问题';
          merged['基础机制与区辨'] = '一般问题';
          merged['运用能力'] = '一般问题';
          R.store.saveReport('sensory',
            { file: rep.file, pages: rep.pages, size: rep.size }, merged,
            { kind: rep.kind, ocrConf: rep.ocrConf, chars: rep.chars, text: rep.text, ev: rep.ev, conf: rep.conf });
          U.closeModal();
          U.toast('感统报告已校对，' + Object.keys(merged).filter(function (k) { return String(merged[k] || '').trim(); }).length + ' 个字段保留并入档', 'ok');
          R.render();
        }
      }]);
  };

})(window.RIEP);
