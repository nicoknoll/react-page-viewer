import { BasePlugin } from './BasePlugin';

export class DownloadPlugin extends BasePlugin<{ url: string; fileName?: string }> {
    pluginName = 'download' as const;

    addCommands() {
        return {
            download: async (fileName?: string) => {
                if (!this.options.url) {
                    throw new Error('No URL provided for download');
                }

                const response = await fetch(this.options.url);
                const blob = await response.blob();
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download =
                    fileName ??
                    this.options.fileName ??
                    new URL(this.options.url, location.href).pathname.split('/').pop() ??
                    'download';
                a.click();
                URL.revokeObjectURL(a.href);
            },
        };
    }
}

declare module 'react-page-viewer' {
    interface ViewerCommands {
        download(fileName?: string): Promise<void>;
    }
}
