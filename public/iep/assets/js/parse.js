/* ============================================================
   parse.js · 报告解析：文件 → 文字 → 结构化字段
   全部在本机浏览器内完成，文件不上传服务器。

   - PDF  ：pdf.js（本地 vendor；Worker 用 blob + importScripts，
            双击 file:// 打开也能跑）
   - DOCX ：ZIP 中央目录 + DecompressionStream('deflate-raw')
   - TXT  ：直读
   - 图片 / 纯扫描 PDF：没有文字层 → 返回 scan，交给人工（粘贴文字或逐项核对）

   字段规则按园所实际在用的报告版式写（PEP-3 系统导出、VB-MAPP 系统导出、
   医学诊断书、感统评估报告），命中不到的字段不猜，标"未识别"。
   ============================================================ */
(function (R) {
  'use strict';

  var PDF_LIB = 'assets/vendor/pdf.min.js';
  var PDF_WORKER = 'assets/vendor/pdf.worker.min.js';
  var isHttp = /^https?:/.test(location.protocol);

  function abs(p) { return new URL(p, location.href).href; }

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () { res(); };
      s.onerror = function () { rej(new Error('组件加载失败：' + src)); };
      document.head.appendChild(s);
    });
  }

  /* ---------------- PDF ---------------- */
  var pdfReady = null;

  function ensurePdf() {
    if (pdfReady) return pdfReady;
    pdfReady = (window.pdfjsLib
      ? Promise.resolve()
      : loadScript(abs(PDF_LIB))).then(function () {
      var lib = window.pdfjsLib;
      if (!lib) throw new Error('PDF 组件未就绪');
      /* file:// 下 new Worker(file://…) 会被拦（origin null），
         改用 blob worker，在 worker 内 importScripts 本地 worker 脚本 */
      try {
        var code = 'importScripts(' + JSON.stringify(abs(PDF_WORKER)) + ');';
        var url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
        lib.GlobalWorkerOptions.workerPort = new Worker(url);
      } catch (e) {
        lib.GlobalWorkerOptions.workerSrc = abs(PDF_WORKER);
      }
      return lib;
    });
    return pdfReady;
  }

  /* 文本层 → 按 y 归行，再按 x 拼行 */
  function itemsToLines(items) {
    var rows = [];
    (items || []).forEach(function (it) {
      var s = it.str;
      if (!s || !String(s).trim()) return;
      var x = it.transform[4], y = it.transform[5];
      var row = null;
      for (var i = 0; i < rows.length; i++) {
        if (Math.abs(rows[i].y - y) < 3) { row = rows[i]; break; }
      }
      if (!row) { row = { y: y, items: [] }; rows.push(row); }
      row.items.push({ x: x, s: s, w: it.width || 0 });
    });
    rows.sort(function (a, b) { return b.y - a.y; });
    return rows.map(function (r) {
      r.items.sort(function (a, b) { return a.x - b.x; });
      var out = '', prev = null;
      r.items.forEach(function (it) {
        if (prev && it.x - (prev.x + prev.w) > 6) out += ' ';
        out += it.s;
        prev = it;
      });
      return out.replace(/[\s\u00a0]+/g, ' ').trim();
    }).filter(function (l) { return l; });
  }

  function renderThumbs(doc, max, scale) {
    var out = [];
    var chain = Promise.resolve();
    for (var i = 1; i <= Math.min(doc.numPages, max || 3); i++) (function (n) {
      chain = chain.then(function () {
        return doc.getPage(n).then(function (page) {
          var vp = page.getViewport({ scale: scale || 1.25 });
          var cv = document.createElement('canvas');
          cv.width = Math.round(vp.width);
          cv.height = Math.round(vp.height);
          return page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise.then(function () {
            out.push({ page: n, src: cv.toDataURL('image/jpeg', 0.72) });
          });
        }).catch(function () { /* 单页渲染失败不阻断 */ });
      });
    })(i);
    return chain.then(function () { return out; });
  }

  function readPdf(file, onStage) {
    return ensurePdf().then(function (lib) {
      return file.arrayBuffer().then(function (buf) {
        var opt = {
          data: new Uint8Array(buf), cMapPacked: true,
          isEvalSupported: false, verbosity: 0
        };
        if (isHttp) opt.cMapUrl = abs('assets/vendor/cmaps/');
        return lib.getDocument(opt).promise.then(function (doc) {
          var pages = [], chain = Promise.resolve();
          for (var i = 1; i <= doc.numPages; i++) (function (n) {
            chain = chain.then(function () {
              return doc.getPage(n)
                .then(function (p) { return p.getTextContent(); })
                .then(function (tc) {
                  var lines = itemsToLines(tc.items);
                  pages.push(lines.join('\n'));
                  if (onStage) onStage(n, doc.numPages);
                })
                .catch(function () { pages.push(''); });
            });
          })(i);
          return chain.then(function () {
            var text = pages.join('\n');
            var out = { kind: 'pdf', pages: doc.numPages, text: text, lines: text.split('\n') };
            if (text.replace(/\s/g, '').length < 40) {
              out.kind = 'scan';
              out.reason = '这份 PDF 没有文字层（扫描件或照片）';
              /* 页图全部渲染出来：既能给人对照，也能送进本机识别引擎 */
              return renderThumbs(doc, 10, 1.6).then(function (t) {
                out.thumbs = t;
                try { doc.destroy(); } catch (e) { }
                return out;
              });
            }
            try { doc.destroy(); } catch (e) { }
            return out;
          });
        });
      });
    });
  }

  /* ---------------- DOCX（ZIP + DEFLATE） ---------------- */
  function u16(dv, p) { return dv.getUint16(p, true); }
  function u32(dv, p) { return dv.getUint32(p, true); }

  function inflate(bytes) {
    if (typeof DecompressionStream === 'undefined') {
      return Promise.reject(new Error('当前浏览器不支持解压 .docx，请导出 PDF 后上传'));
    }
    var ds = new DecompressionStream('deflate-raw');
    var stream = new Blob([bytes]).stream().pipeThrough(ds);
    return new Response(stream).arrayBuffer();
  }

  /* 取多个条目：把解压动作排成链，返回 [{name, bytes}] */
  function unzipAll(buf, test) {
    var dv = new DataView(buf);
    var len = buf.byteLength;
    var eocd = -1;
    for (var p = len - 22; p >= 0 && p > len - 66000; p--) {
      if (u32(dv, p) === 0x06054b50) { eocd = p; break; }
    }
    if (eocd < 0) return Promise.reject(new Error('文件不是有效的 ZIP / DOCX'));
    var count = u16(dv, eocd + 10);
    var cd = u32(dv, eocd + 16);
    var i = 0, at = cd;
    var out = [], chain = Promise.resolve();
    while (i < count) {
      if (u32(dv, at) !== 0x02014b50) break;
      var method = u16(dv, at + 10);
      var csize = u32(dv, at + 20);
      var nlen = u16(dv, at + 28);
      var elen = u16(dv, at + 30);
      var clen = u16(dv, at + 32);
      var lho = u32(dv, at + 42);
      var name = new TextDecoder('utf-8').decode(new Uint8Array(buf, at + 46, nlen));
      var lnlen = u16(dv, lho + 26);
      var lelen = u16(dv, lho + 28);
      var start = lho + 30 + lnlen + lelen;
      if (test.test(name)) {
        /* 用立即执行函数把当次循环的变量固定住，避免异步解压时读到循环后的值 */
        (function (nm, raw, mth) {
          var got = (mth === 0)
            ? Promise.resolve(new Uint8Array(raw.slice(0)).buffer)
            : inflate(raw);
          chain = chain.then(function () {
            return got.then(function (ab) {
              out.push({ name: nm, bytes: new Uint8Array(ab) });
            }).catch(function () { });
          });
        })(name, new Uint8Array(buf, start, csize), method);
      }
      at += 46 + nlen + elen + clen;
      i++;
    }
    return chain.then(function () { return out; });
  }

  function unzip(buf, wanted) {
    return unzipAll(buf, new RegExp('^' + wanted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'))
      .then(function (list) {
        return list.length ? new TextDecoder('utf-8').decode(list[0].bytes) : '';
      });
  }

  function decodeXml(s) {
    return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, function (_, d) { return String.fromCharCode(+d); })
      .replace(/&#x([0-9a-f]+);/gi, function (_, h) { return String.fromCharCode(parseInt(h, 16)); })
      .replace(/&amp;/g, '&');
  }

  function docxText(xml) {
    return decodeXml(xml
      .replace(/<w:tab\b[^>]*\/?>/g, '\t')
      .replace(/<w:br\b[^>]*\/?>/g, '\n')
      .replace(/<\/w:p>/g, '\n')
      .replace(/<w:tc[ >]/g, ' ')
      .replace(/<[^>]+>/g, ''))
      .replace(/\r/g, '')
      .replace(/[\u00a0]/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /* Word 表格：观察表是"维度 / 优势 / 薄弱"三列表，按表格读最准 */
  function docxTables(xml) {
    var out = [], re = /<w:tbl\b[\s\S]*?<\/w:tbl>/g, m;
    while ((m = re.exec(xml))) {
      var rows = [], rr = /<w:tr\b[\s\S]*?<\/w:tr>/g, r;
      while ((r = rr.exec(m[0]))) {
        var cells = [], cr = /<w:tc\b[\s\S]*?<\/w:tc>/g, c;
        while ((c = cr.exec(r[0]))) {
          var t = decodeXml(c[0]
            .replace(/<w:tab\b[^>]*\/?>/g, ' ')
            .replace(/<w:br\b[^>]*\/?>/g, '\n')
            .replace(/<\/w:p>/g, '\n')
            .replace(/<[^>]+>/g, ''))
            .replace(/\r/g, '').replace(/[\u00a0]/g, ' ')
            .replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();
          cells.push(t);
        }
        if (cells.length) rows.push(cells);
      }
      if (rows.length) out.push(rows);
    }
    return out;
  }

  var MIME_OF = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', bmp: 'image/bmp', emf: '', wmf: '' };

  function readDocx(file) {
    return file.arrayBuffer().then(function (buf) {
      return unzip(buf, 'word/document.xml').then(function (xml) {
        if (!xml) throw new Error('.docx 里没有正文（word/document.xml）');
        var text = docxText(xml);
        var out = { kind: 'docx', pages: 0, text: text, lines: text.split('\n'), tables: docxTables(xml) };
        /* 只有图片、没有文字的 docx（扫描件贴进 Word）→ 把内嵌图片取出来当页图 */
        if (text.replace(/\s/g, '').length < 20) {
          out.kind = 'scan';
          out.reason = '这份 Word 里没有文字，正文是 ';
          return unzipAll(buf, /^word\/media\//).then(function (list) {
            var thumbs = [];
            list.forEach(function (it, idx) {
              var ext = (it.name.split('.').pop() || '').toLowerCase();
              var mime = MIME_OF[ext];
              if (!mime || !it.bytes.length) return;
              thumbs.push({
                page: idx + 1,
                src: URL.createObjectURL(new Blob([it.bytes], { type: mime }))
              });
            });
            out.pages = thumbs.length;
            out.thumbs = thumbs;
            out.reason += thumbs.length + ' 张图片（多为报告扫描件）';
            return out;
          });
        }
        return out;
      });
    });
  }

  function readText(file) {
    return file.text().then(function (t) {
      t = String(t || '').replace(/\r/g, '');
      return { kind: 'text', pages: 0, text: t, lines: t.split('\n') };
    });
  }

  function readImage(file) {
    var src = URL.createObjectURL(file);
    return Promise.resolve({
      kind: 'scan', pages: 1, text: '', lines: [],
      thumbs: [{ page: 1, src: src }]
    });
  }

  /* 入口：文件 → { kind, pages, text, lines, thumbs? } */
  R.parseFile = function (file, onStage) {
    var name = String(file.name || '').toLowerCase();
    var ext = name.indexOf('.') >= 0 ? name.split('.').pop() : '';
    if (ext === 'pdf') return readPdf(file, onStage);
    if (ext === 'docx') return readDocx(file);
    if (ext === 'doc') return Promise.reject(new Error('旧版 .doc 无法直接解析，请另存为 .docx 或导出 PDF'));
    if (['txt', 'md', 'csv', 'text'].indexOf(ext) >= 0) return readText(file);
    if (['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif'].indexOf(ext) >= 0) return readImage(file);
    /* 未知后缀：先按 PDF 试，再按纯文本 */
    return readPdf(file, onStage).catch(function () { return readText(file); });
  };

  /* ============================================================
     字段抽取
     ============================================================ */
  var T = function (n) { return n < 10 ? '0' + n : String(n); };

  /* 在行数组里找第一条命中 */
  function grab(lines, re) {
    for (var i = 0; i < lines.length; i++) {
      var m = lines[i].match(re);
      if (m) return { m: m, line: lines[i], i: i };
    }
    return null;
  }
  function grabAll(lines, re) {
    var out = [];
    for (var i = 0; i < lines.length; i++) {
      var m = lines[i].match(re);
      if (m) out.push({ m: m, line: lines[i], i: i });
    }
    return out;
  }
  function add(o, k, v, ev, conf) {
    if (v === null || v === undefined || v === '') return;
    o.fields[k] = String(v);
    o.ev[k] = ev || '';
    o.conf[k] = conf || 'mid';
  }
  function dateOf(m, d) {
    var y = m[d || 1], mo = m[(d || 1) + 1], dd = m[(d || 1) + 2];
    return y + '-' + T(+mo) + '-' + T(+dd);
  }
  function clean(s) {
    return String(s || '').replace(/[\s\u00a0]+/g, ' ').replace(/^[：:\s、，,]+/, '').trim();
  }

  var PEP_DOM = ['模仿', '知觉', '精细动作', '粗大动作', '手眼协调', '认知表现', '口语认知'];
  var STAGE = { '1': '第 1 阶段（0–18 月）', '2': '第 2 阶段（18–30 月）', '3': '第 3 阶段（30–48 月）' };
  var STAGESET = {};
  Object.keys(STAGE).forEach(function (k) { STAGESET[STAGE[k]] = 1; });
  /* OCR 出来的中文常被切成"一 般 问 题"，先按汉字/数字边界把空格收回去 */
  function deSpace(t) {
    var s = String(t || '');
    for (var i = 0; i < 2; i++) {
      s = s.replace(/([\u4e00-\u9fa5]) ([\u4e00-\u9fa5])/g, '$1$2');
      s = s.replace(/([一-龥]) ([\d.])/g, '$1$2').replace(/([\d.]) ([一-龥])/g, '$1$2');
      s = s.replace(/([\u4e00-\u9fa5]) ([，。、；：])/g, '$1$2');
    }
    return s;
  }

  /* ---------- PEP-3 ---------- */
  function extractPep3(text, lines) {
    var o = { fields: {}, ev: {}, conf: {}, meta: {}, note: '' };
    var g;

    g = grab(lines, /(?:报告日期|评估日期)\s*[：:]\s*(\d{4})[-/年.](\d{1,2})[-/月.](\d{1,2})/);
    if (g) add(o, '评估日期', dateOf(g.m), g.line, 'high');

    g = grab(lines, /生理年龄\s*[：:]\s*(\d+)\s*岁\s*(\d+)?/);
    if (g) add(o, '生理年龄（月）', (+g.m[1]) * 12 + (+g.m[2] || 0), g.line, g.m[2] ? 'high' : 'mid');
    else {
      g = grab(lines, /生理年龄\s*[：:]\s*(\d+)\s*个月/);
      if (g) add(o, '生理年龄（月）', g.m[1], g.line, 'high');
    }

    g = grab(lines, /总分\s*(\d+)\s*[，,、]?\s*本次评分\s*(\d+)/);
    if (!g) g = grab(lines, /总分\s*(\d+)\s*[，,、]?\s*[得本]分?\s*(\d+)/);
    if (g) add(o, '功能发展总分', g.m[2] + ' / ' + g.m[1], g.line, 'high');

    g = grab(lines, /总体评估\s*[：:]\s*功能发展年龄水平评估\s*(?:处于)?\s*(?:或大于)?\s*(\d+)\s*个月/);
    if (g) add(o, '发展年龄（月）', g.m[1], g.line, 'high');

    var gapAll = grab(lines, /总体评估[^。\n]{0,40}?与生理年龄差距\s*(-?\d+)\s*个月/);
    if (gapAll) add(o, '与生理年龄差距（月）', gapAll.m[1], gapAll.line, 'high');
    else if (o.fields['发展年龄（月）'] && o.fields['生理年龄（月）']) {
      var dv = +o.fields['发展年龄（月）'], ca = +o.fields['生理年龄（月）'];
      add(o, '与生理年龄差距（月）', dv - ca, '按「发展年龄 − 生理年龄」算出', 'mid');
    }

    PEP_DOM.forEach(function (k) {
      var r = new RegExp(k + '\\s*[：:]?\\s*功能发展年龄水平评估处于\\s*(或大于)?\\s*(\\d+)\\s*个月');
      var h = grab(lines, r);
      if (h) { add(o, k, (h.m[1] ? '≥' : '') + h.m[2], h.line, 'high'); return; }
      var r2 = new RegExp(k + '\\s*[：:]\\s*([^，,]{1,24}个月[^，,]*)');
      var h2 = grab(lines, r2);
      if (h2) {
        var n = (h2.m[1].match(/(\d+)\s*个月/) || [])[1];
        if (n) add(o, k, (/大于|最高/.test(h2.m[1]) ? '≥' : '') + n, h2.line, 'mid');
      }
    });

    /* 病理行为：五项分别读"重度 / 轻度 / 正常"再合计 */
    var sev = 0, mil = 0, nor = 0, hit = 0, evs = [];
    grabAll(lines, /(情感|语言|感觉模式|游戏及物品爱好|人际关系[^：:]{0,16})\s*[：:]\s*有\s*(\d+)\s*项重度、?\s*(\d+)\s*项轻度、?\s*(\d+)\s*项正常/).forEach(function (h) {
      sev += +h.m[2]; mil += +h.m[3]; nor += +h.m[4]; hit++;
      evs.push(h.m[1] + ' ' + h.m[2] + '重/' + h.m[3] + '轻');
    });
    if (hit) {
      var evTx = '五项病理行为：' + evs.join('；') + '（共 ' + hit + ' 项领域）';
      add(o, '病理行为重度项数', sev, evTx, 'mid');
      add(o, '病理行为轻度项数', mil, evTx, 'mid');
      add(o, '病理行为正常项数', nor, evTx, 'mid');
    }

    g = grab(lines, /测评编号\s*[：:]\s*([A-Za-z0-9\-]{4,})/);
    if (g) { o.meta['测评编号'] = g.m[1]; add(o, '测评编号', g.m[1], g.line, 'high'); }
    g = grab(lines, /儿童姓名\s*[：:]\s*([^\s，,。]{1,12})/);
    if (g) o.meta['姓名'] = g.m[1];
    g = grab(lines, /儿童性别\s*[：:]\s*([男女])/);
    if (g) o.meta['性别'] = g.m[1];
    g = grab(lines, /机构名称\s*[：:]\s*([^\s，,。]{2,20})/);
    if (g) { o.meta['机构'] = g.m[1]; add(o, '机构', g.m[1], g.line, 'high'); }

    if (!o.fields['发展年龄（月）']) o.note = '未读到「总体评估」的发展年龄，可按七个领域均值估算。';
    return o;
  }

  /* ---------- VB-MAPP ---------- */
  var VB_STAGE_KEYS = ['提要求', '命名', '听者反应', '视觉配对', '独立游戏', '社交', '模仿', '仿说',
    '自发语音', '功能、特性、类别', '对话', '集体技能', '语言结构', '阅读', '书写', '数学'];

  function extractVb(text, lines) {
    var o = { fields: {}, ev: {}, conf: {}, meta: {}, note: '' };
    var g;

    g = grab(lines, /(?:报告日期|评估日期)\s*[：:]\s*(\d{4})[-/年.](\d{1,2})[-/月.](\d{1,2})/);
    if (g) add(o, '评估日期', dateOf(g.m), g.line, 'high');

    g = grab(lines, /生理年龄\s*[：:]\s*([^\s，,]{2,12})/);
    if (g) add(o, '生理年龄', clean(g.m[1]), g.line, 'high');

    function stageNear(k) {
      var re = new RegExp(k + '\\s*[：:]\\s*功能发展水平处于\\s*(?:或大于)?\\s*第\\s*(\\d)\\s*阶段');
      var h = grab(lines, re);
      if (h && STAGE[h.m[1]]) { add(o, k, STAGE[h.m[1]], h.line, 'high'); return; }
      var re2 = new RegExp(k + '\\s*[：:]\\s*[^\\n]{0,20}?第\\s*(\\d)\\s*阶段');
      var h2 = grab(lines, re2);
      if (h2 && STAGE[h2.m[1]]) add(o, k, STAGE[h2.m[1]], h2.line, 'mid');
    }
    VB_STAGE_KEYS.forEach(stageNear);

    g = grab(lines, /总体评估\s*[：:]\s*功能发展水平处于\s*(?:或大于)?\s*第\s*(\d)\s*阶段/);
    if (g && STAGE[g.m[1]]) add(o, '总体阶段', STAGE[g.m[1]], g.line, 'high');

    function block(from, to, cap) {
      var re = new RegExp(from + '\\s*[：:]\\s*([\\s\\S]{0,' + (cap || 460) + '}?)(?=' + to + ')');
      var m = text.match(re);
      return m ? m[1] : '';
    }
    function items(s) {
      return String(s || '').split(/[；;\n]/).map(function (x) {
        return clean(x).replace(/\s+/g, '');
      }).filter(function (x) { return x.length >= 2 && x.length <= 44; });
    }

    var sev = items(block('中重度障碍', '轻度障碍|中度障碍|【|第一类转衔|转衔评估|总体评估|签名'));
    var mid = items(block('中度障碍', '轻度障碍|中重度障碍|【|第一类转衔|转衔评估|签名'));
    var mil = items(block('轻度障碍', '中重度障碍|中度障碍|【|第一类转衔|转衔评估|签名'));
    if (sev.length) add(o, '障碍评估 · 中重度项', sev.join('、'), '障碍评估 · 中重度障碍段', 'high');
    if (mid.length) add(o, '障碍评估 · 中度项', mid.join('、'), '障碍评估 · 中度障碍段', 'high');
    if (mil.length) add(o, '障碍评估 · 轻度项', mil.join('、'), '障碍评估 · 轻度障碍段', 'high');

    ['第一类转衔', '第二类转衔', '第三类转衔'].forEach(function (k) {
      var h = grab(lines, new RegExp(k + '\\s*[：:]\\s*([^\\n]{4,70})'));
      if (h) add(o, k, clean(h.m[1]), h.line, 'high');
    });

    g = grab(lines, /测评编号\s*[：:]\s*([A-Za-z0-9\-]{4,})/);
    if (g) { o.meta['测评编号'] = g.m[1]; add(o, '测评编号', g.m[1], g.line, 'high'); }
    g = grab(lines, /儿童姓名\s*[：:]\s*([^\s，,。]{1,12})/);
    if (g) o.meta['姓名'] = g.m[1];

    var got = Object.keys(o.fields).filter(function (k) { return STAGESET[o.fields[k]]; }).length;
    if (!got) o.note = '没有读到里程碑阶段，可能是扫描版评分表（可用本机识别后再解析）。';
    return o;
  }

  /* ---------- 医学诊断（门诊病历 + 量表报告） ---------- */
  function extractMedical(text, lines) {
    var o = { fields: {}, ev: {}, conf: {}, meta: {}, note: '' };
    var g;

    g = grab(lines, /测评机构\s*[：:]\s*([^\n]{2,40}?)\s*(?:主试人|测评结果|$)/);
    if (g) add(o, '就诊机构', clean(g.m[1]), g.line, 'high');
    if (!o.fields['就诊机构']) {
      g = grab(lines, /(?:就诊机构|就诊医院|就诊单位|医疗机构|医院名称)\s*[：:]\s*([^\n]{2,30})/);
      if (g) add(o, '就诊机构', clean(g.m[1]), g.line, 'high');
      else {
        g = grab(lines, /([一-龥]{2,}(?:医院|儿童医院|保健院|妇幼保健院)[^\s，,。]{0,10})/);
        if (g) add(o, '就诊机构', clean(g.m[1]), g.line, 'mid');
      }
    }

    g = grab(lines, /科室\s*[：:]\s*([^\s，,。年]{2,10})/);
    if (g) add(o, '科室', clean(g.m[1]), g.line, 'high');

    g = grab(lines, /(?:就诊日期|就诊时间|门诊日期|测评日期)\s*[：:]\s*(\d{4})[-/年.](\d{1,2})[-/月.](\d{1,2})/);
    if (g) add(o, '就诊日期', dateOf(g.m), g.line, 'high');

    g = grab(lines, /(?:就诊卡号|卡号|病历号|门诊号)\s*[：:]\s*([A-Za-z0-9\-]{4,})/);
    if (g) add(o, '病历号 / 卡号', g.m[1], g.line, 'mid');

    /* 诊断：优先"诊断："结论行，其次 CARS/CABS/ABC 组合表述 */
    var dx = text.match(/诊\s*断\s*[：:]\s*([\s\S]{2,90}?)(?:诊\s*疗|医\s*师|提\s*示|$)/);
    if (dx) add(o, '诊断结论', clean(dx[1]).replace(/^\d+[.、]\s*/, '').replace(/[;；\s]+$/, ''), '门诊病历 · 诊断', 'high');
    if (!o.fields['诊断结论']) {
      ['诊断结论', '诊断意见', '初步诊断', '临床诊断'].some(function (k) {
        var h = grab(lines, new RegExp(k + '\\s*[：:]\\s*([^\\n]{2,100})'));
        if (h) { add(o, '诊断结论', clean(h.m[1]), h.line, 'high'); return true; }
        return false;
      });
    }

    g = grab(lines, /主\s*诉\s*[：:]?\s*([^\n]{2,60})/);
    if (g) add(o, '主诉', clean(g.m[1]), g.line, 'high');

    var hist = text.match(/现\s*病\s*史\s*[：:]?\s*([\s\S]{0,320}?)(?=既\s*往|个\s*人\s*史|家\s*族\s*史|体\s*格|专\s*科|辅\s*助|$)/);
    if (hist) add(o, '现病史要点', clean(hist[1]).slice(0, 260), '门诊病历 · 现病史段', 'mid');

    var dev = text.match(/(?:生长\s*发\s*育\s*史|发育史)\s*[：:]?\s*([^\n]{2,120})/);
    if (dev) add(o, '发育史', clean(dev[1]), '门诊病历 · 个人史段', 'mid');
    else {
      var dm = text.match(/(\d{1,2})\s*月会走[，,、]?\s*(\d{1,2})\s*月说?话/);
      if (dm) add(o, '发育史', dm[1] + ' 月会走、' + dm[2] + ' 月说话', '门诊病历 · 生长发育史', 'mid');
    }

    /* 量表：CARS / CABS / ABC / 感统 / 言语语言 */
    var cars = text.match(/CARS\s*[:：]?\s*([\d.]+)/i);
    var carsLv = text.match(/总\s*分\s*([\d.]+)\s*(轻\s*[-\-~]?\s*中\s*度|中\s*度|重\s*度|轻\s*度)/);
    if (cars) {
      var lv = carsLv ? carsLv[2].replace(/\s/g, '') : '';
      add(o, 'CARS 总分与程度', cars[1] + (lv ? ' · ' + lv : ''), '门诊病历辅助检查 / CARS 报告', 'high');
    } else if (carsLv) {
      add(o, 'CARS 总分与程度', carsLv[1] + ' · ' + carsLv[2].replace(/\s/g, ''), 'CARS 量表报告', 'mid');
    }

    var cabs = text.match(/CABS\s*[:：]?\s*([\d.]+)/i);
    if (cabs) {
      var cabsLv = text.match(/经\s*评\s*测[，,]?\s*被\s*试\s*儿\s*童\s*(有\s*[\u4e00-\u9fa5]{2,10})/);
      add(o, 'CABS 总分与结论', cabs[1] + (cabsLv ? ' · ' + clean(cabsLv[1]) : ' · 阳性'),
        '门诊病历辅助检查 / CABS 报告', 'high');
    }

    var abc = text.match(/ABC\s*[:：]?\s*([\d.]+)/i);
    if (abc) {
      var abcLv = text.match(/总\s*分\s*([\d.]+)\s*([^0-9\n]{2,18}?)\s*0\s*~\s*158/);
      add(o, 'ABC 总分与结论', abc[1] + (abcLv ? ' · ' + clean(abcLv[2]) : ' · 存在少量孤独症方面症状'),
        '门诊病历辅助检查 / ABC 报告', 'high');
    }

    var abcParts = [];
    [['感觉', '感觉能力'], ['交往', '交往能力'], ['运动', '运动能力'], ['语言', '语言能力'], ['自我照顾', '自我照顾能力']]
      .forEach(function (p) {
        var m = text.match(new RegExp(p[0] + '\\s*能\\s*力[^\\n]{0,16}?[\\s)）](\\d+(?:\\.\\d+)?)'));
        if (m) abcParts.push(p[1] + ' ' + m[1]);
      });
    if (abcParts.length) add(o, 'ABC 分项目', abcParts.join(' / '), 'ABC 量表分项目', 'high');

    var sensParts = [];
    [['前庭', '前庭功能'], ['触觉', '触觉防御'], ['本体', '本体感'], ['学习', '学习能力']].forEach(function (p) {
      var m = text.match(new RegExp(p[0] + '[^\\n]{0,14}?(\\d+(?:\\.\\d+)?)\\s*(中\\s*度\\s*异\\s*常|轻\\s*微|正\\s*常|异\\s*常)'));
      if (m) sensParts.push(p[1] + ' ' + m[1] + ' ' + m[2].replace(/\s/g, ''));
    });
    if (sensParts.length) add(o, '感觉统合量表', sensParts.join('；'), '儿童感觉统合量表报告', 'high');

    var lang = text.match(/词\s*语\s*命\s*名[^\n]{0,20}?(中度|轻度|重度)损伤/);
    var langPct = text.match(/得\s*分\s*为?\s*([\d.]+)\s*%/);
    if (lang || langPct) {
      add(o, '言语语言评估',
        (lang ? '词语命名' + lang[1].replace(/\s/g, '') + '损伤' : '') +
        (langPct ? (lang ? '，' : '') + '得分 ' + langPct[1] + '%' : ''),
        'ICF 言语语言认知功能评估表', 'high');
    }

    var plan = text.match(/诊\s*疗\s*计\s*划\s*[：:]?\s*([\s\S]{0,220}?)(?=医\s*师|提\s*示|第\s*\d|页|$)/);
    if (plan) add(o, '诊疗计划 / 康复建议', clean(plan[1]).slice(0, 200), '门诊病历 · 诊疗计划', 'high');
    if (!o.fields['诊疗计划 / 康复建议']) {
      ['康复建议', '治疗建议', '干预建议', '医嘱', '建议'].some(function (k) {
        var h = grab(lines, new RegExp(k + '\\s*[：:]\\s*([^\\n]{2,140})'));
        if (h) { add(o, '诊疗计划 / 康复建议', clean(h.m[1]), h.line, k === '建议' ? 'mid' : 'high'); return true; }
        return false;
      });
    }

    var rev = text.match(/(随\s*诊|复\s*诊\s*时\s*间|半\s*年\s*后\s*复\s*诊|(\d+)\s*个?\s*月后复诊)/);
    if (rev) add(o, '复诊计划', clean(rev[1] || rev[0]).replace(/\s/g, ''), '门诊病历 · 诊疗计划', 'mid');

    if (!Object.keys(o.fields).length) {
      o.note = '这份材料没有可读文字，可用本机识别引擎读字后再解析，或直接手工填写。';
    } else if (!o.fields['诊断结论']) {
      o.note = '读到了量表与病历信息，但没定位到"诊断："结论行，请核对诊断结论。';
    }
    return o;
  }

  /* ---------- 感觉统合（18 项评定） ---------- */
  var SENS_ITEMS = {
    '感觉调节': ['视觉高反应', '视觉低反应', '听觉高反应', '听觉低反应', '触觉高反应',
      '触觉低反应', '前庭觉高反应', '前庭觉低反应', '本体觉低反应'],
    '基础机制与区辨': ['姿势平衡', '动眼协调', '身体意识', '身体基模'],
    '运用能力': ['双侧整合', '预测性动作计划', '动作计划', '构想', '视觉运用']
  };
  var LV_NORM = [
    [/严重|重度/, '严重问题'],
    [/一般问题|边缘|临界|轻度|中度/, '一般问题'],
    [/正常|未见异常|无异常/, '正常']
  ];
  var LVS_LIST = ['正常', '一般问题', '严重问题'];
  var LV_SCORE = { '正常': 92, '一般问题': 58, '严重问题': 26 };

  function normLevel(s) {
    var lv = '';
    LV_NORM.some(function (p) { if (p[0].test(s)) { lv = p[1]; return true; } return false; });
    return lv;
  }

  function extractSensory(text, lines) {
    var o = { fields: {}, ev: {}, conf: {}, meta: {}, note: '' };
    var g;

    g = grab(lines, /(?:评估日期|报告日期|测评日期|测评时间)\s*[：:]?\s*(\d{4})[-/年.](\d{1,2})[-/月.](\d{1,2})/);
    if (g) add(o, '评估日期', dateOf(g.m), g.line, 'high');
    if (!o.fields['评估日期']) {
      g = grab(lines, /(\d{4})[-/年.](\d{1,2})[-/月.](\d{1,2})\s*\d{0,2}[:：]?\d{0,2}/);
      if (g) add(o, '评估日期', dateOf(g.m), g.line, 'mid');
    }

    g = grab(lines, /(?:测评教师|测评机构)\s*[：:]?\s*([^\s，,。]{2,20})/);
    if (g) add(o, '测评机构 / 测评教师', clean(g.m[1]), g.line, 'mid');

    /* 逐项：项目名 + 等级（长名优先，避免"动作计划"吃掉"预测性动作计划"） */
    var flat = SENS_ITEMS['感觉调节'].concat(SENS_ITEMS['基础机制与区辨']).concat(SENS_ITEMS['运用能力']);
    var names = flat.slice().sort(function (a, b) { return b.length - a.length; });
    var re = new RegExp('(' + names.join('|') + ')\\s*[：:]?\\s*(正常|未见异常|一般问题|严重问题|中度|重度|轻度|边缘|临界)');
    var hits = grabAll(lines, re);
    var seen = {};
    hits.forEach(function (h) {
      var k = h.m[1];
      if (seen[k]) return;
      var lv = normLevel(h.m[2]);
      if (!lv) return;
      seen[k] = lv;
      add(o, k, lv, h.line, 'high');
    });

    /* 三组总评：按组内最严重的一档定 */
    var problems = [];
    Object.keys(SENS_ITEMS).forEach(function (grp) {
      var lv = '正常', has = false;
      SENS_ITEMS[grp].forEach(function (it) {
        var v = o.fields[it];
        if (!v) return;
        has = true;
        if (v === '严重问题') lv = '严重问题';
        else if (v === '一般问题' && lv !== '严重问题') lv = '一般问题';
      });
      if (has) add(o, grp, lv, '按「' + grp + '」组内 ' + SENS_ITEMS[grp].filter(function (i) { return o.fields[i]; }).length + ' 项评定的最高档', 'mid');
      SENS_ITEMS[grp].forEach(function (it) {
        if (o.fields[it] && o.fields[it] !== '正常') problems.push(it + o.fields[it]);
      });
    });

    if (problems.length) {
      add(o, '主要表现', problems.join('、'), '18 项评定中非"正常"的项', 'mid');
    }

    var gotN = Object.keys(o.fields).filter(function (k) { return LVS_LIST.indexOf(o.fields[k]) >= 0; }).length;
    if (!gotN) {
      o.note = '没有读到任何评定等级；扫描件可先用本机识别引擎读字，或按原件逐项核对。';
    } else if (gotN < 18) {
      o.note = '读到 ' + gotN + ' / 18 项评定，其余项请对照原件补选（未识别的不参与计算）。';
    }
    return o;
  }

  var EXTRACT = {
    medical: extractMedical,
    pep3: extractPep3,
    vbmapp: extractVb,
    sensory: extractSensory
  };

  /* ============================================================
     观察表解析（小组班 / 融合班 / 家长居家）
     三张表都是「观察维度 | 幼儿现有优势能力 | 现存薄弱问题与发展需求」三列。
     docx 原件按表格读最准；PDF / 识别件 / 粘贴文字没有表格，退回逐段判断，
     结果一律交给老师在校对界面确认，绝不静默写入。
     ============================================================ */
  var STRONG_WORDS = ['能够', '能独立', '能完成', '能保持', '能表达', '能精准', '能听懂',
    '能跟随', '能模仿', '能主动', '能较快', '能标准', '能讲', '能数', '能看懂', '能自己',
    '可以', '可独立', '可快速', '可自主', '可完成', '较好', '突出', '独立', '平稳', '明显',
    '完整', '准确', '进步', '提升', '喜欢', '愿意', '知道', '全程', '无需', '达成', '稳定',
    '消除', '无抗拒', '好奇', '增强', '已能', '独立完成', '熟练', '优势', '清晰', '适应良好'];
  var NEED_WORDS = ['仍需', '有待', '尚需', '不足', '偏少', '偏弱', '较弱', '困难', '较难',
    '难以', '无法', '不会', '不能', '尚未', '还需', '需要', '薄弱', '缺少', '抵触', '依赖',
    '仍有', '仍存在', '待提高', '待提升', '需加强', '需成人', '需教师', '需引导', '不明白',
    '逃避', '偶尔', '慢一点', '不主动', '不明显', '待加强', '偏慢', '易出现', '波动', '纠正',
    '较少', '偏低', '待发展', '需反复', '需提醒', '一直提醒', '还需'];

  function countHits(t, arr) {
    var n = 0;
    arr.forEach(function (w) {
      var i = 0;
      while ((i = t.indexOf(w, i)) >= 0) { n++; i += w.length; }
    });
    return n;
  }
  function looksNeed(t) {
    var s = countHits(t, STRONG_WORDS), n = countHits(t, NEED_WORDS);
    return n > s;
  }
  function normDim(s) { return String(s || '').replace(/[\s\u00a0:：.．、]/g, ''); }
  function findDim(cell, dims) {
    var c = normDim(cell);
    if (!c) return null;
    var i, d;
    for (i = 0; i < dims.length; i++) {
      if (normDim(dims[i].dim) === c) return dims[i];
    }
    for (i = 0; i < dims.length; i++) {
      d = normDim(dims[i].dim);
      if (d.length >= 2 && (c.indexOf(d) >= 0 || d.indexOf(c) >= 0)) return dims[i];
    }
    return null;
  }

  function extractObs(key) {
    return function (raw, lines, opts) {
      var T = R.OBS_TYPES[key];
      var dims = T.dims;
      var src = {};
      dims.forEach(function (d) { src[d.dim] = { strength: '', need: '', conf: 'none' }; });
      var tables = (opts && opts.tables) || [];
      var from = 'text', hit = 0;

      /* ① 表格路径：docx 原件 */
      tables.forEach(function (rows) {
        rows.forEach(function (cells) {
          if (cells.length < 2) return;
          var d = findDim(cells[0], dims);
          if (!d) return;
          var s = String(cells[1] || '').trim();
          var n = cells.length > 2 ? String(cells[2] || '').trim() : '';
          if (d.onlyNeed) { n = n || s; s = ''; }
          if (!s && !n) return;
          var o = src[d.dim];
          if (s) o.strength = o.strength ? o.strength + '\n' + s : s;
          if (n) o.need = o.need ? o.need + '\n' + n : n;
          o.conf = 'high';
          hit++;
        });
      });
      if (hit) from = 'table';

      /* ② 文字路径：PDF / 识别件 / 粘贴 */
      if (!hit) {
        var cur = null, buf = [];
        function flush() {
          if (!cur || !buf.length) { buf = []; return; }
          var sArr = [], nArr = [];
          buf.forEach(function (t) { (looksNeed(t) ? nArr : sArr).push(t); });
          if (!nArr.length && sArr.length > 1) {
            nArr = sArr.splice(Math.ceil(sArr.length / 2));
          }
          cur.strength = sArr.join('\n');
          cur.need = nArr.join('\n');
          cur.conf = (cur.strength && cur.need) ? 'mid' : 'low';
          buf = [];
        }
        (lines || []).forEach(function (ln) {
          var t = String(ln || '').trim();
          if (!t) return;
          if (/^(观察维度|幼儿现有优势能力|现存薄弱问题与发展需求|小组班级日常观察表|融合班级日常观察表|家长居家观察表)/.test(t)) return;
          var d = findDim(t, dims);
          if (d && t.length <= 16) { flush(); cur = src[d.dim]; return; }
          if (cur) buf.push(t);
        });
        flush();
      }

      var rows = dims.map(function (d) {
        var o = src[d.dim] || {};
        return { dim: d.dim, tip: d.tip, onlyNeed: !!d.onlyNeed, strength: o.strength || '', need: o.need || '', conf: o.conf || 'none' };
      });
      var filled = rows.filter(function (r) { return (r.strength || r.need); }).length;
      var note = hit
        ? '按表格读到 ' + filled + ' / ' + rows.length + ' 个维度，两栏与原件一致。'
        : filled
          ? '这份文件没有表格结构（可能是 PDF 或识别件），按段落判断了优势 / 薄弱，请逐行核对后再入档。'
          : '没有读到这张表的维度，可改用手工填报。';
      return { rows: rows, filled: filled, total: rows.length, from: from, note: note };
    };
  }

  var EXTRACT_OBS = {
    group: extractObs('group'),
    fusion: extractObs('fusion'),
    parent: extractObs('parent')
  };

  /* 猜这份文件属于哪张观察表（上传错槽位时给提示） */
  function guessObs(text) {
    var head = String(text || '').slice(0, 200);
    if (/小组/.test(head)) return 'group';
    if (/融合/.test(head)) return 'fusion';
    if (/家长|居家/.test(head)) return 'parent';
    var score = { group: 0, fusion: 0, parent: 0 };
    ['group', 'fusion', 'parent'].forEach(function (k) {
      (R.OBS_TYPES[k].dims || []).forEach(function (d) {
        if (d.dim.length >= 2 && head.indexOf(d.dim) >= 0) score[k] += 1;
      });
    });
    var best = null, bv = 0;
    Object.keys(score).forEach(function (k) { if (score[k] > bv) { bv = score[k]; best = k; } });
    return bv >= 2 ? best : null;
  }


  R.parse = {
    /* 抽取：返回 { fields, conf, ev, meta, note } */
    extract: function (type, text, opts) {
      var raw = String(text || '').replace(/\r/g, '');
      /* 识别件（OCR）先做去空格归一：汉字被切开也能认 */
      if (opts && opts.ocr) raw = deSpace(raw);
      var lines = raw.split('\n')
        .map(function (l) { return l.replace(/[\s\u00a0]+/g, ' ').trim(); })
        .filter(function (l) { return l; });
      var fn = EXTRACT[type];
      if (!fn) return { fields: {}, conf: {}, ev: {}, meta: {}, note: '该材料只做登记，不解析。' };
      return fn(raw, lines);
    },
    confLabel: function (c) {
      return c === 'high' ? ['已识别', 'g'] : c === 'mid' ? ['已识别 · 建议核对', 'a'] : ['未识别', 'gray'];
    },
    /* 观察表：返回 { rows:[{dim,strength,need,conf}], filled, total, from, note } */
    obs: function (key, text, opts) {
      var o = opts || {};
      var raw = String(text || '').replace(/\r/g, '');
      if (o.ocr) raw = deSpace(raw);
      var lines = raw.split('\n').map(function (l) { return l.replace(/[\s\u00a0]+/g, ' ').trim(); });
      var fn = EXTRACT_OBS[key];
      if (!fn) return { rows: [], filled: 0, total: 0, from: 'none', note: '未知的表单类型。' };
      return fn(raw, lines, o);
    },
    guessObs: guessObs,
    /* 扫描件走本机识别：thumbs = [{page, src}] → 文字 */
    ocr: function (thumbs, onPage) {
      if (!R.ocr) return Promise.reject(new Error('识别引擎未加载'));
      return R.ocr.recognizePages(thumbs, onPage);
    },
    /* 示例文本（用于没有现成文件时试跑解析流程） */
    samples: {
      pep3: [
        '儿童心理教育量表（PEP-3简体中文版）评估报告',
        '测评编号：2026483942610 儿童姓名：土豆 儿童性别：男',
        '出生日期：2023-03-18 生理年龄：3岁7个月 报告日期：2026-10-26',
        '机构名称：北医幼儿园',
        '【功能发展】',
        '模仿： 功能发展年龄水平评估处于或大于62个月, 已达到模仿领域参考的最高区间',
        '知觉： 功能发展年龄水平评估处于50个月左右, 与生理年龄差距-7个月',
        '精细动作： 功能发展年龄水平评估处于42个月左右, 与生理年龄差距1个月',
        '粗大动作： 功能发展年龄水平评估处于或大于60个月, 已达到粗大动作领域参考的最高区间',
        '手眼协调： 功能发展年龄水平评估处于45个月左右, 与生理年龄差距-2个月',
        '认知表现： 功能发展年龄水平评估处于50个月左右, 与生理年龄差距-7个月',
        '口语认知： 功能发展年龄水平评估处于53个月左右, 与生理年龄差距-10个月',
        '总体评估： 功能发展年龄水平评估43个月左右, 与生理年龄差距0个月',
        '【病理行为】',
        '情感：有0项重度、1项轻度、5项正常',
        '语言：有0项重度、3项轻度、8项正常',
        '感觉模式：有2项重度、2项轻度、10项正常',
        '游戏及物品爱好：有0项重度、1项轻度、5项正常',
        '人际关系、合作行为及对人的兴趣：有0项重度、1项轻度、6项正常',
        '功能发展评分（总分95，本次评分68）'
      ].join('\n'),
      vbmapp: [
        'VB-MAPP（语言行为里程碑评估及安置程序）评估报告',
        '测评编号：2026292882610 儿童姓名：土豆 儿童性别：男',
        '生理年龄：3岁7个月 报告日期：2026-10-26',
        '【里程碑评估】',
        '提要求：功能发展水平处于第3阶段（30-48个月）',
        '命名：功能发展水平处于第3阶段（30-48个月）',
        '听者反应：功能发展水平处于或大于第3阶段（30-48个月），已达到该领域参考的最高区间',
        '视觉配对：功能发展水平处于第3阶段（30-48个月）',
        '社交：功能发展水平处于第2阶段（18-30个月）',
        '模仿：功能发展水平处于第2阶段（18-30个月）',
        '集体技能：功能发展水平处于第3阶段（30-48个月）',
        '总体评估：功能发展水平处于第3阶段（30-48个月）',
        '【障碍评估】',
        '轻度障碍：负面行为；教学控制困难；依赖辅助；自我刺激',
        '中度障碍：强迫性行为；缺乏目光接触和对人的注意；感觉性防御',
        '中重度障碍：薄弱或非典型的动机操作',
        '【转衔评估】',
        '第一类转衔：儿童在语言、社交、行为技能和学业独立性方面体现的能力良好。'
      ].join('\n'),
      medical: [
        '儿童医院 儿童保健科 门诊病历',
        '就诊机构：市儿童医院 · 儿童保健科',
        '就诊日期：2026-07-19',
        '主诉：语言表达少，与同伴互动少，情绪易波动。',
        '诊断结论：疑似孤独症谱系障碍（社交发起困难，存在情绪问题）',
        '康复建议：言语训练、社交小组、感觉统合训练；建议园内提供结构化支持',
        '复诊计划：半年后复诊'
      ].join('\n'),
      /* 感统报告多为扫描件：不提供示例文字，避免把编造的等级录进档案 */
    }
  };

})(window.RIEP);
