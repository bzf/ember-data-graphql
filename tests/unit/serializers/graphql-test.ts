import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Model, { attr, belongsTo } from '@ember-data/model';
import gql from 'graphql-tag';

module('Unit | Serializer | graphql', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const serializer = this.owner.lookup('serializer:graphql');

    assert.ok(serializer);
  });

  module('normalize', function () {
    test('normalize', async function (assert) {
      const store = this.owner.lookup('service:store');
      const serializer = this.owner.lookup('serializer:graphql');

      class User extends Model {
        @attr('string') declare name: string;
        @attr('number') declare age: number;
      }
      await this.owner.register('model:user', User, { singleton: false });

      const payload = {
        id: 3,
        name: 'Frej',
        age: 37,
        __typename: 'User',
      };

      const json = serializer.normalizeResponse(store, User, payload);

      assert.deepEqual(json, {
        data: {
          id: '3',
          type: 'user',
          attributes: {
            name: 'Frej',
            age: 37,
          },
          relationships: {},
        },

        included: [],
        meta: {},
      });
    });

    test('normalize array', function (assert) {
      const store = this.owner.lookup('service:store');
      const serializer = this.owner.lookup('serializer:graphql');

      class User extends Model {
        @attr('string') declare name: string;
        @attr('number') declare age: number;
      }
      this.owner.register('model:user', User);

      const payload = [
        {
          id: 3,
          name: 'Frej',
          age: 37,
          __typename: 'User',
        },
      ];

      const json = serializer.normalizeResponse(store, User, payload);

      assert.deepEqual(json, {
        data: [
          {
            id: '3',
            type: 'user',
            attributes: {
              name: 'Frej',
              age: 37,
            },
            relationships: {},
          },
        ],

        included: [],
        meta: {},
      });
    });

    test('normalize with belongsTo relation', function (assert) {
      const store = this.owner.lookup('service:store');
      const serializer = this.owner.lookup('serializer:graphql');

      class Workplace extends Model {
        @attr('string') declare name: string;
        @attr('string') declare nickname: string;
      }

      class User extends Model {
        @attr('string') declare name: string;
        @attr('number') declare age: number;

        @belongsTo('workplace') declare workplace: Workplace;
      }

      this.owner.register('model:user', User);
      this.owner.register('model:workplace', Workplace);

      const payload = {
        id: 3,
        name: 'Tim',
        age: 60,

        workplace: {
          id: 1,
          name: 'Apple Inc.',
          nickname: 'Tim Apple',
          __typename: 'Workplace',
        },

        __typename: 'User',
      };

      const json = serializer.normalizeResponse(store, User, payload);

      assert.deepEqual(json, {
        data: {
          id: '3',
          type: 'user',
          attributes: {
            name: 'Tim',
            age: 60,
          },
          relationships: {
            workplace: {
              data: { id: 1, type: 'workplace' },
            },
          },
        },
        included: [
          {
            id: 1,
            type: 'workplace',
            attributes: { name: 'Apple Inc.', nickname: 'Tim Apple' },
          },
        ],
        meta: {},
      });
    });
  });

  test('modelNameFromResponse', function (assert) {
    const serializer = this.owner.lookup('serializer:graphql');

    const result = serializer.modelNameFromResponse({ __typename: 'User' });

    assert.equal(result, 'user');
  });

  test('fragments', function (assert) {
    const store = this.owner.lookup('service:store');
    const serializer = this.owner.lookup('serializer:graphql');
    class User extends Model {
      @attr('string') declare name: string;
      @attr('number') declare age: number;
    }

    const result = serializer.fragment(store, User, 'myUserFragment');

    assert.deepEqual(
      result,
      gql`
        fragment myUserFragment on User {
          name
          age
        }
      `
    );
  });

  test('attributesFromResponse', function (assert) {
    const serializer = this.owner.lookup('serializer:graphql');
    class User extends Model {
      @attr('string') declare name: string;
      @attr('number') declare age: number;
    }

    const result = serializer.attributesFromResponse(User, {
      name: 'Herbert',
      age: 36,
      otherAttribute: 1,
    });

    assert.deepEqual(result, {
      name: 'Herbert',
      age: 36,
    });
  });
});
