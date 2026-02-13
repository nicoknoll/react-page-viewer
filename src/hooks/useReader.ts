import { useMemo } from 'react';
import { BasePageReader, Page, ReaderClass } from '../readers/BasePageReader';

export interface ReaderOptions {}

export const useReader = (
    urls: string | string[],
    readers: ReaderClass | readonly ReaderClass[],
    options: ReaderOptions = {}
) => {
    return useMemo(() => {
        const urlList = Array.isArray(urls) ? urls : [urls];
        const readerList = Array.isArray(readers) ? readers : null;

        const instances = urlList.map((url) => {
            const Reader = readerList ? selectReader(url, readerList) : (readers as ReaderClass);
            return new Reader(url);
        });

        return instances.length === 1 ? instances[0]! : new CompositePageReader(instances);
    }, [urls]);
};

const selectReader = (url: string, readers: ReaderClass[]): ReaderClass => {
    for (const Reader of readers) {
        if (Reader.canHandle(url)) return Reader;
    }
    throw new Error(`No reader found for URL: ${url}`);
};

class CompositePageReader extends BasePageReader {
    private readers: BasePageReader[];

    constructor(readers: BasePageReader[]) {
        super('');
        this.readers = readers;
    }

    async getPage(index: number): Promise<Page> {
        const pages = await this.getPages();
        return pages[index]!;
    }

    async getPages(): Promise<Page[]> {
        const results = await Promise.all(this.readers.map((r) => r.getPages()));
        return results.flat();
    }
}
