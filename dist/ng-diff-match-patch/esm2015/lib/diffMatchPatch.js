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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZk1hdGNoUGF0Y2guanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZy1kaWZmLW1hdGNoLXBhdGNoLyIsInNvdXJjZXMiOlsibGliL2RpZmZNYXRjaFBhdGNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztJQUNFLFVBQVc7SUFDWCxRQUFTO0lBQ1QsU0FBVTs7Ozs7Ozs7O0FBU1o7SUFFRTs7Ozs0QkFNZSxHQUFHOzs2QkFFRixDQUFDOzsrQkFFQyxHQUFHOzs7OzhCQUlKLElBQUk7Ozs7O3FDQUtHLEdBQUc7OzRCQUVaLENBQUM7OzZCQUdBLEVBQUU7Ozs7OztnQ0FRQyxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUM7K0JBQ25CLElBQUksTUFBTSxDQUFDLFVBQVUsQ0FBQztrQ0FDbkIsSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDO29DQUN0QixJQUFJLE1BQU0sQ0FBQyxlQUFlLENBQUM7Ozs7OzsrQkFzbkM5QixVQUFTLEtBQWtCOztZQUM3QyxNQUFNLElBQUksR0FBRyxFQUFFLENBQUM7O1lBQ2hCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQzs7WUFDekIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDOztZQUN4QixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUM7O1lBQ3hCLE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQztZQUMzQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzs7Z0JBQ3RDLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7Z0JBQ3ZCLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7Z0JBQ3pCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FB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Q0FBQzs7WUFFM0IsTUFBTSxDQUFDLElBQUksQ0FBQztTQUNiOztRQUNELE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7O1FBQzdELE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDOUQsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDbEUsTUFBTSxDQUFDLElBQUksQ0FBQztTQUNiOztRQUNELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQzs7UUFJakIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQzNCLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQzs7UUFFL0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQzNCLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQzs7UUFDL0QsSUFBSSxFQUFFLENBQUM7UUFDUCxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDakIsTUFBTSxDQUFDLElBQUksQ0FBQztTQUNiO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNoQixFQUFFLEdBQUcsR0FBRyxDQUFDO1NBQ1Y7UUFBQyxJQUFJLENBQUMsRUFB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LENBQUMsTUFBTSxHQUFHLE9BQU8sR0FBRyxJQUFJLEdBQUcsT0FBTyxHQUFHLE9BQU8sQ0FBQyxDQUFDOztZQUMzRCxJQUFJLEVBQUUsQ0FBQzs7WUFFUCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzNDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUN6Qjt3QkFDRSxFQUFFLEdBQUcsR0FBRyxDQUFDO3dCQUNULEtBQUssQ0FBQztvQkFDUjt3QkFDRSxFQUFFLEdBQUcsR0FBRyxDQUFDO3dCQUNULEtBQUssQ0FBQztvQkFDUjt3QkFDRSxFQUFFLEdBQUcsR0FBRyxDQUFDO3dCQUNULEtBQUssQ0FBQztpQkFDVDtnQkFDRCxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQzthQUN2RDtZQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDM0M7S0EvQ2lCO0NBZ0RuQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFRCxPQUFPLEVBQUUsY0FBYyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgZW51bSBEaWZmT3Age1xyXG4gIERlbGV0ZSA9IC0xLFxyXG4gIEVxdWFsID0gMCxcclxuICBJbnNlcnQgPSAxXHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIERpZmYgPSBbRGlmZk9wLCBzdHJpbmddO1xyXG5cclxuLyoqXHJcbiAqIENsYXNzIGNvbnRhaW5pbmcgdGhlIGRpZmYsIG1hdGNoIGFuZCBwYXRjaCBtZXRob2RzLlxyXG5cclxuICovXHJcbmNsYXNzIERpZmZNYXRjaFBhdGNoIHtcclxuXHJcbiAgY29uc3RydWN0b3IoKSB7ICB9XHJcblxyXG4gIC8vIERlZmF1bHRzLlxyXG4gIC8vIFJlZGVmaW5lIHRoZXNlIGluIHlvdXIgcHJvZ3JhbSB0byBvdmVycmlkZSB0aGUgZGVmYXVsdHMuXHJcblxyXG4gIC8vIE51bWJlciBvZiBzZWNvbmRzIHRvIG1hcCBhIGRpZmYgYmVmb3JlIGdpdmluZyB1cCAoMCBmb3IgaW5maW5pdHkpLlxyXG4gIERpZmZfVGltZW91dCA9IDEuMDtcclxuICAvLyBDb3N0IG9mIGFuIGVtcHR5IGVkaXQgb3BlcmF0aW9uIGluIHRlcm1zIG9mIGVkaXQgY2hhcmFjdGVycy5cclxuICBEaWZmX0VkaXRDb3N0ID0gNDtcclxuICAvLyBBdCB3aGF0IHBvaW50IGlzIG5vIG1hdGNoIGRlY2xhcmVkICgwLjAgPSBwZXJmZWN0aW9uLCAxLjAgPSB2ZXJ5IGxvb3NlKS5cclxuICBNYXRjaF9UaHJlc2hvbGQgPSAwLjU7XHJcbiAgLy8gSG93IGZhciB0byBzZWFyY2ggZm9yIGEgbWF0Y2ggKDAgPSBleGFjdCBsb2NhdGlvbiwgMTAwMCsgPSBicm9hZCBtYXRjaCkuXHJcbiAgLy8gQSBtYXRjaCB0aGlzIG1hbnkgY2hhcmFjdGVycyBhd2F5IGZyb20gdGhlIGV4cGVjdGVkIGxvY2F0aW9uIHdpbGwgYWRkXHJcbiAgLy8gMS4wIHRvIHRoZSBzY29yZSAoMC4wIGlzIGEgcGVyZmVjdCBtYXRjaCkuXHJcbiAgTWF0Y2hfRGlzdGFuY2UgPSAxMDAwO1xyXG4gIC8vIFdoZW4gZGVsZXRpbmcgYSBsYXJnZSBibG9jayBvZiB0ZXh0IChvdmVyIH42NCBjaGFyYWN0ZXJzKSwgaG93IGNsb3NlIGRvXHJcbiAgLy8gdGhlIGNvbnRlbnRzIGhhdmUgdG8gYmUgdG8gbWF0Y2ggdGhlIGV4cGVjdGVkIGNvbnRlbnRzLiAoMC4wID0gcGVyZmVjdGlvbixcclxuICAvLyAxLjAgPSB2ZXJ5IGxvb3NlKS4gIE5vdGUgdGhhdCBNYXRjaF9UaHJlc2hvbGQgY29udHJvbHMgaG93IGNsb3NlbHkgdGhlXHJcbiAgLy8gZW5kIHBvaW50cyBvZiBhIGRlbGV0ZSBuZWVkIHRvIG1hdGNoLlxyXG4gIFBhdGNoX0RlbGV0ZVRocmVzaG9sZCA9IDAuNTtcclxuICAvLyBDaHVuayBzaXplIGZvciBjb250ZXh0IGxlbmd0aC5cclxuICBQYXRjaF9NYXJnaW4gPSA0O1xyXG5cclxuICAvLyBUaGUgbnVtYmVyIG9mIGJpdHMgaW4gYW4gaW50LlxyXG4gIE1hdGNoX01heEJpdHMgPSAzMjtcclxuICAvKipcclxuICAgKiBUaGUgZGF0YSBzdHJ1Y3R1cmUgcmVwcmVzZW50aW5nIGEgZGlmZiBpcyBhbiBhcnJheSBvZiB0dXBsZXM6XHJcbiAgICogW1tEaWZmT3AuRGVsZXRlLCAnSGVsbG8nXSwgW0RpZmZPcC5JbnNlcnQsICdHb29kYnllJ10sIFtEaWZmT3AuRXF1YWwsICcgd29ybGQuJ11dXHJcbiAgICogd2hpY2ggbWVhbnM6IGRlbGV0ZSAnSGVsbG8nLCBhZGQgJ0dvb2RieWUnIGFuZCBrZWVwICcgd29ybGQuJ1xyXG4gICAqL1xyXG5cclxuICAvLyBEZWZpbmUgc29tZSByZWdleCBwYXR0ZXJucyBmb3IgbWF0Y2hpbmcgYm91bmRhcmllcy5cclxuICB3aGl0ZXNwYWNlUmVnZXhfID0gbmV3IFJlZ0V4cCgnL1xccy8nKTtcclxuICBsaW5lYnJlYWtSZWdleF8gPSBuZXcgUmVnRXhwKCcvW1xcclxcbl0vJyk7XHJcbiAgYmxhbmtsaW5lRW5kUmVnZXhfID0gbmV3IFJlZ0V4cCgnL1xcblxccj9cXG4kLycpO1xyXG4gIGJsYW5rbGluZVN0YXJ0UmVnZXhfID0gbmV3IFJlZ0V4cCgnL15cXHI/XFxuXFxyP1xcbi8nKTtcclxuXHJcbiAgLyoqXHJcbiAgICogRmluZCB0aGUgZGlmZmVyZW5jZXMgYmV0d2VlbiB0d28gdGV4dHMuICBTaW1wbGlmaWVzIHRoZSBwcm9ibGVtIGJ5IHN0cmlwcGluZ1xyXG4gICAqIGFueSBjb21tb24gcHJlZml4IG9yIHN1ZmZpeCBvZmYgdGhlIHRleHRzIGJlZm9yZSBkaWZmaW5nLlxyXG4gICAqIEBwYXJhbSAgdGV4dDEgT2xkIHN0cmluZyB0byBiZSBkaWZmZWQuXHJcbiAgICogQHBhcmFtICB0ZXh0MiBOZXcgc3RyaW5nIHRvIGJlIGRpZmZlZC5cclxuICAgKiBAcGFyYW0gIG9wdF9jaGVja2xpbmVzIE9wdGlvbmFsIHNwZWVkdXAgZmxhZy4gSWYgcHJlc2VudCBhbmQgZmFsc2UsXHJcbiAgICogICAgIHRoZW4gZG9uJ3QgcnVuIGEgbGluZS1sZXZlbCBkaWZmIGZpcnN0IHRvIGlkZW50aWZ5IHRoZSBjaGFuZ2VkIGFyZWFzLlxyXG4gICAqICAgICBEZWZhdWx0cyB0byB0cnVlLCB3aGljaCBkb2VzIGEgZmFzdGVyLCBzbGlnaHRseSBsZXNzIG9wdGltYWwgZGlmZi5cclxuICAgKiBAcGFyYW0gIG9wdF9kZWFkbGluZSBPcHRpb25hbCB0aW1lIHdoZW4gdGhlIGRpZmYgc2hvdWxkIGJlIGNvbXBsZXRlXHJcbiAgICogICAgIGJ5LiAgVXNlZCBpbnRlcm5hbGx5IGZvciByZWN1cnNpdmUgY2FsbHMuICBVc2VycyBzaG91bGQgc2V0IERpZmZUaW1lb3V0XHJcbiAgICogICAgIGluc3RlYWQuXHJcbiAgICogQHJldHVybiAgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXHJcbiAgICovXHJcbiAgICBkaWZmX21haW4gKHRleHQxOiBzdHJpbmcsIHRleHQyOiBzdHJpbmcsIG9wdF9jaGVja2xpbmVzPzogYm9vbGVhbiwgb3B0X2RlYWRsaW5lPzogbnVtYmVyKTogQXJyYXk8RGlmZj4ge1xyXG4gICAgICAvLyBTZXQgYSBkZWFkbGluZSBieSB3aGljaCB0aW1lIHRoZSBkaWZmIG11c3QgYmUgY29tcGxldGUuXHJcbiAgICAgIGlmICh0eXBlb2Ygb3B0X2RlYWRsaW5lID09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuRGlmZl9UaW1lb3V0IDw9IDApIHtcclxuICAgICAgICAgIG9wdF9kZWFkbGluZSA9IE51bWJlci5NQVhfVkFMVUU7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIG9wdF9kZWFkbGluZSA9IChuZXcgRGF0ZSkuZ2V0VGltZSgpICsgdGhpcy5EaWZmX1RpbWVvdXQgKiAxMDAwO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBjb25zdCBkZWFkbGluZSA9IG9wdF9kZWFkbGluZTtcclxuXHJcbiAgICAgIC8vIENoZWNrIGZvciBudWxsIGlucHV0cy5cclxuICAgICAgaWYgKHRleHQxID09IG51bGwgfHwgdGV4dDIgPT0gbnVsbCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTnVsbCBpbnB1dC4gKGRpZmZfbWFpbiknKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gQ2hlY2sgZm9yIGVxdWFsaXR5IChzcGVlZHVwKS5cclxuICAgICAgaWYgKHRleHQxID09IHRleHQyKSB7XHJcbiAgICAgICAgaWYgKHRleHQxKSB7XHJcbiAgICAgICAgICByZXR1cm4gW1tEaWZmT3AuRXF1YWwsIHRleHQxXV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHR5cGVvZiBvcHRfY2hlY2tsaW5lcyA9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIG9wdF9jaGVja2xpbmVzID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBjaGVja2xpbmVzID0gb3B0X2NoZWNrbGluZXM7XHJcblxyXG4gICAgICAvLyBUcmltIG9mZiBjb21tb24gcHJlZml4IChzcGVlZHVwKS5cclxuICAgICAgbGV0IGNvbW1vbmxlbmd0aCA9IHRoaXMuZGlmZl9jb21tb25QcmVmaXgodGV4dDEsIHRleHQyKTtcclxuICAgICAgY29uc3QgY29tbW9ucHJlZml4ID0gdGV4dDEuc3Vic3RyaW5nKDAsIGNvbW1vbmxlbmd0aCk7XHJcbiAgICAgIHRleHQxID0gdGV4dDEuc3Vic3RyaW5nKGNvbW1vbmxlbmd0aCk7XHJcbiAgICAgIHRleHQyID0gdGV4dDIuc3Vic3RyaW5nKGNvbW1vbmxlbmd0aCk7XHJcblxyXG4gICAgICAvLyBUcmltIG9mZiBjb21tb24gc3VmZml4IChzcGVlZHVwKS5cclxuICAgICAgY29tbW9ubGVuZ3RoID0gdGhpcy5kaWZmX2NvbW1vblN1ZmZpeCh0ZXh0MSwgdGV4dDIpO1xyXG4gICAgICBjb25zdCBjb21tb25zdWZmaXggPSB0ZXh0MS5zdWJzdHJpbmcodGV4dDEubGVuZ3RoIC0gY29tbW9ubGVuZ3RoKTtcclxuICAgICAgdGV4dDEgPSB0ZXh0MS5zdWJzdHJpbmcoMCwgdGV4dDEubGVuZ3RoIC0gY29tbW9ubGVuZ3RoKTtcclxuICAgICAgdGV4dDIgPSB0ZXh0Mi5zdWJzdHJpbmcoMCwgdGV4dDIubGVuZ3RoIC0gY29tbW9ubGVuZ3RoKTtcclxuXHJcbiAgICAgIC8vIENvbXB1dGUgdGhlIGRpZmYgb24gdGhlIG1pZGRsZSBibG9jay5cclxuICAgICAgY29uc3QgZGlmZnMgPSB0aGlzLmRpZmZfY29tcHV0ZV8odGV4dDEsIHRleHQyLCBjaGVja2xpbmVzLCBkZWFkbGluZSk7XHJcblxyXG4gICAgICAvLyBSZXN0b3JlIHRoZSBwcmVmaXggYW5kIHN1ZmZpeC5cclxuICAgICAgaWYgKGNvbW1vbnByZWZpeCkge1xyXG4gICAgICAgIGRpZmZzLnVuc2hpZnQoW0RpZmZPcC5FcXVhbCwgY29tbW9ucHJlZml4XSk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGNvbW1vbnN1ZmZpeCkge1xyXG4gICAgICAgIGRpZmZzLnB1c2goW0RpZmZPcC5FcXVhbCwgY29tbW9uc3VmZml4XSk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5kaWZmX2NsZWFudXBNZXJnZShkaWZmcyk7XHJcbiAgICAgIHJldHVybiBkaWZmcztcclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogRmluZCB0aGUgZGlmZmVyZW5jZXMgYmV0d2VlbiB0d28gdGV4dHMuICBBc3N1bWVzIHRoYXQgdGhlIHRleHRzIGRvIG5vdFxyXG4gICAqIGhhdmUgYW55IGNvbW1vbiBwcmVmaXggb3Igc3VmZml4LlxyXG4gICAqIEBwYXJhbSAgdGV4dDEgT2xkIHN0cmluZyB0byBiZSBkaWZmZWQuXHJcbiAgICogQHBhcmFtICB0ZXh0MiBOZXcgc3RyaW5nIHRvIGJlIGRpZmZlZC5cclxuICAgKiBAcGFyYW0gIGNoZWNrbGluZXMgU3BlZWR1cCBmbGFnLiAgSWYgZmFsc2UsIHRoZW4gZG9uJ3QgcnVuIGFcclxuICAgKiAgICAgbGluZS1sZXZlbCBkaWZmIGZpcnN0IHRvIGlkZW50aWZ5IHRoZSBjaGFuZ2VkIGFyZWFzLlxyXG4gICAqICAgICBJZiB0cnVlLCB0aGVuIHJ1biBhIGZhc3Rlciwgc2xpZ2h0bHkgbGVzcyBvcHRpbWFsIGRpZmYuXHJcbiAgICogQHBhcmFtICBkZWFkbGluZSBUaW1lIHdoZW4gdGhlIGRpZmYgc2hvdWxkIGJlIGNvbXBsZXRlIGJ5LlxyXG4gICAqIEByZXR1cm4gIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxyXG5cclxuICAgKi9cclxuICAgIGRpZmZfY29tcHV0ZV8gKHRleHQxOiBzdHJpbmcsIHRleHQyOiBzdHJpbmcsIGNoZWNrbGluZXM6IGJvb2xlYW4sXHJcbiAgICAgIGRlYWRsaW5lOiBudW1iZXIpOiBBcnJheTxEaWZmPiB7XHJcbiAgICBsZXQgZGlmZnM6IEFycmF5PERpZmY+O1xyXG5cclxuICAgIGlmICghdGV4dDEpIHtcclxuICAgICAgLy8gSnVzdCBhZGQgc29tZSB0ZXh0IChzcGVlZHVwKS5cclxuICAgICAgcmV0dXJuIFtbRGlmZk9wLkluc2VydCwgdGV4dDJdXTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRleHQyKSB7XHJcbiAgICAgIC8vIEp1c3QgZGVsZXRlIHNvbWUgdGV4dCAoc3BlZWR1cCkuXHJcbiAgICAgIHJldHVybiBbW0RpZmZPcC5EZWxldGUsIHRleHQxXV07XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbG9uZ3RleHQgPSB0ZXh0MS5sZW5ndGggPiB0ZXh0Mi5sZW5ndGggPyB0ZXh0MSA6IHRleHQyO1xyXG4gICAgY29uc3Qgc2hvcnR0ZXh0ID0gdGV4dDEubGVuZ3RoID4gdGV4dDIubGVuZ3RoID8gdGV4dDIgOiB0ZXh0MTtcclxuICAgIGNvbnN0IGkgPSBsb25ndGV4dC5pbmRleE9mKHNob3J0dGV4dCk7XHJcbiAgICBpZiAoaSAhPSAtMSkge1xyXG4gICAgICAvLyBTaG9ydGVyIHRleHQgaXMgaW5zaWRlIHRoZSBsb25nZXIgdGV4dCAoc3BlZWR1cCkuXHJcbiAgICAgIGRpZmZzID0gW1tEaWZmT3AuSW5zZXJ0LCBsb25ndGV4dC5zdWJzdHJpbmcoMCwgaSldLFxyXG4gICAgICAgICAgICAgIFtEaWZmT3AuRXF1YWwsIHNob3J0dGV4dF0sXHJcbiAgICAgICAgICAgICAgW0RpZmZPcC5JbnNlcnQsIGxvbmd0ZXh0LnN1YnN0cmluZyhpICsgc2hvcnR0ZXh0Lmxlbmd0aCldXTtcclxuICAgICAgLy8gU3dhcCBpbnNlcnRpb25zIGZvciBkZWxldGlvbnMgaWYgZGlmZiBpcyByZXZlcnNlZC5cclxuICAgICAgaWYgKHRleHQxLmxlbmd0aCA+IHRleHQyLmxlbmd0aCkge1xyXG4gICAgICAgIGRpZmZzWzBdWzBdID0gZGlmZnNbMl1bMF0gPSBEaWZmT3AuRGVsZXRlO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBkaWZmcztcclxuICAgIH1cclxuXHJcbiAgICBpZiAoc2hvcnR0ZXh0Lmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgIC8vIFNpbmdsZSBjaGFyYWN0ZXIgc3RyaW5nLlxyXG4gICAgICAvLyBBZnRlciB0aGUgcHJldmlvdXMgc3BlZWR1cCwgdGhlIGNoYXJhY3RlciBjYW4ndCBiZSBhbiBlcXVhbGl0eS5cclxuICAgICAgcmV0dXJuIFtbRGlmZk9wLkRlbGV0ZSwgdGV4dDFdLCBbRGlmZk9wLkluc2VydCwgdGV4dDJdXTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIHByb2JsZW0gY2FuIGJlIHNwbGl0IGluIHR3by5cclxuICAgIGNvbnN0IGhtID0gdGhpcy5kaWZmX2hhbGZNYXRjaF8odGV4dDEsIHRleHQyKTtcclxuICAgIGlmIChobSkge1xyXG4gICAgICAvLyBBIGhhbGYtbWF0Y2ggd2FzIGZvdW5kLCBzb3J0IG91dCB0aGUgcmV0dXJuIGRhdGEuXHJcbiAgICAgIGNvbnN0IHRleHQxX2EgPSBobVswXTtcclxuICAgICAgY29uc3QgdGV4dDFfYiA9IGhtWzFdO1xyXG4gICAgICBjb25zdCB0ZXh0Ml9hID0gaG1bMl07XHJcbiAgICAgIGNvbnN0IHRleHQyX2IgPSBobVszXTtcclxuICAgICAgY29uc3QgbWlkX2NvbW1vbiA9IGhtWzRdO1xyXG4gICAgICAvLyBTZW5kIGJvdGggcGFpcnMgb2ZmIGZvciBzZXBhcmF0ZSBwcm9jZXNzaW5nLlxyXG4gICAgICBjb25zdCBkaWZmc19hID0gdGhpcy5kaWZmX21haW4odGV4dDFfYSwgdGV4dDJfYSwgY2hlY2tsaW5lcywgZGVhZGxpbmUpO1xyXG4gICAgICBjb25zdCBkaWZmc19iID0gdGhpcy5kaWZmX21haW4odGV4dDFfYiwgdGV4dDJfYiwgY2hlY2tsaW5lcywgZGVhZGxpbmUpO1xyXG4gICAgICAvLyBNZXJnZSB0aGUgcmVzdWx0cy5cclxuICAgICAgcmV0dXJuIGRpZmZzX2EuY29uY2F0KFtbRGlmZk9wLkVxdWFsLCBtaWRfY29tbW9uXV0sIGRpZmZzX2IpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChjaGVja2xpbmVzICYmIHRleHQxLmxlbmd0aCA+IDEwMCAmJiB0ZXh0Mi5sZW5ndGggPiAxMDApIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZGlmZl9saW5lTW9kZV8odGV4dDEsIHRleHQyLCBkZWFkbGluZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuZGlmZl9iaXNlY3RfKHRleHQxLCB0ZXh0MiwgZGVhZGxpbmUpO1xyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBEbyBhIHF1aWNrIGxpbmUtbGV2ZWwgZGlmZiBvbiBib3RoIHN0cmluZ3MsIHRoZW4gcmVkaWZmIHRoZSBwYXJ0cyBmb3JcclxuICAgKiBncmVhdGVyIGFjY3VyYWN5LlxyXG4gICAqIFRoaXMgc3BlZWR1cCBjYW4gcHJvZHVjZSBub24tbWluaW1hbCBkaWZmcy5cclxuICAgKiBAcGFyYW0gIHRleHQxIE9sZCBzdHJpbmcgdG8gYmUgZGlmZmVkLlxyXG4gICAqIEBwYXJhbSAgdGV4dDIgTmV3IHN0cmluZyB0byBiZSBkaWZmZWQuXHJcbiAgICogQHBhcmFtICBkZWFkbGluZSBUaW1lIHdoZW4gdGhlIGRpZmYgc2hvdWxkIGJlIGNvbXBsZXRlIGJ5LlxyXG4gICAqIEByZXR1cm4gIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxyXG5cclxuICAgKi9cclxuICAgIGRpZmZfbGluZU1vZGVfICh0ZXh0MTogc3RyaW5nLCB0ZXh0Mjogc3RyaW5nLCBkZWFkbGluZTogbnVtYmVyKSB7XHJcbiAgICAvLyBTY2FuIHRoZSB0ZXh0IG9uIGEgbGluZS1ieS1saW5lIGJhc2lzIGZpcnN0LlxyXG4gICAgY29uc3QgYSA9IHRoaXMuZGlmZl9saW5lc1RvQ2hhcnNfKHRleHQxLCB0ZXh0Mik7XHJcbiAgICB0ZXh0MSA9IGEuY2hhcnMxO1xyXG4gICAgdGV4dDIgPSBhLmNoYXJzMjtcclxuICAgIGNvbnN0IGxpbmVhcnJheSA9IGEubGluZUFycmF5O1xyXG5cclxuICAgIGNvbnN0IGRpZmZzID0gdGhpcy5kaWZmX21haW4odGV4dDEsIHRleHQyLCBmYWxzZSwgZGVhZGxpbmUpO1xyXG5cclxuICAgIC8vIENvbnZlcnQgdGhlIGRpZmYgYmFjayB0byBvcmlnaW5hbCB0ZXh0LlxyXG4gICAgdGhpcy5kaWZmX2NoYXJzVG9MaW5lc18oZGlmZnMsIGxpbmVhcnJheSk7XHJcbiAgICAvLyBFbGltaW5hdGUgZnJlYWsgbWF0Y2hlcyAoZS5nLiBibGFuayBsaW5lcylcclxuICAgIHRoaXMuZGlmZl9jbGVhbnVwU2VtYW50aWMoZGlmZnMpO1xyXG5cclxuICAgIC8vIFJlZGlmZiBhbnkgcmVwbGFjZW1lbnQgYmxvY2tzLCB0aGlzIHRpbWUgY2hhcmFjdGVyLWJ5LWNoYXJhY3Rlci5cclxuICAgIC8vIEFkZCBhIGR1bW15IGVudHJ5IGF0IHRoZSBlbmQuXHJcbiAgICBkaWZmcy5wdXNoKFtEaWZmT3AuRXF1YWwsICcnXSk7XHJcbiAgICBsZXQgcG9pbnRlciA9IDA7XHJcbiAgICBsZXQgY291bnRfZGVsZXRlID0gMDtcclxuICAgIGxldCBjb3VudF9pbnNlcnQgPSAwO1xyXG4gICAgbGV0IHRleHRfZGVsZXRlID0gJyc7XHJcbiAgICBsZXQgdGV4dF9pbnNlcnQgPSAnJztcclxuICAgIHdoaWxlIChwb2ludGVyIDwgZGlmZnMubGVuZ3RoKSB7XHJcbiAgICAgIHN3aXRjaCAoZGlmZnNbcG9pbnRlcl1bMF0pIHtcclxuICAgICAgICBjYXNlIERpZmZPcC5JbnNlcnQ6XHJcbiAgICAgICAgICBjb3VudF9pbnNlcnQrKztcclxuICAgICAgICAgIHRleHRfaW5zZXJ0ICs9IGRpZmZzW3BvaW50ZXJdWzFdO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBEaWZmT3AuRGVsZXRlOlxyXG4gICAgICAgICAgY291bnRfZGVsZXRlKys7XHJcbiAgICAgICAgICB0ZXh0X2RlbGV0ZSArPSBkaWZmc1twb2ludGVyXVsxXTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgRGlmZk9wLkVxdWFsOlxyXG4gICAgICAgICAgLy8gVXBvbiByZWFjaGluZyBhbiBlcXVhbGl0eSwgY2hlY2sgZm9yIHByaW9yIHJlZHVuZGFuY2llcy5cclxuICAgICAgICAgIGlmIChjb3VudF9kZWxldGUgPj0gMSAmJiBjb3VudF9pbnNlcnQgPj0gMSkge1xyXG4gICAgICAgICAgICAvLyBEZWxldGUgdGhlIG9mZmVuZGluZyByZWNvcmRzIGFuZCBhZGQgdGhlIG1lcmdlZCBvbmVzLlxyXG4gICAgICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciAtIGNvdW50X2RlbGV0ZSAtIGNvdW50X2luc2VydCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY291bnRfZGVsZXRlICsgY291bnRfaW5zZXJ0KTtcclxuICAgICAgICAgICAgcG9pbnRlciA9IHBvaW50ZXIgLSBjb3VudF9kZWxldGUgLSBjb3VudF9pbnNlcnQ7XHJcbiAgICAgICAgICAgIGNvbnN0IGIgPSB0aGlzLmRpZmZfbWFpbih0ZXh0X2RlbGV0ZSwgdGV4dF9pbnNlcnQsIGZhbHNlLCBkZWFkbGluZSk7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGogPSBiLmxlbmd0aCAtIDE7IGogPj0gMDsgai0tKSB7XHJcbiAgICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIsIDAsIGJbal0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHBvaW50ZXIgPSBwb2ludGVyICsgYi5sZW5ndGg7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjb3VudF9pbnNlcnQgPSAwO1xyXG4gICAgICAgICAgY291bnRfZGVsZXRlID0gMDtcclxuICAgICAgICAgIHRleHRfZGVsZXRlID0gJyc7XHJcbiAgICAgICAgICB0ZXh0X2luc2VydCA9ICcnO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgICAgcG9pbnRlcisrO1xyXG4gICAgfVxyXG4gICAgZGlmZnMucG9wKCk7ICAvLyBSZW1vdmUgdGhlIGR1bW15IGVudHJ5IGF0IHRoZSBlbmQuXHJcblxyXG4gICAgcmV0dXJuIGRpZmZzO1xyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBGaW5kIHRoZSAnbWlkZGxlIHNuYWtlJyBvZiBhIGRpZmYsIHNwbGl0IHRoZSBwcm9ibGVtIGluIHR3b1xyXG4gICAqIGFuZCByZXR1cm4gdGhlIHJlY3Vyc2l2ZWx5IGNvbnN0cnVjdGVkIGRpZmYuXHJcbiAgICogU2VlIE15ZXJzIDE5ODYgcGFwZXI6IEFuIE8oTkQpIERpZmZlcmVuY2UgQWxnb3JpdGhtIGFuZCBJdHMgY29uc3RpYXRpb25zLlxyXG4gICAqIEBwYXJhbSAgdGV4dDEgT2xkIHN0cmluZyB0byBiZSBkaWZmZWQuXHJcbiAgICogQHBhcmFtICB0ZXh0MiBOZXcgc3RyaW5nIHRvIGJlIGRpZmZlZC5cclxuICAgKiBAcGFyYW0gIGRlYWRsaW5lIFRpbWUgYXQgd2hpY2ggdG8gYmFpbCBpZiBub3QgeWV0IGNvbXBsZXRlLlxyXG4gICAqIEByZXR1cm4gIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxyXG5cclxuICAgKi9cclxuICAgIGRpZmZfYmlzZWN0XyAodGV4dDE6IHN0cmluZywgdGV4dDI6IHN0cmluZywgZGVhZGxpbmU6IG51bWJlcik6IEFycmF5PERpZmY+IHtcclxuICAgIC8vIENhY2hlIHRoZSB0ZXh0IGxlbmd0aHMgdG8gcHJldmVudCBtdWx0aXBsZSBjYWxscy5cclxuICAgIGNvbnN0IHRleHQxX2xlbmd0aCA9IHRleHQxLmxlbmd0aDtcclxuICAgIGNvbnN0IHRleHQyX2xlbmd0aCA9IHRleHQyLmxlbmd0aDtcclxuICAgIGNvbnN0IG1heF9kID0gTWF0aC5jZWlsKCh0ZXh0MV9sZW5ndGggKyB0ZXh0Ml9sZW5ndGgpIC8gMik7XHJcbiAgICBjb25zdCB2X29mZnNldCA9IG1heF9kO1xyXG4gICAgY29uc3Qgdl9sZW5ndGggPSAyICogbWF4X2Q7XHJcbiAgICBjb25zdCB2MSA9IG5ldyBBcnJheSh2X2xlbmd0aCk7XHJcbiAgICBjb25zdCB2MiA9IG5ldyBBcnJheSh2X2xlbmd0aCk7XHJcbiAgICAvLyBTZXR0aW5nIGFsbCBlbGVtZW50cyB0byAtMSBpcyBmYXN0ZXIgaW4gQ2hyb21lICYgRmlyZWZveCB0aGFuIG1peGluZ1xyXG4gICAgLy8gaW50ZWdlcnMgYW5kIHVuZGVmaW5lZC5cclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgdl9sZW5ndGg7IHgrKykge1xyXG4gICAgICB2MVt4XSA9IC0xO1xyXG4gICAgICB2Mlt4XSA9IC0xO1xyXG4gICAgfVxyXG4gICAgdjFbdl9vZmZzZXQgKyAxXSA9IDA7XHJcbiAgICB2Mlt2X29mZnNldCArIDFdID0gMDtcclxuICAgIGNvbnN0IGRlbHRhID0gdGV4dDFfbGVuZ3RoIC0gdGV4dDJfbGVuZ3RoO1xyXG4gICAgLy8gSWYgdGhlIHRvdGFsIG51bWJlciBvZiBjaGFyYWN0ZXJzIGlzIG9kZCwgdGhlbiB0aGUgZnJvbnQgcGF0aCB3aWxsIGNvbGxpZGVcclxuICAgIC8vIHdpdGggdGhlIHJldmVyc2UgcGF0aC5cclxuICAgIGNvbnN0IGZyb250ID0gKGRlbHRhICUgMiAhPSAwKTtcclxuICAgIC8vIE9mZnNldHMgZm9yIHN0YXJ0IGFuZCBlbmQgb2YgayBsb29wLlxyXG4gICAgLy8gUHJldmVudHMgbWFwcGluZyBvZiBzcGFjZSBiZXlvbmQgdGhlIGdyaWQuXHJcbiAgICBsZXQgazFzdGFydCA9IDA7XHJcbiAgICBsZXQgazFlbmQgPSAwO1xyXG4gICAgbGV0IGsyc3RhcnQgPSAwO1xyXG4gICAgbGV0IGsyZW5kID0gMDtcclxuICAgIGZvciAobGV0IGQgPSAwOyBkIDwgbWF4X2Q7IGQrKykge1xyXG4gICAgICAvLyBCYWlsIG91dCBpZiBkZWFkbGluZSBpcyByZWFjaGVkLlxyXG4gICAgICBpZiAoKG5ldyBEYXRlKCkpLmdldFRpbWUoKSA+IGRlYWRsaW5lKSB7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFdhbGsgdGhlIGZyb250IHBhdGggb25lIHN0ZXAuXHJcbiAgICAgIGZvciAobGV0IGsxID0gLWQgKyBrMXN0YXJ0OyBrMSA8PSBkIC0gazFlbmQ7IGsxICs9IDIpIHtcclxuICAgICAgICBjb25zdCBrMV9vZmZzZXQgPSB2X29mZnNldCArIGsxO1xyXG4gICAgICAgIGxldCB4MTtcclxuICAgICAgICBpZiAoazEgPT0gLWQgfHwgKGsxICE9IGQgJiYgdjFbazFfb2Zmc2V0IC0gMV0gPCB2MVtrMV9vZmZzZXQgKyAxXSkpIHtcclxuICAgICAgICAgIHgxID0gdjFbazFfb2Zmc2V0ICsgMV07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHgxID0gdjFbazFfb2Zmc2V0IC0gMV0gKyAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgeTEgPSB4MSAtIGsxO1xyXG4gICAgICAgIHdoaWxlICh4MSA8IHRleHQxX2xlbmd0aCAmJiB5MSA8IHRleHQyX2xlbmd0aCAmJlxyXG4gICAgICAgICAgICAgIHRleHQxLmNoYXJBdCh4MSkgPT0gdGV4dDIuY2hhckF0KHkxKSkge1xyXG4gICAgICAgICAgeDErKztcclxuICAgICAgICAgIHkxKys7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHYxW2sxX29mZnNldF0gPSB4MTtcclxuICAgICAgICBpZiAoeDEgPiB0ZXh0MV9sZW5ndGgpIHtcclxuICAgICAgICAgIC8vIFJhbiBvZmYgdGhlIHJpZ2h0IG9mIHRoZSBncmFwaC5cclxuICAgICAgICAgIGsxZW5kICs9IDI7XHJcbiAgICAgICAgfSBlbHNlIGlmICh5MSA+IHRleHQyX2xlbmd0aCkge1xyXG4gICAgICAgICAgLy8gUmFuIG9mZiB0aGUgYm90dG9tIG9mIHRoZSBncmFwaC5cclxuICAgICAgICAgIGsxc3RhcnQgKz0gMjtcclxuICAgICAgICB9IGVsc2UgaWYgKGZyb250KSB7XHJcbiAgICAgICAgICBjb25zdCBrMl9vZmZzZXQgPSB2X29mZnNldCArIGRlbHRhIC0gazE7XHJcbiAgICAgICAgICBpZiAoazJfb2Zmc2V0ID49IDAgJiYgazJfb2Zmc2V0IDwgdl9sZW5ndGggJiYgdjJbazJfb2Zmc2V0XSAhPSAtMSkge1xyXG4gICAgICAgICAgICAvLyBNaXJyb3IgeDIgb250byB0b3AtbGVmdCBjb29yZGluYXRlIHN5c3RlbS5cclxuICAgICAgICAgICAgY29uc3QgeDIgPSB0ZXh0MV9sZW5ndGggLSB2MltrMl9vZmZzZXRdO1xyXG4gICAgICAgICAgICBpZiAoeDEgPj0geDIpIHtcclxuICAgICAgICAgICAgICAvLyBPdmVybGFwIGRldGVjdGVkLlxyXG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLmRpZmZfYmlzZWN0U3BsaXRfKHRleHQxLCB0ZXh0MiwgeDEsIHkxLCBkZWFkbGluZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFdhbGsgdGhlIHJldmVyc2UgcGF0aCBvbmUgc3RlcC5cclxuICAgICAgZm9yIChsZXQgazIgPSAtZCArIGsyc3RhcnQ7IGsyIDw9IGQgLSBrMmVuZDsgazIgKz0gMikge1xyXG4gICAgICAgIGNvbnN0IGsyX29mZnNldCA9IHZfb2Zmc2V0ICsgazI7XHJcbiAgICAgICAgbGV0IHgyOiBudW1iZXI7XHJcbiAgICAgICAgaWYgKGsyID09IC1kIHx8IChrMiAhPSBkICYmIHYyW2syX29mZnNldCAtIDFdIDwgdjJbazJfb2Zmc2V0ICsgMV0pKSB7XHJcbiAgICAgICAgICB4MiA9IHYyW2syX29mZnNldCArIDFdO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB4MiA9IHYyW2syX29mZnNldCAtIDFdICsgMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IHkyID0geDIgLSBrMjtcclxuICAgICAgICB3aGlsZSAoeDIgPCB0ZXh0MV9sZW5ndGggJiYgeTIgPCB0ZXh0Ml9sZW5ndGggJiZcclxuICAgICAgICAgICAgICB0ZXh0MS5jaGFyQXQodGV4dDFfbGVuZ3RoIC0geDIgLSAxKSA9PVxyXG4gICAgICAgICAgICAgIHRleHQyLmNoYXJBdCh0ZXh0Ml9sZW5ndGggLSB5MiAtIDEpKSB7XHJcbiAgICAgICAgICB4MisrO1xyXG4gICAgICAgICAgeTIrKztcclxuICAgICAgICB9XHJcbiAgICAgICAgdjJbazJfb2Zmc2V0XSA9IHgyO1xyXG4gICAgICAgIGlmICh4MiA+IHRleHQxX2xlbmd0aCkge1xyXG4gICAgICAgICAgLy8gUmFuIG9mZiB0aGUgbGVmdCBvZiB0aGUgZ3JhcGguXHJcbiAgICAgICAgICBrMmVuZCArPSAyO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoeTIgPiB0ZXh0Ml9sZW5ndGgpIHtcclxuICAgICAgICAgIC8vIFJhbiBvZmYgdGhlIHRvcCBvZiB0aGUgZ3JhcGguXHJcbiAgICAgICAgICBrMnN0YXJ0ICs9IDI7XHJcbiAgICAgICAgfSBlbHNlIGlmICghZnJvbnQpIHtcclxuICAgICAgICAgIGNvbnN0IGsxX29mZnNldCA9IHZfb2Zmc2V0ICsgZGVsdGEgLSBrMjtcclxuICAgICAgICAgIGlmIChrMV9vZmZzZXQgPj0gMCAmJiBrMV9vZmZzZXQgPCB2X2xlbmd0aCAmJiB2MVtrMV9vZmZzZXRdICE9IC0xKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHgxID0gdjFbazFfb2Zmc2V0XTtcclxuICAgICAgICAgICAgY29uc3QgeTEgPSB2X29mZnNldCArIHgxIC0gazFfb2Zmc2V0O1xyXG4gICAgICAgICAgICAvLyBNaXJyb3IgeDIgb250byB0b3AtbGVmdCBjb29yZGluYXRlIHN5c3RlbS5cclxuICAgICAgICAgICAgeDIgPSB0ZXh0MV9sZW5ndGggLSB4MjtcclxuICAgICAgICAgICAgaWYgKHgxID49IHgyKSB7XHJcbiAgICAgICAgICAgICAgLy8gT3ZlcmxhcCBkZXRlY3RlZC5cclxuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kaWZmX2Jpc2VjdFNwbGl0Xyh0ZXh0MSwgdGV4dDIsIHgxLCB5MSwgZGVhZGxpbmUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBEaWZmIHRvb2sgdG9vIGxvbmcgYW5kIGhpdCB0aGUgZGVhZGxpbmUgb3JcclxuICAgIC8vIG51bWJlciBvZiBkaWZmcyBlcXVhbHMgbnVtYmVyIG9mIGNoYXJhY3RlcnMsIG5vIGNvbW1vbmFsaXR5IGF0IGFsbC5cclxuICAgIHJldHVybiBbW0RpZmZPcC5EZWxldGUsIHRleHQxXSwgW0RpZmZPcC5JbnNlcnQsIHRleHQyXV07XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEdpdmVuIHRoZSBsb2NhdGlvbiBvZiB0aGUgJ21pZGRsZSBzbmFrZScsIHNwbGl0IHRoZSBkaWZmIGluIHR3byBwYXJ0c1xyXG4gICAqIGFuZCByZWN1cnNlLlxyXG4gICAqIEBwYXJhbSAgdGV4dDEgT2xkIHN0cmluZyB0byBiZSBkaWZmZWQuXHJcbiAgICogQHBhcmFtICB0ZXh0MiBOZXcgc3RyaW5nIHRvIGJlIGRpZmZlZC5cclxuICAgKiBAcGFyYW0gIHggSW5kZXggb2Ygc3BsaXQgcG9pbnQgaW4gdGV4dDEuXHJcbiAgICogQHBhcmFtICB5IEluZGV4IG9mIHNwbGl0IHBvaW50IGluIHRleHQyLlxyXG4gICAqIEBwYXJhbSAgZGVhZGxpbmUgVGltZSBhdCB3aGljaCB0byBiYWlsIGlmIG5vdCB5ZXQgY29tcGxldGUuXHJcbiAgICogQHJldHVybiAgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXHJcblxyXG4gICAqL1xyXG4gICAgZGlmZl9iaXNlY3RTcGxpdF8gKHRleHQxOiBzdHJpbmcsIHRleHQyOiBzdHJpbmcsIHg6IG51bWJlciwgeTogbnVtYmVyLCBkZWFkbGluZTogbnVtYmVyKSB7XHJcbiAgICAgIGNvbnN0IHRleHQxYSA9IHRleHQxLnN1YnN0cmluZygwLCB4KTtcclxuICAgICAgY29uc3QgdGV4dDJhID0gdGV4dDIuc3Vic3RyaW5nKDAsIHkpO1xyXG4gICAgICBjb25zdCB0ZXh0MWIgPSB0ZXh0MS5zdWJzdHJpbmcoeCk7XHJcbiAgICAgIGNvbnN0IHRleHQyYiA9IHRleHQyLnN1YnN0cmluZyh5KTtcclxuXHJcbiAgICAgIC8vIENvbXB1dGUgYm90aCBkaWZmcyBzZXJpYWxseS5cclxuICAgICAgY29uc3QgZGlmZnMgPSB0aGlzLmRpZmZfbWFpbih0ZXh0MWEsIHRleHQyYSwgZmFsc2UsIGRlYWRsaW5lKTtcclxuICAgICAgY29uc3QgZGlmZnNiID0gdGhpcy5kaWZmX21haW4odGV4dDFiLCB0ZXh0MmIsIGZhbHNlLCBkZWFkbGluZSk7XHJcblxyXG4gICAgICByZXR1cm4gZGlmZnMuY29uY2F0KGRpZmZzYik7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogU3BsaXQgdHdvIHRleHRzIGludG8gYW4gYXJyYXkgb2Ygc3RyaW5ncy4gIFJlZHVjZSB0aGUgdGV4dHMgdG8gYSBzdHJpbmcgb2ZcclxuICAgKiBoYXNoZXMgd2hlcmUgZWFjaCBVbmljb2RlIGNoYXJhY3RlciByZXByZXNlbnRzIG9uZSBsaW5lLlxyXG4gICAqIEBwYXJhbSAgdGV4dDEgRmlyc3Qgc3RyaW5nLlxyXG4gICAqIEBwYXJhbSAgdGV4dDIgU2Vjb25kIHN0cmluZy5cclxuICAgKiBAcmV0dXJuIH1cclxuICAgKiAgICAgQW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIGVuY29kZWQgdGV4dDEsIHRoZSBlbmNvZGVkIHRleHQyIGFuZFxyXG4gICAqICAgICB0aGUgYXJyYXkgb2YgdW5pcXVlIHN0cmluZ3MuXHJcbiAgICogICAgIFRoZSB6ZXJvdGggZWxlbWVudCBvZiB0aGUgYXJyYXkgb2YgdW5pcXVlIHN0cmluZ3MgaXMgaW50ZW50aW9uYWxseSBibGFuay5cclxuXHJcbiAgICovXHJcbiAgICBkaWZmX2xpbmVzVG9DaGFyc18gKHRleHQxOiBzdHJpbmcsIHRleHQyOiBzdHJpbmcpIHtcclxuICAgICAgY29uc3QgbGluZUFycmF5ID0gW107ICAvLyBlLmcuIGxpbmVBcnJheVs0XSA9PSAnSGVsbG9cXG4nXHJcbiAgICAgIGNvbnN0IGxpbmVIYXNoID0ge307ICAgLy8gZS5nLiBsaW5lSGFzaFsnSGVsbG9cXG4nXSA9PSA0XHJcblxyXG4gICAgICAvLyAnXFx4MDAnIGlzIGEgdmFsaWQgY2hhcmFjdGVyLCBidXQgY29uc3Rpb3VzIGRlYnVnZ2VycyBkb24ndCBsaWtlIGl0LlxyXG4gICAgICAvLyBTbyB3ZSdsbCBpbnNlcnQgYSBqdW5rIGVudHJ5IHRvIGF2b2lkIGdlbmVyYXRpbmcgYSBudWxsIGNoYXJhY3Rlci5cclxuICAgICAgbGluZUFycmF5WzBdID0gJyc7XHJcblxyXG5cclxuICAgICAgY29uc3QgY2hhcnMxID0gdGhpcy5kaWZmX2xpbmVzVG9DaGFyc011bmdlXyh0ZXh0MSwgbGluZUFycmF5LCBsaW5lSGFzaCk7XHJcbiAgICAgIGNvbnN0IGNoYXJzMiA9IHRoaXMuZGlmZl9saW5lc1RvQ2hhcnNNdW5nZV8odGV4dDIsIGxpbmVBcnJheSwgbGluZUhhc2gpO1xyXG4gICAgICByZXR1cm4ge2NoYXJzMTogY2hhcnMxLCBjaGFyczI6IGNoYXJzMiwgbGluZUFycmF5OiBsaW5lQXJyYXl9O1xyXG4gICB9O1xyXG5cclxuICAvKipcclxuICAgKiBTcGxpdCBhIHRleHQgaW50byBhbiBhcnJheSBvZiBzdHJpbmdzLiAgUmVkdWNlIHRoZSB0ZXh0cyB0byBhIHN0cmluZyBvZlxyXG4gICAqIGhhc2hlcyB3aGVyZSBlYWNoIFVuaWNvZGUgY2hhcmFjdGVyIHJlcHJlc2VudHMgb25lIGxpbmUuXHJcbiAgICogTW9kaWZpZXMgbGluZWFycmF5IGFuZCBsaW5laGFzaCB0aHJvdWdoIGJlaW5nIGEgY2xvc3VyZS5cclxuICAgKiBAcGFyYW0gIHRleHQgU3RyaW5nIHRvIGVuY29kZS5cclxuICAgKiBAcmV0dXJuICBFbmNvZGVkIHN0cmluZy5cclxuXHJcbiAgICovXHJcbiAgZGlmZl9saW5lc1RvQ2hhcnNNdW5nZV8odGV4dDogc3RyaW5nLCBsaW5lQXJyYXk6IEFycmF5PHN0cmluZz4sIGxpbmVIYXNoOiBhbnkpOiBzdHJpbmcge1xyXG4gICAgbGV0IGNoYXJzID0gJyc7XHJcbiAgICAvLyBXYWxrIHRoZSB0ZXh0LCBwdWxsaW5nIG91dCBhIHN1YnN0cmluZyBmb3IgZWFjaCBsaW5lLlxyXG4gICAgLy8gdGV4dC5zcGxpdCgnXFxuJykgd291bGQgd291bGQgdGVtcG9yYXJpbHkgZG91YmxlIG91ciBtZW1vcnkgZm9vdHByaW50LlxyXG4gICAgLy8gTW9kaWZ5aW5nIHRleHQgd291bGQgY3JlYXRlIG1hbnkgbGFyZ2Ugc3RyaW5ncyB0byBnYXJiYWdlIGNvbGxlY3QuXHJcbiAgICBsZXQgbGluZVN0YXJ0ID0gMDtcclxuICAgIGxldCBsaW5lRW5kID0gLTE7XHJcbiAgICAvLyBLZWVwaW5nIG91ciBvd24gbGVuZ3RoIGNvbnN0aWFibGUgaXMgZmFzdGVyIHRoYW4gbG9va2luZyBpdCB1cC5cclxuICAgIGxldCBsaW5lQXJyYXlMZW5ndGggPSBsaW5lQXJyYXkubGVuZ3RoO1xyXG4gICAgd2hpbGUgKGxpbmVFbmQgPCB0ZXh0Lmxlbmd0aCAtIDEpIHtcclxuICAgICAgbGluZUVuZCA9IHRleHQuaW5kZXhPZignXFxuJywgbGluZVN0YXJ0KTtcclxuICAgICAgaWYgKGxpbmVFbmQgPT0gLTEpIHtcclxuICAgICAgICBsaW5lRW5kID0gdGV4dC5sZW5ndGggLSAxO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGxpbmUgPSB0ZXh0LnN1YnN0cmluZyhsaW5lU3RhcnQsIGxpbmVFbmQgKyAxKTtcclxuICAgICAgbGluZVN0YXJ0ID0gbGluZUVuZCArIDE7XHJcblxyXG4gICAgICBpZiAobGluZUhhc2guaGFzT3duUHJvcGVydHkgPyBsaW5lSGFzaC5oYXNPd25Qcm9wZXJ0eShsaW5lKSA6XHJcbiAgICAgICAgICAobGluZUhhc2hbbGluZV0gIT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgICBjaGFycyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGxpbmVIYXNoW2xpbmVdKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjaGFycyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGxpbmVBcnJheUxlbmd0aCk7XHJcbiAgICAgICAgbGluZUhhc2hbbGluZV0gPSBsaW5lQXJyYXlMZW5ndGg7XHJcbiAgICAgICAgbGluZUFycmF5W2xpbmVBcnJheUxlbmd0aCsrXSA9IGxpbmU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBjaGFycztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlaHlkcmF0ZSB0aGUgdGV4dCBpbiBhIGRpZmYgZnJvbSBhIHN0cmluZyBvZiBsaW5lIGhhc2hlcyB0byByZWFsIGxpbmVzIG9mXHJcbiAgICogdGV4dC5cclxuICAgKiBAcGFyYW0gIGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxyXG4gICAqIEBwYXJhbSAgbGluZUFycmF5IEFycmF5IG9mIHVuaXF1ZSBzdHJpbmdzLlxyXG5cclxuICAgKi9cclxuICAgIGRpZmZfY2hhcnNUb0xpbmVzXyAoZGlmZnM6IEFycmF5PERpZmY+LCBsaW5lQXJyYXk6IEFycmF5PHN0cmluZz4pOiB2b2lkIHtcclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgZGlmZnMubGVuZ3RoOyB4KyspIHtcclxuICAgICAgY29uc3QgY2hhcnMgPSBkaWZmc1t4XVsxXTtcclxuICAgICAgY29uc3QgdGV4dCA9IFtdO1xyXG4gICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGNoYXJzLmxlbmd0aDsgeSsrKSB7XHJcbiAgICAgICAgdGV4dFt5XSA9IGxpbmVBcnJheVtjaGFycy5jaGFyQ29kZUF0KHkpXTtcclxuICAgICAgfVxyXG4gICAgICBkaWZmc1t4XVsxXSA9IHRleHQuam9pbignJyk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIERldGVybWluZSB0aGUgY29tbW9uIHByZWZpeCBvZiB0d28gc3RyaW5ncy5cclxuICAgKiBAcGFyYW0gIHRleHQxIEZpcnN0IHN0cmluZy5cclxuICAgKiBAcGFyYW0gIHRleHQyIFNlY29uZCBzdHJpbmcuXHJcbiAgICogQHJldHVybiAgVGhlIG51bWJlciBvZiBjaGFyYWN0ZXJzIGNvbW1vbiB0byB0aGUgc3RhcnQgb2YgZWFjaFxyXG4gICAqICAgICBzdHJpbmcuXHJcbiAgICovXHJcbiAgICBkaWZmX2NvbW1vblByZWZpeCAodGV4dDE6IHN0cmluZywgdGV4dDI6IHN0cmluZyk6IG51bWJlciB7XHJcbiAgICAvLyBRdWljayBjaGVjayBmb3IgY29tbW9uIG51bGwgY2FzZXMuXHJcbiAgICBpZiAoIXRleHQxIHx8ICF0ZXh0MiB8fCB0ZXh0MS5jaGFyQXQoMCkgIT0gdGV4dDIuY2hhckF0KDApKSB7XHJcbiAgICAgIHJldHVybiAwO1xyXG4gICAgfVxyXG4gICAgLy8gQmluYXJ5IHNlYXJjaC5cclxuICAgIC8vIFBlcmZvcm1hbmNlIGFuYWx5c2lzOiBodHRwOi8vbmVpbC5mcmFzZXIubmFtZS9uZXdzLzIwMDcvMTAvMDkvXHJcbiAgICBsZXQgcG9pbnRlcm1pbiA9IDA7XHJcbiAgICBsZXQgcG9pbnRlcm1heCA9IE1hdGgubWluKHRleHQxLmxlbmd0aCwgdGV4dDIubGVuZ3RoKTtcclxuICAgIGxldCBwb2ludGVybWlkID0gcG9pbnRlcm1heDtcclxuICAgIGxldCBwb2ludGVyc3RhcnQgPSAwO1xyXG4gICAgd2hpbGUgKHBvaW50ZXJtaW4gPCBwb2ludGVybWlkKSB7XHJcbiAgICAgIGlmICh0ZXh0MS5zdWJzdHJpbmcocG9pbnRlcnN0YXJ0LCBwb2ludGVybWlkKSA9PVxyXG4gICAgICAgICAgdGV4dDIuc3Vic3RyaW5nKHBvaW50ZXJzdGFydCwgcG9pbnRlcm1pZCkpIHtcclxuICAgICAgICBwb2ludGVybWluID0gcG9pbnRlcm1pZDtcclxuICAgICAgICBwb2ludGVyc3RhcnQgPSBwb2ludGVybWluO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHBvaW50ZXJtYXggPSBwb2ludGVybWlkO1xyXG4gICAgICB9XHJcbiAgICAgIHBvaW50ZXJtaWQgPSBNYXRoLmZsb29yKChwb2ludGVybWF4IC0gcG9pbnRlcm1pbikgLyAyICsgcG9pbnRlcm1pbik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcG9pbnRlcm1pZDtcclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogRGV0ZXJtaW5lIHRoZSBjb21tb24gc3VmZml4IG9mIHR3byBzdHJpbmdzLlxyXG4gICAqIEBwYXJhbSAgdGV4dDEgRmlyc3Qgc3RyaW5nLlxyXG4gICAqIEBwYXJhbSAgdGV4dDIgU2Vjb25kIHN0cmluZy5cclxuICAgKiBAcmV0dXJuICBUaGUgbnVtYmVyIG9mIGNoYXJhY3RlcnMgY29tbW9uIHRvIHRoZSBlbmQgb2YgZWFjaCBzdHJpbmcuXHJcbiAgICovXHJcbiAgICBkaWZmX2NvbW1vblN1ZmZpeCAodGV4dDE6IHN0cmluZywgdGV4dDI6IHN0cmluZyk6IG51bWJlciB7XHJcbiAgICAvLyBRdWljayBjaGVjayBmb3IgY29tbW9uIG51bGwgY2FzZXMuXHJcbiAgICBpZiAoIXRleHQxIHx8ICF0ZXh0MiB8fFxyXG4gICAgICAgIHRleHQxLmNoYXJBdCh0ZXh0MS5sZW5ndGggLSAxKSAhPSB0ZXh0Mi5jaGFyQXQodGV4dDIubGVuZ3RoIC0gMSkpIHtcclxuICAgICAgcmV0dXJuIDA7XHJcbiAgICB9XHJcbiAgICAvLyBCaW5hcnkgc2VhcmNoLlxyXG4gICAgLy8gUGVyZm9ybWFuY2UgYW5hbHlzaXM6IGh0dHA6Ly9uZWlsLmZyYXNlci5uYW1lL25ld3MvMjAwNy8xMC8wOS9cclxuICAgIGxldCBwb2ludGVybWluID0gMDtcclxuICAgIGxldCBwb2ludGVybWF4ID0gTWF0aC5taW4odGV4dDEubGVuZ3RoLCB0ZXh0Mi5sZW5ndGgpO1xyXG4gICAgbGV0IHBvaW50ZXJtaWQgPSBwb2ludGVybWF4O1xyXG4gICAgbGV0IHBvaW50ZXJlbmQgPSAwO1xyXG4gICAgd2hpbGUgKHBvaW50ZXJtaW4gPCBwb2ludGVybWlkKSB7XHJcbiAgICAgIGlmICh0ZXh0MS5zdWJzdHJpbmcodGV4dDEubGVuZ3RoIC0gcG9pbnRlcm1pZCwgdGV4dDEubGVuZ3RoIC0gcG9pbnRlcmVuZCkgPT1cclxuICAgICAgICAgIHRleHQyLnN1YnN0cmluZyh0ZXh0Mi5sZW5ndGggLSBwb2ludGVybWlkLCB0ZXh0Mi5sZW5ndGggLSBwb2ludGVyZW5kKSkge1xyXG4gICAgICAgIHBvaW50ZXJtaW4gPSBwb2ludGVybWlkO1xyXG4gICAgICAgIHBvaW50ZXJlbmQgPSBwb2ludGVybWluO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHBvaW50ZXJtYXggPSBwb2ludGVybWlkO1xyXG4gICAgICB9XHJcbiAgICAgIHBvaW50ZXJtaWQgPSBNYXRoLmZsb29yKChwb2ludGVybWF4IC0gcG9pbnRlcm1pbikgLyAyICsgcG9pbnRlcm1pbik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcG9pbnRlcm1pZDtcclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogRGV0ZXJtaW5lIGlmIHRoZSBzdWZmaXggb2Ygb25lIHN0cmluZyBpcyB0aGUgcHJlZml4IG9mIGFub3RoZXIuXHJcbiAgICogQHBhcmFtICB0ZXh0MSBGaXJzdCBzdHJpbmcuXHJcbiAgICogQHBhcmFtICB0ZXh0MiBTZWNvbmQgc3RyaW5nLlxyXG4gICAqIEByZXR1cm4gIFRoZSBudW1iZXIgb2YgY2hhcmFjdGVycyBjb21tb24gdG8gdGhlIGVuZCBvZiB0aGUgZmlyc3RcclxuICAgKiAgICAgc3RyaW5nIGFuZCB0aGUgc3RhcnQgb2YgdGhlIHNlY29uZCBzdHJpbmcuXHJcblxyXG4gICAqL1xyXG4gICAgZGlmZl9jb21tb25PdmVybGFwXyAodGV4dDE6IHN0cmluZywgdGV4dDI6IHN0cmluZyk6IG51bWJlciB7XHJcbiAgICAvLyBDYWNoZSB0aGUgdGV4dCBsZW5ndGhzIHRvIHByZXZlbnQgbXVsdGlwbGUgY2FsbHMuXHJcbiAgICBjb25zdCB0ZXh0MV9sZW5ndGggPSB0ZXh0MS5sZW5ndGg7XHJcbiAgICBjb25zdCB0ZXh0Ml9sZW5ndGggPSB0ZXh0Mi5sZW5ndGg7XHJcbiAgICAvLyBFbGltaW5hdGUgdGhlIG51bGwgY2FzZS5cclxuICAgIGlmICh0ZXh0MV9sZW5ndGggPT0gMCB8fCB0ZXh0Ml9sZW5ndGggPT0gMCkge1xyXG4gICAgICByZXR1cm4gMDtcclxuICAgIH1cclxuICAgIC8vIFRydW5jYXRlIHRoZSBsb25nZXIgc3RyaW5nLlxyXG4gICAgaWYgKHRleHQxX2xlbmd0aCA+IHRleHQyX2xlbmd0aCkge1xyXG4gICAgICB0ZXh0MSA9IHRleHQxLnN1YnN0cmluZyh0ZXh0MV9sZW5ndGggLSB0ZXh0Ml9sZW5ndGgpO1xyXG4gICAgfSBlbHNlIGlmICh0ZXh0MV9sZW5ndGggPCB0ZXh0Ml9sZW5ndGgpIHtcclxuICAgICAgdGV4dDIgPSB0ZXh0Mi5zdWJzdHJpbmcoMCwgdGV4dDFfbGVuZ3RoKTtcclxuICAgIH1cclxuICAgIGNvbnN0IHRleHRfbGVuZ3RoID0gTWF0aC5taW4odGV4dDFfbGVuZ3RoLCB0ZXh0Ml9sZW5ndGgpO1xyXG4gICAgLy8gUXVpY2sgY2hlY2sgZm9yIHRoZSB3b3JzdCBjYXNlLlxyXG4gICAgaWYgKHRleHQxID09IHRleHQyKSB7XHJcbiAgICAgIHJldHVybiB0ZXh0X2xlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTdGFydCBieSBsb29raW5nIGZvciBhIHNpbmdsZSBjaGFyYWN0ZXIgbWF0Y2hcclxuICAgIC8vIGFuZCBpbmNyZWFzZSBsZW5ndGggdW50aWwgbm8gbWF0Y2ggaXMgZm91bmQuXHJcbiAgICAvLyBQZXJmb3JtYW5jZSBhbmFseXNpczogaHR0cDovL25laWwuZnJhc2VyLm5hbWUvbmV3cy8yMDEwLzExLzA0L1xyXG4gICAgbGV0IGJlc3QgPSAwO1xyXG4gICAgbGV0IGxlbmd0aCA9IDE7XHJcbiAgICB3aGlsZSAodHJ1ZSkge1xyXG4gICAgICBjb25zdCBwYXR0ZXJuID0gdGV4dDEuc3Vic3RyaW5nKHRleHRfbGVuZ3RoIC0gbGVuZ3RoKTtcclxuICAgICAgY29uc3QgZm91bmQgPSB0ZXh0Mi5pbmRleE9mKHBhdHRlcm4pO1xyXG4gICAgICBpZiAoZm91bmQgPT0gLTEpIHtcclxuICAgICAgICByZXR1cm4gYmVzdDtcclxuICAgICAgfVxyXG4gICAgICBsZW5ndGggKz0gZm91bmQ7XHJcbiAgICAgIGlmIChmb3VuZCA9PSAwIHx8IHRleHQxLnN1YnN0cmluZyh0ZXh0X2xlbmd0aCAtIGxlbmd0aCkgPT1cclxuICAgICAgICAgIHRleHQyLnN1YnN0cmluZygwLCBsZW5ndGgpKSB7XHJcbiAgICAgICAgYmVzdCA9IGxlbmd0aDtcclxuICAgICAgICBsZW5ndGgrKztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBEbyB0aGUgdHdvIHRleHRzIHNoYXJlIGEgc3Vic3RyaW5nIHdoaWNoIGlzIGF0IGxlYXN0IGhhbGYgdGhlIGxlbmd0aCBvZiB0aGVcclxuICAgKiBsb25nZXIgdGV4dD9cclxuICAgKiBUaGlzIHNwZWVkdXAgY2FuIHByb2R1Y2Ugbm9uLW1pbmltYWwgZGlmZnMuXHJcbiAgICogQHBhcmFtICB0ZXh0MSBGaXJzdCBzdHJpbmcuXHJcbiAgICogQHBhcmFtICB0ZXh0MiBTZWNvbmQgc3RyaW5nLlxyXG4gICAqIEByZXR1cm4gIEZpdmUgZWxlbWVudCBBcnJheSwgY29udGFpbmluZyB0aGUgcHJlZml4IG9mXHJcbiAgICogICAgIHRleHQxLCB0aGUgc3VmZml4IG9mIHRleHQxLCB0aGUgcHJlZml4IG9mIHRleHQyLCB0aGUgc3VmZml4IG9mXHJcbiAgICogICAgIHRleHQyIGFuZCB0aGUgY29tbW9uIG1pZGRsZS4gIE9yIG51bGwgaWYgdGhlcmUgd2FzIG5vIG1hdGNoLlxyXG5cclxuICAgKi9cclxuICAgIGRpZmZfaGFsZk1hdGNoXyAodGV4dDE6IHN0cmluZywgdGV4dDI6IHN0cmluZykge1xyXG4gICAgaWYgKHRoaXMuRGlmZl9UaW1lb3V0IDw9IDApIHtcclxuICAgICAgLy8gRG9uJ3QgcmlzayByZXR1cm5pbmcgYSBub24tb3B0aW1hbCBkaWZmIGlmIHdlIGhhdmUgdW5saW1pdGVkIHRpbWUuXHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbG9uZ3RleHQgPSB0ZXh0MS5sZW5ndGggPiB0ZXh0Mi5sZW5ndGggPyB0ZXh0MSA6IHRleHQyO1xyXG4gICAgY29uc3Qgc2hvcnR0ZXh0ID0gdGV4dDEubGVuZ3RoID4gdGV4dDIubGVuZ3RoID8gdGV4dDIgOiB0ZXh0MTtcclxuICAgIGlmIChsb25ndGV4dC5sZW5ndGggPCA0IHx8IHNob3J0dGV4dC5sZW5ndGggKiAyIDwgbG9uZ3RleHQubGVuZ3RoKSB7XHJcbiAgICAgIHJldHVybiBudWxsOyAgLy8gUG9pbnRsZXNzLlxyXG4gICAgfVxyXG4gICAgY29uc3QgZG1wID0gdGhpczsgIC8vICd0aGlzJyBiZWNvbWVzICd3aW5kb3cnIGluIGEgY2xvc3VyZS5cclxuXHJcblxyXG4gICAgLy8gRmlyc3QgY2hlY2sgaWYgdGhlIHNlY29uZCBxdWFydGVyIGlzIHRoZSBzZWVkIGZvciBhIGhhbGYtbWF0Y2guXHJcbiAgICBjb25zdCBobTEgPSB0aGlzLmRpZmZfaGFsZk1hdGNoSV8obG9uZ3RleHQsIHNob3J0dGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5jZWlsKGxvbmd0ZXh0Lmxlbmd0aCAvIDQpLCBkbXApO1xyXG4gICAgLy8gQ2hlY2sgYWdhaW4gYmFzZWQgb24gdGhlIHRoaXJkIHF1YXJ0ZXIuXHJcbiAgICBjb25zdCBobTIgPSB0aGlzLmRpZmZfaGFsZk1hdGNoSV8obG9uZ3RleHQsIHNob3J0dGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5jZWlsKGxvbmd0ZXh0Lmxlbmd0aCAvIDIpLCBkbXApO1xyXG4gICAgbGV0IGhtO1xyXG4gICAgaWYgKCFobTEgJiYgIWhtMikge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH0gZWxzZSBpZiAoIWhtMikge1xyXG4gICAgICBobSA9IGhtMTtcclxuICAgIH0gZWxzZSBpZiAoIWhtMSkge1xyXG4gICAgICBobSA9IGhtMjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIEJvdGggbWF0Y2hlZC4gIFNlbGVjdCB0aGUgbG9uZ2VzdC5cclxuICAgICAgaG0gPSBobTFbNF0ubGVuZ3RoID4gaG0yWzRdLmxlbmd0aCA/IGhtMSA6IGhtMjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBBIGhhbGYtbWF0Y2ggd2FzIGZvdW5kLCBzb3J0IG91dCB0aGUgcmV0dXJuIGRhdGEuXHJcbiAgICBsZXQgdGV4dDFfYSwgdGV4dDFfYiwgdGV4dDJfYSwgdGV4dDJfYjtcclxuICAgIGlmICh0ZXh0MS5sZW5ndGggPiB0ZXh0Mi5sZW5ndGgpIHtcclxuICAgICAgdGV4dDFfYSA9IGhtWzBdO1xyXG4gICAgICB0ZXh0MV9iID0gaG1bMV07XHJcbiAgICAgIHRleHQyX2EgPSBobVsyXTtcclxuICAgICAgdGV4dDJfYiA9IGhtWzNdO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGV4dDJfYSA9IGhtWzBdO1xyXG4gICAgICB0ZXh0Ml9iID0gaG1bMV07XHJcbiAgICAgIHRleHQxX2EgPSBobVsyXTtcclxuICAgICAgdGV4dDFfYiA9IGhtWzNdO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbWlkX2NvbW1vbiA9IGhtWzRdO1xyXG4gICAgcmV0dXJuIFt0ZXh0MV9hLCB0ZXh0MV9iLCB0ZXh0Ml9hLCB0ZXh0Ml9iLCBtaWRfY29tbW9uXTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBEb2VzIGEgc3Vic3RyaW5nIG9mIHNob3J0dGV4dCBleGlzdCB3aXRoaW4gbG9uZ3RleHQgc3VjaCB0aGF0IHRoZSBzdWJzdHJpbmdcclxuICAgKiBpcyBhdCBsZWFzdCBoYWxmIHRoZSBsZW5ndGggb2YgbG9uZ3RleHQ/XHJcbiAgICogQ2xvc3VyZSwgYnV0IGRvZXMgbm90IHJlZmVyZW5jZSBhbnkgZXh0ZXJuYWwgY29uc3RpYWJsZXMuXHJcbiAgICogQHBhcmFtICBsb25ndGV4dCBMb25nZXIgc3RyaW5nLlxyXG4gICAqIEBwYXJhbSAgc2hvcnR0ZXh0IFNob3J0ZXIgc3RyaW5nLlxyXG4gICAqIEBwYXJhbSAgaSBTdGFydCBpbmRleCBvZiBxdWFydGVyIGxlbmd0aCBzdWJzdHJpbmcgd2l0aGluIGxvbmd0ZXh0LlxyXG4gICAqIEByZXR1cm4gIEZpdmUgZWxlbWVudCBBcnJheSwgY29udGFpbmluZyB0aGUgcHJlZml4IG9mXHJcbiAgICogICAgIGxvbmd0ZXh0LCB0aGUgc3VmZml4IG9mIGxvbmd0ZXh0LCB0aGUgcHJlZml4IG9mIHNob3J0dGV4dCwgdGhlIHN1ZmZpeFxyXG4gICAqICAgICBvZiBzaG9ydHRleHQgYW5kIHRoZSBjb21tb24gbWlkZGxlLiAgT3IgbnVsbCBpZiB0aGVyZSB3YXMgbm8gbWF0Y2guXHJcblxyXG4gICAqL1xyXG4gIGRpZmZfaGFsZk1hdGNoSV8obG9uZ3RleHQ6IHN0cmluZywgc2hvcnR0ZXh0OiBzdHJpbmcsIGk6IG51bWJlciwgZG1wOiBEaWZmTWF0Y2hQYXRjaCk6IEFycmF5PHN0cmluZz4ge1xyXG4gICAgLy8gU3RhcnQgd2l0aCBhIDEvNCBsZW5ndGggc3Vic3RyaW5nIGF0IHBvc2l0aW9uIGkgYXMgYSBzZWVkLlxyXG4gICAgY29uc3Qgc2VlZCA9IGxvbmd0ZXh0LnN1YnN0cmluZyhpLCBpICsgTWF0aC5mbG9vcihsb25ndGV4dC5sZW5ndGggLyA0KSk7XHJcbiAgICBsZXQgaiA9IC0xO1xyXG4gICAgbGV0IGJlc3RfY29tbW9uID0gJyc7XHJcbiAgICBsZXQgYmVzdF9sb25ndGV4dF9hLCBiZXN0X2xvbmd0ZXh0X2IsIGJlc3Rfc2hvcnR0ZXh0X2EsIGJlc3Rfc2hvcnR0ZXh0X2I7XHJcbiAgICB3aGlsZSAoKGogPSBzaG9ydHRleHQuaW5kZXhPZihzZWVkLCBqICsgMSkpICE9IC0xKSB7XHJcbiAgICAgIGNvbnN0IHByZWZpeExlbmd0aCA9IGRtcC5kaWZmX2NvbW1vblByZWZpeChsb25ndGV4dC5zdWJzdHJpbmcoaSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG9ydHRleHQuc3Vic3RyaW5nKGopKTtcclxuICAgICAgY29uc3Qgc3VmZml4TGVuZ3RoID0gZG1wLmRpZmZfY29tbW9uU3VmZml4KGxvbmd0ZXh0LnN1YnN0cmluZygwLCBpKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3J0dGV4dC5zdWJzdHJpbmcoMCwgaikpO1xyXG4gICAgICBpZiAoYmVzdF9jb21tb24ubGVuZ3RoIDwgc3VmZml4TGVuZ3RoICsgcHJlZml4TGVuZ3RoKSB7XHJcbiAgICAgICAgYmVzdF9jb21tb24gPSBzaG9ydHRleHQuc3Vic3RyaW5nKGogLSBzdWZmaXhMZW5ndGgsIGopICtcclxuICAgICAgICAgICAgc2hvcnR0ZXh0LnN1YnN0cmluZyhqLCBqICsgcHJlZml4TGVuZ3RoKTtcclxuICAgICAgICBiZXN0X2xvbmd0ZXh0X2EgPSBsb25ndGV4dC5zdWJzdHJpbmcoMCwgaSAtIHN1ZmZpeExlbmd0aCk7XHJcbiAgICAgICAgYmVzdF9sb25ndGV4dF9iID0gbG9uZ3RleHQuc3Vic3RyaW5nKGkgKyBwcmVmaXhMZW5ndGgpO1xyXG4gICAgICAgIGJlc3Rfc2hvcnR0ZXh0X2EgPSBzaG9ydHRleHQuc3Vic3RyaW5nKDAsIGogLSBzdWZmaXhMZW5ndGgpO1xyXG4gICAgICAgIGJlc3Rfc2hvcnR0ZXh0X2IgPSBzaG9ydHRleHQuc3Vic3RyaW5nKGogKyBwcmVmaXhMZW5ndGgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAoYmVzdF9jb21tb24ubGVuZ3RoICogMiA+PSBsb25ndGV4dC5sZW5ndGgpIHtcclxuICAgICAgcmV0dXJuIFtiZXN0X2xvbmd0ZXh0X2EsIGJlc3RfbG9uZ3RleHRfYixcclxuICAgICAgICAgICAgICBiZXN0X3Nob3J0dGV4dF9hLCBiZXN0X3Nob3J0dGV4dF9iLCBiZXN0X2NvbW1vbl07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlZHVjZSB0aGUgbnVtYmVyIG9mIGVkaXRzIGJ5IGVsaW1pbmF0aW5nIHNlbWFudGljYWxseSB0cml2aWFsIGVxdWFsaXRpZXMuXHJcbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cclxuICAgKi9cclxuICAgIGRpZmZfY2xlYW51cFNlbWFudGljIChkaWZmczogQXJyYXk8RGlmZj4pIHtcclxuICAgIGxldCBjaGFuZ2VzID0gZmFsc2U7XHJcbiAgICBjb25zdCBlcXVhbGl0aWVzID0gW107ICAvLyBTdGFjayBvZiBpbmRpY2VzIHdoZXJlIGVxdWFsaXRpZXMgYXJlIGZvdW5kLlxyXG4gICAgbGV0IGVxdWFsaXRpZXNMZW5ndGggPSAwOyAgLy8gS2VlcGluZyBvdXIgb3duIGxlbmd0aCBjb25zdCBpcyBmYXN0ZXIgaW4gSlMuXHJcblxyXG4gICAgbGV0IGxhc3RlcXVhbGl0eSA9IG51bGw7XHJcbiAgICAvLyBBbHdheXMgZXF1YWwgdG8gZGlmZnNbZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoIC0gMV1dWzFdXHJcbiAgICBsZXQgcG9pbnRlciA9IDA7ICAvLyBJbmRleCBvZiBjdXJyZW50IHBvc2l0aW9uLlxyXG4gICAgLy8gTnVtYmVyIG9mIGNoYXJhY3RlcnMgdGhhdCBjaGFuZ2VkIHByaW9yIHRvIHRoZSBlcXVhbGl0eS5cclxuICAgIGxldCBsZW5ndGhfaW5zZXJ0aW9uczEgPSAwO1xyXG4gICAgbGV0IGxlbmd0aF9kZWxldGlvbnMxID0gMDtcclxuICAgIC8vIE51bWJlciBvZiBjaGFyYWN0ZXJzIHRoYXQgY2hhbmdlZCBhZnRlciB0aGUgZXF1YWxpdHkuXHJcbiAgICBsZXQgbGVuZ3RoX2luc2VydGlvbnMyID0gMDtcclxuICAgIGxldCBsZW5ndGhfZGVsZXRpb25zMiA9IDA7XHJcbiAgICB3aGlsZSAocG9pbnRlciA8IGRpZmZzLmxlbmd0aCkge1xyXG4gICAgICBpZiAoZGlmZnNbcG9pbnRlcl1bMF0gPT0gRGlmZk9wLkVxdWFsKSB7ICAvLyBFcXVhbGl0eSBmb3VuZC5cclxuICAgICAgICBlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGgrK10gPSBwb2ludGVyO1xyXG4gICAgICAgIGxlbmd0aF9pbnNlcnRpb25zMSA9IGxlbmd0aF9pbnNlcnRpb25zMjtcclxuICAgICAgICBsZW5ndGhfZGVsZXRpb25zMSA9IGxlbmd0aF9kZWxldGlvbnMyO1xyXG4gICAgICAgIGxlbmd0aF9pbnNlcnRpb25zMiA9IDA7XHJcbiAgICAgICAgbGVuZ3RoX2RlbGV0aW9uczIgPSAwO1xyXG4gICAgICAgIGxhc3RlcXVhbGl0eSA9IGRpZmZzW3BvaW50ZXJdWzFdO1xyXG4gICAgICB9IGVsc2UgeyAgLy8gQW4gaW5zZXJ0aW9uIG9yIGRlbGV0aW9uLlxyXG4gICAgICAgIGlmIChkaWZmc1twb2ludGVyXVswXSA9PSBEaWZmT3AuSW5zZXJ0KSB7XHJcbiAgICAgICAgICBsZW5ndGhfaW5zZXJ0aW9uczIgKz0gZGlmZnNbcG9pbnRlcl1bMV0ubGVuZ3RoO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBsZW5ndGhfZGVsZXRpb25zMiArPSBkaWZmc1twb2ludGVyXVsxXS5sZW5ndGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEVsaW1pbmF0ZSBhbiBlcXVhbGl0eSB0aGF0IGlzIHNtYWxsZXIgb3IgZXF1YWwgdG8gdGhlIGVkaXRzIG9uIGJvdGhcclxuICAgICAgICAvLyBzaWRlcyBvZiBpdC5cclxuICAgICAgICBpZiAobGFzdGVxdWFsaXR5ICYmIChsYXN0ZXF1YWxpdHkubGVuZ3RoIDw9XHJcbiAgICAgICAgICAgIE1hdGgubWF4KGxlbmd0aF9pbnNlcnRpb25zMSwgbGVuZ3RoX2RlbGV0aW9uczEpKSAmJlxyXG4gICAgICAgICAgICAobGFzdGVxdWFsaXR5Lmxlbmd0aCA8PSBNYXRoLm1heChsZW5ndGhfaW5zZXJ0aW9uczIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVuZ3RoX2RlbGV0aW9uczIpKSkge1xyXG4gICAgICAgICAgLy8gRHVwbGljYXRlIHJlY29yZC5cclxuICAgICAgICAgIGRpZmZzLnNwbGljZShlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGggLSAxXSwgMCxcclxuICAgICAgICAgICAgICAgICAgICAgIFtEaWZmT3AuRGVsZXRlLCBsYXN0ZXF1YWxpdHldKTtcclxuICAgICAgICAgIC8vIENoYW5nZSBzZWNvbmQgY29weSB0byBpbnNlcnQuXHJcbiAgICAgICAgICBkaWZmc1tlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGggLSAxXSArIDFdWzBdID0gRGlmZk9wLkluc2VydDtcclxuICAgICAgICAgIC8vIFRocm93IGF3YXkgdGhlIGVxdWFsaXR5IHdlIGp1c3QgZGVsZXRlZC5cclxuICAgICAgICAgIGVxdWFsaXRpZXNMZW5ndGgtLTtcclxuICAgICAgICAgIC8vIFRocm93IGF3YXkgdGhlIHByZXZpb3VzIGVxdWFsaXR5IChpdCBuZWVkcyB0byBiZSByZWV2YWx1YXRlZCkuXHJcbiAgICAgICAgICBlcXVhbGl0aWVzTGVuZ3RoLS07XHJcbiAgICAgICAgICBwb2ludGVyID0gZXF1YWxpdGllc0xlbmd0aCA+IDAgPyBlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGggLSAxXSA6IC0xO1xyXG4gICAgICAgICAgbGVuZ3RoX2luc2VydGlvbnMxID0gMDsgIC8vIFJlc2V0IHRoZSBjb3VudGVycy5cclxuICAgICAgICAgIGxlbmd0aF9kZWxldGlvbnMxID0gMDtcclxuICAgICAgICAgIGxlbmd0aF9pbnNlcnRpb25zMiA9IDA7XHJcbiAgICAgICAgICBsZW5ndGhfZGVsZXRpb25zMiA9IDA7XHJcbiAgICAgICAgICBsYXN0ZXF1YWxpdHkgPSBudWxsO1xyXG4gICAgICAgICAgY2hhbmdlcyA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHBvaW50ZXIrKztcclxuICAgIH1cclxuXHJcbiAgICAvLyBOb3JtYWxpemUgdGhlIGRpZmYuXHJcbiAgICBpZiAoY2hhbmdlcykge1xyXG4gICAgICB0aGlzLmRpZmZfY2xlYW51cE1lcmdlKGRpZmZzKTtcclxuICAgIH1cclxuICAgIHRoaXMuZGlmZl9jbGVhbnVwU2VtYW50aWNMb3NzbGVzcyhkaWZmcyk7XHJcblxyXG4gICAgLy8gRmluZCBhbnkgb3ZlcmxhcHMgYmV0d2VlbiBkZWxldGlvbnMgYW5kIGluc2VydGlvbnMuXHJcbiAgICAvLyBlLmc6IDxkZWw+YWJjeHh4PC9kZWw+PGlucz54eHhkZWY8L2lucz5cclxuICAgIC8vICAgLT4gPGRlbD5hYmM8L2RlbD54eHg8aW5zPmRlZjwvaW5zPlxyXG4gICAgLy8gZS5nOiA8ZGVsPnh4eGFiYzwvZGVsPjxpbnM+ZGVmeHh4PC9pbnM+XHJcbiAgICAvLyAgIC0+IDxpbnM+ZGVmPC9pbnM+eHh4PGRlbD5hYmM8L2RlbD5cclxuICAgIC8vIE9ubHkgZXh0cmFjdCBhbiBvdmVybGFwIGlmIGl0IGlzIGFzIGJpZyBhcyB0aGUgZWRpdCBhaGVhZCBvciBiZWhpbmQgaXQuXHJcbiAgICBwb2ludGVyID0gMTtcclxuICAgIHdoaWxlIChwb2ludGVyIDwgZGlmZnMubGVuZ3RoKSB7XHJcbiAgICAgIGlmIChkaWZmc1twb2ludGVyIC0gMV1bMF0gPT0gRGlmZk9wLkRlbGV0ZSAmJlxyXG4gICAgICAgICAgZGlmZnNbcG9pbnRlcl1bMF0gPT0gRGlmZk9wLkluc2VydCkge1xyXG4gICAgICAgIGNvbnN0IGRlbGV0aW9uID0gZGlmZnNbcG9pbnRlciAtIDFdWzFdO1xyXG4gICAgICAgIGNvbnN0IGluc2VydGlvbiA9IGRpZmZzW3BvaW50ZXJdWzFdO1xyXG4gICAgICAgIGNvbnN0IG92ZXJsYXBfbGVuZ3RoMSA9IHRoaXMuZGlmZl9jb21tb25PdmVybGFwXyhkZWxldGlvbiwgaW5zZXJ0aW9uKTtcclxuICAgICAgICBjb25zdCBvdmVybGFwX2xlbmd0aDIgPSB0aGlzLmRpZmZfY29tbW9uT3ZlcmxhcF8oaW5zZXJ0aW9uLCBkZWxldGlvbik7XHJcbiAgICAgICAgaWYgKG92ZXJsYXBfbGVuZ3RoMSA+PSBvdmVybGFwX2xlbmd0aDIpIHtcclxuICAgICAgICAgIGlmIChvdmVybGFwX2xlbmd0aDEgPj0gZGVsZXRpb24ubGVuZ3RoIC8gMiB8fFxyXG4gICAgICAgICAgICAgIG92ZXJsYXBfbGVuZ3RoMSA+PSBpbnNlcnRpb24ubGVuZ3RoIC8gMikge1xyXG4gICAgICAgICAgICAvLyBPdmVybGFwIGZvdW5kLiAgSW5zZXJ0IGFuIGVxdWFsaXR5IGFuZCB0cmltIHRoZSBzdXJyb3VuZGluZyBlZGl0cy5cclxuICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIsIDAsXHJcbiAgICAgICAgICAgICAgICBbRGlmZk9wLkVxdWFsLCBpbnNlcnRpb24uc3Vic3RyaW5nKDAsIG92ZXJsYXBfbGVuZ3RoMSldKTtcclxuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciAtIDFdWzFdID1cclxuICAgICAgICAgICAgICAgIGRlbGV0aW9uLnN1YnN0cmluZygwLCBkZWxldGlvbi5sZW5ndGggLSBvdmVybGFwX2xlbmd0aDEpO1xyXG4gICAgICAgICAgICBkaWZmc1twb2ludGVyICsgMV1bMV0gPSBpbnNlcnRpb24uc3Vic3RyaW5nKG92ZXJsYXBfbGVuZ3RoMSk7XHJcbiAgICAgICAgICAgIHBvaW50ZXIrKztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYgKG92ZXJsYXBfbGVuZ3RoMiA+PSBkZWxldGlvbi5sZW5ndGggLyAyIHx8XHJcbiAgICAgICAgICAgICAgb3ZlcmxhcF9sZW5ndGgyID49IGluc2VydGlvbi5sZW5ndGggLyAyKSB7XHJcbiAgICAgICAgICAgIC8vIFJldmVyc2Ugb3ZlcmxhcCBmb3VuZC5cclxuICAgICAgICAgICAgLy8gSW5zZXJ0IGFuIGVxdWFsaXR5IGFuZCBzd2FwIGFuZCB0cmltIHRoZSBzdXJyb3VuZGluZyBlZGl0cy5cclxuICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIsIDAsXHJcbiAgICAgICAgICAgICAgICBbRGlmZk9wLkVxdWFsLCBkZWxldGlvbi5zdWJzdHJpbmcoMCwgb3ZlcmxhcF9sZW5ndGgyKV0pO1xyXG4gICAgICAgICAgICBkaWZmc1twb2ludGVyIC0gMV1bMF0gPSBEaWZmT3AuSW5zZXJ0O1xyXG4gICAgICAgICAgICBkaWZmc1twb2ludGVyIC0gMV1bMV0gPVxyXG4gICAgICAgICAgICAgICAgaW5zZXJ0aW9uLnN1YnN0cmluZygwLCBpbnNlcnRpb24ubGVuZ3RoIC0gb3ZlcmxhcF9sZW5ndGgyKTtcclxuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciArIDFdWzBdID0gRGlmZk9wLkRlbGV0ZTtcclxuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciArIDFdWzFdID1cclxuICAgICAgICAgICAgICAgIGRlbGV0aW9uLnN1YnN0cmluZyhvdmVybGFwX2xlbmd0aDIpO1xyXG4gICAgICAgICAgICBwb2ludGVyKys7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHBvaW50ZXIrKztcclxuICAgICAgfVxyXG4gICAgICBwb2ludGVyKys7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIExvb2sgZm9yIHNpbmdsZSBlZGl0cyBzdXJyb3VuZGVkIG9uIGJvdGggc2lkZXMgYnkgZXF1YWxpdGllc1xyXG4gICAqIHdoaWNoIGNhbiBiZSBzaGlmdGVkIHNpZGV3YXlzIHRvIGFsaWduIHRoZSBlZGl0IHRvIGEgd29yZCBib3VuZGFyeS5cclxuICAgKiBlLmc6IFRoZSBjPGlucz5hdCBjPC9pbnM+YW1lLiAtPiBUaGUgPGlucz5jYXQgPC9pbnM+Y2FtZS5cclxuICAgKiBAcGFyYW0gIGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxyXG4gICAqL1xyXG4gICAgZGlmZl9jbGVhbnVwU2VtYW50aWNMb3NzbGVzcyAoZGlmZnM6IEFycmF5PERpZmY+KSB7XHJcbiAgICAvKipcclxuICAgICAqIEdpdmVuIHR3byBzdHJpbmdzLCBjb21wdXRlIGEgc2NvcmUgcmVwcmVzZW50aW5nIHdoZXRoZXIgdGhlIGludGVybmFsXHJcbiAgICAgKiBib3VuZGFyeSBmYWxscyBvbiBsb2dpY2FsIGJvdW5kYXJpZXMuXHJcbiAgICAgKiBTY29yZXMgcmFuZ2UgZnJvbSA2IChiZXN0KSB0byAwICh3b3JzdCkuXHJcbiAgICAgKiBDbG9zdXJlLCBidXQgZG9lcyBub3QgcmVmZXJlbmNlIGFueSBleHRlcm5hbCBjb25zdGlhYmxlcy5cclxuICAgICAqIEBwYXJhbSAgb25lIEZpcnN0IHN0cmluZy5cclxuICAgICAqIEBwYXJhbSAgdHdvIFNlY29uZCBzdHJpbmcuXHJcbiAgICAgKiBAcmV0dXJuICBUaGUgc2NvcmUuXHJcblxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBkaWZmX2NsZWFudXBTZW1hbnRpY1Njb3JlXyhvbmU6IHN0cmluZywgdHdvOiBzdHJpbmcpOiBudW1iZXIge1xyXG4gICAgICBpZiAoIW9uZSB8fCAhdHdvKSB7XHJcbiAgICAgICAgLy8gRWRnZXMgYXJlIHRoZSBiZXN0LlxyXG4gICAgICAgIHJldHVybiA2O1xyXG4gICAgICB9XHJcblxyXG5cclxuICAgICAgY29uc3Qgbm9uQWxwaGFOdW1lcmljUmVnZXhfID0gbmV3IFJlZ0V4cCgnL1teYS16QS1aMC05XS8nKTtcclxuXHJcbiAgICAgIC8vIEVhY2ggcG9ydCBvZiB0aGlzIGZ1bmN0aW9uIGJlaGF2ZXMgc2xpZ2h0bHkgZGlmZmVyZW50bHkgZHVlIHRvXHJcbiAgICAgIC8vIHN1YnRsZSBkaWZmZXJlbmNlcyBpbiBlYWNoIGxhbmd1YWdlJ3MgZGVmaW5pdGlvbiBvZiB0aGluZ3MgbGlrZVxyXG4gICAgICAvLyAnd2hpdGVzcGFjZScuICBTaW5jZSB0aGlzIGZ1bmN0aW9uJ3MgcHVycG9zZSBpcyBsYXJnZWx5IGNvc21ldGljLFxyXG4gICAgICAvLyB0aGUgY2hvaWNlIGhhcyBiZWVuIG1hZGUgdG8gdXNlIGVhY2ggbGFuZ3VhZ2UncyBuYXRpdmUgZmVhdHVyZXNcclxuICAgICAgLy8gcmF0aGVyIHRoYW4gZm9yY2UgdG90YWwgY29uZm9ybWl0eS5cclxuICAgICAgY29uc3QgY2hhcjEgPSBvbmUuY2hhckF0KG9uZS5sZW5ndGggLSAxKTtcclxuICAgICAgY29uc3QgY2hhcjIgPSB0d28uY2hhckF0KDApO1xyXG4gICAgICBjb25zdCBub25BbHBoYU51bWVyaWMxID0gY2hhcjEubWF0Y2gobm9uQWxwaGFOdW1lcmljUmVnZXhfKTtcclxuICAgICAgY29uc3Qgbm9uQWxwaGFOdW1lcmljMiA9IGNoYXIyLm1hdGNoKG5vbkFscGhhTnVtZXJpY1JlZ2V4Xyk7XHJcbiAgICAgIGNvbnN0IHdoaXRlc3BhY2UxID0gbm9uQWxwaGFOdW1lcmljMSAmJlxyXG4gICAgICAgICAgY2hhcjEubWF0Y2godGhpcy53aGl0ZXNwYWNlUmVnZXhfKTtcclxuICAgICAgY29uc3Qgd2hpdGVzcGFjZTIgPSBub25BbHBoYU51bWVyaWMyICYmXHJcbiAgICAgICAgICBjaGFyMi5tYXRjaCh0aGlzLndoaXRlc3BhY2VSZWdleF8pO1xyXG4gICAgICBjb25zdCBsaW5lQnJlYWsxID0gd2hpdGVzcGFjZTEgJiZcclxuICAgICAgICAgIGNoYXIxLm1hdGNoKHRoaXMubGluZWJyZWFrUmVnZXhfKTtcclxuICAgICAgY29uc3QgbGluZUJyZWFrMiA9IHdoaXRlc3BhY2UyICYmXHJcbiAgICAgICAgICBjaGFyMi5tYXRjaCh0aGlzLmxpbmVicmVha1JlZ2V4Xyk7XHJcbiAgICAgIGNvbnN0IGJsYW5rTGluZTEgPSBsaW5lQnJlYWsxICYmXHJcbiAgICAgICAgICBvbmUubWF0Y2godGhpcy5ibGFua2xpbmVFbmRSZWdleF8pO1xyXG4gICAgICBjb25zdCBibGFua0xpbmUyID0gbGluZUJyZWFrMiAmJlxyXG4gICAgICAgICAgdHdvLm1hdGNoKHRoaXMuYmxhbmtsaW5lU3RhcnRSZWdleF8pO1xyXG5cclxuICAgICAgaWYgKGJsYW5rTGluZTEgfHwgYmxhbmtMaW5lMikge1xyXG4gICAgICAgIC8vIEZpdmUgcG9pbnRzIGZvciBibGFuayBsaW5lcy5cclxuICAgICAgICByZXR1cm4gNTtcclxuICAgICAgfSBlbHNlIGlmIChsaW5lQnJlYWsxIHx8IGxpbmVCcmVhazIpIHtcclxuICAgICAgICAvLyBGb3VyIHBvaW50cyBmb3IgbGluZSBicmVha3MuXHJcbiAgICAgICAgcmV0dXJuIDQ7XHJcbiAgICAgIH0gZWxzZSBpZiAobm9uQWxwaGFOdW1lcmljMSAmJiAhd2hpdGVzcGFjZTEgJiYgd2hpdGVzcGFjZTIpIHtcclxuICAgICAgICAvLyBUaHJlZSBwb2ludHMgZm9yIGVuZCBvZiBzZW50ZW5jZXMuXHJcbiAgICAgICAgcmV0dXJuIDM7XHJcbiAgICAgIH0gZWxzZSBpZiAod2hpdGVzcGFjZTEgfHwgd2hpdGVzcGFjZTIpIHtcclxuICAgICAgICAvLyBUd28gcG9pbnRzIGZvciB3aGl0ZXNwYWNlLlxyXG4gICAgICAgIHJldHVybiAyO1xyXG4gICAgICB9IGVsc2UgaWYgKG5vbkFscGhhTnVtZXJpYzEgfHwgbm9uQWxwaGFOdW1lcmljMikge1xyXG4gICAgICAgIC8vIE9uZSBwb2ludCBmb3Igbm9uLWFscGhhbnVtZXJpYy5cclxuICAgICAgICByZXR1cm4gMTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gMDtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgcG9pbnRlciA9IDE7XHJcbiAgICAvLyBJbnRlbnRpb25hbGx5IGlnbm9yZSB0aGUgZmlyc3QgYW5kIGxhc3QgZWxlbWVudCAoZG9uJ3QgbmVlZCBjaGVja2luZykuXHJcbiAgICB3aGlsZSAocG9pbnRlciA8IGRpZmZzLmxlbmd0aCAtIDEpIHtcclxuICAgICAgaWYgKGRpZmZzW3BvaW50ZXIgLSAxXVswXSA9PSBEaWZmT3AuRXF1YWwgJiZcclxuICAgICAgICAgIGRpZmZzW3BvaW50ZXIgKyAxXVswXSA9PSBEaWZmT3AuRXF1YWwpIHtcclxuICAgICAgICAvLyBUaGlzIGlzIGEgc2luZ2xlIGVkaXQgc3Vycm91bmRlZCBieSBlcXVhbGl0aWVzLlxyXG4gICAgICAgIGxldCBlcXVhbGl0eTEgPSBkaWZmc1twb2ludGVyIC0gMV1bMV07XHJcbiAgICAgICAgbGV0IGVkaXQgPSBkaWZmc1twb2ludGVyXVsxXTtcclxuICAgICAgICBsZXQgZXF1YWxpdHkyID0gZGlmZnNbcG9pbnRlciArIDFdWzFdO1xyXG5cclxuICAgICAgICAvLyBGaXJzdCwgc2hpZnQgdGhlIGVkaXQgYXMgZmFyIGxlZnQgYXMgcG9zc2libGUuXHJcbiAgICAgICAgY29uc3QgY29tbW9uT2Zmc2V0ID0gdGhpcy5kaWZmX2NvbW1vblN1ZmZpeChlcXVhbGl0eTEsIGVkaXQpO1xyXG4gICAgICAgIGlmIChjb21tb25PZmZzZXQpIHtcclxuICAgICAgICAgIGNvbnN0IGNvbW1vblN0cmluZyA9IGVkaXQuc3Vic3RyaW5nKGVkaXQubGVuZ3RoIC0gY29tbW9uT2Zmc2V0KTtcclxuICAgICAgICAgIGVxdWFsaXR5MSA9IGVxdWFsaXR5MS5zdWJzdHJpbmcoMCwgZXF1YWxpdHkxLmxlbmd0aCAtIGNvbW1vbk9mZnNldCk7XHJcbiAgICAgICAgICBlZGl0ID0gY29tbW9uU3RyaW5nICsgZWRpdC5zdWJzdHJpbmcoMCwgZWRpdC5sZW5ndGggLSBjb21tb25PZmZzZXQpO1xyXG4gICAgICAgICAgZXF1YWxpdHkyID0gY29tbW9uU3RyaW5nICsgZXF1YWxpdHkyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gU2Vjb25kLCBzdGVwIGNoYXJhY3RlciBieSBjaGFyYWN0ZXIgcmlnaHQsIGxvb2tpbmcgZm9yIHRoZSBiZXN0IGZpdC5cclxuICAgICAgICBsZXQgYmVzdEVxdWFsaXR5MSA9IGVxdWFsaXR5MTtcclxuICAgICAgICBsZXQgYmVzdEVkaXQgPSBlZGl0O1xyXG4gICAgICAgIGxldCBiZXN0RXF1YWxpdHkyID0gZXF1YWxpdHkyO1xyXG4gICAgICAgIGxldCBiZXN0U2NvcmUgPSBkaWZmX2NsZWFudXBTZW1hbnRpY1Njb3JlXyhlcXVhbGl0eTEsIGVkaXQpICtcclxuICAgICAgICAgICAgZGlmZl9jbGVhbnVwU2VtYW50aWNTY29yZV8oZWRpdCwgZXF1YWxpdHkyKTtcclxuICAgICAgICB3aGlsZSAoZWRpdC5jaGFyQXQoMCkgPT09IGVxdWFsaXR5Mi5jaGFyQXQoMCkpIHtcclxuICAgICAgICAgIGVxdWFsaXR5MSArPSBlZGl0LmNoYXJBdCgwKTtcclxuICAgICAgICAgIGVkaXQgPSBlZGl0LnN1YnN0cmluZygxKSArIGVxdWFsaXR5Mi5jaGFyQXQoMCk7XHJcbiAgICAgICAgICBlcXVhbGl0eTIgPSBlcXVhbGl0eTIuc3Vic3RyaW5nKDEpO1xyXG4gICAgICAgICAgY29uc3Qgc2NvcmUgPSBkaWZmX2NsZWFudXBTZW1hbnRpY1Njb3JlXyhlcXVhbGl0eTEsIGVkaXQpICtcclxuICAgICAgICAgICAgICBkaWZmX2NsZWFudXBTZW1hbnRpY1Njb3JlXyhlZGl0LCBlcXVhbGl0eTIpO1xyXG4gICAgICAgICAgLy8gVGhlID49IGVuY291cmFnZXMgdHJhaWxpbmcgcmF0aGVyIHRoYW4gbGVhZGluZyB3aGl0ZXNwYWNlIG9uIGVkaXRzLlxyXG4gICAgICAgICAgaWYgKHNjb3JlID49IGJlc3RTY29yZSkge1xyXG4gICAgICAgICAgICBiZXN0U2NvcmUgPSBzY29yZTtcclxuICAgICAgICAgICAgYmVzdEVxdWFsaXR5MSA9IGVxdWFsaXR5MTtcclxuICAgICAgICAgICAgYmVzdEVkaXQgPSBlZGl0O1xyXG4gICAgICAgICAgICBiZXN0RXF1YWxpdHkyID0gZXF1YWxpdHkyO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGRpZmZzW3BvaW50ZXIgLSAxXVsxXSAhPSBiZXN0RXF1YWxpdHkxKSB7XHJcbiAgICAgICAgICAvLyBXZSBoYXZlIGFuIGltcHJvdmVtZW50LCBzYXZlIGl0IGJhY2sgdG8gdGhlIGRpZmYuXHJcbiAgICAgICAgICBpZiAoYmVzdEVxdWFsaXR5MSkge1xyXG4gICAgICAgICAgICBkaWZmc1twb2ludGVyIC0gMV1bMV0gPSBiZXN0RXF1YWxpdHkxO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIgLSAxLCAxKTtcclxuICAgICAgICAgICAgcG9pbnRlci0tO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZGlmZnNbcG9pbnRlcl1bMV0gPSBiZXN0RWRpdDtcclxuICAgICAgICAgIGlmIChiZXN0RXF1YWxpdHkyKSB7XHJcbiAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgKyAxXVsxXSA9IGJlc3RFcXVhbGl0eTI7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciArIDEsIDEpO1xyXG4gICAgICAgICAgICBwb2ludGVyLS07XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHBvaW50ZXIrKztcclxuICAgIH1cclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogUmVkdWNlIHRoZSBudW1iZXIgb2YgZWRpdHMgYnkgZWxpbWluYXRpbmcgb3BlcmF0aW9uYWxseSB0cml2aWFsIGVxdWFsaXRpZXMuXHJcbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cclxuICAgKi9cclxuICAgIGRpZmZfY2xlYW51cEVmZmljaWVuY3kgKGRpZmZzOiBBcnJheTxEaWZmPikge1xyXG4gICAgbGV0IGNoYW5nZXMgPSBmYWxzZTtcclxuICAgIGNvbnN0IGVxdWFsaXRpZXMgPSBbXTsgIC8vIFN0YWNrIG9mIGluZGljZXMgd2hlcmUgZXF1YWxpdGllcyBhcmUgZm91bmQuXHJcbiAgICBsZXQgZXF1YWxpdGllc0xlbmd0aCA9IDA7ICAvLyBLZWVwaW5nIG91ciBvd24gbGVuZ3RoIGNvbnN0IGlzIGZhc3RlciBpbiBKUy5cclxuXHJcbiAgICBsZXQgbGFzdGVxdWFsaXR5ID0gbnVsbDtcclxuICAgIC8vIEFsd2F5cyBlcXVhbCB0byBkaWZmc1tlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGggLSAxXV1bMV1cclxuICAgIGxldCBwb2ludGVyID0gMDsgIC8vIEluZGV4IG9mIGN1cnJlbnQgcG9zaXRpb24uXHJcbiAgICAvLyBJcyB0aGVyZSBhbiBpbnNlcnRpb24gb3BlcmF0aW9uIGJlZm9yZSB0aGUgbGFzdCBlcXVhbGl0eS5cclxuICAgIGxldCBwcmVfaW5zID0gZmFsc2U7XHJcbiAgICAvLyBJcyB0aGVyZSBhIGRlbGV0aW9uIG9wZXJhdGlvbiBiZWZvcmUgdGhlIGxhc3QgZXF1YWxpdHkuXHJcbiAgICBsZXQgcHJlX2RlbCA9IGZhbHNlO1xyXG4gICAgLy8gSXMgdGhlcmUgYW4gaW5zZXJ0aW9uIG9wZXJhdGlvbiBhZnRlciB0aGUgbGFzdCBlcXVhbGl0eS5cclxuICAgIGxldCBwb3N0X2lucyA9IGZhbHNlO1xyXG4gICAgLy8gSXMgdGhlcmUgYSBkZWxldGlvbiBvcGVyYXRpb24gYWZ0ZXIgdGhlIGxhc3QgZXF1YWxpdHkuXHJcbiAgICBsZXQgcG9zdF9kZWwgPSBmYWxzZTtcclxuICAgIHdoaWxlIChwb2ludGVyIDwgZGlmZnMubGVuZ3RoKSB7XHJcbiAgICAgIGlmIChkaWZmc1twb2ludGVyXVswXSA9PSBEaWZmT3AuRXF1YWwpIHsgIC8vIEVxdWFsaXR5IGZvdW5kLlxyXG4gICAgICAgIGlmIChkaWZmc1twb2ludGVyXVsxXS5sZW5ndGggPCB0aGlzLkRpZmZfRWRpdENvc3QgJiZcclxuICAgICAgICAgICAgKHBvc3RfaW5zIHx8IHBvc3RfZGVsKSkge1xyXG4gICAgICAgICAgLy8gQ2FuZGlkYXRlIGZvdW5kLlxyXG4gICAgICAgICAgZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoKytdID0gcG9pbnRlcjtcclxuICAgICAgICAgIHByZV9pbnMgPSBwb3N0X2lucztcclxuICAgICAgICAgIHByZV9kZWwgPSBwb3N0X2RlbDtcclxuICAgICAgICAgIGxhc3RlcXVhbGl0eSA9IGRpZmZzW3BvaW50ZXJdWzFdO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAvLyBOb3QgYSBjYW5kaWRhdGUsIGFuZCBjYW4gbmV2ZXIgYmVjb21lIG9uZS5cclxuICAgICAgICAgIGVxdWFsaXRpZXNMZW5ndGggPSAwO1xyXG4gICAgICAgICAgbGFzdGVxdWFsaXR5ID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcG9zdF9pbnMgPSBwb3N0X2RlbCA9IGZhbHNlO1xyXG4gICAgICB9IGVsc2UgeyAgLy8gQW4gaW5zZXJ0aW9uIG9yIGRlbGV0aW9uLlxyXG4gICAgICAgIGlmIChkaWZmc1twb2ludGVyXVswXSA9PSBEaWZmT3AuRGVsZXRlKSB7XHJcbiAgICAgICAgICBwb3N0X2RlbCA9IHRydWU7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHBvc3RfaW5zID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLypcclxuICAgICAgICAqIEZpdmUgdHlwZXMgdG8gYmUgc3BsaXQ6XHJcbiAgICAgICAgKiA8aW5zPkE8L2lucz48ZGVsPkI8L2RlbD5YWTxpbnM+QzwvaW5zPjxkZWw+RDwvZGVsPlxyXG4gICAgICAgICogPGlucz5BPC9pbnM+WDxpbnM+QzwvaW5zPjxkZWw+RDwvZGVsPlxyXG4gICAgICAgICogPGlucz5BPC9pbnM+PGRlbD5CPC9kZWw+WDxpbnM+QzwvaW5zPlxyXG4gICAgICAgICogPGlucz5BPC9kZWw+WDxpbnM+QzwvaW5zPjxkZWw+RDwvZGVsPlxyXG4gICAgICAgICogPGlucz5BPC9pbnM+PGRlbD5CPC9kZWw+WDxkZWw+QzwvZGVsPlxyXG4gICAgICAgICovXHJcbiAgICAgICAgaWYgKGxhc3RlcXVhbGl0eSAmJiAoKHByZV9pbnMgJiYgcHJlX2RlbCAmJiBwb3N0X2lucyAmJiBwb3N0X2RlbCkgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICgobGFzdGVxdWFsaXR5Lmxlbmd0aCA8IHRoaXMuRGlmZl9FZGl0Q29zdCAvIDIpICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKHByZV9pbnM/MTowKSArIChwcmVfZGVsPzE6MCkgKyAocG9zdF9pbnM/MTowKSArIChwb3N0X2RlbD8xOjApID09IDMpKSkpIHtcclxuICAgICAgICAgIC8vIER1cGxpY2F0ZSByZWNvcmQuXHJcbiAgICAgICAgICBkaWZmcy5zcGxpY2UoZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoIC0gMV0sIDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICBbRGlmZk9wLkRlbGV0ZSwgbGFzdGVxdWFsaXR5XSk7XHJcbiAgICAgICAgICAvLyBDaGFuZ2Ugc2Vjb25kIGNvcHkgdG8gaW5zZXJ0LlxyXG4gICAgICAgICAgZGlmZnNbZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoIC0gMV0gKyAxXVswXSA9IERpZmZPcC5JbnNlcnQ7XHJcbiAgICAgICAgICBlcXVhbGl0aWVzTGVuZ3RoLS07ICAvLyBUaHJvdyBhd2F5IHRoZSBlcXVhbGl0eSB3ZSBqdXN0IGRlbGV0ZWQ7XHJcbiAgICAgICAgICBsYXN0ZXF1YWxpdHkgPSBudWxsO1xyXG4gICAgICAgICAgaWYgKHByZV9pbnMgJiYgcHJlX2RlbCkge1xyXG4gICAgICAgICAgICAvLyBObyBjaGFuZ2VzIG1hZGUgd2hpY2ggY291bGQgYWZmZWN0IHByZXZpb3VzIGVudHJ5LCBrZWVwIGdvaW5nLlxyXG4gICAgICAgICAgICBwb3N0X2lucyA9IHBvc3RfZGVsID0gdHJ1ZTtcclxuICAgICAgICAgICAgZXF1YWxpdGllc0xlbmd0aCA9IDA7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBlcXVhbGl0aWVzTGVuZ3RoLS07ICAvLyBUaHJvdyBhd2F5IHRoZSBwcmV2aW91cyBlcXVhbGl0eS5cclxuICAgICAgICAgICAgcG9pbnRlciA9IGVxdWFsaXRpZXNMZW5ndGggPiAwID9cclxuICAgICAgICAgICAgICAgIGVxdWFsaXRpZXNbZXF1YWxpdGllc0xlbmd0aCAtIDFdIDogLTE7XHJcbiAgICAgICAgICAgIHBvc3RfaW5zID0gcG9zdF9kZWwgPSBmYWxzZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNoYW5nZXMgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBwb2ludGVyKys7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGNoYW5nZXMpIHtcclxuICAgICAgdGhpcy5kaWZmX2NsZWFudXBNZXJnZShkaWZmcyk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIFJlb3JkZXIgYW5kIG1lcmdlIGxpa2UgZWRpdCBzZWN0aW9ucy4gIE1lcmdlIGVxdWFsaXRpZXMuXHJcbiAgICogQW55IGVkaXQgc2VjdGlvbiBjYW4gbW92ZSBhcyBsb25nIGFzIGl0IGRvZXNuJ3QgY3Jvc3MgYW4gZXF1YWxpdHkuXHJcbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cclxuICAgKi9cclxuICAgIGRpZmZfY2xlYW51cE1lcmdlIChkaWZmczogQXJyYXk8RGlmZj4pIHtcclxuICAgIGRpZmZzLnB1c2goW0RpZmZPcC5FcXVhbCwgJyddKTsgIC8vIEFkZCBhIGR1bW15IGVudHJ5IGF0IHRoZSBlbmQuXHJcbiAgICBsZXQgcG9pbnRlciA9IDA7XHJcbiAgICBsZXQgY291bnRfZGVsZXRlID0gMDtcclxuICAgIGxldCBjb3VudF9pbnNlcnQgPSAwO1xyXG4gICAgbGV0IHRleHRfZGVsZXRlID0gJyc7XHJcbiAgICBsZXQgdGV4dF9pbnNlcnQgPSAnJztcclxuICAgIGxldCBjb21tb25sZW5ndGg7XHJcbiAgICB3aGlsZSAocG9pbnRlciA8IGRpZmZzLmxlbmd0aCkge1xyXG4gICAgICBzd2l0Y2ggKGRpZmZzW3BvaW50ZXJdWzBdKSB7XHJcbiAgICAgICAgY2FzZSBEaWZmT3AuSW5zZXJ0OlxyXG4gICAgICAgICAgY291bnRfaW5zZXJ0Kys7XHJcbiAgICAgICAgICB0ZXh0X2luc2VydCArPSBkaWZmc1twb2ludGVyXVsxXTtcclxuICAgICAgICAgIHBvaW50ZXIrKztcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgRGlmZk9wLkRlbGV0ZTpcclxuICAgICAgICAgIGNvdW50X2RlbGV0ZSsrO1xyXG4gICAgICAgICAgdGV4dF9kZWxldGUgKz0gZGlmZnNbcG9pbnRlcl1bMV07XHJcbiAgICAgICAgICBwb2ludGVyKys7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIERpZmZPcC5FcXVhbDpcclxuICAgICAgICAgIC8vIFVwb24gcmVhY2hpbmcgYW4gZXF1YWxpdHksIGNoZWNrIGZvciBwcmlvciByZWR1bmRhbmNpZXMuXHJcbiAgICAgICAgICBpZiAoY291bnRfZGVsZXRlICsgY291bnRfaW5zZXJ0ID4gMSkge1xyXG4gICAgICAgICAgICBpZiAoY291bnRfZGVsZXRlICE9PSAwICYmIGNvdW50X2luc2VydCAhPT0gMCkge1xyXG4gICAgICAgICAgICAgIC8vIEZhY3RvciBvdXQgYW55IGNvbW1vbiBwcmVmaXhpZXMuXHJcbiAgICAgICAgICAgICAgY29tbW9ubGVuZ3RoID0gdGhpcy5kaWZmX2NvbW1vblByZWZpeCh0ZXh0X2luc2VydCwgdGV4dF9kZWxldGUpO1xyXG4gICAgICAgICAgICAgIGlmIChjb21tb25sZW5ndGggIT09IDApIHtcclxuICAgICAgICAgICAgICAgIGlmICgocG9pbnRlciAtIGNvdW50X2RlbGV0ZSAtIGNvdW50X2luc2VydCkgPiAwICYmXHJcbiAgICAgICAgICAgICAgICAgICAgZGlmZnNbcG9pbnRlciAtIGNvdW50X2RlbGV0ZSAtIGNvdW50X2luc2VydCAtIDFdWzBdID09XHJcbiAgICAgICAgICAgICAgICAgICAgRGlmZk9wLkVxdWFsKSB7XHJcbiAgICAgICAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgLSBjb3VudF9kZWxldGUgLSBjb3VudF9pbnNlcnQgLSAxXVsxXSArPVxyXG4gICAgICAgICAgICAgICAgICAgICAgdGV4dF9pbnNlcnQuc3Vic3RyaW5nKDAsIGNvbW1vbmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICBkaWZmcy5zcGxpY2UoMCwgMCwgW0RpZmZPcC5FcXVhbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0X2luc2VydC5zdWJzdHJpbmcoMCwgY29tbW9ubGVuZ3RoKV0pO1xyXG4gICAgICAgICAgICAgICAgICBwb2ludGVyKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0ZXh0X2luc2VydCA9IHRleHRfaW5zZXJ0LnN1YnN0cmluZyhjb21tb25sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgdGV4dF9kZWxldGUgPSB0ZXh0X2RlbGV0ZS5zdWJzdHJpbmcoY29tbW9ubGVuZ3RoKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgLy8gRmFjdG9yIG91dCBhbnkgY29tbW9uIHN1ZmZpeGllcy5cclxuICAgICAgICAgICAgICBjb21tb25sZW5ndGggPSB0aGlzLmRpZmZfY29tbW9uU3VmZml4KHRleHRfaW5zZXJ0LCB0ZXh0X2RlbGV0ZSk7XHJcbiAgICAgICAgICAgICAgaWYgKGNvbW1vbmxlbmd0aCAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgZGlmZnNbcG9pbnRlcl1bMV0gPSB0ZXh0X2luc2VydC5zdWJzdHJpbmcodGV4dF9pbnNlcnQubGVuZ3RoIC1cclxuICAgICAgICAgICAgICAgICAgICBjb21tb25sZW5ndGgpICsgZGlmZnNbcG9pbnRlcl1bMV07XHJcbiAgICAgICAgICAgICAgICB0ZXh0X2luc2VydCA9IHRleHRfaW5zZXJ0LnN1YnN0cmluZygwLCB0ZXh0X2luc2VydC5sZW5ndGggLVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbW1vbmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0X2RlbGV0ZSA9IHRleHRfZGVsZXRlLnN1YnN0cmluZygwLCB0ZXh0X2RlbGV0ZS5sZW5ndGggLVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbW1vbmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIERlbGV0ZSB0aGUgb2ZmZW5kaW5nIHJlY29yZHMgYW5kIGFkZCB0aGUgbWVyZ2VkIG9uZXMuXHJcbiAgICAgICAgICAgIGlmIChjb3VudF9kZWxldGUgPT09IDApIHtcclxuICAgICAgICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciAtIGNvdW50X2luc2VydCxcclxuICAgICAgICAgICAgICAgICAgY291bnRfZGVsZXRlICsgY291bnRfaW5zZXJ0LCBbRGlmZk9wLkluc2VydCwgdGV4dF9pbnNlcnRdKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChjb3VudF9pbnNlcnQgPT09IDApIHtcclxuICAgICAgICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciAtIGNvdW50X2RlbGV0ZSxcclxuICAgICAgICAgICAgICAgICAgY291bnRfZGVsZXRlICsgY291bnRfaW5zZXJ0LCBbRGlmZk9wLkRlbGV0ZSwgdGV4dF9kZWxldGVdKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciAtIGNvdW50X2RlbGV0ZSAtIGNvdW50X2luc2VydCxcclxuICAgICAgICAgICAgICAgICAgY291bnRfZGVsZXRlICsgY291bnRfaW5zZXJ0LCBbRGlmZk9wLkRlbGV0ZSwgdGV4dF9kZWxldGVdLFxyXG4gICAgICAgICAgICAgICAgICBbRGlmZk9wLkluc2VydCwgdGV4dF9pbnNlcnRdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBwb2ludGVyID0gcG9pbnRlciAtIGNvdW50X2RlbGV0ZSAtIGNvdW50X2luc2VydCArXHJcbiAgICAgICAgICAgICAgICAgICAgICAoY291bnRfZGVsZXRlID8gMSA6IDApICsgKGNvdW50X2luc2VydCA/IDEgOiAwKSArIDE7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKHBvaW50ZXIgIT09IDAgJiYgZGlmZnNbcG9pbnRlciAtIDFdWzBdID09IERpZmZPcC5FcXVhbCkge1xyXG4gICAgICAgICAgICAvLyBNZXJnZSB0aGlzIGVxdWFsaXR5IHdpdGggdGhlIHByZXZpb3VzIG9uZS5cclxuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciAtIDFdWzFdICs9IGRpZmZzW3BvaW50ZXJdWzFdO1xyXG4gICAgICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciwgMSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBwb2ludGVyKys7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjb3VudF9pbnNlcnQgPSAwO1xyXG4gICAgICAgICAgY291bnRfZGVsZXRlID0gMDtcclxuICAgICAgICAgIHRleHRfZGVsZXRlID0gJyc7XHJcbiAgICAgICAgICB0ZXh0X2luc2VydCA9ICcnO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGlmIChkaWZmc1tkaWZmcy5sZW5ndGggLSAxXVsxXSA9PT0gJycpIHtcclxuICAgICAgZGlmZnMucG9wKCk7ICAvLyBSZW1vdmUgdGhlIGR1bW15IGVudHJ5IGF0IHRoZSBlbmQuXHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2Vjb25kIHBhc3M6IGxvb2sgZm9yIHNpbmdsZSBlZGl0cyBzdXJyb3VuZGVkIG9uIGJvdGggc2lkZXMgYnkgZXF1YWxpdGllc1xyXG4gICAgLy8gd2hpY2ggY2FuIGJlIHNoaWZ0ZWQgc2lkZXdheXMgdG8gZWxpbWluYXRlIGFuIGVxdWFsaXR5LlxyXG4gICAgLy8gZS5nOiBBPGlucz5CQTwvaW5zPkMgLT4gPGlucz5BQjwvaW5zPkFDXHJcbiAgICBsZXQgY2hhbmdlcyA9IGZhbHNlO1xyXG4gICAgcG9pbnRlciA9IDE7XHJcbiAgICAvLyBJbnRlbnRpb25hbGx5IGlnbm9yZSB0aGUgZmlyc3QgYW5kIGxhc3QgZWxlbWVudCAoZG9uJ3QgbmVlZCBjaGVja2luZykuXHJcbiAgICB3aGlsZSAocG9pbnRlciA8IGRpZmZzLmxlbmd0aCAtIDEpIHtcclxuICAgICAgaWYgKGRpZmZzW3BvaW50ZXIgLSAxXVswXSA9PSBEaWZmT3AuRXF1YWwgJiZcclxuICAgICAgICAgIGRpZmZzW3BvaW50ZXIgKyAxXVswXSA9PSBEaWZmT3AuRXF1YWwpIHtcclxuICAgICAgICAvLyBUaGlzIGlzIGEgc2luZ2xlIGVkaXQgc3Vycm91bmRlZCBieSBlcXVhbGl0aWVzLlxyXG4gICAgICAgIGlmIChkaWZmc1twb2ludGVyXVsxXS5zdWJzdHJpbmcoZGlmZnNbcG9pbnRlcl1bMV0ubGVuZ3RoIC1cclxuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciAtIDFdWzFdLmxlbmd0aCkgPT0gZGlmZnNbcG9pbnRlciAtIDFdWzFdKSB7XHJcbiAgICAgICAgICAvLyBTaGlmdCB0aGUgZWRpdCBvdmVyIHRoZSBwcmV2aW91cyBlcXVhbGl0eS5cclxuICAgICAgICAgIGRpZmZzW3BvaW50ZXJdWzFdID0gZGlmZnNbcG9pbnRlciAtIDFdWzFdICtcclxuICAgICAgICAgICAgICBkaWZmc1twb2ludGVyXVsxXS5zdWJzdHJpbmcoMCwgZGlmZnNbcG9pbnRlcl1bMV0ubGVuZ3RoIC1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZnNbcG9pbnRlciAtIDFdWzFdLmxlbmd0aCk7XHJcbiAgICAgICAgICBkaWZmc1twb2ludGVyICsgMV1bMV0gPSBkaWZmc1twb2ludGVyIC0gMV1bMV0gKyBkaWZmc1twb2ludGVyICsgMV1bMV07XHJcbiAgICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciAtIDEsIDEpO1xyXG4gICAgICAgICAgY2hhbmdlcyA9IHRydWU7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkaWZmc1twb2ludGVyXVsxXS5zdWJzdHJpbmcoMCwgZGlmZnNbcG9pbnRlciArIDFdWzFdLmxlbmd0aCkgPT1cclxuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciArIDFdWzFdKSB7XHJcbiAgICAgICAgICAvLyBTaGlmdCB0aGUgZWRpdCBvdmVyIHRoZSBuZXh0IGVxdWFsaXR5LlxyXG4gICAgICAgICAgZGlmZnNbcG9pbnRlciAtIDFdWzFdICs9IGRpZmZzW3BvaW50ZXIgKyAxXVsxXTtcclxuICAgICAgICAgIGRpZmZzW3BvaW50ZXJdWzFdID1cclxuICAgICAgICAgICAgICBkaWZmc1twb2ludGVyXVsxXS5zdWJzdHJpbmcoZGlmZnNbcG9pbnRlciArIDFdWzFdLmxlbmd0aCkgK1xyXG4gICAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgKyAxXVsxXTtcclxuICAgICAgICAgIGRpZmZzLnNwbGljZShwb2ludGVyICsgMSwgMSk7XHJcbiAgICAgICAgICBjaGFuZ2VzID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcG9pbnRlcisrO1xyXG4gICAgfVxyXG4gICAgLy8gSWYgc2hpZnRzIHdlcmUgbWFkZSwgdGhlIGRpZmYgbmVlZHMgcmVvcmRlcmluZyBhbmQgYW5vdGhlciBzaGlmdCBzd2VlcC5cclxuICAgIGlmIChjaGFuZ2VzKSB7XHJcbiAgICAgIHRoaXMuZGlmZl9jbGVhbnVwTWVyZ2UoZGlmZnMpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBsb2MgaXMgYSBsb2NhdGlvbiBpbiB0ZXh0MSwgY29tcHV0ZSBhbmQgcmV0dXJuIHRoZSBlcXVpdmFsZW50IGxvY2F0aW9uIGluXHJcbiAgICogdGV4dDIuXHJcbiAgICogZS5nLiAnVGhlIGNhdCcgdnMgJ1RoZSBiaWcgY2F0JywgMS0+MSwgNS0+OFxyXG4gICAqIEBwYXJhbSAgZGlmZnMgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXHJcbiAgICogQHBhcmFtICBsb2MgTG9jYXRpb24gd2l0aGluIHRleHQxLlxyXG4gICAqIEByZXR1cm4gIExvY2F0aW9uIHdpdGhpbiB0ZXh0Mi5cclxuICAgKi9cclxuICAgIGRpZmZfeEluZGV4IChkaWZmczogQXJyYXk8RGlmZj4sIGxvYzogbnVtYmVyKTogbnVtYmVyIHtcclxuICAgIGxldCBjaGFyczEgPSAwO1xyXG4gICAgbGV0IGNoYXJzMiA9IDA7XHJcbiAgICBsZXQgbGFzdF9jaGFyczEgPSAwO1xyXG4gICAgbGV0IGxhc3RfY2hhcnMyID0gMDtcclxuICAgIGxldCB4O1xyXG4gICAgZm9yICh4ID0gMDsgeCA8IGRpZmZzLmxlbmd0aDsgeCsrKSB7XHJcbiAgICAgIGlmIChkaWZmc1t4XVswXSAhPT0gRGlmZk9wLkluc2VydCkgeyAgLy8gRXF1YWxpdHkgb3IgZGVsZXRpb24uXHJcbiAgICAgICAgY2hhcnMxICs9IGRpZmZzW3hdWzFdLmxlbmd0aDtcclxuICAgICAgfVxyXG4gICAgICBpZiAoZGlmZnNbeF1bMF0gIT09IERpZmZPcC5EZWxldGUpIHsgIC8vIEVxdWFsaXR5IG9yIGluc2VydGlvbi5cclxuICAgICAgICBjaGFyczIgKz0gZGlmZnNbeF1bMV0ubGVuZ3RoO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChjaGFyczEgPiBsb2MpIHsgIC8vIE92ZXJzaG90IHRoZSBsb2NhdGlvbi5cclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgICBsYXN0X2NoYXJzMSA9IGNoYXJzMTtcclxuICAgICAgbGFzdF9jaGFyczIgPSBjaGFyczI7XHJcbiAgICB9XHJcbiAgICAvLyBXYXMgdGhlIGxvY2F0aW9uIHdhcyBkZWxldGVkP1xyXG4gICAgaWYgKGRpZmZzLmxlbmd0aCAhPSB4ICYmIGRpZmZzW3hdWzBdID09PSBEaWZmT3AuRGVsZXRlKSB7XHJcbiAgICAgIHJldHVybiBsYXN0X2NoYXJzMjtcclxuICAgIH1cclxuICAgIC8vIEFkZCB0aGUgcmVtYWluaW5nIGNoYXJhY3RlciBsZW5ndGguXHJcbiAgICByZXR1cm4gbGFzdF9jaGFyczIgKyAobG9jIC0gbGFzdF9jaGFyczEpO1xyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBDb252ZXJ0IGEgZGlmZiBhcnJheSBpbnRvIGEgcHJldHR5IEhUTUwgcmVwb3J0LlxyXG4gICAqIEBwYXJhbSAgZGlmZnMgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXHJcbiAgICogQHJldHVybiAgSFRNTCByZXByZXNlbnRhdGlvbi5cclxuICAgKi9cclxuICAgIGRpZmZfcHJldHR5SHRtbCA9IGZ1bmN0aW9uKGRpZmZzOiBBcnJheTxEaWZmPik6IHN0cmluZyB7XHJcbiAgICBjb25zdCBodG1sID0gW107XHJcbiAgICBjb25zdCBwYXR0ZXJuX2FtcCA9IC8mL2c7XHJcbiAgICBjb25zdCBwYXR0ZXJuX2x0ID0gLzwvZztcclxuICAgIGNvbnN0IHBhdHRlcm5fZ3QgPSAvPi9nO1xyXG4gICAgY29uc3QgcGF0dGVybl9wYXJhID0gL1xcbi9nO1xyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBkaWZmcy5sZW5ndGg7IHgrKykge1xyXG4gICAgICBjb25zdCBvcCA9IGRpZmZzW3hdWzBdOyAgICAvLyBPcGVyYXRpb24gKGluc2VydCwgZGVsZXRlLCBlcXVhbClcclxuICAgICAgY29uc3QgZGF0YSA9IGRpZmZzW3hdWzFdOyAgLy8gVGV4dCBvZiBjaGFuZ2UuXHJcbiAgICAgIGNvbnN0IHRleHQgPSBkYXRhLnJlcGxhY2UocGF0dGVybl9hbXAsICcmYW1wOycpLnJlcGxhY2UocGF0dGVybl9sdCwgJyZsdDsnKVxyXG4gICAgICAgICAgLnJlcGxhY2UocGF0dGVybl9ndCwgJyZndDsnKS5yZXBsYWNlKHBhdHRlcm5fcGFyYSwgJyZwYXJhOzxicj4nKTtcclxuICAgICAgc3dpdGNoIChvcCkge1xyXG4gICAgICAgIGNhc2UgRGlmZk9wLkluc2VydDpcclxuICAgICAgICAgIGh0bWxbeF0gPSAnPGlucyBzdHlsZT1cImJhY2tncm91bmQ6I2U2ZmZlNjtcIj4nICsgdGV4dCArICc8L2lucz4nO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBEaWZmT3AuRGVsZXRlOlxyXG4gICAgICAgICAgaHRtbFt4XSA9ICc8ZGVsIHN0eWxlPVwiYmFja2dyb3VuZDojZmZlNmU2O1wiPicgKyB0ZXh0ICsgJzwvZGVsPic7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIERpZmZPcC5FcXVhbDpcclxuICAgICAgICAgIGh0bWxbeF0gPSAnPHNwYW4+JyArIHRleHQgKyAnPC9zcGFuPic7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGh0bWwuam9pbignJyk7XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIENvbXB1dGUgYW5kIHJldHVybiB0aGUgc291cmNlIHRleHQgKGFsbCBlcXVhbGl0aWVzIGFuZCBkZWxldGlvbnMpLlxyXG4gICAqIEBwYXJhbSAgZGlmZnMgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXHJcbiAgICogQHJldHVybiAgU291cmNlIHRleHQuXHJcbiAgICovXHJcbiAgICBkaWZmX3RleHQxIChkaWZmczogQXJyYXk8RGlmZj4pOiBzdHJpbmcge1xyXG4gICAgY29uc3QgdGV4dCA9IFtdO1xyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBkaWZmcy5sZW5ndGg7IHgrKykge1xyXG4gICAgICBpZiAoZGlmZnNbeF1bMF0gIT09IERpZmZPcC5JbnNlcnQpIHtcclxuICAgICAgICB0ZXh0W3hdID0gZGlmZnNbeF1bMV07XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0ZXh0LmpvaW4oJycpO1xyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBDb21wdXRlIGFuZCByZXR1cm4gdGhlIGRlc3RpbmF0aW9uIHRleHQgKGFsbCBlcXVhbGl0aWVzIGFuZCBpbnNlcnRpb25zKS5cclxuICAgKiBAcGFyYW0gIGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxyXG4gICAqIEByZXR1cm4gIERlc3RpbmF0aW9uIHRleHQuXHJcbiAgICovXHJcbiAgICBkaWZmX3RleHQyIChkaWZmczogQXJyYXk8RGlmZj4pOiBzdHJpbmcge1xyXG4gICAgY29uc3QgdGV4dCA9IFtdO1xyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBkaWZmcy5sZW5ndGg7IHgrKykge1xyXG4gICAgICBpZiAoZGlmZnNbeF1bMF0gIT09IERpZmZPcC5EZWxldGUpIHtcclxuICAgICAgICB0ZXh0W3hdID0gZGlmZnNbeF1bMV07XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0ZXh0LmpvaW4oJycpO1xyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBDb21wdXRlIHRoZSBMZXZlbnNodGVpbiBkaXN0YW5jZTsgdGhlIG51bWJlciBvZiBpbnNlcnRlZCwgZGVsZXRlZCBvclxyXG4gICAqIHN1YnN0aXR1dGVkIGNoYXJhY3RlcnMuXHJcbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cclxuICAgKiBAcmV0dXJuICBOdW1iZXIgb2YgY2hhbmdlcy5cclxuICAgKi9cclxuICAgIGRpZmZfbGV2ZW5zaHRlaW4gKGRpZmZzOiBBcnJheTxEaWZmPik6IG51bWJlciB7XHJcbiAgICBsZXQgbGV2ZW5zaHRlaW4gPSAwO1xyXG4gICAgbGV0IGluc2VydGlvbnMgPSAwO1xyXG4gICAgbGV0IGRlbGV0aW9ucyA9IDA7XHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGRpZmZzLmxlbmd0aDsgeCsrKSB7XHJcbiAgICAgIGNvbnN0IG9wID0gZGlmZnNbeF1bMF07XHJcbiAgICAgIGNvbnN0IGRhdGEgPSBkaWZmc1t4XVsxXTtcclxuICAgICAgc3dpdGNoIChvcCkge1xyXG4gICAgICAgIGNhc2UgRGlmZk9wLkluc2VydDpcclxuICAgICAgICAgIGluc2VydGlvbnMgKz0gZGF0YS5sZW5ndGg7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIERpZmZPcC5EZWxldGU6XHJcbiAgICAgICAgICBkZWxldGlvbnMgKz0gZGF0YS5sZW5ndGg7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIERpZmZPcC5FcXVhbDpcclxuICAgICAgICAgIC8vIEEgZGVsZXRpb24gYW5kIGFuIGluc2VydGlvbiBpcyBvbmUgc3Vic3RpdHV0aW9uLlxyXG4gICAgICAgICAgbGV2ZW5zaHRlaW4gKz0gTWF0aC5tYXgoaW5zZXJ0aW9ucywgZGVsZXRpb25zKTtcclxuICAgICAgICAgIGluc2VydGlvbnMgPSAwO1xyXG4gICAgICAgICAgZGVsZXRpb25zID0gMDtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBsZXZlbnNodGVpbiArPSBNYXRoLm1heChpbnNlcnRpb25zLCBkZWxldGlvbnMpO1xyXG4gICAgcmV0dXJuIGxldmVuc2h0ZWluO1xyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBDcnVzaCB0aGUgZGlmZiBpbnRvIGFuIGVuY29kZWQgc3RyaW5nIHdoaWNoIGRlc2NyaWJlcyB0aGUgb3BlcmF0aW9uc1xyXG4gICAqIHJlcXVpcmVkIHRvIHRyYW5zZm9ybSB0ZXh0MSBpbnRvIHRleHQyLlxyXG4gICAqIEUuZy4gPTNcXHQtMlxcdCtpbmcgIC0+IEtlZXAgMyBjaGFycywgZGVsZXRlIDIgY2hhcnMsIGluc2VydCAnaW5nJy5cclxuICAgKiBPcGVyYXRpb25zIGFyZSB0YWItc2VwYXJhdGVkLiAgSW5zZXJ0ZWQgdGV4dCBpcyBlc2NhcGVkIHVzaW5nICV4eCBub3RhdGlvbi5cclxuICAgKiBAcGFyYW0gIGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxyXG4gICAqIEByZXR1cm4gIERlbHRhIHRleHQuXHJcbiAgICovXHJcbiAgICBkaWZmX3RvRGVsdGEgKGRpZmZzOiBBcnJheTxEaWZmPik6IHN0cmluZyB7XHJcbiAgICBjb25zdCB0ZXh0ID0gW107XHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGRpZmZzLmxlbmd0aDsgeCsrKSB7XHJcbiAgICAgIHN3aXRjaCAoZGlmZnNbeF1bMF0pIHtcclxuICAgICAgICBjYXNlIERpZmZPcC5JbnNlcnQ6XHJcbiAgICAgICAgICB0ZXh0W3hdID0gJysnICsgZW5jb2RlVVJJKGRpZmZzW3hdWzFdKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgRGlmZk9wLkRlbGV0ZTpcclxuICAgICAgICAgIHRleHRbeF0gPSAnLScgKyBkaWZmc1t4XVsxXS5sZW5ndGg7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIERpZmZPcC5FcXVhbDpcclxuICAgICAgICAgIHRleHRbeF0gPSAnPScgKyBkaWZmc1t4XVsxXS5sZW5ndGg7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRleHQuam9pbignXFx0JykucmVwbGFjZSgvJTIwL2csICcgJyk7XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEdpdmVuIHRoZSBvcmlnaW5hbCB0ZXh0MSwgYW5kIGFuIGVuY29kZWQgc3RyaW5nIHdoaWNoIGRlc2NyaWJlcyB0aGVcclxuICAgKiBvcGVyYXRpb25zIHJlcXVpcmVkIHRvIHRyYW5zZm9ybSB0ZXh0MSBpbnRvIHRleHQyLCBjb21wdXRlIHRoZSBmdWxsIGRpZmYuXHJcbiAgICogQHBhcmFtICB0ZXh0MSBTb3VyY2Ugc3RyaW5nIGZvciB0aGUgZGlmZi5cclxuICAgKiBAcGFyYW0gIGRlbHRhIERlbHRhIHRleHQuXHJcbiAgICogQHJldHVybiAgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXHJcbiAgICogQHRocm93cyB7IUVycm9yfSBJZiBpbnZhbGlkIGlucHV0LlxyXG4gICAqL1xyXG4gICAgZGlmZl9mcm9tRGVsdGEgKHRleHQxOiBzdHJpbmcsIGRlbHRhOiBzdHJpbmcpIHtcclxuICAgIGNvbnN0IGRpZmZzID0gW107XHJcbiAgICBsZXQgZGlmZnNMZW5ndGggPSAwOyAgLy8gS2VlcGluZyBvdXIgb3duIGxlbmd0aCBjb25zdCBpcyBmYXN0ZXIgaW4gSlMuXHJcbiAgICBsZXQgcG9pbnRlciA9IDA7ICAvLyBDdXJzb3IgaW4gdGV4dDFcclxuICAgIGNvbnN0IHRva2VucyA9IGRlbHRhLnNwbGl0KC9cXHQvZyk7XHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHRva2Vucy5sZW5ndGg7IHgrKykge1xyXG4gICAgICAvLyBFYWNoIHRva2VuIGJlZ2lucyB3aXRoIGEgb25lIGNoYXJhY3RlciBwYXJhbWV0ZXIgd2hpY2ggc3BlY2lmaWVzIHRoZVxyXG4gICAgICAvLyBvcGVyYXRpb24gb2YgdGhpcyB0b2tlbiAoZGVsZXRlLCBpbnNlcnQsIGVxdWFsaXR5KS5cclxuICAgICAgY29uc3QgcGFyYW0gPSB0b2tlbnNbeF0uc3Vic3RyaW5nKDEpO1xyXG4gICAgICBzd2l0Y2ggKHRva2Vuc1t4XS5jaGFyQXQoMCkpIHtcclxuICAgICAgICBjYXNlICcrJzpcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGRpZmZzW2RpZmZzTGVuZ3RoKytdID0gW0RpZmZPcC5JbnNlcnQsIGRlY29kZVVSSShwYXJhbSldO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXgpIHtcclxuICAgICAgICAgICAgLy8gTWFsZm9ybWVkIFVSSSBzZXF1ZW5jZS5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbGxlZ2FsIGVzY2FwZSBpbiBkaWZmX2Zyb21EZWx0YTogJyArIHBhcmFtKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJy0nOlxyXG4gICAgICAgICAgLy8gRmFsbCB0aHJvdWdoLlxyXG4gICAgICAgIGNhc2UgJz0nOlxyXG4gICAgICAgICAgY29uc3QgbiA9IHBhcnNlSW50KHBhcmFtLCAxMCk7XHJcbiAgICAgICAgICBpZiAoaXNOYU4obikgfHwgbiA8IDApIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIG51bWJlciBpbiBkaWZmX2Zyb21EZWx0YTogJyArIHBhcmFtKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNvbnN0IHRleHQgPSB0ZXh0MS5zdWJzdHJpbmcocG9pbnRlciwgcG9pbnRlciArPSBuKTtcclxuICAgICAgICAgIGlmICh0b2tlbnNbeF0uY2hhckF0KDApID09ICc9Jykge1xyXG4gICAgICAgICAgICBkaWZmc1tkaWZmc0xlbmd0aCsrXSA9IFtEaWZmT3AuRXF1YWwsIHRleHRdO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZGlmZnNbZGlmZnNMZW5ndGgrK10gPSBbRGlmZk9wLkRlbGV0ZSwgdGV4dF07XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgLy8gQmxhbmsgdG9rZW5zIGFyZSBvayAoZnJvbSBhIHRyYWlsaW5nIFxcdCkuXHJcbiAgICAgICAgICAvLyBBbnl0aGluZyBlbHNlIGlzIGFuIGVycm9yLlxyXG4gICAgICAgICAgaWYgKHRva2Vuc1t4XSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZGlmZiBvcGVyYXRpb24gaW4gZGlmZl9mcm9tRGVsdGE6ICcgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zW3hdKTtcclxuICAgICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKHBvaW50ZXIgIT0gdGV4dDEubGVuZ3RoKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignRGVsdGEgbGVuZ3RoICgnICsgcG9pbnRlciArXHJcbiAgICAgICAgICAnKSBkb2VzIG5vdCBlcXVhbCBzb3VyY2UgdGV4dCBsZW5ndGggKCcgKyB0ZXh0MS5sZW5ndGggKyAnKS4nKTtcclxuICAgIH1cclxuICAgIHJldHVybiBkaWZmcztcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBMb2NhdGUgdGhlIGJlc3QgaW5zdGFuY2Ugb2YgJ3BhdHRlcm4nIGluICd0ZXh0JyBuZWFyICdsb2MnLlxyXG4gICAqIEBwYXJhbSAgdGV4dCBUaGUgdGV4dCB0byBzZWFyY2guXHJcbiAgICogQHBhcmFtICBwYXR0ZXJuIFRoZSBwYXR0ZXJuIHRvIHNlYXJjaCBmb3IuXHJcbiAgICogQHBhcmFtICBsb2MgVGhlIGxvY2F0aW9uIHRvIHNlYXJjaCBhcm91bmQuXHJcbiAgICogQHJldHVybiAgQmVzdCBtYXRjaCBpbmRleCBvciAtMS5cclxuICAgKi9cclxuICAgIG1hdGNoX21haW4gKHRleHQ6IHN0cmluZywgcGF0dGVybjogc3RyaW5nLCBsb2M6IG51bWJlcik6IG51bWJlciB7XHJcbiAgICAvLyBDaGVjayBmb3IgbnVsbCBpbnB1dHMuXHJcbiAgICBpZiAodGV4dCA9PSBudWxsIHx8IHBhdHRlcm4gPT0gbnVsbCB8fCBsb2MgPT0gbnVsbCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ051bGwgaW5wdXQuIChtYXRjaF9tYWluKScpO1xyXG4gICAgfVxyXG5cclxuICAgIGxvYyA9IE1hdGgubWF4KDAsIE1hdGgubWluKGxvYywgdGV4dC5sZW5ndGgpKTtcclxuICAgIGlmICh0ZXh0ID09IHBhdHRlcm4pIHtcclxuICAgICAgLy8gU2hvcnRjdXQgKHBvdGVudGlhbGx5IG5vdCBndWFyYW50ZWVkIGJ5IHRoZSBhbGdvcml0aG0pXHJcbiAgICAgIHJldHVybiAwO1xyXG4gICAgfSBlbHNlIGlmICghdGV4dC5sZW5ndGgpIHtcclxuICAgICAgLy8gTm90aGluZyB0byBtYXRjaC5cclxuICAgICAgcmV0dXJuIC0xO1xyXG4gICAgfSBlbHNlIGlmICh0ZXh0LnN1YnN0cmluZyhsb2MsIGxvYyArIHBhdHRlcm4ubGVuZ3RoKSA9PSBwYXR0ZXJuKSB7XHJcbiAgICAgIC8vIFBlcmZlY3QgbWF0Y2ggYXQgdGhlIHBlcmZlY3Qgc3BvdCEgIChJbmNsdWRlcyBjYXNlIG9mIG51bGwgcGF0dGVybilcclxuICAgICAgcmV0dXJuIGxvYztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIERvIGEgZnV6enkgY29tcGFyZS5cclxuICAgICAgcmV0dXJuIHRoaXMubWF0Y2hfYml0YXBfKHRleHQsIHBhdHRlcm4sIGxvYyk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIExvY2F0ZSB0aGUgYmVzdCBpbnN0YW5jZSBvZiAncGF0dGVybicgaW4gJ3RleHQnIG5lYXIgJ2xvYycgdXNpbmcgdGhlXHJcbiAgICogQml0YXAgYWxnb3JpdGhtLlxyXG4gICAqIEBwYXJhbSAgdGV4dCBUaGUgdGV4dCB0byBzZWFyY2guXHJcbiAgICogQHBhcmFtICBwYXR0ZXJuIFRoZSBwYXR0ZXJuIHRvIHNlYXJjaCBmb3IuXHJcbiAgICogQHBhcmFtICBsb2MgVGhlIGxvY2F0aW9uIHRvIHNlYXJjaCBhcm91bmQuXHJcbiAgICogQHJldHVybiAgQmVzdCBtYXRjaCBpbmRleCBvciAtMS5cclxuXHJcbiAgICovXHJcbiAgICBtYXRjaF9iaXRhcF8gKHRleHQ6IHN0cmluZywgcGF0dGVybjogc3RyaW5nLCBsb2M6IG51bWJlcik6IG51bWJlciB7XHJcbiAgICBpZiAocGF0dGVybi5sZW5ndGggPiB0aGlzLk1hdGNoX01heEJpdHMpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdQYXR0ZXJuIHRvbyBsb25nIGZvciB0aGlzIGJyb3dzZXIuJyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSW5pdGlhbGlzZSB0aGUgYWxwaGFiZXQuXHJcbiAgICBjb25zdCBzID0gdGhpcy5tYXRjaF9hbHBoYWJldF8ocGF0dGVybik7XHJcblxyXG4gICAgY29uc3QgZG1wID0gdGhpczsgIC8vICd0aGlzJyBiZWNvbWVzICd3aW5kb3cnIGluIGEgY2xvc3VyZS5cclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbXB1dGUgYW5kIHJldHVybiB0aGUgc2NvcmUgZm9yIGEgbWF0Y2ggd2l0aCBlIGVycm9ycyBhbmQgeCBsb2NhdGlvbi5cclxuICAgICAqIEFjY2Vzc2VzIGxvYyBhbmQgcGF0dGVybiB0aHJvdWdoIGJlaW5nIGEgY2xvc3VyZS5cclxuICAgICAqIEBwYXJhbSAgZSBOdW1iZXIgb2YgZXJyb3JzIGluIG1hdGNoLlxyXG4gICAgICogQHBhcmFtICB4IExvY2F0aW9uIG9mIG1hdGNoLlxyXG4gICAgICogQHJldHVybiAgT3ZlcmFsbCBzY29yZSBmb3IgbWF0Y2ggKDAuMCA9IGdvb2QsIDEuMCA9IGJhZCkuXHJcblxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBtYXRjaF9iaXRhcFNjb3JlXyhlOiBudW1iZXIsIHg6IG51bWJlcik6IG51bWJlciB7XHJcbiAgICAgIGNvbnN0IGFjY3VyYWN5ID0gZSAvIHBhdHRlcm4ubGVuZ3RoO1xyXG4gICAgICBjb25zdCBwcm94aW1pdHkgPSBNYXRoLmFicyhsb2MgLSB4KTtcclxuICAgICAgaWYgKCFkbXAuTWF0Y2hfRGlzdGFuY2UpIHtcclxuICAgICAgICAvLyBEb2RnZSBkaXZpZGUgYnkgemVybyBlcnJvci5cclxuICAgICAgICByZXR1cm4gcHJveGltaXR5ID8gMS4wIDogYWNjdXJhY3k7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGFjY3VyYWN5ICsgKHByb3hpbWl0eSAvIGRtcC5NYXRjaF9EaXN0YW5jZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSGlnaGVzdCBzY29yZSBiZXlvbmQgd2hpY2ggd2UgZ2l2ZSB1cC5cclxuICAgIGxldCBzY29yZV90aHJlc2hvbGQgPSB0aGlzLk1hdGNoX1RocmVzaG9sZDtcclxuICAgIC8vIElzIHRoZXJlIGEgbmVhcmJ5IGV4YWN0IG1hdGNoPyAoc3BlZWR1cClcclxuICAgIGxldCBiZXN0X2xvYyA9IHRleHQuaW5kZXhPZihwYXR0ZXJuLCBsb2MpO1xyXG4gICAgaWYgKGJlc3RfbG9jICE9IC0xKSB7XHJcbiAgICAgIHNjb3JlX3RocmVzaG9sZCA9IE1hdGgubWluKG1hdGNoX2JpdGFwU2NvcmVfKDAsIGJlc3RfbG9jKSwgc2NvcmVfdGhyZXNob2xkKTtcclxuICAgICAgLy8gV2hhdCBhYm91dCBpbiB0aGUgb3RoZXIgZGlyZWN0aW9uPyAoc3BlZWR1cClcclxuICAgICAgYmVzdF9sb2MgPSB0ZXh0Lmxhc3RJbmRleE9mKHBhdHRlcm4sIGxvYyArIHBhdHRlcm4ubGVuZ3RoKTtcclxuICAgICAgaWYgKGJlc3RfbG9jICE9IC0xKSB7XHJcbiAgICAgICAgc2NvcmVfdGhyZXNob2xkID1cclxuICAgICAgICAgICAgTWF0aC5taW4obWF0Y2hfYml0YXBTY29yZV8oMCwgYmVzdF9sb2MpLCBzY29yZV90aHJlc2hvbGQpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSW5pdGlhbGlzZSB0aGUgYml0IGFycmF5cy5cclxuICAgIGNvbnN0IG1hdGNobWFzayA9IDEgPDwgKHBhdHRlcm4ubGVuZ3RoIC0gMSk7XHJcbiAgICBiZXN0X2xvYyA9IC0xO1xyXG5cclxuICAgIGxldCBiaW5fbWluLCBiaW5fbWlkO1xyXG4gICAgbGV0IGJpbl9tYXggPSBwYXR0ZXJuLmxlbmd0aCArIHRleHQubGVuZ3RoO1xyXG4gICAgbGV0IGxhc3RfcmQ7XHJcbiAgICBmb3IgKGxldCBkID0gMDsgZCA8IHBhdHRlcm4ubGVuZ3RoOyBkKyspIHtcclxuICAgICAgLy8gU2NhbiBmb3IgdGhlIGJlc3QgbWF0Y2g7IGVhY2ggaXRlcmF0aW9uIGFsbG93cyBmb3Igb25lIG1vcmUgZXJyb3IuXHJcbiAgICAgIC8vIFJ1biBhIGJpbmFyeSBzZWFyY2ggdG8gZGV0ZXJtaW5lIGhvdyBmYXIgZnJvbSAnbG9jJyB3ZSBjYW4gc3RyYXkgYXQgdGhpc1xyXG4gICAgICAvLyBlcnJvciBsZXZlbC5cclxuICAgICAgYmluX21pbiA9IDA7XHJcbiAgICAgIGJpbl9taWQgPSBiaW5fbWF4O1xyXG4gICAgICB3aGlsZSAoYmluX21pbiA8IGJpbl9taWQpIHtcclxuICAgICAgICBpZiAobWF0Y2hfYml0YXBTY29yZV8oZCwgbG9jICsgYmluX21pZCkgPD0gc2NvcmVfdGhyZXNob2xkKSB7XHJcbiAgICAgICAgICBiaW5fbWluID0gYmluX21pZDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgYmluX21heCA9IGJpbl9taWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJpbl9taWQgPSBNYXRoLmZsb29yKChiaW5fbWF4IC0gYmluX21pbikgLyAyICsgYmluX21pbik7XHJcbiAgICAgIH1cclxuICAgICAgLy8gVXNlIHRoZSByZXN1bHQgZnJvbSB0aGlzIGl0ZXJhdGlvbiBhcyB0aGUgbWF4aW11bSBmb3IgdGhlIG5leHQuXHJcbiAgICAgIGJpbl9tYXggPSBiaW5fbWlkO1xyXG4gICAgICBsZXQgc3RhcnQgPSBNYXRoLm1heCgxLCBsb2MgLSBiaW5fbWlkICsgMSk7XHJcbiAgICAgIGNvbnN0IGZpbmlzaCA9IE1hdGgubWluKGxvYyArIGJpbl9taWQsIHRleHQubGVuZ3RoKSArIHBhdHRlcm4ubGVuZ3RoO1xyXG5cclxuICAgICAgY29uc3QgcmQgPSBBcnJheShmaW5pc2ggKyAyKTtcclxuICAgICAgcmRbZmluaXNoICsgMV0gPSAoMSA8PCBkKSAtIDE7XHJcbiAgICAgIGZvciAobGV0IGogPSBmaW5pc2g7IGogPj0gc3RhcnQ7IGotLSkge1xyXG4gICAgICAgIC8vIFRoZSBhbHBoYWJldCAocykgaXMgYSBzcGFyc2UgaGFzaCwgc28gdGhlIGZvbGxvd2luZyBsaW5lIGdlbmVyYXRlc1xyXG4gICAgICAgIC8vIHdhcm5pbmdzLlxyXG4gICAgICAgIGNvbnN0IGNoYXJNYXRjaCA9IHNbdGV4dC5jaGFyQXQoaiAtIDEpXTtcclxuICAgICAgICBpZiAoZCA9PT0gMCkgeyAgLy8gRmlyc3QgcGFzczogZXhhY3QgbWF0Y2guXHJcbiAgICAgICAgICByZFtqXSA9ICgocmRbaiArIDFdIDw8IDEpIHwgMSkgJiBjaGFyTWF0Y2g7XHJcbiAgICAgICAgfSBlbHNlIHsgIC8vIFN1YnNlcXVlbnQgcGFzc2VzOiBmdXp6eSBtYXRjaC5cclxuICAgICAgICAgIHJkW2pdID0gKCgocmRbaiArIDFdIDw8IDEpIHwgMSkgJiBjaGFyTWF0Y2gpIHxcclxuICAgICAgICAgICAgICAgICAgKCgobGFzdF9yZFtqICsgMV0gfCBsYXN0X3JkW2pdKSA8PCAxKSB8IDEpIHxcclxuICAgICAgICAgICAgICAgICAgbGFzdF9yZFtqICsgMV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChyZFtqXSAmIG1hdGNobWFzaykge1xyXG4gICAgICAgICAgY29uc3Qgc2NvcmUgPSBtYXRjaF9iaXRhcFNjb3JlXyhkLCBqIC0gMSk7XHJcbiAgICAgICAgICAvLyBUaGlzIG1hdGNoIHdpbGwgYWxtb3N0IGNlcnRhaW5seSBiZSBiZXR0ZXIgdGhhbiBhbnkgZXhpc3RpbmcgbWF0Y2guXHJcbiAgICAgICAgICAvLyBCdXQgY2hlY2sgYW55d2F5LlxyXG4gICAgICAgICAgaWYgKHNjb3JlIDw9IHNjb3JlX3RocmVzaG9sZCkge1xyXG4gICAgICAgICAgICAvLyBUb2xkIHlvdSBzby5cclxuICAgICAgICAgICAgc2NvcmVfdGhyZXNob2xkID0gc2NvcmU7XHJcbiAgICAgICAgICAgIGJlc3RfbG9jID0gaiAtIDE7XHJcbiAgICAgICAgICAgIGlmIChiZXN0X2xvYyA+IGxvYykge1xyXG4gICAgICAgICAgICAgIC8vIFdoZW4gcGFzc2luZyBsb2MsIGRvbid0IGV4Y2VlZCBvdXIgY3VycmVudCBkaXN0YW5jZSBmcm9tIGxvYy5cclxuICAgICAgICAgICAgICBzdGFydCA9IE1hdGgubWF4KDEsIDIgKiBsb2MgLSBiZXN0X2xvYyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgLy8gQWxyZWFkeSBwYXNzZWQgbG9jLCBkb3duaGlsbCBmcm9tIGhlcmUgb24gaW4uXHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgLy8gTm8gaG9wZSBmb3IgYSAoYmV0dGVyKSBtYXRjaCBhdCBncmVhdGVyIGVycm9yIGxldmVscy5cclxuICAgICAgaWYgKG1hdGNoX2JpdGFwU2NvcmVfKGQgKyAxLCBsb2MpID4gc2NvcmVfdGhyZXNob2xkKSB7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgICAgbGFzdF9yZCA9IHJkO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGJlc3RfbG9jO1xyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXNlIHRoZSBhbHBoYWJldCBmb3IgdGhlIEJpdGFwIGFsZ29yaXRobS5cclxuICAgKiBAcGFyYW0gIHBhdHRlcm4gVGhlIHRleHQgdG8gZW5jb2RlLlxyXG4gICAqIEByZXR1cm4gIEhhc2ggb2YgY2hhcmFjdGVyIGxvY2F0aW9ucy5cclxuXHJcbiAgICovXHJcbiAgICBtYXRjaF9hbHBoYWJldF8gKHBhdHRlcm46IHN0cmluZyk6IHsgW2NoYXJhY3Rlcjogc3RyaW5nXTogbnVtYmVyIH0ge1xyXG4gICAgY29uc3QgczogeyBbY2hhcmFjdGVyOiBzdHJpbmddOiBudW1iZXIgfSA9IHt9O1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXR0ZXJuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIHNbcGF0dGVybi5jaGFyQXQoaSldID0gMDtcclxuICAgIH1cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0dGVybi5sZW5ndGg7IGkrKykge1xyXG4gICAgICBzW3BhdHRlcm4uY2hhckF0KGkpXSB8PSAxIDw8IChwYXR0ZXJuLmxlbmd0aCAtIGkgLSAxKTtcclxuICAgIH1cclxuICAgIHJldHVybiBzO1xyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBJbmNyZWFzZSB0aGUgY29udGV4dCB1bnRpbCBpdCBpcyB1bmlxdWUsXHJcbiAgICogYnV0IGRvbid0IGxldCB0aGUgcGF0dGVybiBleHBhbmQgYmV5b25kIE1hdGNoX01heEJpdHMuXHJcbiAgICogQHBhcmFtICBwYXRjaCBUaGUgcGF0Y2ggdG8gZ3Jvdy5cclxuICAgKiBAcGFyYW0gIHRleHQgU291cmNlIHRleHQuXHJcblxyXG4gICAqL1xyXG4gICAgcGF0Y2hfYWRkQ29udGV4dF8gKHBhdGNoOiBwYXRjaF9vYmosIHRleHQ6IHN0cmluZykge1xyXG4gICAgaWYgKHRleHQubGVuZ3RoID09IDApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgbGV0IHBhdHRlcm4gPSB0ZXh0LnN1YnN0cmluZyhwYXRjaC5zdGFydDIsIHBhdGNoLnN0YXJ0MiArIHBhdGNoLmxlbmd0aDEpO1xyXG4gICAgbGV0IHBhZGRpbmcgPSAwO1xyXG5cclxuICAgIC8vIExvb2sgZm9yIHRoZSBmaXJzdCBhbmQgbGFzdCBtYXRjaGVzIG9mIHBhdHRlcm4gaW4gdGV4dC4gIElmIHR3byBkaWZmZXJlbnRcclxuICAgIC8vIG1hdGNoZXMgYXJlIGZvdW5kLCBpbmNyZWFzZSB0aGUgcGF0dGVybiBsZW5ndGguXHJcbiAgICB3aGlsZSAodGV4dC5pbmRleE9mKHBhdHRlcm4pICE9IHRleHQubGFzdEluZGV4T2YocGF0dGVybikgJiZcclxuICAgICAgICAgIHBhdHRlcm4ubGVuZ3RoIDwgdGhpcy5NYXRjaF9NYXhCaXRzIC0gdGhpcy5QYXRjaF9NYXJnaW4gLVxyXG4gICAgICAgICAgdGhpcy5QYXRjaF9NYXJnaW4pIHtcclxuICAgICAgcGFkZGluZyArPSB0aGlzLlBhdGNoX01hcmdpbjtcclxuICAgICAgcGF0dGVybiA9IHRleHQuc3Vic3RyaW5nKHBhdGNoLnN0YXJ0MiAtIHBhZGRpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGNoLnN0YXJ0MiArIHBhdGNoLmxlbmd0aDEgKyBwYWRkaW5nKTtcclxuICAgIH1cclxuICAgIC8vIEFkZCBvbmUgY2h1bmsgZm9yIGdvb2QgbHVjay5cclxuICAgIHBhZGRpbmcgKz0gdGhpcy5QYXRjaF9NYXJnaW47XHJcblxyXG4gICAgLy8gQWRkIHRoZSBwcmVmaXguXHJcbiAgICBjb25zdCBwcmVmaXggPSB0ZXh0LnN1YnN0cmluZyhwYXRjaC5zdGFydDIgLSBwYWRkaW5nLCBwYXRjaC5zdGFydDIpO1xyXG4gICAgaWYgKHByZWZpeCkge1xyXG4gICAgICBwYXRjaC5kaWZmcy51bnNoaWZ0KFtEaWZmT3AuRXF1YWwsIHByZWZpeF0pO1xyXG4gICAgfVxyXG4gICAgLy8gQWRkIHRoZSBzdWZmaXguXHJcbiAgICBjb25zdCBzdWZmaXggPSB0ZXh0LnN1YnN0cmluZyhwYXRjaC5zdGFydDIgKyBwYXRjaC5sZW5ndGgxLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGNoLnN0YXJ0MiArIHBhdGNoLmxlbmd0aDEgKyBwYWRkaW5nKTtcclxuICAgIGlmIChzdWZmaXgpIHtcclxuICAgICAgcGF0Y2guZGlmZnMucHVzaChbRGlmZk9wLkVxdWFsLCBzdWZmaXhdKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBSb2xsIGJhY2sgdGhlIHN0YXJ0IHBvaW50cy5cclxuICAgIHBhdGNoLnN0YXJ0MSAtPSBwcmVmaXgubGVuZ3RoO1xyXG4gICAgcGF0Y2guc3RhcnQyIC09IHByZWZpeC5sZW5ndGg7XHJcbiAgICAvLyBFeHRlbmQgdGhlIGxlbmd0aHMuXHJcbiAgICBwYXRjaC5sZW5ndGgxICs9IHByZWZpeC5sZW5ndGggKyBzdWZmaXgubGVuZ3RoO1xyXG4gICAgcGF0Y2gubGVuZ3RoMiArPSBwcmVmaXgubGVuZ3RoICsgc3VmZml4Lmxlbmd0aDtcclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogQ29tcHV0ZSBhIGxpc3Qgb2YgcGF0Y2hlcyB0byB0dXJuIHRleHQxIGludG8gdGV4dDIuXHJcbiAgICogVXNlIGRpZmZzIGlmIHByb3ZpZGVkLCBvdGhlcndpc2UgY29tcHV0ZSBpdCBvdXJzZWx2ZXMuXHJcbiAgICogVGhlcmUgYXJlIGZvdXIgd2F5cyB0byBjYWxsIHRoaXMgZnVuY3Rpb24sIGRlcGVuZGluZyBvbiB3aGF0IGRhdGEgaXNcclxuICAgKiBhdmFpbGFibGUgdG8gdGhlIGNhbGxlcjpcclxuICAgKiBNZXRob2QgMTpcclxuICAgKiBhID0gdGV4dDEsIGIgPSB0ZXh0MlxyXG4gICAqIE1ldGhvZCAyOlxyXG4gICAqIGEgPSBkaWZmc1xyXG4gICAqIE1ldGhvZCAzIChvcHRpbWFsKTpcclxuICAgKiBhID0gdGV4dDEsIGIgPSBkaWZmc1xyXG4gICAqIE1ldGhvZCA0IChkZXByZWNhdGVkLCB1c2UgbWV0aG9kIDMpOlxyXG4gICAqIGEgPSB0ZXh0MSwgYiA9IHRleHQyLCBjID0gZGlmZnNcclxuICAgKlxyXG4gICAqIEBwYXJhbSAgYSB0ZXh0MSAobWV0aG9kcyAxLDMsNCkgb3JcclxuICAgKiBBcnJheSBvZiBkaWZmIHR1cGxlcyBmb3IgdGV4dDEgdG8gdGV4dDIgKG1ldGhvZCAyKS5cclxuICAgKiBAcGFyYW0gIG9wdF9iIHRleHQyIChtZXRob2RzIDEsNCkgb3JcclxuICAgKiBBcnJheSBvZiBkaWZmIHR1cGxlcyBmb3IgdGV4dDEgdG8gdGV4dDIgKG1ldGhvZCAzKSBvciB1bmRlZmluZWQgKG1ldGhvZCAyKS5cclxuICAgKiBAcGFyYW0gIG9wdF9jIEFycmF5IG9mIGRpZmYgdHVwbGVzXHJcbiAgICogZm9yIHRleHQxIHRvIHRleHQyIChtZXRob2QgNCkgb3IgdW5kZWZpbmVkIChtZXRob2RzIDEsMiwzKS5cclxuICAgKiBAcmV0dXJuICBBcnJheSBvZiBQYXRjaCBvYmplY3RzLlxyXG4gICAqL1xyXG4gICAgcGF0Y2hfbWFrZSAoYTogc3RyaW5nIHwgQXJyYXk8RGlmZj4sIG9wdF9iOiBzdHJpbmcgfCBBcnJheTxEaWZmPiwgb3B0X2M6IHN0cmluZyB8IEFycmF5PERpZmY+KSB7XHJcbiAgICBsZXQgdGV4dDEsIGRpZmZzO1xyXG4gICAgaWYgKHR5cGVvZiBhID09ICdzdHJpbmcnICYmIHR5cGVvZiBvcHRfYiA9PSAnc3RyaW5nJyAmJlxyXG4gICAgICAgIHR5cGVvZiBvcHRfYyA9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAvLyBNZXRob2QgMTogdGV4dDEsIHRleHQyXHJcbiAgICAgIC8vIENvbXB1dGUgZGlmZnMgZnJvbSB0ZXh0MSBhbmQgdGV4dDIuXHJcbiAgICAgIHRleHQxID0gKGEpO1xyXG4gICAgICBkaWZmcyA9IHRoaXMuZGlmZl9tYWluKHRleHQxLCAob3B0X2IpLCB0cnVlKTtcclxuICAgICAgaWYgKGRpZmZzLmxlbmd0aCA+IDIpIHtcclxuICAgICAgICB0aGlzLmRpZmZfY2xlYW51cFNlbWFudGljKGRpZmZzKTtcclxuICAgICAgICB0aGlzLmRpZmZfY2xlYW51cEVmZmljaWVuY3koZGlmZnMpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKGEgJiYgdHlwZW9mIGEgPT0gJ29iamVjdCcgJiYgdHlwZW9mIG9wdF9iID09ICd1bmRlZmluZWQnICYmXHJcbiAgICAgICAgdHlwZW9mIG9wdF9jID09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgIC8vIE1ldGhvZCAyOiBkaWZmc1xyXG4gICAgICAvLyBDb21wdXRlIHRleHQxIGZyb20gZGlmZnMuXHJcbiAgICAgIGRpZmZzID0gKGEpO1xyXG4gICAgICB0ZXh0MSA9IHRoaXMuZGlmZl90ZXh0MShkaWZmcyk7XHJcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBhID09ICdzdHJpbmcnICYmIG9wdF9iICYmIHR5cGVvZiBvcHRfYiA9PSAnb2JqZWN0JyAmJlxyXG4gICAgICAgIHR5cGVvZiBvcHRfYyA9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAvLyBNZXRob2QgMzogdGV4dDEsIGRpZmZzXHJcbiAgICAgIHRleHQxID0gKGEpO1xyXG4gICAgICBkaWZmcyA9IChvcHRfYik7XHJcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBhID09ICdzdHJpbmcnICYmIHR5cGVvZiBvcHRfYiA9PSAnc3RyaW5nJyAmJlxyXG4gICAgICAgIG9wdF9jICYmIHR5cGVvZiBvcHRfYyA9PSAnb2JqZWN0Jykge1xyXG4gICAgICAvLyBNZXRob2QgNDogdGV4dDEsIHRleHQyLCBkaWZmc1xyXG4gICAgICAvLyB0ZXh0MiBpcyBub3QgdXNlZC5cclxuICAgICAgdGV4dDEgPSAoYSk7XHJcbiAgICAgIGRpZmZzID0gKG9wdF9jKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBjYWxsIGZvcm1hdCB0byBwYXRjaF9tYWtlLicpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChkaWZmcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIFtdOyAgLy8gR2V0IHJpZCBvZiB0aGUgbnVsbCBjYXNlLlxyXG4gICAgfVxyXG4gICAgY29uc3QgcGF0Y2hlcyA9IFtdO1xyXG4gICAgbGV0IHBhdGNoID0gbmV3IHBhdGNoX29iaigpO1xyXG4gICAgbGV0IHBhdGNoRGlmZkxlbmd0aCA9IDA7ICAvLyBLZWVwaW5nIG91ciBvd24gbGVuZ3RoIGNvbnN0IGlzIGZhc3RlciBpbiBKUy5cclxuICAgIGxldCBjaGFyX2NvdW50MSA9IDA7ICAvLyBOdW1iZXIgb2YgY2hhcmFjdGVycyBpbnRvIHRoZSB0ZXh0MSBzdHJpbmcuXHJcbiAgICBsZXQgY2hhcl9jb3VudDIgPSAwOyAgLy8gTnVtYmVyIG9mIGNoYXJhY3RlcnMgaW50byB0aGUgdGV4dDIgc3RyaW5nLlxyXG4gICAgLy8gU3RhcnQgd2l0aCB0ZXh0MSAocHJlcGF0Y2hfdGV4dCkgYW5kIGFwcGx5IHRoZSBkaWZmcyB1bnRpbCB3ZSBhcnJpdmUgYXRcclxuICAgIC8vIHRleHQyIChwb3N0cGF0Y2hfdGV4dCkuICBXZSByZWNyZWF0ZSB0aGUgcGF0Y2hlcyBvbmUgYnkgb25lIHRvIGRldGVybWluZVxyXG4gICAgLy8gY29udGV4dCBpbmZvLlxyXG4gICAgbGV0IHByZXBhdGNoX3RleHQgPSB0ZXh0MTtcclxuICAgIGxldCBwb3N0cGF0Y2hfdGV4dCA9IHRleHQxO1xyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBkaWZmcy5sZW5ndGg7IHgrKykge1xyXG4gICAgICBjb25zdCBkaWZmX3R5cGUgPSBkaWZmc1t4XVswXTtcclxuICAgICAgY29uc3QgZGlmZl90ZXh0ID0gZGlmZnNbeF1bMV07XHJcblxyXG4gICAgICBpZiAoIXBhdGNoRGlmZkxlbmd0aCAmJiBkaWZmX3R5cGUgIT09IERpZmZPcC5FcXVhbCkge1xyXG4gICAgICAgIC8vIEEgbmV3IHBhdGNoIHN0YXJ0cyBoZXJlLlxyXG4gICAgICAgIHBhdGNoLnN0YXJ0MSA9IGNoYXJfY291bnQxO1xyXG4gICAgICAgIHBhdGNoLnN0YXJ0MiA9IGNoYXJfY291bnQyO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBzd2l0Y2ggKGRpZmZfdHlwZSkge1xyXG4gICAgICAgIGNhc2UgRGlmZk9wLkluc2VydDpcclxuICAgICAgICAgIHBhdGNoLmRpZmZzW3BhdGNoRGlmZkxlbmd0aCsrXSA9IGRpZmZzW3hdO1xyXG4gICAgICAgICAgcGF0Y2gubGVuZ3RoMiArPSBkaWZmX3RleHQubGVuZ3RoO1xyXG4gICAgICAgICAgcG9zdHBhdGNoX3RleHQgPSBwb3N0cGF0Y2hfdGV4dC5zdWJzdHJpbmcoMCwgY2hhcl9jb3VudDIpICsgZGlmZl90ZXh0ICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBwb3N0cGF0Y2hfdGV4dC5zdWJzdHJpbmcoY2hhcl9jb3VudDIpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBEaWZmT3AuRGVsZXRlOlxyXG4gICAgICAgICAgcGF0Y2gubGVuZ3RoMSArPSBkaWZmX3RleHQubGVuZ3RoO1xyXG4gICAgICAgICAgcGF0Y2guZGlmZnNbcGF0Y2hEaWZmTGVuZ3RoKytdID0gZGlmZnNbeF07XHJcbiAgICAgICAgICBwb3N0cGF0Y2hfdGV4dCA9IHBvc3RwYXRjaF90ZXh0LnN1YnN0cmluZygwLCBjaGFyX2NvdW50MikgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBvc3RwYXRjaF90ZXh0LnN1YnN0cmluZyhjaGFyX2NvdW50MiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZfdGV4dC5sZW5ndGgpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBEaWZmT3AuRXF1YWw6XHJcbiAgICAgICAgICBpZiAoZGlmZl90ZXh0Lmxlbmd0aCA8PSAyICogdGhpcy5QYXRjaF9NYXJnaW4gJiZcclxuICAgICAgICAgICAgICBwYXRjaERpZmZMZW5ndGggJiYgZGlmZnMubGVuZ3RoICE9IHggKyAxKSB7XHJcbiAgICAgICAgICAgIC8vIFNtYWxsIGVxdWFsaXR5IGluc2lkZSBhIHBhdGNoLlxyXG4gICAgICAgICAgICBwYXRjaC5kaWZmc1twYXRjaERpZmZMZW5ndGgrK10gPSBkaWZmc1t4XTtcclxuICAgICAgICAgICAgcGF0Y2gubGVuZ3RoMSArPSBkaWZmX3RleHQubGVuZ3RoO1xyXG4gICAgICAgICAgICBwYXRjaC5sZW5ndGgyICs9IGRpZmZfdGV4dC5sZW5ndGg7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKGRpZmZfdGV4dC5sZW5ndGggPj0gMiAqIHRoaXMuUGF0Y2hfTWFyZ2luKSB7XHJcbiAgICAgICAgICAgIC8vIFRpbWUgZm9yIGEgbmV3IHBhdGNoLlxyXG4gICAgICAgICAgICBpZiAocGF0Y2hEaWZmTGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgdGhpcy5wYXRjaF9hZGRDb250ZXh0XyhwYXRjaCwgcHJlcGF0Y2hfdGV4dCk7XHJcbiAgICAgICAgICAgICAgcGF0Y2hlcy5wdXNoKHBhdGNoKTtcclxuICAgICAgICAgICAgICBwYXRjaCA9IG5ldyBwYXRjaF9vYmooKTtcclxuICAgICAgICAgICAgICBwYXRjaERpZmZMZW5ndGggPSAwO1xyXG4gICAgICAgICAgICAgIC8vIFVubGlrZSBVbmlkaWZmLCBvdXIgcGF0Y2ggbGlzdHMgaGF2ZSBhIHJvbGxpbmcgY29udGV4dC5cclxuICAgICAgICAgICAgICAvLyBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZ29vZ2xlLWRpZmYtbWF0Y2gtcGF0Y2gvd2lraS9VbmlkaWZmXHJcbiAgICAgICAgICAgICAgLy8gVXBkYXRlIHByZXBhdGNoIHRleHQgJiBwb3MgdG8gcmVmbGVjdCB0aGUgYXBwbGljYXRpb24gb2YgdGhlXHJcbiAgICAgICAgICAgICAgLy8ganVzdCBjb21wbGV0ZWQgcGF0Y2guXHJcbiAgICAgICAgICAgICAgcHJlcGF0Y2hfdGV4dCA9IHBvc3RwYXRjaF90ZXh0O1xyXG4gICAgICAgICAgICAgIGNoYXJfY291bnQxID0gY2hhcl9jb3VudDI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBVcGRhdGUgdGhlIGN1cnJlbnQgY2hhcmFjdGVyIGNvdW50LlxyXG4gICAgICBpZiAoZGlmZl90eXBlICE9PSBEaWZmT3AuSW5zZXJ0KSB7XHJcbiAgICAgICAgY2hhcl9jb3VudDEgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcclxuICAgICAgfVxyXG4gICAgICBpZiAoZGlmZl90eXBlICE9PSBEaWZmT3AuRGVsZXRlKSB7XHJcbiAgICAgICAgY2hhcl9jb3VudDIgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gUGljayB1cCB0aGUgbGVmdG92ZXIgcGF0Y2ggaWYgbm90IGVtcHR5LlxyXG4gICAgaWYgKHBhdGNoRGlmZkxlbmd0aCkge1xyXG4gICAgICB0aGlzLnBhdGNoX2FkZENvbnRleHRfKHBhdGNoLCBwcmVwYXRjaF90ZXh0KTtcclxuICAgICAgcGF0Y2hlcy5wdXNoKHBhdGNoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcGF0Y2hlcztcclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogR2l2ZW4gYW4gYXJyYXkgb2YgcGF0Y2hlcywgcmV0dXJuIGFub3RoZXIgYXJyYXkgdGhhdCBpcyBpZGVudGljYWwuXHJcbiAgICogQHBhcmFtICBwYXRjaGVzIEFycmF5IG9mIFBhdGNoIG9iamVjdHMuXHJcbiAgICogQHJldHVybiAgQXJyYXkgb2YgUGF0Y2ggb2JqZWN0cy5cclxuICAgKi9cclxuICAgIHBhdGNoX2RlZXBDb3B5IChwYXRjaGVzOiBBcnJheTxwYXRjaF9vYmo+KTogQXJyYXk8cGF0Y2hfb2JqPiB7XHJcbiAgICAvLyBNYWtpbmcgZGVlcCBjb3BpZXMgaXMgaGFyZCBpbiBKYXZhU2NyaXB0LlxyXG4gICAgY29uc3QgcGF0Y2hlc0NvcHkgPSBbXTtcclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgcGF0Y2hlcy5sZW5ndGg7IHgrKykge1xyXG4gICAgICBjb25zdCBwYXRjaCA9IHBhdGNoZXNbeF07XHJcbiAgICAgIGNvbnN0IHBhdGNoQ29weSA9IG5ldyBwYXRjaF9vYmooKTtcclxuICAgICAgcGF0Y2hDb3B5LmRpZmZzID0gW107XHJcbiAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgcGF0Y2guZGlmZnMubGVuZ3RoOyB5KyspIHtcclxuICAgICAgICBwYXRjaENvcHkuZGlmZnNbeV0gPSBbcGF0Y2guZGlmZnNbeV1bMF0sIHBhdGNoLmRpZmZzW3ldWzFdXTtcclxuICAgICAgfVxyXG4gICAgICBwYXRjaENvcHkuc3RhcnQxID0gcGF0Y2guc3RhcnQxO1xyXG4gICAgICBwYXRjaENvcHkuc3RhcnQyID0gcGF0Y2guc3RhcnQyO1xyXG4gICAgICBwYXRjaENvcHkubGVuZ3RoMSA9IHBhdGNoLmxlbmd0aDE7XHJcbiAgICAgIHBhdGNoQ29weS5sZW5ndGgyID0gcGF0Y2gubGVuZ3RoMjtcclxuICAgICAgcGF0Y2hlc0NvcHlbeF0gPSBwYXRjaENvcHk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcGF0Y2hlc0NvcHk7XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIE1lcmdlIGEgc2V0IG9mIHBhdGNoZXMgb250byB0aGUgdGV4dC4gIFJldHVybiBhIHBhdGNoZWQgdGV4dCwgYXMgd2VsbFxyXG4gICAqIGFzIGEgbGlzdCBvZiB0cnVlL2ZhbHNlIHZhbHVlcyBpbmRpY2F0aW5nIHdoaWNoIHBhdGNoZXMgd2VyZSBhcHBsaWVkLlxyXG4gICAqIEBwYXJhbSAgcGF0Y2hlcyBBcnJheSBvZiBQYXRjaCBvYmplY3RzLlxyXG4gICAqIEBwYXJhbSAgdGV4dCBPbGQgdGV4dC5cclxuICAgKiBAcmV0dXJuICBUd28gZWxlbWVudCBBcnJheSwgY29udGFpbmluZyB0aGVcclxuICAgKiAgICAgIG5ldyB0ZXh0IGFuZCBhbiBhcnJheSBvZiBib29sZWFuIHZhbHVlcy5cclxuICAgKi9cclxuICAgIHBhdGNoX2FwcGx5IChwYXRjaGVzOiBBcnJheTxwYXRjaF9vYmo+LCB0ZXh0OiBzdHJpbmcpIHtcclxuICAgIGlmIChwYXRjaGVzLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgIHJldHVybiBbdGV4dCwgW11dO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERlZXAgY29weSB0aGUgcGF0Y2hlcyBzbyB0aGF0IG5vIGNoYW5nZXMgYXJlIG1hZGUgdG8gb3JpZ2luYWxzLlxyXG4gICAgcGF0Y2hlcyA9IHRoaXMucGF0Y2hfZGVlcENvcHkocGF0Y2hlcyk7XHJcblxyXG4gICAgY29uc3QgbnVsbFBhZGRpbmcgPSB0aGlzLnBhdGNoX2FkZFBhZGRpbmcocGF0Y2hlcyk7XHJcbiAgICB0ZXh0ID0gbnVsbFBhZGRpbmcgKyB0ZXh0ICsgbnVsbFBhZGRpbmc7XHJcblxyXG4gICAgdGhpcy5wYXRjaF9zcGxpdE1heChwYXRjaGVzKTtcclxuICAgIC8vIGRlbHRhIGtlZXBzIHRyYWNrIG9mIHRoZSBvZmZzZXQgYmV0d2VlbiB0aGUgZXhwZWN0ZWQgYW5kIGFjdHVhbCBsb2NhdGlvblxyXG4gICAgLy8gb2YgdGhlIHByZXZpb3VzIHBhdGNoLiAgSWYgdGhlcmUgYXJlIHBhdGNoZXMgZXhwZWN0ZWQgYXQgcG9zaXRpb25zIDEwIGFuZFxyXG4gICAgLy8gMjAsIGJ1dCB0aGUgZmlyc3QgcGF0Y2ggd2FzIGZvdW5kIGF0IDEyLCBkZWx0YSBpcyAyIGFuZCB0aGUgc2Vjb25kIHBhdGNoXHJcbiAgICAvLyBoYXMgYW4gZWZmZWN0aXZlIGV4cGVjdGVkIHBvc2l0aW9uIG9mIDIyLlxyXG4gICAgbGV0IGRlbHRhID0gMDtcclxuICAgIGNvbnN0IHJlc3VsdHMgPSBbXTtcclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgcGF0Y2hlcy5sZW5ndGg7IHgrKykge1xyXG4gICAgICBjb25zdCBleHBlY3RlZF9sb2MgPSBwYXRjaGVzW3hdLnN0YXJ0MiArIGRlbHRhO1xyXG4gICAgICBjb25zdCB0ZXh0MSA9IHRoaXMuZGlmZl90ZXh0MShwYXRjaGVzW3hdLmRpZmZzKTtcclxuICAgICAgbGV0IHN0YXJ0X2xvYztcclxuICAgICAgbGV0IGVuZF9sb2MgPSAtMTtcclxuICAgICAgaWYgKHRleHQxLmxlbmd0aCA+IHRoaXMuTWF0Y2hfTWF4Qml0cykge1xyXG4gICAgICAgIC8vIHBhdGNoX3NwbGl0TWF4IHdpbGwgb25seSBwcm92aWRlIGFuIG92ZXJzaXplZCBwYXR0ZXJuIGluIHRoZSBjYXNlIG9mXHJcbiAgICAgICAgLy8gYSBtb25zdGVyIGRlbGV0ZS5cclxuICAgICAgICBzdGFydF9sb2MgPSB0aGlzLm1hdGNoX21haW4odGV4dCwgdGV4dDEuc3Vic3RyaW5nKDAsIHRoaXMuTWF0Y2hfTWF4Qml0cyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkX2xvYyk7XHJcbiAgICAgICAgaWYgKHN0YXJ0X2xvYyAhPSAtMSkge1xyXG4gICAgICAgICAgZW5kX2xvYyA9IHRoaXMubWF0Y2hfbWFpbih0ZXh0LFxyXG4gICAgICAgICAgICAgIHRleHQxLnN1YnN0cmluZyh0ZXh0MS5sZW5ndGggLSB0aGlzLk1hdGNoX01heEJpdHMpLFxyXG4gICAgICAgICAgICAgIGV4cGVjdGVkX2xvYyArIHRleHQxLmxlbmd0aCAtIHRoaXMuTWF0Y2hfTWF4Qml0cyk7XHJcbiAgICAgICAgICBpZiAoZW5kX2xvYyA9PSAtMSB8fCBzdGFydF9sb2MgPj0gZW5kX2xvYykge1xyXG4gICAgICAgICAgICAvLyBDYW4ndCBmaW5kIHZhbGlkIHRyYWlsaW5nIGNvbnRleHQuICBEcm9wIHRoaXMgcGF0Y2guXHJcbiAgICAgICAgICAgIHN0YXJ0X2xvYyA9IC0xO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBzdGFydF9sb2MgPSB0aGlzLm1hdGNoX21haW4odGV4dCwgdGV4dDEsIGV4cGVjdGVkX2xvYyk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHN0YXJ0X2xvYyA9PSAtMSkge1xyXG4gICAgICAgIC8vIE5vIG1hdGNoIGZvdW5kLiAgOihcclxuICAgICAgICByZXN1bHRzW3hdID0gZmFsc2U7XHJcbiAgICAgICAgLy8gU3VidHJhY3QgdGhlIGRlbHRhIGZvciB0aGlzIGZhaWxlZCBwYXRjaCBmcm9tIHN1YnNlcXVlbnQgcGF0Y2hlcy5cclxuICAgICAgICBkZWx0YSAtPSBwYXRjaGVzW3hdLmxlbmd0aDIgLSBwYXRjaGVzW3hdLmxlbmd0aDE7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gRm91bmQgYSBtYXRjaC4gIDopXHJcbiAgICAgICAgcmVzdWx0c1t4XSA9IHRydWU7XHJcbiAgICAgICAgZGVsdGEgPSBzdGFydF9sb2MgLSBleHBlY3RlZF9sb2M7XHJcbiAgICAgICAgbGV0IHRleHQyO1xyXG4gICAgICAgIGlmIChlbmRfbG9jID09IC0xKSB7XHJcbiAgICAgICAgICB0ZXh0MiA9IHRleHQuc3Vic3RyaW5nKHN0YXJ0X2xvYywgc3RhcnRfbG9jICsgdGV4dDEubGVuZ3RoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdGV4dDIgPSB0ZXh0LnN1YnN0cmluZyhzdGFydF9sb2MsIGVuZF9sb2MgKyB0aGlzLk1hdGNoX01heEJpdHMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGV4dDEgPT0gdGV4dDIpIHtcclxuICAgICAgICAgIC8vIFBlcmZlY3QgbWF0Y2gsIGp1c3Qgc2hvdmUgdGhlIHJlcGxhY2VtZW50IHRleHQgaW4uXHJcbiAgICAgICAgICB0ZXh0ID0gdGV4dC5zdWJzdHJpbmcoMCwgc3RhcnRfbG9jKSArXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpZmZfdGV4dDIocGF0Y2hlc1t4XS5kaWZmcykgK1xyXG4gICAgICAgICAgICAgICAgdGV4dC5zdWJzdHJpbmcoc3RhcnRfbG9jICsgdGV4dDEubGVuZ3RoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgLy8gSW1wZXJmZWN0IG1hdGNoLiAgUnVuIGEgZGlmZiB0byBnZXQgYSBmcmFtZXdvcmsgb2YgZXF1aXZhbGVudFxyXG4gICAgICAgICAgLy8gaW5kaWNlcy5cclxuICAgICAgICAgIGNvbnN0IGRpZmZzID0gdGhpcy5kaWZmX21haW4odGV4dDEsIHRleHQyLCBmYWxzZSk7XHJcbiAgICAgICAgICBpZiAodGV4dDEubGVuZ3RoID4gdGhpcy5NYXRjaF9NYXhCaXRzICYmXHJcbiAgICAgICAgICAgICAgdGhpcy5kaWZmX2xldmVuc2h0ZWluKGRpZmZzKSAvIHRleHQxLmxlbmd0aCA+XHJcbiAgICAgICAgICAgICAgdGhpcy5QYXRjaF9EZWxldGVUaHJlc2hvbGQpIHtcclxuICAgICAgICAgICAgLy8gVGhlIGVuZCBwb2ludHMgbWF0Y2gsIGJ1dCB0aGUgY29udGVudCBpcyB1bmFjY2VwdGFibHkgYmFkLlxyXG4gICAgICAgICAgICByZXN1bHRzW3hdID0gZmFsc2U7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmRpZmZfY2xlYW51cFNlbWFudGljTG9zc2xlc3MoZGlmZnMpO1xyXG4gICAgICAgICAgICBsZXQgaW5kZXgxID0gMDtcclxuICAgICAgICAgICAgbGV0IGluZGV4MjtcclxuICAgICAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBwYXRjaGVzW3hdLmRpZmZzLmxlbmd0aDsgeSsrKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgbW9kID0gcGF0Y2hlc1t4XS5kaWZmc1t5XTtcclxuICAgICAgICAgICAgICBpZiAobW9kWzBdICE9PSBEaWZmT3AuRXF1YWwpIHtcclxuICAgICAgICAgICAgICAgIGluZGV4MiA9IHRoaXMuZGlmZl94SW5kZXgoZGlmZnMsIGluZGV4MSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGlmIChtb2RbMF0gPT09IERpZmZPcC5JbnNlcnQpIHsgIC8vIEluc2VydGlvblxyXG4gICAgICAgICAgICAgICAgdGV4dCA9IHRleHQuc3Vic3RyaW5nKDAsIHN0YXJ0X2xvYyArIGluZGV4MikgKyBtb2RbMV0gK1xyXG4gICAgICAgICAgICAgICAgICAgICAgdGV4dC5zdWJzdHJpbmcoc3RhcnRfbG9jICsgaW5kZXgyKTtcclxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1vZFswXSA9PT0gRGlmZk9wLkRlbGV0ZSkgeyAgLy8gRGVsZXRpb25cclxuICAgICAgICAgICAgICAgIHRleHQgPSB0ZXh0LnN1YnN0cmluZygwLCBzdGFydF9sb2MgKyBpbmRleDIpICtcclxuICAgICAgICAgICAgICAgICAgICAgIHRleHQuc3Vic3RyaW5nKHN0YXJ0X2xvYyArIHRoaXMuZGlmZl94SW5kZXgoZGlmZnMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXgxICsgbW9kWzFdLmxlbmd0aCkpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBpZiAobW9kWzBdICE9PSBEaWZmT3AuRGVsZXRlKSB7XHJcbiAgICAgICAgICAgICAgICBpbmRleDEgKz0gbW9kWzFdLmxlbmd0aDtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIFN0cmlwIHRoZSBwYWRkaW5nIG9mZi5cclxuICAgIHRleHQgPSB0ZXh0LnN1YnN0cmluZyhudWxsUGFkZGluZy5sZW5ndGgsIHRleHQubGVuZ3RoIC0gbnVsbFBhZGRpbmcubGVuZ3RoKTtcclxuICAgIHJldHVybiBbdGV4dCwgcmVzdWx0c107XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZCBzb21lIHBhZGRpbmcgb24gdGV4dCBzdGFydCBhbmQgZW5kIHNvIHRoYXQgZWRnZXMgY2FuIG1hdGNoIHNvbWV0aGluZy5cclxuICAgKiBJbnRlbmRlZCB0byBiZSBjYWxsZWQgb25seSBmcm9tIHdpdGhpbiBwYXRjaF9hcHBseS5cclxuICAgKiBAcGFyYW0gIHBhdGNoZXMgQXJyYXkgb2YgUGF0Y2ggb2JqZWN0cy5cclxuICAgKiBAcmV0dXJuICBUaGUgcGFkZGluZyBzdHJpbmcgYWRkZWQgdG8gZWFjaCBzaWRlLlxyXG4gICAqL1xyXG4gICAgcGF0Y2hfYWRkUGFkZGluZyAocGF0Y2hlczogQXJyYXk8cGF0Y2hfb2JqPikge1xyXG4gICAgY29uc3QgcGFkZGluZ0xlbmd0aCA9IHRoaXMuUGF0Y2hfTWFyZ2luO1xyXG4gICAgbGV0IG51bGxQYWRkaW5nID0gJyc7XHJcbiAgICBmb3IgKGxldCB4ID0gMTsgeCA8PSBwYWRkaW5nTGVuZ3RoOyB4KyspIHtcclxuICAgICAgbnVsbFBhZGRpbmcgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSh4KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBCdW1wIGFsbCB0aGUgcGF0Y2hlcyBmb3J3YXJkLlxyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBwYXRjaGVzLmxlbmd0aDsgeCsrKSB7XHJcbiAgICAgIHBhdGNoZXNbeF0uc3RhcnQxICs9IHBhZGRpbmdMZW5ndGg7XHJcbiAgICAgIHBhdGNoZXNbeF0uc3RhcnQyICs9IHBhZGRpbmdMZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQWRkIHNvbWUgcGFkZGluZyBvbiBzdGFydCBvZiBmaXJzdCBkaWZmLlxyXG4gICAgbGV0IHBhdGNoID0gcGF0Y2hlc1swXTtcclxuICAgIGxldCBkaWZmcyA9IHBhdGNoLmRpZmZzO1xyXG4gICAgaWYgKGRpZmZzLmxlbmd0aCA9PSAwIHx8IGRpZmZzWzBdWzBdICE9IERpZmZPcC5FcXVhbCkge1xyXG4gICAgICAvLyBBZGQgbnVsbFBhZGRpbmcgZXF1YWxpdHkuXHJcbiAgICAgIGRpZmZzLnVuc2hpZnQoW0RpZmZPcC5FcXVhbCwgbnVsbFBhZGRpbmddKTtcclxuICAgICAgcGF0Y2guc3RhcnQxIC09IHBhZGRpbmdMZW5ndGg7ICAvLyBTaG91bGQgYmUgMC5cclxuICAgICAgcGF0Y2guc3RhcnQyIC09IHBhZGRpbmdMZW5ndGg7ICAvLyBTaG91bGQgYmUgMC5cclxuICAgICAgcGF0Y2gubGVuZ3RoMSArPSBwYWRkaW5nTGVuZ3RoO1xyXG4gICAgICBwYXRjaC5sZW5ndGgyICs9IHBhZGRpbmdMZW5ndGg7XHJcbiAgICB9IGVsc2UgaWYgKHBhZGRpbmdMZW5ndGggPiBkaWZmc1swXVsxXS5sZW5ndGgpIHtcclxuICAgICAgLy8gR3JvdyBmaXJzdCBlcXVhbGl0eS5cclxuICAgICAgY29uc3QgZXh0cmFMZW5ndGggPSBwYWRkaW5nTGVuZ3RoIC0gZGlmZnNbMF1bMV0ubGVuZ3RoO1xyXG4gICAgICBkaWZmc1swXVsxXSA9IG51bGxQYWRkaW5nLnN1YnN0cmluZyhkaWZmc1swXVsxXS5sZW5ndGgpICsgZGlmZnNbMF1bMV07XHJcbiAgICAgIHBhdGNoLnN0YXJ0MSAtPSBleHRyYUxlbmd0aDtcclxuICAgICAgcGF0Y2guc3RhcnQyIC09IGV4dHJhTGVuZ3RoO1xyXG4gICAgICBwYXRjaC5sZW5ndGgxICs9IGV4dHJhTGVuZ3RoO1xyXG4gICAgICBwYXRjaC5sZW5ndGgyICs9IGV4dHJhTGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEFkZCBzb21lIHBhZGRpbmcgb24gZW5kIG9mIGxhc3QgZGlmZi5cclxuICAgIHBhdGNoID0gcGF0Y2hlc1twYXRjaGVzLmxlbmd0aCAtIDFdO1xyXG4gICAgZGlmZnMgPSBwYXRjaC5kaWZmcztcclxuICAgIGlmIChkaWZmcy5sZW5ndGggPT0gMCB8fCBkaWZmc1tkaWZmcy5sZW5ndGggLSAxXVswXSAhPSBEaWZmT3AuRXF1YWwpIHtcclxuICAgICAgLy8gQWRkIG51bGxQYWRkaW5nIGVxdWFsaXR5LlxyXG4gICAgICBkaWZmcy5wdXNoKFtEaWZmT3AuRXF1YWwsIG51bGxQYWRkaW5nXSk7XHJcbiAgICAgIHBhdGNoLmxlbmd0aDEgKz0gcGFkZGluZ0xlbmd0aDtcclxuICAgICAgcGF0Y2gubGVuZ3RoMiArPSBwYWRkaW5nTGVuZ3RoO1xyXG4gICAgfSBlbHNlIGlmIChwYWRkaW5nTGVuZ3RoID4gZGlmZnNbZGlmZnMubGVuZ3RoIC0gMV1bMV0ubGVuZ3RoKSB7XHJcbiAgICAgIC8vIEdyb3cgbGFzdCBlcXVhbGl0eS5cclxuICAgICAgY29uc3QgZXh0cmFMZW5ndGggPSBwYWRkaW5nTGVuZ3RoIC0gZGlmZnNbZGlmZnMubGVuZ3RoIC0gMV1bMV0ubGVuZ3RoO1xyXG4gICAgICBkaWZmc1tkaWZmcy5sZW5ndGggLSAxXVsxXSArPSBudWxsUGFkZGluZy5zdWJzdHJpbmcoMCwgZXh0cmFMZW5ndGgpO1xyXG4gICAgICBwYXRjaC5sZW5ndGgxICs9IGV4dHJhTGVuZ3RoO1xyXG4gICAgICBwYXRjaC5sZW5ndGgyICs9IGV4dHJhTGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBudWxsUGFkZGluZztcclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogTG9vayB0aHJvdWdoIHRoZSBwYXRjaGVzIGFuZCBicmVhayB1cCBhbnkgd2hpY2ggYXJlIGxvbmdlciB0aGFuIHRoZSBtYXhpbXVtXHJcbiAgICogbGltaXQgb2YgdGhlIG1hdGNoIGFsZ29yaXRobS5cclxuICAgKiBJbnRlbmRlZCB0byBiZSBjYWxsZWQgb25seSBmcm9tIHdpdGhpbiBwYXRjaF9hcHBseS5cclxuICAgKiBAcGFyYW0gIHBhdGNoZXMgQXJyYXkgb2YgUGF0Y2ggb2JqZWN0cy5cclxuICAgKi9cclxuICAgIHBhdGNoX3NwbGl0TWF4ID0gZnVuY3Rpb24ocGF0Y2hlczogQXJyYXk8cGF0Y2hfb2JqPikge1xyXG4gICAgY29uc3QgcGF0Y2hfc2l6ZSA9IHRoaXMuTWF0Y2hfTWF4Qml0cztcclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgcGF0Y2hlcy5sZW5ndGg7IHgrKykge1xyXG4gICAgICBpZiAocGF0Y2hlc1t4XS5sZW5ndGgxIDw9IHBhdGNoX3NpemUpIHtcclxuICAgICAgICBjb250aW51ZTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBiaWdwYXRjaCA9IHBhdGNoZXNbeF07XHJcbiAgICAgIC8vIFJlbW92ZSB0aGUgYmlnIG9sZCBwYXRjaC5cclxuICAgICAgcGF0Y2hlcy5zcGxpY2UoeC0tLCAxKTtcclxuICAgICAgbGV0IHN0YXJ0MSA9IGJpZ3BhdGNoLnN0YXJ0MTtcclxuICAgICAgbGV0IHN0YXJ0MiA9IGJpZ3BhdGNoLnN0YXJ0MjtcclxuICAgICAgbGV0IHByZWNvbnRleHQgPSAnJztcclxuICAgICAgd2hpbGUgKGJpZ3BhdGNoLmRpZmZzLmxlbmd0aCAhPT0gMCkge1xyXG4gICAgICAgIC8vIENyZWF0ZSBvbmUgb2Ygc2V2ZXJhbCBzbWFsbGVyIHBhdGNoZXMuXHJcbiAgICAgICAgY29uc3QgcGF0Y2ggPSBuZXcgcGF0Y2hfb2JqKCk7XHJcbiAgICAgICAgbGV0IGVtcHR5ID0gdHJ1ZTtcclxuICAgICAgICBwYXRjaC5zdGFydDEgPSBzdGFydDEgLSBwcmVjb250ZXh0Lmxlbmd0aDtcclxuICAgICAgICBwYXRjaC5zdGFydDIgPSBzdGFydDIgLSBwcmVjb250ZXh0Lmxlbmd0aDtcclxuICAgICAgICBpZiAocHJlY29udGV4dCAhPT0gJycpIHtcclxuICAgICAgICAgIHBhdGNoLmxlbmd0aDEgPSBwYXRjaC5sZW5ndGgyID0gcHJlY29udGV4dC5sZW5ndGg7XHJcbiAgICAgICAgICBwYXRjaC5kaWZmcy5wdXNoKFtEaWZmT3AuRXF1YWwsIHByZWNvbnRleHRdKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgd2hpbGUgKGJpZ3BhdGNoLmRpZmZzLmxlbmd0aCAhPT0gMCAmJlxyXG4gICAgICAgICAgICAgIHBhdGNoLmxlbmd0aDEgPCBwYXRjaF9zaXplIC0gdGhpcy5QYXRjaF9NYXJnaW4pIHtcclxuICAgICAgICAgIGNvbnN0IGRpZmZfdHlwZSA9IGJpZ3BhdGNoLmRpZmZzWzBdWzBdO1xyXG4gICAgICAgICAgbGV0IGRpZmZfdGV4dCA9IGJpZ3BhdGNoLmRpZmZzWzBdWzFdO1xyXG4gICAgICAgICAgaWYgKGRpZmZfdHlwZSA9PT0gRGlmZk9wLkluc2VydCkge1xyXG4gICAgICAgICAgICAvLyBJbnNlcnRpb25zIGFyZSBoYXJtbGVzcy5cclxuICAgICAgICAgICAgcGF0Y2gubGVuZ3RoMiArPSBkaWZmX3RleHQubGVuZ3RoO1xyXG4gICAgICAgICAgICBzdGFydDIgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcclxuICAgICAgICAgICAgcGF0Y2guZGlmZnMucHVzaChiaWdwYXRjaC5kaWZmcy5zaGlmdCgpKTtcclxuICAgICAgICAgICAgZW1wdHkgPSBmYWxzZTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAoZGlmZl90eXBlID09PSBEaWZmT3AuRGVsZXRlICYmIHBhdGNoLmRpZmZzLmxlbmd0aCA9PSAxICYmXHJcbiAgICAgICAgICAgICAgICAgICAgcGF0Y2guZGlmZnNbMF1bMF0gPT0gRGlmZk9wLkVxdWFsICYmXHJcbiAgICAgICAgICAgICAgICAgICAgZGlmZl90ZXh0Lmxlbmd0aCA+IDIgKiBwYXRjaF9zaXplKSB7XHJcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBsYXJnZSBkZWxldGlvbi4gIExldCBpdCBwYXNzIGluIG9uZSBjaHVuay5cclxuICAgICAgICAgICAgcGF0Y2gubGVuZ3RoMSArPSBkaWZmX3RleHQubGVuZ3RoO1xyXG4gICAgICAgICAgICBzdGFydDEgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcclxuICAgICAgICAgICAgZW1wdHkgPSBmYWxzZTtcclxuICAgICAgICAgICAgcGF0Y2guZGlmZnMucHVzaChbZGlmZl90eXBlLCBkaWZmX3RleHRdKTtcclxuICAgICAgICAgICAgYmlncGF0Y2guZGlmZnMuc2hpZnQoKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIERlbGV0aW9uIG9yIGVxdWFsaXR5LiAgT25seSB0YWtlIGFzIG11Y2ggYXMgd2UgY2FuIHN0b21hY2guXHJcbiAgICAgICAgICAgIGRpZmZfdGV4dCA9IGRpZmZfdGV4dC5zdWJzdHJpbmcoMCxcclxuICAgICAgICAgICAgICAgIHBhdGNoX3NpemUgLSBwYXRjaC5sZW5ndGgxIC0gdGhpcy5QYXRjaF9NYXJnaW4pO1xyXG4gICAgICAgICAgICBwYXRjaC5sZW5ndGgxICs9IGRpZmZfdGV4dC5sZW5ndGg7XHJcbiAgICAgICAgICAgIHN0YXJ0MSArPSBkaWZmX3RleHQubGVuZ3RoO1xyXG4gICAgICAgICAgICBpZiAoZGlmZl90eXBlID09PSBEaWZmT3AuRXF1YWwpIHtcclxuICAgICAgICAgICAgICBwYXRjaC5sZW5ndGgyICs9IGRpZmZfdGV4dC5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgc3RhcnQyICs9IGRpZmZfdGV4dC5sZW5ndGg7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgZW1wdHkgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBwYXRjaC5kaWZmcy5wdXNoKFtkaWZmX3R5cGUsIGRpZmZfdGV4dF0pO1xyXG4gICAgICAgICAgICBpZiAoZGlmZl90ZXh0ID09IGJpZ3BhdGNoLmRpZmZzWzBdWzFdKSB7XHJcbiAgICAgICAgICAgICAgYmlncGF0Y2guZGlmZnMuc2hpZnQoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBiaWdwYXRjaC5kaWZmc1swXVsxXSA9XHJcbiAgICAgICAgICAgICAgICAgIGJpZ3BhdGNoLmRpZmZzWzBdWzFdLnN1YnN0cmluZyhkaWZmX3RleHQubGVuZ3RoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBDb21wdXRlIHRoZSBoZWFkIGNvbnRleHQgZm9yIHRoZSBuZXh0IHBhdGNoLlxyXG4gICAgICAgIHByZWNvbnRleHQgPSB0aGlzLmRpZmZfdGV4dDIocGF0Y2guZGlmZnMpO1xyXG4gICAgICAgIHByZWNvbnRleHQgPVxyXG4gICAgICAgICAgICBwcmVjb250ZXh0LnN1YnN0cmluZyhwcmVjb250ZXh0Lmxlbmd0aCAtIHRoaXMuUGF0Y2hfTWFyZ2luKTtcclxuICAgICAgICAvLyBBcHBlbmQgdGhlIGVuZCBjb250ZXh0IGZvciB0aGlzIHBhdGNoLlxyXG4gICAgICAgIGNvbnN0IHBvc3Rjb250ZXh0ID0gdGhpcy5kaWZmX3RleHQxKGJpZ3BhdGNoLmRpZmZzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc3Vic3RyaW5nKDAsIHRoaXMuUGF0Y2hfTWFyZ2luKTtcclxuICAgICAgICBpZiAocG9zdGNvbnRleHQgIT09ICcnKSB7XHJcbiAgICAgICAgICBwYXRjaC5sZW5ndGgxICs9IHBvc3Rjb250ZXh0Lmxlbmd0aDtcclxuICAgICAgICAgIHBhdGNoLmxlbmd0aDIgKz0gcG9zdGNvbnRleHQubGVuZ3RoO1xyXG4gICAgICAgICAgaWYgKHBhdGNoLmRpZmZzLmxlbmd0aCAhPT0gMCAmJlxyXG4gICAgICAgICAgICAgIHBhdGNoLmRpZmZzW3BhdGNoLmRpZmZzLmxlbmd0aCAtIDFdWzBdID09PSBEaWZmT3AuRXF1YWwpIHtcclxuICAgICAgICAgICAgcGF0Y2guZGlmZnNbcGF0Y2guZGlmZnMubGVuZ3RoIC0gMV1bMV0gKz0gcG9zdGNvbnRleHQ7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBwYXRjaC5kaWZmcy5wdXNoKFtEaWZmT3AuRXF1YWwsIHBvc3Rjb250ZXh0XSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghZW1wdHkpIHtcclxuICAgICAgICAgIHBhdGNoZXMuc3BsaWNlKCsreCwgMCwgcGF0Y2gpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBUYWtlIGEgbGlzdCBvZiBwYXRjaGVzIGFuZCByZXR1cm4gYSB0ZXh0dWFsIHJlcHJlc2VudGF0aW9uLlxyXG4gICAqIEBwYXJhbSAgcGF0Y2hlcyBBcnJheSBvZiBQYXRjaCBvYmplY3RzLlxyXG4gICAqIEByZXR1cm4gIFRleHQgcmVwcmVzZW50YXRpb24gb2YgcGF0Y2hlcy5cclxuICAgKi9cclxuICAgIHBhdGNoX3RvVGV4dCAocGF0Y2hlczogQXJyYXk8cGF0Y2hfb2JqPikge1xyXG4gICAgY29uc3QgdGV4dCA9IFtdO1xyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBwYXRjaGVzLmxlbmd0aDsgeCsrKSB7XHJcbiAgICAgIHRleHRbeF0gPSBwYXRjaGVzW3hdO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRleHQuam9pbignJyk7XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIFBhcnNlIGEgdGV4dHVhbCByZXByZXNlbnRhdGlvbiBvZiBwYXRjaGVzIGFuZCByZXR1cm4gYSBsaXN0IG9mIFBhdGNoIG9iamVjdHMuXHJcbiAgICogQHBhcmFtICB0ZXh0bGluZSBUZXh0IHJlcHJlc2VudGF0aW9uIG9mIHBhdGNoZXMuXHJcbiAgICogQHJldHVybiAgQXJyYXkgb2YgUGF0Y2ggb2JqZWN0cy5cclxuICAgKiBAdGhyb3dzIHshRXJyb3J9IElmIGludmFsaWQgaW5wdXQuXHJcbiAgICovXHJcbiAgICBwYXRjaF9mcm9tVGV4dCAodGV4dGxpbmU6IHN0cmluZyk6IEFycmF5PHBhdGNoX29iaj4ge1xyXG4gICAgY29uc3QgcGF0Y2hlczogQXJyYXk8cGF0Y2hfb2JqPiA9IFtdO1xyXG4gICAgaWYgKCF0ZXh0bGluZSkge1xyXG4gICAgICByZXR1cm4gcGF0Y2hlcztcclxuICAgIH1cclxuICAgIGNvbnN0IHRleHQgPSB0ZXh0bGluZS5zcGxpdCgnXFxuJyk7XHJcbiAgICBsZXQgdGV4dFBvaW50ZXIgPSAwO1xyXG4gICAgY29uc3QgcGF0Y2hIZWFkZXIgPSAvXkBAIC0oXFxkKyksPyhcXGQqKSBcXCsoXFxkKyksPyhcXGQqKSBAQCQvO1xyXG4gICAgd2hpbGUgKHRleHRQb2ludGVyIDwgdGV4dC5sZW5ndGgpIHtcclxuICAgICAgY29uc3QgbSA9IHRleHRbdGV4dFBvaW50ZXJdLm1hdGNoKHBhdGNoSGVhZGVyKTtcclxuICAgICAgaWYgKCFtKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHBhdGNoIHN0cmluZzogJyArIHRleHRbdGV4dFBvaW50ZXJdKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBwYXRjaCA9IG5ldyBwYXRjaF9vYmooKTtcclxuICAgICAgcGF0Y2hlcy5wdXNoKHBhdGNoKTtcclxuICAgICAgcGF0Y2guc3RhcnQxID0gcGFyc2VJbnQobVsxXSwgMTApO1xyXG4gICAgICBpZiAobVsyXSA9PT0gJycpIHtcclxuICAgICAgICBwYXRjaC5zdGFydDEtLTtcclxuICAgICAgICBwYXRjaC5sZW5ndGgxID0gMTtcclxuICAgICAgfSBlbHNlIGlmIChtWzJdID09ICcwJykge1xyXG4gICAgICAgIHBhdGNoLmxlbmd0aDEgPSAwO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHBhdGNoLnN0YXJ0MS0tO1xyXG4gICAgICAgIHBhdGNoLmxlbmd0aDEgPSBwYXJzZUludChtWzJdLCAxMCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHBhdGNoLnN0YXJ0MiA9IHBhcnNlSW50KG1bM10sIDEwKTtcclxuICAgICAgaWYgKG1bNF0gPT09ICcnKSB7XHJcbiAgICAgICAgcGF0Y2guc3RhcnQyLS07XHJcbiAgICAgICAgcGF0Y2gubGVuZ3RoMiA9IDE7XHJcbiAgICAgIH0gZWxzZSBpZiAobVs0XSA9PSAnMCcpIHtcclxuICAgICAgICBwYXRjaC5sZW5ndGgyID0gMDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBwYXRjaC5zdGFydDItLTtcclxuICAgICAgICBwYXRjaC5sZW5ndGgyID0gcGFyc2VJbnQobVs0XSwgMTApO1xyXG4gICAgICB9XHJcbiAgICAgIHRleHRQb2ludGVyKys7XHJcblxyXG4gICAgICB3aGlsZSAodGV4dFBvaW50ZXIgPCB0ZXh0Lmxlbmd0aCkge1xyXG4gICAgICAgIGNvbnN0IHNpZ24gPSB0ZXh0W3RleHRQb2ludGVyXS5jaGFyQXQoMCk7XHJcbiAgICAgICAgbGV0IGxpbmU6IHN0cmluZztcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgbGluZSA9IGRlY29kZVVSSSh0ZXh0W3RleHRQb2ludGVyXS5zdWJzdHJpbmcoMSkpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgICAvLyBNYWxmb3JtZWQgVVJJIHNlcXVlbmNlLlxyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbGxlZ2FsIGVzY2FwZSBpbiBwYXRjaF9mcm9tVGV4dDogJyArIGxpbmUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc2lnbiA9PSAnLScpIHtcclxuICAgICAgICAgIC8vIERlbGV0aW9uLlxyXG4gICAgICAgICAgcGF0Y2guZGlmZnMucHVzaChbRGlmZk9wLkRlbGV0ZSwgbGluZV0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoc2lnbiA9PSAnKycpIHtcclxuICAgICAgICAgIC8vIEluc2VydGlvbi5cclxuICAgICAgICAgIHBhdGNoLmRpZmZzLnB1c2goW0RpZmZPcC5JbnNlcnQsIGxpbmVdKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHNpZ24gPT0gJyAnKSB7XHJcbiAgICAgICAgICAvLyBNaW5vciBlcXVhbGl0eS5cclxuICAgICAgICAgIHBhdGNoLmRpZmZzLnB1c2goW0RpZmZPcC5FcXVhbCwgbGluZV0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoc2lnbiA9PSAnQCcpIHtcclxuICAgICAgICAgIC8vIFN0YXJ0IG9mIG5leHQgcGF0Y2guXHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9IGVsc2UgaWYgKHNpZ24gPT09ICcnKSB7XHJcbiAgICAgICAgICAvLyBCbGFuayBsaW5lPyAgV2hhdGV2ZXIuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIC8vIFdURj9cclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwYXRjaCBtb2RlIFwiJyArIHNpZ24gKyAnXCIgaW46ICcgKyBsaW5lKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGV4dFBvaW50ZXIrKztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHBhdGNoZXM7XHJcbiAgfTtcclxuXHJcbn1cclxuXHJcblxyXG4vKipcclxuICogQ2xhc3MgcmVwcmVzZW50aW5nIG9uZSBwYXRjaCBvcGVyYXRpb24uXHJcblxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIHBhdGNoX29iaiB7XHJcblxyXG4gIGNvbnN0cnVjdG9yKCkgeyAgfVxyXG5cclxuICBkaWZmczogQXJyYXk8RGlmZj4gPSBbXTtcclxuICBzdGFydDE6IG51bWJlciA9IG51bGw7XHJcbiAgc3RhcnQyOiBudW1iZXIgPSBudWxsO1xyXG4gIGxlbmd0aDE6IG51bWJlciA9IDA7XHJcbiAgbGVuZ3RoMjogbnVtYmVyID0gMDtcclxuXHJcbiAgLyoqXHJcbiAgICogRW1tdWxhdGUgR05VIGRpZmYncyBmb3JtYXQuXHJcbiAgICogSGVhZGVyOiBAQCAtMzgyLDggKzQ4MSw5IEBAXHJcbiAgICogSW5kaWNpZXMgYXJlIHByaW50ZWQgYXMgMS1iYXNlZCwgbm90IDAtYmFzZWQuXHJcbiAgICovXHJcbiAgdG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcclxuICAgIGxldCBjb29yZHMxLCBjb29yZHMyO1xyXG4gICAgaWYgKHRoaXMubGVuZ3RoMSA9PT0gMCkge1xyXG4gICAgICBjb29yZHMxID0gdGhpcy5zdGFydDEgKyAnLDAnO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLmxlbmd0aDEgPT0gMSkge1xyXG4gICAgICBjb29yZHMxID0gdGhpcy5zdGFydDEgKyAxO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29vcmRzMSA9ICh0aGlzLnN0YXJ0MSArIDEpICsgJywnICsgdGhpcy5sZW5ndGgxO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMubGVuZ3RoMiA9PT0gMCkge1xyXG4gICAgICBjb29yZHMyID0gdGhpcy5zdGFydDIgKyAnLDAnO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLmxlbmd0aDIgPT0gMSkge1xyXG4gICAgICBjb29yZHMyID0gdGhpcy5zdGFydDIgKyAxO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29vcmRzMiA9ICh0aGlzLnN0YXJ0MiArIDEpICsgJywnICsgdGhpcy5sZW5ndGgyO1xyXG4gICAgfVxyXG4gICAgY29uc3QgdGV4dCA9IFsnQEAgLScgKyBjb29yZHMxICsgJyArJyArIGNvb3JkczIgKyAnIEBAXFxuJ107XHJcbiAgICBsZXQgb3A7XHJcbiAgICAvLyBFc2NhcGUgdGhlIGJvZHkgb2YgdGhlIHBhdGNoIHdpdGggJXh4IG5vdGF0aW9uLlxyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCB0aGlzLmRpZmZzLmxlbmd0aDsgeCsrKSB7XHJcbiAgICAgIHN3aXRjaCAodGhpcy5kaWZmc1t4XVswXSkge1xyXG4gICAgICAgIGNhc2UgRGlmZk9wLkluc2VydDpcclxuICAgICAgICAgIG9wID0gJysnO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBEaWZmT3AuRGVsZXRlOlxyXG4gICAgICAgICAgb3AgPSAnLSc7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIERpZmZPcC5FcXVhbDpcclxuICAgICAgICAgIG9wID0gJyAnO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgICAgdGV4dFt4ICsgMV0gPSBvcCArIGVuY29kZVVSSSh0aGlzLmRpZmZzW3hdWzFdKSArICdcXG4nO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRleHQuam9pbignJykucmVwbGFjZSgvJTIwL2csICcgJyk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgeyBEaWZmTWF0Y2hQYXRjaCB9O1xyXG4iXX0=