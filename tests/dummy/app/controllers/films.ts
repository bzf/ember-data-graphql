import Controller from '@ember/controller';
import { dropTask } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';
import { readOnly } from '@ember/object/computed';
import { isEmpty } from '@ember/utils';
import { A } from '@ember/array';

export default class extends Controller {
  @tracked films = A();

  @readOnly('fetchFilms.lastSuccessful.value.meta') meta;

  @dropTask
  *fetchFilms() {
    let options = { first: 3 };

    if (this.meta?.endCursor) {
      options.after = this.meta.endCursor;
    }

    const films = yield this.store.query('film', options);

    this.films.addObjects(films.toArray());

    return { meta: films.meta };
  }
}
