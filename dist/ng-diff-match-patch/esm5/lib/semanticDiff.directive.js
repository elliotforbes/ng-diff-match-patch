/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import * as tslib_1 from "tslib";
import { Directive, ElementRef, Input } from '@angular/core';
import { DiffMatchPatchService } from './diffMatchPatch.service';
var SemanticDiffDirective = /** @class */ (function () {
    function SemanticDiffDirective(el, dmp) {
        this.el = el;
        this.dmp = dmp;
    }
    /**
     * @return {?}
     */
    SemanticDiffDirective.prototype.ngOnInit = /**
     * @return {?}
     */
    function () {
        this.updateHtml();
    };
    /**
     * @return {?}
     */
    SemanticDiffDirective.prototype.ngOnChanges = /**
     * @return {?}
     */
    function () {
        this.updateHtml();
    };
    /**
     * @return {?}
     */
    SemanticDiffDirective.prototype.updateHtml = /**
     * @return {?}
     */
    function () {
        if (!this.left) {
            this.left = "";
        }
        if (!this.right) {
            this.right = "";
        }
        if (typeof this.left === 'number' || typeof this.left === 'boolean') {
            this.left = this.left.toString();
        }
        if (typeof this.right === 'number' || typeof this.right === 'boolean') {
            this.right = this.right.toString();
        }
        this.el.nativeElement.innerHTML = this.createHtml(this.dmp.getSemanticDiff(this.left, this.right));
    };
    /**
     * @param {?} diffs
     * @return {?}
     */
    SemanticDiffDirective.prototype.createHtml = /**
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
    SemanticDiffDirective.decorators = [
        { type: Directive, args: [{
                    selector: '[semanticDiff]'
                },] },
    ];
    /** @nocollapse */
    SemanticDiffDirective.ctorParameters = function () { return [
        { type: ElementRef },
        { type: DiffMatchPatchService }
    ]; };
    SemanticDiffDirective.propDecorators = {
        left: [{ type: Input }],
        right: [{ type: Input }]
    };
    return SemanticDiffDirective;
}());
export { SemanticDiffDirective };
if (false) {
    /** @type {?} */
    SemanticDiffDirective.prototype.left;
    /** @type {?} */
    SemanticDiffDirective.prototype.right;
    /** @type {?} */
    SemanticDiffDirective.prototype.el;
    /** @type {?} */
    SemanticDiffDirective.prototype.dmp;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VtYW50aWNEaWZmLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiJuZzovL25nLWRpZmYtbWF0Y2gtcGF0Y2gvIiwic291cmNlcyI6WyJsaWIvc2VtYW50aWNEaWZmLmRpcmVjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBcUIsTUFBTSxlQUFlLENBQUM7QUFDaEYsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7O21DQVdyRCxJQUNBO1FBREEsT0FBRSxHQUFGLEVBQUU7UUFDRixRQUFHLEdBQUgsR0FBRzs7Ozs7SUFFTix3Q0FBUTs7OztRQUNiLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQzs7Ozs7SUFHYiwyQ0FBVzs7OztRQUNoQixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Ozs7O0lBR1osMENBQVU7Ozs7UUFDaEIsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNmLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1NBQ2hCO1FBQ0QsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNoQixJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztTQUNqQjtRQUNELEVBQUUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLElBQUksS0FBSyxRQUFRLElBQUksT0FBTyxJQUFJLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDcEUsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1NBQ2xDO1FBQ0QsRUFBRSxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsS0FBSyxLQUFLLFFBQVEsSUFBSSxPQUFPLElBQUksQ0FBQyxLQUFLLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztZQUN0RSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7U0FDcEM7UUFDRCxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FDL0MsSUFBSSxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQzs7Ozs7O0lBSTdDLDBDQUFVOzs7O2NBQUMsS0FBa0I7O1FBQ25DLElBQUksSUFBSSxDQUFTO1FBQ2pCLElBQUksR0FBRyxPQUFPLENBQUM7O1lBQ2YsR0FBRyxDQUFDLENBQWEsSUFBQSxVQUFBLGlCQUFBLEtBQUssQ0FBQSw0QkFBQTtnQkFBakIsSUFBSSxJQUFJLGtCQUFBO2dCQUNYLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFFMUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxrQkFBaUIsQ0FBQyxDQUFDLENBQUM7b0JBQzdCLElBQUksSUFBSSxzQkFBc0IsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDO2lCQUN0RDtnQkFDRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLG9CQUFrQixDQUFDLENBQUMsQ0FBQztvQkFDOUIsSUFBSSxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDO2lCQUN0QztnQkFDRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLG1CQUFrQixDQUFDLENBQUMsQ0FBQztvQkFDOUIsSUFBSSxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDO2lCQUN0QzthQUNGOzs7Ozs7Ozs7UUFDRCxJQUFJLElBQUksUUFBUSxDQUFDO1FBQ2pCLE1BQU0sQ0FBQyxJQUFJLENBQUM7Ozs7Z0JBdERmLFNBQVMsU0FBQztvQkFDVCxRQUFRLEVBQUUsZ0JBQWdCO2lCQUMzQjs7OztnQkFObUIsVUFBVTtnQkFDckIscUJBQXFCOzs7dUJBTzNCLEtBQUs7d0JBQ0wsS0FBSzs7Z0NBVFI7O1NBT2EscUJBQXFCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGlyZWN0aXZlLCBFbGVtZW50UmVmLCBJbnB1dCwgT25Jbml0LCBPbkNoYW5nZXMgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IERpZmZNYXRjaFBhdGNoU2VydmljZSB9IGZyb20gJy4vZGlmZk1hdGNoUGF0Y2guc2VydmljZSc7XG5pbXBvcnQgeyBEaWZmLCBEaWZmT3AgfSBmcm9tICcuL2RpZmZNYXRjaFBhdGNoJztcblxuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW3NlbWFudGljRGlmZl0nXG59KVxuZXhwb3J0IGNsYXNzIFNlbWFudGljRGlmZkRpcmVjdGl2ZSBpbXBsZW1lbnRzIE9uSW5pdCwgT25DaGFuZ2VzIHtcbiAgQElucHV0KCkgbGVmdDogc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbjtcbiAgQElucHV0KCkgcmlnaHQ6IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW47XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgZWw6IEVsZW1lbnRSZWYsXG4gICAgcHJpdmF0ZSBkbXA6IERpZmZNYXRjaFBhdGNoU2VydmljZSkgeyAgfVxuXG4gIHB1YmxpYyBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLnVwZGF0ZUh0bWwoKTtcbiAgfVxuXG4gIHB1YmxpYyBuZ09uQ2hhbmdlcygpOiB2b2lkIHtcbiAgICB0aGlzLnVwZGF0ZUh0bWwoKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlSHRtbCgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMubGVmdCkge1xuICAgICAgdGhpcy5sZWZ0ID0gXCJcIjtcbiAgICB9XG4gICAgaWYgKCF0aGlzLnJpZ2h0KSB7XG4gICAgICB0aGlzLnJpZ2h0ID0gXCJcIjtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB0aGlzLmxlZnQgPT09ICdudW1iZXInIHx8IHR5cGVvZiB0aGlzLmxlZnQgPT09ICdib29sZWFuJykge1xuICAgICAgdGhpcy5sZWZ0ID0gdGhpcy5sZWZ0LnRvU3RyaW5nKCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgdGhpcy5yaWdodCA9PT0gJ251bWJlcicgfHwgdHlwZW9mIHRoaXMucmlnaHQgPT09ICdib29sZWFuJykge1xuICAgICAgdGhpcy5yaWdodCA9IHRoaXMucmlnaHQudG9TdHJpbmcoKTtcbiAgICB9XG4gICAgdGhpcy5lbC5uYXRpdmVFbGVtZW50LmlubmVySFRNTCA9IHRoaXMuY3JlYXRlSHRtbChcbiAgICAgIHRoaXMuZG1wLmdldFNlbWFudGljRGlmZih0aGlzLmxlZnQsIHRoaXMucmlnaHQpKTtcbiAgfVxuXG4gIC8vIFRPRE86IE5lZWQgdG8gZml4IHRoaXMgZm9yIGxpbmUgZGlmZnNcbiAgcHJpdmF0ZSBjcmVhdGVIdG1sKGRpZmZzOiBBcnJheTxEaWZmPik6IHN0cmluZyB7XG4gICAgbGV0IGh0bWw6IHN0cmluZztcbiAgICBodG1sID0gJzxkaXY+JztcbiAgICBmb3IgKGxldCBkaWZmIG9mIGRpZmZzKSB7XG4gICAgICBkaWZmWzFdID0gZGlmZlsxXS5yZXBsYWNlKC9cXG4vZywgJzxici8+Jyk7XG5cbiAgICAgIGlmIChkaWZmWzBdID09PSBEaWZmT3AuRXF1YWwpIHtcbiAgICAgICAgaHRtbCArPSAnPHNwYW4gY2xhc3M9XCJlcXVhbFwiPicgKyBkaWZmWzFdICsgJzwvc3Bhbj4nO1xuICAgICAgfVxuICAgICAgaWYgKGRpZmZbMF0gPT09IERpZmZPcC5EZWxldGUpIHtcbiAgICAgICAgaHRtbCArPSAnPGRlbD4nICsgZGlmZlsxXSArICc8L2RlbD4nO1xuICAgICAgfVxuICAgICAgaWYgKGRpZmZbMF0gPT09IERpZmZPcC5JbnNlcnQpIHtcbiAgICAgICAgaHRtbCArPSAnPGlucz4nICsgZGlmZlsxXSArICc8L2lucz4nO1xuICAgICAgfVxuICAgIH1cbiAgICBodG1sICs9ICc8L2Rpdj4nO1xuICAgIHJldHVybiBodG1sO1xuICB9XG59XG4iXX0=