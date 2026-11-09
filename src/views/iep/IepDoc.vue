<template>
  <div class="doc-page">
    <div class="page-top-bar">
      <div>
        <h2 class="title">随班就读个别化教育计划 (IEP) 规范文本</h2>
        <p class="subtitle">教育部随班就读规范方案成稿 · 团队多方联签 · 评估与支持明细</p>
      </div>
      <div class="btn-group">
        <el-button @click="handlePrint">
          <el-icon style="margin-right:4px"><Printer /></el-icon> 打印预览
        </el-button>
        <el-button type="primary" @click="handleExport">
          <el-icon style="margin-right:4px"><Download /></el-icon> 导出PDF/Word
        </el-button>
      </div>
    </div>

    <!-- 规范纸张版式成稿 -->
    <div class="paper-doc">
      <div class="doc-header">
        <h1>普通学校随班就读个别化教育计划 (IEP)</h1>
        <div class="doc-sub">2025-2026学年度第二学期（春季）</div>
      </div>

      <section class="doc-section">
        <div class="sec-title">一、学生基本情况与背景信息</div>
        <table class="doc-table">
          <tr>
            <td class="tb-lbl">学生姓名</td>
            <td class="tb-val">陈小明</td>
            <td class="tb-lbl">学籍号</td>
            <td class="tb-val">STU2026001</td>
          </tr>
          <tr>
            <td class="tb-lbl">性别 / 年龄</td>
            <td class="tb-val">男 / 9岁</td>
            <td class="tb-lbl">就读班级</td>
            <td class="tb-val">三年级2班</td>
          </tr>
          <tr>
            <td class="tb-lbl">特殊需要类型</td>
            <td class="tb-val">注意力缺陷多动障碍 (ADHD)</td>
            <td class="tb-lbl">支持等级</td>
            <td class="tb-val">二级个别化支持</td>
          </tr>
          <tr>
            <td class="tb-lbl">监护人及电话</td>
            <td class="tb-val">陈建华（父亲） 13800138001</td>
            <td class="tb-lbl">负责特教老师</td>
            <td class="tb-val">李红教师 / 王敏教师</td>
          </tr>
        </table>
      </section>

      <section class="doc-section">
        <div class="sec-title">二、随班就读三大核心业务线实施要点</div>
        <div class="line-summary-box">
          <div class="l-item">
            <strong>LINE 01 融合课堂支持：</strong>
            <span>在语文、数学课堂配置“视觉指令任务卡”，安排同伴小老师结对，教师采用分段指令与正向行为代币强化。</span>
          </div>
          <div class="l-item">
            <strong>LINE 02 资源教室训练：</strong>
            <span>每周二、四各安排1节抽离式前额叶执行功能训练与注意力聚焦小步子训练，目标达成率目前达 75%。</span>
          </div>
          <div class="l-item">
            <strong>LINE 03 多团队协同：</strong>
            <span>每两周由普通班主任、特教资源教师与家长进行一次个案联席反馈，并邀请市特教中心巡回教师到校指导。</span>
          </div>
        </div>
      </section>

      <section class="doc-section">
        <div class="sec-title">三、学期长短期教育目标 (IEP Goals)</div>
        <table class="doc-table">
          <thead>
            <tr>
              <th width="120">领域分类</th>
              <th width="90">类型</th>
              <th>具体目标描述</th>
              <th width="140">达成衡量准则</th>
              <th width="80">当前进度</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>注意力与认知</td>
              <td><el-tag size="small">短期目标</el-tag></td>
              <td>在数学课堂上持续专注听讲达15分钟以上，减少自主离席行为</td>
              <td>连续5节课观察达成4次</td>
              <td><span style="color:#10b981;font-weight:700">75%</span></td>
            </tr>
            <tr>
              <td>情绪与行为适应</td>
              <td><el-tag size="small" type="danger">长期目标</el-tag></td>
              <td>课堂情绪激动或受挫时，自主举起“安静卡”前往班级角平复</td>
              <td>每学期发生率低于2次</td>
              <td><span style="color:#10b981;font-weight:700">80%</span></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="doc-section">
        <div class="sec-title">四、多方团队联席签名审定</div>
        <div class="sign-grid">
          <div class="sign-box">
            <div class="sign-role">学校分管校长：</div>
            <div class="sign-line">张校长（已审核同意）</div>
          </div>
          <div class="sign-box">
            <div class="sign-role">普通班主任：</div>
            <div class="sign-line">孙老师（签字同意）</div>
          </div>
          <div class="sign-box">
            <div class="sign-role">特教资源教师：</div>
            <div class="sign-line">李红（主拟方案）</div>
          </div>
          <div class="sign-box">
            <div class="sign-role">学生法定监护人：</div>
            <div class="sign-line">陈建华（签字知情）</div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'

const handlePrint = () => {
  window.print()
}

const handleExport = () => {
  ElMessage.success('IEP 标准文书已生成！正在启动文档导出...')
}
</script>

<style scoped>
.doc-page {
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

.paper-doc {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
  padding: 48px 56px;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
}

.doc-header {
  text-align: center;
  padding-bottom: 24px;
  border-bottom: 2px solid #0f172a;
  margin-bottom: 28px;
}

.doc-header h1 {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
}

.doc-sub {
  font-size: 14px;
  color: #64748b;
  margin-top: 8px;
}

.doc-section {
  margin-bottom: 28px;
}

.sec-title {
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 12px;
  border-left: 4px solid #0d9488;
  padding-left: 10px;
}

.doc-table {
  width: 100%;
  border-collapse: collapse;
}

.doc-table th, .doc-table td {
  border: 1px solid #cbd5e1;
  padding: 10px 14px;
  font-size: 13px;
}

.doc-table th {
  background: #f8fafc;
  color: #334155;
  text-align: left;
}

.tb-lbl {
  background: #f8fafc;
  width: 120px;
  color: #64748b;
  font-weight: 600;
}

.tb-val {
  color: #0f172a;
  font-weight: 500;
}

.line-summary-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
  line-height: 1.6;
}

.l-item strong {
  color: #0d9488;
}

.sign-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 16px;
}

.sign-box {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  padding: 14px 18px;
}

.sign-role {
  font-size: 12px;
  color: #64748b;
}

.sign-line {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  margin-top: 6px;
}
</style>
