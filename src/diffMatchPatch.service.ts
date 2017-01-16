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

  getSemanticDiff(left: string, right: string) {
    var diffs = this.dmp.diff_main(left, right);
    // this.dmp.diff_cleanupSemantic(diffs);
    return diffs;
  }

  getProcessingDiff(left: string, right: string) {
    var diffs = this.dmp.diff_main(left, right);
    // this.dmp.diff_cleanupEfficiency(diffs);
    return diffs;
  }

  getDmp() {
    return this.dmp;
  }

}
