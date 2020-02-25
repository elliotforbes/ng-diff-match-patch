/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import * as tslib_1 from "tslib";
import { Directive, ElementRef, Input } from '@angular/core';
import { DiffMatchPatchService } from './diffMatchPatch.service';
var DiffDirective = /** @class */ (function () {
    function DiffDirective(el, dmp) {
        this.el = el;
        this.dmp = dmp;
        this.left = '';
        this.right = '';
    }
    /**
     * @return {?}
     */
    DiffDirective.prototype.ngOnInit = /**
     * @return {?}
     */
    function () {
        this.updateHtml();
    };
    /**
     * @return {?}
     */
    DiffDirective.prototype.ngOnChanges = /**
     * @return {?}
     */
    function () {
        this.updateHtml();
    };
    /**
     * @return {?}
     */
    DiffDirective.prototype.updateHtml = /**
     * @return {?}
     */
    function () {
        this.el.nativeElement.innerHTML = this.createHtml(this.dmp.getDiff(this.left, this.right));
    };
    /**
     * @param {?} diffs
     * @return {?}
     */
    DiffDirective.prototype.createHtml = /**
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
    DiffDirective.decorators = [
        { type: Directive, args: [{
                    selector: '[diff]'
                },] },
    ];
    /** @nocollapse */
    DiffDirective.ctorParameters = function () { return [
        { type: ElementRef },
        { type: DiffMatchPatchService }
    ]; };
    DiffDirective.propDecorators = {
        left: [{ type: Input }],
        right: [{ type: Input }]
    };
    return DiffDirective;
}());
export { DiffDirective };
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZi5kaXJlY3RpdmUuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZy1kaWZmLW1hdGNoLXBhdGNoLyIsInNvdXJjZXMiOlsibGliL2RpZmYuZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsT0FBTyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFxQixNQUFNLGVBQWUsQ0FBQztBQUNoRixPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQzs7MkJBWXJELElBQ0E7UUFEQSxPQUFFLEdBQUYsRUFBRTtRQUNGLFFBQUcsR0FBSCxHQUFHO29CQUxXLEVBQUU7cUJBQ0QsRUFBRTs7Ozs7SUFNcEIsZ0NBQVE7Ozs7UUFDYixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Ozs7O0lBR2IsbUNBQVc7Ozs7UUFDaEIsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDOzs7OztJQUdaLGtDQUFVOzs7O1FBQ2hCLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUMvQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDOzs7Ozs7SUFHckMsa0NBQVU7Ozs7Y0FBQyxLQUFrQjs7UUFDbkMsSUFBSSxJQUFJLENBQVM7UUFDakIsSUFBSSxHQUFHLE9BQU8sQ0FBQzs7WUFDZixHQUFHLENBQUEsQ0FBYSxJQUFBLFVBQUEsaUJBQUEsS0FBSyxDQUFBLDRCQUFBO2dCQUFqQixJQUFJLElBQUksa0JBQUE7Z0JBQ1YsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUUxQyxFQUFFLENBQUEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGtCQUFpQixDQUFDLENBQUMsQ0FBQztvQkFDNUIsSUFBSSxJQUFJLHNCQUFzQixHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUM7aUJBQ3REO2dCQUNELEVBQUUsQ0FBQSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsb0JBQWtCLENBQUMsQ0FBQyxDQUFDO29CQUM3QixJQUFJLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUM7aUJBQ3RDO2dCQUNELEVBQUUsQ0FBQSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsbUJBQWtCLENBQUMsQ0FBQyxDQUFDO29CQUM3QixJQUFJLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUM7aUJBQ3RDO2FBQ0Y7Ozs7Ozs7OztRQUNELElBQUksSUFBSSxRQUFRLENBQUM7UUFDakIsTUFBTSxDQUFDLElBQUksQ0FBQzs7OztnQkExQ2YsU0FBUyxTQUFDO29CQUNULFFBQVEsRUFBRSxRQUFRO2lCQUNuQjs7OztnQkFObUIsVUFBVTtnQkFDckIscUJBQXFCOzs7dUJBUTNCLEtBQUs7d0JBQ0wsS0FBSzs7d0JBVlI7O1NBT2EsYUFBYSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERpcmVjdGl2ZSwgRWxlbWVudFJlZiwgSW5wdXQsIE9uSW5pdCwgT25DaGFuZ2VzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7IERpZmZNYXRjaFBhdGNoU2VydmljZSB9IGZyb20gJy4vZGlmZk1hdGNoUGF0Y2guc2VydmljZSc7XHJcbmltcG9ydCB7IERpZmYsIERpZmZPcCB9IGZyb20gJy4vZGlmZk1hdGNoUGF0Y2gnO1xyXG5cclxuQERpcmVjdGl2ZSh7XHJcbiAgc2VsZWN0b3I6ICdbZGlmZl0nXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBEaWZmRGlyZWN0aXZlIGltcGxlbWVudHMgT25Jbml0LCBPbkNoYW5nZXMge1xyXG5cclxuICBASW5wdXQoKSBsZWZ0OiBzdHJpbmcgPSAnJztcclxuICBASW5wdXQoKSByaWdodDogc3RyaW5nID0gJyc7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihcclxuICAgIHByaXZhdGUgZWw6IEVsZW1lbnRSZWYsXHJcbiAgICBwcml2YXRlIGRtcDogRGlmZk1hdGNoUGF0Y2hTZXJ2aWNlKSB7ICB9XHJcblxyXG4gIHB1YmxpYyBuZ09uSW5pdCgpOiB2b2lkIHtcclxuICAgIHRoaXMudXBkYXRlSHRtbCgpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG5nT25DaGFuZ2VzKCk6IHZvaWQge1xyXG4gICAgdGhpcy51cGRhdGVIdG1sKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHVwZGF0ZUh0bWwoKTogdm9pZCB7XHJcbiAgICB0aGlzLmVsLm5hdGl2ZUVsZW1lbnQuaW5uZXJIVE1MID0gdGhpcy5jcmVhdGVIdG1sKFxyXG4gICAgICB0aGlzLmRtcC5nZXREaWZmKHRoaXMubGVmdCwgdGhpcy5yaWdodCkpO1xyXG4gIH1cclxuICBcclxuICBwcml2YXRlIGNyZWF0ZUh0bWwoZGlmZnM6IEFycmF5PERpZmY+KTogc3RyaW5nIHtcclxuICAgIGxldCBodG1sOiBzdHJpbmc7XHJcbiAgICBodG1sID0gJzxkaXY+JztcclxuICAgIGZvcihsZXQgZGlmZiBvZiBkaWZmcykge1xyXG4gICAgICBkaWZmWzFdID0gZGlmZlsxXS5yZXBsYWNlKC9cXG4vZywgJzxici8+Jyk7XHJcblxyXG4gICAgICBpZihkaWZmWzBdID09PSBEaWZmT3AuRXF1YWwpIHtcclxuICAgICAgICBodG1sICs9ICc8c3BhbiBjbGFzcz1cImVxdWFsXCI+JyArIGRpZmZbMV0gKyAnPC9zcGFuPic7XHJcbiAgICAgIH1cclxuICAgICAgaWYoZGlmZlswXSA9PT0gRGlmZk9wLkRlbGV0ZSkge1xyXG4gICAgICAgIGh0bWwgKz0gJzxkZWw+JyArIGRpZmZbMV0gKyAnPC9kZWw+JztcclxuICAgICAgfVxyXG4gICAgICBpZihkaWZmWzBdID09PSBEaWZmT3AuSW5zZXJ0KSB7XHJcbiAgICAgICAgaHRtbCArPSAnPGlucz4nICsgZGlmZlsxXSArICc8L2lucz4nO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBodG1sICs9ICc8L2Rpdj4nO1xyXG4gICAgcmV0dXJuIGh0bWw7XHJcbiAgfVxyXG59XHJcbiJdfQ==