# https://hqjs.org
Transform json imports

# Installation
```sh
npm install hqjs@babel-plugin-transform-json-imports
```

# Usage
```json
{
  "plugins": [["hqjs@babel-plugin-transform-json-imports", { "dirname": "/json/directory", "root": "/root/directory" }]]
}
```
If you are invoking this plugin from javascript it becomes possible to pass filesystem implementation trough `fs` option, it expects the object with `readFileSync` method defined.

# Transformation
Transforms `.json` imports into inplace definition e.g. having file values.json

```json
{
  "a": 1,
  "b": 2,
  "c": 3
}
```
and importing it

```js
import values from './values.json';
// Or with destructure
import {a, b} from './values.json';
```
or similar expressions with require
```js
const values = require('./values.json');
// Or with destructure
const {a, b} = require('./values.json');
```
we will obtain
```js
const values = {a: 1, b: 2, c: 3};
const {a, b} = {a: 1, b: 2};
```
