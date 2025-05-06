SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    CHARACTER_MAXIMUM_LENGTH, 
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM 
    INFORMATION_SCHEMA.COLUMNS
WHERE 
    TABLE_NAME = 'Auftraege'
    AND TABLE_SCHEMA = 'dbo'
ORDER BY 
    ORDINAL_POSITION;


Result:

Tabelle	varchar	50	YES	NULL
Datum	datetime	NULL	YES	NULL
ID_Code	varchar	255	NO	NULL
Program_Nr	varchar	255	YES	NULL
Program_Name	varchar	255	YES	NULL
Materialnummer	varchar	255	YES	NULL
Serialnummer	varchar	255	YES	NULL
Schraubkanal	varchar	255	YES	NULL
Ergebnis	varchar	255	YES	NULL
N_Letzter_Schritt	int	NULL	YES	NULL
P_Letzter_Schritt	varchar	255	YES	NULL
Drehmoment_Nom	float	NULL	YES	NULL
Drehmoment_Ist	float	NULL	YES	NULL
Drehmoment_Min	float	NULL	YES	NULL
Drehmoment_Max	float	NULL	YES	NULL
Winkel_Nom	float	NULL	YES	NULL
Winkel_Ist	float	NULL	YES	NULL
Winkel_Min	float	NULL	YES	NULL
Winkel_Max	float	NULL	YES	NULL
Winkelwerte	varchar	-1	YES	NULL
Drehmomentwerte	varchar	-1	YES	NULL