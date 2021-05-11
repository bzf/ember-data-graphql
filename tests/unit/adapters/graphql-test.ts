import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import Model, { attr } from '@ember-data/model';
import GraphqlSerializer from 'ember-data-graphql/serializers/graphql';

module('Unit | Adapter | graphql', function (hooks) {
  setupTest(hooks);
  setupMirage(hooks);

  test('it exists', function (assert) {
    let adapter = this.owner.lookup('adapter:graphql');
    assert.ok(adapter);
  });

  test('query', async function (assert) {
    this.server.post(
      '/graphql',
      () => ({
        data: {
          users: {
            pageInfo: {},
            users: [{ id: 1, name: 'Bruno', age: 35, __typename: 'User' }],
          },
        },
      }),
      200
    );

    const store = this.owner.lookup('service:store');
    const adapter = this.owner.lookup('adapter:graphql');

    class User extends Model {
      modelName = 'user';

      @attr('string') declare name: string;
      @attr('number') declare age: number;
    }

    User.modelName = 'user';

    this.owner.register('model:user', User);
    this.owner.register('serializer:user', GraphqlSerializer);

    const result = await adapter.query(store, User, undefined, []);

    assert.deepEqual(result, {
      meta: {},
      data: [{ id: 1, name: 'Bruno', age: 35, __typename: 'User' }],
    });
  });

  test('queryRecord', async function (assert) {
    this.server.post(
      '/graphql',
      () => ({
        data: {
          user: { id: 1, name: 'Bruno', age: 35, __typename: 'User' },
        },
      }),
      200
    );

    const store = this.owner.lookup('service:store');
    const adapter = this.owner.lookup('adapter:graphql');

    class User extends Model {
      modelName = 'user';

      @attr('string') declare name: string;
      @attr('number') declare age: number;
    }

    User.modelName = 'user';

    this.owner.register('model:user', User);
    this.owner.register('serializer:user', GraphqlSerializer);

    const result = await adapter.queryRecord(store, User, {}, []);

    assert.deepEqual(result, {
      id: 1,
      name: 'Bruno',
      age: 35,
      __typename: 'User',
    });
  });

  test('serializeParams', function (assert) {
    const adapter = this.owner.lookup('adapter:graphql');

    assert.equal(adapter.serializeParams({}), '');

    assert.equal(adapter.serializeParams({ hello: 'true' }), '(hello: "true")');

    assert.equal(adapter.serializeParams({ hello: 1 }), '(hello: 1)');

    assert.equal(
      adapter.serializeParams({ hello: 1, goodbye: '1' }),
      '(hello: 1, goodbye: "1")'
    );
  });
});
