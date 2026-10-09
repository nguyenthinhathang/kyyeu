/* Tạo 2 trang riêng từ index.html: chuky.html (bức tranh chữ ký) và loitri-an.html (gửi lời tri ân).
   Chạy lại sau mỗi lần sửa index.html:  node build-pages.js   (trang chủ index.html giữ nguyên) */
const fs = require("fs");
const src = fs.readFileSync(__dirname + "/index.html", "utf8");
[["chuky.html", "chuky", "Bức tranh chữ ký tri ân"], ["loitri-an.html", "loitri", "Gửi lời yêu thương"]].forEach(([file, solo, title]) => {
  let d = src.replace(/<html([^>]*)>/, (m, a) => "<html" + a.replace(/\sdata-solo="[^"]*"/, "") + ' data-solo="' + solo + '">');
  d = d.replace(/<title>[\s\S]*?<\/title>/, "<title>" + title + "</title>");
  fs.writeFileSync(__dirname + "/" + file, d);
  console.log("đã tạo", file);
});
