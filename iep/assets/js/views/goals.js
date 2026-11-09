/* ============================================================
   views/goals.js · 目标建议（只出建议，审议在「IEP 会议调校与审议」）
   一条目标 = 长期目标（融合/小组/整合）+ 短期目标 + 双策略 + 依据
   ============================================================ */
(function (R) {
  'use strict';
  var U = R.ui;

  var STATUS_LABEL = { adopted: '已采纳', pending: '待审议', deferred: '降级学期后段', dropped: '已忽略' };

  /* review=true 时带审议动作（采纳 / 改写 / 降级 / 忽略），由会议页调用 */
  function goalCard(r, opts) {
    opts = opts || {};
    var review = !!opts.review;
    var g = r.g;
    var basis = (g.basis || []).map(function (id) {
      var ev = R.EVIDENCE[id];
      return ev ? (ev.source || ev.srcName) + ' · ' + ev.item + ' ' + ev.value : id;
    });
    var gb = g.genBasis || [];
    var factors = R.engine.factorDetail(g);
    var dbasis = R.engine.goalBasis(g);
    var v = R.engine.validateGoalText(g.text, g.criteria);
    var can = R.store.role().canEdit;

    var mainAct = !review ? ''
      : (g.status === 'adopted' || !can ? ''
        : '<button class="btn ok" data-act="adoptGoal" data-arg="' + g.id + '">采纳</button>') +
        '<button class="btn' + (g.status === 'adopted' || !can ? ' primary' : '') + '" ' +
        'data-act="rewriteGoal" data-arg="' + g.id + '">' + (can ? '改写' : '批注') + '</button>';

    var more = !review ? '' : U.fold('更多', '<div class="btn-row" style="padding-top:2px">' +
      '<button class="btn sm" data-act="deferGoal" data-arg="' + g.id + '">降级为学期后段</button>' +
      (g.status === 'dropped' ? '' : '<button class="btn sm danger" data-act="dropGoal" data-arg="' + g.id + '">忽略并说明理由</button>') +
      '</div>', { plain: true });

    var statusBadge = U.badge(STATUS_LABEL[g.status],
      g.status === 'adopted' ? 'g' : g.status === 'pending' ? 'a' : g.status === 'deferred' ? 'v' : 'gray');

    var longHtml = '<div class="kv" style="grid-template-columns:76px 1fr">' +
      '<b>融合目标</b><div>' + U.esc(g.fusion || '—') + '</div>' +
      '<b>小组目标</b><div>' + U.esc(g.group || '—') + '</div>' +
      '<b>整合后</b><div>' + U.esc(g.integrated || g.text) + '</div></div>';

    var shortHtml = (g.shorts && g.shorts.length)
      ? '<ol style="margin:8px 0 0;padding-left:20px;font-size:12.5px;line-height:1.7">' + g.shorts.map(function (s) {
        return '<li>' + U.esc(s.t) + ' <span class="muted">（' + U.esc(s.c) + '）</span></li>';
      }).join('') + '</ol>'
      : '<div class="small muted" style="margin-top:6px">本条未设短期目标（支持型目标，随核心目标一起执行）。</div>';

    var stratHtml = '<div style="margin-top:10px">' +
      '<div class="small" style="font-weight:600">园内支持策略</div>' +
      '<ul style="margin:4px 0 0;padding-left:20px;font-size:12.5px;line-height:1.7">' +
      (g.school || []).map(function (s) { return '<li>' + U.esc(s) + '</li>'; }).join('') + '</ul>' +
      '<div class="small" style="font-weight:600;margin-top:8px">家庭配合策略</div>' +
      '<ul style="margin:4px 0 0;padding-left:20px;font-size:12.5px;line-height:1.7">' +
      (g.home || []).map(function (s) { return '<li>' + U.esc(s) + '</li>'; }).join('') + '</ul></div>';

    return '<div class="goal st-' + g.status + '">' +
      '<div class="goal-top">' +
        '<div class="goal-sc"><b>' + r.total + '</b><span>优先级</span></div>' +
        '<div class="goal-main">' +
          '<div class="goal-tx"><span class="id">' + U.esc(g.id) + '</span>' + U.esc(g.text) + '</div>' +
          U.metaLine([
            U.badge(R.domainName(g.domain), 'b'),
            U.esc(g.type),
            '通过标准：' + U.esc(g.criteria === '—' ? '待定' : g.criteria),
            statusBadge,
            g.meetingTag ? U.badge(g.meetingTag, 'b') : '',
            g.edited ? U.badge('教师已改写', 'v') : ''
          ]) +
          (v.ok ? '' : '<div class="goal-warn' + (v.level === 'bad' ? ' bad' : '') + '">' +
            U.icon('alert', 14) + '<span>' + U.esc(v.msg) +
            (review ? '　<a href="javascript:void(0)" data-act="rewriteGoal" data-arg="' + g.id + '">去改写</a>' : '') +
            '</span></div>') +
        '</div>' +
        '<div class="goal-act">' + mainAct + more + '</div>' +
      '</div>' +

      (g.genWhy ? U.panel('<b>为什么建议这一条：</b>' + U.esc(g.genWhy), 'soft') : '') +

      U.fold('优先级 ' + r.total + ' 分 = 因子 ' + r.score + ' + 维度缺口 ' + r.gap + ' · 依据 ' +
        (basis.length + gb.length + dbasis.length) + ' 条',
        '<div style="margin-top:12px">' +
          '<div style="font-size:12px;color:var(--muted);margin-bottom:6px">六个因子 × 权重（园所可配置）</div>' +
          '<div class="factor-list" style="padding:0">' + factors.map(function (f) {
            return '<span class="factor ' + (f.sign > 0 ? 'plus' : 'minus') + '" title="' +
              U.esc((g.factorWhy && g.factorWhy[f.key]) || f.desc) + '">' +
              U.esc(f.name) + ' ' + (f.value > 0 ? '+' : '') + f.value + (f.enabled ? '' : '（已关闭）') + '</span>';
          }).join('') + '<span class="factor" style="background:#fff">= ' + r.score + '</span></div>' +
          (g.factorWhy ? '<div class="small muted" style="margin-top:8px;line-height:1.8">' +
            R.FACTORS.map(function (f) {
              return '<b>' + U.esc(f.name) + '</b>：' + U.esc(g.factorWhy[f.key] || '—') +
                '（' + (g.factors[f.key] > 0 ? '+' : '') + g.factors[f.key] + '）';
            }).join('<br>') + '</div>' : '') +
        '</div>' +
        '<div class="divider"></div>' +
        '<div style="font-size:12px;color:var(--muted);margin-bottom:4px">这个维度现在到底怎么样（由上传的数据算出）</div>' +
        (dbasis.length
          ? '<div class="table-scroll"><table class="table compact"><thead><tr>' +
            '<th>来源</th><th>数据项</th><th>原始值</th><th>权重</th><th>得分</th>' +
            '</tr></thead><tbody>' + dbasis.map(function (b) {
              return '<tr><td>' + U.esc(b.srcName) + '</td><td>' + U.esc(b.k) + '</td>' +
                '<td class="small muted">' + U.esc(b.raw) + '</td>' +
                '<td class="nw">' + Math.round(b.w * 100) + '%</td><td class="nw"><b>' + b.v + '</b></td></tr>';
            }).join('') + '</tbody></table></div>'
          : '<div class="small muted">这个维度还没有可推算的数据，优先级只按园所因子给分。</div>') +
        '<div class="divider"></div>' +
        '<div style="font-size:12px;color:var(--muted);margin-bottom:4px">' +
          (gb.length ? '这条建议依据的是这些已入档字段（按最弱项排序）' : '依据溯源（点开即原始报告对应项）') + '</div>' +
        (gb.length
          ? '<div class="table-scroll"><table class="table compact"><thead><tr>' +
            '<th style="width:104px">来源</th><th>数据项</th><th>原始值</th><th style="width:52px">折算</th>' +
            '</tr></thead><tbody>' + gb.map(function (b) {
              return '<tr><td class="small">' + U.esc(b.srcName) + '</td>' +
                '<td class="small">' + U.esc(b.k) + '<div class="small muted">' + U.esc(b.how || '') + '</div></td>' +
                '<td class="small muted">' + U.esc(b.raw) + '</td>' +
                '<td class="nw"><b>' + b.v + '</b></td></tr>';
            }).join('') + '</tbody></table></div>'
          : basis.map(function (b) {
              var seg = b.split(' · ');
              return '<div style="display:flex;gap:8px;align-items:flex-start;padding:6px 0;border-bottom:1px dashed var(--line);font-size:12.5px">' +
                U.badge(seg[0], 'outline') +
                '<span style="flex:1">' + U.esc(seg.slice(1).join(' · ')) + '</span></div>';
            }).join('')) +
        (g.basis && g.basis.length
          ? '<div class="mt8"><button class="btn sm ghost" data-act="evidence" data-arg="' + g.basis.join(',') + '">' +
            U.icon('link', 14) + ' 展开依据原文</button></div>' : '') +
        '<div class="mt8">' + U.panel('<b>评量方式：</b>' + U.esc(g.measure.join(' / ')) +
          '　<b>频次：</b>' + U.esc(g.frequency) + '　<b>主责：</b>' + U.esc(g.owner) +
          (g.dropReason ? '<br><b>忽略理由：</b>' + U.esc(g.dropReason) : '')) + '</div>') +

      U.fold('写进成稿的样子：长期目标 + 短期目标 + 双策略',
        '<div style="margin-top:10px">' + longHtml + '</div>' +
        '<div class="divider"></div>' +
        '<div class="small" style="font-weight:600">短期具体目标（1–2 个月达成）</div>' + shortHtml +
        stratHtml,
        { tag: g.shorts && g.shorts.length ? g.shorts.length + ' 条短期' : '' }) +
      '</div>';
  }

  function weightPanel() {
    var st = R.store.get();
    return '<div style="margin-top:12px">' +
      '<div class="btn-row" style="margin-bottom:10px">' +
      '<button class="btn sm" data-act="resetWeights">恢复产品默认值</button>' +
      '<span class="small muted">权重是产品默认值，不是定论；改动会记录"谁在什么时候改过"</span></div>' +
      R.FACTORS.map(function (f) {
        var on = st.enabled[f.key] !== false;
        var w = st.weights[f.key];
        return '<div style="margin-bottom:12px">' +
          '<div class="row" style="justify-content:space-between">' +
            '<label style="font-size:12.5px;font-weight:600">' + U.esc(f.name) +
              ' <span class="badge ' + (f.sign > 0 ? 'g' : 'r') + '">' + (f.sign > 0 ? '正向' : '负向') + '</span></label>' +
            '<label class="small muted"><input type="checkbox" data-en="' + f.key + '"' + (on ? ' checked' : '') + '> 启用</label>' +
          '</div>' +
          '<div class="range-row"><input type="range" min="0" max="2" step="0.5" value="' + w + '" data-w="' + f.key + '">' +
          '<span class="val">×' + w + '</span></div>' +
          '<div class="small muted">' + U.esc(f.desc) + '</div>' +
        '</div>';
      }).join('') + '</div>';
  }

  function sideFolds() {
    var ranked = R.engine.rankedGoals();
    var invalid = ranked.filter(function (r) {
      return r.g.status !== 'dropped' && !R.engine.validateGoalText(r.g.text, r.g.criteria).ok;
    });
    var perDim = R.DOMAINS.map(function (d) {
      var n = ranked.filter(function (r) { return r.g.domain === d.code && r.g.status !== 'dropped'; }).length;
      return U.esc(d.short) + ' ' + n;
    }).join(' · ');
    return U.fold('目标规范性校验' + (invalid.length ? '（' + invalid.length + ' 条待补）' : '（全部通过）'),
      invalid.length
        ? invalid.map(function (r) {
          var v = R.engine.validateGoalText(r.g.text, r.g.criteria);
          return '<div class="todo' + (v.level === 'bad' ? ' urgent' : '') + '"><div class="box"></div><div class="tx">' +
            '<b>' + U.esc(r.g.id) + '</b><p>' + U.esc(v.msg) + '</p></div></div>';
        }).join('')
        : '<div class="small" style="color:var(--green)">全部目标均满足"情境 + 可观察行为 + 通过标准"。</div>' +
          U.note('系统拒绝"提高 / 加强 / 改善"这类不可观察动词单独成句。'),
      { tag: '点开查看' }) +
      U.fold('各维度目标分布：' + perDim, U.panel(
        '六个维度都要有目标，但不要求每个维度都设核心目标。当前共 ' +
        R.store.get().goals.filter(function (g) { return g.status !== 'dropped'; }).length + ' 条。'), { tag: '点开查看' }) +
      U.fold('优先级权重：6 个因子可开关、可调', weightPanel(), { tag: '点开调整' });
  }

  R.goalCard = goalCard;

  R.views.goals = {
    title: '目标建议',
    render: function () {
      var s = R.engine.goalStats();
      var role = R.store.role();
      var ranked = R.engine.rankedGoals().filter(function (r) { return r.g.status !== 'dropped'; });
      var computed = ranked.filter(function (r) { return r.g.origin === 'computed'; }).length;
      var derived = computed === ranked.length && ranked.length > 0;

      var hero = '<div class="hero">' +
        '<div class="h-k">按 6 个能力维度组织 · 共 ' + ranked.length + ' 条建议' +
          (computed && !derived ? '（其中 ' + computed + ' 条按数据算出）' : '') + '</div>' +
        '<div class="h-t">' + (derived
          ? '这 ' + ranked.length + ' 条目标是从你上传的数据里推出来的，不是套模板'
          : '每条目标都能追到依据：哪份材料、哪个字段、怎么折算的') + '</div>' +
        '<div class="h-d">' +
        '长期目标（融合 / 小组 / 整合）+ 短期目标 + 园内与家庭两套策略，可直接进成稿。' +
        '<b>审议（采纳 / 改写 / 降级 / 忽略）在「IEP 会议调校与审议」里做。</b></div>' +
        '<div class="h-act">' +
          '<button class="btn primary lg" data-act="stepNext" data-arg="goals-meeting">去 IEP 会议调校与审议（' + s.pending + ' 条待审）</button>' +
        '</div></div>';

      /* 按维度分组，读起来跟《能力分析》表一致 */
      var groups = R.DOMAINS.map(function (d) {
        var rows = ranked.filter(function (r) { return r.g.domain === d.code; });
        return { d: d, rows: rows };
      }).filter(function (x) { return x.rows.length; });

      var prof = R.engine.profileComputed();
      var body = groups.map(function (g) {
        var p = prof.filter(function (x) { return x.code === g.d.code; })[0] || {};
        var t = R.engine.targetOf ? R.engine.targetOf(p) : null;
        return '<div class="goal-group">' +
          '<div class="gg-head">' +
            '<b>' + U.esc(g.d.name) + '</b>' +
            '<span class="small muted">' +
              (p.score !== null && p.score !== undefined
                ? '当前 ' + p.score + ' 分（' + U.esc(p.level) + '）' + (t ? ' · 学期目标 ' + t.v + ' 分' + (t.auto ? '（按当前水平自动设）' : '') : '')
                : '暂无数据') +
            '</span>' +
            '<span class="gg-n">' + g.rows.length + ' 条</span>' +
          '</div>' +
          g.rows.map(function (r) { return goalCard(r, { review: false }); }).join('') +
          '</div>';
      }).join('');

      if (!body) {
        body = '<div class="card">' + U.empty('还没有可推算的数据：先上传 PEP-3 / VB-MAPP / 感统 / 医学诊断，或填写观察表') +
          '<div class="center" style="margin-bottom:14px">' +
          '<button class="btn primary" data-act="goto" data-arg="archive">去上传材料</button></div></div>';
      }

      return U.pageHead({
        icon: 'goals', title: '目标建议',
        sub: '引擎按可解释的评分规则排序，并把理由摊开给老师看。<b>所有建议默认「待审议」，未经审议确认不得作为正式 IEP 使用。</b>'
      }) + hero + body +
        '<div class="mt14">' +
          '<div class="btn-row" style="margin-bottom:10px">' +
            '<button class="btn sm" data-act="showJSON">结构化输出</button>' +
            (role.canEdit ? '<button class="btn sm ghost" data-act="regenGoals">按最新数据重新生成建议</button>' : '') +
          '</div>' +
          sideFolds() +
        '</div>' +
        (role.canEdit ? '' : U.notice('info', 'info', '当前身份为只读：可查看目标与依据，审议动作由教师在会议页完成。'));
    },
    mount: function () {
      Array.prototype.forEach.call(document.querySelectorAll('[data-w]'), function (el) {
        el.addEventListener('input', function () {
          var k = el.getAttribute('data-w');
          var v = parseFloat(el.value);
          R.store.setWeight(k, v);
          var val = el.parentNode.querySelector('.val');
          if (val) val.textContent = '×' + v;
        });
        el.addEventListener('change', function () {
          var k = el.getAttribute('data-w');
          R.store.log(R.store.role().short, '调整权重', '因子「' + k + '」权重改为 ×' + el.value);
          R.render();
        });
      });
      Array.prototype.forEach.call(document.querySelectorAll('[data-en]'), function (el) {
        el.addEventListener('change', function () {
          var k = el.getAttribute('data-en');
          R.store.setEnabled(k, el.checked);
          R.store.log(R.store.role().short, '权重开关', '因子「' + k + '」' + (el.checked ? '启用' : '关闭'));
          R.render();
        });
      });
    }
  };

  /* 按最新数据重新生成（会覆盖现有目标，先确认） */
  R.actions.regenGoals = function () {
    if (!R.store.role().canEdit) { U.toast('当前身份无编辑权限', 'warn'); return; }
    var n = R.gen.list().length;
    if (!n) { U.toast('还没有可推算的数据，先上传材料或填观察表', 'warn'); return; }
    U.modal('按最新数据重新生成目标建议',
      '<div class="notice warn"><span class="ic">' + U.icon('alert', 18) + '</span><div>' +
      '将按当前已入档的数据重新推算，生成 <b>' + n + '</b> 条建议，并<b>覆盖现有目标</b>（含已采纳的）。' +
      '如果只是补了一条观察或改了一个字段，建议用这个动作。</div></div>',
      [{
        label: '确认重新生成', cls: 'primary', onClick: function () {
          var m = R.gen.apply();
          U.closeModal();
          U.toast('已生成 ' + m + ' 条建议，全部待审议', 'ok');
          R.render();
        }
      }]);
  };

  /* ---------- 动作 ---------- */
  R.actions.adoptGoal = function (id) {
    if (!R.store.role().canEdit) { U.toast('当前身份无编辑权限', 'warn'); return; }
    R.store.setGoalStatus(id, 'adopted');
    R.store.log(R.store.role().short, '采纳目标', id + ' 状态改为已采纳');
    U.toast(id + ' 已采纳', 'ok');
    R.render();
  };

  R.actions.deferGoal = function (id) {
    if (!R.store.role().canEdit) { U.toast('当前身份无编辑权限', 'warn'); return; }
    R.store.setGoalStatus(id, 'deferred');
    R.store.log(R.store.role().short, '降级目标', id + ' 降级为学期后段');
    U.toast(id + ' 已降级为学期后段');
    R.render();
  };

  R.actions.rewriteGoal = function (id) {
    var g = R.store.goal(id);
    if (!g) return;
    if (!R.store.role().canEdit) { U.toast('当前身份无编辑权限', 'warn'); return; }
    U.modal('改写目标 · ' + id,
      '<div class="field"><label>目标文本<span class="hint">在〔情境〕，〔可观察行为〕，〔次数 / 正确率 / 时长标准〕</span></label>' +
      '<textarea id="rwText">' + U.esc(g.text) + '</textarea></div>' +
      '<div class="field"><label>通过标准</label><input type="text" id="rwCrit" value="' + U.esc(g.criteria) + '"></div>' +
      '<div id="rwCheck"></div>' +
      '<div class="small muted mt8">可观察动词库示例：说、指、拿、看、模仿、配对、回答、跟随、轮流、等待、完成、表达、请求、示意、洗手、咀嚼、站、跳、捏、扣、点数……</div>',
      [{
        label: '保存改写', cls: 'primary', onClick: function () {
          var text = document.getElementById('rwText').value.trim();
          var crit = document.getElementById('rwCrit').value.trim();
          if (!text) { U.toast('目标文本不能为空', 'warn'); return; }
          R.store.updateGoal(id, { text: text, criteria: crit });
          R.store.log(R.store.role().short, '改写目标', id + '：' + text);
          U.closeModal();
          U.toast('已保存并记录留痕', 'ok');
          R.render();
        }
      }]);
    var ta = document.getElementById('rwText');
    if (ta) ta.addEventListener('input', function () {
      var v = R.engine.validateGoalText(ta.value, document.getElementById('rwCrit').value);
      document.getElementById('rwCheck').innerHTML = v.ok
        ? U.notice('ok', 'check', v.msg)
        : U.notice(v.level === 'bad' ? 'risk' : 'warn', 'alert', v.msg);
    });
  };

  R.actions.dropGoal = function (id) {
    var g = R.store.goal(id);
    if (!g) return;
    if (!R.store.role().canEdit) { U.toast('当前身份无编辑权限', 'warn'); return; }
    U.modal('忽略目标 · ' + id,
      '<div class="small muted" style="margin-bottom:10px">目标：' + U.esc(g.text) + '</div>' +
      '<div class="field"><label>忽略理由<span class="hint">将记录在案，可追溯</span></label>' +
      '<textarea id="dpReason" placeholder="如：已有优势，不在本学期重复设为目标"></textarea></div>',
      [{
        label: '确认忽略', cls: 'danger', onClick: function () {
          var reason = document.getElementById('dpReason').value.trim();
          if (!reason) { U.toast('请填写忽略理由', 'warn'); return; }
          R.store.setGoalStatus(id, 'dropped', reason);
          R.store.log(R.store.role().short, '忽略目标', id + '：' + reason);
          U.closeModal();
          U.toast(id + ' 已忽略');
          R.render();
        }
      }]);
  };

  R.actions.resetWeights = function () {
    var st = R.store.get();
    st.weights = JSON.parse(JSON.stringify(R.DEFAULT_WEIGHTS));
    st.enabled = JSON.parse(JSON.stringify(R.DEFAULT_ENABLED));
    R.store.save();
    R.store.log(R.store.role().short, '恢复默认权重', '六因子权重恢复为产品默认值');
    U.toast('已恢复默认权重');
    R.render();
  };

  R.actions.showJSON = function () {
    var json = JSON.stringify(R.engine.exportJSON(), null, 2);
    U.modal('引擎结构化输出（可对接融 AI 平台 IEP 中心）',
      '<pre class="json">' + U.esc(json) + '</pre>' +
      '<div class="small muted mt8">引擎输出为结构化 JSON：六个能力维度 + 长期目标三层 + 短期目标 + 双策略，前端据此渲染，也便于接入既有平台的 IEP 中心。</div>',
      [{
        label: '复制 JSON', cls: 'primary', onClick: function () {
          try {
            navigator.clipboard.writeText(json);
            U.toast('已复制到剪贴板', 'ok');
          } catch (e) { U.toast('复制失败，请手动选择文本', 'warn'); }
        }
      }, {
        label: '下载 .json', cls: '', onClick: function () {
          R.util.download('IEP_' + R.CASE.id + '_' + R.store.get().doc.version + '.json', json, 'application/json');
        }
      }]);
  };

})(window.RIEP);
