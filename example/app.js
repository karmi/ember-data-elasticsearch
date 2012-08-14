var App = Em.Application.create({
  name: "Tasks",

  Models:      Ember.Object.extend(),
  Views:       Ember.Object.extend(),
  Controllers: Ember.Object.extend(),

  // Sniff the URL if we're running as an elasticsearch `_site` plugin
  //
  elasticsearch_url: function() {
    var location = window.location
    return (/_plugin/.test(location.href.toString())) ? location.protocol + "//" + location.host : "http://localhost:9200"
  }(),

  ready: function() {
    var index_url = [App.store.adapter.url, "tasks"].join('/');

    // Let's check if the `tasks` index exists and create it otherwise.
    //
    jQuery.ajax({
      url:   index_url,
      type:  'HEAD',
      error: function() { jQuery.post(index_url, {}, function(data) {}) }
    });
  }
});

// Define a store for the application
//
App.store = DS.Store.create({
  revision: 4,
  adapter: DS.ElasticSearchAdapter.create({url: App.elasticsearch_url})
});

// Define the model using _Ember Data_ API
//
App.Models.Task = DS.Model.extend({
  // Properties:
  //
  title:     DS.attr('string'),
  completed: DS.attr('boolean'),

  // Observe changes and persist them in elasticsearch
  //
  changed: function() {
    App.store.commit()
  }.observes('completed')
});

App.Models.Task.reopenClass({
  // Define the index and type for elasticsearch
  //
  url: 'tasks/task'
});

App.Controllers.tasks = Ember.ArrayController.create({
  content: App.Models.Task.find(),

  createTask: function(value) {
    var task = App.Models.Task.createRecord({ title: value });
    App.store.commit();
  },

  removeTask: function(event) {
    if ( confirm("Delete this task?") ) {
      var task = event.context;

      task.deleteRecord();
      App.store.commit();
    }
  },

  remaining: function() {
    return this.filterProperty('completed', false);
  }.property('@each.completed').cacheable()
});

App.Views.CreateTask = Ember.TextField.extend({
  insertNewline: function(event) {
    var value = this.get('value');

    if (value) {
      App.Controllers.tasks.createTask(value);
      this.set('value', '');
    }
  }
});
