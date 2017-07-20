import { Directive, ElementRef, Input, OnInit, OnChanges } from '@angular/core';
import { DiffMatchPatchService } from './diffMatchPatch.service';
import { Diff, DiffOp } from './diffMatchPatch';

@Directive({
  selector: '[lineDiff]',
})
export class LineDiffDirective implements OnInit, OnChanges {
  @Input() left: string | number | boolean;
  @Input() right: string | number | boolean;

  public constructor(
    private el: ElementRef,
    private dmp: DiffMatchPatchService) {  }

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
    this.el.nativeElement.innerHTML = this.createHtml(this.dmp.getLineDiff(this.left, this.right));
  }

  // TODO: Need to fix this for line diffs
  private createHtml(diffs: Array<Diff>): string {
    let html: string;
    html = '<div>';
    for (let diff of diffs) {
      if (diff[0] === DiffOp.Equal) {
        html += diff[1];
      }
      if (diff[0] === DiffOp.Delete) {
        html += '<div class=\"del\"> - <del>' + diff[1] + '</del></div>\n';
      }
      if (diff[0] === DiffOp.Insert) {
        html += '<div class=\"ins\"> + <ins>' + diff[1] + '</ins></div>\n';
      }
    }
    html += '</div>';
    return html;
  }
}
