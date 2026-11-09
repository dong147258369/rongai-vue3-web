<template>
  <div class="goals-page">
    <div class="page-top-bar">
      <div>
        <h2 class="title">LINE 02 资源教室训练与IEP目标库</h2>
        <p class="subtitle">抽离个别化训练 · 缺陷补偿与小步子分解 · 达成率跟踪</p>
      </div>
      <el-button type="warning" @click="dialogVisible = true">
        <el-icon style="margin-right:4px"><Plus /></el-icon> 制定新IEP训练目标
      </el-button>
    </div>

    <!-- 顶部状态卡 -->
    <div class="card-row">
      <div class="stat-box">
        <div class="sb-label">本周抽离训练课表</div>
        <div class="sb-val">4 节</div>
        <div class="sb-tag">言语矫治 / 专注执行 / 感统训练</div>
      </div>
      <div class="stat-box">
        <div class="sb-label">个训预约实施</div>
        <div class="sb-val" style="color:#d97706">6 人次</div>
        <div class="sb-tag">薄弱领域 1对1 补偿</div>
      </div>
      <div class="stat-box">
        <div class="sb-label">平均目标达成进度</div>
        <div class="sb-val" style="color:#10b981">79%</div>
        <div class="sb-tag">已达成 1 项，进行中 4 项</div>
      </div>
    </div>

    <!-- 目标列表 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header-flex">
          <span class="card-header-title">随班就读学生 IEP 个别化训练目标清单</span>
          <el-radio-group v-model="filterDomain" size="small">
            <el-radio-button label="全部" />
            <el-radio-button label="注意力与认知" />
            <el-radio-button label="言语语言" />
            <el-radio-button label="社会交往" />
            <el-radio-button label="缺陷补偿" />
          </el-radio-group>
        </div>
      </template>

      <el-table :data="filteredGoals" stripe style="width: 100%">
        <el-table-column prop="studentName" label="学生姓名" width="120">
          <template #default="{ row }">
            <span style="font-weight:700">{{ row.studentName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="goalType" label="目标类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.goalType === '长期目标' ? 'danger' : 'primary'">
              {{ row.goalType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="domain" label="训练领域" width="130">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.domain }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="具体训练目标描述" min-width="220" />
        <el-table-column prop="targetStandard" label="达标衡量准则" min-width="160" />
        <el-table-column label="训练达成进度" width="180">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.progress" 
              :color="row.progress >= 80 ? '#10b981' : (row.progress >= 60 ? '#f59e0b' : '#3b82f6')" 
            />
          </template>
        </el-table-column>
        <el-table-column prop="trainerName" label="负责特教老师" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '已达成' ? 'success' : 'warning'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleQuickProgress(row)">
              训练打卡+5%
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 弹窗：新增训练目标 -->
    <el-dialog v-model="dialogVisible" title="新增 IEP 个性化训练目标" width="560px">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="个案学生">
          <el-select v-model="formData.studentName" placeholder="请选择学生">
            <el-option label="陈小明" value="陈小明" />
            <el-option label="张雨晨" value="张雨晨" />
            <el-option label="赵子轩" value="赵子轩" />
            <el-option label="刘佳琪" value="刘佳琪" />
            <el-option label="林晓曦" value="林晓曦" />
          </el-select>
        </el-form-item>
        <el-form-item label="训练领域">
          <el-select v-model="formData.domain" placeholder="请选择领域">
            <el-option label="注意力与认知" value="注意力与认知" />
            <el-option label="言语语言" value="言语语言" />
            <el-option label="情绪与行为适应" value="情绪与行为适应" />
            <el-option label="社会交往" value="社会交往" />
            <el-option label="缺陷补偿" value="缺陷补偿" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标周期">
          <el-radio-group v-model="formData.goalType">
            <el-radio label="短期目标">短期目标 (STG)</el-radio>
            <el-radio label="长期目标">长期目标 (LTG)</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="目标内容">
          <el-input v-model="formData.title" type="textarea" :rows="2" placeholder="清晰具体的行为描述（如：在资源教室完成构音训练...）" />
        </el-form-item>
        <el-form-item label="达标衡量">
          <el-input v-model="formData.targetStandard" placeholder="如：5次评测中有4次达标，正确率不低于80%" />
        </el-form-item>
        <el-form-item label="负责教师">
          <el-input v-model="formData.trainerName" placeholder="填报特教老师" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveGoal">保存入库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { iepApi } from '../../api'

const goals = ref([])
const filterDomain = ref('全部')
const dialogVisible = ref(false)

const formData = ref({
  studentName: '陈小明',
  studentId: 'stu_1',
  domain: '注意力与认知',
  goalType: '短期目标',
  title: '',
  targetStandard: '',
  progress: 10,
  status: '进行中',
  trainerName: '李红教师'
})

const filteredGoals = computed(() => {
  if (filterDomain.value === '全部') return goals.value
  return goals.value.filter(item => item.domain === filterDomain.value)
})

const loadGoals = async () => {
  try {
    const res = await iepApi.getGoals()
    if (res) {
      goals.value = res
    }
  } catch (err) {
    console.error(err)
  }
}

const handleQuickProgress = async (row) => {
  const newProgress = Math.min(100, row.progress + 5)
  const newStatus = newProgress >= 100 ? '已达成' : row.status
  try {
    await iepApi.saveGoal({
      ...row,
      progress: newProgress,
      status: newStatus
    })
    ElMessage.success(`${row.studentName} 目标进度已更新为 ${newProgress}%！`)
    loadGoals()
  } catch (err) {
    ElMessage.error('更新失败')
  }
}

const handleSaveGoal = async () => {
  if (!formData.value.title) {
    ElMessage.warning('请输入目标内容')
    return
  }
  try {
    await iepApi.saveGoal(formData.value)
    ElMessage.success('IEP 训练目标已成功保存到 MySQL！')
    dialogVisible.value = false
    formData.value.title = ''
    loadGoals()
  } catch (err) {
    ElMessage.error('保存失败')
  }
}

onMounted(() => {
  loadGoals()
})
</script>

<style scoped>
.goals-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
}

.subtitle {
  font-size: 13px;
  color: #64748b;
  margin-top: 2px;
}

.card-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-box {
  background: #ffffff;
  padding: 18px 22px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
}

.sb-label {
  font-size: 12px;
  color: #64748b;
}

.sb-val {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  margin: 4px 0;
}

.sb-tag {
  font-size: 11px;
  color: #94a3b8;
}

.table-card {
  border-radius: 14px;
  border: 1px solid #e2e8f0;
}

.card-header-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-header-title {
  font-weight: 700;
  font-size: 14px;
  color: #0f172a;
}
</style>
