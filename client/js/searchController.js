angular.module('app').controller('searchController', ['$scope', '$http', 'Product', function ($scope, $http, Product) {
    var that = $scope;
    that.apiURL = window.location.hostname;//'http://localhost:3000/api';
    that.products = [];
    that.filter = '';
    that.doFilter = false;
    that.init = (host) => {
        if (host) {
            that.apiURL = host;
        }
        that.updateProducts();

    };
    that.onFilter = () => {
        if (!that.filter || that.filter === '') {
            that.doFilter = false;

        } else {
            that.doFilter = true;
        }
        console.log("filter", that.filter);
        that.updateProducts();
    };
    that.updateProducts = () => {
        that.getProducts()
            .then((data) => {
                //console.log(data);
                that.products = data;
            }, (error) => {
                console.log(error);
            });
    };
    that.getProducts = () => {
        var url = that.apiURL + '/product';
        var filter = {};
        if (that.doFilter) {
            filter = {
                filter: {
                    where: {
                        name: { like: `${that.filter}` }
                    }
                }
            };
        }
        console.log('request: ', url);

        return Product.find(filter).$promise;
        //return $http.get(url);
    };
}]);