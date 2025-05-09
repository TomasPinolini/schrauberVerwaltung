CREATE OR ALTER PROCEDURE dbo.UpsertSchrauber
    @tool_serial int,
    @id_Code     varchar(20) = NULL,
    @name        varchar(25) = NULL,
    @id          int OUTPUT
AS
SET NOCOUNT ON;

SELECT @id = id
  FROM dbo.Schrauber
 WHERE tool_serial = @tool_serial;

IF @id IS NULL
BEGIN
    INSERT dbo.Schrauber(id_Code,name,tool_serial)
    VALUES (@id_Code,@name,@tool_serial);

    SET @id = SCOPE_IDENTITY();
END
ELSE
BEGIN
    UPDATE dbo.Schrauber
       SET id_Code = ISNULL(@id_Code,id_Code),
           name    = ISNULL(@name   ,name)
     WHERE id = @id;
END
GO
