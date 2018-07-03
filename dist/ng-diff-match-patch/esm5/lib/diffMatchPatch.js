/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/** @enum {number} */
var DiffOp = {
    Delete: -1,
    Equal: 0,
    Insert: 1,
};
export { DiffOp };
/** @typedef {?} */
var Diff;
export { Diff };
/**
 * Class containing the diff, match and patch methods.
 */
var /**
 * Class containing the diff, match and patch methods.
 */
DiffMatchPatch = /** @class */ (function () {
    function DiffMatchPatch() {
        // Defaults.
        // Redefine these in your program to override the defaults.
        // Number of seconds to map a diff before giving up (0 for infinity).
        this.Diff_Timeout = 1.0;
        // Cost of an empty edit operation in terms of edit characters.
        this.Diff_EditCost = 4;
        // At what point is no match declared (0.0 = perfection, 1.0 = very loose).
        this.Match_Threshold = 0.5;
        // How far to search for a match (0 = exact location, 1000+ = broad match).
        // A match this many characters away from the expected location will add
        // 1.0 to the score (0.0 is a perfect match).
        this.Match_Distance = 1000;
        // When deleting a large block of text (over ~64 characters), how close do
        // the contents have to be to match the expected contents. (0.0 = perfection,
        // 1.0 = very loose).  Note that Match_Threshold controls how closely the
        // end points of a delete need to match.
        this.Patch_DeleteThreshold = 0.5;
        // Chunk size for context length.
        this.Patch_Margin = 4;
        // The number of bits in an int.
        this.Match_MaxBits = 32;
        /**
         * The data structure representing a diff is an array of tuples:
         * [[DiffOp.Delete, 'Hello'], [DiffOp.Insert, 'Goodbye'], [DiffOp.Equal, ' world.']]
         * which means: delete 'Hello', add 'Goodbye' and keep ' world.'
         */
        this.whitespaceRegex_ = new RegExp('/\s/');
        this.linebreakRegex_ = new RegExp('/[\r\n]/');
        this.blanklineEndRegex_ = new RegExp('/\n\r?\n$/');
        this.blanklineStartRegex_ = new RegExp('/^\r?\n\r?\n/');
        /**
         * Convert a diff array into a pretty HTML report.
         * @param diffs Array of diff tuples.
         * @return HTML representation.
         */
        this.diff_prettyHtml = function (diffs) {
            /** @type {?} */
            var html = [];
            /** @type {?} */
            var pattern_amp = /&/g;
            /** @type {?} */
            var pattern_lt = /</g;
            /** @type {?} */
            var pattern_gt = />/g;
            /** @type {?} */
            var pattern_para = /\n/g;
            for (var x = 0; x < diffs.length; x++) {
                /** @type {?} */
                var op = diffs[x][0];
                /** @type {?} */
                var data = diffs[x][1];
                /** @type {?} */
                var text = data.replace(pattern_amp, '&amp;').replace(pattern_lt, '&lt;')
                    .replace(pattern_gt, '&gt;').replace(pattern_para, '&para;<br>');
                switch (op) {
                    case 1 /* Insert */:
                        html[x] = '<ins style="background:#e6ffe6;">' + text + '</ins>';
                        break;
                    case -1 /* Delete */:
                        html[x] = '<del style="background:#ffe6e6;">' + text + '</del>';
                        break;
                    case 0 /* Equal */:
                        html[x] = '<span>' + text + '</span>';
                        break;
                }
            }
            return html.join('');
        };
        /**
         * Look through the patches and break up any which are longer than the maximum
         * limit of the match algorithm.
         * Intended to be called only from within patch_apply.
         * @param patches Array of Patch objects.
         */
        this.patch_splitMax = function (patches) {
            /** @type {?} */
            var patch_size = this.Match_MaxBits;
            for (var x = 0; x < patches.length; x++) {
                if (patches[x].length1 <= patch_size) {
                    continue;
                }
                /** @type {?} */
                var bigpatch = patches[x];
                // Remove the big old patch.
                patches.splice(x--, 1);
                /** @type {?} */
                var start1 = bigpatch.start1;
                /** @type {?} */
                var start2 = bigpatch.start2;
                /** @type {?} */
                var precontext = '';
                while (bigpatch.diffs.length !== 0) {
                    /** @type {?} */
                    var patch = new patch_obj();
                    /** @type {?} */
                    var empty = true;
                    patch.start1 = start1 - precontext.length;
                    patch.start2 = start2 - precontext.length;
                    if (precontext !== '') {
                        patch.length1 = patch.length2 = precontext.length;
                        patch.diffs.push([0 /* Equal */, precontext]);
                    }
                    while (bigpatch.diffs.length !== 0 &&
                        patch.length1 < patch_size - this.Patch_Margin) {
                        /** @type {?} */
                        var diff_type = bigpatch.diffs[0][0];
                        /** @type {?} */
                        var diff_text = bigpatch.diffs[0][1];
                        if (diff_type === 1 /* Insert */) {
                            // Insertions are harmless.
                            patch.length2 += diff_text.length;
                            start2 += diff_text.length;
                            patch.diffs.push(bigpatch.diffs.shift());
                            empty = false;
                        }
                        else if (diff_type === -1 /* Delete */ && patch.diffs.length == 1 &&
                            patch.diffs[0][0] == 0 /* Equal */ &&
                            diff_text.length > 2 * patch_size) {
                            // This is a large deletion.  Let it pass in one chunk.
                            patch.length1 += diff_text.length;
                            start1 += diff_text.length;
                            empty = false;
                            patch.diffs.push([diff_type, diff_text]);
                            bigpatch.diffs.shift();
                        }
                        else {
                            // Deletion or equality.  Only take as much as we can stomach.
                            diff_text = diff_text.substring(0, patch_size - patch.length1 - this.Patch_Margin);
                            patch.length1 += diff_text.length;
                            start1 += diff_text.length;
                            if (diff_type === 0 /* Equal */) {
                                patch.length2 += diff_text.length;
                                start2 += diff_text.length;
                            }
                            else {
                                empty = false;
                            }
                            patch.diffs.push([diff_type, diff_text]);
                            if (diff_text == bigpatch.diffs[0][1]) {
                                bigpatch.diffs.shift();
                            }
                            else {
                                bigpatch.diffs[0][1] =
                                    bigpatch.diffs[0][1].substring(diff_text.length);
                            }
                        }
                    }
                    // Compute the head context for the next patch.
                    precontext = this.diff_text2(patch.diffs);
                    precontext =
                        precontext.substring(precontext.length - this.Patch_Margin);
                    /** @type {?} */
                    var postcontext = this.diff_text1(bigpatch.diffs)
                        .substring(0, this.Patch_Margin);
                    if (postcontext !== '') {
                        patch.length1 += postcontext.length;
                        patch.length2 += postcontext.length;
                        if (patch.diffs.length !== 0 &&
                            patch.diffs[patch.diffs.length - 1][0] === 0 /* Equal */) {
                            patch.diffs[patch.diffs.length - 1][1] += postcontext;
                        }
                        else {
                            patch.diffs.push([0 /* Equal */, postcontext]);
                        }
                    }
                    if (!empty) {
                        patches.splice(++x, 0, patch);
                    }
                }
            }
        };
    }
    /**
     * Find the differences between two texts.  Simplifies the problem by stripping
     * any common prefix or suffix off the texts before diffing.
     * @param  text1 Old string to be diffed.
     * @param  text2 New string to be diffed.
     * @param  opt_checklines Optional speedup flag. If present and false,
     *     then don't run a line-level diff first to identify the changed areas.
     *     Defaults to true, which does a faster, slightly less optimal diff.
     * @param  opt_deadline Optional time when the diff should be complete
     *     by.  Used internally for recursive calls.  Users should set DiffTimeout
     *     instead.
     * @return  Array of diff tuples.
     */
    /**
     * Find the differences between two texts.  Simplifies the problem by stripping
     * any common prefix or suffix off the texts before diffing.
     * @param {?} text1 Old string to be diffed.
     * @param {?} text2 New string to be diffed.
     * @param {?=} opt_checklines Optional speedup flag. If present and false,
     *     then don't run a line-level diff first to identify the changed areas.
     *     Defaults to true, which does a faster, slightly less optimal diff.
     * @param {?=} opt_deadline Optional time when the diff should be complete
     *     by.  Used internally for recursive calls.  Users should set DiffTimeout
     *     instead.
     * @return {?} Array of diff tuples.
     */
    DiffMatchPatch.prototype.diff_main = /**
     * Find the differences between two texts.  Simplifies the problem by stripping
     * any common prefix or suffix off the texts before diffing.
     * @param {?} text1 Old string to be diffed.
     * @param {?} text2 New string to be diffed.
     * @param {?=} opt_checklines Optional speedup flag. If present and false,
     *     then don't run a line-level diff first to identify the changed areas.
     *     Defaults to true, which does a faster, slightly less optimal diff.
     * @param {?=} opt_deadline Optional time when the diff should be complete
     *     by.  Used internally for recursive calls.  Users should set DiffTimeout
     *     instead.
     * @return {?} Array of diff tuples.
     */
    function (text1, text2, opt_checklines, opt_deadline) {
        // Set a deadline by which time the diff must be complete.
        if (typeof opt_deadline == 'undefined') {
            if (this.Diff_Timeout <= 0) {
                opt_deadline = Number.MAX_VALUE;
            }
            else {
                opt_deadline = (new Date).getTime() + this.Diff_Timeout * 1000;
            }
        }
        /** @type {?} */
        var deadline = opt_deadline;
        // Check for null inputs.
        if (text1 == null || text2 == null) {
            throw new Error('Null input. (diff_main)');
        }
        // Check for equality (speedup).
        if (text1 == text2) {
            if (text1) {
                return [[0 /* Equal */, text1]];
            }
            return [];
        }
        if (typeof opt_checklines == 'undefined') {
            opt_checklines = true;
        }
        /** @type {?} */
        var checklines = opt_checklines;
        /** @type {?} */
        var commonlength = this.diff_commonPrefix(text1, text2);
        /** @type {?} */
        var commonprefix = text1.substring(0, commonlength);
        text1 = text1.substring(commonlength);
        text2 = text2.substring(commonlength);
        // Trim off common suffix (speedup).
        commonlength = this.diff_commonSuffix(text1, text2);
        /** @type {?} */
        var commonsuffix = text1.substring(text1.length - commonlength);
        text1 = text1.substring(0, text1.length - commonlength);
        text2 = text2.substring(0, text2.length - commonlength);
        /** @type {?} */
        var diffs = this.diff_compute_(text1, text2, checklines, deadline);
        // Restore the prefix and suffix.
        if (commonprefix) {
            diffs.unshift([0 /* Equal */, commonprefix]);
        }
        if (commonsuffix) {
            diffs.push([0 /* Equal */, commonsuffix]);
        }
        this.diff_cleanupMerge(diffs);
        return diffs;
    };
    ;
    /**
     * Find the differences between two texts.  Assumes that the texts do not
     * have any common prefix or suffix.
     * @param  text1 Old string to be diffed.
     * @param  text2 New string to be diffed.
     * @param  checklines Speedup flag.  If false, then don't run a
     *     line-level diff first to identify the changed areas.
     *     If true, then run a faster, slightly less optimal diff.
     * @param  deadline Time when the diff should be complete by.
     * @return  Array of diff tuples.
  
     */
    /**
     * Find the differences between two texts.  Assumes that the texts do not
     * have any common prefix or suffix.
     * @param {?} text1 Old string to be diffed.
     * @param {?} text2 New string to be diffed.
     * @param {?} checklines Speedup flag.  If false, then don't run a
     *     line-level diff first to identify the changed areas.
     *     If true, then run a faster, slightly less optimal diff.
     * @param {?} deadline Time when the diff should be complete by.
     * @return {?} Array of diff tuples.
     */
    DiffMatchPatch.prototype.diff_compute_ = /**
     * Find the differences between two texts.  Assumes that the texts do not
     * have any common prefix or suffix.
     * @param {?} text1 Old string to be diffed.
     * @param {?} text2 New string to be diffed.
     * @param {?} checklines Speedup flag.  If false, then don't run a
     *     line-level diff first to identify the changed areas.
     *     If true, then run a faster, slightly less optimal diff.
     * @param {?} deadline Time when the diff should be complete by.
     * @return {?} Array of diff tuples.
     */
    function (text1, text2, checklines, deadline) {
        /** @type {?} */
        var diffs;
        if (!text1) {
            // Just add some text (speedup).
            return [[1 /* Insert */, text2]];
        }
        if (!text2) {
            // Just delete some text (speedup).
            return [[-1 /* Delete */, text1]];
        }
        /** @type {?} */
        var longtext = text1.length > text2.length ? text1 : text2;
        /** @type {?} */
        var shorttext = text1.length > text2.length ? text2 : text1;
        /** @type {?} */
        var i = longtext.indexOf(shorttext);
        if (i != -1) {
            // Shorter text is inside the longer text (speedup).
            diffs = [[1 /* Insert */, longtext.substring(0, i)],
                [0 /* Equal */, shorttext],
                [1 /* Insert */, longtext.substring(i + shorttext.length)]];
            // Swap insertions for deletions if diff is reversed.
            if (text1.length > text2.length) {
                diffs[0][0] = diffs[2][0] = -1 /* Delete */;
            }
            return diffs;
        }
        if (shorttext.length == 1) {
            // Single character string.
            // After the previous speedup, the character can't be an equality.
            return [[-1 /* Delete */, text1], [1 /* Insert */, text2]];
        }
        /** @type {?} */
        var hm = this.diff_halfMatch_(text1, text2);
        if (hm) {
            /** @type {?} */
            var text1_a = hm[0];
            /** @type {?} */
            var text1_b = hm[1];
            /** @type {?} */
            var text2_a = hm[2];
            /** @type {?} */
            var text2_b = hm[3];
            /** @type {?} */
            var mid_common = hm[4];
            /** @type {?} */
            var diffs_a = this.diff_main(text1_a, text2_a, checklines, deadline);
            /** @type {?} */
            var diffs_b = this.diff_main(text1_b, text2_b, checklines, deadline);
            // Merge the results.
            return diffs_a.concat([[0 /* Equal */, mid_common]], diffs_b);
        }
        if (checklines && text1.length > 100 && text2.length > 100) {
            return this.diff_lineMode_(text1, text2, deadline);
        }
        return this.diff_bisect_(text1, text2, deadline);
    };
    ;
    /**
     * Do a quick line-level diff on both strings, then rediff the parts for
     * greater accuracy.
     * This speedup can produce non-minimal diffs.
     * @param  text1 Old string to be diffed.
     * @param  text2 New string to be diffed.
     * @param  deadline Time when the diff should be complete by.
     * @return  Array of diff tuples.
  
     */
    /**
     * Do a quick line-level diff on both strings, then rediff the parts for
     * greater accuracy.
     * This speedup can produce non-minimal diffs.
     * @param {?} text1 Old string to be diffed.
     * @param {?} text2 New string to be diffed.
     * @param {?} deadline Time when the diff should be complete by.
     * @return {?} Array of diff tuples.
     */
    DiffMatchPatch.prototype.diff_lineMode_ = /**
     * Do a quick line-level diff on both strings, then rediff the parts for
     * greater accuracy.
     * This speedup can produce non-minimal diffs.
     * @param {?} text1 Old string to be diffed.
     * @param {?} text2 New string to be diffed.
     * @param {?} deadline Time when the diff should be complete by.
     * @return {?} Array of diff tuples.
     */
    function (text1, text2, deadline) {
        /** @type {?} */
        var a = this.diff_linesToChars_(text1, text2);
        text1 = a.chars1;
        text2 = a.chars2;
        /** @type {?} */
        var linearray = a.lineArray;
        /** @type {?} */
        var diffs = this.diff_main(text1, text2, false, deadline);
        // Convert the diff back to original text.
        this.diff_charsToLines_(diffs, linearray);
        // Eliminate freak matches (e.g. blank lines)
        this.diff_cleanupSemantic(diffs);
        // Rediff any replacement blocks, this time character-by-character.
        // Add a dummy entry at the end.
        diffs.push([0 /* Equal */, '']);
        /** @type {?} */
        var pointer = 0;
        /** @type {?} */
        var count_delete = 0;
        /** @type {?} */
        var count_insert = 0;
        /** @type {?} */
        var text_delete = '';
        /** @type {?} */
        var text_insert = '';
        while (pointer < diffs.length) {
            switch (diffs[pointer][0]) {
                case 1 /* Insert */:
                    count_insert++;
                    text_insert += diffs[pointer][1];
                    break;
                case -1 /* Delete */:
                    count_delete++;
                    text_delete += diffs[pointer][1];
                    break;
                case 0 /* Equal */:
                    // Upon reaching an equality, check for prior redundancies.
                    if (count_delete >= 1 && count_insert >= 1) {
                        // Delete the offending records and add the merged ones.
                        diffs.splice(pointer - count_delete - count_insert, count_delete + count_insert);
                        pointer = pointer - count_delete - count_insert;
                        /** @type {?} */
                        var b = this.diff_main(text_delete, text_insert, false, deadline);
                        for (var j = b.length - 1; j >= 0; j--) {
                            diffs.splice(pointer, 0, b[j]);
                        }
                        pointer = pointer + b.length;
                    }
                    count_insert = 0;
                    count_delete = 0;
                    text_delete = '';
                    text_insert = '';
                    break;
            }
            pointer++;
        }
        diffs.pop(); // Remove the dummy entry at the end.
        return diffs;
    };
    ;
    /**
     * Find the 'middle snake' of a diff, split the problem in two
     * and return the recursively constructed diff.
     * See Myers 1986 paper: An O(ND) Difference Algorithm and Its constiations.
     * @param  text1 Old string to be diffed.
     * @param  text2 New string to be diffed.
     * @param  deadline Time at which to bail if not yet complete.
     * @return  Array of diff tuples.
  
     */
    /**
     * Find the 'middle snake' of a diff, split the problem in two
     * and return the recursively constructed diff.
     * See Myers 1986 paper: An O(ND) Difference Algorithm and Its constiations.
     * @param {?} text1 Old string to be diffed.
     * @param {?} text2 New string to be diffed.
     * @param {?} deadline Time at which to bail if not yet complete.
     * @return {?} Array of diff tuples.
     */
    DiffMatchPatch.prototype.diff_bisect_ = /**
     * Find the 'middle snake' of a diff, split the problem in two
     * and return the recursively constructed diff.
     * See Myers 1986 paper: An O(ND) Difference Algorithm and Its constiations.
     * @param {?} text1 Old string to be diffed.
     * @param {?} text2 New string to be diffed.
     * @param {?} deadline Time at which to bail if not yet complete.
     * @return {?} Array of diff tuples.
     */
    function (text1, text2, deadline) {
        /** @type {?} */
        var text1_length = text1.length;
        /** @type {?} */
        var text2_length = text2.length;
        /** @type {?} */
        var max_d = Math.ceil((text1_length + text2_length) / 2);
        /** @type {?} */
        var v_offset = max_d;
        /** @type {?} */
        var v_length = 2 * max_d;
        /** @type {?} */
        var v1 = new Array(v_length);
        /** @type {?} */
        var v2 = new Array(v_length);
        // Setting all elements to -1 is faster in Chrome & Firefox than mixing
        // integers and undefined.
        for (var x = 0; x < v_length; x++) {
            v1[x] = -1;
            v2[x] = -1;
        }
        v1[v_offset + 1] = 0;
        v2[v_offset + 1] = 0;
        /** @type {?} */
        var delta = text1_length - text2_length;
        /** @type {?} */
        var front = (delta % 2 != 0);
        /** @type {?} */
        var k1start = 0;
        /** @type {?} */
        var k1end = 0;
        /** @type {?} */
        var k2start = 0;
        /** @type {?} */
        var k2end = 0;
        for (var d = 0; d < max_d; d++) {
            // Bail out if deadline is reached.
            if ((new Date()).getTime() > deadline) {
                break;
            }
            // Walk the front path one step.
            for (var k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
                /** @type {?} */
                var k1_offset = v_offset + k1;
                /** @type {?} */
                var x1 = void 0;
                if (k1 == -d || (k1 != d && v1[k1_offset - 1] < v1[k1_offset + 1])) {
                    x1 = v1[k1_offset + 1];
                }
                else {
                    x1 = v1[k1_offset - 1] + 1;
                }
                /** @type {?} */
                var y1 = x1 - k1;
                while (x1 < text1_length && y1 < text2_length &&
                    text1.charAt(x1) == text2.charAt(y1)) {
                    x1++;
                    y1++;
                }
                v1[k1_offset] = x1;
                if (x1 > text1_length) {
                    // Ran off the right of the graph.
                    k1end += 2;
                }
                else if (y1 > text2_length) {
                    // Ran off the bottom of the graph.
                    k1start += 2;
                }
                else if (front) {
                    /** @type {?} */
                    var k2_offset = v_offset + delta - k1;
                    if (k2_offset >= 0 && k2_offset < v_length && v2[k2_offset] != -1) {
                        /** @type {?} */
                        var x2 = text1_length - v2[k2_offset];
                        if (x1 >= x2) {
                            // Overlap detected.
                            return this.diff_bisectSplit_(text1, text2, x1, y1, deadline);
                        }
                    }
                }
            }
            // Walk the reverse path one step.
            for (var k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
                /** @type {?} */
                var k2_offset = v_offset + k2;
                /** @type {?} */
                var x2 = void 0;
                if (k2 == -d || (k2 != d && v2[k2_offset - 1] < v2[k2_offset + 1])) {
                    x2 = v2[k2_offset + 1];
                }
                else {
                    x2 = v2[k2_offset - 1] + 1;
                }
                /** @type {?} */
                var y2 = x2 - k2;
                while (x2 < text1_length && y2 < text2_length &&
                    text1.charAt(text1_length - x2 - 1) ==
                        text2.charAt(text2_length - y2 - 1)) {
                    x2++;
                    y2++;
                }
                v2[k2_offset] = x2;
                if (x2 > text1_length) {
                    // Ran off the left of the graph.
                    k2end += 2;
                }
                else if (y2 > text2_length) {
                    // Ran off the top of the graph.
                    k2start += 2;
                }
                else if (!front) {
                    /** @type {?} */
                    var k1_offset = v_offset + delta - k2;
                    if (k1_offset >= 0 && k1_offset < v_length && v1[k1_offset] != -1) {
                        /** @type {?} */
                        var x1 = v1[k1_offset];
                        /** @type {?} */
                        var y1 = v_offset + x1 - k1_offset;
                        // Mirror x2 onto top-left coordinate system.
                        x2 = text1_length - x2;
                        if (x1 >= x2) {
                            // Overlap detected.
                            return this.diff_bisectSplit_(text1, text2, x1, y1, deadline);
                        }
                    }
                }
            }
        }
        // Diff took too long and hit the deadline or
        // number of diffs equals number of characters, no commonality at all.
        return [[-1 /* Delete */, text1], [1 /* Insert */, text2]];
    };
    ;
    /**
     * Given the location of the 'middle snake', split the diff in two parts
     * and recurse.
     * @param  text1 Old string to be diffed.
     * @param  text2 New string to be diffed.
     * @param  x Index of split point in text1.
     * @param  y Index of split point in text2.
     * @param  deadline Time at which to bail if not yet complete.
     * @return  Array of diff tuples.
  
     */
    /**
     * Given the location of the 'middle snake', split the diff in two parts
     * and recurse.
     * @param {?} text1 Old string to be diffed.
     * @param {?} text2 New string to be diffed.
     * @param {?} x Index of split point in text1.
     * @param {?} y Index of split point in text2.
     * @param {?} deadline Time at which to bail if not yet complete.
     * @return {?} Array of diff tuples.
     */
    DiffMatchPatch.prototype.diff_bisectSplit_ = /**
     * Given the location of the 'middle snake', split the diff in two parts
     * and recurse.
     * @param {?} text1 Old string to be diffed.
     * @param {?} text2 New string to be diffed.
     * @param {?} x Index of split point in text1.
     * @param {?} y Index of split point in text2.
     * @param {?} deadline Time at which to bail if not yet complete.
     * @return {?} Array of diff tuples.
     */
    function (text1, text2, x, y, deadline) {
        /** @type {?} */
        var text1a = text1.substring(0, x);
        /** @type {?} */
        var text2a = text2.substring(0, y);
        /** @type {?} */
        var text1b = text1.substring(x);
        /** @type {?} */
        var text2b = text2.substring(y);
        /** @type {?} */
        var diffs = this.diff_main(text1a, text2a, false, deadline);
        /** @type {?} */
        var diffsb = this.diff_main(text1b, text2b, false, deadline);
        return diffs.concat(diffsb);
    };
    ;
    /**
     * Split two texts into an array of strings.  Reduce the texts to a string of
     * hashes where each Unicode character represents one line.
     * @param  text1 First string.
     * @param  text2 Second string.
     * @return }
     *     An object containing the encoded text1, the encoded text2 and
     *     the array of unique strings.
     *     The zeroth element of the array of unique strings is intentionally blank.
  
     */
    /**
     * Split two texts into an array of strings.  Reduce the texts to a string of
     * hashes where each Unicode character represents one line.
     * @param {?} text1 First string.
     * @param {?} text2 Second string.
     * @return {?} }
     *     An object containing the encoded text1, the encoded text2 and
     *     the array of unique strings.
     *     The zeroth element of the array of unique strings is intentionally blank.
     */
    DiffMatchPatch.prototype.diff_linesToChars_ = /**
     * Split two texts into an array of strings.  Reduce the texts to a string of
     * hashes where each Unicode character represents one line.
     * @param {?} text1 First string.
     * @param {?} text2 Second string.
     * @return {?} }
     *     An object containing the encoded text1, the encoded text2 and
     *     the array of unique strings.
     *     The zeroth element of the array of unique strings is intentionally blank.
     */
    function (text1, text2) {
        /** @type {?} */
        var lineArray = [];
        /** @type {?} */
        var lineHash = {}; // e.g. lineHash['Hello\n'] == 4
        // '\x00' is a valid character, but constious debuggers don't like it.
        // So we'll insert a junk entry to avoid generating a null character.
        lineArray[0] = '';
        /** @type {?} */
        var chars1 = this.diff_linesToCharsMunge_(text1, lineArray, lineHash);
        /** @type {?} */
        var chars2 = this.diff_linesToCharsMunge_(text2, lineArray, lineHash);
        return { chars1: chars1, chars2: chars2, lineArray: lineArray };
    };
    ;
    /**
     * Split a text into an array of strings.  Reduce the texts to a string of
     * hashes where each Unicode character represents one line.
     * Modifies linearray and linehash through being a closure.
     * @param  text String to encode.
     * @return  Encoded string.
  
     */
    /**
     * Split a text into an array of strings.  Reduce the texts to a string of
     * hashes where each Unicode character represents one line.
     * Modifies linearray and linehash through being a closure.
     * @param {?} text String to encode.
     * @param {?} lineArray
     * @param {?} lineHash
     * @return {?} Encoded string.
     */
    DiffMatchPatch.prototype.diff_linesToCharsMunge_ = /**
     * Split a text into an array of strings.  Reduce the texts to a string of
     * hashes where each Unicode character represents one line.
     * Modifies linearray and linehash through being a closure.
     * @param {?} text String to encode.
     * @param {?} lineArray
     * @param {?} lineHash
     * @return {?} Encoded string.
     */
    function (text, lineArray, lineHash) {
        /** @type {?} */
        var chars = '';
        /** @type {?} */
        var lineStart = 0;
        /** @type {?} */
        var lineEnd = -1;
        /** @type {?} */
        var lineArrayLength = lineArray.length;
        while (lineEnd < text.length - 1) {
            lineEnd = text.indexOf('\n', lineStart);
            if (lineEnd == -1) {
                lineEnd = text.length - 1;
            }
            /** @type {?} */
            var line = text.substring(lineStart, lineEnd + 1);
            lineStart = lineEnd + 1;
            if (lineHash.hasOwnProperty ? lineHash.hasOwnProperty(line) :
                (lineHash[line] !== undefined)) {
                chars += String.fromCharCode(lineHash[line]);
            }
            else {
                chars += String.fromCharCode(lineArrayLength);
                lineHash[line] = lineArrayLength;
                lineArray[lineArrayLength++] = line;
            }
        }
        return chars;
    };
    /**
     * Rehydrate the text in a diff from a string of line hashes to real lines of
     * text.
     * @param  diffs Array of diff tuples.
     * @param  lineArray Array of unique strings.
  
     */
    /**
     * Rehydrate the text in a diff from a string of line hashes to real lines of
     * text.
     * @param {?} diffs Array of diff tuples.
     * @param {?} lineArray Array of unique strings.
     * @return {?}
     */
    DiffMatchPatch.prototype.diff_charsToLines_ = /**
     * Rehydrate the text in a diff from a string of line hashes to real lines of
     * text.
     * @param {?} diffs Array of diff tuples.
     * @param {?} lineArray Array of unique strings.
     * @return {?}
     */
    function (diffs, lineArray) {
        for (var x = 0; x < diffs.length; x++) {
            /** @type {?} */
            var chars = diffs[x][1];
            /** @type {?} */
            var text = [];
            for (var y = 0; y < chars.length; y++) {
                text[y] = lineArray[chars.charCodeAt(y)];
            }
            diffs[x][1] = text.join('');
        }
    };
    ;
    /**
     * Determine the common prefix of two strings.
     * @param  text1 First string.
     * @param  text2 Second string.
     * @return  The number of characters common to the start of each
     *     string.
     */
    /**
     * Determine the common prefix of two strings.
     * @param {?} text1 First string.
     * @param {?} text2 Second string.
     * @return {?} The number of characters common to the start of each
     *     string.
     */
    DiffMatchPatch.prototype.diff_commonPrefix = /**
     * Determine the common prefix of two strings.
     * @param {?} text1 First string.
     * @param {?} text2 Second string.
     * @return {?} The number of characters common to the start of each
     *     string.
     */
    function (text1, text2) {
        // Quick check for common null cases.
        if (!text1 || !text2 || text1.charAt(0) != text2.charAt(0)) {
            return 0;
        }
        /** @type {?} */
        var pointermin = 0;
        /** @type {?} */
        var pointermax = Math.min(text1.length, text2.length);
        /** @type {?} */
        var pointermid = pointermax;
        /** @type {?} */
        var pointerstart = 0;
        while (pointermin < pointermid) {
            if (text1.substring(pointerstart, pointermid) ==
                text2.substring(pointerstart, pointermid)) {
                pointermin = pointermid;
                pointerstart = pointermin;
            }
            else {
                pointermax = pointermid;
            }
            pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
        }
        return pointermid;
    };
    ;
    /**
     * Determine the common suffix of two strings.
     * @param  text1 First string.
     * @param  text2 Second string.
     * @return  The number of characters common to the end of each string.
     */
    /**
     * Determine the common suffix of two strings.
     * @param {?} text1 First string.
     * @param {?} text2 Second string.
     * @return {?} The number of characters common to the end of each string.
     */
    DiffMatchPatch.prototype.diff_commonSuffix = /**
     * Determine the common suffix of two strings.
     * @param {?} text1 First string.
     * @param {?} text2 Second string.
     * @return {?} The number of characters common to the end of each string.
     */
    function (text1, text2) {
        // Quick check for common null cases.
        if (!text1 || !text2 ||
            text1.charAt(text1.length - 1) != text2.charAt(text2.length - 1)) {
            return 0;
        }
        /** @type {?} */
        var pointermin = 0;
        /** @type {?} */
        var pointermax = Math.min(text1.length, text2.length);
        /** @type {?} */
        var pointermid = pointermax;
        /** @type {?} */
        var pointerend = 0;
        while (pointermin < pointermid) {
            if (text1.substring(text1.length - pointermid, text1.length - pointerend) ==
                text2.substring(text2.length - pointermid, text2.length - pointerend)) {
                pointermin = pointermid;
                pointerend = pointermin;
            }
            else {
                pointermax = pointermid;
            }
            pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
        }
        return pointermid;
    };
    ;
    /**
     * Determine if the suffix of one string is the prefix of another.
     * @param  text1 First string.
     * @param  text2 Second string.
     * @return  The number of characters common to the end of the first
     *     string and the start of the second string.
  
     */
    /**
     * Determine if the suffix of one string is the prefix of another.
     * @param {?} text1 First string.
     * @param {?} text2 Second string.
     * @return {?} The number of characters common to the end of the first
     *     string and the start of the second string.
     */
    DiffMatchPatch.prototype.diff_commonOverlap_ = /**
     * Determine if the suffix of one string is the prefix of another.
     * @param {?} text1 First string.
     * @param {?} text2 Second string.
     * @return {?} The number of characters common to the end of the first
     *     string and the start of the second string.
     */
    function (text1, text2) {
        /** @type {?} */
        var text1_length = text1.length;
        /** @type {?} */
        var text2_length = text2.length;
        // Eliminate the null case.
        if (text1_length == 0 || text2_length == 0) {
            return 0;
        }
        // Truncate the longer string.
        if (text1_length > text2_length) {
            text1 = text1.substring(text1_length - text2_length);
        }
        else if (text1_length < text2_length) {
            text2 = text2.substring(0, text1_length);
        }
        /** @type {?} */
        var text_length = Math.min(text1_length, text2_length);
        // Quick check for the worst case.
        if (text1 == text2) {
            return text_length;
        }
        /** @type {?} */
        var best = 0;
        /** @type {?} */
        var length = 1;
        while (true) {
            /** @type {?} */
            var pattern = text1.substring(text_length - length);
            /** @type {?} */
            var found = text2.indexOf(pattern);
            if (found == -1) {
                return best;
            }
            length += found;
            if (found == 0 || text1.substring(text_length - length) ==
                text2.substring(0, length)) {
                best = length;
                length++;
            }
        }
    };
    ;
    /**
     * Do the two texts share a substring which is at least half the length of the
     * longer text?
     * This speedup can produce non-minimal diffs.
     * @param  text1 First string.
     * @param  text2 Second string.
     * @return  Five element Array, containing the prefix of
     *     text1, the suffix of text1, the prefix of text2, the suffix of
     *     text2 and the common middle.  Or null if there was no match.
  
     */
    /**
     * Do the two texts share a substring which is at least half the length of the
     * longer text?
     * This speedup can produce non-minimal diffs.
     * @param {?} text1 First string.
     * @param {?} text2 Second string.
     * @return {?} Five element Array, containing the prefix of
     *     text1, the suffix of text1, the prefix of text2, the suffix of
     *     text2 and the common middle.  Or null if there was no match.
     */
    DiffMatchPatch.prototype.diff_halfMatch_ = /**
     * Do the two texts share a substring which is at least half the length of the
     * longer text?
     * This speedup can produce non-minimal diffs.
     * @param {?} text1 First string.
     * @param {?} text2 Second string.
     * @return {?} Five element Array, containing the prefix of
     *     text1, the suffix of text1, the prefix of text2, the suffix of
     *     text2 and the common middle.  Or null if there was no match.
     */
    function (text1, text2) {
        if (this.Diff_Timeout <= 0) {
            // Don't risk returning a non-optimal diff if we have unlimited time.
            return null;
        }
        /** @type {?} */
        var longtext = text1.length > text2.length ? text1 : text2;
        /** @type {?} */
        var shorttext = text1.length > text2.length ? text2 : text1;
        if (longtext.length < 4 || shorttext.length * 2 < longtext.length) {
            return null; // Pointless.
        }
        /** @type {?} */
        var dmp = this;
        /** @type {?} */
        var hm1 = this.diff_halfMatchI_(longtext, shorttext, Math.ceil(longtext.length / 4), dmp);
        /** @type {?} */
        var hm2 = this.diff_halfMatchI_(longtext, shorttext, Math.ceil(longtext.length / 2), dmp);
        /** @type {?} */
        var hm;
        if (!hm1 && !hm2) {
            return null;
        }
        else if (!hm2) {
            hm = hm1;
        }
        else if (!hm1) {
            hm = hm2;
        }
        else {
            // Both matched.  Select the longest.
            hm = hm1[4].length > hm2[4].length ? hm1 : hm2;
        }
        /** @type {?} */
        var text1_a;
        /** @type {?} */
        var text1_b;
        /** @type {?} */
        var text2_a;
        /** @type {?} */
        var text2_b;
        if (text1.length > text2.length) {
            text1_a = hm[0];
            text1_b = hm[1];
            text2_a = hm[2];
            text2_b = hm[3];
        }
        else {
            text2_a = hm[0];
            text2_b = hm[1];
            text1_a = hm[2];
            text1_b = hm[3];
        }
        /** @type {?} */
        var mid_common = hm[4];
        return [text1_a, text1_b, text2_a, text2_b, mid_common];
    };
    ;
    /**
     * Does a substring of shorttext exist within longtext such that the substring
     * is at least half the length of longtext?
     * Closure, but does not reference any external constiables.
     * @param  longtext Longer string.
     * @param  shorttext Shorter string.
     * @param  i Start index of quarter length substring within longtext.
     * @return  Five element Array, containing the prefix of
     *     longtext, the suffix of longtext, the prefix of shorttext, the suffix
     *     of shorttext and the common middle.  Or null if there was no match.
  
     */
    /**
     * Does a substring of shorttext exist within longtext such that the substring
     * is at least half the length of longtext?
     * Closure, but does not reference any external constiables.
     * @param {?} longtext Longer string.
     * @param {?} shorttext Shorter string.
     * @param {?} i Start index of quarter length substring within longtext.
     * @param {?} dmp
     * @return {?} Five element Array, containing the prefix of
     *     longtext, the suffix of longtext, the prefix of shorttext, the suffix
     *     of shorttext and the common middle.  Or null if there was no match.
     */
    DiffMatchPatch.prototype.diff_halfMatchI_ = /**
     * Does a substring of shorttext exist within longtext such that the substring
     * is at least half the length of longtext?
     * Closure, but does not reference any external constiables.
     * @param {?} longtext Longer string.
     * @param {?} shorttext Shorter string.
     * @param {?} i Start index of quarter length substring within longtext.
     * @param {?} dmp
     * @return {?} Five element Array, containing the prefix of
     *     longtext, the suffix of longtext, the prefix of shorttext, the suffix
     *     of shorttext and the common middle.  Or null if there was no match.
     */
    function (longtext, shorttext, i, dmp) {
        /** @type {?} */
        var seed = longtext.substring(i, i + Math.floor(longtext.length / 4));
        /** @type {?} */
        var j = -1;
        /** @type {?} */
        var best_common = '';
        /** @type {?} */
        var best_longtext_a;
        /** @type {?} */
        var best_longtext_b;
        /** @type {?} */
        var best_shorttext_a;
        /** @type {?} */
        var best_shorttext_b;
        while ((j = shorttext.indexOf(seed, j + 1)) != -1) {
            /** @type {?} */
            var prefixLength = dmp.diff_commonPrefix(longtext.substring(i), shorttext.substring(j));
            /** @type {?} */
            var suffixLength = dmp.diff_commonSuffix(longtext.substring(0, i), shorttext.substring(0, j));
            if (best_common.length < suffixLength + prefixLength) {
                best_common = shorttext.substring(j - suffixLength, j) +
                    shorttext.substring(j, j + prefixLength);
                best_longtext_a = longtext.substring(0, i - suffixLength);
                best_longtext_b = longtext.substring(i + prefixLength);
                best_shorttext_a = shorttext.substring(0, j - suffixLength);
                best_shorttext_b = shorttext.substring(j + prefixLength);
            }
        }
        if (best_common.length * 2 >= longtext.length) {
            return [best_longtext_a, best_longtext_b,
                best_shorttext_a, best_shorttext_b, best_common];
        }
        else {
            return null;
        }
    };
    /**
     * Reduce the number of edits by eliminating semantically trivial equalities.
     * @param  diffs Array of diff tuples.
     */
    /**
     * Reduce the number of edits by eliminating semantically trivial equalities.
     * @param {?} diffs Array of diff tuples.
     * @return {?}
     */
    DiffMatchPatch.prototype.diff_cleanupSemantic = /**
     * Reduce the number of edits by eliminating semantically trivial equalities.
     * @param {?} diffs Array of diff tuples.
     * @return {?}
     */
    function (diffs) {
        /** @type {?} */
        var changes = false;
        /** @type {?} */
        var equalities = [];
        /** @type {?} */
        var equalitiesLength = 0;
        /** @type {?} */
        var lastequality = null;
        /** @type {?} */
        var pointer = 0;
        /** @type {?} */
        var length_insertions1 = 0;
        /** @type {?} */
        var length_deletions1 = 0;
        /** @type {?} */
        var length_insertions2 = 0;
        /** @type {?} */
        var length_deletions2 = 0;
        while (pointer < diffs.length) {
            if (diffs[pointer][0] == 0 /* Equal */) {
                // Equality found.
                equalities[equalitiesLength++] = pointer;
                length_insertions1 = length_insertions2;
                length_deletions1 = length_deletions2;
                length_insertions2 = 0;
                length_deletions2 = 0;
                lastequality = diffs[pointer][1];
            }
            else {
                // An insertion or deletion.
                if (diffs[pointer][0] == 1 /* Insert */) {
                    length_insertions2 += diffs[pointer][1].length;
                }
                else {
                    length_deletions2 += diffs[pointer][1].length;
                }
                // Eliminate an equality that is smaller or equal to the edits on both
                // sides of it.
                if (lastequality && (lastequality.length <=
                    Math.max(length_insertions1, length_deletions1)) &&
                    (lastequality.length <= Math.max(length_insertions2, length_deletions2))) {
                    // Duplicate record.
                    diffs.splice(equalities[equalitiesLength - 1], 0, [-1 /* Delete */, lastequality]);
                    // Change second copy to insert.
                    diffs[equalities[equalitiesLength - 1] + 1][0] = 1 /* Insert */;
                    // Throw away the equality we just deleted.
                    equalitiesLength--;
                    // Throw away the previous equality (it needs to be reevaluated).
                    equalitiesLength--;
                    pointer = equalitiesLength > 0 ? equalities[equalitiesLength - 1] : -1;
                    length_insertions1 = 0; // Reset the counters.
                    length_deletions1 = 0;
                    length_insertions2 = 0;
                    length_deletions2 = 0;
                    lastequality = null;
                    changes = true;
                }
            }
            pointer++;
        }
        // Normalize the diff.
        if (changes) {
            this.diff_cleanupMerge(diffs);
        }
        this.diff_cleanupSemanticLossless(diffs);
        // Find any overlaps between deletions and insertions.
        // e.g: <del>abcxxx</del><ins>xxxdef</ins>
        //   -> <del>abc</del>xxx<ins>def</ins>
        // e.g: <del>xxxabc</del><ins>defxxx</ins>
        //   -> <ins>def</ins>xxx<del>abc</del>
        // Only extract an overlap if it is as big as the edit ahead or behind it.
        pointer = 1;
        while (pointer < diffs.length) {
            if (diffs[pointer - 1][0] == -1 /* Delete */ &&
                diffs[pointer][0] == 1 /* Insert */) {
                /** @type {?} */
                var deletion = diffs[pointer - 1][1];
                /** @type {?} */
                var insertion = diffs[pointer][1];
                /** @type {?} */
                var overlap_length1 = this.diff_commonOverlap_(deletion, insertion);
                /** @type {?} */
                var overlap_length2 = this.diff_commonOverlap_(insertion, deletion);
                if (overlap_length1 >= overlap_length2) {
                    if (overlap_length1 >= deletion.length / 2 ||
                        overlap_length1 >= insertion.length / 2) {
                        // Overlap found.  Insert an equality and trim the surrounding edits.
                        diffs.splice(pointer, 0, [0 /* Equal */, insertion.substring(0, overlap_length1)]);
                        diffs[pointer - 1][1] =
                            deletion.substring(0, deletion.length - overlap_length1);
                        diffs[pointer + 1][1] = insertion.substring(overlap_length1);
                        pointer++;
                    }
                }
                else {
                    if (overlap_length2 >= deletion.length / 2 ||
                        overlap_length2 >= insertion.length / 2) {
                        // Reverse overlap found.
                        // Insert an equality and swap and trim the surrounding edits.
                        diffs.splice(pointer, 0, [0 /* Equal */, deletion.substring(0, overlap_length2)]);
                        diffs[pointer - 1][0] = 1 /* Insert */;
                        diffs[pointer - 1][1] =
                            insertion.substring(0, insertion.length - overlap_length2);
                        diffs[pointer + 1][0] = -1 /* Delete */;
                        diffs[pointer + 1][1] =
                            deletion.substring(overlap_length2);
                        pointer++;
                    }
                }
                pointer++;
            }
            pointer++;
        }
    };
    ;
    /**
     * Look for single edits surrounded on both sides by equalities
     * which can be shifted sideways to align the edit to a word boundary.
     * e.g: The c<ins>at c</ins>ame. -> The <ins>cat </ins>came.
     * @param  diffs Array of diff tuples.
     */
    /**
     * Look for single edits surrounded on both sides by equalities
     * which can be shifted sideways to align the edit to a word boundary.
     * e.g: The c<ins>at c</ins>ame. -> The <ins>cat </ins>came.
     * @param {?} diffs Array of diff tuples.
     * @return {?}
     */
    DiffMatchPatch.prototype.diff_cleanupSemanticLossless = /**
     * Look for single edits surrounded on both sides by equalities
     * which can be shifted sideways to align the edit to a word boundary.
     * e.g: The c<ins>at c</ins>ame. -> The <ins>cat </ins>came.
     * @param {?} diffs Array of diff tuples.
     * @return {?}
     */
    function (diffs) {
        /**
         * Given two strings, compute a score representing whether the internal
         * boundary falls on logical boundaries.
         * Scores range from 6 (best) to 0 (worst).
         * Closure, but does not reference any external constiables.
         * @param {?} one First string.
         * @param {?} two Second string.
         * @return {?} The score.
         */
        function diff_cleanupSemanticScore_(one, two) {
            if (!one || !two) {
                // Edges are the best.
                return 6;
            }
            /** @type {?} */
            var nonAlphaNumericRegex_ = new RegExp('/[^a-zA-Z0-9]/');
            /** @type {?} */
            var char1 = one.charAt(one.length - 1);
            /** @type {?} */
            var char2 = two.charAt(0);
            /** @type {?} */
            var nonAlphaNumeric1 = char1.match(nonAlphaNumericRegex_);
            /** @type {?} */
            var nonAlphaNumeric2 = char2.match(nonAlphaNumericRegex_);
            /** @type {?} */
            var whitespace1 = nonAlphaNumeric1 &&
                char1.match(this.whitespaceRegex_);
            /** @type {?} */
            var whitespace2 = nonAlphaNumeric2 &&
                char2.match(this.whitespaceRegex_);
            /** @type {?} */
            var lineBreak1 = whitespace1 &&
                char1.match(this.linebreakRegex_);
            /** @type {?} */
            var lineBreak2 = whitespace2 &&
                char2.match(this.linebreakRegex_);
            /** @type {?} */
            var blankLine1 = lineBreak1 &&
                one.match(this.blanklineEndRegex_);
            /** @type {?} */
            var blankLine2 = lineBreak2 &&
                two.match(this.blanklineStartRegex_);
            if (blankLine1 || blankLine2) {
                // Five points for blank lines.
                return 5;
            }
            else if (lineBreak1 || lineBreak2) {
                // Four points for line breaks.
                return 4;
            }
            else if (nonAlphaNumeric1 && !whitespace1 && whitespace2) {
                // Three points for end of sentences.
                return 3;
            }
            else if (whitespace1 || whitespace2) {
                // Two points for whitespace.
                return 2;
            }
            else if (nonAlphaNumeric1 || nonAlphaNumeric2) {
                // One point for non-alphanumeric.
                return 1;
            }
            return 0;
        }
        /** @type {?} */
        var pointer = 1;
        // Intentionally ignore the first and last element (don't need checking).
        while (pointer < diffs.length - 1) {
            if (diffs[pointer - 1][0] == 0 /* Equal */ &&
                diffs[pointer + 1][0] == 0 /* Equal */) {
                /** @type {?} */
                var equality1 = diffs[pointer - 1][1];
                /** @type {?} */
                var edit = diffs[pointer][1];
                /** @type {?} */
                var equality2 = diffs[pointer + 1][1];
                /** @type {?} */
                var commonOffset = this.diff_commonSuffix(equality1, edit);
                if (commonOffset) {
                    /** @type {?} */
                    var commonString = edit.substring(edit.length - commonOffset);
                    equality1 = equality1.substring(0, equality1.length - commonOffset);
                    edit = commonString + edit.substring(0, edit.length - commonOffset);
                    equality2 = commonString + equality2;
                }
                /** @type {?} */
                var bestEquality1 = equality1;
                /** @type {?} */
                var bestEdit = edit;
                /** @type {?} */
                var bestEquality2 = equality2;
                /** @type {?} */
                var bestScore = diff_cleanupSemanticScore_(equality1, edit) +
                    diff_cleanupSemanticScore_(edit, equality2);
                while (edit.charAt(0) === equality2.charAt(0)) {
                    equality1 += edit.charAt(0);
                    edit = edit.substring(1) + equality2.charAt(0);
                    equality2 = equality2.substring(1);
                    /** @type {?} */
                    var score = diff_cleanupSemanticScore_(equality1, edit) +
                        diff_cleanupSemanticScore_(edit, equality2);
                    // The >= encourages trailing rather than leading whitespace on edits.
                    if (score >= bestScore) {
                        bestScore = score;
                        bestEquality1 = equality1;
                        bestEdit = edit;
                        bestEquality2 = equality2;
                    }
                }
                if (diffs[pointer - 1][1] != bestEquality1) {
                    // We have an improvement, save it back to the diff.
                    if (bestEquality1) {
                        diffs[pointer - 1][1] = bestEquality1;
                    }
                    else {
                        diffs.splice(pointer - 1, 1);
                        pointer--;
                    }
                    diffs[pointer][1] = bestEdit;
                    if (bestEquality2) {
                        diffs[pointer + 1][1] = bestEquality2;
                    }
                    else {
                        diffs.splice(pointer + 1, 1);
                        pointer--;
                    }
                }
            }
            pointer++;
        }
    };
    ;
    /**
     * Reduce the number of edits by eliminating operationally trivial equalities.
     * @param  diffs Array of diff tuples.
     */
    /**
     * Reduce the number of edits by eliminating operationally trivial equalities.
     * @param {?} diffs Array of diff tuples.
     * @return {?}
     */
    DiffMatchPatch.prototype.diff_cleanupEfficiency = /**
     * Reduce the number of edits by eliminating operationally trivial equalities.
     * @param {?} diffs Array of diff tuples.
     * @return {?}
     */
    function (diffs) {
        /** @type {?} */
        var changes = false;
        /** @type {?} */
        var equalities = [];
        /** @type {?} */
        var equalitiesLength = 0;
        /** @type {?} */
        var lastequality = null;
        /** @type {?} */
        var pointer = 0;
        /** @type {?} */
        var pre_ins = false;
        /** @type {?} */
        var pre_del = false;
        /** @type {?} */
        var post_ins = false;
        /** @type {?} */
        var post_del = false;
        while (pointer < diffs.length) {
            if (diffs[pointer][0] == 0 /* Equal */) {
                // Equality found.
                if (diffs[pointer][1].length < this.Diff_EditCost &&
                    (post_ins || post_del)) {
                    // Candidate found.
                    equalities[equalitiesLength++] = pointer;
                    pre_ins = post_ins;
                    pre_del = post_del;
                    lastequality = diffs[pointer][1];
                }
                else {
                    // Not a candidate, and can never become one.
                    equalitiesLength = 0;
                    lastequality = null;
                }
                post_ins = post_del = false;
            }
            else {
                // An insertion or deletion.
                if (diffs[pointer][0] == -1 /* Delete */) {
                    post_del = true;
                }
                else {
                    post_ins = true;
                }
                /*
                        * Five types to be split:
                        * <ins>A</ins><del>B</del>XY<ins>C</ins><del>D</del>
                        * <ins>A</ins>X<ins>C</ins><del>D</del>
                        * <ins>A</ins><del>B</del>X<ins>C</ins>
                        * <ins>A</del>X<ins>C</ins><del>D</del>
                        * <ins>A</ins><del>B</del>X<del>C</del>
                        */
                if (lastequality && ((pre_ins && pre_del && post_ins && post_del) ||
                    ((lastequality.length < this.Diff_EditCost / 2) &&
                        ((pre_ins ? 1 : 0) + (pre_del ? 1 : 0) + (post_ins ? 1 : 0) + (post_del ? 1 : 0) == 3)))) {
                    // Duplicate record.
                    diffs.splice(equalities[equalitiesLength - 1], 0, [-1 /* Delete */, lastequality]);
                    // Change second copy to insert.
                    diffs[equalities[equalitiesLength - 1] + 1][0] = 1 /* Insert */;
                    equalitiesLength--; // Throw away the equality we just deleted;
                    lastequality = null;
                    if (pre_ins && pre_del) {
                        // No changes made which could affect previous entry, keep going.
                        post_ins = post_del = true;
                        equalitiesLength = 0;
                    }
                    else {
                        equalitiesLength--; // Throw away the previous equality.
                        pointer = equalitiesLength > 0 ?
                            equalities[equalitiesLength - 1] : -1;
                        post_ins = post_del = false;
                    }
                    changes = true;
                }
            }
            pointer++;
        }
        if (changes) {
            this.diff_cleanupMerge(diffs);
        }
    };
    ;
    /**
     * Reorder and merge like edit sections.  Merge equalities.
     * Any edit section can move as long as it doesn't cross an equality.
     * @param  diffs Array of diff tuples.
     */
    /**
     * Reorder and merge like edit sections.  Merge equalities.
     * Any edit section can move as long as it doesn't cross an equality.
     * @param {?} diffs Array of diff tuples.
     * @return {?}
     */
    DiffMatchPatch.prototype.diff_cleanupMerge = /**
     * Reorder and merge like edit sections.  Merge equalities.
     * Any edit section can move as long as it doesn't cross an equality.
     * @param {?} diffs Array of diff tuples.
     * @return {?}
     */
    function (diffs) {
        diffs.push([0 /* Equal */, '']);
        /** @type {?} */
        var pointer = 0;
        /** @type {?} */
        var count_delete = 0;
        /** @type {?} */
        var count_insert = 0;
        /** @type {?} */
        var text_delete = '';
        /** @type {?} */
        var text_insert = '';
        /** @type {?} */
        var commonlength;
        while (pointer < diffs.length) {
            switch (diffs[pointer][0]) {
                case 1 /* Insert */:
                    count_insert++;
                    text_insert += diffs[pointer][1];
                    pointer++;
                    break;
                case -1 /* Delete */:
                    count_delete++;
                    text_delete += diffs[pointer][1];
                    pointer++;
                    break;
                case 0 /* Equal */:
                    // Upon reaching an equality, check for prior redundancies.
                    if (count_delete + count_insert > 1) {
                        if (count_delete !== 0 && count_insert !== 0) {
                            // Factor out any common prefixies.
                            commonlength = this.diff_commonPrefix(text_insert, text_delete);
                            if (commonlength !== 0) {
                                if ((pointer - count_delete - count_insert) > 0 &&
                                    diffs[pointer - count_delete - count_insert - 1][0] ==
                                        0 /* Equal */) {
                                    diffs[pointer - count_delete - count_insert - 1][1] +=
                                        text_insert.substring(0, commonlength);
                                }
                                else {
                                    diffs.splice(0, 0, [0 /* Equal */,
                                        text_insert.substring(0, commonlength)]);
                                    pointer++;
                                }
                                text_insert = text_insert.substring(commonlength);
                                text_delete = text_delete.substring(commonlength);
                            }
                            // Factor out any common suffixies.
                            commonlength = this.diff_commonSuffix(text_insert, text_delete);
                            if (commonlength !== 0) {
                                diffs[pointer][1] = text_insert.substring(text_insert.length -
                                    commonlength) + diffs[pointer][1];
                                text_insert = text_insert.substring(0, text_insert.length -
                                    commonlength);
                                text_delete = text_delete.substring(0, text_delete.length -
                                    commonlength);
                            }
                        }
                        // Delete the offending records and add the merged ones.
                        if (count_delete === 0) {
                            diffs.splice(pointer - count_insert, count_delete + count_insert, [1 /* Insert */, text_insert]);
                        }
                        else if (count_insert === 0) {
                            diffs.splice(pointer - count_delete, count_delete + count_insert, [-1 /* Delete */, text_delete]);
                        }
                        else {
                            diffs.splice(pointer - count_delete - count_insert, count_delete + count_insert, [-1 /* Delete */, text_delete], [1 /* Insert */, text_insert]);
                        }
                        pointer = pointer - count_delete - count_insert +
                            (count_delete ? 1 : 0) + (count_insert ? 1 : 0) + 1;
                    }
                    else if (pointer !== 0 && diffs[pointer - 1][0] == 0 /* Equal */) {
                        // Merge this equality with the previous one.
                        diffs[pointer - 1][1] += diffs[pointer][1];
                        diffs.splice(pointer, 1);
                    }
                    else {
                        pointer++;
                    }
                    count_insert = 0;
                    count_delete = 0;
                    text_delete = '';
                    text_insert = '';
                    break;
            }
        }
        if (diffs[diffs.length - 1][1] === '') {
            diffs.pop(); // Remove the dummy entry at the end.
        }
        /** @type {?} */
        var changes = false;
        pointer = 1;
        // Intentionally ignore the first and last element (don't need checking).
        while (pointer < diffs.length - 1) {
            if (diffs[pointer - 1][0] == 0 /* Equal */ &&
                diffs[pointer + 1][0] == 0 /* Equal */) {
                // This is a single edit surrounded by equalities.
                if (diffs[pointer][1].substring(diffs[pointer][1].length -
                    diffs[pointer - 1][1].length) == diffs[pointer - 1][1]) {
                    // Shift the edit over the previous equality.
                    diffs[pointer][1] = diffs[pointer - 1][1] +
                        diffs[pointer][1].substring(0, diffs[pointer][1].length -
                            diffs[pointer - 1][1].length);
                    diffs[pointer + 1][1] = diffs[pointer - 1][1] + diffs[pointer + 1][1];
                    diffs.splice(pointer - 1, 1);
                    changes = true;
                }
                else if (diffs[pointer][1].substring(0, diffs[pointer + 1][1].length) ==
                    diffs[pointer + 1][1]) {
                    // Shift the edit over the next equality.
                    diffs[pointer - 1][1] += diffs[pointer + 1][1];
                    diffs[pointer][1] =
                        diffs[pointer][1].substring(diffs[pointer + 1][1].length) +
                            diffs[pointer + 1][1];
                    diffs.splice(pointer + 1, 1);
                    changes = true;
                }
            }
            pointer++;
        }
        // If shifts were made, the diff needs reordering and another shift sweep.
        if (changes) {
            this.diff_cleanupMerge(diffs);
        }
    };
    ;
    /**
     * loc is a location in text1, compute and return the equivalent location in
     * text2.
     * e.g. 'The cat' vs 'The big cat', 1->1, 5->8
     * @param  diffs Array of diff tuples.
     * @param  loc Location within text1.
     * @return  Location within text2.
     */
    /**
     * loc is a location in text1, compute and return the equivalent location in
     * text2.
     * e.g. 'The cat' vs 'The big cat', 1->1, 5->8
     * @param {?} diffs Array of diff tuples.
     * @param {?} loc Location within text1.
     * @return {?} Location within text2.
     */
    DiffMatchPatch.prototype.diff_xIndex = /**
     * loc is a location in text1, compute and return the equivalent location in
     * text2.
     * e.g. 'The cat' vs 'The big cat', 1->1, 5->8
     * @param {?} diffs Array of diff tuples.
     * @param {?} loc Location within text1.
     * @return {?} Location within text2.
     */
    function (diffs, loc) {
        /** @type {?} */
        var chars1 = 0;
        /** @type {?} */
        var chars2 = 0;
        /** @type {?} */
        var last_chars1 = 0;
        /** @type {?} */
        var last_chars2 = 0;
        /** @type {?} */
        var x;
        for (x = 0; x < diffs.length; x++) {
            if (diffs[x][0] !== 1 /* Insert */) {
                // Equality or deletion.
                chars1 += diffs[x][1].length;
            }
            if (diffs[x][0] !== -1 /* Delete */) {
                // Equality or insertion.
                chars2 += diffs[x][1].length;
            }
            if (chars1 > loc) {
                // Overshot the location.
                break;
            }
            last_chars1 = chars1;
            last_chars2 = chars2;
        }
        // Was the location was deleted?
        if (diffs.length != x && diffs[x][0] === -1 /* Delete */) {
            return last_chars2;
        }
        // Add the remaining character length.
        return last_chars2 + (loc - last_chars1);
    };
    ;
    /**
     * Compute and return the source text (all equalities and deletions).
     * @param  diffs Array of diff tuples.
     * @return  Source text.
     */
    /**
     * Compute and return the source text (all equalities and deletions).
     * @param {?} diffs Array of diff tuples.
     * @return {?} Source text.
     */
    DiffMatchPatch.prototype.diff_text1 = /**
     * Compute and return the source text (all equalities and deletions).
     * @param {?} diffs Array of diff tuples.
     * @return {?} Source text.
     */
    function (diffs) {
        /** @type {?} */
        var text = [];
        for (var x = 0; x < diffs.length; x++) {
            if (diffs[x][0] !== 1 /* Insert */) {
                text[x] = diffs[x][1];
            }
        }
        return text.join('');
    };
    ;
    /**
     * Compute and return the destination text (all equalities and insertions).
     * @param  diffs Array of diff tuples.
     * @return  Destination text.
     */
    /**
     * Compute and return the destination text (all equalities and insertions).
     * @param {?} diffs Array of diff tuples.
     * @return {?} Destination text.
     */
    DiffMatchPatch.prototype.diff_text2 = /**
     * Compute and return the destination text (all equalities and insertions).
     * @param {?} diffs Array of diff tuples.
     * @return {?} Destination text.
     */
    function (diffs) {
        /** @type {?} */
        var text = [];
        for (var x = 0; x < diffs.length; x++) {
            if (diffs[x][0] !== -1 /* Delete */) {
                text[x] = diffs[x][1];
            }
        }
        return text.join('');
    };
    ;
    /**
     * Compute the Levenshtein distance; the number of inserted, deleted or
     * substituted characters.
     * @param  diffs Array of diff tuples.
     * @return  Number of changes.
     */
    /**
     * Compute the Levenshtein distance; the number of inserted, deleted or
     * substituted characters.
     * @param {?} diffs Array of diff tuples.
     * @return {?} Number of changes.
     */
    DiffMatchPatch.prototype.diff_levenshtein = /**
     * Compute the Levenshtein distance; the number of inserted, deleted or
     * substituted characters.
     * @param {?} diffs Array of diff tuples.
     * @return {?} Number of changes.
     */
    function (diffs) {
        /** @type {?} */
        var levenshtein = 0;
        /** @type {?} */
        var insertions = 0;
        /** @type {?} */
        var deletions = 0;
        for (var x = 0; x < diffs.length; x++) {
            /** @type {?} */
            var op = diffs[x][0];
            /** @type {?} */
            var data = diffs[x][1];
            switch (op) {
                case 1 /* Insert */:
                    insertions += data.length;
                    break;
                case -1 /* Delete */:
                    deletions += data.length;
                    break;
                case 0 /* Equal */:
                    // A deletion and an insertion is one substitution.
                    levenshtein += Math.max(insertions, deletions);
                    insertions = 0;
                    deletions = 0;
                    break;
            }
        }
        levenshtein += Math.max(insertions, deletions);
        return levenshtein;
    };
    ;
    /**
     * Crush the diff into an encoded string which describes the operations
     * required to transform text1 into text2.
     * E.g. =3\t-2\t+ing  -> Keep 3 chars, delete 2 chars, insert 'ing'.
     * Operations are tab-separated.  Inserted text is escaped using %xx notation.
     * @param  diffs Array of diff tuples.
     * @return  Delta text.
     */
    /**
     * Crush the diff into an encoded string which describes the operations
     * required to transform text1 into text2.
     * E.g. =3\t-2\t+ing  -> Keep 3 chars, delete 2 chars, insert 'ing'.
     * Operations are tab-separated.  Inserted text is escaped using %xx notation.
     * @param {?} diffs Array of diff tuples.
     * @return {?} Delta text.
     */
    DiffMatchPatch.prototype.diff_toDelta = /**
     * Crush the diff into an encoded string which describes the operations
     * required to transform text1 into text2.
     * E.g. =3\t-2\t+ing  -> Keep 3 chars, delete 2 chars, insert 'ing'.
     * Operations are tab-separated.  Inserted text is escaped using %xx notation.
     * @param {?} diffs Array of diff tuples.
     * @return {?} Delta text.
     */
    function (diffs) {
        /** @type {?} */
        var text = [];
        for (var x = 0; x < diffs.length; x++) {
            switch (diffs[x][0]) {
                case 1 /* Insert */:
                    text[x] = '+' + encodeURI(diffs[x][1]);
                    break;
                case -1 /* Delete */:
                    text[x] = '-' + diffs[x][1].length;
                    break;
                case 0 /* Equal */:
                    text[x] = '=' + diffs[x][1].length;
                    break;
            }
        }
        return text.join('\t').replace(/%20/g, ' ');
    };
    ;
    /**
     * Given the original text1, and an encoded string which describes the
     * operations required to transform text1 into text2, compute the full diff.
     * @param  text1 Source string for the diff.
     * @param  delta Delta text.
     * @return  Array of diff tuples.
     * @throws {!Error} If invalid input.
     */
    /**
     * Given the original text1, and an encoded string which describes the
     * operations required to transform text1 into text2, compute the full diff.
     * @throws {!Error} If invalid input.
     * @param {?} text1 Source string for the diff.
     * @param {?} delta Delta text.
     * @return {?} Array of diff tuples.
     */
    DiffMatchPatch.prototype.diff_fromDelta = /**
     * Given the original text1, and an encoded string which describes the
     * operations required to transform text1 into text2, compute the full diff.
     * @throws {!Error} If invalid input.
     * @param {?} text1 Source string for the diff.
     * @param {?} delta Delta text.
     * @return {?} Array of diff tuples.
     */
    function (text1, delta) {
        /** @type {?} */
        var diffs = [];
        /** @type {?} */
        var diffsLength = 0;
        /** @type {?} */
        var pointer = 0;
        /** @type {?} */
        var tokens = delta.split(/\t/g);
        for (var x = 0; x < tokens.length; x++) {
            /** @type {?} */
            var param = tokens[x].substring(1);
            switch (tokens[x].charAt(0)) {
                case '+':
                    try {
                        diffs[diffsLength++] = [1 /* Insert */, decodeURI(param)];
                    }
                    catch (ex) {
                        // Malformed URI sequence.
                        throw new Error('Illegal escape in diff_fromDelta: ' + param);
                    }
                    break;
                case '-':
                // Fall through.
                case '=':
                    /** @type {?} */
                    var n = parseInt(param, 10);
                    if (isNaN(n) || n < 0) {
                        throw new Error('Invalid number in diff_fromDelta: ' + param);
                    }
                    /** @type {?} */
                    var text = text1.substring(pointer, pointer += n);
                    if (tokens[x].charAt(0) == '=') {
                        diffs[diffsLength++] = [0 /* Equal */, text];
                    }
                    else {
                        diffs[diffsLength++] = [-1 /* Delete */, text];
                    }
                    break;
                default:
                    // Blank tokens are ok (from a trailing \t).
                    // Anything else is an error.
                    if (tokens[x]) {
                        throw new Error('Invalid diff operation in diff_fromDelta: ' +
                            tokens[x]);
                    }
            }
        }
        if (pointer != text1.length) {
            throw new Error('Delta length (' + pointer +
                ') does not equal source text length (' + text1.length + ').');
        }
        return diffs;
    };
    ;
    /**
     * Locate the best instance of 'pattern' in 'text' near 'loc'.
     * @param  text The text to search.
     * @param  pattern The pattern to search for.
     * @param  loc The location to search around.
     * @return  Best match index or -1.
     */
    /**
     * Locate the best instance of 'pattern' in 'text' near 'loc'.
     * @param {?} text The text to search.
     * @param {?} pattern The pattern to search for.
     * @param {?} loc The location to search around.
     * @return {?} Best match index or -1.
     */
    DiffMatchPatch.prototype.match_main = /**
     * Locate the best instance of 'pattern' in 'text' near 'loc'.
     * @param {?} text The text to search.
     * @param {?} pattern The pattern to search for.
     * @param {?} loc The location to search around.
     * @return {?} Best match index or -1.
     */
    function (text, pattern, loc) {
        // Check for null inputs.
        if (text == null || pattern == null || loc == null) {
            throw new Error('Null input. (match_main)');
        }
        loc = Math.max(0, Math.min(loc, text.length));
        if (text == pattern) {
            // Shortcut (potentially not guaranteed by the algorithm)
            return 0;
        }
        else if (!text.length) {
            // Nothing to match.
            return -1;
        }
        else if (text.substring(loc, loc + pattern.length) == pattern) {
            // Perfect match at the perfect spot!  (Includes case of null pattern)
            return loc;
        }
        else {
            // Do a fuzzy compare.
            return this.match_bitap_(text, pattern, loc);
        }
    };
    ;
    /**
     * Locate the best instance of 'pattern' in 'text' near 'loc' using the
     * Bitap algorithm.
     * @param  text The text to search.
     * @param  pattern The pattern to search for.
     * @param  loc The location to search around.
     * @return  Best match index or -1.
  
     */
    /**
     * Locate the best instance of 'pattern' in 'text' near 'loc' using the
     * Bitap algorithm.
     * @param {?} text The text to search.
     * @param {?} pattern The pattern to search for.
     * @param {?} loc The location to search around.
     * @return {?} Best match index or -1.
     */
    DiffMatchPatch.prototype.match_bitap_ = /**
     * Locate the best instance of 'pattern' in 'text' near 'loc' using the
     * Bitap algorithm.
     * @param {?} text The text to search.
     * @param {?} pattern The pattern to search for.
     * @param {?} loc The location to search around.
     * @return {?} Best match index or -1.
     */
    function (text, pattern, loc) {
        if (pattern.length > this.Match_MaxBits) {
            throw new Error('Pattern too long for this browser.');
        }
        /** @type {?} */
        var s = this.match_alphabet_(pattern);
        /** @type {?} */
        var dmp = this;
        /**
         * Compute and return the score for a match with e errors and x location.
         * Accesses loc and pattern through being a closure.
         * @param {?} e Number of errors in match.
         * @param {?} x Location of match.
         * @return {?} Overall score for match (0.0 = good, 1.0 = bad).
         */
        function match_bitapScore_(e, x) {
            /** @type {?} */
            var accuracy = e / pattern.length;
            /** @type {?} */
            var proximity = Math.abs(loc - x);
            if (!dmp.Match_Distance) {
                // Dodge divide by zero error.
                return proximity ? 1.0 : accuracy;
            }
            return accuracy + (proximity / dmp.Match_Distance);
        }
        /** @type {?} */
        var score_threshold = this.Match_Threshold;
        /** @type {?} */
        var best_loc = text.indexOf(pattern, loc);
        if (best_loc != -1) {
            score_threshold = Math.min(match_bitapScore_(0, best_loc), score_threshold);
            // What about in the other direction? (speedup)
            best_loc = text.lastIndexOf(pattern, loc + pattern.length);
            if (best_loc != -1) {
                score_threshold =
                    Math.min(match_bitapScore_(0, best_loc), score_threshold);
            }
        }
        /** @type {?} */
        var matchmask = 1 << (pattern.length - 1);
        best_loc = -1;
        /** @type {?} */
        var bin_min;
        /** @type {?} */
        var bin_mid;
        /** @type {?} */
        var bin_max = pattern.length + text.length;
        /** @type {?} */
        var last_rd;
        for (var d = 0; d < pattern.length; d++) {
            // Scan for the best match; each iteration allows for one more error.
            // Run a binary search to determine how far from 'loc' we can stray at this
            // error level.
            bin_min = 0;
            bin_mid = bin_max;
            while (bin_min < bin_mid) {
                if (match_bitapScore_(d, loc + bin_mid) <= score_threshold) {
                    bin_min = bin_mid;
                }
                else {
                    bin_max = bin_mid;
                }
                bin_mid = Math.floor((bin_max - bin_min) / 2 + bin_min);
            }
            // Use the result from this iteration as the maximum for the next.
            bin_max = bin_mid;
            /** @type {?} */
            var start = Math.max(1, loc - bin_mid + 1);
            /** @type {?} */
            var finish = Math.min(loc + bin_mid, text.length) + pattern.length;
            /** @type {?} */
            var rd = Array(finish + 2);
            rd[finish + 1] = (1 << d) - 1;
            for (var j = finish; j >= start; j--) {
                /** @type {?} */
                var charMatch = s[text.charAt(j - 1)];
                if (d === 0) {
                    // First pass: exact match.
                    rd[j] = ((rd[j + 1] << 1) | 1) & charMatch;
                }
                else {
                    // Subsequent passes: fuzzy match.
                    rd[j] = (((rd[j + 1] << 1) | 1) & charMatch) |
                        (((last_rd[j + 1] | last_rd[j]) << 1) | 1) |
                        last_rd[j + 1];
                }
                if (rd[j] & matchmask) {
                    /** @type {?} */
                    var score = match_bitapScore_(d, j - 1);
                    // This match will almost certainly be better than any existing match.
                    // But check anyway.
                    if (score <= score_threshold) {
                        // Told you so.
                        score_threshold = score;
                        best_loc = j - 1;
                        if (best_loc > loc) {
                            // When passing loc, don't exceed our current distance from loc.
                            start = Math.max(1, 2 * loc - best_loc);
                        }
                        else {
                            // Already passed loc, downhill from here on in.
                            break;
                        }
                    }
                }
            }
            // No hope for a (better) match at greater error levels.
            if (match_bitapScore_(d + 1, loc) > score_threshold) {
                break;
            }
            last_rd = rd;
        }
        return best_loc;
    };
    ;
    /**
     * Initialise the alphabet for the Bitap algorithm.
     * @param  pattern The text to encode.
     * @return  Hash of character locations.
  
     */
    /**
     * Initialise the alphabet for the Bitap algorithm.
     * @param {?} pattern The text to encode.
     * @return {?} Hash of character locations.
     */
    DiffMatchPatch.prototype.match_alphabet_ = /**
     * Initialise the alphabet for the Bitap algorithm.
     * @param {?} pattern The text to encode.
     * @return {?} Hash of character locations.
     */
    function (pattern) {
        /** @type {?} */
        var s = {};
        for (var i = 0; i < pattern.length; i++) {
            s[pattern.charAt(i)] = 0;
        }
        for (var i = 0; i < pattern.length; i++) {
            s[pattern.charAt(i)] |= 1 << (pattern.length - i - 1);
        }
        return s;
    };
    ;
    /**
     * Increase the context until it is unique,
     * but don't let the pattern expand beyond Match_MaxBits.
     * @param  patch The patch to grow.
     * @param  text Source text.
  
     */
    /**
     * Increase the context until it is unique,
     * but don't let the pattern expand beyond Match_MaxBits.
     * @param {?} patch The patch to grow.
     * @param {?} text Source text.
     * @return {?}
     */
    DiffMatchPatch.prototype.patch_addContext_ = /**
     * Increase the context until it is unique,
     * but don't let the pattern expand beyond Match_MaxBits.
     * @param {?} patch The patch to grow.
     * @param {?} text Source text.
     * @return {?}
     */
    function (patch, text) {
        if (text.length == 0) {
            return;
        }
        /** @type {?} */
        var pattern = text.substring(patch.start2, patch.start2 + patch.length1);
        /** @type {?} */
        var padding = 0;
        // Look for the first and last matches of pattern in text.  If two different
        // matches are found, increase the pattern length.
        while (text.indexOf(pattern) != text.lastIndexOf(pattern) &&
            pattern.length < this.Match_MaxBits - this.Patch_Margin -
                this.Patch_Margin) {
            padding += this.Patch_Margin;
            pattern = text.substring(patch.start2 - padding, patch.start2 + patch.length1 + padding);
        }
        // Add one chunk for good luck.
        padding += this.Patch_Margin;
        /** @type {?} */
        var prefix = text.substring(patch.start2 - padding, patch.start2);
        if (prefix) {
            patch.diffs.unshift([0 /* Equal */, prefix]);
        }
        /** @type {?} */
        var suffix = text.substring(patch.start2 + patch.length1, patch.start2 + patch.length1 + padding);
        if (suffix) {
            patch.diffs.push([0 /* Equal */, suffix]);
        }
        // Roll back the start points.
        patch.start1 -= prefix.length;
        patch.start2 -= prefix.length;
        // Extend the lengths.
        patch.length1 += prefix.length + suffix.length;
        patch.length2 += prefix.length + suffix.length;
    };
    ;
    /**
     * Compute a list of patches to turn text1 into text2.
     * Use diffs if provided, otherwise compute it ourselves.
     * There are four ways to call this function, depending on what data is
     * available to the caller:
     * Method 1:
     * a = text1, b = text2
     * Method 2:
     * a = diffs
     * Method 3 (optimal):
     * a = text1, b = diffs
     * Method 4 (deprecated, use method 3):
     * a = text1, b = text2, c = diffs
     *
     * @param  a text1 (methods 1,3,4) or
     * Array of diff tuples for text1 to text2 (method 2).
     * @param  opt_b text2 (methods 1,4) or
     * Array of diff tuples for text1 to text2 (method 3) or undefined (method 2).
     * @param  opt_c Array of diff tuples
     * for text1 to text2 (method 4) or undefined (methods 1,2,3).
     * @return  Array of Patch objects.
     */
    /**
     * Compute a list of patches to turn text1 into text2.
     * Use diffs if provided, otherwise compute it ourselves.
     * There are four ways to call this function, depending on what data is
     * available to the caller:
     * Method 1:
     * a = text1, b = text2
     * Method 2:
     * a = diffs
     * Method 3 (optimal):
     * a = text1, b = diffs
     * Method 4 (deprecated, use method 3):
     * a = text1, b = text2, c = diffs
     *
     * @param {?} a text1 (methods 1,3,4) or
     * Array of diff tuples for text1 to text2 (method 2).
     * @param {?} opt_b text2 (methods 1,4) or
     * Array of diff tuples for text1 to text2 (method 3) or undefined (method 2).
     * @param {?} opt_c Array of diff tuples
     * for text1 to text2 (method 4) or undefined (methods 1,2,3).
     * @return {?} Array of Patch objects.
     */
    DiffMatchPatch.prototype.patch_make = /**
     * Compute a list of patches to turn text1 into text2.
     * Use diffs if provided, otherwise compute it ourselves.
     * There are four ways to call this function, depending on what data is
     * available to the caller:
     * Method 1:
     * a = text1, b = text2
     * Method 2:
     * a = diffs
     * Method 3 (optimal):
     * a = text1, b = diffs
     * Method 4 (deprecated, use method 3):
     * a = text1, b = text2, c = diffs
     *
     * @param {?} a text1 (methods 1,3,4) or
     * Array of diff tuples for text1 to text2 (method 2).
     * @param {?} opt_b text2 (methods 1,4) or
     * Array of diff tuples for text1 to text2 (method 3) or undefined (method 2).
     * @param {?} opt_c Array of diff tuples
     * for text1 to text2 (method 4) or undefined (methods 1,2,3).
     * @return {?} Array of Patch objects.
     */
    function (a, opt_b, opt_c) {
        /** @type {?} */
        var text1;
        /** @type {?} */
        var diffs;
        if (typeof a == 'string' && typeof opt_b == 'string' &&
            typeof opt_c == 'undefined') {
            // Method 1: text1, text2
            // Compute diffs from text1 and text2.
            text1 = (a);
            diffs = this.diff_main(text1, (opt_b), true);
            if (diffs.length > 2) {
                this.diff_cleanupSemantic(diffs);
                this.diff_cleanupEfficiency(diffs);
            }
        }
        else if (a && typeof a == 'object' && typeof opt_b == 'undefined' &&
            typeof opt_c == 'undefined') {
            // Method 2: diffs
            // Compute text1 from diffs.
            diffs = (a);
            text1 = this.diff_text1(diffs);
        }
        else if (typeof a == 'string' && opt_b && typeof opt_b == 'object' &&
            typeof opt_c == 'undefined') {
            // Method 3: text1, diffs
            text1 = (a);
            diffs = (opt_b);
        }
        else if (typeof a == 'string' && typeof opt_b == 'string' &&
            opt_c && typeof opt_c == 'object') {
            // Method 4: text1, text2, diffs
            // text2 is not used.
            text1 = (a);
            diffs = (opt_c);
        }
        else {
            throw new Error('Unknown call format to patch_make.');
        }
        if (diffs.length === 0) {
            return []; // Get rid of the null case.
        }
        /** @type {?} */
        var patches = [];
        /** @type {?} */
        var patch = new patch_obj();
        /** @type {?} */
        var patchDiffLength = 0;
        /** @type {?} */
        var char_count1 = 0;
        /** @type {?} */
        var char_count2 = 0;
        /** @type {?} */
        var prepatch_text = text1;
        /** @type {?} */
        var postpatch_text = text1;
        for (var x = 0; x < diffs.length; x++) {
            /** @type {?} */
            var diff_type = diffs[x][0];
            /** @type {?} */
            var diff_text = diffs[x][1];
            if (!patchDiffLength && diff_type !== 0 /* Equal */) {
                // A new patch starts here.
                patch.start1 = char_count1;
                patch.start2 = char_count2;
            }
            switch (diff_type) {
                case 1 /* Insert */:
                    patch.diffs[patchDiffLength++] = diffs[x];
                    patch.length2 += diff_text.length;
                    postpatch_text = postpatch_text.substring(0, char_count2) + diff_text +
                        postpatch_text.substring(char_count2);
                    break;
                case -1 /* Delete */:
                    patch.length1 += diff_text.length;
                    patch.diffs[patchDiffLength++] = diffs[x];
                    postpatch_text = postpatch_text.substring(0, char_count2) +
                        postpatch_text.substring(char_count2 +
                            diff_text.length);
                    break;
                case 0 /* Equal */:
                    if (diff_text.length <= 2 * this.Patch_Margin &&
                        patchDiffLength && diffs.length != x + 1) {
                        // Small equality inside a patch.
                        patch.diffs[patchDiffLength++] = diffs[x];
                        patch.length1 += diff_text.length;
                        patch.length2 += diff_text.length;
                    }
                    else if (diff_text.length >= 2 * this.Patch_Margin) {
                        // Time for a new patch.
                        if (patchDiffLength) {
                            this.patch_addContext_(patch, prepatch_text);
                            patches.push(patch);
                            patch = new patch_obj();
                            patchDiffLength = 0;
                            // Unlike Unidiff, our patch lists have a rolling context.
                            // http://code.google.com/p/google-diff-match-patch/wiki/Unidiff
                            // Update prepatch text & pos to reflect the application of the
                            // just completed patch.
                            prepatch_text = postpatch_text;
                            char_count1 = char_count2;
                        }
                    }
                    break;
            }
            // Update the current character count.
            if (diff_type !== 1 /* Insert */) {
                char_count1 += diff_text.length;
            }
            if (diff_type !== -1 /* Delete */) {
                char_count2 += diff_text.length;
            }
        }
        // Pick up the leftover patch if not empty.
        if (patchDiffLength) {
            this.patch_addContext_(patch, prepatch_text);
            patches.push(patch);
        }
        return patches;
    };
    ;
    /**
     * Given an array of patches, return another array that is identical.
     * @param  patches Array of Patch objects.
     * @return  Array of Patch objects.
     */
    /**
     * Given an array of patches, return another array that is identical.
     * @param {?} patches Array of Patch objects.
     * @return {?} Array of Patch objects.
     */
    DiffMatchPatch.prototype.patch_deepCopy = /**
     * Given an array of patches, return another array that is identical.
     * @param {?} patches Array of Patch objects.
     * @return {?} Array of Patch objects.
     */
    function (patches) {
        /** @type {?} */
        var patchesCopy = [];
        for (var x = 0; x < patches.length; x++) {
            /** @type {?} */
            var patch = patches[x];
            /** @type {?} */
            var patchCopy = new patch_obj();
            patchCopy.diffs = [];
            for (var y = 0; y < patch.diffs.length; y++) {
                patchCopy.diffs[y] = [patch.diffs[y][0], patch.diffs[y][1]];
            }
            patchCopy.start1 = patch.start1;
            patchCopy.start2 = patch.start2;
            patchCopy.length1 = patch.length1;
            patchCopy.length2 = patch.length2;
            patchesCopy[x] = patchCopy;
        }
        return patchesCopy;
    };
    ;
    /**
     * Merge a set of patches onto the text.  Return a patched text, as well
     * as a list of true/false values indicating which patches were applied.
     * @param  patches Array of Patch objects.
     * @param  text Old text.
     * @return  Two element Array, containing the
     *      new text and an array of boolean values.
     */
    /**
     * Merge a set of patches onto the text.  Return a patched text, as well
     * as a list of true/false values indicating which patches were applied.
     * @param {?} patches Array of Patch objects.
     * @param {?} text Old text.
     * @return {?} Two element Array, containing the
     *      new text and an array of boolean values.
     */
    DiffMatchPatch.prototype.patch_apply = /**
     * Merge a set of patches onto the text.  Return a patched text, as well
     * as a list of true/false values indicating which patches were applied.
     * @param {?} patches Array of Patch objects.
     * @param {?} text Old text.
     * @return {?} Two element Array, containing the
     *      new text and an array of boolean values.
     */
    function (patches, text) {
        if (patches.length == 0) {
            return [text, []];
        }
        // Deep copy the patches so that no changes are made to originals.
        patches = this.patch_deepCopy(patches);
        /** @type {?} */
        var nullPadding = this.patch_addPadding(patches);
        text = nullPadding + text + nullPadding;
        this.patch_splitMax(patches);
        /** @type {?} */
        var delta = 0;
        /** @type {?} */
        var results = [];
        for (var x = 0; x < patches.length; x++) {
            /** @type {?} */
            var expected_loc = patches[x].start2 + delta;
            /** @type {?} */
            var text1 = this.diff_text1(patches[x].diffs);
            /** @type {?} */
            var start_loc = void 0;
            /** @type {?} */
            var end_loc = -1;
            if (text1.length > this.Match_MaxBits) {
                // patch_splitMax will only provide an oversized pattern in the case of
                // a monster delete.
                start_loc = this.match_main(text, text1.substring(0, this.Match_MaxBits), expected_loc);
                if (start_loc != -1) {
                    end_loc = this.match_main(text, text1.substring(text1.length - this.Match_MaxBits), expected_loc + text1.length - this.Match_MaxBits);
                    if (end_loc == -1 || start_loc >= end_loc) {
                        // Can't find valid trailing context.  Drop this patch.
                        start_loc = -1;
                    }
                }
            }
            else {
                start_loc = this.match_main(text, text1, expected_loc);
            }
            if (start_loc == -1) {
                // No match found.  :(
                results[x] = false;
                // Subtract the delta for this failed patch from subsequent patches.
                delta -= patches[x].length2 - patches[x].length1;
            }
            else {
                // Found a match.  :)
                results[x] = true;
                delta = start_loc - expected_loc;
                /** @type {?} */
                var text2 = void 0;
                if (end_loc == -1) {
                    text2 = text.substring(start_loc, start_loc + text1.length);
                }
                else {
                    text2 = text.substring(start_loc, end_loc + this.Match_MaxBits);
                }
                if (text1 == text2) {
                    // Perfect match, just shove the replacement text in.
                    text = text.substring(0, start_loc) +
                        this.diff_text2(patches[x].diffs) +
                        text.substring(start_loc + text1.length);
                }
                else {
                    /** @type {?} */
                    var diffs = this.diff_main(text1, text2, false);
                    if (text1.length > this.Match_MaxBits &&
                        this.diff_levenshtein(diffs) / text1.length >
                            this.Patch_DeleteThreshold) {
                        // The end points match, but the content is unacceptably bad.
                        results[x] = false;
                    }
                    else {
                        this.diff_cleanupSemanticLossless(diffs);
                        /** @type {?} */
                        var index1 = 0;
                        /** @type {?} */
                        var index2 = void 0;
                        for (var y = 0; y < patches[x].diffs.length; y++) {
                            /** @type {?} */
                            var mod = patches[x].diffs[y];
                            if (mod[0] !== 0 /* Equal */) {
                                index2 = this.diff_xIndex(diffs, index1);
                            }
                            if (mod[0] === 1 /* Insert */) {
                                // Insertion
                                text = text.substring(0, start_loc + index2) + mod[1] +
                                    text.substring(start_loc + index2);
                            }
                            else if (mod[0] === -1 /* Delete */) {
                                // Deletion
                                text = text.substring(0, start_loc + index2) +
                                    text.substring(start_loc + this.diff_xIndex(diffs, index1 + mod[1].length));
                            }
                            if (mod[0] !== -1 /* Delete */) {
                                index1 += mod[1].length;
                            }
                        }
                    }
                }
            }
        }
        // Strip the padding off.
        text = text.substring(nullPadding.length, text.length - nullPadding.length);
        return [text, results];
    };
    ;
    /**
     * Add some padding on text start and end so that edges can match something.
     * Intended to be called only from within patch_apply.
     * @param  patches Array of Patch objects.
     * @return  The padding string added to each side.
     */
    /**
     * Add some padding on text start and end so that edges can match something.
     * Intended to be called only from within patch_apply.
     * @param {?} patches Array of Patch objects.
     * @return {?} The padding string added to each side.
     */
    DiffMatchPatch.prototype.patch_addPadding = /**
     * Add some padding on text start and end so that edges can match something.
     * Intended to be called only from within patch_apply.
     * @param {?} patches Array of Patch objects.
     * @return {?} The padding string added to each side.
     */
    function (patches) {
        /** @type {?} */
        var paddingLength = this.Patch_Margin;
        /** @type {?} */
        var nullPadding = '';
        for (var x = 1; x <= paddingLength; x++) {
            nullPadding += String.fromCharCode(x);
        }
        // Bump all the patches forward.
        for (var x = 0; x < patches.length; x++) {
            patches[x].start1 += paddingLength;
            patches[x].start2 += paddingLength;
        }
        /** @type {?} */
        var patch = patches[0];
        /** @type {?} */
        var diffs = patch.diffs;
        if (diffs.length == 0 || diffs[0][0] != 0 /* Equal */) {
            // Add nullPadding equality.
            diffs.unshift([0 /* Equal */, nullPadding]);
            patch.start1 -= paddingLength; // Should be 0.
            patch.start2 -= paddingLength; // Should be 0.
            patch.length1 += paddingLength;
            patch.length2 += paddingLength;
        }
        else if (paddingLength > diffs[0][1].length) {
            /** @type {?} */
            var extraLength = paddingLength - diffs[0][1].length;
            diffs[0][1] = nullPadding.substring(diffs[0][1].length) + diffs[0][1];
            patch.start1 -= extraLength;
            patch.start2 -= extraLength;
            patch.length1 += extraLength;
            patch.length2 += extraLength;
        }
        // Add some padding on end of last diff.
        patch = patches[patches.length - 1];
        diffs = patch.diffs;
        if (diffs.length == 0 || diffs[diffs.length - 1][0] != 0 /* Equal */) {
            // Add nullPadding equality.
            diffs.push([0 /* Equal */, nullPadding]);
            patch.length1 += paddingLength;
            patch.length2 += paddingLength;
        }
        else if (paddingLength > diffs[diffs.length - 1][1].length) {
            /** @type {?} */
            var extraLength = paddingLength - diffs[diffs.length - 1][1].length;
            diffs[diffs.length - 1][1] += nullPadding.substring(0, extraLength);
            patch.length1 += extraLength;
            patch.length2 += extraLength;
        }
        return nullPadding;
    };
    ;
    /**
     * Take a list of patches and return a textual representation.
     * @param  patches Array of Patch objects.
     * @return  Text representation of patches.
     */
    /**
     * Take a list of patches and return a textual representation.
     * @param {?} patches Array of Patch objects.
     * @return {?} Text representation of patches.
     */
    DiffMatchPatch.prototype.patch_toText = /**
     * Take a list of patches and return a textual representation.
     * @param {?} patches Array of Patch objects.
     * @return {?} Text representation of patches.
     */
    function (patches) {
        /** @type {?} */
        var text = [];
        for (var x = 0; x < patches.length; x++) {
            text[x] = patches[x];
        }
        return text.join('');
    };
    ;
    /**
     * Parse a textual representation of patches and return a list of Patch objects.
     * @param  textline Text representation of patches.
     * @return  Array of Patch objects.
     * @throws {!Error} If invalid input.
     */
    /**
     * Parse a textual representation of patches and return a list of Patch objects.
     * @throws {!Error} If invalid input.
     * @param {?} textline Text representation of patches.
     * @return {?} Array of Patch objects.
     */
    DiffMatchPatch.prototype.patch_fromText = /**
     * Parse a textual representation of patches and return a list of Patch objects.
     * @throws {!Error} If invalid input.
     * @param {?} textline Text representation of patches.
     * @return {?} Array of Patch objects.
     */
    function (textline) {
        /** @type {?} */
        var patches = [];
        if (!textline) {
            return patches;
        }
        /** @type {?} */
        var text = textline.split('\n');
        /** @type {?} */
        var textPointer = 0;
        /** @type {?} */
        var patchHeader = /^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@$/;
        while (textPointer < text.length) {
            /** @type {?} */
            var m = text[textPointer].match(patchHeader);
            if (!m) {
                throw new Error('Invalid patch string: ' + text[textPointer]);
            }
            /** @type {?} */
            var patch = new patch_obj();
            patches.push(patch);
            patch.start1 = parseInt(m[1], 10);
            if (m[2] === '') {
                patch.start1--;
                patch.length1 = 1;
            }
            else if (m[2] == '0') {
                patch.length1 = 0;
            }
            else {
                patch.start1--;
                patch.length1 = parseInt(m[2], 10);
            }
            patch.start2 = parseInt(m[3], 10);
            if (m[4] === '') {
                patch.start2--;
                patch.length2 = 1;
            }
            else if (m[4] == '0') {
                patch.length2 = 0;
            }
            else {
                patch.start2--;
                patch.length2 = parseInt(m[4], 10);
            }
            textPointer++;
            while (textPointer < text.length) {
                /** @type {?} */
                var sign = text[textPointer].charAt(0);
                /** @type {?} */
                var line = void 0;
                try {
                    line = decodeURI(text[textPointer].substring(1));
                }
                catch (ex) {
                    // Malformed URI sequence.
                    throw new Error('Illegal escape in patch_fromText: ' + line);
                }
                if (sign == '-') {
                    // Deletion.
                    patch.diffs.push([-1 /* Delete */, line]);
                }
                else if (sign == '+') {
                    // Insertion.
                    patch.diffs.push([1 /* Insert */, line]);
                }
                else if (sign == ' ') {
                    // Minor equality.
                    patch.diffs.push([0 /* Equal */, line]);
                }
                else if (sign == '@') {
                    // Start of next patch.
                    break;
                }
                else if (sign === '') {
                    // Blank line?  Whatever.
                }
                else {
                    // WTF?
                    throw new Error('Invalid patch mode "' + sign + '" in: ' + line);
                }
                textPointer++;
            }
        }
        return patches;
    };
    ;
    return DiffMatchPatch;
}());
if (false) {
    /** @type {?} */
    DiffMatchPatch.prototype.Diff_Timeout;
    /** @type {?} */
    DiffMatchPatch.prototype.Diff_EditCost;
    /** @type {?} */
    DiffMatchPatch.prototype.Match_Threshold;
    /** @type {?} */
    DiffMatchPatch.prototype.Match_Distance;
    /** @type {?} */
    DiffMatchPatch.prototype.Patch_DeleteThreshold;
    /** @type {?} */
    DiffMatchPatch.prototype.Patch_Margin;
    /** @type {?} */
    DiffMatchPatch.prototype.Match_MaxBits;
    /**
     * The data structure representing a diff is an array of tuples:
     * [[DiffOp.Delete, 'Hello'], [DiffOp.Insert, 'Goodbye'], [DiffOp.Equal, ' world.']]
     * which means: delete 'Hello', add 'Goodbye' and keep ' world.'
     * @type {?}
     */
    DiffMatchPatch.prototype.whitespaceRegex_;
    /** @type {?} */
    DiffMatchPatch.prototype.linebreakRegex_;
    /** @type {?} */
    DiffMatchPatch.prototype.blanklineEndRegex_;
    /** @type {?} */
    DiffMatchPatch.prototype.blanklineStartRegex_;
    /**
     * Convert a diff array into a pretty HTML report.
     * \@param diffs Array of diff tuples.
     * \@return HTML representation.
     * @type {?}
     */
    DiffMatchPatch.prototype.diff_prettyHtml;
    /**
     * Look through the patches and break up any which are longer than the maximum
     * limit of the match algorithm.
     * Intended to be called only from within patch_apply.
     * \@param patches Array of Patch objects.
     * @type {?}
     */
    DiffMatchPatch.prototype.patch_splitMax;
}
/**
 * Class representing one patch operation.
 */
var /**
 * Class representing one patch operation.
 */
patch_obj = /** @class */ (function () {
    function patch_obj() {
        this.diffs = [];
        this.start1 = null;
        this.start2 = null;
        this.length1 = 0;
        this.length2 = 0;
        /**
         * Emmulate GNU diff's format.
         * Header: \@\@ -382,8 +481,9 \@\@
         * Indicies are printed as 1-based, not 0-based.
         */
        this.toString = function () {
            /** @type {?} */
            var coords1;
            /** @type {?} */
            var coords2;
            if (this.length1 === 0) {
                coords1 = this.start1 + ',0';
            }
            else if (this.length1 == 1) {
                coords1 = this.start1 + 1;
            }
            else {
                coords1 = (this.start1 + 1) + ',' + this.length1;
            }
            if (this.length2 === 0) {
                coords2 = this.start2 + ',0';
            }
            else if (this.length2 == 1) {
                coords2 = this.start2 + 1;
            }
            else {
                coords2 = (this.start2 + 1) + ',' + this.length2;
            }
            /** @type {?} */
            var text = ['@@ -' + coords1 + ' +' + coords2 + ' @@\n'];
            /** @type {?} */
            var op;
            // Escape the body of the patch with %xx notation.
            for (var x = 0; x < this.diffs.length; x++) {
                switch (this.diffs[x][0]) {
                    case 1 /* Insert */:
                        op = '+';
                        break;
                    case -1 /* Delete */:
                        op = '-';
                        break;
                    case 0 /* Equal */:
                        op = ' ';
                        break;
                }
                text[x + 1] = op + encodeURI(this.diffs[x][1]) + '\n';
            }
            return text.join('').replace(/%20/g, ' ');
        };
    }
    return patch_obj;
}());
/**
 * Class representing one patch operation.
 */
export { patch_obj };
if (false) {
    /** @type {?} */
    patch_obj.prototype.diffs;
    /** @type {?} */
    patch_obj.prototype.start1;
    /** @type {?} */
    patch_obj.prototype.start2;
    /** @type {?} */
    patch_obj.prototype.length1;
    /** @type {?} */
    patch_obj.prototype.length2;
    /**
     * Emmulate GNU diff's format.
     * Header: \@\@ -382,8 +481,9 \@\@
     * Indicies are printed as 1-based, not 0-based.
     * @type {?}
     */
    patch_obj.prototype.toString;
}
export { DiffMatchPatch };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZk1hdGNoUGF0Y2guanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZy1kaWZmLW1hdGNoLXBhdGNoLyIsInNvdXJjZXMiOlsibGliL2RpZmZNYXRjaFBhdGNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztJQUNFLFVBQVc7SUFDWCxRQUFTO0lBQ1QsU0FBVTs7Ozs7Ozs7O0FBU1o7OztBQUFBO0lBRUU7Ozs7NEJBTWUsR0FBRzs7NkJBRUYsQ0FBQzs7K0JBRUMsR0FBRzs7Ozs4QkFJSixJQUFJOzs7OztxQ0FLRyxHQUFHOzs0QkFFWixDQUFDOzs2QkFHQSxFQUFFOzs7Ozs7Z0NBUUMsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDOytCQUNuQixJQUFJLE1BQU0sQ0FBQyxVQUFVLENBQUM7a0NBQ25CLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQztvQ0FDdEIsSUFBSSxNQUFNLENBQUMsZUFBZSxDQUFDOzs7Ozs7K0JBc25DOUIsVUFBUyxLQUFrQjs7WUFDN0MsSUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDOztZQUNoQixJQUFNLFdBQVcsR0FBRyxJQUFJLENBQUM7O1lBQ3pCLElBQU0sVUFBVSxHQUFHLElBQUksQ0FBQzs7WUFDeEIsSUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDOztZQUN4QixJQUFNLFlBQVksR0FBRyxLQUFLLENBQUM7WUFDM0IsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7O2dCQUN0QyxJQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O2dCQUN2QixJQUFNLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O2dCQUN6QixJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQyxP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MSxcbiAgRXF1YWwgPSAwLFxuICBJbnNlcnQgPSAxXG59XG5cbmV4cG9ydCB0eXBlIERpZmYgPSBbRGlmZk9wLCBzdHJpbmddO1xuXG4vKipcbiAqIENsYXNzIGNvbnRhaW5pbmcgdGhlIGRpZmYsIG1hdGNoIGFuZCBwYXRjaCBtZXRob2RzLlxuXG4gKi9cbmNsYXNzIERpZmZNYXRjaFBhdGNoIHtcblxuICBjb25zdHJ1Y3RvcigpIHsgIH1cblxuICAvLyBEZWZhdWx0cy5cbiAgLy8gUmVkZWZpbmUgdGhlc2UgaW4geW91ciBwcm9ncmFtIHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0cy5cblxuICAvLyBOdW1iZXIgb2Ygc2Vjb25kcyB0byBtYXAgYSBkaWZmIGJlZm9yZSBnaXZpbmcgdXAgKDAgZm9yIGluZmluaXR5KS5cbiAgRGlmZl9UaW1lb3V0ID0gMS4wO1xuICAvLyBDb3N0IG9mIGFuIGVtcHR5IGVkaXQgb3BlcmF0aW9uIGluIHRlcm1zIG9mIGVkaXQgY2hhcmFjdGVycy5cbiAgRGlmZl9FZGl0Q29zdCA9IDQ7XG4gIC8vIEF0IHdoYXQgcG9pbnQgaXMgbm8gbWF0Y2ggZGVjbGFyZWQgKDAuMCA9IHBlcmZlY3Rpb24sIDEuMCA9IHZlcnkgbG9vc2UpLlxuICBNYXRjaF9UaHJlc2hvbGQgPSAwLjU7XG4gIC8vIEhvdyBmYXIgdG8gc2VhcmNoIGZvciBhIG1hdGNoICgwID0gZXhhY3QgbG9jYXRpb24sIDEwMDArID0gYnJvYWQgbWF0Y2gpLlxuICAvLyBBIG1hdGNoIHRoaXMgbWFueSBjaGFyYWN0ZXJzIGF3YXkgZnJvbSB0aGUgZXhwZWN0ZWQgbG9jYXRpb24gd2lsbCBhZGRcbiAgLy8gMS4wIHRvIHRoZSBzY29yZSAoMC4wIGlzIGEgcGVyZmVjdCBtYXRjaCkuXG4gIE1hdGNoX0Rpc3RhbmNlID0gMTAwMDtcbiAgLy8gV2hlbiBkZWxldGluZyBhIGxhcmdlIGJsb2NrIG9mIHRleHQgKG92ZXIgfjY0IGNoYXJhY3RlcnMpLCBob3cgY2xvc2UgZG9cbiAgLy8gdGhlIGNvbnRlbnRzIGhhdmUgdG8gYmUgdG8gbWF0Y2ggdGhlIGV4cGVjdGVkIGNvbnRlbnRzLiAoMC4wID0gcGVyZmVjdGlvbixcbiAgLy8gMS4wID0gdmVyeSBsb29zZSkuICBOb3RlIHRoYXQgTWF0Y2hfVGhyZXNob2xkIGNvbnRyb2xzIGhvdyBjbG9zZWx5IHRoZVxuICAvLyBlbmQgcG9pbnRzIG9mIGEgZGVsZXRlIG5lZWQgdG8gbWF0Y2guXG4gIFBhdGNoX0RlbGV0ZVRocmVzaG9sZCA9IDAuNTtcbiAgLy8gQ2h1bmsgc2l6ZSBmb3IgY29udGV4dCBsZW5ndGguXG4gIFBhdGNoX01hcmdpbiA9IDQ7XG5cbiAgLy8gVGhlIG51bWJlciBvZiBiaXRzIGluIGFuIGludC5cbiAgTWF0Y2hfTWF4Qml0cyA9IDMyO1xuICAvKipcbiAgICogVGhlIGRhdGEgc3RydWN0dXJlIHJlcHJlc2VudGluZyBhIGRpZmYgaXMgYW4gYXJyYXkgb2YgdHVwbGVzOlxuICAgKiBbW0RpZmZPcC5EZWxldGUsICdIZWxsbyddLCBbRGlmZk9wLkluc2VydCwgJ0dvb2RieWUnXSwgW0RpZmZPcC5FcXVhbCwgJyB3b3JsZC4nXV1cbiAgICogd2hpY2ggbWVhbnM6IGRlbGV0ZSAnSGVsbG8nLCBhZGQgJ0dvb2RieWUnIGFuZCBrZWVwICcgd29ybGQuJ1xuICAgKi9cblxuICAvLyBEZWZpbmUgc29tZSByZWdleCBwYXR0ZXJucyBmb3IgbWF0Y2hpbmcgYm91bmRhcmllcy5cbiAgd2hpdGVzcGFjZVJlZ2V4XyA9IG5ldyBSZWdFeHAoJy9cXHMvJyk7XG4gIGxpbmVicmVha1JlZ2V4XyA9IG5ldyBSZWdFeHAoJy9bXFxyXFxuXS8nKTtcbiAgYmxhbmtsaW5lRW5kUmVnZXhfID0gbmV3IFJlZ0V4cCgnL1xcblxccj9cXG4kLycpO1xuICBibGFua2xpbmVTdGFydFJlZ2V4XyA9IG5ldyBSZWdFeHAoJy9eXFxyP1xcblxccj9cXG4vJyk7XG5cbiAgLyoqXG4gICAqIEZpbmQgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gdHdvIHRleHRzLiAgU2ltcGxpZmllcyB0aGUgcHJvYmxlbSBieSBzdHJpcHBpbmdcbiAgICogYW55IGNvbW1vbiBwcmVmaXggb3Igc3VmZml4IG9mZiB0aGUgdGV4dHMgYmVmb3JlIGRpZmZpbmcuXG4gICAqIEBwYXJhbSAgdGV4dDEgT2xkIHN0cmluZyB0byBiZSBkaWZmZWQuXG4gICAqIEBwYXJhbSAgdGV4dDIgTmV3IHN0cmluZyB0byBiZSBkaWZmZWQuXG4gICAqIEBwYXJhbSAgb3B0X2NoZWNrbGluZXMgT3B0aW9uYWwgc3BlZWR1cCBmbGFnLiBJZiBwcmVzZW50IGFuZCBmYWxzZSxcbiAgICogICAgIHRoZW4gZG9uJ3QgcnVuIGEgbGluZS1sZXZlbCBkaWZmIGZpcnN0IHRvIGlkZW50aWZ5IHRoZSBjaGFuZ2VkIGFyZWFzLlxuICAgKiAgICAgRGVmYXVsdHMgdG8gdHJ1ZSwgd2hpY2ggZG9lcyBhIGZhc3Rlciwgc2xpZ2h0bHkgbGVzcyBvcHRpbWFsIGRpZmYuXG4gICAqIEBwYXJhbSAgb3B0X2RlYWRsaW5lIE9wdGlvbmFsIHRpbWUgd2hlbiB0aGUgZGlmZiBzaG91bGQgYmUgY29tcGxldGVcbiAgICogICAgIGJ5LiAgVXNlZCBpbnRlcm5hbGx5IGZvciByZWN1cnNpdmUgY2FsbHMuICBVc2VycyBzaG91bGQgc2V0IERpZmZUaW1lb3V0XG4gICAqICAgICBpbnN0ZWFkLlxuICAgKiBAcmV0dXJuICBBcnJheSBvZiBkaWZmIHR1cGxlcy5cbiAgICovXG4gICAgZGlmZl9tYWluICh0ZXh0MTogc3RyaW5nLCB0ZXh0Mjogc3RyaW5nLCBvcHRfY2hlY2tsaW5lcz86IGJvb2xlYW4sIG9wdF9kZWFkbGluZT86IG51bWJlcik6IEFycmF5PERpZmY+IHtcbiAgICAgIC8vIFNldCBhIGRlYWRsaW5lIGJ5IHdoaWNoIHRpbWUgdGhlIGRpZmYgbXVzdCBiZSBjb21wbGV0ZS5cbiAgICAgIGlmICh0eXBlb2Ygb3B0X2RlYWRsaW5lID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGlmICh0aGlzLkRpZmZfVGltZW91dCA8PSAwKSB7XG4gICAgICAgICAgb3B0X2RlYWRsaW5lID0gTnVtYmVyLk1BWF9WQUxVRTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvcHRfZGVhZGxpbmUgPSAobmV3IERhdGUpLmdldFRpbWUoKSArIHRoaXMuRGlmZl9UaW1lb3V0ICogMTAwMDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc3QgZGVhZGxpbmUgPSBvcHRfZGVhZGxpbmU7XG5cbiAgICAgIC8vIENoZWNrIGZvciBudWxsIGlucHV0cy5cbiAgICAgIGlmICh0ZXh0MSA9PSBudWxsIHx8IHRleHQyID09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOdWxsIGlucHV0LiAoZGlmZl9tYWluKScpO1xuICAgICAgfVxuXG4gICAgICAvLyBDaGVjayBmb3IgZXF1YWxpdHkgKHNwZWVkdXApLlxuICAgICAgaWYgKHRleHQxID09IHRleHQyKSB7XG4gICAgICAgIGlmICh0ZXh0MSkge1xuICAgICAgICAgIHJldHVybiBbW0RpZmZPcC5FcXVhbCwgdGV4dDFdXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW107XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2Ygb3B0X2NoZWNrbGluZXMgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgb3B0X2NoZWNrbGluZXMgPSB0cnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgY2hlY2tsaW5lcyA9IG9wdF9jaGVja2xpbmVzO1xuXG4gICAgICAvLyBUcmltIG9mZiBjb21tb24gcHJlZml4IChzcGVlZHVwKS5cbiAgICAgIGxldCBjb21tb25sZW5ndGggPSB0aGlzLmRpZmZfY29tbW9uUHJlZml4KHRleHQxLCB0ZXh0Mik7XG4gICAgICBjb25zdCBjb21tb25wcmVmaXggPSB0ZXh0MS5zdWJzdHJpbmcoMCwgY29tbW9ubGVuZ3RoKTtcbiAgICAgIHRleHQxID0gdGV4dDEuc3Vic3RyaW5nKGNvbW1vbmxlbmd0aCk7XG4gICAgICB0ZXh0MiA9IHRleHQyLnN1YnN0cmluZyhjb21tb25sZW5ndGgpO1xuXG4gICAgICAvLyBUcmltIG9mZiBjb21tb24gc3VmZml4IChzcGVlZHVwKS5cbiAgICAgIGNvbW1vbmxlbmd0aCA9IHRoaXMuZGlmZl9jb21tb25TdWZmaXgodGV4dDEsIHRleHQyKTtcbiAgICAgIGNvbnN0IGNvbW1vbnN1ZmZpeCA9IHRleHQxLnN1YnN0cmluZyh0ZXh0MS5sZW5ndGggLSBjb21tb25sZW5ndGgpO1xuICAgICAgdGV4dDEgPSB0ZXh0MS5zdWJzdHJpbmcoMCwgdGV4dDEubGVuZ3RoIC0gY29tbW9ubGVuZ3RoKTtcbiAgICAgIHRleHQyID0gdGV4dDIuc3Vic3RyaW5nKDAsIHRleHQyLmxlbmd0aCAtIGNvbW1vbmxlbmd0aCk7XG5cbiAgICAgIC8vIENvbXB1dGUgdGhlIGRpZmYgb24gdGhlIG1pZGRsZSBibG9jay5cbiAgICAgIGNvbnN0IGRpZmZzID0gdGhpcy5kaWZmX2NvbXB1dGVfKHRleHQxLCB0ZXh0MiwgY2hlY2tsaW5lcywgZGVhZGxpbmUpO1xuXG4gICAgICAvLyBSZXN0b3JlIHRoZSBwcmVmaXggYW5kIHN1ZmZpeC5cbiAgICAgIGlmIChjb21tb25wcmVmaXgpIHtcbiAgICAgICAgZGlmZnMudW5zaGlmdChbRGlmZk9wLkVxdWFsLCBjb21tb25wcmVmaXhdKTtcbiAgICAgIH1cbiAgICAgIGlmIChjb21tb25zdWZmaXgpIHtcbiAgICAgICAgZGlmZnMucHVzaChbRGlmZk9wLkVxdWFsLCBjb21tb25zdWZmaXhdKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZGlmZl9jbGVhbnVwTWVyZ2UoZGlmZnMpO1xuICAgICAgcmV0dXJuIGRpZmZzO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIEZpbmQgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gdHdvIHRleHRzLiAgQXNzdW1lcyB0aGF0IHRoZSB0ZXh0cyBkbyBub3RcbiAgICogaGF2ZSBhbnkgY29tbW9uIHByZWZpeCBvciBzdWZmaXguXG4gICAqIEBwYXJhbSAgdGV4dDEgT2xkIHN0cmluZyB0byBiZSBkaWZmZWQuXG4gICAqIEBwYXJhbSAgdGV4dDIgTmV3IHN0cmluZyB0byBiZSBkaWZmZWQuXG4gICAqIEBwYXJhbSAgY2hlY2tsaW5lcyBTcGVlZHVwIGZsYWcuICBJZiBmYWxzZSwgdGhlbiBkb24ndCBydW4gYVxuICAgKiAgICAgbGluZS1sZXZlbCBkaWZmIGZpcnN0IHRvIGlkZW50aWZ5IHRoZSBjaGFuZ2VkIGFyZWFzLlxuICAgKiAgICAgSWYgdHJ1ZSwgdGhlbiBydW4gYSBmYXN0ZXIsIHNsaWdodGx5IGxlc3Mgb3B0aW1hbCBkaWZmLlxuICAgKiBAcGFyYW0gIGRlYWRsaW5lIFRpbWUgd2hlbiB0aGUgZGlmZiBzaG91bGQgYmUgY29tcGxldGUgYnkuXG4gICAqIEByZXR1cm4gIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuXG4gICAqL1xuICAgIGRpZmZfY29tcHV0ZV8gKHRleHQxOiBzdHJpbmcsIHRleHQyOiBzdHJpbmcsIGNoZWNrbGluZXM6IGJvb2xlYW4sXG4gICAgICBkZWFkbGluZTogbnVtYmVyKTogQXJyYXk8RGlmZj4ge1xuICAgIGxldCBkaWZmczogQXJyYXk8RGlmZj47XG5cbiAgICBpZiAoIXRleHQxKSB7XG4gICAgICAvLyBKdXN0IGFkZCBzb21lIHRleHQgKHNwZWVkdXApLlxuICAgICAgcmV0dXJuIFtbRGlmZk9wLkluc2VydCwgdGV4dDJdXTtcbiAgICB9XG5cbiAgICBpZiAoIXRleHQyKSB7XG4gICAgICAvLyBKdXN0IGRlbGV0ZSBzb21lIHRleHQgKHNwZWVkdXApLlxuICAgICAgcmV0dXJuIFtbRGlmZk9wLkRlbGV0ZSwgdGV4dDFdXTtcbiAgICB9XG5cbiAgICBjb25zdCBsb25ndGV4dCA9IHRleHQxLmxlbmd0aCA+IHRleHQyLmxlbmd0aCA/IHRleHQxIDogdGV4dDI7XG4gICAgY29uc3Qgc2hvcnR0ZXh0ID0gdGV4dDEubGVuZ3RoID4gdGV4dDIubGVuZ3RoID8gdGV4dDIgOiB0ZXh0MTtcbiAgICBjb25zdCBpID0gbG9uZ3RleHQuaW5kZXhPZihzaG9ydHRleHQpO1xuICAgIGlmIChpICE9IC0xKSB7XG4gICAgICAvLyBTaG9ydGVyIHRleHQgaXMgaW5zaWRlIHRoZSBsb25nZXIgdGV4dCAoc3BlZWR1cCkuXG4gICAgICBkaWZmcyA9IFtbRGlmZk9wLkluc2VydCwgbG9uZ3RleHQuc3Vic3RyaW5nKDAsIGkpXSxcbiAgICAgICAgICAgICAgW0RpZmZPcC5FcXVhbCwgc2hvcnR0ZXh0XSxcbiAgICAgICAgICAgICAgW0RpZmZPcC5JbnNlcnQsIGxvbmd0ZXh0LnN1YnN0cmluZyhpICsgc2hvcnR0ZXh0Lmxlbmd0aCldXTtcbiAgICAgIC8vIFN3YXAgaW5zZXJ0aW9ucyBmb3IgZGVsZXRpb25zIGlmIGRpZmYgaXMgcmV2ZXJzZWQuXG4gICAgICBpZiAodGV4dDEubGVuZ3RoID4gdGV4dDIubGVuZ3RoKSB7XG4gICAgICAgIGRpZmZzWzBdWzBdID0gZGlmZnNbMl1bMF0gPSBEaWZmT3AuRGVsZXRlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRpZmZzO1xuICAgIH1cblxuICAgIGlmIChzaG9ydHRleHQubGVuZ3RoID09IDEpIHtcbiAgICAgIC8vIFNpbmdsZSBjaGFyYWN0ZXIgc3RyaW5nLlxuICAgICAgLy8gQWZ0ZXIgdGhlIHByZXZpb3VzIHNwZWVkdXAsIHRoZSBjaGFyYWN0ZXIgY2FuJ3QgYmUgYW4gZXF1YWxpdHkuXG4gICAgICByZXR1cm4gW1tEaWZmT3AuRGVsZXRlLCB0ZXh0MV0sIFtEaWZmT3AuSW5zZXJ0LCB0ZXh0Ml1dO1xuICAgIH1cblxuICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGUgcHJvYmxlbSBjYW4gYmUgc3BsaXQgaW4gdHdvLlxuICAgIGNvbnN0IGhtID0gdGhpcy5kaWZmX2hhbGZNYXRjaF8odGV4dDEsIHRleHQyKTtcbiAgICBpZiAoaG0pIHtcbiAgICAgIC8vIEEgaGFsZi1tYXRjaCB3YXMgZm91bmQsIHNvcnQgb3V0IHRoZSByZXR1cm4gZGF0YS5cbiAgICAgIGNvbnN0IHRleHQxX2EgPSBobVswXTtcbiAgICAgIGNvbnN0IHRleHQxX2IgPSBobVsxXTtcbiAgICAgIGNvbnN0IHRleHQyX2EgPSBobVsyXTtcbiAgICAgIGNvbnN0IHRleHQyX2IgPSBobVszXTtcbiAgICAgIGNvbnN0IG1pZF9jb21tb24gPSBobVs0XTtcbiAgICAgIC8vIFNlbmQgYm90aCBwYWlycyBvZmYgZm9yIHNlcGFyYXRlIHByb2Nlc3NpbmcuXG4gICAgICBjb25zdCBkaWZmc19hID0gdGhpcy5kaWZmX21haW4odGV4dDFfYSwgdGV4dDJfYSwgY2hlY2tsaW5lcywgZGVhZGxpbmUpO1xuICAgICAgY29uc3QgZGlmZnNfYiA9IHRoaXMuZGlmZl9tYWluKHRleHQxX2IsIHRleHQyX2IsIGNoZWNrbGluZXMsIGRlYWRsaW5lKTtcbiAgICAgIC8vIE1lcmdlIHRoZSByZXN1bHRzLlxuICAgICAgcmV0dXJuIGRpZmZzX2EuY29uY2F0KFtbRGlmZk9wLkVxdWFsLCBtaWRfY29tbW9uXV0sIGRpZmZzX2IpO1xuICAgIH1cblxuICAgIGlmIChjaGVja2xpbmVzICYmIHRleHQxLmxlbmd0aCA+IDEwMCAmJiB0ZXh0Mi5sZW5ndGggPiAxMDApIHtcbiAgICAgIHJldHVybiB0aGlzLmRpZmZfbGluZU1vZGVfKHRleHQxLCB0ZXh0MiwgZGVhZGxpbmUpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmRpZmZfYmlzZWN0Xyh0ZXh0MSwgdGV4dDIsIGRlYWRsaW5lKTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBEbyBhIHF1aWNrIGxpbmUtbGV2ZWwgZGlmZiBvbiBib3RoIHN0cmluZ3MsIHRoZW4gcmVkaWZmIHRoZSBwYXJ0cyBmb3JcbiAgICogZ3JlYXRlciBhY2N1cmFjeS5cbiAgICogVGhpcyBzcGVlZHVwIGNhbiBwcm9kdWNlIG5vbi1taW5pbWFsIGRpZmZzLlxuICAgKiBAcGFyYW0gIHRleHQxIE9sZCBzdHJpbmcgdG8gYmUgZGlmZmVkLlxuICAgKiBAcGFyYW0gIHRleHQyIE5ldyBzdHJpbmcgdG8gYmUgZGlmZmVkLlxuICAgKiBAcGFyYW0gIGRlYWRsaW5lIFRpbWUgd2hlbiB0aGUgZGlmZiBzaG91bGQgYmUgY29tcGxldGUgYnkuXG4gICAqIEByZXR1cm4gIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuXG4gICAqL1xuICAgIGRpZmZfbGluZU1vZGVfICh0ZXh0MTogc3RyaW5nLCB0ZXh0Mjogc3RyaW5nLCBkZWFkbGluZTogbnVtYmVyKSB7XG4gICAgLy8gU2NhbiB0aGUgdGV4dCBvbiBhIGxpbmUtYnktbGluZSBiYXNpcyBmaXJzdC5cbiAgICBjb25zdCBhID0gdGhpcy5kaWZmX2xpbmVzVG9DaGFyc18odGV4dDEsIHRleHQyKTtcbiAgICB0ZXh0MSA9IGEuY2hhcnMxO1xuICAgIHRleHQyID0gYS5jaGFyczI7XG4gICAgY29uc3QgbGluZWFycmF5ID0gYS5saW5lQXJyYXk7XG5cbiAgICBjb25zdCBkaWZmcyA9IHRoaXMuZGlmZl9tYWluKHRleHQxLCB0ZXh0MiwgZmFsc2UsIGRlYWRsaW5lKTtcblxuICAgIC8vIENvbnZlcnQgdGhlIGRpZmYgYmFjayB0byBvcmlnaW5hbCB0ZXh0LlxuICAgIHRoaXMuZGlmZl9jaGFyc1RvTGluZXNfKGRpZmZzLCBsaW5lYXJyYXkpO1xuICAgIC8vIEVsaW1pbmF0ZSBmcmVhayBtYXRjaGVzIChlLmcuIGJsYW5rIGxpbmVzKVxuICAgIHRoaXMuZGlmZl9jbGVhbnVwU2VtYW50aWMoZGlmZnMpO1xuXG4gICAgLy8gUmVkaWZmIGFueSByZXBsYWNlbWVudCBibG9ja3MsIHRoaXMgdGltZSBjaGFyYWN0ZXItYnktY2hhcmFjdGVyLlxuICAgIC8vIEFkZCBhIGR1bW15IGVudHJ5IGF0IHRoZSBlbmQuXG4gICAgZGlmZnMucHVzaChbRGlmZk9wLkVxdWFsLCAnJ10pO1xuICAgIGxldCBwb2ludGVyID0gMDtcbiAgICBsZXQgY291bnRfZGVsZXRlID0gMDtcbiAgICBsZXQgY291bnRfaW5zZXJ0ID0gMDtcbiAgICBsZXQgdGV4dF9kZWxldGUgPSAnJztcbiAgICBsZXQgdGV4dF9pbnNlcnQgPSAnJztcbiAgICB3aGlsZSAocG9pbnRlciA8IGRpZmZzLmxlbmd0aCkge1xuICAgICAgc3dpdGNoIChkaWZmc1twb2ludGVyXVswXSkge1xuICAgICAgICBjYXNlIERpZmZPcC5JbnNlcnQ6XG4gICAgICAgICAgY291bnRfaW5zZXJ0Kys7XG4gICAgICAgICAgdGV4dF9pbnNlcnQgKz0gZGlmZnNbcG9pbnRlcl1bMV07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgRGlmZk9wLkRlbGV0ZTpcbiAgICAgICAgICBjb3VudF9kZWxldGUrKztcbiAgICAgICAgICB0ZXh0X2RlbGV0ZSArPSBkaWZmc1twb2ludGVyXVsxXTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBEaWZmT3AuRXF1YWw6XG4gICAgICAgICAgLy8gVXBvbiByZWFjaGluZyBhbiBlcXVhbGl0eSwgY2hlY2sgZm9yIHByaW9yIHJlZHVuZGFuY2llcy5cbiAgICAgICAgICBpZiAoY291bnRfZGVsZXRlID49IDEgJiYgY291bnRfaW5zZXJ0ID49IDEpIHtcbiAgICAgICAgICAgIC8vIERlbGV0ZSB0aGUgb2ZmZW5kaW5nIHJlY29yZHMgYW5kIGFkZCB0aGUgbWVyZ2VkIG9uZXMuXG4gICAgICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciAtIGNvdW50X2RlbGV0ZSAtIGNvdW50X2luc2VydCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50X2RlbGV0ZSArIGNvdW50X2luc2VydCk7XG4gICAgICAgICAgICBwb2ludGVyID0gcG9pbnRlciAtIGNvdW50X2RlbGV0ZSAtIGNvdW50X2luc2VydDtcbiAgICAgICAgICAgIGNvbnN0IGIgPSB0aGlzLmRpZmZfbWFpbih0ZXh0X2RlbGV0ZSwgdGV4dF9pbnNlcnQsIGZhbHNlLCBkZWFkbGluZSk7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gYi5sZW5ndGggLSAxOyBqID49IDA7IGotLSkge1xuICAgICAgICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciwgMCwgYltqXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwb2ludGVyID0gcG9pbnRlciArIGIubGVuZ3RoO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb3VudF9pbnNlcnQgPSAwO1xuICAgICAgICAgIGNvdW50X2RlbGV0ZSA9IDA7XG4gICAgICAgICAgdGV4dF9kZWxldGUgPSAnJztcbiAgICAgICAgICB0ZXh0X2luc2VydCA9ICcnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgcG9pbnRlcisrO1xuICAgIH1cbiAgICBkaWZmcy5wb3AoKTsgIC8vIFJlbW92ZSB0aGUgZHVtbXkgZW50cnkgYXQgdGhlIGVuZC5cblxuICAgIHJldHVybiBkaWZmcztcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBGaW5kIHRoZSAnbWlkZGxlIHNuYWtlJyBvZiBhIGRpZmYsIHNwbGl0IHRoZSBwcm9ibGVtIGluIHR3b1xuICAgKiBhbmQgcmV0dXJuIHRoZSByZWN1cnNpdmVseSBjb25zdHJ1Y3RlZCBkaWZmLlxuICAgKiBTZWUgTXllcnMgMTk4NiBwYXBlcjogQW4gTyhORCkgRGlmZmVyZW5jZSBBbGdvcml0aG0gYW5kIEl0cyBjb25zdGlhdGlvbnMuXG4gICAqIEBwYXJhbSAgdGV4dDEgT2xkIHN0cmluZyB0byBiZSBkaWZmZWQuXG4gICAqIEBwYXJhbSAgdGV4dDIgTmV3IHN0cmluZyB0byBiZSBkaWZmZWQuXG4gICAqIEBwYXJhbSAgZGVhZGxpbmUgVGltZSBhdCB3aGljaCB0byBiYWlsIGlmIG5vdCB5ZXQgY29tcGxldGUuXG4gICAqIEByZXR1cm4gIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuXG4gICAqL1xuICAgIGRpZmZfYmlzZWN0XyAodGV4dDE6IHN0cmluZywgdGV4dDI6IHN0cmluZywgZGVhZGxpbmU6IG51bWJlcik6IEFycmF5PERpZmY+IHtcbiAgICAvLyBDYWNoZSB0aGUgdGV4dCBsZW5ndGhzIHRvIHByZXZlbnQgbXVsdGlwbGUgY2FsbHMuXG4gICAgY29uc3QgdGV4dDFfbGVuZ3RoID0gdGV4dDEubGVuZ3RoO1xuICAgIGNvbnN0IHRleHQyX2xlbmd0aCA9IHRleHQyLmxlbmd0aDtcbiAgICBjb25zdCBtYXhfZCA9IE1hdGguY2VpbCgodGV4dDFfbGVuZ3RoICsgdGV4dDJfbGVuZ3RoKSAvIDIpO1xuICAgIGNvbnN0IHZfb2Zmc2V0ID0gbWF4X2Q7XG4gICAgY29uc3Qgdl9sZW5ndGggPSAyICogbWF4X2Q7XG4gICAgY29uc3QgdjEgPSBuZXcgQXJyYXkodl9sZW5ndGgpO1xuICAgIGNvbnN0IHYyID0gbmV3IEFycmF5KHZfbGVuZ3RoKTtcbiAgICAvLyBTZXR0aW5nIGFsbCBlbGVtZW50cyB0byAtMSBpcyBmYXN0ZXIgaW4gQ2hyb21lICYgRmlyZWZveCB0aGFuIG1peGluZ1xuICAgIC8vIGludGVnZXJzIGFuZCB1bmRlZmluZWQuXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCB2X2xlbmd0aDsgeCsrKSB7XG4gICAgICB2MVt4XSA9IC0xO1xuICAgICAgdjJbeF0gPSAtMTtcbiAgICB9XG4gICAgdjFbdl9vZmZzZXQgKyAxXSA9IDA7XG4gICAgdjJbdl9vZmZzZXQgKyAxXSA9IDA7XG4gICAgY29uc3QgZGVsdGEgPSB0ZXh0MV9sZW5ndGggLSB0ZXh0Ml9sZW5ndGg7XG4gICAgLy8gSWYgdGhlIHRvdGFsIG51bWJlciBvZiBjaGFyYWN0ZXJzIGlzIG9kZCwgdGhlbiB0aGUgZnJvbnQgcGF0aCB3aWxsIGNvbGxpZGVcbiAgICAvLyB3aXRoIHRoZSByZXZlcnNlIHBhdGguXG4gICAgY29uc3QgZnJvbnQgPSAoZGVsdGEgJSAyICE9IDApO1xuICAgIC8vIE9mZnNldHMgZm9yIHN0YXJ0IGFuZCBlbmQgb2YgayBsb29wLlxuICAgIC8vIFByZXZlbnRzIG1hcHBpbmcgb2Ygc3BhY2UgYmV5b25kIHRoZSBncmlkLlxuICAgIGxldCBrMXN0YXJ0ID0gMDtcbiAgICBsZXQgazFlbmQgPSAwO1xuICAgIGxldCBrMnN0YXJ0ID0gMDtcbiAgICBsZXQgazJlbmQgPSAwO1xuICAgIGZvciAobGV0IGQgPSAwOyBkIDwgbWF4X2Q7IGQrKykge1xuICAgICAgLy8gQmFpbCBvdXQgaWYgZGVhZGxpbmUgaXMgcmVhY2hlZC5cbiAgICAgIGlmICgobmV3IERhdGUoKSkuZ2V0VGltZSgpID4gZGVhZGxpbmUpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIFdhbGsgdGhlIGZyb250IHBhdGggb25lIHN0ZXAuXG4gICAgICBmb3IgKGxldCBrMSA9IC1kICsgazFzdGFydDsgazEgPD0gZCAtIGsxZW5kOyBrMSArPSAyKSB7XG4gICAgICAgIGNvbnN0IGsxX29mZnNldCA9IHZfb2Zmc2V0ICsgazE7XG4gICAgICAgIGxldCB4MTtcbiAgICAgICAgaWYgKGsxID09IC1kIHx8IChrMSAhPSBkICYmIHYxW2sxX29mZnNldCAtIDFdIDwgdjFbazFfb2Zmc2V0ICsgMV0pKSB7XG4gICAgICAgICAgeDEgPSB2MVtrMV9vZmZzZXQgKyAxXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB4MSA9IHYxW2sxX29mZnNldCAtIDFdICsgMTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgeTEgPSB4MSAtIGsxO1xuICAgICAgICB3aGlsZSAoeDEgPCB0ZXh0MV9sZW5ndGggJiYgeTEgPCB0ZXh0Ml9sZW5ndGggJiZcbiAgICAgICAgICAgICAgdGV4dDEuY2hhckF0KHgxKSA9PSB0ZXh0Mi5jaGFyQXQoeTEpKSB7XG4gICAgICAgICAgeDErKztcbiAgICAgICAgICB5MSsrO1xuICAgICAgICB9XG4gICAgICAgIHYxW2sxX29mZnNldF0gPSB4MTtcbiAgICAgICAgaWYgKHgxID4gdGV4dDFfbGVuZ3RoKSB7XG4gICAgICAgICAgLy8gUmFuIG9mZiB0aGUgcmlnaHQgb2YgdGhlIGdyYXBoLlxuICAgICAgICAgIGsxZW5kICs9IDI7XG4gICAgICAgIH0gZWxzZSBpZiAoeTEgPiB0ZXh0Ml9sZW5ndGgpIHtcbiAgICAgICAgICAvLyBSYW4gb2ZmIHRoZSBib3R0b20gb2YgdGhlIGdyYXBoLlxuICAgICAgICAgIGsxc3RhcnQgKz0gMjtcbiAgICAgICAgfSBlbHNlIGlmIChmcm9udCkge1xuICAgICAgICAgIGNvbnN0IGsyX29mZnNldCA9IHZfb2Zmc2V0ICsgZGVsdGEgLSBrMTtcbiAgICAgICAgICBpZiAoazJfb2Zmc2V0ID49IDAgJiYgazJfb2Zmc2V0IDwgdl9sZW5ndGggJiYgdjJbazJfb2Zmc2V0XSAhPSAtMSkge1xuICAgICAgICAgICAgLy8gTWlycm9yIHgyIG9udG8gdG9wLWxlZnQgY29vcmRpbmF0ZSBzeXN0ZW0uXG4gICAgICAgICAgICBjb25zdCB4MiA9IHRleHQxX2xlbmd0aCAtIHYyW2syX29mZnNldF07XG4gICAgICAgICAgICBpZiAoeDEgPj0geDIpIHtcbiAgICAgICAgICAgICAgLy8gT3ZlcmxhcCBkZXRlY3RlZC5cbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGlmZl9iaXNlY3RTcGxpdF8odGV4dDEsIHRleHQyLCB4MSwgeTEsIGRlYWRsaW5lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gV2FsayB0aGUgcmV2ZXJzZSBwYXRoIG9uZSBzdGVwLlxuICAgICAgZm9yIChsZXQgazIgPSAtZCArIGsyc3RhcnQ7IGsyIDw9IGQgLSBrMmVuZDsgazIgKz0gMikge1xuICAgICAgICBjb25zdCBrMl9vZmZzZXQgPSB2X29mZnNldCArIGsyO1xuICAgICAgICBsZXQgeDI6IG51bWJlcjtcbiAgICAgICAgaWYgKGsyID09IC1kIHx8IChrMiAhPSBkICYmIHYyW2syX29mZnNldCAtIDFdIDwgdjJbazJfb2Zmc2V0ICsgMV0pKSB7XG4gICAgICAgICAgeDIgPSB2MltrMl9vZmZzZXQgKyAxXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB4MiA9IHYyW2syX29mZnNldCAtIDFdICsgMTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgeTIgPSB4MiAtIGsyO1xuICAgICAgICB3aGlsZSAoeDIgPCB0ZXh0MV9sZW5ndGggJiYgeTIgPCB0ZXh0Ml9sZW5ndGggJiZcbiAgICAgICAgICAgICAgdGV4dDEuY2hhckF0KHRleHQxX2xlbmd0aCAtIHgyIC0gMSkgPT1cbiAgICAgICAgICAgICAgdGV4dDIuY2hhckF0KHRleHQyX2xlbmd0aCAtIHkyIC0gMSkpIHtcbiAgICAgICAgICB4MisrO1xuICAgICAgICAgIHkyKys7XG4gICAgICAgIH1cbiAgICAgICAgdjJbazJfb2Zmc2V0XSA9IHgyO1xuICAgICAgICBpZiAoeDIgPiB0ZXh0MV9sZW5ndGgpIHtcbiAgICAgICAgICAvLyBSYW4gb2ZmIHRoZSBsZWZ0IG9mIHRoZSBncmFwaC5cbiAgICAgICAgICBrMmVuZCArPSAyO1xuICAgICAgICB9IGVsc2UgaWYgKHkyID4gdGV4dDJfbGVuZ3RoKSB7XG4gICAgICAgICAgLy8gUmFuIG9mZiB0aGUgdG9wIG9mIHRoZSBncmFwaC5cbiAgICAgICAgICBrMnN0YXJ0ICs9IDI7XG4gICAgICAgIH0gZWxzZSBpZiAoIWZyb250KSB7XG4gICAgICAgICAgY29uc3QgazFfb2Zmc2V0ID0gdl9vZmZzZXQgKyBkZWx0YSAtIGsyO1xuICAgICAgICAgIGlmIChrMV9vZmZzZXQgPj0gMCAmJiBrMV9vZmZzZXQgPCB2X2xlbmd0aCAmJiB2MVtrMV9vZmZzZXRdICE9IC0xKSB7XG4gICAgICAgICAgICBjb25zdCB4MSA9IHYxW2sxX29mZnNldF07XG4gICAgICAgICAgICBjb25zdCB5MSA9IHZfb2Zmc2V0ICsgeDEgLSBrMV9vZmZzZXQ7XG4gICAgICAgICAgICAvLyBNaXJyb3IgeDIgb250byB0b3AtbGVmdCBjb29yZGluYXRlIHN5c3RlbS5cbiAgICAgICAgICAgIHgyID0gdGV4dDFfbGVuZ3RoIC0geDI7XG4gICAgICAgICAgICBpZiAoeDEgPj0geDIpIHtcbiAgICAgICAgICAgICAgLy8gT3ZlcmxhcCBkZXRlY3RlZC5cbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGlmZl9iaXNlY3RTcGxpdF8odGV4dDEsIHRleHQyLCB4MSwgeTEsIGRlYWRsaW5lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gRGlmZiB0b29rIHRvbyBsb25nIGFuZCBoaXQgdGhlIGRlYWRsaW5lIG9yXG4gICAgLy8gbnVtYmVyIG9mIGRpZmZzIGVxdWFscyBudW1iZXIgb2YgY2hhcmFjdGVycywgbm8gY29tbW9uYWxpdHkgYXQgYWxsLlxuICAgIHJldHVybiBbW0RpZmZPcC5EZWxldGUsIHRleHQxXSwgW0RpZmZPcC5JbnNlcnQsIHRleHQyXV07XG4gIH07XG5cblxuICAvKipcbiAgICogR2l2ZW4gdGhlIGxvY2F0aW9uIG9mIHRoZSAnbWlkZGxlIHNuYWtlJywgc3BsaXQgdGhlIGRpZmYgaW4gdHdvIHBhcnRzXG4gICAqIGFuZCByZWN1cnNlLlxuICAgKiBAcGFyYW0gIHRleHQxIE9sZCBzdHJpbmcgdG8gYmUgZGlmZmVkLlxuICAgKiBAcGFyYW0gIHRleHQyIE5ldyBzdHJpbmcgdG8gYmUgZGlmZmVkLlxuICAgKiBAcGFyYW0gIHggSW5kZXggb2Ygc3BsaXQgcG9pbnQgaW4gdGV4dDEuXG4gICAqIEBwYXJhbSAgeSBJbmRleCBvZiBzcGxpdCBwb2ludCBpbiB0ZXh0Mi5cbiAgICogQHBhcmFtICBkZWFkbGluZSBUaW1lIGF0IHdoaWNoIHRvIGJhaWwgaWYgbm90IHlldCBjb21wbGV0ZS5cbiAgICogQHJldHVybiAgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXG5cbiAgICovXG4gICAgZGlmZl9iaXNlY3RTcGxpdF8gKHRleHQxOiBzdHJpbmcsIHRleHQyOiBzdHJpbmcsIHg6IG51bWJlciwgeTogbnVtYmVyLCBkZWFkbGluZTogbnVtYmVyKSB7XG4gICAgICBjb25zdCB0ZXh0MWEgPSB0ZXh0MS5zdWJzdHJpbmcoMCwgeCk7XG4gICAgICBjb25zdCB0ZXh0MmEgPSB0ZXh0Mi5zdWJzdHJpbmcoMCwgeSk7XG4gICAgICBjb25zdCB0ZXh0MWIgPSB0ZXh0MS5zdWJzdHJpbmcoeCk7XG4gICAgICBjb25zdCB0ZXh0MmIgPSB0ZXh0Mi5zdWJzdHJpbmcoeSk7XG5cbiAgICAgIC8vIENvbXB1dGUgYm90aCBkaWZmcyBzZXJpYWxseS5cbiAgICAgIGNvbnN0IGRpZmZzID0gdGhpcy5kaWZmX21haW4odGV4dDFhLCB0ZXh0MmEsIGZhbHNlLCBkZWFkbGluZSk7XG4gICAgICBjb25zdCBkaWZmc2IgPSB0aGlzLmRpZmZfbWFpbih0ZXh0MWIsIHRleHQyYiwgZmFsc2UsIGRlYWRsaW5lKTtcblxuICAgICAgcmV0dXJuIGRpZmZzLmNvbmNhdChkaWZmc2IpO1xuICAgIH07XG5cblxuICAvKipcbiAgICogU3BsaXQgdHdvIHRleHRzIGludG8gYW4gYXJyYXkgb2Ygc3RyaW5ncy4gIFJlZHVjZSB0aGUgdGV4dHMgdG8gYSBzdHJpbmcgb2ZcbiAgICogaGFzaGVzIHdoZXJlIGVhY2ggVW5pY29kZSBjaGFyYWN0ZXIgcmVwcmVzZW50cyBvbmUgbGluZS5cbiAgICogQHBhcmFtICB0ZXh0MSBGaXJzdCBzdHJpbmcuXG4gICAqIEBwYXJhbSAgdGV4dDIgU2Vjb25kIHN0cmluZy5cbiAgICogQHJldHVybiB9XG4gICAqICAgICBBbiBvYmplY3QgY29udGFpbmluZyB0aGUgZW5jb2RlZCB0ZXh0MSwgdGhlIGVuY29kZWQgdGV4dDIgYW5kXG4gICAqICAgICB0aGUgYXJyYXkgb2YgdW5pcXVlIHN0cmluZ3MuXG4gICAqICAgICBUaGUgemVyb3RoIGVsZW1lbnQgb2YgdGhlIGFycmF5IG9mIHVuaXF1ZSBzdHJpbmdzIGlzIGludGVudGlvbmFsbHkgYmxhbmsuXG5cbiAgICovXG4gICAgZGlmZl9saW5lc1RvQ2hhcnNfICh0ZXh0MTogc3RyaW5nLCB0ZXh0Mjogc3RyaW5nKSB7XG4gICAgICBjb25zdCBsaW5lQXJyYXkgPSBbXTsgIC8vIGUuZy4gbGluZUFycmF5WzRdID09ICdIZWxsb1xcbidcbiAgICAgIGNvbnN0IGxpbmVIYXNoID0ge307ICAgLy8gZS5nLiBsaW5lSGFzaFsnSGVsbG9cXG4nXSA9PSA0XG5cbiAgICAgIC8vICdcXHgwMCcgaXMgYSB2YWxpZCBjaGFyYWN0ZXIsIGJ1dCBjb25zdGlvdXMgZGVidWdnZXJzIGRvbid0IGxpa2UgaXQuXG4gICAgICAvLyBTbyB3ZSdsbCBpbnNlcnQgYSBqdW5rIGVudHJ5IHRvIGF2b2lkIGdlbmVyYXRpbmcgYSBudWxsIGNoYXJhY3Rlci5cbiAgICAgIGxpbmVBcnJheVswXSA9ICcnO1xuXG5cbiAgICAgIGNvbnN0IGNoYXJzMSA9IHRoaXMuZGlmZl9saW5lc1RvQ2hhcnNNdW5nZV8odGV4dDEsIGxpbmVBcnJheSwgbGluZUhhc2gpO1xuICAgICAgY29uc3QgY2hhcnMyID0gdGhpcy5kaWZmX2xpbmVzVG9DaGFyc011bmdlXyh0ZXh0MiwgbGluZUFycmF5LCBsaW5lSGFzaCk7XG4gICAgICByZXR1cm4ge2NoYXJzMTogY2hhcnMxLCBjaGFyczI6IGNoYXJzMiwgbGluZUFycmF5OiBsaW5lQXJyYXl9O1xuICAgfTtcblxuICAvKipcbiAgICogU3BsaXQgYSB0ZXh0IGludG8gYW4gYXJyYXkgb2Ygc3RyaW5ncy4gIFJlZHVjZSB0aGUgdGV4dHMgdG8gYSBzdHJpbmcgb2ZcbiAgICogaGFzaGVzIHdoZXJlIGVhY2ggVW5pY29kZSBjaGFyYWN0ZXIgcmVwcmVzZW50cyBvbmUgbGluZS5cbiAgICogTW9kaWZpZXMgbGluZWFycmF5IGFuZCBsaW5laGFzaCB0aHJvdWdoIGJlaW5nIGEgY2xvc3VyZS5cbiAgICogQHBhcmFtICB0ZXh0IFN0cmluZyB0byBlbmNvZGUuXG4gICAqIEByZXR1cm4gIEVuY29kZWQgc3RyaW5nLlxuXG4gICAqL1xuICBkaWZmX2xpbmVzVG9DaGFyc011bmdlXyh0ZXh0OiBzdHJpbmcsIGxpbmVBcnJheTogQXJyYXk8c3RyaW5nPiwgbGluZUhhc2g6IGFueSk6IHN0cmluZyB7XG4gICAgbGV0IGNoYXJzID0gJyc7XG4gICAgLy8gV2FsayB0aGUgdGV4dCwgcHVsbGluZyBvdXQgYSBzdWJzdHJpbmcgZm9yIGVhY2ggbGluZS5cbiAgICAvLyB0ZXh0LnNwbGl0KCdcXG4nKSB3b3VsZCB3b3VsZCB0ZW1wb3JhcmlseSBkb3VibGUgb3VyIG1lbW9yeSBmb290cHJpbnQuXG4gICAgLy8gTW9kaWZ5aW5nIHRleHQgd291bGQgY3JlYXRlIG1hbnkgbGFyZ2Ugc3RyaW5ncyB0byBnYXJiYWdlIGNvbGxlY3QuXG4gICAgbGV0IGxpbmVTdGFydCA9IDA7XG4gICAgbGV0IGxpbmVFbmQgPSAtMTtcbiAgICAvLyBLZWVwaW5nIG91ciBvd24gbGVuZ3RoIGNvbnN0aWFibGUgaXMgZmFzdGVyIHRoYW4gbG9va2luZyBpdCB1cC5cbiAgICBsZXQgbGluZUFycmF5TGVuZ3RoID0gbGluZUFycmF5Lmxlbmd0aDtcbiAgICB3aGlsZSAobGluZUVuZCA8IHRleHQubGVuZ3RoIC0gMSkge1xuICAgICAgbGluZUVuZCA9IHRleHQuaW5kZXhPZignXFxuJywgbGluZVN0YXJ0KTtcbiAgICAgIGlmIChsaW5lRW5kID09IC0xKSB7XG4gICAgICAgIGxpbmVFbmQgPSB0ZXh0Lmxlbmd0aCAtIDE7XG4gICAgICB9XG4gICAgICBjb25zdCBsaW5lID0gdGV4dC5zdWJzdHJpbmcobGluZVN0YXJ0LCBsaW5lRW5kICsgMSk7XG4gICAgICBsaW5lU3RhcnQgPSBsaW5lRW5kICsgMTtcblxuICAgICAgaWYgKGxpbmVIYXNoLmhhc093blByb3BlcnR5ID8gbGluZUhhc2guaGFzT3duUHJvcGVydHkobGluZSkgOlxuICAgICAgICAgIChsaW5lSGFzaFtsaW5lXSAhPT0gdW5kZWZpbmVkKSkge1xuICAgICAgICBjaGFycyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGxpbmVIYXNoW2xpbmVdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNoYXJzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUobGluZUFycmF5TGVuZ3RoKTtcbiAgICAgICAgbGluZUhhc2hbbGluZV0gPSBsaW5lQXJyYXlMZW5ndGg7XG4gICAgICAgIGxpbmVBcnJheVtsaW5lQXJyYXlMZW5ndGgrK10gPSBsaW5lO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY2hhcnM7XG4gIH1cblxuICAvKipcbiAgICogUmVoeWRyYXRlIHRoZSB0ZXh0IGluIGEgZGlmZiBmcm9tIGEgc3RyaW5nIG9mIGxpbmUgaGFzaGVzIHRvIHJlYWwgbGluZXMgb2ZcbiAgICogdGV4dC5cbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cbiAgICogQHBhcmFtICBsaW5lQXJyYXkgQXJyYXkgb2YgdW5pcXVlIHN0cmluZ3MuXG5cbiAgICovXG4gICAgZGlmZl9jaGFyc1RvTGluZXNfIChkaWZmczogQXJyYXk8RGlmZj4sIGxpbmVBcnJheTogQXJyYXk8c3RyaW5nPik6IHZvaWQge1xuICAgIGZvciAobGV0IHggPSAwOyB4IDwgZGlmZnMubGVuZ3RoOyB4KyspIHtcbiAgICAgIGNvbnN0IGNoYXJzID0gZGlmZnNbeF1bMV07XG4gICAgICBjb25zdCB0ZXh0ID0gW107XG4gICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGNoYXJzLmxlbmd0aDsgeSsrKSB7XG4gICAgICAgIHRleHRbeV0gPSBsaW5lQXJyYXlbY2hhcnMuY2hhckNvZGVBdCh5KV07XG4gICAgICB9XG4gICAgICBkaWZmc1t4XVsxXSA9IHRleHQuam9pbignJyk7XG4gICAgfVxuICB9O1xuXG5cbiAgLyoqXG4gICAqIERldGVybWluZSB0aGUgY29tbW9uIHByZWZpeCBvZiB0d28gc3RyaW5ncy5cbiAgICogQHBhcmFtICB0ZXh0MSBGaXJzdCBzdHJpbmcuXG4gICAqIEBwYXJhbSAgdGV4dDIgU2Vjb25kIHN0cmluZy5cbiAgICogQHJldHVybiAgVGhlIG51bWJlciBvZiBjaGFyYWN0ZXJzIGNvbW1vbiB0byB0aGUgc3RhcnQgb2YgZWFjaFxuICAgKiAgICAgc3RyaW5nLlxuICAgKi9cbiAgICBkaWZmX2NvbW1vblByZWZpeCAodGV4dDE6IHN0cmluZywgdGV4dDI6IHN0cmluZyk6IG51bWJlciB7XG4gICAgLy8gUXVpY2sgY2hlY2sgZm9yIGNvbW1vbiBudWxsIGNhc2VzLlxuICAgIGlmICghdGV4dDEgfHwgIXRleHQyIHx8IHRleHQxLmNoYXJBdCgwKSAhPSB0ZXh0Mi5jaGFyQXQoMCkpIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICAvLyBCaW5hcnkgc2VhcmNoLlxuICAgIC8vIFBlcmZvcm1hbmNlIGFuYWx5c2lzOiBodHRwOi8vbmVpbC5mcmFzZXIubmFtZS9uZXdzLzIwMDcvMTAvMDkvXG4gICAgbGV0IHBvaW50ZXJtaW4gPSAwO1xuICAgIGxldCBwb2ludGVybWF4ID0gTWF0aC5taW4odGV4dDEubGVuZ3RoLCB0ZXh0Mi5sZW5ndGgpO1xuICAgIGxldCBwb2ludGVybWlkID0gcG9pbnRlcm1heDtcbiAgICBsZXQgcG9pbnRlcnN0YXJ0ID0gMDtcbiAgICB3aGlsZSAocG9pbnRlcm1pbiA8IHBvaW50ZXJtaWQpIHtcbiAgICAgIGlmICh0ZXh0MS5zdWJzdHJpbmcocG9pbnRlcnN0YXJ0LCBwb2ludGVybWlkKSA9PVxuICAgICAgICAgIHRleHQyLnN1YnN0cmluZyhwb2ludGVyc3RhcnQsIHBvaW50ZXJtaWQpKSB7XG4gICAgICAgIHBvaW50ZXJtaW4gPSBwb2ludGVybWlkO1xuICAgICAgICBwb2ludGVyc3RhcnQgPSBwb2ludGVybWluO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcG9pbnRlcm1heCA9IHBvaW50ZXJtaWQ7XG4gICAgICB9XG4gICAgICBwb2ludGVybWlkID0gTWF0aC5mbG9vcigocG9pbnRlcm1heCAtIHBvaW50ZXJtaW4pIC8gMiArIHBvaW50ZXJtaW4pO1xuICAgIH1cbiAgICByZXR1cm4gcG9pbnRlcm1pZDtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmUgdGhlIGNvbW1vbiBzdWZmaXggb2YgdHdvIHN0cmluZ3MuXG4gICAqIEBwYXJhbSAgdGV4dDEgRmlyc3Qgc3RyaW5nLlxuICAgKiBAcGFyYW0gIHRleHQyIFNlY29uZCBzdHJpbmcuXG4gICAqIEByZXR1cm4gIFRoZSBudW1iZXIgb2YgY2hhcmFjdGVycyBjb21tb24gdG8gdGhlIGVuZCBvZiBlYWNoIHN0cmluZy5cbiAgICovXG4gICAgZGlmZl9jb21tb25TdWZmaXggKHRleHQxOiBzdHJpbmcsIHRleHQyOiBzdHJpbmcpOiBudW1iZXIge1xuICAgIC8vIFF1aWNrIGNoZWNrIGZvciBjb21tb24gbnVsbCBjYXNlcy5cbiAgICBpZiAoIXRleHQxIHx8ICF0ZXh0MiB8fFxuICAgICAgICB0ZXh0MS5jaGFyQXQodGV4dDEubGVuZ3RoIC0gMSkgIT0gdGV4dDIuY2hhckF0KHRleHQyLmxlbmd0aCAtIDEpKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgLy8gQmluYXJ5IHNlYXJjaC5cbiAgICAvLyBQZXJmb3JtYW5jZSBhbmFseXNpczogaHR0cDovL25laWwuZnJhc2VyLm5hbWUvbmV3cy8yMDA3LzEwLzA5L1xuICAgIGxldCBwb2ludGVybWluID0gMDtcbiAgICBsZXQgcG9pbnRlcm1heCA9IE1hdGgubWluKHRleHQxLmxlbmd0aCwgdGV4dDIubGVuZ3RoKTtcbiAgICBsZXQgcG9pbnRlcm1pZCA9IHBvaW50ZXJtYXg7XG4gICAgbGV0IHBvaW50ZXJlbmQgPSAwO1xuICAgIHdoaWxlIChwb2ludGVybWluIDwgcG9pbnRlcm1pZCkge1xuICAgICAgaWYgKHRleHQxLnN1YnN0cmluZyh0ZXh0MS5sZW5ndGggLSBwb2ludGVybWlkLCB0ZXh0MS5sZW5ndGggLSBwb2ludGVyZW5kKSA9PVxuICAgICAgICAgIHRleHQyLnN1YnN0cmluZyh0ZXh0Mi5sZW5ndGggLSBwb2ludGVybWlkLCB0ZXh0Mi5sZW5ndGggLSBwb2ludGVyZW5kKSkge1xuICAgICAgICBwb2ludGVybWluID0gcG9pbnRlcm1pZDtcbiAgICAgICAgcG9pbnRlcmVuZCA9IHBvaW50ZXJtaW47XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwb2ludGVybWF4ID0gcG9pbnRlcm1pZDtcbiAgICAgIH1cbiAgICAgIHBvaW50ZXJtaWQgPSBNYXRoLmZsb29yKChwb2ludGVybWF4IC0gcG9pbnRlcm1pbikgLyAyICsgcG9pbnRlcm1pbik7XG4gICAgfVxuICAgIHJldHVybiBwb2ludGVybWlkO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIERldGVybWluZSBpZiB0aGUgc3VmZml4IG9mIG9uZSBzdHJpbmcgaXMgdGhlIHByZWZpeCBvZiBhbm90aGVyLlxuICAgKiBAcGFyYW0gIHRleHQxIEZpcnN0IHN0cmluZy5cbiAgICogQHBhcmFtICB0ZXh0MiBTZWNvbmQgc3RyaW5nLlxuICAgKiBAcmV0dXJuICBUaGUgbnVtYmVyIG9mIGNoYXJhY3RlcnMgY29tbW9uIHRvIHRoZSBlbmQgb2YgdGhlIGZpcnN0XG4gICAqICAgICBzdHJpbmcgYW5kIHRoZSBzdGFydCBvZiB0aGUgc2Vjb25kIHN0cmluZy5cblxuICAgKi9cbiAgICBkaWZmX2NvbW1vbk92ZXJsYXBfICh0ZXh0MTogc3RyaW5nLCB0ZXh0Mjogc3RyaW5nKTogbnVtYmVyIHtcbiAgICAvLyBDYWNoZSB0aGUgdGV4dCBsZW5ndGhzIHRvIHByZXZlbnQgbXVsdGlwbGUgY2FsbHMuXG4gICAgY29uc3QgdGV4dDFfbGVuZ3RoID0gdGV4dDEubGVuZ3RoO1xuICAgIGNvbnN0IHRleHQyX2xlbmd0aCA9IHRleHQyLmxlbmd0aDtcbiAgICAvLyBFbGltaW5hdGUgdGhlIG51bGwgY2FzZS5cbiAgICBpZiAodGV4dDFfbGVuZ3RoID09IDAgfHwgdGV4dDJfbGVuZ3RoID09IDApIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICAvLyBUcnVuY2F0ZSB0aGUgbG9uZ2VyIHN0cmluZy5cbiAgICBpZiAodGV4dDFfbGVuZ3RoID4gdGV4dDJfbGVuZ3RoKSB7XG4gICAgICB0ZXh0MSA9IHRleHQxLnN1YnN0cmluZyh0ZXh0MV9sZW5ndGggLSB0ZXh0Ml9sZW5ndGgpO1xuICAgIH0gZWxzZSBpZiAodGV4dDFfbGVuZ3RoIDwgdGV4dDJfbGVuZ3RoKSB7XG4gICAgICB0ZXh0MiA9IHRleHQyLnN1YnN0cmluZygwLCB0ZXh0MV9sZW5ndGgpO1xuICAgIH1cbiAgICBjb25zdCB0ZXh0X2xlbmd0aCA9IE1hdGgubWluKHRleHQxX2xlbmd0aCwgdGV4dDJfbGVuZ3RoKTtcbiAgICAvLyBRdWljayBjaGVjayBmb3IgdGhlIHdvcnN0IGNhc2UuXG4gICAgaWYgKHRleHQxID09IHRleHQyKSB7XG4gICAgICByZXR1cm4gdGV4dF9sZW5ndGg7XG4gICAgfVxuXG4gICAgLy8gU3RhcnQgYnkgbG9va2luZyBmb3IgYSBzaW5nbGUgY2hhcmFjdGVyIG1hdGNoXG4gICAgLy8gYW5kIGluY3JlYXNlIGxlbmd0aCB1bnRpbCBubyBtYXRjaCBpcyBmb3VuZC5cbiAgICAvLyBQZXJmb3JtYW5jZSBhbmFseXNpczogaHR0cDovL25laWwuZnJhc2VyLm5hbWUvbmV3cy8yMDEwLzExLzA0L1xuICAgIGxldCBiZXN0ID0gMDtcbiAgICBsZXQgbGVuZ3RoID0gMTtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgY29uc3QgcGF0dGVybiA9IHRleHQxLnN1YnN0cmluZyh0ZXh0X2xlbmd0aCAtIGxlbmd0aCk7XG4gICAgICBjb25zdCBmb3VuZCA9IHRleHQyLmluZGV4T2YocGF0dGVybik7XG4gICAgICBpZiAoZm91bmQgPT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIGJlc3Q7XG4gICAgICB9XG4gICAgICBsZW5ndGggKz0gZm91bmQ7XG4gICAgICBpZiAoZm91bmQgPT0gMCB8fCB0ZXh0MS5zdWJzdHJpbmcodGV4dF9sZW5ndGggLSBsZW5ndGgpID09XG4gICAgICAgICAgdGV4dDIuc3Vic3RyaW5nKDAsIGxlbmd0aCkpIHtcbiAgICAgICAgYmVzdCA9IGxlbmd0aDtcbiAgICAgICAgbGVuZ3RoKys7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG5cbiAgLyoqXG4gICAqIERvIHRoZSB0d28gdGV4dHMgc2hhcmUgYSBzdWJzdHJpbmcgd2hpY2ggaXMgYXQgbGVhc3QgaGFsZiB0aGUgbGVuZ3RoIG9mIHRoZVxuICAgKiBsb25nZXIgdGV4dD9cbiAgICogVGhpcyBzcGVlZHVwIGNhbiBwcm9kdWNlIG5vbi1taW5pbWFsIGRpZmZzLlxuICAgKiBAcGFyYW0gIHRleHQxIEZpcnN0IHN0cmluZy5cbiAgICogQHBhcmFtICB0ZXh0MiBTZWNvbmQgc3RyaW5nLlxuICAgKiBAcmV0dXJuICBGaXZlIGVsZW1lbnQgQXJyYXksIGNvbnRhaW5pbmcgdGhlIHByZWZpeCBvZlxuICAgKiAgICAgdGV4dDEsIHRoZSBzdWZmaXggb2YgdGV4dDEsIHRoZSBwcmVmaXggb2YgdGV4dDIsIHRoZSBzdWZmaXggb2ZcbiAgICogICAgIHRleHQyIGFuZCB0aGUgY29tbW9uIG1pZGRsZS4gIE9yIG51bGwgaWYgdGhlcmUgd2FzIG5vIG1hdGNoLlxuXG4gICAqL1xuICAgIGRpZmZfaGFsZk1hdGNoXyAodGV4dDE6IHN0cmluZywgdGV4dDI6IHN0cmluZykge1xuICAgIGlmICh0aGlzLkRpZmZfVGltZW91dCA8PSAwKSB7XG4gICAgICAvLyBEb24ndCByaXNrIHJldHVybmluZyBhIG5vbi1vcHRpbWFsIGRpZmYgaWYgd2UgaGF2ZSB1bmxpbWl0ZWQgdGltZS5cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBsb25ndGV4dCA9IHRleHQxLmxlbmd0aCA+IHRleHQyLmxlbmd0aCA/IHRleHQxIDogdGV4dDI7XG4gICAgY29uc3Qgc2hvcnR0ZXh0ID0gdGV4dDEubGVuZ3RoID4gdGV4dDIubGVuZ3RoID8gdGV4dDIgOiB0ZXh0MTtcbiAgICBpZiAobG9uZ3RleHQubGVuZ3RoIDwgNCB8fCBzaG9ydHRleHQubGVuZ3RoICogMiA8IGxvbmd0ZXh0Lmxlbmd0aCkge1xuICAgICAgcmV0dXJuIG51bGw7ICAvLyBQb2ludGxlc3MuXG4gICAgfVxuICAgIGNvbnN0IGRtcCA9IHRoaXM7ICAvLyAndGhpcycgYmVjb21lcyAnd2luZG93JyBpbiBhIGNsb3N1cmUuXG5cblxuICAgIC8vIEZpcnN0IGNoZWNrIGlmIHRoZSBzZWNvbmQgcXVhcnRlciBpcyB0aGUgc2VlZCBmb3IgYSBoYWxmLW1hdGNoLlxuICAgIGNvbnN0IGhtMSA9IHRoaXMuZGlmZl9oYWxmTWF0Y2hJXyhsb25ndGV4dCwgc2hvcnR0ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5jZWlsKGxvbmd0ZXh0Lmxlbmd0aCAvIDQpLCBkbXApO1xuICAgIC8vIENoZWNrIGFnYWluIGJhc2VkIG9uIHRoZSB0aGlyZCBxdWFydGVyLlxuICAgIGNvbnN0IGhtMiA9IHRoaXMuZGlmZl9oYWxmTWF0Y2hJXyhsb25ndGV4dCwgc2hvcnR0ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5jZWlsKGxvbmd0ZXh0Lmxlbmd0aCAvIDIpLCBkbXApO1xuICAgIGxldCBobTtcbiAgICBpZiAoIWhtMSAmJiAhaG0yKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGVsc2UgaWYgKCFobTIpIHtcbiAgICAgIGhtID0gaG0xO1xuICAgIH0gZWxzZSBpZiAoIWhtMSkge1xuICAgICAgaG0gPSBobTI7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEJvdGggbWF0Y2hlZC4gIFNlbGVjdCB0aGUgbG9uZ2VzdC5cbiAgICAgIGhtID0gaG0xWzRdLmxlbmd0aCA+IGhtMls0XS5sZW5ndGggPyBobTEgOiBobTI7XG4gICAgfVxuXG4gICAgLy8gQSBoYWxmLW1hdGNoIHdhcyBmb3VuZCwgc29ydCBvdXQgdGhlIHJldHVybiBkYXRhLlxuICAgIGxldCB0ZXh0MV9hLCB0ZXh0MV9iLCB0ZXh0Ml9hLCB0ZXh0Ml9iO1xuICAgIGlmICh0ZXh0MS5sZW5ndGggPiB0ZXh0Mi5sZW5ndGgpIHtcbiAgICAgIHRleHQxX2EgPSBobVswXTtcbiAgICAgIHRleHQxX2IgPSBobVsxXTtcbiAgICAgIHRleHQyX2EgPSBobVsyXTtcbiAgICAgIHRleHQyX2IgPSBobVszXTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGV4dDJfYSA9IGhtWzBdO1xuICAgICAgdGV4dDJfYiA9IGhtWzFdO1xuICAgICAgdGV4dDFfYSA9IGhtWzJdO1xuICAgICAgdGV4dDFfYiA9IGhtWzNdO1xuICAgIH1cbiAgICBjb25zdCBtaWRfY29tbW9uID0gaG1bNF07XG4gICAgcmV0dXJuIFt0ZXh0MV9hLCB0ZXh0MV9iLCB0ZXh0Ml9hLCB0ZXh0Ml9iLCBtaWRfY29tbW9uXTtcbiAgfTtcblxuICAvKipcbiAgICogRG9lcyBhIHN1YnN0cmluZyBvZiBzaG9ydHRleHQgZXhpc3Qgd2l0aGluIGxvbmd0ZXh0IHN1Y2ggdGhhdCB0aGUgc3Vic3RyaW5nXG4gICAqIGlzIGF0IGxlYXN0IGhhbGYgdGhlIGxlbmd0aCBvZiBsb25ndGV4dD9cbiAgICogQ2xvc3VyZSwgYnV0IGRvZXMgbm90IHJlZmVyZW5jZSBhbnkgZXh0ZXJuYWwgY29uc3RpYWJsZXMuXG4gICAqIEBwYXJhbSAgbG9uZ3RleHQgTG9uZ2VyIHN0cmluZy5cbiAgICogQHBhcmFtICBzaG9ydHRleHQgU2hvcnRlciBzdHJpbmcuXG4gICAqIEBwYXJhbSAgaSBTdGFydCBpbmRleCBvZiBxdWFydGVyIGxlbmd0aCBzdWJzdHJpbmcgd2l0aGluIGxvbmd0ZXh0LlxuICAgKiBAcmV0dXJuICBGaXZlIGVsZW1lbnQgQXJyYXksIGNvbnRhaW5pbmcgdGhlIHByZWZpeCBvZlxuICAgKiAgICAgbG9uZ3RleHQsIHRoZSBzdWZmaXggb2YgbG9uZ3RleHQsIHRoZSBwcmVmaXggb2Ygc2hvcnR0ZXh0LCB0aGUgc3VmZml4XG4gICAqICAgICBvZiBzaG9ydHRleHQgYW5kIHRoZSBjb21tb24gbWlkZGxlLiAgT3IgbnVsbCBpZiB0aGVyZSB3YXMgbm8gbWF0Y2guXG5cbiAgICovXG4gIGRpZmZfaGFsZk1hdGNoSV8obG9uZ3RleHQ6IHN0cmluZywgc2hvcnR0ZXh0OiBzdHJpbmcsIGk6IG51bWJlciwgZG1wOiBEaWZmTWF0Y2hQYXRjaCk6IEFycmF5PHN0cmluZz4ge1xuICAgIC8vIFN0YXJ0IHdpdGggYSAxLzQgbGVuZ3RoIHN1YnN0cmluZyBhdCBwb3NpdGlvbiBpIGFzIGEgc2VlZC5cbiAgICBjb25zdCBzZWVkID0gbG9uZ3RleHQuc3Vic3RyaW5nKGksIGkgKyBNYXRoLmZsb29yKGxvbmd0ZXh0Lmxlbmd0aCAvIDQpKTtcbiAgICBsZXQgaiA9IC0xO1xuICAgIGxldCBiZXN0X2NvbW1vbiA9ICcnO1xuICAgIGxldCBiZXN0X2xvbmd0ZXh0X2EsIGJlc3RfbG9uZ3RleHRfYiwgYmVzdF9zaG9ydHRleHRfYSwgYmVzdF9zaG9ydHRleHRfYjtcbiAgICB3aGlsZSAoKGogPSBzaG9ydHRleHQuaW5kZXhPZihzZWVkLCBqICsgMSkpICE9IC0xKSB7XG4gICAgICBjb25zdCBwcmVmaXhMZW5ndGggPSBkbXAuZGlmZl9jb21tb25QcmVmaXgobG9uZ3RleHQuc3Vic3RyaW5nKGkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3J0dGV4dC5zdWJzdHJpbmcoaikpO1xuICAgICAgY29uc3Qgc3VmZml4TGVuZ3RoID0gZG1wLmRpZmZfY29tbW9uU3VmZml4KGxvbmd0ZXh0LnN1YnN0cmluZygwLCBpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG9ydHRleHQuc3Vic3RyaW5nKDAsIGopKTtcbiAgICAgIGlmIChiZXN0X2NvbW1vbi5sZW5ndGggPCBzdWZmaXhMZW5ndGggKyBwcmVmaXhMZW5ndGgpIHtcbiAgICAgICAgYmVzdF9jb21tb24gPSBzaG9ydHRleHQuc3Vic3RyaW5nKGogLSBzdWZmaXhMZW5ndGgsIGopICtcbiAgICAgICAgICAgIHNob3J0dGV4dC5zdWJzdHJpbmcoaiwgaiArIHByZWZpeExlbmd0aCk7XG4gICAgICAgIGJlc3RfbG9uZ3RleHRfYSA9IGxvbmd0ZXh0LnN1YnN0cmluZygwLCBpIC0gc3VmZml4TGVuZ3RoKTtcbiAgICAgICAgYmVzdF9sb25ndGV4dF9iID0gbG9uZ3RleHQuc3Vic3RyaW5nKGkgKyBwcmVmaXhMZW5ndGgpO1xuICAgICAgICBiZXN0X3Nob3J0dGV4dF9hID0gc2hvcnR0ZXh0LnN1YnN0cmluZygwLCBqIC0gc3VmZml4TGVuZ3RoKTtcbiAgICAgICAgYmVzdF9zaG9ydHRleHRfYiA9IHNob3J0dGV4dC5zdWJzdHJpbmcoaiArIHByZWZpeExlbmd0aCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChiZXN0X2NvbW1vbi5sZW5ndGggKiAyID49IGxvbmd0ZXh0Lmxlbmd0aCkge1xuICAgICAgcmV0dXJuIFtiZXN0X2xvbmd0ZXh0X2EsIGJlc3RfbG9uZ3RleHRfYixcbiAgICAgICAgICAgICAgYmVzdF9zaG9ydHRleHRfYSwgYmVzdF9zaG9ydHRleHRfYiwgYmVzdF9jb21tb25dO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVkdWNlIHRoZSBudW1iZXIgb2YgZWRpdHMgYnkgZWxpbWluYXRpbmcgc2VtYW50aWNhbGx5IHRyaXZpYWwgZXF1YWxpdGllcy5cbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cbiAgICovXG4gICAgZGlmZl9jbGVhbnVwU2VtYW50aWMgKGRpZmZzOiBBcnJheTxEaWZmPikge1xuICAgIGxldCBjaGFuZ2VzID0gZmFsc2U7XG4gICAgY29uc3QgZXF1YWxpdGllcyA9IFtdOyAgLy8gU3RhY2sgb2YgaW5kaWNlcyB3aGVyZSBlcXVhbGl0aWVzIGFyZSBmb3VuZC5cbiAgICBsZXQgZXF1YWxpdGllc0xlbmd0aCA9IDA7ICAvLyBLZWVwaW5nIG91ciBvd24gbGVuZ3RoIGNvbnN0IGlzIGZhc3RlciBpbiBKUy5cblxuICAgIGxldCBsYXN0ZXF1YWxpdHkgPSBudWxsO1xuICAgIC8vIEFsd2F5cyBlcXVhbCB0byBkaWZmc1tlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGggLSAxXV1bMV1cbiAgICBsZXQgcG9pbnRlciA9IDA7ICAvLyBJbmRleCBvZiBjdXJyZW50IHBvc2l0aW9uLlxuICAgIC8vIE51bWJlciBvZiBjaGFyYWN0ZXJzIHRoYXQgY2hhbmdlZCBwcmlvciB0byB0aGUgZXF1YWxpdHkuXG4gICAgbGV0IGxlbmd0aF9pbnNlcnRpb25zMSA9IDA7XG4gICAgbGV0IGxlbmd0aF9kZWxldGlvbnMxID0gMDtcbiAgICAvLyBOdW1iZXIgb2YgY2hhcmFjdGVycyB0aGF0IGNoYW5nZWQgYWZ0ZXIgdGhlIGVxdWFsaXR5LlxuICAgIGxldCBsZW5ndGhfaW5zZXJ0aW9uczIgPSAwO1xuICAgIGxldCBsZW5ndGhfZGVsZXRpb25zMiA9IDA7XG4gICAgd2hpbGUgKHBvaW50ZXIgPCBkaWZmcy5sZW5ndGgpIHtcbiAgICAgIGlmIChkaWZmc1twb2ludGVyXVswXSA9PSBEaWZmT3AuRXF1YWwpIHsgIC8vIEVxdWFsaXR5IGZvdW5kLlxuICAgICAgICBlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGgrK10gPSBwb2ludGVyO1xuICAgICAgICBsZW5ndGhfaW5zZXJ0aW9uczEgPSBsZW5ndGhfaW5zZXJ0aW9uczI7XG4gICAgICAgIGxlbmd0aF9kZWxldGlvbnMxID0gbGVuZ3RoX2RlbGV0aW9uczI7XG4gICAgICAgIGxlbmd0aF9pbnNlcnRpb25zMiA9IDA7XG4gICAgICAgIGxlbmd0aF9kZWxldGlvbnMyID0gMDtcbiAgICAgICAgbGFzdGVxdWFsaXR5ID0gZGlmZnNbcG9pbnRlcl1bMV07XG4gICAgICB9IGVsc2UgeyAgLy8gQW4gaW5zZXJ0aW9uIG9yIGRlbGV0aW9uLlxuICAgICAgICBpZiAoZGlmZnNbcG9pbnRlcl1bMF0gPT0gRGlmZk9wLkluc2VydCkge1xuICAgICAgICAgIGxlbmd0aF9pbnNlcnRpb25zMiArPSBkaWZmc1twb2ludGVyXVsxXS5sZW5ndGg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGVuZ3RoX2RlbGV0aW9uczIgKz0gZGlmZnNbcG9pbnRlcl1bMV0ubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIC8vIEVsaW1pbmF0ZSBhbiBlcXVhbGl0eSB0aGF0IGlzIHNtYWxsZXIgb3IgZXF1YWwgdG8gdGhlIGVkaXRzIG9uIGJvdGhcbiAgICAgICAgLy8gc2lkZXMgb2YgaXQuXG4gICAgICAgIGlmIChsYXN0ZXF1YWxpdHkgJiYgKGxhc3RlcXVhbGl0eS5sZW5ndGggPD1cbiAgICAgICAgICAgIE1hdGgubWF4KGxlbmd0aF9pbnNlcnRpb25zMSwgbGVuZ3RoX2RlbGV0aW9uczEpKSAmJlxuICAgICAgICAgICAgKGxhc3RlcXVhbGl0eS5sZW5ndGggPD0gTWF0aC5tYXgobGVuZ3RoX2luc2VydGlvbnMyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZW5ndGhfZGVsZXRpb25zMikpKSB7XG4gICAgICAgICAgLy8gRHVwbGljYXRlIHJlY29yZC5cbiAgICAgICAgICBkaWZmcy5zcGxpY2UoZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoIC0gMV0sIDAsXG4gICAgICAgICAgICAgICAgICAgICAgW0RpZmZPcC5EZWxldGUsIGxhc3RlcXVhbGl0eV0pO1xuICAgICAgICAgIC8vIENoYW5nZSBzZWNvbmQgY29weSB0byBpbnNlcnQuXG4gICAgICAgICAgZGlmZnNbZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoIC0gMV0gKyAxXVswXSA9IERpZmZPcC5JbnNlcnQ7XG4gICAgICAgICAgLy8gVGhyb3cgYXdheSB0aGUgZXF1YWxpdHkgd2UganVzdCBkZWxldGVkLlxuICAgICAgICAgIGVxdWFsaXRpZXNMZW5ndGgtLTtcbiAgICAgICAgICAvLyBUaHJvdyBhd2F5IHRoZSBwcmV2aW91cyBlcXVhbGl0eSAoaXQgbmVlZHMgdG8gYmUgcmVldmFsdWF0ZWQpLlxuICAgICAgICAgIGVxdWFsaXRpZXNMZW5ndGgtLTtcbiAgICAgICAgICBwb2ludGVyID0gZXF1YWxpdGllc0xlbmd0aCA+IDAgPyBlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGggLSAxXSA6IC0xO1xuICAgICAgICAgIGxlbmd0aF9pbnNlcnRpb25zMSA9IDA7ICAvLyBSZXNldCB0aGUgY291bnRlcnMuXG4gICAgICAgICAgbGVuZ3RoX2RlbGV0aW9uczEgPSAwO1xuICAgICAgICAgIGxlbmd0aF9pbnNlcnRpb25zMiA9IDA7XG4gICAgICAgICAgbGVuZ3RoX2RlbGV0aW9uczIgPSAwO1xuICAgICAgICAgIGxhc3RlcXVhbGl0eSA9IG51bGw7XG4gICAgICAgICAgY2hhbmdlcyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHBvaW50ZXIrKztcbiAgICB9XG5cbiAgICAvLyBOb3JtYWxpemUgdGhlIGRpZmYuXG4gICAgaWYgKGNoYW5nZXMpIHtcbiAgICAgIHRoaXMuZGlmZl9jbGVhbnVwTWVyZ2UoZGlmZnMpO1xuICAgIH1cbiAgICB0aGlzLmRpZmZfY2xlYW51cFNlbWFudGljTG9zc2xlc3MoZGlmZnMpO1xuXG4gICAgLy8gRmluZCBhbnkgb3ZlcmxhcHMgYmV0d2VlbiBkZWxldGlvbnMgYW5kIGluc2VydGlvbnMuXG4gICAgLy8gZS5nOiA8ZGVsPmFiY3h4eDwvZGVsPjxpbnM+eHh4ZGVmPC9pbnM+XG4gICAgLy8gICAtPiA8ZGVsPmFiYzwvZGVsPnh4eDxpbnM+ZGVmPC9pbnM+XG4gICAgLy8gZS5nOiA8ZGVsPnh4eGFiYzwvZGVsPjxpbnM+ZGVmeHh4PC9pbnM+XG4gICAgLy8gICAtPiA8aW5zPmRlZjwvaW5zPnh4eDxkZWw+YWJjPC9kZWw+XG4gICAgLy8gT25seSBleHRyYWN0IGFuIG92ZXJsYXAgaWYgaXQgaXMgYXMgYmlnIGFzIHRoZSBlZGl0IGFoZWFkIG9yIGJlaGluZCBpdC5cbiAgICBwb2ludGVyID0gMTtcbiAgICB3aGlsZSAocG9pbnRlciA8IGRpZmZzLmxlbmd0aCkge1xuICAgICAgaWYgKGRpZmZzW3BvaW50ZXIgLSAxXVswXSA9PSBEaWZmT3AuRGVsZXRlICYmXG4gICAgICAgICAgZGlmZnNbcG9pbnRlcl1bMF0gPT0gRGlmZk9wLkluc2VydCkge1xuICAgICAgICBjb25zdCBkZWxldGlvbiA9IGRpZmZzW3BvaW50ZXIgLSAxXVsxXTtcbiAgICAgICAgY29uc3QgaW5zZXJ0aW9uID0gZGlmZnNbcG9pbnRlcl1bMV07XG4gICAgICAgIGNvbnN0IG92ZXJsYXBfbGVuZ3RoMSA9IHRoaXMuZGlmZl9jb21tb25PdmVybGFwXyhkZWxldGlvbiwgaW5zZXJ0aW9uKTtcbiAgICAgICAgY29uc3Qgb3ZlcmxhcF9sZW5ndGgyID0gdGhpcy5kaWZmX2NvbW1vbk92ZXJsYXBfKGluc2VydGlvbiwgZGVsZXRpb24pO1xuICAgICAgICBpZiAob3ZlcmxhcF9sZW5ndGgxID49IG92ZXJsYXBfbGVuZ3RoMikge1xuICAgICAgICAgIGlmIChvdmVybGFwX2xlbmd0aDEgPj0gZGVsZXRpb24ubGVuZ3RoIC8gMiB8fFxuICAgICAgICAgICAgICBvdmVybGFwX2xlbmd0aDEgPj0gaW5zZXJ0aW9uLmxlbmd0aCAvIDIpIHtcbiAgICAgICAgICAgIC8vIE92ZXJsYXAgZm91bmQuICBJbnNlcnQgYW4gZXF1YWxpdHkgYW5kIHRyaW0gdGhlIHN1cnJvdW5kaW5nIGVkaXRzLlxuICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIsIDAsXG4gICAgICAgICAgICAgICAgW0RpZmZPcC5FcXVhbCwgaW5zZXJ0aW9uLnN1YnN0cmluZygwLCBvdmVybGFwX2xlbmd0aDEpXSk7XG4gICAgICAgICAgICBkaWZmc1twb2ludGVyIC0gMV1bMV0gPVxuICAgICAgICAgICAgICAgIGRlbGV0aW9uLnN1YnN0cmluZygwLCBkZWxldGlvbi5sZW5ndGggLSBvdmVybGFwX2xlbmd0aDEpO1xuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciArIDFdWzFdID0gaW5zZXJ0aW9uLnN1YnN0cmluZyhvdmVybGFwX2xlbmd0aDEpO1xuICAgICAgICAgICAgcG9pbnRlcisrO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAob3ZlcmxhcF9sZW5ndGgyID49IGRlbGV0aW9uLmxlbmd0aCAvIDIgfHxcbiAgICAgICAgICAgICAgb3ZlcmxhcF9sZW5ndGgyID49IGluc2VydGlvbi5sZW5ndGggLyAyKSB7XG4gICAgICAgICAgICAvLyBSZXZlcnNlIG92ZXJsYXAgZm91bmQuXG4gICAgICAgICAgICAvLyBJbnNlcnQgYW4gZXF1YWxpdHkgYW5kIHN3YXAgYW5kIHRyaW0gdGhlIHN1cnJvdW5kaW5nIGVkaXRzLlxuICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIsIDAsXG4gICAgICAgICAgICAgICAgW0RpZmZPcC5FcXVhbCwgZGVsZXRpb24uc3Vic3RyaW5nKDAsIG92ZXJsYXBfbGVuZ3RoMildKTtcbiAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgLSAxXVswXSA9IERpZmZPcC5JbnNlcnQ7XG4gICAgICAgICAgICBkaWZmc1twb2ludGVyIC0gMV1bMV0gPVxuICAgICAgICAgICAgICAgIGluc2VydGlvbi5zdWJzdHJpbmcoMCwgaW5zZXJ0aW9uLmxlbmd0aCAtIG92ZXJsYXBfbGVuZ3RoMik7XG4gICAgICAgICAgICBkaWZmc1twb2ludGVyICsgMV1bMF0gPSBEaWZmT3AuRGVsZXRlO1xuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciArIDFdWzFdID1cbiAgICAgICAgICAgICAgICBkZWxldGlvbi5zdWJzdHJpbmcob3ZlcmxhcF9sZW5ndGgyKTtcbiAgICAgICAgICAgIHBvaW50ZXIrKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcG9pbnRlcisrO1xuICAgICAgfVxuICAgICAgcG9pbnRlcisrO1xuICAgIH1cbiAgfTtcblxuXG4gIC8qKlxuICAgKiBMb29rIGZvciBzaW5nbGUgZWRpdHMgc3Vycm91bmRlZCBvbiBib3RoIHNpZGVzIGJ5IGVxdWFsaXRpZXNcbiAgICogd2hpY2ggY2FuIGJlIHNoaWZ0ZWQgc2lkZXdheXMgdG8gYWxpZ24gdGhlIGVkaXQgdG8gYSB3b3JkIGJvdW5kYXJ5LlxuICAgKiBlLmc6IFRoZSBjPGlucz5hdCBjPC9pbnM+YW1lLiAtPiBUaGUgPGlucz5jYXQgPC9pbnM+Y2FtZS5cbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cbiAgICovXG4gICAgZGlmZl9jbGVhbnVwU2VtYW50aWNMb3NzbGVzcyAoZGlmZnM6IEFycmF5PERpZmY+KSB7XG4gICAgLyoqXG4gICAgICogR2l2ZW4gdHdvIHN0cmluZ3MsIGNvbXB1dGUgYSBzY29yZSByZXByZXNlbnRpbmcgd2hldGhlciB0aGUgaW50ZXJuYWxcbiAgICAgKiBib3VuZGFyeSBmYWxscyBvbiBsb2dpY2FsIGJvdW5kYXJpZXMuXG4gICAgICogU2NvcmVzIHJhbmdlIGZyb20gNiAoYmVzdCkgdG8gMCAod29yc3QpLlxuICAgICAqIENsb3N1cmUsIGJ1dCBkb2VzIG5vdCByZWZlcmVuY2UgYW55IGV4dGVybmFsIGNvbnN0aWFibGVzLlxuICAgICAqIEBwYXJhbSAgb25lIEZpcnN0IHN0cmluZy5cbiAgICAgKiBAcGFyYW0gIHR3byBTZWNvbmQgc3RyaW5nLlxuICAgICAqIEByZXR1cm4gIFRoZSBzY29yZS5cblxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGRpZmZfY2xlYW51cFNlbWFudGljU2NvcmVfKG9uZTogc3RyaW5nLCB0d286IHN0cmluZyk6IG51bWJlciB7XG4gICAgICBpZiAoIW9uZSB8fCAhdHdvKSB7XG4gICAgICAgIC8vIEVkZ2VzIGFyZSB0aGUgYmVzdC5cbiAgICAgICAgcmV0dXJuIDY7XG4gICAgICB9XG5cblxuICAgICAgY29uc3Qgbm9uQWxwaGFOdW1lcmljUmVnZXhfID0gbmV3IFJlZ0V4cCgnL1teYS16QS1aMC05XS8nKTtcblxuICAgICAgLy8gRWFjaCBwb3J0IG9mIHRoaXMgZnVuY3Rpb24gYmVoYXZlcyBzbGlnaHRseSBkaWZmZXJlbnRseSBkdWUgdG9cbiAgICAgIC8vIHN1YnRsZSBkaWZmZXJlbmNlcyBpbiBlYWNoIGxhbmd1YWdlJ3MgZGVmaW5pdGlvbiBvZiB0aGluZ3MgbGlrZVxuICAgICAgLy8gJ3doaXRlc3BhY2UnLiAgU2luY2UgdGhpcyBmdW5jdGlvbidzIHB1cnBvc2UgaXMgbGFyZ2VseSBjb3NtZXRpYyxcbiAgICAgIC8vIHRoZSBjaG9pY2UgaGFzIGJlZW4gbWFkZSB0byB1c2UgZWFjaCBsYW5ndWFnZSdzIG5hdGl2ZSBmZWF0dXJlc1xuICAgICAgLy8gcmF0aGVyIHRoYW4gZm9yY2UgdG90YWwgY29uZm9ybWl0eS5cbiAgICAgIGNvbnN0IGNoYXIxID0gb25lLmNoYXJBdChvbmUubGVuZ3RoIC0gMSk7XG4gICAgICBjb25zdCBjaGFyMiA9IHR3by5jaGFyQXQoMCk7XG4gICAgICBjb25zdCBub25BbHBoYU51bWVyaWMxID0gY2hhcjEubWF0Y2gobm9uQWxwaGFOdW1lcmljUmVnZXhfKTtcbiAgICAgIGNvbnN0IG5vbkFscGhhTnVtZXJpYzIgPSBjaGFyMi5tYXRjaChub25BbHBoYU51bWVyaWNSZWdleF8pO1xuICAgICAgY29uc3Qgd2hpdGVzcGFjZTEgPSBub25BbHBoYU51bWVyaWMxICYmXG4gICAgICAgICAgY2hhcjEubWF0Y2godGhpcy53aGl0ZXNwYWNlUmVnZXhfKTtcbiAgICAgIGNvbnN0IHdoaXRlc3BhY2UyID0gbm9uQWxwaGFOdW1lcmljMiAmJlxuICAgICAgICAgIGNoYXIyLm1hdGNoKHRoaXMud2hpdGVzcGFjZVJlZ2V4Xyk7XG4gICAgICBjb25zdCBsaW5lQnJlYWsxID0gd2hpdGVzcGFjZTEgJiZcbiAgICAgICAgICBjaGFyMS5tYXRjaCh0aGlzLmxpbmVicmVha1JlZ2V4Xyk7XG4gICAgICBjb25zdCBsaW5lQnJlYWsyID0gd2hpdGVzcGFjZTIgJiZcbiAgICAgICAgICBjaGFyMi5tYXRjaCh0aGlzLmxpbmVicmVha1JlZ2V4Xyk7XG4gICAgICBjb25zdCBibGFua0xpbmUxID0gbGluZUJyZWFrMSAmJlxuICAgICAgICAgIG9uZS5tYXRjaCh0aGlzLmJsYW5rbGluZUVuZFJlZ2V4Xyk7XG4gICAgICBjb25zdCBibGFua0xpbmUyID0gbGluZUJyZWFrMiAmJlxuICAgICAgICAgIHR3by5tYXRjaCh0aGlzLmJsYW5rbGluZVN0YXJ0UmVnZXhfKTtcblxuICAgICAgaWYgKGJsYW5rTGluZTEgfHwgYmxhbmtMaW5lMikge1xuICAgICAgICAvLyBGaXZlIHBvaW50cyBmb3IgYmxhbmsgbGluZXMuXG4gICAgICAgIHJldHVybiA1O1xuICAgICAgfSBlbHNlIGlmIChsaW5lQnJlYWsxIHx8IGxpbmVCcmVhazIpIHtcbiAgICAgICAgLy8gRm91ciBwb2ludHMgZm9yIGxpbmUgYnJlYWtzLlxuICAgICAgICByZXR1cm4gNDtcbiAgICAgIH0gZWxzZSBpZiAobm9uQWxwaGFOdW1lcmljMSAmJiAhd2hpdGVzcGFjZTEgJiYgd2hpdGVzcGFjZTIpIHtcbiAgICAgICAgLy8gVGhyZWUgcG9pbnRzIGZvciBlbmQgb2Ygc2VudGVuY2VzLlxuICAgICAgICByZXR1cm4gMztcbiAgICAgIH0gZWxzZSBpZiAod2hpdGVzcGFjZTEgfHwgd2hpdGVzcGFjZTIpIHtcbiAgICAgICAgLy8gVHdvIHBvaW50cyBmb3Igd2hpdGVzcGFjZS5cbiAgICAgICAgcmV0dXJuIDI7XG4gICAgICB9IGVsc2UgaWYgKG5vbkFscGhhTnVtZXJpYzEgfHwgbm9uQWxwaGFOdW1lcmljMikge1xuICAgICAgICAvLyBPbmUgcG9pbnQgZm9yIG5vbi1hbHBoYW51bWVyaWMuXG4gICAgICAgIHJldHVybiAxO1xuICAgICAgfVxuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgbGV0IHBvaW50ZXIgPSAxO1xuICAgIC8vIEludGVudGlvbmFsbHkgaWdub3JlIHRoZSBmaXJzdCBhbmQgbGFzdCBlbGVtZW50IChkb24ndCBuZWVkIGNoZWNraW5nKS5cbiAgICB3aGlsZSAocG9pbnRlciA8IGRpZmZzLmxlbmd0aCAtIDEpIHtcbiAgICAgIGlmIChkaWZmc1twb2ludGVyIC0gMV1bMF0gPT0gRGlmZk9wLkVxdWFsICYmXG4gICAgICAgICAgZGlmZnNbcG9pbnRlciArIDFdWzBdID09IERpZmZPcC5FcXVhbCkge1xuICAgICAgICAvLyBUaGlzIGlzIGEgc2luZ2xlIGVkaXQgc3Vycm91bmRlZCBieSBlcXVhbGl0aWVzLlxuICAgICAgICBsZXQgZXF1YWxpdHkxID0gZGlmZnNbcG9pbnRlciAtIDFdWzFdO1xuICAgICAgICBsZXQgZWRpdCA9IGRpZmZzW3BvaW50ZXJdWzFdO1xuICAgICAgICBsZXQgZXF1YWxpdHkyID0gZGlmZnNbcG9pbnRlciArIDFdWzFdO1xuXG4gICAgICAgIC8vIEZpcnN0LCBzaGlmdCB0aGUgZWRpdCBhcyBmYXIgbGVmdCBhcyBwb3NzaWJsZS5cbiAgICAgICAgY29uc3QgY29tbW9uT2Zmc2V0ID0gdGhpcy5kaWZmX2NvbW1vblN1ZmZpeChlcXVhbGl0eTEsIGVkaXQpO1xuICAgICAgICBpZiAoY29tbW9uT2Zmc2V0KSB7XG4gICAgICAgICAgY29uc3QgY29tbW9uU3RyaW5nID0gZWRpdC5zdWJzdHJpbmcoZWRpdC5sZW5ndGggLSBjb21tb25PZmZzZXQpO1xuICAgICAgICAgIGVxdWFsaXR5MSA9IGVxdWFsaXR5MS5zdWJzdHJpbmcoMCwgZXF1YWxpdHkxLmxlbmd0aCAtIGNvbW1vbk9mZnNldCk7XG4gICAgICAgICAgZWRpdCA9IGNvbW1vblN0cmluZyArIGVkaXQuc3Vic3RyaW5nKDAsIGVkaXQubGVuZ3RoIC0gY29tbW9uT2Zmc2V0KTtcbiAgICAgICAgICBlcXVhbGl0eTIgPSBjb21tb25TdHJpbmcgKyBlcXVhbGl0eTI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZWNvbmQsIHN0ZXAgY2hhcmFjdGVyIGJ5IGNoYXJhY3RlciByaWdodCwgbG9va2luZyBmb3IgdGhlIGJlc3QgZml0LlxuICAgICAgICBsZXQgYmVzdEVxdWFsaXR5MSA9IGVxdWFsaXR5MTtcbiAgICAgICAgbGV0IGJlc3RFZGl0ID0gZWRpdDtcbiAgICAgICAgbGV0IGJlc3RFcXVhbGl0eTIgPSBlcXVhbGl0eTI7XG4gICAgICAgIGxldCBiZXN0U2NvcmUgPSBkaWZmX2NsZWFudXBTZW1hbnRpY1Njb3JlXyhlcXVhbGl0eTEsIGVkaXQpICtcbiAgICAgICAgICAgIGRpZmZfY2xlYW51cFNlbWFudGljU2NvcmVfKGVkaXQsIGVxdWFsaXR5Mik7XG4gICAgICAgIHdoaWxlIChlZGl0LmNoYXJBdCgwKSA9PT0gZXF1YWxpdHkyLmNoYXJBdCgwKSkge1xuICAgICAgICAgIGVxdWFsaXR5MSArPSBlZGl0LmNoYXJBdCgwKTtcbiAgICAgICAgICBlZGl0ID0gZWRpdC5zdWJzdHJpbmcoMSkgKyBlcXVhbGl0eTIuY2hhckF0KDApO1xuICAgICAgICAgIGVxdWFsaXR5MiA9IGVxdWFsaXR5Mi5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgY29uc3Qgc2NvcmUgPSBkaWZmX2NsZWFudXBTZW1hbnRpY1Njb3JlXyhlcXVhbGl0eTEsIGVkaXQpICtcbiAgICAgICAgICAgICAgZGlmZl9jbGVhbnVwU2VtYW50aWNTY29yZV8oZWRpdCwgZXF1YWxpdHkyKTtcbiAgICAgICAgICAvLyBUaGUgPj0gZW5jb3VyYWdlcyB0cmFpbGluZyByYXRoZXIgdGhhbiBsZWFkaW5nIHdoaXRlc3BhY2Ugb24gZWRpdHMuXG4gICAgICAgICAgaWYgKHNjb3JlID49IGJlc3RTY29yZSkge1xuICAgICAgICAgICAgYmVzdFNjb3JlID0gc2NvcmU7XG4gICAgICAgICAgICBiZXN0RXF1YWxpdHkxID0gZXF1YWxpdHkxO1xuICAgICAgICAgICAgYmVzdEVkaXQgPSBlZGl0O1xuICAgICAgICAgICAgYmVzdEVxdWFsaXR5MiA9IGVxdWFsaXR5MjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGlmZnNbcG9pbnRlciAtIDFdWzFdICE9IGJlc3RFcXVhbGl0eTEpIHtcbiAgICAgICAgICAvLyBXZSBoYXZlIGFuIGltcHJvdmVtZW50LCBzYXZlIGl0IGJhY2sgdG8gdGhlIGRpZmYuXG4gICAgICAgICAgaWYgKGJlc3RFcXVhbGl0eTEpIHtcbiAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgLSAxXVsxXSA9IGJlc3RFcXVhbGl0eTE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRpZmZzLnNwbGljZShwb2ludGVyIC0gMSwgMSk7XG4gICAgICAgICAgICBwb2ludGVyLS07XG4gICAgICAgICAgfVxuICAgICAgICAgIGRpZmZzW3BvaW50ZXJdWzFdID0gYmVzdEVkaXQ7XG4gICAgICAgICAgaWYgKGJlc3RFcXVhbGl0eTIpIHtcbiAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgKyAxXVsxXSA9IGJlc3RFcXVhbGl0eTI7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRpZmZzLnNwbGljZShwb2ludGVyICsgMSwgMSk7XG4gICAgICAgICAgICBwb2ludGVyLS07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwb2ludGVyKys7XG4gICAgfVxuICB9O1xuXG5cbiAgLyoqXG4gICAqIFJlZHVjZSB0aGUgbnVtYmVyIG9mIGVkaXRzIGJ5IGVsaW1pbmF0aW5nIG9wZXJhdGlvbmFsbHkgdHJpdmlhbCBlcXVhbGl0aWVzLlxuICAgKiBAcGFyYW0gIGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuICAgKi9cbiAgICBkaWZmX2NsZWFudXBFZmZpY2llbmN5IChkaWZmczogQXJyYXk8RGlmZj4pIHtcbiAgICBsZXQgY2hhbmdlcyA9IGZhbHNlO1xuICAgIGNvbnN0IGVxdWFsaXRpZXMgPSBbXTsgIC8vIFN0YWNrIG9mIGluZGljZXMgd2hlcmUgZXF1YWxpdGllcyBhcmUgZm91bmQuXG4gICAgbGV0IGVxdWFsaXRpZXNMZW5ndGggPSAwOyAgLy8gS2VlcGluZyBvdXIgb3duIGxlbmd0aCBjb25zdCBpcyBmYXN0ZXIgaW4gSlMuXG5cbiAgICBsZXQgbGFzdGVxdWFsaXR5ID0gbnVsbDtcbiAgICAvLyBBbHdheXMgZXF1YWwgdG8gZGlmZnNbZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoIC0gMV1dWzFdXG4gICAgbGV0IHBvaW50ZXIgPSAwOyAgLy8gSW5kZXggb2YgY3VycmVudCBwb3NpdGlvbi5cbiAgICAvLyBJcyB0aGVyZSBhbiBpbnNlcnRpb24gb3BlcmF0aW9uIGJlZm9yZSB0aGUgbGFzdCBlcXVhbGl0eS5cbiAgICBsZXQgcHJlX2lucyA9IGZhbHNlO1xuICAgIC8vIElzIHRoZXJlIGEgZGVsZXRpb24gb3BlcmF0aW9uIGJlZm9yZSB0aGUgbGFzdCBlcXVhbGl0eS5cbiAgICBsZXQgcHJlX2RlbCA9IGZhbHNlO1xuICAgIC8vIElzIHRoZXJlIGFuIGluc2VydGlvbiBvcGVyYXRpb24gYWZ0ZXIgdGhlIGxhc3QgZXF1YWxpdHkuXG4gICAgbGV0IHBvc3RfaW5zID0gZmFsc2U7XG4gICAgLy8gSXMgdGhlcmUgYSBkZWxldGlvbiBvcGVyYXRpb24gYWZ0ZXIgdGhlIGxhc3QgZXF1YWxpdHkuXG4gICAgbGV0IHBvc3RfZGVsID0gZmFsc2U7XG4gICAgd2hpbGUgKHBvaW50ZXIgPCBkaWZmcy5sZW5ndGgpIHtcbiAgICAgIGlmIChkaWZmc1twb2ludGVyXVswXSA9PSBEaWZmT3AuRXF1YWwpIHsgIC8vIEVxdWFsaXR5IGZvdW5kLlxuICAgICAgICBpZiAoZGlmZnNbcG9pbnRlcl1bMV0ubGVuZ3RoIDwgdGhpcy5EaWZmX0VkaXRDb3N0ICYmXG4gICAgICAgICAgICAocG9zdF9pbnMgfHwgcG9zdF9kZWwpKSB7XG4gICAgICAgICAgLy8gQ2FuZGlkYXRlIGZvdW5kLlxuICAgICAgICAgIGVxdWFsaXRpZXNbZXF1YWxpdGllc0xlbmd0aCsrXSA9IHBvaW50ZXI7XG4gICAgICAgICAgcHJlX2lucyA9IHBvc3RfaW5zO1xuICAgICAgICAgIHByZV9kZWwgPSBwb3N0X2RlbDtcbiAgICAgICAgICBsYXN0ZXF1YWxpdHkgPSBkaWZmc1twb2ludGVyXVsxXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBOb3QgYSBjYW5kaWRhdGUsIGFuZCBjYW4gbmV2ZXIgYmVjb21lIG9uZS5cbiAgICAgICAgICBlcXVhbGl0aWVzTGVuZ3RoID0gMDtcbiAgICAgICAgICBsYXN0ZXF1YWxpdHkgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHBvc3RfaW5zID0gcG9zdF9kZWwgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSB7ICAvLyBBbiBpbnNlcnRpb24gb3IgZGVsZXRpb24uXG4gICAgICAgIGlmIChkaWZmc1twb2ludGVyXVswXSA9PSBEaWZmT3AuRGVsZXRlKSB7XG4gICAgICAgICAgcG9zdF9kZWwgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBvc3RfaW5zID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICAvKlxuICAgICAgICAqIEZpdmUgdHlwZXMgdG8gYmUgc3BsaXQ6XG4gICAgICAgICogPGlucz5BPC9pbnM+PGRlbD5CPC9kZWw+WFk8aW5zPkM8L2lucz48ZGVsPkQ8L2RlbD5cbiAgICAgICAgKiA8aW5zPkE8L2lucz5YPGlucz5DPC9pbnM+PGRlbD5EPC9kZWw+XG4gICAgICAgICogPGlucz5BPC9pbnM+PGRlbD5CPC9kZWw+WDxpbnM+QzwvaW5zPlxuICAgICAgICAqIDxpbnM+QTwvZGVsPlg8aW5zPkM8L2lucz48ZGVsPkQ8L2RlbD5cbiAgICAgICAgKiA8aW5zPkE8L2lucz48ZGVsPkI8L2RlbD5YPGRlbD5DPC9kZWw+XG4gICAgICAgICovXG4gICAgICAgIGlmIChsYXN0ZXF1YWxpdHkgJiYgKChwcmVfaW5zICYmIHByZV9kZWwgJiYgcG9zdF9pbnMgJiYgcG9zdF9kZWwpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKChsYXN0ZXF1YWxpdHkubGVuZ3RoIDwgdGhpcy5EaWZmX0VkaXRDb3N0IC8gMikgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKHByZV9pbnM/MTowKSArIChwcmVfZGVsPzE6MCkgKyAocG9zdF9pbnM/MTowKSArIChwb3N0X2RlbD8xOjApID09IDMpKSkpIHtcbiAgICAgICAgICAvLyBEdXBsaWNhdGUgcmVjb3JkLlxuICAgICAgICAgIGRpZmZzLnNwbGljZShlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGggLSAxXSwgMCxcbiAgICAgICAgICAgICAgICAgICAgICBbRGlmZk9wLkRlbGV0ZSwgbGFzdGVxdWFsaXR5XSk7XG4gICAgICAgICAgLy8gQ2hhbmdlIHNlY29uZCBjb3B5IHRvIGluc2VydC5cbiAgICAgICAgICBkaWZmc1tlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGggLSAxXSArIDFdWzBdID0gRGlmZk9wLkluc2VydDtcbiAgICAgICAgICBlcXVhbGl0aWVzTGVuZ3RoLS07ICAvLyBUaHJvdyBhd2F5IHRoZSBlcXVhbGl0eSB3ZSBqdXN0IGRlbGV0ZWQ7XG4gICAgICAgICAgbGFzdGVxdWFsaXR5ID0gbnVsbDtcbiAgICAgICAgICBpZiAocHJlX2lucyAmJiBwcmVfZGVsKSB7XG4gICAgICAgICAgICAvLyBObyBjaGFuZ2VzIG1hZGUgd2hpY2ggY291bGQgYWZmZWN0IHByZXZpb3VzIGVudHJ5LCBrZWVwIGdvaW5nLlxuICAgICAgICAgICAgcG9zdF9pbnMgPSBwb3N0X2RlbCA9IHRydWU7XG4gICAgICAgICAgICBlcXVhbGl0aWVzTGVuZ3RoID0gMDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXF1YWxpdGllc0xlbmd0aC0tOyAgLy8gVGhyb3cgYXdheSB0aGUgcHJldmlvdXMgZXF1YWxpdHkuXG4gICAgICAgICAgICBwb2ludGVyID0gZXF1YWxpdGllc0xlbmd0aCA+IDAgP1xuICAgICAgICAgICAgICAgIGVxdWFsaXRpZXNbZXF1YWxpdGllc0xlbmd0aCAtIDFdIDogLTE7XG4gICAgICAgICAgICBwb3N0X2lucyA9IHBvc3RfZGVsID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNoYW5nZXMgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwb2ludGVyKys7XG4gICAgfVxuXG4gICAgaWYgKGNoYW5nZXMpIHtcbiAgICAgIHRoaXMuZGlmZl9jbGVhbnVwTWVyZ2UoZGlmZnMpO1xuICAgIH1cbiAgfTtcblxuXG4gIC8qKlxuICAgKiBSZW9yZGVyIGFuZCBtZXJnZSBsaWtlIGVkaXQgc2VjdGlvbnMuICBNZXJnZSBlcXVhbGl0aWVzLlxuICAgKiBBbnkgZWRpdCBzZWN0aW9uIGNhbiBtb3ZlIGFzIGxvbmcgYXMgaXQgZG9lc24ndCBjcm9zcyBhbiBlcXVhbGl0eS5cbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cbiAgICovXG4gICAgZGlmZl9jbGVhbnVwTWVyZ2UgKGRpZmZzOiBBcnJheTxEaWZmPikge1xuICAgIGRpZmZzLnB1c2goW0RpZmZPcC5FcXVhbCwgJyddKTsgIC8vIEFkZCBhIGR1bW15IGVudHJ5IGF0IHRoZSBlbmQuXG4gICAgbGV0IHBvaW50ZXIgPSAwO1xuICAgIGxldCBjb3VudF9kZWxldGUgPSAwO1xuICAgIGxldCBjb3VudF9pbnNlcnQgPSAwO1xuICAgIGxldCB0ZXh0X2RlbGV0ZSA9ICcnO1xuICAgIGxldCB0ZXh0X2luc2VydCA9ICcnO1xuICAgIGxldCBjb21tb25sZW5ndGg7XG4gICAgd2hpbGUgKHBvaW50ZXIgPCBkaWZmcy5sZW5ndGgpIHtcbiAgICAgIHN3aXRjaCAoZGlmZnNbcG9pbnRlcl1bMF0pIHtcbiAgICAgICAgY2FzZSBEaWZmT3AuSW5zZXJ0OlxuICAgICAgICAgIGNvdW50X2luc2VydCsrO1xuICAgICAgICAgIHRleHRfaW5zZXJ0ICs9IGRpZmZzW3BvaW50ZXJdWzFdO1xuICAgICAgICAgIHBvaW50ZXIrKztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBEaWZmT3AuRGVsZXRlOlxuICAgICAgICAgIGNvdW50X2RlbGV0ZSsrO1xuICAgICAgICAgIHRleHRfZGVsZXRlICs9IGRpZmZzW3BvaW50ZXJdWzFdO1xuICAgICAgICAgIHBvaW50ZXIrKztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBEaWZmT3AuRXF1YWw6XG4gICAgICAgICAgLy8gVXBvbiByZWFjaGluZyBhbiBlcXVhbGl0eSwgY2hlY2sgZm9yIHByaW9yIHJlZHVuZGFuY2llcy5cbiAgICAgICAgICBpZiAoY291bnRfZGVsZXRlICsgY291bnRfaW5zZXJ0ID4gMSkge1xuICAgICAgICAgICAgaWYgKGNvdW50X2RlbGV0ZSAhPT0gMCAmJiBjb3VudF9pbnNlcnQgIT09IDApIHtcbiAgICAgICAgICAgICAgLy8gRmFjdG9yIG91dCBhbnkgY29tbW9uIHByZWZpeGllcy5cbiAgICAgICAgICAgICAgY29tbW9ubGVuZ3RoID0gdGhpcy5kaWZmX2NvbW1vblByZWZpeCh0ZXh0X2luc2VydCwgdGV4dF9kZWxldGUpO1xuICAgICAgICAgICAgICBpZiAoY29tbW9ubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKChwb2ludGVyIC0gY291bnRfZGVsZXRlIC0gY291bnRfaW5zZXJ0KSA+IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgZGlmZnNbcG9pbnRlciAtIGNvdW50X2RlbGV0ZSAtIGNvdW50X2luc2VydCAtIDFdWzBdID09XG4gICAgICAgICAgICAgICAgICAgIERpZmZPcC5FcXVhbCkge1xuICAgICAgICAgICAgICAgICAgZGlmZnNbcG9pbnRlciAtIGNvdW50X2RlbGV0ZSAtIGNvdW50X2luc2VydCAtIDFdWzFdICs9XG4gICAgICAgICAgICAgICAgICAgICAgdGV4dF9pbnNlcnQuc3Vic3RyaW5nKDAsIGNvbW1vbmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGRpZmZzLnNwbGljZSgwLCAwLCBbRGlmZk9wLkVxdWFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0X2luc2VydC5zdWJzdHJpbmcoMCwgY29tbW9ubGVuZ3RoKV0pO1xuICAgICAgICAgICAgICAgICAgcG9pbnRlcisrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0ZXh0X2luc2VydCA9IHRleHRfaW5zZXJ0LnN1YnN0cmluZyhjb21tb25sZW5ndGgpO1xuICAgICAgICAgICAgICAgIHRleHRfZGVsZXRlID0gdGV4dF9kZWxldGUuc3Vic3RyaW5nKGNvbW1vbmxlbmd0aCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgLy8gRmFjdG9yIG91dCBhbnkgY29tbW9uIHN1ZmZpeGllcy5cbiAgICAgICAgICAgICAgY29tbW9ubGVuZ3RoID0gdGhpcy5kaWZmX2NvbW1vblN1ZmZpeCh0ZXh0X2luc2VydCwgdGV4dF9kZWxldGUpO1xuICAgICAgICAgICAgICBpZiAoY29tbW9ubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgZGlmZnNbcG9pbnRlcl1bMV0gPSB0ZXh0X2luc2VydC5zdWJzdHJpbmcodGV4dF9pbnNlcnQubGVuZ3RoIC1cbiAgICAgICAgICAgICAgICAgICAgY29tbW9ubGVuZ3RoKSArIGRpZmZzW3BvaW50ZXJdWzFdO1xuICAgICAgICAgICAgICAgIHRleHRfaW5zZXJ0ID0gdGV4dF9pbnNlcnQuc3Vic3RyaW5nKDAsIHRleHRfaW5zZXJ0Lmxlbmd0aCAtXG4gICAgICAgICAgICAgICAgICAgIGNvbW1vbmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgdGV4dF9kZWxldGUgPSB0ZXh0X2RlbGV0ZS5zdWJzdHJpbmcoMCwgdGV4dF9kZWxldGUubGVuZ3RoIC1cbiAgICAgICAgICAgICAgICAgICAgY29tbW9ubGVuZ3RoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRGVsZXRlIHRoZSBvZmZlbmRpbmcgcmVjb3JkcyBhbmQgYWRkIHRoZSBtZXJnZWQgb25lcy5cbiAgICAgICAgICAgIGlmIChjb3VudF9kZWxldGUgPT09IDApIHtcbiAgICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIgLSBjb3VudF9pbnNlcnQsXG4gICAgICAgICAgICAgICAgICBjb3VudF9kZWxldGUgKyBjb3VudF9pbnNlcnQsIFtEaWZmT3AuSW5zZXJ0LCB0ZXh0X2luc2VydF0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjb3VudF9pbnNlcnQgPT09IDApIHtcbiAgICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIgLSBjb3VudF9kZWxldGUsXG4gICAgICAgICAgICAgICAgICBjb3VudF9kZWxldGUgKyBjb3VudF9pbnNlcnQsIFtEaWZmT3AuRGVsZXRlLCB0ZXh0X2RlbGV0ZV0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIgLSBjb3VudF9kZWxldGUgLSBjb3VudF9pbnNlcnQsXG4gICAgICAgICAgICAgICAgICBjb3VudF9kZWxldGUgKyBjb3VudF9pbnNlcnQsIFtEaWZmT3AuRGVsZXRlLCB0ZXh0X2RlbGV0ZV0sXG4gICAgICAgICAgICAgICAgICBbRGlmZk9wLkluc2VydCwgdGV4dF9pbnNlcnRdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBvaW50ZXIgPSBwb2ludGVyIC0gY291bnRfZGVsZXRlIC0gY291bnRfaW5zZXJ0ICtcbiAgICAgICAgICAgICAgICAgICAgICAoY291bnRfZGVsZXRlID8gMSA6IDApICsgKGNvdW50X2luc2VydCA/IDEgOiAwKSArIDE7XG4gICAgICAgICAgfSBlbHNlIGlmIChwb2ludGVyICE9PSAwICYmIGRpZmZzW3BvaW50ZXIgLSAxXVswXSA9PSBEaWZmT3AuRXF1YWwpIHtcbiAgICAgICAgICAgIC8vIE1lcmdlIHRoaXMgZXF1YWxpdHkgd2l0aCB0aGUgcHJldmlvdXMgb25lLlxuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciAtIDFdWzFdICs9IGRpZmZzW3BvaW50ZXJdWzFdO1xuICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIsIDEpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwb2ludGVyKys7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvdW50X2luc2VydCA9IDA7XG4gICAgICAgICAgY291bnRfZGVsZXRlID0gMDtcbiAgICAgICAgICB0ZXh0X2RlbGV0ZSA9ICcnO1xuICAgICAgICAgIHRleHRfaW5zZXJ0ID0gJyc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChkaWZmc1tkaWZmcy5sZW5ndGggLSAxXVsxXSA9PT0gJycpIHtcbiAgICAgIGRpZmZzLnBvcCgpOyAgLy8gUmVtb3ZlIHRoZSBkdW1teSBlbnRyeSBhdCB0aGUgZW5kLlxuICAgIH1cblxuICAgIC8vIFNlY29uZCBwYXNzOiBsb29rIGZvciBzaW5nbGUgZWRpdHMgc3Vycm91bmRlZCBvbiBib3RoIHNpZGVzIGJ5IGVxdWFsaXRpZXNcbiAgICAvLyB3aGljaCBjYW4gYmUgc2hpZnRlZCBzaWRld2F5cyB0byBlbGltaW5hdGUgYW4gZXF1YWxpdHkuXG4gICAgLy8gZS5nOiBBPGlucz5CQTwvaW5zPkMgLT4gPGlucz5BQjwvaW5zPkFDXG4gICAgbGV0IGNoYW5nZXMgPSBmYWxzZTtcbiAgICBwb2ludGVyID0gMTtcbiAgICAvLyBJbnRlbnRpb25hbGx5IGlnbm9yZSB0aGUgZmlyc3QgYW5kIGxhc3QgZWxlbWVudCAoZG9uJ3QgbmVlZCBjaGVja2luZykuXG4gICAgd2hpbGUgKHBvaW50ZXIgPCBkaWZmcy5sZW5ndGggLSAxKSB7XG4gICAgICBpZiAoZGlmZnNbcG9pbnRlciAtIDFdWzBdID09IERpZmZPcC5FcXVhbCAmJlxuICAgICAgICAgIGRpZmZzW3BvaW50ZXIgKyAxXVswXSA9PSBEaWZmT3AuRXF1YWwpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIHNpbmdsZSBlZGl0IHN1cnJvdW5kZWQgYnkgZXF1YWxpdGllcy5cbiAgICAgICAgaWYgKGRpZmZzW3BvaW50ZXJdWzFdLnN1YnN0cmluZyhkaWZmc1twb2ludGVyXVsxXS5sZW5ndGggLVxuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciAtIDFdWzFdLmxlbmd0aCkgPT0gZGlmZnNbcG9pbnRlciAtIDFdWzFdKSB7XG4gICAgICAgICAgLy8gU2hpZnQgdGhlIGVkaXQgb3ZlciB0aGUgcHJldmlvdXMgZXF1YWxpdHkuXG4gICAgICAgICAgZGlmZnNbcG9pbnRlcl1bMV0gPSBkaWZmc1twb2ludGVyIC0gMV1bMV0gK1xuICAgICAgICAgICAgICBkaWZmc1twb2ludGVyXVsxXS5zdWJzdHJpbmcoMCwgZGlmZnNbcG9pbnRlcl1bMV0ubGVuZ3RoIC1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgLSAxXVsxXS5sZW5ndGgpO1xuICAgICAgICAgIGRpZmZzW3BvaW50ZXIgKyAxXVsxXSA9IGRpZmZzW3BvaW50ZXIgLSAxXVsxXSArIGRpZmZzW3BvaW50ZXIgKyAxXVsxXTtcbiAgICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciAtIDEsIDEpO1xuICAgICAgICAgIGNoYW5nZXMgPSB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKGRpZmZzW3BvaW50ZXJdWzFdLnN1YnN0cmluZygwLCBkaWZmc1twb2ludGVyICsgMV1bMV0ubGVuZ3RoKSA9PVxuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciArIDFdWzFdKSB7XG4gICAgICAgICAgLy8gU2hpZnQgdGhlIGVkaXQgb3ZlciB0aGUgbmV4dCBlcXVhbGl0eS5cbiAgICAgICAgICBkaWZmc1twb2ludGVyIC0gMV1bMV0gKz0gZGlmZnNbcG9pbnRlciArIDFdWzFdO1xuICAgICAgICAgIGRpZmZzW3BvaW50ZXJdWzFdID1cbiAgICAgICAgICAgICAgZGlmZnNbcG9pbnRlcl1bMV0uc3Vic3RyaW5nKGRpZmZzW3BvaW50ZXIgKyAxXVsxXS5sZW5ndGgpICtcbiAgICAgICAgICAgICAgZGlmZnNbcG9pbnRlciArIDFdWzFdO1xuICAgICAgICAgIGRpZmZzLnNwbGljZShwb2ludGVyICsgMSwgMSk7XG4gICAgICAgICAgY2hhbmdlcyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHBvaW50ZXIrKztcbiAgICB9XG4gICAgLy8gSWYgc2hpZnRzIHdlcmUgbWFkZSwgdGhlIGRpZmYgbmVlZHMgcmVvcmRlcmluZyBhbmQgYW5vdGhlciBzaGlmdCBzd2VlcC5cbiAgICBpZiAoY2hhbmdlcykge1xuICAgICAgdGhpcy5kaWZmX2NsZWFudXBNZXJnZShkaWZmcyk7XG4gICAgfVxuICB9O1xuXG5cbiAgLyoqXG4gICAqIGxvYyBpcyBhIGxvY2F0aW9uIGluIHRleHQxLCBjb21wdXRlIGFuZCByZXR1cm4gdGhlIGVxdWl2YWxlbnQgbG9jYXRpb24gaW5cbiAgICogdGV4dDIuXG4gICAqIGUuZy4gJ1RoZSBjYXQnIHZzICdUaGUgYmlnIGNhdCcsIDEtPjEsIDUtPjhcbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cbiAgICogQHBhcmFtICBsb2MgTG9jYXRpb24gd2l0aGluIHRleHQxLlxuICAgKiBAcmV0dXJuICBMb2NhdGlvbiB3aXRoaW4gdGV4dDIuXG4gICAqL1xuICAgIGRpZmZfeEluZGV4IChkaWZmczogQXJyYXk8RGlmZj4sIGxvYzogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBsZXQgY2hhcnMxID0gMDtcbiAgICBsZXQgY2hhcnMyID0gMDtcbiAgICBsZXQgbGFzdF9jaGFyczEgPSAwO1xuICAgIGxldCBsYXN0X2NoYXJzMiA9IDA7XG4gICAgbGV0IHg7XG4gICAgZm9yICh4ID0gMDsgeCA8IGRpZmZzLmxlbmd0aDsgeCsrKSB7XG4gICAgICBpZiAoZGlmZnNbeF1bMF0gIT09IERpZmZPcC5JbnNlcnQpIHsgIC8vIEVxdWFsaXR5IG9yIGRlbGV0aW9uLlxuICAgICAgICBjaGFyczEgKz0gZGlmZnNbeF1bMV0ubGVuZ3RoO1xuICAgICAgfVxuICAgICAgaWYgKGRpZmZzW3hdWzBdICE9PSBEaWZmT3AuRGVsZXRlKSB7ICAvLyBFcXVhbGl0eSBvciBpbnNlcnRpb24uXG4gICAgICAgIGNoYXJzMiArPSBkaWZmc1t4XVsxXS5sZW5ndGg7XG4gICAgICB9XG4gICAgICBpZiAoY2hhcnMxID4gbG9jKSB7ICAvLyBPdmVyc2hvdCB0aGUgbG9jYXRpb24uXG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgbGFzdF9jaGFyczEgPSBjaGFyczE7XG4gICAgICBsYXN0X2NoYXJzMiA9IGNoYXJzMjtcbiAgICB9XG4gICAgLy8gV2FzIHRoZSBsb2NhdGlvbiB3YXMgZGVsZXRlZD9cbiAgICBpZiAoZGlmZnMubGVuZ3RoICE9IHggJiYgZGlmZnNbeF1bMF0gPT09IERpZmZPcC5EZWxldGUpIHtcbiAgICAgIHJldHVybiBsYXN0X2NoYXJzMjtcbiAgICB9XG4gICAgLy8gQWRkIHRoZSByZW1haW5pbmcgY2hhcmFjdGVyIGxlbmd0aC5cbiAgICByZXR1cm4gbGFzdF9jaGFyczIgKyAobG9jIC0gbGFzdF9jaGFyczEpO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIENvbnZlcnQgYSBkaWZmIGFycmF5IGludG8gYSBwcmV0dHkgSFRNTCByZXBvcnQuXG4gICAqIEBwYXJhbSAgZGlmZnMgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXG4gICAqIEByZXR1cm4gIEhUTUwgcmVwcmVzZW50YXRpb24uXG4gICAqL1xuICAgIGRpZmZfcHJldHR5SHRtbCA9IGZ1bmN0aW9uKGRpZmZzOiBBcnJheTxEaWZmPik6IHN0cmluZyB7XG4gICAgY29uc3QgaHRtbCA9IFtdO1xuICAgIGNvbnN0IHBhdHRlcm5fYW1wID0gLyYvZztcbiAgICBjb25zdCBwYXR0ZXJuX2x0ID0gLzwvZztcbiAgICBjb25zdCBwYXR0ZXJuX2d0ID0gLz4vZztcbiAgICBjb25zdCBwYXR0ZXJuX3BhcmEgPSAvXFxuL2c7XG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBkaWZmcy5sZW5ndGg7IHgrKykge1xuICAgICAgY29uc3Qgb3AgPSBkaWZmc1t4XVswXTsgICAgLy8gT3BlcmF0aW9uIChpbnNlcnQsIGRlbGV0ZSwgZXF1YWwpXG4gICAgICBjb25zdCBkYXRhID0gZGlmZnNbeF1bMV07ICAvLyBUZXh0IG9mIGNoYW5nZS5cbiAgICAgIGNvbnN0IHRleHQgPSBkYXRhLnJlcGxhY2UocGF0dGVybl9hbXAsICcmYW1wOycpLnJlcGxhY2UocGF0dGVybl9sdCwgJyZsdDsnKVxuICAgICAgICAgIC5yZXBsYWNlKHBhdHRlcm5fZ3QsICcmZ3Q7JykucmVwbGFjZShwYXR0ZXJuX3BhcmEsICcmcGFyYTs8YnI+Jyk7XG4gICAgICBzd2l0Y2ggKG9wKSB7XG4gICAgICAgIGNhc2UgRGlmZk9wLkluc2VydDpcbiAgICAgICAgICBodG1sW3hdID0gJzxpbnMgc3R5bGU9XCJiYWNrZ3JvdW5kOiNlNmZmZTY7XCI+JyArIHRleHQgKyAnPC9pbnM+JztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBEaWZmT3AuRGVsZXRlOlxuICAgICAgICAgIGh0bWxbeF0gPSAnPGRlbCBzdHlsZT1cImJhY2tncm91bmQ6I2ZmZTZlNjtcIj4nICsgdGV4dCArICc8L2RlbD4nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIERpZmZPcC5FcXVhbDpcbiAgICAgICAgICBodG1sW3hdID0gJzxzcGFuPicgKyB0ZXh0ICsgJzwvc3Bhbj4nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaHRtbC5qb2luKCcnKTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBDb21wdXRlIGFuZCByZXR1cm4gdGhlIHNvdXJjZSB0ZXh0IChhbGwgZXF1YWxpdGllcyBhbmQgZGVsZXRpb25zKS5cbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cbiAgICogQHJldHVybiAgU291cmNlIHRleHQuXG4gICAqL1xuICAgIGRpZmZfdGV4dDEgKGRpZmZzOiBBcnJheTxEaWZmPik6IHN0cmluZyB7XG4gICAgY29uc3QgdGV4dCA9IFtdO1xuICAgIGZvciAobGV0IHggPSAwOyB4IDwgZGlmZnMubGVuZ3RoOyB4KyspIHtcbiAgICAgIGlmIChkaWZmc1t4XVswXSAhPT0gRGlmZk9wLkluc2VydCkge1xuICAgICAgICB0ZXh0W3hdID0gZGlmZnNbeF1bMV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0ZXh0LmpvaW4oJycpO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIENvbXB1dGUgYW5kIHJldHVybiB0aGUgZGVzdGluYXRpb24gdGV4dCAoYWxsIGVxdWFsaXRpZXMgYW5kIGluc2VydGlvbnMpLlxuICAgKiBAcGFyYW0gIGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuICAgKiBAcmV0dXJuICBEZXN0aW5hdGlvbiB0ZXh0LlxuICAgKi9cbiAgICBkaWZmX3RleHQyIChkaWZmczogQXJyYXk8RGlmZj4pOiBzdHJpbmcge1xuICAgIGNvbnN0IHRleHQgPSBbXTtcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGRpZmZzLmxlbmd0aDsgeCsrKSB7XG4gICAgICBpZiAoZGlmZnNbeF1bMF0gIT09IERpZmZPcC5EZWxldGUpIHtcbiAgICAgICAgdGV4dFt4XSA9IGRpZmZzW3hdWzFdO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGV4dC5qb2luKCcnKTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBDb21wdXRlIHRoZSBMZXZlbnNodGVpbiBkaXN0YW5jZTsgdGhlIG51bWJlciBvZiBpbnNlcnRlZCwgZGVsZXRlZCBvclxuICAgKiBzdWJzdGl0dXRlZCBjaGFyYWN0ZXJzLlxuICAgKiBAcGFyYW0gIGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuICAgKiBAcmV0dXJuICBOdW1iZXIgb2YgY2hhbmdlcy5cbiAgICovXG4gICAgZGlmZl9sZXZlbnNodGVpbiAoZGlmZnM6IEFycmF5PERpZmY+KTogbnVtYmVyIHtcbiAgICBsZXQgbGV2ZW5zaHRlaW4gPSAwO1xuICAgIGxldCBpbnNlcnRpb25zID0gMDtcbiAgICBsZXQgZGVsZXRpb25zID0gMDtcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGRpZmZzLmxlbmd0aDsgeCsrKSB7XG4gICAgICBjb25zdCBvcCA9IGRpZmZzW3hdWzBdO1xuICAgICAgY29uc3QgZGF0YSA9IGRpZmZzW3hdWzFdO1xuICAgICAgc3dpdGNoIChvcCkge1xuICAgICAgICBjYXNlIERpZmZPcC5JbnNlcnQ6XG4gICAgICAgICAgaW5zZXJ0aW9ucyArPSBkYXRhLmxlbmd0aDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBEaWZmT3AuRGVsZXRlOlxuICAgICAgICAgIGRlbGV0aW9ucyArPSBkYXRhLmxlbmd0aDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBEaWZmT3AuRXF1YWw6XG4gICAgICAgICAgLy8gQSBkZWxldGlvbiBhbmQgYW4gaW5zZXJ0aW9uIGlzIG9uZSBzdWJzdGl0dXRpb24uXG4gICAgICAgICAgbGV2ZW5zaHRlaW4gKz0gTWF0aC5tYXgoaW5zZXJ0aW9ucywgZGVsZXRpb25zKTtcbiAgICAgICAgICBpbnNlcnRpb25zID0gMDtcbiAgICAgICAgICBkZWxldGlvbnMgPSAwO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBsZXZlbnNodGVpbiArPSBNYXRoLm1heChpbnNlcnRpb25zLCBkZWxldGlvbnMpO1xuICAgIHJldHVybiBsZXZlbnNodGVpbjtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBDcnVzaCB0aGUgZGlmZiBpbnRvIGFuIGVuY29kZWQgc3RyaW5nIHdoaWNoIGRlc2NyaWJlcyB0aGUgb3BlcmF0aW9uc1xuICAgKiByZXF1aXJlZCB0byB0cmFuc2Zvcm0gdGV4dDEgaW50byB0ZXh0Mi5cbiAgICogRS5nLiA9M1xcdC0yXFx0K2luZyAgLT4gS2VlcCAzIGNoYXJzLCBkZWxldGUgMiBjaGFycywgaW5zZXJ0ICdpbmcnLlxuICAgKiBPcGVyYXRpb25zIGFyZSB0YWItc2VwYXJhdGVkLiAgSW5zZXJ0ZWQgdGV4dCBpcyBlc2NhcGVkIHVzaW5nICV4eCBub3RhdGlvbi5cbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cbiAgICogQHJldHVybiAgRGVsdGEgdGV4dC5cbiAgICovXG4gICAgZGlmZl90b0RlbHRhIChkaWZmczogQXJyYXk8RGlmZj4pOiBzdHJpbmcge1xuICAgIGNvbnN0IHRleHQgPSBbXTtcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGRpZmZzLmxlbmd0aDsgeCsrKSB7XG4gICAgICBzd2l0Y2ggKGRpZmZzW3hdWzBdKSB7XG4gICAgICAgIGNhc2UgRGlmZk9wLkluc2VydDpcbiAgICAgICAgICB0ZXh0W3hdID0gJysnICsgZW5jb2RlVVJJKGRpZmZzW3hdWzFdKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBEaWZmT3AuRGVsZXRlOlxuICAgICAgICAgIHRleHRbeF0gPSAnLScgKyBkaWZmc1t4XVsxXS5sZW5ndGg7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgRGlmZk9wLkVxdWFsOlxuICAgICAgICAgIHRleHRbeF0gPSAnPScgKyBkaWZmc1t4XVsxXS5sZW5ndGg7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0ZXh0LmpvaW4oJ1xcdCcpLnJlcGxhY2UoLyUyMC9nLCAnICcpO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIEdpdmVuIHRoZSBvcmlnaW5hbCB0ZXh0MSwgYW5kIGFuIGVuY29kZWQgc3RyaW5nIHdoaWNoIGRlc2NyaWJlcyB0aGVcbiAgICogb3BlcmF0aW9ucyByZXF1aXJlZCB0byB0cmFuc2Zvcm0gdGV4dDEgaW50byB0ZXh0MiwgY29tcHV0ZSB0aGUgZnVsbCBkaWZmLlxuICAgKiBAcGFyYW0gIHRleHQxIFNvdXJjZSBzdHJpbmcgZm9yIHRoZSBkaWZmLlxuICAgKiBAcGFyYW0gIGRlbHRhIERlbHRhIHRleHQuXG4gICAqIEByZXR1cm4gIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuICAgKiBAdGhyb3dzIHshRXJyb3J9IElmIGludmFsaWQgaW5wdXQuXG4gICAqL1xuICAgIGRpZmZfZnJvbURlbHRhICh0ZXh0MTogc3RyaW5nLCBkZWx0YTogc3RyaW5nKSB7XG4gICAgY29uc3QgZGlmZnMgPSBbXTtcbiAgICBsZXQgZGlmZnNMZW5ndGggPSAwOyAgLy8gS2VlcGluZyBvdXIgb3duIGxlbmd0aCBjb25zdCBpcyBmYXN0ZXIgaW4gSlMuXG4gICAgbGV0IHBvaW50ZXIgPSAwOyAgLy8gQ3Vyc29yIGluIHRleHQxXG4gICAgY29uc3QgdG9rZW5zID0gZGVsdGEuc3BsaXQoL1xcdC9nKTtcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHRva2Vucy5sZW5ndGg7IHgrKykge1xuICAgICAgLy8gRWFjaCB0b2tlbiBiZWdpbnMgd2l0aCBhIG9uZSBjaGFyYWN0ZXIgcGFyYW1ldGVyIHdoaWNoIHNwZWNpZmllcyB0aGVcbiAgICAgIC8vIG9wZXJhdGlvbiBvZiB0aGlzIHRva2VuIChkZWxldGUsIGluc2VydCwgZXF1YWxpdHkpLlxuICAgICAgY29uc3QgcGFyYW0gPSB0b2tlbnNbeF0uc3Vic3RyaW5nKDEpO1xuICAgICAgc3dpdGNoICh0b2tlbnNbeF0uY2hhckF0KDApKSB7XG4gICAgICAgIGNhc2UgJysnOlxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBkaWZmc1tkaWZmc0xlbmd0aCsrXSA9IFtEaWZmT3AuSW5zZXJ0LCBkZWNvZGVVUkkocGFyYW0pXTtcbiAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgLy8gTWFsZm9ybWVkIFVSSSBzZXF1ZW5jZS5cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSWxsZWdhbCBlc2NhcGUgaW4gZGlmZl9mcm9tRGVsdGE6ICcgKyBwYXJhbSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICctJzpcbiAgICAgICAgICAvLyBGYWxsIHRocm91Z2guXG4gICAgICAgIGNhc2UgJz0nOlxuICAgICAgICAgIGNvbnN0IG4gPSBwYXJzZUludChwYXJhbSwgMTApO1xuICAgICAgICAgIGlmIChpc05hTihuKSB8fCBuIDwgMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIG51bWJlciBpbiBkaWZmX2Zyb21EZWx0YTogJyArIHBhcmFtKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgdGV4dCA9IHRleHQxLnN1YnN0cmluZyhwb2ludGVyLCBwb2ludGVyICs9IG4pO1xuICAgICAgICAgIGlmICh0b2tlbnNbeF0uY2hhckF0KDApID09ICc9Jykge1xuICAgICAgICAgICAgZGlmZnNbZGlmZnNMZW5ndGgrK10gPSBbRGlmZk9wLkVxdWFsLCB0ZXh0XTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGlmZnNbZGlmZnNMZW5ndGgrK10gPSBbRGlmZk9wLkRlbGV0ZSwgdGV4dF07XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIC8vIEJsYW5rIHRva2VucyBhcmUgb2sgKGZyb20gYSB0cmFpbGluZyBcXHQpLlxuICAgICAgICAgIC8vIEFueXRoaW5nIGVsc2UgaXMgYW4gZXJyb3IuXG4gICAgICAgICAgaWYgKHRva2Vuc1t4XSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGRpZmYgb3BlcmF0aW9uIGluIGRpZmZfZnJvbURlbHRhOiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnNbeF0pO1xuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHBvaW50ZXIgIT0gdGV4dDEubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RlbHRhIGxlbmd0aCAoJyArIHBvaW50ZXIgK1xuICAgICAgICAgICcpIGRvZXMgbm90IGVxdWFsIHNvdXJjZSB0ZXh0IGxlbmd0aCAoJyArIHRleHQxLmxlbmd0aCArICcpLicpO1xuICAgIH1cbiAgICByZXR1cm4gZGlmZnM7XG4gIH07XG5cbiAgLyoqXG4gICAqIExvY2F0ZSB0aGUgYmVzdCBpbnN0YW5jZSBvZiAncGF0dGVybicgaW4gJ3RleHQnIG5lYXIgJ2xvYycuXG4gICAqIEBwYXJhbSAgdGV4dCBUaGUgdGV4dCB0byBzZWFyY2guXG4gICAqIEBwYXJhbSAgcGF0dGVybiBUaGUgcGF0dGVybiB0byBzZWFyY2ggZm9yLlxuICAgKiBAcGFyYW0gIGxvYyBUaGUgbG9jYXRpb24gdG8gc2VhcmNoIGFyb3VuZC5cbiAgICogQHJldHVybiAgQmVzdCBtYXRjaCBpbmRleCBvciAtMS5cbiAgICovXG4gICAgbWF0Y2hfbWFpbiAodGV4dDogc3RyaW5nLCBwYXR0ZXJuOiBzdHJpbmcsIGxvYzogbnVtYmVyKTogbnVtYmVyIHtcbiAgICAvLyBDaGVjayBmb3IgbnVsbCBpbnB1dHMuXG4gICAgaWYgKHRleHQgPT0gbnVsbCB8fCBwYXR0ZXJuID09IG51bGwgfHwgbG9jID09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTnVsbCBpbnB1dC4gKG1hdGNoX21haW4pJyk7XG4gICAgfVxuXG4gICAgbG9jID0gTWF0aC5tYXgoMCwgTWF0aC5taW4obG9jLCB0ZXh0Lmxlbmd0aCkpO1xuICAgIGlmICh0ZXh0ID09IHBhdHRlcm4pIHtcbiAgICAgIC8vIFNob3J0Y3V0IChwb3RlbnRpYWxseSBub3QgZ3VhcmFudGVlZCBieSB0aGUgYWxnb3JpdGhtKVxuICAgICAgcmV0dXJuIDA7XG4gICAgfSBlbHNlIGlmICghdGV4dC5sZW5ndGgpIHtcbiAgICAgIC8vIE5vdGhpbmcgdG8gbWF0Y2guXG4gICAgICByZXR1cm4gLTE7XG4gICAgfSBlbHNlIGlmICh0ZXh0LnN1YnN0cmluZyhsb2MsIGxvYyArIHBhdHRlcm4ubGVuZ3RoKSA9PSBwYXR0ZXJuKSB7XG4gICAgICAvLyBQZXJmZWN0IG1hdGNoIGF0IHRoZSBwZXJmZWN0IHNwb3QhICAoSW5jbHVkZXMgY2FzZSBvZiBudWxsIHBhdHRlcm4pXG4gICAgICByZXR1cm4gbG9jO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBEbyBhIGZ1enp5IGNvbXBhcmUuXG4gICAgICByZXR1cm4gdGhpcy5tYXRjaF9iaXRhcF8odGV4dCwgcGF0dGVybiwgbG9jKTtcbiAgICB9XG4gIH07XG5cblxuICAvKipcbiAgICogTG9jYXRlIHRoZSBiZXN0IGluc3RhbmNlIG9mICdwYXR0ZXJuJyBpbiAndGV4dCcgbmVhciAnbG9jJyB1c2luZyB0aGVcbiAgICogQml0YXAgYWxnb3JpdGhtLlxuICAgKiBAcGFyYW0gIHRleHQgVGhlIHRleHQgdG8gc2VhcmNoLlxuICAgKiBAcGFyYW0gIHBhdHRlcm4gVGhlIHBhdHRlcm4gdG8gc2VhcmNoIGZvci5cbiAgICogQHBhcmFtICBsb2MgVGhlIGxvY2F0aW9uIHRvIHNlYXJjaCBhcm91bmQuXG4gICAqIEByZXR1cm4gIEJlc3QgbWF0Y2ggaW5kZXggb3IgLTEuXG5cbiAgICovXG4gICAgbWF0Y2hfYml0YXBfICh0ZXh0OiBzdHJpbmcsIHBhdHRlcm46IHN0cmluZywgbG9jOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGlmIChwYXR0ZXJuLmxlbmd0aCA+IHRoaXMuTWF0Y2hfTWF4Qml0cykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdQYXR0ZXJuIHRvbyBsb25nIGZvciB0aGlzIGJyb3dzZXIuJyk7XG4gICAgfVxuXG4gICAgLy8gSW5pdGlhbGlzZSB0aGUgYWxwaGFiZXQuXG4gICAgY29uc3QgcyA9IHRoaXMubWF0Y2hfYWxwaGFiZXRfKHBhdHRlcm4pO1xuXG4gICAgY29uc3QgZG1wID0gdGhpczsgIC8vICd0aGlzJyBiZWNvbWVzICd3aW5kb3cnIGluIGEgY2xvc3VyZS5cblxuICAgIC8qKlxuICAgICAqIENvbXB1dGUgYW5kIHJldHVybiB0aGUgc2NvcmUgZm9yIGEgbWF0Y2ggd2l0aCBlIGVycm9ycyBhbmQgeCBsb2NhdGlvbi5cbiAgICAgKiBBY2Nlc3NlcyBsb2MgYW5kIHBhdHRlcm4gdGhyb3VnaCBiZWluZyBhIGNsb3N1cmUuXG4gICAgICogQHBhcmFtICBlIE51bWJlciBvZiBlcnJvcnMgaW4gbWF0Y2guXG4gICAgICogQHBhcmFtICB4IExvY2F0aW9uIG9mIG1hdGNoLlxuICAgICAqIEByZXR1cm4gIE92ZXJhbGwgc2NvcmUgZm9yIG1hdGNoICgwLjAgPSBnb29kLCAxLjAgPSBiYWQpLlxuXG4gICAgICovXG4gICAgZnVuY3Rpb24gbWF0Y2hfYml0YXBTY29yZV8oZTogbnVtYmVyLCB4OiBudW1iZXIpOiBudW1iZXIge1xuICAgICAgY29uc3QgYWNjdXJhY3kgPSBlIC8gcGF0dGVybi5sZW5ndGg7XG4gICAgICBjb25zdCBwcm94aW1pdHkgPSBNYXRoLmFicyhsb2MgLSB4KTtcbiAgICAgIGlmICghZG1wLk1hdGNoX0Rpc3RhbmNlKSB7XG4gICAgICAgIC8vIERvZGdlIGRpdmlkZSBieSB6ZXJvIGVycm9yLlxuICAgICAgICByZXR1cm4gcHJveGltaXR5ID8gMS4wIDogYWNjdXJhY3k7XG4gICAgICB9XG4gICAgICByZXR1cm4gYWNjdXJhY3kgKyAocHJveGltaXR5IC8gZG1wLk1hdGNoX0Rpc3RhbmNlKTtcbiAgICB9XG5cbiAgICAvLyBIaWdoZXN0IHNjb3JlIGJleW9uZCB3aGljaCB3ZSBnaXZlIHVwLlxuICAgIGxldCBzY29yZV90aHJlc2hvbGQgPSB0aGlzLk1hdGNoX1RocmVzaG9sZDtcbiAgICAvLyBJcyB0aGVyZSBhIG5lYXJieSBleGFjdCBtYXRjaD8gKHNwZWVkdXApXG4gICAgbGV0IGJlc3RfbG9jID0gdGV4dC5pbmRleE9mKHBhdHRlcm4sIGxvYyk7XG4gICAgaWYgKGJlc3RfbG9jICE9IC0xKSB7XG4gICAgICBzY29yZV90aHJlc2hvbGQgPSBNYXRoLm1pbihtYXRjaF9iaXRhcFNjb3JlXygwLCBiZXN0X2xvYyksIHNjb3JlX3RocmVzaG9sZCk7XG4gICAgICAvLyBXaGF0IGFib3V0IGluIHRoZSBvdGhlciBkaXJlY3Rpb24/IChzcGVlZHVwKVxuICAgICAgYmVzdF9sb2MgPSB0ZXh0Lmxhc3RJbmRleE9mKHBhdHRlcm4sIGxvYyArIHBhdHRlcm4ubGVuZ3RoKTtcbiAgICAgIGlmIChiZXN0X2xvYyAhPSAtMSkge1xuICAgICAgICBzY29yZV90aHJlc2hvbGQgPVxuICAgICAgICAgICAgTWF0aC5taW4obWF0Y2hfYml0YXBTY29yZV8oMCwgYmVzdF9sb2MpLCBzY29yZV90aHJlc2hvbGQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEluaXRpYWxpc2UgdGhlIGJpdCBhcnJheXMuXG4gICAgY29uc3QgbWF0Y2htYXNrID0gMSA8PCAocGF0dGVybi5sZW5ndGggLSAxKTtcbiAgICBiZXN0X2xvYyA9IC0xO1xuXG4gICAgbGV0IGJpbl9taW4sIGJpbl9taWQ7XG4gICAgbGV0IGJpbl9tYXggPSBwYXR0ZXJuLmxlbmd0aCArIHRleHQubGVuZ3RoO1xuICAgIGxldCBsYXN0X3JkO1xuICAgIGZvciAobGV0IGQgPSAwOyBkIDwgcGF0dGVybi5sZW5ndGg7IGQrKykge1xuICAgICAgLy8gU2NhbiBmb3IgdGhlIGJlc3QgbWF0Y2g7IGVhY2ggaXRlcmF0aW9uIGFsbG93cyBmb3Igb25lIG1vcmUgZXJyb3IuXG4gICAgICAvLyBSdW4gYSBiaW5hcnkgc2VhcmNoIHRvIGRldGVybWluZSBob3cgZmFyIGZyb20gJ2xvYycgd2UgY2FuIHN0cmF5IGF0IHRoaXNcbiAgICAgIC8vIGVycm9yIGxldmVsLlxuICAgICAgYmluX21pbiA9IDA7XG4gICAgICBiaW5fbWlkID0gYmluX21heDtcbiAgICAgIHdoaWxlIChiaW5fbWluIDwgYmluX21pZCkge1xuICAgICAgICBpZiAobWF0Y2hfYml0YXBTY29yZV8oZCwgbG9jICsgYmluX21pZCkgPD0gc2NvcmVfdGhyZXNob2xkKSB7XG4gICAgICAgICAgYmluX21pbiA9IGJpbl9taWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYmluX21heCA9IGJpbl9taWQ7XG4gICAgICAgIH1cbiAgICAgICAgYmluX21pZCA9IE1hdGguZmxvb3IoKGJpbl9tYXggLSBiaW5fbWluKSAvIDIgKyBiaW5fbWluKTtcbiAgICAgIH1cbiAgICAgIC8vIFVzZSB0aGUgcmVzdWx0IGZyb20gdGhpcyBpdGVyYXRpb24gYXMgdGhlIG1heGltdW0gZm9yIHRoZSBuZXh0LlxuICAgICAgYmluX21heCA9IGJpbl9taWQ7XG4gICAgICBsZXQgc3RhcnQgPSBNYXRoLm1heCgxLCBsb2MgLSBiaW5fbWlkICsgMSk7XG4gICAgICBjb25zdCBmaW5pc2ggPSBNYXRoLm1pbihsb2MgKyBiaW5fbWlkLCB0ZXh0Lmxlbmd0aCkgKyBwYXR0ZXJuLmxlbmd0aDtcblxuICAgICAgY29uc3QgcmQgPSBBcnJheShmaW5pc2ggKyAyKTtcbiAgICAgIHJkW2ZpbmlzaCArIDFdID0gKDEgPDwgZCkgLSAxO1xuICAgICAgZm9yIChsZXQgaiA9IGZpbmlzaDsgaiA+PSBzdGFydDsgai0tKSB7XG4gICAgICAgIC8vIFRoZSBhbHBoYWJldCAocykgaXMgYSBzcGFyc2UgaGFzaCwgc28gdGhlIGZvbGxvd2luZyBsaW5lIGdlbmVyYXRlc1xuICAgICAgICAvLyB3YXJuaW5ncy5cbiAgICAgICAgY29uc3QgY2hhck1hdGNoID0gc1t0ZXh0LmNoYXJBdChqIC0gMSldO1xuICAgICAgICBpZiAoZCA9PT0gMCkgeyAgLy8gRmlyc3QgcGFzczogZXhhY3QgbWF0Y2guXG4gICAgICAgICAgcmRbal0gPSAoKHJkW2ogKyAxXSA8PCAxKSB8IDEpICYgY2hhck1hdGNoO1xuICAgICAgICB9IGVsc2UgeyAgLy8gU3Vic2VxdWVudCBwYXNzZXM6IGZ1enp5IG1hdGNoLlxuICAgICAgICAgIHJkW2pdID0gKCgocmRbaiArIDFdIDw8IDEpIHwgMSkgJiBjaGFyTWF0Y2gpIHxcbiAgICAgICAgICAgICAgICAgICgoKGxhc3RfcmRbaiArIDFdIHwgbGFzdF9yZFtqXSkgPDwgMSkgfCAxKSB8XG4gICAgICAgICAgICAgICAgICBsYXN0X3JkW2ogKyAxXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmRbal0gJiBtYXRjaG1hc2spIHtcbiAgICAgICAgICBjb25zdCBzY29yZSA9IG1hdGNoX2JpdGFwU2NvcmVfKGQsIGogLSAxKTtcbiAgICAgICAgICAvLyBUaGlzIG1hdGNoIHdpbGwgYWxtb3N0IGNlcnRhaW5seSBiZSBiZXR0ZXIgdGhhbiBhbnkgZXhpc3RpbmcgbWF0Y2guXG4gICAgICAgICAgLy8gQnV0IGNoZWNrIGFueXdheS5cbiAgICAgICAgICBpZiAoc2NvcmUgPD0gc2NvcmVfdGhyZXNob2xkKSB7XG4gICAgICAgICAgICAvLyBUb2xkIHlvdSBzby5cbiAgICAgICAgICAgIHNjb3JlX3RocmVzaG9sZCA9IHNjb3JlO1xuICAgICAgICAgICAgYmVzdF9sb2MgPSBqIC0gMTtcbiAgICAgICAgICAgIGlmIChiZXN0X2xvYyA+IGxvYykge1xuICAgICAgICAgICAgICAvLyBXaGVuIHBhc3NpbmcgbG9jLCBkb24ndCBleGNlZWQgb3VyIGN1cnJlbnQgZGlzdGFuY2UgZnJvbSBsb2MuXG4gICAgICAgICAgICAgIHN0YXJ0ID0gTWF0aC5tYXgoMSwgMiAqIGxvYyAtIGJlc3RfbG9jKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIEFscmVhZHkgcGFzc2VkIGxvYywgZG93bmhpbGwgZnJvbSBoZXJlIG9uIGluLlxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIE5vIGhvcGUgZm9yIGEgKGJldHRlcikgbWF0Y2ggYXQgZ3JlYXRlciBlcnJvciBsZXZlbHMuXG4gICAgICBpZiAobWF0Y2hfYml0YXBTY29yZV8oZCArIDEsIGxvYykgPiBzY29yZV90aHJlc2hvbGQpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBsYXN0X3JkID0gcmQ7XG4gICAgfVxuICAgIHJldHVybiBiZXN0X2xvYztcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXNlIHRoZSBhbHBoYWJldCBmb3IgdGhlIEJpdGFwIGFsZ29yaXRobS5cbiAgICogQHBhcmFtICBwYXR0ZXJuIFRoZSB0ZXh0IHRvIGVuY29kZS5cbiAgICogQHJldHVybiAgSGFzaCBvZiBjaGFyYWN0ZXIgbG9jYXRpb25zLlxuXG4gICAqL1xuICAgIG1hdGNoX2FscGhhYmV0XyAocGF0dGVybjogc3RyaW5nKTogeyBbY2hhcmFjdGVyOiBzdHJpbmddOiBudW1iZXIgfSB7XG4gICAgY29uc3QgczogeyBbY2hhcmFjdGVyOiBzdHJpbmddOiBudW1iZXIgfSA9IHt9O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0dGVybi5sZW5ndGg7IGkrKykge1xuICAgICAgc1twYXR0ZXJuLmNoYXJBdChpKV0gPSAwO1xuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhdHRlcm4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHNbcGF0dGVybi5jaGFyQXQoaSldIHw9IDEgPDwgKHBhdHRlcm4ubGVuZ3RoIC0gaSAtIDEpO1xuICAgIH1cbiAgICByZXR1cm4gcztcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBJbmNyZWFzZSB0aGUgY29udGV4dCB1bnRpbCBpdCBpcyB1bmlxdWUsXG4gICAqIGJ1dCBkb24ndCBsZXQgdGhlIHBhdHRlcm4gZXhwYW5kIGJleW9uZCBNYXRjaF9NYXhCaXRzLlxuICAgKiBAcGFyYW0gIHBhdGNoIFRoZSBwYXRjaCB0byBncm93LlxuICAgKiBAcGFyYW0gIHRleHQgU291cmNlIHRleHQuXG5cbiAgICovXG4gICAgcGF0Y2hfYWRkQ29udGV4dF8gKHBhdGNoOiBwYXRjaF9vYmosIHRleHQ6IHN0cmluZykge1xuICAgIGlmICh0ZXh0Lmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCBwYXR0ZXJuID0gdGV4dC5zdWJzdHJpbmcocGF0Y2guc3RhcnQyLCBwYXRjaC5zdGFydDIgKyBwYXRjaC5sZW5ndGgxKTtcbiAgICBsZXQgcGFkZGluZyA9IDA7XG5cbiAgICAvLyBMb29rIGZvciB0aGUgZmlyc3QgYW5kIGxhc3QgbWF0Y2hlcyBvZiBwYXR0ZXJuIGluIHRleHQuICBJZiB0d28gZGlmZmVyZW50XG4gICAgLy8gbWF0Y2hlcyBhcmUgZm91bmQsIGluY3JlYXNlIHRoZSBwYXR0ZXJuIGxlbmd0aC5cbiAgICB3aGlsZSAodGV4dC5pbmRleE9mKHBhdHRlcm4pICE9IHRleHQubGFzdEluZGV4T2YocGF0dGVybikgJiZcbiAgICAgICAgICBwYXR0ZXJuLmxlbmd0aCA8IHRoaXMuTWF0Y2hfTWF4Qml0cyAtIHRoaXMuUGF0Y2hfTWFyZ2luIC1cbiAgICAgICAgICB0aGlzLlBhdGNoX01hcmdpbikge1xuICAgICAgcGFkZGluZyArPSB0aGlzLlBhdGNoX01hcmdpbjtcbiAgICAgIHBhdHRlcm4gPSB0ZXh0LnN1YnN0cmluZyhwYXRjaC5zdGFydDIgLSBwYWRkaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0Y2guc3RhcnQyICsgcGF0Y2gubGVuZ3RoMSArIHBhZGRpbmcpO1xuICAgIH1cbiAgICAvLyBBZGQgb25lIGNodW5rIGZvciBnb29kIGx1Y2suXG4gICAgcGFkZGluZyArPSB0aGlzLlBhdGNoX01hcmdpbjtcblxuICAgIC8vIEFkZCB0aGUgcHJlZml4LlxuICAgIGNvbnN0IHByZWZpeCA9IHRleHQuc3Vic3RyaW5nKHBhdGNoLnN0YXJ0MiAtIHBhZGRpbmcsIHBhdGNoLnN0YXJ0Mik7XG4gICAgaWYgKHByZWZpeCkge1xuICAgICAgcGF0Y2guZGlmZnMudW5zaGlmdChbRGlmZk9wLkVxdWFsLCBwcmVmaXhdKTtcbiAgICB9XG4gICAgLy8gQWRkIHRoZSBzdWZmaXguXG4gICAgY29uc3Qgc3VmZml4ID0gdGV4dC5zdWJzdHJpbmcocGF0Y2guc3RhcnQyICsgcGF0Y2gubGVuZ3RoMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0Y2guc3RhcnQyICsgcGF0Y2gubGVuZ3RoMSArIHBhZGRpbmcpO1xuICAgIGlmIChzdWZmaXgpIHtcbiAgICAgIHBhdGNoLmRpZmZzLnB1c2goW0RpZmZPcC5FcXVhbCwgc3VmZml4XSk7XG4gICAgfVxuXG4gICAgLy8gUm9sbCBiYWNrIHRoZSBzdGFydCBwb2ludHMuXG4gICAgcGF0Y2guc3RhcnQxIC09IHByZWZpeC5sZW5ndGg7XG4gICAgcGF0Y2guc3RhcnQyIC09IHByZWZpeC5sZW5ndGg7XG4gICAgLy8gRXh0ZW5kIHRoZSBsZW5ndGhzLlxuICAgIHBhdGNoLmxlbmd0aDEgKz0gcHJlZml4Lmxlbmd0aCArIHN1ZmZpeC5sZW5ndGg7XG4gICAgcGF0Y2gubGVuZ3RoMiArPSBwcmVmaXgubGVuZ3RoICsgc3VmZml4Lmxlbmd0aDtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBDb21wdXRlIGEgbGlzdCBvZiBwYXRjaGVzIHRvIHR1cm4gdGV4dDEgaW50byB0ZXh0Mi5cbiAgICogVXNlIGRpZmZzIGlmIHByb3ZpZGVkLCBvdGhlcndpc2UgY29tcHV0ZSBpdCBvdXJzZWx2ZXMuXG4gICAqIFRoZXJlIGFyZSBmb3VyIHdheXMgdG8gY2FsbCB0aGlzIGZ1bmN0aW9uLCBkZXBlbmRpbmcgb24gd2hhdCBkYXRhIGlzXG4gICAqIGF2YWlsYWJsZSB0byB0aGUgY2FsbGVyOlxuICAgKiBNZXRob2QgMTpcbiAgICogYSA9IHRleHQxLCBiID0gdGV4dDJcbiAgICogTWV0aG9kIDI6XG4gICAqIGEgPSBkaWZmc1xuICAgKiBNZXRob2QgMyAob3B0aW1hbCk6XG4gICAqIGEgPSB0ZXh0MSwgYiA9IGRpZmZzXG4gICAqIE1ldGhvZCA0IChkZXByZWNhdGVkLCB1c2UgbWV0aG9kIDMpOlxuICAgKiBhID0gdGV4dDEsIGIgPSB0ZXh0MiwgYyA9IGRpZmZzXG4gICAqXG4gICAqIEBwYXJhbSAgYSB0ZXh0MSAobWV0aG9kcyAxLDMsNCkgb3JcbiAgICogQXJyYXkgb2YgZGlmZiB0dXBsZXMgZm9yIHRleHQxIHRvIHRleHQyIChtZXRob2QgMikuXG4gICAqIEBwYXJhbSAgb3B0X2IgdGV4dDIgKG1ldGhvZHMgMSw0KSBvclxuICAgKiBBcnJheSBvZiBkaWZmIHR1cGxlcyBmb3IgdGV4dDEgdG8gdGV4dDIgKG1ldGhvZCAzKSBvciB1bmRlZmluZWQgKG1ldGhvZCAyKS5cbiAgICogQHBhcmFtICBvcHRfYyBBcnJheSBvZiBkaWZmIHR1cGxlc1xuICAgKiBmb3IgdGV4dDEgdG8gdGV4dDIgKG1ldGhvZCA0KSBvciB1bmRlZmluZWQgKG1ldGhvZHMgMSwyLDMpLlxuICAgKiBAcmV0dXJuICBBcnJheSBvZiBQYXRjaCBvYmplY3RzLlxuICAgKi9cbiAgICBwYXRjaF9tYWtlIChhOiBzdHJpbmcgfCBBcnJheTxEaWZmPiwgb3B0X2I6IHN0cmluZyB8IEFycmF5PERpZmY+LCBvcHRfYzogc3RyaW5nIHwgQXJyYXk8RGlmZj4pIHtcbiAgICBsZXQgdGV4dDEsIGRpZmZzO1xuICAgIGlmICh0eXBlb2YgYSA9PSAnc3RyaW5nJyAmJiB0eXBlb2Ygb3B0X2IgPT0gJ3N0cmluZycgJiZcbiAgICAgICAgdHlwZW9mIG9wdF9jID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvLyBNZXRob2QgMTogdGV4dDEsIHRleHQyXG4gICAgICAvLyBDb21wdXRlIGRpZmZzIGZyb20gdGV4dDEgYW5kIHRleHQyLlxuICAgICAgdGV4dDEgPSAoYSk7XG4gICAgICBkaWZmcyA9IHRoaXMuZGlmZl9tYWluKHRleHQxLCAob3B0X2IpLCB0cnVlKTtcbiAgICAgIGlmIChkaWZmcy5sZW5ndGggPiAyKSB7XG4gICAgICAgIHRoaXMuZGlmZl9jbGVhbnVwU2VtYW50aWMoZGlmZnMpO1xuICAgICAgICB0aGlzLmRpZmZfY2xlYW51cEVmZmljaWVuY3koZGlmZnMpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYSAmJiB0eXBlb2YgYSA9PSAnb2JqZWN0JyAmJiB0eXBlb2Ygb3B0X2IgPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgdHlwZW9mIG9wdF9jID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvLyBNZXRob2QgMjogZGlmZnNcbiAgICAgIC8vIENvbXB1dGUgdGV4dDEgZnJvbSBkaWZmcy5cbiAgICAgIGRpZmZzID0gKGEpO1xuICAgICAgdGV4dDEgPSB0aGlzLmRpZmZfdGV4dDEoZGlmZnMpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGEgPT0gJ3N0cmluZycgJiYgb3B0X2IgJiYgdHlwZW9mIG9wdF9iID09ICdvYmplY3QnICYmXG4gICAgICAgIHR5cGVvZiBvcHRfYyA9PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gTWV0aG9kIDM6IHRleHQxLCBkaWZmc1xuICAgICAgdGV4dDEgPSAoYSk7XG4gICAgICBkaWZmcyA9IChvcHRfYik7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgYSA9PSAnc3RyaW5nJyAmJiB0eXBlb2Ygb3B0X2IgPT0gJ3N0cmluZycgJiZcbiAgICAgICAgb3B0X2MgJiYgdHlwZW9mIG9wdF9jID09ICdvYmplY3QnKSB7XG4gICAgICAvLyBNZXRob2QgNDogdGV4dDEsIHRleHQyLCBkaWZmc1xuICAgICAgLy8gdGV4dDIgaXMgbm90IHVzZWQuXG4gICAgICB0ZXh0MSA9IChhKTtcbiAgICAgIGRpZmZzID0gKG9wdF9jKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGNhbGwgZm9ybWF0IHRvIHBhdGNoX21ha2UuJyk7XG4gICAgfVxuXG4gICAgaWYgKGRpZmZzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIFtdOyAgLy8gR2V0IHJpZCBvZiB0aGUgbnVsbCBjYXNlLlxuICAgIH1cbiAgICBjb25zdCBwYXRjaGVzID0gW107XG4gICAgbGV0IHBhdGNoID0gbmV3IHBhdGNoX29iaigpO1xuICAgIGxldCBwYXRjaERpZmZMZW5ndGggPSAwOyAgLy8gS2VlcGluZyBvdXIgb3duIGxlbmd0aCBjb25zdCBpcyBmYXN0ZXIgaW4gSlMuXG4gICAgbGV0IGNoYXJfY291bnQxID0gMDsgIC8vIE51bWJlciBvZiBjaGFyYWN0ZXJzIGludG8gdGhlIHRleHQxIHN0cmluZy5cbiAgICBsZXQgY2hhcl9jb3VudDIgPSAwOyAgLy8gTnVtYmVyIG9mIGNoYXJhY3RlcnMgaW50byB0aGUgdGV4dDIgc3RyaW5nLlxuICAgIC8vIFN0YXJ0IHdpdGggdGV4dDEgKHByZXBhdGNoX3RleHQpIGFuZCBhcHBseSB0aGUgZGlmZnMgdW50aWwgd2UgYXJyaXZlIGF0XG4gICAgLy8gdGV4dDIgKHBvc3RwYXRjaF90ZXh0KS4gIFdlIHJlY3JlYXRlIHRoZSBwYXRjaGVzIG9uZSBieSBvbmUgdG8gZGV0ZXJtaW5lXG4gICAgLy8gY29udGV4dCBpbmZvLlxuICAgIGxldCBwcmVwYXRjaF90ZXh0ID0gdGV4dDE7XG4gICAgbGV0IHBvc3RwYXRjaF90ZXh0ID0gdGV4dDE7XG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBkaWZmcy5sZW5ndGg7IHgrKykge1xuICAgICAgY29uc3QgZGlmZl90eXBlID0gZGlmZnNbeF1bMF07XG4gICAgICBjb25zdCBkaWZmX3RleHQgPSBkaWZmc1t4XVsxXTtcblxuICAgICAgaWYgKCFwYXRjaERpZmZMZW5ndGggJiYgZGlmZl90eXBlICE9PSBEaWZmT3AuRXF1YWwpIHtcbiAgICAgICAgLy8gQSBuZXcgcGF0Y2ggc3RhcnRzIGhlcmUuXG4gICAgICAgIHBhdGNoLnN0YXJ0MSA9IGNoYXJfY291bnQxO1xuICAgICAgICBwYXRjaC5zdGFydDIgPSBjaGFyX2NvdW50MjtcbiAgICAgIH1cblxuICAgICAgc3dpdGNoIChkaWZmX3R5cGUpIHtcbiAgICAgICAgY2FzZSBEaWZmT3AuSW5zZXJ0OlxuICAgICAgICAgIHBhdGNoLmRpZmZzW3BhdGNoRGlmZkxlbmd0aCsrXSA9IGRpZmZzW3hdO1xuICAgICAgICAgIHBhdGNoLmxlbmd0aDIgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcbiAgICAgICAgICBwb3N0cGF0Y2hfdGV4dCA9IHBvc3RwYXRjaF90ZXh0LnN1YnN0cmluZygwLCBjaGFyX2NvdW50MikgKyBkaWZmX3RleHQgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICBwb3N0cGF0Y2hfdGV4dC5zdWJzdHJpbmcoY2hhcl9jb3VudDIpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIERpZmZPcC5EZWxldGU6XG4gICAgICAgICAgcGF0Y2gubGVuZ3RoMSArPSBkaWZmX3RleHQubGVuZ3RoO1xuICAgICAgICAgIHBhdGNoLmRpZmZzW3BhdGNoRGlmZkxlbmd0aCsrXSA9IGRpZmZzW3hdO1xuICAgICAgICAgIHBvc3RwYXRjaF90ZXh0ID0gcG9zdHBhdGNoX3RleHQuc3Vic3RyaW5nKDAsIGNoYXJfY291bnQyKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBvc3RwYXRjaF90ZXh0LnN1YnN0cmluZyhjaGFyX2NvdW50MiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmX3RleHQubGVuZ3RoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBEaWZmT3AuRXF1YWw6XG4gICAgICAgICAgaWYgKGRpZmZfdGV4dC5sZW5ndGggPD0gMiAqIHRoaXMuUGF0Y2hfTWFyZ2luICYmXG4gICAgICAgICAgICAgIHBhdGNoRGlmZkxlbmd0aCAmJiBkaWZmcy5sZW5ndGggIT0geCArIDEpIHtcbiAgICAgICAgICAgIC8vIFNtYWxsIGVxdWFsaXR5IGluc2lkZSBhIHBhdGNoLlxuICAgICAgICAgICAgcGF0Y2guZGlmZnNbcGF0Y2hEaWZmTGVuZ3RoKytdID0gZGlmZnNbeF07XG4gICAgICAgICAgICBwYXRjaC5sZW5ndGgxICs9IGRpZmZfdGV4dC5sZW5ndGg7XG4gICAgICAgICAgICBwYXRjaC5sZW5ndGgyICs9IGRpZmZfdGV4dC5sZW5ndGg7XG4gICAgICAgICAgfSBlbHNlIGlmIChkaWZmX3RleHQubGVuZ3RoID49IDIgKiB0aGlzLlBhdGNoX01hcmdpbikge1xuICAgICAgICAgICAgLy8gVGltZSBmb3IgYSBuZXcgcGF0Y2guXG4gICAgICAgICAgICBpZiAocGF0Y2hEaWZmTGVuZ3RoKSB7XG4gICAgICAgICAgICAgIHRoaXMucGF0Y2hfYWRkQ29udGV4dF8ocGF0Y2gsIHByZXBhdGNoX3RleHQpO1xuICAgICAgICAgICAgICBwYXRjaGVzLnB1c2gocGF0Y2gpO1xuICAgICAgICAgICAgICBwYXRjaCA9IG5ldyBwYXRjaF9vYmooKTtcbiAgICAgICAgICAgICAgcGF0Y2hEaWZmTGVuZ3RoID0gMDtcbiAgICAgICAgICAgICAgLy8gVW5saWtlIFVuaWRpZmYsIG91ciBwYXRjaCBsaXN0cyBoYXZlIGEgcm9sbGluZyBjb250ZXh0LlxuICAgICAgICAgICAgICAvLyBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZ29vZ2xlLWRpZmYtbWF0Y2gtcGF0Y2gvd2lraS9VbmlkaWZmXG4gICAgICAgICAgICAgIC8vIFVwZGF0ZSBwcmVwYXRjaCB0ZXh0ICYgcG9zIHRvIHJlZmxlY3QgdGhlIGFwcGxpY2F0aW9uIG9mIHRoZVxuICAgICAgICAgICAgICAvLyBqdXN0IGNvbXBsZXRlZCBwYXRjaC5cbiAgICAgICAgICAgICAgcHJlcGF0Y2hfdGV4dCA9IHBvc3RwYXRjaF90ZXh0O1xuICAgICAgICAgICAgICBjaGFyX2NvdW50MSA9IGNoYXJfY291bnQyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgLy8gVXBkYXRlIHRoZSBjdXJyZW50IGNoYXJhY3RlciBjb3VudC5cbiAgICAgIGlmIChkaWZmX3R5cGUgIT09IERpZmZPcC5JbnNlcnQpIHtcbiAgICAgICAgY2hhcl9jb3VudDEgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGlmIChkaWZmX3R5cGUgIT09IERpZmZPcC5EZWxldGUpIHtcbiAgICAgICAgY2hhcl9jb3VudDIgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gUGljayB1cCB0aGUgbGVmdG92ZXIgcGF0Y2ggaWYgbm90IGVtcHR5LlxuICAgIGlmIChwYXRjaERpZmZMZW5ndGgpIHtcbiAgICAgIHRoaXMucGF0Y2hfYWRkQ29udGV4dF8ocGF0Y2gsIHByZXBhdGNoX3RleHQpO1xuICAgICAgcGF0Y2hlcy5wdXNoKHBhdGNoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcGF0Y2hlcztcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBHaXZlbiBhbiBhcnJheSBvZiBwYXRjaGVzLCByZXR1cm4gYW5vdGhlciBhcnJheSB0aGF0IGlzIGlkZW50aWNhbC5cbiAgICogQHBhcmFtICBwYXRjaGVzIEFycmF5IG9mIFBhdGNoIG9iamVjdHMuXG4gICAqIEByZXR1cm4gIEFycmF5IG9mIFBhdGNoIG9iamVjdHMuXG4gICAqL1xuICAgIHBhdGNoX2RlZXBDb3B5IChwYXRjaGVzOiBBcnJheTxwYXRjaF9vYmo+KTogQXJyYXk8cGF0Y2hfb2JqPiB7XG4gICAgLy8gTWFraW5nIGRlZXAgY29waWVzIGlzIGhhcmQgaW4gSmF2YVNjcmlwdC5cbiAgICBjb25zdCBwYXRjaGVzQ29weSA9IFtdO1xuICAgIGZvciAobGV0IHggPSAwOyB4IDwgcGF0Y2hlcy5sZW5ndGg7IHgrKykge1xuICAgICAgY29uc3QgcGF0Y2ggPSBwYXRjaGVzW3hdO1xuICAgICAgY29uc3QgcGF0Y2hDb3B5ID0gbmV3IHBhdGNoX29iaigpO1xuICAgICAgcGF0Y2hDb3B5LmRpZmZzID0gW107XG4gICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IHBhdGNoLmRpZmZzLmxlbmd0aDsgeSsrKSB7XG4gICAgICAgIHBhdGNoQ29weS5kaWZmc1t5XSA9IFtwYXRjaC5kaWZmc1t5XVswXSwgcGF0Y2guZGlmZnNbeV1bMV1dO1xuICAgICAgfVxuICAgICAgcGF0Y2hDb3B5LnN0YXJ0MSA9IHBhdGNoLnN0YXJ0MTtcbiAgICAgIHBhdGNoQ29weS5zdGFydDIgPSBwYXRjaC5zdGFydDI7XG4gICAgICBwYXRjaENvcHkubGVuZ3RoMSA9IHBhdGNoLmxlbmd0aDE7XG4gICAgICBwYXRjaENvcHkubGVuZ3RoMiA9IHBhdGNoLmxlbmd0aDI7XG4gICAgICBwYXRjaGVzQ29weVt4XSA9IHBhdGNoQ29weTtcbiAgICB9XG4gICAgcmV0dXJuIHBhdGNoZXNDb3B5O1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIE1lcmdlIGEgc2V0IG9mIHBhdGNoZXMgb250byB0aGUgdGV4dC4gIFJldHVybiBhIHBhdGNoZWQgdGV4dCwgYXMgd2VsbFxuICAgKiBhcyBhIGxpc3Qgb2YgdHJ1ZS9mYWxzZSB2YWx1ZXMgaW5kaWNhdGluZyB3aGljaCBwYXRjaGVzIHdlcmUgYXBwbGllZC5cbiAgICogQHBhcmFtICBwYXRjaGVzIEFycmF5IG9mIFBhdGNoIG9iamVjdHMuXG4gICAqIEBwYXJhbSAgdGV4dCBPbGQgdGV4dC5cbiAgICogQHJldHVybiAgVHdvIGVsZW1lbnQgQXJyYXksIGNvbnRhaW5pbmcgdGhlXG4gICAqICAgICAgbmV3IHRleHQgYW5kIGFuIGFycmF5IG9mIGJvb2xlYW4gdmFsdWVzLlxuICAgKi9cbiAgICBwYXRjaF9hcHBseSAocGF0Y2hlczogQXJyYXk8cGF0Y2hfb2JqPiwgdGV4dDogc3RyaW5nKSB7XG4gICAgaWYgKHBhdGNoZXMubGVuZ3RoID09IDApIHtcbiAgICAgIHJldHVybiBbdGV4dCwgW11dO1xuICAgIH1cblxuICAgIC8vIERlZXAgY29weSB0aGUgcGF0Y2hlcyBzbyB0aGF0IG5vIGNoYW5nZXMgYXJlIG1hZGUgdG8gb3JpZ2luYWxzLlxuICAgIHBhdGNoZXMgPSB0aGlzLnBhdGNoX2RlZXBDb3B5KHBhdGNoZXMpO1xuXG4gICAgY29uc3QgbnVsbFBhZGRpbmcgPSB0aGlzLnBhdGNoX2FkZFBhZGRpbmcocGF0Y2hlcyk7XG4gICAgdGV4dCA9IG51bGxQYWRkaW5nICsgdGV4dCArIG51bGxQYWRkaW5nO1xuXG4gICAgdGhpcy5wYXRjaF9zcGxpdE1heChwYXRjaGVzKTtcbiAgICAvLyBkZWx0YSBrZWVwcyB0cmFjayBvZiB0aGUgb2Zmc2V0IGJldHdlZW4gdGhlIGV4cGVjdGVkIGFuZCBhY3R1YWwgbG9jYXRpb25cbiAgICAvLyBvZiB0aGUgcHJldmlvdXMgcGF0Y2guICBJZiB0aGVyZSBhcmUgcGF0Y2hlcyBleHBlY3RlZCBhdCBwb3NpdGlvbnMgMTAgYW5kXG4gICAgLy8gMjAsIGJ1dCB0aGUgZmlyc3QgcGF0Y2ggd2FzIGZvdW5kIGF0IDEyLCBkZWx0YSBpcyAyIGFuZCB0aGUgc2Vjb25kIHBhdGNoXG4gICAgLy8gaGFzIGFuIGVmZmVjdGl2ZSBleHBlY3RlZCBwb3NpdGlvbiBvZiAyMi5cbiAgICBsZXQgZGVsdGEgPSAwO1xuICAgIGNvbnN0IHJlc3VsdHMgPSBbXTtcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHBhdGNoZXMubGVuZ3RoOyB4KyspIHtcbiAgICAgIGNvbnN0IGV4cGVjdGVkX2xvYyA9IHBhdGNoZXNbeF0uc3RhcnQyICsgZGVsdGE7XG4gICAgICBjb25zdCB0ZXh0MSA9IHRoaXMuZGlmZl90ZXh0MShwYXRjaGVzW3hdLmRpZmZzKTtcbiAgICAgIGxldCBzdGFydF9sb2M7XG4gICAgICBsZXQgZW5kX2xvYyA9IC0xO1xuICAgICAgaWYgKHRleHQxLmxlbmd0aCA+IHRoaXMuTWF0Y2hfTWF4Qml0cykge1xuICAgICAgICAvLyBwYXRjaF9zcGxpdE1heCB3aWxsIG9ubHkgcHJvdmlkZSBhbiBvdmVyc2l6ZWQgcGF0dGVybiBpbiB0aGUgY2FzZSBvZlxuICAgICAgICAvLyBhIG1vbnN0ZXIgZGVsZXRlLlxuICAgICAgICBzdGFydF9sb2MgPSB0aGlzLm1hdGNoX21haW4odGV4dCwgdGV4dDEuc3Vic3RyaW5nKDAsIHRoaXMuTWF0Y2hfTWF4Qml0cyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBlY3RlZF9sb2MpO1xuICAgICAgICBpZiAoc3RhcnRfbG9jICE9IC0xKSB7XG4gICAgICAgICAgZW5kX2xvYyA9IHRoaXMubWF0Y2hfbWFpbih0ZXh0LFxuICAgICAgICAgICAgICB0ZXh0MS5zdWJzdHJpbmcodGV4dDEubGVuZ3RoIC0gdGhpcy5NYXRjaF9NYXhCaXRzKSxcbiAgICAgICAgICAgICAgZXhwZWN0ZWRfbG9jICsgdGV4dDEubGVuZ3RoIC0gdGhpcy5NYXRjaF9NYXhCaXRzKTtcbiAgICAgICAgICBpZiAoZW5kX2xvYyA9PSAtMSB8fCBzdGFydF9sb2MgPj0gZW5kX2xvYykge1xuICAgICAgICAgICAgLy8gQ2FuJ3QgZmluZCB2YWxpZCB0cmFpbGluZyBjb250ZXh0LiAgRHJvcCB0aGlzIHBhdGNoLlxuICAgICAgICAgICAgc3RhcnRfbG9jID0gLTE7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGFydF9sb2MgPSB0aGlzLm1hdGNoX21haW4odGV4dCwgdGV4dDEsIGV4cGVjdGVkX2xvYyk7XG4gICAgICB9XG4gICAgICBpZiAoc3RhcnRfbG9jID09IC0xKSB7XG4gICAgICAgIC8vIE5vIG1hdGNoIGZvdW5kLiAgOihcbiAgICAgICAgcmVzdWx0c1t4XSA9IGZhbHNlO1xuICAgICAgICAvLyBTdWJ0cmFjdCB0aGUgZGVsdGEgZm9yIHRoaXMgZmFpbGVkIHBhdGNoIGZyb20gc3Vic2VxdWVudCBwYXRjaGVzLlxuICAgICAgICBkZWx0YSAtPSBwYXRjaGVzW3hdLmxlbmd0aDIgLSBwYXRjaGVzW3hdLmxlbmd0aDE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBGb3VuZCBhIG1hdGNoLiAgOilcbiAgICAgICAgcmVzdWx0c1t4XSA9IHRydWU7XG4gICAgICAgIGRlbHRhID0gc3RhcnRfbG9jIC0gZXhwZWN0ZWRfbG9jO1xuICAgICAgICBsZXQgdGV4dDI7XG4gICAgICAgIGlmIChlbmRfbG9jID09IC0xKSB7XG4gICAgICAgICAgdGV4dDIgPSB0ZXh0LnN1YnN0cmluZyhzdGFydF9sb2MsIHN0YXJ0X2xvYyArIHRleHQxLmxlbmd0aCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGV4dDIgPSB0ZXh0LnN1YnN0cmluZyhzdGFydF9sb2MsIGVuZF9sb2MgKyB0aGlzLk1hdGNoX01heEJpdHMpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0ZXh0MSA9PSB0ZXh0Mikge1xuICAgICAgICAgIC8vIFBlcmZlY3QgbWF0Y2gsIGp1c3Qgc2hvdmUgdGhlIHJlcGxhY2VtZW50IHRleHQgaW4uXG4gICAgICAgICAgdGV4dCA9IHRleHQuc3Vic3RyaW5nKDAsIHN0YXJ0X2xvYykgK1xuICAgICAgICAgICAgICAgIHRoaXMuZGlmZl90ZXh0MihwYXRjaGVzW3hdLmRpZmZzKSArXG4gICAgICAgICAgICAgICAgdGV4dC5zdWJzdHJpbmcoc3RhcnRfbG9jICsgdGV4dDEubGVuZ3RoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBJbXBlcmZlY3QgbWF0Y2guICBSdW4gYSBkaWZmIHRvIGdldCBhIGZyYW1ld29yayBvZiBlcXVpdmFsZW50XG4gICAgICAgICAgLy8gaW5kaWNlcy5cbiAgICAgICAgICBjb25zdCBkaWZmcyA9IHRoaXMuZGlmZl9tYWluKHRleHQxLCB0ZXh0MiwgZmFsc2UpO1xuICAgICAgICAgIGlmICh0ZXh0MS5sZW5ndGggPiB0aGlzLk1hdGNoX01heEJpdHMgJiZcbiAgICAgICAgICAgICAgdGhpcy5kaWZmX2xldmVuc2h0ZWluKGRpZmZzKSAvIHRleHQxLmxlbmd0aCA+XG4gICAgICAgICAgICAgIHRoaXMuUGF0Y2hfRGVsZXRlVGhyZXNob2xkKSB7XG4gICAgICAgICAgICAvLyBUaGUgZW5kIHBvaW50cyBtYXRjaCwgYnV0IHRoZSBjb250ZW50IGlzIHVuYWNjZXB0YWJseSBiYWQuXG4gICAgICAgICAgICByZXN1bHRzW3hdID0gZmFsc2U7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZGlmZl9jbGVhbnVwU2VtYW50aWNMb3NzbGVzcyhkaWZmcyk7XG4gICAgICAgICAgICBsZXQgaW5kZXgxID0gMDtcbiAgICAgICAgICAgIGxldCBpbmRleDI7XG4gICAgICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IHBhdGNoZXNbeF0uZGlmZnMubGVuZ3RoOyB5KyspIHtcbiAgICAgICAgICAgICAgY29uc3QgbW9kID0gcGF0Y2hlc1t4XS5kaWZmc1t5XTtcbiAgICAgICAgICAgICAgaWYgKG1vZFswXSAhPT0gRGlmZk9wLkVxdWFsKSB7XG4gICAgICAgICAgICAgICAgaW5kZXgyID0gdGhpcy5kaWZmX3hJbmRleChkaWZmcywgaW5kZXgxKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAobW9kWzBdID09PSBEaWZmT3AuSW5zZXJ0KSB7ICAvLyBJbnNlcnRpb25cbiAgICAgICAgICAgICAgICB0ZXh0ID0gdGV4dC5zdWJzdHJpbmcoMCwgc3RhcnRfbG9jICsgaW5kZXgyKSArIG1vZFsxXSArXG4gICAgICAgICAgICAgICAgICAgICAgdGV4dC5zdWJzdHJpbmcoc3RhcnRfbG9jICsgaW5kZXgyKTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChtb2RbMF0gPT09IERpZmZPcC5EZWxldGUpIHsgIC8vIERlbGV0aW9uXG4gICAgICAgICAgICAgICAgdGV4dCA9IHRleHQuc3Vic3RyaW5nKDAsIHN0YXJ0X2xvYyArIGluZGV4MikgK1xuICAgICAgICAgICAgICAgICAgICAgIHRleHQuc3Vic3RyaW5nKHN0YXJ0X2xvYyArIHRoaXMuZGlmZl94SW5kZXgoZGlmZnMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4MSArIG1vZFsxXS5sZW5ndGgpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAobW9kWzBdICE9PSBEaWZmT3AuRGVsZXRlKSB7XG4gICAgICAgICAgICAgICAgaW5kZXgxICs9IG1vZFsxXS5sZW5ndGg7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gU3RyaXAgdGhlIHBhZGRpbmcgb2ZmLlxuICAgIHRleHQgPSB0ZXh0LnN1YnN0cmluZyhudWxsUGFkZGluZy5sZW5ndGgsIHRleHQubGVuZ3RoIC0gbnVsbFBhZGRpbmcubGVuZ3RoKTtcbiAgICByZXR1cm4gW3RleHQsIHJlc3VsdHNdO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIEFkZCBzb21lIHBhZGRpbmcgb24gdGV4dCBzdGFydCBhbmQgZW5kIHNvIHRoYXQgZWRnZXMgY2FuIG1hdGNoIHNvbWV0aGluZy5cbiAgICogSW50ZW5kZWQgdG8gYmUgY2FsbGVkIG9ubHkgZnJvbSB3aXRoaW4gcGF0Y2hfYXBwbHkuXG4gICAqIEBwYXJhbSAgcGF0Y2hlcyBBcnJheSBvZiBQYXRjaCBvYmplY3RzLlxuICAgKiBAcmV0dXJuICBUaGUgcGFkZGluZyBzdHJpbmcgYWRkZWQgdG8gZWFjaCBzaWRlLlxuICAgKi9cbiAgICBwYXRjaF9hZGRQYWRkaW5nIChwYXRjaGVzOiBBcnJheTxwYXRjaF9vYmo+KSB7XG4gICAgY29uc3QgcGFkZGluZ0xlbmd0aCA9IHRoaXMuUGF0Y2hfTWFyZ2luO1xuICAgIGxldCBudWxsUGFkZGluZyA9ICcnO1xuICAgIGZvciAobGV0IHggPSAxOyB4IDw9IHBhZGRpbmdMZW5ndGg7IHgrKykge1xuICAgICAgbnVsbFBhZGRpbmcgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSh4KTtcbiAgICB9XG5cbiAgICAvLyBCdW1wIGFsbCB0aGUgcGF0Y2hlcyBmb3J3YXJkLlxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgcGF0Y2hlcy5sZW5ndGg7IHgrKykge1xuICAgICAgcGF0Y2hlc1t4XS5zdGFydDEgKz0gcGFkZGluZ0xlbmd0aDtcbiAgICAgIHBhdGNoZXNbeF0uc3RhcnQyICs9IHBhZGRpbmdMZW5ndGg7XG4gICAgfVxuXG4gICAgLy8gQWRkIHNvbWUgcGFkZGluZyBvbiBzdGFydCBvZiBmaXJzdCBkaWZmLlxuICAgIGxldCBwYXRjaCA9IHBhdGNoZXNbMF07XG4gICAgbGV0IGRpZmZzID0gcGF0Y2guZGlmZnM7XG4gICAgaWYgKGRpZmZzLmxlbmd0aCA9PSAwIHx8IGRpZmZzWzBdWzBdICE9IERpZmZPcC5FcXVhbCkge1xuICAgICAgLy8gQWRkIG51bGxQYWRkaW5nIGVxdWFsaXR5LlxuICAgICAgZGlmZnMudW5zaGlmdChbRGlmZk9wLkVxdWFsLCBudWxsUGFkZGluZ10pO1xuICAgICAgcGF0Y2guc3RhcnQxIC09IHBhZGRpbmdMZW5ndGg7ICAvLyBTaG91bGQgYmUgMC5cbiAgICAgIHBhdGNoLnN0YXJ0MiAtPSBwYWRkaW5nTGVuZ3RoOyAgLy8gU2hvdWxkIGJlIDAuXG4gICAgICBwYXRjaC5sZW5ndGgxICs9IHBhZGRpbmdMZW5ndGg7XG4gICAgICBwYXRjaC5sZW5ndGgyICs9IHBhZGRpbmdMZW5ndGg7XG4gICAgfSBlbHNlIGlmIChwYWRkaW5nTGVuZ3RoID4gZGlmZnNbMF1bMV0ubGVuZ3RoKSB7XG4gICAgICAvLyBHcm93IGZpcnN0IGVxdWFsaXR5LlxuICAgICAgY29uc3QgZXh0cmFMZW5ndGggPSBwYWRkaW5nTGVuZ3RoIC0gZGlmZnNbMF1bMV0ubGVuZ3RoO1xuICAgICAgZGlmZnNbMF1bMV0gPSBudWxsUGFkZGluZy5zdWJzdHJpbmcoZGlmZnNbMF1bMV0ubGVuZ3RoKSArIGRpZmZzWzBdWzFdO1xuICAgICAgcGF0Y2guc3RhcnQxIC09IGV4dHJhTGVuZ3RoO1xuICAgICAgcGF0Y2guc3RhcnQyIC09IGV4dHJhTGVuZ3RoO1xuICAgICAgcGF0Y2gubGVuZ3RoMSArPSBleHRyYUxlbmd0aDtcbiAgICAgIHBhdGNoLmxlbmd0aDIgKz0gZXh0cmFMZW5ndGg7XG4gICAgfVxuXG4gICAgLy8gQWRkIHNvbWUgcGFkZGluZyBvbiBlbmQgb2YgbGFzdCBkaWZmLlxuICAgIHBhdGNoID0gcGF0Y2hlc1twYXRjaGVzLmxlbmd0aCAtIDFdO1xuICAgIGRpZmZzID0gcGF0Y2guZGlmZnM7XG4gICAgaWYgKGRpZmZzLmxlbmd0aCA9PSAwIHx8IGRpZmZzW2RpZmZzLmxlbmd0aCAtIDFdWzBdICE9IERpZmZPcC5FcXVhbCkge1xuICAgICAgLy8gQWRkIG51bGxQYWRkaW5nIGVxdWFsaXR5LlxuICAgICAgZGlmZnMucHVzaChbRGlmZk9wLkVxdWFsLCBudWxsUGFkZGluZ10pO1xuICAgICAgcGF0Y2gubGVuZ3RoMSArPSBwYWRkaW5nTGVuZ3RoO1xuICAgICAgcGF0Y2gubGVuZ3RoMiArPSBwYWRkaW5nTGVuZ3RoO1xuICAgIH0gZWxzZSBpZiAocGFkZGluZ0xlbmd0aCA+IGRpZmZzW2RpZmZzLmxlbmd0aCAtIDFdWzFdLmxlbmd0aCkge1xuICAgICAgLy8gR3JvdyBsYXN0IGVxdWFsaXR5LlxuICAgICAgY29uc3QgZXh0cmFMZW5ndGggPSBwYWRkaW5nTGVuZ3RoIC0gZGlmZnNbZGlmZnMubGVuZ3RoIC0gMV1bMV0ubGVuZ3RoO1xuICAgICAgZGlmZnNbZGlmZnMubGVuZ3RoIC0gMV1bMV0gKz0gbnVsbFBhZGRpbmcuc3Vic3RyaW5nKDAsIGV4dHJhTGVuZ3RoKTtcbiAgICAgIHBhdGNoLmxlbmd0aDEgKz0gZXh0cmFMZW5ndGg7XG4gICAgICBwYXRjaC5sZW5ndGgyICs9IGV4dHJhTGVuZ3RoO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsUGFkZGluZztcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBMb29rIHRocm91Z2ggdGhlIHBhdGNoZXMgYW5kIGJyZWFrIHVwIGFueSB3aGljaCBhcmUgbG9uZ2VyIHRoYW4gdGhlIG1heGltdW1cbiAgICogbGltaXQgb2YgdGhlIG1hdGNoIGFsZ29yaXRobS5cbiAgICogSW50ZW5kZWQgdG8gYmUgY2FsbGVkIG9ubHkgZnJvbSB3aXRoaW4gcGF0Y2hfYXBwbHkuXG4gICAqIEBwYXJhbSAgcGF0Y2hlcyBBcnJheSBvZiBQYXRjaCBvYmplY3RzLlxuICAgKi9cbiAgICBwYXRjaF9zcGxpdE1heCA9IGZ1bmN0aW9uKHBhdGNoZXM6IEFycmF5PHBhdGNoX29iaj4pIHtcbiAgICBjb25zdCBwYXRjaF9zaXplID0gdGhpcy5NYXRjaF9NYXhCaXRzO1xuICAgIGZvciAobGV0IHggPSAwOyB4IDwgcGF0Y2hlcy5sZW5ndGg7IHgrKykge1xuICAgICAgaWYgKHBhdGNoZXNbeF0ubGVuZ3RoMSA8PSBwYXRjaF9zaXplKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgYmlncGF0Y2ggPSBwYXRjaGVzW3hdO1xuICAgICAgLy8gUmVtb3ZlIHRoZSBiaWcgb2xkIHBhdGNoLlxuICAgICAgcGF0Y2hlcy5zcGxpY2UoeC0tLCAxKTtcbiAgICAgIGxldCBzdGFydDEgPSBiaWdwYXRjaC5zdGFydDE7XG4gICAgICBsZXQgc3RhcnQyID0gYmlncGF0Y2guc3RhcnQyO1xuICAgICAgbGV0IHByZWNvbnRleHQgPSAnJztcbiAgICAgIHdoaWxlIChiaWdwYXRjaC5kaWZmcy5sZW5ndGggIT09IDApIHtcbiAgICAgICAgLy8gQ3JlYXRlIG9uZSBvZiBzZXZlcmFsIHNtYWxsZXIgcGF0Y2hlcy5cbiAgICAgICAgY29uc3QgcGF0Y2ggPSBuZXcgcGF0Y2hfb2JqKCk7XG4gICAgICAgIGxldCBlbXB0eSA9IHRydWU7XG4gICAgICAgIHBhdGNoLnN0YXJ0MSA9IHN0YXJ0MSAtIHByZWNvbnRleHQubGVuZ3RoO1xuICAgICAgICBwYXRjaC5zdGFydDIgPSBzdGFydDIgLSBwcmVjb250ZXh0Lmxlbmd0aDtcbiAgICAgICAgaWYgKHByZWNvbnRleHQgIT09ICcnKSB7XG4gICAgICAgICAgcGF0Y2gubGVuZ3RoMSA9IHBhdGNoLmxlbmd0aDIgPSBwcmVjb250ZXh0Lmxlbmd0aDtcbiAgICAgICAgICBwYXRjaC5kaWZmcy5wdXNoKFtEaWZmT3AuRXF1YWwsIHByZWNvbnRleHRdKTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoYmlncGF0Y2guZGlmZnMubGVuZ3RoICE9PSAwICYmXG4gICAgICAgICAgICAgIHBhdGNoLmxlbmd0aDEgPCBwYXRjaF9zaXplIC0gdGhpcy5QYXRjaF9NYXJnaW4pIHtcbiAgICAgICAgICBjb25zdCBkaWZmX3R5cGUgPSBiaWdwYXRjaC5kaWZmc1swXVswXTtcbiAgICAgICAgICBsZXQgZGlmZl90ZXh0ID0gYmlncGF0Y2guZGlmZnNbMF1bMV07XG4gICAgICAgICAgaWYgKGRpZmZfdHlwZSA9PT0gRGlmZk9wLkluc2VydCkge1xuICAgICAgICAgICAgLy8gSW5zZXJ0aW9ucyBhcmUgaGFybWxlc3MuXG4gICAgICAgICAgICBwYXRjaC5sZW5ndGgyICs9IGRpZmZfdGV4dC5sZW5ndGg7XG4gICAgICAgICAgICBzdGFydDIgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcbiAgICAgICAgICAgIHBhdGNoLmRpZmZzLnB1c2goYmlncGF0Y2guZGlmZnMuc2hpZnQoKSk7XG4gICAgICAgICAgICBlbXB0eSA9IGZhbHNlO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZGlmZl90eXBlID09PSBEaWZmT3AuRGVsZXRlICYmIHBhdGNoLmRpZmZzLmxlbmd0aCA9PSAxICYmXG4gICAgICAgICAgICAgICAgICAgIHBhdGNoLmRpZmZzWzBdWzBdID09IERpZmZPcC5FcXVhbCAmJlxuICAgICAgICAgICAgICAgICAgICBkaWZmX3RleHQubGVuZ3RoID4gMiAqIHBhdGNoX3NpemUpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBsYXJnZSBkZWxldGlvbi4gIExldCBpdCBwYXNzIGluIG9uZSBjaHVuay5cbiAgICAgICAgICAgIHBhdGNoLmxlbmd0aDEgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcbiAgICAgICAgICAgIHN0YXJ0MSArPSBkaWZmX3RleHQubGVuZ3RoO1xuICAgICAgICAgICAgZW1wdHkgPSBmYWxzZTtcbiAgICAgICAgICAgIHBhdGNoLmRpZmZzLnB1c2goW2RpZmZfdHlwZSwgZGlmZl90ZXh0XSk7XG4gICAgICAgICAgICBiaWdwYXRjaC5kaWZmcy5zaGlmdCgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBEZWxldGlvbiBvciBlcXVhbGl0eS4gIE9ubHkgdGFrZSBhcyBtdWNoIGFzIHdlIGNhbiBzdG9tYWNoLlxuICAgICAgICAgICAgZGlmZl90ZXh0ID0gZGlmZl90ZXh0LnN1YnN0cmluZygwLFxuICAgICAgICAgICAgICAgIHBhdGNoX3NpemUgLSBwYXRjaC5sZW5ndGgxIC0gdGhpcy5QYXRjaF9NYXJnaW4pO1xuICAgICAgICAgICAgcGF0Y2gubGVuZ3RoMSArPSBkaWZmX3RleHQubGVuZ3RoO1xuICAgICAgICAgICAgc3RhcnQxICs9IGRpZmZfdGV4dC5sZW5ndGg7XG4gICAgICAgICAgICBpZiAoZGlmZl90eXBlID09PSBEaWZmT3AuRXF1YWwpIHtcbiAgICAgICAgICAgICAgcGF0Y2gubGVuZ3RoMiArPSBkaWZmX3RleHQubGVuZ3RoO1xuICAgICAgICAgICAgICBzdGFydDIgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGVtcHR5ID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYXRjaC5kaWZmcy5wdXNoKFtkaWZmX3R5cGUsIGRpZmZfdGV4dF0pO1xuICAgICAgICAgICAgaWYgKGRpZmZfdGV4dCA9PSBiaWdwYXRjaC5kaWZmc1swXVsxXSkge1xuICAgICAgICAgICAgICBiaWdwYXRjaC5kaWZmcy5zaGlmdCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgYmlncGF0Y2guZGlmZnNbMF1bMV0gPVxuICAgICAgICAgICAgICAgICAgYmlncGF0Y2guZGlmZnNbMF1bMV0uc3Vic3RyaW5nKGRpZmZfdGV4dC5sZW5ndGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBDb21wdXRlIHRoZSBoZWFkIGNvbnRleHQgZm9yIHRoZSBuZXh0IHBhdGNoLlxuICAgICAgICBwcmVjb250ZXh0ID0gdGhpcy5kaWZmX3RleHQyKHBhdGNoLmRpZmZzKTtcbiAgICAgICAgcHJlY29udGV4dCA9XG4gICAgICAgICAgICBwcmVjb250ZXh0LnN1YnN0cmluZyhwcmVjb250ZXh0Lmxlbmd0aCAtIHRoaXMuUGF0Y2hfTWFyZ2luKTtcbiAgICAgICAgLy8gQXBwZW5kIHRoZSBlbmQgY29udGV4dCBmb3IgdGhpcyBwYXRjaC5cbiAgICAgICAgY29uc3QgcG9zdGNvbnRleHQgPSB0aGlzLmRpZmZfdGV4dDEoYmlncGF0Y2guZGlmZnMpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc3Vic3RyaW5nKDAsIHRoaXMuUGF0Y2hfTWFyZ2luKTtcbiAgICAgICAgaWYgKHBvc3Rjb250ZXh0ICE9PSAnJykge1xuICAgICAgICAgIHBhdGNoLmxlbmd0aDEgKz0gcG9zdGNvbnRleHQubGVuZ3RoO1xuICAgICAgICAgIHBhdGNoLmxlbmd0aDIgKz0gcG9zdGNvbnRleHQubGVuZ3RoO1xuICAgICAgICAgIGlmIChwYXRjaC5kaWZmcy5sZW5ndGggIT09IDAgJiZcbiAgICAgICAgICAgICAgcGF0Y2guZGlmZnNbcGF0Y2guZGlmZnMubGVuZ3RoIC0gMV1bMF0gPT09IERpZmZPcC5FcXVhbCkge1xuICAgICAgICAgICAgcGF0Y2guZGlmZnNbcGF0Y2guZGlmZnMubGVuZ3RoIC0gMV1bMV0gKz0gcG9zdGNvbnRleHQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBhdGNoLmRpZmZzLnB1c2goW0RpZmZPcC5FcXVhbCwgcG9zdGNvbnRleHRdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFlbXB0eSkge1xuICAgICAgICAgIHBhdGNoZXMuc3BsaWNlKCsreCwgMCwgcGF0Y2gpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG5cbiAgLyoqXG4gICAqIFRha2UgYSBsaXN0IG9mIHBhdGNoZXMgYW5kIHJldHVybiBhIHRleHR1YWwgcmVwcmVzZW50YXRpb24uXG4gICAqIEBwYXJhbSAgcGF0Y2hlcyBBcnJheSBvZiBQYXRjaCBvYmplY3RzLlxuICAgKiBAcmV0dXJuICBUZXh0IHJlcHJlc2VudGF0aW9uIG9mIHBhdGNoZXMuXG4gICAqL1xuICAgIHBhdGNoX3RvVGV4dCAocGF0Y2hlczogQXJyYXk8cGF0Y2hfb2JqPikge1xuICAgIGNvbnN0IHRleHQgPSBbXTtcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHBhdGNoZXMubGVuZ3RoOyB4KyspIHtcbiAgICAgIHRleHRbeF0gPSBwYXRjaGVzW3hdO1xuICAgIH1cbiAgICByZXR1cm4gdGV4dC5qb2luKCcnKTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBQYXJzZSBhIHRleHR1YWwgcmVwcmVzZW50YXRpb24gb2YgcGF0Y2hlcyBhbmQgcmV0dXJuIGEgbGlzdCBvZiBQYXRjaCBvYmplY3RzLlxuICAgKiBAcGFyYW0gIHRleHRsaW5lIFRleHQgcmVwcmVzZW50YXRpb24gb2YgcGF0Y2hlcy5cbiAgICogQHJldHVybiAgQXJyYXkgb2YgUGF0Y2ggb2JqZWN0cy5cbiAgICogQHRocm93cyB7IUVycm9yfSBJZiBpbnZhbGlkIGlucHV0LlxuICAgKi9cbiAgICBwYXRjaF9mcm9tVGV4dCAodGV4dGxpbmU6IHN0cmluZyk6IEFycmF5PHBhdGNoX29iaj4ge1xuICAgIGNvbnN0IHBhdGNoZXM6IEFycmF5PHBhdGNoX29iaj4gPSBbXTtcbiAgICBpZiAoIXRleHRsaW5lKSB7XG4gICAgICByZXR1cm4gcGF0Y2hlcztcbiAgICB9XG4gICAgY29uc3QgdGV4dCA9IHRleHRsaW5lLnNwbGl0KCdcXG4nKTtcbiAgICBsZXQgdGV4dFBvaW50ZXIgPSAwO1xuICAgIGNvbnN0IHBhdGNoSGVhZGVyID0gL15AQCAtKFxcZCspLD8oXFxkKikgXFwrKFxcZCspLD8oXFxkKikgQEAkLztcbiAgICB3aGlsZSAodGV4dFBvaW50ZXIgPCB0ZXh0Lmxlbmd0aCkge1xuICAgICAgY29uc3QgbSA9IHRleHRbdGV4dFBvaW50ZXJdLm1hdGNoKHBhdGNoSGVhZGVyKTtcbiAgICAgIGlmICghbSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcGF0Y2ggc3RyaW5nOiAnICsgdGV4dFt0ZXh0UG9pbnRlcl0pO1xuICAgICAgfVxuICAgICAgY29uc3QgcGF0Y2ggPSBuZXcgcGF0Y2hfb2JqKCk7XG4gICAgICBwYXRjaGVzLnB1c2gocGF0Y2gpO1xuICAgICAgcGF0Y2guc3RhcnQxID0gcGFyc2VJbnQobVsxXSwgMTApO1xuICAgICAgaWYgKG1bMl0gPT09ICcnKSB7XG4gICAgICAgIHBhdGNoLnN0YXJ0MS0tO1xuICAgICAgICBwYXRjaC5sZW5ndGgxID0gMTtcbiAgICAgIH0gZWxzZSBpZiAobVsyXSA9PSAnMCcpIHtcbiAgICAgICAgcGF0Y2gubGVuZ3RoMSA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXRjaC5zdGFydDEtLTtcbiAgICAgICAgcGF0Y2gubGVuZ3RoMSA9IHBhcnNlSW50KG1bMl0sIDEwKTtcbiAgICAgIH1cblxuICAgICAgcGF0Y2guc3RhcnQyID0gcGFyc2VJbnQobVszXSwgMTApO1xuICAgICAgaWYgKG1bNF0gPT09ICcnKSB7XG4gICAgICAgIHBhdGNoLnN0YXJ0Mi0tO1xuICAgICAgICBwYXRjaC5sZW5ndGgyID0gMTtcbiAgICAgIH0gZWxzZSBpZiAobVs0XSA9PSAnMCcpIHtcbiAgICAgICAgcGF0Y2gubGVuZ3RoMiA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXRjaC5zdGFydDItLTtcbiAgICAgICAgcGF0Y2gubGVuZ3RoMiA9IHBhcnNlSW50KG1bNF0sIDEwKTtcbiAgICAgIH1cbiAgICAgIHRleHRQb2ludGVyKys7XG5cbiAgICAgIHdoaWxlICh0ZXh0UG9pbnRlciA8IHRleHQubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IHNpZ24gPSB0ZXh0W3RleHRQb2ludGVyXS5jaGFyQXQoMCk7XG4gICAgICAgIGxldCBsaW5lOiBzdHJpbmc7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgbGluZSA9IGRlY29kZVVSSSh0ZXh0W3RleHRQb2ludGVyXS5zdWJzdHJpbmcoMSkpO1xuICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgIC8vIE1hbGZvcm1lZCBVUkkgc2VxdWVuY2UuXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbGxlZ2FsIGVzY2FwZSBpbiBwYXRjaF9mcm9tVGV4dDogJyArIGxpbmUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzaWduID09ICctJykge1xuICAgICAgICAgIC8vIERlbGV0aW9uLlxuICAgICAgICAgIHBhdGNoLmRpZmZzLnB1c2goW0RpZmZPcC5EZWxldGUsIGxpbmVdKTtcbiAgICAgICAgfSBlbHNlIGlmIChzaWduID09ICcrJykge1xuICAgICAgICAgIC8vIEluc2VydGlvbi5cbiAgICAgICAgICBwYXRjaC5kaWZmcy5wdXNoKFtEaWZmT3AuSW5zZXJ0LCBsaW5lXSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2lnbiA9PSAnICcpIHtcbiAgICAgICAgICAvLyBNaW5vciBlcXVhbGl0eS5cbiAgICAgICAgICBwYXRjaC5kaWZmcy5wdXNoKFtEaWZmT3AuRXF1YWwsIGxpbmVdKTtcbiAgICAgICAgfSBlbHNlIGlmIChzaWduID09ICdAJykge1xuICAgICAgICAgIC8vIFN0YXJ0IG9mIG5leHQgcGF0Y2guXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH0gZWxzZSBpZiAoc2lnbiA9PT0gJycpIHtcbiAgICAgICAgICAvLyBCbGFuayBsaW5lPyAgV2hhdGV2ZXIuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gV1RGP1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwYXRjaCBtb2RlIFwiJyArIHNpZ24gKyAnXCIgaW46ICcgKyBsaW5lKTtcbiAgICAgICAgfVxuICAgICAgICB0ZXh0UG9pbnRlcisrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGF0Y2hlcztcbiAgfTtcblxufVxuXG5cbi8qKlxuICogQ2xhc3MgcmVwcmVzZW50aW5nIG9uZSBwYXRjaCBvcGVyYXRpb24uXG5cbiAqL1xuZXhwb3J0IGNsYXNzIHBhdGNoX29iaiB7XG5cbiAgY29uc3RydWN0b3IoKSB7ICB9XG5cbiAgZGlmZnM6IEFycmF5PERpZmY+ID0gW107XG4gIHN0YXJ0MTogbnVtYmVyID0gbnVsbDtcbiAgc3RhcnQyOiBudW1iZXIgPSBudWxsO1xuICBsZW5ndGgxOiBudW1iZXIgPSAwO1xuICBsZW5ndGgyOiBudW1iZXIgPSAwO1xuXG4gIC8qKlxuICAgKiBFbW11bGF0ZSBHTlUgZGlmZidzIGZvcm1hdC5cbiAgICogSGVhZGVyOiBAQCAtMzgyLDggKzQ4MSw5IEBAXG4gICAqIEluZGljaWVzIGFyZSBwcmludGVkIGFzIDEtYmFzZWQsIG5vdCAwLWJhc2VkLlxuICAgKi9cbiAgdG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICBsZXQgY29vcmRzMSwgY29vcmRzMjtcbiAgICBpZiAodGhpcy5sZW5ndGgxID09PSAwKSB7XG4gICAgICBjb29yZHMxID0gdGhpcy5zdGFydDEgKyAnLDAnO1xuICAgIH0gZWxzZSBpZiAodGhpcy5sZW5ndGgxID09IDEpIHtcbiAgICAgIGNvb3JkczEgPSB0aGlzLnN0YXJ0MSArIDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvb3JkczEgPSAodGhpcy5zdGFydDEgKyAxKSArICcsJyArIHRoaXMubGVuZ3RoMTtcbiAgICB9XG4gICAgaWYgKHRoaXMubGVuZ3RoMiA9PT0gMCkge1xuICAgICAgY29vcmRzMiA9IHRoaXMuc3RhcnQyICsgJywwJztcbiAgICB9IGVsc2UgaWYgKHRoaXMubGVuZ3RoMiA9PSAxKSB7XG4gICAgICBjb29yZHMyID0gdGhpcy5zdGFydDIgKyAxO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb29yZHMyID0gKHRoaXMuc3RhcnQyICsgMSkgKyAnLCcgKyB0aGlzLmxlbmd0aDI7XG4gICAgfVxuICAgIGNvbnN0IHRleHQgPSBbJ0BAIC0nICsgY29vcmRzMSArICcgKycgKyBjb29yZHMyICsgJyBAQFxcbiddO1xuICAgIGxldCBvcDtcbiAgICAvLyBFc2NhcGUgdGhlIGJvZHkgb2YgdGhlIHBhdGNoIHdpdGggJXh4IG5vdGF0aW9uLlxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgdGhpcy5kaWZmcy5sZW5ndGg7IHgrKykge1xuICAgICAgc3dpdGNoICh0aGlzLmRpZmZzW3hdWzBdKSB7XG4gICAgICAgIGNhc2UgRGlmZk9wLkluc2VydDpcbiAgICAgICAgICBvcCA9ICcrJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBEaWZmT3AuRGVsZXRlOlxuICAgICAgICAgIG9wID0gJy0nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIERpZmZPcC5FcXVhbDpcbiAgICAgICAgICBvcCA9ICcgJztcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHRleHRbeCArIDFdID0gb3AgKyBlbmNvZGVVUkkodGhpcy5kaWZmc1t4XVsxXSkgKyAnXFxuJztcbiAgICB9XG4gICAgcmV0dXJuIHRleHQuam9pbignJykucmVwbGFjZSgvJTIwL2csICcgJyk7XG4gIH1cbn1cblxuZXhwb3J0IHsgRGlmZk1hdGNoUGF0Y2ggfTtcbiJdfQ==