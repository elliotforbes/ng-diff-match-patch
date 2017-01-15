Ng-Diff-Match-Patch
=====================

This is a port of the angular-diff-match-patch wrapper for AngularJS.

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
import { DiffMatchPatchModule, DiffDirective } from 'ng-diff-match-patch';

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

Currently only ```diff``` works. I will be adding more functionality in the weeks to come.

~~~
<h1>{{left}}</h1>

<h1>{{right}}</h1>

<pre diff [left]="left" [right]="right"></pre>
~~~

This should produce something like so:

![ng-diff-match-patch](https://tutorialedge.net/uploads/ngDiffMatchPatch.png)

## Development

**Requirements**

* NodeJS
* npm

~~~
git clone repo here
~~~