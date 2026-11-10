# SVG Editor

> A focused desktop tool for turning SVG artwork into clean, reusable assets.

SVG Editor is a lightweight Wails application that lets you paste an SVG, inspect it directly on a visual canvas, recolor individual elements or the complete artwork, change layer order, preview export sizes, and save production-ready assets.

## Highlights

- **Paste-and-edit SVG workflow** — edit SVG source and see the canvas update instantly.
- **Element selection** — click individual paths, shapes, groups, and text elements on the canvas.
- **Smart color editing** — use the custom HSV color picker, reuse up to six recent colors, and apply a color to one selected element or the entire SVG when nothing is selected.
- **Layer ordering** — send a selected element backward or bring it to the front.
- **Live previews** — preview the artwork at multiple export sizes: 16, 32, 48, 64, 128, 256, and 512 pixels.
- **Asset export** — save PNG, SVG, and ICO files from the export panel.
- **Desktop-ready builds** — package the application for Windows and Debian-based Linux systems.

## Quick Start

### Requirements

- Go 1.25+
- Wails v2.16+
- Node.js and npm
- Windows WebView2 on Windows
- GTK/WebKit development libraries on Linux

### Development

From the project root:

```bash
wails dev
```

Wails starts the desktop application with frontend hot reload. The browser development endpoint is available at:

```text
http://localhost:34115
```

To build only the frontend:

```bash
cd frontend
npm install
npm run build
```

## Using the Editor

1. Paste an SVG into the source editor.
2. Click an element on the canvas to select it.
3. Open the color control and choose a color from the HSV picker or from the recent-color history.
4. Use the layer buttons to send the selected element backward or bring it to the front.
5. Click an empty area of the canvas before choosing a color to recolor the complete SVG.
6. Choose an export size and save the desired format.

When a color is applied to a selected element, its fill and stroke are updated independently. This keeps outlines, filled shapes, and inherited SVG styles behaving predictably.

## Production Builds

### Wails application

```bash
wails build
```

The compiled binary is written to `build/bin/`.

### Windows installer

The Inno Setup script is located at:

```text
build/windows/installer.iss
```

The script packages the Wails executable and uses the project icon from `build/windows/icon.ico`.

### Debian package

On Linux, run:

```bash
sh build/linux/build-deb.sh
```

The generated package is written to:

```text
build/linux/svg_editor_1.0.0_amd64.deb
```

Temporary Debian staging directories are removed automatically after packaging.

## Project Layout

```text
.
├── build/
│   ├── bin/              # Compiled application binaries
│   ├── linux/            # Debian packaging script and Linux icon
│   └── windows/          # Windows installer, icon, and manifest
├── frontend/
│   └── src/              # React editor interface and styling
├── app.go                # Wails application bindings
├── main.go               # Desktop application entry point
└── wails.json            # Wails project configuration
```

## Technology

- **Go** — desktop application host and native bindings
- **Wails** — desktop runtime
- **React + TypeScript** — editor interface
- **Zustand** — editor state management
- **Vite** — frontend development and production bundling

## Verification

Run the frontend build before packaging:

```bash
cd frontend
npm run build
```

The build runs TypeScript checks and the Vite production bundle.

## License

Add the project license here when it is defined.
