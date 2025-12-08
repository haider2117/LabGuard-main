# Debug Summary - Electron App Not Opening

## Issues Found and Fixed

### Issue 1: Missing Frontend Dependencies
**Problem:** `react-scripts` was not installed in `frontend/node_modules`, only in root `node_modules`.

**Fix:**
```bash
cd frontend
npm install --legacy-peer-deps
```

---

### Issue 2: TypeScript Error in ExamPage.tsx
**Problem:** Invalid `canvas` property in render parameters (line 292).

**Fix:** Removed the invalid property.
```typescript
// Before
await page.render({
    canvasContext: context,
    viewport: viewport,
    canvas: canvas  // ❌ Invalid
}).promise;

// After
await page.render({
    canvasContext: context,
    viewport: viewport
}).promise;
```

**File:** `frontend/src/components/ExamPage.tsx`

---

### Issue 3: IPv6 vs IPv4 Connection
**Problem:** Electron was trying to connect via IPv6 (`::1`) while React dev server was listening on IPv4 (`127.0.0.1`).

**Fix:** Force IPv4 connection in `start-electron.js`.
```javascript
// Before
http.get('http://localhost:3001', (res) => {

// After
const options = {
    hostname: '127.0.0.1',
    port: 3001,
    path: '/',
    family: 4  // Force IPv4
};
http.get(options, (res) => {
```

**File:** `scripts/start-electron.js`

---

### Issue 4: better-sqlite3 Module Version Mismatch
**Problem:** Module was compiled for Node.js v18 (MODULE_VERSION 108) but Electron v38 uses Node.js v22 (MODULE_VERSION 139).

**Fix:** Rebuild the module for Electron.
```bash
# Delete old build
Remove-Item -Recurse -Force node_modules\better-sqlite3\build

# Rebuild for Electron
node rebuild-sqlite.js
```

---

## Files Modified
1. `frontend/src/components/ExamPage.tsx` - Removed invalid canvas property
2. `scripts/start-electron.js` - Added IPv4 forcing
3. `frontend/.env` - Set PORT=3001 and BROWSER configuration

## Files Created (Essential)
1. `scripts/start-react.js` - Starts React with correct PORT using cross-env
2. `scripts/start-electron.js` - Waits for React then starts Electron
3. `scripts/rebuild-sqlite.js` - Rebuilds better-sqlite3 for Electron (run with: `npm run rebuild`)
4. `scripts/reset-database.js` - Resets database to clean state (run with: `npm run reset-db`)
5. `frontend/.env` - React dev server configuration

## How to Run
```bash
npm run dev
```

Both Electron app and browser will open. Use Electron for full functionality.

## Reset Database (Optional)
To start fresh with only the default admin user:
```bash
npm run reset-db
```

This will:
- Delete the database file
- Remove all uploaded files
- Next run will create fresh database with only admin user (admin/admin123)

---

**Status:** ✅ All issues resolved. App is fully functional.
