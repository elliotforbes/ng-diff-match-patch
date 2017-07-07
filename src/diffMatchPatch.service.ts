import { Injectable } from '@angular/core';
import { DiffMatchPatch, DiffOp } from './diffMatchPatch';

@Injectable()
export class DiffMatchPatchService {

  constructor(private dmp: DiffMatchPatch) {   }

  ngOnInit () {
    
  }

  getDiff(left: string, right: string) {
     return this.dmp.diff_main(left, right);
  }

  getSemanticDiff(left: string, right: string) {
    const diffs = this.dmp.diff_main(left, right);
    this.dmp.diff_cleanupSemantic(diffs);
    return diffs;
  }

  getProcessingDiff(left: string, right: string) {
    const diffs = this.dmp.diff_main(left, right);
    this.dmp.diff_cleanupEfficiency(diffs);
    return diffs;
  }

  getLineDiff(left: string, right: string) {
    const chars = this.dmp.diff_linesToChars_(left, right);
    const diffs = this.dmp.diff_main(chars.chars1, chars.chars2, false);
    this.dmp.diff_charsToLines_(diffs, chars.lineArray);
    return diffs;
  }

  getDmp() {
    return this.dmp;
  }

}
