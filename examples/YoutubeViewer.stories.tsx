import type { Meta, StoryObj } from '@storybook/react';
import { FitMode, YoutubePageReader, useReader, useMediaViewer, useStorage, ZoomPlugin, ScrollPlugin } from '../src';

const YoutubeViewer = ({ url }: { url: string }) => {
    const reader = useReader(url, YoutubePageReader);
    const { viewer, canvasProps, pages, isLoading, error } = useMediaViewer({
        reader,
        plugins: [ZoomPlugin.configure({ initialZoom: FitMode.FIT }), ScrollPlugin.configure({ spaceToDrag: true })],
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

const meta: Meta<typeof YoutubeViewer> = {
    title: 'YoutubeViewer',
    component: YoutubeViewer,
    argTypes: {
        url: { control: 'text' },
    },
};

export default meta;
type Story = StoryObj<typeof YoutubeViewer>;

export const Default: Story = {
    args: {
        url: 'https://www.youtube.com/watch?v=Ox5uhfYtdJA',
    },
};
