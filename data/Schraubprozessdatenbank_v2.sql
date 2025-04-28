
/* ================================================================
   Schraubprozessdatenbank  – Version 2
   Clean, self‑contained schema (SQL Server) – generated 2025‑04‑28
   ================================================================ */

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

/* ─────────────────────────────
   1.  Master / lookup tables
   ───────────────────────────── */

CREATE TABLE dbo.Materialnummer (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    mt         VARCHAR(15) NOT NULL,
    CONSTRAINT UQ_Materialnummer_mt UNIQUE (mt)
);

CREATE TABLE dbo.Schrauber (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    id_Code      VARCHAR(20),
    name         VARCHAR(25),
    tool_serial  INT UNIQUE          -- natural key
);

CREATE TABLE dbo.Programm (
    id             INT IDENTITY(1,1) PRIMARY KEY,
    id_Schrauber   INT      NOT NULL,   -- NEW: program belongs to one screwdriver
    programm_nr    INT      NOT NULL,
    name           VARCHAR(25),
    seit_datum     DATE,
    CONSTRAINT FK_Programm_Schrauber
        FOREIGN KEY (id_Schrauber) REFERENCES dbo.Schrauber(id),
    CONSTRAINT UX_Programm_SchrauberNr
        UNIQUE (id_Schrauber, programm_nr)
);

CREATE TABLE dbo.Messung (
    id       INT IDENTITY(1,1) PRIMARY KEY,
    name     VARCHAR(10) NOT NULL,
    einheit  VARCHAR(5),
    CONSTRAINT UQ_Messung_name UNIQUE (name)
);

CREATE TABLE dbo.Referenzwert_Typ (
    id   INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    CONSTRAINT UQ_ReferenzwertTyp_name UNIQUE (name)
);

CREATE TABLE dbo.Editierbar_Attribut (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    beschreibung VARCHAR(50) NOT NULL,
    state        CHAR(1),
    regex        VARCHAR(50),
    einsartig    CHAR(1),
    erforderlich CHAR(1)
);

/* ─────────────────────────────
   2.  Detail & versioning tables
   ───────────────────────────── */

CREATE TABLE dbo.Programm_Version (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    id_Programm      INT          NOT NULL,
    aktuell          CHAR(1)      DEFAULT ('Y'),
    datum_erstellt   DATETIME2(0) NOT NULL DEFAULT (SYSDATETIME()),
    letzte_cmd       INT,
    letzte_Schritt   INT,
    CONSTRAINT FK_ProgVer_Programm
        FOREIGN KEY (id_Programm) REFERENCES dbo.Programm(id)
);

CREATE TABLE dbo.Verschraubung (
    id                   INT IDENTITY(1,1) PRIMARY KEY,
    datum                DATETIME2(0) NOT NULL,
    id_Code              VARCHAR(20),
    id_Schrauber         INT           NOT NULL,
    id_Programm_Version  INT           NOT NULL,
    id_Materialnummer    INT           NOT NULL,
    serialnummer         INT,
    ergebnis             CHAR(1),
    letzte_Schritt       INT,
    channel              VARCHAR(2),
    gesamt_zeit          FLOAT,

    CONSTRAINT FK_Verschraubung_Schrauber
        FOREIGN KEY (id_Schrauber)         REFERENCES dbo.Schrauber(id),
    CONSTRAINT FK_Verschraubung_ProgVer
        FOREIGN KEY (id_Programm_Version)  REFERENCES dbo.Programm_Version(id),
    CONSTRAINT FK_Verschraubung_MatNr
        FOREIGN KEY (id_Materialnummer)    REFERENCES dbo.Materialnummer(id)
);

-- optional anti‑duplication safeguard
CREATE UNIQUE INDEX UX_Verschraubung_Event
    ON dbo.Verschraubung(datum, id_Schrauber, id_Programm_Version, serialnummer, letzte_Schritt);

CREATE TABLE dbo.Programm_Version_Sollwerte (
    id                    INT IDENTITY(1,1) PRIMARY KEY,
    id_programm_version   INT          NOT NULL,
    id_referenzwert_typ   INT          NOT NULL,
    id_Messung            INT          NOT NULL,
    wert                  DECIMAL(10,2) NOT NULL,

    CONSTRAINT FK_Soll_ProgVer
        FOREIGN KEY (id_programm_version) REFERENCES dbo.Programm_Version(id),
    CONSTRAINT FK_Soll_RefTyp
        FOREIGN KEY (id_referenzwert_typ) REFERENCES dbo.Referenzwert_Typ(id),
    CONSTRAINT FK_Soll_Messung
        FOREIGN KEY (id_Messung)          REFERENCES dbo.Messung(id)
);

CREATE TABLE dbo.Programm_Version_Istwerte (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    id_Messung       INT          NOT NULL,
    id_Verschraubung INT          NOT NULL,
    wert             VARCHAR(5),

    CONSTRAINT FK_Ist_Messung
        FOREIGN KEY (id_Messung)       REFERENCES dbo.Messung(id),
    CONSTRAINT FK_Ist_Verschr
        FOREIGN KEY (id_Verschraubung) REFERENCES dbo.Verschraubung(id)
);

CREATE TABLE dbo.Graph_Werte (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    id_Messung       INT          NOT NULL,
    id_Verschraubung INT          NOT NULL,
    werte            VARCHAR(MAX),

    CONSTRAINT FK_Graph_Messung
        FOREIGN KEY (id_Messung)       REFERENCES dbo.Messung(id),
    CONSTRAINT FK_Graph_Verschr
        FOREIGN KEY (id_Verschraubung) REFERENCES dbo.Verschraubung(id)
);

CREATE TABLE dbo.Attribut_Wert (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    id_Schrauber  INT          NOT NULL,
    id_Attribut   INT          NOT NULL,
    wert          VARCHAR(MAX),
    aktuell       CHAR(1),

    CONSTRAINT FK_AttrWert_Schrauber
        FOREIGN KEY (id_Schrauber) REFERENCES dbo.Schrauber(id),
    CONSTRAINT FK_AttrWert_Attr
        FOREIGN KEY (id_Attribut)  REFERENCES dbo.Editierbar_Attribut(id)
);

CREATE TABLE dbo.Aktivitätsprotokoll (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    aktivitat       VARCHAR(10),       -- 'Erstellt' | 'Bearbeitet' | 'Gelöscht'
    datum           DATETIME2(0) NOT NULL DEFAULT (SYSDATETIME()),
    id_letzte_wert  INT         NOT NULL,
    id_neue_wert    INT         NOT NULL,

    CONSTRAINT FK_Protokoll_Alt
        FOREIGN KEY (id_letzte_wert) REFERENCES dbo.Attribut_Wert(id),
    CONSTRAINT FK_Protokoll_Neu
        FOREIGN KEY (id_neue_wert)   REFERENCES dbo.Attribut_Wert(id)
);

INSERT INTO dbo.Editierbar_Attribut (beschreibung,state,regex,einsartig,erforderlich)
SELECT v.* FROM (VALUES
  ('ip0','A',NULL,'Y','N'),
  ('mac0','A',NULL,'Y','N'),
  ('hardware','A',NULL,'Y','N')
) v(beschreibung,state,regex,einsartig,erforderlich)
WHERE NOT EXISTS (SELECT 1
                    FROM dbo.Editierbar_Attribut e
                   WHERE e.beschreibung = v.beschreibung);


COMMIT TRANSACTION;
GO
