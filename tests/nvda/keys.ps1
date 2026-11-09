# Real OS keystrokes for the NVDA log run (tests/nvda/run.ts): SendInput, so NVDA sees them as a user's keys.
# Usage: powershell -File keys.ps1 -Keys Tab,Enter,Right,"Shift+Tab",d,F5  (one name per key press; "+" joins modifiers)
# -Owner <folder>: before every key, the foreground window must belong to a program under that folder (the test browser);
# it is brought forward if it is not, and if that fails nothing is sent and the script exits 2 (keys never reach another app).
param([string[]]$Keys, [int]$GapMs = 250, [string]$Owner = "")
# With -File, "a,Right" arrives as one string: split it into key names.
$Keys = @($Keys | ForEach-Object { $_ -split "," } | Where-Object { $_ })

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class Kb {
  [StructLayout(LayoutKind.Sequential)] struct KEYBDINPUT { public ushort wVk; public ushort wScan; public uint dwFlags; public uint time; public IntPtr dwExtraInfo; }
  [StructLayout(LayoutKind.Explicit)] struct INPUTUNION { [FieldOffset(0)] public KEYBDINPUT ki; [FieldOffset(0)] public long pad1; [FieldOffset(8)] public long pad2; [FieldOffset(16)] public long pad3; [FieldOffset(24)] public long pad4; }
  [StructLayout(LayoutKind.Sequential)] struct INPUT { public uint type; public INPUTUNION u; }
  [DllImport("user32.dll", SetLastError = true)] static extern uint SendInput(uint n, INPUT[] inputs, int size);
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint procId);
  public static int ForegroundProcess() { uint id; GetWindowThreadProcessId(GetForegroundWindow(), out id); return (int)id; }
  const uint KEYUP = 2, EXTENDED = 1;
  static bool Ext(ushort vk) { return vk == 0x25 || vk == 0x26 || vk == 0x27 || vk == 0x28 || vk == 0x21 || vk == 0x22 || vk == 0x24 || vk == 0x23 || vk == 0x2D || vk == 0x2E; }
  // The union is as large as MOUSEINPUT (32 bytes on x64, so INPUT is 40); a wrong size makes SendInput drop every key
  // silently, so Key returns whether Windows took it.
  public static bool Key(ushort vk, bool up) {
    var i = new INPUT[1];
    i[0].type = 1;
    i[0].u.ki.wVk = vk;
    i[0].u.ki.dwFlags = (up ? KEYUP : 0) | (Ext(vk) ? EXTENDED : 0);
    return SendInput(1, i, Marshal.SizeOf(typeof(INPUT))) == 1;
  }
}
"@

$named = @{ Tab = 0x09; Enter = 0x0D; Esc = 0x1B; Space = 0x20; Left = 0x25; Up = 0x26; Right = 0x27; Down = 0x28; PageUp = 0x21; PageDown = 0x22; Home = 0x24; End = 0x23; F5 = 0x74; Shift = 0x10; Ctrl = 0x11; Alt = 0x12; Period = 0xBE }

function Vk([string]$name) {
  if ($named.ContainsKey($name)) { return [uint16]$named[$name] }
  if ($name.Length -eq 1) { return [uint16][int][char]$name.ToUpper() }
  throw "unknown key $name"
}

function OwnsForeground {
  if (-not $Owner) { return $true }
  $p = Get-Process -Id ([Kb]::ForegroundProcess()) -ErrorAction SilentlyContinue
  return [bool]($p -and $p.Path -and $p.Path.StartsWith($Owner, [StringComparison]::OrdinalIgnoreCase))
}

function EnsureForeground {
  if (OwnsForeground) { return }
  $w = Get-Process | Where-Object { $_.Path -and $_.Path.StartsWith($Owner, [StringComparison]::OrdinalIgnoreCase) -and $_.MainWindowHandle -ne 0 } | Select-Object -First 1
  if ($w) {
    $shell = New-Object -ComObject WScript.Shell
    for ($i = 0; $i -lt 5 -and -not (OwnsForeground); $i++) { [void]$shell.AppActivate($w.Id); Start-Sleep -Milliseconds 400 }
  }
  if (-not (OwnsForeground)) { [Console]::Error.WriteLine("keys.ps1: the test browser is not in front; no key sent"); exit 2 }
}

foreach ($k in $Keys) {
  EnsureForeground
  $parts = $k -split "\+"
  $vks = @($parts | ForEach-Object { Vk $_ })
  $ok = $true
  foreach ($v in $vks) { $ok = [Kb]::Key($v, $false) -and $ok }
  [array]::Reverse($vks)
  # Every key is released, even after a refused press, so none is left held down.
  foreach ($v in $vks) { $ok = [Kb]::Key($v, $true) -and $ok }
  if (-not $ok) { [Console]::Error.WriteLine("keys.ps1: Windows refused key $k (SendInput)"); exit 3 }
  Start-Sleep -Milliseconds $GapMs
}
