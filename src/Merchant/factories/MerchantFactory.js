angular.module('Merchant.factories')
    .factory('Merchant', function (
        client_id,
        $http
    ) {
        'use strict';
        return {
            id: "",
            get: function () {
                var self = this;
                return $http({
                    url: 'https://sandbox.delivery.com/merchant/' + self.id,
                    method: 'GET',
                    params: {
                        client_id: client_id
                    }
                });
            }
        };
    });