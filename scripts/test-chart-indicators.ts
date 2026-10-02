import assert from "node:assert/strict";
import { bollinger, ema, macd, rsi, sma, vwap } from "../lib/chart-indicators";

const ascending = Array.from({ length: 40 }, (_, index) => index + 1);
assert.equal(sma(ascending, 20)[18], null);
assert.equal(sma(ascending, 20)[19], 10.5);
assert.equal(ema(Array(30).fill(100), 20)[29], 100);
assert.equal(rsi(ascending)[14], 100);
assert.equal(rsi(Array(30).fill(100))[14], 50);
const bands = bollinger(Array(30).fill(100));
assert.equal(bands.upper[19], 100);
assert.equal(bands.lower[19], 100);
assert.equal(vwap([{ time: 1, open: 100, high: 120, low: 90, close: 90, volume: 2 }])[0], 100);
const macdValues = macd(Array(40).fill(100));
assert.equal(macdValues.line[25], 0);
assert.equal(macdValues.signal[33], 0);
assert.equal(macdValues.histogram[33], 0);
console.log("Chart indicator calculations passed.");
