/* ============================================================
   obs.js · 三张观察表：上传原件解析 + 在线填报（同一张表，两条入口）
   小组班级教师日常观察表 / 融合班级教师日常观察表 / 家长居家观察表
   解析结果先填进表里由老师核对，核对后才写进档案，绝不静默入库。
   ============================================================ */
(function (R) {
  'use strict';
  var U = R.ui;

  function chars(t) { return String(t || '').replace(/\s/g, '').length; }
  function kindName(k) {
    return { pdf: 'PDF 文字层', docx: 'Word 文档', text: '纯文本', ocr: '本机识别',
      paste: '粘贴文字', manual: '手工填报' }[k] || k;
  }

  /* ---------- 入口：选表 ---------- */
  function pickTeacher() {
    var st = R.store.get();
    var of = st.obsFilled || {};
    U.modal('教师观察表（两张）',
      U.notice('info', 'info', '园所日常用两张表，<b>不能互相替代</b>：' +
        '<b>小组班级教师日常观察表</b>看集体教学情境下的行为（7 个维度）；' +
        '<b>融合班级教师日常观察表</b>看半融合情境下的表现（健康 / 语言 / 社交 / 科学 / 艺术）。' +
        '两张都支持<b>上传原件自动解析</b>或<b>在线填报</b>。') +
      '<div class="obs-pick">' + ['group', 'fusion'].map(function (k) {
        var T = R.OBS_TYPES[k];
        var f = st.obsFiles && st.obsFiles[k];
        return '<a class="obs-pick-c' + (of[k] ? ' done' : '') + '" href="javascript:;" ' +
          'data-act="openObs" data-arg="' + k + '">' +
          '<div class="op-h">' + U.esc(T.name) + (of[k] ? '<span class="op-tag">已回收</span>' : '') + '</div>' +
          '<div class="op-d">' + U.esc(T.by) + ' · ' + T.dims.length + ' 个维度 · ' +
          '优势 / 薄弱 两栏</div>' +
          '<div class="op-f">' + (f ? '原件：' + U.esc(f.file) : '尚未上传原件') + '</div>' +
          '<div class="op-go">上传或填报 ' + U.icon('plus', 13) + '</div></a>';
      }).join('') + '</div>', []);
  }

  /* ---------- 上传：选文件 ---------- */
  function uploadFlow(who) {
    var T = R.OBS_TYPES[who];
    var f0 = R.store.obsFile(who);
    U.modal('上传' + T.name,
      U.notice('info', 'info', '支持 <b>Word(.docx) / PDF / 文本 / 图片</b>。文件只在<b>本机浏览器</b>里解析，不上传服务器；' +
        '解析出的内容会先填进表里让你核对，核对后才入档。') +
      (f0 ? U.notice('warn', 'alert', '这份档案已有一份「' + U.esc(f0.file) + '」，重新上传会替换。') : '') +
      '<div class="field"><label>选择文件</label>' +
      '<input type="file" id="upObsFile" accept=".pdf,.docx,.txt,.md,.csv,.png,.jpg,.jpeg">' +
      '<div class="small muted mt6">Word 原件按表格读两栏最准；PDF / 图片没有表格结构，会按段落判断后再交给你核对。</div></div>' +
      '<div class="field"><label>填写人<span class="pf-sub">留空用默认</span></label>' +
      '<input type="text" id="upObsBy" value="' + U.esc(T.by) + '"></div>' +
      '<div class="field"><label>观察日期</label>' +
      '<input type="date" id="upObsDate" value="' + U.esc(new Date().toISOString().slice(0, 10)) + '"></div>',
      [{
        label: '开始解析', cls: 'primary', onClick: function () {
          var fi = document.getElementById('upObsFile');
          var f = fi && fi.files && fi.files[0];
          if (!f) { U.toast('请先选择要解析的观察表文件', 'warn'); return; }
          var by = (document.getElementById('upObsBy') || {}).value || T.by;
          var d = (document.getElementById('upObsDate') || {}).value || '';
          runObs(who, f, { by: by, date: d });
        }
      }, {
        label: '不用文件，直接填报', onClick: function () { openForm(who); }
      }]);
  }

  /* ---------- 解析中 ---------- */
  function runObs(who, file, meta) {
    var T = R.OBS_TYPES[who];
    var steps = ['① 读取文件', '② 提取文字 / 表格', '③ 分出优势与薄弱', '④ 填表待你核对'];
    var m = { file: file.name, size: file.size ? Math.round(file.size / 1024) + ' KB' : '' };
    U.modal('解析中 · ' + T.name,
      '<div class="parse-box"><div class="pb-file">' + U.icon('doc', 15) + ' ' + U.esc(m.file) +
      ' <span class="muted">' + U.esc(m.size) + '</span></div>' +
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
    }, 300);

    R.parseFile(file).then(function (res) {
      clearInterval(timer);
      i = 3; paint(true);
      meta.kind = res.kind; meta.chars = chars(res.text); meta.pages = res.pages || 1;
      setTimeout(function () {
        if (res.kind === 'scan') { obsScan(who, file, meta, res); return; }
        var g = R.parse.guessObs(res.text);
        if (g && g !== who) {
          U.modal('这份文件看起来是另一张表',
            U.notice('warn', 'alert', '你上传到了「' + U.esc(T.name) + '」，但文件内容更像' +
              '<b>' + U.esc(R.OBS_TYPES[g].name) + '</b>。') +
            '<div class="small muted">选一张表继续；内容会按所选表的维度重新解析。</div>',
            [{
              label: '按「' + R.OBS_TYPES[g].name + '」解析', cls: 'primary', onClick: function () {
                finish(g, res, meta);
              }
            }, { label: '仍按「' + T.name + '」解析', onClick: function () { finish(who, res, meta); } }]);
          return;
        }
        finish(who, res, meta);
      }, 320);
    }).catch(function (err) {
      clearInterval(timer);
      U.modal('没能解析这份文件',
        U.notice('warn', 'alert', '<b>' + U.esc((err && err.message) || '未知错误') + '</b>'),
        [{ label: '改为手工填报', cls: 'primary', onClick: function () { openForm(who); } }]);
    });
  }

  function finish(who, res, meta) {
    var p = R.parse.obs(who, res.text, { tables: res.tables });
    openForm(who, { parsed: p, meta: meta, text: res.text });
  }

  /* ---------- 扫描件：本机识别 ---------- */
  function obsScan(who, file, meta, res) {
    var T = R.OBS_TYPES[who];
    var thumbs = (res.thumbs || []).map(function (t) {
      return '<figure class="scan-thumb"><img src="' + t.src + '" alt="第 ' + t.page + ' 页">' +
        '<figcaption>第 ' + t.page + ' 页</figcaption></figure>';
    }).join('');
    U.modal('扫描件 · ' + T.name,
      U.notice('warn', 'alert', '<b>' + U.esc(res.reason || '这份文件没有文字层（扫描件或照片）') + '</b>。' +
        '可以用本机识别引擎读字，也可以粘贴文字或直接填报。') +
      (thumbs ? '<div class="scan-strip">' + thumbs + '</div>' : '') +
      '<div id="scanProg"></div>' +
      '<div class="field"><label>粘贴表格文字<span class="pf-sub">从 Word / PDF 里复制整段即可</span></label>' +
      '<textarea id="pasteTx" rows="5" placeholder="例如：情绪&#10;在家整体情绪比较平稳……&#10;情绪激动的情况多出现在出门玩、做事情前……"></textarea></div>',
      [{
        label: '用本机识别引擎读字', cls: 'primary', onClick: function () {
          if (!R.ocr || !R.ocr.supported()) { U.toast('当前浏览器不支持本机识别，请粘贴文字或手工填报', 'warn'); return; }
          var box = document.getElementById('scanProg');
          if (box) box.innerHTML = '<div class="pb-detail">正在准备识别引擎（首次约需十几秒）…</div>';
          R.parse.ocr(res.thumbs || [], function (i, t, r) {
            if (!box) return;
            box.innerHTML = '<div class="pb-detail">已识别第 ' + i + ' / ' + t + ' 页' +
              (r && r.conf ? '（置信度 ' + r.conf + '）' : '') + '…</div>';
          }).then(function (o) {
            if (chars(o.text) < 12) {
              if (box) box.innerHTML = '<div class="pb-detail">没能读出可用文字，可粘贴文字或手工填报。</div>';
              U.toast('识别结果为空，换更清晰的扫描件或粘贴文字', 'warn');
              return;
            }
            meta.kind = 'ocr'; meta.ocrConf = o.conf; meta.chars = chars(o.text);
            var p = R.parse.obs(who, o.text, { ocr: true });
            openForm(who, { parsed: p, meta: meta, text: o.text });
          }).catch(function (e) {
            if (box) box.innerHTML = '<div class="pb-detail">识别失败：' + U.esc(e.message || e) + '（可粘贴文字或手工填报）</div>';
          });
        }
      }, {
        label: '解析这段文字', onClick: function () {
          var tx = (document.getElementById('pasteTx') || {}).value || '';
          if (chars(tx) < 12) { U.toast('粘贴的文字太短，先粘完整段落再解析', 'warn'); return; }
          meta.kind = 'paste'; meta.chars = chars(tx);
          openForm(who, { parsed: R.parse.obs(who, tx), meta: meta, text: tx });
        }
      }, { label: '直接手工填报', onClick: function () { openForm(who); } }]);
  }

  /* ---------- 填表（上传解析后的值也进这张表） ---------- */
  function openForm(who, opt) {
    opt = opt || {};
    var T = R.OBS_TYPES[who];
    var st = R.store.get();
    var saved = (st.observation || {})[who] || {};
    var P = opt.parsed;
    var meta = opt.meta || R.store.obsFile(who);

    var head = '';
    if (P) {
      head = U.notice(P.filled ? 'info' : 'warn', P.filled ? 'info' : 'alert',
        '<b>已从' + U.esc((meta && meta.file) || '文件') + '读到 ' + P.filled + ' / ' + P.total + ' 个维度</b>' +
        (P.from === 'table' ? '（按表格两栏读取，与原件一致）' : '（这份文件没有表格结构，按段落判断了优势 / 薄弱）') +
        '<br>' + U.esc(P.note || '') + ' 下面每一行都可改，改完点「保存并回收」才入档。');
    } else if (meta && meta.file) {
      head = U.notice('info', 'info', '当前内容来自 <b>' + U.esc(meta.file) + '</b>（' +
        U.esc(kindName(meta.kind)) + (meta.ocrConf ? ' · 置信度 ' + meta.ocrConf : '') + '），可直接修改后保存。');
    }

    var rows = T.dims.map(function (d, i) {
      var sv = saved[d.dim] || {};
      var pv = null;
      if (P) {
        P.rows.forEach(function (r) { if (r.dim === d.dim) pv = r; });
      }
      var sVal = pv ? pv.strength : (sv.strength || '');
      var nVal = pv ? pv.need : (sv.need || '');
      var conf = pv ? pv.conf : (sv.strength || sv.need ? 'saved' : '');
      var badge = conf === 'high' ? '<span class="op-tag ok">按表格读取</span>'
        : conf === 'mid' ? '<span class="op-tag warn">段落判断 · 请核对</span>'
          : conf === 'low' ? '<span class="op-tag warn">只读到一栏</span>'
            : conf === 'saved' ? '<span class="op-tag">已入档</span>' : '';
      return '<div class="obs-row' + (d.onlyNeed ? ' one' : '') + '">' +
        '<div class="or-h"><b>' + (i + 1) + '. ' + U.esc(d.dim) + '</b>' + badge +
        '<span class="or-tip">' + U.esc(d.tip) + '</span></div>' +
        (d.onlyNeed ? '' :
          '<div class="or-c"><label>幼儿现有优势能力</label>' +
          '<textarea rows="2" data-od="' + U.esc(d.dim) + '" data-oc="strength" ' +
          'placeholder="他现在已经能做到什么">' + U.esc(sVal) + '</textarea></div>') +
        '<div class="or-c"><label>' + (d.onlyNeed ? '家长需求' : '现存薄弱问题与发展需求') + '</label>' +
        '<textarea rows="2" data-od="' + U.esc(d.dim) + '" data-oc="need" ' +
        'placeholder="' + (d.onlyNeed ? '这学期最希望孩子在哪方面进步' : '还做不到、需要练的是什么') + '">' +
        U.esc(nVal) + '</textarea></div>' +
        '</div>';
    }).join('');

    var body = head +
      '<div class="obs-form">' +
      '<div class="of-head"><span class="of-dim">观察维度</span>' +
      '<span class="of-col">幼儿现有优势能力</span><span class="of-col">现存薄弱问题与发展需求</span></div>' +
      rows + '</div>' +
      '<div class="small muted mt8">填写人：' + U.esc((meta && meta.by) || T.by) +
      ' · 观察日期：' + U.esc((meta && meta.date) || '—') +
      ' · 时间戳随保存自动记录。</div>';

    var buttons = [{
      label: '上传文件自动填表', onClick: function () { uploadFlow(who); }
    }];
    if (R.store.role().canEdit || who === 'parent') {
      buttons.unshift({
        label: '保存并回收', cls: 'primary', onClick: function () {
          var out = {}, allText = '', n = 0;
          Array.prototype.forEach.call(document.querySelectorAll('#modalBody textarea[data-od]'), function (el) {
            var dim = el.getAttribute('data-od'), col = el.getAttribute('data-oc');
            var v = el.value.trim();
            out[dim] = out[dim] || { strength: '', need: '' };
            out[dim][col] = v;
            allText += v + ' ';
          });
          Object.keys(out).forEach(function (k) { if (out[k].strength || out[k].need) n++; });
          if (n < 3) { U.toast('请至少填写 3 个维度再保存', 'warn'); return; }

          var risk = R.engine.detectRisk(allText);
          R.store.setObsAll(who, out);
          if (meta && meta.file) {
            R.store.setObsFile(who, {
              file: meta.file, kind: meta.kind, chars: meta.chars, by: meta.by,
              date: meta.date, ocrConf: meta.ocrConf || 0, at: new Date().toISOString().slice(0, 16).replace('T', ' ')
            });
          }
          R.store.markObsFilled(who, true);
          R.store.log((meta && meta.by) || T.by, '提交观察表',
            T.name + '：' + n + ' / ' + T.dims.length + ' 个维度' +
            (meta && meta.file ? '（来源 ' + meta.file + '）' : '（在线填报）'));
          U.closeModal();

          if (risk) {
            R.store.setRisk(true, '观察中出现高风险表述：' + risk.join('、'));
            R.store.log('系统', '高风险识别', '触发转介与上报提示：' + risk.join('、'));
            U.modal('高风险识别 · 转介与上报',
              '<div class="notice risk"><span class="ic">' + U.icon('alert', 18) + '</span><div>' +
              '<b>识别到高风险表述：' + U.esc(risk.join('、')) + '</b><br>' +
              '系统不生成常规目标，改为流程指引（只做流程指引，不做原因判断）：<br>' +
              '① 24 小时内告知融合教师与园长 → ② 联系家长确认情况 → ③ 必要时转介医疗 / 心理 / 社会服务 → ④ 全程留痕。' +
              '</div></div>', [{
                label: '我已了解并按流程处理', cls: 'danger', onClick: function () {
                  R.store.handleRisk(); U.closeModal(); U.toast('已留痕'); R.render();
                }
              }]);
          } else {
            U.toast(T.name + '已回收，数据完整度更新', 'ok');
          }
          R.render();
        }
      });
    }
    if (!P) {
      buttons.push({
        label: '演示：语音转文字填充', onClick: function () {
          var demo = {
            group: ['跑跳爬完整，足尖踢球，投掷命中约 60%', '能表达需求并说明理由', '引导下能打招呼、交流玩具',
              '独立穿脱衣物鞋袜、接水如厕', '拼图独立完成，形状配对准确', '整体平稳，约定方式可平复', '课堂全程无离座'],
            fusion: ['情绪平稳，如厕穿脱独立，大肌肉发展较好', '指令理解突出，表达层次提升', '整节课无离座，冲突会用语请求',
              '形状孔洞准确，数字拼图可独立完成', '律动能全程跟做跟唱'],
            parent: ['提前预告能较快平复', '会自己上厕所、穿脱裤子袜子', '能数数，会讲幼儿园的事',
              '不太和小区孩子玩', '偶尔直接吞咽，要提醒', '喜欢拼图、足球、当小老师', '知道热水电源危险，外出会牵手',
              '叫名字多数会看过来', '希望练主动邀请小朋友一起玩']
          }[who] || [];
          var els = document.querySelectorAll('#modalBody textarea[data-oc="strength"]');
          Array.prototype.forEach.call(els, function (el, i) { if (!el.value && demo[i]) el.value = demo[i]; });
          U.toast('已填入语音转文字结果（演示）');
        }
      });
    }

    U.modal(T.name + '（' + T.dims.length + ' 个维度）', body, buttons);
  }

  /* ---------- 对外 ---------- */
  R.obsForm = { open: openForm, upload: uploadFlow };

  R.actions.openObs = function (who) {
    if (who === 'teacher') { pickTeacher(); return; }
    if (!R.OBS_TYPES[who]) { pickTeacher(); return; }
    openForm(who);
  };
  R.actions.uploadObs = function (who) {
    if (!R.OBS_TYPES[who]) return;
    if (!R.store.role().canEdit && R.store.role().key !== 'parent') {
      U.toast('当前身份为只读，不能上传材料', 'warn'); return;
    }
    uploadFlow(who);
  };

})(window.RIEP);
