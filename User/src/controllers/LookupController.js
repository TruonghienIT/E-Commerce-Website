app.controller("LookupController", function ($scope, $rootScope, DataServices) {
    $rootScope.title = 'TechLife | Tra cứu đơn hàng';

    $scope.lockup = function () {
        if ($scope.idBill) {
            DataServices.getBill($scope.idBill)
                .then(function (bill) {

                    // Nếu không tìm thấy đơn
                    if (!bill) {
                        swal("Không tìm thấy!", "Mã đơn hàng không đúng hoặc không tồn tại.", "error");
                        $scope.bill = null;
                        return;
                    }

                    // Nếu tìm thấy
                    $scope.bill = bill;
                })
                .catch(function (error) {
                    console.error('Lỗi khi tra cứu đơn hàng:', error);
                    swal("Lỗi!", "Không thể tra cứu đơn hàng. Vui lòng thử lại.", "error");
                });
        } else {
            swal("Thiếu thông tin!", "Vui lòng nhập mã đơn hàng.", "warning");
        }
    }
});