import Adapter from 'ember-data-graphql/adapters/graphql';
import { pluralize } from 'ember-inflector';
import { capitalize } from '@ember/string';

export default class ApplicationAdapter extends Adapter {
  host = 'https://swapi-graphql.netlify.app';
  namespace = '.netlify/functions/index';

  fieldForQuery(modelClass) {
    return `all${capitalize(pluralize(modelClass.modelName))}`;
  }

  keyForQueryNodes(modelClass) {
    return pluralize(modelClass.modelName).toLowerCase();
  }
}
