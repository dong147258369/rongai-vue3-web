<template>
  <div class="track-page">
    <div class="page-top-bar">
      <div>
        <h2 class="title">LINE 01 融合课堂支持与观察记录</h2>
        <p class="subtitle">普通课堂实时观察 · 专注与参与指数 · 视觉策略支持</p>
      </div>
      <el-button type="success" @click="dialogVisible = true">
        <el-icon style="margin-right:4px"><Plus /></el-icon> 登记随班观察记录
      </el-button>
    </div>

    <!-- 顶部卡片 -->
    <div class="card-row">
      <div class="stat-box">
        <div class="sb-label">随班课堂开课总数</div>
        <div class="sb-val">3 节</div>
        <div class="sb-tag">今日语文 / 数学 / 英语</div>
      </div>
      <div class="stat-box">
        <div class="sb-label">全班平均适应率</div>
        <div class="sb-val" style="color: #10b981">91.8%</div>
        <div class="sb-tag">较上周提升 +3.4%</div>
      </div>
      <div class="stat-box">
        <div class="sb-label">视觉支持卡推送</div>
        <div class="sb-val">12 次</div>
        <div class="sb-tag">课表卡 / 举手卡 / 规则卡</div>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header-flex">
          <span class="card-header-title">随班就读课堂观察流水 (MySQL 持久化数据)</span>
          <el-input 
            v-model="searchKeyword" 
            placeholder="搜索学生姓名或课程" 
            prefix-icon="Search"
            style="width: 240px" 
            clearable 
          />
        </div>
      </template>

      <el-table :data="filteredTracks" stripe style="width: 100%">
        <el-table-column prop="studentName" label="学生姓名" width="120">
          <template #default="{ row }">
            <span style="font-weight:700">{{ row.studentName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="courseName" label="随班课程" width="110">
          <template #default="{ row }">
            <el-tag size="small">{{ row.courseName }}课</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="专注度" width="140">
          <template #default="{ row }">
            <el-progress :percentage="row.focusRate" :color="row.focusRate >= 80 ? '#10b981' : (row.focusRate >= 60 ? '#f59e0b' : '#ef4444')" />
          </template>
        </el-table-column>
        <el-table-column label="参与度" width="140">
          <template #default="{ row }">
            <el-progress :percentage="row.participateRate" color="#0ea5e9" />
          </template>
        </el-table-column>
        <el-table-column prop="supportStrategy" label="所用支持策略" min-width="160" />
        <el-table-column prop="behaviorRemark" label="观察实录与辅导纪要" min-width="240" />
        <el-table-column prop="observerName" label="观察特教老师" width="120" />
        <el-table-column prop="status" label="适应评价" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '良好' ? 'success' : (row.status === '关注' ? 'warning' : 'danger')">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 弹窗：登记随班观察 -->
    <el-dialog v-model="dialogVisible" title="新增融合课堂支持观察记录" width="560px">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="学生姓名">
          <el-select v-model="formData.studentName" placeholder="请选择学生">
            <el-option label="陈小明 (STU2026001)" value="陈小明" />
            <el-option label="张雨晨 (STU2026002)" value="张雨晨" />
            <el-option label="赵子轩 (STU2026003)" value="赵子轩" />
            <el-option label="刘佳琪 (STU2026004)" value="刘佳琪" />
          </el-select>
        </el-form-item>
        <el-form-item label="随班课程">
          <el-select v-model="formData.courseName" placeholder="请选择课程">
            <el-option label="语文" value="语文" />
            <el-option label="数学" value="数学" />
            <el-option label="英语" value="英语" />
            <el-option label="科学" value="科学" />
            <el-option label="美术" value="美术" />
          </el-select>
        </el-form-item>
        <el-form-item label="课堂专注度">
          <el-slider v-model="formData.focusRate" show-input :max="100" />
        </el-form-item>
        <el-form-item label="课堂参与度">
          <el-slider v-model="formData.participateRate" show-input :max="100" />
        </el-form-item>
        <el-form-item label="支持策略">
          <el-input v-model="formData.supportStrategy" placeholder="如：同伴小老师协助 / 视觉提示卡 / 分段指令" />
        </el-form-item>
        <el-form-item label="行为表现实录">
          <el-input v-model="formData.behaviorRemark" type="textarea" :rows="3" placeholder="记录学生的积极反应或偶发插嘴/离席行为" />
        </el-form-item>
        <el-form-item label="适应状态评价">
          <el-radio-group v-model="formData.status">
            <el-radio label="良好">良好</el-radio>
            <el-radio label="关注">关注</el-radio>
            <el-radio label="需支持">需支持</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveTrack">保存到数据库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { iepApi } from '../../api'

const tracks = ref([])
const searchKeyword = ref('')
const dialogVisible = ref(false)

const formData = ref({
  studentName: '陈小明',
  studentId: 'stu_1',
  courseName: '语文',
  focusRate: 85,
  participateRate: 80,
  supportStrategy: '视觉任务卡 + 同伴小老师提示',
  behaviorRemark: '',
  observerName: '李红教师',
  status: '良好'
})

const filteredTracks = computed(() => {
  if (!searchKeyword.value) return tracks.value
  return tracks.value.filter(item => 
    item.studentName.includes(searchKeyword.value) || 
    item.courseName.includes(searchKeyword.value)
  )
})

const loadTracks = async () => {
  try {
    const res = await iepApi.getTracks()
    if (res) {
      tracks.value = res
    }
  } catch (err) {
    console.error(err)
  }
}

const handleSaveTrack = async () => {
  try {
    await iepApi.saveTrack(formData.value)
    ElMessage.success('随班观察数据已成功保存至 MySQL 数据库！')
    dialogVisible.value = false
    loadTracks()
  } catch (err) {
    ElMessage.error('保存失败')
  }
}

onMounted(() => {
  loadTracks()
})
</script>

<style scoped>
.track-page {
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
