import { Direction, ViewerStorage } from '../MediaViewer';
import { BasePlugin } from './BasePlugin';

export const ScrollAnchor = {
    START: 'start',
    CENTER: 'center',
    END: 'end',
} as const;

export type ScrollAnchor = (typeof ScrollAnchor)[keyof typeof ScrollAnchor];

interface PagePluginOptions {
    initialPage?: number;
    trackScroll?: boolean;
    scrollAnchor?: ScrollAnchor;
}

export class PagePlugin extends BasePlugin<PagePluginOptions, number> {
    pluginName = 'page' as const;

    private suppressTracking = false;
    private settleTimer = 0;

    addStorage() {
        return this.options.initialPage ?? 0;
    }

    private get currentPage(): number {
        return (this.viewer.storage as ViewerStorage).page;
    }

    addCommands() {
        return {
            setPage: (page: number) => {
                this.suppressTracking = true;
                this.updateStorage(page);
            },
            getPage: (): number => this.currentPage,
        };
    }

    onPagesLoaded() {
        if (this.options.trackScroll !== false) {
            this.viewer.canvasRef.current?.addEventListener('scroll', this.onScroll);
            this.viewer.canvasRef.current?.addEventListener('wheel', this.onWheel);
        }
    }

    onCleanup() {
        this.viewer.canvasRef.current?.removeEventListener('scroll', this.onScroll);
        this.viewer.canvasRef.current?.removeEventListener('wheel', this.onWheel);
        window.clearTimeout(this.settleTimer);
    }

    private onWheel = () => {
        if (this.suppressTracking) {
            this.suppressTracking = false;
            window.clearTimeout(this.settleTimer);
        }
    };

    private onScroll = () => {
        if (this.suppressTracking) {
            window.clearTimeout(this.settleTimer);
            this.settleTimer = window.setTimeout(() => {
                this.suppressTracking = false;
            }, 150);
            return;
        }

        const canvas = this.viewer.canvasRef.current;
        if (!canvas) return;

        const horizontal = this.viewer.direction === Direction.HORIZONTAL;
        const anchor = this.options.scrollAnchor ?? ScrollAnchor.START;
        const cRect = canvas.getBoundingClientRect();

        const anchorPos = horizontal
            ? anchor === ScrollAnchor.START
                ? cRect.left
                : anchor === ScrollAnchor.END
                  ? cRect.right
                  : cRect.left + cRect.width / 2
            : anchor === ScrollAnchor.START
              ? cRect.top
              : anchor === ScrollAnchor.END
                ? cRect.bottom
                : cRect.top + cRect.height / 2;

        let closest = 0;
        let closestDist = Infinity;

        for (let i = 0; i < this.viewer.pageRefs.length; i++) {
            const el = this.viewer.pageRefs[i]?.current;
            if (!el) continue;
            const pRect = el.getBoundingClientRect();
            const start = horizontal ? pRect.left : pRect.top;
            const end = horizontal ? pRect.right : pRect.bottom;
            const dist = anchorPos < start ? start - anchorPos : anchorPos > end ? anchorPos - end : 0;
            if (dist < closestDist) {
                closestDist = dist;
                closest = i;
            }
        }

        if (closest !== this.currentPage) {
            this.updateStorage(closest);
        }
    };
}

declare module 'react-page-viewer' {
    interface ViewerCommands {
        setPage(page: number): void;
        getPage(): number;
    }
    interface ViewerStorage {
        page: number;
    }
}
