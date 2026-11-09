/* ============================================================
   gen.js · 由数据生成目标建议
   输入：六维推算结果（E.compute）+ 医学/评估/观察原文
   输出：候选目标（每条都带 genBasis 逐项溯源 + 六因子为什么这么给分）
   原则：不编数据。目标文本是"建议"，通过标准与依据必须能追到已经入档的字段。
   ============================================================ */
(function (R) {
  'use strict';
  var E = R.engine;

  /* ---------- 维度关键词：判断"哪份材料提到了这个维度" ---------- */
  var KW = {
    YD: /运动|粗大|精细|平衡|动作|姿势|前庭|本体|肌张力|协调|单脚|跳|跑|捏|串珠|涂色|手眼/,
    YY: /语言|言语|表达|口语|命名|提要求|发音|沟通|对话|代词|仿说|句式|听者/,
    SJ: /社交|交往|同伴|互动|眼神|目光|对视|回应|共同注意|孤独症|谱系|小朋友|邀请|轮流/,
    ZL: /自理|进食|咀嚼|吞咽|穿衣|穿脱|如厕|洗手|漱口|自我照顾|挑食|进餐|扣|拉链|整理/,
    RZ: /认知|配对|拼图|点数|数概念|注意|学习|模仿|知觉|分类|颜色|形状|因果|阅读|书写/,
    QX: /情绪|行为|发脾气|急躁|焦虑|攻击|自伤|调节|感觉|听觉|触觉|前庭|障碍|逃避|哭闹|过渡/
  };

  /* 供「会议建议解析」复用的维度关键词 */
  R.GOAL_KW = KW;

  /* 目标文本模板：按"最弱的那一项"选，选不到就按顺序取第一个 */
  var TPL = {
    YD: [
      { key: 'gross', match: /粗大动作|姿势平衡|前庭觉|本体觉|动作计划/,
        topic: '大运动平衡与动作连续性',
        text: '在户外集体游戏与早操律动中，单脚独立站≥5 秒，双脚连续向前跳 3 次且落地基本稳定',
        criteria: '单脚站≥5 秒（3 次尝试中 2 次成功）；连续跳 3 次不跌倒',
        fusion: '在班级户外游戏与早操律动中，能沿地面平衡线走 4–5 步保持身体稳定，连续完成 4 个成套动作，能跨过 10cm 高的障碍块。',
        group: '单脚稳定站 8–10 秒；连续向前跳 5–6 次落地稳定；抛接球时提前看球预判落点。',
        integrated: '单脚独立站≥5 秒、双脚连续向前跳 3 次落地稳定；集体律动中能跟随完成整套动作不中断。',
        shorts: [
          { t: '在少量口头提示下，沿地面直线向前走 4–5 步，身体不出现大幅倾斜', c: '4 次中 3 次' },
          { t: '跟随集体做操或律动时，连续完成 4 个连贯动作', c: '连续 4 个动作不断' },
          { t: '在软垫上原地站稳并抬起一只脚，保持 3 秒', c: '5 次中 3 次' }
        ],
        school: ['材料差异化投放：与班级同款器材，只降低高度与距离（低障碍、宽平衡线）',
                 '生活环节渗透：午睡穿脱、整理玩具时练蹲起与搬运',
                 '同伴支持：安排动作稳定的同伴做自然示范，用班级统一奖励机制'],
        home: ['客厅地面贴胶带当平衡线，每天走 2 次', '软垫上玩原地站稳、抬脚、单脚数到 3', '跟着儿歌做简单连贯动作（亲子律动）'],
        measure: ['观察', '操作'], frequency: '每周 2 次', owner: '小组教师 / 班级教师',
        duty: [['小组教师', '小组课，每周 3 次'], ['班级教师', '户外与生活环节，每天'], ['感统教师', '前庭本体活动，每周 2 次'], ['家长', '家庭任务卡']] },

      { key: 'fine', match: /精细动作|手眼协调|视觉运用|知觉/,
        topic: '精细操作与手眼协调',
        text: '在美工与加餐环节中，用三指捏取大颗粒物品连续 5 次不掉落，双手配合撕开包装纸，串 5 颗大孔珠',
        criteria: '三指捏取连续 5 次不掉落；独立撕开 2 次完整包装；串珠 5 颗不掉',
        fusion: '在美工活动中能独立完成涂色，运笔轨迹基本不越线；能自己撕开点心包装。',
        group: '完成捏、夹、拧、快速换手等手部操作组合，模仿 3 种手指形态。',
        integrated: '三指捏取稳定、双手配合完成撕、贴、扣等双手任务。',
        shorts: [
          { t: '用三指捏取大颗粒物品连续 3 次不掉落', c: '连续 3 次' },
          { t: '双手配合撕开包装纸', c: '独立 2 次' },
          { t: '把 5 颗大孔珠串进绳子', c: '5 颗不掉落' }
        ],
        school: ['美工区投放加大号夹子、贴纸、撕纸材料', '涂色先用粗短蜡笔、限定小面积，减少视线偏移', '加餐环节留给幼儿自己撕包装的机会'],
        home: ['剥果皮、撕包装、扣外套纽扣', '玩捏海绵、捏橡皮泥、夹大棉花球'],
        measure: ['操作', '观察'], frequency: '每周 1 次', owner: '小组教师',
        duty: [['小组教师', '小组课，每周 2 次'], ['班级教师', '美工区与加餐，每天'], ['家长', '家庭任务卡']] }
    ],

    YY: [
      { key: 'mand', match: /提要求|口语认知|言语语言/,
        topic: '主动提要求（跨情境）',
        text: '在点心、玩具、户外三个情境中，能用"我要＋物品/动作"主动提要求，无需手势提示',
        criteria: '每个情境连续 5 次机会中≥3 次独立说出；三情境合计≥70%',
        fusion: '在班级点心与区域活动时间，能主动向教师或同伴说出"我要××"，并等待回应。',
        group: '对 10 种高偏好物主动提要求，提示从手势→眼神→独立逐步撤除。',
        integrated: '跨三个情境主动提要求达成≥70%，被拒绝时能改用替代说法。',
        shorts: [
          { t: '点心情境中独立说出"我要饼干/我要喝水"', c: '连续 5 次中 3 次' },
          { t: '玩具情境中在 1 次手势提示下说出"我要××"', c: '4 次中 3 次' },
          { t: '被拒绝后能说出替代请求"那我要××"', c: '3 次中 2 次' }
        ],
        school: ['把高偏好物放在看得见拿不到的位置，制造提要求的机会', '成人先示范一次完整句，再等待 5 秒', '班级统一回应方式，避免"哭了就给"'],
        home: ['吃饭前让孩子自己说想吃什么', '把喜欢的玩具放高处，等孩子开口再给'],
        measure: ['观察', '频率记录'], frequency: '每周 3 次', owner: '小组教师 / 班级教师',
        duty: [['小组教师', '一对一与小组课，每周 3 次'], ['班级教师', '点心与区域活动，每天'], ['家长', '家庭任务卡']] },

      { key: 'naming', match: /命名|听者反应|语言结构|仿说/,
        topic: '命名与双词句',
        text: '在绘本与教室物品情境中，能命名 20 个常见物品与 10 个动作词，并组合出"形容词＋名词"的双词句',
        criteria: '命名正确率≥80%；双词句 10 次机会中≥6 次',
        fusion: '在集体阅读与区角活动中，能说出画面里的物品与正在发生的动作。',
        group: '命名 20 个物品 + 10 个动作，双词句由模仿过渡到自发。',
        integrated: '命名正确率≥80%，能在描述画面时自发使用双词句。',
        shorts: [
          { t: '命名 10 个常见物品（杯、鞋、球、苹果等）', c: '正确率≥80%' },
          { t: '命名 5 个动作词（跑、吃、睡、洗、跳）', c: '正确率≥80%' },
          { t: '模仿说出"红色的苹果"这类双词句', c: '10 次中 6 次' }
        ],
        school: ['绘本共读时固定问"这是什么/他在做什么"', '区角材料配图片卡，随取随命名', '把命名练习放进一日生活环节，不单独开课'],
        home: ['睡前绘本 5 分钟，只问不考', '逛超市时指认 3 样东西'],
        measure: ['口语发表', '观察'], frequency: '每周 2 次', owner: '小组教师',
        duty: [['小组教师', '小组课，每周 2 次'], ['班级教师', '绘本与区角，每天'], ['家长', '家庭任务卡']] },

      { key: 'convo', match: /对话|代词|句式/,
        topic: '一问一答与人称代词',
        text: '在一问一答中，能就"谁/在哪/做什么"回答 3 类问题，并在指认自己与他人时正确使用"我/你"',
        criteria: '三类问题各 5 次中≥4 次正确；代词正确率≥80%',
        fusion: '在晨间谈话与餐后分享中，能回答老师和同伴的简单提问。',
        group: '三类疑问句各 10 次，代词在真实情境中由手势辅助过渡到独立。',
        integrated: '三类问题回答≥80%，代词在自然对话中正确率≥80%。',
        shorts: [
          { t: '回答"谁在××"', c: '5 次中 4 次' },
          { t: '回答"在哪里"', c: '5 次中 4 次' },
          { t: '指自己说"我"、指对方说"你"', c: '正确率≥80%' }
        ],
        school: ['晨间谈话固定 3 个问题，用照片辅助', '代词练习放在真实交接情境（"这是你的书包，这是我的"）', '同伴配对问答，教师后退'],
        home: ['吃饭时聊"今天谁送你来的"', '递东西时强调"给你/给我"'],
        measure: ['口语发表', '观察'], frequency: '每周 2 次', owner: '小组教师 / 班级教师',
        duty: [['小组教师', '小组课，每周 2 次'], ['班级教师', '晨谈与生活环节，每天'], ['家长', '家庭任务卡']] }
    ],

    SJ: [
      { key: 'respond', match: /社交|对视回应|交往能力/,
        topic: '同伴呼唤的回应',
        text: '同伴呼唤名字或展示玩具时，能看向同伴并用眼神、手势或简单词回应',
        criteria: '10 次机会中≥7 次看向同伴；≥5 次给出回应',
        fusion: '在区域活动与户外游戏中，同伴招呼时能看过去并给出回应，不回避。',
        group: '先固定 2 名温和同伴，回应稳定后再扩展到第 3 名。',
        integrated: '同伴呼唤时回应≥70%，并能在回应后维持 1 个回合的互动。',
        shorts: [
          { t: '听到同伴叫名字时看向对方', c: '10 次中 7 次' },
          { t: '同伴展示玩具时看过去并点头或伸手', c: '10 次中 5 次' },
          { t: '用"嗯/给我/好"回应同伴', c: '10 次中 5 次' }
        ],
        school: ['固定 2 名同伴做搭档，缩小互动圈', '把回应练习放进取餐、排队等自然等待环节', '教师先用夸张示范引起注意，再逐步后退'],
        home: ['家里来客人时提前预告，不强迫打招呼', '和固定小伙伴每周约一次短时游戏'],
        measure: ['观察', '频率记录'], frequency: '每周 3 次', owner: '融合教师 / 班级教师',
        duty: [['融合教师', '统筹与家园沟通，每周 1 次'], ['班级教师', '区域与户外，每天'], ['小组教师', '小组课同伴配对，每周 2 次']] },

      { key: 'initiate', match: /独立游戏|集体技能|主动/,
        topic: '主动发起与轮流',
        text: '在区域游戏中，能主动走向固定同伴，递出玩具并说出"一起玩"，每周≥3 次',
        criteria: '每周≥3 次独立发起（基线由首周记录确定）；轮流 3 个回合',
        fusion: '在区域游戏时间主动邀请同伴，能在被拒绝后改找另一位同伴。',
        group: '从"递玩具"到"说出一起玩"，再到"轮流 3 个回合"分层推进。',
        integrated: '每周主动发起≥3 次，能完成 3 个回合的轮流游戏。',
        shorts: [
          { t: '走向固定同伴并递出玩具', c: '每周 2 次' },
          { t: '递玩具时说出"一起玩"', c: '每周 2 次' },
          { t: '在成人提示下轮流 3 个回合', c: '3 回合完成' }
        ],
        school: ['设置必须两人合作才能完成的材料（双人拼图、传球）', '教师先做"发起—回应"的旁白示范', '把"一起玩"做成视觉提示卡放在区角'],
        home: ['约固定小伙伴来家里玩 30 分钟', '玩传球、轮流搭积木'],
        measure: ['观察', '频率记录'], frequency: '每周 3 次', owner: '融合教师 / 小组教师',
        duty: [['融合教师', '个案主责，每周 1 次'], ['小组教师', '小组课同伴配对，每周 3 次'], ['家长', '家庭任务卡']] },

      { key: 'group', match: /集体技能/,
        topic: '集体活动参与',
        text: '在集体活动与圆圈时间，能持续参与 10 分钟，跟随 3 步以上的集体指令',
        criteria: '离座≤1 次/10 分钟；3 步指令完成≥80%',
        fusion: '在班级集体教学与圆圈时间能坐着参与，不随意离座。',
        group: '集体参与时长从 5 分钟逐步延长到 10 分钟。',
        integrated: '集体参与 10 分钟，3 步指令完成≥80%。',
        shorts: [
          { t: '圆圈时间坐住 5 分钟', c: '5 分钟不离座' },
          { t: '跟随 2 步集体指令', c: '4 次中 3 次' },
          { t: '集体中举手回应一次', c: '每天 1 次' }
        ],
        school: ['给固定座位与视觉日程表', '集体指令先叫名字再给指令', '活动前安排前庭本体活动'],
        home: ['在家玩"听指令做动作"游戏', '固定作息，减少转换带来的不安'],
        measure: ['观察'], frequency: '每周 2 次', owner: '班级教师',
        duty: [['班级教师', '集体活动，每天'], ['感统教师', '活动前准备，每周 2 次']] }
    ],

    ZL: [
      { key: 'eat', match: /生活自理|进餐|咀嚼|自我照顾/,
        topic: '咀嚼吞咽与漱口',
        text: '在午餐环节，能在"嚼完 5 口再咽"的提醒下完成咀嚼；餐后独立漱口含水吐水',
        criteria: '每餐咀嚼提醒次数由 5 次降到 2 次；漱口含水吐水 3 次中 2 次',
        fusion: '在班级午餐中能坐在座位上吃完一份，不直接吞咽、不离开座位。',
        group: '口腔功能练习从"嚼 5 口"到"自主判断该嚼了"。',
        integrated: '咀嚼提醒≤2 次/餐；漱口吐水 3 次中 2 次。',
        shorts: [
          { t: '在提醒下把一口食物嚼 5 下再咽', c: '每餐≥3 次' },
          { t: '含水在口中鼓漱 3 秒后吐出', c: '3 次中 2 次' },
          { t: '餐后自己走到盥洗台漱口', c: '连续 3 天' }
        ],
        school: ['家园用同一句提示语"嚼完 5 口再咽"', '把"嚼"做成步骤图贴在餐桌边', '先给软烂食物，逐步增加需要咀嚼的质地'],
        home: ['家里用同一句提示语，不催促', '准备需要咀嚼的食物（苹果条、玉米）'],
        measure: ['观察', '家长反馈'], frequency: '每天记录', owner: '班级教师 / 家长',
        duty: [['班级教师', '午餐环节，每天'], ['家长', '家庭同一步骤图'], ['融合教师', '家园口径统一，每周 1 次']] },

      { key: 'dress', match: /身体意识|身体基模|穿脱/,
        topic: '穿脱与精细自理',
        text: '在午睡与离园环节，能独立解开并扣上 3 个大纽扣、拉上外套拉链，并把脱下的衣物叠放归位',
        criteria: '大纽扣 3 个独立完成；拉链 2 次中 2 次；衣物归位 4 次中 3 次',
        fusion: '在午睡前后能自己穿脱外套与鞋袜，衣物放进自己的柜子。',
        group: '从大纽扣过渡到小纽扣，从拉链过渡到系扣。',
        integrated: '独立完成穿衣流程，衣物归位≥75%。',
        shorts: [
          { t: '解开 3 个大纽扣', c: '3 个独立完成' },
          { t: '拉上外套拉链并对齐起点', c: '2 次中 2 次' },
          { t: '把脱下的衣物叠好放进柜子', c: '4 次中 3 次' }
        ],
        school: ['换大纽扣的练习衣饰框', '在午睡环节留出 5 分钟自己穿脱的时间，不代劳', '步骤图贴在衣柜门内侧'],
        home: ['出门前让孩子自己扣扣子、拉拉链', '睡前自己把衣服放进洗衣篮'],
        measure: ['操作', '观察'], frequency: '每天', owner: '班级教师 / 家长',
        duty: [['班级教师', '午睡与离园，每天'], ['家长', '家庭同步，每天']] }
    ],

    RZ: [
      { key: 'count', match: /数学|认知表现|数/,
        topic: '点数与按数取物',
        text: '在区角与点心环节，能手口一致点数 5 以内物品并说出总数，按数取物 3 以内正确',
        criteria: '5 以内点数正确率≥85%；3 以内按数取物≥80%',
        fusion: '在点心分发与区角整理中能点数 5 以内的物品。',
        group: '先做 3 以内，稳定后扩到 5 以内；手口一致是关键指标。',
        integrated: '5 以内点数≥85%，3 以内按数取物≥80%。',
        shorts: [
          { t: '手口一致点数 3 以内物品', c: '正确率≥85%' },
          { t: '点数后说出总数', c: '5 次中 4 次' },
          { t: '按数取物 3 以内', c: '正确率≥80%' }
        ],
        school: ['点心分发时让幼儿数人数、数饼干', '区角投放 5 以内点数卡', '先练点数后说总数，不跳步'],
        home: ['分水果时一起数', '上下楼梯数台阶'],
        measure: ['操作', '观察'], frequency: '每周 2 次', owner: '小组教师 / 班级教师',
        duty: [['小组教师', '小组课，每周 2 次'], ['班级教师', '点心与区角，每天'], ['家长', '家庭任务卡']] },

      { key: 'match', match: /视觉配对|知觉|视觉运用/,
        topic: '配对与分类',
        text: '在桌面操作中，能按颜色、形状、功能三类属性完成配对与分类，每类 8 张卡片正确率≥90%',
        criteria: '三类各 8 张，正确率≥90%；能说出分类理由',
        fusion: '在区角整理中能按标记把材料放回对应筐。',
        group: '从颜色→形状→功能逐层推进，加入"为什么这样分"的表达。',
        integrated: '三类分类正确率≥90%，能说出 1 条分类理由。',
        shorts: [
          { t: '按颜色分类 8 张卡片', c: '正确率≥90%' },
          { t: '按形状分类 8 张卡片', c: '正确率≥90%' },
          { t: '说出"它们都是××"', c: '5 次中 3 次' }
        ],
        school: ['区角筐贴颜色与形状标记，整理时自然练习', '桌面操作每次 8 张，短时高频', '把分类和"收玩具"绑定'],
        home: ['收玩具时按颜色分筐', '袜子配对'],
        measure: ['操作'], frequency: '每周 2 次', owner: '小组教师',
        duty: [['小组教师', '小组课，每周 2 次'], ['班级教师', '区角整理，每天'], ['家长', '家庭任务卡']] },

      { key: 'explore', match: /功能、特性、类别|阅读|书写/,
        topic: '主动探究与因果表达',
        text: '在科学区与沙水区，能主动操作新材料 5 分钟以上，并用"因为……所以……"说出一次因果',
        criteria: '单次专注≥5 分钟；因果表达每周≥2 次',
        fusion: '在科学区能自己选材料、自己试，遇到问题先试再求助。',
        group: '从"玩得久"到"说出为什么"。',
        integrated: '单次探究≥5 分钟，每周≥2 次因果表达。',
        shorts: [
          { t: '自选材料并连续操作 5 分钟', c: '4 次中 3 次' },
          { t: '用"因为……所以……"说一次发现', c: '每周 2 次' }
        ],
        school: ['科学区每周换一次新材料', '教师用"你发现了什么"提问，不直接给答案', '把发现记录到班级"我发现"墙'],
        home: ['玩水、玩沙、玩面团，不打断', '问"你觉得为什么会这样"'],
        measure: ['观察'], frequency: '每周 1 次', owner: '班级教师',
        duty: [['班级教师', '科学区，每周 2 次'], ['家长', '家庭任务卡']] }
    ],

    QX: [
      { key: 'regulate', match: /情绪|病理行为|障碍评估|感觉调节/,
        topic: '挫折耐受与求助',
        text: '在较难任务（拼图、扣纽扣）受挫时，能在 1 次提示下停下手上的推打动作，说出"我需要休息"或举手求助',
        criteria: '挫折情境每周记录≤2 次推开材料；求助行为 5 次中≥3 次',
        fusion: '在集体活动中遇到困难时先求助，不推开材料、不离开座位。',
        group: '先教"我需要休息"卡片，再把任务难度降到成功率 70%。',
        integrated: '每周推开材料≤2 次；求助行为≥60%。',
        shorts: [
          { t: '认"我需要休息"卡片并递给老师', c: '5 次中 3 次' },
          { t: '任务失败后 1 次提示下停手', c: '5 次中 3 次' },
          { t: '在安静角休息 2 分钟后回到活动', c: '4 次中 3 次' }
        ],
        school: ['设安静角，配视觉提示与计时器', '任务难度控制在成功率 70%，成功即结束', '教师用中性语气提示，不追问"为什么"'],
        home: ['家里也设一个"休息角"', '任务做不完就停，不硬撑'],
        measure: ['频率记录', '观察'], frequency: '每天记录', owner: '融合教师 / 班级教师',
        duty: [['融合教师', '统筹行为支持方案，每周 1 次'], ['班级教师', '一日生活，每天'], ['感统教师', '环境调整建议，每两周 1 次'], ['家长', '家庭任务卡']] },

      { key: 'transition', match: /过渡|障碍|逃避/,
        topic: '活动转换与预告',
        text: '在活动转换前，能听完"还有 2 分钟"的预告，计时器响后 1 次提示内完成转换，不出现躺地或哭闹',
        criteria: '每日 3 次转换中≥2 次平稳完成',
        fusion: '在班级一日生活的转换环节能跟随集体移动，不抗拒。',
        group: '用视觉日程 + 计时器，把"未知"变成"可预期"。',
        integrated: '每日 3 次转换≥2 次平稳完成。',
        shorts: [
          { t: '听到"还有 2 分钟"后继续活动不抗拒', c: '4 次中 3 次' },
          { t: '计时器响后自己走到下一个活动区', c: '4 次中 3 次' },
          { t: '转换时说出"我还要玩"而不是躺地', c: '每周 3 次' }
        ],
        school: ['视觉日程表贴在固定位置', '转换前 5 分钟、2 分钟各预告一次', '允许带一件过渡物'],
        home: ['出门前提前预告路线', '用手机计时器做同样的预告'],
        measure: ['频率记录'], frequency: '每天', owner: '班级教师',
        duty: [['班级教师', '一日生活转换，每天'], ['家长', '家庭同一套预告方式']] },

      { key: 'sensory', match: /听觉|触觉|前庭|感觉调节/,
        topic: '感觉调节与环境适配',
        text: '在集体活动前完成 5 分钟前庭本体活动后，能进入集体并保持 10 分钟，不因听觉刺激离座或捂耳',
        criteria: '集体参与 10 分钟；捂耳/离座≤1 次',
        fusion: '在音乐、广播等听觉刺激较强的环节能留在集体中。',
        group: '活动前固定做前庭本体活动，形成可预期的"进入集体"程序。',
        integrated: '集体参与 10 分钟，捂耳/离座≤1 次。',
        shorts: [
          { t: '活动前完成 5 分钟前庭本体活动', c: '每天 1 次' },
          { t: '在音乐环节留在集体 5 分钟', c: '5 分钟不离座' },
          { t: '嘈杂环境里用耳罩替代捂耳离座', c: '4 次中 3 次' }
        ],
        school: ['集体活动前固定安排前庭本体活动', '准备降噪耳罩，允许在嘈杂环节使用', '座位远离音箱与门口'],
        home: ['睡前做 5 分钟本体活动（推拉、翻滚）', '提前告知要去嘈杂场所'],
        measure: ['观察'], frequency: '每周 2 次', owner: '感统教师 / 班级教师',
        duty: [['感统教师', '评估与训练，每周 2 次'], ['班级教师', '一日生活，每天'], ['家长', '家庭任务卡']] }
    ]
  };

  /* ---------- 材料原文：用于判断"医学/家长有没有提到这个维度" ---------- */
  function medText() {
    var st = R.store.get() || {};
    var f = ((st.reports || {}).medical || {}).fields || {};
    return [f['诊断结论'], f['主诉'], f['现病史要点'], f['发育史'], f['言语语言评估'],
      f['感觉统合量表'], f['ABC 分项目'], f['诊疗计划 / 康复建议']].filter(Boolean).join(' ');
  }
  function parentNeedText() {
    var st = R.store.get() || {};
    var ob = (st.observation || {}).parent || {};
    var arr = [];
    Object.keys(ob).forEach(function (k) {
      if (ob[k] && ob[k].need) arr.push(ob[k].need);
      if (ob[k] && ob[k].strength) arr.push(ob[k].strength);
    });
    return arr.join(' ');
  }

  /* ---------- 六因子：每个值都能说出"为什么" ---------- */
  function factorsFor(code, comp, gap, weak) {
    var med = medText(), par = parentNeedText();
    var kw = KW[code] || /./;

    /* 医嘱一致性：医学材料是否点名了这个方向 */
    var medical = 0, medWhy = '医学诊断未提及该方向';
    if (med && kw.test(med)) { medical = 2; medWhy = '医学诊断/病历中提到该方向'; }

    /* 障碍严重度：看该维度里最弱的 2 项 */
    var lows = comp.basis.slice().sort(function (a, b) { return a.v - b.v; }).slice(0, 2);
    var barrier = 0, barWhy = '该维度无可参照的低分项';
    if (lows.length) {
      var minv = lows[0].v;
      barrier = minv < 45 ? 3 : minv < 60 ? 2 : minv < 75 ? 1 : 0;
      barWhy = '最弱项「' + lows[0].k + '」' + lows[0].raw + '（折算 ' + lows[0].v + ' 分）';
    }

    /* 跨源一致性：几个来源同时指向 */
    var set = {};
    comp.basis.forEach(function (b) { set[b.srcName] = 1; });
    var cross = Math.min(4, Object.keys(set).length);
    var crossWhy = Object.keys(set).join(' / ') || '仅单一来源';

    /* 功能性与参与必需度：离学期目标越远越优先 */
    var functional = gap >= 15 ? 2 : gap >= 8 ? 2 : gap >= 4 ? 1 : 1;
    var funWhy = '离学期目标差 ' + gap + ' 分';

    /* 家长诉求 */
    var parent = (par && kw.test(par)) ? 1 : 0;
    var parWhy = parent ? '家长观察/需求中提到该方向' : '家长材料未提及';

    /* 已有优势（负向）：已经比较强的维度不重复设目标 */
    var strength = comp.score >= 85 ? -2 : comp.score >= 78 ? -1 : 0;
    var strWhy = strength ? '当前 ' + comp.score + ' 分，属相对优势，转为可用资源' : '非优势维度';

    return {
      v: { medical: medical, barrier: barrier, cross: cross, functional: functional, parent: parent, strength: strength },
      why: { medical: medWhy, barrier: barWhy, cross: crossWhy, functional: funWhy, parent: parWhy, strength: strWhy }
    };
  }

  /* 选模板：先看最弱项命中哪个，命中不到按顺序取 */
  function pickTpl(code, weak, used) {
    var list = TPL[code] || [];
    var hit = null;
    if (weak) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].match.test(weak.k) && !used[list[i].key]) { hit = list[i]; break; }
      }
    }
    if (!hit) {
      for (var j = 0; j < list.length; j++) if (!used[list[j].key]) { hit = list[j]; break; }
    }
    return hit || list[0];
  }

  function build(code, comp, tpl, type, idx, gap, weak) {
    var f = factorsFor(code, comp, gap, weak);
    var short = R.domainShort(code);
    var basis = comp.basis.slice().sort(function (a, b) { return a.v - b.v; }).slice(0, 6)
      .map(function (b) {
        return { srcName: b.srcName, k: b.k, raw: b.raw, v: b.v, how: b.how, w: Math.round(b.w * 100) / 100 };
      });
    var why = comp.manualOnly
      ? comp.name + ' 目前只有教师初判 ' + comp.score + ' 分（还没有报告佐证）' +
        (gap > 0 ? '，离学期目标差 ' + gap + ' 分' : '') + '。建议上传对应报告后再复核这条目标。'
      : comp.name + ' 由 ' + comp.basis.length + ' 项数据算出 ' + comp.score + ' 分' +
        (gap > 0 ? '，离学期目标差 ' + gap + ' 分' : '，已接近学期目标') +
        (weak ? '；当前最弱的是「' + weak.k + '」' + weak.raw + '（折算 ' + weak.v + ' 分）' : '') + '。';

    /* 短期目标整格：与教师手写 IEP 同版式（融合 / 小组 / 整合目标 三层） */
    var sd = '融合：' + tpl.fusion +
      '小组：' + tpl.group +
      '整合目标：' + tpl.shorts.map(function (s, i) {
        return (i + 1) + '. ' + s.t + '（' + s.c + '）。';
      }).join('');

    return {
      id: short + '-' + idx, domain: code, type: type, status: 'pending',
      origin: 'computed',
      text: tpl.text, criteria: tpl.criteria,
      measure: tpl.measure.slice(), frequency: tpl.frequency, owner: tpl.owner,
      fusion: tpl.fusion, group: tpl.group, integrated: tpl.integrated,
      shortDetail: sd,
      shorts: tpl.shorts.map(function (s) { return { t: s.t, c: s.c }; }),
      school: tpl.school.slice(), home: tpl.home.slice(),
      factors: f.v, factorWhy: f.why,
      genBasis: basis, genWhy: why, tplKey: tpl.key, topic: tpl.topic,
      duty: (tpl.duty || []).slice()
    };
  }

  /* ---------- 主流程 ---------- */
  var TARGET_ADD = { '显著落后': 15, '落后': 12, '一般': 8, '相对优势': 5, '数据不足': 0 };

  R.gen = {
    /* 生成候选目标列表（不写库） */
    list: function () {
      var prof0 = E.profileComputed();
      var comps = E.compute().filter(function (c) { return c.score !== null && c.basis.length; });
      /* 补充：只有教师初判、还没有报告佐证的维度，也照样出建议（但不假装有依据） */
      var has = {};
      comps.forEach(function (c) { has[c.code] = 1; });
      prof0.forEach(function (p) {
        if (has[p.code]) return;
        if (typeof p.score !== 'number' || !p.score) return;
        comps.push({
          code: p.code, name: p.name, score: p.score, level: p.level || '一般',
          badge: p.badge, basis: [], missing: [], weightUsed: 0, manualOnly: true
        });
      });
      if (!comps.length) return [];
      var prof = prof0;
      var rows = comps.map(function (c) {
        var p = prof.filter(function (x) { return x.code === c.code; })[0] || {};
        var target = (typeof p.target === 'number' && p.target > c.score) ? p.target
          : Math.min(95, c.score + (TARGET_ADD[c.level] || 8));
        var weak = c.basis.slice().sort(function (a, b) { return a.v - b.v; })[0] || null;
        return { c: c, target: target, gap: Math.max(0, Math.round(target - c.score)), weak: weak };
      }).sort(function (a, b) { return b.gap - a.gap; });

      var out = [], used = {}, idx = {};
      /* 第一轮：每个有数据的维度出一条核心目标 */
      rows.forEach(function (r) {
        var tpl = pickTpl(r.c.code, r.weak, used);
        used[tpl.key] = 1;
        idx[r.c.code] = 1;
        out.push(build(r.c.code, r.c, tpl, '核心目标', idx[r.c.code], r.gap, r.weak));
      });

      /* 第二轮：缺口最大的 2 个维度各补一条支持型目标 */
      rows.slice(0, 2).forEach(function (r) {
        if (r.gap < 3) return;
        var tpl = pickTpl(r.c.code, null, used);
        if (!tpl || used[tpl.key]) return;
        used[tpl.key] = 1;
        idx[r.c.code] += 1;
        out.push(build(r.c.code, r.c, tpl, '支持型目标', idx[r.c.code], r.gap, r.weak));
      });

      /* 按维度排一下，读起来更整齐 */
      var order = { YD: 1, YY: 2, SJ: 3, ZL: 4, RZ: 5, QX: 6 };
      out.sort(function (a, b) { return (order[a.domain] || 9) - (order[b.domain] || 9) || a.id.localeCompare(b.id); });

      /* 编号规则：同一维度只有 1 条时不带序号（如「社交」）；2 条及以上才带 -1 / -2 */
      var byD = {};
      out.forEach(function (g) { (byD[g.domain] = byD[g.domain] || []).push(g); });
      Object.keys(byD).forEach(function (code) {
        var arr = byD[code], short = R.domainShort(code);
        arr.forEach(function (g, i) { g.id = arr.length > 1 ? short + '-' + (i + 1) : short; });
      });
      return out;
    },

    /* 数据指纹：六维分数 + 参与项数，用来判断"材料变没变" */
    sig: function () {
      try {
        return E.compute().map(function (c) {
          return c.code + ':' + (c.score === null ? '-' : c.score) + ':' + c.basis.length;
        }).join('|');
      } catch (e) { return ''; }
    },

    /* 写入档案（会覆盖旧目标） */
    apply: function () {
      var st = R.store.get();
      if (!st) return 0;
      var list = R.gen.list();
      if (!list.length) return 0;
      st.goals = list;
      st.genSig = R.gen.sig();
      st.doc = st.doc || {};
      if (st.doc.status === 'effective') st.doc.status = 'draft';
      R.store.save();
      R.store.log('系统', '生成目标草案', '按已入档数据生成 ' + list.length + ' 条候选目标（全部待审议）');
      return list.length;
    },

    /* 自动补/自动更新：
       ① 没有目标 → 生成
       ② 有目标但全部是"机器生成且没人动过" → 材料一变就跟着更新（教师一旦采纳/改写/降级/忽略就停手） */
    auto: function () {
      try {
        var st = R.store.get();
        if (!st) return 0;
        var has = E.compute().some(function (c) { return c.score !== null; });
        if (!has) return 0;
        var goals = st.goals || [];
        if (goals.length) {
          var untouched = goals.every(function (g) {
            return g.origin === 'computed' && g.status === 'pending' && !g.edited;
          });
          if (!untouched) return 0;
          if (st.genSig === R.gen.sig()) return 0;
        }
        return R.gen.apply();
      } catch (e) { return 0; }
    }
  };

  /* ---------- 缺口：学期目标未设时给一个可解释的临时值 ---------- */
  E.targetOf = function (p) {
    if (!p || p.score === null || p.score === undefined) return null;
    if (typeof p.target === 'number' && p.target > p.score) return { v: p.target, auto: false };
    return { v: Math.min(95, p.score + (TARGET_ADD[p.level] || 8)), auto: true };
  };

})(window.RIEP);
