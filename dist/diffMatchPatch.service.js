"use strict";
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
    DiffMatchPatchService.decorators = [
        { type: core_1.Injectable },
    ];
    /** @nocollapse */
    DiffMatchPatchService.ctorParameters = function () { return [
        { type: diffMatchPatch_1.DiffMatchPatch, },
    ]; };
    return DiffMatchPatchService;
}());
exports.DiffMatchPatchService = DiffMatchPatchService;
//# sourceMappingURL=diffMatchPatch.service.js.map