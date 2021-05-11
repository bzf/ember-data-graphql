import DS from 'ember-data';
const { attr } = DS;

export default class Film extends DS.Model {
  @attr('string') declare title: string;
  @attr('string') declare director: string;
}
