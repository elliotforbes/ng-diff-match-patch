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
var diffMatchPatch_service_1 = require("./diffMatchPatch.service");
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
    SemanticDiffDirective.prototype.createHtml = function (diffs) {
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
    __decorate([
        core_1.Input(),
        __metadata("design:type", Object)
    ], SemanticDiffDirective.prototype, "left", void 0);
    __decorate([
        core_1.Input(),
        __metadata("design:type", Object)
    ], SemanticDiffDirective.prototype, "right", void 0);
    SemanticDiffDirective = __decorate([
        core_1.Directive({
            selector: '[semanticDiff]'
        }),
        __metadata("design:paramtypes", [core_1.ElementRef,
            diffMatchPatch_service_1.DiffMatchPatchService])
    ], SemanticDiffDirective);
    return SemanticDiffDirective;
}());
exports.SemanticDiffDirective = SemanticDiffDirective;
//# sourceMappingURL=semanticDiff.directive.js.map