import { getTestBed, TestBed, inject, async } from '@angular/core/testing';

import { DiffMatchPatchService } from '../src/diffMatchPatch.service';
import { DiffMatchPatch, Diff, DiffOp } from '../src/diffMatchPatch';
import * as sinon from 'sinon';

describe('DiffMatchPatchService', () => {
  let diffMatchPatchMock = {
    diff_main: sinon.stub(),
    diff_cleanupSemantic: sinon.stub(),
    diff_cleanupEfficiency: sinon.stub(),
    diff_linesToChars_: sinon.stub(),
    diff_charsToLines_: sinon.stub()
  };

  beforeEach(() => {
    diffMatchPatchMock.diff_main = sinon.stub();
    diffMatchPatchMock.diff_cleanupSemantic = sinon.stub();
    diffMatchPatchMock.diff_cleanupEfficiency = sinon.stub();
    diffMatchPatchMock.diff_linesToChars_ = sinon.stub();
    diffMatchPatchMock.diff_charsToLines_ = sinon.stub();

    TestBed.configureTestingModule({
      providers: [
        DiffMatchPatchService,
        { provide: DiffMatchPatch, useValue: diffMatchPatchMock }
      ]
    });
  });

  describe('getDiff()', () => {
    it('should call diff_main on DiffMatchPatch',
      async(inject([DiffMatchPatchService], (diffMatchPatchService: DiffMatchPatchService) => {
        const expectedResult: Array<[DiffOp, string]> =
          [[DiffOp.Equal, 'left']];
        diffMatchPatchMock.diff_main.returns(expectedResult);
        const actualResult = diffMatchPatchService.getDiff('left', 'right');
        expect(actualResult).toEqual(expectedResult);
        expect(diffMatchPatchMock.diff_main.calledWith('left', 'right')).toBe(true);
        expect(diffMatchPatchMock.diff_main.calledOnce).toBe(true);
      })));
  });

  describe('getSemanticDiff()', () => {
    it('should post-process diff_main call with diff_cleanupSemantic',
      async(inject([DiffMatchPatchService], (diffMatchPatchService: DiffMatchPatchService) => {
        const expectedResult: Array<[DiffOp, string]> =
          [[DiffOp.Equal, 'left']];
        diffMatchPatchMock.diff_main.returns(expectedResult);

        const actualDiffs = diffMatchPatchService.getSemanticDiff('left', 'right');

        expect(diffMatchPatchMock.diff_main.calledWith('left', 'right')).toBeTruthy();
        expect(diffMatchPatchMock.diff_cleanupSemantic.calledWith(expectedResult)).toBeTruthy();
        expect(actualDiffs).toEqual(expectedResult);
      })));
  });

  describe('getProcessingDiff()', () => {
    it('should post-process diff_main call with diff_cleanupEfficiency',
      async(inject([DiffMatchPatchService], (diffMatchPatchService: DiffMatchPatchService) => {
        const expectedResult: Array<[DiffOp, string]> =
          [[DiffOp.Equal, 'left']];
        diffMatchPatchMock.diff_main.returns(expectedResult);

        const actualDiffs = diffMatchPatchService.getProcessingDiff('left', 'right');

        expect(diffMatchPatchMock.diff_main.calledWith('left', 'right')).toBeTruthy();
        expect(diffMatchPatchMock.diff_cleanupEfficiency.calledWith(expectedResult)).toBeTruthy();
        expect(actualDiffs).toEqual(expectedResult);
      })));
  });

  describe('getLineDiff()', () => {
    it('should call diff_main on result of diff_linesToChars_ and post-process the result',
      async(inject([DiffMatchPatchService], (diffMatchPatchService: DiffMatchPatchService) => {
        const expectedResult: Array<[DiffOp, string]> =
          [[DiffOp.Equal, 'left']];
        diffMatchPatchMock.diff_main.returns(expectedResult);

        diffMatchPatchMock.diff_linesToChars_.returns({
          chars1: 'Char1String',
          chars2: 'Char2String',
          lineArray: ['Line1', 'Line2']
        });

        const actualDiffs = diffMatchPatchService.getLineDiff('left', 'right');

        expect(diffMatchPatchMock.diff_linesToChars_.calledWith('left', 'right')).toBeTruthy();
        expect(diffMatchPatchMock.diff_main.calledWith('Char1String', 'Char2String', false)).toBeTruthy();
        expect(diffMatchPatchMock.diff_charsToLines_.calledWith(expectedResult, ['Line1', 'Line2'])).toBeTruthy();

        expect(actualDiffs).toEqual(expectedResult);
      })));
  });

  describe('getDmp()', () => {
    it('should return DiffMatchPatch object',
      async(inject([DiffMatchPatchService], (diffMatchPatchService: DiffMatchPatchService) => {
        diffMatchPatchMock.diff_main.returns([[DiffOp.Equal, 'myDiff']]);
        const dmp = diffMatchPatchService.getDmp();
        expect(dmp.diff_main('left', 'right')).toEqual([[DiffOp.Equal, 'myDiff']]);
      })));
  });
});
