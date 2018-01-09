"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var diffMatchPatch_service_1 = require("./diffMatchPatch.service");
var diffMatchPatch_1 = require("./diffMatchPatch");
var SemanticDiffDirective = /** @class */ (function () {
    function SemanticDiffDirective(el, dmp) {
        this.el = el;
        this.dmp = dmp;
    }
    SemanticDiffDirective.prototype.ngOnInit = function () {
        this.updateHtml();
    };
    SemanticDiffDirective.prototype.ngOnChanges = function () {
        this.updateHtml();
    };
    SemanticDiffDirective.prototype.updateHtml = function () {
        if (!this.left) {
            this.left = "";
        }
        if (!this.right) {
            this.right = "";
        }
        if (typeof this.left === 'number' || typeof this.left === 'boolean') {
            this.left = this.left.toString();
        }
        if (typeof this.right === 'number' || typeof this.right === 'boolean') {
            this.right = this.right.toString();
        }
        this.el.nativeElement.innerHTML = this.createHtml(this.dmp.getSemanticDiff(this.left, this.right));
    };
    // TODO: Need to fix this for line diffs
    // TODO: Need to fix this for line diffs
    SemanticDiffDirective.prototype.createHtml = 
    // TODO: Need to fix this for line diffs
    function (diffs) {
        var html;
        html = '<div>';
        for (var _i = 0, diffs_1 = diffs; _i < diffs_1.length; _i++) {
            var diff = diffs_1[_i];
            diff[1] = diff[1].replace(/\n/g, '<br/>');
            if (diff[0] === 0 /* Equal */) {
                html += '<span class="equal">' + diff[1] + '</span>';
            }
            if (diff[0] === -1 /* Delete */) {
                html += '<del>' + diff[1] + '</del>';
            }
            if (diff[0] === 1 /* Insert */) {
                html += '<ins>' + diff[1] + '</ins>';
            }
        }
        html += '</div>';
        return html;
    };
    SemanticDiffDirective.decorators = [
        { type: core_1.Directive, args: [{
                    selector: '[semanticDiff]'
                },] },
    ];
    /** @nocollapse */
    SemanticDiffDirective.ctorParameters = function () { return [
        { type: core_1.ElementRef, },
        { type: diffMatchPatch_service_1.DiffMatchPatchService, },
    ]; };
    SemanticDiffDirective.propDecorators = {
        "left": [{ type: core_1.Input },],
        "right": [{ type: core_1.Input },],
    };
    return SemanticDiffDirective;
}());
exports.SemanticDiffDirective = SemanticDiffDirective;
//# sourceMappingURL=semanticDiff.directive.js.map