-- ==========================================================
-- GBP Application MySQL Database Dump for cPanel / phpMyAdmin
-- Database: coachtim_lara757
-- Generated: 2026-11-02 08:52:15
-- ==========================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';

-- ----------------------------------------------------------
-- Table structure for `users`
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, `name` VARCHAR(255) not null, `email` VARCHAR(255) not null, `email_verified_at` datetime, `password` VARCHAR(255) not null, `remember_token` VARCHAR(255), `created_at` datetime, `updated_at` datetime, `role` VARCHAR(255) not null default 'member', `status` VARCHAR(255) not null default 'active', `last_login_at` datetime, `phone` VARCHAR(255), `assigned_wing` VARCHAR(255)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table structure for `chat_widgets`
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `chat_widgets`;
CREATE TABLE `chat_widgets` (`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, `uuid` VARCHAR(255) not null, `name` VARCHAR(255) not null default 'Main Website Widget', `brand_color` VARCHAR(255) not null default '#4f46e5', `title` VARCHAR(255) not null default 'Customer Support', `subtitle` VARCHAR(255) not null default 'We typically reply in under 5 minutes', `bot_name` VARCHAR(255) not null default 'Support AI Assistant', `avatar_url` VARCHAR(255), `launcher_icon` VARCHAR(255) not null default 'chat', `position` VARCHAR(255) not null default 'bottom-right', `pre_chat_form_enabled` tinyint(1) not null default '0', `pre_chat_fields` text, `sound_enabled` tinyint(1) not null default '1', `offline_mode_enabled` tinyint(1) not null default '1', `offline_message` text, `business_hours` text, `is_active` tinyint(1) not null default '1', `created_at` datetime, `updated_at` datetime) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table structure for `chat_conversations`
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `chat_conversations`;
CREATE TABLE `chat_conversations` (`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, `uuid` VARCHAR(255) not null, `widget_id` BIGINT UNSIGNED not null, `visitor_token` VARCHAR(255) not null, `visitor_name` VARCHAR(255), `visitor_email` VARCHAR(255), `visitor_phone` VARCHAR(255), `visitor_ip` VARCHAR(255), `visitor_city` VARCHAR(255), `visitor_page_url` text, `visitor_referrer` text, `visitor_user_agent` text, `assigned_to_user_id` BIGINT UNSIGNED, `status` VARCHAR(255) not null default 'bot', `priority` VARCHAR(255) not null default 'normal', `current_flow_node_id` VARCHAR(255), `collected_data` text, `csat_rating` BIGINT, `csat_feedback` text, `last_message_at` datetime, `resolved_at` datetime, `created_at` datetime, `updated_at` datetime, foreign key(`widget_id`) references `chat_widgets`(`id`) on delete cascade, foreign key(`assigned_to_user_id`) references `users`(`id`) on delete set null) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table structure for `review_reports`
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `review_reports`;
CREATE TABLE `review_reports` (`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, `report_date` date not null, `user_email` VARCHAR(255) not null default 'default', `total_profiles` BIGINT not null default '0', `total_reviews` BIGINT not null default '0', `total_today_new` BIGINT not null default '0', `total_pending` BIGINT not null default '0', `average_rating` numeric not null default '5', `overall_stats` text, `created_at` datetime, `updated_at` datetime) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `review_reports` (4 rows)
INSERT INTO `review_reports` (`id`, `report_date`, `user_email`, `total_profiles`, `total_reviews`, `total_today_new`, `total_pending`, `average_rating`, `overall_stats`, `created_at`, `updated_at`) VALUES ('1', '2026-11-02 00:00:00', 'live-refresh-user@example.com', '1', '503', '3', '3', '4.8', '{"totalProfiles":1,"totalReviews":503,"totalTodayNew":3,"totalPending":3,"averageRating":4.8}', '2026-11-02 08:51:42', '2026-11-02 08:51:42');
INSERT INTO `review_reports` (`id`, `report_date`, `user_email`, `total_profiles`, `total_reviews`, `total_today_new`, `total_pending`, `average_rating`, `overall_stats`, `created_at`, `updated_at`) VALUES ('2', '2026-11-02 00:00:00', 'midnight-rollover@example.com', '1', '620', '0', '1', '4.9', '{"totalProfiles":1,"totalReviews":620,"totalTodayNew":0,"totalPending":1,"averageRating":4.9}', '2026-11-02 08:51:42', '2026-11-02 08:51:42');
INSERT INTO `review_reports` (`id`, `report_date`, `user_email`, `total_profiles`, `total_reviews`, `total_today_new`, `total_pending`, `average_rating`, `overall_stats`, `created_at`, `updated_at`) VALUES ('3', '2026-11-02 00:00:00', 'self-healing@example.com', '1', '800', '5', '5', '4.6', '{"totalProfiles":1,"totalReviews":800,"totalTodayNew":5,"totalPending":5,"averageRating":4.6}', '2026-11-02 08:51:42', '2026-11-02 08:51:42');
INSERT INTO `review_reports` (`id`, `report_date`, `user_email`, `total_profiles`, `total_reviews`, `total_today_new`, `total_pending`, `average_rating`, `overall_stats`, `created_at`, `updated_at`) VALUES ('4', '2026-11-02 00:00:00', 'yesterday-report-rollover@example.com', '1', '423', '0', '0', '4.6', '{"totalProfiles":1,"totalReviews":423,"totalTodayNew":0,"totalPending":0,"averageRating":4.6}', '2026-11-02 08:51:42', '2026-11-02 08:51:42');

-- ----------------------------------------------------------
-- Table structure for `cache`
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `cache`;
CREATE TABLE `cache` (`key` VARCHAR(255) not null, `value` text not null, `expiration` BIGINT not null, primary key (`key`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table structure for `cache_locks`
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `cache_locks`;
CREATE TABLE `cache_locks` (`key` VARCHAR(255) not null, `owner` VARCHAR(255) not null, `expiration` BIGINT not null, primary key (`key`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table structure for `chat_canned_responses`
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `chat_canned_responses`;
CREATE TABLE `chat_canned_responses` (`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, `shortcut` VARCHAR(255) not null, `title` VARCHAR(255) not null, `content` text not null, `category` VARCHAR(255) not null default 'General', `created_by_user_id` BIGINT UNSIGNED, `created_at` datetime, `updated_at` datetime, foreign key(`created_by_user_id`) references `users`(`id`) on delete set null) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table structure for `chat_messages`
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE `chat_messages` (`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, `uuid` VARCHAR(255) not null, `conversation_id` BIGINT UNSIGNED not null, `sender_type` VARCHAR(255) not null, `sender_id` BIGINT UNSIGNED, `sender_name` VARCHAR(255) not null default 'Visitor', `message_type` VARCHAR(255) not null default 'text', `content` text, `metadata` text, `is_read` tinyint(1) not null default '0', `read_at` datetime, `created_at` datetime, `updated_at` datetime, foreign key(`conversation_id`) references `chat_conversations`(`id`) on delete cascade) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table structure for `chatbot_flows`
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `chatbot_flows`;
CREATE TABLE `chatbot_flows` (`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, `widget_id` BIGINT UNSIGNED not null, `name` VARCHAR(255) not null, `description` text, `trigger_type` VARCHAR(255) not null default 'chat_opened', `trigger_keywords` text, `canvas_data` text, `compiled_flow` text, `is_active` tinyint(1) not null default '1', `version` BIGINT not null default '1', `created_at` datetime, `updated_at` datetime, foreign key(`widget_id`) references `chat_widgets`(`id`) on delete cascade) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table structure for `facebook_pages`
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `facebook_pages`;
CREATE TABLE `facebook_pages` (`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, `user_id` BIGINT UNSIGNED UNSIGNED, `page_id` VARCHAR(255) not null, `name` VARCHAR(255) not null, `category` VARCHAR(255), `access_token` text not null, `avatar_url` text, `cover_url` text, `followers_count` BIGINT not null default '0', `likes_count` BIGINT not null default '0', `phone` VARCHAR(255), `email` VARCHAR(255), `website` text, `about` text, `hours_json` text, `auto_reply_enabled` tinyint(1) not null default '0', `auto_reply_rules` text, `is_active` tinyint(1) not null default '1', `metadata` text, `created_at` datetime, `updated_at` datetime, foreign key(`user_id`) references `users`(`id`) on delete set null) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table structure for `failed_jobs`
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `failed_jobs`;
CREATE TABLE `failed_jobs` (`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, `uuid` VARCHAR(255) not null, `connection` VARCHAR(255) not null, `queue` VARCHAR(255) not null, `payload` text not null, `exception` text not null, `failed_at` datetime not null default CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table structure for `gbp_system_data`
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `gbp_system_data`;
CREATE TABLE `gbp_system_data` (`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, `key` VARCHAR(255) not null, `value` text, `created_at` datetime, `updated_at` datetime) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `gbp_system_data` (20 rows)
INSERT INTO `gbp_system_data` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES ('1', 'gbp_reviews_73336676fae99dcb349dd46eff5095ad', '{"reviews":[{"reviewId":"rev-today-1","name":"accounts\/111\/locations\/loc-fresh\/reviews\/rev-today-1","reviewer":{"displayName":"Google User","profilePhotoUrl":null},"starRating":"FIVE","comment":"Best academy in Sikar!","createTime":"2026-11-02T08:51:42+00:00","updateTime":null,"reviewReply":null},{"reviewId":"rev-today-2","name":"accounts\/111\/locations\/loc-fresh\/reviews\/rev-today-2","reviewer":{"displayName":"Google User","profilePhotoUrl":null},"starRating":"FIVE","comment":"Great discipline and faculty","createTime":"2026-11-02T08:51:42+00:00","updateTime":null,"reviewReply":{"comment":"Thank you!","updateTime":"2026-11-02T08:51:42+00:00"}},{"reviewId":"rev-today-3","name":"accounts\/111\/locations\/loc-fresh\/reviews\/rev-today-3","reviewer":{"displayName":"Google User","profilePhotoUrl":null},"starRating":"FOUR","comment":"Good environment","createTime":"2026-11-02T08:51:42+00:00","updateTime":null,"reviewReply":null},{"reviewId":"rev-old-1","name":"accounts\/111\/locations\/loc-fresh\/reviews\/rev-old-1","reviewer":{"displayName":"Google User","profilePhotoUrl":null},"starRating":"FIVE","comment":"Joined last month","createTime":"2026-10-30T14:21:42+05:30","updateTime":null,"reviewReply":null}],"averageRating":4.8,"totalReviewCount":503,"savedAt":"2026-11-02T14:21:42+05:30"}', '2026-11-02 08:51:42', '2026-11-02 08:51:42');
INSERT INTO `gbp_system_data` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES ('2', 'gbp_daily_snap_73336676fae99dcb349dd46eff5095ad_2026-11-02', '{"total":503,"rating":4.8,"date":"2026-11-02","updated_at":"2026-11-02T14:21:42+05:30"}', '2026-11-02 08:51:42', '2026-11-02 08:51:42');
INSERT INTO `gbp_system_data` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES ('3', 'gbp_snap_latest_73336676fae99dcb349dd46eff5095ad', '{"total":503,"rating":4.8,"date":"2026-11-02","updated_at":"2026-11-02T14:21:42+05:30"}', '2026-11-02 08:51:42', '2026-11-02 08:51:42');
INSERT INTO `gbp_system_data` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES ('4', 'gbp_multi_report_2ac7962a234fb740439d07149ea41c1c', '{"success":true,"hasReport":true,"userEmail":"live-refresh-user@example.com","generatedAt":"2026-11-02T14:21:42+05:30","locations":[{"id":"accounts\/111\/locations\/loc-fresh","name":"accounts\/111\/locations\/loc-fresh","v4Name":"accounts\/111\/locations\/loc-fresh","title":"Apex Defence Academy","address":"Station Road, Sikar","storeCode":"APEX01","totalReviews":503,"beforeTodayReviews":500,"todayNewReviews":3,"difference":3,"averageRating":4.8,"repliedCount":1,"pendingCount":3,"reviewLink":"https:\/\/search.google.com\/local\/writereview","assignedStaff":["Nitesh Sharma"],"assignedStaffBracket":"(Nitesh Sharma)","assignedStaffPhone":"+91 79764 36882"}],"overall":{"totalProfiles":1,"totalReviews":503,"totalTodayNew":3,"totalPending":3,"averageRating":4.8},"cached":false}', '2026-11-02 08:51:42', '2026-11-02 08:51:42');
INSERT INTO `gbp_system_data` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES ('5', 'gbp_reviews_8d1317f4181b747d22eae5ac1c34a0cc', '{"reviews":[{"reviewId":"rev-yesterday","name":"accounts\/222\/locations\/loc-midnight\/reviews\/rev-yesterday","reviewer":{"displayName":"Google User","profilePhotoUrl":null},"starRating":"FIVE","comment":"Left yesterday evening","createTime":"2026-11-01T14:21:42+05:30","updateTime":null,"reviewReply":null}],"averageRating":4.9,"totalReviewCount":620,"savedAt":"2026-11-02T14:21:42+05:30"}', '2026-11-02 08:51:42', '2026-11-02 08:51:42');
INSERT INTO `gbp_system_data` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES ('6', 'gbp_daily_snap_8d1317f4181b747d22eae5ac1c34a0cc_2026-11-02', '{"total":620,"rating":4.9,"date":"2026-11-02","updated_at":"2026-11-02T14:21:42+05:30"}', '2026-11-02 08:51:42', '2026-11-02 08:51:42');
INSERT INTO `gbp_system_data` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES ('7', 'gbp_snap_latest_8d1317f4181b747d22eae5ac1c34a0cc', '{"total":620,"rating":4.9,"date":"2026-11-02","updated_at":"2026-11-02T14:21:42+05:30"}', '2026-11-02 08:51:42', '2026-11-02 08:51:42');
INSERT INTO `gbp_system_data` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES ('8', 'gbp_multi_report_dea27d24e9ef60f2006bfbc4525e99fb', '{"success":true,"hasReport":true,"userEmail":"midnight-rollover@example.com","generatedAt":"2026-11-02T14:21:42+05:30","locations":[{"id":"accounts\/222\/locations\/loc-midnight","name":"accounts\/222\/locations\/loc-midnight","v4Name":"accounts\/222\/locations\/loc-midnight","title":"Midnight Rollover Branch","address":"","storeCode":null,"totalReviews":620,"beforeTodayReviews":620,"todayNewReviews":0,"difference":0,"averageRating":4.9,"repliedCount":0,"pendingCount":1,"reviewLink":"https:\/\/search.google.com\/local\/writereview","assignedStaff":[],"assignedStaffBracket":"","assignedStaffPhone":""}],"overall":{"totalProfiles":1,"totalReviews":620,"totalTodayNew":0,"totalPending":1,"averageRating":4.9},"cached":false}', '2026-11-02 08:51:42', '2026-11-02 08:51:42');
INSERT INTO `gbp_system_data` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES ('9', 'gbp_reviews_9b90de1a29da473869c7e8500a1611b1', '{"reviews":[{"reviewId":"rev-heal-1","name":"accounts\/333\/locations\/loc-heal\/reviews\/rev-heal-1","reviewer":{"displayName":"Google User","profilePhotoUrl":null},"starRating":"FIVE","comment":"Today review 1","createTime":"2026-11-02T14:21:42+05:30","updateTime":null,"reviewReply":null},{"reviewId":"rev-heal-2","name":"accounts\/333\/locations\/loc-heal\/reviews\/rev-heal-2","reviewer":{"displayName":"Google User","profilePhotoUrl":null},"starRating":"FIVE","comment":"Today review 2","createTime":"2026-11-02T14:21:42+05:30","updateTime":null,"reviewReply":null},{"reviewId":"rev-heal-3","name":"accounts\/333\/locations\/loc-heal\/reviews\/rev-heal-3","reviewer":{"displayName":"Google User","profilePhotoUrl":null},"starRating":"FIVE","comment":"Today review 3","createTime":"2026-11-02T14:21:42+05:30","updateTime":null,"reviewReply":null},{"reviewId":"rev-heal-4","name":"accounts\/333\/locations\/loc-heal\/reviews\/rev-heal-4","reviewer":{"displayName":"Google User","profilePhotoUrl":null},"starRating":"FIVE","comment":"Today review 4","createTime":"2026-11-02T14:21:42+05:30","updateTime":null,"reviewReply":null},{"reviewId":"rev-heal-5","name":"accounts\/333\/locations\/loc-heal\/reviews\/rev-heal-5","reviewer":{"displayName":"Google User","profilePhotoUrl":null},"starRating":"FIVE","comment":"Today review 5","createTime":"2026-11-02T14:21:42+05:30","updateTime":null,"reviewReply":null}],"averageRating":4.6,"totalReviewCount":800,"savedAt":"2026-11-02T14:21:42+05:30"}', '2026-11-02 08:51:42', '2026-11-02 08:51:42');
INSERT INTO `gbp_system_data` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES ('10', 'gbp_daily_snap_9b90de1a29da473869c7e8500a1611b1_2026-11-02', '{"total":800,"rating":4.6,"date":"2026-11-02","updated_at":"2026-11-02T14:21:42+05:30"}', '2026-11-02 08:51:42', '2026-11-02 08:51:42');
INSERT INTO `gbp_system_data` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES ('11', 'gbp_snap_latest_9b90de1a29da473869c7e8500a1611b1', '{"total":800,"rating":4.6,"date":"2026-11-02","updated_at":"2026-11-02T14:21:42+05:30"}', '2026-11-02 08:51:42', '2026-11-02 08:51:42');
INSERT INTO `gbp_system_data` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES ('12', 'gbp_multi_report_a1f7074412b89d93cd404921e308d6f1', '{"success":true,"hasReport":true,"userEmail":"self-healing@example.com","generatedAt":"2026-11-02T14:21:42+05:30","locations":[{"id":"accounts\/333\/locations\/loc-heal","name":"accounts\/333\/locations\/loc-heal","v4Name":"accounts\/333\/locations\/loc-heal","title":"Healing Branch","address":"","storeCode":null,"totalReviews":800,"beforeTodayReviews":795,"todayNewReviews":5,"difference":5,"averageRating":4.6,"repliedCount":0,"pendingCount":5,"reviewLink":"https:\/\/search.google.com\/local\/writereview","assignedStaff":[],"assignedStaffBracket":"","assignedStaffPhone":""}],"overall":{"totalProfiles":1,"totalReviews":800,"totalTodayNew":5,"totalPending":5,"averageRating":4.6},"cached":false}', '2026-11-02 08:51:42', '2026-11-02 08:51:42');
INSERT INTO `gbp_system_data` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES ('13', 'gbp_reviews_951da82ef6f6139303202237ab7f3906', '{"reviews":[],"averageRating":4.6,"totalReviewCount":423,"savedAt":"2026-11-02T14:21:42+05:30"}', '2026-11-02 08:51:42', '2026-11-02 08:51:42');
INSERT INTO `gbp_system_data` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES ('14', 'gbp_daily_snap_951da82ef6f6139303202237ab7f3906_2026-11-02', '{"total":423,"rating":4.6,"date":"2026-11-02","updated_at":"2026-11-02T14:21:42+05:30"}', '2026-11-02 08:51:42', '2026-11-02 08:51:42');
INSERT INTO `gbp_system_data` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES ('15', 'gbp_snap_latest_951da82ef6f6139303202237ab7f3906', '{"total":423,"rating":4.6,"date":"2026-11-02","updated_at":"2026-11-02T14:21:42+05:30"}', '2026-11-02 08:51:42', '2026-11-02 08:51:42');
INSERT INTO `gbp_system_data` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES ('16', 'gbp_multi_report_5227781f8ef215d83c25b4ea9d24fad6', '{"success":true,"hasReport":true,"userEmail":"yesterday-report-rollover@example.com","generatedAt":"2026-11-02T14:21:42+05:30","locations":[{"id":"accounts\/444\/locations\/loc-rollover","name":"accounts\/444\/locations\/loc-rollover","v4Name":"accounts\/444\/locations\/loc-rollover","title":"Prince NDA Coaching","address":"","storeCode":null,"totalReviews":423,"beforeTodayReviews":423,"todayNewReviews":0,"difference":0,"averageRating":4.6,"repliedCount":0,"pendingCount":0,"reviewLink":"https:\/\/search.google.com\/local\/writereview","assignedStaff":["Nitesh Sharma"],"assignedStaffBracket":"(Nitesh Sharma)","assignedStaffPhone":"+91 79764 36882"}],"overall":{"totalProfiles":1,"totalReviews":423,"totalTodayNew":0,"totalPending":0,"averageRating":4.6},"cached":false}', '2026-11-02 08:51:42', '2026-11-02 08:51:42');
INSERT INTO `gbp_system_data` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES ('17', 'gbp_reviews_f0146ef7aa1cc1b53e541022e9e9d1c3', '{
    "reviews": [
        {
            "reviewId": "rev_48823a510012e75aef5e120833be0f7e",
            "name": "locations\/sample\/reviews\/rev_48823a510012e75aef5e120833be0f7e",
            "reviewer": {
                "displayName": "Rajesh Saini",
                "profilePhotoUrl": null
            },
            "starRating": "FIVE",
            "comment": "Very well-managed hospital with experienced doctors and polite nursing staff. Clean environment and prompt 24x7 emergency medical service in Bajor.",
            "createTime": "2026-10-31T10:05:18+05:30",
            "updateTime": null,
            "reviewReply": {
                "comment": "Thank you Rajesh ji for your valuable feedback. Prince Hospital is committed to providing top-quality healthcare in Sikar.",
                "updateTime": "2026-11-01T10:05:18+05:30"
            }
        },
        {
            "reviewId": "rev_87dadeece14e6414f2d47ccfb81210e1",
            "name": "locations\/sample\/reviews\/rev_87dadeece14e6414f2d47ccfb81210e1",
            "reviewer": {
                "displayName": "Sunita Choudhary",
                "profilePhotoUrl": null
            },
            "starRating": "FIVE",
            "comment": "Dr. Aditya and the entire clinical team were very supportive during my mother''s treatment. Affordable charges and prompt diagnostic consultation.",
            "createTime": "2026-10-29T10:05:18+05:30",
            "updateTime": null,
            "reviewReply": {
                "comment": "Thank you Sunita ji. We wish your mother a healthy and speedy recovery.",
                "updateTime": "2026-10-30T10:05:18+05:30"
            }
        },
        {
            "reviewId": "rev_2f9ea8e7c5264dc8d7821eabcd3cfb81",
            "name": "locations\/sample\/reviews\/rev_2f9ea8e7c5264dc8d7821eabcd3cfb81",
            "reviewer": {
                "displayName": "Manoj Kumar Sharma",
                "profilePhotoUrl": null
            },
            "starRating": "FIVE",
            "comment": "Best hospital on the Jaipur-Bikaner Highway. Clean rooms, modern equipment, and immediate attention by the emergency team.",
            "createTime": "2026-10-25T10:05:18+05:30",
            "updateTime": null,
            "reviewReply": {
                "comment": "Thank you Manoj ji for placing your trust in Prince Hospital.",
                "updateTime": "2026-10-26T10:05:18+05:30"
            }
        },
        {
            "reviewId": "rev_f80ce4a60359aaf8928059de772c8233",
            "name": "locations\/sample\/reviews\/rev_f80ce4a60359aaf8928059de772c8233",
            "reviewer": {
                "displayName": "Vikram Singh Shekhawat",
                "profilePhotoUrl": null
            },
            "starRating": "FOUR",
            "comment": "Good medical care and spacious campus. Lab reports were delivered quickly and doctors explained the medication thoroughly.",
            "createTime": "2026-10-21T10:05:18+05:30",
            "updateTime": null,
            "reviewReply": {
                "comment": "Thank you Vikram ji. We continuously strive to elevate our healthcare services.",
                "updateTime": "2026-10-22T10:05:18+05:30"
            }
        },
        {
            "reviewId": "rev_48edb61239af6ff0b93c6bcf797c27b5",
            "name": "locations\/sample\/reviews\/rev_48edb61239af6ff0b93c6bcf797c27b5",
            "reviewer": {
                "displayName": "Anita Verma",
                "profilePhotoUrl": null
            },
            "starRating": "FIVE",
            "comment": "Excellent specialist doctors and compassionate staff. One of the best healthcare institutions in Sikar district.",
            "createTime": "2026-10-17T10:05:18+05:30",
            "updateTime": null,
            "reviewReply": {
                "comment": "Thank you Anita ji for your kind words and trust.",
                "updateTime": "2026-10-18T10:05:18+05:30"
            }
        },
        {
            "reviewId": "rev_ec767c8e880ab672e15af225051f3d67",
            "name": "locations\/sample\/reviews\/rev_ec767c8e880ab672e15af225051f3d67",
            "reviewer": {
                "displayName": "Suresh Kumar",
                "profilePhotoUrl": null
            },
            "starRating": "FIVE",
            "comment": "24 hour pharmacy and emergency trauma care was very helpful when we needed urgent medical assistance.",
            "createTime": "2026-10-11T10:05:18+05:30",
            "updateTime": null,
            "reviewReply": {
                "comment": "Thank you Suresh ji. Our emergency services remain dedicated 24x7.",
                "updateTime": "2026-10-12T10:05:18+05:30"
            }
        }
    ],
    "averageRating": 4.4,
    "totalReviewCount": 234,
    "savedAt": "2026-11-02T10:05:18+05:30"
}', '2026-11-02 08:51:59', '2026-11-02 08:51:59');
INSERT INTO `gbp_system_data` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES ('18', 'gbp_reviews_8d185ea1c702bbea1f5bce811b8600d6', '{"reviews":[{"reviewId":"rev-5-star","name":"accounts\/123\/locations\/branch-active\/reviews\/rev-5-star","reviewer":{"displayName":"Amit Kumar"},"starRating":"FIVE","comment":"Great experience!","createTime":"2026-11-02T08:52:02+00:00","reviewReply":null},{"reviewId":"rev-2-star","name":"accounts\/123\/locations\/branch-active\/reviews\/rev-2-star","reviewer":{"displayName":"Rahul Verma"},"starRating":"TWO","comment":"Slow handling","createTime":"2026-11-02T08:52:02+00:00","reviewReply":null},{"reviewId":"rev-already-replied","name":"accounts\/123\/locations\/branch-active\/reviews\/rev-already-replied","reviewer":{"displayName":"Pooja Singh"},"starRating":"FIVE","comment":"Loved it","createTime":"2026-11-02T08:52:02+00:00","reviewReply":{"comment":"Thanks Pooja!"}}],"averageRating":4,"totalReviewCount":3,"savedAt":"2026-11-02T08:52:04+00:00"}', '2026-11-02 08:52:04', '2026-11-02 08:52:04');
INSERT INTO `gbp_system_data` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES ('19', 'gbp_reviews_d2b8c4237f8eb3661a951ee34c3edab5', '{"reviews":[{"reviewId":"rev-5-star","name":"accounts\/123\/locations\/branch-active\/reviews\/rev-5-star","reviewer":{"displayName":"Amit Kumar"},"starRating":"FIVE","comment":"Great experience!","createTime":"2026-11-02T08:52:02+00:00","reviewReply":null},{"reviewId":"rev-2-star","name":"accounts\/123\/locations\/branch-active\/reviews\/rev-2-star","reviewer":{"displayName":"Rahul Verma"},"starRating":"TWO","comment":"Slow handling","createTime":"2026-11-02T08:52:02+00:00","reviewReply":null},{"reviewId":"rev-already-replied","name":"accounts\/123\/locations\/branch-active\/reviews\/rev-already-replied","reviewer":{"displayName":"Pooja Singh"},"starRating":"FIVE","comment":"Loved it","createTime":"2026-11-02T08:52:02+00:00","reviewReply":{"comment":"Thanks Pooja!"}}],"averageRating":4,"totalReviewCount":3,"savedAt":"2026-11-02T08:52:04+00:00"}', '2026-11-02 08:52:04', '2026-11-02 08:52:04');
INSERT INTO `gbp_system_data` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES ('20', 'test-server-data-6ad350d8-b78e-4204-bf3b-67b14d4cbb7e', '{"profile":"Test Profile"}', '2026-11-02 08:52:08', '2026-11-02 08:52:08');

-- ----------------------------------------------------------
-- Table structure for `google_reviews`
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `google_reviews`;
CREATE TABLE `google_reviews` (`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, `review_id` VARCHAR(255) not null, `location_name` VARCHAR(255) not null, `v4_name` VARCHAR(255), `reviewer_name` VARCHAR(255) not null, `reviewer_photo_url` text, `star_rating` VARCHAR(255) not null default 'FIVE', `star_number` BIGINT not null default '5', `comment` text, `create_time` datetime, `update_time` datetime, `reply_comment` text, `reply_time` datetime, `created_at` datetime, `updated_at` datetime) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table structure for `job_batches`
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `job_batches`;
CREATE TABLE `job_batches` (`id` VARCHAR(255) not null, `name` VARCHAR(255) not null, `total_jobs` BIGINT not null, `pending_jobs` BIGINT not null, `failed_jobs` BIGINT not null, `failed_job_ids` text not null, `options` text, `cancelled_at` BIGINT, `created_at` BIGINT not null, `finished_at` BIGINT, primary key (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table structure for `jobs`
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `jobs`;
CREATE TABLE `jobs` (`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, `queue` VARCHAR(255) not null, `payload` text not null, `attempts` BIGINT not null, `reserved_at` BIGINT, `available_at` BIGINT not null, `created_at` BIGINT not null) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table structure for `migrations`
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `migrations`;
CREATE TABLE `migrations` (`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, `migration` VARCHAR(255) not null, `batch` BIGINT not null) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `migrations` (9 rows)
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('1', '0001_01_01_000000_create_users_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('2', '0001_01_01_000001_create_cache_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('3', '0001_01_01_000002_create_jobs_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('4', '2026_10_12_113615_add_role_and_status_to_users_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('5', '2026_10_20_045007_create_facebook_pages_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('6', '2026_10_20_090754_create_chat_support_tables', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('7', '2026_11_02_044941_create_gbp_storage_and_reports_tables', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('8', '2026_11_02_050042_add_phone_to_users_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('9', '2026_11_02_061423_add_assigned_wing_to_users_table', '1');

-- ----------------------------------------------------------
-- Table structure for `password_reset_tokens`
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (`email` VARCHAR(255) not null, `token` VARCHAR(255) not null, `created_at` datetime, primary key (`email`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table structure for `review_report_items`
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `review_report_items`;
CREATE TABLE `review_report_items` (`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, `report_id` BIGINT UNSIGNED, `report_date` date not null, `location_name` VARCHAR(255) not null, `v4_name` VARCHAR(255), `title` VARCHAR(255) not null, `address` text, `store_code` VARCHAR(255), `total_reviews` BIGINT not null default '0', `before_today_reviews` BIGINT not null default '0', `today_new_reviews` BIGINT not null default '0', `difference` BIGINT not null default '0', `average_rating` numeric not null default '5', `replied_count` BIGINT not null default '0', `pending_count` BIGINT not null default '0', `assigned_staff` VARCHAR(255), `assigned_staff_bracket` VARCHAR(255), `assigned_staff_phone` VARCHAR(255), `review_link` text, `raw_data` text, `created_at` datetime, `updated_at` datetime) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `review_report_items` (4 rows)
INSERT INTO `review_report_items` (`id`, `report_id`, `report_date`, `location_name`, `v4_name`, `title`, `address`, `store_code`, `total_reviews`, `before_today_reviews`, `today_new_reviews`, `difference`, `average_rating`, `replied_count`, `pending_count`, `assigned_staff`, `assigned_staff_bracket`, `assigned_staff_phone`, `review_link`, `raw_data`, `created_at`, `updated_at`) VALUES ('1', '1', '2026-11-02 00:00:00', 'accounts/111/locations/loc-fresh', 'accounts/111/locations/loc-fresh', 'Apex Defence Academy', 'Station Road, Sikar', 'APEX01', '503', '500', '3', '3', '4.8', '1', '3', '["Nitesh Sharma"]', '(Nitesh Sharma)', '+91 79764 36882', 'https://search.google.com/local/writereview', '{"id":"accounts\/111\/locations\/loc-fresh","name":"accounts\/111\/locations\/loc-fresh","v4Name":"accounts\/111\/locations\/loc-fresh","title":"Apex Defence Academy","address":"Station Road, Sikar","storeCode":"APEX01","totalReviews":503,"beforeTodayReviews":500,"todayNewReviews":3,"difference":3,"averageRating":4.8,"repliedCount":1,"pendingCount":3,"reviewLink":"https:\/\/search.google.com\/local\/writereview","assignedStaff":["Nitesh Sharma"],"assignedStaffBracket":"(Nitesh Sharma)","assignedStaffPhone":"+91 79764 36882"}', '2026-11-02 08:51:42', '2026-11-02 08:51:42');
INSERT INTO `review_report_items` (`id`, `report_id`, `report_date`, `location_name`, `v4_name`, `title`, `address`, `store_code`, `total_reviews`, `before_today_reviews`, `today_new_reviews`, `difference`, `average_rating`, `replied_count`, `pending_count`, `assigned_staff`, `assigned_staff_bracket`, `assigned_staff_phone`, `review_link`, `raw_data`, `created_at`, `updated_at`) VALUES ('2', '2', '2026-11-02 00:00:00', 'accounts/222/locations/loc-midnight', 'accounts/222/locations/loc-midnight', 'Midnight Rollover Branch', '', NULL, '620', '620', '0', '0', '4.9', '0', '1', '[]', '', '', 'https://search.google.com/local/writereview', '{"id":"accounts\/222\/locations\/loc-midnight","name":"accounts\/222\/locations\/loc-midnight","v4Name":"accounts\/222\/locations\/loc-midnight","title":"Midnight Rollover Branch","address":"","storeCode":null,"totalReviews":620,"beforeTodayReviews":620,"todayNewReviews":0,"difference":0,"averageRating":4.9,"repliedCount":0,"pendingCount":1,"reviewLink":"https:\/\/search.google.com\/local\/writereview","assignedStaff":[],"assignedStaffBracket":"","assignedStaffPhone":""}', '2026-11-02 08:51:42', '2026-11-02 08:51:42');
INSERT INTO `review_report_items` (`id`, `report_id`, `report_date`, `location_name`, `v4_name`, `title`, `address`, `store_code`, `total_reviews`, `before_today_reviews`, `today_new_reviews`, `difference`, `average_rating`, `replied_count`, `pending_count`, `assigned_staff`, `assigned_staff_bracket`, `assigned_staff_phone`, `review_link`, `raw_data`, `created_at`, `updated_at`) VALUES ('3', '3', '2026-11-02 00:00:00', 'accounts/333/locations/loc-heal', 'accounts/333/locations/loc-heal', 'Healing Branch', '', NULL, '800', '795', '5', '5', '4.6', '0', '5', '[]', '', '', 'https://search.google.com/local/writereview', '{"id":"accounts\/333\/locations\/loc-heal","name":"accounts\/333\/locations\/loc-heal","v4Name":"accounts\/333\/locations\/loc-heal","title":"Healing Branch","address":"","storeCode":null,"totalReviews":800,"beforeTodayReviews":795,"todayNewReviews":5,"difference":5,"averageRating":4.6,"repliedCount":0,"pendingCount":5,"reviewLink":"https:\/\/search.google.com\/local\/writereview","assignedStaff":[],"assignedStaffBracket":"","assignedStaffPhone":""}', '2026-11-02 08:51:42', '2026-11-02 08:51:42');
INSERT INTO `review_report_items` (`id`, `report_id`, `report_date`, `location_name`, `v4_name`, `title`, `address`, `store_code`, `total_reviews`, `before_today_reviews`, `today_new_reviews`, `difference`, `average_rating`, `replied_count`, `pending_count`, `assigned_staff`, `assigned_staff_bracket`, `assigned_staff_phone`, `review_link`, `raw_data`, `created_at`, `updated_at`) VALUES ('4', '4', '2026-11-02 00:00:00', 'accounts/444/locations/loc-rollover', 'accounts/444/locations/loc-rollover', 'Prince NDA Coaching', '', NULL, '423', '423', '0', '0', '4.6', '0', '0', '["Nitesh Sharma"]', '(Nitesh Sharma)', '+91 79764 36882', 'https://search.google.com/local/writereview', '{"id":"accounts\/444\/locations\/loc-rollover","name":"accounts\/444\/locations\/loc-rollover","v4Name":"accounts\/444\/locations\/loc-rollover","title":"Prince NDA Coaching","address":"","storeCode":null,"totalReviews":423,"beforeTodayReviews":423,"todayNewReviews":0,"difference":0,"averageRating":4.6,"repliedCount":0,"pendingCount":0,"reviewLink":"https:\/\/search.google.com\/local\/writereview","assignedStaff":["Nitesh Sharma"],"assignedStaffBracket":"(Nitesh Sharma)","assignedStaffPhone":"+91 79764 36882"}', '2026-11-02 08:51:42', '2026-11-02 08:51:42');

-- ----------------------------------------------------------
-- Table structure for `review_snapshots`
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `review_snapshots`;
CREATE TABLE `review_snapshots` (`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, `snapshot_date` date not null, `location_name` VARCHAR(255) not null, `location_id` VARCHAR(255), `title` VARCHAR(255), `total_count` BIGINT not null default '0', `created_at` datetime, `updated_at` datetime) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table structure for `sessions`
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (`id` VARCHAR(255) not null, `user_id` BIGINT UNSIGNED UNSIGNED, `ip_address` VARCHAR(255), `user_agent` text, `payload` text not null, `last_activity` BIGINT not null, primary key (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
