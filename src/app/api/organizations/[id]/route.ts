import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { organizationUpdateSchema } from "@/lib/domain";
import { resolveLocationCoordinates } from "@/lib/geo";
import { writeAudit } from "@/lib/server/audit";
import { HttpError, jsonError, requireOrganizationRole, requireUser } from "@/lib/server/http";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const doc = await adminDb.doc(`organizations/${id}`).get();
    if (!doc.exists) throw new HttpError(404, "NOT_FOUND", "Organization not found.");
    return NextResponse.json({ organization: { id: doc.id, ...doc.data() } });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser(request);
    const { id } = await context.params;

    if (!auth.admin) {
      await requireOrganizationRole(id, auth.uid, ["OWNER"]);
    }

    const input = organizationUpdateSchema.parse(await request.json());
    const orgRef = adminDb.doc(`organizations/${id}`);
    const existing = await orgRef.get();
    if (!existing.exists) throw new HttpError(404, "NOT_FOUND", "Organization not found.");

    const coarseLocation = input.coarseLocation ?? existing.get("coarseLocation");
    const coordinates = resolveLocationCoordinates(
      coarseLocation?.township,
      coarseLocation?.stateRegion,
      input.coordinates ?? existing.get("coordinates"),
    );

    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
      ...(input.name ? { name: input.name } : {}),
      ...(input.type ? { type: input.type } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.coarseLocation ? { coarseLocation: input.coarseLocation } : {}),
      coordinates,
    };

    await orgRef.update(updateData);
    await writeAudit(auth.uid, "ORGANIZATION_UPDATED", "ORGANIZATION", id, {
      name: input.name ?? null,
      type: input.type ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser(request);
    const { id } = await context.params;

    if (!auth.admin) {
      await requireOrganizationRole(id, auth.uid, ["OWNER"]);
    }

    const orgRef = adminDb.doc(`organizations/${id}`);
    const existing = await orgRef.get();
    if (!existing.exists) throw new HttpError(404, "NOT_FOUND", "Organization not found.");

    // Delete members associated with this organization
    const members = await adminDb.collection("organizationMembers").where("organizationId", "==", id).get();
    const batch = adminDb.batch();
    for (const member of members.docs) {
      batch.delete(member.ref);
    }
    batch.delete(orgRef);
    await batch.commit();

    await writeAudit(auth.uid, "ORGANIZATION_DELETED", "ORGANIZATION", id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
