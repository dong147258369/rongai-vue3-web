/* ============================================================
   ui.js · 通用界面件（图标 / 提示 / 抽屉 / 模态 / 图表积木）
   ============================================================ */
(function (R) {
  'use strict';

  var U = {};

  var ICONS = {
    trash: '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m3 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    home: '<path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2v-9z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
    archive: '<path d="M4 6h16v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M4 6l2-3h12l2 3M9 12h6" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
    intake: '<path d="M12 16V5m0 0L8 9m4-4l4 4" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    profile: '<path d="M4 20V9m5 11V4m5 16v-8m5 8V7" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
    goals: '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
    meeting: '<circle cx="9" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M16 5.4a3 3 0 0 1 0 5.2M17.5 14.6c2 .8 3.2 2.4 3.2 4.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    doc: '<path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M14 3v4h4M9 12h6M9 16h6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
    track: '<rect x="3.5" y="5" width="17" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M8.5 14l2 2 4-4" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/>',
    settings: '<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 3v3m0 12v3M4.2 7.5l2.6 1.5m10.4 6l2.6 1.5M4.2 16.5l2.6-1.5m10.4-6l2.6-1.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
    shield: '<path d="M12 3l7 3v6c0 4.4-2.9 7.8-7 9-4.1-1.2-7-4.6-7-9V6l7-3z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9 12l2.2 2.2L15.5 10" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    alert: '<path d="M12 4l9 15H3l9-15z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 9.5v4M12 16.5v.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    info: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 11v5.5M12 7.8v.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
    plus: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>',
    link: '<path d="M9 15l6-6M10.5 6.5l1.7-1.7a3.8 3.8 0 0 1 5.4 5.4l-1.7 1.7M13.5 17.5l-1.7 1.7a3.8 3.8 0 0 1-5.4-5.4l1.7-1.7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    print: '<path d="M7 8V3h10v5M7 18H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="7" y="14" width="10" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/>',
    heart: '<path d="M12 20s-7-4.3-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.7-7 9-7 9z" fill="none" stroke="currentColor" stroke-width="1.6"/>'
  };

  U.icon = function (name, size, cls) {
    var s = size || 18;
    return '<svg class="' + (cls || 'ic') + '" viewBox="0 0 24 24" width="' + s + '" height="' + s + '" aria-hidden="true">' +
      (ICONS[name] || '') + '</svg>';
  };

  U.esc = function (s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  U.toast = function (msg, type) {
    var wrap = document.getElementById('toastWrap');
    var d = document.createElement('div');
    d.className = 'toast' + (type ? ' ' + type : '');
    d.textContent = msg;
    wrap.appendChild(d);
    setTimeout(function () {
      d.style.transition = '.3s'; d.style.opacity = '0'; d.style.transform = 'translateY(8px)';
      setTimeout(function () { d.remove(); }, 320);
    }, 2200);
  };

  /* ---------- 抽屉 ---------- */
  U.drawer = function (title, html) {
    document.getElementById('drawerTitle').textContent = title;
    document.getElementById('drawerBody').innerHTML = html;
    document.getElementById('drawer').classList.add('show');
    document.getElementById('drawerMask').classList.add('show');
  };
  U.closeDrawer = function () {
    document.getElementById('drawer').classList.remove('show');
    document.getElementById('drawerMask').classList.remove('show');
  };

  /* ---------- 模态 ---------- */
  var modalActions = [];
  U.modal = function (title, bodyHtml, buttons) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    var foot = document.getElementById('modalFoot');
    foot.innerHTML = '';
    modalActions = buttons || [];
    (buttons || []).forEach(function (b, i) {
      var btn = document.createElement('button');
      btn.className = 'btn ' + (b.cls || '');
      btn.textContent = b.label;
      btn.onclick = function () { if (b.onClick) b.onClick(); };
      foot.appendChild(btn);
    });
    var close = document.createElement('button');
    close.className = 'btn';
    close.textContent = '关闭';
    close.onclick = U.closeModal;
    foot.appendChild(close);
    document.getElementById('modalMask').classList.add('show');
  };
  U.closeModal = function () { document.getElementById('modalMask').classList.remove('show'); };

  /* ---------- 积木 ---------- */
  U.badge = function (text, cls) { return '<span class="badge ' + (cls || '') + '">' + U.esc(text) + '</span>'; };

  U.progress = function (pct, cls) {
    return '<div class="progress ' + (cls || '') + '"><i style="width:' + pct + '%"></i></div>';
  };

  U.bars = function (list) {
    // list: [{name, got, full, color}]
    return '<div class="bars">' + list.map(function (b) {
      var pct = b.full ? Math.round(b.got / b.full * 100) : 0;
      var color = b.color || (pct >= 50 ? '#22a06b' : pct >= 30 ? '#2f6fd0' : pct > 0 ? '#f59e0b' : '#e0577a');
      return '<div class="bar-row">' +
        '<div class="nm" title="' + U.esc(b.name) + '">' + U.esc(b.name) + '</div>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%;background:' + color + '"></div></div>' +
        '<div class="raw">' + b.got + '/' + b.full + ' · ' + pct + '%</div></div>';
    }).join('') + '</div>';
  };

  /* ---------- 六边形能力画像（雷达图） ---------- */
  /* opts: { axes:[{label,name}], series:[{key,name,color,values}], highlight:true } */
  U.radar = function (opts) {
    var axes = opts.axes || [];
    var n = axes.length;
    if (!n) return '';
    var W = 620, H = 420, cx = 310, cy = 208, Rr = 132;
    var rings = [0.25, 0.5, 0.75, 1];
    var ang = function (i) { return (-90 + i * 360 / n) * Math.PI / 180; };
    var pt = function (i, v) {
      var r = Rr * (Math.max(0, Math.min(100, v)) / 100);
      return [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
    };
    var fmt = function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); };

    var out = '<svg class="radar" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="六维能力画像">';

    /* 底色六边形：先铺底，否则会盖住内层网格 */
    var bg = [];
    for (var bi = 0; bi < n; bi++) bg.push(fmt(pt(bi, 100)));
    out += '<polygon points="' + bg.join(' ') + '" fill="#fbfcfe" stroke="none"/>';

    /* 网格环（0.25 / 0.5 / 0.75 虚线 + 外圈实线） */
    rings.forEach(function (k) {
      var pts = [];
      for (var i = 0; i < n; i++) pts.push(fmt(pt(i, k * 100)));
      out += '<polygon points="' + pts.join(' ') + '" fill="none" stroke="' + (k === 1 ? '#c2d1e2' : '#d7e2ee') +
        '" stroke-width="1"' + (k === 1 ? '' : ' stroke-dasharray="4 4"') + '/>';
    });
    /* 轴线 */
    for (var i = 0; i < n; i++) {
      var p = pt(i, 100);
      out += '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) +
        '" stroke="#e6edf5" stroke-width="1"/>';
    }

    /* 数据多边形（先画大后画小，避免遮挡） */
    var order = (opts.series || []).slice().sort(function (a, b) {
      var sa = a.values.reduce(function (x, y) { return x + y; }, 0);
      var sb = b.values.reduce(function (x, y) { return x + y; }, 0);
      return sb - sa;
    });
    order.forEach(function (s) {
      var pts = s.values.map(function (v, i) { return fmt(pt(i, v)); });
      var isNow = s.key === 'now';
      out += '<polygon points="' + pts.join(' ') + '" fill="' + s.color + '" fill-opacity="' +
        (isNow ? '.14' : '.07') + '" stroke="' + s.color + '" stroke-width="' + (isNow ? '2.4' : '1.6') +
        '"' + (s.key === 'base' ? ' stroke-dasharray="5 4"' : '') + ' stroke-linejoin="round"/>';
      if (isNow) {
        s.values.forEach(function (v, i) {
          var q = pt(i, v);
          out += '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="3.6" fill="#fff" stroke="' +
            s.color + '" stroke-width="2"/>';
        });
      }
    });

    /* 轴标签 */
    var cur = (opts.series || []).filter(function (s) { return s.key === 'now'; })[0];
    var vals = cur ? cur.values : [];
    var maxI = 0, minI = 0;
    vals.forEach(function (v, i) { if (v > vals[maxI]) maxI = i; if (v < vals[minI]) minI = i; });
    for (var j = 0; j < n; j++) {
      var a = ang(j), lx = cx + (Rr + 30) * Math.cos(a), ly = cy + (Rr + 30) * Math.sin(a);
      var cos = Math.cos(a);
      var anchor = Math.abs(cos) < 0.28 ? 'middle' : (cos > 0 ? 'start' : 'end');
      var dy = Math.sin(a) > 0.6 ? 10 : (Math.sin(a) < -0.6 ? -4 : 4);
      var tone = (opts.highlight && j === maxI) ? '#167a52' : (opts.highlight && j === minI) ? '#c03b5e' : '#3d4d5f';
      out += '<text x="' + lx.toFixed(1) + '" y="' + (ly + dy).toFixed(1) + '" text-anchor="' + anchor +
        '" font-size="12.5" font-weight="600" fill="' + tone + '">' + U.esc(axes[j].label) + '</text>';
      if (vals.length) {
        out += '<text x="' + lx.toFixed(1) + '" y="' + (ly + dy + 15).toFixed(1) + '" text-anchor="' + anchor +
          '" font-size="11" fill="#8b98a8">' + vals[j] + '</text>';
      }
    }
    out += '</svg>';

    var legend = '<div class="radar-legend">' + (opts.series || []).map(function (s) {
      return '<span><i style="background:' + s.color + '"></i>' + U.esc(s.name) + '</span>';
    }).join('') +
      (opts.highlight ? '<span class="muted">深绿＝相对优势，深红＝最需支持</span>' : '') + '</div>';
    return '<div class="radar-wrap">' + out + '</div>' + legend;
  };

  /* ---------- 环形图（占比 / 完成度） ---------- */
  /* opts: { size, sw, color, value, unit, fs } */
  U.donut = function (pct, opts) {
    opts = opts || {};
    var size = opts.size || 116, sw = opts.sw || 12;
    var r = (size - sw) / 2, c = 2 * Math.PI * r;
    var off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
    var cx = size / 2;
    return '<svg class="donut" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" role="img">' +
      '<circle cx="' + cx + '" cy="' + cx + '" r="' + r + '" fill="none" stroke="#eef2f7" stroke-width="' + sw + '"/>' +
      '<circle cx="' + cx + '" cy="' + cx + '" r="' + r + '" fill="none" stroke="' + (opts.color || '#2f6fd0') +
      '" stroke-width="' + sw + '" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) +
      '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 ' + cx + ' ' + cx + ')" ' +
      'style="transition:stroke-dashoffset .8s ease"/>' +
      '<text x="' + cx + '" y="' + (cx + 3) + '" text-anchor="middle" font-size="' + (opts.fs || 22) +
      '" font-weight="700" fill="#1f2a37" font-family="inherit">' +
      U.esc(opts.value !== undefined ? opts.value : pct) + '</text>' +
      (opts.unit ? '<text x="' + cx + '" y="' + (cx + 19) + '" text-anchor="middle" font-size="10.5" fill="#8b98a8" font-family="inherit">' +
        U.esc(opts.unit) + '</text>' : '') +
      '</svg>';
  };

  /* ---------- 双条（当前 vs 学期目标 / 基线） ---------- */
  /* list: [{name, now, target, baseline, color}] */
  U.dualBars = function (list) {
    return '<div class="dbars">' + list.map(function (b) {
      var now = Math.max(0, Math.min(100, b.now || 0));
      var tgt = Math.max(0, Math.min(100, b.target || 0));
      return '<div class="db-row">' +
        '<div class="db-nm">' + U.esc(b.name) + '<span>' + (b.now || 0) + ' → ' + (b.target || 0) + '</span></div>' +
        '<div class="db-track">' +
          '<i class="db-t" style="width:' + tgt + '%"></i>' +
          '<i class="db-n" style="width:' + now + '%;background:' + (b.color || '#2f6fd0') + '"></i>' +
          '<em class="db-mark" style="left:' + tgt + '%"></em>' +
        '</div>' +
        '<div class="db-gap">差 ' + Math.max(0, Math.round(((b.target || 0) - (b.now || 0)) * 10) / 10) + '</div>' +
        '</div>';
    }).join('') + '</div>';
  };

  /* ---------- 正在分析计算（全屏遮罩 + 分步） ---------- */
  U.computing = function (title, steps, done) {
    var el = document.createElement('div');
    el.className = 'calc-mask';
    el.innerHTML = '<div class="calc-box">' +
      '<div class="calc-spin"><svg viewBox="0 0 50 50" width="48" height="48" aria-hidden="true">' +
      '<circle cx="25" cy="25" r="20" fill="none" stroke="#e6edf5" stroke-width="5"/>' +
      '<circle cx="25" cy="25" r="20" fill="none" stroke="#2f6fd0" stroke-width="5" stroke-linecap="round" ' +
      'stroke-dasharray="30 96"><animateTransform attributeName="transform" type="rotate" ' +
      'from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite"/></circle></svg></div>' +
      '<div class="calc-t">' + U.esc(title) + '</div>' +
      '<div class="calc-steps">' + (steps || []).map(function (s, i) {
        return '<div class="cs"><i></i><span>' + U.esc(s) + '</span></div>';
      }).join('') + '</div></div>';
    document.body.appendChild(el);
    var cs = el.querySelectorAll('.cs');
    var i = 0;
    var timer = setInterval(function () {
      if (i > 0) cs[i - 1].className = 'cs done';
      if (i >= cs.length) {
        clearInterval(timer);
        setTimeout(function () {
          el.classList.add('out');
          setTimeout(function () { el.remove(); if (done) done(); }, 240);
        }, 280);
        return;
      }
      cs[i].className = 'cs on';
      i++;
    }, 480);
  };

  /* ---------- 分步确认：每一步都要用户点头 ---------- */
  /* o: { title, kicker, lead, checks:[{k,v,state:'ok|warn|no'}], tip, okText, calcTitle, calcSteps, to, onOk } */
  U.confirmStep = function (o) {
    var checks = (o.checks || []).map(function (c) {
      return '<div class="ss ' + (c.state || 'ok') + '"><i></i>' +
        '<div><b>' + U.esc(c.k) + '</b><span>' + (c.v || '') + '</span></div></div>';
    }).join('');
    var body = (o.kicker ? '<div class="cs-kicker">' + U.esc(o.kicker) + '</div>' : '') +
      (o.lead || '') +
      (checks ? '<div class="step-sum">' + checks + '</div>' : '') +
      (o.tip || '');
    U.modal(o.title, body, [{
      label: o.okText || '确认，进入下一步', cls: 'primary', onClick: function () {
        /* before：关窗前的校验（例如必须勾选确认项）；返回 false 就不往下走 */
        if (o.before && o.before() === false) return;
        U.closeModal();
        U.computing(o.calcTitle || '正在分析计算…',
          o.calcSteps || ['读取已入档数据', '按维度对齐', '计算并生成'], function () {
            if (o.onOk) o.onOk();
            else if (o.to) location.hash = '#/' + o.to;
            if (R.render) R.render();
          });
      }
    }]);
  };

  /* ---------- 干预前后对比（成对条形 + 目标刻度） ---------- */
  U.compareBars = function (rows) {
    return '<div class="cmp">' + rows.map(function (r) {
      var b = r.before, c = r.now, t = r.target;
      var d = (c - b) >= 0 ? '+' + (c - b) : '' + (c - b);
      return '<div class="cmp-row">' +
        '<div class="cmp-nm">' + U.esc(r.short) +
          '<span>' + U.esc(r.name) + '</span></div>' +
        '<div class="cmp-bars">' +
          '<span class="cmp-t" style="left:' + t + '%" title="学期目标 ' + t + '"></span>' +
          '<div class="cmp-b"><i class="b" style="width:' + b + '%"></i><em>前 ' + b + '</em></div>' +
          '<div class="cmp-b"><i class="n" style="width:' + c + '%"></i><em>今 ' + c + '</em></div>' +
        '</div>' +
        '<div class="cmp-d' + ((c - b) > 0 ? ' up' : (c - b) < 0 ? ' down' : '') + '">' + d + '</div>' +
        '</div>';
    }).join('') + '</div>' +
      '<div class="legend"><span><i style="background:#b9c6d6"></i>2026-09 入园基线</span>' +
      '<span><i style="background:#2f6fd0"></i>2026-11 当前</span>' +
      '<span><i style="background:#8b5cf6"></i>虚线＝本学期目标</span></div>';
  };

  U.notice = function (kind, iconName, html) {
    return '<div class="notice ' + kind + '"><span class="ic">' + U.icon(iconName, 18) + '</span><div>' + html + '</div></div>';
  };

  U.stat = function (k, v, unit, d, cls) {
    return '<div class="stat ' + (cls || '') + '"><div class="k">' + U.esc(k) + '</div>' +
      '<div class="v">' + U.esc(v) + (unit ? '<small>' + U.esc(unit) + '</small>' : '') + '</div>' +
      (d ? '<div class="d">' + U.esc(d) + '</div>' : '') + '</div>';
  };

  U.empty = function (text) {
    return '<div class="empty"><div class="big">🌱</div><div>' + U.esc(text) + '</div></div>';
  };

  /* ---------- 层级组件：页头 / 焦点 / 分段 / 折叠 ---------- */

  /* 页头：标题 + 一句说明 + 本页唯一主行动 */
  U.pageHead = function (o) {
    return '<div class="page-head">' +
      '<div class="ph-text"><h1>' + U.icon(o.icon, 20) + ' ' + U.esc(o.title) + '</h1>' +
      (o.sub ? '<div class="sub">' + o.sub + '</div>' : '') + '</div>' +
      (o.action ? '<div class="ph-act">' + o.action + '</div>' : '') +
      '</div>';
  };

  /* 焦点卡：把"现在该做什么"放在页面最上方 */
  U.hero = function (o) {
    return '<div class="hero' + (o.tone ? ' ' + o.tone : '') + '">' +
      '<div class="h-k">' + U.esc(o.kicker || '现在该做什么') + '</div>' +
      '<div class="h-t">' + o.title + '</div>' +
      (o.desc ? '<div class="h-d">' + o.desc + '</div>' : '') +
      (o.action ? '<div class="h-act">' + o.action + '</div>' : '') +
      (o.side ? '<div class="h-side">' + o.side + '</div>' : '') +
      '</div>';
  };

  /* 分段导航：一页拆成几个动作，一次只显示一组 */
  R.tabState = R.tabState || {};
  U.tab = function (ns, def) {
    if (!R.tabState[ns]) R.tabState[ns] = def;
    return R.tabState[ns];
  };
  U.tabs = function (ns, items) {
    var cur = U.tab(ns, items[0].key);
    return '<div class="tabs">' + items.map(function (it) {
      return '<button class="tab' + (it.key === cur ? ' on' : '') + '" data-act="setTab" ' +
        'data-arg="' + ns + '" data-arg2="' + it.key + '">' + U.esc(it.label) +
        (it.n !== undefined && it.n !== null ? '<span class="n">' + it.n + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  };

  /* 折叠块：次要信息下放一级，默认收起 */
  U.fold = function (label, body, opts) {
    opts = opts || {};
    return '<details class="fold' + (opts.plain ? ' plain' : '') + '"' + (opts.open ? ' open' : '') + '>' +
      '<summary>' + U.esc(label) + (opts.tag ? '<span class="tag">' + U.esc(opts.tag) + '</span>' : '') + '</summary>' +
      '<div class="fold-body">' + body + '</div></details>';
  };

  /* 弱化信息块 */
  U.panel = function (html) { return '<div class="panel">' + html + '</div>'; };
  U.note = function (html) { return '<div class="muted-note">' + html + '</div>'; };

  /* 元数据行：替代徽章堆 */
  U.metaLine = function (items) {
    var out = items.filter(function (x) { return x; });
    if (!out.length) return '';
    return '<div class="meta-line">' + out.map(function (x) {
      return '<span>' + x + '</span>';
    }).join('<span class="sep">·</span>') + '</div>';
  };

  /* 筛选条 */
  U.filterBar = function (items, right) {
    return '<div class="filter-bar">' + items.map(function (it) {
      return '<span class="chip' + (it.on ? ' on' : '') + '" data-act="setTab" ' +
        'data-arg="' + it.ns + '" data-arg2="' + it.key + '">' + U.esc(it.label) +
        (it.n !== undefined ? ' ' + it.n : '') + '</span>';
    }).join('') + '<span class="spacer"></span>' + (right || '') + '</div>';
  };

  R.actions.setTab = function (ns, val) { R.tabState[ns] = val; R.render(); };

  /* 依据溯源卡片（抽屉内容） */
  U.evidenceList = function (ids) {
    var st = R.store.get();
    return (ids || []).map(function (id) {
      var ev = R.EVIDENCE[id];
      if (!ev) return '';
      var missing = (ev.src === 'teacher' && !st.obsFilled.teacher) || (ev.src === 'parent' && !st.obsFilled.parent);
      return '<div class="card tight" style="margin-bottom:10px;background:' + (missing ? '#fffafc' : '#fbfcfe') + '">' +
        '<div class="row" style="gap:6px;margin-bottom:6px">' +
          U.badge(ev.srcName, ev.src === 'medical' ? 'r' : ev.src === 'assess' ? 'b' : ev.src === 'teacher' ? 't' : 'v') +
          U.badge(ev.date, 'outline') +
          (missing ? U.badge('待观察确认', 'gray') : '') +
        '</div>' +
        '<div style="font-weight:600;font-size:13px">' + U.esc(ev.item) + '：' + U.esc(ev.value) + '</div>' +
        '<div class="small muted" style="margin-top:6px;line-height:1.6">原文摘录：' + U.esc(ev.quote) + '</div>' +
      '</div>';
    }).join('');
  };

  U.srcBadge = function (src) {
    var map = { medical: ['① 医学诊断', 'r'], assess: ['② 教育评估', 'b'], teacher: ['③ 教师观察', 't'], parent: ['④ 家长观察', 'v'] };
    var m = map[src] || ['其他', 'gray'];
    return U.badge(m[0], m[1]);
  };

  /* 触发器：全局事件委托（按钮 data-act） */
  R.actions = R.actions || {};
  U.bindActions = function () {
    document.removeEventListener('click', U._clickHandler, false);
    U._clickHandler = function (e) {
      var t = e.target.closest ? e.target.closest('[data-act]') : null;
      if (!t) return;
      var fn = t.getAttribute('data-act');
      var arg = t.getAttribute('data-arg');
      var arg2 = t.getAttribute('data-arg2');
      if (R.actions[fn]) { e.preventDefault(); R.actions[fn](arg, arg2, t); }
    };
    document.addEventListener('click', U._clickHandler, false);
  };

  R.ui = U;

})(window.RIEP);
