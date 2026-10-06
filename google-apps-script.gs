/**
 * MÃ MÁY CHỦ MIỄN PHÍ (Google Apps Script) — lưu chữ ký và lời tri ân vào Google Sheet.
 *
 * CÁCH CÀI (khoảng 5 phút):
 *  1. Tạo một Google Sheet mới (sheets.google.com), đặt tên tùy ý, ví dụ "Thu moi - Du lieu".
 *  2. Trong Sheet: menu Tiện ích mở rộng (Extensions) > Apps Script.
 *  3. Xóa mã mẫu, dán toàn bộ nội dung file này vào, bấm Lưu.
 *  4. Bấm Triển khai (Deploy) > Tùy chọn triển khai mới (New deployment) > loại "Ứng dụng web" (Web app):
 *       - Thực thi dưới tên (Execute as): Tôi (Me)
 *       - Người có quyền truy cập (Who has access): Bất kỳ ai (Anyone)
 *     Bấm Triển khai, cấp quyền khi được hỏi, rồi SAO CHÉP "URL ứng dụng web" (dạng https://script.google.com/macros/s/.../exec).
 *  5. Dán URL đó vào index.html:  CONFIG.signEndpoint  (chữ ký)  và  CONFIG.formEndpoint  (lời tri ân).
 *     Có thể dùng cùng một URL cho cả hai.
 *
 * Mỗi lần SỬA mã này, phải Triển khai > Quản lý triển khai > Chỉnh sửa > Phiên bản mới thì mới có hiệu lực.
 *
 * Dữ liệu:
 *  - Trang "ChuKy": id, thời gian, họ tên, ảnh chữ ký (PNG base64)
 *  - Trang "TriAn": thời gian + các trường của form lời tri ân (name, org, message, consent)
 */

var SHEET_SIGN = 'ChuKy';
var SHEET_WISH = 'TriAn';
var MAX_IMG = 45000;     // giới hạn ô Google Sheet là 50.000 ký tự
var ADMIN_KEY = '1331998';   // ĐỔI thành mật khẩu riêng của bạn trước khi triển khai (dùng để xóa tất cả chữ ký)
var MAX_LIST = 400;      // số chữ ký tối đa trả về khi tải trang

function sheet_(name, header) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(header); sh.setFrozenRows(1); }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Nhận dữ liệu gửi lên (POST) */
function doPost(e) {
  var p = (e && e.parameter) || {};
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (p.action === 'sign') {
      var img = String(p.img || '');
      if (img.indexOf('data:image/png;base64,') !== 0 || img.length > MAX_IMG) return json_({ ok: false, error: 'img' });
      var sh = sheet_(SHEET_SIGN, ['id', 'time', 'name', 'img']);
      var id = String(p.id || '').slice(0, 40);
      if (!id) return json_({ ok: false, error: 'id' });
      var last = sh.getLastRow();
      if (last > 1) {
        var ids = sh.getRange(2, 1, last - 1, 1).getValues();
        for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === id) return json_({ ok: true, dup: true });
      }
      sh.appendRow([id, new Date(), String(p.name || '').slice(0, 60), img]);
      return json_({ ok: true });
    }
    // Mặc định: form lời tri ân (name, org, message, consent)
    var w = sheet_(SHEET_WISH, ['time', 'name', 'org', 'message', 'consent']);
    w.appendRow([new Date(), String(p.name || '').slice(0, 100), String(p.org || '').slice(0, 150),
                 String(p.message || '').slice(0, 1500), String(p.consent || '')]);
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

/** Trả danh sách chữ ký (GET ?action=list) */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === 'clear') {   // xóa tất cả chữ ký: mở trang web với đuôi ?admin rồi bấm "Xóa tất cả chữ ký"
    if (!ADMIN_KEY || ADMIN_KEY === 'DOI-MAT-KHAU-NAY' || String(p.key || '') !== ADMIN_KEY) return json_({ ok: false, error: 'key' });
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      var sh0 = sheet_(SHEET_SIGN, ['id', 'time', 'name', 'img']);
      var n = sh0.getLastRow() - 1;
      if (n > 0) sh0.deleteRows(2, n);
      return json_({ ok: true, deleted: Math.max(n, 0) });
    } finally { lock.releaseLock(); }
  }
  if (p.action === 'list') {
    var sh = sheet_(SHEET_SIGN, ['id', 'time', 'name', 'img']);
    var last = sh.getLastRow();
    if (last < 2) return json_([]);
    var from = Math.max(2, last - MAX_LIST + 1);
    var rows = sh.getRange(from, 1, last - from + 1, 4).getValues();
    return json_(rows.map(function (r) {
      return { id: String(r[0]), t: new Date(r[1]).getTime(), name: String(r[2]), img: String(r[3]) };
    }));
  }
  return json_({ ok: true, service: 'thu-moi-so' });
}
