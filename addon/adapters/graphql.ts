import DS from 'ember-data';
import gql from 'graphql-tag';
import { isPresent } from '@ember/utils';
import { print } from 'graphql/language/printer';
import { pluralize, singularize } from 'ember-inflector';

export default class Graphql extends DS.Adapter {
  host = undefined;
  namespace = undefined;

  async findRecord(store, type, id) {
    const serializer = store.serializerFor(type.modelName);
    const modelClass = store.modelFor(type.modelName);

    const url = [this.host, this.namespace, 'graphql']
      .filter(isPresent)
      .join('/');

    const fieldName = this.fieldForQueryRecord(type);
    const fragmentName = `${type.modelName}${id.toString().replace(/\W/g, '')}`;
    const fragment = serializer.fragment(store, modelClass, fragmentName);

    const query = gql`
      query {
        ${fieldName}${this.serializeParams({ id })} {
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
      return result.data[fieldName].firstObject;
    } else {
      return result.data[fieldName];
    }
  }

  async query(store, type, options = {}) {
    const serializer = store.serializerFor(type.modelName);
    const modelClass = store.modelFor(type.modelName);

    const url = [this.host, this.namespace, 'graphql']
      .filter(isPresent)
      .join('/');

    const fieldName = this.fieldForQuery(type);
    const fragmentName = `${type.modelName}${Object.keys(options).join('')}`;
    const fragment = serializer.fragment(store, modelClass, fragmentName);

    const query = gql`
      query {
        ${fieldName}${this.serializeParams(options)} {
          pageInfo { ${this.pageInfoKeys().join(' ')} }
          ${this.keyForQueryNodes(modelClass)} {
            ...${fragmentName}
            id
            __typename
          }
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

    return {
      data: result.data[fieldName][this.keyForQueryNodes(type)],
      meta: result.data[fieldName].pageInfo,
    };
  }

  async queryRecord(store, type, options) {
    const serializer = store.serializerFor(type.modelName);
    const modelClass = store.modelFor(type.modelName);

    const url = [this.host, this.namespace, 'graphql']
      .filter(isPresent)
      .join('/');

    const fieldName = this.fieldForQueryRecord(type);
    const fragmentName = `${type.modelName}${Object.keys(options).join('')}`;
    const fragment = serializer.fragment(store, modelClass, fragmentName);

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

  keyForQueryNodes(modelClass) {
    return pluralize(modelClass.modelName).toLowerCase();
  }

  pageInfoKeys() {
    return ['startCursor', 'hasNextPage', 'hasPreviousPage', 'endCursor'];
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

// DO NOT DELETE: this is how TypeScript knows how to look up your adapters.
declare module 'ember-data/types/registries/adapter' {
  export default interface AdapterRegistry {
    graphql: Graphql;
  }
}
