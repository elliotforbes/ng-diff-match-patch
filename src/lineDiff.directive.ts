import { Directive, ElementRef, Input } from '@angular/core';
import { DiffMatchPatchService } from './diffMatchPatch.service';

@Directive({
  selector: '[lineDiff]',

})
export class LineDiffDirective {
  @Input() left: string;
  @Input() right: string;

  constructor(private el: ElementRef, private dmp: DiffMatchPatchService) {  }

  ngOnInit () {
    this.el.nativeElement.innerHTML = this.createHtml(this.dmp.getLineDiff(this.left, this.right));
  }

  // TODO: Need to fix this for line diffs
  createHtml (diffs) {
    var html: string;
    html = "<div>"
    for(let diff of diffs) {
      if(diff[0] == 0) {
        html += diff[1];
      }
      if(diff[0] == -1) {
        html += "<del> - " + diff[1] + "</del>\n";
      }
      if(diff[0] == 1) {
        html += "<ins> + " + diff[1] + "</ins>\n";
      }
    }
    html += "</div>"
    return html;
  }
}