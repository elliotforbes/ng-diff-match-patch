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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmctZGlmZi1tYXRjaC1wYXRjaC51bWQuanMubWFwIiwic291cmNlcyI6WyJuZzovL25nLWRpZmYtbWF0Y2gtcGF0Y2gvbGliL2RpZmZNYXRjaFBhdGNoLnRzIiwibmc6Ly9uZy1kaWZmLW1hdGNoLXBhdGNoL2xpYi9kaWZmTWF0Y2hQYXRjaC5zZXJ2aWNlLnRzIixudWxsLCJuZzovL25nLWRpZmYtbWF0Y2gtcGF0Y2gvbGliL2xpbmVDb21wYXJlLmNvbXBvbmVudC50cyIsIm5nOi8vbmctZGlmZi1tYXRjaC1wYXRjaC9saWIvZGlmZi5kaXJlY3RpdmUudHMiLCJuZzovL25nLWRpZmYtbWF0Y2gtcGF0Y2gvbGliL2xpbmVEaWZmLmRpcmVjdGl2ZS50cyIsIm5nOi8vbmctZGlmZi1tYXRjaC1wYXRjaC9saWIvcHJvY2Vzc2luZ0RpZmYuZGlyZWN0aXZlLnRzIiwibmc6Ly9uZy1kaWZmLW1hdGNoLXBhdGNoL2xpYi9zZW1hbnRpY0RpZmYuZGlyZWN0aXZlLnRzIiwibmc6Ly9uZy1kaWZmLW1hdGNoLXBhdGNoL2xpYi9kaWZmTWF0Y2hQYXRjaC5tb2R1bGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNvbnN0IGVudW0gRGlmZk9wIHtcbiAgRGVsZXRlID0gLTEsXG4gIEVxdWFsID0gMCxcbiAgSW5zZXJ0ID0gMVxufVxuXG5leHBvcnQgdHlwZSBEaWZmID0gW0RpZmZPcCwgc3RyaW5nXTtcblxuLyoqXG4gKiBDbGFzcyBjb250YWluaW5nIHRoZSBkaWZmLCBtYXRjaCBhbmQgcGF0Y2ggbWV0aG9kcy5cblxuICovXG5jbGFzcyBEaWZmTWF0Y2hQYXRjaCB7XG5cbiAgY29uc3RydWN0b3IoKSB7ICB9XG5cbiAgLy8gRGVmYXVsdHMuXG4gIC8vIFJlZGVmaW5lIHRoZXNlIGluIHlvdXIgcHJvZ3JhbSB0byBvdmVycmlkZSB0aGUgZGVmYXVsdHMuXG5cbiAgLy8gTnVtYmVyIG9mIHNlY29uZHMgdG8gbWFwIGEgZGlmZiBiZWZvcmUgZ2l2aW5nIHVwICgwIGZvciBpbmZpbml0eSkuXG4gIERpZmZfVGltZW91dCA9IDEuMDtcbiAgLy8gQ29zdCBvZiBhbiBlbXB0eSBlZGl0IG9wZXJhdGlvbiBpbiB0ZXJtcyBvZiBlZGl0IGNoYXJhY3RlcnMuXG4gIERpZmZfRWRpdENvc3QgPSA0O1xuICAvLyBBdCB3aGF0IHBvaW50IGlzIG5vIG1hdGNoIGRlY2xhcmVkICgwLjAgPSBwZXJmZWN0aW9uLCAxLjAgPSB2ZXJ5IGxvb3NlKS5cbiAgTWF0Y2hfVGhyZXNob2xkID0gMC41O1xuICAvLyBIb3cgZmFyIHRvIHNlYXJjaCBmb3IgYSBtYXRjaCAoMCA9IGV4YWN0IGxvY2F0aW9uLCAxMDAwKyA9IGJyb2FkIG1hdGNoKS5cbiAgLy8gQSBtYXRjaCB0aGlzIG1hbnkgY2hhcmFjdGVycyBhd2F5IGZyb20gdGhlIGV4cGVjdGVkIGxvY2F0aW9uIHdpbGwgYWRkXG4gIC8vIDEuMCB0byB0aGUgc2NvcmUgKDAuMCBpcyBhIHBlcmZlY3QgbWF0Y2gpLlxuICBNYXRjaF9EaXN0YW5jZSA9IDEwMDA7XG4gIC8vIFdoZW4gZGVsZXRpbmcgYSBsYXJnZSBibG9jayBvZiB0ZXh0IChvdmVyIH42NCBjaGFyYWN0ZXJzKSwgaG93IGNsb3NlIGRvXG4gIC8vIHRoZSBjb250ZW50cyBoYXZlIHRvIGJlIHRvIG1hdGNoIHRoZSBleHBlY3RlZCBjb250ZW50cy4gKDAuMCA9IHBlcmZlY3Rpb24sXG4gIC8vIDEuMCA9IHZlcnkgbG9vc2UpLiAgTm90ZSB0aGF0IE1hdGNoX1RocmVzaG9sZCBjb250cm9scyBob3cgY2xvc2VseSB0aGVcbiAgLy8gZW5kIHBvaW50cyBvZiBhIGRlbGV0ZSBuZWVkIHRvIG1hdGNoLlxuICBQYXRjaF9EZWxldGVUaHJlc2hvbGQgPSAwLjU7XG4gIC8vIENodW5rIHNpemUgZm9yIGNvbnRleHQgbGVuZ3RoLlxuICBQYXRjaF9NYXJnaW4gPSA0O1xuXG4gIC8vIFRoZSBudW1iZXIgb2YgYml0cyBpbiBhbiBpbnQuXG4gIE1hdGNoX01heEJpdHMgPSAzMjtcbiAgLyoqXG4gICAqIFRoZSBkYXRhIHN0cnVjdHVyZSByZXByZXNlbnRpbmcgYSBkaWZmIGlzIGFuIGFycmF5IG9mIHR1cGxlczpcbiAgICogW1tEaWZmT3AuRGVsZXRlLCAnSGVsbG8nXSwgW0RpZmZPcC5JbnNlcnQsICdHb29kYnllJ10sIFtEaWZmT3AuRXF1YWwsICcgd29ybGQuJ11dXG4gICAqIHdoaWNoIG1lYW5zOiBkZWxldGUgJ0hlbGxvJywgYWRkICdHb29kYnllJyBhbmQga2VlcCAnIHdvcmxkLidcbiAgICovXG5cbiAgLy8gRGVmaW5lIHNvbWUgcmVnZXggcGF0dGVybnMgZm9yIG1hdGNoaW5nIGJvdW5kYXJpZXMuXG4gIHdoaXRlc3BhY2VSZWdleF8gPSBuZXcgUmVnRXhwKCcvXFxzLycpO1xuICBsaW5lYnJlYWtSZWdleF8gPSBuZXcgUmVnRXhwKCcvW1xcclxcbl0vJyk7XG4gIGJsYW5rbGluZUVuZFJlZ2V4XyA9IG5ldyBSZWdFeHAoJy9cXG5cXHI/XFxuJC8nKTtcbiAgYmxhbmtsaW5lU3RhcnRSZWdleF8gPSBuZXcgUmVnRXhwKCcvXlxccj9cXG5cXHI/XFxuLycpO1xuXG4gIC8qKlxuICAgKiBGaW5kIHRoZSBkaWZmZXJlbmNlcyBiZXR3ZWVuIHR3byB0ZXh0cy4gIFNpbXBsaWZpZXMgdGhlIHByb2JsZW0gYnkgc3RyaXBwaW5nXG4gICAqIGFueSBjb21tb24gcHJlZml4IG9yIHN1ZmZpeCBvZmYgdGhlIHRleHRzIGJlZm9yZSBkaWZmaW5nLlxuICAgKiBAcGFyYW0gIHRleHQxIE9sZCBzdHJpbmcgdG8gYmUgZGlmZmVkLlxuICAgKiBAcGFyYW0gIHRleHQyIE5ldyBzdHJpbmcgdG8gYmUgZGlmZmVkLlxuICAgKiBAcGFyYW0gIG9wdF9jaGVja2xpbmVzIE9wdGlvbmFsIHNwZWVkdXAgZmxhZy4gSWYgcHJlc2VudCBhbmQgZmFsc2UsXG4gICAqICAgICB0aGVuIGRvbid0IHJ1biBhIGxpbmUtbGV2ZWwgZGlmZiBmaXJzdCB0byBpZGVudGlmeSB0aGUgY2hhbmdlZCBhcmVhcy5cbiAgICogICAgIERlZmF1bHRzIHRvIHRydWUsIHdoaWNoIGRvZXMgYSBmYXN0ZXIsIHNsaWdodGx5IGxlc3Mgb3B0aW1hbCBkaWZmLlxuICAgKiBAcGFyYW0gIG9wdF9kZWFkbGluZSBPcHRpb25hbCB0aW1lIHdoZW4gdGhlIGRpZmYgc2hvdWxkIGJlIGNvbXBsZXRlXG4gICAqICAgICBieS4gIFVzZWQgaW50ZXJuYWxseSBmb3IgcmVjdXJzaXZlIGNhbGxzLiAgVXNlcnMgc2hvdWxkIHNldCBEaWZmVGltZW91dFxuICAgKiAgICAgaW5zdGVhZC5cbiAgICogQHJldHVybiAgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXG4gICAqL1xuICAgIGRpZmZfbWFpbiAodGV4dDE6IHN0cmluZywgdGV4dDI6IHN0cmluZywgb3B0X2NoZWNrbGluZXM/OiBib29sZWFuLCBvcHRfZGVhZGxpbmU/OiBudW1iZXIpOiBBcnJheTxEaWZmPiB7XG4gICAgICAvLyBTZXQgYSBkZWFkbGluZSBieSB3aGljaCB0aW1lIHRoZSBkaWZmIG11c3QgYmUgY29tcGxldGUuXG4gICAgICBpZiAodHlwZW9mIG9wdF9kZWFkbGluZSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBpZiAodGhpcy5EaWZmX1RpbWVvdXQgPD0gMCkge1xuICAgICAgICAgIG9wdF9kZWFkbGluZSA9IE51bWJlci5NQVhfVkFMVUU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb3B0X2RlYWRsaW5lID0gKG5ldyBEYXRlKS5nZXRUaW1lKCkgKyB0aGlzLkRpZmZfVGltZW91dCAqIDEwMDA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnN0IGRlYWRsaW5lID0gb3B0X2RlYWRsaW5lO1xuXG4gICAgICAvLyBDaGVjayBmb3IgbnVsbCBpbnB1dHMuXG4gICAgICBpZiAodGV4dDEgPT0gbnVsbCB8fCB0ZXh0MiA9PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTnVsbCBpbnB1dC4gKGRpZmZfbWFpbiknKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2hlY2sgZm9yIGVxdWFsaXR5IChzcGVlZHVwKS5cbiAgICAgIGlmICh0ZXh0MSA9PSB0ZXh0Mikge1xuICAgICAgICBpZiAodGV4dDEpIHtcbiAgICAgICAgICByZXR1cm4gW1tEaWZmT3AuRXF1YWwsIHRleHQxXV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIG9wdF9jaGVja2xpbmVzID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG9wdF9jaGVja2xpbmVzID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGNoZWNrbGluZXMgPSBvcHRfY2hlY2tsaW5lcztcblxuICAgICAgLy8gVHJpbSBvZmYgY29tbW9uIHByZWZpeCAoc3BlZWR1cCkuXG4gICAgICBsZXQgY29tbW9ubGVuZ3RoID0gdGhpcy5kaWZmX2NvbW1vblByZWZpeCh0ZXh0MSwgdGV4dDIpO1xuICAgICAgY29uc3QgY29tbW9ucHJlZml4ID0gdGV4dDEuc3Vic3RyaW5nKDAsIGNvbW1vbmxlbmd0aCk7XG4gICAgICB0ZXh0MSA9IHRleHQxLnN1YnN0cmluZyhjb21tb25sZW5ndGgpO1xuICAgICAgdGV4dDIgPSB0ZXh0Mi5zdWJzdHJpbmcoY29tbW9ubGVuZ3RoKTtcblxuICAgICAgLy8gVHJpbSBvZmYgY29tbW9uIHN1ZmZpeCAoc3BlZWR1cCkuXG4gICAgICBjb21tb25sZW5ndGggPSB0aGlzLmRpZmZfY29tbW9uU3VmZml4KHRleHQxLCB0ZXh0Mik7XG4gICAgICBjb25zdCBjb21tb25zdWZmaXggPSB0ZXh0MS5zdWJzdHJpbmcodGV4dDEubGVuZ3RoIC0gY29tbW9ubGVuZ3RoKTtcbiAgICAgIHRleHQxID0gdGV4dDEuc3Vic3RyaW5nKDAsIHRleHQxLmxlbmd0aCAtIGNvbW1vbmxlbmd0aCk7XG4gICAgICB0ZXh0MiA9IHRleHQyLnN1YnN0cmluZygwLCB0ZXh0Mi5sZW5ndGggLSBjb21tb25sZW5ndGgpO1xuXG4gICAgICAvLyBDb21wdXRlIHRoZSBkaWZmIG9uIHRoZSBtaWRkbGUgYmxvY2suXG4gICAgICBjb25zdCBkaWZmcyA9IHRoaXMuZGlmZl9jb21wdXRlXyh0ZXh0MSwgdGV4dDIsIGNoZWNrbGluZXMsIGRlYWRsaW5lKTtcblxuICAgICAgLy8gUmVzdG9yZSB0aGUgcHJlZml4IGFuZCBzdWZmaXguXG4gICAgICBpZiAoY29tbW9ucHJlZml4KSB7XG4gICAgICAgIGRpZmZzLnVuc2hpZnQoW0RpZmZPcC5FcXVhbCwgY29tbW9ucHJlZml4XSk7XG4gICAgICB9XG4gICAgICBpZiAoY29tbW9uc3VmZml4KSB7XG4gICAgICAgIGRpZmZzLnB1c2goW0RpZmZPcC5FcXVhbCwgY29tbW9uc3VmZml4XSk7XG4gICAgICB9XG4gICAgICB0aGlzLmRpZmZfY2xlYW51cE1lcmdlKGRpZmZzKTtcbiAgICAgIHJldHVybiBkaWZmcztcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBGaW5kIHRoZSBkaWZmZXJlbmNlcyBiZXR3ZWVuIHR3byB0ZXh0cy4gIEFzc3VtZXMgdGhhdCB0aGUgdGV4dHMgZG8gbm90XG4gICAqIGhhdmUgYW55IGNvbW1vbiBwcmVmaXggb3Igc3VmZml4LlxuICAgKiBAcGFyYW0gIHRleHQxIE9sZCBzdHJpbmcgdG8gYmUgZGlmZmVkLlxuICAgKiBAcGFyYW0gIHRleHQyIE5ldyBzdHJpbmcgdG8gYmUgZGlmZmVkLlxuICAgKiBAcGFyYW0gIGNoZWNrbGluZXMgU3BlZWR1cCBmbGFnLiAgSWYgZmFsc2UsIHRoZW4gZG9uJ3QgcnVuIGFcbiAgICogICAgIGxpbmUtbGV2ZWwgZGlmZiBmaXJzdCB0byBpZGVudGlmeSB0aGUgY2hhbmdlZCBhcmVhcy5cbiAgICogICAgIElmIHRydWUsIHRoZW4gcnVuIGEgZmFzdGVyLCBzbGlnaHRseSBsZXNzIG9wdGltYWwgZGlmZi5cbiAgICogQHBhcmFtICBkZWFkbGluZSBUaW1lIHdoZW4gdGhlIGRpZmYgc2hvdWxkIGJlIGNvbXBsZXRlIGJ5LlxuICAgKiBAcmV0dXJuICBBcnJheSBvZiBkaWZmIHR1cGxlcy5cblxuICAgKi9cbiAgICBkaWZmX2NvbXB1dGVfICh0ZXh0MTogc3RyaW5nLCB0ZXh0Mjogc3RyaW5nLCBjaGVja2xpbmVzOiBib29sZWFuLFxuICAgICAgZGVhZGxpbmU6IG51bWJlcik6IEFycmF5PERpZmY+IHtcbiAgICBsZXQgZGlmZnM6IEFycmF5PERpZmY+O1xuXG4gICAgaWYgKCF0ZXh0MSkge1xuICAgICAgLy8gSnVzdCBhZGQgc29tZSB0ZXh0IChzcGVlZHVwKS5cbiAgICAgIHJldHVybiBbW0RpZmZPcC5JbnNlcnQsIHRleHQyXV07XG4gICAgfVxuXG4gICAgaWYgKCF0ZXh0Mikge1xuICAgICAgLy8gSnVzdCBkZWxldGUgc29tZSB0ZXh0IChzcGVlZHVwKS5cbiAgICAgIHJldHVybiBbW0RpZmZPcC5EZWxldGUsIHRleHQxXV07XG4gICAgfVxuXG4gICAgY29uc3QgbG9uZ3RleHQgPSB0ZXh0MS5sZW5ndGggPiB0ZXh0Mi5sZW5ndGggPyB0ZXh0MSA6IHRleHQyO1xuICAgIGNvbnN0IHNob3J0dGV4dCA9IHRleHQxLmxlbmd0aCA+IHRleHQyLmxlbmd0aCA/IHRleHQyIDogdGV4dDE7XG4gICAgY29uc3QgaSA9IGxvbmd0ZXh0LmluZGV4T2Yoc2hvcnR0ZXh0KTtcbiAgICBpZiAoaSAhPSAtMSkge1xuICAgICAgLy8gU2hvcnRlciB0ZXh0IGlzIGluc2lkZSB0aGUgbG9uZ2VyIHRleHQgKHNwZWVkdXApLlxuICAgICAgZGlmZnMgPSBbW0RpZmZPcC5JbnNlcnQsIGxvbmd0ZXh0LnN1YnN0cmluZygwLCBpKV0sXG4gICAgICAgICAgICAgIFtEaWZmT3AuRXF1YWwsIHNob3J0dGV4dF0sXG4gICAgICAgICAgICAgIFtEaWZmT3AuSW5zZXJ0LCBsb25ndGV4dC5zdWJzdHJpbmcoaSArIHNob3J0dGV4dC5sZW5ndGgpXV07XG4gICAgICAvLyBTd2FwIGluc2VydGlvbnMgZm9yIGRlbGV0aW9ucyBpZiBkaWZmIGlzIHJldmVyc2VkLlxuICAgICAgaWYgKHRleHQxLmxlbmd0aCA+IHRleHQyLmxlbmd0aCkge1xuICAgICAgICBkaWZmc1swXVswXSA9IGRpZmZzWzJdWzBdID0gRGlmZk9wLkRlbGV0ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkaWZmcztcbiAgICB9XG5cbiAgICBpZiAoc2hvcnR0ZXh0Lmxlbmd0aCA9PSAxKSB7XG4gICAgICAvLyBTaW5nbGUgY2hhcmFjdGVyIHN0cmluZy5cbiAgICAgIC8vIEFmdGVyIHRoZSBwcmV2aW91cyBzcGVlZHVwLCB0aGUgY2hhcmFjdGVyIGNhbid0IGJlIGFuIGVxdWFsaXR5LlxuICAgICAgcmV0dXJuIFtbRGlmZk9wLkRlbGV0ZSwgdGV4dDFdLCBbRGlmZk9wLkluc2VydCwgdGV4dDJdXTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIHByb2JsZW0gY2FuIGJlIHNwbGl0IGluIHR3by5cbiAgICBjb25zdCBobSA9IHRoaXMuZGlmZl9oYWxmTWF0Y2hfKHRleHQxLCB0ZXh0Mik7XG4gICAgaWYgKGhtKSB7XG4gICAgICAvLyBBIGhhbGYtbWF0Y2ggd2FzIGZvdW5kLCBzb3J0IG91dCB0aGUgcmV0dXJuIGRhdGEuXG4gICAgICBjb25zdCB0ZXh0MV9hID0gaG1bMF07XG4gICAgICBjb25zdCB0ZXh0MV9iID0gaG1bMV07XG4gICAgICBjb25zdCB0ZXh0Ml9hID0gaG1bMl07XG4gICAgICBjb25zdCB0ZXh0Ml9iID0gaG1bM107XG4gICAgICBjb25zdCBtaWRfY29tbW9uID0gaG1bNF07XG4gICAgICAvLyBTZW5kIGJvdGggcGFpcnMgb2ZmIGZvciBzZXBhcmF0ZSBwcm9jZXNzaW5nLlxuICAgICAgY29uc3QgZGlmZnNfYSA9IHRoaXMuZGlmZl9tYWluKHRleHQxX2EsIHRleHQyX2EsIGNoZWNrbGluZXMsIGRlYWRsaW5lKTtcbiAgICAgIGNvbnN0IGRpZmZzX2IgPSB0aGlzLmRpZmZfbWFpbih0ZXh0MV9iLCB0ZXh0Ml9iLCBjaGVja2xpbmVzLCBkZWFkbGluZSk7XG4gICAgICAvLyBNZXJnZSB0aGUgcmVzdWx0cy5cbiAgICAgIHJldHVybiBkaWZmc19hLmNvbmNhdChbW0RpZmZPcC5FcXVhbCwgbWlkX2NvbW1vbl1dLCBkaWZmc19iKTtcbiAgICB9XG5cbiAgICBpZiAoY2hlY2tsaW5lcyAmJiB0ZXh0MS5sZW5ndGggPiAxMDAgJiYgdGV4dDIubGVuZ3RoID4gMTAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5kaWZmX2xpbmVNb2RlXyh0ZXh0MSwgdGV4dDIsIGRlYWRsaW5lKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5kaWZmX2Jpc2VjdF8odGV4dDEsIHRleHQyLCBkZWFkbGluZSk7XG4gIH07XG5cblxuICAvKipcbiAgICogRG8gYSBxdWljayBsaW5lLWxldmVsIGRpZmYgb24gYm90aCBzdHJpbmdzLCB0aGVuIHJlZGlmZiB0aGUgcGFydHMgZm9yXG4gICAqIGdyZWF0ZXIgYWNjdXJhY3kuXG4gICAqIFRoaXMgc3BlZWR1cCBjYW4gcHJvZHVjZSBub24tbWluaW1hbCBkaWZmcy5cbiAgICogQHBhcmFtICB0ZXh0MSBPbGQgc3RyaW5nIHRvIGJlIGRpZmZlZC5cbiAgICogQHBhcmFtICB0ZXh0MiBOZXcgc3RyaW5nIHRvIGJlIGRpZmZlZC5cbiAgICogQHBhcmFtICBkZWFkbGluZSBUaW1lIHdoZW4gdGhlIGRpZmYgc2hvdWxkIGJlIGNvbXBsZXRlIGJ5LlxuICAgKiBAcmV0dXJuICBBcnJheSBvZiBkaWZmIHR1cGxlcy5cblxuICAgKi9cbiAgICBkaWZmX2xpbmVNb2RlXyAodGV4dDE6IHN0cmluZywgdGV4dDI6IHN0cmluZywgZGVhZGxpbmU6IG51bWJlcikge1xuICAgIC8vIFNjYW4gdGhlIHRleHQgb24gYSBsaW5lLWJ5LWxpbmUgYmFzaXMgZmlyc3QuXG4gICAgY29uc3QgYSA9IHRoaXMuZGlmZl9saW5lc1RvQ2hhcnNfKHRleHQxLCB0ZXh0Mik7XG4gICAgdGV4dDEgPSBhLmNoYXJzMTtcbiAgICB0ZXh0MiA9IGEuY2hhcnMyO1xuICAgIGNvbnN0IGxpbmVhcnJheSA9IGEubGluZUFycmF5O1xuXG4gICAgY29uc3QgZGlmZnMgPSB0aGlzLmRpZmZfbWFpbih0ZXh0MSwgdGV4dDIsIGZhbHNlLCBkZWFkbGluZSk7XG5cbiAgICAvLyBDb252ZXJ0IHRoZSBkaWZmIGJhY2sgdG8gb3JpZ2luYWwgdGV4dC5cbiAgICB0aGlzLmRpZmZfY2hhcnNUb0xpbmVzXyhkaWZmcywgbGluZWFycmF5KTtcbiAgICAvLyBFbGltaW5hdGUgZnJlYWsgbWF0Y2hlcyAoZS5nLiBibGFuayBsaW5lcylcbiAgICB0aGlzLmRpZmZfY2xlYW51cFNlbWFudGljKGRpZmZzKTtcblxuICAgIC8vIFJlZGlmZiBhbnkgcmVwbGFjZW1lbnQgYmxvY2tzLCB0aGlzIHRpbWUgY2hhcmFjdGVyLWJ5LWNoYXJhY3Rlci5cbiAgICAvLyBBZGQgYSBkdW1teSBlbnRyeSBhdCB0aGUgZW5kLlxuICAgIGRpZmZzLnB1c2goW0RpZmZPcC5FcXVhbCwgJyddKTtcbiAgICBsZXQgcG9pbnRlciA9IDA7XG4gICAgbGV0IGNvdW50X2RlbGV0ZSA9IDA7XG4gICAgbGV0IGNvdW50X2luc2VydCA9IDA7XG4gICAgbGV0IHRleHRfZGVsZXRlID0gJyc7XG4gICAgbGV0IHRleHRfaW5zZXJ0ID0gJyc7XG4gICAgd2hpbGUgKHBvaW50ZXIgPCBkaWZmcy5sZW5ndGgpIHtcbiAgICAgIHN3aXRjaCAoZGlmZnNbcG9pbnRlcl1bMF0pIHtcbiAgICAgICAgY2FzZSBEaWZmT3AuSW5zZXJ0OlxuICAgICAgICAgIGNvdW50X2luc2VydCsrO1xuICAgICAgICAgIHRleHRfaW5zZXJ0ICs9IGRpZmZzW3BvaW50ZXJdWzFdO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIERpZmZPcC5EZWxldGU6XG4gICAgICAgICAgY291bnRfZGVsZXRlKys7XG4gICAgICAgICAgdGV4dF9kZWxldGUgKz0gZGlmZnNbcG9pbnRlcl1bMV07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgRGlmZk9wLkVxdWFsOlxuICAgICAgICAgIC8vIFVwb24gcmVhY2hpbmcgYW4gZXF1YWxpdHksIGNoZWNrIGZvciBwcmlvciByZWR1bmRhbmNpZXMuXG4gICAgICAgICAgaWYgKGNvdW50X2RlbGV0ZSA+PSAxICYmIGNvdW50X2luc2VydCA+PSAxKSB7XG4gICAgICAgICAgICAvLyBEZWxldGUgdGhlIG9mZmVuZGluZyByZWNvcmRzIGFuZCBhZGQgdGhlIG1lcmdlZCBvbmVzLlxuICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIgLSBjb3VudF9kZWxldGUgLSBjb3VudF9pbnNlcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudF9kZWxldGUgKyBjb3VudF9pbnNlcnQpO1xuICAgICAgICAgICAgcG9pbnRlciA9IHBvaW50ZXIgLSBjb3VudF9kZWxldGUgLSBjb3VudF9pbnNlcnQ7XG4gICAgICAgICAgICBjb25zdCBiID0gdGhpcy5kaWZmX21haW4odGV4dF9kZWxldGUsIHRleHRfaW5zZXJ0LCBmYWxzZSwgZGVhZGxpbmUpO1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IGIubGVuZ3RoIC0gMTsgaiA+PSAwOyBqLS0pIHtcbiAgICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIsIDAsIGJbal0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcG9pbnRlciA9IHBvaW50ZXIgKyBiLmxlbmd0aDtcbiAgICAgICAgICB9XG4gICAgICAgICAgY291bnRfaW5zZXJ0ID0gMDtcbiAgICAgICAgICBjb3VudF9kZWxldGUgPSAwO1xuICAgICAgICAgIHRleHRfZGVsZXRlID0gJyc7XG4gICAgICAgICAgdGV4dF9pbnNlcnQgPSAnJztcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHBvaW50ZXIrKztcbiAgICB9XG4gICAgZGlmZnMucG9wKCk7ICAvLyBSZW1vdmUgdGhlIGR1bW15IGVudHJ5IGF0IHRoZSBlbmQuXG5cbiAgICByZXR1cm4gZGlmZnM7XG4gIH07XG5cblxuICAvKipcbiAgICogRmluZCB0aGUgJ21pZGRsZSBzbmFrZScgb2YgYSBkaWZmLCBzcGxpdCB0aGUgcHJvYmxlbSBpbiB0d29cbiAgICogYW5kIHJldHVybiB0aGUgcmVjdXJzaXZlbHkgY29uc3RydWN0ZWQgZGlmZi5cbiAgICogU2VlIE15ZXJzIDE5ODYgcGFwZXI6IEFuIE8oTkQpIERpZmZlcmVuY2UgQWxnb3JpdGhtIGFuZCBJdHMgY29uc3RpYXRpb25zLlxuICAgKiBAcGFyYW0gIHRleHQxIE9sZCBzdHJpbmcgdG8gYmUgZGlmZmVkLlxuICAgKiBAcGFyYW0gIHRleHQyIE5ldyBzdHJpbmcgdG8gYmUgZGlmZmVkLlxuICAgKiBAcGFyYW0gIGRlYWRsaW5lIFRpbWUgYXQgd2hpY2ggdG8gYmFpbCBpZiBub3QgeWV0IGNvbXBsZXRlLlxuICAgKiBAcmV0dXJuICBBcnJheSBvZiBkaWZmIHR1cGxlcy5cblxuICAgKi9cbiAgICBkaWZmX2Jpc2VjdF8gKHRleHQxOiBzdHJpbmcsIHRleHQyOiBzdHJpbmcsIGRlYWRsaW5lOiBudW1iZXIpOiBBcnJheTxEaWZmPiB7XG4gICAgLy8gQ2FjaGUgdGhlIHRleHQgbGVuZ3RocyB0byBwcmV2ZW50IG11bHRpcGxlIGNhbGxzLlxuICAgIGNvbnN0IHRleHQxX2xlbmd0aCA9IHRleHQxLmxlbmd0aDtcbiAgICBjb25zdCB0ZXh0Ml9sZW5ndGggPSB0ZXh0Mi5sZW5ndGg7XG4gICAgY29uc3QgbWF4X2QgPSBNYXRoLmNlaWwoKHRleHQxX2xlbmd0aCArIHRleHQyX2xlbmd0aCkgLyAyKTtcbiAgICBjb25zdCB2X29mZnNldCA9IG1heF9kO1xuICAgIGNvbnN0IHZfbGVuZ3RoID0gMiAqIG1heF9kO1xuICAgIGNvbnN0IHYxID0gbmV3IEFycmF5KHZfbGVuZ3RoKTtcbiAgICBjb25zdCB2MiA9IG5ldyBBcnJheSh2X2xlbmd0aCk7XG4gICAgLy8gU2V0dGluZyBhbGwgZWxlbWVudHMgdG8gLTEgaXMgZmFzdGVyIGluIENocm9tZSAmIEZpcmVmb3ggdGhhbiBtaXhpbmdcbiAgICAvLyBpbnRlZ2VycyBhbmQgdW5kZWZpbmVkLlxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgdl9sZW5ndGg7IHgrKykge1xuICAgICAgdjFbeF0gPSAtMTtcbiAgICAgIHYyW3hdID0gLTE7XG4gICAgfVxuICAgIHYxW3Zfb2Zmc2V0ICsgMV0gPSAwO1xuICAgIHYyW3Zfb2Zmc2V0ICsgMV0gPSAwO1xuICAgIGNvbnN0IGRlbHRhID0gdGV4dDFfbGVuZ3RoIC0gdGV4dDJfbGVuZ3RoO1xuICAgIC8vIElmIHRoZSB0b3RhbCBudW1iZXIgb2YgY2hhcmFjdGVycyBpcyBvZGQsIHRoZW4gdGhlIGZyb250IHBhdGggd2lsbCBjb2xsaWRlXG4gICAgLy8gd2l0aCB0aGUgcmV2ZXJzZSBwYXRoLlxuICAgIGNvbnN0IGZyb250ID0gKGRlbHRhICUgMiAhPSAwKTtcbiAgICAvLyBPZmZzZXRzIGZvciBzdGFydCBhbmQgZW5kIG9mIGsgbG9vcC5cbiAgICAvLyBQcmV2ZW50cyBtYXBwaW5nIG9mIHNwYWNlIGJleW9uZCB0aGUgZ3JpZC5cbiAgICBsZXQgazFzdGFydCA9IDA7XG4gICAgbGV0IGsxZW5kID0gMDtcbiAgICBsZXQgazJzdGFydCA9IDA7XG4gICAgbGV0IGsyZW5kID0gMDtcbiAgICBmb3IgKGxldCBkID0gMDsgZCA8IG1heF9kOyBkKyspIHtcbiAgICAgIC8vIEJhaWwgb3V0IGlmIGRlYWRsaW5lIGlzIHJlYWNoZWQuXG4gICAgICBpZiAoKG5ldyBEYXRlKCkpLmdldFRpbWUoKSA+IGRlYWRsaW5lKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBXYWxrIHRoZSBmcm9udCBwYXRoIG9uZSBzdGVwLlxuICAgICAgZm9yIChsZXQgazEgPSAtZCArIGsxc3RhcnQ7IGsxIDw9IGQgLSBrMWVuZDsgazEgKz0gMikge1xuICAgICAgICBjb25zdCBrMV9vZmZzZXQgPSB2X29mZnNldCArIGsxO1xuICAgICAgICBsZXQgeDE7XG4gICAgICAgIGlmIChrMSA9PSAtZCB8fCAoazEgIT0gZCAmJiB2MVtrMV9vZmZzZXQgLSAxXSA8IHYxW2sxX29mZnNldCArIDFdKSkge1xuICAgICAgICAgIHgxID0gdjFbazFfb2Zmc2V0ICsgMV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgeDEgPSB2MVtrMV9vZmZzZXQgLSAxXSArIDE7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHkxID0geDEgLSBrMTtcbiAgICAgICAgd2hpbGUgKHgxIDwgdGV4dDFfbGVuZ3RoICYmIHkxIDwgdGV4dDJfbGVuZ3RoICYmXG4gICAgICAgICAgICAgIHRleHQxLmNoYXJBdCh4MSkgPT0gdGV4dDIuY2hhckF0KHkxKSkge1xuICAgICAgICAgIHgxKys7XG4gICAgICAgICAgeTErKztcbiAgICAgICAgfVxuICAgICAgICB2MVtrMV9vZmZzZXRdID0geDE7XG4gICAgICAgIGlmICh4MSA+IHRleHQxX2xlbmd0aCkge1xuICAgICAgICAgIC8vIFJhbiBvZmYgdGhlIHJpZ2h0IG9mIHRoZSBncmFwaC5cbiAgICAgICAgICBrMWVuZCArPSAyO1xuICAgICAgICB9IGVsc2UgaWYgKHkxID4gdGV4dDJfbGVuZ3RoKSB7XG4gICAgICAgICAgLy8gUmFuIG9mZiB0aGUgYm90dG9tIG9mIHRoZSBncmFwaC5cbiAgICAgICAgICBrMXN0YXJ0ICs9IDI7XG4gICAgICAgIH0gZWxzZSBpZiAoZnJvbnQpIHtcbiAgICAgICAgICBjb25zdCBrMl9vZmZzZXQgPSB2X29mZnNldCArIGRlbHRhIC0gazE7XG4gICAgICAgICAgaWYgKGsyX29mZnNldCA+PSAwICYmIGsyX29mZnNldCA8IHZfbGVuZ3RoICYmIHYyW2syX29mZnNldF0gIT0gLTEpIHtcbiAgICAgICAgICAgIC8vIE1pcnJvciB4MiBvbnRvIHRvcC1sZWZ0IGNvb3JkaW5hdGUgc3lzdGVtLlxuICAgICAgICAgICAgY29uc3QgeDIgPSB0ZXh0MV9sZW5ndGggLSB2MltrMl9vZmZzZXRdO1xuICAgICAgICAgICAgaWYgKHgxID49IHgyKSB7XG4gICAgICAgICAgICAgIC8vIE92ZXJsYXAgZGV0ZWN0ZWQuXG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLmRpZmZfYmlzZWN0U3BsaXRfKHRleHQxLCB0ZXh0MiwgeDEsIHkxLCBkZWFkbGluZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFdhbGsgdGhlIHJldmVyc2UgcGF0aCBvbmUgc3RlcC5cbiAgICAgIGZvciAobGV0IGsyID0gLWQgKyBrMnN0YXJ0OyBrMiA8PSBkIC0gazJlbmQ7IGsyICs9IDIpIHtcbiAgICAgICAgY29uc3QgazJfb2Zmc2V0ID0gdl9vZmZzZXQgKyBrMjtcbiAgICAgICAgbGV0IHgyOiBudW1iZXI7XG4gICAgICAgIGlmIChrMiA9PSAtZCB8fCAoazIgIT0gZCAmJiB2MltrMl9vZmZzZXQgLSAxXSA8IHYyW2syX29mZnNldCArIDFdKSkge1xuICAgICAgICAgIHgyID0gdjJbazJfb2Zmc2V0ICsgMV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgeDIgPSB2MltrMl9vZmZzZXQgLSAxXSArIDE7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHkyID0geDIgLSBrMjtcbiAgICAgICAgd2hpbGUgKHgyIDwgdGV4dDFfbGVuZ3RoICYmIHkyIDwgdGV4dDJfbGVuZ3RoICYmXG4gICAgICAgICAgICAgIHRleHQxLmNoYXJBdCh0ZXh0MV9sZW5ndGggLSB4MiAtIDEpID09XG4gICAgICAgICAgICAgIHRleHQyLmNoYXJBdCh0ZXh0Ml9sZW5ndGggLSB5MiAtIDEpKSB7XG4gICAgICAgICAgeDIrKztcbiAgICAgICAgICB5MisrO1xuICAgICAgICB9XG4gICAgICAgIHYyW2syX29mZnNldF0gPSB4MjtcbiAgICAgICAgaWYgKHgyID4gdGV4dDFfbGVuZ3RoKSB7XG4gICAgICAgICAgLy8gUmFuIG9mZiB0aGUgbGVmdCBvZiB0aGUgZ3JhcGguXG4gICAgICAgICAgazJlbmQgKz0gMjtcbiAgICAgICAgfSBlbHNlIGlmICh5MiA+IHRleHQyX2xlbmd0aCkge1xuICAgICAgICAgIC8vIFJhbiBvZmYgdGhlIHRvcCBvZiB0aGUgZ3JhcGguXG4gICAgICAgICAgazJzdGFydCArPSAyO1xuICAgICAgICB9IGVsc2UgaWYgKCFmcm9udCkge1xuICAgICAgICAgIGNvbnN0IGsxX29mZnNldCA9IHZfb2Zmc2V0ICsgZGVsdGEgLSBrMjtcbiAgICAgICAgICBpZiAoazFfb2Zmc2V0ID49IDAgJiYgazFfb2Zmc2V0IDwgdl9sZW5ndGggJiYgdjFbazFfb2Zmc2V0XSAhPSAtMSkge1xuICAgICAgICAgICAgY29uc3QgeDEgPSB2MVtrMV9vZmZzZXRdO1xuICAgICAgICAgICAgY29uc3QgeTEgPSB2X29mZnNldCArIHgxIC0gazFfb2Zmc2V0O1xuICAgICAgICAgICAgLy8gTWlycm9yIHgyIG9udG8gdG9wLWxlZnQgY29vcmRpbmF0ZSBzeXN0ZW0uXG4gICAgICAgICAgICB4MiA9IHRleHQxX2xlbmd0aCAtIHgyO1xuICAgICAgICAgICAgaWYgKHgxID49IHgyKSB7XG4gICAgICAgICAgICAgIC8vIE92ZXJsYXAgZGV0ZWN0ZWQuXG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLmRpZmZfYmlzZWN0U3BsaXRfKHRleHQxLCB0ZXh0MiwgeDEsIHkxLCBkZWFkbGluZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vIERpZmYgdG9vayB0b28gbG9uZyBhbmQgaGl0IHRoZSBkZWFkbGluZSBvclxuICAgIC8vIG51bWJlciBvZiBkaWZmcyBlcXVhbHMgbnVtYmVyIG9mIGNoYXJhY3RlcnMsIG5vIGNvbW1vbmFsaXR5IGF0IGFsbC5cbiAgICByZXR1cm4gW1tEaWZmT3AuRGVsZXRlLCB0ZXh0MV0sIFtEaWZmT3AuSW5zZXJ0LCB0ZXh0Ml1dO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIEdpdmVuIHRoZSBsb2NhdGlvbiBvZiB0aGUgJ21pZGRsZSBzbmFrZScsIHNwbGl0IHRoZSBkaWZmIGluIHR3byBwYXJ0c1xuICAgKiBhbmQgcmVjdXJzZS5cbiAgICogQHBhcmFtICB0ZXh0MSBPbGQgc3RyaW5nIHRvIGJlIGRpZmZlZC5cbiAgICogQHBhcmFtICB0ZXh0MiBOZXcgc3RyaW5nIHRvIGJlIGRpZmZlZC5cbiAgICogQHBhcmFtICB4IEluZGV4IG9mIHNwbGl0IHBvaW50IGluIHRleHQxLlxuICAgKiBAcGFyYW0gIHkgSW5kZXggb2Ygc3BsaXQgcG9pbnQgaW4gdGV4dDIuXG4gICAqIEBwYXJhbSAgZGVhZGxpbmUgVGltZSBhdCB3aGljaCB0byBiYWlsIGlmIG5vdCB5ZXQgY29tcGxldGUuXG4gICAqIEByZXR1cm4gIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuXG4gICAqL1xuICAgIGRpZmZfYmlzZWN0U3BsaXRfICh0ZXh0MTogc3RyaW5nLCB0ZXh0Mjogc3RyaW5nLCB4OiBudW1iZXIsIHk6IG51bWJlciwgZGVhZGxpbmU6IG51bWJlcikge1xuICAgICAgY29uc3QgdGV4dDFhID0gdGV4dDEuc3Vic3RyaW5nKDAsIHgpO1xuICAgICAgY29uc3QgdGV4dDJhID0gdGV4dDIuc3Vic3RyaW5nKDAsIHkpO1xuICAgICAgY29uc3QgdGV4dDFiID0gdGV4dDEuc3Vic3RyaW5nKHgpO1xuICAgICAgY29uc3QgdGV4dDJiID0gdGV4dDIuc3Vic3RyaW5nKHkpO1xuXG4gICAgICAvLyBDb21wdXRlIGJvdGggZGlmZnMgc2VyaWFsbHkuXG4gICAgICBjb25zdCBkaWZmcyA9IHRoaXMuZGlmZl9tYWluKHRleHQxYSwgdGV4dDJhLCBmYWxzZSwgZGVhZGxpbmUpO1xuICAgICAgY29uc3QgZGlmZnNiID0gdGhpcy5kaWZmX21haW4odGV4dDFiLCB0ZXh0MmIsIGZhbHNlLCBkZWFkbGluZSk7XG5cbiAgICAgIHJldHVybiBkaWZmcy5jb25jYXQoZGlmZnNiKTtcbiAgICB9O1xuXG5cbiAgLyoqXG4gICAqIFNwbGl0IHR3byB0ZXh0cyBpbnRvIGFuIGFycmF5IG9mIHN0cmluZ3MuICBSZWR1Y2UgdGhlIHRleHRzIHRvIGEgc3RyaW5nIG9mXG4gICAqIGhhc2hlcyB3aGVyZSBlYWNoIFVuaWNvZGUgY2hhcmFjdGVyIHJlcHJlc2VudHMgb25lIGxpbmUuXG4gICAqIEBwYXJhbSAgdGV4dDEgRmlyc3Qgc3RyaW5nLlxuICAgKiBAcGFyYW0gIHRleHQyIFNlY29uZCBzdHJpbmcuXG4gICAqIEByZXR1cm4gfVxuICAgKiAgICAgQW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIGVuY29kZWQgdGV4dDEsIHRoZSBlbmNvZGVkIHRleHQyIGFuZFxuICAgKiAgICAgdGhlIGFycmF5IG9mIHVuaXF1ZSBzdHJpbmdzLlxuICAgKiAgICAgVGhlIHplcm90aCBlbGVtZW50IG9mIHRoZSBhcnJheSBvZiB1bmlxdWUgc3RyaW5ncyBpcyBpbnRlbnRpb25hbGx5IGJsYW5rLlxuXG4gICAqL1xuICAgIGRpZmZfbGluZXNUb0NoYXJzXyAodGV4dDE6IHN0cmluZywgdGV4dDI6IHN0cmluZykge1xuICAgICAgY29uc3QgbGluZUFycmF5ID0gW107ICAvLyBlLmcuIGxpbmVBcnJheVs0XSA9PSAnSGVsbG9cXG4nXG4gICAgICBjb25zdCBsaW5lSGFzaCA9IHt9OyAgIC8vIGUuZy4gbGluZUhhc2hbJ0hlbGxvXFxuJ10gPT0gNFxuXG4gICAgICAvLyAnXFx4MDAnIGlzIGEgdmFsaWQgY2hhcmFjdGVyLCBidXQgY29uc3Rpb3VzIGRlYnVnZ2VycyBkb24ndCBsaWtlIGl0LlxuICAgICAgLy8gU28gd2UnbGwgaW5zZXJ0IGEganVuayBlbnRyeSB0byBhdm9pZCBnZW5lcmF0aW5nIGEgbnVsbCBjaGFyYWN0ZXIuXG4gICAgICBsaW5lQXJyYXlbMF0gPSAnJztcblxuXG4gICAgICBjb25zdCBjaGFyczEgPSB0aGlzLmRpZmZfbGluZXNUb0NoYXJzTXVuZ2VfKHRleHQxLCBsaW5lQXJyYXksIGxpbmVIYXNoKTtcbiAgICAgIGNvbnN0IGNoYXJzMiA9IHRoaXMuZGlmZl9saW5lc1RvQ2hhcnNNdW5nZV8odGV4dDIsIGxpbmVBcnJheSwgbGluZUhhc2gpO1xuICAgICAgcmV0dXJuIHtjaGFyczE6IGNoYXJzMSwgY2hhcnMyOiBjaGFyczIsIGxpbmVBcnJheTogbGluZUFycmF5fTtcbiAgIH07XG5cbiAgLyoqXG4gICAqIFNwbGl0IGEgdGV4dCBpbnRvIGFuIGFycmF5IG9mIHN0cmluZ3MuICBSZWR1Y2UgdGhlIHRleHRzIHRvIGEgc3RyaW5nIG9mXG4gICAqIGhhc2hlcyB3aGVyZSBlYWNoIFVuaWNvZGUgY2hhcmFjdGVyIHJlcHJlc2VudHMgb25lIGxpbmUuXG4gICAqIE1vZGlmaWVzIGxpbmVhcnJheSBhbmQgbGluZWhhc2ggdGhyb3VnaCBiZWluZyBhIGNsb3N1cmUuXG4gICAqIEBwYXJhbSAgdGV4dCBTdHJpbmcgdG8gZW5jb2RlLlxuICAgKiBAcmV0dXJuICBFbmNvZGVkIHN0cmluZy5cblxuICAgKi9cbiAgZGlmZl9saW5lc1RvQ2hhcnNNdW5nZV8odGV4dDogc3RyaW5nLCBsaW5lQXJyYXk6IEFycmF5PHN0cmluZz4sIGxpbmVIYXNoOiBhbnkpOiBzdHJpbmcge1xuICAgIGxldCBjaGFycyA9ICcnO1xuICAgIC8vIFdhbGsgdGhlIHRleHQsIHB1bGxpbmcgb3V0IGEgc3Vic3RyaW5nIGZvciBlYWNoIGxpbmUuXG4gICAgLy8gdGV4dC5zcGxpdCgnXFxuJykgd291bGQgd291bGQgdGVtcG9yYXJpbHkgZG91YmxlIG91ciBtZW1vcnkgZm9vdHByaW50LlxuICAgIC8vIE1vZGlmeWluZyB0ZXh0IHdvdWxkIGNyZWF0ZSBtYW55IGxhcmdlIHN0cmluZ3MgdG8gZ2FyYmFnZSBjb2xsZWN0LlxuICAgIGxldCBsaW5lU3RhcnQgPSAwO1xuICAgIGxldCBsaW5lRW5kID0gLTE7XG4gICAgLy8gS2VlcGluZyBvdXIgb3duIGxlbmd0aCBjb25zdGlhYmxlIGlzIGZhc3RlciB0aGFuIGxvb2tpbmcgaXQgdXAuXG4gICAgbGV0IGxpbmVBcnJheUxlbmd0aCA9IGxpbmVBcnJheS5sZW5ndGg7XG4gICAgd2hpbGUgKGxpbmVFbmQgPCB0ZXh0Lmxlbmd0aCAtIDEpIHtcbiAgICAgIGxpbmVFbmQgPSB0ZXh0LmluZGV4T2YoJ1xcbicsIGxpbmVTdGFydCk7XG4gICAgICBpZiAobGluZUVuZCA9PSAtMSkge1xuICAgICAgICBsaW5lRW5kID0gdGV4dC5sZW5ndGggLSAxO1xuICAgICAgfVxuICAgICAgY29uc3QgbGluZSA9IHRleHQuc3Vic3RyaW5nKGxpbmVTdGFydCwgbGluZUVuZCArIDEpO1xuICAgICAgbGluZVN0YXJ0ID0gbGluZUVuZCArIDE7XG5cbiAgICAgIGlmIChsaW5lSGFzaC5oYXNPd25Qcm9wZXJ0eSA/IGxpbmVIYXNoLmhhc093blByb3BlcnR5KGxpbmUpIDpcbiAgICAgICAgICAobGluZUhhc2hbbGluZV0gIT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgY2hhcnMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShsaW5lSGFzaFtsaW5lXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjaGFycyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGxpbmVBcnJheUxlbmd0aCk7XG4gICAgICAgIGxpbmVIYXNoW2xpbmVdID0gbGluZUFycmF5TGVuZ3RoO1xuICAgICAgICBsaW5lQXJyYXlbbGluZUFycmF5TGVuZ3RoKytdID0gbGluZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNoYXJzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlaHlkcmF0ZSB0aGUgdGV4dCBpbiBhIGRpZmYgZnJvbSBhIHN0cmluZyBvZiBsaW5lIGhhc2hlcyB0byByZWFsIGxpbmVzIG9mXG4gICAqIHRleHQuXG4gICAqIEBwYXJhbSAgZGlmZnMgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXG4gICAqIEBwYXJhbSAgbGluZUFycmF5IEFycmF5IG9mIHVuaXF1ZSBzdHJpbmdzLlxuXG4gICAqL1xuICAgIGRpZmZfY2hhcnNUb0xpbmVzXyAoZGlmZnM6IEFycmF5PERpZmY+LCBsaW5lQXJyYXk6IEFycmF5PHN0cmluZz4pOiB2b2lkIHtcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGRpZmZzLmxlbmd0aDsgeCsrKSB7XG4gICAgICBjb25zdCBjaGFycyA9IGRpZmZzW3hdWzFdO1xuICAgICAgY29uc3QgdGV4dCA9IFtdO1xuICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBjaGFycy5sZW5ndGg7IHkrKykge1xuICAgICAgICB0ZXh0W3ldID0gbGluZUFycmF5W2NoYXJzLmNoYXJDb2RlQXQoeSldO1xuICAgICAgfVxuICAgICAgZGlmZnNbeF1bMV0gPSB0ZXh0LmpvaW4oJycpO1xuICAgIH1cbiAgfTtcblxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmUgdGhlIGNvbW1vbiBwcmVmaXggb2YgdHdvIHN0cmluZ3MuXG4gICAqIEBwYXJhbSAgdGV4dDEgRmlyc3Qgc3RyaW5nLlxuICAgKiBAcGFyYW0gIHRleHQyIFNlY29uZCBzdHJpbmcuXG4gICAqIEByZXR1cm4gIFRoZSBudW1iZXIgb2YgY2hhcmFjdGVycyBjb21tb24gdG8gdGhlIHN0YXJ0IG9mIGVhY2hcbiAgICogICAgIHN0cmluZy5cbiAgICovXG4gICAgZGlmZl9jb21tb25QcmVmaXggKHRleHQxOiBzdHJpbmcsIHRleHQyOiBzdHJpbmcpOiBudW1iZXIge1xuICAgIC8vIFF1aWNrIGNoZWNrIGZvciBjb21tb24gbnVsbCBjYXNlcy5cbiAgICBpZiAoIXRleHQxIHx8ICF0ZXh0MiB8fCB0ZXh0MS5jaGFyQXQoMCkgIT0gdGV4dDIuY2hhckF0KDApKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgLy8gQmluYXJ5IHNlYXJjaC5cbiAgICAvLyBQZXJmb3JtYW5jZSBhbmFseXNpczogaHR0cDovL25laWwuZnJhc2VyLm5hbWUvbmV3cy8yMDA3LzEwLzA5L1xuICAgIGxldCBwb2ludGVybWluID0gMDtcbiAgICBsZXQgcG9pbnRlcm1heCA9IE1hdGgubWluKHRleHQxLmxlbmd0aCwgdGV4dDIubGVuZ3RoKTtcbiAgICBsZXQgcG9pbnRlcm1pZCA9IHBvaW50ZXJtYXg7XG4gICAgbGV0IHBvaW50ZXJzdGFydCA9IDA7XG4gICAgd2hpbGUgKHBvaW50ZXJtaW4gPCBwb2ludGVybWlkKSB7XG4gICAgICBpZiAodGV4dDEuc3Vic3RyaW5nKHBvaW50ZXJzdGFydCwgcG9pbnRlcm1pZCkgPT1cbiAgICAgICAgICB0ZXh0Mi5zdWJzdHJpbmcocG9pbnRlcnN0YXJ0LCBwb2ludGVybWlkKSkge1xuICAgICAgICBwb2ludGVybWluID0gcG9pbnRlcm1pZDtcbiAgICAgICAgcG9pbnRlcnN0YXJ0ID0gcG9pbnRlcm1pbjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBvaW50ZXJtYXggPSBwb2ludGVybWlkO1xuICAgICAgfVxuICAgICAgcG9pbnRlcm1pZCA9IE1hdGguZmxvb3IoKHBvaW50ZXJtYXggLSBwb2ludGVybWluKSAvIDIgKyBwb2ludGVybWluKTtcbiAgICB9XG4gICAgcmV0dXJuIHBvaW50ZXJtaWQ7XG4gIH07XG5cblxuICAvKipcbiAgICogRGV0ZXJtaW5lIHRoZSBjb21tb24gc3VmZml4IG9mIHR3byBzdHJpbmdzLlxuICAgKiBAcGFyYW0gIHRleHQxIEZpcnN0IHN0cmluZy5cbiAgICogQHBhcmFtICB0ZXh0MiBTZWNvbmQgc3RyaW5nLlxuICAgKiBAcmV0dXJuICBUaGUgbnVtYmVyIG9mIGNoYXJhY3RlcnMgY29tbW9uIHRvIHRoZSBlbmQgb2YgZWFjaCBzdHJpbmcuXG4gICAqL1xuICAgIGRpZmZfY29tbW9uU3VmZml4ICh0ZXh0MTogc3RyaW5nLCB0ZXh0Mjogc3RyaW5nKTogbnVtYmVyIHtcbiAgICAvLyBRdWljayBjaGVjayBmb3IgY29tbW9uIG51bGwgY2FzZXMuXG4gICAgaWYgKCF0ZXh0MSB8fCAhdGV4dDIgfHxcbiAgICAgICAgdGV4dDEuY2hhckF0KHRleHQxLmxlbmd0aCAtIDEpICE9IHRleHQyLmNoYXJBdCh0ZXh0Mi5sZW5ndGggLSAxKSkge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIC8vIEJpbmFyeSBzZWFyY2guXG4gICAgLy8gUGVyZm9ybWFuY2UgYW5hbHlzaXM6IGh0dHA6Ly9uZWlsLmZyYXNlci5uYW1lL25ld3MvMjAwNy8xMC8wOS9cbiAgICBsZXQgcG9pbnRlcm1pbiA9IDA7XG4gICAgbGV0IHBvaW50ZXJtYXggPSBNYXRoLm1pbih0ZXh0MS5sZW5ndGgsIHRleHQyLmxlbmd0aCk7XG4gICAgbGV0IHBvaW50ZXJtaWQgPSBwb2ludGVybWF4O1xuICAgIGxldCBwb2ludGVyZW5kID0gMDtcbiAgICB3aGlsZSAocG9pbnRlcm1pbiA8IHBvaW50ZXJtaWQpIHtcbiAgICAgIGlmICh0ZXh0MS5zdWJzdHJpbmcodGV4dDEubGVuZ3RoIC0gcG9pbnRlcm1pZCwgdGV4dDEubGVuZ3RoIC0gcG9pbnRlcmVuZCkgPT1cbiAgICAgICAgICB0ZXh0Mi5zdWJzdHJpbmcodGV4dDIubGVuZ3RoIC0gcG9pbnRlcm1pZCwgdGV4dDIubGVuZ3RoIC0gcG9pbnRlcmVuZCkpIHtcbiAgICAgICAgcG9pbnRlcm1pbiA9IHBvaW50ZXJtaWQ7XG4gICAgICAgIHBvaW50ZXJlbmQgPSBwb2ludGVybWluO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcG9pbnRlcm1heCA9IHBvaW50ZXJtaWQ7XG4gICAgICB9XG4gICAgICBwb2ludGVybWlkID0gTWF0aC5mbG9vcigocG9pbnRlcm1heCAtIHBvaW50ZXJtaW4pIC8gMiArIHBvaW50ZXJtaW4pO1xuICAgIH1cbiAgICByZXR1cm4gcG9pbnRlcm1pZDtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmUgaWYgdGhlIHN1ZmZpeCBvZiBvbmUgc3RyaW5nIGlzIHRoZSBwcmVmaXggb2YgYW5vdGhlci5cbiAgICogQHBhcmFtICB0ZXh0MSBGaXJzdCBzdHJpbmcuXG4gICAqIEBwYXJhbSAgdGV4dDIgU2Vjb25kIHN0cmluZy5cbiAgICogQHJldHVybiAgVGhlIG51bWJlciBvZiBjaGFyYWN0ZXJzIGNvbW1vbiB0byB0aGUgZW5kIG9mIHRoZSBmaXJzdFxuICAgKiAgICAgc3RyaW5nIGFuZCB0aGUgc3RhcnQgb2YgdGhlIHNlY29uZCBzdHJpbmcuXG5cbiAgICovXG4gICAgZGlmZl9jb21tb25PdmVybGFwXyAodGV4dDE6IHN0cmluZywgdGV4dDI6IHN0cmluZyk6IG51bWJlciB7XG4gICAgLy8gQ2FjaGUgdGhlIHRleHQgbGVuZ3RocyB0byBwcmV2ZW50IG11bHRpcGxlIGNhbGxzLlxuICAgIGNvbnN0IHRleHQxX2xlbmd0aCA9IHRleHQxLmxlbmd0aDtcbiAgICBjb25zdCB0ZXh0Ml9sZW5ndGggPSB0ZXh0Mi5sZW5ndGg7XG4gICAgLy8gRWxpbWluYXRlIHRoZSBudWxsIGNhc2UuXG4gICAgaWYgKHRleHQxX2xlbmd0aCA9PSAwIHx8IHRleHQyX2xlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgLy8gVHJ1bmNhdGUgdGhlIGxvbmdlciBzdHJpbmcuXG4gICAgaWYgKHRleHQxX2xlbmd0aCA+IHRleHQyX2xlbmd0aCkge1xuICAgICAgdGV4dDEgPSB0ZXh0MS5zdWJzdHJpbmcodGV4dDFfbGVuZ3RoIC0gdGV4dDJfbGVuZ3RoKTtcbiAgICB9IGVsc2UgaWYgKHRleHQxX2xlbmd0aCA8IHRleHQyX2xlbmd0aCkge1xuICAgICAgdGV4dDIgPSB0ZXh0Mi5zdWJzdHJpbmcoMCwgdGV4dDFfbGVuZ3RoKTtcbiAgICB9XG4gICAgY29uc3QgdGV4dF9sZW5ndGggPSBNYXRoLm1pbih0ZXh0MV9sZW5ndGgsIHRleHQyX2xlbmd0aCk7XG4gICAgLy8gUXVpY2sgY2hlY2sgZm9yIHRoZSB3b3JzdCBjYXNlLlxuICAgIGlmICh0ZXh0MSA9PSB0ZXh0Mikge1xuICAgICAgcmV0dXJuIHRleHRfbGVuZ3RoO1xuICAgIH1cblxuICAgIC8vIFN0YXJ0IGJ5IGxvb2tpbmcgZm9yIGEgc2luZ2xlIGNoYXJhY3RlciBtYXRjaFxuICAgIC8vIGFuZCBpbmNyZWFzZSBsZW5ndGggdW50aWwgbm8gbWF0Y2ggaXMgZm91bmQuXG4gICAgLy8gUGVyZm9ybWFuY2UgYW5hbHlzaXM6IGh0dHA6Ly9uZWlsLmZyYXNlci5uYW1lL25ld3MvMjAxMC8xMS8wNC9cbiAgICBsZXQgYmVzdCA9IDA7XG4gICAgbGV0IGxlbmd0aCA9IDE7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGNvbnN0IHBhdHRlcm4gPSB0ZXh0MS5zdWJzdHJpbmcodGV4dF9sZW5ndGggLSBsZW5ndGgpO1xuICAgICAgY29uc3QgZm91bmQgPSB0ZXh0Mi5pbmRleE9mKHBhdHRlcm4pO1xuICAgICAgaWYgKGZvdW5kID09IC0xKSB7XG4gICAgICAgIHJldHVybiBiZXN0O1xuICAgICAgfVxuICAgICAgbGVuZ3RoICs9IGZvdW5kO1xuICAgICAgaWYgKGZvdW5kID09IDAgfHwgdGV4dDEuc3Vic3RyaW5nKHRleHRfbGVuZ3RoIC0gbGVuZ3RoKSA9PVxuICAgICAgICAgIHRleHQyLnN1YnN0cmluZygwLCBsZW5ndGgpKSB7XG4gICAgICAgIGJlc3QgPSBsZW5ndGg7XG4gICAgICAgIGxlbmd0aCsrO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuXG4gIC8qKlxuICAgKiBEbyB0aGUgdHdvIHRleHRzIHNoYXJlIGEgc3Vic3RyaW5nIHdoaWNoIGlzIGF0IGxlYXN0IGhhbGYgdGhlIGxlbmd0aCBvZiB0aGVcbiAgICogbG9uZ2VyIHRleHQ/XG4gICAqIFRoaXMgc3BlZWR1cCBjYW4gcHJvZHVjZSBub24tbWluaW1hbCBkaWZmcy5cbiAgICogQHBhcmFtICB0ZXh0MSBGaXJzdCBzdHJpbmcuXG4gICAqIEBwYXJhbSAgdGV4dDIgU2Vjb25kIHN0cmluZy5cbiAgICogQHJldHVybiAgRml2ZSBlbGVtZW50IEFycmF5LCBjb250YWluaW5nIHRoZSBwcmVmaXggb2ZcbiAgICogICAgIHRleHQxLCB0aGUgc3VmZml4IG9mIHRleHQxLCB0aGUgcHJlZml4IG9mIHRleHQyLCB0aGUgc3VmZml4IG9mXG4gICAqICAgICB0ZXh0MiBhbmQgdGhlIGNvbW1vbiBtaWRkbGUuICBPciBudWxsIGlmIHRoZXJlIHdhcyBubyBtYXRjaC5cblxuICAgKi9cbiAgICBkaWZmX2hhbGZNYXRjaF8gKHRleHQxOiBzdHJpbmcsIHRleHQyOiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy5EaWZmX1RpbWVvdXQgPD0gMCkge1xuICAgICAgLy8gRG9uJ3QgcmlzayByZXR1cm5pbmcgYSBub24tb3B0aW1hbCBkaWZmIGlmIHdlIGhhdmUgdW5saW1pdGVkIHRpbWUuXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgbG9uZ3RleHQgPSB0ZXh0MS5sZW5ndGggPiB0ZXh0Mi5sZW5ndGggPyB0ZXh0MSA6IHRleHQyO1xuICAgIGNvbnN0IHNob3J0dGV4dCA9IHRleHQxLmxlbmd0aCA+IHRleHQyLmxlbmd0aCA/IHRleHQyIDogdGV4dDE7XG4gICAgaWYgKGxvbmd0ZXh0Lmxlbmd0aCA8IDQgfHwgc2hvcnR0ZXh0Lmxlbmd0aCAqIDIgPCBsb25ndGV4dC5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBudWxsOyAgLy8gUG9pbnRsZXNzLlxuICAgIH1cbiAgICBjb25zdCBkbXAgPSB0aGlzOyAgLy8gJ3RoaXMnIGJlY29tZXMgJ3dpbmRvdycgaW4gYSBjbG9zdXJlLlxuXG5cbiAgICAvLyBGaXJzdCBjaGVjayBpZiB0aGUgc2Vjb25kIHF1YXJ0ZXIgaXMgdGhlIHNlZWQgZm9yIGEgaGFsZi1tYXRjaC5cbiAgICBjb25zdCBobTEgPSB0aGlzLmRpZmZfaGFsZk1hdGNoSV8obG9uZ3RleHQsIHNob3J0dGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguY2VpbChsb25ndGV4dC5sZW5ndGggLyA0KSwgZG1wKTtcbiAgICAvLyBDaGVjayBhZ2FpbiBiYXNlZCBvbiB0aGUgdGhpcmQgcXVhcnRlci5cbiAgICBjb25zdCBobTIgPSB0aGlzLmRpZmZfaGFsZk1hdGNoSV8obG9uZ3RleHQsIHNob3J0dGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguY2VpbChsb25ndGV4dC5sZW5ndGggLyAyKSwgZG1wKTtcbiAgICBsZXQgaG07XG4gICAgaWYgKCFobTEgJiYgIWhtMikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBlbHNlIGlmICghaG0yKSB7XG4gICAgICBobSA9IGhtMTtcbiAgICB9IGVsc2UgaWYgKCFobTEpIHtcbiAgICAgIGhtID0gaG0yO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBCb3RoIG1hdGNoZWQuICBTZWxlY3QgdGhlIGxvbmdlc3QuXG4gICAgICBobSA9IGhtMVs0XS5sZW5ndGggPiBobTJbNF0ubGVuZ3RoID8gaG0xIDogaG0yO1xuICAgIH1cblxuICAgIC8vIEEgaGFsZi1tYXRjaCB3YXMgZm91bmQsIHNvcnQgb3V0IHRoZSByZXR1cm4gZGF0YS5cbiAgICBsZXQgdGV4dDFfYSwgdGV4dDFfYiwgdGV4dDJfYSwgdGV4dDJfYjtcbiAgICBpZiAodGV4dDEubGVuZ3RoID4gdGV4dDIubGVuZ3RoKSB7XG4gICAgICB0ZXh0MV9hID0gaG1bMF07XG4gICAgICB0ZXh0MV9iID0gaG1bMV07XG4gICAgICB0ZXh0Ml9hID0gaG1bMl07XG4gICAgICB0ZXh0Ml9iID0gaG1bM107XG4gICAgfSBlbHNlIHtcbiAgICAgIHRleHQyX2EgPSBobVswXTtcbiAgICAgIHRleHQyX2IgPSBobVsxXTtcbiAgICAgIHRleHQxX2EgPSBobVsyXTtcbiAgICAgIHRleHQxX2IgPSBobVszXTtcbiAgICB9XG4gICAgY29uc3QgbWlkX2NvbW1vbiA9IGhtWzRdO1xuICAgIHJldHVybiBbdGV4dDFfYSwgdGV4dDFfYiwgdGV4dDJfYSwgdGV4dDJfYiwgbWlkX2NvbW1vbl07XG4gIH07XG5cbiAgLyoqXG4gICAqIERvZXMgYSBzdWJzdHJpbmcgb2Ygc2hvcnR0ZXh0IGV4aXN0IHdpdGhpbiBsb25ndGV4dCBzdWNoIHRoYXQgdGhlIHN1YnN0cmluZ1xuICAgKiBpcyBhdCBsZWFzdCBoYWxmIHRoZSBsZW5ndGggb2YgbG9uZ3RleHQ/XG4gICAqIENsb3N1cmUsIGJ1dCBkb2VzIG5vdCByZWZlcmVuY2UgYW55IGV4dGVybmFsIGNvbnN0aWFibGVzLlxuICAgKiBAcGFyYW0gIGxvbmd0ZXh0IExvbmdlciBzdHJpbmcuXG4gICAqIEBwYXJhbSAgc2hvcnR0ZXh0IFNob3J0ZXIgc3RyaW5nLlxuICAgKiBAcGFyYW0gIGkgU3RhcnQgaW5kZXggb2YgcXVhcnRlciBsZW5ndGggc3Vic3RyaW5nIHdpdGhpbiBsb25ndGV4dC5cbiAgICogQHJldHVybiAgRml2ZSBlbGVtZW50IEFycmF5LCBjb250YWluaW5nIHRoZSBwcmVmaXggb2ZcbiAgICogICAgIGxvbmd0ZXh0LCB0aGUgc3VmZml4IG9mIGxvbmd0ZXh0LCB0aGUgcHJlZml4IG9mIHNob3J0dGV4dCwgdGhlIHN1ZmZpeFxuICAgKiAgICAgb2Ygc2hvcnR0ZXh0IGFuZCB0aGUgY29tbW9uIG1pZGRsZS4gIE9yIG51bGwgaWYgdGhlcmUgd2FzIG5vIG1hdGNoLlxuXG4gICAqL1xuICBkaWZmX2hhbGZNYXRjaElfKGxvbmd0ZXh0OiBzdHJpbmcsIHNob3J0dGV4dDogc3RyaW5nLCBpOiBudW1iZXIsIGRtcDogRGlmZk1hdGNoUGF0Y2gpOiBBcnJheTxzdHJpbmc+IHtcbiAgICAvLyBTdGFydCB3aXRoIGEgMS80IGxlbmd0aCBzdWJzdHJpbmcgYXQgcG9zaXRpb24gaSBhcyBhIHNlZWQuXG4gICAgY29uc3Qgc2VlZCA9IGxvbmd0ZXh0LnN1YnN0cmluZyhpLCBpICsgTWF0aC5mbG9vcihsb25ndGV4dC5sZW5ndGggLyA0KSk7XG4gICAgbGV0IGogPSAtMTtcbiAgICBsZXQgYmVzdF9jb21tb24gPSAnJztcbiAgICBsZXQgYmVzdF9sb25ndGV4dF9hLCBiZXN0X2xvbmd0ZXh0X2IsIGJlc3Rfc2hvcnR0ZXh0X2EsIGJlc3Rfc2hvcnR0ZXh0X2I7XG4gICAgd2hpbGUgKChqID0gc2hvcnR0ZXh0LmluZGV4T2Yoc2VlZCwgaiArIDEpKSAhPSAtMSkge1xuICAgICAgY29uc3QgcHJlZml4TGVuZ3RoID0gZG1wLmRpZmZfY29tbW9uUHJlZml4KGxvbmd0ZXh0LnN1YnN0cmluZyhpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG9ydHRleHQuc3Vic3RyaW5nKGopKTtcbiAgICAgIGNvbnN0IHN1ZmZpeExlbmd0aCA9IGRtcC5kaWZmX2NvbW1vblN1ZmZpeChsb25ndGV4dC5zdWJzdHJpbmcoMCwgaSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvcnR0ZXh0LnN1YnN0cmluZygwLCBqKSk7XG4gICAgICBpZiAoYmVzdF9jb21tb24ubGVuZ3RoIDwgc3VmZml4TGVuZ3RoICsgcHJlZml4TGVuZ3RoKSB7XG4gICAgICAgIGJlc3RfY29tbW9uID0gc2hvcnR0ZXh0LnN1YnN0cmluZyhqIC0gc3VmZml4TGVuZ3RoLCBqKSArXG4gICAgICAgICAgICBzaG9ydHRleHQuc3Vic3RyaW5nKGosIGogKyBwcmVmaXhMZW5ndGgpO1xuICAgICAgICBiZXN0X2xvbmd0ZXh0X2EgPSBsb25ndGV4dC5zdWJzdHJpbmcoMCwgaSAtIHN1ZmZpeExlbmd0aCk7XG4gICAgICAgIGJlc3RfbG9uZ3RleHRfYiA9IGxvbmd0ZXh0LnN1YnN0cmluZyhpICsgcHJlZml4TGVuZ3RoKTtcbiAgICAgICAgYmVzdF9zaG9ydHRleHRfYSA9IHNob3J0dGV4dC5zdWJzdHJpbmcoMCwgaiAtIHN1ZmZpeExlbmd0aCk7XG4gICAgICAgIGJlc3Rfc2hvcnR0ZXh0X2IgPSBzaG9ydHRleHQuc3Vic3RyaW5nKGogKyBwcmVmaXhMZW5ndGgpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoYmVzdF9jb21tb24ubGVuZ3RoICogMiA+PSBsb25ndGV4dC5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBbYmVzdF9sb25ndGV4dF9hLCBiZXN0X2xvbmd0ZXh0X2IsXG4gICAgICAgICAgICAgIGJlc3Rfc2hvcnR0ZXh0X2EsIGJlc3Rfc2hvcnR0ZXh0X2IsIGJlc3RfY29tbW9uXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlZHVjZSB0aGUgbnVtYmVyIG9mIGVkaXRzIGJ5IGVsaW1pbmF0aW5nIHNlbWFudGljYWxseSB0cml2aWFsIGVxdWFsaXRpZXMuXG4gICAqIEBwYXJhbSAgZGlmZnMgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXG4gICAqL1xuICAgIGRpZmZfY2xlYW51cFNlbWFudGljIChkaWZmczogQXJyYXk8RGlmZj4pIHtcbiAgICBsZXQgY2hhbmdlcyA9IGZhbHNlO1xuICAgIGNvbnN0IGVxdWFsaXRpZXMgPSBbXTsgIC8vIFN0YWNrIG9mIGluZGljZXMgd2hlcmUgZXF1YWxpdGllcyBhcmUgZm91bmQuXG4gICAgbGV0IGVxdWFsaXRpZXNMZW5ndGggPSAwOyAgLy8gS2VlcGluZyBvdXIgb3duIGxlbmd0aCBjb25zdCBpcyBmYXN0ZXIgaW4gSlMuXG5cbiAgICBsZXQgbGFzdGVxdWFsaXR5ID0gbnVsbDtcbiAgICAvLyBBbHdheXMgZXF1YWwgdG8gZGlmZnNbZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoIC0gMV1dWzFdXG4gICAgbGV0IHBvaW50ZXIgPSAwOyAgLy8gSW5kZXggb2YgY3VycmVudCBwb3NpdGlvbi5cbiAgICAvLyBOdW1iZXIgb2YgY2hhcmFjdGVycyB0aGF0IGNoYW5nZWQgcHJpb3IgdG8gdGhlIGVxdWFsaXR5LlxuICAgIGxldCBsZW5ndGhfaW5zZXJ0aW9uczEgPSAwO1xuICAgIGxldCBsZW5ndGhfZGVsZXRpb25zMSA9IDA7XG4gICAgLy8gTnVtYmVyIG9mIGNoYXJhY3RlcnMgdGhhdCBjaGFuZ2VkIGFmdGVyIHRoZSBlcXVhbGl0eS5cbiAgICBsZXQgbGVuZ3RoX2luc2VydGlvbnMyID0gMDtcbiAgICBsZXQgbGVuZ3RoX2RlbGV0aW9uczIgPSAwO1xuICAgIHdoaWxlIChwb2ludGVyIDwgZGlmZnMubGVuZ3RoKSB7XG4gICAgICBpZiAoZGlmZnNbcG9pbnRlcl1bMF0gPT0gRGlmZk9wLkVxdWFsKSB7ICAvLyBFcXVhbGl0eSBmb3VuZC5cbiAgICAgICAgZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoKytdID0gcG9pbnRlcjtcbiAgICAgICAgbGVuZ3RoX2luc2VydGlvbnMxID0gbGVuZ3RoX2luc2VydGlvbnMyO1xuICAgICAgICBsZW5ndGhfZGVsZXRpb25zMSA9IGxlbmd0aF9kZWxldGlvbnMyO1xuICAgICAgICBsZW5ndGhfaW5zZXJ0aW9uczIgPSAwO1xuICAgICAgICBsZW5ndGhfZGVsZXRpb25zMiA9IDA7XG4gICAgICAgIGxhc3RlcXVhbGl0eSA9IGRpZmZzW3BvaW50ZXJdWzFdO1xuICAgICAgfSBlbHNlIHsgIC8vIEFuIGluc2VydGlvbiBvciBkZWxldGlvbi5cbiAgICAgICAgaWYgKGRpZmZzW3BvaW50ZXJdWzBdID09IERpZmZPcC5JbnNlcnQpIHtcbiAgICAgICAgICBsZW5ndGhfaW5zZXJ0aW9uczIgKz0gZGlmZnNbcG9pbnRlcl1bMV0ubGVuZ3RoO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxlbmd0aF9kZWxldGlvbnMyICs9IGRpZmZzW3BvaW50ZXJdWzFdLmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICAvLyBFbGltaW5hdGUgYW4gZXF1YWxpdHkgdGhhdCBpcyBzbWFsbGVyIG9yIGVxdWFsIHRvIHRoZSBlZGl0cyBvbiBib3RoXG4gICAgICAgIC8vIHNpZGVzIG9mIGl0LlxuICAgICAgICBpZiAobGFzdGVxdWFsaXR5ICYmIChsYXN0ZXF1YWxpdHkubGVuZ3RoIDw9XG4gICAgICAgICAgICBNYXRoLm1heChsZW5ndGhfaW5zZXJ0aW9uczEsIGxlbmd0aF9kZWxldGlvbnMxKSkgJiZcbiAgICAgICAgICAgIChsYXN0ZXF1YWxpdHkubGVuZ3RoIDw9IE1hdGgubWF4KGxlbmd0aF9pbnNlcnRpb25zMixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVuZ3RoX2RlbGV0aW9uczIpKSkge1xuICAgICAgICAgIC8vIER1cGxpY2F0ZSByZWNvcmQuXG4gICAgICAgICAgZGlmZnMuc3BsaWNlKGVxdWFsaXRpZXNbZXF1YWxpdGllc0xlbmd0aCAtIDFdLCAwLFxuICAgICAgICAgICAgICAgICAgICAgIFtEaWZmT3AuRGVsZXRlLCBsYXN0ZXF1YWxpdHldKTtcbiAgICAgICAgICAvLyBDaGFuZ2Ugc2Vjb25kIGNvcHkgdG8gaW5zZXJ0LlxuICAgICAgICAgIGRpZmZzW2VxdWFsaXRpZXNbZXF1YWxpdGllc0xlbmd0aCAtIDFdICsgMV1bMF0gPSBEaWZmT3AuSW5zZXJ0O1xuICAgICAgICAgIC8vIFRocm93IGF3YXkgdGhlIGVxdWFsaXR5IHdlIGp1c3QgZGVsZXRlZC5cbiAgICAgICAgICBlcXVhbGl0aWVzTGVuZ3RoLS07XG4gICAgICAgICAgLy8gVGhyb3cgYXdheSB0aGUgcHJldmlvdXMgZXF1YWxpdHkgKGl0IG5lZWRzIHRvIGJlIHJlZXZhbHVhdGVkKS5cbiAgICAgICAgICBlcXVhbGl0aWVzTGVuZ3RoLS07XG4gICAgICAgICAgcG9pbnRlciA9IGVxdWFsaXRpZXNMZW5ndGggPiAwID8gZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoIC0gMV0gOiAtMTtcbiAgICAgICAgICBsZW5ndGhfaW5zZXJ0aW9uczEgPSAwOyAgLy8gUmVzZXQgdGhlIGNvdW50ZXJzLlxuICAgICAgICAgIGxlbmd0aF9kZWxldGlvbnMxID0gMDtcbiAgICAgICAgICBsZW5ndGhfaW5zZXJ0aW9uczIgPSAwO1xuICAgICAgICAgIGxlbmd0aF9kZWxldGlvbnMyID0gMDtcbiAgICAgICAgICBsYXN0ZXF1YWxpdHkgPSBudWxsO1xuICAgICAgICAgIGNoYW5nZXMgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwb2ludGVyKys7XG4gICAgfVxuXG4gICAgLy8gTm9ybWFsaXplIHRoZSBkaWZmLlxuICAgIGlmIChjaGFuZ2VzKSB7XG4gICAgICB0aGlzLmRpZmZfY2xlYW51cE1lcmdlKGRpZmZzKTtcbiAgICB9XG4gICAgdGhpcy5kaWZmX2NsZWFudXBTZW1hbnRpY0xvc3NsZXNzKGRpZmZzKTtcblxuICAgIC8vIEZpbmQgYW55IG92ZXJsYXBzIGJldHdlZW4gZGVsZXRpb25zIGFuZCBpbnNlcnRpb25zLlxuICAgIC8vIGUuZzogPGRlbD5hYmN4eHg8L2RlbD48aW5zPnh4eGRlZjwvaW5zPlxuICAgIC8vICAgLT4gPGRlbD5hYmM8L2RlbD54eHg8aW5zPmRlZjwvaW5zPlxuICAgIC8vIGUuZzogPGRlbD54eHhhYmM8L2RlbD48aW5zPmRlZnh4eDwvaW5zPlxuICAgIC8vICAgLT4gPGlucz5kZWY8L2lucz54eHg8ZGVsPmFiYzwvZGVsPlxuICAgIC8vIE9ubHkgZXh0cmFjdCBhbiBvdmVybGFwIGlmIGl0IGlzIGFzIGJpZyBhcyB0aGUgZWRpdCBhaGVhZCBvciBiZWhpbmQgaXQuXG4gICAgcG9pbnRlciA9IDE7XG4gICAgd2hpbGUgKHBvaW50ZXIgPCBkaWZmcy5sZW5ndGgpIHtcbiAgICAgIGlmIChkaWZmc1twb2ludGVyIC0gMV1bMF0gPT0gRGlmZk9wLkRlbGV0ZSAmJlxuICAgICAgICAgIGRpZmZzW3BvaW50ZXJdWzBdID09IERpZmZPcC5JbnNlcnQpIHtcbiAgICAgICAgY29uc3QgZGVsZXRpb24gPSBkaWZmc1twb2ludGVyIC0gMV1bMV07XG4gICAgICAgIGNvbnN0IGluc2VydGlvbiA9IGRpZmZzW3BvaW50ZXJdWzFdO1xuICAgICAgICBjb25zdCBvdmVybGFwX2xlbmd0aDEgPSB0aGlzLmRpZmZfY29tbW9uT3ZlcmxhcF8oZGVsZXRpb24sIGluc2VydGlvbik7XG4gICAgICAgIGNvbnN0IG92ZXJsYXBfbGVuZ3RoMiA9IHRoaXMuZGlmZl9jb21tb25PdmVybGFwXyhpbnNlcnRpb24sIGRlbGV0aW9uKTtcbiAgICAgICAgaWYgKG92ZXJsYXBfbGVuZ3RoMSA+PSBvdmVybGFwX2xlbmd0aDIpIHtcbiAgICAgICAgICBpZiAob3ZlcmxhcF9sZW5ndGgxID49IGRlbGV0aW9uLmxlbmd0aCAvIDIgfHxcbiAgICAgICAgICAgICAgb3ZlcmxhcF9sZW5ndGgxID49IGluc2VydGlvbi5sZW5ndGggLyAyKSB7XG4gICAgICAgICAgICAvLyBPdmVybGFwIGZvdW5kLiAgSW5zZXJ0IGFuIGVxdWFsaXR5IGFuZCB0cmltIHRoZSBzdXJyb3VuZGluZyBlZGl0cy5cbiAgICAgICAgICAgIGRpZmZzLnNwbGljZShwb2ludGVyLCAwLFxuICAgICAgICAgICAgICAgIFtEaWZmT3AuRXF1YWwsIGluc2VydGlvbi5zdWJzdHJpbmcoMCwgb3ZlcmxhcF9sZW5ndGgxKV0pO1xuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciAtIDFdWzFdID1cbiAgICAgICAgICAgICAgICBkZWxldGlvbi5zdWJzdHJpbmcoMCwgZGVsZXRpb24ubGVuZ3RoIC0gb3ZlcmxhcF9sZW5ndGgxKTtcbiAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgKyAxXVsxXSA9IGluc2VydGlvbi5zdWJzdHJpbmcob3ZlcmxhcF9sZW5ndGgxKTtcbiAgICAgICAgICAgIHBvaW50ZXIrKztcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKG92ZXJsYXBfbGVuZ3RoMiA+PSBkZWxldGlvbi5sZW5ndGggLyAyIHx8XG4gICAgICAgICAgICAgIG92ZXJsYXBfbGVuZ3RoMiA+PSBpbnNlcnRpb24ubGVuZ3RoIC8gMikge1xuICAgICAgICAgICAgLy8gUmV2ZXJzZSBvdmVybGFwIGZvdW5kLlxuICAgICAgICAgICAgLy8gSW5zZXJ0IGFuIGVxdWFsaXR5IGFuZCBzd2FwIGFuZCB0cmltIHRoZSBzdXJyb3VuZGluZyBlZGl0cy5cbiAgICAgICAgICAgIGRpZmZzLnNwbGljZShwb2ludGVyLCAwLFxuICAgICAgICAgICAgICAgIFtEaWZmT3AuRXF1YWwsIGRlbGV0aW9uLnN1YnN0cmluZygwLCBvdmVybGFwX2xlbmd0aDIpXSk7XG4gICAgICAgICAgICBkaWZmc1twb2ludGVyIC0gMV1bMF0gPSBEaWZmT3AuSW5zZXJ0O1xuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciAtIDFdWzFdID1cbiAgICAgICAgICAgICAgICBpbnNlcnRpb24uc3Vic3RyaW5nKDAsIGluc2VydGlvbi5sZW5ndGggLSBvdmVybGFwX2xlbmd0aDIpO1xuICAgICAgICAgICAgZGlmZnNbcG9pbnRlciArIDFdWzBdID0gRGlmZk9wLkRlbGV0ZTtcbiAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgKyAxXVsxXSA9XG4gICAgICAgICAgICAgICAgZGVsZXRpb24uc3Vic3RyaW5nKG92ZXJsYXBfbGVuZ3RoMik7XG4gICAgICAgICAgICBwb2ludGVyKys7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHBvaW50ZXIrKztcbiAgICAgIH1cbiAgICAgIHBvaW50ZXIrKztcbiAgICB9XG4gIH07XG5cblxuICAvKipcbiAgICogTG9vayBmb3Igc2luZ2xlIGVkaXRzIHN1cnJvdW5kZWQgb24gYm90aCBzaWRlcyBieSBlcXVhbGl0aWVzXG4gICAqIHdoaWNoIGNhbiBiZSBzaGlmdGVkIHNpZGV3YXlzIHRvIGFsaWduIHRoZSBlZGl0IHRvIGEgd29yZCBib3VuZGFyeS5cbiAgICogZS5nOiBUaGUgYzxpbnM+YXQgYzwvaW5zPmFtZS4gLT4gVGhlIDxpbnM+Y2F0IDwvaW5zPmNhbWUuXG4gICAqIEBwYXJhbSAgZGlmZnMgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXG4gICAqL1xuICAgIGRpZmZfY2xlYW51cFNlbWFudGljTG9zc2xlc3MgKGRpZmZzOiBBcnJheTxEaWZmPikge1xuICAgIC8qKlxuICAgICAqIEdpdmVuIHR3byBzdHJpbmdzLCBjb21wdXRlIGEgc2NvcmUgcmVwcmVzZW50aW5nIHdoZXRoZXIgdGhlIGludGVybmFsXG4gICAgICogYm91bmRhcnkgZmFsbHMgb24gbG9naWNhbCBib3VuZGFyaWVzLlxuICAgICAqIFNjb3JlcyByYW5nZSBmcm9tIDYgKGJlc3QpIHRvIDAgKHdvcnN0KS5cbiAgICAgKiBDbG9zdXJlLCBidXQgZG9lcyBub3QgcmVmZXJlbmNlIGFueSBleHRlcm5hbCBjb25zdGlhYmxlcy5cbiAgICAgKiBAcGFyYW0gIG9uZSBGaXJzdCBzdHJpbmcuXG4gICAgICogQHBhcmFtICB0d28gU2Vjb25kIHN0cmluZy5cbiAgICAgKiBAcmV0dXJuICBUaGUgc2NvcmUuXG5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBkaWZmX2NsZWFudXBTZW1hbnRpY1Njb3JlXyhvbmU6IHN0cmluZywgdHdvOiBzdHJpbmcpOiBudW1iZXIge1xuICAgICAgaWYgKCFvbmUgfHwgIXR3bykge1xuICAgICAgICAvLyBFZGdlcyBhcmUgdGhlIGJlc3QuXG4gICAgICAgIHJldHVybiA2O1xuICAgICAgfVxuXG5cbiAgICAgIGNvbnN0IG5vbkFscGhhTnVtZXJpY1JlZ2V4XyA9IG5ldyBSZWdFeHAoJy9bXmEtekEtWjAtOV0vJyk7XG5cbiAgICAgIC8vIEVhY2ggcG9ydCBvZiB0aGlzIGZ1bmN0aW9uIGJlaGF2ZXMgc2xpZ2h0bHkgZGlmZmVyZW50bHkgZHVlIHRvXG4gICAgICAvLyBzdWJ0bGUgZGlmZmVyZW5jZXMgaW4gZWFjaCBsYW5ndWFnZSdzIGRlZmluaXRpb24gb2YgdGhpbmdzIGxpa2VcbiAgICAgIC8vICd3aGl0ZXNwYWNlJy4gIFNpbmNlIHRoaXMgZnVuY3Rpb24ncyBwdXJwb3NlIGlzIGxhcmdlbHkgY29zbWV0aWMsXG4gICAgICAvLyB0aGUgY2hvaWNlIGhhcyBiZWVuIG1hZGUgdG8gdXNlIGVhY2ggbGFuZ3VhZ2UncyBuYXRpdmUgZmVhdHVyZXNcbiAgICAgIC8vIHJhdGhlciB0aGFuIGZvcmNlIHRvdGFsIGNvbmZvcm1pdHkuXG4gICAgICBjb25zdCBjaGFyMSA9IG9uZS5jaGFyQXQob25lLmxlbmd0aCAtIDEpO1xuICAgICAgY29uc3QgY2hhcjIgPSB0d28uY2hhckF0KDApO1xuICAgICAgY29uc3Qgbm9uQWxwaGFOdW1lcmljMSA9IGNoYXIxLm1hdGNoKG5vbkFscGhhTnVtZXJpY1JlZ2V4Xyk7XG4gICAgICBjb25zdCBub25BbHBoYU51bWVyaWMyID0gY2hhcjIubWF0Y2gobm9uQWxwaGFOdW1lcmljUmVnZXhfKTtcbiAgICAgIGNvbnN0IHdoaXRlc3BhY2UxID0gbm9uQWxwaGFOdW1lcmljMSAmJlxuICAgICAgICAgIGNoYXIxLm1hdGNoKHRoaXMud2hpdGVzcGFjZVJlZ2V4Xyk7XG4gICAgICBjb25zdCB3aGl0ZXNwYWNlMiA9IG5vbkFscGhhTnVtZXJpYzIgJiZcbiAgICAgICAgICBjaGFyMi5tYXRjaCh0aGlzLndoaXRlc3BhY2VSZWdleF8pO1xuICAgICAgY29uc3QgbGluZUJyZWFrMSA9IHdoaXRlc3BhY2UxICYmXG4gICAgICAgICAgY2hhcjEubWF0Y2godGhpcy5saW5lYnJlYWtSZWdleF8pO1xuICAgICAgY29uc3QgbGluZUJyZWFrMiA9IHdoaXRlc3BhY2UyICYmXG4gICAgICAgICAgY2hhcjIubWF0Y2godGhpcy5saW5lYnJlYWtSZWdleF8pO1xuICAgICAgY29uc3QgYmxhbmtMaW5lMSA9IGxpbmVCcmVhazEgJiZcbiAgICAgICAgICBvbmUubWF0Y2godGhpcy5ibGFua2xpbmVFbmRSZWdleF8pO1xuICAgICAgY29uc3QgYmxhbmtMaW5lMiA9IGxpbmVCcmVhazIgJiZcbiAgICAgICAgICB0d28ubWF0Y2godGhpcy5ibGFua2xpbmVTdGFydFJlZ2V4Xyk7XG5cbiAgICAgIGlmIChibGFua0xpbmUxIHx8IGJsYW5rTGluZTIpIHtcbiAgICAgICAgLy8gRml2ZSBwb2ludHMgZm9yIGJsYW5rIGxpbmVzLlxuICAgICAgICByZXR1cm4gNTtcbiAgICAgIH0gZWxzZSBpZiAobGluZUJyZWFrMSB8fCBsaW5lQnJlYWsyKSB7XG4gICAgICAgIC8vIEZvdXIgcG9pbnRzIGZvciBsaW5lIGJyZWFrcy5cbiAgICAgICAgcmV0dXJuIDQ7XG4gICAgICB9IGVsc2UgaWYgKG5vbkFscGhhTnVtZXJpYzEgJiYgIXdoaXRlc3BhY2UxICYmIHdoaXRlc3BhY2UyKSB7XG4gICAgICAgIC8vIFRocmVlIHBvaW50cyBmb3IgZW5kIG9mIHNlbnRlbmNlcy5cbiAgICAgICAgcmV0dXJuIDM7XG4gICAgICB9IGVsc2UgaWYgKHdoaXRlc3BhY2UxIHx8IHdoaXRlc3BhY2UyKSB7XG4gICAgICAgIC8vIFR3byBwb2ludHMgZm9yIHdoaXRlc3BhY2UuXG4gICAgICAgIHJldHVybiAyO1xuICAgICAgfSBlbHNlIGlmIChub25BbHBoYU51bWVyaWMxIHx8IG5vbkFscGhhTnVtZXJpYzIpIHtcbiAgICAgICAgLy8gT25lIHBvaW50IGZvciBub24tYWxwaGFudW1lcmljLlxuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIGxldCBwb2ludGVyID0gMTtcbiAgICAvLyBJbnRlbnRpb25hbGx5IGlnbm9yZSB0aGUgZmlyc3QgYW5kIGxhc3QgZWxlbWVudCAoZG9uJ3QgbmVlZCBjaGVja2luZykuXG4gICAgd2hpbGUgKHBvaW50ZXIgPCBkaWZmcy5sZW5ndGggLSAxKSB7XG4gICAgICBpZiAoZGlmZnNbcG9pbnRlciAtIDFdWzBdID09IERpZmZPcC5FcXVhbCAmJlxuICAgICAgICAgIGRpZmZzW3BvaW50ZXIgKyAxXVswXSA9PSBEaWZmT3AuRXF1YWwpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIHNpbmdsZSBlZGl0IHN1cnJvdW5kZWQgYnkgZXF1YWxpdGllcy5cbiAgICAgICAgbGV0IGVxdWFsaXR5MSA9IGRpZmZzW3BvaW50ZXIgLSAxXVsxXTtcbiAgICAgICAgbGV0IGVkaXQgPSBkaWZmc1twb2ludGVyXVsxXTtcbiAgICAgICAgbGV0IGVxdWFsaXR5MiA9IGRpZmZzW3BvaW50ZXIgKyAxXVsxXTtcblxuICAgICAgICAvLyBGaXJzdCwgc2hpZnQgdGhlIGVkaXQgYXMgZmFyIGxlZnQgYXMgcG9zc2libGUuXG4gICAgICAgIGNvbnN0IGNvbW1vbk9mZnNldCA9IHRoaXMuZGlmZl9jb21tb25TdWZmaXgoZXF1YWxpdHkxLCBlZGl0KTtcbiAgICAgICAgaWYgKGNvbW1vbk9mZnNldCkge1xuICAgICAgICAgIGNvbnN0IGNvbW1vblN0cmluZyA9IGVkaXQuc3Vic3RyaW5nKGVkaXQubGVuZ3RoIC0gY29tbW9uT2Zmc2V0KTtcbiAgICAgICAgICBlcXVhbGl0eTEgPSBlcXVhbGl0eTEuc3Vic3RyaW5nKDAsIGVxdWFsaXR5MS5sZW5ndGggLSBjb21tb25PZmZzZXQpO1xuICAgICAgICAgIGVkaXQgPSBjb21tb25TdHJpbmcgKyBlZGl0LnN1YnN0cmluZygwLCBlZGl0Lmxlbmd0aCAtIGNvbW1vbk9mZnNldCk7XG4gICAgICAgICAgZXF1YWxpdHkyID0gY29tbW9uU3RyaW5nICsgZXF1YWxpdHkyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2Vjb25kLCBzdGVwIGNoYXJhY3RlciBieSBjaGFyYWN0ZXIgcmlnaHQsIGxvb2tpbmcgZm9yIHRoZSBiZXN0IGZpdC5cbiAgICAgICAgbGV0IGJlc3RFcXVhbGl0eTEgPSBlcXVhbGl0eTE7XG4gICAgICAgIGxldCBiZXN0RWRpdCA9IGVkaXQ7XG4gICAgICAgIGxldCBiZXN0RXF1YWxpdHkyID0gZXF1YWxpdHkyO1xuICAgICAgICBsZXQgYmVzdFNjb3JlID0gZGlmZl9jbGVhbnVwU2VtYW50aWNTY29yZV8oZXF1YWxpdHkxLCBlZGl0KSArXG4gICAgICAgICAgICBkaWZmX2NsZWFudXBTZW1hbnRpY1Njb3JlXyhlZGl0LCBlcXVhbGl0eTIpO1xuICAgICAgICB3aGlsZSAoZWRpdC5jaGFyQXQoMCkgPT09IGVxdWFsaXR5Mi5jaGFyQXQoMCkpIHtcbiAgICAgICAgICBlcXVhbGl0eTEgKz0gZWRpdC5jaGFyQXQoMCk7XG4gICAgICAgICAgZWRpdCA9IGVkaXQuc3Vic3RyaW5nKDEpICsgZXF1YWxpdHkyLmNoYXJBdCgwKTtcbiAgICAgICAgICBlcXVhbGl0eTIgPSBlcXVhbGl0eTIuc3Vic3RyaW5nKDEpO1xuICAgICAgICAgIGNvbnN0IHNjb3JlID0gZGlmZl9jbGVhbnVwU2VtYW50aWNTY29yZV8oZXF1YWxpdHkxLCBlZGl0KSArXG4gICAgICAgICAgICAgIGRpZmZfY2xlYW51cFNlbWFudGljU2NvcmVfKGVkaXQsIGVxdWFsaXR5Mik7XG4gICAgICAgICAgLy8gVGhlID49IGVuY291cmFnZXMgdHJhaWxpbmcgcmF0aGVyIHRoYW4gbGVhZGluZyB3aGl0ZXNwYWNlIG9uIGVkaXRzLlxuICAgICAgICAgIGlmIChzY29yZSA+PSBiZXN0U2NvcmUpIHtcbiAgICAgICAgICAgIGJlc3RTY29yZSA9IHNjb3JlO1xuICAgICAgICAgICAgYmVzdEVxdWFsaXR5MSA9IGVxdWFsaXR5MTtcbiAgICAgICAgICAgIGJlc3RFZGl0ID0gZWRpdDtcbiAgICAgICAgICAgIGJlc3RFcXVhbGl0eTIgPSBlcXVhbGl0eTI7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRpZmZzW3BvaW50ZXIgLSAxXVsxXSAhPSBiZXN0RXF1YWxpdHkxKSB7XG4gICAgICAgICAgLy8gV2UgaGF2ZSBhbiBpbXByb3ZlbWVudCwgc2F2ZSBpdCBiYWNrIHRvIHRoZSBkaWZmLlxuICAgICAgICAgIGlmIChiZXN0RXF1YWxpdHkxKSB7XG4gICAgICAgICAgICBkaWZmc1twb2ludGVyIC0gMV1bMV0gPSBiZXN0RXF1YWxpdHkxO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciAtIDEsIDEpO1xuICAgICAgICAgICAgcG9pbnRlci0tO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkaWZmc1twb2ludGVyXVsxXSA9IGJlc3RFZGl0O1xuICAgICAgICAgIGlmIChiZXN0RXF1YWxpdHkyKSB7XG4gICAgICAgICAgICBkaWZmc1twb2ludGVyICsgMV1bMV0gPSBiZXN0RXF1YWxpdHkyO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciArIDEsIDEpO1xuICAgICAgICAgICAgcG9pbnRlci0tO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcG9pbnRlcisrO1xuICAgIH1cbiAgfTtcblxuXG4gIC8qKlxuICAgKiBSZWR1Y2UgdGhlIG51bWJlciBvZiBlZGl0cyBieSBlbGltaW5hdGluZyBvcGVyYXRpb25hbGx5IHRyaXZpYWwgZXF1YWxpdGllcy5cbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cbiAgICovXG4gICAgZGlmZl9jbGVhbnVwRWZmaWNpZW5jeSAoZGlmZnM6IEFycmF5PERpZmY+KSB7XG4gICAgbGV0IGNoYW5nZXMgPSBmYWxzZTtcbiAgICBjb25zdCBlcXVhbGl0aWVzID0gW107ICAvLyBTdGFjayBvZiBpbmRpY2VzIHdoZXJlIGVxdWFsaXRpZXMgYXJlIGZvdW5kLlxuICAgIGxldCBlcXVhbGl0aWVzTGVuZ3RoID0gMDsgIC8vIEtlZXBpbmcgb3VyIG93biBsZW5ndGggY29uc3QgaXMgZmFzdGVyIGluIEpTLlxuXG4gICAgbGV0IGxhc3RlcXVhbGl0eSA9IG51bGw7XG4gICAgLy8gQWx3YXlzIGVxdWFsIHRvIGRpZmZzW2VxdWFsaXRpZXNbZXF1YWxpdGllc0xlbmd0aCAtIDFdXVsxXVxuICAgIGxldCBwb2ludGVyID0gMDsgIC8vIEluZGV4IG9mIGN1cnJlbnQgcG9zaXRpb24uXG4gICAgLy8gSXMgdGhlcmUgYW4gaW5zZXJ0aW9uIG9wZXJhdGlvbiBiZWZvcmUgdGhlIGxhc3QgZXF1YWxpdHkuXG4gICAgbGV0IHByZV9pbnMgPSBmYWxzZTtcbiAgICAvLyBJcyB0aGVyZSBhIGRlbGV0aW9uIG9wZXJhdGlvbiBiZWZvcmUgdGhlIGxhc3QgZXF1YWxpdHkuXG4gICAgbGV0IHByZV9kZWwgPSBmYWxzZTtcbiAgICAvLyBJcyB0aGVyZSBhbiBpbnNlcnRpb24gb3BlcmF0aW9uIGFmdGVyIHRoZSBsYXN0IGVxdWFsaXR5LlxuICAgIGxldCBwb3N0X2lucyA9IGZhbHNlO1xuICAgIC8vIElzIHRoZXJlIGEgZGVsZXRpb24gb3BlcmF0aW9uIGFmdGVyIHRoZSBsYXN0IGVxdWFsaXR5LlxuICAgIGxldCBwb3N0X2RlbCA9IGZhbHNlO1xuICAgIHdoaWxlIChwb2ludGVyIDwgZGlmZnMubGVuZ3RoKSB7XG4gICAgICBpZiAoZGlmZnNbcG9pbnRlcl1bMF0gPT0gRGlmZk9wLkVxdWFsKSB7ICAvLyBFcXVhbGl0eSBmb3VuZC5cbiAgICAgICAgaWYgKGRpZmZzW3BvaW50ZXJdWzFdLmxlbmd0aCA8IHRoaXMuRGlmZl9FZGl0Q29zdCAmJlxuICAgICAgICAgICAgKHBvc3RfaW5zIHx8IHBvc3RfZGVsKSkge1xuICAgICAgICAgIC8vIENhbmRpZGF0ZSBmb3VuZC5cbiAgICAgICAgICBlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGgrK10gPSBwb2ludGVyO1xuICAgICAgICAgIHByZV9pbnMgPSBwb3N0X2lucztcbiAgICAgICAgICBwcmVfZGVsID0gcG9zdF9kZWw7XG4gICAgICAgICAgbGFzdGVxdWFsaXR5ID0gZGlmZnNbcG9pbnRlcl1bMV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gTm90IGEgY2FuZGlkYXRlLCBhbmQgY2FuIG5ldmVyIGJlY29tZSBvbmUuXG4gICAgICAgICAgZXF1YWxpdGllc0xlbmd0aCA9IDA7XG4gICAgICAgICAgbGFzdGVxdWFsaXR5ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBwb3N0X2lucyA9IHBvc3RfZGVsID0gZmFsc2U7XG4gICAgICB9IGVsc2UgeyAgLy8gQW4gaW5zZXJ0aW9uIG9yIGRlbGV0aW9uLlxuICAgICAgICBpZiAoZGlmZnNbcG9pbnRlcl1bMF0gPT0gRGlmZk9wLkRlbGV0ZSkge1xuICAgICAgICAgIHBvc3RfZGVsID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwb3N0X2lucyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgLypcbiAgICAgICAgKiBGaXZlIHR5cGVzIHRvIGJlIHNwbGl0OlxuICAgICAgICAqIDxpbnM+QTwvaW5zPjxkZWw+QjwvZGVsPlhZPGlucz5DPC9pbnM+PGRlbD5EPC9kZWw+XG4gICAgICAgICogPGlucz5BPC9pbnM+WDxpbnM+QzwvaW5zPjxkZWw+RDwvZGVsPlxuICAgICAgICAqIDxpbnM+QTwvaW5zPjxkZWw+QjwvZGVsPlg8aW5zPkM8L2lucz5cbiAgICAgICAgKiA8aW5zPkE8L2RlbD5YPGlucz5DPC9pbnM+PGRlbD5EPC9kZWw+XG4gICAgICAgICogPGlucz5BPC9pbnM+PGRlbD5CPC9kZWw+WDxkZWw+QzwvZGVsPlxuICAgICAgICAqL1xuICAgICAgICBpZiAobGFzdGVxdWFsaXR5ICYmICgocHJlX2lucyAmJiBwcmVfZGVsICYmIHBvc3RfaW5zICYmIHBvc3RfZGVsKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICgobGFzdGVxdWFsaXR5Lmxlbmd0aCA8IHRoaXMuRGlmZl9FZGl0Q29zdCAvIDIpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKChwcmVfaW5zPzE6MCkgKyAocHJlX2RlbD8xOjApICsgKHBvc3RfaW5zPzE6MCkgKyAocG9zdF9kZWw/MTowKSA9PSAzKSkpKSB7XG4gICAgICAgICAgLy8gRHVwbGljYXRlIHJlY29yZC5cbiAgICAgICAgICBkaWZmcy5zcGxpY2UoZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoIC0gMV0sIDAsXG4gICAgICAgICAgICAgICAgICAgICAgW0RpZmZPcC5EZWxldGUsIGxhc3RlcXVhbGl0eV0pO1xuICAgICAgICAgIC8vIENoYW5nZSBzZWNvbmQgY29weSB0byBpbnNlcnQuXG4gICAgICAgICAgZGlmZnNbZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoIC0gMV0gKyAxXVswXSA9IERpZmZPcC5JbnNlcnQ7XG4gICAgICAgICAgZXF1YWxpdGllc0xlbmd0aC0tOyAgLy8gVGhyb3cgYXdheSB0aGUgZXF1YWxpdHkgd2UganVzdCBkZWxldGVkO1xuICAgICAgICAgIGxhc3RlcXVhbGl0eSA9IG51bGw7XG4gICAgICAgICAgaWYgKHByZV9pbnMgJiYgcHJlX2RlbCkge1xuICAgICAgICAgICAgLy8gTm8gY2hhbmdlcyBtYWRlIHdoaWNoIGNvdWxkIGFmZmVjdCBwcmV2aW91cyBlbnRyeSwga2VlcCBnb2luZy5cbiAgICAgICAgICAgIHBvc3RfaW5zID0gcG9zdF9kZWwgPSB0cnVlO1xuICAgICAgICAgICAgZXF1YWxpdGllc0xlbmd0aCA9IDA7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVxdWFsaXRpZXNMZW5ndGgtLTsgIC8vIFRocm93IGF3YXkgdGhlIHByZXZpb3VzIGVxdWFsaXR5LlxuICAgICAgICAgICAgcG9pbnRlciA9IGVxdWFsaXRpZXNMZW5ndGggPiAwID9cbiAgICAgICAgICAgICAgICBlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGggLSAxXSA6IC0xO1xuICAgICAgICAgICAgcG9zdF9pbnMgPSBwb3N0X2RlbCA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjaGFuZ2VzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcG9pbnRlcisrO1xuICAgIH1cblxuICAgIGlmIChjaGFuZ2VzKSB7XG4gICAgICB0aGlzLmRpZmZfY2xlYW51cE1lcmdlKGRpZmZzKTtcbiAgICB9XG4gIH07XG5cblxuICAvKipcbiAgICogUmVvcmRlciBhbmQgbWVyZ2UgbGlrZSBlZGl0IHNlY3Rpb25zLiAgTWVyZ2UgZXF1YWxpdGllcy5cbiAgICogQW55IGVkaXQgc2VjdGlvbiBjYW4gbW92ZSBhcyBsb25nIGFzIGl0IGRvZXNuJ3QgY3Jvc3MgYW4gZXF1YWxpdHkuXG4gICAqIEBwYXJhbSAgZGlmZnMgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXG4gICAqL1xuICAgIGRpZmZfY2xlYW51cE1lcmdlIChkaWZmczogQXJyYXk8RGlmZj4pIHtcbiAgICBkaWZmcy5wdXNoKFtEaWZmT3AuRXF1YWwsICcnXSk7ICAvLyBBZGQgYSBkdW1teSBlbnRyeSBhdCB0aGUgZW5kLlxuICAgIGxldCBwb2ludGVyID0gMDtcbiAgICBsZXQgY291bnRfZGVsZXRlID0gMDtcbiAgICBsZXQgY291bnRfaW5zZXJ0ID0gMDtcbiAgICBsZXQgdGV4dF9kZWxldGUgPSAnJztcbiAgICBsZXQgdGV4dF9pbnNlcnQgPSAnJztcbiAgICBsZXQgY29tbW9ubGVuZ3RoO1xuICAgIHdoaWxlIChwb2ludGVyIDwgZGlmZnMubGVuZ3RoKSB7XG4gICAgICBzd2l0Y2ggKGRpZmZzW3BvaW50ZXJdWzBdKSB7XG4gICAgICAgIGNhc2UgRGlmZk9wLkluc2VydDpcbiAgICAgICAgICBjb3VudF9pbnNlcnQrKztcbiAgICAgICAgICB0ZXh0X2luc2VydCArPSBkaWZmc1twb2ludGVyXVsxXTtcbiAgICAgICAgICBwb2ludGVyKys7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgRGlmZk9wLkRlbGV0ZTpcbiAgICAgICAgICBjb3VudF9kZWxldGUrKztcbiAgICAgICAgICB0ZXh0X2RlbGV0ZSArPSBkaWZmc1twb2ludGVyXVsxXTtcbiAgICAgICAgICBwb2ludGVyKys7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgRGlmZk9wLkVxdWFsOlxuICAgICAgICAgIC8vIFVwb24gcmVhY2hpbmcgYW4gZXF1YWxpdHksIGNoZWNrIGZvciBwcmlvciByZWR1bmRhbmNpZXMuXG4gICAgICAgICAgaWYgKGNvdW50X2RlbGV0ZSArIGNvdW50X2luc2VydCA+IDEpIHtcbiAgICAgICAgICAgIGlmIChjb3VudF9kZWxldGUgIT09IDAgJiYgY291bnRfaW5zZXJ0ICE9PSAwKSB7XG4gICAgICAgICAgICAgIC8vIEZhY3RvciBvdXQgYW55IGNvbW1vbiBwcmVmaXhpZXMuXG4gICAgICAgICAgICAgIGNvbW1vbmxlbmd0aCA9IHRoaXMuZGlmZl9jb21tb25QcmVmaXgodGV4dF9pbnNlcnQsIHRleHRfZGVsZXRlKTtcbiAgICAgICAgICAgICAgaWYgKGNvbW1vbmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgIGlmICgocG9pbnRlciAtIGNvdW50X2RlbGV0ZSAtIGNvdW50X2luc2VydCkgPiAwICYmXG4gICAgICAgICAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgLSBjb3VudF9kZWxldGUgLSBjb3VudF9pbnNlcnQgLSAxXVswXSA9PVxuICAgICAgICAgICAgICAgICAgICBEaWZmT3AuRXF1YWwpIHtcbiAgICAgICAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgLSBjb3VudF9kZWxldGUgLSBjb3VudF9pbnNlcnQgLSAxXVsxXSArPVxuICAgICAgICAgICAgICAgICAgICAgIHRleHRfaW5zZXJ0LnN1YnN0cmluZygwLCBjb21tb25sZW5ndGgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBkaWZmcy5zcGxpY2UoMCwgMCwgW0RpZmZPcC5FcXVhbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dF9pbnNlcnQuc3Vic3RyaW5nKDAsIGNvbW1vbmxlbmd0aCldKTtcbiAgICAgICAgICAgICAgICAgIHBvaW50ZXIrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGV4dF9pbnNlcnQgPSB0ZXh0X2luc2VydC5zdWJzdHJpbmcoY29tbW9ubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB0ZXh0X2RlbGV0ZSA9IHRleHRfZGVsZXRlLnN1YnN0cmluZyhjb21tb25sZW5ndGgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIC8vIEZhY3RvciBvdXQgYW55IGNvbW1vbiBzdWZmaXhpZXMuXG4gICAgICAgICAgICAgIGNvbW1vbmxlbmd0aCA9IHRoaXMuZGlmZl9jb21tb25TdWZmaXgodGV4dF9pbnNlcnQsIHRleHRfZGVsZXRlKTtcbiAgICAgICAgICAgICAgaWYgKGNvbW1vbmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgIGRpZmZzW3BvaW50ZXJdWzFdID0gdGV4dF9pbnNlcnQuc3Vic3RyaW5nKHRleHRfaW5zZXJ0Lmxlbmd0aCAtXG4gICAgICAgICAgICAgICAgICAgIGNvbW1vbmxlbmd0aCkgKyBkaWZmc1twb2ludGVyXVsxXTtcbiAgICAgICAgICAgICAgICB0ZXh0X2luc2VydCA9IHRleHRfaW5zZXJ0LnN1YnN0cmluZygwLCB0ZXh0X2luc2VydC5sZW5ndGggLVxuICAgICAgICAgICAgICAgICAgICBjb21tb25sZW5ndGgpO1xuICAgICAgICAgICAgICAgIHRleHRfZGVsZXRlID0gdGV4dF9kZWxldGUuc3Vic3RyaW5nKDAsIHRleHRfZGVsZXRlLmxlbmd0aCAtXG4gICAgICAgICAgICAgICAgICAgIGNvbW1vbmxlbmd0aCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIERlbGV0ZSB0aGUgb2ZmZW5kaW5nIHJlY29yZHMgYW5kIGFkZCB0aGUgbWVyZ2VkIG9uZXMuXG4gICAgICAgICAgICBpZiAoY291bnRfZGVsZXRlID09PSAwKSB7XG4gICAgICAgICAgICAgIGRpZmZzLnNwbGljZShwb2ludGVyIC0gY291bnRfaW5zZXJ0LFxuICAgICAgICAgICAgICAgICAgY291bnRfZGVsZXRlICsgY291bnRfaW5zZXJ0LCBbRGlmZk9wLkluc2VydCwgdGV4dF9pbnNlcnRdKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY291bnRfaW5zZXJ0ID09PSAwKSB7XG4gICAgICAgICAgICAgIGRpZmZzLnNwbGljZShwb2ludGVyIC0gY291bnRfZGVsZXRlLFxuICAgICAgICAgICAgICAgICAgY291bnRfZGVsZXRlICsgY291bnRfaW5zZXJ0LCBbRGlmZk9wLkRlbGV0ZSwgdGV4dF9kZWxldGVdKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGRpZmZzLnNwbGljZShwb2ludGVyIC0gY291bnRfZGVsZXRlIC0gY291bnRfaW5zZXJ0LFxuICAgICAgICAgICAgICAgICAgY291bnRfZGVsZXRlICsgY291bnRfaW5zZXJ0LCBbRGlmZk9wLkRlbGV0ZSwgdGV4dF9kZWxldGVdLFxuICAgICAgICAgICAgICAgICAgW0RpZmZPcC5JbnNlcnQsIHRleHRfaW5zZXJ0XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwb2ludGVyID0gcG9pbnRlciAtIGNvdW50X2RlbGV0ZSAtIGNvdW50X2luc2VydCArXG4gICAgICAgICAgICAgICAgICAgICAgKGNvdW50X2RlbGV0ZSA/IDEgOiAwKSArIChjb3VudF9pbnNlcnQgPyAxIDogMCkgKyAxO1xuICAgICAgICAgIH0gZWxzZSBpZiAocG9pbnRlciAhPT0gMCAmJiBkaWZmc1twb2ludGVyIC0gMV1bMF0gPT0gRGlmZk9wLkVxdWFsKSB7XG4gICAgICAgICAgICAvLyBNZXJnZSB0aGlzIGVxdWFsaXR5IHdpdGggdGhlIHByZXZpb3VzIG9uZS5cbiAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgLSAxXVsxXSArPSBkaWZmc1twb2ludGVyXVsxXTtcbiAgICAgICAgICAgIGRpZmZzLnNwbGljZShwb2ludGVyLCAxKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcG9pbnRlcisrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb3VudF9pbnNlcnQgPSAwO1xuICAgICAgICAgIGNvdW50X2RlbGV0ZSA9IDA7XG4gICAgICAgICAgdGV4dF9kZWxldGUgPSAnJztcbiAgICAgICAgICB0ZXh0X2luc2VydCA9ICcnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoZGlmZnNbZGlmZnMubGVuZ3RoIC0gMV1bMV0gPT09ICcnKSB7XG4gICAgICBkaWZmcy5wb3AoKTsgIC8vIFJlbW92ZSB0aGUgZHVtbXkgZW50cnkgYXQgdGhlIGVuZC5cbiAgICB9XG5cbiAgICAvLyBTZWNvbmQgcGFzczogbG9vayBmb3Igc2luZ2xlIGVkaXRzIHN1cnJvdW5kZWQgb24gYm90aCBzaWRlcyBieSBlcXVhbGl0aWVzXG4gICAgLy8gd2hpY2ggY2FuIGJlIHNoaWZ0ZWQgc2lkZXdheXMgdG8gZWxpbWluYXRlIGFuIGVxdWFsaXR5LlxuICAgIC8vIGUuZzogQTxpbnM+QkE8L2lucz5DIC0+IDxpbnM+QUI8L2lucz5BQ1xuICAgIGxldCBjaGFuZ2VzID0gZmFsc2U7XG4gICAgcG9pbnRlciA9IDE7XG4gICAgLy8gSW50ZW50aW9uYWxseSBpZ25vcmUgdGhlIGZpcnN0IGFuZCBsYXN0IGVsZW1lbnQgKGRvbid0IG5lZWQgY2hlY2tpbmcpLlxuICAgIHdoaWxlIChwb2ludGVyIDwgZGlmZnMubGVuZ3RoIC0gMSkge1xuICAgICAgaWYgKGRpZmZzW3BvaW50ZXIgLSAxXVswXSA9PSBEaWZmT3AuRXF1YWwgJiZcbiAgICAgICAgICBkaWZmc1twb2ludGVyICsgMV1bMF0gPT0gRGlmZk9wLkVxdWFsKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBzaW5nbGUgZWRpdCBzdXJyb3VuZGVkIGJ5IGVxdWFsaXRpZXMuXG4gICAgICAgIGlmIChkaWZmc1twb2ludGVyXVsxXS5zdWJzdHJpbmcoZGlmZnNbcG9pbnRlcl1bMV0ubGVuZ3RoIC1cbiAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgLSAxXVsxXS5sZW5ndGgpID09IGRpZmZzW3BvaW50ZXIgLSAxXVsxXSkge1xuICAgICAgICAgIC8vIFNoaWZ0IHRoZSBlZGl0IG92ZXIgdGhlIHByZXZpb3VzIGVxdWFsaXR5LlxuICAgICAgICAgIGRpZmZzW3BvaW50ZXJdWzFdID0gZGlmZnNbcG9pbnRlciAtIDFdWzFdICtcbiAgICAgICAgICAgICAgZGlmZnNbcG9pbnRlcl1bMV0uc3Vic3RyaW5nKDAsIGRpZmZzW3BvaW50ZXJdWzFdLmxlbmd0aCAtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmc1twb2ludGVyIC0gMV1bMV0ubGVuZ3RoKTtcbiAgICAgICAgICBkaWZmc1twb2ludGVyICsgMV1bMV0gPSBkaWZmc1twb2ludGVyIC0gMV1bMV0gKyBkaWZmc1twb2ludGVyICsgMV1bMV07XG4gICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIgLSAxLCAxKTtcbiAgICAgICAgICBjaGFuZ2VzID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChkaWZmc1twb2ludGVyXVsxXS5zdWJzdHJpbmcoMCwgZGlmZnNbcG9pbnRlciArIDFdWzFdLmxlbmd0aCkgPT1cbiAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgKyAxXVsxXSkge1xuICAgICAgICAgIC8vIFNoaWZ0IHRoZSBlZGl0IG92ZXIgdGhlIG5leHQgZXF1YWxpdHkuXG4gICAgICAgICAgZGlmZnNbcG9pbnRlciAtIDFdWzFdICs9IGRpZmZzW3BvaW50ZXIgKyAxXVsxXTtcbiAgICAgICAgICBkaWZmc1twb2ludGVyXVsxXSA9XG4gICAgICAgICAgICAgIGRpZmZzW3BvaW50ZXJdWzFdLnN1YnN0cmluZyhkaWZmc1twb2ludGVyICsgMV1bMV0ubGVuZ3RoKSArXG4gICAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgKyAxXVsxXTtcbiAgICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciArIDEsIDEpO1xuICAgICAgICAgIGNoYW5nZXMgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwb2ludGVyKys7XG4gICAgfVxuICAgIC8vIElmIHNoaWZ0cyB3ZXJlIG1hZGUsIHRoZSBkaWZmIG5lZWRzIHJlb3JkZXJpbmcgYW5kIGFub3RoZXIgc2hpZnQgc3dlZXAuXG4gICAgaWYgKGNoYW5nZXMpIHtcbiAgICAgIHRoaXMuZGlmZl9jbGVhbnVwTWVyZ2UoZGlmZnMpO1xuICAgIH1cbiAgfTtcblxuXG4gIC8qKlxuICAgKiBsb2MgaXMgYSBsb2NhdGlvbiBpbiB0ZXh0MSwgY29tcHV0ZSBhbmQgcmV0dXJuIHRoZSBlcXVpdmFsZW50IGxvY2F0aW9uIGluXG4gICAqIHRleHQyLlxuICAgKiBlLmcuICdUaGUgY2F0JyB2cyAnVGhlIGJpZyBjYXQnLCAxLT4xLCA1LT44XG4gICAqIEBwYXJhbSAgZGlmZnMgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXG4gICAqIEBwYXJhbSAgbG9jIExvY2F0aW9uIHdpdGhpbiB0ZXh0MS5cbiAgICogQHJldHVybiAgTG9jYXRpb24gd2l0aGluIHRleHQyLlxuICAgKi9cbiAgICBkaWZmX3hJbmRleCAoZGlmZnM6IEFycmF5PERpZmY+LCBsb2M6IG51bWJlcik6IG51bWJlciB7XG4gICAgbGV0IGNoYXJzMSA9IDA7XG4gICAgbGV0IGNoYXJzMiA9IDA7XG4gICAgbGV0IGxhc3RfY2hhcnMxID0gMDtcbiAgICBsZXQgbGFzdF9jaGFyczIgPSAwO1xuICAgIGxldCB4O1xuICAgIGZvciAoeCA9IDA7IHggPCBkaWZmcy5sZW5ndGg7IHgrKykge1xuICAgICAgaWYgKGRpZmZzW3hdWzBdICE9PSBEaWZmT3AuSW5zZXJ0KSB7ICAvLyBFcXVhbGl0eSBvciBkZWxldGlvbi5cbiAgICAgICAgY2hhcnMxICs9IGRpZmZzW3hdWzFdLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGlmIChkaWZmc1t4XVswXSAhPT0gRGlmZk9wLkRlbGV0ZSkgeyAgLy8gRXF1YWxpdHkgb3IgaW5zZXJ0aW9uLlxuICAgICAgICBjaGFyczIgKz0gZGlmZnNbeF1bMV0ubGVuZ3RoO1xuICAgICAgfVxuICAgICAgaWYgKGNoYXJzMSA+IGxvYykgeyAgLy8gT3ZlcnNob3QgdGhlIGxvY2F0aW9uLlxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGxhc3RfY2hhcnMxID0gY2hhcnMxO1xuICAgICAgbGFzdF9jaGFyczIgPSBjaGFyczI7XG4gICAgfVxuICAgIC8vIFdhcyB0aGUgbG9jYXRpb24gd2FzIGRlbGV0ZWQ/XG4gICAgaWYgKGRpZmZzLmxlbmd0aCAhPSB4ICYmIGRpZmZzW3hdWzBdID09PSBEaWZmT3AuRGVsZXRlKSB7XG4gICAgICByZXR1cm4gbGFzdF9jaGFyczI7XG4gICAgfVxuICAgIC8vIEFkZCB0aGUgcmVtYWluaW5nIGNoYXJhY3RlciBsZW5ndGguXG4gICAgcmV0dXJuIGxhc3RfY2hhcnMyICsgKGxvYyAtIGxhc3RfY2hhcnMxKTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBDb252ZXJ0IGEgZGlmZiBhcnJheSBpbnRvIGEgcHJldHR5IEhUTUwgcmVwb3J0LlxuICAgKiBAcGFyYW0gIGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuICAgKiBAcmV0dXJuICBIVE1MIHJlcHJlc2VudGF0aW9uLlxuICAgKi9cbiAgICBkaWZmX3ByZXR0eUh0bWwgPSBmdW5jdGlvbihkaWZmczogQXJyYXk8RGlmZj4pOiBzdHJpbmcge1xuICAgIGNvbnN0IGh0bWwgPSBbXTtcbiAgICBjb25zdCBwYXR0ZXJuX2FtcCA9IC8mL2c7XG4gICAgY29uc3QgcGF0dGVybl9sdCA9IC88L2c7XG4gICAgY29uc3QgcGF0dGVybl9ndCA9IC8+L2c7XG4gICAgY29uc3QgcGF0dGVybl9wYXJhID0gL1xcbi9nO1xuICAgIGZvciAobGV0IHggPSAwOyB4IDwgZGlmZnMubGVuZ3RoOyB4KyspIHtcbiAgICAgIGNvbnN0IG9wID0gZGlmZnNbeF1bMF07ICAgIC8vIE9wZXJhdGlvbiAoaW5zZXJ0LCBkZWxldGUsIGVxdWFsKVxuICAgICAgY29uc3QgZGF0YSA9IGRpZmZzW3hdWzFdOyAgLy8gVGV4dCBvZiBjaGFuZ2UuXG4gICAgICBjb25zdCB0ZXh0ID0gZGF0YS5yZXBsYWNlKHBhdHRlcm5fYW1wLCAnJmFtcDsnKS5yZXBsYWNlKHBhdHRlcm5fbHQsICcmbHQ7JylcbiAgICAgICAgICAucmVwbGFjZShwYXR0ZXJuX2d0LCAnJmd0OycpLnJlcGxhY2UocGF0dGVybl9wYXJhLCAnJnBhcmE7PGJyPicpO1xuICAgICAgc3dpdGNoIChvcCkge1xuICAgICAgICBjYXNlIERpZmZPcC5JbnNlcnQ6XG4gICAgICAgICAgaHRtbFt4XSA9ICc8aW5zIHN0eWxlPVwiYmFja2dyb3VuZDojZTZmZmU2O1wiPicgKyB0ZXh0ICsgJzwvaW5zPic7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgRGlmZk9wLkRlbGV0ZTpcbiAgICAgICAgICBodG1sW3hdID0gJzxkZWwgc3R5bGU9XCJiYWNrZ3JvdW5kOiNmZmU2ZTY7XCI+JyArIHRleHQgKyAnPC9kZWw+JztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBEaWZmT3AuRXF1YWw6XG4gICAgICAgICAgaHRtbFt4XSA9ICc8c3Bhbj4nICsgdGV4dCArICc8L3NwYW4+JztcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGh0bWwuam9pbignJyk7XG4gIH07XG5cblxuICAvKipcbiAgICogQ29tcHV0ZSBhbmQgcmV0dXJuIHRoZSBzb3VyY2UgdGV4dCAoYWxsIGVxdWFsaXRpZXMgYW5kIGRlbGV0aW9ucykuXG4gICAqIEBwYXJhbSAgZGlmZnMgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXG4gICAqIEByZXR1cm4gIFNvdXJjZSB0ZXh0LlxuICAgKi9cbiAgICBkaWZmX3RleHQxIChkaWZmczogQXJyYXk8RGlmZj4pOiBzdHJpbmcge1xuICAgIGNvbnN0IHRleHQgPSBbXTtcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGRpZmZzLmxlbmd0aDsgeCsrKSB7XG4gICAgICBpZiAoZGlmZnNbeF1bMF0gIT09IERpZmZPcC5JbnNlcnQpIHtcbiAgICAgICAgdGV4dFt4XSA9IGRpZmZzW3hdWzFdO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGV4dC5qb2luKCcnKTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBDb21wdXRlIGFuZCByZXR1cm4gdGhlIGRlc3RpbmF0aW9uIHRleHQgKGFsbCBlcXVhbGl0aWVzIGFuZCBpbnNlcnRpb25zKS5cbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cbiAgICogQHJldHVybiAgRGVzdGluYXRpb24gdGV4dC5cbiAgICovXG4gICAgZGlmZl90ZXh0MiAoZGlmZnM6IEFycmF5PERpZmY+KTogc3RyaW5nIHtcbiAgICBjb25zdCB0ZXh0ID0gW107XG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBkaWZmcy5sZW5ndGg7IHgrKykge1xuICAgICAgaWYgKGRpZmZzW3hdWzBdICE9PSBEaWZmT3AuRGVsZXRlKSB7XG4gICAgICAgIHRleHRbeF0gPSBkaWZmc1t4XVsxXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRleHQuam9pbignJyk7XG4gIH07XG5cblxuICAvKipcbiAgICogQ29tcHV0ZSB0aGUgTGV2ZW5zaHRlaW4gZGlzdGFuY2U7IHRoZSBudW1iZXIgb2YgaW5zZXJ0ZWQsIGRlbGV0ZWQgb3JcbiAgICogc3Vic3RpdHV0ZWQgY2hhcmFjdGVycy5cbiAgICogQHBhcmFtICBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cbiAgICogQHJldHVybiAgTnVtYmVyIG9mIGNoYW5nZXMuXG4gICAqL1xuICAgIGRpZmZfbGV2ZW5zaHRlaW4gKGRpZmZzOiBBcnJheTxEaWZmPik6IG51bWJlciB7XG4gICAgbGV0IGxldmVuc2h0ZWluID0gMDtcbiAgICBsZXQgaW5zZXJ0aW9ucyA9IDA7XG4gICAgbGV0IGRlbGV0aW9ucyA9IDA7XG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBkaWZmcy5sZW5ndGg7IHgrKykge1xuICAgICAgY29uc3Qgb3AgPSBkaWZmc1t4XVswXTtcbiAgICAgIGNvbnN0IGRhdGEgPSBkaWZmc1t4XVsxXTtcbiAgICAgIHN3aXRjaCAob3ApIHtcbiAgICAgICAgY2FzZSBEaWZmT3AuSW5zZXJ0OlxuICAgICAgICAgIGluc2VydGlvbnMgKz0gZGF0YS5sZW5ndGg7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgRGlmZk9wLkRlbGV0ZTpcbiAgICAgICAgICBkZWxldGlvbnMgKz0gZGF0YS5sZW5ndGg7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgRGlmZk9wLkVxdWFsOlxuICAgICAgICAgIC8vIEEgZGVsZXRpb24gYW5kIGFuIGluc2VydGlvbiBpcyBvbmUgc3Vic3RpdHV0aW9uLlxuICAgICAgICAgIGxldmVuc2h0ZWluICs9IE1hdGgubWF4KGluc2VydGlvbnMsIGRlbGV0aW9ucyk7XG4gICAgICAgICAgaW5zZXJ0aW9ucyA9IDA7XG4gICAgICAgICAgZGVsZXRpb25zID0gMDtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgbGV2ZW5zaHRlaW4gKz0gTWF0aC5tYXgoaW5zZXJ0aW9ucywgZGVsZXRpb25zKTtcbiAgICByZXR1cm4gbGV2ZW5zaHRlaW47XG4gIH07XG5cblxuICAvKipcbiAgICogQ3J1c2ggdGhlIGRpZmYgaW50byBhbiBlbmNvZGVkIHN0cmluZyB3aGljaCBkZXNjcmliZXMgdGhlIG9wZXJhdGlvbnNcbiAgICogcmVxdWlyZWQgdG8gdHJhbnNmb3JtIHRleHQxIGludG8gdGV4dDIuXG4gICAqIEUuZy4gPTNcXHQtMlxcdCtpbmcgIC0+IEtlZXAgMyBjaGFycywgZGVsZXRlIDIgY2hhcnMsIGluc2VydCAnaW5nJy5cbiAgICogT3BlcmF0aW9ucyBhcmUgdGFiLXNlcGFyYXRlZC4gIEluc2VydGVkIHRleHQgaXMgZXNjYXBlZCB1c2luZyAleHggbm90YXRpb24uXG4gICAqIEBwYXJhbSAgZGlmZnMgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXG4gICAqIEByZXR1cm4gIERlbHRhIHRleHQuXG4gICAqL1xuICAgIGRpZmZfdG9EZWx0YSAoZGlmZnM6IEFycmF5PERpZmY+KTogc3RyaW5nIHtcbiAgICBjb25zdCB0ZXh0ID0gW107XG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBkaWZmcy5sZW5ndGg7IHgrKykge1xuICAgICAgc3dpdGNoIChkaWZmc1t4XVswXSkge1xuICAgICAgICBjYXNlIERpZmZPcC5JbnNlcnQ6XG4gICAgICAgICAgdGV4dFt4XSA9ICcrJyArIGVuY29kZVVSSShkaWZmc1t4XVsxXSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgRGlmZk9wLkRlbGV0ZTpcbiAgICAgICAgICB0ZXh0W3hdID0gJy0nICsgZGlmZnNbeF1bMV0ubGVuZ3RoO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIERpZmZPcC5FcXVhbDpcbiAgICAgICAgICB0ZXh0W3hdID0gJz0nICsgZGlmZnNbeF1bMV0ubGVuZ3RoO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGV4dC5qb2luKCdcXHQnKS5yZXBsYWNlKC8lMjAvZywgJyAnKTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBHaXZlbiB0aGUgb3JpZ2luYWwgdGV4dDEsIGFuZCBhbiBlbmNvZGVkIHN0cmluZyB3aGljaCBkZXNjcmliZXMgdGhlXG4gICAqIG9wZXJhdGlvbnMgcmVxdWlyZWQgdG8gdHJhbnNmb3JtIHRleHQxIGludG8gdGV4dDIsIGNvbXB1dGUgdGhlIGZ1bGwgZGlmZi5cbiAgICogQHBhcmFtICB0ZXh0MSBTb3VyY2Ugc3RyaW5nIGZvciB0aGUgZGlmZi5cbiAgICogQHBhcmFtICBkZWx0YSBEZWx0YSB0ZXh0LlxuICAgKiBAcmV0dXJuICBBcnJheSBvZiBkaWZmIHR1cGxlcy5cbiAgICogQHRocm93cyB7IUVycm9yfSBJZiBpbnZhbGlkIGlucHV0LlxuICAgKi9cbiAgICBkaWZmX2Zyb21EZWx0YSAodGV4dDE6IHN0cmluZywgZGVsdGE6IHN0cmluZykge1xuICAgIGNvbnN0IGRpZmZzID0gW107XG4gICAgbGV0IGRpZmZzTGVuZ3RoID0gMDsgIC8vIEtlZXBpbmcgb3VyIG93biBsZW5ndGggY29uc3QgaXMgZmFzdGVyIGluIEpTLlxuICAgIGxldCBwb2ludGVyID0gMDsgIC8vIEN1cnNvciBpbiB0ZXh0MVxuICAgIGNvbnN0IHRva2VucyA9IGRlbHRhLnNwbGl0KC9cXHQvZyk7XG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCB0b2tlbnMubGVuZ3RoOyB4KyspIHtcbiAgICAgIC8vIEVhY2ggdG9rZW4gYmVnaW5zIHdpdGggYSBvbmUgY2hhcmFjdGVyIHBhcmFtZXRlciB3aGljaCBzcGVjaWZpZXMgdGhlXG4gICAgICAvLyBvcGVyYXRpb24gb2YgdGhpcyB0b2tlbiAoZGVsZXRlLCBpbnNlcnQsIGVxdWFsaXR5KS5cbiAgICAgIGNvbnN0IHBhcmFtID0gdG9rZW5zW3hdLnN1YnN0cmluZygxKTtcbiAgICAgIHN3aXRjaCAodG9rZW5zW3hdLmNoYXJBdCgwKSkge1xuICAgICAgICBjYXNlICcrJzpcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgZGlmZnNbZGlmZnNMZW5ndGgrK10gPSBbRGlmZk9wLkluc2VydCwgZGVjb2RlVVJJKHBhcmFtKV07XG4gICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgIC8vIE1hbGZvcm1lZCBVUkkgc2VxdWVuY2UuXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lsbGVnYWwgZXNjYXBlIGluIGRpZmZfZnJvbURlbHRhOiAnICsgcGFyYW0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnLSc6XG4gICAgICAgICAgLy8gRmFsbCB0aHJvdWdoLlxuICAgICAgICBjYXNlICc9JzpcbiAgICAgICAgICBjb25zdCBuID0gcGFyc2VJbnQocGFyYW0sIDEwKTtcbiAgICAgICAgICBpZiAoaXNOYU4obikgfHwgbiA8IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBudW1iZXIgaW4gZGlmZl9mcm9tRGVsdGE6ICcgKyBwYXJhbSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHRleHQgPSB0ZXh0MS5zdWJzdHJpbmcocG9pbnRlciwgcG9pbnRlciArPSBuKTtcbiAgICAgICAgICBpZiAodG9rZW5zW3hdLmNoYXJBdCgwKSA9PSAnPScpIHtcbiAgICAgICAgICAgIGRpZmZzW2RpZmZzTGVuZ3RoKytdID0gW0RpZmZPcC5FcXVhbCwgdGV4dF07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRpZmZzW2RpZmZzTGVuZ3RoKytdID0gW0RpZmZPcC5EZWxldGUsIHRleHRdO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAvLyBCbGFuayB0b2tlbnMgYXJlIG9rIChmcm9tIGEgdHJhaWxpbmcgXFx0KS5cbiAgICAgICAgICAvLyBBbnl0aGluZyBlbHNlIGlzIGFuIGVycm9yLlxuICAgICAgICAgIGlmICh0b2tlbnNbeF0pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBkaWZmIG9wZXJhdGlvbiBpbiBkaWZmX2Zyb21EZWx0YTogJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zW3hdKTtcbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChwb2ludGVyICE9IHRleHQxLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdEZWx0YSBsZW5ndGggKCcgKyBwb2ludGVyICtcbiAgICAgICAgICAnKSBkb2VzIG5vdCBlcXVhbCBzb3VyY2UgdGV4dCBsZW5ndGggKCcgKyB0ZXh0MS5sZW5ndGggKyAnKS4nKTtcbiAgICB9XG4gICAgcmV0dXJuIGRpZmZzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBMb2NhdGUgdGhlIGJlc3QgaW5zdGFuY2Ugb2YgJ3BhdHRlcm4nIGluICd0ZXh0JyBuZWFyICdsb2MnLlxuICAgKiBAcGFyYW0gIHRleHQgVGhlIHRleHQgdG8gc2VhcmNoLlxuICAgKiBAcGFyYW0gIHBhdHRlcm4gVGhlIHBhdHRlcm4gdG8gc2VhcmNoIGZvci5cbiAgICogQHBhcmFtICBsb2MgVGhlIGxvY2F0aW9uIHRvIHNlYXJjaCBhcm91bmQuXG4gICAqIEByZXR1cm4gIEJlc3QgbWF0Y2ggaW5kZXggb3IgLTEuXG4gICAqL1xuICAgIG1hdGNoX21haW4gKHRleHQ6IHN0cmluZywgcGF0dGVybjogc3RyaW5nLCBsb2M6IG51bWJlcik6IG51bWJlciB7XG4gICAgLy8gQ2hlY2sgZm9yIG51bGwgaW5wdXRzLlxuICAgIGlmICh0ZXh0ID09IG51bGwgfHwgcGF0dGVybiA9PSBudWxsIHx8IGxvYyA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ051bGwgaW5wdXQuIChtYXRjaF9tYWluKScpO1xuICAgIH1cblxuICAgIGxvYyA9IE1hdGgubWF4KDAsIE1hdGgubWluKGxvYywgdGV4dC5sZW5ndGgpKTtcbiAgICBpZiAodGV4dCA9PSBwYXR0ZXJuKSB7XG4gICAgICAvLyBTaG9ydGN1dCAocG90ZW50aWFsbHkgbm90IGd1YXJhbnRlZWQgYnkgdGhlIGFsZ29yaXRobSlcbiAgICAgIHJldHVybiAwO1xuICAgIH0gZWxzZSBpZiAoIXRleHQubGVuZ3RoKSB7XG4gICAgICAvLyBOb3RoaW5nIHRvIG1hdGNoLlxuICAgICAgcmV0dXJuIC0xO1xuICAgIH0gZWxzZSBpZiAodGV4dC5zdWJzdHJpbmcobG9jLCBsb2MgKyBwYXR0ZXJuLmxlbmd0aCkgPT0gcGF0dGVybikge1xuICAgICAgLy8gUGVyZmVjdCBtYXRjaCBhdCB0aGUgcGVyZmVjdCBzcG90ISAgKEluY2x1ZGVzIGNhc2Ugb2YgbnVsbCBwYXR0ZXJuKVxuICAgICAgcmV0dXJuIGxvYztcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRG8gYSBmdXp6eSBjb21wYXJlLlxuICAgICAgcmV0dXJuIHRoaXMubWF0Y2hfYml0YXBfKHRleHQsIHBhdHRlcm4sIGxvYyk7XG4gICAgfVxuICB9O1xuXG5cbiAgLyoqXG4gICAqIExvY2F0ZSB0aGUgYmVzdCBpbnN0YW5jZSBvZiAncGF0dGVybicgaW4gJ3RleHQnIG5lYXIgJ2xvYycgdXNpbmcgdGhlXG4gICAqIEJpdGFwIGFsZ29yaXRobS5cbiAgICogQHBhcmFtICB0ZXh0IFRoZSB0ZXh0IHRvIHNlYXJjaC5cbiAgICogQHBhcmFtICBwYXR0ZXJuIFRoZSBwYXR0ZXJuIHRvIHNlYXJjaCBmb3IuXG4gICAqIEBwYXJhbSAgbG9jIFRoZSBsb2NhdGlvbiB0byBzZWFyY2ggYXJvdW5kLlxuICAgKiBAcmV0dXJuICBCZXN0IG1hdGNoIGluZGV4IG9yIC0xLlxuXG4gICAqL1xuICAgIG1hdGNoX2JpdGFwXyAodGV4dDogc3RyaW5nLCBwYXR0ZXJuOiBzdHJpbmcsIGxvYzogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBpZiAocGF0dGVybi5sZW5ndGggPiB0aGlzLk1hdGNoX01heEJpdHMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUGF0dGVybiB0b28gbG9uZyBmb3IgdGhpcyBicm93c2VyLicpO1xuICAgIH1cblxuICAgIC8vIEluaXRpYWxpc2UgdGhlIGFscGhhYmV0LlxuICAgIGNvbnN0IHMgPSB0aGlzLm1hdGNoX2FscGhhYmV0XyhwYXR0ZXJuKTtcblxuICAgIGNvbnN0IGRtcCA9IHRoaXM7ICAvLyAndGhpcycgYmVjb21lcyAnd2luZG93JyBpbiBhIGNsb3N1cmUuXG5cbiAgICAvKipcbiAgICAgKiBDb21wdXRlIGFuZCByZXR1cm4gdGhlIHNjb3JlIGZvciBhIG1hdGNoIHdpdGggZSBlcnJvcnMgYW5kIHggbG9jYXRpb24uXG4gICAgICogQWNjZXNzZXMgbG9jIGFuZCBwYXR0ZXJuIHRocm91Z2ggYmVpbmcgYSBjbG9zdXJlLlxuICAgICAqIEBwYXJhbSAgZSBOdW1iZXIgb2YgZXJyb3JzIGluIG1hdGNoLlxuICAgICAqIEBwYXJhbSAgeCBMb2NhdGlvbiBvZiBtYXRjaC5cbiAgICAgKiBAcmV0dXJuICBPdmVyYWxsIHNjb3JlIGZvciBtYXRjaCAoMC4wID0gZ29vZCwgMS4wID0gYmFkKS5cblxuICAgICAqL1xuICAgIGZ1bmN0aW9uIG1hdGNoX2JpdGFwU2NvcmVfKGU6IG51bWJlciwgeDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICAgIGNvbnN0IGFjY3VyYWN5ID0gZSAvIHBhdHRlcm4ubGVuZ3RoO1xuICAgICAgY29uc3QgcHJveGltaXR5ID0gTWF0aC5hYnMobG9jIC0geCk7XG4gICAgICBpZiAoIWRtcC5NYXRjaF9EaXN0YW5jZSkge1xuICAgICAgICAvLyBEb2RnZSBkaXZpZGUgYnkgemVybyBlcnJvci5cbiAgICAgICAgcmV0dXJuIHByb3hpbWl0eSA/IDEuMCA6IGFjY3VyYWN5O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFjY3VyYWN5ICsgKHByb3hpbWl0eSAvIGRtcC5NYXRjaF9EaXN0YW5jZSk7XG4gICAgfVxuXG4gICAgLy8gSGlnaGVzdCBzY29yZSBiZXlvbmQgd2hpY2ggd2UgZ2l2ZSB1cC5cbiAgICBsZXQgc2NvcmVfdGhyZXNob2xkID0gdGhpcy5NYXRjaF9UaHJlc2hvbGQ7XG4gICAgLy8gSXMgdGhlcmUgYSBuZWFyYnkgZXhhY3QgbWF0Y2g/IChzcGVlZHVwKVxuICAgIGxldCBiZXN0X2xvYyA9IHRleHQuaW5kZXhPZihwYXR0ZXJuLCBsb2MpO1xuICAgIGlmIChiZXN0X2xvYyAhPSAtMSkge1xuICAgICAgc2NvcmVfdGhyZXNob2xkID0gTWF0aC5taW4obWF0Y2hfYml0YXBTY29yZV8oMCwgYmVzdF9sb2MpLCBzY29yZV90aHJlc2hvbGQpO1xuICAgICAgLy8gV2hhdCBhYm91dCBpbiB0aGUgb3RoZXIgZGlyZWN0aW9uPyAoc3BlZWR1cClcbiAgICAgIGJlc3RfbG9jID0gdGV4dC5sYXN0SW5kZXhPZihwYXR0ZXJuLCBsb2MgKyBwYXR0ZXJuLmxlbmd0aCk7XG4gICAgICBpZiAoYmVzdF9sb2MgIT0gLTEpIHtcbiAgICAgICAgc2NvcmVfdGhyZXNob2xkID1cbiAgICAgICAgICAgIE1hdGgubWluKG1hdGNoX2JpdGFwU2NvcmVfKDAsIGJlc3RfbG9jKSwgc2NvcmVfdGhyZXNob2xkKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJbml0aWFsaXNlIHRoZSBiaXQgYXJyYXlzLlxuICAgIGNvbnN0IG1hdGNobWFzayA9IDEgPDwgKHBhdHRlcm4ubGVuZ3RoIC0gMSk7XG4gICAgYmVzdF9sb2MgPSAtMTtcblxuICAgIGxldCBiaW5fbWluLCBiaW5fbWlkO1xuICAgIGxldCBiaW5fbWF4ID0gcGF0dGVybi5sZW5ndGggKyB0ZXh0Lmxlbmd0aDtcbiAgICBsZXQgbGFzdF9yZDtcbiAgICBmb3IgKGxldCBkID0gMDsgZCA8IHBhdHRlcm4ubGVuZ3RoOyBkKyspIHtcbiAgICAgIC8vIFNjYW4gZm9yIHRoZSBiZXN0IG1hdGNoOyBlYWNoIGl0ZXJhdGlvbiBhbGxvd3MgZm9yIG9uZSBtb3JlIGVycm9yLlxuICAgICAgLy8gUnVuIGEgYmluYXJ5IHNlYXJjaCB0byBkZXRlcm1pbmUgaG93IGZhciBmcm9tICdsb2MnIHdlIGNhbiBzdHJheSBhdCB0aGlzXG4gICAgICAvLyBlcnJvciBsZXZlbC5cbiAgICAgIGJpbl9taW4gPSAwO1xuICAgICAgYmluX21pZCA9IGJpbl9tYXg7XG4gICAgICB3aGlsZSAoYmluX21pbiA8IGJpbl9taWQpIHtcbiAgICAgICAgaWYgKG1hdGNoX2JpdGFwU2NvcmVfKGQsIGxvYyArIGJpbl9taWQpIDw9IHNjb3JlX3RocmVzaG9sZCkge1xuICAgICAgICAgIGJpbl9taW4gPSBiaW5fbWlkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJpbl9tYXggPSBiaW5fbWlkO1xuICAgICAgICB9XG4gICAgICAgIGJpbl9taWQgPSBNYXRoLmZsb29yKChiaW5fbWF4IC0gYmluX21pbikgLyAyICsgYmluX21pbik7XG4gICAgICB9XG4gICAgICAvLyBVc2UgdGhlIHJlc3VsdCBmcm9tIHRoaXMgaXRlcmF0aW9uIGFzIHRoZSBtYXhpbXVtIGZvciB0aGUgbmV4dC5cbiAgICAgIGJpbl9tYXggPSBiaW5fbWlkO1xuICAgICAgbGV0IHN0YXJ0ID0gTWF0aC5tYXgoMSwgbG9jIC0gYmluX21pZCArIDEpO1xuICAgICAgY29uc3QgZmluaXNoID0gTWF0aC5taW4obG9jICsgYmluX21pZCwgdGV4dC5sZW5ndGgpICsgcGF0dGVybi5sZW5ndGg7XG5cbiAgICAgIGNvbnN0IHJkID0gQXJyYXkoZmluaXNoICsgMik7XG4gICAgICByZFtmaW5pc2ggKyAxXSA9ICgxIDw8IGQpIC0gMTtcbiAgICAgIGZvciAobGV0IGogPSBmaW5pc2g7IGogPj0gc3RhcnQ7IGotLSkge1xuICAgICAgICAvLyBUaGUgYWxwaGFiZXQgKHMpIGlzIGEgc3BhcnNlIGhhc2gsIHNvIHRoZSBmb2xsb3dpbmcgbGluZSBnZW5lcmF0ZXNcbiAgICAgICAgLy8gd2FybmluZ3MuXG4gICAgICAgIGNvbnN0IGNoYXJNYXRjaCA9IHNbdGV4dC5jaGFyQXQoaiAtIDEpXTtcbiAgICAgICAgaWYgKGQgPT09IDApIHsgIC8vIEZpcnN0IHBhc3M6IGV4YWN0IG1hdGNoLlxuICAgICAgICAgIHJkW2pdID0gKChyZFtqICsgMV0gPDwgMSkgfCAxKSAmIGNoYXJNYXRjaDtcbiAgICAgICAgfSBlbHNlIHsgIC8vIFN1YnNlcXVlbnQgcGFzc2VzOiBmdXp6eSBtYXRjaC5cbiAgICAgICAgICByZFtqXSA9ICgoKHJkW2ogKyAxXSA8PCAxKSB8IDEpICYgY2hhck1hdGNoKSB8XG4gICAgICAgICAgICAgICAgICAoKChsYXN0X3JkW2ogKyAxXSB8IGxhc3RfcmRbal0pIDw8IDEpIHwgMSkgfFxuICAgICAgICAgICAgICAgICAgbGFzdF9yZFtqICsgMV07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJkW2pdICYgbWF0Y2htYXNrKSB7XG4gICAgICAgICAgY29uc3Qgc2NvcmUgPSBtYXRjaF9iaXRhcFNjb3JlXyhkLCBqIC0gMSk7XG4gICAgICAgICAgLy8gVGhpcyBtYXRjaCB3aWxsIGFsbW9zdCBjZXJ0YWlubHkgYmUgYmV0dGVyIHRoYW4gYW55IGV4aXN0aW5nIG1hdGNoLlxuICAgICAgICAgIC8vIEJ1dCBjaGVjayBhbnl3YXkuXG4gICAgICAgICAgaWYgKHNjb3JlIDw9IHNjb3JlX3RocmVzaG9sZCkge1xuICAgICAgICAgICAgLy8gVG9sZCB5b3Ugc28uXG4gICAgICAgICAgICBzY29yZV90aHJlc2hvbGQgPSBzY29yZTtcbiAgICAgICAgICAgIGJlc3RfbG9jID0gaiAtIDE7XG4gICAgICAgICAgICBpZiAoYmVzdF9sb2MgPiBsb2MpIHtcbiAgICAgICAgICAgICAgLy8gV2hlbiBwYXNzaW5nIGxvYywgZG9uJ3QgZXhjZWVkIG91ciBjdXJyZW50IGRpc3RhbmNlIGZyb20gbG9jLlxuICAgICAgICAgICAgICBzdGFydCA9IE1hdGgubWF4KDEsIDIgKiBsb2MgLSBiZXN0X2xvYyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBBbHJlYWR5IHBhc3NlZCBsb2MsIGRvd25oaWxsIGZyb20gaGVyZSBvbiBpbi5cbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBObyBob3BlIGZvciBhIChiZXR0ZXIpIG1hdGNoIGF0IGdyZWF0ZXIgZXJyb3IgbGV2ZWxzLlxuICAgICAgaWYgKG1hdGNoX2JpdGFwU2NvcmVfKGQgKyAxLCBsb2MpID4gc2NvcmVfdGhyZXNob2xkKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgbGFzdF9yZCA9IHJkO1xuICAgIH1cbiAgICByZXR1cm4gYmVzdF9sb2M7XG4gIH07XG5cblxuICAvKipcbiAgICogSW5pdGlhbGlzZSB0aGUgYWxwaGFiZXQgZm9yIHRoZSBCaXRhcCBhbGdvcml0aG0uXG4gICAqIEBwYXJhbSAgcGF0dGVybiBUaGUgdGV4dCB0byBlbmNvZGUuXG4gICAqIEByZXR1cm4gIEhhc2ggb2YgY2hhcmFjdGVyIGxvY2F0aW9ucy5cblxuICAgKi9cbiAgICBtYXRjaF9hbHBoYWJldF8gKHBhdHRlcm46IHN0cmluZyk6IHsgW2NoYXJhY3Rlcjogc3RyaW5nXTogbnVtYmVyIH0ge1xuICAgIGNvbnN0IHM6IHsgW2NoYXJhY3Rlcjogc3RyaW5nXTogbnVtYmVyIH0gPSB7fTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhdHRlcm4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHNbcGF0dGVybi5jaGFyQXQoaSldID0gMDtcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXR0ZXJuLmxlbmd0aDsgaSsrKSB7XG4gICAgICBzW3BhdHRlcm4uY2hhckF0KGkpXSB8PSAxIDw8IChwYXR0ZXJuLmxlbmd0aCAtIGkgLSAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHM7XG4gIH07XG5cblxuICAvKipcbiAgICogSW5jcmVhc2UgdGhlIGNvbnRleHQgdW50aWwgaXQgaXMgdW5pcXVlLFxuICAgKiBidXQgZG9uJ3QgbGV0IHRoZSBwYXR0ZXJuIGV4cGFuZCBiZXlvbmQgTWF0Y2hfTWF4Qml0cy5cbiAgICogQHBhcmFtICBwYXRjaCBUaGUgcGF0Y2ggdG8gZ3Jvdy5cbiAgICogQHBhcmFtICB0ZXh0IFNvdXJjZSB0ZXh0LlxuXG4gICAqL1xuICAgIHBhdGNoX2FkZENvbnRleHRfIChwYXRjaDogcGF0Y2hfb2JqLCB0ZXh0OiBzdHJpbmcpIHtcbiAgICBpZiAodGV4dC5sZW5ndGggPT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgcGF0dGVybiA9IHRleHQuc3Vic3RyaW5nKHBhdGNoLnN0YXJ0MiwgcGF0Y2guc3RhcnQyICsgcGF0Y2gubGVuZ3RoMSk7XG4gICAgbGV0IHBhZGRpbmcgPSAwO1xuXG4gICAgLy8gTG9vayBmb3IgdGhlIGZpcnN0IGFuZCBsYXN0IG1hdGNoZXMgb2YgcGF0dGVybiBpbiB0ZXh0LiAgSWYgdHdvIGRpZmZlcmVudFxuICAgIC8vIG1hdGNoZXMgYXJlIGZvdW5kLCBpbmNyZWFzZSB0aGUgcGF0dGVybiBsZW5ndGguXG4gICAgd2hpbGUgKHRleHQuaW5kZXhPZihwYXR0ZXJuKSAhPSB0ZXh0Lmxhc3RJbmRleE9mKHBhdHRlcm4pICYmXG4gICAgICAgICAgcGF0dGVybi5sZW5ndGggPCB0aGlzLk1hdGNoX01heEJpdHMgLSB0aGlzLlBhdGNoX01hcmdpbiAtXG4gICAgICAgICAgdGhpcy5QYXRjaF9NYXJnaW4pIHtcbiAgICAgIHBhZGRpbmcgKz0gdGhpcy5QYXRjaF9NYXJnaW47XG4gICAgICBwYXR0ZXJuID0gdGV4dC5zdWJzdHJpbmcocGF0Y2guc3RhcnQyIC0gcGFkZGluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGNoLnN0YXJ0MiArIHBhdGNoLmxlbmd0aDEgKyBwYWRkaW5nKTtcbiAgICB9XG4gICAgLy8gQWRkIG9uZSBjaHVuayBmb3IgZ29vZCBsdWNrLlxuICAgIHBhZGRpbmcgKz0gdGhpcy5QYXRjaF9NYXJnaW47XG5cbiAgICAvLyBBZGQgdGhlIHByZWZpeC5cbiAgICBjb25zdCBwcmVmaXggPSB0ZXh0LnN1YnN0cmluZyhwYXRjaC5zdGFydDIgLSBwYWRkaW5nLCBwYXRjaC5zdGFydDIpO1xuICAgIGlmIChwcmVmaXgpIHtcbiAgICAgIHBhdGNoLmRpZmZzLnVuc2hpZnQoW0RpZmZPcC5FcXVhbCwgcHJlZml4XSk7XG4gICAgfVxuICAgIC8vIEFkZCB0aGUgc3VmZml4LlxuICAgIGNvbnN0IHN1ZmZpeCA9IHRleHQuc3Vic3RyaW5nKHBhdGNoLnN0YXJ0MiArIHBhdGNoLmxlbmd0aDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGNoLnN0YXJ0MiArIHBhdGNoLmxlbmd0aDEgKyBwYWRkaW5nKTtcbiAgICBpZiAoc3VmZml4KSB7XG4gICAgICBwYXRjaC5kaWZmcy5wdXNoKFtEaWZmT3AuRXF1YWwsIHN1ZmZpeF0pO1xuICAgIH1cblxuICAgIC8vIFJvbGwgYmFjayB0aGUgc3RhcnQgcG9pbnRzLlxuICAgIHBhdGNoLnN0YXJ0MSAtPSBwcmVmaXgubGVuZ3RoO1xuICAgIHBhdGNoLnN0YXJ0MiAtPSBwcmVmaXgubGVuZ3RoO1xuICAgIC8vIEV4dGVuZCB0aGUgbGVuZ3Rocy5cbiAgICBwYXRjaC5sZW5ndGgxICs9IHByZWZpeC5sZW5ndGggKyBzdWZmaXgubGVuZ3RoO1xuICAgIHBhdGNoLmxlbmd0aDIgKz0gcHJlZml4Lmxlbmd0aCArIHN1ZmZpeC5sZW5ndGg7XG4gIH07XG5cblxuICAvKipcbiAgICogQ29tcHV0ZSBhIGxpc3Qgb2YgcGF0Y2hlcyB0byB0dXJuIHRleHQxIGludG8gdGV4dDIuXG4gICAqIFVzZSBkaWZmcyBpZiBwcm92aWRlZCwgb3RoZXJ3aXNlIGNvbXB1dGUgaXQgb3Vyc2VsdmVzLlxuICAgKiBUaGVyZSBhcmUgZm91ciB3YXlzIHRvIGNhbGwgdGhpcyBmdW5jdGlvbiwgZGVwZW5kaW5nIG9uIHdoYXQgZGF0YSBpc1xuICAgKiBhdmFpbGFibGUgdG8gdGhlIGNhbGxlcjpcbiAgICogTWV0aG9kIDE6XG4gICAqIGEgPSB0ZXh0MSwgYiA9IHRleHQyXG4gICAqIE1ldGhvZCAyOlxuICAgKiBhID0gZGlmZnNcbiAgICogTWV0aG9kIDMgKG9wdGltYWwpOlxuICAgKiBhID0gdGV4dDEsIGIgPSBkaWZmc1xuICAgKiBNZXRob2QgNCAoZGVwcmVjYXRlZCwgdXNlIG1ldGhvZCAzKTpcbiAgICogYSA9IHRleHQxLCBiID0gdGV4dDIsIGMgPSBkaWZmc1xuICAgKlxuICAgKiBAcGFyYW0gIGEgdGV4dDEgKG1ldGhvZHMgMSwzLDQpIG9yXG4gICAqIEFycmF5IG9mIGRpZmYgdHVwbGVzIGZvciB0ZXh0MSB0byB0ZXh0MiAobWV0aG9kIDIpLlxuICAgKiBAcGFyYW0gIG9wdF9iIHRleHQyIChtZXRob2RzIDEsNCkgb3JcbiAgICogQXJyYXkgb2YgZGlmZiB0dXBsZXMgZm9yIHRleHQxIHRvIHRleHQyIChtZXRob2QgMykgb3IgdW5kZWZpbmVkIChtZXRob2QgMikuXG4gICAqIEBwYXJhbSAgb3B0X2MgQXJyYXkgb2YgZGlmZiB0dXBsZXNcbiAgICogZm9yIHRleHQxIHRvIHRleHQyIChtZXRob2QgNCkgb3IgdW5kZWZpbmVkIChtZXRob2RzIDEsMiwzKS5cbiAgICogQHJldHVybiAgQXJyYXkgb2YgUGF0Y2ggb2JqZWN0cy5cbiAgICovXG4gICAgcGF0Y2hfbWFrZSAoYTogc3RyaW5nIHwgQXJyYXk8RGlmZj4sIG9wdF9iOiBzdHJpbmcgfCBBcnJheTxEaWZmPiwgb3B0X2M6IHN0cmluZyB8IEFycmF5PERpZmY+KSB7XG4gICAgbGV0IHRleHQxLCBkaWZmcztcbiAgICBpZiAodHlwZW9mIGEgPT0gJ3N0cmluZycgJiYgdHlwZW9mIG9wdF9iID09ICdzdHJpbmcnICYmXG4gICAgICAgIHR5cGVvZiBvcHRfYyA9PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gTWV0aG9kIDE6IHRleHQxLCB0ZXh0MlxuICAgICAgLy8gQ29tcHV0ZSBkaWZmcyBmcm9tIHRleHQxIGFuZCB0ZXh0Mi5cbiAgICAgIHRleHQxID0gKGEpO1xuICAgICAgZGlmZnMgPSB0aGlzLmRpZmZfbWFpbih0ZXh0MSwgKG9wdF9iKSwgdHJ1ZSk7XG4gICAgICBpZiAoZGlmZnMubGVuZ3RoID4gMikge1xuICAgICAgICB0aGlzLmRpZmZfY2xlYW51cFNlbWFudGljKGRpZmZzKTtcbiAgICAgICAgdGhpcy5kaWZmX2NsZWFudXBFZmZpY2llbmN5KGRpZmZzKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGEgJiYgdHlwZW9mIGEgPT0gJ29iamVjdCcgJiYgdHlwZW9mIG9wdF9iID09ICd1bmRlZmluZWQnICYmXG4gICAgICAgIHR5cGVvZiBvcHRfYyA9PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gTWV0aG9kIDI6IGRpZmZzXG4gICAgICAvLyBDb21wdXRlIHRleHQxIGZyb20gZGlmZnMuXG4gICAgICBkaWZmcyA9IChhKTtcbiAgICAgIHRleHQxID0gdGhpcy5kaWZmX3RleHQxKGRpZmZzKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBhID09ICdzdHJpbmcnICYmIG9wdF9iICYmIHR5cGVvZiBvcHRfYiA9PSAnb2JqZWN0JyAmJlxuICAgICAgICB0eXBlb2Ygb3B0X2MgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIC8vIE1ldGhvZCAzOiB0ZXh0MSwgZGlmZnNcbiAgICAgIHRleHQxID0gKGEpO1xuICAgICAgZGlmZnMgPSAob3B0X2IpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGEgPT0gJ3N0cmluZycgJiYgdHlwZW9mIG9wdF9iID09ICdzdHJpbmcnICYmXG4gICAgICAgIG9wdF9jICYmIHR5cGVvZiBvcHRfYyA9PSAnb2JqZWN0Jykge1xuICAgICAgLy8gTWV0aG9kIDQ6IHRleHQxLCB0ZXh0MiwgZGlmZnNcbiAgICAgIC8vIHRleHQyIGlzIG5vdCB1c2VkLlxuICAgICAgdGV4dDEgPSAoYSk7XG4gICAgICBkaWZmcyA9IChvcHRfYyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBjYWxsIGZvcm1hdCB0byBwYXRjaF9tYWtlLicpO1xuICAgIH1cblxuICAgIGlmIChkaWZmcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBbXTsgIC8vIEdldCByaWQgb2YgdGhlIG51bGwgY2FzZS5cbiAgICB9XG4gICAgY29uc3QgcGF0Y2hlcyA9IFtdO1xuICAgIGxldCBwYXRjaCA9IG5ldyBwYXRjaF9vYmooKTtcbiAgICBsZXQgcGF0Y2hEaWZmTGVuZ3RoID0gMDsgIC8vIEtlZXBpbmcgb3VyIG93biBsZW5ndGggY29uc3QgaXMgZmFzdGVyIGluIEpTLlxuICAgIGxldCBjaGFyX2NvdW50MSA9IDA7ICAvLyBOdW1iZXIgb2YgY2hhcmFjdGVycyBpbnRvIHRoZSB0ZXh0MSBzdHJpbmcuXG4gICAgbGV0IGNoYXJfY291bnQyID0gMDsgIC8vIE51bWJlciBvZiBjaGFyYWN0ZXJzIGludG8gdGhlIHRleHQyIHN0cmluZy5cbiAgICAvLyBTdGFydCB3aXRoIHRleHQxIChwcmVwYXRjaF90ZXh0KSBhbmQgYXBwbHkgdGhlIGRpZmZzIHVudGlsIHdlIGFycml2ZSBhdFxuICAgIC8vIHRleHQyIChwb3N0cGF0Y2hfdGV4dCkuICBXZSByZWNyZWF0ZSB0aGUgcGF0Y2hlcyBvbmUgYnkgb25lIHRvIGRldGVybWluZVxuICAgIC8vIGNvbnRleHQgaW5mby5cbiAgICBsZXQgcHJlcGF0Y2hfdGV4dCA9IHRleHQxO1xuICAgIGxldCBwb3N0cGF0Y2hfdGV4dCA9IHRleHQxO1xuICAgIGZvciAobGV0IHggPSAwOyB4IDwgZGlmZnMubGVuZ3RoOyB4KyspIHtcbiAgICAgIGNvbnN0IGRpZmZfdHlwZSA9IGRpZmZzW3hdWzBdO1xuICAgICAgY29uc3QgZGlmZl90ZXh0ID0gZGlmZnNbeF1bMV07XG5cbiAgICAgIGlmICghcGF0Y2hEaWZmTGVuZ3RoICYmIGRpZmZfdHlwZSAhPT0gRGlmZk9wLkVxdWFsKSB7XG4gICAgICAgIC8vIEEgbmV3IHBhdGNoIHN0YXJ0cyBoZXJlLlxuICAgICAgICBwYXRjaC5zdGFydDEgPSBjaGFyX2NvdW50MTtcbiAgICAgICAgcGF0Y2guc3RhcnQyID0gY2hhcl9jb3VudDI7XG4gICAgICB9XG5cbiAgICAgIHN3aXRjaCAoZGlmZl90eXBlKSB7XG4gICAgICAgIGNhc2UgRGlmZk9wLkluc2VydDpcbiAgICAgICAgICBwYXRjaC5kaWZmc1twYXRjaERpZmZMZW5ndGgrK10gPSBkaWZmc1t4XTtcbiAgICAgICAgICBwYXRjaC5sZW5ndGgyICs9IGRpZmZfdGV4dC5sZW5ndGg7XG4gICAgICAgICAgcG9zdHBhdGNoX3RleHQgPSBwb3N0cGF0Y2hfdGV4dC5zdWJzdHJpbmcoMCwgY2hhcl9jb3VudDIpICsgZGlmZl90ZXh0ICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zdHBhdGNoX3RleHQuc3Vic3RyaW5nKGNoYXJfY291bnQyKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBEaWZmT3AuRGVsZXRlOlxuICAgICAgICAgIHBhdGNoLmxlbmd0aDEgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcbiAgICAgICAgICBwYXRjaC5kaWZmc1twYXRjaERpZmZMZW5ndGgrK10gPSBkaWZmc1t4XTtcbiAgICAgICAgICBwb3N0cGF0Y2hfdGV4dCA9IHBvc3RwYXRjaF90ZXh0LnN1YnN0cmluZygwLCBjaGFyX2NvdW50MikgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICBwb3N0cGF0Y2hfdGV4dC5zdWJzdHJpbmcoY2hhcl9jb3VudDIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZl90ZXh0Lmxlbmd0aCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgRGlmZk9wLkVxdWFsOlxuICAgICAgICAgIGlmIChkaWZmX3RleHQubGVuZ3RoIDw9IDIgKiB0aGlzLlBhdGNoX01hcmdpbiAmJlxuICAgICAgICAgICAgICBwYXRjaERpZmZMZW5ndGggJiYgZGlmZnMubGVuZ3RoICE9IHggKyAxKSB7XG4gICAgICAgICAgICAvLyBTbWFsbCBlcXVhbGl0eSBpbnNpZGUgYSBwYXRjaC5cbiAgICAgICAgICAgIHBhdGNoLmRpZmZzW3BhdGNoRGlmZkxlbmd0aCsrXSA9IGRpZmZzW3hdO1xuICAgICAgICAgICAgcGF0Y2gubGVuZ3RoMSArPSBkaWZmX3RleHQubGVuZ3RoO1xuICAgICAgICAgICAgcGF0Y2gubGVuZ3RoMiArPSBkaWZmX3RleHQubGVuZ3RoO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZGlmZl90ZXh0Lmxlbmd0aCA+PSAyICogdGhpcy5QYXRjaF9NYXJnaW4pIHtcbiAgICAgICAgICAgIC8vIFRpbWUgZm9yIGEgbmV3IHBhdGNoLlxuICAgICAgICAgICAgaWYgKHBhdGNoRGlmZkxlbmd0aCkge1xuICAgICAgICAgICAgICB0aGlzLnBhdGNoX2FkZENvbnRleHRfKHBhdGNoLCBwcmVwYXRjaF90ZXh0KTtcbiAgICAgICAgICAgICAgcGF0Y2hlcy5wdXNoKHBhdGNoKTtcbiAgICAgICAgICAgICAgcGF0Y2ggPSBuZXcgcGF0Y2hfb2JqKCk7XG4gICAgICAgICAgICAgIHBhdGNoRGlmZkxlbmd0aCA9IDA7XG4gICAgICAgICAgICAgIC8vIFVubGlrZSBVbmlkaWZmLCBvdXIgcGF0Y2ggbGlzdHMgaGF2ZSBhIHJvbGxpbmcgY29udGV4dC5cbiAgICAgICAgICAgICAgLy8gaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2dvb2dsZS1kaWZmLW1hdGNoLXBhdGNoL3dpa2kvVW5pZGlmZlxuICAgICAgICAgICAgICAvLyBVcGRhdGUgcHJlcGF0Y2ggdGV4dCAmIHBvcyB0byByZWZsZWN0IHRoZSBhcHBsaWNhdGlvbiBvZiB0aGVcbiAgICAgICAgICAgICAgLy8ganVzdCBjb21wbGV0ZWQgcGF0Y2guXG4gICAgICAgICAgICAgIHByZXBhdGNoX3RleHQgPSBwb3N0cGF0Y2hfdGV4dDtcbiAgICAgICAgICAgICAgY2hhcl9jb3VudDEgPSBjaGFyX2NvdW50MjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIFVwZGF0ZSB0aGUgY3VycmVudCBjaGFyYWN0ZXIgY291bnQuXG4gICAgICBpZiAoZGlmZl90eXBlICE9PSBEaWZmT3AuSW5zZXJ0KSB7XG4gICAgICAgIGNoYXJfY291bnQxICs9IGRpZmZfdGV4dC5sZW5ndGg7XG4gICAgICB9XG4gICAgICBpZiAoZGlmZl90eXBlICE9PSBEaWZmT3AuRGVsZXRlKSB7XG4gICAgICAgIGNoYXJfY291bnQyICs9IGRpZmZfdGV4dC5sZW5ndGg7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFBpY2sgdXAgdGhlIGxlZnRvdmVyIHBhdGNoIGlmIG5vdCBlbXB0eS5cbiAgICBpZiAocGF0Y2hEaWZmTGVuZ3RoKSB7XG4gICAgICB0aGlzLnBhdGNoX2FkZENvbnRleHRfKHBhdGNoLCBwcmVwYXRjaF90ZXh0KTtcbiAgICAgIHBhdGNoZXMucHVzaChwYXRjaCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhdGNoZXM7XG4gIH07XG5cblxuICAvKipcbiAgICogR2l2ZW4gYW4gYXJyYXkgb2YgcGF0Y2hlcywgcmV0dXJuIGFub3RoZXIgYXJyYXkgdGhhdCBpcyBpZGVudGljYWwuXG4gICAqIEBwYXJhbSAgcGF0Y2hlcyBBcnJheSBvZiBQYXRjaCBvYmplY3RzLlxuICAgKiBAcmV0dXJuICBBcnJheSBvZiBQYXRjaCBvYmplY3RzLlxuICAgKi9cbiAgICBwYXRjaF9kZWVwQ29weSAocGF0Y2hlczogQXJyYXk8cGF0Y2hfb2JqPik6IEFycmF5PHBhdGNoX29iaj4ge1xuICAgIC8vIE1ha2luZyBkZWVwIGNvcGllcyBpcyBoYXJkIGluIEphdmFTY3JpcHQuXG4gICAgY29uc3QgcGF0Y2hlc0NvcHkgPSBbXTtcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHBhdGNoZXMubGVuZ3RoOyB4KyspIHtcbiAgICAgIGNvbnN0IHBhdGNoID0gcGF0Y2hlc1t4XTtcbiAgICAgIGNvbnN0IHBhdGNoQ29weSA9IG5ldyBwYXRjaF9vYmooKTtcbiAgICAgIHBhdGNoQ29weS5kaWZmcyA9IFtdO1xuICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBwYXRjaC5kaWZmcy5sZW5ndGg7IHkrKykge1xuICAgICAgICBwYXRjaENvcHkuZGlmZnNbeV0gPSBbcGF0Y2guZGlmZnNbeV1bMF0sIHBhdGNoLmRpZmZzW3ldWzFdXTtcbiAgICAgIH1cbiAgICAgIHBhdGNoQ29weS5zdGFydDEgPSBwYXRjaC5zdGFydDE7XG4gICAgICBwYXRjaENvcHkuc3RhcnQyID0gcGF0Y2guc3RhcnQyO1xuICAgICAgcGF0Y2hDb3B5Lmxlbmd0aDEgPSBwYXRjaC5sZW5ndGgxO1xuICAgICAgcGF0Y2hDb3B5Lmxlbmd0aDIgPSBwYXRjaC5sZW5ndGgyO1xuICAgICAgcGF0Y2hlc0NvcHlbeF0gPSBwYXRjaENvcHk7XG4gICAgfVxuICAgIHJldHVybiBwYXRjaGVzQ29weTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBNZXJnZSBhIHNldCBvZiBwYXRjaGVzIG9udG8gdGhlIHRleHQuICBSZXR1cm4gYSBwYXRjaGVkIHRleHQsIGFzIHdlbGxcbiAgICogYXMgYSBsaXN0IG9mIHRydWUvZmFsc2UgdmFsdWVzIGluZGljYXRpbmcgd2hpY2ggcGF0Y2hlcyB3ZXJlIGFwcGxpZWQuXG4gICAqIEBwYXJhbSAgcGF0Y2hlcyBBcnJheSBvZiBQYXRjaCBvYmplY3RzLlxuICAgKiBAcGFyYW0gIHRleHQgT2xkIHRleHQuXG4gICAqIEByZXR1cm4gIFR3byBlbGVtZW50IEFycmF5LCBjb250YWluaW5nIHRoZVxuICAgKiAgICAgIG5ldyB0ZXh0IGFuZCBhbiBhcnJheSBvZiBib29sZWFuIHZhbHVlcy5cbiAgICovXG4gICAgcGF0Y2hfYXBwbHkgKHBhdGNoZXM6IEFycmF5PHBhdGNoX29iaj4sIHRleHQ6IHN0cmluZykge1xuICAgIGlmIChwYXRjaGVzLmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm4gW3RleHQsIFtdXTtcbiAgICB9XG5cbiAgICAvLyBEZWVwIGNvcHkgdGhlIHBhdGNoZXMgc28gdGhhdCBubyBjaGFuZ2VzIGFyZSBtYWRlIHRvIG9yaWdpbmFscy5cbiAgICBwYXRjaGVzID0gdGhpcy5wYXRjaF9kZWVwQ29weShwYXRjaGVzKTtcblxuICAgIGNvbnN0IG51bGxQYWRkaW5nID0gdGhpcy5wYXRjaF9hZGRQYWRkaW5nKHBhdGNoZXMpO1xuICAgIHRleHQgPSBudWxsUGFkZGluZyArIHRleHQgKyBudWxsUGFkZGluZztcblxuICAgIHRoaXMucGF0Y2hfc3BsaXRNYXgocGF0Y2hlcyk7XG4gICAgLy8gZGVsdGEga2VlcHMgdHJhY2sgb2YgdGhlIG9mZnNldCBiZXR3ZWVuIHRoZSBleHBlY3RlZCBhbmQgYWN0dWFsIGxvY2F0aW9uXG4gICAgLy8gb2YgdGhlIHByZXZpb3VzIHBhdGNoLiAgSWYgdGhlcmUgYXJlIHBhdGNoZXMgZXhwZWN0ZWQgYXQgcG9zaXRpb25zIDEwIGFuZFxuICAgIC8vIDIwLCBidXQgdGhlIGZpcnN0IHBhdGNoIHdhcyBmb3VuZCBhdCAxMiwgZGVsdGEgaXMgMiBhbmQgdGhlIHNlY29uZCBwYXRjaFxuICAgIC8vIGhhcyBhbiBlZmZlY3RpdmUgZXhwZWN0ZWQgcG9zaXRpb24gb2YgMjIuXG4gICAgbGV0IGRlbHRhID0gMDtcbiAgICBjb25zdCByZXN1bHRzID0gW107XG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBwYXRjaGVzLmxlbmd0aDsgeCsrKSB7XG4gICAgICBjb25zdCBleHBlY3RlZF9sb2MgPSBwYXRjaGVzW3hdLnN0YXJ0MiArIGRlbHRhO1xuICAgICAgY29uc3QgdGV4dDEgPSB0aGlzLmRpZmZfdGV4dDEocGF0Y2hlc1t4XS5kaWZmcyk7XG4gICAgICBsZXQgc3RhcnRfbG9jO1xuICAgICAgbGV0IGVuZF9sb2MgPSAtMTtcbiAgICAgIGlmICh0ZXh0MS5sZW5ndGggPiB0aGlzLk1hdGNoX01heEJpdHMpIHtcbiAgICAgICAgLy8gcGF0Y2hfc3BsaXRNYXggd2lsbCBvbmx5IHByb3ZpZGUgYW4gb3ZlcnNpemVkIHBhdHRlcm4gaW4gdGhlIGNhc2Ugb2ZcbiAgICAgICAgLy8gYSBtb25zdGVyIGRlbGV0ZS5cbiAgICAgICAgc3RhcnRfbG9jID0gdGhpcy5tYXRjaF9tYWluKHRleHQsIHRleHQxLnN1YnN0cmluZygwLCB0aGlzLk1hdGNoX01heEJpdHMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWRfbG9jKTtcbiAgICAgICAgaWYgKHN0YXJ0X2xvYyAhPSAtMSkge1xuICAgICAgICAgIGVuZF9sb2MgPSB0aGlzLm1hdGNoX21haW4odGV4dCxcbiAgICAgICAgICAgICAgdGV4dDEuc3Vic3RyaW5nKHRleHQxLmxlbmd0aCAtIHRoaXMuTWF0Y2hfTWF4Qml0cyksXG4gICAgICAgICAgICAgIGV4cGVjdGVkX2xvYyArIHRleHQxLmxlbmd0aCAtIHRoaXMuTWF0Y2hfTWF4Qml0cyk7XG4gICAgICAgICAgaWYgKGVuZF9sb2MgPT0gLTEgfHwgc3RhcnRfbG9jID49IGVuZF9sb2MpIHtcbiAgICAgICAgICAgIC8vIENhbid0IGZpbmQgdmFsaWQgdHJhaWxpbmcgY29udGV4dC4gIERyb3AgdGhpcyBwYXRjaC5cbiAgICAgICAgICAgIHN0YXJ0X2xvYyA9IC0xO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhcnRfbG9jID0gdGhpcy5tYXRjaF9tYWluKHRleHQsIHRleHQxLCBleHBlY3RlZF9sb2MpO1xuICAgICAgfVxuICAgICAgaWYgKHN0YXJ0X2xvYyA9PSAtMSkge1xuICAgICAgICAvLyBObyBtYXRjaCBmb3VuZC4gIDooXG4gICAgICAgIHJlc3VsdHNbeF0gPSBmYWxzZTtcbiAgICAgICAgLy8gU3VidHJhY3QgdGhlIGRlbHRhIGZvciB0aGlzIGZhaWxlZCBwYXRjaCBmcm9tIHN1YnNlcXVlbnQgcGF0Y2hlcy5cbiAgICAgICAgZGVsdGEgLT0gcGF0Y2hlc1t4XS5sZW5ndGgyIC0gcGF0Y2hlc1t4XS5sZW5ndGgxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRm91bmQgYSBtYXRjaC4gIDopXG4gICAgICAgIHJlc3VsdHNbeF0gPSB0cnVlO1xuICAgICAgICBkZWx0YSA9IHN0YXJ0X2xvYyAtIGV4cGVjdGVkX2xvYztcbiAgICAgICAgbGV0IHRleHQyO1xuICAgICAgICBpZiAoZW5kX2xvYyA9PSAtMSkge1xuICAgICAgICAgIHRleHQyID0gdGV4dC5zdWJzdHJpbmcoc3RhcnRfbG9jLCBzdGFydF9sb2MgKyB0ZXh0MS5sZW5ndGgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRleHQyID0gdGV4dC5zdWJzdHJpbmcoc3RhcnRfbG9jLCBlbmRfbG9jICsgdGhpcy5NYXRjaF9NYXhCaXRzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGV4dDEgPT0gdGV4dDIpIHtcbiAgICAgICAgICAvLyBQZXJmZWN0IG1hdGNoLCBqdXN0IHNob3ZlIHRoZSByZXBsYWNlbWVudCB0ZXh0IGluLlxuICAgICAgICAgIHRleHQgPSB0ZXh0LnN1YnN0cmluZygwLCBzdGFydF9sb2MpICtcbiAgICAgICAgICAgICAgICB0aGlzLmRpZmZfdGV4dDIocGF0Y2hlc1t4XS5kaWZmcykgK1xuICAgICAgICAgICAgICAgIHRleHQuc3Vic3RyaW5nKHN0YXJ0X2xvYyArIHRleHQxLmxlbmd0aCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gSW1wZXJmZWN0IG1hdGNoLiAgUnVuIGEgZGlmZiB0byBnZXQgYSBmcmFtZXdvcmsgb2YgZXF1aXZhbGVudFxuICAgICAgICAgIC8vIGluZGljZXMuXG4gICAgICAgICAgY29uc3QgZGlmZnMgPSB0aGlzLmRpZmZfbWFpbih0ZXh0MSwgdGV4dDIsIGZhbHNlKTtcbiAgICAgICAgICBpZiAodGV4dDEubGVuZ3RoID4gdGhpcy5NYXRjaF9NYXhCaXRzICYmXG4gICAgICAgICAgICAgIHRoaXMuZGlmZl9sZXZlbnNodGVpbihkaWZmcykgLyB0ZXh0MS5sZW5ndGggPlxuICAgICAgICAgICAgICB0aGlzLlBhdGNoX0RlbGV0ZVRocmVzaG9sZCkge1xuICAgICAgICAgICAgLy8gVGhlIGVuZCBwb2ludHMgbWF0Y2gsIGJ1dCB0aGUgY29udGVudCBpcyB1bmFjY2VwdGFibHkgYmFkLlxuICAgICAgICAgICAgcmVzdWx0c1t4XSA9IGZhbHNlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmRpZmZfY2xlYW51cFNlbWFudGljTG9zc2xlc3MoZGlmZnMpO1xuICAgICAgICAgICAgbGV0IGluZGV4MSA9IDA7XG4gICAgICAgICAgICBsZXQgaW5kZXgyO1xuICAgICAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBwYXRjaGVzW3hdLmRpZmZzLmxlbmd0aDsgeSsrKSB7XG4gICAgICAgICAgICAgIGNvbnN0IG1vZCA9IHBhdGNoZXNbeF0uZGlmZnNbeV07XG4gICAgICAgICAgICAgIGlmIChtb2RbMF0gIT09IERpZmZPcC5FcXVhbCkge1xuICAgICAgICAgICAgICAgIGluZGV4MiA9IHRoaXMuZGlmZl94SW5kZXgoZGlmZnMsIGluZGV4MSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKG1vZFswXSA9PT0gRGlmZk9wLkluc2VydCkgeyAgLy8gSW5zZXJ0aW9uXG4gICAgICAgICAgICAgICAgdGV4dCA9IHRleHQuc3Vic3RyaW5nKDAsIHN0YXJ0X2xvYyArIGluZGV4MikgKyBtb2RbMV0gK1xuICAgICAgICAgICAgICAgICAgICAgIHRleHQuc3Vic3RyaW5nKHN0YXJ0X2xvYyArIGluZGV4Mik7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAobW9kWzBdID09PSBEaWZmT3AuRGVsZXRlKSB7ICAvLyBEZWxldGlvblxuICAgICAgICAgICAgICAgIHRleHQgPSB0ZXh0LnN1YnN0cmluZygwLCBzdGFydF9sb2MgKyBpbmRleDIpICtcbiAgICAgICAgICAgICAgICAgICAgICB0ZXh0LnN1YnN0cmluZyhzdGFydF9sb2MgKyB0aGlzLmRpZmZfeEluZGV4KGRpZmZzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleDEgKyBtb2RbMV0ubGVuZ3RoKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKG1vZFswXSAhPT0gRGlmZk9wLkRlbGV0ZSkge1xuICAgICAgICAgICAgICAgIGluZGV4MSArPSBtb2RbMV0ubGVuZ3RoO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFN0cmlwIHRoZSBwYWRkaW5nIG9mZi5cbiAgICB0ZXh0ID0gdGV4dC5zdWJzdHJpbmcobnVsbFBhZGRpbmcubGVuZ3RoLCB0ZXh0Lmxlbmd0aCAtIG51bGxQYWRkaW5nLmxlbmd0aCk7XG4gICAgcmV0dXJuIFt0ZXh0LCByZXN1bHRzXTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBBZGQgc29tZSBwYWRkaW5nIG9uIHRleHQgc3RhcnQgYW5kIGVuZCBzbyB0aGF0IGVkZ2VzIGNhbiBtYXRjaCBzb21ldGhpbmcuXG4gICAqIEludGVuZGVkIHRvIGJlIGNhbGxlZCBvbmx5IGZyb20gd2l0aGluIHBhdGNoX2FwcGx5LlxuICAgKiBAcGFyYW0gIHBhdGNoZXMgQXJyYXkgb2YgUGF0Y2ggb2JqZWN0cy5cbiAgICogQHJldHVybiAgVGhlIHBhZGRpbmcgc3RyaW5nIGFkZGVkIHRvIGVhY2ggc2lkZS5cbiAgICovXG4gICAgcGF0Y2hfYWRkUGFkZGluZyAocGF0Y2hlczogQXJyYXk8cGF0Y2hfb2JqPikge1xuICAgIGNvbnN0IHBhZGRpbmdMZW5ndGggPSB0aGlzLlBhdGNoX01hcmdpbjtcbiAgICBsZXQgbnVsbFBhZGRpbmcgPSAnJztcbiAgICBmb3IgKGxldCB4ID0gMTsgeCA8PSBwYWRkaW5nTGVuZ3RoOyB4KyspIHtcbiAgICAgIG51bGxQYWRkaW5nICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoeCk7XG4gICAgfVxuXG4gICAgLy8gQnVtcCBhbGwgdGhlIHBhdGNoZXMgZm9yd2FyZC5cbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHBhdGNoZXMubGVuZ3RoOyB4KyspIHtcbiAgICAgIHBhdGNoZXNbeF0uc3RhcnQxICs9IHBhZGRpbmdMZW5ndGg7XG4gICAgICBwYXRjaGVzW3hdLnN0YXJ0MiArPSBwYWRkaW5nTGVuZ3RoO1xuICAgIH1cblxuICAgIC8vIEFkZCBzb21lIHBhZGRpbmcgb24gc3RhcnQgb2YgZmlyc3QgZGlmZi5cbiAgICBsZXQgcGF0Y2ggPSBwYXRjaGVzWzBdO1xuICAgIGxldCBkaWZmcyA9IHBhdGNoLmRpZmZzO1xuICAgIGlmIChkaWZmcy5sZW5ndGggPT0gMCB8fCBkaWZmc1swXVswXSAhPSBEaWZmT3AuRXF1YWwpIHtcbiAgICAgIC8vIEFkZCBudWxsUGFkZGluZyBlcXVhbGl0eS5cbiAgICAgIGRpZmZzLnVuc2hpZnQoW0RpZmZPcC5FcXVhbCwgbnVsbFBhZGRpbmddKTtcbiAgICAgIHBhdGNoLnN0YXJ0MSAtPSBwYWRkaW5nTGVuZ3RoOyAgLy8gU2hvdWxkIGJlIDAuXG4gICAgICBwYXRjaC5zdGFydDIgLT0gcGFkZGluZ0xlbmd0aDsgIC8vIFNob3VsZCBiZSAwLlxuICAgICAgcGF0Y2gubGVuZ3RoMSArPSBwYWRkaW5nTGVuZ3RoO1xuICAgICAgcGF0Y2gubGVuZ3RoMiArPSBwYWRkaW5nTGVuZ3RoO1xuICAgIH0gZWxzZSBpZiAocGFkZGluZ0xlbmd0aCA+IGRpZmZzWzBdWzFdLmxlbmd0aCkge1xuICAgICAgLy8gR3JvdyBmaXJzdCBlcXVhbGl0eS5cbiAgICAgIGNvbnN0IGV4dHJhTGVuZ3RoID0gcGFkZGluZ0xlbmd0aCAtIGRpZmZzWzBdWzFdLmxlbmd0aDtcbiAgICAgIGRpZmZzWzBdWzFdID0gbnVsbFBhZGRpbmcuc3Vic3RyaW5nKGRpZmZzWzBdWzFdLmxlbmd0aCkgKyBkaWZmc1swXVsxXTtcbiAgICAgIHBhdGNoLnN0YXJ0MSAtPSBleHRyYUxlbmd0aDtcbiAgICAgIHBhdGNoLnN0YXJ0MiAtPSBleHRyYUxlbmd0aDtcbiAgICAgIHBhdGNoLmxlbmd0aDEgKz0gZXh0cmFMZW5ndGg7XG4gICAgICBwYXRjaC5sZW5ndGgyICs9IGV4dHJhTGVuZ3RoO1xuICAgIH1cblxuICAgIC8vIEFkZCBzb21lIHBhZGRpbmcgb24gZW5kIG9mIGxhc3QgZGlmZi5cbiAgICBwYXRjaCA9IHBhdGNoZXNbcGF0Y2hlcy5sZW5ndGggLSAxXTtcbiAgICBkaWZmcyA9IHBhdGNoLmRpZmZzO1xuICAgIGlmIChkaWZmcy5sZW5ndGggPT0gMCB8fCBkaWZmc1tkaWZmcy5sZW5ndGggLSAxXVswXSAhPSBEaWZmT3AuRXF1YWwpIHtcbiAgICAgIC8vIEFkZCBudWxsUGFkZGluZyBlcXVhbGl0eS5cbiAgICAgIGRpZmZzLnB1c2goW0RpZmZPcC5FcXVhbCwgbnVsbFBhZGRpbmddKTtcbiAgICAgIHBhdGNoLmxlbmd0aDEgKz0gcGFkZGluZ0xlbmd0aDtcbiAgICAgIHBhdGNoLmxlbmd0aDIgKz0gcGFkZGluZ0xlbmd0aDtcbiAgICB9IGVsc2UgaWYgKHBhZGRpbmdMZW5ndGggPiBkaWZmc1tkaWZmcy5sZW5ndGggLSAxXVsxXS5sZW5ndGgpIHtcbiAgICAgIC8vIEdyb3cgbGFzdCBlcXVhbGl0eS5cbiAgICAgIGNvbnN0IGV4dHJhTGVuZ3RoID0gcGFkZGluZ0xlbmd0aCAtIGRpZmZzW2RpZmZzLmxlbmd0aCAtIDFdWzFdLmxlbmd0aDtcbiAgICAgIGRpZmZzW2RpZmZzLmxlbmd0aCAtIDFdWzFdICs9IG51bGxQYWRkaW5nLnN1YnN0cmluZygwLCBleHRyYUxlbmd0aCk7XG4gICAgICBwYXRjaC5sZW5ndGgxICs9IGV4dHJhTGVuZ3RoO1xuICAgICAgcGF0Y2gubGVuZ3RoMiArPSBleHRyYUxlbmd0aDtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbFBhZGRpbmc7XG4gIH07XG5cblxuICAvKipcbiAgICogTG9vayB0aHJvdWdoIHRoZSBwYXRjaGVzIGFuZCBicmVhayB1cCBhbnkgd2hpY2ggYXJlIGxvbmdlciB0aGFuIHRoZSBtYXhpbXVtXG4gICAqIGxpbWl0IG9mIHRoZSBtYXRjaCBhbGdvcml0aG0uXG4gICAqIEludGVuZGVkIHRvIGJlIGNhbGxlZCBvbmx5IGZyb20gd2l0aGluIHBhdGNoX2FwcGx5LlxuICAgKiBAcGFyYW0gIHBhdGNoZXMgQXJyYXkgb2YgUGF0Y2ggb2JqZWN0cy5cbiAgICovXG4gICAgcGF0Y2hfc3BsaXRNYXggPSBmdW5jdGlvbihwYXRjaGVzOiBBcnJheTxwYXRjaF9vYmo+KSB7XG4gICAgY29uc3QgcGF0Y2hfc2l6ZSA9IHRoaXMuTWF0Y2hfTWF4Qml0cztcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHBhdGNoZXMubGVuZ3RoOyB4KyspIHtcbiAgICAgIGlmIChwYXRjaGVzW3hdLmxlbmd0aDEgPD0gcGF0Y2hfc2l6ZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGJpZ3BhdGNoID0gcGF0Y2hlc1t4XTtcbiAgICAgIC8vIFJlbW92ZSB0aGUgYmlnIG9sZCBwYXRjaC5cbiAgICAgIHBhdGNoZXMuc3BsaWNlKHgtLSwgMSk7XG4gICAgICBsZXQgc3RhcnQxID0gYmlncGF0Y2guc3RhcnQxO1xuICAgICAgbGV0IHN0YXJ0MiA9IGJpZ3BhdGNoLnN0YXJ0MjtcbiAgICAgIGxldCBwcmVjb250ZXh0ID0gJyc7XG4gICAgICB3aGlsZSAoYmlncGF0Y2guZGlmZnMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgIC8vIENyZWF0ZSBvbmUgb2Ygc2V2ZXJhbCBzbWFsbGVyIHBhdGNoZXMuXG4gICAgICAgIGNvbnN0IHBhdGNoID0gbmV3IHBhdGNoX29iaigpO1xuICAgICAgICBsZXQgZW1wdHkgPSB0cnVlO1xuICAgICAgICBwYXRjaC5zdGFydDEgPSBzdGFydDEgLSBwcmVjb250ZXh0Lmxlbmd0aDtcbiAgICAgICAgcGF0Y2guc3RhcnQyID0gc3RhcnQyIC0gcHJlY29udGV4dC5sZW5ndGg7XG4gICAgICAgIGlmIChwcmVjb250ZXh0ICE9PSAnJykge1xuICAgICAgICAgIHBhdGNoLmxlbmd0aDEgPSBwYXRjaC5sZW5ndGgyID0gcHJlY29udGV4dC5sZW5ndGg7XG4gICAgICAgICAgcGF0Y2guZGlmZnMucHVzaChbRGlmZk9wLkVxdWFsLCBwcmVjb250ZXh0XSk7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKGJpZ3BhdGNoLmRpZmZzLmxlbmd0aCAhPT0gMCAmJlxuICAgICAgICAgICAgICBwYXRjaC5sZW5ndGgxIDwgcGF0Y2hfc2l6ZSAtIHRoaXMuUGF0Y2hfTWFyZ2luKSB7XG4gICAgICAgICAgY29uc3QgZGlmZl90eXBlID0gYmlncGF0Y2guZGlmZnNbMF1bMF07XG4gICAgICAgICAgbGV0IGRpZmZfdGV4dCA9IGJpZ3BhdGNoLmRpZmZzWzBdWzFdO1xuICAgICAgICAgIGlmIChkaWZmX3R5cGUgPT09IERpZmZPcC5JbnNlcnQpIHtcbiAgICAgICAgICAgIC8vIEluc2VydGlvbnMgYXJlIGhhcm1sZXNzLlxuICAgICAgICAgICAgcGF0Y2gubGVuZ3RoMiArPSBkaWZmX3RleHQubGVuZ3RoO1xuICAgICAgICAgICAgc3RhcnQyICs9IGRpZmZfdGV4dC5sZW5ndGg7XG4gICAgICAgICAgICBwYXRjaC5kaWZmcy5wdXNoKGJpZ3BhdGNoLmRpZmZzLnNoaWZ0KCkpO1xuICAgICAgICAgICAgZW1wdHkgPSBmYWxzZTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGRpZmZfdHlwZSA9PT0gRGlmZk9wLkRlbGV0ZSAmJiBwYXRjaC5kaWZmcy5sZW5ndGggPT0gMSAmJlxuICAgICAgICAgICAgICAgICAgICBwYXRjaC5kaWZmc1swXVswXSA9PSBEaWZmT3AuRXF1YWwgJiZcbiAgICAgICAgICAgICAgICAgICAgZGlmZl90ZXh0Lmxlbmd0aCA+IDIgKiBwYXRjaF9zaXplKSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGEgbGFyZ2UgZGVsZXRpb24uICBMZXQgaXQgcGFzcyBpbiBvbmUgY2h1bmsuXG4gICAgICAgICAgICBwYXRjaC5sZW5ndGgxICs9IGRpZmZfdGV4dC5sZW5ndGg7XG4gICAgICAgICAgICBzdGFydDEgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcbiAgICAgICAgICAgIGVtcHR5ID0gZmFsc2U7XG4gICAgICAgICAgICBwYXRjaC5kaWZmcy5wdXNoKFtkaWZmX3R5cGUsIGRpZmZfdGV4dF0pO1xuICAgICAgICAgICAgYmlncGF0Y2guZGlmZnMuc2hpZnQoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gRGVsZXRpb24gb3IgZXF1YWxpdHkuICBPbmx5IHRha2UgYXMgbXVjaCBhcyB3ZSBjYW4gc3RvbWFjaC5cbiAgICAgICAgICAgIGRpZmZfdGV4dCA9IGRpZmZfdGV4dC5zdWJzdHJpbmcoMCxcbiAgICAgICAgICAgICAgICBwYXRjaF9zaXplIC0gcGF0Y2gubGVuZ3RoMSAtIHRoaXMuUGF0Y2hfTWFyZ2luKTtcbiAgICAgICAgICAgIHBhdGNoLmxlbmd0aDEgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcbiAgICAgICAgICAgIHN0YXJ0MSArPSBkaWZmX3RleHQubGVuZ3RoO1xuICAgICAgICAgICAgaWYgKGRpZmZfdHlwZSA9PT0gRGlmZk9wLkVxdWFsKSB7XG4gICAgICAgICAgICAgIHBhdGNoLmxlbmd0aDIgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcbiAgICAgICAgICAgICAgc3RhcnQyICs9IGRpZmZfdGV4dC5sZW5ndGg7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBlbXB0eSA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGF0Y2guZGlmZnMucHVzaChbZGlmZl90eXBlLCBkaWZmX3RleHRdKTtcbiAgICAgICAgICAgIGlmIChkaWZmX3RleHQgPT0gYmlncGF0Y2guZGlmZnNbMF1bMV0pIHtcbiAgICAgICAgICAgICAgYmlncGF0Y2guZGlmZnMuc2hpZnQoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGJpZ3BhdGNoLmRpZmZzWzBdWzFdID1cbiAgICAgICAgICAgICAgICAgIGJpZ3BhdGNoLmRpZmZzWzBdWzFdLnN1YnN0cmluZyhkaWZmX3RleHQubGVuZ3RoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gQ29tcHV0ZSB0aGUgaGVhZCBjb250ZXh0IGZvciB0aGUgbmV4dCBwYXRjaC5cbiAgICAgICAgcHJlY29udGV4dCA9IHRoaXMuZGlmZl90ZXh0MihwYXRjaC5kaWZmcyk7XG4gICAgICAgIHByZWNvbnRleHQgPVxuICAgICAgICAgICAgcHJlY29udGV4dC5zdWJzdHJpbmcocHJlY29udGV4dC5sZW5ndGggLSB0aGlzLlBhdGNoX01hcmdpbik7XG4gICAgICAgIC8vIEFwcGVuZCB0aGUgZW5kIGNvbnRleHQgZm9yIHRoaXMgcGF0Y2guXG4gICAgICAgIGNvbnN0IHBvc3Rjb250ZXh0ID0gdGhpcy5kaWZmX3RleHQxKGJpZ3BhdGNoLmRpZmZzKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnN1YnN0cmluZygwLCB0aGlzLlBhdGNoX01hcmdpbik7XG4gICAgICAgIGlmIChwb3N0Y29udGV4dCAhPT0gJycpIHtcbiAgICAgICAgICBwYXRjaC5sZW5ndGgxICs9IHBvc3Rjb250ZXh0Lmxlbmd0aDtcbiAgICAgICAgICBwYXRjaC5sZW5ndGgyICs9IHBvc3Rjb250ZXh0Lmxlbmd0aDtcbiAgICAgICAgICBpZiAocGF0Y2guZGlmZnMubGVuZ3RoICE9PSAwICYmXG4gICAgICAgICAgICAgIHBhdGNoLmRpZmZzW3BhdGNoLmRpZmZzLmxlbmd0aCAtIDFdWzBdID09PSBEaWZmT3AuRXF1YWwpIHtcbiAgICAgICAgICAgIHBhdGNoLmRpZmZzW3BhdGNoLmRpZmZzLmxlbmd0aCAtIDFdWzFdICs9IHBvc3Rjb250ZXh0O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwYXRjaC5kaWZmcy5wdXNoKFtEaWZmT3AuRXF1YWwsIHBvc3Rjb250ZXh0XSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghZW1wdHkpIHtcbiAgICAgICAgICBwYXRjaGVzLnNwbGljZSgrK3gsIDAsIHBhdGNoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcblxuXG4gIC8qKlxuICAgKiBUYWtlIGEgbGlzdCBvZiBwYXRjaGVzIGFuZCByZXR1cm4gYSB0ZXh0dWFsIHJlcHJlc2VudGF0aW9uLlxuICAgKiBAcGFyYW0gIHBhdGNoZXMgQXJyYXkgb2YgUGF0Y2ggb2JqZWN0cy5cbiAgICogQHJldHVybiAgVGV4dCByZXByZXNlbnRhdGlvbiBvZiBwYXRjaGVzLlxuICAgKi9cbiAgICBwYXRjaF90b1RleHQgKHBhdGNoZXM6IEFycmF5PHBhdGNoX29iaj4pIHtcbiAgICBjb25zdCB0ZXh0ID0gW107XG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBwYXRjaGVzLmxlbmd0aDsgeCsrKSB7XG4gICAgICB0ZXh0W3hdID0gcGF0Y2hlc1t4XTtcbiAgICB9XG4gICAgcmV0dXJuIHRleHQuam9pbignJyk7XG4gIH07XG5cblxuICAvKipcbiAgICogUGFyc2UgYSB0ZXh0dWFsIHJlcHJlc2VudGF0aW9uIG9mIHBhdGNoZXMgYW5kIHJldHVybiBhIGxpc3Qgb2YgUGF0Y2ggb2JqZWN0cy5cbiAgICogQHBhcmFtICB0ZXh0bGluZSBUZXh0IHJlcHJlc2VudGF0aW9uIG9mIHBhdGNoZXMuXG4gICAqIEByZXR1cm4gIEFycmF5IG9mIFBhdGNoIG9iamVjdHMuXG4gICAqIEB0aHJvd3MgeyFFcnJvcn0gSWYgaW52YWxpZCBpbnB1dC5cbiAgICovXG4gICAgcGF0Y2hfZnJvbVRleHQgKHRleHRsaW5lOiBzdHJpbmcpOiBBcnJheTxwYXRjaF9vYmo+IHtcbiAgICBjb25zdCBwYXRjaGVzOiBBcnJheTxwYXRjaF9vYmo+ID0gW107XG4gICAgaWYgKCF0ZXh0bGluZSkge1xuICAgICAgcmV0dXJuIHBhdGNoZXM7XG4gICAgfVxuICAgIGNvbnN0IHRleHQgPSB0ZXh0bGluZS5zcGxpdCgnXFxuJyk7XG4gICAgbGV0IHRleHRQb2ludGVyID0gMDtcbiAgICBjb25zdCBwYXRjaEhlYWRlciA9IC9eQEAgLShcXGQrKSw/KFxcZCopIFxcKyhcXGQrKSw/KFxcZCopIEBAJC87XG4gICAgd2hpbGUgKHRleHRQb2ludGVyIDwgdGV4dC5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IG0gPSB0ZXh0W3RleHRQb2ludGVyXS5tYXRjaChwYXRjaEhlYWRlcik7XG4gICAgICBpZiAoIW0pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHBhdGNoIHN0cmluZzogJyArIHRleHRbdGV4dFBvaW50ZXJdKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBhdGNoID0gbmV3IHBhdGNoX29iaigpO1xuICAgICAgcGF0Y2hlcy5wdXNoKHBhdGNoKTtcbiAgICAgIHBhdGNoLnN0YXJ0MSA9IHBhcnNlSW50KG1bMV0sIDEwKTtcbiAgICAgIGlmIChtWzJdID09PSAnJykge1xuICAgICAgICBwYXRjaC5zdGFydDEtLTtcbiAgICAgICAgcGF0Y2gubGVuZ3RoMSA9IDE7XG4gICAgICB9IGVsc2UgaWYgKG1bMl0gPT0gJzAnKSB7XG4gICAgICAgIHBhdGNoLmxlbmd0aDEgPSAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGF0Y2guc3RhcnQxLS07XG4gICAgICAgIHBhdGNoLmxlbmd0aDEgPSBwYXJzZUludChtWzJdLCAxMCk7XG4gICAgICB9XG5cbiAgICAgIHBhdGNoLnN0YXJ0MiA9IHBhcnNlSW50KG1bM10sIDEwKTtcbiAgICAgIGlmIChtWzRdID09PSAnJykge1xuICAgICAgICBwYXRjaC5zdGFydDItLTtcbiAgICAgICAgcGF0Y2gubGVuZ3RoMiA9IDE7XG4gICAgICB9IGVsc2UgaWYgKG1bNF0gPT0gJzAnKSB7XG4gICAgICAgIHBhdGNoLmxlbmd0aDIgPSAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGF0Y2guc3RhcnQyLS07XG4gICAgICAgIHBhdGNoLmxlbmd0aDIgPSBwYXJzZUludChtWzRdLCAxMCk7XG4gICAgICB9XG4gICAgICB0ZXh0UG9pbnRlcisrO1xuXG4gICAgICB3aGlsZSAodGV4dFBvaW50ZXIgPCB0ZXh0Lmxlbmd0aCkge1xuICAgICAgICBjb25zdCBzaWduID0gdGV4dFt0ZXh0UG9pbnRlcl0uY2hhckF0KDApO1xuICAgICAgICBsZXQgbGluZTogc3RyaW5nO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGxpbmUgPSBkZWNvZGVVUkkodGV4dFt0ZXh0UG9pbnRlcl0uc3Vic3RyaW5nKDEpKTtcbiAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAvLyBNYWxmb3JtZWQgVVJJIHNlcXVlbmNlLlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSWxsZWdhbCBlc2NhcGUgaW4gcGF0Y2hfZnJvbVRleHQ6ICcgKyBsaW5lKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2lnbiA9PSAnLScpIHtcbiAgICAgICAgICAvLyBEZWxldGlvbi5cbiAgICAgICAgICBwYXRjaC5kaWZmcy5wdXNoKFtEaWZmT3AuRGVsZXRlLCBsaW5lXSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2lnbiA9PSAnKycpIHtcbiAgICAgICAgICAvLyBJbnNlcnRpb24uXG4gICAgICAgICAgcGF0Y2guZGlmZnMucHVzaChbRGlmZk9wLkluc2VydCwgbGluZV0pO1xuICAgICAgICB9IGVsc2UgaWYgKHNpZ24gPT0gJyAnKSB7XG4gICAgICAgICAgLy8gTWlub3IgZXF1YWxpdHkuXG4gICAgICAgICAgcGF0Y2guZGlmZnMucHVzaChbRGlmZk9wLkVxdWFsLCBsaW5lXSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2lnbiA9PSAnQCcpIHtcbiAgICAgICAgICAvLyBTdGFydCBvZiBuZXh0IHBhdGNoLlxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9IGVsc2UgaWYgKHNpZ24gPT09ICcnKSB7XG4gICAgICAgICAgLy8gQmxhbmsgbGluZT8gIFdoYXRldmVyLlxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIFdURj9cbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcGF0Y2ggbW9kZSBcIicgKyBzaWduICsgJ1wiIGluOiAnICsgbGluZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGV4dFBvaW50ZXIrKztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHBhdGNoZXM7XG4gIH07XG5cbn1cblxuXG4vKipcbiAqIENsYXNzIHJlcHJlc2VudGluZyBvbmUgcGF0Y2ggb3BlcmF0aW9uLlxuXG4gKi9cbmV4cG9ydCBjbGFzcyBwYXRjaF9vYmoge1xuXG4gIGNvbnN0cnVjdG9yKCkgeyAgfVxuXG4gIGRpZmZzOiBBcnJheTxEaWZmPiA9IFtdO1xuICBzdGFydDE6IG51bWJlciA9IG51bGw7XG4gIHN0YXJ0MjogbnVtYmVyID0gbnVsbDtcbiAgbGVuZ3RoMTogbnVtYmVyID0gMDtcbiAgbGVuZ3RoMjogbnVtYmVyID0gMDtcblxuICAvKipcbiAgICogRW1tdWxhdGUgR05VIGRpZmYncyBmb3JtYXQuXG4gICAqIEhlYWRlcjogQEAgLTM4Miw4ICs0ODEsOSBAQFxuICAgKiBJbmRpY2llcyBhcmUgcHJpbnRlZCBhcyAxLWJhc2VkLCBub3QgMC1iYXNlZC5cbiAgICovXG4gIHRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgbGV0IGNvb3JkczEsIGNvb3JkczI7XG4gICAgaWYgKHRoaXMubGVuZ3RoMSA9PT0gMCkge1xuICAgICAgY29vcmRzMSA9IHRoaXMuc3RhcnQxICsgJywwJztcbiAgICB9IGVsc2UgaWYgKHRoaXMubGVuZ3RoMSA9PSAxKSB7XG4gICAgICBjb29yZHMxID0gdGhpcy5zdGFydDEgKyAxO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb29yZHMxID0gKHRoaXMuc3RhcnQxICsgMSkgKyAnLCcgKyB0aGlzLmxlbmd0aDE7XG4gICAgfVxuICAgIGlmICh0aGlzLmxlbmd0aDIgPT09IDApIHtcbiAgICAgIGNvb3JkczIgPSB0aGlzLnN0YXJ0MiArICcsMCc7XG4gICAgfSBlbHNlIGlmICh0aGlzLmxlbmd0aDIgPT0gMSkge1xuICAgICAgY29vcmRzMiA9IHRoaXMuc3RhcnQyICsgMTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29vcmRzMiA9ICh0aGlzLnN0YXJ0MiArIDEpICsgJywnICsgdGhpcy5sZW5ndGgyO1xuICAgIH1cbiAgICBjb25zdCB0ZXh0ID0gWydAQCAtJyArIGNvb3JkczEgKyAnICsnICsgY29vcmRzMiArICcgQEBcXG4nXTtcbiAgICBsZXQgb3A7XG4gICAgLy8gRXNjYXBlIHRoZSBib2R5IG9mIHRoZSBwYXRjaCB3aXRoICV4eCBub3RhdGlvbi5cbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHRoaXMuZGlmZnMubGVuZ3RoOyB4KyspIHtcbiAgICAgIHN3aXRjaCAodGhpcy5kaWZmc1t4XVswXSkge1xuICAgICAgICBjYXNlIERpZmZPcC5JbnNlcnQ6XG4gICAgICAgICAgb3AgPSAnKyc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgRGlmZk9wLkRlbGV0ZTpcbiAgICAgICAgICBvcCA9ICctJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBEaWZmT3AuRXF1YWw6XG4gICAgICAgICAgb3AgPSAnICc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICB0ZXh0W3ggKyAxXSA9IG9wICsgZW5jb2RlVVJJKHRoaXMuZGlmZnNbeF1bMV0pICsgJ1xcbic7XG4gICAgfVxuICAgIHJldHVybiB0ZXh0LmpvaW4oJycpLnJlcGxhY2UoLyUyMC9nLCAnICcpO1xuICB9XG59XG5cbmV4cG9ydCB7IERpZmZNYXRjaFBhdGNoIH07XG4iLCJpbXBvcnQgeyBJbmplY3RhYmxlLCBPbkluaXQgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IERpZmZNYXRjaFBhdGNoLCBEaWZmT3AgfSBmcm9tICcuL2RpZmZNYXRjaFBhdGNoJztcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIERpZmZNYXRjaFBhdGNoU2VydmljZSBpbXBsZW1lbnRzIE9uSW5pdCB7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBkbXA6IERpZmZNYXRjaFBhdGNoKSB7ICAgfVxuXG4gIG5nT25Jbml0ICgpIHtcblxuICB9XG5cbiAgZ2V0RGlmZihsZWZ0OiBzdHJpbmcsIHJpZ2h0OiBzdHJpbmcpIHtcbiAgICAgcmV0dXJuIHRoaXMuZG1wLmRpZmZfbWFpbihsZWZ0LCByaWdodCk7XG4gIH1cblxuICBnZXRTZW1hbnRpY0RpZmYobGVmdDogc3RyaW5nLCByaWdodDogc3RyaW5nKSB7XG4gICAgY29uc3QgZGlmZnMgPSB0aGlzLmRtcC5kaWZmX21haW4obGVmdCwgcmlnaHQpO1xuICAgIHRoaXMuZG1wLmRpZmZfY2xlYW51cFNlbWFudGljKGRpZmZzKTtcbiAgICByZXR1cm4gZGlmZnM7XG4gIH1cblxuICBnZXRQcm9jZXNzaW5nRGlmZihsZWZ0OiBzdHJpbmcsIHJpZ2h0OiBzdHJpbmcpIHtcbiAgICBjb25zdCBkaWZmcyA9IHRoaXMuZG1wLmRpZmZfbWFpbihsZWZ0LCByaWdodCk7XG4gICAgdGhpcy5kbXAuZGlmZl9jbGVhbnVwRWZmaWNpZW5jeShkaWZmcyk7XG4gICAgcmV0dXJuIGRpZmZzO1xuICB9XG5cbiAgZ2V0TGluZURpZmYobGVmdDogc3RyaW5nLCByaWdodDogc3RyaW5nKSB7XG4gICAgY29uc3QgY2hhcnMgPSB0aGlzLmRtcC5kaWZmX2xpbmVzVG9DaGFyc18obGVmdCwgcmlnaHQpO1xuICAgIGNvbnN0IGRpZmZzID0gdGhpcy5kbXAuZGlmZl9tYWluKGNoYXJzLmNoYXJzMSwgY2hhcnMuY2hhcnMyLCBmYWxzZSk7XG4gICAgdGhpcy5kbXAuZGlmZl9jaGFyc1RvTGluZXNfKGRpZmZzLCBjaGFycy5saW5lQXJyYXkpO1xuICAgIHJldHVybiBkaWZmcztcbiAgfVxuXG4gIGdldERtcCgpIHtcbiAgICByZXR1cm4gdGhpcy5kbXA7XG4gIH1cblxufVxuIiwiLyohICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbkNvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcclxudGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcclxuTGljZW5zZSBhdCBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcclxuXHJcblRISVMgQ09ERSBJUyBQUk9WSURFRCBPTiBBTiAqQVMgSVMqIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcclxuS0lORCwgRUlUSEVSIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIFdJVEhPVVQgTElNSVRBVElPTiBBTlkgSU1QTElFRFxyXG5XQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgVElUTEUsIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLFxyXG5NRVJDSEFOVEFCTElUWSBPUiBOT04tSU5GUklOR0VNRU5ULlxyXG5cclxuU2VlIHRoZSBBcGFjaGUgVmVyc2lvbiAyLjAgTGljZW5zZSBmb3Igc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zXHJcbmFuZCBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cclxuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogKi9cclxuLyogZ2xvYmFsIFJlZmxlY3QsIFByb21pc2UgKi9cclxuXHJcbnZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24oZCwgYikge1xyXG4gICAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxyXG4gICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcclxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcclxuICAgIHJldHVybiBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZXh0ZW5kcyhkLCBiKSB7XHJcbiAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XHJcbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX19hc3NpZ24gPSBmdW5jdGlvbigpIHtcclxuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiBfX2Fzc2lnbih0KSB7XHJcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XHJcbiAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XHJcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSkgdFtwXSA9IHNbcF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3Jlc3QocywgZSkge1xyXG4gICAgdmFyIHQgPSB7fTtcclxuICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSAmJiBlLmluZGV4T2YocCkgPCAwKVxyXG4gICAgICAgIHRbcF0gPSBzW3BdO1xyXG4gICAgaWYgKHMgIT0gbnVsbCAmJiB0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBwID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhzKTsgaSA8IHAubGVuZ3RoOyBpKyspIGlmIChlLmluZGV4T2YocFtpXSkgPCAwKVxyXG4gICAgICAgICAgICB0W3BbaV1dID0gc1twW2ldXTtcclxuICAgIHJldHVybiB0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xyXG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XHJcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xyXG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcGFyYW0ocGFyYW1JbmRleCwgZGVjb3JhdG9yKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwga2V5KSB7IGRlY29yYXRvcih0YXJnZXQsIGtleSwgcGFyYW1JbmRleCk7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fbWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpIHtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2F3YWl0ZXIodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XHJcbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHJlc3VsdC52YWx1ZSk7IH0pLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cclxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZ2VuZXJhdG9yKHRoaXNBcmcsIGJvZHkpIHtcclxuICAgIHZhciBfID0geyBsYWJlbDogMCwgc2VudDogZnVuY3Rpb24oKSB7IGlmICh0WzBdICYgMSkgdGhyb3cgdFsxXTsgcmV0dXJuIHRbMV07IH0sIHRyeXM6IFtdLCBvcHM6IFtdIH0sIGYsIHksIHQsIGc7XHJcbiAgICByZXR1cm4gZyA9IHsgbmV4dDogdmVyYigwKSwgXCJ0aHJvd1wiOiB2ZXJiKDEpLCBcInJldHVyblwiOiB2ZXJiKDIpIH0sIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiAoZ1tTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KSwgZztcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyByZXR1cm4gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHN0ZXAoW24sIHZdKTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gc3RlcChvcCkge1xyXG4gICAgICAgIGlmIChmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiR2VuZXJhdG9yIGlzIGFscmVhZHkgZXhlY3V0aW5nLlwiKTtcclxuICAgICAgICB3aGlsZSAoXykgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKGYgPSAxLCB5ICYmICh0ID0gb3BbMF0gJiAyID8geVtcInJldHVyblwiXSA6IG9wWzBdID8geVtcInRocm93XCJdIHx8ICgodCA9IHlbXCJyZXR1cm5cIl0pICYmIHQuY2FsbCh5KSwgMCkgOiB5Lm5leHQpICYmICEodCA9IHQuY2FsbCh5LCBvcFsxXSkpLmRvbmUpIHJldHVybiB0O1xyXG4gICAgICAgICAgICBpZiAoeSA9IDAsIHQpIG9wID0gW29wWzBdICYgMiwgdC52YWx1ZV07XHJcbiAgICAgICAgICAgIHN3aXRjaCAob3BbMF0pIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgMDogY2FzZSAxOiB0ID0gb3A7IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA0OiBfLmxhYmVsKys7IHJldHVybiB7IHZhbHVlOiBvcFsxXSwgZG9uZTogZmFsc2UgfTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNTogXy5sYWJlbCsrOyB5ID0gb3BbMV07IG9wID0gWzBdOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNzogb3AgPSBfLm9wcy5wb3AoKTsgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodCA9IF8udHJ5cywgdCA9IHQubGVuZ3RoID4gMCAmJiB0W3QubGVuZ3RoIC0gMV0pICYmIChvcFswXSA9PT0gNiB8fCBvcFswXSA9PT0gMikpIHsgXyA9IDA7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSAzICYmICghdCB8fCAob3BbMV0gPiB0WzBdICYmIG9wWzFdIDwgdFszXSkpKSB7IF8ubGFiZWwgPSBvcFsxXTsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDYgJiYgXy5sYWJlbCA8IHRbMV0pIHsgXy5sYWJlbCA9IHRbMV07IHQgPSBvcDsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodCAmJiBfLmxhYmVsIDwgdFsyXSkgeyBfLmxhYmVsID0gdFsyXTsgXy5vcHMucHVzaChvcCk7IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRbMl0pIF8ub3BzLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIF8udHJ5cy5wb3AoKTsgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgb3AgPSBib2R5LmNhbGwodGhpc0FyZywgXyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkgeyBvcCA9IFs2LCBlXTsgeSA9IDA7IH0gZmluYWxseSB7IGYgPSB0ID0gMDsgfVxyXG4gICAgICAgIGlmIChvcFswXSAmIDUpIHRocm93IG9wWzFdOyByZXR1cm4geyB2YWx1ZTogb3BbMF0gPyBvcFsxXSA6IHZvaWQgMCwgZG9uZTogdHJ1ZSB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19leHBvcnRTdGFyKG0sIGV4cG9ydHMpIHtcclxuICAgIGZvciAodmFyIHAgaW4gbSkgaWYgKCFleHBvcnRzLmhhc093blByb3BlcnR5KHApKSBleHBvcnRzW3BdID0gbVtwXTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fdmFsdWVzKG8pIHtcclxuICAgIHZhciBtID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9bU3ltYm9sLml0ZXJhdG9yXSwgaSA9IDA7XHJcbiAgICBpZiAobSkgcmV0dXJuIG0uY2FsbChvKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgbmV4dDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAobyAmJiBpID49IG8ubGVuZ3RoKSBvID0gdm9pZCAwO1xyXG4gICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogbyAmJiBvW2krK10sIGRvbmU6ICFvIH07XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcmVhZChvLCBuKSB7XHJcbiAgICB2YXIgbSA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvW1N5bWJvbC5pdGVyYXRvcl07XHJcbiAgICBpZiAoIW0pIHJldHVybiBvO1xyXG4gICAgdmFyIGkgPSBtLmNhbGwobyksIHIsIGFyID0gW10sIGU7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHdoaWxlICgobiA9PT0gdm9pZCAwIHx8IG4tLSA+IDApICYmICEociA9IGkubmV4dCgpKS5kb25lKSBhci5wdXNoKHIudmFsdWUpO1xyXG4gICAgfVxyXG4gICAgY2F0Y2ggKGVycm9yKSB7IGUgPSB7IGVycm9yOiBlcnJvciB9OyB9XHJcbiAgICBmaW5hbGx5IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAociAmJiAhci5kb25lICYmIChtID0gaVtcInJldHVyblwiXSkpIG0uY2FsbChpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZmluYWxseSB7IGlmIChlKSB0aHJvdyBlLmVycm9yOyB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYXI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZCgpIHtcclxuICAgIGZvciAodmFyIGFyID0gW10sIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIGFyID0gYXIuY29uY2F0KF9fcmVhZChhcmd1bWVudHNbaV0pKTtcclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXdhaXQodikge1xyXG4gICAgcmV0dXJuIHRoaXMgaW5zdGFuY2VvZiBfX2F3YWl0ID8gKHRoaXMudiA9IHYsIHRoaXMpIDogbmV3IF9fYXdhaXQodik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jR2VuZXJhdG9yKHRoaXNBcmcsIF9hcmd1bWVudHMsIGdlbmVyYXRvcikge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBnID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pLCBpLCBxID0gW107XHJcbiAgICByZXR1cm4gaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIpLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaWYgKGdbbl0pIGlbbl0gPSBmdW5jdGlvbiAodikgeyByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKGEsIGIpIHsgcS5wdXNoKFtuLCB2LCBhLCBiXSkgPiAxIHx8IHJlc3VtZShuLCB2KTsgfSk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHJlc3VtZShuLCB2KSB7IHRyeSB7IHN0ZXAoZ1tuXSh2KSk7IH0gY2F0Y2ggKGUpIHsgc2V0dGxlKHFbMF1bM10sIGUpOyB9IH1cclxuICAgIGZ1bmN0aW9uIHN0ZXAocikgeyByLnZhbHVlIGluc3RhbmNlb2YgX19hd2FpdCA/IFByb21pc2UucmVzb2x2ZShyLnZhbHVlLnYpLnRoZW4oZnVsZmlsbCwgcmVqZWN0KSA6IHNldHRsZShxWzBdWzJdLCByKTsgfVxyXG4gICAgZnVuY3Rpb24gZnVsZmlsbCh2YWx1ZSkgeyByZXN1bWUoXCJuZXh0XCIsIHZhbHVlKTsgfVxyXG4gICAgZnVuY3Rpb24gcmVqZWN0KHZhbHVlKSB7IHJlc3VtZShcInRocm93XCIsIHZhbHVlKTsgfVxyXG4gICAgZnVuY3Rpb24gc2V0dGxlKGYsIHYpIHsgaWYgKGYodiksIHEuc2hpZnQoKSwgcS5sZW5ndGgpIHJlc3VtZShxWzBdWzBdLCBxWzBdWzFdKTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hc3luY0RlbGVnYXRvcihvKSB7XHJcbiAgICB2YXIgaSwgcDtcclxuICAgIHJldHVybiBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiwgZnVuY3Rpb24gKGUpIHsgdGhyb3cgZTsgfSksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4sIGYpIHsgaVtuXSA9IG9bbl0gPyBmdW5jdGlvbiAodikgeyByZXR1cm4gKHAgPSAhcCkgPyB7IHZhbHVlOiBfX2F3YWl0KG9bbl0odikpLCBkb25lOiBuID09PSBcInJldHVyblwiIH0gOiBmID8gZih2KSA6IHY7IH0gOiBmOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jVmFsdWVzKG8pIHtcclxuICAgIGlmICghU3ltYm9sLmFzeW5jSXRlcmF0b3IpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJTeW1ib2wuYXN5bmNJdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbiAgICB2YXIgbSA9IG9bU3ltYm9sLmFzeW5jSXRlcmF0b3JdLCBpO1xyXG4gICAgcmV0dXJuIG0gPyBtLmNhbGwobykgOiAobyA9IHR5cGVvZiBfX3ZhbHVlcyA9PT0gXCJmdW5jdGlvblwiID8gX192YWx1ZXMobykgOiBvW1N5bWJvbC5pdGVyYXRvcl0oKSwgaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIpLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGkpO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IGlbbl0gPSBvW25dICYmIGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7IHYgPSBvW25dKHYpLCBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCB2LmRvbmUsIHYudmFsdWUpOyB9KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gc2V0dGxlKHJlc29sdmUsIHJlamVjdCwgZCwgdikgeyBQcm9taXNlLnJlc29sdmUodikudGhlbihmdW5jdGlvbih2KSB7IHJlc29sdmUoeyB2YWx1ZTogdiwgZG9uZTogZCB9KTsgfSwgcmVqZWN0KTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19tYWtlVGVtcGxhdGVPYmplY3QoY29va2VkLCByYXcpIHtcclxuICAgIGlmIChPYmplY3QuZGVmaW5lUHJvcGVydHkpIHsgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNvb2tlZCwgXCJyYXdcIiwgeyB2YWx1ZTogcmF3IH0pOyB9IGVsc2UgeyBjb29rZWQucmF3ID0gcmF3OyB9XHJcbiAgICByZXR1cm4gY29va2VkO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0U3Rhcihtb2QpIHtcclxuICAgIGlmIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpIHJldHVybiBtb2Q7XHJcbiAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICBpZiAobW9kICE9IG51bGwpIGZvciAodmFyIGsgaW4gbW9kKSBpZiAoT2JqZWN0Lmhhc093blByb3BlcnR5LmNhbGwobW9kLCBrKSkgcmVzdWx0W2tdID0gbW9kW2tdO1xyXG4gICAgcmVzdWx0LmRlZmF1bHQgPSBtb2Q7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19pbXBvcnREZWZhdWx0KG1vZCkge1xyXG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBkZWZhdWx0OiBtb2QgfTtcclxufVxyXG4iLCJpbXBvcnQgeyBDb21wb25lbnQsIElucHV0LCBPbkluaXQsIE9uQ2hhbmdlcyB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgRGlmZiwgRGlmZk9wIH0gZnJvbSAnLi9kaWZmTWF0Y2hQYXRjaCc7XG5pbXBvcnQgeyBEaWZmTWF0Y2hQYXRjaFNlcnZpY2UgfSBmcm9tICcuL2RpZmZNYXRjaFBhdGNoLnNlcnZpY2UnO1xuXG4vKiBIb2xkcyB0aGUgc3RhdGUgb2YgdGhlIGNhbGN1bGF0aW9uIG9mIHRoZSBkaWZmIHJlc3VsdCB3ZSBpbnRlbmQgdG8gZGlzcGxheS5cbiAqICA+IGxpbmVzIGNvbnRhaW5zIHRoZSBkYXRhIHRoYXQgd2lsbCBiZSBkaXNwbGF5ZWQgb24gc2NyZWVuLlxuICogID4gbGluZUxlZnQga2VlcHMgdHJhY2sgb2YgdGhlIGRvY3VtZW50IGxpbmUgbnVtYmVyIGluIHRoZSBbbGVmdF0gaW5wdXQuXG4gKiAgPiBsaW5lUmlnaHQga2VlcHMgdHJhY2sgb2YgdGhlIGRvY3VtZW50IGxpbmUgbnVtYmVyIGluIHRoZSBbcmlnaHRdIGlucHV0LlxuICovXG50eXBlIERpZmZDYWxjdWxhdGlvbiA9IHtcbiAgbGluZXM6IEFycmF5PFtzdHJpbmcsIHN0cmluZywgc3RyaW5nLCBzdHJpbmddPixcbiAgbGluZUxlZnQ6IG51bWJlcixcbiAgbGluZVJpZ2h0OiBudW1iZXJcbn07XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2RtcC1saW5lLWNvbXBhcmUnLFxuICBzdHlsZXM6IFtgXG4gICAgZGl2LmRtcC1saW5lLWNvbXBhcmUge1xuICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgIGZsZXgtZGlyZWN0aW9uOiByb3c7XG4gICAgICBib3JkZXI6IDFweCBzb2xpZCAjODA4MDgwO1xuICAgICAgZm9udC1mYW1pbHk6IENvbnNvbGFzLCBDb3VyaWVyLCBtb25vc3BhY2U7XG4gICAgICB3aWR0aDogOTExcHg7XG4gICAgfVxuICAgIGRpdi5kbXAtbGluZS1jb21wYXJlLW1hcmdpbiB7XG4gICAgICB3aWR0aDogMTAxcHg7XG4gICAgfVxuICAgIGRpdi5kbXAtbGluZS1jb21wYXJlLWNvbnRlbnQge1xuICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgICAgdG9wOiAwcHg7XG4gICAgICBsZWZ0OiAwcHg7XG4gICAgICBmbGV4LWdyb3c6IDE7XG4gICAgICBvdmVyZmxvdy14OiBzY3JvbGw7XG4gICAgfVxuICAgIGRpdi5kbXAtbGluZS1jb21wYXJlLWNvbnRlbnQtd3JhcHBlciB7XG4gICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICB0b3A6IDBweDtcbiAgICAgIGxlZnQ6IDBweDtcbiAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgYWxpZ24taXRlbXM6IHN0cmV0Y2g7XG4gICAgfVxuICAgIGRpdi5kbXAtbGluZS1jb21wYXJlLWxlZnQge1xuICAgICAgd2lkdGg6IDUwcHg7XG4gICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgICBjb2xvcjogIzQ4NDg0ODtcbiAgICB9XG4gICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtZXF1YWw+ZGl2LmRtcC1saW5lLWNvbXBhcmUtbGVmdCxcbiAgICAgIGRpdi5kbXAtbGluZS1jb21wYXJlLWVxdWFsPmRpdi5kbXAtbGluZS1jb21wYXJlLXJpZ2h0IHtcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICNkZWRlZGU7XG4gICAgfVxuICAgIGRpdi5kbXAtbGluZS1jb21wYXJlLWluc2VydD5kaXYuZG1wLWxpbmUtY29tcGFyZS1sZWZ0LFxuICAgICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtaW5zZXJ0PmRpdi5kbXAtbGluZS1jb21wYXJlLXJpZ2h0IHtcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICM4YmZiNmY7XG4gICAgfVxuICAgIGRpdi5kbXAtbGluZS1jb21wYXJlLWRlbGV0ZT5kaXYuZG1wLWxpbmUtY29tcGFyZS1sZWZ0LFxuICAgICAgZGl2LmRtcC1saW5lLWNvbXBhcmUtZGVsZXRlPmRpdi5kbXAtbGluZS1jb21wYXJlLXJpZ2h0IHtcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmNTY4Njg7XG4gICAgfVxuICAgIGRpdi5kbXAtbGluZS1jb21wYXJlLXJpZ2h0IHtcbiAgICAgIHdpZHRoOiA1MHB4O1xuICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgY29sb3I6ICM0ODQ4NDg7XG4gICAgICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCAjODg4ODg4O1xuICAgIH1cbiAgICBkaXYuZG1wLWxpbmUtY29tcGFyZS10ZXh0IHtcbiAgICAgIHdoaXRlLXNwYWNlOiBwcmU7XG4gICAgICBwYWRkaW5nLWxlZnQ6IDEwcHg7XG4gICAgICBtaW4td2lkdGg6IDgwMHB4O1xuICAgIH1cbiAgICAuZG1wLWxpbmUtY29tcGFyZS1kZWxldGUge1xuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmOGM4YztcbiAgICB9XG4gICAgLmRtcC1saW5lLWNvbXBhcmUtaW5zZXJ0IHtcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICM5ZGZmOTc7XG4gICAgfVxuICAgIC5kbXAtbGluZS1jb21wYXJlLWRlbGV0ZT5kaXYge1xuICAgICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICAgIH0gIFxuICAgIC5kbXAtbGluZS1jb21wYXJlLWluc2VydD5kaXYge1xuICAgICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICAgIH1cbiAgICAuZG1wLWxpbmUtY29tcGFyZS1lcXVhbD5kaXYge1xuICAgICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICAgIH1cbiAgICAuZG1wLW1hcmdpbi1ib3R0b20tc3BhY2VyIHtcbiAgICAgIGhlaWdodDogMjBweDtcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICNkZWRlZGU7XG4gICAgICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCAjODg4ODg4O1xuICAgIH1cbiAgYF0sXG4gIHRlbXBsYXRlOiBgXG4gICAgPGRpdiBjbGFzcz1cImRtcC1saW5lLWNvbXBhcmUtbm8tY2hhbmdlcy10ZXh0XCIgKm5nSWY9XCJpc0NvbnRlbnRFcXVhbFwiPlxuICAgICAgVGhlcmUgYXJlIG5vIGNoYW5nZXMgdG8gZGlzcGxheS5cbiAgICA8L2Rpdj4gICAgXG4gICAgPGRpdiBjbGFzcz1cImRtcC1saW5lLWNvbXBhcmVcIiAqbmdJZj1cIiFpc0NvbnRlbnRFcXVhbFwiPlxuICAgICAgPGRpdiBjbGFzcz1cImRtcC1saW5lLWNvbXBhcmUtbWFyZ2luXCI+XG4gICAgICAgIDxkaXYgW25nQ2xhc3NdPVwibGluZURpZmZbMF1cIiAqbmdGb3I9XCJsZXQgbGluZURpZmYgb2YgY2FsY3VsYXRlZERpZmZcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiZG1wLWxpbmUtY29tcGFyZS1sZWZ0XCI+e3tsaW5lRGlmZlsxXX19PC9kaXY+PCEtLSBObyBzcGFjZVxuICAgICAgICAtLT48ZGl2IGNsYXNzPVwiZG1wLWxpbmUtY29tcGFyZS1yaWdodFwiPnt7bGluZURpZmZbMl19fTwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImRtcC1tYXJnaW4tYm90dG9tLXNwYWNlclwiPjwvZGl2PlxuICAgICAgPC9kaXY+PCEtLSBObyBzcGFjZVxuICAgLS0+PGRpdiBjbGFzcz1cImRtcC1saW5lLWNvbXBhcmUtY29udGVudFwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZG1wLWxpbmUtY29tcGFyZS1jb250ZW50LXdyYXBwZXJcIj5cbiAgICAgICAgICA8ZGl2IFtuZ0NsYXNzXT1cImxpbmVEaWZmWzBdXCIgKm5nRm9yPVwibGV0IGxpbmVEaWZmIG9mIGNhbGN1bGF0ZWREaWZmXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZG1wLWxpbmUtY29tcGFyZS10ZXh0XCI+e3tsaW5lRGlmZlszXX19PC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIGBcbn0pXG5leHBvcnQgY2xhc3MgTGluZUNvbXBhcmVDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQsIE9uQ2hhbmdlcyB7XG4gIEBJbnB1dCgpXG4gIHB1YmxpYyBsZWZ0OiBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuO1xuICBASW5wdXQoKVxuICBwdWJsaWMgcmlnaHQ6IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW47XG4gIC8vIFRoZSBudW1iZXIgb2YgbGluZXMgb2YgY29udGV4dCB0byBwcm92aWRlIGVpdGhlciBzaWRlIG9mIGEgRGlmZk9wLkluc2VydCBvciBEaWZmT3AuRGVsZXRlIGRpZmYuXG4gIC8vIENvbnRleHQgaXMgdGFrZW4gZnJvbSBhIERpZmZPcC5FcXVhbCBzZWN0aW9uLlxuICBASW5wdXQoKVxuICBwdWJsaWMgbGluZUNvbnRleHRTaXplOiBudW1iZXI7XG5cbiAgcHVibGljIGNhbGN1bGF0ZWREaWZmOiBBcnJheTxbc3RyaW5nLCBzdHJpbmcsIHN0cmluZywgc3RyaW5nXT47XG4gIHB1YmxpYyBpc0NvbnRlbnRFcXVhbDogYm9vbGVhbjtcblxuICBwdWJsaWMgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIGRtcDogRGlmZk1hdGNoUGF0Y2hTZXJ2aWNlKSB7fVxuXG4gIHB1YmxpYyBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLnVwZGF0ZUh0bWwoKTtcbiAgfVxuXG4gIHB1YmxpYyBuZ09uQ2hhbmdlcygpOiB2b2lkIHtcbiAgICB0aGlzLnVwZGF0ZUh0bWwoKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlSHRtbCgpOiB2b2lkIHtcbiAgICBpZiAodHlwZW9mIHRoaXMubGVmdCA9PT0gJ251bWJlcicgfHwgdHlwZW9mIHRoaXMubGVmdCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICB0aGlzLmxlZnQgPSB0aGlzLmxlZnQudG9TdHJpbmcoKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB0aGlzLnJpZ2h0ID09PSAnbnVtYmVyJyB8fCB0eXBlb2YgdGhpcy5yaWdodCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICB0aGlzLnJpZ2h0ID0gdGhpcy5yaWdodC50b1N0cmluZygpO1xuICAgIH1cbiAgICB0aGlzLmNhbGN1bGF0ZUxpbmVEaWZmKHRoaXMuZG1wLmdldExpbmVEaWZmKHRoaXMubGVmdCwgdGhpcy5yaWdodCkpO1xuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVMaW5lRGlmZihkaWZmczogQXJyYXk8RGlmZj4pOiB2b2lkIHtcbiAgICBjb25zdCBkaWZmQ2FsY3VsYXRpb246IERpZmZDYWxjdWxhdGlvbiA9IHtcbiAgICAgIGxpbmVzOiBbXSxcbiAgICAgIGxpbmVMZWZ0OiAxLFxuICAgICAgbGluZVJpZ2h0OiAxXG4gICAgfTtcblxuICAgIHRoaXMuaXNDb250ZW50RXF1YWwgPSBkaWZmcy5sZW5ndGggPT09IDEgJiYgZGlmZnNbMF1bMF0gPT09IERpZmZPcC5FcXVhbDtcbiAgICBpZiAodGhpcy5pc0NvbnRlbnRFcXVhbCkge1xuICAgICAgdGhpcy5jYWxjdWxhdGVkRGlmZiA9IFtdO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGlmZnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRpZmYgPSBkaWZmc1tpXTtcbiAgICAgIGxldCBkaWZmTGluZXM6IHN0cmluZ1tdID0gZGlmZlsxXS5zcGxpdCgvXFxyP1xcbi8pO1xuXG4gICAgICAvLyBJZiB0aGUgb3JpZ2luYWwgbGluZSBoYWQgYSBcXHJcXG4gYXQgdGhlIGVuZCB0aGVuIHJlbW92ZSB0aGVcbiAgICAgIC8vIGVtcHR5IHN0cmluZyBhZnRlciBpdC5cbiAgICAgIGlmIChkaWZmTGluZXNbZGlmZkxpbmVzLmxlbmd0aCAtIDFdLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIGRpZmZMaW5lcy5wb3AoKTtcbiAgICAgIH1cblxuICAgICAgc3dpdGNoIChkaWZmWzBdKSB7XG4gICAgICAgIGNhc2UgRGlmZk9wLkVxdWFsOiB7XG4gICAgICAgICAgY29uc3QgaXNGaXJzdERpZmYgPSBpID09PSAwO1xuICAgICAgICAgIGNvbnN0IGlzTGFzdERpZmYgPSBpID09PSBkaWZmcy5sZW5ndGggLSAxO1xuICAgICAgICAgIHRoaXMub3V0cHV0RXF1YWxEaWZmKGRpZmZMaW5lcywgZGlmZkNhbGN1bGF0aW9uLCBpc0ZpcnN0RGlmZiwgaXNMYXN0RGlmZik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBEaWZmT3AuRGVsZXRlOiB7XG4gICAgICAgICAgdGhpcy5vdXRwdXREZWxldGVEaWZmKGRpZmZMaW5lcywgZGlmZkNhbGN1bGF0aW9uKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIERpZmZPcC5JbnNlcnQ6IHtcbiAgICAgICAgICB0aGlzLm91dHB1dEluc2VydERpZmYoZGlmZkxpbmVzLCBkaWZmQ2FsY3VsYXRpb24pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5jYWxjdWxhdGVkRGlmZiA9IGRpZmZDYWxjdWxhdGlvbi5saW5lcztcbiAgfVxuXG4gIC8qIElmIHRoZSBudW1iZXIgb2YgZGlmZkxpbmVzIGlzIGdyZWF0ZXIgdGhhbiBsaW5lQ29udGV4dFNpemUgdGhlbiB3ZSBtYXkgbmVlZCB0byBhZGp1c3QgdGhlIGRpZmZcbiAgICogdGhhdCBpcyBvdXRwdXQuXG4gICAqICAgPiBJZiB0aGUgZmlyc3QgZGlmZiBvZiBhIGRvY3VtZW50IGlzIERpZmZPcC5FcXVhbCB0aGVuIHRoZSBsZWFkaW5nIGxpbmVzIGNhbiBiZSBkcm9wcGVkXG4gICAqICAgICBsZWF2aW5nIHRoZSBsYXN0ICdsaW5lQ29udGV4dFNpemUnIGxpbmVzIGZvciBjb250ZXh0LlxuICAgKiAgID4gSWYgdGhlIGxhc3QgZGlmZiBvZiBhIGRvY3VtZW50IGlzIERpZmZPcC5FcXVhbCB0aGVuIHRoZSB0cmFpbGluZyBsaW5lcyBjYW4gYmUgZHJvcHBlZFxuICAgKiAgICAgbGVhdmluZyB0aGUgZmlyc3QgJ2xpbmVDb250ZXh0U2l6ZScgbGluZXMgZm9yIGNvbnRleHQuXG4gICAqICAgPiBJZiB0aGUgZGlmZiBpcyBhIERpZmZPcC5FcXVhbCBvY2N1cnMgaW4gdGhlIG1pZGRsZSB0aGVuIHRoZSBkaWZmcyBlaXRoZXIgc2lkZSBvZiBpdCBtdXN0IGJlXG4gICAqICAgICBEaWZmT3AuSW5zZXJ0IG9yIERpZmZPcC5EZWxldGUuIElmIGl0IGhhcyBtb3JlIHRoYW4gMiAqICdsaW5lQ29udGV4dFNpemUnIGxpbmVzIG9mIGNvbnRlbnRcbiAgICogICAgIHRoZW4gdGhlIG1pZGRsZSBsaW5lcyBhcmUgZHJvcHBlZCBsZWF2aW5nIHRoZSBmaXJzdCAnbGluZUNvbnRleHRTaXplJyBhbmQgbGFzdCAnbGluZUNvbnRleHRTaXplJ1xuICAgKiAgICAgbGluZXMgZm9yIGNvbnRleHQuIEEgc3BlY2lhbCBsaW5lIGlzIGluc2VydGVkIHdpdGggJy4uLicgaW5kaWNhdGluZyB0aGF0IGNvbnRlbnQgaXMgc2tpcHBlZC5cbiAgICpcbiAgICogQSBkb2N1bWVudCBjYW5ub3QgY29uc2lzdCBvZiBhIHNpbmdsZSBEaWZmIHdpdGggRGlmZk9wLkVxdWFsIGFuZCByZWFjaCB0aGlzIGZ1bmN0aW9uIGJlY2F1c2VcbiAgICogaW4gdGhpcyBjYXNlIHRoZSBjYWxjdWxhdGVMaW5lRGlmZiBtZXRob2QgcmV0dXJucyBlYXJseS5cbiAgICovXG4gIHByaXZhdGUgb3V0cHV0RXF1YWxEaWZmKFxuICAgICAgZGlmZkxpbmVzOiBzdHJpbmdbXSxcbiAgICAgIGRpZmZDYWxjdWxhdGlvbjogRGlmZkNhbGN1bGF0aW9uLFxuICAgICAgaXNGaXJzdERpZmY6IGJvb2xlYW4sXG4gICAgICBpc0xhc3REaWZmOiBib29sZWFuKTogdm9pZCB7XG4gICAgaWYgKHRoaXMubGluZUNvbnRleHRTaXplICYmIGRpZmZMaW5lcy5sZW5ndGggPiB0aGlzLmxpbmVDb250ZXh0U2l6ZSkge1xuICAgICAgaWYgKGlzRmlyc3REaWZmKSB7XG4gICAgICAgIC8vIFRha2UgdGhlIGxhc3QgJ2xpbmVDb250ZXh0U2l6ZScgbGluZXMgZnJvbSB0aGUgZmlyc3QgZGlmZlxuICAgICAgICBjb25zdCBsaW5lSW5jcmVtZW50ID0gZGlmZkxpbmVzLmxlbmd0aCAtIHRoaXMubGluZUNvbnRleHRTaXplO1xuICAgICAgICBkaWZmQ2FsY3VsYXRpb24ubGluZUxlZnQgKz0gbGluZUluY3JlbWVudDtcbiAgICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVSaWdodCArPSBsaW5lSW5jcmVtZW50O1xuICAgICAgICBkaWZmTGluZXMgPSBkaWZmTGluZXMuc2xpY2UoZGlmZkxpbmVzLmxlbmd0aCAtIHRoaXMubGluZUNvbnRleHRTaXplLCBkaWZmTGluZXMubGVuZ3RoKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGlzTGFzdERpZmYpIHtcbiAgICAgICAgLy8gVGFrZSBvbmx5IHRoZSBmaXJzdCAnbGluZUNvbnRleHRTaXplJyBsaW5lcyBmcm9tIHRoZSBmaW5hbCBkaWZmXG4gICAgICAgIGRpZmZMaW5lcyA9IGRpZmZMaW5lcy5zbGljZSgwLCB0aGlzLmxpbmVDb250ZXh0U2l6ZSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChkaWZmTGluZXMubGVuZ3RoID4gMiAqIHRoaXMubGluZUNvbnRleHRTaXplKSB7XG4gICAgICAgIC8vIFRha2UgdGhlIGZpcnN0ICdsaW5lQ29udGV4dFNpemUnIGxpbmVzIGZyb20gdGhpcyBkaWZmIHRvIHByb3ZpZGUgY29udGV4dCBmb3IgdGhlIGxhc3QgZGlmZlxuICAgICAgICB0aGlzLm91dHB1dEVxdWFsRGlmZkxpbmVzKGRpZmZMaW5lcy5zbGljZSgwLCB0aGlzLmxpbmVDb250ZXh0U2l6ZSksIGRpZmZDYWxjdWxhdGlvbik7XG5cbiAgICAgICAgLy8gT3V0cHV0IGEgc3BlY2lhbCBsaW5lIGluZGljYXRpbmcgdGhhdCBzb21lIGNvbnRlbnQgaXMgZXF1YWwgYW5kIGhhcyBiZWVuIHNraXBwZWRcbiAgICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVzLnB1c2goWydkbXAtbGluZS1jb21wYXJlLWVxdWFsJywgJy4uLicsICcuLi4nLCAnLi4uJ10pO1xuICAgICAgICBjb25zdCBudW1iZXJPZlNraXBwZWRMaW5lcyA9IGRpZmZMaW5lcy5sZW5ndGggLSAoMiAqIHRoaXMubGluZUNvbnRleHRTaXplKTtcbiAgICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVMZWZ0ICs9IG51bWJlck9mU2tpcHBlZExpbmVzO1xuICAgICAgICBkaWZmQ2FsY3VsYXRpb24ubGluZVJpZ2h0ICs9IG51bWJlck9mU2tpcHBlZExpbmVzO1xuXG4gICAgICAgIC8vIFRha2UgdGhlIGxhc3QgJ2xpbmVDb250ZXh0U2l6ZScgbGluZXMgZnJvbSB0aGlzIGRpZmYgdG8gcHJvdmlkZSBjb250ZXh0IGZvciB0aGUgbmV4dCBkaWZmXG4gICAgICAgIHRoaXMub3V0cHV0RXF1YWxEaWZmTGluZXMoZGlmZkxpbmVzLnNsaWNlKGRpZmZMaW5lcy5sZW5ndGggLSB0aGlzLmxpbmVDb250ZXh0U2l6ZSksIGRpZmZDYWxjdWxhdGlvbik7XG4gICAgICAgIC8vIFRoaXMgaWYgYnJhbmNoIGhhcyBhbHJlYWR5IG91dHB1dCB0aGUgZGlmZiBsaW5lcyBzbyB3ZSByZXR1cm4gZWFybHkgdG8gYXZvaWQgb3V0cHV0dGluZyB0aGUgbGluZXNcbiAgICAgICAgLy8gYXQgdGhlIGVuZCBvZiB0aGUgbWV0aG9kLlxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMub3V0cHV0RXF1YWxEaWZmTGluZXMoZGlmZkxpbmVzLCBkaWZmQ2FsY3VsYXRpb24pO1xuICB9XG5cbiAgcHJpdmF0ZSBvdXRwdXRFcXVhbERpZmZMaW5lcyhcbiAgICAgIGRpZmZMaW5lczogc3RyaW5nW10sXG4gICAgICBkaWZmQ2FsY3VsYXRpb246IERpZmZDYWxjdWxhdGlvbik6IHZvaWQge1xuICAgIGZvciAoY29uc3QgbGluZSBvZiBkaWZmTGluZXMpIHtcbiAgICAgIGRpZmZDYWxjdWxhdGlvbi5saW5lcy5wdXNoKFsnZG1wLWxpbmUtY29tcGFyZS1lcXVhbCcsIGAke2RpZmZDYWxjdWxhdGlvbi5saW5lTGVmdH1gLCBgJHtkaWZmQ2FsY3VsYXRpb24ubGluZVJpZ2h0fWAsIGxpbmVdKTtcbiAgICAgIGRpZmZDYWxjdWxhdGlvbi5saW5lTGVmdCsrO1xuICAgICAgZGlmZkNhbGN1bGF0aW9uLmxpbmVSaWdodCsrO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb3V0cHV0RGVsZXRlRGlmZihcbiAgICAgIGRpZmZMaW5lczogc3RyaW5nW10sXG4gICAgICBkaWZmQ2FsY3VsYXRpb246IERpZmZDYWxjdWxhdGlvbik6IHZvaWQge1xuICAgIGZvciAoY29uc3QgbGluZSBvZiBkaWZmTGluZXMpIHtcbiAgICAgIGRpZmZDYWxjdWxhdGlvbi5saW5lcy5wdXNoKFsnZG1wLWxpbmUtY29tcGFyZS1kZWxldGUnLCBgJHtkaWZmQ2FsY3VsYXRpb24ubGluZUxlZnR9YCwgJy0nLCBsaW5lXSk7XG4gICAgICBkaWZmQ2FsY3VsYXRpb24ubGluZUxlZnQrKztcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG91dHB1dEluc2VydERpZmYoXG4gICAgICBkaWZmTGluZXM6IHN0cmluZ1tdLFxuICAgICAgZGlmZkNhbGN1bGF0aW9uOiBEaWZmQ2FsY3VsYXRpb24pOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IGxpbmUgb2YgZGlmZkxpbmVzKSB7XG4gICAgICBkaWZmQ2FsY3VsYXRpb24ubGluZXMucHVzaChbJ2RtcC1saW5lLWNvbXBhcmUtaW5zZXJ0JywgJy0nLCBgJHtkaWZmQ2FsY3VsYXRpb24ubGluZVJpZ2h0fWAsIGxpbmVdKTtcbiAgICAgIGRpZmZDYWxjdWxhdGlvbi5saW5lUmlnaHQrKztcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IERpcmVjdGl2ZSwgRWxlbWVudFJlZiwgSW5wdXQsIE9uSW5pdCwgT25DaGFuZ2VzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBEaWZmTWF0Y2hQYXRjaFNlcnZpY2UgfSBmcm9tICcuL2RpZmZNYXRjaFBhdGNoLnNlcnZpY2UnO1xuaW1wb3J0IHsgRGlmZiwgRGlmZk9wIH0gZnJvbSAnLi9kaWZmTWF0Y2hQYXRjaCc7XG5cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tkaWZmXSdcbn0pXG5leHBvcnQgY2xhc3MgRGlmZkRpcmVjdGl2ZSBpbXBsZW1lbnRzIE9uSW5pdCwgT25DaGFuZ2VzIHtcblxuICBASW5wdXQoKSBsZWZ0OiBzdHJpbmc7XG4gIEBJbnB1dCgpIHJpZ2h0OiBzdHJpbmc7XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgZWw6IEVsZW1lbnRSZWYsXG4gICAgcHJpdmF0ZSBkbXA6IERpZmZNYXRjaFBhdGNoU2VydmljZSkgeyAgfVxuXG4gIHB1YmxpYyBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLnVwZGF0ZUh0bWwoKTtcbiAgfVxuXG4gIHB1YmxpYyBuZ09uQ2hhbmdlcygpOiB2b2lkIHtcbiAgICB0aGlzLnVwZGF0ZUh0bWwoKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlSHRtbCgpOiB2b2lkIHtcbiAgICB0aGlzLmVsLm5hdGl2ZUVsZW1lbnQuaW5uZXJIVE1MID0gdGhpcy5jcmVhdGVIdG1sKFxuICAgICAgdGhpcy5kbXAuZ2V0RGlmZih0aGlzLmxlZnQsIHRoaXMucmlnaHQpKTtcbiAgfVxuICBcbiAgcHJpdmF0ZSBjcmVhdGVIdG1sKGRpZmZzOiBBcnJheTxEaWZmPik6IHN0cmluZyB7XG4gICAgbGV0IGh0bWw6IHN0cmluZztcbiAgICBodG1sID0gJzxkaXY+JztcbiAgICBmb3IobGV0IGRpZmYgb2YgZGlmZnMpIHtcbiAgICAgIGRpZmZbMV0gPSBkaWZmWzFdLnJlcGxhY2UoL1xcbi9nLCAnPGJyLz4nKTtcblxuICAgICAgaWYoZGlmZlswXSA9PT0gRGlmZk9wLkVxdWFsKSB7XG4gICAgICAgIGh0bWwgKz0gJzxzcGFuIGNsYXNzPVwiZXF1YWxcIj4nICsgZGlmZlsxXSArICc8L3NwYW4+JztcbiAgICAgIH1cbiAgICAgIGlmKGRpZmZbMF0gPT09IERpZmZPcC5EZWxldGUpIHtcbiAgICAgICAgaHRtbCArPSAnPGRlbD4nICsgZGlmZlsxXSArICc8L2RlbD4nO1xuICAgICAgfVxuICAgICAgaWYoZGlmZlswXSA9PT0gRGlmZk9wLkluc2VydCkge1xuICAgICAgICBodG1sICs9ICc8aW5zPicgKyBkaWZmWzFdICsgJzwvaW5zPic7XG4gICAgICB9XG4gICAgfVxuICAgIGh0bWwgKz0gJzwvZGl2Pic7XG4gICAgcmV0dXJuIGh0bWw7XG4gIH1cbn1cbiIsImltcG9ydCB7IERpcmVjdGl2ZSwgRWxlbWVudFJlZiwgSW5wdXQsIE9uSW5pdCwgT25DaGFuZ2VzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBEaWZmTWF0Y2hQYXRjaFNlcnZpY2UgfSBmcm9tICcuL2RpZmZNYXRjaFBhdGNoLnNlcnZpY2UnO1xuaW1wb3J0IHsgRGlmZiwgRGlmZk9wIH0gZnJvbSAnLi9kaWZmTWF0Y2hQYXRjaCc7XG5cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tsaW5lRGlmZl0nLFxufSlcbmV4cG9ydCBjbGFzcyBMaW5lRGlmZkRpcmVjdGl2ZSBpbXBsZW1lbnRzIE9uSW5pdCwgT25DaGFuZ2VzIHtcbiAgQElucHV0KCkgbGVmdDogc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbjtcbiAgQElucHV0KCkgcmlnaHQ6IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW47XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgZWw6IEVsZW1lbnRSZWYsXG4gICAgcHJpdmF0ZSBkbXA6IERpZmZNYXRjaFBhdGNoU2VydmljZSkgeyAgfVxuXG4gIHB1YmxpYyBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLnVwZGF0ZUh0bWwoKTtcbiAgfVxuXG4gIHB1YmxpYyBuZ09uQ2hhbmdlcygpOiB2b2lkIHtcbiAgICB0aGlzLnVwZGF0ZUh0bWwoKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlSHRtbCgpOiB2b2lkIHtcbiAgICBpZiAodHlwZW9mIHRoaXMubGVmdCA9PT0gJ251bWJlcicgfHwgdHlwZW9mIHRoaXMubGVmdCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICB0aGlzLmxlZnQgPSB0aGlzLmxlZnQudG9TdHJpbmcoKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB0aGlzLnJpZ2h0ID09PSAnbnVtYmVyJyB8fCB0eXBlb2YgdGhpcy5yaWdodCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICB0aGlzLnJpZ2h0ID0gdGhpcy5yaWdodC50b1N0cmluZygpO1xuICAgIH1cbiAgICB0aGlzLmVsLm5hdGl2ZUVsZW1lbnQuaW5uZXJIVE1MID0gdGhpcy5jcmVhdGVIdG1sKHRoaXMuZG1wLmdldExpbmVEaWZmKHRoaXMubGVmdCwgdGhpcy5yaWdodCkpO1xuICB9XG5cbiAgLy8gVE9ETzogTmVlZCB0byBmaXggdGhpcyBmb3IgbGluZSBkaWZmc1xuICBwcml2YXRlIGNyZWF0ZUh0bWwoZGlmZnM6IEFycmF5PERpZmY+KTogc3RyaW5nIHtcbiAgICBsZXQgaHRtbDogc3RyaW5nO1xuICAgIGh0bWwgPSAnPGRpdj4nO1xuICAgIGZvciAobGV0IGRpZmYgb2YgZGlmZnMpIHtcbiAgICAgIGlmIChkaWZmWzBdID09PSBEaWZmT3AuRXF1YWwpIHtcbiAgICAgICAgaHRtbCArPSAnPHNwYW4gY2xhc3M9XCJlcXVhbFwiPicgKyBkaWZmWzFdICsgJzwvc3Bhbj4nO1xuICAgICAgfVxuICAgICAgaWYgKGRpZmZbMF0gPT09IERpZmZPcC5EZWxldGUpIHtcbiAgICAgICAgaHRtbCArPSAnPGRpdiBjbGFzcz1cXFwiZGVsXFxcIj4gLSA8ZGVsPicgKyBkaWZmWzFdICsgJzwvZGVsPjwvZGl2Plxcbic7XG4gICAgICB9XG4gICAgICBpZiAoZGlmZlswXSA9PT0gRGlmZk9wLkluc2VydCkge1xuICAgICAgICBodG1sICs9ICc8ZGl2IGNsYXNzPVxcXCJpbnNcXFwiPiArIDxpbnM+JyArIGRpZmZbMV0gKyAnPC9pbnM+PC9kaXY+XFxuJztcbiAgICAgIH1cbiAgICB9XG4gICAgaHRtbCArPSAnPC9kaXY+JztcbiAgICByZXR1cm4gaHRtbDtcbiAgfVxufVxuIiwiaW1wb3J0IHsgRGlyZWN0aXZlLCBFbGVtZW50UmVmLCBJbnB1dCwgT25Jbml0LCBPbkNoYW5nZXMgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IERpZmZNYXRjaFBhdGNoU2VydmljZSB9IGZyb20gJy4vZGlmZk1hdGNoUGF0Y2guc2VydmljZSc7XG5pbXBvcnQgeyBEaWZmLCBEaWZmT3AgfSBmcm9tICcuL2RpZmZNYXRjaFBhdGNoJztcblxuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW3Byb2Nlc3NpbmdEaWZmXSdcbn0pXG5leHBvcnQgY2xhc3MgUHJvY2Vzc2luZ0RpZmZEaXJlY3RpdmUgaW1wbGVtZW50cyBPbkluaXQsIE9uQ2hhbmdlcyB7XG4gIEBJbnB1dCgpIGxlZnQ6IHN0cmluZztcbiAgQElucHV0KCkgcmlnaHQ6IHN0cmluZztcblxuICBwdWJsaWMgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBlbDogRWxlbWVudFJlZixcbiAgICBwcml2YXRlIGRtcDogRGlmZk1hdGNoUGF0Y2hTZXJ2aWNlKSB7ICB9XG5cbiAgcHVibGljIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMudXBkYXRlSHRtbCgpO1xuICB9XG5cbiAgcHVibGljIG5nT25DaGFuZ2VzKCk6IHZvaWQge1xuICAgIHRoaXMudXBkYXRlSHRtbCgpO1xuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVIdG1sKCk6IHZvaWQge1xuICAgIHRoaXMuZWwubmF0aXZlRWxlbWVudC5pbm5lckhUTUwgPSB0aGlzLmNyZWF0ZUh0bWwoXG4gICAgICB0aGlzLmRtcC5nZXRQcm9jZXNzaW5nRGlmZih0aGlzLmxlZnQsIHRoaXMucmlnaHQpKTtcbiAgfVxuXG4gIC8vIFRPRE86IE5lZWQgdG8gZml4IHRoaXMgZm9yIGxpbmUgZGlmZnNcbiAgcHJpdmF0ZSBjcmVhdGVIdG1sKGRpZmZzOiBBcnJheTxEaWZmPik6IHN0cmluZyB7XG4gICAgbGV0IGh0bWw6IHN0cmluZztcbiAgICBodG1sID0gJzxkaXY+JztcbiAgICBmb3IgKGxldCBkaWZmIG9mIGRpZmZzKSB7XG4gICAgICBkaWZmWzFdID0gZGlmZlsxXS5yZXBsYWNlKC9cXG4vZywgJzxici8+Jyk7XG5cbiAgICAgIGlmIChkaWZmWzBdID09PSBEaWZmT3AuRXF1YWwpIHtcbiAgICAgICAgaHRtbCArPSAnPHNwYW4gY2xhc3M9XCJlcXVhbFwiPicgKyBkaWZmWzFdICsgJzwvc3Bhbj4nO1xuICAgICAgfVxuICAgICAgaWYgKGRpZmZbMF0gPT09IERpZmZPcC5EZWxldGUpIHtcbiAgICAgICAgaHRtbCArPSAnPGRlbD4nICsgZGlmZlsxXSArICc8L2RlbD4nO1xuICAgICAgfVxuICAgICAgaWYgKGRpZmZbMF0gPT09IERpZmZPcC5JbnNlcnQpIHtcbiAgICAgICAgaHRtbCArPSAnPGlucz4nICsgZGlmZlsxXSArICc8L2lucz4nO1xuICAgICAgfVxuICAgIH1cbiAgICBodG1sICs9ICc8L2Rpdj4nO1xuICAgIHJldHVybiBodG1sO1xuICB9XG59XG4iLCJpbXBvcnQgeyBEaXJlY3RpdmUsIEVsZW1lbnRSZWYsIElucHV0LCBPbkluaXQsIE9uQ2hhbmdlcyB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgRGlmZk1hdGNoUGF0Y2hTZXJ2aWNlIH0gZnJvbSAnLi9kaWZmTWF0Y2hQYXRjaC5zZXJ2aWNlJztcbmltcG9ydCB7IERpZmYsIERpZmZPcCB9IGZyb20gJy4vZGlmZk1hdGNoUGF0Y2gnO1xuXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbc2VtYW50aWNEaWZmXSdcbn0pXG5leHBvcnQgY2xhc3MgU2VtYW50aWNEaWZmRGlyZWN0aXZlIGltcGxlbWVudHMgT25Jbml0LCBPbkNoYW5nZXMge1xuICBASW5wdXQoKSBsZWZ0OiBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuO1xuICBASW5wdXQoKSByaWdodDogc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbjtcblxuICBwdWJsaWMgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBlbDogRWxlbWVudFJlZixcbiAgICBwcml2YXRlIGRtcDogRGlmZk1hdGNoUGF0Y2hTZXJ2aWNlKSB7ICB9XG5cbiAgcHVibGljIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMudXBkYXRlSHRtbCgpO1xuICB9XG5cbiAgcHVibGljIG5nT25DaGFuZ2VzKCk6IHZvaWQge1xuICAgIHRoaXMudXBkYXRlSHRtbCgpO1xuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVIdG1sKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5sZWZ0KSB7XG4gICAgICB0aGlzLmxlZnQgPSBcIlwiO1xuICAgIH1cbiAgICBpZiAoIXRoaXMucmlnaHQpIHtcbiAgICAgIHRoaXMucmlnaHQgPSBcIlwiO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHRoaXMubGVmdCA9PT0gJ251bWJlcicgfHwgdHlwZW9mIHRoaXMubGVmdCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICB0aGlzLmxlZnQgPSB0aGlzLmxlZnQudG9TdHJpbmcoKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB0aGlzLnJpZ2h0ID09PSAnbnVtYmVyJyB8fCB0eXBlb2YgdGhpcy5yaWdodCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICB0aGlzLnJpZ2h0ID0gdGhpcy5yaWdodC50b1N0cmluZygpO1xuICAgIH1cbiAgICB0aGlzLmVsLm5hdGl2ZUVsZW1lbnQuaW5uZXJIVE1MID0gdGhpcy5jcmVhdGVIdG1sKFxuICAgICAgdGhpcy5kbXAuZ2V0U2VtYW50aWNEaWZmKHRoaXMubGVmdCwgdGhpcy5yaWdodCkpO1xuICB9XG5cbiAgLy8gVE9ETzogTmVlZCB0byBmaXggdGhpcyBmb3IgbGluZSBkaWZmc1xuICBwcml2YXRlIGNyZWF0ZUh0bWwoZGlmZnM6IEFycmF5PERpZmY+KTogc3RyaW5nIHtcbiAgICBsZXQgaHRtbDogc3RyaW5nO1xuICAgIGh0bWwgPSAnPGRpdj4nO1xuICAgIGZvciAobGV0IGRpZmYgb2YgZGlmZnMpIHtcbiAgICAgIGRpZmZbMV0gPSBkaWZmWzFdLnJlcGxhY2UoL1xcbi9nLCAnPGJyLz4nKTtcblxuICAgICAgaWYgKGRpZmZbMF0gPT09IERpZmZPcC5FcXVhbCkge1xuICAgICAgICBodG1sICs9ICc8c3BhbiBjbGFzcz1cImVxdWFsXCI+JyArIGRpZmZbMV0gKyAnPC9zcGFuPic7XG4gICAgICB9XG4gICAgICBpZiAoZGlmZlswXSA9PT0gRGlmZk9wLkRlbGV0ZSkge1xuICAgICAgICBodG1sICs9ICc8ZGVsPicgKyBkaWZmWzFdICsgJzwvZGVsPic7XG4gICAgICB9XG4gICAgICBpZiAoZGlmZlswXSA9PT0gRGlmZk9wLkluc2VydCkge1xuICAgICAgICBodG1sICs9ICc8aW5zPicgKyBkaWZmWzFdICsgJzwvaW5zPic7XG4gICAgICB9XG4gICAgfVxuICAgIGh0bWwgKz0gJzwvZGl2Pic7XG4gICAgcmV0dXJuIGh0bWw7XG4gIH1cbn1cbiIsImltcG9ydCB7IE5nTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBDb21tb25Nb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHsgRGlmZkRpcmVjdGl2ZSB9IGZyb20gJy4vZGlmZi5kaXJlY3RpdmUnO1xuaW1wb3J0IHsgTGluZURpZmZEaXJlY3RpdmUgfSBmcm9tICcuL2xpbmVEaWZmLmRpcmVjdGl2ZSc7XG5pbXBvcnQgeyBQcm9jZXNzaW5nRGlmZkRpcmVjdGl2ZSB9IGZyb20gJy4vcHJvY2Vzc2luZ0RpZmYuZGlyZWN0aXZlJztcbmltcG9ydCB7IFNlbWFudGljRGlmZkRpcmVjdGl2ZSB9IGZyb20gJy4vc2VtYW50aWNEaWZmLmRpcmVjdGl2ZSc7XG5pbXBvcnQgeyBMaW5lQ29tcGFyZUNvbXBvbmVudCB9IGZyb20gJy4vbGluZUNvbXBhcmUuY29tcG9uZW50JztcblxuaW1wb3J0IHsgRGlmZk1hdGNoUGF0Y2ggfSBmcm9tICcuL2RpZmZNYXRjaFBhdGNoJztcbmltcG9ydCB7IERpZmZNYXRjaFBhdGNoU2VydmljZSB9IGZyb20gJy4vZGlmZk1hdGNoUGF0Y2guc2VydmljZSc7XG5cbkBOZ01vZHVsZSh7XG4gIGRlY2xhcmF0aW9uczogW1xuICAgIERpZmZEaXJlY3RpdmUsXG4gICAgTGluZURpZmZEaXJlY3RpdmUsXG4gICAgUHJvY2Vzc2luZ0RpZmZEaXJlY3RpdmUsXG4gICAgU2VtYW50aWNEaWZmRGlyZWN0aXZlLFxuICAgIExpbmVDb21wYXJlQ29tcG9uZW50XG4gIF0sXG4gIGltcG9ydHM6IFtcbiAgICBDb21tb25Nb2R1bGVcbiAgXSxcbiAgZXhwb3J0czogW1xuICAgIERpZmZEaXJlY3RpdmUsXG4gICAgTGluZURpZmZEaXJlY3RpdmUsXG4gICAgUHJvY2Vzc2luZ0RpZmZEaXJlY3RpdmUsXG4gICAgU2VtYW50aWNEaWZmRGlyZWN0aXZlLFxuICAgIExpbmVDb21wYXJlQ29tcG9uZW50XG4gIF0sXG4gIHByb3ZpZGVyczogW1xuICAgIERpZmZNYXRjaFBhdGNoLFxuICAgIERpZmZNYXRjaFBhdGNoU2VydmljZVxuICBdXG59KVxuZXhwb3J0IGNsYXNzIERpZmZNYXRjaFBhdGNoTW9kdWxlIHsgfVxuIl0sIm5hbWVzIjpbIkluamVjdGFibGUiLCJ0c2xpYl8xLl9fdmFsdWVzIiwiQ29tcG9uZW50IiwiSW5wdXQiLCJEaXJlY3RpdmUiLCJFbGVtZW50UmVmIiwiTmdNb2R1bGUiLCJDb21tb25Nb2R1bGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFZQTs7TUFBQTtNQUVFOzs7OzhCQU1lLEdBQUc7OytC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