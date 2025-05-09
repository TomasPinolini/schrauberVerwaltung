CREATE OR ALTER PROCEDURE dbo.GetOrCreate_ProgVersion
    @id_Programm    int,
    @prog_date      datetime,      -- payload “prg date”
    @aktuell        char(1) = 'Y',
    @letzte_cmd     int     = NULL,
    @letzte_Schritt int     = NULL,
    @id             int OUTPUT
AS
SET NOCOUNT ON;

SELECT @id = id
  FROM dbo.Programm_Version
 WHERE id_Programm   = @id_Programm
   AND datum_erstellt = @prog_date;

IF @id IS NULL
BEGIN
    UPDATE dbo.Programm_Version
       SET aktuell = 'N'
     WHERE id_Programm = @id_Programm;

    INSERT dbo.Programm_Version(
           id_Programm,aktuell,datum_erstellt,letzte_cmd,letzte_Schritt)
    VALUES (@id_Programm,@aktuell,@prog_date,@letzte_cmd,@letzte_Schritt);

    SET @id = SCOPE_IDENTITY();
END
GO
