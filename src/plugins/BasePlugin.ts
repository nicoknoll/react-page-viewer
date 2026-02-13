import { MediaViewer } from '../MediaViewer';
import { Page } from '../readers/BasePageReader';
import { CSSProperties } from 'react';

export interface PageContainerProps {
    ref: (el: HTMLDivElement | null) => void;
    style: CSSProperties;
}

export abstract class BasePlugin<TOptions = object, TStorage = any> {
    abstract pluginName: string;

    protected viewer: MediaViewer;
    protected options: TOptions;

    constructor(viewer: MediaViewer, options: TOptions) {
        this.viewer = viewer;
        this.options = options;
    }

    abstract addCommands(): Record<string, (...args: any[]) => any>;

    addStorage(): TStorage {
        return undefined as TStorage;
    }

    protected updateStorage(value: TStorage) {
        const storageMap = this.viewer.storage as unknown as Record<string, unknown>;
        storageMap[this.pluginName] = value;
        this.viewer.emit(this.pluginName);
    }

    getContainerProps(props: PageContainerProps, page: Page): PageContainerProps {
        return props;
    }

    onPagesLoaded(): void {}

    onPagesChanged(): void {}

    onCleanup(): void {}

    static configure<T extends typeof BasePlugin<any, any>>(
        this: T,
        options: ConstructorParameters<T>[1]
    ): { PluginClass: T; options: ConstructorParameters<T>[1] } {
        return { PluginClass: this, options };
    }
}
