# OpenVPN Easy

**La façon la plus simple de gérer OpenVPN avec une interface web d'administration.**

OpenVPN Easy est une interface web moderne inspirée de [wg-easy](https://github.com/wg-easy/wg-easy), mais utilisant **OpenVPN** au lieu de WireGuard. Elle permet de gérer facilement votre serveur OpenVPN avec une interface intuitive.

![Dashboard](https://via.placeholder.com/800x400?text=OpenVPN+Easy+Dashboard)

## ✨ Fonctionnalités

L'application offre une interface complète pour gérer votre infrastructure OpenVPN de manière simple et efficace. Elle permet de **créer, éditer, supprimer, activer et désactiver des clients** en quelques clics. La **génération automatique de certificats** via Easy-RSA élimine la complexité de la gestion manuelle des clés PKI. Les utilisateurs peuvent facilement **télécharger les fichiers de configuration .ovpn** prêts à l'emploi pour leurs clients.

Le tableau de bord affiche des **statistiques en temps réel** sur les connexions actives, le nombre de clients et l'état du serveur. L'interface permet également de **configurer le serveur OpenVPN** directement depuis le navigateur, incluant les paramètres réseau, DNS et de compression. Le système d'**authentification intégré** avec support des rôles (admin/utilisateur) assure une gestion sécurisée des accès.

L'architecture moderne basée sur **React, TypeScript et tRPC** garantit une expérience utilisateur fluide avec une synchronisation automatique des données. Le design responsive s'adapte parfaitement aux écrans mobiles et desktop, avec un mode clair/sombre automatique.

## 🚀 Installation

### Prérequis

Avant de commencer, assurez-vous que votre système dispose des éléments suivants :

- **Docker** et **Docker Compose** installés
- Un serveur Linux (Ubuntu 20.04+ recommandé)
- Accès root ou sudo
- Port 1194 (UDP) ouvert dans le pare-feu
- Une adresse IP publique ou un nom de domaine

### Installation rapide

La méthode la plus simple pour déployer OpenVPN Easy est d'utiliser Docker Compose. Cette approche encapsule toutes les dépendances et simplifie la gestion du service.

```bash
# Cloner le dépôt
git clone https://github.com/LHRICO78/ovpn-easy.git
cd ovpn-easy

# Créer le fichier docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  ovpn-easy:
    image: ovpn-easy:latest
    container_name: ovpn-easy
    restart: unless-stopped
    ports:
      - "1194:1194/udp"  # Port OpenVPN
      - "51821:3000"      # Interface web
    environment:
      - PUBLIC_HOST=vpn.example.com
      - PUBLIC_PORT=1194
    volumes:
      - ./data/openvpn:/etc/openvpn
      - ./data/easy-rsa:/etc/openvpn/easy-rsa
      - ./data/logs:/var/log/openvpn
    cap_add:
      - NET_ADMIN
    devices:
      - /dev/net/tun
EOF

# Démarrer le service
docker-compose up -d
```

### Configuration initiale

Une fois le conteneur démarré, accédez à l'interface web sur `http://votre-serveur:51821`. Lors de la première connexion, vous devrez configurer les paramètres suivants dans la section **Configuration** :

1. **Hôte Public** : Votre adresse IP publique ou nom de domaine (ex: `vpn.example.com`)
2. **Port Public** : Le port sur lequel OpenVPN écoute (par défaut 1194)

Ces informations seront utilisées pour générer les fichiers de configuration des clients.

## 📖 Utilisation

### Créer un client VPN

La création d'un nouveau client se fait en quelques étapes simples. Accédez à la page **Clients** et cliquez sur le bouton **Nouveau Client**. Renseignez le nom du client (obligatoire) et éventuellement une adresse email pour faciliter l'identification. Le système génère automatiquement un certificat unique, attribue une adresse IP disponible dans le réseau VPN, et crée le client dans la base de données.

Une fois créé, le client apparaît dans la liste avec son statut (Actif/Inactif) et son état de connexion (Connecté/Déconnecté).

### Télécharger la configuration

Pour permettre à un client de se connecter, téléchargez son fichier de configuration en cliquant sur les trois points à droite de la ligne du client, puis sélectionnez **Télécharger Config**. Le fichier `.ovpn` généré contient tous les éléments nécessaires : certificats, clés, paramètres de connexion. Il suffit de l'importer dans n'importe quel client OpenVPN (OpenVPN GUI, Tunnelblick, OpenVPN Connect, etc.).

### Gérer les clients

Depuis la page **Clients**, vous pouvez effectuer plusieurs actions sur chaque client. L'option **Activer/Désactiver** permet de contrôler l'accès sans supprimer le client. Un client désactivé ne pourra pas se connecter même avec un fichier de configuration valide. L'option **Supprimer** retire définitivement le client et révoque son certificat.

Le tableau affiche également les statistiques de connexion en temps réel : adresse IP attribuée, statut de connexion, données transférées (upload/download) pour les clients actuellement connectés.

### Configuration du serveur

La page **Configuration** permet d'ajuster les paramètres du serveur OpenVPN. Vous pouvez modifier l'hôte et le port publics qui seront utilisés dans les configurations clients. La section affiche également les paramètres actuels du serveur : réseau VPN (par défaut 10.8.0.0/24), serveurs DNS configurés, protocole utilisé (UDP/TCP), et état de la compression.

### Gestion du serveur

La page **Serveur** affiche l'état actuel du service OpenVPN et permet de le redémarrer si nécessaire. Un redémarrage est requis après certaines modifications de configuration. Le bouton **Redémarrer le Serveur** déconnecte temporairement tous les clients connectés, applique les changements, et redémarre le service.

## 🏗️ Architecture

Le projet utilise une architecture moderne et maintenable qui sépare clairement les responsabilités.

### Stack technique

Le **frontend** est construit avec React 19, TypeScript, Tailwind CSS 4, et shadcn/ui pour les composants. Le **backend** repose sur Express 4 avec tRPC 11 pour une communication type-safe entre client et serveur. La **base de données** utilise MySQL/TiDB avec Drizzle ORM pour la gestion des données. L'**authentification** est gérée via Manus OAuth avec support des rôles. Le **VPN** est assuré par OpenVPN avec Easy-RSA pour la gestion des certificats PKI.

### Structure du projet

```
ovpn-easy/
├── client/                 # Application React
│   ├── src/
│   │   ├── pages/         # Pages de l'application
│   │   ├── components/    # Composants réutilisables
│   │   └── lib/           # Client tRPC
├── server/                # Backend Express + tRPC
│   ├── routers.ts         # Procédures tRPC
│   ├── db.ts              # Requêtes base de données
│   └── openvpn.ts         # Helpers OpenVPN
├── drizzle/               # Schéma et migrations DB
│   └── schema.ts
└── docker-compose.yml     # Configuration Docker
```

### Base de données

Le schéma de base de données comprend plusieurs tables essentielles. La table **users** stocke les informations d'authentification et les rôles. La table **interfaces** contient la configuration du serveur OpenVPN (port, protocole, réseau, DNS). La table **clients** gère les clients VPN avec leurs certificats, adresses IP et dates d'expiration. La table **serverConfig** stocke les paramètres publics (hôte, port) et les hooks de configuration. La table **connectionStats** enregistre l'historique des connexions avec les statistiques de transfert.

## 🔧 Configuration avancée

### Variables d'environnement

Le système injecte automatiquement plusieurs variables d'environnement essentielles au fonctionnement de l'application :

- `DATABASE_URL` : Chaîne de connexion MySQL/TiDB
- `JWT_SECRET` : Secret pour la signature des sessions
- `VITE_APP_TITLE` : Titre de l'application (défaut: "OpenVPN Easy")
- `VITE_APP_LOGO` : URL du logo de l'application
- `OAUTH_SERVER_URL` : URL du serveur OAuth Manus
- `OWNER_OPEN_ID` : OpenID du propriétaire (admin automatique)

### Personnalisation du réseau VPN

Pour modifier le réseau VPN par défaut (10.8.0.0/24), vous devez mettre à jour la table `interfaces` dans la base de données. Accédez à la section **Database** dans l'interface de gestion du projet, puis modifiez les champs `network` et `netmask`. Après modification, redémarrez le serveur OpenVPN depuis la page **Serveur**.

### Hooks de configuration

OpenVPN supporte des scripts personnalisés qui s'exécutent à différents moments du cycle de vie du serveur. Ces hooks peuvent être configurés dans la table `serverConfig` :

- `preUp` : Exécuté avant le démarrage du serveur
- `postUp` : Exécuté après le démarrage (ex: règles iptables)
- `preDown` : Exécuté avant l'arrêt
- `postDown` : Exécuté après l'arrêt (ex: nettoyage)

Exemple de hook `postUp` pour activer le NAT :

```bash
iptables -t nat -A POSTROUTING -s 10.8.0.0/24 -o eth0 -j MASQUERADE
```

## 🐛 Dépannage

### Le serveur ne démarre pas

Si le serveur OpenVPN refuse de démarrer, vérifiez plusieurs points. Assurez-vous que le **port 1194 n'est pas déjà utilisé** par un autre service avec `netstat -tulpn | grep 1194`. Vérifiez que les **certificats sont correctement générés** dans `/etc/openvpn/easy-rsa/pki/`. Consultez les **logs du serveur** dans `/var/log/openvpn/openvpn.log` pour identifier l'erreur exacte. Vérifiez que le module **TUN/TAP est disponible** avec `ls /dev/net/tun`.

### Les clients ne peuvent pas se connecter

Les problèmes de connexion client proviennent généralement de la configuration réseau. Vérifiez que le **pare-feu autorise le trafic UDP sur le port 1194** avec `ufw status` ou `iptables -L`. Si votre serveur est derrière un NAT, assurez-vous que la **redirection de port est configurée** sur votre routeur. Vérifiez que l'**hôte public est correct** dans la configuration et accessible depuis Internet. Testez la **connectivité réseau** avec `ping` et `traceroute`.

### Erreur "ENOENT: no such file or directory, open '/var/log/openvpn/openvpn-status.log'"

Cette erreur apparaît lorsque le serveur OpenVPN n'est pas encore démarré ou n'a pas créé le fichier de statut. Pour la résoudre, créez manuellement le répertoire de logs avec `mkdir -p /var/log/openvpn`, démarrez le serveur OpenVPN avec `systemctl start openvpn@server`, et vérifiez que le fichier est créé avec `ls -la /var/log/openvpn/`.

## 📝 Développement

### Prérequis de développement

Pour contribuer au projet, vous aurez besoin de Node.js 18+ avec pnpm activé, Docker et Docker Compose, et un éditeur compatible TypeScript (VS Code recommandé).

### Installation locale

```bash
# Cloner le dépôt
git clone https://github.com/LHRICO78/ovpn-easy.git
cd ovpn-easy

# Installer les dépendances
pnpm install

# Configurer la base de données
pnpm db:push

# Démarrer le serveur de développement
pnpm dev
```

Le serveur de développement démarre sur `http://localhost:3000` avec rechargement automatique.

### Structure des commandes

- `pnpm dev` : Démarre le serveur de développement
- `pnpm build` : Compile l'application pour la production
- `pnpm db:push` : Applique les migrations de base de données
- `pnpm typecheck` : Vérifie les types TypeScript
- `pnpm lint` : Vérifie le code avec ESLint

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue pour signaler un bug ou proposer une nouvelle fonctionnalité. Pour contribuer du code, forkez le projet, créez une branche pour votre fonctionnalité, committez vos changements, et ouvrez une Pull Request.

## 📄 Licence

Ce projet est sous licence AGPL-3.0. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

Ce projet est inspiré de [wg-easy](https://github.com/wg-easy/wg-easy) par WeeJeWel et kaaax0815. OpenVPN est développé par OpenVPN Inc. Easy-RSA est maintenu par la communauté OpenVPN.

## ⚠️ Avertissement

Ce projet n'est pas affilié, associé, autorisé, approuvé par, ou officiellement connecté à OpenVPN Inc. "OpenVPN" est une marque déposée d'OpenVPN Inc.

