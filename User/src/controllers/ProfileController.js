app.controller("ProfileController", function ($scope, $http, $window, APIService) {
    $scope.token = localStorage.getItem('token');
    $window.scrollTo(0, 0);

    var headers = {
        'Authorization': 'Bearer ' + $scope.token
    };

    $http.get('./src/assets/js/data-location.json')
        .then(function (response) {
            $scope.locations = response.data;

            APIService.callAPI('user/getCurrent', 'GET', null, headers)
                .then(function (response) {
                    $scope.userData = response.data.rs;

                    if ($scope.userData.address) {
                        var address = $scope.userData.address.split(', ');
                        $scope.userData.addressDetail = address[0];
                        //tách thành phố, quận, phường
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
                });
        })
        .catch(function (error) {
            console.error(error);
        });



    $scope.updateUserInfo = function () {
        // kiểm tra tên người dùng
        if (!$scope.userData.name) {
            swal("Thông báo", "Vui lòng nhập tên người dùng", "info");
            return;
        }

        if ($scope.userData.name.length < 2 || $scope.userData.name.length > 50) {
            swal("Lỗi", "Tên người dùng phải từ 2 đến 50 ký tự", "error");
            return;
        }
        
        //Kiểm tra định dạng số
        var phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;

        if (!phoneRegex.test($scope.userData.mobile)) { 
            swal("Lỗi", "Số điện thoại không đúng định dạng", "error"); 
            return; 
        }

        //lấy tỉnh, huyện, xã, địa chỉ, tạo thành chuỗi
        var address = '';

        if ($scope.userData.addressDetail) {
            address = $scope.userData.addressDetail + ', ';
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

        var data = {
            name: $scope.userData.name,
            mobile: $scope.userData.mobile,
            email: $scope.userData.email,
            address: address
        };


        APIService.callAPI('user/current', 'PUT', data, headers)
            .then(function (response) {
                swal("Thành công", "Cập nhật thông tin thành công", "success");
                localStorage.setItem('user', JSON.stringify(response.data.user));
            })
            .catch(function (error) {
                console.error('Lỗi khi gửi yêu cầu API:', error);
                swal("Lỗi", error.data.mes, "error");
            });

    }

});