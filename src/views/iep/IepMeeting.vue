<template>
  <div class="meeting-wrapper">
    <!-- 顶部绿色边框 Hero 卡片 (截图上半部) -->
    <div class="hero-meeting-card">
      <div class="hm-kicker">IEP 会议 · 2026-11-04 · 资源教室</div>
      <h3 class="hm-title">决议已应用，成稿升级为 v2.0</h3>
      <p class="hm-desc">
        应用人：融合教师（2026-11-02）。共 0 条决议已写回。会议纪要与建议仍可继续补充，提交后系统会解析并给出成稿调整项。
      </p>
      <div class="hm-actions">
        <button class="btn-primary-blue" @click="$router.push('/iep/doc')">
          查看完整成稿
        </button>
        <button class="btn-soft-gray" @click="mainTab = 'minutes'">
          继续补充纪要与建议
        </button>
      </div>

      <!-- 会议基本信息折叠 -->
      <div class="fold-wrap">
        <div class="fold-toggle" @click="showMeetInfo = !showMeetInfo">
          <span class="ft-left">
            <span class="arrow">{{ showMeetInfo ? '▼' : '▶' }}</span>
            会议基本信息
          </span>
          <span class="ft-tag">点开查看</span>
        </div>
        <div v-show="showMeetInfo" class="fold-content">
          <div class="info-kv">
            <div class="kv-row"><b>主持：</b><span>融合教师 李老师</span></div>
            <div class="kv-row"><b>参会：</b><span>园长、融合教师、班级教师、小组教师、密训教师、感统教师、家长、区特教指导中心（线上）</span></div>
            <div class="kv-row"><b>地点：</b><span>资源教室（融合教育支持中心）</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主 Tab 胶囊栏 (截图核心 Tab) -->
    <div class="main-tab-bar">
      <div 
        class="tab-btn" 
        :class="{ active: mainTab === 'review' }"
        @click="mainTab = 'review'"
      >
        ① 目标审议 <span class="badge-num">{{ pendingCount }}</span>
      </div>
      <div 
        class="tab-btn" 
        :class="{ active: mainTab === 'minutes' }"
        @click="mainTab = 'minutes'"
      >
        ② 会议纪要与建议
      </div>
      <div 
        class="tab-btn" 
        :class="{ active: mainTab === 'decisions' }"
        @click="mainTab = 'decisions'"
      >
        ③ 决议对照
      </div>
      <div 
        class="tab-btn" 
        :class="{ active: mainTab === 'opinions' }"
        @click="mainTab = 'opinions'"
      >
        ④ 家长意见与专家建议
      </div>
    </div>

    <!-- ==================== Tab 1: 目标审议 (截图重点) ==================== -->
    <div v-show="mainTab === 'review'" class="review-pane">
      <!-- 蓝色提示条 (截图完全对齐) -->
      <div class="notice-info-bar">
        <span class="info-ic">ⓘ</span>
        <div class="info-tx">
          审议在这里做：<b>采纳</b>＝进入成稿；<b>改写</b>＝保留但改表述；<b>降级</b>＝放到学期后段；<b>忽略</b>＝必须写理由。
          每条都能点开看它是从哪个字段推出来的。
          <b>全部审议完（待审议为 0）后，才能应用决议。</b>
        </div>
      </div>

      <!-- 子筛选 Bar (待审议 8 / 已采纳 0 / 降级 0 / 已忽略 0 / 全部 8) -->
      <div class="sub-filter-bar">
        <div class="filter-left">
          <span 
            class="sf-pill" 
            :class="{ active: subFilter === 'pending' }"
            @click="subFilter = 'pending'"
          >
            待审议 <span class="n">{{ pendingCount }}</span>
          </span>
          <span 
            class="sf-pill" 
            :class="{ active: subFilter === 'adopted' }"
            @click="subFilter = 'adopted'"
          >
            已采纳 <span class="n">{{ adoptedCount }}</span>
          </span>
          <span 
            class="sf-pill" 
            :class="{ active: subFilter === 'deferred' }"
            @click="subFilter = 'deferred'"
          >
            降级 <span class="n">{{ deferredCount }}</span>
          </span>
          <span 
            class="sf-pill" 
            :class="{ active: subFilter === 'dropped' }"
            @click="subFilter = 'dropped'"
          >
            已忽略 <span class="n">{{ droppedCount }}</span>
          </span>
          <span 
            class="sf-pill" 
            :class="{ active: subFilter === 'all' }"
            @click="subFilter = 'all'"
          >
            全部 <span class="n">{{ goalsList.length }}</span>
          </span>
        </div>

        <button 
          v-if="pendingCount > 0"
          class="btn-adopt-all" 
          @click="handleAdoptAll"
        >
          全部采纳（{{ pendingCount }} 条）
        </button>
      </div>

      <!-- 目标卡片列表 (逐条对齐截图设计) -->
      <div class="goal-card-list">
        <div 
          v-for="item in filteredGoals" 
          :key="item.id" 
          class="goal-item-card"
        >
          <div class="gic-top">
            <!-- 左侧优先级徽标 -->
            <div class="gic-priority">
              <span class="p-num">{{ item.priority }}</span>
              <span class="p-lbl">优先级</span>
            </div>

            <!-- 主标题与标签行 -->
            <div class="gic-main">
              <div class="gic-heading">
                <span class="g-id">{{ item.id }}</span>
                <span class="g-title">{{ item.text }}</span>
              </div>
              <div class="gic-meta-row">
                <span class="meta-tag tag-blue">{{ item.domainName }}</span>
                <span class="meta-text">{{ item.type }}</span>
                <span class="meta-text">通过标准：{{ item.criteria }}</span>
                <span 
                  class="meta-status"
                  :class="item.status"
                >
                  {{ getStatusText(item.status) }}
                </span>
              </div>
            </div>

            <!-- 右侧操作按钮组 -->
            <div class="gic-actions">
              <button 
                v-if="item.status !== 'adopted'" 
                class="btn-act-ok" 
                @click="adoptGoal(item)"
              >
                采纳
              </button>
              <button class="btn-act-rewrite" @click="rewriteGoal(item)">
                改写
              </button>
              <el-dropdown trigger="click" @command="(cmd) => handleMoreCmd(cmd, item)">
                <button class="btn-act-more">
                  更多 ▼
                </button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="defer">降级为学期后段</el-dropdown-item>
                    <el-dropdown-item command="drop" style="color:#ef4444">忽略并说明理由</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <!-- 为什么建议这一条 (浅灰面板) -->
          <div class="gic-why-panel">
            <strong>为什么建议这一条：</strong>{{ item.genWhy }}
          </div>

          <!-- 折叠面板 1: 优先级依据 -->
          <div class="gic-fold" @click="item.showBasis = !item.showBasis">
            <span class="cf-left">
              {{ item.showBasis ? '▼' : '▶' }} 优先级 {{ item.priority }} 分 = 因子 {{ item.scoreFactor }} + 维度缺口 {{ item.gapFactor }} · 依据 {{ item.basisCount }} 条
            </span>
          </div>
          <div v-show="item.showBasis" class="gic-fold-body">
            <div class="factor-pills">
              <span class="fp-pill">医学诊断 +2</span>
              <span class="fp-pill">适应障碍 +3</span>
              <span class="fp-pill">多源交叉 +4</span>
              <span class="fp-pill">功能自理 +2</span>
              <span class="fp-pill">家长诉求 +1</span>
            </div>
            <p class="fp-tip">情绪行为由 9 项数据算出 61 分，离学期目标差 12 分；当前最弱的是「感觉调节」严重问题（折算 26 分）。</p>
          </div>

          <!-- 折叠面板 2: 写进成稿的样子 (长期+短期+双策略) -->
          <div class="gic-fold flex-between" @click="item.showDetail = !item.showDetail">
            <span class="cf-left">
              {{ item.showDetail ? '▼' : '▶' }} 写进成稿的样子：长期目标 + 短期目标 + 双策略
            </span>
            <span class="cf-right">{{ item.shorts ? item.shorts.length : 3 }} 条短期</span>
          </div>
          <div v-show="item.showDetail" class="gic-fold-body">
            <div class="detail-long">
              <div><b>融合目标：</b>{{ item.fusion || '在常规活动中能借助熟悉策略进行情绪调节。' }}</div>
              <div><b>小组目标：</b>{{ item.group || '遇到高难度任务时使用暂停、求助等合适策略。' }}</div>
              <div><b>整合后：</b>{{ item.integrated || item.text }}</div>
            </div>

            <div class="detail-shorts">
              <div class="ds-title">短期目标：</div>
              <ol class="ds-ol">
                <li v-for="(s, sidx) in item.shorts" :key="sidx">
                  {{ s.t }} <span class="muted">（{{ s.c }}）</span>
                </li>
              </ol>
            </div>

            <div class="detail-strategies">
              <div class="ds-title">园内支持策略：</div>
              <ul class="ds-ul">
                <li v-for="(sch, scidx) in item.school" :key="scidx">{{ sch }}</li>
              </ul>
              <div class="ds-title" style="margin-top:8px">家庭配合策略：</div>
              <ul class="ds-ul">
                <li v-for="(hm, hmidx) in item.home" :key="hmidx">{{ hm }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== Tab 2: 会议纪要与建议 ==================== -->
    <div v-show="mainTab === 'minutes'" class="minutes-pane">
      <div class="card">
        <div class="card-head">
          <h3>会议纪要 / 大白话建议</h3>
          <span class="desc">整理好的要点可以贴，家长的原话、专家的口头建议也可以贴</span>
        </div>
        <textarea 
          v-model="minutesText" 
          class="minutes-textarea" 
          placeholder="例：班级改成小二班；能力分析里补一句「会自己穿鞋了」；社交这条先别定太高，先把「看同伴—回应」做出来；服务安排里感统课每周 2 次，由感统教师负责；复盘周期改成一个月一次。"
        ></textarea>
        <div class="minutes-btn-row">
          <button class="btn-soft" @click="saveMinutesDraft">仅保存草稿（不改成稿）</button>
          <button class="btn-primary" @click="parseAiAdvice">🎯 AI 智能解析（推荐，读懂大白话）</button>
          <button class="btn-soft" @click="parseRuleAdvice">规则解析（离线可用）</button>
        </div>
      </div>
    </div>

    <!-- ==================== Tab 3: 决议对照 ==================== -->
    <div v-show="mainTab === 'decisions'" class="decisions-pane">
      <div class="card">
        <div class="card-head">
          <h3>决议对照</h3>
          <span class="desc">审议确认后的 4 项核心决议对照</span>
        </div>
        <div class="decisions-list">
          <div class="dec-card">
            <div class="dec-tag tag-orange">调整</div>
            <div class="dec-info">
              <b>社交-1：</b>同伴呼唤或展示玩具时，看向同伴并用眼神、手势或简单词回应，达成≥70%
              <p class="dec-basis">依据：专家建议“社交目标要落到看同伴—回应—发起的可观察行为”</p>
            </div>
          </div>
          <div class="dec-card">
            <div class="dec-tag tag-orange">调整</div>
            <div class="dec-info">
              <b>情绪-1：</b>较难任务急躁时，1 次提示下停下并求助；集体活动前先安排 5 分钟前庭本体活动
              <p class="dec-basis">依据：感统教师建议“先做前庭本体活动再进入集体”</p>
            </div>
          </div>
          <div class="dec-card">
            <div class="dec-tag tag-green">保留</div>
            <div class="dec-info">
              <b>自理-1：</b>沿用草案：漱口含水吐水，连续 3 次中 2 次；家园统一用“嚼完 5 口再咽”
              <p class="dec-basis">依据：家长意见：家园用同一套提醒方式</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== Tab 4: 家长意见与专家建议 ==================== -->
    <div v-show="mainTab === 'opinions'" class="opinions-pane">
      <div class="grid g2">
        <div class="card" style="border-left:4px solid #8b5cf6">
          <div class="card-head"><h3>家长意见</h3></div>
          <p style="font-size:13px;line-height:1.7;color:#3d4d5f">
            希望继续练主动邀请小朋友一起玩，不只是别人问才回应；在家吃饭偶尔还直接吞咽，希望园里和家里用一样的提醒方式。
          </p>
          <div class="small muted" style="margin-top:10px">家长诉求纳入候选；与专业判断冲突时以专业判断为准，并在草案中说明理由。</div>
        </div>
        <div class="card" style="border-left:4px solid #14b8a6">
          <div class="card-head"><h3>专家建议</h3></div>
          <p style="font-size:13px;line-height:1.7;color:#3d4d5f">
            社交目标不要只写“愿意一起玩”，要落到“看同伴—回应—发起”的可观察行为；感觉统合建议先解决听觉与前庭的低反应，再谈集体参与。
          </p>
          <div class="small muted" style="margin-top:10px">外部专业按授权范围参与，批注全程留痕。</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

const mainTab = ref('review') // 默认激活 "① 目标审议 8"
const subFilter = ref('pending') // 默认激活 "待审议"
const showMeetInfo = ref(false)

const minutesText = ref(`会议纪要：
1. 家长提出希望重点练“主动邀请同伴”，并希望家园用同一套进食提醒方式。
2. 专家建议社交目标落到可观察行为（看同伴、回应、发起），不要只写“愿意一起玩”。
3. 感统教师提出先在集体活动前安排前庭本体活动，再进入集体。
4. 小组教师反馈单脚站已从 3 秒到 4 秒，建议目标维持 5 秒不加码。
5. 其余目标维持草案表述。`)

// 8 条目标真实数据
const goalsList = ref([
  {
    id: '情绪-1',
    domain: 'QX',
    domainName: '情绪行为表现',
    type: '核心目标',
    priority: 16.2,
    scoreFactor: 12,
    gapFactor: 12,
    basisCount: 12,
    text: '在较难任务（拼图、扣纽扣）受挫时，能在 1 次提示下停下手上的推打动作，说出“我需要休息”或举手求助',
    criteria: '挫折情绪每周记录≤2 次推开材料；求助行为 5 次中≥3 次',
    status: 'pending',
    genWhy: '情绪行为由 9 项数据算出 61 分，离学期目标差 12 分；当前最弱的是「感觉调节」严重问题（折算 26 分）。',
    showBasis: false,
    showDetail: false,
    fusion: '在遇到拼搭失败、轮流等待或较难任务时，能选择说“请帮我”“我想再试一次”“我需要休息”等功能性表达或替代动作。',
    group: '提升挫折耐受与情绪调节能力；在遇到高难度任务时，可以使用自我安抚、暂停、求助等合适策略。',
    integrated: '提升挫折耐受；高难任务使用“请帮我”“我想再试一次”“我需要休息”；减少急躁、逃避、退缩。',
    shorts: [
      { t: '在较难任务中感到急躁时，1 次提示下能停下并向老师求助', c: '每天至少 1 次可达成' },
      { t: '在拆分后的小步骤任务中愿意参与并完成，完成后能接受具体表扬', c: '每周 3 次中 2 次' },
      { t: '入园、午睡前看到流程提示或听到预告后配合过渡', c: '每周 5 天中 4 天' }
    ],
    school: [
      '普通班每天晨间和午睡前使用一致的流程图片/口头预告，让所有幼儿知道接下来做什么。',
      '在积木或美工活动中将难任务拆成“小一步”，提供“自己试—请人帮忙—休息后再试”三张卡。',
      '教室设全班可使用的短暂安静位置；教师观察不适征兆，降低当下要求。'
    ],
    home: [
      '在家活动同样拆分小任务，难度循序渐进，允许中途休息，不强迫坚持。',
      '建立稳定晨间、睡前流程，提前预告转换，保持与园内一致安抚方式。'
    ]
  },
  {
    id: '社交-1',
    domain: 'SJ',
    domainName: '社会交往',
    type: '核心目标',
    priority: 15.8,
    scoreFactor: 11,
    gapFactor: 14,
    basisCount: 10,
    text: '同伴呼唤或展示玩具时，看向同伴并用眼神、手势或简单词回应，达成≥70%',
    criteria: '4/5 观察频次达标',
    status: 'pending',
    genWhy: '社交沟通领域基线 54 分，主动发起同伴互动较少，需从看同伴、回应逐步过渡到主动发起。',
    showBasis: false,
    showDetail: false,
    fusion: '在游戏角主动走向同伴，拿玩具示意轮流。',
    group: '在社交故事指导下完成 2 轮轮流小游戏。',
    integrated: '同伴互动中看向同伴并积极回应，能等 2 轮不抢。',
    shorts: [
      { t: '同伴呼唤名字时 3 秒内对视回应', c: '每天 3 次中 2 次' },
      { t: '轮流玩小车能等待 2 轮', c: '每周 4 次' }
    ],
    school: ['固定两名温和同伴小老师结对示范'],
    home: ['家庭每天推小车轮流游戏 3-5 分钟']
  },
  {
    id: '自理-1',
    domain: 'ZL',
    domainName: '生活自理',
    type: '常规目标',
    priority: 14.5,
    scoreFactor: 10,
    gapFactor: 10,
    basisCount: 8,
    text: '午餐与进食：进食“嚼完 5 口再咽”，一餐中被提醒 ≤2 次就放慢吞咽速度',
    criteria: '连续 5 天达成 4 天',
    status: 'pending',
    genWhy: '进食吞咽偶发急躁，需家园配合统一咀嚼示范。',
    showBasis: false,
    showDetail: false,
    shorts: [{ t: '午餐进食不催不喂，自主咀嚼', c: '每餐记录' }],
    school: ['开饭前做咀嚼手势示范'],
    home: ['晚餐家园用同一套提醒口令']
  },
  {
    id: '语言-1',
    domain: 'YY',
    domainName: '言语与语言',
    type: '核心目标',
    priority: 14.0,
    scoreFactor: 9,
    gapFactor: 11,
    basisCount: 9,
    text: '在生活场景中，指自己说“我”、指对方说“你”，主动说“我要××”≥5 次',
    criteria: '每天主动表达≥5 次',
    status: 'pending',
    genWhy: '语言理解良好但代词使用与主动需求表达需进一步巩固。',
    showBasis: false,
    showDetail: false,
    shorts: [{ t: '递东西时说出“我要”', c: '每天 5 次' }],
    school: ['需求延迟满足 3 秒，促发口语表达'],
    home: ['全天生活场景随机提示']
  },
  {
    id: '运动-1',
    domain: 'YD',
    domainName: '动作与运动',
    type: '发展型目标',
    priority: 13.2,
    scoreFactor: 8,
    gapFactor: 9,
    basisCount: 7,
    text: '单脚站立维持平衡≥5 秒，双脚交替连续跳跃 3 次',
    criteria: '测评达到 5 秒标准',
    status: 'pending',
    genWhy: '前庭平衡处于恢复期，单脚站已从 3 秒提升至 4 秒。',
    showBasis: false,
    showDetail: false,
    shorts: [{ t: '单脚站立稳步达到 5 秒', c: '每周测 1 次' }],
    school: ['早操活动中加入平衡垫练习'],
    home: ['周末户外踩平衡线']
  },
  {
    id: '认知-1',
    domain: 'RZ',
    domainName: '认知发展',
    type: '优势巩固目标',
    priority: 12.8,
    scoreFactor: 7,
    gapFactor: 8,
    basisCount: 6,
    text: '按颜色、形状两重属性对材料进行二元分类，完成 4 组配对',
    criteria: '正确率≥90%',
    status: 'pending',
    genWhy: '认知为优势项（82 分），通过优势项带弱项。',
    showBasis: false,
    showDetail: false,
    shorts: [{ t: '完成复杂形状二次分类', c: '正确率 90%' }],
    school: ['作为教学媒介'],
    home: ['玩具归类整理']
  },
  {
    id: '自理-2',
    domain: 'ZL',
    domainName: '生活自理',
    type: '常规目标',
    priority: 12.0,
    scoreFactor: 6,
    gapFactor: 7,
    basisCount: 6,
    text: '餐后漱口含水鼓腮吐水，连续 3 次中达成 2 次',
    criteria: '连续 3 次中达标 2 次',
    status: 'pending',
    genWhy: '口腔肌肉协调与自理技能培养。',
    showBasis: false,
    showDetail: false,
    shorts: [{ t: '含水鼓腮不咽下', c: '每天餐后' }],
    school: ['餐后保育老师示范'],
    home: ['早晚刷牙后练习']
  },
  {
    id: '情绪-2',
    domain: 'QX',
    domainName: '情绪行为表现',
    type: '支持型目标',
    priority: 11.5,
    scoreFactor: 5,
    gapFactor: 7,
    basisCount: 5,
    text: '在班级常规活动中主动参与适合自己能力的任务，维持简短任务参与 5 分钟',
    criteria: '每周 3 次，每次≥5 分钟',
    status: 'pending',
    genWhy: '任务耐受力提升与正向强化机制。',
    showBasis: false,
    showDetail: false,
    shorts: [{ t: '维持专注 5 分钟', c: '每周 3 次' }],
    school: ['使用小闹钟视觉倒计时'],
    home: ['积木拼搭不中途离席']
  }
])

const pendingCount = computed(() => goalsList.value.filter(g => g.status === 'pending').length)
const adoptedCount = computed(() => goalsList.value.filter(g => g.status === 'adopted').length)
const deferredCount = computed(() => goalsList.value.filter(g => g.status === 'deferred').length)
const droppedCount = computed(() => goalsList.value.filter(g => g.status === 'dropped').length)

const filteredGoals = computed(() => {
  if (subFilter.value === 'all') return goalsList.value
  return goalsList.value.filter(g => g.status === subFilter.value)
})

const getStatusText = (st) => {
  if (st === 'adopted') return '已采纳'
  if (st === 'deferred') return '降级'
  if (st === 'dropped') return '已忽略'
  return '待审议'
}

const adoptGoal = (item) => {
  item.status = 'adopted'
  ElMessage.success(`已采纳目标：「${item.id}」`)
}

const rewriteGoal = (item) => {
  ElMessage.info(`打开「${item.id}」改写抽屉：可修改长期/短期目标文本与通过标准`)
}

const handleMoreCmd = (cmd, item) => {
  if (cmd === 'defer') {
    item.status = 'deferred'
    ElMessage.warning(`已将「${item.id}」降级为学期后段`)
  } else if (cmd === 'drop') {
    item.status = 'dropped'
    ElMessage.info(`已忽略「${item.id}」并记录理由`)
  }
}

const handleAdoptAll = () => {
  goalsList.value.forEach(g => {
    if (g.status === 'pending') g.status = 'adopted'
  })
  ElMessage.success('已全部采纳 8 条待审议目标！')
}

const saveMinutesDraft = () => {
  ElMessage.success('会议纪要草稿已保存')
}

const parseAiAdvice = () => {
  ElMessage.success('AI 已完成纪要深度解析，建议采纳 4 项成稿微调！')
}

const parseRuleAdvice = () => {
  ElMessage.info('规则引擎解析完成')
}
</script>

<style scoped>
.meeting-wrapper {
  max-width: 1080px;
  margin: 0 auto;
}

/* 顶部绿色边框卡片 (截图对应) */
.hero-meeting-card {
  background: #ffffff;
  border: 1px solid #cceee8;
  border-radius: 16px;
  padding: 24px 28px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(31, 42, 55, 0.04);
}

.hm-kicker {
  font-size: 12px;
  font-weight: 800;
  color: #14b8a6;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.hm-title {
  font-size: 19px;
  font-weight: 800;
  color: #1f2a37;
  margin-bottom: 6px;
}

.hm-desc {
  font-size: 13px;
  color: #78859a;
  line-height: 1.55;
  margin-bottom: 18px;
}

.hm-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.btn-primary-blue {
  background: #2f6fd0;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 9px 20px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
}

.btn-soft-gray {
  background: #f0f4f8;
  color: #1f2a37;
  border: 1px solid #e6ecf3;
  border-radius: 8px;
  padding: 9px 18px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
}

/* 折叠 */
.fold-wrap {
  border-top: 1px dashed #e6ecf3;
  padding-top: 12px;
}

.fold-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  font-size: 12.5px;
  color: #3d4d5f;
  font-weight: 600;
}

.ft-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ft-tag {
  font-size: 11px;
  color: #9aa5b5;
}

.info-kv {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12.5px;
  color: #475569;
}

/* 主 Tab 胶囊栏 (截图核心) */
.main-tab-bar {
  display: flex;
  gap: 6px;
  background: #eef2f6;
  padding: 4px;
  border-radius: 10px;
  margin-bottom: 18px;
  width: fit-content;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #78859a;
  cursor: pointer;
  transition: all 0.15s;
}

.tab-btn.active {
  background: #ffffff;
  color: #1f2a37;
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(31, 42, 55, 0.08);
}

.badge-num {
  background: #2f6fd0;
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 10px;
}

/* 蓝色提示条 (截图对应) */
.notice-info-bar {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #eaf2fe;
  border: 1px solid #c2dbfc;
  color: #1f4f9c;
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 16px;
  font-size: 13px;
  line-height: 1.6;
}

.info-ic {
  font-size: 16px;
  font-weight: 800;
}

/* 子筛选 Bar (截图对应) */
.sub-filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.filter-left {
  display: flex;
  gap: 4px;
  background: #f0f4f8;
  padding: 3px;
  border-radius: 8px;
}

.sf-pill {
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}

.sf-pill.active {
  background: #ffffff;
  color: #1f2a37;
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.sf-pill .n {
  font-size: 11px;
  margin-left: 2px;
}

.btn-adopt-all {
  background: #22a06b;
  color: #ffffff;
  border: none;
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.btn-adopt-all:hover {
  background: #1b8558;
}

/* ==================== 目标卡片列表 (截图像素级对齐) ==================== */
.goal-card-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.goal-item-card {
  background: #ffffff;
  border: 1px solid #e6ecf3;
  border-radius: 14px;
  padding: 20px 24px;
  box-shadow: 0 2px 8px rgba(31, 42, 55, 0.03);
}

.gic-top {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 12px;
}

/* 左侧优先级徽标 */
.gic-priority {
  width: 60px;
  background: #f0f4f8;
  border-radius: 8px;
  padding: 8px 4px;
  text-align: center;
  flex-shrink: 0;
}

.p-num {
  display: block;
  font-size: 18px;
  font-weight: 800;
  color: #1f2a37;
  line-height: 1.1;
}

.p-lbl {
  display: block;
  font-size: 10px;
  color: #9aa5b5;
  margin-top: 2px;
}

/* 主内容 */
.gic-main {
  flex: 1;
}

.gic-heading {
  margin-bottom: 6px;
  font-size: 14.5px;
  line-height: 1.5;
}

.g-id {
  color: #2f6fd0;
  font-weight: 800;
  margin-right: 8px;
}

.g-title {
  color: #1f2a37;
  font-weight: 700;
}

.gic-meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: #78859a;
}

.meta-tag {
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.tag-blue {
  background: #eaf2fe;
  color: #2f6fd0;
}

.meta-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 11px;
}

.meta-status.pending {
  background: #fff5e3;
  color: #f59e0b;
}

.meta-status.adopted {
  background: #e8f7ef;
  color: #22a06b;
}

.meta-status.deferred {
  background: #f2edfe;
  color: #8b5cf6;
}

.meta-status.dropped {
  background: #f1f5f9;
  color: #94a3b8;
}

/* 右侧操作按钮 */
.gic-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.btn-act-ok {
  background: #22a06b;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.btn-act-rewrite {
  background: #f0f4f8;
  color: #1f2a37;
  border: 1px solid #e6ecf3;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn-act-more {
  background: none;
  border: none;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
  padding: 6px 8px;
}

/* 为什么建议这一条面板 */
.gic-why-panel {
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 12.5px;
  color: #475569;
  line-height: 1.55;
  margin-bottom: 10px;
}

.gic-why-panel strong {
  color: #1f2a37;
}

/* 折叠行 */
.gic-fold {
  border-top: 1px dashed #e6ecf3;
  padding: 9px 0 3px;
  font-size: 12px;
  color: #3d4d5f;
  cursor: pointer;
}

.gic-fold.flex-between {
  display: flex;
  justify-content: space-between;
}

.cf-left {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cf-right {
  color: #9aa5b5;
}

.gic-fold-body {
  padding: 8px 0 12px;
  font-size: 12.5px;
  color: #475569;
}

.factor-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}

.fp-pill {
  background: #f1f5f9;
  color: #334155;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
}

.fp-tip {
  color: #78859a;
  font-size: 12px;
}

.detail-long {
  background: #f8fafc;
  padding: 10px 14px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
  font-size: 12.5px;
}

.ds-title {
  font-weight: 700;
  color: #1f2a37;
  margin-top: 6px;
  font-size: 12px;
}

.ds-ol, .ds-ul {
  padding-left: 20px;
  font-size: 12.5px;
  line-height: 1.6;
}

/* 纪要与建议 */
.minutes-textarea {
  width: 100%;
  min-height: 150px;
  border: 1px solid #e6ecf3;
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  line-height: 1.6;
  font-family: inherit;
  outline: none;
  margin-top: 10px;
}

.minutes-btn-row {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.btn-soft {
  background: #f0f4f8;
  color: #1f2a37;
  border: 1px solid #e6ecf3;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.btn-primary {
  background: #2f6fd0;
  color: #ffffff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  font-weight: 700;
}

/* 决议卡片 */
.decisions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 14px;
}

.dec-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #e6ecf3;
}

.dec-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

.tag-orange { background: #fff5e3; color: #f59e0b; }
.tag-green { background: #e8f7ef; color: #22a06b; }

.dec-info {
  font-size: 13px;
  color: #1f2a37;
}

.dec-basis {
  font-size: 12px;
  color: #78859a;
  margin-top: 4px;
}
</style>
