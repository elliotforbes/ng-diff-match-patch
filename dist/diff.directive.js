"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var diffMatchPatch_service_1 = require("./diffMatchPatch.service");
var diffMatchPatch_1 = require("./diffMatchPatch");
var DiffDirective = /** @class */ (function () {
    function DiffDirective(el, dmp) {
        this.el = el;
        this.dmp = dmp;
    }
    DiffDirective.prototype.ngOnInit = function () {
        this.updateHtml();
    };
    DiffDirective.prototype.ngOnChanges = function () {
        this.updateHtml();
    };
    DiffDirective.prototype.updateHtml = function () {
        this.el.nativeElement.innerHTML = this.createHtml(this.dmp.getDiff(this.left, this.right));
    };
    DiffDirective.prototype.createHtml = function (diffs) {
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
    DiffDirective.decorators = [
        { type: core_1.Directive, args: [{
                    selector: '[diff]'
                },] },
    ];
    /** @nocollapse */
    DiffDirective.ctorParameters = function () { return [
        { type: core_1.ElementRef, },
        { type: diffMatchPatch_service_1.DiffMatchPatchService, },
    ]; };
    DiffDirective.propDecorators = {
        "left": [{ type: core_1.Input },],
        "right": [{ type: core_1.Input },],
    };
    return DiffDirective;
}());
exports.DiffDirective = DiffDirective;
//# sourceMappingURL=diff.directive.js.map