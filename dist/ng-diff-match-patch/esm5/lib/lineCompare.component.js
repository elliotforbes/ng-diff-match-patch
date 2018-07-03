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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZUNvbXBhcmUuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6Im5nOi8vbmctZGlmZi1tYXRjaC1wYXRjaC8iLCJzb3VyY2VzIjpbImxpYi9saW5lQ29tcGFyZS5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBcUIsTUFBTSxlQUFlLENBQUM7QUFFcEUsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7Ozs7a0NBOEhuRDtRQUFBLFFBQUcsR0FBSCxHQUFHOzs7OztJQUVSLHVDQUFROzs7O1FBQ2IsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDOzs7OztJQUdiLDBDQUFXOzs7O1FBQ2hCLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQzs7Ozs7SUFHWix5Q0FBVTs7OztRQUNoQixFQUFFLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxJQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQ3BFLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztTQUNsQztRQUNELEVBQUUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssS0FBSyxRQUFRLElBQUksT0FBTyxJQUFJLENBQUMsS0FBSyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDdEUsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1NBQ3BDO1FBQ0QsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Ozs7OztJQUc5RCxnREFBaUI7Ozs7Y0FBQyxLQUFrQjs7UUFDMUMsSUFBTSxlQUFlLEdBQW9CO1lB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O0lBR0ssK0NBQWdCOzs7OztjQUNwQixTQUFtQixFQUNuQixlQUFnQzs7WUFDbEMsR0FBRyxDQUFDLENBQWUsSUFBQSxjQUFBLGlCQUFBLFNBQVMsQ0FBQSxvQ0FBQTtnQkFBdkIsSUFBTSxJQUFJLHNCQUFBO2dCQUNiLGVBQWUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMseUJBQXlCLEVBQUUsS0FBRyxlQUFlLENBQUMsUUFBVSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNsRyxlQUFlLENBQUMsUUFBUSxFQUFFLENBQUM7YUFDNUI7Ozs7Ozs7Ozs7Ozs7Ozs7SUFHSywrQ0FBZ0I7Ozs7O2NBQ3BCLFNBQW1CLEVBQ25CLGVBQWdDOztZQUNsQyxHQUFHLENBQUMsQ0FBZSxJQUFBLGNBQUEsaUJBQUEsU0FBUyxDQUFBLG9DQUFBO2dCQUF2QixJQUFNLElBQUksc0JBQUE7Z0JBQ2IsZUFBZSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLEVBQUUsS0FBRyxlQUFlLENBQUMsU0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ25HLGVBQWUsQ0FBQyxTQUFTLEVBQUUsQ0FBQzthQUM3Qjs7Ozs7Ozs7Ozs7O2dCQTdQSixTQUFTLFNBQUM7b0JBQ1QsUUFBUSxFQUFFLGtCQUFrQjtvQkFDNUIsTUFBTSxFQUFFLENBQUMsMjdEQTBFUixDQUFDO29CQUNGLFFBQVEsRUFBRSxnNUJBb0JUO2lCQUNGOzs7O2dCQS9HUSxxQkFBcUI7Ozt1QkFpSDNCLEtBQUs7d0JBRUwsS0FBSztrQ0FJTCxLQUFLOzsrQkF6SFI7O1NBa0hhLG9CQUFvQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgSW5wdXQsIE9uSW5pdCwgT25DaGFuZ2VzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBEaWZmLCBEaWZmT3AgfSBmcm9tICcuL2RpZmZNYXRjaFBhdGNoJztcbmltcG9ydCB7IERpZmZNYXRjaFBhdGNoU2VydmljZSB9IGZyb20gJy4vZGlmZk1hdGNoUGF0Y2guc2VydmljZSc7XG5cbi8qIEhvbGRzIHRoZSBzdGF0ZSBvZiB0aGUgY2FsY3VsYXRpb24gb2YgdGhlIGRpZmYgcmVzdWx0IHdlIGludGVuZCB0byBkaXNwbGF5LlxuICogID4gbGluZXMgY29udGFpbnMgdGhlIGRhdGEgdGhhdCB3aWxsIGJlIGRpc3BsYXllZCBvbiBzY3JlZW4uXG4gKiAgPiBsaW5lTGVmdCBrZWVwcyB0cmFjayBvZiB0aGUgZG9jdW1lbnQgbGluZSBudW1iZXIgaW4gdGhlIFtsZWZ0XSBpbnB1dC5cbiAqICA+IGxpbmVSaWdodCBrZWVwcyB0cmFjayBvZiB0aGUgZG9jdW1lbnQgbGluZSBudW1iZXIgaW4gdGhlIFtyaWdodF0gaW5wdXQuXG4gKi9cbnR5cGUgRGlmZkNhbGN1bGF0aW9uID0ge1xuICBsaW5lczogQXJyYXk8W3N0cmluZywgc3RyaW5nLCBzdHJpbmcsIHN0cmluZ10+LFxuICBsaW5lTGVmdDogbnVtYmVyLFxuICBsaW5lUmlnaHQ6IG51bWJlclxufTtcblxuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAnZG1wLWxpbmUtY29tcGFyZScsXG4gIHN0eWxlczogW2BcbiAgICBkaXYuZG1wLWxpbmUtY29tcGFyZSB7XG4gICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgZmxleC1kaXJlY3Rpb246IHJvdztcbiAgICAgIGJvcmRlcjogMXB4IHNvbGlkICM4MDgwODA7XG4gICAgICBmb250LWZhbWlseTogQ29uc29sYXMsIENvdXJpZXIsIG1vbm9zcGFjZTtcbiAgICAgIHdpZHRoOiA5MTFweDtcbiAgICB9XG4gICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtbWFyZ2luIHtcbiAgICAgIHdpZHRoOiAxMDFweDtcbiAgICB9XG4gICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtY29udGVudCB7XG4gICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgICB0b3A6IDBweDtcbiAgICAgIGxlZnQ6IDBweDtcbiAgICAgIGZsZXgtZ3JvdzogMTtcbiAgICAgIG92ZXJmbG93LXg6IHNjcm9sbDtcbiAgICB9XG4gICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtY29udGVudC13cmFwcGVyIHtcbiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgIHRvcDogMHB4O1xuICAgICAgbGVmdDogMHB4O1xuICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICBhbGlnbi1pdGVtczogc3RyZXRjaDtcbiAgICB9XG4gICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtbGVmdCB7XG4gICAgICB3aWR0aDogNTBweDtcbiAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgIGNvbG9yOiAjNDg0ODQ4O1xuICAgIH1cbiAgICBkaXYuZG1wLWxpbmUtY29tcGFyZS1lcXVhbD5kaXYuZG1wLWxpbmUtY29tcGFyZS1sZWZ0LFxuICAgICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtZXF1YWw+ZGl2LmRtcC1saW5lLWNvbXBhcmUtcmlnaHQge1xuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2RlZGVkZTtcbiAgICB9XG4gICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtaW5zZXJ0PmRpdi5kbXAtbGluZS1jb21wYXJlLWxlZnQsXG4gICAgICBkaXYuZG1wLWxpbmUtY29tcGFyZS1pbnNlcnQ+ZGl2LmRtcC1saW5lLWNvbXBhcmUtcmlnaHQge1xuICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzhiZmI2ZjtcbiAgICB9XG4gICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtZGVsZXRlPmRpdi5kbXAtbGluZS1jb21wYXJlLWxlZnQsXG4gICAgICBkaXYuZG1wLWxpbmUtY29tcGFyZS1kZWxldGU+ZGl2LmRtcC1saW5lLWNvbXBhcmUtcmlnaHQge1xuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2Y1Njg2ODtcbiAgICB9XG4gICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtcmlnaHQge1xuICAgICAgd2lkdGg6IDUwcHg7XG4gICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgICBjb2xvcjogIzQ4NDg0ODtcbiAgICAgIGJvcmRlci1yaWdodDogMXB4IHNvbGlkICM4ODg4ODg7XG4gICAgfVxuICAgIGRpdi5kbXAtbGluZS1jb21wYXJlLXRleHQge1xuICAgICAgd2hpdGUtc3BhY2U6IHByZTtcbiAgICAgIHBhZGRpbmctbGVmdDogMTBweDtcbiAgICAgIG1pbi13aWR0aDogODAwcHg7XG4gICAgfVxuICAgIC5kbXAtbGluZS1jb21wYXJlLWRlbGV0ZSB7XG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmY4YzhjO1xuICAgIH1cbiAgICAuZG1wLWxpbmUtY29tcGFyZS1pbnNlcnQge1xuICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzlkZmY5NztcbiAgICB9XG4gICAgLmRtcC1saW5lLWNvbXBhcmUtZGVsZXRlPmRpdiB7XG4gICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gICAgfSAgXG4gICAgLmRtcC1saW5lLWNvbXBhcmUtaW5zZXJ0PmRpdiB7XG4gICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gICAgfVxuICAgIC5kbXAtbGluZS1jb21wYXJlLWVxdWFsPmRpdiB7XG4gICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gICAgfVxuICAgIC5kbXAtbWFyZ2luLWJvdHRvbS1zcGFjZXIge1xuICAgICAgaGVpZ2h0OiAyMHB4O1xuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2RlZGVkZTtcbiAgICAgIGJvcmRlci1yaWdodDogMXB4IHNvbGlkICM4ODg4ODg7XG4gICAgfVxuICBgXSxcbiAgdGVtcGxhdGU6IGBcbiAgICA8ZGl2IGNsYXNzPVwiZG1wLWxpbmUtY29tcGFyZS1uby1jaGFuZ2VzLXRleHRcIiAqbmdJZj1cImlzQ29udGVudEVxdWFsXCI+XG4gICAgICBUaGVyZSBhcmUgbm8gY2hhbmdlcyB0byBkaXNwbGF5LlxuICAgIDwvZGl2PiAgICBcbiAgICA8ZGl2IGNsYXNzPVwiZG1wLWxpbmUtY29tcGFyZVwiICpuZ0lmPVwiIWlzQ29udGVudEVxdWFsXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiZG1wLWxpbmUtY29tcGFyZS1tYXJnaW5cIj5cbiAgICAgICAgPGRpdiBbbmdDbGFzc109XCJsaW5lRGlmZlswXVwiICpuZ0Zvcj1cImxldCBsaW5lRGlmZiBvZiBjYWxjdWxhdGVkRGlmZlwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJkbXAtbGluZS1jb21wYXJlLWxlZnRcIj57e2xpbmVEaWZmWzFdfX08L2Rpdj48IS0tIE5vIHNwYWNlXG4gICAgICAgIC0tPjxkaXYgY2xhc3M9XCJkbXAtbGluZS1jb21wYXJlLXJpZ2h0XCI+e3tsaW5lRGlmZlsyXX19PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZG1wLW1hcmdpbi1ib3R0b20tc3BhY2VyXCI+PC9kaXY+XG4gICAgICA8L2Rpdj48IS0tIE5vIHNwYWNlXG4gICAtLT48ZGl2IGNsYXNzPVwiZG1wLWxpbmUtY29tcGFyZS1jb250ZW50XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJkbXAtbGluZS1jb21wYXJlLWNvbnRlbnQtd3JhcHBlclwiPlxuICAgICAgICAgIDxkaXYgW25nQ2xhc3NdPVwibGluZURpZmZbMF1cIiAqbmdGb3I9XCJsZXQgbGluZURpZmYgb2YgY2FsY3VsYXRlZERpZmZcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJkbXAtbGluZS1jb21wYXJlLXRleHRcIj57e2xpbmVEaWZmWzNdfX08L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgYFxufSlcbmV4cG9ydCBjbGFzcyBMaW5lQ29tcGFyZUNvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCwgT25DaGFuZ2VzIHtcbiAgQElucHV0KClcbiAgcHVibGljIGxlZnQ6IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW47XG4gIEBJbnB1dCgpXG4gIHB1YmxpYyByaWdodDogc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbjtcbiAgLy8gVGhlIG51bWJlciBvZiBsaW5lcyBvZiBjb250ZXh0IHRvIHByb3ZpZGUgZWl0aGVyIHNpZGUgb2YgYSBEaWZmT3AuSW5zZXJ0IG9yIERpZmZPcC5EZWxldGUgZGlmZi5cbiAgLy8gQ29udGV4dCBpcyB0YWtlbiBmcm9tIGEgRGlmZk9wLkVxdWFsIHNlY3Rpb24uXG4gIEBJbnB1dCgpXG4gIHB1YmxpYyBsaW5lQ29udGV4dFNpemU6IG51bWJlcjtcblxuICBwdWJsaWMgY2FsY3VsYXRlZERpZmY6IEFycmF5PFtzdHJpbmcsIHN0cmluZywgc3RyaW5nLCBzdHJpbmddPjtcbiAgcHVibGljIGlzQ29udGVudEVxdWFsOiBib29sZWFuO1xuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgZG1wOiBEaWZmTWF0Y2hQYXRjaFNlcnZpY2UpIHt9XG5cbiAgcHVibGljIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMudXBkYXRlSHRtbCgpO1xuICB9XG5cbiAgcHVibGljIG5nT25DaGFuZ2VzKCk6IHZvaWQge1xuICAgIHRoaXMudXBkYXRlSHRtbCgpO1xuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVIdG1sKCk6IHZvaWQge1xuICAgIGlmICh0eXBlb2YgdGhpcy5sZWZ0ID09PSAnbnVtYmVyJyB8fCB0eXBlb2YgdGhpcy5sZWZ0ID09PSAnYm9vbGVhbicpIHtcbiAgICAgIHRoaXMubGVmdCA9IHRoaXMubGVmdC50b1N0cmluZygpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHRoaXMucmlnaHQgPT09ICdudW1iZXInIHx8IHR5cGVvZiB0aGlzLnJpZ2h0ID09PSAnYm9vbGVhbicpIHtcbiAgICAgIHRoaXMucmlnaHQgPSB0aGlzLnJpZ2h0LnRvU3RyaW5nKCk7XG4gICAgfVxuICAgIHRoaXMuY2FsY3VsYXRlTGluZURpZmYodGhpcy5kbXAuZ2V0TGluZURpZmYodGhpcy5sZWZ0LCB0aGlzLnJpZ2h0KSk7XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZUxpbmVEaWZmKGRpZmZzOiBBcnJheTxEaWZmPik6IHZvaWQge1xuICAgIGNvbnN0IGRpZmZDYWxjdWxhdGlvbjogRGlmZkNhbGN1bGF0aW9uID0ge1xuICAgICAgbGluZXM6IFtdLFxuICAgICAgbGluZUxlZnQ6IDEsXG4gICAgICBsaW5lUmlnaHQ6IDFcbiAgICB9O1xuXG4gICAgdGhpcy5pc0NvbnRlbnRFcXVhbCA9IGRpZmZzLmxlbmd0aCA9PT0gMSAmJiBkaWZmc1swXVswXSA9PT0gRGlmZk9wLkVxdWFsO1xuICAgIGlmICh0aGlzLmlzQ29udGVudEVxdWFsKSB7XG4gICAgICB0aGlzLmNhbGN1bGF0ZWREaWZmID0gW107XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaWZmcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGlmZiA9IGRpZmZzW2ldO1xuICAgICAgbGV0IGRpZmZMaW5lczogc3RyaW5nW10gPSBkaWZmWzFdLnNwbGl0KC9cXHI/XFxuLyk7XG5cbiAgICAgIC8vIElmIHRoZSBvcmlnaW5hbCBsaW5lIGhhZCBhIFxcclxcbiBhdCB0aGUgZW5kIHRoZW4gcmVtb3ZlIHRoZVxuICAgICAgLy8gZW1wdHkgc3RyaW5nIGFmdGVyIGl0LlxuICAgICAgaWYgKGRpZmZMaW5lc1tkaWZmTGluZXMubGVuZ3RoIC0gMV0ubGVuZ3RoID09IDApIHtcbiAgICAgICAgZGlmZkxpbmVzLnBvcCgpO1xuICAgICAgfVxuXG4gICAgICBzd2l0Y2ggKGRpZmZbMF0pIHtcbiAgICAgICAgY2FzZSBEaWZmT3AuRXF1YWw6IHtcbiAgICAgICAgICBjb25zdCBpc0ZpcnN0RGlmZiA9IGkgPT09IDA7XG4gICAgICAgICAgY29uc3QgaXNMYXN0RGlmZiA9IGkgPT09IGRpZmZzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgdGhpcy5vdXRwdXRFcXVhbERpZmYoZGlmZkxpbmVzLCBkaWZmQ2FsY3VsYXRpb24sIGlzRmlyc3REaWZmLCBpc0xhc3REaWZmKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIERpZmZPcC5EZWxldGU6IHtcbiAgICAgICAgICB0aGlzLm91dHB1dERlbGV0ZURpZmYoZGlmZkxpbmVzLCBkaWZmQ2FsY3VsYXRpb24pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgRGlmZk9wLkluc2VydDoge1xuICAgICAgICAgIHRoaXMub3V0cHV0SW5zZXJ0RGlmZihkaWZmTGluZXMsIGRpZmZDYWxjdWxhdGlvbik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmNhbGN1bGF0ZWREaWZmID0gZGlmZkNhbGN1bGF0aW9uLmxpbmVzO1xuICB9XG5cbiAgLyogSWYgdGhlIG51bWJlciBvZiBkaWZmTGluZXMgaXMgZ3JlYXRlciB0aGFuIGxpbmVDb250ZXh0U2l6ZSB0aGVuIHdlIG1heSBuZWVkIHRvIGFkanVzdCB0aGUgZGlmZlxuICAgKiB0aGF0IGlzIG91dHB1dC5cbiAgICogICA+IElmIHRoZSBmaXJzdCBkaWZmIG9mIGEgZG9jdW1lbnQgaXMgRGlmZk9wLkVxdWFsIHRoZW4gdGhlIGxlYWRpbmcgbGluZXMgY2FuIGJlIGRyb3BwZWRcbiAgICogICAgIGxlYXZpbmcgdGhlIGxhc3QgJ2xpbmVDb250ZXh0U2l6ZScgbGluZXMgZm9yIGNvbnRleHQuXG4gICAqICAgPiBJZiB0aGUgbGFzdCBkaWZmIG9mIGEgZG9jdW1lbnQgaXMgRGlmZk9wLkVxdWFsIHRoZW4gdGhlIHRyYWlsaW5nIGxpbmVzIGNhbiBiZSBkcm9wcGVkXG4gICAqICAgICBsZWF2aW5nIHRoZSBmaXJzdCAnbGluZUNvbnRleHRTaXplJyBsaW5lcyBmb3IgY29udGV4dC5cbiAgICogICA+IElmIHRoZSBkaWZmIGlzIGEgRGlmZk9wLkVxdWFsIG9jY3VycyBpbiB0aGUgbWlkZGxlIHRoZW4gdGhlIGRpZmZzIGVpdGhlciBzaWRlIG9mIGl0IG11c3QgYmVcbiAgICogICAgIERpZmZPcC5JbnNlcnQgb3IgRGlmZk9wLkRlbGV0ZS4gSWYgaXQgaGFzIG1vcmUgdGhhbiAyICogJ2xpbmVDb250ZXh0U2l6ZScgbGluZXMgb2YgY29udGVudFxuICAgKiAgICAgdGhlbiB0aGUgbWlkZGxlIGxpbmVzIGFyZSBkcm9wcGVkIGxlYXZpbmcgdGhlIGZpcnN0ICdsaW5lQ29udGV4dFNpemUnIGFuZCBsYXN0ICdsaW5lQ29udGV4dFNpemUnXG4gICAqICAgICBsaW5lcyBmb3IgY29udGV4dC4gQSBzcGVjaWFsIGxpbmUgaXMgaW5zZXJ0ZWQgd2l0aCAnLi4uJyBpbmRpY2F0aW5nIHRoYXQgY29udGVudCBpcyBza2lwcGVkLlxuICAgKlxuICAgKiBBIGRvY3VtZW50IGNhbm5vdCBjb25zaXN0IG9mIGEgc2luZ2xlIERpZmYgd2l0aCBEaWZmT3AuRXF1YWwgYW5kIHJlYWNoIHRoaXMgZnVuY3Rpb24gYmVjYXVzZVxuICAgKiBpbiB0aGlzIGNhc2UgdGhlIGNhbGN1bGF0ZUxpbmVEaWZmIG1ldGhvZCByZXR1cm5zIGVhcmx5LlxuICAgKi9cbiAgcHJpdmF0ZSBvdXRwdXRFcXVhbERpZmYoXG4gICAgICBkaWZmTGluZXM6IHN0cmluZ1tdLFxuICAgICAgZGlmZkNhbGN1bGF0aW9uOiBEaWZmQ2FsY3VsYXRpb24sXG4gICAgICBpc0ZpcnN0RGlmZjogYm9vbGVhbixcbiAgICAgIGlzTGFzdERpZmY6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBpZiAodGhpcy5saW5lQ29udGV4dFNpemUgJiYgZGlmZkxpbmVzLmxlbmd0aCA+IHRoaXMubGluZUNvbnRleHRTaXplKSB7XG4gICAgICBpZiAoaXNGaXJzdERpZmYpIHtcbiAgICAgICAgLy8gVGFrZSB0aGUgbGFzdCAnbGluZUNvbnRleHRTaXplJyBsaW5lcyBmcm9tIHRoZSBmaXJzdCBkaWZmXG4gICAgICAgIGNvbnN0IGxpbmVJbmNyZW1lbnQgPSBkaWZmTGluZXMubGVuZ3RoIC0gdGhpcy5saW5lQ29udGV4dFNpemU7XG4gICAgICAgIGRpZmZDYWxjdWxhdGlvbi5saW5lTGVmdCArPSBsaW5lSW5jcmVtZW50O1xuICAgICAgICBkaWZmQ2FsY3VsYXRpb24ubGluZVJpZ2h0ICs9IGxpbmVJbmNyZW1lbnQ7XG4gICAgICAgIGRpZmZMaW5lcyA9IGRpZmZMaW5lcy5zbGljZShkaWZmTGluZXMubGVuZ3RoIC0gdGhpcy5saW5lQ29udGV4dFNpemUsIGRpZmZMaW5lcy5sZW5ndGgpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoaXNMYXN0RGlmZikge1xuICAgICAgICAvLyBUYWtlIG9ubHkgdGhlIGZpcnN0ICdsaW5lQ29udGV4dFNpemUnIGxpbmVzIGZyb20gdGhlIGZpbmFsIGRpZmZcbiAgICAgICAgZGlmZkxpbmVzID0gZGlmZkxpbmVzLnNsaWNlKDAsIHRoaXMubGluZUNvbnRleHRTaXplKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGRpZmZMaW5lcy5sZW5ndGggPiAyICogdGhpcy5saW5lQ29udGV4dFNpemUpIHtcbiAgICAgICAgLy8gVGFrZSB0aGUgZmlyc3QgJ2xpbmVDb250ZXh0U2l6ZScgbGluZXMgZnJvbSB0aGlzIGRpZmYgdG8gcHJvdmlkZSBjb250ZXh0IGZvciB0aGUgbGFzdCBkaWZmXG4gICAgICAgIHRoaXMub3V0cHV0RXF1YWxEaWZmTGluZXMoZGlmZkxpbmVzLnNsaWNlKDAsIHRoaXMubGluZUNvbnRleHRTaXplKSwgZGlmZkNhbGN1bGF0aW9uKTtcblxuICAgICAgICAvLyBPdXRwdXQgYSBzcGVjaWFsIGxpbmUgaW5kaWNhdGluZyB0aGF0IHNvbWUgY29udGVudCBpcyBlcXVhbCBhbmQgaGFzIGJlZW4gc2tpcHBlZFxuICAgICAgICBkaWZmQ2FsY3VsYXRpb24ubGluZXMucHVzaChbJ2RtcC1saW5lLWNvbXBhcmUtZXF1YWwnLCAnLi4uJywgJy4uLicsICcuLi4nXSk7XG4gICAgICAgIGNvbnN0IG51bWJlck9mU2tpcHBlZExpbmVzID0gZGlmZkxpbmVzLmxlbmd0aCAtICgyICogdGhpcy5saW5lQ29udGV4dFNpemUpO1xuICAgICAgICBkaWZmQ2FsY3VsYXRpb24ubGluZUxlZnQgKz0gbnVtYmVyT2ZTa2lwcGVkTGluZXM7XG4gICAgICAgIGRpZmZDYWxjdWxhdGlvbi5saW5lUmlnaHQgKz0gbnVtYmVyT2ZTa2lwcGVkTGluZXM7XG5cbiAgICAgICAgLy8gVGFrZSB0aGUgbGFzdCAnbGluZUNvbnRleHRTaXplJyBsaW5lcyBmcm9tIHRoaXMgZGlmZiB0byBwcm92aWRlIGNvbnRleHQgZm9yIHRoZSBuZXh0IGRpZmZcbiAgICAgICAgdGhpcy5vdXRwdXRFcXVhbERpZmZMaW5lcyhkaWZmTGluZXMuc2xpY2UoZGlmZkxpbmVzLmxlbmd0aCAtIHRoaXMubGluZUNvbnRleHRTaXplKSwgZGlmZkNhbGN1bGF0aW9uKTtcbiAgICAgICAgLy8gVGhpcyBpZiBicmFuY2ggaGFzIGFscmVhZHkgb3V0cHV0IHRoZSBkaWZmIGxpbmVzIHNvIHdlIHJldHVybiBlYXJseSB0byBhdm9pZCBvdXRwdXR0aW5nIHRoZSBsaW5lc1xuICAgICAgICAvLyBhdCB0aGUgZW5kIG9mIHRoZSBtZXRob2QuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5vdXRwdXRFcXVhbERpZmZMaW5lcyhkaWZmTGluZXMsIGRpZmZDYWxjdWxhdGlvbik7XG4gIH1cblxuICBwcml2YXRlIG91dHB1dEVxdWFsRGlmZkxpbmVzKFxuICAgICAgZGlmZkxpbmVzOiBzdHJpbmdbXSxcbiAgICAgIGRpZmZDYWxjdWxhdGlvbjogRGlmZkNhbGN1bGF0aW9uKTogdm9pZCB7XG4gICAgZm9yIChjb25zdCBsaW5lIG9mIGRpZmZMaW5lcykge1xuICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVzLnB1c2goWydkbXAtbGluZS1jb21wYXJlLWVxdWFsJywgYCR7ZGlmZkNhbGN1bGF0aW9uLmxpbmVMZWZ0fWAsIGAke2RpZmZDYWxjdWxhdGlvbi5saW5lUmlnaHR9YCwgbGluZV0pO1xuICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVMZWZ0Kys7XG4gICAgICBkaWZmQ2FsY3VsYXRpb24ubGluZVJpZ2h0Kys7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBvdXRwdXREZWxldGVEaWZmKFxuICAgICAgZGlmZkxpbmVzOiBzdHJpbmdbXSxcbiAgICAgIGRpZmZDYWxjdWxhdGlvbjogRGlmZkNhbGN1bGF0aW9uKTogdm9pZCB7XG4gICAgZm9yIChjb25zdCBsaW5lIG9mIGRpZmZMaW5lcykge1xuICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVzLnB1c2goWydkbXAtbGluZS1jb21wYXJlLWRlbGV0ZScsIGAke2RpZmZDYWxjdWxhdGlvbi5saW5lTGVmdH1gLCAnLScsIGxpbmVdKTtcbiAgICAgIGRpZmZDYWxjdWxhdGlvbi5saW5lTGVmdCsrO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb3V0cHV0SW5zZXJ0RGlmZihcbiAgICAgIGRpZmZMaW5lczogc3RyaW5nW10sXG4gICAgICBkaWZmQ2FsY3VsYXRpb246IERpZmZDYWxjdWxhdGlvbik6IHZvaWQge1xuICAgIGZvciAoY29uc3QgbGluZSBvZiBkaWZmTGluZXMpIHtcbiAgICAgIGRpZmZDYWxjdWxhdGlvbi5saW5lcy5wdXNoKFsnZG1wLWxpbmUtY29tcGFyZS1pbnNlcnQnLCAnLScsIGAke2RpZmZDYWxjdWxhdGlvbi5saW5lUmlnaHR9YCwgbGluZV0pO1xuICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVSaWdodCsrO1xuICAgIH1cbiAgfVxufVxuIl19