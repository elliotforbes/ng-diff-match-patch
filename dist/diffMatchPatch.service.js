"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var diffMatchPatch_1 = require("./diffMatchPatch");
var DiffMatchPatchService = /** @class */ (function () {
    function DiffMatchPatchService(dmp) {
        this.dmp = dmp;
    }
    DiffMatchPatchService.prototype.ngOnInit = function () {
    };
    DiffMatchPatchService.prototype.getDiff = function (left, right) {
        return this.dmp.diff_main(left, right);
    };
    DiffMatchPatchService.prototype.getSemanticDiff = function (left, right) {
        var diffs = this.dmp.diff_main(left, right);
        this.dmp.diff_cleanupSemantic(diffs);
        return diffs;
    };
    DiffMatchPatchService.prototype.getProcessingDiff = function (left, right) {
        var diffs = this.dmp.diff_main(left, right);
        this.dmp.diff_cleanupEfficiency(diffs);
        return diffs;
    };
    DiffMatchPatchService.prototype.getLineDiff = function (left, right) {
        var chars = this.dmp.diff_linesToChars_(left, right);
        var diffs = this.dmp.diff_main(chars.chars1, chars.chars2, false);
        this.dmp.diff_charsToLines_(diffs, chars.lineArray);
        return diffs;
    };
    DiffMatchPatchService.prototype.getDmp = function () {
        return this.dmp;
    };
    DiffMatchPatchService = __decorate([
        core_1.Injectable(),
        __metadata("design:paramtypes", [diffMatchPatch_1.DiffMatchPatch])
    ], DiffMatchPatchService);
    return DiffMatchPatchService;
}());
exports.DiffMatchPatchService = DiffMatchPatchService;
//# sourceMappingURL=diffMatchPatch.service.js.map