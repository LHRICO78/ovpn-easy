# Guide de Déploiement Docker

Ce guide explique comment déployer OpenVPN Easy avec Docker et Docker Compose.

## Prérequis

Avant de commencer, assurez-vous d'avoir installé sur votre serveur les éléments suivants :

- **Docker** version 20.10 ou supérieure
- **Docker Compose** version 2.0 ou supérieure
- Un serveur Linux (Ubuntu 20.04+ recommandé)
- Accès root ou sudo
- Port 1194 (UDP) ouvert dans le pare-feu
- Port 51821 (TCP) ouvert pour l'interface web

## Installation Rapide

La méthode la plus simple consiste à utiliser Docker Compose qui configure automatiquement la base de données et l'application.

### 1. Cloner le projet

```bash
git clone https://github.com/LHRICO78/ovpn-easy.git
cd ovpn-easy
```

### 2. Configurer les variables d'environnement

Copiez le fichier d'exemple et modifiez les valeurs selon votre configuration :

```bash
cp env.example .env
nano .env
```

Variables importantes à configurer :

```bash
# Votre nom de domaine ou IP publique
PUBLIC_HOST=vpn.example.com

# Mot de passe de la base de données (générez un mot de passe sécurisé)
DB_PASSWORD=votre_mot_de_passe_securise
DB_ROOT_PASSWORD=votre_root_password_securise

# Secret JWT (générez une chaîne aléatoire longue)
JWT_SECRET=votre_secret_jwt_tres_long_et_aleatoire
```

### 3. Lancer les services

```bash
docker-compose up -d
```

Cette commande va :
- Télécharger les images Docker nécessaires
- Créer et démarrer la base de données MySQL
- Construire et démarrer l'application OpenVPN Easy
- Configurer les volumes pour la persistance des données

### 4. Vérifier le statut

```bash
docker-compose ps
```

Vous devriez voir deux conteneurs en cours d'exécution :
- `ovpn-easy-db` (base de données)
- `ovpn-easy` (application)

### 5. Accéder à l'interface web

Ouvrez votre navigateur et accédez à :

```
http://votre-serveur:51821
```

## Configuration Avancée

### Ports personnalisés

Pour modifier les ports utilisés, éditez le fichier `.env` :

```bash
# Port OpenVPN (UDP)
OPENVPN_PORT=1194

# Port interface web (TCP)
WEB_PORT=51821
```

Puis redémarrez les services :

```bash
docker-compose down
docker-compose up -d
```

### Utiliser une base de données externe

Si vous avez déjà une base de données MySQL/TiDB, vous pouvez l'utiliser en modifiant la variable `DATABASE_URL` dans `.env` :

```bash
DATABASE_URL=mysql://user:password@host:3306/database
```

Puis commentez ou supprimez le service `db` dans `docker-compose.yml`.

### Volumes et persistance

Les données sont stockées dans des volumes Docker :

- `db-data` : Données de la base de données
- `openvpn-data` : Certificats et configuration OpenVPN
- `openvpn-logs` : Logs du serveur OpenVPN

Pour sauvegarder ces données :

```bash
docker run --rm -v ovpn-easy_openvpn-data:/data -v $(pwd):/backup alpine tar czf /backup/openvpn-backup.tar.gz /data
```

Pour restaurer :

```bash
docker run --rm -v ovpn-easy_openvpn-data:/data -v $(pwd):/backup alpine tar xzf /backup/openvpn-backup.tar.gz -C /
```

## Mise à jour

Pour mettre à jour l'application vers une nouvelle version :

```bash
# Récupérer les dernières modifications
git pull

# Reconstruire et redémarrer
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Logs et Dépannage

### Consulter les logs

```bash
# Logs de l'application
docker-compose logs -f ovpn-easy

# Logs de la base de données
docker-compose logs -f db

# Logs OpenVPN
docker exec ovpn-easy tail -f /var/log/openvpn/openvpn.log
```

### Problèmes courants

#### Le conteneur ne démarre pas

Vérifiez les logs :

```bash
docker-compose logs ovpn-easy
```

Assurez-vous que le module TUN/TAP est disponible :

```bash
ls -l /dev/net/tun
```

#### Impossible de se connecter au VPN

Vérifiez que le port UDP 1194 est ouvert :

```bash
sudo ufw allow 1194/udp
```

Vérifiez que le forwarding IP est activé :

```bash
sysctl net.ipv4.ip_forward
# Devrait retourner: net.ipv4.ip_forward = 1
```

#### Base de données inaccessible

Vérifiez que le conteneur de base de données est en cours d'exécution :

```bash
docker-compose ps db
```

Testez la connexion :

```bash
docker exec ovpn-easy-db mysql -u ovpn_user -p ovpn_easy
```

## Sécurité

### Recommandations de sécurité

Pour un déploiement en production, suivez ces recommandations essentielles :

1. **Générez des secrets forts** : Utilisez des générateurs de mots de passe pour `JWT_SECRET` et les mots de passe de base de données.

2. **Utilisez HTTPS** : Placez l'application derrière un reverse proxy (Nginx, Traefik) avec un certificat SSL/TLS.

3. **Limitez l'accès** : Configurez un pare-feu pour n'autoriser que les connexions nécessaires.

4. **Mettez à jour régulièrement** : Gardez Docker, les images et l'application à jour.

5. **Sauvegardez régulièrement** : Automatisez les sauvegardes des volumes Docker.

### Exemple avec Nginx et Let's Encrypt

Créez un fichier `nginx.conf` :

```nginx
server {
    listen 80;
    server_name vpn.example.com;
    
    location / {
        proxy_pass http://localhost:51821;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Puis obtenez un certificat SSL avec Certbot :

```bash
sudo certbot --nginx -d vpn.example.com
```

## Arrêt et suppression

### Arrêter les services

```bash
docker-compose stop
```

### Arrêter et supprimer les conteneurs

```bash
docker-compose down
```

### Supprimer également les volumes (⚠️ perte de données)

```bash
docker-compose down -v
```

## Support

Pour plus d'informations, consultez :
- [README.md](README.md) - Documentation générale
- [Issues GitHub](https://github.com/LHRICO78/ovpn-easy/issues) - Signaler un problème
- [Documentation OpenVPN](https://openvpn.net/community-resources/) - Documentation officielle OpenVPN

