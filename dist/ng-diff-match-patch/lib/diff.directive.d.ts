import { ElementRef, OnInit, OnChanges } from '@angular/core';
import { DiffMatchPatchService } from './diffMatchPatch.service';
export declare class DiffDirective implements OnInit, OnChanges {
    private el;
    private dmp;
    left: string;
    right: string;
    constructor(el: ElementRef, dmp: DiffMatchPatchService);
    ngOnInit(): void;
    ngOnChanges(): void;
    private updateHtml();
    private createHtml(diffs);
}
