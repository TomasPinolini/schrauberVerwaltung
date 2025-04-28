CREATE OR ALTER PROCEDURE dbo.UpsertReferenzwertTyp
    @name nvarchar(100),
    @id   int OUTPUT
AS
SET NOCOUNT ON;

SELECT @id = id
  FROM dbo.Referenzwert_Typ
 WHERE name = @name;

IF @id IS NULL
BEGIN
    INSERT dbo.Referenzwert_Typ(name) VALUES (@name);
    SET @id = SCOPE_IDENTITY();
END
GO
