-- CreateTable
CREATE TABLE `JobDepartment` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `group` ENUM('VERTICAL', 'FUNCTION') NOT NULL DEFAULT 'FUNCTION',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `JobDepartment_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JobVacancy` (
    `id` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED') NOT NULL DEFAULT 'DRAFT',
    `employmentType` ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP') NOT NULL,
    `workArrangement` ENUM('ON_SITE', 'REMOTE', 'HYBRID') NOT NULL,
    `experienceLevel` ENUM('FRESHER', 'JUNIOR', 'MID', 'SENIOR', 'LEAD') NOT NULL,
    `experienceText` VARCHAR(191) NOT NULL,
    `education` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `country` CHAR(2) NOT NULL DEFAULT 'IN',
    `openings` INTEGER NOT NULL DEFAULT 1,
    `salaryMin` INTEGER NULL,
    `salaryMax` INTEGER NULL,
    `salaryPeriod` VARCHAR(191) NULL,
    `showSalary` BOOLEAN NOT NULL DEFAULT false,
    `compensationNote` TEXT NULL,
    `shortDescription` VARCHAR(400) NOT NULL,
    `summary` TEXT NOT NULL,
    `responsibilities` TEXT NOT NULL,
    `skills` TEXT NOT NULL,
    `preferred` TEXT NULL,
    `deadline` DATETIME(3) NULL,
    `isUrgent` BOOLEAN NOT NULL DEFAULT false,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `seoTitle` VARCHAR(191) NULL,
    `seoDescription` VARCHAR(200) NULL,
    `publishedAt` DATETIME(3) NULL,
    `closedAt` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `JobVacancy_reference_key`(`reference`),
    INDEX `JobVacancy_status_publishedAt_idx`(`status`, `publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JobVacancyDepartment` (
    `jobId` VARCHAR(191) NOT NULL,
    `departmentId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`jobId`, `departmentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JobApplication` (
    `id` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NOT NULL,
    `kind` ENUM('VACANCY', 'SPECULATIVE') NOT NULL,
    `jobId` VARCHAR(191) NULL,
    `positionTitle` VARCHAR(191) NOT NULL,
    `interestArea` VARCHAR(191) NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `currentLocation` VARCHAR(191) NOT NULL,
    `totalExperience` VARCHAR(191) NOT NULL,
    `employmentStatus` VARCHAR(191) NOT NULL,
    `education` VARCHAR(191) NOT NULL,
    `currentEmployer` VARCHAR(191) NULL,
    `linkedinUrl` VARCHAR(191) NULL,
    `expectedSalary` VARCHAR(191) NULL,
    `noticePeriod` VARCHAR(191) NOT NULL,
    `coverLetter` TEXT NOT NULL,
    `status` ENUM('NEW', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'SELECTED', 'REJECTED', 'ON_HOLD') NOT NULL DEFAULT 'NEW',
    `consentAt` DATETIME(3) NOT NULL,
    `consentText` TEXT NOT NULL,
    `privacyNoticeVersion` VARCHAR(191) NOT NULL,
    `retainUntil` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `JobApplication_reference_key`(`reference`),
    INDEX `JobApplication_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `JobApplication_jobId_createdAt_idx`(`jobId`, `createdAt`),
    INDEX `JobApplication_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CandidateDocument` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `sizeBytes` INTEGER NOT NULL,
    `sha256` CHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CandidateDocument_applicationId_idx`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApplicationStatusHistory` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `fromStatus` ENUM('NEW', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'SELECTED', 'REJECTED', 'ON_HOLD') NULL,
    `toStatus` ENUM('NEW', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'SELECTED', 'REJECTED', 'ON_HOLD') NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ApplicationStatusHistory_applicationId_createdAt_idx`(`applicationId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CandidateNote` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CandidateNote_applicationId_createdAt_idx`(`applicationId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RecruitmentEmailLog` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NULL,
    `kind` VARCHAR(191) NOT NULL,
    `templateKey` VARCHAR(191) NULL,
    `toEmail` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `status` ENUM('SENT', 'FAILED', 'SKIPPED') NOT NULL,
    `error` VARCHAR(191) NULL,
    `sentById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RecruitmentEmailLog_applicationId_createdAt_idx`(`applicationId`, `createdAt`),
    INDEX `RecruitmentEmailLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RecruitmentSetting` (
    `key` VARCHAR(191) NOT NULL,
    `value` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedById` VARCHAR(191) NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RecruitmentEmailTemplate` (
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedById` VARCHAR(191) NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `JobVacancyDepartment` ADD CONSTRAINT `JobVacancyDepartment_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `JobVacancy`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobVacancyDepartment` ADD CONSTRAINT `JobVacancyDepartment_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `JobDepartment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobApplication` ADD CONSTRAINT `JobApplication_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `JobVacancy`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CandidateDocument` ADD CONSTRAINT `CandidateDocument_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `JobApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApplicationStatusHistory` ADD CONSTRAINT `ApplicationStatusHistory_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `JobApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CandidateNote` ADD CONSTRAINT `CandidateNote_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `JobApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecruitmentEmailLog` ADD CONSTRAINT `RecruitmentEmailLog_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `JobApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Departments shown as job categories on /careers (staff can rename, reorder or hide them in the admin).
INSERT INTO `JobDepartment` (`id`, `slug`, `name`, `group`, `sortOrder`, `isActive`) VALUES
  ('dept_nutrition', 'nutrition-supplements', 'Nutrition & Supplements', 'VERTICAL', 10, true),
  ('dept_ems', 'ems-wellness-fitness', 'EMS Wellness & Fitness', 'VERTICAL', 20, true),
  ('dept_water', 'pure-drinking-water', 'Pure Drinking Water', 'VERTICAL', 30, true),
  ('dept_food', 'healthy-food-cloud-kitchen', 'Healthy Food & Cloud Kitchen', 'VERTICAL', 40, true),
  ('dept_lifestyle', 'lifestyle-wearables-accessories', 'Lifestyle, Wearables & Accessories', 'VERTICAL', 50, true),
  ('dept_sales', 'sales-marketing', 'Sales & Marketing', 'FUNCTION', 110, true),
  ('dept_bizdev', 'business-development', 'Business Development', 'FUNCTION', 120, true),
  ('dept_ops', 'operations-supply-chain', 'Operations & Supply Chain', 'FUNCTION', 130, true),
  ('dept_finance', 'finance-administration', 'Finance & Administration', 'FUNCTION', 140, true),
  ('dept_tech', 'technology-digital-marketing', 'Technology & Digital Marketing', 'FUNCTION', 150, true),
  ('dept_support', 'customer-support', 'Customer Support', 'FUNCTION', 160, true),
  ('dept_hr', 'human-resources', 'Human Resources', 'FUNCTION', 170, true);

-- Default email templates. Placeholders: {{name}}, {{position}}, {{reference}}, {{details}}.
INSERT INTO `RecruitmentEmailTemplate` (`key`, `name`, `subject`, `body`, `updatedAt`) VALUES
  ('application_received', 'Application received (sent automatically)', 'We have received your application: {{reference}}',
   'Dear {{name}},\n\nThank you for your interest in joining Vercenji. We have received your application for {{position}}.\n\nYour application reference is {{reference}}. Please quote it if you contact us about your application.\n\nOur recruitment team will review your profile and contact you if your qualifications match our requirements.\n\nKind regards,\nVercenji Recruitment Team', CURRENT_TIMESTAMP(3)),
  ('interview_invitation', 'Interview invitation', 'Interview invitation: {{position}} ({{reference}})',
   'Dear {{name}},\n\nThank you for your application for {{position}}. We would like to invite you to an interview.\n\n{{details}}\n\nPlease reply to this email to confirm that you can attend, or to suggest another time.\n\nKind regards,\nVercenji Recruitment Team', CURRENT_TIMESTAMP(3)),
  ('shortlisted', 'Shortlisted', 'Your application for {{position}} ({{reference}})',
   'Dear {{name}},\n\nWe are pleased to let you know that your application for {{position}} has been shortlisted. We will contact you shortly about the next steps.\n\n{{details}}\n\nKind regards,\nVercenji Recruitment Team', CURRENT_TIMESTAMP(3)),
  ('selected', 'Selected', 'Your application for {{position}} ({{reference}})',
   'Dear {{name}},\n\nWe are pleased to inform you that you have been selected for the position of {{position}}.\n\n{{details}}\n\nWe will be in touch with the next steps.\n\nKind regards,\nVercenji Recruitment Team', CURRENT_TIMESTAMP(3)),
  ('rejected', 'Not selected', 'Your application for {{position}} ({{reference}})',
   'Dear {{name}},\n\nThank you for your interest in Vercenji and for the time you took to apply for {{position}}.\n\nAfter careful consideration, we will not be taking your application further on this occasion. We wish you every success in your search.\n\n{{details}}\n\nKind regards,\nVercenji Recruitment Team', CURRENT_TIMESTAMP(3)),
  ('on_hold', 'On hold', 'Your application for {{position}} ({{reference}})',
   'Dear {{name}},\n\nThank you for your application for {{position}}. Your application is currently on hold, and we will contact you if the position moves forward.\n\n{{details}}\n\nKind regards,\nVercenji Recruitment Team', CURRENT_TIMESTAMP(3)),
  ('status_update', 'General update', 'Update on your application {{reference}}',
   'Dear {{name}},\n\nThis is an update on your application for {{position}}.\n\n{{details}}\n\nKind regards,\nVercenji Recruitment Team', CURRENT_TIMESTAMP(3));

-- The recruitment notification email is left empty on purpose: set it in Admin → Careers → Settings.
INSERT INTO `RecruitmentSetting` (`key`, `value`, `updatedAt`) VALUES
  ('notifyEmails', JSON_ARRAY(), CURRENT_TIMESTAMP(3)),
  ('sendAcknowledgement', 'true', CURRENT_TIMESTAMP(3)),
  ('retentionMonths', '12', CURRENT_TIMESTAMP(3));

-- Recruitment team role (also created by tools/create-staff.mjs).
INSERT IGNORE INTO `Role` (`id`, `key`, `name`, `permissions`) VALUES
  ('role_recruitment', 'recruitment', 'Recruitment team', JSON_ARRAY('careers.manage', 'careers.applications', 'careers.cvs'));
