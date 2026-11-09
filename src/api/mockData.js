// 静态环境 (如 GitHub Pages) 无后端时的标准演示兜底数据
export const DEFAULT_SCENES = [
  {
    id: 'sc_01',
    sceneKey: 'inclusive',
    name: '随班就读融合教育',
    description: '普通学校随班就读 · 资源教室支持',
    statStudents: 14,
    statRate: '91%',
    statSupport: 12,
    sortOrder: 1,
    cls: 'inclusive-card'
  },
  {
    id: 'sc_02',
    sceneKey: 'special',
    name: '特殊教育学校个别化教学',
    description: '培智/特教学校分层走班与康复训练',
    statStudents: 128,
    statRate: '94%',
    statSupport: 48,
    sortOrder: 2,
    cls: 'special-card'
  },
  {
    id: 'sc_03',
    sceneKey: 'center',
    name: '区域巡回指导与资源中心',
    description: '区域巡回特教专家指导与跨校协同',
    statStudents: 342,
    statRate: '88%',
    statSupport: 36,
    sortOrder: 3,
    cls: 'center-card'
  }
]

export const DEFAULT_INCLUSIVE_SCENE_DETAIL = {
  scene: {
    id: 'sc_01',
    sceneKey: 'inclusive',
    title: '随班就读融合教育',
    subTitle: '普通学校随班就读 · 资源教室支持',
    statStudents: 14,
    statAdaptRate: '91%',
    statWeekSupport: 12
  },
  lines: [
    {
      id: 'line_01',
      lineNo: 'LINE 01',
      name: '融合课堂支持',
      icon: 'Monitor',
      routePath: '/iep/home',
      tasks: [
        { id: 't_01', name: '今日随班课堂', badge: '3 节', badgeType: 'info' },
        { id: 't_02', name: '课堂适应观察', badge: '进行', badgeType: 'success' },
        { id: 't_03', name: '视觉支持卡', badge: '待送', badgeType: 'warning' }
      ]
    },
    {
      id: 'line_02',
      lineNo: 'LINE 02',
      name: '资源教室训练',
      icon: 'Reading',
      routePath: '/iep/goals',
      tasks: [
        { id: 't_04', name: '资源教室课表', badge: '4 节', badgeType: 'info' },
        { id: 't_05', name: '个训预约实施', badge: '6 人次', badgeType: 'success' },
        { id: 't_06', name: '缺陷补偿训练', badge: '进行', badgeType: 'success' }
      ]
    },
    {
      id: 'line_03',
      lineNo: 'LINE 03',
      name: '多团队协同',
      icon: 'UserFilled',
      routePath: '/iep/meeting',
      tasks: [
        { id: 't_07', name: 'IEP联合会议', badge: '2 场', badgeType: 'warning' },
        { id: 't_08', name: '班主任沟通', badge: '3 条', badgeType: 'info' },
        { id: 't_09', name: '巡回指导', badge: '2 次', badgeType: 'info' }
      ]
    }
  ]
}
