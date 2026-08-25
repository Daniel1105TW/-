# 注意

此專案由 AI 協助製作。正式使用前，請先自行測試資料保存、備份及權限是否符合需求。

# 班級簽到簿

給國小班級使用的「簽到 + 聯絡簿」系統。教師在一台 Windows 電腦啟動伺服器，教室內其他電腦、平板或手機透過同一個區域網路開啟學生端即可使用。

## 功能

- 學生端左側顯示簽到名單，右側顯示今日聯絡簿。
- 點擊學生姓名會依序切換：`未簽到 -> 簽到 -> 請假 -> 外務 -> 未簽到`。
- 簽到狀態依日期保存，每天是獨立紀錄。
- 後台可更改班級名稱、年級、配色主題與注音顯示。
- 後台可新增、停用學生，也可重新使用已停用的座號。
- 支援匯入 `.xlsx` 或 `.xls` 學生名單，匯入前會先預覽。
- 後台可新增、刪除聯絡簿內容。
- 後台可一鍵清除今天的簽到狀態。
- 使用 SQLite 本機資料庫，不需要雲端帳號。

## 第一次安裝

以下步驟只需要在新電腦或第一次使用時執行一次。

### 1. 安裝 Node.js

請安裝 Node.js 20 LTS，建議使用 20.9.0 或更新的 20.x 版本：

<https://nodejs.org/en/download>

安裝完成後，在 PowerShell 執行：

```powershell
node -v
npm -v
```

Node.js 版本應該是 `v20.x.x`。Node.js 24 也可能可以使用，但本專案搭配 `better-sqlite3` 時，Node.js 20 LTS 通常較容易安裝。

### 2. 安裝 Windows C++ 編譯工具

本專案使用 `better-sqlite3`。如果 npm 找不到適合的預編譯檔案，就會使用 `node-gyp` 編譯，因此 Windows 需要 Visual Studio Build Tools。

下載：<https://visualstudio.microsoft.com/visual-cpp-build-tools/>

安裝程式中請勾選：

- **使用 C++ 的桌面開發**（必要）
- **Node.js 建置工具**（建議保留）
- Windows 10/11 SDK（通常會隨 C++ 工作負載一起選取）

不需要特別勾選 .NET Multi-Platform App UI、.NET 桌面建置工具、WinUI 應用程式開發工具或 Linux C++ 工具。

安裝完成後，建議重新開機，或至少完全關閉再重新開啟 VS Code。

### 3. 開啟正確的專案資料夾

在 VS Code 選擇「檔案 -> 開啟資料夾」，開啟包含 `package.json` 的資料夾。接著開啟 VS Code 終端機，執行：

```powershell
Get-Location
Test-Path .\package.json
```

第二個指令應該顯示：

```text
True
```

### 4. 安裝專案套件

```powershell
npm install
```

這會依照 `package.json` 和 `package-lock.json` 安裝 Next.js、SQLite、Excel 解析、注音轉換等套件，並建立 `node_modules`。

`node_modules` 不需要上傳到 GitHub。其他人下載專案後執行 `npm install`，就會重新建立它。

## 啟動系統

在包含 `package.json` 的資料夾執行：

```powershell
npm run dev -- --hostname 0.0.0.0
```

看到以下內容代表啟動成功：

```text
Ready
Local:   http://localhost:3000
Network: http://0.0.0.0:3000
```

請不要關閉這個終端機視窗，伺服器需要持續執行。

在啟動伺服器的電腦開啟：

- 學生端：<http://localhost:3000>
- 教師後台：<http://localhost:3000/admin>

後台預設沒有密碼，可以直接進入；進入後可設定密碼。設定密碼後，後台操作需要登入。

## 讓其他裝置連線

### 1. 查詢主機 IP

在啟動伺服器的 Windows 電腦另開一個 PowerShell，執行：

```powershell
ipconfig
```

找到目前使用中的 Wi-Fi 或乙太網路介面，記下「IPv4 位址」，通常會像：

```text
192.168.1.20
```

### 2. 在其他裝置開啟

假設主機 IP 是 `192.168.1.20`，在其他電腦、平板或手機輸入：

```text
http://192.168.1.20:3000
```

教師後台網址是：

```text
http://192.168.1.20:3000/admin
```

所有裝置必須連接同一個 Wi-Fi 或區域網路。請不要把系統直接公開到網際網路。

### 3. 連不上時的檢查順序

1. 確認伺服器終端機仍在執行，且顯示 `Ready`。
2. 確認兩台裝置連接同一個 Wi-Fi 或區域網路。
3. 確認網址中的 IP 是啟動伺服器那台電腦的 IPv4 位址。
4. Windows 防火牆若跳出提示，允許 Node.js 在「私人網路」通訊。
5. 確認 Windows 網路類型不是會阻擋區域網路的「公用網路」。

## 後台操作

開啟 `http://localhost:3000/admin` 或區域網路後台網址後，可以依下列順序設定。

### 班級名稱

在「班級名稱」輸入，例如 `向日葵班`，按「儲存名稱」。學生端標題會顯示為「向日葵班簽到簿」。

### 畫面設定

- **年級**：選擇一年級至六年級。
- **配色主題**：選擇草地清新、暖陽橘紅或天空藍綠。
- **啟用注音**：開啟後，學生姓名與前台聯絡簿的標題、內容會在國字旁顯示注音。

選好後按「儲存畫面設定」。學生端會在幾秒內自動同步；若沒有更新，請重新整理學生端。

### 新增或停用學生

在學生管理區輸入座號和姓名，按「新增學生」。

停用學生不會刪除過去的簽到紀錄。如果之後再次新增相同座號，系統會重新啟用原本的資料並更新姓名。

### 匯入 Excel 名單

Excel 第一列必須是欄位名稱，至少包含「座號」和「姓名」：

| 座號 | 姓名 |
| ---: | --- |
| 1 | 王小明 |
| 2 | 林小花 |
| 3 | 陳品妤 |

操作方式：

1. 將檔案存成 `.xlsx` 或 `.xls`。
2. 在後台學生管理區選擇「匯入 Excel 名單」。
3. 確認畫面上的預覽內容。
4. 確定正確後按「確認匯入」。

支援的欄位名稱包括：

- 座號：`座號`、`座次`、`seatNumber`
- 姓名：`姓名`、`name`

空白姓名、無效座號會被排除。已存在的座號會更新姓名並重新啟用，不會建立重複座號。

### 聯絡簿

在「聯絡簿」區輸入標題與內容，按「新增聯絡簿」。學生端只顯示今天日期的內容。

啟用注音後，聯絡簿標題、內容與底部提示文字都會顯示注音。刪除後無法從畫面復原，請刪除前先確認內容。

### 重置今日簽到

按「重置今日簽到」並確認後，只會清除今天的簽到狀態，不會影響其他日期的簽到紀錄、學生名單、聯絡簿或畫面設定。

### 修改後台密碼

在後台安全設定區輸入新密碼，按「更新密碼」。密碼至少 4 個字元。

目前版本的密碼只保存在伺服器執行期間的記憶體中。重新啟動伺服器後會回到無密碼狀態；若要長期或公開部署，應先改成持久化的安全登入機制。

## 每日使用流程

1. 在教師電腦啟動伺服器。
2. 開啟後台，確認日期、班級名稱、年級和學生名單。
3. 開啟學生端，依學生到校情況點擊姓名。
4. 需要更正時，繼續點擊該姓名直到正確狀態。
5. 在後台新增當日聯絡簿內容。
6. 確認其他裝置使用區域網路網址連線。
7. 下課或放學後停止伺服器並備份 `data` 資料夾。

## 停止與重新啟動

在執行 `npm run dev` 的終端機按：

```text
Ctrl + C
```

下次使用時，在專案資料夾重新執行：

```powershell
npm run dev -- --hostname 0.0.0.0
```

## 資料備份

主要資料庫檔案是：

```text
data/attendance.sqlite
```

備份步驟：

1. 先在伺服器終端機按 `Ctrl + C` 停止伺服器。
2. 複製整個 `data` 資料夾。
3. 保存到 USB、外接硬碟或其他安全位置。
4. 下次啟動前，確認 `data/attendance.sqlite` 位於專案的 `data` 資料夾內。

資料庫包含學生名單、簽到紀錄、聯絡簿與畫面設定，屬於個人資料，請不要公開上傳。

## 上傳 GitHub 前

可以上傳：

- `src/`
- `package.json`
- `package-lock.json`
- `README.md`
- Next.js、TypeScript 和 ESLint 設定檔

不要上傳：

- `node_modules/`
- `.next/`
- `data/attendance.sqlite`
- `build-validation.log`
- `.env` 或任何含有密碼、金鑰的檔案

本專案的 `.gitignore` 已排除 `node_modules` 和 `.next`。請確認另外加入：

```gitignore
/data/
/build-validation.log
```

## 常見問題

### `npm install` 出現 `node-gyp rebuild` 或 `better-sqlite3` 錯誤

通常是 Windows 缺少 C++ 編譯工具。請確認 Visual Studio Build Tools 勾選「使用 C++ 的桌面開發」、「Node.js 建置工具」和 Windows 10/11 SDK。

也請確認 Node.js 版本是 20 LTS，然後在正確的專案資料夾執行：

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install
```

### `npm install` 顯示找不到 `package.json`

你目前不在專案資料夾。請用 VS Code 開啟包含 `package.json` 的資料夾，再重新開啟終端機，或執行：

```powershell
Get-Location
Test-Path .\package.json
```

### 頁面顯示「目前無法連線」

確認 `npm run dev -- --hostname 0.0.0.0` 的終端機仍在執行，並重新整理頁面。其他裝置則檢查 IP、Wi-Fi 和 Windows 防火牆。

### Excel 匯入沒有資料

確認第一列是欄位名稱，且至少有 `座號` 和 `姓名`。座號必須是正整數，姓名不能空白；系統只讀取第一個工作表。

### 注音沒有顯示或顯示不完整

確認後台「啟用注音」已按下「儲存畫面設定」，再重新整理學生端。英文、數字和標點符號不會轉成注音；中文會依讀音顯示注音。

### 忘記後台密碼

目前版本的密碼會在伺服器重新啟動後清除。停止伺服器，再重新執行啟動指令即可回到無密碼狀態。

## 開發者檢查

修改程式後，在專案資料夾執行：

```powershell
npm run typecheck
npm run lint
npm run build
```

三個指令都成功完成，代表 TypeScript、ESLint 與 Next.js production build 檢查通過。
