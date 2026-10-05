/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.15-MariaDB, for Linux (x86_64)
--
-- Host: 192.168.0.100    Database: sansuiel_ecom_db
-- ------------------------------------------------------
-- Server version	8.0.46-37

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `banners`
--

DROP TABLE IF EXISTS `banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `banners` (
  `id` int NOT NULL AUTO_INCREMENT,
  `image_url` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `subtitle` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `link` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banners`
--

LOCK TABLES `banners` WRITE;
/*!40000 ALTER TABLE `banners` DISABLE KEYS */;
INSERT INTO `banners` VALUES
(1,'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop','SUMMER SALE','Up to 70% Off',NULL);
/*!40000 ALTER TABLE `banners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart`
--

DROP TABLE IF EXISTS `cart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `variant_info` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=115 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart`
--

LOCK TABLES `cart` WRITE;
/*!40000 ALTER TABLE `cart` DISABLE KEYS */;
INSERT INTO `cart` VALUES
(31,13,219,1,NULL),
(32,2,238,1,NULL),
(76,16,335,1,NULL),
(111,11,335,1,NULL),
(113,11,249,1,NULL);
/*!40000 ALTER TABLE `cart` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `icon` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `parent_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES
(1,'Electronics','devices',NULL),
(2,'Fashion','checkroom',NULL),
(3,'Home & Garden','home',NULL),
(4,'Beauty','face',NULL),
(5,'Sports','sports',NULL);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chats`
--

DROP TABLE IF EXISTS `chats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `chats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` int DEFAULT NULL,
  `sender_id` int NOT NULL,
  `receiver_id` int NOT NULL,
  `message` text COLLATE utf8mb4_general_ci NOT NULL,
  `attachment` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sender_id` (`sender_id`),
  KEY `receiver_id` (`receiver_id`),
  KEY `ticket_id` (`ticket_id`),
  CONSTRAINT `chats_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chats_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chats_ibfk_3` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chats`
--

LOCK TABLES `chats` WRITE;
/*!40000 ALTER TABLE `chats` DISABLE KEYS */;
/*!40000 ALTER TABLE `chats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupons`
--

DROP TABLE IF EXISTS `coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `discount_type` enum('percentage','fixed') COLLATE utf8mb4_general_ci NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `min_spend` decimal(10,2) DEFAULT '0.00',
  `expiry_date` date NOT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_general_ci DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupons`
--

LOCK TABLES `coupons` WRITE;
/*!40000 ALTER TABLE `coupons` DISABLE KEYS */;
INSERT INTO `coupons` VALUES
(1,'SAVE10','percentage',10.00,0.00,'2027-12-31','active'),
(2,'FLAT20','fixed',20.00,50.00,'2027-12-31','active'),
(3,'HALF50','percentage',50.00,100.00,'2027-12-31','active'),
(4,'WELCOME','percentage',15.00,0.00,'2027-12-31','active'),
(5,'FREESHIP','fixed',10.00,0.00,'2027-12-31','active');
/*!40000 ALTER TABLE `coupons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `message` text COLLATE utf8mb4_general_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'promo',
  `user_id` int DEFAULT NULL,
  `is_global` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_read` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=177 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES
(1,'BIG SUMMER SALE! 🚀','Get up to 70% OFF on all electronics this week. Don\'t miss out!','promo',NULL,1,'2026-03-25 19:38:01',0),
(2,'Order Placed! 🎉','Your order #13 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-03-31 20:11:41',1),
(3,'New Order Received! 📦','You\'ve got a new order #13. Check your dashboard for details.','new_order',3,1,'2026-03-31 20:11:41',1),
(4,'Order Placed! 🎉','Your order #14 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-03-31 20:17:21',1),
(5,'New Order Received! 📦','You\'ve got a new order #14. Check your dashboard for details.','new_order',3,1,'2026-03-31 20:17:22',1),
(6,'Order Placed! 🎉','Your order #15 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-03-31 20:18:37',1),
(7,'New Order Received! 📦','You\'ve got a new order #15. Check your dashboard for details.','new_order',3,1,'2026-03-31 20:18:38',1),
(8,'Order Placed! 🎉','Your order #16 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-03-31 20:25:44',1),
(9,'New Order Received! 📦','You\'ve got a new order #16. Check your dashboard for details.','new_order',3,1,'2026-03-31 20:25:44',1),
(10,'Order Placed! 🎉','Your order #17 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-03-31 20:27:38',1),
(11,'New Order Received! 📦','You\'ve got a new order #17. Check your dashboard for details.','new_order',3,1,'2026-03-31 20:27:39',1),
(12,'Order Placed! 🎉','Your order #18 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-03-31 20:27:39',1),
(13,'New Order Received! 📦','You\'ve got a new order #18. Check your dashboard for details.','new_order',3,1,'2026-03-31 20:27:40',1),
(14,'Order Placed! 🎉','Your order #19 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-03-31 20:28:54',1),
(15,'New Order Received! 📦','You\'ve got a new order #19. Check your dashboard for details.','new_order',3,1,'2026-03-31 20:28:54',1),
(16,'Order Placed! 🎉','Your order #20 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-03-31 20:31:55',1),
(17,'New Order Received! 📦','You\'ve got a new order #20. Check your dashboard for details.','new_order',3,1,'2026-03-31 20:31:56',1),
(18,'Order Placed! 🎉','Your order #21 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-06 07:12:40',1),
(19,'New Order Received! 📦','You\'ve got a new order #21. Check your dashboard for details.','new_order',3,1,'2026-04-06 07:12:40',1),
(20,'Order Placed! 🎉','Your order #22 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-06 07:13:08',1),
(21,'New Order Received! 📦','You\'ve got a new order #22. Check your dashboard for details.','new_order',3,1,'2026-04-06 07:13:09',1),
(22,'Order Placed! 🎉','Your order #23 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-06 07:14:51',1),
(23,'New Order Received! 📦','You\'ve got a new order #23. Check your dashboard for details.','new_order',3,1,'2026-04-06 07:14:52',1),
(24,'Order Placed! 🎉','Your order #24 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-06 07:15:32',1),
(25,'New Order Received! 📦','You\'ve got a new order #24. Check your dashboard for details.','new_order',3,1,'2026-04-06 07:15:32',1),
(26,'Order Placed! 🎉','Your order #25 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-06 07:36:02',1),
(27,'New Order Received! 📦','You\'ve got a new order #25. Check your dashboard for details.','new_order',3,1,'2026-04-06 07:36:02',1),
(28,'Order Placed! 🎉','Your order #26 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-06 07:44:07',1),
(29,'New Order Received! 📦','You\'ve got a new order #26. Check your dashboard for details.','new_order',3,1,'2026-04-06 07:44:08',1),
(30,'Order Placed! 🎉','Your order #27 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-06 07:45:53',1),
(31,'New Order Received! 📦','You\'ve got a new order #27. Check your dashboard for details.','new_order',3,1,'2026-04-06 07:45:53',1),
(32,'Order Placed! 🎉','Your order #28 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-06 07:46:44',1),
(33,'New Order Received! 📦','You\'ve got a new order #28. Check your dashboard for details.','new_order',3,1,'2026-04-06 07:46:45',1),
(34,'Order Placed! 🎉','Your order #29 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-06 07:50:57',1),
(35,'New Order Received! 📦','You\'ve got a new order #29. Check your dashboard for details.','new_order',3,1,'2026-04-06 07:50:57',1),
(36,'Order Placed! 🎉','Your order #30 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-06 07:51:43',1),
(37,'New Order Received! 📦','You\'ve got a new order #30. Check your dashboard for details.','new_order',3,1,'2026-04-06 07:51:43',1),
(38,'Order Placed! 🎉','Your order #31 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-06 07:52:46',1),
(39,'New Order Received! 📦','You\'ve got a new order #31. Check your dashboard for details.','new_order',3,1,'2026-04-06 07:52:46',1),
(40,'Order Placed! 🎉','Your order #32 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-06 07:54:06',1),
(41,'New Order Received! 📦','You\'ve got a new order #32. Check your dashboard for details.','new_order',3,1,'2026-04-06 07:54:07',1),
(42,'Order Placed! 🎉','Your order #33 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-06 08:01:13',1),
(43,'New Order Received! 📦','You\'ve got a new order #33. Check your dashboard for details.','seller_orders',3,1,'2026-04-06 08:01:14',1),
(44,'Order Placed','your order has been placed','order_placed',7,1,'2026-04-06 08:03:43',1),
(45,'New Order','you got a new order','seller_orders',3,1,'2026-04-06 08:03:45',1),
(46,'Order Placed','your order has been placed','order_placed',7,1,'2026-04-06 08:04:20',1),
(47,'New Order','you got a new order','seller_orders',3,1,'2026-04-06 08:04:21',1),
(48,'Order Placed','your order has been placed successfully','order_placed',7,1,'2026-04-06 08:07:15',1),
(49,'New Order','you got a new order','seller_orders',3,1,'2026-04-06 08:07:17',1),
(50,'Order Placed','your order has been placed successfully','order_placed',7,1,'2026-04-06 08:07:44',1),
(51,'New Order','you got a new order','seller_orders',3,1,'2026-04-06 08:07:45',1),
(52,'Order Placed! 🎉','Your order #38 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-06 08:08:12',1),
(53,'New Order Received! 📦','You\'ve got a new order #38. Check your dashboard for details.','new_order',3,1,'2026-04-06 08:08:13',1),
(54,'Order Placed! 🎉','Your order #39 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-06 08:16:12',1),
(55,'New Order Received! 📦','You\'ve got a new order #39. Check your dashboard for details.','new_order',3,1,'2026-04-06 08:16:13',1),
(56,'Order Placed! 🎉','Your order #40 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-06 08:27:45',1),
(57,'New Order Received! 📦','You\'ve got a new order #40. Check your dashboard for details.','new_order',3,1,'2026-04-06 08:27:47',1),
(58,'Order Placed! 🎉','Your order #41 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-06 08:27:47',1),
(59,'New Order Received! 📦','You\'ve got a new order #41. Check your dashboard for details.','new_order',3,1,'2026-04-06 08:27:48',1),
(60,'Order Placed! 🎉','Your order #42 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-06 08:59:56',1),
(61,'New Order Received! 📦','You\'ve got a new order #42. Check your dashboard for details.','new_order',3,1,'2026-04-06 08:59:57',1),
(62,'Order #38 Cancelled','Your order #38 has been cancelled by the seller. Reason: vuhvyv','order_details',7,1,'2026-04-06 09:17:20',1),
(63,'Order #38 Cancelled','You have cancelled order #38.','seller_orders',3,1,'2026-04-06 09:17:21',1),
(64,'Order #37 Cancelled','Your order #37 has been cancelled by the seller. Reason: out of stock','order_details',7,1,'2026-04-06 09:17:58',1),
(65,'Order #37 Cancelled','You have cancelled order #37.','seller_orders',3,1,'2026-04-06 09:17:59',1),
(66,'Order Placed! 🎉','Your order #43 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-06 09:27:52',1),
(67,'New Order Received! 📦','You\'ve got a new order #43. Check your dashboard for details.','new_order',3,1,'2026-04-06 09:27:53',1),
(68,'Order Update','Your order #43 status has been updated to CONFIRMED.','order_details',7,1,'2026-04-06 09:28:42',1),
(69,'Order Update','Your order #43 status has been updated to SHIPPED.','order_details',7,1,'2026-04-08 06:57:06',1),
(70,'Order Update','Your order #43 status has been updated to DELIVERED.','order_details',7,1,'2026-04-08 06:57:20',1),
(71,'Order Placed! 🎉','Your order #44 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-08 09:56:05',1),
(72,'New Order Received! 📦','You\'ve got a new order #44. Check your dashboard for details.','new_order',3,1,'2026-04-08 09:56:07',1),
(73,'Order Placed! 🎉','Your order #45 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-08 09:57:07',1),
(74,'New Order Received! 📦','You\'ve got a new order #45. Check your dashboard for details.','new_order',3,1,'2026-04-08 09:57:08',1),
(75,'Order Placed! 🎉','Your order #46 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-08 09:58:12',1),
(76,'New Order Received! 📦','You\'ve got a new order #46. Check your dashboard for details.','new_order',3,1,'2026-04-08 09:58:14',1),
(77,'Order Placed! 🎉','Your order #47 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-08 10:01:16',1),
(78,'New Order Received! 📦','You\'ve got a new order #47. Check your dashboard for details.','new_order',3,1,'2026-04-08 10:01:17',1),
(79,'Order Placed! 🎉','Your order #48 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-08 10:03:01',1),
(80,'New Order Received! 📦','You\'ve got a new order #48. Check your dashboard for details.','new_order',3,1,'2026-04-08 10:03:02',1),
(81,'Order Placed! 🎉','Your order #49 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-08 10:05:00',1),
(82,'New Order Received! 📦','You\'ve got a new order #49. Check your dashboard for details.','new_order',3,1,'2026-04-08 10:05:02',1),
(83,'Order Placed! 🎉','Your order #50 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-11 10:04:04',1),
(84,'New Order Received! 📦','You\'ve got a new order #50. Check your dashboard for details.','new_order',3,1,'2026-04-11 10:04:09',1),
(85,'Order Placed! 🎉','Your order #51 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-11 10:07:30',1),
(86,'New Order Received! 📦','You\'ve got a new order #51. Check your dashboard for details.','new_order',3,1,'2026-04-11 10:07:43',1),
(87,'Order Placed! 🎉','Your order #52 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-11 10:07:44',1),
(88,'Order Placed! 🎉','Your order #53 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-11 10:07:45',1),
(89,'Order Placed! 🎉','Your order #55 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-11 10:07:45',1),
(90,'Order Placed! 🎉','Your order #57 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-11 10:07:45',1),
(91,'Order Placed! 🎉','Your order #56 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-11 10:07:46',1),
(92,'Order Placed! 🎉','Your order #54 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-11 10:07:46',1),
(93,'New Order Received! 📦','You\'ve got a new order #53. Check your dashboard for details.','new_order',3,1,'2026-04-11 10:07:46',1),
(94,'Order Placed! 🎉','Your order #59 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-11 10:07:47',1),
(95,'Order Placed! 🎉','Your order #60 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-11 10:07:47',1),
(96,'New Order Received! 📦','You\'ve got a new order #55. Check your dashboard for details.','new_order',3,1,'2026-04-11 10:07:47',1),
(97,'Order Placed! 🎉','Your order #58 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-11 10:07:47',1),
(98,'New Order Received! 📦','You\'ve got a new order #52. Check your dashboard for details.','new_order',3,1,'2026-04-11 10:07:48',1),
(99,'New Order Received! 📦','You\'ve got a new order #54. Check your dashboard for details.','new_order',3,1,'2026-04-11 10:07:48',1),
(100,'New Order Received! 📦','You\'ve got a new order #60. Check your dashboard for details.','new_order',3,1,'2026-04-11 10:07:49',1),
(101,'New Order Received! 📦','You\'ve got a new order #56. Check your dashboard for details.','new_order',3,1,'2026-04-11 10:07:49',1),
(102,'New Order Received! 📦','You\'ve got a new order #59. Check your dashboard for details.','new_order',3,1,'2026-04-11 10:07:49',1),
(103,'New Order Received! 📦','You\'ve got a new order #58. Check your dashboard for details.','new_order',3,1,'2026-04-11 10:07:50',1),
(104,'Order Placed! 🎉','Your order #61 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-16 08:19:51',1),
(105,'New Order Received! 📦','You\'ve got a new order #61. Check your dashboard for details.','new_order',3,1,'2026-04-16 08:19:54',1),
(106,'Order Placed! 🎉','Your order #62 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-16 08:50:09',0),
(107,'New Order Received! 📦','You\'ve got a new order #62. Check your dashboard for details.','new_order',14,1,'2026-04-16 08:50:11',0),
(108,'Order Placed! 🎉','Your order #63 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-16 09:09:43',0),
(109,'Order Placed! 🎉','Your order #64 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-16 09:09:44',0),
(110,'New Order Received! 📦','You\'ve got a new order #63. Check your dashboard for details.','new_order',3,1,'2026-04-16 09:09:45',1),
(111,'New Order Received! 📦','You\'ve got a new order #64. Check your dashboard for details.','new_order',3,1,'2026-04-16 09:09:45',1),
(112,'Order Placed! 🎉','Your order #65 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-16 09:12:00',0),
(113,'New Order Received! 📦','You\'ve got a new order #65. Check your dashboard for details.','new_order',3,1,'2026-04-16 09:12:01',1),
(114,'Order Placed! 🎉','Your order #66 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-16 09:25:54',0),
(115,'Order Placed! 🎉','Your order #71 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-16 09:25:56',0),
(116,'Order Placed! 🎉','Your order #69 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-16 09:25:56',0),
(117,'Order Placed! 🎉','Your order #74 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-16 09:25:56',0),
(118,'Order Placed! 🎉','Your order #68 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-16 09:25:56',0),
(119,'Order Placed! 🎉','Your order #70 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-16 09:25:56',0),
(120,'Order Placed! 🎉','Your order #72 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-16 09:25:57',0),
(121,'Order Placed! 🎉','Your order #73 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-16 09:25:57',0),
(122,'Order Placed! 🎉','Your order #75 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-16 09:25:58',0),
(123,'Order Placed! 🎉','Your order #67 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-16 09:26:00',0),
(124,'Order Placed! 🎉','Your order #76 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-16 09:26:09',0),
(125,'New Order Received! 📦','You\'ve got a new order #71. Check your dashboard for details.','new_order',3,1,'2026-04-16 09:26:12',1),
(126,'New Order Received! 📦','You\'ve got a new order #69. Check your dashboard for details.','new_order',3,1,'2026-04-16 09:26:12',1),
(127,'New Order Received! 📦','You\'ve got a new order #74. Check your dashboard for details.','new_order',3,1,'2026-04-16 09:26:12',1),
(128,'New Order Received! 📦','You\'ve got a new order #67. Check your dashboard for details.','new_order',3,1,'2026-04-16 09:26:12',1),
(129,'New Order Received! 📦','You\'ve got a new order #75. Check your dashboard for details.','new_order',3,1,'2026-04-16 09:26:14',1),
(130,'New Order Received! 📦','You\'ve got a new order #66. Check your dashboard for details.','new_order',3,1,'2026-04-16 09:26:19',1),
(131,'New Order Received! 📦','You\'ve got a new order #72. Check your dashboard for details.','new_order',3,1,'2026-04-16 09:26:19',1),
(132,'New Order Received! 📦','You\'ve got a new order #73. Check your dashboard for details.','new_order',3,1,'2026-04-16 09:26:20',1),
(133,'New Order Received! 📦','You\'ve got a new order #68. Check your dashboard for details.','new_order',3,1,'2026-04-16 09:26:20',1),
(134,'New Order Received! 📦','You\'ve got a new order #70. Check your dashboard for details.','new_order',3,1,'2026-04-16 09:26:29',1),
(135,'New Order Received! 📦','You\'ve got a new order #76. Check your dashboard for details.','new_order',3,1,'2026-04-16 09:26:43',1),
(136,'Order Placed! 🎉','Your order #77 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-21 08:57:04',0),
(137,'New Order Received! 📦','You\'ve got a new order #77. Check your dashboard for details.','new_order',3,1,'2026-04-21 08:57:05',1),
(138,'Order Update','Your order #41 status has been updated to SHIPPED.','order_details',7,1,'2026-04-21 09:11:17',0),
(139,'Order Update','Your order #41 status has been updated to DELIVERED.','order_details',7,1,'2026-04-21 09:11:29',0),
(140,'Order Update','Your order #77 status has been updated to CONFIRMED.','order_details',7,1,'2026-04-21 09:18:52',0),
(141,'Order Update','Your order #77 status has been updated to SHIPPED.','order_details',7,1,'2026-04-21 09:18:56',0),
(142,'Order Update','Your order #77 status has been updated to DELIVERED.','order_details',7,1,'2026-04-21 09:19:01',1),
(143,'Order Placed! 🎉','Your order #78 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-21 21:25:10',1),
(144,'New Order Received! 📦','You\'ve got a new order #78. Check your dashboard for details.','new_order',3,1,'2026-04-21 21:25:11',1),
(145,'Order Placed! 🎉','Your order #79 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-21 21:25:12',1),
(146,'New Order Received! 📦','You\'ve got a new order #79. Check your dashboard for details.','new_order',3,1,'2026-04-21 21:25:13',1),
(147,'Order Placed! 🎉','Your order #80 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-21 21:26:46',1),
(148,'New Order Received! 📦','You\'ve got a new order #80. Check your dashboard for details.','new_order',3,1,'2026-04-21 21:26:47',1),
(149,'Order Placed! 🎉','Your order #81 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-21 21:30:29',1),
(150,'New Order Received! 📦','You\'ve got a new order #81. Check your dashboard for details.','new_order',3,1,'2026-04-21 21:30:30',1),
(151,'Order Placed! 🎉','Your order #82 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-21 21:31:48',1),
(152,'New Order Received! 📦','You\'ve got a new order #82. Check your dashboard for details.','new_order',3,1,'2026-04-21 21:31:49',1),
(153,'Order Placed! 🎉','Your order #83 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-21 21:33:12',0),
(154,'New Order Received! 📦','You\'ve got a new order #83. Check your dashboard for details.','new_order',3,1,'2026-04-21 21:33:13',1),
(155,'Order Placed! 🎉','Your order #84 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-21 21:35:23',0),
(156,'New Order Received! 📦','You\'ve got a new order #84. Check your dashboard for details.','new_order',3,1,'2026-04-21 21:35:24',1),
(157,'Return Requested 🔄','A return for order #77 has been requested by hello. Reason: i dont like that','return_requested',3,1,'2026-04-21 21:37:50',1),
(158,'Order Placed! 🎉','Your order #86 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-22 17:22:40',0),
(159,'New Order Received! 📦','You\'ve got a new order #86. Check your dashboard for details.','new_order',3,1,'2026-04-22 17:22:41',1),
(160,'Order Placed! 🎉','Your order #87 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-04-28 07:13:19',0),
(161,'New Order Received! 📦','You\'ve got a new order #87. Check your dashboard for details.','new_order',3,1,'2026-04-28 07:13:20',1),
(162,'Order Placed! 🎉','Your order #88 has been placed successfully. Thank you for shopping!','order_placed',17,1,'2026-04-29 07:19:25',0),
(163,'New Order Received! 📦','You\'ve got a new order #88. Check your dashboard for details.','new_order',3,1,'2026-04-29 07:19:26',1),
(164,'Order Placed! 🎉','Your order #89 has been placed successfully. Thank you for shopping!','order_placed',11,1,'2026-06-24 12:08:15',0),
(165,'New Order Received! 📦','You\'ve got a new order #89. Check your dashboard for details.','new_order',3,1,'2026-06-24 12:08:15',1),
(166,'Order Placed! 🎉','Your order #90 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-07-16 05:58:14',0),
(167,'New Order Received! 📦','You\'ve got a new order #90. Check your dashboard for details.','new_order',3,1,'2026-07-16 05:58:14',1),
(168,'Order #90 Cancelled','Your order #90 has been cancelled by the seller. Reason: test','order_details',7,1,'2026-07-16 06:09:58',0),
(169,'Order #90 Cancelled','You have cancelled order #90.','seller_orders',3,1,'2026-07-16 06:09:58',1),
(170,'Order Update','Your order #89 status has been updated to CONFIRMED.','order_details',11,1,'2026-07-16 06:13:56',0),
(171,'Order Update','Your order #89 status has been updated to SHIPPED.','order_details',11,1,'2026-07-16 06:14:36',0),
(172,'Order Update','Your order #89 status has been updated to DELIVERED.','order_details',11,1,'2026-07-16 06:14:43',0),
(173,'New Order Received! 📦','You\'ve got a new order #91. Check your dashboard for details.','new_order',3,1,'2026-08-10 07:34:51',0),
(174,'New Order Received! 📦','You\'ve got a new order #92. Check your dashboard for details.','new_order',3,1,'2026-08-10 07:34:52',0),
(175,'Order Placed! 🎉','Your order #93 has been placed successfully. Thank you for shopping!','order_placed',7,1,'2026-08-10 07:39:37',0),
(176,'New Order Received! 📦','You\'ve got a new order #93. Check your dashboard for details.','new_order',3,1,'2026-08-10 07:39:38',0);
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_chats`
--

DROP TABLE IF EXISTS `order_chats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_chats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `sender_type` enum('seller','customer') COLLATE utf8mb4_general_ci NOT NULL,
  `message` text COLLATE utf8mb4_general_ci NOT NULL,
  `attachment_url` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_chats`
--

LOCK TABLES `order_chats` WRITE;
/*!40000 ALTER TABLE `order_chats` DISABLE KEYS */;
INSERT INTO `order_chats` VALUES
(1,'76','seller','hi',NULL,'2026-04-22 02:02:22'),
(2,'76','seller','check this','uploads/chats/1776805358_recommended_products (1).jpg','2026-04-22 02:02:38'),
(3,'11','customer','hi',NULL,'2026-04-22 02:21:18'),
(4,'77','customer','hi',NULL,'2026-04-22 02:22:38'),
(5,'64','customer','hi',NULL,'2026-04-22 02:24:23'),
(6,'61','customer','i want more details about this',NULL,'2026-04-24 11:02:05'),
(7,'43','customer','hi',NULL,'2026-06-24 14:42:49'),
(8,'90','customer','hi',NULL,'2026-07-16 08:59:49'),
(9,'89','seller','hi',NULL,'2026-07-16 09:30:45');
/*!40000 ALTER TABLE `order_chats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `commission_amount` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=128 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES
(10,7,245,1,234.62,0.00),
(11,8,244,1,51.53,0.00),
(12,9,331,1,88.00,0.00),
(13,9,334,1,10.00,0.00),
(14,10,333,1,866868.00,0.00),
(15,11,333,1,866868.00,0.00),
(16,12,335,1,20.00,0.00),
(17,13,333,1,866868.00,0.00),
(18,14,333,1,866868.00,0.00),
(19,15,333,1,866868.00,0.00),
(20,16,335,1,20.00,0.00),
(21,17,335,1,20.00,0.00),
(22,18,335,1,20.00,0.00),
(23,19,333,1,866868.00,0.00),
(24,20,335,1,20.00,0.00),
(25,21,335,1,20.00,0.00),
(26,22,335,1,20.00,0.00),
(27,23,335,1,20.00,0.00),
(28,24,335,1,20.00,0.00),
(29,25,335,1,20.00,0.00),
(30,26,335,1,20.00,0.00),
(31,27,333,1,866868.00,0.00),
(32,27,239,1,73.74,0.00),
(33,28,335,1,20.00,0.00),
(34,29,333,1,866868.00,0.00),
(35,30,333,1,866868.00,0.00),
(36,31,333,1,866868.00,0.00),
(37,32,333,1,866868.00,0.00),
(38,33,332,1,100.00,0.00),
(39,33,335,1,20.00,0.00),
(40,34,335,1,20.00,0.00),
(41,35,333,1,866868.00,0.00),
(42,36,335,1,20.00,0.00),
(43,37,335,1,20.00,0.00),
(44,38,335,1,20.00,0.00),
(45,39,335,1,20.00,0.00),
(46,40,333,1,866868.00,0.00),
(47,41,333,1,866868.00,0.00),
(48,42,335,1,20.00,0.00),
(49,43,334,1,10.00,0.00),
(50,44,333,1,866868.00,0.00),
(51,45,333,1,866868.00,0.00),
(52,46,333,1,866868.00,0.00),
(53,47,333,1,866868.00,0.00),
(54,47,335,1,20.00,0.00),
(55,48,333,1,866868.00,0.00),
(56,49,333,1,866868.00,0.00),
(57,50,335,1,20.00,0.00),
(58,51,333,1,866868.00,0.00),
(59,52,333,1,866868.00,0.00),
(60,53,333,1,866868.00,0.00),
(61,54,333,1,866868.00,0.00),
(62,55,333,1,866868.00,0.00),
(63,56,333,1,866868.00,0.00),
(64,57,333,1,866868.00,0.00),
(65,58,333,1,866868.00,0.00),
(66,59,333,1,866868.00,0.00),
(67,60,333,1,866868.00,0.00),
(68,61,225,1,28.37,0.00),
(69,61,335,1,20.00,0.00),
(70,62,330,1,25.00,0.00),
(71,63,334,2,10.00,0.00),
(72,64,334,2,10.00,0.00),
(73,65,334,1,10.00,0.00),
(74,65,332,1,100.00,0.00),
(75,66,333,1,866868.00,0.00),
(76,66,334,1,10.00,0.00),
(77,66,335,2,20.00,0.00),
(78,67,333,1,866868.00,0.00),
(79,67,334,1,10.00,0.00),
(80,67,335,2,20.00,0.00),
(81,68,333,1,866868.00,0.00),
(82,68,334,1,10.00,0.00),
(83,68,335,2,20.00,0.00),
(84,69,333,1,866868.00,0.00),
(85,70,333,1,866868.00,0.00),
(86,69,334,1,10.00,0.00),
(87,70,334,1,10.00,0.00),
(88,70,335,2,20.00,0.00),
(89,69,335,2,20.00,0.00),
(90,71,333,1,866868.00,0.00),
(91,72,333,1,866868.00,0.00),
(92,71,334,1,10.00,0.00),
(93,71,335,2,20.00,0.00),
(94,72,334,1,10.00,0.00),
(95,72,335,2,20.00,0.00),
(96,73,333,1,866868.00,0.00),
(97,73,334,1,10.00,0.00),
(98,75,333,1,866868.00,0.00),
(99,74,333,1,866868.00,0.00),
(100,73,335,2,20.00,0.00),
(101,75,334,1,10.00,0.00),
(102,74,334,1,10.00,0.00),
(103,75,335,2,20.00,0.00),
(104,74,335,2,20.00,0.00),
(105,76,333,1,866868.00,0.00),
(106,76,334,1,10.00,0.00),
(107,76,335,2,20.00,0.00),
(108,77,333,1,866868.00,0.00),
(109,78,290,1,3.00,0.00),
(110,78,335,1,20.00,0.00),
(111,79,290,1,3.00,0.00),
(112,79,335,1,20.00,0.00),
(113,80,335,1,20.00,0.00),
(114,81,335,1,20.00,0.00),
(115,82,335,1,20.00,0.00),
(116,83,335,1,20.00,0.00),
(117,84,335,1,20.00,0.00),
(118,85,335,1,20.00,0.00),
(119,86,335,1,20.00,0.00),
(120,87,240,1,296.77,0.00),
(121,88,335,1,20.00,0.00),
(122,89,334,1,10.00,0.00),
(123,90,333,1,866868.00,0.00),
(124,90,335,1,20.00,0.00),
(125,91,335,1,20.00,0.00),
(126,92,335,1,20.00,0.00),
(127,93,334,1,10.00,0.00);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'PROCESSING',
  `total_amount` decimal(10,2) NOT NULL,
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `shipping_address` text COLLATE utf8mb4_general_ci NOT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `payment_status` enum('pending','paid','failed') COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `order_status` enum('pending','confirmed','shipped','delivered','cancelled','returned') COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `cancellation_reason` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=94 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES
(7,7,256.35,'PROCESSING',0.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','delivered',NULL,'2026-03-29 20:51:32','2026-04-08 07:29:13'),
(8,7,0.00,'PROCESSING',64.11,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','delivered',NULL,'2026-03-29 21:01:48','2026-04-08 07:29:13'),
(9,7,0.00,'PROCESSING',112.90,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','delivered',NULL,'2026-03-31 13:53:17','2026-04-08 07:29:13'),
(10,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-03-31 14:52:15','2026-04-08 07:29:13'),
(11,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-03-31 19:50:05','2026-04-08 07:29:13'),
(12,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-03-31 20:04:18','2026-04-08 07:29:13'),
(13,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-03-31 20:11:40','2026-04-08 07:29:13'),
(14,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-03-31 20:17:21','2026-04-08 07:29:13'),
(15,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-03-31 20:18:37','2026-04-08 07:29:13'),
(16,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-03-31 20:25:43','2026-04-08 07:29:13'),
(17,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-03-31 20:27:37','2026-04-08 07:29:13'),
(18,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-03-31 20:27:39','2026-04-08 07:29:13'),
(19,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','delivered',NULL,'2026-03-31 20:28:53','2026-04-08 07:29:13'),
(20,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','delivered',NULL,'2026-03-31 20:31:55','2026-04-08 07:29:13'),
(21,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-06 07:12:39','2026-04-08 07:29:13'),
(22,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-06 07:13:08','2026-04-08 07:29:13'),
(23,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-06 07:14:51','2026-04-08 07:29:13'),
(24,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-06 07:15:31','2026-04-08 07:29:13'),
(25,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-06 07:36:01','2026-04-08 07:29:13'),
(26,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-06 07:44:07','2026-04-08 07:29:13'),
(27,7,0.00,'PROCESSING',910298.83,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-06 07:45:52','2026-04-08 07:29:13'),
(28,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-06 07:46:43','2026-04-08 07:29:13'),
(29,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-06 07:50:56','2026-04-08 07:29:13'),
(30,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-06 07:51:42','2026-04-08 07:29:13'),
(31,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-06 07:52:45','2026-04-08 07:29:13'),
(32,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-06 07:54:06','2026-04-08 07:29:13'),
(33,7,0.00,'PROCESSING',136.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-06 08:01:12','2026-04-08 07:29:13'),
(34,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-06 08:03:42','2026-04-08 07:29:13'),
(35,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-06 08:04:19','2026-04-08 07:29:13'),
(36,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-06 08:07:14','2026-04-08 07:29:13'),
(37,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','cancelled','out of stock','2026-04-06 08:07:43','2026-04-08 07:29:13'),
(38,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','cancelled','vuhvyv','2026-04-06 08:08:11','2026-04-08 07:29:13'),
(39,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','cancelled','bdfbnf','2026-04-06 08:16:10','2026-04-08 07:29:13'),
(40,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','cancelled','geehr','2026-04-06 08:27:44','2026-04-08 07:29:13'),
(41,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','delivered',NULL,'2026-04-06 08:27:45','2026-04-21 09:11:28'),
(42,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','cancelled','vhvhhv','2026-04-06 08:59:55','2026-04-08 07:29:13'),
(43,7,0.00,'PROCESSING',20.50,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','delivered',NULL,'2026-04-06 09:27:51','2026-04-08 07:29:13'),
(44,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','cod','pending','',NULL,'2026-04-08 09:56:03','2026-04-08 09:56:03'),
(45,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','cod','pending','',NULL,'2026-04-08 09:57:05','2026-04-08 09:57:05'),
(46,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','easypaisa','pending','',NULL,'2026-04-08 09:58:10','2026-04-08 09:58:10'),
(47,7,0.00,'PROCESSING',910242.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','easypaisa','paid','',NULL,'2026-04-08 10:01:14','2026-04-08 10:01:14'),
(48,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','easypaisa','pending','',NULL,'2026-04-08 10:02:59','2026-04-08 10:02:59'),
(49,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','jazzcash','pending','',NULL,'2026-04-08 10:04:58','2026-04-08 10:04:58'),
(50,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-11 10:04:02','2026-04-11 10:04:02'),
(51,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-11 10:07:29','2026-04-11 10:07:29'),
(52,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-11 10:07:41','2026-04-11 10:07:41'),
(53,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-11 10:07:43','2026-04-11 10:07:43'),
(54,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-11 10:07:43','2026-04-11 10:07:43'),
(55,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-11 10:07:43','2026-04-11 10:07:43'),
(56,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-11 10:07:43','2026-04-11 10:07:43'),
(57,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-11 10:07:43','2026-04-11 10:07:43'),
(58,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-11 10:07:44','2026-04-11 10:07:44'),
(59,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-11 10:07:44','2026-04-11 10:07:44'),
(60,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-11 10:07:44','2026-04-11 10:07:44'),
(61,7,0.00,'PROCESSING',60.79,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-16 08:19:48','2026-04-16 08:19:48'),
(62,7,0.00,'PROCESSING',36.25,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-16 08:50:07','2026-04-16 08:50:07'),
(63,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-16 09:09:42','2026-04-16 09:09:42'),
(64,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-16 09:09:43','2026-04-16 09:09:43'),
(65,7,0.00,'PROCESSING',125.50,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-16 09:11:59','2026-04-16 09:11:59'),
(66,7,0.00,'PROCESSING',910273.90,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-16 09:25:36','2026-04-16 09:25:36'),
(67,7,0.00,'PROCESSING',910273.90,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-16 09:25:48','2026-04-16 09:25:48'),
(68,7,0.00,'PROCESSING',910273.90,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-16 09:25:48','2026-04-16 09:25:48'),
(69,7,0.00,'PROCESSING',910273.90,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-16 09:25:48','2026-04-16 09:25:48'),
(70,7,0.00,'PROCESSING',910273.90,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-16 09:25:48','2026-04-16 09:25:48'),
(71,7,0.00,'PROCESSING',910273.90,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-16 09:25:48','2026-04-16 09:25:48'),
(72,7,0.00,'PROCESSING',910273.90,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-16 09:25:48','2026-04-16 09:25:48'),
(73,7,0.00,'PROCESSING',910273.90,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-16 09:25:48','2026-04-16 09:25:48'),
(74,7,0.00,'PROCESSING',910273.90,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-16 09:25:48','2026-04-16 09:25:48'),
(75,7,0.00,'PROCESSING',910273.90,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-16 09:25:48','2026-04-16 09:25:48'),
(76,7,0.00,'PROCESSING',910273.90,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-16 09:25:50','2026-04-16 09:25:50'),
(77,7,0.00,'PROCESSING',910221.40,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','','i dont like that','2026-04-21 08:57:03','2026-04-21 21:37:49'),
(78,7,0.00,'PROCESSING',478.29,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-21 21:25:09','2026-04-21 21:25:09'),
(79,7,0.00,'PROCESSING',478.29,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-21 21:25:11','2026-04-21 21:25:11'),
(80,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-21 21:26:45','2026-04-21 21:26:45'),
(81,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-21 21:30:28','2026-04-21 21:30:28'),
(82,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-21 21:31:47','2026-04-21 21:31:47'),
(83,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','pending',NULL,'2026-04-21 21:33:11','2026-04-21 21:33:11'),
(84,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','cancelled','hehehe','2026-04-21 21:35:22','2026-04-24 08:01:40'),
(85,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','cancelled','miskenly','2026-04-22 16:05:20','2026-04-24 07:42:54'),
(86,7,0.00,'PROCESSING',31.00,0.00,'yer6d6, 63r66r, 5ed5d5, ydfy 9005','','pending','cancelled','mistakenly order','2026-04-22 17:22:38','2026-04-24 07:42:38'),
(87,7,0.00,'PROCESSING',321.61,0.00,'test, st no 3, sahiwal, sahiwal 57000','','pending','pending',NULL,'2026-04-28 07:13:19','2026-04-28 07:13:19'),
(88,17,0.00,'PROCESSING',31.00,0.00,'dbdndj, dhdhdhd, dhdhdhd, dhdjdhd 8986565','','pending','pending',NULL,'2026-04-29 07:19:25','2026-04-29 07:19:25'),
(89,11,0.00,'PROCESSING',20.50,0.00,'test, st no 2, sahiwal, 21 5700','','pending','delivered',NULL,'2026-06-24 12:08:14','2026-07-16 06:14:43'),
(90,7,0.00,'PROCESSING',910242.40,0.00,'test, st no 3, sahiwal, sahiwal 57000','','pending','cancelled','test','2026-07-16 05:58:14','2026-07-16 06:09:58'),
(91,20,0.00,'PROCESSING',20.00,0.00,'dasm;dnasd, lahore (54000)','','pending','pending',NULL,'2026-08-10 07:34:50','2026-08-10 07:34:50'),
(92,20,0.00,'PROCESSING',20.00,0.00,'dasm;dnasd, lahore (54000)','','pending','pending',NULL,'2026-08-10 07:34:52','2026-08-10 07:34:52'),
(93,7,0.00,'PROCESSING',10.00,0.00,'hgjjkj, tuioi (7989)','','pending','pending',NULL,'2026-08-10 07:39:37','2026-08-10 07:39:37');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `image_url` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `is_main` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=771 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_images`
--

LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
INSERT INTO `product_images` VALUES
(551,219,'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',1),
(552,219,'https://images.unsplash.com/photo-1526170315876-db1adbf17173?w=800',0),
(553,219,'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800',0),
(554,219,'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',0),
(555,219,'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',0),
(556,220,'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800',1),
(557,220,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',0),
(558,220,'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',0),
(559,220,'https://images.unsplash.com/photo-1526170315876-db1adbf17173?w=800',0),
(560,220,'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',0),
(561,221,'https://images.unsplash.com/photo-1526170315876-db1adbf17173?w=800',1),
(562,221,'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',0),
(563,221,'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',0),
(564,221,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',0),
(565,221,'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800',0),
(566,222,'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800',1),
(567,222,'https://images.unsplash.com/photo-1526170315876-db1adbf17173?w=800',0),
(568,222,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',0),
(569,222,'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800',0),
(570,222,'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',0),
(571,223,'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',1),
(572,223,'https://images.unsplash.com/photo-1526170315876-db1adbf17173?w=800',0),
(573,223,'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800',0),
(574,223,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',0),
(575,223,'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',0),
(576,224,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',1),
(577,224,'https://images.unsplash.com/photo-1526170315876-db1adbf17173?w=800',0),
(578,224,'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',0),
(579,224,'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800',0),
(580,224,'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800',0),
(581,225,'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',1),
(582,225,'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',0),
(583,225,'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800',0),
(584,225,'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',0),
(585,225,'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800',0),
(586,226,'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800',1),
(587,226,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',0),
(588,226,'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',0),
(589,226,'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',0),
(590,226,'https://images.unsplash.com/photo-1526170315876-db1adbf17173?w=800',0),
(591,227,'https://images.unsplash.com/photo-1526170315876-db1adbf17173?w=800',1),
(592,227,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',0),
(593,227,'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',0),
(594,227,'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',0),
(595,227,'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800',0),
(596,228,'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',1),
(597,228,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',0),
(598,228,'https://images.unsplash.com/photo-1526170315876-db1adbf17173?w=800',0),
(599,228,'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',0),
(600,228,'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',0),
(601,229,'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',1),
(602,229,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',0),
(603,229,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',0),
(604,229,'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800',0),
(605,229,'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',0),
(606,230,'https://images.unsplash.com/photo-1526170315876-db1adbf17173?w=800',1),
(607,230,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',0),
(608,230,'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',0),
(609,230,'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',0),
(610,230,'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',0),
(611,231,'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',1),
(612,231,'https://images.unsplash.com/photo-1526170315876-db1adbf17173?w=800',0),
(613,231,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',0),
(614,231,'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800',0),
(615,231,'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',0),
(616,232,'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',1),
(617,232,'https://images.unsplash.com/photo-1526170315876-db1adbf17173?w=800',0),
(618,232,'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800',0),
(619,232,'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',0),
(620,232,'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800',0),
(621,233,'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',1),
(622,233,'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',0),
(623,233,'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',0),
(624,233,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',0),
(625,233,'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',0),
(626,234,'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',1),
(627,234,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',0),
(628,234,'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',0),
(629,234,'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800',0),
(630,234,'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',0),
(631,235,'https://images.unsplash.com/photo-1526170315876-db1adbf17173?w=800',1),
(632,235,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',0),
(633,235,'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',0),
(634,235,'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800',0),
(635,235,'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',0),
(636,236,'https://images.unsplash.com/photo-1526170315876-db1adbf17173?w=800',1),
(637,236,'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800',0),
(638,236,'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',0),
(639,236,'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',0),
(640,236,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',0),
(641,237,'https://images.unsplash.com/photo-1526170315876-db1adbf17173?w=800',1),
(642,237,'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800',0),
(643,237,'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800',0),
(644,237,'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',0),
(645,237,'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',0),
(646,238,'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',1),
(647,238,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',0),
(648,238,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',0),
(649,238,'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',0),
(650,238,'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800',0),
(651,239,'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800',1),
(652,239,'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800',0),
(653,239,'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',0),
(654,239,'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',0),
(655,239,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',0),
(656,240,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',1),
(657,240,'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',0),
(658,240,'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',0),
(659,240,'https://images.unsplash.com/photo-1526170315876-db1adbf17173?w=800',0),
(660,240,'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',0),
(661,241,'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',1),
(662,241,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',0),
(663,241,'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800',0),
(664,241,'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800',0),
(665,241,'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',0),
(666,242,'https://images.unsplash.com/photo-1526170315876-db1adbf17173?w=800',1),
(667,242,'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',0),
(668,242,'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',0),
(669,242,'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',0),
(670,242,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',0),
(671,243,'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',1),
(672,243,'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',0),
(673,243,'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',0),
(674,243,'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800',0),
(675,243,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',0),
(676,244,'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',1),
(677,244,'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',0),
(678,244,'https://images.unsplash.com/photo-1526170315876-db1adbf17173?w=800',0),
(679,244,'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',0),
(680,244,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',0),
(681,245,'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',1),
(682,245,'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800',0),
(683,245,'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',0),
(684,245,'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',0),
(685,245,'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',0),
(686,246,'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800',1),
(687,246,'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',0),
(688,246,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',0),
(689,246,'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',0),
(690,246,'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',0),
(691,247,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',1),
(692,247,'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',0),
(693,247,'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',0),
(694,247,'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',0),
(695,247,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',0),
(696,248,'https://images.unsplash.com/photo-1526170315876-db1adbf17173?w=800',1),
(697,248,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',0),
(698,248,'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',0),
(699,248,'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',0),
(700,248,'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800',0),
(701,249,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',1),
(702,249,'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',0),
(703,249,'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',0),
(704,249,'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800',0),
(705,249,'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800',0),
(706,250,'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800',1),
(707,250,'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',0),
(708,250,'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',0),
(709,250,'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',0),
(710,250,'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',0),
(711,251,'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',1),
(712,251,'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',0),
(713,251,'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',0),
(714,251,'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800',0),
(715,251,'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',0),
(716,252,'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',1),
(717,252,'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',0),
(718,252,'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800',0),
(719,252,'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800',0),
(720,252,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',0),
(721,253,'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',1),
(722,253,'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800',0),
(723,253,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',0),
(724,253,'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',0),
(725,253,'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800',0),
(726,254,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',1),
(727,254,'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800',0),
(728,254,'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',0),
(729,254,'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800',0),
(730,254,'https://images.unsplash.com/photo-1526170315876-db1adbf17173?w=800',0),
(731,255,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',1),
(732,255,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',0),
(733,255,'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800',0),
(734,255,'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',0),
(735,255,'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',0),
(736,256,'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',1),
(737,256,'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',0),
(738,256,'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800',0),
(739,256,'https://images.unsplash.com/photo-1526170315876-db1adbf17173?w=800',0),
(740,256,'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',0),
(741,257,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',1),
(742,257,'https://images.unsplash.com/photo-1526170315876-db1adbf17173?w=800',0),
(743,257,'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',0),
(744,257,'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',0),
(745,257,'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800',0),
(746,258,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',1),
(747,258,'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800',0),
(748,258,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',0),
(749,258,'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',0),
(750,258,'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',0),
(751,333,'uploads/products/prod_69ca302ee8489_0.jpg',1),
(752,333,'uploads/products/prod_69ca302eea13d_1.jpg',0),
(753,333,'uploads/products/prod_69ca302eea56e_2.jpg',0),
(754,333,'uploads/products/var_69ca302eec30a_0.jpg',0),
(755,334,'uploads/products/prod_69ca3f3750da2_0.jpg',1),
(756,334,'uploads/products/prod_69ca3f37519ab_1.jpg',0),
(762,334,'uploads/products/prod_upd_69cace1de8b34_0.jpg',0),
(763,335,'uploads/products/prod_69cace9837382_0.jpg',1),
(768,335,'uploads/products/prod_upd_69caceb04a51e_0.jpg',0),
(769,335,'uploads/products/prod_upd_69cacfb944220_0.jpg',0),
(770,335,'uploads/products/prod_upd_69cacfd27fe23_0.jpg',0);
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `seller_id` int NOT NULL,
  `category_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `price` decimal(10,2) NOT NULL,
  `discount_price` decimal(10,2) DEFAULT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `status` enum('active','pending','rejected') COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `variants` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `seller_id` (`seller_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `sellers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `products_chk_1` CHECK (json_valid(`variants`))
) ENGINE=InnoDB AUTO_INCREMENT=336 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES
(219,1,2,'Leather Wallet 1','Excellent premium Fashion product designed for durability and performance. Experience the highest quality with Leather Wallet 1.',183.84,NULL,28,'active',NULL,'2026-03-25 18:55:39'),
(220,1,2,'Silk Scarf 2','Excellent premium Fashion product designed for durability and performance. Experience the highest quality with Silk Scarf 2.',404.77,NULL,83,'active',NULL,'2026-03-25 18:55:39'),
(221,1,2,'Winter Scarf 3','Excellent premium Fashion product designed for durability and performance. Experience the highest quality with Winter Scarf 3.',203.05,NULL,131,'active',NULL,'2026-03-25 18:55:39'),
(222,1,2,'Denim Jacket 4','Excellent premium Fashion product designed for durability and performance. Experience the highest quality with Denim Jacket 4.',436.77,NULL,13,'active',NULL,'2026-03-25 18:55:39'),
(223,1,2,'Sunglasses Pro 5','Excellent premium Fashion product designed for durability and performance. Experience the highest quality with Sunglasses Pro 5.',337.41,NULL,123,'active',NULL,'2026-03-25 18:55:39'),
(224,1,2,'Sunglasses Pro 6','Excellent premium Fashion product designed for durability and performance. Experience the highest quality with Sunglasses Pro 6.',279.59,NULL,49,'active',NULL,'2026-03-25 18:55:39'),
(225,1,2,'Silk Scarf 7','Excellent premium Fashion product designed for durability and performance. Experience the highest quality with Silk Scarf 7.',28.37,NULL,81,'active',NULL,'2026-03-25 18:55:39'),
(226,1,2,'Leather Wallet 8','Excellent premium Fashion product designed for durability and performance. Experience the highest quality with Leather Wallet 8.',31.42,NULL,21,'active',NULL,'2026-03-25 18:55:39'),
(227,1,2,'Designer Handbag 9','Excellent premium Fashion product designed for durability and performance. Experience the highest quality with Designer Handbag 9.',193.76,NULL,84,'active',NULL,'2026-03-25 18:55:39'),
(228,1,2,'Denim Jacket 10','Excellent premium Fashion product designed for durability and performance. Experience the highest quality with Denim Jacket 10.',129.33,NULL,79,'active',NULL,'2026-03-25 18:55:39'),
(229,1,3,'Garden Hose 1','Excellent premium Home & Garden product designed for durability and performance. Experience the highest quality with Garden Hose 1.',245.86,NULL,52,'active',NULL,'2026-03-25 18:55:39'),
(230,1,3,'Solar Light 2','Excellent premium Home & Garden product designed for durability and performance. Experience the highest quality with Solar Light 2.',332.65,NULL,150,'active',NULL,'2026-03-25 18:55:39'),
(231,1,3,'Watering Can 3','Excellent premium Home & Garden product designed for durability and performance. Experience the highest quality with Watering Can 3.',273.40,NULL,49,'active',NULL,'2026-03-25 18:55:39'),
(232,1,3,'Bird Feeder 4','Excellent premium Home & Garden product designed for durability and performance. Experience the highest quality with Bird Feeder 4.',340.41,NULL,75,'active',NULL,'2026-03-25 18:55:39'),
(233,1,3,'Fertilizer 5','Excellent premium Home & Garden product designed for durability and performance. Experience the highest quality with Fertilizer 5.',224.16,NULL,35,'active',NULL,'2026-03-25 18:55:39'),
(234,1,3,'Garden Shovel 6','Excellent premium Home & Garden product designed for durability and performance. Experience the highest quality with Garden Shovel 6.',86.10,NULL,103,'active',NULL,'2026-03-25 18:55:39'),
(235,1,3,'Watering Can 7','Excellent premium Home & Garden product designed for durability and performance. Experience the highest quality with Watering Can 7.',279.33,NULL,73,'active',NULL,'2026-03-25 18:55:39'),
(236,1,3,'Garden Shovel 8','Excellent premium Home & Garden product designed for durability and performance. Experience the highest quality with Garden Shovel 8.',255.16,NULL,134,'active',NULL,'2026-03-25 18:55:39'),
(237,1,3,'Lawn Mower 9','Excellent premium Home & Garden product designed for durability and performance. Experience the highest quality with Lawn Mower 9.',274.43,NULL,79,'active',NULL,'2026-03-25 18:55:39'),
(238,1,3,'Watering Can 10','Excellent premium Home & Garden product designed for durability and performance. Experience the highest quality with Watering Can 10.',77.82,NULL,139,'active',NULL,'2026-03-25 18:55:40'),
(239,1,4,'Perfume 1','Excellent premium Beauty product designed for durability and performance. Experience the highest quality with Perfume 1.',73.74,NULL,129,'active',NULL,'2026-03-25 18:55:40'),
(240,1,4,'Eye Liner 2','Excellent premium Beauty product designed for durability and performance. Experience the highest quality with Eye Liner 2.',296.77,NULL,23,'active',NULL,'2026-03-25 18:55:40'),
(241,1,4,'Shampoo 3','Excellent premium Beauty product designed for durability and performance. Experience the highest quality with Shampoo 3.',199.51,NULL,49,'active',NULL,'2026-03-25 18:55:40'),
(242,1,4,'Perfume 4','Excellent premium Beauty product designed for durability and performance. Experience the highest quality with Perfume 4.',104.33,NULL,133,'active',NULL,'2026-03-25 18:55:40'),
(243,1,4,'Perfume 5','Excellent premium Beauty product designed for durability and performance. Experience the highest quality with Perfume 5.',332.37,NULL,99,'active',NULL,'2026-03-25 18:55:40'),
(244,1,4,'Sunscreen 6','Excellent premium Beauty product designed for durability and performance. Experience the highest quality with Sunscreen 6.',51.53,NULL,96,'active',NULL,'2026-03-25 18:55:40'),
(245,1,4,'Sunscreen 7','Excellent premium Beauty product designed for durability and performance. Experience the highest quality with Sunscreen 7.',234.62,NULL,116,'active',NULL,'2026-03-25 18:55:40'),
(246,1,4,'Perfume 8','Excellent premium Beauty product designed for durability and performance. Experience the highest quality with Perfume 8.',156.54,NULL,31,'active',NULL,'2026-03-25 18:55:40'),
(247,1,4,'Sunscreen 9','Excellent premium Beauty product designed for durability and performance. Experience the highest quality with Sunscreen 9.',397.75,NULL,112,'active',NULL,'2026-03-25 18:55:40'),
(248,1,4,'Sunscreen 10','Excellent premium Beauty product designed for durability and performance. Experience the highest quality with Sunscreen 10.',115.25,NULL,37,'active',NULL,'2026-03-25 18:55:40'),
(249,1,5,'Cycling Helmet 1','Excellent premium Sports product designed for durability and performance. Experience the highest quality with Cycling Helmet 1.',445.41,NULL,127,'active',NULL,'2026-03-25 18:55:40'),
(250,1,5,'Tennis Racket 2','Excellent premium Sports product designed for durability and performance. Experience the highest quality with Tennis Racket 2.',359.11,NULL,6,'active',NULL,'2026-03-25 18:55:40'),
(251,1,5,'Dumbbell 3','Excellent premium Sports product designed for durability and performance. Experience the highest quality with Dumbbell 3.',50.50,NULL,50,'active',NULL,'2026-03-25 18:55:40'),
(252,1,5,'Dumbbell 4','Excellent premium Sports product designed for durability and performance. Experience the highest quality with Dumbbell 4.',50.80,NULL,84,'active',NULL,'2026-03-25 18:55:40'),
(253,1,5,'Football 5','Excellent premium Sports product designed for durability and performance. Experience the highest quality with Football 5.',199.18,NULL,39,'active',NULL,'2026-03-25 18:55:40'),
(254,1,5,'Backpack 6','Excellent premium Sports product designed for durability and performance. Experience the highest quality with Backpack 6.',261.05,NULL,59,'active',NULL,'2026-03-25 18:55:40'),
(255,1,5,'Jump Rope 7','Excellent premium Sports product designed for durability and performance. Experience the highest quality with Jump Rope 7.',97.29,NULL,41,'active',NULL,'2026-03-25 18:55:40'),
(256,1,5,'Backpack 8','Excellent premium Sports product designed for durability and performance. Experience the highest quality with Backpack 8.',242.96,NULL,19,'active',NULL,'2026-03-25 18:55:40'),
(257,1,5,'Yoga Mat 9','Excellent premium Sports product designed for durability and performance. Experience the highest quality with Yoga Mat 9.',206.37,NULL,12,'active',NULL,'2026-03-25 18:55:40'),
(258,1,5,'Boxing Gloves 10','Excellent premium Sports product designed for durability and performance. Experience the highest quality with Boxing Gloves 10.',304.62,NULL,150,'active',NULL,'2026-03-25 18:55:40'),
(290,1,1,'Keyboard','Excellent premium Electronics product designed for durability and performance. Experience the highest quality with Keyboard 9.',425.99,3.00,123,'active',NULL,'2026-03-28 08:42:27'),
(292,1,1,'Keyboard hcyf','Excellent premium Electronics product designed for durability and performance. Experience the highest quality with Keyboard 9.',425.99,3.00,123,'active',NULL,'2026-03-28 08:44:25'),
(293,1,1,'Keyboard gjgj','Excellent premium Electronics product designed for durability and performance. Experience the highest quality with Keyboard 9.',425.99,3.00,123,'active',NULL,'2026-03-28 08:44:44'),
(296,1,4,'drmo','gsydg',58.00,2.00,20,'active',NULL,'2026-03-28 08:48:02'),
(297,1,2,'Winter Scarf 3','Excellent premium Fashion product designed for durability and performance. Experience the highest quality with Winter Scarf 3.',203.05,0.00,131,'active',NULL,'2026-03-28 08:48:25'),
(298,1,2,'Winter Scarf 3','Excellent premium Fashion product designed for durability and performance. Experience the highest quality with Winter Scarf 3.',203.05,0.00,131,'active',NULL,'2026-03-28 08:48:39'),
(303,1,1,'ifug','itfu',68.00,NULL,3556,'active',NULL,'2026-03-28 08:51:26'),
(320,1,2,'jffu','fu',8968.00,6868.00,65,'active',NULL,'2026-03-28 09:19:17'),
(323,1,1,'Keyboard .','Excellent premium Electronics product designed for durability and performance. Experience the highest quality with Keyboard 9.',425.99,3.00,123,'active',NULL,'2026-03-28 09:37:33'),
(325,1,1,'ggg','Excellent premium Electronics product designed for durability and performance. Experience the highest quality with Keyboard 9.',425.99,3.00,123,'active',NULL,'2026-03-29 08:43:48'),
(327,3,4,'demo','hdhxch',25.00,0.00,4,'active',NULL,'2026-03-29 08:59:58'),
(330,3,4,'ngfnbfbfrb','vddhbrgd',25.00,0.00,25,'active',NULL,'2026-03-29 09:27:37'),
(331,3,1,'c xbbc','fawfve',88.00,0.00,25,'active',NULL,'2026-03-29 09:28:38'),
(332,1,2,'charger','hdhdhdjd',100.00,0.00,5,'active',NULL,'2026-03-30 07:49:24'),
(333,1,4,'yffyyf','hxtxtx',866868.00,0.00,8006,'active','[{\"name\":\"White\",\"has_image\":true}]','2026-03-30 08:11:26'),
(334,1,1,'image trial','shdjd',10.00,0.00,25,'active','[{\"name\":\"White\",\"has_image\":false}]','2026-03-30 09:15:35'),
(335,1,1,'wwwww','dtyf',20.00,0.00,28,'active','[{\"name\":\"White\",\"has_image\":false}]','2026-03-30 19:27:20');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `rating` int NOT NULL,
  `comment` text COLLATE utf8mb4_general_ci,
  `seller_reply` text COLLATE utf8mb4_general_ci,
  `seller_reply_at` timestamp NULL DEFAULT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `image_url` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `reply` text COLLATE utf8mb4_general_ci,
  `replied_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_chk_1` CHECK ((`rating` between 1 and 5)),
  CONSTRAINT `reviews_chk_2` CHECK (json_valid(`images`))
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES
(45,2,223,5,'Excellent product, exceeded my expectations!',NULL,NULL,NULL,'pending','2026-03-21 05:39:39',NULL,NULL,NULL),
(48,7,331,5,'dsajkdsan.dasd',NULL,NULL,NULL,'pending','2026-03-31 14:12:11',NULL,NULL,NULL),
(49,7,244,5,'gwgey',NULL,NULL,NULL,'pending','2026-03-31 20:22:37',NULL,'thanks','2026-04-08 07:55:28'),
(50,7,334,5,'very good product ',NULL,NULL,NULL,'pending','2026-04-08 07:01:50','uploads/reviews/rev_69d5fd5e0a4c2.jpg','nfbf','2026-04-08 07:14:02'),
(51,20,335,5,'jdsadljsa',NULL,NULL,NULL,'pending','2026-08-10 07:05:05',NULL,NULL,NULL),
(52,7,334,4,'very nice pro product',NULL,NULL,NULL,'pending','2026-08-10 07:17:13',NULL,NULL,NULL),
(53,7,331,5,'n',NULL,NULL,NULL,'pending','2026-08-10 07:19:23',NULL,NULL,NULL);
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sellers`
--

DROP TABLE IF EXISTS `sellers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sellers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `shop_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `shop_logo` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `shop_description` text COLLATE utf8mb4_general_ci,
  `verification_status` enum('pending','approved','rejected') COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `performance_score` decimal(3,2) DEFAULT '0.00',
  `commission_rate` decimal(5,2) DEFAULT '10.00',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `sellers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sellers`
--

LOCK TABLES `sellers` WRITE;
/*!40000 ALTER TABLE `sellers` DISABLE KEYS */;
INSERT INTO `sellers` VALUES
(1,3,'Tech Gadgets Store',NULL,'Best gadgets in the city','approved',0.00,10.00),
(2,3,'Tech Gadgets Store',NULL,'Best gadgets in the city','approved',0.00,10.00),
(3,14,'yffufh',NULL,NULL,'pending',0.00,10.00);
/*!40000 ALTER TABLE `sellers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `support_tickets`
--

DROP TABLE IF EXISTS `support_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `support_tickets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `status` enum('open','closed','pending') COLLATE utf8mb4_general_ci DEFAULT 'open',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `support_tickets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `support_tickets`
--

LOCK TABLES `support_tickets` WRITE;
/*!40000 ALTER TABLE `support_tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `support_tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_addresses`
--

DROP TABLE IF EXISTS `user_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_addresses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `street` text COLLATE utf8mb4_general_ci NOT NULL,
  `city` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `state` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `zip_code` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_addresses`
--

LOCK TABLES `user_addresses` WRITE;
/*!40000 ALTER TABLE `user_addresses` DISABLE KEYS */;
INSERT INTO `user_addresses` VALUES
(1,7,'fuy','6565','7r6r','hdfy','hxch','586886',0,'2026-03-22 22:35:56'),
(2,7,'yer6d6','355352','63r66r','5ed5d5','ydfy','9005',0,'2026-03-22 22:36:11'),
(3,13,'dudjjd','86868','xhdhfh','dudud','dudjfu','868686',0,'2026-03-25 18:36:18'),
(4,7,'test','068865588','st no 3','sahiwal','sahiwal','57000',0,'2026-04-28 07:13:06'),
(5,17,'dbdndj','5656868','dhdhdhd','dhdhdhd','dhdjdhd','8986565',0,'2026-04-29 07:19:16'),
(6,11,'test','02389012','st no 2','sahiwal','21','5700',0,'2026-06-24 12:08:02');
/*!40000 ALTER TABLE `user_addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_cards`
--

DROP TABLE IF EXISTS `user_cards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_cards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `cardholder_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `card_number` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `expiry_date` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `cvv` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_cards_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_cards`
--

LOCK TABLES `user_cards` WRITE;
/*!40000 ALTER TABLE `user_cards` DISABLE KEYS */;
INSERT INTO `user_cards` VALUES
(7,13,'geeggrgr','9895955959595959','87/58','599',1,'2026-03-25 18:30:07');
/*!40000 ALTER TABLE `user_cards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `profile_pic` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `role` enum('user','seller','admin') COLLATE utf8mb4_general_ci DEFAULT 'user',
  `status` enum('active','blocked') COLLATE utf8mb4_general_ci DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `profile_image` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `provider` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `fcm_token` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'John Doe','john@example.com','1234567890','$2y$10$RaOnCgoQNH.B/RKRFp2INeOU.I7kXqFlCvzM.q9H5V9wXnbKYrYnS',NULL,'user','active','2026-03-05 20:42:56',NULL,NULL,NULL),
(2,'Admin User','admin@example.com','0987654321','$2y$10$RaOnCgoQNH.B/RKRFp2INeOU.I7kXqFlCvzM.q9H5V9wXnbKYrYnS',NULL,'admin','active','2026-03-05 20:42:56',NULL,NULL,NULL),
(3,'Seller One','seller@example.com','1122334455','$2y$10$ERSFEg82GwDBJ00/kpIH6eCKC.ItI8j3GT1qqccvrjoni.TKobsWi',NULL,'seller','active','2026-03-05 20:42:56',NULL,NULL,'eKwgAiZWQSyoD-titpUjoq:APA91bFT3SxVQjLJSufaCwa-J7UETju9BPb3I8-_BBr7T7k0Quj7oViYTrd_HxWd9Kt05knkBelAzk0hV0H6BR71azF1kxG0hFnvxD2hmSpEdJj_uZqWT1E'),
(7,'hello','hello@gmail.com ',NULL,'$2y$10$ERSFEg82GwDBJ00/kpIH6eCKC.ItI8j3GT1qqccvrjoni.TKobsWi',NULL,'user','active','2026-03-05 20:50:19','uploads/profiles/profile_7_1774299512.jpg',NULL,'eg5wQdGVQK-YV8FGDeGfgJ:APA91bEpfrFDsicHu3TFd74tOE9Ofcw89QiHSJHO54_4zTE5mqOYBvHSGu7AncB8FSxgkXMZ9iRGcb0vklU2IH5PGEd5me3HMmeLVVrLjLhFB6NPq7y4f8Y'),
(8,'Sarah Jenkins','sarah@example.com',NULL,'password',NULL,'user','active','2026-03-22 23:45:06',NULL,NULL,NULL),
(9,'Michael Rodriguez','michael@example.com',NULL,'password',NULL,'user','active','2026-03-22 23:45:06',NULL,NULL,NULL),
(11,'Ahmad Ahmad','ahmadyaseen321321@gmail.com',NULL,'$2y$10$ERSFEg82GwDBJ00/kpIH6eCKC.ItI8j3GT1qqccvrjoni.TKobsWi',NULL,'user','active','2026-03-25 18:08:35',NULL,NULL,'cRGn0FP8QDu9ro2KP6r2_w:APA91bHYu962TxUZQEHKMMfJYa_Rwtf9J-N85U8qNDPMDXuKtxqsqTe0YLtvFdCnM0Ie-yaZ8zNIgezqR64v0xMHU1gSqDu9fTIhXz-JIt_kr9sGAvlTw-I'),
(13,'Demo Account','demo24455@gmail.com',NULL,'$2y$10$ZVIbWovtEJTEJTe6mb5wluRHdaT3PDHbgZzQusDyXOSHmuNcILg86',NULL,'user','active','2026-03-25 18:20:14',NULL,'google',NULL),
(14,'demo','demo@gmail.com ',NULL,'$2y$10$XKqcYLPN7RlnkHtB30n34O7gH0qy2x0LgkA9lz6KucNWqLINT6p7K',NULL,'seller','active','2026-03-29 08:59:23',NULL,NULL,'fUxgSmbIQr6_8DAy_eIiuL:APA91bFRLfccDfLyZjMwHJnNjsSR-WHFZcAOUmVrf0xTmn-87pqBWFwvaOB8vD93KFJ5VX-Icvbbve5U3KVdhp23f9gbLHzb3utlB3k-SuD55JYN5PNPFIA'),
(15,'Pakistani Racing','ahmadyaseen327327@gmail.com',NULL,'$2y$10$KiLq/CGNMwtUIZK3zmxJ7OGgwPYLtxdPpViuNqkO7hT6d.MnZHr/W',NULL,'seller','active','2026-03-29 21:18:53',NULL,'google','c-CbuCNwRpSXkjAhE8ZPo3:APA91bGDUJKbUfoWBgG5TZuEpQE5Jhj_3eRHzhaZTLzmGQR5Sz3ueXP-UW-29UaE_lvKmpkMb6suJojMZAgXUVw1O9ICohTXVc5kefrYb59FyF1UPm73ApM'),
(16,'yes','yes@gmail.com',NULL,'$2y$10$eH3hTYs1/BYzZuu4qyAd3OzFej3lx0kLt7l41/MV909.ifLPKX29.',NULL,'user','active','2026-04-08 08:14:42',NULL,NULL,'d2OC0HNjT9--FMa27xdgPI:APA91bGy45JVCBgSaS7nJEzojbofejtadNH1EqIIScMHXLowSlzWRxGp1mRgIIoXKCGfoGVgjZMF1kdEmwKwuEMMcN9AS2d6LXarUN-Fh6WL6VheOuCZt_w'),
(17,'Muhammad Ahmad','ahmadyaseen329329@gmail.com',NULL,'$2y$10$gA29mlAcGQiysHdQa8L2jOeKKgrFzkMRJIONkePgITGcJkJCl97v2',NULL,'user','active','2026-04-24 07:36:48',NULL,'google','cCaa0fsES5-mqsaB-vAKnD:APA91bFeNwmBlPzvfqiK7tp5cCCzRtNsVk0aC8ADS6FlnejPhNZP-FYpOsRjB6GbYVGU4-ckeubJuat-aOD68bLCj4eEGkBnYzzucAFa47O98YpjRWNTBQY'),
(18,'test test','test@gmail.com',NULL,'$2y$10$j00oAwnzF.sRig02X2NeuOviK.BF0ix3KQcCIU9kx.99fXbp1Hmz2',NULL,'user','active','2026-08-10 06:24:03',NULL,NULL,NULL),
(19,'test test','dsa@gmail.com',NULL,'$2y$10$aaOY5zTTHUDj3EATtfx1yObra7yBlRoGKkuL6KjGorjNpHjC3sGOm',NULL,'user','active','2026-08-10 06:24:10',NULL,NULL,NULL),
(20,'zxc zxc','zxc@gmail.com',NULL,'$2y$10$tskWN0DkY57TN7/MsHg1fe8LGoWv1JJ4ZeLUSAPmnGyo5ucotGpIC',NULL,'user','active','2026-08-10 06:26:24',NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wishlist`
--

DROP TABLE IF EXISTS `wishlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `wishlist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `wishlist_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wishlist_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlist`
--

LOCK TABLES `wishlist` WRITE;
/*!40000 ALTER TABLE `wishlist` DISABLE KEYS */;
INSERT INTO `wishlist` VALUES
(14,16,335),
(16,7,335),
(17,17,335),
(19,11,335),
(20,20,335);
/*!40000 ALTER TABLE `wishlist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'sansuiel_ecom_db'
--

--
-- Dumping routines for database 'sansuiel_ecom_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-22  8:23:16
