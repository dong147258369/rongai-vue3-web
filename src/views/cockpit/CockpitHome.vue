<template>
  <div class="cockpit-container">
    <!-- 顶部导航 -->
    <header class="top-nav">
      <div class="logo">
        <div class="logo-ic">融</div>
        <div class="logo-tx">融AI 数字驾驶舱</div>
      </div>
      <div class="spacer"></div>
      <div class="search-box">
        <el-icon><Search /></el-icon>
        <input placeholder="全局搜索：学生 / 课程 / 功能" />
      </div>
      <div class="user-pill">
        <div class="avatar">JN</div>
        <span>JN01 资源特教老师</span>
      </div>
    </header>

    <!-- 主体内容 -->
    <main class="cockpit-content">
      <div class="header-intro">
        <h1>融AI <em>智慧特教与融合教育</em> 数字驾驶舱</h1>
        <p>全域数据驱动 · 随班就读全周期个别化教育支持系统 (RongAI × RongIEP)</p>
      </div>

      <!-- 场景选择网格 -->
      <div class="scene-grid">
        <div 
          v-for="item in scenes" 
          :key="item.id" 
          :class="['scene-card', item.cls]"
          @click="goToScene(item.sceneKey)"
        >
          <div class="sc-top">
            <div class="sc-icon">
              <el-icon :size="28"><component :is="getSceneIcon(item.sceneKey)" /></el-icon>
            </div>
            <div class="sc-arrow">
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>

          <h2 class="sc-title">{{ item.name }}</h2>
          <p class="sc-desc">{{ item.description }}</p>

          <div class="sc-stats">
            <div class="stat-pill">
              <span class="num">{{ item.statStudents }}</span>
              <span class="lbl">学生档案</span>
            </div>
            <div class="stat-pill">
              <span class="num">{{ item.statRate }}</span>
              <span class="lbl">达标/适应率</span>
            </div>
            <div class="stat-pill">
              <span class="num">{{ item.statSupport }}</span>
              <span class="lbl">本周支持/个案</span>
            </div>
          </div>

          <div class="sc-footer">
            <span class="enter-btn">进入场景驾驶舱</span>
          </div>
        </div>
      </div>

      <!-- 统计栏 -->
      <div class="quick-strip">
        <div class="strip-item" @click="$router.push('/iep/archive')">
          <div class="st-icon" style="background:#e0f2fe;color:#0284c7"><el-icon><User /></el-icon></div>
          <div>
            <div class="st-val">148 名</div>
            <div class="st-lbl">全域特需学生底册库</div>
          </div>
        </div>
        <div class="strip-item" @click="$router.push('/iep/goals')">
          <div class="st-icon" style="background:#dcfce7;color:#16a34a"><el-icon><Aim /></el-icon></div>
          <div>
            <div class="st-val">342 项</div>
            <div class="st-lbl">IEP个性化长短期目标</div>
          </div>
        </div>
        <div class="strip-item" @click="$router.push('/iep/track')">
          <div class="st-icon" style="background:#fef3c7;color:#d97706"><el-icon><VideoCamera /></el-icon></div>
          <div>
            <div class="st-val">91.8%</div>
            <div class="st-lbl">融合课堂实时适应指数</div>
          </div>
        </div>
        <div class="strip-item" @click="$router.push('/iep/meeting')">
          <div class="st-icon" style="background:#ede9fe;color:#7c3aed"><el-icon><ChatLineSquare /></el-icon></div>
          <div>
            <div class="st-val">36 场</div>
            <div class="st-lbl">本月多学科协同评议</div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { cockpitApi } from '../../api'

const router = useRouter()
const scenes = ref([])

const getSceneIcon = (key) => {
  if (key === 'special') return 'School'
  if (key === 'inclusive') return 'UserFilled'
  return 'House'
}

const loadScenes = async () => {
  try {
    const data = await cockpitApi.getScenes()
    scenes.value = data
  } catch (e) {
    console.error(e)
  }
}

const goToScene = (key) => {
  if (key === 'inclusive') {
    router.push('/cockpit/inclusive')
  } else {
    router.push('/cockpit/inclusive')
  }
}

onMounted(() => {
  loadScenes()
})
</script>

<style scoped>
.cockpit-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.top-nav {
  height: 64px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  padding: 0 32px;
  gap: 16px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.logo-ic {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 800;
  font-size: 17px;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.logo-tx {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.spacer {
  flex: 1;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f1f5f9;
  padding: 8px 16px;
  border-radius: 20px;
  width: 280px;
  color: #64748b;
}

.search-box input {
  border: none;
  background: none;
  outline: none;
  width: 100%;
  font-size: 13px;
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px 6px 6px;
  border-radius: 20px;
  background: #f1f5f9;
  font-size: 13px;
  font-weight: 600;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}

.cockpit-content {
  flex: 1;
  max-width: 1320px;
  margin: 0 auto;
  width: 100%;
  padding: 36px 24px;
}

.header-intro {
  margin-bottom: 28px;
}

.header-intro h1 {
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
}

.header-intro h1 em {
  font-style: normal;
  background: linear-gradient(135deg, #0ea5e9, #8b5cf6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.header-intro p {
  color: #64748b;
  margin-top: 6px;
  font-size: 14px;
}

.scene-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 28px;
}

.scene-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 28px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  flex-direction: column;
}

.scene-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
}

.sc-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.sc-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hg1 .sc-icon { background: #e0f2fe; color: #0284c7; }
.hg2 .sc-icon { background: #ccfbf1; color: #0f766e; }
.hg3 .sc-icon { background: #f3e8ff; color: #7c3aed; }

.sc-arrow {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  transition: all 0.2s;
}

.scene-card:hover .sc-arrow {
  background: #0ea5e9;
  color: #fff;
}
.hg2:hover .sc-arrow { background: #0d9488; }
.hg3:hover .sc-arrow { background: #8b5cf6; }

.sc-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 6px;
}

.sc-desc {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 20px;
  line-height: 1.5;
}

.sc-stats {
  display: flex;
  gap: 12px;
  margin-top: auto;
  margin-bottom: 20px;
}

.stat-pill {
  flex: 1;
  background: #f8fafc;
  padding: 10px 8px;
  border-radius: 12px;
  text-align: center;
}

.stat-pill .num {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.stat-pill .lbl {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
  display: block;
}

.sc-footer {
  border-top: 1px dashed #e2e8f0;
  padding-top: 14px;
}

.enter-btn {
  font-size: 13px;
  font-weight: 600;
  color: #0ea5e9;
  display: flex;
  align-items: center;
  gap: 4px;
}
.hg2 .enter-btn { color: #0d9488; }
.hg3 .enter-btn { color: #8b5cf6; }

.quick-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  background: #fff;
  border-radius: 18px;
  padding: 20px 28px;
  border: 1px solid #e2e8f0;
}

.strip-item {
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  padding: 8px;
  border-radius: 12px;
  transition: background 0.15s;
}

.strip-item:hover {
  background: #f8fafc;
}

.st-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.st-val {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

.st-lbl {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}
</style>
