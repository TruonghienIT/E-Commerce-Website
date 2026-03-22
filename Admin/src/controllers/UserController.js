app.controller("UserController", function ($scope, $http, $rootScope, $routeParams, DataServices, APIService) {

    $rootScope.title = "Quản lý người dùng";

    const token = localStorage.getItem("token");

    const headers = {
        Authorization: "Bearer " + token
    };

    $scope.currentPage = 1;
    $scope.itemsPerPage = 5;
    $scope.users = [];
    $scope.displayedUsers = [];
    $scope.pages = [];
    $scope.searchKeyword = "";

    // ================= SEARCH =================
    $scope.$watch("searchKeyword", function () {
        $scope.currentPage = 1;
        updateDisplayedUsers();
    });

    // ================= LOAD DATA =================
    DataServices.getAllUser()
        .then(function (users) {

            // Fix crash undefined
            if (!users || !Array.isArray(users)) {
                console.error("Users không hợp lệ:", users);
                return;
            }

            $scope.users = users;

            // Sort mới nhất lên đầu
            $scope.users.sort(function (a, b) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            updateDisplayedUsers();
        })
        .catch(function (error) {
            console.error("Lỗi khi lấy dữ liệu:", error);
        });

    // ================= FILTER + PAGINATION =================
    function updateDisplayedUsers() {

        var filteredUsers = $scope.users;

        // 🔍 SEARCH
        if ($scope.searchKeyword && $scope.searchKeyword.trim() !== "") {
            var keyword = $scope.searchKeyword.toLowerCase();

            filteredUsers = $scope.users.filter(function (user) {
                return (
                    (user.name && user.name.toLowerCase().includes(keyword)) ||
                    (user.email && user.email.toLowerCase().includes(keyword))
                );
            });
        }

        // 📄 PAGINATION (sau khi filter)
        var startIndex = ($scope.currentPage - 1) * $scope.itemsPerPage;
        var endIndex = startIndex + $scope.itemsPerPage;

        $scope.displayedUsers = filteredUsers.slice(startIndex, endIndex);

        // 🔢 PAGE COUNT
        $scope.pages = [];
        var totalPages = Math.ceil(filteredUsers.length / $scope.itemsPerPage);

        for (var i = 1; i <= totalPages; i++) {
            $scope.pages.push(i);
        }
    }

    // ================= CHANGE PAGE =================
    $scope.setCurrentPage = function (page) {
        $scope.currentPage = page;
        updateDisplayedUsers();
    };

    // ================= CHANGE STATUS =================
    $scope.changeStatus = function (user) {

        var data = {
            isBlocked: user.isBlocked
        };

        APIService.callAPI("user/admin/update/" + user._id, "PUT", data, headers)
            .then(function () {
                swal('Thành công', 'Cập nhật trạng thái thành công', 'success');
            })
            .catch(function (error) {
                console.error("Lỗi:", error);
                swal('Thất bại', 'Cập nhật trạng thái thất bại', 'error');
            });
    };

    // ================= LOAD LOCATION (FIX PATH) =================
    $http.get('./src/assets/js/data-location.json')
        .then(function (response) {
            $scope.locations = response.data;
        })
        .catch(function (error) {
            console.error('Lỗi load location:', error);
        });

    // ================= ADD USER =================
    $scope.addUser = function () {

        $scope.selectedProvince = $scope.selectedProvince || { Name: "" };
        $scope.selectedDistrict = $scope.selectedDistrict || { Name: "" };
        $scope.selectedWard = $scope.selectedWard || { Name: "" };
        $scope.addressDetail = $scope.addressDetail || "";

        var userData = {
            name: $scope.name,
            email: $scope.email,
            password: $scope.password,
            mobile: $scope.mobile || "",
            address: $scope.addressDetail + ', ' +
                $scope.selectedWard.Name + ', ' +
                $scope.selectedDistrict.Name + ', ' +
                $scope.selectedProvince.Name,
            role: $scope.role || "user"
        };

        APIService.callAPI("user/admin/create", "POST", userData, headers)
            .then(function (response) {
                swal('Thành công', 'Thêm người dùng thành công', 'success');

                $scope.users.unshift(response.data); // thêm lên đầu
                updateDisplayedUsers();
            })
            .catch(function (error) {
                console.error("Lỗi:", error);
                swal('Thất bại', error.data?.mes || 'Lỗi', 'error');
            });
    };

    // ================= DELETE =================
    $scope.deleteUser = function (user) {

        swal({
            title: 'Bạn có chắc muốn xóa?',
            text: "Không thể khôi phục!",
            icon: 'warning',
            buttons: ["Hủy", "Xóa"],
            dangerMode: true,
        }).then((ok) => {

            if (!ok) return;

            APIService.callAPI("user/?_id=" + user._id, "DELETE", null, headers)
                .then(function () {

                    swal('Thành công', 'Đã xóa', 'success');

                    var index = $scope.users.indexOf(user);
                    if (index !== -1) {
                        $scope.users.splice(index, 1);
                    }

                    updateDisplayedUsers();
                })
                .catch(function (error) {
                    console.error("Lỗi:", error);
                    swal('Thất bại', error.data?.mes || 'Lỗi', 'error');
                });
        });
    };

    // ================= GET USER DETAIL =================
    if ($routeParams.id) {

        APIService.callAPI("user/admin/get/" + $routeParams.id, "GET", null, headers)
            .then(function (response) {

                $scope.userRes = response.data.user;

                $http.get('./src/assets/js/data-location.json')
                    .then(function (res) {

                        $scope.locations = res.data;

                        if ($scope.userRes.address) {

                            var address = $scope.userRes.address.split(', ');
                            $scope.userRes.addressDetail = address[0];

                            $scope.selectedProvince = $scope.locations.find(p => p.Name === address[address.length - 1]);

                            if ($scope.selectedProvince) {
                                $scope.selectedDistrict = $scope.selectedProvince.Districts.find(d => d.Name === address[address.length - 2]);

                                if ($scope.selectedDistrict) {
                                    $scope.selectedWard = $scope.selectedDistrict.Wards.find(w => w.Name === address[address.length - 3]);
                                }
                            }
                        }
                    });
            });
    }

    // ================= UPDATE USER =================
    $scope.editSubmit = function () {

        var address = '';

        if ($scope.userRes.addressDetail) address += $scope.userRes.addressDetail + ', ';
        if ($scope.selectedWard) address += $scope.selectedWard.Name + ', ';
        if ($scope.selectedDistrict) address += $scope.selectedDistrict.Name + ', ';
        if ($scope.selectedProvince) address += $scope.selectedProvince.Name;

        var userData = {
            name: $scope.userRes.name,
            email: $scope.userRes.email,
            mobile: $scope.userRes.mobile || "",
            address: address,
            role: $scope.userRes.role
        };

        APIService.callAPI("user/admin/update/" + $routeParams.id, "PUT", userData, headers)
            .then(function (response) {
                swal('Thành công', 'Cập nhật thành công', 'success');
                $scope.userRes = response.data.user;
            })
            .catch(function (error) {
                console.error("Lỗi:", error);
                swal('Thất bại', error.data?.mes || 'Lỗi', 'error');
            });
    };

});