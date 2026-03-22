app.controller("OrderController", function ($scope, $rootScope, $routeParams, DataServices, APIService) {

    $rootScope.title = "Quản lý đơn hàng";

    const token = localStorage.getItem("token");

    const headers = {
        Authorization: "Bearer " + token
    };

    $scope.searchOrder = "";
    $scope.displayedOrders = [];

    $scope.$watch("searchOrder", function () {
        updateDisplayedOrders();
    });

    // =============================
    // Format tiền VNĐ
    // =============================
    function formatMoney(number) {
        return number.toLocaleString('vi-VN') + ' đ';
    }

    // =============================
    // Tính giá sau khuyến mại
    // =============================
    function getFinalPrice(product) {
        let price = product.price;
        let sale = product.sale || 0;
        return price - (price * sale / 100);
    }

    function updateDisplayedOrders() {

        var filtered = $scope.orders;

        if ($scope.searchOrder && $scope.searchOrder.trim() !== "") {

            var keyword = $scope.searchOrder.toLowerCase();

            filtered = $scope.orders.filter(function (order) {
                return (
                    (order._id && order._id.toLowerCase().includes(keyword)) ||
                    (order.name && order.name.toLowerCase().includes(keyword)) ||
                    (order.status && order.status.toLowerCase().includes(keyword)) ||
                    (order.paymentMethod && order.paymentMethod.toLowerCase().includes(keyword))
                );
            });
        }

        $scope.displayedOrders = filtered;
    }

    // =============================
    // Load dữ liệu đơn hàng
    // =============================
    DataServices.getAllOrder().then(function (response) {

        $scope.orders = response;

        $scope.orders.sort(function (a, b) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        updateDisplayedOrders();

        if ($routeParams.id) {

            $scope.order = $scope.orders.find(function (order) {
                return order._id === $routeParams.id;
            });

            // tìm variant
            $scope.order.items.forEach(function (item) {

                item.variant = item.product.variants.find(function (variant) {
                    return variant._id === item.variantId;
                });

            });

            // =============================
            // Tính tiền
            // =============================

            let tempTotal = $scope.order.items.reduce(function (total, item) {

                let finalPrice = getFinalPrice(item.product);

                return total + finalPrice * item.quantity;

            }, 0);

            // tạm tính
            $scope.subtotal = tempTotal;

            // giảm giá
            $scope.discount = $scope.order.discount || 0;

            // tổng tiền
            $scope.total = tempTotal - $scope.discount;

        }

    }).catch(function (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
    });

    // =============================
    // Cập nhật trạng thái
    // =============================
    $scope.updateStatus = function (order) {

        var status = {
            status: order.status
        };

        APIService.callAPI('bill/status/' + order._id, 'PUT', status, headers)
            .then(function (res) {
                order.status = res.data.data.status;
                order.paymentStatus = res.data.data.paymentStatus;
                swal('Thành công', 'Cập nhật trạng thái đơn hàng thành công', 'success');

            })
            .catch(function (error) {

                console.error("Lỗi khi cập nhật trạng thái:", error);

            });
    };

    // =============================
    // Xuất Excel
    // =============================
    $scope.exportToExcel = function (order) {

        var wb = XLSX.utils.book_new();

        var ws_data = [
            ['Thông tin đơn hàng'],
            ['ID đơn hàng:', order._id],
            ['Tên khách hàng:', order.name],
            ['Email:', order.email],
            ['Địa chỉ:', order.shippingAddress],
            [],
            ['Chi tiết sản phẩm'],
            ['Tên sản phẩm', 'Giá', 'Số lượng', 'Thành tiền', 'Màu sắc', 'Kích cỡ']
        ];

        let totalAmount = 0;

        order.items.forEach(function (item) {

            var product = item.product;

            var variant = product.variants.find(function (variant) {
                return variant._id === item.variantId;
            });

            if (!variant) return;

            let finalPrice = getFinalPrice(product);
            let totalPrice = finalPrice * item.quantity;

            totalAmount += totalPrice;

            ws_data.push([
                product.title,
                formatMoney(finalPrice),
                item.quantity,
                formatMoney(totalPrice),
                variant.color || '',
                variant.size || ''
            ]);

        });

        ws_data.push([]);
        ws_data.push(['Tạm tính', formatMoney(totalAmount)]);
        ws_data.push(['Giảm giá', formatMoney(order.discount || 0)]);
        ws_data.push(['Tổng tiền', formatMoney(totalAmount - (order.discount || 0))]);

        var ws = XLSX.utils.aoa_to_sheet(ws_data);

        var sheetName = "ĐH_" + order._id.substring(0, 8);

        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        XLSX.writeFile(wb, sheetName + ".xlsx");
    };

    // =============================
    // Convert ảnh sang base64
    // =============================
    function convertImgToDataURLviaFileReader(url, callback) {

        var xhr = new XMLHttpRequest();

        xhr.onload = function () {

            var reader = new FileReader();

            reader.onloadend = function () {
                callback(reader.result);
            };

            reader.readAsDataURL(xhr.response);

        };

        xhr.open('GET', url);
        xhr.responseType = 'blob';
        xhr.send();
    }

    // =============================
    // Xuất PDF
    // =============================
    $scope.exportToPDF = function (order) {

        var totalAmount = 0;

        convertImgToDataURLviaFileReader('./src/assets/img/logo.png', function (base64Img) {

            var docDefinition = {

                content: [

                    { image: base64Img, width: 200, alignment: 'center', margin: [0, 0, 0, 20] },

                    { text: 'HÓA ĐƠN BÁN HÀNG', style: 'header' },

                    { text: 'ID đơn hàng: ' + order._id, style: 'orderInfo' },

                    { text: 'Tên khách hàng: ' + order.name, style: 'orderInfo' },

                    { text: 'Email: ' + order.email, style: 'orderInfo' },

                    { text: 'Địa chỉ: ' + order.shippingAddress, style: 'orderInfo' },

                    { text: 'Chi tiết sản phẩm', style: 'subheader' }

                ],

                styles: {

                    header: { fontSize: 24, bold: true, alignment: 'center', margin: [0, 0, 0, 20] },

                    subheader: { fontSize: 18, bold: true, margin: [0, 10, 0, 10] },

                    orderInfo: { fontSize: 14, margin: [0, 5, 0, 5] },

                    productInfo: { fontSize: 12, margin: [0, 5, 0, 5] },

                    totalAmount: { fontSize: 16, bold: true, margin: [0, 20, 0, 10] }

                }

            };

            order.items.forEach(function (item) {

                var product = item.product;

                var variant = product.variants.find(function (variant) {
                    return variant._id === item.variantId;
                });

                if (!variant) return;

                let finalPrice = getFinalPrice(product);
                let totalPrice = finalPrice * item.quantity;

                totalAmount += totalPrice;

                docDefinition.content.push(

                    { text: 'Tên sản phẩm: ' + product.title, style: 'productInfo' },

                    { text: 'Giá: ' + formatMoney(finalPrice), style: 'productInfo' },

                    { text: 'Số lượng: ' + item.quantity, style: 'productInfo' },

                    { text: 'Thành tiền: ' + formatMoney(totalPrice), style: 'productInfo' },

                    { text: 'Màu sắc: ' + (variant.color || ''), style: 'productInfo' },

                    { text: 'Kích cỡ: ' + (variant.size || ''), style: 'productInfo' },

                    { text: '\n' }

                );

            });

            docDefinition.content.push(

                { text: 'Tạm tính: ' + formatMoney(totalAmount), style: 'productInfo' },
                { text: 'Giảm giá: ' + formatMoney(order.discount || 0), style: 'productInfo' },
                { text: 'Tổng tiền: ' + formatMoney(totalAmount - (order.discount || 0)), style: 'totalAmount' }

            );

            pdfMake.createPdf(docDefinition).download('HD_' + order._id.substring(0, 8) + '.pdf');

        });

    };

});