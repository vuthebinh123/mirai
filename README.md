<h1 align="center">
	<a href="#"><img src="https://i.imgur.com/jdqeKHq.jpg" alt="Mirai"></a>
	Mirai Bot
</h1>
<p align="center">
	<img alt="size" src="https://img.shields.io/github/repo-size/roxtigger2003/mirai.svg?style=flat-square&label=size">
	<img alt="code-version" src="https://img.shields.io/badge/dynamic/json?color=red&label=code%20version&prefix=v&query=%24.version&url=https%3A%2F%2Fraw.githubusercontent.com%2Froxtigger2003%2Fmirai%2Fmaster%2Fpackage.json&style=flat-square">
	<a href="https://github.com/roxtigger2003/mirai/commits"><img alt="commits" src="https://img.shields.io/github/commit-activity/m/roxtigger2003/mirai.svg?label=commit&style=flat-square"></a>
	<a href="https://app.codacy.com/manual/roxtigger2003/mirai?utm_source=github.com&utm_medium=referral&utm_content=roxtigger2003/mirai&utm_campaign=Badge_Grade_Dashboard"><img alt="Codacy Badge" src="https://api.codacy.com/project/badge/Grade/4025e6e2060c425b9731ec1eeb09489f"></a>
</p>

<p align="center">
	<a href="#Overview">Tổng Quát Về Bot</a>
	-
	<a href="#Installation">Hướng Dẫn Cài Đặt</a>
	-
	<a href="#Author">Tác Giả</a>
</p>

# Overview

Project Mirai sẽ biến tài khoản Facebook cá nhân của bạn thành một con bot thông minh, nhanh nhẹn!

## Các thay đổi
	- Thêm tính năng update (dùng 'node update' trong Terminal).
	- Thêm 2 lệnh NSFW mới cho user (mynsfw, buynsfw)!
		+ mynsfw - Xem hạng NSFW của bạn.
		+ buynsfw - Nâng cấp hạng NSFW của bạn.
		>> Bạn không nhìn nhầm đâu! Giờ NSFW sẽ mất phí! <<
	- Thêm 2 lệnh NSFW mới cho admin (nsfw, setnsfw)!
		+ nsfw - Bật/Tắt NSFW trong nhóm.
		+ setnsfw - Đặt hạng NSFW cho user.
	- Thêm các lệnh tạo mật mã (Morse, Caesar, Vigenere, ROT47)!
	- Thêm lệnh tạo shortcut cho bot (Xem trong help short)!
	- Thêm 4 quả mới vào sl (🍌, 🥝, 🥑, 🌽)!
	- Sửa tính năng tìm lệnh đúng.
	- Sửa lỗi "setmoney me".
	- Sửa lỗi "help" khi nhập lệnh không tồn tại.
	- Đổi balance (cân bằng phương trình) thành chemeb.
	- Đổi onResend/offResend thành unblockResend/blockResend.
	- Tách anime (sfw/nsfw) ra thành anime (sfw) và hentai (nsfw).
	- Làm mới lại 1 số album trong porn.
	- Xóa count (2 bot cho 2 kết quả khác nhau).

# Installation 

## Yêu cầu để có thể sử dụng bot:
  - [NodeJS](https://nodejs.org/en/) và git(không bắt buộc)
  - Trình độ sử dụng NodeJS ở mức trung bình
  - Một tài khoản Facebook dùng để làm bot
 
## Hướng dẫn cài đặt (Linux/macOS/WSL/Windows đã cài windows-build-tools):  
+ Step 1: Clone hoặc download project, nếu máy bạn có git hãy sử dụng lệnh:
```bash
git clone https://github.com/roxtigger2003/mirai
```
+ Step 2: Trỏ và bắt đầu cài đặt các gói module cần thiết cho bot cũng như file env:
```bash
cd mirai && npm install && mv -f .env.example .env
```
sau khi xong các dòng lệnh trên bạn hãy mở file env và edit nó
+ Step 3: Login vào tài khoản Facebook của bạn qua email và password trong file .env (nếu bạn có bật xác thực 2 bước, hãy nhanh tay gõ mã xác thực trong vòng 5s):
```bash
node login.js
```
+ Step 4: Dùng bot thôi chứ còn chờ gì nữa záo xư?

## Video hướng dẫn deploy và sử dụng trên Glitch:
[![Tutorial](https://img.youtube.com/vi/wbfAxyV4n_o/0.jpg)](https://www.youtube.com/watch?v=wbfAxyV4n_o)

## Deployment
Click this button:
[![Remix on Glitch](https://cdn.glitch.com/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button.svg)](https://glitch.com/edit/#!/import/github/roxtigger2003/mirai)
[![Run on Repl.it](https://repl.it/badge/github/roxtigger2003/mirai)](https://repl.it/github/roxtigger2003/mirai)

# Author
- **CatalizCS** (*Author and coder*) - [GitHub](https://github.com/roxtigger2003) - [Facebook](https://fb.me/Cataliz2k)
- **SpermLord** (*Co-Author and coder*) - [GitHub](https://github.com/spermlord) - [Facebook](https://fb.me/MyNameIsSpermLord)

**Và cùng nhiều anh em tester đã đồng hành cùng project! Cảm ơn!**

## License

This project is licensed under the GNU General Public License v3.0 License - see the [LICENSE](LICENSE) file for details
