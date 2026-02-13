import type { Meta, StoryObj } from '@storybook/react';
import {
    FitMode,
    PdfPageReader,
    useReader,
    useMediaViewer,
    useStorage,
    ZoomPlugin,
    PagePlugin,
    ScrollPlugin,
    DownloadPlugin,
} from '../src';

const PdfViewer = ({ url }: { url: string }) => {
    const reader = useReader(url, PdfPageReader);
    const { viewer, canvasProps, pages, isLoading, error } = useMediaViewer({
        reader,
        virtualize: true,
        plugins: [
            ZoomPlugin.configure({ initialZoom: FitMode.FIT_WIDTH }),
            PagePlugin,
            ScrollPlugin.configure({ spaceToDrag: true }),
            DownloadPlugin.configure({ url }),
        ],
    });

    const zoom = (useStorage(viewer, 'zoom') ?? 1) as number;
    const page = useStorage(viewer, 'page');
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
                <button onClick={() => viewer.commands.zoomToFit(FitMode.FIT_WIDTH)}>Fit Width</button>
                <span style={{ margin: '0 8px', borderLeft: '1px solid #ccc', height: 20 }} />
                <button disabled={page <= 0} onClick={() => viewer.commands.scrollToPage(page - 1)}>
                    ← Prev
                </button>
                <span>
                    Page {page + 1} / {pages.length}
                </span>
                <button disabled={page >= pages.length - 1} onClick={() => viewer.commands.scrollToPage(page + 1)}>
                    Next →
                </button>
                <span style={{ margin: '0 8px', borderLeft: '1px solid #ccc', height: 20 }} />
                <button
                    onClick={() => viewer.commands.toggleDrag()}
                    style={{ fontWeight: scroll?.dragEnabled ? 'bold' : 'normal' }}
                >
                    {scroll?.dragEnabled ? 'Drag On' : 'Drag Off'}
                </button>
                <span style={{ margin: '0 8px', borderLeft: '1px solid #ccc', height: 20 }} />
                <button onClick={() => viewer.commands.download()}>Download</button>
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
                            {p.render({ scale: zoom })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const meta: Meta<typeof PdfViewer> = {
    title: 'PdfViewer',
    component: PdfViewer,
    argTypes: {
        url: { control: 'text' },
    },
};

export default meta;
type Story = StoryObj<typeof PdfViewer>;

export const Default: Story = {
    args: {
        url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
    },
};
