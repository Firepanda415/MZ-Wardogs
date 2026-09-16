using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Windows.Forms;

// Only the physical key left of 1 plus F1/F2/F3 is consumed. No keystrokes are recorded.
class Chord {
    bool prefix, used;
    HashSet<int> captured = new HashSet<int>();
    public bool Key(int vk, int scan, bool down, bool modified, out int action, out bool replay) {
        action = 0; replay = false;
        if (scan == 0x29) {
            if (down) {
                if (!prefix && modified) return false;
                if (!prefix) used = false;
                prefix = true;
                return true;
            }
            if (!prefix) return false;
            prefix = false; replay = !used; used = false;
            return true;
        }
        if (captured.Contains(vk)) { if (!down) captured.Remove(vk); return true; }
        if (down && prefix && !modified && vk >= 0x70 && vk <= 0x72) {
            used = true; captured.Add(vk); action = vk - 0x6f; return true;
        }
        // Preserve normal typing when the prefix is followed by an unrelated key.
        if (down && prefix && !used && vk != 0x10 && vk != 0x11 && vk != 0x12) { replay = true; used = true; }
        return false;
    }
}

class Hotkeys {
    delegate IntPtr HookProc(int code, IntPtr message, IntPtr data);
    [StructLayout(LayoutKind.Sequential)] struct KeyData { public uint vk, scan, flags, time; public UIntPtr extra; }
    [StructLayout(LayoutKind.Sequential)] struct Keyboard { public ushort vk, scan; public uint flags, time; public UIntPtr extra; }
    [StructLayout(LayoutKind.Explicit, Size=40)] struct Input { [FieldOffset(0)] public uint type; [FieldOffset(8)] public Keyboard key; }
    [DllImport("user32.dll", SetLastError=true)] static extern IntPtr SetWindowsHookEx(int id, HookProc proc, IntPtr module, uint thread);
    [DllImport("user32.dll")] static extern IntPtr CallNextHookEx(IntPtr hook, int code, IntPtr message, IntPtr data);
    [DllImport("user32.dll")] static extern bool UnhookWindowsHookEx(IntPtr hook);
    [DllImport("user32.dll")] static extern short GetAsyncKeyState(int key);
    [DllImport("user32.dll", SetLastError=true)] static extern uint SendInput(uint count, Input[] input, int size);
    [DllImport("kernel32.dll", CharSet=CharSet.Unicode)] static extern IntPtr GetModuleHandle(string name);
    static readonly Chord chord = new Chord();
    static readonly HookProc callback = OnKey;
    static IntPtr hook;
    static bool Modified() { foreach (int key in new int[]{0x10,0x11,0x12,0x5b,0x5c}) if ((GetAsyncKeyState(key) & 0x8000) != 0) return true; return false; }
    static void ReplayPrefix() {
        var keys = new Input[]{new Input{type=1,key=new Keyboard{scan=0x29,flags=8}},new Input{type=1,key=new Keyboard{scan=0x29,flags=10}}};
        SendInput(2, keys, Marshal.SizeOf(typeof(Input)));
    }
    static IntPtr OnKey(int code, IntPtr message, IntPtr data) {
        if (code >= 0) {
            KeyData key = (KeyData)Marshal.PtrToStructure(data, typeof(KeyData));
            int msg = message.ToInt32();
            if ((key.flags & 0x10) == 0 && (msg == 0x100 || msg == 0x101 || msg == 0x104 || msg == 0x105)) {
                int action; bool replay;
                bool swallow = chord.Key((int)key.vk, (int)key.scan, msg == 0x100 || msg == 0x104, Modified(), out action, out replay);
                if (replay) ReplayPrefix();
                if (action != 0) Console.WriteLine(action);
                if (swallow) return (IntPtr)1;
            }
        }
        return CallNextHookEx(hook, code, message, data);
    }
    static void Check(bool ok) { if (!ok) throw new Exception("Hotkey contract failed"); }
    static void Test() {
        int action; bool replay;
        for (int f = 0x70; f <= 0x72; f++) {
            var c = new Chord();
            Check(!c.Key(f, 0, true, false, out action, out replay) && action == 0);
            Check(c.Key(0xc0, 0x29, true, false, out action, out replay));
            Check(c.Key(f, 0, true, false, out action, out replay) && action == f - 0x6f);
            Check(c.Key(f, 0, true, false, out action, out replay) && action == 0);
            Check(c.Key(0xc0, 0x29, false, false, out action, out replay) && !replay);
            Check(c.Key(f, 0, false, false, out action, out replay) && action == 0);
            Check(!c.Key(f, 0, true, false, out action, out replay) && action == 0);
        }
        var tap = new Chord();
        Check(tap.Key(0xc0, 0x29, true, false, out action, out replay));
        Check(tap.Key(0xc0, 0x29, false, false, out action, out replay) && replay);
        Check(!tap.Key(0xc0, 0x29, true, true, out action, out replay));
        Check(!tap.Key(0xc0, 0x29, false, true, out action, out replay));
        tap.Key(0xc0, 0x29, true, false, out action, out replay);
        Check(!tap.Key(0x41, 0, true, false, out action, out replay) && replay);
        Check(tap.Key(0xc0, 0x29, false, false, out action, out replay) && !replay);
        Console.WriteLine("PASS: three held-prefix chords, repeats, release order, plain keys and modifier shortcuts.");
    }
    [STAThread] static int Main(string[] args) {
        if (args.Length == 1 && args[0] == "--self-test") { Test(); return 0; }
        try {
            Process parent = Process.GetProcessById(int.Parse(args[0]));
            hook = SetWindowsHookEx(13, callback, GetModuleHandle(null), 0);
            if (hook == IntPtr.Zero) throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
            var timer = new Timer{Interval=1000};
            timer.Tick += delegate { if (parent.HasExited) Application.Exit(); };
            timer.Start(); Console.WriteLine("READY"); Application.Run(); timer.Dispose(); parent.Dispose(); return 0;
        } catch (Exception error) { Console.Error.WriteLine(error.Message); return 1; }
        finally { if (hook != IntPtr.Zero) UnhookWindowsHookEx(hook); }
    }
}
