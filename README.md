# React Media Viewer

A headless, extensible media viewer for React. Render PDFs, images, video, audio, and YouTube embeds with a unified API. You control the UI — the library handles pages, zoom, scroll, and layout.

The plugin system is inspired by [TipTap](https://tiptap.dev/docs/editor/extensions/custom-extensions): each feature (zoom, pagination, drag-to-scroll) is a self-contained plugin that adds commands and reactive storage to the viewer. Compose only what you need.

## Install

```sh
npm install react-media-viewer
```

Requires React 19 (or 18 with `use` polyfill). Ships as ESM and CJS.

## Quick Example

```tsx
import { ImagePageReader, useReader, useMediaViewer, useStorage, ZoomPlugin, FitMode } from 'react-media-viewer';

const Viewer = ({ url }: { url: string }) => {
  const reader = useReader(url, ImagePageReader);
  const { viewer, canvasProps, pages, isLoading } = useMediaViewer({
    reader,
    plugins: [ZoomPlugin.configure({ initialZoom: FitMode.FIT })],
  });

  const zoom = useStorage(viewer, 'zoom');

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={() => viewer.commands.zoomIn()}>+</button>
      <span>{Math.round(zoom * 100)}%</span>
      <button onClick={() => viewer.commands.zoomOut()}>-</button>

      <div {...canvasProps} style={{ ...canvasProps.style, height: 600 }}>
        {pages.map((page, i) => (
          <div key={i} {...page.getContainerProps()}>
            {page.render()}
          </div>
        ))}
      </div>
    </div>
  );
};
```

This is the entire integration. There are no wrapper components or required CSS — you own the markup.

## Supported Media

| Type | Reader | Detected extensions |
|------|--------|-------------------|
| PDF | `PdfPageReader` | `.pdf` |
| Image | `ImagePageReader` | `.png` `.jpg` `.jpeg` `.gif` `.webp` `.svg` `.bmp` `.avif` `.ico` |
| Video | `VideoPageReader` | `.mp4` `.webm` `.ogg` `.mov` `.avi` |
| Audio | `AudioPageReader` | `.mp3` `.wav` `.ogg` `.aac` `.flac` `.m4a` |
| YouTube | `YoutubePageReader` | YouTube URLs (`youtube.com`, `youtu.be`) |

### Auto-detection

Pass multiple reader classes and the library picks the right one per URL:

```tsx
import { READERS, useReader } from 'react-media-viewer';

const reader = useReader('https://example.com/photo.jpg', READERS);
```

`READERS` includes all built-in readers. You can also pass a subset:

```tsx
const reader = useReader(url, [ImagePageReader, PdfPageReader]);
```

### Multiple URLs

Pass an array of URLs to combine pages from multiple sources:

```tsx
const reader = useReader(
  ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'],
  ImagePageReader
);
```

## Plugins

Plugins add commands and reactive storage to the viewer. Pass them to `useMediaViewer`:

```tsx
const { viewer } = useMediaViewer({
  reader,
  plugins: [
    ZoomPlugin.configure({ initialZoom: FitMode.FIT_WIDTH }),
    PagePlugin,
    ScrollPlugin.configure({ spaceToDrag: true }),
  ],
});
```

### ZoomPlugin

Zoom with centered scroll preservation, fit modes, and configurable limits.

```tsx
ZoomPlugin.configure({
  initialZoom: FitMode.FIT,       // FitMode.FIT | .COVER | .FIT_WIDTH | .FIT_HEIGHT | number
  minZoom: 0.1,
  maxZoom: 10,
  zoomStep: 0.25,
})
```

| Command | Description |
|---------|------------|
| `viewer.commands.zoomIn()` | Zoom in by step |
| `viewer.commands.zoomOut()` | Zoom out by step |
| `viewer.commands.setZoom(1.5)` | Set exact zoom level |
| `viewer.commands.zoomToFit(FitMode.FIT)` | Fit to viewport |
| `viewer.commands.resetZoom()` | Reset to 1x |

Storage: `useStorage(viewer, 'zoom')` returns the current zoom level as a `number`.

### PagePlugin

Tracks the current page based on scroll position.

```tsx
PagePlugin.configure({
  initialPage: 0,
  trackScroll: true,                  // auto-update on scroll
  scrollAnchor: ScrollAnchor.START,   // START | CENTER | END
})
```

| Command | Description |
|---------|------------|
| `viewer.commands.setPage(2)` | Set current page |
| `viewer.commands.getPage()` | Get current page index |

Storage: `useStorage(viewer, 'page')` returns the current page index as a `number`.

### ScrollPlugin

Programmatic scrolling, drag-to-scroll, and space-to-drag.

```tsx
ScrollPlugin.configure({
  spaceToDrag: true,
  dragEnabled: false,
  defaultAlign: ScrollAnchor.START,
  defaultBehavior: 'smooth',
})
```

| Command | Description |
|---------|------------|
| `viewer.commands.scrollToPage(index)` | Scroll to page |
| `viewer.commands.enableDrag()` | Enable drag mode |
| `viewer.commands.disableDrag()` | Disable drag mode |
| `viewer.commands.toggleDrag()` | Toggle drag mode |

Storage: `useStorage(viewer, 'scroll')` returns `{ dragEnabled, dragging }`.

### DownloadPlugin

Download the source file.

```tsx
DownloadPlugin.configure({ url: 'https://example.com/file.pdf' })
```

| Command | Description |
|---------|------------|
| `viewer.commands.download()` | Download the file |

## Layout

### Direction

Control whether pages flow vertically or horizontally:

```tsx
import { Direction } from 'react-media-viewer';

const { canvasProps } = useMediaViewer({
  reader,
  direction: Direction.HORIZONTAL,
  plugins: [...],
});
```

`canvasProps` automatically sets `display: flex` and the correct `flexDirection`. The `ScrollPlugin` and `PagePlugin` are direction-aware.

### Page Normalization

Scale all pages to match the first page's width or height:

```tsx
useMediaViewer({
  reader,
  normalizeDimension: 'height', // 'width' | 'height' | false
});
```

### Virtualization

Enabled by default. Only visible pages (plus overscan) are rendered:

```tsx
useMediaViewer({
  reader,
  virtualize: true,   // default
  overscan: 200,       // pixels beyond viewport
});
```

## Writing a Custom Reader

Extend `BasePageReader` and implement `getPages`:

```tsx
class MarkdownPageReader extends BasePageReader {
  static canHandle(url: string) {
    return getExtension(url) === 'md';
  }

  async getPages() {
    const res = await fetch(this.url);
    const text = await res.text();
    return [{
      width: 800,
      height: 600,
      render: () => <div dangerouslySetInnerHTML={{ __html: marked(text) }} />,
    }];
  }
}
```

## Writing a Custom Plugin

Extend `BasePlugin` and use module augmentation for type-safe commands:

```tsx
import { BasePlugin } from 'react-media-viewer';

class FullscreenPlugin extends BasePlugin<{}, boolean> {
  pluginName = 'fullscreen' as const;

  addStorage() { return false; }

  addCommands() {
    return {
      toggleFullscreen: () => {
        const canvas = this.viewer.canvasRef.current;
        if (!canvas) return;
        if (document.fullscreenElement) {
          document.exitFullscreen();
          this.updateStorage(false);
        } else {
          canvas.requestFullscreen();
          this.updateStorage(true);
        }
      },
    };
  }
}

declare module 'react-media-viewer' {
  interface ViewerCommands {
    toggleFullscreen(): void;
  }
  interface ViewerStorage {
    fullscreen: boolean;
  }
}
```

## Storybook

The repo includes stories for every media type:

```sh
npm run storybook
```

Opens at [http://localhost:6006](http://localhost:6006) with examples for PDF, image galleries, video, audio, YouTube, and mixed-media viewers.

## License

MIT
