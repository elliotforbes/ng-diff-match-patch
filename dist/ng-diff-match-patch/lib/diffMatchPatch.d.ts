export declare const enum DiffOp {
    Delete = -1,
    Equal = 0,
    Insert = 1,
}
export declare type Diff = [DiffOp, string];
/**
 * Class containing the diff, match and patch methods.

 */
declare class DiffMatchPatch {
    constructor();
    Diff_Timeout: number;
    Diff_EditCost: number;
    Match_Threshold: number;
    Match_Distance: number;
    Patch_DeleteThreshold: number;
    Patch_Margin: number;
    Match_MaxBits: number;
    /**
     * The data structure representing a diff is an array of tuples:
     * [[DiffOp.Delete, 'Hello'], [DiffOp.Insert, 'Goodbye'], [DiffOp.Equal, ' world.']]
     * which means: delete 'Hello', add 'Goodbye' and keep ' world.'
     */
    whitespaceRegex_: RegExp;
    linebreakRegex_: RegExp;
    blanklineEndRegex_: RegExp;
    blanklineStartRegex_: RegExp;
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
    diff_main(text1: string, text2: string, opt_checklines?: boolean, opt_deadline?: number): Array<Diff>;
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
    diff_compute_(text1: string, text2: string, checklines: boolean, deadline: number): Array<Diff>;
    /**
     * Do a quick line-level diff on both strings, then rediff the parts for
     * greater accuracy.
     * This speedup can produce non-minimal diffs.
     * @param  text1 Old string to be diffed.
     * @param  text2 New string to be diffed.
     * @param  deadline Time when the diff should be complete by.
     * @return  Array of diff tuples.
  
     */
    diff_lineMode_(text1: string, text2: string, deadline: number): [DiffOp, string][];
    /**
     * Find the 'middle snake' of a diff, split the problem in two
     * and return the recursively constructed diff.
     * See Myers 1986 paper: An O(ND) Difference Algorithm and Its constiations.
     * @param  text1 Old string to be diffed.
     * @param  text2 New string to be diffed.
     * @param  deadline Time at which to bail if not yet complete.
     * @return  Array of diff tuples.
  
     */
    diff_bisect_(text1: string, text2: string, deadline: number): Array<Diff>;
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
    diff_bisectSplit_(text1: string, text2: string, x: number, y: number, deadline: number): [DiffOp, string][];
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
    diff_linesToChars_(text1: string, text2: string): {
        chars1: string;
        chars2: string;
        lineArray: any[];
    };
    /**
     * Split a text into an array of strings.  Reduce the texts to a string of
     * hashes where each Unicode character represents one line.
     * Modifies linearray and linehash through being a closure.
     * @param  text String to encode.
     * @return  Encoded string.
  
     */
    diff_linesToCharsMunge_(text: string, lineArray: Array<string>, lineHash: any): string;
    /**
     * Rehydrate the text in a diff from a string of line hashes to real lines of
     * text.
     * @param  diffs Array of diff tuples.
     * @param  lineArray Array of unique strings.
  
     */
    diff_charsToLines_(diffs: Array<Diff>, lineArray: Array<string>): void;
    /**
     * Determine the common prefix of two strings.
     * @param  text1 First string.
     * @param  text2 Second string.
     * @return  The number of characters common to the start of each
     *     string.
     */
    diff_commonPrefix(text1: string, text2: string): number;
    /**
     * Determine the common suffix of two strings.
     * @param  text1 First string.
     * @param  text2 Second string.
     * @return  The number of characters common to the end of each string.
     */
    diff_commonSuffix(text1: string, text2: string): number;
    /**
     * Determine if the suffix of one string is the prefix of another.
     * @param  text1 First string.
     * @param  text2 Second string.
     * @return  The number of characters common to the end of the first
     *     string and the start of the second string.
  
     */
    diff_commonOverlap_(text1: string, text2: string): number;
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
    diff_halfMatch_(text1: string, text2: string): any[];
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
    diff_halfMatchI_(longtext: string, shorttext: string, i: number, dmp: DiffMatchPatch): Array<string>;
    /**
     * Reduce the number of edits by eliminating semantically trivial equalities.
     * @param  diffs Array of diff tuples.
     */
    diff_cleanupSemantic(diffs: Array<Diff>): void;
    /**
     * Look for single edits surrounded on both sides by equalities
     * which can be shifted sideways to align the edit to a word boundary.
     * e.g: The c<ins>at c</ins>ame. -> The <ins>cat </ins>came.
     * @param  diffs Array of diff tuples.
     */
    diff_cleanupSemanticLossless(diffs: Array<Diff>): void;
    /**
     * Reduce the number of edits by eliminating operationally trivial equalities.
     * @param  diffs Array of diff tuples.
     */
    diff_cleanupEfficiency(diffs: Array<Diff>): void;
    /**
     * Reorder and merge like edit sections.  Merge equalities.
     * Any edit section can move as long as it doesn't cross an equality.
     * @param  diffs Array of diff tuples.
     */
    diff_cleanupMerge(diffs: Array<Diff>): void;
    /**
     * loc is a location in text1, compute and return the equivalent location in
     * text2.
     * e.g. 'The cat' vs 'The big cat', 1->1, 5->8
     * @param  diffs Array of diff tuples.
     * @param  loc Location within text1.
     * @return  Location within text2.
     */
    diff_xIndex(diffs: Array<Diff>, loc: number): number;
    /**
     * Convert a diff array into a pretty HTML report.
     * @param  diffs Array of diff tuples.
     * @return  HTML representation.
     */
    diff_prettyHtml: (diffs: [DiffOp, string][]) => string;
    /**
     * Compute and return the source text (all equalities and deletions).
     * @param  diffs Array of diff tuples.
     * @return  Source text.
     */
    diff_text1(diffs: Array<Diff>): string;
    /**
     * Compute and return the destination text (all equalities and insertions).
     * @param  diffs Array of diff tuples.
     * @return  Destination text.
     */
    diff_text2(diffs: Array<Diff>): string;
    /**
     * Compute the Levenshtein distance; the number of inserted, deleted or
     * substituted characters.
     * @param  diffs Array of diff tuples.
     * @return  Number of changes.
     */
    diff_levenshtein(diffs: Array<Diff>): number;
    /**
     * Crush the diff into an encoded string which describes the operations
     * required to transform text1 into text2.
     * E.g. =3\t-2\t+ing  -> Keep 3 chars, delete 2 chars, insert 'ing'.
     * Operations are tab-separated.  Inserted text is escaped using %xx notation.
     * @param  diffs Array of diff tuples.
     * @return  Delta text.
     */
    diff_toDelta(diffs: Array<Diff>): string;
    /**
     * Given the original text1, and an encoded string which describes the
     * operations required to transform text1 into text2, compute the full diff.
     * @param  text1 Source string for the diff.
     * @param  delta Delta text.
     * @return  Array of diff tuples.
     * @throws {!Error} If invalid input.
     */
    diff_fromDelta(text1: string, delta: string): any[];
    /**
     * Locate the best instance of 'pattern' in 'text' near 'loc'.
     * @param  text The text to search.
     * @param  pattern The pattern to search for.
     * @param  loc The location to search around.
     * @return  Best match index or -1.
     */
    match_main(text: string, pattern: string, loc: number): number;
    /**
     * Locate the best instance of 'pattern' in 'text' near 'loc' using the
     * Bitap algorithm.
     * @param  text The text to search.
     * @param  pattern The pattern to search for.
     * @param  loc The location to search around.
     * @return  Best match index or -1.
  
     */
    match_bitap_(text: string, pattern: string, loc: number): number;
    /**
     * Initialise the alphabet for the Bitap algorithm.
     * @param  pattern The text to encode.
     * @return  Hash of character locations.
  
     */
    match_alphabet_(pattern: string): {
        [character: string]: number;
    };
    /**
     * Increase the context until it is unique,
     * but don't let the pattern expand beyond Match_MaxBits.
     * @param  patch The patch to grow.
     * @param  text Source text.
  
     */
    patch_addContext_(patch: patch_obj, text: string): void;
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
    patch_make(a: string | Array<Diff>, opt_b: string | Array<Diff>, opt_c: string | Array<Diff>): any[];
    /**
     * Given an array of patches, return another array that is identical.
     * @param  patches Array of Patch objects.
     * @return  Array of Patch objects.
     */
    patch_deepCopy(patches: Array<patch_obj>): Array<patch_obj>;
    /**
     * Merge a set of patches onto the text.  Return a patched text, as well
     * as a list of true/false values indicating which patches were applied.
     * @param  patches Array of Patch objects.
     * @param  text Old text.
     * @return  Two element Array, containing the
     *      new text and an array of boolean values.
     */
    patch_apply(patches: Array<patch_obj>, text: string): (string | any[])[];
    /**
     * Add some padding on text start and end so that edges can match something.
     * Intended to be called only from within patch_apply.
     * @param  patches Array of Patch objects.
     * @return  The padding string added to each side.
     */
    patch_addPadding(patches: Array<patch_obj>): string;
    /**
     * Look through the patches and break up any which are longer than the maximum
     * limit of the match algorithm.
     * Intended to be called only from within patch_apply.
     * @param  patches Array of Patch objects.
     */
    patch_splitMax: (patches: patch_obj[]) => void;
    /**
     * Take a list of patches and return a textual representation.
     * @param  patches Array of Patch objects.
     * @return  Text representation of patches.
     */
    patch_toText(patches: Array<patch_obj>): string;
    /**
     * Parse a textual representation of patches and return a list of Patch objects.
     * @param  textline Text representation of patches.
     * @return  Array of Patch objects.
     * @throws {!Error} If invalid input.
     */
    patch_fromText(textline: string): Array<patch_obj>;
}
/**
 * Class representing one patch operation.

 */
export declare class patch_obj {
    constructor();
    diffs: Array<Diff>;
    start1: number;
    start2: number;
    length1: number;
    length2: number;
    /**
     * Emmulate GNU diff's format.
     * Header: @@ -382,8 +481,9 @@
     * Indicies are printed as 1-based, not 0-based.
     */
    toString: () => string;
}
export { DiffMatchPatch };
