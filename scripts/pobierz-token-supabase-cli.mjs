#!/usr/bin/env node
/**
 * Odczyt tokenu Supabase CLI z Windows Credential Manager (profil „supabase”).
 * Używane tylko lokalnie przez skrypty konfiguracyjne — nie loguj pełnego tokenu.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ps = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class CredMan {
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
  public struct CREDENTIAL {
    public int Flags; public int Type; public IntPtr TargetName; public IntPtr Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten; public int CredentialBlobSize;
    public IntPtr CredentialBlob; public int Persist; public int AttributeCount; public IntPtr Attributes;
    public IntPtr TargetAlias; public IntPtr UserName;
  }
  [DllImport("advapi32", SetLastError=true, CharSet=CharSet.Unicode)]
  public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credential);
  [DllImport("advapi32")] public static extern void CredFree(IntPtr cred);
}
"@
$ptr = [IntPtr]::Zero
if (-not [CredMan]::CredRead("Supabase CLI:supabase", 1, 0, [ref]$ptr)) { exit 1 }
$cred = [Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [type][CredMan+CREDENTIAL])
$bytes = New-Object byte[] $cred.CredentialBlobSize
[Runtime.InteropServices.Marshal]::Copy($cred.CredentialBlob, $bytes, 0, $cred.CredentialBlobSize)
[CredMan]::CredFree($ptr)
[Console]::Out.Write([Text.Encoding]::UTF8.GetString($bytes))
`;

const tmp = join(tmpdir(), `supabase-token-${process.pid}.ps1`);
try {
  writeFileSync(tmp, ps, "utf8");
  const out = execFileSync(
    "powershell",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", tmp],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ).trim();
  if (!out) process.exit(1);
  process.stdout.write(out);
} finally {
  try {
    unlinkSync(tmp);
  } catch {
    /* ignore */
  }
}
