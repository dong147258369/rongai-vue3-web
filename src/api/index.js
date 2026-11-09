import axios from 'axios'

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
      console.warn('API error:', res.message)
      return Promise.reject(new Error(res.message || 'Error'))
    }
  },
  error => {
    console.error('Request network error:', error)
    return Promise.reject(error)
  }
)

export const cockpitApi = {
  getScenes: () => request.get('/cockpit/scenes'),
  getSceneDetail: (key) => request.get(`/cockpit/scene/${key}`)
}

export const iepApi = {
  // 全局概览与指标
  getOverview: () => request.get('/iep/overview'),
  // 个案档案全量资源 (RESTful: /api/v1/iep/cases)
  getCases: () => request.get('/iep/cases'),
  getCaseDetail: (caseId) => request.get(`/iep/cases/${caseId}`),
  saveCase: (caseId, data) => request.put(`/iep/cases/${caseId}`, data),
  // 目标审议与决议
  reviewGoal: (caseId, data) => request.post(`/iep/cases/${caseId}/goals/review`, data),
  // 多学科会议建议写回
  applyAdvice: (caseId, data) => request.post(`/iep/cases/${caseId}/meetings/advice/apply`, data),
  // 成稿正式签署生效
  setEffective: (caseId, data) => request.post(`/iep/cases/${caseId}/document/effective`, data),
  // 演示基线重置
  resetCase: (caseId) => request.post(`/iep/cases/${caseId}/actions/reset`),

  // 资源教室/融合课堂子模块
  getStudents: (params) => request.get('/iep/students', { params }),
  saveStudent: (data) => request.post('/iep/student', data),
  deleteStudent: (id) => request.delete(`/iep/student/${id}`),
  getGoals: (params) => request.get('/iep/goals', { params }),
  saveGoal: (data) => request.post('/iep/goal', data),
  getTracks: (params) => request.get('/iep/tracks', { params }),
  saveTrack: (data) => request.post('/iep/track', data),
  getMeetings: (params) => request.get('/iep/meetings', { params }),
  saveMeeting: (data) => request.post('/iep/meeting', data)
}

export default request
