CREATE DATABASE IF NOT EXISTS `final_project_ssr_db`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `final_project_ssr_db`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `password` VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);


CREATE TABLE IF NOT EXISTS `tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `category_id` INT NOT NULL,
  `description` VARCHAR(200) NOT NULL,
  `due_date` DATE NOT NULL,
  `is_done` TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (`user_id`)     REFERENCES `users`(`id`),
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`)
);
