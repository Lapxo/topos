/**
 * One scale constructor. The class name on the wire stays `forms`.
 * Lattice and count are inert references — type-only algebra ports; no runtime import.
 */
export interface ScaleDescriptor {
    readonly id: string;
    readonly universe: string;
    readonly order: string;
    readonly generators?: readonly string[];
    readonly lattice?: string;
    readonly count?: string;
    readonly sample: {
        readonly yes: readonly unknown[];
        readonly no: readonly unknown[];
    };
}
