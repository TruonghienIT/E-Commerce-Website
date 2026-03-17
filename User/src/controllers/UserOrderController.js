app.controller("UserOrderController", function ($scope, APIService, $window) {

    $window.scrollTo(0, 0);

    $scope.token = localStorage.getItem('token');

    $scope.orders = [];
    $scope.totalOrders = 0;
    $scope.totalSpent = 0;

    $scope.showDetail = false;
    $scope.toggleDetail = function () {
        $scope.showDetail = !$scope.showDetail;
    };

    $scope.countStatus = {
        choXacNhan: 0,
        daXacNhan: 0,
        dangVanChuyen: 0,
        daGiaoHang: 0,
        daHuy: 0
    };

    var headers = {
        'Authorization': 'Bearer ' + $scope.token
    };

    APIService.callAPI('bill/billUser/getall', 'GET', null, headers)
        .then(function (response) {

            // ✅ Sắp xếp đơn mới nhất trước
            $scope.orders = (response.data.data || []).sort(function (a, b) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            // ✅ Reset lại dữ liệu
            $scope.totalSpent = 0;
            $scope.totalOrders = 0;

            $scope.countStatus = {
                choXacNhan: 0,
                daXacNhan: 0,
                dangVanChuyen: 0,
                daGiaoHang: 0,
                daHuy: 0
            };

            // ✅ Hàm tính giá sau sale
            function getFinalPrice(product) {
                let price = product.price;
                let sale = product.sale || 0;
                return price - (price * sale / 100);
            }

            // ✅ CHỈ 1 vòng lặp duy nhất (tối ưu)
            $scope.orders.forEach(function (order) {

                // 🔹 Gắn variant + tính giá từng item
                let tempPrice = 0;

                order.items.forEach(function (item) {

                    var variant = item.product.variants.find(function (v) {
                        return v._id === item.variantId;
                    });

                    if (variant) {
                        item.variant = variant;
                    }

                    let finalPrice = getFinalPrice(item.product);
                    item.finalPrice = finalPrice;

                    tempPrice += finalPrice * item.quantity;
                });

                // 🔹 Tổng tiền đơn
                order.totalPrice = tempPrice - (order.discount || 0);

                // =====================
                // 🔥 CHUẨN HÓA STATUS
                // =====================
                let status = (order.status || "").trim().toLowerCase();

                switch (status) {
                    case "chờ xác nhận":
                        $scope.countStatus.choXacNhan++;
                        break;
                    case "đã xác nhận":
                        $scope.countStatus.daXacNhan++;
                        break;
                    case "đang vận chuyển":
                        $scope.countStatus.dangVanChuyen++;
                        break;
                    case "đã giao hàng":
                        $scope.countStatus.daGiaoHang++;
                        break;
                    case "đã hủy":
                        $scope.countStatus.daHuy++;
                        break;
                }

                // =========================
                // 💰 TÍNH TỔNG TIỀN
                // =========================

                // ✅ COD
                if (order.paymentMethod === "Thanh Toán Khi Nhận Hàng") {
                    if (order.status === "Đã Giao Hàng") {
                        $scope.totalSpent += order.totalPrice;
                    }
                }

                // ✅ VNPAY
                if (order.paymentMethod === "VNPAY") {

                    if (order.paymentStatus === "paid") {

                        // ❗ nếu hủy thì trừ lại
                        if (order.status === "Đã Hủy") {
                            $scope.totalSpent -= order.totalPrice;
                        } else {
                            $scope.totalSpent += order.totalPrice;
                        }
                    }
                }

                // =====================
                // ✅ TỔNG ĐƠN CHUẨN
                // =====================
                $scope.totalOrders =
                    $scope.countStatus.choXacNhan +
                    $scope.countStatus.daXacNhan +
                    $scope.countStatus.dangVanChuyen +
                    $scope.countStatus.daGiaoHang +
                    $scope.countStatus.daHuy;

                // debug (nếu cần)
                console.log("Status:", $scope.countStatus);
                console.log("Total Orders:", $scope.totalOrders);
            });
        })
        .catch(function (error) {
            console.error('Lỗi khi gọi API:', error);
        });

    // ✅ Modal chi tiết
    $scope.showOrderDetail = function (order) {
        $scope.selectedOrder = order;
    };

});