<template>
  <div class="intake-wrapper">
    <!-- 标题与副标 (截图完全对齐) -->
    <div class="view-head">
      <div class="vh-left">
        <h2 class="vh-title">
          <svg class="ic" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" style="color:#2f6fd0">
            <path d="M12 16V5m0 0L8 9m4-4l4 4" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
          数据归集台
        </h2>
        <p class="vh-desc">
          输入不是“上传一个文件”，而是四张结构不同的数据表。先解决“怎么进来”，才谈得上“怎么生成”。
        </p>
      </div>
      <button class="btn primary btn-upload-material" @click="openUploadDialog">
        + 上传材料
      </button>
    </div>

    <!-- 顶部绿色进度卡 (截图重点区域) -->
    <div class="hero-completeness-card">
      <div class="hc-kicker">数据完整度 100% · 置信度 高</div>
      <h3 class="hc-title">四类数据齐备，草案可直接用于 IEP 会议讨论</h3>
      <div class="hc-progress-track">
        <div class="hc-progress-bar" style="width: 100%;"></div>
      </div>
      <div class="hc-actions">
        <button class="btn-primary-lg" @click="$router.push('/iep/profile')">
          看跨源能力画像
        </button>
      </div>
      <p class="hc-side-text">四类数据基本齐备，草案可直接用于 IEP 会议讨论。</p>

      <!-- 折叠面板：四类数据各自占多少分 -->
      <div class="fold-wrap">
        <div class="fold-toggle" @click="showWeight = !showWeight">
          <span class="ft-left">
            <span class="arrow">{{ showWeight ? '▼' : '▶' }}</span>
            四类数据各自占多少分
          </span>
          <span class="ft-tag">点开查看</span>
        </div>
        <div v-show="showWeight" class="fold-content">
          <div class="weight-grid">
            <div class="w-item">
              <div class="w-lbl">医学诊断（权重 25）</div>
              <div class="w-val">25 / 25</div>
              <div class="w-bar"><div class="w-bar-fill" style="width:100%"></div></div>
            </div>
            <div class="w-item">
              <div class="w-lbl">教育评估（权重 35）</div>
              <div class="w-val">35 / 35</div>
              <div class="w-bar"><div class="w-bar-fill" style="width:100%"></div></div>
            </div>
            <div class="w-item">
              <div class="w-lbl">教师观察（权重 20）</div>
              <div class="w-val">20 / 20</div>
              <div class="w-bar"><div class="w-bar-fill" style="width:100%"></div></div>
            </div>
            <div class="w-item">
              <div class="w-lbl">家长观察（权重 20）</div>
              <div class="w-val">20 / 20</div>
              <div class="w-bar"><div class="w-bar-fill" style="width:100%"></div></div>
            </div>
          </div>
          <div class="note-foot">
            口径：医学诊断 25% · 教育评估 35%（PEP-3 / VB-MAPP 已结构化，感统按 2/3 计）· 教师观察 20% · 家长观察 20%。权重可在「合规与设置」中调整。
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs 标签栏 -->
    <div class="tab-nav">
      <div class="tab-item" :class="{ active: activeTab === 'source' }" @click="activeTab = 'source'">
        四类数据源
      </div>
      <div class="tab-item" :class="{ active: activeTab === 'files' }" @click="activeTab = 'files'">
        材料清单 <span class="tab-num">4</span>
      </div>
      <div class="tab-item" :class="{ active: activeTab === 'check' }" @click="activeTab = 'check'">
        字段校对 <span class="tab-num">3</span>
      </div>
      <div class="tab-item" :class="{ active: activeTab === 'gap' }" @click="activeTab = 'gap'">
        数据缺口 <span class="tab-num">0</span>
      </div>
    </div>

    <!-- 四类数据源卡片网格 (对齐截图下半部 4 张卡片) -->
    <div v-show="activeTab === 'source'" class="source-grid">
      <!-- 卡片 1: 医学诊断 -->
      <div class="sc-card">
        <div class="sc-head">
          <div class="sc-title-wrap">
            <span class="sc-name">医学诊断</span>
            <span class="badge-g">已解析 · 已确认</span>
          </div>
          <span class="sc-num-circle">①</span>
        </div>
        <div class="sc-desc">已上传并解析确认：医学诊断.docx</div>
        <div class="sc-actions">
          <button class="btn-soft" @click="handleReupload('医学诊断')">重新上传医学诊断</button>
        </div>
        <div class="card-fold" @click="toggleCardFold(1)">
          <span class="cf-t">{{ cardFold[1] ? '▼' : '▶' }} 这张表进来后做什么</span>
          <span class="cf-tag">点开查看</span>
        </div>
        <div v-show="cardFold[1]" class="cf-body">
          抽取临床诊断、病理表现、发育史、用药与禁忌提示，自动关联到 IEP 医学背景章节。
        </div>
      </div>

      <!-- 卡片 2: 教育评估 -->
      <div class="sc-card">
        <div class="sc-head">
          <div class="sc-title-wrap">
            <span class="sc-name">教育评估</span>
            <span class="badge-g">已解析 · 已确认</span>
          </div>
          <span class="sc-num-circle">②</span>
        </div>
        <div class="sc-desc">已上传并解析 3 / 3 份评估报告</div>
        <div class="sc-actions sc-tags-row">
          <button class="btn-soft small" @click="handleReupload('PEP-3')">重传 PEP-3</button>
          <button class="btn-soft small" @click="handleReupload('VB-MAPP')">重传 VB-MAPP</button>
          <button class="btn-soft small" @click="handleReupload('感统')">重传 感统</button>
        </div>
        <div class="card-fold" @click="toggleCardFold(2)">
          <span class="cf-t">{{ cardFold[2] ? '▼' : '▶' }} 这张表进来后做什么</span>
          <span class="cf-tag">点开查看</span>
        </div>
        <div v-show="cardFold[2]" class="cf-body">
          PEP-3、VB-MAPP 与感统测评数据解析后映射至六大发展维度，构成儿童能力基线雷达图。
        </div>
      </div>

      <!-- 卡片 3: 教师观察 -->
      <div class="sc-card">
        <div class="sc-head">
          <div class="sc-title-wrap">
            <span class="sc-name">教师观察</span>
            <span class="badge-g">两张都已回收</span>
          </div>
          <span class="sc-num-circle">③</span>
        </div>
        <div class="sc-desc">小组班 + 融合班观察表，两张都已回收（含时间戳与填写人）</div>
        <div class="sc-actions sc-tags-row">
          <button class="btn-link-action" @click="viewObs('小组班')">查看 小组班表</button>
          <button class="btn-link-action" @click="handleReupload('小组班')">上传</button>
          <button class="btn-link-action" @click="viewObs('融合班')">查看 融合班表</button>
          <button class="btn-link-action" @click="handleReupload('融合班')">上传</button>
        </div>
        <div class="card-fold" @click="toggleCardFold(3)">
          <span class="cf-t">{{ cardFold[3] ? '▼' : '▶' }} 这张表进来后做什么</span>
          <span class="cf-tag">点开查看</span>
        </div>
        <div v-show="cardFold[3]" class="cf-body">
          提取一日生活常规中表现出的注意力、进食、互动与情绪偶发事件，用于生成班级一页纸支持卡。
        </div>
      </div>

      <!-- 卡片 4: 家长观察 -->
      <div class="sc-card">
        <div class="sc-head">
          <div class="sc-title-wrap">
            <span class="sc-name">家长观察</span>
            <span class="badge-g">已回收</span>
          </div>
          <span class="sc-num-circle">④</span>
        </div>
        <div class="sc-desc">居家观察表，家长已提交（含时间戳与填写人）</div>
        <div class="sc-actions sc-tags-row">
          <button class="btn-link-action" @click="viewObs('居家')">查看已提交内容</button>
          <button class="btn-link-action" @click="handleReupload('居家')">上传文件</button>
        </div>
        <div class="card-fold" @click="toggleCardFold(4)">
          <span class="cf-t">{{ cardFold[4] ? '▼' : '▶' }} 这张表进来后做什么</span>
          <span class="cf-tag">点开查看</span>
        </div>
        <div v-show="cardFold[4]" class="cf-body">
          采集居家睡眠、挑食偏好与家庭主要教养人关注焦点，与园内目标对齐并生成家庭任务卡。
        </div>
      </div>
    </div>

    <!-- 材料清单 Tab -->
    <div v-show="activeTab === 'files'" class="files-wrap">
      <div class="card">
        <div class="card-head"><h3>材料清单</h3></div>
        <div class="file-list-p">
          <div class="fl-row"><span>📄 医学诊断.docx</span><span class="badge-g">已解析</span></div>
          <div class="fl-row"><span>📊 PEP-3评估报告单.pdf</span><span class="badge-g">已解析</span></div>
          <div class="fl-row"><span>📝 班级日常行为观察表_10月.xlsx</span><span class="badge-g">已解析</span></div>
          <div class="fl-row"><span>🏡 家长居家行为问卷.pdf</span><span class="badge-g">已解析</span></div>
        </div>
      </div>
    </div>

    <!-- 字段校对 Tab -->
    <div v-show="activeTab === 'check'" class="check-wrap">
      <div class="card">
        <div class="card-head"><h3>字段校对 (低置信度字段人工审核)</h3></div>
        <div class="check-list">
          <div class="ck-item">
            <div class="ck-f">诊断结论：疑似孤独症谱系（社交发起困难，存在情绪问题）</div>
            <el-tag size="small" type="success">高置信度</el-tag>
          </div>
          <div class="ck-item">
            <div class="ck-f">康复建议：言语、社交、感觉统合训练；园内结构化支持</div>
            <el-tag size="small" type="warning">需核对</el-tag>
          </div>
          <div class="ck-item">
            <div class="ck-f">PEP-3 功能发展：68 / 95；发展年龄 43 个月</div>
            <el-tag size="small" type="success">高置信度</el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据缺口 Tab -->
    <div v-show="activeTab === 'gap'" class="gap-wrap">
      <div class="card">
        <div class="card-head"><h3>数据缺口</h3></div>
        <div style="padding:20px;text-align:center;color:#22a06b;font-weight:700">
          ✔ 当前 4 类材料已全部齐备，暂无数据缺口！
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const activeTab = ref('source')
const showWeight = ref(false)
const cardFold = ref({ 1: false, 2: false, 3: false, 4: false })

const toggleCardFold = (idx) => {
  cardFold.value[idx] = !cardFold.value[idx]
}

const openUploadDialog = () => {
  ElMessage.info('已调起材料上传通道，支持 Word/PDF/图片解析')
}

const handleReupload = (name) => {
  ElMessage.info(`重新上传「${name}」材料`)
}

const viewObs = (name) => {
  ElMessage.success(`查看 ${name} 观察表详细记录与时间戳`)
}
</script>

<style scoped>
.intake-wrapper {
  max-width: 1080px;
  margin: 0 auto;
}

.view-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.vh-desc {
  font-size: 13px;
  color: #78859a;
  margin-top: 5px;
}

.btn-upload-material {
  background: #2f6fd0;
  color: #ffffff;
  border: none;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

/* 顶部绿色进度卡 (截图对应) */
.hero-completeness-card {
  background: #ffffff;
  border: 1px solid #cceee8;
  border-radius: 16px;
  padding: 24px 28px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(31, 42, 55, 0.04);
}

.hc-kicker {
  font-size: 12px;
  font-weight: 800;
  color: #14b8a6;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.hc-title {
  font-size: 19px;
  font-weight: 800;
  color: #1f2a37;
  margin-bottom: 12px;
}

.hc-progress-track {
  height: 8px;
  background: #e6faf7;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 16px;
}

.hc-progress-bar {
  height: 100%;
  background: #14b8a6;
  border-radius: 4px;
}

.hc-actions {
  margin-bottom: 12px;
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
}

.hc-side-text {
  font-size: 12.5px;
  color: #78859a;
  margin-bottom: 14px;
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

.ft-left .arrow {
  font-size: 10px;
  color: #78859a;
}

.ft-tag {
  font-size: 11px;
  color: #9aa5b5;
}

.fold-content {
  margin-top: 12px;
  padding-top: 12px;
}

.weight-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.w-item {
  background: #f8fafc;
  padding: 10px;
  border-radius: 8px;
}

.w-lbl {
  font-size: 11px;
  color: #78859a;
}

.w-val {
  font-size: 13px;
  font-weight: 700;
  color: #1f2a37;
  margin: 4px 0;
}

.w-bar {
  height: 5px;
  background: #e6ecf3;
  border-radius: 3px;
  overflow: hidden;
}

.w-bar-fill {
  height: 100%;
  background: #14b8a6;
}

.note-foot {
  font-size: 11.5px;
  color: #9aa5b5;
  margin-top: 12px;
}

/* Tab 栏 */
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

/* 4 张数据源卡片网格 (截图像素级对齐) */
.source-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.sc-card {
  background: #ffffff;
  border: 1px solid #e6ecf3;
  border-radius: 14px;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(31, 42, 55, 0.03);
}

.sc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.sc-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sc-name {
  font-size: 15px;
  font-weight: 800;
  color: #1f2a37;
}

.badge-g {
  background: #e8f7ef;
  color: #22a06b;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}

.sc-num-circle {
  font-size: 14px;
  color: #9aa5b5;
  font-weight: 700;
}

.sc-desc {
  font-size: 12.5px;
  color: #78859a;
  margin-bottom: 14px;
  line-height: 1.5;
}

.sc-actions {
  margin-bottom: 14px;
}

.btn-soft {
  background: #f0f4f8;
  color: #1f2a37;
  border: 1px solid #e6ecf3;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn-soft.small {
  padding: 4px 10px;
}

.sc-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn-link-action {
  background: none;
  border: none;
  color: #2f6fd0;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 2px 4px;
}

.btn-link-action:hover {
  text-decoration: underline;
}

.card-fold {
  border-top: 1px dashed #e6ecf3;
  padding-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #3d4d5f;
  cursor: pointer;
}

.cf-t {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cf-tag {
  color: #9aa5b5;
  font-size: 11px;
}

.cf-body {
  margin-top: 8px;
  padding: 8px 10px;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}

/* 列表样式 */
.file-list-p {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
}

.fl-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
}

.check-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ck-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 13px;
}
</style>
