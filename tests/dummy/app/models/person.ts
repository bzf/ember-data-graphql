import DS from 'ember-data';
import Planet from './planet';

const { attr, belongsTo } = DS;

export default class Person extends DS.Model {
  @attr('string') declare name: string;

  @belongsTo('planet', { async: false }) declare homeworld: Planet;
}
