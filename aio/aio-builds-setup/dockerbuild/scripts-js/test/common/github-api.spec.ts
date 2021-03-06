// Imports
import * as nock from 'nock';
import {GithubApi} from '../../lib/common/github-api';

// Tests
describe('GithubApi', () => {
  let api: GithubApi;

  beforeEach(() => api = new GithubApi('12345'));


  describe('constructor()', () => {

    it('should throw if \'githubToken\' is missing or empty', () => {
      expect(() => new GithubApi('')).toThrowError('Missing or empty required parameter \'githubToken\'!');
    });

  });


  describe('get()', () => {
    let apiBuildPathSpy: jasmine.Spy;
    let apiRequestSpy: jasmine.Spy;

    beforeEach(() => {
      apiBuildPathSpy = spyOn(api as any, 'buildPath');
      apiRequestSpy = spyOn(api as any, 'request');
    });


    it('should call \'buildPath()\' with the pathname and params', () => {
      api.get('/foo', {bar: 'baz'});

      expect(apiBuildPathSpy).toHaveBeenCalled();
      expect(apiBuildPathSpy.calls.argsFor(0)).toEqual(['/foo', {bar: 'baz'}]);
    });


    it('should call \'request()\' with the correct method', () => {
      api.get('/foo');

      expect(apiRequestSpy).toHaveBeenCalled();
      expect(apiRequestSpy.calls.argsFor(0)[0]).toBe('get');
    });


    it('should call \'request()\' with the correct path', () => {
      apiBuildPathSpy.and.returnValue('/foo/bar');
      api.get('foo');

      expect(apiRequestSpy).toHaveBeenCalled();
      expect(apiRequestSpy.calls.argsFor(0)[1]).toBe('/foo/bar');
    });


    it('should not pass data to \'request()\'', () => {
      (api.get as any)('foo', {}, {});

      expect(apiRequestSpy).toHaveBeenCalled();
      expect(apiRequestSpy.calls.argsFor(0)[2]).toBeUndefined();
    });

  });


  describe('post()', () => {
    let apiBuildPathSpy: jasmine.Spy;
    let apiRequestSpy: jasmine.Spy;

    beforeEach(() => {
      apiBuildPathSpy = spyOn(api as any, 'buildPath');
      apiRequestSpy = spyOn(api as any, 'request');
    });


    it('should call \'buildPath()\' with the pathname and params', () => {
      api.post('/foo', {bar: 'baz'});

      expect(apiBuildPathSpy).toHaveBeenCalled();
      expect(apiBuildPathSpy.calls.argsFor(0)).toEqual(['/foo', {bar: 'baz'}]);
    });


    it('should call \'request()\' with the correct method', () => {
      api.post('/foo');

      expect(apiRequestSpy).toHaveBeenCalled();
      expect(apiRequestSpy.calls.argsFor(0)[0]).toBe('post');
    });


    it('should call \'request()\' with the correct path', () => {
      apiBuildPathSpy.and.returnValue('/foo/bar');
      api.post('/foo');

      expect(apiRequestSpy).toHaveBeenCalled();
      expect(apiRequestSpy.calls.argsFor(0)[1]).toBe('/foo/bar');
    });


    it('should pass the data to \'request()\'', () => {
      api.post('/foo', {}, {bar: 'baz'});

      expect(apiRequestSpy).toHaveBeenCalled();
      expect(apiRequestSpy.calls.argsFor(0)[2]).toEqual({bar: 'baz'});
    });

  });


  describe('getPaginated()', () => {
    let deferreds: {resolve: (v: any) => void, reject: (v: any) => void}[];

    beforeEach(() => {
      deferreds = [];
      spyOn(api, 'get').and.callFake(() => new Promise((resolve, reject) => deferreds.push({resolve, reject})));
    });


    it('should return a promise', () => {
      expect((api as any).getPaginated()).toEqual(jasmine.any(Promise));
    });


    it('should call \'get()\' with the correct pathname and params', () => {
      (api as any).getPaginated('/foo/bar');
      (api as any).getPaginated('/foo/bar', {baz: 'qux'});

      expect(api.get).toHaveBeenCalledWith('/foo/bar', {page: 0, per_page: 100});
      expect(api.get).toHaveBeenCalledWith('/foo/bar', {baz: 'qux', page: 0, per_page: 100});
    });


    it('should reject if the request fails', done => {
      (api as any).getPaginated('/foo/bar').catch((err: any) => {
        expect(err).toBe('Test');
        done();
      });

      deferreds[0].reject('Test');
    });


    it('should resolve with the returned items', done => {
      const items = [{id: 1}, {id: 2}];

      (api as any).getPaginated('/foo/bar').then((data: any) => {
        expect(data).toEqual(items);
        done();
      });

      deferreds[0].resolve(items);
    });


    it('should iteratively call \'get()\' to fetch all items', done => {
      // Create an array or 250 objects.
      const allItems = '.'.repeat(250).split('').map((_, i) => ({id: i}));
      const apiGetSpy = api.get as jasmine.Spy;

      (api as any).getPaginated('/foo/bar', {baz: 'qux'}).then((data: any) => {
        const paramsForPage = (page: number) => ({baz: 'qux', page, per_page: 100});

        expect(apiGetSpy).toHaveBeenCalledTimes(3);
        expect(apiGetSpy.calls.argsFor(0)).toEqual(['/foo/bar', paramsForPage(0)]);
        expect(apiGetSpy.calls.argsFor(1)).toEqual(['/foo/bar', paramsForPage(1)]);
        expect(apiGetSpy.calls.argsFor(2)).toEqual(['/foo/bar', paramsForPage(2)]);

        expect(data).toEqual(allItems);

        done();
      });

      deferreds[0].resolve(allItems.slice(0, 100));
      setTimeout(() => {
        deferreds[1].resolve(allItems.slice(100, 200));
        setTimeout(() => {
          deferreds[2].resolve(allItems.slice(200));
        }, 0);
      }, 0);
    });

  });


  // Protected methods

  describe('buildPath()', () => {

    it('should return the pathname if no params', () => {
      expect((api as any).buildPath('/foo')).toBe('/foo');
      expect((api as any).buildPath('/foo', undefined)).toBe('/foo');
      expect((api as any).buildPath('/foo', null)).toBe('/foo');
    });


    it('should append the params to the pathname', () => {
      expect((api as any).buildPath('/foo', {bar: 'baz'})).toBe('/foo?bar=baz');
    });


    it('should join the params with \'&\'', () => {
      expect((api as any).buildPath('/foo', {bar: 1, baz: 2})).toBe('/foo?bar=1&baz=2');
    });


    it('should ignore undefined/null params', () => {
      expect((api as any).buildPath('/foo', {bar: undefined, baz: null})).toBe('/foo');
    });


    it('should encode param values as URI components', () => {
      expect((api as any).buildPath('/foo', {bar: 'b a&z'})).toBe('/foo?bar=b%20a%26z');
    });

  });

  describe('request()', () => {
    it('should return a promise', () => {
      nock('https://api.github.com').get('').reply(200);
      expect((api as any).request()).toEqual(jasmine.any(Promise));
    });


    it('should call \'https.request()\' with the correct options', () => {
      const requestHandler = nock('https://api.github.com')
        .intercept('/path', 'method')
        .reply(200);

      (api as any).request('method', '/path');
      requestHandler.done();
    });


    it('should add the \'Authorization\' header containing the \'githubToken\'', () => {
      const requestHandler = nock('https://api.github.com')
        .intercept('/path', 'method', undefined, {
          reqheaders: {Authorization: 'token 12345'},
        })
        .reply(200);
      (api as any).request('method', '/path');
      requestHandler.done();
    });


    it('should reject on request error', async () => {
      nock('https://api.github.com')
        .intercept('/path', 'method')
        .replyWithError('Test');
      let message = 'Failed to reject error';
      await (api as any).request('method', '/path').catch((err: any) => message = err.message);
      expect(message).toEqual('Test');
    });


    it('should \'JSON.stringify\' and send the data along with the request', () => {
      const data = {key: 'value'};
      const requestHandler = nock('https://api.github.com')
        .intercept('/path', 'method', JSON.stringify(data))
        .reply(200);
      (api as any).request('method', '/path', data);
      requestHandler.done();
    });


    it('should reject if response statusCode is <200', done => {
      const requestHandler = nock('https://api.github.com')
        .intercept('/path', 'method')
        .reply(199);

      (api as any).request('method', '/path')
        .catch((err: string) => {
          expect(err).toContain('failed');
          expect(err).toContain('status: 199');
          done();
        });
      requestHandler.done();
    });


    it('should reject if response statusCode is >=400', done => {
      const requestHandler = nock('https://api.github.com')
        .intercept('/path', 'method')
        .reply(400);

      (api as any).request('method', '/path')
        .catch((err: string) => {
          expect(err).toContain('failed');
          expect(err).toContain('status: 400');
          done();
        });
      requestHandler.done();
    });


    it('should include the response text in the rejection message', done => {
      const requestHandler = nock('https://api.github.com')
        .intercept('/path', 'method')
        .reply(500, 'Test');

      (api as any).request('method', '/path')
        .catch((err: string) => {
          expect(err).toContain('Test');
          done();
        });
      requestHandler.done();
     });


    it('should resolve if returned statusCode is >=200 and <400', done => {
      const requestHandler = nock('https://api.github.com')
        .intercept('/path', 'method')
        .reply(200);

      (api as any).request('method', '/path').then(done);
      requestHandler.done();
    });


    it('should parse the response body into an object using \'JSON.parse\'', done => {
      const requestHandler = nock('https://api.github.com')
        .intercept('/path', 'method')
        .reply(300, '{"foo": "bar"}');

      (api as any).request('method', '/path').then((data: any) => {
        expect(data).toEqual({foo: 'bar'});
        done();
      });
      requestHandler.done();
    });

    it('should reject if the response text is malformed JSON', done => {
      const requestHandler = nock('https://api.github.com')
        .intercept('/path', 'method')
        .reply(300, '}');

      (api as any).request('method', '/path').catch((err: any) => {
        expect(err).toEqual(jasmine.any(SyntaxError));
        done();
      });
      requestHandler.done();
    });

  });

});
