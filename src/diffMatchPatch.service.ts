import { Injectable } from '@angular/core';
import { DiffMatchPatch } from './diffMatchPatch';

@Injectable()
export class DiffMatchPatchService {

  constructor(private dmp: DiffMatchPatch) {   }

  ngOnInit () {
    
  }

  getDiff(left: string, right: string) {
     return this.dmp.diff_main(left, right);
  }

  cleanupSemantic(intraDiffs: any) {
    return this.dmp.diff_cleanupSemantic(intraDiffs);
  }

  getPrettyHtml(diffs: any) {
    return this.dmp.diff_prettyHtml(diffs);
  }

  getDmp() {
    return this.dmp;
  }

}
