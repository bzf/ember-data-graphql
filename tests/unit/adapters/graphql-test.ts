import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import Model, { attr, hasMany } from '@ember-data/model';
import GraphqlSerializer from 'ember-data-graphql/serializers/graphql';

module('Unit | Adapter | graphql', function (hooks) {
  setupTest(hooks);
  setupMirage(hooks);

  test('it exists', function (assert) {
    let adapter = this.owner.lookup('adapter:graphql');
    assert.ok(adapter);
  });

  test('findRecord', async function (assert) {
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

    const result = await adapter.findRecord(store, User, 1, []);

    assert.deepEqual(result, {
      id: 1,
      name: 'Bruno',
      age: 35,
      __typename: 'User',
    });

    const requests = this.server.pretender.handledRequests;
    assert.equal(requests.length, 1);

    const { query } = JSON.parse(requests[0].requestBody);
    assert.equal(
      query,
      'query {\n  user(id: 1) {\n    ...user1\n    id\n    __typename\n  }\n}\n\nfragment user1 on User {\n  name\n  age\n}\n'
    );
  });

  test('findRecord with non-async relation includes it in the response', async function (assert) {
    this.server.post(
      '/graphql',
      () => ({
        data: {
          user: {
            id: 1,
            name: 'Bruno',
            age: 35,
            __typename: 'User',
            posts: [
              {
                id: 1,
                title: 'Using GraphQL with Ember-Data',
                __typename: 'post',
              },
            ],
          },
        },
      }),
      200
    );

    const store = this.owner.lookup('service:store');
    const adapter = this.owner.lookup('adapter:graphql');

    class Post extends Model {
      @attr('string') declare title: string;
    }

    class User extends Model {
      modelName = 'user';

      @attr('string') declare name: string;
      @attr('number') declare age: number;

      @hasMany('post', { async: false }) declare posts: Post[];
    }

    User.modelName = 'user';

    this.owner.register('model:user', User);
    this.owner.register('model:post', Post);
    this.owner.register('serializer:user', GraphqlSerializer);

    const result = await adapter.findRecord(store, User, 1, []);

    assert.deepEqual(result, {
      id: 1,
      name: 'Bruno',
      age: 35,
      __typename: 'User',
      posts: [
        { id: 1, title: 'Using GraphQL with Ember-Data', __typename: 'post' },
      ],
    });

    const requests = this.server.pretender.handledRequests;
    assert.equal(requests.length, 1);

    const { query } = JSON.parse(requests[0].requestBody);
    assert.equal(
      query,
      'query {\n  user(id: 1) {\n    ...user1\n    id\n    __typename\n  }\n}\n\nfragment user1 on User {\n  name\n  age\n  posts {\n    id\n    title\n    __typename\n  }\n}\n'
    );
  });

  test('findRecord with async relation only includes the id', async function (assert) {
    this.server.post(
      '/graphql',
      () => ({
        data: {
          user: {
            id: 1,
            name: 'Bruno',
            age: 35,
            __typename: 'User',
            post_id: 1,
          },
        },
      }),
      200
    );

    const store = this.owner.lookup('service:store');
    const adapter = this.owner.lookup('adapter:graphql');

    class Post extends Model {
      @attr('string') declare title: string;
    }

    class User extends Model {
      modelName = 'user';

      @attr('string') declare name: string;
      @attr('number') declare age: number;

      @hasMany('post', { async: true }) declare posts: Post[];
    }

    User.modelName = 'user';

    this.owner.register('model:user', User);
    this.owner.register('model:post', Post);
    this.owner.register('serializer:user', GraphqlSerializer);

    const result = await adapter.findRecord(store, User, 1, []);

    assert.deepEqual(result, {
      id: 1,
      name: 'Bruno',
      age: 35,
      __typename: 'User',
      posts: [{ id: 1, __typename: 'post' }],
    });

    const requests = this.server.pretender.handledRequests;
    assert.equal(requests.length, 1);

    const { query } = JSON.parse(requests[0].requestBody);
    console.log(query);
    assert.equal(
      query,
      'query {\n  user(id: 1) {\n    ...user1\n    id\n    __typename\n  }\n}\n\nfragment user1 on User {\n  name\n  age\n  posts {\n    id\n    __typename\n  }\n}\n'
    );
  });

  test('query', async function (assert) {
    this.server.post(
      '/graphql',
      () => ({
        data: {
          users: {
            pageInfo: { hello: 1 },
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
      meta: { hello: 1 },
      data: [{ id: 1, name: 'Bruno', age: 35, __typename: 'User' }],
    });

    const requests = this.server.pretender.handledRequests;
    assert.equal(requests.length, 1);

    const { query } = JSON.parse(requests[0].requestBody);
    assert.equal(
      query,
      `query {
  users {
    pageInfo {
      startCursor
      hasNextPage
      hasPreviousPage
      endCursor
    }
    users {
      ...user
      id
      __typename
    }
  }
}

fragment user on User {
  name
  age
}
`
    );
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

    const result = await adapter.queryRecord(store, User, { id: 1 }, []);

    assert.deepEqual(result, {
      id: 1,
      name: 'Bruno',
      age: 35,
      __typename: 'User',
    });

    const requests = this.server.pretender.handledRequests;
    assert.equal(requests.length, 1);

    const { query } = JSON.parse(requests[0].requestBody);
    assert.equal(
      query,
      `query {
  user(id: 1) {
    ...userid
    id
    __typename
  }
}

fragment userid on User {
  name
  age
}
`
    );
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
