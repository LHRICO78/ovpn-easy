#!/bin/bash
set -e

echo "Starting OpenVPN Easy..."

# Create log directory if it doesn't exist
mkdir -p /var/log/openvpn

# Initialize Easy-RSA PKI if not exists
if [ ! -d "/etc/openvpn/easy-rsa/pki" ]; then
    echo "Initializing PKI..."
    cd /etc/openvpn/easy-rsa
    ./easyrsa init-pki
    echo "Building CA..."
    ./easyrsa --batch build-ca nopass
    echo "Generating DH parameters..."
    ./easyrsa gen-dh
    echo "Building server certificate..."
    ./easyrsa build-server-full server nopass
    echo "Generating TLS auth key..."
    openvpn --genkey secret pki/ta.key
    echo "PKI initialization complete"
fi

# Enable IP forwarding
echo 1 > /proc/sys/net/ipv4/ip_forward

# Start the application
exec "$@"

