/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { Component, Input } from '@angular/core';
import { DiffMatchPatchService } from './diffMatchPatch.service';
/** @typedef {?} */
var DiffCalculation;
export class LineCompareComponent {
    /**
     * @param {?} dmp
     */
    constructor(dmp) {
        this.dmp = dmp;
        this.left = '';
        this.right = '';
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
        if (typeof this.left === 'number' || typeof this.left === 'boolean') {
            this.left = this.left.toString();
        }
        if (typeof this.right === 'number' || typeof this.right === 'boolean') {
            this.right = this.right.toString();
        }
        this.calculateLineDiff(this.dmp.getLineDiff(this.left, this.right));
    }
    /**
     * @param {?} diffs
     * @return {?}
     */
    calculateLineDiff(diffs) {
        /** @type {?} */
        const diffCalculation = {
            lines: [],
            lineLeft: 1,
            lineRight: 1
        };
        this.isContentEqual = diffs.length === 1 && diffs[0][0] === 0 /* Equal */;
        if (this.isContentEqual) {
            this.calculatedDiff = [];
            return;
        }
        for (let i = 0; i < diffs.length; i++) {
            /** @type {?} */
            const diff = diffs[i];
            /** @type {?} */
            let diffLines = diff[1].split(/\r?\n/);
            // If the original line had a \r\n at the end then remove the
            // empty string after it.
            if (diffLines[diffLines.length - 1].length == 0) {
                diffLines.pop();
            }
            switch (diff[0]) {
                case 0 /* Equal */: {
                    /** @type {?} */
                    const isFirstDiff = i === 0;
                    /** @type {?} */
                    const isLastDiff = i === diffs.length - 1;
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
    }
    /**
     * @param {?} diffLines
     * @param {?} diffCalculation
     * @param {?} isFirstDiff
     * @param {?} isLastDiff
     * @return {?}
     */
    outputEqualDiff(diffLines, diffCalculation, isFirstDiff, isLastDiff) {
        if (this.lineContextSize && diffLines.length > this.lineContextSize) {
            if (isFirstDiff) {
                /** @type {?} */
                const lineIncrement = diffLines.length - this.lineContextSize;
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
                const numberOfSkippedLines = diffLines.length - (2 * this.lineContextSize);
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
    }
    /**
     * @param {?} diffLines
     * @param {?} diffCalculation
     * @return {?}
     */
    outputEqualDiffLines(diffLines, diffCalculation) {
        for (const line of diffLines) {
            diffCalculation.lines.push(['dmp-line-compare-equal', `${diffCalculation.lineLeft}`, `${diffCalculation.lineRight}`, line]);
            diffCalculation.lineLeft++;
            diffCalculation.lineRight++;
        }
    }
    /**
     * @param {?} diffLines
     * @param {?} diffCalculation
     * @return {?}
     */
    outputDeleteDiff(diffLines, diffCalculation) {
        for (const line of diffLines) {
            diffCalculation.lines.push(['dmp-line-compare-delete', `${diffCalculation.lineLeft}`, '-', line]);
            diffCalculation.lineLeft++;
        }
    }
    /**
     * @param {?} diffLines
     * @param {?} diffCalculation
     * @return {?}
     */
    outputInsertDiff(diffLines, diffCalculation) {
        for (const line of diffLines) {
            diffCalculation.lines.push(['dmp-line-compare-insert', '-', `${diffCalculation.lineRight}`, line]);
            diffCalculation.lineRight++;
        }
    }
}
LineCompareComponent.decorators = [
    { type: Component, args: [{
                selector: 'dmp-line-compare',
                styles: [`
    div.dmp-line-compare {
      display: flex;
      flex-direction: row;
      border: 1px solid #808080;
      font-family: Consolas, Courier, monospace;
      width: 911px;
    }
    div.dmp-line-compare-margin {
      width: 101px;
    }
    div.dmp-line-compare-content {
      position: relative;
      top: 0px;
      left: 0px;
      flex-grow: 1;
      overflow-x: scroll;
    }
    div.dmp-line-compare-content-wrapper {
      position: absolute;
      top: 0px;
      left: 0px;
      display: flex;
      flex-direction: column;
      align-items: stretch;
    }
    div.dmp-line-compare-left {
      width: 50px;
      text-align: center;
      color: #484848;
    }
    div.dmp-line-compare-equal>div.dmp-line-compare-left,
      div.dmp-line-compare-equal>div.dmp-line-compare-right {
      background-color: #dedede;
    }
    div.dmp-line-compare-insert>div.dmp-line-compare-left,
      div.dmp-line-compare-insert>div.dmp-line-compare-right {
      background-color: #8bfb6f;
    }
    div.dmp-line-compare-delete>div.dmp-line-compare-left,
      div.dmp-line-compare-delete>div.dmp-line-compare-right {
      background-color: #f56868;
    }
    div.dmp-line-compare-right {
      width: 50px;
      text-align: center;
      color: #484848;
      border-right: 1px solid #888888;
    }
    div.dmp-line-compare-text {
      white-space: pre;
      padding-left: 10px;
      min-width: 800px;
    }
    .dmp-line-compare-delete {
      background-color: #ff8c8c;
    }
    .dmp-line-compare-insert {
      background-color: #9dff97;
    }
    .dmp-line-compare-delete>div {
      display: inline-block;
    }  
    .dmp-line-compare-insert>div {
      display: inline-block;
    }
    .dmp-line-compare-equal>div {
      display: inline-block;
    }
    .dmp-margin-bottom-spacer {
      height: 20px;
      background-color: #dedede;
      border-right: 1px solid #888888;
    }
  `],
                template: `
    <div class="dmp-line-compare-no-changes-text" *ngIf="isContentEqual">
      There are no changes to display.
    </div>    
    <div class="dmp-line-compare" *ngIf="!isContentEqual">
      <div class="dmp-line-compare-margin">
        <div [ngClass]="lineDiff[0]" *ngFor="let lineDiff of calculatedDiff">
          <div class="dmp-line-compare-left">{{lineDiff[1]}}</div><!-- No space
        --><div class="dmp-line-compare-right">{{lineDiff[2]}}</div>
        </div>
        <div class="dmp-margin-bottom-spacer"></div>
      </div><!-- No space
   --><div class="dmp-line-compare-content">
        <div class="dmp-line-compare-content-wrapper">
          <div [ngClass]="lineDiff[0]" *ngFor="let lineDiff of calculatedDiff">
            <div class="dmp-line-compare-text">{{lineDiff[3]}}</div>
          </div>
        </div>
      </div>
    </div>
  `
            },] },
];
/** @nocollapse */
LineCompareComponent.ctorParameters = () => [
    { type: DiffMatchPatchService }
];
LineCompareComponent.propDecorators = {
    left: [{ type: Input }],
    right: [{ type: Input }],
    lineContextSize: [{ type: Input }]
};
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZUNvbXBhcmUuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6Im5nOi8vbmctZGlmZi1tYXRjaC1wYXRjaC8iLCJzb3VyY2VzIjpbImxpYi9saW5lQ29tcGFyZS5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFxQixNQUFNLGVBQWUsQ0FBQztBQUVwRSxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQzs7O0FBZ0hqRSxNQUFNOzs7O2dCQWNRO1FBQUEsUUFBRyxHQUFILEdBQUc7b0JBWjBCLEVBQUU7cUJBRUQsRUFBRTs7Ozs7SUFZckMsUUFBUTtRQUNiLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQzs7Ozs7SUFHYixXQUFXO1FBQ2hCLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQzs7Ozs7SUFHWixVQUFVO1FBQ2hCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLElBQUksS0FBSyxRQUFRLElBQUksT0FBTyxJQUFJLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDcEUsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1NBQ2xDO1FBQ0QsRUFBRSxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsS0FBSyxLQUFLLFFBQVEsSUFBSSxPQUFPLElBQUksQ0FBQyxLQUFLLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztZQUN0RSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7U0FDcEM7UUFDRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQzs7Ozs7O0lBRzlELGlCQUFpQixDQUFDLEtBQWtCOztRQUMxQyxNQUFNLGVBQWUsR0FBb0I7WUFDdkMsS0FBSyxFQUFFLEVBQUU7WUFDVCxRQUFRLEVBQUUsQ0FBQztZQUNYLFNBQVMsRUFBRSxDQUFDO1NBQ2IsQ0FBQztRQUVGLElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxrQkFBaUIsQ0FBQztRQUN6RSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztZQUN4QixJQUFJLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQztZQUN6QixNQUFNLENBQUM7U0FDUjtRQUVELEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDOztZQUN0QyxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7O1lBQ3RCLElBQUksU0FBUyxHQUFhLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7OztZQUlqRCxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDaEQsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDO2FBQ2pCO1lBRUQsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDaEIsb0JBQW1CLENBQUM7O29CQUNsQixNQUFNLFdBQVcsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDOztvQkFDNUIsTUFBTSxVQUFVLEdBQUcsQ0FBQyxLQUFLLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO29CQUMxQyxJQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsRUFBRSxlQUFlLEVBQUUsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO29CQUMxRSxLQUFLLENBQUM7aUJBQ1A7Z0JBQ0Qsc0JBQW9CLENBQUM7b0JBQ25CLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsZUFBZSxDQUFDLENBQUM7b0JBQ2xELEtBQUssQ0FBQztpQkFDUDtnQkFDRCxxQkFBb0IsQ0FBQztvQkFDbkIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxlQUFlLENBQUMsQ0FBQztvQkFDbEQsS0FBSyxDQUFDO2lCQUNQO2FBQ0Y7U0FDRjtRQUVELElBQUksQ0FBQyxjQUFjLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FBQzs7Ozs7Ozs7O0lBaUJ0QyxlQUFlLENBQ25CLFNBQW1CLEVBQ25CLGVBQWdDLEVBQ2hDLFdBQW9CLEVBQ3BCLFVBQW1CO1FBQ3JCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLElBQUksU0FBUyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztZQUNwRSxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDOztnQkFFaEIsTUFBTSxhQUFhLEdBQUcsU0FBUyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDO2dCQUM5RCxlQUFlLENBQUMsUUFBUSxJQUFJLGFBQWEsQ0FBQztnQkFDMUMsZUFBZSxDQUFDLFNBQVMsSUFBSSxhQUFhLENBQUM7Z0JBQzNDLFNBQVMsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDeEY7WUFDRCxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQzs7Z0JBRXBCLFNBQVMsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7YUFDdEQ7WUFDRCxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7O2dCQUVyRCxJQUFJLENBQUMsb0JBQW9CLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDOztnQkFHckYsZUFBZSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyx3QkFBd0IsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7O2dCQUM1RSxNQUFNLG9CQUFvQixHQUFHLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUMzRSxlQUFlLENBQUMsUUFBUSxJQUFJLG9CQUFvQixDQUFDO2dCQUNqRCxlQUFlLENBQUMsU0FBUyxJQUFJLG9CQUFvQixDQUFDOztnQkFHbEQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUM7OztnQkFHckcsTUFBTSxDQUFDO2FBQ1I7U0FDRjtRQUNELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsZUFBZSxDQUFDLENBQUM7Ozs7Ozs7SUFHaEQsb0JBQW9CLENBQ3hCLFNBQW1CLEVBQ25CLGVBQWdDO1FBQ2xDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sSUFBSSxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDN0IsZUFBZSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLGVBQWUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxHQUFHLGVBQWUsQ0FBQyxTQUFTLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzVILGVBQWUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUMzQixlQUFlLENBQUMsU0FBUyxFQUFFLENBQUM7U0FDN0I7Ozs7Ozs7SUFHSyxnQkFBZ0IsQ0FDcEIsU0FBbUIsRUFDbkIsZUFBZ0M7UUFDbEMsR0FBRyxDQUFDLENBQUMsTUFBTSxJQUFJLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQztZQUM3QixlQUFlLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLHlCQUF5QixFQUFFLEdBQUcsZUFBZSxDQUFDLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2xHLGVBQWUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztTQUM1Qjs7Ozs7OztJQUdLLGdCQUFnQixDQUNwQixTQUFtQixFQUNuQixlQUFnQztRQUNsQyxHQUFHLENBQUMsQ0FBQyxNQUFNLElBQUksSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQzdCLGVBQWUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMseUJBQXlCLEVBQUUsR0FBRyxFQUFFLEdBQUcsZUFBZSxDQUFDLFNBQVMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDbkcsZUFBZSxDQUFDLFNBQVMsRUFBRSxDQUFDO1NBQzdCOzs7O1lBN1BKLFNBQVMsU0FBQztnQkFDVCxRQUFRLEVBQUUsa0JBQWtCO2dCQUM1QixNQUFNLEVBQUUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0EwRVIsQ0FBQztnQkFDRixRQUFRLEVBQUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBb0JUO2FBQ0Y7Ozs7WUEvR1EscUJBQXFCOzs7bUJBaUgzQixLQUFLO29CQUVMLEtBQUs7OEJBSUwsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgSW5wdXQsIE9uSW5pdCwgT25DaGFuZ2VzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7IERpZmYsIERpZmZPcCB9IGZyb20gJy4vZGlmZk1hdGNoUGF0Y2gnO1xyXG5pbXBvcnQgeyBEaWZmTWF0Y2hQYXRjaFNlcnZpY2UgfSBmcm9tICcuL2RpZmZNYXRjaFBhdGNoLnNlcnZpY2UnO1xyXG5cclxuLyogSG9sZHMgdGhlIHN0YXRlIG9mIHRoZSBjYWxjdWxhdGlvbiBvZiB0aGUgZGlmZiByZXN1bHQgd2UgaW50ZW5kIHRvIGRpc3BsYXkuXHJcbiAqICA+IGxpbmVzIGNvbnRhaW5zIHRoZSBkYXRhIHRoYXQgd2lsbCBiZSBkaXNwbGF5ZWQgb24gc2NyZWVuLlxyXG4gKiAgPiBsaW5lTGVmdCBrZWVwcyB0cmFjayBvZiB0aGUgZG9jdW1lbnQgbGluZSBudW1iZXIgaW4gdGhlIFtsZWZ0XSBpbnB1dC5cclxuICogID4gbGluZVJpZ2h0IGtlZXBzIHRyYWNrIG9mIHRoZSBkb2N1bWVudCBsaW5lIG51bWJlciBpbiB0aGUgW3JpZ2h0XSBpbnB1dC5cclxuICovXHJcbnR5cGUgRGlmZkNhbGN1bGF0aW9uID0ge1xyXG4gIGxpbmVzOiBBcnJheTxbc3RyaW5nLCBzdHJpbmcsIHN0cmluZywgc3RyaW5nXT4sXHJcbiAgbGluZUxlZnQ6IG51bWJlcixcclxuICBsaW5lUmlnaHQ6IG51bWJlclxyXG59O1xyXG5cclxuQENvbXBvbmVudCh7XHJcbiAgc2VsZWN0b3I6ICdkbXAtbGluZS1jb21wYXJlJyxcclxuICBzdHlsZXM6IFtgXHJcbiAgICBkaXYuZG1wLWxpbmUtY29tcGFyZSB7XHJcbiAgICAgIGRpc3BsYXk6IGZsZXg7XHJcbiAgICAgIGZsZXgtZGlyZWN0aW9uOiByb3c7XHJcbiAgICAgIGJvcmRlcjogMXB4IHNvbGlkICM4MDgwODA7XHJcbiAgICAgIGZvbnQtZmFtaWx5OiBDb25zb2xhcywgQ291cmllciwgbW9ub3NwYWNlO1xyXG4gICAgICB3aWR0aDogOTExcHg7XHJcbiAgICB9XHJcbiAgICBkaXYuZG1wLWxpbmUtY29tcGFyZS1tYXJnaW4ge1xyXG4gICAgICB3aWR0aDogMTAxcHg7XHJcbiAgICB9XHJcbiAgICBkaXYuZG1wLWxpbmUtY29tcGFyZS1jb250ZW50IHtcclxuICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xyXG4gICAgICB0b3A6IDBweDtcclxuICAgICAgbGVmdDogMHB4O1xyXG4gICAgICBmbGV4LWdyb3c6IDE7XHJcbiAgICAgIG92ZXJmbG93LXg6IHNjcm9sbDtcclxuICAgIH1cclxuICAgIGRpdi5kbXAtbGluZS1jb21wYXJlLWNvbnRlbnQtd3JhcHBlciB7XHJcbiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcclxuICAgICAgdG9wOiAwcHg7XHJcbiAgICAgIGxlZnQ6IDBweDtcclxuICAgICAgZGlzcGxheTogZmxleDtcclxuICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcclxuICAgICAgYWxpZ24taXRlbXM6IHN0cmV0Y2g7XHJcbiAgICB9XHJcbiAgICBkaXYuZG1wLWxpbmUtY29tcGFyZS1sZWZ0IHtcclxuICAgICAgd2lkdGg6IDUwcHg7XHJcbiAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcclxuICAgICAgY29sb3I6ICM0ODQ4NDg7XHJcbiAgICB9XHJcbiAgICBkaXYuZG1wLWxpbmUtY29tcGFyZS1lcXVhbD5kaXYuZG1wLWxpbmUtY29tcGFyZS1sZWZ0LFxyXG4gICAgICBkaXYuZG1wLWxpbmUtY29tcGFyZS1lcXVhbD5kaXYuZG1wLWxpbmUtY29tcGFyZS1yaWdodCB7XHJcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICNkZWRlZGU7XHJcbiAgICB9XHJcbiAgICBkaXYuZG1wLWxpbmUtY29tcGFyZS1pbnNlcnQ+ZGl2LmRtcC1saW5lLWNvbXBhcmUtbGVmdCxcclxuICAgICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtaW5zZXJ0PmRpdi5kbXAtbGluZS1jb21wYXJlLXJpZ2h0IHtcclxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzhiZmI2ZjtcclxuICAgIH1cclxuICAgIGRpdi5kbXAtbGluZS1jb21wYXJlLWRlbGV0ZT5kaXYuZG1wLWxpbmUtY29tcGFyZS1sZWZ0LFxyXG4gICAgICBkaXYuZG1wLWxpbmUtY29tcGFyZS1kZWxldGU+ZGl2LmRtcC1saW5lLWNvbXBhcmUtcmlnaHQge1xyXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjU2ODY4O1xyXG4gICAgfVxyXG4gICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtcmlnaHQge1xyXG4gICAgICB3aWR0aDogNTBweDtcclxuICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xyXG4gICAgICBjb2xvcjogIzQ4NDg0ODtcclxuICAgICAgYm9yZGVyLXJpZ2h0OiAxcHggc29saWQgIzg4ODg4ODtcclxuICAgIH1cclxuICAgIGRpdi5kbXAtbGluZS1jb21wYXJlLXRleHQge1xyXG4gICAgICB3aGl0ZS1zcGFjZTogcHJlO1xyXG4gICAgICBwYWRkaW5nLWxlZnQ6IDEwcHg7XHJcbiAgICAgIG1pbi13aWR0aDogODAwcHg7XHJcbiAgICB9XHJcbiAgICAuZG1wLWxpbmUtY29tcGFyZS1kZWxldGUge1xyXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmY4YzhjO1xyXG4gICAgfVxyXG4gICAgLmRtcC1saW5lLWNvbXBhcmUtaW5zZXJ0IHtcclxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzlkZmY5NztcclxuICAgIH1cclxuICAgIC5kbXAtbGluZS1jb21wYXJlLWRlbGV0ZT5kaXYge1xyXG4gICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XHJcbiAgICB9ICBcclxuICAgIC5kbXAtbGluZS1jb21wYXJlLWluc2VydD5kaXYge1xyXG4gICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XHJcbiAgICB9XHJcbiAgICAuZG1wLWxpbmUtY29tcGFyZS1lcXVhbD5kaXYge1xyXG4gICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XHJcbiAgICB9XHJcbiAgICAuZG1wLW1hcmdpbi1ib3R0b20tc3BhY2VyIHtcclxuICAgICAgaGVpZ2h0OiAyMHB4O1xyXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZGVkZWRlO1xyXG4gICAgICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCAjODg4ODg4O1xyXG4gICAgfVxyXG4gIGBdLFxyXG4gIHRlbXBsYXRlOiBgXHJcbiAgICA8ZGl2IGNsYXNzPVwiZG1wLWxpbmUtY29tcGFyZS1uby1jaGFuZ2VzLXRleHRcIiAqbmdJZj1cImlzQ29udGVudEVxdWFsXCI+XHJcbiAgICAgIFRoZXJlIGFyZSBubyBjaGFuZ2VzIHRvIGRpc3BsYXkuXHJcbiAgICA8L2Rpdj4gICAgXHJcbiAgICA8ZGl2IGNsYXNzPVwiZG1wLWxpbmUtY29tcGFyZVwiICpuZ0lmPVwiIWlzQ29udGVudEVxdWFsXCI+XHJcbiAgICAgIDxkaXYgY2xhc3M9XCJkbXAtbGluZS1jb21wYXJlLW1hcmdpblwiPlxyXG4gICAgICAgIDxkaXYgW25nQ2xhc3NdPVwibGluZURpZmZbMF1cIiAqbmdGb3I9XCJsZXQgbGluZURpZmYgb2YgY2FsY3VsYXRlZERpZmZcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJkbXAtbGluZS1jb21wYXJlLWxlZnRcIj57e2xpbmVEaWZmWzFdfX08L2Rpdj48IS0tIE5vIHNwYWNlXHJcbiAgICAgICAgLS0+PGRpdiBjbGFzcz1cImRtcC1saW5lLWNvbXBhcmUtcmlnaHRcIj57e2xpbmVEaWZmWzJdfX08L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8ZGl2IGNsYXNzPVwiZG1wLW1hcmdpbi1ib3R0b20tc3BhY2VyXCI+PC9kaXY+XHJcbiAgICAgIDwvZGl2PjwhLS0gTm8gc3BhY2VcclxuICAgLS0+PGRpdiBjbGFzcz1cImRtcC1saW5lLWNvbXBhcmUtY29udGVudFwiPlxyXG4gICAgICAgIDxkaXYgY2xhc3M9XCJkbXAtbGluZS1jb21wYXJlLWNvbnRlbnQtd3JhcHBlclwiPlxyXG4gICAgICAgICAgPGRpdiBbbmdDbGFzc109XCJsaW5lRGlmZlswXVwiICpuZ0Zvcj1cImxldCBsaW5lRGlmZiBvZiBjYWxjdWxhdGVkRGlmZlwiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZG1wLWxpbmUtY29tcGFyZS10ZXh0XCI+e3tsaW5lRGlmZlszXX19PC9kaXY+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgPC9kaXY+XHJcbiAgICA8L2Rpdj5cclxuICBgXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBMaW5lQ29tcGFyZUNvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCwgT25DaGFuZ2VzIHtcclxuICBASW5wdXQoKVxyXG4gIHB1YmxpYyBsZWZ0OiBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuID0gJyc7XHJcbiAgQElucHV0KClcclxuICBwdWJsaWMgcmlnaHQ6IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4gPSAnJztcclxuICAvLyBUaGUgbnVtYmVyIG9mIGxpbmVzIG9mIGNvbnRleHQgdG8gcHJvdmlkZSBlaXRoZXIgc2lkZSBvZiBhIERpZmZPcC5JbnNlcnQgb3IgRGlmZk9wLkRlbGV0ZSBkaWZmLlxyXG4gIC8vIENvbnRleHQgaXMgdGFrZW4gZnJvbSBhIERpZmZPcC5FcXVhbCBzZWN0aW9uLlxyXG4gIEBJbnB1dCgpXHJcbiAgcHVibGljIGxpbmVDb250ZXh0U2l6ZTogbnVtYmVyO1xyXG5cclxuICBwdWJsaWMgY2FsY3VsYXRlZERpZmY6IEFycmF5PFtzdHJpbmcsIHN0cmluZywgc3RyaW5nLCBzdHJpbmddPjtcclxuICBwdWJsaWMgaXNDb250ZW50RXF1YWw6IGJvb2xlYW47XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihcclxuICAgICAgcHJpdmF0ZSBkbXA6IERpZmZNYXRjaFBhdGNoU2VydmljZSkge31cclxuXHJcbiAgcHVibGljIG5nT25Jbml0KCk6IHZvaWQge1xyXG4gICAgdGhpcy51cGRhdGVIdG1sKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgbmdPbkNoYW5nZXMoKTogdm9pZCB7XHJcbiAgICB0aGlzLnVwZGF0ZUh0bWwoKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgdXBkYXRlSHRtbCgpOiB2b2lkIHtcclxuICAgIGlmICh0eXBlb2YgdGhpcy5sZWZ0ID09PSAnbnVtYmVyJyB8fCB0eXBlb2YgdGhpcy5sZWZ0ID09PSAnYm9vbGVhbicpIHtcclxuICAgICAgdGhpcy5sZWZ0ID0gdGhpcy5sZWZ0LnRvU3RyaW5nKCk7XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHRoaXMucmlnaHQgPT09ICdudW1iZXInIHx8IHR5cGVvZiB0aGlzLnJpZ2h0ID09PSAnYm9vbGVhbicpIHtcclxuICAgICAgdGhpcy5yaWdodCA9IHRoaXMucmlnaHQudG9TdHJpbmcoKTtcclxuICAgIH1cclxuICAgIHRoaXMuY2FsY3VsYXRlTGluZURpZmYodGhpcy5kbXAuZ2V0TGluZURpZmYodGhpcy5sZWZ0LCB0aGlzLnJpZ2h0KSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGNhbGN1bGF0ZUxpbmVEaWZmKGRpZmZzOiBBcnJheTxEaWZmPik6IHZvaWQge1xyXG4gICAgY29uc3QgZGlmZkNhbGN1bGF0aW9uOiBEaWZmQ2FsY3VsYXRpb24gPSB7XHJcbiAgICAgIGxpbmVzOiBbXSxcclxuICAgICAgbGluZUxlZnQ6IDEsXHJcbiAgICAgIGxpbmVSaWdodDogMVxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmlzQ29udGVudEVxdWFsID0gZGlmZnMubGVuZ3RoID09PSAxICYmIGRpZmZzWzBdWzBdID09PSBEaWZmT3AuRXF1YWw7XHJcbiAgICBpZiAodGhpcy5pc0NvbnRlbnRFcXVhbCkge1xyXG4gICAgICB0aGlzLmNhbGN1bGF0ZWREaWZmID0gW107XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpZmZzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IGRpZmYgPSBkaWZmc1tpXTtcclxuICAgICAgbGV0IGRpZmZMaW5lczogc3RyaW5nW10gPSBkaWZmWzFdLnNwbGl0KC9cXHI/XFxuLyk7XHJcblxyXG4gICAgICAvLyBJZiB0aGUgb3JpZ2luYWwgbGluZSBoYWQgYSBcXHJcXG4gYXQgdGhlIGVuZCB0aGVuIHJlbW92ZSB0aGVcclxuICAgICAgLy8gZW1wdHkgc3RyaW5nIGFmdGVyIGl0LlxyXG4gICAgICBpZiAoZGlmZkxpbmVzW2RpZmZMaW5lcy5sZW5ndGggLSAxXS5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgIGRpZmZMaW5lcy5wb3AoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgc3dpdGNoIChkaWZmWzBdKSB7XHJcbiAgICAgICAgY2FzZSBEaWZmT3AuRXF1YWw6IHtcclxuICAgICAgICAgIGNvbnN0IGlzRmlyc3REaWZmID0gaSA9PT0gMDtcclxuICAgICAgICAgIGNvbnN0IGlzTGFzdERpZmYgPSBpID09PSBkaWZmcy5sZW5ndGggLSAxO1xyXG4gICAgICAgICAgdGhpcy5vdXRwdXRFcXVhbERpZmYoZGlmZkxpbmVzLCBkaWZmQ2FsY3VsYXRpb24sIGlzRmlyc3REaWZmLCBpc0xhc3REaWZmKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXNlIERpZmZPcC5EZWxldGU6IHtcclxuICAgICAgICAgIHRoaXMub3V0cHV0RGVsZXRlRGlmZihkaWZmTGluZXMsIGRpZmZDYWxjdWxhdGlvbik7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgICAgY2FzZSBEaWZmT3AuSW5zZXJ0OiB7XHJcbiAgICAgICAgICB0aGlzLm91dHB1dEluc2VydERpZmYoZGlmZkxpbmVzLCBkaWZmQ2FsY3VsYXRpb24pO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5jYWxjdWxhdGVkRGlmZiA9IGRpZmZDYWxjdWxhdGlvbi5saW5lcztcclxuICB9XHJcblxyXG4gIC8qIElmIHRoZSBudW1iZXIgb2YgZGlmZkxpbmVzIGlzIGdyZWF0ZXIgdGhhbiBsaW5lQ29udGV4dFNpemUgdGhlbiB3ZSBtYXkgbmVlZCB0byBhZGp1c3QgdGhlIGRpZmZcclxuICAgKiB0aGF0IGlzIG91dHB1dC5cclxuICAgKiAgID4gSWYgdGhlIGZpcnN0IGRpZmYgb2YgYSBkb2N1bWVudCBpcyBEaWZmT3AuRXF1YWwgdGhlbiB0aGUgbGVhZGluZyBsaW5lcyBjYW4gYmUgZHJvcHBlZFxyXG4gICAqICAgICBsZWF2aW5nIHRoZSBsYXN0ICdsaW5lQ29udGV4dFNpemUnIGxpbmVzIGZvciBjb250ZXh0LlxyXG4gICAqICAgPiBJZiB0aGUgbGFzdCBkaWZmIG9mIGEgZG9jdW1lbnQgaXMgRGlmZk9wLkVxdWFsIHRoZW4gdGhlIHRyYWlsaW5nIGxpbmVzIGNhbiBiZSBkcm9wcGVkXHJcbiAgICogICAgIGxlYXZpbmcgdGhlIGZpcnN0ICdsaW5lQ29udGV4dFNpemUnIGxpbmVzIGZvciBjb250ZXh0LlxyXG4gICAqICAgPiBJZiB0aGUgZGlmZiBpcyBhIERpZmZPcC5FcXVhbCBvY2N1cnMgaW4gdGhlIG1pZGRsZSB0aGVuIHRoZSBkaWZmcyBlaXRoZXIgc2lkZSBvZiBpdCBtdXN0IGJlXHJcbiAgICogICAgIERpZmZPcC5JbnNlcnQgb3IgRGlmZk9wLkRlbGV0ZS4gSWYgaXQgaGFzIG1vcmUgdGhhbiAyICogJ2xpbmVDb250ZXh0U2l6ZScgbGluZXMgb2YgY29udGVudFxyXG4gICAqICAgICB0aGVuIHRoZSBtaWRkbGUgbGluZXMgYXJlIGRyb3BwZWQgbGVhdmluZyB0aGUgZmlyc3QgJ2xpbmVDb250ZXh0U2l6ZScgYW5kIGxhc3QgJ2xpbmVDb250ZXh0U2l6ZSdcclxuICAgKiAgICAgbGluZXMgZm9yIGNvbnRleHQuIEEgc3BlY2lhbCBsaW5lIGlzIGluc2VydGVkIHdpdGggJy4uLicgaW5kaWNhdGluZyB0aGF0IGNvbnRlbnQgaXMgc2tpcHBlZC5cclxuICAgKlxyXG4gICAqIEEgZG9jdW1lbnQgY2Fubm90IGNvbnNpc3Qgb2YgYSBzaW5nbGUgRGlmZiB3aXRoIERpZmZPcC5FcXVhbCBhbmQgcmVhY2ggdGhpcyBmdW5jdGlvbiBiZWNhdXNlXHJcbiAgICogaW4gdGhpcyBjYXNlIHRoZSBjYWxjdWxhdGVMaW5lRGlmZiBtZXRob2QgcmV0dXJucyBlYXJseS5cclxuICAgKi9cclxuICBwcml2YXRlIG91dHB1dEVxdWFsRGlmZihcclxuICAgICAgZGlmZkxpbmVzOiBzdHJpbmdbXSxcclxuICAgICAgZGlmZkNhbGN1bGF0aW9uOiBEaWZmQ2FsY3VsYXRpb24sXHJcbiAgICAgIGlzRmlyc3REaWZmOiBib29sZWFuLFxyXG4gICAgICBpc0xhc3REaWZmOiBib29sZWFuKTogdm9pZCB7XHJcbiAgICBpZiAodGhpcy5saW5lQ29udGV4dFNpemUgJiYgZGlmZkxpbmVzLmxlbmd0aCA+IHRoaXMubGluZUNvbnRleHRTaXplKSB7XHJcbiAgICAgIGlmIChpc0ZpcnN0RGlmZikge1xyXG4gICAgICAgIC8vIFRha2UgdGhlIGxhc3QgJ2xpbmVDb250ZXh0U2l6ZScgbGluZXMgZnJvbSB0aGUgZmlyc3QgZGlmZlxyXG4gICAgICAgIGNvbnN0IGxpbmVJbmNyZW1lbnQgPSBkaWZmTGluZXMubGVuZ3RoIC0gdGhpcy5saW5lQ29udGV4dFNpemU7XHJcbiAgICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVMZWZ0ICs9IGxpbmVJbmNyZW1lbnQ7XHJcbiAgICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVSaWdodCArPSBsaW5lSW5jcmVtZW50O1xyXG4gICAgICAgIGRpZmZMaW5lcyA9IGRpZmZMaW5lcy5zbGljZShkaWZmTGluZXMubGVuZ3RoIC0gdGhpcy5saW5lQ29udGV4dFNpemUsIGRpZmZMaW5lcy5sZW5ndGgpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKGlzTGFzdERpZmYpIHtcclxuICAgICAgICAvLyBUYWtlIG9ubHkgdGhlIGZpcnN0ICdsaW5lQ29udGV4dFNpemUnIGxpbmVzIGZyb20gdGhlIGZpbmFsIGRpZmZcclxuICAgICAgICBkaWZmTGluZXMgPSBkaWZmTGluZXMuc2xpY2UoMCwgdGhpcy5saW5lQ29udGV4dFNpemUpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKGRpZmZMaW5lcy5sZW5ndGggPiAyICogdGhpcy5saW5lQ29udGV4dFNpemUpIHtcclxuICAgICAgICAvLyBUYWtlIHRoZSBmaXJzdCAnbGluZUNvbnRleHRTaXplJyBsaW5lcyBmcm9tIHRoaXMgZGlmZiB0byBwcm92aWRlIGNvbnRleHQgZm9yIHRoZSBsYXN0IGRpZmZcclxuICAgICAgICB0aGlzLm91dHB1dEVxdWFsRGlmZkxpbmVzKGRpZmZMaW5lcy5zbGljZSgwLCB0aGlzLmxpbmVDb250ZXh0U2l6ZSksIGRpZmZDYWxjdWxhdGlvbik7XHJcblxyXG4gICAgICAgIC8vIE91dHB1dCBhIHNwZWNpYWwgbGluZSBpbmRpY2F0aW5nIHRoYXQgc29tZSBjb250ZW50IGlzIGVxdWFsIGFuZCBoYXMgYmVlbiBza2lwcGVkXHJcbiAgICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVzLnB1c2goWydkbXAtbGluZS1jb21wYXJlLWVxdWFsJywgJy4uLicsICcuLi4nLCAnLi4uJ10pO1xyXG4gICAgICAgIGNvbnN0IG51bWJlck9mU2tpcHBlZExpbmVzID0gZGlmZkxpbmVzLmxlbmd0aCAtICgyICogdGhpcy5saW5lQ29udGV4dFNpemUpO1xyXG4gICAgICAgIGRpZmZDYWxjdWxhdGlvbi5saW5lTGVmdCArPSBudW1iZXJPZlNraXBwZWRMaW5lcztcclxuICAgICAgICBkaWZmQ2FsY3VsYXRpb24ubGluZVJpZ2h0ICs9IG51bWJlck9mU2tpcHBlZExpbmVzO1xyXG5cclxuICAgICAgICAvLyBUYWtlIHRoZSBsYXN0ICdsaW5lQ29udGV4dFNpemUnIGxpbmVzIGZyb20gdGhpcyBkaWZmIHRvIHByb3ZpZGUgY29udGV4dCBmb3IgdGhlIG5leHQgZGlmZlxyXG4gICAgICAgIHRoaXMub3V0cHV0RXF1YWxEaWZmTGluZXMoZGlmZkxpbmVzLnNsaWNlKGRpZmZMaW5lcy5sZW5ndGggLSB0aGlzLmxpbmVDb250ZXh0U2l6ZSksIGRpZmZDYWxjdWxhdGlvbik7XHJcbiAgICAgICAgLy8gVGhpcyBpZiBicmFuY2ggaGFzIGFscmVhZHkgb3V0cHV0IHRoZSBkaWZmIGxpbmVzIHNvIHdlIHJldHVybiBlYXJseSB0byBhdm9pZCBvdXRwdXR0aW5nIHRoZSBsaW5lc1xyXG4gICAgICAgIC8vIGF0IHRoZSBlbmQgb2YgdGhlIG1ldGhvZC5cclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMub3V0cHV0RXF1YWxEaWZmTGluZXMoZGlmZkxpbmVzLCBkaWZmQ2FsY3VsYXRpb24pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBvdXRwdXRFcXVhbERpZmZMaW5lcyhcclxuICAgICAgZGlmZkxpbmVzOiBzdHJpbmdbXSxcclxuICAgICAgZGlmZkNhbGN1bGF0aW9uOiBEaWZmQ2FsY3VsYXRpb24pOiB2b2lkIHtcclxuICAgIGZvciAoY29uc3QgbGluZSBvZiBkaWZmTGluZXMpIHtcclxuICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVzLnB1c2goWydkbXAtbGluZS1jb21wYXJlLWVxdWFsJywgYCR7ZGlmZkNhbGN1bGF0aW9uLmxpbmVMZWZ0fWAsIGAke2RpZmZDYWxjdWxhdGlvbi5saW5lUmlnaHR9YCwgbGluZV0pO1xyXG4gICAgICBkaWZmQ2FsY3VsYXRpb24ubGluZUxlZnQrKztcclxuICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVSaWdodCsrO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBvdXRwdXREZWxldGVEaWZmKFxyXG4gICAgICBkaWZmTGluZXM6IHN0cmluZ1tdLFxyXG4gICAgICBkaWZmQ2FsY3VsYXRpb246IERpZmZDYWxjdWxhdGlvbik6IHZvaWQge1xyXG4gICAgZm9yIChjb25zdCBsaW5lIG9mIGRpZmZMaW5lcykge1xyXG4gICAgICBkaWZmQ2FsY3VsYXRpb24ubGluZXMucHVzaChbJ2RtcC1saW5lLWNvbXBhcmUtZGVsZXRlJywgYCR7ZGlmZkNhbGN1bGF0aW9uLmxpbmVMZWZ0fWAsICctJywgbGluZV0pO1xyXG4gICAgICBkaWZmQ2FsY3VsYXRpb24ubGluZUxlZnQrKztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgb3V0cHV0SW5zZXJ0RGlmZihcclxuICAgICAgZGlmZkxpbmVzOiBzdHJpbmdbXSxcclxuICAgICAgZGlmZkNhbGN1bGF0aW9uOiBEaWZmQ2FsY3VsYXRpb24pOiB2b2lkIHtcclxuICAgIGZvciAoY29uc3QgbGluZSBvZiBkaWZmTGluZXMpIHtcclxuICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVzLnB1c2goWydkbXAtbGluZS1jb21wYXJlLWluc2VydCcsICctJywgYCR7ZGlmZkNhbGN1bGF0aW9uLmxpbmVSaWdodH1gLCBsaW5lXSk7XHJcbiAgICAgIGRpZmZDYWxjdWxhdGlvbi5saW5lUmlnaHQrKztcclxuICAgIH1cclxuICB9XHJcbn1cclxuIl19