'use strict';

describe('Callback & Promise syntax', function() {
  // We need a delay to allow the callback functions to be called asynchronously.
  function delay(fn) {
    setTimeout(fn, 200);
  }

  ['parse', 'resolve', 'dereference', 'bundle', 'validate'].forEach(function(method) {
    describe(method + ' method', function() {
      it('should call the callback function and Promise.then() (static)', testCallbackAndPromise_Static(method));
      it('should call the callback function and Promise.then() (instance)', testCallbackAndPromise_Success(method));
      it('should call the callback function and Promise.catch()', testCallbackAndPromise_Error(method));
    });
  });

  /**
   * Calls the specified SwaggerParser method, and asserts that the callback function
   * is called without an error, and that Promise.then() is fired.
   */
  function testCallbackAndPromise_Static(method) {
    return function(done) {
      var callbackFn = sinon.spy();
      var thenFn = sinon.spy();
      var catchFn = sinon.spy(console.error.bind(console));

      SwaggerParser[method](path.rel('specs/callbacks-promises/callbacks-promises.yaml'), callbackFn)
        .then(thenFn)
        .catch(catchFn)
        .then(delay(function() {
          try {
            // Make sure the correct functions were called
            sinon.assert.calledOnce(callbackFn);
            sinon.assert.calledOnce(thenFn);
            sinon.assert.notCalled(catchFn);

            // Make sure they were called with the same value
            var thenFnArg = thenFn.firstCall.args[0];
            var callbackFnArg = callbackFn.firstCall.args[1];
            expect(thenFnArg).to.equal(callbackFnArg);
            sinon.assert.calledWithExactly(callbackFn, null, thenFnArg);
            sinon.assert.calledWithExactly(thenFn, callbackFnArg);

            // Make sure the API was parsed correctly
            if (method !== 'resolve') {
              var actual = thenFn.firstCall.args[0];
              var expected = method === 'validate' ? helper.dereferenced.callbacksPromises : helper[method + 'd'].callbacksPromises;
              expect(actual).to.deep.equal(expected);
            }

            done();
          }
          catch (e) {
            done(e);
          }
        }));
    }
  }

  /**
   * Calls the specified SwaggerParser method, and asserts that the callback function
   * is called without an error, and that Promise.then() is fired.
   */
  function testCallbackAndPromise_Success(method) {
    return function(done) {
      var callbackFn = sinon.spy();
      var thenFn = sinon.spy();
      var catchFn = sinon.spy(console.error.bind(console));

      var parser = new SwaggerParser();
      parser[method](path.rel('specs/callbacks-promises/callbacks-promises.yaml'), callbackFn)
        .then(thenFn)
        .catch(catchFn)
        .then(delay(function() {
          try {
            // Make sure the correct functions were called
            sinon.assert.calledOnce(callbackFn);
            sinon.assert.calledOnce(thenFn);
            sinon.assert.notCalled(catchFn);

            // Make sure they were called with the correct values
            var result = method === 'resolve' ? parser.$refs : parser.api;
            var api = method === 'resolve' ? helper.parsed.callbacksPromises : method === 'validate' ? helper.dereferenced.callbacksPromises : helper[method + 'd'].callbacksPromises;
            expect(parser.api).to.deep.equal(api);
            expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/callbacks-promises/callbacks-promises.yaml')]);
            sinon.assert.calledWithExactly(callbackFn, null, result);
            sinon.assert.calledWithExactly(thenFn, result);

            done();
          }
          catch (e) {
            done(e);
          }
        }));
    }
  }

  /**
   * Calls the specified SwaggerParser method, and asserts that the callback function
   * is called with an error, and that Promise.catch() is fired.
   */
  function testCallbackAndPromise_Error(method) {
    return function(done) {
      var callbackFn = sinon.spy();
      var thenFn = sinon.spy(console.error.bind(console));
      var catchFn = sinon.spy();

      var parser = new SwaggerParser();
      parser[method](path.rel('specs/callbacks-promises/callbacks-promises-error.yaml'), callbackFn)
        .then(thenFn)
        .catch(catchFn)
        .then(delay(function() {
          try {
            // Make sure the correct functions were called
            sinon.assert.calledOnce(callbackFn);
            sinon.assert.calledOnce(catchFn);
            sinon.assert.notCalled(thenFn);

            // Make sure they were called with the correct values
            expect(parser.api).to.deep.equal({swagger: 'ERROR'});
            expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/callbacks-promises/callbacks-promises-error.yaml')]);
            var result = method === 'resolve' ? parser.$refs : sinon.match(parser.api);
            sinon.assert.calledWithExactly(callbackFn, sinon.match.instanceOf(SyntaxError), result);
            sinon.assert.calledWithExactly(catchFn, sinon.match.instanceOf(SyntaxError));

            done();
          }
          catch (e) {
            done(e);
          }
        }));
    }
  }
});