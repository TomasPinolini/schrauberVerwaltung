/*───────────────────────────────────────────────────────────────
  Lookup tables
───────────────────────────────────────────────────────────────*/
CREATE TABLE dbo.Materialnummer
(
    id  INT          IDENTITY(1,1) PRIMARY KEY,
    mt  VARCHAR(15)  NOT NULL UNIQUE
);
GO

CREATE TABLE dbo.Schrauber
(
    id          INT          IDENTITY(1,1) PRIMARY KEY,
    id_Code     VARCHAR(20)  NULL,
    name        VARCHAR(25)  NULL,
    tool_serial INT          NOT NULL UNIQUE   -- business key
);
GO

CREATE TABLE dbo.Programm
(
    id            INT          IDENTITY(1,1) PRIMARY KEY,
    id_Schrauber  INT          NOT NULL,
    programm_nr   INT          NOT NULL,
    name          VARCHAR(25)  NULL,
    seit_datum    DATE         NULL,

    CONSTRAINT FK_Programm_Schrauber
        FOREIGN KEY (id_Schrauber) REFERENCES dbo.Schrauber(id)
);
GO

/* unique per screwdriver + program number */
CREATE UNIQUE INDEX UX_Programm_SchrauberNr
ON dbo.Programm(id_Schrauber, programm_nr);
GO

CREATE TABLE dbo.Messung
(
    id      INT          IDENTITY(1,1) PRIMARY KEY,
    name    VARCHAR(10)  NOT NULL UNIQUE,
    einheit VARCHAR(5)   NULL
);
GO

CREATE TABLE dbo.Referenzwert_Typ
(
    id   INT            IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100)  NOT NULL UNIQUE
);
GO

CREATE TABLE dbo.Editierbar_Attribut
(
    id           INT          IDENTITY(1,1) PRIMARY KEY,
    beschreibung VARCHAR(50)  NOT NULL,
    state        CHAR(1)      NULL,
    regex        VARCHAR(50)  NULL,
    einsartig    CHAR(1)      NULL,
    erforderlich CHAR(1)      NULL
);
GO

/*───────────────────────────────────────────────────────────────
  Versioning tables
───────────────────────────────────────────────────────────────*/
CREATE TABLE dbo.Programm_Version
(
    id             INT          IDENTITY(1,1) PRIMARY KEY,
    id_Programm    INT          NOT NULL,
    aktuell        CHAR(1)      NULL,
    datum_erstellt DATETIME     NULL,
    letzte_cmd     INT          NULL,
    letzte_Schritt INT          NULL,

    CONSTRAINT FK_ProgVer_Programm
        FOREIGN KEY (id_Programm) REFERENCES dbo.Programm(id)
);
GO

CREATE TABLE dbo.Programm_Version_Sollwerte
(
    id                  INT           IDENTITY(1,1) PRIMARY KEY,
    id_programm_version INT           NOT NULL,
    id_referenzwert_typ INT           NOT NULL,
    id_Messung          INT           NOT NULL,
    wert                DECIMAL(10,2) NOT NULL,

    CONSTRAINT FK_Sollwerte_ProgVer
        FOREIGN KEY (id_programm_version) REFERENCES dbo.Programm_Version(id),
    CONSTRAINT FK_Sollwerte_RefTyp
        FOREIGN KEY (id_referenzwert_typ) REFERENCES dbo.Referenzwert_Typ(id),
    CONSTRAINT FK_Sollwerte_Messung
        FOREIGN KEY (id_Messung)          REFERENCES dbo.Messung(id)
);
GO

/*───────────────────────────────────────────────────────────────
  Runtime / event tables
───────────────────────────────────────────────────────────────*/
CREATE TABLE dbo.Verschraubung
(
    id                  INT          IDENTITY(1,1) PRIMARY KEY,
    datum               DATETIME     NULL,
    id_Code             VARCHAR(20)  NULL,
    id_Schrauber        INT          NOT NULL,
    id_Programm_Version INT          NOT NULL,
    id_Materialnummer   INT          NOT NULL,
    serialnummer        INT          NULL,
    ergebnis            CHAR(1)      NULL,
    letzte_Schritt      INT          NULL,
    channel             VARCHAR(2)   NULL,
    gesamt_zeit         FLOAT        NULL,

    CONSTRAINT FK_Versch_Schrauber
        FOREIGN KEY (id_Schrauber)        REFERENCES dbo.Schrauber(id),
    CONSTRAINT FK_Versch_ProgVer
        FOREIGN KEY (id_Programm_Version) REFERENCES dbo.Programm_Version(id),
    CONSTRAINT FK_Versch_Material
        FOREIGN KEY (id_Materialnummer)   REFERENCES dbo.Materialnummer(id)
);
GO

CREATE TABLE dbo.Programm_Version_Istwerte
(
    id               INT          IDENTITY(1,1) PRIMARY KEY,
    id_Messung       INT          NOT NULL,
    id_Verschraubung INT          NOT NULL,
    wert             VARCHAR(5)   NULL,

    CONSTRAINT FK_Istwerte_Messung
        FOREIGN KEY (id_Messung)       REFERENCES dbo.Messung(id),
    CONSTRAINT FK_Istwerte_Versch
        FOREIGN KEY (id_Verschraubung) REFERENCES dbo.Verschraubung(id)
);
GO

CREATE TABLE dbo.Graph_Werte
(
    id               INT           IDENTITY(1,1) PRIMARY KEY,
    id_Messung       INT           NOT NULL,
    id_Verschraubung INT           NOT NULL,
    werte            VARCHAR(MAX)  NULL,

    CONSTRAINT FK_Graph_Messung
        FOREIGN KEY (id_Messung)       REFERENCES dbo.Messung(id),
    CONSTRAINT FK_Graph_Versch
        FOREIGN KEY (id_Verschraubung) REFERENCES dbo.Verschraubung(id)
);
GO

/*───────────────────────────────────────────────────────────────
  Attribute & audit tables
───────────────────────────────────────────────────────────────*/
CREATE TABLE dbo.Attribut_Wert
(
    id           INT          IDENTITY(1,1) PRIMARY KEY,
    id_Schrauber INT          NOT NULL,
    id_Attribut  INT          NOT NULL,
    wert         VARCHAR(MAX) NULL,
    aktuell      CHAR(1)      NULL,

    CONSTRAINT FK_AttrWert_Schrauber
        FOREIGN KEY (id_Schrauber) REFERENCES dbo.Schrauber(id),
    CONSTRAINT FK_AttrWert_Attribut
        FOREIGN KEY (id_Attribut)  REFERENCES dbo.Editierbar_Attribut(id)
);
GO

CREATE TABLE dbo.Aktivitätsprotokoll
(
    id             INT          IDENTITY(1,1) PRIMARY KEY,
    aktivitat      VARCHAR(10)  NULL,       -- Erstellt | Bearbeitet | Gelöscht
    datum          DATETIME     NULL,
    id_letzte_wert INT          NOT NULL,
    id_neue_wert   INT          NOT NULL,

    CONSTRAINT FK_Protokoll_Alt
        FOREIGN KEY (id_letzte_wert) REFERENCES dbo.Attribut_Wert(id),
    CONSTRAINT FK_Protokoll_Neu
        FOREIGN KEY (id_neue_wert)   REFERENCES dbo.Attribut_Wert(id)
);
GO
