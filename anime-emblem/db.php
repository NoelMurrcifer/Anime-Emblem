<?php
// db.php — Chỉ làm nhiệm vụ kết nối MySQL, không ép kiểu JSON
$host = 'localhost';
$dbname = 'anime_emblem';
$user = 'root';
$pass = ''; // Mặc định của XAMPP mật khẩu là rỗng

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    die("Lỗi kết nối MySQL: " . $e->getMessage());
}