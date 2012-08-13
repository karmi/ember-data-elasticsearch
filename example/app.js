var App = Em.Application.create({
  name: "Tasks",

  Models:      Ember.Object.extend(),
  Views:       Ember.Object.extend(),
  Controllers: Ember.Object.extend()
});

App.Models.Task = Ember.Object.extend({
  title:     null,
  completed: false
});

App.Controllers.tasks = Ember.ArrayController.create({
  content: [],

  createTask: function(value) {
    var task = App.Models.Task.create({ title: value });
    this.pushObject(task);
  },

  removeTask: function(event) {
    if ( confirm("Delete this task?") ) {
      var task = event.context;
      this.removeObject(task);
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
