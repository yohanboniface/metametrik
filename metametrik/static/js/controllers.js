/*jshint globalstrict:true */
/*global angular:true */
'use strict';

angular.module('metametrik.controllers', [])
    .controller('BrowseCtrl', function($scope, $location, ejsResource) {

    var ejs = ejsResource('http://localhost:9200'),
        index = 'papers',
        type = 'paper',
        activeFilters = {};

    var request = ejs.Request()
        .indices(index)
        .types(type)
        .facet(ejs.TermsFacet('journal').field('journal').size(10))
        .facet(ejs.TermsFacet('dependent').field('dependent').size(10))
        .facet(ejs.TermsFacet('independents').field('independents').size(10))
        .facet(ejs.TermsFacet('key_independent').field('key_independent').size(10))
        .facet(ejs.TermsFacet('year').field('year').size(10))
        .facet(ejs.TermsFacet('authors').field('authors').size(10))
        .facet(ejs.TermsFacet('model').field('model').size(10));

    var filterQuery = function (query) {
        var filter = null,
            filters = Object.keys(activeFilters).map(function(k) { return activeFilters[k]; });
        if (filters.length > 1) {
            filter = ejs.AndFilter(filters);
        } else if (filters.length === 1) {
            filter = filters[0];
        }
        return filter ? ejs.FilteredQuery(query, filter) : query;
    };

    $scope.isActive = function (field, term) {
        return activeFilters.hasOwnProperty(field + term);
    };

    $scope.search = function () {
        var query = ejs.QueryStringQuery('*');
        if (activeFilters) {
            query = filterQuery(query);
        }
        $scope.results = request
            .query(query)
            .doSearch();
    };

    $scope.filter = function(field, term) {
        if ($scope.isActive(field, term)) {
            delete activeFilters[field + term];
        } else {
            activeFilters[field + term] = ejs.TermFilter(field, term);
        }
        $scope.search();
    };
    $scope.search();

});