Tasks: Ember Data elasticsearch Persistence Example
===================================================

This is a simple _Ember.js_ application to demonstrate the
[elasticsearch adapter](http://github.com/karmi/ember-data-elasticsearch)
for _Ember Data_.

![Application Screenshot](/karmi/ember-data-elasticsearch/raw/master/example/screenshot.png)

The simplest way to check it out is to open it from the internet: **<http://karmi.github.com/ember-data-elasticsearch>**.

To check it out locally, simply download or clone the repository and open the `index.html` file.

To install it as an elasticsearch `_site` [plugin](http://www.elasticsearch.org/guide/reference/modules/plugins.html),
run:

    $ plugin -install karmi/ember-data-elasticsearch

Next, open the <http://localhost:9200/_plugin/ember-data-elasticsearch/example/index.html> page in your browser:

    $ open http://localhost:9200/_plugin/ember-data-elasticsearch/example/index.html

You may want to check the changes required to add the elasticsearch persistence to the application
by loading the [compare](https://github.com/karmi/ember-data-elasticsearch/compare/app-v1.0...app-v2.0) page.

-----
