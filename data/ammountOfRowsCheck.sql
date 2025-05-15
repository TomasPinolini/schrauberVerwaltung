/* Adjust the list of tables or add more UNION ALL blocks as needed */
SELECT *
FROM (
    /* ── MFV23_Halle101_11461CP_Linie ─────────────────────────── */
    SELECT
        'MFV23_Halle101_11461CP_Linie' AS TableName,
        tot.TotalRows,
        dis.DistinctRows,
        tot.TotalRows - dis.DistinctRows AS DuplicateRows
    FROM (
        SELECT COUNT(*) AS TotalRows
        FROM dbo.MFV23_Halle101_11461CP_Linie
        WHERE Datum > '2025-04-11 07:50:17'
    ) AS tot
    CROSS JOIN (
        SELECT COUNT(*) AS DistinctRows
        FROM (
            SELECT DISTINCT ID_Code, Datum
            FROM dbo.MFV23_Halle101_11461CP_Linie
		 WHERE Datum > '2025-04-11 07:50:17'
        ) AS x
    ) AS dis

    UNION ALL
    /* ── MFV23_Halle101_114227CP_link_Linie ───────────────────── */
    SELECT
        'MFV23_Halle101_114227CP_link_Linie',
        tot.TotalRows,
        dis.DistinctRows,
        tot.TotalRows - dis.DistinctRows
    FROM (
        SELECT COUNT(*) AS TotalRows
        FROM dbo.MFV23_Halle101_114227CP_link_Linie
        WHERE Datum > '2025-04-07 13:27:08'
    ) AS tot
    CROSS JOIN (
        SELECT COUNT(*) AS DistinctRows
        FROM (
            SELECT DISTINCT ID_Code, Datum
            FROM dbo.MFV23_Halle101_114227CP_link_Linie
            WHERE Datum > '2025-04-07 13:27:08'
        ) AS x
    ) AS dis

    UNION ALL
    /* ── MFV23_Halle101_114227CP_recht_Linie ──────────────────── */
    SELECT
        'MFV23_Halle101_114227CP_recht_Linie',
        tot.TotalRows,
        dis.DistinctRows,
        tot.TotalRows - dis.DistinctRows
    FROM (
        SELECT COUNT(*) AS TotalRows
        FROM dbo.MFV23_Halle101_114227CP_recht_Linie
        WHERE Datum > '2025-04-08 05:54:29'
    ) AS tot
    CROSS JOIN (
        SELECT COUNT(*) AS DistinctRows
        FROM (
            SELECT DISTINCT ID_Code, Datum
            FROM dbo.MFV23_Halle101_114227CP_recht_Linie
            WHERE Datum > '2025-04-08 05:54:29'
        ) AS x
    ) AS dis

    UNION ALL
    /* ── MOE61_Halle206_BGGF1GF3_Linie ────────────────────────── */
    SELECT
        'MOE61_Halle206_BGGF1GF3_Linie',
        tot.TotalRows,
        dis.DistinctRows,
        tot.TotalRows - dis.DistinctRows
    FROM (
        SELECT COUNT(*) AS TotalRows
        FROM dbo.MOE61_Halle206_BGGF1GF3_Linie
        WHERE Datum > '2025-04-10 07:24:12'
    ) AS tot
    CROSS JOIN (
        SELECT COUNT(*) AS DistinctRows
        FROM (
            SELECT DISTINCT ID_Code, Datum
            FROM dbo.MOE61_Halle206_BGGF1GF3_Linie
            WHERE Datum > '2025-04-10 07:24:12'
        ) AS x
    ) AS dis

    UNION ALL
    /* ── MOE61_Halle207_BEM_Linie ─────────────────────────────── */
    SELECT
        'MOE61_Halle207_BEM_Linie',
        tot.TotalRows,
        dis.DistinctRows,
        tot.TotalRows - dis.DistinctRows
    FROM (
        SELECT COUNT(*) AS TotalRows
        FROM dbo.MOE61_Halle207_BEM_Linie
        WHERE Datum > '2025-04-08 07:06:15'
    ) AS tot
    CROSS JOIN (
        SELECT COUNT(*) AS DistinctRows
        FROM (
            SELECT DISTINCT ID_Code, Datum
            FROM dbo.MOE61_Halle207_BEM_Linie
            WHERE Datum > '2025-04-08 07:06:15'
        ) AS x
    ) AS dis

    UNION ALL
    /* ── MFV3_Halle204_Rest_CH_Linie ──────────────────────────── */
    SELECT
        'MFV3_Halle204_Rest_CH_Linie',
        tot.TotalRows,
        dis.DistinctRows,
        tot.TotalRows - dis.DistinctRows
    FROM (
        SELECT COUNT(*) AS TotalRows
        FROM dbo.MFV3_Halle204_Rest_CH_Linie
        WHERE Datum > '2025-04-08 07:03:08'
    ) AS tot
    CROSS JOIN (
        SELECT COUNT(*) AS DistinctRows
        FROM (
            SELECT DISTINCT ID_Code, Datum
            FROM dbo.MFV3_Halle204_Rest_CH_Linie
            WHERE Datum > '2025-04-08 07:03:08'
        ) AS x
    ) AS dis

    UNION ALL
    /* ── MFV3_Halle204_Vorm_Prop_Druck_Linie ──────────────────── */
    SELECT
        'MFV3_Halle204_Vorm_Prop_Druck_Linie',
        tot.TotalRows,
        dis.DistinctRows,
        tot.TotalRows - dis.DistinctRows
    FROM (
        SELECT COUNT(*) AS TotalRows
        FROM dbo.MFV3_Halle204_Vorm_Prop_Druck_Linie
        WHERE Datum > '2025-04-10 04:53:42'
    ) AS tot
    CROSS JOIN (
        SELECT COUNT(*) AS DistinctRows
        FROM (
            SELECT DISTINCT ID_Code, Datum
            FROM dbo.MFV3_Halle204_Vorm_Prop_Druck_Linie
            WHERE Datum > '2025-04-10 04:53:42'
        ) AS x
    ) AS dis

    UNION ALL
    /* ── MOE6_Halle206_GH4_Linie ──────────────────────────────── */
    SELECT
        'MOE6_Halle206_GH4_Linie',
        tot.TotalRows,
        dis.DistinctRows,
        tot.TotalRows - dis.DistinctRows
    FROM (
        SELECT COUNT(*) AS TotalRows
        FROM dbo.MOE6_Halle206_GH4_Linie
        WHERE Datum > '2025-03-06 05:17:43'
    ) AS tot
    CROSS JOIN (
        SELECT COUNT(*) AS DistinctRows
        FROM (
            SELECT DISTINCT *
            FROM dbo.MOE6_Halle206_GH4_Linie
            WHERE Datum > '2025-03-06 05:17:43'
        ) AS x
    ) AS dis
) AS Summary
ORDER BY TableName;

SELECT  Tabelle, COUNT(*) AS rc
FROM    dbo.Auftraege_Fixed
GROUP BY Tabelle
ORDER BY rc DESC;   