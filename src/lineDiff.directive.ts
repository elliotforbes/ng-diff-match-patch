import { Directive, Output, Input } from '@angular/core';

@Directive({
  selector: 'line-diff',

})
export class LineDiffDirective {
  @Input() oldText: string;
  @Input() newText: string;

  constructor() {

  }

  ngOnInit () {
    console.log(this.oldText);
    console.log(this.newText);
  }

}