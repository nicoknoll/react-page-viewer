// Core
export { Direction, MediaViewer } from './MediaViewer';
export type { ViewerCommands, ViewerStorage, PluginEntry } from './MediaViewer';

// Plugins
export { BasePlugin } from './plugins/BasePlugin';
export type { PageContainerProps } from './plugins/BasePlugin';
export { FitMode, ZoomPlugin } from './plugins/ZoomPlugin';
export { PagePlugin, ScrollAnchor } from './plugins/PagePlugin';
export { ScrollPlugin } from './plugins/ScrollPlugin';
export { DownloadPlugin } from './plugins/DownloadPlugin';

// Readers
export { BasePageReader } from './readers/BasePageReader';
export type { Page, ReaderClass } from './readers/BasePageReader';
import { PdfPageReader } from './readers/PdfPageReader';
import { ImagePageReader } from './readers/ImagePageReader';
import { VideoPageReader } from './readers/VideoPageReader';
import { AudioPageReader } from './readers/AudioPageReader';
import { YoutubePageReader } from './readers/YoutubePageReader';
export { PdfPageReader, ImagePageReader, VideoPageReader, AudioPageReader, YoutubePageReader };

export const READERS = [PdfPageReader, ImagePageReader, VideoPageReader, AudioPageReader, YoutubePageReader] as const;

// Hooks
export { useMediaViewer } from './hooks/useMediaViewer';
export type { ViewerPage } from './hooks/useMediaViewer';
export { useReader } from './hooks/useReader';
export { useStorage } from './hooks/useStorage';
