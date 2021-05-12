import DS from 'ember-data';
const { attr } = DS;

export default class Planet extends DS.Model {
  @attr('string') declare name: string;
}
