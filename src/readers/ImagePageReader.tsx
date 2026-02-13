import { BasePageReader, Page, getExtension } from './BasePageReader';

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif', 'ico']);

export class ImagePageReader extends BasePageReader {
    static canHandle(url: string): boolean {
        return IMAGE_EXTENSIONS.has(getExtension(url));
    }

    private loadImage(): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = this.url;
        });
    }

    private toPage(img: HTMLImageElement): Page {
        return {
            width: img.naturalWidth,
            height: img.naturalHeight,
            render: () => (
                <img
                    src={this.url}
                    style={{ display: 'block', width: '100%', height: '100%', userSelect: 'none' }}
                    draggable={false}
                />
            ),
        };
    }

    async getPage(index: number): Promise<Page> {
        return this.toPage(await this.loadImage());
    }

    async getPages(): Promise<Page[]> {
        return [this.toPage(await this.loadImage())];
    }
}
