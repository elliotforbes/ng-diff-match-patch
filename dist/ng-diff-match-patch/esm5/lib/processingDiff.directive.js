/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import * as tslib_1 from "tslib";
import { Directive, ElementRef, Input } from '@angular/core';
import { DiffMatchPatchService } from './diffMatchPatch.service';
var ProcessingDiffDirective = /** @class */ (function () {
    function ProcessingDiffDirective(el, dmp) {
        this.el = el;
        this.dmp = dmp;
    }
    /**
     * @return {?}
     */
    ProcessingDiffDirective.prototype.ngOnInit = /**
     * @return {?}
     */
    function () {
        this.updateHtml();
    };
    /**
     * @return {?}
     */
    ProcessingDiffDirective.prototype.ngOnChanges = /**
     * @return {?}
     */
    function () {
        this.updateHtml();
    };
    /**
     * @return {?}
     */
    ProcessingDiffDirective.prototype.updateHtml = /**
     * @return {?}
     */
    function () {
        this.el.nativeElement.innerHTML = this.createHtml(this.dmp.getProcessingDiff(this.left, this.right));
    };
    /**
     * @param {?} diffs
     * @return {?}
     */
    ProcessingDiffDirective.prototype.createHtml = /**
     * @param {?} diffs
     * @return {?}
     */
    function (diffs) {
        /** @type {?} */
        var html;
        html = '<div>';
        try {
            for (var diffs_1 = tslib_1.__values(diffs), diffs_1_1 = diffs_1.next(); !diffs_1_1.done; diffs_1_1 = diffs_1.next()) {
                var diff = diffs_1_1.value;
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
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (diffs_1_1 && !diffs_1_1.done && (_a = diffs_1.return)) _a.call(diffs_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        html += '</div>';
        return html;
        var e_1, _a;
    };
    ProcessingDiffDirective.decorators = [
        { type: Directive, args: [{
                    selector: '[processingDiff]'
                },] },
    ];
    /** @nocollapse */
    ProcessingDiffDirective.ctorParameters = function () { return [
        { type: ElementRef },
        { type: DiffMatchPatchService }
    ]; };
    ProcessingDiffDirective.propDecorators = {
        left: [{ type: Input }],
        right: [{ type: Input }]
    };
    return ProcessingDiffDirective;
}());
export { ProcessingDiffDirective };
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvY2Vzc2luZ0RpZmYuZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vbmctZGlmZi1tYXRjaC1wYXRjaC8iLCJzb3VyY2VzIjpbImxpYi9wcm9jZXNzaW5nRGlmZi5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQXFCLE1BQU0sZUFBZSxDQUFDO0FBQ2hGLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLDBCQUEwQixDQUFDOztxQ0FXckQsSUFDQTtRQURBLE9BQUUsR0FBRixFQUFFO1FBQ0YsUUFBRyxHQUFILEdBQUc7Ozs7O0lBRU4sMENBQVE7Ozs7UUFDYixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Ozs7O0lBR2IsNkNBQVc7Ozs7UUFDaEIsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDOzs7OztJQUdaLDRDQUFVOzs7O1FBQ2hCLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUMvQyxJQUFJLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Ozs7OztJQUkvQyw0Q0FBVTs7OztjQUFDLEtBQWtCOztRQUNuQyxJQUFJLElBQUksQ0FBUztRQUNqQixJQUFJLEdBQUcsT0FBTyxDQUFDOztZQUNmLEdBQUcsQ0FBQyxDQUFhLElBQUEsVUFBQSxpQkFBQSxLQUFLLENBQUEsNEJBQUE7Z0JBQWpCLElBQUksSUFBSSxrQkFBQTtnQkFDWCxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBRTFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsa0JBQWlCLENBQUMsQ0FBQyxDQUFDO29CQUM3QixJQUFJLElBQUksc0JBQXNCLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQztpQkFDdEQ7Z0JBQ0QsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxvQkFBa0IsQ0FBQyxDQUFDLENBQUM7b0JBQzlCLElBQUksSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQztpQkFDdEM7Z0JBQ0QsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxtQkFBa0IsQ0FBQyxDQUFDLENBQUM7b0JBQzlCLElBQUksSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQztpQkFDdEM7YUFDRjs7Ozs7Ozs7O1FBQ0QsSUFBSSxJQUFJLFFBQVEsQ0FBQztRQUNqQixNQUFNLENBQUMsSUFBSSxDQUFDOzs7O2dCQTFDZixTQUFTLFNBQUM7b0JBQ1QsUUFBUSxFQUFFLGtCQUFrQjtpQkFDN0I7Ozs7Z0JBTm1CLFVBQVU7Z0JBQ3JCLHFCQUFxQjs7O3VCQU8zQixLQUFLO3dCQUNMLEtBQUs7O2tDQVRSOztTQU9hLHVCQUF1QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERpcmVjdGl2ZSwgRWxlbWVudFJlZiwgSW5wdXQsIE9uSW5pdCwgT25DaGFuZ2VzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBEaWZmTWF0Y2hQYXRjaFNlcnZpY2UgfSBmcm9tICcuL2RpZmZNYXRjaFBhdGNoLnNlcnZpY2UnO1xuaW1wb3J0IHsgRGlmZiwgRGlmZk9wIH0gZnJvbSAnLi9kaWZmTWF0Y2hQYXRjaCc7XG5cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1twcm9jZXNzaW5nRGlmZl0nXG59KVxuZXhwb3J0IGNsYXNzIFByb2Nlc3NpbmdEaWZmRGlyZWN0aXZlIGltcGxlbWVudHMgT25Jbml0LCBPbkNoYW5nZXMge1xuICBASW5wdXQoKSBsZWZ0OiBzdHJpbmc7XG4gIEBJbnB1dCgpIHJpZ2h0OiBzdHJpbmc7XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgZWw6IEVsZW1lbnRSZWYsXG4gICAgcHJpdmF0ZSBkbXA6IERpZmZNYXRjaFBhdGNoU2VydmljZSkgeyAgfVxuXG4gIHB1YmxpYyBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLnVwZGF0ZUh0bWwoKTtcbiAgfVxuXG4gIHB1YmxpYyBuZ09uQ2hhbmdlcygpOiB2b2lkIHtcbiAgICB0aGlzLnVwZGF0ZUh0bWwoKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlSHRtbCgpOiB2b2lkIHtcbiAgICB0aGlzLmVsLm5hdGl2ZUVsZW1lbnQuaW5uZXJIVE1MID0gdGhpcy5jcmVhdGVIdG1sKFxuICAgICAgdGhpcy5kbXAuZ2V0UHJvY2Vzc2luZ0RpZmYodGhpcy5sZWZ0LCB0aGlzLnJpZ2h0KSk7XG4gIH1cblxuICAvLyBUT0RPOiBOZWVkIHRvIGZpeCB0aGlzIGZvciBsaW5lIGRpZmZzXG4gIHByaXZhdGUgY3JlYXRlSHRtbChkaWZmczogQXJyYXk8RGlmZj4pOiBzdHJpbmcge1xuICAgIGxldCBodG1sOiBzdHJpbmc7XG4gICAgaHRtbCA9ICc8ZGl2Pic7XG4gICAgZm9yIChsZXQgZGlmZiBvZiBkaWZmcykge1xuICAgICAgZGlmZlsxXSA9IGRpZmZbMV0ucmVwbGFjZSgvXFxuL2csICc8YnIvPicpO1xuXG4gICAgICBpZiAoZGlmZlswXSA9PT0gRGlmZk9wLkVxdWFsKSB7XG4gICAgICAgIGh0bWwgKz0gJzxzcGFuIGNsYXNzPVwiZXF1YWxcIj4nICsgZGlmZlsxXSArICc8L3NwYW4+JztcbiAgICAgIH1cbiAgICAgIGlmIChkaWZmWzBdID09PSBEaWZmT3AuRGVsZXRlKSB7XG4gICAgICAgIGh0bWwgKz0gJzxkZWw+JyArIGRpZmZbMV0gKyAnPC9kZWw+JztcbiAgICAgIH1cbiAgICAgIGlmIChkaWZmWzBdID09PSBEaWZmT3AuSW5zZXJ0KSB7XG4gICAgICAgIGh0bWwgKz0gJzxpbnM+JyArIGRpZmZbMV0gKyAnPC9pbnM+JztcbiAgICAgIH1cbiAgICB9XG4gICAgaHRtbCArPSAnPC9kaXY+JztcbiAgICByZXR1cm4gaHRtbDtcbiAgfVxufVxuIl19