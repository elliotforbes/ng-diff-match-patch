import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { Diff, DiffOp } from './diffMatchPatch';
import { DiffMatchPatchService } from './diffMatchPatch.service';

/* Holds the state of the calculation of the diff result we intend to display.
 *  > lines contains the data that will be displayed on screen.
 *  > lineLeft keeps track of the document line number in the [left] input.
 *  > lineRight keeps track of the document line number in the [right] input.
 */
type DiffCalculation = {
  lines: Array<[string, string, string, string]>,
  lineLeft: number,
  lineRight: number
};

@Component({
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
})
export class LineCompareComponent implements OnInit, OnChanges {
  @Input()
  public left: string | number | boolean;
  @Input()
  public right: string | number | boolean;
  // The number of lines of context to provide either side of a DiffOp.Insert or DiffOp.Delete diff.
  // Context is taken from a DiffOp.Equal section.
  @Input()
  public lineContextSize: number;

  public calculatedDiff: Array<[string, string, string]>;
  public isContentEqual: boolean;

  public constructor(
      private dmp: DiffMatchPatchService) {}

  public ngOnInit(): void {
    this.updateHtml();
  }

  public ngOnChanges(): void {
    this.updateHtml();
  }

  private updateHtml(): void {
    if (typeof this.left === 'number' || typeof this.left === 'boolean') {
      this.left = this.left.toString();
    }
    if (typeof this.right === 'number' || typeof this.right === 'boolean') {
      this.right = this.right.toString();
    }
    this.calculateLineDiff(this.dmp.getLineDiff(this.left, this.right));
  }

  private calculateLineDiff(diffs: Array<Diff>): void {
    const diffCalculation: DiffCalculation = {
      lines: [],
      lineLeft: 1,
      lineRight: 1
    };

    this.isContentEqual = diffs.length === 1 && diffs[0][0] === DiffOp.Equal;
    if (this.isContentEqual) {
      this.calculatedDiff = [];
      return;
    }

    for (let i = 0; i < diffs.length; i++) {
      const diff = diffs[i];
      let diffLines: string[] = diff[1].split(/\r?\n/);

      // If the original line had a \r\n at the end then remove the
      // empty string after it.
      if (diffLines[diffLines.length - 1].length == 0) {
        diffLines.pop();
      }

      switch (diff[0]) {
        case DiffOp.Equal: {
          const isFirstDiff = i === 0;
          const isLastDiff = i === diffs.length - 1;
          this.outputEqualDiff(diffLines, diffCalculation, isFirstDiff, isLastDiff);
          break;
        }
        case DiffOp.Delete: {
          this.outputDeleteDiff(diffLines, diffCalculation);
          break;
        }
        case DiffOp.Insert: {
          this.outputInsertDiff(diffLines, diffCalculation);
          break;
        }
      }
    }

    this.calculatedDiff = diffCalculation.lines;
  }

  /* If the number of diffLines is greater than lineContextSize then we may need to adjust the diff
   * that is output.
   *   > If the first diff of a document is DiffOp.Equal then the leading lines can be dropped
   *     leaving the last 'lineContextSize' lines for context.
   *   > If the last diff of a document is DiffOp.Equal then the trailing lines can be dropped
   *     leaving the first 'lineContextSize' lines for context.
   *   > If the diff is a DiffOp.Equal occurs in the middle then the diffs either side of it must be
   *     DiffOp.Insert or DiffOp.Delete. If it has more than 2 * 'lineContextSize' lines of content
   *     then the middle lines are dropped leaving the first 'lineContextSize' and last 'lineContextSize'
   *     lines for context. A special line is inserted with '...' indicating that content is skipped.
   *
   * A document cannot consist of a single Diff with DiffOp.Equal and reach this function because
   * in this case the calculateLineDiff method returns early.
   */
  private outputEqualDiff(
      diffLines: string[],
      diffCalculation: DiffCalculation,
      isFirstDiff: boolean,
      isLastDiff: boolean): void {
    if (this.lineContextSize && diffLines.length > this.lineContextSize) {
      if (isFirstDiff) {
        // Take the last 'lineContextSize' lines from the first diff
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

  private outputEqualDiffLines(
      diffLines: string[],
      diffCalculation: DiffCalculation): void {
    for (const line of diffLines) {
      diffCalculation.lines.push(['dmp-line-compare-equal', `${diffCalculation.lineLeft}`, `${diffCalculation.lineRight}`, line]);
      diffCalculation.lineLeft++;
      diffCalculation.lineRight++;
    }
  }

  private outputDeleteDiff(
      diffLines: string[],
      diffCalculation: DiffCalculation): void {
    for (const line of diffLines) {
      diffCalculation.lines.push(['dmp-line-compare-delete', `${diffCalculation.lineLeft}`, '-', line]);
      diffCalculation.lineLeft++;
    }
  }

  private outputInsertDiff(
      diffLines: string[],
      diffCalculation: DiffCalculation): void {
    for (const line of diffLines) {
      diffCalculation.lines.push(['dmp-line-compare-insert', '-', `${diffCalculation.lineRight}`, line]);
      diffCalculation.lineRight++;
    }
  }
}
