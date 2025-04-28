CREATE OR ALTER PROCEDURE dbo.InsertVerschraubungPackage
      @datum               datetime2(0),
      @id_Code             varchar(20),
      @id_schrauber        int,
      @id_programm_version int,
      @id_material         int,
      @serialnummer        int        = NULL,
      @ergebnis            char(1),
      @letzte_Schritt      int        = NULL,
      @channel             varchar(2) = NULL,
      @gesamt_zeit         float      = NULL,
      /* JSON payloads */
      @json_Istwerte       nvarchar(max),
      @json_Graph          nvarchar(max)
AS
SET NOCOUNT ON;
DECLARE @id_verschraubung int;

BEGIN TRY
    BEGIN TRAN;

    /* 1. master row */
    INSERT dbo.Verschraubung(
           datum,id_Code,id_Schrauber,id_Programm_Version,
           id_Materialnummer,serialnummer,ergebnis,letzte_Schritt,
           channel,gesamt_zeit)
    VALUES (@datum,@id_Code,@id_schrauber,@id_programm_version,
            @id_material,@serialnummer,@ergebnis,@letzte_Schritt,
            @channel,@gesamt_zeit);

    SET @id_verschraubung = SCOPE_IDENTITY();

    /* 2. Istwerte (OPENJSON) */
    INSERT dbo.Programm_Version_Istwerte(id_Messung,id_Verschraubung,wert)
    SELECT j.id_Messung,
           @id_verschraubung,
           j.wert
      FROM OPENJSON(@json_Istwerte)
        WITH (id_Messung varchar(50), wert varchar(50)) AS j;

    /* 3. Graph values only on NOK */
    IF @ergebnis = 'N'
    BEGIN
        INSERT dbo.Graph_Werte(id_Messung,id_Verschraubung,werte)
        SELECT j.id_Messung,
               @id_verschraubung,
               j.werte
          FROM OPENJSON(@json_Graph)
            WITH (id_Messung varchar(50), werte nvarchar(max)) AS j;
    END

    COMMIT;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW;
END CATCH
GO
