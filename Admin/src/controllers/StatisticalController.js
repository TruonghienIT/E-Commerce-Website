app.controller("StatisticalController", function ($scope, DataServices) {

    $scope.orders = [];
    $scope.products = [];

    $scope.topProducts = [];
    $scope.lowStockProducts = [];

    $scope.displayProducts = [];

    $scope.selectedOption = "topSell";
    $scope.columnTitle = "Đã bán";
    $scope.topRatingProducts = [];

    // ============================
    // Lấy đơn hàng
    // ============================
    DataServices.getAllOrder().then(function (orders) {

        $scope.orders = orders || [];

        calculateTopProducts();
        createOrderStatusChart();

        $scope.displayProducts = $scope.topProducts;

    });


    // ============================
    // Lấy sản phẩm để tính tồn kho
    // ============================
    DataServices.getAllProduct().then(function (products) {

        $scope.products = products || [];

        calculateLowStock();
        calculateTopRatingProducts();

    });


    // ============================
    // Top sản phẩm bán chạy
    // ============================
    function calculateTopProducts() {

        let productMap = {};

        ($scope.orders || []).forEach(function (order) {

            if (order.status !== "Đã Giao Hàng") return;

            (order.items || []).forEach(function (item) {

                let title = item?.product?.title || "Unknown";

                if (!productMap[title]) {

                    productMap[title] = {
                        title: title,
                        value: 0
                    };

                }

                productMap[title].value += item.quantity;

            });

        });

        let products = Object.values(productMap);

        products.sort(function (a, b) {
            return b.value - a.value;
        });

        $scope.topProducts = products.slice(0, 5);

    }


    // ============================
    // Top sản phẩm tồn kho ít
    // ============================
    function calculateLowStock() {

        let list = [];

        ($scope.products || []).forEach(function (p) {

            let totalQuantity = 0;

            (p.variants || []).forEach(function (v) {
                totalQuantity += v.quantity || 0;
            });

            list.push({
                title: p.title,
                value: totalQuantity
            });

        });

        list.sort(function (a, b) {
            return a.value - b.value;
        });

        $scope.lowStockProducts = list.slice(0, 5);

    }

    function calculateTopRatingProducts() {

        let list = [];

        ($scope.products || []).forEach(function (p) {

            let avgRating = p.totalRating || 0;
            let countRating = (p.rating || []).length;

            // if (countRating > 0) {

                list.push({
                    title: p.title,
                    avg: avgRating,
                    count: countRating
                });

            // }

        });

        list.sort(function (a, b) {
            return b.avg - a.avg;
        });

        $scope.topRatingProducts = list.slice(0, 5);

    }

    // ============================
    // Thay đổi dropdown
    // ============================
    $scope.changeOption = function () {

        if ($scope.selectedOption === "topSell") {

            $scope.displayProducts = $scope.topProducts;
            $scope.columnTitle = "Đã bán";

        }
        else if ($scope.selectedOption === "lowStock") {

            $scope.displayProducts = $scope.lowStockProducts;
            $scope.columnTitle = "Tồn kho";

        }
        else if ($scope.selectedOption === "topRating") {

            $scope.displayProducts = $scope.topRatingProducts;
            $scope.columnTitle = "⭐ Rating";

        }

    };


    // ============================
    // Biểu đồ trạng thái đơn
    // ============================
    function createOrderStatusChart() {

        let statusCount = {
            "Chờ Xác Nhận": 0,
            "Đã Xác Nhận": 0,
            "Đang Vận Chuyển": 0,
            "Đã Giao Hàng": 0,
            "Đã Hủy": 0
        };

        ($scope.orders || []).forEach(function (order) {

            if (statusCount[order.status] !== undefined) {

                statusCount[order.status]++;

            }

        });

        var ctx = document.getElementById("orderStatusChart");

        new Chart(ctx, {

            type: "pie",

            data: {
                labels: Object.keys(statusCount),
                datasets: [{
                    data: Object.values(statusCount),
                    backgroundColor: [
                        "#f1c40f",
                        "#3498db",
                        "#9b59b6",
                        "#2ecc71",
                        "#e74c3c"
                    ]
                }]
            },

            options: {
                responsive: true
            }

        });

    }

});