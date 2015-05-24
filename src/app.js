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
                templateUrl: 'templates/main.html',
            })
            .when('/choose', {
                controller: 'LunchCtrl',
                templateUrl: 'templates/lunch.html',
                reloadOnSearch: false
            })
            .when('/result', {
                controller: 'ResultCtrl',
                templateUrl: 'templates/result.html',
                reloadOnSearch: false
            });
        $locationProvider.html5Mode(true);
    })
    .value('client_id', 'OTZlYWJhYjMyMjhkYzYyOGRjNTlkZTY5MTYyMDlmOGI0')
    .service('Random', function () {
        return function (length) {
            return Math.floor(Math.random() * length);
        }
    })
    .factory('Choice', function (
        client_id,
        Random,
        $http,
        $q
    ) {
        'use strict';
        return {
            possible: [],
            item: {},
            chose: function (response) {
                var keys, items, payload = {};
                keys = Object.keys(response.data.menu);
                items = response.data.menu[keys[Random(keys.length)]].children;
                payload.parent = items[Random(items.length)];
                if (payload.parent.children.length !== 0) {
                   payload.child = payload.parent.children[Random(payload.parent.children.length)];
                }
                return payload;
            },
            get: function () {
                var merged = [], 
                    index, 
                    self = this,
                    deferred = $q.defer();
                merged = merged.concat.apply(merged, self.possible);
                index = Random(merged.length);
                self.fetch(merged[index]).then(function (response) {
                   self.item = self.chose(response);
                   console.log(self.item);
                   deferred.resolve();
                });
                return deferred.promise;
            },
            fetch: function (id) {
                return $http({
                    url: 'https://sandbox.delivery.com/merchant/' + id + '/menu',
                    method: 'GET',
                    params: {
                        client_id: client_id,
                        hide_unavailable: 1,
                        item_only: 1
                    }
                });
            }
        };
    })
    .factory('Cuisines', function (
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
                    deferred.reject();
                    return deferred.promise;
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
                        }, function () {
                            deferred.reject();
                        });
                    } else {
                        self.data = response.data;
                        deferred.resolve();
                    }
                }, function () {
                    deferred.reject();
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
        Cuisines,
        Choice
    ) {
        'use strict';
        $scope.street = "";
        $scope.zipcode = "";
        $scope.results = {
            cuisines: [],
            merchants: {},
            loading: false,
            warning: "",
            selected: 0
        };

        $scope.selected = function () {
            var arr = [];
            if ($scope.results.cuisines.length === 0) {
                return false;
            }
            if (Object.keys($scope.results.merchants).length === 0) {
                return false;
            }
            angular.forEach($scope.results.cuisines, function (item) {
                if (angular.isDefined(item.selected) && item.selected === true) {
                    angular.forEach($scope.results.merchants, function (value, key) {
                        if (item.name === key) {
                            arr.push(value);
                        }
                    });
                }
            });

            return arr;
        };

        $scope.filter = function (merchants) {
            angular.forEach(merchants, function (merchant) {
                angular.forEach(merchant.summary.cuisines, function (item) {
                    if (angular.isDefined($scope.results.merchants[item])) {
                        $scope.results.merchants[item].push(merchant.id);
                    } else {
                        $scope.results.merchants[item] = [merchant.id];
                    }
                });
            });
        };

        $scope.submit = function () {
            $scope.results.selected = 0;
            $scope.results.warning = "";
            $scope.results.cuisines = [];
            $scope.results.loading = true;
            Cuisines.street = $scope.street;
            Cuisines.zipcode = $scope.zipcode;
            var promise = Cuisines.get();
            promise.then(function () {
                $scope.results.cuisines = Cuisines.data.cuisines;
                $scope.filter(Cuisines.data.merchants);
                console.log($scope.results.merchants);
                $scope.results.loading = false;
            }, function () {
                $scope.results.loading = false;
                $scope.results.warning = "No results found";
            });
        };

        $scope.select = function (item) {
            if (angular.isDefined(item.selected)) {
                item.selected = !item.selected;
            } else {
                item.selected = true;
            }

            if (item.selected === true) {
                $scope.results.selected++;
            } else {
                $scope.results.selected--;
            }
        };

        $scope.eat = function (random) {
            if (random) {
                angular.forEach($scope.results.merchants, function (merchant) {
                    Choice.possible.push(merchant);
                });
            } else {
                Choice.possible = $scope.selected();
            }

            Choice.get().then(function () {
                $location.path('result');
            });
        };
    })
    .controller('ResultCtrl', function (
        $scope,
        $location,
        Choice
    ) {
        $scope.back = function () { $location.path('choose', false); }
        $scope.item = Choice.item;

        if (Object.keys($scope.item).length === 0) {
            $scope.back();
        }

        $scope.again = function () {
            Choice.get().then(function () {
                $scope.item = Choice.item;
            });

        }
    });