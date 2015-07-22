angular.module('Choice.factories')
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
            check_children: function (input) {
                if (angular.isUndefined(input.children) ||
                        input.children.length === 0) {
                    return true;
                }
                return false;
            },
            find_children: function (input) {
                if (this.check_children(input)) {
                    return input;
                }
                return this.find_children(input.children[0]);
            },
            chose: function (response) {
                var keys, items, payload = {};
                keys = Object.keys(response.data.menu);
                items = response.data.menu[keys[Random(keys.length)]].children;
                payload.parent = items[Random(items.length)];
                if (!this.check_children(payload.parent)) {
                    payload.child = this.find_children(payload.parent);
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
                    self.item.id = merged[index];
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
                        items_only: 1
                    }
                });
            }
        };
    });