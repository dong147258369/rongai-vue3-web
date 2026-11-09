<template>
  <div class="archive-page">
    <div class="page-top-bar">
      <div>
        <h2 class="title">随班就读学生档案中心</h2>
        <p class="subtitle">全域特需学生底册 · 六大发展领域评估档案 · 监护人与负责特教</p>
      </div>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon style="margin-right:4px"><Plus /></el-icon> 建档录入新学生
      </el-button>
    </div>

    <!-- 筛选栏 -->
    <el-card shadow="never" class="filter-card">
      <div class="filter-flex">
        <div class="filter-item">
          <span class="label">学生年级：</span>
          <el-select v-model="filterGrade" placeholder="全部年级" clearable @change="loadStudents" style="width:140px">
            <el-option label="一年级" value="一年级" />
            <el-option label="二年级" value="二年级" />
            <el-option label="三年级" value="三年级" />
            <el-option label="四年级" value="四年级" />
            <el-option label="五年级" value="五年级" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="label">姓名/学号：</span>
          <el-input 
            v-model="searchKeyword" 
            placeholder="输入姓名或学号搜索" 
            prefix-icon="Search" 
            clearable 
            @keyup.enter="loadStudents" 
            style="width:200px" 
          />
        </div>
        <el-button type="primary" plain @click="loadStudents">查询</el-button>
      </div>
    </el-card>

    <!-- 学生档案卡片网格 -->
    <div class="students-grid">
      <div v-for="stu in students" :key="stu.id" class="stu-card">
        <div class="sc-top">
          <div class="avatar">{{ stu.avatar || stu.name.charAt(0) }}</div>
          <div class="info">
            <div class="name-row">
              <span class="name">{{ stu.name }}</span>
              <el-tag size="small" :type="stu.gender === '男' ? 'primary' : 'danger'">
                {{ stu.gender }} · {{ stu.age }}岁
              </el-tag>
            </div>
            <div class="no">{{ stu.studentNo }}</div>
          </div>
          <el-tag size="small" :type="stu.status === '在案' ? 'success' : 'warning'" effect="plain">
            {{ stu.status }}
          </el-tag>
        </div>

        <div class="sc-details">
          <div class="detail-row">
            <span class="lbl">班级归属：</span>
            <span class="val">{{ stu.grade }}</span>
          </div>
          <div class="detail-row">
            <span class="lbl">特需类型：</span>
            <span class="val highlight">{{ stu.specialType }}</span>
          </div>
          <div class="detail-row">
            <span class="lbl">支持级别：</span>
            <span class="val">{{ stu.supportLevel }}</span>
          </div>
          <div class="detail-row">
            <span class="lbl">负责教师：</span>
            <span class="val">{{ stu.teacherName }}</span>
          </div>
          <div class="detail-row">
            <span class="lbl">监护电话：</span>
            <span class="val">{{ stu.guardianPhone }}</span>
          </div>
        </div>

        <div class="sc-actions">
          <el-button size="small" plain @click="handleEdit(stu)">编辑</el-button>
          <el-button size="small" type="primary" plain @click="$router.push('/iep/goals')">IEP目标</el-button>
          <el-popconfirm title="确定要删除该学生档案吗？" @confirm="handleDelete(stu.id)">
            <template #reference>
              <el-button size="small" type="danger" plain>删除</el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </div>

    <!-- 弹窗：录入/编辑学生 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑随班学生档案' : '录入新随班就读学生档案'" width="560px">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="学生学号">
          <el-input v-model="formData.studentNo" placeholder="如：STU2026006" />
        </el-form-item>
        <el-form-item label="学生姓名">
          <el-input v-model="formData.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="formData.gender">
            <el-radio label="男">男</el-radio>
            <el-radio label="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="年龄">
          <el-input-number v-model="formData.age" :min="6" :max="18" />
        </el-form-item>
        <el-form-item label="班级">
          <el-input v-model="formData.grade" placeholder="如：三年级1班" />
        </el-form-item>
        <el-form-item label="特殊需求类型">
          <el-select v-model="formData.specialType" placeholder="选择类型" style="width:100%">
            <el-option label="注意力缺陷ADHD" value="注意力缺陷ADHD" />
            <el-option label="言语与语言障碍" value="言语与语言障碍" />
            <el-option label="自闭症谱系轻度" value="自闭症谱系轻度" />
            <el-option label="肢体障碍伴轻度认知" value="肢体障碍伴轻度认知" />
            <el-option label="情绪与社交行为障碍" value="情绪与社交行为障碍" />
            <el-option label="特定学习障碍" value="特定学习障碍" />
          </el-select>
        </el-form-item>
        <el-form-item label="支持级别">
          <el-select v-model="formData.supportLevel" placeholder="选择级别" style="width:100%">
            <el-option label="一级普遍支持" value="一级普遍支持" />
            <el-option label="二级个别化支持" value="二级个别化支持" />
            <el-option label="三级强化个别支持" value="三级强化个别支持" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责教师">
          <el-input v-model="formData.teacherName" placeholder="特教/资源教师" />
        </el-form-item>
        <el-form-item label="监护人电话">
          <el-input v-model="formData.guardianPhone" placeholder="家长联系电话" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveStudent">保存到数据库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { iepApi } from '../../api'

const students = ref([])
const searchKeyword = ref('')
const filterGrade = ref('')
const dialogVisible = ref(false)
const isEdit = ref(false)

const formData = ref({
  id: '',
  studentNo: '',
  name: '',
  gender: '男',
  age: 8,
  grade: '三年级1班',
  specialType: '注意力缺陷ADHD',
  supportLevel: '二级个别化支持',
  status: '在案',
  teacherName: '李红教师',
  guardianPhone: '13900000000',
  iepPeriod: '2026春季学期'
})

const loadStudents = async () => {
  try {
    const res = await iepApi.getStudents({
      keyword: searchKeyword.value,
      grade: filterGrade.value
    })
    if (res) {
      students.value = res
    }
  } catch (err) {
    console.error(err)
  }
}

const openCreateDialog = () => {
  isEdit.value = false
  formData.value = {
    id: '',
    studentNo: 'STU' + Math.floor(1000000 + Math.random() * 9000000),
    name: '',
    gender: '男',
    age: 9,
    grade: '三年级2班',
    specialType: '注意力缺陷ADHD',
    supportLevel: '二级个别化支持',
    status: '在案',
    teacherName: '李红教师',
    guardianPhone: '13812345678',
    iepPeriod: '2026春季学期'
  }
  dialogVisible.value = true
}

const handleEdit = (stu) => {
  isEdit.value = true
  formData.value = { ...stu }
  dialogVisible.value = true
}

const handleSaveStudent = async () => {
  if (!formData.value.name) {
    ElMessage.warning('请输入学生姓名')
    return
  }
  try {
    await iepApi.saveStudent(formData.value)
    ElMessage.success('学生档案已成功保存至 MySQL！')
    dialogVisible.value = false
    loadStudents()
  } catch (err) {
    ElMessage.error('保存失败')
  }
}

const handleDelete = async (id) => {
  try {
    await iepApi.deleteStudent(id)
    ElMessage.success('档案已删除')
    loadStudents()
  } catch (err) {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  loadStudents()
})
</script>

<style scoped>
.archive-page {
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

.filter-card {
  border-radius: 14px;
  border: 1px solid #e2e8f0;
}

.filter-flex {
  display: flex;
  align-items: center;
  gap: 20px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.students-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stu-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  display: flex;
  flex-direction: column;
  transition: all 0.2s;
}

.stu-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.sc-top {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f1f5f9;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #0ea5e9, #38bdf8);
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info {
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name {
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
}

.no {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.sc-details {
  padding: 14px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 12.5px;
}

.lbl {
  color: #64748b;
}

.val {
  font-weight: 600;
  color: #0f172a;
}

.val.highlight {
  color: #0284c7;
}

.sc-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
}
</style>
