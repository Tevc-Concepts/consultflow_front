// Types for the Report Builder
export type BlockKind = 'kpis' | 'chart' | 'narrative' | 'table' | 'raw';
export type Id = string;

export interface Block {
    id: Id;
    kind: BlockKind;
    data: any;
    binding?: string;
}

export interface Slide {
    id: Id;
    name: string;
    blocks: Block[];
}

export interface BuilderState {
    slides: Slide[];
    current: Id | null;
    selectedBlock: Id | null;
}

export interface KPIItem {
    label: string;
    value: number;
    delta: number;
}

export interface KPIBlockData {
    items: KPIItem[];
}

export interface ChartBlockData {
    type: 'line' | 'bar' | 'pie';
    title: string;
    series: Array<{
        name: string;
        data: number[];
        labels?: string[];
    }>;
}

export interface NarrativeBlockData {
    title: string;
    body: string;
}

export interface TableBlockData {
    headers: string[];
    rows: Array<Record<string, any>>;
}

export interface RawBlockData {
    content: string;
}