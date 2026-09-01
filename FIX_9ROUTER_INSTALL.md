# Fix 9router Installation Error (EBUSY)

## ✅ SOLVED! Use npx instead

**The global installation is corrupted** (missing `cli.js`). You don't need to fix it - just use `npx`:

```cmd
npx 9router@latest --version
npx 9router@latest --help
npx 9router@latest
```

This works perfectly and always uses the latest version!

---

## Original Problem
```
npm error code EBUSY
npm error syscall rename
npm error path C:\Users\DELL\AppData\Roaming\npm\node_modules\9router\app
npm error errno -4082
npm error EBUSY: resource busy or locked
```

**AND**

```
Error: Cannot find module 'C:\Users\DELL\AppData\Roaming\npm\node_modules\9router\cli.js'
```

## Root Cause
1. The `9router` folder is locked by a process
2. The installation is corrupted (missing `cli.js`)
3. npm cannot uninstall or reinstall it

---

## Quick Scripts Created

I've created helper scripts in your project folder:

### 1. **`start-9router.bat`** - Start 9router server
   ```cmd
   start-9router.bat
   ```
   Opens at: http://localhost:20128

### 2. **`9router.bat`** - Shortcut to run any 9router command
   ```cmd
   9router.bat --version
   9router.bat --help
   ```

### 3. **`cleanup-broken-9router.bat`** - Remove corrupted installation
   Run as Administrator to clean up the broken global install

---

## Solution Options (If you still want global install)

### **Option 1: Close All Node Processes and Retry (Quickest)**

1. **Close all applications that might be using Node.js:**
   - Close VS Code / Kiro
   - Close any terminal windows
   - Close browser dev tools
   - Close Postman or API testing tools

2. **Kill all Node.js processes manually:**
   ```cmd
   taskkill /F /IM node.exe
   ```

3. **Retry the install:**
   ```cmd
   npm i -g 9router@latest --prefer-online
   ```

---

### **Option 2: Use Safe Mode Uninstall (Recommended)**

1. **Open PowerShell as Administrator** (Right-click > Run as Administrator)

2. **Stop all Node.js processes:**
   ```powershell
   Get-Process node | Stop-Process -Force
   ```

3. **Wait 5 seconds, then manually delete the folder:**
   ```powershell
   Remove-Item -Path "$env:APPDATA\npm\node_modules\9router" -Recurse -Force
   ```

4. **Clean npm cache:**
   ```cmd
   npm cache clean --force
   ```

5. **Reinstall:**
   ```cmd
   npm i -g 9router@latest --prefer-online
   ```

---

### **Option 3: Use Handle.exe to Find Locking Process (Advanced)**

1. **Download Sysinternals Handle:**
   - https://learn.microsoft.com/en-us/sysinternals/downloads/handle

2. **Run as Administrator:**
   ```cmd
   handle.exe "9router"
   ```

3. **Kill the specific process ID shown:**
   ```cmd
   taskkill /F /PID <process_id>
   ```

4. **Then uninstall and reinstall:**
   ```cmd
   npm uninstall -g 9router
   npm i -g 9router@latest --prefer-online
   ```

---

### **Option 4: Use Safe Boot (Nuclear Option)**

1. **Restart Windows in Safe Mode:**
   - Press `Win + R`, type `msconfig`
   - Go to "Boot" tab > Check "Safe boot" > Restart

2. **In Safe Mode, open cmd as Administrator:**
   ```cmd
   npm uninstall -g 9router
   rmdir /s /q "%APPDATA%\npm\node_modules\9router"
   npm cache clean --force
   npm i -g 9router@latest --prefer-online
   ```

3. **Restart normally** (uncheck Safe boot in msconfig)

---

## Alternative: Use npx Instead of Global Install

If the global install keeps failing, you can use `npx` to run `9router` without installing it globally:

```cmd
npx 9router@latest [your-command]
```

This runs the latest version without permanently installing it.

---

## Check if 9router is the Correct Package Name

**Important:** The package name `9router` is unusual (starts with a number). Please verify:

1. **Search npm registry:**
   ```cmd
   npm search 9router
   ```

2. **Check if you meant a different package:**
   - `express-router`?
   - `react-router`?
   - `vue-router`?
   - `router` (standalone)?

3. **If it's a typo, install the correct package instead.**

---

## Current System Status

You have **30+ Node.js processes** running on your system:
- Backend dev server
- Frontend dev server
- Playwright processes
- OpenAI Codex processes
- Other development tools

**Recommendation:** Close unnecessary applications before attempting global npm installs.

---

## Quick Fix Command (Try First)

Run this in **Administrator Command Prompt**:

```cmd
taskkill /F /IM node.exe & timeout /t 3 & npm uninstall -g 9router & rmdir /s /q "%APPDATA%\npm\node_modules\9router" & npm cache clean --force & npm i -g 9router@latest --prefer-online
```

This will:
1. Kill all Node processes
2. Wait 3 seconds
3. Uninstall 9router
4. Delete the folder manually
5. Clean npm cache
6. Reinstall 9router

---

## Still Not Working?

If none of these work, the issue might be:
- **Antivirus software** locking the folder → Add npm folder to exclusions
- **Windows Defender** scanning → Temporarily disable real-time protection
- **Corrupted npm installation** → Reinstall Node.js completely

---

## Need Help?

Provide the output of:
```cmd
npm list -g --depth=0
npm config get prefix
where node
```
