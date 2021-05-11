import DS from 'ember-data';
import gql from 'graphql-tag';
import { isPresent } from '@ember/utils';

export default class Graphql extends DS.Adapter {
  host = undefined;
  namespace = undefined;

  async findAll(store, type, neverSet, snapshotRecordArray) {
    console.log('type', type);
    const serializer = store.serializerFor(type);
    const modelClass = store.modelFor(type);

    const url = [this.host, this.namespace, 'graphql']
      .filter(isPresent)
      .join('/');
    const fragment = serializer.fragment(modelClass, 'lol');

    const query = gql`
      query {
        users {
          ...lol
          __typename
        }
      }
      ${fragment}
    `;

    const result = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }).then((r) => r.json());

    return result.users;
  }

  // * `createRecord()`
  // * `updateRecord()`
  // * `deleteRecord()`
  // * `findRecord()`
  // * `query()`
}

// DO NOT DELETE: this is how TypeScript knows how to look up your adapters.
declare module 'ember-data/types/registries/adapter' {
  export default interface AdapterRegistry {
    graphql: Graphql;
  }
}
