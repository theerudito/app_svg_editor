#define MyAppName "SVG Editor"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Between Bytes Software"
#define MyAppExeName "svg_editor.exe"
#define ReleaseDir "..\bin"
#define AppIcon "icon.ico"

#if !FileExists(AddBackslash(SourcePath) + AppIcon)
  #error "The installer icon is missing: build\windows\icon.ico"
#endif

[Setup]
AppId={{D87591BF-2D29-4EAA-BA14-FAA01EDCAE89}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}

AppPublisher={#MyAppPublisher}

DefaultDirName={commonpf32}\{#MyAppPublisher}\{#MyAppName}

DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes

ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=admin

OutputDir=.
OutputBaseFilename=SVG-Editor-Setup-{#MyAppVersion}

SetupIconFile={#AppIcon}
UninstallDisplayIcon={app}\{#MyAppExeName}

Compression=lzma2
SolidCompression=yes
WizardStyle=modern

VersionInfoVersion=1.0.0.1
VersionInfoProductVersion=1.0.0.1
VersionInfoProductName={#MyAppName}
VersionInfoDescription={#MyAppName} Installer
VersionInfoCompany={#MyAppPublisher}

[Tasks]
Name: "desktopicon"; \
    Description: "Create a &desktop shortcut"; \
    GroupDescription: "Additional shortcuts:"; \
    Flags: unchecked

[Files]
Source: "{#ReleaseDir}\*"; \
    DestDir: "{app}"; \
    Flags: ignoreversion recursesubdirs createallsubdirs
Source: "{#SourcePath}\icon.ico"; \
    DestDir: "{app}"; \
    Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; \
    Filename: "{app}\{#MyAppExeName}"; \
    WorkingDir: "{app}"; \
    IconFilename: "{app}\icon.ico"

Name: "{autodesktop}\{#MyAppName}"; \
    Filename: "{app}\{#MyAppExeName}"; \
    WorkingDir: "{app}"; \
    IconFilename: "{app}\icon.ico"; \
    Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; \
    Description: "Launch {#MyAppName}"; \
    WorkingDir: "{app}"; \
    Flags: nowait postinstall skipifsilent

