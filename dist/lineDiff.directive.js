"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var diffMatchPatch_service_1 = require("./diffMatchPatch.service");
var diffMatchPatch_1 = require("./diffMatchPatch");
var LineDiffDirective = /** @class */ (function () {
    function LineDiffDirective(el, dmp) {
        this.el = el;
        this.dmp = dmp;
    }
    LineDiffDirective.prototype.ngOnInit = function () {
        this.updateHtml();
    };
    LineDiffDirective.prototype.ngOnChanges = function () {
        this.updateHtml();
    };
    LineDiffDirective.prototype.updateHtml = function () {
        if (typeof this.left === 'number' || typeof this.left === 'boolean') {
            this.left = this.left.toString();
        }
        if (typeof this.right === 'number' || typeof this.right === 'boolean') {
            this.right = this.right.toString();
        }
        this.el.nativeElement.innerHTML = this.createHtml(this.dmp.getLineDiff(this.left, this.right));
    };
    // TODO: Need to fix this for line diffs
    // TODO: Need to fix this for line diffs
    LineDiffDirective.prototype.createHtml = 
    // TODO: Need to fix this for line diffs
    function (diffs) {
        var html;
        html = '<div>';
        for (var _i = 0, diffs_1 = diffs; _i < diffs_1.length; _i++) {
            var diff = diffs_1[_i];
            if (diff[0] === 0 /* Equal */) {
                html += '<span class="equal">' + diff[1] + '</span>';
            }
            if (diff[0] === -1 /* Delete */) {
                html += '<div class=\"del\"> - <del>' + diff[1] + '</del></div>\n';
            }
            if (diff[0] === 1 /* Insert */) {
                html += '<div class=\"ins\"> + <ins>' + diff[1] + '</ins></div>\n';
            }
        }
        html += '</div>';
        return html;
    };
    LineDiffDirective.decorators = [
        { type: core_1.Directive, args: [{
                    selector: '[lineDiff]',
                },] },
    ];
    /** @nocollapse */
    LineDiffDirective.ctorParameters = function () { return [
        { type: core_1.ElementRef, },
        { type: diffMatchPatch_service_1.DiffMatchPatchService, },
    ]; };
    LineDiffDirective.propDecorators = {
        "left": [{ type: core_1.Input },],
        "right": [{ type: core_1.Input },],
    };
    return LineDiffDirective;
}());
exports.LineDiffDirective = LineDiffDirective;
//# sourceMappingURL=lineDiff.directive.js.map