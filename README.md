# https://hqjs.org
Transform json imports

# Installation
```sh
npm install hqjs@babel-plugin-transform-json-imports
```

# Transformation
Transforms `.json` imports into inplace definition e.g. having file values.json

```json
{
  "a": 1,
  "b": 2
}
```
and importing it

```js
import values from './values.json';
// Or with destructure
import {a, b} from './values.json';
```
we will obtain
```js
const values = {a: 1, b: 2};
const {a, b} = {a: 1, b: 2};
```
