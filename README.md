<h1 align="center">
	<br>
	<a href="#"><img src="https://i.imgur.com/jdqeKHq.jpg" alt="Mirai"></a>
	<br>
		Mirai Bot
	<br>
</h1>

<h4 align="center"></h4>

<p align="center">
	<img alt="size" src="https://img.shields.io/github/repo-size/roxtigger2003/mirai.svg?style=flat-square&label=size">
	<img alt="code-version" src="https://img.shields.io/badge/dynamic/json?color=red&label=code%20version&prefix=v&query=%24.version&url=https%3A%2F%2Fraw.githubusercontent.com%2Froxtigger2003%2Fmirai%2Fmaster%2Fpackage.json&style=flat-square">
	<a href="https://github.com/roxtigger2003/mirai/commits"><img alt="commits" src="https://img.shields.io/github/commit-activity/m/roxtigger2003/mirai.svg?label=commit&style=flat-square"></a> 
</p>

<h4 align="center"></h4>

<p align="center">
	<a href="#Overview">Tổng Quát Về Bot</a>
	-
	<a href="#Installation">Hướng Dẫn Cài Đặt</a>
	-
	<a href="#Author">Tác Giả</a>
</p>

# Overview

Project sẽ biến tài khoản Facebook cá nhân của bạn thành một con bot thông minh, nhanh nhẹn!

# Installation 

## Yêu cầu để có thể sử dụng bot:

  - [NodeJS](https://nodejs.org/en/) và [git (không bắt buộc)](https://git-scm.com/downloads)
 
  - Trình độ sử dụng NodeJS ở mức trung bình
 
  - Một tài khoản Facebook dùng để làm bot
 
## Sau đây là hướng dẫn cài đặt (Dành cho Windows/Linux/MacOS):  

+ Step 1: Clone hoặc download project, nếu máy bạn có git hãy sử dụng lệnh:
```
git clone https://github.com/roxtigger2003/mirai
```
+ Step 2: Trỏ và bắt đầu cài đặt các gói module cần thiết cho bot cũng như file env:
```
cd mirai && npm install && mv .env.example .env
```
sau khi xong các dòng lệnh trên bạn hãy mở file env và edit nó

+ Step 3: Login vào tài khoản Facebook của bạn qua email và password trong file .env (nếu bạn có bật xác thực 2 bước, hãy nhanh tay gõ mã xác thực trong vòng 5s):
```
node login.js
```

+ Step 4: Dùng bot thôi chứ còn chờ gì nữa záo xư?

## Video hướng dẫn deploy và sử dụng trên Glitch:

(https://www.youtube.com/watch?v=-M0-GLPxA-k)

## Deployment

Click this button:

[![Remix on Glitch](https://cdn.glitch.com/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button.svg)](https://glitch.com/edit/#!/import/github/roxtigger2003/mirai)    [![Deploy on Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/roxtigger2003/mirai/tree/master)

# Author

- **CatalizCS** - *Author and coder* - [GitHub](https://github.com/roxtigger2003) - [Facebook](https://fb.me/Cataliz2k)

- **SpermLord** - *Co-Author and coder* - [GitHub](https://github.com/spermlord) - [Facebook](https://fb.me/MyNameIsSpermLord)

**Và cùng nhiều anh em tester đã đồng hành cùng project suốt gần 4 tháng! Cảm ơn!**

## License

This project is licensed under the GNU General Public License v3.0 License - see the [LICENSE](LICENSE) file for details
