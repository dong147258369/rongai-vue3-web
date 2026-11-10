/* ============================================================
   store.js · 状态与持久化（localStorage，失败则退化为内存）
   v4：档案成为一等对象 + 报告由用户上传后解析
     state.cases = [{ id, meta, data }]
     切档时把当前案 data 挂到 state 顶层，视图仍按扁平字段读
     R.CASE / R.DOMAIN_PROFILE / R.FAMILY_PROFILE / R.CHILDREN 为动态 getter
     data.reports = { medical, pep3, vbmapp, sensory } —— 每份 = 上传 + 解析 + 确认
   ============================================================ */
(function (R) {
  'use strict';

  var KEY = 'rongiep.state.v5';
  var mem = null;

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  /* 一格多段：原稿一个自然段 = 一条，换行 / 分号都当分段符 */
  function toParas(t) {
    return String(t || '').split(/[\n\r]+/).map(function (x) { return x.trim(); })
      .filter(function (x) { return x.length > 0; });
  }
  /* 比较用：忽略空白与分号差异，判断"这一栏到底改没改" */
  function flat(t) { return String(t || '').replace(/[\s；;]/g, ''); }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function stamp() {
    var d = new Date();
    return today() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  /* 已回收的观察内容（与三份观察表原件逐条对应） */
  var OBS_GROUP = {
    '大运动/精细动作': {
      strength: '大运动：能够独立、完整地完成跑、跳、爬等运动，足球活动中可用足尖将足球向前踢出；能标准完成投掷动作且投中率约为60%。精细动作：手眼协调基础较好，能够独立将各类不同形状放入相应的孔洞中；在美工活动中能独立完成压扁、搓条和揉圆等基本操作。',
      need: '大运动：整体身体平衡及动作规划能力仍需加强，动作的连续性不足，且难以维持单脚站立平衡，单脚站立保持的平衡时间仅有3秒。精细动作：手掌、手指力量调控以及手部灵活变换的能力还需要加强练习，在左右手调换或需要灵活变化手指形状时无法快速反应。'
    },
    '语言沟通能力': {
      strength: '语言表达逻辑清晰，能与老师、同伴进行简单对话，可清楚表达自身需求，并说明理由，如“我不要吃饭，我要回家，我着急了”，具备较好的语言理解与表达优势。',
      need: '人称代词掌握不足，存在“你”“我”混用现象，例如吃加餐时会说：“你不要喝酸奶了。”'
    },
    '社会交往能力': {
      strength: '幼儿已能认识班里所有同学，并可以在教师引导下与同伴打招呼、交流玩具、进行自我介绍等。在打招呼过程中能与小朋友对视，完成正确的打招呼流程；',
      need: '离开教师引导后主动发起社交行为偏少，自主开启交流频次较低，社交技巧仍需练习。'
    },
    '生活自理能力': {
      strength: '生活自理能力较好，独立性高，能独立穿脱衣物及袜子，能独立完成接水饮水、如厕、搬小椅子等日常事务，班级常规落实稳定。',
      need: '自主进食能力有待进一步提升，进食时存在直接吞咽食物的情况，咀嚼意识薄弱，需教师反复提醒细嚼慢咽。'
    },
    '认知学习能力': {
      strength: '认知理解发展较好，能顺利完成各种认知类活动；区域游戏中喜爱拼图，能够独立参照图片拼出相应的形状及数字。',
      need: '主动发起思考、自主规划较弱，大多需要老师提示、引导才能开展活动，较少自己主动构思玩法、安排步骤。'
    },
    '情绪行为表现': {
      strength: '整体情绪平稳，放学时段和午睡时段情绪急躁问题已消除；使用约定方式引导能较快平复情绪。',
      need: '当遇到较难的问题时会出现急躁情绪和逃避行为，接受挫折的能力有待提高。'
    },
    '关注跟随能力': {
      strength: '课堂关注专注力增强，全程无离座行为，对课堂的关注时长明显延长；集体教学活动中能保持较好注意力，听到老师指令能做出相应回应；在户外操及手指律动过程中，可以全程跟随教师动作并跟唱。',
      need: '课堂中偶尔将目光转向后排观察后排老师；仍存在分心以及注意力转移的情况；'
    }
  };
  var OBS_FUSION = {
    '健康': {
      strength: '1.情绪适应总体平稳，能够通过数数、星期等方式调节情绪，放学急躁已消除，受挫或被同伴拒绝后经引导可快速平复、转移注意力。2.能独立完成如厕、穿脱衣物鞋袜、接水饮水、搬椅子，能跟随集体收玩具并将物品归位。3.大肌肉发展较好，能完成跑、跳、爬基本运动，投掷沙包动作标准。',
      need: '1.早上入园、午睡前易出现情绪波动，依赖成人约定才能平复，需要提前预告与引导。2.吃饭时存在直接吞咽、咀嚼意识薄弱；身体平衡和协调性仍需加强（单脚站立、双脚连续向前跳困难）。3.精细动作协调性有待提升，手部力量与手指灵活性需加强，精准涂色仍需辅助，左右手调换及手指形状灵活变化反应慢。4.对加餐、水果、酸奶仍有轻微抵触，咀嚼依赖成人提醒。'
    },
    '语言': {
      strength: '1.倾听与指令理解突出：能精准识别并执行教师指令，活动中关注跟随较为稳定，户外操与手指律动能全程跟做跟唱。2.表达层次明显提升：从「能表达需求」→「能说出需求背后的原因」→「在引导下完整表达情绪行为背后的原因与自身诉求」。3.能在引导下使用功能性社交语言（如「可以给我玩一下吗」），并完成打招呼、自我介绍等语言流程。',
      need: '1.人称代词“你”“我”混用现象仍需纠正（如「你不要喝酸奶了」），需在真实情景中专项练习。2.语言交流多集中于教师，主动与同伴对话较少；在集体教学中主动回应教师提问的次数偏少。3.句式偏短，描述性语言与完整复述不足；礼貌用语多在成人提醒下使用。'
    },
    '社交': {
      strength: '1.规则意识与集体适应进步突出：从「易离座分心」→「离座明显减少」→「整节课全程无离座」，课堂专注时长持续延长。2.常规落实稳定：搬椅子、收玩具、参与律动等集体指令已无需成人单独引导，可自主跟随完成。3.半融合适应良好，无抗拒情绪，对班级环境与集体活动充满好奇。4.冲突处理方式进步：玩具争抢由「直接动手」转为「引导下用语言请求」；被同伴拒绝后能平复情绪并接受替代玩具。5.已认识全班同学，能主动与小朋友对视并完成正确的打招呼流程。',
      need: '1.主动发起社交频次偏低，离开教师引导后更少，尚未稳定达到「愿意和小朋友一起游戏」「想加入时能友好提出请求」的自主水平。2.同伴关注与回应意识弱，玩具争抢时需引导才能使用礼貌语言，社交对象偏向成人；在集体中主动开启对话、主动回应次数偏少。'
    },
    '科学': {
      strength: '1.认知理解与操作能力较好，复杂任务经教师示范与语言指导后可独立完成、实现迁移。2.形状—孔洞对应准确，能独立将不同形状放入相应孔洞。3.拼图能力突出且进步快，由参照图片拼出形状与数字，到数字拼图已完全不需要教师辅助、可独立完成。',
      need: '1.数概念与点数对应仍是明显短板：说到数字5时不能直接指认，需从1开始点数，尚未达成「能手口一致地点数5个以内的物体并说出总数、能按数取物」。2.探究中主动提问少，偏于「完成任务」而非「提出问题—大胆猜测—验证」；对过程与结果的表达不足。'
    },
    '艺术': {
      strength: '1.户外操、手指律动能全程跟随教师动作并跟唱，已达成「能跟随熟悉的音乐做身体动作」「能模仿学唱短小歌曲」。2.对拼图、涂画等操作类活动有兴趣，愿意动手参与。3.能跟随音乐进行律动、手指游戏。',
      need: '1.精细动作的准确性和稳定性需加强，涂色、手工等表现性活动仍需教师辅助，手部力量与控制力限制了艺术表现。2.表现以模仿、参照为主，自主创造与个性表达偏少。'
    }
  };
  var OBS_PARENT = {
    '情绪': {
      strength: '在家整体情绪比较平稳。早上送入园前偶尔会有小情绪，我们用老师建议的“今天星期几、在哪所幼儿园”问答，或提前预告接下来要去做什么，孩子能较快平复。出门活动以前容易急躁，现在基本没有了，有时还会自己数数让自己安静下来。吃水果、喝酸奶时若事先约定“先尝第一口”，情绪也能缓下来。',
      need: '情绪激动的情况多出现在出门玩、做事情前，需要提前告诉孩子要去哪里、做什么；遇到不想吃的东西仍有轻微抵触。'
    },
    '生活自理': {
      strength: '在家能独立上厕所、穿脱裤子和袜子，也能自己用饮水机接水喝水。吃饭时用“嚼完5口再咽”的约定比较有效，咀嚼意识比之前好。做事的意愿较好，我们会有意识地多给他自己动手的机会。',
      need: '进食时偶尔还会直接吞咽，需要提醒细嚼慢咽；不会系、解扣子，穿脱衣物速度稍微慢一点，但愿意自己做。'
    },
    '认知': {
      strength: '能数数，会讲述今天在幼儿园里干了什么。能看懂动画片和故事书的剧情。',
      need: '有时只是重复大人的话，不明白话的内容。'
    },
    '社交': {
      strength: '在家和熟悉的大人互动较好，能表达自己的想法；出门遇到小朋友，在提醒下能对视、打招呼。',
      need: '不太主动和别人交流，不太和小朋友一起玩。对同伴的关注和主动发起社交还是偏少。'
    },
    '进餐习惯': {
      strength: '在家能自己用勺子进食，咀嚼意识有提高，与孩子约定执行“嚼完5口再咽”后进步明显。',
      need: '偶尔直接吞咽，需要一直提醒，遇到不喜欢的东西就不吃。'
    },
    '喜好及厌恶': {
      strength: '喜欢拼图、跑跳、足球、投沙包、手指律动和模仿游戏；在家喜欢当“小老师”，模仿老师讲课。',
      need: '对水果、酸奶等食物有抵触；缺少耐心，很抵触不喜欢的东西。'
    },
    '安全意识': {
      strength: '知道电源、热水等是危险的东西，外出知道要牵着大人的手，不随意跑开；能听懂“危险”“等一等”等提醒。',
      need: '在家活动量较大，跑跳时容易兴奋，对危险情境的判断还需要成人提醒，比如攀爬、快速跑动、靠近热水和插座时要反复叮嘱。'
    },
    '对视回应': {
      strength: '和家人对视、回应比较好，叫名字时多数能看过来并回应。外出遇到其他小朋友时，在提醒下能完成对视和打招呼。',
      need: '主动看向大人的眼睛和主动表达偏少；别人和孩子打招呼时会回应，但不会主动问候；主动开启对话的次数偏少。'
    },
    '家长需求': {
      strength: '',
      need: '希望老师继续关注他主动发起同伴社交、主动回应老师和同伴的情况；也请及时反馈他在融合班和集体活动中的表现，我们在家配合小步练习。'
    }
  };

  /* ---------- 年龄 ---------- */
  function ageText(birthday, ref) {
    if (!birthday) return '—';
    var b = new Date(birthday + 'T00:00:00');
    if (isNaN(b.getTime())) return '—';
    var r = ref ? new Date(ref + 'T00:00:00') : new Date();
    var m = (r.getFullYear() - b.getFullYear()) * 12 + (r.getMonth() - b.getMonth());
    if (r.getDate() < b.getDate()) m -= 1;
    if (m < 0) return '—';
    return Math.floor(m / 12) + ' 岁 ' + (m % 12) + ' 个月';
  }
  R.ageText = ageText;

  /* ---------- 空报告位（用户上传后填） ---------- */
  function emptyReports() {
    return { medical: null, pep3: null, vbmapp: null, sensory: null };
  }

  function seedReports() {
    var P = R.PEP3_SEED, V = R.VBMAPP_SEED, M = R.MEDICAL_SEED;
    /* 土豆的解析字段就是各类型模板里的 demo（与真实报告一致），
       structured 仍用种子数据，保证画像、评估对照、成稿口径统一 */
    var out = {}, byKey = {};
    (R.REPORT_TYPES || []).forEach(function (T) { byKey[T.key] = T; });
    function rep(key, extra) {
      var T = byKey[key] || { name: key };
      var r = {
        type: key, name: T.name, file: extra.file, pages: extra.pages,
        kind: extra.kind, ocrConf: extra.ocrConf, chars: extra.chars, uploadedAt: extra.uploadedAt,
        date: (T.demo && (T.demo['评估日期'] || T.demo['就诊日期'])) || '',
        status: extra.status || 'confirmed',
        fields: clone(T.demo || {}), structured: extra.structured
      };
      out[key] = r;
    }
    rep('medical', {
      file: '土豆-门诊病历与量表报告-20260617.docx', pages: 6, kind: 'ocr', ocrConf: 82, chars: 2806,
      uploadedAt: '2026-06-18 09:12', structured: clone(M)
    });
    rep('pep3', {
      file: P.file, pages: P.pages, kind: 'pdf', chars: 4385,
      uploadedAt: '2026-10-26 17:40', structured: clone(P)
    });
    rep('vbmapp', {
      file: V.file, pages: V.pages, kind: 'pdf', chars: 6557,
      uploadedAt: '2026-10-26 17:42', structured: clone(V)
    });
    rep('sensory', {
      file: R.SENSORY_SEED.file, pages: R.SENSORY_SEED.pages, kind: 'ocr', ocrConf: 85, chars: 3203,
      uploadedAt: '2026-07-22 10:05', status: 'confirmed', structured: clone(R.SENSORY_SEED)
    });
    return out;
  }

  /* ---------- 一份完整的土豆档案 ---------- */
  function potatoCase() {
    var meta = clone(R.BASE_CASE);
    var data = {
      domainProfile: clone(R.DOMAIN_PROFILE_SEED),
      familyProfile: clone(R.FAMILY_PROFILE_SEED),
      goals: clone(R.GOALS),
      meetings: [clone(R.MEETING)],
      progress: clone(R.PROGRESS),
      observation: { group: clone(OBS_GROUP), fusion: clone(OBS_FUSION), parent: clone(OBS_PARENT) },
      obsFilled: { group: true, fusion: true, parent: true },
      obsFiles: {
        group: { file: '小组班级教师日常观察表.docx', by: '班级教师 王老师', date: '2026-10-26', kind: 'docx', chars: 1180 },
        fusion: { file: '融合班级教师日常观察表.docx', by: '融合教师 李老师', date: '2026-10-26', kind: 'docx', chars: 1420 },
        parent: { file: '家长观察记录.docx', by: '家长（母亲）', date: '2026-10-28', kind: 'docx', chars: 1260 }
      },
      doc: { version: 'v1.0', status: 'draft', effectiveBy: '', effectiveAt: '', parentShared: false },
      reports: seedReports(),
      sensoryFixed: true,
      todos: [
        { id: 't1', text: '审议 6 条待确认目标，重点看社交-1 与情绪-1 的写法', who: '融合教师 李老师', due: '本周内', done: false, urgent: true },
        { id: 't2', text: '抽查扫描件识别结果（医学诊断 82 / 感统 85），重点看带「建议核对」徽标的字段', who: '融合教师 李老师', due: '1 周内', done: false, urgent: false },
        { id: 't3', text: '把 11-02 会议决议应用回目标，成稿升级 v2.0', who: '融合教师 李老师', due: '本周内', done: false, urgent: true },
        { id: 't4', text: '把小组课数据（单脚站 3 秒 → 4 秒）同步给班级教师', who: '小组教师', due: '本周内', done: false, urgent: false },
        { id: 't5', text: '11 月月度检视：补齐未更新目标', who: '班级教师', due: '每月', done: false, urgent: false }
      ],
      risk: { flagged: false, reason: '', handled: false },
      logs: [
        { t: '2026-09-01 09:12', who: '融合教师 李老师', act: '建档', detail: '创建个案档案（园内编号 C-2026-026），班级：半融半组' },
        { t: '2026-10-26 17:40', who: '系统', act: '材料解析', detail: 'PEP-3 17 项、VB-MAPP 26 项由 PDF 文字层读出；感统 5 页与医学诊断 6 页为扫描件，经本机识别引擎读出 24 / 15 项' },
        { t: '2026-10-26 18:20', who: '班级教师', act: '提交观察表', detail: '小组班 7 维度 + 融合班五大领域观察已回收' },
        { t: '2026-10-28 21:05', who: '家长', act: '提交观察表', detail: '居家观察表 9 维度已提交（含时间戳）' },
        { t: '2026-11-01 10:30', who: '系统', act: '草案生成', detail: '按 6 个能力维度生成 13 条候选目标，其中 6 条核心目标标记为已采纳建议' }
      ]
    };
    return { id: meta.id, meta: meta, data: data };
  }

  /* 已有档案的简案（只有档案头，数据不全 —— 用于演示多档案切换） */
  function briefCase(o) {
    var baseline = R.DOMAINS.map(function (d) {
      return { code: d.code, level: '数据不足', score: 0, baseline: 0, target: 0,
        summary: '该档案尚未完成评估数据归集，暂时无法生成能力指数。',
        strengths: [], needs: [], evid: [] };
    });
    var meta = {
      id: o.id, alias: o.alias, name: o.alias.replace(/（化名）$/, ''), gender: o.gender,
      age: o.age, birthday: o.birthday, cls: o.cls,
      enrollDate: o.enrollDate, planStart: o.planStart, planEnd: o.planEnd, iepDate: o.iepDate || today(),
      stage: o.stage, stageIdx: o.stageIdx || 1, dx: o.dx || '待补充',
      team: ['园所行政领导', '班级教师', '融合教师', '家长'],
      materialStatus: {
        medical: { state: o.medical || 'none', note: '待上传医学诊断与复诊记录' },
        assess: { state: 'none', parts: { pep3: false, vbmapp: false, sensory: false }, note: '待上传 PEP-3 / VB-MAPP / 感统评估' },
        teacher: { state: 'none', note: '待回收教师观察表' },
        parent: { state: 'none', note: '待家长提交居家观察表' }
      },
      materials: [],
      gaps: []
    };
    return {
      id: meta.id, meta: meta,
      data: {
        domainProfile: baseline,
        familyProfile: { level: '背景', strengths: '', needs: '', evid: [] },
        goals: [], meetings: [], progress: [],
        observation: { group: {}, fusion: {}, parent: {} },
        obsFilled: { group: false, fusion: false, parent: false },
        obsFiles: { group: null, fusion: null, parent: null },
        doc: { version: 'v1.0', status: 'draft', effectiveBy: '', effectiveAt: '', parentShared: false },
        reports: emptyReports(),
        sensoryFixed: false, todos: [], risk: { flagged: false, reason: '', handled: false },
        logs: [{ t: o.enrollDate + ' 09:00', who: '系统', act: '建档', detail: '创建个案档案（园内编号 ' + o.id + '）' }]
      }
    };
  }

  function seed() {
    var cases = [potatoCase()];
    [
      { id: 'C-2026-018', alias: '安安（化名）', gender: '女', age: '4 岁 7 个月', birthday: '2022-04-02',
        cls: '融合中班', enrollDate: '2026-09', planStart: '2026-09', planEnd: '2027-01', iepDate: '2026-10-15',
        stage: '执行与月度检视', stageIdx: 5 },
      { id: 'C-2026-024', alias: '乐乐（化名）', gender: '男', age: '5 岁 0 个月', birthday: '2021-11-08',
        cls: '融合大班', enrollDate: '2026-09', planStart: '2026-09', planEnd: '2027-01', iepDate: '2026-10-09',
        stage: '执行与月度检视', stageIdx: 5 },
      { id: 'C-2026-029', alias: '宁宁（化名）', gender: '女', age: '3 岁 9 个月', birthday: '2023-02-14',
        cls: '融合小班', enrollDate: '2026-10', planStart: '2026-10', planEnd: '2027-01',
        stage: '数据归集', stageIdx: 1 },
      { id: 'C-2026-031', alias: '航航（化名）', gender: '男', age: '5 岁 3 个月', birthday: '2021-08-21',
        cls: '融合大班', enrollDate: '2026-09', planStart: '2026-09', planEnd: '2027-01', iepDate: '2026-09-20',
        stage: '学期复审', stageIdx: 6 }
    ].forEach(function (o) { cases.push(briefCase(o)); });

    return {
      role: 'teacher',
      weights: clone(R.DEFAULT_WEIGHTS),
      enabled: clone(R.DEFAULT_ENABLED),
      currentId: 'C-2026-026',
      cases: cases,
      seededAt: new Date().toISOString()
    };
  }

  var state = null;

  /* ---------- 观察表归一化 ----------
     观察表是三张：小组班 / 融合班 / 家长居家。
     历史存档里只有 teacher / parent 两份，这里补齐并保持 teacher（= 任一张教师表已回收）
     与 parent 两个派生标记，旧逻辑不用改。 */
  function normalizeObs() {
    var ob = state.observation = state.observation || {};
    if (ob.teacher && !ob.group) { ob.group = ob.teacher; delete ob.teacher; }
    if (!ob.fusion) ob.fusion = {};
    ['group', 'fusion', 'parent'].forEach(function (k) { ob[k] = ob[k] || {}; });
    var of = state.obsFilled = state.obsFilled || {};
    if (of.group === undefined && of.fusion === undefined) {
      of.group = !!of.teacher; of.fusion = !!of.teacher;
    }
    ['group', 'fusion', 'parent'].forEach(function (k) { of[k] = !!of[k]; });
    of.teacher = !!(of.group || of.fusion);   /* 派生：任一教师表回收即算 */
    if (!state.obsFiles) state.obsFiles = { group: null, fusion: null, parent: null };
  }
  R.__normalizeObs = normalizeObs;

  /* ---------- 档挂载 ---------- */
  function currentCase() {
    var id = state.currentId;
    return state.cases.filter(function (c) { return c.id === id; })[0] || state.cases[0];
  }

  function mount(id) {
    var c = state.cases.filter(function (x) { return x.id === id; })[0] || state.cases[0];
    state.currentId = c.id;
    var d = c.data;
    state.goals = d.goals;
    state.observation = d.observation;
    state.obsFilled = d.obsFilled;
    state.obsFiles = d.obsFiles || (d.obsFiles = { group: null, fusion: null, parent: null });
    normalizeObs();
    state.meetings = d.meetings;
    state.progress = d.progress;
    state.doc = d.doc;
    state.reports = d.reports = d.reports || (c.id === 'C-2026-026' ? seedReports() : emptyReports());
    state.sensoryFixed = d.sensoryFixed;
    state.todos = d.todos;
    state.risk = d.risk;
    state.logs = d.logs;
    state.fieldConfirmed = d.fieldConfirmed || (d.fieldConfirmed = {});
    state.materials = c.meta.materialStatus;
    return c;
  }

  /* 完整度：医学 25 + 教育评估 35（三项均分）+ 教师观察 20 + 家长观察 20 */
  function completenessOf(meta, data) {
    var ms = meta.materialStatus || {};
    var s = 0;
    var m = ms.medical && ms.medical.state;
    s += m === 'done' ? 25 : m === 'part' ? 12 : 0;
    var parts = (ms.assess && ms.assess.parts) || {};
    var n = 0;
    if (parts.pep3) n++;
    if (parts.vbmapp) n++;
    if (parts.sensory) n++;
    s += 35 * n / 3;
    var of = (data && data.obsFilled) || {};
    if (of.group) s += 10;
    if (of.fusion) s += 10;
    if (of.parent) s += 20;
    return Math.round(s);
  }

  /* 材料变动后：同步数据缺口与阶段 */
  function syncCase(c) {
    var comp = completenessOf(c.meta, c.data);
    c.meta.gaps = c.meta.gaps || [];
    if (comp > 0) c.meta.gaps = c.meta.gaps.filter(function (g) { return g.key !== 'data'; });
    else if (!c.meta.gaps.some(function (g) { return g.key === 'data'; })) {
      c.meta.gaps.unshift({
        key: 'data', name: '评估与观察尚未归集',
        why: '这份档案还没有评估报告与观察记录，能力指数与目标建议都还没有依据。',
        act: '在「儿童档案 → 材料清单」上传医学诊断与评估报告，或先填六维初判'
      });
    }
    if (comp === 0) { c.meta.stage = '数据归集'; c.meta.stageIdx = 1; }
    else if (!(c.data.goals || []).length) { c.meta.stage = '数据归集 / 待生成草案'; c.meta.stageIdx = 2; }
    else { c.meta.stageIdx = Math.max(c.meta.stageIdx, 3); }
    return comp;
  }
  var m_gaps = syncCase;

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
      /* v3 数据迁移：补 reports 字段 */
      var old = localStorage.getItem('rongiep.state.v3');
      if (old) {
        var s = JSON.parse(old);
        (s.cases || []).forEach(function (c) {
          if (!c.data.reports) {
            c.data.reports = (c.id === 'C-2026-026' || (c.meta.alias || '').indexOf('土豆') >= 0)
              ? seedReports() : emptyReports();
          }
        });
        return s;
      }
      /* 预置数据包（assets/js/user-state.js）：换电脑 / 全新浏览器首次打开时，
         自动载入打包时快照的全量数据（档案、已解析报告、目标、成稿、AI 配置）。
         仅在本机没有任何存档时生效一次；之后一切读写都走本机 localStorage，
         后续更新用「设置 → 数据管理 → 导入全量数据」。 */
      var pre = window.RIEP_PRESET_STATE;
      if (pre && Array.isArray(pre.cases) && pre.cases.length &&
          pre.cases.every(function (c) { return c && c.meta && c.data; })) {
        var snap = JSON.stringify(pre);
        try { localStorage.setItem(KEY, snap); } catch (e2) { /* 存不进也能内存跑 */ }
        return JSON.parse(snap);
      }
    } catch (e) { /* file:// 或隐私模式下降级 */ }
    return null;
  }

  var API_BASE = '/api/v1/iep';
  var backendTimer = null;
  var isStaticHost = typeof window !== 'undefined' && (
    window.location.hostname.indexOf('github.io') >= 0 ||
    window.location.hostname.indexOf('gitee.io') >= 0 ||
    window.location.protocol === 'file:'
  );

  function toCaseCode(id) {
    if (!id || id === 'C-2026-048') return 'case-048';
    if (id.indexOf('-') >= 0) {
      return 'case-' + id.split('-').pop();
    }
    return id;
  }

  function syncToBackend() {
    if (isStaticHost || !state || !state.currentId) return;
    clearTimeout(backendTimer);
    backendTimer = setTimeout(function () {
      try {
        var cid = state.currentId;
        var code = toCaseCode(cid);
        var c = (state.cases || []).filter(function (x) { return x.id === cid; })[0];
        var d = c ? c.data : {};
        var payload = {
          alias: (c && c.meta) ? c.meta.alias : '',
          name: (c && c.meta) ? c.meta.name : '',
          docStatus: state.doc ? state.doc.status : 'draft',
          docVersion: state.doc ? state.doc.version : 'v2.0',
          effectiveBy: state.doc ? state.doc.effectiveBy : '',
          effectiveAt: state.doc ? state.doc.effectiveAt : '',
          adviceCount: (function () {
            var m = state.meetings && state.meetings[state.meetings.length - 1];
            var a = m && m.advice;
            if (!a) return 0;
            var l = (a.items || []).filter(function (x) { return !x.applied && !x.dismissed; }).length;
            var pl = (a.pending || []).filter(function (x) { return !x.applied && !x.dismissed; }).length;
            return l + pl;
          })(),
          data: d
        };
        fetch(API_BASE + '/cases/' + code, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(function (res) { return res.json(); })
          .then(function (res) {
            console.log('[Java Spring Boot 3 API] 个案档案已同步至 MySQL (/api/v1/iep/cases/' + code + '):', res);
          }).catch(function (err) {
            console.warn('[Java Spring Boot 3 API] 后端同步异常:', err);
          });
      } catch (err) {
        console.warn('[Java Backend Sync Error]', err);
      }
    }, 200);
  }

  function fetchFromBackend(cid, cb) {
    if (isStaticHost) {
      if (typeof cb === 'function') cb(null, state);
      return;
    }
    if (!cid) cid = state.currentId || 'C-2026-048';
    var code = toCaseCode(cid);
    fetch(API_BASE + '/cases/' + code)
      .then(function (res) { return res.json(); })
      .then(function (res) {
        if (res && res.code === 200 && res.data) {
          console.log('[Java Spring Boot 3 API] 从 MySQL 成功加载最新个案档案 (/api/v1/iep/cases/' + code + '):', res.data);
          var serverData = res.data;
          var c = (state.cases || []).filter(function (x) { return x.id === cid; })[0];
          if (c && serverData.data) {
            c.data = serverData.data;
            if (serverData.docStatus) {
              c.data.doc = c.data.doc || {};
              c.data.doc.status = serverData.docStatus;
              c.data.doc.version = serverData.docVersion || 'v2.0';
              c.data.doc.effectiveBy = serverData.effectiveBy || '';
              c.data.doc.effectiveAt = serverData.effectiveAt || '';
            }
            if (state.currentId === cid) {
              mount(cid);
            }
          }
          if (typeof cb === 'function') cb(null, res.data);
        } else {
          if (typeof cb === 'function') cb(new Error('Fetch failed'));
        }
      }).catch(function (err) {
        console.warn('[Java Spring Boot 3 API] 后端拉取失败，使用本地快照:', err);
        if (typeof cb === 'function') cb(err);
      });
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { mem = state; }
    syncToBackend();
  }

  state = load() || seed();
  if (!state.cases || !state.cases.length) state = seed();

  /* ---------- 能力分析分段落迁移（一次性） ----------
     p116：把合并成一整段的旧数据按种子还原成「一段一条」。
     p117：种子改为精简稿（每格 ≤5 条、文字压缩）。
     p118：种子再压一档（每格 2–4 条、单条 ≈15 字）。
     p119：内置案例（土豆）整格换成短稿；其它档案里"条数 >4 或单条 >26 字"的格
           按 R.shortItem 压成一句话，最多留 4 条（只压系统生成的旧文本，
           一句一句手写的短句不受影响）。 */
  (function migrateProfile() {
    var REV = 'p119';
    var SEED_CASE = 'C-2026-026';   /* 内置土豆档案 */
    var seedMap = {};
    (R.DOMAIN_PROFILE_SEED || []).forEach(function (d) { seedMap[d.code] = d; });
    function headOf(text, n) { return flat(text).slice(0, n || 12); }
    function startsWithHead(text, head) {
      return !!head && flat(text).indexOf(head) === 0;
    }
    function squeeze(arr, max) {
      return (arr || []).map(function (t) { return R.shortItem(t, max || 20); })
        .filter(function (t) { return t; }).slice(0, 4);
    }
    function tooHeavy(arr) {
      if ((arr || []).length > 4) return true;
      return (arr || []).some(function (t) { return String(t || '').trim().length > 26; });
    }
    /* 各版本旧稿的首条开头（p116 长句版 / p117 精简版） */
    var OLD_HEADS = {
      YD: { strengths: ['跑、跳、爬、投掷沙', '跑、跳、爬、投掷、踢球'], needs: ['单脚站立维持时间短', '单脚站立仅3秒'] },
      YY: { strengths: ['指令理解能力强，能', '指令理解强，能执行教师'], needs: ['称代词“你/我”混淆混用', '“你/我”混用'] },
      SJ: { strengths: ['课堂离座分心行为大幅', '离座分心大幅改善'], needs: ['主动发起社交薄弱，社', '主动发起社交少，互动对象'] },
      ZL: { strengths: ['独立如厕、穿脱衣物鞋', '如厕、穿脱衣物鞋袜、接水'], needs: ['进食习惯问题突出：咀', '咀嚼意识弱'] },
      RZ: { strengths: ['形状配对、拼图能力优', '形状配对、拼图能力优秀'], needs: ['数概念手口一致点数、', '手口一致点数、按数取物'] },
      QX: { strengths: ['整体情绪趋于平稳，会', '情绪整体平稳，会用数数'], needs: ['遇到难度高的任务，容', '遇难题易急躁、逃避'] }
    };
    var FAM_HEADS = {
      strengths: ['情绪：整体较为稳定', '情绪整体稳定，提前告知后'],
      needs: ['进食时偶尔还会直接吞', '进食偶尔直接吞咽，需提醒']
    };
    function isOldCell(arr, heads) {
      if (!(arr || []).length) return false;
      var first = (arr || [])[0] || '';
      return (heads || []).some(function (h) { return startsWithHead(first, h); });
    }
    var dirty = false;
    (state.cases || []).forEach(function (c) {
      var data = c.data || {};
      if (data.profileRev === REV) return;
      dirty = true;
      var isSeedCase = c.id === SEED_CASE;
      (data.domainProfile || []).forEach(function (d) {
        var sd = seedMap[d.code], fp = OLD_HEADS[d.code];
        if (!sd) return;
        ['strengths', 'needs'].forEach(function (side) {
          var arr = d[side] || [];
          /* 内置案例：整格直接用短稿（用户确认过"土豆替换成短稿"） */
          if (isSeedCase) { d[side] = (sd[side] || []).slice(); return; }
          /* 其它档案：旧稿 / 合并长段 → 换新种子；系统生成的过长文本 → 就地压短 */
          var merged = arr.length === 1 && startsWithHead(arr[0], headOf((sd[side] || [])[0]));
          if (merged || isOldCell(arr, fp && fp[side])
            || startsWithHead(arr[0], headOf((sd[side] || [])[0]))) {
            d[side] = (sd[side] || []).slice();
          } else if (tooHeavy(arr)) {
            d[side] = squeeze(arr);
          }
        });
      });
      var fam = data.familyProfile;
      if (fam) {
        if (isSeedCase) {
          fam.strengths = R.FAMILY_PROFILE_SEED.strengths;
          fam.needs = R.FAMILY_PROFILE_SEED.needs;
        } else {
          var famOldS = fam.strengths ? String(fam.strengths).split('\n') : [];
          var famOldN = fam.needs ? String(fam.needs).split('\n') : [];
          if (startsWithHead(fam.strengths, headOf(R.FAMILY_PROFILE_SEED.strengths))
            || isOldCell(famOldS, FAM_HEADS.strengths)) {
            fam.strengths = R.FAMILY_PROFILE_SEED.strengths;
          } else if (tooHeavy(famOldS)) {
            fam.strengths = squeeze(famOldS, 22).join('\n');
          }
          if (startsWithHead(fam.needs, headOf(R.FAMILY_PROFILE_SEED.needs))
            || isOldCell(famOldN, FAM_HEADS.needs)) {
            fam.needs = R.FAMILY_PROFILE_SEED.needs;
          } else if (tooHeavy(famOldN)) {
            fam.needs = squeeze(famOldN, 22).join('\n');
          }
        }
      }
      data.profileRev = REV;
    });
    if (dirty) persist();
  })();

  mount(state.currentId);

  /* ---------- 动态 getter：视图里 30 余处 R.CASE.xxx 自动跟档 ---------- */
  function def(name, getter) {
    try {
      Object.defineProperty(R, name, { configurable: true, enumerable: true, get: getter });
    } catch (e) { R[name] = getter(); }
  }
  def('CASE', function () { return currentCase().meta; });
  def('DOMAIN_PROFILE', function () { return currentCase().data.domainProfile; });
  def('FAMILY_PROFILE', function () { return currentCase().data.familyProfile; });

  function caseList() {
    return state.cases.map(function (c) {
      var d = c.data;
      var comp = completenessOf(c.meta, d);
      var last = (d.progress && d.progress.length)
        ? d.progress[d.progress.length - 1].month : '—';
      return {
        id: c.id, alias: c.meta.alias, name: c.meta.name, gender: c.meta.gender, age: c.meta.age,
        cls: c.meta.cls, teacher: c.meta.teacher || d.teacher || '李老师',
        stage: c.meta.stage, completeness: comp,
        iepVersion: d.doc && d.doc.version && d.doc.version !== '—'
          ? d.doc.version + (d.doc.status === 'effective' ? ' 生效' : ' 草案') : '—',
        lastReview: last, risk: !!(d.risk && d.risk.flagged), isCurrent: c.id === state.currentId,
        goalCount: (d.goals || []).length, hasData: (d.goals || []).length > 0
      };
    });
  }
  def('CHILDREN', caseList);
  def('REPORTS', function () { return currentCase().data.reports || {}; });
  def('MEDICAL', function () { var r = R.REPORTS.medical; return r && r.structured ? r.structured : null; });
  def('PEP3', function () { var r = R.REPORTS.pep3; return r && r.structured ? r.structured : null; });
  def('VBMAPP', function () { var r = R.REPORTS.vbmapp; return r && r.structured ? r.structured : null; });
  def('SENSORY', function () { var r = R.REPORTS.sensory; return r && r.structured ? r.structured : null; });

  /* ---------- 报告：解析结果 → 结构化 ---------- */
  var PEP3_KEYS = ['模仿', '知觉', '精细动作', '粗大动作', '手眼协调', '认知表现', '口语认知'];
  var VB_KEYS = ['提要求', '命名', '听者反应', '视觉配对', '社交', '模仿', '集体技能'];
  var SENS_KEYS = ['感觉调节', '基础机制与区辨', '运用能力'];

  function numOf(v) { var n = parseInt(String(v == null ? '' : v).replace(/[^0-9\-]/g, ''), 10); return isNaN(n) ? null : n; }

  function buildStructured(type, fields, meta) {
    var f = fields || {};
    if (type === 'medical') {
      return {
        file: meta.file, pages: meta.pages, date: f['就诊日期'] || '',
        hospital: f['就诊机构'] || '', dx: f['诊断结论'] || '',
        advice: f['康复建议'] || '', review: f['复诊计划'] || ''
      };
    }
    if (type === 'pep3') {
      var chrono = numOf(f['生理年龄（月）']) || 0;
      var domains = PEP3_KEYS.map(function (k) {
        var raw = String(f[k] || '').trim();
        if (!raw) return null;
        var ge = raw.indexOf('≥') >= 0 || raw.indexOf('>=') >= 0 || raw.indexOf('＞') >= 0;
        var n = numOf(raw);
        if (n === null) return null;
        var gap = ge ? null : n - chrono;
        var note = ge ? '已达参考最高区间'
          : gap > 0 ? '与生理年龄差距 +' + gap + ' 个月'
          : gap === 0 ? '与生理年龄持平' : '与生理年龄差距 −' + Math.abs(gap) + ' 个月';
        return { k: k, age: (ge ? '≥' : '') + n, gap: gap, note: note, raw: n, ge: ge };
      }).filter(Boolean);
      var declared = numOf(f['发展年龄（月）']);
      var devAge = declared;
      if (devAge === null) {
        var sum = 0, cnt = 0;
        domains.forEach(function (d) { sum += d.raw; cnt++; });
        devAge = cnt ? Math.round(sum / cnt) : 0;
      }
      var sev = numOf(f['病理行为重度项数']) || 0;
      var mil = numOf(f['病理行为轻度项数']) || 0;
      var behaviors = (sev || mil)
        ? [{ k: '病理行为合计', severe: sev, mild: mil, normal: '—' }] : [];
      return {
        file: meta.file, pages: meta.pages, date: f['评估日期'] || '',
        total: f['功能发展总分'] || '—', devAge: devAge, chronoAge: chrono,
        domains: domains, behaviors: behaviors, estimated: declared === null
      };
    }
    if (type === 'vbmapp') {
      var milestones = VB_KEYS.map(function (k) {
        var v = f[k]; if (!v) return null;
        var m = String(v).match(/第\s*(\d)\s*阶段/);
        return { k: k, s: m ? m[1] : String(v).slice(0, 3), full: v };
      }).filter(Boolean);
      var split = function (s) {
        return String(s || '').split(/[、,，;；]/).map(function (x) { return x.trim(); }).filter(Boolean);
      };
      return {
        file: meta.file, pages: meta.pages, date: f['评估日期'] || '',
        overall: f['总体阶段'] || '—',
        milestones: milestones,
        barriers: {
          severe: split(f['障碍评估 · 中重度项']).map(function (k) { return { k: k, lv: '中重度' }; }),
          moderate: split(f['障碍评估 · 中度项']).map(function (k) { return { k: k }; }),
          mild: []
        },
        transition: []
      };
    }
    if (type === 'sensory') {
      var items = String(f['主要表现'] || '').split(/[、,，;；]/).map(function (x) { return x.trim(); }).filter(Boolean);
      return {
        file: meta.file, pages: meta.pages, date: f['评估日期'] || '', scanned: false,
        groups: SENS_KEYS.map(function (k) {
          return { k: k, level: f[k] || '待核对', items: k === '感觉调节' ? items : [] };
        }),
        note: '三组评定已由教师核对并确认，可进入能力指数与目标排序。'
      };
    }
    return { file: meta.file, pages: meta.pages, date: f['评估日期'] || '' };
  }

  /* ---------- 解析结果 → 六维建议（只给建议，不自动改分数） ---------- */
  var STAGE_VAL = { '1': 35, '2': 50, '3': 68 };
  var LV_ADJ = { '正常': 6, '一般问题': 0, '明显问题': -10 };
  var LV_MID = { '相对优势': 80, '一般': 65, '落后': 50, '显著落后': 38 };

  function levelOf(v) {
    return v >= 75 ? '相对优势' : v >= 60 ? '一般' : v >= 50 ? '落后' : '显著落后';
  }

  function suggestScores(c) {
    var rep = (c && c.data.reports) || {};
    var pep = rep.pep3 && rep.pep3.structured;
    var vb = rep.vbmapp && rep.vbmapp.structured;
    var sen = rep.sensory && rep.sensory.structured;
    if (!pep && !vb && !sen) return [];
    var pepMap = {};
    (pep ? pep.domains || [] : []).forEach(function (d) { pepMap[d.k] = d; });
    var vbMap = {};
    (vb ? vb.milestones || [] : []).forEach(function (d) { vbMap[d.k] = d; });
    var senMap = {};
    (sen ? sen.groups || [] : []).forEach(function (g) { senMap[g.k] = g.level; });

    return R.ANALYZE_MAP.map(function (m) {
      var basis = [], parts = [], adj = 0, adjN = 0;
      (m.pep3 || []).forEach(function (k) {
        var d = pepMap[k]; if (!d) return;
        var gap = d.ge ? 10 : d.gap;
        var v = 60 + gap * 2;
        if (v > 95) v = 95; if (v < 15) v = 15;
        parts.push(v);
        basis.push('PEP-3 ' + k + '：' + (d.ge ? '≥' + d.raw + ' 个月（达参考高点）' : d.raw + ' 个月（' + (d.gap > 0 ? '+' : '') + d.gap + '）'));
      });
      (m.vbmapp || []).forEach(function (k) {
        var d = vbMap[k]; if (!d) return;
        var v = STAGE_VAL[d.s];
        if (v === undefined) return;
        parts.push(v);
        basis.push('VB-MAPP ' + k + '：第 ' + d.s + ' 阶段');
      });
      (m.sensory || []).forEach(function (k) {
        var lv = senMap[k]; if (!lv || lv === '待核对') return;
        if (LV_ADJ[lv] === undefined) return;
        adj += LV_ADJ[lv]; adjN++;
        basis.push('感统 ' + k + '：' + lv);
      });
      if (!parts.length) {
        return { code: m.code, name: R.domainName(m.code), short: R.domainShort(m.code),
          hasBasis: false, basis: basis, level: '数据不足', score: 0,
          cur: (profileScore(c, m.code) || 0) };
      }
      var base = parts.reduce(function (a, b) { return a + b; }, 0) / parts.length;
      if (adjN) base += adj / adjN;
      base = Math.round(Math.max(10, Math.min(95, base)));
      var lv = levelOf(base);
      return {
        code: m.code, name: R.domainName(m.code), short: R.domainShort(m.code),
        hasBasis: true, basis: basis, level: lv, score: LV_MID[lv], raw: base,
        cur: (profileScore(c, m.code) || 0)
      };
    });
  }

  function profileScore(c, code) {
    var p = ((c && c.data.domainProfile) || []).filter(function (d) { return d.code === code; })[0];
    return p ? p.score : 0;
  }

  function reportType(key) {
    return R.REPORT_TYPES.filter(function (x) { return x.key === key; })[0] ||
      { key: key, name: key, cat: '其他', idx: '·' };
  }

  function buildRep(type, fileMeta, fields, extra) {
    var T = reportType(type);
    var rep = {
      type: type, name: T.name, file: fileMeta.file, size: fileMeta.size || '',
      pages: fileMeta.pages || 1, uploadedAt: stamp(),
      date: fields['评估日期'] || fields['就诊日期'] || today(),
      status: 'confirmed', fields: clone(fields),
      structured: buildStructured(type, fields, { file: fileMeta.file, pages: fileMeta.pages })
    };
    /* 解析来源：原文摘录 + 字段依据 + 解析方式（pdf / docx / text / paste / manual） */
    if (extra) {
      if (extra.text) rep.text = String(extra.text).slice(0, 6000);
      if (extra.ev) rep.ev = extra.ev;
      if (extra.conf) rep.conf = extra.conf;
      if (extra.kind) rep.kind = extra.kind;
      if (extra.ocrConf) rep.ocrConf = extra.ocrConf;
      if (extra.chars) rep.chars = extra.chars;
    }
    return rep;
  }

  R.store = {
    fetchFromBackend: fetchFromBackend,
    syncToBackend: syncToBackend,
    get: function () { return state || mem; },
    save: function () { persist(); },
    reset: function () {
      state = seed();
      mount(state.currentId);
      persist();
    },

    /* ---------- 跨电脑迁移：导入全量数据 ----------
       本系统是纯静态网页，数据只存在「当前电脑 + 当前浏览器」的 localStorage 里，
       换电脑不会跟着文件走。导出的 JSON 需经「导入」写回另一台电脑。
       checkImport 只校验不落盘（确认前不覆盖本机数据）；commitImport 写入后由调用方刷新页面，
       重走启动初始化与迁移链（profileRev 等），旧版本导出的备份也能安全导入。 */
    checkImport: function (obj) {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj))
        return { ok: false, msg: '文件内容不是有效的数据备份' };
      if (!Array.isArray(obj.cases) || !obj.cases.length)
        return { ok: false, msg: '文件里没有儿童档案（cases 为空）。请选择本系统「导出全量数据」生成的 rongiep_state_日期.json' };
      var bad = obj.cases.some(function (c) { return !c || !c.meta || !c.data; });
      if (bad) return { ok: false, msg: '档案结构不完整，可能选错了文件' };
      return {
        ok: true, n: obj.cases.length,
        names: obj.cases.map(function (c) { return c.meta.alias || c.meta.name || c.id; }),
        exportedAt: obj.savedAt || ''
      };
    },
    commitImport: function (obj) {
      try { localStorage.setItem(KEY, JSON.stringify(obj)); return true; }
      catch (e) { return false; }
    },

    /* ---------- 档案 ---------- */
    cases: caseList,
    current: function () { return currentCase().meta; },
    currentId: function () { return state.currentId; },
    completenessOf: completenessOf,
    switchCase: function (id) {
      if (!state.cases.some(function (c) { return c.id === id; })) return false;
      mount(id);
      persist();
      return true;
    },
    /* 删除档案：整份个案（基础信息 / 评估 / 观察 / 目标 / 会议 / 成稿）从本机移除；至少保留 1 份 */
    delCase: function (id) {
      if (state.cases.length <= 1) return { ok: false, msg: '至少要保留 1 份档案，不能删除' };
      var c = state.cases.filter(function (x) { return x.id === id; })[0];
      if (!c) return { ok: false, msg: '档案不存在或已删除' };
      state.cases = state.cases.filter(function (x) { return x.id !== id; });
      if (state.currentId === id) mount(state.cases[0].id);
      state.logs.unshift({
        t: stamp(), who: R.store.role().short, act: '删除档案',
        detail: '已删除「' + c.alias + '」（' + id + '）的全部数据：基础信息、评估报告、观察表、目标、会议记录与成稿'
      });
      persist();
      return { ok: true, name: c.alias, id: id };
    },
    /* 新建：只建骨架，内容由用户逐块填 */
    createCase: function (f) {
      var meta = {
        id: f.id, alias: f.alias + '（化名）', name: f.alias, gender: f.gender || '男',
        age: ageText(f.birthday, today()), birthday: f.birthday || '',
        cls: f.cls || '融合中班',
        enrollDate: f.enrollDate || today(), planStart: f.planStart || (today().slice(0, 7)),
        planEnd: f.planEnd || '', iepDate: today(),
        stage: '数据归集', stageIdx: 1,
        dx: f.dx || '待补充',
        team: f.team && f.team.length ? f.team
          : ['园所行政领导', '班级教师', '融合教师', '小组教师', '家长'],
        materialStatus: {
          medical: { state: f.hasMedical ? 'done' : 'none',
            note: f.hasMedical ? '已登记（拍照 / PDF），字段待校对' : '待上传医学诊断与复诊记录' },
          assess: { state: 'none',
            parts: { pep3: !!f.hasPep3, vbmapp: !!f.hasVbmapp, sensory: !!f.hasSensory },
            note: '待上传 PEP-3 / VB-MAPP / 感统评估' },
          teacher: { state: 'none', note: '待回收教师观察表' },
          parent: { state: 'none', note: '待家长提交居家观察表' }
        },
        materials: [],
        gaps: [{ key: 'data', name: '评估与观察尚未归集',
          why: '新建档案只有档案头，还没有评估报告与观察记录，无法生成能力指数与目标建议。',
          act: '在档案页「评估报告 / 观察记录」两块先手工录入关键结论，或到数据归集台批量上传。' }]
      };
      var reports = emptyReports(), data_sensory_fixed = false;
      Object.keys(f.reports || {}).forEach(function (k) {
        var p = f.reports[k];
        if (!p) return;
        reports[k] = (p.pendingMeta && p.pendingFields)
          ? buildRep(k, p.pendingMeta, p.pendingFields, p.pendingExtra) : p;
      });
      /* 上传时填的报告同步进材料状态与完整度 */
      ['medical', 'pep3', 'vbmapp', 'sensory'].forEach(function (k) {
        if (!reports[k]) return;
        if (k === 'medical') {
          meta.materialStatus.medical.state = 'done';
          meta.materialStatus.medical.note = '已上传并解析确认：' + reports[k].file;
          if (reports[k].structured.dx && (!meta.dx || meta.dx === '待补充')) meta.dx = reports[k].structured.dx;
        } else {
          meta.materialStatus.assess.parts[k] = true;
        }
      });
      var pn = 0;
      if (meta.materialStatus.assess.parts.pep3) pn++;
      if (meta.materialStatus.assess.parts.vbmapp) pn++;
      if (meta.materialStatus.assess.parts.sensory) pn++;
      if (pn) {
        meta.materialStatus.assess.state = pn === 3 ? 'done' : 'part';
        meta.materialStatus.assess.note = '已上传并解析 ' + pn + ' / 3 份评估报告';
      }
      if (reports.sensory) {
        data_sensory_fixed = (reports.sensory.structured.groups || [])
          .every(function (g) { return g.level && g.level !== '待核对'; });
      }

      var prof = R.DOMAINS.map(function (d) {
        var v = (f.scores && f.scores[d.code]) || 0;
        return {
          code: d.code, level: v ? (v >= 75 ? '相对优势' : v >= 60 ? '一般' : v >= 50 ? '落后' : '显著落后') : '数据不足',
          score: v, baseline: v, target: v,
          summary: v ? '由教师初判录入，尚未与评估报告交叉验证。' : '尚无数据。',
          strengths: (f.strengths && f.strengths[d.code]) ? toParas(f.strengths[d.code]) : [],
          needs: (f.needs && f.needs[d.code]) ? toParas(f.needs[d.code]) : [],
          evid: []
        };
      });
      var data = {
        domainProfile: prof,
        familyProfile: { level: '背景', strengths: (f.famStrengths || ''), needs: (f.famNeeds || ''), evid: [] },
        goals: [], meetings: [], progress: [],
        observation: { group: {}, fusion: {}, parent: {} },
        obsFilled: { group: false, fusion: false, parent: false },
        obsFiles: { group: null, fusion: null, parent: null },
        doc: { version: 'v1.0', status: 'draft', effectiveBy: '', effectiveAt: '', parentShared: false },
        reports: reports,
        sensoryFixed: data_sensory_fixed,
        todos: [
          { id: 'n1', text: '把 ' + meta.alias + ' 的医学诊断与评估报告上传，完成字段校对', who: '融合教师 李老师', due: '1 周内', done: false, urgent: true },
          { id: 'n2', text: '回收教师观察表与家长居家观察表', who: '班级教师', due: '1 周内', done: false, urgent: true }
        ],
        risk: { flagged: false, reason: '', handled: false },
        logs: [{ t: stamp(), who: '融合教师 李老师', act: '建档',
          detail: '创建个案档案（园内编号 ' + meta.id + '），班级：' + meta.cls }]
      };
      /* 建档时已上传的报告：登记进材料清单 */
      ['medical', 'pep3', 'vbmapp', 'sensory'].forEach(function (k) {
        if (!reports[k]) return;
        var T = reportType(k);
        meta.materials.push({
          rkey: k, name: reports[k].file, cat: T.cat, state: '已解析 · 已确认',
          todo: '建档时上传并确认解析；可在「评估报告」查看字段'
        });
        data.logs.unshift({
          t: stamp(), who: '融合教师 李老师', act: '上传并解析',
          detail: T.name + '：' + reports[k].file + '（建档时上传）'
        });
      });
      var nc = { id: meta.id, meta: meta, data: data };
      state.cases.push(nc);
      mount(meta.id);
      syncCase(nc);
      persist();
      return meta;
    },
    /* 编辑档案头 / 六维初判 / 材料状态 */
    updateCase: function (f) {
      var c = currentCase();
      var m = c.meta;
      ['alias', 'gender', 'cls', 'birthday', 'enrollDate', 'iepDate', 'planStart', 'planEnd', 'dx'].forEach(function (k) {
        if (f[k] !== undefined) m[k] = f[k];
      });
      if (f.alias && f.alias.indexOf('化名') < 0) m.alias = f.alias + '（化名）';
      if (f.alias) m.name = f.alias;
      if (f.birthday) { m.age = ageText(f.birthday, today()); }
      if (f.team) m.team = f.team;

      /* 材料勾选 → 完整度联动 */
      var ms = m.materialStatus;
      if (f.hasMedical !== undefined) {
        ms.medical.state = f.hasMedical ? (ms.medical.state === 'done' ? 'done' : 'part') : 'none';
        ms.medical.note = f.hasMedical ? (ms.medical.note || '已登记，字段待校对') : '待上传医学诊断与复诊记录';
      }
      if (f.hasPep3 !== undefined) ms.assess.parts.pep3 = !!f.hasPep3;
      if (f.hasVbmapp !== undefined) ms.assess.parts.vbmapp = !!f.hasVbmapp;
      if (f.hasSensory !== undefined) ms.assess.parts.sensory = !!f.hasSensory;
      var pn = 0;
      if (ms.assess.parts.pep3) pn++;
      if (ms.assess.parts.vbmapp) pn++;
      if (ms.assess.parts.sensory) pn++;
      ms.assess.state = pn === 3 ? 'done' : pn > 0 ? 'part' : 'none';

      /* 六维初判 */
      if (f.scores) {
        (c.data.domainProfile || []).forEach(function (d) {
          var v = parseInt(f.scores[d.code], 10);
          if (!isNaN(v) && v > 0) {
            d.score = v;
            if (!d.baseline) d.baseline = v;
            d.level = v >= 75 ? '相对优势' : v >= 60 ? '一般' : v >= 50 ? '落后' : '显著落后';
            d.summary = d.evid && d.evid.length ? d.summary : '由教师初判录入（0–100，仅用于同案时间序列比较），尚未与评估报告交叉验证。';
          }
          /* 表单里这一栏是单行摘要：没改动就不覆盖原稿的分段内容 */
          if (f.strengths && f.strengths[d.code]) {
            var curS = (d.strengths || []).join('');
            var inS = String(f.strengths[d.code]).trim();
            if (inS && flat(inS) !== flat(curS) && flat(inS) !== flat((d.strengths || [])[0] || '')) {
              d.strengths = toParas(inS);
            }
          }
          if (f.needs && f.needs[d.code]) {
            var curN = (d.needs || []).join('');
            var inN = String(f.needs[d.code]).trim();
            if (inN && flat(inN) !== flat(curN) && flat(inN) !== flat((d.needs || [])[0] || '')) {
              d.needs = toParas(inN);
            }
          }
        });
      }
      if (f.famStrengths !== undefined) c.data.familyProfile.strengths = f.famStrengths;
      if (f.famNeeds !== undefined) c.data.familyProfile.needs = f.famNeeds;

      /* 阶段推进 */
      var comp = completenessOf(m, c.data);
      if (comp === 0) { m.stage = '数据归集'; m.stageIdx = 1; }
      else if (!(c.data.goals || []).length) { m.stage = '数据归集 / 待生成草案'; m.stageIdx = 2; }
      else { m.stageIdx = Math.max(m.stageIdx, 3); }
      /* 数据缺口：一旦有了任何材料，就不再提示"只有档案头" */
      m.gaps = (m.gaps || []).filter(function (g) { return g.key !== 'data' || comp === 0; });

      c.data.logs.unshift({ t: stamp(), who: R.store.role().short, act: '更新档案', detail: '档案信息与材料状态已更新（完整度 ' + comp + '%）' });
      persist();
      return m;
    },
    /* ---------- 报告：用户上传 → 解析 → 确认 → 入档 ---------- */
    reports: function () { return currentCase().data.reports || {}; },
    report: function (type) {
      var r = currentCase().data.reports || {};
      return r[type] || null;
    },
    saveReport: function (type, fileMeta, fields, extra) {
      var c = currentCase();
      var rep = buildRep(type, fileMeta, fields, extra);
      var st = rep.structured;
      c.data.reports[type] = rep;
      var ms = c.meta.materialStatus;
      if (type === 'medical') {
        ms.medical.state = 'done';
        ms.medical.note = '已上传并解析确认：' + fileMeta.file;
        if (st.dx && (!c.meta.dx || c.meta.dx === '待补充')) c.meta.dx = st.dx;
      } else {
        ms.assess.parts[type] = true;
        var n = 0;
        ['pep3', 'vbmapp', 'sensory'].forEach(function (k) { if (ms.assess.parts[k]) n++; });
        ms.assess.state = n === 3 ? 'done' : 'part';
        ms.assess.note = '已上传并解析 ' + n + ' / 3 份评估报告';
      }
      if (type === 'sensory') {
        var ok = (st.groups || []).every(function (g) { return g.level && g.level !== '待核对'; });
        c.data.sensoryFixed = !!ok;
        if (c.id === state.currentId) state.sensoryFixed = !!ok;
      }
      var T = reportType(type);
      var filled = Object.keys(fields).filter(function (k) { return String(fields[k] || '').trim(); }).length;
      c.meta.materials = (c.meta.materials || []).filter(function (m) { return m.rkey !== type; });
      var sensPending = type === 'sensory' && !c.data.sensoryFixed;
      c.meta.materials.push({
        rkey: type, name: fileMeta.file, cat: T.cat,
        state: sensPending ? '已解析 · 待核对' : '已解析 · 已确认',
        todo: sensPending
          ? '扫描件三组评定等级待人工核对，核对后才进入能力指数'
          : '解析字段 ' + filled + ' 项已入档；可在「评估报告」查看原文与字段'
      });
      c.data.logs.unshift({
        t: stamp(), who: R.store.role().short, act: '上传并解析',
        detail: T.name + '：' + fileMeta.file + '（' + filled + ' 个字段确认入档）'
      });
      /* 有材料后不再提示"只有档案头" */
      m_gaps(c);
      persist();
      return rep;
    },
    removeReport: function (type) {
      var c = currentCase();
      if (!c.data.reports[type]) return;
      var name = c.data.reports[type].file;
      c.data.reports[type] = null;
      var ms = c.meta.materialStatus;
      if (type === 'medical') {
        ms.medical.state = 'none';
        ms.medical.note = '待上传医学诊断与复诊记录';
      } else {
        ms.assess.parts[type] = false;
        var n = 0;
        ['pep3', 'vbmapp', 'sensory'].forEach(function (k) { if (ms.assess.parts[k]) n++; });
        ms.assess.state = n === 3 ? 'done' : n > 0 ? 'part' : 'none';
        ms.assess.note = n ? '已上传并解析 ' + n + ' / 3 份评估报告' : '待上传 PEP-3 / VB-MAPP / 感统评估';
      }
      if (type === 'sensory') {
        c.data.sensoryFixed = false;
        if (c.id === state.currentId) state.sensoryFixed = false;
      }
      c.meta.materials = (c.meta.materials || []).filter(function (m) { return m.rkey !== type; });
      c.data.logs.unshift({ t: stamp(), who: R.store.role().short, act: '移除报告', detail: '已移除：' + name });
      m_gaps(c);
      persist();
    },
    /* 解析结果 → 六维建议（只读，不写库） */
    suggest: function () { return suggestScores(currentCase()); },
    /* 采纳建议：'empty' 只补空缺维度（默认，保护教师已定的分数）；'all' 全部按解析结果重算 */
    applySuggest: function (mode) {
      var c = currentCase();
      var rows = suggestScores(c).filter(function (r) { return r.hasBasis; });
      var n = 0;
      rows.forEach(function (r) {
        var p = (c.data.domainProfile || []).filter(function (d) { return d.code === r.code; })[0];
        if (!p) return;
        if (mode !== 'all' && (p.score || 0) > 0) return;
        p.score = r.score;
        p.level = r.level;
        if (!p.baseline) p.baseline = r.score;
        if (!p.target) p.target = Math.min(100, r.score + 15);
        if (p.summary && p.summary.indexOf('尚无数据') === 0) {
          p.summary = '由上传报告解析后自动推算：' + r.basis.slice(0, 2).join('；') + '。';
        }
        n++;
      });
      c.data.logs.unshift({
        t: stamp(), who: R.store.role().short, act: '按解析结果更新六维',
        detail: (mode === 'all' ? '全部维度按解析结果重算，' : '仅补无数据的维度，') + '共更新 ' + n + ' 个维度'
      });
      m_gaps(c);
      persist();
      return n;
    },

    /* 追加一条材料登记（档案页上传占位） */
    addMaterial: function (name, cat) {
      var m = currentCase().meta;
      m.materials = m.materials || [];
      m.materials.push({ name: name, cat: cat, state: '已登记', todo: '待结构化：解析关键字段并标出缺口' });
      currentCase().data.logs.unshift({ t: stamp(), who: R.store.role().short, act: '登记材料', detail: '登记「' + name + '」（' + cat + '）' });
      persist();
    },

    /* ---------- 日志 ---------- */
    log: function (who, act, detail) {
      state.logs.unshift({ t: stamp(), who: who, act: act, detail: detail });
      if (state.logs.length > 200) state.logs.length = 200;
      persist();
    },
    /* ---------- 角色 ---------- */
    setRole: function (k) { state.role = k; persist(); },
    role: function () {
      return R.ROLES.filter(function (r) { return r.key === state.role; })[0] || R.ROLES[0];
    },
    /* ---------- 目标 ---------- */
    goal: function (id) {
      var hit = state.goals.filter(function (g) { return g.id === id; })[0];
      if (hit) return hit;
      /* 编号规则：同一维度只有 1 条时不带 -1。决议里可能记的是旧编号，这里做一次兜底 */
      return state.goals.filter(function (g) {
        return g.id === id + '-1' || (/-1$/.test(id) && g.id === id.replace(/-1$/, ''));
      })[0];
    },
    setGoalStatus: function (id, st, reason) {
      var g = this.goal(id);
      if (!g) return;
      g.status = st;
      if (st === 'dropped') g.dropReason = reason || '';
      if (st !== 'dropped') g.dropReason = '';
      persist();
    },
    updateGoal: function (id, patch) {
      var g = this.goal(id);
      if (!g) return;
      /* 改到成稿相关字段时清掉整格快照，成稿回退为按最新数据组装 */
      var LIVE = ['text', 'fusion', 'group', 'integrated', 'shorts', 'school', 'home'];
      for (var pk in patch) {
        if (LIVE.indexOf(pk) >= 0 && g.shortDetail) { delete g.shortDetail; break; }
      }
      for (var k in patch) g[k] = patch[k];
      g.edited = true;
      persist();
    },
    addGoal: function (g) { state.goals.push(g); persist(); },
    /* 能力分析某一格：会议里"这条优势再写清楚点"直接写回档案（成稿第二章随之更新） */
    setDomainCell: function (code, side, text, mode) {
      var d = (currentCase().data.domainProfile || []).filter(function (x) { return x.code === code; })[0];
      if (!d) return false;
      var key = side === 'strength' ? 'strengths' : 'needs';
      var arr = (d[key] || []).slice();
      text = String(text || '').trim();
      if (!text) return false;
      if (mode === 'replace') {
        /* 一栏往往是多段：有换行就按换行分段（原稿一个自然段 = 一条），
           没有换行的老写法才按「；」拆，避免把段内分号误当成新条目 */
        var parts = /[\n\r]/.test(text) ? String(text).split(/[\n\r]+/) : String(text).split(/[；;]+/);
        arr = parts.map(function (t) { return t.trim(); })
          .filter(function (t) { return t; });
      }
      else if (arr.indexOf(text) < 0) arr.push(text);
      d[key] = arr;
      persist();
      return true;
    },
    /* 家庭养育情况（成稿能力分析表最后一行，纯字符串、\n 分段） */
    setFamilyCell: function (field, text, mode) {
      var fam = currentCase().data.familyProfile;
      if (!fam) return false;
      var key = field === 'strength' ? 'strengths' : 'needs';
      text = String(text || '').trim();
      if (!text) return false;
      if (mode === 'replace') {
        fam[key] = text;
      } else {
        var cur = String(fam[key] || '').trim();
        fam[key] = cur ? cur + '\n' + text : text;
      }
      persist();
      return true;
    },
    /* 短期目标：追加一条（同时清掉整格快照，成稿按最新数据重排） */
    addShort: function (id, text, crit) {
      var g = this.goal(id);
      if (!g || !text) return false;
      g.shorts = (g.shorts || []).slice();
      g.shorts.push({ t: text, c: crit || '' });
      if (g.shortDetail) delete g.shortDetail;
      g.edited = true;
      persist();
      return true;
    },
    /* ---------- 观察表（三张：group / fusion / parent） ---------- */
    setObs: function (who, dim, field, val) {
      state.observation[who] = state.observation[who] || {};
      state.observation[who][dim] = state.observation[who][dim] || { strength: '', need: '' };
      state.observation[who][dim][field] = val;
      persist();
    },
    /* 整张表写入（上传解析后一次性落库） */
    setObsAll: function (who, obj) {
      state.observation[who] = obj || {};
      persist();
    },
    /* 记录来源文件：上传的原件 / 手工填报 */
    setObsFile: function (who, meta) {
      state.obsFiles = state.obsFiles || { group: null, fusion: null, parent: null };
      state.obsFiles[who] = meta || null;
      persist();
    },
    obsFile: function (who) {
      return (state.obsFiles || {})[who] || null;
    },
    markObsFilled: function (who, flag) {
      state.obsFilled[who] = !!flag;
      state.obsFilled.teacher = !!(state.obsFilled.group || state.obsFilled.fusion);
      var T = R.OBS_TYPES[who];
      var src = T ? T.src : (who === 'parent' ? 'parent' : 'teacher');
      var of = state.obsFilled;
      if (!state.materials[src]) state.materials[src] = { state: 'none', note: '' };
      if (src === 'teacher') {
        var n = (of.group ? 1 : 0) + (of.fusion ? 1 : 0);
        state.materials[src].state = n === 2 ? 'done' : n === 1 ? 'part' : 'none';
        state.materials[src].note = n === 2
          ? '小组班 + 融合班观察表 · 两张都已回收（含时间戳与填写人）'
          : n === 1
            ? (of.group ? '小组班观察表已回收 · 还差融合班级教师日常观察表'
              : '融合班观察表已回收 · 还差小组班级教师日常观察表')
            : '两张教师观察表都还没回收';
      } else {
        state.materials[src].state = flag ? 'done' : 'none';
        state.materials[src].note = flag
          ? '居家观察表 · 家长已提交（含时间戳与填写人）'
          : '居家观察表未提交';
      }
      persist();
    },
    /* ---------- 权重 ---------- */
    setWeight: function (key, val) { state.weights[key] = val; persist(); },
    setEnabled: function (key, val) { state.enabled[key] = val; persist(); },
    /* ---------- 会议 ---------- */
    meeting: function () { return state.meetings[state.meetings.length - 1]; },
    applyMeeting: function () {
      var self = this;
      var m = this.meeting();
      if (!m) return;
      m.applied = true;
      m.appliedBy = '融合教师';
      m.appliedAt = '2026-11-02';
      state.doc.version = 'v2.0';
      (m.decisions || []).forEach(function (d) {
        var g = self.goal(d.goalId);
        if (!g) return;
        if (d.action === 'modify') { g.status = 'adopted'; g.text = d.text; g.meetingTag = '会议调整'; delete g.shortDetail; }
        if (d.action === 'add') { g.status = 'adopted'; g.text = d.text; g.meetingTag = '会议新增'; }
        if (d.action === 'keep') { g.status = 'adopted'; g.meetingTag = '会议保留'; }
        if (d.action === 'drop') { g.status = 'dropped'; g.meetingTag = '会议删除'; g.dropReason = d.basis; }
      });
      persist();
    },
    createMeeting: function () {
      var n = state.meetings.length + 1;
      state.meetings.push({
        id: n, date: today(), place: '资源教室', host: '融合教师 李老师',
        attend: ['园长', '融合教师', '班级教师', '小组教师', '家长'],
        parentOpinion: '', expertOpinion: '', minutes: '', decisions: []
      });
      persist();
      return this.meeting();
    },
    addDecision: function (d) {
      if (!this.meeting()) this.createMeeting();
      this.meeting().decisions.push(d);
      persist();
    },
    removeDecision: function (i) {
      if (!this.meeting()) return;
      this.meeting().decisions.splice(i, 1);
      persist();
    },
    /* ---------- 成稿 ---------- */
    /* 会议补充段落：不覆盖系统生成的章节，只在章节末尾追加，保证数据变化时正文仍跟着更新 */
    addendum: function (sec) {
      state.docAddenda = state.docAddenda || {};
      return state.docAddenda[sec] || [];
    },
    pushAddendum: function (sec, text, src) {
      state.docAddenda = state.docAddenda || {};
      state.docAddenda[sec] = state.docAddenda[sec] || [];
      state.docAddenda[sec].push({ t: stamp(), text: text, src: src || '会议建议', id: 'a' + Date.now() + Math.floor(Math.random() * 100) });
      persist();
    },
    removeAddendum: function (sec, id) {
      state.docAddenda = state.docAddenda || {};
      state.docAddenda[sec] = (state.docAddenda[sec] || []).filter(function (x) { return x.id !== id; });
      persist();
    },
    setEffective: function (by) {
      state.doc.status = 'effective';
      state.doc.effectiveBy = by;
      state.doc.effectiveAt = today();
      persist();
      if (!isStaticHost) {
        try {
          var curCode = toCaseCode(state.currentId);
          fetch(API_BASE + '/cases/' + curCode + '/document/effective', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ effectiveBy: by })
          }).then(function(r){return r.json();})
            .then(function(d){console.log('[Java API] 成稿生效状态已成功写入 MySQL (/cases/' + curCode + '/document/effective):', d);})
            .catch(function(e){console.warn('[Java API] 生效网络请求异常:', e);});
        } catch(e){}
      }
    },
    /* ---------- 待办 ---------- */
    toggleTodo: function (id) {
      var t = state.todos.filter(function (x) { return x.id === id; })[0];
      if (t) { t.done = !t.done; persist(); }
    },
    addTodo: function (text, who, due, urgent) {
      state.todos.push({ id: 't' + Date.now(), text: text, who: who, due: due, done: false, urgent: !!urgent });
      persist();
    },
    /* ---------- 进度 ---------- */
    addProgress: function (rec) { state.progress.push(rec); persist(); },
    /* ---------- 风险 ---------- */
    setRisk: function (flag, reason) {
      state.risk = { flagged: flag, reason: reason || '', handled: false };
      persist();
    },
    handleRisk: function () { state.risk.handled = true; persist(); }
  };

})(window.RIEP);
