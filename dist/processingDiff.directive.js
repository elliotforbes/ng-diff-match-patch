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
var ProcessingDiffDirective = /** @class */ (function () {
    function ProcessingDiffDirective(el, dmp) {
        this.el = el;
        this.dmp = dmp;
    }
    ProcessingDiffDirective.prototype.ngOnInit = function () {
        this.updateHtml();
    };
    ProcessingDiffDirective.prototype.ngOnChanges = function () {
        this.updateHtml();
    };
    ProcessingDiffDirective.prototype.updateHtml = function () {
        this.el.nativeElement.innerHTML = this.createHtml(this.dmp.getProcessingDiff(this.left, this.right));
    };
    // TODO: Need to fix this for line diffs
    ProcessingDiffDirective.prototype.createHtml = function (diffs) {
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
        __metadata("design:type", String)
    ], ProcessingDiffDirective.prototype, "left", void 0);
    __decorate([
        core_1.Input(),
        __metadata("design:type", String)
    ], ProcessingDiffDirective.prototype, "right", void 0);
    ProcessingDiffDirective = __decorate([
        core_1.Directive({
            selector: '[processingDiff]'
        }),
        __metadata("design:paramtypes", [core_1.ElementRef,
            diffMatchPatch_service_1.DiffMatchPatchService])
    ], ProcessingDiffDirective);
    return ProcessingDiffDirective;
}());
exports.ProcessingDiffDirective = ProcessingDiffDirective;
//# sourceMappingURL=processingDiff.directive.js.map