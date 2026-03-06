app.controller("ShopController", function ($scope, $rootScope, $window, DataServices) {
    $rootScope.title = "TechLife | Cửa hàng";
    $window.scrollTo(0, 0);

    $scope.categories = [];
    $scope.loadingCategories = true;

    // mapping icon theo title
    const iconMap = {
        "Laptop": "Image/Mac.png",
        "Điện thoại": "Image/Iphone.png",
        "Máy tính bảng": "Image/IPad.png",
        "Đồng hồ thông minh": "Image/AppleWatch.png",
        "Tai nghe": "Image/AirPods.png",
        "Phụ kiện": "Image/phukien.png"
    };

    // load categories từ server
    function loadCategories() {
        DataServices.getCategories()
            .then(function (data) {
                // gắn icon cho từng category
                $scope.categories = data.map(function (c) {
                    return {
                        ...c,
                        icon: iconMap[c.title] || "Image/phukien.png"
                    };
                });

                $scope.loadingCategories = false;
            })
            .catch(function (err) {
                console.error("Error loading categories:", err);
                $scope.loadingCategories = false;
            });
    }

    loadCategories();
});