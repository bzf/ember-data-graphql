import DS from 'ember-data';

export default class Graphql extends DS.Serializer {
  normalizeResponse(store, modelClass, payload) {
    return {
      data: {
        id: payload.id.toString(),
        type: this.modelNameFromResponse(payload),
        attributes: this.attributesFromResponse(modelClass, payload),
      },
    };
  }

  attributesFromResponse(modelClass, payload) {
    return Array.from(modelClass.attributes).reduce(
      (hash, [key, _]) => Object.assign(hash, { [key]: payload[key] }),
      {}
    );
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
