app.controller('RegisterController', function ($scope, $window, $location, $timeout, $http, APIService) {
    $window.scrollTo(0, 0);

    if ($window.localStorage.getItem('token')) {
        $window.location.replace('index.html');
    }

    // ================= LOAD DATA LOCATION =================
    $scope.locations = [];
    $scope.selectedProvince = null;
    $scope.selectedDistrict = null;
    $scope.selectedWard = null;

    $http.get('./src/assets/js/data-location.json')
        .then(function (response) {
            $scope.locations = response.data;
        })
        .catch(function (error) {
            console.error(error);
        });

    // Reset khi đổi tỉnh / quận
    $scope.$watch('selectedProvince', function () {
        $scope.selectedDistrict = null;
        $scope.selectedWard = null;
    });

    $scope.$watch('selectedDistrict', function () {
        $scope.selectedWard = null;
    });

    // ================= REGISTER =================
    $scope.register = function () {

        // kiểm tra mật khẩu khớp
        if ($scope.password !== $scope.confirmPassword) {
            swal('Lỗi', 'Mật khẩu và nhập lại mật khẩu không khớp', 'error');
            return;
        }

        // ghép địa chỉ giống ProfileController
        var address = '';

        if ($scope.addressDetail) {
            address = $scope.addressDetail + ', ';
        }
        if ($scope.selectedWard) {
            address += $scope.selectedWard.Name + ', ';
        }
        if ($scope.selectedDistrict) {
            address += $scope.selectedDistrict.Name + ', ';
        }
        if ($scope.selectedProvince) {
            address += $scope.selectedProvince.Name;
        }

        var userData = {
            name: $scope.name,
            email: $scope.email,
            phone: $scope.phone,
            address: address,
            password: $scope.password
        };

        swal({
            title: 'Đang đăng ký tài khoản',
            text: 'Vui lòng chờ trong giây lát',
            icon: 'info',
            buttons: false
        });

        APIService.callAPI('user/register', 'POST', userData)
            .then(function (response) {
                swal('Đăng ký thành công', '', 'success');

                $timeout(function () {
                    $location.path('/login');
                }, 1000);
            })
            .catch(function (error) {
                console.error('Lỗi khi đăng ký:', error);
                swal('Đăng ký thất bại', error.data.mes, 'error');
            });
    };

    // ================= HIỆN / ẨN PASSWORD =================
    $scope.showPassword = false;

    $scope.togglePasswordVisibility = function () {
        $scope.showPassword = !$scope.showPassword;
    };
});
