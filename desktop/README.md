# 爪爪小窝 0.3

> **直接使用请下载 [Windows 客户端](https://pyslowpoke.github.io/paws-nest/#download)**，完整解压后运行 PawsNest.exe。源码包不含该程序，desktop/delivery 下的启动脚本是打包模板。

源码开发：安装 Node.js 22 或以上后，在 desktop 文件夹双击“开发启动.cmd”；首次运行会下载依赖。也可按下文使用 pnpm。

桌边的小小陪伴。一只可以换外观、被摸摸、吃饭和打盹的简笔画小猫，以及会在生日和中国法定节日收到信的小窝。

这是可运行的个人作品集体验版，使用 AI 辅助设计和开发。当前角色使用 SVG 分层与程序动画，基础养猫不依赖在线模型、账号登录、付费 API 或外部字体。可选 AI 聊天由你自己的 DeepSeek API 提供，可能产生费用。

## 使用 Windows 版

完整解压 Windows 压缩包，运行 `PawsNest.exe`。请保留旁边的 resources、locales 等文件夹，不要单独移动 exe。

第一次进入先给小猫取名、挑毛色和眼睛，再选生日。生日可以跳过，之后从小屋“修改领养卡”补充。生日只保存月、日，不采集年份。第一次使用会收到相遇来信。

小屋“去桌面陪你”可以唤出透明桌宠。摸头、耳朵、尾巴和爪子有不同回应；可以喂猫粮、开罐头、在桌面或窝里睡觉。外观随时可改。桌宠提供小/中/大尺寸、置顶、拖动、鼠标穿透、隐藏和回窝；开启穿透后，用右下角托盘菜单恢复交互。

点击猫窝旁的邮筒打开信箱，托盘菜单也能打开。信件带日期、小猫署名与爪印，读过后保留。信箱里的生日/节日预览不会修改生日或生成正式信件。

关闭小屋会继续保留桌宠。彻底退出请用托盘菜单“退出爪爪小窝”。当前不包含自动开机启动。

Windows 版是免安装便携应用，尚未购买代码签名证书。确认来源为本项目后使用。旧版 0.1 与新版共用本地存档；旧版还在运行时，请先从旧版托盘退出，再打开新版。

官网另提供 `paws-nest-windows-portable.exe` 便携解压包：双击后选择目标文件夹，解压结束再打开其中的 `PawsNest.exe`。它与原 ZIP 使用相同的完整客户端，只改变压缩方式；不需要管理员权限，不添加注册表启动项、桌面快捷方式或系统服务。主入口从 GitHub Pages 下载，备用入口为 GitHub Release，两条路径仍受境外网络影响。

### 维护者：生成便携解压包

先完成上文的客户端打包，再从 NSIS 官方网站取得 NSIS 3 编译器，运行：

```powershell
./package-portable.ps1 -NsisCompiler 'C:/tools/nsis/makensis.exe' -ClientDirectory './build/爪爪小窝-Windows-v0.3-win32-x64' -OutputFile './build/paws-nest-windows-portable.exe'
```

脚本使用完整客户端目录与 LZMA 固实压缩，不裁减运行库或许可文件。发布前在独立目录验证解压结果，逐文件对比 SHA-256。更新 `docs/downloads/windows-package.json` 的大小与校验值，并同步官网标注。源码分发包应排除 `docs/downloads/`，避免把预编译客户端重复打包进去。

## 和小猫聊聊

从小屋、桌宠工具栏或托盘打开聊天，在「聊天设置」填写自己的 DeepSeek API Key。Key 由 Windows 加密保存在本机，不会写入源码或上传 GitHub。发送聊天时，请求会直接发给 DeepSeek，并携带近期对话及启用的偏好记忆。不要将 Key 发给项目作者。

小猫的职责是陪伴、倾听及轻松日常，不执行工作任务或提供专业决策。偏好可以查看、添加、删除，也可以关闭自动记忆；聊天记录可单独清空。详细行为边界、存储位置和清除方式见 [AI陪伴说明.md](AI陪伴说明.md)。

## 网页版

源码包 `docs/` 是完整静态站点：根目录为作品介绍页，`play/` 为免登录游戏。网页使用浏览器本地存储；更换设备、浏览器或域名不会自动同步，清理网站数据会清空存档。浏览器小陪伴窗仅在网页内，真正离开浏览器的桌宠需要 Windows 版。

生日及信件保存在本地，无账号、广告追踪或云同步；生日与节日信件在本地生成。托管网站的服务商可能记录常规访问日志，参见网页“关于本地资料”。

## 来信规则

- 使用中国标准时间，覆盖元旦、春节、清明、劳动节、端午、中秋、国庆七类法定节日及用户生日。
- 春节按除夕开始四天，劳动节两天，国庆三天；其他法定节日一天。在法定节日当天或其法定多日区间首次领养可以收到当次节日信。
- 采用法定节日本身的日期，不将每年调休、周末和补班日当作额外节日。农历与清明计算使用随包附带的 lunar-javascript。
- 每类节日每年一封，生日与节日重合时分别投递，不会重复刷信。清明使用轻声问候，不使用庆祝语。
- 首次领养以前的历史不补发；关闭后再次打开会补寄领养以来漏掉的来信，最多回看上一年和当年。历史信件最多保留 300 封。
- 2 月 29 日生日在平年按 2 月 28 日投递，闰年仍按 2 月 29 日。
- 客户端运行期间每分钟检查一次；网页打开时检查。应用完全退出时不会发送系统推送、邮件或后台通知。

## 开发

需要 Node.js 22 或以上和 pnpm。

```powershell
cd desktop
pnpm install --frozen-lockfile
pnpm start
pnpm test
pnpm run pack
```

在独立 desktop 目录内开发时直接运行后四条命令。打包结果位于 `build/`。打包只生成 Windows x64，默认由 Electron 下载服务获取 Electron 45；如网络受限，可预先准备官方 Electron ZIP，并设置 `DESKCAT_ELECTRON_ZIP_DIR` 指向 ZIP 所在目录。可设置 `DESKCAT_OUTPUT` 更改输出目录。

网站本地预览：从完整源码包根目录运行 `node scripts/serve.cjs`，打开 http://127.0.0.1:8765/ 。不要双击 HTML 当作正式部署方式。

## 结构

`app/main.cjs` 管理原生窗口、托盘和受控通信；`preload.cjs` 提供有限接口。`app/room/pet-model.js` 为外观与交互定义，`pet.js` 负责 SVG 动画，`mail-model.js` 为可独立测试的日期与信件规则，`mail-ui.js` 为领养卡及邮筒界面。`docs/` 的游戏文件与 desktop/app/room 同步。

原生窗口启用 contextIsolation、sandbox，关闭 Node 页面访问，拒绝页面导航及额外权限。桌面存档继续放在 `%APPDATA%/LittleDeskcat/companion.json`，保留旧标识以兼容旧版；源码包不含开发者个人存档。

`pnpm test` 包括 14 项来信规则和 11 项聊天验证。原生聊天另有 16 项模拟接口检查，覆盖真实 Windows 加密、聊天入口与记忆管理；尚未使用用户 Key 调用真实 DeepSeek。开发期间还用 `app/portfolio-smoke.cjs`、`portfolio-web-smoke.cjs` 和 `smoke.cjs` 验证 43 项桌面/网页流程。集成测试需要先运行完整源码包的网站服务，使用 `pnpm exec electron . --smoke=<全新目录的绝对路径>/report.json`；请预先创建该测试目录。测试使用隔离存档，不覆盖正常用户数据。

## 作品集边界

本版已实现免登录领养、参数化外观、触摸/投喂/睡觉、透明桌宠及生日与节日信箱。毛色是同一基础轮廓的风格化配色，不是完整品种建模。

照片识别生成专属猫、AI 视频动画、走出页面的过渡动画、亲密度养成、音乐、自动启动、跨设备存档、Steam/App Store 发行均为后续计划，不在本版承诺中。

## 依据与第三方

- [国务院关于修改全国年节及纪念日放假办法的决定](https://app.www.gov.cn/govdata/gov/202411/12/521605/article.html)
- [国务院办公厅关于 2026 年部分节假日安排的通知](https://www.beijing.gov.cn/zhengce/zhengcefagui/202511/t20251104_4258873.html)
- lunar-javascript 1.7.7，MIT，原文见 `app/room/lib/lunar-LICENSE.txt`。
- Electron 45 及 Chromium 的许可随 Windows 包附带 LICENSE / LICENSES.chromium.html。源码依赖及版本见 package.json 与 pnpm-lock.yaml。

项目源代码提供学习、运行与作品集审阅；尚未声明开源授权，第三方组件遵循各自许可。对外商业发行前需自行确定项目授权和发行信息。
