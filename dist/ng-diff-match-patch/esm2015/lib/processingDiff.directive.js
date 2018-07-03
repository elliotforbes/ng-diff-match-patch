/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { Directive, ElementRef, Input } from '@angular/core';
import { DiffMatchPatchService } from './diffMatchPatch.service';
export class ProcessingDiffDirective {
    /**
     * @param {?} el
     * @param {?} dmp
     */
    constructor(el, dmp) {
        this.el = el;
        this.dmp = dmp;
    }
    /**
     * @return {?}
     */
    ngOnInit() {
        this.updateHtml();
    }
    /**
     * @return {?}
     */
    ngOnChanges() {
        this.updateHtml();
    }
    /**
     * @return {?}
     */
    updateHtml() {
        this.el.nativeElement.innerHTML = this.createHtml(this.dmp.getProcessingDiff(this.left, this.right));
    }
    /**
     * @param {?} diffs
     * @return {?}
     */
    createHtml(diffs) {
        /** @type {?} */
        let html;
        html = '<div>';
        for (let diff of diffs) {
            diff[1] = diff[1].replace(/\n/g, '<br/>');
            if (diff[0] === 0 /* Equal */) {
                html += '<span class="equal">' + diff[1] + '</span>';
            }
            if (diff[0] === -1 /* Delete */) {
                html += '<del>' + diff[1] + '</del>';
            }
            if (diff[0] === 1 /* Insert */) {
                html += '<ins>' + diff[1] + '</ins>';
            }
        }
        html += '</div>';
        return html;
    }
}
ProcessingDiffDirective.decorators = [
    { type: Directive, args: [{
                selector: '[processingDiff]'
            },] },
];
/** @nocollapse */
ProcessingDiffDirective.ctorParameters = () => [
    { type: ElementRef },
    { type: DiffMatchPatchService }
];
ProcessingDiffDirective.propDecorators = {
    left: [{ type: Input }],
    right: [{ type: Input }]
};
if (false) {
    /** @type {?} */
    ProcessingDiffDirective.prototype.left;
    /** @type {?} */
    ProcessingDiffDirective.prototype.right;
    /** @type {?} */
    ProcessingDiffDirective.prototype.el;
    /** @type {?} */
    ProcessingDiffDirective.prototype.dmp;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvY2Vzc2luZ0RpZmYuZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vbmctZGlmZi1tYXRjaC1wYXRjaC8iLCJzb3VyY2VzIjpbImxpYi9wcm9jZXNzaW5nRGlmZi5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBcUIsTUFBTSxlQUFlLENBQUM7QUFDaEYsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFNakUsTUFBTTs7Ozs7Z0JBS00sSUFDQTtRQURBLE9BQUUsR0FBRixFQUFFO1FBQ0YsUUFBRyxHQUFILEdBQUc7Ozs7O0lBRU4sUUFBUTtRQUNiLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQzs7Ozs7SUFHYixXQUFXO1FBQ2hCLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQzs7Ozs7SUFHWixVQUFVO1FBQ2hCLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUMvQyxJQUFJLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Ozs7OztJQUkvQyxVQUFVLENBQUMsS0FBa0I7O1FBQ25DLElBQUksSUFBSSxDQUFTO1FBQ2pCLElBQUksR0FBRyxPQUFPLENBQUM7UUFDZixHQUFHLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztZQUUxQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGtCQUFpQixDQUFDLENBQUMsQ0FBQztnQkFDN0IsSUFBSSxJQUFJLHNCQUFzQixHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUM7YUFDdEQ7WUFDRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLG9CQUFrQixDQUFDLENBQUMsQ0FBQztnQkFDOUIsSUFBSSxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDO2FBQ3RDO1lBQ0QsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxtQkFBa0IsQ0FBQyxDQUFDLENBQUM7Z0JBQzlCLElBQUksSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQzthQUN0QztTQUNGO1FBQ0QsSUFBSSxJQUFJLFFBQVEsQ0FBQztRQUNqQixNQUFNLENBQUMsSUFBSSxDQUFDOzs7O1lBMUNmLFNBQVMsU0FBQztnQkFDVCxRQUFRLEVBQUUsa0JBQWtCO2FBQzdCOzs7O1lBTm1CLFVBQVU7WUFDckIscUJBQXFCOzs7bUJBTzNCLEtBQUs7b0JBQ0wsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERpcmVjdGl2ZSwgRWxlbWVudFJlZiwgSW5wdXQsIE9uSW5pdCwgT25DaGFuZ2VzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBEaWZmTWF0Y2hQYXRjaFNlcnZpY2UgfSBmcm9tICcuL2RpZmZNYXRjaFBhdGNoLnNlcnZpY2UnO1xuaW1wb3J0IHsgRGlmZiwgRGlmZk9wIH0gZnJvbSAnLi9kaWZmTWF0Y2hQYXRjaCc7XG5cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1twcm9jZXNzaW5nRGlmZl0nXG59KVxuZXhwb3J0IGNsYXNzIFByb2Nlc3NpbmdEaWZmRGlyZWN0aXZlIGltcGxlbWVudHMgT25Jbml0LCBPbkNoYW5nZXMge1xuICBASW5wdXQoKSBsZWZ0OiBzdHJpbmc7XG4gIEBJbnB1dCgpIHJpZ2h0OiBzdHJpbmc7XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgZWw6IEVsZW1lbnRSZWYsXG4gICAgcHJpdmF0ZSBkbXA6IERpZmZNYXRjaFBhdGNoU2VydmljZSkgeyAgfVxuXG4gIHB1YmxpYyBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLnVwZGF0ZUh0bWwoKTtcbiAgfVxuXG4gIHB1YmxpYyBuZ09uQ2hhbmdlcygpOiB2b2lkIHtcbiAgICB0aGlzLnVwZGF0ZUh0bWwoKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlSHRtbCgpOiB2b2lkIHtcbiAgICB0aGlzLmVsLm5hdGl2ZUVsZW1lbnQuaW5uZXJIVE1MID0gdGhpcy5jcmVhdGVIdG1sKFxuICAgICAgdGhpcy5kbXAuZ2V0UHJvY2Vzc2luZ0RpZmYodGhpcy5sZWZ0LCB0aGlzLnJpZ2h0KSk7XG4gIH1cblxuICAvLyBUT0RPOiBOZWVkIHRvIGZpeCB0aGlzIGZvciBsaW5lIGRpZmZzXG4gIHByaXZhdGUgY3JlYXRlSHRtbChkaWZmczogQXJyYXk8RGlmZj4pOiBzdHJpbmcge1xuICAgIGxldCBodG1sOiBzdHJpbmc7XG4gICAgaHRtbCA9ICc8ZGl2Pic7XG4gICAgZm9yIChsZXQgZGlmZiBvZiBkaWZmcykge1xuICAgICAgZGlmZlsxXSA9IGRpZmZbMV0ucmVwbGFjZSgvXFxuL2csICc8YnIvPicpO1xuXG4gICAgICBpZiAoZGlmZlswXSA9PT0gRGlmZk9wLkVxdWFsKSB7XG4gICAgICAgIGh0bWwgKz0gJzxzcGFuIGNsYXNzPVwiZXF1YWxcIj4nICsgZGlmZlsxXSArICc8L3NwYW4+JztcbiAgICAgIH1cbiAgICAgIGlmIChkaWZmWzBdID09PSBEaWZmT3AuRGVsZXRlKSB7XG4gICAgICAgIGh0bWwgKz0gJzxkZWw+JyArIGRpZmZbMV0gKyAnPC9kZWw+JztcbiAgICAgIH1cbiAgICAgIGlmIChkaWZmWzBdID09PSBEaWZmT3AuSW5zZXJ0KSB7XG4gICAgICAgIGh0bWwgKz0gJzxpbnM+JyArIGRpZmZbMV0gKyAnPC9pbnM+JztcbiAgICAgIH1cbiAgICB9XG4gICAgaHRtbCArPSAnPC9kaXY+JztcbiAgICByZXR1cm4gaHRtbDtcbiAgfVxufVxuIl19