' Invisible zero-window smart launcher for Antigravity 2.0 (Wallpaper Engine + coexistence auto-guard).
' Before starting Antigravity.exe, checks app.asar in ~20ms and automatically re-applies
' installed plugin hooks (antigravity-zh-cn & antigravity-wallpaper-engine) if an official update overwrote app.asar.
Option Explicit

Dim sh, fso, localAppData, userProfile, agyExe, zhPatch, wePatch, argStr, i
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

localAppData = sh.ExpandEnvironmentStrings("%LOCALAPPDATA%")
userProfile = sh.ExpandEnvironmentStrings("%USERPROFILE%")
agyExe = localAppData & "\Programs\antigravity\Antigravity.exe"
zhPatch = userProfile & "\.gemini\config\plugins\antigravity-zh-cn\scripts\patch-asar.mjs"
wePatch = userProfile & "\.gemini\config\plugins\antigravity-wallpaper-engine\scripts\patch-asar.mjs"

' Run silent fast check/patch BEFORE Antigravity.exe locks app.asar (bWaitOnReturn = True)
If fso.FileExists(zhPatch) Then
  On Error Resume Next
  sh.Run "node """ & zhPatch & """ --quiet", 0, True
  On Error GoTo 0
End If

If fso.FileExists(wePatch) Then
  On Error Resume Next
  sh.Run "node """ & wePatch & """ --quiet", 0, True
  On Error GoTo 0
End If

argStr = ""
For i = 0 To WScript.Arguments.Count - 1
  argStr = argStr & " """ & WScript.Arguments(i) & """"
Next

If fso.FileExists(agyExe) Then
  sh.Run """" & agyExe & """" & argStr, 1, False
End If
