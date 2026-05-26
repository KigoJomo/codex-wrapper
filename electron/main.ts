import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { getCodexStatus } from './codex-status'
import { getCodexThreadsRaw } from './codex-threads'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

const MIN_WINDOW_WIDTH = 600

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
		frame: false,
		icon: path.join(__dirname, '../build/icon.png'),
		// icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
		minWidth: MIN_WINDOW_WIDTH,
		minHeight: MIN_WINDOW_WIDTH * 1,
		show: false,
		webPreferences: {
			preload: path.join(__dirname, 'preload.mjs'),
		},
	})

  Menu.setApplicationMenu(null)

  win.maximize()
  win.show()

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  win.webContents.on('console-message', ({ level, message, lineNumber, sourceId }) => {
    if (level === 'error') {
      console.error(`[renderer] ${message} (${sourceId}:${lineNumber})`)
    }
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

ipcMain.on('window:minimize', () => {
  win?.minimize()
})

ipcMain.on('window:toggle-maximize', () => {
  if (win?.isMaximized()) {
    win.unmaximize()
  } else {
    win?.maximize()
  }
})

ipcMain.on('window:close', () => {
  win?.close()
})

ipcMain.handle("codex:get-status", async () => {
  return getCodexStatus()
})

ipcMain.handle('codex:threads-raw', async () => {
  return getCodexThreadsRaw()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
