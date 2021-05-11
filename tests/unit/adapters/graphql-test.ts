import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import Model, { attr } from '@ember-data/model';
import gql from 'graphql-tag';
import GraphqlSerializer from 'ember-data-graphql/serializers/graphql';

module('Unit | Adapter | graphql', function (hooks) {
  setupTest(hooks);
  setupMirage(hooks);

  test('it exists', function (assert) {
    let adapter = this.owner.lookup('adapter:graphql');
    assert.ok(adapter);
  });

  test('findAll', async function (assert) {
    this.server.post(
      '/graphql',
      () => ({
        data: {
          users: [{ id: 1, name: 'Bruno', age: 35, __typename: 'User' }],
        },
      }),
      200
    );

    const store = this.owner.lookup('service:store');
    const adapter = this.owner.lookup('adapter:graphql');
    const serializer = this.owner.register(
      'serializer:graphql',
      GraphqlSerializer
    );

    class User extends Model {
      graphqlType = 'User';

      @attr('string') declare name: string;
      @attr('number') declare age: number;
    }
    this.owner.register('model:user', User);
    this.owner.register('serializer:user', GraphqlSerializer);

    const result = await adapter.findAll(store, User, undefined, []);

    assert.deepEqual(result, [
      { id: 1, name: 'Bruno', age: 35, __typename: 'User' },
    ]);
  });

  test('query', async function (assert) {
    this.server.post(
      '/graphql',
      () => ({
        data: {
          users: [{ id: 1, name: 'Bruno', age: 35, __typename: 'User' }],
        },
      }),
      200
    );

    const store = this.owner.lookup('service:store');
    const adapter = this.owner.lookup('adapter:graphql');
    this.owner.register('serializer:graphql', GraphqlSerializer);

    class User extends Model {
      graphqlType = 'User';

      @attr('string') declare name: string;
      @attr('number') declare age: number;
    }
    this.owner.register('model:user', User);
    this.owner.register('serializer:user', GraphqlSerializer);

    const result = await adapter.query(store, User, undefined, []);

    assert.deepEqual(result, [
      { id: 1, name: 'Bruno', age: 35, __typename: 'User' },
    ]);
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