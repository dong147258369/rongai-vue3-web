import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    currentRole: 'teacher',
    roles: [
      {
        key: 'teacher',
        name: '教师（主用户）',
        short: '教师',
        initial: '李',
        hint: '资源教师与班级教师合并为一个身份：建档、填报观察、审核目标、召集会议、确认生效。',
        nav: ['home', 'archive', 'intake', 'profile', 'goals', 'meeting', 'doc', 'track', 'settings']
      },
      {
        key: 'principal',
        name: '园长 / 保教主任',
        short: '园长',
        initial: '张',
        hint: '聚合视图为主，默认不展开个案敏感细节。',
        nav: ['home', 'archive', 'track', 'settings']
      },
      {
        key: 'parent',
        name: '家长',
        short: '家长',
        initial: '家长',
        hint: '仅见自己孩子；不可见其他儿童与内部讨论记录。',
        nav: ['home', 'intake', 'doc']
      },
      {
        key: 'expert',
        name: '外部专业（巡回 / 康复师 / 医生）',
        short: '外部专业',
        initial: '特',
        hint: '按授权范围临时开放单个案，可批注与会诊，操作留痕。',
        nav: ['home', 'archive', 'profile', 'goals', 'meeting']
      }
    ],
    currentCase: {
      id: '2026-N02',
      alias: '豆豆（化名）',
      age: '3岁7个月',
      cls: '半日融合班',
      specialType: '言语发育迟缓伴社交适应障碍',
      iepPeriod: '2026学年春季学期'
    }
  }),
  getters: {
    activeRole: (state) => {
      return state.roles.find(r => r.key === state.currentRole) || state.roles[0]
    }
  },
  actions: {
    setRole(roleKey) {
      this.currentRole = roleKey
    }
  }
})
