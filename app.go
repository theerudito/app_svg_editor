package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"os"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// SaveExport opens the native Save As dialog and writes an exported asset.
func (a *App) SaveExport(format string, content string, filename string) error {
	format = strings.ToLower(strings.TrimPrefix(format, "."))
	filter := runtime.FileFilter{DisplayName: "SVG files", Pattern: "*.svg"}
	if filename == "" {
		filename = "svg_editor.svg"
	}
	data := []byte(content)
	if format == "png" {
		filter = runtime.FileFilter{DisplayName: "PNG files", Pattern: "*.png"}
		if !strings.HasSuffix(strings.ToLower(filename), ".png") {
			filename += ".png"
		}
	} else if format == "ico" {
		filter = runtime.FileFilter{DisplayName: "Icon files", Pattern: "*.ico"}
		if !strings.HasSuffix(strings.ToLower(filename), ".ico") {
			filename += ".ico"
		}
	} else if format != "svg" {
		return fmt.Errorf("unsupported export format: %s", format)
	}
	if format == "svg" && !strings.HasSuffix(strings.ToLower(filename), ".svg") {
		filename += ".svg"
	}
	if format != "svg" {
		decoded, err := base64.StdEncoding.DecodeString(content)
		if err != nil {
			return fmt.Errorf("decode export: %w", err)
		}
		data = decoded
	}
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Guardar como",
		DefaultFilename: filename,
		Filters:         []runtime.FileFilter{filter},
	})
	if err != nil || path == "" {
		return err
	}
	return os.WriteFile(path, data, 0644)
}
