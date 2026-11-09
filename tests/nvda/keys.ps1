# Real OS keystrokes for the NVDA log run (tests/nvda/run.ts): SendInput, so NVDA sees them as a user's keys.
# Usage: powershell -File keys.ps1 -Keys Tab,Enter,Right,"Shift+Tab",d,F5  (one name per key press; "+" joins modifiers)
param([string[]]$Keys, [int]$GapMs = 250)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class Kb {
  [StructLayout(LayoutKind.Sequential)] struct KEYBDINPUT { public ushort wVk; public ushort wScan; public uint dwFlags; public uint time; public IntPtr dwExtraInfo; }
  [StructLayout(LayoutKind.Explicit)] struct INPUTUNION { [FieldOffset(0)] public KEYBDINPUT ki; [FieldOffset(0)] public long pad1; [FieldOffset(8)] public long pad2; [FieldOffset(16)] public long pad3; }
  [StructLayout(LayoutKind.Sequential)] struct INPUT { public uint type; public INPUTUNION u; }
  [DllImport("user32.dll", SetLastError = true)] static extern uint SendInput(uint n, INPUT[] inputs, int size);
  const uint KEYUP = 2, EXTENDED = 1;
  static bool Ext(ushort vk) { return vk == 0x25 || vk == 0x26 || vk == 0x27 || vk == 0x28 || vk == 0x21 || vk == 0x22 || vk == 0x24 || vk == 0x23 || vk == 0x2D || vk == 0x2E; }
  public static void Key(ushort vk, bool up) {
    var i = new INPUT[1];
    i[0].type = 1;
    i[0].u.ki.wVk = vk;
    i[0].u.ki.dwFlags = (up ? KEYUP : 0) | (Ext(vk) ? EXTENDED : 0);
    SendInput(1, i, Marshal.SizeOf(typeof(INPUT)));
  }
}
"@

$named = @{ Tab = 0x09; Enter = 0x0D; Esc = 0x1B; Space = 0x20; Left = 0x25; Up = 0x26; Right = 0x27; Down = 0x28; PageUp = 0x21; PageDown = 0x22; Home = 0x24; End = 0x23; F5 = 0x74; Shift = 0x10; Ctrl = 0x11; Alt = 0x12; Period = 0xBE }

function Vk([string]$name) {
  if ($named.ContainsKey($name)) { return [uint16]$named[$name] }
  if ($name.Length -eq 1) { return [uint16][int][char]$name.ToUpper() }
  throw "unknown key $name"
}

foreach ($k in $Keys) {
  $parts = $k -split "\+"
  $vks = $parts | ForEach-Object { Vk $_ }
  foreach ($v in $vks) { [Kb]::Key($v, $false) }
  [array]::Reverse($vks)
  foreach ($v in $vks) { [Kb]::Key($v, $true) }
  Start-Sleep -Milliseconds $GapMs
}
