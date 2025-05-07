-- SQL query to fix incorrectly decoded angle and torque values in the database
-- This script corrects values for MOE61_Halle206_GH4 controller data

-- Create a temporary table to store the fixed values
CREATE TABLE #TempFixedValues (
    ID INT PRIMARY KEY,
    FixedAngleValues NVARCHAR(MAX),
    FixedTorqueValues NVARCHAR(MAX)
);

-- Function to decode base64 to correct values
-- Note: This would typically be done in a stored procedure or external script
-- For this SQL script, we'll need to process each row individually

-- Step 1: Find all affected records (from MOE61_Halle206_GH4 controller)
DECLARE @controller_type NVARCHAR(100) = 'MOE61_Halle206_GH4';

-- Step 2: Create a cursor to process each row
DECLARE @id INT;
DECLARE @angle_b64 NVARCHAR(MAX);
DECLARE @torque_b64 NVARCHAR(MAX);

-- Create a cursor to iterate through the records
DECLARE fix_cursor CURSOR FOR
SELECT id, Winkelwerte, Drehmomentwerte 
FROM dbo.Auftraege
WHERE Tabelle = @controller_type
  AND Winkelwerte IS NOT NULL
  AND Drehmomentwerte IS NOT NULL;

OPEN fix_cursor;
FETCH NEXT FROM fix_cursor INTO @id, @angle_b64, @torque_b64;

-- For each record, we would normally decode and fix the values
-- Since we can't do the actual binary decoding in T-SQL, we'll need to use an external process
-- Here's a placeholder for what the process would look like:

WHILE @@FETCH_STATUS = 0
BEGIN
    -- In a real implementation, you would call a CLR procedure or external script here
    -- For now, we'll just mark these records for external processing
    INSERT INTO #TempFixedValues (ID, FixedAngleValues, FixedTorqueValues)
    VALUES (@id, 'NEEDS_FIXING', 'NEEDS_FIXING');
    
    FETCH NEXT FROM fix_cursor INTO @id, @angle_b64, @torque_b64;
END

CLOSE fix_cursor;
DEALLOCATE fix_cursor;

-- Step 3: Output the IDs that need fixing for external processing
SELECT ID FROM #TempFixedValues;

-- Step 4: After external processing, update the database
-- This would be run after the external script has processed the values
/*
UPDATE dbo.Auftraege
SET Winkelwerte = t.FixedAngleValues,
    Drehmomentwerte = t.FixedTorqueValues
FROM dbo.Auftraege a
JOIN #TempFixedValues t ON a.id = t.ID;
*/

-- Clean up
DROP TABLE #TempFixedValues;

-- IMPORTANT NOTE:
-- Since SQL Server cannot directly decode base64 and process binary data in the way needed,
-- the recommended approach is:
-- 1. Use this script to identify affected records
-- 2. Export those records to a file
-- 3. Process them with a Python script (similar to x.py) to fix the values
-- 4. Import the fixed values back to the database

-- Alternative approach: Create a Node.js script that:
-- 1. Queries the database for affected records
-- 2. Processes each record using the corrected decoding logic
-- 3. Updates the database with fixed values

-- Example Node.js pseudo-code:
/*
const sql = require('mssql');
const config = { ... }; // Database connection config

async function fixValues() {
  try {
    await sql.connect(config);
    
    // Get affected records
    const result = await sql.query`
      SELECT id, Winkelwerte, Drehmomentwerte 
      FROM dbo.Auftraege
      WHERE Tabelle = 'MOE61_Halle206_GH4'
        AND Winkelwerte IS NOT NULL
        AND Drehmomentwerte IS NOT NULL
    `;
    
    for (const record of result.recordset) {
      // Decode using correct method (16-bit integers)
      const fixedAngleValues = decodeCorrectly(record.Winkelwerte, 10000);
      const fixedTorqueValues = decodeCorrectly(record.Drehmomentwerte, 100000);
      
      // Update the database
      await sql.query`
        UPDATE dbo.Auftraege
        SET Winkelwerte = ${fixedAngleValues.join(',')},
            Drehmomentwerte = ${fixedTorqueValues.join(',')}
        WHERE id = ${record.id}
      `;
    }
    
    console.log('All values fixed successfully');
  } catch (err) {
    console.error('Error fixing values:', err);
  } finally {
    sql.close();
  }
}

function decodeCorrectly(b64Data, scale) {
  const buf = Buffer.from(b64Data, 'base64');
  const values = [];
  
  for (let i = 0; i < buf.length; i += 2) {
    values.push(buf.readInt16LE(i) / scale);
  }
  
  return values;
}

fixValues();
*/