import type { Meta, StoryObj } from '@storybook/react';
import { FitMode, ScrollPlugin, useMediaViewer, useReader, useStorage, ZoomPlugin } from 'react-page-viewer';

const MultiViewer = ({ urls }: { urls: string[] }) => {
    const reader = useReader(urls);
    const { viewer, canvasProps, pages, isLoading, error } = useMediaViewer({
        reader,
        plugins: [ZoomPlugin.configure({ initialZoom: FitMode.FIT }), ScrollPlugin.configure({ spaceToDrag: true })],
        normalizeDimension: 'width',
    });

    const zoom = useStorage(viewer, 'zoom');

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
                <button onClick={() => viewer.commands.zoomToFit()}>Fit</button>
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

const meta: Meta<typeof MultiViewer> = {
    title: 'MultiViewer',
    component: MultiViewer,
};

export default meta;
type Story = StoryObj<typeof MultiViewer>;

export const Mixed: Story = {
    args: {
        urls: [
            'https://picsum.photos/id/237/1200/800.jpg',
            'https://picsum.photos/id/10/1200/800.jpg',
            'https://www.youtube.com/watch?v=Ox5uhfYtdJA',
            'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
        ],
    },
};

export const ImageGallery: Story = {
    args: {
        urls: [
            'https://picsum.photos/id/237/1200/800.jpg',
            'https://picsum.photos/id/10/1200/800.jpg',
            'https://picsum.photos/id/100/1200/800.jpg',
            'https://picsum.photos/id/200/1200/800.jpg',
        ],
    },
};
