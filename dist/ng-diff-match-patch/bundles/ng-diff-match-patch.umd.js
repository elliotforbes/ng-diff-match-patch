(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core'), require('@angular/common')) :
  typeof define === 'function' && define.amd ? define('ng-diff-match-patch', ['exports', '@angular/core', '@angular/common'], factory) :
  (factory((global['ng-diff-match-patch'] = {}),global.ng.core,global.ng.common));
}(this, (function (exports,core,common) { 'use strict';

  /**
   * @fileoverview added by tsickle
   * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
   */
  /**
   * Class containing the diff, match and patch methods.
   */
  var /**
   * Class containing the diff, match and patch methods.
   */ DiffMatchPatch = (function () {
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
                      else if (sign === '') ;
                      else {
                          // WTF?
                          throw new Error('Invalid patch mode "' + sign + '" in: ' + line);
                      }
                      textPointer++;
                  }
              }
              return patches;
          };
      return DiffMatchPatch;
  }());
  /**
   * Class representing one patch operation.
   */
  var /**
   * Class representing one patch operation.
   */ patch_obj = (function () {
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
   * @fileoverview added by tsickle
   * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
   */
  var DiffMatchPatchService = (function () {
      function DiffMatchPatchService(dmp) {
          this.dmp = dmp;
      }
      /**
       * @return {?}
       */
      DiffMatchPatchService.prototype.ngOnInit = /**
       * @return {?}
       */
          function () {
          };
      /**
       * @param {?} left
       * @param {?} right
       * @return {?}
       */
      DiffMatchPatchService.prototype.getDiff = /**
       * @param {?} left
       * @param {?} right
       * @return {?}
       */
          function (left, right) {
              return this.dmp.diff_main(left, right);
          };
      /**
       * @param {?} left
       * @param {?} right
       * @return {?}
       */
      DiffMatchPatchService.prototype.getSemanticDiff = /**
       * @param {?} left
       * @param {?} right
       * @return {?}
       */
          function (left, right) {
              /** @type {?} */
              var diffs = this.dmp.diff_main(left, right);
              this.dmp.diff_cleanupSemantic(diffs);
              return diffs;
          };
      /**
       * @param {?} left
       * @param {?} right
       * @return {?}
       */
      DiffMatchPatchService.prototype.getProcessingDiff = /**
       * @param {?} left
       * @param {?} right
       * @return {?}
       */
          function (left, right) {
              /** @type {?} */
              var diffs = this.dmp.diff_main(left, right);
              this.dmp.diff_cleanupEfficiency(diffs);
              return diffs;
          };
      /**
       * @param {?} left
       * @param {?} right
       * @return {?}
       */
      DiffMatchPatchService.prototype.getLineDiff = /**
       * @param {?} left
       * @param {?} right
       * @return {?}
       */
          function (left, right) {
              /** @type {?} */
              var chars = this.dmp.diff_linesToChars_(left, right);
              /** @type {?} */
              var diffs = this.dmp.diff_main(chars.chars1, chars.chars2, false);
              this.dmp.diff_charsToLines_(diffs, chars.lineArray);
              return diffs;
          };
      /**
       * @return {?}
       */
      DiffMatchPatchService.prototype.getDmp = /**
       * @return {?}
       */
          function () {
              return this.dmp;
          };
      DiffMatchPatchService.decorators = [
          { type: core.Injectable },
      ];
      /** @nocollapse */
      DiffMatchPatchService.ctorParameters = function () {
          return [
              { type: DiffMatchPatch }
          ];
      };
      return DiffMatchPatchService;
  }());

  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation. All rights reserved.
  Licensed under the Apache License, Version 2.0 (the "License"); you may not use
  this file except in compliance with the License. You may obtain a copy of the
  License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
  WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
  MERCHANTABLITY OR NON-INFRINGEMENT.

  See the Apache Version 2.0 License for specific language governing permissions
  and limitations under the License.
  ***************************************************************************** */
  function __values(o) {
      var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
      if (m)
          return m.call(o);
      return {
          next: function () {
              if (o && i >= o.length)
                  o = void 0;
              return { value: o && o[i++], done: !o };
          }
      };
  }

  /**
   * @fileoverview added by tsickle
   * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
   */
  var LineCompareComponent = (function () {
      function LineCompareComponent(dmp) {
          this.dmp = dmp;
          this.left = '';
          this.right = '';
      }
      /**
       * @return {?}
       */
      LineCompareComponent.prototype.ngOnInit = /**
       * @return {?}
       */
          function () {
              this.updateHtml();
          };
      /**
       * @return {?}
       */
      LineCompareComponent.prototype.ngOnChanges = /**
       * @return {?}
       */
          function () {
              this.updateHtml();
          };
      /**
       * @return {?}
       */
      LineCompareComponent.prototype.updateHtml = /**
       * @return {?}
       */
          function () {
              if (typeof this.left === 'number' || typeof this.left === 'boolean') {
                  this.left = this.left.toString();
              }
              if (typeof this.right === 'number' || typeof this.right === 'boolean') {
                  this.right = this.right.toString();
              }
              this.calculateLineDiff(this.dmp.getLineDiff(this.left, this.right));
          };
      /**
       * @param {?} diffs
       * @return {?}
       */
      LineCompareComponent.prototype.calculateLineDiff = /**
       * @param {?} diffs
       * @return {?}
       */
          function (diffs) {
              /** @type {?} */
              var diffCalculation = {
                  lines: [],
                  lineLeft: 1,
                  lineRight: 1
              };
              this.isContentEqual = diffs.length === 1 && diffs[0][0] === 0 /* Equal */;
              if (this.isContentEqual) {
                  this.calculatedDiff = [];
                  return;
              }
              for (var i = 0; i < diffs.length; i++) {
                  /** @type {?} */
                  var diff = diffs[i];
                  /** @type {?} */
                  var diffLines = diff[1].split(/\r?\n/);
                  // If the original line had a \r\n at the end then remove the
                  // empty string after it.
                  if (diffLines[diffLines.length - 1].length == 0) {
                      diffLines.pop();
                  }
                  switch (diff[0]) {
                      case 0 /* Equal */: {
                          /** @type {?} */
                          var isFirstDiff = i === 0;
                          /** @type {?} */
                          var isLastDiff = i === diffs.length - 1;
                          this.outputEqualDiff(diffLines, diffCalculation, isFirstDiff, isLastDiff);
                          break;
                      }
                      case -1 /* Delete */: {
                          this.outputDeleteDiff(diffLines, diffCalculation);
                          break;
                      }
                      case 1 /* Insert */: {
                          this.outputInsertDiff(diffLines, diffCalculation);
                          break;
                      }
                  }
              }
              this.calculatedDiff = diffCalculation.lines;
          };
      /**
       * @param {?} diffLines
       * @param {?} diffCalculation
       * @param {?} isFirstDiff
       * @param {?} isLastDiff
       * @return {?}
       */
      LineCompareComponent.prototype.outputEqualDiff = /**
       * @param {?} diffLines
       * @param {?} diffCalculation
       * @param {?} isFirstDiff
       * @param {?} isLastDiff
       * @return {?}
       */
          function (diffLines, diffCalculation, isFirstDiff, isLastDiff) {
              if (this.lineContextSize && diffLines.length > this.lineContextSize) {
                  if (isFirstDiff) {
                      /** @type {?} */
                      var lineIncrement = diffLines.length - this.lineContextSize;
                      diffCalculation.lineLeft += lineIncrement;
                      diffCalculation.lineRight += lineIncrement;
                      diffLines = diffLines.slice(diffLines.length - this.lineContextSize, diffLines.length);
                  }
                  else if (isLastDiff) {
                      // Take only the first 'lineContextSize' lines from the final diff
                      diffLines = diffLines.slice(0, this.lineContextSize);
                  }
                  else if (diffLines.length > 2 * this.lineContextSize) {
                      // Take the first 'lineContextSize' lines from this diff to provide context for the last diff
                      this.outputEqualDiffLines(diffLines.slice(0, this.lineContextSize), diffCalculation);
                      // Output a special line indicating that some content is equal and has been skipped
                      diffCalculation.lines.push(['dmp-line-compare-equal', '...', '...', '...']);
                      /** @type {?} */
                      var numberOfSkippedLines = diffLines.length - (2 * this.lineContextSize);
                      diffCalculation.lineLeft += numberOfSkippedLines;
                      diffCalculation.lineRight += numberOfSkippedLines;
                      // Take the last 'lineContextSize' lines from this diff to provide context for the next diff
                      this.outputEqualDiffLines(diffLines.slice(diffLines.length - this.lineContextSize), diffCalculation);
                      // This if branch has already output the diff lines so we return early to avoid outputting the lines
                      // at the end of the method.
                      return;
                  }
              }
              this.outputEqualDiffLines(diffLines, diffCalculation);
          };
      /**
       * @param {?} diffLines
       * @param {?} diffCalculation
       * @return {?}
       */
      LineCompareComponent.prototype.outputEqualDiffLines = /**
       * @param {?} diffLines
       * @param {?} diffCalculation
       * @return {?}
       */
          function (diffLines, diffCalculation) {
              try {
                  for (var diffLines_1 = __values(diffLines), diffLines_1_1 = diffLines_1.next(); !diffLines_1_1.done; diffLines_1_1 = diffLines_1.next()) {
                      var line = diffLines_1_1.value;
                      diffCalculation.lines.push(['dmp-line-compare-equal', "" + diffCalculation.lineLeft, "" + diffCalculation.lineRight, line]);
                      diffCalculation.lineLeft++;
                      diffCalculation.lineRight++;
                  }
              }
              catch (e_1_1) {
                  e_1 = { error: e_1_1 };
              }
              finally {
                  try {
                      if (diffLines_1_1 && !diffLines_1_1.done && (_a = diffLines_1.return))
                          _a.call(diffLines_1);
                  }
                  finally {
                      if (e_1)
                          throw e_1.error;
                  }
              }
              var e_1, _a;
          };
      /**
       * @param {?} diffLines
       * @param {?} diffCalculation
       * @return {?}
       */
      LineCompareComponent.prototype.outputDeleteDiff = /**
       * @param {?} diffLines
       * @param {?} diffCalculation
       * @return {?}
       */
          function (diffLines, diffCalculation) {
              try {
                  for (var diffLines_2 = __values(diffLines), diffLines_2_1 = diffLines_2.next(); !diffLines_2_1.done; diffLines_2_1 = diffLines_2.next()) {
                      var line = diffLines_2_1.value;
                      diffCalculation.lines.push(['dmp-line-compare-delete', "" + diffCalculation.lineLeft, '-', line]);
                      diffCalculation.lineLeft++;
                  }
              }
              catch (e_2_1) {
                  e_2 = { error: e_2_1 };
              }
              finally {
                  try {
                      if (diffLines_2_1 && !diffLines_2_1.done && (_a = diffLines_2.return))
                          _a.call(diffLines_2);
                  }
                  finally {
                      if (e_2)
                          throw e_2.error;
                  }
              }
              var e_2, _a;
          };
      /**
       * @param {?} diffLines
       * @param {?} diffCalculation
       * @return {?}
       */
      LineCompareComponent.prototype.outputInsertDiff = /**
       * @param {?} diffLines
       * @param {?} diffCalculation
       * @return {?}
       */
          function (diffLines, diffCalculation) {
              try {
                  for (var diffLines_3 = __values(diffLines), diffLines_3_1 = diffLines_3.next(); !diffLines_3_1.done; diffLines_3_1 = diffLines_3.next()) {
                      var line = diffLines_3_1.value;
                      diffCalculation.lines.push(['dmp-line-compare-insert', '-', "" + diffCalculation.lineRight, line]);
                      diffCalculation.lineRight++;
                  }
              }
              catch (e_3_1) {
                  e_3 = { error: e_3_1 };
              }
              finally {
                  try {
                      if (diffLines_3_1 && !diffLines_3_1.done && (_a = diffLines_3.return))
                          _a.call(diffLines_3);
                  }
                  finally {
                      if (e_3)
                          throw e_3.error;
                  }
              }
              var e_3, _a;
          };
      LineCompareComponent.decorators = [
          { type: core.Component, args: [{
                      selector: 'dmp-line-compare',
                      styles: ["\n    div.dmp-line-compare {\n      display: flex;\n      flex-direction: row;\n      border: 1px solid #808080;\n      font-family: Consolas, Courier, monospace;\n      width: 911px;\n    }\n    div.dmp-line-compare-margin {\n      width: 101px;\n    }\n    div.dmp-line-compare-content {\n      position: relative;\n      top: 0px;\n      left: 0px;\n      flex-grow: 1;\n      overflow-x: scroll;\n    }\n    div.dmp-line-compare-content-wrapper {\n      position: absolute;\n      top: 0px;\n      left: 0px;\n      display: flex;\n      flex-direction: column;\n      align-items: stretch;\n    }\n    div.dmp-line-compare-left {\n      width: 50px;\n      text-align: center;\n      color: #484848;\n    }\n    div.dmp-line-compare-equal>div.dmp-line-compare-left,\n      div.dmp-line-compare-equal>div.dmp-line-compare-right {\n      background-color: #dedede;\n    }\n    div.dmp-line-compare-insert>div.dmp-line-compare-left,\n      div.dmp-line-compare-insert>div.dmp-line-compare-right {\n      background-color: #8bfb6f;\n    }\n    div.dmp-line-compare-delete>div.dmp-line-compare-left,\n      div.dmp-line-compare-delete>div.dmp-line-compare-right {\n      background-color: #f56868;\n    }\n    div.dmp-line-compare-right {\n      width: 50px;\n      text-align: center;\n      color: #484848;\n      border-right: 1px solid #888888;\n    }\n    div.dmp-line-compare-text {\n      white-space: pre;\n      padding-left: 10px;\n      min-width: 800px;\n    }\n    .dmp-line-compare-delete {\n      background-color: #ff8c8c;\n    }\n    .dmp-line-compare-insert {\n      background-color: #9dff97;\n    }\n    .dmp-line-compare-delete>div {\n      display: inline-block;\n    }  \n    .dmp-line-compare-insert>div {\n      display: inline-block;\n    }\n    .dmp-line-compare-equal>div {\n      display: inline-block;\n    }\n    .dmp-margin-bottom-spacer {\n      height: 20px;\n      background-color: #dedede;\n      border-right: 1px solid #888888;\n    }\n  "],
                      template: "\n    <div class=\"dmp-line-compare-no-changes-text\" *ngIf=\"isContentEqual\">\n      There are no changes to display.\n    </div>    \n    <div class=\"dmp-line-compare\" *ngIf=\"!isContentEqual\">\n      <div class=\"dmp-line-compare-margin\">\n        <div [ngClass]=\"lineDiff[0]\" *ngFor=\"let lineDiff of calculatedDiff\">\n          <div class=\"dmp-line-compare-left\">{{lineDiff[1]}}</div><!-- No space\n        --><div class=\"dmp-line-compare-right\">{{lineDiff[2]}}</div>\n        </div>\n        <div class=\"dmp-margin-bottom-spacer\"></div>\n      </div><!-- No space\n   --><div class=\"dmp-line-compare-content\">\n        <div class=\"dmp-line-compare-content-wrapper\">\n          <div [ngClass]=\"lineDiff[0]\" *ngFor=\"let lineDiff of calculatedDiff\">\n            <div class=\"dmp-line-compare-text\">{{lineDiff[3]}}</div>\n          </div>\n        </div>\n      </div>\n    </div>\n  "
                  },] },
      ];
      /** @nocollapse */
      LineCompareComponent.ctorParameters = function () {
          return [
              { type: DiffMatchPatchService }
          ];
      };
      LineCompareComponent.propDecorators = {
          left: [{ type: core.Input }],
          right: [{ type: core.Input }],
          lineContextSize: [{ type: core.Input }]
      };
      return LineCompareComponent;
  }());

  /**
   * @fileoverview added by tsickle
   * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
   */
  var DiffDirective = (function () {
      function DiffDirective(el, dmp) {
          this.el = el;
          this.dmp = dmp;
          this.left = '';
          this.right = '';
      }
      /**
       * @return {?}
       */
      DiffDirective.prototype.ngOnInit = /**
       * @return {?}
       */
          function () {
              this.updateHtml();
          };
      /**
       * @return {?}
       */
      DiffDirective.prototype.ngOnChanges = /**
       * @return {?}
       */
          function () {
              this.updateHtml();
          };
      /**
       * @return {?}
       */
      DiffDirective.prototype.updateHtml = /**
       * @return {?}
       */
          function () {
              this.el.nativeElement.innerHTML = this.createHtml(this.dmp.getDiff(this.left, this.right));
          };
      /**
       * @param {?} diffs
       * @return {?}
       */
      DiffDirective.prototype.createHtml = /**
       * @param {?} diffs
       * @return {?}
       */
          function (diffs) {
              /** @type {?} */
              var html;
              html = '<div>';
              try {
                  for (var diffs_1 = __values(diffs), diffs_1_1 = diffs_1.next(); !diffs_1_1.done; diffs_1_1 = diffs_1.next()) {
                      var diff = diffs_1_1.value;
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
              }
              catch (e_1_1) {
                  e_1 = { error: e_1_1 };
              }
              finally {
                  try {
                      if (diffs_1_1 && !diffs_1_1.done && (_a = diffs_1.return))
                          _a.call(diffs_1);
                  }
                  finally {
                      if (e_1)
                          throw e_1.error;
                  }
              }
              html += '</div>';
              return html;
              var e_1, _a;
          };
      DiffDirective.decorators = [
          { type: core.Directive, args: [{
                      selector: '[diff]'
                  },] },
      ];
      /** @nocollapse */
      DiffDirective.ctorParameters = function () {
          return [
              { type: core.ElementRef },
              { type: DiffMatchPatchService }
          ];
      };
      DiffDirective.propDecorators = {
          left: [{ type: core.Input }],
          right: [{ type: core.Input }]
      };
      return DiffDirective;
  }());

  /**
   * @fileoverview added by tsickle
   * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
   */
  var LineDiffDirective = (function () {
      function LineDiffDirective(el, dmp) {
          this.el = el;
          this.dmp = dmp;
      }
      /**
       * @return {?}
       */
      LineDiffDirective.prototype.ngOnInit = /**
       * @return {?}
       */
          function () {
              this.updateHtml();
          };
      /**
       * @return {?}
       */
      LineDiffDirective.prototype.ngOnChanges = /**
       * @return {?}
       */
          function () {
              this.updateHtml();
          };
      /**
       * @return {?}
       */
      LineDiffDirective.prototype.updateHtml = /**
       * @return {?}
       */
          function () {
              if (typeof this.left === 'number' || typeof this.left === 'boolean') {
                  this.left = this.left.toString();
              }
              if (typeof this.right === 'number' || typeof this.right === 'boolean') {
                  this.right = this.right.toString();
              }
              this.el.nativeElement.innerHTML = this.createHtml(this.dmp.getLineDiff(this.left, this.right));
          };
      /**
       * @param {?} diffs
       * @return {?}
       */
      LineDiffDirective.prototype.createHtml = /**
       * @param {?} diffs
       * @return {?}
       */
          function (diffs) {
              /** @type {?} */
              var html;
              html = '<div>';
              try {
                  for (var diffs_1 = __values(diffs), diffs_1_1 = diffs_1.next(); !diffs_1_1.done; diffs_1_1 = diffs_1.next()) {
                      var diff = diffs_1_1.value;
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
              }
              catch (e_1_1) {
                  e_1 = { error: e_1_1 };
              }
              finally {
                  try {
                      if (diffs_1_1 && !diffs_1_1.done && (_a = diffs_1.return))
                          _a.call(diffs_1);
                  }
                  finally {
                      if (e_1)
                          throw e_1.error;
                  }
              }
              html += '</div>';
              return html;
              var e_1, _a;
          };
      LineDiffDirective.decorators = [
          { type: core.Directive, args: [{
                      selector: '[lineDiff]',
                  },] },
      ];
      /** @nocollapse */
      LineDiffDirective.ctorParameters = function () {
          return [
              { type: core.ElementRef },
              { type: DiffMatchPatchService }
          ];
      };
      LineDiffDirective.propDecorators = {
          left: [{ type: core.Input }],
          right: [{ type: core.Input }]
      };
      return LineDiffDirective;
  }());

  /**
   * @fileoverview added by tsickle
   * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
   */
  var ProcessingDiffDirective = (function () {
      function ProcessingDiffDirective(el, dmp) {
          this.el = el;
          this.dmp = dmp;
          this.left = '';
          this.right = '';
      }
      /**
       * @return {?}
       */
      ProcessingDiffDirective.prototype.ngOnInit = /**
       * @return {?}
       */
          function () {
              this.updateHtml();
          };
      /**
       * @return {?}
       */
      ProcessingDiffDirective.prototype.ngOnChanges = /**
       * @return {?}
       */
          function () {
              this.updateHtml();
          };
      /**
       * @return {?}
       */
      ProcessingDiffDirective.prototype.updateHtml = /**
       * @return {?}
       */
          function () {
              this.el.nativeElement.innerHTML = this.createHtml(this.dmp.getProcessingDiff(this.left, this.right));
          };
      /**
       * @param {?} diffs
       * @return {?}
       */
      ProcessingDiffDirective.prototype.createHtml = /**
       * @param {?} diffs
       * @return {?}
       */
          function (diffs) {
              /** @type {?} */
              var html;
              html = '<div>';
              try {
                  for (var diffs_1 = __values(diffs), diffs_1_1 = diffs_1.next(); !diffs_1_1.done; diffs_1_1 = diffs_1.next()) {
                      var diff = diffs_1_1.value;
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
              }
              catch (e_1_1) {
                  e_1 = { error: e_1_1 };
              }
              finally {
                  try {
                      if (diffs_1_1 && !diffs_1_1.done && (_a = diffs_1.return))
                          _a.call(diffs_1);
                  }
                  finally {
                      if (e_1)
                          throw e_1.error;
                  }
              }
              html += '</div>';
              return html;
              var e_1, _a;
          };
      ProcessingDiffDirective.decorators = [
          { type: core.Directive, args: [{
                      selector: '[processingDiff]'
                  },] },
      ];
      /** @nocollapse */
      ProcessingDiffDirective.ctorParameters = function () {
          return [
              { type: core.ElementRef },
              { type: DiffMatchPatchService }
          ];
      };
      ProcessingDiffDirective.propDecorators = {
          left: [{ type: core.Input }],
          right: [{ type: core.Input }]
      };
      return ProcessingDiffDirective;
  }());

  /**
   * @fileoverview added by tsickle
   * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
   */
  var SemanticDiffDirective = (function () {
      function SemanticDiffDirective(el, dmp) {
          this.el = el;
          this.dmp = dmp;
          this.left = '';
          this.right = '';
      }
      /**
       * @return {?}
       */
      SemanticDiffDirective.prototype.ngOnInit = /**
       * @return {?}
       */
          function () {
              this.updateHtml();
          };
      /**
       * @return {?}
       */
      SemanticDiffDirective.prototype.ngOnChanges = /**
       * @return {?}
       */
          function () {
              this.updateHtml();
          };
      /**
       * @return {?}
       */
      SemanticDiffDirective.prototype.updateHtml = /**
       * @return {?}
       */
          function () {
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
      /**
       * @param {?} diffs
       * @return {?}
       */
      SemanticDiffDirective.prototype.createHtml = /**
       * @param {?} diffs
       * @return {?}
       */
          function (diffs) {
              /** @type {?} */
              var html;
              html = '<div>';
              try {
                  for (var diffs_1 = __values(diffs), diffs_1_1 = diffs_1.next(); !diffs_1_1.done; diffs_1_1 = diffs_1.next()) {
                      var diff = diffs_1_1.value;
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
              }
              catch (e_1_1) {
                  e_1 = { error: e_1_1 };
              }
              finally {
                  try {
                      if (diffs_1_1 && !diffs_1_1.done && (_a = diffs_1.return))
                          _a.call(diffs_1);
                  }
                  finally {
                      if (e_1)
                          throw e_1.error;
                  }
              }
              html += '</div>';
              return html;
              var e_1, _a;
          };
      SemanticDiffDirective.decorators = [
          { type: core.Directive, args: [{
                      selector: '[semanticDiff]'
                  },] },
      ];
      /** @nocollapse */
      SemanticDiffDirective.ctorParameters = function () {
          return [
              { type: core.ElementRef },
              { type: DiffMatchPatchService }
          ];
      };
      SemanticDiffDirective.propDecorators = {
          left: [{ type: core.Input }],
          right: [{ type: core.Input }]
      };
      return SemanticDiffDirective;
  }());

  /**
   * @fileoverview added by tsickle
   * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
   */
  var DiffMatchPatchModule = (function () {
      function DiffMatchPatchModule() {
      }
      DiffMatchPatchModule.decorators = [
          { type: core.NgModule, args: [{
                      declarations: [
                          DiffDirective,
                          LineDiffDirective,
                          ProcessingDiffDirective,
                          SemanticDiffDirective,
                          LineCompareComponent
                      ],
                      imports: [
                          common.CommonModule
                      ],
                      exports: [
                          DiffDirective,
                          LineDiffDirective,
                          ProcessingDiffDirective,
                          SemanticDiffDirective,
                          LineCompareComponent
                      ],
                      providers: [
                          DiffMatchPatch,
                          DiffMatchPatchService
                      ]
                  },] },
      ];
      return DiffMatchPatchModule;
  }());

  /**
   * @fileoverview added by tsickle
   * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
   */

  /**
   * @fileoverview added by tsickle
   * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
   */

  exports.DiffMatchPatchService = DiffMatchPatchService;
  exports.patch_obj = patch_obj;
  exports.DiffMatchPatch = DiffMatchPatch;
  exports.LineCompareComponent = LineCompareComponent;
  exports.DiffDirective = DiffDirective;
  exports.LineDiffDirective = LineDiffDirective;
  exports.ProcessingDiffDirective = ProcessingDiffDirective;
  exports.SemanticDiffDirective = SemanticDiffDirective;
  exports.DiffMatchPatchModule = DiffMatchPatchModule;

  Object.defineProperty(exports, '__esModule', { value: true });

})));

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmctZGlmZi1tYXRjaC1wYXRjaC51bWQuanMubWFwIiwic291cmNlcyI6WyJuZzovL25nLWRpZmYtbWF0Y2gtcGF0Y2gvbGliL2RpZmZNYXRjaFBhdGNoLnRzIiwibmc6Ly9uZy1kaWZmLW1hdGNoLXBhdGNoL2xpYi9kaWZmTWF0Y2hQYXRjaC5zZXJ2aWNlLnRzIixudWxsLCJuZzovL25nLWRpZmYtbWF0Y2gtcGF0Y2gvbGliL2xpbmVDb21wYXJlLmNvbXBvbmVudC50cyIsIm5nOi8vbmctZGlmZi1tYXRjaC1wYXRjaC9saWIvZGlmZi5kaXJlY3RpdmUudHMiLCJuZzovL25nLWRpZmYtbWF0Y2gtcGF0Y2gvbGliL2xpbmVEaWZmLmRpcmVjdGl2ZS50cyIsIm5nOi8vbmctZGlmZi1tYXRjaC1wYXRjaC9saWIvcHJvY2Vzc2luZ0RpZmYuZGlyZWN0aXZlLnRzIiwibmc6Ly9uZy1kaWZmLW1hdGNoLXBhdGNoL2xpYi9zZW1hbnRpY0RpZmYuZGlyZWN0aXZlLnRzIiwibmc6Ly9uZy1kaWZmLW1hdGNoLXBhdGNoL2xpYi9kaWZmTWF0Y2hQYXRjaC5tb2R1bGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNvbnN0IGVudW0gRGlmZk9wIHtcclxuICBEZWxldGUgPSAtMSxcclxuICBFcXVhbCA9IDAsXHJcbiAgSW5zZXJ0ID0gMVxyXG59XHJcblxyXG5leHBvcnQgdHlwZSBEaWZmID0gW0RpZmZPcCwgc3RyaW5nXTtcclxuXHJcbi8qKlxyXG4gKiBDbGFzcyBjb250YWluaW5nIHRoZSBkaWZmLCBtYXRjaCBhbmQgcGF0Y2ggbWV0aG9kcy5cclxuXHJcbiAqL1xyXG5jbGFzcyBEaWZmTWF0Y2hQYXRjaCB7XHJcblxyXG4gIGNvbnN0cnVjdG9yKCkgeyAgfVxyXG5cclxuICAvLyBEZWZhdWx0cy5cclxuICAvLyBSZWRlZmluZSB0aGVzZSBpbiB5b3VyIHByb2dyYW0gdG8gb3ZlcnJpZGUgdGhlIGRlZmF1bHRzLlxyXG5cclxuICAvLyBOdW1iZXIgb2Ygc2Vjb25kcyB0byBtYXAgYSBkaWZmIGJlZm9yZSBnaXZpbmcgdXAgKDAgZm9yIGluZmluaXR5KS5cclxuICBEaWZmX1RpbWVvdXQgPSAxLjA7XHJcbiAgLy8gQ29zdCBvZiBhbiBlbXB0eSBlZGl0IG9wZXJhdGlvbiBpbiB0ZXJtcyBvZiBlZGl0IGNoYXJhY3RlcnMuXHJcbiAgRGlmZl9FZGl0Q29zdCA9IDQ7XHJcbiAgLy8gQXQgd2hhdCBwb2ludCBpcyBubyBtYXRjaCBkZWNsYXJlZCAoMC4wID0gcGVyZmVjdGlvbiwgMS4wID0gdmVyeSBsb29zZSkuXHJcbiAgTWF0Y2hfVGhyZXNob2xkID0gMC41O1xyXG4gIC8vIEhvdyBmYXIgdG8gc2VhcmNoIGZvciBhIG1hdGNoICgwID0gZXhhY3QgbG9jYXRpb24sIDEwMDArID0gYnJvYWQgbWF0Y2gpLlxyXG4gIC8vIEEgbWF0Y2ggdGhpcyBtYW55IGNoYXJhY3RlcnMgYXdheSBmcm9tIHRoZSBleHBlY3RlZCBsb2NhdGlvbiB3aWxsIGFkZFxyXG4gIC8vIDEuMCB0byB0aGUgc2NvcmUgKDAuMCBpcyBhIHBlcmZlY3QgbWF0Y2gpLlxyXG4gIE1hdGNoX0Rpc3RhbmNlID0gMTAwMDtcclxuICAvLyBXaGVuIGRlbGV0aW5nIGEgbGFyZ2UgYmxvY2sgb2YgdGV4dCAob3ZlciB+NjQgY2hhcmFjdGVycyksIGhvdyBjbG9zZSBkb1xyXG4gIC8vIHRoZSBjb250ZW50cyBoYXZlIHRvIGJlIHRvIG1hdGNoIHRoZSBleHBlY3RlZCBjb250ZW50cy4gKDAuMCA9IHBlcmZlY3Rpb24sXHJcbiAgLy8gMS4wID0gdmVyeSBsb29zZSkuICBOb3RlIHRoYXQgTWF0Y2hfVGhyZXNob2xkIGNvbnRyb2xzIGhvdyBjbG9zZWx5IHRoZVxyXG4gIC8vIGVuZCBwb2ludHMgb2YgYSBkZWxldGUgbmVlZCB0byBtYXRjaC5cclxuICBQYXRjaF9EZWxldGVUaHJlc2hvbGQgPSAwLjU7XHJcbiAgLy8gQ2h1bmsgc2l6ZSBmb3IgY29udGV4dCBsZW5ndGguXHJcbiAgUGF0Y2hfTWFyZ2luID0gNDtcclxuXHJcbiAgLy8gVGhlIG51bWJlciBvZiBiaXRzIGluIGFuIGludC5cclxuICBNYXRjaF9NYXhCaXRzID0gMzI7XHJcbiAgLyoqXHJcbiAgICogVGhlIGRhdGEgc3RydWN0dXJlIHJlcHJlc2VudGluZyBhIGRpZmYgaXMgYW4gYXJyYXkgb2YgdHVwbGVzOlxyXG4gICAqIFtbRGlmZk9wLkRlbGV0ZSwgJ0hlbGxvJ10sIFtEaWZmT3AuSW5zZXJ0LCAnR29vZGJ5ZSddLCBbRGlmZk9wLkVxdWFsLCAnIHdvcmxkLiddXVxyXG4gICAqIHdoaWNoIG1lYW5zOiBkZWxldGUgJ0hlbGxvJywgYWRkICdHb29kYnllJyBhbmQga2VlcCAnIHdvcmxkLidcclxuICAgKi9cclxuXHJcbiAgLy8gRGVmaW5lIHNvbWUgcmVnZXggcGF0dGVybnMgZm9yIG1hdGNoaW5nIGJvdW5kYXJpZXMuXHJcbiAgd2hpdGVzcGFjZVJlZ2V4XyA9IG5ldyBSZWdFeHAoJy9cXHMvJyk7XHJcbiAgbGluZWJyZWFrUmVnZXhfID0gbmV3IFJlZ0V4cCgnL1tcXHJcXG5dLycpO1xyXG4gIGJsYW5rbGluZUVuZFJlZ2V4XyA9IG5ldyBSZWdFeHAoJy9cXG5cXHI/XFxuJC8nKTtcclxuICBibGFua2xpbmVTdGFydFJlZ2V4XyA9IG5ldyBSZWdFeHAoJy9eXFxyP1xcblxccj9cXG4vJyk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEZpbmQgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gdHdvIHRleHRzLiAgU2ltcGxpZmllcyB0aGUgcHJvYmxlbSBieSBzdHJpcHBpbmdcclxuICAgKiBhbnkgY29tbW9uIHByZWZpeCBvciBzdWZmaXggb2ZmIHRoZSB0ZXh0cyBiZWZvcmUgZGlmZmluZy5cclxuICAgKiBAcGFyYW0gIHRleHQxIE9sZCBzdHJpbmcgdG8gYmUgZGlmZmVkLlxyXG4gICAqIEBwYXJhbSAgdGV4dDIgTmV3IHN0cmluZyB0byBiZSBkaWZmZWQuXHJcbiAgICogQHBhcmFtICBvcHRfY2hlY2tsaW5lcyBPcHRpb25hbCBzcGVlZHVwIGZsYWcuIElmIHByZXNlbnQgYW5kIGZhbHNlLFxyXG4gICAqICAgICB0aGVuIGRvbid0IHJ1biBhIGxpbmUtbGV2ZWwgZGlmZiBmaXJzdCB0byBpZGVudGlmeSB0aGUgY2hhbmdlZCBhcmVhcy5cclxuICAgKiAgICAgRGVmYXVsdHMgdG8gdHJ1ZSwgd2hpY2ggZG9lcyBhIGZhc3Rlciwgc2xpZ2h0bHkgbGVzcyBvcHRpbWFsIGRpZmYuXHJcbiAgICogQHBhcmFtICBvcHRfZGVhZGxpbmUgT3B0aW9uYWwgdGltZSB3aGVuIHRoZSBkaWZmIHNob3VsZCBiZSBjb21wbGV0ZVxyXG4gICAqICAgICBieS4gIFVzZWQgaW50ZXJuYWxseSBmb3IgcmVjdXJzaXZlIGNhbGxzLiAgVXNlcnMgc2hvdWxkIHNldCBEaWZmVGltZW91dFxyXG4gICAqICAgICBpbnN0ZWFkLlxyXG4gICAqIEByZXR1cm4gIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxyXG4gICAqL1xyXG4gICAgZGlmZl9tYWluICh0ZXh0MTogc3RyaW5nLCB0ZXh0Mjogc3RyaW5nLCBvcHRfY2hlY2tsaW5lcz86IGJvb2xlYW4sIG9wdF9kZWFkbGluZT86IG51bWJlcik6IEFycmF5PERpZmY+IHtcclxuICAgICAgLy8gU2V0IGEgZGVhZGxpbmUgYnkgd2hpY2ggdGltZSB0aGUgZGlmZiBtdXN0IGJlIGNvbXBsZXRlLlxyXG4gICAgICBpZiAodHlwZW9mIG9wdF9kZWFkbGluZSA9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIGlmICh0aGlzLkRpZmZfVGltZW91dCA8PSAwKSB7XHJcbiAgICAgICAgICBvcHRfZGVhZGxpbmUgPSBOdW1iZXIuTUFYX1ZBTFVFO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBvcHRfZGVhZGxpbmUgPSAobmV3IERhdGUpLmdldFRpbWUoKSArIHRoaXMuRGlmZl9UaW1lb3V0ICogMTAwMDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgZGVhZGxpbmUgPSBvcHRfZGVhZGxpbmU7XHJcblxyXG4gICAgICAvLyBDaGVjayBmb3IgbnVsbCBpbnB1dHMuXHJcbiAgICAgIGlmICh0ZXh0MSA9PSBudWxsIHx8IHRleHQyID09IG51bGwpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ051bGwgaW5wdXQuIChkaWZmX21haW4pJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIENoZWNrIGZvciBlcXVhbGl0eSAoc3BlZWR1cCkuXHJcbiAgICAgIGlmICh0ZXh0MSA9PSB0ZXh0Mikge1xyXG4gICAgICAgIGlmICh0ZXh0MSkge1xyXG4gICAgICAgICAgcmV0dXJuIFtbRGlmZk9wLkVxdWFsLCB0ZXh0MV1dO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gW107XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0eXBlb2Ygb3B0X2NoZWNrbGluZXMgPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICBvcHRfY2hlY2tsaW5lcyA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgY2hlY2tsaW5lcyA9IG9wdF9jaGVja2xpbmVzO1xyXG5cclxuICAgICAgLy8gVHJpbSBvZmYgY29tbW9uIHByZWZpeCAoc3BlZWR1cCkuXHJcbiAgICAgIGxldCBjb21tb25sZW5ndGggPSB0aGlzLmRpZmZfY29tbW9uUHJlZml4KHRleHQxLCB0ZXh0Mik7XHJcbiAgICAgIGNvbnN0IGNvbW1vbnByZWZpeCA9IHRleHQxLnN1YnN0cmluZygwLCBjb21tb25sZW5ndGgpO1xyXG4gICAgICB0ZXh0MSA9IHRleHQxLnN1YnN0cmluZyhjb21tb25sZW5ndGgpO1xyXG4gICAgICB0ZXh0MiA9IHRleHQyLnN1YnN0cmluZyhjb21tb25sZW5ndGgpO1xyXG5cclxuICAgICAgLy8gVHJpbSBvZmYgY29tbW9uIHN1ZmZpeCAoc3BlZWR1cCkuXHJcbiAgICAgIGNvbW1vbmxlbmd0aCA9IHRoaXMuZGlmZl9jb21tb25TdWZmaXgodGV4dDEsIHRleHQyKTtcclxuICAgICAgY29uc3QgY29tbW9uc3VmZml4ID0gdGV4dDEuc3Vic3RyaW5nKHRleHQxLmxlbmd0aCAtIGNvbW1vbmxlbmd0aCk7XHJcbiAgICAgIHRleHQxID0gdGV4dDEuc3Vic3RyaW5nKDAsIHRleHQxLmxlbmd0aCAtIGNvbW1vbmxlbmd0aCk7XHJcbiAgICAgIHRleHQyID0gdGV4dDIuc3Vic3RyaW5nKDAsIHRleHQyLmxlbmd0aCAtIGNvbW1vbmxlbmd0aCk7XHJcblxyXG4gICAgICAvLyBDb21wdXRlIHRoZSBkaWZmIG9uIHRoZSBtaWRkbGUgYmxvY2suXHJcbiAgICAgIGNvbnN0IGRpZmZzID0gdGhpcy5kaWZmX2NvbXB1dGVfKHRleHQxLCB0ZXh0MiwgY2hlY2tsaW5lcywgZGVhZGxpbmUpO1xyXG5cclxuICAgICAgLy8gUmVzdG9yZSB0aGUgcHJlZml4IGFuZCBzdWZmaXguXHJcbiAgICAgIGlmIChjb21tb25wcmVmaXgpIHtcclxuICAgICAgICBkaWZmcy51bnNoaWZ0KFtEaWZmT3AuRXF1YWwsIGNvbW1vbnByZWZpeF0pO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChjb21tb25zdWZmaXgpIHtcclxuICAgICAgICBkaWZmcy5wdXNoKFtEaWZmT3AuRXF1YWwsIGNvbW1vbnN1ZmZpeF0pO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuZGlmZl9jbGVhbnVwTWVyZ2UoZGlmZnMpO1xyXG4gICAgICByZXR1cm4gZGlmZnM7XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEZpbmQgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gdHdvIHRleHRzLiAgQXNzdW1lcyB0aGF0IHRoZSB0ZXh0cyBkbyBub3RcclxuICAgKiBoYXZlIGFueSBjb21tb24gcHJlZml4IG9yIHN1ZmZpeC5cclxuICAgKiBAcGFyYW0gIHRleHQxIE9sZCBzdHJpbmcgdG8gYmUgZGlmZmVkLlxyXG4gICAqIEBwYXJhbSAgdGV4dDIgTmV3IHN0cmluZyB0byBiZSBkaWZmZWQuXHJcbiAgICogQHBhcmFtICBjaGVja2xpbmVzIFNwZWVkdXAgZmxhZy4gIElmIGZhbHNlLCB0aGVuIGRvbid0IHJ1biBhXHJcbiAgICogICAgIGxpbmUtbGV2ZWwgZGlmZiBmaXJzdCB0byBpZGVudGlmeSB0aGUgY2hhbmdlZCBhcmVhcy5cclxuICAgKiAgICAgSWYgdHJ1ZSwgdGhlbiBydW4gYSBmYXN0ZXIsIHNsaWdodGx5IGxlc3Mgb3B0aW1hbCBkaWZmLlxyXG4gICAqIEBwYXJhbSAgZGVhZGxpbmUgVGltZSB3aGVuIHRoZSBkaWZmIHNob3VsZCBiZSBjb21wbGV0ZSBieS5cclxuICAgKiBAcmV0dXJuICBBcnJheSBvZiBkaWZmIHR1cGxlcy5cclxuXHJcbiAgICovXHJcbiAgICBkaWZmX2NvbXB1dGVfICh0ZXh0MTogc3RyaW5nLCB0ZXh0Mjogc3RyaW5nLCBjaGVja2xpbmVzOiBib29sZWFuLFxyXG4gICAgICBkZWFkbGluZTogbnVtYmVyKTogQXJyYXk8RGlmZj4ge1xyXG4gICAgbGV0IGRpZmZzOiBBcnJheTxEaWZmPjtcclxuXHJcbiAgICBpZiAoIXRleHQxKSB7XHJcbiAgICAgIC8vIEp1c3QgYWRkIHNvbWUgdGV4dCAoc3BlZWR1cCkuXHJcbiAgICAgIHJldHVybiBbW0RpZmZPcC5JbnNlcnQsIHRleHQyXV07XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCF0ZXh0Mikge1xyXG4gICAgICAvLyBKdXN0IGRlbGV0ZSBzb21lIHRleHQgKHNwZWVkdXApLlxyXG4gICAgICByZXR1cm4gW1tEaWZmT3AuRGVsZXRlLCB0ZXh0MV1dO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGxvbmd0ZXh0ID0gdGV4dDEubGVuZ3RoID4gdGV4dDIubGVuZ3RoID8gdGV4dDEgOiB0ZXh0MjtcclxuICAgIGNvbnN0IHNob3J0dGV4dCA9IHRleHQxLmxlbmd0aCA+IHRleHQyLmxlbmd0aCA/IHRleHQyIDogdGV4dDE7XHJcbiAgICBjb25zdCBpID0gbG9uZ3RleHQuaW5kZXhPZihzaG9ydHRleHQpO1xyXG4gICAgaWYgKGkgIT0gLTEpIHtcclxuICAgICAgLy8gU2hvcnRlciB0ZXh0IGlzIGluc2lkZSB0aGUgbG9uZ2VyIHRleHQgKHNwZWVkdXApLlxyXG4gICAgICBkaWZmcyA9IFtbRGlmZk9wLkluc2VydCwgbG9uZ3RleHQuc3Vic3RyaW5nKDAsIGkpXSxcclxuICAgICAgICAgICAgICBbRGlmZk9wLkVxdWFsLCBzaG9ydHRleHRdLFxyXG4gICAgICAgICAgICAgIFtEaWZmT3AuSW5zZXJ0LCBsb25ndGV4dC5zdWJzdHJpbmcoaSArIHNob3J0dGV4dC5sZW5ndGgpXV07XHJcbiAgICAgIC8vIFN3YXAgaW5zZXJ0aW9ucyBmb3IgZGVsZXRpb25zIGlmIGRpZmYgaXMgcmV2ZXJzZWQuXHJcbiAgICAgIGlmICh0ZXh0MS5sZW5ndGggPiB0ZXh0Mi5sZW5ndGgpIHtcclxuICAgICAgICBkaWZmc1swXVswXSA9IGRpZmZzWzJdWzBdID0gRGlmZk9wLkRlbGV0ZTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZGlmZnM7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHNob3J0dGV4dC5sZW5ndGggPT0gMSkge1xyXG4gICAgICAvLyBTaW5nbGUgY2hhcmFjdGVyIHN0cmluZy5cclxuICAgICAgLy8gQWZ0ZXIgdGhlIHByZXZpb3VzIHNwZWVkdXAsIHRoZSBjaGFyYWN0ZXIgY2FuJ3QgYmUgYW4gZXF1YWxpdHkuXHJcbiAgICAgIHJldHVybiBbW0RpZmZPcC5EZWxldGUsIHRleHQxXSwgW0RpZmZPcC5JbnNlcnQsIHRleHQyXV07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZSBwcm9ibGVtIGNhbiBiZSBzcGxpdCBpbiB0d28uXHJcbiAgICBjb25zdCBobSA9IHRoaXMuZGlmZl9oYWxmTWF0Y2hfKHRleHQxLCB0ZXh0Mik7XHJcbiAgICBpZiAoaG0pIHtcclxuICAgICAgLy8gQSBoYWxmLW1hdGNoIHdhcyBmb3VuZCwgc29ydCBvdXQgdGhlIHJldHVybiBkYXRhLlxyXG4gICAgICBjb25zdCB0ZXh0MV9hID0gaG1bMF07XHJcbiAgICAgIGNvbnN0IHRleHQxX2IgPSBobVsxXTtcclxuICAgICAgY29uc3QgdGV4dDJfYSA9IGhtWzJdO1xyXG4gICAgICBjb25zdCB0ZXh0Ml9iID0gaG1bM107XHJcbiAgICAgIGNvbnN0IG1pZF9jb21tb24gPSBobVs0XTtcclxuICAgICAgLy8gU2VuZCBib3RoIHBhaXJzIG9mZiBmb3Igc2VwYXJhdGUgcHJvY2Vzc2luZy5cclxuICAgICAgY29uc3QgZGlmZnNfYSA9IHRoaXMuZGlmZl9tYWluKHRleHQxX2EsIHRleHQyX2EsIGNoZWNrbGluZXMsIGRlYWRsaW5lKTtcclxuICAgICAgY29uc3QgZGlmZnNfYiA9IHRoaXMuZGlmZl9tYWluKHRleHQxX2IsIHRleHQyX2IsIGNoZWNrbGluZXMsIGRlYWRsaW5lKTtcclxuICAgICAgLy8gTWVyZ2UgdGhlIHJlc3VsdHMuXHJcbiAgICAgIHJldHVybiBkaWZmc19hLmNvbmNhdChbW0RpZmZPcC5FcXVhbCwgbWlkX2NvbW1vbl1dLCBkaWZmc19iKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoY2hlY2tsaW5lcyAmJiB0ZXh0MS5sZW5ndGggPiAxMDAgJiYgdGV4dDIubGVuZ3RoID4gMTAwKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmRpZmZfbGluZU1vZGVfKHRleHQxLCB0ZXh0MiwgZGVhZGxpbmUpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzLmRpZmZfYmlzZWN0Xyh0ZXh0MSwgdGV4dDIsIGRlYWRsaW5lKTtcclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogRG8gYSBxdWljayBsaW5lLWxldmVsIGRpZmYgb24gYm90aCBzdHJpbmdzLCB0aGVuIHJlZGlmZiB0aGUgcGFydHMgZm9yXHJcbiAgICogZ3JlYXRlciBhY2N1cmFjeS5cclxuICAgKiBUaGlzIHNwZWVkdXAgY2FuIHByb2R1Y2Ugbm9uLW1pbmltYWwgZGlmZnMuXHJcbiAgICogQHBhcmFtICB0ZXh0MSBPbGQgc3RyaW5nIHRvIGJlIGRpZmZlZC5cclxuICAgKiBAcGFyYW0gIHRleHQyIE5ldyBzdHJpbmcgdG8gYmUgZGlmZmVkLlxyXG4gICAqIEBwYXJhbSAgZGVhZGxpbmUgVGltZSB3aGVuIHRoZSBkaWZmIHNob3VsZCBiZSBjb21wbGV0ZSBieS5cclxuICAgKiBAcmV0dXJuICBBcnJheSBvZiBkaWZmIHR1cGxlcy5cclxuXHJcbiAgICovXHJcbiAgICBkaWZmX2xpbmVNb2RlXyAodGV4dDE6IHN0cmluZywgdGV4dDI6IHN0cmluZywgZGVhZGxpbmU6IG51bWJlcikge1xyXG4gICAgLy8gU2NhbiB0aGUgdGV4dCBvbiBhIGxpbmUtYnktbGluZSBiYXNpcyBmaXJzdC5cclxuICAgIGNvbnN0IGEgPSB0aGlzLmRpZmZfbGluZXNUb0NoYXJzXyh0ZXh0MSwgdGV4dDIpO1xyXG4gICAgdGV4dDEgPSBhLmNoYXJzMTtcclxuICAgIHRleHQyID0gYS5jaGFyczI7XHJcbiAgICBjb25zdCBsaW5lYXJyYXkgPSBhLmxpbmVBcnJheTtcclxuXHJcbiAgICBjb25zdCBkaWZmcyA9IHRoaXMuZGlmZl9tYWluKHRleHQxLCB0ZXh0MiwgZmFsc2UsIGRlYWRsaW5lKTtcclxuXHJcbiAgICAvLyBDb252ZXJ0IHRoZSBkaWZmIGJhY2sgdG8gb3JpZ2luYWwgdGV4dC5cclxuICAgIHRoaXMuZGlmZl9jaGFyc1RvTGluZXNfKGRpZmZzLCBsaW5lYXJyYXkpO1xyXG4gICAgLy8gRWxpbWluYXRlIGZyZWFrIG1hdGNoZXMgKGUuZy4gYmxhbmsgbGluZXMpXHJcbiAgICB0aGlzLmRpZmZfY2xlYW51cFNlbWFudGljKGRpZmZzKTtcclxuXHJcbiAgICAvLyBSZWRpZmYgYW55IHJlcGxhY2VtZW50IGJsb2NrcywgdGhpcyB0aW1lIGNoYXJhY3Rlci1ieS1jaGFyYWN0ZXIuXHJcbiAgICAvLyBBZGQgYSBkdW1teSBlbnRyeSBhdCB0aGUgZW5kLlxyXG4gICAgZGlmZnMucHVzaChbRGlmZk9wLkVxdWFsLCAnJ10pO1xyXG4gICAgbGV0IHBvaW50ZXIgPSAwO1xyXG4gICAgbGV0IGNvdW50X2RlbGV0ZSA9IDA7XHJcbiAgICBsZXQgY291bnRfaW5zZXJ0ID0gMDtcclxuICAgIGxldCB0ZXh0X2RlbGV0ZSA9ICcnO1xyXG4gICAgbGV0IHRleHRfaW5zZXJ0ID0gJyc7XHJcbiAgICB3aGlsZSAocG9pbnRlciA8IGRpZmZzLmxlbmd0aCkge1xyXG4gICAgICBzd2l0Y2ggKGRpZmZzW3BvaW50ZXJdWzBdKSB7XHJcbiAgICAgICAgY2FzZSBEaWZmT3AuSW5zZXJ0OlxyXG4gICAgICAgICAgY291bnRfaW5zZXJ0Kys7XHJcbiAgICAgICAgICB0ZXh0X2luc2VydCArPSBkaWZmc1twb2ludGVyXVsxXTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgRGlmZk9wLkRlbGV0ZTpcclxuICAgICAgICAgIGNvdW50X2RlbGV0ZSsrO1xyXG4gICAgICAgICAgdGV4dF9kZWxldGUgKz0gZGlmZnNbcG9pbnRlcl1bMV07XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIERpZmZPcC5FcXVhbDpcclxuICAgICAgICAgIC8vIFVwb24gcmVhY2hpbmcgYW4gZXF1YWxpdHksIGNoZWNrIGZvciBwcmlvciByZWR1bmRhbmNpZXMuXHJcbiAgICAgICAgICBpZiAoY291bnRfZGVsZXRlID49IDEgJiYgY291bnRfaW5zZXJ0ID49IDEpIHtcclxuICAgICAgICAgICAgLy8gRGVsZXRlIHRoZSBvZmZlbmRpbmcgcmVjb3JkcyBhbmQgYWRkIHRoZSBtZXJnZWQgb25lcy5cclxuICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIgLSBjb3VudF9kZWxldGUgLSBjb3VudF9pbnNlcnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50X2RlbGV0ZSArIGNvdW50X2luc2VydCk7XHJcbiAgICAgICAgICAgIHBvaW50ZXIgPSBwb2ludGVyIC0gY291bnRfZGVsZXRlIC0gY291bnRfaW5zZXJ0O1xyXG4gICAgICAgICAgICBjb25zdCBiID0gdGhpcy5kaWZmX21haW4odGV4dF9kZWxldGUsIHRleHRfaW5zZXJ0LCBmYWxzZSwgZGVhZGxpbmUpO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBqID0gYi5sZW5ndGggLSAxOyBqID49IDA7IGotLSkge1xyXG4gICAgICAgICAgICAgIGRpZmZzLnNwbGljZShwb2ludGVyLCAwLCBiW2pdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBwb2ludGVyID0gcG9pbnRlciArIGIubGVuZ3RoO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY291bnRfaW5zZXJ0ID0gMDtcclxuICAgICAgICAgIGNvdW50X2RlbGV0ZSA9IDA7XHJcbiAgICAgICAgICB0ZXh0X2RlbGV0ZSA9ICcnO1xyXG4gICAgICAgICAgdGV4dF9pbnNlcnQgPSAnJztcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICAgIHBvaW50ZXIrKztcclxuICAgIH1cclxuICAgIGRpZmZzLnBvcCgpOyAgLy8gUmVtb3ZlIHRoZSBkdW1teSBlbnRyeSBhdCB0aGUgZW5kLlxyXG5cclxuICAgIHJldHVybiBkaWZmcztcclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogRmluZCB0aGUgJ21pZGRsZSBzbmFrZScgb2YgYSBkaWZmLCBzcGxpdCB0aGUgcHJvYmxlbSBpbiB0d29cclxuICAgKiBhbmQgcmV0dXJuIHRoZSByZWN1cnNpdmVseSBjb25zdHJ1Y3RlZCBkaWZmLlxyXG4gICAqIFNlZSBNeWVycyAxOTg2IHBhcGVyOiBBbiBPKE5EKSBEaWZmZXJlbmNlIEFsZ29yaXRobSBhbmQgSXRzIGNvbnN0aWF0aW9ucy5cclxuICAgKiBAcGFyYW0gIHRleHQxIE9sZCBzdHJpbmcgdG8gYmUgZGlmZmVkLlxyXG4gICAqIEBwYXJhbSAgdGV4dDIgTmV3IHN0cmluZyB0byBiZSBkaWZmZWQuXHJcbiAgICogQHBhcmFtICBkZWFkbGluZSBUaW1lIGF0IHdoaWNoIHRvIGJhaWwgaWYgbm90IHlldCBjb21wbGV0ZS5cclxuICAgKiBAcmV0dXJuICBBcnJheSBvZiBkaWZmIHR1cGxlcy5cclxuXHJcbiAgICovXHJcbiAgICBkaWZmX2Jpc2VjdF8gKHRleHQxOiBzdHJpbmcsIHRleHQyOiBzdHJpbmcsIGRlYWRsaW5lOiBudW1iZXIpOiBBcnJheTxEaWZmPiB7XHJcbiAgICAvLyBDYWNoZSB0aGUgdGV4dCBsZW5ndGhzIHRvIHByZXZlbnQgbXVsdGlwbGUgY2FsbHMuXHJcbiAgICBjb25zdCB0ZXh0MV9sZW5ndGggPSB0ZXh0MS5sZW5ndGg7XHJcbiAgICBjb25zdCB0ZXh0Ml9sZW5ndGggPSB0ZXh0Mi5sZW5ndGg7XHJcbiAgICBjb25zdCBtYXhfZCA9IE1hdGguY2VpbCgodGV4dDFfbGVuZ3RoICsgdGV4dDJfbGVuZ3RoKSAvIDIpO1xyXG4gICAgY29uc3Qgdl9vZmZzZXQgPSBtYXhfZDtcclxuICAgIGNvbnN0IHZfbGVuZ3RoID0gMiAqIG1heF9kO1xyXG4gICAgY29uc3QgdjEgPSBuZXcgQXJyYXkodl9sZW5ndGgpO1xyXG4gICAgY29uc3QgdjIgPSBuZXcgQXJyYXkodl9sZW5ndGgpO1xyXG4gICAgLy8gU2V0dGluZyBhbGwgZWxlbWVudHMgdG8gLTEgaXMgZmFzdGVyIGluIENocm9tZSAmIEZpcmVmb3ggdGhhbiBtaXhpbmdcclxuICAgIC8vIGludGVnZXJzIGFuZCB1bmRlZmluZWQuXHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHZfbGVuZ3RoOyB4KyspIHtcclxuICAgICAgdjFbeF0gPSAtMTtcclxuICAgICAgdjJbeF0gPSAtMTtcclxuICAgIH1cclxuICAgIHYxW3Zfb2Zmc2V0ICsgMV0gPSAwO1xyXG4gICAgdjJbdl9vZmZzZXQgKyAxXSA9IDA7XHJcbiAgICBjb25zdCBkZWx0YSA9IHRleHQxX2xlbmd0aCAtIHRleHQyX2xlbmd0aDtcclxuICAgIC8vIElmIHRoZSB0b3RhbCBudW1iZXIgb2YgY2hhcmFjdGVycyBpcyBvZGQsIHRoZW4gdGhlIGZyb250IHBhdGggd2lsbCBjb2xsaWRlXHJcbiAgICAvLyB3aXRoIHRoZSByZXZlcnNlIHBhdGguXHJcbiAgICBjb25zdCBmcm9udCA9IChkZWx0YSAlIDIgIT0gMCk7XHJcbiAgICAvLyBPZmZzZXRzIGZvciBzdGFydCBhbmQgZW5kIG9mIGsgbG9vcC5cclxuICAgIC8vIFByZXZlbnRzIG1hcHBpbmcgb2Ygc3BhY2UgYmV5b25kIHRoZSBncmlkLlxyXG4gICAgbGV0IGsxc3RhcnQgPSAwO1xyXG4gICAgbGV0IGsxZW5kID0gMDtcclxuICAgIGxldCBrMnN0YXJ0ID0gMDtcclxuICAgIGxldCBrMmVuZCA9IDA7XHJcbiAgICBmb3IgKGxldCBkID0gMDsgZCA8IG1heF9kOyBkKyspIHtcclxuICAgICAgLy8gQmFpbCBvdXQgaWYgZGVhZGxpbmUgaXMgcmVhY2hlZC5cclxuICAgICAgaWYgKChuZXcgRGF0ZSgpKS5nZXRUaW1lKCkgPiBkZWFkbGluZSkge1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBXYWxrIHRoZSBmcm9udCBwYXRoIG9uZSBzdGVwLlxyXG4gICAgICBmb3IgKGxldCBrMSA9IC1kICsgazFzdGFydDsgazEgPD0gZCAtIGsxZW5kOyBrMSArPSAyKSB7XHJcbiAgICAgICAgY29uc3QgazFfb2Zmc2V0ID0gdl9vZmZzZXQgKyBrMTtcclxuICAgICAgICBsZXQgeDE7XHJcbiAgICAgICAgaWYgKGsxID09IC1kIHx8IChrMSAhPSBkICYmIHYxW2sxX29mZnNldCAtIDFdIDwgdjFbazFfb2Zmc2V0ICsgMV0pKSB7XHJcbiAgICAgICAgICB4MSA9IHYxW2sxX29mZnNldCArIDFdO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB4MSA9IHYxW2sxX29mZnNldCAtIDFdICsgMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IHkxID0geDEgLSBrMTtcclxuICAgICAgICB3aGlsZSAoeDEgPCB0ZXh0MV9sZW5ndGggJiYgeTEgPCB0ZXh0Ml9sZW5ndGggJiZcclxuICAgICAgICAgICAgICB0ZXh0MS5jaGFyQXQoeDEpID09IHRleHQyLmNoYXJBdCh5MSkpIHtcclxuICAgICAgICAgIHgxKys7XHJcbiAgICAgICAgICB5MSsrO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2MVtrMV9vZmZzZXRdID0geDE7XHJcbiAgICAgICAgaWYgKHgxID4gdGV4dDFfbGVuZ3RoKSB7XHJcbiAgICAgICAgICAvLyBSYW4gb2ZmIHRoZSByaWdodCBvZiB0aGUgZ3JhcGguXHJcbiAgICAgICAgICBrMWVuZCArPSAyO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoeTEgPiB0ZXh0Ml9sZW5ndGgpIHtcclxuICAgICAgICAgIC8vIFJhbiBvZmYgdGhlIGJvdHRvbSBvZiB0aGUgZ3JhcGguXHJcbiAgICAgICAgICBrMXN0YXJ0ICs9IDI7XHJcbiAgICAgICAgfSBlbHNlIGlmIChmcm9udCkge1xyXG4gICAgICAgICAgY29uc3QgazJfb2Zmc2V0ID0gdl9vZmZzZXQgKyBkZWx0YSAtIGsxO1xyXG4gICAgICAgICAgaWYgKGsyX29mZnNldCA+PSAwICYmIGsyX29mZnNldCA8IHZfbGVuZ3RoICYmIHYyW2syX29mZnNldF0gIT0gLTEpIHtcclxuICAgICAgICAgICAgLy8gTWlycm9yIHgyIG9udG8gdG9wLWxlZnQgY29vcmRpbmF0ZSBzeXN0ZW0uXHJcbiAgICAgICAgICAgIGNvbnN0IHgyID0gdGV4dDFfbGVuZ3RoIC0gdjJbazJfb2Zmc2V0XTtcclxuICAgICAgICAgICAgaWYgKHgxID49IHgyKSB7XHJcbiAgICAgICAgICAgICAgLy8gT3ZlcmxhcCBkZXRlY3RlZC5cclxuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kaWZmX2Jpc2VjdFNwbGl0Xyh0ZXh0MSwgdGV4dDIsIHgxLCB5MSwgZGVhZGxpbmUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBXYWxrIHRoZSByZXZlcnNlIHBhdGggb25lIHN0ZXAuXHJcbiAgICAgIGZvciAobGV0IGsyID0gLWQgKyBrMnN0YXJ0OyBrMiA8PSBkIC0gazJlbmQ7IGsyICs9IDIpIHtcclxuICAgICAgICBjb25zdCBrMl9vZmZzZXQgPSB2X29mZnNldCArIGsyO1xyXG4gICAgICAgIGxldCB4MjogbnVtYmVyO1xyXG4gICAgICAgIGlmIChrMiA9PSAtZCB8fCAoazIgIT0gZCAmJiB2MltrMl9vZmZzZXQgLSAxXSA8IHYyW2syX29mZnNldCArIDFdKSkge1xyXG4gICAgICAgICAgeDIgPSB2MltrMl9vZmZzZXQgKyAxXTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgeDIgPSB2MltrMl9vZmZzZXQgLSAxXSArIDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCB5MiA9IHgyIC0gazI7XHJcbiAgICAgICAgd2hpbGUgKHgyIDwgdGV4dDFfbGVuZ3RoICYmIHkyIDwgdGV4dDJfbGVuZ3RoICYmXHJcbiAgICAgICAgICAgICAgdGV4dDEuY2hhckF0KHRleHQxX2xlbmd0aCAtIHgyIC0gMSkgPT1cclxuICAgICAgICAgICAgICB0ZXh0Mi5jaGFyQXQodGV4dDJfbGVuZ3RoIC0geTIgLSAxKSkge1xyXG4gICAgICAgICAgeDIrKztcclxuICAgICAgICAgIHkyKys7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHYyW2syX29mZnNldF0gPSB4MjtcclxuICAgICAgICBpZiAoeDIgPiB0ZXh0MV9sZW5ndGgpIHtcclxuICAgICAgICAgIC8vIFJhbiBvZmYgdGhlIGxlZnQgb2YgdGhlIGdyYXBoLlxyXG4gICAgICAgICAgazJlbmQgKz0gMjtcclxuICAgICAgICB9IGVsc2UgaWYgKHkyID4gdGV4dDJfbGVuZ3RoKSB7XHJcbiAgICAgICAgICAvLyBSYW4gb2ZmIHRoZSB0b3Agb2YgdGhlIGdyYXBoLlxyXG4gICAgICAgICAgazJzdGFydCArPSAyO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoIWZyb250KSB7XHJcbiAgICAgICAgICBjb25zdCBrMV9vZmZzZXQgPSB2X29mZnNldCArIGRlbHRhIC0gazI7XHJcbiAgICAgICAgICBpZiAoazFfb2Zmc2V0ID49IDAgJiYgazFfb2Zmc2V0IDwgdl9sZW5ndGggJiYgdjFbazFfb2Zmc2V0XSAhPSAtMSkge1xyXG4gICAgICAgICAgICBjb25zdCB4MSA9IHYxW2sxX29mZnNldF07XHJcbiAgICAgICAgICAgIGNvbnN0IHkxID0gdl9vZmZzZXQgKyB4MSAtIGsxX29mZnNldDtcclxuICAgICAgICAgICAgLy8gTWlycm9yIHgyIG9udG8gdG9wLWxlZnQgY29vcmRpbmF0ZSBzeXN0ZW0uXHJcbiAgICAgICAgICAgIHgyID0gdGV4dDFfbGVuZ3RoIC0geDI7XHJcbiAgICAgICAgICAgIGlmICh4MSA+PSB4Mikge1xyXG4gICAgICAgICAgICAgIC8vIE92ZXJsYXAgZGV0ZWN0ZWQuXHJcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGlmZl9iaXNlY3RTcGxpdF8odGV4dDEsIHRleHQyLCB4MSwgeTEsIGRlYWRsaW5lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gRGlmZiB0b29rIHRvbyBsb25nIGFuZCBoaXQgdGhlIGRlYWRsaW5lIG9yXHJcbiAgICAvLyBudW1iZXIgb2YgZGlmZnMgZXF1YWxzIG51bWJlciBvZiBjaGFyYWN0ZXJzLCBubyBjb21tb25hbGl0eSBhdCBhbGwuXHJcbiAgICByZXR1cm4gW1tEaWZmT3AuRGVsZXRlLCB0ZXh0MV0sIFtEaWZmT3AuSW5zZXJ0LCB0ZXh0Ml1dO1xyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBHaXZlbiB0aGUgbG9jYXRpb24gb2YgdGhlICdtaWRkbGUgc25ha2UnLCBzcGxpdCB0aGUgZGlmZiBpbiB0d28gcGFydHNcclxuICAgKiBhbmQgcmVjdXJzZS5cclxuICAgKiBAcGFyYW0gIHRleHQxIE9sZCBzdHJpbmcgdG8gYmUgZGlmZmVkLlxyXG4gICAqIEBwYXJhbSAgdGV4dDIgTmV3IHN0cmluZyB0byBiZSBkaWZmZWQuXHJcbiAgICogQHBhcmFtICB4IEluZGV4IG9mIHNwbGl0IHBvaW50IGluIHRleHQxLlxyXG4gICAqIEBwYXJhbSAgeSBJbmRleCBvZiBzcGxpdCBwb2ludCBpbiB0ZXh0Mi5cclxuICAgKiBAcGFyYW0gIGRlYWRsaW5lIFRpbWUgYXQgd2hpY2ggdG8gYmFpbCBpZiBub3QgeWV0IGNvbXBsZXRlLlxyXG4gICAqIEByZXR1cm4gIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxyXG5cclxuICAgKi9cclxuICAgIGRpZmZfYmlzZWN0U3BsaXRfICh0ZXh0MTogc3RyaW5nLCB0ZXh0Mjogc3RyaW5nLCB4OiBudW1iZXIsIHk6IG51bWJlciwgZGVhZGxpbmU6IG51bWJlcikge1xyXG4gICAgICBjb25zdCB0ZXh0MWEgPSB0ZXh0MS5zdWJzdHJpbmcoMCwgeCk7XHJcbiAgICAgIGNvbnN0IHRleHQyYSA9IHRleHQyLnN1YnN0cmluZygwLCB5KTtcclxuICAgICAgY29uc3QgdGV4dDFiID0gdGV4dDEuc3Vic3RyaW5nKHgpO1xyXG4gICAgICBjb25zdCB0ZXh0MmIgPSB0ZXh0Mi5zdWJzdHJpbmcoeSk7XHJcblxyXG4gICAgICAvLyBDb21wdXRlIGJvdGggZGlmZnMgc2VyaWFsbHkuXHJcbiAgICAgIGNvbnN0IGRpZmZzID0gdGhpcy5kaWZmX21haW4odGV4dDFhLCB0ZXh0MmEsIGZhbHNlLCBkZWFkbGluZSk7XHJcbiAgICAgIGNvbnN0IGRpZmZzYiA9IHRoaXMuZGlmZl9tYWluKHRleHQxYiwgdGV4dDJiLCBmYWxzZSwgZGVhZGxpbmUpO1xyXG5cclxuICAgICAgcmV0dXJuIGRpZmZzLmNvbmNhdChkaWZmc2IpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIFNwbGl0IHR3byB0ZXh0cyBpbnRvIGFuIGFycmF5IG9mIHN0cmluZ3MuICBSZWR1Y2UgdGhlIHRleHRzIHRvIGEgc3RyaW5nIG9mXHJcbiAgICogaGFzaGVzIHdoZXJlIGVhY2ggVW5pY29kZSBjaGFyYWN0ZXIgcmVwcmVzZW50cyBvbmUgbGluZS5cclxuICAgKiBAcGFyYW0gIHRleHQxIEZpcnN0IHN0cmluZy5cclxuICAgKiBAcGFyYW0gIHRleHQyIFNlY29uZCBzdHJpbmcuXHJcbiAgICogQHJldHVybiB9XHJcbiAgICogICAgIEFuIG9iamVjdCBjb250YWluaW5nIHRoZSBlbmNvZGVkIHRleHQxLCB0aGUgZW5jb2RlZCB0ZXh0MiBhbmRcclxuICAgKiAgICAgdGhlIGFycmF5IG9mIHVuaXF1ZSBzdHJpbmdzLlxyXG4gICAqICAgICBUaGUgemVyb3RoIGVsZW1lbnQgb2YgdGhlIGFycmF5IG9mIHVuaXF1ZSBzdHJpbmdzIGlzIGludGVudGlvbmFsbHkgYmxhbmsuXHJcblxyXG4gICAqL1xyXG4gICAgZGlmZl9saW5lc1RvQ2hhcnNfICh0ZXh0MTogc3RyaW5nLCB0ZXh0Mjogc3RyaW5nKSB7XHJcbiAgICAgIGNvbnN0IGxpbmVBcnJheSA9IFtdOyAgLy8gZS5nLiBsaW5lQXJyYXlbNF0gPT0gJ0hlbGxvXFxuJ1xyXG4gICAgICBjb25zdCBsaW5lSGFzaCA9IHt9OyAgIC8vIGUuZy4gbGluZUhhc2hbJ0hlbGxvXFxuJ10gPT0gNFxyXG5cclxuICAgICAgLy8gJ1xceDAwJyBpcyBhIHZhbGlkIGNoYXJhY3RlciwgYnV0IGNvbnN0aW91cyBkZWJ1Z2dlcnMgZG9uJ3QgbGlrZSBpdC5cclxuICAgICAgLy8gU28gd2UnbGwgaW5zZXJ0IGEganVuayBlbnRyeSB0byBhdm9pZCBnZW5lcmF0aW5nIGEgbnVsbCBjaGFyYWN0ZXIuXHJcbiAgICAgIGxpbmVBcnJheVswXSA9ICcnO1xyXG5cclxuXHJcbiAgICAgIGNvbnN0IGNoYXJzMSA9IHRoaXMuZGlmZl9saW5lc1RvQ2hhcnNNdW5nZV8odGV4dDEsIGxpbmVBcnJheSwgbGluZUhhc2gpO1xyXG4gICAgICBjb25zdCBjaGFyczIgPSB0aGlzLmRpZmZfbGluZXNUb0NoYXJzTXVuZ2VfKHRleHQyLCBsaW5lQXJyYXksIGxpbmVIYXNoKTtcclxuICAgICAgcmV0dXJuIHtjaGFyczE6IGNoYXJzMSwgY2hhcnMyOiBjaGFyczIsIGxpbmVBcnJheTogbGluZUFycmF5fTtcclxuICAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogU3BsaXQgYSB0ZXh0IGludG8gYW4gYXJyYXkgb2Ygc3RyaW5ncy4gIFJlZHVjZSB0aGUgdGV4dHMgdG8gYSBzdHJpbmcgb2ZcclxuICAgKiBoYXNoZXMgd2hlcmUgZWFjaCBVbmljb2RlIGNoYXJhY3RlciByZXByZXNlbnRzIG9uZSBsaW5lLlxyXG4gICAqIE1vZGlmaWVzIGxpbmVhcnJheSBhbmQgbGluZWhhc2ggdGhyb3VnaCBiZWluZyBhIGNsb3N1cmUuXHJcbiAgICogQHBhcmFtICB0ZXh0IFN0cmluZyB0byBlbmNvZGUuXHJcbiAgICogQHJldHVybiAgRW5jb2RlZCBzdHJpbmcuXHJcblxyXG4gICAqL1xyXG4gIGRpZmZfbGluZXNUb0NoYXJzTXVuZ2VfKHRleHQ6IHN0cmluZywgbGluZUFycmF5OiBBcnJheTxzdHJpbmc+LCBsaW5lSGFzaDogYW55KTogc3RyaW5nIHtcclxuICAgIGxldCBjaGFycyA9ICcnO1xyXG4gICAgLy8gV2FsayB0aGUgdGV4dCwgcHVsbGluZyBvdXQgYSBzdWJzdHJpbmcgZm9yIGVhY2ggbGluZS5cclxuICAgIC8vIHRleHQuc3BsaXQoJ1xcbicpIHdvdWxkIHdvdWxkIHRlbXBvcmFyaWx5IGRvdWJsZSBvdXIgbWVtb3J5IGZvb3RwcmludC5cclxuICAgIC8vIE1vZGlmeWluZyB0ZXh0IHdvdWxkIGNyZWF0ZSBtYW55IGxhcmdlIHN0cmluZ3MgdG8gZ2FyYmFnZSBjb2xsZWN0LlxyXG4gICAgbGV0IGxpbmVTdGFydCA9IDA7XHJcbiAgICBsZXQgbGluZUVuZCA9IC0xO1xyXG4gICAgLy8gS2VlcGluZyBvdXIgb3duIGxlbmd0aCBjb25zdGlhYmxlIGlzIGZhc3RlciB0aGFuIGxvb2tpbmcgaXQgdXAuXHJcbiAgICBsZXQgbGluZUFycmF5TGVuZ3RoID0gbGluZUFycmF5Lmxlbmd0aDtcclxuICAgIHdoaWxlIChsaW5lRW5kIDwgdGV4dC5sZW5ndGggLSAxKSB7XHJcbiAgICAgIGxpbmVFbmQgPSB0ZXh0LmluZGV4T2YoJ1xcbicsIGxpbmVTdGFydCk7XHJcbiAgICAgIGlmIChsaW5lRW5kID09IC0xKSB7XHJcbiAgICAgICAgbGluZUVuZCA9IHRleHQubGVuZ3RoIC0gMTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBsaW5lID0gdGV4dC5zdWJzdHJpbmcobGluZVN0YXJ0LCBsaW5lRW5kICsgMSk7XHJcbiAgICAgIGxpbmVTdGFydCA9IGxpbmVFbmQgKyAxO1xyXG5cclxuICAgICAgaWYgKGxpbmVIYXNoLmhhc093blByb3BlcnR5ID8gbGluZUhhc2guaGFzT3duUHJvcGVydHkobGluZSkgOlxyXG4gICAgICAgICAgKGxpbmVIYXNoW2xpbmVdICE9PSB1bmRlZmluZWQpKSB7XHJcbiAgICAgICAgY2hhcnMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShsaW5lSGFzaFtsaW5lXSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY2hhcnMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShsaW5lQXJyYXlMZW5ndGgpO1xyXG4gICAgICAgIGxpbmVIYXNoW2xpbmVdID0gbGluZUFycmF5TGVuZ3RoO1xyXG4gICAgICAgIGxpbmVBcnJheVtsaW5lQXJyYXlMZW5ndGgrK10gPSBsaW5lO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY2hhcnM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZWh5ZHJhdGUgdGhlIHRleHQgaW4gYSBkaWZmIGZyb20gYSBzdHJpbmcgb2YgbGluZSBoYXNoZXMgdG8gcmVhbCBsaW5lcyBvZlxyXG4gICAqIHRleHQuXHJcbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cclxuICAgKiBAcGFyYW0gIGxpbmVBcnJheSBBcnJheSBvZiB1bmlxdWUgc3RyaW5ncy5cclxuXHJcbiAgICovXHJcbiAgICBkaWZmX2NoYXJzVG9MaW5lc18gKGRpZmZzOiBBcnJheTxEaWZmPiwgbGluZUFycmF5OiBBcnJheTxzdHJpbmc+KTogdm9pZCB7XHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGRpZmZzLmxlbmd0aDsgeCsrKSB7XHJcbiAgICAgIGNvbnN0IGNoYXJzID0gZGlmZnNbeF1bMV07XHJcbiAgICAgIGNvbnN0IHRleHQgPSBbXTtcclxuICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBjaGFycy5sZW5ndGg7IHkrKykge1xyXG4gICAgICAgIHRleHRbeV0gPSBsaW5lQXJyYXlbY2hhcnMuY2hhckNvZGVBdCh5KV07XHJcbiAgICAgIH1cclxuICAgICAgZGlmZnNbeF1bMV0gPSB0ZXh0LmpvaW4oJycpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBEZXRlcm1pbmUgdGhlIGNvbW1vbiBwcmVmaXggb2YgdHdvIHN0cmluZ3MuXHJcbiAgICogQHBhcmFtICB0ZXh0MSBGaXJzdCBzdHJpbmcuXHJcbiAgICogQHBhcmFtICB0ZXh0MiBTZWNvbmQgc3RyaW5nLlxyXG4gICAqIEByZXR1cm4gIFRoZSBudW1iZXIgb2YgY2hhcmFjdGVycyBjb21tb24gdG8gdGhlIHN0YXJ0IG9mIGVhY2hcclxuICAgKiAgICAgc3RyaW5nLlxyXG4gICAqL1xyXG4gICAgZGlmZl9jb21tb25QcmVmaXggKHRleHQxOiBzdHJpbmcsIHRleHQyOiBzdHJpbmcpOiBudW1iZXIge1xyXG4gICAgLy8gUXVpY2sgY2hlY2sgZm9yIGNvbW1vbiBudWxsIGNhc2VzLlxyXG4gICAgaWYgKCF0ZXh0MSB8fCAhdGV4dDIgfHwgdGV4dDEuY2hhckF0KDApICE9IHRleHQyLmNoYXJBdCgwKSkge1xyXG4gICAgICByZXR1cm4gMDtcclxuICAgIH1cclxuICAgIC8vIEJpbmFyeSBzZWFyY2guXHJcbiAgICAvLyBQZXJmb3JtYW5jZSBhbmFseXNpczogaHR0cDovL25laWwuZnJhc2VyLm5hbWUvbmV3cy8yMDA3LzEwLzA5L1xyXG4gICAgbGV0IHBvaW50ZXJtaW4gPSAwO1xyXG4gICAgbGV0IHBvaW50ZXJtYXggPSBNYXRoLm1pbih0ZXh0MS5sZW5ndGgsIHRleHQyLmxlbmd0aCk7XHJcbiAgICBsZXQgcG9pbnRlcm1pZCA9IHBvaW50ZXJtYXg7XHJcbiAgICBsZXQgcG9pbnRlcnN0YXJ0ID0gMDtcclxuICAgIHdoaWxlIChwb2ludGVybWluIDwgcG9pbnRlcm1pZCkge1xyXG4gICAgICBpZiAodGV4dDEuc3Vic3RyaW5nKHBvaW50ZXJzdGFydCwgcG9pbnRlcm1pZCkgPT1cclxuICAgICAgICAgIHRleHQyLnN1YnN0cmluZyhwb2ludGVyc3RhcnQsIHBvaW50ZXJtaWQpKSB7XHJcbiAgICAgICAgcG9pbnRlcm1pbiA9IHBvaW50ZXJtaWQ7XHJcbiAgICAgICAgcG9pbnRlcnN0YXJ0ID0gcG9pbnRlcm1pbjtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBwb2ludGVybWF4ID0gcG9pbnRlcm1pZDtcclxuICAgICAgfVxyXG4gICAgICBwb2ludGVybWlkID0gTWF0aC5mbG9vcigocG9pbnRlcm1heCAtIHBvaW50ZXJtaW4pIC8gMiArIHBvaW50ZXJtaW4pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHBvaW50ZXJtaWQ7XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIERldGVybWluZSB0aGUgY29tbW9uIHN1ZmZpeCBvZiB0d28gc3RyaW5ncy5cclxuICAgKiBAcGFyYW0gIHRleHQxIEZpcnN0IHN0cmluZy5cclxuICAgKiBAcGFyYW0gIHRleHQyIFNlY29uZCBzdHJpbmcuXHJcbiAgICogQHJldHVybiAgVGhlIG51bWJlciBvZiBjaGFyYWN0ZXJzIGNvbW1vbiB0byB0aGUgZW5kIG9mIGVhY2ggc3RyaW5nLlxyXG4gICAqL1xyXG4gICAgZGlmZl9jb21tb25TdWZmaXggKHRleHQxOiBzdHJpbmcsIHRleHQyOiBzdHJpbmcpOiBudW1iZXIge1xyXG4gICAgLy8gUXVpY2sgY2hlY2sgZm9yIGNvbW1vbiBudWxsIGNhc2VzLlxyXG4gICAgaWYgKCF0ZXh0MSB8fCAhdGV4dDIgfHxcclxuICAgICAgICB0ZXh0MS5jaGFyQXQodGV4dDEubGVuZ3RoIC0gMSkgIT0gdGV4dDIuY2hhckF0KHRleHQyLmxlbmd0aCAtIDEpKSB7XHJcbiAgICAgIHJldHVybiAwO1xyXG4gICAgfVxyXG4gICAgLy8gQmluYXJ5IHNlYXJjaC5cclxuICAgIC8vIFBlcmZvcm1hbmNlIGFuYWx5c2lzOiBodHRwOi8vbmVpbC5mcmFzZXIubmFtZS9uZXdzLzIwMDcvMTAvMDkvXHJcbiAgICBsZXQgcG9pbnRlcm1pbiA9IDA7XHJcbiAgICBsZXQgcG9pbnRlcm1heCA9IE1hdGgubWluKHRleHQxLmxlbmd0aCwgdGV4dDIubGVuZ3RoKTtcclxuICAgIGxldCBwb2ludGVybWlkID0gcG9pbnRlcm1heDtcclxuICAgIGxldCBwb2ludGVyZW5kID0gMDtcclxuICAgIHdoaWxlIChwb2ludGVybWluIDwgcG9pbnRlcm1pZCkge1xyXG4gICAgICBpZiAodGV4dDEuc3Vic3RyaW5nKHRleHQxLmxlbmd0aCAtIHBvaW50ZXJtaWQsIHRleHQxLmxlbmd0aCAtIHBvaW50ZXJlbmQpID09XHJcbiAgICAgICAgICB0ZXh0Mi5zdWJzdHJpbmcodGV4dDIubGVuZ3RoIC0gcG9pbnRlcm1pZCwgdGV4dDIubGVuZ3RoIC0gcG9pbnRlcmVuZCkpIHtcclxuICAgICAgICBwb2ludGVybWluID0gcG9pbnRlcm1pZDtcclxuICAgICAgICBwb2ludGVyZW5kID0gcG9pbnRlcm1pbjtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBwb2ludGVybWF4ID0gcG9pbnRlcm1pZDtcclxuICAgICAgfVxyXG4gICAgICBwb2ludGVybWlkID0gTWF0aC5mbG9vcigocG9pbnRlcm1heCAtIHBvaW50ZXJtaW4pIC8gMiArIHBvaW50ZXJtaW4pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHBvaW50ZXJtaWQ7XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIERldGVybWluZSBpZiB0aGUgc3VmZml4IG9mIG9uZSBzdHJpbmcgaXMgdGhlIHByZWZpeCBvZiBhbm90aGVyLlxyXG4gICAqIEBwYXJhbSAgdGV4dDEgRmlyc3Qgc3RyaW5nLlxyXG4gICAqIEBwYXJhbSAgdGV4dDIgU2Vjb25kIHN0cmluZy5cclxuICAgKiBAcmV0dXJuICBUaGUgbnVtYmVyIG9mIGNoYXJhY3RlcnMgY29tbW9uIHRvIHRoZSBlbmQgb2YgdGhlIGZpcnN0XHJcbiAgICogICAgIHN0cmluZyBhbmQgdGhlIHN0YXJ0IG9mIHRoZSBzZWNvbmQgc3RyaW5nLlxyXG5cclxuICAgKi9cclxuICAgIGRpZmZfY29tbW9uT3ZlcmxhcF8gKHRleHQxOiBzdHJpbmcsIHRleHQyOiBzdHJpbmcpOiBudW1iZXIge1xyXG4gICAgLy8gQ2FjaGUgdGhlIHRleHQgbGVuZ3RocyB0byBwcmV2ZW50IG11bHRpcGxlIGNhbGxzLlxyXG4gICAgY29uc3QgdGV4dDFfbGVuZ3RoID0gdGV4dDEubGVuZ3RoO1xyXG4gICAgY29uc3QgdGV4dDJfbGVuZ3RoID0gdGV4dDIubGVuZ3RoO1xyXG4gICAgLy8gRWxpbWluYXRlIHRoZSBudWxsIGNhc2UuXHJcbiAgICBpZiAodGV4dDFfbGVuZ3RoID09IDAgfHwgdGV4dDJfbGVuZ3RoID09IDApIHtcclxuICAgICAgcmV0dXJuIDA7XHJcbiAgICB9XHJcbiAgICAvLyBUcnVuY2F0ZSB0aGUgbG9uZ2VyIHN0cmluZy5cclxuICAgIGlmICh0ZXh0MV9sZW5ndGggPiB0ZXh0Ml9sZW5ndGgpIHtcclxuICAgICAgdGV4dDEgPSB0ZXh0MS5zdWJzdHJpbmcodGV4dDFfbGVuZ3RoIC0gdGV4dDJfbGVuZ3RoKTtcclxuICAgIH0gZWxzZSBpZiAodGV4dDFfbGVuZ3RoIDwgdGV4dDJfbGVuZ3RoKSB7XHJcbiAgICAgIHRleHQyID0gdGV4dDIuc3Vic3RyaW5nKDAsIHRleHQxX2xlbmd0aCk7XHJcbiAgICB9XHJcbiAgICBjb25zdCB0ZXh0X2xlbmd0aCA9IE1hdGgubWluKHRleHQxX2xlbmd0aCwgdGV4dDJfbGVuZ3RoKTtcclxuICAgIC8vIFF1aWNrIGNoZWNrIGZvciB0aGUgd29yc3QgY2FzZS5cclxuICAgIGlmICh0ZXh0MSA9PSB0ZXh0Mikge1xyXG4gICAgICByZXR1cm4gdGV4dF9sZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU3RhcnQgYnkgbG9va2luZyBmb3IgYSBzaW5nbGUgY2hhcmFjdGVyIG1hdGNoXHJcbiAgICAvLyBhbmQgaW5jcmVhc2UgbGVuZ3RoIHVudGlsIG5vIG1hdGNoIGlzIGZvdW5kLlxyXG4gICAgLy8gUGVyZm9ybWFuY2UgYW5hbHlzaXM6IGh0dHA6Ly9uZWlsLmZyYXNlci5uYW1lL25ld3MvMjAxMC8xMS8wNC9cclxuICAgIGxldCBiZXN0ID0gMDtcclxuICAgIGxldCBsZW5ndGggPSAxO1xyXG4gICAgd2hpbGUgKHRydWUpIHtcclxuICAgICAgY29uc3QgcGF0dGVybiA9IHRleHQxLnN1YnN0cmluZyh0ZXh0X2xlbmd0aCAtIGxlbmd0aCk7XHJcbiAgICAgIGNvbnN0IGZvdW5kID0gdGV4dDIuaW5kZXhPZihwYXR0ZXJuKTtcclxuICAgICAgaWYgKGZvdW5kID09IC0xKSB7XHJcbiAgICAgICAgcmV0dXJuIGJlc3Q7XHJcbiAgICAgIH1cclxuICAgICAgbGVuZ3RoICs9IGZvdW5kO1xyXG4gICAgICBpZiAoZm91bmQgPT0gMCB8fCB0ZXh0MS5zdWJzdHJpbmcodGV4dF9sZW5ndGggLSBsZW5ndGgpID09XHJcbiAgICAgICAgICB0ZXh0Mi5zdWJzdHJpbmcoMCwgbGVuZ3RoKSkge1xyXG4gICAgICAgIGJlc3QgPSBsZW5ndGg7XHJcbiAgICAgICAgbGVuZ3RoKys7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogRG8gdGhlIHR3byB0ZXh0cyBzaGFyZSBhIHN1YnN0cmluZyB3aGljaCBpcyBhdCBsZWFzdCBoYWxmIHRoZSBsZW5ndGggb2YgdGhlXHJcbiAgICogbG9uZ2VyIHRleHQ/XHJcbiAgICogVGhpcyBzcGVlZHVwIGNhbiBwcm9kdWNlIG5vbi1taW5pbWFsIGRpZmZzLlxyXG4gICAqIEBwYXJhbSAgdGV4dDEgRmlyc3Qgc3RyaW5nLlxyXG4gICAqIEBwYXJhbSAgdGV4dDIgU2Vjb25kIHN0cmluZy5cclxuICAgKiBAcmV0dXJuICBGaXZlIGVsZW1lbnQgQXJyYXksIGNvbnRhaW5pbmcgdGhlIHByZWZpeCBvZlxyXG4gICAqICAgICB0ZXh0MSwgdGhlIHN1ZmZpeCBvZiB0ZXh0MSwgdGhlIHByZWZpeCBvZiB0ZXh0MiwgdGhlIHN1ZmZpeCBvZlxyXG4gICAqICAgICB0ZXh0MiBhbmQgdGhlIGNvbW1vbiBtaWRkbGUuICBPciBudWxsIGlmIHRoZXJlIHdhcyBubyBtYXRjaC5cclxuXHJcbiAgICovXHJcbiAgICBkaWZmX2hhbGZNYXRjaF8gKHRleHQxOiBzdHJpbmcsIHRleHQyOiBzdHJpbmcpIHtcclxuICAgIGlmICh0aGlzLkRpZmZfVGltZW91dCA8PSAwKSB7XHJcbiAgICAgIC8vIERvbid0IHJpc2sgcmV0dXJuaW5nIGEgbm9uLW9wdGltYWwgZGlmZiBpZiB3ZSBoYXZlIHVubGltaXRlZCB0aW1lLlxyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICAgIGNvbnN0IGxvbmd0ZXh0ID0gdGV4dDEubGVuZ3RoID4gdGV4dDIubGVuZ3RoID8gdGV4dDEgOiB0ZXh0MjtcclxuICAgIGNvbnN0IHNob3J0dGV4dCA9IHRleHQxLmxlbmd0aCA+IHRleHQyLmxlbmd0aCA/IHRleHQyIDogdGV4dDE7XHJcbiAgICBpZiAobG9uZ3RleHQubGVuZ3RoIDwgNCB8fCBzaG9ydHRleHQubGVuZ3RoICogMiA8IGxvbmd0ZXh0Lmxlbmd0aCkge1xyXG4gICAgICByZXR1cm4gbnVsbDsgIC8vIFBvaW50bGVzcy5cclxuICAgIH1cclxuICAgIGNvbnN0IGRtcCA9IHRoaXM7ICAvLyAndGhpcycgYmVjb21lcyAnd2luZG93JyBpbiBhIGNsb3N1cmUuXHJcblxyXG5cclxuICAgIC8vIEZpcnN0IGNoZWNrIGlmIHRoZSBzZWNvbmQgcXVhcnRlciBpcyB0aGUgc2VlZCBmb3IgYSBoYWxmLW1hdGNoLlxyXG4gICAgY29uc3QgaG0xID0gdGhpcy5kaWZmX2hhbGZNYXRjaElfKGxvbmd0ZXh0LCBzaG9ydHRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguY2VpbChsb25ndGV4dC5sZW5ndGggLyA0KSwgZG1wKTtcclxuICAgIC8vIENoZWNrIGFnYWluIGJhc2VkIG9uIHRoZSB0aGlyZCBxdWFydGVyLlxyXG4gICAgY29uc3QgaG0yID0gdGhpcy5kaWZmX2hhbGZNYXRjaElfKGxvbmd0ZXh0LCBzaG9ydHRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguY2VpbChsb25ndGV4dC5sZW5ndGggLyAyKSwgZG1wKTtcclxuICAgIGxldCBobTtcclxuICAgIGlmICghaG0xICYmICFobTIpIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9IGVsc2UgaWYgKCFobTIpIHtcclxuICAgICAgaG0gPSBobTE7XHJcbiAgICB9IGVsc2UgaWYgKCFobTEpIHtcclxuICAgICAgaG0gPSBobTI7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBCb3RoIG1hdGNoZWQuICBTZWxlY3QgdGhlIGxvbmdlc3QuXHJcbiAgICAgIGhtID0gaG0xWzRdLmxlbmd0aCA+IGhtMls0XS5sZW5ndGggPyBobTEgOiBobTI7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQSBoYWxmLW1hdGNoIHdhcyBmb3VuZCwgc29ydCBvdXQgdGhlIHJldHVybiBkYXRhLlxyXG4gICAgbGV0IHRleHQxX2EsIHRleHQxX2IsIHRleHQyX2EsIHRleHQyX2I7XHJcbiAgICBpZiAodGV4dDEubGVuZ3RoID4gdGV4dDIubGVuZ3RoKSB7XHJcbiAgICAgIHRleHQxX2EgPSBobVswXTtcclxuICAgICAgdGV4dDFfYiA9IGhtWzFdO1xyXG4gICAgICB0ZXh0Ml9hID0gaG1bMl07XHJcbiAgICAgIHRleHQyX2IgPSBobVszXTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRleHQyX2EgPSBobVswXTtcclxuICAgICAgdGV4dDJfYiA9IGhtWzFdO1xyXG4gICAgICB0ZXh0MV9hID0gaG1bMl07XHJcbiAgICAgIHRleHQxX2IgPSBobVszXTtcclxuICAgIH1cclxuICAgIGNvbnN0IG1pZF9jb21tb24gPSBobVs0XTtcclxuICAgIHJldHVybiBbdGV4dDFfYSwgdGV4dDFfYiwgdGV4dDJfYSwgdGV4dDJfYiwgbWlkX2NvbW1vbl07XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogRG9lcyBhIHN1YnN0cmluZyBvZiBzaG9ydHRleHQgZXhpc3Qgd2l0aGluIGxvbmd0ZXh0IHN1Y2ggdGhhdCB0aGUgc3Vic3RyaW5nXHJcbiAgICogaXMgYXQgbGVhc3QgaGFsZiB0aGUgbGVuZ3RoIG9mIGxvbmd0ZXh0P1xyXG4gICAqIENsb3N1cmUsIGJ1dCBkb2VzIG5vdCByZWZlcmVuY2UgYW55IGV4dGVybmFsIGNvbnN0aWFibGVzLlxyXG4gICAqIEBwYXJhbSAgbG9uZ3RleHQgTG9uZ2VyIHN0cmluZy5cclxuICAgKiBAcGFyYW0gIHNob3J0dGV4dCBTaG9ydGVyIHN0cmluZy5cclxuICAgKiBAcGFyYW0gIGkgU3RhcnQgaW5kZXggb2YgcXVhcnRlciBsZW5ndGggc3Vic3RyaW5nIHdpdGhpbiBsb25ndGV4dC5cclxuICAgKiBAcmV0dXJuICBGaXZlIGVsZW1lbnQgQXJyYXksIGNvbnRhaW5pbmcgdGhlIHByZWZpeCBvZlxyXG4gICAqICAgICBsb25ndGV4dCwgdGhlIHN1ZmZpeCBvZiBsb25ndGV4dCwgdGhlIHByZWZpeCBvZiBzaG9ydHRleHQsIHRoZSBzdWZmaXhcclxuICAgKiAgICAgb2Ygc2hvcnR0ZXh0IGFuZCB0aGUgY29tbW9uIG1pZGRsZS4gIE9yIG51bGwgaWYgdGhlcmUgd2FzIG5vIG1hdGNoLlxyXG5cclxuICAgKi9cclxuICBkaWZmX2hhbGZNYXRjaElfKGxvbmd0ZXh0OiBzdHJpbmcsIHNob3J0dGV4dDogc3RyaW5nLCBpOiBudW1iZXIsIGRtcDogRGlmZk1hdGNoUGF0Y2gpOiBBcnJheTxzdHJpbmc+IHtcclxuICAgIC8vIFN0YXJ0IHdpdGggYSAxLzQgbGVuZ3RoIHN1YnN0cmluZyBhdCBwb3NpdGlvbiBpIGFzIGEgc2VlZC5cclxuICAgIGNvbnN0IHNlZWQgPSBsb25ndGV4dC5zdWJzdHJpbmcoaSwgaSArIE1hdGguZmxvb3IobG9uZ3RleHQubGVuZ3RoIC8gNCkpO1xyXG4gICAgbGV0IGogPSAtMTtcclxuICAgIGxldCBiZXN0X2NvbW1vbiA9ICcnO1xyXG4gICAgbGV0IGJlc3RfbG9uZ3RleHRfYSwgYmVzdF9sb25ndGV4dF9iLCBiZXN0X3Nob3J0dGV4dF9hLCBiZXN0X3Nob3J0dGV4dF9iO1xyXG4gICAgd2hpbGUgKChqID0gc2hvcnR0ZXh0LmluZGV4T2Yoc2VlZCwgaiArIDEpKSAhPSAtMSkge1xyXG4gICAgICBjb25zdCBwcmVmaXhMZW5ndGggPSBkbXAuZGlmZl9jb21tb25QcmVmaXgobG9uZ3RleHQuc3Vic3RyaW5nKGkpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvcnR0ZXh0LnN1YnN0cmluZyhqKSk7XHJcbiAgICAgIGNvbnN0IHN1ZmZpeExlbmd0aCA9IGRtcC5kaWZmX2NvbW1vblN1ZmZpeChsb25ndGV4dC5zdWJzdHJpbmcoMCwgaSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG9ydHRleHQuc3Vic3RyaW5nKDAsIGopKTtcclxuICAgICAgaWYgKGJlc3RfY29tbW9uLmxlbmd0aCA8IHN1ZmZpeExlbmd0aCArIHByZWZpeExlbmd0aCkge1xyXG4gICAgICAgIGJlc3RfY29tbW9uID0gc2hvcnR0ZXh0LnN1YnN0cmluZyhqIC0gc3VmZml4TGVuZ3RoLCBqKSArXHJcbiAgICAgICAgICAgIHNob3J0dGV4dC5zdWJzdHJpbmcoaiwgaiArIHByZWZpeExlbmd0aCk7XHJcbiAgICAgICAgYmVzdF9sb25ndGV4dF9hID0gbG9uZ3RleHQuc3Vic3RyaW5nKDAsIGkgLSBzdWZmaXhMZW5ndGgpO1xyXG4gICAgICAgIGJlc3RfbG9uZ3RleHRfYiA9IGxvbmd0ZXh0LnN1YnN0cmluZyhpICsgcHJlZml4TGVuZ3RoKTtcclxuICAgICAgICBiZXN0X3Nob3J0dGV4dF9hID0gc2hvcnR0ZXh0LnN1YnN0cmluZygwLCBqIC0gc3VmZml4TGVuZ3RoKTtcclxuICAgICAgICBiZXN0X3Nob3J0dGV4dF9iID0gc2hvcnR0ZXh0LnN1YnN0cmluZyhqICsgcHJlZml4TGVuZ3RoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKGJlc3RfY29tbW9uLmxlbmd0aCAqIDIgPj0gbG9uZ3RleHQubGVuZ3RoKSB7XHJcbiAgICAgIHJldHVybiBbYmVzdF9sb25ndGV4dF9hLCBiZXN0X2xvbmd0ZXh0X2IsXHJcbiAgICAgICAgICAgICAgYmVzdF9zaG9ydHRleHRfYSwgYmVzdF9zaG9ydHRleHRfYiwgYmVzdF9jb21tb25dO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZWR1Y2UgdGhlIG51bWJlciBvZiBlZGl0cyBieSBlbGltaW5hdGluZyBzZW1hbnRpY2FsbHkgdHJpdmlhbCBlcXVhbGl0aWVzLlxyXG4gICAqIEBwYXJhbSAgZGlmZnMgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXHJcbiAgICovXHJcbiAgICBkaWZmX2NsZWFudXBTZW1hbnRpYyAoZGlmZnM6IEFycmF5PERpZmY+KSB7XHJcbiAgICBsZXQgY2hhbmdlcyA9IGZhbHNlO1xyXG4gICAgY29uc3QgZXF1YWxpdGllcyA9IFtdOyAgLy8gU3RhY2sgb2YgaW5kaWNlcyB3aGVyZSBlcXVhbGl0aWVzIGFyZSBmb3VuZC5cclxuICAgIGxldCBlcXVhbGl0aWVzTGVuZ3RoID0gMDsgIC8vIEtlZXBpbmcgb3VyIG93biBsZW5ndGggY29uc3QgaXMgZmFzdGVyIGluIEpTLlxyXG5cclxuICAgIGxldCBsYXN0ZXF1YWxpdHkgPSBudWxsO1xyXG4gICAgLy8gQWx3YXlzIGVxdWFsIHRvIGRpZmZzW2VxdWFsaXRpZXNbZXF1YWxpdGllc0xlbmd0aCAtIDFdXVsxXVxyXG4gICAgbGV0IHBvaW50ZXIgPSAwOyAgLy8gSW5kZXggb2YgY3VycmVudCBwb3NpdGlvbi5cclxuICAgIC8vIE51bWJlciBvZiBjaGFyYWN0ZXJzIHRoYXQgY2hhbmdlZCBwcmlvciB0byB0aGUgZXF1YWxpdHkuXHJcbiAgICBsZXQgbGVuZ3RoX2luc2VydGlvbnMxID0gMDtcclxuICAgIGxldCBsZW5ndGhfZGVsZXRpb25zMSA9IDA7XHJcbiAgICAvLyBOdW1iZXIgb2YgY2hhcmFjdGVycyB0aGF0IGNoYW5nZWQgYWZ0ZXIgdGhlIGVxdWFsaXR5LlxyXG4gICAgbGV0IGxlbmd0aF9pbnNlcnRpb25zMiA9IDA7XHJcbiAgICBsZXQgbGVuZ3RoX2RlbGV0aW9uczIgPSAwO1xyXG4gICAgd2hpbGUgKHBvaW50ZXIgPCBkaWZmcy5sZW5ndGgpIHtcclxuICAgICAgaWYgKGRpZmZzW3BvaW50ZXJdWzBdID09IERpZmZPcC5FcXVhbCkgeyAgLy8gRXF1YWxpdHkgZm91bmQuXHJcbiAgICAgICAgZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoKytdID0gcG9pbnRlcjtcclxuICAgICAgICBsZW5ndGhfaW5zZXJ0aW9uczEgPSBsZW5ndGhfaW5zZXJ0aW9uczI7XHJcbiAgICAgICAgbGVuZ3RoX2RlbGV0aW9uczEgPSBsZW5ndGhfZGVsZXRpb25zMjtcclxuICAgICAgICBsZW5ndGhfaW5zZXJ0aW9uczIgPSAwO1xyXG4gICAgICAgIGxlbmd0aF9kZWxldGlvbnMyID0gMDtcclxuICAgICAgICBsYXN0ZXF1YWxpdHkgPSBkaWZmc1twb2ludGVyXVsxXTtcclxuICAgICAgfSBlbHNlIHsgIC8vIEFuIGluc2VydGlvbiBvciBkZWxldGlvbi5cclxuICAgICAgICBpZiAoZGlmZnNbcG9pbnRlcl1bMF0gPT0gRGlmZk9wLkluc2VydCkge1xyXG4gICAgICAgICAgbGVuZ3RoX2luc2VydGlvbnMyICs9IGRpZmZzW3BvaW50ZXJdWzFdLmxlbmd0aDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgbGVuZ3RoX2RlbGV0aW9uczIgKz0gZGlmZnNbcG9pbnRlcl1bMV0ubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBFbGltaW5hdGUgYW4gZXF1YWxpdHkgdGhhdCBpcyBzbWFsbGVyIG9yIGVxdWFsIHRvIHRoZSBlZGl0cyBvbiBib3RoXHJcbiAgICAgICAgLy8gc2lkZXMgb2YgaXQuXHJcbiAgICAgICAgaWYgKGxhc3RlcXVhbGl0eSAmJiAobGFzdGVxdWFsaXR5Lmxlbmd0aCA8PVxyXG4gICAgICAgICAgICBNYXRoLm1heChsZW5ndGhfaW5zZXJ0aW9uczEsIGxlbmd0aF9kZWxldGlvbnMxKSkgJiZcclxuICAgICAgICAgICAgKGxhc3RlcXVhbGl0eS5sZW5ndGggPD0gTWF0aC5tYXgobGVuZ3RoX2luc2VydGlvbnMyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlbmd0aF9kZWxldGlvbnMyKSkpIHtcclxuICAgICAgICAgIC8vIER1cGxpY2F0ZSByZWNvcmQuXHJcbiAgICAgICAgICBkaWZmcy5zcGxpY2UoZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoIC0gMV0sIDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICBbRGlmZk9wLkRlbGV0ZSwgbGFzdGVxdWFsaXR5XSk7XHJcbiAgICAgICAgICAvLyBDaGFuZ2Ugc2Vjb25kIGNvcHkgdG8gaW5zZXJ0LlxyXG4gICAgICAgICAgZGlmZnNbZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoIC0gMV0gKyAxXVswXSA9IERpZmZPcC5JbnNlcnQ7XHJcbiAgICAgICAgICAvLyBUaHJvdyBhd2F5IHRoZSBlcXVhbGl0eSB3ZSBqdXN0IGRlbGV0ZWQuXHJcbiAgICAgICAgICBlcXVhbGl0aWVzTGVuZ3RoLS07XHJcbiAgICAgICAgICAvLyBUaHJvdyBhd2F5IHRoZSBwcmV2aW91cyBlcXVhbGl0eSAoaXQgbmVlZHMgdG8gYmUgcmVldmFsdWF0ZWQpLlxyXG4gICAgICAgICAgZXF1YWxpdGllc0xlbmd0aC0tO1xyXG4gICAgICAgICAgcG9pbnRlciA9IGVxdWFsaXRpZXNMZW5ndGggPiAwID8gZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoIC0gMV0gOiAtMTtcclxuICAgICAgICAgIGxlbmd0aF9pbnNlcnRpb25zMSA9IDA7ICAvLyBSZXNldCB0aGUgY291bnRlcnMuXHJcbiAgICAgICAgICBsZW5ndGhfZGVsZXRpb25zMSA9IDA7XHJcbiAgICAgICAgICBsZW5ndGhfaW5zZXJ0aW9uczIgPSAwO1xyXG4gICAgICAgICAgbGVuZ3RoX2RlbGV0aW9uczIgPSAwO1xyXG4gICAgICAgICAgbGFzdGVxdWFsaXR5ID0gbnVsbDtcclxuICAgICAgICAgIGNoYW5nZXMgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBwb2ludGVyKys7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTm9ybWFsaXplIHRoZSBkaWZmLlxyXG4gICAgaWYgKGNoYW5nZXMpIHtcclxuICAgICAgdGhpcy5kaWZmX2NsZWFudXBNZXJnZShkaWZmcyk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmRpZmZfY2xlYW51cFNlbWFudGljTG9zc2xlc3MoZGlmZnMpO1xyXG5cclxuICAgIC8vIEZpbmQgYW55IG92ZXJsYXBzIGJldHdlZW4gZGVsZXRpb25zIGFuZCBpbnNlcnRpb25zLlxyXG4gICAgLy8gZS5nOiA8ZGVsPmFiY3h4eDwvZGVsPjxpbnM+eHh4ZGVmPC9pbnM+XHJcbiAgICAvLyAgIC0+IDxkZWw+YWJjPC9kZWw+eHh4PGlucz5kZWY8L2lucz5cclxuICAgIC8vIGUuZzogPGRlbD54eHhhYmM8L2RlbD48aW5zPmRlZnh4eDwvaW5zPlxyXG4gICAgLy8gICAtPiA8aW5zPmRlZjwvaW5zPnh4eDxkZWw+YWJjPC9kZWw+XHJcbiAgICAvLyBPbmx5IGV4dHJhY3QgYW4gb3ZlcmxhcCBpZiBpdCBpcyBhcyBiaWcgYXMgdGhlIGVkaXQgYWhlYWQgb3IgYmVoaW5kIGl0LlxyXG4gICAgcG9pbnRlciA9IDE7XHJcbiAgICB3aGlsZSAocG9pbnRlciA8IGRpZmZzLmxlbmd0aCkge1xyXG4gICAgICBpZiAoZGlmZnNbcG9pbnRlciAtIDFdWzBdID09IERpZmZPcC5EZWxldGUgJiZcclxuICAgICAgICAgIGRpZmZzW3BvaW50ZXJdWzBdID09IERpZmZPcC5JbnNlcnQpIHtcclxuICAgICAgICBjb25zdCBkZWxldGlvbiA9IGRpZmZzW3BvaW50ZXIgLSAxXVsxXTtcclxuICAgICAgICBjb25zdCBpbnNlcnRpb24gPSBkaWZmc1twb2ludGVyXVsxXTtcclxuICAgICAgICBjb25zdCBvdmVybGFwX2xlbmd0aDEgPSB0aGlzLmRpZmZfY29tbW9uT3ZlcmxhcF8oZGVsZXRpb24sIGluc2VydGlvbik7XHJcbiAgICAgICAgY29uc3Qgb3ZlcmxhcF9sZW5ndGgyID0gdGhpcy5kaWZmX2NvbW1vbk92ZXJsYXBfKGluc2VydGlvbiwgZGVsZXRpb24pO1xyXG4gICAgICAgIGlmIChvdmVybGFwX2xlbmd0aDEgPj0gb3ZlcmxhcF9sZW5ndGgyKSB7XHJcbiAgICAgICAgICBpZiAob3ZlcmxhcF9sZW5ndGgxID49IGRlbGV0aW9uLmxlbmd0aCAvIDIgfHxcclxuICAgICAgICAgICAgICBvdmVybGFwX2xlbmd0aDEgPj0gaW5zZXJ0aW9uLmxlbmd0aCAvIDIpIHtcclxuICAgICAgICAgICAgLy8gT3ZlcmxhcCBmb3VuZC4gIEluc2VydCBhbiBlcXVhbGl0eSBhbmQgdHJpbSB0aGUgc3Vycm91bmRpbmcgZWRpdHMuXHJcbiAgICAgICAgICAgIGRpZmZzLnNwbGljZShwb2ludGVyLCAwLFxyXG4gICAgICAgICAgICAgICAgW0RpZmZPcC5FcXVhbCwgaW5zZXJ0aW9uLnN1YnN0cmluZygwLCBvdmVybGFwX2xlbmd0aDEpXSk7XHJcbiAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgLSAxXVsxXSA9XHJcbiAgICAgICAgICAgICAgICBkZWxldGlvbi5zdWJzdHJpbmcoMCwgZGVsZXRpb24ubGVuZ3RoIC0gb3ZlcmxhcF9sZW5ndGgxKTtcclxuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciArIDFdWzFdID0gaW5zZXJ0aW9uLnN1YnN0cmluZyhvdmVybGFwX2xlbmd0aDEpO1xyXG4gICAgICAgICAgICBwb2ludGVyKys7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGlmIChvdmVybGFwX2xlbmd0aDIgPj0gZGVsZXRpb24ubGVuZ3RoIC8gMiB8fFxyXG4gICAgICAgICAgICAgIG92ZXJsYXBfbGVuZ3RoMiA+PSBpbnNlcnRpb24ubGVuZ3RoIC8gMikge1xyXG4gICAgICAgICAgICAvLyBSZXZlcnNlIG92ZXJsYXAgZm91bmQuXHJcbiAgICAgICAgICAgIC8vIEluc2VydCBhbiBlcXVhbGl0eSBhbmQgc3dhcCBhbmQgdHJpbSB0aGUgc3Vycm91bmRpbmcgZWRpdHMuXHJcbiAgICAgICAgICAgIGRpZmZzLnNwbGljZShwb2ludGVyLCAwLFxyXG4gICAgICAgICAgICAgICAgW0RpZmZPcC5FcXVhbCwgZGVsZXRpb24uc3Vic3RyaW5nKDAsIG92ZXJsYXBfbGVuZ3RoMildKTtcclxuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciAtIDFdWzBdID0gRGlmZk9wLkluc2VydDtcclxuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciAtIDFdWzFdID1cclxuICAgICAgICAgICAgICAgIGluc2VydGlvbi5zdWJzdHJpbmcoMCwgaW5zZXJ0aW9uLmxlbmd0aCAtIG92ZXJsYXBfbGVuZ3RoMik7XHJcbiAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgKyAxXVswXSA9IERpZmZPcC5EZWxldGU7XHJcbiAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgKyAxXVsxXSA9XHJcbiAgICAgICAgICAgICAgICBkZWxldGlvbi5zdWJzdHJpbmcob3ZlcmxhcF9sZW5ndGgyKTtcclxuICAgICAgICAgICAgcG9pbnRlcisrO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBwb2ludGVyKys7XHJcbiAgICAgIH1cclxuICAgICAgcG9pbnRlcisrO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBMb29rIGZvciBzaW5nbGUgZWRpdHMgc3Vycm91bmRlZCBvbiBib3RoIHNpZGVzIGJ5IGVxdWFsaXRpZXNcclxuICAgKiB3aGljaCBjYW4gYmUgc2hpZnRlZCBzaWRld2F5cyB0byBhbGlnbiB0aGUgZWRpdCB0byBhIHdvcmQgYm91bmRhcnkuXHJcbiAgICogZS5nOiBUaGUgYzxpbnM+YXQgYzwvaW5zPmFtZS4gLT4gVGhlIDxpbnM+Y2F0IDwvaW5zPmNhbWUuXHJcbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cclxuICAgKi9cclxuICAgIGRpZmZfY2xlYW51cFNlbWFudGljTG9zc2xlc3MgKGRpZmZzOiBBcnJheTxEaWZmPikge1xyXG4gICAgLyoqXHJcbiAgICAgKiBHaXZlbiB0d28gc3RyaW5ncywgY29tcHV0ZSBhIHNjb3JlIHJlcHJlc2VudGluZyB3aGV0aGVyIHRoZSBpbnRlcm5hbFxyXG4gICAgICogYm91bmRhcnkgZmFsbHMgb24gbG9naWNhbCBib3VuZGFyaWVzLlxyXG4gICAgICogU2NvcmVzIHJhbmdlIGZyb20gNiAoYmVzdCkgdG8gMCAod29yc3QpLlxyXG4gICAgICogQ2xvc3VyZSwgYnV0IGRvZXMgbm90IHJlZmVyZW5jZSBhbnkgZXh0ZXJuYWwgY29uc3RpYWJsZXMuXHJcbiAgICAgKiBAcGFyYW0gIG9uZSBGaXJzdCBzdHJpbmcuXHJcbiAgICAgKiBAcGFyYW0gIHR3byBTZWNvbmQgc3RyaW5nLlxyXG4gICAgICogQHJldHVybiAgVGhlIHNjb3JlLlxyXG5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZGlmZl9jbGVhbnVwU2VtYW50aWNTY29yZV8ob25lOiBzdHJpbmcsIHR3bzogc3RyaW5nKTogbnVtYmVyIHtcclxuICAgICAgaWYgKCFvbmUgfHwgIXR3bykge1xyXG4gICAgICAgIC8vIEVkZ2VzIGFyZSB0aGUgYmVzdC5cclxuICAgICAgICByZXR1cm4gNjtcclxuICAgICAgfVxyXG5cclxuXHJcbiAgICAgIGNvbnN0IG5vbkFscGhhTnVtZXJpY1JlZ2V4XyA9IG5ldyBSZWdFeHAoJy9bXmEtekEtWjAtOV0vJyk7XHJcblxyXG4gICAgICAvLyBFYWNoIHBvcnQgb2YgdGhpcyBmdW5jdGlvbiBiZWhhdmVzIHNsaWdodGx5IGRpZmZlcmVudGx5IGR1ZSB0b1xyXG4gICAgICAvLyBzdWJ0bGUgZGlmZmVyZW5jZXMgaW4gZWFjaCBsYW5ndWFnZSdzIGRlZmluaXRpb24gb2YgdGhpbmdzIGxpa2VcclxuICAgICAgLy8gJ3doaXRlc3BhY2UnLiAgU2luY2UgdGhpcyBmdW5jdGlvbidzIHB1cnBvc2UgaXMgbGFyZ2VseSBjb3NtZXRpYyxcclxuICAgICAgLy8gdGhlIGNob2ljZSBoYXMgYmVlbiBtYWRlIHRvIHVzZSBlYWNoIGxhbmd1YWdlJ3MgbmF0aXZlIGZlYXR1cmVzXHJcbiAgICAgIC8vIHJhdGhlciB0aGFuIGZvcmNlIHRvdGFsIGNvbmZvcm1pdHkuXHJcbiAgICAgIGNvbnN0IGNoYXIxID0gb25lLmNoYXJBdChvbmUubGVuZ3RoIC0gMSk7XHJcbiAgICAgIGNvbnN0IGNoYXIyID0gdHdvLmNoYXJBdCgwKTtcclxuICAgICAgY29uc3Qgbm9uQWxwaGFOdW1lcmljMSA9IGNoYXIxLm1hdGNoKG5vbkFscGhhTnVtZXJpY1JlZ2V4Xyk7XHJcbiAgICAgIGNvbnN0IG5vbkFscGhhTnVtZXJpYzIgPSBjaGFyMi5tYXRjaChub25BbHBoYU51bWVyaWNSZWdleF8pO1xyXG4gICAgICBjb25zdCB3aGl0ZXNwYWNlMSA9IG5vbkFscGhhTnVtZXJpYzEgJiZcclxuICAgICAgICAgIGNoYXIxLm1hdGNoKHRoaXMud2hpdGVzcGFjZVJlZ2V4Xyk7XHJcbiAgICAgIGNvbnN0IHdoaXRlc3BhY2UyID0gbm9uQWxwaGFOdW1lcmljMiAmJlxyXG4gICAgICAgICAgY2hhcjIubWF0Y2godGhpcy53aGl0ZXNwYWNlUmVnZXhfKTtcclxuICAgICAgY29uc3QgbGluZUJyZWFrMSA9IHdoaXRlc3BhY2UxICYmXHJcbiAgICAgICAgICBjaGFyMS5tYXRjaCh0aGlzLmxpbmVicmVha1JlZ2V4Xyk7XHJcbiAgICAgIGNvbnN0IGxpbmVCcmVhazIgPSB3aGl0ZXNwYWNlMiAmJlxyXG4gICAgICAgICAgY2hhcjIubWF0Y2godGhpcy5saW5lYnJlYWtSZWdleF8pO1xyXG4gICAgICBjb25zdCBibGFua0xpbmUxID0gbGluZUJyZWFrMSAmJlxyXG4gICAgICAgICAgb25lLm1hdGNoKHRoaXMuYmxhbmtsaW5lRW5kUmVnZXhfKTtcclxuICAgICAgY29uc3QgYmxhbmtMaW5lMiA9IGxpbmVCcmVhazIgJiZcclxuICAgICAgICAgIHR3by5tYXRjaCh0aGlzLmJsYW5rbGluZVN0YXJ0UmVnZXhfKTtcclxuXHJcbiAgICAgIGlmIChibGFua0xpbmUxIHx8IGJsYW5rTGluZTIpIHtcclxuICAgICAgICAvLyBGaXZlIHBvaW50cyBmb3IgYmxhbmsgbGluZXMuXHJcbiAgICAgICAgcmV0dXJuIDU7XHJcbiAgICAgIH0gZWxzZSBpZiAobGluZUJyZWFrMSB8fCBsaW5lQnJlYWsyKSB7XHJcbiAgICAgICAgLy8gRm91ciBwb2ludHMgZm9yIGxpbmUgYnJlYWtzLlxyXG4gICAgICAgIHJldHVybiA0O1xyXG4gICAgICB9IGVsc2UgaWYgKG5vbkFscGhhTnVtZXJpYzEgJiYgIXdoaXRlc3BhY2UxICYmIHdoaXRlc3BhY2UyKSB7XHJcbiAgICAgICAgLy8gVGhyZWUgcG9pbnRzIGZvciBlbmQgb2Ygc2VudGVuY2VzLlxyXG4gICAgICAgIHJldHVybiAzO1xyXG4gICAgICB9IGVsc2UgaWYgKHdoaXRlc3BhY2UxIHx8IHdoaXRlc3BhY2UyKSB7XHJcbiAgICAgICAgLy8gVHdvIHBvaW50cyBmb3Igd2hpdGVzcGFjZS5cclxuICAgICAgICByZXR1cm4gMjtcclxuICAgICAgfSBlbHNlIGlmIChub25BbHBoYU51bWVyaWMxIHx8IG5vbkFscGhhTnVtZXJpYzIpIHtcclxuICAgICAgICAvLyBPbmUgcG9pbnQgZm9yIG5vbi1hbHBoYW51bWVyaWMuXHJcbiAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIDA7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHBvaW50ZXIgPSAxO1xyXG4gICAgLy8gSW50ZW50aW9uYWxseSBpZ25vcmUgdGhlIGZpcnN0IGFuZCBsYXN0IGVsZW1lbnQgKGRvbid0IG5lZWQgY2hlY2tpbmcpLlxyXG4gICAgd2hpbGUgKHBvaW50ZXIgPCBkaWZmcy5sZW5ndGggLSAxKSB7XHJcbiAgICAgIGlmIChkaWZmc1twb2ludGVyIC0gMV1bMF0gPT0gRGlmZk9wLkVxdWFsICYmXHJcbiAgICAgICAgICBkaWZmc1twb2ludGVyICsgMV1bMF0gPT0gRGlmZk9wLkVxdWFsKSB7XHJcbiAgICAgICAgLy8gVGhpcyBpcyBhIHNpbmdsZSBlZGl0IHN1cnJvdW5kZWQgYnkgZXF1YWxpdGllcy5cclxuICAgICAgICBsZXQgZXF1YWxpdHkxID0gZGlmZnNbcG9pbnRlciAtIDFdWzFdO1xyXG4gICAgICAgIGxldCBlZGl0ID0gZGlmZnNbcG9pbnRlcl1bMV07XHJcbiAgICAgICAgbGV0IGVxdWFsaXR5MiA9IGRpZmZzW3BvaW50ZXIgKyAxXVsxXTtcclxuXHJcbiAgICAgICAgLy8gRmlyc3QsIHNoaWZ0IHRoZSBlZGl0IGFzIGZhciBsZWZ0IGFzIHBvc3NpYmxlLlxyXG4gICAgICAgIGNvbnN0IGNvbW1vbk9mZnNldCA9IHRoaXMuZGlmZl9jb21tb25TdWZmaXgoZXF1YWxpdHkxLCBlZGl0KTtcclxuICAgICAgICBpZiAoY29tbW9uT2Zmc2V0KSB7XHJcbiAgICAgICAgICBjb25zdCBjb21tb25TdHJpbmcgPSBlZGl0LnN1YnN0cmluZyhlZGl0Lmxlbmd0aCAtIGNvbW1vbk9mZnNldCk7XHJcbiAgICAgICAgICBlcXVhbGl0eTEgPSBlcXVhbGl0eTEuc3Vic3RyaW5nKDAsIGVxdWFsaXR5MS5sZW5ndGggLSBjb21tb25PZmZzZXQpO1xyXG4gICAgICAgICAgZWRpdCA9IGNvbW1vblN0cmluZyArIGVkaXQuc3Vic3RyaW5nKDAsIGVkaXQubGVuZ3RoIC0gY29tbW9uT2Zmc2V0KTtcclxuICAgICAgICAgIGVxdWFsaXR5MiA9IGNvbW1vblN0cmluZyArIGVxdWFsaXR5MjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFNlY29uZCwgc3RlcCBjaGFyYWN0ZXIgYnkgY2hhcmFjdGVyIHJpZ2h0LCBsb29raW5nIGZvciB0aGUgYmVzdCBmaXQuXHJcbiAgICAgICAgbGV0IGJlc3RFcXVhbGl0eTEgPSBlcXVhbGl0eTE7XHJcbiAgICAgICAgbGV0IGJlc3RFZGl0ID0gZWRpdDtcclxuICAgICAgICBsZXQgYmVzdEVxdWFsaXR5MiA9IGVxdWFsaXR5MjtcclxuICAgICAgICBsZXQgYmVzdFNjb3JlID0gZGlmZl9jbGVhbnVwU2VtYW50aWNTY29yZV8oZXF1YWxpdHkxLCBlZGl0KSArXHJcbiAgICAgICAgICAgIGRpZmZfY2xlYW51cFNlbWFudGljU2NvcmVfKGVkaXQsIGVxdWFsaXR5Mik7XHJcbiAgICAgICAgd2hpbGUgKGVkaXQuY2hhckF0KDApID09PSBlcXVhbGl0eTIuY2hhckF0KDApKSB7XHJcbiAgICAgICAgICBlcXVhbGl0eTEgKz0gZWRpdC5jaGFyQXQoMCk7XHJcbiAgICAgICAgICBlZGl0ID0gZWRpdC5zdWJzdHJpbmcoMSkgKyBlcXVhbGl0eTIuY2hhckF0KDApO1xyXG4gICAgICAgICAgZXF1YWxpdHkyID0gZXF1YWxpdHkyLnN1YnN0cmluZygxKTtcclxuICAgICAgICAgIGNvbnN0IHNjb3JlID0gZGlmZl9jbGVhbnVwU2VtYW50aWNTY29yZV8oZXF1YWxpdHkxLCBlZGl0KSArXHJcbiAgICAgICAgICAgICAgZGlmZl9jbGVhbnVwU2VtYW50aWNTY29yZV8oZWRpdCwgZXF1YWxpdHkyKTtcclxuICAgICAgICAgIC8vIFRoZSA+PSBlbmNvdXJhZ2VzIHRyYWlsaW5nIHJhdGhlciB0aGFuIGxlYWRpbmcgd2hpdGVzcGFjZSBvbiBlZGl0cy5cclxuICAgICAgICAgIGlmIChzY29yZSA+PSBiZXN0U2NvcmUpIHtcclxuICAgICAgICAgICAgYmVzdFNjb3JlID0gc2NvcmU7XHJcbiAgICAgICAgICAgIGJlc3RFcXVhbGl0eTEgPSBlcXVhbGl0eTE7XHJcbiAgICAgICAgICAgIGJlc3RFZGl0ID0gZWRpdDtcclxuICAgICAgICAgICAgYmVzdEVxdWFsaXR5MiA9IGVxdWFsaXR5MjtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChkaWZmc1twb2ludGVyIC0gMV1bMV0gIT0gYmVzdEVxdWFsaXR5MSkge1xyXG4gICAgICAgICAgLy8gV2UgaGF2ZSBhbiBpbXByb3ZlbWVudCwgc2F2ZSBpdCBiYWNrIHRvIHRoZSBkaWZmLlxyXG4gICAgICAgICAgaWYgKGJlc3RFcXVhbGl0eTEpIHtcclxuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciAtIDFdWzFdID0gYmVzdEVxdWFsaXR5MTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGRpZmZzLnNwbGljZShwb2ludGVyIC0gMSwgMSk7XHJcbiAgICAgICAgICAgIHBvaW50ZXItLTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGRpZmZzW3BvaW50ZXJdWzFdID0gYmVzdEVkaXQ7XHJcbiAgICAgICAgICBpZiAoYmVzdEVxdWFsaXR5Mikge1xyXG4gICAgICAgICAgICBkaWZmc1twb2ludGVyICsgMV1bMV0gPSBiZXN0RXF1YWxpdHkyO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIgKyAxLCAxKTtcclxuICAgICAgICAgICAgcG9pbnRlci0tO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBwb2ludGVyKys7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIFJlZHVjZSB0aGUgbnVtYmVyIG9mIGVkaXRzIGJ5IGVsaW1pbmF0aW5nIG9wZXJhdGlvbmFsbHkgdHJpdmlhbCBlcXVhbGl0aWVzLlxyXG4gICAqIEBwYXJhbSAgZGlmZnMgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXHJcbiAgICovXHJcbiAgICBkaWZmX2NsZWFudXBFZmZpY2llbmN5IChkaWZmczogQXJyYXk8RGlmZj4pIHtcclxuICAgIGxldCBjaGFuZ2VzID0gZmFsc2U7XHJcbiAgICBjb25zdCBlcXVhbGl0aWVzID0gW107ICAvLyBTdGFjayBvZiBpbmRpY2VzIHdoZXJlIGVxdWFsaXRpZXMgYXJlIGZvdW5kLlxyXG4gICAgbGV0IGVxdWFsaXRpZXNMZW5ndGggPSAwOyAgLy8gS2VlcGluZyBvdXIgb3duIGxlbmd0aCBjb25zdCBpcyBmYXN0ZXIgaW4gSlMuXHJcblxyXG4gICAgbGV0IGxhc3RlcXVhbGl0eSA9IG51bGw7XHJcbiAgICAvLyBBbHdheXMgZXF1YWwgdG8gZGlmZnNbZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoIC0gMV1dWzFdXHJcbiAgICBsZXQgcG9pbnRlciA9IDA7ICAvLyBJbmRleCBvZiBjdXJyZW50IHBvc2l0aW9uLlxyXG4gICAgLy8gSXMgdGhlcmUgYW4gaW5zZXJ0aW9uIG9wZXJhdGlvbiBiZWZvcmUgdGhlIGxhc3QgZXF1YWxpdHkuXHJcbiAgICBsZXQgcHJlX2lucyA9IGZhbHNlO1xyXG4gICAgLy8gSXMgdGhlcmUgYSBkZWxldGlvbiBvcGVyYXRpb24gYmVmb3JlIHRoZSBsYXN0IGVxdWFsaXR5LlxyXG4gICAgbGV0IHByZV9kZWwgPSBmYWxzZTtcclxuICAgIC8vIElzIHRoZXJlIGFuIGluc2VydGlvbiBvcGVyYXRpb24gYWZ0ZXIgdGhlIGxhc3QgZXF1YWxpdHkuXHJcbiAgICBsZXQgcG9zdF9pbnMgPSBmYWxzZTtcclxuICAgIC8vIElzIHRoZXJlIGEgZGVsZXRpb24gb3BlcmF0aW9uIGFmdGVyIHRoZSBsYXN0IGVxdWFsaXR5LlxyXG4gICAgbGV0IHBvc3RfZGVsID0gZmFsc2U7XHJcbiAgICB3aGlsZSAocG9pbnRlciA8IGRpZmZzLmxlbmd0aCkge1xyXG4gICAgICBpZiAoZGlmZnNbcG9pbnRlcl1bMF0gPT0gRGlmZk9wLkVxdWFsKSB7ICAvLyBFcXVhbGl0eSBmb3VuZC5cclxuICAgICAgICBpZiAoZGlmZnNbcG9pbnRlcl1bMV0ubGVuZ3RoIDwgdGhpcy5EaWZmX0VkaXRDb3N0ICYmXHJcbiAgICAgICAgICAgIChwb3N0X2lucyB8fCBwb3N0X2RlbCkpIHtcclxuICAgICAgICAgIC8vIENhbmRpZGF0ZSBmb3VuZC5cclxuICAgICAgICAgIGVxdWFsaXRpZXNbZXF1YWxpdGllc0xlbmd0aCsrXSA9IHBvaW50ZXI7XHJcbiAgICAgICAgICBwcmVfaW5zID0gcG9zdF9pbnM7XHJcbiAgICAgICAgICBwcmVfZGVsID0gcG9zdF9kZWw7XHJcbiAgICAgICAgICBsYXN0ZXF1YWxpdHkgPSBkaWZmc1twb2ludGVyXVsxXTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgLy8gTm90IGEgY2FuZGlkYXRlLCBhbmQgY2FuIG5ldmVyIGJlY29tZSBvbmUuXHJcbiAgICAgICAgICBlcXVhbGl0aWVzTGVuZ3RoID0gMDtcclxuICAgICAgICAgIGxhc3RlcXVhbGl0eSA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHBvc3RfaW5zID0gcG9zdF9kZWwgPSBmYWxzZTtcclxuICAgICAgfSBlbHNlIHsgIC8vIEFuIGluc2VydGlvbiBvciBkZWxldGlvbi5cclxuICAgICAgICBpZiAoZGlmZnNbcG9pbnRlcl1bMF0gPT0gRGlmZk9wLkRlbGV0ZSkge1xyXG4gICAgICAgICAgcG9zdF9kZWwgPSB0cnVlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBwb3N0X2lucyA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgKiBGaXZlIHR5cGVzIHRvIGJlIHNwbGl0OlxyXG4gICAgICAgICogPGlucz5BPC9pbnM+PGRlbD5CPC9kZWw+WFk8aW5zPkM8L2lucz48ZGVsPkQ8L2RlbD5cclxuICAgICAgICAqIDxpbnM+QTwvaW5zPlg8aW5zPkM8L2lucz48ZGVsPkQ8L2RlbD5cclxuICAgICAgICAqIDxpbnM+QTwvaW5zPjxkZWw+QjwvZGVsPlg8aW5zPkM8L2lucz5cclxuICAgICAgICAqIDxpbnM+QTwvZGVsPlg8aW5zPkM8L2lucz48ZGVsPkQ8L2RlbD5cclxuICAgICAgICAqIDxpbnM+QTwvaW5zPjxkZWw+QjwvZGVsPlg8ZGVsPkM8L2RlbD5cclxuICAgICAgICAqL1xyXG4gICAgICAgIGlmIChsYXN0ZXF1YWxpdHkgJiYgKChwcmVfaW5zICYmIHByZV9kZWwgJiYgcG9zdF9pbnMgJiYgcG9zdF9kZWwpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKGxhc3RlcXVhbGl0eS5sZW5ndGggPCB0aGlzLkRpZmZfRWRpdENvc3QgLyAyKSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKChwcmVfaW5zPzE6MCkgKyAocHJlX2RlbD8xOjApICsgKHBvc3RfaW5zPzE6MCkgKyAocG9zdF9kZWw/MTowKSA9PSAzKSkpKSB7XHJcbiAgICAgICAgICAvLyBEdXBsaWNhdGUgcmVjb3JkLlxyXG4gICAgICAgICAgZGlmZnMuc3BsaWNlKGVxdWFsaXRpZXNbZXF1YWxpdGllc0xlbmd0aCAtIDFdLCAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgW0RpZmZPcC5EZWxldGUsIGxhc3RlcXVhbGl0eV0pO1xyXG4gICAgICAgICAgLy8gQ2hhbmdlIHNlY29uZCBjb3B5IHRvIGluc2VydC5cclxuICAgICAgICAgIGRpZmZzW2VxdWFsaXRpZXNbZXF1YWxpdGllc0xlbmd0aCAtIDFdICsgMV1bMF0gPSBEaWZmT3AuSW5zZXJ0O1xyXG4gICAgICAgICAgZXF1YWxpdGllc0xlbmd0aC0tOyAgLy8gVGhyb3cgYXdheSB0aGUgZXF1YWxpdHkgd2UganVzdCBkZWxldGVkO1xyXG4gICAgICAgICAgbGFzdGVxdWFsaXR5ID0gbnVsbDtcclxuICAgICAgICAgIGlmIChwcmVfaW5zICYmIHByZV9kZWwpIHtcclxuICAgICAgICAgICAgLy8gTm8gY2hhbmdlcyBtYWRlIHdoaWNoIGNvdWxkIGFmZmVjdCBwcmV2aW91cyBlbnRyeSwga2VlcCBnb2luZy5cclxuICAgICAgICAgICAgcG9zdF9pbnMgPSBwb3N0X2RlbCA9IHRydWU7XHJcbiAgICAgICAgICAgIGVxdWFsaXRpZXNMZW5ndGggPSAwO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZXF1YWxpdGllc0xlbmd0aC0tOyAgLy8gVGhyb3cgYXdheSB0aGUgcHJldmlvdXMgZXF1YWxpdHkuXHJcbiAgICAgICAgICAgIHBvaW50ZXIgPSBlcXVhbGl0aWVzTGVuZ3RoID4gMCA/XHJcbiAgICAgICAgICAgICAgICBlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGggLSAxXSA6IC0xO1xyXG4gICAgICAgICAgICBwb3N0X2lucyA9IHBvc3RfZGVsID0gZmFsc2U7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjaGFuZ2VzID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcG9pbnRlcisrO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChjaGFuZ2VzKSB7XHJcbiAgICAgIHRoaXMuZGlmZl9jbGVhbnVwTWVyZ2UoZGlmZnMpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBSZW9yZGVyIGFuZCBtZXJnZSBsaWtlIGVkaXQgc2VjdGlvbnMuICBNZXJnZSBlcXVhbGl0aWVzLlxyXG4gICAqIEFueSBlZGl0IHNlY3Rpb24gY2FuIG1vdmUgYXMgbG9uZyBhcyBpdCBkb2Vzbid0IGNyb3NzIGFuIGVxdWFsaXR5LlxyXG4gICAqIEBwYXJhbSAgZGlmZnMgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXHJcbiAgICovXHJcbiAgICBkaWZmX2NsZWFudXBNZXJnZSAoZGlmZnM6IEFycmF5PERpZmY+KSB7XHJcbiAgICBkaWZmcy5wdXNoKFtEaWZmT3AuRXF1YWwsICcnXSk7ICAvLyBBZGQgYSBkdW1teSBlbnRyeSBhdCB0aGUgZW5kLlxyXG4gICAgbGV0IHBvaW50ZXIgPSAwO1xyXG4gICAgbGV0IGNvdW50X2RlbGV0ZSA9IDA7XHJcbiAgICBsZXQgY291bnRfaW5zZXJ0ID0gMDtcclxuICAgIGxldCB0ZXh0X2RlbGV0ZSA9ICcnO1xyXG4gICAgbGV0IHRleHRfaW5zZXJ0ID0gJyc7XHJcbiAgICBsZXQgY29tbW9ubGVuZ3RoO1xyXG4gICAgd2hpbGUgKHBvaW50ZXIgPCBkaWZmcy5sZW5ndGgpIHtcclxuICAgICAgc3dpdGNoIChkaWZmc1twb2ludGVyXVswXSkge1xyXG4gICAgICAgIGNhc2UgRGlmZk9wLkluc2VydDpcclxuICAgICAgICAgIGNvdW50X2luc2VydCsrO1xyXG4gICAgICAgICAgdGV4dF9pbnNlcnQgKz0gZGlmZnNbcG9pbnRlcl1bMV07XHJcbiAgICAgICAgICBwb2ludGVyKys7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIERpZmZPcC5EZWxldGU6XHJcbiAgICAgICAgICBjb3VudF9kZWxldGUrKztcclxuICAgICAgICAgIHRleHRfZGVsZXRlICs9IGRpZmZzW3BvaW50ZXJdWzFdO1xyXG4gICAgICAgICAgcG9pbnRlcisrO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBEaWZmT3AuRXF1YWw6XHJcbiAgICAgICAgICAvLyBVcG9uIHJlYWNoaW5nIGFuIGVxdWFsaXR5LCBjaGVjayBmb3IgcHJpb3IgcmVkdW5kYW5jaWVzLlxyXG4gICAgICAgICAgaWYgKGNvdW50X2RlbGV0ZSArIGNvdW50X2luc2VydCA+IDEpIHtcclxuICAgICAgICAgICAgaWYgKGNvdW50X2RlbGV0ZSAhPT0gMCAmJiBjb3VudF9pbnNlcnQgIT09IDApIHtcclxuICAgICAgICAgICAgICAvLyBGYWN0b3Igb3V0IGFueSBjb21tb24gcHJlZml4aWVzLlxyXG4gICAgICAgICAgICAgIGNvbW1vbmxlbmd0aCA9IHRoaXMuZGlmZl9jb21tb25QcmVmaXgodGV4dF9pbnNlcnQsIHRleHRfZGVsZXRlKTtcclxuICAgICAgICAgICAgICBpZiAoY29tbW9ubGVuZ3RoICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoKHBvaW50ZXIgLSBjb3VudF9kZWxldGUgLSBjb3VudF9pbnNlcnQpID4gMCAmJlxyXG4gICAgICAgICAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgLSBjb3VudF9kZWxldGUgLSBjb3VudF9pbnNlcnQgLSAxXVswXSA9PVxyXG4gICAgICAgICAgICAgICAgICAgIERpZmZPcC5FcXVhbCkge1xyXG4gICAgICAgICAgICAgICAgICBkaWZmc1twb2ludGVyIC0gY291bnRfZGVsZXRlIC0gY291bnRfaW5zZXJ0IC0gMV1bMV0gKz1cclxuICAgICAgICAgICAgICAgICAgICAgIHRleHRfaW5zZXJ0LnN1YnN0cmluZygwLCBjb21tb25sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgZGlmZnMuc3BsaWNlKDAsIDAsIFtEaWZmT3AuRXF1YWwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dF9pbnNlcnQuc3Vic3RyaW5nKDAsIGNvbW1vbmxlbmd0aCldKTtcclxuICAgICAgICAgICAgICAgICAgcG9pbnRlcisrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGV4dF9pbnNlcnQgPSB0ZXh0X2luc2VydC5zdWJzdHJpbmcoY29tbW9ubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIHRleHRfZGVsZXRlID0gdGV4dF9kZWxldGUuc3Vic3RyaW5nKGNvbW1vbmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIC8vIEZhY3RvciBvdXQgYW55IGNvbW1vbiBzdWZmaXhpZXMuXHJcbiAgICAgICAgICAgICAgY29tbW9ubGVuZ3RoID0gdGhpcy5kaWZmX2NvbW1vblN1ZmZpeCh0ZXh0X2luc2VydCwgdGV4dF9kZWxldGUpO1xyXG4gICAgICAgICAgICAgIGlmIChjb21tb25sZW5ndGggIT09IDApIHtcclxuICAgICAgICAgICAgICAgIGRpZmZzW3BvaW50ZXJdWzFdID0gdGV4dF9pbnNlcnQuc3Vic3RyaW5nKHRleHRfaW5zZXJ0Lmxlbmd0aCAtXHJcbiAgICAgICAgICAgICAgICAgICAgY29tbW9ubGVuZ3RoKSArIGRpZmZzW3BvaW50ZXJdWzFdO1xyXG4gICAgICAgICAgICAgICAgdGV4dF9pbnNlcnQgPSB0ZXh0X2luc2VydC5zdWJzdHJpbmcoMCwgdGV4dF9pbnNlcnQubGVuZ3RoIC1cclxuICAgICAgICAgICAgICAgICAgICBjb21tb25sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgdGV4dF9kZWxldGUgPSB0ZXh0X2RlbGV0ZS5zdWJzdHJpbmcoMCwgdGV4dF9kZWxldGUubGVuZ3RoIC1cclxuICAgICAgICAgICAgICAgICAgICBjb21tb25sZW5ndGgpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBEZWxldGUgdGhlIG9mZmVuZGluZyByZWNvcmRzIGFuZCBhZGQgdGhlIG1lcmdlZCBvbmVzLlxyXG4gICAgICAgICAgICBpZiAoY291bnRfZGVsZXRlID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIgLSBjb3VudF9pbnNlcnQsXHJcbiAgICAgICAgICAgICAgICAgIGNvdW50X2RlbGV0ZSArIGNvdW50X2luc2VydCwgW0RpZmZPcC5JbnNlcnQsIHRleHRfaW5zZXJ0XSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY291bnRfaW5zZXJ0ID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIgLSBjb3VudF9kZWxldGUsXHJcbiAgICAgICAgICAgICAgICAgIGNvdW50X2RlbGV0ZSArIGNvdW50X2luc2VydCwgW0RpZmZPcC5EZWxldGUsIHRleHRfZGVsZXRlXSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIgLSBjb3VudF9kZWxldGUgLSBjb3VudF9pbnNlcnQsXHJcbiAgICAgICAgICAgICAgICAgIGNvdW50X2RlbGV0ZSArIGNvdW50X2luc2VydCwgW0RpZmZPcC5EZWxldGUsIHRleHRfZGVsZXRlXSxcclxuICAgICAgICAgICAgICAgICAgW0RpZmZPcC5JbnNlcnQsIHRleHRfaW5zZXJ0XSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcG9pbnRlciA9IHBvaW50ZXIgLSBjb3VudF9kZWxldGUgLSBjb3VudF9pbnNlcnQgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgKGNvdW50X2RlbGV0ZSA/IDEgOiAwKSArIChjb3VudF9pbnNlcnQgPyAxIDogMCkgKyAxO1xyXG4gICAgICAgICAgfSBlbHNlIGlmIChwb2ludGVyICE9PSAwICYmIGRpZmZzW3BvaW50ZXIgLSAxXVswXSA9PSBEaWZmT3AuRXF1YWwpIHtcclxuICAgICAgICAgICAgLy8gTWVyZ2UgdGhpcyBlcXVhbGl0eSB3aXRoIHRoZSBwcmV2aW91cyBvbmUuXHJcbiAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgLSAxXVsxXSArPSBkaWZmc1twb2ludGVyXVsxXTtcclxuICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIsIDEpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcG9pbnRlcisrO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY291bnRfaW5zZXJ0ID0gMDtcclxuICAgICAgICAgIGNvdW50X2RlbGV0ZSA9IDA7XHJcbiAgICAgICAgICB0ZXh0X2RlbGV0ZSA9ICcnO1xyXG4gICAgICAgICAgdGV4dF9pbnNlcnQgPSAnJztcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAoZGlmZnNbZGlmZnMubGVuZ3RoIC0gMV1bMV0gPT09ICcnKSB7XHJcbiAgICAgIGRpZmZzLnBvcCgpOyAgLy8gUmVtb3ZlIHRoZSBkdW1teSBlbnRyeSBhdCB0aGUgZW5kLlxyXG4gICAgfVxyXG5cclxuICAgIC8vIFNlY29uZCBwYXNzOiBsb29rIGZvciBzaW5nbGUgZWRpdHMgc3Vycm91bmRlZCBvbiBib3RoIHNpZGVzIGJ5IGVxdWFsaXRpZXNcclxuICAgIC8vIHdoaWNoIGNhbiBiZSBzaGlmdGVkIHNpZGV3YXlzIHRvIGVsaW1pbmF0ZSBhbiBlcXVhbGl0eS5cclxuICAgIC8vIGUuZzogQTxpbnM+QkE8L2lucz5DIC0+IDxpbnM+QUI8L2lucz5BQ1xyXG4gICAgbGV0IGNoYW5nZXMgPSBmYWxzZTtcclxuICAgIHBvaW50ZXIgPSAxO1xyXG4gICAgLy8gSW50ZW50aW9uYWxseSBpZ25vcmUgdGhlIGZpcnN0IGFuZCBsYXN0IGVsZW1lbnQgKGRvbid0IG5lZWQgY2hlY2tpbmcpLlxyXG4gICAgd2hpbGUgKHBvaW50ZXIgPCBkaWZmcy5sZW5ndGggLSAxKSB7XHJcbiAgICAgIGlmIChkaWZmc1twb2ludGVyIC0gMV1bMF0gPT0gRGlmZk9wLkVxdWFsICYmXHJcbiAgICAgICAgICBkaWZmc1twb2ludGVyICsgMV1bMF0gPT0gRGlmZk9wLkVxdWFsKSB7XHJcbiAgICAgICAgLy8gVGhpcyBpcyBhIHNpbmdsZSBlZGl0IHN1cnJvdW5kZWQgYnkgZXF1YWxpdGllcy5cclxuICAgICAgICBpZiAoZGlmZnNbcG9pbnRlcl1bMV0uc3Vic3RyaW5nKGRpZmZzW3BvaW50ZXJdWzFdLmxlbmd0aCAtXHJcbiAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgLSAxXVsxXS5sZW5ndGgpID09IGRpZmZzW3BvaW50ZXIgLSAxXVsxXSkge1xyXG4gICAgICAgICAgLy8gU2hpZnQgdGhlIGVkaXQgb3ZlciB0aGUgcHJldmlvdXMgZXF1YWxpdHkuXHJcbiAgICAgICAgICBkaWZmc1twb2ludGVyXVsxXSA9IGRpZmZzW3BvaW50ZXIgLSAxXVsxXSArXHJcbiAgICAgICAgICAgICAgZGlmZnNbcG9pbnRlcl1bMV0uc3Vic3RyaW5nKDAsIGRpZmZzW3BvaW50ZXJdWzFdLmxlbmd0aCAtXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgLSAxXVsxXS5sZW5ndGgpO1xyXG4gICAgICAgICAgZGlmZnNbcG9pbnRlciArIDFdWzFdID0gZGlmZnNbcG9pbnRlciAtIDFdWzFdICsgZGlmZnNbcG9pbnRlciArIDFdWzFdO1xyXG4gICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIgLSAxLCAxKTtcclxuICAgICAgICAgIGNoYW5nZXMgPSB0cnVlO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGlmZnNbcG9pbnRlcl1bMV0uc3Vic3RyaW5nKDAsIGRpZmZzW3BvaW50ZXIgKyAxXVsxXS5sZW5ndGgpID09XHJcbiAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgKyAxXVsxXSkge1xyXG4gICAgICAgICAgLy8gU2hpZnQgdGhlIGVkaXQgb3ZlciB0aGUgbmV4dCBlcXVhbGl0eS5cclxuICAgICAgICAgIGRpZmZzW3BvaW50ZXIgLSAxXVsxXSArPSBkaWZmc1twb2ludGVyICsgMV1bMV07XHJcbiAgICAgICAgICBkaWZmc1twb2ludGVyXVsxXSA9XHJcbiAgICAgICAgICAgICAgZGlmZnNbcG9pbnRlcl1bMV0uc3Vic3RyaW5nKGRpZmZzW3BvaW50ZXIgKyAxXVsxXS5sZW5ndGgpICtcclxuICAgICAgICAgICAgICBkaWZmc1twb2ludGVyICsgMV1bMV07XHJcbiAgICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciArIDEsIDEpO1xyXG4gICAgICAgICAgY2hhbmdlcyA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHBvaW50ZXIrKztcclxuICAgIH1cclxuICAgIC8vIElmIHNoaWZ0cyB3ZXJlIG1hZGUsIHRoZSBkaWZmIG5lZWRzIHJlb3JkZXJpbmcgYW5kIGFub3RoZXIgc2hpZnQgc3dlZXAuXHJcbiAgICBpZiAoY2hhbmdlcykge1xyXG4gICAgICB0aGlzLmRpZmZfY2xlYW51cE1lcmdlKGRpZmZzKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogbG9jIGlzIGEgbG9jYXRpb24gaW4gdGV4dDEsIGNvbXB1dGUgYW5kIHJldHVybiB0aGUgZXF1aXZhbGVudCBsb2NhdGlvbiBpblxyXG4gICAqIHRleHQyLlxyXG4gICAqIGUuZy4gJ1RoZSBjYXQnIHZzICdUaGUgYmlnIGNhdCcsIDEtPjEsIDUtPjhcclxuICAgKiBAcGFyYW0gIGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxyXG4gICAqIEBwYXJhbSAgbG9jIExvY2F0aW9uIHdpdGhpbiB0ZXh0MS5cclxuICAgKiBAcmV0dXJuICBMb2NhdGlvbiB3aXRoaW4gdGV4dDIuXHJcbiAgICovXHJcbiAgICBkaWZmX3hJbmRleCAoZGlmZnM6IEFycmF5PERpZmY+LCBsb2M6IG51bWJlcik6IG51bWJlciB7XHJcbiAgICBsZXQgY2hhcnMxID0gMDtcclxuICAgIGxldCBjaGFyczIgPSAwO1xyXG4gICAgbGV0IGxhc3RfY2hhcnMxID0gMDtcclxuICAgIGxldCBsYXN0X2NoYXJzMiA9IDA7XHJcbiAgICBsZXQgeDtcclxuICAgIGZvciAoeCA9IDA7IHggPCBkaWZmcy5sZW5ndGg7IHgrKykge1xyXG4gICAgICBpZiAoZGlmZnNbeF1bMF0gIT09IERpZmZPcC5JbnNlcnQpIHsgIC8vIEVxdWFsaXR5IG9yIGRlbGV0aW9uLlxyXG4gICAgICAgIGNoYXJzMSArPSBkaWZmc1t4XVsxXS5sZW5ndGg7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGRpZmZzW3hdWzBdICE9PSBEaWZmT3AuRGVsZXRlKSB7ICAvLyBFcXVhbGl0eSBvciBpbnNlcnRpb24uXHJcbiAgICAgICAgY2hhcnMyICs9IGRpZmZzW3hdWzFdLmxlbmd0aDtcclxuICAgICAgfVxyXG4gICAgICBpZiAoY2hhcnMxID4gbG9jKSB7ICAvLyBPdmVyc2hvdCB0aGUgbG9jYXRpb24uXHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgICAgbGFzdF9jaGFyczEgPSBjaGFyczE7XHJcbiAgICAgIGxhc3RfY2hhcnMyID0gY2hhcnMyO1xyXG4gICAgfVxyXG4gICAgLy8gV2FzIHRoZSBsb2NhdGlvbiB3YXMgZGVsZXRlZD9cclxuICAgIGlmIChkaWZmcy5sZW5ndGggIT0geCAmJiBkaWZmc1t4XVswXSA9PT0gRGlmZk9wLkRlbGV0ZSkge1xyXG4gICAgICByZXR1cm4gbGFzdF9jaGFyczI7XHJcbiAgICB9XHJcbiAgICAvLyBBZGQgdGhlIHJlbWFpbmluZyBjaGFyYWN0ZXIgbGVuZ3RoLlxyXG4gICAgcmV0dXJuIGxhc3RfY2hhcnMyICsgKGxvYyAtIGxhc3RfY2hhcnMxKTtcclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogQ29udmVydCBhIGRpZmYgYXJyYXkgaW50byBhIHByZXR0eSBIVE1MIHJlcG9ydC5cclxuICAgKiBAcGFyYW0gIGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxyXG4gICAqIEByZXR1cm4gIEhUTUwgcmVwcmVzZW50YXRpb24uXHJcbiAgICovXHJcbiAgICBkaWZmX3ByZXR0eUh0bWwgPSBmdW5jdGlvbihkaWZmczogQXJyYXk8RGlmZj4pOiBzdHJpbmcge1xyXG4gICAgY29uc3QgaHRtbCA9IFtdO1xyXG4gICAgY29uc3QgcGF0dGVybl9hbXAgPSAvJi9nO1xyXG4gICAgY29uc3QgcGF0dGVybl9sdCA9IC88L2c7XHJcbiAgICBjb25zdCBwYXR0ZXJuX2d0ID0gLz4vZztcclxuICAgIGNvbnN0IHBhdHRlcm5fcGFyYSA9IC9cXG4vZztcclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgZGlmZnMubGVuZ3RoOyB4KyspIHtcclxuICAgICAgY29uc3Qgb3AgPSBkaWZmc1t4XVswXTsgICAgLy8gT3BlcmF0aW9uIChpbnNlcnQsIGRlbGV0ZSwgZXF1YWwpXHJcbiAgICAgIGNvbnN0IGRhdGEgPSBkaWZmc1t4XVsxXTsgIC8vIFRleHQgb2YgY2hhbmdlLlxyXG4gICAgICBjb25zdCB0ZXh0ID0gZGF0YS5yZXBsYWNlKHBhdHRlcm5fYW1wLCAnJmFtcDsnKS5yZXBsYWNlKHBhdHRlcm5fbHQsICcmbHQ7JylcclxuICAgICAgICAgIC5yZXBsYWNlKHBhdHRlcm5fZ3QsICcmZ3Q7JykucmVwbGFjZShwYXR0ZXJuX3BhcmEsICcmcGFyYTs8YnI+Jyk7XHJcbiAgICAgIHN3aXRjaCAob3ApIHtcclxuICAgICAgICBjYXNlIERpZmZPcC5JbnNlcnQ6XHJcbiAgICAgICAgICBodG1sW3hdID0gJzxpbnMgc3R5bGU9XCJiYWNrZ3JvdW5kOiNlNmZmZTY7XCI+JyArIHRleHQgKyAnPC9pbnM+JztcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgRGlmZk9wLkRlbGV0ZTpcclxuICAgICAgICAgIGh0bWxbeF0gPSAnPGRlbCBzdHlsZT1cImJhY2tncm91bmQ6I2ZmZTZlNjtcIj4nICsgdGV4dCArICc8L2RlbD4nO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBEaWZmT3AuRXF1YWw6XHJcbiAgICAgICAgICBodG1sW3hdID0gJzxzcGFuPicgKyB0ZXh0ICsgJzwvc3Bhbj4nO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBodG1sLmpvaW4oJycpO1xyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBDb21wdXRlIGFuZCByZXR1cm4gdGhlIHNvdXJjZSB0ZXh0IChhbGwgZXF1YWxpdGllcyBhbmQgZGVsZXRpb25zKS5cclxuICAgKiBAcGFyYW0gIGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxyXG4gICAqIEByZXR1cm4gIFNvdXJjZSB0ZXh0LlxyXG4gICAqL1xyXG4gICAgZGlmZl90ZXh0MSAoZGlmZnM6IEFycmF5PERpZmY+KTogc3RyaW5nIHtcclxuICAgIGNvbnN0IHRleHQgPSBbXTtcclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgZGlmZnMubGVuZ3RoOyB4KyspIHtcclxuICAgICAgaWYgKGRpZmZzW3hdWzBdICE9PSBEaWZmT3AuSW5zZXJ0KSB7XHJcbiAgICAgICAgdGV4dFt4XSA9IGRpZmZzW3hdWzFdO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGV4dC5qb2luKCcnKTtcclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogQ29tcHV0ZSBhbmQgcmV0dXJuIHRoZSBkZXN0aW5hdGlvbiB0ZXh0IChhbGwgZXF1YWxpdGllcyBhbmQgaW5zZXJ0aW9ucykuXHJcbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cclxuICAgKiBAcmV0dXJuICBEZXN0aW5hdGlvbiB0ZXh0LlxyXG4gICAqL1xyXG4gICAgZGlmZl90ZXh0MiAoZGlmZnM6IEFycmF5PERpZmY+KTogc3RyaW5nIHtcclxuICAgIGNvbnN0IHRleHQgPSBbXTtcclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgZGlmZnMubGVuZ3RoOyB4KyspIHtcclxuICAgICAgaWYgKGRpZmZzW3hdWzBdICE9PSBEaWZmT3AuRGVsZXRlKSB7XHJcbiAgICAgICAgdGV4dFt4XSA9IGRpZmZzW3hdWzFdO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGV4dC5qb2luKCcnKTtcclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogQ29tcHV0ZSB0aGUgTGV2ZW5zaHRlaW4gZGlzdGFuY2U7IHRoZSBudW1iZXIgb2YgaW5zZXJ0ZWQsIGRlbGV0ZWQgb3JcclxuICAgKiBzdWJzdGl0dXRlZCBjaGFyYWN0ZXJzLlxyXG4gICAqIEBwYXJhbSAgZGlmZnMgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXHJcbiAgICogQHJldHVybiAgTnVtYmVyIG9mIGNoYW5nZXMuXHJcbiAgICovXHJcbiAgICBkaWZmX2xldmVuc2h0ZWluIChkaWZmczogQXJyYXk8RGlmZj4pOiBudW1iZXIge1xyXG4gICAgbGV0IGxldmVuc2h0ZWluID0gMDtcclxuICAgIGxldCBpbnNlcnRpb25zID0gMDtcclxuICAgIGxldCBkZWxldGlvbnMgPSAwO1xyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBkaWZmcy5sZW5ndGg7IHgrKykge1xyXG4gICAgICBjb25zdCBvcCA9IGRpZmZzW3hdWzBdO1xyXG4gICAgICBjb25zdCBkYXRhID0gZGlmZnNbeF1bMV07XHJcbiAgICAgIHN3aXRjaCAob3ApIHtcclxuICAgICAgICBjYXNlIERpZmZPcC5JbnNlcnQ6XHJcbiAgICAgICAgICBpbnNlcnRpb25zICs9IGRhdGEubGVuZ3RoO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBEaWZmT3AuRGVsZXRlOlxyXG4gICAgICAgICAgZGVsZXRpb25zICs9IGRhdGEubGVuZ3RoO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBEaWZmT3AuRXF1YWw6XHJcbiAgICAgICAgICAvLyBBIGRlbGV0aW9uIGFuZCBhbiBpbnNlcnRpb24gaXMgb25lIHN1YnN0aXR1dGlvbi5cclxuICAgICAgICAgIGxldmVuc2h0ZWluICs9IE1hdGgubWF4KGluc2VydGlvbnMsIGRlbGV0aW9ucyk7XHJcbiAgICAgICAgICBpbnNlcnRpb25zID0gMDtcclxuICAgICAgICAgIGRlbGV0aW9ucyA9IDA7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgbGV2ZW5zaHRlaW4gKz0gTWF0aC5tYXgoaW5zZXJ0aW9ucywgZGVsZXRpb25zKTtcclxuICAgIHJldHVybiBsZXZlbnNodGVpbjtcclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogQ3J1c2ggdGhlIGRpZmYgaW50byBhbiBlbmNvZGVkIHN0cmluZyB3aGljaCBkZXNjcmliZXMgdGhlIG9wZXJhdGlvbnNcclxuICAgKiByZXF1aXJlZCB0byB0cmFuc2Zvcm0gdGV4dDEgaW50byB0ZXh0Mi5cclxuICAgKiBFLmcuID0zXFx0LTJcXHQraW5nICAtPiBLZWVwIDMgY2hhcnMsIGRlbGV0ZSAyIGNoYXJzLCBpbnNlcnQgJ2luZycuXHJcbiAgICogT3BlcmF0aW9ucyBhcmUgdGFiLXNlcGFyYXRlZC4gIEluc2VydGVkIHRleHQgaXMgZXNjYXBlZCB1c2luZyAleHggbm90YXRpb24uXHJcbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cclxuICAgKiBAcmV0dXJuICBEZWx0YSB0ZXh0LlxyXG4gICAqL1xyXG4gICAgZGlmZl90b0RlbHRhIChkaWZmczogQXJyYXk8RGlmZj4pOiBzdHJpbmcge1xyXG4gICAgY29uc3QgdGV4dCA9IFtdO1xyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBkaWZmcy5sZW5ndGg7IHgrKykge1xyXG4gICAgICBzd2l0Y2ggKGRpZmZzW3hdWzBdKSB7XHJcbiAgICAgICAgY2FzZSBEaWZmT3AuSW5zZXJ0OlxyXG4gICAgICAgICAgdGV4dFt4XSA9ICcrJyArIGVuY29kZVVSSShkaWZmc1t4XVsxXSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIERpZmZPcC5EZWxldGU6XHJcbiAgICAgICAgICB0ZXh0W3hdID0gJy0nICsgZGlmZnNbeF1bMV0ubGVuZ3RoO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBEaWZmT3AuRXF1YWw6XHJcbiAgICAgICAgICB0ZXh0W3hdID0gJz0nICsgZGlmZnNbeF1bMV0ubGVuZ3RoO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0ZXh0LmpvaW4oJ1xcdCcpLnJlcGxhY2UoLyUyMC9nLCAnICcpO1xyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBHaXZlbiB0aGUgb3JpZ2luYWwgdGV4dDEsIGFuZCBhbiBlbmNvZGVkIHN0cmluZyB3aGljaCBkZXNjcmliZXMgdGhlXHJcbiAgICogb3BlcmF0aW9ucyByZXF1aXJlZCB0byB0cmFuc2Zvcm0gdGV4dDEgaW50byB0ZXh0MiwgY29tcHV0ZSB0aGUgZnVsbCBkaWZmLlxyXG4gICAqIEBwYXJhbSAgdGV4dDEgU291cmNlIHN0cmluZyBmb3IgdGhlIGRpZmYuXHJcbiAgICogQHBhcmFtICBkZWx0YSBEZWx0YSB0ZXh0LlxyXG4gICAqIEByZXR1cm4gIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxyXG4gICAqIEB0aHJvd3MgeyFFcnJvcn0gSWYgaW52YWxpZCBpbnB1dC5cclxuICAgKi9cclxuICAgIGRpZmZfZnJvbURlbHRhICh0ZXh0MTogc3RyaW5nLCBkZWx0YTogc3RyaW5nKSB7XHJcbiAgICBjb25zdCBkaWZmcyA9IFtdO1xyXG4gICAgbGV0IGRpZmZzTGVuZ3RoID0gMDsgIC8vIEtlZXBpbmcgb3VyIG93biBsZW5ndGggY29uc3QgaXMgZmFzdGVyIGluIEpTLlxyXG4gICAgbGV0IHBvaW50ZXIgPSAwOyAgLy8gQ3Vyc29yIGluIHRleHQxXHJcbiAgICBjb25zdCB0b2tlbnMgPSBkZWx0YS5zcGxpdCgvXFx0L2cpO1xyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCB0b2tlbnMubGVuZ3RoOyB4KyspIHtcclxuICAgICAgLy8gRWFjaCB0b2tlbiBiZWdpbnMgd2l0aCBhIG9uZSBjaGFyYWN0ZXIgcGFyYW1ldGVyIHdoaWNoIHNwZWNpZmllcyB0aGVcclxuICAgICAgLy8gb3BlcmF0aW9uIG9mIHRoaXMgdG9rZW4gKGRlbGV0ZSwgaW5zZXJ0LCBlcXVhbGl0eSkuXHJcbiAgICAgIGNvbnN0IHBhcmFtID0gdG9rZW5zW3hdLnN1YnN0cmluZygxKTtcclxuICAgICAgc3dpdGNoICh0b2tlbnNbeF0uY2hhckF0KDApKSB7XHJcbiAgICAgICAgY2FzZSAnKyc6XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBkaWZmc1tkaWZmc0xlbmd0aCsrXSA9IFtEaWZmT3AuSW5zZXJ0LCBkZWNvZGVVUkkocGFyYW0pXTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgICAgIC8vIE1hbGZvcm1lZCBVUkkgc2VxdWVuY2UuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSWxsZWdhbCBlc2NhcGUgaW4gZGlmZl9mcm9tRGVsdGE6ICcgKyBwYXJhbSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICctJzpcclxuICAgICAgICAgIC8vIEZhbGwgdGhyb3VnaC5cclxuICAgICAgICBjYXNlICc9JzpcclxuICAgICAgICAgIGNvbnN0IG4gPSBwYXJzZUludChwYXJhbSwgMTApO1xyXG4gICAgICAgICAgaWYgKGlzTmFOKG4pIHx8IG4gPCAwKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBudW1iZXIgaW4gZGlmZl9mcm9tRGVsdGE6ICcgKyBwYXJhbSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjb25zdCB0ZXh0ID0gdGV4dDEuc3Vic3RyaW5nKHBvaW50ZXIsIHBvaW50ZXIgKz0gbik7XHJcbiAgICAgICAgICBpZiAodG9rZW5zW3hdLmNoYXJBdCgwKSA9PSAnPScpIHtcclxuICAgICAgICAgICAgZGlmZnNbZGlmZnNMZW5ndGgrK10gPSBbRGlmZk9wLkVxdWFsLCB0ZXh0XTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGRpZmZzW2RpZmZzTGVuZ3RoKytdID0gW0RpZmZPcC5EZWxldGUsIHRleHRdO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgIC8vIEJsYW5rIHRva2VucyBhcmUgb2sgKGZyb20gYSB0cmFpbGluZyBcXHQpLlxyXG4gICAgICAgICAgLy8gQW55dGhpbmcgZWxzZSBpcyBhbiBlcnJvci5cclxuICAgICAgICAgIGlmICh0b2tlbnNbeF0pIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGRpZmYgb3BlcmF0aW9uIGluIGRpZmZfZnJvbURlbHRhOiAnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vuc1t4XSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGlmIChwb2ludGVyICE9IHRleHQxLmxlbmd0aCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RlbHRhIGxlbmd0aCAoJyArIHBvaW50ZXIgK1xyXG4gICAgICAgICAgJykgZG9lcyBub3QgZXF1YWwgc291cmNlIHRleHQgbGVuZ3RoICgnICsgdGV4dDEubGVuZ3RoICsgJykuJyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZGlmZnM7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogTG9jYXRlIHRoZSBiZXN0IGluc3RhbmNlIG9mICdwYXR0ZXJuJyBpbiAndGV4dCcgbmVhciAnbG9jJy5cclxuICAgKiBAcGFyYW0gIHRleHQgVGhlIHRleHQgdG8gc2VhcmNoLlxyXG4gICAqIEBwYXJhbSAgcGF0dGVybiBUaGUgcGF0dGVybiB0byBzZWFyY2ggZm9yLlxyXG4gICAqIEBwYXJhbSAgbG9jIFRoZSBsb2NhdGlvbiB0byBzZWFyY2ggYXJvdW5kLlxyXG4gICAqIEByZXR1cm4gIEJlc3QgbWF0Y2ggaW5kZXggb3IgLTEuXHJcbiAgICovXHJcbiAgICBtYXRjaF9tYWluICh0ZXh0OiBzdHJpbmcsIHBhdHRlcm46IHN0cmluZywgbG9jOiBudW1iZXIpOiBudW1iZXIge1xyXG4gICAgLy8gQ2hlY2sgZm9yIG51bGwgaW5wdXRzLlxyXG4gICAgaWYgKHRleHQgPT0gbnVsbCB8fCBwYXR0ZXJuID09IG51bGwgfHwgbG9jID09IG51bGwpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOdWxsIGlucHV0LiAobWF0Y2hfbWFpbiknKTtcclxuICAgIH1cclxuXHJcbiAgICBsb2MgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihsb2MsIHRleHQubGVuZ3RoKSk7XHJcbiAgICBpZiAodGV4dCA9PSBwYXR0ZXJuKSB7XHJcbiAgICAgIC8vIFNob3J0Y3V0IChwb3RlbnRpYWxseSBub3QgZ3VhcmFudGVlZCBieSB0aGUgYWxnb3JpdGhtKVxyXG4gICAgICByZXR1cm4gMDtcclxuICAgIH0gZWxzZSBpZiAoIXRleHQubGVuZ3RoKSB7XHJcbiAgICAgIC8vIE5vdGhpbmcgdG8gbWF0Y2guXHJcbiAgICAgIHJldHVybiAtMTtcclxuICAgIH0gZWxzZSBpZiAodGV4dC5zdWJzdHJpbmcobG9jLCBsb2MgKyBwYXR0ZXJuLmxlbmd0aCkgPT0gcGF0dGVybikge1xyXG4gICAgICAvLyBQZXJmZWN0IG1hdGNoIGF0IHRoZSBwZXJmZWN0IHNwb3QhICAoSW5jbHVkZXMgY2FzZSBvZiBudWxsIHBhdHRlcm4pXHJcbiAgICAgIHJldHVybiBsb2M7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBEbyBhIGZ1enp5IGNvbXBhcmUuXHJcbiAgICAgIHJldHVybiB0aGlzLm1hdGNoX2JpdGFwXyh0ZXh0LCBwYXR0ZXJuLCBsb2MpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBMb2NhdGUgdGhlIGJlc3QgaW5zdGFuY2Ugb2YgJ3BhdHRlcm4nIGluICd0ZXh0JyBuZWFyICdsb2MnIHVzaW5nIHRoZVxyXG4gICAqIEJpdGFwIGFsZ29yaXRobS5cclxuICAgKiBAcGFyYW0gIHRleHQgVGhlIHRleHQgdG8gc2VhcmNoLlxyXG4gICAqIEBwYXJhbSAgcGF0dGVybiBUaGUgcGF0dGVybiB0byBzZWFyY2ggZm9yLlxyXG4gICAqIEBwYXJhbSAgbG9jIFRoZSBsb2NhdGlvbiB0byBzZWFyY2ggYXJvdW5kLlxyXG4gICAqIEByZXR1cm4gIEJlc3QgbWF0Y2ggaW5kZXggb3IgLTEuXHJcblxyXG4gICAqL1xyXG4gICAgbWF0Y2hfYml0YXBfICh0ZXh0OiBzdHJpbmcsIHBhdHRlcm46IHN0cmluZywgbG9jOiBudW1iZXIpOiBudW1iZXIge1xyXG4gICAgaWYgKHBhdHRlcm4ubGVuZ3RoID4gdGhpcy5NYXRjaF9NYXhCaXRzKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignUGF0dGVybiB0b28gbG9uZyBmb3IgdGhpcyBicm93c2VyLicpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEluaXRpYWxpc2UgdGhlIGFscGhhYmV0LlxyXG4gICAgY29uc3QgcyA9IHRoaXMubWF0Y2hfYWxwaGFiZXRfKHBhdHRlcm4pO1xyXG5cclxuICAgIGNvbnN0IGRtcCA9IHRoaXM7ICAvLyAndGhpcycgYmVjb21lcyAnd2luZG93JyBpbiBhIGNsb3N1cmUuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb21wdXRlIGFuZCByZXR1cm4gdGhlIHNjb3JlIGZvciBhIG1hdGNoIHdpdGggZSBlcnJvcnMgYW5kIHggbG9jYXRpb24uXHJcbiAgICAgKiBBY2Nlc3NlcyBsb2MgYW5kIHBhdHRlcm4gdGhyb3VnaCBiZWluZyBhIGNsb3N1cmUuXHJcbiAgICAgKiBAcGFyYW0gIGUgTnVtYmVyIG9mIGVycm9ycyBpbiBtYXRjaC5cclxuICAgICAqIEBwYXJhbSAgeCBMb2NhdGlvbiBvZiBtYXRjaC5cclxuICAgICAqIEByZXR1cm4gIE92ZXJhbGwgc2NvcmUgZm9yIG1hdGNoICgwLjAgPSBnb29kLCAxLjAgPSBiYWQpLlxyXG5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gbWF0Y2hfYml0YXBTY29yZV8oZTogbnVtYmVyLCB4OiBudW1iZXIpOiBudW1iZXIge1xyXG4gICAgICBjb25zdCBhY2N1cmFjeSA9IGUgLyBwYXR0ZXJuLmxlbmd0aDtcclxuICAgICAgY29uc3QgcHJveGltaXR5ID0gTWF0aC5hYnMobG9jIC0geCk7XHJcbiAgICAgIGlmICghZG1wLk1hdGNoX0Rpc3RhbmNlKSB7XHJcbiAgICAgICAgLy8gRG9kZ2UgZGl2aWRlIGJ5IHplcm8gZXJyb3IuXHJcbiAgICAgICAgcmV0dXJuIHByb3hpbWl0eSA/IDEuMCA6IGFjY3VyYWN5O1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBhY2N1cmFjeSArIChwcm94aW1pdHkgLyBkbXAuTWF0Y2hfRGlzdGFuY2UpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEhpZ2hlc3Qgc2NvcmUgYmV5b25kIHdoaWNoIHdlIGdpdmUgdXAuXHJcbiAgICBsZXQgc2NvcmVfdGhyZXNob2xkID0gdGhpcy5NYXRjaF9UaHJlc2hvbGQ7XHJcbiAgICAvLyBJcyB0aGVyZSBhIG5lYXJieSBleGFjdCBtYXRjaD8gKHNwZWVkdXApXHJcbiAgICBsZXQgYmVzdF9sb2MgPSB0ZXh0LmluZGV4T2YocGF0dGVybiwgbG9jKTtcclxuICAgIGlmIChiZXN0X2xvYyAhPSAtMSkge1xyXG4gICAgICBzY29yZV90aHJlc2hvbGQgPSBNYXRoLm1pbihtYXRjaF9iaXRhcFNjb3JlXygwLCBiZXN0X2xvYyksIHNjb3JlX3RocmVzaG9sZCk7XHJcbiAgICAgIC8vIFdoYXQgYWJvdXQgaW4gdGhlIG90aGVyIGRpcmVjdGlvbj8gKHNwZWVkdXApXHJcbiAgICAgIGJlc3RfbG9jID0gdGV4dC5sYXN0SW5kZXhPZihwYXR0ZXJuLCBsb2MgKyBwYXR0ZXJuLmxlbmd0aCk7XHJcbiAgICAgIGlmIChiZXN0X2xvYyAhPSAtMSkge1xyXG4gICAgICAgIHNjb3JlX3RocmVzaG9sZCA9XHJcbiAgICAgICAgICAgIE1hdGgubWluKG1hdGNoX2JpdGFwU2NvcmVfKDAsIGJlc3RfbG9jKSwgc2NvcmVfdGhyZXNob2xkKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIEluaXRpYWxpc2UgdGhlIGJpdCBhcnJheXMuXHJcbiAgICBjb25zdCBtYXRjaG1hc2sgPSAxIDw8IChwYXR0ZXJuLmxlbmd0aCAtIDEpO1xyXG4gICAgYmVzdF9sb2MgPSAtMTtcclxuXHJcbiAgICBsZXQgYmluX21pbiwgYmluX21pZDtcclxuICAgIGxldCBiaW5fbWF4ID0gcGF0dGVybi5sZW5ndGggKyB0ZXh0Lmxlbmd0aDtcclxuICAgIGxldCBsYXN0X3JkO1xyXG4gICAgZm9yIChsZXQgZCA9IDA7IGQgPCBwYXR0ZXJuLmxlbmd0aDsgZCsrKSB7XHJcbiAgICAgIC8vIFNjYW4gZm9yIHRoZSBiZXN0IG1hdGNoOyBlYWNoIGl0ZXJhdGlvbiBhbGxvd3MgZm9yIG9uZSBtb3JlIGVycm9yLlxyXG4gICAgICAvLyBSdW4gYSBiaW5hcnkgc2VhcmNoIHRvIGRldGVybWluZSBob3cgZmFyIGZyb20gJ2xvYycgd2UgY2FuIHN0cmF5IGF0IHRoaXNcclxuICAgICAgLy8gZXJyb3IgbGV2ZWwuXHJcbiAgICAgIGJpbl9taW4gPSAwO1xyXG4gICAgICBiaW5fbWlkID0gYmluX21heDtcclxuICAgICAgd2hpbGUgKGJpbl9taW4gPCBiaW5fbWlkKSB7XHJcbiAgICAgICAgaWYgKG1hdGNoX2JpdGFwU2NvcmVfKGQsIGxvYyArIGJpbl9taWQpIDw9IHNjb3JlX3RocmVzaG9sZCkge1xyXG4gICAgICAgICAgYmluX21pbiA9IGJpbl9taWQ7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGJpbl9tYXggPSBiaW5fbWlkO1xyXG4gICAgICAgIH1cclxuICAgICAgICBiaW5fbWlkID0gTWF0aC5mbG9vcigoYmluX21heCAtIGJpbl9taW4pIC8gMiArIGJpbl9taW4pO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIFVzZSB0aGUgcmVzdWx0IGZyb20gdGhpcyBpdGVyYXRpb24gYXMgdGhlIG1heGltdW0gZm9yIHRoZSBuZXh0LlxyXG4gICAgICBiaW5fbWF4ID0gYmluX21pZDtcclxuICAgICAgbGV0IHN0YXJ0ID0gTWF0aC5tYXgoMSwgbG9jIC0gYmluX21pZCArIDEpO1xyXG4gICAgICBjb25zdCBmaW5pc2ggPSBNYXRoLm1pbihsb2MgKyBiaW5fbWlkLCB0ZXh0Lmxlbmd0aCkgKyBwYXR0ZXJuLmxlbmd0aDtcclxuXHJcbiAgICAgIGNvbnN0IHJkID0gQXJyYXkoZmluaXNoICsgMik7XHJcbiAgICAgIHJkW2ZpbmlzaCArIDFdID0gKDEgPDwgZCkgLSAxO1xyXG4gICAgICBmb3IgKGxldCBqID0gZmluaXNoOyBqID49IHN0YXJ0OyBqLS0pIHtcclxuICAgICAgICAvLyBUaGUgYWxwaGFiZXQgKHMpIGlzIGEgc3BhcnNlIGhhc2gsIHNvIHRoZSBmb2xsb3dpbmcgbGluZSBnZW5lcmF0ZXNcclxuICAgICAgICAvLyB3YXJuaW5ncy5cclxuICAgICAgICBjb25zdCBjaGFyTWF0Y2ggPSBzW3RleHQuY2hhckF0KGogLSAxKV07XHJcbiAgICAgICAgaWYgKGQgPT09IDApIHsgIC8vIEZpcnN0IHBhc3M6IGV4YWN0IG1hdGNoLlxyXG4gICAgICAgICAgcmRbal0gPSAoKHJkW2ogKyAxXSA8PCAxKSB8IDEpICYgY2hhck1hdGNoO1xyXG4gICAgICAgIH0gZWxzZSB7ICAvLyBTdWJzZXF1ZW50IHBhc3NlczogZnV6enkgbWF0Y2guXHJcbiAgICAgICAgICByZFtqXSA9ICgoKHJkW2ogKyAxXSA8PCAxKSB8IDEpICYgY2hhck1hdGNoKSB8XHJcbiAgICAgICAgICAgICAgICAgICgoKGxhc3RfcmRbaiArIDFdIHwgbGFzdF9yZFtqXSkgPDwgMSkgfCAxKSB8XHJcbiAgICAgICAgICAgICAgICAgIGxhc3RfcmRbaiArIDFdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocmRbal0gJiBtYXRjaG1hc2spIHtcclxuICAgICAgICAgIGNvbnN0IHNjb3JlID0gbWF0Y2hfYml0YXBTY29yZV8oZCwgaiAtIDEpO1xyXG4gICAgICAgICAgLy8gVGhpcyBtYXRjaCB3aWxsIGFsbW9zdCBjZXJ0YWlubHkgYmUgYmV0dGVyIHRoYW4gYW55IGV4aXN0aW5nIG1hdGNoLlxyXG4gICAgICAgICAgLy8gQnV0IGNoZWNrIGFueXdheS5cclxuICAgICAgICAgIGlmIChzY29yZSA8PSBzY29yZV90aHJlc2hvbGQpIHtcclxuICAgICAgICAgICAgLy8gVG9sZCB5b3Ugc28uXHJcbiAgICAgICAgICAgIHNjb3JlX3RocmVzaG9sZCA9IHNjb3JlO1xyXG4gICAgICAgICAgICBiZXN0X2xvYyA9IGogLSAxO1xyXG4gICAgICAgICAgICBpZiAoYmVzdF9sb2MgPiBsb2MpIHtcclxuICAgICAgICAgICAgICAvLyBXaGVuIHBhc3NpbmcgbG9jLCBkb24ndCBleGNlZWQgb3VyIGN1cnJlbnQgZGlzdGFuY2UgZnJvbSBsb2MuXHJcbiAgICAgICAgICAgICAgc3RhcnQgPSBNYXRoLm1heCgxLCAyICogbG9jIC0gYmVzdF9sb2MpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIC8vIEFscmVhZHkgcGFzc2VkIGxvYywgZG93bmhpbGwgZnJvbSBoZXJlIG9uIGluLlxyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIC8vIE5vIGhvcGUgZm9yIGEgKGJldHRlcikgbWF0Y2ggYXQgZ3JlYXRlciBlcnJvciBsZXZlbHMuXHJcbiAgICAgIGlmIChtYXRjaF9iaXRhcFNjb3JlXyhkICsgMSwgbG9jKSA+IHNjb3JlX3RocmVzaG9sZCkge1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICAgIGxhc3RfcmQgPSByZDtcclxuICAgIH1cclxuICAgIHJldHVybiBiZXN0X2xvYztcclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGlzZSB0aGUgYWxwaGFiZXQgZm9yIHRoZSBCaXRhcCBhbGdvcml0aG0uXHJcbiAgICogQHBhcmFtICBwYXR0ZXJuIFRoZSB0ZXh0IHRvIGVuY29kZS5cclxuICAgKiBAcmV0dXJuICBIYXNoIG9mIGNoYXJhY3RlciBsb2NhdGlvbnMuXHJcblxyXG4gICAqL1xyXG4gICAgbWF0Y2hfYWxwaGFiZXRfIChwYXR0ZXJuOiBzdHJpbmcpOiB7IFtjaGFyYWN0ZXI6IHN0cmluZ106IG51bWJlciB9IHtcclxuICAgIGNvbnN0IHM6IHsgW2NoYXJhY3Rlcjogc3RyaW5nXTogbnVtYmVyIH0gPSB7fTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0dGVybi5sZW5ndGg7IGkrKykge1xyXG4gICAgICBzW3BhdHRlcm4uY2hhckF0KGkpXSA9IDA7XHJcbiAgICB9XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhdHRlcm4ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgc1twYXR0ZXJuLmNoYXJBdChpKV0gfD0gMSA8PCAocGF0dGVybi5sZW5ndGggLSBpIC0gMSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcztcclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogSW5jcmVhc2UgdGhlIGNvbnRleHQgdW50aWwgaXQgaXMgdW5pcXVlLFxyXG4gICAqIGJ1dCBkb24ndCBsZXQgdGhlIHBhdHRlcm4gZXhwYW5kIGJleW9uZCBNYXRjaF9NYXhCaXRzLlxyXG4gICAqIEBwYXJhbSAgcGF0Y2ggVGhlIHBhdGNoIHRvIGdyb3cuXHJcbiAgICogQHBhcmFtICB0ZXh0IFNvdXJjZSB0ZXh0LlxyXG5cclxuICAgKi9cclxuICAgIHBhdGNoX2FkZENvbnRleHRfIChwYXRjaDogcGF0Y2hfb2JqLCB0ZXh0OiBzdHJpbmcpIHtcclxuICAgIGlmICh0ZXh0Lmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGxldCBwYXR0ZXJuID0gdGV4dC5zdWJzdHJpbmcocGF0Y2guc3RhcnQyLCBwYXRjaC5zdGFydDIgKyBwYXRjaC5sZW5ndGgxKTtcclxuICAgIGxldCBwYWRkaW5nID0gMDtcclxuXHJcbiAgICAvLyBMb29rIGZvciB0aGUgZmlyc3QgYW5kIGxhc3QgbWF0Y2hlcyBvZiBwYXR0ZXJuIGluIHRleHQuICBJZiB0d28gZGlmZmVyZW50XHJcbiAgICAvLyBtYXRjaGVzIGFyZSBmb3VuZCwgaW5jcmVhc2UgdGhlIHBhdHRlcm4gbGVuZ3RoLlxyXG4gICAgd2hpbGUgKHRleHQuaW5kZXhPZihwYXR0ZXJuKSAhPSB0ZXh0Lmxhc3RJbmRleE9mKHBhdHRlcm4pICYmXHJcbiAgICAgICAgICBwYXR0ZXJuLmxlbmd0aCA8IHRoaXMuTWF0Y2hfTWF4Qml0cyAtIHRoaXMuUGF0Y2hfTWFyZ2luIC1cclxuICAgICAgICAgIHRoaXMuUGF0Y2hfTWFyZ2luKSB7XHJcbiAgICAgIHBhZGRpbmcgKz0gdGhpcy5QYXRjaF9NYXJnaW47XHJcbiAgICAgIHBhdHRlcm4gPSB0ZXh0LnN1YnN0cmluZyhwYXRjaC5zdGFydDIgLSBwYWRkaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRjaC5zdGFydDIgKyBwYXRjaC5sZW5ndGgxICsgcGFkZGluZyk7XHJcbiAgICB9XHJcbiAgICAvLyBBZGQgb25lIGNodW5rIGZvciBnb29kIGx1Y2suXHJcbiAgICBwYWRkaW5nICs9IHRoaXMuUGF0Y2hfTWFyZ2luO1xyXG5cclxuICAgIC8vIEFkZCB0aGUgcHJlZml4LlxyXG4gICAgY29uc3QgcHJlZml4ID0gdGV4dC5zdWJzdHJpbmcocGF0Y2guc3RhcnQyIC0gcGFkZGluZywgcGF0Y2guc3RhcnQyKTtcclxuICAgIGlmIChwcmVmaXgpIHtcclxuICAgICAgcGF0Y2guZGlmZnMudW5zaGlmdChbRGlmZk9wLkVxdWFsLCBwcmVmaXhdKTtcclxuICAgIH1cclxuICAgIC8vIEFkZCB0aGUgc3VmZml4LlxyXG4gICAgY29uc3Qgc3VmZml4ID0gdGV4dC5zdWJzdHJpbmcocGF0Y2guc3RhcnQyICsgcGF0Y2gubGVuZ3RoMSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRjaC5zdGFydDIgKyBwYXRjaC5sZW5ndGgxICsgcGFkZGluZyk7XHJcbiAgICBpZiAoc3VmZml4KSB7XHJcbiAgICAgIHBhdGNoLmRpZmZzLnB1c2goW0RpZmZPcC5FcXVhbCwgc3VmZml4XSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUm9sbCBiYWNrIHRoZSBzdGFydCBwb2ludHMuXHJcbiAgICBwYXRjaC5zdGFydDEgLT0gcHJlZml4Lmxlbmd0aDtcclxuICAgIHBhdGNoLnN0YXJ0MiAtPSBwcmVmaXgubGVuZ3RoO1xyXG4gICAgLy8gRXh0ZW5kIHRoZSBsZW5ndGhzLlxyXG4gICAgcGF0Y2gubGVuZ3RoMSArPSBwcmVmaXgubGVuZ3RoICsgc3VmZml4Lmxlbmd0aDtcclxuICAgIHBhdGNoLmxlbmd0aDIgKz0gcHJlZml4Lmxlbmd0aCArIHN1ZmZpeC5sZW5ndGg7XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIENvbXB1dGUgYSBsaXN0IG9mIHBhdGNoZXMgdG8gdHVybiB0ZXh0MSBpbnRvIHRleHQyLlxyXG4gICAqIFVzZSBkaWZmcyBpZiBwcm92aWRlZCwgb3RoZXJ3aXNlIGNvbXB1dGUgaXQgb3Vyc2VsdmVzLlxyXG4gICAqIFRoZXJlIGFyZSBmb3VyIHdheXMgdG8gY2FsbCB0aGlzIGZ1bmN0aW9uLCBkZXBlbmRpbmcgb24gd2hhdCBkYXRhIGlzXHJcbiAgICogYXZhaWxhYmxlIHRvIHRoZSBjYWxsZXI6XHJcbiAgICogTWV0aG9kIDE6XHJcbiAgICogYSA9IHRleHQxLCBiID0gdGV4dDJcclxuICAgKiBNZXRob2QgMjpcclxuICAgKiBhID0gZGlmZnNcclxuICAgKiBNZXRob2QgMyAob3B0aW1hbCk6XHJcbiAgICogYSA9IHRleHQxLCBiID0gZGlmZnNcclxuICAgKiBNZXRob2QgNCAoZGVwcmVjYXRlZCwgdXNlIG1ldGhvZCAzKTpcclxuICAgKiBhID0gdGV4dDEsIGIgPSB0ZXh0MiwgYyA9IGRpZmZzXHJcbiAgICpcclxuICAgKiBAcGFyYW0gIGEgdGV4dDEgKG1ldGhvZHMgMSwzLDQpIG9yXHJcbiAgICogQXJyYXkgb2YgZGlmZiB0dXBsZXMgZm9yIHRleHQxIHRvIHRleHQyIChtZXRob2QgMikuXHJcbiAgICogQHBhcmFtICBvcHRfYiB0ZXh0MiAobWV0aG9kcyAxLDQpIG9yXHJcbiAgICogQXJyYXkgb2YgZGlmZiB0dXBsZXMgZm9yIHRleHQxIHRvIHRleHQyIChtZXRob2QgMykgb3IgdW5kZWZpbmVkIChtZXRob2QgMikuXHJcbiAgICogQHBhcmFtICBvcHRfYyBBcnJheSBvZiBkaWZmIHR1cGxlc1xyXG4gICAqIGZvciB0ZXh0MSB0byB0ZXh0MiAobWV0aG9kIDQpIG9yIHVuZGVmaW5lZCAobWV0aG9kcyAxLDIsMykuXHJcbiAgICogQHJldHVybiAgQXJyYXkgb2YgUGF0Y2ggb2JqZWN0cy5cclxuICAgKi9cclxuICAgIHBhdGNoX21ha2UgKGE6IHN0cmluZyB8IEFycmF5PERpZmY+LCBvcHRfYjogc3RyaW5nIHwgQXJyYXk8RGlmZj4sIG9wdF9jOiBzdHJpbmcgfCBBcnJheTxEaWZmPikge1xyXG4gICAgbGV0IHRleHQxLCBkaWZmcztcclxuICAgIGlmICh0eXBlb2YgYSA9PSAnc3RyaW5nJyAmJiB0eXBlb2Ygb3B0X2IgPT0gJ3N0cmluZycgJiZcclxuICAgICAgICB0eXBlb2Ygb3B0X2MgPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgLy8gTWV0aG9kIDE6IHRleHQxLCB0ZXh0MlxyXG4gICAgICAvLyBDb21wdXRlIGRpZmZzIGZyb20gdGV4dDEgYW5kIHRleHQyLlxyXG4gICAgICB0ZXh0MSA9IChhKTtcclxuICAgICAgZGlmZnMgPSB0aGlzLmRpZmZfbWFpbih0ZXh0MSwgKG9wdF9iKSwgdHJ1ZSk7XHJcbiAgICAgIGlmIChkaWZmcy5sZW5ndGggPiAyKSB7XHJcbiAgICAgICAgdGhpcy5kaWZmX2NsZWFudXBTZW1hbnRpYyhkaWZmcyk7XHJcbiAgICAgICAgdGhpcy5kaWZmX2NsZWFudXBFZmZpY2llbmN5KGRpZmZzKTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIGlmIChhICYmIHR5cGVvZiBhID09ICdvYmplY3QnICYmIHR5cGVvZiBvcHRfYiA9PSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICAgIHR5cGVvZiBvcHRfYyA9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAvLyBNZXRob2QgMjogZGlmZnNcclxuICAgICAgLy8gQ29tcHV0ZSB0ZXh0MSBmcm9tIGRpZmZzLlxyXG4gICAgICBkaWZmcyA9IChhKTtcclxuICAgICAgdGV4dDEgPSB0aGlzLmRpZmZfdGV4dDEoZGlmZnMpO1xyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgYSA9PSAnc3RyaW5nJyAmJiBvcHRfYiAmJiB0eXBlb2Ygb3B0X2IgPT0gJ29iamVjdCcgJiZcclxuICAgICAgICB0eXBlb2Ygb3B0X2MgPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgLy8gTWV0aG9kIDM6IHRleHQxLCBkaWZmc1xyXG4gICAgICB0ZXh0MSA9IChhKTtcclxuICAgICAgZGlmZnMgPSAob3B0X2IpO1xyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgYSA9PSAnc3RyaW5nJyAmJiB0eXBlb2Ygb3B0X2IgPT0gJ3N0cmluZycgJiZcclxuICAgICAgICBvcHRfYyAmJiB0eXBlb2Ygb3B0X2MgPT0gJ29iamVjdCcpIHtcclxuICAgICAgLy8gTWV0aG9kIDQ6IHRleHQxLCB0ZXh0MiwgZGlmZnNcclxuICAgICAgLy8gdGV4dDIgaXMgbm90IHVzZWQuXHJcbiAgICAgIHRleHQxID0gKGEpO1xyXG4gICAgICBkaWZmcyA9IChvcHRfYyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gY2FsbCBmb3JtYXQgdG8gcGF0Y2hfbWFrZS4nKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoZGlmZnMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBbXTsgIC8vIEdldCByaWQgb2YgdGhlIG51bGwgY2FzZS5cclxuICAgIH1cclxuICAgIGNvbnN0IHBhdGNoZXMgPSBbXTtcclxuICAgIGxldCBwYXRjaCA9IG5ldyBwYXRjaF9vYmooKTtcclxuICAgIGxldCBwYXRjaERpZmZMZW5ndGggPSAwOyAgLy8gS2VlcGluZyBvdXIgb3duIGxlbmd0aCBjb25zdCBpcyBmYXN0ZXIgaW4gSlMuXHJcbiAgICBsZXQgY2hhcl9jb3VudDEgPSAwOyAgLy8gTnVtYmVyIG9mIGNoYXJhY3RlcnMgaW50byB0aGUgdGV4dDEgc3RyaW5nLlxyXG4gICAgbGV0IGNoYXJfY291bnQyID0gMDsgIC8vIE51bWJlciBvZiBjaGFyYWN0ZXJzIGludG8gdGhlIHRleHQyIHN0cmluZy5cclxuICAgIC8vIFN0YXJ0IHdpdGggdGV4dDEgKHByZXBhdGNoX3RleHQpIGFuZCBhcHBseSB0aGUgZGlmZnMgdW50aWwgd2UgYXJyaXZlIGF0XHJcbiAgICAvLyB0ZXh0MiAocG9zdHBhdGNoX3RleHQpLiAgV2UgcmVjcmVhdGUgdGhlIHBhdGNoZXMgb25lIGJ5IG9uZSB0byBkZXRlcm1pbmVcclxuICAgIC8vIGNvbnRleHQgaW5mby5cclxuICAgIGxldCBwcmVwYXRjaF90ZXh0ID0gdGV4dDE7XHJcbiAgICBsZXQgcG9zdHBhdGNoX3RleHQgPSB0ZXh0MTtcclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgZGlmZnMubGVuZ3RoOyB4KyspIHtcclxuICAgICAgY29uc3QgZGlmZl90eXBlID0gZGlmZnNbeF1bMF07XHJcbiAgICAgIGNvbnN0IGRpZmZfdGV4dCA9IGRpZmZzW3hdWzFdO1xyXG5cclxuICAgICAgaWYgKCFwYXRjaERpZmZMZW5ndGggJiYgZGlmZl90eXBlICE9PSBEaWZmT3AuRXF1YWwpIHtcclxuICAgICAgICAvLyBBIG5ldyBwYXRjaCBzdGFydHMgaGVyZS5cclxuICAgICAgICBwYXRjaC5zdGFydDEgPSBjaGFyX2NvdW50MTtcclxuICAgICAgICBwYXRjaC5zdGFydDIgPSBjaGFyX2NvdW50MjtcclxuICAgICAgfVxyXG5cclxuICAgICAgc3dpdGNoIChkaWZmX3R5cGUpIHtcclxuICAgICAgICBjYXNlIERpZmZPcC5JbnNlcnQ6XHJcbiAgICAgICAgICBwYXRjaC5kaWZmc1twYXRjaERpZmZMZW5ndGgrK10gPSBkaWZmc1t4XTtcclxuICAgICAgICAgIHBhdGNoLmxlbmd0aDIgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcclxuICAgICAgICAgIHBvc3RwYXRjaF90ZXh0ID0gcG9zdHBhdGNoX3RleHQuc3Vic3RyaW5nKDAsIGNoYXJfY291bnQyKSArIGRpZmZfdGV4dCArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zdHBhdGNoX3RleHQuc3Vic3RyaW5nKGNoYXJfY291bnQyKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgRGlmZk9wLkRlbGV0ZTpcclxuICAgICAgICAgIHBhdGNoLmxlbmd0aDEgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcclxuICAgICAgICAgIHBhdGNoLmRpZmZzW3BhdGNoRGlmZkxlbmd0aCsrXSA9IGRpZmZzW3hdO1xyXG4gICAgICAgICAgcG9zdHBhdGNoX3RleHQgPSBwb3N0cGF0Y2hfdGV4dC5zdWJzdHJpbmcoMCwgY2hhcl9jb3VudDIpICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBwb3N0cGF0Y2hfdGV4dC5zdWJzdHJpbmcoY2hhcl9jb3VudDIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmX3RleHQubGVuZ3RoKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgRGlmZk9wLkVxdWFsOlxyXG4gICAgICAgICAgaWYgKGRpZmZfdGV4dC5sZW5ndGggPD0gMiAqIHRoaXMuUGF0Y2hfTWFyZ2luICYmXHJcbiAgICAgICAgICAgICAgcGF0Y2hEaWZmTGVuZ3RoICYmIGRpZmZzLmxlbmd0aCAhPSB4ICsgMSkge1xyXG4gICAgICAgICAgICAvLyBTbWFsbCBlcXVhbGl0eSBpbnNpZGUgYSBwYXRjaC5cclxuICAgICAgICAgICAgcGF0Y2guZGlmZnNbcGF0Y2hEaWZmTGVuZ3RoKytdID0gZGlmZnNbeF07XHJcbiAgICAgICAgICAgIHBhdGNoLmxlbmd0aDEgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcclxuICAgICAgICAgICAgcGF0Y2gubGVuZ3RoMiArPSBkaWZmX3RleHQubGVuZ3RoO1xyXG4gICAgICAgICAgfSBlbHNlIGlmIChkaWZmX3RleHQubGVuZ3RoID49IDIgKiB0aGlzLlBhdGNoX01hcmdpbikge1xyXG4gICAgICAgICAgICAvLyBUaW1lIGZvciBhIG5ldyBwYXRjaC5cclxuICAgICAgICAgICAgaWYgKHBhdGNoRGlmZkxlbmd0aCkge1xyXG4gICAgICAgICAgICAgIHRoaXMucGF0Y2hfYWRkQ29udGV4dF8ocGF0Y2gsIHByZXBhdGNoX3RleHQpO1xyXG4gICAgICAgICAgICAgIHBhdGNoZXMucHVzaChwYXRjaCk7XHJcbiAgICAgICAgICAgICAgcGF0Y2ggPSBuZXcgcGF0Y2hfb2JqKCk7XHJcbiAgICAgICAgICAgICAgcGF0Y2hEaWZmTGVuZ3RoID0gMDtcclxuICAgICAgICAgICAgICAvLyBVbmxpa2UgVW5pZGlmZiwgb3VyIHBhdGNoIGxpc3RzIGhhdmUgYSByb2xsaW5nIGNvbnRleHQuXHJcbiAgICAgICAgICAgICAgLy8gaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2dvb2dsZS1kaWZmLW1hdGNoLXBhdGNoL3dpa2kvVW5pZGlmZlxyXG4gICAgICAgICAgICAgIC8vIFVwZGF0ZSBwcmVwYXRjaCB0ZXh0ICYgcG9zIHRvIHJlZmxlY3QgdGhlIGFwcGxpY2F0aW9uIG9mIHRoZVxyXG4gICAgICAgICAgICAgIC8vIGp1c3QgY29tcGxldGVkIHBhdGNoLlxyXG4gICAgICAgICAgICAgIHByZXBhdGNoX3RleHQgPSBwb3N0cGF0Y2hfdGV4dDtcclxuICAgICAgICAgICAgICBjaGFyX2NvdW50MSA9IGNoYXJfY291bnQyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gVXBkYXRlIHRoZSBjdXJyZW50IGNoYXJhY3RlciBjb3VudC5cclxuICAgICAgaWYgKGRpZmZfdHlwZSAhPT0gRGlmZk9wLkluc2VydCkge1xyXG4gICAgICAgIGNoYXJfY291bnQxICs9IGRpZmZfdGV4dC5sZW5ndGg7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGRpZmZfdHlwZSAhPT0gRGlmZk9wLkRlbGV0ZSkge1xyXG4gICAgICAgIGNoYXJfY291bnQyICs9IGRpZmZfdGV4dC5sZW5ndGg7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIFBpY2sgdXAgdGhlIGxlZnRvdmVyIHBhdGNoIGlmIG5vdCBlbXB0eS5cclxuICAgIGlmIChwYXRjaERpZmZMZW5ndGgpIHtcclxuICAgICAgdGhpcy5wYXRjaF9hZGRDb250ZXh0XyhwYXRjaCwgcHJlcGF0Y2hfdGV4dCk7XHJcbiAgICAgIHBhdGNoZXMucHVzaChwYXRjaCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHBhdGNoZXM7XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEdpdmVuIGFuIGFycmF5IG9mIHBhdGNoZXMsIHJldHVybiBhbm90aGVyIGFycmF5IHRoYXQgaXMgaWRlbnRpY2FsLlxyXG4gICAqIEBwYXJhbSAgcGF0Y2hlcyBBcnJheSBvZiBQYXRjaCBvYmplY3RzLlxyXG4gICAqIEByZXR1cm4gIEFycmF5IG9mIFBhdGNoIG9iamVjdHMuXHJcbiAgICovXHJcbiAgICBwYXRjaF9kZWVwQ29weSAocGF0Y2hlczogQXJyYXk8cGF0Y2hfb2JqPik6IEFycmF5PHBhdGNoX29iaj4ge1xyXG4gICAgLy8gTWFraW5nIGRlZXAgY29waWVzIGlzIGhhcmQgaW4gSmF2YVNjcmlwdC5cclxuICAgIGNvbnN0IHBhdGNoZXNDb3B5ID0gW107XHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHBhdGNoZXMubGVuZ3RoOyB4KyspIHtcclxuICAgICAgY29uc3QgcGF0Y2ggPSBwYXRjaGVzW3hdO1xyXG4gICAgICBjb25zdCBwYXRjaENvcHkgPSBuZXcgcGF0Y2hfb2JqKCk7XHJcbiAgICAgIHBhdGNoQ29weS5kaWZmcyA9IFtdO1xyXG4gICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IHBhdGNoLmRpZmZzLmxlbmd0aDsgeSsrKSB7XHJcbiAgICAgICAgcGF0Y2hDb3B5LmRpZmZzW3ldID0gW3BhdGNoLmRpZmZzW3ldWzBdLCBwYXRjaC5kaWZmc1t5XVsxXV07XHJcbiAgICAgIH1cclxuICAgICAgcGF0Y2hDb3B5LnN0YXJ0MSA9IHBhdGNoLnN0YXJ0MTtcclxuICAgICAgcGF0Y2hDb3B5LnN0YXJ0MiA9IHBhdGNoLnN0YXJ0MjtcclxuICAgICAgcGF0Y2hDb3B5Lmxlbmd0aDEgPSBwYXRjaC5sZW5ndGgxO1xyXG4gICAgICBwYXRjaENvcHkubGVuZ3RoMiA9IHBhdGNoLmxlbmd0aDI7XHJcbiAgICAgIHBhdGNoZXNDb3B5W3hdID0gcGF0Y2hDb3B5O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHBhdGNoZXNDb3B5O1xyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBNZXJnZSBhIHNldCBvZiBwYXRjaGVzIG9udG8gdGhlIHRleHQuICBSZXR1cm4gYSBwYXRjaGVkIHRleHQsIGFzIHdlbGxcclxuICAgKiBhcyBhIGxpc3Qgb2YgdHJ1ZS9mYWxzZSB2YWx1ZXMgaW5kaWNhdGluZyB3aGljaCBwYXRjaGVzIHdlcmUgYXBwbGllZC5cclxuICAgKiBAcGFyYW0gIHBhdGNoZXMgQXJyYXkgb2YgUGF0Y2ggb2JqZWN0cy5cclxuICAgKiBAcGFyYW0gIHRleHQgT2xkIHRleHQuXHJcbiAgICogQHJldHVybiAgVHdvIGVsZW1lbnQgQXJyYXksIGNvbnRhaW5pbmcgdGhlXHJcbiAgICogICAgICBuZXcgdGV4dCBhbmQgYW4gYXJyYXkgb2YgYm9vbGVhbiB2YWx1ZXMuXHJcbiAgICovXHJcbiAgICBwYXRjaF9hcHBseSAocGF0Y2hlczogQXJyYXk8cGF0Y2hfb2JqPiwgdGV4dDogc3RyaW5nKSB7XHJcbiAgICBpZiAocGF0Y2hlcy5sZW5ndGggPT0gMCkge1xyXG4gICAgICByZXR1cm4gW3RleHQsIFtdXTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBEZWVwIGNvcHkgdGhlIHBhdGNoZXMgc28gdGhhdCBubyBjaGFuZ2VzIGFyZSBtYWRlIHRvIG9yaWdpbmFscy5cclxuICAgIHBhdGNoZXMgPSB0aGlzLnBhdGNoX2RlZXBDb3B5KHBhdGNoZXMpO1xyXG5cclxuICAgIGNvbnN0IG51bGxQYWRkaW5nID0gdGhpcy5wYXRjaF9hZGRQYWRkaW5nKHBhdGNoZXMpO1xyXG4gICAgdGV4dCA9IG51bGxQYWRkaW5nICsgdGV4dCArIG51bGxQYWRkaW5nO1xyXG5cclxuICAgIHRoaXMucGF0Y2hfc3BsaXRNYXgocGF0Y2hlcyk7XHJcbiAgICAvLyBkZWx0YSBrZWVwcyB0cmFjayBvZiB0aGUgb2Zmc2V0IGJldHdlZW4gdGhlIGV4cGVjdGVkIGFuZCBhY3R1YWwgbG9jYXRpb25cclxuICAgIC8vIG9mIHRoZSBwcmV2aW91cyBwYXRjaC4gIElmIHRoZXJlIGFyZSBwYXRjaGVzIGV4cGVjdGVkIGF0IHBvc2l0aW9ucyAxMCBhbmRcclxuICAgIC8vIDIwLCBidXQgdGhlIGZpcnN0IHBhdGNoIHdhcyBmb3VuZCBhdCAxMiwgZGVsdGEgaXMgMiBhbmQgdGhlIHNlY29uZCBwYXRjaFxyXG4gICAgLy8gaGFzIGFuIGVmZmVjdGl2ZSBleHBlY3RlZCBwb3NpdGlvbiBvZiAyMi5cclxuICAgIGxldCBkZWx0YSA9IDA7XHJcbiAgICBjb25zdCByZXN1bHRzID0gW107XHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHBhdGNoZXMubGVuZ3RoOyB4KyspIHtcclxuICAgICAgY29uc3QgZXhwZWN0ZWRfbG9jID0gcGF0Y2hlc1t4XS5zdGFydDIgKyBkZWx0YTtcclxuICAgICAgY29uc3QgdGV4dDEgPSB0aGlzLmRpZmZfdGV4dDEocGF0Y2hlc1t4XS5kaWZmcyk7XHJcbiAgICAgIGxldCBzdGFydF9sb2M7XHJcbiAgICAgIGxldCBlbmRfbG9jID0gLTE7XHJcbiAgICAgIGlmICh0ZXh0MS5sZW5ndGggPiB0aGlzLk1hdGNoX01heEJpdHMpIHtcclxuICAgICAgICAvLyBwYXRjaF9zcGxpdE1heCB3aWxsIG9ubHkgcHJvdmlkZSBhbiBvdmVyc2l6ZWQgcGF0dGVybiBpbiB0aGUgY2FzZSBvZlxyXG4gICAgICAgIC8vIGEgbW9uc3RlciBkZWxldGUuXHJcbiAgICAgICAgc3RhcnRfbG9jID0gdGhpcy5tYXRjaF9tYWluKHRleHQsIHRleHQxLnN1YnN0cmluZygwLCB0aGlzLk1hdGNoX01heEJpdHMpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBlY3RlZF9sb2MpO1xyXG4gICAgICAgIGlmIChzdGFydF9sb2MgIT0gLTEpIHtcclxuICAgICAgICAgIGVuZF9sb2MgPSB0aGlzLm1hdGNoX21haW4odGV4dCxcclxuICAgICAgICAgICAgICB0ZXh0MS5zdWJzdHJpbmcodGV4dDEubGVuZ3RoIC0gdGhpcy5NYXRjaF9NYXhCaXRzKSxcclxuICAgICAgICAgICAgICBleHBlY3RlZF9sb2MgKyB0ZXh0MS5sZW5ndGggLSB0aGlzLk1hdGNoX01heEJpdHMpO1xyXG4gICAgICAgICAgaWYgKGVuZF9sb2MgPT0gLTEgfHwgc3RhcnRfbG9jID49IGVuZF9sb2MpIHtcclxuICAgICAgICAgICAgLy8gQ2FuJ3QgZmluZCB2YWxpZCB0cmFpbGluZyBjb250ZXh0LiAgRHJvcCB0aGlzIHBhdGNoLlxyXG4gICAgICAgICAgICBzdGFydF9sb2MgPSAtMTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc3RhcnRfbG9jID0gdGhpcy5tYXRjaF9tYWluKHRleHQsIHRleHQxLCBleHBlY3RlZF9sb2MpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChzdGFydF9sb2MgPT0gLTEpIHtcclxuICAgICAgICAvLyBObyBtYXRjaCBmb3VuZC4gIDooXHJcbiAgICAgICAgcmVzdWx0c1t4XSA9IGZhbHNlO1xyXG4gICAgICAgIC8vIFN1YnRyYWN0IHRoZSBkZWx0YSBmb3IgdGhpcyBmYWlsZWQgcGF0Y2ggZnJvbSBzdWJzZXF1ZW50IHBhdGNoZXMuXHJcbiAgICAgICAgZGVsdGEgLT0gcGF0Y2hlc1t4XS5sZW5ndGgyIC0gcGF0Y2hlc1t4XS5sZW5ndGgxO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEZvdW5kIGEgbWF0Y2guICA6KVxyXG4gICAgICAgIHJlc3VsdHNbeF0gPSB0cnVlO1xyXG4gICAgICAgIGRlbHRhID0gc3RhcnRfbG9jIC0gZXhwZWN0ZWRfbG9jO1xyXG4gICAgICAgIGxldCB0ZXh0MjtcclxuICAgICAgICBpZiAoZW5kX2xvYyA9PSAtMSkge1xyXG4gICAgICAgICAgdGV4dDIgPSB0ZXh0LnN1YnN0cmluZyhzdGFydF9sb2MsIHN0YXJ0X2xvYyArIHRleHQxLmxlbmd0aCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRleHQyID0gdGV4dC5zdWJzdHJpbmcoc3RhcnRfbG9jLCBlbmRfbG9jICsgdGhpcy5NYXRjaF9NYXhCaXRzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRleHQxID09IHRleHQyKSB7XHJcbiAgICAgICAgICAvLyBQZXJmZWN0IG1hdGNoLCBqdXN0IHNob3ZlIHRoZSByZXBsYWNlbWVudCB0ZXh0IGluLlxyXG4gICAgICAgICAgdGV4dCA9IHRleHQuc3Vic3RyaW5nKDAsIHN0YXJ0X2xvYykgK1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaWZmX3RleHQyKHBhdGNoZXNbeF0uZGlmZnMpICtcclxuICAgICAgICAgICAgICAgIHRleHQuc3Vic3RyaW5nKHN0YXJ0X2xvYyArIHRleHQxLmxlbmd0aCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIC8vIEltcGVyZmVjdCBtYXRjaC4gIFJ1biBhIGRpZmYgdG8gZ2V0IGEgZnJhbWV3b3JrIG9mIGVxdWl2YWxlbnRcclxuICAgICAgICAgIC8vIGluZGljZXMuXHJcbiAgICAgICAgICBjb25zdCBkaWZmcyA9IHRoaXMuZGlmZl9tYWluKHRleHQxLCB0ZXh0MiwgZmFsc2UpO1xyXG4gICAgICAgICAgaWYgKHRleHQxLmxlbmd0aCA+IHRoaXMuTWF0Y2hfTWF4Qml0cyAmJlxyXG4gICAgICAgICAgICAgIHRoaXMuZGlmZl9sZXZlbnNodGVpbihkaWZmcykgLyB0ZXh0MS5sZW5ndGggPlxyXG4gICAgICAgICAgICAgIHRoaXMuUGF0Y2hfRGVsZXRlVGhyZXNob2xkKSB7XHJcbiAgICAgICAgICAgIC8vIFRoZSBlbmQgcG9pbnRzIG1hdGNoLCBidXQgdGhlIGNvbnRlbnQgaXMgdW5hY2NlcHRhYmx5IGJhZC5cclxuICAgICAgICAgICAgcmVzdWx0c1t4XSA9IGZhbHNlO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5kaWZmX2NsZWFudXBTZW1hbnRpY0xvc3NsZXNzKGRpZmZzKTtcclxuICAgICAgICAgICAgbGV0IGluZGV4MSA9IDA7XHJcbiAgICAgICAgICAgIGxldCBpbmRleDI7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgcGF0Y2hlc1t4XS5kaWZmcy5sZW5ndGg7IHkrKykge1xyXG4gICAgICAgICAgICAgIGNvbnN0IG1vZCA9IHBhdGNoZXNbeF0uZGlmZnNbeV07XHJcbiAgICAgICAgICAgICAgaWYgKG1vZFswXSAhPT0gRGlmZk9wLkVxdWFsKSB7XHJcbiAgICAgICAgICAgICAgICBpbmRleDIgPSB0aGlzLmRpZmZfeEluZGV4KGRpZmZzLCBpbmRleDEpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBpZiAobW9kWzBdID09PSBEaWZmT3AuSW5zZXJ0KSB7ICAvLyBJbnNlcnRpb25cclxuICAgICAgICAgICAgICAgIHRleHQgPSB0ZXh0LnN1YnN0cmluZygwLCBzdGFydF9sb2MgKyBpbmRleDIpICsgbW9kWzFdICtcclxuICAgICAgICAgICAgICAgICAgICAgIHRleHQuc3Vic3RyaW5nKHN0YXJ0X2xvYyArIGluZGV4Mik7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChtb2RbMF0gPT09IERpZmZPcC5EZWxldGUpIHsgIC8vIERlbGV0aW9uXHJcbiAgICAgICAgICAgICAgICB0ZXh0ID0gdGV4dC5zdWJzdHJpbmcoMCwgc3RhcnRfbG9jICsgaW5kZXgyKSArXHJcbiAgICAgICAgICAgICAgICAgICAgICB0ZXh0LnN1YnN0cmluZyhzdGFydF9sb2MgKyB0aGlzLmRpZmZfeEluZGV4KGRpZmZzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4MSArIG1vZFsxXS5sZW5ndGgpKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgaWYgKG1vZFswXSAhPT0gRGlmZk9wLkRlbGV0ZSkge1xyXG4gICAgICAgICAgICAgICAgaW5kZXgxICs9IG1vZFsxXS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBTdHJpcCB0aGUgcGFkZGluZyBvZmYuXHJcbiAgICB0ZXh0ID0gdGV4dC5zdWJzdHJpbmcobnVsbFBhZGRpbmcubGVuZ3RoLCB0ZXh0Lmxlbmd0aCAtIG51bGxQYWRkaW5nLmxlbmd0aCk7XHJcbiAgICByZXR1cm4gW3RleHQsIHJlc3VsdHNdO1xyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBBZGQgc29tZSBwYWRkaW5nIG9uIHRleHQgc3RhcnQgYW5kIGVuZCBzbyB0aGF0IGVkZ2VzIGNhbiBtYXRjaCBzb21ldGhpbmcuXHJcbiAgICogSW50ZW5kZWQgdG8gYmUgY2FsbGVkIG9ubHkgZnJvbSB3aXRoaW4gcGF0Y2hfYXBwbHkuXHJcbiAgICogQHBhcmFtICBwYXRjaGVzIEFycmF5IG9mIFBhdGNoIG9iamVjdHMuXHJcbiAgICogQHJldHVybiAgVGhlIHBhZGRpbmcgc3RyaW5nIGFkZGVkIHRvIGVhY2ggc2lkZS5cclxuICAgKi9cclxuICAgIHBhdGNoX2FkZFBhZGRpbmcgKHBhdGNoZXM6IEFycmF5PHBhdGNoX29iaj4pIHtcclxuICAgIGNvbnN0IHBhZGRpbmdMZW5ndGggPSB0aGlzLlBhdGNoX01hcmdpbjtcclxuICAgIGxldCBudWxsUGFkZGluZyA9ICcnO1xyXG4gICAgZm9yIChsZXQgeCA9IDE7IHggPD0gcGFkZGluZ0xlbmd0aDsgeCsrKSB7XHJcbiAgICAgIG51bGxQYWRkaW5nICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoeCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQnVtcCBhbGwgdGhlIHBhdGNoZXMgZm9yd2FyZC5cclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgcGF0Y2hlcy5sZW5ndGg7IHgrKykge1xyXG4gICAgICBwYXRjaGVzW3hdLnN0YXJ0MSArPSBwYWRkaW5nTGVuZ3RoO1xyXG4gICAgICBwYXRjaGVzW3hdLnN0YXJ0MiArPSBwYWRkaW5nTGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEFkZCBzb21lIHBhZGRpbmcgb24gc3RhcnQgb2YgZmlyc3QgZGlmZi5cclxuICAgIGxldCBwYXRjaCA9IHBhdGNoZXNbMF07XHJcbiAgICBsZXQgZGlmZnMgPSBwYXRjaC5kaWZmcztcclxuICAgIGlmIChkaWZmcy5sZW5ndGggPT0gMCB8fCBkaWZmc1swXVswXSAhPSBEaWZmT3AuRXF1YWwpIHtcclxuICAgICAgLy8gQWRkIG51bGxQYWRkaW5nIGVxdWFsaXR5LlxyXG4gICAgICBkaWZmcy51bnNoaWZ0KFtEaWZmT3AuRXF1YWwsIG51bGxQYWRkaW5nXSk7XHJcbiAgICAgIHBhdGNoLnN0YXJ0MSAtPSBwYWRkaW5nTGVuZ3RoOyAgLy8gU2hvdWxkIGJlIDAuXHJcbiAgICAgIHBhdGNoLnN0YXJ0MiAtPSBwYWRkaW5nTGVuZ3RoOyAgLy8gU2hvdWxkIGJlIDAuXHJcbiAgICAgIHBhdGNoLmxlbmd0aDEgKz0gcGFkZGluZ0xlbmd0aDtcclxuICAgICAgcGF0Y2gubGVuZ3RoMiArPSBwYWRkaW5nTGVuZ3RoO1xyXG4gICAgfSBlbHNlIGlmIChwYWRkaW5nTGVuZ3RoID4gZGlmZnNbMF1bMV0ubGVuZ3RoKSB7XHJcbiAgICAgIC8vIEdyb3cgZmlyc3QgZXF1YWxpdHkuXHJcbiAgICAgIGNvbnN0IGV4dHJhTGVuZ3RoID0gcGFkZGluZ0xlbmd0aCAtIGRpZmZzWzBdWzFdLmxlbmd0aDtcclxuICAgICAgZGlmZnNbMF1bMV0gPSBudWxsUGFkZGluZy5zdWJzdHJpbmcoZGlmZnNbMF1bMV0ubGVuZ3RoKSArIGRpZmZzWzBdWzFdO1xyXG4gICAgICBwYXRjaC5zdGFydDEgLT0gZXh0cmFMZW5ndGg7XHJcbiAgICAgIHBhdGNoLnN0YXJ0MiAtPSBleHRyYUxlbmd0aDtcclxuICAgICAgcGF0Y2gubGVuZ3RoMSArPSBleHRyYUxlbmd0aDtcclxuICAgICAgcGF0Y2gubGVuZ3RoMiArPSBleHRyYUxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBBZGQgc29tZSBwYWRkaW5nIG9uIGVuZCBvZiBsYXN0IGRpZmYuXHJcbiAgICBwYXRjaCA9IHBhdGNoZXNbcGF0Y2hlcy5sZW5ndGggLSAxXTtcclxuICAgIGRpZmZzID0gcGF0Y2guZGlmZnM7XHJcbiAgICBpZiAoZGlmZnMubGVuZ3RoID09IDAgfHwgZGlmZnNbZGlmZnMubGVuZ3RoIC0gMV1bMF0gIT0gRGlmZk9wLkVxdWFsKSB7XHJcbiAgICAgIC8vIEFkZCBudWxsUGFkZGluZyBlcXVhbGl0eS5cclxuICAgICAgZGlmZnMucHVzaChbRGlmZk9wLkVxdWFsLCBudWxsUGFkZGluZ10pO1xyXG4gICAgICBwYXRjaC5sZW5ndGgxICs9IHBhZGRpbmdMZW5ndGg7XHJcbiAgICAgIHBhdGNoLmxlbmd0aDIgKz0gcGFkZGluZ0xlbmd0aDtcclxuICAgIH0gZWxzZSBpZiAocGFkZGluZ0xlbmd0aCA+IGRpZmZzW2RpZmZzLmxlbmd0aCAtIDFdWzFdLmxlbmd0aCkge1xyXG4gICAgICAvLyBHcm93IGxhc3QgZXF1YWxpdHkuXHJcbiAgICAgIGNvbnN0IGV4dHJhTGVuZ3RoID0gcGFkZGluZ0xlbmd0aCAtIGRpZmZzW2RpZmZzLmxlbmd0aCAtIDFdWzFdLmxlbmd0aDtcclxuICAgICAgZGlmZnNbZGlmZnMubGVuZ3RoIC0gMV1bMV0gKz0gbnVsbFBhZGRpbmcuc3Vic3RyaW5nKDAsIGV4dHJhTGVuZ3RoKTtcclxuICAgICAgcGF0Y2gubGVuZ3RoMSArPSBleHRyYUxlbmd0aDtcclxuICAgICAgcGF0Y2gubGVuZ3RoMiArPSBleHRyYUxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbnVsbFBhZGRpbmc7XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIExvb2sgdGhyb3VnaCB0aGUgcGF0Y2hlcyBhbmQgYnJlYWsgdXAgYW55IHdoaWNoIGFyZSBsb25nZXIgdGhhbiB0aGUgbWF4aW11bVxyXG4gICAqIGxpbWl0IG9mIHRoZSBtYXRjaCBhbGdvcml0aG0uXHJcbiAgICogSW50ZW5kZWQgdG8gYmUgY2FsbGVkIG9ubHkgZnJvbSB3aXRoaW4gcGF0Y2hfYXBwbHkuXHJcbiAgICogQHBhcmFtICBwYXRjaGVzIEFycmF5IG9mIFBhdGNoIG9iamVjdHMuXHJcbiAgICovXHJcbiAgICBwYXRjaF9zcGxpdE1heCA9IGZ1bmN0aW9uKHBhdGNoZXM6IEFycmF5PHBhdGNoX29iaj4pIHtcclxuICAgIGNvbnN0IHBhdGNoX3NpemUgPSB0aGlzLk1hdGNoX01heEJpdHM7XHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHBhdGNoZXMubGVuZ3RoOyB4KyspIHtcclxuICAgICAgaWYgKHBhdGNoZXNbeF0ubGVuZ3RoMSA8PSBwYXRjaF9zaXplKSB7XHJcbiAgICAgICAgY29udGludWU7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgYmlncGF0Y2ggPSBwYXRjaGVzW3hdO1xyXG4gICAgICAvLyBSZW1vdmUgdGhlIGJpZyBvbGQgcGF0Y2guXHJcbiAgICAgIHBhdGNoZXMuc3BsaWNlKHgtLSwgMSk7XHJcbiAgICAgIGxldCBzdGFydDEgPSBiaWdwYXRjaC5zdGFydDE7XHJcbiAgICAgIGxldCBzdGFydDIgPSBiaWdwYXRjaC5zdGFydDI7XHJcbiAgICAgIGxldCBwcmVjb250ZXh0ID0gJyc7XHJcbiAgICAgIHdoaWxlIChiaWdwYXRjaC5kaWZmcy5sZW5ndGggIT09IDApIHtcclxuICAgICAgICAvLyBDcmVhdGUgb25lIG9mIHNldmVyYWwgc21hbGxlciBwYXRjaGVzLlxyXG4gICAgICAgIGNvbnN0IHBhdGNoID0gbmV3IHBhdGNoX29iaigpO1xyXG4gICAgICAgIGxldCBlbXB0eSA9IHRydWU7XHJcbiAgICAgICAgcGF0Y2guc3RhcnQxID0gc3RhcnQxIC0gcHJlY29udGV4dC5sZW5ndGg7XHJcbiAgICAgICAgcGF0Y2guc3RhcnQyID0gc3RhcnQyIC0gcHJlY29udGV4dC5sZW5ndGg7XHJcbiAgICAgICAgaWYgKHByZWNvbnRleHQgIT09ICcnKSB7XHJcbiAgICAgICAgICBwYXRjaC5sZW5ndGgxID0gcGF0Y2gubGVuZ3RoMiA9IHByZWNvbnRleHQubGVuZ3RoO1xyXG4gICAgICAgICAgcGF0Y2guZGlmZnMucHVzaChbRGlmZk9wLkVxdWFsLCBwcmVjb250ZXh0XSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHdoaWxlIChiaWdwYXRjaC5kaWZmcy5sZW5ndGggIT09IDAgJiZcclxuICAgICAgICAgICAgICBwYXRjaC5sZW5ndGgxIDwgcGF0Y2hfc2l6ZSAtIHRoaXMuUGF0Y2hfTWFyZ2luKSB7XHJcbiAgICAgICAgICBjb25zdCBkaWZmX3R5cGUgPSBiaWdwYXRjaC5kaWZmc1swXVswXTtcclxuICAgICAgICAgIGxldCBkaWZmX3RleHQgPSBiaWdwYXRjaC5kaWZmc1swXVsxXTtcclxuICAgICAgICAgIGlmIChkaWZmX3R5cGUgPT09IERpZmZPcC5JbnNlcnQpIHtcclxuICAgICAgICAgICAgLy8gSW5zZXJ0aW9ucyBhcmUgaGFybWxlc3MuXHJcbiAgICAgICAgICAgIHBhdGNoLmxlbmd0aDIgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcclxuICAgICAgICAgICAgc3RhcnQyICs9IGRpZmZfdGV4dC5sZW5ndGg7XHJcbiAgICAgICAgICAgIHBhdGNoLmRpZmZzLnB1c2goYmlncGF0Y2guZGlmZnMuc2hpZnQoKSk7XHJcbiAgICAgICAgICAgIGVtcHR5ID0gZmFsc2U7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKGRpZmZfdHlwZSA9PT0gRGlmZk9wLkRlbGV0ZSAmJiBwYXRjaC5kaWZmcy5sZW5ndGggPT0gMSAmJlxyXG4gICAgICAgICAgICAgICAgICAgIHBhdGNoLmRpZmZzWzBdWzBdID09IERpZmZPcC5FcXVhbCAmJlxyXG4gICAgICAgICAgICAgICAgICAgIGRpZmZfdGV4dC5sZW5ndGggPiAyICogcGF0Y2hfc2l6ZSkge1xyXG4gICAgICAgICAgICAvLyBUaGlzIGlzIGEgbGFyZ2UgZGVsZXRpb24uICBMZXQgaXQgcGFzcyBpbiBvbmUgY2h1bmsuXHJcbiAgICAgICAgICAgIHBhdGNoLmxlbmd0aDEgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcclxuICAgICAgICAgICAgc3RhcnQxICs9IGRpZmZfdGV4dC5sZW5ndGg7XHJcbiAgICAgICAgICAgIGVtcHR5ID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHBhdGNoLmRpZmZzLnB1c2goW2RpZmZfdHlwZSwgZGlmZl90ZXh0XSk7XHJcbiAgICAgICAgICAgIGJpZ3BhdGNoLmRpZmZzLnNoaWZ0KCk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBEZWxldGlvbiBvciBlcXVhbGl0eS4gIE9ubHkgdGFrZSBhcyBtdWNoIGFzIHdlIGNhbiBzdG9tYWNoLlxyXG4gICAgICAgICAgICBkaWZmX3RleHQgPSBkaWZmX3RleHQuc3Vic3RyaW5nKDAsXHJcbiAgICAgICAgICAgICAgICBwYXRjaF9zaXplIC0gcGF0Y2gubGVuZ3RoMSAtIHRoaXMuUGF0Y2hfTWFyZ2luKTtcclxuICAgICAgICAgICAgcGF0Y2gubGVuZ3RoMSArPSBkaWZmX3RleHQubGVuZ3RoO1xyXG4gICAgICAgICAgICBzdGFydDEgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcclxuICAgICAgICAgICAgaWYgKGRpZmZfdHlwZSA9PT0gRGlmZk9wLkVxdWFsKSB7XHJcbiAgICAgICAgICAgICAgcGF0Y2gubGVuZ3RoMiArPSBkaWZmX3RleHQubGVuZ3RoO1xyXG4gICAgICAgICAgICAgIHN0YXJ0MiArPSBkaWZmX3RleHQubGVuZ3RoO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGVtcHR5ID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcGF0Y2guZGlmZnMucHVzaChbZGlmZl90eXBlLCBkaWZmX3RleHRdKTtcclxuICAgICAgICAgICAgaWYgKGRpZmZfdGV4dCA9PSBiaWdwYXRjaC5kaWZmc1swXVsxXSkge1xyXG4gICAgICAgICAgICAgIGJpZ3BhdGNoLmRpZmZzLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgYmlncGF0Y2guZGlmZnNbMF1bMV0gPVxyXG4gICAgICAgICAgICAgICAgICBiaWdwYXRjaC5kaWZmc1swXVsxXS5zdWJzdHJpbmcoZGlmZl90ZXh0Lmxlbmd0aCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gQ29tcHV0ZSB0aGUgaGVhZCBjb250ZXh0IGZvciB0aGUgbmV4dCBwYXRjaC5cclxuICAgICAgICBwcmVjb250ZXh0ID0gdGhpcy5kaWZmX3RleHQyKHBhdGNoLmRpZmZzKTtcclxuICAgICAgICBwcmVjb250ZXh0ID1cclxuICAgICAgICAgICAgcHJlY29udGV4dC5zdWJzdHJpbmcocHJlY29udGV4dC5sZW5ndGggLSB0aGlzLlBhdGNoX01hcmdpbik7XHJcbiAgICAgICAgLy8gQXBwZW5kIHRoZSBlbmQgY29udGV4dCBmb3IgdGhpcyBwYXRjaC5cclxuICAgICAgICBjb25zdCBwb3N0Y29udGV4dCA9IHRoaXMuZGlmZl90ZXh0MShiaWdwYXRjaC5kaWZmcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnN1YnN0cmluZygwLCB0aGlzLlBhdGNoX01hcmdpbik7XHJcbiAgICAgICAgaWYgKHBvc3Rjb250ZXh0ICE9PSAnJykge1xyXG4gICAgICAgICAgcGF0Y2gubGVuZ3RoMSArPSBwb3N0Y29udGV4dC5sZW5ndGg7XHJcbiAgICAgICAgICBwYXRjaC5sZW5ndGgyICs9IHBvc3Rjb250ZXh0Lmxlbmd0aDtcclxuICAgICAgICAgIGlmIChwYXRjaC5kaWZmcy5sZW5ndGggIT09IDAgJiZcclxuICAgICAgICAgICAgICBwYXRjaC5kaWZmc1twYXRjaC5kaWZmcy5sZW5ndGggLSAxXVswXSA9PT0gRGlmZk9wLkVxdWFsKSB7XHJcbiAgICAgICAgICAgIHBhdGNoLmRpZmZzW3BhdGNoLmRpZmZzLmxlbmd0aCAtIDFdWzFdICs9IHBvc3Rjb250ZXh0O1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcGF0Y2guZGlmZnMucHVzaChbRGlmZk9wLkVxdWFsLCBwb3N0Y29udGV4dF0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIWVtcHR5KSB7XHJcbiAgICAgICAgICBwYXRjaGVzLnNwbGljZSgrK3gsIDAsIHBhdGNoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogVGFrZSBhIGxpc3Qgb2YgcGF0Y2hlcyBhbmQgcmV0dXJuIGEgdGV4dHVhbCByZXByZXNlbnRhdGlvbi5cclxuICAgKiBAcGFyYW0gIHBhdGNoZXMgQXJyYXkgb2YgUGF0Y2ggb2JqZWN0cy5cclxuICAgKiBAcmV0dXJuICBUZXh0IHJlcHJlc2VudGF0aW9uIG9mIHBhdGNoZXMuXHJcbiAgICovXHJcbiAgICBwYXRjaF90b1RleHQgKHBhdGNoZXM6IEFycmF5PHBhdGNoX29iaj4pIHtcclxuICAgIGNvbnN0IHRleHQgPSBbXTtcclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgcGF0Y2hlcy5sZW5ndGg7IHgrKykge1xyXG4gICAgICB0ZXh0W3hdID0gcGF0Y2hlc1t4XTtcclxuICAgIH1cclxuICAgIHJldHVybiB0ZXh0LmpvaW4oJycpO1xyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBQYXJzZSBhIHRleHR1YWwgcmVwcmVzZW50YXRpb24gb2YgcGF0Y2hlcyBhbmQgcmV0dXJuIGEgbGlzdCBvZiBQYXRjaCBvYmplY3RzLlxyXG4gICAqIEBwYXJhbSAgdGV4dGxpbmUgVGV4dCByZXByZXNlbnRhdGlvbiBvZiBwYXRjaGVzLlxyXG4gICAqIEByZXR1cm4gIEFycmF5IG9mIFBhdGNoIG9iamVjdHMuXHJcbiAgICogQHRocm93cyB7IUVycm9yfSBJZiBpbnZhbGlkIGlucHV0LlxyXG4gICAqL1xyXG4gICAgcGF0Y2hfZnJvbVRleHQgKHRleHRsaW5lOiBzdHJpbmcpOiBBcnJheTxwYXRjaF9vYmo+IHtcclxuICAgIGNvbnN0IHBhdGNoZXM6IEFycmF5PHBhdGNoX29iaj4gPSBbXTtcclxuICAgIGlmICghdGV4dGxpbmUpIHtcclxuICAgICAgcmV0dXJuIHBhdGNoZXM7XHJcbiAgICB9XHJcbiAgICBjb25zdCB0ZXh0ID0gdGV4dGxpbmUuc3BsaXQoJ1xcbicpO1xyXG4gICAgbGV0IHRleHRQb2ludGVyID0gMDtcclxuICAgIGNvbnN0IHBhdGNoSGVhZGVyID0gL15AQCAtKFxcZCspLD8oXFxkKikgXFwrKFxcZCspLD8oXFxkKikgQEAkLztcclxuICAgIHdoaWxlICh0ZXh0UG9pbnRlciA8IHRleHQubGVuZ3RoKSB7XHJcbiAgICAgIGNvbnN0IG0gPSB0ZXh0W3RleHRQb2ludGVyXS5tYXRjaChwYXRjaEhlYWRlcik7XHJcbiAgICAgIGlmICghbSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwYXRjaCBzdHJpbmc6ICcgKyB0ZXh0W3RleHRQb2ludGVyXSk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgcGF0Y2ggPSBuZXcgcGF0Y2hfb2JqKCk7XHJcbiAgICAgIHBhdGNoZXMucHVzaChwYXRjaCk7XHJcbiAgICAgIHBhdGNoLnN0YXJ0MSA9IHBhcnNlSW50KG1bMV0sIDEwKTtcclxuICAgICAgaWYgKG1bMl0gPT09ICcnKSB7XHJcbiAgICAgICAgcGF0Y2guc3RhcnQxLS07XHJcbiAgICAgICAgcGF0Y2gubGVuZ3RoMSA9IDE7XHJcbiAgICAgIH0gZWxzZSBpZiAobVsyXSA9PSAnMCcpIHtcclxuICAgICAgICBwYXRjaC5sZW5ndGgxID0gMDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBwYXRjaC5zdGFydDEtLTtcclxuICAgICAgICBwYXRjaC5sZW5ndGgxID0gcGFyc2VJbnQobVsyXSwgMTApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBwYXRjaC5zdGFydDIgPSBwYXJzZUludChtWzNdLCAxMCk7XHJcbiAgICAgIGlmIChtWzRdID09PSAnJykge1xyXG4gICAgICAgIHBhdGNoLnN0YXJ0Mi0tO1xyXG4gICAgICAgIHBhdGNoLmxlbmd0aDIgPSAxO1xyXG4gICAgICB9IGVsc2UgaWYgKG1bNF0gPT0gJzAnKSB7XHJcbiAgICAgICAgcGF0Y2gubGVuZ3RoMiA9IDA7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcGF0Y2guc3RhcnQyLS07XHJcbiAgICAgICAgcGF0Y2gubGVuZ3RoMiA9IHBhcnNlSW50KG1bNF0sIDEwKTtcclxuICAgICAgfVxyXG4gICAgICB0ZXh0UG9pbnRlcisrO1xyXG5cclxuICAgICAgd2hpbGUgKHRleHRQb2ludGVyIDwgdGV4dC5sZW5ndGgpIHtcclxuICAgICAgICBjb25zdCBzaWduID0gdGV4dFt0ZXh0UG9pbnRlcl0uY2hhckF0KDApO1xyXG4gICAgICAgIGxldCBsaW5lOiBzdHJpbmc7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGxpbmUgPSBkZWNvZGVVUkkodGV4dFt0ZXh0UG9pbnRlcl0uc3Vic3RyaW5nKDEpKTtcclxuICAgICAgICB9IGNhdGNoIChleCkge1xyXG4gICAgICAgICAgLy8gTWFsZm9ybWVkIFVSSSBzZXF1ZW5jZS5cclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSWxsZWdhbCBlc2NhcGUgaW4gcGF0Y2hfZnJvbVRleHQ6ICcgKyBsaW5lKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHNpZ24gPT0gJy0nKSB7XHJcbiAgICAgICAgICAvLyBEZWxldGlvbi5cclxuICAgICAgICAgIHBhdGNoLmRpZmZzLnB1c2goW0RpZmZPcC5EZWxldGUsIGxpbmVdKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHNpZ24gPT0gJysnKSB7XHJcbiAgICAgICAgICAvLyBJbnNlcnRpb24uXHJcbiAgICAgICAgICBwYXRjaC5kaWZmcy5wdXNoKFtEaWZmT3AuSW5zZXJ0LCBsaW5lXSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChzaWduID09ICcgJykge1xyXG4gICAgICAgICAgLy8gTWlub3IgZXF1YWxpdHkuXHJcbiAgICAgICAgICBwYXRjaC5kaWZmcy5wdXNoKFtEaWZmT3AuRXF1YWwsIGxpbmVdKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHNpZ24gPT0gJ0AnKSB7XHJcbiAgICAgICAgICAvLyBTdGFydCBvZiBuZXh0IHBhdGNoLlxyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfSBlbHNlIGlmIChzaWduID09PSAnJykge1xyXG4gICAgICAgICAgLy8gQmxhbmsgbGluZT8gIFdoYXRldmVyLlxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAvLyBXVEY/XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcGF0Y2ggbW9kZSBcIicgKyBzaWduICsgJ1wiIGluOiAnICsgbGluZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRleHRQb2ludGVyKys7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBwYXRjaGVzO1xyXG4gIH07XHJcblxyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIENsYXNzIHJlcHJlc2VudGluZyBvbmUgcGF0Y2ggb3BlcmF0aW9uLlxyXG5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBwYXRjaF9vYmoge1xyXG5cclxuICBjb25zdHJ1Y3RvcigpIHsgIH1cclxuXHJcbiAgZGlmZnM6IEFycmF5PERpZmY+ID0gW107XHJcbiAgc3RhcnQxOiBudW1iZXIgPSBudWxsO1xyXG4gIHN0YXJ0MjogbnVtYmVyID0gbnVsbDtcclxuICBsZW5ndGgxOiBudW1iZXIgPSAwO1xyXG4gIGxlbmd0aDI6IG51bWJlciA9IDA7XHJcblxyXG4gIC8qKlxyXG4gICAqIEVtbXVsYXRlIEdOVSBkaWZmJ3MgZm9ybWF0LlxyXG4gICAqIEhlYWRlcjogQEAgLTM4Miw4ICs0ODEsOSBAQFxyXG4gICAqIEluZGljaWVzIGFyZSBwcmludGVkIGFzIDEtYmFzZWQsIG5vdCAwLWJhc2VkLlxyXG4gICAqL1xyXG4gIHRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XHJcbiAgICBsZXQgY29vcmRzMSwgY29vcmRzMjtcclxuICAgIGlmICh0aGlzLmxlbmd0aDEgPT09IDApIHtcclxuICAgICAgY29vcmRzMSA9IHRoaXMuc3RhcnQxICsgJywwJztcclxuICAgIH0gZWxzZSBpZiAodGhpcy5sZW5ndGgxID09IDEpIHtcclxuICAgICAgY29vcmRzMSA9IHRoaXMuc3RhcnQxICsgMTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvb3JkczEgPSAodGhpcy5zdGFydDEgKyAxKSArICcsJyArIHRoaXMubGVuZ3RoMTtcclxuICAgIH1cclxuICAgIGlmICh0aGlzLmxlbmd0aDIgPT09IDApIHtcclxuICAgICAgY29vcmRzMiA9IHRoaXMuc3RhcnQyICsgJywwJztcclxuICAgIH0gZWxzZSBpZiAodGhpcy5sZW5ndGgyID09IDEpIHtcclxuICAgICAgY29vcmRzMiA9IHRoaXMuc3RhcnQyICsgMTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvb3JkczIgPSAodGhpcy5zdGFydDIgKyAxKSArICcsJyArIHRoaXMubGVuZ3RoMjtcclxuICAgIH1cclxuICAgIGNvbnN0IHRleHQgPSBbJ0BAIC0nICsgY29vcmRzMSArICcgKycgKyBjb29yZHMyICsgJyBAQFxcbiddO1xyXG4gICAgbGV0IG9wO1xyXG4gICAgLy8gRXNjYXBlIHRoZSBib2R5IG9mIHRoZSBwYXRjaCB3aXRoICV4eCBub3RhdGlvbi5cclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgdGhpcy5kaWZmcy5sZW5ndGg7IHgrKykge1xyXG4gICAgICBzd2l0Y2ggKHRoaXMuZGlmZnNbeF1bMF0pIHtcclxuICAgICAgICBjYXNlIERpZmZPcC5JbnNlcnQ6XHJcbiAgICAgICAgICBvcCA9ICcrJztcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgRGlmZk9wLkRlbGV0ZTpcclxuICAgICAgICAgIG9wID0gJy0nO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBEaWZmT3AuRXF1YWw6XHJcbiAgICAgICAgICBvcCA9ICcgJztcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICAgIHRleHRbeCArIDFdID0gb3AgKyBlbmNvZGVVUkkodGhpcy5kaWZmc1t4XVsxXSkgKyAnXFxuJztcclxuICAgIH1cclxuICAgIHJldHVybiB0ZXh0LmpvaW4oJycpLnJlcGxhY2UoLyUyMC9nLCAnICcpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IHsgRGlmZk1hdGNoUGF0Y2ggfTtcclxuIiwiaW1wb3J0IHsgSW5qZWN0YWJsZSwgT25Jbml0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7IERpZmZNYXRjaFBhdGNoLCBEaWZmT3AgfSBmcm9tICcuL2RpZmZNYXRjaFBhdGNoJztcclxuXHJcbkBJbmplY3RhYmxlKClcclxuZXhwb3J0IGNsYXNzIERpZmZNYXRjaFBhdGNoU2VydmljZSBpbXBsZW1lbnRzIE9uSW5pdCB7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZG1wOiBEaWZmTWF0Y2hQYXRjaCkgeyAgIH1cclxuXHJcbiAgbmdPbkluaXQgKCkge1xyXG5cclxuICB9XHJcblxyXG4gIGdldERpZmYobGVmdDogc3RyaW5nLCByaWdodDogc3RyaW5nKSB7XHJcbiAgICAgcmV0dXJuIHRoaXMuZG1wLmRpZmZfbWFpbihsZWZ0LCByaWdodCk7XHJcbiAgfVxyXG5cclxuICBnZXRTZW1hbnRpY0RpZmYobGVmdDogc3RyaW5nLCByaWdodDogc3RyaW5nKSB7XHJcbiAgICBjb25zdCBkaWZmcyA9IHRoaXMuZG1wLmRpZmZfbWFpbihsZWZ0LCByaWdodCk7XHJcbiAgICB0aGlzLmRtcC5kaWZmX2NsZWFudXBTZW1hbnRpYyhkaWZmcyk7XHJcbiAgICByZXR1cm4gZGlmZnM7XHJcbiAgfVxyXG5cclxuICBnZXRQcm9jZXNzaW5nRGlmZihsZWZ0OiBzdHJpbmcsIHJpZ2h0OiBzdHJpbmcpIHtcclxuICAgIGNvbnN0IGRpZmZzID0gdGhpcy5kbXAuZGlmZl9tYWluKGxlZnQsIHJpZ2h0KTtcclxuICAgIHRoaXMuZG1wLmRpZmZfY2xlYW51cEVmZmljaWVuY3koZGlmZnMpO1xyXG4gICAgcmV0dXJuIGRpZmZzO1xyXG4gIH1cclxuXHJcbiAgZ2V0TGluZURpZmYobGVmdDogc3RyaW5nLCByaWdodDogc3RyaW5nKSB7XHJcbiAgICBjb25zdCBjaGFycyA9IHRoaXMuZG1wLmRpZmZfbGluZXNUb0NoYXJzXyhsZWZ0LCByaWdodCk7XHJcbiAgICBjb25zdCBkaWZmcyA9IHRoaXMuZG1wLmRpZmZfbWFpbihjaGFycy5jaGFyczEsIGNoYXJzLmNoYXJzMiwgZmFsc2UpO1xyXG4gICAgdGhpcy5kbXAuZGlmZl9jaGFyc1RvTGluZXNfKGRpZmZzLCBjaGFycy5saW5lQXJyYXkpO1xyXG4gICAgcmV0dXJuIGRpZmZzO1xyXG4gIH1cclxuXHJcbiAgZ2V0RG1wKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZG1wO1xyXG4gIH1cclxuXHJcbn1cclxuIiwiLyohICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbkNvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcclxudGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcclxuTGljZW5zZSBhdCBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcclxuXHJcblRISVMgQ09ERSBJUyBQUk9WSURFRCBPTiBBTiAqQVMgSVMqIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcclxuS0lORCwgRUlUSEVSIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIFdJVEhPVVQgTElNSVRBVElPTiBBTlkgSU1QTElFRFxyXG5XQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgVElUTEUsIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLFxyXG5NRVJDSEFOVEFCTElUWSBPUiBOT04tSU5GUklOR0VNRU5ULlxyXG5cclxuU2VlIHRoZSBBcGFjaGUgVmVyc2lvbiAyLjAgTGljZW5zZSBmb3Igc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zXHJcbmFuZCBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cclxuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogKi9cclxuLyogZ2xvYmFsIFJlZmxlY3QsIFByb21pc2UgKi9cclxuXHJcbnZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24oZCwgYikge1xyXG4gICAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxyXG4gICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcclxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcclxuICAgIHJldHVybiBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZXh0ZW5kcyhkLCBiKSB7XHJcbiAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XHJcbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX19hc3NpZ24gPSBmdW5jdGlvbigpIHtcclxuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiBfX2Fzc2lnbih0KSB7XHJcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XHJcbiAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XHJcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSkgdFtwXSA9IHNbcF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3Jlc3QocywgZSkge1xyXG4gICAgdmFyIHQgPSB7fTtcclxuICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSAmJiBlLmluZGV4T2YocCkgPCAwKVxyXG4gICAgICAgIHRbcF0gPSBzW3BdO1xyXG4gICAgaWYgKHMgIT0gbnVsbCAmJiB0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBwID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhzKTsgaSA8IHAubGVuZ3RoOyBpKyspIGlmIChlLmluZGV4T2YocFtpXSkgPCAwKVxyXG4gICAgICAgICAgICB0W3BbaV1dID0gc1twW2ldXTtcclxuICAgIHJldHVybiB0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xyXG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XHJcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xyXG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcGFyYW0ocGFyYW1JbmRleCwgZGVjb3JhdG9yKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwga2V5KSB7IGRlY29yYXRvcih0YXJnZXQsIGtleSwgcGFyYW1JbmRleCk7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fbWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpIHtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2F3YWl0ZXIodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XHJcbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHJlc3VsdC52YWx1ZSk7IH0pLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cclxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZ2VuZXJhdG9yKHRoaXNBcmcsIGJvZHkpIHtcclxuICAgIHZhciBfID0geyBsYWJlbDogMCwgc2VudDogZnVuY3Rpb24oKSB7IGlmICh0WzBdICYgMSkgdGhyb3cgdFsxXTsgcmV0dXJuIHRbMV07IH0sIHRyeXM6IFtdLCBvcHM6IFtdIH0sIGYsIHksIHQsIGc7XHJcbiAgICByZXR1cm4gZyA9IHsgbmV4dDogdmVyYigwKSwgXCJ0aHJvd1wiOiB2ZXJiKDEpLCBcInJldHVyblwiOiB2ZXJiKDIpIH0sIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiAoZ1tTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KSwgZztcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyByZXR1cm4gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHN0ZXAoW24sIHZdKTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gc3RlcChvcCkge1xyXG4gICAgICAgIGlmIChmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiR2VuZXJhdG9yIGlzIGFscmVhZHkgZXhlY3V0aW5nLlwiKTtcclxuICAgICAgICB3aGlsZSAoXykgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKGYgPSAxLCB5ICYmICh0ID0gb3BbMF0gJiAyID8geVtcInJldHVyblwiXSA6IG9wWzBdID8geVtcInRocm93XCJdIHx8ICgodCA9IHlbXCJyZXR1cm5cIl0pICYmIHQuY2FsbCh5KSwgMCkgOiB5Lm5leHQpICYmICEodCA9IHQuY2FsbCh5LCBvcFsxXSkpLmRvbmUpIHJldHVybiB0O1xyXG4gICAgICAgICAgICBpZiAoeSA9IDAsIHQpIG9wID0gW29wWzBdICYgMiwgdC52YWx1ZV07XHJcbiAgICAgICAgICAgIHN3aXRjaCAob3BbMF0pIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgMDogY2FzZSAxOiB0ID0gb3A7IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA0OiBfLmxhYmVsKys7IHJldHVybiB7IHZhbHVlOiBvcFsxXSwgZG9uZTogZmFsc2UgfTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNTogXy5sYWJlbCsrOyB5ID0gb3BbMV07IG9wID0gWzBdOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNzogb3AgPSBfLm9wcy5wb3AoKTsgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodCA9IF8udHJ5cywgdCA9IHQubGVuZ3RoID4gMCAmJiB0W3QubGVuZ3RoIC0gMV0pICYmIChvcFswXSA9PT0gNiB8fCBvcFswXSA9PT0gMikpIHsgXyA9IDA7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSAzICYmICghdCB8fCAob3BbMV0gPiB0WzBdICYmIG9wWzFdIDwgdFszXSkpKSB7IF8ubGFiZWwgPSBvcFsxXTsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDYgJiYgXy5sYWJlbCA8IHRbMV0pIHsgXy5sYWJlbCA9IHRbMV07IHQgPSBvcDsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodCAmJiBfLmxhYmVsIDwgdFsyXSkgeyBfLmxhYmVsID0gdFsyXTsgXy5vcHMucHVzaChvcCk7IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRbMl0pIF8ub3BzLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIF8udHJ5cy5wb3AoKTsgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgb3AgPSBib2R5LmNhbGwodGhpc0FyZywgXyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkgeyBvcCA9IFs2LCBlXTsgeSA9IDA7IH0gZmluYWxseSB7IGYgPSB0ID0gMDsgfVxyXG4gICAgICAgIGlmIChvcFswXSAmIDUpIHRocm93IG9wWzFdOyByZXR1cm4geyB2YWx1ZTogb3BbMF0gPyBvcFsxXSA6IHZvaWQgMCwgZG9uZTogdHJ1ZSB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19leHBvcnRTdGFyKG0sIGV4cG9ydHMpIHtcclxuICAgIGZvciAodmFyIHAgaW4gbSkgaWYgKCFleHBvcnRzLmhhc093blByb3BlcnR5KHApKSBleHBvcnRzW3BdID0gbVtwXTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fdmFsdWVzKG8pIHtcclxuICAgIHZhciBtID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9bU3ltYm9sLml0ZXJhdG9yXSwgaSA9IDA7XHJcbiAgICBpZiAobSkgcmV0dXJuIG0uY2FsbChvKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgbmV4dDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAobyAmJiBpID49IG8ubGVuZ3RoKSBvID0gdm9pZCAwO1xyXG4gICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogbyAmJiBvW2krK10sIGRvbmU6ICFvIH07XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcmVhZChvLCBuKSB7XHJcbiAgICB2YXIgbSA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvW1N5bWJvbC5pdGVyYXRvcl07XHJcbiAgICBpZiAoIW0pIHJldHVybiBvO1xyXG4gICAgdmFyIGkgPSBtLmNhbGwobyksIHIsIGFyID0gW10sIGU7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHdoaWxlICgobiA9PT0gdm9pZCAwIHx8IG4tLSA+IDApICYmICEociA9IGkubmV4dCgpKS5kb25lKSBhci5wdXNoKHIudmFsdWUpO1xyXG4gICAgfVxyXG4gICAgY2F0Y2ggKGVycm9yKSB7IGUgPSB7IGVycm9yOiBlcnJvciB9OyB9XHJcbiAgICBmaW5hbGx5IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAociAmJiAhci5kb25lICYmIChtID0gaVtcInJldHVyblwiXSkpIG0uY2FsbChpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZmluYWxseSB7IGlmIChlKSB0aHJvdyBlLmVycm9yOyB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYXI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZCgpIHtcclxuICAgIGZvciAodmFyIGFyID0gW10sIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIGFyID0gYXIuY29uY2F0KF9fcmVhZChhcmd1bWVudHNbaV0pKTtcclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXdhaXQodikge1xyXG4gICAgcmV0dXJuIHRoaXMgaW5zdGFuY2VvZiBfX2F3YWl0ID8gKHRoaXMudiA9IHYsIHRoaXMpIDogbmV3IF9fYXdhaXQodik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jR2VuZXJhdG9yKHRoaXNBcmcsIF9hcmd1bWVudHMsIGdlbmVyYXRvcikge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBnID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pLCBpLCBxID0gW107XHJcbiAgICByZXR1cm4gaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIpLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaWYgKGdbbl0pIGlbbl0gPSBmdW5jdGlvbiAodikgeyByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKGEsIGIpIHsgcS5wdXNoKFtuLCB2LCBhLCBiXSkgPiAxIHx8IHJlc3VtZShuLCB2KTsgfSk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHJlc3VtZShuLCB2KSB7IHRyeSB7IHN0ZXAoZ1tuXSh2KSk7IH0gY2F0Y2ggKGUpIHsgc2V0dGxlKHFbMF1bM10sIGUpOyB9IH1cclxuICAgIGZ1bmN0aW9uIHN0ZXAocikgeyByLnZhbHVlIGluc3RhbmNlb2YgX19hd2FpdCA/IFByb21pc2UucmVzb2x2ZShyLnZhbHVlLnYpLnRoZW4oZnVsZmlsbCwgcmVqZWN0KSA6IHNldHRsZShxWzBdWzJdLCByKTsgfVxyXG4gICAgZnVuY3Rpb24gZnVsZmlsbCh2YWx1ZSkgeyByZXN1bWUoXCJuZXh0XCIsIHZhbHVlKTsgfVxyXG4gICAgZnVuY3Rpb24gcmVqZWN0KHZhbHVlKSB7IHJlc3VtZShcInRocm93XCIsIHZhbHVlKTsgfVxyXG4gICAgZnVuY3Rpb24gc2V0dGxlKGYsIHYpIHsgaWYgKGYodiksIHEuc2hpZnQoKSwgcS5sZW5ndGgpIHJlc3VtZShxWzBdWzBdLCBxWzBdWzFdKTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hc3luY0RlbGVnYXRvcihvKSB7XHJcbiAgICB2YXIgaSwgcDtcclxuICAgIHJldHVybiBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiwgZnVuY3Rpb24gKGUpIHsgdGhyb3cgZTsgfSksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4sIGYpIHsgaVtuXSA9IG9bbl0gPyBmdW5jdGlvbiAodikgeyByZXR1cm4gKHAgPSAhcCkgPyB7IHZhbHVlOiBfX2F3YWl0KG9bbl0odikpLCBkb25lOiBuID09PSBcInJldHVyblwiIH0gOiBmID8gZih2KSA6IHY7IH0gOiBmOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jVmFsdWVzKG8pIHtcclxuICAgIGlmICghU3ltYm9sLmFzeW5jSXRlcmF0b3IpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJTeW1ib2wuYXN5bmNJdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbiAgICB2YXIgbSA9IG9bU3ltYm9sLmFzeW5jSXRlcmF0b3JdLCBpO1xyXG4gICAgcmV0dXJuIG0gPyBtLmNhbGwobykgOiAobyA9IHR5cGVvZiBfX3ZhbHVlcyA9PT0gXCJmdW5jdGlvblwiID8gX192YWx1ZXMobykgOiBvW1N5bWJvbC5pdGVyYXRvcl0oKSwgaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIpLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGkpO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IGlbbl0gPSBvW25dICYmIGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7IHYgPSBvW25dKHYpLCBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCB2LmRvbmUsIHYudmFsdWUpOyB9KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gc2V0dGxlKHJlc29sdmUsIHJlamVjdCwgZCwgdikgeyBQcm9taXNlLnJlc29sdmUodikudGhlbihmdW5jdGlvbih2KSB7IHJlc29sdmUoeyB2YWx1ZTogdiwgZG9uZTogZCB9KTsgfSwgcmVqZWN0KTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19tYWtlVGVtcGxhdGVPYmplY3QoY29va2VkLCByYXcpIHtcclxuICAgIGlmIChPYmplY3QuZGVmaW5lUHJvcGVydHkpIHsgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNvb2tlZCwgXCJyYXdcIiwgeyB2YWx1ZTogcmF3IH0pOyB9IGVsc2UgeyBjb29rZWQucmF3ID0gcmF3OyB9XHJcbiAgICByZXR1cm4gY29va2VkO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0U3Rhcihtb2QpIHtcclxuICAgIGlmIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpIHJldHVybiBtb2Q7XHJcbiAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICBpZiAobW9kICE9IG51bGwpIGZvciAodmFyIGsgaW4gbW9kKSBpZiAoT2JqZWN0Lmhhc093blByb3BlcnR5LmNhbGwobW9kLCBrKSkgcmVzdWx0W2tdID0gbW9kW2tdO1xyXG4gICAgcmVzdWx0LmRlZmF1bHQgPSBtb2Q7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19pbXBvcnREZWZhdWx0KG1vZCkge1xyXG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBkZWZhdWx0OiBtb2QgfTtcclxufVxyXG4iLCJpbXBvcnQgeyBDb21wb25lbnQsIElucHV0LCBPbkluaXQsIE9uQ2hhbmdlcyB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQgeyBEaWZmLCBEaWZmT3AgfSBmcm9tICcuL2RpZmZNYXRjaFBhdGNoJztcclxuaW1wb3J0IHsgRGlmZk1hdGNoUGF0Y2hTZXJ2aWNlIH0gZnJvbSAnLi9kaWZmTWF0Y2hQYXRjaC5zZXJ2aWNlJztcclxuXHJcbi8qIEhvbGRzIHRoZSBzdGF0ZSBvZiB0aGUgY2FsY3VsYXRpb24gb2YgdGhlIGRpZmYgcmVzdWx0IHdlIGludGVuZCB0byBkaXNwbGF5LlxyXG4gKiAgPiBsaW5lcyBjb250YWlucyB0aGUgZGF0YSB0aGF0IHdpbGwgYmUgZGlzcGxheWVkIG9uIHNjcmVlbi5cclxuICogID4gbGluZUxlZnQga2VlcHMgdHJhY2sgb2YgdGhlIGRvY3VtZW50IGxpbmUgbnVtYmVyIGluIHRoZSBbbGVmdF0gaW5wdXQuXHJcbiAqICA+IGxpbmVSaWdodCBrZWVwcyB0cmFjayBvZiB0aGUgZG9jdW1lbnQgbGluZSBudW1iZXIgaW4gdGhlIFtyaWdodF0gaW5wdXQuXHJcbiAqL1xyXG50eXBlIERpZmZDYWxjdWxhdGlvbiA9IHtcclxuICBsaW5lczogQXJyYXk8W3N0cmluZywgc3RyaW5nLCBzdHJpbmcsIHN0cmluZ10+LFxyXG4gIGxpbmVMZWZ0OiBudW1iZXIsXHJcbiAgbGluZVJpZ2h0OiBudW1iZXJcclxufTtcclxuXHJcbkBDb21wb25lbnQoe1xyXG4gIHNlbGVjdG9yOiAnZG1wLWxpbmUtY29tcGFyZScsXHJcbiAgc3R5bGVzOiBbYFxyXG4gICAgZGl2LmRtcC1saW5lLWNvbXBhcmUge1xyXG4gICAgICBkaXNwbGF5OiBmbGV4O1xyXG4gICAgICBmbGV4LWRpcmVjdGlvbjogcm93O1xyXG4gICAgICBib3JkZXI6IDFweCBzb2xpZCAjODA4MDgwO1xyXG4gICAgICBmb250LWZhbWlseTogQ29uc29sYXMsIENvdXJpZXIsIG1vbm9zcGFjZTtcclxuICAgICAgd2lkdGg6IDkxMXB4O1xyXG4gICAgfVxyXG4gICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtbWFyZ2luIHtcclxuICAgICAgd2lkdGg6IDEwMXB4O1xyXG4gICAgfVxyXG4gICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtY29udGVudCB7XHJcbiAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcclxuICAgICAgdG9wOiAwcHg7XHJcbiAgICAgIGxlZnQ6IDBweDtcclxuICAgICAgZmxleC1ncm93OiAxO1xyXG4gICAgICBvdmVyZmxvdy14OiBzY3JvbGw7XHJcbiAgICB9XHJcbiAgICBkaXYuZG1wLWxpbmUtY29tcGFyZS1jb250ZW50LXdyYXBwZXIge1xyXG4gICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XHJcbiAgICAgIHRvcDogMHB4O1xyXG4gICAgICBsZWZ0OiAwcHg7XHJcbiAgICAgIGRpc3BsYXk6IGZsZXg7XHJcbiAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XHJcbiAgICAgIGFsaWduLWl0ZW1zOiBzdHJldGNoO1xyXG4gICAgfVxyXG4gICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtbGVmdCB7XHJcbiAgICAgIHdpZHRoOiA1MHB4O1xyXG4gICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XHJcbiAgICAgIGNvbG9yOiAjNDg0ODQ4O1xyXG4gICAgfVxyXG4gICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtZXF1YWw+ZGl2LmRtcC1saW5lLWNvbXBhcmUtbGVmdCxcclxuICAgICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtZXF1YWw+ZGl2LmRtcC1saW5lLWNvbXBhcmUtcmlnaHQge1xyXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZGVkZWRlO1xyXG4gICAgfVxyXG4gICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtaW5zZXJ0PmRpdi5kbXAtbGluZS1jb21wYXJlLWxlZnQsXHJcbiAgICAgIGRpdi5kbXAtbGluZS1jb21wYXJlLWluc2VydD5kaXYuZG1wLWxpbmUtY29tcGFyZS1yaWdodCB7XHJcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICM4YmZiNmY7XHJcbiAgICB9XHJcbiAgICBkaXYuZG1wLWxpbmUtY29tcGFyZS1kZWxldGU+ZGl2LmRtcC1saW5lLWNvbXBhcmUtbGVmdCxcclxuICAgICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtZGVsZXRlPmRpdi5kbXAtbGluZS1jb21wYXJlLXJpZ2h0IHtcclxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2Y1Njg2ODtcclxuICAgIH1cclxuICAgIGRpdi5kbXAtbGluZS1jb21wYXJlLXJpZ2h0IHtcclxuICAgICAgd2lkdGg6IDUwcHg7XHJcbiAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcclxuICAgICAgY29sb3I6ICM0ODQ4NDg7XHJcbiAgICAgIGJvcmRlci1yaWdodDogMXB4IHNvbGlkICM4ODg4ODg7XHJcbiAgICB9XHJcbiAgICBkaXYuZG1wLWxpbmUtY29tcGFyZS10ZXh0IHtcclxuICAgICAgd2hpdGUtc3BhY2U6IHByZTtcclxuICAgICAgcGFkZGluZy1sZWZ0OiAxMHB4O1xyXG4gICAgICBtaW4td2lkdGg6IDgwMHB4O1xyXG4gICAgfVxyXG4gICAgLmRtcC1saW5lLWNvbXBhcmUtZGVsZXRlIHtcclxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmOGM4YztcclxuICAgIH1cclxuICAgIC5kbXAtbGluZS1jb21wYXJlLWluc2VydCB7XHJcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICM5ZGZmOTc7XHJcbiAgICB9XHJcbiAgICAuZG1wLWxpbmUtY29tcGFyZS1kZWxldGU+ZGl2IHtcclxuICAgICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xyXG4gICAgfSAgXHJcbiAgICAuZG1wLWxpbmUtY29tcGFyZS1pbnNlcnQ+ZGl2IHtcclxuICAgICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xyXG4gICAgfVxyXG4gICAgLmRtcC1saW5lLWNvbXBhcmUtZXF1YWw+ZGl2IHtcclxuICAgICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xyXG4gICAgfVxyXG4gICAgLmRtcC1tYXJnaW4tYm90dG9tLXNwYWNlciB7XHJcbiAgICAgIGhlaWdodDogMjBweDtcclxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2RlZGVkZTtcclxuICAgICAgYm9yZGVyLXJpZ2h0OiAxcHggc29saWQgIzg4ODg4ODtcclxuICAgIH1cclxuICBgXSxcclxuICB0ZW1wbGF0ZTogYFxyXG4gICAgPGRpdiBjbGFzcz1cImRtcC1saW5lLWNvbXBhcmUtbm8tY2hhbmdlcy10ZXh0XCIgKm5nSWY9XCJpc0NvbnRlbnRFcXVhbFwiPlxyXG4gICAgICBUaGVyZSBhcmUgbm8gY2hhbmdlcyB0byBkaXNwbGF5LlxyXG4gICAgPC9kaXY+ICAgIFxyXG4gICAgPGRpdiBjbGFzcz1cImRtcC1saW5lLWNvbXBhcmVcIiAqbmdJZj1cIiFpc0NvbnRlbnRFcXVhbFwiPlxyXG4gICAgICA8ZGl2IGNsYXNzPVwiZG1wLWxpbmUtY29tcGFyZS1tYXJnaW5cIj5cclxuICAgICAgICA8ZGl2IFtuZ0NsYXNzXT1cImxpbmVEaWZmWzBdXCIgKm5nRm9yPVwibGV0IGxpbmVEaWZmIG9mIGNhbGN1bGF0ZWREaWZmXCI+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiZG1wLWxpbmUtY29tcGFyZS1sZWZ0XCI+e3tsaW5lRGlmZlsxXX19PC9kaXY+PCEtLSBObyBzcGFjZVxyXG4gICAgICAgIC0tPjxkaXYgY2xhc3M9XCJkbXAtbGluZS1jb21wYXJlLXJpZ2h0XCI+e3tsaW5lRGlmZlsyXX19PC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPGRpdiBjbGFzcz1cImRtcC1tYXJnaW4tYm90dG9tLXNwYWNlclwiPjwvZGl2PlxyXG4gICAgICA8L2Rpdj48IS0tIE5vIHNwYWNlXHJcbiAgIC0tPjxkaXYgY2xhc3M9XCJkbXAtbGluZS1jb21wYXJlLWNvbnRlbnRcIj5cclxuICAgICAgICA8ZGl2IGNsYXNzPVwiZG1wLWxpbmUtY29tcGFyZS1jb250ZW50LXdyYXBwZXJcIj5cclxuICAgICAgICAgIDxkaXYgW25nQ2xhc3NdPVwibGluZURpZmZbMF1cIiAqbmdGb3I9XCJsZXQgbGluZURpZmYgb2YgY2FsY3VsYXRlZERpZmZcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImRtcC1saW5lLWNvbXBhcmUtdGV4dFwiPnt7bGluZURpZmZbM119fTwvZGl2PlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgPC9kaXY+XHJcbiAgYFxyXG59KVxyXG5leHBvcnQgY2xhc3MgTGluZUNvbXBhcmVDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQsIE9uQ2hhbmdlcyB7XHJcbiAgQElucHV0KClcclxuICBwdWJsaWMgbGVmdDogc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbiA9ICcnO1xyXG4gIEBJbnB1dCgpXHJcbiAgcHVibGljIHJpZ2h0OiBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuID0gJyc7XHJcbiAgLy8gVGhlIG51bWJlciBvZiBsaW5lcyBvZiBjb250ZXh0IHRvIHByb3ZpZGUgZWl0aGVyIHNpZGUgb2YgYSBEaWZmT3AuSW5zZXJ0IG9yIERpZmZPcC5EZWxldGUgZGlmZi5cclxuICAvLyBDb250ZXh0IGlzIHRha2VuIGZyb20gYSBEaWZmT3AuRXF1YWwgc2VjdGlvbi5cclxuICBASW5wdXQoKVxyXG4gIHB1YmxpYyBsaW5lQ29udGV4dFNpemU6IG51bWJlcjtcclxuXHJcbiAgcHVibGljIGNhbGN1bGF0ZWREaWZmOiBBcnJheTxbc3RyaW5nLCBzdHJpbmcsIHN0cmluZywgc3RyaW5nXT47XHJcbiAgcHVibGljIGlzQ29udGVudEVxdWFsOiBib29sZWFuO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoXHJcbiAgICAgIHByaXZhdGUgZG1wOiBEaWZmTWF0Y2hQYXRjaFNlcnZpY2UpIHt9XHJcblxyXG4gIHB1YmxpYyBuZ09uSW5pdCgpOiB2b2lkIHtcclxuICAgIHRoaXMudXBkYXRlSHRtbCgpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG5nT25DaGFuZ2VzKCk6IHZvaWQge1xyXG4gICAgdGhpcy51cGRhdGVIdG1sKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHVwZGF0ZUh0bWwoKTogdm9pZCB7XHJcbiAgICBpZiAodHlwZW9mIHRoaXMubGVmdCA9PT0gJ251bWJlcicgfHwgdHlwZW9mIHRoaXMubGVmdCA9PT0gJ2Jvb2xlYW4nKSB7XHJcbiAgICAgIHRoaXMubGVmdCA9IHRoaXMubGVmdC50b1N0cmluZygpO1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiB0aGlzLnJpZ2h0ID09PSAnbnVtYmVyJyB8fCB0eXBlb2YgdGhpcy5yaWdodCA9PT0gJ2Jvb2xlYW4nKSB7XHJcbiAgICAgIHRoaXMucmlnaHQgPSB0aGlzLnJpZ2h0LnRvU3RyaW5nKCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmNhbGN1bGF0ZUxpbmVEaWZmKHRoaXMuZG1wLmdldExpbmVEaWZmKHRoaXMubGVmdCwgdGhpcy5yaWdodCkpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBjYWxjdWxhdGVMaW5lRGlmZihkaWZmczogQXJyYXk8RGlmZj4pOiB2b2lkIHtcclxuICAgIGNvbnN0IGRpZmZDYWxjdWxhdGlvbjogRGlmZkNhbGN1bGF0aW9uID0ge1xyXG4gICAgICBsaW5lczogW10sXHJcbiAgICAgIGxpbmVMZWZ0OiAxLFxyXG4gICAgICBsaW5lUmlnaHQ6IDFcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pc0NvbnRlbnRFcXVhbCA9IGRpZmZzLmxlbmd0aCA9PT0gMSAmJiBkaWZmc1swXVswXSA9PT0gRGlmZk9wLkVxdWFsO1xyXG4gICAgaWYgKHRoaXMuaXNDb250ZW50RXF1YWwpIHtcclxuICAgICAgdGhpcy5jYWxjdWxhdGVkRGlmZiA9IFtdO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaWZmcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBjb25zdCBkaWZmID0gZGlmZnNbaV07XHJcbiAgICAgIGxldCBkaWZmTGluZXM6IHN0cmluZ1tdID0gZGlmZlsxXS5zcGxpdCgvXFxyP1xcbi8pO1xyXG5cclxuICAgICAgLy8gSWYgdGhlIG9yaWdpbmFsIGxpbmUgaGFkIGEgXFxyXFxuIGF0IHRoZSBlbmQgdGhlbiByZW1vdmUgdGhlXHJcbiAgICAgIC8vIGVtcHR5IHN0cmluZyBhZnRlciBpdC5cclxuICAgICAgaWYgKGRpZmZMaW5lc1tkaWZmTGluZXMubGVuZ3RoIC0gMV0ubGVuZ3RoID09IDApIHtcclxuICAgICAgICBkaWZmTGluZXMucG9wKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHN3aXRjaCAoZGlmZlswXSkge1xyXG4gICAgICAgIGNhc2UgRGlmZk9wLkVxdWFsOiB7XHJcbiAgICAgICAgICBjb25zdCBpc0ZpcnN0RGlmZiA9IGkgPT09IDA7XHJcbiAgICAgICAgICBjb25zdCBpc0xhc3REaWZmID0gaSA9PT0gZGlmZnMubGVuZ3RoIC0gMTtcclxuICAgICAgICAgIHRoaXMub3V0cHV0RXF1YWxEaWZmKGRpZmZMaW5lcywgZGlmZkNhbGN1bGF0aW9uLCBpc0ZpcnN0RGlmZiwgaXNMYXN0RGlmZik7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgICAgY2FzZSBEaWZmT3AuRGVsZXRlOiB7XHJcbiAgICAgICAgICB0aGlzLm91dHB1dERlbGV0ZURpZmYoZGlmZkxpbmVzLCBkaWZmQ2FsY3VsYXRpb24pO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhc2UgRGlmZk9wLkluc2VydDoge1xyXG4gICAgICAgICAgdGhpcy5vdXRwdXRJbnNlcnREaWZmKGRpZmZMaW5lcywgZGlmZkNhbGN1bGF0aW9uKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuY2FsY3VsYXRlZERpZmYgPSBkaWZmQ2FsY3VsYXRpb24ubGluZXM7XHJcbiAgfVxyXG5cclxuICAvKiBJZiB0aGUgbnVtYmVyIG9mIGRpZmZMaW5lcyBpcyBncmVhdGVyIHRoYW4gbGluZUNvbnRleHRTaXplIHRoZW4gd2UgbWF5IG5lZWQgdG8gYWRqdXN0IHRoZSBkaWZmXHJcbiAgICogdGhhdCBpcyBvdXRwdXQuXHJcbiAgICogICA+IElmIHRoZSBmaXJzdCBkaWZmIG9mIGEgZG9jdW1lbnQgaXMgRGlmZk9wLkVxdWFsIHRoZW4gdGhlIGxlYWRpbmcgbGluZXMgY2FuIGJlIGRyb3BwZWRcclxuICAgKiAgICAgbGVhdmluZyB0aGUgbGFzdCAnbGluZUNvbnRleHRTaXplJyBsaW5lcyBmb3IgY29udGV4dC5cclxuICAgKiAgID4gSWYgdGhlIGxhc3QgZGlmZiBvZiBhIGRvY3VtZW50IGlzIERpZmZPcC5FcXVhbCB0aGVuIHRoZSB0cmFpbGluZyBsaW5lcyBjYW4gYmUgZHJvcHBlZFxyXG4gICAqICAgICBsZWF2aW5nIHRoZSBmaXJzdCAnbGluZUNvbnRleHRTaXplJyBsaW5lcyBmb3IgY29udGV4dC5cclxuICAgKiAgID4gSWYgdGhlIGRpZmYgaXMgYSBEaWZmT3AuRXF1YWwgb2NjdXJzIGluIHRoZSBtaWRkbGUgdGhlbiB0aGUgZGlmZnMgZWl0aGVyIHNpZGUgb2YgaXQgbXVzdCBiZVxyXG4gICAqICAgICBEaWZmT3AuSW5zZXJ0IG9yIERpZmZPcC5EZWxldGUuIElmIGl0IGhhcyBtb3JlIHRoYW4gMiAqICdsaW5lQ29udGV4dFNpemUnIGxpbmVzIG9mIGNvbnRlbnRcclxuICAgKiAgICAgdGhlbiB0aGUgbWlkZGxlIGxpbmVzIGFyZSBkcm9wcGVkIGxlYXZpbmcgdGhlIGZpcnN0ICdsaW5lQ29udGV4dFNpemUnIGFuZCBsYXN0ICdsaW5lQ29udGV4dFNpemUnXHJcbiAgICogICAgIGxpbmVzIGZvciBjb250ZXh0LiBBIHNwZWNpYWwgbGluZSBpcyBpbnNlcnRlZCB3aXRoICcuLi4nIGluZGljYXRpbmcgdGhhdCBjb250ZW50IGlzIHNraXBwZWQuXHJcbiAgICpcclxuICAgKiBBIGRvY3VtZW50IGNhbm5vdCBjb25zaXN0IG9mIGEgc2luZ2xlIERpZmYgd2l0aCBEaWZmT3AuRXF1YWwgYW5kIHJlYWNoIHRoaXMgZnVuY3Rpb24gYmVjYXVzZVxyXG4gICAqIGluIHRoaXMgY2FzZSB0aGUgY2FsY3VsYXRlTGluZURpZmYgbWV0aG9kIHJldHVybnMgZWFybHkuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBvdXRwdXRFcXVhbERpZmYoXHJcbiAgICAgIGRpZmZMaW5lczogc3RyaW5nW10sXHJcbiAgICAgIGRpZmZDYWxjdWxhdGlvbjogRGlmZkNhbGN1bGF0aW9uLFxyXG4gICAgICBpc0ZpcnN0RGlmZjogYm9vbGVhbixcclxuICAgICAgaXNMYXN0RGlmZjogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgaWYgKHRoaXMubGluZUNvbnRleHRTaXplICYmIGRpZmZMaW5lcy5sZW5ndGggPiB0aGlzLmxpbmVDb250ZXh0U2l6ZSkge1xyXG4gICAgICBpZiAoaXNGaXJzdERpZmYpIHtcclxuICAgICAgICAvLyBUYWtlIHRoZSBsYXN0ICdsaW5lQ29udGV4dFNpemUnIGxpbmVzIGZyb20gdGhlIGZpcnN0IGRpZmZcclxuICAgICAgICBjb25zdCBsaW5lSW5jcmVtZW50ID0gZGlmZkxpbmVzLmxlbmd0aCAtIHRoaXMubGluZUNvbnRleHRTaXplO1xyXG4gICAgICAgIGRpZmZDYWxjdWxhdGlvbi5saW5lTGVmdCArPSBsaW5lSW5jcmVtZW50O1xyXG4gICAgICAgIGRpZmZDYWxjdWxhdGlvbi5saW5lUmlnaHQgKz0gbGluZUluY3JlbWVudDtcclxuICAgICAgICBkaWZmTGluZXMgPSBkaWZmTGluZXMuc2xpY2UoZGlmZkxpbmVzLmxlbmd0aCAtIHRoaXMubGluZUNvbnRleHRTaXplLCBkaWZmTGluZXMubGVuZ3RoKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmIChpc0xhc3REaWZmKSB7XHJcbiAgICAgICAgLy8gVGFrZSBvbmx5IHRoZSBmaXJzdCAnbGluZUNvbnRleHRTaXplJyBsaW5lcyBmcm9tIHRoZSBmaW5hbCBkaWZmXHJcbiAgICAgICAgZGlmZkxpbmVzID0gZGlmZkxpbmVzLnNsaWNlKDAsIHRoaXMubGluZUNvbnRleHRTaXplKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmIChkaWZmTGluZXMubGVuZ3RoID4gMiAqIHRoaXMubGluZUNvbnRleHRTaXplKSB7XHJcbiAgICAgICAgLy8gVGFrZSB0aGUgZmlyc3QgJ2xpbmVDb250ZXh0U2l6ZScgbGluZXMgZnJvbSB0aGlzIGRpZmYgdG8gcHJvdmlkZSBjb250ZXh0IGZvciB0aGUgbGFzdCBkaWZmXHJcbiAgICAgICAgdGhpcy5vdXRwdXRFcXVhbERpZmZMaW5lcyhkaWZmTGluZXMuc2xpY2UoMCwgdGhpcy5saW5lQ29udGV4dFNpemUpLCBkaWZmQ2FsY3VsYXRpb24pO1xyXG5cclxuICAgICAgICAvLyBPdXRwdXQgYSBzcGVjaWFsIGxpbmUgaW5kaWNhdGluZyB0aGF0IHNvbWUgY29udGVudCBpcyBlcXVhbCBhbmQgaGFzIGJlZW4gc2tpcHBlZFxyXG4gICAgICAgIGRpZmZDYWxjdWxhdGlvbi5saW5lcy5wdXNoKFsnZG1wLWxpbmUtY29tcGFyZS1lcXVhbCcsICcuLi4nLCAnLi4uJywgJy4uLiddKTtcclxuICAgICAgICBjb25zdCBudW1iZXJPZlNraXBwZWRMaW5lcyA9IGRpZmZMaW5lcy5sZW5ndGggLSAoMiAqIHRoaXMubGluZUNvbnRleHRTaXplKTtcclxuICAgICAgICBkaWZmQ2FsY3VsYXRpb24ubGluZUxlZnQgKz0gbnVtYmVyT2ZTa2lwcGVkTGluZXM7XHJcbiAgICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVSaWdodCArPSBudW1iZXJPZlNraXBwZWRMaW5lcztcclxuXHJcbiAgICAgICAgLy8gVGFrZSB0aGUgbGFzdCAnbGluZUNvbnRleHRTaXplJyBsaW5lcyBmcm9tIHRoaXMgZGlmZiB0byBwcm92aWRlIGNvbnRleHQgZm9yIHRoZSBuZXh0IGRpZmZcclxuICAgICAgICB0aGlzLm91dHB1dEVxdWFsRGlmZkxpbmVzKGRpZmZMaW5lcy5zbGljZShkaWZmTGluZXMubGVuZ3RoIC0gdGhpcy5saW5lQ29udGV4dFNpemUpLCBkaWZmQ2FsY3VsYXRpb24pO1xyXG4gICAgICAgIC8vIFRoaXMgaWYgYnJhbmNoIGhhcyBhbHJlYWR5IG91dHB1dCB0aGUgZGlmZiBsaW5lcyBzbyB3ZSByZXR1cm4gZWFybHkgdG8gYXZvaWQgb3V0cHV0dGluZyB0aGUgbGluZXNcclxuICAgICAgICAvLyBhdCB0aGUgZW5kIG9mIHRoZSBtZXRob2QuXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLm91dHB1dEVxdWFsRGlmZkxpbmVzKGRpZmZMaW5lcywgZGlmZkNhbGN1bGF0aW9uKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgb3V0cHV0RXF1YWxEaWZmTGluZXMoXHJcbiAgICAgIGRpZmZMaW5lczogc3RyaW5nW10sXHJcbiAgICAgIGRpZmZDYWxjdWxhdGlvbjogRGlmZkNhbGN1bGF0aW9uKTogdm9pZCB7XHJcbiAgICBmb3IgKGNvbnN0IGxpbmUgb2YgZGlmZkxpbmVzKSB7XHJcbiAgICAgIGRpZmZDYWxjdWxhdGlvbi5saW5lcy5wdXNoKFsnZG1wLWxpbmUtY29tcGFyZS1lcXVhbCcsIGAke2RpZmZDYWxjdWxhdGlvbi5saW5lTGVmdH1gLCBgJHtkaWZmQ2FsY3VsYXRpb24ubGluZVJpZ2h0fWAsIGxpbmVdKTtcclxuICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVMZWZ0Kys7XHJcbiAgICAgIGRpZmZDYWxjdWxhdGlvbi5saW5lUmlnaHQrKztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgb3V0cHV0RGVsZXRlRGlmZihcclxuICAgICAgZGlmZkxpbmVzOiBzdHJpbmdbXSxcclxuICAgICAgZGlmZkNhbGN1bGF0aW9uOiBEaWZmQ2FsY3VsYXRpb24pOiB2b2lkIHtcclxuICAgIGZvciAoY29uc3QgbGluZSBvZiBkaWZmTGluZXMpIHtcclxuICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVzLnB1c2goWydkbXAtbGluZS1jb21wYXJlLWRlbGV0ZScsIGAke2RpZmZDYWxjdWxhdGlvbi5saW5lTGVmdH1gLCAnLScsIGxpbmVdKTtcclxuICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVMZWZ0Kys7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIG91dHB1dEluc2VydERpZmYoXHJcbiAgICAgIGRpZmZMaW5lczogc3RyaW5nW10sXHJcbiAgICAgIGRpZmZDYWxjdWxhdGlvbjogRGlmZkNhbGN1bGF0aW9uKTogdm9pZCB7XHJcbiAgICBmb3IgKGNvbnN0IGxpbmUgb2YgZGlmZkxpbmVzKSB7XHJcbiAgICAgIGRpZmZDYWxjdWxhdGlvbi5saW5lcy5wdXNoKFsnZG1wLWxpbmUtY29tcGFyZS1pbnNlcnQnLCAnLScsIGAke2RpZmZDYWxjdWxhdGlvbi5saW5lUmlnaHR9YCwgbGluZV0pO1xyXG4gICAgICBkaWZmQ2FsY3VsYXRpb24ubGluZVJpZ2h0Kys7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IERpcmVjdGl2ZSwgRWxlbWVudFJlZiwgSW5wdXQsIE9uSW5pdCwgT25DaGFuZ2VzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7IERpZmZNYXRjaFBhdGNoU2VydmljZSB9IGZyb20gJy4vZGlmZk1hdGNoUGF0Y2guc2VydmljZSc7XHJcbmltcG9ydCB7IERpZmYsIERpZmZPcCB9IGZyb20gJy4vZGlmZk1hdGNoUGF0Y2gnO1xyXG5cclxuQERpcmVjdGl2ZSh7XHJcbiAgc2VsZWN0b3I6ICdbZGlmZl0nXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBEaWZmRGlyZWN0aXZlIGltcGxlbWVudHMgT25Jbml0LCBPbkNoYW5nZXMge1xyXG5cclxuICBASW5wdXQoKSBsZWZ0OiBzdHJpbmcgPSAnJztcclxuICBASW5wdXQoKSByaWdodDogc3RyaW5nID0gJyc7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihcclxuICAgIHByaXZhdGUgZWw6IEVsZW1lbnRSZWYsXHJcbiAgICBwcml2YXRlIGRtcDogRGlmZk1hdGNoUGF0Y2hTZXJ2aWNlKSB7ICB9XHJcblxyXG4gIHB1YmxpYyBuZ09uSW5pdCgpOiB2b2lkIHtcclxuICAgIHRoaXMudXBkYXRlSHRtbCgpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG5nT25DaGFuZ2VzKCk6IHZvaWQge1xyXG4gICAgdGhpcy51cGRhdGVIdG1sKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHVwZGF0ZUh0bWwoKTogdm9pZCB7XHJcbiAgICB0aGlzLmVsLm5hdGl2ZUVsZW1lbnQuaW5uZXJIVE1MID0gdGhpcy5jcmVhdGVIdG1sKFxyXG4gICAgICB0aGlzLmRtcC5nZXREaWZmKHRoaXMubGVmdCwgdGhpcy5yaWdodCkpO1xyXG4gIH1cclxuICBcclxuICBwcml2YXRlIGNyZWF0ZUh0bWwoZGlmZnM6IEFycmF5PERpZmY+KTogc3RyaW5nIHtcclxuICAgIGxldCBodG1sOiBzdHJpbmc7XHJcbiAgICBodG1sID0gJzxkaXY+JztcclxuICAgIGZvcihsZXQgZGlmZiBvZiBkaWZmcykge1xyXG4gICAgICBkaWZmWzFdID0gZGlmZlsxXS5yZXBsYWNlKC9cXG4vZywgJzxici8+Jyk7XHJcblxyXG4gICAgICBpZihkaWZmWzBdID09PSBEaWZmT3AuRXF1YWwpIHtcclxuICAgICAgICBodG1sICs9ICc8c3BhbiBjbGFzcz1cImVxdWFsXCI+JyArIGRpZmZbMV0gKyAnPC9zcGFuPic7XHJcbiAgICAgIH1cclxuICAgICAgaWYoZGlmZlswXSA9PT0gRGlmZk9wLkRlbGV0ZSkge1xyXG4gICAgICAgIGh0bWwgKz0gJzxkZWw+JyArIGRpZmZbMV0gKyAnPC9kZWw+JztcclxuICAgICAgfVxyXG4gICAgICBpZihkaWZmWzBdID09PSBEaWZmT3AuSW5zZXJ0KSB7XHJcbiAgICAgICAgaHRtbCArPSAnPGlucz4nICsgZGlmZlsxXSArICc8L2lucz4nO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBodG1sICs9ICc8L2Rpdj4nO1xyXG4gICAgcmV0dXJuIGh0bWw7XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IERpcmVjdGl2ZSwgRWxlbWVudFJlZiwgSW5wdXQsIE9uSW5pdCwgT25DaGFuZ2VzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7IERpZmZNYXRjaFBhdGNoU2VydmljZSB9IGZyb20gJy4vZGlmZk1hdGNoUGF0Y2guc2VydmljZSc7XHJcbmltcG9ydCB7IERpZmYsIERpZmZPcCB9IGZyb20gJy4vZGlmZk1hdGNoUGF0Y2gnO1xyXG5cclxuQERpcmVjdGl2ZSh7XHJcbiAgc2VsZWN0b3I6ICdbbGluZURpZmZdJyxcclxufSlcclxuZXhwb3J0IGNsYXNzIExpbmVEaWZmRGlyZWN0aXZlIGltcGxlbWVudHMgT25Jbml0LCBPbkNoYW5nZXMge1xyXG4gIEBJbnB1dCgpIGxlZnQ6IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW47XHJcbiAgQElucHV0KCkgcmlnaHQ6IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW47XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihcclxuICAgIHByaXZhdGUgZWw6IEVsZW1lbnRSZWYsXHJcbiAgICBwcml2YXRlIGRtcDogRGlmZk1hdGNoUGF0Y2hTZXJ2aWNlKSB7ICB9XHJcblxyXG4gIHB1YmxpYyBuZ09uSW5pdCgpOiB2b2lkIHtcclxuICAgIHRoaXMudXBkYXRlSHRtbCgpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG5nT25DaGFuZ2VzKCk6IHZvaWQge1xyXG4gICAgdGhpcy51cGRhdGVIdG1sKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHVwZGF0ZUh0bWwoKTogdm9pZCB7XHJcbiAgICBpZiAodHlwZW9mIHRoaXMubGVmdCA9PT0gJ251bWJlcicgfHwgdHlwZW9mIHRoaXMubGVmdCA9PT0gJ2Jvb2xlYW4nKSB7XHJcbiAgICAgIHRoaXMubGVmdCA9IHRoaXMubGVmdC50b1N0cmluZygpO1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiB0aGlzLnJpZ2h0ID09PSAnbnVtYmVyJyB8fCB0eXBlb2YgdGhpcy5yaWdodCA9PT0gJ2Jvb2xlYW4nKSB7XHJcbiAgICAgIHRoaXMucmlnaHQgPSB0aGlzLnJpZ2h0LnRvU3RyaW5nKCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmVsLm5hdGl2ZUVsZW1lbnQuaW5uZXJIVE1MID0gdGhpcy5jcmVhdGVIdG1sKHRoaXMuZG1wLmdldExpbmVEaWZmKHRoaXMubGVmdCwgdGhpcy5yaWdodCkpO1xyXG4gIH1cclxuXHJcbiAgLy8gVE9ETzogTmVlZCB0byBmaXggdGhpcyBmb3IgbGluZSBkaWZmc1xyXG4gIHByaXZhdGUgY3JlYXRlSHRtbChkaWZmczogQXJyYXk8RGlmZj4pOiBzdHJpbmcge1xyXG4gICAgbGV0IGh0bWw6IHN0cmluZztcclxuICAgIGh0bWwgPSAnPGRpdj4nO1xyXG4gICAgZm9yIChsZXQgZGlmZiBvZiBkaWZmcykge1xyXG4gICAgICBpZiAoZGlmZlswXSA9PT0gRGlmZk9wLkVxdWFsKSB7XHJcbiAgICAgICAgaHRtbCArPSAnPHNwYW4gY2xhc3M9XCJlcXVhbFwiPicgKyBkaWZmWzFdICsgJzwvc3Bhbj4nO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChkaWZmWzBdID09PSBEaWZmT3AuRGVsZXRlKSB7XHJcbiAgICAgICAgaHRtbCArPSAnPGRpdiBjbGFzcz1cXFwiZGVsXFxcIj4gLSA8ZGVsPicgKyBkaWZmWzFdICsgJzwvZGVsPjwvZGl2Plxcbic7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGRpZmZbMF0gPT09IERpZmZPcC5JbnNlcnQpIHtcclxuICAgICAgICBodG1sICs9ICc8ZGl2IGNsYXNzPVxcXCJpbnNcXFwiPiArIDxpbnM+JyArIGRpZmZbMV0gKyAnPC9pbnM+PC9kaXY+XFxuJztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgaHRtbCArPSAnPC9kaXY+JztcclxuICAgIHJldHVybiBodG1sO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBEaXJlY3RpdmUsIEVsZW1lbnRSZWYsIElucHV0LCBPbkluaXQsIE9uQ2hhbmdlcyB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQgeyBEaWZmTWF0Y2hQYXRjaFNlcnZpY2UgfSBmcm9tICcuL2RpZmZNYXRjaFBhdGNoLnNlcnZpY2UnO1xyXG5pbXBvcnQgeyBEaWZmLCBEaWZmT3AgfSBmcm9tICcuL2RpZmZNYXRjaFBhdGNoJztcclxuXHJcbkBEaXJlY3RpdmUoe1xyXG4gIHNlbGVjdG9yOiAnW3Byb2Nlc3NpbmdEaWZmXSdcclxufSlcclxuZXhwb3J0IGNsYXNzIFByb2Nlc3NpbmdEaWZmRGlyZWN0aXZlIGltcGxlbWVudHMgT25Jbml0LCBPbkNoYW5nZXMge1xyXG4gIEBJbnB1dCgpIGxlZnQ6IHN0cmluZyA9ICcnO1xyXG4gIEBJbnB1dCgpIHJpZ2h0OiBzdHJpbmcgPSAnJztcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKFxyXG4gICAgcHJpdmF0ZSBlbDogRWxlbWVudFJlZixcclxuICAgIHByaXZhdGUgZG1wOiBEaWZmTWF0Y2hQYXRjaFNlcnZpY2UpIHsgIH1cclxuXHJcbiAgcHVibGljIG5nT25Jbml0KCk6IHZvaWQge1xyXG4gICAgdGhpcy51cGRhdGVIdG1sKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgbmdPbkNoYW5nZXMoKTogdm9pZCB7XHJcbiAgICB0aGlzLnVwZGF0ZUh0bWwoKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgdXBkYXRlSHRtbCgpOiB2b2lkIHtcclxuICAgIHRoaXMuZWwubmF0aXZlRWxlbWVudC5pbm5lckhUTUwgPSB0aGlzLmNyZWF0ZUh0bWwoXHJcbiAgICAgIHRoaXMuZG1wLmdldFByb2Nlc3NpbmdEaWZmKHRoaXMubGVmdCwgdGhpcy5yaWdodCkpO1xyXG4gIH1cclxuXHJcbiAgLy8gVE9ETzogTmVlZCB0byBmaXggdGhpcyBmb3IgbGluZSBkaWZmc1xyXG4gIHByaXZhdGUgY3JlYXRlSHRtbChkaWZmczogQXJyYXk8RGlmZj4pOiBzdHJpbmcge1xyXG4gICAgbGV0IGh0bWw6IHN0cmluZztcclxuICAgIGh0bWwgPSAnPGRpdj4nO1xyXG4gICAgZm9yIChsZXQgZGlmZiBvZiBkaWZmcykge1xyXG4gICAgICBkaWZmWzFdID0gZGlmZlsxXS5yZXBsYWNlKC9cXG4vZywgJzxici8+Jyk7XHJcblxyXG4gICAgICBpZiAoZGlmZlswXSA9PT0gRGlmZk9wLkVxdWFsKSB7XHJcbiAgICAgICAgaHRtbCArPSAnPHNwYW4gY2xhc3M9XCJlcXVhbFwiPicgKyBkaWZmWzFdICsgJzwvc3Bhbj4nO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChkaWZmWzBdID09PSBEaWZmT3AuRGVsZXRlKSB7XHJcbiAgICAgICAgaHRtbCArPSAnPGRlbD4nICsgZGlmZlsxXSArICc8L2RlbD4nO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChkaWZmWzBdID09PSBEaWZmT3AuSW5zZXJ0KSB7XHJcbiAgICAgICAgaHRtbCArPSAnPGlucz4nICsgZGlmZlsxXSArICc8L2lucz4nO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBodG1sICs9ICc8L2Rpdj4nO1xyXG4gICAgcmV0dXJuIGh0bWw7XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IERpcmVjdGl2ZSwgRWxlbWVudFJlZiwgSW5wdXQsIE9uSW5pdCwgT25DaGFuZ2VzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7IERpZmZNYXRjaFBhdGNoU2VydmljZSB9IGZyb20gJy4vZGlmZk1hdGNoUGF0Y2guc2VydmljZSc7XHJcbmltcG9ydCB7IERpZmYsIERpZmZPcCB9IGZyb20gJy4vZGlmZk1hdGNoUGF0Y2gnO1xyXG5cclxuQERpcmVjdGl2ZSh7XHJcbiAgc2VsZWN0b3I6ICdbc2VtYW50aWNEaWZmXSdcclxufSlcclxuZXhwb3J0IGNsYXNzIFNlbWFudGljRGlmZkRpcmVjdGl2ZSBpbXBsZW1lbnRzIE9uSW5pdCwgT25DaGFuZ2VzIHtcclxuICBASW5wdXQoKSBsZWZ0OiBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuID0gJyc7XHJcbiAgQElucHV0KCkgcmlnaHQ6IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4gPSAnJztcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKFxyXG4gICAgcHJpdmF0ZSBlbDogRWxlbWVudFJlZixcclxuICAgIHByaXZhdGUgZG1wOiBEaWZmTWF0Y2hQYXRjaFNlcnZpY2UpIHsgIH1cclxuXHJcbiAgcHVibGljIG5nT25Jbml0KCk6IHZvaWQge1xyXG4gICAgdGhpcy51cGRhdGVIdG1sKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgbmdPbkNoYW5nZXMoKTogdm9pZCB7XHJcbiAgICB0aGlzLnVwZGF0ZUh0bWwoKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgdXBkYXRlSHRtbCgpOiB2b2lkIHtcclxuICAgIGlmICghdGhpcy5sZWZ0KSB7XHJcbiAgICAgIHRoaXMubGVmdCA9IFwiXCI7XHJcbiAgICB9XHJcbiAgICBpZiAoIXRoaXMucmlnaHQpIHtcclxuICAgICAgdGhpcy5yaWdodCA9IFwiXCI7XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHRoaXMubGVmdCA9PT0gJ251bWJlcicgfHwgdHlwZW9mIHRoaXMubGVmdCA9PT0gJ2Jvb2xlYW4nKSB7XHJcbiAgICAgIHRoaXMubGVmdCA9IHRoaXMubGVmdC50b1N0cmluZygpO1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiB0aGlzLnJpZ2h0ID09PSAnbnVtYmVyJyB8fCB0eXBlb2YgdGhpcy5yaWdodCA9PT0gJ2Jvb2xlYW4nKSB7XHJcbiAgICAgIHRoaXMucmlnaHQgPSB0aGlzLnJpZ2h0LnRvU3RyaW5nKCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmVsLm5hdGl2ZUVsZW1lbnQuaW5uZXJIVE1MID0gdGhpcy5jcmVhdGVIdG1sKFxyXG4gICAgICB0aGlzLmRtcC5nZXRTZW1hbnRpY0RpZmYodGhpcy5sZWZ0LCB0aGlzLnJpZ2h0KSk7XHJcbiAgfVxyXG5cclxuICAvLyBUT0RPOiBOZWVkIHRvIGZpeCB0aGlzIGZvciBsaW5lIGRpZmZzXHJcbiAgcHJpdmF0ZSBjcmVhdGVIdG1sKGRpZmZzOiBBcnJheTxEaWZmPik6IHN0cmluZyB7XHJcbiAgICBsZXQgaHRtbDogc3RyaW5nO1xyXG4gICAgaHRtbCA9ICc8ZGl2Pic7XHJcbiAgICBmb3IgKGxldCBkaWZmIG9mIGRpZmZzKSB7XHJcbiAgICAgIGRpZmZbMV0gPSBkaWZmWzFdLnJlcGxhY2UoL1xcbi9nLCAnPGJyLz4nKTtcclxuXHJcbiAgICAgIGlmIChkaWZmWzBdID09PSBEaWZmT3AuRXF1YWwpIHtcclxuICAgICAgICBodG1sICs9ICc8c3BhbiBjbGFzcz1cImVxdWFsXCI+JyArIGRpZmZbMV0gKyAnPC9zcGFuPic7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGRpZmZbMF0gPT09IERpZmZPcC5EZWxldGUpIHtcclxuICAgICAgICBodG1sICs9ICc8ZGVsPicgKyBkaWZmWzFdICsgJzwvZGVsPic7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGRpZmZbMF0gPT09IERpZmZPcC5JbnNlcnQpIHtcclxuICAgICAgICBodG1sICs9ICc8aW5zPicgKyBkaWZmWzFdICsgJzwvaW5zPic7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGh0bWwgKz0gJzwvZGl2Pic7XHJcbiAgICByZXR1cm4gaHRtbDtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgTmdNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IHsgQ29tbW9uTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcclxuaW1wb3J0IHsgRGlmZkRpcmVjdGl2ZSB9IGZyb20gJy4vZGlmZi5kaXJlY3RpdmUnO1xyXG5pbXBvcnQgeyBMaW5lRGlmZkRpcmVjdGl2ZSB9IGZyb20gJy4vbGluZURpZmYuZGlyZWN0aXZlJztcclxuaW1wb3J0IHsgUHJvY2Vzc2luZ0RpZmZEaXJlY3RpdmUgfSBmcm9tICcuL3Byb2Nlc3NpbmdEaWZmLmRpcmVjdGl2ZSc7XHJcbmltcG9ydCB7IFNlbWFudGljRGlmZkRpcmVjdGl2ZSB9IGZyb20gJy4vc2VtYW50aWNEaWZmLmRpcmVjdGl2ZSc7XHJcbmltcG9ydCB7IExpbmVDb21wYXJlQ29tcG9uZW50IH0gZnJvbSAnLi9saW5lQ29tcGFyZS5jb21wb25lbnQnO1xyXG5cclxuaW1wb3J0IHsgRGlmZk1hdGNoUGF0Y2ggfSBmcm9tICcuL2RpZmZNYXRjaFBhdGNoJztcclxuaW1wb3J0IHsgRGlmZk1hdGNoUGF0Y2hTZXJ2aWNlIH0gZnJvbSAnLi9kaWZmTWF0Y2hQYXRjaC5zZXJ2aWNlJztcclxuXHJcbkBOZ01vZHVsZSh7XHJcbiAgZGVjbGFyYXRpb25zOiBbXHJcbiAgICBEaWZmRGlyZWN0aXZlLFxyXG4gICAgTGluZURpZmZEaXJlY3RpdmUsXHJcbiAgICBQcm9jZXNzaW5nRGlmZkRpcmVjdGl2ZSxcclxuICAgIFNlbWFudGljRGlmZkRpcmVjdGl2ZSxcclxuICAgIExpbmVDb21wYXJlQ29tcG9uZW50XHJcbiAgXSxcclxuICBpbXBvcnRzOiBbXHJcbiAgICBDb21tb25Nb2R1bGVcclxuICBdLFxyXG4gIGV4cG9ydHM6IFtcclxuICAgIERpZmZEaXJlY3RpdmUsXHJcbiAgICBMaW5lRGlmZkRpcmVjdGl2ZSxcclxuICAgIFByb2Nlc3NpbmdEaWZmRGlyZWN0aXZlLFxyXG4gICAgU2VtYW50aWNEaWZmRGlyZWN0aXZlLFxyXG4gICAgTGluZUNvbXBhcmVDb21wb25lbnRcclxuICBdLFxyXG4gIHByb3ZpZGVyczogW1xyXG4gICAgRGlmZk1hdGNoUGF0Y2gsXHJcbiAgICBEaWZmTWF0Y2hQYXRjaFNlcnZpY2VcclxuICBdXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBEaWZmTWF0Y2hQYXRjaE1vZHVsZSB7IH1cclxuIl0sIm5hbWVzIjpbIkluamVjdGFibGUiLCJ0c2xpYl8xLl9fdmFsdWVzIiwiQ29tcG9uZW50IiwiSW5wdXQiLCJEaXJlY3RpdmUiLCJFbGVtZW50UmVmIiwiTmdNb2R1bGUiLCJDb21tb25Nb2R1bGUiXSwibWFw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