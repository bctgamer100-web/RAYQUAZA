// ตัวเปิดโปรแกรม RAYQUAZA: เปิดเว็บจริง (GitHub Pages) เป็นหน้าต่างแอปของ Chrome ในโปรไฟล์ที่ลงส่วนขยาย RAYQUAZA ไว้
// ส่วนขยาย (ดึง ORDER / สต็อกจาก BigSeller, นำเข้า BigSeller) และบัญชี BigSeller ที่ล็อกอินไว้จึงใช้ได้เหมือนเปิดในเว็บ
// ไม่มีอินเทอร์เน็ต = เปิดสำเนาในเครื่อง (app\index.html) แทน (ข้อมูลที่บันทึกในเบราว์เซอร์แยกจากของเว็บ)
// ไม่มี Chrome = ใช้ Edge โปรไฟล์ปกติ
using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Windows.Forms;
using Microsoft.Win32;

static class Launcher
{
    const string Name = "RAYQUAZA";
    const string WebUrl = "https://bctgamer100-web.github.io/RAYQUAZA/";

    [STAThread]
    static void Main()
    {
        string local = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "app", "index.html");
        string url = Online() ? WebUrl : (File.Exists(local) ? new Uri(local).AbsoluteUri : WebUrl);

        string chrome = FindExe("chrome.exe", new[] {
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe") });
        string browser = chrome;
        string args = "--app=\"" + url + "\" --start-maximized";
        if (chrome != null)
        {
            string profile = ChromeProfile();
            if (profile != null) args += " --profile-directory=\"" + profile + "\"";
        }
        else
        {
            browser = FindExe("msedge.exe", new[] {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe") });
        }
        if (browser == null)
        {
            MessageBox.Show("ไม่พบ Google Chrome หรือ Microsoft Edge ในเครื่องนี้", Name, MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }
        Process.Start(new ProcessStartInfo(browser, args) { UseShellExecute = false });
    }

    static bool Online()
    {
        try
        {
            ServicePointManager.SecurityProtocol |= (SecurityProtocolType)3072; // TLS 1.2
            var req = (HttpWebRequest)WebRequest.Create(WebUrl);
            req.Method = "HEAD";
            req.Timeout = 4000;
            using (var res = (HttpWebResponse)req.GetResponse()) return (int)res.StatusCode < 400;
        }
        catch { return false; }
    }

    // โปรไฟล์ Chrome ที่โหลดส่วนขยาย stock-sync-extension ของ RAYQUAZA ไว้ (ไม่เจอ = โปรไฟล์ที่ใช้ล่าสุด)
    static string ChromeProfile()
    {
        string data = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\User Data");
        if (!Directory.Exists(data)) return null;
        string fallback = null;
        foreach (string dir in Directory.GetDirectories(data))
        {
            string name = Path.GetFileName(dir);
            if (name != "Default" && !name.StartsWith("Profile ")) continue;
            string prefs = Path.Combine(dir, "Secure Preferences");
            if (!File.Exists(prefs)) continue;
            string text;
            try { text = File.ReadAllText(prefs); } catch { continue; }
            if (text.IndexOf("RAYQUAZA-main\\\\stock-sync-extension", StringComparison.OrdinalIgnoreCase) >= 0) return name;
            if (fallback == null && text.IndexOf("stock-sync-extension", StringComparison.OrdinalIgnoreCase) >= 0) fallback = name;
        }
        return fallback;
    }

    static string FindExe(string exe, string[] guesses)
    {
        foreach (RegistryKey root in new[] { Registry.CurrentUser, Registry.LocalMachine })
        {
            using (RegistryKey k = root.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\" + exe))
            {
                string p = k == null ? null : k.GetValue("") as string;
                if (!string.IsNullOrEmpty(p) && File.Exists(p.Trim('"'))) return p.Trim('"');
            }
        }
        foreach (string p in guesses) if (File.Exists(p)) return p;
        return null;
    }
}
