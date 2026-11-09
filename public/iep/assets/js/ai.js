/* ============================================================
   ai.js · 会议纪要 AI 解析（DeepSeek，浏览器直连，免后端）
   ------------------------------------------------------------
   数据流：会议纪要原文 → 脱敏（姓名/编号/生日不上传）
   → 附上成稿"可编辑字段清单"（id + 当前内容）发给大模型
   → 模型只输出 {edits:[{id, after, reason}], pending:[...]}
   → 按 id 映射回字段清单，生成与规则解析同结构的建议卡
   → 教师逐条确认后走 R.suggest.apply 写回（与规则版同一管道）。

   安全设计：
   ① 模型只能从字段清单里挑 id，改不了清单外任何内容；
   ② after 是字段完整新内容，未涉及条目要求原样保留；
   ③ 所有修改仍需教师点「采纳」，失败/断网自动回退规则解析。
   ============================================================ */
(function (R) {
  'use strict';
  /* 注意：本文件在 ui.js 之前加载，不能在顶层缓存 R.ui，用时再取 */

  /* 默认配置：DeepSeek 开放平台；Key 可在「AI 设置」里替换 */
  var DEFAULTS = {
    baseUrl: 'https://api.deepseek.com',
    apiKey: 'sk-302b4c81c3c24f13896fb96d3b276d5e',
    model: 'deepseek-flash'
  };

  function cfg() {
    var st = R.store.get();
    if (!st.ai) st.ai = {};
    Object.keys(DEFAULTS).forEach(function (k) { if (!st.ai[k]) st.ai[k] = DEFAULTS[k]; });
    return st.ai;
  }
  function saveCfg(c) {
    R.store.get().ai = c;
    R.store.save();
  }

  /* ---------- 脱敏：姓名 / 档案编号 / 生日不出本机 ---------- */
  function anon(text) {
    var t = String(text || '');
    var c = R.CASE;
    if (c) {
      var names = [c.name, String(c.alias || '').replace(/（化名）/g, '')];
      names.forEach(function (n) {
        if (n && n.length >= 2) t = t.split(n).join('该幼儿');
      });
      if (c.id) t = t.split(c.id).join('档案编号略');
      if (c.birthday) t = t.split(c.birthday).join('出生日期略');
    }
    return t;
  }

  /* ---------- 成稿可编辑字段清单（AI 只能从这里挑） ----------
     每个条目同时带有写回所需的 kind / field / goalId 等参数，
     与规则解析（suggest.js）产出的建议项完全同构。 */
  function registry() {
    var out = [];
    var c = R.CASE || {};

    /* 一、基础信息 */
    [['alias', '幼儿姓名'], ['cls', '班级'], ['iepDate', 'IEP 制定日期'],
     ['birthday', '出生日期'], ['gender', '性别'], ['dx', '特殊情况说明'],
     ['enrollDate', '入园时间'], ['planStart', '计划开始'], ['planEnd', '计划结束']]
      .forEach(function (f) {
        out.push({
          id: 'base.' + f[0], label: f[1], grp: '一、幼儿基础信息',
          cur: f[0] === 'alias' ? (c.name || c.alias || '') : (c[f[0]] || ''),
          kind: 'caseField', field: f[0], fieldName: f[1],
          plan: 'base', planName: '一、幼儿基础信息'
        });
      });

    /* 二、能力分析（六维 × 优势/薄弱 × 整栏改写 / 追加一条） */
    (R.DOMAIN_PROFILE || []).forEach(function (d) {
      [['strength', 'strengths', '现有优势能力'], ['need', 'needs', '薄弱与发展需求']]
        .forEach(function (s) {
          /* 当前内容 = 成稿显示的行（与表格逐字一致），不是存储原文 */
          var cur = R.engine.docAbilityLines(d.code, s[0]).join('\n') || '（本栏暂无条目）';
          /* 整栏改写：after = 全部条目（原有 + 修改） */
          out.push({
            id: 'ability.' + d.code + '.' + s[0],
            label: d.name + ' · ' + s[2] + '（整栏改写）', grp: '二、幼儿能力分析 · ' + d.name,
            cur: cur,
            kind: 'abilityCell', domain: d.code, field: s[0], mode: 'replace',
            fieldName: s[2], plan: 'ability', planName: '二、幼儿能力分析'
          });
          /* 追加一条：after 只写新增的那一条，系统自动接在原有条目后面 */
          out.push({
            id: 'ability.' + d.code + '.' + s[0] + 'Add',
            label: d.name + ' · ' + s[2] + '（追加一条）', grp: '二、幼儿能力分析 · ' + d.name,
            cur: cur,
            hint: '追加模式：after 只写新增的那一条（≤20 字），原有条目由系统保留，不要复述',
            kind: 'abilityCell', domain: d.code, field: s[0], mode: 'append',
            fieldName: s[2] + ' · 追加', plan: 'ability', planName: '二、幼儿能力分析'
          });
        });
    });

    /* 二、家庭养育情况（成稿能力分析表最后一行，字符串、\n 分段） */
    (function () {
      var fam = R.FAMILY_PROFILE || {};
      [['strength', 'strengths', '家庭养育 · 优势情况'], ['need', 'needs', '家庭养育 · 关注情况']]
        .forEach(function (s) {
          var cur = R.engine.docFamilyLines(s[0]).join('\n') || '（本栏暂无条目）';
          out.push({
            id: 'family.' + s[0], label: '家庭养育情况 · ' + s[2] + '（整栏改写）',
            grp: '二、幼儿能力分析 · 家庭养育情况',
            cur: cur,
            kind: 'familyCell', field: s[0], mode: 'replace',
            fieldName: s[2], plan: 'ability', planName: '二、幼儿能力分析'
          });
          out.push({
            id: 'family.' + s[0] + 'Add', label: '家庭养育情况 · ' + s[2] + '（追加一条）',
            grp: '二、幼儿能力分析 · 家庭养育情况',
            cur: cur,
            hint: '追加模式：after 只写新增的那一条（≤20 字），原有条目由系统保留，不要复述',
            kind: 'familyCell', field: s[0], mode: 'append',
            fieldName: s[2] + ' · 追加', plan: 'ability', planName: '二、幼儿能力分析'
          });
        });
    })();

    /* 三、新增长期目标（六维各一个入口，after 两行：目标内容 / 通过标准） */
    (R.DOMAINS || []).forEach(function (d) {
      out.push({
        id: 'goal.new.' + d.code, label: '新增一条 · ' + d.name, grp: '三、长期发展目标 · 新增入口',
        cur: '（新增，不影响现有目标；after 第一行=目标内容，第二行=通过标准）',
        kind: 'longAdd', fieldName: '新增长期目标', goalId: '', domain: d.code,
        plan: 'long', planName: '三、长期发展目标'
      });
    });

    /* 三~五、目标 / 策略 / 服务（按目标分组，便于模型对照成稿定位） */
    (R.store.get().goals || []).forEach(function (g) {
      if (g.status === 'dropped') return;
      var D = g.domain, id = g.id;
      var grp = '三~五、长期目标 ' + id + '（' + (R.domainName ? R.domainName(D) : D) + '）：' +
        String(g.text || '').slice(0, 40);
      out.push({
        id: 'goal.' + id + '.text', label: id + ' · 目标内容（第五章清单显示）', grp: grp, cur: g.text || '',
        kind: 'longGoal', field: 'text', fieldName: '目标内容', goalId: id, domain: D,
        plan: 'long', planName: '三、长期发展目标'
      });
      /* 成稿第三章的表格渲染的是这三栏（不是 text）：
         融合目标 / 小组目标 / 整合后本学期目标，改学期目标内容必须改这三栏 */
      [['fusion', '融合目标'], ['group', '小组目标'], ['integrated', '整合后本学期目标']].forEach(function (f) {
        out.push({
          id: 'goal.' + id + '.' + f[0], label: id + ' · ' + f[1] + '（第三章表格）', grp: grp,
          cur: String(g[f[0]] || '') || '（本栏暂无内容）',
          hint: '成稿第三章「' + f[1] + '」栏按领域合并显示该领域各目标的此栏、逐条编号',
          kind: 'longGoal', field: f[0], fieldName: f[1], goalId: id, domain: D,
          plan: 'long', planName: '三、长期发展目标'
        });
      });
      out.push({
        id: 'goal.' + id + '.criteria', label: id + ' · 通过标准', grp: grp, cur: g.criteria || '',
        kind: 'criteria', fieldName: '通过标准', goalId: id, domain: D,
        plan: 'short', planName: '四、短期目标'
      });
      out.push({
        id: 'goal.' + id + '.shortAdd', label: id + ' · 新增一条短期目标',
        grp: grp,
        cur: (g.shorts || []).map(function (x) { return x && x.t; }).filter(Boolean).join('\n') || '（本条目标还没有短期目标）',
        hint: '追加模式：after 只写新增的那一条',
        kind: 'shortAdd', fieldName: '新增短期目标', goalId: id, domain: D,
        plan: 'short', planName: '四、短期目标'
      });
      (g.shorts || []).forEach(function (s, i) {
        out.push({
          id: 'goal.' + id + '.shortDrop' + (i + 1),
          label: id + ' · 删除短期目标第 ' + (i + 1) + ' 条', grp: grp, cur: s.t,
          kind: 'shortDrop', dropIndex: i, fieldName: '删除短期目标', goalId: id, domain: D,
          plan: 'short', planName: '四、短期目标'
        });
      });
      out.push({
        id: 'goal.' + id + '.strategy', label: id + ' · 园内策略（追加一条）',
        grp: grp,
        cur: (g.school || []).join('\n') || '（暂无园内策略）',
        hint: '追加模式：after 只写新增的那一条',
        kind: 'strategy', fieldName: '园内支持策略', goalId: id, domain: D,
        plan: 'strategy', planName: '四、支持策略'
      });
      out.push({
        id: 'goal.' + id + '.home', label: id + ' · 家庭配合（追加一条）',
        grp: grp,
        cur: (g.home || []).join('\n') || '（暂无家庭配合）',
        hint: '追加模式：after 只写新增的那一条',
        kind: 'home', fieldName: '家庭配合', goalId: id, domain: D,
        plan: 'strategy', planName: '四、支持策略'
      });
      out.push({
        id: 'goal.' + id + '.frequency', label: id + ' · 服务频次（第五章）', grp: grp, cur: g.frequency || '',
        kind: 'freq', fieldName: '频次', goalId: id, domain: D,
        plan: 'service', planName: '五、支持服务与责任分工'
      });
      out.push({
        id: 'goal.' + id + '.owner', label: id + ' · 主责（第五章）', grp: grp, cur: g.owner || '',
        kind: 'duty', fieldName: '主责', goalId: id, domain: D,
        plan: 'service', planName: '五、支持服务与责任分工'
      });
    });

    /* 各章补充段 */
    [['basic', '一、幼儿基础信息', 'base'], ['short', '四、支持策略', 'strategy'], ['duty', '五、支持服务与责任分工', 'service'],
     ['parent', '六、家长协作事项', 'family'], ['review', '七、检视与复审', 'review']]
      .forEach(function (s) {
        out.push({
          id: 'section.' + s[0], label: '追加一段（不覆盖原内容）', grp: s[1],
          cur: '（追加，不覆盖原内容）',
          kind: 'section', sec: s[0], secTitle: s[1],
          fieldName: '补充段', plan: s[2], planName: s[1]
        });
      });
    return out;
  }

  /* ---------- 提示词 ---------- */
  function systemPrompt() {
    return [
      '你是学前融合教育（特殊教育）IEP 文书修订助手，熟悉国内特殊教育规范术语',
      '（个别化教育计划、融合教育、支持策略、同伴互动、指令理解、感觉统合、',
      '挫折耐受、辅助层级与撤除、代词使用、手口一致点数等）。',
      '任务：教师给出 IEP 会议纪要（自然语言建议），你通读附上的「成稿当前内容」，',
      '理解每句建议指的是成稿里的哪一处，自行定位到具体可编辑字段，',
      '并起草出「改后完整内容」，让教师点一下采纳就能写回成稿。',
      '',
      '定位规则——教师不会替你指路：',
      '· 教师纪要通常不说明要改哪张表、哪一条；你必须对照成稿当前内容理解建议指向哪里。',
      '· 建议提到某个行为/能力（如"会自己穿鞋了""还是不爱跟小朋友玩"），先到能力分析各栏里',
      '  找相关条目：是补一条优势、改一条薄弱，还是该目标领域加条目/改目标，按语义就近判断。',
      '· 建议提到某项安排（频次、日期、谁负责、家里练什么），对应到相应章节的字段。',
      '· "当前"列的内容与成稿显示逐字一致（能力分析一格最多 4 条、一条一句话），',
      '  修改时以这些当前内容为基准，不要凭空想象成稿里还有什么。',
      '',
      '核心要求——能起草就不要搁置：',
      'A. 教师的建议是口语、现象描述、甚至只有一句抱怨时，由你把它转写成规范、可观察、可测量的',
      '   IEP 表述，直接作为 after 给出。例如「土豆总是一个人待着，想办法让他跟小朋友玩起来」',
      '   → 起草社交领域的新目标/能力条目，如「在同伴示范与教师提示下，能在集体游戏中主动向同伴',
      '   发起互动（递玩具、邀请加入）」。',
      'B. 数量、频次、时长教师没给的，用保守、常见的一档作为建议值（如 4 次中 3 次、每周 2 次），',
      '   并在 reason 末尾注明「频次/标准为建议值，可在改为栏调整」。不要因为没给数字就搁置。',
      'C. 新增类建议（加一条目标、加一条策略、能力分析里补一句、家校配合加一项）必须选用',
      '   对应的"新增/追加"字段（goal.new.<领域>、goal.<id>.shortAdd、goal.<id>.strategy、',
      '   goal.<id>.home、ability.<领域>.strengthAdd/needAdd、family.strengthAdd/needAdd、section.*），',
      '   把完整草稿写进 after，一律不允许放进 pending。',
      '   其中 ability.*.strengthAdd / needAdd / family.*Add 是「追加一条」模式：after 只写新增的',
      '   那一条（一句话，≤20 字），原有条目由系统自动保留，绝对不要把原有条目复述进 after，',
      '   更不要改写、合并、精简原有条目。',
      'D. 整栏改写才用 ability.<领域>.strength/need、family.strength/need（不带 Add）：after 是该栏',
      '   全部条目，未被纪要提及的原有条目必须逐字原样保留，一条一行，只改纪要点名的内容。',
      '   教师说"再增加一条 / 补一句 / 再加"时一律选 *Add 字段，不要用整栏改写。',
      'E. 长期目标注意：成稿第三章表格显示的是「融合目标 / 小组目标 / 整合后本学期目标」三栏',
      '   （goal.<id>.fusion / group / integrated），不是 goal.<id>.text。改某条目标的学期内容时选',
      '   对应三栏字段；goal.<id>.text 只出现在第五章目标清单里。家庭养育情况是能力分析表最后一行，',
      '   用 family.* 字段。',
      'F. 只改纪要涉及的字段；纪要没提到的内容一律原样保留，绝不增删无关条目、不重排格式。',
      'G. goal.new.<领域> 字段的 after 固定两行：第一行=目标内容（一句话，含支持条件与行为），',
      '   第二行=通过标准（可测量）。',
      '',      '',
      'pending 只允许三种情况：①纪要自相矛盾或同时指向多个字段无法二选一；',
      '②建议与 IEP 文书完全无关（如后勤、排班）；③教师在纪要里明确说"先别改，下次再议"。',
      '除这三种情况外，所有建议都必须出现在 edits 里，pending 应当为空。',
      '',
      '只输出 JSON，不要输出其它任何文字，格式：',
      '{"edits":[{"id":"字段ID","after":"完整新内容","reason":"依据纪要哪一句 + 起草说明"}],',
      ' "pending":[{"id":"候选字段ID或空串","after":"草稿（可为空）","reason":"为什么拿不准"}]}'
    ].join('\n');
  }

  /* ---------- 调模型 ---------- */
  function errText(code, status) {
    if (status === 401) return 'API Key 无效，请到「AI 设置」检查';
    if (status === 402 || /insufficient/i.test(String(code))) return '账户余额不足：请到 DeepSeek 开放平台（platform.deepseek.com）充值后重试';
    if (status === 429) return '请求太频繁，稍等几秒再试';
    return '模型服务返回错误：' + code;
  }

  function chat(userText, ok, fail) {
    var c = cfg();
    if (!c.apiKey) { fail('还没有配置 API Key，点「AI 设置」填写'); return; }
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 90000);
    fetch(c.baseUrl.replace(/\/+$/, '') + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + c.apiKey },
      body: JSON.stringify({
        model: c.model || 'deepseek-flash',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt() },
          { role: 'user', content: userText }
        ]
      }),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          var code = (j.error && (j.error.code || j.error.message)) || ('HTTP ' + r.status);
          fail(errText(code, r.status));
        });
      }
      return r.json().then(function (j) {
        var txt = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
        ok(txt);
      });
    }).catch(function (e) {
      clearTimeout(timer);
      if (e && e.name === 'AbortError') fail('请求超时（90 秒），请重试');
      else fail('网络不通或被浏览器拦截；file:// 直接打开时部分浏览器会拦截外网请求，建议通过在线地址或本地服务打开页面');
    });
  }

  /* 字段清单条目 + 模型输出 → 建议卡（与规则解析同构） */
  function itemOf(e, ed) {
    var reason = String(ed.reason || '会议建议').trim();
    /* kind=strategy 的卡片写回时会看 quote 里有没有"家长/家庭"来决定进园内还是家庭栏，
       AI 的 reason 常提到家长，这里把路由固定死，只按清单里选定的 id 走 */
    var quote = (e.kind === 'strategy') ? '园内支持策略（AI 判定）：' + reason
      : (e.kind === 'home') ? '家庭配合（AI 判定）：' + reason
        : reason;
    return {
      kind: e.kind, plan: e.plan, planName: e.planName,
      field: e.field || '', fieldName: e.fieldName || e.label,
      goalId: e.goalId || '', domain: e.domain || '',
      sec: e.sec || '', secTitle: e.secTitle || '',
      dropIndex: e.dropIndex, mode: e.mode || 'append',
      quote: quote.slice(0, 90),
      before: e.kind === 'longAdd' ? '（当前无此条目，采纳后新增一条长期目标）' : e.cur || '（当前为空）',
      after: String(ed.after || '').trim(),
      why: 'AI 读取会议纪要：「' + reason + '」 → 改「' + e.label + '」。采纳前可在「改为」栏直接修改。'
    };
  }

  /* ---------- 分析主入口 ---------- */
  R.ai = {
    cfg: cfg, saveCfg: saveCfg, registry: registry, anon: anon,
    ready: function () { return !!cfg().apiKey; },

    analyze: function (text, ok, fail) {
      var reg = registry();
      var byId = {};
      reg.forEach(function (e) { byId[e.id] = e; });
      /* 字段清单按成稿章节分组呈现：让模型像"通读成稿"一样对照理解，
         而不是面对一列平铺的 id；"当前内容"与成稿显示逐字一致 */
      var last = '';
      var body = reg.map(function (e) {
        var head = '';
        if (e.grp && e.grp !== last) { last = e.grp; head = '\n■ ' + e.grp + '\n'; }
        var cur = anon(e.cur) || '（空）';
        if (cur.indexOf('\n') >= 0) {
          cur = '\n    ' + cur.split(/\r?\n+/).filter(Boolean)
            .map(function (l, i) { return (i + 1) + '. ' + l; }).join('\n    ');
        }
        return head + e.id + '｜' + e.label + '｜当前：' + cur + (e.hint ? '｜' + e.hint : '');
      }).join('\n');
      var user = '【成稿当前内容】（按章节分组；每行一个可编辑字段，id 必须原样使用，' +
        '"当前"就是成稿里显示的文字）\n' +
        body + '\n\n【会议纪要】\n' + anon(text);
      chat(user, function (raw) {
        var data;
        try {
          data = JSON.parse(String(raw).replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, '').trim());
        } catch (e) { fail('模型返回的不是合法 JSON，请再试一次'); return; }
        var items = [], pending = [];
        (data.edits || []).forEach(function (ed) {
          if (!ed) return;
          var e = byId[ed.id];
          if (!e || !String(ed.after || '').trim()) return;
          items.push(itemOf(e, ed));
        });
        (data.pending || []).forEach(function (pd) {
          if (!pd) return;
          var e = byId[pd.id];
          var it = e ? itemOf(e, pd) : {
            kind: 'section', plan: 'review', planName: '七、检视与复审',
            sec: 'review', secTitle: '七、检视与复审',
            field: '', fieldName: 'AI 未定位（默认写进检视与复审，可在改为栏改）',
            goalId: '', domain: '',
            quote: String(pd.reason || '').slice(0, 90),
            before: '（当前章节无此内容）',
            after: String(pd.after || '').trim()
          };
          pending.push(it);
        });
        ok({ items: items, pending: pending });
      }, fail);
    },

    /* 联网调用没有现成的加载遮罩（U.computing 是定时的），自己给一个可控开关的 */
    mask: function (title, steps) {
      var el = document.createElement('div');
      el.className = 'calc-mask';
      el.innerHTML = '<div class="calc-box">' +
        '<div class="calc-spin"><svg viewBox="0 0 50 50" width="48" height="48" aria-hidden="true">' +
        '<circle cx="25" cy="25" r="20" fill="none" stroke="#e6edf5" stroke-width="5"/>' +
        '<circle cx="25" cy="25" r="20" fill="none" stroke="#2f6fd0" stroke-width="5" stroke-linecap="round" ' +
        'stroke-dasharray="30 96"><animateTransform attributeName="transform" type="rotate" ' +
        'from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite"/></circle></svg></div>' +
        '<div class="calc-t">' + R.ui.esc(title) + '</div>' +
        '<div class="calc-steps">' + (steps || []).map(function (s) {
          return '<div class="cs"><i></i><span>' + R.ui.esc(s) + '</span></div>';
        }).join('') + '</div></div>';
      document.body.appendChild(el);
      var cs = el.querySelectorAll('.cs');
      var i = 0;
      var timer = setInterval(function () {
        if (i > 0) cs[i - 1].className = 'cs done';
        if (i >= cs.length) { clearInterval(timer); return; }
        cs[i].className = 'cs on';
        i++;
      }, 700);
      return function close() {
        clearInterval(timer);
        el.classList.add('out');
        setTimeout(function () { el.remove(); }, 240);
      };
    }
  };
})(window.RIEP);
