import { ReactNode } from 'react';
import { Extendable } from '../Extendable';

export interface Page<TRenderOptions = object> {
    width: number;
    height: number;
    render: (options?: TRenderOptions) => ReactNode;
}

export abstract class BasePageReader<TConfigOptions = object, TRenderOptions = object> extends Extendable {
    protected declare options: TConfigOptions;

    constructor(protected url: string) {
        super();
    }

    abstract getPage(index: number): Promise<Page<TRenderOptions>>;
    abstract getPages(): Promise<Page<TRenderOptions>[]>;

    static canHandle(url: string): boolean {
        return false;
    }

    static configure<T extends typeof BasePageReader<any, any>>(
        this: T,
        options: T extends abstract new (...args: any[]) => BasePageReader<infer O> ? O : never
    ): T {
        return super.configure.call(this, options) as T;
    }

    static extend<T extends typeof BasePageReader<any, any>>(
        this: T,
        overrides: Record<string, any>
    ): T {
        return super.extend.call(this, overrides) as T;
    }
}

export type ReaderClass = (new (url: string) => BasePageReader<any>) & {
    canHandle(url: string): boolean;
};

/** Extract the file extension from a URL, ignoring query string and fragment. */
export const getExtension = (url: string): string => {
    try {
        const pathname = new URL(url, 'https://x').pathname;
        const dot = pathname.lastIndexOf('.');
        return dot === -1 ? '' : pathname.slice(dot + 1).toLowerCase();
    } catch {
        return '';
    }
};
