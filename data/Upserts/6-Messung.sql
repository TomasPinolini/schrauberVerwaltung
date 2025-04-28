CREATE OR ALTER PROCEDURE dbo.UpsertMessung
    @name    varchar(10),
    @einheit varchar(5) = NULL,
    @id      int OUTPUT
AS
SET NOCOUNT ON;

SELECT @id = id
  FROM dbo.Messung
 WHERE name = @name;

IF @id IS NULL
BEGIN
    INSERT dbo.Messung(name,einheit) VALUES (@name,@einheit);
    SET @id = SCOPE_IDENTITY();
END
GO
