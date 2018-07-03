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
var DiffMatchPatchModule = /** @class */ (function () {
    function DiffMatchPatchModule() {
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
    return DiffMatchPatchModule;
}());
export { DiffMatchPatchModule };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZk1hdGNoUGF0Y2gubW9kdWxlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vbmctZGlmZi1tYXRjaC1wYXRjaC8iLCJzb3VyY2VzIjpbImxpYi9kaWZmTWF0Y2hQYXRjaC5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDekMsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUNqRCxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUN6RCxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUNyRSxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQUNqRSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUUvRCxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDbEQsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7Ozs7O2dCQUVoRSxRQUFRLFNBQUM7b0JBQ1IsWUFBWSxFQUFFO3dCQUNaLGFBQWE7d0JBQ2IsaUJBQWlCO3dCQUNqQix1QkFBdUI7d0JBQ3ZCLHFCQUFxQjt3QkFDckIsb0JBQW9CO3FCQUNyQjtvQkFDRCxPQUFPLEVBQUU7d0JBQ1AsWUFBWTtxQkFDYjtvQkFDRCxPQUFPLEVBQUU7d0JBQ1AsYUFBYTt3QkFDYixpQkFBaUI7d0JBQ2pCLHVCQUF1Qjt3QkFDdkIscUJBQXFCO3dCQUNyQixvQkFBb0I7cUJBQ3JCO29CQUNELFNBQVMsRUFBRTt3QkFDVCxjQUFjO3dCQUNkLHFCQUFxQjtxQkFDdEI7aUJBQ0Y7OytCQWpDRDs7U0FrQ2Esb0JBQW9CIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmdNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IENvbW1vbk1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQgeyBEaWZmRGlyZWN0aXZlIH0gZnJvbSAnLi9kaWZmLmRpcmVjdGl2ZSc7XG5pbXBvcnQgeyBMaW5lRGlmZkRpcmVjdGl2ZSB9IGZyb20gJy4vbGluZURpZmYuZGlyZWN0aXZlJztcbmltcG9ydCB7IFByb2Nlc3NpbmdEaWZmRGlyZWN0aXZlIH0gZnJvbSAnLi9wcm9jZXNzaW5nRGlmZi5kaXJlY3RpdmUnO1xuaW1wb3J0IHsgU2VtYW50aWNEaWZmRGlyZWN0aXZlIH0gZnJvbSAnLi9zZW1hbnRpY0RpZmYuZGlyZWN0aXZlJztcbmltcG9ydCB7IExpbmVDb21wYXJlQ29tcG9uZW50IH0gZnJvbSAnLi9saW5lQ29tcGFyZS5jb21wb25lbnQnO1xuXG5pbXBvcnQgeyBEaWZmTWF0Y2hQYXRjaCB9IGZyb20gJy4vZGlmZk1hdGNoUGF0Y2gnO1xuaW1wb3J0IHsgRGlmZk1hdGNoUGF0Y2hTZXJ2aWNlIH0gZnJvbSAnLi9kaWZmTWF0Y2hQYXRjaC5zZXJ2aWNlJztcblxuQE5nTW9kdWxlKHtcbiAgZGVjbGFyYXRpb25zOiBbXG4gICAgRGlmZkRpcmVjdGl2ZSxcbiAgICBMaW5lRGlmZkRpcmVjdGl2ZSxcbiAgICBQcm9jZXNzaW5nRGlmZkRpcmVjdGl2ZSxcbiAgICBTZW1hbnRpY0RpZmZEaXJlY3RpdmUsXG4gICAgTGluZUNvbXBhcmVDb21wb25lbnRcbiAgXSxcbiAgaW1wb3J0czogW1xuICAgIENvbW1vbk1vZHVsZVxuICBdLFxuICBleHBvcnRzOiBbXG4gICAgRGlmZkRpcmVjdGl2ZSxcbiAgICBMaW5lRGlmZkRpcmVjdGl2ZSxcbiAgICBQcm9jZXNzaW5nRGlmZkRpcmVjdGl2ZSxcbiAgICBTZW1hbnRpY0RpZmZEaXJlY3RpdmUsXG4gICAgTGluZUNvbXBhcmVDb21wb25lbnRcbiAgXSxcbiAgcHJvdmlkZXJzOiBbXG4gICAgRGlmZk1hdGNoUGF0Y2gsXG4gICAgRGlmZk1hdGNoUGF0Y2hTZXJ2aWNlXG4gIF1cbn0pXG5leHBvcnQgY2xhc3MgRGlmZk1hdGNoUGF0Y2hNb2R1bGUgeyB9XG4iXX0=