CREATE OR ALTER PROCEDURE dbo.UpsertMaterialnummer
      @mt  varchar(15),
      @id  int OUTPUT
AS
SET NOCOUNT ON;

SELECT @id = id
  FROM dbo.Materialnummer
 WHERE mt = @mt;

IF @id IS NULL
BEGIN
    INSERT dbo.Materialnummer(mt) VALUES (@mt);
    SET @id = SCOPE_IDENTITY();
END
GO
