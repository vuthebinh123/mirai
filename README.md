<h1 align="center">
	<a href="#"><img src="https://i.imgur.com/jdqeKHq.jpg" alt="Mirai"></a>
	Mirai Bot
</h1>
<p align="center">
	<img alt="size" src="https://img.shields.io/github/repo-size/roxtigger2003/mirai.svg?style=flat-square&label=size">
	<img alt="code-version" src="https://img.shields.io/badge/dynamic/json?color=red&label=code%20version&prefix=v&query=%24.version&url=https%3A%2F%2Fraw.githubusercontent.com%2Froxtigger2003%2Fmirai%2Fmaster%2Fpackage.json&style=flat-square">
	<a href="https://github.com/roxtigger2003/mirai/commits"><img alt="commits" src="https://img.shields.io/github/commit-activity/m/roxtigger2003/mirai.svg?label=commit&style=flat-square"></a>
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

<details>
	<summary>Đây là các log thay đổi qua từng phiên bản</summary>

- 4.2.5: Sửa shortcut không thông báo sau lần đầu tạo file.

- 4.2.6: Tối ưu lại code.

- 4.2.7: Sửa sethelp và delhelp.

- 4.2.8: Sửa lỗi update.js không sao lưu .env

- 4.2.9: Sửa event.js

- 4.2.10: Xóa messageID.tostring()

- 4.2.11: Bật lệnh hentaivn và sửa lệnh rank

- 4.3.0: Loại bỏ một số lệnh không cần thiết, echo -> repeat, saucenao -> sauce, thêm cài đặt thời gian cho việc nhắc đi ngủ và thức dậy, nâng cấp và sửa chữa saucenao, loại bỏ acronym

- 4.3.1: Fix ping

- 4.3.2: Đổi lại SLEEPTIME và WAKETIME

- 4.3.3: repeat -> echo, optimize

- 4.3.4: thêm config canCheckUpdate, sửa lỗi undefined trong unsend.js, optimize

- 4.3.5: sửa lỗi axios not defined

- 4.3.6: sửa cronjob (reversed về lại 4.3.3).

</details>

# Installation

## Yêu cầu:
  - [NodeJS](https://nodejs.org/en/) và git(không bắt buộc)
  - Trình độ sử dụng NodeJS ở mức trung bình
  - Một tài khoản Facebook dùng để làm bot
 
## Cài đặt (Linux/macOS/WSL/Windows đã cài windows-build-tools):
+ Step 1: Clone hoặc download project, nếu máy bạn có git hãy sử dụng lệnh:
```bash
git clone https://github.com/roxtigger2003/mirai
```
+ Step 2: Trỏ và bắt đầu cài đặt các gói module cần thiết cho bot cũng như file env:
```bash
cd mirai && mv -f .env.example .env && npm install
```
sau khi xong các dòng lệnh trên bạn hãy mở file env và edit nó
+ Step 3: Login vào tài khoản Facebook của bạn qua email và password trong file .env:
```bash
node login.js
```
+ Step 4: Nhập lệnh này nếu bạn không dùng bot trên Glitch:
```bash
npm start
```

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

This project is licensed under the GNU General Public License v3.0 License - see the [LICENSE](LICENSE) file 
<details>
	<summary></summary>

  ```
  địt con mẹ mày, đéo sài thì cút bố đéo cần mày sân si, con đĩ nứng lồn 👌
  ```
</details>