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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZUNvbXBhcmUuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6Im5nOi8vbmctZGlmZi1tYXRjaC1wYXRjaC8iLCJzb3VyY2VzIjpbImxpYi9saW5lQ29tcGFyZS5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFxQixNQUFNLGVBQWUsQ0FBQztBQUVwRSxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQzs7O0FBZ0hqRSxNQUFNOzs7O2dCQWNRO1FBQUEsUUFBRyxHQUFILEdBQUc7Ozs7O0lBRVIsUUFBUTtRQUNiLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQzs7Ozs7SUFHYixXQUFXO1FBQ2hCLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQzs7Ozs7SUFHWixVQUFVO1FBQ2hCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLElBQUksS0FBSyxRQUFRLElBQUksT0FBTyxJQUFJLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDcEUsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1NBQ2xDO1FBQ0QsRUFBRSxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsS0FBSyxLQUFLLFFBQVEsSUFBSSxPQUFPLElBQUksQ0FBQyxLQUFLLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztZQUN0RSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7U0FDcEM7UUFDRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQzs7Ozs7O0lBRzlELGlCQUFpQixDQUFDLEtBQWtCOztRQUMxQyxNQUFNLGVBQWUsR0FBb0I7WUFDdkMs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UUFDbEMsR0FBRyxDQUFDLENBQUMsTUFBTSxJQUFJLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQztZQUM3QixlQUFlLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLHlCQUF5QixFQUFFLEdBQUcsZUFBZSxDQUFDLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2xHLGVBQWUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztTQUM1Qjs7Ozs7OztJQUdLLGdCQUFnQixDQUNwQixTQUFtQixFQUNuQixlQUFnQztRQUNsQyxHQUFHLENBQUMsQ0FBQyxNQUFNLElBQUksSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQzdCLGVBQWUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMseUJBQXlCLEVBQUUsR0FBRyxFQUFFLEdBQUcsZUFBZSxDQUFDLFNBQVMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDbkcsZUFBZSxDQUFDLFNBQVMsRUFBRSxDQUFDO1NBQzdCOzs7O1lBN1BKLFNBQVMsU0FBQztnQkFDVCxRQUFRLEVBQUUsa0JBQWtCO2dCQUM1QixNQUFNLEVBQUUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0EwRVIsQ0FBQztnQkFDRixRQUFRLEVBQUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBb0JUO2FBQ0Y7Ozs7WUEvR1EscUJBQXFCOzs7bUJBaUgzQixLQUFLO29CQUVMLEtBQUs7OEJBSUwsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgSW5wdXQsIE9uSW5pdCwgT25DaGFuZ2VzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBEaWZmLCBEaWZmT3AgfSBmcm9tICcuL2RpZmZNYXRjaFBhdGNoJztcbmltcG9ydCB7IERpZmZNYXRjaFBhdGNoU2VydmljZSB9IGZyb20gJy4vZGlmZk1hdGNoUGF0Y2guc2VydmljZSc7XG5cbi8qIEhvbGRzIHRoZSBzdGF0ZSBvZiB0aGUgY2FsY3VsYXRpb24gb2YgdGhlIGRpZmYgcmVzdWx0IHdlIGludGVuZCB0byBkaXNwbGF5LlxuICogID4gbGluZXMgY29udGFpbnMgdGhlIGRhdGEgdGhhdCB3aWxsIGJlIGRpc3BsYXllZCBvbiBzY3JlZW4uXG4gKiAgPiBsaW5lTGVmdCBrZWVwcyB0cmFjayBvZiB0aGUgZG9jdW1lbnQgbGluZSBudW1iZXIgaW4gdGhlIFtsZWZ0XSBpbnB1dC5cbiAqICA+IGxpbmVSaWdodCBrZWVwcyB0cmFjayBvZiB0aGUgZG9jdW1lbnQgbGluZSBudW1iZXIgaW4gdGhlIFtyaWdodF0gaW5wdXQuXG4gKi9cbnR5cGUgRGlmZkNhbGN1bGF0aW9uID0ge1xuICBsaW5lczogQXJyYXk8W3N0cmluZywgc3RyaW5nLCBzdHJpbmcsIHN0cmluZ10+LFxuICBsaW5lTGVmdDogbnVtYmVyLFxuICBsaW5lUmlnaHQ6IG51bWJlclxufTtcblxuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAnZG1wLWxpbmUtY29tcGFyZScsXG4gIHN0eWxlczogW2BcbiAgICBkaXYuZG1wLWxpbmUtY29tcGFyZSB7XG4gICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgZmxleC1kaXJlY3Rpb246IHJvdztcbiAgICAgIGJvcmRlcjogMXB4IHNvbGlkICM4MDgwODA7XG4gICAgICBmb250LWZhbWlseTogQ29uc29sYXMsIENvdXJpZXIsIG1vbm9zcGFjZTtcbiAgICAgIHdpZHRoOiA5MTFweDtcbiAgICB9XG4gICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtbWFyZ2luIHtcbiAgICAgIHdpZHRoOiAxMDFweDtcbiAgICB9XG4gICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtY29udGVudCB7XG4gICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgICB0b3A6IDBweDtcbiAgICAgIGxlZnQ6IDBweDtcbiAgICAgIGZsZXgtZ3JvdzogMTtcbiAgICAgIG92ZXJmbG93LXg6IHNjcm9sbDtcbiAgICB9XG4gICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtY29udGVudC13cmFwcGVyIHtcbiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgIHRvcDogMHB4O1xuICAgICAgbGVmdDogMHB4O1xuICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICBhbGlnbi1pdGVtczogc3RyZXRjaDtcbiAgICB9XG4gICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtbGVmdCB7XG4gICAgICB3aWR0aDogNTBweDtcbiAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgIGNvbG9yOiAjNDg0ODQ4O1xuICAgIH1cbiAgICBkaXYuZG1wLWxpbmUtY29tcGFyZS1lcXVhbD5kaXYuZG1wLWxpbmUtY29tcGFyZS1sZWZ0LFxuICAgICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtZXF1YWw+ZGl2LmRtcC1saW5lLWNvbXBhcmUtcmlnaHQge1xuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2RlZGVkZTtcbiAgICB9XG4gICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtaW5zZXJ0PmRpdi5kbXAtbGluZS1jb21wYXJlLWxlZnQsXG4gICAgICBkaXYuZG1wLWxpbmUtY29tcGFyZS1pbnNlcnQ+ZGl2LmRtcC1saW5lLWNvbXBhcmUtcmlnaHQge1xuICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzhiZmI2ZjtcbiAgICB9XG4gICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtZGVsZXRlPmRpdi5kbXAtbGluZS1jb21wYXJlLWxlZnQsXG4gICAgICBkaXYuZG1wLWxpbmUtY29tcGFyZS1kZWxldGU+ZGl2LmRtcC1saW5lLWNvbXBhcmUtcmlnaHQge1xuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2Y1Njg2ODtcbiAgICB9XG4gICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtcmlnaHQge1xuICAgICAgd2lkdGg6IDUwcHg7XG4gICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgICBjb2xvcjogIzQ4NDg0ODtcbiAgICAgIGJvcmRlci1yaWdodDogMXB4IHNvbGlkICM4ODg4ODg7XG4gICAgfVxuICAgIGRpdi5kbXAtbGluZS1jb21wYXJlLXRleHQge1xuICAgICAgd2hpdGUtc3BhY2U6IHByZTtcbiAgICAgIHBhZGRpbmctbGVmdDogMTBweDtcbiAgICAgIG1pbi13aWR0aDogODAwcHg7XG4gICAgfVxuICAgIC5kbXAtbGluZS1jb21wYXJlLWRlbGV0ZSB7XG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmY4YzhjO1xuICAgIH1cbiAgICAuZG1wLWxpbmUtY29tcGFyZS1pbnNlcnQge1xuICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzlkZmY5NztcbiAgICB9XG4gICAgLmRtcC1saW5lLWNvbXBhcmUtZGVsZXRlPmRpdiB7XG4gICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gICAgfSAgXG4gICAgLmRtcC1saW5lLWNvbXBhcmUtaW5zZXJ0PmRpdiB7XG4gICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gICAgfVxuICAgIC5kbXAtbGluZS1jb21wYXJlLWVxdWFsPmRpdiB7XG4gICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gICAgfVxuICAgIC5kbXAtbWFyZ2luLWJvdHRvbS1zcGFjZXIge1xuICAgICAgaGVpZ2h0OiAyMHB4O1xuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2RlZGVkZTtcbiAgICAgIGJvcmRlci1yaWdodDogMXB4IHNvbGlkICM4ODg4ODg7XG4gICAgfVxuICBgXSxcbiAgdGVtcGxhdGU6IGBcbiAgICA8ZGl2IGNsYXNzPVwiZG1wLWxpbmUtY29tcGFyZS1uby1jaGFuZ2VzLXRleHRcIiAqbmdJZj1cImlzQ29udGVudEVxdWFsXCI+XG4gICAgICBUaGVyZSBhcmUgbm8gY2hhbmdlcyB0byBkaXNwbGF5LlxuICAgIDwvZGl2PiAgICBcbiAgICA8ZGl2IGNsYXNzPVwiZG1wLWxpbmUtY29tcGFyZVwiICpuZ0lmPVwiIWlzQ29udGVudEVxdWFsXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiZG1wLWxpbmUtY29tcGFyZS1tYXJnaW5cIj5cbiAgICAgICAgPGRpdiBbbmdDbGFzc109XCJsaW5lRGlmZlswXVwiICpuZ0Zvcj1cImxldCBsaW5lRGlmZiBvZiBjYWxjdWxhdGVkRGlmZlwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJkbXAtbGluZS1jb21wYXJlLWxlZnRcIj57e2xpbmVEaWZmWzFdfX08L2Rpdj48IS0tIE5vIHNwYWNlXG4gICAgICAgIC0tPjxkaXYgY2xhc3M9XCJkbXAtbGluZS1jb21wYXJlLXJpZ2h0XCI+e3tsaW5lRGlmZlsyXX19PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZG1wLW1hcmdpbi1ib3R0b20tc3BhY2VyXCI+PC9kaXY+XG4gICAgICA8L2Rpdj48IS0tIE5vIHNwYWNlXG4gICAtLT48ZGl2IGNsYXNzPVwiZG1wLWxpbmUtY29tcGFyZS1jb250ZW50XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJkbXAtbGluZS1jb21wYXJlLWNvbnRlbnQtd3JhcHBlclwiPlxuICAgICAgICAgIDxkaXYgW25nQ2xhc3NdPVwibGluZURpZmZbMF1cIiAqbmdGb3I9XCJsZXQgbGluZURpZmYgb2YgY2FsY3VsYXRlZERpZmZcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJkbXAtbGluZS1jb21wYXJlLXRleHRcIj57e2xpbmVEaWZmWzNdfX08L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgYFxufSlcbmV4cG9ydCBjbGFzcyBMaW5lQ29tcGFyZUNvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCwgT25DaGFuZ2VzIHtcbiAgQElucHV0KClcbiAgcHVibGljIGxlZnQ6IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW47XG4gIEBJbnB1dCgpXG4gIHB1YmxpYyByaWdodDogc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbjtcbiAgLy8gVGhlIG51bWJlciBvZiBsaW5lcyBvZiBjb250ZXh0IHRvIHByb3ZpZGUgZWl0aGVyIHNpZGUgb2YgYSBEaWZmT3AuSW5zZXJ0IG9yIERpZmZPcC5EZWxldGUgZGlmZi5cbiAgLy8gQ29udGV4dCBpcyB0YWtlbiBmcm9tIGEgRGlmZk9wLkVxdWFsIHNlY3Rpb24uXG4gIEBJbnB1dCgpXG4gIHB1YmxpYyBsaW5lQ29udGV4dFNpemU6IG51bWJlcjtcblxuICBwdWJsaWMgY2FsY3VsYXRlZERpZmY6IEFycmF5PFtzdHJpbmcsIHN0cmluZywgc3RyaW5nLCBzdHJpbmddPjtcbiAgcHVibGljIGlzQ29udGVudEVxdWFsOiBib29sZWFuO1xuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgZG1wOiBEaWZmTWF0Y2hQYXRjaFNlcnZpY2UpIHt9XG5cbiAgcHVibGljIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMudXBkYXRlSHRtbCgpO1xuICB9XG5cbiAgcHVibGljIG5nT25DaGFuZ2VzKCk6IHZvaWQge1xuICAgIHRoaXMudXBkYXRlSHRtbCgpO1xuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVIdG1sKCk6IHZvaWQge1xuICAgIGlmICh0eXBlb2YgdGhpcy5sZWZ0ID09PSAnbnVtYmVyJyB8fCB0eXBlb2YgdGhpcy5sZWZ0ID09PSAnYm9vbGVhbicpIHtcbiAgICAgIHRoaXMubGVmdCA9IHRoaXMubGVmdC50b1N0cmluZygpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHRoaXMucmlnaHQgPT09ICdudW1iZXInIHx8IHR5cGVvZiB0aGlzLnJpZ2h0ID09PSAnYm9vbGVhbicpIHtcbiAgICAgIHRoaXMucmlnaHQgPSB0aGlzLnJpZ2h0LnRvU3RyaW5nKCk7XG4gICAgfVxuICAgIHRoaXMuY2FsY3VsYXRlTGluZURpZmYodGhpcy5kbXAuZ2V0TGluZURpZmYodGhpcy5sZWZ0LCB0aGlzLnJpZ2h0KSk7XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZUxpbmVEaWZmKGRpZmZzOiBBcnJheTxEaWZmPik6IHZvaWQge1xuICAgIGNvbnN0IGRpZmZDYWxjdWxhdGlvbjogRGlmZkNhbGN1bGF0aW9uID0ge1xuICAgICAgbGluZXM6IFtdLFxuICAgICAgbGluZUxlZnQ6IDEsXG4gICAgICBsaW5lUmlnaHQ6IDFcbiAgICB9O1xuXG4gICAgdGhpcy5pc0NvbnRlbnRFcXVhbCA9IGRpZmZzLmxlbmd0aCA9PT0gMSAmJiBkaWZmc1swXVswXSA9PT0gRGlmZk9wLkVxdWFsO1xuICAgIGlmICh0aGlzLmlzQ29udGVudEVxdWFsKSB7XG4gICAgICB0aGlzLmNhbGN1bGF0ZWREaWZmID0gW107XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaWZmcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGlmZiA9IGRpZmZzW2ldO1xuICAgICAgbGV0IGRpZmZMaW5lczogc3RyaW5nW10gPSBkaWZmWzFdLnNwbGl0KC9cXHI/XFxuLyk7XG5cbiAgICAgIC8vIElmIHRoZSBvcmlnaW5hbCBsaW5lIGhhZCBhIFxcclxcbiBhdCB0aGUgZW5kIHRoZW4gcmVtb3ZlIHRoZVxuICAgICAgLy8gZW1wdHkgc3RyaW5nIGFmdGVyIGl0LlxuICAgICAgaWYgKGRpZmZMaW5lc1tkaWZmTGluZXMubGVuZ3RoIC0gMV0ubGVuZ3RoID09IDApIHtcbiAgICAgICAgZGlmZkxpbmVzLnBvcCgpO1xuICAgICAgfVxuXG4gICAgICBzd2l0Y2ggKGRpZmZbMF0pIHtcbiAgICAgICAgY2FzZSBEaWZmT3AuRXF1YWw6IHtcbiAgICAgICAgICBjb25zdCBpc0ZpcnN0RGlmZiA9IGkgPT09IDA7XG4gICAgICAgICAgY29uc3QgaXNMYXN0RGlmZiA9IGkgPT09IGRpZmZzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgdGhpcy5vdXRwdXRFcXVhbERpZmYoZGlmZkxpbmVzLCBkaWZmQ2FsY3VsYXRpb24sIGlzRmlyc3REaWZmLCBpc0xhc3REaWZmKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIERpZmZPcC5EZWxldGU6IHtcbiAgICAgICAgICB0aGlzLm91dHB1dERlbGV0ZURpZmYoZGlmZkxpbmVzLCBkaWZmQ2FsY3VsYXRpb24pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgRGlmZk9wLkluc2VydDoge1xuICAgICAgICAgIHRoaXMub3V0cHV0SW5zZXJ0RGlmZihkaWZmTGluZXMsIGRpZmZDYWxjdWxhdGlvbik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmNhbGN1bGF0ZWREaWZmID0gZGlmZkNhbGN1bGF0aW9uLmxpbmVzO1xuICB9XG5cbiAgLyogSWYgdGhlIG51bWJlciBvZiBkaWZmTGluZXMgaXMgZ3JlYXRlciB0aGFuIGxpbmVDb250ZXh0U2l6ZSB0aGVuIHdlIG1heSBuZWVkIHRvIGFkanVzdCB0aGUgZGlmZlxuICAgKiB0aGF0IGlzIG91dHB1dC5cbiAgICogICA+IElmIHRoZSBmaXJzdCBkaWZmIG9mIGEgZG9jdW1lbnQgaXMgRGlmZk9wLkVxdWFsIHRoZW4gdGhlIGxlYWRpbmcgbGluZXMgY2FuIGJlIGRyb3BwZWRcbiAgICogICAgIGxlYXZpbmcgdGhlIGxhc3QgJ2xpbmVDb250ZXh0U2l6ZScgbGluZXMgZm9yIGNvbnRleHQuXG4gICAqICAgPiBJZiB0aGUgbGFzdCBkaWZmIG9mIGEgZG9jdW1lbnQgaXMgRGlmZk9wLkVxdWFsIHRoZW4gdGhlIHRyYWlsaW5nIGxpbmVzIGNhbiBiZSBkcm9wcGVkXG4gICAqICAgICBsZWF2aW5nIHRoZSBmaXJzdCAnbGluZUNvbnRleHRTaXplJyBsaW5lcyBmb3IgY29udGV4dC5cbiAgICogICA+IElmIHRoZSBkaWZmIGlzIGEgRGlmZk9wLkVxdWFsIG9jY3VycyBpbiB0aGUgbWlkZGxlIHRoZW4gdGhlIGRpZmZzIGVpdGhlciBzaWRlIG9mIGl0IG11c3QgYmVcbiAgICogICAgIERpZmZPcC5JbnNlcnQgb3IgRGlmZk9wLkRlbGV0ZS4gSWYgaXQgaGFzIG1vcmUgdGhhbiAyICogJ2xpbmVDb250ZXh0U2l6ZScgbGluZXMgb2YgY29udGVudFxuICAgKiAgICAgdGhlbiB0aGUgbWlkZGxlIGxpbmVzIGFyZSBkcm9wcGVkIGxlYXZpbmcgdGhlIGZpcnN0ICdsaW5lQ29udGV4dFNpemUnIGFuZCBsYXN0ICdsaW5lQ29udGV4dFNpemUnXG4gICAqICAgICBsaW5lcyBmb3IgY29udGV4dC4gQSBzcGVjaWFsIGxpbmUgaXMgaW5zZXJ0ZWQgd2l0aCAnLi4uJyBpbmRpY2F0aW5nIHRoYXQgY29udGVudCBpcyBza2lwcGVkLlxuICAgKlxuICAgKiBBIGRvY3VtZW50IGNhbm5vdCBjb25zaXN0IG9mIGEgc2luZ2xlIERpZmYgd2l0aCBEaWZmT3AuRXF1YWwgYW5kIHJlYWNoIHRoaXMgZnVuY3Rpb24gYmVjYXVzZVxuICAgKiBpbiB0aGlzIGNhc2UgdGhlIGNhbGN1bGF0ZUxpbmVEaWZmIG1ldGhvZCByZXR1cm5zIGVhcmx5LlxuICAgKi9cbiAgcHJpdmF0ZSBvdXRwdXRFcXVhbERpZmYoXG4gICAgICBkaWZmTGluZXM6IHN0cmluZ1tdLFxuICAgICAgZGlmZkNhbGN1bGF0aW9uOiBEaWZmQ2FsY3VsYXRpb24sXG4gICAgICBpc0ZpcnN0RGlmZjogYm9vbGVhbixcbiAgICAgIGlzTGFzdERpZmY6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBpZiAodGhpcy5saW5lQ29udGV4dFNpemUgJiYgZGlmZkxpbmVzLmxlbmd0aCA+IHRoaXMubGluZUNvbnRleHRTaXplKSB7XG4gICAgICBpZiAoaXNGaXJzdERpZmYpIHtcbiAgICAgICAgLy8gVGFrZSB0aGUgbGFzdCAnbGluZUNvbnRleHRTaXplJyBsaW5lcyBmcm9tIHRoZSBmaXJzdCBkaWZmXG4gICAgICAgIGNvbnN0IGxpbmVJbmNyZW1lbnQgPSBkaWZmTGluZXMubGVuZ3RoIC0gdGhpcy5saW5lQ29udGV4dFNpemU7XG4gICAgICAgIGRpZmZDYWxjdWxhdGlvbi5saW5lTGVmdCArPSBsaW5lSW5jcmVtZW50O1xuICAgICAgICBkaWZmQ2FsY3VsYXRpb24ubGluZVJpZ2h0ICs9IGxpbmVJbmNyZW1lbnQ7XG4gICAgICAgIGRpZmZMaW5lcyA9IGRpZmZMaW5lcy5zbGljZShkaWZmTGluZXMubGVuZ3RoIC0gdGhpcy5saW5lQ29udGV4dFNpemUsIGRpZmZMaW5lcy5sZW5ndGgpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoaXNMYXN0RGlmZikge1xuICAgICAgICAvLyBUYWtlIG9ubHkgdGhlIGZpcnN0ICdsaW5lQ29udGV4dFNpemUnIGxpbmVzIGZyb20gdGhlIGZpbmFsIGRpZmZcbiAgICAgICAgZGlmZkxpbmVzID0gZGlmZkxpbmVzLnNsaWNlKDAsIHRoaXMubGluZUNvbnRleHRTaXplKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGRpZmZMaW5lcy5sZW5ndGggPiAyICogdGhpcy5saW5lQ29udGV4dFNpemUpIHtcbiAgICAgICAgLy8gVGFrZSB0aGUgZmlyc3QgJ2xpbmVDb250ZXh0U2l6ZScgbGluZXMgZnJvbSB0aGlzIGRpZmYgdG8gcHJvdmlkZSBjb250ZXh0IGZvciB0aGUgbGFzdCBkaWZmXG4gICAgICAgIHRoaXMub3V0cHV0RXF1YWxEaWZmTGluZXMoZGlmZkxpbmVzLnNsaWNlKDAsIHRoaXMubGluZUNvbnRleHRTaXplKSwgZGlmZkNhbGN1bGF0aW9uKTtcblxuICAgICAgICAvLyBPdXRwdXQgYSBzcGVjaWFsIGxpbmUgaW5kaWNhdGluZyB0aGF0IHNvbWUgY29udGVudCBpcyBlcXVhbCBhbmQgaGFzIGJlZW4gc2tpcHBlZFxuICAgICAgICBkaWZmQ2FsY3VsYXRpb24ubGluZXMucHVzaChbJ2RtcC1saW5lLWNvbXBhcmUtZXF1YWwnLCAnLi4uJywgJy4uLicsICcuLi4nXSk7XG4gICAgICAgIGNvbnN0IG51bWJlck9mU2tpcHBlZExpbmVzID0gZGlmZkxpbmVzLmxlbmd0aCAtICgyICogdGhpcy5saW5lQ29udGV4dFNpemUpO1xuICAgICAgICBkaWZmQ2FsY3VsYXRpb24ubGluZUxlZnQgKz0gbnVtYmVyT2ZTa2lwcGVkTGluZXM7XG4gICAgICAgIGRpZmZDYWxjdWxhdGlvbi5saW5lUmlnaHQgKz0gbnVtYmVyT2ZTa2lwcGVkTGluZXM7XG5cbiAgICAgICAgLy8gVGFrZSB0aGUgbGFzdCAnbGluZUNvbnRleHRTaXplJyBsaW5lcyBmcm9tIHRoaXMgZGlmZiB0byBwcm92aWRlIGNvbnRleHQgZm9yIHRoZSBuZXh0IGRpZmZcbiAgICAgICAgdGhpcy5vdXRwdXRFcXVhbERpZmZMaW5lcyhkaWZmTGluZXMuc2xpY2UoZGlmZkxpbmVzLmxlbmd0aCAtIHRoaXMubGluZUNvbnRleHRTaXplKSwgZGlmZkNhbGN1bGF0aW9uKTtcbiAgICAgICAgLy8gVGhpcyBpZiBicmFuY2ggaGFzIGFscmVhZHkgb3V0cHV0IHRoZSBkaWZmIGxpbmVzIHNvIHdlIHJldHVybiBlYXJseSB0byBhdm9pZCBvdXRwdXR0aW5nIHRoZSBsaW5lc1xuICAgICAgICAvLyBhdCB0aGUgZW5kIG9mIHRoZSBtZXRob2QuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5vdXRwdXRFcXVhbERpZmZMaW5lcyhkaWZmTGluZXMsIGRpZmZDYWxjdWxhdGlvbik7XG4gIH1cblxuICBwcml2YXRlIG91dHB1dEVxdWFsRGlmZkxpbmVzKFxuICAgICAgZGlmZkxpbmVzOiBzdHJpbmdbXSxcbiAgICAgIGRpZmZDYWxjdWxhdGlvbjogRGlmZkNhbGN1bGF0aW9uKTogdm9pZCB7XG4gICAgZm9yIChjb25zdCBsaW5lIG9mIGRpZmZMaW5lcykge1xuICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVzLnB1c2goWydkbXAtbGluZS1jb21wYXJlLWVxdWFsJywgYCR7ZGlmZkNhbGN1bGF0aW9uLmxpbmVMZWZ0fWAsIGAke2RpZmZDYWxjdWxhdGlvbi5saW5lUmlnaHR9YCwgbGluZV0pO1xuICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVMZWZ0Kys7XG4gICAgICBkaWZmQ2FsY3VsYXRpb24ubGluZVJpZ2h0Kys7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBvdXRwdXREZWxldGVEaWZmKFxuICAgICAgZGlmZkxpbmVzOiBzdHJpbmdbXSxcbiAgICAgIGRpZmZDYWxjdWxhdGlvbjogRGlmZkNhbGN1bGF0aW9uKTogdm9pZCB7XG4gICAgZm9yIChjb25zdCBsaW5lIG9mIGRpZmZMaW5lcykge1xuICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVzLnB1c2goWydkbXAtbGluZS1jb21wYXJlLWRlbGV0ZScsIGAke2RpZmZDYWxjdWxhdGlvbi5saW5lTGVmdH1gLCAnLScsIGxpbmVdKTtcbiAgICAgIGRpZmZDYWxjdWxhdGlvbi5saW5lTGVmdCsrO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb3V0cHV0SW5zZXJ0RGlmZihcbiAgICAgIGRpZmZMaW5lczogc3RyaW5nW10sXG4gICAgICBkaWZmQ2FsY3VsYXRpb246IERpZmZDYWxjdWxhdGlvbik6IHZvaWQge1xuICAgIGZvciAoY29uc3QgbGluZSBvZiBkaWZmTGluZXMpIHtcbiAgICAgIGRpZmZDYWxjdWxhdGlvbi5saW5lcy5wdXNoKFsnZG1wLWxpbmUtY29tcGFyZS1pbnNlcnQnLCAnLScsIGAke2RpZmZDYWxjdWxhdGlvbi5saW5lUmlnaHR9YCwgbGluZV0pO1xuICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVSaWdodCsrO1xuICAgIH1cbiAgfVxufVxuIl19