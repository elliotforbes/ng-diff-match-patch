/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import * as tslib_1 from "tslib";
import { Component, Input } from '@angular/core';
import { DiffMatchPatchService } from './diffMatchPatch.service';
/** @typedef {?} */
var DiffCalculation;
var LineCompareComponent = /** @class */ (function () {
    function LineCompareComponent(dmp) {
        this.dmp = dmp;
        this.left = '';
        this.right = '';
    }
    /**
     * @return {?}
     */
    LineCompareComponent.prototype.ngOnInit = /**
     * @return {?}
     */
    function () {
        this.updateHtml();
    };
    /**
     * @return {?}
     */
    LineCompareComponent.prototype.ngOnChanges = /**
     * @return {?}
     */
    function () {
        this.updateHtml();
    };
    /**
     * @return {?}
     */
    LineCompareComponent.prototype.updateHtml = /**
     * @return {?}
     */
    function () {
        if (typeof this.left === 'number' || typeof this.left === 'boolean') {
            this.left = this.left.toString();
        }
        if (typeof this.right === 'number' || typeof this.right === 'boolean') {
            this.right = this.right.toString();
        }
        this.calculateLineDiff(this.dmp.getLineDiff(this.left, this.right));
    };
    /**
     * @param {?} diffs
     * @return {?}
     */
    LineCompareComponent.prototype.calculateLineDiff = /**
     * @param {?} diffs
     * @return {?}
     */
    function (diffs) {
        /** @type {?} */
        var diffCalculation = {
            lines: [],
            lineLeft: 1,
            lineRight: 1
        };
        this.isContentEqual = diffs.length === 1 && diffs[0][0] === 0 /* Equal */;
        if (this.isContentEqual) {
            this.calculatedDiff = [];
            return;
        }
        for (var i = 0; i < diffs.length; i++) {
            /** @type {?} */
            var diff = diffs[i];
            /** @type {?} */
            var diffLines = diff[1].split(/\r?\n/);
            // If the original line had a \r\n at the end then remove the
            // empty string after it.
            if (diffLines[diffLines.length - 1].length == 0) {
                diffLines.pop();
            }
            switch (diff[0]) {
                case 0 /* Equal */: {
                    /** @type {?} */
                    var isFirstDiff = i === 0;
                    /** @type {?} */
                    var isLastDiff = i === diffs.length - 1;
                    this.outputEqualDiff(diffLines, diffCalculation, isFirstDiff, isLastDiff);
                    break;
                }
                case -1 /* Delete */: {
                    this.outputDeleteDiff(diffLines, diffCalculation);
                    break;
                }
                case 1 /* Insert */: {
                    this.outputInsertDiff(diffLines, diffCalculation);
                    break;
                }
            }
        }
        this.calculatedDiff = diffCalculation.lines;
    };
    /**
     * @param {?} diffLines
     * @param {?} diffCalculation
     * @param {?} isFirstDiff
     * @param {?} isLastDiff
     * @return {?}
     */
    LineCompareComponent.prototype.outputEqualDiff = /**
     * @param {?} diffLines
     * @param {?} diffCalculation
     * @param {?} isFirstDiff
     * @param {?} isLastDiff
     * @return {?}
     */
    function (diffLines, diffCalculation, isFirstDiff, isLastDiff) {
        if (this.lineContextSize && diffLines.length > this.lineContextSize) {
            if (isFirstDiff) {
                /** @type {?} */
                var lineIncrement = diffLines.length - this.lineContextSize;
                diffCalculation.lineLeft += lineIncrement;
                diffCalculation.lineRight += lineIncrement;
                diffLines = diffLines.slice(diffLines.length - this.lineContextSize, diffLines.length);
            }
            else if (isLastDiff) {
                // Take only the first 'lineContextSize' lines from the final diff
                diffLines = diffLines.slice(0, this.lineContextSize);
            }
            else if (diffLines.length > 2 * this.lineContextSize) {
                // Take the first 'lineContextSize' lines from this diff to provide context for the last diff
                this.outputEqualDiffLines(diffLines.slice(0, this.lineContextSize), diffCalculation);
                // Output a special line indicating that some content is equal and has been skipped
                diffCalculation.lines.push(['dmp-line-compare-equal', '...', '...', '...']);
                /** @type {?} */
                var numberOfSkippedLines = diffLines.length - (2 * this.lineContextSize);
                diffCalculation.lineLeft += numberOfSkippedLines;
                diffCalculation.lineRight += numberOfSkippedLines;
                // Take the last 'lineContextSize' lines from this diff to provide context for the next diff
                this.outputEqualDiffLines(diffLines.slice(diffLines.length - this.lineContextSize), diffCalculation);
                // This if branch has already output the diff lines so we return early to avoid outputting the lines
                // at the end of the method.
                return;
            }
        }
        this.outputEqualDiffLines(diffLines, diffCalculation);
    };
    /**
     * @param {?} diffLines
     * @param {?} diffCalculation
     * @return {?}
     */
    LineCompareComponent.prototype.outputEqualDiffLines = /**
     * @param {?} diffLines
     * @param {?} diffCalculation
     * @return {?}
     */
    function (diffLines, diffCalculation) {
        try {
            for (var diffLines_1 = tslib_1.__values(diffLines), diffLines_1_1 = diffLines_1.next(); !diffLines_1_1.done; diffLines_1_1 = diffLines_1.next()) {
                var line = diffLines_1_1.value;
                diffCalculation.lines.push(['dmp-line-compare-equal', "" + diffCalculation.lineLeft, "" + diffCalculation.lineRight, line]);
                diffCalculation.lineLeft++;
                diffCalculation.lineRight++;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (diffLines_1_1 && !diffLines_1_1.done && (_a = diffLines_1.return)) _a.call(diffLines_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var e_1, _a;
    };
    /**
     * @param {?} diffLines
     * @param {?} diffCalculation
     * @return {?}
     */
    LineCompareComponent.prototype.outputDeleteDiff = /**
     * @param {?} diffLines
     * @param {?} diffCalculation
     * @return {?}
     */
    function (diffLines, diffCalculation) {
        try {
            for (var diffLines_2 = tslib_1.__values(diffLines), diffLines_2_1 = diffLines_2.next(); !diffLines_2_1.done; diffLines_2_1 = diffLines_2.next()) {
                var line = diffLines_2_1.value;
                diffCalculation.lines.push(['dmp-line-compare-delete', "" + diffCalculation.lineLeft, '-', line]);
                diffCalculation.lineLeft++;
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (diffLines_2_1 && !diffLines_2_1.done && (_a = diffLines_2.return)) _a.call(diffLines_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
        var e_2, _a;
    };
    /**
     * @param {?} diffLines
     * @param {?} diffCalculation
     * @return {?}
     */
    LineCompareComponent.prototype.outputInsertDiff = /**
     * @param {?} diffLines
     * @param {?} diffCalculation
     * @return {?}
     */
    function (diffLines, diffCalculation) {
        try {
            for (var diffLines_3 = tslib_1.__values(diffLines), diffLines_3_1 = diffLines_3.next(); !diffLines_3_1.done; diffLines_3_1 = diffLines_3.next()) {
                var line = diffLines_3_1.value;
                diffCalculation.lines.push(['dmp-line-compare-insert', '-', "" + diffCalculation.lineRight, line]);
                diffCalculation.lineRight++;
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (diffLines_3_1 && !diffLines_3_1.done && (_a = diffLines_3.return)) _a.call(diffLines_3);
            }
            finally { if (e_3) throw e_3.error; }
        }
        var e_3, _a;
    };
    LineCompareComponent.decorators = [
        { type: Component, args: [{
                    selector: 'dmp-line-compare',
                    styles: ["\n    div.dmp-line-compare {\n      display: flex;\n      flex-direction: row;\n      border: 1px solid #808080;\n      font-family: Consolas, Courier, monospace;\n      width: 911px;\n    }\n    div.dmp-line-compare-margin {\n      width: 101px;\n    }\n    div.dmp-line-compare-content {\n      position: relative;\n      top: 0px;\n      left: 0px;\n      flex-grow: 1;\n      overflow-x: scroll;\n    }\n    div.dmp-line-compare-content-wrapper {\n      position: absolute;\n      top: 0px;\n      left: 0px;\n      display: flex;\n      flex-direction: column;\n      align-items: stretch;\n    }\n    div.dmp-line-compare-left {\n      width: 50px;\n      text-align: center;\n      color: #484848;\n    }\n    div.dmp-line-compare-equal>div.dmp-line-compare-left,\n      div.dmp-line-compare-equal>div.dmp-line-compare-right {\n      background-color: #dedede;\n    }\n    div.dmp-line-compare-insert>div.dmp-line-compare-left,\n      div.dmp-line-compare-insert>div.dmp-line-compare-right {\n      background-color: #8bfb6f;\n    }\n    div.dmp-line-compare-delete>div.dmp-line-compare-left,\n      div.dmp-line-compare-delete>div.dmp-line-compare-right {\n      background-color: #f56868;\n    }\n    div.dmp-line-compare-right {\n      width: 50px;\n      text-align: center;\n      color: #484848;\n      border-right: 1px solid #888888;\n    }\n    div.dmp-line-compare-text {\n      white-space: pre;\n      padding-left: 10px;\n      min-width: 800px;\n    }\n    .dmp-line-compare-delete {\n      background-color: #ff8c8c;\n    }\n    .dmp-line-compare-insert {\n      background-color: #9dff97;\n    }\n    .dmp-line-compare-delete>div {\n      display: inline-block;\n    }  \n    .dmp-line-compare-insert>div {\n      display: inline-block;\n    }\n    .dmp-line-compare-equal>div {\n      display: inline-block;\n    }\n    .dmp-margin-bottom-spacer {\n      height: 20px;\n      background-color: #dedede;\n      border-right: 1px solid #888888;\n    }\n  "],
                    template: "\n    <div class=\"dmp-line-compare-no-changes-text\" *ngIf=\"isContentEqual\">\n      There are no changes to display.\n    </div>    \n    <div class=\"dmp-line-compare\" *ngIf=\"!isContentEqual\">\n      <div class=\"dmp-line-compare-margin\">\n        <div [ngClass]=\"lineDiff[0]\" *ngFor=\"let lineDiff of calculatedDiff\">\n          <div class=\"dmp-line-compare-left\">{{lineDiff[1]}}</div><!-- No space\n        --><div class=\"dmp-line-compare-right\">{{lineDiff[2]}}</div>\n        </div>\n        <div class=\"dmp-margin-bottom-spacer\"></div>\n      </div><!-- No space\n   --><div class=\"dmp-line-compare-content\">\n        <div class=\"dmp-line-compare-content-wrapper\">\n          <div [ngClass]=\"lineDiff[0]\" *ngFor=\"let lineDiff of calculatedDiff\">\n            <div class=\"dmp-line-compare-text\">{{lineDiff[3]}}</div>\n          </div>\n        </div>\n      </div>\n    </div>\n  "
                },] },
    ];
    /** @nocollapse */
    LineCompareComponent.ctorParameters = function () { return [
        { type: DiffMatchPatchService }
    ]; };
    LineCompareComponent.propDecorators = {
        left: [{ type: Input }],
        right: [{ type: Input }],
        lineContextSize: [{ type: Input }]
    };
    return LineCompareComponent;
}());
export { LineCompareComponent };
if (false) {
    /** @type {?} */
    LineCompareComponent.prototype.left;
    /** @type {?} */
    LineCompareComponent.prototype.right;
    /** @type {?} */
    LineCompareComponent.prototype.lineContextSize;
    /** @type {?} */
    LineCompareComponent.prototype.calculatedDiff;
    /** @type {?} */
    LineCompareComponent.prototype.isContentEqual;
    /** @type {?} */
    LineCompareComponent.prototype.dmp;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZUNvbXBhcmUuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6Im5nOi8vbmctZGlmZi1tYXRjaC1wYXRjaC8iLCJzb3VyY2VzIjpbImxpYi9saW5lQ29tcGFyZS5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBcUIsTUFBTSxlQUFlLENBQUM7QUFFcEUsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7Ozs7a0NBOEhuRDtRQUFBLFFBQUcsR0FBSCxHQUFHO29CQVowQixFQUFFO3FCQUVELEVBQUU7Ozs7O0lBWXJDLHVDQUFROzs7O1FBQ2IsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDOzs7OztJQUdiLDBDQUFXOzs7O1FBQ2hCLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQzs7Ozs7SUFHWix5Q0FBVTs7OztRQUNoQixFQUFFLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxJQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQ3BFLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztTQUNsQztRQUNELEVBQUUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssS0FBSyxRQUFRLElBQUksT0FBTyxJQUFJLENBQUMsS0FBSyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDdEUsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1NBQ3BDO1FBQ0QsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Ozs7OztJQUc5RCxnREFBaUI7Ozs7Y0FBQyxLQUFrQjs7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QUFDO2FBQzdCOzs7Ozs7Ozs7Ozs7Ozs7O0lBR0ssK0NBQWdCOzs7OztjQUNwQixTQUFtQixFQUNuQixlQUFnQzs7WUFDbEMsR0FBRyxDQUFDLENBQWUsSUFBQSxjQUFBLGlCQUFBLFNBQVMsQ0FBQSxvQ0FBQTtnQkFBdkIsSUFBTSxJQUFJLHNCQUFBO2dCQUNiLGVBQWUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMseUJBQXlCLEVBQUUsS0FBRyxlQUFlLENBQUMsUUFBVSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNsRyxlQUFlLENBQUMsUUFBUSxFQUFFLENBQUM7YUFDNUI7Ozs7Ozs7Ozs7Ozs7Ozs7SUFHSywrQ0FBZ0I7Ozs7O2NBQ3BCLFNBQW1CLEVBQ25CLGVBQWdDOztZQUNsQyxHQUFHLENBQUMsQ0FBZSxJQUFBLGNBQUEsaUJBQUEsU0FBUyxDQUFBLG9DQUFBO2dCQUF2QixJQUFNLElBQUksc0JBQUE7Z0JBQ2IsZUFBZSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLEVBQUUsS0FBRyxlQUFlLENBQUMsU0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ25HLGVBQWUsQ0FBQyxTQUFTLEVBQUUsQ0FBQzthQUM3Qjs7Ozs7Ozs7Ozs7O2dCQTdQSixTQUFTLFNBQUM7b0JBQ1QsUUFBUSxFQUFFLGtCQUFrQjtvQkFDNUIsTUFBTSxFQUFFLENBQUMsMjdEQTBFUixDQUFDO29CQUNGLFFBQVEsRUFBRSxnNUJBb0JUO2lCQUNGOzs7O2dCQS9HUSxxQkFBcUI7Ozt1QkFpSDNCLEtBQUs7d0JBRUwsS0FBSztrQ0FJTCxLQUFLOzsrQkF6SFI7O1NBa0hhLG9CQUFvQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgSW5wdXQsIE9uSW5pdCwgT25DaGFuZ2VzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7IERpZmYsIERpZmZPcCB9IGZyb20gJy4vZGlmZk1hdGNoUGF0Y2gnO1xyXG5pbXBvcnQgeyBEaWZmTWF0Y2hQYXRjaFNlcnZpY2UgfSBmcm9tICcuL2RpZmZNYXRjaFBhdGNoLnNlcnZpY2UnO1xyXG5cclxuLyogSG9sZHMgdGhlIHN0YXRlIG9mIHRoZSBjYWxjdWxhdGlvbiBvZiB0aGUgZGlmZiByZXN1bHQgd2UgaW50ZW5kIHRvIGRpc3BsYXkuXHJcbiAqICA+IGxpbmVzIGNvbnRhaW5zIHRoZSBkYXRhIHRoYXQgd2lsbCBiZSBkaXNwbGF5ZWQgb24gc2NyZWVuLlxyXG4gKiAgPiBsaW5lTGVmdCBrZWVwcyB0cmFjayBvZiB0aGUgZG9jdW1lbnQgbGluZSBudW1iZXIgaW4gdGhlIFtsZWZ0XSBpbnB1dC5cclxuICogID4gbGluZVJpZ2h0IGtlZXBzIHRyYWNrIG9mIHRoZSBkb2N1bWVudCBsaW5lIG51bWJlciBpbiB0aGUgW3JpZ2h0XSBpbnB1dC5cclxuICovXHJcbnR5cGUgRGlmZkNhbGN1bGF0aW9uID0ge1xyXG4gIGxpbmVzOiBBcnJheTxbc3RyaW5nLCBzdHJpbmcsIHN0cmluZywgc3RyaW5nXT4sXHJcbiAgbGluZUxlZnQ6IG51bWJlcixcclxuICBsaW5lUmlnaHQ6IG51bWJlclxyXG59O1xyXG5cclxuQENvbXBvbmVudCh7XHJcbiAgc2VsZWN0b3I6ICdkbXAtbGluZS1jb21wYXJlJyxcclxuICBzdHlsZXM6IFtgXHJcbiAgICBkaXYuZG1wLWxpbmUtY29tcGFyZSB7XHJcbiAgICAgIGRpc3BsYXk6IGZsZXg7XHJcbiAgICAgIGZsZXgtZGlyZWN0aW9uOiByb3c7XHJcbiAgICAgIGJvcmRlcjogMXB4IHNvbGlkICM4MDgwODA7XHJcbiAgICAgIGZvbnQtZmFtaWx5OiBDb25zb2xhcywgQ291cmllciwgbW9ub3NwYWNlO1xyXG4gICAgICB3aWR0aDogOTExcHg7XHJcbiAgICB9XHJcbiAgICBkaXYuZG1wLWxpbmUtY29tcGFyZS1tYXJnaW4ge1xyXG4gICAgICB3aWR0aDogMTAxcHg7XHJcbiAgICB9XHJcbiAgICBkaXYuZG1wLWxpbmUtY29tcGFyZS1jb250ZW50IHtcclxuICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xyXG4gICAgICB0b3A6IDBweDtcclxuICAgICAgbGVmdDogMHB4O1xyXG4gICAgICBmbGV4LWdyb3c6IDE7XHJcbiAgICAgIG92ZXJmbG93LXg6IHNjcm9sbDtcclxuICAgIH1cclxuICAgIGRpdi5kbXAtbGluZS1jb21wYXJlLWNvbnRlbnQtd3JhcHBlciB7XHJcbiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcclxuICAgICAgdG9wOiAwcHg7XHJcbiAgICAgIGxlZnQ6IDBweDtcclxuICAgICAgZGlzcGxheTogZmxleDtcclxuICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcclxuICAgICAgYWxpZ24taXRlbXM6IHN0cmV0Y2g7XHJcbiAgICB9XHJcbiAgICBkaXYuZG1wLWxpbmUtY29tcGFyZS1sZWZ0IHtcclxuICAgICAgd2lkdGg6IDUwcHg7XHJcbiAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcclxuICAgICAgY29sb3I6ICM0ODQ4NDg7XHJcbiAgICB9XHJcbiAgICBkaXYuZG1wLWxpbmUtY29tcGFyZS1lcXVhbD5kaXYuZG1wLWxpbmUtY29tcGFyZS1sZWZ0LFxyXG4gICAgICBkaXYuZG1wLWxpbmUtY29tcGFyZS1lcXVhbD5kaXYuZG1wLWxpbmUtY29tcGFyZS1yaWdodCB7XHJcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICNkZWRlZGU7XHJcbiAgICB9XHJcbiAgICBkaXYuZG1wLWxpbmUtY29tcGFyZS1pbnNlcnQ+ZGl2LmRtcC1saW5lLWNvbXBhcmUtbGVmdCxcclxuICAgICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtaW5zZXJ0PmRpdi5kbXAtbGluZS1jb21wYXJlLXJpZ2h0IHtcclxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzhiZmI2ZjtcclxuICAgIH1cclxuICAgIGRpdi5kbXAtbGluZS1jb21wYXJlLWRlbGV0ZT5kaXYuZG1wLWxpbmUtY29tcGFyZS1sZWZ0LFxyXG4gICAgICBkaXYuZG1wLWxpbmUtY29tcGFyZS1kZWxldGU+ZGl2LmRtcC1saW5lLWNvbXBhcmUtcmlnaHQge1xyXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjU2ODY4O1xyXG4gICAgfVxyXG4gICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtcmlnaHQge1xyXG4gICAgICB3aWR0aDogNTBweDtcclxuICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xyXG4gICAgICBjb2xvcjogIzQ4NDg0ODtcclxuICAgICAgYm9yZGVyLXJpZ2h0OiAxcHggc29saWQgIzg4ODg4ODtcclxuICAgIH1cclxuICAgIGRpdi5kbXAtbGluZS1jb21wYXJlLXRleHQge1xyXG4gICAgICB3aGl0ZS1zcGFjZTogcHJlO1xyXG4gICAgICBwYWRkaW5nLWxlZnQ6IDEwcHg7XHJcbiAgICAgIG1pbi13aWR0aDogODAwcHg7XHJcbiAgICB9XHJcbiAgICAuZG1wLWxpbmUtY29tcGFyZS1kZWxldGUge1xyXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmY4YzhjO1xyXG4gICAgfVxyXG4gICAgLmRtcC1saW5lLWNvbXBhcmUtaW5zZXJ0IHtcclxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzlkZmY5NztcclxuICAgIH1cclxuICAgIC5kbXAtbGluZS1jb21wYXJlLWRlbGV0ZT5kaXYge1xyXG4gICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XHJcbiAgICB9ICBcclxuICAgIC5kbXAtbGluZS1jb21wYXJlLWluc2VydD5kaXYge1xyXG4gICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XHJcbiAgICB9XHJcbiAgICAuZG1wLWxpbmUtY29tcGFyZS1lcXVhbD5kaXYge1xyXG4gICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XHJcbiAgICB9XHJcbiAgICAuZG1wLW1hcmdpbi1ib3R0b20tc3BhY2VyIHtcclxuICAgICAgaGVpZ2h0OiAyMHB4O1xyXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZGVkZWRlO1xyXG4gICAgICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCAjODg4ODg4O1xyXG4gICAgfVxyXG4gIGBdLFxyXG4gIHRlbXBsYXRlOiBgXHJcbiAgICA8ZGl2IGNsYXNzPVwiZG1wLWxpbmUtY29tcGFyZS1uby1jaGFuZ2VzLXRleHRcIiAqbmdJZj1cImlzQ29udGVudEVxdWFsXCI+XHJcbiAgICAgIFRoZXJlIGFyZSBubyBjaGFuZ2VzIHRvIGRpc3BsYXkuXHJcbiAgICA8L2Rpdj4gICAgXHJcbiAgICA8ZGl2IGNsYXNzPVwiZG1wLWxpbmUtY29tcGFyZVwiICpuZ0lmPVwiIWlzQ29udGVudEVxdWFsXCI+XHJcbiAgICAgIDxkaXYgY2xhc3M9XCJkbXAtbGluZS1jb21wYXJlLW1hcmdpblwiPlxyXG4gICAgICAgIDxkaXYgW25nQ2xhc3NdPVwibGluZURpZmZbMF1cIiAqbmdGb3I9XCJsZXQgbGluZURpZmYgb2YgY2FsY3VsYXRlZERpZmZcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJkbXAtbGluZS1jb21wYXJlLWxlZnRcIj57e2xpbmVEaWZmWzFdfX08L2Rpdj48IS0tIE5vIHNwYWNlXHJcbiAgICAgICAgLS0+PGRpdiBjbGFzcz1cImRtcC1saW5lLWNvbXBhcmUtcmlnaHRcIj57e2xpbmVEaWZmWzJdfX08L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8ZGl2IGNsYXNzPVwiZG1wLW1hcmdpbi1ib3R0b20tc3BhY2VyXCI+PC9kaXY+XHJcbiAgICAgIDwvZGl2PjwhLS0gTm8gc3BhY2VcclxuICAgLS0+PGRpdiBjbGFzcz1cImRtcC1saW5lLWNvbXBhcmUtY29udGVudFwiPlxyXG4gICAgICAgIDxkaXYgY2xhc3M9XCJkbXAtbGluZS1jb21wYXJlLWNvbnRlbnQtd3JhcHBlclwiPlxyXG4gICAgICAgICAgPGRpdiBbbmdDbGFzc109XCJsaW5lRGlmZlswXVwiICpuZ0Zvcj1cImxldCBsaW5lRGlmZiBvZiBjYWxjdWxhdGVkRGlmZlwiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZG1wLWxpbmUtY29tcGFyZS10ZXh0XCI+e3tsaW5lRGlmZlszXX19PC9kaXY+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgPC9kaXY+XHJcbiAgICA8L2Rpdj5cclxuICBgXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBMaW5lQ29tcGFyZUNvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCwgT25DaGFuZ2VzIHtcclxuICBASW5wdXQoKVxyXG4gIHB1YmxpYyBsZWZ0OiBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuID0gJyc7XHJcbiAgQElucHV0KClcclxuICBwdWJsaWMgcmlnaHQ6IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4gPSAnJztcclxuICAvLyBUaGUgbnVtYmVyIG9mIGxpbmVzIG9mIGNvbnRleHQgdG8gcHJvdmlkZSBlaXRoZXIgc2lkZSBvZiBhIERpZmZPcC5JbnNlcnQgb3IgRGlmZk9wLkRlbGV0ZSBkaWZmLlxyXG4gIC8vIENvbnRleHQgaXMgdGFrZW4gZnJvbSBhIERpZmZPcC5FcXVhbCBzZWN0aW9uLlxyXG4gIEBJbnB1dCgpXHJcbiAgcHVibGljIGxpbmVDb250ZXh0U2l6ZTogbnVtYmVyO1xyXG5cclxuICBwdWJsaWMgY2FsY3VsYXRlZERpZmY6IEFycmF5PFtzdHJpbmcsIHN0cmluZywgc3RyaW5nLCBzdHJpbmddPjtcclxuICBwdWJsaWMgaXNDb250ZW50RXF1YWw6IGJvb2xlYW47XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihcclxuICAgICAgcHJpdmF0ZSBkbXA6IERpZmZNYXRjaFBhdGNoU2VydmljZSkge31cclxuXHJcbiAgcHVibGljIG5nT25Jbml0KCk6IHZvaWQge1xyXG4gICAgdGhpcy51cGRhdGVIdG1sKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgbmdPbkNoYW5nZXMoKTogdm9pZCB7XHJcbiAgICB0aGlzLnVwZGF0ZUh0bWwoKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgdXBkYXRlSHRtbCgpOiB2b2lkIHtcclxuICAgIGlmICh0eXBlb2YgdGhpcy5sZWZ0ID09PSAnbnVtYmVyJyB8fCB0eXBlb2YgdGhpcy5sZWZ0ID09PSAnYm9vbGVhbicpIHtcclxuICAgICAgdGhpcy5sZWZ0ID0gdGhpcy5sZWZ0LnRvU3RyaW5nKCk7XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHRoaXMucmlnaHQgPT09ICdudW1iZXInIHx8IHR5cGVvZiB0aGlzLnJpZ2h0ID09PSAnYm9vbGVhbicpIHtcclxuICAgICAgdGhpcy5yaWdodCA9IHRoaXMucmlnaHQudG9TdHJpbmcoKTtcclxuICAgIH1cclxuICAgIHRoaXMuY2FsY3VsYXRlTGluZURpZmYodGhpcy5kbXAuZ2V0TGluZURpZmYodGhpcy5sZWZ0LCB0aGlzLnJpZ2h0KSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGNhbGN1bGF0ZUxpbmVEaWZmKGRpZmZzOiBBcnJheTxEaWZmPik6IHZvaWQge1xyXG4gICAgY29uc3QgZGlmZkNhbGN1bGF0aW9uOiBEaWZmQ2FsY3VsYXRpb24gPSB7XHJcbiAgICAgIGxpbmVzOiBbXSxcclxuICAgICAgbGluZUxlZnQ6IDEsXHJcbiAgICAgIGxpbmVSaWdodDogMVxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmlzQ29udGVudEVxdWFsID0gZGlmZnMubGVuZ3RoID09PSAxICYmIGRpZmZzWzBdWzBdID09PSBEaWZmT3AuRXF1YWw7XHJcbiAgICBpZiAodGhpcy5pc0NvbnRlbnRFcXVhbCkge1xyXG4gICAgICB0aGlzLmNhbGN1bGF0ZWREaWZmID0gW107XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpZmZzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IGRpZmYgPSBkaWZmc1tpXTtcclxuICAgICAgbGV0IGRpZmZMaW5lczogc3RyaW5nW10gPSBkaWZmWzFdLnNwbGl0KC9cXHI/XFxuLyk7XHJcblxyXG4gICAgICAvLyBJZiB0aGUgb3JpZ2luYWwgbGluZSBoYWQgYSBcXHJcXG4gYXQgdGhlIGVuZCB0aGVuIHJlbW92ZSB0aGVcclxuICAgICAgLy8gZW1wdHkgc3RyaW5nIGFmdGVyIGl0LlxyXG4gICAgICBpZiAoZGlmZkxpbmVzW2RpZmZMaW5lcy5sZW5ndGggLSAxXS5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgIGRpZmZMaW5lcy5wb3AoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgc3dpdGNoIChkaWZmWzBdKSB7XHJcbiAgICAgICAgY2FzZSBEaWZmT3AuRXF1YWw6IHtcclxuICAgICAgICAgIGNvbnN0IGlzRmlyc3REaWZmID0gaSA9PT0gMDtcclxuICAgICAgICAgIGNvbnN0IGlzTGFzdERpZmYgPSBpID09PSBkaWZmcy5sZW5ndGggLSAxO1xyXG4gICAgICAgICAgdGhpcy5vdXRwdXRFcXVhbERpZmYoZGlmZkxpbmVzLCBkaWZmQ2FsY3VsYXRpb24sIGlzRmlyc3REaWZmLCBpc0xhc3REaWZmKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXNlIERpZmZPcC5EZWxldGU6IHtcclxuICAgICAgICAgIHRoaXMub3V0cHV0RGVsZXRlRGlmZihkaWZmTGluZXMsIGRpZmZDYWxjdWxhdGlvbik7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgICAgY2FzZSBEaWZmT3AuSW5zZXJ0OiB7XHJcbiAgICAgICAgICB0aGlzLm91dHB1dEluc2VydERpZmYoZGlmZkxpbmVzLCBkaWZmQ2FsY3VsYXRpb24pO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5jYWxjdWxhdGVkRGlmZiA9IGRpZmZDYWxjdWxhdGlvbi5saW5lcztcclxuICB9XHJcblxyXG4gIC8qIElmIHRoZSBudW1iZXIgb2YgZGlmZkxpbmVzIGlzIGdyZWF0ZXIgdGhhbiBsaW5lQ29udGV4dFNpemUgdGhlbiB3ZSBtYXkgbmVlZCB0byBhZGp1c3QgdGhlIGRpZmZcclxuICAgKiB0aGF0IGlzIG91dHB1dC5cclxuICAgKiAgID4gSWYgdGhlIGZpcnN0IGRpZmYgb2YgYSBkb2N1bWVudCBpcyBEaWZmT3AuRXF1YWwgdGhlbiB0aGUgbGVhZGluZyBsaW5lcyBjYW4gYmUgZHJvcHBlZFxyXG4gICAqICAgICBsZWF2aW5nIHRoZSBsYXN0ICdsaW5lQ29udGV4dFNpemUnIGxpbmVzIGZvciBjb250ZXh0LlxyXG4gICAqICAgPiBJZiB0aGUgbGFzdCBkaWZmIG9mIGEgZG9jdW1lbnQgaXMgRGlmZk9wLkVxdWFsIHRoZW4gdGhlIHRyYWlsaW5nIGxpbmVzIGNhbiBiZSBkcm9wcGVkXHJcbiAgICogICAgIGxlYXZpbmcgdGhlIGZpcnN0ICdsaW5lQ29udGV4dFNpemUnIGxpbmVzIGZvciBjb250ZXh0LlxyXG4gICAqICAgPiBJZiB0aGUgZGlmZiBpcyBhIERpZmZPcC5FcXVhbCBvY2N1cnMgaW4gdGhlIG1pZGRsZSB0aGVuIHRoZSBkaWZmcyBlaXRoZXIgc2lkZSBvZiBpdCBtdXN0IGJlXHJcbiAgICogICAgIERpZmZPcC5JbnNlcnQgb3IgRGlmZk9wLkRlbGV0ZS4gSWYgaXQgaGFzIG1vcmUgdGhhbiAyICogJ2xpbmVDb250ZXh0U2l6ZScgbGluZXMgb2YgY29udGVudFxyXG4gICAqICAgICB0aGVuIHRoZSBtaWRkbGUgbGluZXMgYXJlIGRyb3BwZWQgbGVhdmluZyB0aGUgZmlyc3QgJ2xpbmVDb250ZXh0U2l6ZScgYW5kIGxhc3QgJ2xpbmVDb250ZXh0U2l6ZSdcclxuICAgKiAgICAgbGluZXMgZm9yIGNvbnRleHQuIEEgc3BlY2lhbCBsaW5lIGlzIGluc2VydGVkIHdpdGggJy4uLicgaW5kaWNhdGluZyB0aGF0IGNvbnRlbnQgaXMgc2tpcHBlZC5cclxuICAgKlxyXG4gICAqIEEgZG9jdW1lbnQgY2Fubm90IGNvbnNpc3Qgb2YgYSBzaW5nbGUgRGlmZiB3aXRoIERpZmZPcC5FcXVhbCBhbmQgcmVhY2ggdGhpcyBmdW5jdGlvbiBiZWNhdXNlXHJcbiAgICogaW4gdGhpcyBjYXNlIHRoZSBjYWxjdWxhdGVMaW5lRGlmZiBtZXRob2QgcmV0dXJucyBlYXJseS5cclxuICAgKi9cclxuICBwcml2YXRlIG91dHB1dEVxdWFsRGlmZihcclxuICAgICAgZGlmZkxpbmVzOiBzdHJpbmdbXSxcclxuICAgICAgZGlmZkNhbGN1bGF0aW9uOiBEaWZmQ2FsY3VsYXRpb24sXHJcbiAgICAgIGlzRmlyc3REaWZmOiBib29sZWFuLFxyXG4gICAgICBpc0xhc3REaWZmOiBib29sZWFuKTogdm9pZCB7XHJcbiAgICBpZiAodGhpcy5saW5lQ29udGV4dFNpemUgJiYgZGlmZkxpbmVzLmxlbmd0aCA+IHRoaXMubGluZUNvbnRleHRTaXplKSB7XHJcbiAgICAgIGlmIChpc0ZpcnN0RGlmZikge1xyXG4gICAgICAgIC8vIFRha2UgdGhlIGxhc3QgJ2xpbmVDb250ZXh0U2l6ZScgbGluZXMgZnJvbSB0aGUgZmlyc3QgZGlmZlxyXG4gICAgICAgIGNvbnN0IGxpbmVJbmNyZW1lbnQgPSBkaWZmTGluZXMubGVuZ3RoIC0gdGhpcy5saW5lQ29udGV4dFNpemU7XHJcbiAgICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVMZWZ0ICs9IGxpbmVJbmNyZW1lbnQ7XHJcbiAgICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVSaWdodCArPSBsaW5lSW5jcmVtZW50O1xyXG4gICAgICAgIGRpZmZMaW5lcyA9IGRpZmZMaW5lcy5zbGljZShkaWZmTGluZXMubGVuZ3RoIC0gdGhpcy5saW5lQ29udGV4dFNpemUsIGRpZmZMaW5lcy5sZW5ndGgpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKGlzTGFzdERpZmYpIHtcclxuICAgICAgICAvLyBUYWtlIG9ubHkgdGhlIGZpcnN0ICdsaW5lQ29udGV4dFNpemUnIGxpbmVzIGZyb20gdGhlIGZpbmFsIGRpZmZcclxuICAgICAgICBkaWZmTGluZXMgPSBkaWZmTGluZXMuc2xpY2UoMCwgdGhpcy5saW5lQ29udGV4dFNpemUpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKGRpZmZMaW5lcy5sZW5ndGggPiAyICogdGhpcy5saW5lQ29udGV4dFNpemUpIHtcclxuICAgICAgICAvLyBUYWtlIHRoZSBmaXJzdCAnbGluZUNvbnRleHRTaXplJyBsaW5lcyBmcm9tIHRoaXMgZGlmZiB0byBwcm92aWRlIGNvbnRleHQgZm9yIHRoZSBsYXN0IGRpZmZcclxuICAgICAgICB0aGlzLm91dHB1dEVxdWFsRGlmZkxpbmVzKGRpZmZMaW5lcy5zbGljZSgwLCB0aGlzLmxpbmVDb250ZXh0U2l6ZSksIGRpZmZDYWxjdWxhdGlvbik7XHJcblxyXG4gICAgICAgIC8vIE91dHB1dCBhIHNwZWNpYWwgbGluZSBpbmRpY2F0aW5nIHRoYXQgc29tZSBjb250ZW50IGlzIGVxdWFsIGFuZCBoYXMgYmVlbiBza2lwcGVkXHJcbiAgICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVzLnB1c2goWydkbXAtbGluZS1jb21wYXJlLWVxdWFsJywgJy4uLicsICcuLi4nLCAnLi4uJ10pO1xyXG4gICAgICAgIGNvbnN0IG51bWJlck9mU2tpcHBlZExpbmVzID0gZGlmZkxpbmVzLmxlbmd0aCAtICgyICogdGhpcy5saW5lQ29udGV4dFNpemUpO1xyXG4gICAgICAgIGRpZmZDYWxjdWxhdGlvbi5saW5lTGVmdCArPSBudW1iZXJPZlNraXBwZWRMaW5lcztcclxuICAgICAgICBkaWZmQ2FsY3VsYXRpb24ubGluZVJpZ2h0ICs9IG51bWJlck9mU2tpcHBlZExpbmVzO1xyXG5cclxuICAgICAgICAvLyBUYWtlIHRoZSBsYXN0ICdsaW5lQ29udGV4dFNpemUnIGxpbmVzIGZyb20gdGhpcyBkaWZmIHRvIHByb3ZpZGUgY29udGV4dCBmb3IgdGhlIG5leHQgZGlmZlxyXG4gICAgICAgIHRoaXMub3V0cHV0RXF1YWxEaWZmTGluZXMoZGlmZkxpbmVzLnNsaWNlKGRpZmZMaW5lcy5sZW5ndGggLSB0aGlzLmxpbmVDb250ZXh0U2l6ZSksIGRpZmZDYWxjdWxhdGlvbik7XHJcbiAgICAgICAgLy8gVGhpcyBpZiBicmFuY2ggaGFzIGFscmVhZHkgb3V0cHV0IHRoZSBkaWZmIGxpbmVzIHNvIHdlIHJldHVybiBlYXJseSB0byBhdm9pZCBvdXRwdXR0aW5nIHRoZSBsaW5lc1xyXG4gICAgICAgIC8vIGF0IHRoZSBlbmQgb2YgdGhlIG1ldGhvZC5cclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMub3V0cHV0RXF1YWxEaWZmTGluZXMoZGlmZkxpbmVzLCBkaWZmQ2FsY3VsYXRpb24pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBvdXRwdXRFcXVhbERpZmZMaW5lcyhcclxuICAgICAgZGlmZkxpbmVzOiBzdHJpbmdbXSxcclxuICAgICAgZGlmZkNhbGN1bGF0aW9uOiBEaWZmQ2FsY3VsYXRpb24pOiB2b2lkIHtcclxuICAgIGZvciAoY29uc3QgbGluZSBvZiBkaWZmTGluZXMpIHtcclxuICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVzLnB1c2goWydkbXAtbGluZS1jb21wYXJlLWVxdWFsJywgYCR7ZGlmZkNhbGN1bGF0aW9uLmxpbmVMZWZ0fWAsIGAke2RpZmZDYWxjdWxhdGlvbi5saW5lUmlnaHR9YCwgbGluZV0pO1xyXG4gICAgICBkaWZmQ2FsY3VsYXRpb24ubGluZUxlZnQrKztcclxuICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVSaWdodCsrO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBvdXRwdXREZWxldGVEaWZmKFxyXG4gICAgICBkaWZmTGluZXM6IHN0cmluZ1tdLFxyXG4gICAgICBkaWZmQ2FsY3VsYXRpb246IERpZmZDYWxjdWxhdGlvbik6IHZvaWQge1xyXG4gICAgZm9yIChjb25zdCBsaW5lIG9mIGRpZmZMaW5lcykge1xyXG4gICAgICBkaWZmQ2FsY3VsYXRpb24ubGluZXMucHVzaChbJ2RtcC1saW5lLWNvbXBhcmUtZGVsZXRlJywgYCR7ZGlmZkNhbGN1bGF0aW9uLmxpbmVMZWZ0fWAsICctJywgbGluZV0pO1xyXG4gICAgICBkaWZmQ2FsY3VsYXRpb24ubGluZUxlZnQrKztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgb3V0cHV0SW5zZXJ0RGlmZihcclxuICAgICAgZGlmZkxpbmVzOiBzdHJpbmdbXSxcclxuICAgICAgZGlmZkNhbGN1bGF0aW9uOiBEaWZmQ2FsY3VsYXRpb24pOiB2b2lkIHtcclxuICAgIGZvciAoY29uc3QgbGluZSBvZiBkaWZmTGluZXMpIHtcclxuICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVzLnB1c2goWydkbXAtbGluZS1jb21wYXJlLWluc2VydCcsICctJywgYCR7ZGlmZkNhbGN1bGF0aW9uLmxpbmVSaWdodH1gLCBsaW5lXSk7XHJcbiAgICAgIGRpZmZDYWxjdWxhdGlvbi5saW5lUmlnaHQrKztcclxuICAgIH1cclxuICB9XHJcbn1cclxuIl19