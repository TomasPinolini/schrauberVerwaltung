// ────── Lookup tables ──────────────────────────────────────────────
Table Materialnummer {
  id int [pk, increment]
  mt varchar(15) [not null, unique]      // business key
}

Table Screwdriver {
  id          int         [pk, increment]
  id_Code     varchar(20)
  name        varchar(25)
  tool_serial int         [unique]       // natural key
}

Table Program {
  id            int         [pk, increment]
  id_Screwdriver  int         [not null, ref: > Screwdriver.id]
  program_nr   int         [not null]
  name          varchar(25)
  since_date    date

  Indexes {
    (id_Screwdriver, program_nr) [unique, name:'UX_Program_ScrewdriverNr']
  }
}

Table Meassurement {
  id      int         [pk, increment]
  name    varchar(10) [not null, unique]
  unit varchar(5)
}

Table Reference_Value_Type {
  id   int            [pk, increment]
  name nvarchar(100)  [not null, unique] // Max - Min - Nominal
}

Table Editable_attribute {
  id           int         [pk, increment]
  description varchar(50) [not null]
  state        char
  regex        varchar(50)
  unique    char
  required char
}

// ────── Versioning tables ─────────────────────────────────────────
Table Program_Version {
  id             int          [pk, increment]
  id_Program    int          [not null, ref: > Program.id]
  current        char
  created_date datetime
  name_last_step     int
  number_last_step int
  sw_version     varchar(25)
}

Table Program_Version_Expected_Value {
  id                    int             [pk, increment]
  id_Program_version   int [not null, ref: > Program_Version.id]
  id_Reference_Value_Type   int [not null, ref: > Reference_Value_Type.id]
  id_Meassurement            int [not null, ref: > Meassurement.id]
  value                  decimal(10,2)   [not null]
}

// ────── Runtime / event tables ────────────────────────────────────
Table Screwing_Process {
  id                    int         [pk, increment]
  datum                 datetime
  id_Code               varchar(20)
  id_Screwdriver          int         [not null, ref: > Screwdriver.id]
  id_Program_Version   int         [not null, ref: > Program_Version.id]
  id_Materialnummer     int         [not null, ref: > Materialnummer.id]
  serialnummer          int
  result              char
  number_last_step        int
  channel               varchar(2)
  total_time           float

}

Table Program_Version_Actual_Value {
  id               int [pk, increment]
  id_Meassurement  int [not null, ref: > Meassurement.id]
  id_Screwing_Process int [not null, ref: > Screwing_Process.id]
  value             varchar(5)
}

Table Graph_valuee {
  id               int [pk, increment]
  id_Meassurement       int [not null, ref: > Meassurement.id]
  Screwing_Process int [not null, ref: > Screwing_Process.id]
  valuee           varchar(max)
}

// ────── Attribute & audit tables ─────────────────────────────────
Table Attribute_Value {
  id           int [pk, increment]
  id_Screwdriver int [not null, ref: > Screwdriver.id]
  id_Attribute  int [not null, ref: > Editierbar_Attribute.id]
  value         varchar(max)
  âctual      char
}

Table Activity_Log {
  id             int       [pk, increment]
  activity      varchar(10) // Erstellt | Bearbeitet | Gelöscht
  date          datetime
  id_previous_value int [not null, ref: > Attribute_Value.id]
  id_new_wert   int [not null, ref: > Attribute_Value.id]
}
