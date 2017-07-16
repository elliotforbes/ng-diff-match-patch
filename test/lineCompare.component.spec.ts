import { NO_ERRORS_SCHEMA } from '@angular/core';
import { inject, async, TestBed, ComponentFixture } from '@angular/core/testing';
import { LineCompareComponent } from '../src/lineCompare.component';
import { DiffMatchPatchService } from '../src/diffMatchPatch.service';
import { Diff, DiffOp } from '../src/diffMatchPatch';
import * as sinon from 'sinon';

class DiffMatchPatchServiceMock {
  public getLineDiff(left: string, right: string): Array<Diff> {
    return [
      [DiffOp.Equal, 'Diff One A\r\nDiff One B\r\n'],
      [DiffOp.Insert, 'Diff Two A\r\nDiff Two B\r\n'],
      [DiffOp.Delete, 'Diff Three A\r\nDiff Three B'],
      [DiffOp.Equal, 'Diff Four A\r\nDiff Four B\r\n']
    ];
  }
}

describe('LineCompareComponent', () => {
  let component: LineCompareComponent;
  let fixture: ComponentFixture<LineCompareComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LineCompareComponent ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: DiffMatchPatchService, useClass: DiffMatchPatchServiceMock }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LineCompareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialise component', () => {
    expect(fixture).toBeDefined();
    expect(component).toBeDefined();
  });

  it('should have 8 line diffs', () => {
    expect(component.calculatedDiff.length).toBe(8);
  });

  it('should have correct line numbers', () => {
    const leftLineNumbers = component.calculatedDiff.map(x => x[1]);
    expect(leftLineNumbers).toEqual([
      '1', '2', '-', '-', '3', '4', '5', '6'
    ]);

    const rightLineNumbers = component.calculatedDiff.map(x => x[2]);
    expect(rightLineNumbers).toEqual([
      '1', '2', '3', '4', '-', '-', '5', '6'
    ]);
  });

  it('should have correct class annotations', () => {
    const classes = component.calculatedDiff.map(x => x[0]);
    expect(classes).toEqual([
      'dmp-line-compare-equal',
      'dmp-line-compare-equal',
      'dmp-line-compare-insert',
      'dmp-line-compare-insert',
      'dmp-line-compare-delete',
      'dmp-line-compare-delete',
      'dmp-line-compare-equal',
      'dmp-line-compare-equal'
    ]);
  });

  it('should have correct line contents', () => {
    const contents = component.calculatedDiff.map(x => x[3]);
    expect(contents).toEqual([
      'Diff One A',
      'Diff One B',
      'Diff Two A',
      'Diff Two B',
      'Diff Three A',
      'Diff Three B',
      'Diff Four A',
      'Diff Four B'
    ]);
  });
});
