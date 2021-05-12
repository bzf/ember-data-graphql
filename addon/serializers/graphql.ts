import DS from 'ember-data';
import gql from 'graphql-tag';

export default class Graphql extends DS.Serializer {
  normalizeResponse(store, modelClass, payload) {
    let result = undefined;

    if (Array.isArray(payload)) {
      result = this.normalizeArray(store, modelClass, payload);
    } else if (payload.data) {
      result = this.normalizeArray(store, modelClass, payload.data);
    } else {
      result = this.normalize(store, modelClass, payload);
    }

    return { ...result, meta: payload.meta || {} };
  }

  normalizeArray(store, modelClass, payload) {
    return payload
      .map((hash) => this.normalize(store, modelClass, hash))
      .reduce(
        (acc, { data, included }) => {
          return {
            data: [...acc.data, data],
            included: [...acc.included, ...included],
          };
        },
        { data: [], included: [] }
      );
  }

  normalize(store, modelClass, hash) {
    return {
      data: {
        id: hash.id.toString(),
        type: this.modelNameFromResponse(hash),
        attributes: this.attributesFromResponse(modelClass, hash),
        relationships: this.relationshipsFromResponse(modelClass, hash),
      },

      included: this.includedResourcesFromResponse(store, modelClass, hash),
    };
  }

  attributesFromResponse(modelClass, payload) {
    return Array.from(modelClass.attributes).reduce(
      (hash, [key, _]) => Object.assign(hash, { [key]: payload[key] }),
      {}
    );
  }

  relationshipsFromResponse(modelClass, payload) {
    return Array.from(modelClass.relationships).reduce(
      (hash, [a, [b]]) =>
        Object.assign({}, hash, {
          [b.key]: {
            data: { id: payload[b.key].id, type: b.name },
          },
        }),
      {}
    );
  }

  includedResourcesFromResponse(store, modelClass, payload) {
    return Array.from(modelClass.relationships).flatMap(([a, [b]]) => {
      const model = store.modelFor(b.meta.name);
      const value = payload[b.meta.key];

      return {
        data: this.attributesFromResponse(model, value),
        type: b.name,
        id: value.id,
      };
    });
  }

  fragment(modelClass, fragmentName) {
    const attributeNames = Array.from(modelClass.attributes.keys());

    return gql`
    fragment ${fragmentName} on ${modelClass.name} {
      ${attributeNames.join('\n')}
    }
    `;
  }

  modelNameFromResponse({ __typename }) {
    return __typename.toLowerCase();
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your serializers.
declare module 'ember-data/types/registries/serializer' {
  export default interface SerializerRegistry {
    graphql: Graphql;
  }
}
