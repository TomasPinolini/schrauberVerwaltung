CREATE OR ALTER PROCEDURE dbo.UpsertAllLookups
      /* Material */
      @mt               varchar(15),
      /* Screwdriver core */
      @tool_serial      int,
      @id_Code          varchar(20) = NULL,
      @sch_name         varchar(25) = NULL,
      /* Flexible attrs */
      @ip0              varchar(15) = NULL,
      @mac0             varchar(17) = NULL,
      @hardware         varchar(20) = NULL,
      /* Program + version */
      @programm_nr      int,
      @programm_name    varchar(25) = NULL,
      @seit_datum       date         = NULL,
      @prog_date        datetime,
      /* OUTPUTs */
      @id_material          int OUTPUT,
      @id_schrauber         int OUTPUT,
      @id_programm          int OUTPUT,
      @id_programm_version  int OUTPUT
AS
SET NOCOUNT ON;
BEGIN TRY
    BEGIN TRAN;

    EXEC dbo.UpsertMaterialnummer
         @mt = @mt,
         @id = @id_material OUTPUT;

    EXEC dbo.UpsertSchrauber
         @tool_serial = @tool_serial,
         @id_Code     = @id_Code,
         @name        = @sch_name,
         @id          = @id_schrauber OUTPUT;

    EXEC dbo.UpsertProgramm
         @id_Schrauber = @id_schrauber,
         @programm_nr  = @programm_nr,
         @name         = @programm_name,
         @seit_datum   = @seit_datum,
         @id           = @id_programm OUTPUT;

    EXEC dbo.GetOrCreate_ProgVersion
         @id_Programm = @id_programm,
         @prog_date   = @prog_date,
         @id          = @id_programm_version OUTPUT;

    /* Flexible attributes (skip NULL/empty) */
    IF ISNULL(LTRIM(RTRIM(@ip0)), '') <> ''
        EXEC dbo.UpsertAttributWert @id_schrauber, 'ip0', @ip0;

    IF ISNULL(LTRIM(RTRIM(@mac0)), '') <> ''
        EXEC dbo.UpsertAttributWert @id_schrauber, 'mac0', @mac0;

    IF ISNULL(LTRIM(RTRIM(@hardware)), '') <> ''
        EXEC dbo.UpsertAttributWert @id_schrauber, 'hardware', @hardware;

    COMMIT;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW;
END CATCH
GO
