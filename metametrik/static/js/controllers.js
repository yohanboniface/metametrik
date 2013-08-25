/*jshint globalstrict:true */
/*global angular:true */
/*global _:true */
'use strict';

angular.module('metametrik.controllers', [])
    .controller('BrowseCtrl', function($scope, $location, $routeParams, ejsResource) {

    var ejs = ejsResource('/search'),
        index = 'papers',
        type = 'paper',
        FACETS = [ // order will be used for rendering
            'dependent_variable',
            'independent_variable',
            'model',
            'journal',
            'controls',
            'year',
            'authors',
            'jel_code',
            'keywords'
        ];

    var getRequest = function () {
        var request = ejs.Request()
            .indices(index)
            .types(type)
            .size(5);
        FACETS.forEach(function (term) {
            var facet = ejs.TermsFacet(term).field(term).size(5);
            if ($scope.facetSearch !== '') {
                facet.regex('.*' + $scope.facetSearch + '.*').regexFlags('CASE_INSENSITIVE');
            }
            request.facet(facet);
        });
        return request;
    };

    $scope.fieldDisplayName = function (field) {
        var names = {
            'jel_code': 'JEL code'
        };
        return names[field] || field.replace('_', ' ', 'g');
    };
    $scope.formatValue = function (value) {
        if (value instanceof Array) {
            value = value.join(', ');
        }
        return value;
    };

    var orderObject = function (obj, order) {
        var iterator = function (i) { return order.indexOf(i[0]) !== -1 ? order.indexOf(i[0]) : 99;};
        var factory = function (i) { return {key: i[0], value: i[1]};};
        return _.map(_.sortBy(_.pairs(obj), iterator), factory);
    };
    $scope.selectedItem = null;
    $scope.select = function (item) {
        var fieldsOrder = [
            'authors',
            'journal',
            'title',
            'year',
            'dependent_variable',
            'dependent_variable_description',
            'independent_variable',
            'independent_variable_description',
            'coefficient',
            'standard_error',
            'model',
            'controls',
            'fixed_effects',
            'number_of_observations',
            'r_squared',
            'jel_code',
            'keywords'
        ];
        $scope.selectedItem = item;
        $scope.orderedselectedItem = orderObject(item, fieldsOrder);
    };
    $scope.hasSelected = function () {
        return $scope.selectedItem !== null;
    };
    $scope.isSelected = function (item) {
        return $scope.selectedItem == item;
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
        return $scope.activeFilters.hasOwnProperty(field + ':' + term);
    };
    $scope.browsing = function () {
        return Object.keys($scope.activeFilters).length > 0;
    };
    $scope.search = function (size) {
        $scope.selectedItem = null;
        var populate = function (res) {
            $scope.results = res.hits.hits;
            $scope.total = res.hits.total;
            $scope.facets = orderObject(res.facets, FACETS);
        };
        var request = getRequest();
        if (typeof size !== "undefined") {request.size(size);}
        request.query(getQuery()).doSearch(populate);
    };
    $scope.filter = function(field, term) {
        if ($scope.isActive(field, term)) {
            delete $scope.activeFilters[field + ':' + term];
        } else {
            $scope.facetSearch = '';
            addFilter(field, term);
        }
        var path = _.keys($scope.activeFilters).join(',');
        $location.path('/browse/' + path).replace();
    };
    $scope.more = function () {
        var from = $scope.results.length,
            request = getRequest(),
            append = function (res) {$scope.results = $scope.results.concat(res.hits.hits);};
        request.from(from);
        request.query(getQuery()).doSearch(append);
    };
    $scope.hasMore = function () {
        return $scope.total > $scope.results.length;
    };
    var addFilter = function (field, term) {
        $scope.activeFilters[field + ':' + term] = ejs.TermFilter(field, term);
    };
    var initFilters = function () {
        var path = $routeParams.filters,
            filter;
        if (path) {
            path = path.split(',');
            for (var i = 0; i < path.length; i++) {
                filter = path[i].split(':');
                if (filter.length == 2) {
                    addFilter(filter[0], filter[1]);
                }
            }
        }
    };
    initFilters();
    $scope.search();

});