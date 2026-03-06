app.controller("ProductController", function ($scope, $window, $rootScope, DataServices, $routeParams) {
    $rootScope.title = 'TechLife | Sản phẩm';
    $window.scrollTo(0, 0);

    $scope.loadingProduct = true;
    $scope.productsPerPage = 12;
    $scope.displayedProducts = [];

    // mặc định sắp xếp theo sản phẩm mới nhất
    $scope.selectedSortType = 'newest';

    // ================= LOAD PRODUCTS =================
    function loadProducts() {
        DataServices.getProducts()
            .then(function (products) {
                $scope.allProducts = products || [];

                console.log("Total products:", $scope.allProducts.length);

                $scope.applyFiltersAndSort();
                $scope.loadingProduct = false;
            })
            .catch(function (error) {
                console.error("Error loading products:", error);
                $scope.loadingProduct = false;
            });
    }

    // ================= FILTER + SORT =================
    $scope.applyFiltersAndSort = function () {

        // 🔥 FILTER THEO CATEGORY (AN TOÀN)
        if ($routeParams.category_id) {
            $scope.products = ($scope.allProducts || []).filter(function (product) {
                return product &&
                       product.category &&
                       product.category._id === $routeParams.category_id;
            });

            // 🔥 TÌM TÊN CATEGORY (AN TOÀN)
            var matchedCategory = ($scope.categories || []).find(function (category) {
                return category._id === $routeParams.category_id;
            });

            $scope.categoryName = matchedCategory
                ? matchedCategory.title
                : 'Tất cả sản phẩm';

        } else {
            $scope.products = $scope.allProducts || [];
            $scope.categoryName = 'Tất cả sản phẩm';
        }

        // 🔥 SORT
        $scope.sortProducts($scope.selectedSortType);

        // 🔥 PAGINATION
        $scope.displayedProducts = $scope.products.slice(0, $scope.productsPerPage);
    };

    // ================= SORT =================
    $scope.sortProducts = function (sortType) {
        if (!$scope.products) return;

        switch (sortType) {

            case 'newest':
                $scope.products.sort(function (a, b) {
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                });
                break;

            case 'nameAsc':
                $scope.products.sort(function (a, b) {
                    return (a.title || '').localeCompare(b.title || '');
                });
                break;

            case 'nameDesc':
                $scope.products.sort(function (a, b) {
                    return (b.title || '').localeCompare(a.title || '');
                });
                break;

            case 'priceDesc':
                $scope.products.sort(function (a, b) {
                    const priceA = a.sale > 0 ? a.price * (1 - a.sale / 100) : a.price || 0;
                    const priceB = b.sale > 0 ? b.price * (1 - b.sale / 100) : b.price || 0;
                    return priceB - priceA;
                });
                break;

            case 'priceAsc':
                $scope.products.sort(function (a, b) {
                    const priceA = a.sale > 0 ? a.price * (1 - a.sale / 100) : a.price || 0;
                    const priceB = b.sale > 0 ? b.price * (1 - b.sale / 100) : b.price || 0;
                    return priceA - priceB;
                });
                break;

            default:
                break;
        }
    };

    // ================= LOAD MORE =================
    $scope.loadMore = function () {
        if (!$scope.products) return;

        var nextPageStart = $scope.displayedProducts.length;
        var nextPageEnd = nextPageStart + $scope.productsPerPage;

        if (nextPageStart < $scope.products.length) {
            $scope.displayedProducts = $scope.displayedProducts.concat(
                $scope.products.slice(nextPageStart, nextPageEnd)
            );
        }
    };

    // ================= INIT =================
    loadProducts();
});