/**
  This class provides an adapter for the Ember Data [https://github.com/emberjs/data]
  persistence library for Ember.js, which stores data as JSON documents
  in elasticsearch [http://elasticsearch.org].

  ### Usage

  Pass the adapter to a store, optionally providing elasticsearch URL:

      var store = DS.Store.create({
        revision: 4,
        adapter: DS.ElasticSearchAdapter.create({url: "http://localhost:9200"})
      });

  Let's assume a standard Ember Data model, such as:

      var Person = DS.Model.extend({
        name: DS.attr('string')
      });

  You have to define an index and type for your model as the `url` attribute:

      Person.reopenClass({
        url: 'people/person'
      });

  Now you can use the standard Ember Data adapter interface
  for creating, updating, destroying and finding records:

      Person.createRecord({ id: 1, name: "John" });
      store.commit();

      var person = Person.find( 1);
      person.get("name");

      person.set("name", "Jonathan");
      store.commit();

      person.deleteRecord();
      store.commit();

  Don't forget, that in Ember Data, you have to call the `commit` method to persist the changes!

  You can use the full elasticsearch's _Query DSL_ to find records:

      var person = Person.find({query: { query_string: { query: 'john' } }});
      person.get("name");

  ### Todo

  * Resolve the content-type issues when talking to elasticsearch from Ajax.
     Can't just add `contentType: 'application/json; charset=UTF-8'` to $.ajax,
     because of: `Request header field Content-Type is not allowed by Access-Control-Allow-Headers.` error.

  * Refactor the HTTP "client".

  * Implement the "bulk" variant of API.

  @extends DS.Adapter
*/

DS.ElasticSearchAdapter = DS.Adapter.extend({

  /**
    @field Default URL for elasticsearch
  */
  url: "http://localhost:9200",

  /**
    HTTP client

    TODO: Refactor, simplify.
  */
  http: {
    get: function(url, callback) {
      return jQuery.ajax({
        url:  url,
        type: 'GET',
        dataType:    'json',
        cache:       true,

        success: callback
      });
    },
    post: function(url, payload, callback) {
      return jQuery.ajax({
        url:  url,
        type: 'POST',
        data: JSON.stringify(payload),
        dataType:    'json',
        cache:       true,

        success: callback
      });
    },
    put: function(url, payload, callback) {
      return jQuery.ajax({
        url:  url,
        type: 'PUT',
        data: JSON.stringify(payload),
        dataType:    'json',
        cache:       true,

        success: callback
      });
    },
    delete: function(url, payload, callback) {
      return jQuery.ajax({
        url:  url,
        type: 'DELETE',
        data: JSON.stringify(payload),
        dataType:    'json',
        cache:       true,

        success: callback
      });
    }
  },

  /**
    Loads a single record by ID:

        store.find(Person, 1);
  */
  find: function(store, type, id) {
    if (Ember.ENV.DEBUG) console.debug('find', store, type, id);
    var url = [this.url, type.url, id].join('/');

    this.http.get(url, function(data, textStatus, xhr) {
      if (Ember.ENV.DEBUG) console.debug('elasticsearch (' + xhr.status + ') :', Ember.ENV.CI ? JSON.stringify(data) : data);
      store.load(type, id, data['_source']);
    });
  },

  /**
    Loads all records (up to one million :):

        store.findAll(Person);
  */
  findAll: function(store, type) {
    var url = [this.url, type.url, '_search'].join('/');
    var payload = {size: 1000000};

    this.http.post(url, payload, function(data, textStatus, xhr) {
      if (Ember.ENV.DEBUG) console.debug('elasticsearch (' + xhr.status + '):', Ember.ENV.CI ? JSON.stringify(data) : data);
      store.loadMany(type, data['hits']['hits'].map( function(i) {
        return Ember.Object.create(i['_source']).reopen({id: i._id, version: i._version})
      } ));
    });
  },

  /**
    Loads a collection of records by IDs:

        store.find(Person, [2, 3, 1]);
  */
  findMany: function(store, type, ids) {
    if (Ember.ENV.DEBUG) console.debug('findMany', ids);

    var url = [this.url, type.url, '_mget'].join('/');
    var payload = {ids: ids};

    this.http.post(url, payload, function(data, textStatus, xhr) {
      if (Ember.ENV.DEBUG) console.debug('elasticsearch (' + xhr.status + '):', Ember.ENV.CI ? JSON.stringify(data) : data);
      store.loadMany(type, data['docs'].map( function(i) { return i['_source'] } ));
    });
  },

  /**
    Loads a collection of records by a fulltext query:

        store.findQuery(Person, {query: { query_string: { query: 'john' } }});

    See the elasticsearch [documentation](http://elasticsearch.org/guide/reference/query-dsl) for more info.
  */
  findQuery: function(store, type, query, recordArray) {
    if (Ember.ENV.DEBUG) console.debug('findQuery', query);

    var url = [this.url, type.url, '_search'].join('/');

    var payload = query;
    // var payload = { query: { query_string: { query: 'John' } } };

    this.http.post(url, payload, function(data, textStatus, xhr) {
      if (Ember.ENV.DEBUG) console.debug('elasticsearch (' + xhr.status + '):', Ember.ENV.CI ? JSON.stringify(data) : data);
      recordArray.load(data['hits']['hits'].map( function(i) { return i['_source'] } ));
    });
  },

  /**
    Creates a new record, persisted in elasticsearch:

        store.createRecord(Person,  { id: 1, name: "Alice" });
        store.commit();

    If you don't provide an ID for the object, elasticsearch will generate one:

        var person = store.createRecord(Person,  { name: "Anne" });
        store.commit();

        result.get('id')
        // => 'abcDEF-abc123XYZ'
  */
  createRecord: function(store, type, record) {
    if (Ember.ENV.DEBUG) console.debug('createRecord', type, record.toJSON(), 'id: ', record.get("id"));
    var id = record.get("id") || null;
    var url = [this.url, type.url, id].join('/');

    var payload = record.toJSON();
    var self = this;

    this.http.post(url, payload, function(data, textStatus, xhr) {
      if (Ember.ENV.DEBUG) console.debug('elasticsearch (' + xhr.status + '):', Ember.ENV.CI ? JSON.stringify(data) : data)
      self.didCreateRecord(store, type, record, data);
    });
  },

  didCreateRecord: function(store, type, record, json) {
    var recordData = record.get('data');

    if (record.get('id')) {
      recordData.commit();
    } else {
      record.beginPropertyChanges();
      record.set('id', json._id)
      record.endPropertyChanges();
    }

    record.send('didCommit');
  },

  /**
    Persists object changes to elasticsearch:

        var person = store.find(Person, 1);
        person.set("name", "Caroline");
        store.commit();
  */
  updateRecord: function(store, type, record) {
    if (Ember.ENV.DEBUG) console.debug('updateRecord', type, record.toJSON(), 'id:', record.get("id"));

    var id = record.get("id");
    var url = [this.url, type.url, id].join('/');

    var payload = record.toJSON();
    var self = this;

    this.http.put(url, payload, function(data, textStatus, xhr) {
      if (Ember.ENV.DEBUG) console.debug('elasticsearch (' + xhr.status + '):', Ember.ENV.CI ? JSON.stringify(data) : data)
      self.didUpdateRecord(store, type, record, data);
    });
  },

  didUpdateRecord: function(store, type, record, json) {
    var recordData = record.get('data');

    recordData.commit();

    record.send('didChangeData');
    record.send('didSaveData');
    record.send('didCommit');
  },

  /**
    Deletes the record from elasticsearch:

        var person = store.find(Person, 1);
        person.deleteRecord();
        store.commit();
  */
  deleteRecord: function(store, type, record) {
    if (Ember.ENV.DEBUG) console.debug('deleteRecord', type, record.toJSON(), 'id: ', record.get("id"));

    var id = record.get("id");
    var url = [this.url, type.url, id].join('/');

    var self = this;

    this.http.delete(url, {}, function(data, textStatus, xhr) {
      if (Ember.ENV.DEBUG) console.debug('elasticsearch (' + xhr.status + '):', Ember.ENV.CI ? JSON.stringify(data) : data)
      self.didDeleteRecord(store, type, record, data);
    });
  },

  didDeleteRecord: function(store, type, record, json) {
    store.didDeleteRecord(record);
  }

});
