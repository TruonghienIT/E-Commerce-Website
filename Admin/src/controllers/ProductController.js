app.controller("ProductController", function ($rootScope, $timeout, $scope, $location, DataServices, APIService) {
    $rootScope.title = "Quản Lý Sản Phẩm";

    const token = localStorage.getItem('token');
    const headers = {
        'Authorization': 'Bearer ' + token,
    };

    $scope.products = [];
    $scope.categories = [];
    $scope.currentPage = 1;
    $scope.itemsPerPage = 6;
    $scope.pages = [];

    $scope.searchProduct = "";
    $scope.sortOrder = "";

    $scope.orders = [];
    $scope.soldMap = {};

    DataServices.getAllCategory().then(function (response) {
        $scope.categories = response;
    });

    DataServices.getAllProduct().then(function (response) {
        $scope.products = response;

        $scope.products.sort(function (a, b) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        $scope.products.forEach(function (product) {
            product.isFlashSale = product.isFlashSale ? true : false;
        });

        updateDisplayedProduct();
    });

    DataServices.getAllOrder().then(function (orders) {

        $scope.orders = orders || [];

        let soldMap = {};

        ($scope.orders || []).forEach(function (order) {

            if (order.status !== "Đã Giao Hàng") return;

            (order.items || []).forEach(function (item) {

                let productId = item.product?._id || item.product;

                if (!soldMap[productId]) {
                    soldMap[productId] = 0;
                }

                soldMap[productId] += item.quantity;
            });

        });

        $scope.soldMap = soldMap;

        // 👉 gán vào product nếu đã load rồi
        attachSoldToProducts();
    });

    $scope.$watch("searchProduct", function () {
        $scope.currentPage = 1;
        updateDisplayedProduct();
    });
    $scope.$watch("sortOrder", function () {
        $scope.currentPage = 1;
        updateDisplayedProduct();
    });

    function updateDisplayedProduct() {

        var filteredProducts = $scope.products;

        // 🔍 SEARCH
        if ($scope.searchProduct && $scope.searchProduct.trim() !== "") {
            var keyword = $scope.searchProduct.toLowerCase();

            filteredProducts = $scope.products.filter(function (product) {
                return (
                    (product.title && product.title.toLowerCase().includes(keyword)) ||
                    (product.category?.title && product.category.title.toLowerCase().includes(keyword))
                );
            });
        }

        // 🔥 SORT THEO LƯỢT BÁN
        if ($scope.sortOrder === "asc") {
            filteredProducts.sort(function (a, b) {
                return (a.sold || 0) - (b.sold || 0);
            });
        } else if ($scope.sortOrder === "desc") {
            filteredProducts.sort(function (a, b) {
                return (b.sold || 0) - (a.sold || 0);
            });
        }
        else {
            filteredProducts.sort(function (a, b) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
        }

        // 📄 PAGINATION (PHẢI dùng filteredProducts)
        var startIndex = ($scope.currentPage - 1) * $scope.itemsPerPage;
        var endIndex = startIndex + $scope.itemsPerPage;

        // hiển thị danh sách đã filter + sort
        $scope.displayedProducts = filteredProducts.slice(startIndex, endIndex);

        // 🔢 PAGE COUNT (cũng phải dùng filteredProducts)
        $scope.pages = [];
        var totalPages = Math.ceil(filteredProducts.length / $scope.itemsPerPage);

        for (var i = 1; i <= totalPages; i++) {
            $scope.pages.push(i);
        }
    }

    function attachSoldToProducts() {

        if (!$scope.products || !$scope.products.length) return;

        $scope.products.forEach(function (product) {
            product.sold = $scope.soldMap[product._id] || 0;
        });

        updateDisplayedProduct();
    }

    $scope.setCurrentPage = function (page) {
        $scope.currentPage = page;
        updateDisplayedProduct();
    }

    //thay đổi flash sale
    $scope.changeFlashSale = function (product) {
        var data = {
            isFlashSale: product.isFlashSale,
            pid: product._id
        };
        APIService.callAPI('product/' + product._id, 'PUT', data, headers)
            .then(function (response) {

                swal('Thành Công', 'Cập Nhật Thành Công', 'success');
            })
            .catch(function (error) {
                console.log(error);
                swal('Error', error.data.mes, 'error');
            });
    }

    $scope.variants = [
        {
            color: '',
            size: '',
            quantity: ''
        }
    ]

    // Thêm biến thể
    $scope.addVariant = function () {
        var newVariant = {
            color: '',
            size: '',
            quantity: ''
        };
        $scope.variants.push(newVariant);
    };

    // Thêm mới sản phẩm
    $scope.addProduct = function () {
        swal({
            title: 'Đang thêm sản phẩm',
            text: 'Vui lòng đợi trong giây lát',
            icon: 'info',
            buttons: false
        });

        var images = [];
        var files = document.getElementById('images').files;

        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (!file.type.match('image.*')) {
                continue;
            }
            images.push(file);
        }

        var product = {
            title: $scope.name,
            price: $scope.price,
            sale: $scope.sale || 0,
            description: $scope.description || 'Không có mô tả cho sản phẩm này',
            category: $scope.category,
            variants: $scope.variants,
            isFlashSale: $scope.isFlashSale
        };

        APIService.callAPI('product', 'POST', product, headers)
            .then(function (response) {
                var pid = response.data.createdProduct._id;

                var formData = new FormData();
                for (var i = 0; i < images.length; i++) {
                    formData.append('images', images[i]);
                }

                fetch('http://127.0.0.1:8080/api/product/upload/' + pid, {
                    method: 'PUT',
                    headers: {
                        'Authorization': 'Bearer ' + token
                    },
                    body: formData
                })
                    .then(function (response) {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(function (data) {
                        swal('Thành Công', 'Thêm Sản Phẩm Thành Công', 'success');
                        $scope.products.push(data.product);
                        updateDisplayedProduct();

                        $timeout(function () {
                            $location.path('/product');
                        }, 1000);
                    })
                    .catch(function (error) {
                        console.error('Error:', error);
                        swal('Error', error.message || 'Có lỗi xảy ra khi tải ảnh', 'error');
                    });
            })
            .catch(function (error) {
                console.error('Error:', error);
                swal('Error', error.response.data.mes || 'Có lỗi xảy ra khi thêm sản phẩm', 'error');
            });

    };

    //xoá sản phẩm
    $scope.deleteProduct = function (product) {
        swal({
            title: 'Bạn có chắc chắn muốn xóa sản phẩm này?',
            text: 'Sau khi xóa, bạn sẽ không thể khôi phục lại sản phẩm này!',
            icon: 'warning',
            buttons: true,
            dangerMode: true
        })
            .then((willDelete) => {
                if (willDelete) {
                    APIService.callAPI('product/' + product._id, 'DELETE', null, headers)
                        .then(function (response) {
                            var index = $scope.products.indexOf(product);
                            $scope.products.splice(index, 1);
                            updateDisplayedProduct();
                            swal('Thành Công', 'Xóa Sản Phẩm Thành Công', 'success');
                        })
                        .catch(function (error) {
                            console.log(error);
                            swal('Error', error.data.mes, 'error');
                        });
                }
            });
    }

    // ================= EDIT PRODUCT =================

    // object chứa sản phẩm đang sửa
    $scope.editingProduct = {
        variants: []
    };

    // 👉 chuyển sang trang edit
    $scope.editProduct = function (product) {
        $location.path('/product/edit').search({ id: product._id });
    };

    // 👉 load sản phẩm khi vào trang edit
    $scope.loadProductDetail = function () {
        const id = $location.search().id;

        console.log("ID nhận được:", id); // ⭐ THÊM DÒNG NÀY

        if (!id) {
            console.warn("Không có ID");
            return;
        }

        APIService.callAPI('product/' + id, 'GET', null, headers)
            .then(function (res) {
                console.log("DATA:", res.data); // ⭐ debug

                $scope.editingProduct = res.data.productData;

                if (!$scope.editingProduct.variants) {
                    $scope.editingProduct.variants = [];
                }

                // fix category
                if ($scope.editingProduct.category?._id) {
                    $scope.editingProduct.category =
                        $scope.editingProduct.category._id;
                }

                // fix boolean
                $scope.editingProduct.isFlashSale =
                    !!$scope.editingProduct.isFlashSale;
            });
    };

    // 👉 thêm variant khi edit
    $scope.addVariantEdit = function () {
        $scope.editingProduct.variants.push({
            color: '',
            size: '',
            quantity: ''
        });
    };

    // 👉 UPDATE PRODUCT (KHÔNG upload ảnh)
    $scope.updateProduct = function () {
        swal({
            title: 'Đang cập nhật sản phẩm',
            text: 'Vui lòng đợi...',
            icon: 'info',
            buttons: false
        });

        const id = $scope.editingProduct._id;

        const productUpdate = {
            title: $scope.editingProduct.title,
            price: $scope.editingProduct.price,
            sale: $scope.editingProduct.sale || 0,
            description: $scope.editingProduct.description,
            category: $scope.editingProduct.category,
            variants: $scope.editingProduct.variants,
            isFlashSale: $scope.editingProduct.isFlashSale
        };

        APIService.callAPI('product/' + id, 'PUT', productUpdate, headers)
            .then(function () {
                swal('Thành Công', 'Cập nhật thành công', 'success');

                $timeout(function () {
                    $location.path('/product');
                }, 800);
            })
            .catch(function (err) {
                console.error(err);
                swal('Error', err?.data?.mes || 'Cập nhật thất bại', 'error');
            });
    };
})