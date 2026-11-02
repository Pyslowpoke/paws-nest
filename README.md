# 爪爪小窝 · Paws Nest

> **直接使用请下载 [Windows 客户端](https://github.com/Pyslowpoke/paws-nest/releases/download/v0.3.0/paws-nest-windows-x64.zip)**，完整解压后运行 PawsNest.exe。源码包不含该程序，desktop/delivery 下的启动脚本是打包模板。

源码开发：安装 Node.js 22 或以上后，在 desktop 文件夹双击“开发启动.cmd”；首次运行会下载依赖。也可按下文使用 pnpm。

桌边的小小陪伴。一只手绘小猫，和一段慢慢来的日子。

[打开作品介绍](https://pyslowpoke.github.io/paws-nest/) · [直接进入小窝](https://pyslowpoke.github.io/paws-nest/play/)

## 体验

- 奶油色纸张、手绘明信片与小猫邮局的项目介绍页。
- 无需账号的首次领养：名字、六种毛色、眼睛大小和小表情；可随时修改。
- 摸头、耳朵、尾巴、爪子；猫粮和罐头；桌边与猫窝睡姿。
- 相遇来信、生日与七类中国法定节日来信，带署名和爪印。
- Windows 可选 AI 陪伴：自备 DeepSeek Key、简短情绪回应、可查看及删除的本地偏好记忆。小猫不承担通用助手或专业咨询任务。
- Windows 透明桌宠：拖动、置顶、大小调整、鼠标穿透和托盘菜单。

网页与 Windows 客户端使用相同的 SVG 角色和主要交互。浏览器里的陪伴窗只在网页内，真正悬浮在操作系统桌面上需要 Windows 客户端。

## 目录与修改

| 位置 | 用途 |
| --- | --- |
| docs/index.html | 作品介绍页的内容和布局 |
| docs/portfolio.css | 首页配色、字体、间距与手机布局 |
| docs/assets/ | 首页插图与小猫图形 |
| docs/play/ | 浏览器游戏、领养卡、来信与角色动画 |
| desktop/ | Windows 客户端完整源码、运行和打包说明 |
| scripts/serve.cjs | 本地预览网站 |

网站由 GitHub Pages 发布 main 分支下的 docs 目录。修改后提交并推送 main，GitHub 会自动重新部署，网址保持不变。资源使用相对路径，支持 /paws-nest/ 项目网址。

本地预览需要 Node.js：运行 `node scripts/serve.cjs`，打开 http://127.0.0.1:8765/ 。桌面端开发请阅读 [desktop/README.md](desktop/README.md)。

## 来信与隐私

生日只保存月日，允许跳过；外观及信件保存在浏览器本地或 Windows 本机。网页不包含账号系统、云端存档或在线 AI API。更换网站域名、浏览器或设备后，存档不会自动同步。托管平台可能保留常规访问日志。

按中国标准时间计算法定节日本身的日期，不按调休假期逐日发信。生日与节日同日时各发一封。2 月 29 日生日在平年按 2 月 28 日投递。退出应用后不会发送系统通知，再次打开时补寄领养后错过的来信，最多回看上一年与当年。

Windows 端可自愿开启 DeepSeek 聊天。Key 使用 Windows 加密保存，只随请求发送给 DeepSeek；发送时会携带近期对话及启用的偏好记忆，不上传 GitHub。API 可能计费，关闭 AI 不影响养猫。详见 [AI 陪伴说明](desktop/AI陪伴说明.md)。

## 当前版本与验证

0.3 作品集体验版，使用 AI 辅助设计与开发。角色使用 SVG 分层和程序动画。照片定制、AI 视频动画、亲密度、音乐、云同步及商店发行仍为后续计划。

已验证 14 项来信规则和 43 项网页/桌面流程；新增 11 项聊天单元测试和 16 项原生聊天流程检查。聊天检查使用模拟接口，Windows 加密使用真实系统服务；真实 DeepSeek 质量与账户连通性需填写自己的 Key 后验证。日期测试可直接运行：`node desktop/test/mail.test.cjs`。

## 第三方与授权

农历与节气：lunar-javascript 1.7.7，MIT，许可原文位于 docs/play/lib/lunar-LICENSE.txt。Electron 与 Chromium 遵循各自许可证。

本仓库公开供作品集展示、学习与审阅，尚未授予项目整体的开源许可。第三方组件遵循各自许可证。
