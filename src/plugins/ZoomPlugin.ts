import { ViewerStorage } from '../MediaViewer';
import { Page } from '../readers/BasePageReader';
import { BasePlugin, PageContainerProps } from './BasePlugin';

export const FitMode = {
    FIT: 'fit',
    COVER: 'cover',
    FIT_WIDTH: 'fit-width',
    FIT_HEIGHT: 'fit-height',
} as const;

export type FitMode = (typeof FitMode)[keyof typeof FitMode];

interface ZoomPluginOptions {
    initialZoom?: number | FitMode | ((page: Page, canvas: HTMLDivElement) => number);
    minZoom?: number;
    maxZoom?: number;
    zoomStep?: number;
}

export class ZoomPlugin extends BasePlugin<ZoomPluginOptions, number> {
    pluginName = 'zoom' as const;

    addStorage() {
        // When initialZoom is deferred (string or function), start at 0
        // (invisible) until onPagesLoaded resolves the actual value
        if (typeof this.options.initialZoom !== 'number') return this.options.initialZoom === undefined ? 1 : 0;
        return this.options.initialZoom;
    }

    onPagesLoaded() {
        const { initialZoom } = this.options;
        if (typeof initialZoom === 'string') {
            const zoom = this.calculateFitZoom(initialZoom);
            if (zoom !== null) this.updateStorage(this.clampZoom(zoom));
        } else if (typeof initialZoom === 'function') {
            const canvas = this.viewer.canvasRef.current;
            const page = this.viewer.pages[0];
            if (canvas && page) {
                this.updateStorage(this.clampZoom(initialZoom(page, canvas)));
            }
        }
    }

    addCommands() {
        return {
            setZoom: (level: number) => {
                const canvas = this.viewer.canvasRef.current;
                const oldZoom = (this.viewer.storage as ViewerStorage).zoom;
                const newZoom = this.clampZoom(level);
                if (oldZoom === newZoom) return;

                if (!canvas) {
                    this.updateStorage(newZoom);
                    return;
                }

                // zoom to the center of the viewport
                const ratio = newZoom / oldZoom;
                const centerX = canvas.scrollLeft + canvas.clientWidth / 2;
                const centerY = canvas.scrollTop + canvas.clientHeight / 2;

                this.updateStorage(newZoom);

                requestAnimationFrame(() => {
                    canvas.scrollLeft = Math.max(0, centerX * ratio - canvas.clientWidth / 2);
                    canvas.scrollTop = Math.max(0, centerY * ratio - canvas.clientHeight / 2);
                });
            },
            getZoom: (): number => (this.viewer.storage as ViewerStorage).zoom,
            zoomIn: (step?: number) => {
                const current = (this.viewer.storage as ViewerStorage).zoom;
                const delta = step ?? this.options.zoomStep ?? 0.25;
                const next = current + delta;
                this.viewer.commands.setZoom(current < 1 && next > 1 ? 1 : next);
            },
            zoomOut: (step?: number) => {
                const current = (this.viewer.storage as ViewerStorage).zoom;
                const delta = step ?? this.options.zoomStep ?? 0.25;
                const next = current - delta;
                this.viewer.commands.setZoom(current > 1 && next < 1 ? 1 : next);
            },
            resetZoom: () => {
                this.viewer.commands.setZoom(1);
            },
            zoomToFit: (mode?: FitMode) => {
                const fitMode =
                    mode ?? (typeof this.options.initialZoom === 'string' ? this.options.initialZoom : 'fit');
                const zoom = this.calculateFitZoom(fitMode);
                if (zoom !== null) this.viewer.commands.setZoom(zoom);
            },
        };
    }

    getContainerProps(props: PageContainerProps, page: Page): PageContainerProps {
        const zoom = (this.viewer.storage as ViewerStorage).zoom;
        return {
            ...props,
            style: {
                ...props.style,
                width: page.width * zoom,
                height: page.height * zoom,
            },
        };
    }

    private clampZoom(level: number): number {
        return Math.max(this.options.minZoom ?? 0.1, Math.min(this.options.maxZoom ?? 10, level));
    }

    private calculateFitZoom(mode: FitMode): number | null {
        const canvas = this.viewer.canvasRef.current;
        const page = this.viewer.pages[0];
        if (!canvas || !page) return null;

        const prevOverflow = canvas.style.overflow;
        canvas.style.overflow = 'scroll';

        const cs = getComputedStyle(canvas);
        const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
        const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
        const availW = canvas.clientWidth - padX;
        const availH = canvas.clientHeight - padY;

        canvas.style.overflow = prevOverflow;

        const scaleX = availW / page.width;
        const scaleY = availH / page.height;

        switch (mode) {
            case 'fit':
                return Math.min(scaleX, scaleY);
            case 'cover':
                return Math.max(scaleX, scaleY);
            case 'fit-width':
                return scaleX;
            case 'fit-height':
                return scaleY;
        }
    }
}

declare module 'react-page-viewer' {
    interface ViewerCommands {
        setZoom(level: number): void;
        getZoom(): number;
        zoomIn(step?: number): void;
        zoomOut(step?: number): void;
        resetZoom(): void;
        zoomToFit(mode?: FitMode): void;
    }
    interface ViewerStorage {
        zoom: number;
    }
}
