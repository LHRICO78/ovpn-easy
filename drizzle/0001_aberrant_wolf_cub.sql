CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`enabled` boolean NOT NULL DEFAULT true,
	`ipAddress` varchar(64) NOT NULL,
	`certificateData` text,
	`privateKeyData` text,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `connectionStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`connectedAt` timestamp NOT NULL,
	`disconnectedAt` timestamp,
	`bytesReceived` int DEFAULT 0,
	`bytesSent` int DEFAULT 0,
	`realAddress` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `connectionStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interfaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL DEFAULT 'server',
	`port` int NOT NULL DEFAULT 1194,
	`protocol` enum('udp','tcp') NOT NULL DEFAULT 'udp',
	`network` varchar(64) NOT NULL DEFAULT '10.8.0.0',
	`netmask` varchar(64) NOT NULL DEFAULT '255.255.255.0',
	`dns1` varchar(64) DEFAULT '1.1.1.1',
	`dns2` varchar(64) DEFAULT '1.0.0.1',
	`compression` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interfaces_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `serverConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicHost` varchar(255) NOT NULL,
	`publicPort` int NOT NULL DEFAULT 1194,
	`preUp` text,
	`postUp` text,
	`preDown` text,
	`postDown` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `serverConfig_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `clients` ADD CONSTRAINT `clients_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `connectionStats` ADD CONSTRAINT `connectionStats_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE cascade ON UPDATE no action;