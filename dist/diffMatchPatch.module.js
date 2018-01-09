"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var common_1 = require("@angular/common");
var diff_directive_1 = require("./diff.directive");
var lineDiff_directive_1 = require("./lineDiff.directive");
var processingDiff_directive_1 = require("./processingDiff.directive");
var semanticDiff_directive_1 = require("./semanticDiff.directive");
var lineCompare_component_1 = require("./lineCompare.component");
var diffMatchPatch_1 = require("./diffMatchPatch");
var diffMatchPatch_service_1 = require("./diffMatchPatch.service");
var DiffMatchPatchModule = /** @class */ (function () {
    function DiffMatchPatchModule() {
    }
    DiffMatchPatchModule.decorators = [
        { type: core_1.NgModule, args: [{
                    declarations: [
                        diff_directive_1.DiffDirective,
                        lineDiff_directive_1.LineDiffDirective,
                        processingDiff_directive_1.ProcessingDiffDirective,
                        semanticDiff_directive_1.SemanticDiffDirective,
                        lineCompare_component_1.LineCompareComponent
                    ],
                    imports: [
                        common_1.CommonModule
                    ],
                    exports: [
                        diff_directive_1.DiffDirective,
                        lineDiff_directive_1.LineDiffDirective,
                        processingDiff_directive_1.ProcessingDiffDirective,
                        semanticDiff_directive_1.SemanticDiffDirective,
                        lineCompare_component_1.LineCompareComponent
                    ],
                    providers: [
                        diffMatchPatch_1.DiffMatchPatch,
                        diffMatchPatch_service_1.DiffMatchPatchService
                    ]
                },] },
    ];
    /** @nocollapse */
    DiffMatchPatchModule.ctorParameters = function () { return []; };
    return DiffMatchPatchModule;
}());
exports.DiffMatchPatchModule = DiffMatchPatchModule;
//# sourceMappingURL=diffMatchPatch.module.js.map