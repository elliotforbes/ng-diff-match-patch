import { OnInit, OnChanges } from '@angular/core';
import { DiffMatchPatchService } from './diffMatchPatch.service';
export declare class LineCompareComponent implements OnInit, OnChanges {
    private dmp;
    left: string | number | boolean;
    right: string | number | boolean;
    lineContextSize: number;
    calculatedDiff: Array<[string, string, string]>;
    isContentEqual: boolean;
    constructor(dmp: DiffMatchPatchService);
    ngOnInit(): void;
    ngOnChanges(): void;
    private updateHtml();
    private calculateLineDiff(diffs);
    private outputEqualDiff(diffLines, diffCalculation, isFirstDiff, isLastDiff);
    private outputEqualDiffLines(diffLines, diffCalculation);
    private outputDeleteDiff(diffLines, diffCalculation);
    private outputInsertDiff(diffLines, diffCalculation);
}
