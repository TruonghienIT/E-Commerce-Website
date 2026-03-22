app.controller("CouponController", function ($rootScope, $location, $timeout, $scope, DataServices, APIService) {
    $rootScope.title = "Quản Lý Mã Giảm Giá";

    const token = localStorage.getItem('token');
    const headers = {
        'Authorization': 'Bearer ' + token,
    };

    $scope.searchCoupon = "";
    $scope.displayedCoupons = [];

    DataServices.getAllCoupon().then(function (response) {
        $scope.listCoupon = response;
        updateDisplayedCoupons();
    });

    $scope.$watch("searchCoupon", function () {
        updateDisplayedCoupons();
    });

    function updateDisplayedCoupons() {

        var filtered = $scope.listCoupon;

        if ($scope.searchCoupon && $scope.searchCoupon.trim() !== "") {

            var keyword = $scope.searchCoupon.toLowerCase();

            filtered = $scope.listCoupon.filter(function (c) {
                return (
                    (c.name && c.name.toLowerCase().includes(keyword)) ||
                    (c.discount && c.discount.toString().includes(keyword))
                );
            });
        }

        $scope.displayedCoupons = filtered;
    }

    $scope.addCoupon = function () {
        swal({
            title: "Đang tạo mã giảm giá",
            text: "Vui lòng chờ",
            icon: "info",
            button: false,

        })
        const data = {
            name: $scope.name,
            discount: $scope.discount,
            expiry: $scope.expiry
        }
        APIService.callAPI('coupon', 'POST', data, headers).then(function (response) {
            console.log(response);
            swal('Thành công', 'Tạo mã giảm giá thành công', 'success');

            //chuyển hướng về trang danh sách mã giảm giá
            $timeout(function () {
                $location.path('/coupon');
            }, 1000);


            DataServices.getAllCoupon().then(function (response) {
                $scope.listCoupon = response;
                updateDisplayedCoupons();
            });
        });
    }

    $scope.deleteCoupon = function (id) {
        swal({
            title: "Bạn có chắc chắn muốn xóa mã giảm giá này?",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        })
            .then((willDelete) => {
                if (willDelete) {
                    APIService.callAPI('coupon/' + id, 'DELETE', null, headers).then(function (response) {
                        swal('Thành công', 'Xóa mã giảm giá thành công', 'success');
                        DataServices.getAllCoupon().then(function (response) {
                            $scope.listCoupon = response;
                            updateDisplayedCoupons();
                        });
                    });
                }
            });
    }

    // ================= EDIT COUPON =================

    // object chứa coupon đang sửa
    $scope.editingCoupon = {};

    // 👉 chuyển sang trang edit
    $scope.editCoupon = function (coupon) {
        $location.path('/coupon/edit').search({ id: coupon._id });
    };

    // 👉 load coupon khi vào trang edit
    $scope.loadCouponDetail = function () {
        const id = $location.search().id;

        console.log("Coupon ID:", id);

        if (!id) {
            console.warn("Không có ID coupon");
            return;
        }

        APIService.callAPI('coupon/' + id, 'GET', null, headers)
            .then(function (res) {
                console.log("Coupon data:", res.data);

                // ✅ FIX ĐÚNG theo backend của bạn
                $scope.editingCoupon = res.data.coupon;

                // convert date cho input date
                if ($scope.editingCoupon.createdAt) {
                    $scope.editingCoupon.startDate =
                        new Date($scope.editingCoupon.createdAt);
                }

                if ($scope.editingCoupon.expiry) {
                    $scope.editingCoupon.expiry =
                        new Date($scope.editingCoupon.expiry);
                }
            });
    };

    // 👉 UPDATE COUPON
    $scope.updateCoupon = function () {
        swal({
            title: 'Đang cập nhật mã',
            text: 'Vui lòng đợi...',
            icon: 'info',
            buttons: false
        });

        const id = $scope.editingCoupon._id;

        const dataUpdate = {
            name: $scope.editingCoupon.name,
            discount: $scope.editingCoupon.discount,
            startDate: $scope.editingCoupon.startDate,
            expiry: $scope.editingCoupon.expiry
        };

        APIService.callAPI('coupon/' + id, 'PUT', dataUpdate, headers)
            .then(function () {
                swal('Thành Công', 'Cập nhật mã thành công', 'success');

                $timeout(function () {
                    $location.path('/coupon');
                }, 800);
            })
            .catch(function (err) {
                console.error(err);
                swal('Error', err?.data?.mes || 'Cập nhật thất bại', 'error');
            });
    };
});