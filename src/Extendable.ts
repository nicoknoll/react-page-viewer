export abstract class Extendable {
    protected options: any;

    constructor(...args: any[]) {
        this.options = (this.constructor as any).options ?? {};
    }

    static configure(options: Record<string, any>): any {
        class Configured extends (this as any) {}
        (Configured as any).options = options;
        return Configured;
    }

    static extend(overrides: Record<string, any>): any {
        class Extended extends (this as any) {
            constructor(...args: any[]) {
                super(...args);
                Object.assign(this, overrides);
            }
        }
        return Extended;
    }
}