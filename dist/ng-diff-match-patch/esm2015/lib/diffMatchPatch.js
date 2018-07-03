/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/** @enum {number} */
const DiffOp = {
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
class DiffMatchPatch {
    constructor() {
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
            const html = [];
            /** @type {?} */
            const pattern_amp = /&/g;
            /** @type {?} */
            const pattern_lt = /</g;
            /** @type {?} */
            const pattern_gt = />/g;
            /** @type {?} */
            const pattern_para = /\n/g;
            for (let x = 0; x < diffs.length; x++) {
                /** @type {?} */
                const op = diffs[x][0];
                /** @type {?} */
                const data = diffs[x][1];
                /** @type {?} */
                const text = data.replace(pattern_amp, '&amp;').replace(pattern_lt, '&lt;')
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
            const patch_size = this.Match_MaxBits;
            for (let x = 0; x < patches.length; x++) {
                if (patches[x].length1 <= patch_size) {
                    continue;
                }
                /** @type {?} */
                const bigpatch = patches[x];
                // Remove the big old patch.
                patches.splice(x--, 1);
                /** @type {?} */
                let start1 = bigpatch.start1;
                /** @type {?} */
                let start2 = bigpatch.start2;
                /** @type {?} */
                let precontext = '';
                while (bigpatch.diffs.length !== 0) {
                    /** @type {?} */
                    const patch = new patch_obj();
                    /** @type {?} */
                    let empty = true;
                    patch.start1 = start1 - precontext.length;
                    patch.start2 = start2 - precontext.length;
                    if (precontext !== '') {
                        patch.length1 = patch.length2 = precontext.length;
                        patch.diffs.push([0 /* Equal */, precontext]);
                    }
                    while (bigpatch.diffs.length !== 0 &&
                        patch.length1 < patch_size - this.Patch_Margin) {
                        /** @type {?} */
                        const diff_type = bigpatch.diffs[0][0];
                        /** @type {?} */
                        let diff_text = bigpatch.diffs[0][1];
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
                    const postcontext = this.diff_text1(bigpatch.diffs)
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
    diff_main(text1, text2, opt_checklines, opt_deadline) {
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
        const deadline = opt_deadline;
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
        const checklines = opt_checklines;
        /** @type {?} */
        let commonlength = this.diff_commonPrefix(text1, text2);
        /** @type {?} */
        const commonprefix = text1.substring(0, commonlength);
        text1 = text1.substring(commonlength);
        text2 = text2.substring(commonlength);
        // Trim off common suffix (speedup).
        commonlength = this.diff_commonSuffix(text1, text2);
        /** @type {?} */
        const commonsuffix = text1.substring(text1.length - commonlength);
        text1 = text1.substring(0, text1.length - commonlength);
        text2 = text2.substring(0, text2.length - commonlength);
        /** @type {?} */
        const diffs = this.diff_compute_(text1, text2, checklines, deadline);
        // Restore the prefix and suffix.
        if (commonprefix) {
            diffs.unshift([0 /* Equal */, commonprefix]);
        }
        if (commonsuffix) {
            diffs.push([0 /* Equal */, commonsuffix]);
        }
        this.diff_cleanupMerge(diffs);
        return diffs;
    }
    ;
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
    diff_compute_(text1, text2, checklines, deadline) {
        /** @type {?} */
        let diffs;
        if (!text1) {
            // Just add some text (speedup).
            return [[1 /* Insert */, text2]];
        }
        if (!text2) {
            // Just delete some text (speedup).
            return [[-1 /* Delete */, text1]];
        }
        /** @type {?} */
        const longtext = text1.length > text2.length ? text1 : text2;
        /** @type {?} */
        const shorttext = text1.length > text2.length ? text2 : text1;
        /** @type {?} */
        const i = longtext.indexOf(shorttext);
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
        const hm = this.diff_halfMatch_(text1, text2);
        if (hm) {
            /** @type {?} */
            const text1_a = hm[0];
            /** @type {?} */
            const text1_b = hm[1];
            /** @type {?} */
            const text2_a = hm[2];
            /** @type {?} */
            const text2_b = hm[3];
            /** @type {?} */
            const mid_common = hm[4];
            /** @type {?} */
            const diffs_a = this.diff_main(text1_a, text2_a, checklines, deadline);
            /** @type {?} */
            const diffs_b = this.diff_main(text1_b, text2_b, checklines, deadline);
            // Merge the results.
            return diffs_a.concat([[0 /* Equal */, mid_common]], diffs_b);
        }
        if (checklines && text1.length > 100 && text2.length > 100) {
            return this.diff_lineMode_(text1, text2, deadline);
        }
        return this.diff_bisect_(text1, text2, deadline);
    }
    ;
    /**
     * Do a quick line-level diff on both strings, then rediff the parts for
     * greater accuracy.
     * This speedup can produce non-minimal diffs.
     * @param {?} text1 Old string to be diffed.
     * @param {?} text2 New string to be diffed.
     * @param {?} deadline Time when the diff should be complete by.
     * @return {?} Array of diff tuples.
     */
    diff_lineMode_(text1, text2, deadline) {
        /** @type {?} */
        const a = this.diff_linesToChars_(text1, text2);
        text1 = a.chars1;
        text2 = a.chars2;
        /** @type {?} */
        const linearray = a.lineArray;
        /** @type {?} */
        const diffs = this.diff_main(text1, text2, false, deadline);
        // Convert the diff back to original text.
        this.diff_charsToLines_(diffs, linearray);
        // Eliminate freak matches (e.g. blank lines)
        this.diff_cleanupSemantic(diffs);
        // Rediff any replacement blocks, this time character-by-character.
        // Add a dummy entry at the end.
        diffs.push([0 /* Equal */, '']);
        /** @type {?} */
        let pointer = 0;
        /** @type {?} */
        let count_delete = 0;
        /** @type {?} */
        let count_insert = 0;
        /** @type {?} */
        let text_delete = '';
        /** @type {?} */
        let text_insert = '';
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
                        const b = this.diff_main(text_delete, text_insert, false, deadline);
                        for (let j = b.length - 1; j >= 0; j--) {
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
    }
    ;
    /**
     * Find the 'middle snake' of a diff, split the problem in two
     * and return the recursively constructed diff.
     * See Myers 1986 paper: An O(ND) Difference Algorithm and Its constiations.
     * @param {?} text1 Old string to be diffed.
     * @param {?} text2 New string to be diffed.
     * @param {?} deadline Time at which to bail if not yet complete.
     * @return {?} Array of diff tuples.
     */
    diff_bisect_(text1, text2, deadline) {
        /** @type {?} */
        const text1_length = text1.length;
        /** @type {?} */
        const text2_length = text2.length;
        /** @type {?} */
        const max_d = Math.ceil((text1_length + text2_length) / 2);
        /** @type {?} */
        const v_offset = max_d;
        /** @type {?} */
        const v_length = 2 * max_d;
        /** @type {?} */
        const v1 = new Array(v_length);
        /** @type {?} */
        const v2 = new Array(v_length);
        // Setting all elements to -1 is faster in Chrome & Firefox than mixing
        // integers and undefined.
        for (let x = 0; x < v_length; x++) {
            v1[x] = -1;
            v2[x] = -1;
        }
        v1[v_offset + 1] = 0;
        v2[v_offset + 1] = 0;
        /** @type {?} */
        const delta = text1_length - text2_length;
        /** @type {?} */
        const front = (delta % 2 != 0);
        /** @type {?} */
        let k1start = 0;
        /** @type {?} */
        let k1end = 0;
        /** @type {?} */
        let k2start = 0;
        /** @type {?} */
        let k2end = 0;
        for (let d = 0; d < max_d; d++) {
            // Bail out if deadline is reached.
            if ((new Date()).getTime() > deadline) {
                break;
            }
            // Walk the front path one step.
            for (let k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
                /** @type {?} */
                const k1_offset = v_offset + k1;
                /** @type {?} */
                let x1;
                if (k1 == -d || (k1 != d && v1[k1_offset - 1] < v1[k1_offset + 1])) {
                    x1 = v1[k1_offset + 1];
                }
                else {
                    x1 = v1[k1_offset - 1] + 1;
                }
                /** @type {?} */
                let y1 = x1 - k1;
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
                    const k2_offset = v_offset + delta - k1;
                    if (k2_offset >= 0 && k2_offset < v_length && v2[k2_offset] != -1) {
                        /** @type {?} */
                        const x2 = text1_length - v2[k2_offset];
                        if (x1 >= x2) {
                            // Overlap detected.
                            return this.diff_bisectSplit_(text1, text2, x1, y1, deadline);
                        }
                    }
                }
            }
            // Walk the reverse path one step.
            for (let k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
                /** @type {?} */
                const k2_offset = v_offset + k2;
                /** @type {?} */
                let x2;
                if (k2 == -d || (k2 != d && v2[k2_offset - 1] < v2[k2_offset + 1])) {
                    x2 = v2[k2_offset + 1];
                }
                else {
                    x2 = v2[k2_offset - 1] + 1;
                }
                /** @type {?} */
                let y2 = x2 - k2;
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
                    const k1_offset = v_offset + delta - k2;
                    if (k1_offset >= 0 && k1_offset < v_length && v1[k1_offset] != -1) {
                        /** @type {?} */
                        const x1 = v1[k1_offset];
                        /** @type {?} */
                        const y1 = v_offset + x1 - k1_offset;
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
    }
    ;
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
    diff_bisectSplit_(text1, text2, x, y, deadline) {
        /** @type {?} */
        const text1a = text1.substring(0, x);
        /** @type {?} */
        const text2a = text2.substring(0, y);
        /** @type {?} */
        const text1b = text1.substring(x);
        /** @type {?} */
        const text2b = text2.substring(y);
        /** @type {?} */
        const diffs = this.diff_main(text1a, text2a, false, deadline);
        /** @type {?} */
        const diffsb = this.diff_main(text1b, text2b, false, deadline);
        return diffs.concat(diffsb);
    }
    ;
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
    diff_linesToChars_(text1, text2) {
        /** @type {?} */
        const lineArray = [];
        /** @type {?} */
        const lineHash = {}; // e.g. lineHash['Hello\n'] == 4
        // '\x00' is a valid character, but constious debuggers don't like it.
        // So we'll insert a junk entry to avoid generating a null character.
        lineArray[0] = '';
        /** @type {?} */
        const chars1 = this.diff_linesToCharsMunge_(text1, lineArray, lineHash);
        /** @type {?} */
        const chars2 = this.diff_linesToCharsMunge_(text2, lineArray, lineHash);
        return { chars1: chars1, chars2: chars2, lineArray: lineArray };
    }
    ;
    /**
     * Split a text into an array of strings.  Reduce the texts to a string of
     * hashes where each Unicode character represents one line.
     * Modifies linearray and linehash through being a closure.
     * @param {?} text String to encode.
     * @param {?} lineArray
     * @param {?} lineHash
     * @return {?} Encoded string.
     */
    diff_linesToCharsMunge_(text, lineArray, lineHash) {
        /** @type {?} */
        let chars = '';
        /** @type {?} */
        let lineStart = 0;
        /** @type {?} */
        let lineEnd = -1;
        /** @type {?} */
        let lineArrayLength = lineArray.length;
        while (lineEnd < text.length - 1) {
            lineEnd = text.indexOf('\n', lineStart);
            if (lineEnd == -1) {
                lineEnd = text.length - 1;
            }
            /** @type {?} */
            const line = text.substring(lineStart, lineEnd + 1);
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
    }
    /**
     * Rehydrate the text in a diff from a string of line hashes to real lines of
     * text.
     * @param {?} diffs Array of diff tuples.
     * @param {?} lineArray Array of unique strings.
     * @return {?}
     */
    diff_charsToLines_(diffs, lineArray) {
        for (let x = 0; x < diffs.length; x++) {
            /** @type {?} */
            const chars = diffs[x][1];
            /** @type {?} */
            const text = [];
            for (let y = 0; y < chars.length; y++) {
                text[y] = lineArray[chars.charCodeAt(y)];
            }
            diffs[x][1] = text.join('');
        }
    }
    ;
    /**
     * Determine the common prefix of two strings.
     * @param {?} text1 First string.
     * @param {?} text2 Second string.
     * @return {?} The number of characters common to the start of each
     *     string.
     */
    diff_commonPrefix(text1, text2) {
        // Quick check for common null cases.
        if (!text1 || !text2 || text1.charAt(0) != text2.charAt(0)) {
            return 0;
        }
        /** @type {?} */
        let pointermin = 0;
        /** @type {?} */
        let pointermax = Math.min(text1.length, text2.length);
        /** @type {?} */
        let pointermid = pointermax;
        /** @type {?} */
        let pointerstart = 0;
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
    }
    ;
    /**
     * Determine the common suffix of two strings.
     * @param {?} text1 First string.
     * @param {?} text2 Second string.
     * @return {?} The number of characters common to the end of each string.
     */
    diff_commonSuffix(text1, text2) {
        // Quick check for common null cases.
        if (!text1 || !text2 ||
            text1.charAt(text1.length - 1) != text2.charAt(text2.length - 1)) {
            return 0;
        }
        /** @type {?} */
        let pointermin = 0;
        /** @type {?} */
        let pointermax = Math.min(text1.length, text2.length);
        /** @type {?} */
        let pointermid = pointermax;
        /** @type {?} */
        let pointerend = 0;
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
    }
    ;
    /**
     * Determine if the suffix of one string is the prefix of another.
     * @param {?} text1 First string.
     * @param {?} text2 Second string.
     * @return {?} The number of characters common to the end of the first
     *     string and the start of the second string.
     */
    diff_commonOverlap_(text1, text2) {
        /** @type {?} */
        const text1_length = text1.length;
        /** @type {?} */
        const text2_length = text2.length;
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
        const text_length = Math.min(text1_length, text2_length);
        // Quick check for the worst case.
        if (text1 == text2) {
            return text_length;
        }
        /** @type {?} */
        let best = 0;
        /** @type {?} */
        let length = 1;
        while (true) {
            /** @type {?} */
            const pattern = text1.substring(text_length - length);
            /** @type {?} */
            const found = text2.indexOf(pattern);
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
    }
    ;
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
    diff_halfMatch_(text1, text2) {
        if (this.Diff_Timeout <= 0) {
            // Don't risk returning a non-optimal diff if we have unlimited time.
            return null;
        }
        /** @type {?} */
        const longtext = text1.length > text2.length ? text1 : text2;
        /** @type {?} */
        const shorttext = text1.length > text2.length ? text2 : text1;
        if (longtext.length < 4 || shorttext.length * 2 < longtext.length) {
            return null; // Pointless.
        }
        /** @type {?} */
        const dmp = this;
        /** @type {?} */
        const hm1 = this.diff_halfMatchI_(longtext, shorttext, Math.ceil(longtext.length / 4), dmp);
        /** @type {?} */
        const hm2 = this.diff_halfMatchI_(longtext, shorttext, Math.ceil(longtext.length / 2), dmp);
        /** @type {?} */
        let hm;
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
        let text1_a;
        /** @type {?} */
        let text1_b;
        /** @type {?} */
        let text2_a;
        /** @type {?} */
        let text2_b;
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
        const mid_common = hm[4];
        return [text1_a, text1_b, text2_a, text2_b, mid_common];
    }
    ;
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
    diff_halfMatchI_(longtext, shorttext, i, dmp) {
        /** @type {?} */
        const seed = longtext.substring(i, i + Math.floor(longtext.length / 4));
        /** @type {?} */
        let j = -1;
        /** @type {?} */
        let best_common = '';
        /** @type {?} */
        let best_longtext_a;
        /** @type {?} */
        let best_longtext_b;
        /** @type {?} */
        let best_shorttext_a;
        /** @type {?} */
        let best_shorttext_b;
        while ((j = shorttext.indexOf(seed, j + 1)) != -1) {
            /** @type {?} */
            const prefixLength = dmp.diff_commonPrefix(longtext.substring(i), shorttext.substring(j));
            /** @type {?} */
            const suffixLength = dmp.diff_commonSuffix(longtext.substring(0, i), shorttext.substring(0, j));
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
    }
    /**
     * Reduce the number of edits by eliminating semantically trivial equalities.
     * @param {?} diffs Array of diff tuples.
     * @return {?}
     */
    diff_cleanupSemantic(diffs) {
        /** @type {?} */
        let changes = false;
        /** @type {?} */
        const equalities = [];
        /** @type {?} */
        let equalitiesLength = 0;
        /** @type {?} */
        let lastequality = null;
        /** @type {?} */
        let pointer = 0;
        /** @type {?} */
        let length_insertions1 = 0;
        /** @type {?} */
        let length_deletions1 = 0;
        /** @type {?} */
        let length_insertions2 = 0;
        /** @type {?} */
        let length_deletions2 = 0;
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
                const deletion = diffs[pointer - 1][1];
                /** @type {?} */
                const insertion = diffs[pointer][1];
                /** @type {?} */
                const overlap_length1 = this.diff_commonOverlap_(deletion, insertion);
                /** @type {?} */
                const overlap_length2 = this.diff_commonOverlap_(insertion, deletion);
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
    }
    ;
    /**
     * Look for single edits surrounded on both sides by equalities
     * which can be shifted sideways to align the edit to a word boundary.
     * e.g: The c<ins>at c</ins>ame. -> The <ins>cat </ins>came.
     * @param {?} diffs Array of diff tuples.
     * @return {?}
     */
    diff_cleanupSemanticLossless(diffs) {
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
            const nonAlphaNumericRegex_ = new RegExp('/[^a-zA-Z0-9]/');
            /** @type {?} */
            const char1 = one.charAt(one.length - 1);
            /** @type {?} */
            const char2 = two.charAt(0);
            /** @type {?} */
            const nonAlphaNumeric1 = char1.match(nonAlphaNumericRegex_);
            /** @type {?} */
            const nonAlphaNumeric2 = char2.match(nonAlphaNumericRegex_);
            /** @type {?} */
            const whitespace1 = nonAlphaNumeric1 &&
                char1.match(this.whitespaceRegex_);
            /** @type {?} */
            const whitespace2 = nonAlphaNumeric2 &&
                char2.match(this.whitespaceRegex_);
            /** @type {?} */
            const lineBreak1 = whitespace1 &&
                char1.match(this.linebreakRegex_);
            /** @type {?} */
            const lineBreak2 = whitespace2 &&
                char2.match(this.linebreakRegex_);
            /** @type {?} */
            const blankLine1 = lineBreak1 &&
                one.match(this.blanklineEndRegex_);
            /** @type {?} */
            const blankLine2 = lineBreak2 &&
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
        let pointer = 1;
        // Intentionally ignore the first and last element (don't need checking).
        while (pointer < diffs.length - 1) {
            if (diffs[pointer - 1][0] == 0 /* Equal */ &&
                diffs[pointer + 1][0] == 0 /* Equal */) {
                /** @type {?} */
                let equality1 = diffs[pointer - 1][1];
                /** @type {?} */
                let edit = diffs[pointer][1];
                /** @type {?} */
                let equality2 = diffs[pointer + 1][1];
                /** @type {?} */
                const commonOffset = this.diff_commonSuffix(equality1, edit);
                if (commonOffset) {
                    /** @type {?} */
                    const commonString = edit.substring(edit.length - commonOffset);
                    equality1 = equality1.substring(0, equality1.length - commonOffset);
                    edit = commonString + edit.substring(0, edit.length - commonOffset);
                    equality2 = commonString + equality2;
                }
                /** @type {?} */
                let bestEquality1 = equality1;
                /** @type {?} */
                let bestEdit = edit;
                /** @type {?} */
                let bestEquality2 = equality2;
                /** @type {?} */
                let bestScore = diff_cleanupSemanticScore_(equality1, edit) +
                    diff_cleanupSemanticScore_(edit, equality2);
                while (edit.charAt(0) === equality2.charAt(0)) {
                    equality1 += edit.charAt(0);
                    edit = edit.substring(1) + equality2.charAt(0);
                    equality2 = equality2.substring(1);
                    /** @type {?} */
                    const score = diff_cleanupSemanticScore_(equality1, edit) +
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
    }
    ;
    /**
     * Reduce the number of edits by eliminating operationally trivial equalities.
     * @param {?} diffs Array of diff tuples.
     * @return {?}
     */
    diff_cleanupEfficiency(diffs) {
        /** @type {?} */
        let changes = false;
        /** @type {?} */
        const equalities = [];
        /** @type {?} */
        let equalitiesLength = 0;
        /** @type {?} */
        let lastequality = null;
        /** @type {?} */
        let pointer = 0;
        /** @type {?} */
        let pre_ins = false;
        /** @type {?} */
        let pre_del = false;
        /** @type {?} */
        let post_ins = false;
        /** @type {?} */
        let post_del = false;
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
    }
    ;
    /**
     * Reorder and merge like edit sections.  Merge equalities.
     * Any edit section can move as long as it doesn't cross an equality.
     * @param {?} diffs Array of diff tuples.
     * @return {?}
     */
    diff_cleanupMerge(diffs) {
        diffs.push([0 /* Equal */, '']);
        /** @type {?} */
        let pointer = 0;
        /** @type {?} */
        let count_delete = 0;
        /** @type {?} */
        let count_insert = 0;
        /** @type {?} */
        let text_delete = '';
        /** @type {?} */
        let text_insert = '';
        /** @type {?} */
        let commonlength;
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
        let changes = false;
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
    }
    ;
    /**
     * loc is a location in text1, compute and return the equivalent location in
     * text2.
     * e.g. 'The cat' vs 'The big cat', 1->1, 5->8
     * @param {?} diffs Array of diff tuples.
     * @param {?} loc Location within text1.
     * @return {?} Location within text2.
     */
    diff_xIndex(diffs, loc) {
        /** @type {?} */
        let chars1 = 0;
        /** @type {?} */
        let chars2 = 0;
        /** @type {?} */
        let last_chars1 = 0;
        /** @type {?} */
        let last_chars2 = 0;
        /** @type {?} */
        let x;
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
    }
    ;
    /**
     * Compute and return the source text (all equalities and deletions).
     * @param {?} diffs Array of diff tuples.
     * @return {?} Source text.
     */
    diff_text1(diffs) {
        /** @type {?} */
        const text = [];
        for (let x = 0; x < diffs.length; x++) {
            if (diffs[x][0] !== 1 /* Insert */) {
                text[x] = diffs[x][1];
            }
        }
        return text.join('');
    }
    ;
    /**
     * Compute and return the destination text (all equalities and insertions).
     * @param {?} diffs Array of diff tuples.
     * @return {?} Destination text.
     */
    diff_text2(diffs) {
        /** @type {?} */
        const text = [];
        for (let x = 0; x < diffs.length; x++) {
            if (diffs[x][0] !== -1 /* Delete */) {
                text[x] = diffs[x][1];
            }
        }
        return text.join('');
    }
    ;
    /**
     * Compute the Levenshtein distance; the number of inserted, deleted or
     * substituted characters.
     * @param {?} diffs Array of diff tuples.
     * @return {?} Number of changes.
     */
    diff_levenshtein(diffs) {
        /** @type {?} */
        let levenshtein = 0;
        /** @type {?} */
        let insertions = 0;
        /** @type {?} */
        let deletions = 0;
        for (let x = 0; x < diffs.length; x++) {
            /** @type {?} */
            const op = diffs[x][0];
            /** @type {?} */
            const data = diffs[x][1];
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
    }
    ;
    /**
     * Crush the diff into an encoded string which describes the operations
     * required to transform text1 into text2.
     * E.g. =3\t-2\t+ing  -> Keep 3 chars, delete 2 chars, insert 'ing'.
     * Operations are tab-separated.  Inserted text is escaped using %xx notation.
     * @param {?} diffs Array of diff tuples.
     * @return {?} Delta text.
     */
    diff_toDelta(diffs) {
        /** @type {?} */
        const text = [];
        for (let x = 0; x < diffs.length; x++) {
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
    }
    ;
    /**
     * Given the original text1, and an encoded string which describes the
     * operations required to transform text1 into text2, compute the full diff.
     * @throws {!Error} If invalid input.
     * @param {?} text1 Source string for the diff.
     * @param {?} delta Delta text.
     * @return {?} Array of diff tuples.
     */
    diff_fromDelta(text1, delta) {
        /** @type {?} */
        const diffs = [];
        /** @type {?} */
        let diffsLength = 0;
        /** @type {?} */
        let pointer = 0;
        /** @type {?} */
        const tokens = delta.split(/\t/g);
        for (let x = 0; x < tokens.length; x++) {
            /** @type {?} */
            const param = tokens[x].substring(1);
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
                    const n = parseInt(param, 10);
                    if (isNaN(n) || n < 0) {
                        throw new Error('Invalid number in diff_fromDelta: ' + param);
                    }
                    /** @type {?} */
                    const text = text1.substring(pointer, pointer += n);
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
    }
    ;
    /**
     * Locate the best instance of 'pattern' in 'text' near 'loc'.
     * @param {?} text The text to search.
     * @param {?} pattern The pattern to search for.
     * @param {?} loc The location to search around.
     * @return {?} Best match index or -1.
     */
    match_main(text, pattern, loc) {
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
    }
    ;
    /**
     * Locate the best instance of 'pattern' in 'text' near 'loc' using the
     * Bitap algorithm.
     * @param {?} text The text to search.
     * @param {?} pattern The pattern to search for.
     * @param {?} loc The location to search around.
     * @return {?} Best match index or -1.
     */
    match_bitap_(text, pattern, loc) {
        if (pattern.length > this.Match_MaxBits) {
            throw new Error('Pattern too long for this browser.');
        }
        /** @type {?} */
        const s = this.match_alphabet_(pattern);
        /** @type {?} */
        const dmp = this;
        /**
         * Compute and return the score for a match with e errors and x location.
         * Accesses loc and pattern through being a closure.
         * @param {?} e Number of errors in match.
         * @param {?} x Location of match.
         * @return {?} Overall score for match (0.0 = good, 1.0 = bad).
         */
        function match_bitapScore_(e, x) {
            /** @type {?} */
            const accuracy = e / pattern.length;
            /** @type {?} */
            const proximity = Math.abs(loc - x);
            if (!dmp.Match_Distance) {
                // Dodge divide by zero error.
                return proximity ? 1.0 : accuracy;
            }
            return accuracy + (proximity / dmp.Match_Distance);
        }
        /** @type {?} */
        let score_threshold = this.Match_Threshold;
        /** @type {?} */
        let best_loc = text.indexOf(pattern, loc);
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
        const matchmask = 1 << (pattern.length - 1);
        best_loc = -1;
        /** @type {?} */
        let bin_min;
        /** @type {?} */
        let bin_mid;
        /** @type {?} */
        let bin_max = pattern.length + text.length;
        /** @type {?} */
        let last_rd;
        for (let d = 0; d < pattern.length; d++) {
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
            let start = Math.max(1, loc - bin_mid + 1);
            /** @type {?} */
            const finish = Math.min(loc + bin_mid, text.length) + pattern.length;
            /** @type {?} */
            const rd = Array(finish + 2);
            rd[finish + 1] = (1 << d) - 1;
            for (let j = finish; j >= start; j--) {
                /** @type {?} */
                const charMatch = s[text.charAt(j - 1)];
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
                    const score = match_bitapScore_(d, j - 1);
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
    }
    ;
    /**
     * Initialise the alphabet for the Bitap algorithm.
     * @param {?} pattern The text to encode.
     * @return {?} Hash of character locations.
     */
    match_alphabet_(pattern) {
        /** @type {?} */
        const s = {};
        for (let i = 0; i < pattern.length; i++) {
            s[pattern.charAt(i)] = 0;
        }
        for (let i = 0; i < pattern.length; i++) {
            s[pattern.charAt(i)] |= 1 << (pattern.length - i - 1);
        }
        return s;
    }
    ;
    /**
     * Increase the context until it is unique,
     * but don't let the pattern expand beyond Match_MaxBits.
     * @param {?} patch The patch to grow.
     * @param {?} text Source text.
     * @return {?}
     */
    patch_addContext_(patch, text) {
        if (text.length == 0) {
            return;
        }
        /** @type {?} */
        let pattern = text.substring(patch.start2, patch.start2 + patch.length1);
        /** @type {?} */
        let padding = 0;
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
        const prefix = text.substring(patch.start2 - padding, patch.start2);
        if (prefix) {
            patch.diffs.unshift([0 /* Equal */, prefix]);
        }
        /** @type {?} */
        const suffix = text.substring(patch.start2 + patch.length1, patch.start2 + patch.length1 + padding);
        if (suffix) {
            patch.diffs.push([0 /* Equal */, suffix]);
        }
        // Roll back the start points.
        patch.start1 -= prefix.length;
        patch.start2 -= prefix.length;
        // Extend the lengths.
        patch.length1 += prefix.length + suffix.length;
        patch.length2 += prefix.length + suffix.length;
    }
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
     * @param {?} a text1 (methods 1,3,4) or
     * Array of diff tuples for text1 to text2 (method 2).
     * @param {?} opt_b text2 (methods 1,4) or
     * Array of diff tuples for text1 to text2 (method 3) or undefined (method 2).
     * @param {?} opt_c Array of diff tuples
     * for text1 to text2 (method 4) or undefined (methods 1,2,3).
     * @return {?} Array of Patch objects.
     */
    patch_make(a, opt_b, opt_c) {
        /** @type {?} */
        let text1;
        /** @type {?} */
        let diffs;
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
        const patches = [];
        /** @type {?} */
        let patch = new patch_obj();
        /** @type {?} */
        let patchDiffLength = 0;
        /** @type {?} */
        let char_count1 = 0;
        /** @type {?} */
        let char_count2 = 0;
        /** @type {?} */
        let prepatch_text = text1;
        /** @type {?} */
        let postpatch_text = text1;
        for (let x = 0; x < diffs.length; x++) {
            /** @type {?} */
            const diff_type = diffs[x][0];
            /** @type {?} */
            const diff_text = diffs[x][1];
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
    }
    ;
    /**
     * Given an array of patches, return another array that is identical.
     * @param {?} patches Array of Patch objects.
     * @return {?} Array of Patch objects.
     */
    patch_deepCopy(patches) {
        /** @type {?} */
        const patchesCopy = [];
        for (let x = 0; x < patches.length; x++) {
            /** @type {?} */
            const patch = patches[x];
            /** @type {?} */
            const patchCopy = new patch_obj();
            patchCopy.diffs = [];
            for (let y = 0; y < patch.diffs.length; y++) {
                patchCopy.diffs[y] = [patch.diffs[y][0], patch.diffs[y][1]];
            }
            patchCopy.start1 = patch.start1;
            patchCopy.start2 = patch.start2;
            patchCopy.length1 = patch.length1;
            patchCopy.length2 = patch.length2;
            patchesCopy[x] = patchCopy;
        }
        return patchesCopy;
    }
    ;
    /**
     * Merge a set of patches onto the text.  Return a patched text, as well
     * as a list of true/false values indicating which patches were applied.
     * @param {?} patches Array of Patch objects.
     * @param {?} text Old text.
     * @return {?} Two element Array, containing the
     *      new text and an array of boolean values.
     */
    patch_apply(patches, text) {
        if (patches.length == 0) {
            return [text, []];
        }
        // Deep copy the patches so that no changes are made to originals.
        patches = this.patch_deepCopy(patches);
        /** @type {?} */
        const nullPadding = this.patch_addPadding(patches);
        text = nullPadding + text + nullPadding;
        this.patch_splitMax(patches);
        /** @type {?} */
        let delta = 0;
        /** @type {?} */
        const results = [];
        for (let x = 0; x < patches.length; x++) {
            /** @type {?} */
            const expected_loc = patches[x].start2 + delta;
            /** @type {?} */
            const text1 = this.diff_text1(patches[x].diffs);
            /** @type {?} */
            let start_loc;
            /** @type {?} */
            let end_loc = -1;
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
                let text2;
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
                    const diffs = this.diff_main(text1, text2, false);
                    if (text1.length > this.Match_MaxBits &&
                        this.diff_levenshtein(diffs) / text1.length >
                            this.Patch_DeleteThreshold) {
                        // The end points match, but the content is unacceptably bad.
                        results[x] = false;
                    }
                    else {
                        this.diff_cleanupSemanticLossless(diffs);
                        /** @type {?} */
                        let index1 = 0;
                        /** @type {?} */
                        let index2;
                        for (let y = 0; y < patches[x].diffs.length; y++) {
                            /** @type {?} */
                            const mod = patches[x].diffs[y];
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
    }
    ;
    /**
     * Add some padding on text start and end so that edges can match something.
     * Intended to be called only from within patch_apply.
     * @param {?} patches Array of Patch objects.
     * @return {?} The padding string added to each side.
     */
    patch_addPadding(patches) {
        /** @type {?} */
        const paddingLength = this.Patch_Margin;
        /** @type {?} */
        let nullPadding = '';
        for (let x = 1; x <= paddingLength; x++) {
            nullPadding += String.fromCharCode(x);
        }
        // Bump all the patches forward.
        for (let x = 0; x < patches.length; x++) {
            patches[x].start1 += paddingLength;
            patches[x].start2 += paddingLength;
        }
        /** @type {?} */
        let patch = patches[0];
        /** @type {?} */
        let diffs = patch.diffs;
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
            const extraLength = paddingLength - diffs[0][1].length;
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
            const extraLength = paddingLength - diffs[diffs.length - 1][1].length;
            diffs[diffs.length - 1][1] += nullPadding.substring(0, extraLength);
            patch.length1 += extraLength;
            patch.length2 += extraLength;
        }
        return nullPadding;
    }
    ;
    /**
     * Take a list of patches and return a textual representation.
     * @param {?} patches Array of Patch objects.
     * @return {?} Text representation of patches.
     */
    patch_toText(patches) {
        /** @type {?} */
        const text = [];
        for (let x = 0; x < patches.length; x++) {
            text[x] = patches[x];
        }
        return text.join('');
    }
    ;
    /**
     * Parse a textual representation of patches and return a list of Patch objects.
     * @throws {!Error} If invalid input.
     * @param {?} textline Text representation of patches.
     * @return {?} Array of Patch objects.
     */
    patch_fromText(textline) {
        /** @type {?} */
        const patches = [];
        if (!textline) {
            return patches;
        }
        /** @type {?} */
        const text = textline.split('\n');
        /** @type {?} */
        let textPointer = 0;
        /** @type {?} */
        const patchHeader = /^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@$/;
        while (textPointer < text.length) {
            /** @type {?} */
            const m = text[textPointer].match(patchHeader);
            if (!m) {
                throw new Error('Invalid patch string: ' + text[textPointer]);
            }
            /** @type {?} */
            const patch = new patch_obj();
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
                const sign = text[textPointer].charAt(0);
                /** @type {?} */
                let line;
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
    }
    ;
}
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
export class patch_obj {
    constructor() {
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
            let coords1;
            /** @type {?} */
            let coords2;
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
            const text = ['@@ -' + coords1 + ' +' + coords2 + ' @@\n'];
            /** @type {?} */
            let op;
            // Escape the body of the patch with %xx notation.
            for (let x = 0; x < this.diffs.length; x++) {
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
}
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZk1hdGNoUGF0Y2guanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZy1kaWZmLW1hdGNoLXBhdGNoLyIsInNvdXJjZXMiOlsibGliL2RpZmZNYXRjaFBhdGNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztJQUNFLFVBQVc7SUFDWCxRQUFTO0lBQ1QsU0FBVTs7Ozs7Ozs7O0FBU1o7SUFFRTs7Ozs0QkFNZSxHQUFHOzs2QkFFRixDQUFDOzsrQkFFQyxHQUFHOzs7OzhCQUlKLElBQUk7Ozs7O3FDQUtHLEdBQUc7OzRCQUVaLENBQUM7OzZCQUdBLEVBQUU7Ozs7OztnQ0FRQyxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUM7K0JBQ25CLElBQUksTUFBTSxDQUFDLFVBQVUsQ0FBQztrQ0FDbkIsSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDO29DQUN0QixJQUFJLE1BQU0sQ0FBQyxlQUFlLENBQUM7Ozs7OzsrQkFzbkM5QixVQUFTLEtBQWtCOztZQUM3QyxNQUFNLElBQUksR0FBRyxFQUFFLENBQUM7O1lBQ2hCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQzs7WUFDekIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDOztZQUN4QixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUM7O1lBQ3hCLE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQztZQUMzQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzs7Z0JBQ3RDLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7Z0JBQ3ZCLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7Z0JBQ3pCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FB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Q0FBQzs7WUFFM0IsTUFBTSxDQUFDLElBQUksQ0FBQztTQUNiOztRQUNELE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7O1FBQzdELE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDOUQsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDbEUsTUFBTSxDQUFDLElBQUksQ0FBQztTQUNiOztRQUNELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQzs7UUFJakIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQzNCLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQzs7UUFFL0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQzNCLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQzs7UUFDL0QsSUFBSSxFQUFFLENBQUM7UUFDUCxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDakIsTUFBTSxDQUFDLElBQUksQ0FBQztTQUNiO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNoQixFQUFFLEdBQUcsR0FBRyxDQUFDO1NBQ1Y7UUFBQyxJQUFJLENBQUMsRUFB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LENBQUMsTUFBTSxHQUFHLE9BQU8sR0FBRyxJQUFJLEdBQUcsT0FBTyxHQUFHLE9BQU8sQ0FBQyxDQUFDOztZQUMzRCxJQUFJLEVBQUUsQ0FBQzs7WUFFUCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzNDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUN6Qjt3QkFDRSxFQUFFLEdBQUcsR0FBRyxDQUFDO3dCQUNULEtBQUssQ0FBQztvQkFDUjt3QkFDRSxFQUFFLEdBQUcsR0FBRyxDQUFDO3dCQUNULEtBQUssQ0FBQztvQkFDUjt3QkFDRSxFQUFFLEdBQUcsR0FBRyxDQUFDO3dCQUNULEtBQUssQ0FBQztpQkFDVDtnQkFDRCxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQzthQUN2RDtZQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDM0M7S0EvQ2lCO0NBZ0RuQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFRCxPQUFPLEVBQUUsY0FBYyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgZW51bSBEaWZmT3Age1xuICBEZWxldGUgPSAtMSxcbiAgRXF1YWwgPSAwLFxuICBJbnNlcnQgPSAxXG59XG5cbmV4cG9ydCB0eXBlIERpZmYgPSBbRGlmZk9wLCBzdHJpbmddO1xuXG4vKipcbiAqIENsYXNzIGNvbnRhaW5pbmcgdGhlIGRpZmYsIG1hdGNoIGFuZCBwYXRjaCBtZXRob2RzLlxuXG4gKi9cbmNsYXNzIERpZmZNYXRjaFBhdGNoIHtcblxuICBjb25zdHJ1Y3RvcigpIHsgIH1cblxuICAvLyBEZWZhdWx0cy5cbiAgLy8gUmVkZWZpbmUgdGhlc2UgaW4geW91ciBwcm9ncmFtIHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0cy5cblxuICAvLyBOdW1iZXIgb2Ygc2Vjb25kcyB0byBtYXAgYSBkaWZmIGJlZm9yZSBnaXZpbmcgdXAgKDAgZm9yIGluZmluaXR5KS5cbiAgRGlmZl9UaW1lb3V0ID0gMS4wO1xuICAvLyBDb3N0IG9mIGFuIGVtcHR5IGVkaXQgb3BlcmF0aW9uIGluIHRlcm1zIG9mIGVkaXQgY2hhcmFjdGVycy5cbiAgRGlmZl9FZGl0Q29zdCA9IDQ7XG4gIC8vIEF0IHdoYXQgcG9pbnQgaXMgbm8gbWF0Y2ggZGVjbGFyZWQgKDAuMCA9IHBlcmZlY3Rpb24sIDEuMCA9IHZlcnkgbG9vc2UpLlxuICBNYXRjaF9UaHJlc2hvbGQgPSAwLjU7XG4gIC8vIEhvdyBmYXIgdG8gc2VhcmNoIGZvciBhIG1hdGNoICgwID0gZXhhY3QgbG9jYXRpb24sIDEwMDArID0gYnJvYWQgbWF0Y2gpLlxuICAvLyBBIG1hdGNoIHRoaXMgbWFueSBjaGFyYWN0ZXJzIGF3YXkgZnJvbSB0aGUgZXhwZWN0ZWQgbG9jYXRpb24gd2lsbCBhZGRcbiAgLy8gMS4wIHRvIHRoZSBzY29yZSAoMC4wIGlzIGEgcGVyZmVjdCBtYXRjaCkuXG4gIE1hdGNoX0Rpc3RhbmNlID0gMTAwMDtcbiAgLy8gV2hlbiBkZWxldGluZyBhIGxhcmdlIGJsb2NrIG9mIHRleHQgKG92ZXIgfjY0IGNoYXJhY3RlcnMpLCBob3cgY2xvc2UgZG9cbiAgLy8gdGhlIGNvbnRlbnRzIGhhdmUgdG8gYmUgdG8gbWF0Y2ggdGhlIGV4cGVjdGVkIGNvbnRlbnRzLiAoMC4wID0gcGVyZmVjdGlvbixcbiAgLy8gMS4wID0gdmVyeSBsb29zZSkuICBOb3RlIHRoYXQgTWF0Y2hfVGhyZXNob2xkIGNvbnRyb2xzIGhvdyBjbG9zZWx5IHRoZVxuICAvLyBlbmQgcG9pbnRzIG9mIGEgZGVsZXRlIG5lZWQgdG8gbWF0Y2guXG4gIFBhdGNoX0RlbGV0ZVRocmVzaG9sZCA9IDAuNTtcbiAgLy8gQ2h1bmsgc2l6ZSBmb3IgY29udGV4dCBsZW5ndGguXG4gIFBhdGNoX01hcmdpbiA9IDQ7XG5cbiAgLy8gVGhlIG51bWJlciBvZiBiaXRzIGluIGFuIGludC5cbiAgTWF0Y2hfTWF4Qml0cyA9IDMyO1xuICAvKipcbiAgICogVGhlIGRhdGEgc3RydWN0dXJlIHJlcHJlc2VudGluZyBhIGRpZmYgaXMgYW4gYXJyYXkgb2YgdHVwbGVzOlxuICAgKiBbW0RpZmZPcC5EZWxldGUsICdIZWxsbyddLCBbRGlmZk9wLkluc2VydCwgJ0dvb2RieWUnXSwgW0RpZmZPcC5FcXVhbCwgJyB3b3JsZC4nXV1cbiAgICogd2hpY2ggbWVhbnM6IGRlbGV0ZSAnSGVsbG8nLCBhZGQgJ0dvb2RieWUnIGFuZCBrZWVwICcgd29ybGQuJ1xuICAgKi9cblxuICAvLyBEZWZpbmUgc29tZSByZWdleCBwYXR0ZXJucyBmb3IgbWF0Y2hpbmcgYm91bmRhcmllcy5cbiAgd2hpdGVzcGFjZVJlZ2V4XyA9IG5ldyBSZWdFeHAoJy9cXHMvJyk7XG4gIGxpbmVicmVha1JlZ2V4XyA9IG5ldyBSZWdFeHAoJy9bXFxyXFxuXS8nKTtcbiAgYmxhbmtsaW5lRW5kUmVnZXhfID0gbmV3IFJlZ0V4cCgnL1xcblxccj9cXG4kLycpO1xuICBibGFua2xpbmVTdGFydFJlZ2V4XyA9IG5ldyBSZWdFeHAoJy9eXFxyP1xcblxccj9cXG4vJyk7XG5cbiAgLyoqXG4gICAqIEZpbmQgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gdHdvIHRleHRzLiAgU2ltcGxpZmllcyB0aGUgcHJvYmxlbSBieSBzdHJpcHBpbmdcbiAgICogYW55IGNvbW1vbiBwcmVmaXggb3Igc3VmZml4IG9mZiB0aGUgdGV4dHMgYmVmb3JlIGRpZmZpbmcuXG4gICAqIEBwYXJhbSAgdGV4dDEgT2xkIHN0cmluZyB0byBiZSBkaWZmZWQuXG4gICAqIEBwYXJhbSAgdGV4dDIgTmV3IHN0cmluZyB0byBiZSBkaWZmZWQuXG4gICAqIEBwYXJhbSAgb3B0X2NoZWNrbGluZXMgT3B0aW9uYWwgc3BlZWR1cCBmbGFnLiBJZiBwcmVzZW50IGFuZCBmYWxzZSxcbiAgICogICAgIHRoZW4gZG9uJ3QgcnVuIGEgbGluZS1sZXZlbCBkaWZmIGZpcnN0IHRvIGlkZW50aWZ5IHRoZSBjaGFuZ2VkIGFyZWFzLlxuICAgKiAgICAgRGVmYXVsdHMgdG8gdHJ1ZSwgd2hpY2ggZG9lcyBhIGZhc3Rlciwgc2xpZ2h0bHkgbGVzcyBvcHRpbWFsIGRpZmYuXG4gICAqIEBwYXJhbSAgb3B0X2RlYWRsaW5lIE9wdGlvbmFsIHRpbWUgd2hlbiB0aGUgZGlmZiBzaG91bGQgYmUgY29tcGxldGVcbiAgICogICAgIGJ5LiAgVXNlZCBpbnRlcm5hbGx5IGZvciByZWN1cnNpdmUgY2FsbHMuICBVc2VycyBzaG91bGQgc2V0IERpZmZUaW1lb3V0XG4gICAqICAgICBpbnN0ZWFkLlxuICAgKiBAcmV0dXJuICBBcnJheSBvZiBkaWZmIHR1cGxlcy5cbiAgICovXG4gICAgZGlmZl9tYWluICh0ZXh0MTogc3RyaW5nLCB0ZXh0Mjogc3RyaW5nLCBvcHRfY2hlY2tsaW5lcz86IGJvb2xlYW4sIG9wdF9kZWFkbGluZT86IG51bWJlcik6IEFycmF5PERpZmY+IHtcbiAgICAgIC8vIFNldCBhIGRlYWRsaW5lIGJ5IHdoaWNoIHRpbWUgdGhlIGRpZmYgbXVzdCBiZSBjb21wbGV0ZS5cbiAgICAgIGlmICh0eXBlb2Ygb3B0X2RlYWRsaW5lID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGlmICh0aGlzLkRpZmZfVGltZW91dCA8PSAwKSB7XG4gICAgICAgICAgb3B0X2RlYWRsaW5lID0gTnVtYmVyLk1BWF9WQUxVRTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvcHRfZGVhZGxpbmUgPSAobmV3IERhdGUpLmdldFRpbWUoKSArIHRoaXMuRGlmZl9UaW1lb3V0ICogMTAwMDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc3QgZGVhZGxpbmUgPSBvcHRfZGVhZGxpbmU7XG5cbiAgICAgIC8vIENoZWNrIGZvciBudWxsIGlucHV0cy5cbiAgICAgIGlmICh0ZXh0MSA9PSBudWxsIHx8IHRleHQyID09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOdWxsIGlucHV0LiAoZGlmZl9tYWluKScpO1xuICAgICAgfVxuXG4gICAgICAvLyBDaGVjayBmb3IgZXF1YWxpdHkgKHNwZWVkdXApLlxuICAgICAgaWYgKHRleHQxID09IHRleHQyKSB7XG4gICAgICAgIGlmICh0ZXh0MSkge1xuICAgICAgICAgIHJldHVybiBbW0RpZmZPcC5FcXVhbCwgdGV4dDFdXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW107XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2Ygb3B0X2NoZWNrbGluZXMgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgb3B0X2NoZWNrbGluZXMgPSB0cnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgY2hlY2tsaW5lcyA9IG9wdF9jaGVja2xpbmVzO1xuXG4gICAgICAvLyBUcmltIG9mZiBjb21tb24gcHJlZml4IChzcGVlZHVwKS5cbiAgICAgIGxldCBjb21tb25sZW5ndGggPSB0aGlzLmRpZmZfY29tbW9uUHJlZml4KHRleHQxLCB0ZXh0Mik7XG4gICAgICBjb25zdCBjb21tb25wcmVmaXggPSB0ZXh0MS5zdWJzdHJpbmcoMCwgY29tbW9ubGVuZ3RoKTtcbiAgICAgIHRleHQxID0gdGV4dDEuc3Vic3RyaW5nKGNvbW1vbmxlbmd0aCk7XG4gICAgICB0ZXh0MiA9IHRleHQyLnN1YnN0cmluZyhjb21tb25sZW5ndGgpO1xuXG4gICAgICAvLyBUcmltIG9mZiBjb21tb24gc3VmZml4IChzcGVlZHVwKS5cbiAgICAgIGNvbW1vbmxlbmd0aCA9IHRoaXMuZGlmZl9jb21tb25TdWZmaXgodGV4dDEsIHRleHQyKTtcbiAgICAgIGNvbnN0IGNvbW1vbnN1ZmZpeCA9IHRleHQxLnN1YnN0cmluZyh0ZXh0MS5sZW5ndGggLSBjb21tb25sZW5ndGgpO1xuICAgICAgdGV4dDEgPSB0ZXh0MS5zdWJzdHJpbmcoMCwgdGV4dDEubGVuZ3RoIC0gY29tbW9ubGVuZ3RoKTtcbiAgICAgIHRleHQyID0gdGV4dDIuc3Vic3RyaW5nKDAsIHRleHQyLmxlbmd0aCAtIGNvbW1vbmxlbmd0aCk7XG5cbiAgICAgIC8vIENvbXB1dGUgdGhlIGRpZmYgb24gdGhlIG1pZGRsZSBibG9jay5cbiAgICAgIGNvbnN0IGRpZmZzID0gdGhpcy5kaWZmX2NvbXB1dGVfKHRleHQxLCB0ZXh0MiwgY2hlY2tsaW5lcywgZGVhZGxpbmUpO1xuXG4gICAgICAvLyBSZXN0b3JlIHRoZSBwcmVmaXggYW5kIHN1ZmZpeC5cbiAgICAgIGlmIChjb21tb25wcmVmaXgpIHtcbiAgICAgICAgZGlmZnMudW5zaGlmdChbRGlmZk9wLkVxdWFsLCBjb21tb25wcmVmaXhdKTtcbiAgICAgIH1cbiAgICAgIGlmIChjb21tb25zdWZmaXgpIHtcbiAgICAgICAgZGlmZnMucHVzaChbRGlmZk9wLkVxdWFsLCBjb21tb25zdWZmaXhdKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZGlmZl9jbGVhbnVwTWVyZ2UoZGlmZnMpO1xuICAgICAgcmV0dXJuIGRpZmZzO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIEZpbmQgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gdHdvIHRleHRzLiAgQXNzdW1lcyB0aGF0IHRoZSB0ZXh0cyBkbyBub3RcbiAgICogaGF2ZSBhbnkgY29tbW9uIHByZWZpeCBvciBzdWZmaXguXG4gICAqIEBwYXJhbSAgdGV4dDEgT2xkIHN0cmluZyB0byBiZSBkaWZmZWQuXG4gICAqIEBwYXJhbSAgdGV4dDIgTmV3IHN0cmluZyB0byBiZSBkaWZmZWQuXG4gICAqIEBwYXJhbSAgY2hlY2tsaW5lcyBTcGVlZHVwIGZsYWcuICBJZiBmYWxzZSwgdGhlbiBkb24ndCBydW4gYVxuICAgKiAgICAgbGluZS1sZXZlbCBkaWZmIGZpcnN0IHRvIGlkZW50aWZ5IHRoZSBjaGFuZ2VkIGFyZWFzLlxuICAgKiAgICAgSWYgdHJ1ZSwgdGhlbiBydW4gYSBmYXN0ZXIsIHNsaWdodGx5IGxlc3Mgb3B0aW1hbCBkaWZmLlxuICAgKiBAcGFyYW0gIGRlYWRsaW5lIFRpbWUgd2hlbiB0aGUgZGlmZiBzaG91bGQgYmUgY29tcGxldGUgYnkuXG4gICAqIEByZXR1cm4gIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuXG4gICAqL1xuICAgIGRpZmZfY29tcHV0ZV8gKHRleHQxOiBzdHJpbmcsIHRleHQyOiBzdHJpbmcsIGNoZWNrbGluZXM6IGJvb2xlYW4sXG4gICAgICBkZWFkbGluZTogbnVtYmVyKTogQXJyYXk8RGlmZj4ge1xuICAgIGxldCBkaWZmczogQXJyYXk8RGlmZj47XG5cbiAgICBpZiAoIXRleHQxKSB7XG4gICAgICAvLyBKdXN0IGFkZCBzb21lIHRleHQgKHNwZWVkdXApLlxuICAgICAgcmV0dXJuIFtbRGlmZk9wLkluc2VydCwgdGV4dDJdXTtcbiAgICB9XG5cbiAgICBpZiAoIXRleHQyKSB7XG4gICAgICAvLyBKdXN0IGRlbGV0ZSBzb21lIHRleHQgKHNwZWVkdXApLlxuICAgICAgcmV0dXJuIFtbRGlmZk9wLkRlbGV0ZSwgdGV4dDFdXTtcbiAgICB9XG5cbiAgICBjb25zdCBsb25ndGV4dCA9IHRleHQxLmxlbmd0aCA+IHRleHQyLmxlbmd0aCA/IHRleHQxIDogdGV4dDI7XG4gICAgY29uc3Qgc2hvcnR0ZXh0ID0gdGV4dDEubGVuZ3RoID4gdGV4dDIubGVuZ3RoID8gdGV4dDIgOiB0ZXh0MTtcbiAgICBjb25zdCBpID0gbG9uZ3RleHQuaW5kZXhPZihzaG9ydHRleHQpO1xuICAgIGlmIChpICE9IC0xKSB7XG4gICAgICAvLyBTaG9ydGVyIHRleHQgaXMgaW5zaWRlIHRoZSBsb25nZXIgdGV4dCAoc3BlZWR1cCkuXG4gICAgICBkaWZmcyA9IFtbRGlmZk9wLkluc2VydCwgbG9uZ3RleHQuc3Vic3RyaW5nKDAsIGkpXSxcbiAgICAgICAgICAgICAgW0RpZmZPcC5FcXVhbCwgc2hvcnR0ZXh0XSxcbiAgICAgICAgICAgICAgW0RpZmZPcC5JbnNlcnQsIGxvbmd0ZXh0LnN1YnN0cmluZyhpICsgc2hvcnR0ZXh0Lmxlbmd0aCldXTtcbiAgICAgIC8vIFN3YXAgaW5zZXJ0aW9ucyBmb3IgZGVsZXRpb25zIGlmIGRpZmYgaXMgcmV2ZXJzZWQuXG4gICAgICBpZiAodGV4dDEubGVuZ3RoID4gdGV4dDIubGVuZ3RoKSB7XG4gICAgICAgIGRpZmZzWzBdWzBdID0gZGlmZnNbMl1bMF0gPSBEaWZmT3AuRGVsZXRlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRpZmZzO1xuICAgIH1cblxuICAgIGlmIChzaG9ydHRleHQubGVuZ3RoID09IDEpIHtcbiAgICAgIC8vIFNpbmdsZSBjaGFyYWN0ZXIgc3RyaW5nLlxuICAgICAgLy8gQWZ0ZXIgdGhlIHByZXZpb3VzIHNwZWVkdXAsIHRoZSBjaGFyYWN0ZXIgY2FuJ3QgYmUgYW4gZXF1YWxpdHkuXG4gICAgICByZXR1cm4gW1tEaWZmT3AuRGVsZXRlLCB0ZXh0MV0sIFtEaWZmT3AuSW5zZXJ0LCB0ZXh0Ml1dO1xuICAgIH1cblxuICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGUgcHJvYmxlbSBjYW4gYmUgc3BsaXQgaW4gdHdvLlxuICAgIGNvbnN0IGhtID0gdGhpcy5kaWZmX2hhbGZNYXRjaF8odGV4dDEsIHRleHQyKTtcbiAgICBpZiAoaG0pIHtcbiAgICAgIC8vIEEgaGFsZi1tYXRjaCB3YXMgZm91bmQsIHNvcnQgb3V0IHRoZSByZXR1cm4gZGF0YS5cbiAgICAgIGNvbnN0IHRleHQxX2EgPSBobVswXTtcbiAgICAgIGNvbnN0IHRleHQxX2IgPSBobVsxXTtcbiAgICAgIGNvbnN0IHRleHQyX2EgPSBobVsyXTtcbiAgICAgIGNvbnN0IHRleHQyX2IgPSBobVszXTtcbiAgICAgIGNvbnN0IG1pZF9jb21tb24gPSBobVs0XTtcbiAgICAgIC8vIFNlbmQgYm90aCBwYWlycyBvZmYgZm9yIHNlcGFyYXRlIHByb2Nlc3NpbmcuXG4gICAgICBjb25zdCBkaWZmc19hID0gdGhpcy5kaWZmX21haW4odGV4dDFfYSwgdGV4dDJfYSwgY2hlY2tsaW5lcywgZGVhZGxpbmUpO1xuICAgICAgY29uc3QgZGlmZnNfYiA9IHRoaXMuZGlmZl9tYWluKHRleHQxX2IsIHRleHQyX2IsIGNoZWNrbGluZXMsIGRlYWRsaW5lKTtcbiAgICAgIC8vIE1lcmdlIHRoZSByZXN1bHRzLlxuICAgICAgcmV0dXJuIGRpZmZzX2EuY29uY2F0KFtbRGlmZk9wLkVxdWFsLCBtaWRfY29tbW9uXV0sIGRpZmZzX2IpO1xuICAgIH1cblxuICAgIGlmIChjaGVja2xpbmVzICYmIHRleHQxLmxlbmd0aCA+IDEwMCAmJiB0ZXh0Mi5sZW5ndGggPiAxMDApIHtcbiAgICAgIHJldHVybiB0aGlzLmRpZmZfbGluZU1vZGVfKHRleHQxLCB0ZXh0MiwgZGVhZGxpbmUpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmRpZmZfYmlzZWN0Xyh0ZXh0MSwgdGV4dDIsIGRlYWRsaW5lKTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBEbyBhIHF1aWNrIGxpbmUtbGV2ZWwgZGlmZiBvbiBib3RoIHN0cmluZ3MsIHRoZW4gcmVkaWZmIHRoZSBwYXJ0cyBmb3JcbiAgICogZ3JlYXRlciBhY2N1cmFjeS5cbiAgICogVGhpcyBzcGVlZHVwIGNhbiBwcm9kdWNlIG5vbi1taW5pbWFsIGRpZmZzLlxuICAgKiBAcGFyYW0gIHRleHQxIE9sZCBzdHJpbmcgdG8gYmUgZGlmZmVkLlxuICAgKiBAcGFyYW0gIHRleHQyIE5ldyBzdHJpbmcgdG8gYmUgZGlmZmVkLlxuICAgKiBAcGFyYW0gIGRlYWRsaW5lIFRpbWUgd2hlbiB0aGUgZGlmZiBzaG91bGQgYmUgY29tcGxldGUgYnkuXG4gICAqIEByZXR1cm4gIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuXG4gICAqL1xuICAgIGRpZmZfbGluZU1vZGVfICh0ZXh0MTogc3RyaW5nLCB0ZXh0Mjogc3RyaW5nLCBkZWFkbGluZTogbnVtYmVyKSB7XG4gICAgLy8gU2NhbiB0aGUgdGV4dCBvbiBhIGxpbmUtYnktbGluZSBiYXNpcyBmaXJzdC5cbiAgICBjb25zdCBhID0gdGhpcy5kaWZmX2xpbmVzVG9DaGFyc18odGV4dDEsIHRleHQyKTtcbiAgICB0ZXh0MSA9IGEuY2hhcnMxO1xuICAgIHRleHQyID0gYS5jaGFyczI7XG4gICAgY29uc3QgbGluZWFycmF5ID0gYS5saW5lQXJyYXk7XG5cbiAgICBjb25zdCBkaWZmcyA9IHRoaXMuZGlmZl9tYWluKHRleHQxLCB0ZXh0MiwgZmFsc2UsIGRlYWRsaW5lKTtcblxuICAgIC8vIENvbnZlcnQgdGhlIGRpZmYgYmFjayB0byBvcmlnaW5hbCB0ZXh0LlxuICAgIHRoaXMuZGlmZl9jaGFyc1RvTGluZXNfKGRpZmZzLCBsaW5lYXJyYXkpO1xuICAgIC8vIEVsaW1pbmF0ZSBmcmVhayBtYXRjaGVzIChlLmcuIGJsYW5rIGxpbmVzKVxuICAgIHRoaXMuZGlmZl9jbGVhbnVwU2VtYW50aWMoZGlmZnMpO1xuXG4gICAgLy8gUmVkaWZmIGFueSByZXBsYWNlbWVudCBibG9ja3MsIHRoaXMgdGltZSBjaGFyYWN0ZXItYnktY2hhcmFjdGVyLlxuICAgIC8vIEFkZCBhIGR1bW15IGVudHJ5IGF0IHRoZSBlbmQuXG4gICAgZGlmZnMucHVzaChbRGlmZk9wLkVxdWFsLCAnJ10pO1xuICAgIGxldCBwb2ludGVyID0gMDtcbiAgICBsZXQgY291bnRfZGVsZXRlID0gMDtcbiAgICBsZXQgY291bnRfaW5zZXJ0ID0gMDtcbiAgICBsZXQgdGV4dF9kZWxldGUgPSAnJztcbiAgICBsZXQgdGV4dF9pbnNlcnQgPSAnJztcbiAgICB3aGlsZSAocG9pbnRlciA8IGRpZmZzLmxlbmd0aCkge1xuICAgICAgc3dpdGNoIChkaWZmc1twb2ludGVyXVswXSkge1xuICAgICAgICBjYXNlIERpZmZPcC5JbnNlcnQ6XG4gICAgICAgICAgY291bnRfaW5zZXJ0Kys7XG4gICAgICAgICAgdGV4dF9pbnNlcnQgKz0gZGlmZnNbcG9pbnRlcl1bMV07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgRGlmZk9wLkRlbGV0ZTpcbiAgICAgICAgICBjb3VudF9kZWxldGUrKztcbiAgICAgICAgICB0ZXh0X2RlbGV0ZSArPSBkaWZmc1twb2ludGVyXVsxXTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBEaWZmT3AuRXF1YWw6XG4gICAgICAgICAgLy8gVXBvbiByZWFjaGluZyBhbiBlcXVhbGl0eSwgY2hlY2sgZm9yIHByaW9yIHJlZHVuZGFuY2llcy5cbiAgICAgICAgICBpZiAoY291bnRfZGVsZXRlID49IDEgJiYgY291bnRfaW5zZXJ0ID49IDEpIHtcbiAgICAgICAgICAgIC8vIERlbGV0ZSB0aGUgb2ZmZW5kaW5nIHJlY29yZHMgYW5kIGFkZCB0aGUgbWVyZ2VkIG9uZXMuXG4gICAgICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciAtIGNvdW50X2RlbGV0ZSAtIGNvdW50X2luc2VydCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50X2RlbGV0ZSArIGNvdW50X2luc2VydCk7XG4gICAgICAgICAgICBwb2ludGVyID0gcG9pbnRlciAtIGNvdW50X2RlbGV0ZSAtIGNvdW50X2luc2VydDtcbiAgICAgICAgICAgIGNvbnN0IGIgPSB0aGlzLmRpZmZfbWFpbih0ZXh0X2RlbGV0ZSwgdGV4dF9pbnNlcnQsIGZhbHNlLCBkZWFkbGluZSk7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gYi5sZW5ndGggLSAxOyBqID49IDA7IGotLSkge1xuICAgICAgICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciwgMCwgYltqXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwb2ludGVyID0gcG9pbnRlciArIGIubGVuZ3RoO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb3VudF9pbnNlcnQgPSAwO1xuICAgICAgICAgIGNvdW50X2RlbGV0ZSA9IDA7XG4gICAgICAgICAgdGV4dF9kZWxldGUgPSAnJztcbiAgICAgICAgICB0ZXh0X2luc2VydCA9ICcnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgcG9pbnRlcisrO1xuICAgIH1cbiAgICBkaWZmcy5wb3AoKTsgIC8vIFJlbW92ZSB0aGUgZHVtbXkgZW50cnkgYXQgdGhlIGVuZC5cblxuICAgIHJldHVybiBkaWZmcztcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBGaW5kIHRoZSAnbWlkZGxlIHNuYWtlJyBvZiBhIGRpZmYsIHNwbGl0IHRoZSBwcm9ibGVtIGluIHR3b1xuICAgKiBhbmQgcmV0dXJuIHRoZSByZWN1cnNpdmVseSBjb25zdHJ1Y3RlZCBkaWZmLlxuICAgKiBTZWUgTXllcnMgMTk4NiBwYXBlcjogQW4gTyhORCkgRGlmZmVyZW5jZSBBbGdvcml0aG0gYW5kIEl0cyBjb25zdGlhdGlvbnMuXG4gICAqIEBwYXJhbSAgdGV4dDEgT2xkIHN0cmluZyB0byBiZSBkaWZmZWQuXG4gICAqIEBwYXJhbSAgdGV4dDIgTmV3IHN0cmluZyB0byBiZSBkaWZmZWQuXG4gICAqIEBwYXJhbSAgZGVhZGxpbmUgVGltZSBhdCB3aGljaCB0byBiYWlsIGlmIG5vdCB5ZXQgY29tcGxldGUuXG4gICAqIEByZXR1cm4gIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuXG4gICAqL1xuICAgIGRpZmZfYmlzZWN0XyAodGV4dDE6IHN0cmluZywgdGV4dDI6IHN0cmluZywgZGVhZGxpbmU6IG51bWJlcik6IEFycmF5PERpZmY+IHtcbiAgICAvLyBDYWNoZSB0aGUgdGV4dCBsZW5ndGhzIHRvIHByZXZlbnQgbXVsdGlwbGUgY2FsbHMuXG4gICAgY29uc3QgdGV4dDFfbGVuZ3RoID0gdGV4dDEubGVuZ3RoO1xuICAgIGNvbnN0IHRleHQyX2xlbmd0aCA9IHRleHQyLmxlbmd0aDtcbiAgICBjb25zdCBtYXhfZCA9IE1hdGguY2VpbCgodGV4dDFfbGVuZ3RoICsgdGV4dDJfbGVuZ3RoKSAvIDIpO1xuICAgIGNvbnN0IHZfb2Zmc2V0ID0gbWF4X2Q7XG4gICAgY29uc3Qgdl9sZW5ndGggPSAyICogbWF4X2Q7XG4gICAgY29uc3QgdjEgPSBuZXcgQXJyYXkodl9sZW5ndGgpO1xuICAgIGNvbnN0IHYyID0gbmV3IEFycmF5KHZfbGVuZ3RoKTtcbiAgICAvLyBTZXR0aW5nIGFsbCBlbGVtZW50cyB0byAtMSBpcyBmYXN0ZXIgaW4gQ2hyb21lICYgRmlyZWZveCB0aGFuIG1peGluZ1xuICAgIC8vIGludGVnZXJzIGFuZCB1bmRlZmluZWQuXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCB2X2xlbmd0aDsgeCsrKSB7XG4gICAgICB2MVt4XSA9IC0xO1xuICAgICAgdjJbeF0gPSAtMTtcbiAgICB9XG4gICAgdjFbdl9vZmZzZXQgKyAxXSA9IDA7XG4gICAgdjJbdl9vZmZzZXQgKyAxXSA9IDA7XG4gICAgY29uc3QgZGVsdGEgPSB0ZXh0MV9sZW5ndGggLSB0ZXh0Ml9sZW5ndGg7XG4gICAgLy8gSWYgdGhlIHRvdGFsIG51bWJlciBvZiBjaGFyYWN0ZXJzIGlzIG9kZCwgdGhlbiB0aGUgZnJvbnQgcGF0aCB3aWxsIGNvbGxpZGVcbiAgICAvLyB3aXRoIHRoZSByZXZlcnNlIHBhdGguXG4gICAgY29uc3QgZnJvbnQgPSAoZGVsdGEgJSAyICE9IDApO1xuICAgIC8vIE9mZnNldHMgZm9yIHN0YXJ0IGFuZCBlbmQgb2YgayBsb29wLlxuICAgIC8vIFByZXZlbnRzIG1hcHBpbmcgb2Ygc3BhY2UgYmV5b25kIHRoZSBncmlkLlxuICAgIGxldCBrMXN0YXJ0ID0gMDtcbiAgICBsZXQgazFlbmQgPSAwO1xuICAgIGxldCBrMnN0YXJ0ID0gMDtcbiAgICBsZXQgazJlbmQgPSAwO1xuICAgIGZvciAobGV0IGQgPSAwOyBkIDwgbWF4X2Q7IGQrKykge1xuICAgICAgLy8gQmFpbCBvdXQgaWYgZGVhZGxpbmUgaXMgcmVhY2hlZC5cbiAgICAgIGlmICgobmV3IERhdGUoKSkuZ2V0VGltZSgpID4gZGVhZGxpbmUpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIFdhbGsgdGhlIGZyb250IHBhdGggb25lIHN0ZXAuXG4gICAgICBmb3IgKGxldCBrMSA9IC1kICsgazFzdGFydDsgazEgPD0gZCAtIGsxZW5kOyBrMSArPSAyKSB7XG4gICAgICAgIGNvbnN0IGsxX29mZnNldCA9IHZfb2Zmc2V0ICsgazE7XG4gICAgICAgIGxldCB4MTtcbiAgICAgICAgaWYgKGsxID09IC1kIHx8IChrMSAhPSBkICYmIHYxW2sxX29mZnNldCAtIDFdIDwgdjFbazFfb2Zmc2V0ICsgMV0pKSB7XG4gICAgICAgICAgeDEgPSB2MVtrMV9vZmZzZXQgKyAxXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB4MSA9IHYxW2sxX29mZnNldCAtIDFdICsgMTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgeTEgPSB4MSAtIGsxO1xuICAgICAgICB3aGlsZSAoeDEgPCB0ZXh0MV9sZW5ndGggJiYgeTEgPCB0ZXh0Ml9sZW5ndGggJiZcbiAgICAgICAgICAgICAgdGV4dDEuY2hhckF0KHgxKSA9PSB0ZXh0Mi5jaGFyQXQoeTEpKSB7XG4gICAgICAgICAgeDErKztcbiAgICAgICAgICB5MSsrO1xuICAgICAgICB9XG4gICAgICAgIHYxW2sxX29mZnNldF0gPSB4MTtcbiAgICAgICAgaWYgKHgxID4gdGV4dDFfbGVuZ3RoKSB7XG4gICAgICAgICAgLy8gUmFuIG9mZiB0aGUgcmlnaHQgb2YgdGhlIGdyYXBoLlxuICAgICAgICAgIGsxZW5kICs9IDI7XG4gICAgICAgIH0gZWxzZSBpZiAoeTEgPiB0ZXh0Ml9sZW5ndGgpIHtcbiAgICAgICAgICAvLyBSYW4gb2ZmIHRoZSBib3R0b20gb2YgdGhlIGdyYXBoLlxuICAgICAgICAgIGsxc3RhcnQgKz0gMjtcbiAgICAgICAgfSBlbHNlIGlmIChmcm9udCkge1xuICAgICAgICAgIGNvbnN0IGsyX29mZnNldCA9IHZfb2Zmc2V0ICsgZGVsdGEgLSBrMTtcbiAgICAgICAgICBpZiAoazJfb2Zmc2V0ID49IDAgJiYgazJfb2Zmc2V0IDwgdl9sZW5ndGggJiYgdjJbazJfb2Zmc2V0XSAhPSAtMSkge1xuICAgICAgICAgICAgLy8gTWlycm9yIHgyIG9udG8gdG9wLWxlZnQgY29vcmRpbmF0ZSBzeXN0ZW0uXG4gICAgICAgICAgICBjb25zdCB4MiA9IHRleHQxX2xlbmd0aCAtIHYyW2syX29mZnNldF07XG4gICAgICAgICAgICBpZiAoeDEgPj0geDIpIHtcbiAgICAgICAgICAgICAgLy8gT3ZlcmxhcCBkZXRlY3RlZC5cbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGlmZl9iaXNlY3RTcGxpdF8odGV4dDEsIHRleHQyLCB4MSwgeTEsIGRlYWRsaW5lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gV2FsayB0aGUgcmV2ZXJzZSBwYXRoIG9uZSBzdGVwLlxuICAgICAgZm9yIChsZXQgazIgPSAtZCArIGsyc3RhcnQ7IGsyIDw9IGQgLSBrMmVuZDsgazIgKz0gMikge1xuICAgICAgICBjb25zdCBrMl9vZmZzZXQgPSB2X29mZnNldCArIGsyO1xuICAgICAgICBsZXQgeDI6IG51bWJlcjtcbiAgICAgICAgaWYgKGsyID09IC1kIHx8IChrMiAhPSBkICYmIHYyW2syX29mZnNldCAtIDFdIDwgdjJbazJfb2Zmc2V0ICsgMV0pKSB7XG4gICAgICAgICAgeDIgPSB2MltrMl9vZmZzZXQgKyAxXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB4MiA9IHYyW2syX29mZnNldCAtIDFdICsgMTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgeTIgPSB4MiAtIGsyO1xuICAgICAgICB3aGlsZSAoeDIgPCB0ZXh0MV9sZW5ndGggJiYgeTIgPCB0ZXh0Ml9sZW5ndGggJiZcbiAgICAgICAgICAgICAgdGV4dDEuY2hhckF0KHRleHQxX2xlbmd0aCAtIHgyIC0gMSkgPT1cbiAgICAgICAgICAgICAgdGV4dDIuY2hhckF0KHRleHQyX2xlbmd0aCAtIHkyIC0gMSkpIHtcbiAgICAgICAgICB4MisrO1xuICAgICAgICAgIHkyKys7XG4gICAgICAgIH1cbiAgICAgICAgdjJbazJfb2Zmc2V0XSA9IHgyO1xuICAgICAgICBpZiAoeDIgPiB0ZXh0MV9sZW5ndGgpIHtcbiAgICAgICAgICAvLyBSYW4gb2ZmIHRoZSBsZWZ0IG9mIHRoZSBncmFwaC5cbiAgICAgICAgICBrMmVuZCArPSAyO1xuICAgICAgICB9IGVsc2UgaWYgKHkyID4gdGV4dDJfbGVuZ3RoKSB7XG4gICAgICAgICAgLy8gUmFuIG9mZiB0aGUgdG9wIG9mIHRoZSBncmFwaC5cbiAgICAgICAgICBrMnN0YXJ0ICs9IDI7XG4gICAgICAgIH0gZWxzZSBpZiAoIWZyb250KSB7XG4gICAgICAgICAgY29uc3QgazFfb2Zmc2V0ID0gdl9vZmZzZXQgKyBkZWx0YSAtIGsyO1xuICAgICAgICAgIGlmIChrMV9vZmZzZXQgPj0gMCAmJiBrMV9vZmZzZXQgPCB2X2xlbmd0aCAmJiB2MVtrMV9vZmZzZXRdICE9IC0xKSB7XG4gICAgICAgICAgICBjb25zdCB4MSA9IHYxW2sxX29mZnNldF07XG4gICAgICAgICAgICBjb25zdCB5MSA9IHZfb2Zmc2V0ICsgeDEgLSBrMV9vZmZzZXQ7XG4gICAgICAgICAgICAvLyBNaXJyb3IgeDIgb250byB0b3AtbGVmdCBjb29yZGluYXRlIHN5c3RlbS5cbiAgICAgICAgICAgIHgyID0gdGV4dDFfbGVuZ3RoIC0geDI7XG4gICAgICAgICAgICBpZiAoeDEgPj0geDIpIHtcbiAgICAgICAgICAgICAgLy8gT3ZlcmxhcCBkZXRlY3RlZC5cbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGlmZl9iaXNlY3RTcGxpdF8odGV4dDEsIHRleHQyLCB4MSwgeTEsIGRlYWRsaW5lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gRGlmZiB0b29rIHRvbyBsb25nIGFuZCBoaXQgdGhlIGRlYWRsaW5lIG9yXG4gICAgLy8gbnVtYmVyIG9mIGRpZmZzIGVxdWFscyBudW1iZXIgb2YgY2hhcmFjdGVycywgbm8gY29tbW9uYWxpdHkgYXQgYWxsLlxuICAgIHJldHVybiBbW0RpZmZPcC5EZWxldGUsIHRleHQxXSwgW0RpZmZPcC5JbnNlcnQsIHRleHQyXV07XG4gIH07XG5cblxuICAvKipcbiAgICogR2l2ZW4gdGhlIGxvY2F0aW9uIG9mIHRoZSAnbWlkZGxlIHNuYWtlJywgc3BsaXQgdGhlIGRpZmYgaW4gdHdvIHBhcnRzXG4gICAqIGFuZCByZWN1cnNlLlxuICAgKiBAcGFyYW0gIHRleHQxIE9sZCBzdHJpbmcgdG8gYmUgZGlmZmVkLlxuICAgKiBAcGFyYW0gIHRleHQyIE5ldyBzdHJpbmcgdG8gYmUgZGlmZmVkLlxuICAgKiBAcGFyYW0gIHggSW5kZXggb2Ygc3BsaXQgcG9pbnQgaW4gdGV4dDEuXG4gICAqIEBwYXJhbSAgeSBJbmRleCBvZiBzcGxpdCBwb2ludCBpbiB0ZXh0Mi5cbiAgICogQHBhcmFtICBkZWFkbGluZSBUaW1lIGF0IHdoaWNoIHRvIGJhaWwgaWYgbm90IHlldCBjb21wbGV0ZS5cbiAgICogQHJldHVybiAgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXG5cbiAgICovXG4gICAgZGlmZl9iaXNlY3RTcGxpdF8gKHRleHQxOiBzdHJpbmcsIHRleHQyOiBzdHJpbmcsIHg6IG51bWJlciwgeTogbnVtYmVyLCBkZWFkbGluZTogbnVtYmVyKSB7XG4gICAgICBjb25zdCB0ZXh0MWEgPSB0ZXh0MS5zdWJzdHJpbmcoMCwgeCk7XG4gICAgICBjb25zdCB0ZXh0MmEgPSB0ZXh0Mi5zdWJzdHJpbmcoMCwgeSk7XG4gICAgICBjb25zdCB0ZXh0MWIgPSB0ZXh0MS5zdWJzdHJpbmcoeCk7XG4gICAgICBjb25zdCB0ZXh0MmIgPSB0ZXh0Mi5zdWJzdHJpbmcoeSk7XG5cbiAgICAgIC8vIENvbXB1dGUgYm90aCBkaWZmcyBzZXJpYWxseS5cbiAgICAgIGNvbnN0IGRpZmZzID0gdGhpcy5kaWZmX21haW4odGV4dDFhLCB0ZXh0MmEsIGZhbHNlLCBkZWFkbGluZSk7XG4gICAgICBjb25zdCBkaWZmc2IgPSB0aGlzLmRpZmZfbWFpbih0ZXh0MWIsIHRleHQyYiwgZmFsc2UsIGRlYWRsaW5lKTtcblxuICAgICAgcmV0dXJuIGRpZmZzLmNvbmNhdChkaWZmc2IpO1xuICAgIH07XG5cblxuICAvKipcbiAgICogU3BsaXQgdHdvIHRleHRzIGludG8gYW4gYXJyYXkgb2Ygc3RyaW5ncy4gIFJlZHVjZSB0aGUgdGV4dHMgdG8gYSBzdHJpbmcgb2ZcbiAgICogaGFzaGVzIHdoZXJlIGVhY2ggVW5pY29kZSBjaGFyYWN0ZXIgcmVwcmVzZW50cyBvbmUgbGluZS5cbiAgICogQHBhcmFtICB0ZXh0MSBGaXJzdCBzdHJpbmcuXG4gICAqIEBwYXJhbSAgdGV4dDIgU2Vjb25kIHN0cmluZy5cbiAgICogQHJldHVybiB9XG4gICAqICAgICBBbiBvYmplY3QgY29udGFpbmluZyB0aGUgZW5jb2RlZCB0ZXh0MSwgdGhlIGVuY29kZWQgdGV4dDIgYW5kXG4gICAqICAgICB0aGUgYXJyYXkgb2YgdW5pcXVlIHN0cmluZ3MuXG4gICAqICAgICBUaGUgemVyb3RoIGVsZW1lbnQgb2YgdGhlIGFycmF5IG9mIHVuaXF1ZSBzdHJpbmdzIGlzIGludGVudGlvbmFsbHkgYmxhbmsuXG5cbiAgICovXG4gICAgZGlmZl9saW5lc1RvQ2hhcnNfICh0ZXh0MTogc3RyaW5nLCB0ZXh0Mjogc3RyaW5nKSB7XG4gICAgICBjb25zdCBsaW5lQXJyYXkgPSBbXTsgIC8vIGUuZy4gbGluZUFycmF5WzRdID09ICdIZWxsb1xcbidcbiAgICAgIGNvbnN0IGxpbmVIYXNoID0ge307ICAgLy8gZS5nLiBsaW5lSGFzaFsnSGVsbG9cXG4nXSA9PSA0XG5cbiAgICAgIC8vICdcXHgwMCcgaXMgYSB2YWxpZCBjaGFyYWN0ZXIsIGJ1dCBjb25zdGlvdXMgZGVidWdnZXJzIGRvbid0IGxpa2UgaXQuXG4gICAgICAvLyBTbyB3ZSdsbCBpbnNlcnQgYSBqdW5rIGVudHJ5IHRvIGF2b2lkIGdlbmVyYXRpbmcgYSBudWxsIGNoYXJhY3Rlci5cbiAgICAgIGxpbmVBcnJheVswXSA9ICcnO1xuXG5cbiAgICAgIGNvbnN0IGNoYXJzMSA9IHRoaXMuZGlmZl9saW5lc1RvQ2hhcnNNdW5nZV8odGV4dDEsIGxpbmVBcnJheSwgbGluZUhhc2gpO1xuICAgICAgY29uc3QgY2hhcnMyID0gdGhpcy5kaWZmX2xpbmVzVG9DaGFyc011bmdlXyh0ZXh0MiwgbGluZUFycmF5LCBsaW5lSGFzaCk7XG4gICAgICByZXR1cm4ge2NoYXJzMTogY2hhcnMxLCBjaGFyczI6IGNoYXJzMiwgbGluZUFycmF5OiBsaW5lQXJyYXl9O1xuICAgfTtcblxuICAvKipcbiAgICogU3BsaXQgYSB0ZXh0IGludG8gYW4gYXJyYXkgb2Ygc3RyaW5ncy4gIFJlZHVjZSB0aGUgdGV4dHMgdG8gYSBzdHJpbmcgb2ZcbiAgICogaGFzaGVzIHdoZXJlIGVhY2ggVW5pY29kZSBjaGFyYWN0ZXIgcmVwcmVzZW50cyBvbmUgbGluZS5cbiAgICogTW9kaWZpZXMgbGluZWFycmF5IGFuZCBsaW5laGFzaCB0aHJvdWdoIGJlaW5nIGEgY2xvc3VyZS5cbiAgICogQHBhcmFtICB0ZXh0IFN0cmluZyB0byBlbmNvZGUuXG4gICAqIEByZXR1cm4gIEVuY29kZWQgc3RyaW5nLlxuXG4gICAqL1xuICBkaWZmX2xpbmVzVG9DaGFyc011bmdlXyh0ZXh0OiBzdHJpbmcsIGxpbmVBcnJheTogQXJyYXk8c3RyaW5nPiwgbGluZUhhc2g6IGFueSk6IHN0cmluZyB7XG4gICAgbGV0IGNoYXJzID0gJyc7XG4gICAgLy8gV2FsayB0aGUgdGV4dCwgcHVsbGluZyBvdXQgYSBzdWJzdHJpbmcgZm9yIGVhY2ggbGluZS5cbiAgICAvLyB0ZXh0LnNwbGl0KCdcXG4nKSB3b3VsZCB3b3VsZCB0ZW1wb3JhcmlseSBkb3VibGUgb3VyIG1lbW9yeSBmb290cHJpbnQuXG4gICAgLy8gTW9kaWZ5aW5nIHRleHQgd291bGQgY3JlYXRlIG1hbnkgbGFyZ2Ugc3RyaW5ncyB0byBnYXJiYWdlIGNvbGxlY3QuXG4gICAgbGV0IGxpbmVTdGFydCA9IDA7XG4gICAgbGV0IGxpbmVFbmQgPSAtMTtcbiAgICAvLyBLZWVwaW5nIG91ciBvd24gbGVuZ3RoIGNvbnN0aWFibGUgaXMgZmFzdGVyIHRoYW4gbG9va2luZyBpdCB1cC5cbiAgICBsZXQgbGluZUFycmF5TGVuZ3RoID0gbGluZUFycmF5Lmxlbmd0aDtcbiAgICB3aGlsZSAobGluZUVuZCA8IHRleHQubGVuZ3RoIC0gMSkge1xuICAgICAgbGluZUVuZCA9IHRleHQuaW5kZXhPZignXFxuJywgbGluZVN0YXJ0KTtcbiAgICAgIGlmIChsaW5lRW5kID09IC0xKSB7XG4gICAgICAgIGxpbmVFbmQgPSB0ZXh0Lmxlbmd0aCAtIDE7XG4gICAgICB9XG4gICAgICBjb25zdCBsaW5lID0gdGV4dC5zdWJzdHJpbmcobGluZVN0YXJ0LCBsaW5lRW5kICsgMSk7XG4gICAgICBsaW5lU3RhcnQgPSBsaW5lRW5kICsgMTtcblxuICAgICAgaWYgKGxpbmVIYXNoLmhhc093blByb3BlcnR5ID8gbGluZUhhc2guaGFzT3duUHJvcGVydHkobGluZSkgOlxuICAgICAgICAgIChsaW5lSGFzaFtsaW5lXSAhPT0gdW5kZWZpbmVkKSkge1xuICAgICAgICBjaGFycyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGxpbmVIYXNoW2xpbmVdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNoYXJzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUobGluZUFycmF5TGVuZ3RoKTtcbiAgICAgICAgbGluZUhhc2hbbGluZV0gPSBsaW5lQXJyYXlMZW5ndGg7XG4gICAgICAgIGxpbmVBcnJheVtsaW5lQXJyYXlMZW5ndGgrK10gPSBsaW5lO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY2hhcnM7XG4gIH1cblxuICAvKipcbiAgICogUmVoeWRyYXRlIHRoZSB0ZXh0IGluIGEgZGlmZiBmcm9tIGEgc3RyaW5nIG9mIGxpbmUgaGFzaGVzIHRvIHJlYWwgbGluZXMgb2ZcbiAgICogdGV4dC5cbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cbiAgICogQHBhcmFtICBsaW5lQXJyYXkgQXJyYXkgb2YgdW5pcXVlIHN0cmluZ3MuXG5cbiAgICovXG4gICAgZGlmZl9jaGFyc1RvTGluZXNfIChkaWZmczogQXJyYXk8RGlmZj4sIGxpbmVBcnJheTogQXJyYXk8c3RyaW5nPik6IHZvaWQge1xuICAgIGZvciAobGV0IHggPSAwOyB4IDwgZGlmZnMubGVuZ3RoOyB4KyspIHtcbiAgICAgIGNvbnN0IGNoYXJzID0gZGlmZnNbeF1bMV07XG4gICAgICBjb25zdCB0ZXh0ID0gW107XG4gICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGNoYXJzLmxlbmd0aDsgeSsrKSB7XG4gICAgICAgIHRleHRbeV0gPSBsaW5lQXJyYXlbY2hhcnMuY2hhckNvZGVBdCh5KV07XG4gICAgICB9XG4gICAgICBkaWZmc1t4XVsxXSA9IHRleHQuam9pbignJyk7XG4gICAgfVxuICB9O1xuXG5cbiAgLyoqXG4gICAqIERldGVybWluZSB0aGUgY29tbW9uIHByZWZpeCBvZiB0d28gc3RyaW5ncy5cbiAgICogQHBhcmFtICB0ZXh0MSBGaXJzdCBzdHJpbmcuXG4gICAqIEBwYXJhbSAgdGV4dDIgU2Vjb25kIHN0cmluZy5cbiAgICogQHJldHVybiAgVGhlIG51bWJlciBvZiBjaGFyYWN0ZXJzIGNvbW1vbiB0byB0aGUgc3RhcnQgb2YgZWFjaFxuICAgKiAgICAgc3RyaW5nLlxuICAgKi9cbiAgICBkaWZmX2NvbW1vblByZWZpeCAodGV4dDE6IHN0cmluZywgdGV4dDI6IHN0cmluZyk6IG51bWJlciB7XG4gICAgLy8gUXVpY2sgY2hlY2sgZm9yIGNvbW1vbiBudWxsIGNhc2VzLlxuICAgIGlmICghdGV4dDEgfHwgIXRleHQyIHx8IHRleHQxLmNoYXJBdCgwKSAhPSB0ZXh0Mi5jaGFyQXQoMCkpIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICAvLyBCaW5hcnkgc2VhcmNoLlxuICAgIC8vIFBlcmZvcm1hbmNlIGFuYWx5c2lzOiBodHRwOi8vbmVpbC5mcmFzZXIubmFtZS9uZXdzLzIwMDcvMTAvMDkvXG4gICAgbGV0IHBvaW50ZXJtaW4gPSAwO1xuICAgIGxldCBwb2ludGVybWF4ID0gTWF0aC5taW4odGV4dDEubGVuZ3RoLCB0ZXh0Mi5sZW5ndGgpO1xuICAgIGxldCBwb2ludGVybWlkID0gcG9pbnRlcm1heDtcbiAgICBsZXQgcG9pbnRlcnN0YXJ0ID0gMDtcbiAgICB3aGlsZSAocG9pbnRlcm1pbiA8IHBvaW50ZXJtaWQpIHtcbiAgICAgIGlmICh0ZXh0MS5zdWJzdHJpbmcocG9pbnRlcnN0YXJ0LCBwb2ludGVybWlkKSA9PVxuICAgICAgICAgIHRleHQyLnN1YnN0cmluZyhwb2ludGVyc3RhcnQsIHBvaW50ZXJtaWQpKSB7XG4gICAgICAgIHBvaW50ZXJtaW4gPSBwb2ludGVybWlkO1xuICAgICAgICBwb2ludGVyc3RhcnQgPSBwb2ludGVybWluO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcG9pbnRlcm1heCA9IHBvaW50ZXJtaWQ7XG4gICAgICB9XG4gICAgICBwb2ludGVybWlkID0gTWF0aC5mbG9vcigocG9pbnRlcm1heCAtIHBvaW50ZXJtaW4pIC8gMiArIHBvaW50ZXJtaW4pO1xuICAgIH1cbiAgICByZXR1cm4gcG9pbnRlcm1pZDtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmUgdGhlIGNvbW1vbiBzdWZmaXggb2YgdHdvIHN0cmluZ3MuXG4gICAqIEBwYXJhbSAgdGV4dDEgRmlyc3Qgc3RyaW5nLlxuICAgKiBAcGFyYW0gIHRleHQyIFNlY29uZCBzdHJpbmcuXG4gICAqIEByZXR1cm4gIFRoZSBudW1iZXIgb2YgY2hhcmFjdGVycyBjb21tb24gdG8gdGhlIGVuZCBvZiBlYWNoIHN0cmluZy5cbiAgICovXG4gICAgZGlmZl9jb21tb25TdWZmaXggKHRleHQxOiBzdHJpbmcsIHRleHQyOiBzdHJpbmcpOiBudW1iZXIge1xuICAgIC8vIFF1aWNrIGNoZWNrIGZvciBjb21tb24gbnVsbCBjYXNlcy5cbiAgICBpZiAoIXRleHQxIHx8ICF0ZXh0MiB8fFxuICAgICAgICB0ZXh0MS5jaGFyQXQodGV4dDEubGVuZ3RoIC0gMSkgIT0gdGV4dDIuY2hhckF0KHRleHQyLmxlbmd0aCAtIDEpKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgLy8gQmluYXJ5IHNlYXJjaC5cbiAgICAvLyBQZXJmb3JtYW5jZSBhbmFseXNpczogaHR0cDovL25laWwuZnJhc2VyLm5hbWUvbmV3cy8yMDA3LzEwLzA5L1xuICAgIGxldCBwb2ludGVybWluID0gMDtcbiAgICBsZXQgcG9pbnRlcm1heCA9IE1hdGgubWluKHRleHQxLmxlbmd0aCwgdGV4dDIubGVuZ3RoKTtcbiAgICBsZXQgcG9pbnRlcm1pZCA9IHBvaW50ZXJtYXg7XG4gICAgbGV0IHBvaW50ZXJlbmQgPSAwO1xuICAgIHdoaWxlIChwb2ludGVybWluIDwgcG9pbnRlcm1pZCkge1xuICAgICAgaWYgKHRleHQxLnN1YnN0cmluZyh0ZXh0MS5sZW5ndGggLSBwb2ludGVybWlkLCB0ZXh0MS5sZW5ndGggLSBwb2ludGVyZW5kKSA9PVxuICAgICAgICAgIHRleHQyLnN1YnN0cmluZyh0ZXh0Mi5sZW5ndGggLSBwb2ludGVybWlkLCB0ZXh0Mi5sZW5ndGggLSBwb2ludGVyZW5kKSkge1xuICAgICAgICBwb2ludGVybWluID0gcG9pbnRlcm1pZDtcbiAgICAgICAgcG9pbnRlcmVuZCA9IHBvaW50ZXJtaW47XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwb2ludGVybWF4ID0gcG9pbnRlcm1pZDtcbiAgICAgIH1cbiAgICAgIHBvaW50ZXJtaWQgPSBNYXRoLmZsb29yKChwb2ludGVybWF4IC0gcG9pbnRlcm1pbikgLyAyICsgcG9pbnRlcm1pbik7XG4gICAgfVxuICAgIHJldHVybiBwb2ludGVybWlkO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIERldGVybWluZSBpZiB0aGUgc3VmZml4IG9mIG9uZSBzdHJpbmcgaXMgdGhlIHByZWZpeCBvZiBhbm90aGVyLlxuICAgKiBAcGFyYW0gIHRleHQxIEZpcnN0IHN0cmluZy5cbiAgICogQHBhcmFtICB0ZXh0MiBTZWNvbmQgc3RyaW5nLlxuICAgKiBAcmV0dXJuICBUaGUgbnVtYmVyIG9mIGNoYXJhY3RlcnMgY29tbW9uIHRvIHRoZSBlbmQgb2YgdGhlIGZpcnN0XG4gICAqICAgICBzdHJpbmcgYW5kIHRoZSBzdGFydCBvZiB0aGUgc2Vjb25kIHN0cmluZy5cblxuICAgKi9cbiAgICBkaWZmX2NvbW1vbk92ZXJsYXBfICh0ZXh0MTogc3RyaW5nLCB0ZXh0Mjogc3RyaW5nKTogbnVtYmVyIHtcbiAgICAvLyBDYWNoZSB0aGUgdGV4dCBsZW5ndGhzIHRvIHByZXZlbnQgbXVsdGlwbGUgY2FsbHMuXG4gICAgY29uc3QgdGV4dDFfbGVuZ3RoID0gdGV4dDEubGVuZ3RoO1xuICAgIGNvbnN0IHRleHQyX2xlbmd0aCA9IHRleHQyLmxlbmd0aDtcbiAgICAvLyBFbGltaW5hdGUgdGhlIG51bGwgY2FzZS5cbiAgICBpZiAodGV4dDFfbGVuZ3RoID09IDAgfHwgdGV4dDJfbGVuZ3RoID09IDApIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICAvLyBUcnVuY2F0ZSB0aGUgbG9uZ2VyIHN0cmluZy5cbiAgICBpZiAodGV4dDFfbGVuZ3RoID4gdGV4dDJfbGVuZ3RoKSB7XG4gICAgICB0ZXh0MSA9IHRleHQxLnN1YnN0cmluZyh0ZXh0MV9sZW5ndGggLSB0ZXh0Ml9sZW5ndGgpO1xuICAgIH0gZWxzZSBpZiAodGV4dDFfbGVuZ3RoIDwgdGV4dDJfbGVuZ3RoKSB7XG4gICAgICB0ZXh0MiA9IHRleHQyLnN1YnN0cmluZygwLCB0ZXh0MV9sZW5ndGgpO1xuICAgIH1cbiAgICBjb25zdCB0ZXh0X2xlbmd0aCA9IE1hdGgubWluKHRleHQxX2xlbmd0aCwgdGV4dDJfbGVuZ3RoKTtcbiAgICAvLyBRdWljayBjaGVjayBmb3IgdGhlIHdvcnN0IGNhc2UuXG4gICAgaWYgKHRleHQxID09IHRleHQyKSB7XG4gICAgICByZXR1cm4gdGV4dF9sZW5ndGg7XG4gICAgfVxuXG4gICAgLy8gU3RhcnQgYnkgbG9va2luZyBmb3IgYSBzaW5nbGUgY2hhcmFjdGVyIG1hdGNoXG4gICAgLy8gYW5kIGluY3JlYXNlIGxlbmd0aCB1bnRpbCBubyBtYXRjaCBpcyBmb3VuZC5cbiAgICAvLyBQZXJmb3JtYW5jZSBhbmFseXNpczogaHR0cDovL25laWwuZnJhc2VyLm5hbWUvbmV3cy8yMDEwLzExLzA0L1xuICAgIGxldCBiZXN0ID0gMDtcbiAgICBsZXQgbGVuZ3RoID0gMTtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgY29uc3QgcGF0dGVybiA9IHRleHQxLnN1YnN0cmluZyh0ZXh0X2xlbmd0aCAtIGxlbmd0aCk7XG4gICAgICBjb25zdCBmb3VuZCA9IHRleHQyLmluZGV4T2YocGF0dGVybik7XG4gICAgICBpZiAoZm91bmQgPT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIGJlc3Q7XG4gICAgICB9XG4gICAgICBsZW5ndGggKz0gZm91bmQ7XG4gICAgICBpZiAoZm91bmQgPT0gMCB8fCB0ZXh0MS5zdWJzdHJpbmcodGV4dF9sZW5ndGggLSBsZW5ndGgpID09XG4gICAgICAgICAgdGV4dDIuc3Vic3RyaW5nKDAsIGxlbmd0aCkpIHtcbiAgICAgICAgYmVzdCA9IGxlbmd0aDtcbiAgICAgICAgbGVuZ3RoKys7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG5cbiAgLyoqXG4gICAqIERvIHRoZSB0d28gdGV4dHMgc2hhcmUgYSBzdWJzdHJpbmcgd2hpY2ggaXMgYXQgbGVhc3QgaGFsZiB0aGUgbGVuZ3RoIG9mIHRoZVxuICAgKiBsb25nZXIgdGV4dD9cbiAgICogVGhpcyBzcGVlZHVwIGNhbiBwcm9kdWNlIG5vbi1taW5pbWFsIGRpZmZzLlxuICAgKiBAcGFyYW0gIHRleHQxIEZpcnN0IHN0cmluZy5cbiAgICogQHBhcmFtICB0ZXh0MiBTZWNvbmQgc3RyaW5nLlxuICAgKiBAcmV0dXJuICBGaXZlIGVsZW1lbnQgQXJyYXksIGNvbnRhaW5pbmcgdGhlIHByZWZpeCBvZlxuICAgKiAgICAgdGV4dDEsIHRoZSBzdWZmaXggb2YgdGV4dDEsIHRoZSBwcmVmaXggb2YgdGV4dDIsIHRoZSBzdWZmaXggb2ZcbiAgICogICAgIHRleHQyIGFuZCB0aGUgY29tbW9uIG1pZGRsZS4gIE9yIG51bGwgaWYgdGhlcmUgd2FzIG5vIG1hdGNoLlxuXG4gICAqL1xuICAgIGRpZmZfaGFsZk1hdGNoXyAodGV4dDE6IHN0cmluZywgdGV4dDI6IHN0cmluZykge1xuICAgIGlmICh0aGlzLkRpZmZfVGltZW91dCA8PSAwKSB7XG4gICAgICAvLyBEb24ndCByaXNrIHJldHVybmluZyBhIG5vbi1vcHRpbWFsIGRpZmYgaWYgd2UgaGF2ZSB1bmxpbWl0ZWQgdGltZS5cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBsb25ndGV4dCA9IHRleHQxLmxlbmd0aCA+IHRleHQyLmxlbmd0aCA/IHRleHQxIDogdGV4dDI7XG4gICAgY29uc3Qgc2hvcnR0ZXh0ID0gdGV4dDEubGVuZ3RoID4gdGV4dDIubGVuZ3RoID8gdGV4dDIgOiB0ZXh0MTtcbiAgICBpZiAobG9uZ3RleHQubGVuZ3RoIDwgNCB8fCBzaG9ydHRleHQubGVuZ3RoICogMiA8IGxvbmd0ZXh0Lmxlbmd0aCkge1xuICAgICAgcmV0dXJuIG51bGw7ICAvLyBQb2ludGxlc3MuXG4gICAgfVxuICAgIGNvbnN0IGRtcCA9IHRoaXM7ICAvLyAndGhpcycgYmVjb21lcyAnd2luZG93JyBpbiBhIGNsb3N1cmUuXG5cblxuICAgIC8vIEZpcnN0IGNoZWNrIGlmIHRoZSBzZWNvbmQgcXVhcnRlciBpcyB0aGUgc2VlZCBmb3IgYSBoYWxmLW1hdGNoLlxuICAgIGNvbnN0IGhtMSA9IHRoaXMuZGlmZl9oYWxmTWF0Y2hJXyhsb25ndGV4dCwgc2hvcnR0ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5jZWlsKGxvbmd0ZXh0Lmxlbmd0aCAvIDQpLCBkbXApO1xuICAgIC8vIENoZWNrIGFnYWluIGJhc2VkIG9uIHRoZSB0aGlyZCBxdWFydGVyLlxuICAgIGNvbnN0IGhtMiA9IHRoaXMuZGlmZl9oYWxmTWF0Y2hJXyhsb25ndGV4dCwgc2hvcnR0ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5jZWlsKGxvbmd0ZXh0Lmxlbmd0aCAvIDIpLCBkbXApO1xuICAgIGxldCBobTtcbiAgICBpZiAoIWhtMSAmJiAhaG0yKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGVsc2UgaWYgKCFobTIpIHtcbiAgICAgIGhtID0gaG0xO1xuICAgIH0gZWxzZSBpZiAoIWhtMSkge1xuICAgICAgaG0gPSBobTI7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEJvdGggbWF0Y2hlZC4gIFNlbGVjdCB0aGUgbG9uZ2VzdC5cbiAgICAgIGhtID0gaG0xWzRdLmxlbmd0aCA+IGhtMls0XS5sZW5ndGggPyBobTEgOiBobTI7XG4gICAgfVxuXG4gICAgLy8gQSBoYWxmLW1hdGNoIHdhcyBmb3VuZCwgc29ydCBvdXQgdGhlIHJldHVybiBkYXRhLlxuICAgIGxldCB0ZXh0MV9hLCB0ZXh0MV9iLCB0ZXh0Ml9hLCB0ZXh0Ml9iO1xuICAgIGlmICh0ZXh0MS5sZW5ndGggPiB0ZXh0Mi5sZW5ndGgpIHtcbiAgICAgIHRleHQxX2EgPSBobVswXTtcbiAgICAgIHRleHQxX2IgPSBobVsxXTtcbiAgICAgIHRleHQyX2EgPSBobVsyXTtcbiAgICAgIHRleHQyX2IgPSBobVszXTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGV4dDJfYSA9IGhtWzBdO1xuICAgICAgdGV4dDJfYiA9IGhtWzFdO1xuICAgICAgdGV4dDFfYSA9IGhtWzJdO1xuICAgICAgdGV4dDFfYiA9IGhtWzNdO1xuICAgIH1cbiAgICBjb25zdCBtaWRfY29tbW9uID0gaG1bNF07XG4gICAgcmV0dXJuIFt0ZXh0MV9hLCB0ZXh0MV9iLCB0ZXh0Ml9hLCB0ZXh0Ml9iLCBtaWRfY29tbW9uXTtcbiAgfTtcblxuICAvKipcbiAgICogRG9lcyBhIHN1YnN0cmluZyBvZiBzaG9ydHRleHQgZXhpc3Qgd2l0aGluIGxvbmd0ZXh0IHN1Y2ggdGhhdCB0aGUgc3Vic3RyaW5nXG4gICAqIGlzIGF0IGxlYXN0IGhhbGYgdGhlIGxlbmd0aCBvZiBsb25ndGV4dD9cbiAgICogQ2xvc3VyZSwgYnV0IGRvZXMgbm90IHJlZmVyZW5jZSBhbnkgZXh0ZXJuYWwgY29uc3RpYWJsZXMuXG4gICAqIEBwYXJhbSAgbG9uZ3RleHQgTG9uZ2VyIHN0cmluZy5cbiAgICogQHBhcmFtICBzaG9ydHRleHQgU2hvcnRlciBzdHJpbmcuXG4gICAqIEBwYXJhbSAgaSBTdGFydCBpbmRleCBvZiBxdWFydGVyIGxlbmd0aCBzdWJzdHJpbmcgd2l0aGluIGxvbmd0ZXh0LlxuICAgKiBAcmV0dXJuICBGaXZlIGVsZW1lbnQgQXJyYXksIGNvbnRhaW5pbmcgdGhlIHByZWZpeCBvZlxuICAgKiAgICAgbG9uZ3RleHQsIHRoZSBzdWZmaXggb2YgbG9uZ3RleHQsIHRoZSBwcmVmaXggb2Ygc2hvcnR0ZXh0LCB0aGUgc3VmZml4XG4gICAqICAgICBvZiBzaG9ydHRleHQgYW5kIHRoZSBjb21tb24gbWlkZGxlLiAgT3IgbnVsbCBpZiB0aGVyZSB3YXMgbm8gbWF0Y2guXG5cbiAgICovXG4gIGRpZmZfaGFsZk1hdGNoSV8obG9uZ3RleHQ6IHN0cmluZywgc2hvcnR0ZXh0OiBzdHJpbmcsIGk6IG51bWJlciwgZG1wOiBEaWZmTWF0Y2hQYXRjaCk6IEFycmF5PHN0cmluZz4ge1xuICAgIC8vIFN0YXJ0IHdpdGggYSAxLzQgbGVuZ3RoIHN1YnN0cmluZyBhdCBwb3NpdGlvbiBpIGFzIGEgc2VlZC5cbiAgICBjb25zdCBzZWVkID0gbG9uZ3RleHQuc3Vic3RyaW5nKGksIGkgKyBNYXRoLmZsb29yKGxvbmd0ZXh0Lmxlbmd0aCAvIDQpKTtcbiAgICBsZXQgaiA9IC0xO1xuICAgIGxldCBiZXN0X2NvbW1vbiA9ICcnO1xuICAgIGxldCBiZXN0X2xvbmd0ZXh0X2EsIGJlc3RfbG9uZ3RleHRfYiwgYmVzdF9zaG9ydHRleHRfYSwgYmVzdF9zaG9ydHRleHRfYjtcbiAgICB3aGlsZSAoKGogPSBzaG9ydHRleHQuaW5kZXhPZihzZWVkLCBqICsgMSkpICE9IC0xKSB7XG4gICAgICBjb25zdCBwcmVmaXhMZW5ndGggPSBkbXAuZGlmZl9jb21tb25QcmVmaXgobG9uZ3RleHQuc3Vic3RyaW5nKGkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3J0dGV4dC5zdWJzdHJpbmcoaikpO1xuICAgICAgY29uc3Qgc3VmZml4TGVuZ3RoID0gZG1wLmRpZmZfY29tbW9uU3VmZml4KGxvbmd0ZXh0LnN1YnN0cmluZygwLCBpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG9ydHRleHQuc3Vic3RyaW5nKDAsIGopKTtcbiAgICAgIGlmIChiZXN0X2NvbW1vbi5sZW5ndGggPCBzdWZmaXhMZW5ndGggKyBwcmVmaXhMZW5ndGgpIHtcbiAgICAgICAgYmVzdF9jb21tb24gPSBzaG9ydHRleHQuc3Vic3RyaW5nKGogLSBzdWZmaXhMZW5ndGgsIGopICtcbiAgICAgICAgICAgIHNob3J0dGV4dC5zdWJzdHJpbmcoaiwgaiArIHByZWZpeExlbmd0aCk7XG4gICAgICAgIGJlc3RfbG9uZ3RleHRfYSA9IGxvbmd0ZXh0LnN1YnN0cmluZygwLCBpIC0gc3VmZml4TGVuZ3RoKTtcbiAgICAgICAgYmVzdF9sb25ndGV4dF9iID0gbG9uZ3RleHQuc3Vic3RyaW5nKGkgKyBwcmVmaXhMZW5ndGgpO1xuICAgICAgICBiZXN0X3Nob3J0dGV4dF9hID0gc2hvcnR0ZXh0LnN1YnN0cmluZygwLCBqIC0gc3VmZml4TGVuZ3RoKTtcbiAgICAgICAgYmVzdF9zaG9ydHRleHRfYiA9IHNob3J0dGV4dC5zdWJzdHJpbmcoaiArIHByZWZpeExlbmd0aCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChiZXN0X2NvbW1vbi5sZW5ndGggKiAyID49IGxvbmd0ZXh0Lmxlbmd0aCkge1xuICAgICAgcmV0dXJuIFtiZXN0X2xvbmd0ZXh0X2EsIGJlc3RfbG9uZ3RleHRfYixcbiAgICAgICAgICAgICAgYmVzdF9zaG9ydHRleHRfYSwgYmVzdF9zaG9ydHRleHRfYiwgYmVzdF9jb21tb25dO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVkdWNlIHRoZSBudW1iZXIgb2YgZWRpdHMgYnkgZWxpbWluYXRpbmcgc2VtYW50aWNhbGx5IHRyaXZpYWwgZXF1YWxpdGllcy5cbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cbiAgICovXG4gICAgZGlmZl9jbGVhbnVwU2VtYW50aWMgKGRpZmZzOiBBcnJheTxEaWZmPikge1xuICAgIGxldCBjaGFuZ2VzID0gZmFsc2U7XG4gICAgY29uc3QgZXF1YWxpdGllcyA9IFtdOyAgLy8gU3RhY2sgb2YgaW5kaWNlcyB3aGVyZSBlcXVhbGl0aWVzIGFyZSBmb3VuZC5cbiAgICBsZXQgZXF1YWxpdGllc0xlbmd0aCA9IDA7ICAvLyBLZWVwaW5nIG91ciBvd24gbGVuZ3RoIGNvbnN0IGlzIGZhc3RlciBpbiBKUy5cblxuICAgIGxldCBsYXN0ZXF1YWxpdHkgPSBudWxsO1xuICAgIC8vIEFsd2F5cyBlcXVhbCB0byBkaWZmc1tlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGggLSAxXV1bMV1cbiAgICBsZXQgcG9pbnRlciA9IDA7ICAvLyBJbmRleCBvZiBjdXJyZW50IHBvc2l0aW9uLlxuICAgIC8vIE51bWJlciBvZiBjaGFyYWN0ZXJzIHRoYXQgY2hhbmdlZCBwcmlvciB0byB0aGUgZXF1YWxpdHkuXG4gICAgbGV0IGxlbmd0aF9pbnNlcnRpb25zMSA9IDA7XG4gICAgbGV0IGxlbmd0aF9kZWxldGlvbnMxID0gMDtcbiAgICAvLyBOdW1iZXIgb2YgY2hhcmFjdGVycyB0aGF0IGNoYW5nZWQgYWZ0ZXIgdGhlIGVxdWFsaXR5LlxuICAgIGxldCBsZW5ndGhfaW5zZXJ0aW9uczIgPSAwO1xuICAgIGxldCBsZW5ndGhfZGVsZXRpb25zMiA9IDA7XG4gICAgd2hpbGUgKHBvaW50ZXIgPCBkaWZmcy5sZW5ndGgpIHtcbiAgICAgIGlmIChkaWZmc1twb2ludGVyXVswXSA9PSBEaWZmT3AuRXF1YWwpIHsgIC8vIEVxdWFsaXR5IGZvdW5kLlxuICAgICAgICBlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGgrK10gPSBwb2ludGVyO1xuICAgICAgICBsZW5ndGhfaW5zZXJ0aW9uczEgPSBsZW5ndGhfaW5zZXJ0aW9uczI7XG4gICAgICAgIGxlbmd0aF9kZWxldGlvbnMxID0gbGVuZ3RoX2RlbGV0aW9uczI7XG4gICAgICAgIGxlbmd0aF9pbnNlcnRpb25zMiA9IDA7XG4gICAgICAgIGxlbmd0aF9kZWxldGlvbnMyID0gMDtcbiAgICAgICAgbGFzdGVxdWFsaXR5ID0gZGlmZnNbcG9pbnRlcl1bMV07XG4gICAgICB9IGVsc2UgeyAgLy8gQW4gaW5zZXJ0aW9uIG9yIGRlbGV0aW9uLlxuICAgICAgICBpZiAoZGlmZnNbcG9pbnRlcl1bMF0gPT0gRGlmZk9wLkluc2VydCkge1xuICAgICAgICAgIGxlbmd0aF9pbnNlcnRpb25zMiArPSBkaWZmc1twb2ludGVyXVsxXS5sZW5ndGg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGVuZ3RoX2RlbGV0aW9uczIgKz0gZGlmZnNbcG9pbnRlcl1bMV0ubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIC8vIEVsaW1pbmF0ZSBhbiBlcXVhbGl0eSB0aGF0IGlzIHNtYWxsZXIgb3IgZXF1YWwgdG8gdGhlIGVkaXRzIG9uIGJvdGhcbiAgICAgICAgLy8gc2lkZXMgb2YgaXQuXG4gICAgICAgIGlmIChsYXN0ZXF1YWxpdHkgJiYgKGxhc3RlcXVhbGl0eS5sZW5ndGggPD1cbiAgICAgICAgICAgIE1hdGgubWF4KGxlbmd0aF9pbnNlcnRpb25zMSwgbGVuZ3RoX2RlbGV0aW9uczEpKSAmJlxuICAgICAgICAgICAgKGxhc3RlcXVhbGl0eS5sZW5ndGggPD0gTWF0aC5tYXgobGVuZ3RoX2luc2VydGlvbnMyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZW5ndGhfZGVsZXRpb25zMikpKSB7XG4gICAgICAgICAgLy8gRHVwbGljYXRlIHJlY29yZC5cbiAgICAgICAgICBkaWZmcy5zcGxpY2UoZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoIC0gMV0sIDAsXG4gICAgICAgICAgICAgICAgICAgICAgW0RpZmZPcC5EZWxldGUsIGxhc3RlcXVhbGl0eV0pO1xuICAgICAgICAgIC8vIENoYW5nZSBzZWNvbmQgY29weSB0byBpbnNlcnQuXG4gICAgICAgICAgZGlmZnNbZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoIC0gMV0gKyAxXVswXSA9IERpZmZPcC5JbnNlcnQ7XG4gICAgICAgICAgLy8gVGhyb3cgYXdheSB0aGUgZXF1YWxpdHkgd2UganVzdCBkZWxldGVkLlxuICAgICAgICAgIGVxdWFsaXRpZXNMZW5ndGgtLTtcbiAgICAgICAgICAvLyBUaHJvdyBhd2F5IHRoZSBwcmV2aW91cyBlcXVhbGl0eSAoaXQgbmVlZHMgdG8gYmUgcmVldmFsdWF0ZWQpLlxuICAgICAgICAgIGVxdWFsaXRpZXNMZW5ndGgtLTtcbiAgICAgICAgICBwb2ludGVyID0gZXF1YWxpdGllc0xlbmd0aCA+IDAgPyBlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGggLSAxXSA6IC0xO1xuICAgICAgICAgIGxlbmd0aF9pbnNlcnRpb25zMSA9IDA7ICAvLyBSZXNldCB0aGUgY291bnRlcnMuXG4gICAgICAgICAgbGVuZ3RoX2RlbGV0aW9uczEgPSAwO1xuICAgICAgICAgIGxlbmd0aF9pbnNlcnRpb25zMiA9IDA7XG4gICAgICAgICAgbGVuZ3RoX2RlbGV0aW9uczIgPSAwO1xuICAgICAgICAgIGxhc3RlcXVhbGl0eSA9IG51bGw7XG4gICAgICAgICAgY2hhbmdlcyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHBvaW50ZXIrKztcbiAgICB9XG5cbiAgICAvLyBOb3JtYWxpemUgdGhlIGRpZmYuXG4gICAgaWYgKGNoYW5nZXMpIHtcbiAgICAgIHRoaXMuZGlmZl9jbGVhbnVwTWVyZ2UoZGlmZnMpO1xuICAgIH1cbiAgICB0aGlzLmRpZmZfY2xlYW51cFNlbWFudGljTG9zc2xlc3MoZGlmZnMpO1xuXG4gICAgLy8gRmluZCBhbnkgb3ZlcmxhcHMgYmV0d2VlbiBkZWxldGlvbnMgYW5kIGluc2VydGlvbnMuXG4gICAgLy8gZS5nOiA8ZGVsPmFiY3h4eDwvZGVsPjxpbnM+eHh4ZGVmPC9pbnM+XG4gICAgLy8gICAtPiA8ZGVsPmFiYzwvZGVsPnh4eDxpbnM+ZGVmPC9pbnM+XG4gICAgLy8gZS5nOiA8ZGVsPnh4eGFiYzwvZGVsPjxpbnM+ZGVmeHh4PC9pbnM+XG4gICAgLy8gICAtPiA8aW5zPmRlZjwvaW5zPnh4eDxkZWw+YWJjPC9kZWw+XG4gICAgLy8gT25seSBleHRyYWN0IGFuIG92ZXJsYXAgaWYgaXQgaXMgYXMgYmlnIGFzIHRoZSBlZGl0IGFoZWFkIG9yIGJlaGluZCBpdC5cbiAgICBwb2ludGVyID0gMTtcbiAgICB3aGlsZSAocG9pbnRlciA8IGRpZmZzLmxlbmd0aCkge1xuICAgICAgaWYgKGRpZmZzW3BvaW50ZXIgLSAxXVswXSA9PSBEaWZmT3AuRGVsZXRlICYmXG4gICAgICAgICAgZGlmZnNbcG9pbnRlcl1bMF0gPT0gRGlmZk9wLkluc2VydCkge1xuICAgICAgICBjb25zdCBkZWxldGlvbiA9IGRpZmZzW3BvaW50ZXIgLSAxXVsxXTtcbiAgICAgICAgY29uc3QgaW5zZXJ0aW9uID0gZGlmZnNbcG9pbnRlcl1bMV07XG4gICAgICAgIGNvbnN0IG92ZXJsYXBfbGVuZ3RoMSA9IHRoaXMuZGlmZl9jb21tb25PdmVybGFwXyhkZWxldGlvbiwgaW5zZXJ0aW9uKTtcbiAgICAgICAgY29uc3Qgb3ZlcmxhcF9sZW5ndGgyID0gdGhpcy5kaWZmX2NvbW1vbk92ZXJsYXBfKGluc2VydGlvbiwgZGVsZXRpb24pO1xuICAgICAgICBpZiAob3ZlcmxhcF9sZW5ndGgxID49IG92ZXJsYXBfbGVuZ3RoMikge1xuICAgICAgICAgIGlmIChvdmVybGFwX2xlbmd0aDEgPj0gZGVsZXRpb24ubGVuZ3RoIC8gMiB8fFxuICAgICAgICAgICAgICBvdmVybGFwX2xlbmd0aDEgPj0gaW5zZXJ0aW9uLmxlbmd0aCAvIDIpIHtcbiAgICAgICAgICAgIC8vIE92ZXJsYXAgZm91bmQuICBJbnNlcnQgYW4gZXF1YWxpdHkgYW5kIHRyaW0gdGhlIHN1cnJvdW5kaW5nIGVkaXRzLlxuICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIsIDAsXG4gICAgICAgICAgICAgICAgW0RpZmZPcC5FcXVhbCwgaW5zZXJ0aW9uLnN1YnN0cmluZygwLCBvdmVybGFwX2xlbmd0aDEpXSk7XG4gICAgICAgICAgICBkaWZmc1twb2ludGVyIC0gMV1bMV0gPVxuICAgICAgICAgICAgICAgIGRlbGV0aW9uLnN1YnN0cmluZygwLCBkZWxldGlvbi5sZW5ndGggLSBvdmVybGFwX2xlbmd0aDEpO1xuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciArIDFdWzFdID0gaW5zZXJ0aW9uLnN1YnN0cmluZyhvdmVybGFwX2xlbmd0aDEpO1xuICAgICAgICAgICAgcG9pbnRlcisrO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAob3ZlcmxhcF9sZW5ndGgyID49IGRlbGV0aW9uLmxlbmd0aCAvIDIgfHxcbiAgICAgICAgICAgICAgb3ZlcmxhcF9sZW5ndGgyID49IGluc2VydGlvbi5sZW5ndGggLyAyKSB7XG4gICAgICAgICAgICAvLyBSZXZlcnNlIG92ZXJsYXAgZm91bmQuXG4gICAgICAgICAgICAvLyBJbnNlcnQgYW4gZXF1YWxpdHkgYW5kIHN3YXAgYW5kIHRyaW0gdGhlIHN1cnJvdW5kaW5nIGVkaXRzLlxuICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIsIDAsXG4gICAgICAgICAgICAgICAgW0RpZmZPcC5FcXVhbCwgZGVsZXRpb24uc3Vic3RyaW5nKDAsIG92ZXJsYXBfbGVuZ3RoMildKTtcbiAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgLSAxXVswXSA9IERpZmZPcC5JbnNlcnQ7XG4gICAgICAgICAgICBkaWZmc1twb2ludGVyIC0gMV1bMV0gPVxuICAgICAgICAgICAgICAgIGluc2VydGlvbi5zdWJzdHJpbmcoMCwgaW5zZXJ0aW9uLmxlbmd0aCAtIG92ZXJsYXBfbGVuZ3RoMik7XG4gICAgICAgICAgICBkaWZmc1twb2ludGVyICsgMV1bMF0gPSBEaWZmT3AuRGVsZXRlO1xuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciArIDFdWzFdID1cbiAgICAgICAgICAgICAgICBkZWxldGlvbi5zdWJzdHJpbmcob3ZlcmxhcF9sZW5ndGgyKTtcbiAgICAgICAgICAgIHBvaW50ZXIrKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcG9pbnRlcisrO1xuICAgICAgfVxuICAgICAgcG9pbnRlcisrO1xuICAgIH1cbiAgfTtcblxuXG4gIC8qKlxuICAgKiBMb29rIGZvciBzaW5nbGUgZWRpdHMgc3Vycm91bmRlZCBvbiBib3RoIHNpZGVzIGJ5IGVxdWFsaXRpZXNcbiAgICogd2hpY2ggY2FuIGJlIHNoaWZ0ZWQgc2lkZXdheXMgdG8gYWxpZ24gdGhlIGVkaXQgdG8gYSB3b3JkIGJvdW5kYXJ5LlxuICAgKiBlLmc6IFRoZSBjPGlucz5hdCBjPC9pbnM+YW1lLiAtPiBUaGUgPGlucz5jYXQgPC9pbnM+Y2FtZS5cbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cbiAgICovXG4gICAgZGlmZl9jbGVhbnVwU2VtYW50aWNMb3NzbGVzcyAoZGlmZnM6IEFycmF5PERpZmY+KSB7XG4gICAgLyoqXG4gICAgICogR2l2ZW4gdHdvIHN0cmluZ3MsIGNvbXB1dGUgYSBzY29yZSByZXByZXNlbnRpbmcgd2hldGhlciB0aGUgaW50ZXJuYWxcbiAgICAgKiBib3VuZGFyeSBmYWxscyBvbiBsb2dpY2FsIGJvdW5kYXJpZXMuXG4gICAgICogU2NvcmVzIHJhbmdlIGZyb20gNiAoYmVzdCkgdG8gMCAod29yc3QpLlxuICAgICAqIENsb3N1cmUsIGJ1dCBkb2VzIG5vdCByZWZlcmVuY2UgYW55IGV4dGVybmFsIGNvbnN0aWFibGVzLlxuICAgICAqIEBwYXJhbSAgb25lIEZpcnN0IHN0cmluZy5cbiAgICAgKiBAcGFyYW0gIHR3byBTZWNvbmQgc3RyaW5nLlxuICAgICAqIEByZXR1cm4gIFRoZSBzY29yZS5cblxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGRpZmZfY2xlYW51cFNlbWFudGljU2NvcmVfKG9uZTogc3RyaW5nLCB0d286IHN0cmluZyk6IG51bWJlciB7XG4gICAgICBpZiAoIW9uZSB8fCAhdHdvKSB7XG4gICAgICAgIC8vIEVkZ2VzIGFyZSB0aGUgYmVzdC5cbiAgICAgICAgcmV0dXJuIDY7XG4gICAgICB9XG5cblxuICAgICAgY29uc3Qgbm9uQWxwaGFOdW1lcmljUmVnZXhfID0gbmV3IFJlZ0V4cCgnL1teYS16QS1aMC05XS8nKTtcblxuICAgICAgLy8gRWFjaCBwb3J0IG9mIHRoaXMgZnVuY3Rpb24gYmVoYXZlcyBzbGlnaHRseSBkaWZmZXJlbnRseSBkdWUgdG9cbiAgICAgIC8vIHN1YnRsZSBkaWZmZXJlbmNlcyBpbiBlYWNoIGxhbmd1YWdlJ3MgZGVmaW5pdGlvbiBvZiB0aGluZ3MgbGlrZVxuICAgICAgLy8gJ3doaXRlc3BhY2UnLiAgU2luY2UgdGhpcyBmdW5jdGlvbidzIHB1cnBvc2UgaXMgbGFyZ2VseSBjb3NtZXRpYyxcbiAgICAgIC8vIHRoZSBjaG9pY2UgaGFzIGJlZW4gbWFkZSB0byB1c2UgZWFjaCBsYW5ndWFnZSdzIG5hdGl2ZSBmZWF0dXJlc1xuICAgICAgLy8gcmF0aGVyIHRoYW4gZm9yY2UgdG90YWwgY29uZm9ybWl0eS5cbiAgICAgIGNvbnN0IGNoYXIxID0gb25lLmNoYXJBdChvbmUubGVuZ3RoIC0gMSk7XG4gICAgICBjb25zdCBjaGFyMiA9IHR3by5jaGFyQXQoMCk7XG4gICAgICBjb25zdCBub25BbHBoYU51bWVyaWMxID0gY2hhcjEubWF0Y2gobm9uQWxwaGFOdW1lcmljUmVnZXhfKTtcbiAgICAgIGNvbnN0IG5vbkFscGhhTnVtZXJpYzIgPSBjaGFyMi5tYXRjaChub25BbHBoYU51bWVyaWNSZWdleF8pO1xuICAgICAgY29uc3Qgd2hpdGVzcGFjZTEgPSBub25BbHBoYU51bWVyaWMxICYmXG4gICAgICAgICAgY2hhcjEubWF0Y2godGhpcy53aGl0ZXNwYWNlUmVnZXhfKTtcbiAgICAgIGNvbnN0IHdoaXRlc3BhY2UyID0gbm9uQWxwaGFOdW1lcmljMiAmJlxuICAgICAgICAgIGNoYXIyLm1hdGNoKHRoaXMud2hpdGVzcGFjZVJlZ2V4Xyk7XG4gICAgICBjb25zdCBsaW5lQnJlYWsxID0gd2hpdGVzcGFjZTEgJiZcbiAgICAgICAgICBjaGFyMS5tYXRjaCh0aGlzLmxpbmVicmVha1JlZ2V4Xyk7XG4gICAgICBjb25zdCBsaW5lQnJlYWsyID0gd2hpdGVzcGFjZTIgJiZcbiAgICAgICAgICBjaGFyMi5tYXRjaCh0aGlzLmxpbmVicmVha1JlZ2V4Xyk7XG4gICAgICBjb25zdCBibGFua0xpbmUxID0gbGluZUJyZWFrMSAmJlxuICAgICAgICAgIG9uZS5tYXRjaCh0aGlzLmJsYW5rbGluZUVuZFJlZ2V4Xyk7XG4gICAgICBjb25zdCBibGFua0xpbmUyID0gbGluZUJyZWFrMiAmJlxuICAgICAgICAgIHR3by5tYXRjaCh0aGlzLmJsYW5rbGluZVN0YXJ0UmVnZXhfKTtcblxuICAgICAgaWYgKGJsYW5rTGluZTEgfHwgYmxhbmtMaW5lMikge1xuICAgICAgICAvLyBGaXZlIHBvaW50cyBmb3IgYmxhbmsgbGluZXMuXG4gICAgICAgIHJldHVybiA1O1xuICAgICAgfSBlbHNlIGlmIChsaW5lQnJlYWsxIHx8IGxpbmVCcmVhazIpIHtcbiAgICAgICAgLy8gRm91ciBwb2ludHMgZm9yIGxpbmUgYnJlYWtzLlxuICAgICAgICByZXR1cm4gNDtcbiAgICAgIH0gZWxzZSBpZiAobm9uQWxwaGFOdW1lcmljMSAmJiAhd2hpdGVzcGFjZTEgJiYgd2hpdGVzcGFjZTIpIHtcbiAgICAgICAgLy8gVGhyZWUgcG9pbnRzIGZvciBlbmQgb2Ygc2VudGVuY2VzLlxuICAgICAgICByZXR1cm4gMztcbiAgICAgIH0gZWxzZSBpZiAod2hpdGVzcGFjZTEgfHwgd2hpdGVzcGFjZTIpIHtcbiAgICAgICAgLy8gVHdvIHBvaW50cyBmb3Igd2hpdGVzcGFjZS5cbiAgICAgICAgcmV0dXJuIDI7XG4gICAgICB9IGVsc2UgaWYgKG5vbkFscGhhTnVtZXJpYzEgfHwgbm9uQWxwaGFOdW1lcmljMikge1xuICAgICAgICAvLyBPbmUgcG9pbnQgZm9yIG5vbi1hbHBoYW51bWVyaWMuXG4gICAgICAgIHJldHVybiAxO1xuICAgICAgfVxuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgbGV0IHBvaW50ZXIgPSAxO1xuICAgIC8vIEludGVudGlvbmFsbHkgaWdub3JlIHRoZSBmaXJzdCBhbmQgbGFzdCBlbGVtZW50IChkb24ndCBuZWVkIGNoZWNraW5nKS5cbiAgICB3aGlsZSAocG9pbnRlciA8IGRpZmZzLmxlbmd0aCAtIDEpIHtcbiAgICAgIGlmIChkaWZmc1twb2ludGVyIC0gMV1bMF0gPT0gRGlmZk9wLkVxdWFsICYmXG4gICAgICAgICAgZGlmZnNbcG9pbnRlciArIDFdWzBdID09IERpZmZPcC5FcXVhbCkge1xuICAgICAgICAvLyBUaGlzIGlzIGEgc2luZ2xlIGVkaXQgc3Vycm91bmRlZCBieSBlcXVhbGl0aWVzLlxuICAgICAgICBsZXQgZXF1YWxpdHkxID0gZGlmZnNbcG9pbnRlciAtIDFdWzFdO1xuICAgICAgICBsZXQgZWRpdCA9IGRpZmZzW3BvaW50ZXJdWzFdO1xuICAgICAgICBsZXQgZXF1YWxpdHkyID0gZGlmZnNbcG9pbnRlciArIDFdWzFdO1xuXG4gICAgICAgIC8vIEZpcnN0LCBzaGlmdCB0aGUgZWRpdCBhcyBmYXIgbGVmdCBhcyBwb3NzaWJsZS5cbiAgICAgICAgY29uc3QgY29tbW9uT2Zmc2V0ID0gdGhpcy5kaWZmX2NvbW1vblN1ZmZpeChlcXVhbGl0eTEsIGVkaXQpO1xuICAgICAgICBpZiAoY29tbW9uT2Zmc2V0KSB7XG4gICAgICAgICAgY29uc3QgY29tbW9uU3RyaW5nID0gZWRpdC5zdWJzdHJpbmcoZWRpdC5sZW5ndGggLSBjb21tb25PZmZzZXQpO1xuICAgICAgICAgIGVxdWFsaXR5MSA9IGVxdWFsaXR5MS5zdWJzdHJpbmcoMCwgZXF1YWxpdHkxLmxlbmd0aCAtIGNvbW1vbk9mZnNldCk7XG4gICAgICAgICAgZWRpdCA9IGNvbW1vblN0cmluZyArIGVkaXQuc3Vic3RyaW5nKDAsIGVkaXQubGVuZ3RoIC0gY29tbW9uT2Zmc2V0KTtcbiAgICAgICAgICBlcXVhbGl0eTIgPSBjb21tb25TdHJpbmcgKyBlcXVhbGl0eTI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZWNvbmQsIHN0ZXAgY2hhcmFjdGVyIGJ5IGNoYXJhY3RlciByaWdodCwgbG9va2luZyBmb3IgdGhlIGJlc3QgZml0LlxuICAgICAgICBsZXQgYmVzdEVxdWFsaXR5MSA9IGVxdWFsaXR5MTtcbiAgICAgICAgbGV0IGJlc3RFZGl0ID0gZWRpdDtcbiAgICAgICAgbGV0IGJlc3RFcXVhbGl0eTIgPSBlcXVhbGl0eTI7XG4gICAgICAgIGxldCBiZXN0U2NvcmUgPSBkaWZmX2NsZWFudXBTZW1hbnRpY1Njb3JlXyhlcXVhbGl0eTEsIGVkaXQpICtcbiAgICAgICAgICAgIGRpZmZfY2xlYW51cFNlbWFudGljU2NvcmVfKGVkaXQsIGVxdWFsaXR5Mik7XG4gICAgICAgIHdoaWxlIChlZGl0LmNoYXJBdCgwKSA9PT0gZXF1YWxpdHkyLmNoYXJBdCgwKSkge1xuICAgICAgICAgIGVxdWFsaXR5MSArPSBlZGl0LmNoYXJBdCgwKTtcbiAgICAgICAgICBlZGl0ID0gZWRpdC5zdWJzdHJpbmcoMSkgKyBlcXVhbGl0eTIuY2hhckF0KDApO1xuICAgICAgICAgIGVxdWFsaXR5MiA9IGVxdWFsaXR5Mi5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgY29uc3Qgc2NvcmUgPSBkaWZmX2NsZWFudXBTZW1hbnRpY1Njb3JlXyhlcXVhbGl0eTEsIGVkaXQpICtcbiAgICAgICAgICAgICAgZGlmZl9jbGVhbnVwU2VtYW50aWNTY29yZV8oZWRpdCwgZXF1YWxpdHkyKTtcbiAgICAgICAgICAvLyBUaGUgPj0gZW5jb3VyYWdlcyB0cmFpbGluZyByYXRoZXIgdGhhbiBsZWFkaW5nIHdoaXRlc3BhY2Ugb24gZWRpdHMuXG4gICAgICAgICAgaWYgKHNjb3JlID49IGJlc3RTY29yZSkge1xuICAgICAgICAgICAgYmVzdFNjb3JlID0gc2NvcmU7XG4gICAgICAgICAgICBiZXN0RXF1YWxpdHkxID0gZXF1YWxpdHkxO1xuICAgICAgICAgICAgYmVzdEVkaXQgPSBlZGl0O1xuICAgICAgICAgICAgYmVzdEVxdWFsaXR5MiA9IGVxdWFsaXR5MjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGlmZnNbcG9pbnRlciAtIDFdWzFdICE9IGJlc3RFcXVhbGl0eTEpIHtcbiAgICAgICAgICAvLyBXZSBoYXZlIGFuIGltcHJvdmVtZW50LCBzYXZlIGl0IGJhY2sgdG8gdGhlIGRpZmYuXG4gICAgICAgICAgaWYgKGJlc3RFcXVhbGl0eTEpIHtcbiAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgLSAxXVsxXSA9IGJlc3RFcXVhbGl0eTE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRpZmZzLnNwbGljZShwb2ludGVyIC0gMSwgMSk7XG4gICAgICAgICAgICBwb2ludGVyLS07XG4gICAgICAgICAgfVxuICAgICAgICAgIGRpZmZzW3BvaW50ZXJdWzFdID0gYmVzdEVkaXQ7XG4gICAgICAgICAgaWYgKGJlc3RFcXVhbGl0eTIpIHtcbiAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgKyAxXVsxXSA9IGJlc3RFcXVhbGl0eTI7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRpZmZzLnNwbGljZShwb2ludGVyICsgMSwgMSk7XG4gICAgICAgICAgICBwb2ludGVyLS07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwb2ludGVyKys7XG4gICAgfVxuICB9O1xuXG5cbiAgLyoqXG4gICAqIFJlZHVjZSB0aGUgbnVtYmVyIG9mIGVkaXRzIGJ5IGVsaW1pbmF0aW5nIG9wZXJhdGlvbmFsbHkgdHJpdmlhbCBlcXVhbGl0aWVzLlxuICAgKiBAcGFyYW0gIGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuICAgKi9cbiAgICBkaWZmX2NsZWFudXBFZmZpY2llbmN5IChkaWZmczogQXJyYXk8RGlmZj4pIHtcbiAgICBsZXQgY2hhbmdlcyA9IGZhbHNlO1xuICAgIGNvbnN0IGVxdWFsaXRpZXMgPSBbXTsgIC8vIFN0YWNrIG9mIGluZGljZXMgd2hlcmUgZXF1YWxpdGllcyBhcmUgZm91bmQuXG4gICAgbGV0IGVxdWFsaXRpZXNMZW5ndGggPSAwOyAgLy8gS2VlcGluZyBvdXIgb3duIGxlbmd0aCBjb25zdCBpcyBmYXN0ZXIgaW4gSlMuXG5cbiAgICBsZXQgbGFzdGVxdWFsaXR5ID0gbnVsbDtcbiAgICAvLyBBbHdheXMgZXF1YWwgdG8gZGlmZnNbZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoIC0gMV1dWzFdXG4gICAgbGV0IHBvaW50ZXIgPSAwOyAgLy8gSW5kZXggb2YgY3VycmVudCBwb3NpdGlvbi5cbiAgICAvLyBJcyB0aGVyZSBhbiBpbnNlcnRpb24gb3BlcmF0aW9uIGJlZm9yZSB0aGUgbGFzdCBlcXVhbGl0eS5cbiAgICBsZXQgcHJlX2lucyA9IGZhbHNlO1xuICAgIC8vIElzIHRoZXJlIGEgZGVsZXRpb24gb3BlcmF0aW9uIGJlZm9yZSB0aGUgbGFzdCBlcXVhbGl0eS5cbiAgICBsZXQgcHJlX2RlbCA9IGZhbHNlO1xuICAgIC8vIElzIHRoZXJlIGFuIGluc2VydGlvbiBvcGVyYXRpb24gYWZ0ZXIgdGhlIGxhc3QgZXF1YWxpdHkuXG4gICAgbGV0IHBvc3RfaW5zID0gZmFsc2U7XG4gICAgLy8gSXMgdGhlcmUgYSBkZWxldGlvbiBvcGVyYXRpb24gYWZ0ZXIgdGhlIGxhc3QgZXF1YWxpdHkuXG4gICAgbGV0IHBvc3RfZGVsID0gZmFsc2U7XG4gICAgd2hpbGUgKHBvaW50ZXIgPCBkaWZmcy5sZW5ndGgpIHtcbiAgICAgIGlmIChkaWZmc1twb2ludGVyXVswXSA9PSBEaWZmT3AuRXF1YWwpIHsgIC8vIEVxdWFsaXR5IGZvdW5kLlxuICAgICAgICBpZiAoZGlmZnNbcG9pbnRlcl1bMV0ubGVuZ3RoIDwgdGhpcy5EaWZmX0VkaXRDb3N0ICYmXG4gICAgICAgICAgICAocG9zdF9pbnMgfHwgcG9zdF9kZWwpKSB7XG4gICAgICAgICAgLy8gQ2FuZGlkYXRlIGZvdW5kLlxuICAgICAgICAgIGVxdWFsaXRpZXNbZXF1YWxpdGllc0xlbmd0aCsrXSA9IHBvaW50ZXI7XG4gICAgICAgICAgcHJlX2lucyA9IHBvc3RfaW5zO1xuICAgICAgICAgIHByZV9kZWwgPSBwb3N0X2RlbDtcbiAgICAgICAgICBsYXN0ZXF1YWxpdHkgPSBkaWZmc1twb2ludGVyXVsxXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBOb3QgYSBjYW5kaWRhdGUsIGFuZCBjYW4gbmV2ZXIgYmVjb21lIG9uZS5cbiAgICAgICAgICBlcXVhbGl0aWVzTGVuZ3RoID0gMDtcbiAgICAgICAgICBsYXN0ZXF1YWxpdHkgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHBvc3RfaW5zID0gcG9zdF9kZWwgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSB7ICAvLyBBbiBpbnNlcnRpb24gb3IgZGVsZXRpb24uXG4gICAgICAgIGlmIChkaWZmc1twb2ludGVyXVswXSA9PSBEaWZmT3AuRGVsZXRlKSB7XG4gICAgICAgICAgcG9zdF9kZWwgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBvc3RfaW5zID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICAvKlxuICAgICAgICAqIEZpdmUgdHlwZXMgdG8gYmUgc3BsaXQ6XG4gICAgICAgICogPGlucz5BPC9pbnM+PGRlbD5CPC9kZWw+WFk8aW5zPkM8L2lucz48ZGVsPkQ8L2RlbD5cbiAgICAgICAgKiA8aW5zPkE8L2lucz5YPGlucz5DPC9pbnM+PGRlbD5EPC9kZWw+XG4gICAgICAgICogPGlucz5BPC9pbnM+PGRlbD5CPC9kZWw+WDxpbnM+QzwvaW5zPlxuICAgICAgICAqIDxpbnM+QTwvZGVsPlg8aW5zPkM8L2lucz48ZGVsPkQ8L2RlbD5cbiAgICAgICAgKiA8aW5zPkE8L2lucz48ZGVsPkI8L2RlbD5YPGRlbD5DPC9kZWw+XG4gICAgICAgICovXG4gICAgICAgIGlmIChsYXN0ZXF1YWxpdHkgJiYgKChwcmVfaW5zICYmIHByZV9kZWwgJiYgcG9zdF9pbnMgJiYgcG9zdF9kZWwpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKChsYXN0ZXF1YWxpdHkubGVuZ3RoIDwgdGhpcy5EaWZmX0VkaXRDb3N0IC8gMikgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKHByZV9pbnM/MTowKSArIChwcmVfZGVsPzE6MCkgKyAocG9zdF9pbnM/MTowKSArIChwb3N0X2RlbD8xOjApID09IDMpKSkpIHtcbiAgICAgICAgICAvLyBEdXBsaWNhdGUgcmVjb3JkLlxuICAgICAgICAgIGRpZmZzLnNwbGljZShlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGggLSAxXSwgMCxcbiAgICAgICAgICAgICAgICAgICAgICBbRGlmZk9wLkRlbGV0ZSwgbGFzdGVxdWFsaXR5XSk7XG4gICAgICAgICAgLy8gQ2hhbmdlIHNlY29uZCBjb3B5IHRvIGluc2VydC5cbiAgICAgICAgICBkaWZmc1tlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGggLSAxXSArIDFdWzBdID0gRGlmZk9wLkluc2VydDtcbiAgICAgICAgICBlcXVhbGl0aWVzTGVuZ3RoLS07ICAvLyBUaHJvdyBhd2F5IHRoZSBlcXVhbGl0eSB3ZSBqdXN0IGRlbGV0ZWQ7XG4gICAgICAgICAgbGFzdGVxdWFsaXR5ID0gbnVsbDtcbiAgICAgICAgICBpZiAocHJlX2lucyAmJiBwcmVfZGVsKSB7XG4gICAgICAgICAgICAvLyBObyBjaGFuZ2VzIG1hZGUgd2hpY2ggY291bGQgYWZmZWN0IHByZXZpb3VzIGVudHJ5LCBrZWVwIGdvaW5nLlxuICAgICAgICAgICAgcG9zdF9pbnMgPSBwb3N0X2RlbCA9IHRydWU7XG4gICAgICAgICAgICBlcXVhbGl0aWVzTGVuZ3RoID0gMDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXF1YWxpdGllc0xlbmd0aC0tOyAgLy8gVGhyb3cgYXdheSB0aGUgcHJldmlvdXMgZXF1YWxpdHkuXG4gICAgICAgICAgICBwb2ludGVyID0gZXF1YWxpdGllc0xlbmd0aCA+IDAgP1xuICAgICAgICAgICAgICAgIGVxdWFsaXRpZXNbZXF1YWxpdGllc0xlbmd0aCAtIDFdIDogLTE7XG4gICAgICAgICAgICBwb3N0X2lucyA9IHBvc3RfZGVsID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNoYW5nZXMgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwb2ludGVyKys7XG4gICAgfVxuXG4gICAgaWYgKGNoYW5nZXMpIHtcbiAgICAgIHRoaXMuZGlmZl9jbGVhbnVwTWVyZ2UoZGlmZnMpO1xuICAgIH1cbiAgfTtcblxuXG4gIC8qKlxuICAgKiBSZW9yZGVyIGFuZCBtZXJnZSBsaWtlIGVkaXQgc2VjdGlvbnMuICBNZXJnZSBlcXVhbGl0aWVzLlxuICAgKiBBbnkgZWRpdCBzZWN0aW9uIGNhbiBtb3ZlIGFzIGxvbmcgYXMgaXQgZG9lc24ndCBjcm9zcyBhbiBlcXVhbGl0eS5cbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cbiAgICovXG4gICAgZGlmZl9jbGVhbnVwTWVyZ2UgKGRpZmZzOiBBcnJheTxEaWZmPikge1xuICAgIGRpZmZzLnB1c2goW0RpZmZPcC5FcXVhbCwgJyddKTsgIC8vIEFkZCBhIGR1bW15IGVudHJ5IGF0IHRoZSBlbmQuXG4gICAgbGV0IHBvaW50ZXIgPSAwO1xuICAgIGxldCBjb3VudF9kZWxldGUgPSAwO1xuICAgIGxldCBjb3VudF9pbnNlcnQgPSAwO1xuICAgIGxldCB0ZXh0X2RlbGV0ZSA9ICcnO1xuICAgIGxldCB0ZXh0X2luc2VydCA9ICcnO1xuICAgIGxldCBjb21tb25sZW5ndGg7XG4gICAgd2hpbGUgKHBvaW50ZXIgPCBkaWZmcy5sZW5ndGgpIHtcbiAgICAgIHN3aXRjaCAoZGlmZnNbcG9pbnRlcl1bMF0pIHtcbiAgICAgICAgY2FzZSBEaWZmT3AuSW5zZXJ0OlxuICAgICAgICAgIGNvdW50X2luc2VydCsrO1xuICAgICAgICAgIHRleHRfaW5zZXJ0ICs9IGRpZmZzW3BvaW50ZXJdWzFdO1xuICAgICAgICAgIHBvaW50ZXIrKztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBEaWZmT3AuRGVsZXRlOlxuICAgICAgICAgIGNvdW50X2RlbGV0ZSsrO1xuICAgICAgICAgIHRleHRfZGVsZXRlICs9IGRpZmZzW3BvaW50ZXJdWzFdO1xuICAgICAgICAgIHBvaW50ZXIrKztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBEaWZmT3AuRXF1YWw6XG4gICAgICAgICAgLy8gVXBvbiByZWFjaGluZyBhbiBlcXVhbGl0eSwgY2hlY2sgZm9yIHByaW9yIHJlZHVuZGFuY2llcy5cbiAgICAgICAgICBpZiAoY291bnRfZGVsZXRlICsgY291bnRfaW5zZXJ0ID4gMSkge1xuICAgICAgICAgICAgaWYgKGNvdW50X2RlbGV0ZSAhPT0gMCAmJiBjb3VudF9pbnNlcnQgIT09IDApIHtcbiAgICAgICAgICAgICAgLy8gRmFjdG9yIG91dCBhbnkgY29tbW9uIHByZWZpeGllcy5cbiAgICAgICAgICAgICAgY29tbW9ubGVuZ3RoID0gdGhpcy5kaWZmX2NvbW1vblByZWZpeCh0ZXh0X2luc2VydCwgdGV4dF9kZWxldGUpO1xuICAgICAgICAgICAgICBpZiAoY29tbW9ubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKChwb2ludGVyIC0gY291bnRfZGVsZXRlIC0gY291bnRfaW5zZXJ0KSA+IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgZGlmZnNbcG9pbnRlciAtIGNvdW50X2RlbGV0ZSAtIGNvdW50X2luc2VydCAtIDFdWzBdID09XG4gICAgICAgICAgICAgICAgICAgIERpZmZPcC5FcXVhbCkge1xuICAgICAgICAgICAgICAgICAgZGlmZnNbcG9pbnRlciAtIGNvdW50X2RlbGV0ZSAtIGNvdW50X2luc2VydCAtIDFdWzFdICs9XG4gICAgICAgICAgICAgICAgICAgICAgdGV4dF9pbnNlcnQuc3Vic3RyaW5nKDAsIGNvbW1vbmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGRpZmZzLnNwbGljZSgwLCAwLCBbRGlmZk9wLkVxdWFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0X2luc2VydC5zdWJzdHJpbmcoMCwgY29tbW9ubGVuZ3RoKV0pO1xuICAgICAgICAgICAgICAgICAgcG9pbnRlcisrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0ZXh0X2luc2VydCA9IHRleHRfaW5zZXJ0LnN1YnN0cmluZyhjb21tb25sZW5ndGgpO1xuICAgICAgICAgICAgICAgIHRleHRfZGVsZXRlID0gdGV4dF9kZWxldGUuc3Vic3RyaW5nKGNvbW1vbmxlbmd0aCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgLy8gRmFjdG9yIG91dCBhbnkgY29tbW9uIHN1ZmZpeGllcy5cbiAgICAgICAgICAgICAgY29tbW9ubGVuZ3RoID0gdGhpcy5kaWZmX2NvbW1vblN1ZmZpeCh0ZXh0X2luc2VydCwgdGV4dF9kZWxldGUpO1xuICAgICAgICAgICAgICBpZiAoY29tbW9ubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgZGlmZnNbcG9pbnRlcl1bMV0gPSB0ZXh0X2luc2VydC5zdWJzdHJpbmcodGV4dF9pbnNlcnQubGVuZ3RoIC1cbiAgICAgICAgICAgICAgICAgICAgY29tbW9ubGVuZ3RoKSArIGRpZmZzW3BvaW50ZXJdWzFdO1xuICAgICAgICAgICAgICAgIHRleHRfaW5zZXJ0ID0gdGV4dF9pbnNlcnQuc3Vic3RyaW5nKDAsIHRleHRfaW5zZXJ0Lmxlbmd0aCAtXG4gICAgICAgICAgICAgICAgICAgIGNvbW1vbmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgdGV4dF9kZWxldGUgPSB0ZXh0X2RlbGV0ZS5zdWJzdHJpbmcoMCwgdGV4dF9kZWxldGUubGVuZ3RoIC1cbiAgICAgICAgICAgICAgICAgICAgY29tbW9ubGVuZ3RoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRGVsZXRlIHRoZSBvZmZlbmRpbmcgcmVjb3JkcyBhbmQgYWRkIHRoZSBtZXJnZWQgb25lcy5cbiAgICAgICAgICAgIGlmIChjb3VudF9kZWxldGUgPT09IDApIHtcbiAgICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIgLSBjb3VudF9pbnNlcnQsXG4gICAgICAgICAgICAgICAgICBjb3VudF9kZWxldGUgKyBjb3VudF9pbnNlcnQsIFtEaWZmT3AuSW5zZXJ0LCB0ZXh0X2luc2VydF0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjb3VudF9pbnNlcnQgPT09IDApIHtcbiAgICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIgLSBjb3VudF9kZWxldGUsXG4gICAgICAgICAgICAgICAgICBjb3VudF9kZWxldGUgKyBjb3VudF9pbnNlcnQsIFtEaWZmT3AuRGVsZXRlLCB0ZXh0X2RlbGV0ZV0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIgLSBjb3VudF9kZWxldGUgLSBjb3VudF9pbnNlcnQsXG4gICAgICAgICAgICAgICAgICBjb3VudF9kZWxldGUgKyBjb3VudF9pbnNlcnQsIFtEaWZmT3AuRGVsZXRlLCB0ZXh0X2RlbGV0ZV0sXG4gICAgICAgICAgICAgICAgICBbRGlmZk9wLkluc2VydCwgdGV4dF9pbnNlcnRdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBvaW50ZXIgPSBwb2ludGVyIC0gY291bnRfZGVsZXRlIC0gY291bnRfaW5zZXJ0ICtcbiAgICAgICAgICAgICAgICAgICAgICAoY291bnRfZGVsZXRlID8gMSA6IDApICsgKGNvdW50X2luc2VydCA/IDEgOiAwKSArIDE7XG4gICAgICAgICAgfSBlbHNlIGlmIChwb2ludGVyICE9PSAwICYmIGRpZmZzW3BvaW50ZXIgLSAxXVswXSA9PSBEaWZmT3AuRXF1YWwpIHtcbiAgICAgICAgICAgIC8vIE1lcmdlIHRoaXMgZXF1YWxpdHkgd2l0aCB0aGUgcHJldmlvdXMgb25lLlxuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciAtIDFdWzFdICs9IGRpZmZzW3BvaW50ZXJdWzFdO1xuICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIsIDEpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwb2ludGVyKys7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvdW50X2luc2VydCA9IDA7XG4gICAgICAgICAgY291bnRfZGVsZXRlID0gMDtcbiAgICAgICAgICB0ZXh0X2RlbGV0ZSA9ICcnO1xuICAgICAgICAgIHRleHRfaW5zZXJ0ID0gJyc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChkaWZmc1tkaWZmcy5sZW5ndGggLSAxXVsxXSA9PT0gJycpIHtcbiAgICAgIGRpZmZzLnBvcCgpOyAgLy8gUmVtb3ZlIHRoZSBkdW1teSBlbnRyeSBhdCB0aGUgZW5kLlxuICAgIH1cblxuICAgIC8vIFNlY29uZCBwYXNzOiBsb29rIGZvciBzaW5nbGUgZWRpdHMgc3Vycm91bmRlZCBvbiBib3RoIHNpZGVzIGJ5IGVxdWFsaXRpZXNcbiAgICAvLyB3aGljaCBjYW4gYmUgc2hpZnRlZCBzaWRld2F5cyB0byBlbGltaW5hdGUgYW4gZXF1YWxpdHkuXG4gICAgLy8gZS5nOiBBPGlucz5CQTwvaW5zPkMgLT4gPGlucz5BQjwvaW5zPkFDXG4gICAgbGV0IGNoYW5nZXMgPSBmYWxzZTtcbiAgICBwb2ludGVyID0gMTtcbiAgICAvLyBJbnRlbnRpb25hbGx5IGlnbm9yZSB0aGUgZmlyc3QgYW5kIGxhc3QgZWxlbWVudCAoZG9uJ3QgbmVlZCBjaGVja2luZykuXG4gICAgd2hpbGUgKHBvaW50ZXIgPCBkaWZmcy5sZW5ndGggLSAxKSB7XG4gICAgICBpZiAoZGlmZnNbcG9pbnRlciAtIDFdWzBdID09IERpZmZPcC5FcXVhbCAmJlxuICAgICAgICAgIGRpZmZzW3BvaW50ZXIgKyAxXVswXSA9PSBEaWZmT3AuRXF1YWwpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIHNpbmdsZSBlZGl0IHN1cnJvdW5kZWQgYnkgZXF1YWxpdGllcy5cbiAgICAgICAgaWYgKGRpZmZzW3BvaW50ZXJdWzFdLnN1YnN0cmluZyhkaWZmc1twb2ludGVyXVsxXS5sZW5ndGggLVxuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciAtIDFdWzFdLmxlbmd0aCkgPT0gZGlmZnNbcG9pbnRlciAtIDFdWzFdKSB7XG4gICAgICAgICAgLy8gU2hpZnQgdGhlIGVkaXQgb3ZlciB0aGUgcHJldmlvdXMgZXF1YWxpdHkuXG4gICAgICAgICAgZGlmZnNbcG9pbnRlcl1bMV0gPSBkaWZmc1twb2ludGVyIC0gMV1bMV0gK1xuICAgICAgICAgICAgICBkaWZmc1twb2ludGVyXVsxXS5zdWJzdHJpbmcoMCwgZGlmZnNbcG9pbnRlcl1bMV0ubGVuZ3RoIC1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgLSAxXVsxXS5sZW5ndGgpO1xuICAgICAgICAgIGRpZmZzW3BvaW50ZXIgKyAxXVsxXSA9IGRpZmZzW3BvaW50ZXIgLSAxXVsxXSArIGRpZmZzW3BvaW50ZXIgKyAxXVsxXTtcbiAgICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciAtIDEsIDEpO1xuICAgICAgICAgIGNoYW5nZXMgPSB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKGRpZmZzW3BvaW50ZXJdWzFdLnN1YnN0cmluZygwLCBkaWZmc1twb2ludGVyICsgMV1bMV0ubGVuZ3RoKSA9PVxuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciArIDFdWzFdKSB7XG4gICAgICAgICAgLy8gU2hpZnQgdGhlIGVkaXQgb3ZlciB0aGUgbmV4dCBlcXVhbGl0eS5cbiAgICAgICAgICBkaWZmc1twb2ludGVyIC0gMV1bMV0gKz0gZGlmZnNbcG9pbnRlciArIDFdWzFdO1xuICAgICAgICAgIGRpZmZzW3BvaW50ZXJdWzFdID1cbiAgICAgICAgICAgICAgZGlmZnNbcG9pbnRlcl1bMV0uc3Vic3RyaW5nKGRpZmZzW3BvaW50ZXIgKyAxXVsxXS5sZW5ndGgpICtcbiAgICAgICAgICAgICAgZGlmZnNbcG9pbnRlciArIDFdWzFdO1xuICAgICAgICAgIGRpZmZzLnNwbGljZShwb2ludGVyICsgMSwgMSk7XG4gICAgICAgICAgY2hhbmdlcyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHBvaW50ZXIrKztcbiAgICB9XG4gICAgLy8gSWYgc2hpZnRzIHdlcmUgbWFkZSwgdGhlIGRpZmYgbmVlZHMgcmVvcmRlcmluZyBhbmQgYW5vdGhlciBzaGlmdCBzd2VlcC5cbiAgICBpZiAoY2hhbmdlcykge1xuICAgICAgdGhpcy5kaWZmX2NsZWFudXBNZXJnZShkaWZmcyk7XG4gICAgfVxuICB9O1xuXG5cbiAgLyoqXG4gICAqIGxvYyBpcyBhIGxvY2F0aW9uIGluIHRleHQxLCBjb21wdXRlIGFuZCByZXR1cm4gdGhlIGVxdWl2YWxlbnQgbG9jYXRpb24gaW5cbiAgICogdGV4dDIuXG4gICAqIGUuZy4gJ1RoZSBjYXQnIHZzICdUaGUgYmlnIGNhdCcsIDEtPjEsIDUtPjhcbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cbiAgICogQHBhcmFtICBsb2MgTG9jYXRpb24gd2l0aGluIHRleHQxLlxuICAgKiBAcmV0dXJuICBMb2NhdGlvbiB3aXRoaW4gdGV4dDIuXG4gICAqL1xuICAgIGRpZmZfeEluZGV4IChkaWZmczogQXJyYXk8RGlmZj4sIGxvYzogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBsZXQgY2hhcnMxID0gMDtcbiAgICBsZXQgY2hhcnMyID0gMDtcbiAgICBsZXQgbGFzdF9jaGFyczEgPSAwO1xuICAgIGxldCBsYXN0X2NoYXJzMiA9IDA7XG4gICAgbGV0IHg7XG4gICAgZm9yICh4ID0gMDsgeCA8IGRpZmZzLmxlbmd0aDsgeCsrKSB7XG4gICAgICBpZiAoZGlmZnNbeF1bMF0gIT09IERpZmZPcC5JbnNlcnQpIHsgIC8vIEVxdWFsaXR5IG9yIGRlbGV0aW9uLlxuICAgICAgICBjaGFyczEgKz0gZGlmZnNbeF1bMV0ubGVuZ3RoO1xuICAgICAgfVxuICAgICAgaWYgKGRpZmZzW3hdWzBdICE9PSBEaWZmT3AuRGVsZXRlKSB7ICAvLyBFcXVhbGl0eSBvciBpbnNlcnRpb24uXG4gICAgICAgIGNoYXJzMiArPSBkaWZmc1t4XVsxXS5sZW5ndGg7XG4gICAgICB9XG4gICAgICBpZiAoY2hhcnMxID4gbG9jKSB7ICAvLyBPdmVyc2hvdCB0aGUgbG9jYXRpb24uXG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgbGFzdF9jaGFyczEgPSBjaGFyczE7XG4gICAgICBsYXN0X2NoYXJzMiA9IGNoYXJzMjtcbiAgICB9XG4gICAgLy8gV2FzIHRoZSBsb2NhdGlvbiB3YXMgZGVsZXRlZD9cbiAgICBpZiAoZGlmZnMubGVuZ3RoICE9IHggJiYgZGlmZnNbeF1bMF0gPT09IERpZmZPcC5EZWxldGUpIHtcbiAgICAgIHJldHVybiBsYXN0X2NoYXJzMjtcbiAgICB9XG4gICAgLy8gQWRkIHRoZSByZW1haW5pbmcgY2hhcmFjdGVyIGxlbmd0aC5cbiAgICByZXR1cm4gbGFzdF9jaGFyczIgKyAobG9jIC0gbGFzdF9jaGFyczEpO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIENvbnZlcnQgYSBkaWZmIGFycmF5IGludG8gYSBwcmV0dHkgSFRNTCByZXBvcnQuXG4gICAqIEBwYXJhbSAgZGlmZnMgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXG4gICAqIEByZXR1cm4gIEhUTUwgcmVwcmVzZW50YXRpb24uXG4gICAqL1xuICAgIGRpZmZfcHJldHR5SHRtbCA9IGZ1bmN0aW9uKGRpZmZzOiBBcnJheTxEaWZmPik6IHN0cmluZyB7XG4gICAgY29uc3QgaHRtbCA9IFtdO1xuICAgIGNvbnN0IHBhdHRlcm5fYW1wID0gLyYvZztcbiAgICBjb25zdCBwYXR0ZXJuX2x0ID0gLzwvZztcbiAgICBjb25zdCBwYXR0ZXJuX2d0ID0gLz4vZztcbiAgICBjb25zdCBwYXR0ZXJuX3BhcmEgPSAvXFxuL2c7XG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBkaWZmcy5sZW5ndGg7IHgrKykge1xuICAgICAgY29uc3Qgb3AgPSBkaWZmc1t4XVswXTsgICAgLy8gT3BlcmF0aW9uIChpbnNlcnQsIGRlbGV0ZSwgZXF1YWwpXG4gICAgICBjb25zdCBkYXRhID0gZGlmZnNbeF1bMV07ICAvLyBUZXh0IG9mIGNoYW5nZS5cbiAgICAgIGNvbnN0IHRleHQgPSBkYXRhLnJlcGxhY2UocGF0dGVybl9hbXAsICcmYW1wOycpLnJlcGxhY2UocGF0dGVybl9sdCwgJyZsdDsnKVxuICAgICAgICAgIC5yZXBsYWNlKHBhdHRlcm5fZ3QsICcmZ3Q7JykucmVwbGFjZShwYXR0ZXJuX3BhcmEsICcmcGFyYTs8YnI+Jyk7XG4gICAgICBzd2l0Y2ggKG9wKSB7XG4gICAgICAgIGNhc2UgRGlmZk9wLkluc2VydDpcbiAgICAgICAgICBodG1sW3hdID0gJzxpbnMgc3R5bGU9XCJiYWNrZ3JvdW5kOiNlNmZmZTY7XCI+JyArIHRleHQgKyAnPC9pbnM+JztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBEaWZmT3AuRGVsZXRlOlxuICAgICAgICAgIGh0bWxbeF0gPSAnPGRlbCBzdHlsZT1cImJhY2tncm91bmQ6I2ZmZTZlNjtcIj4nICsgdGV4dCArICc8L2RlbD4nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIERpZmZPcC5FcXVhbDpcbiAgICAgICAgICBodG1sW3hdID0gJzxzcGFuPicgKyB0ZXh0ICsgJzwvc3Bhbj4nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaHRtbC5qb2luKCcnKTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBDb21wdXRlIGFuZCByZXR1cm4gdGhlIHNvdXJjZSB0ZXh0IChhbGwgZXF1YWxpdGllcyBhbmQgZGVsZXRpb25zKS5cbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cbiAgICogQHJldHVybiAgU291cmNlIHRleHQuXG4gICAqL1xuICAgIGRpZmZfdGV4dDEgKGRpZmZzOiBBcnJheTxEaWZmPik6IHN0cmluZyB7XG4gICAgY29uc3QgdGV4dCA9IFtdO1xuICAgIGZvciAobGV0IHggPSAwOyB4IDwgZGlmZnMubGVuZ3RoOyB4KyspIHtcbiAgICAgIGlmIChkaWZmc1t4XVswXSAhPT0gRGlmZk9wLkluc2VydCkge1xuICAgICAgICB0ZXh0W3hdID0gZGlmZnNbeF1bMV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0ZXh0LmpvaW4oJycpO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIENvbXB1dGUgYW5kIHJldHVybiB0aGUgZGVzdGluYXRpb24gdGV4dCAoYWxsIGVxdWFsaXRpZXMgYW5kIGluc2VydGlvbnMpLlxuICAgKiBAcGFyYW0gIGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuICAgKiBAcmV0dXJuICBEZXN0aW5hdGlvbiB0ZXh0LlxuICAgKi9cbiAgICBkaWZmX3RleHQyIChkaWZmczogQXJyYXk8RGlmZj4pOiBzdHJpbmcge1xuICAgIGNvbnN0IHRleHQgPSBbXTtcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGRpZmZzLmxlbmd0aDsgeCsrKSB7XG4gICAgICBpZiAoZGlmZnNbeF1bMF0gIT09IERpZmZPcC5EZWxldGUpIHtcbiAgICAgICAgdGV4dFt4XSA9IGRpZmZzW3hdWzFdO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGV4dC5qb2luKCcnKTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBDb21wdXRlIHRoZSBMZXZlbnNodGVpbiBkaXN0YW5jZTsgdGhlIG51bWJlciBvZiBpbnNlcnRlZCwgZGVsZXRlZCBvclxuICAgKiBzdWJzdGl0dXRlZCBjaGFyYWN0ZXJzLlxuICAgKiBAcGFyYW0gIGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuICAgKiBAcmV0dXJuICBOdW1iZXIgb2YgY2hhbmdlcy5cbiAgICovXG4gICAgZGlmZl9sZXZlbnNodGVpbiAoZGlmZnM6IEFycmF5PERpZmY+KTogbnVtYmVyIHtcbiAgICBsZXQgbGV2ZW5zaHRlaW4gPSAwO1xuICAgIGxldCBpbnNlcnRpb25zID0gMDtcbiAgICBsZXQgZGVsZXRpb25zID0gMDtcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGRpZmZzLmxlbmd0aDsgeCsrKSB7XG4gICAgICBjb25zdCBvcCA9IGRpZmZzW3hdWzBdO1xuICAgICAgY29uc3QgZGF0YSA9IGRpZmZzW3hdWzFdO1xuICAgICAgc3dpdGNoIChvcCkge1xuICAgICAgICBjYXNlIERpZmZPcC5JbnNlcnQ6XG4gICAgICAgICAgaW5zZXJ0aW9ucyArPSBkYXRhLmxlbmd0aDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBEaWZmT3AuRGVsZXRlOlxuICAgICAgICAgIGRlbGV0aW9ucyArPSBkYXRhLmxlbmd0aDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBEaWZmT3AuRXF1YWw6XG4gICAgICAgICAgLy8gQSBkZWxldGlvbiBhbmQgYW4gaW5zZXJ0aW9uIGlzIG9uZSBzdWJzdGl0dXRpb24uXG4gICAgICAgICAgbGV2ZW5zaHRlaW4gKz0gTWF0aC5tYXgoaW5zZXJ0aW9ucywgZGVsZXRpb25zKTtcbiAgICAgICAgICBpbnNlcnRpb25zID0gMDtcbiAgICAgICAgICBkZWxldGlvbnMgPSAwO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBsZXZlbnNodGVpbiArPSBNYXRoLm1heChpbnNlcnRpb25zLCBkZWxldGlvbnMpO1xuICAgIHJldHVybiBsZXZlbnNodGVpbjtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBDcnVzaCB0aGUgZGlmZiBpbnRvIGFuIGVuY29kZWQgc3RyaW5nIHdoaWNoIGRlc2NyaWJlcyB0aGUgb3BlcmF0aW9uc1xuICAgKiByZXF1aXJlZCB0byB0cmFuc2Zvcm0gdGV4dDEgaW50byB0ZXh0Mi5cbiAgICogRS5nLiA9M1xcdC0yXFx0K2luZyAgLT4gS2VlcCAzIGNoYXJzLCBkZWxldGUgMiBjaGFycywgaW5zZXJ0ICdpbmcnLlxuICAgKiBPcGVyYXRpb25zIGFyZSB0YWItc2VwYXJhdGVkLiAgSW5zZXJ0ZWQgdGV4dCBpcyBlc2NhcGVkIHVzaW5nICV4eCBub3RhdGlvbi5cbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cbiAgICogQHJldHVybiAgRGVsdGEgdGV4dC5cbiAgICovXG4gICAgZGlmZl90b0RlbHRhIChkaWZmczogQXJyYXk8RGlmZj4pOiBzdHJpbmcge1xuICAgIGNvbnN0IHRleHQgPSBbXTtcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGRpZmZzLmxlbmd0aDsgeCsrKSB7XG4gICAgICBzd2l0Y2ggKGRpZmZzW3hdWzBdKSB7XG4gICAgICAgIGNhc2UgRGlmZk9wLkluc2VydDpcbiAgICAgICAgICB0ZXh0W3hdID0gJysnICsgZW5jb2RlVVJJKGRpZmZzW3hdWzFdKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBEaWZmT3AuRGVsZXRlOlxuICAgICAgICAgIHRleHRbeF0gPSAnLScgKyBkaWZmc1t4XVsxXS5sZW5ndGg7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgRGlmZk9wLkVxdWFsOlxuICAgICAgICAgIHRleHRbeF0gPSAnPScgKyBkaWZmc1t4XVsxXS5sZW5ndGg7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0ZXh0LmpvaW4oJ1xcdCcpLnJlcGxhY2UoLyUyMC9nLCAnICcpO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIEdpdmVuIHRoZSBvcmlnaW5hbCB0ZXh0MSwgYW5kIGFuIGVuY29kZWQgc3RyaW5nIHdoaWNoIGRlc2NyaWJlcyB0aGVcbiAgICogb3BlcmF0aW9ucyByZXF1aXJlZCB0byB0cmFuc2Zvcm0gdGV4dDEgaW50byB0ZXh0MiwgY29tcHV0ZSB0aGUgZnVsbCBkaWZmLlxuICAgKiBAcGFyYW0gIHRleHQxIFNvdXJjZSBzdHJpbmcgZm9yIHRoZSBkaWZmLlxuICAgKiBAcGFyYW0gIGRlbHRhIERlbHRhIHRleHQuXG4gICAqIEByZXR1cm4gIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuICAgKiBAdGhyb3dzIHshRXJyb3J9IElmIGludmFsaWQgaW5wdXQuXG4gICAqL1xuICAgIGRpZmZfZnJvbURlbHRhICh0ZXh0MTogc3RyaW5nLCBkZWx0YTogc3RyaW5nKSB7XG4gICAgY29uc3QgZGlmZnMgPSBbXTtcbiAgICBsZXQgZGlmZnNMZW5ndGggPSAwOyAgLy8gS2VlcGluZyBvdXIgb3duIGxlbmd0aCBjb25zdCBpcyBmYXN0ZXIgaW4gSlMuXG4gICAgbGV0IHBvaW50ZXIgPSAwOyAgLy8gQ3Vyc29yIGluIHRleHQxXG4gICAgY29uc3QgdG9rZW5zID0gZGVsdGEuc3BsaXQoL1xcdC9nKTtcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHRva2Vucy5sZW5ndGg7IHgrKykge1xuICAgICAgLy8gRWFjaCB0b2tlbiBiZWdpbnMgd2l0aCBhIG9uZSBjaGFyYWN0ZXIgcGFyYW1ldGVyIHdoaWNoIHNwZWNpZmllcyB0aGVcbiAgICAgIC8vIG9wZXJhdGlvbiBvZiB0aGlzIHRva2VuIChkZWxldGUsIGluc2VydCwgZXF1YWxpdHkpLlxuICAgICAgY29uc3QgcGFyYW0gPSB0b2tlbnNbeF0uc3Vic3RyaW5nKDEpO1xuICAgICAgc3dpdGNoICh0b2tlbnNbeF0uY2hhckF0KDApKSB7XG4gICAgICAgIGNhc2UgJysnOlxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBkaWZmc1tkaWZmc0xlbmd0aCsrXSA9IFtEaWZmT3AuSW5zZXJ0LCBkZWNvZGVVUkkocGFyYW0pXTtcbiAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgLy8gTWFsZm9ybWVkIFVSSSBzZXF1ZW5jZS5cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSWxsZWdhbCBlc2NhcGUgaW4gZGlmZl9mcm9tRGVsdGE6ICcgKyBwYXJhbSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICctJzpcbiAgICAgICAgICAvLyBGYWxsIHRocm91Z2guXG4gICAgICAgIGNhc2UgJz0nOlxuICAgICAgICAgIGNvbnN0IG4gPSBwYXJzZUludChwYXJhbSwgMTApO1xuICAgICAgICAgIGlmIChpc05hTihuKSB8fCBuIDwgMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIG51bWJlciBpbiBkaWZmX2Zyb21EZWx0YTogJyArIHBhcmFtKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgdGV4dCA9IHRleHQxLnN1YnN0cmluZyhwb2ludGVyLCBwb2ludGVyICs9IG4pO1xuICAgICAgICAgIGlmICh0b2tlbnNbeF0uY2hhckF0KDApID09ICc9Jykge1xuICAgICAgICAgICAgZGlmZnNbZGlmZnNMZW5ndGgrK10gPSBbRGlmZk9wLkVxdWFsLCB0ZXh0XTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGlmZnNbZGlmZnNMZW5ndGgrK10gPSBbRGlmZk9wLkRlbGV0ZSwgdGV4dF07XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIC8vIEJsYW5rIHRva2VucyBhcmUgb2sgKGZyb20gYSB0cmFpbGluZyBcXHQpLlxuICAgICAgICAgIC8vIEFueXRoaW5nIGVsc2UgaXMgYW4gZXJyb3IuXG4gICAgICAgICAgaWYgKHRva2Vuc1t4XSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGRpZmYgb3BlcmF0aW9uIGluIGRpZmZfZnJvbURlbHRhOiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnNbeF0pO1xuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHBvaW50ZXIgIT0gdGV4dDEubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RlbHRhIGxlbmd0aCAoJyArIHBvaW50ZXIgK1xuICAgICAgICAgICcpIGRvZXMgbm90IGVxdWFsIHNvdXJjZSB0ZXh0IGxlbmd0aCAoJyArIHRleHQxLmxlbmd0aCArICcpLicpO1xuICAgIH1cbiAgICByZXR1cm4gZGlmZnM7XG4gIH07XG5cbiAgLyoqXG4gICAqIExvY2F0ZSB0aGUgYmVzdCBpbnN0YW5jZSBvZiAncGF0dGVybicgaW4gJ3RleHQnIG5lYXIgJ2xvYycuXG4gICAqIEBwYXJhbSAgdGV4dCBUaGUgdGV4dCB0byBzZWFyY2guXG4gICAqIEBwYXJhbSAgcGF0dGVybiBUaGUgcGF0dGVybiB0byBzZWFyY2ggZm9yLlxuICAgKiBAcGFyYW0gIGxvYyBUaGUgbG9jYXRpb24gdG8gc2VhcmNoIGFyb3VuZC5cbiAgICogQHJldHVybiAgQmVzdCBtYXRjaCBpbmRleCBvciAtMS5cbiAgICovXG4gICAgbWF0Y2hfbWFpbiAodGV4dDogc3RyaW5nLCBwYXR0ZXJuOiBzdHJpbmcsIGxvYzogbnVtYmVyKTogbnVtYmVyIHtcbiAgICAvLyBDaGVjayBmb3IgbnVsbCBpbnB1dHMuXG4gICAgaWYgKHRleHQgPT0gbnVsbCB8fCBwYXR0ZXJuID09IG51bGwgfHwgbG9jID09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTnVsbCBpbnB1dC4gKG1hdGNoX21haW4pJyk7XG4gICAgfVxuXG4gICAgbG9jID0gTWF0aC5tYXgoMCwgTWF0aC5taW4obG9jLCB0ZXh0Lmxlbmd0aCkpO1xuICAgIGlmICh0ZXh0ID09IHBhdHRlcm4pIHtcbiAgICAgIC8vIFNob3J0Y3V0IChwb3RlbnRpYWxseSBub3QgZ3VhcmFudGVlZCBieSB0aGUgYWxnb3JpdGhtKVxuICAgICAgcmV0dXJuIDA7XG4gICAgfSBlbHNlIGlmICghdGV4dC5sZW5ndGgpIHtcbiAgICAgIC8vIE5vdGhpbmcgdG8gbWF0Y2guXG4gICAgICByZXR1cm4gLTE7XG4gICAgfSBlbHNlIGlmICh0ZXh0LnN1YnN0cmluZyhsb2MsIGxvYyArIHBhdHRlcm4ubGVuZ3RoKSA9PSBwYXR0ZXJuKSB7XG4gICAgICAvLyBQZXJmZWN0IG1hdGNoIGF0IHRoZSBwZXJmZWN0IHNwb3QhICAoSW5jbHVkZXMgY2FzZSBvZiBudWxsIHBhdHRlcm4pXG4gICAgICByZXR1cm4gbG9jO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBEbyBhIGZ1enp5IGNvbXBhcmUuXG4gICAgICByZXR1cm4gdGhpcy5tYXRjaF9iaXRhcF8odGV4dCwgcGF0dGVybiwgbG9jKTtcbiAgICB9XG4gIH07XG5cblxuICAvKipcbiAgICogTG9jYXRlIHRoZSBiZXN0IGluc3RhbmNlIG9mICdwYXR0ZXJuJyBpbiAndGV4dCcgbmVhciAnbG9jJyB1c2luZyB0aGVcbiAgICogQml0YXAgYWxnb3JpdGhtLlxuICAgKiBAcGFyYW0gIHRleHQgVGhlIHRleHQgdG8gc2VhcmNoLlxuICAgKiBAcGFyYW0gIHBhdHRlcm4gVGhlIHBhdHRlcm4gdG8gc2VhcmNoIGZvci5cbiAgICogQHBhcmFtICBsb2MgVGhlIGxvY2F0aW9uIHRvIHNlYXJjaCBhcm91bmQuXG4gICAqIEByZXR1cm4gIEJlc3QgbWF0Y2ggaW5kZXggb3IgLTEuXG5cbiAgICovXG4gICAgbWF0Y2hfYml0YXBfICh0ZXh0OiBzdHJpbmcsIHBhdHRlcm46IHN0cmluZywgbG9jOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGlmIChwYXR0ZXJuLmxlbmd0aCA+IHRoaXMuTWF0Y2hfTWF4Qml0cykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdQYXR0ZXJuIHRvbyBsb25nIGZvciB0aGlzIGJyb3dzZXIuJyk7XG4gICAgfVxuXG4gICAgLy8gSW5pdGlhbGlzZSB0aGUgYWxwaGFiZXQuXG4gICAgY29uc3QgcyA9IHRoaXMubWF0Y2hfYWxwaGFiZXRfKHBhdHRlcm4pO1xuXG4gICAgY29uc3QgZG1wID0gdGhpczsgIC8vICd0aGlzJyBiZWNvbWVzICd3aW5kb3cnIGluIGEgY2xvc3VyZS5cblxuICAgIC8qKlxuICAgICAqIENvbXB1dGUgYW5kIHJldHVybiB0aGUgc2NvcmUgZm9yIGEgbWF0Y2ggd2l0aCBlIGVycm9ycyBhbmQgeCBsb2NhdGlvbi5cbiAgICAgKiBBY2Nlc3NlcyBsb2MgYW5kIHBhdHRlcm4gdGhyb3VnaCBiZWluZyBhIGNsb3N1cmUuXG4gICAgICogQHBhcmFtICBlIE51bWJlciBvZiBlcnJvcnMgaW4gbWF0Y2guXG4gICAgICogQHBhcmFtICB4IExvY2F0aW9uIG9mIG1hdGNoLlxuICAgICAqIEByZXR1cm4gIE92ZXJhbGwgc2NvcmUgZm9yIG1hdGNoICgwLjAgPSBnb29kLCAxLjAgPSBiYWQpLlxuXG4gICAgICovXG4gICAgZnVuY3Rpb24gbWF0Y2hfYml0YXBTY29yZV8oZTogbnVtYmVyLCB4OiBudW1iZXIpOiBudW1iZXIge1xuICAgICAgY29uc3QgYWNjdXJhY3kgPSBlIC8gcGF0dGVybi5sZW5ndGg7XG4gICAgICBjb25zdCBwcm94aW1pdHkgPSBNYXRoLmFicyhsb2MgLSB4KTtcbiAgICAgIGlmICghZG1wLk1hdGNoX0Rpc3RhbmNlKSB7XG4gICAgICAgIC8vIERvZGdlIGRpdmlkZSBieSB6ZXJvIGVycm9yLlxuICAgICAgICByZXR1cm4gcHJveGltaXR5ID8gMS4wIDogYWNjdXJhY3k7XG4gICAgICB9XG4gICAgICByZXR1cm4gYWNjdXJhY3kgKyAocHJveGltaXR5IC8gZG1wLk1hdGNoX0Rpc3RhbmNlKTtcbiAgICB9XG5cbiAgICAvLyBIaWdoZXN0IHNjb3JlIGJleW9uZCB3aGljaCB3ZSBnaXZlIHVwLlxuICAgIGxldCBzY29yZV90aHJlc2hvbGQgPSB0aGlzLk1hdGNoX1RocmVzaG9sZDtcbiAgICAvLyBJcyB0aGVyZSBhIG5lYXJieSBleGFjdCBtYXRjaD8gKHNwZWVkdXApXG4gICAgbGV0IGJlc3RfbG9jID0gdGV4dC5pbmRleE9mKHBhdHRlcm4sIGxvYyk7XG4gICAgaWYgKGJlc3RfbG9jICE9IC0xKSB7XG4gICAgICBzY29yZV90aHJlc2hvbGQgPSBNYXRoLm1pbihtYXRjaF9iaXRhcFNjb3JlXygwLCBiZXN0X2xvYyksIHNjb3JlX3RocmVzaG9sZCk7XG4gICAgICAvLyBXaGF0IGFib3V0IGluIHRoZSBvdGhlciBkaXJlY3Rpb24/IChzcGVlZHVwKVxuICAgICAgYmVzdF9sb2MgPSB0ZXh0Lmxhc3RJbmRleE9mKHBhdHRlcm4sIGxvYyArIHBhdHRlcm4ubGVuZ3RoKTtcbiAgICAgIGlmIChiZXN0X2xvYyAhPSAtMSkge1xuICAgICAgICBzY29yZV90aHJlc2hvbGQgPVxuICAgICAgICAgICAgTWF0aC5taW4obWF0Y2hfYml0YXBTY29yZV8oMCwgYmVzdF9sb2MpLCBzY29yZV90aHJlc2hvbGQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEluaXRpYWxpc2UgdGhlIGJpdCBhcnJheXMuXG4gICAgY29uc3QgbWF0Y2htYXNrID0gMSA8PCAocGF0dGVybi5sZW5ndGggLSAxKTtcbiAgICBiZXN0X2xvYyA9IC0xO1xuXG4gICAgbGV0IGJpbl9taW4sIGJpbl9taWQ7XG4gICAgbGV0IGJpbl9tYXggPSBwYXR0ZXJuLmxlbmd0aCArIHRleHQubGVuZ3RoO1xuICAgIGxldCBsYXN0X3JkO1xuICAgIGZvciAobGV0IGQgPSAwOyBkIDwgcGF0dGVybi5sZW5ndGg7IGQrKykge1xuICAgICAgLy8gU2NhbiBmb3IgdGhlIGJlc3QgbWF0Y2g7IGVhY2ggaXRlcmF0aW9uIGFsbG93cyBmb3Igb25lIG1vcmUgZXJyb3IuXG4gICAgICAvLyBSdW4gYSBiaW5hcnkgc2VhcmNoIHRvIGRldGVybWluZSBob3cgZmFyIGZyb20gJ2xvYycgd2UgY2FuIHN0cmF5IGF0IHRoaXNcbiAgICAgIC8vIGVycm9yIGxldmVsLlxuICAgICAgYmluX21pbiA9IDA7XG4gICAgICBiaW5fbWlkID0gYmluX21heDtcbiAgICAgIHdoaWxlIChiaW5fbWluIDwgYmluX21pZCkge1xuICAgICAgICBpZiAobWF0Y2hfYml0YXBTY29yZV8oZCwgbG9jICsgYmluX21pZCkgPD0gc2NvcmVfdGhyZXNob2xkKSB7XG4gICAgICAgICAgYmluX21pbiA9IGJpbl9taWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYmluX21heCA9IGJpbl9taWQ7XG4gICAgICAgIH1cbiAgICAgICAgYmluX21pZCA9IE1hdGguZmxvb3IoKGJpbl9tYXggLSBiaW5fbWluKSAvIDIgKyBiaW5fbWluKTtcbiAgICAgIH1cbiAgICAgIC8vIFVzZSB0aGUgcmVzdWx0IGZyb20gdGhpcyBpdGVyYXRpb24gYXMgdGhlIG1heGltdW0gZm9yIHRoZSBuZXh0LlxuICAgICAgYmluX21heCA9IGJpbl9taWQ7XG4gICAgICBsZXQgc3RhcnQgPSBNYXRoLm1heCgxLCBsb2MgLSBiaW5fbWlkICsgMSk7XG4gICAgICBjb25zdCBmaW5pc2ggPSBNYXRoLm1pbihsb2MgKyBiaW5fbWlkLCB0ZXh0Lmxlbmd0aCkgKyBwYXR0ZXJuLmxlbmd0aDtcblxuICAgICAgY29uc3QgcmQgPSBBcnJheShmaW5pc2ggKyAyKTtcbiAgICAgIHJkW2ZpbmlzaCArIDFdID0gKDEgPDwgZCkgLSAxO1xuICAgICAgZm9yIChsZXQgaiA9IGZpbmlzaDsgaiA+PSBzdGFydDsgai0tKSB7XG4gICAgICAgIC8vIFRoZSBhbHBoYWJldCAocykgaXMgYSBzcGFyc2UgaGFzaCwgc28gdGhlIGZvbGxvd2luZyBsaW5lIGdlbmVyYXRlc1xuICAgICAgICAvLyB3YXJuaW5ncy5cbiAgICAgICAgY29uc3QgY2hhck1hdGNoID0gc1t0ZXh0LmNoYXJBdChqIC0gMSldO1xuICAgICAgICBpZiAoZCA9PT0gMCkgeyAgLy8gRmlyc3QgcGFzczogZXhhY3QgbWF0Y2guXG4gICAgICAgICAgcmRbal0gPSAoKHJkW2ogKyAxXSA8PCAxKSB8IDEpICYgY2hhck1hdGNoO1xuICAgICAgICB9IGVsc2UgeyAgLy8gU3Vic2VxdWVudCBwYXNzZXM6IGZ1enp5IG1hdGNoLlxuICAgICAgICAgIHJkW2pdID0gKCgocmRbaiArIDFdIDw8IDEpIHwgMSkgJiBjaGFyTWF0Y2gpIHxcbiAgICAgICAgICAgICAgICAgICgoKGxhc3RfcmRbaiArIDFdIHwgbGFzdF9yZFtqXSkgPDwgMSkgfCAxKSB8XG4gICAgICAgICAgICAgICAgICBsYXN0X3JkW2ogKyAxXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmRbal0gJiBtYXRjaG1hc2spIHtcbiAgICAgICAgICBjb25zdCBzY29yZSA9IG1hdGNoX2JpdGFwU2NvcmVfKGQsIGogLSAxKTtcbiAgICAgICAgICAvLyBUaGlzIG1hdGNoIHdpbGwgYWxtb3N0IGNlcnRhaW5seSBiZSBiZXR0ZXIgdGhhbiBhbnkgZXhpc3RpbmcgbWF0Y2guXG4gICAgICAgICAgLy8gQnV0IGNoZWNrIGFueXdheS5cbiAgICAgICAgICBpZiAoc2NvcmUgPD0gc2NvcmVfdGhyZXNob2xkKSB7XG4gICAgICAgICAgICAvLyBUb2xkIHlvdSBzby5cbiAgICAgICAgICAgIHNjb3JlX3RocmVzaG9sZCA9IHNjb3JlO1xuICAgICAgICAgICAgYmVzdF9sb2MgPSBqIC0gMTtcbiAgICAgICAgICAgIGlmIChiZXN0X2xvYyA+IGxvYykge1xuICAgICAgICAgICAgICAvLyBXaGVuIHBhc3NpbmcgbG9jLCBkb24ndCBleGNlZWQgb3VyIGN1cnJlbnQgZGlzdGFuY2UgZnJvbSBsb2MuXG4gICAgICAgICAgICAgIHN0YXJ0ID0gTWF0aC5tYXgoMSwgMiAqIGxvYyAtIGJlc3RfbG9jKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIEFscmVhZHkgcGFzc2VkIGxvYywgZG93bmhpbGwgZnJvbSBoZXJlIG9uIGluLlxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIE5vIGhvcGUgZm9yIGEgKGJldHRlcikgbWF0Y2ggYXQgZ3JlYXRlciBlcnJvciBsZXZlbHMuXG4gICAgICBpZiAobWF0Y2hfYml0YXBTY29yZV8oZCArIDEsIGxvYykgPiBzY29yZV90aHJlc2hvbGQpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBsYXN0X3JkID0gcmQ7XG4gICAgfVxuICAgIHJldHVybiBiZXN0X2xvYztcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXNlIHRoZSBhbHBoYWJldCBmb3IgdGhlIEJpdGFwIGFsZ29yaXRobS5cbiAgICogQHBhcmFtICBwYXR0ZXJuIFRoZSB0ZXh0IHRvIGVuY29kZS5cbiAgICogQHJldHVybiAgSGFzaCBvZiBjaGFyYWN0ZXIgbG9jYXRpb25zLlxuXG4gICAqL1xuICAgIG1hdGNoX2FscGhhYmV0XyAocGF0dGVybjogc3RyaW5nKTogeyBbY2hhcmFjdGVyOiBzdHJpbmddOiBudW1iZXIgfSB7XG4gICAgY29uc3QgczogeyBbY2hhcmFjdGVyOiBzdHJpbmddOiBudW1iZXIgfSA9IHt9O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0dGVybi5sZW5ndGg7IGkrKykge1xuICAgICAgc1twYXR0ZXJuLmNoYXJBdChpKV0gPSAwO1xuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhdHRlcm4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHNbcGF0dGVybi5jaGFyQXQoaSldIHw9IDEgPDwgKHBhdHRlcm4ubGVuZ3RoIC0gaSAtIDEpO1xuICAgIH1cbiAgICByZXR1cm4gcztcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBJbmNyZWFzZSB0aGUgY29udGV4dCB1bnRpbCBpdCBpcyB1bmlxdWUsXG4gICAqIGJ1dCBkb24ndCBsZXQgdGhlIHBhdHRlcm4gZXhwYW5kIGJleW9uZCBNYXRjaF9NYXhCaXRzLlxuICAgKiBAcGFyYW0gIHBhdGNoIFRoZSBwYXRjaCB0byBncm93LlxuICAgKiBAcGFyYW0gIHRleHQgU291cmNlIHRleHQuXG5cbiAgICovXG4gICAgcGF0Y2hfYWRkQ29udGV4dF8gKHBhdGNoOiBwYXRjaF9vYmosIHRleHQ6IHN0cmluZykge1xuICAgIGlmICh0ZXh0Lmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCBwYXR0ZXJuID0gdGV4dC5zdWJzdHJpbmcocGF0Y2guc3RhcnQyLCBwYXRjaC5zdGFydDIgKyBwYXRjaC5sZW5ndGgxKTtcbiAgICBsZXQgcGFkZGluZyA9IDA7XG5cbiAgICAvLyBMb29rIGZvciB0aGUgZmlyc3QgYW5kIGxhc3QgbWF0Y2hlcyBvZiBwYXR0ZXJuIGluIHRleHQuICBJZiB0d28gZGlmZmVyZW50XG4gICAgLy8gbWF0Y2hlcyBhcmUgZm91bmQsIGluY3JlYXNlIHRoZSBwYXR0ZXJuIGxlbmd0aC5cbiAgICB3aGlsZSAodGV4dC5pbmRleE9mKHBhdHRlcm4pICE9IHRleHQubGFzdEluZGV4T2YocGF0dGVybikgJiZcbiAgICAgICAgICBwYXR0ZXJuLmxlbmd0aCA8IHRoaXMuTWF0Y2hfTWF4Qml0cyAtIHRoaXMuUGF0Y2hfTWFyZ2luIC1cbiAgICAgICAgICB0aGlzLlBhdGNoX01hcmdpbikge1xuICAgICAgcGFkZGluZyArPSB0aGlzLlBhdGNoX01hcmdpbjtcbiAgICAgIHBhdHRlcm4gPSB0ZXh0LnN1YnN0cmluZyhwYXRjaC5zdGFydDIgLSBwYWRkaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0Y2guc3RhcnQyICsgcGF0Y2gubGVuZ3RoMSArIHBhZGRpbmcpO1xuICAgIH1cbiAgICAvLyBBZGQgb25lIGNodW5rIGZvciBnb29kIGx1Y2suXG4gICAgcGFkZGluZyArPSB0aGlzLlBhdGNoX01hcmdpbjtcblxuICAgIC8vIEFkZCB0aGUgcHJlZml4LlxuICAgIGNvbnN0IHByZWZpeCA9IHRleHQuc3Vic3RyaW5nKHBhdGNoLnN0YXJ0MiAtIHBhZGRpbmcsIHBhdGNoLnN0YXJ0Mik7XG4gICAgaWYgKHByZWZpeCkge1xuICAgICAgcGF0Y2guZGlmZnMudW5zaGlmdChbRGlmZk9wLkVxdWFsLCBwcmVmaXhdKTtcbiAgICB9XG4gICAgLy8gQWRkIHRoZSBzdWZmaXguXG4gICAgY29uc3Qgc3VmZml4ID0gdGV4dC5zdWJzdHJpbmcocGF0Y2guc3RhcnQyICsgcGF0Y2gubGVuZ3RoMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0Y2guc3RhcnQyICsgcGF0Y2gubGVuZ3RoMSArIHBhZGRpbmcpO1xuICAgIGlmIChzdWZmaXgpIHtcbiAgICAgIHBhdGNoLmRpZmZzLnB1c2goW0RpZmZPcC5FcXVhbCwgc3VmZml4XSk7XG4gICAgfVxuXG4gICAgLy8gUm9sbCBiYWNrIHRoZSBzdGFydCBwb2ludHMuXG4gICAgcGF0Y2guc3RhcnQxIC09IHByZWZpeC5sZW5ndGg7XG4gICAgcGF0Y2guc3RhcnQyIC09IHByZWZpeC5sZW5ndGg7XG4gICAgLy8gRXh0ZW5kIHRoZSBsZW5ndGhzLlxuICAgIHBhdGNoLmxlbmd0aDEgKz0gcHJlZml4Lmxlbmd0aCArIHN1ZmZpeC5sZW5ndGg7XG4gICAgcGF0Y2gubGVuZ3RoMiArPSBwcmVmaXgubGVuZ3RoICsgc3VmZml4Lmxlbmd0aDtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBDb21wdXRlIGEgbGlzdCBvZiBwYXRjaGVzIHRvIHR1cm4gdGV4dDEgaW50byB0ZXh0Mi5cbiAgICogVXNlIGRpZmZzIGlmIHByb3ZpZGVkLCBvdGhlcndpc2UgY29tcHV0ZSBpdCBvdXJzZWx2ZXMuXG4gICAqIFRoZXJlIGFyZSBmb3VyIHdheXMgdG8gY2FsbCB0aGlzIGZ1bmN0aW9uLCBkZXBlbmRpbmcgb24gd2hhdCBkYXRhIGlzXG4gICAqIGF2YWlsYWJsZSB0byB0aGUgY2FsbGVyOlxuICAgKiBNZXRob2QgMTpcbiAgICogYSA9IHRleHQxLCBiID0gdGV4dDJcbiAgICogTWV0aG9kIDI6XG4gICAqIGEgPSBkaWZmc1xuICAgKiBNZXRob2QgMyAob3B0aW1hbCk6XG4gICAqIGEgPSB0ZXh0MSwgYiA9IGRpZmZzXG4gICAqIE1ldGhvZCA0IChkZXByZWNhdGVkLCB1c2UgbWV0aG9kIDMpOlxuICAgKiBhID0gdGV4dDEsIGIgPSB0ZXh0MiwgYyA9IGRpZmZzXG4gICAqXG4gICAqIEBwYXJhbSAgYSB0ZXh0MSAobWV0aG9kcyAxLDMsNCkgb3JcbiAgICogQXJyYXkgb2YgZGlmZiB0dXBsZXMgZm9yIHRleHQxIHRvIHRleHQyIChtZXRob2QgMikuXG4gICAqIEBwYXJhbSAgb3B0X2IgdGV4dDIgKG1ldGhvZHMgMSw0KSBvclxuICAgKiBBcnJheSBvZiBkaWZmIHR1cGxlcyBmb3IgdGV4dDEgdG8gdGV4dDIgKG1ldGhvZCAzKSBvciB1bmRlZmluZWQgKG1ldGhvZCAyKS5cbiAgICogQHBhcmFtICBvcHRfYyBBcnJheSBvZiBkaWZmIHR1cGxlc1xuICAgKiBmb3IgdGV4dDEgdG8gdGV4dDIgKG1ldGhvZCA0KSBvciB1bmRlZmluZWQgKG1ldGhvZHMgMSwyLDMpLlxuICAgKiBAcmV0dXJuICBBcnJheSBvZiBQYXRjaCBvYmplY3RzLlxuICAgKi9cbiAgICBwYXRjaF9tYWtlIChhOiBzdHJpbmcgfCBBcnJheTxEaWZmPiwgb3B0X2I6IHN0cmluZyB8IEFycmF5PERpZmY+LCBvcHRfYzogc3RyaW5nIHwgQXJyYXk8RGlmZj4pIHtcbiAgICBsZXQgdGV4dDEsIGRpZmZzO1xuICAgIGlmICh0eXBlb2YgYSA9PSAnc3RyaW5nJyAmJiB0eXBlb2Ygb3B0X2IgPT0gJ3N0cmluZycgJiZcbiAgICAgICAgdHlwZW9mIG9wdF9jID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvLyBNZXRob2QgMTogdGV4dDEsIHRleHQyXG4gICAgICAvLyBDb21wdXRlIGRpZmZzIGZyb20gdGV4dDEgYW5kIHRleHQyLlxuICAgICAgdGV4dDEgPSAoYSk7XG4gICAgICBkaWZmcyA9IHRoaXMuZGlmZl9tYWluKHRleHQxLCAob3B0X2IpLCB0cnVlKTtcbiAgICAgIGlmIChkaWZmcy5sZW5ndGggPiAyKSB7XG4gICAgICAgIHRoaXMuZGlmZl9jbGVhbnVwU2VtYW50aWMoZGlmZnMpO1xuICAgICAgICB0aGlzLmRpZmZfY2xlYW51cEVmZmljaWVuY3koZGlmZnMpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYSAmJiB0eXBlb2YgYSA9PSAnb2JqZWN0JyAmJiB0eXBlb2Ygb3B0X2IgPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgdHlwZW9mIG9wdF9jID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvLyBNZXRob2QgMjogZGlmZnNcbiAgICAgIC8vIENvbXB1dGUgdGV4dDEgZnJvbSBkaWZmcy5cbiAgICAgIGRpZmZzID0gKGEpO1xuICAgICAgdGV4dDEgPSB0aGlzLmRpZmZfdGV4dDEoZGlmZnMpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGEgPT0gJ3N0cmluZycgJiYgb3B0X2IgJiYgdHlwZW9mIG9wdF9iID09ICdvYmplY3QnICYmXG4gICAgICAgIHR5cGVvZiBvcHRfYyA9PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gTWV0aG9kIDM6IHRleHQxLCBkaWZmc1xuICAgICAgdGV4dDEgPSAoYSk7XG4gICAgICBkaWZmcyA9IChvcHRfYik7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgYSA9PSAnc3RyaW5nJyAmJiB0eXBlb2Ygb3B0X2IgPT0gJ3N0cmluZycgJiZcbiAgICAgICAgb3B0X2MgJiYgdHlwZW9mIG9wdF9jID09ICdvYmplY3QnKSB7XG4gICAgICAvLyBNZXRob2QgNDogdGV4dDEsIHRleHQyLCBkaWZmc1xuICAgICAgLy8gdGV4dDIgaXMgbm90IHVzZWQuXG4gICAgICB0ZXh0MSA9IChhKTtcbiAgICAgIGRpZmZzID0gKG9wdF9jKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGNhbGwgZm9ybWF0IHRvIHBhdGNoX21ha2UuJyk7XG4gICAgfVxuXG4gICAgaWYgKGRpZmZzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIFtdOyAgLy8gR2V0IHJpZCBvZiB0aGUgbnVsbCBjYXNlLlxuICAgIH1cbiAgICBjb25zdCBwYXRjaGVzID0gW107XG4gICAgbGV0IHBhdGNoID0gbmV3IHBhdGNoX29iaigpO1xuICAgIGxldCBwYXRjaERpZmZMZW5ndGggPSAwOyAgLy8gS2VlcGluZyBvdXIgb3duIGxlbmd0aCBjb25zdCBpcyBmYXN0ZXIgaW4gSlMuXG4gICAgbGV0IGNoYXJfY291bnQxID0gMDsgIC8vIE51bWJlciBvZiBjaGFyYWN0ZXJzIGludG8gdGhlIHRleHQxIHN0cmluZy5cbiAgICBsZXQgY2hhcl9jb3VudDIgPSAwOyAgLy8gTnVtYmVyIG9mIGNoYXJhY3RlcnMgaW50byB0aGUgdGV4dDIgc3RyaW5nLlxuICAgIC8vIFN0YXJ0IHdpdGggdGV4dDEgKHByZXBhdGNoX3RleHQpIGFuZCBhcHBseSB0aGUgZGlmZnMgdW50aWwgd2UgYXJyaXZlIGF0XG4gICAgLy8gdGV4dDIgKHBvc3RwYXRjaF90ZXh0KS4gIFdlIHJlY3JlYXRlIHRoZSBwYXRjaGVzIG9uZSBieSBvbmUgdG8gZGV0ZXJtaW5lXG4gICAgLy8gY29udGV4dCBpbmZvLlxuICAgIGxldCBwcmVwYXRjaF90ZXh0ID0gdGV4dDE7XG4gICAgbGV0IHBvc3RwYXRjaF90ZXh0ID0gdGV4dDE7XG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBkaWZmcy5sZW5ndGg7IHgrKykge1xuICAgICAgY29uc3QgZGlmZl90eXBlID0gZGlmZnNbeF1bMF07XG4gICAgICBjb25zdCBkaWZmX3RleHQgPSBkaWZmc1t4XVsxXTtcblxuICAgICAgaWYgKCFwYXRjaERpZmZMZW5ndGggJiYgZGlmZl90eXBlICE9PSBEaWZmT3AuRXF1YWwpIHtcbiAgICAgICAgLy8gQSBuZXcgcGF0Y2ggc3RhcnRzIGhlcmUuXG4gICAgICAgIHBhdGNoLnN0YXJ0MSA9IGNoYXJfY291bnQxO1xuICAgICAgICBwYXRjaC5zdGFydDIgPSBjaGFyX2NvdW50MjtcbiAgICAgIH1cblxuICAgICAgc3dpdGNoIChkaWZmX3R5cGUpIHtcbiAgICAgICAgY2FzZSBEaWZmT3AuSW5zZXJ0OlxuICAgICAgICAgIHBhdGNoLmRpZmZzW3BhdGNoRGlmZkxlbmd0aCsrXSA9IGRpZmZzW3hdO1xuICAgICAgICAgIHBhdGNoLmxlbmd0aDIgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcbiAgICAgICAgICBwb3N0cGF0Y2hfdGV4dCA9IHBvc3RwYXRjaF90ZXh0LnN1YnN0cmluZygwLCBjaGFyX2NvdW50MikgKyBkaWZmX3RleHQgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICBwb3N0cGF0Y2hfdGV4dC5zdWJzdHJpbmcoY2hhcl9jb3VudDIpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIERpZmZPcC5EZWxldGU6XG4gICAgICAgICAgcGF0Y2gubGVuZ3RoMSArPSBkaWZmX3RleHQubGVuZ3RoO1xuICAgICAgICAgIHBhdGNoLmRpZmZzW3BhdGNoRGlmZkxlbmd0aCsrXSA9IGRpZmZzW3hdO1xuICAgICAgICAgIHBvc3RwYXRjaF90ZXh0ID0gcG9zdHBhdGNoX3RleHQuc3Vic3RyaW5nKDAsIGNoYXJfY291bnQyKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBvc3RwYXRjaF90ZXh0LnN1YnN0cmluZyhjaGFyX2NvdW50MiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmX3RleHQubGVuZ3RoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBEaWZmT3AuRXF1YWw6XG4gICAgICAgICAgaWYgKGRpZmZfdGV4dC5sZW5ndGggPD0gMiAqIHRoaXMuUGF0Y2hfTWFyZ2luICYmXG4gICAgICAgICAgICAgIHBhdGNoRGlmZkxlbmd0aCAmJiBkaWZmcy5sZW5ndGggIT0geCArIDEpIHtcbiAgICAgICAgICAgIC8vIFNtYWxsIGVxdWFsaXR5IGluc2lkZSBhIHBhdGNoLlxuICAgICAgICAgICAgcGF0Y2guZGlmZnNbcGF0Y2hEaWZmTGVuZ3RoKytdID0gZGlmZnNbeF07XG4gICAgICAgICAgICBwYXRjaC5sZW5ndGgxICs9IGRpZmZfdGV4dC5sZW5ndGg7XG4gICAgICAgICAgICBwYXRjaC5sZW5ndGgyICs9IGRpZmZfdGV4dC5sZW5ndGg7XG4gICAgICAgICAgfSBlbHNlIGlmIChkaWZmX3RleHQubGVuZ3RoID49IDIgKiB0aGlzLlBhdGNoX01hcmdpbikge1xuICAgICAgICAgICAgLy8gVGltZSBmb3IgYSBuZXcgcGF0Y2guXG4gICAgICAgICAgICBpZiAocGF0Y2hEaWZmTGVuZ3RoKSB7XG4gICAgICAgICAgICAgIHRoaXMucGF0Y2hfYWRkQ29udGV4dF8ocGF0Y2gsIHByZXBhdGNoX3RleHQpO1xuICAgICAgICAgICAgICBwYXRjaGVzLnB1c2gocGF0Y2gpO1xuICAgICAgICAgICAgICBwYXRjaCA9IG5ldyBwYXRjaF9vYmooKTtcbiAgICAgICAgICAgICAgcGF0Y2hEaWZmTGVuZ3RoID0gMDtcbiAgICAgICAgICAgICAgLy8gVW5saWtlIFVuaWRpZmYsIG91ciBwYXRjaCBsaXN0cyBoYXZlIGEgcm9sbGluZyBjb250ZXh0LlxuICAgICAgICAgICAgICAvLyBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZ29vZ2xlLWRpZmYtbWF0Y2gtcGF0Y2gvd2lraS9VbmlkaWZmXG4gICAgICAgICAgICAgIC8vIFVwZGF0ZSBwcmVwYXRjaCB0ZXh0ICYgcG9zIHRvIHJlZmxlY3QgdGhlIGFwcGxpY2F0aW9uIG9mIHRoZVxuICAgICAgICAgICAgICAvLyBqdXN0IGNvbXBsZXRlZCBwYXRjaC5cbiAgICAgICAgICAgICAgcHJlcGF0Y2hfdGV4dCA9IHBvc3RwYXRjaF90ZXh0O1xuICAgICAgICAgICAgICBjaGFyX2NvdW50MSA9IGNoYXJfY291bnQyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgLy8gVXBkYXRlIHRoZSBjdXJyZW50IGNoYXJhY3RlciBjb3VudC5cbiAgICAgIGlmIChkaWZmX3R5cGUgIT09IERpZmZPcC5JbnNlcnQpIHtcbiAgICAgICAgY2hhcl9jb3VudDEgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGlmIChkaWZmX3R5cGUgIT09IERpZmZPcC5EZWxldGUpIHtcbiAgICAgICAgY2hhcl9jb3VudDIgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gUGljayB1cCB0aGUgbGVmdG92ZXIgcGF0Y2ggaWYgbm90IGVtcHR5LlxuICAgIGlmIChwYXRjaERpZmZMZW5ndGgpIHtcbiAgICAgIHRoaXMucGF0Y2hfYWRkQ29udGV4dF8ocGF0Y2gsIHByZXBhdGNoX3RleHQpO1xuICAgICAgcGF0Y2hlcy5wdXNoKHBhdGNoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcGF0Y2hlcztcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBHaXZlbiBhbiBhcnJheSBvZiBwYXRjaGVzLCByZXR1cm4gYW5vdGhlciBhcnJheSB0aGF0IGlzIGlkZW50aWNhbC5cbiAgICogQHBhcmFtICBwYXRjaGVzIEFycmF5IG9mIFBhdGNoIG9iamVjdHMuXG4gICAqIEByZXR1cm4gIEFycmF5IG9mIFBhdGNoIG9iamVjdHMuXG4gICAqL1xuICAgIHBhdGNoX2RlZXBDb3B5IChwYXRjaGVzOiBBcnJheTxwYXRjaF9vYmo+KTogQXJyYXk8cGF0Y2hfb2JqPiB7XG4gICAgLy8gTWFraW5nIGRlZXAgY29waWVzIGlzIGhhcmQgaW4gSmF2YVNjcmlwdC5cbiAgICBjb25zdCBwYXRjaGVzQ29weSA9IFtdO1xuICAgIGZvciAobGV0IHggPSAwOyB4IDwgcGF0Y2hlcy5sZW5ndGg7IHgrKykge1xuICAgICAgY29uc3QgcGF0Y2ggPSBwYXRjaGVzW3hdO1xuICAgICAgY29uc3QgcGF0Y2hDb3B5ID0gbmV3IHBhdGNoX29iaigpO1xuICAgICAgcGF0Y2hDb3B5LmRpZmZzID0gW107XG4gICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IHBhdGNoLmRpZmZzLmxlbmd0aDsgeSsrKSB7XG4gICAgICAgIHBhdGNoQ29weS5kaWZmc1t5XSA9IFtwYXRjaC5kaWZmc1t5XVswXSwgcGF0Y2guZGlmZnNbeV1bMV1dO1xuICAgICAgfVxuICAgICAgcGF0Y2hDb3B5LnN0YXJ0MSA9IHBhdGNoLnN0YXJ0MTtcbiAgICAgIHBhdGNoQ29weS5zdGFydDIgPSBwYXRjaC5zdGFydDI7XG4gICAgICBwYXRjaENvcHkubGVuZ3RoMSA9IHBhdGNoLmxlbmd0aDE7XG4gICAgICBwYXRjaENvcHkubGVuZ3RoMiA9IHBhdGNoLmxlbmd0aDI7XG4gICAgICBwYXRjaGVzQ29weVt4XSA9IHBhdGNoQ29weTtcbiAgICB9XG4gICAgcmV0dXJuIHBhdGNoZXNDb3B5O1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIE1lcmdlIGEgc2V0IG9mIHBhdGNoZXMgb250byB0aGUgdGV4dC4gIFJldHVybiBhIHBhdGNoZWQgdGV4dCwgYXMgd2VsbFxuICAgKiBhcyBhIGxpc3Qgb2YgdHJ1ZS9mYWxzZSB2YWx1ZXMgaW5kaWNhdGluZyB3aGljaCBwYXRjaGVzIHdlcmUgYXBwbGllZC5cbiAgICogQHBhcmFtICBwYXRjaGVzIEFycmF5IG9mIFBhdGNoIG9iamVjdHMuXG4gICAqIEBwYXJhbSAgdGV4dCBPbGQgdGV4dC5cbiAgICogQHJldHVybiAgVHdvIGVsZW1lbnQgQXJyYXksIGNvbnRhaW5pbmcgdGhlXG4gICAqICAgICAgbmV3IHRleHQgYW5kIGFuIGFycmF5IG9mIGJvb2xlYW4gdmFsdWVzLlxuICAgKi9cbiAgICBwYXRjaF9hcHBseSAocGF0Y2hlczogQXJyYXk8cGF0Y2hfb2JqPiwgdGV4dDogc3RyaW5nKSB7XG4gICAgaWYgKHBhdGNoZXMubGVuZ3RoID09IDApIHtcbiAgICAgIHJldHVybiBbdGV4dCwgW11dO1xuICAgIH1cblxuICAgIC8vIERlZXAgY29weSB0aGUgcGF0Y2hlcyBzbyB0aGF0IG5vIGNoYW5nZXMgYXJlIG1hZGUgdG8gb3JpZ2luYWxzLlxuICAgIHBhdGNoZXMgPSB0aGlzLnBhdGNoX2RlZXBDb3B5KHBhdGNoZXMpO1xuXG4gICAgY29uc3QgbnVsbFBhZGRpbmcgPSB0aGlzLnBhdGNoX2FkZFBhZGRpbmcocGF0Y2hlcyk7XG4gICAgdGV4dCA9IG51bGxQYWRkaW5nICsgdGV4dCArIG51bGxQYWRkaW5nO1xuXG4gICAgdGhpcy5wYXRjaF9zcGxpdE1heChwYXRjaGVzKTtcbiAgICAvLyBkZWx0YSBrZWVwcyB0cmFjayBvZiB0aGUgb2Zmc2V0IGJldHdlZW4gdGhlIGV4cGVjdGVkIGFuZCBhY3R1YWwgbG9jYXRpb25cbiAgICAvLyBvZiB0aGUgcHJldmlvdXMgcGF0Y2guICBJZiB0aGVyZSBhcmUgcGF0Y2hlcyBleHBlY3RlZCBhdCBwb3NpdGlvbnMgMTAgYW5kXG4gICAgLy8gMjAsIGJ1dCB0aGUgZmlyc3QgcGF0Y2ggd2FzIGZvdW5kIGF0IDEyLCBkZWx0YSBpcyAyIGFuZCB0aGUgc2Vjb25kIHBhdGNoXG4gICAgLy8gaGFzIGFuIGVmZmVjdGl2ZSBleHBlY3RlZCBwb3NpdGlvbiBvZiAyMi5cbiAgICBsZXQgZGVsdGEgPSAwO1xuICAgIGNvbnN0IHJlc3VsdHMgPSBbXTtcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHBhdGNoZXMubGVuZ3RoOyB4KyspIHtcbiAgICAgIGNvbnN0IGV4cGVjdGVkX2xvYyA9IHBhdGNoZXNbeF0uc3RhcnQyICsgZGVsdGE7XG4gICAgICBjb25zdCB0ZXh0MSA9IHRoaXMuZGlmZl90ZXh0MShwYXRjaGVzW3hdLmRpZmZzKTtcbiAgICAgIGxldCBzdGFydF9sb2M7XG4gICAgICBsZXQgZW5kX2xvYyA9IC0xO1xuICAgICAgaWYgKHRleHQxLmxlbmd0aCA+IHRoaXMuTWF0Y2hfTWF4Qml0cykge1xuICAgICAgICAvLyBwYXRjaF9zcGxpdE1heCB3aWxsIG9ubHkgcHJvdmlkZSBhbiBvdmVyc2l6ZWQgcGF0dGVybiBpbiB0aGUgY2FzZSBvZlxuICAgICAgICAvLyBhIG1vbnN0ZXIgZGVsZXRlLlxuICAgICAgICBzdGFydF9sb2MgPSB0aGlzLm1hdGNoX21haW4odGV4dCwgdGV4dDEuc3Vic3RyaW5nKDAsIHRoaXMuTWF0Y2hfTWF4Qml0cyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBlY3RlZF9sb2MpO1xuICAgICAgICBpZiAoc3RhcnRfbG9jICE9IC0xKSB7XG4gICAgICAgICAgZW5kX2xvYyA9IHRoaXMubWF0Y2hfbWFpbih0ZXh0LFxuICAgICAgICAgICAgICB0ZXh0MS5zdWJzdHJpbmcodGV4dDEubGVuZ3RoIC0gdGhpcy5NYXRjaF9NYXhCaXRzKSxcbiAgICAgICAgICAgICAgZXhwZWN0ZWRfbG9jICsgdGV4dDEubGVuZ3RoIC0gdGhpcy5NYXRjaF9NYXhCaXRzKTtcbiAgICAgICAgICBpZiAoZW5kX2xvYyA9PSAtMSB8fCBzdGFydF9sb2MgPj0gZW5kX2xvYykge1xuICAgICAgICAgICAgLy8gQ2FuJ3QgZmluZCB2YWxpZCB0cmFpbGluZyBjb250ZXh0LiAgRHJvcCB0aGlzIHBhdGNoLlxuICAgICAgICAgICAgc3RhcnRfbG9jID0gLTE7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGFydF9sb2MgPSB0aGlzLm1hdGNoX21haW4odGV4dCwgdGV4dDEsIGV4cGVjdGVkX2xvYyk7XG4gICAgICB9XG4gICAgICBpZiAoc3RhcnRfbG9jID09IC0xKSB7XG4gICAgICAgIC8vIE5vIG1hdGNoIGZvdW5kLiAgOihcbiAgICAgICAgcmVzdWx0c1t4XSA9IGZhbHNlO1xuICAgICAgICAvLyBTdWJ0cmFjdCB0aGUgZGVsdGEgZm9yIHRoaXMgZmFpbGVkIHBhdGNoIGZyb20gc3Vic2VxdWVudCBwYXRjaGVzLlxuICAgICAgICBkZWx0YSAtPSBwYXRjaGVzW3hdLmxlbmd0aDIgLSBwYXRjaGVzW3hdLmxlbmd0aDE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBGb3VuZCBhIG1hdGNoLiAgOilcbiAgICAgICAgcmVzdWx0c1t4XSA9IHRydWU7XG4gICAgICAgIGRlbHRhID0gc3RhcnRfbG9jIC0gZXhwZWN0ZWRfbG9jO1xuICAgICAgICBsZXQgdGV4dDI7XG4gICAgICAgIGlmIChlbmRfbG9jID09IC0xKSB7XG4gICAgICAgICAgdGV4dDIgPSB0ZXh0LnN1YnN0cmluZyhzdGFydF9sb2MsIHN0YXJ0X2xvYyArIHRleHQxLmxlbmd0aCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGV4dDIgPSB0ZXh0LnN1YnN0cmluZyhzdGFydF9sb2MsIGVuZF9sb2MgKyB0aGlzLk1hdGNoX01heEJpdHMpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0ZXh0MSA9PSB0ZXh0Mikge1xuICAgICAgICAgIC8vIFBlcmZlY3QgbWF0Y2gsIGp1c3Qgc2hvdmUgdGhlIHJlcGxhY2VtZW50IHRleHQgaW4uXG4gICAgICAgICAgdGV4dCA9IHRleHQuc3Vic3RyaW5nKDAsIHN0YXJ0X2xvYykgK1xuICAgICAgICAgICAgICAgIHRoaXMuZGlmZl90ZXh0MihwYXRjaGVzW3hdLmRpZmZzKSArXG4gICAgICAgICAgICAgICAgdGV4dC5zdWJzdHJpbmcoc3RhcnRfbG9jICsgdGV4dDEubGVuZ3RoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBJbXBlcmZlY3QgbWF0Y2guICBSdW4gYSBkaWZmIHRvIGdldCBhIGZyYW1ld29yayBvZiBlcXVpdmFsZW50XG4gICAgICAgICAgLy8gaW5kaWNlcy5cbiAgICAgICAgICBjb25zdCBkaWZmcyA9IHRoaXMuZGlmZl9tYWluKHRleHQxLCB0ZXh0MiwgZmFsc2UpO1xuICAgICAgICAgIGlmICh0ZXh0MS5sZW5ndGggPiB0aGlzLk1hdGNoX01heEJpdHMgJiZcbiAgICAgICAgICAgICAgdGhpcy5kaWZmX2xldmVuc2h0ZWluKGRpZmZzKSAvIHRleHQxLmxlbmd0aCA+XG4gICAgICAgICAgICAgIHRoaXMuUGF0Y2hfRGVsZXRlVGhyZXNob2xkKSB7XG4gICAgICAgICAgICAvLyBUaGUgZW5kIHBvaW50cyBtYXRjaCwgYnV0IHRoZSBjb250ZW50IGlzIHVuYWNjZXB0YWJseSBiYWQuXG4gICAgICAgICAgICByZXN1bHRzW3hdID0gZmFsc2U7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZGlmZl9jbGVhbnVwU2VtYW50aWNMb3NzbGVzcyhkaWZmcyk7XG4gICAgICAgICAgICBsZXQgaW5kZXgxID0gMDtcbiAgICAgICAgICAgIGxldCBpbmRleDI7XG4gICAgICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IHBhdGNoZXNbeF0uZGlmZnMubGVuZ3RoOyB5KyspIHtcbiAgICAgICAgICAgICAgY29uc3QgbW9kID0gcGF0Y2hlc1t4XS5kaWZmc1t5XTtcbiAgICAgICAgICAgICAgaWYgKG1vZFswXSAhPT0gRGlmZk9wLkVxdWFsKSB7XG4gICAgICAgICAgICAgICAgaW5kZXgyID0gdGhpcy5kaWZmX3hJbmRleChkaWZmcywgaW5kZXgxKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAobW9kWzBdID09PSBEaWZmT3AuSW5zZXJ0KSB7ICAvLyBJbnNlcnRpb25cbiAgICAgICAgICAgICAgICB0ZXh0ID0gdGV4dC5zdWJzdHJpbmcoMCwgc3RhcnRfbG9jICsgaW5kZXgyKSArIG1vZFsxXSArXG4gICAgICAgICAgICAgICAgICAgICAgdGV4dC5zdWJzdHJpbmcoc3RhcnRfbG9jICsgaW5kZXgyKTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChtb2RbMF0gPT09IERpZmZPcC5EZWxldGUpIHsgIC8vIERlbGV0aW9uXG4gICAgICAgICAgICAgICAgdGV4dCA9IHRleHQuc3Vic3RyaW5nKDAsIHN0YXJ0X2xvYyArIGluZGV4MikgK1xuICAgICAgICAgICAgICAgICAgICAgIHRleHQuc3Vic3RyaW5nKHN0YXJ0X2xvYyArIHRoaXMuZGlmZl94SW5kZXgoZGlmZnMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4MSArIG1vZFsxXS5sZW5ndGgpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAobW9kWzBdICE9PSBEaWZmT3AuRGVsZXRlKSB7XG4gICAgICAgICAgICAgICAgaW5kZXgxICs9IG1vZFsxXS5sZW5ndGg7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gU3RyaXAgdGhlIHBhZGRpbmcgb2ZmLlxuICAgIHRleHQgPSB0ZXh0LnN1YnN0cmluZyhudWxsUGFkZGluZy5sZW5ndGgsIHRleHQubGVuZ3RoIC0gbnVsbFBhZGRpbmcubGVuZ3RoKTtcbiAgICByZXR1cm4gW3RleHQsIHJlc3VsdHNdO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIEFkZCBzb21lIHBhZGRpbmcgb24gdGV4dCBzdGFydCBhbmQgZW5kIHNvIHRoYXQgZWRnZXMgY2FuIG1hdGNoIHNvbWV0aGluZy5cbiAgICogSW50ZW5kZWQgdG8gYmUgY2FsbGVkIG9ubHkgZnJvbSB3aXRoaW4gcGF0Y2hfYXBwbHkuXG4gICAqIEBwYXJhbSAgcGF0Y2hlcyBBcnJheSBvZiBQYXRjaCBvYmplY3RzLlxuICAgKiBAcmV0dXJuICBUaGUgcGFkZGluZyBzdHJpbmcgYWRkZWQgdG8gZWFjaCBzaWRlLlxuICAgKi9cbiAgICBwYXRjaF9hZGRQYWRkaW5nIChwYXRjaGVzOiBBcnJheTxwYXRjaF9vYmo+KSB7XG4gICAgY29uc3QgcGFkZGluZ0xlbmd0aCA9IHRoaXMuUGF0Y2hfTWFyZ2luO1xuICAgIGxldCBudWxsUGFkZGluZyA9ICcnO1xuICAgIGZvciAobGV0IHggPSAxOyB4IDw9IHBhZGRpbmdMZW5ndGg7IHgrKykge1xuICAgICAgbnVsbFBhZGRpbmcgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSh4KTtcbiAgICB9XG5cbiAgICAvLyBCdW1wIGFsbCB0aGUgcGF0Y2hlcyBmb3J3YXJkLlxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgcGF0Y2hlcy5sZW5ndGg7IHgrKykge1xuICAgICAgcGF0Y2hlc1t4XS5zdGFydDEgKz0gcGFkZGluZ0xlbmd0aDtcbiAgICAgIHBhdGNoZXNbeF0uc3RhcnQyICs9IHBhZGRpbmdMZW5ndGg7XG4gICAgfVxuXG4gICAgLy8gQWRkIHNvbWUgcGFkZGluZyBvbiBzdGFydCBvZiBmaXJzdCBkaWZmLlxuICAgIGxldCBwYXRjaCA9IHBhdGNoZXNbMF07XG4gICAgbGV0IGRpZmZzID0gcGF0Y2guZGlmZnM7XG4gICAgaWYgKGRpZmZzLmxlbmd0aCA9PSAwIHx8IGRpZmZzWzBdWzBdICE9IERpZmZPcC5FcXVhbCkge1xuICAgICAgLy8gQWRkIG51bGxQYWRkaW5nIGVxdWFsaXR5LlxuICAgICAgZGlmZnMudW5zaGlmdChbRGlmZk9wLkVxdWFsLCBudWxsUGFkZGluZ10pO1xuICAgICAgcGF0Y2guc3RhcnQxIC09IHBhZGRpbmdMZW5ndGg7ICAvLyBTaG91bGQgYmUgMC5cbiAgICAgIHBhdGNoLnN0YXJ0MiAtPSBwYWRkaW5nTGVuZ3RoOyAgLy8gU2hvdWxkIGJlIDAuXG4gICAgICBwYXRjaC5sZW5ndGgxICs9IHBhZGRpbmdMZW5ndGg7XG4gICAgICBwYXRjaC5sZW5ndGgyICs9IHBhZGRpbmdMZW5ndGg7XG4gICAgfSBlbHNlIGlmIChwYWRkaW5nTGVuZ3RoID4gZGlmZnNbMF1bMV0ubGVuZ3RoKSB7XG4gICAgICAvLyBHcm93IGZpcnN0IGVxdWFsaXR5LlxuICAgICAgY29uc3QgZXh0cmFMZW5ndGggPSBwYWRkaW5nTGVuZ3RoIC0gZGlmZnNbMF1bMV0ubGVuZ3RoO1xuICAgICAgZGlmZnNbMF1bMV0gPSBudWxsUGFkZGluZy5zdWJzdHJpbmcoZGlmZnNbMF1bMV0ubGVuZ3RoKSArIGRpZmZzWzBdWzFdO1xuICAgICAgcGF0Y2guc3RhcnQxIC09IGV4dHJhTGVuZ3RoO1xuICAgICAgcGF0Y2guc3RhcnQyIC09IGV4dHJhTGVuZ3RoO1xuICAgICAgcGF0Y2gubGVuZ3RoMSArPSBleHRyYUxlbmd0aDtcbiAgICAgIHBhdGNoLmxlbmd0aDIgKz0gZXh0cmFMZW5ndGg7XG4gICAgfVxuXG4gICAgLy8gQWRkIHNvbWUgcGFkZGluZyBvbiBlbmQgb2YgbGFzdCBkaWZmLlxuICAgIHBhdGNoID0gcGF0Y2hlc1twYXRjaGVzLmxlbmd0aCAtIDFdO1xuICAgIGRpZmZzID0gcGF0Y2guZGlmZnM7XG4gICAgaWYgKGRpZmZzLmxlbmd0aCA9PSAwIHx8IGRpZmZzW2RpZmZzLmxlbmd0aCAtIDFdWzBdICE9IERpZmZPcC5FcXVhbCkge1xuICAgICAgLy8gQWRkIG51bGxQYWRkaW5nIGVxdWFsaXR5LlxuICAgICAgZGlmZnMucHVzaChbRGlmZk9wLkVxdWFsLCBudWxsUGFkZGluZ10pO1xuICAgICAgcGF0Y2gubGVuZ3RoMSArPSBwYWRkaW5nTGVuZ3RoO1xuICAgICAgcGF0Y2gubGVuZ3RoMiArPSBwYWRkaW5nTGVuZ3RoO1xuICAgIH0gZWxzZSBpZiAocGFkZGluZ0xlbmd0aCA+IGRpZmZzW2RpZmZzLmxlbmd0aCAtIDFdWzFdLmxlbmd0aCkge1xuICAgICAgLy8gR3JvdyBsYXN0IGVxdWFsaXR5LlxuICAgICAgY29uc3QgZXh0cmFMZW5ndGggPSBwYWRkaW5nTGVuZ3RoIC0gZGlmZnNbZGlmZnMubGVuZ3RoIC0gMV1bMV0ubGVuZ3RoO1xuICAgICAgZGlmZnNbZGlmZnMubGVuZ3RoIC0gMV1bMV0gKz0gbnVsbFBhZGRpbmcuc3Vic3RyaW5nKDAsIGV4dHJhTGVuZ3RoKTtcbiAgICAgIHBhdGNoLmxlbmd0aDEgKz0gZXh0cmFMZW5ndGg7XG4gICAgICBwYXRjaC5sZW5ndGgyICs9IGV4dHJhTGVuZ3RoO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsUGFkZGluZztcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBMb29rIHRocm91Z2ggdGhlIHBhdGNoZXMgYW5kIGJyZWFrIHVwIGFueSB3aGljaCBhcmUgbG9uZ2VyIHRoYW4gdGhlIG1heGltdW1cbiAgICogbGltaXQgb2YgdGhlIG1hdGNoIGFsZ29yaXRobS5cbiAgICogSW50ZW5kZWQgdG8gYmUgY2FsbGVkIG9ubHkgZnJvbSB3aXRoaW4gcGF0Y2hfYXBwbHkuXG4gICAqIEBwYXJhbSAgcGF0Y2hlcyBBcnJheSBvZiBQYXRjaCBvYmplY3RzLlxuICAgKi9cbiAgICBwYXRjaF9zcGxpdE1heCA9IGZ1bmN0aW9uKHBhdGNoZXM6IEFycmF5PHBhdGNoX29iaj4pIHtcbiAgICBjb25zdCBwYXRjaF9zaXplID0gdGhpcy5NYXRjaF9NYXhCaXRzO1xuICAgIGZvciAobGV0IHggPSAwOyB4IDwgcGF0Y2hlcy5sZW5ndGg7IHgrKykge1xuICAgICAgaWYgKHBhdGNoZXNbeF0ubGVuZ3RoMSA8PSBwYXRjaF9zaXplKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgYmlncGF0Y2ggPSBwYXRjaGVzW3hdO1xuICAgICAgLy8gUmVtb3ZlIHRoZSBiaWcgb2xkIHBhdGNoLlxuICAgICAgcGF0Y2hlcy5zcGxpY2UoeC0tLCAxKTtcbiAgICAgIGxldCBzdGFydDEgPSBiaWdwYXRjaC5zdGFydDE7XG4gICAgICBsZXQgc3RhcnQyID0gYmlncGF0Y2guc3RhcnQyO1xuICAgICAgbGV0IHByZWNvbnRleHQgPSAnJztcbiAgICAgIHdoaWxlIChiaWdwYXRjaC5kaWZmcy5sZW5ndGggIT09IDApIHtcbiAgICAgICAgLy8gQ3JlYXRlIG9uZSBvZiBzZXZlcmFsIHNtYWxsZXIgcGF0Y2hlcy5cbiAgICAgICAgY29uc3QgcGF0Y2ggPSBuZXcgcGF0Y2hfb2JqKCk7XG4gICAgICAgIGxldCBlbXB0eSA9IHRydWU7XG4gICAgICAgIHBhdGNoLnN0YXJ0MSA9IHN0YXJ0MSAtIHByZWNvbnRleHQubGVuZ3RoO1xuICAgICAgICBwYXRjaC5zdGFydDIgPSBzdGFydDIgLSBwcmVjb250ZXh0Lmxlbmd0aDtcbiAgICAgICAgaWYgKHByZWNvbnRleHQgIT09ICcnKSB7XG4gICAgICAgICAgcGF0Y2gubGVuZ3RoMSA9IHBhdGNoLmxlbmd0aDIgPSBwcmVjb250ZXh0Lmxlbmd0aDtcbiAgICAgICAgICBwYXRjaC5kaWZmcy5wdXNoKFtEaWZmT3AuRXF1YWwsIHByZWNvbnRleHRdKTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoYmlncGF0Y2guZGlmZnMubGVuZ3RoICE9PSAwICYmXG4gICAgICAgICAgICAgIHBhdGNoLmxlbmd0aDEgPCBwYXRjaF9zaXplIC0gdGhpcy5QYXRjaF9NYXJnaW4pIHtcbiAgICAgICAgICBjb25zdCBkaWZmX3R5cGUgPSBiaWdwYXRjaC5kaWZmc1swXVswXTtcbiAgICAgICAgICBsZXQgZGlmZl90ZXh0ID0gYmlncGF0Y2guZGlmZnNbMF1bMV07XG4gICAgICAgICAgaWYgKGRpZmZfdHlwZSA9PT0gRGlmZk9wLkluc2VydCkge1xuICAgICAgICAgICAgLy8gSW5zZXJ0aW9ucyBhcmUgaGFybWxlc3MuXG4gICAgICAgICAgICBwYXRjaC5sZW5ndGgyICs9IGRpZmZfdGV4dC5sZW5ndGg7XG4gICAgICAgICAgICBzdGFydDIgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcbiAgICAgICAgICAgIHBhdGNoLmRpZmZzLnB1c2goYmlncGF0Y2guZGlmZnMuc2hpZnQoKSk7XG4gICAgICAgICAgICBlbXB0eSA9IGZhbHNlO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZGlmZl90eXBlID09PSBEaWZmT3AuRGVsZXRlICYmIHBhdGNoLmRpZmZzLmxlbmd0aCA9PSAxICYmXG4gICAgICAgICAgICAgICAgICAgIHBhdGNoLmRpZmZzWzBdWzBdID09IERpZmZPcC5FcXVhbCAmJlxuICAgICAgICAgICAgICAgICAgICBkaWZmX3RleHQubGVuZ3RoID4gMiAqIHBhdGNoX3NpemUpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBsYXJnZSBkZWxldGlvbi4gIExldCBpdCBwYXNzIGluIG9uZSBjaHVuay5cbiAgICAgICAgICAgIHBhdGNoLmxlbmd0aDEgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcbiAgICAgICAgICAgIHN0YXJ0MSArPSBkaWZmX3RleHQubGVuZ3RoO1xuICAgICAgICAgICAgZW1wdHkgPSBmYWxzZTtcbiAgICAgICAgICAgIHBhdGNoLmRpZmZzLnB1c2goW2RpZmZfdHlwZSwgZGlmZl90ZXh0XSk7XG4gICAgICAgICAgICBiaWdwYXRjaC5kaWZmcy5zaGlmdCgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBEZWxldGlvbiBvciBlcXVhbGl0eS4gIE9ubHkgdGFrZSBhcyBtdWNoIGFzIHdlIGNhbiBzdG9tYWNoLlxuICAgICAgICAgICAgZGlmZl90ZXh0ID0gZGlmZl90ZXh0LnN1YnN0cmluZygwLFxuICAgICAgICAgICAgICAgIHBhdGNoX3NpemUgLSBwYXRjaC5sZW5ndGgxIC0gdGhpcy5QYXRjaF9NYXJnaW4pO1xuICAgICAgICAgICAgcGF0Y2gubGVuZ3RoMSArPSBkaWZmX3RleHQubGVuZ3RoO1xuICAgICAgICAgICAgc3RhcnQxICs9IGRpZmZfdGV4dC5sZW5ndGg7XG4gICAgICAgICAgICBpZiAoZGlmZl90eXBlID09PSBEaWZmT3AuRXF1YWwpIHtcbiAgICAgICAgICAgICAgcGF0Y2gubGVuZ3RoMiArPSBkaWZmX3RleHQubGVuZ3RoO1xuICAgICAgICAgICAgICBzdGFydDIgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGVtcHR5ID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYXRjaC5kaWZmcy5wdXNoKFtkaWZmX3R5cGUsIGRpZmZfdGV4dF0pO1xuICAgICAgICAgICAgaWYgKGRpZmZfdGV4dCA9PSBiaWdwYXRjaC5kaWZmc1swXVsxXSkge1xuICAgICAgICAgICAgICBiaWdwYXRjaC5kaWZmcy5zaGlmdCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgYmlncGF0Y2guZGlmZnNbMF1bMV0gPVxuICAgICAgICAgICAgICAgICAgYmlncGF0Y2guZGlmZnNbMF1bMV0uc3Vic3RyaW5nKGRpZmZfdGV4dC5sZW5ndGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBDb21wdXRlIHRoZSBoZWFkIGNvbnRleHQgZm9yIHRoZSBuZXh0IHBhdGNoLlxuICAgICAgICBwcmVjb250ZXh0ID0gdGhpcy5kaWZmX3RleHQyKHBhdGNoLmRpZmZzKTtcbiAgICAgICAgcHJlY29udGV4dCA9XG4gICAgICAgICAgICBwcmVjb250ZXh0LnN1YnN0cmluZyhwcmVjb250ZXh0Lmxlbmd0aCAtIHRoaXMuUGF0Y2hfTWFyZ2luKTtcbiAgICAgICAgLy8gQXBwZW5kIHRoZSBlbmQgY29udGV4dCBmb3IgdGhpcyBwYXRjaC5cbiAgICAgICAgY29uc3QgcG9zdGNvbnRleHQgPSB0aGlzLmRpZmZfdGV4dDEoYmlncGF0Y2guZGlmZnMpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc3Vic3RyaW5nKDAsIHRoaXMuUGF0Y2hfTWFyZ2luKTtcbiAgICAgICAgaWYgKHBvc3Rjb250ZXh0ICE9PSAnJykge1xuICAgICAgICAgIHBhdGNoLmxlbmd0aDEgKz0gcG9zdGNvbnRleHQubGVuZ3RoO1xuICAgICAgICAgIHBhdGNoLmxlbmd0aDIgKz0gcG9zdGNvbnRleHQubGVuZ3RoO1xuICAgICAgICAgIGlmIChwYXRjaC5kaWZmcy5sZW5ndGggIT09IDAgJiZcbiAgICAgICAgICAgICAgcGF0Y2guZGlmZnNbcGF0Y2guZGlmZnMubGVuZ3RoIC0gMV1bMF0gPT09IERpZmZPcC5FcXVhbCkge1xuICAgICAgICAgICAgcGF0Y2guZGlmZnNbcGF0Y2guZGlmZnMubGVuZ3RoIC0gMV1bMV0gKz0gcG9zdGNvbnRleHQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBhdGNoLmRpZmZzLnB1c2goW0RpZmZPcC5FcXVhbCwgcG9zdGNvbnRleHRdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFlbXB0eSkge1xuICAgICAgICAgIHBhdGNoZXMuc3BsaWNlKCsreCwgMCwgcGF0Y2gpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG5cbiAgLyoqXG4gICAqIFRha2UgYSBsaXN0IG9mIHBhdGNoZXMgYW5kIHJldHVybiBhIHRleHR1YWwgcmVwcmVzZW50YXRpb24uXG4gICAqIEBwYXJhbSAgcGF0Y2hlcyBBcnJheSBvZiBQYXRjaCBvYmplY3RzLlxuICAgKiBAcmV0dXJuICBUZXh0IHJlcHJlc2VudGF0aW9uIG9mIHBhdGNoZXMuXG4gICAqL1xuICAgIHBhdGNoX3RvVGV4dCAocGF0Y2hlczogQXJyYXk8cGF0Y2hfb2JqPikge1xuICAgIGNvbnN0IHRleHQgPSBbXTtcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHBhdGNoZXMubGVuZ3RoOyB4KyspIHtcbiAgICAgIHRleHRbeF0gPSBwYXRjaGVzW3hdO1xuICAgIH1cbiAgICByZXR1cm4gdGV4dC5qb2luKCcnKTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBQYXJzZSBhIHRleHR1YWwgcmVwcmVzZW50YXRpb24gb2YgcGF0Y2hlcyBhbmQgcmV0dXJuIGEgbGlzdCBvZiBQYXRjaCBvYmplY3RzLlxuICAgKiBAcGFyYW0gIHRleHRsaW5lIFRleHQgcmVwcmVzZW50YXRpb24gb2YgcGF0Y2hlcy5cbiAgICogQHJldHVybiAgQXJyYXkgb2YgUGF0Y2ggb2JqZWN0cy5cbiAgICogQHRocm93cyB7IUVycm9yfSBJZiBpbnZhbGlkIGlucHV0LlxuICAgKi9cbiAgICBwYXRjaF9mcm9tVGV4dCAodGV4dGxpbmU6IHN0cmluZyk6IEFycmF5PHBhdGNoX29iaj4ge1xuICAgIGNvbnN0IHBhdGNoZXM6IEFycmF5PHBhdGNoX29iaj4gPSBbXTtcbiAgICBpZiAoIXRleHRsaW5lKSB7XG4gICAgICByZXR1cm4gcGF0Y2hlcztcbiAgICB9XG4gICAgY29uc3QgdGV4dCA9IHRleHRsaW5lLnNwbGl0KCdcXG4nKTtcbiAgICBsZXQgdGV4dFBvaW50ZXIgPSAwO1xuICAgIGNvbnN0IHBhdGNoSGVhZGVyID0gL15AQCAtKFxcZCspLD8oXFxkKikgXFwrKFxcZCspLD8oXFxkKikgQEAkLztcbiAgICB3aGlsZSAodGV4dFBvaW50ZXIgPCB0ZXh0Lmxlbmd0aCkge1xuICAgICAgY29uc3QgbSA9IHRleHRbdGV4dFBvaW50ZXJdLm1hdGNoKHBhdGNoSGVhZGVyKTtcbiAgICAgIGlmICghbSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcGF0Y2ggc3RyaW5nOiAnICsgdGV4dFt0ZXh0UG9pbnRlcl0pO1xuICAgICAgfVxuICAgICAgY29uc3QgcGF0Y2ggPSBuZXcgcGF0Y2hfb2JqKCk7XG4gICAgICBwYXRjaGVzLnB1c2gocGF0Y2gpO1xuICAgICAgcGF0Y2guc3RhcnQxID0gcGFyc2VJbnQobVsxXSwgMTApO1xuICAgICAgaWYgKG1bMl0gPT09ICcnKSB7XG4gICAgICAgIHBhdGNoLnN0YXJ0MS0tO1xuICAgICAgICBwYXRjaC5sZW5ndGgxID0gMTtcbiAgICAgIH0gZWxzZSBpZiAobVsyXSA9PSAnMCcpIHtcbiAgICAgICAgcGF0Y2gubGVuZ3RoMSA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXRjaC5zdGFydDEtLTtcbiAgICAgICAgcGF0Y2gubGVuZ3RoMSA9IHBhcnNlSW50KG1bMl0sIDEwKTtcbiAgICAgIH1cblxuICAgICAgcGF0Y2guc3RhcnQyID0gcGFyc2VJbnQobVszXSwgMTApO1xuICAgICAgaWYgKG1bNF0gPT09ICcnKSB7XG4gICAgICAgIHBhdGNoLnN0YXJ0Mi0tO1xuICAgICAgICBwYXRjaC5sZW5ndGgyID0gMTtcbiAgICAgIH0gZWxzZSBpZiAobVs0XSA9PSAnMCcpIHtcbiAgICAgICAgcGF0Y2gubGVuZ3RoMiA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXRjaC5zdGFydDItLTtcbiAgICAgICAgcGF0Y2gubGVuZ3RoMiA9IHBhcnNlSW50KG1bNF0sIDEwKTtcbiAgICAgIH1cbiAgICAgIHRleHRQb2ludGVyKys7XG5cbiAgICAgIHdoaWxlICh0ZXh0UG9pbnRlciA8IHRleHQubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IHNpZ24gPSB0ZXh0W3RleHRQb2ludGVyXS5jaGFyQXQoMCk7XG4gICAgICAgIGxldCBsaW5lOiBzdHJpbmc7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgbGluZSA9IGRlY29kZVVSSSh0ZXh0W3RleHRQb2ludGVyXS5zdWJzdHJpbmcoMSkpO1xuICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgIC8vIE1hbGZvcm1lZCBVUkkgc2VxdWVuY2UuXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbGxlZ2FsIGVzY2FwZSBpbiBwYXRjaF9mcm9tVGV4dDogJyArIGxpbmUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzaWduID09ICctJykge1xuICAgICAgICAgIC8vIERlbGV0aW9uLlxuICAgICAgICAgIHBhdGNoLmRpZmZzLnB1c2goW0RpZmZPcC5EZWxldGUsIGxpbmVdKTtcbiAgICAgICAgfSBlbHNlIGlmIChzaWduID09ICcrJykge1xuICAgICAgICAgIC8vIEluc2VydGlvbi5cbiAgICAgICAgICBwYXRjaC5kaWZmcy5wdXNoKFtEaWZmT3AuSW5zZXJ0LCBsaW5lXSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2lnbiA9PSAnICcpIHtcbiAgICAgICAgICAvLyBNaW5vciBlcXVhbGl0eS5cbiAgICAgICAgICBwYXRjaC5kaWZmcy5wdXNoKFtEaWZmT3AuRXF1YWwsIGxpbmVdKTtcbiAgICAgICAgfSBlbHNlIGlmIChzaWduID09ICdAJykge1xuICAgICAgICAgIC8vIFN0YXJ0IG9mIG5leHQgcGF0Y2guXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH0gZWxzZSBpZiAoc2lnbiA9PT0gJycpIHtcbiAgICAgICAgICAvLyBCbGFuayBsaW5lPyAgV2hhdGV2ZXIuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gV1RGP1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwYXRjaCBtb2RlIFwiJyArIHNpZ24gKyAnXCIgaW46ICcgKyBsaW5lKTtcbiAgICAgICAgfVxuICAgICAgICB0ZXh0UG9pbnRlcisrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGF0Y2hlcztcbiAgfTtcblxufVxuXG5cbi8qKlxuICogQ2xhc3MgcmVwcmVzZW50aW5nIG9uZSBwYXRjaCBvcGVyYXRpb24uXG5cbiAqL1xuZXhwb3J0IGNsYXNzIHBhdGNoX29iaiB7XG5cbiAgY29uc3RydWN0b3IoKSB7ICB9XG5cbiAgZGlmZnM6IEFycmF5PERpZmY+ID0gW107XG4gIHN0YXJ0MTogbnVtYmVyID0gbnVsbDtcbiAgc3RhcnQyOiBudW1iZXIgPSBudWxsO1xuICBsZW5ndGgxOiBudW1iZXIgPSAwO1xuICBsZW5ndGgyOiBudW1iZXIgPSAwO1xuXG4gIC8qKlxuICAgKiBFbW11bGF0ZSBHTlUgZGlmZidzIGZvcm1hdC5cbiAgICogSGVhZGVyOiBAQCAtMzgyLDggKzQ4MSw5IEBAXG4gICAqIEluZGljaWVzIGFyZSBwcmludGVkIGFzIDEtYmFzZWQsIG5vdCAwLWJhc2VkLlxuICAgKi9cbiAgdG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICBsZXQgY29vcmRzMSwgY29vcmRzMjtcbiAgICBpZiAodGhpcy5sZW5ndGgxID09PSAwKSB7XG4gICAgICBjb29yZHMxID0gdGhpcy5zdGFydDEgKyAnLDAnO1xuICAgIH0gZWxzZSBpZiAodGhpcy5sZW5ndGgxID09IDEpIHtcbiAgICAgIGNvb3JkczEgPSB0aGlzLnN0YXJ0MSArIDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvb3JkczEgPSAodGhpcy5zdGFydDEgKyAxKSArICcsJyArIHRoaXMubGVuZ3RoMTtcbiAgICB9XG4gICAgaWYgKHRoaXMubGVuZ3RoMiA9PT0gMCkge1xuICAgICAgY29vcmRzMiA9IHRoaXMuc3RhcnQyICsgJywwJztcbiAgICB9IGVsc2UgaWYgKHRoaXMubGVuZ3RoMiA9PSAxKSB7XG4gICAgICBjb29yZHMyID0gdGhpcy5zdGFydDIgKyAxO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb29yZHMyID0gKHRoaXMuc3RhcnQyICsgMSkgKyAnLCcgKyB0aGlzLmxlbmd0aDI7XG4gICAgfVxuICAgIGNvbnN0IHRleHQgPSBbJ0BAIC0nICsgY29vcmRzMSArICcgKycgKyBjb29yZHMyICsgJyBAQFxcbiddO1xuICAgIGxldCBvcDtcbiAgICAvLyBFc2NhcGUgdGhlIGJvZHkgb2YgdGhlIHBhdGNoIHdpdGggJXh4IG5vdGF0aW9uLlxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgdGhpcy5kaWZmcy5sZW5ndGg7IHgrKykge1xuICAgICAgc3dpdGNoICh0aGlzLmRpZmZzW3hdWzBdKSB7XG4gICAgICAgIGNhc2UgRGlmZk9wLkluc2VydDpcbiAgICAgICAgICBvcCA9ICcrJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBEaWZmT3AuRGVsZXRlOlxuICAgICAgICAgIG9wID0gJy0nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIERpZmZPcC5FcXVhbDpcbiAgICAgICAgICBvcCA9ICcgJztcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHRleHRbeCArIDFdID0gb3AgKyBlbmNvZGVVUkkodGhpcy5kaWZmc1t4XVsxXSkgKyAnXFxuJztcbiAgICB9XG4gICAgcmV0dXJuIHRleHQuam9pbignJykucmVwbGFjZSgvJTIwL2csICcgJyk7XG4gIH1cbn1cblxuZXhwb3J0IHsgRGlmZk1hdGNoUGF0Y2ggfTtcbiJdfQ==