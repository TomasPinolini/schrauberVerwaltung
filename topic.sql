INSERT INTO dbo.Auftraege (
    Tabelle, Datum, ID_Code, Program_Nr, Program_Name,
    Materialnummer, Serialnummer, Schraubkanal, Ergebnis,
    N_Letzter_Schritt, P_Letzter_Schritt,
    Drehmoment_Nom, Drehmoment_Ist, Drehmoment_Min, Drehmoment_Max,
    Winkel_Nom, Winkel_Ist, Winkel_Min, Winkel_Max,
    Winkelwerte, Drehmomentwerte
  )
  VALUES
  (
    'MOE61_Halle206_GH4',
    '2025-03-17 09:35:03',
    'R901458664-1_001',
    3,
    'PGH4-3X',
    'R901458664',
    '001',
    1,
    'OK',
    8,
    '195Nm',
    195,
    195.4,
    160,
    230,
    50,
    30,
    1,
    120,
    '-1.1007,0.8231,-1.1007,0.2091,-1.1007,-2.965,-1.1007,-2.965,-1.1263,3.0942,-1.1263,3.0942,-1.1263,2.5742,-1.1263,2.5742,-1.1263,-0.5059,-1.1263,-0.5059,-1.1263,-0.5059,-1.1263,-0.5059,-1.1263,-0.5059,-1.1263,0.7272,-1.1263,-0.5999,-1.1263,-0.5999,-1.1263,0.6332,-1.1263,0.6332,-1.1263,-0.6939,-1.1263,-0.6939,-1.1007,0.5136,-1.1007,0.5136,-1.1007,1.7466,-1.1007,1.7466,-1.1007,-2.0415,-1.1007,-0.8085,-1.100...