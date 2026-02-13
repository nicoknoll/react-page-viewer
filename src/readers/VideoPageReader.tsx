import { BasePageReader, Page, getExtension } from './BasePageReader';

const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'ogg', 'mov', 'mkv', 'avi']);

export interface VideoRenderOptions {
    controls?: boolean;
    autoplay?: boolean;
    muted?: boolean;
    loop?: boolean;
}

export class VideoPageReader extends BasePageReader<VideoRenderOptions> {
    static canHandle(url: string): boolean {
        return VIDEO_EXTENSIONS.has(getExtension(url));
    }

    private loadMetadata(): Promise<{ width: number; height: number }> {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.crossOrigin = 'anonymous';
            video.onloadedmetadata = () => resolve({ width: video.videoWidth, height: video.videoHeight });
            video.onerror = () => reject(new Error(`Failed to load video: ${this.url}`));
            video.src = this.url;
        });
    }

    async getPage(): Promise<Page<VideoRenderOptions>> {
        const { width, height } = await this.loadMetadata();
        return {
            width,
            height,
            render: ({ controls = true, autoplay = false, muted = false, loop = false } = {}) => (
                <video
                    src={this.url}
                    controls={controls}
                    autoPlay={autoplay}
                    muted={muted}
                    loop={loop}
                    style={{ display: 'block', width: '100%', height: '100%' }}
                />
            ),
        };
    }

    async getPages(): Promise<Page<VideoRenderOptions>[]> {
        return [await this.getPage()];
    }
}
