import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Power } from "lucide-react";
import { toast } from "sonner";

export default function Server() {
  const utils = trpc.useUtils();
  const { data: serverStatus, isLoading } = trpc.interface.status.useQuery();

  const restartMutation = trpc.interface.restart.useMutation({
    onSuccess: () => {
      utils.interface.status.invalidate();
      toast.success("Serveur redémarré avec succès");
    },
    onError: (error) => {
      toast.error(`Erreur lors du redémarrage: ${error.message}`);
    },
  });

  const handleRestart = () => {
    if (
      confirm(
        "Êtes-vous sûr de vouloir redémarrer le serveur OpenVPN ? Tous les clients connectés seront déconnectés."
      )
    ) {
      restartMutation.mutate();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Serveur OpenVPN</h1>
          <p className="text-muted-foreground mt-2">
            Gérez le serveur OpenVPN
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>État du Serveur</CardTitle>
            <CardDescription>
              Statut actuel du serveur OpenVPN
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Power
                  className={`h-8 w-8 ${
                    serverStatus?.active ? "text-green-600" : "text-red-600"
                  }`}
                />
                <div>
                  <p className="font-semibold text-lg">
                    {isLoading ? "Vérification..." : serverStatus?.active ? "Actif" : "Inactif"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {serverStatus?.active
                      ? "Le serveur OpenVPN fonctionne correctement"
                      : "Le serveur OpenVPN est arrêté"}
                  </p>
                </div>
              </div>
              <Badge
                variant={serverStatus?.active ? "default" : "secondary"}
                className={`text-sm px-4 py-2 ${
                  serverStatus?.active ? "bg-green-600" : ""
                }`}
              >
                {serverStatus?.active ? "EN LIGNE" : "HORS LIGNE"}
              </Badge>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={handleRestart}
                disabled={restartMutation.isPending || isLoading}
                variant="outline"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    restartMutation.isPending ? "animate-spin" : ""
                  }`}
                />
                {restartMutation.isPending ? "Redémarrage..." : "Redémarrer le Serveur"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Gestion du Serveur</h3>
              <p className="text-sm text-muted-foreground">
                Le serveur OpenVPN gère toutes les connexions VPN. Utilisez le bouton de redémarrage
                pour appliquer les modifications de configuration ou résoudre les problèmes de connexion.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Logs du Serveur</h3>
              <p className="text-sm text-muted-foreground">
                Les logs du serveur sont disponibles dans <code className="text-xs bg-muted px-1 py-0.5 rounded">/var/log/openvpn/</code>
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Fichier de Configuration</h3>
              <p className="text-sm text-muted-foreground">
                La configuration du serveur est stockée dans <code className="text-xs bg-muted px-1 py-0.5 rounded">/etc/openvpn/server.conf</code>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dépannage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Le serveur ne démarre pas</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Vérifiez que le port n'est pas déjà utilisé</li>
                <li>Assurez-vous que les certificats sont correctement générés</li>
                <li>Consultez les logs pour plus de détails</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Les clients ne peuvent pas se connecter</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Vérifiez que le pare-feu autorise le trafic sur le port OpenVPN</li>
                <li>Assurez-vous que la redirection de port est correctement configurée</li>
                <li>Vérifiez que l'hôte public est accessible depuis Internet</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

