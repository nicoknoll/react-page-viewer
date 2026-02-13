import { ReactNode } from 'react';

export interface Page<TRenderOptions = object> {
    width: number;
    height: number;
    render: (options?: TRenderOptions) => ReactNode;
}

export abstract class BasePageReader<TRenderOptions = object> {
    constructor(protected url: string) {}
    abstract getPage(index: number): Promise<Page<TRenderOptions>>;
    abstract getPages(): Promise<Page<TRenderOptions>[]>;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static canHandle(url: string): boolean {
        return false;
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
