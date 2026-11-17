export interface UserHierarchy {
  rank_id: number;
  rank_name: string;
  designation: string;
  department: string;
  zone_code: string | null;
  region_code: string | null;
  territory_code: string | null;
  isNational: boolean;
  isZoneRestricted: boolean;
  isRegionRestricted: boolean;
}

export const getUserHierarchy = (): UserHierarchy | null => {
  try {
    const raw = localStorage.getItem("DAgent_user_hierarchy");
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    const rank_id = Number(parsed.rank_id) || 4;
    const zone = parsed.zone_code && String(parsed.zone_code).trim().toUpperCase() !== "ALL"
      ? String(parsed.zone_code).trim()
      : null;
    const region = parsed.region_code && String(parsed.region_code).trim().toUpperCase() !== "ALL"
      ? String(parsed.region_code).trim()
      : null;
    const territory = parsed.territory_code && String(parsed.territory_code).trim().toUpperCase() !== "ALL"
      ? String(parsed.territory_code).trim()
      : null;

    const isNational = rank_id === 1 || !zone;
    const isZoneRestricted = !isNational && !!zone;
    const isRegionRestricted = isZoneRestricted && !!region;

    return {
      rank_id,
      rank_name: parsed.rank_name || (rank_id === 1 ? "National Head" : rank_id === 2 ? "Zonal Head" : rank_id === 3 ? "Regional Manager" : "Field Executive"),
      designation: parsed.designation || "",
      department: parsed.department || "",
      zone_code: zone,
      region_code: region,
      territory_code: territory,
      isNational,
      isZoneRestricted,
      isRegionRestricted,
    };
  } catch (e) {
    console.error("Failed to parse user hierarchy:", e);
    return null;
  }
};
