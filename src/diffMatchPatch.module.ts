import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiffDirective } from './diff.directive';
import { LineDiffDirective } from './lineDiff.directive';
import { ProcessingDiffDirective } from './processingDiff.directive';
import { SemanticDiffDirective } from './semanticDiff.directive';
import { LineCompareComponent } from './lineCompare.component';

import { DiffMatchPatch } from './diffMatchPatch';
import { DiffMatchPatchService } from './diffMatchPatch.service';

@NgModule({
  declarations: [
    DiffDirective,
    LineDiffDirective,
    ProcessingDiffDirective,
    SemanticDiffDirective,
    LineCompareComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    DiffDirective,
    LineDiffDirective,
    ProcessingDiffDirective,
    SemanticDiffDirective,
    LineCompareComponent
  ],
  providers: [
    DiffMatchPatch,
    DiffMatchPatchService
  ]
})
export class DiffMatchPatchModule { }
