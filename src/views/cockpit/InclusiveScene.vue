<template>
  <div class="inclusive-page">
    <!-- 顶部导航 -->
    <header class="top-bar">
      <div class="logo-area" @click="$router.push('/cockpit')">
        <div class="logo-badge">融</div>
        <span class="logo-title">融AI 数字驾驶舱</span>
      </div>
      <div class="spacer"></div>
      <div class="search-input">
        <el-icon><Search /></el-icon>
        <input placeholder="全局搜索：学生 / 课程 / 功能" />
      </div>
      <div class="top-actions">
        <el-tooltip content="进入融IEP工作台" placement="bottom">
          <el-button type="primary" plain round size="small" @click="$router.push('/iep/home')">
            <el-icon style="margin-right: 4px"><Platform /></el-icon> 融IEP工作台
          </el-button>
        </el-tooltip>
        <div class="user-chip">
          <div class="user-avatar">JN</div>
          <span>JN01</span>
        </div>
      </div>
    </header>

    <main class="page-body">
      <!-- 面包屑 -->
      <nav class="breadcrumb">
        <span class="crumb-back" @click="$router.push('/cockpit')">
          <el-icon><ArrowLeft /></el-icon> 场景
        </span>
        <span class="crumb-sep">/</span>
        <span class="crumb-current">随班就读融合教育</span>
      </nav>

      <!-- 绿色渐变 Hero Banner -->
      <section class="hero-banner">
        <div class="hero-left">
          <div class="hero-icon-box">
            <el-icon :size="34"><UserFilled /></el-icon>
          </div>
          <div class="hero-titles">
            <h1 class="hero-main-title">随班就读融合教育</h1>
            <p class="hero-sub-title">普通学校随班就读 · 资源教室支持</p>
          </div>
        </div>

        <div class="hero-stats">
          <div class="stat-group">
            <div class="stat-number">{{ sceneData.statStudents || 14 }}</div>
            <div class="stat-label">随班学生</div>
          </div>
          <div class="stat-group">
            <div class="stat-number">{{ sceneData.statRate || '91%' }}</div>
            <div class="stat-label">课堂适应率</div>
          </div>
          <div class="stat-group">
            <div class="stat-number">{{ sceneData.statSupport || 12 }}</div>
            <div class="stat-label">本周支持</div>
          </div>
        </div>
      </section>

      <!-- 三大业务线卡片 (LINE 01 / LINE 02 / LINE 03) -->
      <section class="lines-grid">
        <div 
          v-for="(line, idx) in lines" 
          :key="line.id" 
          class="line-card"
          @click="handleNavigate(line.targetRoute)"
        >
          <div class="card-header">
            <div class="card-icon">
              <el-icon :size="24">
                <Monitor v-if="idx === 0" />
                <Notebook v-else-if="idx === 1" />
                <UserFilled v-else />
              </el-icon>
            </div>
            <div class="card-headings">
              <div class="line-badge">{{ line.lineNo }}</div>
              <h2 class="line-title">{{ line.name }}</h2>
            </div>
          </div>

          <div class="card-tasks">
            <div 
              v-for="task in line.tasks" 
              :key="task.id" 
              class="task-row"
              @click.stop="handleNavigate(task.targetRoute || line.targetRoute)"
            >
              <div class="task-dot"></div>
              <div class="task-name">{{ task.title }}</div>
              <div class="task-badge" :class="task.badgeStatus">
                {{ task.badgeText }}
              </div>
            </div>
          </div>

          <div class="card-footer">
            <span class="enter-link">
              进入
              <el-icon class="arrow-ic"><ArrowRight /></el-icon>
            </span>
          </div>
        </div>
      </section>

      <!-- 底部折叠的其他功能 -->
      <section class="extra-section">
        <div class="extra-toggle" @click="showExtra = !showExtra">
          <div class="toggle-left">
            <span class="dot-ring"></span>
            <span>其他功能 (12) · 非高频但可随时使用</span>
          </div>
          <div class="toggle-right">
            <span>{{ showExtra ? '收起' : '展开' }}</span>
            <el-icon :class="{ 'rotate-180': showExtra }"><ArrowDown /></el-icon>
          </div>
        </div>

        <transition name="el-zoom-in-top">
          <div v-show="showExtra" class="extra-grid">
            <div class="extra-item" @click="$router.push('/iep/archive')">
              <span class="item-ic">📁</span>
              <span>学生档案中心</span>
            </div>
            <div class="extra-item" @click="$router.push('/iep/doc')">
              <span class="item-ic">📄</span>
              <span>IEP文书与方案</span>
            </div>
            <div class="extra-item" @click="$router.push('/iep/track')">
              <span class="item-ic">📊</span>
              <span>课堂适应观测</span>
            </div>
            <div class="extra-item" @click="$router.push('/iep/goals')">
              <span class="item-ic">📅</span>
              <span>资源教室课表</span>
            </div>
            <div class="extra-item" @click="$router.push('/iep/meeting')">
              <span class="item-ic">🤝</span>
              <span>家校沟通协同</span>
            </div>
            <div class="extra-item" @click="$router.push('/iep/home')">
              <span class="item-ic">💡</span>
              <span>AI辅具与策略建议</span>
            </div>
          </div>
        </transition>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { cockpitApi } from '../../api'

const router = useRouter()
const sceneData = ref({})
const lines = ref([])
const showExtra = ref(false)

const loadInclusiveData = async () => {
  try {
    const res = await cockpitApi.getSceneDetail('inclusive')
    if (res) {
      sceneData.value = res.scene || {}
      lines.value = res.lines || []
    }
  } catch (err) {
    console.error('Failed to load inclusive data from backend:', err)
  }
}

const handleNavigate = (route) => {
  if (route) {
    router.push(route)
  } else {
    router.push('/iep/home')
  }
}

onMounted(() => {
  loadInclusiveData()
})
</script>

<style scoped>
.inclusive-page {
  min-height: 100vh;
  background-color: #f6f8fb;
  display: flex;
  flex-direction: column;
}

/* 顶部导航 */
.top-bar {
  height: 60px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #e8edf3;
  display: flex;
  align-items: center;
  padding: 0 28px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.logo-badge {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 800;
  font-size: 15px;
}

.logo-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.spacer {
  flex: 1;
}

.search-input {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f1f5f9;
  padding: 7px 14px;
  border-radius: 20px;
  width: 260px;
  margin-right: 18px;
}

.search-input input {
  border: none;
  background: none;
  outline: none;
  font-size: 12.5px;
  width: 100%;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 4px;
  border-radius: 20px;
  background: #f1f5f9;
  font-size: 12.5px;
  font-weight: 600;
}

.user-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #0d9488;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}

/* 主体容器 */
.page-body {
  flex: 1;
  max-width: 1380px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 32px 48px;
}

/* 面包屑 */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 20px;
  color: #94a3b8;
}

.crumb-back {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #475569;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s;
}

.crumb-back:hover {
  color: #0d9488;
}

.crumb-sep {
  color: #cbd5e1;
}

.crumb-current {
  color: #64748b;
  font-weight: 500;
}

/* 绿色渐变 Hero Banner */
.hero-banner {
  background: linear-gradient(135deg, #0d9488 0%, #115e59 100%);
  border-radius: 20px;
  padding: 26px 36px;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  box-shadow: 0 4px 16px rgba(13, 148, 136, 0.15);
  position: relative;
  overflow: hidden;
}

.hero-banner::after {
  content: '';
  position: absolute;
  top: -60px;
  right: 180px;
  width: 240px;
  height: 240px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  pointer-events: none;
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.hero-icon-box {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-main-title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.3px;
  margin-bottom: 4px;
}

.hero-sub-title {
  font-size: 13.5px;
  opacity: 0.88;
}

.hero-stats {
  display: flex;
  gap: 48px;
}

.stat-group {
  text-align: center;
}

.stat-number {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.1;
}

.stat-label {
  font-size: 12px;
  opacity: 0.82;
  margin-top: 4px;
}

/* 三大业务线卡片 */
.lines-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
  margin-bottom: 24px;
}

.line-card {
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  display: flex;
  flex-direction: column;
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
  cursor: pointer;
  overflow: hidden;
}

.line-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  border-color: #cbd5e1;
}

.card-header {
  padding: 22px 22px 14px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.card-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: #f0fdfa;
  color: #0d9488;
  display: flex;
  align-items: center;
  justify-content: center;
}

.line-badge {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #0d9488;
  text-transform: uppercase;
}

.line-title {
  font-size: 17px;
  font-weight: 800;
  color: #0f172a;
}

.card-tasks {
  padding: 8px 22px 18px;
  display: flex;
  flex-direction: column;
  gap: 11px;
  flex: 1;
}

.task-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 8px;
  transition: background 0.15s;
}

.task-row:hover {
  background: #f8fafc;
}

.task-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f59e0b;
}

.task-name {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  flex: 1;
}

.task-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}

.task-badge.warn {
  background: #fffbeb;
  color: #d97706;
}

.task-badge.ok {
  background: #ecfdf5;
  color: #059669;
}

.task-badge.info {
  background: #f1f5f9;
  color: #64748b;
}

.card-footer {
  padding: 14px 22px;
  border-top: 1px solid #f1f5f9;
  background: #fafbfc;
}

.enter-link {
  font-size: 13px;
  font-weight: 700;
  color: #0d9488;
  display: flex;
  align-items: center;
  gap: 4px;
}

.arrow-ic {
  font-size: 12px;
  transition: transform 0.2s;
}

.line-card:hover .arrow-ic {
  transform: translateX(4px);
}

/* 底部扩展面板 */
.extra-section {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e8edf3;
  padding: 14px 20px;
}

.extra-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
}

.toggle-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dot-ring {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid #94a3b8;
}

.toggle-right {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.rotate-180 {
  transform: rotate(180deg);
}

.extra-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #e2e8f0;
}

.extra-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  border-radius: 10px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  text-align: center;
}

.extra-item:hover {
  background: #f0fdfa;
  color: #0d9488;
}

.item-ic {
  font-size: 20px;
}
</style>
