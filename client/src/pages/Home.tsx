import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Activity, Server } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: serverStatus } = trpc.interface.status.useQuery();

  const statCards = [
    {
      title: "Total Clients",
      value: stats?.totalClients ?? 0,
      icon: Users,
      description: "Clients VPN créés",
    },
    {
      title: "Clients Actifs",
      value: stats?.enabledClients ?? 0,
      icon: UserCheck,
      description: "Clients activés",
    },
    {
      title: "Connectés",
      value: stats?.connectedClients ?? 0,
      icon: Activity,
      description: "Actuellement connectés",
    },
    {
      title: "Statut Serveur",
      value: serverStatus?.active ? "Actif" : "Inactif",
      icon: Server,
      description: "État du serveur OpenVPN",
      valueColor: serverStatus?.active ? "text-green-600" : "text-red-600",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Vue d'ensemble de votre serveur OpenVPN
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${stat.valueColor || ""}`}
                    >
                      {stat.value}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Bienvenue sur OpenVPN Easy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              OpenVPN Easy est une interface web intuitive pour gérer votre serveur
              OpenVPN. Vous pouvez créer, configurer et gérer vos clients VPN en
              quelques clics.
            </p>
            <div className="space-y-2">
              <h3 className="font-semibold">Fonctionnalités principales :</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Création et gestion de clients VPN</li>
                <li>Génération automatique de certificats</li>
                <li>Téléchargement de fichiers de configuration .ovpn</li>
                <li>Statistiques de connexion en temps réel</li>
                <li>Configuration du serveur OpenVPN</li>
                <li>Activation/désactivation des clients</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

