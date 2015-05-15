angular.module('app', [
    'ngRoute'
])
    .config(function (
        $routeProvider,
        $locationProvider
    ) {
        'use strict';

        $routeProvider
            .when('/', {
                controller: 'MainCtrl',
                templateUrl: 'templates/main.html'
            })
            .when('/choose', {
                controller: 'LunchCtrl',
                templateUrl: 'templates/lunch.html'
            });
        $locationProvider.html5Mode(true);
    })
    .value('client_id', 'OTZlYWJhYjMyMjhkYzYyOGRjNTlkZTY5MTYyMDlmOGI0')
    .service('Results', function (
        client_id,
        $http,
        $q
    ) {
        'use strict';
        return {
            street: "",
            zipcode: "",
            data: [],
            get: function () {
                var self, promise, deferred;
                self = this;
                deferred = $q.defer();
                if (this.street === "" || this.zipcode === "") {
                    return false;
                }
                promise = this.fetch(
                    {
                        street: this.street,
                        zipcode: this.zipcode
                    }
                );
                promise.then(function (response) {
                    if (angular.isDefined(response.data.addresses)) {
                        self.fallback(response.data.addresses[0]).then(function (response) {
                            self.data = response.data;
                            deferred.resolve();
                        });
                    } else {
                        self.data = response.data;
                        deferred.resolve();
                    }
                });

                return deferred.promise;
            },
            fetch: function (address) {
                var params = {
                    client_id: client_id
                };
                if (angular.isDefined(address.latitude) && angular.isDefined(address.longitude)) {
                    params.latitude = address.latitude;
                    params.longitude = address.longitude;
                } else {
                    params.address = address.street + ", " + address.zipcode;
                }
                return $http({
                    url: 'https://sandbox.delivery.com/merchant/search/delivery',
                    method: 'GET',
                    params: params
                });
            },
            fallback: function (address) {
                return this.fetch(
                    {
                        latitude: address.latitude,
                        longitude: address.longitude
                    }
                );
            }
        };
    })
    .controller('MainCtrl', function (
        $scope,
        $location
    ) {
        'use strict';
        $scope.go = function () {
            $location.path('/choose');
        };
    })
    .controller('LunchCtrl', function (
        $scope,
        $location,
        Results
    ) {
        'use strict';
        $scope.street = "";
        $scope.zipcode = "";
        $scope.results = {
            cuisines: [],
            loading: false,
            selected: 0
        };
        $scope.submit = function () {
            $scope.results.cuisines = [];
            $scope.results.loading = true;
            Results.street = $scope.street;
            Results.zipcode = $scope.zipcode;
            var promise = Results.get();
            promise.then(function () {
                $scope.results.cuisines = Results.data.cuisines;
                $scope.results.loading = false;
            });
        };

        $scope.select = function (item) {
            if (angular.isDefined(item.select)) {
                item.select = !item.select;
            } else {
                item.select = true;
            }

            if (item.select === true) {
                $scope.results.selected++;
            } else {
                $scope.results.selected--;
            }
        };

        $scope.eat = function () {

        };
    });