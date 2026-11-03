; Build with official NSIS 3: makensis /DCLIENT_DIR=<packaged app> /DOUTPUT_FILE=<exe> portable.nsi
; The payload is the unchanged Electron client. No network installer or admin rights.
Unicode True
!include "MUI2.nsh"
!include "x64.nsh"
!ifndef CLIENT_DIR
  !error "Pass /DCLIENT_DIR with the packaged Windows client directory"
!endif
!ifndef OUTPUT_FILE
  !error "Pass /DOUTPUT_FILE with the output executable path"
!endif
Name "爪爪小窝 0.3.1 · 便携解压包"
OutFile "${OUTPUT_FILE}"
InstallDir "$EXEDIR\PawsNest-v0.3.1"
RequestExecutionLevel user
SetCompressor /SOLID lzma
SetCompressorDictSize 64
SetDatablockOptimize on
BrandingText "爪爪小窝 · 给日常，添一点毛茸茸"
VIProductVersion "0.3.1.0"
VIAddVersionKey /LANG=2052 "ProductName" "爪爪小窝"
VIAddVersionKey /LANG=2052 "FileDescription" "爪爪小窝 Windows x64 便携解压包"
VIAddVersionKey /LANG=2052 "FileVersion" "0.3.1"
VIAddVersionKey /LANG=2052 "LegalCopyright" "Paws Nest contributors"
!define MUI_WELCOMEPAGE_TITLE "把小猫带回桌面"
!define MUI_WELCOMEPAGE_TEXT "选择一个文件夹，解压后即可使用爪爪小窝。$\r$\n$\r$\n不需要开发工具或 GPT 账号，也不需要管理员权限。$\r$\n$\r$\n如有旧版正在运行，请先从托盘菜单退出。此解压包不会删除你的本机存档。"
!insertmacro MUI_PAGE_WELCOME
!define MUI_DIRECTORYPAGE_TEXT_TOP "选择存放小窝的文件夹。请保留解压后的全部文件，之后双击其中的 PawsNest.exe 启动。"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_TITLE "小窝已经准备好了"
!define MUI_FINISHPAGE_TEXT "以后双击文件夹中的 PawsNest.exe 即可启动。使用说明.html 里有领养、桌宠与聊天设置说明。$\r$\n$\r$\n这个解压包没有添加开机启动或系统服务。"
!define MUI_FINISHPAGE_RUN "$INSTDIR\PawsNest.exe"
!define MUI_FINISHPAGE_RUN_TEXT "现在打开爪爪小窝"
!define MUI_FINISHPAGE_RUN_NOTCHECKED
!define MUI_FINISHPAGE_SHOWREADME "$INSTDIR\使用说明.html"
!define MUI_FINISHPAGE_SHOWREADME_TEXT "打开使用说明"
!define MUI_FINISHPAGE_SHOWREADME_NOTCHECKED
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_LANGUAGE "SimpChinese"
Function .onInit
  ${IfNot} ${RunningX64}
    MessageBox MB_OK "这个版本适用于 Windows 64 位（x64）。" /SD IDOK
    Abort
  ${EndIf}
FunctionEnd
Section
  SetOutPath "$INSTDIR"
  SetOverwrite on
  File /r "${CLIENT_DIR}\*"
SectionEnd
