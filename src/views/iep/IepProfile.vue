<template>
  <div class="card">
    <div class="card-head">
      <h3><el-icon><DataAnalysis /></el-icon> 跨源能力画像</h3>
      <span class="desc">六大发展维度能力基线、当前能力与学期目标对比</span>
    </div>
    <div class="grid g2" style="margin-top: 16px;">
      <div class="card tight">
        <h4>六维雷达对比 (基线 vs 当前 vs 目标)</h4>
        <div style="padding: 20px 0; display:flex; flex-direction:column; gap:12px;">
          <div class="row" style="justify-content:space-between"><span>认知：82 分（优势）</span><el-progress :percentage="82" color="#22a06b" style="width:200px" /></div>
          <div class="row" style="justify-content:space-between"><span>语言：75 分（良好）</span><el-progress :percentage="75" color="#8b5cf6" style="width:200px" /></div>
          <div class="row" style="justify-content:space-between"><span>自理：74 分（良好）</span><el-progress :percentage="74" color="#f59e0b" style="width:200px" /></div>
          <div class="row" style="justify-content:space-between"><span>运动：61 分（需支持）</span><el-progress :percentage="61" color="#2f6fd0" style="width:200px" /></div>
          <div class="row" style="justify-content:space-between"><span>社交：54 分（需支持）</span><el-progress :percentage="54" color="#14b8a6" style="width:200px" /></div>
          <div class="row" style="justify-content:space-between"><span>情绪：48 分（重点支持）</span><el-progress :percentage="48" color="#e0577a" style="width:200px" /></div>
        </div>
      </div>
      <div class="card tight">
        <h4>核心优势与薄弱分析</h4>
        <div class="notice ok" style="margin-bottom:12px">
          <b>优势入口：</b>拼图、形状配对、精细模仿能力突出，善于通过视觉卡片接受教学指令。
        </div>
        <div class="notice warn">
          <b>突破难点：</b>在遭遇复杂规则或等待时容易出现急躁、音量升高，需搭配“安静卡”与分步辅助。
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>
