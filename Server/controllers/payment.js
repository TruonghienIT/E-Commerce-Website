const qs = require("qs");
const moment = require("moment");
const crypto = require("crypto"); // Dùng crypto mặc định của Node.js thay vì crypto-js
const Bill = require('../models/bill');
// 1. Hàm sắp xếp chuẩn của VNPay (Rất quan trọng để không bị lỗi chữ ký)
function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

// 2. Hàm tạo URL thanh toán
const createVNPay = (req, res) => {
    // Lưu ý: Trong thực tế bạn nên để Secret Key và TmnCode vào file .env
    const tmnCode = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    const vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    const returnUrl = "http://localhost:8080/api/payment/vnpay-return";

    const date = new Date();
    const createDate = moment(date).format("YYYYMMDDHHmmss");
    const orderId = req.body.orderId;
    const amount = req.body.amount;

    // Lấy IP chuẩn xác hơn
    const ipAddr = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress ||
        req.ip;

    let vnp_Params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: tmnCode,
        vnp_Locale: "vn",
        vnp_CurrCode: "VND",
        vnp_TxnRef: orderId,
        vnp_OrderInfo: "Thanh toan don hang",
        vnp_OrderType: "other",
        vnp_Amount: amount * 100,
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate
    };

    // Sắp xếp và encode dữ liệu
    vnp_Params = sortObject(vnp_Params);

    // Tạo chuỗi ký
    const signData = qs.stringify(vnp_Params, { encode: false });

    // Ký dữ liệu bằng HMAC SHA512
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    // Gắn chữ ký vào URL
    vnp_Params.vnp_SecureHash = signed;

    const paymentUrl = vnpUrl + "?" + qs.stringify(vnp_Params, { encode: false });

    res.json({ paymentUrl });
};

// 3. Hàm xử lý kết quả trả về từ VNPay
const vnpayReturn = async (req, res) => {
    let vnp_Params = req.query;
    const secretKey = process.env.VNP_HASH_SECRET;

    // Lấy chữ ký do VNPay gửi về
    const secureHash = vnp_Params['vnp_SecureHash'];

    // Xóa các trường chứa chữ ký ra khỏi object trước khi băm lại để kiểm tra
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Sắp xếp lại object y như lúc gửi đi
    vnp_Params = sortObject(vnp_Params);

    // Tạo chuỗi ký từ dữ liệu VNPay trả về
    const signData = qs.stringify(vnp_Params, { encode: false });
    
    // Ký lại dữ liệu
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    // Kiểm tra xem chữ ký mình tạo ra có giống với chữ ký VNPay gửi về không
    if (secureHash === signed) {
        // Nếu đúng chữ ký (Dữ liệu toàn vẹn, không bị hacker sửa đổi)
        const responseCode = vnp_Params['vnp_ResponseCode'];
        const orderId = vnp_Params['vnp_TxnRef'];
        if (responseCode === "00") {
            await Bill.findByIdAndUpdate(orderId, { paymentStatus: 'paid' });
            // Thanh toán thành công
            // (Tại đây bạn có thể viết code update trạng thái đơn hàng trong Database)
            res.redirect("http://localhost:5500/User/index.html#!/?payment=success");
        } else {
            await Bill.findByIdAndUpdate(orderId, { paymentStatus: 'failed' });
            // Giao dịch không thành công (khách hủy, không đủ tiền,...)
            res.redirect("http://localhost:5500/User/index.html#!/?payment=fail");
        }
    } else {
        // SAI CHỮ KÝ: Dữ liệu đã bị giả mạo trên đường truyền
        console.log("Lỗi: Dữ liệu bị giả mạo (Sai chữ ký)");
        res.redirect("http://localhost:5500/#!/payment-fail?err=invalid_signature");
    }
};

module.exports = { createVNPay, vnpayReturn };