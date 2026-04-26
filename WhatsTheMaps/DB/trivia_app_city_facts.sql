-- MySQL dump 10.13  Distrib 8.0.45, for macos15 (arm64)
--
-- Host: 127.0.0.1    Database: trivia_app
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

--
-- Table structure for table `city_facts`
--

DROP TABLE IF EXISTS `city_facts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `city_facts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `city_id` int NOT NULL,
  `fact_type_id` int NOT NULL,
  `value_number` decimal(15,2) DEFAULT NULL,
  `value_text` text,
  `value_boolean` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `city_id` (`city_id`),
  KEY `fact_type_id` (`fact_type_id`),
  CONSTRAINT `city_facts_ibfk_1` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`),
  CONSTRAINT `city_facts_ibfk_2` FOREIGN KEY (`fact_type_id`) REFERENCES `fact_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `city_facts`
--

LOCK TABLES `city_facts` WRITE;
/*!40000 ALTER TABLE `city_facts` DISABLE KEYS */;
INSERT INTO `city_facts` VALUES (1,1,1,1839.00,NULL,NULL),(2,1,4,267.00,NULL,NULL),(3,1,3,993500.00,NULL,NULL),(4,1,2,185.00,NULL,NULL),(5,2,1,1718.00,NULL,NULL),(6,2,4,229.00,NULL,NULL),(7,2,3,1526700.00,NULL,NULL),(8,2,2,220.00,NULL,NULL),(9,3,1,1837.00,NULL,NULL),(10,3,4,305.00,NULL,NULL),(11,3,3,2314000.00,NULL,NULL),(12,3,2,32.00,NULL,NULL),(13,4,1,1856.00,NULL,NULL),(14,4,4,281.00,NULL,NULL),(15,4,3,1326000.00,NULL,NULL),(16,4,2,147.00,NULL,NULL),(17,5,1,1852.00,NULL,NULL),(18,5,4,125.00,NULL,NULL),(19,5,3,316000.00,NULL,NULL),(20,5,2,2.00,NULL,NULL),(21,6,1,1852.00,NULL,NULL),(22,6,4,95.00,NULL,NULL),(23,6,3,679000.00,NULL,NULL),(24,6,2,1185.00,NULL,NULL),(25,7,1,1887.00,NULL,NULL),(26,7,4,114.00,NULL,NULL),(27,7,3,204000.00,NULL,NULL),(28,7,2,1116.00,NULL,NULL),(29,8,1,1909.00,NULL,NULL),(30,8,4,84.00,NULL,NULL),(31,8,3,272000.00,NULL,NULL),(32,8,2,976.00,NULL,NULL),(33,9,1,1845.00,NULL,NULL),(34,9,4,20.00,NULL,NULL),(35,9,3,24000.00,NULL,NULL),(36,9,2,180.00,NULL,NULL),(37,10,1,1904.00,NULL,NULL),(38,10,3,72000.00,NULL,NULL),(39,10,2,12.00,NULL,NULL),(40,1,5,NULL,'Sixth and Guadalupe',NULL),(41,1,6,NULL,'Mexico',NULL),(42,1,7,NULL,'The Live Music Capital of the World',NULL),(43,2,5,NULL,'Tower of the Americas',NULL),(44,2,6,NULL,'Mexico',NULL),(45,2,7,NULL,'Alamo City',NULL),(46,3,5,NULL,'JPMorgan Chase Tower',NULL),(47,3,6,NULL,'Louisiana',NULL),(48,3,7,NULL,'Space City',NULL),(49,4,5,NULL,'Bank of America Plaza',NULL),(50,4,6,NULL,'Oklahoma',NULL),(51,4,7,NULL,'The Big D',NULL),(52,5,5,NULL,'One Shoreline Plaza South Tower',NULL),(53,5,6,NULL,'Mexico',NULL),(54,5,7,NULL,'Sparkling City by the Sea',NULL),(55,6,5,NULL,'WestStar Tower',NULL),(56,6,6,NULL,'New Mexico',NULL),(57,6,7,NULL,'The Sun City',NULL),(58,7,5,NULL,'FirstBank Southwest Tower',NULL),(59,7,6,NULL,'New Mexico',NULL),(60,7,7,NULL,'The Yellow Rose of Texas',NULL),(61,8,5,NULL,'Metro Tower',NULL),(62,8,6,NULL,'New Mexico',NULL),(63,8,7,NULL,'Hub City',NULL),(64,9,5,NULL,'Eiffel Tower Replica',NULL),(65,9,6,NULL,'Oklahoma',NULL),(66,9,7,NULL,'Crape Myrtle City',NULL),(67,10,5,NULL,'Baxter Building',NULL),(68,10,6,NULL,'Mexico',NULL),(69,10,7,NULL,'Six Shooter Junction',NULL);
/*!40000 ALTER TABLE `city_facts` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-26 13:57:53
