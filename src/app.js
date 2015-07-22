angular.module('app', [
    'ngRoute',
    'Merchant',
    'Cuisine',
    'Choice'
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
        'use strict';
        return function (length) {
            return Math.floor(Math.random() * length);
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
        Choice,
        Merchant
    ) {
        'use strict';
        $scope.back = function () { $location.path('choose', false); };
        $scope.item = Choice.item;

        if (Object.keys($scope.item).length === 0) {
            $scope.back();
        }

        $scope.again = function () {
            Choice.get().then(function () {
                $scope.item = Choice.item;
            });
        };
        $scope.buying = false;
        $scope.merchant = {};
        $scope.buy = function () {
            if ($scope.item.id === undefined) {
                console.error('No merchant ID found');
                return false;
            }
            $scope.buying = true;
            Merchant.id = $scope.item.id;
            Merchant.get().then(function (response) {
                $scope.merchant = response.data.merchant;
            });
        };
    });