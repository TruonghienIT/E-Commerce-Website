app.controller("LoginController", function ($scope, $rootScope, $window, APIService, $timeout) {

    $rootScope.title = 'TechLife | Đăng nhập';

    if ($window.localStorage.getItem('token')) {
        $window.location.replace('index.html');
    }

    /* ======================
       LOGIN EMAIL
    ====================== */
    $scope.login = function () {
        APIService.callAPI('user/login', 'POST', {
            email: $scope.email,
            password: $scope.password
        })
        .then(res => {
            saveLogin(res);
            swal('Đăng nhập thành công', '', 'success');
            $timeout(() => location.replace('index.html'), 1500);
        })
        .catch(err => {
            swal('Đăng nhập thất bại', err.data?.mes || 'Lỗi', 'error');
        });
    };

    /* ======================
       GOOGLE LOGIN (CHUẨN)
    ====================== */

    // Google callback
    window.handleGoogleCredential = function (response) {
        $scope.$apply(() => {
            loginGoogle(response.credential);
        });
    };

    // INIT GOOGLE BUTTON
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
                width: 400,
                text: "signin_with",
                shape: "rectangular",
                logo_alignment: "center",
                locale: "vn"
            }
        );
    }

    // đảm bảo DOM load xong
    $timeout(initGoogleLogin, 500);

    function loginGoogle(token) {
        swal({
            title: 'Đang đăng nhập Google...',
            icon: 'info',
            buttons: false
        });

        APIService.callAPI('user/login-google', 'POST', { token })
            .then(res => {
                saveLogin(res);
                swal('Đăng nhập Google thành công', '', 'success');
                $timeout(() => location.replace('index.html'), 1500);
            })
            .catch(err => {
                swal('Google Login thất bại', err.data?.mes || 'Lỗi', 'error');
            });
    }

    function saveLogin(res) {
        localStorage.setItem('token', res.data.accessToken);
        localStorage.setItem('user', JSON.stringify(res.data.userData));
        localStorage.setItem('_id', res.data.userData._id);
        localStorage.setItem('name', res.data.userData.name);
    }
});
