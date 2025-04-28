CREATE OR ALTER PROCEDURE dbo.UpsertProgramm
    @id_Schrauber int,
    @programm_nr  int,
    @name         varchar(25) = NULL,
    @seit_datum   date         = NULL,
    @id           int OUTPUT
AS
SET NOCOUNT ON;

SELECT @id = id
  FROM dbo.Programm
 WHERE id_Schrauber = @id_Schrauber
   AND programm_nr  = @programm_nr;

IF @id IS NULL
BEGIN
    INSERT dbo.Programm(id_Schrauber,programm_nr,name,seit_datum)
    VALUES (@id_Schrauber,@programm_nr,@name,@seit_datum);

    SET @id = SCOPE_IDENTITY();
END
ELSE
BEGIN
    UPDATE dbo.Programm
       SET name       = ISNULL(@name      ,name),
           seit_datum = ISNULL(@seit_datum,seit_datum)
     WHERE id = @id;
END
GO
