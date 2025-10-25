# Project TODO

## Infrastructure & Backend
- [x] Créer le schéma de base de données pour OpenVPN (interfaces, clients, certificats, hooks)
- [x] Implémenter les helpers OpenVPN (génération de certificats, configuration)
- [x] Créer les procédures tRPC pour la gestion des clients VPN
- [ ] Implémenter la gestion du serveur OpenVPN (démarrage, arrêt, redémarrage)
- [ ] Ajouter la récupération des statistiques de connexion
- [ ] Implémenter le système d'expiration des clients
- [x] Ajouter la génération de fichiers de configuration .ovpn

## Frontend & UI
- [x] Créer le DashboardLayout avec navigation
- [x] Implémenter la page d'accueil/dashboard avec statistiques
- [x] Créer la page de liste des clients VPN
- [x] Implémenter le formulaire de création de client
- [ ] Ajouter la page de détails d'un client
- [x] Implémenter la génération et téléchargement de fichiers .ovpn
- [x] Créer la page de configuration du serveur OpenVPN
- [ ] Ajouter les graphiques de transfert de données
- [x] Créer la page de gestion du serveur

## Configuration & Déploiement
- [ ] Créer le Dockerfile pour OpenVPN
- [ ] Configurer les variables d'environnement
- [ ] Ajouter la documentation d'installation
- [ ] Créer le docker-compose.yml
- [ ] Installer et configurer OpenVPN sur le serveur
- [ ] Configurer Easy-RSA pour la génération de certificats

## Améliorations futures
- [ ] Ajouter la génération de QR codes pour les configurations
- [ ] Implémenter l'authentification 2FA
- [ ] Ajouter le support IPv6
- [ ] Implémenter les métriques Prometheus
- [ ] Ajouter le support multilingue
- [ ] Créer un système de notifications



## Bugs à corriger
- [x] Corriger l'erreur de permissions EACCES sur /etc/openvpn en environnement de développement

