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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZk1hdGNoUGF0Y2guanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZy1kaWZmLW1hdGNoLXBhdGNoLyIsInNvdXJjZXMiOlsibGliL2RpZmZNYXRjaFBhdGNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztJQUNFLFVBQVc7SUFDWCxRQUFTO0lBQ1QsU0FBVTs7Ozs7Ozs7O0FBU1o7OztBQUFBO0lBRUU7Ozs7NEJBTWUsR0FBRzs7NkJBRUYsQ0FBQzs7K0JBRUMsR0FBRzs7Ozs4QkFJSixJQUFJOzs7OztxQ0FLRyxHQUFHOzs0QkFFWixDQUFDOzs2QkFHQSxFQUFFOzs7Ozs7Z0NBUUMsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDOytCQUNuQixJQUFJLE1BQU0sQ0FBQyxVQUFVLENBQUM7a0NBQ25CLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQztvQ0FDdEIsSUFBSSxNQUFNLENBQUMsZUFBZSxDQUFDOzs7Ozs7K0JBc25DOUIsVUFBUyxLQUFrQjs7WUFDN0MsSUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDOztZQUNoQixJQUFNLFdBQVcsR0FBRyxJQUFJLENBQUM7O1lBQ3pCLElBQU0sVUFBVSxHQUFHLElBQUksQ0FBQzs7WUFDeEIsSUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDOztZQUN4QixJQUFNLFlBQVksR0FBRyxLQUFLLENBQUM7WUFDM0IsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7O2dCQUN0QyxJQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O2dCQUN2QixJQUFNLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O2dCQUN6QixJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQyxP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IC0xLFxyXG4gIEVxdWFsID0gMCxcclxuICBJbnNlcnQgPSAxXHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIERpZmYgPSBbRGlmZk9wLCBzdHJpbmddO1xyXG5cclxuLyoqXHJcbiAqIENsYXNzIGNvbnRhaW5pbmcgdGhlIGRpZmYsIG1hdGNoIGFuZCBwYXRjaCBtZXRob2RzLlxyXG5cclxuICovXHJcbmNsYXNzIERpZmZNYXRjaFBhdGNoIHtcclxuXHJcbiAgY29uc3RydWN0b3IoKSB7ICB9XHJcblxyXG4gIC8vIERlZmF1bHRzLlxyXG4gIC8vIFJlZGVmaW5lIHRoZXNlIGluIHlvdXIgcHJvZ3JhbSB0byBvdmVycmlkZSB0aGUgZGVmYXVsdHMuXHJcblxyXG4gIC8vIE51bWJlciBvZiBzZWNvbmRzIHRvIG1hcCBhIGRpZmYgYmVmb3JlIGdpdmluZyB1cCAoMCBmb3IgaW5maW5pdHkpLlxyXG4gIERpZmZfVGltZW91dCA9IDEuMDtcclxuICAvLyBDb3N0IG9mIGFuIGVtcHR5IGVkaXQgb3BlcmF0aW9uIGluIHRlcm1zIG9mIGVkaXQgY2hhcmFjdGVycy5cclxuICBEaWZmX0VkaXRDb3N0ID0gNDtcclxuICAvLyBBdCB3aGF0IHBvaW50IGlzIG5vIG1hdGNoIGRlY2xhcmVkICgwLjAgPSBwZXJmZWN0aW9uLCAxLjAgPSB2ZXJ5IGxvb3NlKS5cclxuICBNYXRjaF9UaHJlc2hvbGQgPSAwLjU7XHJcbiAgLy8gSG93IGZhciB0byBzZWFyY2ggZm9yIGEgbWF0Y2ggKDAgPSBleGFjdCBsb2NhdGlvbiwgMTAwMCsgPSBicm9hZCBtYXRjaCkuXHJcbiAgLy8gQSBtYXRjaCB0aGlzIG1hbnkgY2hhcmFjdGVycyBhd2F5IGZyb20gdGhlIGV4cGVjdGVkIGxvY2F0aW9uIHdpbGwgYWRkXHJcbiAgLy8gMS4wIHRvIHRoZSBzY29yZSAoMC4wIGlzIGEgcGVyZmVjdCBtYXRjaCkuXHJcbiAgTWF0Y2hfRGlzdGFuY2UgPSAxMDAwO1xyXG4gIC8vIFdoZW4gZGVsZXRpbmcgYSBsYXJnZSBibG9jayBvZiB0ZXh0IChvdmVyIH42NCBjaGFyYWN0ZXJzKSwgaG93IGNsb3NlIGRvXHJcbiAgLy8gdGhlIGNvbnRlbnRzIGhhdmUgdG8gYmUgdG8gbWF0Y2ggdGhlIGV4cGVjdGVkIGNvbnRlbnRzLiAoMC4wID0gcGVyZmVjdGlvbixcclxuICAvLyAxLjAgPSB2ZXJ5IGxvb3NlKS4gIE5vdGUgdGhhdCBNYXRjaF9UaHJlc2hvbGQgY29udHJvbHMgaG93IGNsb3NlbHkgdGhlXHJcbiAgLy8gZW5kIHBvaW50cyBvZiBhIGRlbGV0ZSBuZWVkIHRvIG1hdGNoLlxyXG4gIFBhdGNoX0RlbGV0ZVRocmVzaG9sZCA9IDAuNTtcclxuICAvLyBDaHVuayBzaXplIGZvciBjb250ZXh0IGxlbmd0aC5cclxuICBQYXRjaF9NYXJnaW4gPSA0O1xyXG5cclxuICAvLyBUaGUgbnVtYmVyIG9mIGJpdHMgaW4gYW4gaW50LlxyXG4gIE1hdGNoX01heEJpdHMgPSAzMjtcclxuICAvKipcclxuICAgKiBUaGUgZGF0YSBzdHJ1Y3R1cmUgcmVwcmVzZW50aW5nIGEgZGlmZiBpcyBhbiBhcnJheSBvZiB0dXBsZXM6XHJcbiAgICogW1tEaWZmT3AuRGVsZXRlLCAnSGVsbG8nXSwgW0RpZmZPcC5JbnNlcnQsICdHb29kYnllJ10sIFtEaWZmT3AuRXF1YWwsICcgd29ybGQuJ11dXHJcbiAgICogd2hpY2ggbWVhbnM6IGRlbGV0ZSAnSGVsbG8nLCBhZGQgJ0dvb2RieWUnIGFuZCBrZWVwICcgd29ybGQuJ1xyXG4gICAqL1xyXG5cclxuICAvLyBEZWZpbmUgc29tZSByZWdleCBwYXR0ZXJucyBmb3IgbWF0Y2hpbmcgYm91bmRhcmllcy5cclxuICB3aGl0ZXNwYWNlUmVnZXhfID0gbmV3IFJlZ0V4cCgnL1xccy8nKTtcclxuICBsaW5lYnJlYWtSZWdleF8gPSBuZXcgUmVnRXhwKCcvW1xcclxcbl0vJyk7XHJcbiAgYmxhbmtsaW5lRW5kUmVnZXhfID0gbmV3IFJlZ0V4cCgnL1xcblxccj9cXG4kLycpO1xyXG4gIGJsYW5rbGluZVN0YXJ0UmVnZXhfID0gbmV3IFJlZ0V4cCgnL15cXHI/XFxuXFxyP1xcbi8nKTtcclxuXHJcbiAgLyoqXHJcbiAgICogRmluZCB0aGUgZGlmZmVyZW5jZXMgYmV0d2VlbiB0d28gdGV4dHMuICBTaW1wbGlmaWVzIHRoZSBwcm9ibGVtIGJ5IHN0cmlwcGluZ1xyXG4gICAqIGFueSBjb21tb24gcHJlZml4IG9yIHN1ZmZpeCBvZmYgdGhlIHRleHRzIGJlZm9yZSBkaWZmaW5nLlxyXG4gICAqIEBwYXJhbSAgdGV4dDEgT2xkIHN0cmluZyB0byBiZSBkaWZmZWQuXHJcbiAgICogQHBhcmFtICB0ZXh0MiBOZXcgc3RyaW5nIHRvIGJlIGRpZmZlZC5cclxuICAgKiBAcGFyYW0gIG9wdF9jaGVja2xpbmVzIE9wdGlvbmFsIHNwZWVkdXAgZmxhZy4gSWYgcHJlc2VudCBhbmQgZmFsc2UsXHJcbiAgICogICAgIHRoZW4gZG9uJ3QgcnVuIGEgbGluZS1sZXZlbCBkaWZmIGZpcnN0IHRvIGlkZW50aWZ5IHRoZSBjaGFuZ2VkIGFyZWFzLlxyXG4gICAqICAgICBEZWZhdWx0cyB0byB0cnVlLCB3aGljaCBkb2VzIGEgZmFzdGVyLCBzbGlnaHRseSBsZXNzIG9wdGltYWwgZGlmZi5cclxuICAgKiBAcGFyYW0gIG9wdF9kZWFkbGluZSBPcHRpb25hbCB0aW1lIHdoZW4gdGhlIGRpZmYgc2hvdWxkIGJlIGNvbXBsZXRlXHJcbiAgICogICAgIGJ5LiAgVXNlZCBpbnRlcm5hbGx5IGZvciByZWN1cnNpdmUgY2FsbHMuICBVc2VycyBzaG91bGQgc2V0IERpZmZUaW1lb3V0XHJcbiAgICogICAgIGluc3RlYWQuXHJcbiAgICogQHJldHVybiAgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXHJcbiAgICovXHJcbiAgICBkaWZmX21haW4gKHRleHQxOiBzdHJpbmcsIHRleHQyOiBzdHJpbmcsIG9wdF9jaGVja2xpbmVzPzogYm9vbGVhbiwgb3B0X2RlYWRsaW5lPzogbnVtYmVyKTogQXJyYXk8RGlmZj4ge1xyXG4gICAgICAvLyBTZXQgYSBkZWFkbGluZSBieSB3aGljaCB0aW1lIHRoZSBkaWZmIG11c3QgYmUgY29tcGxldGUuXHJcbiAgICAgIGlmICh0eXBlb2Ygb3B0X2RlYWRsaW5lID09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuRGlmZl9UaW1lb3V0IDw9IDApIHtcclxuICAgICAgICAgIG9wdF9kZWFkbGluZSA9IE51bWJlci5NQVhfVkFMVUU7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIG9wdF9kZWFkbGluZSA9IChuZXcgRGF0ZSkuZ2V0VGltZSgpICsgdGhpcy5EaWZmX1RpbWVvdXQgKiAxMDAwO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBjb25zdCBkZWFkbGluZSA9IG9wdF9kZWFkbGluZTtcclxuXHJcbiAgICAgIC8vIENoZWNrIGZvciBudWxsIGlucHV0cy5cclxuICAgICAgaWYgKHRleHQxID09IG51bGwgfHwgdGV4dDIgPT0gbnVsbCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTnVsbCBpbnB1dC4gKGRpZmZfbWFpbiknKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gQ2hlY2sgZm9yIGVxdWFsaXR5IChzcGVlZHVwKS5cclxuICAgICAgaWYgKHRleHQxID09IHRleHQyKSB7XHJcbiAgICAgICAgaWYgKHRleHQxKSB7XHJcbiAgICAgICAgICByZXR1cm4gW1tEaWZmT3AuRXF1YWwsIHRleHQxXV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHR5cGVvZiBvcHRfY2hlY2tsaW5lcyA9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIG9wdF9jaGVja2xpbmVzID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBjaGVja2xpbmVzID0gb3B0X2NoZWNrbGluZXM7XHJcblxyXG4gICAgICAvLyBUcmltIG9mZiBjb21tb24gcHJlZml4IChzcGVlZHVwKS5cclxuICAgICAgbGV0IGNvbW1vbmxlbmd0aCA9IHRoaXMuZGlmZl9jb21tb25QcmVmaXgodGV4dDEsIHRleHQyKTtcclxuICAgICAgY29uc3QgY29tbW9ucHJlZml4ID0gdGV4dDEuc3Vic3RyaW5nKDAsIGNvbW1vbmxlbmd0aCk7XHJcbiAgICAgIHRleHQxID0gdGV4dDEuc3Vic3RyaW5nKGNvbW1vbmxlbmd0aCk7XHJcbiAgICAgIHRleHQyID0gdGV4dDIuc3Vic3RyaW5nKGNvbW1vbmxlbmd0aCk7XHJcblxyXG4gICAgICAvLyBUcmltIG9mZiBjb21tb24gc3VmZml4IChzcGVlZHVwKS5cclxuICAgICAgY29tbW9ubGVuZ3RoID0gdGhpcy5kaWZmX2NvbW1vblN1ZmZpeCh0ZXh0MSwgdGV4dDIpO1xyXG4gICAgICBjb25zdCBjb21tb25zdWZmaXggPSB0ZXh0MS5zdWJzdHJpbmcodGV4dDEubGVuZ3RoIC0gY29tbW9ubGVuZ3RoKTtcclxuICAgICAgdGV4dDEgPSB0ZXh0MS5zdWJzdHJpbmcoMCwgdGV4dDEubGVuZ3RoIC0gY29tbW9ubGVuZ3RoKTtcclxuICAgICAgdGV4dDIgPSB0ZXh0Mi5zdWJzdHJpbmcoMCwgdGV4dDIubGVuZ3RoIC0gY29tbW9ubGVuZ3RoKTtcclxuXHJcbiAgICAgIC8vIENvbXB1dGUgdGhlIGRpZmYgb24gdGhlIG1pZGRsZSBibG9jay5cclxuICAgICAgY29uc3QgZGlmZnMgPSB0aGlzLmRpZmZfY29tcHV0ZV8odGV4dDEsIHRleHQyLCBjaGVja2xpbmVzLCBkZWFkbGluZSk7XHJcblxyXG4gICAgICAvLyBSZXN0b3JlIHRoZSBwcmVmaXggYW5kIHN1ZmZpeC5cclxuICAgICAgaWYgKGNvbW1vbnByZWZpeCkge1xyXG4gICAgICAgIGRpZmZzLnVuc2hpZnQoW0RpZmZPcC5FcXVhbCwgY29tbW9ucHJlZml4XSk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGNvbW1vbnN1ZmZpeCkge1xyXG4gICAgICAgIGRpZmZzLnB1c2goW0RpZmZPcC5FcXVhbCwgY29tbW9uc3VmZml4XSk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5kaWZmX2NsZWFudXBNZXJnZShkaWZmcyk7XHJcbiAgICAgIHJldHVybiBkaWZmcztcclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogRmluZCB0aGUgZGlmZmVyZW5jZXMgYmV0d2VlbiB0d28gdGV4dHMuICBBc3N1bWVzIHRoYXQgdGhlIHRleHRzIGRvIG5vdFxyXG4gICAqIGhhdmUgYW55IGNvbW1vbiBwcmVmaXggb3Igc3VmZml4LlxyXG4gICAqIEBwYXJhbSAgdGV4dDEgT2xkIHN0cmluZyB0byBiZSBkaWZmZWQuXHJcbiAgICogQHBhcmFtICB0ZXh0MiBOZXcgc3RyaW5nIHRvIGJlIGRpZmZlZC5cclxuICAgKiBAcGFyYW0gIGNoZWNrbGluZXMgU3BlZWR1cCBmbGFnLiAgSWYgZmFsc2UsIHRoZW4gZG9uJ3QgcnVuIGFcclxuICAgKiAgICAgbGluZS1sZXZlbCBkaWZmIGZpcnN0IHRvIGlkZW50aWZ5IHRoZSBjaGFuZ2VkIGFyZWFzLlxyXG4gICAqICAgICBJZiB0cnVlLCB0aGVuIHJ1biBhIGZhc3Rlciwgc2xpZ2h0bHkgbGVzcyBvcHRpbWFsIGRpZmYuXHJcbiAgICogQHBhcmFtICBkZWFkbGluZSBUaW1lIHdoZW4gdGhlIGRpZmYgc2hvdWxkIGJlIGNvbXBsZXRlIGJ5LlxyXG4gICAqIEByZXR1cm4gIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxyXG5cclxuICAgKi9cclxuICAgIGRpZmZfY29tcHV0ZV8gKHRleHQxOiBzdHJpbmcsIHRleHQyOiBzdHJpbmcsIGNoZWNrbGluZXM6IGJvb2xlYW4sXHJcbiAgICAgIGRlYWRsaW5lOiBudW1iZXIpOiBBcnJheTxEaWZmPiB7XHJcbiAgICBsZXQgZGlmZnM6IEFycmF5PERpZmY+O1xyXG5cclxuICAgIGlmICghdGV4dDEpIHtcclxuICAgICAgLy8gSnVzdCBhZGQgc29tZSB0ZXh0IChzcGVlZHVwKS5cclxuICAgICAgcmV0dXJuIFtbRGlmZk9wLkluc2VydCwgdGV4dDJdXTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRleHQyKSB7XHJcbiAgICAgIC8vIEp1c3QgZGVsZXRlIHNvbWUgdGV4dCAoc3BlZWR1cCkuXHJcbiAgICAgIHJldHVybiBbW0RpZmZPcC5EZWxldGUsIHRleHQxXV07XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbG9uZ3RleHQgPSB0ZXh0MS5sZW5ndGggPiB0ZXh0Mi5sZW5ndGggPyB0ZXh0MSA6IHRleHQyO1xyXG4gICAgY29uc3Qgc2hvcnR0ZXh0ID0gdGV4dDEubGVuZ3RoID4gdGV4dDIubGVuZ3RoID8gdGV4dDIgOiB0ZXh0MTtcclxuICAgIGNvbnN0IGkgPSBsb25ndGV4dC5pbmRleE9mKHNob3J0dGV4dCk7XHJcbiAgICBpZiAoaSAhPSAtMSkge1xyXG4gICAgICAvLyBTaG9ydGVyIHRleHQgaXMgaW5zaWRlIHRoZSBsb25nZXIgdGV4dCAoc3BlZWR1cCkuXHJcbiAgICAgIGRpZmZzID0gW1tEaWZmT3AuSW5zZXJ0LCBsb25ndGV4dC5zdWJzdHJpbmcoMCwgaSldLFxyXG4gICAgICAgICAgICAgIFtEaWZmT3AuRXF1YWwsIHNob3J0dGV4dF0sXHJcbiAgICAgICAgICAgICAgW0RpZmZPcC5JbnNlcnQsIGxvbmd0ZXh0LnN1YnN0cmluZyhpICsgc2hvcnR0ZXh0Lmxlbmd0aCldXTtcclxuICAgICAgLy8gU3dhcCBpbnNlcnRpb25zIGZvciBkZWxldGlvbnMgaWYgZGlmZiBpcyByZXZlcnNlZC5cclxuICAgICAgaWYgKHRleHQxLmxlbmd0aCA+IHRleHQyLmxlbmd0aCkge1xyXG4gICAgICAgIGRpZmZzWzBdWzBdID0gZGlmZnNbMl1bMF0gPSBEaWZmT3AuRGVsZXRlO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBkaWZmcztcclxuICAgIH1cclxuXHJcbiAgICBpZiAoc2hvcnR0ZXh0Lmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgIC8vIFNpbmdsZSBjaGFyYWN0ZXIgc3RyaW5nLlxyXG4gICAgICAvLyBBZnRlciB0aGUgcHJldmlvdXMgc3BlZWR1cCwgdGhlIGNoYXJhY3RlciBjYW4ndCBiZSBhbiBlcXVhbGl0eS5cclxuICAgICAgcmV0dXJuIFtbRGlmZk9wLkRlbGV0ZSwgdGV4dDFdLCBbRGlmZk9wLkluc2VydCwgdGV4dDJdXTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIHByb2JsZW0gY2FuIGJlIHNwbGl0IGluIHR3by5cclxuICAgIGNvbnN0IGhtID0gdGhpcy5kaWZmX2hhbGZNYXRjaF8odGV4dDEsIHRleHQyKTtcclxuICAgIGlmIChobSkge1xyXG4gICAgICAvLyBBIGhhbGYtbWF0Y2ggd2FzIGZvdW5kLCBzb3J0IG91dCB0aGUgcmV0dXJuIGRhdGEuXHJcbiAgICAgIGNvbnN0IHRleHQxX2EgPSBobVswXTtcclxuICAgICAgY29uc3QgdGV4dDFfYiA9IGhtWzFdO1xyXG4gICAgICBjb25zdCB0ZXh0Ml9hID0gaG1bMl07XHJcbiAgICAgIGNvbnN0IHRleHQyX2IgPSBobVszXTtcclxuICAgICAgY29uc3QgbWlkX2NvbW1vbiA9IGhtWzRdO1xyXG4gICAgICAvLyBTZW5kIGJvdGggcGFpcnMgb2ZmIGZvciBzZXBhcmF0ZSBwcm9jZXNzaW5nLlxyXG4gICAgICBjb25zdCBkaWZmc19hID0gdGhpcy5kaWZmX21haW4odGV4dDFfYSwgdGV4dDJfYSwgY2hlY2tsaW5lcywgZGVhZGxpbmUpO1xyXG4gICAgICBjb25zdCBkaWZmc19iID0gdGhpcy5kaWZmX21haW4odGV4dDFfYiwgdGV4dDJfYiwgY2hlY2tsaW5lcywgZGVhZGxpbmUpO1xyXG4gICAgICAvLyBNZXJnZSB0aGUgcmVzdWx0cy5cclxuICAgICAgcmV0dXJuIGRpZmZzX2EuY29uY2F0KFtbRGlmZk9wLkVxdWFsLCBtaWRfY29tbW9uXV0sIGRpZmZzX2IpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChjaGVja2xpbmVzICYmIHRleHQxLmxlbmd0aCA+IDEwMCAmJiB0ZXh0Mi5sZW5ndGggPiAxMDApIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZGlmZl9saW5lTW9kZV8odGV4dDEsIHRleHQyLCBkZWFkbGluZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuZGlmZl9iaXNlY3RfKHRleHQxLCB0ZXh0MiwgZGVhZGxpbmUpO1xyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBEbyBhIHF1aWNrIGxpbmUtbGV2ZWwgZGlmZiBvbiBib3RoIHN0cmluZ3MsIHRoZW4gcmVkaWZmIHRoZSBwYXJ0cyBmb3JcclxuICAgKiBncmVhdGVyIGFjY3VyYWN5LlxyXG4gICAqIFRoaXMgc3BlZWR1cCBjYW4gcHJvZHVjZSBub24tbWluaW1hbCBkaWZmcy5cclxuICAgKiBAcGFyYW0gIHRleHQxIE9sZCBzdHJpbmcgdG8gYmUgZGlmZmVkLlxyXG4gICAqIEBwYXJhbSAgdGV4dDIgTmV3IHN0cmluZyB0byBiZSBkaWZmZWQuXHJcbiAgICogQHBhcmFtICBkZWFkbGluZSBUaW1lIHdoZW4gdGhlIGRpZmYgc2hvdWxkIGJlIGNvbXBsZXRlIGJ5LlxyXG4gICAqIEByZXR1cm4gIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxyXG5cclxuICAgKi9cclxuICAgIGRpZmZfbGluZU1vZGVfICh0ZXh0MTogc3RyaW5nLCB0ZXh0Mjogc3RyaW5nLCBkZWFkbGluZTogbnVtYmVyKSB7XHJcbiAgICAvLyBTY2FuIHRoZSB0ZXh0IG9uIGEgbGluZS1ieS1saW5lIGJhc2lzIGZpcnN0LlxyXG4gICAgY29uc3QgYSA9IHRoaXMuZGlmZl9saW5lc1RvQ2hhcnNfKHRleHQxLCB0ZXh0Mik7XHJcbiAgICB0ZXh0MSA9IGEuY2hhcnMxO1xyXG4gICAgdGV4dDIgPSBhLmNoYXJzMjtcclxuICAgIGNvbnN0IGxpbmVhcnJheSA9IGEubGluZUFycmF5O1xyXG5cclxuICAgIGNvbnN0IGRpZmZzID0gdGhpcy5kaWZmX21haW4odGV4dDEsIHRleHQyLCBmYWxzZSwgZGVhZGxpbmUpO1xyXG5cclxuICAgIC8vIENvbnZlcnQgdGhlIGRpZmYgYmFjayB0byBvcmlnaW5hbCB0ZXh0LlxyXG4gICAgdGhpcy5kaWZmX2NoYXJzVG9MaW5lc18oZGlmZnMsIGxpbmVhcnJheSk7XHJcbiAgICAvLyBFbGltaW5hdGUgZnJlYWsgbWF0Y2hlcyAoZS5nLiBibGFuayBsaW5lcylcclxuICAgIHRoaXMuZGlmZl9jbGVhbnVwU2VtYW50aWMoZGlmZnMpO1xyXG5cclxuICAgIC8vIFJlZGlmZiBhbnkgcmVwbGFjZW1lbnQgYmxvY2tzLCB0aGlzIHRpbWUgY2hhcmFjdGVyLWJ5LWNoYXJhY3Rlci5cclxuICAgIC8vIEFkZCBhIGR1bW15IGVudHJ5IGF0IHRoZSBlbmQuXHJcbiAgICBkaWZmcy5wdXNoKFtEaWZmT3AuRXF1YWwsICcnXSk7XHJcbiAgICBsZXQgcG9pbnRlciA9IDA7XHJcbiAgICBsZXQgY291bnRfZGVsZXRlID0gMDtcclxuICAgIGxldCBjb3VudF9pbnNlcnQgPSAwO1xyXG4gICAgbGV0IHRleHRfZGVsZXRlID0gJyc7XHJcbiAgICBsZXQgdGV4dF9pbnNlcnQgPSAnJztcclxuICAgIHdoaWxlIChwb2ludGVyIDwgZGlmZnMubGVuZ3RoKSB7XHJcbiAgICAgIHN3aXRjaCAoZGlmZnNbcG9pbnRlcl1bMF0pIHtcclxuICAgICAgICBjYXNlIERpZmZPcC5JbnNlcnQ6XHJcbiAgICAgICAgICBjb3VudF9pbnNlcnQrKztcclxuICAgICAgICAgIHRleHRfaW5zZXJ0ICs9IGRpZmZzW3BvaW50ZXJdWzFdO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBEaWZmT3AuRGVsZXRlOlxyXG4gICAgICAgICAgY291bnRfZGVsZXRlKys7XHJcbiAgICAgICAgICB0ZXh0X2RlbGV0ZSArPSBkaWZmc1twb2ludGVyXVsxXTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgRGlmZk9wLkVxdWFsOlxyXG4gICAgICAgICAgLy8gVXBvbiByZWFjaGluZyBhbiBlcXVhbGl0eSwgY2hlY2sgZm9yIHByaW9yIHJlZHVuZGFuY2llcy5cclxuICAgICAgICAgIGlmIChjb3VudF9kZWxldGUgPj0gMSAmJiBjb3VudF9pbnNlcnQgPj0gMSkge1xyXG4gICAgICAgICAgICAvLyBEZWxldGUgdGhlIG9mZmVuZGluZyByZWNvcmRzIGFuZCBhZGQgdGhlIG1lcmdlZCBvbmVzLlxyXG4gICAgICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciAtIGNvdW50X2RlbGV0ZSAtIGNvdW50X2luc2VydCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY291bnRfZGVsZXRlICsgY291bnRfaW5zZXJ0KTtcclxuICAgICAgICAgICAgcG9pbnRlciA9IHBvaW50ZXIgLSBjb3VudF9kZWxldGUgLSBjb3VudF9pbnNlcnQ7XHJcbiAgICAgICAgICAgIGNvbnN0IGIgPSB0aGlzLmRpZmZfbWFpbih0ZXh0X2RlbGV0ZSwgdGV4dF9pbnNlcnQsIGZhbHNlLCBkZWFkbGluZSk7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGogPSBiLmxlbmd0aCAtIDE7IGogPj0gMDsgai0tKSB7XHJcbiAgICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIsIDAsIGJbal0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHBvaW50ZXIgPSBwb2ludGVyICsgYi5sZW5ndGg7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjb3VudF9pbnNlcnQgPSAwO1xyXG4gICAgICAgICAgY291bnRfZGVsZXRlID0gMDtcclxuICAgICAgICAgIHRleHRfZGVsZXRlID0gJyc7XHJcbiAgICAgICAgICB0ZXh0X2luc2VydCA9ICcnO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgICAgcG9pbnRlcisrO1xyXG4gICAgfVxyXG4gICAgZGlmZnMucG9wKCk7ICAvLyBSZW1vdmUgdGhlIGR1bW15IGVudHJ5IGF0IHRoZSBlbmQuXHJcblxyXG4gICAgcmV0dXJuIGRpZmZzO1xyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBGaW5kIHRoZSAnbWlkZGxlIHNuYWtlJyBvZiBhIGRpZmYsIHNwbGl0IHRoZSBwcm9ibGVtIGluIHR3b1xyXG4gICAqIGFuZCByZXR1cm4gdGhlIHJlY3Vyc2l2ZWx5IGNvbnN0cnVjdGVkIGRpZmYuXHJcbiAgICogU2VlIE15ZXJzIDE5ODYgcGFwZXI6IEFuIE8oTkQpIERpZmZlcmVuY2UgQWxnb3JpdGhtIGFuZCBJdHMgY29uc3RpYXRpb25zLlxyXG4gICAqIEBwYXJhbSAgdGV4dDEgT2xkIHN0cmluZyB0byBiZSBkaWZmZWQuXHJcbiAgICogQHBhcmFtICB0ZXh0MiBOZXcgc3RyaW5nIHRvIGJlIGRpZmZlZC5cclxuICAgKiBAcGFyYW0gIGRlYWRsaW5lIFRpbWUgYXQgd2hpY2ggdG8gYmFpbCBpZiBub3QgeWV0IGNvbXBsZXRlLlxyXG4gICAqIEByZXR1cm4gIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxyXG5cclxuICAgKi9cclxuICAgIGRpZmZfYmlzZWN0XyAodGV4dDE6IHN0cmluZywgdGV4dDI6IHN0cmluZywgZGVhZGxpbmU6IG51bWJlcik6IEFycmF5PERpZmY+IHtcclxuICAgIC8vIENhY2hlIHRoZSB0ZXh0IGxlbmd0aHMgdG8gcHJldmVudCBtdWx0aXBsZSBjYWxscy5cclxuICAgIGNvbnN0IHRleHQxX2xlbmd0aCA9IHRleHQxLmxlbmd0aDtcclxuICAgIGNvbnN0IHRleHQyX2xlbmd0aCA9IHRleHQyLmxlbmd0aDtcclxuICAgIGNvbnN0IG1heF9kID0gTWF0aC5jZWlsKCh0ZXh0MV9sZW5ndGggKyB0ZXh0Ml9sZW5ndGgpIC8gMik7XHJcbiAgICBjb25zdCB2X29mZnNldCA9IG1heF9kO1xyXG4gICAgY29uc3Qgdl9sZW5ndGggPSAyICogbWF4X2Q7XHJcbiAgICBjb25zdCB2MSA9IG5ldyBBcnJheSh2X2xlbmd0aCk7XHJcbiAgICBjb25zdCB2MiA9IG5ldyBBcnJheSh2X2xlbmd0aCk7XHJcbiAgICAvLyBTZXR0aW5nIGFsbCBlbGVtZW50cyB0byAtMSBpcyBmYXN0ZXIgaW4gQ2hyb21lICYgRmlyZWZveCB0aGFuIG1peGluZ1xyXG4gICAgLy8gaW50ZWdlcnMgYW5kIHVuZGVmaW5lZC5cclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgdl9sZW5ndGg7IHgrKykge1xyXG4gICAgICB2MVt4XSA9IC0xO1xyXG4gICAgICB2Mlt4XSA9IC0xO1xyXG4gICAgfVxyXG4gICAgdjFbdl9vZmZzZXQgKyAxXSA9IDA7XHJcbiAgICB2Mlt2X29mZnNldCArIDFdID0gMDtcclxuICAgIGNvbnN0IGRlbHRhID0gdGV4dDFfbGVuZ3RoIC0gdGV4dDJfbGVuZ3RoO1xyXG4gICAgLy8gSWYgdGhlIHRvdGFsIG51bWJlciBvZiBjaGFyYWN0ZXJzIGlzIG9kZCwgdGhlbiB0aGUgZnJvbnQgcGF0aCB3aWxsIGNvbGxpZGVcclxuICAgIC8vIHdpdGggdGhlIHJldmVyc2UgcGF0aC5cclxuICAgIGNvbnN0IGZyb250ID0gKGRlbHRhICUgMiAhPSAwKTtcclxuICAgIC8vIE9mZnNldHMgZm9yIHN0YXJ0IGFuZCBlbmQgb2YgayBsb29wLlxyXG4gICAgLy8gUHJldmVudHMgbWFwcGluZyBvZiBzcGFjZSBiZXlvbmQgdGhlIGdyaWQuXHJcbiAgICBsZXQgazFzdGFydCA9IDA7XHJcbiAgICBsZXQgazFlbmQgPSAwO1xyXG4gICAgbGV0IGsyc3RhcnQgPSAwO1xyXG4gICAgbGV0IGsyZW5kID0gMDtcclxuICAgIGZvciAobGV0IGQgPSAwOyBkIDwgbWF4X2Q7IGQrKykge1xyXG4gICAgICAvLyBCYWlsIG91dCBpZiBkZWFkbGluZSBpcyByZWFjaGVkLlxyXG4gICAgICBpZiAoKG5ldyBEYXRlKCkpLmdldFRpbWUoKSA+IGRlYWRsaW5lKSB7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFdhbGsgdGhlIGZyb250IHBhdGggb25lIHN0ZXAuXHJcbiAgICAgIGZvciAobGV0IGsxID0gLWQgKyBrMXN0YXJ0OyBrMSA8PSBkIC0gazFlbmQ7IGsxICs9IDIpIHtcclxuICAgICAgICBjb25zdCBrMV9vZmZzZXQgPSB2X29mZnNldCArIGsxO1xyXG4gICAgICAgIGxldCB4MTtcclxuICAgICAgICBpZiAoazEgPT0gLWQgfHwgKGsxICE9IGQgJiYgdjFbazFfb2Zmc2V0IC0gMV0gPCB2MVtrMV9vZmZzZXQgKyAxXSkpIHtcclxuICAgICAgICAgIHgxID0gdjFbazFfb2Zmc2V0ICsgMV07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHgxID0gdjFbazFfb2Zmc2V0IC0gMV0gKyAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgeTEgPSB4MSAtIGsxO1xyXG4gICAgICAgIHdoaWxlICh4MSA8IHRleHQxX2xlbmd0aCAmJiB5MSA8IHRleHQyX2xlbmd0aCAmJlxyXG4gICAgICAgICAgICAgIHRleHQxLmNoYXJBdCh4MSkgPT0gdGV4dDIuY2hhckF0KHkxKSkge1xyXG4gICAgICAgICAgeDErKztcclxuICAgICAgICAgIHkxKys7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHYxW2sxX29mZnNldF0gPSB4MTtcclxuICAgICAgICBpZiAoeDEgPiB0ZXh0MV9sZW5ndGgpIHtcclxuICAgICAgICAgIC8vIFJhbiBvZmYgdGhlIHJpZ2h0IG9mIHRoZSBncmFwaC5cclxuICAgICAgICAgIGsxZW5kICs9IDI7XHJcbiAgICAgICAgfSBlbHNlIGlmICh5MSA+IHRleHQyX2xlbmd0aCkge1xyXG4gICAgICAgICAgLy8gUmFuIG9mZiB0aGUgYm90dG9tIG9mIHRoZSBncmFwaC5cclxuICAgICAgICAgIGsxc3RhcnQgKz0gMjtcclxuICAgICAgICB9IGVsc2UgaWYgKGZyb250KSB7XHJcbiAgICAgICAgICBjb25zdCBrMl9vZmZzZXQgPSB2X29mZnNldCArIGRlbHRhIC0gazE7XHJcbiAgICAgICAgICBpZiAoazJfb2Zmc2V0ID49IDAgJiYgazJfb2Zmc2V0IDwgdl9sZW5ndGggJiYgdjJbazJfb2Zmc2V0XSAhPSAtMSkge1xyXG4gICAgICAgICAgICAvLyBNaXJyb3IgeDIgb250byB0b3AtbGVmdCBjb29yZGluYXRlIHN5c3RlbS5cclxuICAgICAgICAgICAgY29uc3QgeDIgPSB0ZXh0MV9sZW5ndGggLSB2MltrMl9vZmZzZXRdO1xyXG4gICAgICAgICAgICBpZiAoeDEgPj0geDIpIHtcclxuICAgICAgICAgICAgICAvLyBPdmVybGFwIGRldGVjdGVkLlxyXG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLmRpZmZfYmlzZWN0U3BsaXRfKHRleHQxLCB0ZXh0MiwgeDEsIHkxLCBkZWFkbGluZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFdhbGsgdGhlIHJldmVyc2UgcGF0aCBvbmUgc3RlcC5cclxuICAgICAgZm9yIChsZXQgazIgPSAtZCArIGsyc3RhcnQ7IGsyIDw9IGQgLSBrMmVuZDsgazIgKz0gMikge1xyXG4gICAgICAgIGNvbnN0IGsyX29mZnNldCA9IHZfb2Zmc2V0ICsgazI7XHJcbiAgICAgICAgbGV0IHgyOiBudW1iZXI7XHJcbiAgICAgICAgaWYgKGsyID09IC1kIHx8IChrMiAhPSBkICYmIHYyW2syX29mZnNldCAtIDFdIDwgdjJbazJfb2Zmc2V0ICsgMV0pKSB7XHJcbiAgICAgICAgICB4MiA9IHYyW2syX29mZnNldCArIDFdO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB4MiA9IHYyW2syX29mZnNldCAtIDFdICsgMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IHkyID0geDIgLSBrMjtcclxuICAgICAgICB3aGlsZSAoeDIgPCB0ZXh0MV9sZW5ndGggJiYgeTIgPCB0ZXh0Ml9sZW5ndGggJiZcclxuICAgICAgICAgICAgICB0ZXh0MS5jaGFyQXQodGV4dDFfbGVuZ3RoIC0geDIgLSAxKSA9PVxyXG4gICAgICAgICAgICAgIHRleHQyLmNoYXJBdCh0ZXh0Ml9sZW5ndGggLSB5MiAtIDEpKSB7XHJcbiAgICAgICAgICB4MisrO1xyXG4gICAgICAgICAgeTIrKztcclxuICAgICAgICB9XHJcbiAgICAgICAgdjJbazJfb2Zmc2V0XSA9IHgyO1xyXG4gICAgICAgIGlmICh4MiA+IHRleHQxX2xlbmd0aCkge1xyXG4gICAgICAgICAgLy8gUmFuIG9mZiB0aGUgbGVmdCBvZiB0aGUgZ3JhcGguXHJcbiAgICAgICAgICBrMmVuZCArPSAyO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoeTIgPiB0ZXh0Ml9sZW5ndGgpIHtcclxuICAgICAgICAgIC8vIFJhbiBvZmYgdGhlIHRvcCBvZiB0aGUgZ3JhcGguXHJcbiAgICAgICAgICBrMnN0YXJ0ICs9IDI7XHJcbiAgICAgICAgfSBlbHNlIGlmICghZnJvbnQpIHtcclxuICAgICAgICAgIGNvbnN0IGsxX29mZnNldCA9IHZfb2Zmc2V0ICsgZGVsdGEgLSBrMjtcclxuICAgICAgICAgIGlmIChrMV9vZmZzZXQgPj0gMCAmJiBrMV9vZmZzZXQgPCB2X2xlbmd0aCAmJiB2MVtrMV9vZmZzZXRdICE9IC0xKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHgxID0gdjFbazFfb2Zmc2V0XTtcclxuICAgICAgICAgICAgY29uc3QgeTEgPSB2X29mZnNldCArIHgxIC0gazFfb2Zmc2V0O1xyXG4gICAgICAgICAgICAvLyBNaXJyb3IgeDIgb250byB0b3AtbGVmdCBjb29yZGluYXRlIHN5c3RlbS5cclxuICAgICAgICAgICAgeDIgPSB0ZXh0MV9sZW5ndGggLSB4MjtcclxuICAgICAgICAgICAgaWYgKHgxID49IHgyKSB7XHJcbiAgICAgICAgICAgICAgLy8gT3ZlcmxhcCBkZXRlY3RlZC5cclxuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kaWZmX2Jpc2VjdFNwbGl0Xyh0ZXh0MSwgdGV4dDIsIHgxLCB5MSwgZGVhZGxpbmUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBEaWZmIHRvb2sgdG9vIGxvbmcgYW5kIGhpdCB0aGUgZGVhZGxpbmUgb3JcclxuICAgIC8vIG51bWJlciBvZiBkaWZmcyBlcXVhbHMgbnVtYmVyIG9mIGNoYXJhY3RlcnMsIG5vIGNvbW1vbmFsaXR5IGF0IGFsbC5cclxuICAgIHJldHVybiBbW0RpZmZPcC5EZWxldGUsIHRleHQxXSwgW0RpZmZPcC5JbnNlcnQsIHRleHQyXV07XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEdpdmVuIHRoZSBsb2NhdGlvbiBvZiB0aGUgJ21pZGRsZSBzbmFrZScsIHNwbGl0IHRoZSBkaWZmIGluIHR3byBwYXJ0c1xyXG4gICAqIGFuZCByZWN1cnNlLlxyXG4gICAqIEBwYXJhbSAgdGV4dDEgT2xkIHN0cmluZyB0byBiZSBkaWZmZWQuXHJcbiAgICogQHBhcmFtICB0ZXh0MiBOZXcgc3RyaW5nIHRvIGJlIGRpZmZlZC5cclxuICAgKiBAcGFyYW0gIHggSW5kZXggb2Ygc3BsaXQgcG9pbnQgaW4gdGV4dDEuXHJcbiAgICogQHBhcmFtICB5IEluZGV4IG9mIHNwbGl0IHBvaW50IGluIHRleHQyLlxyXG4gICAqIEBwYXJhbSAgZGVhZGxpbmUgVGltZSBhdCB3aGljaCB0byBiYWlsIGlmIG5vdCB5ZXQgY29tcGxldGUuXHJcbiAgICogQHJldHVybiAgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXHJcblxyXG4gICAqL1xyXG4gICAgZGlmZl9iaXNlY3RTcGxpdF8gKHRleHQxOiBzdHJpbmcsIHRleHQyOiBzdHJpbmcsIHg6IG51bWJlciwgeTogbnVtYmVyLCBkZWFkbGluZTogbnVtYmVyKSB7XHJcbiAgICAgIGNvbnN0IHRleHQxYSA9IHRleHQxLnN1YnN0cmluZygwLCB4KTtcclxuICAgICAgY29uc3QgdGV4dDJhID0gdGV4dDIuc3Vic3RyaW5nKDAsIHkpO1xyXG4gICAgICBjb25zdCB0ZXh0MWIgPSB0ZXh0MS5zdWJzdHJpbmcoeCk7XHJcbiAgICAgIGNvbnN0IHRleHQyYiA9IHRleHQyLnN1YnN0cmluZyh5KTtcclxuXHJcbiAgICAgIC8vIENvbXB1dGUgYm90aCBkaWZmcyBzZXJpYWxseS5cclxuICAgICAgY29uc3QgZGlmZnMgPSB0aGlzLmRpZmZfbWFpbih0ZXh0MWEsIHRleHQyYSwgZmFsc2UsIGRlYWRsaW5lKTtcclxuICAgICAgY29uc3QgZGlmZnNiID0gdGhpcy5kaWZmX21haW4odGV4dDFiLCB0ZXh0MmIsIGZhbHNlLCBkZWFkbGluZSk7XHJcblxyXG4gICAgICByZXR1cm4gZGlmZnMuY29uY2F0KGRpZmZzYik7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogU3BsaXQgdHdvIHRleHRzIGludG8gYW4gYXJyYXkgb2Ygc3RyaW5ncy4gIFJlZHVjZSB0aGUgdGV4dHMgdG8gYSBzdHJpbmcgb2ZcclxuICAgKiBoYXNoZXMgd2hlcmUgZWFjaCBVbmljb2RlIGNoYXJhY3RlciByZXByZXNlbnRzIG9uZSBsaW5lLlxyXG4gICAqIEBwYXJhbSAgdGV4dDEgRmlyc3Qgc3RyaW5nLlxyXG4gICAqIEBwYXJhbSAgdGV4dDIgU2Vjb25kIHN0cmluZy5cclxuICAgKiBAcmV0dXJuIH1cclxuICAgKiAgICAgQW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIGVuY29kZWQgdGV4dDEsIHRoZSBlbmNvZGVkIHRleHQyIGFuZFxyXG4gICAqICAgICB0aGUgYXJyYXkgb2YgdW5pcXVlIHN0cmluZ3MuXHJcbiAgICogICAgIFRoZSB6ZXJvdGggZWxlbWVudCBvZiB0aGUgYXJyYXkgb2YgdW5pcXVlIHN0cmluZ3MgaXMgaW50ZW50aW9uYWxseSBibGFuay5cclxuXHJcbiAgICovXHJcbiAgICBkaWZmX2xpbmVzVG9DaGFyc18gKHRleHQxOiBzdHJpbmcsIHRleHQyOiBzdHJpbmcpIHtcclxuICAgICAgY29uc3QgbGluZUFycmF5ID0gW107ICAvLyBlLmcuIGxpbmVBcnJheVs0XSA9PSAnSGVsbG9cXG4nXHJcbiAgICAgIGNvbnN0IGxpbmVIYXNoID0ge307ICAgLy8gZS5nLiBsaW5lSGFzaFsnSGVsbG9cXG4nXSA9PSA0XHJcblxyXG4gICAgICAvLyAnXFx4MDAnIGlzIGEgdmFsaWQgY2hhcmFjdGVyLCBidXQgY29uc3Rpb3VzIGRlYnVnZ2VycyBkb24ndCBsaWtlIGl0LlxyXG4gICAgICAvLyBTbyB3ZSdsbCBpbnNlcnQgYSBqdW5rIGVudHJ5IHRvIGF2b2lkIGdlbmVyYXRpbmcgYSBudWxsIGNoYXJhY3Rlci5cclxuICAgICAgbGluZUFycmF5WzBdID0gJyc7XHJcblxyXG5cclxuICAgICAgY29uc3QgY2hhcnMxID0gdGhpcy5kaWZmX2xpbmVzVG9DaGFyc011bmdlXyh0ZXh0MSwgbGluZUFycmF5LCBsaW5lSGFzaCk7XHJcbiAgICAgIGNvbnN0IGNoYXJzMiA9IHRoaXMuZGlmZl9saW5lc1RvQ2hhcnNNdW5nZV8odGV4dDIsIGxpbmVBcnJheSwgbGluZUhhc2gpO1xyXG4gICAgICByZXR1cm4ge2NoYXJzMTogY2hhcnMxLCBjaGFyczI6IGNoYXJzMiwgbGluZUFycmF5OiBsaW5lQXJyYXl9O1xyXG4gICB9O1xyXG5cclxuICAvKipcclxuICAgKiBTcGxpdCBhIHRleHQgaW50byBhbiBhcnJheSBvZiBzdHJpbmdzLiAgUmVkdWNlIHRoZSB0ZXh0cyB0byBhIHN0cmluZyBvZlxyXG4gICAqIGhhc2hlcyB3aGVyZSBlYWNoIFVuaWNvZGUgY2hhcmFjdGVyIHJlcHJlc2VudHMgb25lIGxpbmUuXHJcbiAgICogTW9kaWZpZXMgbGluZWFycmF5IGFuZCBsaW5laGFzaCB0aHJvdWdoIGJlaW5nIGEgY2xvc3VyZS5cclxuICAgKiBAcGFyYW0gIHRleHQgU3RyaW5nIHRvIGVuY29kZS5cclxuICAgKiBAcmV0dXJuICBFbmNvZGVkIHN0cmluZy5cclxuXHJcbiAgICovXHJcbiAgZGlmZl9saW5lc1RvQ2hhcnNNdW5nZV8odGV4dDogc3RyaW5nLCBsaW5lQXJyYXk6IEFycmF5PHN0cmluZz4sIGxpbmVIYXNoOiBhbnkpOiBzdHJpbmcge1xyXG4gICAgbGV0IGNoYXJzID0gJyc7XHJcbiAgICAvLyBXYWxrIHRoZSB0ZXh0LCBwdWxsaW5nIG91dCBhIHN1YnN0cmluZyBmb3IgZWFjaCBsaW5lLlxyXG4gICAgLy8gdGV4dC5zcGxpdCgnXFxuJykgd291bGQgd291bGQgdGVtcG9yYXJpbHkgZG91YmxlIG91ciBtZW1vcnkgZm9vdHByaW50LlxyXG4gICAgLy8gTW9kaWZ5aW5nIHRleHQgd291bGQgY3JlYXRlIG1hbnkgbGFyZ2Ugc3RyaW5ncyB0byBnYXJiYWdlIGNvbGxlY3QuXHJcbiAgICBsZXQgbGluZVN0YXJ0ID0gMDtcclxuICAgIGxldCBsaW5lRW5kID0gLTE7XHJcbiAgICAvLyBLZWVwaW5nIG91ciBvd24gbGVuZ3RoIGNvbnN0aWFibGUgaXMgZmFzdGVyIHRoYW4gbG9va2luZyBpdCB1cC5cclxuICAgIGxldCBsaW5lQXJyYXlMZW5ndGggPSBsaW5lQXJyYXkubGVuZ3RoO1xyXG4gICAgd2hpbGUgKGxpbmVFbmQgPCB0ZXh0Lmxlbmd0aCAtIDEpIHtcclxuICAgICAgbGluZUVuZCA9IHRleHQuaW5kZXhPZignXFxuJywgbGluZVN0YXJ0KTtcclxuICAgICAgaWYgKGxpbmVFbmQgPT0gLTEpIHtcclxuICAgICAgICBsaW5lRW5kID0gdGV4dC5sZW5ndGggLSAxO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGxpbmUgPSB0ZXh0LnN1YnN0cmluZyhsaW5lU3RhcnQsIGxpbmVFbmQgKyAxKTtcclxuICAgICAgbGluZVN0YXJ0ID0gbGluZUVuZCArIDE7XHJcblxyXG4gICAgICBpZiAobGluZUhhc2guaGFzT3duUHJvcGVydHkgPyBsaW5lSGFzaC5oYXNPd25Qcm9wZXJ0eShsaW5lKSA6XHJcbiAgICAgICAgICAobGluZUhhc2hbbGluZV0gIT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgICBjaGFycyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGxpbmVIYXNoW2xpbmVdKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjaGFycyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGxpbmVBcnJheUxlbmd0aCk7XHJcbiAgICAgICAgbGluZUhhc2hbbGluZV0gPSBsaW5lQXJyYXlMZW5ndGg7XHJcbiAgICAgICAgbGluZUFycmF5W2xpbmVBcnJheUxlbmd0aCsrXSA9IGxpbmU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBjaGFycztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlaHlkcmF0ZSB0aGUgdGV4dCBpbiBhIGRpZmYgZnJvbSBhIHN0cmluZyBvZiBsaW5lIGhhc2hlcyB0byByZWFsIGxpbmVzIG9mXHJcbiAgICogdGV4dC5cclxuICAgKiBAcGFyYW0gIGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxyXG4gICAqIEBwYXJhbSAgbGluZUFycmF5IEFycmF5IG9mIHVuaXF1ZSBzdHJpbmdzLlxyXG5cclxuICAgKi9cclxuICAgIGRpZmZfY2hhcnNUb0xpbmVzXyAoZGlmZnM6IEFycmF5PERpZmY+LCBsaW5lQXJyYXk6IEFycmF5PHN0cmluZz4pOiB2b2lkIHtcclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgZGlmZnMubGVuZ3RoOyB4KyspIHtcclxuICAgICAgY29uc3QgY2hhcnMgPSBkaWZmc1t4XVsxXTtcclxuICAgICAgY29uc3QgdGV4dCA9IFtdO1xyXG4gICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGNoYXJzLmxlbmd0aDsgeSsrKSB7XHJcbiAgICAgICAgdGV4dFt5XSA9IGxpbmVBcnJheVtjaGFycy5jaGFyQ29kZUF0KHkpXTtcclxuICAgICAgfVxyXG4gICAgICBkaWZmc1t4XVsxXSA9IHRleHQuam9pbignJyk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIERldGVybWluZSB0aGUgY29tbW9uIHByZWZpeCBvZiB0d28gc3RyaW5ncy5cclxuICAgKiBAcGFyYW0gIHRleHQxIEZpcnN0IHN0cmluZy5cclxuICAgKiBAcGFyYW0gIHRleHQyIFNlY29uZCBzdHJpbmcuXHJcbiAgICogQHJldHVybiAgVGhlIG51bWJlciBvZiBjaGFyYWN0ZXJzIGNvbW1vbiB0byB0aGUgc3RhcnQgb2YgZWFjaFxyXG4gICAqICAgICBzdHJpbmcuXHJcbiAgICovXHJcbiAgICBkaWZmX2NvbW1vblByZWZpeCAodGV4dDE6IHN0cmluZywgdGV4dDI6IHN0cmluZyk6IG51bWJlciB7XHJcbiAgICAvLyBRdWljayBjaGVjayBmb3IgY29tbW9uIG51bGwgY2FzZXMuXHJcbiAgICBpZiAoIXRleHQxIHx8ICF0ZXh0MiB8fCB0ZXh0MS5jaGFyQXQoMCkgIT0gdGV4dDIuY2hhckF0KDApKSB7XHJcbiAgICAgIHJldHVybiAwO1xyXG4gICAgfVxyXG4gICAgLy8gQmluYXJ5IHNlYXJjaC5cclxuICAgIC8vIFBlcmZvcm1hbmNlIGFuYWx5c2lzOiBodHRwOi8vbmVpbC5mcmFzZXIubmFtZS9uZXdzLzIwMDcvMTAvMDkvXHJcbiAgICBsZXQgcG9pbnRlcm1pbiA9IDA7XHJcbiAgICBsZXQgcG9pbnRlcm1heCA9IE1hdGgubWluKHRleHQxLmxlbmd0aCwgdGV4dDIubGVuZ3RoKTtcclxuICAgIGxldCBwb2ludGVybWlkID0gcG9pbnRlcm1heDtcclxuICAgIGxldCBwb2ludGVyc3RhcnQgPSAwO1xyXG4gICAgd2hpbGUgKHBvaW50ZXJtaW4gPCBwb2ludGVybWlkKSB7XHJcbiAgICAgIGlmICh0ZXh0MS5zdWJzdHJpbmcocG9pbnRlcnN0YXJ0LCBwb2ludGVybWlkKSA9PVxyXG4gICAgICAgICAgdGV4dDIuc3Vic3RyaW5nKHBvaW50ZXJzdGFydCwgcG9pbnRlcm1pZCkpIHtcclxuICAgICAgICBwb2ludGVybWluID0gcG9pbnRlcm1pZDtcclxuICAgICAgICBwb2ludGVyc3RhcnQgPSBwb2ludGVybWluO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHBvaW50ZXJtYXggPSBwb2ludGVybWlkO1xyXG4gICAgICB9XHJcbiAgICAgIHBvaW50ZXJtaWQgPSBNYXRoLmZsb29yKChwb2ludGVybWF4IC0gcG9pbnRlcm1pbikgLyAyICsgcG9pbnRlcm1pbik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcG9pbnRlcm1pZDtcclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogRGV0ZXJtaW5lIHRoZSBjb21tb24gc3VmZml4IG9mIHR3byBzdHJpbmdzLlxyXG4gICAqIEBwYXJhbSAgdGV4dDEgRmlyc3Qgc3RyaW5nLlxyXG4gICAqIEBwYXJhbSAgdGV4dDIgU2Vjb25kIHN0cmluZy5cclxuICAgKiBAcmV0dXJuICBUaGUgbnVtYmVyIG9mIGNoYXJhY3RlcnMgY29tbW9uIHRvIHRoZSBlbmQgb2YgZWFjaCBzdHJpbmcuXHJcbiAgICovXHJcbiAgICBkaWZmX2NvbW1vblN1ZmZpeCAodGV4dDE6IHN0cmluZywgdGV4dDI6IHN0cmluZyk6IG51bWJlciB7XHJcbiAgICAvLyBRdWljayBjaGVjayBmb3IgY29tbW9uIG51bGwgY2FzZXMuXHJcbiAgICBpZiAoIXRleHQxIHx8ICF0ZXh0MiB8fFxyXG4gICAgICAgIHRleHQxLmNoYXJBdCh0ZXh0MS5sZW5ndGggLSAxKSAhPSB0ZXh0Mi5jaGFyQXQodGV4dDIubGVuZ3RoIC0gMSkpIHtcclxuICAgICAgcmV0dXJuIDA7XHJcbiAgICB9XHJcbiAgICAvLyBCaW5hcnkgc2VhcmNoLlxyXG4gICAgLy8gUGVyZm9ybWFuY2UgYW5hbHlzaXM6IGh0dHA6Ly9uZWlsLmZyYXNlci5uYW1lL25ld3MvMjAwNy8xMC8wOS9cclxuICAgIGxldCBwb2ludGVybWluID0gMDtcclxuICAgIGxldCBwb2ludGVybWF4ID0gTWF0aC5taW4odGV4dDEubGVuZ3RoLCB0ZXh0Mi5sZW5ndGgpO1xyXG4gICAgbGV0IHBvaW50ZXJtaWQgPSBwb2ludGVybWF4O1xyXG4gICAgbGV0IHBvaW50ZXJlbmQgPSAwO1xyXG4gICAgd2hpbGUgKHBvaW50ZXJtaW4gPCBwb2ludGVybWlkKSB7XHJcbiAgICAgIGlmICh0ZXh0MS5zdWJzdHJpbmcodGV4dDEubGVuZ3RoIC0gcG9pbnRlcm1pZCwgdGV4dDEubGVuZ3RoIC0gcG9pbnRlcmVuZCkgPT1cclxuICAgICAgICAgIHRleHQyLnN1YnN0cmluZyh0ZXh0Mi5sZW5ndGggLSBwb2ludGVybWlkLCB0ZXh0Mi5sZW5ndGggLSBwb2ludGVyZW5kKSkge1xyXG4gICAgICAgIHBvaW50ZXJtaW4gPSBwb2ludGVybWlkO1xyXG4gICAgICAgIHBvaW50ZXJlbmQgPSBwb2ludGVybWluO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHBvaW50ZXJtYXggPSBwb2ludGVybWlkO1xyXG4gICAgICB9XHJcbiAgICAgIHBvaW50ZXJtaWQgPSBNYXRoLmZsb29yKChwb2ludGVybWF4IC0gcG9pbnRlcm1pbikgLyAyICsgcG9pbnRlcm1pbik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcG9pbnRlcm1pZDtcclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogRGV0ZXJtaW5lIGlmIHRoZSBzdWZmaXggb2Ygb25lIHN0cmluZyBpcyB0aGUgcHJlZml4IG9mIGFub3RoZXIuXHJcbiAgICogQHBhcmFtICB0ZXh0MSBGaXJzdCBzdHJpbmcuXHJcbiAgICogQHBhcmFtICB0ZXh0MiBTZWNvbmQgc3RyaW5nLlxyXG4gICAqIEByZXR1cm4gIFRoZSBudW1iZXIgb2YgY2hhcmFjdGVycyBjb21tb24gdG8gdGhlIGVuZCBvZiB0aGUgZmlyc3RcclxuICAgKiAgICAgc3RyaW5nIGFuZCB0aGUgc3RhcnQgb2YgdGhlIHNlY29uZCBzdHJpbmcuXHJcblxyXG4gICAqL1xyXG4gICAgZGlmZl9jb21tb25PdmVybGFwXyAodGV4dDE6IHN0cmluZywgdGV4dDI6IHN0cmluZyk6IG51bWJlciB7XHJcbiAgICAvLyBDYWNoZSB0aGUgdGV4dCBsZW5ndGhzIHRvIHByZXZlbnQgbXVsdGlwbGUgY2FsbHMuXHJcbiAgICBjb25zdCB0ZXh0MV9sZW5ndGggPSB0ZXh0MS5sZW5ndGg7XHJcbiAgICBjb25zdCB0ZXh0Ml9sZW5ndGggPSB0ZXh0Mi5sZW5ndGg7XHJcbiAgICAvLyBFbGltaW5hdGUgdGhlIG51bGwgY2FzZS5cclxuICAgIGlmICh0ZXh0MV9sZW5ndGggPT0gMCB8fCB0ZXh0Ml9sZW5ndGggPT0gMCkge1xyXG4gICAgICByZXR1cm4gMDtcclxuICAgIH1cclxuICAgIC8vIFRydW5jYXRlIHRoZSBsb25nZXIgc3RyaW5nLlxyXG4gICAgaWYgKHRleHQxX2xlbmd0aCA+IHRleHQyX2xlbmd0aCkge1xyXG4gICAgICB0ZXh0MSA9IHRleHQxLnN1YnN0cmluZyh0ZXh0MV9sZW5ndGggLSB0ZXh0Ml9sZW5ndGgpO1xyXG4gICAgfSBlbHNlIGlmICh0ZXh0MV9sZW5ndGggPCB0ZXh0Ml9sZW5ndGgpIHtcclxuICAgICAgdGV4dDIgPSB0ZXh0Mi5zdWJzdHJpbmcoMCwgdGV4dDFfbGVuZ3RoKTtcclxuICAgIH1cclxuICAgIGNvbnN0IHRleHRfbGVuZ3RoID0gTWF0aC5taW4odGV4dDFfbGVuZ3RoLCB0ZXh0Ml9sZW5ndGgpO1xyXG4gICAgLy8gUXVpY2sgY2hlY2sgZm9yIHRoZSB3b3JzdCBjYXNlLlxyXG4gICAgaWYgKHRleHQxID09IHRleHQyKSB7XHJcbiAgICAgIHJldHVybiB0ZXh0X2xlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTdGFydCBieSBsb29raW5nIGZvciBhIHNpbmdsZSBjaGFyYWN0ZXIgbWF0Y2hcclxuICAgIC8vIGFuZCBpbmNyZWFzZSBsZW5ndGggdW50aWwgbm8gbWF0Y2ggaXMgZm91bmQuXHJcbiAgICAvLyBQZXJmb3JtYW5jZSBhbmFseXNpczogaHR0cDovL25laWwuZnJhc2VyLm5hbWUvbmV3cy8yMDEwLzExLzA0L1xyXG4gICAgbGV0IGJlc3QgPSAwO1xyXG4gICAgbGV0IGxlbmd0aCA9IDE7XHJcbiAgICB3aGlsZSAodHJ1ZSkge1xyXG4gICAgICBjb25zdCBwYXR0ZXJuID0gdGV4dDEuc3Vic3RyaW5nKHRleHRfbGVuZ3RoIC0gbGVuZ3RoKTtcclxuICAgICAgY29uc3QgZm91bmQgPSB0ZXh0Mi5pbmRleE9mKHBhdHRlcm4pO1xyXG4gICAgICBpZiAoZm91bmQgPT0gLTEpIHtcclxuICAgICAgICByZXR1cm4gYmVzdDtcclxuICAgICAgfVxyXG4gICAgICBsZW5ndGggKz0gZm91bmQ7XHJcbiAgICAgIGlmIChmb3VuZCA9PSAwIHx8IHRleHQxLnN1YnN0cmluZyh0ZXh0X2xlbmd0aCAtIGxlbmd0aCkgPT1cclxuICAgICAgICAgIHRleHQyLnN1YnN0cmluZygwLCBsZW5ndGgpKSB7XHJcbiAgICAgICAgYmVzdCA9IGxlbmd0aDtcclxuICAgICAgICBsZW5ndGgrKztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBEbyB0aGUgdHdvIHRleHRzIHNoYXJlIGEgc3Vic3RyaW5nIHdoaWNoIGlzIGF0IGxlYXN0IGhhbGYgdGhlIGxlbmd0aCBvZiB0aGVcclxuICAgKiBsb25nZXIgdGV4dD9cclxuICAgKiBUaGlzIHNwZWVkdXAgY2FuIHByb2R1Y2Ugbm9uLW1pbmltYWwgZGlmZnMuXHJcbiAgICogQHBhcmFtICB0ZXh0MSBGaXJzdCBzdHJpbmcuXHJcbiAgICogQHBhcmFtICB0ZXh0MiBTZWNvbmQgc3RyaW5nLlxyXG4gICAqIEByZXR1cm4gIEZpdmUgZWxlbWVudCBBcnJheSwgY29udGFpbmluZyB0aGUgcHJlZml4IG9mXHJcbiAgICogICAgIHRleHQxLCB0aGUgc3VmZml4IG9mIHRleHQxLCB0aGUgcHJlZml4IG9mIHRleHQyLCB0aGUgc3VmZml4IG9mXHJcbiAgICogICAgIHRleHQyIGFuZCB0aGUgY29tbW9uIG1pZGRsZS4gIE9yIG51bGwgaWYgdGhlcmUgd2FzIG5vIG1hdGNoLlxyXG5cclxuICAgKi9cclxuICAgIGRpZmZfaGFsZk1hdGNoXyAodGV4dDE6IHN0cmluZywgdGV4dDI6IHN0cmluZykge1xyXG4gICAgaWYgKHRoaXMuRGlmZl9UaW1lb3V0IDw9IDApIHtcclxuICAgICAgLy8gRG9uJ3QgcmlzayByZXR1cm5pbmcgYSBub24tb3B0aW1hbCBkaWZmIGlmIHdlIGhhdmUgdW5saW1pdGVkIHRpbWUuXHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbG9uZ3RleHQgPSB0ZXh0MS5sZW5ndGggPiB0ZXh0Mi5sZW5ndGggPyB0ZXh0MSA6IHRleHQyO1xyXG4gICAgY29uc3Qgc2hvcnR0ZXh0ID0gdGV4dDEubGVuZ3RoID4gdGV4dDIubGVuZ3RoID8gdGV4dDIgOiB0ZXh0MTtcclxuICAgIGlmIChsb25ndGV4dC5sZW5ndGggPCA0IHx8IHNob3J0dGV4dC5sZW5ndGggKiAyIDwgbG9uZ3RleHQubGVuZ3RoKSB7XHJcbiAgICAgIHJldHVybiBudWxsOyAgLy8gUG9pbnRsZXNzLlxyXG4gICAgfVxyXG4gICAgY29uc3QgZG1wID0gdGhpczsgIC8vICd0aGlzJyBiZWNvbWVzICd3aW5kb3cnIGluIGEgY2xvc3VyZS5cclxuXHJcblxyXG4gICAgLy8gRmlyc3QgY2hlY2sgaWYgdGhlIHNlY29uZCBxdWFydGVyIGlzIHRoZSBzZWVkIGZvciBhIGhhbGYtbWF0Y2guXHJcbiAgICBjb25zdCBobTEgPSB0aGlzLmRpZmZfaGFsZk1hdGNoSV8obG9uZ3RleHQsIHNob3J0dGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5jZWlsKGxvbmd0ZXh0Lmxlbmd0aCAvIDQpLCBkbXApO1xyXG4gICAgLy8gQ2hlY2sgYWdhaW4gYmFzZWQgb24gdGhlIHRoaXJkIHF1YXJ0ZXIuXHJcbiAgICBjb25zdCBobTIgPSB0aGlzLmRpZmZfaGFsZk1hdGNoSV8obG9uZ3RleHQsIHNob3J0dGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5jZWlsKGxvbmd0ZXh0Lmxlbmd0aCAvIDIpLCBkbXApO1xyXG4gICAgbGV0IGhtO1xyXG4gICAgaWYgKCFobTEgJiYgIWhtMikge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH0gZWxzZSBpZiAoIWhtMikge1xyXG4gICAgICBobSA9IGhtMTtcclxuICAgIH0gZWxzZSBpZiAoIWhtMSkge1xyXG4gICAgICBobSA9IGhtMjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIEJvdGggbWF0Y2hlZC4gIFNlbGVjdCB0aGUgbG9uZ2VzdC5cclxuICAgICAgaG0gPSBobTFbNF0ubGVuZ3RoID4gaG0yWzRdLmxlbmd0aCA/IGhtMSA6IGhtMjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBBIGhhbGYtbWF0Y2ggd2FzIGZvdW5kLCBzb3J0IG91dCB0aGUgcmV0dXJuIGRhdGEuXHJcbiAgICBsZXQgdGV4dDFfYSwgdGV4dDFfYiwgdGV4dDJfYSwgdGV4dDJfYjtcclxuICAgIGlmICh0ZXh0MS5sZW5ndGggPiB0ZXh0Mi5sZW5ndGgpIHtcclxuICAgICAgdGV4dDFfYSA9IGhtWzBdO1xyXG4gICAgICB0ZXh0MV9iID0gaG1bMV07XHJcbiAgICAgIHRleHQyX2EgPSBobVsyXTtcclxuICAgICAgdGV4dDJfYiA9IGhtWzNdO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGV4dDJfYSA9IGhtWzBdO1xyXG4gICAgICB0ZXh0Ml9iID0gaG1bMV07XHJcbiAgICAgIHRleHQxX2EgPSBobVsyXTtcclxuICAgICAgdGV4dDFfYiA9IGhtWzNdO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbWlkX2NvbW1vbiA9IGhtWzRdO1xyXG4gICAgcmV0dXJuIFt0ZXh0MV9hLCB0ZXh0MV9iLCB0ZXh0Ml9hLCB0ZXh0Ml9iLCBtaWRfY29tbW9uXTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBEb2VzIGEgc3Vic3RyaW5nIG9mIHNob3J0dGV4dCBleGlzdCB3aXRoaW4gbG9uZ3RleHQgc3VjaCB0aGF0IHRoZSBzdWJzdHJpbmdcclxuICAgKiBpcyBhdCBsZWFzdCBoYWxmIHRoZSBsZW5ndGggb2YgbG9uZ3RleHQ/XHJcbiAgICogQ2xvc3VyZSwgYnV0IGRvZXMgbm90IHJlZmVyZW5jZSBhbnkgZXh0ZXJuYWwgY29uc3RpYWJsZXMuXHJcbiAgICogQHBhcmFtICBsb25ndGV4dCBMb25nZXIgc3RyaW5nLlxyXG4gICAqIEBwYXJhbSAgc2hvcnR0ZXh0IFNob3J0ZXIgc3RyaW5nLlxyXG4gICAqIEBwYXJhbSAgaSBTdGFydCBpbmRleCBvZiBxdWFydGVyIGxlbmd0aCBzdWJzdHJpbmcgd2l0aGluIGxvbmd0ZXh0LlxyXG4gICAqIEByZXR1cm4gIEZpdmUgZWxlbWVudCBBcnJheSwgY29udGFpbmluZyB0aGUgcHJlZml4IG9mXHJcbiAgICogICAgIGxvbmd0ZXh0LCB0aGUgc3VmZml4IG9mIGxvbmd0ZXh0LCB0aGUgcHJlZml4IG9mIHNob3J0dGV4dCwgdGhlIHN1ZmZpeFxyXG4gICAqICAgICBvZiBzaG9ydHRleHQgYW5kIHRoZSBjb21tb24gbWlkZGxlLiAgT3IgbnVsbCBpZiB0aGVyZSB3YXMgbm8gbWF0Y2guXHJcblxyXG4gICAqL1xyXG4gIGRpZmZfaGFsZk1hdGNoSV8obG9uZ3RleHQ6IHN0cmluZywgc2hvcnR0ZXh0OiBzdHJpbmcsIGk6IG51bWJlciwgZG1wOiBEaWZmTWF0Y2hQYXRjaCk6IEFycmF5PHN0cmluZz4ge1xyXG4gICAgLy8gU3RhcnQgd2l0aCBhIDEvNCBsZW5ndGggc3Vic3RyaW5nIGF0IHBvc2l0aW9uIGkgYXMgYSBzZWVkLlxyXG4gICAgY29uc3Qgc2VlZCA9IGxvbmd0ZXh0LnN1YnN0cmluZyhpLCBpICsgTWF0aC5mbG9vcihsb25ndGV4dC5sZW5ndGggLyA0KSk7XHJcbiAgICBsZXQgaiA9IC0xO1xyXG4gICAgbGV0IGJlc3RfY29tbW9uID0gJyc7XHJcbiAgICBsZXQgYmVzdF9sb25ndGV4dF9hLCBiZXN0X2xvbmd0ZXh0X2IsIGJlc3Rfc2hvcnR0ZXh0X2EsIGJlc3Rfc2hvcnR0ZXh0X2I7XHJcbiAgICB3aGlsZSAoKGogPSBzaG9ydHRleHQuaW5kZXhPZihzZWVkLCBqICsgMSkpICE9IC0xKSB7XHJcbiAgICAgIGNvbnN0IHByZWZpeExlbmd0aCA9IGRtcC5kaWZmX2NvbW1vblByZWZpeChsb25ndGV4dC5zdWJzdHJpbmcoaSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG9ydHRleHQuc3Vic3RyaW5nKGopKTtcclxuICAgICAgY29uc3Qgc3VmZml4TGVuZ3RoID0gZG1wLmRpZmZfY29tbW9uU3VmZml4KGxvbmd0ZXh0LnN1YnN0cmluZygwLCBpKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3J0dGV4dC5zdWJzdHJpbmcoMCwgaikpO1xyXG4gICAgICBpZiAoYmVzdF9jb21tb24ubGVuZ3RoIDwgc3VmZml4TGVuZ3RoICsgcHJlZml4TGVuZ3RoKSB7XHJcbiAgICAgICAgYmVzdF9jb21tb24gPSBzaG9ydHRleHQuc3Vic3RyaW5nKGogLSBzdWZmaXhMZW5ndGgsIGopICtcclxuICAgICAgICAgICAgc2hvcnR0ZXh0LnN1YnN0cmluZyhqLCBqICsgcHJlZml4TGVuZ3RoKTtcclxuICAgICAgICBiZXN0X2xvbmd0ZXh0X2EgPSBsb25ndGV4dC5zdWJzdHJpbmcoMCwgaSAtIHN1ZmZpeExlbmd0aCk7XHJcbiAgICAgICAgYmVzdF9sb25ndGV4dF9iID0gbG9uZ3RleHQuc3Vic3RyaW5nKGkgKyBwcmVmaXhMZW5ndGgpO1xyXG4gICAgICAgIGJlc3Rfc2hvcnR0ZXh0X2EgPSBzaG9ydHRleHQuc3Vic3RyaW5nKDAsIGogLSBzdWZmaXhMZW5ndGgpO1xyXG4gICAgICAgIGJlc3Rfc2hvcnR0ZXh0X2IgPSBzaG9ydHRleHQuc3Vic3RyaW5nKGogKyBwcmVmaXhMZW5ndGgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAoYmVzdF9jb21tb24ubGVuZ3RoICogMiA+PSBsb25ndGV4dC5sZW5ndGgpIHtcclxuICAgICAgcmV0dXJuIFtiZXN0X2xvbmd0ZXh0X2EsIGJlc3RfbG9uZ3RleHRfYixcclxuICAgICAgICAgICAgICBiZXN0X3Nob3J0dGV4dF9hLCBiZXN0X3Nob3J0dGV4dF9iLCBiZXN0X2NvbW1vbl07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlZHVjZSB0aGUgbnVtYmVyIG9mIGVkaXRzIGJ5IGVsaW1pbmF0aW5nIHNlbWFudGljYWxseSB0cml2aWFsIGVxdWFsaXRpZXMuXHJcbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cclxuICAgKi9cclxuICAgIGRpZmZfY2xlYW51cFNlbWFudGljIChkaWZmczogQXJyYXk8RGlmZj4pIHtcclxuICAgIGxldCBjaGFuZ2VzID0gZmFsc2U7XHJcbiAgICBjb25zdCBlcXVhbGl0aWVzID0gW107ICAvLyBTdGFjayBvZiBpbmRpY2VzIHdoZXJlIGVxdWFsaXRpZXMgYXJlIGZvdW5kLlxyXG4gICAgbGV0IGVxdWFsaXRpZXNMZW5ndGggPSAwOyAgLy8gS2VlcGluZyBvdXIgb3duIGxlbmd0aCBjb25zdCBpcyBmYXN0ZXIgaW4gSlMuXHJcblxyXG4gICAgbGV0IGxhc3RlcXVhbGl0eSA9IG51bGw7XHJcbiAgICAvLyBBbHdheXMgZXF1YWwgdG8gZGlmZnNbZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoIC0gMV1dWzFdXHJcbiAgICBsZXQgcG9pbnRlciA9IDA7ICAvLyBJbmRleCBvZiBjdXJyZW50IHBvc2l0aW9uLlxyXG4gICAgLy8gTnVtYmVyIG9mIGNoYXJhY3RlcnMgdGhhdCBjaGFuZ2VkIHByaW9yIHRvIHRoZSBlcXVhbGl0eS5cclxuICAgIGxldCBsZW5ndGhfaW5zZXJ0aW9uczEgPSAwO1xyXG4gICAgbGV0IGxlbmd0aF9kZWxldGlvbnMxID0gMDtcclxuICAgIC8vIE51bWJlciBvZiBjaGFyYWN0ZXJzIHRoYXQgY2hhbmdlZCBhZnRlciB0aGUgZXF1YWxpdHkuXHJcbiAgICBsZXQgbGVuZ3RoX2luc2VydGlvbnMyID0gMDtcclxuICAgIGxldCBsZW5ndGhfZGVsZXRpb25zMiA9IDA7XHJcbiAgICB3aGlsZSAocG9pbnRlciA8IGRpZmZzLmxlbmd0aCkge1xyXG4gICAgICBpZiAoZGlmZnNbcG9pbnRlcl1bMF0gPT0gRGlmZk9wLkVxdWFsKSB7ICAvLyBFcXVhbGl0eSBmb3VuZC5cclxuICAgICAgICBlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGgrK10gPSBwb2ludGVyO1xyXG4gICAgICAgIGxlbmd0aF9pbnNlcnRpb25zMSA9IGxlbmd0aF9pbnNlcnRpb25zMjtcclxuICAgICAgICBsZW5ndGhfZGVsZXRpb25zMSA9IGxlbmd0aF9kZWxldGlvbnMyO1xyXG4gICAgICAgIGxlbmd0aF9pbnNlcnRpb25zMiA9IDA7XHJcbiAgICAgICAgbGVuZ3RoX2RlbGV0aW9uczIgPSAwO1xyXG4gICAgICAgIGxhc3RlcXVhbGl0eSA9IGRpZmZzW3BvaW50ZXJdWzFdO1xyXG4gICAgICB9IGVsc2UgeyAgLy8gQW4gaW5zZXJ0aW9uIG9yIGRlbGV0aW9uLlxyXG4gICAgICAgIGlmIChkaWZmc1twb2ludGVyXVswXSA9PSBEaWZmT3AuSW5zZXJ0KSB7XHJcbiAgICAgICAgICBsZW5ndGhfaW5zZXJ0aW9uczIgKz0gZGlmZnNbcG9pbnRlcl1bMV0ubGVuZ3RoO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBsZW5ndGhfZGVsZXRpb25zMiArPSBkaWZmc1twb2ludGVyXVsxXS5sZW5ndGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEVsaW1pbmF0ZSBhbiBlcXVhbGl0eSB0aGF0IGlzIHNtYWxsZXIgb3IgZXF1YWwgdG8gdGhlIGVkaXRzIG9uIGJvdGhcclxuICAgICAgICAvLyBzaWRlcyBvZiBpdC5cclxuICAgICAgICBpZiAobGFzdGVxdWFsaXR5ICYmIChsYXN0ZXF1YWxpdHkubGVuZ3RoIDw9XHJcbiAgICAgICAgICAgIE1hdGgubWF4KGxlbmd0aF9pbnNlcnRpb25zMSwgbGVuZ3RoX2RlbGV0aW9uczEpKSAmJlxyXG4gICAgICAgICAgICAobGFzdGVxdWFsaXR5Lmxlbmd0aCA8PSBNYXRoLm1heChsZW5ndGhfaW5zZXJ0aW9uczIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVuZ3RoX2RlbGV0aW9uczIpKSkge1xyXG4gICAgICAgICAgLy8gRHVwbGljYXRlIHJlY29yZC5cclxuICAgICAgICAgIGRpZmZzLnNwbGljZShlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGggLSAxXSwgMCxcclxuICAgICAgICAgICAgICAgICAgICAgIFtEaWZmT3AuRGVsZXRlLCBsYXN0ZXF1YWxpdHldKTtcclxuICAgICAgICAgIC8vIENoYW5nZSBzZWNvbmQgY29weSB0byBpbnNlcnQuXHJcbiAgICAgICAgICBkaWZmc1tlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGggLSAxXSArIDFdWzBdID0gRGlmZk9wLkluc2VydDtcclxuICAgICAgICAgIC8vIFRocm93IGF3YXkgdGhlIGVxdWFsaXR5IHdlIGp1c3QgZGVsZXRlZC5cclxuICAgICAgICAgIGVxdWFsaXRpZXNMZW5ndGgtLTtcclxuICAgICAgICAgIC8vIFRocm93IGF3YXkgdGhlIHByZXZpb3VzIGVxdWFsaXR5IChpdCBuZWVkcyB0byBiZSByZWV2YWx1YXRlZCkuXHJcbiAgICAgICAgICBlcXVhbGl0aWVzTGVuZ3RoLS07XHJcbiAgICAgICAgICBwb2ludGVyID0gZXF1YWxpdGllc0xlbmd0aCA+IDAgPyBlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGggLSAxXSA6IC0xO1xyXG4gICAgICAgICAgbGVuZ3RoX2luc2VydGlvbnMxID0gMDsgIC8vIFJlc2V0IHRoZSBjb3VudGVycy5cclxuICAgICAgICAgIGxlbmd0aF9kZWxldGlvbnMxID0gMDtcclxuICAgICAgICAgIGxlbmd0aF9pbnNlcnRpb25zMiA9IDA7XHJcbiAgICAgICAgICBsZW5ndGhfZGVsZXRpb25zMiA9IDA7XHJcbiAgICAgICAgICBsYXN0ZXF1YWxpdHkgPSBudWxsO1xyXG4gICAgICAgICAgY2hhbmdlcyA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHBvaW50ZXIrKztcclxuICAgIH1cclxuXHJcbiAgICAvLyBOb3JtYWxpemUgdGhlIGRpZmYuXHJcbiAgICBpZiAoY2hhbmdlcykge1xyXG4gICAgICB0aGlzLmRpZmZfY2xlYW51cE1lcmdlKGRpZmZzKTtcclxuICAgIH1cclxuICAgIHRoaXMuZGlmZl9jbGVhbnVwU2VtYW50aWNMb3NzbGVzcyhkaWZmcyk7XHJcblxyXG4gICAgLy8gRmluZCBhbnkgb3ZlcmxhcHMgYmV0d2VlbiBkZWxldGlvbnMgYW5kIGluc2VydGlvbnMuXHJcbiAgICAvLyBlLmc6IDxkZWw+YWJjeHh4PC9kZWw+PGlucz54eHhkZWY8L2lucz5cclxuICAgIC8vICAgLT4gPGRlbD5hYmM8L2RlbD54eHg8aW5zPmRlZjwvaW5zPlxyXG4gICAgLy8gZS5nOiA8ZGVsPnh4eGFiYzwvZGVsPjxpbnM+ZGVmeHh4PC9pbnM+XHJcbiAgICAvLyAgIC0+IDxpbnM+ZGVmPC9pbnM+eHh4PGRlbD5hYmM8L2RlbD5cclxuICAgIC8vIE9ubHkgZXh0cmFjdCBhbiBvdmVybGFwIGlmIGl0IGlzIGFzIGJpZyBhcyB0aGUgZWRpdCBhaGVhZCBvciBiZWhpbmQgaXQuXHJcbiAgICBwb2ludGVyID0gMTtcclxuICAgIHdoaWxlIChwb2ludGVyIDwgZGlmZnMubGVuZ3RoKSB7XHJcbiAgICAgIGlmIChkaWZmc1twb2ludGVyIC0gMV1bMF0gPT0gRGlmZk9wLkRlbGV0ZSAmJlxyXG4gICAgICAgICAgZGlmZnNbcG9pbnRlcl1bMF0gPT0gRGlmZk9wLkluc2VydCkge1xyXG4gICAgICAgIGNvbnN0IGRlbGV0aW9uID0gZGlmZnNbcG9pbnRlciAtIDFdWzFdO1xyXG4gICAgICAgIGNvbnN0IGluc2VydGlvbiA9IGRpZmZzW3BvaW50ZXJdWzFdO1xyXG4gICAgICAgIGNvbnN0IG92ZXJsYXBfbGVuZ3RoMSA9IHRoaXMuZGlmZl9jb21tb25PdmVybGFwXyhkZWxldGlvbiwgaW5zZXJ0aW9uKTtcclxuICAgICAgICBjb25zdCBvdmVybGFwX2xlbmd0aDIgPSB0aGlzLmRpZmZfY29tbW9uT3ZlcmxhcF8oaW5zZXJ0aW9uLCBkZWxldGlvbik7XHJcbiAgICAgICAgaWYgKG92ZXJsYXBfbGVuZ3RoMSA+PSBvdmVybGFwX2xlbmd0aDIpIHtcclxuICAgICAgICAgIGlmIChvdmVybGFwX2xlbmd0aDEgPj0gZGVsZXRpb24ubGVuZ3RoIC8gMiB8fFxyXG4gICAgICAgICAgICAgIG92ZXJsYXBfbGVuZ3RoMSA+PSBpbnNlcnRpb24ubGVuZ3RoIC8gMikge1xyXG4gICAgICAgICAgICAvLyBPdmVybGFwIGZvdW5kLiAgSW5zZXJ0IGFuIGVxdWFsaXR5IGFuZCB0cmltIHRoZSBzdXJyb3VuZGluZyBlZGl0cy5cclxuICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIsIDAsXHJcbiAgICAgICAgICAgICAgICBbRGlmZk9wLkVxdWFsLCBpbnNlcnRpb24uc3Vic3RyaW5nKDAsIG92ZXJsYXBfbGVuZ3RoMSldKTtcclxuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciAtIDFdWzFdID1cclxuICAgICAgICAgICAgICAgIGRlbGV0aW9uLnN1YnN0cmluZygwLCBkZWxldGlvbi5sZW5ndGggLSBvdmVybGFwX2xlbmd0aDEpO1xyXG4gICAgICAgICAgICBkaWZmc1twb2ludGVyICsgMV1bMV0gPSBpbnNlcnRpb24uc3Vic3RyaW5nKG92ZXJsYXBfbGVuZ3RoMSk7XHJcbiAgICAgICAgICAgIHBvaW50ZXIrKztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYgKG92ZXJsYXBfbGVuZ3RoMiA+PSBkZWxldGlvbi5sZW5ndGggLyAyIHx8XHJcbiAgICAgICAgICAgICAgb3ZlcmxhcF9sZW5ndGgyID49IGluc2VydGlvbi5sZW5ndGggLyAyKSB7XHJcbiAgICAgICAgICAgIC8vIFJldmVyc2Ugb3ZlcmxhcCBmb3VuZC5cclxuICAgICAgICAgICAgLy8gSW5zZXJ0IGFuIGVxdWFsaXR5IGFuZCBzd2FwIGFuZCB0cmltIHRoZSBzdXJyb3VuZGluZyBlZGl0cy5cclxuICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIsIDAsXHJcbiAgICAgICAgICAgICAgICBbRGlmZk9wLkVxdWFsLCBkZWxldGlvbi5zdWJzdHJpbmcoMCwgb3ZlcmxhcF9sZW5ndGgyKV0pO1xyXG4gICAgICAgICAgICBkaWZmc1twb2ludGVyIC0gMV1bMF0gPSBEaWZmT3AuSW5zZXJ0O1xyXG4gICAgICAgICAgICBkaWZmc1twb2ludGVyIC0gMV1bMV0gPVxyXG4gICAgICAgICAgICAgICAgaW5zZXJ0aW9uLnN1YnN0cmluZygwLCBpbnNlcnRpb24ubGVuZ3RoIC0gb3ZlcmxhcF9sZW5ndGgyKTtcclxuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciArIDFdWzBdID0gRGlmZk9wLkRlbGV0ZTtcclxuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciArIDFdWzFdID1cclxuICAgICAgICAgICAgICAgIGRlbGV0aW9uLnN1YnN0cmluZyhvdmVybGFwX2xlbmd0aDIpO1xyXG4gICAgICAgICAgICBwb2ludGVyKys7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHBvaW50ZXIrKztcclxuICAgICAgfVxyXG4gICAgICBwb2ludGVyKys7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIExvb2sgZm9yIHNpbmdsZSBlZGl0cyBzdXJyb3VuZGVkIG9uIGJvdGggc2lkZXMgYnkgZXF1YWxpdGllc1xyXG4gICAqIHdoaWNoIGNhbiBiZSBzaGlmdGVkIHNpZGV3YXlzIHRvIGFsaWduIHRoZSBlZGl0IHRvIGEgd29yZCBib3VuZGFyeS5cclxuICAgKiBlLmc6IFRoZSBjPGlucz5hdCBjPC9pbnM+YW1lLiAtPiBUaGUgPGlucz5jYXQgPC9pbnM+Y2FtZS5cclxuICAgKiBAcGFyYW0gIGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxyXG4gICAqL1xyXG4gICAgZGlmZl9jbGVhbnVwU2VtYW50aWNMb3NzbGVzcyAoZGlmZnM6IEFycmF5PERpZmY+KSB7XHJcbiAgICAvKipcclxuICAgICAqIEdpdmVuIHR3byBzdHJpbmdzLCBjb21wdXRlIGEgc2NvcmUgcmVwcmVzZW50aW5nIHdoZXRoZXIgdGhlIGludGVybmFsXHJcbiAgICAgKiBib3VuZGFyeSBmYWxscyBvbiBsb2dpY2FsIGJvdW5kYXJpZXMuXHJcbiAgICAgKiBTY29yZXMgcmFuZ2UgZnJvbSA2IChiZXN0KSB0byAwICh3b3JzdCkuXHJcbiAgICAgKiBDbG9zdXJlLCBidXQgZG9lcyBub3QgcmVmZXJlbmNlIGFueSBleHRlcm5hbCBjb25zdGlhYmxlcy5cclxuICAgICAqIEBwYXJhbSAgb25lIEZpcnN0IHN0cmluZy5cclxuICAgICAqIEBwYXJhbSAgdHdvIFNlY29uZCBzdHJpbmcuXHJcbiAgICAgKiBAcmV0dXJuICBUaGUgc2NvcmUuXHJcblxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBkaWZmX2NsZWFudXBTZW1hbnRpY1Njb3JlXyhvbmU6IHN0cmluZywgdHdvOiBzdHJpbmcpOiBudW1iZXIge1xyXG4gICAgICBpZiAoIW9uZSB8fCAhdHdvKSB7XHJcbiAgICAgICAgLy8gRWRnZXMgYXJlIHRoZSBiZXN0LlxyXG4gICAgICAgIHJldHVybiA2O1xyXG4gICAgICB9XHJcblxyXG5cclxuICAgICAgY29uc3Qgbm9uQWxwaGFOdW1lcmljUmVnZXhfID0gbmV3IFJlZ0V4cCgnL1teYS16QS1aMC05XS8nKTtcclxuXHJcbiAgICAgIC8vIEVhY2ggcG9ydCBvZiB0aGlzIGZ1bmN0aW9uIGJlaGF2ZXMgc2xpZ2h0bHkgZGlmZmVyZW50bHkgZHVlIHRvXHJcbiAgICAgIC8vIHN1YnRsZSBkaWZmZXJlbmNlcyBpbiBlYWNoIGxhbmd1YWdlJ3MgZGVmaW5pdGlvbiBvZiB0aGluZ3MgbGlrZVxyXG4gICAgICAvLyAnd2hpdGVzcGFjZScuICBTaW5jZSB0aGlzIGZ1bmN0aW9uJ3MgcHVycG9zZSBpcyBsYXJnZWx5IGNvc21ldGljLFxyXG4gICAgICAvLyB0aGUgY2hvaWNlIGhhcyBiZWVuIG1hZGUgdG8gdXNlIGVhY2ggbGFuZ3VhZ2UncyBuYXRpdmUgZmVhdHVyZXNcclxuICAgICAgLy8gcmF0aGVyIHRoYW4gZm9yY2UgdG90YWwgY29uZm9ybWl0eS5cclxuICAgICAgY29uc3QgY2hhcjEgPSBvbmUuY2hhckF0KG9uZS5sZW5ndGggLSAxKTtcclxuICAgICAgY29uc3QgY2hhcjIgPSB0d28uY2hhckF0KDApO1xyXG4gICAgICBjb25zdCBub25BbHBoYU51bWVyaWMxID0gY2hhcjEubWF0Y2gobm9uQWxwaGFOdW1lcmljUmVnZXhfKTtcclxuICAgICAgY29uc3Qgbm9uQWxwaGFOdW1lcmljMiA9IGNoYXIyLm1hdGNoKG5vbkFscGhhTnVtZXJpY1JlZ2V4Xyk7XHJcbiAgICAgIGNvbnN0IHdoaXRlc3BhY2UxID0gbm9uQWxwaGFOdW1lcmljMSAmJlxyXG4gICAgICAgICAgY2hhcjEubWF0Y2godGhpcy53aGl0ZXNwYWNlUmVnZXhfKTtcclxuICAgICAgY29uc3Qgd2hpdGVzcGFjZTIgPSBub25BbHBoYU51bWVyaWMyICYmXHJcbiAgICAgICAgICBjaGFyMi5tYXRjaCh0aGlzLndoaXRlc3BhY2VSZWdleF8pO1xyXG4gICAgICBjb25zdCBsaW5lQnJlYWsxID0gd2hpdGVzcGFjZTEgJiZcclxuICAgICAgICAgIGNoYXIxLm1hdGNoKHRoaXMubGluZWJyZWFrUmVnZXhfKTtcclxuICAgICAgY29uc3QgbGluZUJyZWFrMiA9IHdoaXRlc3BhY2UyICYmXHJcbiAgICAgICAgICBjaGFyMi5tYXRjaCh0aGlzLmxpbmVicmVha1JlZ2V4Xyk7XHJcbiAgICAgIGNvbnN0IGJsYW5rTGluZTEgPSBsaW5lQnJlYWsxICYmXHJcbiAgICAgICAgICBvbmUubWF0Y2godGhpcy5ibGFua2xpbmVFbmRSZWdleF8pO1xyXG4gICAgICBjb25zdCBibGFua0xpbmUyID0gbGluZUJyZWFrMiAmJlxyXG4gICAgICAgICAgdHdvLm1hdGNoKHRoaXMuYmxhbmtsaW5lU3RhcnRSZWdleF8pO1xyXG5cclxuICAgICAgaWYgKGJsYW5rTGluZTEgfHwgYmxhbmtMaW5lMikge1xyXG4gICAgICAgIC8vIEZpdmUgcG9pbnRzIGZvciBibGFuayBsaW5lcy5cclxuICAgICAgICByZXR1cm4gNTtcclxuICAgICAgfSBlbHNlIGlmIChsaW5lQnJlYWsxIHx8IGxpbmVCcmVhazIpIHtcclxuICAgICAgICAvLyBGb3VyIHBvaW50cyBmb3IgbGluZSBicmVha3MuXHJcbiAgICAgICAgcmV0dXJuIDQ7XHJcbiAgICAgIH0gZWxzZSBpZiAobm9uQWxwaGFOdW1lcmljMSAmJiAhd2hpdGVzcGFjZTEgJiYgd2hpdGVzcGFjZTIpIHtcclxuICAgICAgICAvLyBUaHJlZSBwb2ludHMgZm9yIGVuZCBvZiBzZW50ZW5jZXMuXHJcbiAgICAgICAgcmV0dXJuIDM7XHJcbiAgICAgIH0gZWxzZSBpZiAod2hpdGVzcGFjZTEgfHwgd2hpdGVzcGFjZTIpIHtcclxuICAgICAgICAvLyBUd28gcG9pbnRzIGZvciB3aGl0ZXNwYWNlLlxyXG4gICAgICAgIHJldHVybiAyO1xyXG4gICAgICB9IGVsc2UgaWYgKG5vbkFscGhhTnVtZXJpYzEgfHwgbm9uQWxwaGFOdW1lcmljMikge1xyXG4gICAgICAgIC8vIE9uZSBwb2ludCBmb3Igbm9uLWFscGhhbnVtZXJpYy5cclxuICAgICAgICByZXR1cm4gMTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gMDtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgcG9pbnRlciA9IDE7XHJcbiAgICAvLyBJbnRlbnRpb25hbGx5IGlnbm9yZSB0aGUgZmlyc3QgYW5kIGxhc3QgZWxlbWVudCAoZG9uJ3QgbmVlZCBjaGVja2luZykuXHJcbiAgICB3aGlsZSAocG9pbnRlciA8IGRpZmZzLmxlbmd0aCAtIDEpIHtcclxuICAgICAgaWYgKGRpZmZzW3BvaW50ZXIgLSAxXVswXSA9PSBEaWZmT3AuRXF1YWwgJiZcclxuICAgICAgICAgIGRpZmZzW3BvaW50ZXIgKyAxXVswXSA9PSBEaWZmT3AuRXF1YWwpIHtcclxuICAgICAgICAvLyBUaGlzIGlzIGEgc2luZ2xlIGVkaXQgc3Vycm91bmRlZCBieSBlcXVhbGl0aWVzLlxyXG4gICAgICAgIGxldCBlcXVhbGl0eTEgPSBkaWZmc1twb2ludGVyIC0gMV1bMV07XHJcbiAgICAgICAgbGV0IGVkaXQgPSBkaWZmc1twb2ludGVyXVsxXTtcclxuICAgICAgICBsZXQgZXF1YWxpdHkyID0gZGlmZnNbcG9pbnRlciArIDFdWzFdO1xyXG5cclxuICAgICAgICAvLyBGaXJzdCwgc2hpZnQgdGhlIGVkaXQgYXMgZmFyIGxlZnQgYXMgcG9zc2libGUuXHJcbiAgICAgICAgY29uc3QgY29tbW9uT2Zmc2V0ID0gdGhpcy5kaWZmX2NvbW1vblN1ZmZpeChlcXVhbGl0eTEsIGVkaXQpO1xyXG4gICAgICAgIGlmIChjb21tb25PZmZzZXQpIHtcclxuICAgICAgICAgIGNvbnN0IGNvbW1vblN0cmluZyA9IGVkaXQuc3Vic3RyaW5nKGVkaXQubGVuZ3RoIC0gY29tbW9uT2Zmc2V0KTtcclxuICAgICAgICAgIGVxdWFsaXR5MSA9IGVxdWFsaXR5MS5zdWJzdHJpbmcoMCwgZXF1YWxpdHkxLmxlbmd0aCAtIGNvbW1vbk9mZnNldCk7XHJcbiAgICAgICAgICBlZGl0ID0gY29tbW9uU3RyaW5nICsgZWRpdC5zdWJzdHJpbmcoMCwgZWRpdC5sZW5ndGggLSBjb21tb25PZmZzZXQpO1xyXG4gICAgICAgICAgZXF1YWxpdHkyID0gY29tbW9uU3RyaW5nICsgZXF1YWxpdHkyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gU2Vjb25kLCBzdGVwIGNoYXJhY3RlciBieSBjaGFyYWN0ZXIgcmlnaHQsIGxvb2tpbmcgZm9yIHRoZSBiZXN0IGZpdC5cclxuICAgICAgICBsZXQgYmVzdEVxdWFsaXR5MSA9IGVxdWFsaXR5MTtcclxuICAgICAgICBsZXQgYmVzdEVkaXQgPSBlZGl0O1xyXG4gICAgICAgIGxldCBiZXN0RXF1YWxpdHkyID0gZXF1YWxpdHkyO1xyXG4gICAgICAgIGxldCBiZXN0U2NvcmUgPSBkaWZmX2NsZWFudXBTZW1hbnRpY1Njb3JlXyhlcXVhbGl0eTEsIGVkaXQpICtcclxuICAgICAgICAgICAgZGlmZl9jbGVhbnVwU2VtYW50aWNTY29yZV8oZWRpdCwgZXF1YWxpdHkyKTtcclxuICAgICAgICB3aGlsZSAoZWRpdC5jaGFyQXQoMCkgPT09IGVxdWFsaXR5Mi5jaGFyQXQoMCkpIHtcclxuICAgICAgICAgIGVxdWFsaXR5MSArPSBlZGl0LmNoYXJBdCgwKTtcclxuICAgICAgICAgIGVkaXQgPSBlZGl0LnN1YnN0cmluZygxKSArIGVxdWFsaXR5Mi5jaGFyQXQoMCk7XHJcbiAgICAgICAgICBlcXVhbGl0eTIgPSBlcXVhbGl0eTIuc3Vic3RyaW5nKDEpO1xyXG4gICAgICAgICAgY29uc3Qgc2NvcmUgPSBkaWZmX2NsZWFudXBTZW1hbnRpY1Njb3JlXyhlcXVhbGl0eTEsIGVkaXQpICtcclxuICAgICAgICAgICAgICBkaWZmX2NsZWFudXBTZW1hbnRpY1Njb3JlXyhlZGl0LCBlcXVhbGl0eTIpO1xyXG4gICAgICAgICAgLy8gVGhlID49IGVuY291cmFnZXMgdHJhaWxpbmcgcmF0aGVyIHRoYW4gbGVhZGluZyB3aGl0ZXNwYWNlIG9uIGVkaXRzLlxyXG4gICAgICAgICAgaWYgKHNjb3JlID49IGJlc3RTY29yZSkge1xyXG4gICAgICAgICAgICBiZXN0U2NvcmUgPSBzY29yZTtcclxuICAgICAgICAgICAgYmVzdEVxdWFsaXR5MSA9IGVxdWFsaXR5MTtcclxuICAgICAgICAgICAgYmVzdEVkaXQgPSBlZGl0O1xyXG4gICAgICAgICAgICBiZXN0RXF1YWxpdHkyID0gZXF1YWxpdHkyO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGRpZmZzW3BvaW50ZXIgLSAxXVsxXSAhPSBiZXN0RXF1YWxpdHkxKSB7XHJcbiAgICAgICAgICAvLyBXZSBoYXZlIGFuIGltcHJvdmVtZW50LCBzYXZlIGl0IGJhY2sgdG8gdGhlIGRpZmYuXHJcbiAgICAgICAgICBpZiAoYmVzdEVxdWFsaXR5MSkge1xyXG4gICAgICAgICAgICBkaWZmc1twb2ludGVyIC0gMV1bMV0gPSBiZXN0RXF1YWxpdHkxO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIgLSAxLCAxKTtcclxuICAgICAgICAgICAgcG9pbnRlci0tO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZGlmZnNbcG9pbnRlcl1bMV0gPSBiZXN0RWRpdDtcclxuICAgICAgICAgIGlmIChiZXN0RXF1YWxpdHkyKSB7XHJcbiAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgKyAxXVsxXSA9IGJlc3RFcXVhbGl0eTI7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciArIDEsIDEpO1xyXG4gICAgICAgICAgICBwb2ludGVyLS07XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHBvaW50ZXIrKztcclxuICAgIH1cclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogUmVkdWNlIHRoZSBudW1iZXIgb2YgZWRpdHMgYnkgZWxpbWluYXRpbmcgb3BlcmF0aW9uYWxseSB0cml2aWFsIGVxdWFsaXRpZXMuXHJcbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cclxuICAgKi9cclxuICAgIGRpZmZfY2xlYW51cEVmZmljaWVuY3kgKGRpZmZzOiBBcnJheTxEaWZmPikge1xyXG4gICAgbGV0IGNoYW5nZXMgPSBmYWxzZTtcclxuICAgIGNvbnN0IGVxdWFsaXRpZXMgPSBbXTsgIC8vIFN0YWNrIG9mIGluZGljZXMgd2hlcmUgZXF1YWxpdGllcyBhcmUgZm91bmQuXHJcbiAgICBsZXQgZXF1YWxpdGllc0xlbmd0aCA9IDA7ICAvLyBLZWVwaW5nIG91ciBvd24gbGVuZ3RoIGNvbnN0IGlzIGZhc3RlciBpbiBKUy5cclxuXHJcbiAgICBsZXQgbGFzdGVxdWFsaXR5ID0gbnVsbDtcclxuICAgIC8vIEFsd2F5cyBlcXVhbCB0byBkaWZmc1tlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGggLSAxXV1bMV1cclxuICAgIGxldCBwb2ludGVyID0gMDsgIC8vIEluZGV4IG9mIGN1cnJlbnQgcG9zaXRpb24uXHJcbiAgICAvLyBJcyB0aGVyZSBhbiBpbnNlcnRpb24gb3BlcmF0aW9uIGJlZm9yZSB0aGUgbGFzdCBlcXVhbGl0eS5cclxuICAgIGxldCBwcmVfaW5zID0gZmFsc2U7XHJcbiAgICAvLyBJcyB0aGVyZSBhIGRlbGV0aW9uIG9wZXJhdGlvbiBiZWZvcmUgdGhlIGxhc3QgZXF1YWxpdHkuXHJcbiAgICBsZXQgcHJlX2RlbCA9IGZhbHNlO1xyXG4gICAgLy8gSXMgdGhlcmUgYW4gaW5zZXJ0aW9uIG9wZXJhdGlvbiBhZnRlciB0aGUgbGFzdCBlcXVhbGl0eS5cclxuICAgIGxldCBwb3N0X2lucyA9IGZhbHNlO1xyXG4gICAgLy8gSXMgdGhlcmUgYSBkZWxldGlvbiBvcGVyYXRpb24gYWZ0ZXIgdGhlIGxhc3QgZXF1YWxpdHkuXHJcbiAgICBsZXQgcG9zdF9kZWwgPSBmYWxzZTtcclxuICAgIHdoaWxlIChwb2ludGVyIDwgZGlmZnMubGVuZ3RoKSB7XHJcbiAgICAgIGlmIChkaWZmc1twb2ludGVyXVswXSA9PSBEaWZmT3AuRXF1YWwpIHsgIC8vIEVxdWFsaXR5IGZvdW5kLlxyXG4gICAgICAgIGlmIChkaWZmc1twb2ludGVyXVsxXS5sZW5ndGggPCB0aGlzLkRpZmZfRWRpdENvc3QgJiZcclxuICAgICAgICAgICAgKHBvc3RfaW5zIHx8IHBvc3RfZGVsKSkge1xyXG4gICAgICAgICAgLy8gQ2FuZGlkYXRlIGZvdW5kLlxyXG4gICAgICAgICAgZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoKytdID0gcG9pbnRlcjtcclxuICAgICAgICAgIHByZV9pbnMgPSBwb3N0X2lucztcclxuICAgICAgICAgIHByZV9kZWwgPSBwb3N0X2RlbDtcclxuICAgICAgICAgIGxhc3RlcXVhbGl0eSA9IGRpZmZzW3BvaW50ZXJdWzFdO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAvLyBOb3QgYSBjYW5kaWRhdGUsIGFuZCBjYW4gbmV2ZXIgYmVjb21lIG9uZS5cclxuICAgICAgICAgIGVxdWFsaXRpZXNMZW5ndGggPSAwO1xyXG4gICAgICAgICAgbGFzdGVxdWFsaXR5ID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcG9zdF9pbnMgPSBwb3N0X2RlbCA9IGZhbHNlO1xyXG4gICAgICB9IGVsc2UgeyAgLy8gQW4gaW5zZXJ0aW9uIG9yIGRlbGV0aW9uLlxyXG4gICAgICAgIGlmIChkaWZmc1twb2ludGVyXVswXSA9PSBEaWZmT3AuRGVsZXRlKSB7XHJcbiAgICAgICAgICBwb3N0X2RlbCA9IHRydWU7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHBvc3RfaW5zID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLypcclxuICAgICAgICAqIEZpdmUgdHlwZXMgdG8gYmUgc3BsaXQ6XHJcbiAgICAgICAgKiA8aW5zPkE8L2lucz48ZGVsPkI8L2RlbD5YWTxpbnM+QzwvaW5zPjxkZWw+RDwvZGVsPlxyXG4gICAgICAgICogPGlucz5BPC9pbnM+WDxpbnM+QzwvaW5zPjxkZWw+RDwvZGVsPlxyXG4gICAgICAgICogPGlucz5BPC9pbnM+PGRlbD5CPC9kZWw+WDxpbnM+QzwvaW5zPlxyXG4gICAgICAgICogPGlucz5BPC9kZWw+WDxpbnM+QzwvaW5zPjxkZWw+RDwvZGVsPlxyXG4gICAgICAgICogPGlucz5BPC9pbnM+PGRlbD5CPC9kZWw+WDxkZWw+QzwvZGVsPlxyXG4gICAgICAgICovXHJcbiAgICAgICAgaWYgKGxhc3RlcXVhbGl0eSAmJiAoKHByZV9pbnMgJiYgcHJlX2RlbCAmJiBwb3N0X2lucyAmJiBwb3N0X2RlbCkgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICgobGFzdGVxdWFsaXR5Lmxlbmd0aCA8IHRoaXMuRGlmZl9FZGl0Q29zdCAvIDIpICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKHByZV9pbnM/MTowKSArIChwcmVfZGVsPzE6MCkgKyAocG9zdF9pbnM/MTowKSArIChwb3N0X2RlbD8xOjApID09IDMpKSkpIHtcclxuICAgICAgICAgIC8vIER1cGxpY2F0ZSByZWNvcmQuXHJcbiAgICAgICAgICBkaWZmcy5zcGxpY2UoZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoIC0gMV0sIDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICBbRGlmZk9wLkRlbGV0ZSwgbGFzdGVxdWFsaXR5XSk7XHJcbiAgICAgICAgICAvLyBDaGFuZ2Ugc2Vjb25kIGNvcHkgdG8gaW5zZXJ0LlxyXG4gICAgICAgICAgZGlmZnNbZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoIC0gMV0gKyAxXVswXSA9IERpZmZPcC5JbnNlcnQ7XHJcbiAgICAgICAgICBlcXVhbGl0aWVzTGVuZ3RoLS07ICAvLyBUaHJvdyBhd2F5IHRoZSBlcXVhbGl0eSB3ZSBqdXN0IGRlbGV0ZWQ7XHJcbiAgICAgICAgICBsYXN0ZXF1YWxpdHkgPSBudWxsO1xyXG4gICAgICAgICAgaWYgKHByZV9pbnMgJiYgcHJlX2RlbCkge1xyXG4gICAgICAgICAgICAvLyBObyBjaGFuZ2VzIG1hZGUgd2hpY2ggY291bGQgYWZmZWN0IHByZXZpb3VzIGVudHJ5LCBrZWVwIGdvaW5nLlxyXG4gICAgICAgICAgICBwb3N0X2lucyA9IHBvc3RfZGVsID0gdHJ1ZTtcclxuICAgICAgICAgICAgZXF1YWxpdGllc0xlbmd0aCA9IDA7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBlcXVhbGl0aWVzTGVuZ3RoLS07ICAvLyBUaHJvdyBhd2F5IHRoZSBwcmV2aW91cyBlcXVhbGl0eS5cclxuICAgICAgICAgICAgcG9pbnRlciA9IGVxdWFsaXRpZXNMZW5ndGggPiAwID9cclxuICAgICAgICAgICAgICAgIGVxdWFsaXRpZXNbZXF1YWxpdGllc0xlbmd0aCAtIDFdIDogLTE7XHJcbiAgICAgICAgICAgIHBvc3RfaW5zID0gcG9zdF9kZWwgPSBmYWxzZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNoYW5nZXMgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBwb2ludGVyKys7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGNoYW5nZXMpIHtcclxuICAgICAgdGhpcy5kaWZmX2NsZWFudXBNZXJnZShkaWZmcyk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIFJlb3JkZXIgYW5kIG1lcmdlIGxpa2UgZWRpdCBzZWN0aW9ucy4gIE1lcmdlIGVxdWFsaXRpZXMuXHJcbiAgICogQW55IGVkaXQgc2VjdGlvbiBjYW4gbW92ZSBhcyBsb25nIGFzIGl0IGRvZXNuJ3QgY3Jvc3MgYW4gZXF1YWxpdHkuXHJcbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cclxuICAgKi9cclxuICAgIGRpZmZfY2xlYW51cE1lcmdlIChkaWZmczogQXJyYXk8RGlmZj4pIHtcclxuICAgIGRpZmZzLnB1c2goW0RpZmZPcC5FcXVhbCwgJyddKTsgIC8vIEFkZCBhIGR1bW15IGVudHJ5IGF0IHRoZSBlbmQuXHJcbiAgICBsZXQgcG9pbnRlciA9IDA7XHJcbiAgICBsZXQgY291bnRfZGVsZXRlID0gMDtcclxuICAgIGxldCBjb3VudF9pbnNlcnQgPSAwO1xyXG4gICAgbGV0IHRleHRfZGVsZXRlID0gJyc7XHJcbiAgICBsZXQgdGV4dF9pbnNlcnQgPSAnJztcclxuICAgIGxldCBjb21tb25sZW5ndGg7XHJcbiAgICB3aGlsZSAocG9pbnRlciA8IGRpZmZzLmxlbmd0aCkge1xyXG4gICAgICBzd2l0Y2ggKGRpZmZzW3BvaW50ZXJdWzBdKSB7XHJcbiAgICAgICAgY2FzZSBEaWZmT3AuSW5zZXJ0OlxyXG4gICAgICAgICAgY291bnRfaW5zZXJ0Kys7XHJcbiAgICAgICAgICB0ZXh0X2luc2VydCArPSBkaWZmc1twb2ludGVyXVsxXTtcclxuICAgICAgICAgIHBvaW50ZXIrKztcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgRGlmZk9wLkRlbGV0ZTpcclxuICAgICAgICAgIGNvdW50X2RlbGV0ZSsrO1xyXG4gICAgICAgICAgdGV4dF9kZWxldGUgKz0gZGlmZnNbcG9pbnRlcl1bMV07XHJcbiAgICAgICAgICBwb2ludGVyKys7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIERpZmZPcC5FcXVhbDpcclxuICAgICAgICAgIC8vIFVwb24gcmVhY2hpbmcgYW4gZXF1YWxpdHksIGNoZWNrIGZvciBwcmlvciByZWR1bmRhbmNpZXMuXHJcbiAgICAgICAgICBpZiAoY291bnRfZGVsZXRlICsgY291bnRfaW5zZXJ0ID4gMSkge1xyXG4gICAgICAgICAgICBpZiAoY291bnRfZGVsZXRlICE9PSAwICYmIGNvdW50X2luc2VydCAhPT0gMCkge1xyXG4gICAgICAgICAgICAgIC8vIEZhY3RvciBvdXQgYW55IGNvbW1vbiBwcmVmaXhpZXMuXHJcbiAgICAgICAgICAgICAgY29tbW9ubGVuZ3RoID0gdGhpcy5kaWZmX2NvbW1vblByZWZpeCh0ZXh0X2luc2VydCwgdGV4dF9kZWxldGUpO1xyXG4gICAgICAgICAgICAgIGlmIChjb21tb25sZW5ndGggIT09IDApIHtcclxuICAgICAgICAgICAgICAgIGlmICgocG9pbnRlciAtIGNvdW50X2RlbGV0ZSAtIGNvdW50X2luc2VydCkgPiAwICYmXHJcbiAgICAgICAgICAgICAgICAgICAgZGlmZnNbcG9pbnRlciAtIGNvdW50X2RlbGV0ZSAtIGNvdW50X2luc2VydCAtIDFdWzBdID09XHJcbiAgICAgICAgICAgICAgICAgICAgRGlmZk9wLkVxdWFsKSB7XHJcbiAgICAgICAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgLSBjb3VudF9kZWxldGUgLSBjb3VudF9pbnNlcnQgLSAxXVsxXSArPVxyXG4gICAgICAgICAgICAgICAgICAgICAgdGV4dF9pbnNlcnQuc3Vic3RyaW5nKDAsIGNvbW1vbmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICBkaWZmcy5zcGxpY2UoMCwgMCwgW0RpZmZPcC5FcXVhbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0X2luc2VydC5zdWJzdHJpbmcoMCwgY29tbW9ubGVuZ3RoKV0pO1xyXG4gICAgICAgICAgICAgICAgICBwb2ludGVyKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0ZXh0X2luc2VydCA9IHRleHRfaW5zZXJ0LnN1YnN0cmluZyhjb21tb25sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgdGV4dF9kZWxldGUgPSB0ZXh0X2RlbGV0ZS5zdWJzdHJpbmcoY29tbW9ubGVuZ3RoKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgLy8gRmFjdG9yIG91dCBhbnkgY29tbW9uIHN1ZmZpeGllcy5cclxuICAgICAgICAgICAgICBjb21tb25sZW5ndGggPSB0aGlzLmRpZmZfY29tbW9uU3VmZml4KHRleHRfaW5zZXJ0LCB0ZXh0X2RlbGV0ZSk7XHJcbiAgICAgICAgICAgICAgaWYgKGNvbW1vbmxlbmd0aCAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgZGlmZnNbcG9pbnRlcl1bMV0gPSB0ZXh0X2luc2VydC5zdWJzdHJpbmcodGV4dF9pbnNlcnQubGVuZ3RoIC1cclxuICAgICAgICAgICAgICAgICAgICBjb21tb25sZW5ndGgpICsgZGlmZnNbcG9pbnRlcl1bMV07XHJcbiAgICAgICAgICAgICAgICB0ZXh0X2luc2VydCA9IHRleHRfaW5zZXJ0LnN1YnN0cmluZygwLCB0ZXh0X2luc2VydC5sZW5ndGggLVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbW1vbmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0X2RlbGV0ZSA9IHRleHRfZGVsZXRlLnN1YnN0cmluZygwLCB0ZXh0X2RlbGV0ZS5sZW5ndGggLVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbW1vbmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIERlbGV0ZSB0aGUgb2ZmZW5kaW5nIHJlY29yZHMgYW5kIGFkZCB0aGUgbWVyZ2VkIG9uZXMuXHJcbiAgICAgICAgICAgIGlmIChjb3VudF9kZWxldGUgPT09IDApIHtcclxuICAgICAgICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciAtIGNvdW50X2luc2VydCxcclxuICAgICAgICAgICAgICAgICAgY291bnRfZGVsZXRlICsgY291bnRfaW5zZXJ0LCBbRGlmZk9wLkluc2VydCwgdGV4dF9pbnNlcnRdKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChjb3VudF9pbnNlcnQgPT09IDApIHtcclxuICAgICAgICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciAtIGNvdW50X2RlbGV0ZSxcclxuICAgICAgICAgICAgICAgICAgY291bnRfZGVsZXRlICsgY291bnRfaW5zZXJ0LCBbRGlmZk9wLkRlbGV0ZSwgdGV4dF9kZWxldGVdKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciAtIGNvdW50X2RlbGV0ZSAtIGNvdW50X2luc2VydCxcclxuICAgICAgICAgICAgICAgICAgY291bnRfZGVsZXRlICsgY291bnRfaW5zZXJ0LCBbRGlmZk9wLkRlbGV0ZSwgdGV4dF9kZWxldGVdLFxyXG4gICAgICAgICAgICAgICAgICBbRGlmZk9wLkluc2VydCwgdGV4dF9pbnNlcnRdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBwb2ludGVyID0gcG9pbnRlciAtIGNvdW50X2RlbGV0ZSAtIGNvdW50X2luc2VydCArXHJcbiAgICAgICAgICAgICAgICAgICAgICAoY291bnRfZGVsZXRlID8gMSA6IDApICsgKGNvdW50X2luc2VydCA/IDEgOiAwKSArIDE7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKHBvaW50ZXIgIT09IDAgJiYgZGlmZnNbcG9pbnRlciAtIDFdWzBdID09IERpZmZPcC5FcXVhbCkge1xyXG4gICAgICAgICAgICAvLyBNZXJnZSB0aGlzIGVxdWFsaXR5IHdpdGggdGhlIHByZXZpb3VzIG9uZS5cclxuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciAtIDFdWzFdICs9IGRpZmZzW3BvaW50ZXJdWzFdO1xyXG4gICAgICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciwgMSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBwb2ludGVyKys7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjb3VudF9pbnNlcnQgPSAwO1xyXG4gICAgICAgICAgY291bnRfZGVsZXRlID0gMDtcclxuICAgICAgICAgIHRleHRfZGVsZXRlID0gJyc7XHJcbiAgICAgICAgICB0ZXh0X2luc2VydCA9ICcnO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGlmIChkaWZmc1tkaWZmcy5sZW5ndGggLSAxXVsxXSA9PT0gJycpIHtcclxuICAgICAgZGlmZnMucG9wKCk7ICAvLyBSZW1vdmUgdGhlIGR1bW15IGVudHJ5IGF0IHRoZSBlbmQuXHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2Vjb25kIHBhc3M6IGxvb2sgZm9yIHNpbmdsZSBlZGl0cyBzdXJyb3VuZGVkIG9uIGJvdGggc2lkZXMgYnkgZXF1YWxpdGllc1xyXG4gICAgLy8gd2hpY2ggY2FuIGJlIHNoaWZ0ZWQgc2lkZXdheXMgdG8gZWxpbWluYXRlIGFuIGVxdWFsaXR5LlxyXG4gICAgLy8gZS5nOiBBPGlucz5CQTwvaW5zPkMgLT4gPGlucz5BQjwvaW5zPkFDXHJcbiAgICBsZXQgY2hhbmdlcyA9IGZhbHNlO1xyXG4gICAgcG9pbnRlciA9IDE7XHJcbiAgICAvLyBJbnRlbnRpb25hbGx5IGlnbm9yZSB0aGUgZmlyc3QgYW5kIGxhc3QgZWxlbWVudCAoZG9uJ3QgbmVlZCBjaGVja2luZykuXHJcbiAgICB3aGlsZSAocG9pbnRlciA8IGRpZmZzLmxlbmd0aCAtIDEpIHtcclxuICAgICAgaWYgKGRpZmZzW3BvaW50ZXIgLSAxXVswXSA9PSBEaWZmT3AuRXF1YWwgJiZcclxuICAgICAgICAgIGRpZmZzW3BvaW50ZXIgKyAxXVswXSA9PSBEaWZmT3AuRXF1YWwpIHtcclxuICAgICAgICAvLyBUaGlzIGlzIGEgc2luZ2xlIGVkaXQgc3Vycm91bmRlZCBieSBlcXVhbGl0aWVzLlxyXG4gICAgICAgIGlmIChkaWZmc1twb2ludGVyXVsxXS5zdWJzdHJpbmcoZGlmZnNbcG9pbnRlcl1bMV0ubGVuZ3RoIC1cclxuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciAtIDFdWzFdLmxlbmd0aCkgPT0gZGlmZnNbcG9pbnRlciAtIDFdWzFdKSB7XHJcbiAgICAgICAgICAvLyBTaGlmdCB0aGUgZWRpdCBvdmVyIHRoZSBwcmV2aW91cyBlcXVhbGl0eS5cclxuICAgICAgICAgIGRpZmZzW3BvaW50ZXJdWzFdID0gZGlmZnNbcG9pbnRlciAtIDFdWzFdICtcclxuICAgICAgICAgICAgICBkaWZmc1twb2ludGVyXVsxXS5zdWJzdHJpbmcoMCwgZGlmZnNbcG9pbnRlcl1bMV0ubGVuZ3RoIC1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZnNbcG9pbnRlciAtIDFdWzFdLmxlbmd0aCk7XHJcbiAgICAgICAgICBkaWZmc1twb2ludGVyICsgMV1bMV0gPSBkaWZmc1twb2ludGVyIC0gMV1bMV0gKyBkaWZmc1twb2ludGVyICsgMV1bMV07XHJcbiAgICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciAtIDEsIDEpO1xyXG4gICAgICAgICAgY2hhbmdlcyA9IHRydWU7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkaWZmc1twb2ludGVyXVsxXS5zdWJzdHJpbmcoMCwgZGlmZnNbcG9pbnRlciArIDFdWzFdLmxlbmd0aCkgPT1cclxuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciArIDFdWzFdKSB7XHJcbiAgICAgICAgICAvLyBTaGlmdCB0aGUgZWRpdCBvdmVyIHRoZSBuZXh0IGVxdWFsaXR5LlxyXG4gICAgICAgICAgZGlmZnNbcG9pbnRlciAtIDFdWzFdICs9IGRpZmZzW3BvaW50ZXIgKyAxXVsxXTtcclxuICAgICAgICAgIGRpZmZzW3BvaW50ZXJdWzFdID1cclxuICAgICAgICAgICAgICBkaWZmc1twb2ludGVyXVsxXS5zdWJzdHJpbmcoZGlmZnNbcG9pbnRlciArIDFdWzFdLmxlbmd0aCkgK1xyXG4gICAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgKyAxXVsxXTtcclxuICAgICAgICAgIGRpZmZzLnNwbGljZShwb2ludGVyICsgMSwgMSk7XHJcbiAgICAgICAgICBjaGFuZ2VzID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcG9pbnRlcisrO1xyXG4gICAgfVxyXG4gICAgLy8gSWYgc2hpZnRzIHdlcmUgbWFkZSwgdGhlIGRpZmYgbmVlZHMgcmVvcmRlcmluZyBhbmQgYW5vdGhlciBzaGlmdCBzd2VlcC5cclxuICAgIGlmIChjaGFuZ2VzKSB7XHJcbiAgICAgIHRoaXMuZGlmZl9jbGVhbnVwTWVyZ2UoZGlmZnMpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBsb2MgaXMgYSBsb2NhdGlvbiBpbiB0ZXh0MSwgY29tcHV0ZSBhbmQgcmV0dXJuIHRoZSBlcXVpdmFsZW50IGxvY2F0aW9uIGluXHJcbiAgICogdGV4dDIuXHJcbiAgICogZS5nLiAnVGhlIGNhdCcgdnMgJ1RoZSBiaWcgY2F0JywgMS0+MSwgNS0+OFxyXG4gICAqIEBwYXJhbSAgZGlmZnMgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXHJcbiAgICogQHBhcmFtICBsb2MgTG9jYXRpb24gd2l0aGluIHRleHQxLlxyXG4gICAqIEByZXR1cm4gIExvY2F0aW9uIHdpdGhpbiB0ZXh0Mi5cclxuICAgKi9cclxuICAgIGRpZmZfeEluZGV4IChkaWZmczogQXJyYXk8RGlmZj4sIGxvYzogbnVtYmVyKTogbnVtYmVyIHtcclxuICAgIGxldCBjaGFyczEgPSAwO1xyXG4gICAgbGV0IGNoYXJzMiA9IDA7XHJcbiAgICBsZXQgbGFzdF9jaGFyczEgPSAwO1xyXG4gICAgbGV0IGxhc3RfY2hhcnMyID0gMDtcclxuICAgIGxldCB4O1xyXG4gICAgZm9yICh4ID0gMDsgeCA8IGRpZmZzLmxlbmd0aDsgeCsrKSB7XHJcbiAgICAgIGlmIChkaWZmc1t4XVswXSAhPT0gRGlmZk9wLkluc2VydCkgeyAgLy8gRXF1YWxpdHkgb3IgZGVsZXRpb24uXHJcbiAgICAgICAgY2hhcnMxICs9IGRpZmZzW3hdWzFdLmxlbmd0aDtcclxuICAgICAgfVxyXG4gICAgICBpZiAoZGlmZnNbeF1bMF0gIT09IERpZmZPcC5EZWxldGUpIHsgIC8vIEVxdWFsaXR5IG9yIGluc2VydGlvbi5cclxuICAgICAgICBjaGFyczIgKz0gZGlmZnNbeF1bMV0ubGVuZ3RoO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChjaGFyczEgPiBsb2MpIHsgIC8vIE92ZXJzaG90IHRoZSBsb2NhdGlvbi5cclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgICBsYXN0X2NoYXJzMSA9IGNoYXJzMTtcclxuICAgICAgbGFzdF9jaGFyczIgPSBjaGFyczI7XHJcbiAgICB9XHJcbiAgICAvLyBXYXMgdGhlIGxvY2F0aW9uIHdhcyBkZWxldGVkP1xyXG4gICAgaWYgKGRpZmZzLmxlbmd0aCAhPSB4ICYmIGRpZmZzW3hdWzBdID09PSBEaWZmT3AuRGVsZXRlKSB7XHJcbiAgICAgIHJldHVybiBsYXN0X2NoYXJzMjtcclxuICAgIH1cclxuICAgIC8vIEFkZCB0aGUgcmVtYWluaW5nIGNoYXJhY3RlciBsZW5ndGguXHJcbiAgICByZXR1cm4gbGFzdF9jaGFyczIgKyAobG9jIC0gbGFzdF9jaGFyczEpO1xyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBDb252ZXJ0IGEgZGlmZiBhcnJheSBpbnRvIGEgcHJldHR5IEhUTUwgcmVwb3J0LlxyXG4gICAqIEBwYXJhbSAgZGlmZnMgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXHJcbiAgICogQHJldHVybiAgSFRNTCByZXByZXNlbnRhdGlvbi5cclxuICAgKi9cclxuICAgIGRpZmZfcHJldHR5SHRtbCA9IGZ1bmN0aW9uKGRpZmZzOiBBcnJheTxEaWZmPik6IHN0cmluZyB7XHJcbiAgICBjb25zdCBodG1sID0gW107XHJcbiAgICBjb25zdCBwYXR0ZXJuX2FtcCA9IC8mL2c7XHJcbiAgICBjb25zdCBwYXR0ZXJuX2x0ID0gLzwvZztcclxuICAgIGNvbnN0IHBhdHRlcm5fZ3QgPSAvPi9nO1xyXG4gICAgY29uc3QgcGF0dGVybl9wYXJhID0gL1xcbi9nO1xyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBkaWZmcy5sZW5ndGg7IHgrKykge1xyXG4gICAgICBjb25zdCBvcCA9IGRpZmZzW3hdWzBdOyAgICAvLyBPcGVyYXRpb24gKGluc2VydCwgZGVsZXRlLCBlcXVhbClcclxuICAgICAgY29uc3QgZGF0YSA9IGRpZmZzW3hdWzFdOyAgLy8gVGV4dCBvZiBjaGFuZ2UuXHJcbiAgICAgIGNvbnN0IHRleHQgPSBkYXRhLnJlcGxhY2UocGF0dGVybl9hbXAsICcmYW1wOycpLnJlcGxhY2UocGF0dGVybl9sdCwgJyZsdDsnKVxyXG4gICAgICAgICAgLnJlcGxhY2UocGF0dGVybl9ndCwgJyZndDsnKS5yZXBsYWNlKHBhdHRlcm5fcGFyYSwgJyZwYXJhOzxicj4nKTtcclxuICAgICAgc3dpdGNoIChvcCkge1xyXG4gICAgICAgIGNhc2UgRGlmZk9wLkluc2VydDpcclxuICAgICAgICAgIGh0bWxbeF0gPSAnPGlucyBzdHlsZT1cImJhY2tncm91bmQ6I2U2ZmZlNjtcIj4nICsgdGV4dCArICc8L2lucz4nO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBEaWZmT3AuRGVsZXRlOlxyXG4gICAgICAgICAgaHRtbFt4XSA9ICc8ZGVsIHN0eWxlPVwiYmFja2dyb3VuZDojZmZlNmU2O1wiPicgKyB0ZXh0ICsgJzwvZGVsPic7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIERpZmZPcC5FcXVhbDpcclxuICAgICAgICAgIGh0bWxbeF0gPSAnPHNwYW4+JyArIHRleHQgKyAnPC9zcGFuPic7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGh0bWwuam9pbignJyk7XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIENvbXB1dGUgYW5kIHJldHVybiB0aGUgc291cmNlIHRleHQgKGFsbCBlcXVhbGl0aWVzIGFuZCBkZWxldGlvbnMpLlxyXG4gICAqIEBwYXJhbSAgZGlmZnMgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXHJcbiAgICogQHJldHVybiAgU291cmNlIHRleHQuXHJcbiAgICovXHJcbiAgICBkaWZmX3RleHQxIChkaWZmczogQXJyYXk8RGlmZj4pOiBzdHJpbmcge1xyXG4gICAgY29uc3QgdGV4dCA9IFtdO1xyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBkaWZmcy5sZW5ndGg7IHgrKykge1xyXG4gICAgICBpZiAoZGlmZnNbeF1bMF0gIT09IERpZmZPcC5JbnNlcnQpIHtcclxuICAgICAgICB0ZXh0W3hdID0gZGlmZnNbeF1bMV07XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0ZXh0LmpvaW4oJycpO1xyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBDb21wdXRlIGFuZCByZXR1cm4gdGhlIGRlc3RpbmF0aW9uIHRleHQgKGFsbCBlcXVhbGl0aWVzIGFuZCBpbnNlcnRpb25zKS5cclxuICAgKiBAcGFyYW0gIGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxyXG4gICAqIEByZXR1cm4gIERlc3RpbmF0aW9uIHRleHQuXHJcbiAgICovXHJcbiAgICBkaWZmX3RleHQyIChkaWZmczogQXJyYXk8RGlmZj4pOiBzdHJpbmcge1xyXG4gICAgY29uc3QgdGV4dCA9IFtdO1xyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBkaWZmcy5sZW5ndGg7IHgrKykge1xyXG4gICAgICBpZiAoZGlmZnNbeF1bMF0gIT09IERpZmZPcC5EZWxldGUpIHtcclxuICAgICAgICB0ZXh0W3hdID0gZGlmZnNbeF1bMV07XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0ZXh0LmpvaW4oJycpO1xyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBDb21wdXRlIHRoZSBMZXZlbnNodGVpbiBkaXN0YW5jZTsgdGhlIG51bWJlciBvZiBpbnNlcnRlZCwgZGVsZXRlZCBvclxyXG4gICAqIHN1YnN0aXR1dGVkIGNoYXJhY3RlcnMuXHJcbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cclxuICAgKiBAcmV0dXJuICBOdW1iZXIgb2YgY2hhbmdlcy5cclxuICAgKi9cclxuICAgIGRpZmZfbGV2ZW5zaHRlaW4gKGRpZmZzOiBBcnJheTxEaWZmPik6IG51bWJlciB7XHJcbiAgICBsZXQgbGV2ZW5zaHRlaW4gPSAwO1xyXG4gICAgbGV0IGluc2VydGlvbnMgPSAwO1xyXG4gICAgbGV0IGRlbGV0aW9ucyA9IDA7XHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGRpZmZzLmxlbmd0aDsgeCsrKSB7XHJcbiAgICAgIGNvbnN0IG9wID0gZGlmZnNbeF1bMF07XHJcbiAgICAgIGNvbnN0IGRhdGEgPSBkaWZmc1t4XVsxXTtcclxuICAgICAgc3dpdGNoIChvcCkge1xyXG4gICAgICAgIGNhc2UgRGlmZk9wLkluc2VydDpcclxuICAgICAgICAgIGluc2VydGlvbnMgKz0gZGF0YS5sZW5ndGg7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIERpZmZPcC5EZWxldGU6XHJcbiAgICAgICAgICBkZWxldGlvbnMgKz0gZGF0YS5sZW5ndGg7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIERpZmZPcC5FcXVhbDpcclxuICAgICAgICAgIC8vIEEgZGVsZXRpb24gYW5kIGFuIGluc2VydGlvbiBpcyBvbmUgc3Vic3RpdHV0aW9uLlxyXG4gICAgICAgICAgbGV2ZW5zaHRlaW4gKz0gTWF0aC5tYXgoaW5zZXJ0aW9ucywgZGVsZXRpb25zKTtcclxuICAgICAgICAgIGluc2VydGlvbnMgPSAwO1xyXG4gICAgICAgICAgZGVsZXRpb25zID0gMDtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBsZXZlbnNodGVpbiArPSBNYXRoLm1heChpbnNlcnRpb25zLCBkZWxldGlvbnMpO1xyXG4gICAgcmV0dXJuIGxldmVuc2h0ZWluO1xyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBDcnVzaCB0aGUgZGlmZiBpbnRvIGFuIGVuY29kZWQgc3RyaW5nIHdoaWNoIGRlc2NyaWJlcyB0aGUgb3BlcmF0aW9uc1xyXG4gICAqIHJlcXVpcmVkIHRvIHRyYW5zZm9ybSB0ZXh0MSBpbnRvIHRleHQyLlxyXG4gICAqIEUuZy4gPTNcXHQtMlxcdCtpbmcgIC0+IEtlZXAgMyBjaGFycywgZGVsZXRlIDIgY2hhcnMsIGluc2VydCAnaW5nJy5cclxuICAgKiBPcGVyYXRpb25zIGFyZSB0YWItc2VwYXJhdGVkLiAgSW5zZXJ0ZWQgdGV4dCBpcyBlc2NhcGVkIHVzaW5nICV4eCBub3RhdGlvbi5cclxuICAgKiBAcGFyYW0gIGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxyXG4gICAqIEByZXR1cm4gIERlbHRhIHRleHQuXHJcbiAgICovXHJcbiAgICBkaWZmX3RvRGVsdGEgKGRpZmZzOiBBcnJheTxEaWZmPik6IHN0cmluZyB7XHJcbiAgICBjb25zdCB0ZXh0ID0gW107XHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGRpZmZzLmxlbmd0aDsgeCsrKSB7XHJcbiAgICAgIHN3aXRjaCAoZGlmZnNbeF1bMF0pIHtcclxuICAgICAgICBjYXNlIERpZmZPcC5JbnNlcnQ6XHJcbiAgICAgICAgICB0ZXh0W3hdID0gJysnICsgZW5jb2RlVVJJKGRpZmZzW3hdWzFdKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgRGlmZk9wLkRlbGV0ZTpcclxuICAgICAgICAgIHRleHRbeF0gPSAnLScgKyBkaWZmc1t4XVsxXS5sZW5ndGg7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIERpZmZPcC5FcXVhbDpcclxuICAgICAgICAgIHRleHRbeF0gPSAnPScgKyBkaWZmc1t4XVsxXS5sZW5ndGg7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRleHQuam9pbignXFx0JykucmVwbGFjZSgvJTIwL2csICcgJyk7XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEdpdmVuIHRoZSBvcmlnaW5hbCB0ZXh0MSwgYW5kIGFuIGVuY29kZWQgc3RyaW5nIHdoaWNoIGRlc2NyaWJlcyB0aGVcclxuICAgKiBvcGVyYXRpb25zIHJlcXVpcmVkIHRvIHRyYW5zZm9ybSB0ZXh0MSBpbnRvIHRleHQyLCBjb21wdXRlIHRoZSBmdWxsIGRpZmYuXHJcbiAgICogQHBhcmFtICB0ZXh0MSBTb3VyY2Ugc3RyaW5nIGZvciB0aGUgZGlmZi5cclxuICAgKiBAcGFyYW0gIGRlbHRhIERlbHRhIHRleHQuXHJcbiAgICogQHJldHVybiAgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXHJcbiAgICogQHRocm93cyB7IUVycm9yfSBJZiBpbnZhbGlkIGlucHV0LlxyXG4gICAqL1xyXG4gICAgZGlmZl9mcm9tRGVsdGEgKHRleHQxOiBzdHJpbmcsIGRlbHRhOiBzdHJpbmcpIHtcclxuICAgIGNvbnN0IGRpZmZzID0gW107XHJcbiAgICBsZXQgZGlmZnNMZW5ndGggPSAwOyAgLy8gS2VlcGluZyBvdXIgb3duIGxlbmd0aCBjb25zdCBpcyBmYXN0ZXIgaW4gSlMuXHJcbiAgICBsZXQgcG9pbnRlciA9IDA7ICAvLyBDdXJzb3IgaW4gdGV4dDFcclxuICAgIGNvbnN0IHRva2VucyA9IGRlbHRhLnNwbGl0KC9cXHQvZyk7XHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHRva2Vucy5sZW5ndGg7IHgrKykge1xyXG4gICAgICAvLyBFYWNoIHRva2VuIGJlZ2lucyB3aXRoIGEgb25lIGNoYXJhY3RlciBwYXJhbWV0ZXIgd2hpY2ggc3BlY2lmaWVzIHRoZVxyXG4gICAgICAvLyBvcGVyYXRpb24gb2YgdGhpcyB0b2tlbiAoZGVsZXRlLCBpbnNlcnQsIGVxdWFsaXR5KS5cclxuICAgICAgY29uc3QgcGFyYW0gPSB0b2tlbnNbeF0uc3Vic3RyaW5nKDEpO1xyXG4gICAgICBzd2l0Y2ggKHRva2Vuc1t4XS5jaGFyQXQoMCkpIHtcclxuICAgICAgICBjYXNlICcrJzpcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGRpZmZzW2RpZmZzTGVuZ3RoKytdID0gW0RpZmZPcC5JbnNlcnQsIGRlY29kZVVSSShwYXJhbSldO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXgpIHtcclxuICAgICAgICAgICAgLy8gTWFsZm9ybWVkIFVSSSBzZXF1ZW5jZS5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbGxlZ2FsIGVzY2FwZSBpbiBkaWZmX2Zyb21EZWx0YTogJyArIHBhcmFtKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJy0nOlxyXG4gICAgICAgICAgLy8gRmFsbCB0aHJvdWdoLlxyXG4gICAgICAgIGNhc2UgJz0nOlxyXG4gICAgICAgICAgY29uc3QgbiA9IHBhcnNlSW50KHBhcmFtLCAxMCk7XHJcbiAgICAgICAgICBpZiAoaXNOYU4obikgfHwgbiA8IDApIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIG51bWJlciBpbiBkaWZmX2Zyb21EZWx0YTogJyArIHBhcmFtKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNvbnN0IHRleHQgPSB0ZXh0MS5zdWJzdHJpbmcocG9pbnRlciwgcG9pbnRlciArPSBuKTtcclxuICAgICAgICAgIGlmICh0b2tlbnNbeF0uY2hhckF0KDApID09ICc9Jykge1xyXG4gICAgICAgICAgICBkaWZmc1tkaWZmc0xlbmd0aCsrXSA9IFtEaWZmT3AuRXF1YWwsIHRleHRdO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZGlmZnNbZGlmZnNMZW5ndGgrK10gPSBbRGlmZk9wLkRlbGV0ZSwgdGV4dF07XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgLy8gQmxhbmsgdG9rZW5zIGFyZSBvayAoZnJvbSBhIHRyYWlsaW5nIFxcdCkuXHJcbiAgICAgICAgICAvLyBBbnl0aGluZyBlbHNlIGlzIGFuIGVycm9yLlxyXG4gICAgICAgICAgaWYgKHRva2Vuc1t4XSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZGlmZiBvcGVyYXRpb24gaW4gZGlmZl9mcm9tRGVsdGE6ICcgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zW3hdKTtcclxuICAgICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKHBvaW50ZXIgIT0gdGV4dDEubGVuZ3RoKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignRGVsdGEgbGVuZ3RoICgnICsgcG9pbnRlciArXHJcbiAgICAgICAgICAnKSBkb2VzIG5vdCBlcXVhbCBzb3VyY2UgdGV4dCBsZW5ndGggKCcgKyB0ZXh0MS5sZW5ndGggKyAnKS4nKTtcclxuICAgIH1cclxuICAgIHJldHVybiBkaWZmcztcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBMb2NhdGUgdGhlIGJlc3QgaW5zdGFuY2Ugb2YgJ3BhdHRlcm4nIGluICd0ZXh0JyBuZWFyICdsb2MnLlxyXG4gICAqIEBwYXJhbSAgdGV4dCBUaGUgdGV4dCB0byBzZWFyY2guXHJcbiAgICogQHBhcmFtICBwYXR0ZXJuIFRoZSBwYXR0ZXJuIHRvIHNlYXJjaCBmb3IuXHJcbiAgICogQHBhcmFtICBsb2MgVGhlIGxvY2F0aW9uIHRvIHNlYXJjaCBhcm91bmQuXHJcbiAgICogQHJldHVybiAgQmVzdCBtYXRjaCBpbmRleCBvciAtMS5cclxuICAgKi9cclxuICAgIG1hdGNoX21haW4gKHRleHQ6IHN0cmluZywgcGF0dGVybjogc3RyaW5nLCBsb2M6IG51bWJlcik6IG51bWJlciB7XHJcbiAgICAvLyBDaGVjayBmb3IgbnVsbCBpbnB1dHMuXHJcbiAgICBpZiAodGV4dCA9PSBudWxsIHx8IHBhdHRlcm4gPT0gbnVsbCB8fCBsb2MgPT0gbnVsbCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ051bGwgaW5wdXQuIChtYXRjaF9tYWluKScpO1xyXG4gICAgfVxyXG5cclxuICAgIGxvYyA9IE1hdGgubWF4KDAsIE1hdGgubWluKGxvYywgdGV4dC5sZW5ndGgpKTtcclxuICAgIGlmICh0ZXh0ID09IHBhdHRlcm4pIHtcclxuICAgICAgLy8gU2hvcnRjdXQgKHBvdGVudGlhbGx5IG5vdCBndWFyYW50ZWVkIGJ5IHRoZSBhbGdvcml0aG0pXHJcbiAgICAgIHJldHVybiAwO1xyXG4gICAgfSBlbHNlIGlmICghdGV4dC5sZW5ndGgpIHtcclxuICAgICAgLy8gTm90aGluZyB0byBtYXRjaC5cclxuICAgICAgcmV0dXJuIC0xO1xyXG4gICAgfSBlbHNlIGlmICh0ZXh0LnN1YnN0cmluZyhsb2MsIGxvYyArIHBhdHRlcm4ubGVuZ3RoKSA9PSBwYXR0ZXJuKSB7XHJcbiAgICAgIC8vIFBlcmZlY3QgbWF0Y2ggYXQgdGhlIHBlcmZlY3Qgc3BvdCEgIChJbmNsdWRlcyBjYXNlIG9mIG51bGwgcGF0dGVybilcclxuICAgICAgcmV0dXJuIGxvYztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIERvIGEgZnV6enkgY29tcGFyZS5cclxuICAgICAgcmV0dXJuIHRoaXMubWF0Y2hfYml0YXBfKHRleHQsIHBhdHRlcm4sIGxvYyk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIExvY2F0ZSB0aGUgYmVzdCBpbnN0YW5jZSBvZiAncGF0dGVybicgaW4gJ3RleHQnIG5lYXIgJ2xvYycgdXNpbmcgdGhlXHJcbiAgICogQml0YXAgYWxnb3JpdGhtLlxyXG4gICAqIEBwYXJhbSAgdGV4dCBUaGUgdGV4dCB0byBzZWFyY2guXHJcbiAgICogQHBhcmFtICBwYXR0ZXJuIFRoZSBwYXR0ZXJuIHRvIHNlYXJjaCBmb3IuXHJcbiAgICogQHBhcmFtICBsb2MgVGhlIGxvY2F0aW9uIHRvIHNlYXJjaCBhcm91bmQuXHJcbiAgICogQHJldHVybiAgQmVzdCBtYXRjaCBpbmRleCBvciAtMS5cclxuXHJcbiAgICovXHJcbiAgICBtYXRjaF9iaXRhcF8gKHRleHQ6IHN0cmluZywgcGF0dGVybjogc3RyaW5nLCBsb2M6IG51bWJlcik6IG51bWJlciB7XHJcbiAgICBpZiAocGF0dGVybi5sZW5ndGggPiB0aGlzLk1hdGNoX01heEJpdHMpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdQYXR0ZXJuIHRvbyBsb25nIGZvciB0aGlzIGJyb3dzZXIuJyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSW5pdGlhbGlzZSB0aGUgYWxwaGFiZXQuXHJcbiAgICBjb25zdCBzID0gdGhpcy5tYXRjaF9hbHBoYWJldF8ocGF0dGVybik7XHJcblxyXG4gICAgY29uc3QgZG1wID0gdGhpczsgIC8vICd0aGlzJyBiZWNvbWVzICd3aW5kb3cnIGluIGEgY2xvc3VyZS5cclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbXB1dGUgYW5kIHJldHVybiB0aGUgc2NvcmUgZm9yIGEgbWF0Y2ggd2l0aCBlIGVycm9ycyBhbmQgeCBsb2NhdGlvbi5cclxuICAgICAqIEFjY2Vzc2VzIGxvYyBhbmQgcGF0dGVybiB0aHJvdWdoIGJlaW5nIGEgY2xvc3VyZS5cclxuICAgICAqIEBwYXJhbSAgZSBOdW1iZXIgb2YgZXJyb3JzIGluIG1hdGNoLlxyXG4gICAgICogQHBhcmFtICB4IExvY2F0aW9uIG9mIG1hdGNoLlxyXG4gICAgICogQHJldHVybiAgT3ZlcmFsbCBzY29yZSBmb3IgbWF0Y2ggKDAuMCA9IGdvb2QsIDEuMCA9IGJhZCkuXHJcblxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBtYXRjaF9iaXRhcFNjb3JlXyhlOiBudW1iZXIsIHg6IG51bWJlcik6IG51bWJlciB7XHJcbiAgICAgIGNvbnN0IGFjY3VyYWN5ID0gZSAvIHBhdHRlcm4ubGVuZ3RoO1xyXG4gICAgICBjb25zdCBwcm94aW1pdHkgPSBNYXRoLmFicyhsb2MgLSB4KTtcclxuICAgICAgaWYgKCFkbXAuTWF0Y2hfRGlzdGFuY2UpIHtcclxuICAgICAgICAvLyBEb2RnZSBkaXZpZGUgYnkgemVybyBlcnJvci5cclxuICAgICAgICByZXR1cm4gcHJveGltaXR5ID8gMS4wIDogYWNjdXJhY3k7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGFjY3VyYWN5ICsgKHByb3hpbWl0eSAvIGRtcC5NYXRjaF9EaXN0YW5jZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSGlnaGVzdCBzY29yZSBiZXlvbmQgd2hpY2ggd2UgZ2l2ZSB1cC5cclxuICAgIGxldCBzY29yZV90aHJlc2hvbGQgPSB0aGlzLk1hdGNoX1RocmVzaG9sZDtcclxuICAgIC8vIElzIHRoZXJlIGEgbmVhcmJ5IGV4YWN0IG1hdGNoPyAoc3BlZWR1cClcclxuICAgIGxldCBiZXN0X2xvYyA9IHRleHQuaW5kZXhPZihwYXR0ZXJuLCBsb2MpO1xyXG4gICAgaWYgKGJlc3RfbG9jICE9IC0xKSB7XHJcbiAgICAgIHNjb3JlX3RocmVzaG9sZCA9IE1hdGgubWluKG1hdGNoX2JpdGFwU2NvcmVfKDAsIGJlc3RfbG9jKSwgc2NvcmVfdGhyZXNob2xkKTtcclxuICAgICAgLy8gV2hhdCBhYm91dCBpbiB0aGUgb3RoZXIgZGlyZWN0aW9uPyAoc3BlZWR1cClcclxuICAgICAgYmVzdF9sb2MgPSB0ZXh0Lmxhc3RJbmRleE9mKHBhdHRlcm4sIGxvYyArIHBhdHRlcm4ubGVuZ3RoKTtcclxuICAgICAgaWYgKGJlc3RfbG9jICE9IC0xKSB7XHJcbiAgICAgICAgc2NvcmVfdGhyZXNob2xkID1cclxuICAgICAgICAgICAgTWF0aC5taW4obWF0Y2hfYml0YXBTY29yZV8oMCwgYmVzdF9sb2MpLCBzY29yZV90aHJlc2hvbGQpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSW5pdGlhbGlzZSB0aGUgYml0IGFycmF5cy5cclxuICAgIGNvbnN0IG1hdGNobWFzayA9IDEgPDwgKHBhdHRlcm4ubGVuZ3RoIC0gMSk7XHJcbiAgICBiZXN0X2xvYyA9IC0xO1xyXG5cclxuICAgIGxldCBiaW5fbWluLCBiaW5fbWlkO1xyXG4gICAgbGV0IGJpbl9tYXggPSBwYXR0ZXJuLmxlbmd0aCArIHRleHQubGVuZ3RoO1xyXG4gICAgbGV0IGxhc3RfcmQ7XHJcbiAgICBmb3IgKGxldCBkID0gMDsgZCA8IHBhdHRlcm4ubGVuZ3RoOyBkKyspIHtcclxuICAgICAgLy8gU2NhbiBmb3IgdGhlIGJlc3QgbWF0Y2g7IGVhY2ggaXRlcmF0aW9uIGFsbG93cyBmb3Igb25lIG1vcmUgZXJyb3IuXHJcbiAgICAgIC8vIFJ1biBhIGJpbmFyeSBzZWFyY2ggdG8gZGV0ZXJtaW5lIGhvdyBmYXIgZnJvbSAnbG9jJyB3ZSBjYW4gc3RyYXkgYXQgdGhpc1xyXG4gICAgICAvLyBlcnJvciBsZXZlbC5cclxuICAgICAgYmluX21pbiA9IDA7XHJcbiAgICAgIGJpbl9taWQgPSBiaW5fbWF4O1xyXG4gICAgICB3aGlsZSAoYmluX21pbiA8IGJpbl9taWQpIHtcclxuICAgICAgICBpZiAobWF0Y2hfYml0YXBTY29yZV8oZCwgbG9jICsgYmluX21pZCkgPD0gc2NvcmVfdGhyZXNob2xkKSB7XHJcbiAgICAgICAgICBiaW5fbWluID0gYmluX21pZDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgYmluX21heCA9IGJpbl9taWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJpbl9taWQgPSBNYXRoLmZsb29yKChiaW5fbWF4IC0gYmluX21pbikgLyAyICsgYmluX21pbik7XHJcbiAgICAgIH1cclxuICAgICAgLy8gVXNlIHRoZSByZXN1bHQgZnJvbSB0aGlzIGl0ZXJhdGlvbiBhcyB0aGUgbWF4aW11bSBmb3IgdGhlIG5leHQuXHJcbiAgICAgIGJpbl9tYXggPSBiaW5fbWlkO1xyXG4gICAgICBsZXQgc3RhcnQgPSBNYXRoLm1heCgxLCBsb2MgLSBiaW5fbWlkICsgMSk7XHJcbiAgICAgIGNvbnN0IGZpbmlzaCA9IE1hdGgubWluKGxvYyArIGJpbl9taWQsIHRleHQubGVuZ3RoKSArIHBhdHRlcm4ubGVuZ3RoO1xyXG5cclxuICAgICAgY29uc3QgcmQgPSBBcnJheShmaW5pc2ggKyAyKTtcclxuICAgICAgcmRbZmluaXNoICsgMV0gPSAoMSA8PCBkKSAtIDE7XHJcbiAgICAgIGZvciAobGV0IGogPSBmaW5pc2g7IGogPj0gc3RhcnQ7IGotLSkge1xyXG4gICAgICAgIC8vIFRoZSBhbHBoYWJldCAocykgaXMgYSBzcGFyc2UgaGFzaCwgc28gdGhlIGZvbGxvd2luZyBsaW5lIGdlbmVyYXRlc1xyXG4gICAgICAgIC8vIHdhcm5pbmdzLlxyXG4gICAgICAgIGNvbnN0IGNoYXJNYXRjaCA9IHNbdGV4dC5jaGFyQXQoaiAtIDEpXTtcclxuICAgICAgICBpZiAoZCA9PT0gMCkgeyAgLy8gRmlyc3QgcGFzczogZXhhY3QgbWF0Y2guXHJcbiAgICAgICAgICByZFtqXSA9ICgocmRbaiArIDFdIDw8IDEpIHwgMSkgJiBjaGFyTWF0Y2g7XHJcbiAgICAgICAgfSBlbHNlIHsgIC8vIFN1YnNlcXVlbnQgcGFzc2VzOiBmdXp6eSBtYXRjaC5cclxuICAgICAgICAgIHJkW2pdID0gKCgocmRbaiArIDFdIDw8IDEpIHwgMSkgJiBjaGFyTWF0Y2gpIHxcclxuICAgICAgICAgICAgICAgICAgKCgobGFzdF9yZFtqICsgMV0gfCBsYXN0X3JkW2pdKSA8PCAxKSB8IDEpIHxcclxuICAgICAgICAgICAgICAgICAgbGFzdF9yZFtqICsgMV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChyZFtqXSAmIG1hdGNobWFzaykge1xyXG4gICAgICAgICAgY29uc3Qgc2NvcmUgPSBtYXRjaF9iaXRhcFNjb3JlXyhkLCBqIC0gMSk7XHJcbiAgICAgICAgICAvLyBUaGlzIG1hdGNoIHdpbGwgYWxtb3N0IGNlcnRhaW5seSBiZSBiZXR0ZXIgdGhhbiBhbnkgZXhpc3RpbmcgbWF0Y2guXHJcbiAgICAgICAgICAvLyBCdXQgY2hlY2sgYW55d2F5LlxyXG4gICAgICAgICAgaWYgKHNjb3JlIDw9IHNjb3JlX3RocmVzaG9sZCkge1xyXG4gICAgICAgICAgICAvLyBUb2xkIHlvdSBzby5cclxuICAgICAgICAgICAgc2NvcmVfdGhyZXNob2xkID0gc2NvcmU7XHJcbiAgICAgICAgICAgIGJlc3RfbG9jID0gaiAtIDE7XHJcbiAgICAgICAgICAgIGlmIChiZXN0X2xvYyA+IGxvYykge1xyXG4gICAgICAgICAgICAgIC8vIFdoZW4gcGFzc2luZyBsb2MsIGRvbid0IGV4Y2VlZCBvdXIgY3VycmVudCBkaXN0YW5jZSBmcm9tIGxvYy5cclxuICAgICAgICAgICAgICBzdGFydCA9IE1hdGgubWF4KDEsIDIgKiBsb2MgLSBiZXN0X2xvYyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgLy8gQWxyZWFkeSBwYXNzZWQgbG9jLCBkb3duaGlsbCBmcm9tIGhlcmUgb24gaW4uXHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgLy8gTm8gaG9wZSBmb3IgYSAoYmV0dGVyKSBtYXRjaCBhdCBncmVhdGVyIGVycm9yIGxldmVscy5cclxuICAgICAgaWYgKG1hdGNoX2JpdGFwU2NvcmVfKGQgKyAxLCBsb2MpID4gc2NvcmVfdGhyZXNob2xkKSB7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgICAgbGFzdF9yZCA9IHJkO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGJlc3RfbG9jO1xyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXNlIHRoZSBhbHBoYWJldCBmb3IgdGhlIEJpdGFwIGFsZ29yaXRobS5cclxuICAgKiBAcGFyYW0gIHBhdHRlcm4gVGhlIHRleHQgdG8gZW5jb2RlLlxyXG4gICAqIEByZXR1cm4gIEhhc2ggb2YgY2hhcmFjdGVyIGxvY2F0aW9ucy5cclxuXHJcbiAgICovXHJcbiAgICBtYXRjaF9hbHBoYWJldF8gKHBhdHRlcm46IHN0cmluZyk6IHsgW2NoYXJhY3Rlcjogc3RyaW5nXTogbnVtYmVyIH0ge1xyXG4gICAgY29uc3QgczogeyBbY2hhcmFjdGVyOiBzdHJpbmddOiBudW1iZXIgfSA9IHt9O1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXR0ZXJuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIHNbcGF0dGVybi5jaGFyQXQoaSldID0gMDtcclxuICAgIH1cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0dGVybi5sZW5ndGg7IGkrKykge1xyXG4gICAgICBzW3BhdHRlcm4uY2hhckF0KGkpXSB8PSAxIDw8IChwYXR0ZXJuLmxlbmd0aCAtIGkgLSAxKTtcclxuICAgIH1cclxuICAgIHJldHVybiBzO1xyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBJbmNyZWFzZSB0aGUgY29udGV4dCB1bnRpbCBpdCBpcyB1bmlxdWUsXHJcbiAgICogYnV0IGRvbid0IGxldCB0aGUgcGF0dGVybiBleHBhbmQgYmV5b25kIE1hdGNoX01heEJpdHMuXHJcbiAgICogQHBhcmFtICBwYXRjaCBUaGUgcGF0Y2ggdG8gZ3Jvdy5cclxuICAgKiBAcGFyYW0gIHRleHQgU291cmNlIHRleHQuXHJcblxyXG4gICAqL1xyXG4gICAgcGF0Y2hfYWRkQ29udGV4dF8gKHBhdGNoOiBwYXRjaF9vYmosIHRleHQ6IHN0cmluZykge1xyXG4gICAgaWYgKHRleHQubGVuZ3RoID09IDApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgbGV0IHBhdHRlcm4gPSB0ZXh0LnN1YnN0cmluZyhwYXRjaC5zdGFydDIsIHBhdGNoLnN0YXJ0MiArIHBhdGNoLmxlbmd0aDEpO1xyXG4gICAgbGV0IHBhZGRpbmcgPSAwO1xyXG5cclxuICAgIC8vIExvb2sgZm9yIHRoZSBmaXJzdCBhbmQgbGFzdCBtYXRjaGVzIG9mIHBhdHRlcm4gaW4gdGV4dC4gIElmIHR3byBkaWZmZXJlbnRcclxuICAgIC8vIG1hdGNoZXMgYXJlIGZvdW5kLCBpbmNyZWFzZSB0aGUgcGF0dGVybiBsZW5ndGguXHJcbiAgICB3aGlsZSAodGV4dC5pbmRleE9mKHBhdHRlcm4pICE9IHRleHQubGFzdEluZGV4T2YocGF0dGVybikgJiZcclxuICAgICAgICAgIHBhdHRlcm4ubGVuZ3RoIDwgdGhpcy5NYXRjaF9NYXhCaXRzIC0gdGhpcy5QYXRjaF9NYXJnaW4gLVxyXG4gICAgICAgICAgdGhpcy5QYXRjaF9NYXJnaW4pIHtcclxuICAgICAgcGFkZGluZyArPSB0aGlzLlBhdGNoX01hcmdpbjtcclxuICAgICAgcGF0dGVybiA9IHRleHQuc3Vic3RyaW5nKHBhdGNoLnN0YXJ0MiAtIHBhZGRpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGNoLnN0YXJ0MiArIHBhdGNoLmxlbmd0aDEgKyBwYWRkaW5nKTtcclxuICAgIH1cclxuICAgIC8vIEFkZCBvbmUgY2h1bmsgZm9yIGdvb2QgbHVjay5cclxuICAgIHBhZGRpbmcgKz0gdGhpcy5QYXRjaF9NYXJnaW47XHJcblxyXG4gICAgLy8gQWRkIHRoZSBwcmVmaXguXHJcbiAgICBjb25zdCBwcmVmaXggPSB0ZXh0LnN1YnN0cmluZyhwYXRjaC5zdGFydDIgLSBwYWRkaW5nLCBwYXRjaC5zdGFydDIpO1xyXG4gICAgaWYgKHByZWZpeCkge1xyXG4gICAgICBwYXRjaC5kaWZmcy51bnNoaWZ0KFtEaWZmT3AuRXF1YWwsIHByZWZpeF0pO1xyXG4gICAgfVxyXG4gICAgLy8gQWRkIHRoZSBzdWZmaXguXHJcbiAgICBjb25zdCBzdWZmaXggPSB0ZXh0LnN1YnN0cmluZyhwYXRjaC5zdGFydDIgKyBwYXRjaC5sZW5ndGgxLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGNoLnN0YXJ0MiArIHBhdGNoLmxlbmd0aDEgKyBwYWRkaW5nKTtcclxuICAgIGlmIChzdWZmaXgpIHtcclxuICAgICAgcGF0Y2guZGlmZnMucHVzaChbRGlmZk9wLkVxdWFsLCBzdWZmaXhdKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBSb2xsIGJhY2sgdGhlIHN0YXJ0IHBvaW50cy5cclxuICAgIHBhdGNoLnN0YXJ0MSAtPSBwcmVmaXgubGVuZ3RoO1xyXG4gICAgcGF0Y2guc3RhcnQyIC09IHByZWZpeC5sZW5ndGg7XHJcbiAgICAvLyBFeHRlbmQgdGhlIGxlbmd0aHMuXHJcbiAgICBwYXRjaC5sZW5ndGgxICs9IHByZWZpeC5sZW5ndGggKyBzdWZmaXgubGVuZ3RoO1xyXG4gICAgcGF0Y2gubGVuZ3RoMiArPSBwcmVmaXgubGVuZ3RoICsgc3VmZml4Lmxlbmd0aDtcclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogQ29tcHV0ZSBhIGxpc3Qgb2YgcGF0Y2hlcyB0byB0dXJuIHRleHQxIGludG8gdGV4dDIuXHJcbiAgICogVXNlIGRpZmZzIGlmIHByb3ZpZGVkLCBvdGhlcndpc2UgY29tcHV0ZSBpdCBvdXJzZWx2ZXMuXHJcbiAgICogVGhlcmUgYXJlIGZvdXIgd2F5cyB0byBjYWxsIHRoaXMgZnVuY3Rpb24sIGRlcGVuZGluZyBvbiB3aGF0IGRhdGEgaXNcclxuICAgKiBhdmFpbGFibGUgdG8gdGhlIGNhbGxlcjpcclxuICAgKiBNZXRob2QgMTpcclxuICAgKiBhID0gdGV4dDEsIGIgPSB0ZXh0MlxyXG4gICAqIE1ldGhvZCAyOlxyXG4gICAqIGEgPSBkaWZmc1xyXG4gICAqIE1ldGhvZCAzIChvcHRpbWFsKTpcclxuICAgKiBhID0gdGV4dDEsIGIgPSBkaWZmc1xyXG4gICAqIE1ldGhvZCA0IChkZXByZWNhdGVkLCB1c2UgbWV0aG9kIDMpOlxyXG4gICAqIGEgPSB0ZXh0MSwgYiA9IHRleHQyLCBjID0gZGlmZnNcclxuICAgKlxyXG4gICAqIEBwYXJhbSAgYSB0ZXh0MSAobWV0aG9kcyAxLDMsNCkgb3JcclxuICAgKiBBcnJheSBvZiBkaWZmIHR1cGxlcyBmb3IgdGV4dDEgdG8gdGV4dDIgKG1ldGhvZCAyKS5cclxuICAgKiBAcGFyYW0gIG9wdF9iIHRleHQyIChtZXRob2RzIDEsNCkgb3JcclxuICAgKiBBcnJheSBvZiBkaWZmIHR1cGxlcyBmb3IgdGV4dDEgdG8gdGV4dDIgKG1ldGhvZCAzKSBvciB1bmRlZmluZWQgKG1ldGhvZCAyKS5cclxuICAgKiBAcGFyYW0gIG9wdF9jIEFycmF5IG9mIGRpZmYgdHVwbGVzXHJcbiAgICogZm9yIHRleHQxIHRvIHRleHQyIChtZXRob2QgNCkgb3IgdW5kZWZpbmVkIChtZXRob2RzIDEsMiwzKS5cclxuICAgKiBAcmV0dXJuICBBcnJheSBvZiBQYXRjaCBvYmplY3RzLlxyXG4gICAqL1xyXG4gICAgcGF0Y2hfbWFrZSAoYTogc3RyaW5nIHwgQXJyYXk8RGlmZj4sIG9wdF9iOiBzdHJpbmcgfCBBcnJheTxEaWZmPiwgb3B0X2M6IHN0cmluZyB8IEFycmF5PERpZmY+KSB7XHJcbiAgICBsZXQgdGV4dDEsIGRpZmZzO1xyXG4gICAgaWYgKHR5cGVvZiBhID09ICdzdHJpbmcnICYmIHR5cGVvZiBvcHRfYiA9PSAnc3RyaW5nJyAmJlxyXG4gICAgICAgIHR5cGVvZiBvcHRfYyA9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAvLyBNZXRob2QgMTogdGV4dDEsIHRleHQyXHJcbiAgICAgIC8vIENvbXB1dGUgZGlmZnMgZnJvbSB0ZXh0MSBhbmQgdGV4dDIuXHJcbiAgICAgIHRleHQxID0gKGEpO1xyXG4gICAgICBkaWZmcyA9IHRoaXMuZGlmZl9tYWluKHRleHQxLCAob3B0X2IpLCB0cnVlKTtcclxuICAgICAgaWYgKGRpZmZzLmxlbmd0aCA+IDIpIHtcclxuICAgICAgICB0aGlzLmRpZmZfY2xlYW51cFNlbWFudGljKGRpZmZzKTtcclxuICAgICAgICB0aGlzLmRpZmZfY2xlYW51cEVmZmljaWVuY3koZGlmZnMpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKGEgJiYgdHlwZW9mIGEgPT0gJ29iamVjdCcgJiYgdHlwZW9mIG9wdF9iID09ICd1bmRlZmluZWQnICYmXHJcbiAgICAgICAgdHlwZW9mIG9wdF9jID09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgIC8vIE1ldGhvZCAyOiBkaWZmc1xyXG4gICAgICAvLyBDb21wdXRlIHRleHQxIGZyb20gZGlmZnMuXHJcbiAgICAgIGRpZmZzID0gKGEpO1xyXG4gICAgICB0ZXh0MSA9IHRoaXMuZGlmZl90ZXh0MShkaWZmcyk7XHJcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBhID09ICdzdHJpbmcnICYmIG9wdF9iICYmIHR5cGVvZiBvcHRfYiA9PSAnb2JqZWN0JyAmJlxyXG4gICAgICAgIHR5cGVvZiBvcHRfYyA9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAvLyBNZXRob2QgMzogdGV4dDEsIGRpZmZzXHJcbiAgICAgIHRleHQxID0gKGEpO1xyXG4gICAgICBkaWZmcyA9IChvcHRfYik7XHJcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBhID09ICdzdHJpbmcnICYmIHR5cGVvZiBvcHRfYiA9PSAnc3RyaW5nJyAmJlxyXG4gICAgICAgIG9wdF9jICYmIHR5cGVvZiBvcHRfYyA9PSAnb2JqZWN0Jykge1xyXG4gICAgICAvLyBNZXRob2QgNDogdGV4dDEsIHRleHQyLCBkaWZmc1xyXG4gICAgICAvLyB0ZXh0MiBpcyBub3QgdXNlZC5cclxuICAgICAgdGV4dDEgPSAoYSk7XHJcbiAgICAgIGRpZmZzID0gKG9wdF9jKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBjYWxsIGZvcm1hdCB0byBwYXRjaF9tYWtlLicpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChkaWZmcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIFtdOyAgLy8gR2V0IHJpZCBvZiB0aGUgbnVsbCBjYXNlLlxyXG4gICAgfVxyXG4gICAgY29uc3QgcGF0Y2hlcyA9IFtdO1xyXG4gICAgbGV0IHBhdGNoID0gbmV3IHBhdGNoX29iaigpO1xyXG4gICAgbGV0IHBhdGNoRGlmZkxlbmd0aCA9IDA7ICAvLyBLZWVwaW5nIG91ciBvd24gbGVuZ3RoIGNvbnN0IGlzIGZhc3RlciBpbiBKUy5cclxuICAgIGxldCBjaGFyX2NvdW50MSA9IDA7ICAvLyBOdW1iZXIgb2YgY2hhcmFjdGVycyBpbnRvIHRoZSB0ZXh0MSBzdHJpbmcuXHJcbiAgICBsZXQgY2hhcl9jb3VudDIgPSAwOyAgLy8gTnVtYmVyIG9mIGNoYXJhY3RlcnMgaW50byB0aGUgdGV4dDIgc3RyaW5nLlxyXG4gICAgLy8gU3RhcnQgd2l0aCB0ZXh0MSAocHJlcGF0Y2hfdGV4dCkgYW5kIGFwcGx5IHRoZSBkaWZmcyB1bnRpbCB3ZSBhcnJpdmUgYXRcclxuICAgIC8vIHRleHQyIChwb3N0cGF0Y2hfdGV4dCkuICBXZSByZWNyZWF0ZSB0aGUgcGF0Y2hlcyBvbmUgYnkgb25lIHRvIGRldGVybWluZVxyXG4gICAgLy8gY29udGV4dCBpbmZvLlxyXG4gICAgbGV0IHByZXBhdGNoX3RleHQgPSB0ZXh0MTtcclxuICAgIGxldCBwb3N0cGF0Y2hfdGV4dCA9IHRleHQxO1xyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBkaWZmcy5sZW5ndGg7IHgrKykge1xyXG4gICAgICBjb25zdCBkaWZmX3R5cGUgPSBkaWZmc1t4XVswXTtcclxuICAgICAgY29uc3QgZGlmZl90ZXh0ID0gZGlmZnNbeF1bMV07XHJcblxyXG4gICAgICBpZiAoIXBhdGNoRGlmZkxlbmd0aCAmJiBkaWZmX3R5cGUgIT09IERpZmZPcC5FcXVhbCkge1xyXG4gICAgICAgIC8vIEEgbmV3IHBhdGNoIHN0YXJ0cyBoZXJlLlxyXG4gICAgICAgIHBhdGNoLnN0YXJ0MSA9IGNoYXJfY291bnQxO1xyXG4gICAgICAgIHBhdGNoLnN0YXJ0MiA9IGNoYXJfY291bnQyO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBzd2l0Y2ggKGRpZmZfdHlwZSkge1xyXG4gICAgICAgIGNhc2UgRGlmZk9wLkluc2VydDpcclxuICAgICAgICAgIHBhdGNoLmRpZmZzW3BhdGNoRGlmZkxlbmd0aCsrXSA9IGRpZmZzW3hdO1xyXG4gICAgICAgICAgcGF0Y2gubGVuZ3RoMiArPSBkaWZmX3RleHQubGVuZ3RoO1xyXG4gICAgICAgICAgcG9zdHBhdGNoX3RleHQgPSBwb3N0cGF0Y2hfdGV4dC5zdWJzdHJpbmcoMCwgY2hhcl9jb3VudDIpICsgZGlmZl90ZXh0ICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBwb3N0cGF0Y2hfdGV4dC5zdWJzdHJpbmcoY2hhcl9jb3VudDIpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBEaWZmT3AuRGVsZXRlOlxyXG4gICAgICAgICAgcGF0Y2gubGVuZ3RoMSArPSBkaWZmX3RleHQubGVuZ3RoO1xyXG4gICAgICAgICAgcGF0Y2guZGlmZnNbcGF0Y2hEaWZmTGVuZ3RoKytdID0gZGlmZnNbeF07XHJcbiAgICAgICAgICBwb3N0cGF0Y2hfdGV4dCA9IHBvc3RwYXRjaF90ZXh0LnN1YnN0cmluZygwLCBjaGFyX2NvdW50MikgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBvc3RwYXRjaF90ZXh0LnN1YnN0cmluZyhjaGFyX2NvdW50MiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZfdGV4dC5sZW5ndGgpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBEaWZmT3AuRXF1YWw6XHJcbiAgICAgICAgICBpZiAoZGlmZl90ZXh0Lmxlbmd0aCA8PSAyICogdGhpcy5QYXRjaF9NYXJnaW4gJiZcclxuICAgICAgICAgICAgICBwYXRjaERpZmZMZW5ndGggJiYgZGlmZnMubGVuZ3RoICE9IHggKyAxKSB7XHJcbiAgICAgICAgICAgIC8vIFNtYWxsIGVxdWFsaXR5IGluc2lkZSBhIHBhdGNoLlxyXG4gICAgICAgICAgICBwYXRjaC5kaWZmc1twYXRjaERpZmZMZW5ndGgrK10gPSBkaWZmc1t4XTtcclxuICAgICAgICAgICAgcGF0Y2gubGVuZ3RoMSArPSBkaWZmX3RleHQubGVuZ3RoO1xyXG4gICAgICAgICAgICBwYXRjaC5sZW5ndGgyICs9IGRpZmZfdGV4dC5sZW5ndGg7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKGRpZmZfdGV4dC5sZW5ndGggPj0gMiAqIHRoaXMuUGF0Y2hfTWFyZ2luKSB7XHJcbiAgICAgICAgICAgIC8vIFRpbWUgZm9yIGEgbmV3IHBhdGNoLlxyXG4gICAgICAgICAgICBpZiAocGF0Y2hEaWZmTGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgdGhpcy5wYXRjaF9hZGRDb250ZXh0XyhwYXRjaCwgcHJlcGF0Y2hfdGV4dCk7XHJcbiAgICAgICAgICAgICAgcGF0Y2hlcy5wdXNoKHBhdGNoKTtcclxuICAgICAgICAgICAgICBwYXRjaCA9IG5ldyBwYXRjaF9vYmooKTtcclxuICAgICAgICAgICAgICBwYXRjaERpZmZMZW5ndGggPSAwO1xyXG4gICAgICAgICAgICAgIC8vIFVubGlrZSBVbmlkaWZmLCBvdXIgcGF0Y2ggbGlzdHMgaGF2ZSBhIHJvbGxpbmcgY29udGV4dC5cclxuICAgICAgICAgICAgICAvLyBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZ29vZ2xlLWRpZmYtbWF0Y2gtcGF0Y2gvd2lraS9VbmlkaWZmXHJcbiAgICAgICAgICAgICAgLy8gVXBkYXRlIHByZXBhdGNoIHRleHQgJiBwb3MgdG8gcmVmbGVjdCB0aGUgYXBwbGljYXRpb24gb2YgdGhlXHJcbiAgICAgICAgICAgICAgLy8ganVzdCBjb21wbGV0ZWQgcGF0Y2guXHJcbiAgICAgICAgICAgICAgcHJlcGF0Y2hfdGV4dCA9IHBvc3RwYXRjaF90ZXh0O1xyXG4gICAgICAgICAgICAgIGNoYXJfY291bnQxID0gY2hhcl9jb3VudDI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBVcGRhdGUgdGhlIGN1cnJlbnQgY2hhcmFjdGVyIGNvdW50LlxyXG4gICAgICBpZiAoZGlmZl90eXBlICE9PSBEaWZmT3AuSW5zZXJ0KSB7XHJcbiAgICAgICAgY2hhcl9jb3VudDEgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcclxuICAgICAgfVxyXG4gICAgICBpZiAoZGlmZl90eXBlICE9PSBEaWZmT3AuRGVsZXRlKSB7XHJcbiAgICAgICAgY2hhcl9jb3VudDIgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gUGljayB1cCB0aGUgbGVmdG92ZXIgcGF0Y2ggaWYgbm90IGVtcHR5LlxyXG4gICAgaWYgKHBhdGNoRGlmZkxlbmd0aCkge1xyXG4gICAgICB0aGlzLnBhdGNoX2FkZENvbnRleHRfKHBhdGNoLCBwcmVwYXRjaF90ZXh0KTtcclxuICAgICAgcGF0Y2hlcy5wdXNoKHBhdGNoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcGF0Y2hlcztcclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogR2l2ZW4gYW4gYXJyYXkgb2YgcGF0Y2hlcywgcmV0dXJuIGFub3RoZXIgYXJyYXkgdGhhdCBpcyBpZGVudGljYWwuXHJcbiAgICogQHBhcmFtICBwYXRjaGVzIEFycmF5IG9mIFBhdGNoIG9iamVjdHMuXHJcbiAgICogQHJldHVybiAgQXJyYXkgb2YgUGF0Y2ggb2JqZWN0cy5cclxuICAgKi9cclxuICAgIHBhdGNoX2RlZXBDb3B5IChwYXRjaGVzOiBBcnJheTxwYXRjaF9vYmo+KTogQXJyYXk8cGF0Y2hfb2JqPiB7XHJcbiAgICAvLyBNYWtpbmcgZGVlcCBjb3BpZXMgaXMgaGFyZCBpbiBKYXZhU2NyaXB0LlxyXG4gICAgY29uc3QgcGF0Y2hlc0NvcHkgPSBbXTtcclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgcGF0Y2hlcy5sZW5ndGg7IHgrKykge1xyXG4gICAgICBjb25zdCBwYXRjaCA9IHBhdGNoZXNbeF07XHJcbiAgICAgIGNvbnN0IHBhdGNoQ29weSA9IG5ldyBwYXRjaF9vYmooKTtcclxuICAgICAgcGF0Y2hDb3B5LmRpZmZzID0gW107XHJcbiAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgcGF0Y2guZGlmZnMubGVuZ3RoOyB5KyspIHtcclxuICAgICAgICBwYXRjaENvcHkuZGlmZnNbeV0gPSBbcGF0Y2guZGlmZnNbeV1bMF0sIHBhdGNoLmRpZmZzW3ldWzFdXTtcclxuICAgICAgfVxyXG4gICAgICBwYXRjaENvcHkuc3RhcnQxID0gcGF0Y2guc3RhcnQxO1xyXG4gICAgICBwYXRjaENvcHkuc3RhcnQyID0gcGF0Y2guc3RhcnQyO1xyXG4gICAgICBwYXRjaENvcHkubGVuZ3RoMSA9IHBhdGNoLmxlbmd0aDE7XHJcbiAgICAgIHBhdGNoQ29weS5sZW5ndGgyID0gcGF0Y2gubGVuZ3RoMjtcclxuICAgICAgcGF0Y2hlc0NvcHlbeF0gPSBwYXRjaENvcHk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcGF0Y2hlc0NvcHk7XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIE1lcmdlIGEgc2V0IG9mIHBhdGNoZXMgb250byB0aGUgdGV4dC4gIFJldHVybiBhIHBhdGNoZWQgdGV4dCwgYXMgd2VsbFxyXG4gICAqIGFzIGEgbGlzdCBvZiB0cnVlL2ZhbHNlIHZhbHVlcyBpbmRpY2F0aW5nIHdoaWNoIHBhdGNoZXMgd2VyZSBhcHBsaWVkLlxyXG4gICAqIEBwYXJhbSAgcGF0Y2hlcyBBcnJheSBvZiBQYXRjaCBvYmplY3RzLlxyXG4gICAqIEBwYXJhbSAgdGV4dCBPbGQgdGV4dC5cclxuICAgKiBAcmV0dXJuICBUd28gZWxlbWVudCBBcnJheSwgY29udGFpbmluZyB0aGVcclxuICAgKiAgICAgIG5ldyB0ZXh0IGFuZCBhbiBhcnJheSBvZiBib29sZWFuIHZhbHVlcy5cclxuICAgKi9cclxuICAgIHBhdGNoX2FwcGx5IChwYXRjaGVzOiBBcnJheTxwYXRjaF9vYmo+LCB0ZXh0OiBzdHJpbmcpIHtcclxuICAgIGlmIChwYXRjaGVzLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgIHJldHVybiBbdGV4dCwgW11dO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERlZXAgY29weSB0aGUgcGF0Y2hlcyBzbyB0aGF0IG5vIGNoYW5nZXMgYXJlIG1hZGUgdG8gb3JpZ2luYWxzLlxyXG4gICAgcGF0Y2hlcyA9IHRoaXMucGF0Y2hfZGVlcENvcHkocGF0Y2hlcyk7XHJcblxyXG4gICAgY29uc3QgbnVsbFBhZGRpbmcgPSB0aGlzLnBhdGNoX2FkZFBhZGRpbmcocGF0Y2hlcyk7XHJcbiAgICB0ZXh0ID0gbnVsbFBhZGRpbmcgKyB0ZXh0ICsgbnVsbFBhZGRpbmc7XHJcblxyXG4gICAgdGhpcy5wYXRjaF9zcGxpdE1heChwYXRjaGVzKTtcclxuICAgIC8vIGRlbHRhIGtlZXBzIHRyYWNrIG9mIHRoZSBvZmZzZXQgYmV0d2VlbiB0aGUgZXhwZWN0ZWQgYW5kIGFjdHVhbCBsb2NhdGlvblxyXG4gICAgLy8gb2YgdGhlIHByZXZpb3VzIHBhdGNoLiAgSWYgdGhlcmUgYXJlIHBhdGNoZXMgZXhwZWN0ZWQgYXQgcG9zaXRpb25zIDEwIGFuZFxyXG4gICAgLy8gMjAsIGJ1dCB0aGUgZmlyc3QgcGF0Y2ggd2FzIGZvdW5kIGF0IDEyLCBkZWx0YSBpcyAyIGFuZCB0aGUgc2Vjb25kIHBhdGNoXHJcbiAgICAvLyBoYXMgYW4gZWZmZWN0aXZlIGV4cGVjdGVkIHBvc2l0aW9uIG9mIDIyLlxyXG4gICAgbGV0IGRlbHRhID0gMDtcclxuICAgIGNvbnN0IHJlc3VsdHMgPSBbXTtcclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgcGF0Y2hlcy5sZW5ndGg7IHgrKykge1xyXG4gICAgICBjb25zdCBleHBlY3RlZF9sb2MgPSBwYXRjaGVzW3hdLnN0YXJ0MiArIGRlbHRhO1xyXG4gICAgICBjb25zdCB0ZXh0MSA9IHRoaXMuZGlmZl90ZXh0MShwYXRjaGVzW3hdLmRpZmZzKTtcclxuICAgICAgbGV0IHN0YXJ0X2xvYztcclxuICAgICAgbGV0IGVuZF9sb2MgPSAtMTtcclxuICAgICAgaWYgKHRleHQxLmxlbmd0aCA+IHRoaXMuTWF0Y2hfTWF4Qml0cykge1xyXG4gICAgICAgIC8vIHBhdGNoX3NwbGl0TWF4IHdpbGwgb25seSBwcm92aWRlIGFuIG92ZXJzaXplZCBwYXR0ZXJuIGluIHRoZSBjYXNlIG9mXHJcbiAgICAgICAgLy8gYSBtb25zdGVyIGRlbGV0ZS5cclxuICAgICAgICBzdGFydF9sb2MgPSB0aGlzLm1hdGNoX21haW4odGV4dCwgdGV4dDEuc3Vic3RyaW5nKDAsIHRoaXMuTWF0Y2hfTWF4Qml0cyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkX2xvYyk7XHJcbiAgICAgICAgaWYgKHN0YXJ0X2xvYyAhPSAtMSkge1xyXG4gICAgICAgICAgZW5kX2xvYyA9IHRoaXMubWF0Y2hfbWFpbih0ZXh0LFxyXG4gICAgICAgICAgICAgIHRleHQxLnN1YnN0cmluZyh0ZXh0MS5sZW5ndGggLSB0aGlzLk1hdGNoX01heEJpdHMpLFxyXG4gICAgICAgICAgICAgIGV4cGVjdGVkX2xvYyArIHRleHQxLmxlbmd0aCAtIHRoaXMuTWF0Y2hfTWF4Qml0cyk7XHJcbiAgICAgICAgICBpZiAoZW5kX2xvYyA9PSAtMSB8fCBzdGFydF9sb2MgPj0gZW5kX2xvYykge1xyXG4gICAgICAgICAgICAvLyBDYW4ndCBmaW5kIHZhbGlkIHRyYWlsaW5nIGNvbnRleHQuICBEcm9wIHRoaXMgcGF0Y2guXHJcbiAgICAgICAgICAgIHN0YXJ0X2xvYyA9IC0xO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBzdGFydF9sb2MgPSB0aGlzLm1hdGNoX21haW4odGV4dCwgdGV4dDEsIGV4cGVjdGVkX2xvYyk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHN0YXJ0X2xvYyA9PSAtMSkge1xyXG4gICAgICAgIC8vIE5vIG1hdGNoIGZvdW5kLiAgOihcclxuICAgICAgICByZXN1bHRzW3hdID0gZmFsc2U7XHJcbiAgICAgICAgLy8gU3VidHJhY3QgdGhlIGRlbHRhIGZvciB0aGlzIGZhaWxlZCBwYXRjaCBmcm9tIHN1YnNlcXVlbnQgcGF0Y2hlcy5cclxuICAgICAgICBkZWx0YSAtPSBwYXRjaGVzW3hdLmxlbmd0aDIgLSBwYXRjaGVzW3hdLmxlbmd0aDE7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gRm91bmQgYSBtYXRjaC4gIDopXHJcbiAgICAgICAgcmVzdWx0c1t4XSA9IHRydWU7XHJcbiAgICAgICAgZGVsdGEgPSBzdGFydF9sb2MgLSBleHBlY3RlZF9sb2M7XHJcbiAgICAgICAgbGV0IHRleHQyO1xyXG4gICAgICAgIGlmIChlbmRfbG9jID09IC0xKSB7XHJcbiAgICAgICAgICB0ZXh0MiA9IHRleHQuc3Vic3RyaW5nKHN0YXJ0X2xvYywgc3RhcnRfbG9jICsgdGV4dDEubGVuZ3RoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdGV4dDIgPSB0ZXh0LnN1YnN0cmluZyhzdGFydF9sb2MsIGVuZF9sb2MgKyB0aGlzLk1hdGNoX01heEJpdHMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGV4dDEgPT0gdGV4dDIpIHtcclxuICAgICAgICAgIC8vIFBlcmZlY3QgbWF0Y2gsIGp1c3Qgc2hvdmUgdGhlIHJlcGxhY2VtZW50IHRleHQgaW4uXHJcbiAgICAgICAgICB0ZXh0ID0gdGV4dC5zdWJzdHJpbmcoMCwgc3RhcnRfbG9jKSArXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpZmZfdGV4dDIocGF0Y2hlc1t4XS5kaWZmcykgK1xyXG4gICAgICAgICAgICAgICAgdGV4dC5zdWJzdHJpbmcoc3RhcnRfbG9jICsgdGV4dDEubGVuZ3RoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgLy8gSW1wZXJmZWN0IG1hdGNoLiAgUnVuIGEgZGlmZiB0byBnZXQgYSBmcmFtZXdvcmsgb2YgZXF1aXZhbGVudFxyXG4gICAgICAgICAgLy8gaW5kaWNlcy5cclxuICAgICAgICAgIGNvbnN0IGRpZmZzID0gdGhpcy5kaWZmX21haW4odGV4dDEsIHRleHQyLCBmYWxzZSk7XHJcbiAgICAgICAgICBpZiAodGV4dDEubGVuZ3RoID4gdGhpcy5NYXRjaF9NYXhCaXRzICYmXHJcbiAgICAgICAgICAgICAgdGhpcy5kaWZmX2xldmVuc2h0ZWluKGRpZmZzKSAvIHRleHQxLmxlbmd0aCA+XHJcbiAgICAgICAgICAgICAgdGhpcy5QYXRjaF9EZWxldGVUaHJlc2hvbGQpIHtcclxuICAgICAgICAgICAgLy8gVGhlIGVuZCBwb2ludHMgbWF0Y2gsIGJ1dCB0aGUgY29udGVudCBpcyB1bmFjY2VwdGFibHkgYmFkLlxyXG4gICAgICAgICAgICByZXN1bHRzW3hdID0gZmFsc2U7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmRpZmZfY2xlYW51cFNlbWFudGljTG9zc2xlc3MoZGlmZnMpO1xyXG4gICAgICAgICAgICBsZXQgaW5kZXgxID0gMDtcclxuICAgICAgICAgICAgbGV0IGluZGV4MjtcclxuICAgICAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBwYXRjaGVzW3hdLmRpZmZzLmxlbmd0aDsgeSsrKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgbW9kID0gcGF0Y2hlc1t4XS5kaWZmc1t5XTtcclxuICAgICAgICAgICAgICBpZiAobW9kWzBdICE9PSBEaWZmT3AuRXF1YWwpIHtcclxuICAgICAgICAgICAgICAgIGluZGV4MiA9IHRoaXMuZGlmZl94SW5kZXgoZGlmZnMsIGluZGV4MSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGlmIChtb2RbMF0gPT09IERpZmZPcC5JbnNlcnQpIHsgIC8vIEluc2VydGlvblxyXG4gICAgICAgICAgICAgICAgdGV4dCA9IHRleHQuc3Vic3RyaW5nKDAsIHN0YXJ0X2xvYyArIGluZGV4MikgKyBtb2RbMV0gK1xyXG4gICAgICAgICAgICAgICAgICAgICAgdGV4dC5zdWJzdHJpbmcoc3RhcnRfbG9jICsgaW5kZXgyKTtcclxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1vZFswXSA9PT0gRGlmZk9wLkRlbGV0ZSkgeyAgLy8gRGVsZXRpb25cclxuICAgICAgICAgICAgICAgIHRleHQgPSB0ZXh0LnN1YnN0cmluZygwLCBzdGFydF9sb2MgKyBpbmRleDIpICtcclxuICAgICAgICAgICAgICAgICAgICAgIHRleHQuc3Vic3RyaW5nKHN0YXJ0X2xvYyArIHRoaXMuZGlmZl94SW5kZXgoZGlmZnMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXgxICsgbW9kWzFdLmxlbmd0aCkpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBpZiAobW9kWzBdICE9PSBEaWZmT3AuRGVsZXRlKSB7XHJcbiAgICAgICAgICAgICAgICBpbmRleDEgKz0gbW9kWzFdLmxlbmd0aDtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIFN0cmlwIHRoZSBwYWRkaW5nIG9mZi5cclxuICAgIHRleHQgPSB0ZXh0LnN1YnN0cmluZyhudWxsUGFkZGluZy5sZW5ndGgsIHRleHQubGVuZ3RoIC0gbnVsbFBhZGRpbmcubGVuZ3RoKTtcclxuICAgIHJldHVybiBbdGV4dCwgcmVzdWx0c107XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZCBzb21lIHBhZGRpbmcgb24gdGV4dCBzdGFydCBhbmQgZW5kIHNvIHRoYXQgZWRnZXMgY2FuIG1hdGNoIHNvbWV0aGluZy5cclxuICAgKiBJbnRlbmRlZCB0byBiZSBjYWxsZWQgb25seSBmcm9tIHdpdGhpbiBwYXRjaF9hcHBseS5cclxuICAgKiBAcGFyYW0gIHBhdGNoZXMgQXJyYXkgb2YgUGF0Y2ggb2JqZWN0cy5cclxuICAgKiBAcmV0dXJuICBUaGUgcGFkZGluZyBzdHJpbmcgYWRkZWQgdG8gZWFjaCBzaWRlLlxyXG4gICAqL1xyXG4gICAgcGF0Y2hfYWRkUGFkZGluZyAocGF0Y2hlczogQXJyYXk8cGF0Y2hfb2JqPikge1xyXG4gICAgY29uc3QgcGFkZGluZ0xlbmd0aCA9IHRoaXMuUGF0Y2hfTWFyZ2luO1xyXG4gICAgbGV0IG51bGxQYWRkaW5nID0gJyc7XHJcbiAgICBmb3IgKGxldCB4ID0gMTsgeCA8PSBwYWRkaW5nTGVuZ3RoOyB4KyspIHtcclxuICAgICAgbnVsbFBhZGRpbmcgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSh4KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBCdW1wIGFsbCB0aGUgcGF0Y2hlcyBmb3J3YXJkLlxyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBwYXRjaGVzLmxlbmd0aDsgeCsrKSB7XHJcbiAgICAgIHBhdGNoZXNbeF0uc3RhcnQxICs9IHBhZGRpbmdMZW5ndGg7XHJcbiAgICAgIHBhdGNoZXNbeF0uc3RhcnQyICs9IHBhZGRpbmdMZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQWRkIHNvbWUgcGFkZGluZyBvbiBzdGFydCBvZiBmaXJzdCBkaWZmLlxyXG4gICAgbGV0IHBhdGNoID0gcGF0Y2hlc1swXTtcclxuICAgIGxldCBkaWZmcyA9IHBhdGNoLmRpZmZzO1xyXG4gICAgaWYgKGRpZmZzLmxlbmd0aCA9PSAwIHx8IGRpZmZzWzBdWzBdICE9IERpZmZPcC5FcXVhbCkge1xyXG4gICAgICAvLyBBZGQgbnVsbFBhZGRpbmcgZXF1YWxpdHkuXHJcbiAgICAgIGRpZmZzLnVuc2hpZnQoW0RpZmZPcC5FcXVhbCwgbnVsbFBhZGRpbmddKTtcclxuICAgICAgcGF0Y2guc3RhcnQxIC09IHBhZGRpbmdMZW5ndGg7ICAvLyBTaG91bGQgYmUgMC5cclxuICAgICAgcGF0Y2guc3RhcnQyIC09IHBhZGRpbmdMZW5ndGg7ICAvLyBTaG91bGQgYmUgMC5cclxuICAgICAgcGF0Y2gubGVuZ3RoMSArPSBwYWRkaW5nTGVuZ3RoO1xyXG4gICAgICBwYXRjaC5sZW5ndGgyICs9IHBhZGRpbmdMZW5ndGg7XHJcbiAgICB9IGVsc2UgaWYgKHBhZGRpbmdMZW5ndGggPiBkaWZmc1swXVsxXS5sZW5ndGgpIHtcclxuICAgICAgLy8gR3JvdyBmaXJzdCBlcXVhbGl0eS5cclxuICAgICAgY29uc3QgZXh0cmFMZW5ndGggPSBwYWRkaW5nTGVuZ3RoIC0gZGlmZnNbMF1bMV0ubGVuZ3RoO1xyXG4gICAgICBkaWZmc1swXVsxXSA9IG51bGxQYWRkaW5nLnN1YnN0cmluZyhkaWZmc1swXVsxXS5sZW5ndGgpICsgZGlmZnNbMF1bMV07XHJcbiAgICAgIHBhdGNoLnN0YXJ0MSAtPSBleHRyYUxlbmd0aDtcclxuICAgICAgcGF0Y2guc3RhcnQyIC09IGV4dHJhTGVuZ3RoO1xyXG4gICAgICBwYXRjaC5sZW5ndGgxICs9IGV4dHJhTGVuZ3RoO1xyXG4gICAgICBwYXRjaC5sZW5ndGgyICs9IGV4dHJhTGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEFkZCBzb21lIHBhZGRpbmcgb24gZW5kIG9mIGxhc3QgZGlmZi5cclxuICAgIHBhdGNoID0gcGF0Y2hlc1twYXRjaGVzLmxlbmd0aCAtIDFdO1xyXG4gICAgZGlmZnMgPSBwYXRjaC5kaWZmcztcclxuICAgIGlmIChkaWZmcy5sZW5ndGggPT0gMCB8fCBkaWZmc1tkaWZmcy5sZW5ndGggLSAxXVswXSAhPSBEaWZmT3AuRXF1YWwpIHtcclxuICAgICAgLy8gQWRkIG51bGxQYWRkaW5nIGVxdWFsaXR5LlxyXG4gICAgICBkaWZmcy5wdXNoKFtEaWZmT3AuRXF1YWwsIG51bGxQYWRkaW5nXSk7XHJcbiAgICAgIHBhdGNoLmxlbmd0aDEgKz0gcGFkZGluZ0xlbmd0aDtcclxuICAgICAgcGF0Y2gubGVuZ3RoMiArPSBwYWRkaW5nTGVuZ3RoO1xyXG4gICAgfSBlbHNlIGlmIChwYWRkaW5nTGVuZ3RoID4gZGlmZnNbZGlmZnMubGVuZ3RoIC0gMV1bMV0ubGVuZ3RoKSB7XHJcbiAgICAgIC8vIEdyb3cgbGFzdCBlcXVhbGl0eS5cclxuICAgICAgY29uc3QgZXh0cmFMZW5ndGggPSBwYWRkaW5nTGVuZ3RoIC0gZGlmZnNbZGlmZnMubGVuZ3RoIC0gMV1bMV0ubGVuZ3RoO1xyXG4gICAgICBkaWZmc1tkaWZmcy5sZW5ndGggLSAxXVsxXSArPSBudWxsUGFkZGluZy5zdWJzdHJpbmcoMCwgZXh0cmFMZW5ndGgpO1xyXG4gICAgICBwYXRjaC5sZW5ndGgxICs9IGV4dHJhTGVuZ3RoO1xyXG4gICAgICBwYXRjaC5sZW5ndGgyICs9IGV4dHJhTGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBudWxsUGFkZGluZztcclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogTG9vayB0aHJvdWdoIHRoZSBwYXRjaGVzIGFuZCBicmVhayB1cCBhbnkgd2hpY2ggYXJlIGxvbmdlciB0aGFuIHRoZSBtYXhpbXVtXHJcbiAgICogbGltaXQgb2YgdGhlIG1hdGNoIGFsZ29yaXRobS5cclxuICAgKiBJbnRlbmRlZCB0byBiZSBjYWxsZWQgb25seSBmcm9tIHdpdGhpbiBwYXRjaF9hcHBseS5cclxuICAgKiBAcGFyYW0gIHBhdGNoZXMgQXJyYXkgb2YgUGF0Y2ggb2JqZWN0cy5cclxuICAgKi9cclxuICAgIHBhdGNoX3NwbGl0TWF4ID0gZnVuY3Rpb24ocGF0Y2hlczogQXJyYXk8cGF0Y2hfb2JqPikge1xyXG4gICAgY29uc3QgcGF0Y2hfc2l6ZSA9IHRoaXMuTWF0Y2hfTWF4Qml0cztcclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgcGF0Y2hlcy5sZW5ndGg7IHgrKykge1xyXG4gICAgICBpZiAocGF0Y2hlc1t4XS5sZW5ndGgxIDw9IHBhdGNoX3NpemUpIHtcclxuICAgICAgICBjb250aW51ZTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBiaWdwYXRjaCA9IHBhdGNoZXNbeF07XHJcbiAgICAgIC8vIFJlbW92ZSB0aGUgYmlnIG9sZCBwYXRjaC5cclxuICAgICAgcGF0Y2hlcy5zcGxpY2UoeC0tLCAxKTtcclxuICAgICAgbGV0IHN0YXJ0MSA9IGJpZ3BhdGNoLnN0YXJ0MTtcclxuICAgICAgbGV0IHN0YXJ0MiA9IGJpZ3BhdGNoLnN0YXJ0MjtcclxuICAgICAgbGV0IHByZWNvbnRleHQgPSAnJztcclxuICAgICAgd2hpbGUgKGJpZ3BhdGNoLmRpZmZzLmxlbmd0aCAhPT0gMCkge1xyXG4gICAgICAgIC8vIENyZWF0ZSBvbmUgb2Ygc2V2ZXJhbCBzbWFsbGVyIHBhdGNoZXMuXHJcbiAgICAgICAgY29uc3QgcGF0Y2ggPSBuZXcgcGF0Y2hfb2JqKCk7XHJcbiAgICAgICAgbGV0IGVtcHR5ID0gdHJ1ZTtcclxuICAgICAgICBwYXRjaC5zdGFydDEgPSBzdGFydDEgLSBwcmVjb250ZXh0Lmxlbmd0aDtcclxuICAgICAgICBwYXRjaC5zdGFydDIgPSBzdGFydDIgLSBwcmVjb250ZXh0Lmxlbmd0aDtcclxuICAgICAgICBpZiAocHJlY29udGV4dCAhPT0gJycpIHtcclxuICAgICAgICAgIHBhdGNoLmxlbmd0aDEgPSBwYXRjaC5sZW5ndGgyID0gcHJlY29udGV4dC5sZW5ndGg7XHJcbiAgICAgICAgICBwYXRjaC5kaWZmcy5wdXNoKFtEaWZmT3AuRXF1YWwsIHByZWNvbnRleHRdKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgd2hpbGUgKGJpZ3BhdGNoLmRpZmZzLmxlbmd0aCAhPT0gMCAmJlxyXG4gICAgICAgICAgICAgIHBhdGNoLmxlbmd0aDEgPCBwYXRjaF9zaXplIC0gdGhpcy5QYXRjaF9NYXJnaW4pIHtcclxuICAgICAgICAgIGNvbnN0IGRpZmZfdHlwZSA9IGJpZ3BhdGNoLmRpZmZzWzBdWzBdO1xyXG4gICAgICAgICAgbGV0IGRpZmZfdGV4dCA9IGJpZ3BhdGNoLmRpZmZzWzBdWzFdO1xyXG4gICAgICAgICAgaWYgKGRpZmZfdHlwZSA9PT0gRGlmZk9wLkluc2VydCkge1xyXG4gICAgICAgICAgICAvLyBJbnNlcnRpb25zIGFyZSBoYXJtbGVzcy5cclxuICAgICAgICAgICAgcGF0Y2gubGVuZ3RoMiArPSBkaWZmX3RleHQubGVuZ3RoO1xyXG4gICAgICAgICAgICBzdGFydDIgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcclxuICAgICAgICAgICAgcGF0Y2guZGlmZnMucHVzaChiaWdwYXRjaC5kaWZmcy5zaGlmdCgpKTtcclxuICAgICAgICAgICAgZW1wdHkgPSBmYWxzZTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAoZGlmZl90eXBlID09PSBEaWZmT3AuRGVsZXRlICYmIHBhdGNoLmRpZmZzLmxlbmd0aCA9PSAxICYmXHJcbiAgICAgICAgICAgICAgICAgICAgcGF0Y2guZGlmZnNbMF1bMF0gPT0gRGlmZk9wLkVxdWFsICYmXHJcbiAgICAgICAgICAgICAgICAgICAgZGlmZl90ZXh0Lmxlbmd0aCA+IDIgKiBwYXRjaF9zaXplKSB7XHJcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBsYXJnZSBkZWxldGlvbi4gIExldCBpdCBwYXNzIGluIG9uZSBjaHVuay5cclxuICAgICAgICAgICAgcGF0Y2gubGVuZ3RoMSArPSBkaWZmX3RleHQubGVuZ3RoO1xyXG4gICAgICAgICAgICBzdGFydDEgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcclxuICAgICAgICAgICAgZW1wdHkgPSBmYWxzZTtcclxuICAgICAgICAgICAgcGF0Y2guZGlmZnMucHVzaChbZGlmZl90eXBlLCBkaWZmX3RleHRdKTtcclxuICAgICAgICAgICAgYmlncGF0Y2guZGlmZnMuc2hpZnQoKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIERlbGV0aW9uIG9yIGVxdWFsaXR5LiAgT25seSB0YWtlIGFzIG11Y2ggYXMgd2UgY2FuIHN0b21hY2guXHJcbiAgICAgICAgICAgIGRpZmZfdGV4dCA9IGRpZmZfdGV4dC5zdWJzdHJpbmcoMCxcclxuICAgICAgICAgICAgICAgIHBhdGNoX3NpemUgLSBwYXRjaC5sZW5ndGgxIC0gdGhpcy5QYXRjaF9NYXJnaW4pO1xyXG4gICAgICAgICAgICBwYXRjaC5sZW5ndGgxICs9IGRpZmZfdGV4dC5sZW5ndGg7XHJcbiAgICAgICAgICAgIHN0YXJ0MSArPSBkaWZmX3RleHQubGVuZ3RoO1xyXG4gICAgICAgICAgICBpZiAoZGlmZl90eXBlID09PSBEaWZmT3AuRXF1YWwpIHtcclxuICAgICAgICAgICAgICBwYXRjaC5sZW5ndGgyICs9IGRpZmZfdGV4dC5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgc3RhcnQyICs9IGRpZmZfdGV4dC5sZW5ndGg7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgZW1wdHkgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBwYXRjaC5kaWZmcy5wdXNoKFtkaWZmX3R5cGUsIGRpZmZfdGV4dF0pO1xyXG4gICAgICAgICAgICBpZiAoZGlmZl90ZXh0ID09IGJpZ3BhdGNoLmRpZmZzWzBdWzFdKSB7XHJcbiAgICAgICAgICAgICAgYmlncGF0Y2guZGlmZnMuc2hpZnQoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBiaWdwYXRjaC5kaWZmc1swXVsxXSA9XHJcbiAgICAgICAgICAgICAgICAgIGJpZ3BhdGNoLmRpZmZzWzBdWzFdLnN1YnN0cmluZyhkaWZmX3RleHQubGVuZ3RoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBDb21wdXRlIHRoZSBoZWFkIGNvbnRleHQgZm9yIHRoZSBuZXh0IHBhdGNoLlxyXG4gICAgICAgIHByZWNvbnRleHQgPSB0aGlzLmRpZmZfdGV4dDIocGF0Y2guZGlmZnMpO1xyXG4gICAgICAgIHByZWNvbnRleHQgPVxyXG4gICAgICAgICAgICBwcmVjb250ZXh0LnN1YnN0cmluZyhwcmVjb250ZXh0Lmxlbmd0aCAtIHRoaXMuUGF0Y2hfTWFyZ2luKTtcclxuICAgICAgICAvLyBBcHBlbmQgdGhlIGVuZCBjb250ZXh0IGZvciB0aGlzIHBhdGNoLlxyXG4gICAgICAgIGNvbnN0IHBvc3Rjb250ZXh0ID0gdGhpcy5kaWZmX3RleHQxKGJpZ3BhdGNoLmRpZmZzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc3Vic3RyaW5nKDAsIHRoaXMuUGF0Y2hfTWFyZ2luKTtcclxuICAgICAgICBpZiAocG9zdGNvbnRleHQgIT09ICcnKSB7XHJcbiAgICAgICAgICBwYXRjaC5sZW5ndGgxICs9IHBvc3Rjb250ZXh0Lmxlbmd0aDtcclxuICAgICAgICAgIHBhdGNoLmxlbmd0aDIgKz0gcG9zdGNvbnRleHQubGVuZ3RoO1xyXG4gICAgICAgICAgaWYgKHBhdGNoLmRpZmZzLmxlbmd0aCAhPT0gMCAmJlxyXG4gICAgICAgICAgICAgIHBhdGNoLmRpZmZzW3BhdGNoLmRpZmZzLmxlbmd0aCAtIDFdWzBdID09PSBEaWZmT3AuRXF1YWwpIHtcclxuICAgICAgICAgICAgcGF0Y2guZGlmZnNbcGF0Y2guZGlmZnMubGVuZ3RoIC0gMV1bMV0gKz0gcG9zdGNvbnRleHQ7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBwYXRjaC5kaWZmcy5wdXNoKFtEaWZmT3AuRXF1YWwsIHBvc3Rjb250ZXh0XSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghZW1wdHkpIHtcclxuICAgICAgICAgIHBhdGNoZXMuc3BsaWNlKCsreCwgMCwgcGF0Y2gpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBUYWtlIGEgbGlzdCBvZiBwYXRjaGVzIGFuZCByZXR1cm4gYSB0ZXh0dWFsIHJlcHJlc2VudGF0aW9uLlxyXG4gICAqIEBwYXJhbSAgcGF0Y2hlcyBBcnJheSBvZiBQYXRjaCBvYmplY3RzLlxyXG4gICAqIEByZXR1cm4gIFRleHQgcmVwcmVzZW50YXRpb24gb2YgcGF0Y2hlcy5cclxuICAgKi9cclxuICAgIHBhdGNoX3RvVGV4dCAocGF0Y2hlczogQXJyYXk8cGF0Y2hfb2JqPikge1xyXG4gICAgY29uc3QgdGV4dCA9IFtdO1xyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBwYXRjaGVzLmxlbmd0aDsgeCsrKSB7XHJcbiAgICAgIHRleHRbeF0gPSBwYXRjaGVzW3hdO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRleHQuam9pbignJyk7XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIFBhcnNlIGEgdGV4dHVhbCByZXByZXNlbnRhdGlvbiBvZiBwYXRjaGVzIGFuZCByZXR1cm4gYSBsaXN0IG9mIFBhdGNoIG9iamVjdHMuXHJcbiAgICogQHBhcmFtICB0ZXh0bGluZSBUZXh0IHJlcHJlc2VudGF0aW9uIG9mIHBhdGNoZXMuXHJcbiAgICogQHJldHVybiAgQXJyYXkgb2YgUGF0Y2ggb2JqZWN0cy5cclxuICAgKiBAdGhyb3dzIHshRXJyb3J9IElmIGludmFsaWQgaW5wdXQuXHJcbiAgICovXHJcbiAgICBwYXRjaF9mcm9tVGV4dCAodGV4dGxpbmU6IHN0cmluZyk6IEFycmF5PHBhdGNoX29iaj4ge1xyXG4gICAgY29uc3QgcGF0Y2hlczogQXJyYXk8cGF0Y2hfb2JqPiA9IFtdO1xyXG4gICAgaWYgKCF0ZXh0bGluZSkge1xyXG4gICAgICByZXR1cm4gcGF0Y2hlcztcclxuICAgIH1cclxuICAgIGNvbnN0IHRleHQgPSB0ZXh0bGluZS5zcGxpdCgnXFxuJyk7XHJcbiAgICBsZXQgdGV4dFBvaW50ZXIgPSAwO1xyXG4gICAgY29uc3QgcGF0Y2hIZWFkZXIgPSAvXkBAIC0oXFxkKyksPyhcXGQqKSBcXCsoXFxkKyksPyhcXGQqKSBAQCQvO1xyXG4gICAgd2hpbGUgKHRleHRQb2ludGVyIDwgdGV4dC5sZW5ndGgpIHtcclxuICAgICAgY29uc3QgbSA9IHRleHRbdGV4dFBvaW50ZXJdLm1hdGNoKHBhdGNoSGVhZGVyKTtcclxuICAgICAgaWYgKCFtKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHBhdGNoIHN0cmluZzogJyArIHRleHRbdGV4dFBvaW50ZXJdKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBwYXRjaCA9IG5ldyBwYXRjaF9vYmooKTtcclxuICAgICAgcGF0Y2hlcy5wdXNoKHBhdGNoKTtcclxuICAgICAgcGF0Y2guc3RhcnQxID0gcGFyc2VJbnQobVsxXSwgMTApO1xyXG4gICAgICBpZiAobVsyXSA9PT0gJycpIHtcclxuICAgICAgICBwYXRjaC5zdGFydDEtLTtcclxuICAgICAgICBwYXRjaC5sZW5ndGgxID0gMTtcclxuICAgICAgfSBlbHNlIGlmIChtWzJdID09ICcwJykge1xyXG4gICAgICAgIHBhdGNoLmxlbmd0aDEgPSAwO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHBhdGNoLnN0YXJ0MS0tO1xyXG4gICAgICAgIHBhdGNoLmxlbmd0aDEgPSBwYXJzZUludChtWzJdLCAxMCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHBhdGNoLnN0YXJ0MiA9IHBhcnNlSW50KG1bM10sIDEwKTtcclxuICAgICAgaWYgKG1bNF0gPT09ICcnKSB7XHJcbiAgICAgICAgcGF0Y2guc3RhcnQyLS07XHJcbiAgICAgICAgcGF0Y2gubGVuZ3RoMiA9IDE7XHJcbiAgICAgIH0gZWxzZSBpZiAobVs0XSA9PSAnMCcpIHtcclxuICAgICAgICBwYXRjaC5sZW5ndGgyID0gMDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBwYXRjaC5zdGFydDItLTtcclxuICAgICAgICBwYXRjaC5sZW5ndGgyID0gcGFyc2VJbnQobVs0XSwgMTApO1xyXG4gICAgICB9XHJcbiAgICAgIHRleHRQb2ludGVyKys7XHJcblxyXG4gICAgICB3aGlsZSAodGV4dFBvaW50ZXIgPCB0ZXh0Lmxlbmd0aCkge1xyXG4gICAgICAgIGNvbnN0IHNpZ24gPSB0ZXh0W3RleHRQb2ludGVyXS5jaGFyQXQoMCk7XHJcbiAgICAgICAgbGV0IGxpbmU6IHN0cmluZztcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgbGluZSA9IGRlY29kZVVSSSh0ZXh0W3RleHRQb2ludGVyXS5zdWJzdHJpbmcoMSkpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgICAvLyBNYWxmb3JtZWQgVVJJIHNlcXVlbmNlLlxyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbGxlZ2FsIGVzY2FwZSBpbiBwYXRjaF9mcm9tVGV4dDogJyArIGxpbmUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc2lnbiA9PSAnLScpIHtcclxuICAgICAgICAgIC8vIERlbGV0aW9uLlxyXG4gICAgICAgICAgcGF0Y2guZGlmZnMucHVzaChbRGlmZk9wLkRlbGV0ZSwgbGluZV0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoc2lnbiA9PSAnKycpIHtcclxuICAgICAgICAgIC8vIEluc2VydGlvbi5cclxuICAgICAgICAgIHBhdGNoLmRpZmZzLnB1c2goW0RpZmZPcC5JbnNlcnQsIGxpbmVdKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHNpZ24gPT0gJyAnKSB7XHJcbiAgICAgICAgICAvLyBNaW5vciBlcXVhbGl0eS5cclxuICAgICAgICAgIHBhdGNoLmRpZmZzLnB1c2goW0RpZmZPcC5FcXVhbCwgbGluZV0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoc2lnbiA9PSAnQCcpIHtcclxuICAgICAgICAgIC8vIFN0YXJ0IG9mIG5leHQgcGF0Y2guXHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9IGVsc2UgaWYgKHNpZ24gPT09ICcnKSB7XHJcbiAgICAgICAgICAvLyBCbGFuayBsaW5lPyAgV2hhdGV2ZXIuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIC8vIFdURj9cclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwYXRjaCBtb2RlIFwiJyArIHNpZ24gKyAnXCIgaW46ICcgKyBsaW5lKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGV4dFBvaW50ZXIrKztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHBhdGNoZXM7XHJcbiAgfTtcclxuXHJcbn1cclxuXHJcblxyXG4vKipcclxuICogQ2xhc3MgcmVwcmVzZW50aW5nIG9uZSBwYXRjaCBvcGVyYXRpb24uXHJcblxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIHBhdGNoX29iaiB7XHJcblxyXG4gIGNvbnN0cnVjdG9yKCkgeyAgfVxyXG5cclxuICBkaWZmczogQXJyYXk8RGlmZj4gPSBbXTtcclxuICBzdGFydDE6IG51bWJlciA9IG51bGw7XHJcbiAgc3RhcnQyOiBudW1iZXIgPSBudWxsO1xyXG4gIGxlbmd0aDE6IG51bWJlciA9IDA7XHJcbiAgbGVuZ3RoMjogbnVtYmVyID0gMDtcclxuXHJcbiAgLyoqXHJcbiAgICogRW1tdWxhdGUgR05VIGRpZmYncyBmb3JtYXQuXHJcbiAgICogSGVhZGVyOiBAQCAtMzgyLDggKzQ4MSw5IEBAXHJcbiAgICogSW5kaWNpZXMgYXJlIHByaW50ZWQgYXMgMS1iYXNlZCwgbm90IDAtYmFzZWQuXHJcbiAgICovXHJcbiAgdG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcclxuICAgIGxldCBjb29yZHMxLCBjb29yZHMyO1xyXG4gICAgaWYgKHRoaXMubGVuZ3RoMSA9PT0gMCkge1xyXG4gICAgICBjb29yZHMxID0gdGhpcy5zdGFydDEgKyAnLDAnO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLmxlbmd0aDEgPT0gMSkge1xyXG4gICAgICBjb29yZHMxID0gdGhpcy5zdGFydDEgKyAxO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29vcmRzMSA9ICh0aGlzLnN0YXJ0MSArIDEpICsgJywnICsgdGhpcy5sZW5ndGgxO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMubGVuZ3RoMiA9PT0gMCkge1xyXG4gICAgICBjb29yZHMyID0gdGhpcy5zdGFydDIgKyAnLDAnO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLmxlbmd0aDIgPT0gMSkge1xyXG4gICAgICBjb29yZHMyID0gdGhpcy5zdGFydDIgKyAxO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29vcmRzMiA9ICh0aGlzLnN0YXJ0MiArIDEpICsgJywnICsgdGhpcy5sZW5ndGgyO1xyXG4gICAgfVxyXG4gICAgY29uc3QgdGV4dCA9IFsnQEAgLScgKyBjb29yZHMxICsgJyArJyArIGNvb3JkczIgKyAnIEBAXFxuJ107XHJcbiAgICBsZXQgb3A7XHJcbiAgICAvLyBFc2NhcGUgdGhlIGJvZHkgb2YgdGhlIHBhdGNoIHdpdGggJXh4IG5vdGF0aW9uLlxyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCB0aGlzLmRpZmZzLmxlbmd0aDsgeCsrKSB7XHJcbiAgICAgIHN3aXRjaCAodGhpcy5kaWZmc1t4XVswXSkge1xyXG4gICAgICAgIGNhc2UgRGlmZk9wLkluc2VydDpcclxuICAgICAgICAgIG9wID0gJysnO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBEaWZmT3AuRGVsZXRlOlxyXG4gICAgICAgICAgb3AgPSAnLSc7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIERpZmZPcC5FcXVhbDpcclxuICAgICAgICAgIG9wID0gJyAnO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgICAgdGV4dFt4ICsgMV0gPSBvcCArIGVuY29kZVVSSSh0aGlzLmRpZmZzW3hdWzFdKSArICdcXG4nO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRleHQuam9pbignJykucmVwbGFjZSgvJTIwL2csICcgJyk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgeyBEaWZmTWF0Y2hQYXRjaCB9O1xyXG4iXX0=