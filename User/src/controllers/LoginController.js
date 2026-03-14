app.controller("LoginController", function ($scope, $rootScope, $window, APIService, $timeout) {

    $window.scrollTo(0, 0);

    $rootScope.title = 'TechLife | Đăng nhập';

    if ($window.localStorage.getItem('token')) {
        $window.location.replace('index.html');
    }

    /* ======================
       LOGIN EMAIL
    ====================== */
    $scope.login = function () {

        var userData = {
            email: $scope.email,
            password: $scope.password
        };

        swal({
            title: 'Đang đăng nhập',
            text: 'Vui lòng chờ trong giây lát',
            icon: 'info',
            buttons: false
        });

        APIService.callAPI('user/login', 'POST', userData)
            .then(function (response) {

                if (response.data.userData.isBlocked) {
                    swal(
                        'Tài khoản của bạn đã bị khóa',
                        'Vui lòng liên hệ quản trị viên',
                        'error'
                    );
                    return;
                }

                saveLogin(response);

                swal('Đăng nhập thành công', '', 'success');

                $timeout(function () {
                    $window.location.replace('index.html');
                }, 2000);

            })
            .catch(function (error) {
                console.error('Lỗi khi đăng nhập:', error);
                swal('Đăng nhập thất bại', error.data?.mes || 'Lỗi', 'error');
            });
    };


    /* ======================
       GOOGLE LOGIN
    ====================== */

    window.handleGoogleCredential = function (response) {
        $scope.$apply(function () {
            loginGoogle(response.credential);
        });
    };

    function initGoogleLogin() {

        google.accounts.id.initialize({
            client_id: "710310833995-bbhtnnavrt6nk36kto661jlemp43v70f.apps.googleusercontent.com",
            callback: handleGoogleCredential
        });

        google.accounts.id.renderButton(
            document.getElementById("googleLoginBtn"),
            {
                theme: "outline",
                size: "large",
                width: 450,
                text: "signin_with",
                shape: "rectangular",
                logo_alignment: "center",
                locale: "vn"
            }
        );
    }

    $timeout(initGoogleLogin, 500);

    function loginGoogle(token) {

        swal({
            title: 'Đang đăng nhập Google...',
            icon: 'info',
            buttons: false
        });

        APIService.callAPI('user/login-google', 'POST', { token })
            .then(function (response) {

                if (response.data.userData.isBlocked) {
                    swal(
                        'Tài khoản Google của bạn đã bị khóa',
                        'Vui lòng liên hệ quản trị viên',
                        'error'
                    );
                    return;
                }

                saveLogin(response);

                swal('Đăng nhập Google thành công', '', 'success');

                $timeout(function () {
                    $window.location.replace('index.html');
                }, 1500);

            })
            .catch(function (error) {
                swal('Google Login thất bại', error.data?.mes || 'Lỗi', 'error');
            });
    }


    /* ======================
       SAVE LOGIN
    ====================== */

    function saveLogin(res) {

        $window.localStorage.setItem('token', res.data.accessToken);
        $window.localStorage.setItem('name', res.data.userData.name);
        $window.localStorage.setItem('_id', res.data.userData._id);

        var user = JSON.stringify(res.data.userData);
        $window.localStorage.setItem('user', user);

        $scope.isLogin = true;
    }


    /* ======================
       SHOW PASSWORD
    ====================== */

    $scope.showPassword = false;

    $scope.togglePasswordVisibility = function () {
        $scope.showPassword = !$scope.showPassword;
    };

});