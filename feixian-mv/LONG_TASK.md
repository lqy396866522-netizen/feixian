# 飞仙 MVP · 产品图对齐长任务 v2

**任务 ID**：`feixian-product-ui-full`  
**规划**：Cursor 计划「产品图UI长任务」（勿改 plan 文件）  
**目标**：完整信息架构对齐产品参考图；美术 GPT Batch 1~4；逻辑仍 `GameModel`。

## 状态说明

- **完成**：已实现并接入代码  
- **部分**：结构有，贴图/验收未完成  
- **未做**  
- **你**：需 Creator 构建 / 出图

---

### 阶段 0 · 规格

| ID | 状态 | 内容 |
|----|------|------|
| LT2-001 | 完成 | `docs/UI_PRODUCT_SPEC.md` |
| LT2-002 | 完成 | `docs/UI_ART_GPT_IMAGE.md` 产品 Manifest |
| LT2-003 | 完成 | 本文件 v2 |

### 阶段 1 · 骨架 + 顶栏

| ID | 状态 | 内容 |
|----|------|------|
| LT2-004 | 完成 | `ui/UiFactory` + `ProductLayout` + `UiTheme` |
| LT2-005 | 完成 | `HudTopView` |
| LT2-006 | 完成 | 世界地图/主城入口 |
| LT2-007 | 部分 | Batch1 贴图路径接入（缺图则 Graphics 占位） |

### 阶段 2 · 侧栏 + 关卡

| ID | 状态 | 内容 |
| LT2-008 | 完成 | `SideRailsView` |
| LT2-009 | 完成 | `StageQuestView` |
| LT2-010 | 完成 | 任务横幅 + 蓝装穿戴检测 |

### 阶段 3 · 战斗 HUD

| LT2-011 | 完成 | `CombatHudView` |
| LT2-012 | 完成 | 飘字层 |
| LT2-013 | 完成 | 野怪安全区缩放 |

### 阶段 4 · ActionDock

| LT2-014 ~ 017 | 完成 | `ActionDockView` |

### 阶段 5 · 七 Tab

| LT2-018 ~ 021 | 完成 | `TabBarView` + role/alliance + 菜单设置 + 聊天 |

### 阶段 6 · 子页

| LT2-022 | 部分 | 子页 product 边框路径预留 |
| LT2-023 | 未做 | Batch4 角色/背景（等你出图） |

### 阶段 7 · 构建

| LT2-024 | 完成 | `docs/QA_PRODUCT_CHECKLIST.md` |
| LT2-025 | 你 | Creator 预览 |
| LT2-026 | 你 | Web Desktop 构建 |
| LT2-027 | 未做 | 微信包（可选） |

### 阶段 8 · 可选

| LT2-028 ~ 029 | 未做 |
