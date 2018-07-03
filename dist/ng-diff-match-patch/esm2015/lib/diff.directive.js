/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { Directive, ElementRef, Input } from '@angular/core';
import { DiffMatchPatchService } from './diffMatchPatch.service';
export class DiffDirective {
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
        this.el.nativeElement.innerHTML = this.createHtml(this.dmp.getDiff(this.left, this.right));
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
DiffDirective.decorators = [
    { type: Directive, args: [{
                selector: '[diff]'
            },] },
];
/** @nocollapse */
DiffDirective.ctorParameters = () => [
    { type: ElementRef },
    { type: DiffMatchPatchService }
];
DiffDirective.propDecorators = {
    left: [{ type: Input }],
    right: [{ type: Input }]
};
if (false) {
    /** @type {?} */
    DiffDirective.prototype.left;
    /** @type {?} */
    DiffDirective.prototype.right;
    /** @type {?} */
    DiffDirective.prototype.el;
    /** @type {?} */
    DiffDirective.prototype.dmp;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZi5kaXJlY3RpdmUuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZy1kaWZmLW1hdGNoLXBhdGNoLyIsInNvdXJjZXMiOlsibGliL2RpZmYuZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQXFCLE1BQU0sZUFBZSxDQUFDO0FBQ2hGLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBTWpFLE1BQU07Ozs7O2dCQU1NLElBQ0E7UUFEQSxPQUFFLEdBQUYsRUFBRTtRQUNGLFFBQUcsR0FBSCxHQUFHOzs7OztJQUVOLFFBQVE7UUFDYixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Ozs7O0lBR2IsV0FBVztRQUNoQixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Ozs7O0lBR1osVUFBVTtRQUNoQixJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FDL0MsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQzs7Ozs7O0lBR3JDLFVBQVUsQ0FBQyxLQUFrQjs7UUFDbkMsSUFBSSxJQUFJLENBQVM7UUFDakIsSUFBSSxHQUFHLE9BQU8sQ0FBQztRQUNmLEdBQUcsQ0FBQSxDQUFDLElBQUksSUFBSSxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDdEIsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRTFDLEVBQUUsQ0FBQSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsa0JBQWlCLENBQUMsQ0FBQyxDQUFDO2dCQUM1QixJQUFJLElBQUksc0JBQXNCLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQzthQUN0RDtZQUNELEVBQUUsQ0FBQSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsb0JBQWtCLENBQUMsQ0FBQyxDQUFDO2dCQUM3QixJQUFJLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUM7YUFDdEM7WUFDRCxFQUFFLENBQUEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLG1CQUFrQixDQUFDLENBQUMsQ0FBQztnQkFDN0IsSUFBSSxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDO2FBQ3RDO1NBQ0Y7UUFDRCxJQUFJLElBQUksUUFBUSxDQUFDO1FBQ2pCLE1BQU0sQ0FBQyxJQUFJLENBQUM7Ozs7WUExQ2YsU0FBUyxTQUFDO2dCQUNULFFBQVEsRUFBRSxRQUFRO2FBQ25COzs7O1lBTm1CLFVBQVU7WUFDckIscUJBQXFCOzs7bUJBUTNCLEtBQUs7b0JBQ0wsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERpcmVjdGl2ZSwgRWxlbWVudFJlZiwgSW5wdXQsIE9uSW5pdCwgT25DaGFuZ2VzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBEaWZmTWF0Y2hQYXRjaFNlcnZpY2UgfSBmcm9tICcuL2RpZmZNYXRjaFBhdGNoLnNlcnZpY2UnO1xuaW1wb3J0IHsgRGlmZiwgRGlmZk9wIH0gZnJvbSAnLi9kaWZmTWF0Y2hQYXRjaCc7XG5cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tkaWZmXSdcbn0pXG5leHBvcnQgY2xhc3MgRGlmZkRpcmVjdGl2ZSBpbXBsZW1lbnRzIE9uSW5pdCwgT25DaGFuZ2VzIHtcblxuICBASW5wdXQoKSBsZWZ0OiBzdHJpbmc7XG4gIEBJbnB1dCgpIHJpZ2h0OiBzdHJpbmc7XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgZWw6IEVsZW1lbnRSZWYsXG4gICAgcHJpdmF0ZSBkbXA6IERpZmZNYXRjaFBhdGNoU2VydmljZSkgeyAgfVxuXG4gIHB1YmxpYyBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLnVwZGF0ZUh0bWwoKTtcbiAgfVxuXG4gIHB1YmxpYyBuZ09uQ2hhbmdlcygpOiB2b2lkIHtcbiAgICB0aGlzLnVwZGF0ZUh0bWwoKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlSHRtbCgpOiB2b2lkIHtcbiAgICB0aGlzLmVsLm5hdGl2ZUVsZW1lbnQuaW5uZXJIVE1MID0gdGhpcy5jcmVhdGVIdG1sKFxuICAgICAgdGhpcy5kbXAuZ2V0RGlmZih0aGlzLmxlZnQsIHRoaXMucmlnaHQpKTtcbiAgfVxuICBcbiAgcHJpdmF0ZSBjcmVhdGVIdG1sKGRpZmZzOiBBcnJheTxEaWZmPik6IHN0cmluZyB7XG4gICAgbGV0IGh0bWw6IHN0cmluZztcbiAgICBodG1sID0gJzxkaXY+JztcbiAgICBmb3IobGV0IGRpZmYgb2YgZGlmZnMpIHtcbiAgICAgIGRpZmZbMV0gPSBkaWZmWzFdLnJlcGxhY2UoL1xcbi9nLCAnPGJyLz4nKTtcblxuICAgICAgaWYoZGlmZlswXSA9PT0gRGlmZk9wLkVxdWFsKSB7XG4gICAgICAgIGh0bWwgKz0gJzxzcGFuIGNsYXNzPVwiZXF1YWxcIj4nICsgZGlmZlsxXSArICc8L3NwYW4+JztcbiAgICAgIH1cbiAgICAgIGlmKGRpZmZbMF0gPT09IERpZmZPcC5EZWxldGUpIHtcbiAgICAgICAgaHRtbCArPSAnPGRlbD4nICsgZGlmZlsxXSArICc8L2RlbD4nO1xuICAgICAgfVxuICAgICAgaWYoZGlmZlswXSA9PT0gRGlmZk9wLkluc2VydCkge1xuICAgICAgICBodG1sICs9ICc8aW5zPicgKyBkaWZmWzFdICsgJzwvaW5zPic7XG4gICAgICB9XG4gICAgfVxuICAgIGh0bWwgKz0gJzwvZGl2Pic7XG4gICAgcmV0dXJuIGh0bWw7XG4gIH1cbn1cbiJdfQ==