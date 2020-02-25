/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { Injectable } from '@angular/core';
import { DiffMatchPatch } from './diffMatchPatch';
export class DiffMatchPatchService {
    /**
     * @param {?} dmp
     */
    constructor(dmp) {
        this.dmp = dmp;
    }
    /**
     * @return {?}
     */
    ngOnInit() {
    }
    /**
     * @param {?} left
     * @param {?} right
     * @return {?}
     */
    getDiff(left, right) {
        return this.dmp.diff_main(left, right);
    }
    /**
     * @param {?} left
     * @param {?} right
     * @return {?}
     */
    getSemanticDiff(left, right) {
        /** @type {?} */
        const diffs = this.dmp.diff_main(left, right);
        this.dmp.diff_cleanupSemantic(diffs);
        return diffs;
    }
    /**
     * @param {?} left
     * @param {?} right
     * @return {?}
     */
    getProcessingDiff(left, right) {
        /** @type {?} */
        const diffs = this.dmp.diff_main(left, right);
        this.dmp.diff_cleanupEfficiency(diffs);
        return diffs;
    }
    /**
     * @param {?} left
     * @param {?} right
     * @return {?}
     */
    getLineDiff(left, right) {
        /** @type {?} */
        const chars = this.dmp.diff_linesToChars_(left, right);
        /** @type {?} */
        const diffs = this.dmp.diff_main(chars.chars1, chars.chars2, false);
        this.dmp.diff_charsToLines_(diffs, chars.lineArray);
        return diffs;
    }
    /**
     * @return {?}
     */
    getDmp() {
        return this.dmp;
    }
}
DiffMatchPatchService.decorators = [
    { type: Injectable },
];
/** @nocollapse */
DiffMatchPatchService.ctorParameters = () => [
    { type: DiffMatchPatch }
];
if (false) {
    /** @type {?} */
    DiffMatchPatchService.prototype.dmp;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZk1hdGNoUGF0Y2guc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJuZzovL25nLWRpZmYtbWF0Y2gtcGF0Y2gvIiwic291cmNlcyI6WyJsaWIvZGlmZk1hdGNoUGF0Y2guc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBQUEsT0FBTyxFQUFFLFVBQVUsRUFBVSxNQUFNLGVBQWUsQ0FBQztBQUNuRCxPQUFPLEVBQUUsY0FBYyxFQUFVLE1BQU0sa0JBQWtCLENBQUM7QUFHMUQsTUFBTTs7OztJQUVKLFlBQW9CLEdBQW1CO1FBQW5CLFFBQUcsR0FBSCxHQUFHLENBQWdCO0tBQU87Ozs7SUFFOUMsUUFBUTtLQUVQOzs7Ozs7SUFFRCxPQUFPLENBQUMsSUFBWSxFQUFFLEtBQWE7UUFDaEMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztLQUN6Qzs7Ozs7O0lBRUQsZUFBZSxDQUFDLElBQVksRUFBRSxLQUFhOztRQUN6QyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDOUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyQyxNQUFNLENBQUMsS0FBSyxDQUFDO0tBQ2Q7Ozs7OztJQUVELGlCQUFpQixDQUFDLElBQVksRUFBRSxLQUFhOztRQUMzQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDOUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN2QyxNQUFNLENBQUMsS0FBSyxDQUFDO0tBQ2Q7Ozs7OztJQUVELFdBQVcsQ0FBQyxJQUFZLEVBQUUsS0FBYTs7UUFDckMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7O1FBQ3ZELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNwRSxJQUFJLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDcEQsTUFBTSxDQUFDLEtBQUssQ0FBQztLQUNkOzs7O0lBRUQsTUFBTTtRQUNKLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO0tBQ2pCOzs7WUFsQ0YsVUFBVTs7OztZQUZGLGNBQWMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlLCBPbkluaXQgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IHsgRGlmZk1hdGNoUGF0Y2gsIERpZmZPcCB9IGZyb20gJy4vZGlmZk1hdGNoUGF0Y2gnO1xyXG5cclxuQEluamVjdGFibGUoKVxyXG5leHBvcnQgY2xhc3MgRGlmZk1hdGNoUGF0Y2hTZXJ2aWNlIGltcGxlbWVudHMgT25Jbml0IHtcclxuXHJcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBkbXA6IERpZmZNYXRjaFBhdGNoKSB7ICAgfVxyXG5cclxuICBuZ09uSW5pdCAoKSB7XHJcblxyXG4gIH1cclxuXHJcbiAgZ2V0RGlmZihsZWZ0OiBzdHJpbmcsIHJpZ2h0OiBzdHJpbmcpIHtcclxuICAgICByZXR1cm4gdGhpcy5kbXAuZGlmZl9tYWluKGxlZnQsIHJpZ2h0KTtcclxuICB9XHJcblxyXG4gIGdldFNlbWFudGljRGlmZihsZWZ0OiBzdHJpbmcsIHJpZ2h0OiBzdHJpbmcpIHtcclxuICAgIGNvbnN0IGRpZmZzID0gdGhpcy5kbXAuZGlmZl9tYWluKGxlZnQsIHJpZ2h0KTtcclxuICAgIHRoaXMuZG1wLmRpZmZfY2xlYW51cFNlbWFudGljKGRpZmZzKTtcclxuICAgIHJldHVybiBkaWZmcztcclxuICB9XHJcblxyXG4gIGdldFByb2Nlc3NpbmdEaWZmKGxlZnQ6IHN0cmluZywgcmlnaHQ6IHN0cmluZykge1xyXG4gICAgY29uc3QgZGlmZnMgPSB0aGlzLmRtcC5kaWZmX21haW4obGVmdCwgcmlnaHQpO1xyXG4gICAgdGhpcy5kbXAuZGlmZl9jbGVhbnVwRWZmaWNpZW5jeShkaWZmcyk7XHJcbiAgICByZXR1cm4gZGlmZnM7XHJcbiAgfVxyXG5cclxuICBnZXRMaW5lRGlmZihsZWZ0OiBzdHJpbmcsIHJpZ2h0OiBzdHJpbmcpIHtcclxuICAgIGNvbnN0IGNoYXJzID0gdGhpcy5kbXAuZGlmZl9saW5lc1RvQ2hhcnNfKGxlZnQsIHJpZ2h0KTtcclxuICAgIGNvbnN0IGRpZmZzID0gdGhpcy5kbXAuZGlmZl9tYWluKGNoYXJzLmNoYXJzMSwgY2hhcnMuY2hhcnMyLCBmYWxzZSk7XHJcbiAgICB0aGlzLmRtcC5kaWZmX2NoYXJzVG9MaW5lc18oZGlmZnMsIGNoYXJzLmxpbmVBcnJheSk7XHJcbiAgICByZXR1cm4gZGlmZnM7XHJcbiAgfVxyXG5cclxuICBnZXREbXAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kbXA7XHJcbiAgfVxyXG5cclxufVxyXG4iXX0=