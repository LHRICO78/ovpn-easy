import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download, QrCode, Power, PowerOff, Trash2 } from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

export default function ClientDetail() {
  const [, params] = useRoute("/clients/:id");
  const [, setLocation] = useLocation();
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const clientId = params?.id ? parseInt(params.id) : 0;

  const utils = trpc.useUtils();
  const { data: client, isLoading } = trpc.clients.get.useQuery(
    { id: clientId },
    { enabled: !!clientId }
  );
  const { data: stats } = trpc.clients.stats.useQuery(
    { id: clientId },
    { enabled: !!clientId }
  );
  const { data: qrData } = trpc.clients.getQRCode.useQuery(
    { id: clientId },
    { enabled: qrDialogOpen && !!clientId }
  );

  const toggleMutation = trpc.clients.toggle.useMutation({
    onSuccess: () => {
      utils.clients.get.invalidate({ id: clientId });
      utils.clients.list.invalidate();
      toast.success("Statut du client mis à jour");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => {
      toast.success("Client supprimé");
      setLocation("/clients");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const { data: configData } = trpc.clients.getConfig.useQuery(
    { id: clientId },
    { enabled: false }
  );

  const handleDownloadConfig = async () => {
    const result = await utils.clients.getConfig.fetch({ id: clientId });
    if (result?.config) {
      const blob = new Blob([result.config], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${client?.name || "client"}.ovpn`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("fr-FR");
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Client introuvable</p>
          <Button className="mt-4" onClick={() => setLocation("/clients")}>
            Retour à la liste
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/clients")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
              <p className="text-muted-foreground mt-1">{client.email || "Aucun email"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setQrDialogOpen(true)}>
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </Button>
            <Button variant="outline" onClick={handleDownloadConfig}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Adresse IP</p>
                  <p className="font-mono font-medium">{client.ipAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <Badge variant={client.enabled ? "default" : "secondary"}>
                    {client.enabled ? "Actif" : "Inactif"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Créé le</p>
                  <p className="text-sm">{formatDate(client.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expire le</p>
                  <p className="text-sm">{formatDate(client.expiresAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  toggleMutation.mutate({
                    id: client.id,
                    enabled: !client.enabled,
                  })
                }
                disabled={toggleMutation.isPending}
              >
                {client.enabled ? (
                  <>
                    <PowerOff className="h-4 w-4 mr-2" />
                    Désactiver le client
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4 mr-2" />
                    Activer le client
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => {
                  if (
                    confirm(
                      `Êtes-vous sûr de vouloir supprimer ${client.name} ?`
                    )
                  ) {
                    deleteMutation.mutate({ id: client.id });
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer le client
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historique des connexions</CardTitle>
            <CardDescription>
              Les 10 dernières connexions de ce client
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats && stats.length > 0 ? (
              <div className="space-y-4">
                {stats.map((stat) => (
                  <div
                    key={stat.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0"
                  >
                    <div>
                      <p className="font-medium">
                        {formatDate(stat.connectedAt)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {stat.realAddress || "Adresse inconnue"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        ↓ {formatBytes(stat.bytesReceived || 0)}
                      </p>
                      <p className="text-sm">
                        ↑ {formatBytes(stat.bytesSent || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Aucune connexion enregistrée
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code - {client.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrData?.qrCode ? (
              <>
                <img
                  src={qrData.qrCode}
                  alt="QR Code"
                  className="w-64 h-64 border rounded"
                />
                <p className="text-sm text-muted-foreground text-center">
                  Scannez ce QR code avec votre application OpenVPN pour
                  importer la configuration
                </p>
              </>
            ) : (
              <div className="w-64 h-64 flex items-center justify-center">
                <Skeleton className="w-full h-full" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

