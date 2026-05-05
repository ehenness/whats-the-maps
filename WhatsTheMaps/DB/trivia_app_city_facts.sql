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
INSERT INTO `city_facts`(`city_id`,`fact_type_id`,`value_number`,`value_text`,`value_boolean`) VALUES 
      -- FLORIDA CITIES ADDED
      -- ORLANDO - city_id = 11
      (11, 1, 1856.00, NULL, NULL),   -- founding year
      (11, 2, 27.00,   NULL, NULL),   -- elevation (m)
      (11, 3, 335000.00, NULL, NULL), -- population
      (11, 4, 134.00,  NULL, NULL),   -- tallest structure height(m)
      (11, 5, NULL, '200 South Orange', NULL),  -- tallest structure name
      (11, 6, NULL, 'Georgia', NULL),          -- nearest border
      (11, 7, NULL, 'The City Beautiful', NULL), -- nickname
      -- MIAMI - city_id = 12
      (12, 1, 1896.00, NULL, NULL),   -- founding year
      (12, 2, 2.00,   NULL, NULL),   -- elevation (m)
      (12, 3, 485000.00, NULL, NULL), -- population
      (12, 4, 265.00,  NULL, NULL),   -- tallest structure height(m)
      (12, 5, NULL, 'Panorama Tower', NULL),  -- tallest structure name
      (12, 6, NULL, 'Georgia', NULL),          -- nearest border
      (12, 7, NULL, 'The Magic City', NULL), -- nickname
      -- TAMPA - city_id = 13
      (13, 1, 1849.00, NULL, NULL),   -- founding year
      (13, 2, 11.00,   NULL, NULL),   -- elevation (m)
      (13, 3, 400000.00, NULL, NULL), -- population
      (13, 4, 176.50,  NULL, NULL),   -- tallest structure height(m)
      (13, 5, NULL, '100 North Tampa', NULL),  -- tallest structure name
      (13, 6, NULL, 'Georgia', NULL),          -- nearest border
      (13, 7, NULL, 'The Cigar City', NULL), -- nickname
      -- JACKSONVILLE - city_id = 14
      (14, 1, 1822.00, NULL, NULL),   -- founding year
      (14, 2, 5.00,   NULL, NULL),   -- elevation (m)
      (14, 3, 950000.00, NULL, NULL), -- population
      (14, 4, 188.00,  NULL, NULL),   -- tallest structure height(m)
      (14, 5, NULL, 'Bank of America Tower', NULL),  -- tallest structure name
      (14, 6, NULL, 'Georgia', NULL),          -- nearest border
      (14, 7, NULL, 'The River City', NULL), -- nickname
      -- ST PETERSBURG - city_id = 15
      (15, 1, 1888.00, NULL, NULL),   -- founding year
      (15, 2, 13.40,   NULL, NULL),   -- elevation (m)
      (15, 3, 260000.00, NULL, NULL), -- population
      (15, 4, 157.00,  NULL, NULL),   -- tallest structure height(m)
      (15, 5, NULL, '400 Central', NULL),  -- tallest structure name
      (15, 6, NULL, 'Georgia', NULL),          -- nearest border
      (15, 7, NULL, 'The Sunshine City', NULL), -- nickname
      -- CALIFORNIA CIITES ADDED
      -- LOS ANGELES - city_id = 16
      (16, 1, 1781.00, NULL, NULL),   -- founding year
      (16, 2, 87.00,   NULL, NULL),   -- elevation (m)
      (16, 3, 3857000.00, NULL, NULL), -- population
      (16, 4, 335.00,  NULL, NULL),   -- tallest structure height(m)
      (16, 5, NULL, 'Wilshire Grand Center', NULL),  -- tallest structure name
      (16, 6, NULL, 'Mexico', NULL),          -- nearest border
      (16, 7, NULL, 'City of Angels', NULL), -- nickname
      -- SAN FRANCISCO - city_id = 17
      (17, 1, 1776.00, NULL, NULL),   -- founding year
      (17, 2, 16.00,   NULL, NULL),   -- elevation (m)
      (17, 3, 830000.00, NULL, NULL), -- population
      (17, 4, 326.00,  NULL, NULL),   -- tallest structure height(m)
      (17, 5, NULL, 'Salesforce', NULL),  -- tallest structure name
      (17, 6, NULL, 'Mexico', NULL),          -- nearest border
      (17, 7, NULL, 'The City by the Bay', NULL), -- nickname
      -- SAN DIEGO - city_id = 18
      (18, 1, 1769.00, NULL, NULL),   -- founding year
      (18, 2, 19.00,   NULL, NULL),   -- elevation (m)
      (18, 3, 1390000.00, NULL, NULL), -- population
      (18, 4, 152.40,  NULL, NULL),   -- tallest structure height(m)
      (18, 5, NULL, 'One America Plaza', NULL),  -- tallest structure name
      (18, 6, NULL, 'Mexico', NULL),          -- nearest border
      (18, 7, NULL, 'America\'s Finest City', NULL), -- nickname
      -- SACRAMENTO - city_id = 19
      (19, 1, 1848.00, NULL, NULL),   -- founding year
      (19, 2, 9.00,   NULL, NULL),   -- elevation (m)
      (19, 3, 529000.00, NULL, NULL), -- population
      (19, 4, 129.00,  NULL, NULL),   -- tallest structure height(m)
      (19, 5, NULL, 'Wells Fargo Center', NULL),  -- tallest structure name
      (19, 6, NULL, 'Nevada', NULL),          -- nearest border
      (19, 7, NULL, 'City of Trees', NULL), -- nickname
      -- SAN JOSE - city_id = 20
      (20, 1, 1777.00, NULL, NULL),   -- founding year
      (20, 2, 25.00,   NULL, NULL),   -- elevation (m)
      (20, 3, 990000.00, NULL, NULL), -- population
      (20, 4, 91.50,  NULL, NULL),   -- tallest structure height(m)
      (20, 5, NULL, '200 Park Avenue', NULL),  -- tallest structure name
      (20, 6, NULL, 'Mexico', NULL),          -- nearest border
      (20, 7, NULL, 'Capital of Silicon Valley', NULL); -- nickname
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
