import { NgModule } from '@angular/core';
import { DiffDirective } from './diff.directive';
import { LineDiffDirective } from './lineDiff.directive';
import { ProcessingDiffDirective } from './processingDiff.directive';
import { SemanticDiffDirective } from './semanticDiff.directive';

import { DiffMatchPatch } from './diffMatchPatch';
import { DiffMatchPatchService } from './diffMatchPatch.service';

@NgModule({
  declarations: [
    DiffDirective,
    LineDiffDirective,
    ProcessingDiffDirective,
    SemanticDiffDirective
  ],
  exports: [
    DiffDirective,
    LineDiffDirective,
    ProcessingDiffDirective,
    SemanticDiffDirective
  ],
  providers: [
    DiffMatchPatch,
    DiffMatchPatchService
  ]
})
export class DiffMatchPatchModule { }
