# 20261122 G3 第二棒全線收官驗收報告

## 5 欄結案摘要

| 欄位 | 內容 |
|---|---|
| 範圍 | 修復 N-3-1／N-3-3 舊題結構破綻；補齊 R-3-1／R-3-2／D-3-1 各 Q06–Q10（共 15 題）；3 教具雙模式升級；全 G3 240 題契約掃描與雙模式 CDP 實測 |
| 變更 | N-3-1 Q01 補至 4 選項、Q02/Q05 `answer_raw` 對齊正解、10 題 fallback 統一 420；N-3-3 Q09 補至 4 選項；三單元前 5 題補 `trap`／`fallback_height:420`／`?q=1..5`，後 5 題新題含 `concept/steps/trap`／`?q=6..10`；三教具新增 q-badge/q-focus 10 段視覺模式、Light/Dark 色票、D-3-1 移除 `100vh` |
| 驗證指令 | `node tools/verify_r31.js`／`verify_r32.js`／`verify_d31.js`／`verify_g3_contract_240.js`／`node _scratch/g3_audit_batch2/verify_batch2_dualmode_cdp.js`／`node tools/verify_curriculum_131.js`／`node tools/verify_app_shell.js`／`node _scratch/g3_audit_batch1/audit_g3_all.js` |
| 真實 Exit Code | 全部 0（8 道指令；CDP 60 張截圖與雙模式斷言全綠） |
| 證據 | `_scratch/g3_audit_batch2/screenshots/` 60 張；`_scratch/g3_audit_batch2/patch_batch2.js`、`gen_batch2_verifiers.js`、`verify_batch2_dualmode_cdp.js`；`_scratch/g3_audit_batch1/g3_audit_all.json`（240/240、shorts=[]、答案與選項異常皆 0） |

## 一、舊題致命破綻修復

| 單元 | 題號 | 原缺陷 | 修復動作 | 數學正解覆核 |
|---|---|---|---|---|
| N-3-1 | Q01 | choices 僅 2 項；fallback 430 | 補 2 個誘答（5300／5003／503）成 4 選項，`answer_index=0` 不變；fallback→420 | 5×1000＋3×10＝5030，「⭕ 對」正確 |
| N-3-1 | Q02 | `answer_raw` 與 `choices[0]` 不一致 | `answer_raw` 改為 `5`（索引 0 不變） | 2356 千位 2＋百位 3＝5 |
| N-3-1 | Q05 | `answer_raw` 與 `choices[0]` 不一致；fallback 430 | `answer_raw` 對齊 `(1) 4368 比較小；(2) 6100 最大`；fallback→420 | 十位 8>6 → 4368 較小；6100 百位 1>0 → 最大 |
| N-3-1 | Q03/Q07/Q08/Q10 | fallback 非 420 | 全部統一 420 | 不影響答案 |
| N-3-3 | Q09 | choices 僅 3 項 | 補「無法比較」成 4 選項，`answer_index=0`（＜）不變 | 被乘數相同，乘數 7>6 → 405×6＜405×7 |

## 二、補題與教具升級明細

| 單元 | 新增題 | 核心涵蓋 | 教具 |
|---|---|---|---|
| R-3-1 | Q06 乘法驗算除法、Q07 `□×6=48`、Q08 `□÷7=8`、Q09 `7×8+1=57`、Q10 `48÷7=6餘6` | 乘除互逆驗算、未知因數／被除數、有餘數驗算、兩步驟應用 | `multiplication_division_lab.html` |
| R-3-2 | Q06 紅黃藍綠第 27 面、Q07 等差遞增、Q08 等差遞減、Q09 火柴 6 個 19 根、Q10 樓梯 15 格 | 週期規律除餘、增減數列、火柴棒／方格遞增推理 | `pattern_reasoning_lab.html` |
| D-3-1 | Q06 投票表反推 7 人、Q07 借書表反推 36 本、Q08 二維票價差 50 元、Q09 二維缺漏格 6 人、Q10 時刻表 103 次 | 一維讀數與總計反推、二維交叉查詢、缺漏格推算、時刻篩選 | `table_cross_lab.html` |

三教具共同升級：新增 `#q-badge`（Q01–Q10）與 `#q-focus`（每題專屬提示）、`?q=1..10` 視覺模式切換、Light/Dark 色票橋接、主容器嚴格 420px；D-3-1 原 `height:100vh` 改為 `min-height:100dvh`。

## 三、門禁實測結果

| 門禁 | 結果 |
|---|---|
| 三單元靜態契約（10 題／4 選項／正解索引／trap／fallback／`?q=`／教具存在） | PASS ×3 |
| G3 全 24 單元 240 題契約 | PASS（240 題、240 組 4 選項、零答案不一致、零教具缺件） |
| CDP 390×844 × 3 單元 × Q01–Q10 × Light/Dark | PASS ×60（高度皆 420px、零橫向溢出、q-badge/q-focus 正確、0 console error、Light/Dark 底色不同） |
| verify_curriculum_131.js | PASS（131 條目／59 ready／G3 24 條目） |
| verify_app_shell.js | PASS（R-3-1／R-3-2／D-3-1 卡片與舞台流程正常、CONSOLE_NOISE_COUNT=0） |
| 全 G3 體檢掃描 | 240/240、shorts=[]、答案與選項異常 0；剩 78 筆為範圍外單元既有 fallback/詳解 WARN（非本棒授權範圍，未擴大改寫） |

## 四、部署

隔離 `_scratch/` 與既有未追蹤舊報告後，`git commit` + `git push origin main`，觸發 Cloudflare Pages 自動部署（https://math-108.pages.dev）。

> 全程本機 OpenCode CLI 施工，未呼叫 Antigravity。
