import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Model, { attr } from '@ember-data/model';

module('Unit | Serializer | graphql', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const serializer = this.owner.lookup('serializer:graphql');

    assert.ok(serializer);
  });

  test('normalize', function (assert) {
    const store = this.owner.lookup('service:store');
    const serializer = this.owner.lookup('serializer:graphql');

    class User extends Model {
      @attr('string') declare name: string;
      @attr('number') declare age: number;
    }

    const payload = {
      id: 3,
      name: 'Frej',
      age: 37,
      __typename: 'user',
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
      },
    });
  });

  test('modelNameFromResponse', function (assert) {
    const serializer = this.owner.lookup('serializer:graphql');

    const result = serializer.modelNameFromResponse({ __typename: 'user' });

    assert.equal(result, 'user');
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
