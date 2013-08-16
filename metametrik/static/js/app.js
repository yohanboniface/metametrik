/*jshint globalstrict:true */
/*global angular:true */
'use strict';

angular.module('metametrik', [
    'metametrik.controllers',
     'elasticjs.service'
 ]).
    config(['$routeProvider', function($routeProvider) {
        $routeProvider
            .when('/browse/', {templateUrl: 'browse.html', controller: 'BrowseCtrl'})
            .otherwise({redirectTo: '/browse/'});
    }]);