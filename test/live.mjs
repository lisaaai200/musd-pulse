// Optional live smoke test against public RPCs: node test/live.mjs
import { readSnapshot } from '../src/rpc.js';
console.log(JSON.stringify(await readSnapshot(), null, 2));
