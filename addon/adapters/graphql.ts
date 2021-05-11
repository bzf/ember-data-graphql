import DS from 'ember-data';
import gql from 'graphql-tag';
import { isPresent } from '@ember/utils';
import { print } from 'graphql/language/printer';
import { pluralize, singularize } from 'ember-inflector';

export default class Graphql extends DS.Adapter {
  host = undefined;
  namespace = undefined;

  async query(store, type, options) {
    const serializer = store.serializerFor(type.modelName);
    const modelClass = store.modelFor(type.modelName);

    const url = [this.host, this.namespace, 'graphql']
      .filter(isPresent)
      .join('/');

    const fieldName = this.fieldForQuery(type);
    const fragmentName = shortId();
    const fragment = serializer.fragment(modelClass, fragmentName);

    const query = gql`
      query {
        ${fieldName}${this.serializeParams(options)} {
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

    if (Array.isArray(result.data[fieldName])) {
      return result.data[fieldName];
    } else {
      return [result.data[fieldName]];
    }
  }

  async queryRecord(store, type, options) {
    const serializer = store.serializerFor(type.modelName);
    const modelClass = store.modelFor(type.modelName);

    const url = [this.host, this.namespace, 'graphql']
      .filter(isPresent)
      .join('/');

    const fieldName = this.fieldForQueryRecord(type);
    const fragmentName = shortId();
    const fragment = serializer.fragment(modelClass, fragmentName);

    console.log(fragment);

    const query = gql`
      query {
        ${fieldName}${this.serializeParams(options)} {
          ...${fragmentName}
          id
          __typename
        }
      }
      ${fragment}
    `;

    console.log(query);

    const result = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: `query ${print(query)}` }),
    }).then((r) => r.json());

    if (Array.isArray(result.data[fieldName])) {
      return result.data[fieldName].firstObject;
    } else {
      return result.data[fieldName];
    }
  }

  fieldForQuery(modelClass) {
    return pluralize(modelClass.modelName).toLowerCase();
  }

  fieldForQueryRecord(modelClass) {
    return singularize(modelClass.modelName).toLowerCase();
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
