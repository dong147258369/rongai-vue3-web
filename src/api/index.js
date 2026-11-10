import axios from 'axios'
import { DEFAULT_SCENES, DEFAULT_INCLUSIVE_SCENE_DETAIL } from './mockData'

// 判断是否处于纯静态托管平台 (如 GitHub Pages / Gitee Pages 等无后端环境)
const isStaticEnvironment = typeof window !== 'undefined' && (
  window.location.hostname.includes('github.io') ||
  window.location.hostname.includes('gitee.io') ||
  window.location.protocol === 'file:'
)

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 10000
})

request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code === 200) {
      return res.data
    } else {
      return Promise.reject(new Error(res.message || 'Error'))
    }
  },
  error => {
    return Promise.reject(error)
  }
)

export const cockpitApi = {
  getScenes: async () => {
    // 若在纯静态托管环境，直接使用标准演示数据，避免向不存在后端的 GitHub 服务器发起 404 请求
    if (isStaticEnvironment) {
      return Promise.resolve(DEFAULT_SCENES)
    }
    try {
      return await request.get('/cockpit/scenes')
    } catch (e) {
      return DEFAULT_SCENES
    }
  },
  getSceneDetail: async (key) => {
    if (isStaticEnvironment) {
      return Promise.resolve(DEFAULT_INCLUSIVE_SCENE_DETAIL)
    }
    try {
      return await request.get(`/cockpit/scene/${key}`)
    } catch (e) {
      return DEFAULT_INCLUSIVE_SCENE_DETAIL
    }
  }
}

export const iepApi = {
  // 全局概览与指标
  getOverview: () => isStaticEnvironment ? Promise.resolve({}) : request.get('/iep/overview'),
  // 个案档案全量资源 (RESTful: /api/v1/iep/cases)
  getCases: () => isStaticEnvironment ? Promise.resolve([]) : request.get('/iep/cases'),
  getCaseDetail: (caseId) => isStaticEnvironment ? Promise.resolve({}) : request.get(`/iep/cases/${caseId}`),
  saveCase: (caseId, data) => isStaticEnvironment ? Promise.resolve(true) : request.put(`/iep/cases/${caseId}`, data),
  // 目标审议与决议
  reviewGoal: (caseId, data) => isStaticEnvironment ? Promise.resolve({ message: '演示模式已采纳' }) : request.post(`/iep/cases/${caseId}/goals/review`, data),
  // 多学科会议建议写回
  applyAdvice: (caseId, data) => isStaticEnvironment ? Promise.resolve({ message: '演示模式已写回' }) : request.post(`/iep/cases/${caseId}/meetings/advice/apply`, data),
  // 成稿正式签署生效
  setEffective: (caseId, data) => isStaticEnvironment ? Promise.resolve({ message: '演示模式已生效' }) : request.post(`/iep/cases/${caseId}/document/effective`, data),
  // 演示基线重置
  resetCase: (caseId) => isStaticEnvironment ? Promise.resolve({ message: '演示模式已重置' }) : request.post(`/iep/cases/${caseId}/actions/reset`),

  // 资源教室/融合课堂子模块
  getStudents: (params) => isStaticEnvironment ? Promise.resolve([]) : request.get('/iep/students', { params }),
  saveStudent: (data) => isStaticEnvironment ? Promise.resolve(data) : request.post('/iep/student', data),
  deleteStudent: (id) => isStaticEnvironment ? Promise.resolve(true) : request.delete(`/iep/student/${id}`),
  getGoals: (params) => isStaticEnvironment ? Promise.resolve([]) : request.get('/iep/goals', { params }),
  saveGoal: (data) => isStaticEnvironment ? Promise.resolve(data) : request.post('/iep/goal', data),
  getTracks: (params) => isStaticEnvironment ? Promise.resolve([]) : request.get('/iep/tracks', { params }),
  saveTrack: (data) => isStaticEnvironment ? Promise.resolve(data) : request.post('/iep/track', data),
  getMeetings: (params) => isStaticEnvironment ? Promise.resolve([]) : request.get('/iep/meetings', { params }),
  saveMeeting: (data) => isStaticEnvironment ? Promise.resolve(data) : request.post('/iep/meeting', data)
}

export default request
