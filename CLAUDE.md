# CLAUDE.md — Personal Diet Assistant

## 專案概述

單一 HTML 檔案（`index.html`）的熱量追蹤網頁 App，無任何外部依賴，資料存於瀏覽器 localStorage。
部署於 GitHub Pages：https://yuandesu.github.io/personal-diet-assistant/

---

## 功能清單

### 日曆
- 月曆視圖，點擊任一天開啟記錄 modal
- 格子顯示：淨熱量差（intake − burn）、體重（若有記錄）
- 綠色邊框 = 赤字（好）、紅色邊框 = 盈餘（壞）

### 記錄 Modal
- 攝取熱量輸入
- **消耗模式切換**（持久化）：
  - ⚡ TDEE 模式：一鍵填入 TDEE，不顯示步數區（避免重複計算）
  - 🔢 BMR + 步數模式：輸入步數自動計算 `BMR + 步數消耗 = 總消耗`，顯示分解
- 體重輸入（選填，顯示於日曆格子與體重折線圖）
- Header「＋ 記錄今天」按鈕可直接開啟今日 modal

### 目標 & 進度（右側 Tab）
- 設定目標減重公斤 + 截止日期
- 以 7,700 kcal/kg 計算目標總缺口
- 顯示：累計缺口、剩餘缺口、剩餘天數、每日需缺口

### BMR / TDEE 計算器（右側 Tab）
- 公式：**Mifflin-St Jeor (1990)**
  - 男：`BMR = 10W + 6.25H − 5A + 5`
  - 女：`BMR = 10W + 6.25H − 5A − 161`
- TDEE = BMR × 活動係數（1.2 ~ 1.9）
- 計算結果存入 localStorage，供步數換算共用體重

### 統計摘要（日曆下方）
- 本月：記錄天數、累計缺口、每日平均、估算體重變化
- 本週：記錄天數、累計缺口（僅顯示當月）

### 圖表（日曆下方）
- **熱量缺口長條圖**：Canvas 繪製，綠柱往上 = 赤字，紅柱往下 = 盈餘
- **體重折線圖**：有體重資料時自動顯示，紫色線

---

## 公式來源

| 功能 | 公式 | 來源 |
|---|---|---|
| BMR | Mifflin-St Jeor | Mifflin et al., *JADA* 1990 |
| TDEE | BMR × 活動係數 | Harris-Benedict revised |
| 步數→熱量 | `(steps / 2000) × 0.57 × weight_lbs` | ACSM Guidelines |
| 減重換算 | 1 kg = 7,700 kcal | 臨床標準參考值 |

---

## localStorage 結構

```
diet_data     → { "2026-04-06": { intake, burn, steps, weight }, ... }
diet_goal     → { kg, date }
diet_profile  → { gender, age, weight, height, actMul, bmr, tdee }
diet_burnMode → "tdee" | "bmr"
```

---

## 注意事項

- 所有功能在單一 `index.html` 內，無 build 步驟，直接開啟即用
- 圖表使用原生 Canvas API，支援 devicePixelRatio 高解析度繪製
- `roundRect` 需現代瀏覽器（Chrome 99+、Safari 15.4+）
- Resize 時重繪圖表（`window.addEventListener('resize', renderCharts)`）
