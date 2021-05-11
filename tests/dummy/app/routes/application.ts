import Route from '@ember/routing/route';

export default class extends Route {
  model() {
    return this.store.query('film', { filmID: 1 });
  }
}
