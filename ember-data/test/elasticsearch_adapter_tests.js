Ember.ENV['DEBUG'] = true;

var get = Ember.get, set = Ember.set;

var URL = "http://localhost:9200";

var people_data = [
  { id: 1, name: "John" },
  { id: 2, name: "Mary" }
];

var store = DS.Store.create({
  revision: 4,
  adapter: DS.ElasticSearchAdapter.create({url: URL})
});

var Person = DS.Model.extend({
  name: DS.attr('string'),

  didLoad: function() {
    // console.log(this.toString() + " finished loading.");
  }
});

Person.reopenClass({
  url: 'people-test/person'
});

QUnit.begin(function() {
  // NOTE: Index cleanup done in Rake task
  // try {
  //   jQuery.ajax({ url:  [URL, 'people-test'].join('/'),
  //     type: 'DELETE',
  //     dataType:    'json',
  //     success: function() { console.log("Test index deleted.") }
  //   });
  // } catch (e) {};

  // Populate test index with data
  //
  var payload = people_data
                    .reduce(function(previous, current, index) {
                      // console.debug('previous:', previous, 'current:', current, index);
                      previous.push({index: {_index: "people-test", _type: "person", _id: current.id}});
                      previous.push(current);
                      return previous
                    }, [])
                    .map( function(i) { return JSON.stringify(i) } ).join("\n") + "\n";

  jQuery.post([URL, "people-test/_bulk?refresh=true"].join('/'), payload, function(data) {
    console.debug("Test data loaded.")
  });
});

asyncTest("elasticsearch connection", function() {
  jQuery.get(URL, function(data, textStatus, xhr) {
    equal(textStatus, 'success', "is working");
    start();
  })
});

asyncTest("elasticsearch index", function() {
  jQuery.get([URL, 'people-test', '_status'].join('/'), function(data, textStatus, xhr) {
    equal(textStatus, 'success', "is working");
    start();
  })
});

module("Adapter", {});

test( "has default URL", function() {
  var store = DS.Store.create({
    revision: 4,
    adapter: DS.ElasticSearchAdapter.create()
  });

  equal(store.adapter.url, "http://localhost:9200")
});

test( "has custom URL", function() {
  var store = DS.Store.create({
    revision: 4,
    adapter: DS.ElasticSearchAdapter.create({url: "http://search.example.com"})
  });

  equal(store.adapter.url, "http://search.example.com")
});

test( "mixes the find() method into models", function() {
  ok ( Ember.canInvoke(Person, "find"), "mixes Ember Data methods into models" );

  var result = Person.find('foobar');
  ok( result.get("isInstance"),  "is instance of Person");
});

module("Find", {
  setup: function() {
    // var payload = people_data
    //                 .reduce(function(previous, current, index) {
    //                   // console.debug('previous:', previous, 'current:', current, index);
    //                   previous.push({index: {_index: "people-test", _type: "person", _id: current.id}});
    //                   previous.push(current);
    //                   return previous
    //                 }, [])
    //                 .map( function(i) { return JSON.stringify(i) } ).join("\n") + "\n"
    // // payload.map( function(i) { return JSON.stringify(i) } ).join("\n") + "\n"
    // // people_data.reduce(function(previous, current, index) {console.log('previous:', previous, 'current:', current, index); previous.push({index: {_index: "people-test", _type: "person", _id: current.id}}); previous.push(current); return previous}, [])
    // // console.debug(payload)
    // jQuery.post([URL, "people-test/_bulk?refresh=true"].join('/'), payload, function(data) {
    //   console.debug("Test data loaded.")
    // });
  },
  teardown: function() {
    // try {
    //   return jQuery.ajax({ url:  [URL, 'people-test'].join("\n"),
    //     type: 'DELETE',
    //     dataType:    'json',
    //     success: function() { console.log("Test index deleted.") }
    //   });
    // } catch (e) {}
  }
});

asyncTest( "find() loads a single person", function() {
  var result = store.find(Person, 1);

  setTimeout(function() {
    // console.debug('result:', result.get("name"))

    equal( result.get('name'), "John", "has proper name value" );
    start();
  }, 100);
});

asyncTest( "find() does not load a missing person", function() {
  var result = store.find(Person, 'foobar');

  setTimeout(function() {
    ok( ! result.get("isLoaded"), "record is not loaded (actual: "+result.get('stateManager.currentState.path')+")" );
    start();
  }, 100);
});

asyncTest( "findAll() loads all people", function() {
  var results = store.findAll(Person);

  setTimeout(function() {
    // equal( results.get('length'), 2, "has two instances of Person" );
    ok( results.get('length') >= 2, "has at least two instances of Person (actual: "+results.get('length')+")" );

    // Use for "testing the tests":
    // equal( get(results.objectAt(0), 'name'), "Mary", "has proper name value" );

    start();
  }, 100);
});

asyncTest( "findMany() loads people by IDs", function() {
  var results = store.findMany(Person, [2, 1]);

  setTimeout(function() {
    equal( results.get('length'), 2, "has two instances of Person" );

    equal( results.objectAt(0).get('name'), "Mary", "has proper name value" );
    equal( results.objectAt(1).get('name'), "John", "has proper name value" );

    start();
  }, 100);
});

asyncTest( "findQuery() loads people by fulltext query", function() {
  var query   = {query: { query_string: { query: 'mary' } }};
  var results = store.findQuery(Person, query);

  setTimeout(function() {
    equal( results.get('length'), 1, "has one instance of Person" );

    equal( results.objectAt(0).get('name'), "Mary", "has proper name value" );

    start();
  }, 100);
});


module("Create", {});

asyncTest( "creates a new person with ID", function() {
  var created = store.createRecord(Person,  { id: 3, name: "Alice" });
  store.commit();

  setTimeout(function() {
    var result  = store.find(Person, 3);
    // console.debug('result:', result.toJSON())

    ok( created.get("isLoaded"), "is loaded (actual: "+created.get('stateManager.currentState.path')+")" )
    equal( result.get('name'), "Alice", "has proper name" );
    equal( result.get('id'),   "3", "has proper ID" );

    start();

    try {
      return jQuery.ajax({ url:  [URL, 'people-test', 'person', 3].join('/'), type: 'DELETE', dataType: 'json',
        success: function() { console.log("Test person deleted.") }
      });
    } catch (e) {}
  }, 100);
});

asyncTest( "creates a new person with autogenerated ID", function() {
  var created = store.createRecord(Person,  { name: "Bishop" });
  store.commit();

  setTimeout(function() {
    var result  = store.find(Person, created.get("id"));

    setTimeout(function() {
      // console.log('created', created.toJSON())
      // console.debug('result:', result.toJSON())

      ok( created.get("isLoaded"), "is loaded (actual: "+created.get('stateManager.currentState.path')+")" )
      equal( result.get('name'), "Bishop", "has proper name value" );
      equal( result.get('id'),   created.get("id"), "has proper ID" );

      start();

      try {
      return jQuery.ajax({ url:  [URL, 'people-test', 'person', created.get("id")].join('/'), type: 'DELETE', dataType: 'json',
        success: function() { console.log("Test person deleted.") }
      });
    } catch (e) {}
    }, 100);
  }, 100);
});

module("Update", {
  setup: function() {
    store.createRecord(Person,  { id: 33, name: "Anne" });
    store.commit();
  }
});

asyncTest( "updates a person", function() {
  var existing = store.find(Person, 33);

  setTimeout(function() {
    // console.debug('result:', existing.toJSON());

    ok( existing.get("isLoaded"), "record is loaded (actual: "+existing.get('stateManager.currentState.path')+")" );

    existing.set("name", "Brigitte");

    ok( existing.get("isDirty"), "record is dirty (actual: "+existing.get('stateManager.currentState.path')+")" );

    store.commit();

    ok( existing.get("isSaving"), "record is being saved (actual: "+existing.get('stateManager.currentState.path')+")" );

    var loaded = store.find(Person, 33);
    equal( loaded.get('name'), "Brigitte", "has proper name value" );

    start();
  }, 100);
});


module("Delete", {
  setup: function() {
    store.createRecord(Person,  { id: 99, name: "Bob" });
    store.commit();
  }
});

asyncTest( "deletes a person", function() {
  var existing = store.find(Person, 99);

  setTimeout(function() {
    // console.debug('result:', existing.toJSON());

    ok( existing.get("isLoaded"), "record is loaded (actual: "+existing.get('stateManager.currentState.path')+")" );

    existing.deleteRecord();
    store.commit();

    ok( existing.get("isDeleted"), "record is deleted (actual: "+existing.get('stateManager.currentState.path')+")" );

    var missing = store.find(Person, 99);

    ok( missing.get("isDeleted"), "fresh record is deleted (actual: "+existing.get('stateManager.currentState.path')+")" );

    start();
  }, 100);
});
