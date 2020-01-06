import { BBOmnibarUserSessionExpiration } from './omnibar-user-session-expiration';

import { BBCsrfXhr } from '../shared/csrf-xhr';

describe('Omnibar user session expiration', () => {
  let requestSpy: jasmine.Spy;
  let authTtl: number;
  let ttlPromiseOverride: Promise<number>;

  beforeAll(() => {
    requestSpy = spyOn(BBCsrfXhr, 'request').and.callFake((url: string) => {
      switch (url.substr('https://s21aidntoken00blkbapp01.nxt.blackbaud.com/session/'.length)) {
        case 'ttl':
          return ttlPromiseOverride || Promise.resolve(authTtl);
      }

      return Promise.resolve();
    });
  });

  beforeEach(() => {
    BBOmnibarUserSessionExpiration.reset();
    requestSpy.calls.reset();
  });

  afterEach(() => {
    authTtl = undefined;
    ttlPromiseOverride = undefined;
  });

  it('should return a null expiration date if TTL is null', (done) => {
    authTtl = null;

    BBOmnibarUserSessionExpiration.getSessionExpiration(
      'abc',
      123,
      false
    )
      .then((expirationDate) => {
        expect(expirationDate).toBeNull();
        done();
      });
  });

  it('should calculate the expiration based on the auth TTL if legacy TTL is not provided', (done) => {
    spyOn(Date, 'now').and.returnValue(100000);

    authTtl = 50;

    BBOmnibarUserSessionExpiration.getSessionExpiration(
      'abc',
      undefined,
      false
    )
      .then((expirationDate) => {
        expect(expirationDate).toBe(150000);
        done();
      });
  });

  it('should calculate the expiration date based on the lowest legacy TTL or auth TTL value', (done) => {
    spyOn(Date, 'now').and.returnValue(100000);

    // Auth TTL is in seconds
    authTtl = 50;

    BBOmnibarUserSessionExpiration.getSessionExpiration(
      'abc',
      // Legacy TTL is in milliseconds
      60 * 1000,
      false
    )
      .then((expirationDate1) => {
        expect(expirationDate1).toBe(150000);

        BBOmnibarUserSessionExpiration.reset();

        BBOmnibarUserSessionExpiration.getSessionExpiration(
          'abc',
          1,
          false
        )
          .then((expirationDate2) => {
            expect(expirationDate2).toBe(100001);
            done();
          });
      });
  });

  it('should cache the expiration date based on the refresh ID and allow anonymous flags', (done) => {
    const nowSpy = spyOn(Date, 'now').and.returnValue(100000);

    authTtl = 50;

    BBOmnibarUserSessionExpiration.getSessionExpiration(
      'abc',
      undefined,
      false
    )
      .then((expirationDate) => {
        expect(expirationDate).toBe(150000);

        // Simulate the passage of time which should not affect the cached expiration date.
        nowSpy.and.returnValue(200000);

        setTimeout(() => {
          BBOmnibarUserSessionExpiration.getSessionExpiration(
            'abc',
            undefined,
            false
          )
            .then((cachedExpirationDate) => {
              expect(cachedExpirationDate).toBe(150000);
              done();
            });
        }, 200);
      });
  });

  it('should allow the cache to be cleared', (done) => {
    const nowSpy = spyOn(Date, 'now').and.returnValue(100000);

    authTtl = 50;

    BBOmnibarUserSessionExpiration.getSessionExpiration(
      'abc',
      undefined,
      false
    )
      .then((expirationDate) => {
        expect(expirationDate).toBe(150000);

        BBOmnibarUserSessionExpiration.reset();

        // Simulate the passage of time which should change the expiration date since cache was cleared.
        nowSpy.and.returnValue(200000);

        setTimeout(() => {
          BBOmnibarUserSessionExpiration.getSessionExpiration(
            'abc',
            undefined,
            false
          )
            .then((newExpirationDate) => {
              expect(newExpirationDate).toBe(250000);
              done();
            });
        }, 200);
      });
  });

  it('should treat a non-200 TTL response as null', (done) => {
    ttlPromiseOverride = Promise
      .reject(new Error('Not logged in'));

    BBOmnibarUserSessionExpiration.getSessionExpiration(
      'abc',
      undefined,
      false
    )
      .then((expirationDate) => {
        expect(expirationDate).toBeNull();
        done();
      });
  });

});
