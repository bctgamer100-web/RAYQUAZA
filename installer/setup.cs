// ตัวติดตั้ง RAYQUAZA (หน้าต่างธีมเดียวกับเว็บ: กลางวัน = MEGA เขียวมรกต/ทอง, 18:00–05:59 = ไชนี่ ดำ/แดง/ส้ม)
// ไฟล์โปรแกรมทั้งหมดฝังอยู่ใน .exe นี้ (resource): app.zip, launcher.exe, app.ico และภาพประกอบ
// ติดตั้งลง %LOCALAPPDATA%\Programs\RAYQUAZA สำหรับผู้ใช้ปัจจุบัน (ไม่ต้องใช้สิทธิ์ผู้ดูแล)
// ตัวเองถูกคัดลอกไปเป็น uninstall.exe เรียกด้วย /uninstall เพื่อถอนการติดตั้ง
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Text;
using System.IO;
using System.IO.Compression;
using System.Management;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

static class Program
{
    [DllImport("user32.dll")] static extern bool SetProcessDPIAware();

    [STAThread]
    static void Main(string[] args)
    {
        try { SetProcessDPIAware(); } catch { }
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        bool uninstall = Array.Exists(args, a => a.Equals("/uninstall", StringComparison.OrdinalIgnoreCase));
        Application.Run(new SetupForm(uninstall));
    }
}

static class Paths
{
    public const string Name = "RAYQUAZA";
    public const string RegKey = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\RAYQUAZA";
    public static readonly string Local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
    public static readonly string Dest = Path.Combine(Local, "Programs", Name);
    public static readonly string Data = Path.Combine(Local, Name);
    public static readonly string Profile = Path.Combine(Data, "profile");
    public static readonly string Exe = Path.Combine(Dest, Name + ".exe");
    public static readonly string DesktopLnk = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), Name + ".lnk");
    public static readonly string StartLnk = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), Name + ".lnk");

    // ตัวติดตั้งรุ่นก่อนลง RAYQUAZA ไว้ในชื่อ "ORDER Workspace" (ชื่อ/โฟลเดอร์/โปรไฟล์เดียวกับระบบเดิม)
    public const string LegacyName = "ORDER Workspace";
    public const string LegacyRegKey = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\OrderWorkspace";
    public static readonly string LegacyDest = Path.Combine(Local, "Programs", LegacyName);
    public static readonly string LegacyProfile = Path.Combine(Local, LegacyName, "profile");

    public static bool LegacyIsRayquaza()
    {
        try
        {
            string idx = Path.Combine(LegacyDest, "app", "index.html");
            return File.Exists(idx) && File.ReadAllText(idx).Contains("<title>RAYQUAZA");
        }
        catch { return false; }
    }

    public static string InstalledVersion()
    {
        using (RegistryKey k = Registry.CurrentUser.OpenSubKey(RegKey))
            return k == null || !File.Exists(Exe) ? null : k.GetValue("DisplayVersion") as string;
    }

    // หน้าต่างแอปที่ยังเปิดอยู่ (Edge/Chrome ที่ใช้โปรไฟล์นี้) จะล็อกไฟล์ในโปรไฟล์
    public static bool ProfileInUse(string profile)
    {
        try
        {
            string needle = profile.ToLowerInvariant();
            using (var s = new ManagementObjectSearcher("SELECT CommandLine FROM Win32_Process WHERE Name='msedge.exe' OR Name='chrome.exe'"))
                foreach (ManagementObject o in s.Get())
                {
                    string cl = o["CommandLine"] as string;
                    if (cl != null && cl.ToLowerInvariant().Contains(needle)) return true;
                }
        }
        catch { }
        return false;
    }
}

// สีจาก css/rayquaza.css
class Palette
{
    public Color Base, Fg, Muted, Trim, RibbonA, RibbonB, BtnFg, Panel;
    public string Dragon, Logo, Mode;

    public static Palette Now()
    {
        int h = DateTime.Now.Hour;
        if (h >= 6 && h < 18)
            return new Palette {
                Base = Hex("#0f3b31"), Fg = Hex("#ffe7a1"), Muted = Hex("#a9d8c8"), Trim = Hex("#c8a35a"),
                RibbonA = Hex("#ffd24a"), RibbonB = Hex("#f3a35a"), BtnFg = Hex("#14251f"), Panel = Hex("#1d6b58"),
                Dragon = "dragon-day.png", Logo = "logo-day.png", Mode = "MEGA" };
        return new Palette {
            Base = Hex("#08080a"), Fg = Hex("#fff3e4"), Muted = Hex("#c2aea0"), Trim = Hex("#e0301e"),
            RibbonA = Hex("#ffd34d"), RibbonB = Hex("#ff8a3d"), BtnFg = Hex("#1a0600"), Panel = Hex("#201c22"),
            Dragon = "dragon-night.png", Logo = "logo-night.png", Mode = "SHINY" };
    }

    static Color Hex(string s) { return ColorTranslator.FromHtml(s); }
}

class Btn
{
    public string Text; public bool Primary; public Action OnClick; public RectangleF R;
}

class Check
{
    public string Text; public bool Value; public RectangleF R;
}

enum Page { Welcome, Working, Done, Error, Uninstall, Uninstalled }

class SetupForm : Form
{
    const float W = 760, H = 460;
    readonly bool uninstallMode;
    readonly Palette P = Palette.Now();
    readonly float S;
    readonly Image bg, dragon, logo;
    readonly Font fTitle, fHead, fBody, fSmall, fBtn, fTag;
    readonly string version = BuildInfo.Version;
    readonly string installed = Paths.InstalledVersion();
    readonly bool legacy = Paths.LegacyIsRayquaza();

    Page page;
    string head = "", body = "", status = "";
    float progress, shown, shimmer;
    readonly List<Btn> btns = new List<Btn>();
    readonly List<Check> checks = new List<Check>();
    readonly Check chkDesktop, chkLaunch, chkLegacy, chkWipe;
    object hover;
    Point dragFrom;
    readonly System.Windows.Forms.Timer anim = new System.Windows.Forms.Timer { Interval = 16 };

    public SetupForm(bool uninstall)
    {
        uninstallMode = uninstall;
        using (Graphics g = CreateGraphics()) S = g.DpiX / 96f;
        FormBorderStyle = FormBorderStyle.None;
        StartPosition = FormStartPosition.CenterScreen;
        ClientSize = new Size(D(W), D(H));
        Text = uninstall ? "ถอนการติดตั้ง RAYQUAZA" : "ติดตั้ง RAYQUAZA";
        BackColor = P.Base;
        DoubleBuffered = true;
        KeyPreview = true;
        using (Stream s = Res("app.ico")) Icon = new Icon(s);
        bg = Img("bg.jpg"); dragon = Img(P.Dragon); logo = Img(P.Logo);

        string ui = "Leelawadee UI";
        fTitle = new Font("Segoe UI Black", 30f, FontStyle.Regular);
        fHead = new Font(ui, 15f, FontStyle.Bold);
        fBody = new Font(ui, 10.5f);
        fSmall = new Font(ui, 9f);
        fBtn = new Font(ui, 11f, FontStyle.Bold);
        fTag = new Font("Segoe UI", 7.5f, FontStyle.Bold);

        chkDesktop = new Check { Text = "สร้างไอคอนบนเดสก์ท็อป", Value = installed == null || File.Exists(Paths.DesktopLnk) };
        chkLaunch = new Check { Text = "เปิดโปรแกรมเมื่อติดตั้งเสร็จ", Value = true };
        chkLegacy = new Check { Text = "ย้ายข้อมูลจาก ORDER Workspace (รุ่นก่อน) แล้วลบตัวเก่า", Value = true };
        chkWipe = new Check { Text = "ลบข้อมูลที่บันทึกไว้ด้วย\n(ไฟล์ ORDER ที่เคยใช้ ใบปริ้น เลเวล การตั้งค่า รหัสล็อก)", Value = false };

        anim.Tick += (o, e) => {
            shimmer = (shimmer + 0.012f) % 1.6f;
            shown += (progress - shown) * 0.12f;
            if (Math.Abs(progress - shown) < 0.001f) shown = progress;
            Invalidate();
        };

        if (uninstall) ShowUninstall(); else ShowWelcome();
    }

    int D(float v) { return (int)Math.Round(v * S); }
    RectangleF RD(float x, float y, float w, float h) { return new RectangleF(x * S, y * S, w * S, h * S); }

    static Stream Res(string name) { return Assembly.GetExecutingAssembly().GetManifestResourceStream(name); }
    static Image Img(string name) { using (Stream s = Res(name)) return new Bitmap(Image.FromStream(s)); }

    // ---------- หน้า ----------
    void SetPage(Page p, string h, string b)
    {
        page = p; head = h; body = b;
        btns.Clear(); checks.Clear(); hover = null;
        anim.Enabled = p == Page.Working || p == Page.Done || p == Page.Uninstalled;
        Invalidate();
    }

    void AddBtn(string text, bool primary, Action click) { btns.Add(new Btn { Text = text, Primary = primary, OnClick = click }); }

    void ShowWelcome()
    {
        bool update = installed != null;
        SetPage(Page.Welcome, update ? "พร้อมอัปเดต" : "พร้อมติดตั้ง",
            (update ? "ติดตั้งอยู่แล้ว v" + installed + "  →  v" + version + "\n" : "")
            + "ติดตั้งให้ผู้ใช้นี้ ไม่ต้องใช้สิทธิ์ผู้ดูแล\nข้อมูลที่บันทึกไว้ในโปรแกรมจะอยู่ครบเมื่อติดตั้งทับ");
        checks.Add(chkDesktop); checks.Add(chkLaunch);
        if (legacy) checks.Add(chkLegacy);
        AddBtn(update ? "อัปเดต" : "ติดตั้ง", true, StartInstall);
        AddBtn("ยกเลิก", false, Close);
    }

    void ShowUninstall()
    {
        SetPage(Page.Uninstall, "ถอนการติดตั้ง RAYQUAZA",
            "ลบไฟล์โปรแกรม ไอคอน และรายการใน Settings > Apps\nข้อมูลที่บันทึกไว้จะถูกเก็บไว้ ถ้าไม่ได้ติ๊กด้านล่าง");
        checks.Add(chkWipe);
        AddBtn("ถอนการติดตั้ง", true, StartUninstall);
        AddBtn("ยกเลิก", false, Close);
    }

    void ShowError(string msg, Action retry)
    {
        SetPage(Page.Error, "ไม่สำเร็จ", msg);
        AddBtn("ลองอีกครั้ง", true, retry);
        AddBtn("ปิด", false, Close);
    }

    void Report(float p, string s)
    {
        BeginInvoke((Action)(() => { progress = p; status = s; Invalidate(); }));
    }

    void Run(Action work, Action done, Action retry)
    {
        progress = 0; shown = 0; status = "";
        new Thread(() => {
            try { work(); BeginInvoke(done); }
            catch (Exception ex) { BeginInvoke((Action)(() => ShowError(ex.Message, retry))); }
        }) { IsBackground = true }.Start();
    }

    // ---------- ติดตั้ง ----------
    void StartInstall()
    {
        bool desktop = chkDesktop.Value, launch = chkLaunch.Value, migrate = legacy && chkLegacy.Value;
        if (migrate && !Directory.Exists(Paths.Profile) && Paths.ProfileInUse(Paths.LegacyProfile))
        {
            ShowError("กรุณาปิดหน้าต่างโปรแกรม ORDER Workspace (RAYQUAZA รุ่นก่อน) ก่อน\nเพื่อย้ายข้อมูลที่บันทึกไว้ได้ครบ", ShowWelcome);
            return;
        }
        SetPage(Page.Working, installed != null ? "กำลังอัปเดต…" : "กำลังติดตั้ง…", "");
        Run(() => Install(desktop, migrate), () => {
            progress = 1;
            SetPage(Page.Done, "ติดตั้งเรียบร้อย", "เปิดได้จากไอคอน RAYQUAZA บนเดสก์ท็อป หรือ Start Menu\nถอนการติดตั้งได้ที่ Settings > Apps");
            status = "COMPLETE";
            AddBtn("เปิด RAYQUAZA", true, () => { Launch(); Close(); });
            AddBtn("ปิด", false, Close);
            if (launch) { Launch(); }
        }, ShowWelcome);
    }

    void Install(bool desktop, bool migrate)
    {
        Report(0.03f, "เตรียมโฟลเดอร์");
        string app = Path.Combine(Paths.Dest, "app");
        if (Directory.Exists(app)) Directory.Delete(app, true);
        Directory.CreateDirectory(app);

        using (Stream zs = Res("app.zip"))
        using (var zip = new ZipArchive(zs, ZipArchiveMode.Read))
        {
            int n = zip.Entries.Count, i = 0;
            string root = Path.GetFullPath(app) + Path.DirectorySeparatorChar;
            foreach (ZipArchiveEntry e in zip.Entries)
            {
                i++;
                string target = Path.GetFullPath(Path.Combine(app, e.FullName.Replace('/', Path.DirectorySeparatorChar)));
                if (!target.StartsWith(root, StringComparison.OrdinalIgnoreCase)) continue;
                if (e.Name.Length == 0) { Directory.CreateDirectory(target); continue; }
                Directory.CreateDirectory(Path.GetDirectoryName(target));
                e.ExtractToFile(target, true);
                if (i % 3 == 0 || i == n) Report(0.05f + 0.7f * i / n, "แตกไฟล์ " + e.FullName);
            }
        }

        Report(0.78f, "ติดตั้งตัวเปิดโปรแกรม");
        WriteRes("launcher.exe", Paths.Exe);
        WriteRes("app.ico", Path.Combine(Paths.Dest, "app.ico"));
        string self = Application.ExecutablePath, uninst = Path.Combine(Paths.Dest, "uninstall.exe");
        if (!string.Equals(Path.GetFullPath(self), Path.GetFullPath(uninst), StringComparison.OrdinalIgnoreCase))
            File.Copy(self, uninst, true);

        Report(0.84f, "สร้างทางลัด");
        string ico = Path.Combine(Paths.Dest, "app.ico");
        Shortcut(Paths.StartLnk, ico);
        if (desktop) Shortcut(Paths.DesktopLnk, ico);
        else if (File.Exists(Paths.DesktopLnk)) File.Delete(Paths.DesktopLnk);

        Report(0.88f, "ลงทะเบียนใน Settings > Apps");
        using (RegistryKey k = Registry.CurrentUser.CreateSubKey(Paths.RegKey))
        {
            k.SetValue("DisplayName", Paths.Name);
            k.SetValue("DisplayIcon", ico);
            k.SetValue("DisplayVersion", version);
            k.SetValue("Publisher", Paths.Name);
            k.SetValue("InstallLocation", Paths.Dest);
            k.SetValue("UninstallString", "\"" + uninst + "\" /uninstall");
            k.SetValue("NoModify", 1, RegistryValueKind.DWord);
            k.SetValue("NoRepair", 1, RegistryValueKind.DWord);
            k.SetValue("EstimatedSize", (int)(DirSize(Paths.Dest) / 1024), RegistryValueKind.DWord);
        }

        if (migrate)
        {
            if (!Directory.Exists(Paths.Profile) && Directory.Exists(Paths.LegacyProfile))
            {
                Report(0.92f, "ย้ายข้อมูลจาก ORDER Workspace");
                CopyDir(Paths.LegacyProfile, Paths.Profile);
            }
            Report(0.97f, "ลบ ORDER Workspace ตัวเก่า (ข้อมูลเดิมยังเก็บไว้)");
            string desk = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
            string progs = Environment.GetFolderPath(Environment.SpecialFolder.Programs);
            TryDelete(Path.Combine(desk, Paths.LegacyName + ".lnk"));
            TryDelete(Path.Combine(progs, Paths.LegacyName + ".lnk"));
            try { Registry.CurrentUser.DeleteSubKeyTree(Paths.LegacyRegKey, false); } catch { }
            try { Directory.Delete(Paths.LegacyDest, true); } catch { }
        }
        Report(1f, "COMPLETE");
    }

    static void WriteRes(string name, string path)
    {
        using (Stream s = Res(name))
        using (FileStream f = File.Create(path)) s.CopyTo(f);
    }

    static void Shortcut(string lnk, string ico)
    {
        Type t = Type.GetTypeFromProgID("WScript.Shell");
        object sh = Activator.CreateInstance(t);
        try
        {
            object sc = t.InvokeMember("CreateShortcut", BindingFlags.InvokeMethod, null, sh, new object[] { lnk });
            Type st = sc.GetType();
            st.InvokeMember("TargetPath", BindingFlags.SetProperty, null, sc, new object[] { Paths.Exe });
            st.InvokeMember("WorkingDirectory", BindingFlags.SetProperty, null, sc, new object[] { Paths.Dest });
            st.InvokeMember("IconLocation", BindingFlags.SetProperty, null, sc, new object[] { ico });
            st.InvokeMember("Description", BindingFlags.SetProperty, null, sc, new object[] { "RAYQUAZA — จัดการออเดอร์และสต็อก" });
            st.InvokeMember("Save", BindingFlags.InvokeMethod, null, sc, null);
            Marshal.FinalReleaseComObject(sc);
        }
        finally { Marshal.FinalReleaseComObject(sh); }
    }

    // ไฟล์ล็อกของเบราว์เซอร์ข้ามได้ ที่เหลือคัดลอกทั้งหมด
    static void CopyDir(string from, string to)
    {
        Directory.CreateDirectory(to);
        foreach (string f in Directory.GetFiles(from))
        {
            string n = Path.GetFileName(f);
            if (n == "lockfile" || n.StartsWith("Singleton")) continue;
            try { File.Copy(f, Path.Combine(to, n), true); } catch (Exception) { }
        }
        foreach (string d in Directory.GetDirectories(from)) CopyDir(d, Path.Combine(to, Path.GetFileName(d)));
    }

    static long DirSize(string dir)
    {
        long n = 0;
        foreach (string f in Directory.GetFiles(dir, "*", SearchOption.AllDirectories)) n += new FileInfo(f).Length;
        return n;
    }

    static void TryDelete(string f) { try { if (File.Exists(f)) File.Delete(f); } catch { } }

    static void Launch()
    {
        try { Process.Start(new ProcessStartInfo(Paths.Exe) { WorkingDirectory = Paths.Dest }); } catch { }
    }

    // ---------- ถอนการติดตั้ง ----------
    void StartUninstall()
    {
        bool wipe = chkWipe.Value;
        if (Paths.ProfileInUse(Paths.Profile))
        {
            ShowError("กรุณาปิดหน้าต่างโปรแกรม RAYQUAZA ก่อนถอนการติดตั้ง", ShowUninstall);
            return;
        }
        SetPage(Page.Working, "กำลังถอนการติดตั้ง…", "");
        Run(() => {
            Report(0.2f, "ลบทางลัด");
            TryDelete(Paths.DesktopLnk); TryDelete(Paths.StartLnk);
            Report(0.4f, "ลบรายการใน Settings > Apps");
            Registry.CurrentUser.DeleteSubKeyTree(Paths.RegKey, false);
            Report(0.6f, "ลบไฟล์โปรแกรม");
            string app = Path.Combine(Paths.Dest, "app");
            if (Directory.Exists(app)) Directory.Delete(app, true);
            TryDelete(Paths.Exe); TryDelete(Path.Combine(Paths.Dest, "app.ico"));
            if (wipe) { Report(0.85f, "ลบข้อมูลที่บันทึกไว้"); if (Directory.Exists(Paths.Data)) Directory.Delete(Paths.Data, true); }
            Report(1f, "COMPLETE");
        }, () => {
            progress = 1;
            SetPage(Page.Uninstalled, "ถอนการติดตั้งเรียบร้อย", wipe ? "ลบโปรแกรมและข้อมูลทั้งหมดแล้ว" : "ลบโปรแกรมแล้ว ข้อมูลที่บันทึกไว้ยังอยู่\nติดตั้งใหม่เมื่อไรก็ใช้ต่อได้ทันที");
            status = "COMPLETE";
            AddBtn("ปิด", true, Close);
        }, ShowUninstall);
    }

    protected override void OnFormClosed(FormClosedEventArgs e)
    {
        // uninstall.exe ลบตัวเองขณะทำงานไม่ได้ ให้ cmd ลบโฟลเดอร์ตามหลังเมื่อปิดหน้าต่าง
        if (page == Page.Uninstalled && Application.ExecutablePath.StartsWith(Paths.Dest, StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                Process.Start(new ProcessStartInfo("cmd.exe", "/c ping 127.0.0.1 -n 3 >nul & rmdir /s /q \"" + Paths.Dest + "\"")
                    { CreateNoWindow = true, UseShellExecute = false, WorkingDirectory = Path.GetTempPath() });
            }
            catch { }
        }
        base.OnFormClosed(e);
    }

    // ---------- วาดหน้าต่าง ----------
    static GraphicsPath Round(RectangleF r, float rad)
    {
        var p = new GraphicsPath();
        float d = rad * 2;
        p.AddArc(r.X, r.Y, d, d, 180, 90);
        p.AddArc(r.Right - d, r.Y, d, d, 270, 90);
        p.AddArc(r.Right - d, r.Bottom - d, d, d, 0, 90);
        p.AddArc(r.X, r.Bottom - d, d, d, 90, 90);
        p.CloseFigure();
        return p;
    }

    static Color A(int a, Color c) { return Color.FromArgb(a, c); }

    void DrawT(Graphics g, string s, Font f, Color c, RectangleF r, TextFormatFlags extra = 0)
    {
        TextRenderer.DrawText(g, s, f, Rectangle.Round(r), c, TextFormatFlags.WordBreak | TextFormatFlags.NoPadding | extra);
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        Graphics g = e.Graphics;
        g.SmoothingMode = SmoothingMode.AntiAlias;
        g.InterpolationMode = InterpolationMode.HighQualityBicubic;
        g.TextRenderingHint = TextRenderingHint.AntiAliasGridFit;
        float cw = ClientSize.Width, ch = ClientSize.Height;

        // พื้นหลังศึกสามตำนาน + ม่านสีธีมเข้มทางซ้าย
        float sc = Math.Max(cw / bg.Width, ch / bg.Height);
        g.DrawImage(bg, (cw - bg.Width * sc) / 2, (ch - bg.Height * sc) / 2, bg.Width * sc, bg.Height * sc);
        using (var b = new LinearGradientBrush(new RectangleF(0, 0, cw, ch), A(250, P.Base), A(120, P.Base), 0f))
        {
            b.InterpolationColors = new ColorBlend {
                Colors = new[] { A(250, P.Base), A(240, P.Base), A(160, P.Base), A(70, P.Base) },
                Positions = new[] { 0f, 0.5f, 0.75f, 1f } };
            g.FillRectangle(b, 0, 0, cw, ch);
        }
        using (var b = new LinearGradientBrush(new RectangleF(0, ch * 0.6f, cw, ch * 0.4f + 1), Color.Transparent, A(200, P.Base), 90f))
            g.FillRectangle(b, 0, ch * 0.6f, cw, ch * 0.4f);

        // มังกร
        float dh = D(400), dw = dragon.Width * dh / dragon.Height;
        g.DrawImage(dragon, cw - dw + D(90), D(36), dw, dh);

        // กรอบสีขอบลำตัว (trim)
        using (var pen = new Pen(A(170, P.Trim), Math.Max(1, S)))
            g.DrawRectangle(pen, 0, 0, cw - 1, ch - 1);
        using (var b = new LinearGradientBrush(new RectangleF(0, 0, cw, D(3)), P.RibbonA, P.RibbonB, 0f))
            g.FillRectangle(b, 0, 0, cw, D(3));

        // โลโก้ + ชื่อแบรนด์ไล่เฉดริบบิ้น
        g.DrawImage(logo, RD(34, 30, 60, 60));
        RectangleF tr = RD(104, 24, 330, 54);
        using (var path = new GraphicsPath())
        {
            path.AddString("RAYQUAZA", fTitle.FontFamily, (int)fTitle.Style, fTitle.SizeInPoints * S * 96f / 72f, new PointF(tr.X, tr.Y), StringFormat.GenericTypographic);
            using (var b = new LinearGradientBrush(path.GetBounds(), P.RibbonA, P.RibbonB, 0f)) g.FillPath(b, path);
        }
        DrawTag(g, "DRAGON", Color.FromArgb(0x70, 0x38, 0xF8), RD(106, 74, 64, 17));
        DrawTag(g, "FLYING", Color.FromArgb(0xA8, 0x90, 0xF0), RD(176, 74, 58, 17));
        DrawTag(g, P.Mode, P.Trim, RD(240, 74, 52, 17));
        DrawT(g, "จัดการออเดอร์และสต็อก" + (uninstallMode ? "" : "  ·  ตัวติดตั้ง v" + version), fSmall, P.Muted, RD(36, 104, 400, 20));
        using (var b = new LinearGradientBrush(RD(36, 130, 380, 2), P.Trim, Color.Transparent, 0f))
            g.FillRectangle(b, RD(36, 130, 360, 2));

        // ปุ่มปิด
        RectangleF xr = RD(W - 44, 12, 32, 28);
        if (hover is string) using (var b = new SolidBrush(A(200, P.Trim))) g.FillPath(b, Round(xr, D(4)));
        DrawT(g, "✕", fBody, P.Fg, xr, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter);

        // เนื้อหา
        float y = 148;
        DrawT(g, head, fHead, P.Fg, RD(36, y, 400, 34));
        y += 38;
        if (body.Length > 0)
        {
            Size sz = TextRenderer.MeasureText(g, body, fBody, new Size(D(360), D(200)), TextFormatFlags.WordBreak);
            DrawT(g, body, fBody, P.Muted, RD(36, y, 360, 200));
            y += sz.Height / S + 12;
        }

        if (page == Page.Welcome)
        {
            RectangleF box = RD(36, y, 360, 48);
            using (var b = new SolidBrush(A(150, P.Panel))) g.FillPath(b, Round(box, D(6)));
            using (var pen = new Pen(A(140, P.Trim))) g.DrawPath(pen, Round(box, D(6)));
            DrawT(g, "ตำแหน่งติดตั้ง", fSmall, P.RibbonA, RD(48, y + 4, 336, 18));
            DrawT(g, Paths.Dest, fSmall, P.Fg, RD(48, y + 24, 336, 18), TextFormatFlags.PathEllipsis | TextFormatFlags.SingleLine);
            y += 60;
        }

        foreach (Check c in checks)
        {
            Size sz = TextRenderer.MeasureText(g, c.Text, fSmall, new Size(D(330), D(60)), TextFormatFlags.WordBreak);
            float th = Math.Max(20, sz.Height / S);
            c.R = RD(36, y, 360, th);
            RectangleF bx = RD(36, y + 1, 17, 17);
            using (var b = new SolidBrush(c.Value ? P.RibbonB : A(120, P.Base))) g.FillPath(b, Round(bx, D(3)));
            using (var pen = new Pen(hover == c ? P.RibbonA : A(200, P.Trim), Math.Max(1, S))) g.DrawPath(pen, Round(bx, D(3)));
            if (c.Value)
                using (var pen = new Pen(P.BtnFg, 2.2f * S) { StartCap = LineCap.Round, EndCap = LineCap.Round, LineJoin = LineJoin.Round })
                    g.DrawLines(pen, new[] { new PointF(bx.X + bx.Width * .24f, bx.Y + bx.Height * .52f), new PointF(bx.X + bx.Width * .43f, bx.Y + bx.Height * .72f), new PointF(bx.X + bx.Width * .78f, bx.Y + bx.Height * .3f) });
            DrawT(g, c.Text, fSmall, hover == c ? P.Fg : P.Muted, RD(62, y + 1, 330, th));
            y += th + 8;
        }

        if (page == Page.Working || page == Page.Done || page == Page.Uninstalled) Energy(g, y + 6);

        // ปุ่ม
        float bx0 = 36;
        foreach (Btn b in btns)
        {
            Size ts = TextRenderer.MeasureText(b.Text, fBtn);
            float bw = Math.Max(b.Primary ? 150 : 104, ts.Width / S + 40);
            b.R = RD(bx0, H - 70, bw, 42);
            bx0 += bw + 12;
            bool hv = hover == b;
            using (GraphicsPath gp = Round(b.R, D(6)))
            {
                if (b.Primary)
                {
                    using (var br = new LinearGradientBrush(b.R, hv ? P.RibbonA : P.RibbonB, hv ? P.RibbonB : P.Trim, 0f)) g.FillPath(br, gp);
                    if (hv) using (var pen = new Pen(P.RibbonA, Math.Max(1, S))) g.DrawPath(pen, gp);
                }
                else
                {
                    using (var br = new SolidBrush(A(hv ? 210 : 150, P.Panel))) g.FillPath(br, gp);
                    using (var pen = new Pen(A(hv ? 255 : 160, P.Trim), Math.Max(1, S))) g.DrawPath(pen, gp);
                }
            }
            DrawT(g, b.Text, fBtn, b.Primary ? P.BtnFg : P.Fg, b.R, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.SingleLine);
        }
    }

    void DrawTag(Graphics g, string s, Color c, RectangleF r)
    {
        using (var b = new SolidBrush(c)) g.FillPath(b, Round(r, D(3)));
        DrawT(g, s, fTag, Color.White, r, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.SingleLine);
    }

    // แถบชาร์จพลังแบบเดียวกับ "DRAGON ENERGY" ในเว็บ
    void Energy(Graphics g, float y)
    {
        DrawT(g, "DRAGON ENERGY", fTag, P.RibbonA, RD(36, y, 200, 14));
        DrawT(g, (int)Math.Round(shown * 100) + "%", fTag, P.Fg, RD(296, y, 100, 14), TextFormatFlags.Right);
        RectangleF track = RD(36, y + 18, 360, 14);
        using (GraphicsPath tp = Round(track, D(7)))
        {
            using (var b = new SolidBrush(A(170, P.Panel))) g.FillPath(b, tp);
            if (shown > 0.005f)
            {
                RectangleF fill = new RectangleF(track.X, track.Y, Math.Max(track.Height, track.Width * shown), track.Height);
                using (GraphicsPath fp = Round(fill, D(7)))
                {
                    using (var b = new LinearGradientBrush(track, P.RibbonA, P.RibbonB, 0f)) g.FillPath(b, fp);
                    // แสงวิ่ง
                    float sx = track.X + track.Width * (shimmer - 0.3f);
                    RectangleF sh = new RectangleF(sx, track.Y, track.Width * 0.3f, track.Height);
                    Region old = g.Clip;
                    g.SetClip(fp);
                    using (var b = new LinearGradientBrush(new RectangleF(sh.X - 1, sh.Y, sh.Width + 2, sh.Height), Color.Transparent, Color.Transparent, 0f))
                    {
                        b.InterpolationColors = new ColorBlend {
                            Colors = new[] { Color.Transparent, Color.FromArgb(150, 255, 255, 255), Color.Transparent },
                            Positions = new[] { 0f, 0.5f, 1f } };
                        g.FillRectangle(b, sh);
                    }
                    g.Clip = old;
                }
            }
            using (var pen = new Pen(A(170, P.Trim), Math.Max(1, S))) g.DrawPath(pen, tp);
        }
        DrawT(g, status, fSmall, P.Muted, RD(36, y + 40, 360, 20), TextFormatFlags.EndEllipsis | TextFormatFlags.SingleLine);
    }

    // ---------- เมาส์ / คีย์บอร์ด ----------
    object HitTest(Point p)
    {
        if (RD(W - 44, 12, 32, 28).Contains(p)) return "close";
        foreach (Btn b in btns) if (b.R.Contains(p)) return b;
        foreach (Check c in checks) if (c.R.Contains(p)) return c;
        return null;
    }

    bool Busy { get { return page == Page.Working; } }

    protected override void OnMouseMove(MouseEventArgs e)
    {
        if (e.Button == MouseButtons.Left && hover == null)
        {
            Location = new Point(Location.X + e.X - dragFrom.X, Location.Y + e.Y - dragFrom.Y);
            return;
        }
        object h = HitTest(e.Location);
        if (h != hover) { hover = h; Cursor = h == null ? Cursors.Default : Cursors.Hand; Invalidate(); }
    }

    protected override void OnMouseDown(MouseEventArgs e) { dragFrom = e.Location; }

    protected override void OnMouseUp(MouseEventArgs e)
    {
        object h = HitTest(e.Location);
        if (h == null || h != hover) return;
        if (h is string) { if (!Busy) Close(); }
        else if (h is Btn) ((Btn)h).OnClick();
        else if (h is Check) { ((Check)h).Value = !((Check)h).Value; Invalidate(); }
    }

    protected override void OnMouseLeave(EventArgs e) { hover = null; Cursor = Cursors.Default; Invalidate(); }

    protected override void OnKeyDown(KeyEventArgs e)
    {
        if (e.KeyCode == Keys.Escape && !Busy) Close();
        else if (e.KeyCode == Keys.Enter && btns.Count > 0) btns[0].OnClick();
    }

    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        if (Busy) e.Cancel = true;
        base.OnFormClosing(e);
    }
}
