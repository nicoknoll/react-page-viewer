import { CSSProperties, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Direction, MediaViewer, PluginEntry } from '../MediaViewer';
import { PageContainerProps } from '../plugins/BasePlugin';
import { BasePageReader, Page } from '../readers/BasePageReader';

export interface ViewerPage extends Page {
    isVisible: boolean;
    getContainerProps: () => PageContainerProps;
}

export const useMediaViewer = ({
    reader,
    plugins = [],
    direction = Direction.VERTICAL,
    virtualize = true,
    overscan = 200,
    normalizeDimension = false,
}: {
    reader: BasePageReader;
    plugins?: PluginEntry[];
    direction?: Direction;
    virtualize?: boolean;
    overscan?: number | string;
    normalizeDimension?: 'width' | 'height' | false;
}) => {
    const viewer = useMemo(() => new MediaViewer(plugins, direction), []);

    const [pages, setPages] = useState<Page[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Visibility tracking: ref holds the source of truth, version state triggers re-renders.
    // This way the pages array stays stable — only render() and isVisible read fresh values.
    const visiblePagesRef = useRef<Set<number>>(new Set());
    const [, setVisibilityVersion] = useState(0);

    const load = useCallback(() => {
        setIsLoading(true);
        setError(null);

        let cancelled = false;

        reader
            .getPages()
            .then((loaded) => {
                if (cancelled) return;
                const pages = normalizePages(loaded, normalizeDimension);
                viewer.setPages(pages);
                setPages(pages);
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                console.error('Error loading pages:', err);
                const error = err instanceof Error ? err : new Error(String(err));
                setError(error);
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [reader, viewer]);

    useEffect(() => load(), [load]);

    useLayoutEffect(() => {
        if (pages.length > 0) {
            viewer.onPagesReady();
        }
    }, [pages, viewer]);

    useEffect(() => () => viewer.destroy(), [viewer]);

    useEffect(() => {
        if (!virtualize || pages.length === 0) return;
        const canvas = viewer.canvasRef.current;
        if (!canvas) return;

        const elementToIndex = new Map<Element, number>();
        const observer = new IntersectionObserver(
            (entries) => {
                const prev = visiblePagesRef.current;
                const next = new Set(prev);
                let changed = false;
                for (const entry of entries) {
                    const index = elementToIndex.get(entry.target);
                    if (index === undefined) continue;
                    if (entry.isIntersecting && !prev.has(index)) {
                        next.add(index);
                        changed = true;
                    } else if (!entry.isIntersecting && prev.has(index)) {
                        next.delete(index);
                        changed = true;
                    }
                }
                if (changed) {
                    visiblePagesRef.current = next;
                    setVisibilityVersion((v) => v + 1);
                }
            },
            { root: canvas, rootMargin: typeof overscan === 'number' ? `${overscan}px` : overscan }
        );

        for (let i = 0; i < viewer.pageRefs.length; i++) {
            const el = viewer.pageRefs[i]?.current;
            if (el) {
                elementToIndex.set(el, i);
                observer.observe(el);
            }
        }

        return () => observer.disconnect();
    }, [pages, viewer, virtualize, overscan]);

    const canvasProps = useMemo(
        () => ({
            ref: (el: HTMLDivElement | null) => {
                viewer.canvasRef.current = el;
            },
            style: {
                overflow: 'auto',
                display: 'flex',
                flexDirection: viewer.direction === Direction.HORIZONTAL ? 'row' : 'column',
            } as CSSProperties,
        }),
        [viewer]
    );

    const viewerPages: ViewerPage[] = useMemo(
        () =>
            pages.map((p, i) => ({
                ...p,
                get isVisible() {
                    return !virtualize || visiblePagesRef.current.has(i);
                },
                render: (options?: any) => {
                    if (virtualize && !visiblePagesRef.current.has(i)) return null;
                    return p.render(options);
                },
                getContainerProps: () =>
                    viewer.getContainerProps(
                        {
                            ref: (el: HTMLDivElement | null) => {
                                viewer.pageRefs[i]!.current = el;
                            },
                            style: {
                                aspectRatio: `${p.width} / ${p.height}`,
                                width: p.width,
                                height: p.height,
                            } as CSSProperties,
                        },
                        p
                    ),
            })),
        [pages, viewer, virtualize]
    );

    return { viewer, canvasProps, pages: viewerPages, isLoading, error, reload: load };
};

const normalizePages = (pages: Page[], normalize: 'width' | 'height' | false): Page[] => {
    if (!normalize || pages.length <= 1) return pages;
    const reference = pages[0]!;
    return pages.map((p) => {
        const scale = normalize === 'width' ? reference.width / p.width : reference.height / p.height;
        if (scale === 1) return p;
        return { ...p, width: p.width * scale, height: p.height * scale };
    });
};
