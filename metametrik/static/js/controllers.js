/*jshint globalstrict:true */
/*global angular:true */
'use strict';

angular.module('metametrik.controllers', [])
    .controller('BrowseCtrl', function($scope, $location, ejsResource) {

    var ejs = ejsResource('/search'),
        index = 'papers',
        type = 'paper';

    var getRequest = function () {
        var request = ejs.Request()
            .indices(index)
            .types(type)
            .size(2),
            facets = [
                'journal',
                'dependent',
                'independents',
                'key_independent',
                'year',
                'authors',
                'model'
            ];
        facets.forEach(function (term) {
            var facet = ejs.TermsFacet(term).field(term).size(5);
            if ($scope.facetSearch !== '') {
                facet.regex('.*' + $scope.facetSearch + '.*').regexFlags('CASE_INSENSITIVE');
            }
            request.facet(facet);
        });
        return request;
    };

    $scope.selectedItem = null;
    $scope.select = function (item) {
        $scope.selectedItem = item;
    };
    $scope.hasSelected = function () {
        return $scope.selectedItem !== null;
    };

    $scope.facetSearch = '';
    $scope.activeFilters = {};
    $scope.results = [];
    $scope.total = 0;
    $scope.filters = [];
    var filterQuery = function (query) {
        var filter = null,
            filters = Object.keys($scope.activeFilters).map(function(k) { return $scope.activeFilters[k]; });
        if (filters.length > 1) {
            filter = ejs.AndFilter(filters);
        } else if (filters.length === 1) {
            filter = filters[0];
        }
        return filter ? ejs.FilteredQuery(query, filter) : query;
    };
    var getQuery = function () {
        var query = ejs.QueryStringQuery('*');
        if ($scope.activeFilters) {
            query = filterQuery(query);
        }
        return query;
    };
    $scope.isActive = function (field, term) {
        return $scope.activeFilters.hasOwnProperty(field + term);
    };
    $scope.browsing = function () {
        return Object.keys($scope.activeFilters).length > 0;
    };
    $scope.search = function () {
        $scope.selectedItem = null;
        var populate = function (res) {
            $scope.results = res.hits.hits;
            $scope.total = res.hits.total;
            $scope.facets = res.facets;
        };
        getRequest().query(getQuery()).doSearch(populate);
    };
    $scope.filter = function(field, term) {
        if ($scope.isActive(field, term)) {
            delete $scope.activeFilters[field + term];
        } else {
            $scope.facetSearch = '';
            $scope.activeFilters[field + term] = ejs.TermFilter(field, term);
        }
        $scope.search();
    };
    $scope.more = function () {
        var from = $scope.results.length,
            request = getRequest(),
            append = function (res) {$scope.results = Array.concat($scope.results, res.hits.hits);};
        request.from(from);
        request.query(getQuery()).doSearch(append);
    };
    $scope.hasMore = function () {
        return $scope.total > $scope.results.length;
    };
    $scope.search();

});