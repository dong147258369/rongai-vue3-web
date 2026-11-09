/* ============================================================
   views/doc.js · IEP 成稿与导出
   章节结构对齐园所《特殊需要幼儿个别化教育计划（IEP）制定与实施记录表》
   ============================================================ */
(function (R) {
  'use strict';
  var U = R.ui;

  /* IEP 制定日期：档案里有就照档案写；没有（新建 / 批量导入档案）就落到今天并写回档案，
     保证成稿、导出件、档案页三处口径一致，不会出现空白行。 */
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function iepDateText() {
    var c = R.CASE;
    if (!c) return todayStr();
    if (!c.iepDate) {
      c.iepDate = todayStr();
      try { R.store.save(); } catch (e) { /* 只读场景下不阻塞渲染 */ }
    }
    return c.iepDate;
  }

  /* ---------- 导出工具 ---------- */
  R.util = R.util || {};
  R.util.download = function (filename, content, mime) {
    var blob = new Blob(['\ufeff' + content], { type: (mime || 'text/plain') + ';charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  R.util.downloadWord = function (filename, bodyHtml, title) {
    var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">' +
      '<head><meta charset="utf-8"><title>' + (title || filename) + '</title>' +
      '<style>body{font-family:"Microsoft YaHei",sans-serif;font-size:11pt;line-height:1.7}' +
      'h1{font-size:15pt;text-align:center}h2{font-size:12.5pt;border-bottom:1px solid #999;padding-bottom:4px;margin-top:18pt}' +
      'table{border-collapse:collapse;width:100%;table-layout:fixed}td,th{border:1px solid #999;padding:5px;font-size:9.5pt;vertical-align:top}' +
      'th{background:#f2f5f9}.muted{color:#666}ul{margin:4pt 0 4pt 16pt}</style></head><body>' + bodyHtml + '</body></html>';
    R.util.download(filename, html, 'application/msword');
  };
  R.util.printEl = function (html, title) {
    var w = window.open('', '_blank', 'width=980,height=760');
    if (!w) { U.toast('浏览器阻止了弹窗，请允许后重试', 'warn'); return; }
    w.document.write('<html><head><meta charset="utf-8"><title>' + (title || '打印') + '</title>' +
      '<style>body{font-family:"Microsoft YaHei",sans-serif;padding:24px;color:#1f2a37;line-height:1.7;font-size:12px}' +
      'h1{font-size:16px;text-align:center}h2{font-size:13px;border-bottom:2px solid #eaf2fe;padding-bottom:5px;margin-top:18px}' +
      'h3.mini{font-size:12px;color:#666}h4{font-size:12px}' +
      'table{border-collapse:collapse;width:100%;font-size:11px;table-layout:fixed}' +
      'td,th{border:1px solid #ccc;padding:5px;text-align:left;vertical-align:top;word-break:break-word}' +
      'th{background:#f6f8fb}ul{padding-left:18px;margin:4px 0}.muted{color:#78859a}' +
      '@media print{.noprint{display:none}}</style></head><body>' + html +
      '<div class="noprint" style="margin-top:20px"><button onclick="window.print()">打印 / 另存为 PDF</button></div>' +
      '</body></html>');
    w.document.close();
  };

  /* ---------- 一、基础信息 ---------- */
  function basicSection() {
    var c = R.CASE;
    var rows = [
      ['幼儿姓名', c.name],
      ['性别 / 年龄', c.gender + ' / ' + c.age + '（' + c.birthday + '）'],
      ['班级', c.cls],
      ['入园时间', c.enrollDate],
      ['特殊情况说明', c.dx + '，有医院评估报告'],
      ['IEP 制定日期', iepDateText()],
      ['本次计划实施周期', c.planStart + ' — ' + c.planEnd],
      ['IEP 工作小组', c.team.join('、')]
    ];
    var ev = [
      ['医学诊断', '2026-10-26', '疑似孤独症谱系；建议言语、社交、感觉统合训练'],
      ['PEP-3', '2026-10-26', '功能发展 68/95；发展年龄 43 个月，与生理年龄持平；口语认知 −10 个月'],
      ['VB-MAPP', '2026-10-26', '里程碑总体第 3 阶段；社交第 2 阶段；障碍评估中重度 1 项 / 中度 3 项 / 轻度 14 项；转衔三类良好'],
      ['感觉统合', '2026-07-19', '5 页扫描件经本机识别（置信度 85）：感觉调节 9 项 / 基础机制 4 项 / 运用能力 5 项评定已入档'],
      ['教师观察', '2026-10-26', '小组班 7 维度 + 融合班五大领域，均含优势与需求双栏'],
      ['家长观察', '2026-10-28', '居家 9 维度 + 家长需求']
    ];
    return '<table><tbody>' + rows.map(function (r) {
      return '<tr><td style="width:132px;background:#fbfcfe"><b>' + U.esc(r[0]) + '</b></td><td>' + U.esc(r[1]) + '</td></tr>';
    }).join('') + '</tbody></table>' +
      '<h3 class="mini">评估依据（只引用，不生成医学结论）</h3>' +
      '<table><thead><tr><th style="width:92px">来源</th><th class="nw" style="width:104px">日期</th><th>关键结论</th></tr></thead><tbody>' +
      ev.map(function (r) {
        return '<tr><td>' + U.esc(r[0]) + '</td><td class="nw">' + U.esc(r[1]) + '</td><td>' + U.esc(r[2]) + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '<div class="small muted">说明：本表只做引用与对齐，诊断结论以医院报告为准；感统报告为扫描件，相关条目在补齐校对前标注"待校对"。</div>';
  }

  /* ---------- 二、能力分析（优势 / 不足 / 短期目标） ---------- */
  /* 原稿一个自然段 = 成稿一条：不改写、不合并、不截断。
     只做两件排版层面的事：① 换行符也当分段；② 去掉条目自带的「1.」「（1）」编号，
     改由表格统一编号（否则会出现「1. 1.形状配对…」）。 */
  function paraLines(text) {
    return String(text || '').split(/\r?\n+/).map(function (x) {
      return x.replace(/^\s*(?:\d+[．.、]|[（(]\d+[）)])\s*/, '')
        .replace(/^[·•・\-\s]+/, '')
        .trim();
    }).filter(function (x) { return x.length > 0; });
  }

  /* 一格 = 该栏的条目，一条一行，全量显示不截断；成稿这一层再做两道收口：
     ① 长句压成一句话（不再是 40 字的长段）；② 一格最多 4 条，与手写 IEP 的密度一致。
     被收掉的原文仍在「跨源能力画像」与档案表单里，不丢。 */
  function cellsHtml(list) {
    list = (list || []).filter(function (c) { return c && c.t; });
    if (!list.length) return '<span class="muted">—</span>';
    if (list[0].empty) return '<div class="ab-empty-p">' + U.esc(list[0].t) + '</div>';

    var lines = [];
    list.forEach(function (c) {
      paraLines(c.t).forEach(function (s) {
        var t = (s.length > 26 && R.engine && R.shortItem) ? R.shortItem(s) : s;
        if (t && lines.indexOf(t) < 0) lines.push(t);
      });
    });
    if (!lines.length) lines = [String(list[0].t).trim()];
    lines = lines.slice(0, 4);

    var numbered = lines.length > 1;
    return lines.map(function (t, i) {
      return '<div class="ab-line">' + (numbered ? '<i>' + (i + 1) + '.</i>' : '') +
        '<span>' + U.esc(t) + '</span></div>';
    }).join('');
  }

  function abilitySection() {
    var prof = R.engine.profile();
    var rows = prof.map(function (d) {
      return '<tr><td class="dim"><b>' + U.esc(d.name).replace(/\//g, '<br>') + '</b><div class="small muted">' + U.esc(d.level) + '</div></td>' +
        '<td>' + cellsHtml(R.engine.abilityCells(d.code, 'strength')) + '</td>' +
        '<td>' + cellsHtml(R.engine.abilityCells(d.code, 'need')) + '</td></tr>';
    }).join('');
    var emptyN = R.engine.abilityEmptyCount();
    var head = '';
    if (emptyN === prof.length) {
      head = U.notice('warn', 'alert',
        '<b>六个维度都还没有可引用的条目</b><br>本表按「教师 / 家长观察表原文 → 评估量表推算依据」自动取数：' +
        '请先到「数据收集台」回收三张观察表，或上传 PEP-3 / VB-MAPP / 感统报告并确认解析，保存后本表会自动填入；' +
        '也可以在「档案 / 六维初判」里手工录入。');
    } else if (emptyN > 0) {
      head = U.notice('info', 'info',
        '<b>还有 ' + emptyN + ' 个维度缺条目</b>，已标「待补充」；补齐对应的观察表或评估报告后会自动填入。');
    }
    return head +
      '<table class="wrap"><thead><tr><th style="width:126px">能力维度</th>' +
      '<th style="width:38%">幼儿现有优势能力</th><th>现存薄弱问题与发展需求</th>' +
      '</tr></thead><tbody>' + rows +
      '<tr><td><b>家庭养育情况</b><div class="small muted">背景信息</div></td>' +
      '<td>' + cellsHtml(R.engine.familyCells('strength')) + '</td>' +
      '<td>' + cellsHtml(R.engine.familyCells('need')) + '</td></tr>' +
      '</tbody></table>' +
      '<div class="small muted">本表按手写 IEP 的密度写：每个维度的优势与不足各 2～4 条，一条一句话，只保留评估与目标要用的信息；需要完整原文可到「跨源能力画像」查看，会议建议写回也会同步到本表。家庭养育情况只作背景，不计入能力指数。</div>';
  }

  /* ---------- 三、长期发展目标（每领域一行，与教师手写 IEP 同版式） ---------- */
  function longSection() {
    var d = R.engine.docByDomain();
    var groups = d.groups;
    if (!groups.length) return '<div class="empty">还没有目标：先到「目标建议」按数据生成，再到「IEP 会议调校与审议」采纳。</div>';
    return (d.draft ? '<div class="small" style="color:#a35f00;background:var(--amber-soft);border-radius:8px;padding:6px 10px;margin-bottom:8px">' +
      '本稿尚未采纳任何目标，下表按当前候选目标出草案，逐条标注"待审议"。</div>' : '') +
      '<table class="wrap"><thead><tr><th style="width:86px">领域</th>' +
      '<th style="width:32%">融合目标</th><th style="width:26%">小组目标</th><th>整合后本学期目标</th></tr></thead><tbody>' +
      groups.map(function (grp) {
        function join(field) {
          var arr = grp.goals.map(function (r) { return String(r.g[field] || '').trim(); }).filter(Boolean);
          if (!arr.length) return '<span class="muted">—</span>';
          return arr.length === 1 ? U.esc(arr[0]) :
            arr.map(function (t, i) { return (i + 1) + '. ' + U.esc(t); }).join('<br>');
        }
        var pend = grp.goals.some(function (r) { return r.g.status !== 'adopted'; });
        return '<tr><td><b>' + U.esc(grp.domain.field) + '</b>' +
          (pend ? ' <span class="small" style="color:#a35f00">〔待审议〕</span>' : '') + '</td>' +
          '<td>' + join('fusion') + '</td><td>' + join('group') + '</td><td><b>' + join('integrated') + '</b></td></tr>';
      }).join('') + '</tbody></table>' +
      '<div class="small muted">共 ' + groups.length + ' 个领域。</div>';
  }

  /* ---------- 四、短期目标 + 支持策略（每领域一行，与教师手写 IEP 同版式） ---------- */
  /* 原稿一格里的写法是「融合：1.精细动作（1）…（2）…2.大运动（1）…」，一串到底。
     这里拆成三级：融合 / 小组 / 整合目标 → 1. 2. 3. → （1）（2）。
     目标：每一条都能单独成行，教师开会时能指着某一条说"改成这个"。 */
  function trimEndPunc(s) {
    return String(s || '').replace(/[；;]\s*$/, '').trim();
  }

  /* 按顶层「1. 2. 3.」切块，保留每块开头的编号 */
  function topBlocks(body) {
    var s = String(body || '').replace(/\s+/g, ' ').trim();
    if (!s) return [];
    var marked = s.replace(/(^|[。；;）)\s])([1-9])[．.、]\s*/g, '$1\u0001$2\u0002');
    var parts = marked.split('\u0001');
    var out = [];
    parts.forEach(function (p) {
      var m = p.match(/^([1-9])\u0002([\s\S]*)$/);
      if (m) out = out.concat(parseBlock(+m[1], m[2].trim()));
      else if (p.trim().length > 4) out = out.concat(parseBlock(0, p.trim()));
    });
    return out;
  }

  /* 块内再按「（1）（2）」切子条；「（1）」之前的短词当作小标题。
     没有「（1）」时按分号切成若干条（原稿常用分号罗列并列要求）。 */
  function parseBlock(num, blk) {
    var marked = String(blk).replace(/[（(]([1-9])[）)]\s*/g, '\u0001$1\u0002');
    var parts = marked.split('\u0001');
    if (parts.length === 1) {
      var segs = String(blk).split(/[；;]/).map(trimEndPunc).filter(function (x) { return x.length >= 3; });
      if (segs.length <= 1) return [{ num: num, head: '', text: trimEndPunc(blk), subs: [] }];
      return segs.map(function (t, i) { return { num: i === 0 ? num : 0, head: '', text: t, subs: [] }; });
    }
    var head = parts[0].trim().replace(/[：:，,]$/, '');
    var subs = [];
    if (head && head.length > 12) { subs.push({ num: 0, t: trimEndPunc(head) }); head = ''; }
    parts.slice(1).forEach(function (p) {
      var m = p.match(/^([1-9])\u0002([\s\S]*)$/);
      if (m && m[2].trim()) subs.push({ num: +m[1], t: trimEndPunc(m[2].trim()) });
    });
    return [{ num: num, head: head, text: '', subs: subs }];
  }

  function shortBlocks(t) {
    var s = String(t || '').replace(/\r/g, ' ').replace(/[ \t\u3000]+/g, ' ').trim();
    if (!s) return null;
    s = s.replace(/融合\s*[:：]/, '\u0002融合\u0003')
      .replace(/小组(?:目标)?\s*[:：]/, '\u0002小组\u0003')
      .replace(/整合目标\s*[:：]/, '\u0002整合目标\u0003');
    var segs = [];
    s.split('\u0002').forEach(function (blk) {
      if (!blk) return;
      var p = blk.split('\u0003');
      var label = p.length === 2 ? p[0].trim() : '';
      var body = (p.length === 2 ? p[1] : p[0]).trim();
      if (!body) return;
      segs.push({ label: label, items: topBlocks(body) });
    });
    return segs.length ? segs : null;
  }

  function shortItemHtml(it) {
    var h = '';
    if (it.head) {
      h += '<div class="sc-it"><i>' + (it.num ? it.num + '.' : '·') + '</i><b>' + U.esc(it.head) + '</b></div>';
    } else if (it.text) {
      h += '<div class="sc-li"><i>' + (it.num ? it.num + '.' : '·') + '</i><span>' + U.esc(it.text) + '</span></div>';
    }
    if (it.subs.length) {
      h += it.subs.map(function (s) {
        return '<div class="sc-sub"><i>' + (s.num ? '（' + s.num + '）' : '·') + '</i><span>' + U.esc(s.t) + '</span></div>';
      }).join('');
    }
    return h;
  }

  function shortCell(grp) {
    var details = grp.goals.map(function (r) { return String(r.g.shortDetail || '').trim(); }).filter(Boolean);
    var blocks = [];
    if (details.length) {
      details.forEach(function (t) {
        var b = shortBlocks(t);
        if (b) blocks = blocks.concat(b);
      });
      /* shortDetail 是整格原文快照：会议建议后来往 shorts 里追加的条目不在里面，
         按"开头 12 字是否已被原文包含"判断，没包含的补进「整合目标」块，保证写回可见 */
      var extra = [], joined = details.join(' ');
      grp.goals.forEach(function (r) {
        (r.g.shorts || []).forEach(function (s) {
          if (s && s.t && joined.indexOf(String(s.t).slice(0, 12)) < 0) extra.push(s);
        });
      });
      if (extra.length) {
        blocks.push({
          label: '整合目标',
          items: extra.map(function (s, i) {
            return { num: i + 1, head: '', text: trimEndPunc(s.t) + (s.c ? '（' + s.c + '）' : ''), subs: [] };
          })
        });
      }
    } else {
      /* 没有整格原文：按融合 / 小组 / 整合目标 三个字段拼 */
      function collect(field) {
        return grp.goals.map(function (r) { return String(r.g[field] || '').trim(); }).filter(Boolean);
      }
      var fu = collect('fusion'), gr = collect('group');
      if (fu.length) blocks.push({ label: '融合', items: topBlocks(fu.join(' ')) });
      if (gr.length) blocks.push({ label: '小组', items: topBlocks(gr.join(' ')) });
      var shorts = [];
      grp.goals.forEach(function (r) {
        (r.g.shorts || []).forEach(function (s) { if (s && s.t) shorts.push(s); });
      });
      if (shorts.length) {
        blocks.push({
          label: '整合目标',
          items: shorts.map(function (s, i) {
            return { num: i + 1, head: '', text: trimEndPunc(s.t) + (s.c ? '（' + s.c + '）' : ''), subs: [] };
          })
        });
      }
    }
    if (!blocks.length) return '<span class="muted">—</span>';
    return blocks.map(function (b) {
      /* 同层有多条却没有自带编号时，按顺序补 1. 2. 3.，避免出现一排圆点 */
      var plain = b.items.filter(function (it) { return !it.head && !it.subs.length; });
      if (plain.length > 1) {
        b.items.forEach(function (it, i) {
          if (!it.head && !it.subs.length) it.num = it.num || i + 1;
        });
      }
      return '<div class="sc-seg">' +
        (b.label ? '<div class="sc-lb">' + U.esc(b.label) + '</div>' : '') +
        b.items.map(shortItemHtml).join('') + '</div>';
    }).join('');
  }

  /* 策略列表：条目自带编号（1. 2.）则不加，没有则补编号 */
  function listCell(arr) {
    arr = (arr || []).filter(Boolean);
    if (!arr.length) return '<span class="muted">—</span>';
    return arr.map(function (t, i) {
      var num = /^\s*[1-9][．.、]/.test(t) ? '' : (i + 1) + '. ';
      return num + U.esc(t).replace(/整合策略\s*[:：]/, '<br><b>整合策略：</b>');
    }).join('<br>');
  }

  function shortSection() {
    var d = R.engine.docByDomain();
    var groups = d.groups;
    if (!groups.length) return '<div class="empty">还没有目标：先到「目标建议」按数据生成，再到「IEP 会议调校与审议」采纳。</div>';
    return '<table class="wrap"><thead><tr><th style="width:86px">发展领域</th>' +
      '<th style="width:36%">短期具体目标（1-2个月达成）</th>' +
      '<th style="width:28%">园内教育支持策略</th><th>家庭配合支持策略</th></tr></thead><tbody>' +
      groups.map(function (grp) {
        var school = [], home = [];
        grp.goals.forEach(function (r) {
          (r.g.school || []).forEach(function (s) { school.push(s); });
          (r.g.home || []).forEach(function (s) { home.push(s); });
        });
        return '<tr><td><b>' + U.esc(grp.domain.field) + '</b></td>' +
          '<td class="small">' + shortCell(grp) + '</td>' +
          '<td class="small">' + listCell(school) + '</td>' +
          '<td class="small">' + listCell(home) + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '<div class="small muted">家庭策略与园内使用同一步骤图与提示语。</div>';
  }

  /* ---------- 五、支持服务与责任分工 ---------- */
  function dutySection() {
    var adopted = R.engine.docByDomain();
    adopted = adopted.groups.reduce(function (a, g) { return a.concat(g.goals); }, []);
    var teachers = R.DUTY.filter(function (d) { return d.key !== 'parent' && d.key !== 'admin'; });
    return '<h3 class="mini">五类教师的职责分工</h3>' +
      '<table class="wrap"><thead><tr><th style="width:96px">角色</th><th style="width:96px">负责范围</th>' +
      '<th>职责</th><th style="width:132px">频次</th></tr></thead><tbody>' +
      teachers.map(function (d) {
        return '<tr><td><b>' + U.esc(d.name) + '</b><div class="small muted">' + U.esc(d.tag) + '</div></td>' +
          '<td class="small">' + U.esc(d.scope) + '</td>' +
          '<td class="small">' + d.duty.map(function (x) { return '· ' + U.esc(x); }).join('<br>') + '</td>' +
          '<td class="small">' + U.esc(d.freq) + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '<h3 class="mini">各目标的服务频次与主责</h3>' +
      '<table><thead><tr><th style="width:88px">目标</th><th>学期目标</th><th style="width:146px">主责</th><th style="width:92px">频次</th></tr></thead><tbody>' +
      adopted.map(function (r) {
        return '<tr><td class="nw"><b>' + U.esc(r.g.id) + '</b></td><td class="small">' + U.esc(r.g.text) + '</td>' +
          '<td class="small owner">' + U.esc(r.g.owner).replace(/\s*\/\s*/g, ' <span class="sep">/</span> ') + '</td><td class="small nw">' + U.esc(r.g.frequency) + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '<div class="small muted">园所行政负责排课与课时保障；家长负责家庭任务卡（见下章）。</div>';
  }

  /* ---------- 六、家长协作事项 ---------- */
  function parentSection() {
    var st = R.store.get();
    return '<ul>' +
      '<li>与园内使用<b>同一套步骤图与提示语</b>：漱口、进餐"嚼完 5 口再咽"、人称代词手势（指自己说"我"，指孩子说"你"）。</li>' +
      '<li>每周按家庭任务卡练 1–2 个动作，<b>做不完如实反馈</b>，反馈本身就是有效信息。</li>' +
      '<li>提前预告活动转换（"我们先去超市，再回家"），减少出门与入园前的情绪波动。</li>' +
      '<li>不强迫在陌生人面前说话；孩子说错代词时示范正确说法，不批评、不反复提问考孩子。</li>' +
      '<li>参加 IEP 会议并签署知情同意；目标调整前再次沟通。</li>' +
      '<li>家长版摘要由融合教师确认后发送，去除专业术语。</li>' +
      '</ul>' +
      (st.obsFilled.parent ? '' : '<div class="small muted">家长观察表未填：家庭任务卡暂不下发，避免"凭空给家长派任务"。</div>');
  }

  /* ---------- 七、检视与复审 ---------- */
  function reviewSection() {
    return '<ul>' +
      '<li><b>每月至少检视 1 次</b>：五类教师按分工记录达成 / 部分达成 / 未达成 + 质性描述；未更新目标自动置顶。</li>' +
      '<li><b>每学期至少复审 1 次</b>：用"干预前后对比"复盘六个维度的变化，生成复审材料。</li>' +
      '<li><b>字段修订或补传报告后</b>，画像按加权模型重算并触发相关目标复核（不自动改目标，只提示复核）。</li>' +
      '<li>复审时间：' + R.CASE.planEnd + '（学期末）；下一次 IEP 周期：2027-02 起。</li>' +
      '<li>目标调整需再次经 IEP 团队会议与家长知情同意，全程留痕。</li>' +
      '</ul>';
  }

  /* ---------- 章节装配 ---------- */
  /* 会议建议采纳后追加的段落单独存：不覆盖系统生成内容，数据变化时正文仍会跟着更新 */
  function addendumHtml(key) {
    var st = R.store.get();
    var arr = (st.docAddenda || {})[key] || [];
    if (!arr.length) return '';
    return '<div class="doc-add"><div class="da-h">会议补充（已采纳的建议）</div>' +
      arr.map(function (a) {
        return '<div class="da-row"><span class="da-src">' + U.esc(a.src) + ' · ' + U.esc(a.t) + '</span>' +
          '<div>' + U.esc(a.text) + '</div></div>';
      }).join('') + '</div>';
  }

  function sections() {
    var st = R.store.get();
    st.docSections = st.docSections || {};
    st.docAddenda = st.docAddenda || {};
    var list = [
      { key: 'basic', title: '一、幼儿基础信息', html: basicSection() },
      { key: 'ability', title: '二、幼儿能力分析', html: abilitySection() },
      { key: 'long', title: '三、长期发展目标', html: longSection() },
      { key: 'short', title: '四、短期目标 + 支持策略', html: shortSection() },
      { key: 'duty', title: '五、支持服务与责任分工', html: dutySection() },
      { key: 'parent', title: '六、家长协作事项', html: parentSection() },
      { key: 'review', title: '七、检视与复审', html: reviewSection() }
    ];
    return list.map(function (s) {
      return {
        key: s.key, title: s.title,
        base: st.docSections[s.key] || s.html,
        html: st.docSections[s.key] || (s.html + addendumHtml(s.key)),
        add: ((st.docAddenda || {})[s.key] || []).length
      };
    });
  }

  function fullDocHtml() {
    var st = R.store.get();
    var secs = sections();
    return '<h1>特殊需要幼儿个别化教育计划（IEP）制定与实施记录表</h1>' +
      '<p class="muted" style="text-align:center">' + U.esc(R.CASE.alias) + ' · 园内编号 ' + U.esc(R.CASE.id) +
      ' · 制定日期 ' + U.esc(iepDateText()) +
      ' · 版本 ' + U.esc(st.doc.version) + ' · ' +
      (st.doc.status === 'effective' ? '已生效（' + U.esc(st.doc.effectiveBy) + ' ' + U.esc(st.doc.effectiveAt) + '）' : '草案 · 待确认，未经确认不得作为正式 IEP 使用') +
      '</p>' +
      secs.map(function (s) { return '<h2>' + U.esc(s.title) + '</h2>' + s.html; }).join('');
  }

  /* ---------- 焦点卡 ---------- */
  function statusHero() {
    var st = R.store.get();
    var eff = st.doc.status === 'effective';
    var stats = R.engine.goalStats();
    var dd = R.engine.docByDomain();
    var flat = dd.groups.reduce(function (a, g) { return a.concat(g.goals); }, []);
    var shorts = flat.reduce(function (a, r) { return a + (r.g.shorts || []).length; }, 0);
    return '<div class="hero' + (eff ? ' done' : '') + '">' +
      '<div class="h-k">' + (eff ? '已生效 · ' + U.esc(st.doc.effectiveAt) + ' · ' + U.esc(st.doc.effectiveBy) : '草案 · 待确认') + '</div>' +
      '<div class="h-t">' + (eff
        ? 'IEP ' + U.esc(st.doc.version) + ' 已生效，可导出正式文档'
        : dd.draft
          ? '先出草案：按 ' + flat.length + ' 条候选目标成稿，审议采纳后再定稿'
          : 'IEP ' + U.esc(st.doc.version) + ' 还是草案，导出前需走完生效确认') + '</div>' +
      '<div class="h-d">七章结构：基础信息 / 能力分析 / 长期目标 / 短期目标与策略 / 支持服务与责任分工 / 家长协作 / 检视复审。' +
      '已纳入 ' + flat.length + ' 条学期目标（' + dd.groups.length + ' 个领域、' + shorts + ' 条短期目标' +
      (dd.draft ? '，其中 ' + stats.pending + ' 条待审议' : '') + '）· 数据完整度 ' +
      R.engine.completeness() + '% · 家长版摘要' + (st.doc.parentShared ? '已发送' : '未发送') + '。</div>' +
      '<div class="h-act">' +
      '<button class="btn primary lg" data-act="exportWord">' + U.icon('print', 16) + ' 导出 Word（园所档案）</button>' +
      '<button class="btn lg" data-act="exportPdf">PDF</button>' +
      (stats.pending
        ? '<button class="btn lg ghost" data-act="goto" data-arg="meeting">去审议 ' + stats.pending + ' 条目标</button>' : '') +
      '</div>' +
      '<div class="h-side">' + (eff
        ? '成稿已生效。'
        : '生效需完成：教师审议 → IEP 会议调校 → 家长知情同意 → 人工置为"生效"。未生效导出会标注"草案"。') + '</div>' +
      '</div>';
  }

  function sideCard() {
    var secs = sections();
    var st = R.store.get();
    return '<div class="card"><div class="card-head"><h3>' + U.icon('archive', 16) + ' 文档结构</h3>' +
      '<span class="desc">' + secs.length + ' 章</span></div>' +
      '<div style="font-size:13px">' + secs.map(function (s, i) {
        return '<div style="padding:6px 0;border-bottom:1px dashed var(--line)">' +
          '<a href="#sec-' + s.key + '">' + U.esc(s.title) + '</a>' +
          (st.docSections[s.key] ? ' ' + U.badge('已手改', 'v') : '') +
          (s.add ? ' ' + U.badge('会议补充 ' + s.add, 'a') : '') + '</div>';
      }).join('') + '</div>' +
      U.note('支持逐章编辑；每条目标右上角可展开依据溯源。') +
      '</div>' +
      '<div class="card"><div class="card-head"><h3>' + U.icon('print', 16) + ' 其他导出形态</h3></div>' +
      '<div class="btn-row">' +
      '<button class="btn soft" data-act="showSupportCard">一页纸支持卡</button>' +
      '<button class="btn soft" data-act="showParentSummary">家长版摘要' +
        (st.doc.parentShared ? '（已发送）' : '') + '</button>' +
      '<button class="btn sm" data-act="showJSON">结构化 JSON</button>' +
      '</div>' +
      U.note('一页纸支持卡贴在班级工作区；家长版摘要是沟通工具而非简化公文。') +
      '</div>';
  }

  function paper() {
    var secs = sections();
    var role = R.store.role();
    return '<div class="card"><div class="card-head"><h3>' + U.icon('doc', 16) + ' 正文编辑区</h3>' +
      '<span class="desc">所见即所得；可逐章编辑</span></div>' +
      '<div class="doc-paper">' + secs.map(function (s) {
        return '<h2 id="sec-' + s.key + '">' + U.esc(s.title) +
          (role.canEdit ? ' <button class="btn sm ghost" data-act="editSection" data-arg="' + s.key + '">编辑</button>' : '') +
          '</h2>' + s.html;
      }).join('') + '</div></div>';
  }

  /* 会议建议解析出来后，如果还有没写回的条目，在成稿顶上提示一句，
     避免"老师在会议页写了建议、回到成稿却看不出改了什么" */
  function adviceBar() {
    var m = R.store.meeting();
    var a = m && m.advice;
    if (!a || (!(a.items || []).length && !(a.pending || []).length)) return '';
    var left = (a.items || []).filter(function (x) { return !x.applied && !x.dismissed; });
    var pleft = (a.pending || []).filter(function (x) { return !x.applied && !x.dismissed; });
    if (!left.length && !pleft.length) return '';
    var txt = left.length
      ? '<b>会议还有 ' + left.length + ' 条建议没写回成稿</b>'
      : '<b>会议有 ' + pleft.length + ' 条建议等你确认</b>';
    var rest = (left.length && pleft.length) ? '，另有 ' + pleft.length + ' 条需你确认写法定下来' : '';
    return U.notice('info', 'info',
      txt + rest + '：系统已经把每句定位到具体章节 / 目标，' +
      '点「去写回」确认一次即可生效。' +
      '<div class="mt8"><button class="btn sm primary" data-act="gotoAdvice">去写回（' +
      (left.length + pleft.length) + '）</button></div>');
  }

  R.views.doc = {
    title: '成稿与导出',
    render: function () {
      var role = R.store.role();
      if (role.key === 'parent') {
        return U.pageHead({
          icon: 'doc', title: '我的孩子的 IEP',
          sub: '这里只有给家长看的部分：孩子现在能做什么、我们打算帮他学什么、家里怎么配合。'
        }) +
          (R.store.get().doc.parentShared ? R.comp.parentSummary()
            : U.notice('info', 'info', '家长版摘要需由融合教师确认后发送，请等待园方通知。')) +
          R.comp.familyCard();
      }
      return U.pageHead({
        icon: 'doc', title: 'IEP 成稿与导出',
        sub: '按园所《IEP 制定与实施记录表》出稿：能力分析里带优势与不足，每章都有短期目标与两套支持策略。'
      }) + (role.canEdit ? adviceBar() : '') + statusHero() +
        '<div class="split-wide"><div>' + paper() + '</div><div>' + sideCard() + '</div></div>';
    }
  };

  /* ---------- 动作 ---------- */
  function requireEffective(cb) {
    var st = R.store.get();
    if (st.doc.status === 'effective') { cb(); return; }
    U.modal('确认生效（导出前强制流程）',
      '<div class="notice warn"><span class="ic">' + U.icon('alert', 18) + '</span><div>' +
      '所有目标默认状态为"待审议"，需经教师审议、IEP 会议讨论、家长知情同意后，由人工置为"生效"。' +
      '<br>未生效的文档导出时会标注"草案"，不得作为正式 IEP 使用。</div></div>' +
      '<div class="check"><input type="checkbox" id="ef1"><div><div class="lb">教师已逐条审议（含短期目标与策略）</div></div></div>' +
      '<div class="check"><input type="checkbox" id="ef2"><div><div class="lb">IEP 会议已召开并完成调校</div></div></div>' +
      '<div class="check"><input type="checkbox" id="ef3"><div><div class="lb">家长知情同意</div></div></div>',
      [{
        label: '确认为生效稿并导出', cls: 'primary', onClick: function () {
          var ok = document.getElementById('ef1').checked && document.getElementById('ef2').checked && document.getElementById('ef3').checked;
          if (!ok) { U.toast('三项确认需全部勾选', 'warn'); return; }
          R.store.setEffective(R.store.role().short);
          R.store.log(R.store.role().short, '确认生效', 'IEP 成稿置为生效，版本 ' + R.store.get().doc.version);
          U.closeModal(); U.toast('已置为生效稿', 'ok');
          cb();
          R.render();
        }
      }, {
        label: '仍然以草案导出', cls: '', onClick: function () {
          U.closeModal();
          R.store.log(R.store.role().short, '草案导出', '未生效即导出，文档标注"草案"');
          cb();
        }
      }]);
  }

  R.actions.exportWord = function () {
    requireEffective(function () {
      var st = R.store.get();
      var mark = st.doc.status === 'effective' ? '' : '<p style="color:#c03b5e"><b>【草案 · 未经确认不得作为正式 IEP 使用】</b></p>';
      R.util.downloadWord('IEP_' + R.CASE.id + '_' + st.doc.version + '.doc', mark + fullDocHtml(), '个别化教育计划 · ' + R.CASE.alias);
      U.toast('Word 已导出', 'ok');
    });
  };

  R.actions.exportPdf = function () {
    requireEffective(function () {
      var st = R.store.get();
      var mark = st.doc.status === 'effective' ? '' : '<p style="color:#c03b5e"><b>【草案 · 未经确认不得作为正式 IEP 使用】</b></p>';
      R.util.printEl(mark + fullDocHtml(), 'IEP · ' + R.CASE.alias + ' ' + st.doc.version);
    });
  };

  R.actions.showSupportCard = function () {
    var html = R.comp.supportCard().replace(/class="btn[^"]*"[^>]*>[^<]*<\/button>/g, '');
    U.modal('一页纸班级支持卡', html + '<div class="small muted mt8">贴在班级工作区；随 IEP 更新。</div>',
      [{ label: '打印 / 另存 PDF', cls: 'primary', onClick: function () { R.util.printEl(R.comp.supportCard(), '一页纸支持卡'); } }]);
  };

  R.actions.showParentSummary = function () {
    U.modal('家长版摘要', R.comp.parentSummary() +
      '<div class="small muted mt8">须由融合教师确认后再发给家长。家长版不是简化版公文，而是沟通工具。</div>',
      [{
        label: '确认并发送给家长', cls: 'primary', onClick: function () {
          var st = R.store.get();
          st.doc.parentShared = true;
          R.store.save();
          R.store.log(R.store.role().short, '发送家长版', '家长版摘要经融合教师确认后发送');
          U.closeModal(); U.toast('已发送（家长端可见）', 'ok'); R.render();
        }
      }]);
  };

  R.actions.editSection = function (key) {
    var st = R.store.get();
    st.docSections = st.docSections || {};
    var secs = sections();
    var cur = secs.filter(function (s) { return s.key === key; })[0];
    U.modal('编辑章节 · ' + cur.title,
      '<textarea id="secText" style="min-height:240px;font-size:12px">' + U.esc(cur.base) + '</textarea>' +
      '<div class="small muted mt8">支持 HTML 片段；保存后覆盖该章节内容。留空并保存可恢复为系统生成版本。</div>',
      [{
        label: '保存', cls: 'primary', onClick: function () {
          var val = document.getElementById('secText').value;
          if (val.trim()) st.docSections[key] = val;
          else delete st.docSections[key];
          R.store.save();
          R.store.log(R.store.role().short, '编辑成稿', '章节「' + cur.title + '」已更新');
          U.closeModal(); U.toast('已保存', 'ok'); R.render();
        }
      }]);
  };

})(window.RIEP);
