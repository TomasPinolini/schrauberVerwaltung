CREATE OR ALTER PROCEDURE dbo.UpsertAttributWert
      @id_Schrauber int,
      @attr_name    varchar(50),
      @wert         varchar(max)
AS
SET NOCOUNT ON;

DECLARE @id_Attribut int;

SELECT @id_Attribut = id
  FROM dbo.Editierbar_Attribut
 WHERE beschreibung = @attr_name;

IF @id_Attribut IS NULL
    THROW 50001, 'Attribut type not found', 1;

UPDATE dbo.Attribut_Wert
   SET aktuell = 'N'
 WHERE id_Schrauber = @id_Schrauber
   AND id_Attribut  = @id_Attribut
   AND aktuell      = 'Y';

INSERT dbo.Attribut_Wert(id_Schrauber,id_Attribut,wert,aktuell)
VALUES (@id_Schrauber,@id_Attribut,@wert,'Y');
GO
