import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as openvpn from "./openvpn";
import { generateQRCode } from "./qrcode";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Interface (Server) configuration
  interface: router({
    get: protectedProcedure.query(async () => {
      return await db.getInterface();
    }),

    update: protectedProcedure
      .input(
        z.object({
          port: z.number().min(1).max(65535).optional(),
          protocol: z.enum(["udp", "tcp"]).optional(),
          network: z.string().optional(),
          netmask: z.string().optional(),
          dns1: z.string().optional(),
          dns2: z.string().optional(),
          compression: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const currentInterface = await db.getInterface();
        await db.updateInterface(currentInterface.id, input);

        // Regenerate server config
        const updatedInterface = await db.getInterface();
        await openvpn.generateServerConfig({
          port: updatedInterface.port,
          protocol: updatedInterface.protocol,
          network: updatedInterface.network,
          netmask: updatedInterface.netmask,
          dns1: updatedInterface.dns1 || undefined,
          dns2: updatedInterface.dns2 || undefined,
          compression: updatedInterface.compression,
        });

        return { success: true };
      }),

    restart: protectedProcedure.mutation(async () => {
      await openvpn.restartServer();
      return { success: true };
    }),

    status: protectedProcedure.query(async () => {
      const isActive = await openvpn.getServerStatus();
      return { active: isActive };
    }),
  }),

  // Server configuration
  serverConfig: router({
    get: protectedProcedure.query(async () => {
      return await db.getServerConfig();
    }),

    update: protectedProcedure
      .input(
        z.object({
          publicHost: z.string().optional(),
          publicPort: z.number().min(1).max(65535).optional(),
          preUp: z.string().optional(),
          postUp: z.string().optional(),
          preDown: z.string().optional(),
          postDown: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const config = await db.getServerConfig();
        await db.updateServerConfig(config.id, input);
        return { success: true };
      }),
  }),

  // Client management
  clients: router({
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const client = await db.getClientById(input.id);

        if (!client) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (ctx.user.role !== "admin" && client.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        return client;
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const isAdmin = ctx.user.role === "admin";
      const clients = await db.getClients(isAdmin ? undefined : ctx.user.id);

      // Get connected clients info
      const connectedClients = await openvpn.getConnectedClients();

      return clients.map((client) => {
        const connected = connectedClients.find(
          (c) => c.commonName === `client_${client.id}`
        );

        return {
          ...client,
          connected: !!connected,
          realAddress: connected?.realAddress || null,
          bytesReceived: connected?.bytesReceived || 0,
          bytesSent: connected?.bytesSent || 0,
          connectedSince: connected?.connectedSince || null,
        };
      });
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          email: z.string().email().optional(),
          expiresInDays: z.number().int().positive().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Get existing clients to find next available IP
        const existingClients = await db.getClients();
        const existingIPs = existingClients.map((c) => c.ipAddress);
        const vpnInterface = await db.getInterface();

        const ipAddress = openvpn.getNextAvailableIP(
          vpnInterface.network,
          existingIPs
        );

        // Generate certificate
        const { cert, key, clientName } = await openvpn.generateClientCertificate(
          `client_${Date.now()}`
        );

        // Create client in database
        await db.createClient({
          userId: ctx.user.id,
          name: input.name,
          email: input.email,
          ipAddress,
          certificateData: cert,
          privateKeyData: key,
          expiresAt: input.expiresInDays
            ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
            : null,
          enabled: true,
        });

        return { success: true };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(255).optional(),
          email: z.string().email().optional(),
          expiresAt: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const client = await db.getClientById(input.id);

        if (!client) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (ctx.user.role !== "admin" && client.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const { id, ...updateData } = input;
        await db.updateClient(id, {
          ...updateData,
          expiresAt: updateData.expiresAt ? new Date(updateData.expiresAt) : undefined,
        });

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const client = await db.getClientById(input.id);

        if (!client) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (ctx.user.role !== "admin" && client.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await db.deleteClient(input.id);

        return { success: true };
      }),

    toggle: protectedProcedure
      .input(z.object({ id: z.number(), enabled: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        const client = await db.getClientById(input.id);

        if (!client) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (ctx.user.role !== "admin" && client.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await db.toggleClient(input.id, input.enabled);

        return { success: true };
      }),

    getConfig: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const client = await db.getClientById(input.id);

        if (!client) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (ctx.user.role !== "admin" && client.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        if (!client.certificateData || !client.privateKeyData) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Client certificates not found",
          });
        }

        const serverConfig = await db.getServerConfig();
        const vpnInterface = await db.getInterface();

        const config = await openvpn.generateClientConfig({
          clientName: `client_${client.id}`,
          publicHost: serverConfig.publicHost,
          publicPort: serverConfig.publicPort,
          protocol: vpnInterface.protocol,
          cert: client.certificateData,
          key: client.privateKeyData,
          compression: vpnInterface.compression,
        });

        return { config };
      }),

    stats: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const client = await db.getClientById(input.id);

        if (!client) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (ctx.user.role !== "admin" && client.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const stats = await db.getClientStats(input.id);

        return stats;
      }),

    getQRCode: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const client = await db.getClientById(input.id);

        if (!client) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (ctx.user.role !== "admin" && client.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        if (!client.certificateData || !client.privateKeyData) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Client certificates not found",
          });
        }

        const serverConfig = await db.getServerConfig();
        const vpnInterface = await db.getInterface();

        const config = await openvpn.generateClientConfig({
          clientName: `client_${client.id}`,
          publicHost: serverConfig.publicHost,
          publicPort: serverConfig.publicPort,
          protocol: vpnInterface.protocol,
          cert: client.certificateData,
          key: client.privateKeyData,
          compression: vpnInterface.compression,
        });

        const qrCode = await generateQRCode(config);

        return { qrCode };
      }),
  }),

  // Dashboard stats
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      const isAdmin = ctx.user.role === "admin";
      const clients = await db.getClients(isAdmin ? undefined : ctx.user.id);
      const connectedClients = await openvpn.getConnectedClients();
      const activeConnections = await db.getActiveConnections();

      return {
        totalClients: clients.length,
        enabledClients: clients.filter((c) => c.enabled).length,
        connectedClients: connectedClients.length,
        activeConnections: activeConnections.length,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;

