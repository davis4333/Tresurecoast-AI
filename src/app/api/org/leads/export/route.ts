import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext } from "@/lib/auth/getOrgContext";
import { z } from "zod";

const MAX_EXPORT_LEADS = 5000;

const querySchema = z.object({
  days: z.coerce.number().min(1).max(365).optional(),
  status: z.enum(["NEW", "CONTACTED", "BOOKED", "CLOSED"]).optional(),
  temperature: z.enum(["HOT", "WARM", "COLD"]).optional(),
  serviceId: z.coerce.number().optional(),
  search: z.string().max(100).optional(),
});

function escapeCsvValue(val: string | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateNotes(notes: string | null, maxLength = 200): string {
  if (!notes) return '';
  if (notes.length <= maxLength) return notes;
  return notes.slice(0, maxLength) + '...';
}

export async function GET(request: NextRequest) {
  const ctx = await getOrgContext({ request });

  if (!ctx.ok) {
    return new Response(
      JSON.stringify({ ok: false, error: ctx.error, message: ctx.message }),
      { status: ctx.status, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { searchParams } = new URL(request.url);
  const parseResult = querySchema.safeParse({
    days: searchParams.get("days") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    temperature: searchParams.get("temperature") ?? undefined,
    serviceId: searchParams.get("serviceId") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  });

  if (!parseResult.success) {
    return new Response(
      JSON.stringify({ ok: false, error: "invalid_params", message: parseResult.error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { days, status, temperature, serviceId, search } = parseResult.data;

  const dateFilter = days
    ? { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
    : undefined;

  const searchFilter = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const whereClause = {
    organizationId: ctx.org.id,
    ...(dateFilter && { createdAt: dateFilter }),
    ...(status && { status }),
    ...(temperature && { temperature }),
    ...(serviceId && { serviceId }),
    ...searchFilter,
  };

  const leads = await prisma.lead.findMany({
    where: whereClause,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: MAX_EXPORT_LEADS,
    select: {
      name: true,
      email: true,
      phone: true,
      status: true,
      notes: true,
      score: true,
      temperature: true,
      createdAt: true,
      service: {
        select: {
          name: true,
        },
      },
      bot: {
        select: {
          name: true,
        },
      },
    },
  });

  const headers = [
    "Created At",
    "Name",
    "Email",
    "Phone",
    "Status",
    "Temperature",
    "Score",
    "Service",
    "Bot",
    "Notes",
  ];

  const rows = leads.map((lead) => [
    escapeCsvValue(formatDate(lead.createdAt)),
    escapeCsvValue(lead.name),
    escapeCsvValue(lead.email),
    escapeCsvValue(lead.phone),
    escapeCsvValue(lead.status),
    escapeCsvValue(lead.temperature),
    escapeCsvValue(String(lead.score)),
    escapeCsvValue(lead.service?.name),
    escapeCsvValue(lead.bot.name),
    escapeCsvValue(truncateNotes(lead.notes)),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return new Response(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="leads-export.csv"',
    },
  });
}
