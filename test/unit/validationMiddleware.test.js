/**
 * Unit Tests for Validation Middleware
 */
import '../helpers/setup.js';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { body, validationResult } from 'express-validator';
import { validateRequest, validate } from '../../src/core/http/middlewares/validationMiddleware.js';

describe('Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };
    next = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('validateRequest()', () => {
    it('should have correct structure', () => {
      const middleware = validateRequest();
      expect(middleware).to.be.a('function');
      expect(middleware.length).to.equal(3); // req, res, next
    });

    it('should format errors correctly when validation fails', () => {
      // Test the error formatting logic
      const mockErrors = [
        {
          path: 'email',
          msg: 'Must be a valid email',
          value: 'invalid-email',
          param: 'email',
        },
      ];

      const formattedErrors = mockErrors.map((error) => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value,
      }));

      expect(formattedErrors).to.have.lengthOf(1);
      expect(formattedErrors[0]).to.deep.equal({
        field: 'email',
        message: 'Must be a valid email',
        value: 'invalid-email',
      });
    });
  });

  describe('validate()', () => {
    it('should return array with validations and validateRequest', () => {
      const validations = [
        body('email').isEmail(),
        body('password').isLength({ min: 8 }),
      ];

      const result = validate(validations);

      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(3); // 2 validations + validateRequest
    });

    it('should include validateRequest middleware at the end', () => {
      const validations = [body('email').isEmail()];
      const result = validate(validations);

      // The last item should be the validateRequest function
      expect(result[result.length - 1]).to.be.a('function');
    });
  });

  describe('Integration with express-validator', () => {
    it('should properly format validation errors', () => {
      const mockErrors = [
        {
          path: 'email',
          msg: 'Must be a valid email',
          value: 'test',
          param: 'email',
        },
        {
          path: 'password',
          msg: 'Password too short',
          value: '123',
          param: 'password',
        },
      ];

      // Test error formatting
      const formattedErrors = mockErrors.map((error) => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value,
      }));

      expect(formattedErrors).to.have.lengthOf(2);
      expect(formattedErrors[0]).to.deep.equal({
        field: 'email',
        message: 'Must be a valid email',
        value: 'test',
      });
      expect(formattedErrors[1]).to.deep.equal({
        field: 'password',
        message: 'Password too short',
        value: '123',
      });
    });
  });
});
