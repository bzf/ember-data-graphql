import DS from 'ember-data';

export default class Graphql extends DS.Serializer {
  normalizeResponse(store, modelClass, payload) {
    return {
      data: {
        id: payload.id.toString(),
        type: this.modelNameFromResponse(payload),
        attributes: this.attributesFromResponse(modelClass, payload),
        relationships: this.relationshipsFromResponse(modelClass, payload),
      },

      included: this.includedResourcesFromResponse(store, modelClass, payload),
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

  modelNameFromResponse({ __typename }) {
    return __typename;
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your serializers.
declare module 'ember-data/types/registries/serializer' {
  export default interface SerializerRegistry {
    graphql: Graphql;
  }
}
