app.controller("DashboardController", function ($rootScope, $scope, DataServices, APIService) {

    $rootScope.title = "Admin Dashboard";

    $scope.selectedMonth = '';
    $scope.chartData = {};
    $scope.orders = [];

    // =============================
    // Tổng số sản phẩm
    // =============================
    DataServices.getAllProduct().then(function (products) {

        $scope.products = products || [];
        $scope.totalProducts = $scope.products.length;

    }).catch(function () {

        $scope.totalProducts = 0;

    });

    // =============================
    // Đánh giá trung bình
    // =============================
    $scope.avgRating = 0;

    DataServices.getAverageRating().then(function (avg) {
        $scope.avgRating = avg || 0;
    });

    // =============================
    // Hàm tính tổng tiền đơn hàng
    // =============================
    function calculateOrderTotal(order) {

        let total = 0;

        (order.items || []).forEach(function (item) {

            const price = item?.product?.price || 0;
            const sale = item?.product?.sale || 0;
            const qty = item?.quantity || 0;

            const finalPrice = price - (price * sale / 100);

            total += finalPrice * qty;

        });

        return Math.round(total - (order?.discount || 0));
    }

    // =============================
    // Tính doanh thu theo tháng
    // =============================
    function calculateRevenueByMonth(orders) {

        var revenueByMonth = {};

        (orders || []).forEach(function (order) {

            if (order?.status === 'Đã Giao Hàng') {

                var month = new Date(order.createdAt).getMonth() + 1;

                if (!revenueByMonth[month]) {
                    revenueByMonth[month] = 0;
                }

                var orderTotal = calculateOrderTotal(order);

                revenueByMonth[month] += orderTotal;
            }

        });

        return revenueByMonth;
    }

    // =============================
    // Lọc đơn theo tháng
    // =============================
    $scope.filterOrdersByMonth = function () {

        if (!$scope.orders) return [];

        if ($scope.selectedMonth === '') {
            return $scope.orders;
        }

        return $scope.orders.filter(function (order) {

            if (!order?.createdAt) return false;

            var orderMonth = new Date(order.createdAt).getMonth() + 1;

            return orderMonth.toString() === $scope.selectedMonth;

        });

    };

    // =============================
    // Cập nhật chart
    // =============================
    $scope.updateChartData = function () {

        if (!$scope.orders.length) return;

        var filteredOrders = $scope.filterOrdersByMonth();

        var revenueByMonth = calculateRevenueByMonth(filteredOrders);

        $scope.chartData = {
            labels: Object.keys(revenueByMonth).map(function (month) {
                return 'Tháng ' + month;
            }),
            datasets: [{
                label: "Doanh Thu",
                backgroundColor: "rgba(75,192,192,0.2)",
                borderColor: "rgba(75,192,192,1)",
                borderWidth: 1,
                data: Object.values(revenueByMonth)
            }]
        };

        createChart();
    };

    // =============================
    // Tạo chart
    // =============================
    function createChart() {

        var canvas = document.getElementById('myChart');

        if (!canvas) return;

        var ctx = canvas.getContext('2d');

        if ($scope.myChart) {
            $scope.myChart.destroy();
        }

        $scope.myChart = new Chart(ctx, {
            type: 'bar',
            data: $scope.chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

    }

    // =============================
    // Lấy danh sách đơn hàng
    // =============================
    DataServices.getAllOrder().then(function (response) {

        $scope.orders = response || [];

        $scope.months = getDistinctMonths($scope.orders);

        // Đơn chờ xác nhận
        $scope.waitingOrders = $scope.orders.filter(function (order) {
            return order?.status === 'Chờ Xác Nhận';
        });

        // =============================
        // Tổng doanh thu
        // =============================
        $scope.totalRevenue1 = 0;

        ($scope.orders || []).forEach(function (order) {

            if (order?.status === 'Đã Giao Hàng' 
                // || order?.status === 'Đã Xác Nhận' 
                // || order?.status === 'Đã Hủy' 
                // || order?.status === 'Chờ Xác Nhận'
            ) {

                $scope.totalRevenue1 += calculateOrderTotal(order);

            }

        });

        $scope.updateChartData();

    }).catch(function (err) {

        console.error("Lỗi load orders:", err);

    });

    // =============================
    // Lấy danh sách tháng
    // =============================
    function getDistinctMonths(orders) {

        var months = [];

        (orders || []).forEach(function (order) {

            if (!order?.createdAt) return;

            var month = (new Date(order.createdAt).getMonth() + 1).toString();

            if (!months.includes(month)) {
                months.push(month);
            }

        });

        return months;

    }

    // =============================
    // Xác nhận đơn hàng
    // =============================
    $scope.changeStatus = function (order) {

        if (!order?._id) return;

        var status = { status: 'Đã Xác Nhận' };

        APIService.callAPI('bill/status/' + order._id, 'PUT', status)
            .then(function () {

                swal('Thành công', 'Cập nhật trạng thái đơn hàng thành công', 'success');

                $scope.waitingOrders = $scope.waitingOrders.filter(function (item) {
                    return item._id !== order._id;
                });

                $scope.months = getDistinctMonths($scope.orders);

                $scope.updateChartData();

            })
            .catch(function (error) {

                console.log('Có lỗi xảy ra:', error);

            });

    };

});