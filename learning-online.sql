-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.0.43 - MySQL Community Server - GPL
-- Server OS:                    Linux
-- HeidiSQL Version:             12.11.0.7065
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping data for table learning_platform.answers: ~0 rows (approximately)

-- Dumping data for table learning_platform.courses: ~0 rows (approximately)
INSERT INTO `courses` (`id`, `category`, `created_at`, `description`, `price`, `thumbnail_url`, `title`, `instructor_id`) VALUES
	(1, 'Backend', '2025-11-05 03:48:09.951229', 'Security trong Spring Boot', 99.99, 'https://res.cloudinary.com/dm1alq68q/image/upload/v1762314494/thumbnail_url/pwx0mfdvwuphbkqv1f0j.jpg', 'Tìm hiểu về JWT/OAuth2', 1);

-- Dumping data for table learning_platform.enrollments: ~0 rows (approximately)
INSERT INTO `enrollments` (`id`, `completed_date`, `course_id`, `created_at`, `current_content_id`, `enrollment_date`, `progress_percentage`, `start_date`, `status`, `total_content_items`, `updated_at`, `user_id`, `version`) VALUES
	(1, NULL, 1, '2025-11-05 03:53:51.986797', '690aca02313dfe952de1377f', '2025-11-05 03:53:51.986797', 20, NULL, 'PENDING', 5, '2025-11-05 03:53:52.069168', 3, 4);

-- Dumping data for table learning_platform.enrollment_progress: ~0 rows (approximately)
INSERT INTO `enrollment_progress` (`id`, `completed`, `completed_date`, `content_item_id`, `content_type`, `duration_spent`, `score`, `updated_at`, `enrollment_id`) VALUES
	(1, b'0', NULL, '6906328bba458485e8e781dd', 'VIDEO', 0, NULL, '2025-11-05 03:53:52.049092', 1),
	(2, b'0', NULL, '690632ebba458485e8e781de', 'QUIZ', 0, NULL, '2025-11-05 04:14:10.323917', 1),
	(3, b'1', '2025-11-05 04:05:19.025435', '6906334eba458485e8e781df', 'DOCUMENT', 0, NULL, '2025-11-05 04:05:19.025435', 1),
	(5, b'0', NULL, '690aca42313dfe952de13780', 'QUIZ', 0, NULL, '2025-11-05 03:53:52.065841', 1);

-- Dumping data for table learning_platform.instructors: ~0 rows (approximately)
INSERT INTO `instructors` (`id`, `created_at`, `email`, `full_name`, `user_id`, `username`) VALUES
	(1, '2025-11-05 03:48:09.831543', 'admin@gmail.com', 'Nguyễn Hoàng Tuấn', 1, 'admin');

-- Dumping data for table learning_platform.invalidated_token: ~0 rows (approximately)

-- Dumping data for table learning_platform.likes: ~0 rows (approximately)
INSERT INTO `likes` (`id`, `created_at`, `user_id`, `answer_id`, `question_id`) VALUES
	(1, '2025-11-05 03:54:35.650680', 3, NULL, 1);

-- Dumping data for table learning_platform.notes: ~0 rows (approximately)

-- Dumping data for table learning_platform.notifications: ~0 rows (approximately)

-- Dumping data for table learning_platform.questions: ~0 rows (approximately)
INSERT INTO `questions` (`id`, `answered`, `asked_by`, `asker_name`, `content_id`, `course_id`, `created_at`, `question_text`, `updated_at`, `enrollment_id`) VALUES
	(1, b'0', 3, 'Nguyễn Hoàng Tuấn', '6906328bba458485e8e781dd', 1, '2025-11-05 03:54:30.854169', '<p>chào bạn nhé</p>', '2025-11-05 03:54:30.854169', 1),
	(2, b'0', 3, 'Nguyễn Hoàng Tuấn', '690aca02313dfe952de1377f', 1, '2025-11-05 04:35:31.174688', '<p>xin chào</p>', '2025-11-05 04:35:31.174688', 1);

-- Dumping data for table learning_platform.users: ~2 rows (approximately)
INSERT INTO `users` (`id`, `avatar_url`, `created_at`, `email`, `name`, `password`, `role`, `updated_at`, `username`) VALUES
	(1, NULL, '2025-11-05 03:30:36.826762', 'admin@gmail.com', 'Admin User', '$2a$10$DeCwWFlFHcHNEMr/jcS/E.Sx84IDlkCFUc67OEJyDOo7C3phOInPy', 'ADMIN', '2025-11-05 03:30:36.826762', 'admin'),
	(3, 'https://res.cloudinary.com/dm1alq68q/image/upload/v1760537905/avatar-user/mxtfgjtqxgjtw1pbelba.jpg', '2025-11-05 03:43:54.351593', 'nguyenhoangtuan12102003@gmail.com', 'Nguyễn Hoàng Tuấn', '$2a$10$b84OenIc83yxiH6FlzN4sOgCZLgtwoRTGp04Gzj1vxIw9.1Amk7vy', 'STUDENT', '2025-11-05 03:43:54.351593', 'hoangtuan');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
