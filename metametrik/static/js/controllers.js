/*jshint globalstrict:true */
/*global angular:true */
'use strict';

angular.module('metametrik.controllers', [])
    .controller('BrowseCtrl', function($scope, $location, ejsResource) {

    var ejs = ejsResource('http://localhost:9200'),
        index = 'papers',
        type = 'paper';

    var getRequest = function () {
        var request = ejs.Request()
            .indices(index)
            .types(type),
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
            var facet = ejs.TermsFacet(term).field(term).size(10);
            if ($scope.facetSearch !== '') {
                facet.regex('.*' + $scope.facetSearch + '.*').regexFlags('CASE_INSENSITIVE');
            }
            request.facet(facet);
        });
        return request;
    };

    $scope.facetSearch = '';
    $scope.activeFilters = {};
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

    $scope.selectedItem = null;
    $scope.select = function (item) {
        $scope.selectedItem = item;
    };
    $scope.hasSelected = function () {
        return $scope.selectedItem !== null;
    };

    $scope.isActive = function (field, term) {
        return $scope.activeFilters.hasOwnProperty(field + term);
    };

    $scope.search = function () {
        $scope.selectedItem = null;
        var query = ejs.QueryStringQuery('*');
        if ($scope.activeFilters) {
            query = filterQuery(query);
        }
        $scope.results = getRequest()
            .query(query)
            .doSearch();
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
    $scope.search();

});