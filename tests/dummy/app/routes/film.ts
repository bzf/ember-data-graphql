import Route from '@ember/routing/route';

export default class extends Route {
  model({ film_id }: { film_id: string }) {
    return this.store.queryRecord('film', { id: film_id });
  }
}
