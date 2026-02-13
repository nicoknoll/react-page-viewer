import type { Meta, StoryObj } from '@storybook/react';
import {
    Direction,
    FitMode,
    ImagePageReader,
    useReader,
    useMediaViewer,
    useStorage,
    ZoomPlugin,
    ScrollPlugin,
    PagePlugin,
    DownloadPlugin,
} from 'react-page-viewer';

const ImageViewer = ({ url, urls, horizontal }: { url?: string; urls?: string[]; horizontal?: boolean }) => {
    const reader = useReader(urls ?? url ?? '', ImagePageReader);
    const { viewer, canvasProps, pages, isLoading, error } = useMediaViewer({
        reader,
        direction: horizontal ? Direction.HORIZONTAL : Direction.VERTICAL,
        normalizeDimension: horizontal ? 'height' : false,
        plugins: [
            ZoomPlugin.configure({ initialZoom: horizontal ? FitMode.FIT_HEIGHT : FitMode.FIT }),
            ScrollPlugin.configure({ spaceToDrag: true }),
            DownloadPlugin.configure({ url: url || '' }),
        ],
    });

    const zoom = useStorage(viewer, 'zoom');
    const scroll = useStorage(viewer, 'scroll');

    if (error) return <div>Error: {error.message}</div>;
    if (isLoading) return <div>Loading…</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '50rem', border: '1px solid #ccc' }}>
            <div
                style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    padding: 8,
                    borderBottom: '1px solid #ccc',
                }}
            >
                <button onClick={() => viewer.commands.zoomOut()}>Zoom −</button>
                <span>{Math.round(zoom * 100)}%</span>
                <button onClick={() => viewer.commands.zoomIn()}>Zoom +</button>
                <button onClick={() => viewer.commands.zoomToFit()}>Fit</button>
                <span style={{ margin: '0 8px', borderLeft: '1px solid #ccc', height: 20 }} />
                <button
                    onClick={() => viewer.commands.toggleDrag()}
                    style={{ fontWeight: scroll?.dragEnabled ? 'bold' : 'normal' }}
                >
                    {scroll?.dragEnabled ? 'Drag On' : 'Drag Off'}
                </button>
                <span style={{ margin: '0 8px', borderLeft: '1px solid #ccc', height: 20 }} />
                <button onClick={() => viewer.commands.download()} disabled={!url}>
                    Download
                </button>
            </div>
            <div
                {...canvasProps}
                style={{
                    ...canvasProps.style,
                    flex: 1,
                    background: '#eee',
                    justifyContent: 'safe center',
                    alignItems: 'safe center',
                    gap: '1rem',
                    padding: '1rem',
                }}
            >
                {pages.map((p, i) => {
                    const containerProps = p.getContainerProps();
                    return (
                        <div
                            key={i}
                            {...containerProps}
                            style={{
                                ...containerProps.style,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            }}
                        >
                            {p.render()}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const meta: Meta<typeof ImageViewer> = {
    title: 'ImageViewer',
    component: ImageViewer,
    argTypes: {
        url: { control: 'text' },
    },
};

export default meta;
type Story = StoryObj<typeof ImageViewer>;

export const Default: Story = {
    args: {
        url: 'https://picsum.photos/id/237/1200/800',
    },
};

export const Gallery: Story = {
    args: {
        urls: [
            'https://picsum.photos/id/237/1200/800',
            'https://picsum.photos/id/10/1200/800',
            'https://picsum.photos/id/100/1200/800',
            'https://picsum.photos/id/200/1200/800',
        ],
        horizontal: true,
    },
};

// --- Gallery with pagination ---

const ImageGalleryWithPages = ({ urls }: { urls: string[] }) => {
    const reader = useReader(urls, ImagePageReader);
    const { viewer, canvasProps, pages, isLoading, error } = useMediaViewer({
        reader,
        direction: Direction.HORIZONTAL,
        normalizeDimension: 'height',
        plugins: [
            ZoomPlugin.configure({ initialZoom: FitMode.FIT_HEIGHT }),
            PagePlugin,
            ScrollPlugin.configure({ spaceToDrag: true }),
        ],
    });

    const zoom = useStorage(viewer, 'zoom');
    const page = useStorage(viewer, 'page') as number;

    if (error) return <div>Error: {error.message}</div>;
    if (isLoading) return <div>Loading…</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '50rem', border: '1px solid #ccc' }}>
            <div
                style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    padding: 8,
                    borderBottom: '1px solid #ccc',
                }}
            >
                <button onClick={() => viewer.commands.zoomOut()}>Zoom −</button>
                <span>{Math.round((zoom ?? 1) * 100)}%</span>
                <button onClick={() => viewer.commands.zoomIn()}>Zoom +</button>
                <button onClick={() => viewer.commands.zoomToFit(FitMode.FIT_HEIGHT)}>Fit</button>
                <span style={{ margin: '0 8px', borderLeft: '1px solid #ccc', height: 20 }} />
                <button disabled={page <= 0} onClick={() => viewer.commands.scrollToPage(page - 1, 'center')}>
                    ← Prev
                </button>
                <span>
                    {page + 1} / {pages.length}
                </span>
                <button
                    disabled={page >= pages.length - 1}
                    onClick={() => viewer.commands.scrollToPage(page + 1, 'center')}
                >
                    Next →
                </button>
            </div>
            <div
                {...canvasProps}
                style={{
                    ...canvasProps.style,
                    flex: 1,
                    background: '#eee',
                    justifyContent: 'safe center',
                    alignItems: 'safe center',
                    gap: '1rem',
                    padding: '1rem',
                }}
            >
                {pages.map((p, i) => {
                    const containerProps = p.getContainerProps();
                    return (
                        <div
                            key={i}
                            {...containerProps}
                            style={{
                                ...containerProps.style,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            }}
                        >
                            {p.render()}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

type GalleryStory = StoryObj<typeof ImageGalleryWithPages>;

export const GalleryWithPages: GalleryStory = {
    render: (args) => <ImageGalleryWithPages {...args} />,
    args: {
        urls: [
            'https://picsum.photos/id/237/1200/800',
            'https://picsum.photos/id/10/1200/800',
            'https://picsum.photos/id/100/1200/800',
            'https://picsum.photos/id/200/1200/800',
            'https://picsum.photos/id/237/1200/800',
            'https://picsum.photos/id/10/1200/800',
            'https://picsum.photos/id/100/1200/800',
            'https://picsum.photos/id/200/1200/800',
        ],
    },
};
