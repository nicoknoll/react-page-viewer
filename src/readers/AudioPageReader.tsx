import { BasePageReader, Page, getExtension } from './BasePageReader';

const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'aac', 'flac', 'webm', 'm4a', 'opus']);

export interface AudioRenderOptions {
    controls?: boolean;
    autoplay?: boolean;
    loop?: boolean;
}

const AUDIO_WIDTH = 400;
const AUDIO_HEIGHT = 54;

export class AudioPageReader extends BasePageReader<AudioRenderOptions> {
    static canHandle(url: string): boolean {
        return AUDIO_EXTENSIONS.has(getExtension(url));
    }

    async getPage(): Promise<Page<AudioRenderOptions>> {
        return {
            width: AUDIO_WIDTH,
            height: AUDIO_HEIGHT,
            render: ({ controls = true, autoplay = false, loop = false } = {}) => (
                <audio
                    src={this.url}
                    controls={controls}
                    autoPlay={autoplay}
                    loop={loop}
                    style={{ display: 'block', width: '100%', height: '100%' }}
                />
            ),
        };
    }

    async getPages(): Promise<Page<AudioRenderOptions>[]> {
        return [await this.getPage()];
    }
}
