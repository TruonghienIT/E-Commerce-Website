app.controller("CheckoutController", function ($scope, $rootScope, $timeout, $http, DataServices, $window) {

    $rootScope.title = 'TechLife | Thanh Toán Đơn Hàng';
    $window.scrollTo(0, 0);

    // kiểm tra giỏ hàng
    if (!localStorage.getItem('cart') || JSON.parse(localStorage.getItem('cart')).length === 0) {
        swal("Thông báo", "Giỏ hàng trống, vui lòng thêm sản phẩm vào giỏ hàng", "info");

        $timeout(function () {
            $window.location.href = '';
        }, 2000);

        return;
    }

    // load dữ liệu tỉnh thành
    $http.get('./src/assets/js/data-location.json')
        .then(function (response) {
            $scope.locations = response.data;
        })
        .catch(function (error) {
            console.error(error);
        });


    // ===============================
    // HÀM TÍNH GIÁ SAU SALE
    // ===============================
    $scope.getFinalPrice = function (product) {

        let price = product.price;
        let sale = product.sale || 0;

        return price - (price * sale / 100);
    };


    // ===============================
    // INIT
    // ===============================
    $scope.init = function () {

        $scope.discount = 0;

        // kiểm tra đăng nhập
        if (localStorage.getItem('token')) {

            $scope.isLogin = true;

            var userData = JSON.parse(localStorage.getItem('user'));

            if (userData) {

                $scope.userData = userData;

                $http.get('./src/assets/js/data-location.json')
                    .then(function (response) {

                        $scope.locations = response.data;

                        if ($scope.userData.address) {

                            var address = $scope.userData.address.split(', ');

                            $scope.userData.addressDetail = address[0];

                            if (address.length > 1) {

                                $scope.selectedProvince = $scope.locations.find(function (location) {
                                    return location.Name === address[address.length - 1];
                                });

                                if ($scope.selectedProvince) {

                                    $scope.selectedDistrict = $scope.selectedProvince.Districts.find(function (district) {
                                        return district.Name === address[address.length - 2];
                                    });

                                    if ($scope.selectedDistrict) {

                                        $scope.selectedWard = $scope.selectedDistrict.Wards.find(function (ward) {
                                            return ward.Name === address[address.length - 3];
                                        });

                                    }

                                }

                            }

                        }

                    })
                    .catch(function (error) {
                        console.error('Lỗi khi gửi yêu cầu API:', error);
                        $scope.apiError = true;
                    });

            }

        } else {

            $scope.isLogin = false;

        }


        // ===============================
        // LOAD CART
        // ===============================
        $scope.cart = JSON.parse(localStorage.getItem('cart')) || [];

        $scope.cart.forEach(function (item) {

            var variant = item.product.variants.find(function (variant) {
                return variant._id === item.variantId;
            });

            if (variant) {
                item.variant = variant;
            }

            // tính giá sau sale
            item.finalPrice = $scope.getFinalPrice(item.product);

        });


        // ===============================
        // LẤY COUPON
        // ===============================
        $scope.getCoupon();


        // ===============================
        // TÍNH TỔNG TIỀN TẠM
        // ===============================
        $scope.tempPrice = $scope.cart.reduce(function (total, item) {

            return total + item.finalPrice * item.quantity;

        }, 0);


        // tổng tiền cuối
        $scope.totalPrice = $scope.calculateTotalPrice();

    };


    // ===============================
    // LẤY COUPON
    // ===============================
    $scope.getCoupon = function () {

        DataServices.getCoupon()
            .then(function (coupon) {
                $scope.coupon = coupon;
            })
            .catch(function (error) {
                console.error('Lỗi khi lấy dữ liệu coupon:', error);
            });

    };


    // ===============================
    // ÁP DỤNG COUPON
    // ===============================
    $scope.applyCoupon = function () {

        var couponCode = $scope.couponCode;

        // nếu ô nhập rỗng
        if (!couponCode || couponCode.trim() === "") {

            $scope.discount = 0;
            $scope.discountPercent = 0;
            $scope.totalPrice = $scope.calculateTotalPrice();

            swal("Thông báo", "Chưa nhập mã giảm giá", "info");
            return;

        }

        var matchedCoupon = $scope.coupon.find(function (coupon) {
            return coupon.name.toLowerCase() === couponCode.toLowerCase();
        });

        if (!matchedCoupon) {

            swal("Thông báo", "Mã giảm giá không hợp lệ", "error");
            return;

        }

        // kiểm tra hết hạn
        if (new Date(matchedCoupon.expiry) < new Date()) {

            swal("Thông báo", "Mã giảm giá đã hết hạn sử dụng", "info");
            return;

        }

        // lưu phần trăm giảm giá
        $scope.discountPercent = matchedCoupon.discount;

        // tính tiền giảm
        $scope.discount = $scope.tempPrice * ($scope.discountPercent / 100);

        $scope.totalPrice = $scope.calculateTotalPrice();

        swal("Thông báo", "Áp dụng mã giảm giá thành công (" + $scope.discountPercent + "%)", "success");

    };


    // ===============================
    // TÍNH TỔNG TIỀN
    // ===============================
    $scope.calculateTotalPrice = function () {

        var totalPrice = $scope.tempPrice;

        if ($scope.discount) {
            totalPrice -= $scope.discount;
        }

        return totalPrice;

    };


    $scope.init();


    // ===============================
    // HOÀN THÀNH ĐƠN HÀNG
    // ===============================
    $scope.completeOrder = function () {
        if (!$scope.userData.mobile) { 
            swal("Thông báo", "Vui lòng nhập số điện thoại", "info"); 
            return; 
        }

        var phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
        
        if (!phoneRegex.test($scope.userData.mobile)) { 
            swal("Lỗi", "Số điện thoại không đúng định dạng", "error"); 
            return; 
        }

        if (!$scope.userData.addressDetail || !$scope.selectedProvince || !$scope.selectedDistrict || !$scope.selectedWard) {

            swal("Thông báo", "Vui lòng nhập đầy đủ thông tin địa chỉ", "info");
            return;

        }

        var items = $scope.cart.map(function (item) {

            return {
                product: item.product._id,
                variantId: item.variantId,
                quantity: item.quantity
            };

        });


        var order = {

            user: $scope.userData._id || null,
            name: $scope.userData.name,
            mobile: $scope.userData.mobile,
            email: $scope.userData.email,

            items: items,

            shippingAddress: $scope.userData.addressDetail + ', ' +
                $scope.selectedWard.Name + ', ' +
                $scope.selectedDistrict.Name + ', ' +
                $scope.selectedProvince.Name,

            discount: $scope.discount || 0,

            totalPrice: $scope.totalPrice,

            paymentMethod: $scope.paymentMethod,
            shippingMethod: $scope.shippingMethod,
            note: $scope.note,

        };


        // loading
        swal({
            title: "Đang xử lý đơn hàng, vui lòng chờ...",
            icon: "info",
            buttons: false,
            closeOnClickOutside: false,
            closeOnEsc: false,
            content: {
                element: "div",
                attributes: {
                    innerHTML: '<i class="fas fa-spinner fa-spin"></i>',
                    className: "custom-loading",
                },
            },
        });


        $http.post('http://127.0.0.1:8080/api/bill', order)

            .then(function () {

                swal("Thành công", "Đặt hàng thành công", "success");

                localStorage.removeItem('cart');
                localStorage.removeItem('discount');

                $timeout(function () {
                    $window.location.href = '';
                }, 2000);

            })

            .catch(function (error) {

                console.error('Lỗi khi gửi yêu cầu API:', error);

                swal("Lỗi", "Đặt hàng thất bại", "error");

            });

    };

});