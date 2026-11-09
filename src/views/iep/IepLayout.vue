<template>
  <div class="app">
    <!-- 左侧菜单栏 (100% 对齐原交互页面截图) -->
    <aside class="sidebar">
      <div class="brand" @click="$router.push('/cockpit/inclusive')">
        <div class="logo">
          <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
            <circle cx="11" cy="13" r="5" fill="#2f6fd0"/>
            <circle cx="21" cy="12" r="4" fill="#14b8a6"/>
            <circle cx="16" cy="22" r="4.5" fill="#f59e0b"/>
          </svg>
        </div>
        <div class="brand-text">
          <strong>融IEP</strong>
          <span>学前融合教育 · IEP 中心</span>
        </div>
      </div>

      <!-- 当前身份下拉选择框 -->
      <div class="role-switch">
        <label for="roleSelect">当前身份</label>
        <select id="roleSelect" v-model="userStore.currentRole" @change="onRoleChanged">
          <option v-for="r in userStore.roles" :key="r.key" :value="r.key">{{ r.name }}</option>
        </select>
      </div>

      <!-- 菜单项列表 (带分组与黄色徽标，使用原版SVG矢量图标) -->
      <nav class="nav">
        <!-- 分组：日常 -->
        <div v-if="hasGroup('日常')" class="nav-group">日常</div>
        <router-link 
          v-if="hasNav('home')" 
          to="/iep/home" 
          class="nav-item" 
          active-class="active"
        >
          <svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2v-9z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
          </svg>
          <span class="label">{{ getNavTitle('home', '工作台') }}</span>
        </router-link>

        <router-link 
          v-if="hasNav('archive')" 
          to="/iep/archive" 
          class="nav-item" 
          active-class="active"
        >
          <svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M4 6h16v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" fill="none" stroke="currentColor" stroke-width="1.6"/>
            <path d="M4 6l2-3h12l2 3M9 12h6" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          </svg>
          <span class="label">{{ getNavTitle('archive', '儿童档案') }}</span>
        </router-link>

        <!-- 分组：IEP 流程 -->
        <div v-if="hasGroup('IEP 流程')" class="nav-group">IEP 流程</div>
        <router-link 
          v-if="hasNav('intake')" 
          to="/iep/intake" 
          class="nav-item" 
          active-class="active"
        >
          <svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M12 16V5m0 0L8 9m4-4l4 4" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
          <span class="label">{{ getNavTitle('intake', '数据归集台') }}</span>
        </router-link>

        <router-link 
          v-if="hasNav('profile')" 
          to="/iep/profile" 
          class="nav-item" 
          active-class="active"
        >
          <svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M4 20V9m5 11V4m5 16v-8m5 8V7" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>
          </svg>
          <span class="label">{{ getNavTitle('profile', '跨源能力画像') }}</span>
        </router-link>

        <router-link 
          v-if="hasNav('goals')" 
          to="/iep/goals" 
          class="nav-item" 
          active-class="active"
        >
          <svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/>
            <circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" stroke-width="1.6"/>
            <circle cx="12" cy="12" r="1" fill="currentColor"/>
          </svg>
          <span class="label">{{ getNavTitle('goals', '目标建议') }}</span>
        </router-link>

        <router-link 
          v-if="hasNav('meeting')" 
          to="/iep/meeting" 
          class="nav-item" 
          active-class="active"
        >
          <svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <circle cx="9" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="1.6"/>
            <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M16 5.4a3 3 0 0 1 0 5.2M17.5 14.6c2 .8 3.2 2.4 3.2 4.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
          <span class="label">{{ getNavTitle('meeting', 'IEP 会议调校与审议') }}</span>
          <!-- 黄色小徽标 8 (截图标识) -->
          <span class="dot">8</span>
        </router-link>

        <router-link 
          v-if="hasNav('doc')" 
          to="/iep/doc" 
          class="nav-item" 
          active-class="active"
        >
          <svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="1.6"/>
            <path d="M14 3v4h4M9 12h6M9 16h6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          </svg>
          <span class="label">{{ getNavTitle('doc', '成稿与导出') }}</span>
        </router-link>

        <router-link 
          v-if="hasNav('track')" 
          to="/iep/track" 
          class="nav-item" 
          active-class="active"
        >
          <svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <rect x="3.5" y="5" width="17" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/>
            <path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>
            <path d="M8.5 14l2 2 4-4" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/>
          </svg>
          <span class="label">{{ getNavTitle('track', '进度追踪与复审') }}</span>
        </router-link>

        <!-- 分组：治理 -->
        <div v-if="hasGroup('治理')" class="nav-group">治理</div>
        <router-link 
          v-if="hasNav('settings')" 
          to="/iep/settings" 
          class="nav-item" 
          active-class="active"
        >
          <svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M12 3l7 3v6c0 4.4-2.9 7.8-7 9-4.1-1.2-7-4.6-7-9V6l7-3z" fill="none" stroke="currentColor" stroke-width="1.6"/>
            <path d="M9 12l2.2 2.2L15.5 10" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
          </svg>
          <span class="label">{{ getNavTitle('settings', '合规与设置') }}</span>
        </router-link>
      </nav>

      <!-- 底部说明与合规声明 -->
      <div class="sidebar-foot">
        <div class="compliance-note">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" style="flex-shrink:0">
            <path d="M12 2l8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-4z" fill="none" stroke="currentColor" stroke-width="1.6"/>
            <path d="M8.5 12.2l2.4 2.4 4.6-4.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <span>不做诊断 · 不替代医疗 · 不替代团队决策</span>
        </div>
        <div class="ver">v1.0 原型 · 本地演示</div>
        <div style="padding-top: 6px;">
          <button class="btn link" style="font-size:12px;color:#2f6fd0;cursor:pointer;border:none;background:none;" @click="$router.push('/cockpit/inclusive')">
            ← 返回融AI驾驶舱
          </button>
        </div>
      </div>
    </aside>

    <!-- 右侧主体内容区域 -->
    <main class="main">
      <!-- 顶部 Header (对齐截图) -->
      <header class="topbar">
        <div class="crumb">
          <span id="crumbMain">{{ currentTitle }}</span>
          <em id="crumbSub">{{ userStore.currentCase.alias }} · {{ userStore.currentCase.age }} · {{ userStore.currentCase.cls }} · 园内编号 C-2026-048</em>
        </div>

        <div class="topbar-right">
          <div class="case-pill">IEP v2.0 · 草案</div>
          <div class="avatar" :title="userStore.activeRole.name">
            {{ userStore.activeRole.initial }}
          </div>
        </div>
      </header>

      <!-- 视图页面路由容器 -->
      <div id="view" class="view-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const currentTitle = computed(() => {
  const p = route.path
  if (p.includes('home')) return '工作台'
  if (p.includes('archive')) return '儿童档案'
  if (p.includes('intake')) return '数据归集台'
  if (p.includes('profile')) return '跨源能力画像'
  if (p.includes('goals')) return '目标建议'
  if (p.includes('meeting')) return 'IEP 会议调校与审议'
  if (p.includes('doc')) return '成稿与导出'
  if (p.includes('track')) return '进度追踪与复审'
  if (p.includes('settings')) return '合规与设置'
  return '工作台'
})

const NAV_GROUPS = {
  '日常': ['home', 'archive'],
  'IEP 流程': ['intake', 'profile', 'goals', 'meeting', 'doc', 'track'],
  '治理': ['settings']
}

const hasGroup = (groupName) => {
  const keys = NAV_GROUPS[groupName] || []
  return keys.some(k => userStore.activeRole.nav.includes(k))
}

const hasNav = (key) => {
  return userStore.activeRole.nav.includes(key)
}

const getNavTitle = (key, defaultName) => {
  if (userStore.currentRole === 'parent') {
    if (key === 'intake') return '材料与观察'
    if (key === 'doc') return '孩子的 IEP'
    if (key === 'archive') return '孩子的资料'
  }
  return defaultName
}

const onRoleChanged = (e) => {
  const role = userStore.activeRole
  ElMessage.success(`已切换为：${role.name}`)
  const currentKey = route.path.split('/')[2] || 'home'
  if (!role.nav.includes(currentKey)) {
    router.push('/iep/home')
  }
}
</script>

<style scoped>
.app {
  display: flex;
  min-height: 100vh;
  background-color: #f6f8fb;
}

/* 侧边栏 */
.sidebar {
  width: 246px;
  flex: 0 0 246px;
  background: #ffffff;
  border-right: 1px solid #e6ecf3;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 18px 12px;
  cursor: pointer;
}

.brand .logo {
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-text strong {
  display: block;
  font-size: 16px;
  font-weight: 800;
  color: #1f2a37;
  line-height: 1.2;
}

.brand-text span {
  display: block;
  font-size: 11px;
  color: #78859a;
}

/* 身份切换下拉框 (对齐截图) */
.role-switch {
  padding: 0 16px 12px;
}

.role-switch label {
  display: block;
  font-size: 11px;
  color: #78859a;
  margin-bottom: 4px;
  font-weight: 600;
}

.role-switch select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e6ecf3;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #1f2a37;
  background-color: #ffffff;
  outline: none;
  cursor: pointer;
}

.role-switch select:focus {
  border-color: #2f6fd0;
}

/* 导航栏 */
.nav {
  flex: 1;
  padding: 4px 10px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-group {
  font-size: 11px;
  font-weight: 700;
  color: #9aa5b5;
  padding: 12px 10px 4px;
  letter-spacing: 0.5px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  color: #3d4d5f;
  text-decoration: none;
  transition: all 0.15s;
  position: relative;
}

.nav-item:hover {
  background: #f0f4f8;
  color: #1f2a37;
}

.nav-item.active {
  background: #eaf2fe;
  color: #2f6fd0;
  font-weight: 700;
}

.nav-item .ic {
  flex-shrink: 0;
  color: inherit;
}

.nav-item .label {
  flex: 1;
}

.nav-item .dot {
  background: #f59e0b;
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* 侧边底部 */
.sidebar-foot {
  padding: 14px 16px;
  border-top: 1px solid #e6ecf3;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.compliance-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  background: #e8f7ef;
  color: #22a06b;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 11px;
  line-height: 1.4;
}

.ver {
  font-size: 11px;
  color: #9aa5b5;
  text-align: center;
}

/* 右侧主体 */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.topbar {
  height: 60px;
  background: #ffffff;
  border-bottom: 1px solid #e6ecf3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  position: sticky;
  top: 0;
  z-index: 40;
}

.crumb {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

#crumbMain {
  font-size: 16px;
  font-weight: 800;
  color: #1f2a37;
}

#crumbSub {
  font-size: 13px;
  color: #78859a;
  font-style: normal;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.case-pill {
  padding: 4px 10px;
  border-radius: 20px;
  background: #f0f4f8;
  color: #3d4d5f;
  font-size: 12px;
  font-weight: 600;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #2f6fd0;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-content {
  flex: 1;
  padding: 24px 28px 48px;
  overflow-y: auto;
}
</style>
