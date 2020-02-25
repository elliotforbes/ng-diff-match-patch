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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZk1hdGNoUGF0Y2gubW9kdWxlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vbmctZGlmZi1tYXRjaC1wYXRjaC8iLCJzb3VyY2VzIjpbImxpYi9kaWZmTWF0Y2hQYXRjaC5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDekMsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUNqRCxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUN6RCxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUNyRSxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQUNqRSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUUvRCxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDbEQsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7Ozs7O2dCQUVoRSxRQUFRLFNBQUM7b0JBQ1IsWUFBWSxFQUFFO3dCQUNaLGFBQWE7d0JBQ2IsaUJBQWlCO3dCQUNqQix1QkFBdUI7d0JBQ3ZCLHFCQUFxQjt3QkFDckIsb0JBQW9CO3FCQUNyQjtvQkFDRCxPQUFPLEVBQUU7d0JBQ1AsWUFBWTtxQkFDYjtvQkFDRCxPQUFPLEVBQUU7d0JBQ1AsYUFBYTt3QkFDYixpQkFBaUI7d0JBQ2pCLHVCQUF1Qjt3QkFDdkIscUJBQXFCO3dCQUNyQixvQkFBb0I7cUJBQ3JCO29CQUNELFNBQVMsRUFBRTt3QkFDVCxjQUFjO3dCQUNkLHFCQUFxQjtxQkFDdEI7aUJBQ0Y7OytCQWpDRDs7U0FrQ2Esb0JBQW9CIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmdNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IHsgQ29tbW9uTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcclxuaW1wb3J0IHsgRGlmZkRpcmVjdGl2ZSB9IGZyb20gJy4vZGlmZi5kaXJlY3RpdmUnO1xyXG5pbXBvcnQgeyBMaW5lRGlmZkRpcmVjdGl2ZSB9IGZyb20gJy4vbGluZURpZmYuZGlyZWN0aXZlJztcclxuaW1wb3J0IHsgUHJvY2Vzc2luZ0RpZmZEaXJlY3RpdmUgfSBmcm9tICcuL3Byb2Nlc3NpbmdEaWZmLmRpcmVjdGl2ZSc7XHJcbmltcG9ydCB7IFNlbWFudGljRGlmZkRpcmVjdGl2ZSB9IGZyb20gJy4vc2VtYW50aWNEaWZmLmRpcmVjdGl2ZSc7XHJcbmltcG9ydCB7IExpbmVDb21wYXJlQ29tcG9uZW50IH0gZnJvbSAnLi9saW5lQ29tcGFyZS5jb21wb25lbnQnO1xyXG5cclxuaW1wb3J0IHsgRGlmZk1hdGNoUGF0Y2ggfSBmcm9tICcuL2RpZmZNYXRjaFBhdGNoJztcclxuaW1wb3J0IHsgRGlmZk1hdGNoUGF0Y2hTZXJ2aWNlIH0gZnJvbSAnLi9kaWZmTWF0Y2hQYXRjaC5zZXJ2aWNlJztcclxuXHJcbkBOZ01vZHVsZSh7XHJcbiAgZGVjbGFyYXRpb25zOiBbXHJcbiAgICBEaWZmRGlyZWN0aXZlLFxyXG4gICAgTGluZURpZmZEaXJlY3RpdmUsXHJcbiAgICBQcm9jZXNzaW5nRGlmZkRpcmVjdGl2ZSxcclxuICAgIFNlbWFudGljRGlmZkRpcmVjdGl2ZSxcclxuICAgIExpbmVDb21wYXJlQ29tcG9uZW50XHJcbiAgXSxcclxuICBpbXBvcnRzOiBbXHJcbiAgICBDb21tb25Nb2R1bGVcclxuICBdLFxyXG4gIGV4cG9ydHM6IFtcclxuICAgIERpZmZEaXJlY3RpdmUsXHJcbiAgICBMaW5lRGlmZkRpcmVjdGl2ZSxcclxuICAgIFByb2Nlc3NpbmdEaWZmRGlyZWN0aXZlLFxyXG4gICAgU2VtYW50aWNEaWZmRGlyZWN0aXZlLFxyXG4gICAgTGluZUNvbXBhcmVDb21wb25lbnRcclxuICBdLFxyXG4gIHByb3ZpZGVyczogW1xyXG4gICAgRGlmZk1hdGNoUGF0Y2gsXHJcbiAgICBEaWZmTWF0Y2hQYXRjaFNlcnZpY2VcclxuICBdXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBEaWZmTWF0Y2hQYXRjaE1vZHVsZSB7IH1cclxuIl19