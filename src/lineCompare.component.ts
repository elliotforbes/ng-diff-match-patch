import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { Diff, DiffOp } from './diffMatchPatch';
import { DiffMatchPatchService } from './diffMatchPatch.service';

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
    <div class="dmp-line-compare">
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

  public calculatedDiff: Array<[string, string, string]>;

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
    let lineLeft: number = 1;
    let lineRight: number = 1;

    const lines: Array<[string, string, string, string]> = [];
    for (const diff of diffs) {
      const diffLines: string[] = diff[1].split(/\r?\n/);

      // If the original line had a \r\n at the end then remove the
      // empty string after it.
      if (diffLines[diffLines.length - 1].length == 0) {
        diffLines.pop();
      }

      switch (diff[0]) {
        case DiffOp.Equal: {
          for (const line of diffLines) {
            lines.push(['dmp-line-compare-equal', `${lineLeft}`, `${lineRight}`, line]);
            lineLeft++;
            lineRight++;
          }
          break;
        }
        case DiffOp.Delete: {
          for (const line of diffLines) {
            lines.push(['dmp-line-compare-delete', `${lineLeft}`, '-', line]);
            lineLeft++;
          }
          break;
        }
        case DiffOp.Insert: {
          for (const line of diffLines) {
            lines.push(['dmp-line-compare-insert', '-', `${lineRight}`, line]);
            lineRight++;
          }
          break;
        }
      }
    }

    this.calculatedDiff = lines;
  }
}
