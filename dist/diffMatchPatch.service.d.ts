import { DiffMatchPatch, DiffOp } from './diffMatchPatch';
export declare class DiffMatchPatchService {
    private dmp;
    constructor(dmp: DiffMatchPatch);
    ngOnInit(): void;
    getDiff(left: string, right: string): [DiffOp, string][];
    getSemanticDiff(left: string, right: string): [DiffOp, string][];
    getProcessingDiff(left: string, right: string): [DiffOp, string][];
    getLineDiff(left: string, right: string): [DiffOp, string][];
    getDmp(): DiffMatchPatch;
}
