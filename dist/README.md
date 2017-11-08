Ng-Diff-Match-Patch
=====================

[![Build Status](https://travis-ci.org/elliotforbes/ng-diff-match-patch.svg?branch=master)](https://travis-ci.org/elliotforbes/ng-diff-match-patch)

This is a port of the [angular-diff-match-patch](https://github.com/amweiss/angular-diff-match-patch) wrapper for AngularJS. 

## Installation

~~~
npm install ng-diff-match-patch --save-dev
~~~

## Usage

In order to use these directives you'll first have to import them from the module like so:

~~~
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { AppComponent } from './app.component';
// import our necessary module and components here 
import { DiffMatchPatchModule } from 'ng-diff-match-patch';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    DiffMatchPatchModule
  ],
  providers: [  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
~~~

Remember to add ```DiffMatchPatchModule``` to your imports array in @NgModule

### Basic Usage

~~~
<h1>{{left}}</h1>

<h1>{{right}}</h1>

<pre diff [left]="left" [right]="right"></pre>

<pre lineDiff [left]="left" [right]="right"></pre>

<pre semanticDiff [left]="left" [right]="right"></pre>

<pre processingDiff [left]="left" [right]="right"></pre>
~~~

This should produce something like so:

![ng-diff-match-patch](https://tutorialedge.net/uploads/ngDiffMatchPatchv3.png)


### CSS Styles:

~~~
ins{
  color: black;
  background: #bbffbb;
}

del{
  color: black;
  background: #ffbbbb;
}
~~~

## Pull Requests

Got any improvements you'd like to make to this module? Submit a pull request and I will review and merge.