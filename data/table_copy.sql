-- Create an archive table for dbo.Auftraege
CREATE TABLE dbo.Auftraege_Archive
(
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Tabelle VARCHAR(50) NOT NULL,
    Datum DATETIME NOT NULL,
    ID_Code VARCHAR(50) NULL,
    Program_Nr INT NULL,
    Program_Name VARCHAR(100) NULL,
    Schraubkanal VARCHAR(50) NULL,
    Ergebnis VARCHAR(20) NULL,
    N_Letzter_Schritt INT NULL,
    P_Letzter_Schritt VARCHAR(100) NULL,
    Drehmoment_Nom FLOAT NULL,
    Drehmoment_Ist FLOAT NULL,
    Winkelwerte TEXT NULL,
    Drehmomentwerte TEXT NULL,
);
GO


-- Create an index on the ID_Code column for faster lookups
CREATE INDEX IX_Auftraege_Archive_ID_Code ON dbo.Auftraege_Archive(ID_Code);
GO