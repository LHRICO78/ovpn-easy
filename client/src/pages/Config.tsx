import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Config() {
  const utils = trpc.useUtils();
  const { data: serverConfig, isLoading: configLoading } = trpc.serverConfig.get.useQuery();
  const { data: vpnInterface, isLoading: interfaceLoading } = trpc.interface.get.useQuery();

  const [publicHost, setPublicHost] = useState("");
  const [publicPort, setPublicPort] = useState(1194);

  useEffect(() => {
    if (serverConfig) {
      setPublicHost(serverConfig.publicHost);
      setPublicPort(serverConfig.publicPort);
    }
  }, [serverConfig]);

  const updateConfigMutation = trpc.serverConfig.update.useMutation({
    onSuccess: () => {
      utils.serverConfig.get.invalidate();
      toast.success("Configuration mise à jour");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleSaveConfig = () => {
    if (!publicHost.trim()) {
      toast.error("L'hôte public est requis");
      return;
    }

    updateConfigMutation.mutate({
      publicHost,
      publicPort,
    });
  };

  const isLoading = configLoading || interfaceLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>
          <p className="text-muted-foreground mt-2">
            Configurez les paramètres de votre serveur OpenVPN
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Publique</CardTitle>
                <CardDescription>
                  Ces paramètres sont utilisés dans les fichiers de configuration des clients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="publicHost">Hôte Public *</Label>
                  <Input
                    id="publicHost"
                    placeholder="vpn.example.com"
                    value={publicHost}
                    onChange={(e) => setPublicHost(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    L'adresse IP publique ou le nom de domaine de votre serveur
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publicPort">Port Public</Label>
                  <Input
                    id="publicPort"
                    type="number"
                    min="1"
                    max="65535"
                    value={publicPort}
                    onChange={(e) => setPublicPort(parseInt(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Le port sur lequel le serveur OpenVPN écoute
                  </p>
                </div>

                <Button
                  onClick={handleSaveConfig}
                  disabled={updateConfigMutation.isPending}
                >
                  {updateConfigMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Paramètres du Serveur</CardTitle>
                <CardDescription>
                  Configuration actuelle du serveur OpenVPN
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Port</Label>
                    <p className="font-medium">{vpnInterface?.port}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Protocole</Label>
                    <p className="font-medium uppercase">{vpnInterface?.protocol}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Réseau</Label>
                    <p className="font-medium">{vpnInterface?.network}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Masque</Label>
                    <p className="font-medium">{vpnInterface?.netmask}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">DNS 1</Label>
                    <p className="font-medium">{vpnInterface?.dns1 || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">DNS 2</Label>
                    <p className="font-medium">{vpnInterface?.dns2 || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Compression</Label>
                    <p className="font-medium">
                      {vpnInterface?.compression ? "Activée" : "Désactivée"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Instructions d'installation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Prérequis</h3>
                  <p className="text-sm text-muted-foreground">
                    Assurez-vous que votre serveur dispose d'OpenVPN et Easy-RSA installés.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Configuration du pare-feu</h3>
                  <p className="text-sm text-muted-foreground">
                    Ouvrez le port {vpnInterface?.port} ({vpnInterface?.protocol?.toUpperCase()}) dans votre pare-feu.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Redirection de port</h3>
                  <p className="text-sm text-muted-foreground">
                    Si votre serveur est derrière un NAT, configurez la redirection de port vers {vpnInterface?.port}.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

