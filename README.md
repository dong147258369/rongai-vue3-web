# 融AI 数字驾驶舱与融IEP个别化教育平台 (Web 前端)

本项目为基于 **Vue 3 + Vite + Element Plus** 构建的特殊教育融合教育平台前端系统，包含“融AI数字驾驶舱（随班就读融合教育）”与“融IEP个案管理中心”，深度对接 **Java (Spring Boot 3) + MySQL 8.0** 后端。

---

## 🌐 在线体验与文档地址

* **项目公网在线体验地址**：[https://shaggy-cats-reply.loca.lt](https://shaggy-cats-reply.loca.lt) *(首次打开验证 IP: `192.3.130.119`)*
* **前端 GitHub 仓库**：[https://github.com/dong147258369/rongai-vue3-web](https://github.com/dong147258369/rongai-vue3-web)
* **后端 GitHub 仓库**：[https://github.com/dong147258369/rongai-backend](https://github.com/dong147258369/rongai-backend)

---

## 🧭 核心页面在线直达

| 模块名称 | 在线页面链接 | 功能描述 |
| :--- | :--- | :--- |
| **随班就读驾驶舱** | [/#/cockpit/inclusive](https://shaggy-cats-reply.loca.lt/#/cockpit/inclusive) | 融合课堂支持(LINE 01)、资源教室训练(LINE 02)、多团队协同(LINE 03) |
| **IEP 成稿与导出** | [/#/iep/doc](https://shaggy-cats-reply.loca.lt/#/iep/doc) | 呈现草案状态、29条会议建议写回提醒卡片、Word/PDF导出 |
| **IEP 审议工作台** | [/#/iep/home](https://shaggy-cats-reply.loca.lt/#/iep/home) | 教师/园长/家长多身份切换、8条候选目标待审议卡片、一页纸班级支持卡 |
| **数据归集台** | [/#/iep/intake](https://shaggy-cats-reply.loca.lt/#/iep/intake) | 四类数据源归集（医学诊断、PEP-3/VB-MAPP/感统评估、教师/家长观察） |
| **跨源能力画像** | [/#/iep/profile](https://shaggy-cats-reply.loca.lt/#/iep/profile) | 六维雷达图（认知、语言、自理、运动、社交、情绪）及多源依据对照 |
| **目标调校与审议** | [/#/iep/goals](https://shaggy-cats-reply.loca.lt/#/iep/goals) | 目标的采纳、改写、降级、忽略操作及分领域树形展示 |
| **多团队会议调校** | [/#/iep/meeting](https://shaggy-cats-reply.loca.lt/#/iep/meeting) | 会议纪要要点切分、29条建议逐条/一键写回成稿、多团队决议 |
| **个案档案库** | [/#/iep/archive](https://shaggy-cats-reply.loca.lt/#/iep/archive) | 全园幼儿个案检索、阶段流转与案卷切换 |

---

## 🛠 技术架构

* **前端框架**：Vue 3.4+ / Vue Router 4 / Pinia
* **构建工具**：Vite 8.3
* **UI 组件库**：Element Plus / 自定义原型级响应式样式系统
* **网络请求**：Axios (自动适应本地与公网在线代理 `/api/v1`)
* **富文本与图表**：Canvas 六维能力雷达图、Word/PDF 纯前端导出引擎

---

## 🔌 企业级 RESTful API 对接规范

系统所有数据交互均直接对接后端 Java (Spring Boot 3) 服务并实时持久化到 MySQL：

```http
# 1. 获取个案最新档案业务数据 (从 MySQL 读取)
GET /api/v1/iep/cases/case-048

# 2. 保存个案档案全量修改
PUT /api/v1/iep/cases/case-048

# 3. 个别化目标审议 (采纳/改写/降级/忽略)
POST /api/v1/iep/cases/case-048/goals/review

# 4. 多团队会议建议写回成稿
POST /api/v1/iep/cases/case-048/meetings/advice/apply

# 5. IEP 成稿签署置为正式生效
POST /api/v1/iep/cases/case-048/document/effective

# 6. 个案演示基线还原 (重置为草案态与29条建议未写回)
POST /api/v1/iep/cases/case-048/actions/reset
```

---

## 🚀 本地开发与启动

```bash
# 1. 克隆代码仓库
git clone https://github.com/dong147258369/rongai-vue3-web.git
cd rongai-vue3-web

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 启动后访问 http://localhost:5173 即可！
```
