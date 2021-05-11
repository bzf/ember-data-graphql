import Route from '@ember/routing/route';

export default class extends Route {
  model() {
    return this.store.queryRecord('film', { filmID: 1 });
  }
}
