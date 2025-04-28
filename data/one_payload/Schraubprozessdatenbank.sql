/* ─────────────────────────────
   1. Master / lookup tables
   ───────────────────────────── */

CREATE TABLE Materialnummer (
    id                INT IDENTITY(1,1) PRIMARY KEY,
    mt                VARCHAR(15)
);

CREATE TABLE Schrauber (
    id                INT IDENTITY(1,1) PRIMARY KEY,
    id_Code           VARCHAR(20),
    name              VARCHAR(25)
);

CREATE TABLE Programm (
    id                INT IDENTITY(1,1) PRIMARY KEY,
    programm_nr       INT,
    name              VARCHAR(25),
    seit_datum        DATE
);

CREATE TABLE Messung (
    id                INT IDENTITY(1,1) PRIMARY KEY,
    name              VARCHAR(10),
    einheit           VARCHAR(5)
);

CREATE TABLE Referenzwert_Typ (
    id                INT IDENTITY(1,1) PRIMARY KEY,
    name              NVARCHAR(100) NOT NULL
);

CREATE TABLE Editierbar_Attribut (
    id                INT IDENTITY(1,1) PRIMARY KEY,
    beschreibung      VARCHAR(50),
    state             CHAR(1),
    regex             VARCHAR(50),
    einsartig         CHAR(1),
    erforderlich      CHAR(1)
);

/* ─────────────────────────────
   2. Detail tables that depend on the look-ups
   ───────────────────────────── */

CREATE TABLE Programm_Version (
    id                INT IDENTITY(1,1) PRIMARY KEY,
    id_Programm       INT            NOT NULL,
    aktuell           CHAR(1),
    datum_erstellt    DATETIME2(0)   NOT NULL DEFAULT (SYSDATETIME()),
    letzte_cmd        INT,
    letzte_Schritt    INT,
    CONSTRAINT FK_ProgrammVersion_Programm
        FOREIGN KEY (id_Programm) REFERENCES Programm(id)
);

CREATE TABLE Verschraubung (
    id                    INT IDENTITY(1,1) PRIMARY KEY,
    datum                 DATE,
    id_Code               VARCHAR(20),
    id_Schrauber          INT           NOT NULL,
    id_Programm_Version   INT           NOT NULL,
    id_MaterialNummer     INT           NOT NULL,
    serialnummer          INT,
    ergebnis              CHAR(1),
    letzte_Schritt        INT,
    channel               VARCHAR(2),
    gesamt_zeit           FLOAT,

    CONSTRAINT FK_Verschraubung_Schrauber
        FOREIGN KEY (id_Schrauber)        REFERENCES Schrauber(id),
    CONSTRAINT FK_Verschraubung_ProgVers
        FOREIGN KEY (id_Programm_Version) REFERENCES Programm_Version(id),
    CONSTRAINT FK_Verschraubung_MatNr
        FOREIGN KEY (id_MaterialNummer)   REFERENCES Materialnummer(id)
);

CREATE TABLE Programm_Version_Sollwerte (
    id                    INT IDENTITY(1,1) PRIMARY KEY,
    id_programm_version   INT            NOT NULL,
    id_referenzwert_typ   INT            NOT NULL,
    id_Messung            INT            NOT NULL,
    wert                  DECIMAL(10,2)  NOT NULL,

    CONSTRAINT FK_Sollwerte_ProgVers
        FOREIGN KEY (id_programm_version) REFERENCES Programm_Version(id),
    CONSTRAINT FK_Sollwerte_RefTyp
        FOREIGN KEY (id_referenzwert_typ) REFERENCES Referenzwert_Typ(id),
    CONSTRAINT FK_Sollwerte_Messung
        FOREIGN KEY (id_Messung)          REFERENCES Messung(id)
);

CREATE TABLE Programm_Version_Istwerte (
    id                    INT IDENTITY(1,1) PRIMARY KEY,
    id_Messung            INT            NOT NULL,
    id_Verschraubung      INT            NOT NULL,
    wert                  VARCHAR(5),

    CONSTRAINT FK_Istwerte_Messung
        FOREIGN KEY (id_Messung)       REFERENCES Messung(id),
    CONSTRAINT FK_Istwerte_Verschr
        FOREIGN KEY (id_Verschraubung) REFERENCES Verschraubung(id)
);

CREATE TABLE Graph_Werte (
    id                    INT IDENTITY(1,1) PRIMARY KEY,
    id_Messung            INT            NOT NULL,
    id_Verschraubung      INT            NOT NULL,
    werte                 VARCHAR(MAX),

    CONSTRAINT FK_GraphWerte_Messung
        FOREIGN KEY (id_Messung)       REFERENCES Messung(id),
    CONSTRAINT FK_GraphWerte_Verschr
        FOREIGN KEY (id_Verschraubung) REFERENCES Verschraubung(id)
);

CREATE TABLE Attribut_Wert (
    id                    INT IDENTITY(1,1) PRIMARY KEY,
    id_Schrauber          INT            NOT NULL,
    id_Attribut           INT            NOT NULL,
    wert                  VARCHAR(MAX),
    aktuell               CHAR(1),

    CONSTRAINT FK_AttrWert_Schrauber
        FOREIGN KEY (id_Schrauber) REFERENCES Schrauber(id),
    CONSTRAINT FK_AttrWert_Attr
        FOREIGN KEY (id_Attribut)  REFERENCES Editierbar_Attribut(id)
);

CREATE TABLE Aktivitätsprotokoll (
    id                    INT IDENTITY(1,1) PRIMARY KEY,
    aktivitat             VARCHAR(10),          -- 'Erstellt' | 'Bearbeitet' | 'Gelöscht'
    datum                 DATETIME2(0)  NOT NULL DEFAULT (SYSDATETIME()),
    id_letzte_wert        INT           NOT NULL,
    id_neue_wert          INT           NOT NULL,

    CONSTRAINT FK_Protokoll_Alt
        FOREIGN KEY (id_letzte_wert) REFERENCES Attribut_Wert(id),
    CONSTRAINT FK_Protokoll_Neu
        FOREIGN KEY (id_neue_wert)   REFERENCES Attribut_Wert(id)
);
