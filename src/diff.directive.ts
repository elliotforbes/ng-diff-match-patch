import { Directive, ElementRef, Input } from '@angular/core';
import { DiffMatchPatchService } from './diffMatchPatch.service';

@Directive({
  selector: '[diff]'
})
export class DiffDirective {

  @Input() left: string;
  @Input() right: string;

  constructor(private el: ElementRef, private dmp: DiffMatchPatchService) {  }

  ngOnInit () {
    var diffs = this.dmp.getDiff(this.left, this.right);
    this.el.nativeElement.innerHTML = this.dmp.getPrettyHtml(this.dmp.getDiff(this.left, this.right));
  }
   

}