## Ember Data Adapter for elasticsearch

This library provides an adapter for the [_Ember Data_](http://github.com/emberjs/data)
persistence framework for [_Ember.js_](http://emberjs.com/), allowing to store
application models as JSON documents in [elasticsearch](http://elasticsearch.org).

It handles the full model lifecycle (create/read/update/delete), in the same way
as the `DS.RESTAdapter` bundled with _Ember Data_.

It does not provide support for any _Rails_-like `has_many` associations and probably never will.

It does not provide support for the bulk _Ember Data_ API, yet.


### Usage

First, load the `ember-data/lib/adapters/elasticsearch_adapter.js` file in your application.

Use the adapter in your application's _store_:

`````````````````````````````````````````````````````````````````````javascript
var App = Em.Application.create();

App.store = DS.Store.create({
  revision: 4,
  adapter: DS.ElasticSearchAdapter.create({url: 'http://localhost:9200'})
});
`````````````````````````````````````````````````````````````````````

To define a _model_ in your application, use the standard _Ember Data_ API:

`````````````````````````````````````````````````````````````````````javascript
App.Person = DS.Model.extend({
  name: DS.attr('string')
});
`````````````````````````````````````````````````````````````````````

Define an _index_ and _type_ for the adapter as the model's `url` property:

`````````````````````````````````````````````````````````````````````javascript
App.Person.reopenClass({
  url: 'people/person'
});
`````````````````````````````````````````````````````````````````````

To create a new record:

`````````````````````````````````````````````````````````````````````javascript
App.Person.createRecord({ id: 1, name: "John" });
App.Person.createRecord({ id: 2, name: "Mary" });
store.commit();
`````````````````````````````````````````````````````````````````````

To load models from the store, use the `find` method:

`````````````````````````````````````````````````````````````````````javascript
var people = App.Person.find();
people.toArray().map( function(person) { return person.get("name") } );
// => ["John", "Mary"]
`````````````````````````````````````````````````````````````````````

To load a single model by ID:

`````````````````````````````````````````````````````````````````````javascript
var person = App.Person.find( 1 );
person.get("name");
// => "John"
`````````````````````````````````````````````````````````````````````

To load multiple models by their IDs, pass them as an _Array_:

`````````````````````````````````````````````````````````````````````javascript
var people = App.Person.find( [2, 1] );
people.toArray().map( function(person) { return person.get("name") } );
// => ["Mary", "John"]
`````````````````````````````````````````````````````````````````````

To load models by an [elasticsearch query](http://www.elasticsearch.org/guide/reference/query-dsl/),
pass it as an _Object_:

`````````````````````````````````````````````````````````````````````javascript
var people = App.Person.find( {query: { query_string: { query: "john" } }} );
people.get("length");
// => 1
`````````````````````````````````````````````````````````````````````

To persist model changes to the store, use the store's `commit` method:

`````````````````````````````````````````````````````````````````````javascript
person.set("name", "Frank");
store.commit();
`````````````````````````````````````````````````````````````````````

To remove the record from the store:

`````````````````````````````````````````````````````````````````````javascript
person.deleteRecord();
store.commit();
`````````````````````````````````````````````````````````````````````

Note, that all the methods are asynchronous, so the returned object is empty;
bindings and observers take care of updating the object with loaded data in an _Ember.js_ application.

See the _Ember Data_ [documentation](https://github.com/emberjs/data#finding-a-specific-record-instance)
for more information.

### Example Application

The library includes
an [example “todos” application](http://github.com/karmi/ember-data-elasticsearch/tree/master/example),
as required by law.

### Tests

The library comes with a _QUnit_-based integration test suite
in `ember-data/test/elasticsearch_adapter_tests.js`.

Apart from running it in the browser, you can run it on the command line with
the [_PhantomJS_](http://phantomjs.org) JavaScript runtime via a Rake task:

    rake test


-----

[Karel Minarik](http://karmi.cz) and [contributors](http://github.com/karmi/ember-data-elasticsearch/contributors)
