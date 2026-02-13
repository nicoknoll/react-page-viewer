import { BasePageReader, Page } from './BasePageReader';

export interface YoutubeRenderOptions {
    autoplay?: boolean;
}

const parseVideoId = (url: string): string | null => {
    try {
        const parsed = new URL(url);
        if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1);
        if (parsed.hostname.includes('youtube.com'))
            return parsed.searchParams.get('v') ?? parsed.pathname.split('/').pop() ?? null;
    } catch {}
    return null;
};

export class YoutubePageReader extends BasePageReader<YoutubeRenderOptions> {
    static canHandle(url: string): boolean {
        return parseVideoId(url) !== null;
    }

    private async fetchMetaData(): Promise<{ width: number; height: number }> {
        const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(this.url)}&format=json`);
        if (!res.ok) throw new Error(`Failed to fetch YouTube oEmbed: ${res.status}`);
        const data = await res.json();
        return { width: data.width, height: data.height };
    }

    async getPage(): Promise<Page<YoutubeRenderOptions>> {
        const videoId = parseVideoId(this.url);
        if (!videoId) throw new Error(`Invalid YouTube URL: ${this.url}`);

        const { width, height } = await this.fetchMetaData();

        return {
            width,
            height,
            render: ({ autoplay = false } = {}) => (
                <iframe
                    src={`https://www.youtube.com/embed/${videoId}${autoplay ? '?autoplay=1' : ''}`}
                    style={{ display: 'block', width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            ),
        };
    }

    async getPages(): Promise<Page<YoutubeRenderOptions>[]> {
        return [await this.getPage()];
    }
}
