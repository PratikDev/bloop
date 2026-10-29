"""Team decisions on validation results (dated), applied when validation.json is saved and when layers get their status.
A decision never changes a number or a threshold: it sets how a result is shipped and what the record says. Statements
are templates filled from the check's own metrics (no hand-typed numbers)."""

STATUSES = ("verified", "values with stated error", "relative", "pattern only", "visual texture", "insufficient data", "no check")

DECISIONS = {
    ("air_5533", "a_nox_geoscf"): {
        "on": "2026-10-29", "status": "values with stated error",
        "statement": "values; median error {median_rel_error:.1%} vs GEOS-CF v1",
        "table": "threshold missed; accepted explicitly by the team on 29 Oct 2026"},
    ("air_5533", "a_pm25_geoscf"): {
        "on": "2026-10-29", "status": "relative",
        "statement": "relative PM2.5: pattern and timing verified (ρ {spearman_decoded:.3f}), absolute scale not verified "
                     "(frame ≈ {ratio:.2f} × GEOS-CF v1)",
        "table": "threshold missed; shipped as relative values (team decision 29 Oct 2026)",
        "unless": "pm25_match"},                       # superseded if the variable search finds a ~1× match
    ("air_5533", "b_pm25_dhaka_ground"): {
        "on": "2026-10-29", "status": "insufficient data",
        "statement": "insufficient ground data ({stations_with_data} of {sensors_listed} sensors had data)",
        "table": "insufficient ground data; not reported as a correlation"},
    ("currents_3912", "b_direction_oscar"): {
        "on": "2026-10-29", "status": "visual texture",
        "statement": "pattern of the drawing, not water speed (direction vs OSCAR {median_deg_combined:.1f}°)",
        "table": "threshold missed; frame motion kept only as labelled visual texture, the currents voice plays NASA OSCAR"},
    ("currents_3912", "b2_direction_consecutive"): {
        "on": "2026-10-29", "status": "visual texture",
        "statement": "consecutive frames vs OSCAR: {median_deg_per_pair:.1f}° per pair, {median_deg_summed:.1f}° summed (chance 90°)",
        "table": "threshold missed (> 45°): the currents voice plays NASA OSCAR; frame flow is visual texture only"},
}

def apply(record, check, flags=()):
    """The check with its decision attached (statement filled from its metrics), or unchanged."""
    d = DECISIONS.get((record, check["id"]))
    if not d or d.get("unless") in flags: return check
    m = {k: v for k, v in check["metrics"].items() if not isinstance(v, (dict, list))}
    if "median_log10_ratio" in m: m["ratio"] = 10 ** m["median_log10_ratio"]          # median frame/model ratio
    return {**check, "decision": {"on": d["on"], "status": d["status"], "statement": d["statement"].format(**m), "table": d["table"]}}
