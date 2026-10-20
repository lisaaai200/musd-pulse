import test from 'node:test'; import assert from 'node:assert/strict';
import { collateralRatio, liquidationPrice, maxDebt, openingDebt, healthLabel, drawdownToLiquidation } from '../src/math.js';
test('collateral ratio', () => { assert.equal(collateralRatio(1, 50000, 100000), 2); assert.equal(collateralRatio(1, 0, 1), Infinity); });
test('liquidation price at 110%', () => { assert.ok(Math.abs(liquidationPrice(1, 90909.09) - 100000) < 0.01); assert.equal(liquidationPrice(0, 1), Infinity); });
test('docs example: 1 BTC at $100k borrows max 90,909 at 110%', () => assert.equal(Math.floor(maxDebt(1, 100000, 1.1)), 90909));
test('maxDebt rejects bad ratio', () => assert.throws(() => maxDebt(1, 1, 0)));
test('opening debt adds fee and gas reserve', () => assert.equal(openingDebt(1000), 1201));
test('health labels', () => {
  assert.equal(healthLabel(1.05), 'liquidatable'); assert.equal(healthLabel(1.3), 'at risk');
  assert.equal(healthLabel(1.8), 'moderate'); assert.equal(healthLabel(2.5), 'healthy'); assert.equal(healthLabel(Infinity), 'no debt');
});
test('drawdown to liquidation', () => { assert.ok(Math.abs(drawdownToLiquidation(1, 50000, 110000) - 0.5) < 1e-9); assert.equal(drawdownToLiquidation(0, 0, 1), 1); });
