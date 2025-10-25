# Project TODO

## Infrastructure & Backend
- [x] Créer le schéma de base de données pour OpenVPN (interfaces, clients, certificats, hooks)
- [x] Implémenter les helpers OpenVPN (génération de certificats, configuration)
- [x] Créer les procédures tRPC pour la gestion des clients VPN
- [x] Implémenter la gestion du serveur OpenVPN (démarrage, arrêt, redémarrage)
- [x] Ajouter la récupération des statistiques de connexion
- [x] Implémenter le système d'expiration des clients
- [x] Ajouter la génération de fichiers de configuration .ovpn

## Frontend & UI
- [x] Créer le DashboardLayout avec navigation
- [x] Implémenter la page d'accueil/dashboard avec statistiques
- [x] Créer la page de liste des clients VPN
- [x] Implémenter le formulaire de création de client
- [x] Ajouter la page de détails d'un client
- [x] Implémenter la génération et téléchargement de fichiers .ovpn
- [x] Créer la page de configuration du serveur OpenVPN
- [x] Ajouter l'historique des connexions avec statistiques de transfert
- [x] Créer la page de gestion du serveur

## Configuration & Déploiement
- [x] Créer le Dockerfile pour OpenVPN
- [x] Configurer les variables d'environnement
- [x] Ajouter la documentation d'installation
- [x] Créer le docker-compose.yml
- [x] Installer et configurer OpenVPN sur le serveur
- [x] Configurer Easy-RSA pour la génération de certificats

## Améliorations futures
- [x] Ajouter la génération de QR codes pour les configurations
- [ ] Implémenter l'authentification 2FA
- [ ] Ajouter le support IPv6
- [ ] Implémenter les métriques Prometheus
- [ ] Ajouter le support multilingue
- [ ] Créer un système de notifications



## Bugs à corriger
- [x] Corriger l'erreur de permissions EACCES sur /etc/openvpn en environnement de développement



- [x] Corriger l'erreur de copie Easy-RSA en mode développement



## Git & Docker
- [x] Initialiser le dépôt Git avec .gitignore
- [x] Créer le premier commit
- [x] Améliorer le Dockerfile et docker-compose.yml
- [x] Ajouter un .dockerignore

