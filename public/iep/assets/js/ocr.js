/* ============================================================
   ocr.js · 扫描件文字识别（本机内置引擎，不联网）

   引擎：tesseract.js 5.1.1 + chi_sim 识别包，全部落在 assets/vendor/tesseract/
   难点：双击 file:// 打开时页面 origin 是 null，
        · new Worker('file://…')  被浏览器拒绝
        · fetch('file://…')       被浏览器拒绝
   做法：
        1. 引擎脚本用 <script src> 加载（file:// 允许）；
        2. 识别包转成 base64 的 JS（self.TESSDATA_CHI_SIM），
           在 worker 里 importScripts 加载（file:// 允许）；
        3. tesseract 会把 worker 源码包进 Blob 再 new Worker，
           我们拦截这个 Blob，换成"先 patch self.fetch，再 importScripts(worker)"，
           worker 内取语言包时就会命中内嵌数据，全程不碰网络。
   ============================================================ */
(function (R) {
  'use strict';

  var V = 'assets/vendor/tesseract/';
  var LIB = V + 'tesseract.min.js';
  var WORKER = V + 'worker.min.js';
  var LANG = V + 'chi_sim.traineddata.gz.js';
  /* vendor 里同时内置 simd 与非 simd 两份 wasm 核心，corePath 传目录让引擎自选 */

  function abs(p) { return new URL(p, location.href).href; }

  var workerPromise = null;
  var origBlob = null;
  var patched = false;

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = abs(src);
      s.onload = function () { res(); };
      s.onerror = function () {
        rej(new Error('识别组件文件缺失：' + src + '。请确认整个文件夹已完整解压（assets/vendor 约 15MB），再用较新的 Edge / Chrome 打开'));
      };
      document.head.appendChild(s);
    });
  }

  /* worker 启动脚本：先把内嵌识别包挂上，再接管 fetch，最后加载引擎 worker */
  function shimCode(workerUrl, langUrl) {
    return 'var __of = self.fetch;\n' +
      'try { importScripts(' + JSON.stringify(langUrl) + '); } catch (e) {}\n' +
      'self.fetch = function (x, o) {\n' +
      '  var s = String(x);\n' +
      '  if (s.indexOf("chi_sim.traineddata") >= 0 && self.TESSDATA_CHI_SIM) {\n' +
      '    var bin = atob(self.TESSDATA_CHI_SIM);\n' +
      '    var arr = new Uint8Array(bin.length);\n' +
      '    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);\n' +
      '    return Promise.resolve(new Response(arr.buffer, { status: 200 }));\n' +
      '  }\n' +
      '  return __of(x, o);\n' +
      '};\n' +
      'importScripts(' + JSON.stringify(workerUrl) + ');\n';
  }

  /* 拦截 tesseract 自己构造的 worker Blob，换成带补丁的版本 */
  function patchBlob() {
    if (patched) return;
    patched = true;
    origBlob = window.Blob;
    window.Blob = function (parts, opts) {
      try {
        if (parts && parts.length && typeof parts[0] === 'string' &&
          parts[0].indexOf('worker.min.js') >= 0) {
          var m = parts[0].match(/importScripts\("(.*?)"\)/);
          if (m) return new origBlob([shimCode(m[1], abs(LANG))], opts);
        }
      } catch (e) { /* 拦截失败就用原来的，交给引擎自己降级 */ }
      return new origBlob(parts, opts);
    };
  }
  function unpatchBlob() { if (origBlob) { window.Blob = origBlob; patched = false; } }

  function getWorker(onStage) {
    if (workerPromise) return workerPromise;
    workerPromise = (window.Tesseract ? Promise.resolve() : loadScript(LIB))
      .then(function () {
        patchBlob();
        /* corePath 必须传「目录」而不是具体文件：
           传 .js 结尾的文件路径时引擎会跳过 SIMD 探测直接加载该文件，
           旧电脑（浏览器/ CPU 不支持 WASM SIMD）就会编译失败、识别不了；
           传目录则引擎自行选择 simd / 非 simd 两种核心之一（两个都已内置）。 */
        return window.Tesseract.createWorker('chi_sim', 1, {
          workerPath: abs(WORKER),
          corePath: abs(V),
          langPath: abs(V),
          logger: function (m) {
            if (onStage) onStage(m.status, Math.round((m.progress || 0) * 100));
          }
        });
      })
      .catch(function (e) {
        workerPromise = null;
        unpatchBlob();
        var msg = String((e && e.message) || e);
        if (msg.indexOf('识别组件文件缺失') < 0 && msg.indexOf('vendor') < 0) {
          msg += '（若反复失败：确认文件夹完整解压、assets/vendor/tesseract 下有 6 个文件约 15MB，并换较新的 Edge / Chrome 打开）';
        }
        throw new Error(msg);
      });
    return workerPromise;
  }

  /* 图片增强：放大 + 灰度 + 轻度提对比，扫描件识别率更高 */
  function enhance(src, minW) {
    return new Promise(function (res) {
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;
        var scale = (w && w < (minW || 1500)) ? (minW || 1500) / w : 1;
        var cv = document.createElement('canvas');
        cv.width = Math.round(w * scale);
        cv.height = Math.round(h * scale);
        var cx = cv.getContext('2d');
        cx.drawImage(img, 0, 0, cv.width, cv.height);
        try {
          var d = cx.getImageData(0, 0, cv.width, cv.height);
          var p = d.data;
          for (var i = 0; i < p.length; i += 4) {
            var g = (p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114);
            g = g < 96 ? Math.max(0, g - 24) : (g > 190 ? Math.min(255, g + 20) : g);
            p[i] = p[i + 1] = p[i + 2] = g;
          }
          cx.putImageData(d, 0, 0);
        } catch (e) { /* 跨域图片取不到像素时直接用原图 */ }
        res(cv);
      };
      img.onerror = function () { res(null); };
      img.src = src;
    });
  }

  R.ocr = {
    /* 引擎是否可加载（只判断脚本在不在，不预加载） */
    supported: function () {
      return typeof Worker !== 'undefined' && typeof WebAssembly !== 'undefined';
    },

    /* 预热：提前把引擎与识别包装好，返回 Promise */
    warm: function (onStage) { return getWorker(onStage).then(function () { return true; }); },

    /* 识别一页：src 可以是 dataURL / 图片地址；返回 { text, conf } */
    recognize: function (src, onProgress) {
      return enhance(src).then(function (cv) {
        if (!cv) return { text: '', conf: 0 };
        return getWorker().then(function (w) {
          return w.recognize(cv, {}, { blocks: false }).then(function (r) {
            var d = r.data || {};
            return { text: String(d.text || ''), conf: Math.round(d.confidence || 0) };
          });
        });
      });
    },

    /* 逐页识别：pages = [{page, src}]，返回 { text, pageTexts, conf, failed } */
    recognizePages: function (pages, onPage) {
      var out = [], confs = [], failed = 0;
      var chain = getWorker().then(function () { return true; });
      (pages || []).forEach(function (pg, idx) {
        chain = chain.then(function () {
          return R.ocr.recognize(pg.src).then(function (r) {
            out.push('【第 ' + (pg.page || idx + 1) + ' 页】\n' + r.text);
            if (r.conf) confs.push(r.conf);
            else failed++;
            if (onPage) onPage(idx + 1, pages.length, r);
          }).catch(function () {
            failed++;
            out.push('【第 ' + (pg.page || idx + 1) + ' 页】（识别失败）');
            if (onPage) onPage(idx + 1, pages.length, { text: '', conf: 0 });
          });
        });
      });
      return chain.then(function () {
        var avg = confs.length
          ? Math.round(confs.reduce(function (a, b) { return a + b; }, 0) / confs.length)
          : 0;
        return { text: out.join('\n'), pageTexts: out, conf: avg, failed: failed };
      });
    },

    /* 不再用时释放（一般保留复用，切换档案不释放） */
    close: function () {
      if (!workerPromise) return;
      workerPromise.then(function (w) { try { w.terminate(); } catch (e) { } });
      workerPromise = null;
      unpatchBlob();
    }
  };

})(window.RIEP);
