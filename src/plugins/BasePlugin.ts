import { Extendable } from '../Extendable';
import { MediaViewer } from '../MediaViewer';
import { Page } from '../readers/BasePageReader';
import { CSSProperties } from 'react';

export interface PageContainerProps {
    ref: (el: HTMLDivElement | null) => void;
    style: CSSProperties;
}

export abstract class BasePlugin<TConfigOptions = object, TStorage = any> extends Extendable {
    abstract pluginName: string;

    protected viewer: MediaViewer;
    protected declare options: TConfigOptions;

    constructor(viewer: MediaViewer) {
        super();
        this.viewer = viewer;
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
        options: T extends abstract new (...args: any[]) => BasePlugin<infer O, any> ? O : never
    ): T {
        return super.configure.call(this, options) as T;
    }

    static extend<T extends typeof BasePlugin<any, any>>(
        this: T,
        overrides: Record<string, any>
    ): T {
        return super.extend.call(this, overrides) as T;
    }
}
