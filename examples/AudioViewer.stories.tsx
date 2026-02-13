import type { Meta, StoryObj } from '@storybook/react';
import { AudioPageReader, FitMode, useReader, useMediaViewer, ZoomPlugin } from '../src';

const AudioViewer = ({ url }: { url: string }) => {
    const reader = useReader(url, AudioPageReader);
    const { canvasProps, pages, isLoading, error } = useMediaViewer({
        reader,
        plugins: [ZoomPlugin.configure({ initialZoom: FitMode.FIT })],
    });

    if (error) return <div>Error: {error.message}</div>;
    if (isLoading) return <div>Loading…</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '20rem', border: '1px solid #ccc' }}>
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
                {pages.map((p, i) => (
                    <div key={i} {...p.getContainerProps()}>
                        {p.render({ controls: true })}
                    </div>
                ))}
            </div>
        </div>
    );
};

const meta: Meta<typeof AudioViewer> = {
    title: 'AudioViewer',
    component: AudioViewer,
    argTypes: {
        url: { control: 'text' },
    },
};

export default meta;
type Story = StoryObj<typeof AudioViewer>;

export const Default: Story = {
    args: {
        url: 'http://localhost:6006/sample.mp3',
    },
};
