/* ============================================================
   suggest.js · 会议纪要与建议解析（大白话也认）
   输入：教师随手写的会议纪要，或家长 / 专家的大白话建议
   处理：① 先判断这句话要动成稿的哪个板块（八块）
         ② 再判断具体改什么（字段 / 目标 / 策略 / 频次 / 主责 / 标准）
         ③ 给出"现在是什么 → 改成什么"，教师逐条确认后才写回
   原则：只做"定位 + 落到已有目标或章节"，不编造原文没有的结论；
        每条都带回原话，改了什么全部留痕。
   ============================================================ */
(function (R) {
  'use strict';
  var E = R.engine;
  var KW = R.GOAL_KW || {};

  var ROLES = ['融合教师', '资源教师', '班级教师', '小组教师', '密训教师', '感统教师', '家长'];

  /* ---------- 成稿的八个板块：一句话要先落到这里 ---------- */
  var PLAN = [
    { key: 'base', name: '一、幼儿基础信息',
      re: /基本信息|基础信息|个案信息|档案信息|姓名|化名|名字|班级|分班|入园|出生|性别|诊断|特殊情况|制定日期|拟定日期|成稿日期/ },
    { key: 'ability', name: '二、幼儿能力分析',
      re: /评估分析|能力分析|现有能力|能力描述|优势|薄弱|短板|强项|评估结论/ },
    { key: 'long', name: '三、长期发展目标',
      re: /长期目标|长期发展|学期目标|总目标|融合目标|小组目标|整合目标/ },
    { key: 'short', name: '四、短期目标',
      re: /短期目标|短期具体|月目标|阶段目标|具体目标|近阶段目标/ },
    { key: 'strategy', name: '四、支持策略',
      re: /支持策略|教育策略|教学策略|干预策略|园内策略|家庭策略|怎么教|做法|手段/ },
    { key: 'service', name: '五、支持服务与责任分工',
      re: /服务安排|服务支持|课时|排课|分工|主责|责任人|谁负责|谁来上|抽离|陪读|资源教室/ },
    { key: 'family', name: '六、家长协作事项',
      re: /家校配合|家长协作|家长配合|家园配合|家庭配合|家长任务|家长会|家长签字|知情同意/ },
    { key: 'review', name: '七、检视与复审',
      re: /复盘周期|复盘|复审|复评|检视|评估周期|多久看|回顾一次|学期末|期中|每月看|每周看|再看一次/ }
  ];

  function planOf(s) {
    var best = null, bi = 1e9;
    PLAN.forEach(function (p) {
      var m = String(s).match(p.re);
      if (m && m.index < bi) { bi = m.index; best = p; }
    });
    return best;
  }

  /* 基础信息可改的字段 */
  var FIELDS = [
    { prop: 'alias', name: '幼儿姓名', re: /姓名|化名|名字|改名/ },
    { prop: 'cls', name: '班级', re: /班级|分班|班型/ },
    { prop: 'iepDate', name: 'IEP 制定日期', re: /制定日期|拟定日期|成稿日期/ },
    { prop: 'enrollDate', name: '入园时间', re: /入园时间|入园日期|入园/ },
    { prop: 'birthday', name: '出生日期', re: /出生日期|生日|出生/ },
    { prop: 'gender', name: '性别', re: /性别/ },
    { prop: 'dx', name: '特殊情况说明', re: /诊断|特殊情况|障碍类型/ }
  ];

  /* 生活化补充词：会议上的原话往往不是报告用词（"吃饭""嚼""感统课"） */
  var KW2 = {
    YD: /感统课|感统训练|个训|大运动|体育|户外|操场|早操|跳|爬|扔|接球|平衡/,
    YY: /说话|开口|词|句子|不讲|不会说|发音|问答|叫名字|应名/,
    SJ: /一起玩|打招呼|问好|问候|找小朋友|互动|躲|不理|自己玩/,
    ZL: /吃饭|进餐|午餐|加餐|点心|喂|含|吐水|喝水|勺|碗|挑食|嚼|咽|洗手|擦|尿|大便|午睡|穿|脱|收拾|整理/,
    RZ: /数数|点数|认字|绘本|看书|故事|积木|拼图|画画|颜色|形状|配对|分类|数/,
    QX: /感统|发脾气|闹|哭|急躁|捂耳|转圈|坐不住|注意力|情绪|发火|急|焦虑|逃避|过渡|转换/
  };

  /* 意图：一条建议可能同时说两件事（频次 + 主责），按优先级取最多 2 个 */
  var INTENTS = [
    { kind: 'defer', label: '延后到学期后段', test: /下学期|以后再|以后再说|暂缓|推迟|放到下学期|学期后段|先放一放|先放放|先不做|本学期先不|这学期先不|缓缓/ },
    { kind: 'criteria', label: '调整通过标准', test: /(\d+)\s*(次|个|秒|分钟|口|下|回|遍|步|轮)|(\d+)\s*%|百分之|正确率|成功率|达成率/ },
    { kind: 'ease', label: '降低难度 / 分步', test: /降低|减少|先别|别急|慢一点|简单|拆小|拆成|分解|分步|不加码|维持|放慢|少一点|太难|做不到|跟不上|定太高|别定太高|放低/ },
    { kind: 'raise', label: '提高要求', test: /提高|加强|增加|再加|多一点|提升|加大|延长|加码|往上|再练/ },
    { kind: 'freq', label: '调整练习频次', test: /每周|每星期|每天|每日|一天|每[一二三四五六两]|一周|频次|几次|多加|加练/ },
    { kind: 'duty', label: '明确主责', test: /谁负责|由谁|交给|主责|负责|哪位老师|谁来做/ },
    { kind: 'strategy', label: '补充支持策略', test: /步骤图|流程图|视觉提示|提示卡|图片卡|计时器|倒计时|安静角|休息角|耳罩|降噪|同伴|小伙伴|示范|做给他看|旁白|代币|奖励|贴纸|强化物|手势|座位|分组|轮流|等待|排队|前庭|感统|本体|提醒|鼓励|表扬|催促|催|慢慢|等一等|同一句|一起玩/ },
    { kind: 'home', label: '家庭配合', test: /家里|在家|家长|家园|妈妈|爸爸|回家|睡前|饭桌|小区|出门|接送/ }
  ];

  /* 大白话 → 可执行策略短语（让"土话"落到成稿里仍然专业、可观察） */
  var STRAT = [
    { test: /步骤图|流程图|图示|贴出来/, t: '把这件事做成 3 步步骤图，贴在活动区，按图执行' },
    { test: /视觉提示|提示卡|图片卡|卡片/, t: '配一张视觉提示卡，提示时先指卡片再说，逐步撤除' },
    { test: /计时器|倒计时|还有\s*\d?\s*分钟/, t: '用计时器做提前预告（2 分钟、1 分钟各一次）' },
    { test: /安静角|休息角|冷静|休息一下/, t: '设一个安静角，配计时器，允许主动去休息 2–3 分钟后再回来' },
    { test: /耳罩|降噪|太吵|噪音|嘈杂/, t: '嘈杂环节提供降噪耳罩，座位远离音箱与门口' },
    { test: /同伴|小伙伴|一起玩|小朋友/, t: '固定 2 名温和同伴做搭档，先缩小互动圈再逐步扩展' },
    { test: /示范|做给他看|旁白|先做一遍/, t: '教师先做一次完整示范并旁白，再逐步后退' },
    { test: /代币|奖励|贴纸|强化物|表扬|鼓励/, t: '用班级统一的奖励方式，达成即给，并说清做对了什么' },
    { test: /前庭|感统|跳一跳|爬|推拉|本体/, t: '集体活动前先做 5 分钟前庭本体活动' },
    { test: /轮流|等待|排队|轮到/, t: '用"轮到你 / 等一下"的视觉提示，一次只练 3 个回合' },
    { test: /催|催促|慢慢|等一等|别急/, t: '不催促，留足等待时间（不少于 10 秒），用同一句提示语' },
    { test: /提醒|提示/, t: '全班/家园用同一句提示语，提醒次数按周递减' },
    { test: /先做|再做|顺序|作息/, t: '固定"先……再……"的顺序，做成视觉日程贴在固定位置' }
  ];

  var NUM = /(\d+)\s*(次|个|秒|分钟|口|下|回|遍|步|轮|%|％)/;

  function splitSents(text) {
    return String(text || '').split(/[。！？!?；;\n\r]+/)
      .map(function (x) { return x.replace(/^[\s\-•·*,，、]+/, '').trim(); })
      .filter(function (x) { return x.length >= 4; });
  }

  function core(s) {
    return s.replace(/^(另外|还有|然后|就是|我觉得|我们觉得|建议|希望|能不能|可不可以|能不能让|可不可以让|让|请|关于|对于|就是|他说|她说|家长说|老师说)/, '')
      .replace(/[，,。；;！？]$/, '').trim().slice(0, 60);
  }

  function clean(v) {
    var t = String(v || '').trim();
    t = t.replace(/^[“"「『]\s*/, '').replace(/\s*[”"」』]$/, '');
    t = t.replace(/[。；;，,！!？?、\s]+$/, '');
    return t.trim();
  }

  /* 「加一条短期目标，能在提示下等待轮流」取出来会带上前面的栏位名，
     这里把栏位名、序号、"一条"之类的头削掉，只留真正的目标内容 */
  var HEAD_RE = /^(?:短期目标|长期目标|融合目标|小组目标|整合目标|能力分析|现有优势|优势能力|优势|薄弱项|薄弱|发展需求|需求|目标|该条|这条|一条)[，,：:、；;\s]*/;
  function stripHead(v) {
    var t = String(v || '');
    for (var i = 0; i < 2; i++) t = t.replace(HEAD_RE, '');
    return t.trim();
  }

  /* 从一句话里取出"改成什么" */
  function valueOf(s) {
    var t = String(s);
    var m = t.match(/(?:改成|改为|换成|换为|写成|写作|写清楚|写明|写上|补充|补一句|补上|加一句|加上|加一条|增加一条|添一条|应该是|应为|变成|定为|调整为|修改为)\s*[:：]?\s*(.+)$/);
    if (m) return stripHead(clean(m[1]));
    m = t.match(/[:：]\s*(.+)$/);
    if (m) return stripHead(clean(m[1]));
    m = t.match(/(?:^|[，,；;])\s*(?:是|叫)\s*(.+)$/);
    if (m) return stripHead(clean(m[1]));
    return '';
  }

  /* 一句话里可能同时点两个领域（"大运动、语言都要改"），全部收下 */
  function domainsOf(s) {
    var out = [];
    R.DOMAINS.forEach(function (d) {
      if ((KW[d.code] && KW[d.code].test(s)) || (KW2[d.code] && KW2[d.code].test(s))) out.push(d.code);
    });
    return out;
  }

  function domainOf(s) {
    return domainsOf(s)[0] || '';
  }

  function allNumbers(s) {
    var re = /\d+/g, m, o = [];
    while ((m = re.exec(String(s || '')))) o.push(+m[0]);
    return o;
  }

  function replaceNth(s, val, which) {
    var re = /\d+/g, m, pos = [];
    while ((m = re.exec(String(s || '')))) pos.push({ i: m.index, len: m[0].length });
    if (!pos.length) return null;
    var t = (which === 'last' && pos.length > 1) ? pos[pos.length - 1] : pos[0];
    return String(s).slice(0, t.i) + val + String(s).slice(t.i + t.len);
  }

  function numIn(s) {
    var m = String(s || '').match(NUM);
    if (m) return { n: +m[1], unit: m[2] };
    var p = String(s || '').match(/百分之\s*([0-9]+)|([0-9]+)\s*%/);
    if (p) return { n: +(p[1] || p[2]), unit: '%' };
    return null;
  }

  function stratPhrase(s) {
    for (var i = 0; i < STRAT.length; i++) if (STRAT[i].test.test(s)) return STRAT[i].t;
    return '';
  }

  function isHome(s) { return /家里|在家|家长|家园|妈妈|爸爸|回家|睡前|出门/.test(s); }

  function pickGoal(code) { return E.domainGoal(code); }

  /* 纪要里经常直接点编号（"社交-1 这条太高"），优先按编号找目标 */
  function goalById(s) {
    var t = String(s || '');
    var list = (R.store.get().goals || []).filter(function (g) { return g.status !== 'dropped'; });
    for (var i = 0; i < list.length; i++) {
      var id = list[i].id;
      if (t.indexOf(id) >= 0) return list[i];
    }
    /* "社交第一条""第三个目标"之类指代不清，不做猜测，交给维度逻辑 */
    return null;
  }

  /* 第三条 → 2（0 基）；最后一/最后一条 → last */
  function parseOrdinal(s) {
    var t = String(s || '');
    if (/最后一?条|末条|最末/.test(t)) return 'last';
    var m = t.match(/第\s*([0-9一二三四五六七八九十]+)\s*条/);
    if (!m) return -1;
    var v = m[1];
    if (/^\d+$/.test(v)) return parseInt(v, 10) - 1;
    var cn = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10 }[v];
    return cn ? cn - 1 : -1;
  }

  /* 该维度当前一页纸上的文字（用于"现在是什么"） */
  /* 成稿这一栏现在的原文：分段返回（原稿一个自然段 = 一条） */
  function nowParas(code, side) {
    var arr = side === 'family-s' ? R.engine.familyCells('strength')
      : side === 'family-n' ? R.engine.familyCells('need')
        : R.engine.abilityCells(code, side);
    return (arr || []).map(function (c) { return String(c.t || '').trim(); })
      .filter(function (t) { return t; });
  }
  function nowCells(code, side) {
    return nowParas(code, side).join('；');
  }

  /* ---------- 板块专属：基础信息 ---------- */
  function baseItem(s) {
    var f = null, fi = 1e9;
    FIELDS.forEach(function (x) {
      var m = s.match(x.re);
      if (m && m.index < fi) { fi = m.index; f = x; }
    });
    if (!f) return null;
    var v = valueOf(s);
    if (!v || v.length < 1) return null;
    /* 「2026 年 11 月 20 日」这类中文日期统一成档案里的 2026-11-20 格式 */
    if (f.prop === 'iepDate') {
      var dm = v.match(/(\d{4})\s*[年\-\/.]\s*(\d{1,2})\s*[月\-\/.]\s*(\d{1,2})/);
      if (dm) v = dm[1] + '-' + ('0' + dm[2]).slice(-2) + '-' + ('0' + dm[3]).slice(-2);
    }
    var beforeMap = {
      alias: R.CASE.name || R.CASE.alias, cls: R.CASE.cls, enrollDate: R.CASE.enrollDate,
      birthday: R.CASE.birthday, gender: R.CASE.gender, dx: R.CASE.dx,
      iepDate: (R.CASE.iepDate || '（按当天自动生成）')
    };
    return [{
      kind: 'caseField', plan: 'base', planName: '一、幼儿基础信息',
      field: f.prop, fieldName: f.name, goalId: '', domain: '',
      quote: s, before: String(beforeMap[f.prop] || '—'), after: v,
      why: '读到「' + core(s) + '」，判定为修改基础信息里的「' + f.name + '」。'
    }];
  }

  /* ---------- 板块专属：能力分析 ---------- */
  function abilityItem(s, code) {
    var side = /优势|强项|擅长|比较好|不错|好的地方|会自己|已经能|能独立/.test(s) ? 'strength'
      : /薄弱|不足|问题|短板|弱项|困难|不行|老样子|还不会/.test(s) ? 'need' : '';
    if (!side) side = 'strength'; /* 没表态时按"补一条好的"处理，教师可在卡片上改 */
    var v = valueOf(s);
    /* 「认知这块薄弱项是数数只能到 10」：`是` 前面是栏位名而不是句首，
       valueOf 的 `^是` 分支接不住，这里按「栏位名 + 是/为/有」再取一次 */
    if (!v) {
      var m2 = s.match(/(?:薄弱项|薄弱|优势|强项|短板|弱项|不足|能力)[^是为]{0,8}(?:是|为|有)\s*[:：]?\s*(.+)$/);
      if (m2) v = clean(m2[1]);
    }
    if (!v || v.length < 3) {
      /* 只说"重新写一下"、没给新内容：按现有材料给出一版新写法，让人确认 */
      if (code && wantAbilityEdit(s)) return rewriteAbility(s, code, side);
      return null;
    }
    /* 你给的是"重新写 + 新内容"时，应按替换处理，而不是追加到原条目后面 */
    var mode = (/改成|改为|换成|替换|不要写/.test(s) || REWRITE_RE.test(s)) ? 'replace' : 'append';
    var sideName = side === 'strength' ? '现有优势' : '薄弱与发展需求';
    return [{
      kind: 'abilityCell', plan: 'ability', planName: '二、幼儿能力分析',
      field: side, fieldName: sideName, mode: mode, goalId: '', domain: code || '',
      quote: s,
      before: (code ? nowCells(code, side) : '（未指明维度，将写到六个维度的对应栏）') || '（当前为空）',
      after: v,
      why: '读到「' + core(s) + '」，按你给的原话' + (mode === 'replace' ? '替换' : '补充') +
        (code ? R.domainName(code) + '「' + sideName + '」栏' : '能力分析对应栏') +
        '，系统不改写、不添字。'
    }];
  }

  /* ---------- 「重新写一下」：不给她新内容，也要能给出可确认的新写法 ---------- */
  var REWRITE_RE = /重新写|重写|改写|再写|写一遍|重新组织|重新整理|重新描述|重新表述|优化|润色|精简|压缩|提炼|归纳|换个说法|表述|写法|通顺|口语|太啰嗦|太长/;
  /* "写具体一点""写得详细些"也算重写意图，但要带上"写/详细一点"这类搭配，
     避免把"具体情况是…"这种观察陈述误判成重写 */
  var STYLE_RE = /(?:写|写得|写得更|补充|再).{0,3}(?:具体|详细)|(?:具体|详细)(?:一点|一些|点)|展开写|写详细|写具体/;
  /* 能力分析这一栏的改写类说法：重新写 / 写具体 / 不要写某条 / 只写某条 / 精简到 N 条 */
  var ABILITY_EDIT_RE = /不要写|不要提|不用写|别提|别写|不写|去掉|删掉|只写|只保留|只留|只列|精简到|压缩到|控制在|最多/;
  function wantRewrite(s) { return REWRITE_RE.test(s) || STYLE_RE.test(s); }
  function wantAbilityEdit(s) { return wantRewrite(s) || ABILITY_EDIT_RE.test(s); }

  /* 口语 → 书面（只换说法，不换事实：做不到的仍然写在薄弱栏）。
     注意：像"特别→较""还行→基本达成"这类会改变判断强度的替换一律不做，
     否则重写后就成了另一句话，教师会觉得"跟我说的不一致"。 */
  var ORAL = [
    [/[，,]\s*(?:并且|而且|然后|同时)/g, '，'],
    [/(^|[，,])\s*(?:不太会|不太能|还不会|不会)/g, '$1尚未掌握'],
    [/还是/g, '仍'],
    [/老是|总是/g, '经常'],
    [/会自己/g, '能独立'],
    [/一点点|一点儿/g, '少量']
  ];

  /* 一句一格：先在句号处断，长的再在逗号处贪心凑到 ~32 字，
     绝不从词中间切断（之前"集体户外操"被削成半句就是这个原因） */
  function oralClean(t) {
    var s = String(t || '').replace(/^[\s\d.、,，;；()（）]+/, '').trim();
    s = s.replace(/^(该幼儿|幼儿|孩子|个案|他|她)/, '');
    s = s.replace(/^(并且|而且|然后|另外|还有|同时)/, '');
    s = s.replace(/^(可以|能够)/, '能');
    ORAL.forEach(function (x) { s = s.replace(x[0], x[1]); });
    return s.replace(/[。；;，,、]+$/, '').trim();
  }

  /* 老师的原稿常在两句之间漏标点（"……多步指令可以清晰表达……"），
     这里在"可以 / 能够"前面补一个断点，避免重写后两件事挤成一句 */
  function softBreak(t) {
    return String(t || '')
      /* 原文里残留的 "2." "3、" 编号 → 当句号用，别把编号留在正文里 */
      .replace(/([\u4e00-\u9fa5）)”；;])\s*\d+\s*[.、．](?!\d)\s*/g, '$1。')
      .replace(/(可以|能够)/g, function (m, w, off, whole) {
        var prev = whole.slice(0, off);
        var last = Math.max(prev.lastIndexOf('。'), prev.lastIndexOf('，'),
          prev.lastIndexOf('；'), prev.lastIndexOf('\n'));
        var seg = prev.slice(last + 1);
        /* 前面以「）」「"」收尾的多半是补充说明，"可以"是它的谓语，不能在这儿断 */
        if (/[）)」”"]$/.test(seg)) return m;
        return (seg.length >= 10 ? '。' : '') + m;
      });
  }

  function sentences(text) {
    var out = [];
    String(softBreak(text) || '').split(/[。；;\n\r]+/).forEach(function (p) {
      p = oralClean(p);
      if (p.length < 2) return;
      if (p.length <= 32) { out.push(p); return; }
      var cur = '';
      p.split(/[，,]/).forEach(function (c) {
        c = c.trim();
        if (!c) return;
        if (!cur) cur = c;
        else if ((cur + '，' + c).length <= 32) cur += '，' + c;
        else { out.push(cur); cur = c; }
      });
      if (cur) out.push(cur);
    });
    return out;
  }

  /* 重写成教师手稿那种一条一行的短句。
     关键约束：**以成稿里现在这一栏的原文为准，全部要点保留**——只断句、去口语、
     省主语、统一书面语，不删条、不换序、不新增事实。以前会 "挑 2 条" 导致
     "现在 5 条、改为 2 条"，教师看到的就是"和我说的不一致"。
     但老师明确说了"不要写 X""只写 Y""精简到 3 条"时，按老师的要求筛，不擅自加戏。 */
  function rewriteAbility(s, code, side) {
    var cur = String(nowCells(code, side) || '').trim();
    var cells = (E.abilityCells(code, side) || []).filter(function (c) { return !c.empty; });
    if (!cur && !cells.length) return null;

    /* 以成稿这一栏现有的段落为基准：一段一条，不拆句、不并段 */
    var all = nowParas(code, side);
    if (!all.length) return null;

    var total = all.length, notes = [];

    /* ① 点名不要的：把含这些词的那一条剔掉（老师说什么就按什么办） */
    var dm = s.match(/(?:不要写|不要提|不用写|别提|别写|去掉|删掉|删除|不写)\s*[:：]?\s*([^。；;，,]{1,14})/);
    if (dm) {
      var ks = splitKeys(dm[1]);
      if (ks.length) {
        var kept = all.filter(function (t) {
          return !ks.some(function (k) { return keyHit(t, k); });
        });
        if (kept.length < all.length) {
          all = kept;
          notes.push('按你说的删掉含「' + ks.join('、') + '」的条目');
        }
      }
    }

    /* ② 点名只要的：只保留含这些词的条目，别的先不写 */
    var om = s.match(/(?:只写|只保留|只列|只留|主要写|重点写|重点是|着重写|突出)\s*[:：]?\s*([^。；;，,]{1,20})/);
    if (om) {
      var ok2 = splitKeys(om[1]);
      if (ok2.length) {
        var kept2 = all.filter(function (t) {
          return ok2.some(function (k) { return keyHit(t, k); });
        });
        if (kept2.length) { all = kept2; notes.push('按你说的只保留「' + ok2.join('、') + '」'); }
        else notes.push('原文里没找到含「' + ok2.join('、') + '」的条目，先原样保留全部');
      }
    }

    /* ③ 点名条数的：精简到 N 条，按原文顺序取前 N 条，不删事实、只收篇幅 */
    var cm = s.match(/(?:精简到|压缩到|删到|保留|只留|最多|控制在)\s*([1-6一二三四五六两])\s*条/);
    if (cm) {
      var n = ({ '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6 })[cm[1]] || parseInt(cm[1], 10);
      if (n && all.length > n) { all = all.slice(0, n); notes.push('按你说的收成 ' + n + ' 条（其余条目仍在画像页可查）'); }
    }

    if (!all.length) return null;

    var sideName = side === 'strength' ? '现有优势能力' : '现存薄弱问题与发展需求';
    var word = (s.match(REWRITE_RE) || ['重新写'])[0];
    var beforeTxt = nowParas(code, side).join('\n');
    var more = notes.length
      ? '；' + notes.join('；')
      : '，措辞一个字没动（这条没说要改成什么，只按原稿段落重新排列）';
    var extra = /具体|详细|展开|丰富|补充|举例|专业/.test(s)
      ? '　如果你要的是"补具体表现"，规则版只能整理现有事实，请在「改为」里直接补一句。' : '';
    return [{
      kind: 'abilityCell', plan: 'ability', planName: '二、幼儿能力分析',
      field: side, fieldName: sideName, mode: 'replace',
      goalId: '', domain: code, quote: s,
      before: beforeTxt,
      after: all.join('\n'),
      why: '读到「' + word + '」，以成稿里' + R.domainName(code) + '「' + sideName + '」现有的 ' + total + ' 段为基准：' +
        '一段一条、顺序不变，改为 ' + all.length + ' 条' + more + '。' +
        '想改哪一段，直接在「改为」里改，改完再采纳。' + extra
    }];
  }

  /* "跑跳、户外和拍球" → ['跑跳','户外','拍球']；过短的词不当关键词，避免误删 */
  function splitKeys(t) {
    return String(t || '').replace(/[「」“”"'（）()]/g, '')
      .split(/[、,，和及/或]/)
      .map(function (x) { return x.trim(); })
      .filter(function (x) { return x.length >= 2; });
  }

  /* 老师口语里的"精细动作""大运动"是维度名，原文里不一定出现这几个字，
     要按这一类动作的特征词去匹配，否则"不要写精细动作"会一条都删不掉 */
  var CAT_RE = {
    '精细动作': /搓|揉|黏土|捏|拼图|拿取|拿捏|双手|涂色|剪|折纸|扣|握笔|串珠|插|手指|小物件|抓握|对捏|精细/,
    '大运动': /跑|跳|爬|投|踢|平衡|单脚|双脚|走|操|律动|球|攀|户外|蹲|站/,
    '语言': /说|讲|词|句|发音|表达|语言|沟通|指令/,
    '社交': /同伴|朋友|互动|轮流|合作|社交|招呼|分享/,
    '自理': /穿|脱|吃|喝|洗手|如厕|整理|收拾|午睡|进餐/,
    '认知': /数|形状|颜色|配对|分类|绘本|理解|记忆/,
    '情绪': /情绪|哭|闹|发脾|焦虑|攻击|自伤|急躁/
  };
  function keyHit(t, k) {
    if (CAT_RE[k]) return CAT_RE[k].test(t);
    if (t.indexOf(k) >= 0) return true;
    /* "跑跳"在原文里常写成"跑、跳"，两个字都在就算命中 */
    if (k.length === 2) return t.indexOf(k.charAt(0)) >= 0 && t.indexOf(k.charAt(1)) >= 0;
    return false;
  }

  /* ---------- 板块专属：长期目标 ---------- */
  function longItem(s, code, g) {
    if (!code || !g) return null;
    var field = /融合/.test(s) ? 'fusion' : /小组/.test(s) ? 'group'
      : /整合|本学期|总目标/.test(s) ? 'integrated' : 'integrated';
    var fieldName = { fusion: '融合目标', group: '小组目标', integrated: '整合后本学期目标' }[field];
    var v = valueOf(s);
    var short = /精简|压缩|太长|啰嗦|简短|写短|概括/.test(s);
    if (!v && !short) return null;
    if (!v) {
      /* 只说"太长"：把现有目标压成一口气能读完的一句 */
      var old = String(g[field] || g.text || '');
      v = old.replace(/[。；]/g, '，').slice(0, 46).replace(/[，、]$/, '') + '…';
    }
    return [{
      kind: 'longGoal', plan: 'long', planName: '三、长期发展目标',
      field: field, fieldName: fieldName, goalId: g.id, domain: code,
      quote: s, before: String(g[field] || '—'), after: v,
      why: '读到「' + core(s) + '」，定位到' + R.domainName(code) + '的「' + fieldName + '」。'
    }];
  }

  /* ---------- 板块专属：短期目标 ---------- */
  function shortItem(s, code, g) {
    if (!g) return null;
    var add = /加一条|增加一条|补一条|添一条|再加一条|新增/.test(s);
    var del = /删掉|删除|去掉|不要这条|取消这条|这条不要/.test(s);
    var v = valueOf(s);
    if (!add && !del && !v) return null;
    var list = (g.shorts || []).map(function (x) { return x.t; });
    if (del) {
      var k = parseOrdinal(s);
      if (k === 'last') k = list.length - 1;
      if (k < 0 || k >= list.length) {
        k = -1;
        list.forEach(function (t, i) { if (v && t.indexOf(v.slice(0, 6)) >= 0) k = i; });
      }
      if (k < 0 || !list.length) return null;
      return [{
        kind: 'shortDrop', plan: 'short', planName: '四、短期目标',
        field: 'shorts', fieldName: '短期目标', goalId: g.id, domain: code || g.domain,
        quote: s, before: list[k], after: '（删除这一条）', dropIndex: k,
        why: '读到「' + core(s) + '」，定位到 ' + g.id + ' 的第 ' + (k + 1) + ' 条短期目标。'
      }];
    }
    var crit = (s.match(/[（(]([^）)]{2,20})[）)]/) || [])[1] || '';
    return [{
      kind: 'shortAdd', plan: 'short', planName: '四、短期目标',
      field: 'shorts', fieldName: '短期目标', goalId: g.id, domain: code || g.domain,
      quote: s, before: '当前 ' + list.length + ' 条：' + (list.slice(0, 2).join('；') || '（空）') + (list.length > 2 ? '…' : ''),
      after: v || core(s), crit: crit,
      why: '读到「' + core(s) + '」，判定为给 ' + g.id + ' 追加一条 1–2 个月的短期目标。'
    }];
  }

  /* ---------- 板块专属：服务安排 ---------- */
  function serviceItem(s, code, g) {
    var roles = ROLES.filter(function (r) { return s.indexOf(r) >= 0; });
    var fm = s.match(/每\s*(周|星期|天|日|月)\s*([0-9一二三四五六两]+)?\s*次/);
    var out = [];
    if (roles.length && g) {
      out.push({
        kind: 'duty', plan: 'service', planName: '五、支持服务与责任分工',
        field: 'owner', fieldName: '主责老师', goalId: g.id, domain: code || g.domain,
        quote: s, before: g.owner || '—', after: roles.join(' / '),
        why: '读到「' + core(s) + '」，判定为把主责交给 ' + roles.join('、') + '。'
      });
    }
    if (fm && g) {
      var cn = { '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6 }[fm[2]] || +fm[2] || '';
      var after = '每' + fm[1] + (cn ? ' ' + cn + ' 次' : '');
      if (after !== (g.frequency || '')) {
        out.push({
          kind: 'freq', plan: 'service', planName: '五、支持服务与责任分工',
          field: 'frequency', fieldName: '频次', goalId: g.id, domain: code || g.domain,
          quote: s, before: g.frequency || '—', after: after,
          why: '读到「' + core(s) + '」，判定为服务频次调整。'
        });
      }
    }
    if (out.length) return out;
    /* 只说了服务层面的事（课时/抽离/陪读）：写进第五章 */
    return [sectionItem(s, 'duty', '五、支持服务与责任分工', 'service')];
  }

  /* ---------- 落到成稿某章的补充段 ---------- */
  /* 补充段的内容要把「家校配合增加」「支持策略里加入」这类板块引导词剥掉，
     只留真正的建议内容，避免整句原话进成稿 */
  function stripSec(v) {
    var t = String(v || '');
    for (var i = 0; i < 2; i++) {
      t = t.replace(/^(?:家校配合|家长配合|家长协作|家园配合|家庭配合|支持策略|服务安排|支持服务|复盘周期|检视与复审|短期目标|长期目标)[里中]?[，,：:、；;\s]*/, '')
        .replace(/^(?:增加|加入|补充|添加|加|增|改成|改为|换成|调整|写进?|要|需要)[，,：:、；;\s]*/, '');
    }
    return t.trim();
  }
  function sectionItem(s, sec, title, planKey, after) {
    var raw = after || valueOf(s) || core(s);
    return {
      kind: 'section', plan: planKey || sec, planName: title,
      fieldName: title.replace(/^[一二三四五六七]、/, ''),
      sec: sec, secTitle: title, goalId: '', domain: '',
      quote: s,
      before: '（当前章节无此内容）',
      after: stripSec(raw) || raw,
      why: '这句话谈的是' + title.replace(/^[一二三四五六七]、/, '') + '层面的事，建议作为会议补充写进成稿。'
    };
  }

  /* 会上说的往往是观察而不是指令（"吃饭还是要老师喂"）：只要点了维度、
     又不是调整目标的口气，就当一条薄弱点补进能力分析，教师可改可删 */
  var STMT_RE = /还是|还不会|不会|不能|不敢|不愿意|不肯|经常|总是|偶尔|只会|依赖|需要|太|偏|弱|差|困难|睡不着|吃不下|坐不住|关注|重视|注意/;
  function needItem(s, code) {
    if (!STMT_RE.test(s)) return null;
    var t = core(s);
    if (t.length < 4) return null;
    return {
      kind: 'abilityCell', plan: 'ability', planName: '二、幼儿能力分析',
      field: 'need', fieldName: '现存薄弱问题与发展需求', mode: 'append', goalId: '', domain: code,
      quote: s,
      before: nowCells(code, 'need') || '（当前为空）',
      after: t,
      why: '读到「' + t + '」，是一句观察陈述，建议补进' + R.domainName(code) + '「薄弱与发展需求」栏。'
    };
  }

  /* 说了要改，但没点名哪个领域 / 哪个目标：不丢句子，
     按意图落到成稿对应章节的「会议补充」，保证"写了就改得动" */
  function sectionFallback(s, pl, code, ms) {
    if (code) return null;
    var kinds = (ms || []).map(function (x) { return x.kind; });
    function has(k) { return kinds.indexOf(k) >= 0; }

    if (pl && (pl.key === 'long' || pl.key === 'short') && valueOf(s)) {
      return sectionItem(s, pl.key === 'long' ? 'long' : 'short', pl.name, pl.key, valueOf(s));
    }
    if (has('strategy') || has('home')) {
      return sectionItem(s, 'short', '四、支持策略', 'strategy', stratPhrase(s) || valueOf(s) || core(s));
    }
    if (has('duty') || has('freq')) {
      return sectionItem(s, 'duty', '五、支持服务与责任分工', 'service', valueOf(s) || core(s));
    }
    if (pl && pl.key === 'review') {
      return sectionItem(s, 'review', '七、检视与复审', 'review', valueOf(s) || core(s));
    }
    return null;
  }

  /* 按一个意图造一条目标调整项（原有能力：标准 / 难度 / 策略 / 频次 / 主责 / 延后） */
  function build(s, code, g, it) {
    var old = g.criteria || '—';
    var nu = numIn(s);
    var after = '', before = old, why = '', same = false;

    if (it.kind === 'criteria') {
      if (nu) {
        var rep = replaceNth(old, nu.n, 'first');
        after = rep || (old === '—' ? nu.n + nu.unit : old + '；' + nu.n + nu.unit);
        same = (after === old);
        if (same) return null;
      } else {
        after = old === '—' ? core(s) : old + '；（会议）' + core(s);
      }
      why = '读到「' + core(s) + '」，判定为通过标准调整。';
    } else if (it.kind === 'ease' || it.kind === 'raise') {
      var nums = allNumbers(old);
      if (!nums.length) {
        var nu2 = numIn(s);
        if (nu2) nums = [nu2.n];
      }
      if (nums.length) {
        var base = nums[nums.length - 1];
        var nb = it.kind === 'ease'
          ? Math.max(1, Math.round(base * 0.7 / 5) * 5 || Math.max(1, base - 1))
          : Math.max(base + 1, Math.round(base * 1.4));
        after = replaceNth(old, nb, nums.length > 1 ? 'last' : 'first') || old;
        why = '读到「' + core(s) + '」，按' + (it.kind === 'ease' ? '降低难度' : '提高要求') +
          '把通过数 ' + base + ' 调为 ' + nb + '（系统只改数量口径，是否合适由团队确认）。';
      } else {
        after = (it.kind === 'ease' ? '降低要求：' : '提高要求：') + old;
        why = '读到「' + core(s) + '」，原标准里没有可换算的数字，只加了方向标记，建议人工补一条可数标准。';
      }
    } else if (it.kind === 'strategy') {
      var ph = stratPhrase(s) || core(s);
      after = '（会议建议）' + ph;
      before = isHome(s) ? '（家庭策略暂无此条）' : '（园内策略暂无此条）';
      why = '读到「' + core(s) + '」，转写成可执行策略，补到' + (isHome(s) ? '家庭配合策略' : '园内支持策略') + '。';
    } else if (it.kind === 'home') {
      after = '（会议建议）' + core(s);
      before = '（家庭策略暂无此条）';
      why = '读到「' + core(s) + '」，属于家庭场景，补到家庭配合策略。';
    } else if (it.kind === 'freq') {
      var fm = s.match(/每\s*(周|星期|天|日|月)/);
      if (fm) {
        var u = fm[1];
        var cn = (s.match(/(\d+)\s*次/) || [])[1] || '';
        if (!cn) {
          var cm = s.match(/[加多再]\s*([一二三四五六两])\s*次/) || s.match(/([一二三四五六两])\s*次/);
          if (cm) cn = { '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6 }[cm[1]] || '';
        }
        after = (u === '天' || u === '日') ? '每天' : ('每' + u + (cn ? ' ' + cn + ' 次' : ''));
      } else {
        after = core(s);
      }
      if (after === (g.frequency || '—')) return null;
      before = g.frequency || '—';
      why = '读到「' + core(s) + '」，判定为练习频次调整。';
    } else if (it.kind === 'duty') {
      var roles = ROLES.filter(function (r) { return s.indexOf(r) >= 0; });
      after = roles.length ? roles.join(' / ') : core(s);
      before = g.owner || '—';
      why = '读到「' + core(s) + '」，判定为主责分工调整。';
    } else if (it.kind === 'defer') {
      after = '降级为学期后段';
      before = '当前状态：' + ({ adopted: '已采纳', pending: '待审议', deferred: '已降级', dropped: '已忽略' }[g.status] || g.status);
      why = '读到「' + core(s) + '」，判定为本学期先不做，放到学期后段。';
    }
    if (!after) return null;
    return {
      kind: it.kind, label: it.label + (same ? '（与现行一致）' : ''),
      plan: 'goal', planName: '目标：' + g.id,
      goalId: g.id, domain: code,
      quote: s, before: before, after: after, why: why
    };
  }

  /* 一句话可能同时说两件事（"每周多加 2 次，由感统教师负责"），冲突的先消解再最多取 2 个 */
  function intentsOf(s) {
    var ms = INTENTS.filter(function (x) { return x.test.test(s); });
    var has = function (k) { return ms.some(function (x) { return x.kind === k; }); };

    if (/不再加码|不加码|别加码|不再加|别再提/.test(s)) ms = ms.filter(function (x) { return x.kind !== 'raise'; });
    if (has('freq')) ms = ms.filter(function (x) { return x.kind !== 'criteria'; });
    if (has('defer')) ms = ms.filter(function (x) { return x.kind !== 'ease' && x.kind !== 'raise'; });
    if (has('criteria')) ms = ms.filter(function (x) { return x.kind !== 'ease' && x.kind !== 'raise'; });

    var ie = -1, ir = -1;
    ms.forEach(function (x, i) { if (x.kind === 'ease') ie = i; if (x.kind === 'raise') ir = i; });
    if (ie >= 0 && ir >= 0) {
      var pe = s.search(ms[ie].test), pr = s.search(ms[ir].test);
      ms = ms.filter(function (x, i) { return i !== (pe <= pr ? ir : ie); });
    }
    if (has('strategy')) ms = ms.filter(function (x) { return x.kind !== 'home'; });
    return ms.slice(0, 2);
  }

  /* ---------- 主流程 ---------- */
  R.suggest = {
    plans: PLAN,

    analyze: function (text) {
      var items = [], pending = [], seen = {};

      function push(it) {
        if (!it || !it.after) return false;
        var k = (it.plan || '') + '|' + (it.goalId || '') + '|' + (it.field || '') + '|' + it.kind + '|' + it.after;
        if (seen[k]) return false;
        seen[k] = 1;
        it.key = 'sg' + items.length;
        items.push(it);
        return true;
      }

      /* 定位得到、但不敢自动改的句子：也做成一张卡放进结果里，
         让老师看到"系统读到了什么、卡在哪、准备怎么写"，而不是只回一句"没读懂" */
      function hold(s, opt) {
        opt = opt || {};
        if (seen['p|' + s]) return;
        seen['p|' + s] = 1;
        pending.push({
          pending: true,
          kind: opt.kind || 'section',
          plan: opt.plan || '', planName: opt.planName || opt.secTitle || '',
          field: opt.field || '', fieldName: opt.fieldName || '',
          goalId: opt.goalId || '', domain: opt.domain || '',
          sec: opt.sec || 'review', secTitle: opt.secTitle || '七、检视与复审',
          quote: s,
          before: opt.before || '',
          after: opt.after || '',
          why: opt.why || '',
          ask: opt.ask || '补一句「改成什么」，或在「改为」里直接写'
        });
      }

      splitSents(text).forEach(function (s) {
        var pl = planOf(s);
        var byId = goalById(s);
        var codes = domainsOf(s);
        var code = codes[0] || (byId ? byId.domain : '');
        var g = byId || (code ? pickGoal(code) : null);

        /* ① 命中成稿板块词：先按板块走 */
        if (pl) {
          var made = null;
          if (pl.key === 'base') made = baseItem(s);
          else if (pl.key === 'ability') {
            /* 一句话可能点了两个维度（"大运动、精细动作都要改"）→ 各出一张卡；
               只说"能力分析重新写一下"没点维度 → 把有内容的维度都重写一遍 */
            made = [];
            var cs = codes.slice();
            if (!cs.length && wantAbilityEdit(s)) {
              cs = R.DOMAINS.map(function (d) { return d.code; }).filter(function (c) {
                return (E.abilityCells(c, 'strength') || []).concat(E.abilityCells(c, 'need') || [])
                  .some(function (x) { return !x.empty; });
              });
            }
            (cs.length ? cs : ['']).forEach(function (c) {
              var r = abilityItem(s, c);
              if (r) made = made.concat(r);
            });
            if (!made.length) made = null;
          }
          else if (pl.key === 'long') made = longItem(s, code, g);
          else if (pl.key === 'short') made = shortItem(s, code, g);
          else if (pl.key === 'service') made = serviceItem(s, code, g);
          else if (pl.key === 'family') made = [sectionItem(s, 'parent', '六、家长协作事项', 'family')];
          else if (pl.key === 'review') made = [sectionItem(s, 'review', '七、检视与复审', 'review')];
          else if (pl.key === 'strategy') {
            /* 说了支持策略但没点名维度 → 作为全篇策略补充写进第四章 */
            if (!code) made = [sectionItem(s, 'short', '四、支持策略', 'strategy',
              stratPhrase(s) || valueOf(s) || core(s))];
          }

          if (made && made.length) {
            var n = 0;
            made.forEach(function (it) { if (push(it)) n++; });
            if (n) return;
          }
        }

        var ms = intentsOf(s);

        /* 说了删短期目标但没对上号：说清是几条，让人自己填 */
        if (pl && pl.key === 'short' && /删掉|删除|去掉|取消/.test(s)) {
          var gg = g || (code ? pickGoal(code) : null);
          if (gg) {
            var sl = (gg.shorts || []).map(function (x) { return x.t; });
            hold(s, {
              plan: 'short', planName: '四、短期目标', goalId: gg.id, domain: code || gg.domain,
              before: '当前 ' + sl.length + ' 条：' + (sl.slice(0, 2).join('；') || '（空）'),
              why: '读到「删掉」，但没对上要删的是第几条，系统不猜。',
              ask: '补一句「删第几条」，或在「改为」里写要删的那条原句'
            });
            return;
          }
        }

        /* ② 没点名领域：能落到章节的就落章节，不把句子丢掉 */
        var fb = sectionFallback(s, pl, code, ms);
        if (fb && push(fb)) return;

        if (!code) {
          hold(s, {
            sec: 'review', secTitle: '七、检视与复审',
            why: '这句话没点明要改哪一块，系统不自己猜。可以补一句属于哪个板块（基本信息 / 能力分析 / 长期目标 / 短期目标 / 支持策略 / 服务安排 / 家校配合 / 复盘周期）；' +
              '或者把希望成稿怎么表述直接写进「改为」，会作为会议补充落到第七章。'
          });
          return;
        }
        if (!g) {
          hold(s, {
            plan: 'ability', planName: '二、幼儿能力分析', domain: code,
            field: 'need', fieldName: '现存薄弱问题与发展需求', sec: 'ability', secTitle: '二、幼儿能力分析',
            before: nowCells(code, 'need') || '（当前为空）',
            why: R.domainName(code) + ' 还没有生成目标，落不到目标层；如果要补一句能力描述，写进「改为」即可。'
          });
          return;
        }

        /* ② 只说了"某某重新写一下"（没提能力分析四个字）：也按重写处理 */
        if (!ms.length && code && wantAbilityEdit(s)) {
          var rw = abilityItem(s, code);
          if (rw && rw.length) {
            var nw = 0;
            rw.forEach(function (it) { if (push(it)) nw++; });
            if (nw) return;
          }
        }

        /* ③ 有领域但不调目标：当观察陈述补进能力分析 */
        if (!ms.length) {
          var ni = needItem(s, code);
          if (ni && push(ni)) return;
          hold(s, {
            plan: 'ability', planName: '二、幼儿能力分析', domain: code,
            field: 'need', fieldName: '现存薄弱问题与发展需求', sec: 'ability', secTitle: '二、幼儿能力分析',
            before: nowCells(code, 'need') || '（当前为空）',
            why: '读到的是现象描述，没读出具体动作或数值，系统不敢替你改目标。' +
              '如果同意把这句补进「' + R.domainName(code) + ' · 薄弱与发展需求」，直接按下面的文案采纳即可。',
            after: core(s)
          });
          return;
        }

        var got = 0;
        ms.forEach(function (it) {
          var item = build(s, code, g, it);
          if (item && push(item)) got++;
        });
        if (!got) {
          /* 目标层面没落下，但话里有策略/做法 → 至少写进第四章 */
          var fb2 = sectionFallback(s, pl, '', ms);
          if (fb2 && push(fb2)) return;
          hold(s, {
            plan: 'short', planName: '四、短期目标', goalId: g.id, domain: code,
            before: g.id + ' 现行：' + (g.criteria || '—'),
            why: '读到「' + core(s) + '」，但换算后与现行标准一致，没产生变化。要换别的口径请补一句具体的数或做法。'
          });
        }
      });

      return { items: items, pending: pending, unclear: [] };
    },

    /* 采纳一条：写回目标、档案字段、能力格或成稿，返回一句话结果 */
    apply: function (item) {
      var ST = R.store;

      if (item.kind === 'section') {
        ST.pushAddendum(item.sec, item.after, '会议建议');
        return '成稿「' + item.secTitle + '」已补充一段';
      }
      if (item.kind === 'caseField') {
        var patch = {};
        patch[item.field] = item.after;
        ST.updateCase(patch);
        return '一、基础信息 · ' + item.fieldName + '：' + item.before + ' → ' + item.after;
      }
      if (item.kind === 'abilityCell') {
        if (!item.domain) {
          /* 没指明维度：六个维度都补，保证不漏 */
          R.DOMAINS.forEach(function (d) { ST.setDomainCell(d.code, item.field, item.after, item.mode); });
          return '二、能力分析：六个维度「' + (item.field === 'strength' ? '优势' : '薄弱') + '」栏均已写入';
        }
        ST.setDomainCell(item.domain, item.field, item.after, item.mode);
        return '二、能力分析 · ' + R.domainName(item.domain) + '：已' +
          (item.mode === 'replace' ? '替换为' : '补入') + '「' + item.after + '」';
      }

      if (item.kind === 'familyCell') {
        /* 家庭养育情况（成稿能力分析表最后一行）：append 只接新段，replace 整栏换 */
        ST.setFamilyCell(item.field, item.after, item.mode || 'append');
        return '二、能力分析 · 家庭养育情况：已' +
          (item.mode === 'replace' ? '替换为' : '补入') + '「' + item.after + '」';
      }

      if (item.kind === 'longAdd') {
        /* 新增一条长期目标：after 支持两行（目标内容 / 通过标准），只有一行时标准留待补。
           注意必须放在 goalId 存在性检查之前——新增类条目没有 goalId。 */
        var ls = String(item.after).split(/\r?\n+/).map(function (x) { return x.trim(); }).filter(Boolean);
        var gtext = ls[0] || String(item.after).trim();
        if (!gtext) return '目标内容为空，未写入';
        var gcrit = ls[1] || '（通过标准待补：建议写「4 次中 3 次达成」这类可测量口径）';
        var dom = item.domain || 'SJ';
        var base = (R.domainShort && R.domainShort(dom)) || R.domainName(dom), n = 1;
        var ids = {};
        ((ST.get && ST.get().goals) || []).forEach(function (x) { ids[x.id] = 1; });
        while (ids[base + '-' + n]) n++;
        var gid = base + '-' + n;
        ST.addGoal({
          id: gid, domain: dom, type: '会议新增', status: 'adopted',
          text: gtext, criteria: gcrit,
          measure: ['观察'], frequency: '每周 2 次（建议值）', owner: '班级教师',
          /* 成稿第三章渲染的是 fusion/group/integrated 三栏、第四章渲染 shorts：
             新目标必须同时落这三处，否则采纳后成稿看不到 */
          fusion: '', group: '', integrated: gtext, shortDetail: '',
          shorts: [{ t: gtext, c: gcrit }],
          meetingTag: '会议建议新增'
        });
        return '三、长期目标 · 新增 ' + gid + '（' + R.domainName(dom) + '）：' + gtext;
      }

      var g = ST.goal(item.goalId);
      if (!g) return '目标 ' + item.goalId + ' 已不存在，未写入';

      if (item.kind === 'longGoal') {
        var p = {}; p[item.field] = item.after;
        ST.updateGoal(g.id, p);
        return '三、长期目标 · ' + g.id + '「' + item.fieldName + '」：' + item.before + ' → ' + item.after;
      }
      if (item.kind === 'shortAdd') {
        ST.addShort(g.id, item.after, item.crit);
        return '四、短期目标 · ' + g.id + ' 追加一条：' + item.after;
      }
      if (item.kind === 'shortDrop') {
        var arr = (g.shorts || []).slice();
        arr.splice(item.dropIndex, 1);
        ST.updateGoal(g.id, { shorts: arr });
        return '四、短期目标 · ' + g.id + ' 已删除：' + item.before;
      }
      if (item.kind === 'criteria' || item.kind === 'ease' || item.kind === 'raise') {
        ST.updateGoal(g.id, { criteria: item.after, meetingTag: '会议建议调整' });
        return g.id + ' 通过标准：' + item.before + ' → ' + item.after;
      }
      if (item.kind === 'strategy') {
        if (isHome(item.quote)) {
          var a1 = (g.home || []).slice();
          if (a1.indexOf(item.after) < 0) a1.push(item.after);
          ST.updateGoal(g.id, { home: a1, meetingTag: '会议建议补充' });
          return g.id + ' 家庭配合策略 +1 条';
        }
        var a2 = (g.school || []).slice();
        if (a2.indexOf(item.after) < 0) a2.push(item.after);
        ST.updateGoal(g.id, { school: a2, meetingTag: '会议建议补充' });
        return g.id + ' 园内支持策略 +1 条';
      }
      if (item.kind === 'home') {
        var a3 = (g.home || []).slice();
        if (a3.indexOf(item.after) < 0) a3.push(item.after);
        ST.updateGoal(g.id, { home: a3, meetingTag: '会议建议补充' });
        return g.id + ' 家庭配合策略 +1 条';
      }
      if (item.kind === 'freq') {
        ST.updateGoal(g.id, { frequency: item.after, meetingTag: '会议建议调整' });
        return g.id + ' 频次：' + item.before + ' → ' + item.after;
      }
      if (item.kind === 'duty') {
        ST.updateGoal(g.id, { owner: item.after, meetingTag: '会议建议调整' });
        return g.id + ' 主责：' + item.before + ' → ' + item.after;
      }
      if (item.kind === 'defer') {
        ST.setGoalStatus(g.id, 'deferred');
        return g.id + ' 已降级为学期后段';
      }
      return '未识别的类型';
    }
  };

})(window.RIEP);
