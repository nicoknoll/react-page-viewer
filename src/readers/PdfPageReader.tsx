import * as pdfjsLib from 'pdfjs-dist';
import type { PDFPageProxy } from 'pdfjs-dist';
import { useEffect, useRef } from 'react';
import { BasePageReader, Page, getExtension } from './BasePageReader';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

const PdfPageCanvas = ({ page, scale }: { page: PDFPageProxy; scale: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const viewport = page.getViewport({ scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        const renderTask = page.render({ canvasContext: ctx, viewport });

        return () => {
            renderTask.cancel();
        };
    }, [page, scale]);

    return <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />;
};

export interface PdfRenderOptions {
    scale?: number;
}

export class PdfPageReader extends BasePageReader<PdfRenderOptions> {
    static canHandle(url: string): boolean {
        return getExtension(url) === 'pdf';
    }

    private pdf: Awaited<ReturnType<typeof pdfjsLib.getDocument>>['promise'] extends Promise<infer T> ? T : never =
        null!;

    private async ensurePdf() {
        if (!this.pdf) this.pdf = await pdfjsLib.getDocument(this.url).promise;
        return this.pdf;
    }

    private async toPage(pdfPage: PDFPageProxy): Promise<Page<PdfRenderOptions>> {
        const { width, height } = pdfPage.getViewport({ scale: 1 });
        return {
            width,
            height,
            render: ({ scale = 1 } = {}) => <PdfPageCanvas page={pdfPage} scale={scale} />,
        };
    }

    async getPage(index: number): Promise<Page<PdfRenderOptions>> {
        const pdf = await this.ensurePdf();
        const pdfPage = await pdf.getPage(index + 1);
        return this.toPage(pdfPage);
    }

    async getPages(): Promise<Page<PdfRenderOptions>[]> {
        const pdf = await this.ensurePdf();
        return Promise.all(Array.from({ length: pdf.numPages }, (_, i) => this.getPage(i)));
    }
}
