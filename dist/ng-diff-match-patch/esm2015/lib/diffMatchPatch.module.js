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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZk1hdGNoUGF0Y2gubW9kdWxlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vbmctZGlmZi1tYXRjaC1wYXRjaC8iLCJzb3VyY2VzIjpbImxpYi9kaWZmTWF0Y2hQYXRjaC5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDekMsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUNqRCxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUN6RCxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUNyRSxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQUNqRSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUUvRCxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDbEQsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUF5QmpFLE1BQU07OztZQXZCTCxRQUFRLFNBQUM7Z0JBQ1IsWUFBWSxFQUFFO29CQUNaLGFBQWE7b0JBQ2IsaUJBQWlCO29CQUNqQix1QkFBdUI7b0JBQ3ZCLHFCQUFxQjtvQkFDckIsb0JBQW9CO2lCQUNyQjtnQkFDRCxPQUFPLEVBQUU7b0JBQ1AsWUFBWTtpQkFDYjtnQkFDRCxPQUFPLEVBQUU7b0JBQ1AsYUFBYTtvQkFDYixpQkFBaUI7b0JBQ2pCLHVCQUF1QjtvQkFDdkIscUJBQXFCO29CQUNyQixvQkFBb0I7aUJBQ3JCO2dCQUNELFNBQVMsRUFBRTtvQkFDVCxjQUFjO29CQUNkLHFCQUFxQjtpQkFDdEI7YUFDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5nTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBDb21tb25Nb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHsgRGlmZkRpcmVjdGl2ZSB9IGZyb20gJy4vZGlmZi5kaXJlY3RpdmUnO1xuaW1wb3J0IHsgTGluZURpZmZEaXJlY3RpdmUgfSBmcm9tICcuL2xpbmVEaWZmLmRpcmVjdGl2ZSc7XG5pbXBvcnQgeyBQcm9jZXNzaW5nRGlmZkRpcmVjdGl2ZSB9IGZyb20gJy4vcHJvY2Vzc2luZ0RpZmYuZGlyZWN0aXZlJztcbmltcG9ydCB7IFNlbWFudGljRGlmZkRpcmVjdGl2ZSB9IGZyb20gJy4vc2VtYW50aWNEaWZmLmRpcmVjdGl2ZSc7XG5pbXBvcnQgeyBMaW5lQ29tcGFyZUNvbXBvbmVudCB9IGZyb20gJy4vbGluZUNvbXBhcmUuY29tcG9uZW50JztcblxuaW1wb3J0IHsgRGlmZk1hdGNoUGF0Y2ggfSBmcm9tICcuL2RpZmZNYXRjaFBhdGNoJztcbmltcG9ydCB7IERpZmZNYXRjaFBhdGNoU2VydmljZSB9IGZyb20gJy4vZGlmZk1hdGNoUGF0Y2guc2VydmljZSc7XG5cbkBOZ01vZHVsZSh7XG4gIGRlY2xhcmF0aW9uczogW1xuICAgIERpZmZEaXJlY3RpdmUsXG4gICAgTGluZURpZmZEaXJlY3RpdmUsXG4gICAgUHJvY2Vzc2luZ0RpZmZEaXJlY3RpdmUsXG4gICAgU2VtYW50aWNEaWZmRGlyZWN0aXZlLFxuICAgIExpbmVDb21wYXJlQ29tcG9uZW50XG4gIF0sXG4gIGltcG9ydHM6IFtcbiAgICBDb21tb25Nb2R1bGVcbiAgXSxcbiAgZXhwb3J0czogW1xuICAgIERpZmZEaXJlY3RpdmUsXG4gICAgTGluZURpZmZEaXJlY3RpdmUsXG4gICAgUHJvY2Vzc2luZ0RpZmZEaXJlY3RpdmUsXG4gICAgU2VtYW50aWNEaWZmRGlyZWN0aXZlLFxuICAgIExpbmVDb21wYXJlQ29tcG9uZW50XG4gIF0sXG4gIHByb3ZpZGVyczogW1xuICAgIERpZmZNYXRjaFBhdGNoLFxuICAgIERpZmZNYXRjaFBhdGNoU2VydmljZVxuICBdXG59KVxuZXhwb3J0IGNsYXNzIERpZmZNYXRjaFBhdGNoTW9kdWxlIHsgfVxuIl19