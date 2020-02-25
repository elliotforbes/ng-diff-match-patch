/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiffDirective } from './diff.directive';
import { LineDiffDirective } from './lineDiff.directive';
import { ProcessingDiffDirective } from './processingDiff.directive';
import { SemanticDiffDirective } from './semanticDiff.directive';
import { LineCompareComponent } from './lineCompare.component';
import { DiffMatchPatch } from './diffMatchPatch';
import { DiffMatchPatchService } from './diffMatchPatch.service';
export class DiffMatchPatchModule {
}
DiffMatchPatchModule.decorators = [
    { type: NgModule, args: [{
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
            },] },
];

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZk1hdGNoUGF0Y2gubW9kdWxlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vbmctZGlmZi1tYXRjaC1wYXRjaC8iLCJzb3VyY2VzIjpbImxpYi9kaWZmTWF0Y2hQYXRjaC5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDekMsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUNqRCxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUN6RCxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUNyRSxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQUNqRSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUUvRCxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDbEQsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUF5QmpFLE1BQU07OztZQXZCTCxRQUFRLFNBQUM7Z0JBQ1IsWUFBWSxFQUFFO29CQUNaLGFBQWE7b0JBQ2IsaUJBQWlCO29CQUNqQix1QkFBdUI7b0JBQ3ZCLHFCQUFxQjtvQkFDckIsb0JBQW9CO2lCQUNyQjtnQkFDRCxPQUFPLEVBQUU7b0JBQ1AsWUFBWTtpQkFDYjtnQkFDRCxPQUFPLEVBQUU7b0JBQ1AsYUFBYTtvQkFDYixpQkFBaUI7b0JBQ2pCLHVCQUF1QjtvQkFDdkIscUJBQXFCO29CQUNyQixvQkFBb0I7aUJBQ3JCO2dCQUNELFNBQVMsRUFBRTtvQkFDVCxjQUFjO29CQUNkLHFCQUFxQjtpQkFDdEI7YUFDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5nTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7IENvbW1vbk1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XHJcbmltcG9ydCB7IERpZmZEaXJlY3RpdmUgfSBmcm9tICcuL2RpZmYuZGlyZWN0aXZlJztcclxuaW1wb3J0IHsgTGluZURpZmZEaXJlY3RpdmUgfSBmcm9tICcuL2xpbmVEaWZmLmRpcmVjdGl2ZSc7XHJcbmltcG9ydCB7IFByb2Nlc3NpbmdEaWZmRGlyZWN0aXZlIH0gZnJvbSAnLi9wcm9jZXNzaW5nRGlmZi5kaXJlY3RpdmUnO1xyXG5pbXBvcnQgeyBTZW1hbnRpY0RpZmZEaXJlY3RpdmUgfSBmcm9tICcuL3NlbWFudGljRGlmZi5kaXJlY3RpdmUnO1xyXG5pbXBvcnQgeyBMaW5lQ29tcGFyZUNvbXBvbmVudCB9IGZyb20gJy4vbGluZUNvbXBhcmUuY29tcG9uZW50JztcclxuXHJcbmltcG9ydCB7IERpZmZNYXRjaFBhdGNoIH0gZnJvbSAnLi9kaWZmTWF0Y2hQYXRjaCc7XHJcbmltcG9ydCB7IERpZmZNYXRjaFBhdGNoU2VydmljZSB9IGZyb20gJy4vZGlmZk1hdGNoUGF0Y2guc2VydmljZSc7XHJcblxyXG5ATmdNb2R1bGUoe1xyXG4gIGRlY2xhcmF0aW9uczogW1xyXG4gICAgRGlmZkRpcmVjdGl2ZSxcclxuICAgIExpbmVEaWZmRGlyZWN0aXZlLFxyXG4gICAgUHJvY2Vzc2luZ0RpZmZEaXJlY3RpdmUsXHJcbiAgICBTZW1hbnRpY0RpZmZEaXJlY3RpdmUsXHJcbiAgICBMaW5lQ29tcGFyZUNvbXBvbmVudFxyXG4gIF0sXHJcbiAgaW1wb3J0czogW1xyXG4gICAgQ29tbW9uTW9kdWxlXHJcbiAgXSxcclxuICBleHBvcnRzOiBbXHJcbiAgICBEaWZmRGlyZWN0aXZlLFxyXG4gICAgTGluZURpZmZEaXJlY3RpdmUsXHJcbiAgICBQcm9jZXNzaW5nRGlmZkRpcmVjdGl2ZSxcclxuICAgIFNlbWFudGljRGlmZkRpcmVjdGl2ZSxcclxuICAgIExpbmVDb21wYXJlQ29tcG9uZW50XHJcbiAgXSxcclxuICBwcm92aWRlcnM6IFtcclxuICAgIERpZmZNYXRjaFBhdGNoLFxyXG4gICAgRGlmZk1hdGNoUGF0Y2hTZXJ2aWNlXHJcbiAgXVxyXG59KVxyXG5leHBvcnQgY2xhc3MgRGlmZk1hdGNoUGF0Y2hNb2R1bGUgeyB9XHJcbiJdfQ==