app.controller('FeedbackController', function ($rootScope, $scope, $timeout, DataServices, $routeParams) {
    $rootScope.title = "Quản Lý Phản Hồi";

    const token = localStorage.getItem('token');
    const headers = {
        'Authorization': 'Bearer ' + token,
    };

    $scope.products = [];
    $scope.currentPage = 1;
    $scope.itemsPerPage = 5;
    $scope.pages = [];

    DataServices.getAllProduct().then(function (response) {
        $scope.products = response;

        $scope.products.sort(function (a, b) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        $scope.products.forEach(function (product) {
            product.isFlashSale = product.isFlashSale ? true : false;
        });

        updateDisplayedProduct();
    });

    function updateDisplayedProduct() {
        var startIndex = ($scope.currentPage - 1) * $scope.itemsPerPage;
        var endIndex = startIndex + $scope.itemsPerPage;
        $scope.displayedProducts = $scope.products.slice(startIndex, endIndex);

        $scope.pages = [];
        var totalPages = Math.ceil($scope.products.length / $scope.itemsPerPage);
        for (var i = 1; i <= totalPages; i++) {
            $scope.pages.push(i);
        }
    }

    $scope.setCurrentPage = function (page) {
        $scope.currentPage = page;
        updateDisplayedProduct();
    };

    // ⭐⭐⭐ FIX CHÍNH Ở ĐÂY
    $scope.getStars = function (rating) {
        rating = Number(rating) || 0;
        return new Array(rating);
    };

    // ===== DETAIL =====
    if ($routeParams.id) {
        DataServices.getProductById($routeParams.id).then(function (response) {
            $scope.product = response;
            $scope.rating = $scope.product.rating;

            console.log("Rating list:", $scope.rating); // debug

            if (!$scope.rating || $scope.rating.length === 0) {
                swal('Thông báo', 'Sản phẩm chưa có đánh giá nào', 'info');
                $timeout(function () {
                    window.location.href = '#!feedback';
                }, 1000);
            }
        });
    }
});