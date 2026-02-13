import { Direction, ViewerStorage } from '../MediaViewer';
import { BasePlugin } from './BasePlugin';
import { ScrollAnchor } from './PagePlugin';

interface ScrollStorage {
    dragEnabled: boolean;
    dragging: boolean;
}

interface ScrollPluginOptions {
    spaceToDrag?: boolean;
    dragEnabled?: boolean;
    defaultAlign?: ScrollAnchor;
    defaultBehavior?: ScrollBehavior;
}

export class ScrollPlugin extends BasePlugin<ScrollPluginOptions, ScrollStorage> {
    pluginName = 'scroll' as const;

    private isMouseOver = false;
    private isSpaceDown = false;
    private lastX = 0;
    private lastY = 0;

    addStorage(): ScrollStorage {
        return {
            dragEnabled: this.options.dragEnabled ?? false,
            dragging: false,
        };
    }

    private get scrollStorage(): ScrollStorage {
        return (this.viewer.storage as ViewerStorage).scroll;
    }

    private get canDrag(): boolean {
        return this.isSpaceDown || this.scrollStorage.dragEnabled;
    }

    addCommands() {
        return {
            enableDrag: () => {
                this.updateStorage({ ...this.scrollStorage, dragEnabled: true });
                const canvas = this.viewer.canvasRef.current;
                if (canvas) canvas.style.cursor = 'grab';
            },
            disableDrag: () => {
                this.updateStorage({ ...this.scrollStorage, dragEnabled: false, dragging: false });
                const canvas = this.viewer.canvasRef.current;
                if (canvas) canvas.style.cursor = '';
            },
            toggleDrag: () => {
                if (this.scrollStorage.dragEnabled) {
                    this.viewer.commands.disableDrag();
                } else {
                    this.viewer.commands.enableDrag();
                }
            },

            scrollToPage: (
                page: number,
                align: ScrollAnchor = this.options.defaultAlign ?? ScrollAnchor.START,
                behavior: ScrollBehavior = this.options.defaultBehavior ?? 'smooth'
            ) => {
                const container = this.viewer.canvasRef.current;
                const pageEl = this.viewer.pageRefs[page]?.current;
                if (!container || !pageEl) return;

                const horizontal = this.viewer.direction === Direction.HORIZONTAL;
                const cRect = container.getBoundingClientRect();
                const pRect = pageEl.getBoundingClientRect();

                if (horizontal) {
                    const delta = pRect.left - cRect.left + container.scrollLeft;
                    const offsets = {
                        [ScrollAnchor.START]: delta,
                        [ScrollAnchor.CENTER]: delta - cRect.width / 2 + pRect.width / 2,
                        [ScrollAnchor.END]: delta - cRect.width + pRect.width,
                    };
                    container.scrollTo({ left: offsets[align], behavior });
                } else {
                    const delta = pRect.top - cRect.top + container.scrollTop;
                    const offsets = {
                        [ScrollAnchor.START]: delta,
                        [ScrollAnchor.CENTER]: delta - cRect.height / 2 + pRect.height / 2,
                        [ScrollAnchor.END]: delta - cRect.height + pRect.height,
                    };
                    container.scrollTo({ top: offsets[align], behavior });
                }

                (this.viewer.commands as { setPage?: (page: number) => void }).setPage?.(page);
            },

            setScrollX: (x: number, behavior: ScrollBehavior = this.options.defaultBehavior ?? 'smooth') => {
                this.viewer.canvasRef.current?.scrollTo({ left: x, behavior });
            },

            setScrollY: (y: number, behavior: ScrollBehavior = this.options.defaultBehavior ?? 'smooth') => {
                this.viewer.canvasRef.current?.scrollTo({ top: y, behavior });
            },

            setScroll: (x: number, y: number, behavior: ScrollBehavior = this.options.defaultBehavior ?? 'smooth') => {
                this.viewer.canvasRef.current?.scrollTo({ left: x, top: y, behavior });
            },

            getScrollX: () => this.viewer.canvasRef.current?.scrollLeft ?? 0,
            getScrollY: () => this.viewer.canvasRef.current?.scrollTop ?? 0,
        };
    }

    onPagesLoaded() {
        this.attachListeners();
        if (this.scrollStorage.dragEnabled) {
            const canvas = this.viewer.canvasRef.current;
            if (canvas) canvas.style.cursor = 'grab';
        }
    }

    onCleanup() {
        this.detachListeners();
    }

    private onKeyDown = (e: KeyboardEvent) => {
        if (!this.options.spaceToDrag) return;
        if (e.code !== 'Space') return;
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
        if (!this.isMouseOver) return;
        e.preventDefault();
        if (this.isSpaceDown) return;
        this.isSpaceDown = true;
        const canvas = this.viewer.canvasRef.current;
        if (canvas) canvas.style.cursor = 'grab';
    };

    private onKeyUp = (e: KeyboardEvent) => {
        if (e.code !== 'Space') return;
        if (!this.isSpaceDown) return;
        e.preventDefault();
        this.isSpaceDown = false;
        if (this.scrollStorage.dragging) {
            this.updateStorage({ ...this.scrollStorage, dragging: false });
        }
        const canvas = this.viewer.canvasRef.current;
        if (canvas) canvas.style.cursor = this.scrollStorage.dragEnabled ? 'grab' : '';
    };

    private onMouseEnter = (e: MouseEvent) => {
        const canvas = this.viewer.canvasRef.current;
        if (!canvas || e.target !== canvas) return;
        this.isMouseOver = true;
    };

    private onMouseLeave = (e: MouseEvent) => {
        const canvas = this.viewer.canvasRef.current;
        if (!canvas || e.target !== canvas) return;
        this.isMouseOver = false;
        if (this.scrollStorage.dragging) {
            this.updateStorage({ ...this.scrollStorage, dragging: false });
        }
        canvas.style.cursor = this.scrollStorage.dragEnabled ? 'grab' : '';
    };

    private onMouseDown = (e: MouseEvent) => {
        if (!this.canDrag) return;
        this.updateStorage({ ...this.scrollStorage, dragging: true });
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        const canvas = this.viewer.canvasRef.current;
        if (canvas) canvas.style.cursor = 'grabbing';
    };

    private onMouseMove = (e: MouseEvent) => {
        if (!this.scrollStorage.dragging) return;
        const canvas = this.viewer.canvasRef.current;
        if (!canvas) return;
        canvas.scrollLeft -= e.clientX - this.lastX;
        canvas.scrollTop -= e.clientY - this.lastY;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
    };

    private onMouseUp = () => {
        if (!this.scrollStorage.dragging) return;
        this.updateStorage({ ...this.scrollStorage, dragging: false });
        const canvas = this.viewer.canvasRef.current;
        if (canvas) canvas.style.cursor = this.canDrag ? 'grab' : '';
    };

    private attachListeners() {
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
        document.addEventListener('mouseenter', this.onMouseEnter, true);
        document.addEventListener('mouseleave', this.onMouseLeave, true);
        document.addEventListener('mousedown', this.onMouseDown);
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
    }

    private detachListeners() {
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('mouseenter', this.onMouseEnter, true);
        document.removeEventListener('mouseleave', this.onMouseLeave, true);
        document.removeEventListener('mousedown', this.onMouseDown);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
    }
}

declare module '../MediaViewer' {
    interface ViewerCommands {
        enableDrag(): void;
        disableDrag(): void;
        toggleDrag(): void;
        scrollToPage(page: number, align?: ScrollAnchor, behavior?: ScrollBehavior): void;
        setScrollX(x: number, behavior?: ScrollBehavior): void;
        setScrollY(y: number, behavior?: ScrollBehavior): void;
        setScroll(x: number, y: number, behavior?: ScrollBehavior): void;
        getScrollX(): number;
        getScrollY(): number;
    }
    interface ViewerStorage {
        scroll: ScrollStorage;
    }
}
