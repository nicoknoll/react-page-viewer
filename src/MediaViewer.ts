import { BasePlugin, PageContainerProps } from './plugins/BasePlugin';
import { Page } from './readers/BasePageReader';

export interface ViewerCommands {}
export interface ViewerStorage {}

export type PluginEntry = typeof BasePlugin<any, any> | { PluginClass: typeof BasePlugin<any, any>; options: any };

export const Direction = {
    VERTICAL: 'vertical',
    HORIZONTAL: 'horizontal',
} as const;

export type Direction = (typeof Direction)[keyof typeof Direction];

export class MediaViewer {
    commands = {} as ViewerCommands;
    storage = {} as ViewerStorage;
    canvasRef: { current: HTMLDivElement | null } = { current: null };
    pageRefs: { current: HTMLDivElement | null }[] = [];
    pages: Page[] = [];
    direction: Direction = Direction.VERTICAL;

    private plugins: BasePlugin[] = [];
    private listeners = new Map<string, Set<() => void>>();
    private pagesLoadedOnce = false;

    constructor(pluginEntries: PluginEntry[], direction: Direction = Direction.VERTICAL) {
        this.direction = direction;
        for (const entry of pluginEntries) {
            const [Ctor, opts] = 'PluginClass' in entry ? [entry.PluginClass, entry.options] : [entry, {}];
            const plugin = new (Ctor as unknown as new (viewer: MediaViewer, options: any) => BasePlugin)(this, opts);
            this.plugins.push(plugin);
            Object.assign(this.commands, plugin.addCommands());
            (this.storage as unknown as Record<string, unknown>)[plugin.pluginName] = plugin.addStorage();
        }
    }

    subscribe(event: string, cb: () => void): () => void {
        if (!this.listeners.has(event)) this.listeners.set(event, new Set());
        this.listeners.get(event)!.add(cb);
        return () => {
            this.listeners.get(event)?.delete(cb);
        };
    }

    emit(event: string) {
        this.listeners.get(event)?.forEach((cb) => cb());
    }

    setPages(pages: Page[]) {
        this.pages = pages;
        this.pageRefs = Array.from({ length: pages.length }, (_, i) => this.pageRefs[i] ?? { current: null });
    }

    onPagesReady() {
        if (!this.pagesLoadedOnce) {
            this.pagesLoadedOnce = true;
            this.plugins.forEach((p) => p.onPagesLoaded());
        }
        this.plugins.forEach((p) => p.onPagesChanged());
    }

    getContainerProps(baseProps: PageContainerProps, page: Page): PageContainerProps {
        return this.plugins.reduce((props, plugin) => plugin.getContainerProps(props, page), baseProps);
    }

    destroy() {
        this.plugins.forEach((p) => p.onCleanup());
        this.listeners.clear();
    }
}
