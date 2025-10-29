/**
 * Unit Tests for Shared Utilities
 */
import '../helpers/setup.js';
import { describe, it } from 'mocha';
import {
  delay,
  isEmpty,
  deepClone,
  pick,
  omit,
  retry,
} from '../../src/common/utils/index.js';
import { asyncHandler } from '../../src/core/http/middlewares/asyncHandler.js';

describe('Shared Utilities', () => {
  describe('isEmpty()', () => {
    it('should return true for null', () => {
      expect(isEmpty(null)).to.be.true;
    });

    it('should return true for undefined', () => {
      expect(isEmpty(undefined)).to.be.true;
    });

    it('should return true for empty string', () => {
      expect(isEmpty('')).to.be.true;
      expect(isEmpty('   ')).to.be.true;
    });

    it('should return true for empty array', () => {
      expect(isEmpty([])).to.be.true;
    });

    it('should return true for empty object', () => {
      expect(isEmpty({})).to.be.true;
    });

    it('should return false for non-empty values', () => {
      expect(isEmpty('hello')).to.be.false;
      expect(isEmpty([1, 2])).to.be.false;
      expect(isEmpty({ key: 'value' })).to.be.false;
    });
  });

  describe('deepClone()', () => {
    it('should create a deep copy of an object', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);

      expect(cloned).to.deep.equal(original);
      expect(cloned).to.not.equal(original);
      expect(cloned.b).to.not.equal(original.b);
    });
  });

  describe('pick()', () => {
    it('should pick specified keys from object', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const result = pick(obj, ['a', 'c']);

      expect(result).to.deep.equal({ a: 1, c: 3 });
    });

    it('should handle non-existent keys', () => {
      const obj = { a: 1, b: 2 };
      const result = pick(obj, ['a', 'z']);

      expect(result).to.deep.equal({ a: 1 });
    });
  });

  describe('omit()', () => {
    it('should omit specified keys from object', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const result = omit(obj, ['b', 'd']);

      expect(result).to.deep.equal({ a: 1, c: 3 });
    });
  });

  describe('delay()', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await delay(100);
      const duration = Date.now() - start;

      expect(duration).to.be.at.least(90); // Allow some variance
    });
  });

  describe('retry()', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };

      const result = await retry(fn, 5, 10);

      expect(result).to.equal('success');
      expect(attempts).to.equal(3);
    });

    it('should throw error after max retries', async () => {
      const fn = async () => {
        throw new Error('Permanent failure');
      };

      try {
        await retry(fn, 3, 10);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Permanent failure');
      }
    });
  });

  describe('asyncHandler()', () => {
    it('should wrap async route handlers', async () => {
      const mockHandler = async (req, res) => {
        res.send('OK');
      };

      const wrapped = asyncHandler(mockHandler);
      const req = {};
      const res = { send: sinon.stub() };
      const next = sinon.stub();

      await wrapped(req, res, next);

      expect(res.send.calledWith('OK')).to.be.true;
      expect(next.called).to.be.false;
    });

    it('should catch errors and pass to next', async () => {
      const error = new Error('Test error');
      const mockHandler = async () => {
        throw error;
      };

      const wrapped = asyncHandler(mockHandler);
      const req = {};
      const res = {};
      const next = sinon.stub();

      await wrapped(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });
});
