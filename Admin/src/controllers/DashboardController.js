app.controller("DashboardController", function ($rootScope, $scope, DataServices, APIService, $document) {
    $rootScope.title = "Admin Dashboard";

    $scope.selectedMonth = '';
    $scope.chartData = {};
    $scope.chartOptions = {};
    $scope.orders = [];

    // =============================
    // 🔥 Lấy tổng số sản phẩm
    // =============================
    DataServices.getAllProduct().then(function (products) {
        $scope.products = products || [];
        $scope.totalProducts = $scope.products.length;
    }).catch(function (err) {
        console.error("Lỗi lấy sản phẩm:", err);
        $scope.totalProducts = 0;
    });

    // =============================
    // ⭐ Đánh giá trung bình
    // =============================
    $scope.avgRating = 0;

    DataServices.getAverageRating().then(function (avg) {
        $scope.avgRating = avg || 0;
    });

    // =============================
    // Cập nhật chart
    // =============================
    $scope.updateChartData = function () {
        if (!$scope.orders || !$scope.orders.length) return;

        var filteredOrders = $scope.filterOrdersByMonth();
        var revenueByMonth = calculateRevenueByMonth(filteredOrders);
        updateChartData(revenueByMonth);
    };

    // =============================
    // Tính doanh thu theo tháng (ĐÃ FIX NULL)
    // Chỉ tính doanh thu từ đơn hàng đã giao hàng
    // =============================
    function calculateRevenueByMonth(orders) {
        var revenueByMonth = {};

        (orders || []).forEach(function (order) {
            if (!order) return;

            if (order.status === 'Đã Giao Hàng') {
                var month = new Date(order.createdAt).getMonth() + 1;

                if (!revenueByMonth[month]) {
                    revenueByMonth[month] = 0;
                }

                var orderTotal = 0;

                // 🔥 FIX NULL ITEMS
                (order.items || []).forEach(function (item) {
                    const price = item?.product?.price || 0;
                    const qty = item?.quantity || 0;
                    orderTotal += price * qty;
                });

                orderTotal -= order?.discount || 0;
                revenueByMonth[month] += orderTotal;
            }
        });

        return revenueByMonth;
    }

    // =============================
    // Lọc đơn hàng theo tháng được chọn
    // =============================
    $scope.filterOrdersByMonth = function () {
        if (!$scope.orders) return [];

        if ($scope.selectedMonth === '') {
            return $scope.orders;
        } else {
            return $scope.orders.filter(function (order) {
                if (!order?.createdAt) return false;
                var orderMonth = new Date(order.createdAt).getMonth() + 1;
                return orderMonth.toString() === $scope.selectedMonth;
            });
        }
    };

    // =============================
    // Hàm cập nhật dữ liệu cho biểu đồ
    // =============================
    function updateChartData(revenueByMonth) {
        $scope.chartData = {
            labels: Object.keys(revenueByMonth).map(function (month) {
                return 'Tháng ' + month;
            }),
            datasets: [{
                label: "Doanh Thu",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
                data: Object.values(revenueByMonth)
            }]
        };

        createChart();
    }

    // =============================
    // Tạo biểu đồ
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

        $scope.waitingOrders = $scope.orders.filter(function (order) {
            return order?.status === 'Chờ Xác Nhận';
        });

        // =============================
        // Tổng doanh thu fix null
        // =============================
        $scope.totalRevenue1 = 0;

        ($scope.orders || []).forEach(function (order) {
            if (order?.status === 'Đã Giao Hàng') {
                var orderTotal = 0;

                (order.items || []).forEach(function (item) {
                    const price = item?.product?.price || 0;
                    const qty = item?.quantity || 0;
                    orderTotal += price * qty;
                });

                orderTotal -= order?.discount || 0;
                $scope.totalRevenue1 += orderTotal;
            }
        });

        // render chart lần đầu
        $scope.updateChartData();
    }).catch(function (err) {
        console.error("Lỗi load orders:", err);
    });

    // =============================
    // Lấy danh sách tháng
    // =============================
    function getDistinctMonths(orders) {
        var distinctMonths = [];

        (orders || []).forEach(function (order) {
            if (!order?.createdAt) return;

            var month = new Date(order.createdAt).getMonth() + 1;
            var mStr = month.toString();

            if (distinctMonths.indexOf(mStr) === -1) {
                distinctMonths.push(mStr);
            }
        });

        return distinctMonths;
    }

    // =============================
    // Đổi trạng thái đơn
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