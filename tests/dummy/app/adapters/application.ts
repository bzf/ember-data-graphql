import Adapter from 'ember-data-graphql/adapters/graphql';

export default class ApplicationAdapter extends Adapter {
  host = 'https://swapi-graphql.netlify.app';
  namespace = '.netlify/functions/index';

  fieldForQuery(modelClass) {
    return modelClass.modelName;
  }
}
