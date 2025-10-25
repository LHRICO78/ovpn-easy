import { exec } from "child_process";
import { promisify } from "util";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const execAsync = promisify(exec);

const OPENVPN_DIR = "/etc/openvpn";
const EASY_RSA_DIR = "/etc/openvpn/easy-rsa";
const PKI_DIR = `${EASY_RSA_DIR}/pki`;

/**
 * Initialize Easy-RSA PKI if not exists
 */
export async function initPKI() {
  if (!existsSync(EASY_RSA_DIR)) {
    await mkdir(EASY_RSA_DIR, { recursive: true });
    await execAsync(`cp -r /usr/share/easy-rsa/* ${EASY_RSA_DIR}/`);
  }

  if (!existsSync(PKI_DIR)) {
    await execAsync(`cd ${EASY_RSA_DIR} && ./easyrsa init-pki`);
    await execAsync(`cd ${EASY_RSA_DIR} && ./easyrsa --batch build-ca nopass`);
    await execAsync(`cd ${EASY_RSA_DIR} && ./easyrsa gen-dh`);
    await execAsync(`cd ${EASY_RSA_DIR} && ./easyrsa build-server-full server nopass`);
    await execAsync(`openvpn --genkey secret ${PKI_DIR}/ta.key`);
  }
}

/**
 * Generate client certificate and key
 */
export async function generateClientCertificate(clientName: string) {
  await initPKI();
  
  const sanitizedName = clientName.replace(/[^a-zA-Z0-9_-]/g, "_");
  
  await execAsync(
    `cd ${EASY_RSA_DIR} && ./easyrsa build-client-full ${sanitizedName} nopass`
  );

  const certPath = `${PKI_DIR}/issued/${sanitizedName}.crt`;
  const keyPath = `${PKI_DIR}/private/${sanitizedName}.key`;

  const cert = await readFile(certPath, "utf-8");
  const key = await readFile(keyPath, "utf-8");

  return { cert, key, clientName: sanitizedName };
}

/**
 * Revoke client certificate
 */
export async function revokeClientCertificate(clientName: string) {
  await execAsync(`cd ${EASY_RSA_DIR} && ./easyrsa revoke ${clientName}`);
  await execAsync(`cd ${EASY_RSA_DIR} && ./easyrsa gen-crl`);
}

/**
 * Get CA certificate
 */
export async function getCACertificate() {
  await initPKI();
  return await readFile(`${PKI_DIR}/ca.crt`, "utf-8");
}

/**
 * Get TLS auth key
 */
export async function getTLSAuthKey() {
  await initPKI();
  return await readFile(`${PKI_DIR}/ta.key`, "utf-8");
}

/**
 * Generate OpenVPN server configuration
 */
export async function generateServerConfig(config: {
  port: number;
  protocol: "udp" | "tcp";
  network: string;
  netmask: string;
  dns1?: string;
  dns2?: string;
  compression: boolean;
}) {
  const lines = [
    `port ${config.port}`,
    `proto ${config.protocol}`,
    `dev tun`,
    `ca ${PKI_DIR}/ca.crt`,
    `cert ${PKI_DIR}/issued/server.crt`,
    `key ${PKI_DIR}/private/server.key`,
    `dh ${PKI_DIR}/dh.pem`,
    `tls-auth ${PKI_DIR}/ta.key 0`,
    `server ${config.network} ${config.netmask}`,
    `ifconfig-pool-persist /var/log/openvpn/ipp.txt`,
    `keepalive 10 120`,
    `cipher AES-256-GCM`,
    `auth SHA256`,
    `user nobody`,
    `group nogroup`,
    `persist-key`,
    `persist-tun`,
    `status /var/log/openvpn/openvpn-status.log`,
    `log-append /var/log/openvpn/openvpn.log`,
    `verb 3`,
    `explicit-exit-notify 1`,
  ];

  if (config.dns1) {
    lines.push(`push "dhcp-option DNS ${config.dns1}"`);
  }
  if (config.dns2) {
    lines.push(`push "dhcp-option DNS ${config.dns2}"`);
  }

  if (config.compression) {
    lines.push(`compress lz4-v2`);
    lines.push(`push "compress lz4-v2"`);
  }

  lines.push(`push "redirect-gateway def1 bypass-dhcp"`);

  const configContent = lines.join("\n");
  await writeFile(`${OPENVPN_DIR}/server.conf`, configContent);

  return configContent;
}

/**
 * Generate client configuration file (.ovpn)
 */
export async function generateClientConfig(params: {
  clientName: string;
  publicHost: string;
  publicPort: number;
  protocol: "udp" | "tcp";
  cert: string;
  key: string;
  compression: boolean;
}) {
  const ca = await getCACertificate();
  const tlsAuth = await getTLSAuthKey();

  const lines = [
    `client`,
    `dev tun`,
    `proto ${params.protocol}`,
    `remote ${params.publicHost} ${params.publicPort}`,
    `resolv-retry infinite`,
    `nobind`,
    `persist-key`,
    `persist-tun`,
    `remote-cert-tls server`,
    `cipher AES-256-GCM`,
    `auth SHA256`,
    `key-direction 1`,
    `verb 3`,
  ];

  if (params.compression) {
    lines.push(`compress lz4-v2`);
  }

  lines.push(`<ca>`);
  lines.push(ca.trim());
  lines.push(`</ca>`);

  lines.push(`<cert>`);
  lines.push(params.cert.trim());
  lines.push(`</cert>`);

  lines.push(`<key>`);
  lines.push(params.key.trim());
  lines.push(`</key>`);

  lines.push(`<tls-auth>`);
  lines.push(tlsAuth.trim());
  lines.push(`</tls-auth>`);

  return lines.join("\n");
}

/**
 * Start OpenVPN server
 */
export async function startServer() {
  try {
    await execAsync(`systemctl start openvpn@server`);
  } catch (error) {
    console.error("Failed to start OpenVPN:", error);
    throw error;
  }
}

/**
 * Stop OpenVPN server
 */
export async function stopServer() {
  try {
    await execAsync(`systemctl stop openvpn@server`);
  } catch (error) {
    console.error("Failed to stop OpenVPN:", error);
    throw error;
  }
}

/**
 * Restart OpenVPN server
 */
export async function restartServer() {
  try {
    await execAsync(`systemctl restart openvpn@server`);
  } catch (error) {
    console.error("Failed to restart OpenVPN:", error);
    throw error;
  }
}

/**
 * Get OpenVPN server status
 */
export async function getServerStatus() {
  try {
    const { stdout } = await execAsync(`systemctl is-active openvpn@server`);
    return stdout.trim() === "active";
  } catch {
    return false;
  }
}

/**
 * Parse OpenVPN status file to get connected clients
 */
export async function getConnectedClients() {
  try {
    // Check if file exists first
    if (!existsSync("/var/log/openvpn/openvpn-status.log")) {
      return [];
    }

    const statusContent = await readFile(
      "/var/log/openvpn/openvpn-status.log",
      "utf-8"
    );

    const lines = statusContent.split("\n");
    const clients: Array<{
      commonName: string;
      realAddress: string;
      bytesReceived: number;
      bytesSent: number;
      connectedSince: Date;
    }> = [];

    let inClientSection = false;

    for (const line of lines) {
      if (line.startsWith("Common Name,")) {
        inClientSection = true;
        continue;
      }

      if (line.startsWith("ROUTING TABLE")) {
        inClientSection = false;
        break;
      }

      if (inClientSection && line.trim()) {
        const parts = line.split(",");
        if (parts.length >= 5) {
          clients.push({
            commonName: parts[0],
            realAddress: parts[1],
            bytesReceived: parseInt(parts[2]) || 0,
            bytesSent: parseInt(parts[3]) || 0,
            connectedSince: new Date(parts[4]),
          });
        }
      }
    }

    return clients;
  } catch (error) {
    console.error("Failed to read OpenVPN status:", error);
    return [];
  }
}

/**
 * Get next available IP address from the network
 */
export function getNextAvailableIP(
  network: string,
  existingIPs: string[]
): string {
  const parts = network.split(".");
  const baseIP = `${parts[0]}.${parts[1]}.${parts[2]}`;

  for (let i = 2; i < 254; i++) {
    const ip = `${baseIP}.${i}`;
    if (!existingIPs.includes(ip)) {
      return ip;
    }
  }

  throw new Error("No available IP addresses in the network");
}

