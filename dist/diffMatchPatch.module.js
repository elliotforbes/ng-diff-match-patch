"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
    DiffMatchPatchModule = __decorate([
        core_1.NgModule({
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
        })
    ], DiffMatchPatchModule);
    return DiffMatchPatchModule;
}());
exports.DiffMatchPatchModule = DiffMatchPatchModule;
//# sourceMappingURL=diffMatchPatch.module.js.map