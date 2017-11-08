import { ElementRef, OnInit, OnChanges } from '@angular/core';
import { DiffMatchPatchService } from './diffMatchPatch.service';
export declare class LineDiffDirective implements OnInit, OnChanges {
    private el;
    private dmp;
    left: string | number | boolean;
    right: string | number | boolean;
    constructor(el: ElementRef, dmp: DiffMatchPatchService);
    ngOnInit(): void;
    ngOnChanges(): void;
    private updateHtml();
    private createHtml(diffs);
}
