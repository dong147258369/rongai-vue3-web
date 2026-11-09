<template>
  <div class="home-wrapper">
    <!-- ================= 身份 1：教师（主用户）· 100% 对齐原型截图 ================= -->
    <template v-if="userStore.currentRole === 'teacher'">
      <div class="teacher-view">
        <!-- 页面标题与导语 -->
        <div class="view-head">
          <h2 class="vh-title"><span class="icon">🏠</span> 工作台</h2>
          <p class="vh-desc">
            你好，教师。融IEP 把四类数据汇入六维引擎，输出可编辑的 IEP 草案 —— AI 只出草案，由 IEP 团队确认后才生效。
          </p>
        </div>

        <!-- 顶部引导卡片：第 2 步 · 目标审议 (截图重点) -->
        <div class="step-card">
          <div class="step-kicker">第 2 步 · 目标审议</div>
          <h3 class="step-title">审议 8 条待确认目标（系统已按优先级排好序）</h3>
          <p class="step-desc">
            引擎按 6 个能力维度从已入档数据推出 8 条目标，每条都带长期目标、短期目标与两套策略。逐条确认或改写后，才能进入 IEP 会议。
          </p>
          <div class="step-btn-group">
            <button class="btn-primary-lg" @click="$router.push('/iep/meeting')">
              去 IEP 会议调校与审议
            </button>
            <button class="btn-soft-lg" @click="currentTab = 'support'">
              看今日支持卡
            </button>
          </div>
          <div class="step-side-note">
            所有目标默认为「待审议」，未经教师确认不得作为正式 IEP 使用。
          </div>
        </div>

        <!-- Tabs 选项卡 (截图对应：待办 2 / 今日支持卡 / 责任分工 / 个案概览 / 学期节点 / 最近留痕) -->
        <div class="tab-nav">
          <div 
            class="tab-item" 
            :class="{ active: currentTab === 'todo' }"
            @click="currentTab = 'todo'"
          >
            待办 <span class="tab-num">2</span>
          </div>
          <div 
            class="tab-item" 
            :class="{ active: currentTab === 'support' }"
            @click="currentTab = 'support'"
          >
            今日支持卡
          </div>
          <div 
            class="tab-item" 
            :class="{ active: currentTab === 'duty' }"
            @click="currentTab = 'duty'"
          >
            责任分工
          </div>
          <div 
            class="tab-item" 
            :class="{ active: currentTab === 'overview' }"
            @click="currentTab = 'overview'"
          >
            个案概览
          </div>
          <div 
            class="tab-item" 
            :class="{ active: currentTab === 'milestone' }"
            @click="currentTab = 'milestone'"
          >
            学期节点
          </div>
          <div 
            class="tab-item" 
            :class="{ active: currentTab === 'log' }"
            @click="currentTab = 'log'"
          >
            最近留痕
          </div>
        </div>

        <!-- Tab 内容区 -->
        <div class="tab-pane-content">
          <!-- 1. 今日支持卡 (截图完全对齐激活页) -->
          <div v-show="currentTab === 'support'" class="support-card-wrap">
            <div class="support-card">
              <h3 class="sc-title">
                <span class="heart">♡</span> 一页纸班级支持卡 · {{ userStore.currentCase.alias }}
              </h3>

              <!-- 浅绿高亮框：这个孩子是谁（3 句话） -->
              <div class="who-box">
                <div class="wb-head">这个孩子是谁（3 句话）</div>
                <div class="wb-line">① 豆豆，3 岁 7 个月，半日融合班，园内编号 C-2026-048。</div>
                <div class="wb-line">
                  ② 优势：认知（82）、语言（75）、自理（74）—— 拼图、形状配对、模仿是最好用的入口。
                </div>
                <div class="wb-line">
                  ③ 需要支持：情绪、社交、运动 —— 尤其是主动发起同伴互动和做难任务时的急躁。
                </div>
              </div>

              <!-- 本学期 3 个最重要目标 -->
              <div class="sc-section">
                <h4 class="sec-head">本学期 3 个最重要目标</h4>
                <ol class="sec-ol">
                  <li>尚无已采纳目标，请先到「<a href="javascript:;" @click="$router.push('/iep/meeting')" style="color:#2f6fd0">IEP 会议调校与审议</a>」审议。</li>
                </ol>
              </div>

              <!-- 具体做法（含辅助层级） -->
              <div class="sc-section">
                <h4 class="sec-head">具体做法（含辅助层级）</h4>
                <ul class="sec-ul">
                  <li><strong>提要求：</strong>他要东西时先等 3 秒，指自己说“我”，指他说“你”；辅助层级 手势 → 示范 → 口语，每 3 天撤一级。</li>
                  <li><strong>同伴互动：</strong>先固定 2 名温和同伴，老师用“旁白式示范”——“你看，××拿小车，他想和豆豆一起玩”。</li>
                  <li><strong>难任务：</strong>拆成小一步，桌上放“自己试 / 请帮忙 / 休息一下”三张卡，教会说“我需要休息”。</li>
                </ul>
              </div>

              <!-- 强化物与偏好 -->
              <div class="sc-section">
                <h4 class="sec-head">强化物与偏好</h4>
                <div class="badge-list">
                  <span class="sc-badge violet">拼图</span>
                  <span class="sc-badge blue">数字卡片</span>
                  <span class="sc-badge green">足球 / 投沙包</span>
                  <span class="sc-badge teal">手指律动</span>
                  <span class="sc-badge amber">当“小老师”</span>
                  <span class="muted-note">（抵触水果、酸奶）</span>
                </div>
              </div>

              <!-- 情绪预警信号与应对步骤 -->
              <div class="sc-section">
                <h4 class="sec-head">情绪预警信号与应对步骤</h4>
                <div class="warn-step-box">
                  <div class="warn-line"><strong>预警信号：</strong>音量升高、推开材料、重复语言增多、身体转开。</div>
                  <div class="warn-line">
                    <strong>应对：</strong>① 降低当下要求 → ② 给“我需要休息”卡 → 3–5 分钟安静角 → ③ 回来做“小一步” → ④ 当天记录一次发生频次。
                  </div>
                </div>
              </div>

              <div class="sc-foot-divider"></div>
              <div class="sc-footer-note">
                责任分工：融合教师 李老师 统筹 · 班级 / 小组 / 密训 / 感统教师按分工执行 · 本卡随 IEP 更新
              </div>
            </div>
          </div>

          <!-- 2. 待办 2 -->
          <div v-show="currentTab === 'todo'" class="todo-wrap">
            <div class="card">
              <div class="card-head">
                <h3>待办与提醒</h3>
                <span class="desc">2 项未完成 · 系统把节点做成待办，而不是靠人记</span>
              </div>
              <div class="todo-item urgent">
                <input type="checkbox" v-model="todo1" />
                <div class="todo-tx">
                  <b>审议 8 条待确认目标</b>
                  <p>融合教师 李老师 · 2026-11-06 · <span style="color:#e0577a;font-weight:700">紧急</span></p>
                </div>
              </div>
              <div class="todo-item">
                <input type="checkbox" v-model="todo2" />
                <div class="todo-tx">
                  <b>补齐居家日常视频与照片</b>
                  <p>家长 · 2026-11-08</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. 责任分工 -->
          <div v-show="currentTab === 'duty'" class="duty-wrap">
            <div class="card">
              <div class="card-head">
                <h3>这个孩子由谁负责什么</h3>
                <span class="desc">五类教师 + 家长 + 园所</span>
              </div>
              <div class="duty-grid">
                <div class="duty-box">
                  <h4>融合教师 <span class="tag-b">统筹</span></h4>
                  <div class="scope">负责 IEP 目标全流程制定与多学科统筹</div>
                  <ul><li>召集多学科 IEP 审议会议</li><li>统筹班级一页纸支持卡执行</li></ul>
                  <div class="freq">每周 5 天在园跟进</div>
                </div>
                <div class="duty-box">
                  <h4>班级主班 / 配班教师 <span class="tag-gray">日常</span></h4>
                  <div class="scope">随班融合课堂环境与一日生活观察</div>
                  <ul><li>在晨间活动和集体教学中执行支持卡</li><li>每日记录一次情绪与行为卡片</li></ul>
                  <div class="freq">每日生活与集体活动</div>
                </div>
                <div class="duty-box">
                  <h4>感统 / 密训特教老师 <span class="tag-gray">专训</span></h4>
                  <div class="scope">资源教室个训与缺陷补偿训练</div>
                  <ul><li>前额叶专注力执行功能小步子训练</li><li>双唇音与构音清晰度个别矫治</li></ul>
                  <div class="freq">每周 2 次，每次 30 分钟</div>
                </div>
                <div class="duty-box">
                  <h4>幼儿家长 <span class="tag-gray">协同</span></h4>
                  <div class="scope">家庭任务卡居家配合与周末反馈</div>
                  <ul><li>落实进食“嚼完 5 口再咽”</li><li>落实“我要××”手势统一与提示</li></ul>
                  <div class="freq">每日家庭场景</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. 个案概览 -->
          <div v-show="currentTab === 'overview'" class="overview-wrap">
            <div class="card">
              <div class="card-head">
                <h3>六维能力画像与基线概览</h3>
                <span class="desc">基线 → 当前 → 学期目标，三条同口径可比</span>
              </div>
              <div class="grid g2" style="margin-top:16px;">
                <div class="card tight">
                  <h4>能力维度得分</h4>
                  <div style="padding:16px 0;display:flex;flex-direction:column;gap:10px;">
                    <div>认知 (82)：优势领域</div>
                    <div>语言 (75)：良好</div>
                    <div>自理 (74)：良好</div>
                    <div>运动 (61)：需支持</div>
                    <div>社交 (54)：需支持</div>
                    <div>情绪 (48)：重点突破</div>
                  </div>
                </div>
                <div class="card tight">
                  <h4>干预入口说明</h4>
                  <p style="color:#64748b;font-size:13px;line-height:1.7;">
                    豆豆的认知与自理是极佳的突破口。通过“先强后弱”、“优势带劣势”的策略，将拼图和形状卡片作为完成困难任务后的首选强化物，能显著降低做难任务时的急躁抵抗行为。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- 5. 学期节点 -->
          <div v-show="currentTab === 'milestone'" class="milestone-wrap">
            <div class="card">
              <div class="card-head">
                <h3>学期 IEP 推进五大节点</h3>
              </div>
              <div style="padding:16px;line-height:2;font-size:13px;">
                <div>✔ <strong>第 1 步 · 数据归集与建档：</strong>已完成日常观察表与家长观察归集（10月28日）</div>
                <div>▶ <strong style="color:#2f6fd0">第 2 步 · 目标建议与审议：</strong>当前节点，8 条目标待确认</div>
                <div>○ <strong>第 3 步 · 会议调校与联签：</strong>拟定于 11月10日召开联合会议</div>
                <div>○ <strong>第 4 步 · 成稿生效与导出：</strong>IEP 2.0 正式生效</div>
                <div>○ <strong>第 5 步 · 月度执行与复审：</strong>学期中月度达成跟踪</div>
              </div>
            </div>
          </div>

          <!-- 6. 最近留痕 -->
          <div v-show="currentTab === 'log'" class="log-wrap">
            <div class="card">
              <div class="card-head">
                <h3>系统操作与审计留痕</h3>
                <span class="desc">记录所有角色查看、编辑、确认与导出的历史留痕</span>
              </div>
              <div style="padding:16px;display:flex;flex-direction:column;gap:10px;font-size:12.5px;color:#64748b;">
                <div>• 2026-11-04 18:22 教师 李老师「切换身份」：以「教师（主用户）」身份进入系统</div>
                <div>• 2026-11-04 17:05 教师 李老师「数据归集」：上传班级观察表 1 份并完成解析</div>
                <div>• 2026-11-03 14:10 家长「填写观察」：提交居家生活自理观察问卷</div>
                <div>• 2026-11-02 09:30 外部专家「会诊留痕」：录入巡回专家指导初步评估意见</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ================= 身份 2：家长身份 (对齐前序截图) ================= -->
    <template v-else-if="userStore.currentRole === 'parent'">
      <div class="parent-view">
        <div class="view-head">
          <h2 class="vh-title"><span class="icon">🏠</span> 工作台</h2>
          <p class="vh-desc">
            你好，这里是你孩子这学期的练习重点，和家里能配合的几件小事；看不懂的地方可以直接问老师。
          </p>
        </div>

        <div class="step-card parent-week-card">
          <div class="step-kicker">本周配合</div>
          <h3 class="step-title">照着家庭任务卡做，并在周末反馈一次</h3>
          <p class="step-desc">
            本轮 4 个小任务。每个都写了“怎么算成功”。做不到也没关系，如实反馈就是有用的信息。
          </p>
          <div class="step-btn-group">
            <button class="btn-primary-lg" @click="parentTab = 'task'">查看本轮任务</button>
          </div>
        </div>

        <div class="tab-nav">
          <div class="tab-item" :class="{ active: parentTab === 'task' }" @click="parentTab = 'task'">
            家庭任务 <span class="tab-num">4</span>
          </div>
          <div class="tab-item" :class="{ active: parentTab === 'summary' }" @click="parentTab = 'summary'">
            孩子的 IEP 摘要
          </div>
        </div>

        <div v-show="parentTab === 'task'" class="support-card-wrap">
          <div class="support-card" style="border:2px dashed #f0b95e;background:#fffdf7">
            <h3 class="sc-title" style="color:#b45309">
              <span class="heart">♡</span> 家庭任务卡
              <span class="sc-badge amber" style="font-size:11px;margin-left:8px">每两周 1–2 个动作 · 家长无需打分</span>
            </h3>

            <div class="family-tasks-grid">
              <div class="ft-item">
                <div class="ft-tag">第 1–2 周</div>
                <div class="ft-action"><b>做什么：</b>进食“嚼完 5 口再咽”：开饭前先约定，吃到第 5 口时家长指一下嘴边做咀嚼示范，不催不喂。</div>
                <div class="ft-meta"><b>时间：</b>每天午餐与晚餐，各 1 次</div>
                <div class="ft-meta"><b>怎么算成功：</b>一餐中能被提醒 ≤2 次就放慢速度</div>
                <div class="ft-meta" style="color:#14b8a6"><b>观察提示：</b>记录哪类食物最容易直接吞咽</div>
              </div>

              <div class="ft-item">
                <div class="ft-tag">第 1–2 周</div>
                <div class="ft-action"><b>做什么：</b>“我要××”手势统一：递东西时指自己说“我”，指孩子说“你”；孩子说“我要”时立刻给。</div>
                <div class="ft-meta"><b>时间：</b>全天生活场景，随机</div>
                <div class="ft-meta"><b>怎么算成功：</b>每天主动说“我要”≥5 次</div>
                <div class="ft-meta" style="color:#14b8a6"><b>观察提示：</b>记下最常用来提要求的 3 个物品</div>
              </div>

              <div class="ft-item">
                <div class="ft-tag">第 3–4 周</div>
                <div class="ft-action"><b>做什么：</b>轮流小游戏：轮流推小车 / 搭积木，用玩偶当“轮流棒”，谁拿到谁玩。</div>
                <div class="ft-meta"><b>时间：</b>每天 3–5 分钟</div>
                <div class="ft-meta"><b>怎么算成功：</b>能等 2 轮不抢</div>
                <div class="ft-meta" style="color:#14b8a6"><b>观察提示：</b>等待时他会用什么方式表达着急</div>
              </div>

              <div class="ft-item">
                <div class="ft-tag">第 3–4 周</div>
                <div class="ft-action"><b>做什么：</b>出门前预告：“我们先去超市，再回家”——用两句话说清顺序，说完再出门。</div>
                <div class="ft-meta"><b>时间：</b>每次出门前</div>
                <div class="ft-meta"><b>怎么算成功：</b>出门前急躁次数减少</div>
                <div class="ft-meta" style="color:#14b8a6"><b>观察提示：</b>哪类预告最有效（说顺序 / 看图片 / 数到三）</div>
              </div>
            </div>
          </div>
        </div>

        <div v-show="parentTab === 'summary'" class="summary-tab-content">
          <div class="card">
            <div class="card-head">
              <h3>孩子的 IEP 摘要</h3>
              <span class="sc-badge green">融合教师已确认并发送</span>
            </div>
            <div style="font-size:13px;color:#3d4d5f;line-height:1.7;">
              <p><strong>孩子现在能做什么：</strong>能自己上厕所、穿脱衣服鞋袜、接水喝，会自己搬椅子、收玩具；精细动作和拼图表现良好。</p>
              <p style="margin-top:8px"><strong>我们打算帮他学什么：</strong>提升主动发起轮流游戏意愿；进食慢嚼细咽；遇到难任务学会举卡说“我需要休息”。</p>
              <p style="margin-top:8px"><strong>家里可以怎么配合：</strong>按照上面的 4 张家庭任务卡实施，不强迫、不急躁，周末通过微信或问卷与教师反馈一次即可。</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ================= 身份 3 & 4：园长与外部专业 ================= -->
    <template v-else>
      <div class="other-role-view">
        <div class="view-head">
          <h2 class="vh-title"><span class="icon">🏠</span> 工作台 · {{ userStore.activeRole.name }}</h2>
          <p class="vh-desc">{{ userStore.activeRole.hint }}</p>
        </div>

        <div class="card">
          <div class="card-head">
            <h3>{{ userStore.currentRole === 'principal' ? '全园融合教育督导' : '外部专业人员会诊工作台' }}</h3>
          </div>
          <p style="padding:16px;color:#64748b;font-size:13px;">
            您当前以「{{ userStore.activeRole.name }}」身份浏览，数据已按权限范围展示。
          </p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../store/user'

const router = useRouter()
const userStore = useUserStore()

const currentTab = ref('support') // 默认激活 "今日支持卡"
const parentTab = ref('task')
const todo1 = ref(false)
const todo2 = ref(false)
</script>

<style scoped>
.home-wrapper {
  max-width: 1080px;
  margin: 0 auto;
}

/* 页面顶部标题与导语 (截图像素级对齐) */
.view-head {
  margin-bottom: 20px;
}

.vh-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 19px;
  font-weight: 800;
  color: #1f2a37;
}

.vh-title .icon {
  font-size: 18px;
}

.vh-desc {
  font-size: 13px;
  color: #78859a;
  margin-top: 5px;
  line-height: 1.5;
}

/* 引导卡片：第 2 步 · 目标审议 */
.step-card {
  background: #ffffff;
  border: 1px solid #e6ecf3;
  border-radius: 16px;
  padding: 24px 28px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(31, 42, 55, 0.04);
}

.step-kicker {
  font-size: 12px;
  font-weight: 800;
  color: #2f6fd0;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.step-title {
  font-size: 19px;
  font-weight: 800;
  color: #1f2a37;
  margin-bottom: 6px;
}

.step-desc {
  font-size: 13px;
  color: #78859a;
  line-height: 1.55;
  margin-bottom: 18px;
}

.step-btn-group {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.btn-primary-lg {
  background: #2f6fd0;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 9px 20px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary-lg:hover {
  background: #1f4f9c;
}

.btn-soft-lg {
  background: #f0f4f8;
  color: #1f2a37;
  border: 1px solid #e6ecf3;
  border-radius: 8px;
  padding: 9px 18px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-soft-lg:hover {
  background: #e6ecf3;
}

.step-side-note {
  font-size: 12px;
  color: #9aa5b5;
}

/* Tabs 标签栏 */
.tab-nav {
  display: flex;
  gap: 6px;
  background: #eef2f6;
  padding: 4px;
  border-radius: 10px;
  margin-bottom: 18px;
  width: fit-content;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #78859a;
  cursor: pointer;
  transition: all 0.15s;
}

.tab-item:hover {
  color: #1f2a37;
}

.tab-item.active {
  background: #ffffff;
  color: #1f2a37;
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(31, 42, 55, 0.08);
}

.tab-num {
  background: #e6ecf3;
  color: #3d4d5f;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 10px;
}

.tab-item.active .tab-num {
  background: #2f6fd0;
  color: #ffffff;
}

/* ================= 今日支持卡 (截图像素级对齐) ================= */
.support-card {
  background: #ffffff;
  border: 2px dashed #14b8a6;
  border-radius: 16px;
  padding: 24px 28px;
  box-shadow: 0 2px 8px rgba(31, 42, 55, 0.04);
}

.sc-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 800;
  color: #1f2a37;
  margin-bottom: 16px;
}

.heart {
  color: #14b8a6;
  font-size: 18px;
}

/* 这个孩子是谁（3句话）浅绿高亮框 */
.who-box {
  background: #e6faf7;
  border-radius: 10px;
  padding: 14px 18px;
  margin-bottom: 18px;
}

.wb-head {
  font-size: 13.5px;
  font-weight: 800;
  color: #0d766e;
  margin-bottom: 6px;
}

.wb-line {
  font-size: 13px;
  color: #115e59;
  line-height: 1.6;
}

/* 各章节样式 */
.sc-section {
  margin-bottom: 16px;
}

.sec-head {
  font-size: 13.5px;
  font-weight: 800;
  color: #1f2a37;
  margin-bottom: 6px;
}

.sec-ol, .sec-ul {
  padding-left: 20px;
  font-size: 13px;
  color: #3d4d5f;
  line-height: 1.65;
}

.badge-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.sc-badge {
  font-size: 11.5px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 6px;
}

.sc-badge.violet { background: #f2edfe; color: #8b5cf6; }
.sc-badge.blue { background: #eaf2fe; color: #2f6fd0; }
.sc-badge.green { background: #e8f7ef; color: #22a06b; }
.sc-badge.teal { background: #e6faf7; color: #14b8a6; }
.sc-badge.amber { background: #fff5e3; color: #f59e0b; }

.muted-note {
  font-size: 12px;
  color: #9aa5b5;
}

.warn-step-box {
  background: #f8fafc;
  border: 1px solid #e6ecf3;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 12.5px;
  color: #3d4d5f;
  line-height: 1.6;
}

.sc-foot-divider {
  height: 1px;
  background: #e6ecf3;
  margin: 18px 0 12px;
}

.sc-footer-note {
  font-size: 12px;
  color: #9aa5b5;
}

/* 待办卡片 */
.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 8px;
  background: #f8fafc;
  margin-top: 10px;
}

.todo-item.urgent {
  background: #fff5f7;
  border-left: 3px solid #e0577a;
}

.todo-tx b {
  font-size: 13px;
  color: #1f2a37;
}

.todo-tx p {
  font-size: 11.5px;
  color: #78859a;
  margin-top: 2px;
}

/* 责任分工 */
.duty-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 14px;
}

.duty-box {
  background: #f8fafc;
  border: 1px solid #e6ecf3;
  border-radius: 10px;
  padding: 14px;
}

.duty-box h4 {
  font-size: 13.5px;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.tag-b { background: #eaf2fe; color: #2f6fd0; font-size: 11px; padding: 1px 6px; border-radius: 4px; }
.tag-gray { background: #e6ecf3; color: #64748b; font-size: 11px; padding: 1px 6px; border-radius: 4px; }

.duty-box .scope { font-size: 12px; color: #78859a; margin-bottom: 6px; }
.duty-box ul { padding-left: 18px; font-size: 12px; color: #3d4d5f; }
.duty-box .freq { font-size: 11.5px; color: #9aa5b5; margin-top: 8px; }

/* 家长端家庭任务卡 */
.family-tasks-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 14px;
}

.ft-item {
  background: #ffffff;
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 14px 18px;
  font-size: 12.5px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.ft-tag {
  background: #fef3c7;
  color: #b45309;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  width: fit-content;
}
</style>
