import DS from 'ember-data';
import gql from 'graphql-tag';
import { isPresent } from '@ember/utils';
import { print } from 'graphql/language/printer';

export default class Graphql extends DS.Adapter {
  host = undefined;
  namespace = undefined;

  async findAll(store, type, neverSet, snapshotRecordArray) {
    const serializer = store.serializerFor(type.modelName);
    const modelClass = store.modelFor(type.modelName);

    const url = [this.host, this.namespace, 'graphql']
      .filter(isPresent)
      .join('/');
    const fragment = serializer.fragment(modelClass, 'lol');

    const query = gql`
      query {
        film {
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
      body: JSON.stringify({ query: print(query) }),
    }).then((r) => r.json());

    return result.data.film;
  }

  async query(store, type, options) {
    const serializer = store.serializerFor(type.modelName);
    const modelClass = store.modelFor(type.modelName);

    const url = [this.host, this.namespace, 'graphql']
      .filter(isPresent)
      .join('/');
    const fragmentName = shortId();
    const fragment = serializer.fragment(modelClass, fragmentName);

    const query = gql`
      query {
        film${this.serializeParams(options)} {
          ...${fragmentName}
          id
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
      body: JSON.stringify({ query: `query ${print(query)}` }),
    }).then((r) => r.json());

    if (Array.isArray(result.data.film)) {
      return result.data.film;
    } else {
      return [result.data.film];
    }
  }

  // * `createRecord()`
  // * `updateRecord()`
  // * `deleteRecord()`
  // * `findRecord()`
  // * `query()`

  serializeParams(query = {}) {
    if (Object.keys(query).length > 0) {
      const result = Object.keys(query)
        .map((key) => `${key}: ${this.serializeValue(query[key])}`)
        .join(', ');

      return `(${result})`;
    } else {
      return '';
    }
  }

  serializeValue(value) {
    if (typeof value === 'string') {
      return `"${value}"`;
    } else {
      return value;
    }
  }
}

function shortId() {
  var result = [];
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  var charactersLength = characters.length;
  for (var i = 0; i < 16; i++) {
    result.push(
      characters.charAt(Math.floor(Math.random() * charactersLength))
    );
  }

  return result.join('');
}

// DO NOT DELETE: this is how TypeScript knows how to look up your adapters.
declare module 'ember-data/types/registries/adapter' {
  export default interface AdapterRegistry {
    graphql: Graphql;
  }
}
